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
console.log('After converting \\n to newlines:', after.split('\n').length, 'lines');

// Step 2: Now find lines that are clearly inside strings (continuation lines)
// and merge them back with \n escape
// A line that's a continuation will NOT start with valid JS syntax
const lines = after.split('\n');
const merged = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Valid line starters in this minified code
  const isValidStart = trimmed === '' || 
    /^(\/\/|const |let |var |function |if|else|for|while|return |switch|case |break|try|catch|throw|document|window|\}|\/\*|\*|class )/.test(trimmed) ||
    /^[A-Z_]+\s*=/.test(trimmed) || // CONSTANT = ...
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*');
    
  if (isValidStart || merged.length === 0) {
    merged.push(line);
  } else {
    // This is a continuation line - merge with previous using \n
    merged[merged.length - 1] += '\\n' + line;
  }
}

console.log('After merging continuations:', merged.length, 'lines');
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
  
  // Find the problem line
  const scriptLines = m[1].split('\n');
  for (let i = 5; i < Math.min(scriptLines.length, 300); i++) {
    try {
      new Function(scriptLines.slice(5, i + 1).join('\n'));
    } catch (e) {
      if (!e.message.includes('end of input') && !e.message.includes('not defined') && !e.message.includes('argument list')) {
        console.log(`Problem at line ${i + 1}: ${e.message.substring(0, 60)}`);
        console.log(`  ${scriptLines[i].substring(0, 100)}`);
        break;
      }
    }
  }
}
