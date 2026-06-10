import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Start FRESH from GitHub version
let c = readFileSync('dist/index_github.html', 'utf8');
console.log('Starting from GitHub:', c.length);

// =============================================
// 1. FIX ENCODING - Remove mojibake emojis and â€"
// =============================================
c = c.replace(/\u00E2\u20AC\u201C/g, '-');
c = c.replace(/\u00E2\u20AC\u201D/g, '-');
c = c.replace(/\u00F0\u0178\u2019\u00A1\s*/g, '');
c = c.replace(/\u00F0\u0178\u201C\u00A5\s*/g, '');
c = c.replace(/\u00F0\u0178\u201C\u2039\s*/g, '');
c = c.replace(/\u00E2\u2020\u2019/g, '->');
c = c.replace(/\u00E2\u2020\u201C/g, '');
c = c.replace(/\u00E2\u2020\u0090/g, '');
c = c.replace(/\u00E2\u2020\u2018/g, '');
c = c.replace(/\u00E2\u0153\u2030/g, '');
c = c.replace(/\u00E2\u0153\u2022/g, '');
c = c.replace(/\u00E2\u0153\u201C/g, '');
c = c.replace(/\u00E2\u017E\u2022/g, '');
c = c.replace(/\u00E2\u201E\u00B9\u00EF\u00B8\u008F/g, '');
c = c.replace(/\u00C2\u00B7/g, ' ');
c = c.replace(/\\uD83D\\uDEE0\\uFE0F\s*/g, '');
c = c.replace(/\u2013/g, '-');
c = c.replace(/\u2014/g, '-');
c = c.replace(/\uFEFF/g, '');
console.log('Encoding fixed');

// =============================================
// 2. UPDATE ACTIONS SECTION
// =============================================
const oldActStart = '<li><strong>RS Tool Validator Refresher</strong>';
const oldActEnd = 'Top 3 errors shared via team communication channels every Monday</li>';
const aStart = c.indexOf(oldActStart);
const aEnd = c.indexOf(oldActEnd) + oldActEnd.length;
if (aStart > 0 && aEnd > aStart) {
  const newActs = `<li><strong>CASA Reason Code Best Practices</strong> - Shared revised reason code guidelines via flyers with L3+ group</li>';
  actionsHtml+='<li><strong>Validator Compliance Drive</strong> - Informed associates to ensure latest validator is downloaded and to monitor Slack/ops support channels for updates</li>';
  actionsHtml+='<li><strong>Repeated Outlier Alerts</strong> - Shared outlier alerts with respective managers for close-loop action</li>';
  actionsHtml+='<li><strong>Feedback Completion Drive</strong> - Rigorous drive with managers; achieved 100% WoW feedback (impacted by Zeus migration, working with quality team to fix)</li>';
  actionsHtml+='<li><strong>Quality Dashboard Launch (In Progress)</strong> - Self-service visibility for all associates and managers to track performance</li>';
  actionsHtml+='<li><strong>Weekly Error Pattern Sharing</strong> - Top 3 errors shared via team communication channels every Monday</li>`;
  c = c.substring(0, aStart) + newActs + c.substring(aEnd);
  console.log('Actions updated');
}

// =============================================
// 3. REMOVE WoW REPORT - carefully
// =============================================

// 3a. Remove the if-block that renders wowreport view
const wowIfStart = "if(state.currentView==='wowreport'){";
let wIdx = c.indexOf(wowIfStart);
if (wIdx > 0) {
  let braces = 0, started = false, wEnd = wIdx;
  for (let i = wIdx; i < c.length; i++) {
    if (c[i] === '{') { braces++; started = true; }
    if (c[i] === '}') { braces--; }
    if (started && braces === 0) { wEnd = i + 1; break; }
  }
  c = c.substring(0, wIdx) + c.substring(wEnd);
  console.log('Removed wowreport if-block');
}

// 3b. Remove the wowActive variable
c = c.replace(/\s*(?:const|var)\s+wowActive\s*=\s*state\.currentView===\s*'wowreport'\s*\?\s*'active'\s*:\s*''\s*;/g, '');

