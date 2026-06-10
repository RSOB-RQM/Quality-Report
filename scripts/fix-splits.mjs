import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('dist/index.html', 'utf8');
const scriptStart = c.indexOf('<script>') + 8;
const scriptEnd = c.indexOf('</script>');
let script = c.substring(scriptStart, scriptEnd);

// The problem: the "fix-final.mjs" script replaced \n with real newlines in the 
// "after RAW_DATA" section. But some of those \n were inside string literals 
// (like '\n' in includes('\n') or "\n" in template strings).
// 
// The fix: Find all the function definitions that are now split across multiple lines
// when they shouldn't be. These are minified functions that should be single lines.
//
// Better approach: re-read the file and find lines that don't start with valid JS statement beginnings
// and merge them with the previous line.

const lines = script.split('\n');
console.log('Total lines:', lines.length);

// Lines that are valid statement starters
const validStarts = /^(\/\/|const |let |var |function |class |if |else |for |while |return |switch |case |break |continue |try |catch |throw |export |import |document|window|async |{|}|$)/;
const blankLine = /^\s*$/;

const mergedLines = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // If this line is blank, a comment, or starts with a valid keyword, keep it separate
  if (blankLine.test(line) || validStarts.test(line.trim())) {
    mergedLines.push(line);
  } else {
    // This line is a continuation of the previous line (was incorrectly split)
    if (mergedLines.length > 0) {
      // Join with the previous, using \n as the character (since it was a \n in a string)
      mergedLines[mergedLines.length - 1] += '\\n' + line;
    } else {
      mergedLines.push(line);
    }
  }
}

console.log('After merge:', mergedLines.length, 'lines');
const newScript = mergedLines.join('\n');

const html = c.substring(0, scriptStart) + newScript + c.substring(scriptEnd);
writeFileSync('dist/index.html', html, 'utf8');
console.log('Saved');

// Quick syntax check
const m = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');
