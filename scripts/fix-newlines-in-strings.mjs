import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let c = readFileSync('dist/index.html', 'utf8');

// Fix all patterns where a real newline appears inside a JS string literal
// These are cases where '\n' or "\n" got converted to real newlines

// Pattern 1: .join('\n') - now split across lines as .join('  <newline>  ')
c = c.replace(/\.join\('\n'\)/g, ".join('\\n')");

// Pattern 2: includes('\n') 
c = c.replace(/includes\('\n'\)/g, "includes('\\n')");

// Pattern 3: concatenation with '\n'
c = c.replace(/\+\s*'\n'\s*\+/g, "+'\\n'+");
c = c.replace(/\+\s*'\n'/g, "+'\\n'");
c = c.replace(/'\n'\s*\+/g, "'\\n'+");

// Pattern 4: Inside template literals or other string contexts
// Find any line that starts mid-string (doesn't start with a keyword or operator)
// Actually, let's just check and fix iteratively

writeFileSync('dist/index.html', c, 'utf8');

// Extract and check
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');

try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX CHECK PASSED!');
} catch (err) {
  const stderr = err.stderr.toString();
  const syntaxLine = stderr.split('\n').find(l => l.includes('SyntaxError'));
  console.log('Error:', syntaxLine);
  
  // Find exact line
  const lines = m[1].split('\n');
  for (let i = 5; i < Math.min(lines.length, 200); i++) {
    try {
      new Function(lines.slice(5, i + 1).join('\n'));
    } catch (e) {
      if (!e.message.includes('end of input') && !e.message.includes('not defined') && !e.message.includes('argument list')) {
        console.log(`Line ${i + 1}: ${e.message.substring(0, 60)}`);
        console.log(`  Content: ${lines[i].substring(0, 100)}`);
        break;
      }
    }
  }
}
