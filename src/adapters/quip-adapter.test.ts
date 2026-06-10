import { describe, it, expect } from 'vitest';
import {
  QuipAdapterImpl,
  extractThreadId,
  normalizeDate,
  normalizeTime,
} from './quip-adapter';
import type { QuipError } from './quip-adapter';

// =============================================================================
// extractThreadId
// =============================================================================

describe('extractThreadId', () => {
  it('extracts thread ID from a valid Quip URL', () => {
    expect(
      extractThreadId(
        'https://quip-amazon.com/Lf0yAReyyq9l/OBRS-Q4-Q126-Shift-Schedule-Sept-Jan26',
      ),
    ).toBe('Lf0yAReyyq9l');
  });

  it('throws invalid_url for a non-Quip URL', () => {
    expect(() => extractThreadId('https://example.com/foo')).toThrow();
    try {
      extractThreadId('https://example.com/foo');
    } catch (e) {
      expect((e as QuipError).type).toBe('invalid_url');
    }
  });

  it('throws invalid_url for an empty string', () => {
    try {
      extractThreadId('');
    } catch (e) {
      expect((e as QuipError).type).toBe('invalid_url');
    }
  });
});

// =============================================================================
// normalizeDate
// =============================================================================

describe('normalizeDate', () => {
  it('passes through ISO 8601 dates', () => {
    expect(normalizeDate('2025-01-15')).toBe('2025-01-15');
  });

  it('converts MM/DD/YYYY to ISO', () => {
    expect(normalizeDate('01/15/2025')).toBe('2025-01-15');
  });

  it('converts M/D/YYYY to ISO', () => {
    expect(normalizeDate('1/5/2025')).toBe('2025-01-05');
  });
});

// =============================================================================
// normalizeTime
// =============================================================================

describe('normalizeTime', () => {
  it('passes through HH:MM 24-hour times', () => {
    expect(normalizeTime('09:30')).toBe('09:30');
  });

  it('pads single-digit hours', () => {
    expect(normalizeTime('9:30')).toBe('09:30');
  });

  it('converts 12-hour AM to 24-hour', () => {
    expect(normalizeTime('9:30 AM')).toBe('09:30');
  });

  it('converts 12-hour PM to 24-hour', () => {
    expect(normalizeTime('2:30 PM')).toBe('14:30');
  });

  it('handles 12:00 PM as noon', () => {
    expect(normalizeTime('12:00 PM')).toBe('12:00');
  });

  it('handles 12:00 AM as midnight', () => {
    expect(normalizeTime('12:00 AM')).toBe('00:00');
  });
});

// =============================================================================
// parseHtml
// =============================================================================

