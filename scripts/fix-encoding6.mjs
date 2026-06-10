import { readFileSync, writeFileSync } from 'fs';

const filePath = 'dist/index.html';
let content = readFileSync(filePath, 'utf8');

let changes = 0;

// â†" = \u00E2\u2020" (E2, 2020, 22) = ↓ down arrow
// Using string replacement since the " in the middle makes regex tricky
const downArrow = '\u00E2\u2020"';
while (content.includes(downArrow)) {
  content = content.replace(downArrow, '\u2193');
  changes++;
}

// ðŸ'¡ = \u00F0\u0178'\u00A1 (F0, 178, 27, A1) = 💡 lightbulb
const lightbulb = '\u00F0\u0178\'\u00A1';
while (content.includes(lightbulb)) {
  content = content.replace(lightbulb, '\u{1F4A1}');
  changes++;
}

// ðŸ"¥ = \u00F0\u0178"\u00A5 (F0, 178, 22, A5) = 📥 download
const download = '\u00F0\u0178"\u00A5';
while (content.includes(download)) {
  content = content.replace(download, '\u{1F4E5}');
  changes++;
}

// ðŸ"‹ = \u00F0\u0178"\u2039 (F0, 178, 22, 2039) = 📋 clipboard
const clipboard = '\u00F0\u0178"\u2039';
while (content.includes(clipboard)) {
  content = content.replace(clipboard, '\u{1F4CB}');
  changes++;
}

console.log(`Changes: ${changes}`);

// Verify no more problem chars
let idx = 0, count = 0;
while ((idx = content.indexOf('\u00E2', idx)) !== -1) { count++; idx++; }
console.log(`Remaining \\u00E2: ${count}`);

idx = 0; count = 0;
while ((idx = content.indexOf('\u00F0', idx)) !== -1) { count++; idx++; }
console.log(`Remaining \\u00F0: ${count}`);

idx = 0; count = 0;
while ((idx = content.indexOf('\u00C2', idx)) !== -1) { count++; idx++; }
console.log(`Remaining \\u00C2: ${count}`);

writeFileSync(filePath, content, 'utf8');
console.log('File saved. Length:', content.length);
