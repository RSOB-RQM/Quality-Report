import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let c = readFileSync('dist/index.html', 'utf8');

// Reference 1: if(state.currentView==='wowreport'){app.innerHTML=...}
// Need to remove the entire if block
const ref1 = "if(state.currentView==='wowreport'){";
let idx = c.indexOf(ref1);
if (idx > 0) {
  // Find matching closing brace
  let braceCount = 0;
  let started = false;
  let endIdx = idx;
  for (let i = idx; i < c.length; i++) {
    if (c[i] === '{') { braceCount++; started = true; }
    if (c[i] === '}') { braceCount--; }
    if (started && braceCount === 0) { endIdx = i + 1; break; }
  }
  console.log('Removing wowreport if-block from', idx, 'to', endIdx, '(' + (endIdx - idx) + ' chars)');
  c = c.substring(0, idx) + c.substring(endIdx);
}

// Reference 2: WoW Report button in nav
const ref2idx = c.indexOf('wowreport');
if (ref2idx > 0) {
  // Find the nav+=' or similar that contains this button
  const lineStart = c.lastIndexOf("nav+='", ref2idx);
  const altStart = c.lastIndexOf("+'", ref2idx);
  const start = Math.max(lineStart, altStart);
  // Find the end of this statement
  const lineEnd = c.indexOf("';", ref2idx) + 2;
  if (start > 0 && lineEnd > start) {
    console.log('Removing WoW Report button from', start, 'to', lineEnd);
    c = c.substring(0, start) + c.substring(lineEnd);
  }
}

// Check for any remaining wowreport references
const remaining = c.indexOf('wowreport');
if (remaining > 0) {
  console.log('WARNING: Still have wowreport at', remaining);
  console.log(c.substring(remaining - 20, remaining + 50));
} else {
  console.log('All wowreport references removed!');
}

writeFileSync('dist/index.html', c, 'utf8');

// Verify syntax
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');
try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX CHECK PASSED!');
} catch (e) {
  console.log('SYNTAX ERROR:', e.stderr.toString().split('\n').find(l => l.includes('Syntax')));
}
