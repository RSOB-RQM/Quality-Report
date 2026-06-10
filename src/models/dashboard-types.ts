// =============================================================================
// Quality Performance Dashboard — Shared Types
// =============================================================================

import type {
  AuditRecord,
  WeekAnalysis,
  ErrorCategoryBreakdown,
} from './audit-types';

// Re-export reused types for convenience
export type { AuditRecord, WeekAnalysis, ErrorCategoryBreakdown };
export type {
  DisruptionBreakdown,
  AppealSummary,
  DefectAvoidanceEntry,
} from './audit-types';

// --- Auth & Roles ---

/** User role within the dashboard. */
export type UserRole = 'admin' | 'manager' | 'associate';

/** Authenticated user resolved by the Auth module. */
export interface AuthenticatedUser {
  login: string;
  email: string;
  role: UserRole;
}

/** Role mapping entry for auth configuration. */
export interface RoleMappingEntry {
  login: string;
  role: UserRole;
}

// --- Aggregation Results ---

/** Monthly aggregation of audit data. */
export interface MonthlySummary {
  /** Month number (1-12). */
  month: number;
  /** Year (e.g. 2026). */
  year: number;
  /** Total records audited in this month. */
  totalAudited: number;
  /** Total confirmed defects in this month. */
  totalDefects: number;
  /** Total error attribute count in this month. */
  totalErrors: number;
  /** Defect rate as percentage, rounded to 2 decimal places. */
  defectRate: number;
}

/** Result of comparing two Transaction Weeks. */
export interface WeekComparisonResult {
  weekA: { week: number; summary: WeekAnalysis; breakdown: ErrorCategoryBreakdown };
  weekB: { week: number; summary: WeekAnalysis; breakdown: ErrorCategoryBreakdown };
  /** Defect rate delta (weekB - weekA) in percentage points. */
  defectRateDelta: number;
  /** 'improvement' if delta < 0, 'regression' if delta > 0, 'unchanged' if 0. */
  direction: 'improvement' | 'regression' | 'unchanged';
}

/** Grouped auditor findings for the Common Findings panel. */
export interface CommonFindingsResult {
  /** Findings grouped by quality attribute. */
  groups: {
    attribute: string;
    findings: { finding: string; count: number }[];
  }[];
  /** Total distinct findings across all attributes. */
  totalDistinctFindings: number;
}

/** A single error record for the Associate Error Detail table. */
export interface ErrorDetailRecord {
  transactionWeek: number;
  transactionDate: string;
  disruptionType: string;
  failedAttributes: string[];
  findings: { attribute: string; finding: string }[];
}

// --- Excel Parsing ---

// --- Role-Specific Dashboard Types ---

/** Per-associate summary for manager/admin views. */
export interface AssociateSummaryRow {
  associateLogin: string;
  totalAudits: number;
  totalDefects: number;
  defectRate: number;
  totalErrors: number;
  errorAttributes: { attribute: string; count: number }[];
  /** Trend: 'improving' | 'regressing' | 'stable' based on recent weeks. */
  trend: 'improving' | 'regressing' | 'stable';
  /** Top auditor finding descriptions for this associate's errors. */
  topFindings: { attribute: string; finding: string; count: number }[];
}

/** Horizontal week summary table row (one metric across weeks). */
export interface WeekSummaryTableRow {
  metric: string;
  values: { week: number; value: string | number }[];
}

/** Repeated defaulter: associate with defects in 3+ weeks. */
export interface RepeatedDefaulter {
  associateLogin: string;
  weeklyDefects: { week: number; defectCount: number }[];
  totalWeeksWithDefects: number;
}

/** Warning produced when the Excel parser skips a row. */
export interface ExcelParseWarning {
  rowNumber: number;
  missingFields: string[];
}

/** Result of parsing an uploaded .xlsx file. */
export interface ExcelParseResult {
  records: AuditRecord[];
  warnings: ExcelParseWarning[];
  totalRows: number;
}

// --- Upload ---

/** Result returned by the Upload Service after processing a file. */
export interface UploadResult {
  success: boolean;
  parsedCount: number;
  skippedCount: number;
  warnings: ExcelParseWarning[];
  mergeStats: { added: number; replaced: number };
  error?: string;
}
