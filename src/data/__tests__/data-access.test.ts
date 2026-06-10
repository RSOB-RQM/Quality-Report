// =============================================================================
// Unit Tests — Data Access Layer
// =============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createDataAccess } from '../data-access';
import type { AuditRecord } from '../../models/audit-types';

/** Builds a minimal AuditRecord for testing. */
function makeRecord(overrides: Partial<AuditRecord> = {}): AuditRecord {
  return {
    team: 'RSOB',
    region: 'NA',
    disruptionType: 'ADHOC Validation',
    subTransactionType: 'Continous Scheduling',
    qaMonitoringDate: '2026-01-15',
    transactionDate: '2026-01-10',
    associateLogin: 'testuser',
    associateStatus: 'Tenured',
    supervisorLogin: 'supervisor1',
    supervisorEmail: 'supervisor1@amazon.com',
    transactionWeek: 2,
    subDisruptionType: 'CARs',
    adm: 'Yes', admFinding: '', comments1: '',
    ra: 'Yes', raFinding: '', comments2: '',
    rrc: 'Yes', rrcFinding: '', comments3: '',
    acc: 'Yes', accFinding: '', comments4: '',
    rv: 'Yes', rvFinding: '', comments5: '',
    spResponse: '', spComment: '', spocLogin: '', spocResponse: '',
    spocComment: '', reAppealFlag: '', reAppealComment: '',
    appealLeadLogin: '', appealLeadDecision: '', appealLeadComment: '',
    defectFlag: false,
    ...overrides,
  };
}

describe('DataAccess', () => {
  let testDir: string;
  let testFilePath: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `data-access-test-${randomUUID()}`);
    await mkdir(testDir, { recursive: true });
    testFilePath = join(testDir, 'audit-records.json');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('getRecords', () => {
    it('returns empty array when data file does not exist', async () => {
      const da = createDataAccess(join(testDir, 'nonexistent', 'records.json'));
      const records = await da.getRecords();
      expect(records).toEqual([]);
    });

    it('returns all records when no filter is provided', async () => {
      const records = [makeRecord({ associateLogin: 'a' }), makeRecord({ associateLogin: 'b' })];
      await writeFile(testFilePath, JSON.stringify(records));
      const da = createDataAccess(testFilePath);
      const result = await da.getRecords();
      expect(result).toHaveLength(2);
    });

    it('applies filter predicate when provided', async () => {
      const records = [
        makeRecord({ associateLogin: 'alice' }),
        makeRecord({ associateLogin: 'bob' }),
        makeRecord({ associateLogin: 'alice', transactionWeek: 3 }),
      ];
      await writeFile(testFilePath, JSON.stringify(records));
      const da = createDataAccess(testFilePath);
      const result = await da.getRecords((r) => r.associateLogin === 'alice');
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.associateLogin === 'alice')).toBe(true);
    });
  });

  describe('upsertRecords', () => {
    it('appends new records to an empty dataset', async () => {
      await writeFile(testFilePath, '[]');
      const da = createDataAccess(testFilePath);
      const newRecords = [
        makeRecord({ associateLogin: 'a', transactionDate: '2026-01-01', transactionWeek: 1 }),
        makeRecord({ associateLogin: 'b', transactionDate: '2026-01-02', transactionWeek: 1 }),
      ];
      const stats = await da.upsertRecords(newRecords);
      expect(stats).toEqual({ added: 2, replaced: 0 });

      const all = await da.getRecords();
      expect(all).toHaveLength(2);
    });

    it('replaces records with matching composite key', async () => {
      const existing = [
        makeRecord({ associateLogin: 'a', transactionDate: '2026-01-01', transactionWeek: 1, defectFlag: false }),
      ];
      await writeFile(testFilePath, JSON.stringify(existing));
      const da = createDataAccess(testFilePath);

      const updated = [
        makeRecord({ associateLogin: 'a', transactionDate: '2026-01-01', transactionWeek: 1, defectFlag: true }),
      ];
      const stats = await da.upsertRecords(updated);
      expect(stats).toEqual({ added: 0, replaced: 1 });

      const all = await da.getRecords();
      expect(all).toHaveLength(1);
      expect(all[0].defectFlag).toBe(true);
    });

    it('handles mixed adds and replaces', async () => {
      const existing = [
        makeRecord({ associateLogin: 'a', transactionDate: '2026-01-01', transactionWeek: 1 }),
        makeRecord({ associateLogin: 'b', transactionDate: '2026-01-02', transactionWeek: 1 }),
      ];
      await writeFile(testFilePath, JSON.stringify(existing));
      const da = createDataAccess(testFilePath);

      const newRecords = [
        makeRecord({ associateLogin: 'a', transactionDate: '2026-01-01', transactionWeek: 1, defectFlag: true }), // replace
        makeRecord({ associateLogin: 'c', transactionDate: '2026-01-03', transactionWeek: 1 }), // add
      ];
      const stats = await da.upsertRecords(newRecords);
      expect(stats).toEqual({ added: 1, replaced: 1 });

      const all = await da.getRecords();
      expect(all).toHaveLength(3);
    });

    it('preserves unmatched existing records', async () => {
      const existing = [
        makeRecord({ associateLogin: 'keep-me', transactionDate: '2026-02-01', transactionWeek: 5 }),
      ];
      await writeFile(testFilePath, JSON.stringify(existing));
      const da = createDataAccess(testFilePath);

      const newRecords = [
        makeRecord({ associateLogin: 'new-one', transactionDate: '2026-03-01', transactionWeek: 9 }),
      ];
      await da.upsertRecords(newRecords);

      const all = await da.getRecords();
      expect(all).toHaveLength(2);
      expect(all.find((r) => r.associateLogin === 'keep-me')).toBeDefined();
    });

    it('creates data file if it does not exist', async () => {
      const newPath = join(testDir, 'sub', 'records.json');
      const da = createDataAccess(newPath);
      const stats = await da.upsertRecords([makeRecord()]);
      expect(stats).toEqual({ added: 1, replaced: 0 });

      const all = await da.getRecords();
      expect(all).toHaveLength(1);
    });
  });
});
