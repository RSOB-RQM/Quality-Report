import X from 'xlsx';
const w = X.readFile('Rsob Week 18 report (1).xlsx');
const s = w.Sheets['Data'];
const r = X.utils.sheet_to_json(s, {header:1, defval:'', raw:true});
const h = r[0];

// Find the key columns
const cols = {
  login: h.indexOf('sourceContext.Associate_Login'),
  supervisor: h.indexOf('sourceContext.Supervisor_Login'),
  supervisor2: h.indexOf('sourceContext.Supervisor'),
  week: h.indexOf('sourceContext.WeekNo'),
  region: h.indexOf('sourceContext.Region'),
  disruption: h.indexOf('sourceContext.Disruption_Type'),
  txDate: h.indexOf('sourceContext.Transaction_Date'),
  txId: h.indexOf('sourceContext.Transaction_ID'),
  adm: h.indexOf('sourceContext.Associate_Decision_Making'),
  ra: h.indexOf('sourceContext.SW_Adherence_Right_Action'),
  rrc: h.indexOf('sourceContext.Right_Reason_Code'),
  acc: h.indexOf('sourceContext.Accurate_&_Complete_Communication'),
  accAlt: h.indexOf('sourceContext.Accurate_n_Complete_Communication'),
  rv: h.indexOf('sourceContext.Required_Validation'),
  defect: h.indexOf('sourceContext.Defect_Present'),
  team: h.indexOf('sourceContext.Team'),
  subDisruption: h.indexOf('sourceContext.Sub_Disruption_Type'),
  assignedUser: h.indexOf('assignedUser'),
};
console.log('Column indices:', JSON.stringify(cols, null, 2));

// Check a few rows to understand the values
console.log('\nSample rows (first 5 with data):');
let count = 0;
for (let i = 1; i < r.length && count < 5; i++) {
  const row = r[i];
  const login = row[cols.login];
  const sup = row[cols.supervisor] || row[cols.supervisor2];
  if (!login && !sup) continue;
  count++;
  console.log(`Row ${i}: login=${login}, sup=${sup}, sup2=${row[cols.supervisor2]}, assigned=${row[cols.assignedUser]}`);
  console.log(`  ADM=${JSON.stringify(row[cols.adm])}, RA=${JSON.stringify(row[cols.ra])}, RRC=${JSON.stringify(row[cols.rrc])}`);
  console.log(`  ACC=${JSON.stringify(row[cols.acc])}, ACC_alt=${JSON.stringify(row[cols.accAlt])}, RV=${JSON.stringify(row[cols.rv])}`);
  console.log(`  Defect=${JSON.stringify(row[cols.defect])}, Region=${row[cols.region]}, Week=${row[cols.week]}`);
}
