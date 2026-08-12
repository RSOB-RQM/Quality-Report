// =============================================================================
// Dashboard Data API Route — GET /api/dashboard
// =============================================================================

import { createDataAccess } from '../../../data/data-access';
import {
  computeWeeklySummary,
  computeMonthlySummary,
  computeErrorBreakdown,
  computeDisruptionBreakdown,
  computeAppealSummary,
  computeCommonFindings,
  filterErrorRecords,
  toErrorDetailRecord,
  sortErrorLogDesc,
  computeDefectRate,
} from '../../../services/aggregation';
import { highlightGuidance } from '../../../services/guidance';
import type { AuditRecord } from '../../../models/audit-types';
import type {
  AssociateSummaryRow,
  WeekSummaryTableRow,
  RepeatedDefaulter,
  CommonFindingsResult,
} from '../../../models/dashboard-types';

// ---------------------------------------------------------------------------
// Helpers for new computed fields
// ---------------------------------------------------------------------------

function countRecordErrors(r: AuditRecord): number {
  let c = 0;
  if (r.adm === 'No') c++;
  if (r.ra === 'No') c++;
  if (r.rrc === 'No') c++;
  if (r.acc === 'No') c++;
  if (r.rv === 'No') c++;
  return c;
}

const FINDING_ATTRS: { key: keyof AuditRecord; findingKey: keyof AuditRecord; label: string }[] = [
  { key: 'adm', findingKey: 'admFinding', label: 'ADM' },
  { key: 'ra', findingKey: 'raFinding', label: 'RA' },
  { key: 'rrc', findingKey: 'rrcFinding', label: 'RRC' },
  { key: 'acc', findingKey: 'accFinding', label: 'ACC' },
  { key: 'rv', findingKey: 'rvFinding', label: 'RV' },
];

