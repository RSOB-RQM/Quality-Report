import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { QuipAdapterImpl } from '../quip-adapter';

/**
 * Feature: schedule-dashboard, Property 1: Quip parsing produces correct Schedule_Records
 *
 * Validates: Requirements 1.1, 1.4
 *
 * For any valid HTML table containing schedule rows with all required fields
 * (associate name, date, shift start, shift end), parsing the table SHALL produce
 * one Schedule_Record per valid row, and each record's fields SHALL match the
 * corresponding cell values from the HTML.
 */

// =============================================================================
// Generators
// =============================================================================

/** Generate a non-empty associate name (letters and spaces, no commas or HTML). */
const arbAssociateName = fc
  .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('')), {
    minLength: 1,
    maxLength: 30,
  })
  .filter((s) => s.trim().length > 0)
  .map((s) => s.trim());

/** Generate a valid ISO 8601 date string (YYYY-MM-DD). */
const arbIsoDate = fc
  .record({
    year: fc.integer({ min: 2020, max: 2030 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }), // stay safe with day range
  })
  .map(({ year, month, day }) => {
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  });

/** Generate a valid 24-hour time string (HH:MM). */
const arbTime24 = fc
  .record({
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
  })
  .map(({ hour, minute }) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  });

/** Generate a list of activity strings (simple alpha words, no commas or HTML). */
const arbActivities = fc.array(
  fc
    .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), {
      minLength: 1,
      maxLength: 15,
    }),
  { minLength: 0, maxLength: 4 },
);

/** A single valid schedule row with all required fields. */
const arbScheduleRow = fc.record({
  associateName: arbAssociateName,
  date: arbIsoDate,
  shiftStart: arbTime24,
  shiftEnd: arbTime24,
  activities: arbActivities,
});

/** Generate a non-empty array of valid schedule rows. */
const arbScheduleRows = fc.array(arbScheduleRow, { minLength: 1, maxLength: 10 });

// =============================================================================
// Helper: Build HTML table from schedule rows
// =============================================================================

function buildHtmlTable(
  rows: Array<{
    associateName: string;
    date: string;
    shiftStart: string;
    shiftEnd: string;
    activities: string[];
  }>,
): string {
  const header =
    '<tr><th>Associate Name</th><th>Date</th><th>Shift Start</th><th>Shift End</th><th>Activities</th></tr>';

  const dataRows = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.associateName)}</td><td>${r.date}</td><td>${r.shiftStart}</td><td>${r.shiftEnd}</td><td>${r.activities.join(', ')}</td></tr>`,
    )
    .join('');

  return `<table>${header}${dataRows}</table>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// =============================================================================
// Property Test
// =============================================================================

describe('Feature: schedule-dashboard, Property 1: Quip parsing produces correct Schedule_Records', () => {
  const adapter = new QuipAdapterImpl();

  it('produces one Schedule_Record per valid row with matching field values', () => {
    fc.assert(
      fc.property(arbScheduleRows, (rows) => {
        const html = buildHtmlTable(rows);
        const result = adapter.parseHtml(html);

        // One record per valid row
        expect(result.records).toHaveLength(rows.length);

        // No warnings for fully valid rows
        expect(result.warnings).toHaveLength(0);

        // Sheet count is 1 (single table)
        expect(result.sheetCount).toBe(1);

        // Each record matches the corresponding input row
        for (let i = 0; i < rows.length; i++) {
          const input = rows[i];
          const record = result.records[i];

          expect(record.associateName).toBe(input.associateName);
          expect(record.date).toBe(input.date);
          expect(record.shiftStart).toBe(input.shiftStart);
          expect(record.shiftEnd).toBe(input.shiftEnd);

          // Activities: filter out empty strings to match adapter behavior
          const expectedActivities = input.activities.filter((a) => a.trim() !== '');
          expect(record.activities).toEqual(expectedActivities);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('produces correct records across multiple tables (multi-sheet)', () => {
    fc.assert(
      fc.property(
        fc.array(arbScheduleRows, { minLength: 1, maxLength: 4 }),
        (tables) => {
          const html = tables.map((rows) => buildHtmlTable(rows)).join('');
          const result = adapter.parseHtml(html);

          const totalRows = tables.reduce((sum, t) => sum + t.length, 0);

          // One record per valid row across all tables
          expect(result.records).toHaveLength(totalRows);

          // Sheet count matches number of tables
          expect(result.sheetCount).toBe(tables.length);

          // No warnings
          expect(result.warnings).toHaveLength(0);

          // Verify field values in order
          let recordIdx = 0;
          for (const rows of tables) {
            for (const input of rows) {
              const record = result.records[recordIdx];
              expect(record.associateName).toBe(input.associateName);
              expect(record.date).toBe(input.date);
              expect(record.shiftStart).toBe(input.shiftStart);
              expect(record.shiftEnd).toBe(input.shiftEnd);

              const expectedActivities = input.activities.filter((a) => a.trim() !== '');
              expect(record.activities).toEqual(expectedActivities);
              recordIdx++;
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('each record contains all required fields from the input', () => {
    fc.assert(
      fc.property(arbScheduleRows, (rows) => {
        const html = buildHtmlTable(rows);
        const result = adapter.parseHtml(html);

        for (const record of result.records) {
          // All required fields are present and non-empty
          expect(record.associateName).toBeTruthy();
          expect(record.date).toBeTruthy();
          expect(record.shiftStart).toBeTruthy();
          expect(record.shiftEnd).toBeTruthy();
          // activities is always an array
          expect(Array.isArray(record.activities)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});
