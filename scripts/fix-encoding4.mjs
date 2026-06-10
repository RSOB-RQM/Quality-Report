import { readFileSync, writeFileSync } from 'fs';

const filePath = 'dist/index.html';
let content = readFileSync(filePath, 'utf8');
const originalLength = content.length;

// Remaining patterns to fix:
// â†" (down arrow) - â=0xE2, †=0x2020, "=0x201C - but actually looking at hex:
// The file has literal chars: â (U+00E2) followed by † (U+2020) and various chars

// Let me find all sequences starting with â (U+00E2)
let changes = 0;

// â†' = right arrow (â=E2, †=2020, '=2019) 
// â†" = down arrow
// Replace â followed by † and any next char with arrow symbols
content = content.replace(/\u00E2\u2020\u2019/g, () => { changes++; return '\u2192'; }); // →
content = content.replace(/\u00E2\u2020\u201C/g, () => { changes++; return '\u2193'; }); // ↓  
content = content.replace(/\u00E2\u2020\u0091/g, () => { changes++; return '\u2191'; }); // ↑

// ðŸ'¡ = lightbulb: ð=F0, Ÿ=0178, '=2019, ¡=A1
content = content.replace(/\u00F0\u0178\u2019\u00A1/g, () => { changes++; return '\u{1F4A1}'; });
// ðŸ"¥ = download: ð=F0, Ÿ=0178, "=201C, ¥=A5  
content = content.replace(/\u00F0\u0178\u201C\u00A5/g, () => { changes++; return '\u{1F4E5}'; });
// ðŸ"‹ = clipboard: ð=F0, Ÿ=0178, "=201C, ‹=2039
content = content.replace(/\u00F0\u0178\u201C\u2039/g, () => { changes++; return '\u{1F4CB}'; });

// Also try: ð (U+00F0) followed by Ÿ (U+0178) patterns
// ðŸ'¡ might also be: \u00F0\u0178\u2019\u00A1
// Let me check what's actually in the file at those positions

// Check remaining â characters
let idx = 0;
const remaining = [];
while ((idx = content.indexOf('\u00E2', idx)) !== -1) {
  const next1 = content.charCodeAt(idx + 1);
  const next2 = content.charCodeAt(idx + 2);
  const ctx = content.substring(Math.max(0, idx-5), Math.min(content.length, idx+15));
  remaining.push({ pos: idx, next1: next1.toString(16), next2: next2.toString(16), ctx });
  idx++;
}

console.log(`Changes made: ${changes}`);
console.log(`Remaining â (U+00E2) chars: ${remaining.length}`);
for (const r of remaining.slice(0, 15)) {
  console.log(`  pos ${r.pos}: next=U+${r.next1},U+${r.next2} [${r.ctx.replace(/\n/g, '\\n')}]`);
}

// Check remaining ð characters  
idx = 0;
const remainingF0 = [];
while ((idx = content.indexOf('\u00F0', idx)) !== -1) {
  const ctx = content.substring(Math.max(0, idx-5), Math.min(content.length, idx+15));
  remainingF0.push({ pos: idx, ctx });
  idx++;
}
console.log(`\nRemaining ð (U+00F0) chars: ${remainingF0.length}`);
for (const r of remainingF0.slice(0, 10)) {
  console.log(`  pos ${r.pos}: [${r.ctx.replace(/\n/g, '\\n')}]`);
}

writeFileSync(filePath, content, 'utf8');
console.log('\nFile saved. Length:', content.length);
