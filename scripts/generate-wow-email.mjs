import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Extract RAW_DATA from dashboard
const html = readFileSync(resolve('dist/dashboard.html'), 'utf8');
const start = html.indexOf('const RAW_DATA = ') + 17;
const end = html.indexOf('];\nconst ROLE_MAPPING') + 1;
const data = JSON.parse(html.slice(start, end));

console.log(`Total records: ${data.length}`);

// Compute weekly stats
const weeks = {};
for (const r of data) {
  if (!weeks[r.w]) weeks[r.w] = { total: 0, defects: 0, errors: 0, na: 0, eu: 0, naDefects: 0, euDefects: 0 };
  weeks[r.w].total++;
  if (r.df) {
    weeks[r.w].defects++;
    // Count individual errors
    let errs = 0;
    if (r.adm === 'No') errs++;
    if (r.ra === 'No') errs++;
    if (r.rrc === 'No') errs++;
    if (r.acc === 'No') errs++;
    if (r.rv === 'No') errs++;
    weeks[r.w].errors += errs;
  }
  if (r.r === 'NA') { weeks[r.w].na++; if (r.df) weeks[r.w].naDefects++; }
  if (r.r === 'EU') { weeks[r.w].eu++; if (r.df) weeks[r.w].euDefects++; }
}

// Sort by week
const sorted = Object.entries(weeks).map(([w, s]) => ({
  week: parseInt(w),
  ...s,
  defectRate: ((s.defects / s.total) * 100).toFixed(2),
  naRate: s.na > 0 ? ((s.naDefects / s.na) * 100).toFixed(2) : '0.00',
  euRate: s.eu > 0 ? ((s.euDefects / s.eu) * 100).toFixed(2) : '0.00',
})).sort((a, b) => a.week - b.week);

console.log('\nWeek-wise Summary:');
sorted.forEach(w => {
  console.log(`  W${w.week}: ${w.total} audits, ${w.defects} defects (${w.defectRate}%), NA:${w.naRate}%, EU:${w.euRate}%`);
});

// Compute overall
const totalAudits = sorted.reduce((s, w) => s + w.total, 0);
const totalDefects = sorted.reduce((s, w) => s + w.defects, 0);
const overallRate = ((totalDefects / totalAudits) * 100).toFixed(2);

// WoW change
const wowChanges = sorted.map((w, i) => {
  if (i === 0) return { ...w, wow: null };
  const prev = parseFloat(sorted[i-1].defectRate);
  const curr = parseFloat(w.defectRate);
  const change = curr - prev;
  return { ...w, wow: change.toFixed(2) };
});

// Generate email HTML
let emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>RSOB Quality WoW Trend - Week 1 to 20</title></head>
<body style="font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;padding:24px;color:#1e293b">
<div style="max-width:900px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

<!-- Header -->
<div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:28px 32px;color:#fff">
  <h1 style="margin:0;font-size:22px;font-weight:700">RSOB Quality Performance — Week-over-Week Trend</h1>
  <p style="margin:8px 0 0;font-size:14px;opacity:.9">Week 1 to Week 20 | 2026 | NA & EU Combined</p>
</div>

<!-- Executive Summary -->
<div style="padding:24px 32px">
  <h2 style="font-size:16px;color:#1e40af;margin:0 0 16px;border-bottom:2px solid #dbeafe;padding-bottom:8px">📊 Executive Summary</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr>
      <td style="padding:12px 16px;background:#eff6ff;border-radius:8px;text-align:center;width:25%">
        <div style="font-size:12px;color:#64748b">Total Audits</div>
        <div style="font-size:28px;font-weight:700;color:#1e40af">${totalAudits}</div>
      </td>
      <td style="width:8px"></td>
      <td style="padding:12px 16px;background:#fef2f2;border-radius:8px;text-align:center;width:25%">
        <div style="font-size:12px;color:#64748b">Total Defects</div>
        <div style="font-size:28px;font-weight:700;color:#dc2626">${totalDefects}</div>
      </td>
      <td style="width:8px"></td>
      <td style="padding:12px 16px;background:#ecfdf5;border-radius:8px;text-align:center;width:25%">
        <div style="font-size:12px;color:#64748b">Overall Defect Rate</div>
        <div style="font-size:28px;font-weight:700;color:#059669">${overallRate}%</div>
      </td>
      <td style="width:8px"></td>
      <td style="padding:12px 16px;background:#fffbeb;border-radius:8px;text-align:center;width:25%">
        <div style="font-size:12px;color:#64748b">Weeks Tracked</div>
        <div style="font-size:28px;font-weight:700;color:#d97706">${sorted.length}</div>
      </td>
    </tr>
  </table>
