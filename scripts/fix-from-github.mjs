import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Start from the working GitHub version
let c = readFileSync('dist/index_github.html', 'utf8');
console.log('Starting from GitHub version:', c.length, 'chars');

// Fix 1: Remove/replace broken UTF-8 encoded characters (â€" etc)
// These appear as mojibake in the HTML
const replacements = [
  [/\u00E2\u0080\u0093/g, '-'],   // â€" en-dash
  [/\u00E2\u0080\u0094/g, '-'],   // â€" em-dash
  [/\u00E2\u0080\u0099/g, "'"],   // â€™ right quote
  [/\u00E2\u0080\u0098/g, "'"],   // â€˜ left quote
  [/\u00E2\u0080\u009C/g, '"'],   // â€œ left double quote
  [/\u00E2\u0080\u009D/g, '"'],   // â€ right double quote
  [/\u00E2\u0080\u00A6/g, '...'], // â€¦ ellipsis
];

let fixCount = 0;
for (const [pattern, replacement] of replacements) {
  const matches = c.match(pattern);
  if (matches) {
    fixCount += matches.length;
    c = c.replace(pattern, replacement);
  }
}
console.log('Fixed', fixCount, 'broken UTF-8 sequences');

// Fix 2: Replace Unicode smart quotes/dashes with ASCII
c = c.replace(/\u2019/g, "'");  // right single quote
c = c.replace(/\u2018/g, "'");  // left single quote
c = c.replace(/\u201C/g, '"');  // left double quote
c = c.replace(/\u201D/g, '"');  // right double quote
c = c.replace(/\u2013/g, '-');  // en-dash
c = c.replace(/\u2014/g, '-');  // em-dash
c = c.replace(/\u2026/g, '...'); // ellipsis

// Fix 3: Remove emoji characters that display as ðŸ'¡ etc
// These are proper Unicode emojis - just remove them (user requested blank)
c = c.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');  // all emojis
c = c.replace(/\u2709/g, '');   // ✉ envelope
c = c.replace(/\u2715/g, '');   // ✕ 
c = c.replace(/\u2795/g, '');   // ➕
c = c.replace(/\u2139\uFE0F/g, ''); // ℹ️

// Fix 4: Remove broken mojibake emoji patterns that haven't been converted yet
// ðŸ'¡ pattern: \u00F0\u0178 followed by various chars
c = c.replace(/\u00F0[\u0178\u0179][\u2018-\u201D\u0027\u0022][\u00A0-\u00FF]/g, '');
// â patterns for symbols
c = c.replace(/\u00E2[\u0080-\u0086][\u0080-\u00BF\u2018-\u2039\u0022\u0027]/g, '');

// Fix 5: Remove BOM if present  
c = c.replace(/\uFEFF/g, '');

console.log('Final size:', c.length);
writeFileSync('dist/index.html', c, 'utf8');

// Verify syntax
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');

try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX CHECK PASSED!');
} catch (err) {
  console.log('SYNTAX ERROR - checking...');
  const stderr = err.stderr.toString();
  const syntaxLine = stderr.split('\n').find(l => l.includes('SyntaxError'));
  console.log(syntaxLine);
}
