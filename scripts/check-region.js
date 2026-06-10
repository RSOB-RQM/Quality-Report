import X from 'xlsx';
var w=X.readFile('2026-RQM.xlsx');
var s=w.Sheets[w.SheetNames[0]];
var r=X.utils.sheet_to_json(s,{header:1,defval:'',raw:true});
var h=r[0];
// Find Region column
var ri = h.findIndex(c => String(c).toLowerCase().includes('region'));
console.log('Region col index:', ri, 'Header:', h[ri]);
if (ri >= 0) {
  var vals = new Set();
  for (var i=1;i<r.length;i++) { if(r[i][ri]) vals.add(r[i][ri]); }
  console.log('Region values:', [...vals]);
  // Count per region
  var counts = {};
  for (var i=1;i<r.length;i++) { var v=r[i][ri]||'empty'; counts[v]=(counts[v]||0)+1; }
  console.log('Counts:', counts);
}
// Also check all headers for anything region-like
for(var i=0;i<h.length;i++) {
  var hl = String(h[i]).toLowerCase();
  if(hl.includes('region') || hl.includes('na') || hl.includes('eu') || hl.includes('site')) {
    console.log('Col', i, ':', h[i]);
  }
}
