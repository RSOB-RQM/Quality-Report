// =============================================================================
// Quality Performance Dashboard — Aggregation Functions
// All functions are pure (no side effects).
// =============================================================================

import type {
  AuditRecord,
  WeekAnalysis,
  ErrorCategoryBreakdown,
  DisruptionBreakdown,
  AppealSummary,
} from '../models/audit-types';

import type {
  MonthlySummary,
  WeekComparisonResult,
  CommonFindingsResult,
  ErrorDetailRecord,
} from '../models/dashboard-types';

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/** Counts the number of quality attributes marked "No" in a single record. */
function countErrors(record: AuditRecord): number {
  let count = 0;
  if (record.adm === 'No') count++;
  if (record.ra === 'No') count++;
  if (record.rrc === 'No') count++;
  if (record.acc === 'No') count++;
  if (record.rv === 'No') count++;
  return count;
}

// ---------------------------------------------------------------------------
// 1. computeDefectRate
// ---------------------------------------------------------------------------

/**
 * Returns defect rate as a percentage rounded to 2 decimal places.
 * Returns 0 when totalAudited is 0.
 */
export function computeDefectRate(totalDefects: number, totalAudited: number): number {
  if (totalAudited === 0) return 0;
  return Math.round((totalDefects / totalAudited) * 10000) / 100;
}

// ---------------------------------------------------------------------------
// 2. computeWeeklySummary
// ---------------------------------------------------------------------------

/**
 * Groups records by transactionWeek and computes totals per week.
 * Sorted by week ascending.
 */
export function computeWeeklySummary(records: AuditRecord[]): WeekAnalysis[] {
  const weekMap = new Map<number, { totalAudited: number; totalDefects: number; totalErrors: number }>();

  for (const r of records) {
    const existing = weekMap.get(r.transactionWeek);
    const errors = countErrors(r);
    if (existing) {
      existing.totalAudited++;
      if (r.defectFlag === true) existing.totalDefects++;
      existing.totalErrors += errors;
    } else {
      weekMap.set(r.transactionWeek, {
        totalAudited: 1,
        totalDefects: r.defectFlag === true ? 1 : 0,
        totalErrors: errors,
      });
    }
  }

  const result: WeekAnalysis[] = [];
  for (const [week, data] of weekMap) {
    result.push({ week, ...data });
  }
  return result.sort((a, b) => a.week - b.week);
}

// ---------------------------------------------------------------------------
// 3. computeMonthlySummary
// ---------------------------------------------------------------------------

/**
 * Groups records by calendar month derived from transactionDate (YYYY-MM-DD).
 * Sorted by year then month ascending.
 */
export function computeMonthlySummary(records: AuditRecord[]): MonthlySummary[] {
  const monthMap = new Map<string, { month: number; year: number; totalAudited: number; totalDefects: number; totalErrors: number }>();

  for (const r of records) {
    const parts = r.transactionDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const key = `${year}-${month}`;
    const errors = countErrors(r);

    const existing = monthMap.get(key);
    if (existing) {
      existing.totalAudited++;
      if (r.defectFlag === true) existing.totalDefects++;
      existing.totalErrors += errors;
    } else {
      monthMap.set(key, {
        month,
        year,
        totalAudited: 1,
        totalDefects: r.defectFlag === true ? 1 : 0,
        totalErrors: errors,
      });
    }
  }

  const result: MonthlySummary[] = [];
  for (const data of monthMap.values()) {
    result.push({
      ...data,
      defectRate: computeDefectRate(data.totalDefects, data.totalAudited),
    });
  }
  return result.sort((a, b) => a.year - b.year || a.month - b.month);
}

// ---------------------------------------------------------------------------
// 4. filterErrorRecords
// ---------------------------------------------------------------------------

/**
 * Returns records where at least one quality attribute is "No".
 */
export function filterErrorRecords(records: AuditRecord[]): AuditRecord[] {
  return records.filter((r) => countErrors(r) > 0);
}

// ---------------------------------------------------------------------------
// 5. toErrorDetailRecord
// ---------------------------------------------------------------------------

/** Quality attribute keys and their display names / finding field names. */
const QUALITY_ATTRS: { key: keyof AuditRecord; label: string; findingKey: keyof AuditRecord }[] = [
  { key: 'adm', label: 'ADM', findingKey: 'admFinding' },
  { key: 'ra', label: 'RA', findingKey: 'raFinding' },
  { key: 'rrc', label: 'RRC', findingKey: 'rrcFinding' },
  { key: 'acc', label: 'ACC', findingKey: 'accFinding' },
  { key: 'rv', label: 'RV', findingKey: 'rvFinding' },
];

/**
 * Transforms an AuditRecord into an ErrorDetailRecord.
 * Extracts failed attributes and their findings.
 */
