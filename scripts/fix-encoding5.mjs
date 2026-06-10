import { readFileSync, writeFileSync } from 'fs';

const filePath = 'dist/index.html';
let content = readFileSync(filePath, 'utf8');
const originalLength = content.length;

let changes = 0;

// â†" = down arrow: â(E2) †(2020) "(22) - wait, next2 is 0x22 which is "
// Actually looking at the context: â†" - that's â(E2) + †(2020) + "(201C)
// No wait - the hex shows next2=22 which is just a regular quote char
// Let me look at context: 'â†" from' - this should be ↓
// The sequence is: \u00E2 \u2020 then the next char after that

// â†" pattern: \u00E2\u2020 followed by \u201C (") = ↓ down arrow
content = content.replace(/\u00E2\u2020\u201C/g, () => { changes++; return '\u2193'; });

// â† pattern (left arrow): \u00E2\u2020 followed by \u0090 
content = content.replace(/\u00E2\u2020\u0090/g, () => { changes++; return '\u2190'; });

// âœ" pattern (checkmark): \u00E2\u0153\u201C - but hex shows \u00E2\u0153\u0022
// Actually context shows: âœ" which is â(E2) + œ(153) + "(22)
// This should be ✓ checkmark
content = content.replace(/\u00E2\u0153"/g, () => { changes++; return '\u2713'; });

// Now the ð patterns for emojis
// ðŸ'¡ = ð(F0) + Ÿ(178) + '(2019) + ¡(A1) = 💡
content = content.replace(/\u00F0\u0178\u2019\u00A1/g, () => { changes++; return '\u{1F4A1}'; });

// ðŸ"¥ = ð(F0) + Ÿ(178) + "(201C) + ¥(A5) = 📥
content = content.replace(/\u00F0\u0178\u201C\u00A5/g, () => { changes++; return '\u{1F4E5}'; });

// ðŸ"‹ = ð(F0) + Ÿ(178) + "(201C) + ‹(2039) = 📋
content = content.replace(/\u00F0\u0178\u201C\u2039/g, () => { changes++; return '\u{1F4CB}'; });

console.log(`Changes: ${changes}`);

// Check remaining
let idx = 0;
let count = 0;
while ((idx = content.indexOf('\u00E2', idx)) !== -1) { count++; idx++; }
console.log(`Remaining \\u00E2: ${count}`);

idx = 0; count = 0;
while ((idx = content.indexOf('\u00F0', idx)) !== -1) { count++; idx++; }
console.log(`Remaining \\u00F0: ${count}`);

writeFileSync(filePath, content, 'utf8');
console.log('File saved. Length:', content.length);
