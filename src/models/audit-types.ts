// =============================================================================
// RQM Deep Dive Observation Email — Audit Data Models
// =============================================================================

/**
 * Represents the five quality audit dimensions evaluated per record.
 * Each attribute is "Yes" (pass) or "No" (error).
 */
export interface QualityAttribute {
  /** ADM — Associate Decision Making (Column X). "Yes" = pass, "No" = error. */
  adm: string;
  /** ADM auditor finding (Column Y). Populated when ADM = "No". */
  admFinding: string;
  /** RA — SW Adherence / Right Action (Column AA). "Yes" = pass, "No" = error. */
  ra: string;
  /** RA auditor finding (Column AB). Populated when RA = "No". */
  raFinding: string;
  /** RRC — Right Reason Code (Column AD). "Yes" = pass, "No" = error. */
  rrc: string;
  /** RRC auditor finding (Column AE). Populated when RRC = "No". */
  rrcFinding: string;
  /** ACC — Accurate & Complete Communication (Column AG). "Yes" = pass, "No" = error. */
  acc: string;
  /** ACC auditor finding (Column AH). Populated when ACC = "No". */
  accFinding: string;
  /** RV — Required Validation / Necessary Checks (Column AJ). "Yes" = pass, "No" = error. */
  rv: string;
  /** RV auditor finding (Column AK). Populated when RV = "No". */
  rvFinding: string;
}

/**
 * Auditor finding detail for a single quality attribute error.
 */
export interface AuditorFinding {
  /** The quality attribute that failed (e.g., "ADM", "RA", "RRC", "ACC", "RV"). */
  attribute: string;
  /** The auditor's error description from the corresponding finding column. */
  finding: string;
}

/**
 * Appeal-related fields from the audit spreadsheet.
 */
export interface AppealRecord {
  /** Sp Response (Column BE) — specialist's response to the audit finding. */
  spResponse: string;
  /** SP Comment (Column BF) — specialist's appeal comment/justification. */
  spComment: string;
  /** SPOC Login (Column BH) — login of the SPOC who reviewed the appeal. */
  spocLogin: string;
  /** SPOC Response (Column BI) — "Appeal Accepted" or "Appeal Not Accepted". */
  spocResponse: string;
  /** SPOC Comment (Column BJ) — SPOC's comment on the appeal decision. */
  spocComment: string;
  /** Re-Appeal Flag (Column BL) — indicates whether a re-appeal was raised. */
  reAppealFlag: string;
  /** SP Comment2 (Column BM) — re-appeal comment. */
  reAppealComment: string;
  /** Appeal Lead Login (Column BO). */
  appealLeadLogin: string;
  /** Appeal Lead Decision (Column BP) — lead's re-appeal decision. */
  appealLeadDecision: string;
  /** Appeal Lead Comment (Column BQ). */
  appealLeadComment: string;
}

/**
 * A defect record is an AuditRecord where defectFlag is TRUE.
 * This type alias makes intent explicit in function signatures.
 */
export type DefectRecord = AuditRecord & { defectFlag: true };


/**
 * Core data model representing a single row from the audit spreadsheet.
 * Maps all required columns from the RSOB team audit data.
 */
export interface AuditRecord {
  // --- Identity & Classification ---
  /** Team (Column B) — always "RSOB" for this dataset. */
  team: string;
  /** Region (Column E) — "NA" or "EU". */
  region: string;
  /** Disruption Type (Column I) — e.g., "ADHOC Validation", "Cancel Validation". */
  disruptionType: string;
  /** Sub-Transaction Type (Column J) — e.g., "Continous Scheduling". */
  subTransactionType: string;
  /** QA Monitoring Date (Column L). */
  qaMonitoringDate: string;
  /** Transaction Date (Column N). */
  transactionDate: string;
  /** Transaction ID (Column L) — case/transaction identifier. */
  transactionId: string;
  /** Alogin (Column O) — associate login ID. */
  associateLogin: string;
  /** Associate Status (Column Q) — e.g., "Tenured". */
  associateStatus: string;
  /** Supervisor Login (Column R) — e.g., "kampatis", "vudaths". */
  supervisorLogin: string;
  /** Supervisor Email (Column S) — e.g., "kampatis@amazon.com". */
  supervisorEmail: string;
  /** Transaction Week (Column U) — week number (e.g., 11, 12, 13). */
  transactionWeek: number;
  /** Sub Disruption Type (Column V) — "CARs" or "NON-CARs". */
  subDisruptionType: string;

  // --- Quality Audit Attributes (pass/fail) ---
  /** ADM — Associate Decision Making (Column X). "Yes" | "No". */
  adm: string;
  /** ADM auditor finding (Column Y). */
  admFinding: string;
  /** Comments1 (Column Z) — comments for ADM. */
  comments1: string;
  /** RA — SW Adherence / Right Action (Column AA). "Yes" | "No". */
  ra: string;
  /** RA auditor finding (Column AB). */
  raFinding: string;
  /** Comments2 (Column AC) — detailed comments for RA. */
  comments2: string;
  /** RRC — Right Reason Code (Column AD). "Yes" | "No". */
  rrc: string;
  /** RRC auditor finding (Column AE). */
  rrcFinding: string;
  /** Comments3 (Column AF) — comments for RRC. */
  comments3: string;
  /** ACC — Accurate & Complete Communication (Column AG). "Yes" | "No". */
  acc: string;
  /** ACC auditor finding (Column AH). */
  accFinding: string;
  /** Comments4 (Column AI) — comments for ACC. */
  comments4: string;
  /** RV — Required Validation / Necessary Checks (Column AJ). "Yes" | "No". */
  rv: string;
  /** RV auditor finding (Column AK). */
  rvFinding: string;
  /** Comments5 (Column AL) — comments for RV. */
  comments5: string;

