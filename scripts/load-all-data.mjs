/**
 * Load all audit data from multiple Excel sources:
 * 1. WoW Report-RSOB (2).xlsx - Raw sheet (weeks 1-16, same format as original)
 * 2. Rsob Week 18 report (1).xlsx - Data sheet (week 18, Zeus export format)
 * 
 * Merges into data/audit-records.json
 */
import { readFileSync, writeFileSync } from 'fs';
import X from 'xlsx';

// ============================================================================
// PARSE WoW Report (weeks 1-16) - same format as 2026-RQM.xlsx
// ============================================================================
function parseWoWReport(filePath) {
  const buffer = readFileSync(filePath);
  const wb = X.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets['Raw'];
  if (!ws) { console.error('No "Raw" sheet found in', filePath); return []; }
  
  const rows = X.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
  if (rows.length < 2) return [];
  
  const h = rows[0];
  // Build column index map
  const col = (name) => h.indexOf(name);
  
  const records = [];
  let skipped = 0;
  
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const login = String(r[col('Alogin')] || '').trim();
    const supervisor = String(r[col('Supervisor Login')] || '').trim();
    const weekRaw = r[col('Transaction Week')];
    const week = Number(weekRaw);
    
    // Skip rows missing required fields
    if (!login || !supervisor || isNaN(week) || week < 1) { skipped++; continue; }
    
    // Only include 2026 weeks (1-52)
    // Skip weeks 51, 52 (those are from 2025 based on the year column)
    const yearCol = col('Year');
    if (yearCol >= 0) {
      const year = r[yearCol];
      if (year && Number(year) !== 2026) { skipped++; continue; }
    } else {
      // No year column - skip weeks > 18 (likely 2025 data)
      if (week > 50) { skipped++; continue; }
    }
    
    const region = String(r[col('Region')] || '').trim();
    const overallPctCol = col('Overall%');
    const overallPct = overallPctCol >= 0 ? r[overallPctCol] : undefined;
    
    // Derive defectFlag from Overall%
    let defectFlag = false;
    if (overallPct !== undefined && overallPct !== '') {
      const num = Number(overallPct);
      if (!isNaN(num)) defectFlag = num < 1;
    } else {
      // Fallback to audit_email
      const auditEmail = String(r[col('audit_email')] || '').trim().toUpperCase();
      defectFlag = auditEmail === 'TRUE' || auditEmail === 'YES';
    }
    
    // KR1 = DM (ADM) in this format
    const admVal = String(r[col('KR1')] || '').trim();
    const raVal = String(r[col('RA')] || '').trim();
    const rrcVal = String(r[col('RRC')] || '').trim();
    const accVal = String(r[col('ACC')] || '').trim();
    const rvVal = String(r[col('RV')] || '').trim();
    
    records.push({
      team: String(r[col('Team')] || '').trim(),
      region,
      disruptionType: String(r[col('Disruption Type')] || '').trim(),
      subTransactionType: String(r[col('Sub-Transaction Type')] || '').trim(),
      qaMonitoringDate: excelDateToString(r[col('QA Monitoring Date')]),
      transactionDate: excelDateToString(r[col('Transaction Date')]),
      transactionId: String(r[col('Transaction ID')] || '').trim(),
      associateLogin: login,
      associateStatus: String(r[col('Associate Status')] || '').trim(),
      supervisorLogin: supervisor,
      supervisorEmail: String(r[col('Supervisor Email')] || '').trim(),
      transactionWeek: week,
      subDisruptionType: String(r[col('Sub Disruption Type')] || '').trim(),
      adm: admVal || 'Yes',
      admFinding: String(r[col('KR1_A1')] || '').trim(),
      comments1: String(r[col('Comments1')] || '').trim(),
      ra: raVal || 'Yes',
      raFinding: String(r[col('RA1_A1')] || '').trim(),
      comments2: String(r[col('Comments2')] || '').trim(),
      rrc: rrcVal || 'Yes',
      rrcFinding: String(r[col('RRC_A1')] || '').trim(),
      comments3: String(r[col('Comments3')] || '').trim(),
      acc: accVal || 'Yes',
      accFinding: String(r[col('ACC_A1')] || '').trim(),
      comments4: String(r[col('Comments4')] || '').trim(),
      rv: rvVal || 'Yes',
      rvFinding: String(r[col('RV_A1')] || '').trim(),
      comments5: String(r[col('Comments5')] || '').trim(),
      spResponse: String(r[col('Sp Response')] || '').trim(),
      spComment: String(r[col('SP Comment')] || '').trim(),
      spocLogin: String(r[col('spoc_login')] || '').trim(),
      spocResponse: String(r[col('SPOC Response')] || '').trim(),
      spocComment: String(r[col('SPOC Comment')] || '').trim(),
      reAppealFlag: String(r[col('Supervisor to Re-appeal')] || '').trim(),
      reAppealComment: String(r[col('SP Comment2')] || '').trim(),
      appealLeadLogin: String(r[col('Appeal Lead Login')] || '').trim(),
      appealLeadDecision: String(r[col('Appeal Lead on Re-appeal')] || '').trim(),
      appealLeadComment: String(r[col('Appeal Lead Comment')] || '').trim(),
      defectFlag,
    });
  }
  
  console.log(`  WoW Report: ${records.length} records parsed, ${skipped} skipped`);
  return records;
}

