import { readFileSync } from 'fs';

const records = JSON.parse(readFileSync('data/audit-records.json', 'utf-8'));

// Q1 (Weeks 1-13) vs Q2 so far (Weeks 14-18)
const q1 = records.filter(r => r.transactionWeek >= 1 && r.transactionWeek <= 13);
const q2 = records.filter(r => r.transactionWeek >= 14 && r.transactionWeek <= 18);

// RRC errors
const q1RRC = q1.filter(r => r.rrc === 'No').length;
const q2RRC = q2.filter(r => r.rrc === 'No').length;

// Per-week breakdown
console.log('=== RRC (Right Reason Code) Error Trend ===\n');
console.log('Week-wise breakdown:');
const allWeeks = [...new Set(records.map(r => r.transactionWeek))].sort((a, b) => a - b);
let totalRRC = 0;
for (const wk of allWeeks) {
  const wkRecords = records.filter(r => r.transactionWeek === wk);
  const wkRRC = wkRecords.filter(r => r.rrc === 'No').length;
  const wkAudits = wkRecords.length;
  const rrcRate = (wkRRC / wkAudits * 100).toFixed(1);
  totalRRC += wkRRC;
  console.log(`  WK${wk.toString().padStart(2)}: ${wkRRC} RRC errors / ${wkAudits} audits (${rrcRate}%)`);
}

console.log('\n--- SUMMARY ---');
console.log(`Q1 (Wk 1-13): ${q1RRC} RRC errors in ${q1.length} audits (${(q1RRC/q1.length*100).toFixed(2)}%)`);
console.log(`Q2 (Wk 14-18): ${q2RRC} RRC errors in ${q2.length} audits (${(q2RRC/q2.length*100).toFixed(2)}%)`);

const reduction = q1RRC/q1.length*100 - q2RRC/q2.length*100;
const pctChange = ((q2RRC/q2.length - q1RRC/q1.length) / (q1RRC/q1.length) * 100).toFixed(1);

console.log(`\nChange: ${pctChange > 0 ? '+' : ''}${pctChange}% (${reduction > 0 ? 'improvement' : 'regression'})`);
console.log(`Q1 avg RRC rate: ${(q1RRC/q1.length*100).toFixed(2)}%`);
console.log(`Q2 avg RRC rate: ${(q2RRC/q2.length*100).toFixed(2)}%`);
console.log(`Reduction: ${reduction.toFixed(2)} percentage points`);

// Also show last 4 weeks of Q1 vs first 4 weeks of Q2 for fair comparison
const lastQ1 = records.filter(r => r.transactionWeek >= 10 && r.transactionWeek <= 13);
const firstQ2 = records.filter(r => r.transactionWeek >= 14 && r.transactionWeek <= 18);
const lastQ1RRC = lastQ1.filter(r => r.rrc === 'No').length;
const firstQ2RRC = firstQ2.filter(r => r.rrc === 'No').length;
console.log(`\nLast 4 wks of Q1 (Wk10-13): ${lastQ1RRC} RRC errors / ${lastQ1.length} audits (${(lastQ1RRC/lastQ1.length*100).toFixed(2)}%)`);
console.log(`Q2 so far (Wk14-18): ${firstQ2RRC} RRC errors / ${firstQ2.length} audits (${(firstQ2RRC/firstQ2.length*100).toFixed(2)}%)`);
const recentChange = ((firstQ2RRC/firstQ2.length - lastQ1RRC/lastQ1.length) / (lastQ1RRC/lastQ1.length) * 100).toFixed(1);
console.log(`Recent trend: ${recentChange > 0 ? '+' : ''}${recentChange}%`);
