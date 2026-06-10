import XLSX from 'xlsx';
import { resolve } from 'path';

// ============================================================
// DATA FROM CSVs - WIMS (W12-W21) and NA VAR (W14-W21)
// ============================================================

// WIMS data from WIMS-Data-Analysis CSV (combined NA+EU from OneView)
const wimsData = {
  12: { count: 1000, sl: 0.973 },
  13: { count: 849, sl: 0.9894 },
  14: { count: 987, sl: 0.9980 },
  15: { count: 802, sl: 0.9913 },
  16: { count: 810, sl: 0.9938 },
  17: { count: 823, sl: 0.9793 },
  18: { count: 1117, sl: 0.9821 },
  19: { count: 920, sl: 0.9859 },
  20: { count: 996, sl: 0.9639 },
  21: { count: 981, sl: 0.9602 },
};

// NA VAR data from NA-VAR-cases-summary CSV
const naVarData = {
  14: { count: 3376, sl: 0.9239 },
  15: { count: 5070, sl: 0.8925 },
  16: { count: 5309, sl: 0.9650 },
  17: { count: 5318, sl: 0.9472 },
  18: { count: 5687, sl: 0.9571 },
  19: { count: 5709, sl: 0.9489 },
  20: { count: 5165, sl: 0.9495 },
  21: { count: 4746, sl: 0.9054 },
};

// Case Count & Case SL from existing spreadsheet (OneView source)
// W12-W20 from your original tracker, W21 from ACE report (Total Cases)
const caseData = {
  12: { count: 19845, sl: 0.9861 },
  13: { count: 18062, sl: 1.0000 },
  14: { count: 18946, sl: 1.0000 },
  15: { count: 17307, sl: 0.9715 },
  16: { count: 17692, sl: 1.0000 },
  17: { count: 17748, sl: 1.0000 },
  18: { count: 18755, sl: 0.9996 },
  19: { count: 18419, sl: 1.0000 },
  20: { count: 18688, sl: 1.0000 },
  21: { count: null, sl: null }, // Not available yet - needs OneView
};

// ACE Performance data
// W12-W20: kept as-is from original tracker
// W21: from ACE Performance Report PDF (Total cases section)
const aceData = {
  12: { eligible: '70.40%', coverage: '86.30%', reopen: '22.90%' },
  13: { eligible: '69.70%', coverage: '81.70%', reopen: '28.10%' },
  14: { eligible: '53.10%', coverage: '56.90%', reopen: 'Data discrepancy' },
  15: { eligible: '54.50%', coverage: '57.20%', reopen: 'Data discrepancy' },
  16: { eligible: '58.50%', coverage: '60.30%', reopen: 'Data discrepancy' },
  17: { eligible: '72.40%', coverage: '85.50%', reopen: '26.40%' },
  18: { eligible: '73.10%', coverage: '86.20%', reopen: '28.30%' },
  19: { eligible: '71.80%', coverage: '85.60%', reopen: '26.00%' },
  20: { eligible: '72.60%', coverage: '85.60%', reopen: '24.00%' },
  21: { eligible: '72.20%', coverage: '86.30%', reopen: '25.90%' },
};

// NA VAR data for W12-W13 from original spreadsheet
const naVarExtra = {
  12: { count: 6686, sl: 0.8379 },
  13: { count: 5827, sl: 0.9489 },
};

// Merge VAR data
const varData = { ...naVarExtra, ...naVarData };

// ============================================================
// BUILD EXCEL WORKBOOK
// ============================================================

const weeks = [21, 20, 19, 18, 17, 16, 15, 14, 13, 12];
const weekHeaders = weeks.map(w => `W${w}`);

// Shrinkage data (from Connect / Quip tracker)
const shrinkageData = {
  12: '42.1%- AA behavior New leave balance got credited.',
  13: '45.3% - AA behavior New leave balance got credited.',
  14: '25.8%- AA behavior New leave balance got credited.',
  15: '19.00%',
  16: '20.20%',
  17: '22.22% - Weekend shrinkage',
  18: '19%',
  19: '21%- Weekend shrinkage',
  20: 'Data discrepancy',
  21: 'Data discrepancy',
};

// Lost Hours data from Lost-Hours-Metric CSV (LH column = lost hours %)
// Goal: 3%
const lostHoursData = {
  12: '2.75%',
  13: '3.94%',
  14: '4.13%',
  15: '4.66%',
  16: '1.92%',
  17: '4.98%',
  18: '2.90%',
  19: '2.65%',
  20: '3.12%',
  21: '4.79%',
};

// RQM Defect Rate from Quality Dashboard
// Goal: 7%
const rqmDefectData = {
  12: '6.09%',
  13: '8.04%',
  14: '7.76%',
  15: '2.63%',
  16: '3.70%',
  17: 'Data not available- tool issue',
  18: '0.98%',
  19: '1.58%',
  20: '1.12%',
  21: 'Week-1 Baseline',
};

