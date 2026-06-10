// =============================================================================
// Excel Adapter — Parse and Print .xlsx audit data
// =============================================================================

import * as XLSX from 'xlsx';
import type { AuditRecord } from '../models/audit-types';
import type { ExcelParseResult, ExcelParseWarning } from '../models/dashboard-types';

// =============================================================================
// ExcelAdapter Interface
// =============================================================================

export interface ExcelAdapter {
  /** Parses an .xlsx buffer into AuditRecord objects. */
  parse(buffer: Buffer): ExcelParseResult;
  /** Serializes AuditRecord objects into an .xlsx buffer. */
  print(records: AuditRecord[]): Buffer;
}

// =============================================================================
// Header ↔ AuditRecord Field Mapping
// =============================================================================

/**
 * Maps spreadsheet header names (case-insensitive) to AuditRecord field names.
 * Based on the actual column headers in 2026-RQM.xlsx.
 */
const HEADER_TO_FIELD: Record<string, keyof AuditRecord> = {
  'team': 'team',
  'region': 'region',
  'disruption type': 'disruptionType',
  'sub-transaction type': 'subTransactionType',
  'qa monitoring date': 'qaMonitoringDate',
  'transaction date': 'transactionDate',
  'transaction id': 'transactionId',
  'alogin': 'associateLogin',
  'associate status': 'associateStatus',
  'supervisor login': 'supervisorLogin',
  'supervisor email': 'supervisorEmail',
  'transaction week': 'transactionWeek',
  'sub disruption type': 'subDisruptionType',
  'dm': 'adm',
  'dm_a1': 'admFinding',
  'dm_comments1': 'comments1',
  'ra': 'ra',
  'ra1_a1': 'raFinding',
  'ra_comments': 'comments2',
  'rrc': 'rrc',
  'rrc_a1': 'rrcFinding',
  'rrc_comments3': 'comments3',
  'acc': 'acc',
  'acc_a1': 'accFinding',
  'acc comments4': 'comments4',
  'rv': 'rv',
  'rv_a1': 'rvFinding',
  'rv_comments': 'comments5',
  'sp response': 'spResponse',
  'sp comment': 'spComment',
  'spoc_login': 'spocLogin',
  'spoc response': 'spocResponse',
  'spoc comment': 'spocComment',
  'supervisor to re-appeal': 'reAppealFlag',
  'sp comment2': 'reAppealComment',
  'appeal lead login': 'appealLeadLogin',
  'appeal lead on re-appeal': 'appealLeadDecision',
  'appeal lead comment': 'appealLeadComment',
  'audit_email': 'defectFlag',
  'overall%': 'defectFlag',
};

/**
 * Reverse mapping: AuditRecord field → header name used in printed output.
 * Uses the canonical header names from the real spreadsheet.
 */
const FIELD_TO_HEADER: Record<keyof AuditRecord, string> = {
  team: 'Team',
  region: 'Region',
  disruptionType: 'Disruption Type',
  subTransactionType: 'Sub-Transaction Type',
  qaMonitoringDate: 'QA Monitoring Date',
  transactionDate: 'Transaction Date',
  transactionId: 'Transaction ID',
  associateLogin: 'Alogin',
  associateStatus: 'Associate Status',
  supervisorLogin: 'Supervisor Login',
  supervisorEmail: 'Supervisor Email',
  transactionWeek: 'Transaction Week',
  subDisruptionType: 'Sub Disruption Type',
  adm: 'DM',
  admFinding: 'DM_A1',
  comments1: 'DM_Comments1',
  ra: 'RA',
  raFinding: 'RA1_A1',
  comments2: 'RA_Comments',
  rrc: 'RRC',
  rrcFinding: 'RRC_A1',
  comments3: 'RRC_Comments3',
  acc: 'ACC',
  accFinding: 'ACC_A1',
  comments4: 'ACC Comments4',
  rv: 'RV',
  rvFinding: 'RV_A1',
  comments5: 'RV_Comments',
  spResponse: 'Sp Response',
  spComment: 'SP Comment',
  spocLogin: 'spoc_login',
  spocResponse: 'SPOC Response',
  spocComment: 'SPOC Comment',
  reAppealFlag: 'Supervisor to Re-appeal',
  reAppealComment: 'SP Comment2',
  appealLeadLogin: 'Appeal Lead Login',
  appealLeadDecision: 'Appeal Lead on Re-appeal',
  appealLeadComment: 'Appeal Lead Comment',
  defectFlag: 'audit_email',
  // Computed fields — not serialized
  errorCount: '',
  errorAttributes: '',
};

