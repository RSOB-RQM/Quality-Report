import { readFileSync } from 'fs';

const records = JSON.parse(readFileSync('data/audit-records.json', 'utf-8'));

// Check SPOC Response and Appeal Lead values
const spocValues = new Map();
const appealLeadValues = new Map();

for (const r of records) {
  if (r.spocResponse) spocValues.set(r.spocResponse, (spocValues.get(r.spocResponse) || 0) + 1);
  if (r.appealLeadDecision) appealLeadValues.set(r.appealLeadDecision, (appealLeadValues.get(r.appealLeadDecision) || 0) + 1);
}

console.log('SPOC Response values:');
[...spocValues.entries()].sort((a,b) => b[1]-a[1]).forEach(([v,c]) => console.log(`  "${v}" = ${c}`));

console.log('\nAppeal Lead Decision values:');
[...appealLeadValues.entries()].sort((a,b) => b[1]-a[1]).forEach(([v,c]) => console.log(`  "${v}" = ${c}`));

// Count how many defects have accepted appeals
const defectsWithAcceptedAppeal = records.filter(r => 
  r.defectFlag && (
    (r.spocResponse && /accept/i.test(r.spocResponse) && !/not\s*accept/i.test(r.spocResponse)) ||
    (r.appealLeadDecision && /accept/i.test(r.appealLeadDecision) && !/not\s*accept/i.test(r.appealLeadDecision))
  )
);

console.log(`\nDefects with accepted appeal (should NOT be defects): ${defectsWithAcceptedAppeal.length}`);
if (defectsWithAcceptedAppeal.length > 0) {
  console.log('Sample:');
  defectsWithAcceptedAppeal.slice(0, 5).forEach(r => {
    console.log(`  ${r.associateLogin} WK${r.transactionWeek} - SPOC: "${r.spocResponse}" / Lead: "${r.appealLeadDecision}"`);
  });
}
