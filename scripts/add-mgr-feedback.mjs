import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let c = readFileSync('dist/index.html', 'utf8');

// Current feedback section only shows for admin with manager-wise view
// Need to also show for manager role with associate-wise view
// The current condition is: if(user.role==='admin'||(user.role==='admin'&&state.adminTab==='process'))
// which is effectively just: if(user.role==='admin')

// Fix 1: Change the condition to also show for managers
const oldCondition = "if(user.role==='admin'||(user.role==='admin'&&state.adminTab==='process'))";
const newCondition = "if(user.role==='admin'||user.role==='manager')";

if (c.includes(oldCondition)) {
  c = c.replace(oldCondition, newCondition);
  console.log('Updated feedback visibility condition');
} else {
  console.log('WARNING: Could not find old condition');
  // Try to find it with different formatting
  const altCondition = c.indexOf("user.role==='admin'&&state.adminTab==='process'");
  console.log('Alt condition at:', altCondition);
}

// Fix 2: For managers, show associate-wise feedback instead of manager-wise
// Find where fbHtml is built and add a manager-specific view
// After the admin's manager-wise table, add a manager view showing their associates

const fbHtmlEnd = c.indexOf("content+=fbHtml;");
if (fbHtmlEnd > 0) {
  // Look for the closing of the for loop that builds the table
  const beforeContentAdd = c.substring(fbHtmlEnd - 200, fbHtmlEnd);
  console.log('Before content+=fbHtml:', beforeContentAdd.substring(beforeContentAdd.length - 100));
  
  // Insert manager-specific view: for managers, override fbHtml with associate-wise data
  const managerView = `
    // Manager view: show associate-wise feedback for their team
    if(user.role==='manager'){
      var myAssocs=new Set(fRecords.filter(function(r){return r.supervisorLogin===user.login;}).map(function(r){return r.associateLogin;}));
      var fStatus=getFeedbackStatus(user.login,lastFeedbackWeek);
      fbHtml='<div class="section" style="border-left:4px solid #7c3aed"><h3 style="color:#7c3aed">Feedback Completion - Your Team (Week '+lastFeedbackWeek+')</h3><table><thead><tr><th>Associate</th><th style="text-align:center">Audited</th><th style="text-align:center">Defects</th><th style="text-align:center">Feedback Status</th></tr></thead><tbody>';
      for(var assocLogin of myAssocs){
        var assocRecs=fRecords.filter(function(r){return r.associateLogin===assocLogin&&r.supervisorLogin===user.login;});
        var assocAudited=assocRecs.length;
        var assocDefects=assocRecs.filter(function(r){return r.defectFlag;}).length;
        var assocFbStatus=fStatus&&fStatus[assocLogin]?fStatus[assocLogin]:'Pending';
        var statusColor=assocFbStatus==='Shared'?'#059669':'#d97706';
        var statusBadge=assocFbStatus==='Shared'?'<span style="background:#ecfdf5;color:#059669;padding:2px 8px;border-radius:4px;font-size:11px">Shared</span>':'<span style="background:#fffbeb;color:#d97706;padding:2px 8px;border-radius:4px;font-size:11px">Pending</span>';
        fbHtml+='<tr><td>'+assocLogin+'</td><td style="text-align:center">'+assocAudited+'</td><td style="text-align:center">'+assocDefects+'</td><td style="text-align:center">'+statusBadge+'</td></tr>';
      }
      fbHtml+='</tbody></table><p class="text-muted" style="margin-top:8px">Use the Feedback/Appreciate buttons in Raw Data to mark feedback as shared.</p></div>';
    }
`;
  
  c = c.substring(0, fbHtmlEnd) + managerView + c.substring(fbHtmlEnd);
  console.log('Added manager associate-wise feedback view');
}

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
