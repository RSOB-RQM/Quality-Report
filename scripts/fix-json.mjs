import { readFileSync, writeFileSync } from 'fs';

const c = readFileSync('dist/index.html', 'utf8');
const scriptStart = c.indexOf('<script>') + 8;
const scriptEnd = c.indexOf('</script>');
let script = c.substring(scriptStart, scriptEnd);

const dataStart = script.indexOf('RAW_DATA = [') + 12;
const roleMapping = script.indexOf('const ROLE_MAPPING');
const dataEnd = script.lastIndexOf('];', roleMapping);
let jsonStr = script.substring(dataStart, dataEnd + 1);

// Try to fix the JSON by finding unescaped quotes inside string values
// Strategy: parse character by character, track if we're inside a string
let fixed = '';
let i = 0;
let inString = false;
let prevChar = '';
let fixCount = 0;

while (i < jsonStr.length) {
  const ch = jsonStr[i];
  
  if (ch === '"' && prevChar !== '\\') {
    if (!inString) {
      // Opening a string
      inString = true;
      fixed += ch;
    } else {
      // Could be closing a string OR an unescaped quote inside a string
      // Look ahead: if next char is : , } ] or whitespace before one of those, it's a real close
      const next = jsonStr[i + 1];
      if (next === ':' || next === ',' || next === '}' || next === ']' || 
          (next === ' ' && (jsonStr[i+2] === ',' || jsonStr[i+2] === '}' || jsonStr[i+2] === ']'))) {
        // Real string close
        inString = false;
        fixed += ch;
      } else if (next === undefined) {
        inString = false;
        fixed += ch;
      } else {
        // Unescaped quote inside string - escape it
        fixed += '\\"';
        fixCount++;
      }
    }
  } else {
    fixed += ch;
  }
  
  prevChar = ch;
  i++;
}

console.log(`Fixed ${fixCount} unescaped quotes`);

// Verify the fix
try {
  JSON.parse(fixed);
  console.log('JSON is now valid!');
} catch (e) {
  console.log('Still invalid:', e.message.substring(0, 100));
  // Try at the error position
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
  if (pos > 0) {
    console.log('Around error:', JSON.stringify(fixed.substring(pos - 30, pos + 30)));
  }
}

// Write back
script = script.substring(0, dataStart) + fixed + script.substring(dataEnd + 1);
const html = c.substring(0, scriptStart) + script + c.substring(scriptEnd);
writeFileSync('dist/index.html', html, 'utf8');
console.log('Saved.');
