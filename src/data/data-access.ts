
// =============================================================================
// Data Access Layer — Quality Performance Dashboard
// =============================================================================

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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

/**
 * Multiple possible paths where the data file might live at runtime.
 */
const POSSIBLE_PATHS = [
  join(process.cwd(), 'data', 'audit-records.json'),
  join(process.cwd(), '.next', 'server', 'data', 'audit-records.json'),
  join(process.cwd(), '.next', 'standalone', 'data', 'audit-records.json'),
  '/var/task/data/audit-records.json',
  '/var/task/.next/server/data/audit-records.json',
];

/**
 * Tries multiple file paths to find and read the data file.
 */
async function readRecords(): Promise<AuditRecord[]> {
  for (const filePath of POSSIBLE_PATHS) {
    try {
      const raw = await readFile(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        console.log('Successfully loaded data from:', filePath, 'Records:', data.length);
        return data as AuditRecord[];
      }
    } catch {
      // Try next path
    }
  }
  console.warn('Could not find audit-records.json in any known path. Returning empty array.');
  console.warn('Tried paths:', POSSIBLE_PATHS);
  return [];
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
      // In serverless environment, file writes are not persistent.
      // This is a no-op for Amplify deployment. Use the upload API to update data.
      console.warn('upsertRecords called but file system is read-only in serverless mode.');
      return { added: 0, replaced: 0 };
    },
  };
}

