import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let c = readFileSync('dist/index.html', 'utf8');
const s = c.indexOf('<script>') + 8;
const e = c.indexOf('</script>');
let script = c.substring(s, e);

// Find boundaries
const rawStart = script.indexOf('RAW_DATA = [') + 12;
const roleIdx = script.indexOf('const ROLE_MAPPING');
const rawEnd = script.lastIndexOf('];', roleIdx) + 2;

let after = script.substring(rawEnd);

// After section should have real newlines between statements
// BUT NOT inside string literals.
// The problem: some \n are statement separators, some are inside strings.
// In the original minified code, newlines inside strings were represented as \n (escape sequence)
// and real newlines separated statements.
// Right now, ALL \n are real newlines (from fix-final.mjs conversion).
// We need to find newlines that are INSIDE string literals and convert them back to \\n.

// Parse character by character to find newlines inside strings
let result = '';
let inSingle = false;
let inDouble = false;
let inTemplate = false;
let inRegex = false;
let prev = '';
let fixCount = 0;

for (let i = 0; i < after.length; i++) {
  const ch = after[i];
  
  if (ch === '\n') {
    if (inSingle || inDouble) {
      // Newline inside a string - replace with \n escape
      result += '\\n';
      fixCount++;
      prev = 'n';
      continue;
    }
  }
  
  if (!inRegex) {
    if (ch === "'" && !inDouble && !inTemplate && prev !== '\\') {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle && !inTemplate && prev !== '\\') {
      inDouble = !inDouble;
    } else if (ch === '`' && !inSingle && !inDouble && prev !== '\\') {
      inTemplate = !inTemplate;
    }
  }
  
  result += ch;
  prev = (prev === '\\' && ch === '\\') ? '' : ch;
}

console.log(`Fixed ${fixCount} newlines inside string literals`);

after = result;
script = script.substring(0, rawEnd) + after;
c = c.substring(0, s) + script + c.substring(e);
writeFileSync('dist/index.html', c, 'utf8');

// Extract and check
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');

try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX CHECK PASSED!');
} catch (err) {
  const output = err.stderr.toString();
  const syntaxLine = output.split('\n').find(l => l.includes('SyntaxError'));
  console.log('Still has error:', syntaxLine || 'unknown');
}
