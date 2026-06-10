import { readFileSync } from 'fs';

const records = JSON.parse(readFileSync('data/audit-records.json', 'utf-8'));

// Q1 = Weeks 1-13 (January - March 2026)
const q1 = records.filter(r => r.transactionWeek >= 1 && r.transactionWeek <= 13);
const q1Defects = q1.filter(r => r.defectFlag);

console.log('=== Q1 (Weeks 1-13) QUALITY ANALYSIS ===\n');
console.log(`Total Audits: ${q1.length}`);
console.log(`Total Defects: ${q1Defects.length}`);
console.log(`Defect Rate: ${(q1Defects.length / q1.length * 100).toFixed(2)}%\n`);

// Weekly trend
console.log('--- WEEKLY TREND ---');
const weekMap = new Map();
for (const r of q1) {
  if (!weekMap.has(r.transactionWeek)) weekMap.set(r.transactionWeek, { audits: 0, defects: 0 });
  const w = weekMap.get(r.transactionWeek);
  w.audits++;
  if (r.defectFlag) w.defects++;
}
const weeks = [...weekMap.entries()].sort((a, b) => a[0] - b[0]);
for (const [wk, d] of weeks) {
  const rate = (d.defects / d.audits * 100).toFixed(1);
  console.log(`  WK${wk.toString().padStart(2)}: ${d.audits} audits, ${d.defects} defects, ${rate}% rate`);
}

// Region breakdown
console.log('\n--- REGION BREAKDOWN ---');
const regionMap = new Map();
for (const r of q1) {
  const reg = r.region || 'Unknown';
  if (!regionMap.has(reg)) regionMap.set(reg, { audits: 0, defects: 0 });
  const x = regionMap.get(reg);
  x.audits++;
  if (r.defectFlag) x.defects++;
}
for (const [reg, d] of regionMap) {
  console.log(`  ${reg}: ${d.audits} audits, ${d.defects} defects, ${(d.defects/d.audits*100).toFixed(1)}% rate`);
}

// Error attribute breakdown
console.log('\n--- ERROR ATTRIBUTE BREAKDOWN ---');
const attrs = { ADM: 0, RA: 0, RRC: 0, ACC: 0, RV: 0 };
for (const r of q1Defects) {
  if (r.adm === 'No') attrs.ADM++;
  if (r.ra === 'No') attrs.RA++;
  if (r.rrc === 'No') attrs.RRC++;
  if (r.acc === 'No') attrs.ACC++;
  if (r.rv === 'No') attrs.RV++;
}
const totalErrors = Object.values(attrs).reduce((a, b) => a + b, 0);
for (const [attr, count] of Object.entries(attrs).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${attr}: ${count} errors (${(count/totalErrors*100).toFixed(1)}% of all errors)`);
}

// Top findings
console.log('\n--- TOP FINDINGS (by frequency) ---');
const findingMap = new Map();
const attrKeys = [
  { key: 'adm', fKey: 'admFinding', label: 'ADM' },
  { key: 'ra', fKey: 'raFinding', label: 'RA' },
  { key: 'rrc', fKey: 'rrcFinding', label: 'RRC' },
  { key: 'acc', fKey: 'accFinding', label: 'ACC' },
  { key: 'rv', fKey: 'rvFinding', label: 'RV' },
];
for (const r of q1Defects) {
  for (const a of attrKeys) {
    if (r[a.key] === 'No' && r[a.fKey]) {
      const k = `${a.label}: ${r[a.fKey]}`;
      findingMap.set(k, (findingMap.get(k) || 0) + 1);
    }
  }
}
const topFindings = [...findingMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [finding, count] of topFindings) {
  console.log(`  ${count}x - ${finding}`);
}

// Repeated defaulters (3+ weeks with defects in Q1)
console.log('\n--- REPEATED DEFAULTERS (3+ weeks with defects) ---');
const assocWeeks = new Map();
for (const r of q1Defects) {
  if (!assocWeeks.has(r.associateLogin)) assocWeeks.set(r.associateLogin, new Set());
  assocWeeks.get(r.associateLogin).add(r.transactionWeek);
}
const defaulters = [...assocWeeks.entries()]
  .filter(([, weeks]) => weeks.size >= 3)
  .map(([login, weeks]) => ({ login, weeksWithDefects: weeks.size }))
  .sort((a, b) => b.weeksWithDefects - a.weeksWithDefects);
for (const d of defaulters) {
  console.log(`  ${d.login}: ${d.weeksWithDefects} weeks with defects`);
}

// Manager-wise performance
console.log('\n--- MANAGER-WISE DEFECT RATE ---');
const mgrMap = new Map();
for (const r of q1) {
  if (!mgrMap.has(r.supervisorLogin)) mgrMap.set(r.supervisorLogin, { audits: 0, defects: 0 });
  const m = mgrMap.get(r.supervisorLogin);
  m.audits++;
  if (r.defectFlag) m.defects++;
}
const mgrList = [...mgrMap.entries()]
  .map(([mgr, d]) => ({ mgr, ...d, rate: d.defects / d.audits * 100 }))
  .sort((a, b) => b.rate - a.rate);
for (const m of mgrList) {
  const bar = m.rate > 10 ? '🔴' : m.rate > 5 ? '🟡' : '🟢';
  console.log(`  ${bar} ${m.mgr}: ${m.audits} audits, ${m.defects} defects, ${m.rate.toFixed(1)}%`);
}

// Month-over-month
console.log('\n--- MONTHLY TREND ---');
const monthMap = new Map();
for (const r of q1) {
  const m = r.transactionDate ? r.transactionDate.substring(5, 7) : '??';
  if (!monthMap.has(m)) monthMap.set(m, { audits: 0, defects: 0 });
  const x = monthMap.get(m);
  x.audits++;
  if (r.defectFlag) x.defects++;
}
const monthNames = { '01': 'January', '02': 'February', '03': 'March', '04': 'April' };
for (const [m, d] of [...monthMap.entries()].sort()) {
  console.log(`  ${monthNames[m] || m}: ${d.audits} audits, ${d.defects} defects, ${(d.defects/d.audits*100).toFixed(1)}%`);
}

// Improvement trajectory
console.log('\n--- IMPROVEMENT TRAJECTORY ---');
const firstHalf = q1.filter(r => r.transactionWeek <= 6);
const secondHalf = q1.filter(r => r.transactionWeek >= 7 && r.transactionWeek <= 13);
const fhDefects = firstHalf.filter(r => r.defectFlag).length;
const shDefects = secondHalf.filter(r => r.defectFlag).length;
const fhRate = (fhDefects / firstHalf.length * 100).toFixed(1);
const shRate = (shDefects / secondHalf.length * 100).toFixed(1);
console.log(`  Weeks 1-6:  ${fhRate}% defect rate (${fhDefects}/${firstHalf.length})`);
console.log(`  Weeks 7-13: ${shRate}% defect rate (${shDefects}/${secondHalf.length})`);
const improvement = ((fhRate - shRate) / fhRate * 100).toFixed(1);
if (improvement > 0) console.log(`  📈 ${improvement}% improvement from first half to second half`);
else console.log(`  📉 ${Math.abs(improvement)}% regression from first half to second half`);