// ============================================================================
// PARSE Week 18 Zeus Export
// ============================================================================
function parseWeek18(filePath) {
  const buffer = readFileSync(filePath);
  const wb = X.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets['Data'];
  if (!ws) { console.error('No "Data" sheet found in', filePath); return []; }
  
  const rows = X.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
  if (rows.length < 2) return [];
  
  const h = rows[0];
  const col = (name) => h.indexOf(name);
  
  const records = [];
  let skipped = 0;
  
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const login = String(r[col('sourceContext.Associate_Login')] || '').trim();
    // Supervisor: try sourceContext.Supervisor first, then assignedUser
    let supervisor = String(r[col('sourceContext.Supervisor_Login')] || '').trim();
    if (!supervisor) supervisor = String(r[col('sourceContext.Supervisor')] || '').trim();
    if (!supervisor) supervisor = String(r[col('assignedUser')] || '').trim();
    
    const week = Number(r[col('sourceContext.WeekNo')]);
    
    if (!login || isNaN(week) || week < 1) { skipped++; continue; }
    // If no supervisor, still include but mark as unknown
    if (!supervisor) supervisor = 'unknown';
    
    const region = String(r[col('sourceContext.Region')] || '').trim();
    const defectPresent = String(r[col('sourceContext.Defect_Present')] || '').trim();
    
    // Defect flag: "No" means no defect, anything else (Associate Controllable, etc.) means defect
    const defectFlag = defectPresent !== '' && defectPresent !== 'No';
    
    // Quality attributes: in Zeus format, the columns contain the finding text if there's an error
    // Empty = Yes (no error), Non-empty = No (has error) with the text being the finding
    const admText = String(r[col('sourceContext.Associate_Decision_Making')] || '').trim();
    const raText = String(r[col('sourceContext.SW_Adherence_Right_Action')] || '').trim();
    const rrcText = String(r[col('sourceContext.Right_Reason_Code')] || '').trim();
    // ACC has two possible columns
    let accText = String(r[col('sourceContext.Accurate_&_Complete_Communication')] || '').trim();
    if (!accText) accText = String(r[col('sourceContext.Accurate_n_Complete_Communication')] || '').trim();
    const rvText = String(r[col('sourceContext.Required_Validation')] || '').trim();
    
    records.push({
      team: String(r[col('sourceContext.Team')] || '').trim(),
      region,
      disruptionType: String(r[col('sourceContext.Disruption_Type')] || '').trim(),
      subTransactionType: '',
      qaMonitoringDate: '',
      transactionDate: excelDateToString(r[col('sourceContext.Transaction_Date')]),
      transactionId: String(r[col('sourceContext.Transaction_ID')] || '').trim(),
      associateLogin: login,
      associateStatus: '',
      supervisorLogin: supervisor,
      supervisorEmail: '',
      transactionWeek: week,
      subDisruptionType: String(r[col('sourceContext.Sub_Disruption_Type')] || '').trim(),
      adm: admText ? 'No' : 'Yes',
      admFinding: admText,
      comments1: '',
      ra: raText ? 'No' : 'Yes',
      raFinding: raText,
      comments2: '',
      rrc: rrcText ? 'No' : 'Yes',
      rrcFinding: rrcText,
      comments3: '',
      acc: accText ? 'No' : 'Yes',
      accFinding: accText,
      comments4: '',
      rv: rvText ? 'No' : 'Yes',
      rvFinding: rvText,
      comments5: '',
      spResponse: '',
      spComment: '',
      spocLogin: '',
      spocResponse: '',
      spocComment: '',
      reAppealFlag: '',
      reAppealComment: '',
      appealLeadLogin: '',
      appealLeadDecision: '',
      appealLeadComment: '',
      defectFlag,
    });
  }
  
  console.log(`  Week 18: ${records.length} records parsed, ${skipped} skipped`);
  return records;
}

