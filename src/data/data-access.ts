
// =============================================================================
// Data Access Layer — Quality Performance Dashboard
// =============================================================================

import { readFile, writeFile, rename, access, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
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

/** Data file path */
const DATA_PATH = join(process.cwd(), 'data', 'audit-records.json');

/**
 * Builds a composite key for upsert matching.
 */
function compositeKey(record: AuditRecord): string {
  return `${record.associateLogin}|${record.transactionDate}|${record.transactionWeek}`;
}

/**
 * Ensures the data file exists.
 */
async function ensureDataFile(): Promise<void> {
  try {
    await access(DATA_PATH);
  } catch {
    await mkdir(dirname(DATA_PATH), { recursive: true });
    await writeFile(DATA_PATH, '[]', 'utf-8');
  }
}

/**
 * Reads all records from the JSON data file.
 */
async function readRecords(): Promise<AuditRecord[]> {
  await ensureDataFile();
  const raw = await readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as AuditRecord[];
}

/**
 * Writes records to the data file atomically (write temp → rename).
 */
async function writeRecordsAtomically(records: AuditRecord[]): Promise<void> {
  const dir = dirname(DATA_PATH);
  await mkdir(dir, { recursive: true });
  const tempPath = join(dir, `${randomUUID()}.tmp`);
  await writeFile(tempPath, JSON.stringify(records, null, 2), 'utf-8');
  await rename(tempPath, DATA_PATH);
}

/**
 * Creates a DataAccess instance backed by a JSON file.
 */
export function createDataAccess(dataPath?: string): DataAccess {
  return {
    async getRecords(filter?: RecordFilter): Promise<AuditRecord[]> {
      const records = await readRecords();
      return filter ? records.filter(filter) : records;
    },

    async upsertRecords(records: AuditRecord[]): Promise<{ added: number; replaced: number }> {
      const existing = await readRecords();

      const existingMap = new Map<string, number>();
      for (let i = 0; i < existing.length; i++) {
        existingMap.set(compositeKey(existing[i]), i);
      }

      let added = 0;
      let replaced = 0;

      for (const record of records) {
        const key = compositeKey(record);
        const idx = existingMap.get(key);
        if (idx !== undefined) {
          existing[idx] = record;
          replaced++;
        } else {
          existing.push(record);
          existingMap.set(key, existing.length - 1);
          added++;
        }
      }

      await writeRecordsAtomically(existing);
      return { added, replaced };
    },
  };
}

