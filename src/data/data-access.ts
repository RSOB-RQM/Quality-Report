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

/** Default data file path relative to process.cwd(). */
const DEFAULT_DATA_PATH = join(process.cwd(), 'data', 'audit-records.json');

/**
 * Builds a composite key for upsert matching.
 */
function compositeKey(record: AuditRecord): string {
  return `${record.associateLogin}|${record.transactionDate}|${record.transactionWeek}`;
}

/**
 * Ensures the data file exists, creating it with `[]` if missing.
 */
async function ensureDataFile(filePath: string): Promise<void> {
  try {
    await access(filePath);
  } catch {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, '[]', 'utf-8');
  }
}

/**
 * Reads all records from the JSON data file.
 */
async function readRecords(filePath: string): Promise<AuditRecord[]> {
  await ensureDataFile(filePath);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as AuditRecord[];
}

/**
 * Writes records to the data file atomically (write temp → rename).
 */
async function writeRecordsAtomically(filePath: string, records: AuditRecord[]): Promise<void> {
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(tempPath, JSON.stringify(records, null, 2), 'utf-8');
  await rename(tempPath, filePath);
}

/**
 * Creates a DataAccess instance backed by a JSON file.
 * @param dataPath — optional override for the data file location (useful for testing)
 */
export function createDataAccess(dataPath?: string): DataAccess {
  const filePath = dataPath ?? DEFAULT_DATA_PATH;

  return {
    async getRecords(filter?: RecordFilter): Promise<AuditRecord[]> {
      const records = await readRecords(filePath);
      return filter ? records.filter(filter) : records;
    },

    async upsertRecords(records: AuditRecord[]): Promise<{ added: number; replaced: number }> {
      const existing = await readRecords(filePath);

      // Index existing records by composite key
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

      await writeRecordsAtomically(filePath, existing);
      return { added, replaced };
    },
  };
}
