// =============================================================================
// Upload Service — Unit Tests
// =============================================================================

import { describe, it, expect } from 'vitest';
import { createUploadService } from '../upload-service';
import { print } from '../../adapters/excel-adapter';
import type { AuditRecord } from '../../models/audit-types';
import type { DataAccess } from '../../data/data-access';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal valid AuditRecord for testing. */
function makeRecord(overrides: Partial<AuditRecord> = {}): AuditRecord {
  return {
    team: 'RSOB',
    region: 'NA',
    disruptionType: 'Cancel Validation',
    subTransactionType: 'Continuous Scheduling',
    qaMonitoringDate: '2026-01-15',
    transactionDate: '2026-01-10',
    associateLogin: 'testuser',
    associateStatus: 'Tenured',
    supervisorLogin: 'supervisor1',
    supervisorEmail: 'supervisor1@example.com',
    transactionWeek: 3,
    subDisruptionType: 'CARs',
    adm: 'Yes',
    admFinding: '',
    comments1: '',
    ra: 'Yes',
    raFinding: '',
    comments2: '',
    rrc: 'Yes',
    rrcFinding: '',
    comments3: '',
    acc: 'Yes',
    accFinding: '',
    comments4: '',
    rv: 'Yes',
    rvFinding: '',
    comments5: '',
    spResponse: '',
    spComment: '',
    spocLogin: '',
    spocResponse: '',
    spocComment: '',
    reAppealFlag: '',
    reAppealComment: '',
    appealLeadLogin: '',
    appealLeadDecision: '',
    appealLeadComment: '',
    defectFlag: false,
    ...overrides,
  };
}

/** Creates an in-memory DataAccess stub that tracks upserted records. */
function createStubDataAccess(): DataAccess & { records: AuditRecord[] } {
  const records: AuditRecord[] = [];
  return {
    records,
    async getRecords(filter?) {
      return filter ? records.filter(filter) : [...records];
    },
    async upsertRecords(newRecords) {
      const added = newRecords.length;
      records.push(...newRecords);
      return { added, replaced: 0 };
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UploadService', () => {
  describe('file validation', () => {
    it('rejects non-.xlsx filename', async () => {
      const da = createStubDataAccess();
      const service = createUploadService(da);

      const result = await service.processUpload(Buffer.from('hello'), 'data.csv');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid file format. Only .xlsx files are accepted.');
      expect(result.parsedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
    });

    it('rejects .xlsx filename with invalid magic bytes', async () => {
      const da = createStubDataAccess();
      const service = createUploadService(da);

      const result = await service.processUpload(Buffer.from('not-a-zip'), 'data.xlsx');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid file format. Only .xlsx files are accepted.');
    });

    it('rejects empty buffer with .xlsx extension', async () => {
      const da = createStubDataAccess();
      const service = createUploadService(da);

      const result = await service.processUpload(Buffer.alloc(0), 'data.xlsx');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid file format. Only .xlsx files are accepted.');
    });
  });

  describe('successful upload', () => {
    it('parses valid .xlsx and returns correct counts', async () => {
      const da = createStubDataAccess();
      const service = createUploadService(da);

      const records = [makeRecord(), makeRecord({ associateLogin: 'user2', transactionWeek: 4 })];
      const xlsxBuffer = print(records);

      const result = await service.processUpload(xlsxBuffer, 'audit-data.xlsx');

      expect(result.success).toBe(true);
      expect(result.parsedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.mergeStats.added).toBe(2);
    });

    it('accepts .XLSX extension (case-insensitive)', async () => {
      const da = createStubDataAccess();
      const service = createUploadService(da);

      const records = [makeRecord()];
      const xlsxBuffer = print(records);

      const result = await service.processUpload(xlsxBuffer, 'DATA.XLSX');

      expect(result.success).toBe(true);
      expect(result.parsedCount).toBe(1);
    });

    it('returns merge stats from data access layer', async () => {
      // Custom DA that simulates replacements
      const da: DataAccess = {
        async getRecords() { return []; },
        async upsertRecords() { return { added: 1, replaced: 3 }; },
      };
      const service = createUploadService(da);

      const records = [makeRecord()];
      const xlsxBuffer = print(records);

      const result = await service.processUpload(xlsxBuffer, 'data.xlsx');

      expect(result.success).toBe(true);
      expect(result.mergeStats).toEqual({ added: 1, replaced: 3 });
    });
  });
});
