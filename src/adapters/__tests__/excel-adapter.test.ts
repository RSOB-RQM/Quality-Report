import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parse, print, createExcelAdapter } from '../excel-adapter';
import type { AuditRecord } from '../../models/audit-types';

// =============================================================================
// Helpers
// =============================================================================

/** Builds a minimal valid AuditRecord for testing. */
function makeRecord(overrides: Partial<AuditRecord> = {}): AuditRecord {
  return {
    team: 'RSOB',
    region: 'NA',
    disruptionType: 'ADHOC Validation',
    subTransactionType: 'Continous Scheduling',
    qaMonitoringDate: '2026-01-15',
    transactionDate: '2026-01-10',
    associateLogin: 'jdoe',
    associateStatus: 'Tenured',
    supervisorLogin: 'msmith',
    supervisorEmail: 'msmith@example.com',
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

/** Creates an xlsx buffer from header + data rows. */
function buildXlsx(headers: string[], rows: unknown[][]): Buffer {
  const sheetData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

const VALID_HEADERS = [
  'Team', 'Disruption Type', 'Sub-Transaction Type', 'QA Monitoring Date',
  'Transaction Date', 'Alogin', 'Associate Status', 'Supervisor Login',
  'Supervisor Email', 'Transaction Week', 'Sub Disruption Type',
  'DM', 'DM_A1', 'DM_Comments1',
  'RA', 'RA1_A1', 'RA_Comments',
  'RRC', 'RRC_A1', 'RRC_Comments3',
  'ACC', 'ACC_A1', 'ACC Comments4',
  'RV', 'RV_A1', 'RV_Comments',
  'Sp Response', 'SP Comment', 'spoc_login', 'SPOC Response', 'SPOC Comment',
  'Supervisor to Re-appeal', 'SP Comment2',
  'Appeal Lead Login', 'Appeal Lead on Re-appeal', 'Appeal Lead Comment',
  'audit_email',
];

function validRow(overrides: Record<number, unknown> = {}): unknown[] {
  const row: unknown[] = [
    'RSOB', 'ADHOC Validation', 'Continous Scheduling', '2026-01-15',
    '2026-01-10', 'jdoe', 'Tenured', 'msmith',
    'msmith@example.com', 3, 'CARs',
    'Yes', '', '',
    'Yes', '', '',
    'Yes', '', '',
    'Yes', '', '',
    'Yes', '', '',
    '', '', '', '', '',
    '', '',
    '', '', '',
    'FALSE',
  ];
  for (const [idx, val] of Object.entries(overrides)) {
    row[Number(idx)] = val;
  }
  return row;
}

// =============================================================================
// Tests
// =============================================================================

describe('Excel Adapter', () => {
  describe('parse', () => {
    it('parses a valid row into an AuditRecord', () => {
      const buf = buildXlsx(VALID_HEADERS, [validRow()]);
      const result = parse(buf);

      expect(result.records).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.totalRows).toBe(1);

      const rec = result.records[0];
      expect(rec.associateLogin).toBe('jdoe');
      expect(rec.supervisorLogin).toBe('msmith');
      expect(rec.transactionWeek).toBe(3);
      expect(rec.defectFlag).toBe(false);
      expect(rec.adm).toBe('Yes');
    });

    it('converts defectFlag TRUE to boolean true', () => {
      const buf = buildXlsx(VALID_HEADERS, [validRow({ 36: 'TRUE' })]);
      const result = parse(buf);

      expect(result.records[0].defectFlag).toBe(true);
    });

    it('converts transactionWeek to number', () => {
      const buf = buildXlsx(VALID_HEADERS, [validRow({ 9: '15' })]);
      const result = parse(buf);

      expect(result.records[0].transactionWeek).toBe(15);
    });

    it('skips rows missing associateLogin and records warning', () => {
      const row = validRow({ 5: '' }); // Alogin empty
      const buf = buildXlsx(VALID_HEADERS, [row]);
      const result = parse(buf);

      expect(result.records).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].missingFields).toContain('associateLogin');
    });

    it('skips rows missing supervisorLogin', () => {
      const row = validRow({ 7: '' }); // Supervisor Login empty
      const buf = buildXlsx(VALID_HEADERS, [row]);
      const result = parse(buf);

      expect(result.records).toHaveLength(0);
      expect(result.warnings[0].missingFields).toContain('supervisorLogin');
    });

    it('skips rows missing transactionWeek', () => {
      const row = validRow({ 9: '' }); // Transaction Week empty
      const buf = buildXlsx(VALID_HEADERS, [row]);
      const result = parse(buf);

      expect(result.records).toHaveLength(0);
      expect(result.warnings[0].missingFields).toContain('transactionWeek');
    });

    it('skips rows missing defectFlag', () => {
      const row = validRow({ 36: '' }); // audit_email empty
      const buf = buildXlsx(VALID_HEADERS, [row]);
      const result = parse(buf);

      expect(result.records).toHaveLength(0);
      expect(result.warnings[0].missingFields).toContain('defectFlag');
    });

    it('reports multiple missing fields in a single warning', () => {
      const row = validRow({ 5: '', 7: '', 9: '' });
      const buf = buildXlsx(VALID_HEADERS, [row]);
      const result = parse(buf);

      expect(result.warnings[0].missingFields).toEqual(
        expect.arrayContaining(['associateLogin', 'supervisorLogin', 'transactionWeek']),
      );
    });

    it('handles empty spreadsheet (no data rows)', () => {
      const buf = buildXlsx(VALID_HEADERS, []);
      const result = parse(buf);

      expect(result.records).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.totalRows).toBe(0);
    });

    it('handles spreadsheet with an empty sheet (no rows at all)', () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buf = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
      const result = parse(buf);

      expect(result.records).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.totalRows).toBe(0);
    });

    it('parses multiple valid rows', () => {
      const rows = [
        validRow(),
        validRow({ 5: 'asmith', 9: 5, 36: 'TRUE' }),
      ];
      const buf = buildXlsx(VALID_HEADERS, rows);
      const result = parse(buf);

      expect(result.records).toHaveLength(2);
      expect(result.records[0].associateLogin).toBe('jdoe');
      expect(result.records[1].associateLogin).toBe('asmith');
      expect(result.records[1].defectFlag).toBe(true);
    });

    it('includes warning row number (1-based, accounting for header)', () => {
      const rows = [
        validRow(),
        validRow({ 5: '' }), // row 3 in spreadsheet (header=1, data starts at 2)
      ];
      const buf = buildXlsx(VALID_HEADERS, rows);
      const result = parse(buf);

      expect(result.records).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].rowNumber).toBe(3);
    });
  });

  describe('print', () => {
    it('serializes records to a valid xlsx buffer', () => {
      const records = [makeRecord()];
      const buf = print(records);

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);

      // Verify it can be read back
      const wb = XLSX.read(buf, { type: 'buffer' });
      expect(wb.SheetNames).toHaveLength(1);
    });

    it('writes headers as the first row', () => {
      const buf = print([makeRecord()]);
      const wb = XLSX.read(buf, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      expect(rows[0]).toContain('Alogin');
      expect(rows[0]).toContain('Supervisor Login');
      expect(rows[0]).toContain('Transaction Week');
      expect(rows[0]).toContain('audit_email');
    });

    it('writes defectFlag as TRUE/FALSE strings', () => {
      const buf = print([makeRecord({ defectFlag: true }), makeRecord({ defectFlag: false })]);
      const wb = XLSX.read(buf, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Find the audit_email column index
      const headerRow = rows[0] as string[];
      const defectIdx = headerRow.indexOf('audit_email');
      expect(rows[1][defectIdx]).toBe('TRUE');
      expect(rows[2][defectIdx]).toBe('FALSE');
    });

    it('prints empty array as workbook with only headers', () => {
      const buf = print([]);
      const wb = XLSX.read(buf, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      expect(rows).toHaveLength(1); // header only
    });
  });

  describe('round-trip', () => {
    it('print then parse produces equivalent records', () => {
      const original = [
        makeRecord({ associateLogin: 'alice', transactionWeek: 10, defectFlag: true }),
        makeRecord({ associateLogin: 'bob', transactionWeek: 20, defectFlag: false, adm: 'No', admFinding: 'Wrong decision' }),
      ];

      const buf = print(original);
      const result = parse(buf);

      expect(result.records).toHaveLength(2);
      expect(result.warnings).toHaveLength(0);

      for (let i = 0; i < original.length; i++) {
        const orig = original[i];
        const parsed = result.records[i];
        expect(parsed.associateLogin).toBe(orig.associateLogin);
        expect(parsed.supervisorLogin).toBe(orig.supervisorLogin);
        expect(parsed.transactionWeek).toBe(orig.transactionWeek);
        expect(parsed.defectFlag).toBe(orig.defectFlag);
        expect(parsed.adm).toBe(orig.adm);
        expect(parsed.admFinding).toBe(orig.admFinding);
        expect(parsed.team).toBe(orig.team);
      }
    });
  });

  describe('createExcelAdapter', () => {
    it('returns an object with parse and print methods', () => {
      const adapter = createExcelAdapter();
      expect(typeof adapter.parse).toBe('function');
      expect(typeof adapter.print).toBe('function');
    });

    it('adapter.parse works correctly', () => {
      const adapter = createExcelAdapter();
      const buf = buildXlsx(VALID_HEADERS, [validRow()]);
      const result = adapter.parse(buf);
      expect(result.records).toHaveLength(1);
    });
  });
});
