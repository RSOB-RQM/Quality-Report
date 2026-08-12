
// =============================================================================
// Data Access Layer — Quality Performance Dashboard
// Reads directly from XLSX file (no JSON conversion needed)
// =============================================================================

import { readFile, writeFile, rename, access, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import * as XLSX from 'xlsx';
import type { AuditRecord } from '../models/audit-types';
import type { RecordFilter } from '../access-control/access-control';

/**
 * Reads and writes the persisted audit records.
 */
export interface DataAccess {
  /** Returns all audit records, optionally filtered. */
  getRecords(filter?: RecordFilter): Promise<AuditRecord[]>;
  /** Upserts records: replaces matching keys, appends new ones. Returns merge stats. */
  upsertRecords(records: AuditRecord[]): Promise<{ added: number; replaced: number }>;
}

/** Data file paths */
const XLSX_DATA_PATH = join(process.cwd(), 'data', 'RSOB-All-Weeks-Data-WK1-31.xlsx');
const JSON_DATA_PATH = join(process.env.NODE_ENV === 'production' ? '/tmp' : join(process.cwd(), 'data'), 'audit-records.json');

/**
 * Builds a composite key for upsert matching.
 */
function compositeKey(record: AuditRecord): string {
  return `${record.associateLogin}|${record.transactionDate}|${record.transactionWeek}`;
}

/**
 * Parses a single XLSX row into an AuditRecord.
 */
function parseXlsxRow(row: Record<string, unknown>): AuditRecord {
  const safeStr = (val: unknown, fallback = ''): string => {
    if (val === null || val === undefined || val === '') return fallback;
    const s = String(val).trim();
    if (s.endsWith('.0') && /^\d+\.0$/.test(s)) return s.slice(0, -2);
    return s;
  };

  const safeDate = (val: unknown): string => {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'number') {
      const date = XLSX.SSF.parse_date_code(val);
      if (date) {
        const y = date.y;
        const m = String(date.m).padStart(2, '0');
        const d = String(date.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return s;
  };

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
 * Reads records from the XLSX file.
 */
async function readFromXlsx(): Promise<AuditRecord[]> {
  try {
    await access(XLSX_DATA_PATH);
  } catch {
    console.warn('XLSX data file not found at:', XLSX_DATA_PATH);
    return [];
  }

  const buffer = await readFile(XLSX_DATA_PATH);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const sheetName = workbook.SheetNames.includes('All Weeks Data')
    ? 'All Weeks Data'
    : workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

  return rows.map(parseXlsxRow);
}

/**
 * Reads records from JSON (for upserted data in /tmp).
 */
async function readFromJson(): Promise<AuditRecord[]> {
  try {
    await access(JSON_DATA_PATH);
    const raw = await readFile(JSON_DATA_PATH, 'utf-8');
    return JSON.parse(raw) as AuditRecord[];
  } catch {
    return [];
  }
}

/**
 * Writes records to the data file atomically (write temp → rename).
 */
async function writeRecordsAtomically(filePath: string, records: AuditRecord[]): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  const tempPath = join(dir, `${randomUUID()}.tmp`);
  await writeFile(tempPath, JSON.stringify(records), 'utf-8');
  await rename(tempPath, filePath);
}

/**
 * Creates a DataAccess instance that reads directly from XLSX.
 */
export function createDataAccess(dataPath?: string): DataAccess {
  let cachedRecords: AuditRecord[] | null = null;

  return {
    async getRecords(filter?: RecordFilter): Promise<AuditRecord[]> {
      if (!cachedRecords) {
        cachedRecords = await readFromXlsx();

        const upsertedRecords = await readFromJson();
        if (upsertedRecords.length > 0) {
          const existingKeys = new Set(cachedRecords.map(compositeKey));
          for (const r of upsertedRecords) {
            if (!existingKeys.has(compositeKey(r))) {
              cachedRecords.push(r);
            }
          }
        }
      }

      return filter ? cachedRecords.filter(filter) : cachedRecords;
    },

    async upsertRecords(records: AuditRecord[]): Promise<{ added: number; replaced: number }> {
      const existing = cachedRecords ?? await readFromXlsx();
      const upserted = await readFromJson();
      const allExisting = [...existing, ...upserted];

      const existingMap = new Map<string, number>();
      for (let i = 0; i < allExisting.length; i++) {
        existingMap.set(compositeKey(allExisting[i]), i);
      }

      let added = 0;
      let replaced = 0;

      for (const record of records) {
        const key = compositeKey(record);
        const idx = existingMap.get(key);
        if (idx !== undefined) {
          allExisting[idx] = record;
          replaced++;
        } else {
          allExisting.push(record);
          existingMap.set(key, allExisting.length - 1);
          added++;
        }
      }

      await writeRecordsAtomically(JSON_DATA_PATH, allExisting);
      cachedRecords = null;

      return { added, replaced };
    },
  };
}

