import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('dist/index.html', 'utf8');

// Fix the escapeCsv function where s.includes('\n') got split across lines
// The pattern is: a real newline inside a JS string literal between single quotes
// We need to find the escapeCsv function and fix it
const escapeCsvIdx = c.indexOf('function escapeCsv');
console.log('escapeCsv at:', escapeCsvIdx);

// Get the area around it (the function is short, ~200 chars)
const region = c.substring(escapeCsvIdx, escapeCsvIdx + 300);
console.log('Region:', JSON.stringify(region.substring(0, 200)));

// The issue: includes('\n') has a real newline between the quotes
// Replace real newline between single quotes that's inside includes()
let fixed = c.replace(
  /includes\('\n'\)/g,
  "includes('\\n')"
);

const changes = c.length - fixed.length;
console.log('Changes:', c !== fixed);

writeFileSync('dist/index.html', fixed, 'utf8');
console.log('Saved');
