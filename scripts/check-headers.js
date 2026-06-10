import X from 'xlsx';
var w=X.readFile('2026-RQM.xlsx');
var s=w.Sheets[w.SheetNames[0]];
var r=X.utils.sheet_to_json(s,{header:1,defval:'',raw:true});
var h=r[0];
console.log('Total cols:', h.length);
for(var i=60;i<h.length;i++) console.log(i, JSON.stringify(h[i]));
// Check a sample row for week 8
var wi = h.indexOf('Transaction Week');
for(var i=1;i<r.length;i++){
  if(String(r[i][wi])==='8'){
    console.log('\nSample week 8 row:');
    for(var j=60;j<h.length;j++) console.log(h[j],'=',JSON.stringify(r[i][j]));
    break;
  }
}