// PKT for RS (Goal: 90%)
const pktData = {
  12: '93.83%',
  13: '93.83%',
  14: '11.07%',
  15: '22.22%',
  16: '40.74%',
  17: '71.60%',
  18: '93.83%',
  19: 'Week-2 Baseline',
  20: 'Week-2 Baseline',
  21: '20.51%',
};

// NA Escalation Trend
const escalationData = {
  12: '2.97%',
  13: '3.31%',
  14: '4.02%',
  15: '3.75%',
  16: '4.27%',
  17: '3.76%',
  18: '3.72%',
  19: '3.82%',
  20: '4.69%',
  21: 'Cases data not updated',
};

// RQM Feedback Closure (Goal: 100%)
const rqmFeedbackData = {
  12: '100%',
  13: '100%',
  14: '100%',
  15: '100%',
  16: '100%',
  17: 'Data not available- tool issue',
  18: '100%',
  19: 'Data not available',
  20: 'Week-1 Baseline',
  21: '33.33%',
};

// NA Sheet data
const naRows = [
  // Header row
  ['Metrics', 'Source', 'Goal', ...weekHeaders, 'PTG for Red'],
  // Case Count
  ['Case Count', 'One View', '-',
    ...weeks.map(w => caseData[w]?.count ?? 'Data not available')],
  // Case SL
  ['Case SL', 'One View', '95%',
    ...weeks.map(w => caseData[w]?.sl != null ? (caseData[w].sl * 100).toFixed(2) + '%' : 'Data not available'),
    '-'],
  // Wims Count
  ['Wims count', 'One View', '-',
    ...weeks.map(w => wimsData[w]?.count ?? '-')],
  // Wims SL
  ['Wims SL', 'One View', '95%',
    ...weeks.map(w => wimsData[w]?.sl != null ? (wimsData[w].sl * 100).toFixed(2) + '%' : '-'),
    '-'],
  // Var Count
  ['Var count', 'One View', '-',
    ...weeks.map(w => varData[w]?.count ?? '-')],
  // Var SL
  ['Var SL', 'One View', '95%',
    ...weeks.map(w => {
      if (!varData[w]?.sl) return '-';
      const pct = (varData[w].sl * 100).toFixed(2) + '%';
      if (varData[w].sl < 0.95) return pct;
      return pct;
    }),
    'Addressing VAR SLA miss in morning shift intervals driven by high weekend shrinkage — schedule adjustments underway to close the gap.'],
  // Shrinkage
  ['Shrinkage overall', 'Connect', '20%',
    ...weeks.map(w => shrinkageData[w] ?? 'Data discrepancy'),
    'Weekend shrinkage remains a recurring challenge across all shifts, driven by unplanned leaves and delayed communication, requiring overtime interventions — corrective actions being aligned to stabilize planning.'],
  // Blank separator
  [],
  // BAU KRAs section
  ['BAU KRAs', 'DB'],
  // Lost Hours
  ['Lost hours', 'Lost Hrs Dashboard', '3%',
    ...weeks.map(w => lostHoursData[w] ?? '-'),
    'Planned focus on improving login adherence and optimizing break management to reduce key drivers - lost login hrs & break hrs.'],
  // RQM Defect
  ['RQM Defect', 'RSOB Defect summary e-mail', '7%',
    ...weeks.map(w => rqmDefectData[w] ?? '-'),
    'RQM defects occurred due to incorrect reason code selection, driven by wrong Hawkeye tool recommendations (issue resolved in week-15). Educational flyers are being shared to improve awareness and adherence to best practices. Latest version of hawkeye pro (Ver18) has been launched & shared with the associates.'],
  // PKT for RS
  ['PKT for RS', 'Training team e-mail', '90%',
    ...weeks.map(w => pktData[w] ?? '-'),
    'Week 15 marked the first completion report, with all managers aligned and actively progressing PKT completion.'],
  // NA Escalation Trend
  ['NA Escalation Trend', 'Escalation Dashboard', '-',
    ...weeks.map(w => escalationData[w] ?? '-'),
    '-'],
  // RQM Feedback Closure
  ['RQM feedback closure', 'RQM share drive', '100%',
    ...weeks.map(w => rqmFeedbackData[w] ?? '-'),
    'Feedback compliance visibility temporarily unavailable during migration to Zeus — RQM deep dive tracking will resume once transition is complete.'],
  // Blank separator
  [],
  // HOTW section header
  ['HOTW'],
  // ACE Eligible
  ['ACE Eligible', 'DWP report', '-',
    ...weeks.map(w => aceData[w]?.eligible ?? '-')],
  // ACE Coverage
  ['ACE Coverage', 'DWP report', '-',
    ...weeks.map(w => aceData[w]?.coverage ?? '-')],
  // Reopen trend
  ['Reopen trend', 'DWP report', '-',
    ...weeks.map(w => aceData[w]?.reopen ?? 'Data discrepancy')],
];

