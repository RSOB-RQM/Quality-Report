import X from 'xlsx';
const w = X.readFile('Rsob Week 18 report (1).xlsx');
const s = w.Sheets['Data'];
const r = X.utils.sheet_to_json(s, {header:1, defval:'', raw:true});
const h = r[0];
// Find RSOB-relevant columns
const relevant = h.filter(col => 
  /associate|supervisor|login|week|region|disruption|decision|action|reason|validation|communication|overall|defect|transaction/i.test(col)
);
console.log('Relevant columns:');
relevant.forEach(c => console.log(' ', c));
// Check specific columns
const cols = [
  'sourceContext.Associate_Login',
  'sourceContext.Supervisor_Login', 
  'sourceContext.WeekNo',
  'sourceContext.Region',
  'sourceContext.Disruption_Type',
  'sourceContext.Transaction_Date',
  'sourceContext.Transaction_ID',
  'sourceContext.Associate_Decision_Making',
  'sourceContext.SW_Adherence_Right_Action',
  'sourceContext.Right_Reason_Code',
  'sourceContext.Accurate_&_Complete_Communication',
  'sourceContext.Required_Validation',
  'sourceContext.Defect_Present',
  'sourceContext.Sub_Disruption_Type',
  'sourceContext.Accurate_n_Complete_Communication'
];
console.log('\nSample values from row 1:');
for (const col of cols) {
  const idx = h.indexOf(col);
  if (idx >= 0) console.log(' ', col, '=', JSON.stringify(r[1][idx]));
  else console.log(' ', col, '= NOT FOUND');
}
// Check week distribution
const wi = h.indexOf('sourceContext.WeekNo');
const weeks = {};
for (let i = 1; i < r.length; i++) {
  const v = r[i][wi];
  if (v !== '') weeks[v] = (weeks[v] || 0) + 1;
}
console.log('\nWeek distribution:', JSON.stringify(weeks));