describe('QuipAdapterImpl.parseHtml', () => {
  const adapter = new QuipAdapterImpl();

  it('parses a single table with valid rows', () => {
    const html = `
      <table>
        <tr><th>Associate Name</th><th>Date</th><th>Shift Start</th><th>Shift End</th><th>Activities</th></tr>
        <tr><td>Alice</td><td>2025-01-15</td><td>09:00</td><td>17:00</td><td>Phone, Chat</td></tr>
        <tr><td>Bob</td><td>2025-01-15</td><td>10:00</td><td>18:00</td><td>Email</td></tr>
      </table>
    `;

    const result = adapter.parseHtml(html);

    expect(result.sheetCount).toBe(1);
    expect(result.records).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);

    expect(result.records[0]).toEqual({
      associateName: 'Alice',
      date: '2025-01-15',
      shiftStart: '09:00',
      shiftEnd: '17:00',
      activities: ['Phone', 'Chat'],
    });

    expect(result.records[1]).toEqual({
      associateName: 'Bob',
      date: '2025-01-15',
      shiftStart: '10:00',
      shiftEnd: '18:00',
      activities: ['Email'],
    });
  });

  it('skips incomplete rows and produces warnings', () => {
    const html = `
      <table>
        <tr><th>Associate Name</th><th>Date</th><th>Shift Start</th><th>Shift End</th></tr>
        <tr><td>Alice</td><td>2025-01-15</td><td>09:00</td><td>17:00</td></tr>
        <tr><td></td><td>2025-01-15</td><td>09:00</td><td>17:00</td></tr>
        <tr><td>Charlie</td><td></td><td>09:00</td><td></td></tr>
      </table>
    `;

    const result = adapter.parseHtml(html);

    expect(result.records).toHaveLength(1);
    expect(result.records[0].associateName).toBe('Alice');

    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0].missingFields).toContain('associateName');
    expect(result.warnings[1].missingFields).toContain('date');
    expect(result.warnings[1].missingFields).toContain('shiftEnd');
  });

  it('parses multiple tables (multi-sheet)', () => {
    const html = `
      <table>
        <tr><th>Name</th><th>Date</th><th>Start Time</th><th>End Time</th></tr>
        <tr><td>Alice</td><td>2025-01-15</td><td>09:00</td><td>17:00</td></tr>
      </table>
      <table>
        <tr><th>Associate</th><th>Date</th><th>Shift Start</th><th>Shift End</th></tr>
        <tr><td>Bob</td><td>2025-01-16</td><td>10:00</td><td>18:00</td></tr>
      </table>
    `;

    const result = adapter.parseHtml(html);

    expect(result.sheetCount).toBe(2);
    expect(result.records).toHaveLength(2);
    expect(result.records[0].associateName).toBe('Alice');
    expect(result.records[1].associateName).toBe('Bob');
  });

  it('normalizes dates and times from various formats', () => {
    const html = `
      <table>
        <tr><th>Associate Name</th><th>Date</th><th>Shift Start</th><th>Shift End</th></tr>
        <tr><td>Alice</td><td>01/15/2025</td><td>9:00 AM</td><td>5:00 PM</td></tr>
      </table>
    `;

    const result = adapter.parseHtml(html);

    expect(result.records[0].date).toBe('2025-01-15');
    expect(result.records[0].shiftStart).toBe('09:00');
    expect(result.records[0].shiftEnd).toBe('17:00');
  });

  it('returns empty results for HTML with no tables', () => {
    const result = adapter.parseHtml('<div>No tables here</div>');

    expect(result.sheetCount).toBe(0);
    expect(result.records).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('returns empty results for a table with no recognizable header', () => {
    const html = `
      <table>
        <tr><td>foo</td><td>bar</td><td>baz</td></tr>
        <tr><td>1</td><td>2</td><td>3</td></tr>
      </table>
    `;

    const result = adapter.parseHtml(html);

    expect(result.sheetCount).toBe(1);
    expect(result.records).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('handles rows with empty activities gracefully', () => {
    const html = `
      <table>
        <tr><th>Associate Name</th><th>Date</th><th>Shift Start</th><th>Shift End</th><th>Activities</th></tr>
        <tr><td>Alice</td><td>2025-01-15</td><td>09:00</td><td>17:00</td><td></td></tr>
      </table>
    `;

    const result = adapter.parseHtml(html);

    expect(result.records[0].activities).toEqual([]);
  });

  it('skips completely empty rows without producing warnings', () => {
    const html = `
      <table>
        <tr><th>Associate Name</th><th>Date</th><th>Shift Start</th><th>Shift End</th></tr>
        <tr><td>Alice</td><td>2025-01-15</td><td>09:00</td><td>17:00</td></tr>
        <tr><td></td><td></td><td></td><td></td></tr>
      </table>
    `;

    const result = adapter.parseHtml(html);

    expect(result.records).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
  });
});

// =============================================================================
// prettyPrint
// =============================================================================

describe('QuipAdapterImpl.prettyPrint', () => {
  const adapter = new QuipAdapterImpl();

  it('produces a table with header and data rows', () => {
    const records = [
      {
        associateName: 'Alice',
        date: '2025-01-15',
        shiftStart: '09:00',
        shiftEnd: '17:00',
        activities: ['Phone', 'Chat'],
      },
    ];

    const html = adapter.prettyPrint(records);

    expect(html).toContain('<table>');
    expect(html).toContain('Associate Name');
    expect(html).toContain('Alice');
    expect(html).toContain('Phone, Chat');
  });

  it('produces a header-only table for empty records', () => {
    const html = adapter.prettyPrint([]);

    expect(html).toContain('<table>');
    expect(html).toContain('Associate Name');
  });
});
