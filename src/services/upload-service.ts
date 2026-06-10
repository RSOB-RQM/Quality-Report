// =============================================================================
// Upload Service — Quality Performance Dashboard
// =============================================================================

import type { UploadResult, ExcelParseWarning } from '../models/dashboard-types';
import { createExcelAdapter } from '../adapters/excel-adapter';
import { createDataAccess, type DataAccess } from '../data/data-access';

/**
 * Orchestrates file validation, parsing, and persistence.
 */
export interface UploadService {
  processUpload(file: Buffer, filename: string): Promise<UploadResult>;
}

/**
 * XLSX files are ZIP archives — the first 4 bytes are the PK zip signature.
 */
const XLSX_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04];

/**
 * Returns a failed UploadResult with the given error message.
 */
function failResult(error: string): UploadResult {
  return {
    success: false,
    parsedCount: 0,
    skippedCount: 0,
    warnings: [],
    mergeStats: { added: 0, replaced: 0 },
    error,
  };
}

/**
 * Validates that the filename ends with .xlsx (case-insensitive).
 */
function hasXlsxExtension(filename: string): boolean {
  return filename.toLowerCase().endsWith('.xlsx');
}

/**
 * Validates that the buffer starts with the PK zip magic bytes.
 */
function hasXlsxMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return (
    buffer[0] === XLSX_MAGIC_BYTES[0] &&
    buffer[1] === XLSX_MAGIC_BYTES[1] &&
    buffer[2] === XLSX_MAGIC_BYTES[2] &&
    buffer[3] === XLSX_MAGIC_BYTES[3]
  );
}

/**
 * Creates an UploadService instance.
 * @param dataAccess — optional DataAccess override (useful for testing)
 */
export function createUploadService(dataAccess?: DataAccess): UploadService {
  const da = dataAccess ?? createDataAccess();
  const excel = createExcelAdapter();

  return {
    async processUpload(file: Buffer, filename: string): Promise<UploadResult> {
      // 1. Validate file extension
      if (!hasXlsxExtension(filename)) {
        return failResult('Invalid file format. Only .xlsx files are accepted.');
      }

      // 2. Validate magic bytes
      if (!hasXlsxMagicBytes(file)) {
        return failResult('Invalid file format. Only .xlsx files are accepted.');
      }

      // 3. Parse the Excel file
      const parseResult = excel.parse(file);

      // 4. Upsert parsed records via Data Access Layer
      const mergeStats = await da.upsertRecords(parseResult.records);

      // 5. Return result
      return {
        success: true,
        parsedCount: parseResult.records.length,
        skippedCount: parseResult.warnings.length,
        warnings: parseResult.warnings,
        mergeStats,
      };
    },
  };
}
