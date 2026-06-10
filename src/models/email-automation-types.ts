import type { AuditRecord, DefectRecord } from './audit-types';

/**
 * Per-supervisor aggregated data used to compose a feedback email.
 */
export interface SupervisorEmailData {
  supervisorLogin: string;
  supervisorEmail: string;
  totalAudited: number;
  totalErrors: number;
  totalDefects: number;
  errorAttributeFrequencies: { attribute: string; count: number }[];
  defectRecords: DefectRecord[];
  observationRecords: AuditRecord[];
  appealRecords: AuditRecord[];
  reportingPeriod: { startWeek: number; endWeek: number };
  transactionWeek: number;
}

/**
 * A fully composed email ready for dispatch.
 */
export interface ComposedEmail {
  to: string;
  subject: string;
  htmlBody: string;
}

/**
 * Summary returned after a batch email dispatch.
 */
export interface DispatchSummary {
  totalSent: number;
  totalFailed: number;
  failures: { recipient: string; errorCode: string; errorMessage: string }[];
}

/**
 * A single execution log entry.
 */
export interface RunLog {
  timestamp: string;
  totalRecordsFetched: number;
  supervisorsEmailed: number;
  emailsSent: number;
  emailsFailed: number;
  failures: { recipient: string; errorCode: string; errorMessage: string }[];
}
