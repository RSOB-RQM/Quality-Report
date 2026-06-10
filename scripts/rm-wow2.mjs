import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let c = readFileSync('dist/index.html', 'utf8');

// Find wowreport and remove the navLinks+= statement containing it
const idx = c.indexOf('wowreport');
if (idx > 0) {
  // Go back to find "navLinks+="
  const lineStart = c.lastIndexOf("navLinks+='", idx);
  // Go forward past the ";", which ends after "';  "
  const lineEnd = c.indexOf("';\n", idx) + 3;
  
  console.log('navLinks line from', lineStart, 'to', lineEnd);
  console.log('Removing:', c.substring(lineStart, lineEnd));
  
  c = c.substring(0, lineStart) + c.substring(lineEnd);
}

// Remove wowActive variable
const wowActIdx = c.indexOf('wowActive');
if (wowActIdx > 0) {
  const varStart = c.lastIndexOf('var ', wowActIdx);
  const varEnd = c.indexOf(';\n', wowActIdx) + 2;
  if (varStart > 0 && (wowActIdx - varStart) < 50) {
    console.log('Removing wowActive from', varStart, 'to', varEnd);
    c = c.substring(0, varStart) + c.substring(varEnd);
  }
}

console.log('Remaining wowreport:', c.indexOf('wowreport'));
console.log('Has <script>:', c.includes('<script>'));

writeFileSync('dist/index.html', c, 'utf8');
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
if (m) {
  writeFileSync('dist/temp_check.js', m[1], 'utf8');
  try {
    execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
    console.log('SYNTAX CHECK PASSED!');
  } catch (e) {
    console.log('SYNTAX ERROR:', e.stderr.toString().split('\n').find(l => l.includes('Syntax')));
  }
} else {
  console.log('ERROR: No script tag found!');
}
