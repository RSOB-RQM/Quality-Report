// =============================================================================
// Excel Adapter — Parses uploaded files into AuditRecord format
// Note: XLSX parsing disabled for Amplify compatibility.
// Upload raw JSON or use the pre-loaded audit-records.json instead.
// =============================================================================

import type { AuditRecord } from '../models/audit-types';
import type { ExcelParseWarning } from '../models/dashboard-types';

/**
 * Safely converts a value to string.
 */
function safeStr(val: unknown, fallback = ''): string {
  if (val === null || val === undefined || val === '') return fallback;
  const s = String(val).trim();
  if (s.endsWith('.0') && /^\d+\.0$/.test(s)) return s.slice(0, -2);
  return s;
}

/**
 * Safely converts a value to a date string (YYYY-MM-DD).
 */
function safeDate(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

/**
 * Parses a single row into an AuditRecord.
 */
function parseRow(row: Record<string, unknown>): AuditRecord {
  const defectVal = row['defectFlag'];
  let defectFlag = false;
  if (typeof defectVal === 'boolean') defectFlag = defectVal;
  else if (typeof defectVal === 'string') defectFlag = defectVal.toUpperCase() === 'TRUE';
  else if (typeof defectVal === 'number') defectFlag = defectVal === 1;

  return {
    transactionId: safeStr(row['transactionId']),
    team: safeStr(row['team'], 'RSOB'),
    region: safeStr(row['region'], 'NA'),
    disruptionType: safeStr(row['disruptionType']),
    subTransactionType: safeStr(row['subTransactionType']),
    qaMonitoringDate: safeDate(row['qaMonitoringDate']),
    transactionDate: safeDate(row['transactionDate']),
    associateLogin: safeStr(row['associateLogin']),
    associateStatus: safeStr(row['associateStatus']),
    supervisorLogin: safeStr(row['supervisorLogin']),
    supervisorEmail: safeStr(row['supervisorEmail']),
    transactionWeek: Number(row['transactionWeek']) || 0,
    subDisruptionType: safeStr(row['subDisruptionType']),
    adm: safeStr(row['adm'], 'Yes'),
    admFinding: safeStr(row['admFinding']),
    comments1: safeStr(row['comments1']),
    ra: safeStr(row['ra'], 'Yes'),
    raFinding: safeStr(row['raFinding']),
    comments2: safeStr(row['comments2']),
    rrc: safeStr(row['rrc'], 'Yes'),
    rrcFinding: safeStr(row['rrcFinding']),
    comments3: safeStr(row['comments3']),
    acc: safeStr(row['acc'], 'Yes'),
    accFinding: safeStr(row['accFinding']),
    comments4: safeStr(row['comments4']),
    rv: safeStr(row['rv'], 'Yes'),
    rvFinding: safeStr(row['rvFinding']),
    comments5: safeStr(row['comments5']),
    spResponse: safeStr(row['spResponse']),
    spComment: safeStr(row['spComment']),
    spocLogin: safeStr(row['spocLogin']),
    spocResponse: safeStr(row['spocResponse']),
    spocComment: safeStr(row['spocComment']),
    reAppealFlag: safeStr(row['reAppealFlag']),
    reAppealComment: safeStr(row['reAppealComment']),
    appealLeadLogin: safeStr(row['appealLeadLogin']),
    appealLeadDecision: safeStr(row['appealLeadDecision']),
    appealLeadComment: safeStr(row['appealLeadComment']),
    defectFlag,
  };
}

/**
 * Parses an uploaded buffer into AuditRecord[].
 * Supports JSON format.
 */
export async function parseExcelBuffer(buffer: Buffer): Promise<AuditRecord[]> {
  try {
    const text = buffer.toString('utf-8');
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data.map(parseRow);
    }
  } catch {
    console.warn('Upload parsing: Only JSON format is supported in this deployment.');
  }
  return [];
}

/**
 * Creates an excel adapter instance (for upload-service compatibility).
 */
export function createExcelAdapter() {
  return {
    parse: (file: Buffer): { records: AuditRecord[]; warnings: ExcelParseWarning[] } => {
      try {
        const text = file.toString('utf-8');
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          return { records: data.map(parseRow), warnings: [] };
        }
      } catch {
        // Not JSON format
      }
      return {
        records: [],
        warnings: [{ row: 0, message: 'Only JSON format is supported in this deployment.' } as ExcelParseWarning],
      };
    },
  };
}

export { parseRow, safeStr, safeDate };
