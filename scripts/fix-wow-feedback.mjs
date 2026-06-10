import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let c = readFileSync('dist/index.html', 'utf8');
console.log('Starting size:', c.length);

// ============================================
// 1. REMOVE WoW Report nav link
// ============================================
// Find the nav link for WoW Report and remove it
const wowNavPattern = /\+wowActive\+[^;]*wowreport[^;]*WoW Report[^;]*<\/a>[^;]*';/;
const wowNavMatch = c.match(wowNavPattern);
if (wowNavMatch) {
  console.log('Found WoW nav link, removing...');
  c = c.replace(wowNavMatch[0], "';");
} else {
  // Try alternate approach - find the line with wowActive nav-link
  const wowLineIdx = c.indexOf("wowActive+'\" onclick");
  if (wowLineIdx > 0) {
    // Find the start of this nav item (look for the string concat start)
    const lineStart = c.lastIndexOf("nav+='", wowLineIdx);
    const lineEnd = c.indexOf("';", wowLineIdx + 10) + 2;
    if (lineStart > 0 && lineEnd > lineStart) {
      console.log('Removing WoW nav (alt method)');
      c = c.substring(0, lineStart) + c.substring(lineEnd);
    }
  }
}

// Remove the wowActive variable declaration
c = c.replace(/\s*const wowActive=state\.currentView==='wowreport'\?'active':'';/g, '');
c = c.replace(/\s*var wowActive=state\.currentView==='wowreport'\?'active':'';/g, '');

// Remove the WoW report render call
c = c.replace(/if\(state\.currentView==='wowreport'\)\{app\.innerHTML=renderWoWReport\(\);\s*return;\s*\}/g, '');
c = c.replace(/if\(state\.currentView==='wowreport'\)\{app\.innerHTML=renderWoWReport\(\);return;\}/g, '');

// Remove renderWoWReport function if it exists
const wowFnIdx = c.indexOf('function renderWoWReport');
if (wowFnIdx > 0) {
  // Find the end of this function (matching braces)
  let braceCount = 0;
  let fnEnd = wowFnIdx;
  let started = false;
  for (let i = wowFnIdx; i < c.length; i++) {
    if (c[i] === '{') { braceCount++; started = true; }
    if (c[i] === '}') { braceCount--; }
    if (started && braceCount === 0) { fnEnd = i + 1; break; }
  }
  console.log('Removing renderWoWReport function');
  c = c.substring(0, wowFnIdx) + c.substring(fnEnd);
}

console.log('WoW Report removed');

// ============================================
// 2. FEEDBACK COMPLETION - check what exists
// ============================================
const feedbackCodeIdx = c.indexOf('Feedback completion');
if (feedbackCodeIdx < 0) {
  console.log('No feedback section found - checking for feedbackWeeks...');
}

// Check if there's already a feedback section
const fbSectionIdx = c.indexOf('feedbackWeeks');
console.log('feedbackWeeks code at:', fbSectionIdx > 0 ? 'exists' : 'not found');

// Let's see the current feedback implementation
if (fbSectionIdx > 0) {
  const fbRegion = c.substring(fbSectionIdx - 50, fbSectionIdx + 500);
  console.log('Current feedback code:', fbRegion.substring(0, 300));
}

// ============================================
// 3. Add/Update Feedback Completion section
// ============================================
// The feedback section should appear in the dashboard view for admins (manager-wise)
// and for managers (associate-wise), tracking from Week 21+

// Find where the associate summary section ends and add feedback after it
const renderDashIdx = c.indexOf('function renderDashboard');
if (renderDashIdx < 0) {
  // Try 'function render'
  console.log('Looking for render function...');
}

// Find the section where individual/associate view data is shown
// We need to add a "Feedback Completion %" section
// For admins: show manager-wise feedback %
// For managers: show associate-wise feedback %

// Check if feedback tracking data structure exists
const hasFeedbackData = c.indexOf('feedbackData') > 0 || c.indexOf('FEEDBACK_DATA') > 0;
console.log('Has feedback data structure:', hasFeedbackData);

// Since there's no actual feedback data in the system yet (it needs to come from WoW data),
// let's create a placeholder that shows "Tracking from Week 21" with the structure ready
// The feedback % = (associates who received feedback / total associates with defects) * 100

// For now, let's add a section that calculates feedback from the existing data
// spResponse field (spr) indicates if feedback was shared

// Find where to inject the feedback section - after the weekly summary in dashboard view
const weeklySummaryEnd = c.indexOf("Download CSV</button>");
console.log('Download CSV button at:', weeklySummaryEnd > 0 ? 'found' : 'not found');

writeFileSync('dist/index.html', c, 'utf8');

// Verify syntax
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');

try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX CHECK PASSED!');
} catch (e) {
  console.log('SYNTAX ERROR:', e.stderr.toString().split('\n').find(l => l.includes('Syntax')));
}

console.log('Final size:', c.length);