// Create workbook
const wb = XLSX.utils.book_new();

// NA Sheet
const wsNA = XLSX.utils.aoa_to_sheet(naRows);

// Set column widths
wsNA['!cols'] = [
  { wch: 14 }, // Metrics
  { wch: 10 }, // Source
  { wch: 6 },  // Goal
  ...weeks.map(() => ({ wch: 12 })), // Week columns
  { wch: 60 }, // PTG
];

XLSX.utils.book_append_sheet(wb, wsNA, 'NA');

// ============================================================
// SUMMARY SHEET - Quick view with RAG status
// ============================================================

const summaryRows = [
  ['RSOB NA - Weekly Performance Tracker (W12-W21, 2026)'],
  [],
  ['Metric', 'Goal', 'W21', 'W20', 'W19', 'Trend', 'Status'],
  ['Case Count', '-',
    caseData[21]?.count ?? 'Pending',
    caseData[20]?.count,
    caseData[19]?.count,
    '', ''],
  ['Case SL', '95%',
    caseData[21]?.sl != null ? (caseData[21].sl * 100).toFixed(2) + '%' : 'Pending',
    (caseData[20].sl * 100).toFixed(2) + '%',
    (caseData[19].sl * 100).toFixed(2) + '%',
    'Stable', '✅ Green'],
  ['Wims Count', '-',
    wimsData[21].count,
    wimsData[20].count,
    wimsData[19].count,
    wimsData[21].count > wimsData[20].count ? '▲' : '▼', ''],
  ['Wims SL', '95%',
    (wimsData[21].sl * 100).toFixed(2) + '%',
    (wimsData[20].sl * 100).toFixed(2) + '%',
    (wimsData[19].sl * 100).toFixed(2) + '%',
    wimsData[21].sl > wimsData[20].sl ? '▲ Improving' : '▼ Declining',
    wimsData[21].sl >= 0.95 ? '✅ Green' : '❌ Red'],
  ['Var Count', '-',
    varData[21]?.count ?? '-',
    varData[20]?.count ?? '-',
    varData[19]?.count ?? '-',
    '', ''],
  ['Var SL', '95%',
    varData[21]?.sl ? (varData[21].sl * 100).toFixed(2) + '%' : '-',
    varData[20]?.sl ? (varData[20].sl * 100).toFixed(2) + '%' : '-',
    varData[19]?.sl ? (varData[19].sl * 100).toFixed(2) + '%' : '-',
    varData[21]?.sl > varData[20]?.sl ? '▲ Improving' : '▼ Declining',
    varData[21]?.sl >= 0.95 ? '✅ Green' : '❌ Red'],
  ['Shrinkage', '20%',
    shrinkageData[21],
    shrinkageData[20],
    shrinkageData[19],
    '', ''],
  [],
  ['ACE Eligible', '-',
    aceData[21].eligible,
    aceData[20].eligible,
    aceData[19].eligible,
    '', ''],
  ['ACE Coverage', '-',
    aceData[21].coverage,
    aceData[20].coverage,
    aceData[19].coverage,
    '', ''],
  ['Reopen trend', '-',
    aceData[21].reopen,
    aceData[20].reopen,
    aceData[19].reopen,
    '', ''],
];

const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
wsSummary['!cols'] = [
  { wch: 14 }, { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }
];
XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

// Write file
const outPath = resolve('Weekly Performance- For reporting.xlsx');
XLSX.writeFile(wb, outPath);

console.log('✅ Created: Weekly Performance- For reporting.xlsx');
console.log('');
console.log('=== W21 HIGHLIGHTS ===');
console.log(`  Wims Count: ${wimsData[21].count}`);
console.log(`  Wims SL:    ${(wimsData[21].sl * 100).toFixed(2)}% ${wimsData[21].sl >= 0.95 ? '✅' : '❌'}`);
console.log(`  Var Count:  ${varData[21].count}`);
console.log(`  Var SL:     ${(varData[21].sl * 100).toFixed(2)}% ${varData[21].sl >= 0.95 ? '✅' : '❌'}`);
console.log(`  Case Count: ${caseData[21]?.count ?? 'PENDING - needs OneView data'}`);
console.log(`  Case SL:    ${caseData[21]?.sl != null ? (caseData[21].sl * 100).toFixed(2) + '%' : 'PENDING - needs OneView data'}`);
console.log('');
console.log('⚠️  VAR SL at 90.54% is BELOW 95% goal - flag as Red');
console.log('⚠️  Case Count/SL for W21 not available in CSVs - update from OneView');
