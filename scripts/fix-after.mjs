import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('dist/index.html', 'utf8');
const s = c.indexOf('<script>') + 8;
const e = c.indexOf('</script>');
let script = c.substring(s, e);

const rawStart = script.indexOf('RAW_DATA = [');
const roleIdx = script.indexOf('const ROLE_MAPPING');
const rawEnd = script.lastIndexOf('];', roleIdx) + 2;

const before = script.substring(0, rawStart);
const rawData = script.substring(rawStart, rawEnd);
let after = script.substring(rawEnd);

// The "after" section had its \n inside string literals converted to real newlines
// by fix-final.mjs. We need to reverse this: convert ALL real newlines back to \n escape,
// then selectively convert back the ones that should be real line breaks.
// 
// Actually simpler: just put the whole "after" as a single line (joining with space won't work
// because the \n in strings need to stay as \n).
// The right approach: join all lines back with \n escape sequences, since that's what they were before.

// All the newlines in "after" were originally \n (two chars: backslash+n)
// fix-final.mjs converted them ALL to real newlines
// We just need to convert them back
after = after.replace(/\n/g, '\\n');

// But we DO want real newlines between actual statements for readability
// (not required for function, but let's at least put the structural ones back)
// Actually for Firefox compatibility we just need valid JS - keep it as one blob

script = before + rawData + after;

// Reconstruct HTML
const html = c.substring(0, s) + script + c.substring(e);
writeFileSync('dist/index.html', html, 'utf8');

// Verify
const m2 = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m2[1], 'utf8');
console.log('Done. Checking syntax...');
