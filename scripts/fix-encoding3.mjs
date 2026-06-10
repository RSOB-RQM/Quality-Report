import { readFileSync, writeFileSync } from 'fs';

const filePath = 'dist/index.html';
let content = readFileSync(filePath, 'utf8');
const originalLength = content.length;

// Replace broken UTF-8 sequences using hex codes
// These are double-encoded UTF-8 that appear as mojibake
const replacements = [
  // Arrow: \u00E2\u0086\u2019 or literal "â†'" -> "->"
  [/\u00E2\u0086\u2019/g, '->'],
  [/\u00E2\u0086\u0092/g, '->'],
  // Also the literal â followed by † and '
  [/\u00E2\u2020\u2019/g, '->'],
  
  // Sort triangles: â-² and â-¼
  [/\u00E2-\u00B2/g, '\u25B2'],   // ▲
  [/\u00E2-\u00BC/g, '\u25BC'],   // ▼
  
  // Emojis (double-encoded)
  // ðŸ'¡ = lightbulb
  [/\u00F0\u0178\u2019\u00A1/g, '\u{1F4A1}'],
  // ðŸ"¥ = inbox/download
  [/\u00F0\u0178\u201C\u00A5/g, '\u{1F4E5}'],
  // ðŸ"‹ = clipboard
  [/\u00F0\u0178\u201C\u2039/g, '\u{1F4CB}'],
  
  // âœ‰ = envelope ✉
  [/\u00E2\u0153\u2030/g, '\u2709'],
  // âœ• = X mark ✕
  [/\u00E2\u0153\u2022/g, '\u2715'],
  // âž• = plus ➕
  [/\u00E2\u017E\u2022/g, '\u2795'],
  
  // â„¹ï¸ = info ℹ️
  [/\u00E2\u201E\u00B9\u00EF\u00B8\u008F/g, '\u2139\uFE0F'],
  
  // Â· = middle dot ·
  [/\u00C2\u00B7/g, '\u00B7'],
  
  // â€ patterns (quotes and dashes)
  // â€" = em-dash
  [/\u00E2\u20AC\u201C/g, '-'],
  // â€" = en-dash  
  [/\u00E2\u20AC\u201D/g, '-'],
  // â€™ = right single quote
  [/\u00E2\u20AC\u2122/g, "'"],
  // â€˜ = left single quote
  [/\u00E2\u20AC\u02DC/g, "'"],
  // â€œ = left double quote
  [/\u00E2\u20AC\u0153/g, '"'],
  // â€ = right double quote (â€ followed by control char 0x9D)
  [/\u00E2\u20AC\u009D/g, '"'],
  // â€¦ = ellipsis
  [/\u00E2\u20AC\u00A6/g, '...'],
  
  // Catch remaining â€ followed by anything
  [/\u00E2\u20AC./g, '"'],
  
  // BOM
  [/\uFEFF/g, ''],
];

let changeCount = 0;
for (const [pattern, replacement] of replacements) {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`Pattern ${pattern.source}: ${matches.length} matches -> "${replacement}"`);
    changeCount += matches.length;
    content = content.replace(pattern, replacement);
  }
}

// Now check for remaining non-ASCII that shouldn't be there
// But keep actual emojis and special chars that are valid
const remainingNonAscii = [];
for (let i = 0; i < content.length; i++) {
  const code = content.charCodeAt(i);
  if (code > 127 && code < 256) {
    // Latin-1 supplement chars that shouldn't be in JS strings
    // except for actual intended chars like · (0xB7)
    const ctx = content.substring(Math.max(0, i-10), Math.min(content.length, i+20));
    if (remainingNonAscii.length < 10) {
      remainingNonAscii.push({ pos: i, code: code.toString(16), char: content[i], ctx });
    }
  }
}

if (remainingNonAscii.length > 0) {
  console.log(`\nRemaining Latin-1 chars (first 10):`);
  for (const item of remainingNonAscii) {
    console.log(`  pos ${item.pos}: U+${item.code} [${item.ctx.replace(/\n/g, '\\n')}]`);
  }
}

console.log(`\nTotal replacements: ${changeCount}`);
console.log(`Original: ${originalLength}, Final: ${content.length}`);

writeFileSync(filePath, content, 'utf8');
console.log('File saved.');
