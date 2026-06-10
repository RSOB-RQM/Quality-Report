import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('dist/index.html', 'utf8');

// The problem: earlier replacement of \n inside RAW_DATA also replaced \n in the rest of the script code
// The script content between <script> and </script> has literal \n (two chars: backslash + n) 
// where there should be actual newline characters, EXCEPT inside the RAW_DATA string values

// Find the script content
const scriptStart = c.indexOf('<script>') + 8;
const scriptEnd = c.indexOf('</script>');
let script = c.substring(scriptStart, scriptEnd);

// The RAW_DATA is a single line with no real newlines (it's on one line)
// But the rest of the code has literal \n instead of real newlines
// Strategy: replace all literal \n with real newlines, EXCEPT those inside string literals in RAW_DATA

// First, let's check: does the script have literal \n (two-char sequence)?
const literalBackslashN = script.indexOf('\\n');
console.log('Literal \\n found at position:', literalBackslashN);
if (literalBackslashN === -1) {
  console.log('No literal \\n found - script might be fine');
  process.exit(0);
}

// Find RAW_DATA boundaries within the script
const rawStart = script.indexOf('RAW_DATA = [');
const roleMapping = script.indexOf('const ROLE_MAPPING');
const rawEnd = script.lastIndexOf('];', roleMapping) + 2;

console.log('RAW_DATA: chars', rawStart, 'to', rawEnd);
console.log('Script total length:', script.length);

// Split into parts: before RAW_DATA, RAW_DATA itself, after RAW_DATA
const before = script.substring(0, rawStart + 12); // includes "RAW_DATA = ["
const rawData = script.substring(rawStart + 12, rawEnd); // the actual array content + ];
const after = script.substring(rawEnd);

console.log('Before length:', before.length);
console.log('RAW_DATA length:', rawData.length);
console.log('After length:', after.length);

// Fix before and after: replace literal \n with real newlines
const fixedBefore = before.replace(/\\n/g, '\n');
const fixedAfter = after.replace(/\\n/g, '\n');

// RAW_DATA should keep its \n as they are (they're inside JSON string values)
// But wait - some might be double-escaped. Let's check what the actual format is.
// The data has properly escaped \n inside strings like "recovery needed\n2. Recovery..."
// These should stay as \n (the two chars) because they're inside a JS string literal

// Reconstruct
script = fixedBefore + rawData + fixedAfter;

c = c.substring(0, scriptStart) + script + c.substring(scriptEnd);
writeFileSync('dist/index.html', c, 'utf8');
console.log('Done! Fixed literal \\n in code sections while preserving RAW_DATA.');
