import { readFileSync, writeFileSync } from 'fs';

const filePath = 'dist/index.html';
let content = readFileSync(filePath, 'utf8');
const originalLength = content.length;

// Find all remaining non-ASCII characters and their contexts
let changeCount = 0;

// Replace â†' (broken right arrow: 0xE2 0x86 0x92 when read as latin1 gives â†')
// Actually these are proper UTF-8 chars that display correctly in UTF-8
// Let's find all chars > 127 and see what they are
const nonAscii = [];
for (let i = 0; i < content.length; i++) {
  const code = content.charCodeAt(i);
  if (code > 127) {
    const ctx = content.substring(Math.max(0, i-15), Math.min(content.length, i+15));
    nonAscii.push({ pos: i, code, char: content[i], ctx: ctx.replace(/\n/g, '\\n') });
  }
}

console.log(`Found ${nonAscii.length} non-ASCII characters`);

// Group by character
const charGroups = {};
for (const item of nonAscii) {
  const key = item.code.toString(16);
  if (!charGroups[key]) charGroups[key] = { count: 0, char: item.char, samples: [] };
  charGroups[key].count++;
  if (charGroups[key].samples.length < 2) charGroups[key].samples.push(item.ctx);
}

for (const [hex, info] of Object.entries(charGroups)) {
  console.log(`  U+${hex.toUpperCase()} (${info.char}): ${info.count} times`);
  for (const s of info.samples) console.log(`    sample: [${s}]`);
}

// Replace all problematic characters
// â†' is U+2192 (right arrow) - already proper unicode, replace with ->
content = content.replace(/\u2192/g, '->');
// â†' as broken: â = U+00E2, † = U+0086 (not printable), ' = various
// Actually let's check: the string "â†'" is 3 chars: â(0xE2) †(0x86) '(0x92) - but wait
// In the file these might be the actual bytes E2 86 92 which IS the UTF-8 encoding of →
// But since we read as UTF-8, it should already be → (U+2192)
// Unless the file has double-encoding issues

// Let's just replace any remaining non-ASCII in the JS strings
// The â character (U+00E2) followed by specific chars indicates double-encoded UTF-8
// â = 0xC3 0xA2 in UTF-8, but if the original bytes were 0xE2 0x86 0x92 (→ in UTF-8)
// and they got interpreted as Latin-1 then re-encoded as UTF-8, we'd get:
// 0xE2 -> â (C3 A2), 0x86 -> † (C2 86), 0x92 -> ' (C2 92)
// So "â†'" in the file = double-encoded → 

// Replace double-encoded patterns
content = content.replace(/\u00E2\u0086\u2019/g, '->');  // â†' 
content = content.replace(/\u00E2\u0080\u201C/g, '-');   // â€" (em-dash double encoded)
content = content.replace(/\u00E2\u0080\u201D/g, '-');   // â€" variant
content = content.replace(/\u00E2\u0080\u2122/g, "'");   // â€™ (right quote)
content = content.replace(/\u00E2\u0080\u02DC/g, "'");   // â€˜ (left quote)

// Simple approach: replace the literal string sequences
content = content.replace(/â†'/g, '->');
content = content.replace(/â€"/g, '-');
content = content.replace(/â€œ/g, '"');
content = content.replace(/â€\u009D/g, '"');
content = content.replace(/â€™/g, "'");
content = content.replace(/â€˜/g, "'");
content = content.replace(/â€¦/g, '...');
content = content.replace(/â€/g, '"');  // catch remaining â€ patterns

console.log(`\nOriginal length: ${originalLength}, New length: ${content.length}`);
writeFileSync(filePath, content, 'utf8');
console.log('File saved.');

// Verify no more â characters
const remaining = content.indexOf('\u00E2');
console.log('Remaining â chars at:', remaining);
if (remaining >= 0) {
  console.log('Context:', JSON.stringify(content.substring(Math.max(0,remaining-10), remaining+20)));
}
