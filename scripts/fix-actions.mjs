import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let c = readFileSync('dist/index.html', 'utf8');

// Find the old actions content and replace with the user's actual initiatives
const oldActions = `<li><strong>RS Tool Validator Refresher</strong> \u00E2\u20AC\u201C Mandatory training session for all associates on proper annotation steps</li>';\\n  actionsHtml+='<li><strong>Reason Code Decision Tree</strong> \u00E2\u20AC\u201C Visual flowchart distributed mapping disruption types to correct reason codes</li>';\\n  actionsHtml+='<li><strong>Daily Pre-shift Huddles</strong> \u00E2\u20AC\u201C 5-min quality focus in every shift handover reviewing top errors from previous day</li>';\\n  actionsHtml+='<li><strong>1:1 Coaching for Repeated Defaulters</strong> \u00E2\u20AC\u201C Targeted sessions for associates with 3+ weeks of defects</li>';\\n  actionsHtml+='<li><strong>Quality Dashboard Launch</strong> \u00E2\u20AC\u201C Self-service visibility for all associates and managers to track their own performance</li>';\\n  actionsHtml+='<li><strong>Weekly Error Pattern Sharing</strong> \u00E2\u20AC\u201C Top 3 errors shared via team communication channels every Monday</li>`;

const newActions = `<li><strong>CASA Reason Code Best Practices</strong> - Shared revised reason code guidelines via flyers with L3+ group</li>';\\n  actionsHtml+='<li><strong>Validator Compliance Drive</strong> - Informed associates to ensure latest validator is downloaded and to monitor Slack/ops support channels for updates</li>';\\n  actionsHtml+='<li><strong>Repeated Outlier Alerts</strong> - Shared outlier alerts with respective managers for close-loop action</li>';\\n  actionsHtml+='<li><strong>Feedback Completion Drive</strong> - Rigorous drive on feedback completion with managers; consistently achieved 100% WoW feedback (impacted by Zeus migration, working with quality team to fix)</li>';\\n  actionsHtml+='<li><strong>Quality Dashboard Launch (In Progress)</strong> - Self-service visibility for all associates and managers to track their own performance</li>';\\n  actionsHtml+='<li><strong>Weekly Error Pattern Sharing</strong> - Top 3 errors shared via team communication channels every Monday</li>`;

if (c.includes(oldActions)) {
  c = c.replace(oldActions, newActions);
  console.log('Replaced actions section');
} else {
  console.log('Old actions not found verbatim, trying alternate approach...');
  
  // Find by the first action item text
  const marker = 'RS Tool Validator Refresher';
  const idx = c.indexOf(marker);
  if (idx > 0) {
    // Find the start of this <li> and end of last </li> in the actions
    const liStart = c.lastIndexOf('<li>', idx);
    const lastAction = c.indexOf('every Monday</li>', idx);
    const liEnd = lastAction + 'every Monday</li>'.length;
    
    console.log('Found actions from', liStart, 'to', liEnd);
    
    const newContent = `<li><strong>CASA Reason Code Best Practices</strong> - Shared revised reason code guidelines via flyers with L3+ group</li>';\\n  actionsHtml+='<li><strong>Validator Compliance Drive</strong> - Informed associates to ensure latest validator is downloaded and to monitor Slack/ops support channels for updates</li>';\\n  actionsHtml+='<li><strong>Repeated Outlier Alerts</strong> - Shared outlier alerts with respective managers for close-loop action</li>';\\n  actionsHtml+='<li><strong>Feedback Completion Drive</strong> - Rigorous drive on feedback completion with managers; consistently achieved 100% WoW feedback (impacted by Zeus migration, working with quality team to fix)</li>';\\n  actionsHtml+='<li><strong>Quality Dashboard Launch (In Progress)</strong> - Self-service visibility for all associates and managers to track their own performance</li>';\\n  actionsHtml+='<li><strong>Weekly Error Pattern Sharing</strong> - Top 3 errors shared via team communication channels every Monday</li>`;
    
    c = c.substring(0, liStart) + newContent + c.substring(liEnd);
    console.log('Replaced via position');
  } else {
    console.log('ERROR: Cannot find actions section');
  }
}

// Also fix any remaining â€" (em-dash mojibake) anywhere in the file
c = c.replace(/\u00E2\u20AC\u201C/g, '-');
c = c.replace(/\u00E2\u20AC\u201D/g, '-');

writeFileSync('dist/index.html', c, 'utf8');

// Verify
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');
try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX OK!');
} catch (e) {
  console.log('SYNTAX ERROR:', e.stderr.toString().split('\n').find(l => l.includes('Syntax')));
}
