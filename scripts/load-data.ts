import { readFileSync, writeFileSync } from 'fs';
import { parse } from '../src/adapters/excel-adapter';

const buffer = readFileSync('2026-RQM.xlsx');
const result = parse(buffer);

writeFileSync('data/audit-records.json', JSON.stringify(result.records, null, 2));

console.log(`Parsed: ${result.records.length} records`);
console.log(`Skipped: ${result.warnings.length} rows`);
if (result.warnings.length > 0) {
  console.log('Warnings:');
  result.warnings.forEach(w => console.log(`  Row ${w.rowNumber}: missing ${w.missingFields.join(', ')}`));
}
