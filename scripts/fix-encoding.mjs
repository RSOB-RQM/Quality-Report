import { readFileSync, writeFileSync } from 'fs';

const filePath = 'dist/index.html';
let content = readFileSync(filePath, 'utf8');
const originalLength = content.length;

// Replace Unicode special characters with ASCII equivalents
const replacements = [
  [/\u2019/g, "'"],      // right single quote
  [/\u2018/g, "'"],      // left single quote
  [/\u201C/g, '"'],      // left double quote
  [/\u201D/g, '"'],      // right double quote
  [/\u2013/g, '-'],      // en-dash
  [/\u2014/g, '-'],      // em-dash
  [/\u2026/g, '...'],    // ellipsis
  [/\u2192/g, '->'],     // right arrow
  [/\u2190/g, '<-'],     // left arrow
  [/\u00E2\u0080\u0093/g, '-'],   // broken UTF-8 em-dash (â€")
  [/\u00E2\u0080\u0094/g, '-'],   // broken UTF-8 em-dash (â€")
  [/\u00E2\u0080\u0099/g, "'"],   // broken UTF-8 right quote (â€™)
  [/\u00E2\u0080\u0098/g, "'"],   // broken UTF-8 left quote (â€˜)
  [/\u00E2\u0080\u009C/g, '"'],   // broken UTF-8 left double quote (â€œ)
  [/\u00E2\u0080\u009D/g, '"'],   // broken UTF-8 right double quote (â€)
  [/\u00E2\u0080\u00A6/g, '...'], // broken UTF-8 ellipsis (â€¦)
  [/\u00E2\u0086\u0092/g, '->'],  // broken UTF-8 right arrow (â†')
  [/\u00E2\u0080\u00B2/g, "'"],   // broken UTF-8 prime
];

let changeCount = 0;
for (const [pattern, replacement] of replacements) {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`Replacing ${matches.length} instances of pattern -> "${replacement}"`);
    changeCount += matches.length;
  }
  content = content.replace(pattern, replacement);
}

// Also handle the specific broken pattern: â€ followed by . (which is â€ + closing quote that got corrupted)
// This handles cases like: "SWA laneâ€." which should be: "SWA lane"
const brokenQuotePattern = /\u00E2\u0080[\u0080-\u00BF]/g;
const remaining = content.match(brokenQuotePattern);
if (remaining) {
  console.log(`Found ${remaining.length} remaining broken sequences`);
  for (const m of remaining) {
    const hex = [...m].map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ');
    const idx = content.indexOf(m);
    const ctx = content.substring(Math.max(0, idx-20), Math.min(content.length, idx+40));
    console.log(`  hex: ${hex} context: [${ctx.replace(/\n/g, '\\n')}]`);
  }
}

console.log(`\nTotal replacements: ${changeCount}`);
console.log(`Original length: ${originalLength}, New length: ${content.length}`);

writeFileSync(filePath, content, 'utf8');
console.log('File saved successfully.');
