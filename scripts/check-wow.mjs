import X from 'xlsx';
const w = X.readFile('WoW Report-RSOB (2).xlsx');
const s = w.Sheets['Raw'];
const r = X.utils.sheet_to_json(s, {header:1, defval:'', raw:true});
const h = r[0];
// Print headers 29+
for (let i = 29; i < h.length; i++) console.log(i, JSON.stringify(h[i]));
// Find weeks
const wi = h.indexOf('Transaction Week');
const weeks = new Set();
for (let i = 1; i < r.length; i++) {
  const v = r[i][wi];
  if (v !== '') weeks.add(v);
}
console.log('---');
console.log('Weeks found:', JSON.stringify([...weeks].sort((a,b) => a-b)));
// Sample row
for (let i = 1; i < r.length; i++) {
  if (r[i][wi] === 15 || r[i][wi] === 16) {
    console.log('Sample row week', r[i][wi], ':');
    for (let j = 0; j < Math.min(h.length, 40); j++) console.log(' ', h[j], '=', JSON.stringify(r[i][j]));
    break;
  }
}
