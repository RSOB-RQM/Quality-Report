import X from 'xlsx';
const w = X.readFile('WoW Report-RSOB (2).xlsx');
const s = w.Sheets['Raw'];
const r = X.utils.sheet_to_json(s, {header:1, defval:'', raw:true});
const h = r[0];
const wi = h.indexOf('Transaction Week');
const weeks = {};
for (let i = 1; i < r.length; i++) {
  const v = r[i][wi];
  if (v !== '') weeks[v] = (weeks[v] || 0) + 1;
}
console.log('Week distribution:', JSON.stringify(weeks));
// Check if KR1 = DM (ADM)
const kr1i = h.indexOf('KR1');
const ri = h.indexOf('Region');
console.log('KR1 col index:', kr1i, 'Region col:', ri);
// Sample row
const row = r[1];
console.log('Sample: KR1=', row[kr1i], 'Region=', row[ri], 'Week=', row[wi], 'Alogin=', row[h.indexOf('Alogin')], 'Supervisor=', row[h.indexOf('Supervisor Login')]);