// 3c. Remove WoW nav link - find the nav+=... line containing wowreport
const wowNavIdx = c.indexOf('wowreport');
if (wowNavIdx > 0) {
  // The pattern is: nav+='<a class="nav-link '+wowActive+'" onclick="state.currentView=\'wowreport\';render()">WoW Report</a>';
  // Find the start of this nav+= statement
  let searchBack = wowNavIdx;
  while (searchBack > 0 && c.substring(searchBack - 6, searchBack) !== "nav+='") {
    searchBack--;
  }
  if (searchBack > 0) {
    const navStart = searchBack - 6;
    const navEnd = c.indexOf("';", wowNavIdx) + 2;
    if (navEnd > navStart) {
      c = c.substring(0, navStart) + c.substring(navEnd);
      console.log('Removed WoW nav link');
    }
  }
}

// 3d. Remove renderWoWReport function if exists
const wowFnIdx = c.indexOf('function renderWoWReport');
if (wowFnIdx > 0) {
  let braces = 0, started = false, fnEnd = wowFnIdx;
  for (let i = wowFnIdx; i < c.length; i++) {
    if (c[i] === '{') { braces++; started = true; }
    if (c[i] === '}') { braces--; }
    if (started && braces === 0) { fnEnd = i + 1; break; }
  }
  c = c.substring(0, wowFnIdx) + c.substring(fnEnd);
  console.log('Removed renderWoWReport function');
}

// Verify no more wowreport references
const wowRemaining = c.indexOf('wowreport');
console.log('Remaining wowreport refs:', wowRemaining > 0 ? 'YES at ' + wowRemaining : 'NONE');

// =============================================
// 4. FEEDBACK - update visibility condition
// =============================================
const oldFbCond = "if(user.role==='admin'||(user.role==='admin'&&state.adminTab==='process'))";
if (c.includes(oldFbCond)) {
  c = c.replace(oldFbCond, "if(user.role==='admin'||user.role==='manager')");
  console.log('Feedback: expanded to managers');
}

// Add manager-specific associate-wise view before content+=fbHtml
const fbContentAdd = "content+=fbHtml;";
const fbIdx = c.indexOf(fbContentAdd, c.indexOf('feedbackWeeks'));
if (fbIdx > 0) {
  const mgrView = `
    if(user.role==='manager'){
      var myAssocs=new Set(fRecords.filter(function(r){return r.supervisorLogin===user.login;}).map(function(r){return r.associateLogin;}));
      var fStatus=getFeedbackStatus(user.login,lastFeedbackWeek);
      fbHtml='<div class="section" style="border-left:4px solid #7c3aed"><h3 style="color:#7c3aed">Feedback Completion - Your Team (Week '+lastFeedbackWeek+')</h3><table><thead><tr><th>Associate</th><th style="text-align:center">Audited</th><th style="text-align:center">Defects</th><th style="text-align:center">Feedback Status</th></tr></thead><tbody>';
      var assocArr=Array.from(myAssocs);
      for(var ai=0;ai<assocArr.length;ai++){
        var assocLogin=assocArr[ai];
        var assocRecs=fRecords.filter(function(r){return r.associateLogin===assocLogin&&r.supervisorLogin===user.login;});
        var assocAudited=assocRecs.length;
        var assocDefects=assocRecs.filter(function(r){return r.defectFlag;}).length;
        var assocFbStatus=fStatus&&fStatus[assocLogin]?fStatus[assocLogin]:'Pending';
        var statusBadge=assocFbStatus==='Shared'?'<span style="background:#ecfdf5;color:#059669;padding:2px 8px;border-radius:4px;font-size:11px">Shared</span>':'<span style="background:#fffbeb;color:#d97706;padding:2px 8px;border-radius:4px;font-size:11px">Pending</span>';
        fbHtml+='<tr><td>'+assocLogin+'</td><td style="text-align:center">'+assocAudited+'</td><td style="text-align:center">'+assocDefects+'</td><td style="text-align:center">'+statusBadge+'</td></tr>';
      }
      fbHtml+='</tbody></table><p class="text-muted" style="margin-top:8px">Use Feedback/Appreciate buttons in Raw Data to mark as shared.</p></div>';
    }
    `;
  c = c.substring(0, fbIdx) + mgrView + c.substring(fbIdx);
  console.log('Added manager feedback view');
}

// =============================================
// SAVE & VERIFY
// =============================================
writeFileSync('dist/index.html', c, 'utf8');
console.log('Saved:', c.length);

const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
writeFileSync('dist/temp_check.js', m[1], 'utf8');
try {
  execSync('node --check dist/temp_check.js', { stdio: 'pipe' });
  console.log('SYNTAX CHECK PASSED!');
} catch (e) {
  console.log('SYNTAX ERROR:', e.stderr.toString().split('\n').find(l => l.includes('Syntax')));
}