`;

// Trend visual bar chart
const maxRate = Math.max(...sorted.map(w => parseFloat(w.defectRate)));
emailHtml += `
  <h2 style="font-size:16px;color:#1e40af;margin:24px 0 16px;border-bottom:2px solid #dbeafe;padding-bottom:8px">📈 Defect Rate Trend (Week 1–20)</h2>
  <div style="display:flex;align-items:flex-end;gap:4px;height:100px;padding:12px 0;border-bottom:1px solid #e2e8f0">
`;
sorted.forEach(w => {
  const rate = parseFloat(w.defectRate);
  const pct = maxRate > 0 ? Math.round((rate / maxRate) * 100) : 0;
  const color = rate <= 2 ? '#059669' : rate <= 4 ? '#d97706' : '#dc2626';
  emailHtml += `<div style="flex:1;display:flex;flex-direction:column;align-items:center">
    <span style="font-size:9px;font-weight:600;color:${color}">${w.defectRate}%</span>
    <div style="width:100%;max-width:32px;height:${Math.max(pct, 4)}%;background:${color};border-radius:3px 3px 0 0;margin-top:4px"></div>
    <span style="font-size:9px;color:#64748b;margin-top:4px">W${w.week}</span>
  </div>`;
});
emailHtml += `</div>`;

// WoW Table
emailHtml += `
  <h2 style="font-size:16px;color:#1e40af;margin:24px 0 16px;border-bottom:2px solid #dbeafe;padding-bottom:8px">📋 Week-over-Week Detail</h2>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead>
      <tr style="background:#1e40af;color:#fff">
        <th style="padding:8px 10px;text-align:left">Week</th>
        <th style="padding:8px 10px;text-align:center">Audits</th>
        <th style="padding:8px 10px;text-align:center">Defects</th>
        <th style="padding:8px 10px;text-align:center">Defect Rate</th>
        <th style="padding:8px 10px;text-align:center">WoW Change</th>
        <th style="padding:8px 10px;text-align:center">NA Rate</th>
        <th style="padding:8px 10px;text-align:center">EU Rate</th>
      </tr>
    </thead>
    <tbody>