  // --- Appeal Fields ---
  /** Sp Response (Column BE). */
  spResponse: string;
  /** SP Comment (Column BF). */
  spComment: string;
  /** SPOC Login (Column BH). */
  spocLogin: string;
  /** SPOC Response (Column BI). */
  spocResponse: string;
  /** SPOC Comment (Column BJ). */
  spocComment: string;
  /** Re-Appeal Flag (Column BL). */
  reAppealFlag: string;
  /** SP Comment2 / Re-Appeal Comment (Column BM). */
  reAppealComment: string;
  /** Appeal Lead Login (Column BO). */
  appealLeadLogin: string;
  /** Appeal Lead Decision (Column BP). */
  appealLeadDecision: string;
  /** Appeal Lead Comment (Column BQ). */
  appealLeadComment: string;

  // --- Defect Flag ---
  /** audit_email (Column BS). TRUE = confirmed defect, FALSE = non-defect. */
  defectFlag: boolean;

  // --- Computed Fields (added by ErrorDetector) ---
  /** Number of quality attributes marked "No". */
  errorCount?: number;
  /** List of attribute names that are "No" (e.g., ["ADM", "RRC"]). */
  errorAttributes?: string[];
}

/**
 * "No guidance on..." observation from non-defect records.
 */
export interface NoGuidanceObservation {
  /** The distinct "No guidance on..." text. */
  observation: string;
  /** How many times this observation appears across qualifying records. */
  frequency: number;
}


// =============================================================================
// Aggregate / Analysis Types
// =============================================================================

/**
 * Week-wise error and defect counts for a single Transaction Week.
 */
export interface WeekAnalysis {
  /** Transaction Week number (Column U). */
  week: number;
  /** Total records audited in this week. */
  totalAudited: number;
  /** Total error attribute count across all records in this week. */
  totalErrors: number;
  /** Count of confirmed defects (defectFlag = TRUE) in this week. */
  totalDefects: number;
}

/**
 * Supervisor-wise, week-wise breakdown of errors and defects.
 */
export interface SupervisorWeekAnalysis {
  /** Supervisor Login (Column R). */
  supervisorLogin: string;
  /** Supervisor Email (Column S). */
  supervisorEmail: string;
  /** Per-week breakdown for this supervisor. */
  weekBreakdown: {
    week: number;
    totalErrors: number;
    totalDefects: number;
  }[];
}

/**
 * Breakdown of error attribute frequencies and defect reason frequencies.
 */
export interface ErrorCategoryBreakdown {
  /** Frequency of each quality attribute error, sorted descending. */
  attributeErrors: { attribute: string; count: number }[];
  /** Frequency of each distinct defect reason, sorted descending. */
  defectReasons: { reason: string; count: number }[];
}

/**
 * Defect counts grouped by Disruption Type and Sub Disruption Type.
 */
export interface DisruptionBreakdown {
  /** Disruption Type (Column I). */
  disruptionType: string;
  /** Sub Disruption Type (Column V). */
  subDisruptionType: string;
  /** Number of confirmed defects in this group. */
  defectCount: number;
  /** Total error attribute count in this group. */
  errorCount: number;
}

/**
 * Summary of appeal outcomes across all audit records.
 */
export interface AppealSummary {
  totalAppeals: number;
  accepted: number;
  notAccepted: number;
  pending: number;
  /** accepted / totalAppeals (0 when no appeals). */
  acceptanceRate: number;
  /** Re-appeal details when Re-Appeal Flag is populated. */
  reAppeals: {
    appealLeadLogin: string;
    decision: string;
    comment: string;
  }[];
}

/**
 * A defect reason with an actionable avoidance pointer, grouped by category.
 */
export interface DefectAvoidanceEntry {
  /** Root cause category (e.g., "Reason Code Selection"). */
  category: string;
  /** Individual defect reasons grouped under this category. */
  reasons: string[];
  /** Actionable guidance on how to avoid these defects. */
  avoidancePointer: string;
}

/**
 * Complete data object passed to the email renderer.
 * Aggregates all analysis results for the reporting period.
 */
export interface EmailData {
  /** Reporting period derived from min/max Transaction Week. */
  reportingPeriod: { startWeek: number; endWeek: number };
  /** Week-wise error and defect analysis, ordered chronologically. */
  weekAnalysis: WeekAnalysis[];
  /** Supervisor-wise, week-wise breakdown. */
  supervisorAnalysis: SupervisorWeekAnalysis[];
  /** Error category and defect reason frequency breakdown. */
  errorCategoryBreakdown: ErrorCategoryBreakdown;
  /** Disruption type breakdown for defect records. */
  disruptionBreakdown: DisruptionBreakdown[];
  /** Appeal tracking summary. */
  appealSummary: AppealSummary;
  /** "No guidance on..." observations from non-defect records. */
  noGuidanceObservations: NoGuidanceObservation[];
  /** Defect reasons with avoidance guidance, grouped by category. */
  defectAvoidanceGuidance: DefectAvoidanceEntry[];
  /** Total records processed. */
  totalRecords: number;
  /** Total confirmed defects. */
  totalDefects: number;
  /** Total error attribute count across all records. */
  totalErrors: number;
}
