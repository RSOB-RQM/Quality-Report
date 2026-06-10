import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let c = readFileSync('dist/index.html', 'utf8');

// Remove the navLinks+= line that contains wowreport
// Pattern: navLinks+='<button class="nav-link '+wowActive+'" onclick="state.currentView=\'wowreport\';render()">WoW Report</button>';
const wowIdx = c.indexOf('wowreport');
if (wowIdx > 0) {
  // Find start of this statement (navLinks+=)
  const stmtStart = c.lastIndexOf("navLinks+='", wowIdx);
  // Find end of statement (';)
  const stmtEnd = c.indexOf("';", wowIdx) + 2;
  if (stmtStart > 0 && stmtEnd > stmtStart) {
    console.log('Removing navLinks statement from', stmtStart, 'to', stmtEnd);
    console.log('Content:', c.substring(stmtStart, stmtEnd).substring(0, 100));
    c = c.substring(0, stmtStart) + c.substring(stmtEnd);
  }
}

// Also remove wowActive variable if still present
const wowActiveIdx = c.indexOf('wowActive');
if (wowActiveIdx > 0) {
  const varStart = c.lastIndexOf('var ', wowActiveIdx);
  const varEnd = c.indexOf(';', wowActiveIdx) + 1;
  if (varStart > 0 && (wowActiveIdx - varStart) < 50) {
    c = c.substring(0, varStart) + c.substring(varEnd);
    console.log('Removed wowActive variable');
  }
}

// Final check
console.log('Remaining wowreport:', c.indexOf('wowreport'));
console.log('Remaining wowActive:', c.indexOf('wowActive'));

writeFileSync('dist/index.html', c, 'utf8');
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');
try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX CHECK PASSED!');
} catch (e) {
  console.log('SYNTAX ERROR:', e.stderr.toString().split('\n').find(l => l.includes('Syntax')));
}
