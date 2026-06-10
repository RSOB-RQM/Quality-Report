// =============================================================================
// Core Data Models
// =============================================================================

/**
 * A structured representation of a single associate's schedule entry.
 * Dates are ISO 8601 (YYYY-MM-DD), times are 24-hour format (HH:MM).
 */
export interface Schedule_Record {
  associateName: string;
  date: string;       // YYYY-MM-DD
  shiftStart: string; // HH:MM
  shiftEnd: string;   // HH:MM
  activities: string[];
}

/**
 * A structured representation of a leave entry from the A-Z leave system.
 */
export interface Leave_Record {
  associateName: string;
  leaveType: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  approvalStatus: 'approved' | 'pending' | 'rejected';
}

/**
 * A structured representation of a daily connect availability entry.
 */
export interface Connect_Record {
  associateName: string;
  date: string;       // YYYY-MM-DD
  availabilityStatus: 'available' | 'unavailable' | 'partial';
}

/**
 * A merged record joining schedule, leave, and connect data for a single
 * associate on a single date.
 */
export interface MergedRecord {
  associateName: string;
  date: string; // ISO 8601
  shiftStart: string | null; // HH:MM 24h
  shiftEnd: string | null;   // HH:MM 24h
  activities: string[];
  leaveType: string | null;
  leaveStatus: 'approved' | 'pending' | 'rejected' | null;
  connectAvailability: 'available' | 'unavailable' | 'partial' | null;
  shrinkagePercent: number;
}


// =============================================================================
// Team Summary & Dashboard
// =============================================================================

/**
 * Aggregated team-level summary for the dashboard header.
 */
export interface TeamSummary {
  totalScheduled: number;
  totalOnLeave: number;
  totalUnavailable: number;
  teamShrinkagePercent: number;
}

/**
 * Error information for a specific data source.
 */
export interface DataSourceError {
  source: 'quip' | 'az_leave' | 'connect';
  message: string;
}

/**
 * Props passed to the Dashboard UI component.
 */
export interface DashboardProps {
  data: MergedRecord[];
  summary: TeamSummary;
  lastUpdated: string; // ISO 8601 timestamp
  errors: DataSourceError[];
}

// =============================================================================
// Quip Adapter Types
// =============================================================================

/**
 * Result of parsing a Quip document, including records, warnings, and sheet count.
 */
export interface QuipParseResult {
  records: Schedule_Record[];
  warnings: ParseWarning[];
  sheetCount: number;
}

/**
 * Warning produced when a row in the Quip spreadsheet is incomplete.
 */
export interface ParseWarning {
  sheetIndex: number;
  rowNumber: number;
  missingFields: string[];
}

// =============================================================================
// A-Z Leave Connector Types
// =============================================================================

/**
 * Result of fetching leave data from the A-Z system.
 */
export interface LeaveResult {
  records: Leave_Record[];
  error?: LeaveError;
}

/**
 * Error from the A-Z leave system.
 */
export interface LeaveError {
  type: 'timeout' | 'auth_failure' | 'network_error';
  message: string;
}

// =============================================================================
// Connect Tracker Types
// =============================================================================

/**
 * Result of fetching connect availability data.
 */
export interface ConnectResult {
  records: Connect_Record[];
  error?: ConnectError;
}

/**
 * Error from the Amazon Connect API.
 */
export interface ConnectError {
  type: 'unavailable' | 'auth_failure' | 'api_error';
  message: string;
}

// =============================================================================
// Shared Utility Types
// =============================================================================

/**
 * A date range used for filtering data.
 */
export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}