function buildAssociateSummaries(records: AuditRecord[]): AssociateSummaryRow[] {
  const map = new Map<string, {
    audits: number; defects: number; errors: number;
    attrCounts: Record<string, number>;
    weekDefects: Map<number, number>;
    findingCounts: Map<string, { attribute: string; finding: string; count: number }>;
  }>();

  for (const r of records) {
    let entry = map.get(r.associateLogin);
    if (!entry) {
      entry = { audits: 0, defects: 0, errors: 0, attrCounts: {}, weekDefects: new Map(), findingCounts: new Map() };
      map.set(r.associateLogin, entry);
    }
    entry.audits++;
    if (r.defectFlag === true) {
      entry.defects++;
      entry.weekDefects.set(r.transactionWeek, (entry.weekDefects.get(r.transactionWeek) ?? 0) + 1);
    }
    const errs = countRecordErrors(r);
    entry.errors += errs;
    for (const attr of FINDING_ATTRS) {
      if (r[attr.key] === 'No') {
        entry.attrCounts[attr.label] = (entry.attrCounts[attr.label] ?? 0) + 1;
        const findingText = r[attr.findingKey] as string;
        if (findingText && findingText.trim() !== '') {
          const fKey = `${attr.label}||${findingText}`;
          const existing = entry.findingCounts.get(fKey);
          if (existing) {
            existing.count++;
          } else {
            entry.findingCounts.set(fKey, { attribute: attr.label, finding: findingText, count: 1 });
          }
        }
      }
    }
  }

  const result: AssociateSummaryRow[] = [];
  for (const [login, d] of map) {
    const weeks = Array.from(d.weekDefects.keys()).sort((a, b) => a - b);
    let trend: 'improving' | 'regressing' | 'stable' = 'stable';
    if (weeks.length >= 2) {
      const last = d.weekDefects.get(weeks[weeks.length - 1]) ?? 0;
      const prev = d.weekDefects.get(weeks[weeks.length - 2]) ?? 0;
      if (last < prev) trend = 'improving';
      else if (last > prev) trend = 'regressing';
    }
    const topFindings = Array.from(d.findingCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    result.push({
      associateLogin: login,
      totalAudits: d.audits,
      totalDefects: d.defects,
      defectRate: computeDefectRate(d.defects, d.audits),
      totalErrors: d.errors,
      errorAttributes: Object.entries(d.attrCounts)
        .map(([attribute, count]) => ({ attribute, count }))
        .sort((a, b) => b.count - a.count),
      trend,
      topFindings,
    });
  }
  return result.sort((a, b) => b.defectRate - a.defectRate);
}

function buildWeekSummaryTable(records: AuditRecord[]): WeekSummaryTableRow[] {
  const weekMap = new Map<number, { audited: number; defects: number }>();
  for (const r of records) {
    let entry = weekMap.get(r.transactionWeek);
    if (!entry) {
      entry = { audited: 0, defects: 0 };
      weekMap.set(r.transactionWeek, entry);
    }
    entry.audited++;
    if (r.defectFlag === true) entry.defects++;
  }

  const weeks = Array.from(weekMap.keys()).sort((a, b) => a - b);
  const totalAuditsRow: WeekSummaryTableRow = { metric: 'Total Audits', values: [] };
  const auditsWithDefectsRow: WeekSummaryTableRow = { metric: 'Audits with Defects', values: [] };
  const defectRateRow: WeekSummaryTableRow = { metric: 'Defect rate%', values: [] };

  for (const week of weeks) {
    const d = weekMap.get(week)!;
    totalAuditsRow.values.push({ week, value: d.audited });
    auditsWithDefectsRow.values.push({ week, value: d.defects });
    defectRateRow.values.push({ week, value: `${computeDefectRate(d.defects, d.audited)}%` });
  }

  return [totalAuditsRow, auditsWithDefectsRow, defectRateRow];
}

/**
 * Builds repeated defaulters using rolling last 5 weeks from ALL scoped records.
 * An associate is a repeated defaulter if they had defects in 3+ of the last 5 weeks.
 */
function buildRepeatedDefaulters(allScopedRecords: AuditRecord[]): RepeatedDefaulter[] {
  const allWeeks = [...new Set(allScopedRecords.map((r) => r.transactionWeek))].sort((a, b) => a - b);
  const last5Weeks = new Set(allWeeks.slice(-5));

  const recentRecords = allScopedRecords.filter((r) => last5Weeks.has(r.transactionWeek));

  const map = new Map<string, Map<number, number>>();
  for (const r of recentRecords) {
    if (r.defectFlag !== true) continue;
    if (!map.has(r.associateLogin)) map.set(r.associateLogin, new Map());
    const weekMap = map.get(r.associateLogin)!;
    weekMap.set(r.transactionWeek, (weekMap.get(r.transactionWeek) ?? 0) + 1);
  }

  const result: RepeatedDefaulter[] = [];
  for (const [login, weekMap] of map) {
    if (weekMap.size >= 3) {
      const weeklyDefects = Array.from(weekMap.entries())
        .map(([week, defectCount]) => ({ week, defectCount }))
        .sort((a, b) => a.week - b.week);
      result.push({ associateLogin: login, weeklyDefects, totalWeeksWithDefects: weekMap.size });
    }
  }
  return result.sort((a, b) => b.totalWeeksWithDefects - a.totalWeeksWithDefects);
}

function filterByWeeks(records: AuditRecord[], weeks: number[]): AuditRecord[] {
  if (weeks.length === 0) return records;
  const set = new Set(weeks);
  return records.filter((r) => set.has(r.transactionWeek));
}

function filterByRegion(records: AuditRecord[], region: string): AuditRecord[] {
  if (!region) return records;
  return records.filter((r) => r.region === region);
}

function filterByMonth(records: AuditRecord[], month: number): AuditRecord[] {
  return records.filter((r) => {
    const parts = r.transactionDate.split('-');
    return parseInt(parts[1], 10) === month;
  });
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  try {
    // 1. Default user (auth bypassed for Amplify deployment)
    const user = { login: 'mpuranik', role: 'admin' as const };

    // 2. Fetch all records (no access control filter — admin sees everything)
    const dataAccess = createDataAccess();
    const scopedRecords = await dataAccess.getRecords();

    // 3. Parse optional week/month/team filters from query params
    const url = new URL(request.url);
    const weeksParam = url.searchParams.get('weeks');
    const monthParam = url.searchParams.get('month');
    const teamFilterParam = url.searchParams.get('teamFilter');
    const regionParam = url.searchParams.get('region') ?? '';

    // If admin requests teamFilter=true, filter by supervisorLogin
    let filteredRecords = scopedRecords;
    if (teamFilterParam === 'true') {
      filteredRecords = scopedRecords.filter((r) => r.supervisorLogin === user.login);
    }
    filteredRecords = filterByRegion(filteredRecords, regionParam);
    if (weeksParam) {
      const weeks = weeksParam.split(',').map((w) => parseInt(w.trim(), 10)).filter((n) => !isNaN(n));
      filteredRecords = filterByWeeks(filteredRecords, weeks);
    }
    if (monthParam) {
      const month = parseInt(monthParam, 10);
      if (!isNaN(month)) {
        filteredRecords = filterByMonth(filteredRecords, month);
      }
    }

    // 4. Run all aggregation functions on filtered records
    const weeklySummary = computeWeeklySummary(filteredRecords);
    const monthlySummary = computeMonthlySummary(filteredRecords);
    const errorBreakdown = computeErrorBreakdown(filteredRecords);
    const disruptionBreakdown = computeDisruptionBreakdown(filteredRecords);
    const appealSummary = computeAppealSummary(filteredRecords);
    const commonFindings = computeCommonFindings(filteredRecords);

    // 5. Build error detail log
    const errorRecords = filterErrorRecords(filteredRecords);
    const errorDetails = sortErrorLogDesc(errorRecords.map(toErrorDetailRecord));

    // 6. Highlight guidance
    const allFailedAttributes = [
      ...new Set(errorDetails.flatMap((e) => e.failedAttributes)),
    ];
    const guidanceHighlights = highlightGuidance(allFailedAttributes, []);

    // 7. Role-specific computed fields
    const associateSummaries = buildAssociateSummaries(filteredRecords);
    const weekSummaryTable = buildWeekSummaryTable(filteredRecords);
    // Repeated defaulters always use rolling last 5 weeks from scoped (region-filtered but NOT week-filtered) data
    const regionFilteredRecords = filterByRegion(
      teamFilterParam === 'true'
        ? scopedRecords.filter((r) => r.supervisorLogin === user.login)
        : scopedRecords,
      regionParam,
    );
    const repeatedDefaulters = buildRepeatedDefaulters(regionFilteredRecords);

    // 8. Available weeks and months for selectors
    const availableWeeks = [...new Set(scopedRecords.map((r) => r.transactionWeek))].sort((a, b) => a - b);
    const availableMonths = [...new Set(scopedRecords.map((r) => {
      const parts = r.transactionDate.split('-');
      return parseInt(parts[1], 10);
    }))].sort((a, b) => a - b);
    const availableRegions = [...new Set(scopedRecords.map((r) => r.region).filter(Boolean))].sort();

    // 9. allRecords for admin raw data reference
    const allRecords = filteredRecords;

    // 10. Return JSON response
    return new Response(
      JSON.stringify({
        user: { login: user.login, role: user.role },
        weeklySummary,
        monthlySummary,
        errorBreakdown,
        disruptionBreakdown,
        appealSummary,
        commonFindings,
        errorDetails,
        guidanceHighlights,
        associateSummaries,
        weekSummaryTable,
        repeatedDefaulters,
        processLevelFindings: null,
        availableWeeks,
        availableMonths,
        availableRegions,
        allRecords,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Dashboard API error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

