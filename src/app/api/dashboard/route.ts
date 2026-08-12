
// =============================================================================
// Dashboard Data API Route — GET /api/dashboard
// MINIMAL TEST — No external imports to isolate the 500 error
// =============================================================================

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface AuditRecord {
  transactionId: string;
  team: string;
  region: string;
  disruptionType: string;
  subTransactionType: string;
  qaMonitoringDate: string;
  transactionDate: string;
  associateLogin: string;
  associateStatus: string;
  supervisorLogin: string;
  supervisorEmail: string;
  transactionWeek: number;
  subDisruptionType: string;
  adm: string;
  admFinding: string;
  comments1: string;
  ra: string;
  raFinding: string;
  comments2: string;
  rrc: string;
  rrcFinding: string;
  comments3: string;
  acc: string;
  accFinding: string;
  comments4: string;
  rv: string;
  rvFinding: string;
  comments5: string;
  spResponse: string;
  spComment: string;
  spocLogin: string;
  spocResponse: string;
  spocComment: string;
  reAppealFlag: string;
  reAppealComment: string;
  appealLeadLogin: string;
  appealLeadDecision: string;
  appealLeadComment: string;
  defectFlag: boolean;
}

// ---------------------------------------------------------------------------
// Try to read audit-records.json from multiple paths
// ---------------------------------------------------------------------------
async function loadRecords(): Promise<AuditRecord[]> {
  const paths = [
    join(process.cwd(), 'data', 'audit-records.json'),
    join(process.cwd(), '.next', 'server', 'data', 'audit-records.json'),
    '/var/task/data/audit-records.json',
    '/var/task/.next/server/data/audit-records.json',
  ];

  for (const p of paths) {
    try {
      const raw = await readFile(p, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data as AuditRecord[];
    } catch {
      continue;
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Compute basic stats inline (no external service imports)
// ---------------------------------------------------------------------------
function computeDefectRate(defects: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((defects / total) * 10000) / 100;
}

function computeWeeklySummary(records: AuditRecord[]) {
  const weekMap = new Map<number, { total: number; defects: number }>();
  for (const r of records) {
    let entry = weekMap.get(r.transactionWeek);
    if (!entry) { entry = { total: 0, defects: 0 }; weekMap.set(r.transactionWeek, entry); }
    entry.total++;
    if (r.defectFlag) entry.defects++;
  }
  return Array.from(weekMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([week, d]) => ({ week, totalAudits: d.total, defects: d.defects, defectRate: computeDefectRate(d.defects, d.total) }));
}

function computeErrorBreakdown(records: AuditRecord[]) {
  const attrs = ['adm', 'ra', 'rrc', 'acc', 'rv'] as const;
  const labels: Record<string, string> = { adm: 'ADM', ra: 'RA', rrc: 'RRC', acc: 'ACC', rv: 'RV' };
  const counts: Record<string, number> = {};
  for (const attr of attrs) counts[labels[attr]] = 0;
  for (const r of records) {
    for (const attr of attrs) {
      if (r[attr] === 'No') counts[labels[attr]]++;
    }
  }
  return Object.entries(counts).map(([attribute, count]) => ({ attribute, count }));
}

function computeDisruptionBreakdown(records: AuditRecord[]) {
  const map = new Map<string, number>();
  for (const r of records) {
    if (r.disruptionType) map.set(r.disruptionType, (map.get(r.disruptionType) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}

function buildAssociateSummaries(records: AuditRecord[]) {
  const map = new Map<string, { audits: number; defects: number }>();
  for (const r of records) {
    let entry = map.get(r.associateLogin);
    if (!entry) { entry = { audits: 0, defects: 0 }; map.set(r.associateLogin, entry); }
    entry.audits++;
    if (r.defectFlag) entry.defects++;
  }
  return Array.from(map.entries())
    .map(([login, d]) => ({
      associateLogin: login,
      totalAudits: d.audits,
      totalDefects: d.defects,
      defectRate: computeDefectRate(d.defects, d.audits),
      totalErrors: 0,
      errorAttributes: [],
      trend: 'stable' as const,
      topFindings: [],
    }))
    .sort((a, b) => b.defectRate - a.defectRate);
}

function buildWeekSummaryTable(records: AuditRecord[]) {
  const weekMap = new Map<number, { audited: number; defects: number }>();
  for (const r of records) {
    let entry = weekMap.get(r.transactionWeek);
    if (!entry) { entry = { audited: 0, defects: 0 }; weekMap.set(r.transactionWeek, entry); }
    entry.audited++;
    if (r.defectFlag) entry.defects++;
  }
  const weeks = Array.from(weekMap.keys()).sort((a, b) => a - b);
  return [
    { metric: 'Total Audits', values: weeks.map(w => ({ week: w, value: weekMap.get(w)!.audited })) },
    { metric: 'Audits with Defects', values: weeks.map(w => ({ week: w, value: weekMap.get(w)!.defects })) },
    { metric: 'Defect rate%', values: weeks.map(w => ({ week: w, value: `${computeDefectRate(weekMap.get(w)!.defects, weekMap.get(w)!.audited)}%` })) },
  ];
}

function buildRepeatedDefaulters(records: AuditRecord[]) {
  const allWeeks = [...new Set(records.map(r => r.transactionWeek))].sort((a, b) => a - b);
  const last5Weeks = new Set(allWeeks.slice(-5));
  const recentRecords = records.filter(r => last5Weeks.has(r.transactionWeek));

  const map = new Map<string, Map<number, number>>();
  for (const r of recentRecords) {
    if (!r.defectFlag) continue;
    if (!map.has(r.associateLogin)) map.set(r.associateLogin, new Map());
    const weekMap = map.get(r.associateLogin)!;
    weekMap.set(r.transactionWeek, (weekMap.get(r.transactionWeek) ?? 0) + 1);
  }

  const result: { associateLogin: string; weeklyDefects: { week: number; defectCount: number }[]; totalWeeksWithDefects: number }[] = [];
  for (const [login, weekMap] of map) {
    if (weekMap.size >= 3) {
      result.push({
        associateLogin: login,
        weeklyDefects: Array.from(weekMap.entries()).map(([week, defectCount]) => ({ week, defectCount })).sort((a, b) => a.week - b.week),
        totalWeeksWithDefects: weekMap.size,
      });
    }
  }
  return result.sort((a, b) => b.totalWeeksWithDefects - a.totalWeeksWithDefects);
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  try {
    const user = { login: 'mpuranik', role: 'admin' };

    // Load records
    const allRecords = await loadRecords();

    // Parse filters
    const url = new URL(request.url);
    const weeksParam = url.searchParams.get('weeks');
    const regionParam = url.searchParams.get('region') ?? '';

    let filteredRecords = allRecords;
    if (regionParam) filteredRecords = filteredRecords.filter(r => r.region === regionParam);
    if (weeksParam) {
      const weeks = new Set(weeksParam.split(',').map(w => parseInt(w.trim(), 10)).filter(n => !isNaN(n)));
      filteredRecords = filteredRecords.filter(r => weeks.has(r.transactionWeek));
    }

    // Compute all stats inline
    const weeklySummary = computeWeeklySummary(filteredRecords);
    const errorBreakdown = computeErrorBreakdown(filteredRecords);
    const disruptionBreakdown = computeDisruptionBreakdown(filteredRecords);
    const associateSummaries = buildAssociateSummaries(filteredRecords);
    const weekSummaryTable = buildWeekSummaryTable(filteredRecords);
    const repeatedDefaulters = buildRepeatedDefaulters(allRecords);

    const availableWeeks = [...new Set(allRecords.map(r => r.transactionWeek))].sort((a, b) => a - b);
    const availableMonths = [...new Set(allRecords.map(r => {
      const parts = r.transactionDate?.split('-');
      return parts ? parseInt(parts[1], 10) : 0;
    }))].filter(m => m > 0).sort((a, b) => a - b);
    const availableRegions = [...new Set(allRecords.map(r => r.region).filter(Boolean))].sort();

    return new Response(
      JSON.stringify({
        user,
        weeklySummary,
        monthlySummary: [],
        errorBreakdown,
        disruptionBreakdown,
        appealSummary: { total: 0, approved: 0, rejected: 0, pending: 0 },
        commonFindings: { findings: [] },
        errorDetails: [],
        guidanceHighlights: [],
        associateSummaries,
        weekSummaryTable,
        repeatedDefaulters,
        processLevelFindings: null,
        availableWeeks,
        availableMonths,
        availableRegions,
        allRecords: filteredRecords,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Dashboard API CRASH:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err), stack: (err as Error).stack }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

