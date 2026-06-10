import * as cheerio from 'cheerio';
import type {
  Schedule_Record,
  QuipParseResult,
  ParseWarning,
} from '../models/types';

// =============================================================================
// Quip Adapter Error Types
// =============================================================================

export interface QuipError {
  type: 'invalid_url' | 'auth_failure' | 'network_error';
  message: string;
}

// =============================================================================
// QuipAdapter Interface
// =============================================================================

export interface QuipAdapter {
  fetchAndParse(quipUrl: string, accessToken: string): Promise<QuipParseResult>;
  parseHtml(html: string): QuipParseResult;
  prettyPrint(records: Schedule_Record[]): string;
}

// =============================================================================
// Helpers
// =============================================================================

const QUIP_URL_PATTERN = /^https:\/\/quip-amazon\.com\/([A-Za-z0-9]+)/;

/**
 * Extracts the Quip thread ID from a Quip URL.
 * Throws a QuipError if the URL is invalid.
 */
export function extractThreadId(quipUrl: string): string {
  const match = quipUrl.match(QUIP_URL_PATTERN);
  if (!match) {
    throw { type: 'invalid_url', message: `Invalid Quip URL: ${quipUrl}` } as QuipError;
  }
  return match[1];
}

/** Required fields for a valid schedule row. */
const REQUIRED_FIELDS = ['associateName', 'date', 'shiftStart', 'shiftEnd'] as const;

/**
 * Known header aliases mapped to canonical Schedule_Record field names.
 * Case-insensitive matching is applied during column detection.
 */
const HEADER_ALIASES: Record<string, keyof Schedule_Record> = {
  'associate name': 'associateName',
  'associate': 'associateName',
  'name': 'associateName',
  'date': 'date',
  'shift start': 'shiftStart',
  'shift start time': 'shiftStart',
  'start time': 'shiftStart',
  'start': 'shiftStart',
  'shift end': 'shiftEnd',
  'shift end time': 'shiftEnd',
  'end time': 'shiftEnd',
  'end': 'shiftEnd',
  'activities': 'activities',
  'activity': 'activities',
  'assigned activities': 'activities',
};

/**
 * Detects column mapping from a header row.
 * Returns a map of column index → Schedule_Record field name, or null if
 * the row doesn't look like a header (must contain at least associateName and date).
 */
function detectHeaderRow(
  cells: string[],
): Map<number, keyof Schedule_Record> | null {
  const mapping = new Map<number, keyof Schedule_Record>();

  for (let i = 0; i < cells.length; i++) {
    const normalized = cells[i].trim().toLowerCase();
    const field = HEADER_ALIASES[normalized];
    if (field) {
      mapping.set(i, field);
    }
  }

  // A valid header must at least map associateName and date
  const mappedFields = new Set(mapping.values());
  if (!mappedFields.has('associateName') || !mappedFields.has('date')) {
    return null;
  }

  return mapping;
}

// =============================================================================
// Date / Time Normalization
// =============================================================================

/**
 * Normalizes a date string to ISO 8601 (YYYY-MM-DD).
 * Supports formats: YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY, M/D/YYYY, etc.
 */
export function normalizeDate(raw: string): string {
  const trimmed = raw.trim();

  // Already ISO 8601
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // MM/DD/YYYY or M/D/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    return `${slashMatch[3]}-${month}-${day}`;
  }

  // DD-MM-YYYY (ambiguous, but we treat first part as month for US convention)
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const month = dashMatch[1].padStart(2, '0');
    const day = dashMatch[2].padStart(2, '0');
    return `${dashMatch[3]}-${month}-${day}`;
  }

  // Fallback: return as-is (will be caught by validation if invalid)
  return trimmed;
}

/**
 * Normalizes a time string to 24-hour format (HH:MM).
 * Supports: HH:MM, H:MM, HH:MM AM/PM, 12-hour with am/pm.
 */
export function normalizeTime(raw: string): string {
  const trimmed = raw.trim();

  // Already 24-hour HH:MM
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // H:MM (single digit hour, 24h)
  if (/^\d:\d{2}$/.test(trimmed)) {
    return `0${trimmed}`;
  }

  // 12-hour with AM/PM
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2];
    const period = ampmMatch[3].toLowerCase();

    if (period === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period === 'am' && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  // Fallback
  return trimmed;
}

// =============================================================================
// Validation
// =============================================================================

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24H_RE = /^\d{2}:\d{2}$/;

function isValidIsoDate(s: string): boolean {
  return ISO_DATE_RE.test(s);
}

function isValidTime24(s: string): boolean {
  return TIME_24H_RE.test(s);
}

// =============================================================================
// Table Parsing
// =============================================================================

/**
 * Parses a single HTML table into Schedule_Records and warnings.
 */
