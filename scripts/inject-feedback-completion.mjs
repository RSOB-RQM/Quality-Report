import { readFileSync, writeFileSync } from 'fs';

const files = ['dist/dashboard.html', 'dist/index.html'];

const renderFeedbackCompletionFn = `
function renderFeedbackCompletion(summaries){
  var user=state.user;
  if(user.role==='associate')return '';
  var allDataWeeks=getAvailableWeeks();
  var mostRecentWeek=allDataWeeks.length>0?allDataWeeks[allDataWeeks.length-1]:0;
  var selectedWeeks=state.filters.selectedWeeks;
  var currentWeek=selectedWeeks.length>0?Math.max.apply(null,selectedWeeks):mostRecentWeek;
  if(currentWeek<15)return '';
  var isCurrentWeek=currentWeek===mostRecentWeek;
  var associateLogins=summaries.map(function(s){return s.associateLogin;});
  initFeedbackTracker(user.login,currentWeek,associateLogins);
  var fStatus=getFeedbackStatus(user.login,currentWeek);
  var totalAssoc=associateLogins.length;
  var sharedCount=0;
  for(var i=0;i<associateLogins.length;i++){
    var st=fStatus[associateLogins[i]]||'Pending';
    if(st==='Shared'||!isCurrentWeek)sharedCount++;
  }
  var pct=totalAssoc>0?Math.round((sharedCount/totalAssoc)*100):0;
  var pctColor=pct===100?'#059669':pct>=50?'#d97706':'#dc2626';
  var rows='';
  for(var j=0;j<summaries.length;j++){
    var s=summaries[j];
    var assocStatus=isCurrentWeek?(fStatus[s.associateLogin]||'Pending'):'Completed';
    var statusBadge='';
    if(assocStatus==='Shared'||assocStatus==='Completed'){
      statusBadge='<span style="background:#ecfdf5;color:#059669;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">'+assocStatus+'</span>';
    }else{
      statusBadge='<span style="background:#fffbeb;color:#d97706;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">Pending</span>';
    }
    rows+='<tr><td>'+s.associateLogin+'</td><td style="text-align:center">'+s.totalAudits+'</td><td style="text-align:center">'+s.totalDefects+'</td><td style="text-align:center;font-weight:600;color:'+rateColor(s.defectRate)+'">'+s.defectRate+'%</td><td style="text-align:center">'+statusBadge+'</td></tr>';
  }
  var html='<div class="section" style="border-left:4px solid #7c3aed">';
  html+='<div class="flex-between mb-8"><h3 style="color:#7c3aed">Feedback Completion % (Week '+currentWeek+')</h3>';
  html+='<span style="font-size:20px;font-weight:700;color:'+pctColor+'">'+pct+'%</span></div>';
  html+='<div style="background:#f1f5f9;border-radius:8px;height:8px;margin-bottom:12px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+pctColor+';border-radius:8px;transition:width .3s"></div></div>';
  html+='<p class="text-muted mb-8">'+sharedCount+' of '+totalAssoc+' associates feedback shared</p>';
  html+='<div style="overflow-x:auto"><table><thead><tr><th>Associate</th><th style="text-align:center">Audited</th><th style="text-align:center">Defects</th><th style="text-align:center">Defect Rate</th><th style="text-align:center">Feedback Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  html+='</div>';
  return html;
}

`;

for (const file of files) {
  console.log(`\n=== Processing ${file} ===`);
  let c;
  try { c = readFileSync(file, 'utf8'); } catch(e) { console.log('SKIP: file not found'); continue; }
  console.log('File length:', c.length);
  
  if (c.indexOf('renderFeedbackCompletion') >= 0) {
    console.log('Already has renderFeedbackCompletion - skipping');
    continue;
  }

  // 1. Add renderFeedbackCompletion function before renderAssociateSummary
  const fnInsertTarget = 'function renderAssociateSummary';
  const fnIdx = c.indexOf(fnInsertTarget);
  if (fnIdx > 0) {
    c = c.substring(0, fnIdx) + renderFeedbackCompletionFn + c.substring(fnIdx);
    console.log('Added renderFeedbackCompletion function');
  } else {
    console.log('ERROR: Could not find renderAssociateSummary function');
    continue;
  }

  // 2. Insert call in renderDashboard before associate summary
  const insertBefore2 = "// Associate summary (admin/manager/l5)";
  let insertIdx = c.indexOf(insertBefore2);

  if (insertIdx > 0) {
    const feedbackCall = "// Feedback Completion % section\n  if(user.role!=='associate'){\n    content+=renderFeedbackCompletion(associateSummaries);\n  }\n  ";
    c = c.substring(0, insertIdx) + feedbackCall + c.substring(insertIdx);
    console.log('Added renderFeedbackCompletion call in renderDashboard');
  } else {
    // Try alternative: insert right before content+=renderAssociateSummary
    const altTarget = "content+=renderAssociateSummary(associateSummaries,repeatedDefaulters);";
    const altIdx = c.indexOf(altTarget);
    if (altIdx > 0) {
      const feedbackCall = "content+=renderFeedbackCompletion(associateSummaries);\n    ";
      c = c.substring(0, altIdx) + feedbackCall + c.substring(altIdx);
      console.log('Added renderFeedbackCompletion call (alt method)');
    } else {
      console.log('ERROR: Could not find insertion point for function call');
    }
  }

  writeFileSync(file, c, 'utf8');
  console.log('Saved. New length:', c.length);
}
console.log('\nDone!');