export function toErrorDetailRecord(record: AuditRecord): ErrorDetailRecord {
  const failedAttributes: string[] = [];
  const findings: { attribute: string; finding: string }[] = [];

  for (const attr of QUALITY_ATTRS) {
    if (record[attr.key] === 'No') {
      failedAttributes.push(attr.label);
      const findingText = record[attr.findingKey] as string;
      if (findingText && findingText.trim() !== '') {
        findings.push({ attribute: attr.label, finding: findingText });
      }
    }
  }

  return {
    transactionWeek: record.transactionWeek,
    transactionDate: record.transactionDate,
    disruptionType: record.disruptionType,
    failedAttributes,
    findings,
  };
}

// ---------------------------------------------------------------------------
// 6. filterErrorLog
// ---------------------------------------------------------------------------

/**
 * Filters ErrorDetailRecords by attribute and/or week range.
 * Both filters can be combined.
 */
export function filterErrorLog(
  records: ErrorDetailRecord[],
  attribute?: string,
  weekRange?: { start: number; end: number },
): ErrorDetailRecord[] {
  let result = records;

  if (attribute) {
    result = result.filter((r) => r.failedAttributes.includes(attribute));
  }

  if (weekRange) {
    result = result.filter(
      (r) => r.transactionWeek >= weekRange.start && r.transactionWeek <= weekRange.end,
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// 7. sortErrorLogDesc
// ---------------------------------------------------------------------------

/**
 * Sorts ErrorDetailRecords by transactionWeek descending (most recent first).
 * Returns a new array — does not mutate input.
 */
export function sortErrorLogDesc(records: ErrorDetailRecord[]): ErrorDetailRecord[] {
  return [...records].sort((a, b) => b.transactionWeek - a.transactionWeek);
}

// ---------------------------------------------------------------------------
// 8. computeErrorBreakdown
// ---------------------------------------------------------------------------

/**
 * Counts "No" results per quality attribute, sorted descending by count.
 * Computes percentage of total errors for each attribute.
 * Also computes defectReasons from finding fields of defect records.
 * Optionally filters to a specific week.
 */
export function computeErrorBreakdown(records: AuditRecord[], week?: number): ErrorCategoryBreakdown {
  const filtered = week !== undefined ? records.filter((r) => r.transactionWeek === week) : records;

  // Count attribute errors
  const attrCounts: Record<string, number> = { ADM: 0, RA: 0, RRC: 0, ACC: 0, RV: 0 };
  for (const r of filtered) {
    if (r.adm === 'No') attrCounts['ADM']++;
    if (r.ra === 'No') attrCounts['RA']++;
    if (r.rrc === 'No') attrCounts['RRC']++;
    if (r.acc === 'No') attrCounts['ACC']++;
    if (r.rv === 'No') attrCounts['RV']++;
  }

  const totalErrors = Object.values(attrCounts).reduce((sum, c) => sum + c, 0);

  const attributeErrors = Object.entries(attrCounts)
    .filter(([, count]) => count > 0)
    .map(([attribute, count]) => ({ attribute, count }))
    .sort((a, b) => b.count - a.count);

  // Compute defect reasons from finding fields of defect records
  const reasonCounts = new Map<string, number>();
  for (const r of filtered) {
    if (r.defectFlag !== true) continue;
    for (const attr of QUALITY_ATTRS) {
      if (r[attr.key] === 'No') {
        const finding = r[attr.findingKey] as string;
        if (finding && finding.trim() !== '') {
          reasonCounts.set(finding, (reasonCounts.get(finding) ?? 0) + 1);
        }
      }
    }
  }

  const defectReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return { attributeErrors, defectReasons };
}

// ---------------------------------------------------------------------------
// 9. computeCommonFindings
// ---------------------------------------------------------------------------

/**
 * Groups findings by quality attribute, counts frequency, sorts descending
 * within each group. Computes totalDistinctFindings.
 */
export function computeCommonFindings(records: AuditRecord[]): CommonFindingsResult {
  const groupMap = new Map<string, Map<string, number>>();

  for (const r of records) {
    for (const attr of QUALITY_ATTRS) {
      if (r[attr.key] === 'No') {
        const finding = r[attr.findingKey] as string;
        if (finding && finding.trim() !== '') {
          if (!groupMap.has(attr.label)) {
            groupMap.set(attr.label, new Map());
          }
          const findingMap = groupMap.get(attr.label)!;
          findingMap.set(finding, (findingMap.get(finding) ?? 0) + 1);
        }
      }
    }
  }

  let totalDistinctFindings = 0;
  const groups: CommonFindingsResult['groups'] = [];

  for (const [attribute, findingMap] of groupMap) {
    const findings = Array.from(findingMap.entries())
      .map(([finding, count]) => ({ finding, count }))
      .sort((a, b) => b.count - a.count);
    totalDistinctFindings += findings.length;
    groups.push({ attribute, findings });
  }

  return { groups, totalDistinctFindings };
}

// ---------------------------------------------------------------------------
// 10. computeWeekComparison
// ---------------------------------------------------------------------------

/**
 * Compares two weeks: computes WeekAnalysis and ErrorCategoryBreakdown for each,
 * calculates defectRateDelta and direction.
 */
export function computeWeekComparison(
  records: AuditRecord[],
  weekA: number,
  weekB: number,
): WeekComparisonResult {
  const recordsA = records.filter((r) => r.transactionWeek === weekA);
  const recordsB = records.filter((r) => r.transactionWeek === weekB);

  const summaryA = computeWeeklySummaryForSingleWeek(recordsA, weekA);
  const summaryB = computeWeeklySummaryForSingleWeek(recordsB, weekB);

  const breakdownA = computeErrorBreakdown(records, weekA);
  const breakdownB = computeErrorBreakdown(records, weekB);

  const rateA = computeDefectRate(summaryA.totalDefects, summaryA.totalAudited);
  const rateB = computeDefectRate(summaryB.totalDefects, summaryB.totalAudited);
  const defectRateDelta = Math.round((rateB - rateA) * 100) / 100;

  let direction: 'improvement' | 'regression' | 'unchanged';
  if (defectRateDelta < 0) direction = 'improvement';
  else if (defectRateDelta > 0) direction = 'regression';
  else direction = 'unchanged';

  return {
    weekA: { week: weekA, summary: summaryA, breakdown: breakdownA },
    weekB: { week: weekB, summary: summaryB, breakdown: breakdownB },
    defectRateDelta,
    direction,
  };
}

/** Helper: compute a single WeekAnalysis for a set of records belonging to one week. */
function computeWeeklySummaryForSingleWeek(records: AuditRecord[], week: number): WeekAnalysis {
  let totalDefects = 0;
  let totalErrors = 0;
  for (const r of records) {
    if (r.defectFlag === true) totalDefects++;
    totalErrors += countErrors(r);
  }
  return { week, totalAudited: records.length, totalDefects, totalErrors };
}

// ---------------------------------------------------------------------------
// 11. computeDisruptionBreakdown
// ---------------------------------------------------------------------------

/**
 * Groups defect records by disruptionType + subDisruptionType.
 * Counts defects and errors per group. Sorted descending by defectCount.
 * Optionally filters to a specific week.
 */
export function computeDisruptionBreakdown(records: AuditRecord[], week?: number): DisruptionBreakdown[] {
  const filtered = week !== undefined ? records.filter((r) => r.transactionWeek === week) : records;
  const defectRecords = filtered.filter((r) => r.defectFlag === true);

  const groupMap = new Map<string, { disruptionType: string; subDisruptionType: string; defectCount: number; errorCount: number }>();

  for (const r of defectRecords) {
    const key = `${r.disruptionType}||${r.subDisruptionType}`;
    const existing = groupMap.get(key);
    const errors = countErrors(r);
    if (existing) {
      existing.defectCount++;
      existing.errorCount += errors;
    } else {
      groupMap.set(key, {
        disruptionType: r.disruptionType,
        subDisruptionType: r.subDisruptionType,
        defectCount: 1,
        errorCount: errors,
      });
    }
  }

  return Array.from(groupMap.values()).sort((a, b) => b.defectCount - a.defectCount);
}

// ---------------------------------------------------------------------------
// 12. computeAppealSummary
// ---------------------------------------------------------------------------

/**
 * Counts appeals by spocResponse, computes acceptanceRate.
 * Handles zero appeals (returns 0%).
 * Collects reAppeals from records with non-empty reAppealFlag.
 */
export function computeAppealSummary(records: AuditRecord[]): AppealSummary {
  const appealRecords = records.filter((r) => r.spocResponse && r.spocResponse.trim() !== '');
  const totalAppeals = appealRecords.length;

  let accepted = 0;
  let notAccepted = 0;
  for (const r of appealRecords) {
    if (r.spocResponse === 'Appeal Accepted') accepted++;
    else if (r.spocResponse === 'Appeal Not Accepted') notAccepted++;
  }

  const pending = totalAppeals - accepted - notAccepted;
  const acceptanceRate = computeDefectRate(accepted, totalAppeals);

  const reAppeals: AppealSummary['reAppeals'] = [];
  for (const r of records) {
    if (r.reAppealFlag && r.reAppealFlag.trim() !== '') {
      reAppeals.push({
        appealLeadLogin: r.appealLeadLogin,
        decision: r.appealLeadDecision,
        comment: r.appealLeadComment,
      });
    }
  }

  return { totalAppeals, accepted, notAccepted, pending, acceptanceRate, reAppeals };
}
