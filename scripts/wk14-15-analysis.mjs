import { readFileSync } from 'fs';

const records = JSON.parse(readFileSync('data/audit-records.json', 'utf-8'));

// Check W14 & W15 defect rates vs surrounding weeks
console.log('=== WEEK 14 & 15 DEEP DIVE ===\n');
const weeks = [12, 13, 14, 15, 16, 18];
for (const wk of weeks) {
  const wkRecs = records.filter(r => r.transactionWeek === wk);
  const defects = wkRecs.filter(r => r.defectFlag);
  const rate = (defects.length / wkRecs.length * 100).toFixed(1);
  console.log(`WK${wk}: ${defects.length}/${wkRecs.length} = ${rate}%`);
}

// W14 error breakdown
console.log('\n--- WK14 Error Breakdown ---');
const wk14 = records.filter(r => r.transactionWeek === 14);
const wk14d = wk14.filter(r => r.defectFlag);
console.log(`Defects: ${wk14d.length}/${wk14.length} = ${(wk14d.length/wk14.length*100).toFixed(1)}%`);
const attrs14 = {ADM:0, RA:0, RRC:0, ACC:0, RV:0};
for (const r of wk14d) {
  if (r.adm==='No') attrs14.ADM++;
  if (r.ra==='No') attrs14.RA++;
  if (r.rrc==='No') attrs14.RRC++;
  if (r.acc==='No') attrs14.ACC++;
  if (r.rv==='No') attrs14.RV++;
}
console.log('Attributes:', JSON.stringify(attrs14));
// Top findings W14
const f14 = new Map();
const attrKeys = [{key:'adm',fKey:'admFinding',l:'ADM'},{key:'ra',fKey:'raFinding',l:'RA'},{key:'rrc',fKey:'rrcFinding',l:'RRC'},{key:'acc',fKey:'accFinding',l:'ACC'},{key:'rv',fKey:'rvFinding',l:'RV'}];
for (const r of wk14d) {
  for (const a of attrKeys) {
    if (r[a.key]==='No' && r[a.fKey]) f14.set(a.l+': '+r[a.fKey], (f14.get(a.l+': '+r[a.fKey])||0)+1);
  }
}
console.log('Top findings:');
[...f14.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([f,c])=>console.log(`  ${c}x - ${f}`));

// W15 error breakdown
console.log('\n--- WK15 Error Breakdown ---');
const wk15 = records.filter(r => r.transactionWeek === 15);
const wk15d = wk15.filter(r => r.defectFlag);
console.log(`Defects: ${wk15d.length}/${wk15.length} = ${(wk15d.length/wk15.length*100).toFixed(1)}%`);
const attrs15 = {ADM:0, RA:0, RRC:0, ACC:0, RV:0};
for (const r of wk15d) {
  if (r.adm==='No') attrs15.ADM++;
  if (r.ra==='No') attrs15.RA++;
  if (r.rrc==='No') attrs15.RRC++;
  if (r.acc==='No') attrs15.ACC++;
  if (r.rv==='No') attrs15.RV++;
}
console.log('Attributes:', JSON.stringify(attrs15));
const f15 = new Map();
for (const r of wk15d) {
  for (const a of attrKeys) {
    if (r[a.key]==='No' && r[a.fKey]) f15.set(a.l+': '+r[a.fKey], (f15.get(a.l+': '+r[a.fKey])||0)+1);
  }
}
console.log('Top findings:');
[...f15.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([f,c])=>console.log(`  ${c}x - ${f}`));

// W16 & W18 (the improved weeks)
console.log('\n--- WK16 Error Breakdown ---');
const wk16 = records.filter(r => r.transactionWeek === 16);
const wk16d = wk16.filter(r => r.defectFlag);
console.log(`Defects: ${wk16d.length}/${wk16.length} = ${(wk16d.length/wk16.length*100).toFixed(1)}%`);
const attrs16 = {ADM:0, RA:0, RRC:0, ACC:0, RV:0};
for (const r of wk16d) {
  if (r.adm==='No') attrs16.ADM++;
  if (r.ra==='No') attrs16.RA++;
  if (r.rrc==='No') attrs16.RRC++;
  if (r.acc==='No') attrs16.ACC++;
  if (r.rv==='No') attrs16.RV++;
}
console.log('Attributes:', JSON.stringify(attrs16));

console.log('\n--- WK18 Error Breakdown ---');
const wk18 = records.filter(r => r.transactionWeek === 18);
const wk18d = wk18.filter(r => r.defectFlag);
console.log(`Defects: ${wk18d.length}/${wk18.length} = ${(wk18d.length/wk18.length*100).toFixed(1)}%`);
const attrs18 = {ADM:0, RA:0, RRC:0, ACC:0, RV:0};
for (const r of wk18d) {
  if (r.adm==='No') attrs18.ADM++;
  if (r.ra==='No') attrs18.RA++;
  if (r.rrc==='No') attrs18.RRC++;
  if (r.acc==='No') attrs18.ACC++;
  if (r.rv==='No') attrs18.RV++;
}
console.log('Attributes:', JSON.stringify(attrs18));

// Region split for W14-15
console.log('\n--- W14 by Region ---');
for (const reg of ['NA','EU']) {
  const recs = wk14.filter(r => r.region === reg);
  const def = recs.filter(r => r.defectFlag).length;
  console.log(`  ${reg}: ${def}/${recs.length} = ${(def/recs.length*100).toFixed(1)}%`);
}
console.log('--- W15 by Region ---');
for (const reg of ['NA','EU']) {
  const recs = wk15.filter(r => r.region === reg);
  const def = recs.filter(r => r.defectFlag).length;
  console.log(`  ${reg}: ${def}/${recs.length} = ${(def/recs.length*100).toFixed(1)}%`);
}
