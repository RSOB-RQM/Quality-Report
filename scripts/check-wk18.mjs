import X from 'xlsx';
const w = X.readFile('Rsob Week 18 report (1).xlsx');
// Check all sheets
console.log('Sheets:', w.SheetNames);
// Try the Data sheet
const s = w.Sheets['Data'];
if (s) {
  const r = X.utils.sheet_to_json(s, {header:1, defval:'', raw:true});
  console.log('Data sheet rows:', r.length);
  if (r.length > 0) {
    console.log('Headers:', JSON.stringify(r[0]).substring(0, 500));
    if (r.length > 1) console.log('Row1:', JSON.stringify(r[1]).substring(0, 500));
  }
}
// Try Report sheet
const s2 = w.Sheets['Report'];
if (s2) {
  const r2 = X.utils.sheet_to_json(s2, {header:1, defval:'', raw:true});
  console.log('\nReport sheet rows:', r2.length);
  if (r2.length > 0) console.log('Headers:', JSON.stringify(r2[0]).substring(0, 300));
}
