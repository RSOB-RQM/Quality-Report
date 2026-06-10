import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let c = readFileSync('dist/index.html', 'utf8');
const scriptStart = c.indexOf('<script>') + 8;
const scriptEnd = c.indexOf('</script>');
let script = c.substring(scriptStart, scriptEnd);

const rawDataEnd = script.indexOf('const ROLE_MAPPING');
const afterStart = script.lastIndexOf('];', rawDataEnd) + 2;
let after = script.substring(afterStart);

// Step 1: Replace ALL \\n with real newlines
after = after.replace(/\\n/g, '\n');

// Step 2: The code has two types of newlines:
// A) Legitimate line breaks (between statements, inside multi-line blocks with indentation)
// B) Newlines that were inside string literals ('\n' etc)
//
// Type A lines either:
// - Start with whitespace (indented code in blocks like the map())  
// - Start with a keyword, comment, or brace
// - Are empty
//
// Type B lines are random text continuations that don't look like code
// They were originally inside quotes like: 'text\nmore text'
//
// Strategy: A line is a "real code line" if it:
// - Is empty
// - Starts with whitespace (indentation)
// - Starts with //, /*, }, ), ], or a JS keyword
// - Starts with a known identifier pattern for this codebase

const lines = after.split('\n');
const merged = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Lines starting with spaces are indented code - keep as real newlines
  if (line.startsWith(' ') || line.startsWith('\t')) {
    merged.push(line);
    continue;
  }
  
  const trimmed = line.trim();
  
  // Empty lines
  if (trimmed === '') {
    merged.push(line);
    continue;
  }
  
  // Lines starting with JS structural elements
  if (/^(\/\/|\/\*|\*|const |let |var |function |if\s*\(|else|for\s*\(|while|return|switch|case |break|try\s*\{|catch|throw |document\.|window\.|async |class |\}|\)|\]|export |import )/.test(trimmed)) {
    merged.push(line);
    continue;
  }
  
  // Lines starting with })); or similar closers
  if (/^[}\])]+[;,]?$/.test(trimmed)) {
    merged.push(line);
    continue;
  }
  
  // Otherwise it's a continuation (was inside a string) - merge with \n
  if (merged.length > 0) {
    merged[merged.length - 1] += '\\n' + line;
  } else {
    merged.push(line);
  }
}

console.log('Lines:', lines.length, '->', merged.length);
after = merged.join('\n');

script = script.substring(0, afterStart) + after;
c = c.substring(0, scriptStart) + script + c.substring(scriptEnd);
writeFileSync('dist/index.html', c, 'utf8');

const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');

try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX CHECK PASSED!');
} catch (err) {
  const stderr = err.stderr.toString();
  const syntaxLine = stderr.split('\n').find(l => l.includes('SyntaxError'));
  console.log('Error:', syntaxLine);
  
  const scriptLines = m[1].split('\n');
  for (let i = 5; i < Math.min(scriptLines.length, 500); i++) {
    try {
      new Function(scriptLines.slice(5, i + 1).join('\n'));
    } catch (e) {
      if (!e.message.includes('end of input') && !e.message.includes('not defined') && !e.message.includes('argument list')) {
        console.log(`Problem at line ${i + 1}: ${e.message.substring(0, 80)}`);
        console.log(`  ${scriptLines[i].substring(0, 120)}`);
        break;
      }
    }
  }
}
