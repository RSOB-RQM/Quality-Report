import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Start fresh from the working GitHub version
let c = readFileSync('dist/index_github.html', 'utf8');

// 1. Replace the Actions section
const oldActionsStart = '<li><strong>RS Tool Validator Refresher</strong>';
const oldActionsEnd = 'Top 3 errors shared via team communication channels every Monday</li>';
const startIdx = c.indexOf(oldActionsStart);
const endIdx = c.indexOf(oldActionsEnd) + oldActionsEnd.length;

if (startIdx > 0 && endIdx > startIdx) {
  const newActions = `<li><strong>CASA Reason Code Best Practices</strong> - Shared revised reason code guidelines via flyers with L3+ group</li>';
  actionsHtml+='<li><strong>Validator Compliance Drive</strong> - Informed associates to ensure latest validator is downloaded and to monitor Slack/ops support channels for updates</li>';
  actionsHtml+='<li><strong>Repeated Outlier Alerts</strong> - Shared outlier alerts with respective managers for close-loop action</li>';
  actionsHtml+='<li><strong>Feedback Completion Drive</strong> - Rigorous drive with managers; achieved 100% WoW feedback (impacted by Zeus migration, working with quality team to fix)</li>';
  actionsHtml+='<li><strong>Quality Dashboard Launch (In Progress)</strong> - Self-service visibility for all associates and managers to track performance</li>';
  actionsHtml+='<li><strong>Weekly Error Pattern Sharing</strong> - Top 3 errors shared via team communication channels every Monday</li>`;
  c = c.substring(0, startIdx) + newActions + c.substring(endIdx);
  console.log('Actions section updated');
} else {
  console.log('WARNING: Could not find actions section');
}

// 2. Remove all mojibake/emoji patterns
// â€" (em-dash broken)
c = c.replace(/\u00E2\u20AC\u201C/g, '-');
c = c.replace(/\u00E2\u20AC\u201D/g, '-');

// Emojis: ðŸ'¡ ðŸ"¥ ðŸ"‹ 
c = c.replace(/\u00F0\u0178\u2019\u00A1\s*/g, '');
c = c.replace(/\u00F0\u0178\u201C\u00A5\s*/g, '');
c = c.replace(/\u00F0\u0178\u201C\u2039\s*/g, '');

// Arrows: â†' â†
c = c.replace(/\u00E2\u2020\u2019/g, '->');
c = c.replace(/\u00E2\u2020\u201C/g, '');
c = c.replace(/\u00E2\u2020\u0090/g, '');
c = c.replace(/\u00E2\u2020\u2018/g, '');

// Symbols: âœ‰ âœ• âž• âœ"
c = c.replace(/\u00E2\u0153\u2030/g, '');
c = c.replace(/\u00E2\u0153\u2022/g, '');
c = c.replace(/\u00E2\u0153\u201C/g, '');
c = c.replace(/\u00E2\u017E\u2022/g, '');

// Info: â„¹ï¸
c = c.replace(/\u00E2\u201E\u00B9\u00EF\u00B8\u008F/g, '');

// Middle dot: Â·
c = c.replace(/\u00C2\u00B7/g, ' ');

// Also fix the wrench emoji at start of "Actions Introduced"
c = c.replace(/\u00F0\u0178\u203A\u0090\uFE0F\s*/g, '');
c = c.replace(/\\uD83D\\uDEE0\\uFE0F\s*/g, '');

// Remove en-dash/em-dash unicode
c = c.replace(/\u2013/g, '-');
c = c.replace(/\u2014/g, '-');

// Remove BOM
c = c.replace(/\uFEFF/g, '');

writeFileSync('dist/index.html', c, 'utf8');
console.log('File saved:', c.length, 'chars');

// Verify syntax
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');

try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX CHECK PASSED!');
} catch (e) {
  console.log('SYNTAX ERROR:', e.stderr.toString().split('\n').find(l => l.includes('Syntax')));
}