/** The ordered list of AuditRecord fields to include in printed output. */
const PRINT_FIELDS: (keyof AuditRecord)[] = [
  'team', 'region', 'disruptionType', 'subTransactionType', 'qaMonitoringDate',
  'transactionDate', 'associateLogin', 'associateStatus', 'supervisorLogin',
  'supervisorEmail', 'transactionWeek', 'subDisruptionType',
  'adm', 'admFinding', 'comments1',
  'ra', 'raFinding', 'comments2',
  'rrc', 'rrcFinding', 'comments3',
  'acc', 'accFinding', 'comments4',
  'rv', 'rvFinding', 'comments5',
  'spResponse', 'spComment', 'spocLogin', 'spocResponse', 'spocComment',
  'reAppealFlag', 'reAppealComment',
  'appealLeadLogin', 'appealLeadDecision', 'appealLeadComment',
  'defectFlag',
];

/** Required fields — rows missing any of these are skipped. */
const REQUIRED_FIELDS: (keyof AuditRecord)[] = [
  'associateLogin',
  'supervisorLogin',
  'transactionWeek',
];

// =============================================================================
// Parse Implementation
// =============================================================================

/**
 * Parses an .xlsx buffer into AuditRecord objects.
 * Skips rows missing required fields and records warnings.
 */
export function parse(buffer: Buffer): ExcelParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return { records: [], warnings: [], totalRows: 0 };
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet || !worksheet['!ref']) {
    return { records: [], warnings: [], totalRows: 0 };
  }

  // Convert sheet to array of arrays (raw cell values)
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: true,
  });

  if (rawRows.length === 0) {
    return { records: [], warnings: [], totalRows: 0 };
  }

  // First row is headers
  const headerRow = rawRows[0];
  const columnMap = buildColumnMap(headerRow);

  const records: AuditRecord[] = [];
  const warnings: ExcelParseWarning[] = [];
  const dataRows = rawRows.slice(1);

  // Filter out completely empty rows
  const nonEmptyDataRows = dataRows.filter(
    (row) => row.some((cell) => cell !== '' && cell !== null && cell !== undefined),
  );

  for (let i = 0; i < nonEmptyDataRows.length; i++) {
    const row = nonEmptyDataRows[i];
    // Row number is 1-based, +1 for header row offset
    const rowNumber = dataRows.indexOf(row) + 2; // +2: 1-based + header row

    try {
      const result = parseRow(row, columnMap, rowNumber);
      if (result.record) {
        records.push(result.record);
      } else if (result.warning) {
        warnings.push(result.warning);
      }
    } catch {
      // Corrupted cell data — skip row, add warning
      warnings.push({ rowNumber, missingFields: ['corrupted data'] });
    }
  }

  return {
    records,
    warnings,
    totalRows: nonEmptyDataRows.length,
  };
}

/**
 * Builds a mapping from column index → AuditRecord field name
 * by matching header cell values against HEADER_TO_FIELD.
 */
function buildColumnMap(headerRow: unknown[]): Map<number, keyof AuditRecord | '__overallPct__'> {
  const map = new Map<number, keyof AuditRecord | '__overallPct__'>();
  let hasOverallPct = false;

  for (let i = 0; i < headerRow.length; i++) {
    const headerValue = String(headerRow[i] ?? '').trim().toLowerCase();
    if (headerValue === 'overall%') {
      // Track Overall% column separately — it will be used for defectFlag
      map.set(i, '__overallPct__');
      hasOverallPct = true;
    } else {
      const field = HEADER_TO_FIELD[headerValue];
      if (field) {
        // If we have Overall%, skip audit_email mapping for defectFlag
        if (field === 'defectFlag' && hasOverallPct) continue;
        map.set(i, field);
      }
    }
  }

  return map;
}

/**
 * Parses a single data row into an AuditRecord, or returns a warning
 * if required fields are missing.
 */
