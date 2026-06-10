import { readFileSync } from 'fs';

const records = JSON.parse(readFileSync('data/audit-records.json', 'utf-8'));
const na = records.filter(r => r.region === 'NA');

const q1 = na.filter(r => r.transactionWeek >= 1 && r.transactionWeek <= 13);
const q2 = na.filter(r => r.transactionWeek >= 14 && r.transactionWeek <= 18);

const q1RRC = q1.filter(r => r.rrc === 'No').length;
const q2RRC = q2.filter(r => r.rrc === 'No').length;

console.log('=== RRC Errors — NA Region Only ===\n');
console.log('Week-wise:');
const allWeeks = [...new Set(na.map(r => r.transactionWeek))].sort((a, b) => a - b);
for (const wk of allWeeks) {
  const wkRecs = na.filter(r => r.transactionWeek === wk);
  const wkRRC = wkRecs.filter(r => r.rrc === 'No').length;
  console.log(`  WK${wk.toString().padStart(2)}: ${wkRRC} RRC errors / ${wkRecs.length} audits (${(wkRRC/wkRecs.length*100).toFixed(1)}%)`);
}

console.log('\n--- SUMMARY ---');
console.log(`Q1 (Wk 1-13): ${q1RRC} RRC errors / ${q1.length} audits (${(q1RRC/q1.length*100).toFixed(2)}%)`);
console.log(`Q2 (Wk 14-18): ${q2RRC} RRC errors / ${q2.length} audits (${(q2RRC/q2.length*100).toFixed(2)}%)`);

const q1Rate = q1RRC/q1.length*100;
const q2Rate = q2RRC/q2.length*100;
const pctChange = ((q2Rate - q1Rate) / q1Rate * 100).toFixed(1);
console.log(`\nReduction: ${(q1Rate - q2Rate).toFixed(2)} pp`);
console.log(`% Change: ${pctChange > 0 ? '+' : ''}${pctChange}%`);