function parseTable(
  $: cheerio.CheerioAPI,
  table: any,
  sheetIndex: number,
): { records: Schedule_Record[]; warnings: ParseWarning[] } {
  const records: Schedule_Record[] = [];
  const warnings: ParseWarning[] = [];

  const rows = $(table).find('tr');
  let columnMap: Map<number, keyof Schedule_Record> | null = null;
  let dataRowStart = 0;

  // Find header row
  rows.each((rowIdx, row) => {
    if (columnMap) return; // already found header

    const cells: string[] = [];
    $(row)
      .find('th, td')
      .each((_, cell) => {
        cells.push($(cell).text().trim());
      });

    const detected = detectHeaderRow(cells);
    if (detected) {
      columnMap = detected;
      dataRowStart = rowIdx + 1;
    }
  });

  if (!columnMap) {
    // No header detected — skip this table entirely
    return { records, warnings };
  }

  // Parse data rows
  const cMap: Map<number, keyof Schedule_Record> = columnMap;
  rows.each((rowIdx, row) => {
    if (rowIdx < dataRowStart) return;

    const cells: string[] = [];
    $(row)
      .find('td, th')
      .each((_, cell) => {
        cells.push($(cell).text().trim());
      });

    // Skip completely empty rows
    if (cells.every((c) => c === '')) return;

    // Extract fields using column map
    const rawFields: Partial<Record<keyof Schedule_Record, string>> = {};
    cMap.forEach((field, colIdx) => {
      if (colIdx < cells.length) {
        rawFields[field] = cells[colIdx];
      }
    });

    // Check for missing required fields
    const missingFields: string[] = [];
    for (const field of REQUIRED_FIELDS) {
      if (!rawFields[field] || rawFields[field]!.trim() === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      warnings.push({
        sheetIndex,
        rowNumber: rowIdx + 1, // 1-based
        missingFields,
      });
      return;
    }

    // Normalize and build record
    const date = normalizeDate(rawFields.date!);
    const shiftStart = normalizeTime(rawFields.shiftStart!);
    const shiftEnd = normalizeTime(rawFields.shiftEnd!);

    // Parse activities (comma-separated)
    const activitiesRaw = rawFields.activities as string | undefined;
    const activities = activitiesRaw
      ? activitiesRaw
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a !== '')
      : [];

    records.push({
      associateName: rawFields.associateName!.trim(),
      date,
      shiftStart,
      shiftEnd,
      activities,
    });
  });

  return { records, warnings };
}

// =============================================================================
// Concrete Implementation
// =============================================================================

export class QuipAdapterImpl implements QuipAdapter {
  /**
   * Fetches a Quip document by URL and parses its schedule tables.
   */
  async fetchAndParse(
    quipUrl: string,
    accessToken: string,
  ): Promise<QuipParseResult> {
    // Extract thread ID (throws QuipError on invalid URL)
    const threadId = extractThreadId(quipUrl);

    // Call Quip API
    let html: string;
    try {
      const response = await fetch(
        `https://platform.quip-amazon.com/1/threads/${threadId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 401 || response.status === 403) {
        throw {
          type: 'auth_failure',
          message: `Authentication failed: ${response.status} ${response.statusText}`,
        } as QuipError;
      }

      if (!response.ok) {
        throw {
          type: 'network_error',
          message: `Quip API error: ${response.status} ${response.statusText}`,
        } as QuipError;
      }

      const data = await response.json();
      html = data.html || '';
    } catch (err) {
      // Re-throw QuipErrors as-is
      if (
        err &&
        typeof err === 'object' &&
        'type' in err &&
        ['invalid_url', 'auth_failure', 'network_error'].includes(
          (err as QuipError).type,
        )
      ) {
        throw err;
      }
      // Wrap unexpected errors as network_error
      throw {
        type: 'network_error',
        message: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      } as QuipError;
    }

    return this.parseHtml(html);
  }

  /**
   * Parses raw HTML containing one or more schedule tables.
   */
  parseHtml(html: string): QuipParseResult {
    const $ = cheerio.load(html);
    const tables = $('table').toArray();

    const allRecords: Schedule_Record[] = [];
    const allWarnings: ParseWarning[] = [];

    tables.forEach((table, sheetIndex) => {
      const { records, warnings } = parseTable($, table, sheetIndex);
      allRecords.push(...records);
      allWarnings.push(...warnings);
    });

    return {
      records: allRecords,
      warnings: allWarnings,
      sheetCount: tables.length,
    };
  }

  /**
   * Formats Schedule_Records into a Quip-compatible HTML table string.
   */
  prettyPrint(records: Schedule_Record[]): string {
    if (records.length === 0) {
      return '<table><tr><th>Associate Name</th><th>Date</th><th>Shift Start</th><th>Shift End</th><th>Activities</th></tr></table>';
    }

    const headerRow =
      '<tr><th>Associate Name</th><th>Date</th><th>Shift Start</th><th>Shift End</th><th>Activities</th></tr>';

    const dataRows = records
      .map(
        (r) =>
          `<tr><td>${r.associateName}</td><td>${r.date}</td><td>${r.shiftStart}</td><td>${r.shiftEnd}</td><td>${r.activities.join(', ')}</td></tr>`,
      )
      .join('');

    return `<table>${headerRow}${dataRows}</table>`;
  }
}