function parseRow(
  row: unknown[],
  columnMap: Map<number, keyof AuditRecord | '__overallPct__'>,
  rowNumber: number,
): { record?: AuditRecord; warning?: ExcelParseWarning } {
  // Extract raw values by field name
  const rawFields: Partial<Record<keyof AuditRecord, unknown>> = {};
  let overallPctValue: unknown = undefined;

  columnMap.forEach((field, colIdx) => {
    if (colIdx < row.length) {
      if (field === '__overallPct__') {
        overallPctValue = row[colIdx];
      } else {
        rawFields[field] = row[colIdx];
      }
    }
  });

  // Use Overall% for defectFlag if available, otherwise fall back to audit_email
  if (overallPctValue !== undefined && overallPctValue !== '' && overallPctValue !== null) {
    rawFields.defectFlag = overallPctValue;
  }

  // Check required fields
  const missingFields: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = rawFields[field];
    if (field === 'transactionWeek') {
      // transactionWeek: must be convertible to a number
      const num = Number(value);
      if (value === '' || value === null || value === undefined || isNaN(num)) {
        missingFields.push(field);
      }
    } else {
      // String fields: must be non-empty
      const str = String(value ?? '').trim();
      if (!str) {
        missingFields.push(field);
      }
    }
  }

  if (missingFields.length > 0) {
    return { warning: { rowNumber, missingFields } };
  }

  // Build the AuditRecord
  const record: AuditRecord = {
    team: stringVal(rawFields.team),
    region: stringVal(rawFields.region),
    disruptionType: stringVal(rawFields.disruptionType),
    subTransactionType: stringVal(rawFields.subTransactionType),
    qaMonitoringDate: excelDateToString(rawFields.qaMonitoringDate),
    transactionDate: excelDateToString(rawFields.transactionDate),
    transactionId: stringVal(rawFields.transactionId),
    associateLogin: stringVal(rawFields.associateLogin),
    associateStatus: stringVal(rawFields.associateStatus),
    supervisorLogin: stringVal(rawFields.supervisorLogin),
    supervisorEmail: stringVal(rawFields.supervisorEmail),
    transactionWeek: Number(rawFields.transactionWeek),
    subDisruptionType: stringVal(rawFields.subDisruptionType),
    adm: stringVal(rawFields.adm),
    admFinding: stringVal(rawFields.admFinding),
    comments1: stringVal(rawFields.comments1),
    ra: stringVal(rawFields.ra),
    raFinding: stringVal(rawFields.raFinding),
    comments2: stringVal(rawFields.comments2),
    rrc: stringVal(rawFields.rrc),
    rrcFinding: stringVal(rawFields.rrcFinding),
    comments3: stringVal(rawFields.comments3),
    acc: stringVal(rawFields.acc),
    accFinding: stringVal(rawFields.accFinding),
    comments4: stringVal(rawFields.comments4),
    rv: stringVal(rawFields.rv),
    rvFinding: stringVal(rawFields.rvFinding),
    comments5: stringVal(rawFields.comments5),
    spResponse: stringVal(rawFields.spResponse),
    spComment: stringVal(rawFields.spComment),
    spocLogin: stringVal(rawFields.spocLogin),
    spocResponse: stringVal(rawFields.spocResponse),
    spocComment: stringVal(rawFields.spocComment),
    reAppealFlag: stringVal(rawFields.reAppealFlag),
    reAppealComment: stringVal(rawFields.reAppealComment),
    appealLeadLogin: stringVal(rawFields.appealLeadLogin),
    appealLeadDecision: stringVal(rawFields.appealLeadDecision),
    appealLeadComment: stringVal(rawFields.appealLeadComment),
    defectFlag: toDefectFlag(rawFields.defectFlag),
  };

  return { record };
}

/** Safely converts an unknown value to a trimmed string. */
function stringVal(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Converts an Excel serial date number to YYYY-MM-DD string.
 * Excel dates are days since 1899-12-30 (with the 1900 leap year bug).
 */
function excelDateToString(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    // Excel serial date: days since 1899-12-30
    const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // If already a string, try to return as-is or parse
  const str = String(value).trim();
  // Check if it looks like a date already (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return str;
}

/** Converts an unknown value to a boolean (TRUE/true/1 → true). */
function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const str = String(value).trim().toUpperCase();
  return str === 'TRUE' || str === '1' || str === 'YES';
}

/**
 * Derives defectFlag from the raw cell value.
 * - If the value is a number (from Overall% column): < 1.0 means defect (true)
 * - If the value is TRUE/FALSE string (from audit_email column): parse as boolean
 * - If empty/missing: default to false (no defect)
 */
function toDefectFlag(value: unknown): boolean {
  if (value === '' || value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    // Overall% column: 1.0 = 100% = no defect, < 1.0 = defect
    return value < 1;
  }
  const str = String(value).trim().toUpperCase();
  // Check if it's a percentage number like "0.85" or "1"
  const num = parseFloat(str);
  if (!isNaN(num) && num >= 0 && num <= 1) {
    return num < 1;
  }
  // Fall back to boolean parsing (TRUE/FALSE from audit_email)
  return str === 'TRUE' || str === 'YES';
}

// =============================================================================
// Print Implementation
// =============================================================================

/**
 * Serializes AuditRecord objects into an .xlsx buffer.
 */
export function print(records: AuditRecord[]): Buffer {
  // Build header row
  const headers = PRINT_FIELDS.map((field) => FIELD_TO_HEADER[field]);

  // Build data rows
  const dataRows = records.map((record) =>
    PRINT_FIELDS.map((field) => {
      const value = record[field];
      if (field === 'defectFlag') {
        return value ? 'TRUE' : 'FALSE';
      }
      if (field === 'transactionWeek') {
        return Number(value);
      }
      return value ?? '';
    }),
  );

  const sheetData = [headers, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(xlsxBuffer);
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Creates an ExcelAdapter instance following the adapter pattern.
 */
export function createExcelAdapter(): ExcelAdapter {
  return { parse, print };
}
