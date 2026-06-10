import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let c = readFileSync('dist/index.html', 'utf8');

// Replace all literal \n (two characters: backslash + n) that are NOT inside string literals
// with real newlines. The ones inside strings should stay as \n.

const scriptStart = c.indexOf('<script>') + 8;
const scriptEnd = c.indexOf('</script>');
let script = c.substring(scriptStart, scriptEnd);

// Find the "after" section (everything after RAW_DATA];\n)
const rawDataEnd = script.indexOf('const ROLE_MAPPING');
const afterStart = script.lastIndexOf('];', rawDataEnd) + 2;
let after = script.substring(afterStart);

// Replace \\n with real newlines, but NOT when inside quotes
// Parse character by character
let result = '';
let inSingle = false;
let inDouble = false;
let inTemplate = false;
let inRegex = false;
let i = 0;

while (i < after.length) {
  const ch = after[i];
  const next = after[i + 1];
  const prev = i > 0 ? after[i - 1] : '';
  
  // Track string state
  if (!inDouble && !inTemplate && !inRegex && ch === "'" && prev !== '\\') {
    inSingle = !inSingle;
  } else if (!inSingle && !inTemplate && !inRegex && ch === '"' && prev !== '\\') {
    inDouble = !inDouble;
  } else if (!inSingle && !inDouble && !inRegex && ch === '`' && prev !== '\\') {
    inTemplate = !inTemplate;
  }
  
  // If we see \n (backslash followed by n) and we're NOT in a string, replace with real newline
  if (ch === '\\' && next === 'n' && !inSingle && !inDouble && !inTemplate) {
    result += '\n';
    i += 2; // skip both chars
    continue;
  }
  
  result += ch;
  i++;
}

script = script.substring(0, afterStart) + result;
c = c.substring(0, scriptStart) + script + c.substring(scriptEnd);
writeFileSync('dist/index.html', c, 'utf8');

// Check
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');

try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX CHECK PASSED!');
} catch (err) {
  const stderr = err.stderr.toString();
  const lines = stderr.split('\n');
  const syntaxLine = lines.find(l => l.includes('SyntaxError'));
  console.log('Still has error:', syntaxLine);
}