`;

wowChanges.forEach((w, i) => {
  const bg = i % 2 === 0 ? '#fff' : '#f8fafc';
  const rateColor = parseFloat(w.defectRate) <= 2 ? '#059669' : parseFloat(w.defectRate) <= 4 ? '#d97706' : '#dc2626';
  let wowDisplay = '—';
  let wowColor = '#64748b';
  if (w.wow !== null) {
    const val = parseFloat(w.wow);
    if (val < 0) { wowDisplay = `▼ ${Math.abs(val).toFixed(2)}%`; wowColor = '#059669'; }
    else if (val > 0) { wowDisplay = `▲ ${val}%`; wowColor = '#dc2626'; }
    else { wowDisplay = '→ 0%'; wowColor = '#64748b'; }
  }
  emailHtml += `<tr style="background:${bg}">
    <td style="padding:7px 10px;font-weight:600">Week ${w.week}</td>
    <td style="padding:7px 10px;text-align:center">${w.total}</td>
    <td style="padding:7px 10px;text-align:center;font-weight:600;color:#dc2626">${w.defects}</td>
    <td style="padding:7px 10px;text-align:center;font-weight:700;color:${rateColor}">${w.defectRate}%</td>
    <td style="padding:7px 10px;text-align:center;font-weight:600;color:${wowColor}">${wowDisplay}</td>
    <td style="padding:7px 10px;text-align:center">${w.naRate}%</td>
    <td style="padding:7px 10px;text-align:center">${w.euRate}%</td>
  </tr>`;
});

emailHtml += `</tbody></table>`;

// Key Insights
const bestWeek = sorted.reduce((a, b) => parseFloat(a.defectRate) < parseFloat(b.defectRate) ? a : b);
const worstWeek = sorted.reduce((a, b) => parseFloat(a.defectRate) > parseFloat(b.defectRate) ? a : b);
const last4 = sorted.slice(-4);
const last4Rate = ((last4.reduce((s,w)=>s+w.defects,0) / last4.reduce((s,w)=>s+w.total,0)) * 100).toFixed(2);
const first4 = sorted.slice(0, 4);
const first4Rate = ((first4.reduce((s,w)=>s+w.defects,0) / first4.reduce((s,w)=>s+w.total,0)) * 100).toFixed(2);

emailHtml += `
  <h2 style="font-size:16px;color:#1e40af;margin:24px 0 16px;border-bottom:2px solid #dbeafe;padding-bottom:8px">💡 Key Insights</h2>
  <ul style="padding-left:20px;line-height:2;font-size:13px;color:#334155">
    <li><strong>Best Week:</strong> Week ${bestWeek.week} — ${bestWeek.defectRate}% defect rate (${bestWeek.total} audits, ${bestWeek.defects} defects)</li>
    <li><strong>Highest Defect Week:</strong> Week ${worstWeek.week} — ${worstWeek.defectRate}% defect rate (${worstWeek.total} audits, ${worstWeek.defects} defects)</li>
    <li><strong>Recent 4-Week Avg (W17–W20):</strong> ${last4Rate}% defect rate</li>
    <li><strong>First 4-Week Avg (W1–W4):</strong> ${first4Rate}% defect rate</li>
    <li><strong>Trend:</strong> ${parseFloat(last4Rate) < parseFloat(first4Rate) ? '✅ Improving — recent weeks show lower defect rates than early weeks' : parseFloat(last4Rate) > parseFloat(first4Rate) ? '⚠️ Needs attention — recent weeks show higher defect rates' : '→ Stable performance across the period'}</li>
  </ul>
`;

// Dashboard link
emailHtml += `
  <div style="margin:24px 0;padding:16px;background:#eff6ff;border-radius:8px;border:1px solid #93c5fd;text-align:center">
    <p style="margin:0 0 8px;font-size:13px;color:#1e40af;font-weight:600">🔗 Interactive Dashboard</p>
    <a href="https://rsob-rqm.github.io/Quality-Report/" style="color:#1e40af;font-size:14px;font-weight:700;text-decoration:none">https://rsob-rqm.github.io/Quality-Report/</a>
    <p style="margin:8px 0 0;font-size:11px;color:#64748b">Login to view detailed associate-level data, error breakdowns, and leadership reports</p>
  </div>
`;

// Footer
emailHtml += `
  <div style="margin-top:24px;padding:16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center">
    <p style="margin:0">Generated by RSOB Quality Performance Dashboard | Data covers Week 1 (Jan 1) to Week 20 (May 16), 2026</p>
    <p style="margin:4px 0 0">For questions or feedback, reach out to the RSOB Quality Team</p>
  </div>
</div>
</div>
</body>
</html>`;

writeFileSync(resolve('docs/WoW-Quality-Trend-Email.html'), emailHtml, 'utf8');
console.log('\n✅ Email generated: docs/WoW-Quality-Trend-Email.html');
console.log(`   Total: ${totalAudits} audits, ${totalDefects} defects, ${overallRate}% overall rate`);