// ============================================================================
// UTILITY
// ============================================================================
function excelDateToString(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  // Try parsing date strings like "01-May-2026"
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str;
}

// ============================================================================
// MAIN
// ============================================================================
console.log('Loading audit data from multiple sources...\n');

// Source 1: WoW Report (weeks 1-16)
const wowRecords = parseWoWReport('WoW Report-RSOB (2).xlsx');

// Source 2: Week 18 Zeus export
const wk18Records = parseWeek18('Rsob Week 18 report (1).xlsx');

// Merge all records
const allRecords = [...wowRecords, ...wk18Records];

// ============================================================================
// APPEAL OVERRIDE: If SPOC Response = "Appeal Accepted" or Appeal Lead Decision
// contains "Accepted" (but NOT "Not Accepted"), then it's NOT a defect.
// ============================================================================
let appealOverrides = 0;
for (const r of allRecords) {
  if (!r.defectFlag) continue; // only check records currently marked as defects
  
  const spoc = (r.spocResponse || '').trim().toLowerCase();
  const leadDecision = (r.appealLeadDecision || '').trim().toLowerCase();
  
  // Check if appeal was accepted (but not "not accepted")
  const spocAccepted = spoc.includes('accepted') && !spoc.includes('not accepted');
  const leadAccepted = leadDecision.includes('accepted') && !leadDecision.includes('not accepted');
  
  if (spocAccepted || leadAccepted) {
    r.defectFlag = false;
    appealOverrides++;
  }
}
if (appealOverrides > 0) {
  console.log(`\n  Appeal overrides: ${appealOverrides} defects removed (appeal accepted)`);
}

// Summary by week
const weekCounts = {};
for (const r of allRecords) {
  weekCounts[r.transactionWeek] = (weekCounts[r.transactionWeek] || 0) + 1;
}
console.log('\nWeek distribution:');
const sortedWeeks = Object.keys(weekCounts).map(Number).sort((a, b) => a - b);
for (const w of sortedWeeks) {
  console.log(`  Week ${w}: ${weekCounts[w]} records`);
}

// Summary by region
const regionCounts = {};
for (const r of allRecords) {
  const reg = r.region || 'Unknown';
  regionCounts[reg] = (regionCounts[reg] || 0) + 1;
}
console.log('\nRegion distribution:');
for (const [reg, count] of Object.entries(regionCounts)) {
  console.log(`  ${reg}: ${count} records`);
}

// Defect summary
const totalDefects = allRecords.filter(r => r.defectFlag).length;
console.log(`\nTotal records: ${allRecords.length}`);
console.log(`Total defects: ${totalDefects} (${(totalDefects/allRecords.length*100).toFixed(1)}%)`);

// Write output
writeFileSync('data/audit-records.json', JSON.stringify(allRecords, null, 2));
console.log('\n✓ Written to data/audit-records.json');
