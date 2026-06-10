import X from 'xlsx';
const w = X.readFile('WoW Report-RSOB (2).xlsx');
const s = w.Sheets['Raw'];
const r = X.utils.sheet_to_json(s, {header:1, defval:'', raw:true});
const h = r[0];
console.log(JSON.stringify(h));
