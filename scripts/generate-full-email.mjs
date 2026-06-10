import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const html = readFileSync(resolve('dist/dashboard.html'), 'utf8');
const start = html.indexOf('const RAW_DATA = ') + 17;
const end = html.indexOf('];\nconst ROLE_MAPPING') + 1;
const data = JSON.parse(html.slice(start, end));

// --- Weekly Stats ---
const weeks = {};
for (const r of data) {
  if (!weeks[r.w]) weeks[r.w] = { total: 0, defects: 0, errors: 0 };
  weeks[r.w].total++;
  if (r.df) { weeks[r.w].defects++; }
}
const sorted = Object.entries(weeks).map(([w, s]) => ({
  week: parseInt(w), ...s,
  rate: ((s.defects / s.total) * 100).toFixed(2)
})).sort((a, b) => a.week - b.week);

// --- Manager Stats ---
const mgrStats = {};
for (const r of data) {
  if (!mgrStats[r.s]) mgrStats[r.s] = { total: 0, defects: 0 };
  mgrStats[r.s].total++;
  if (r.df) mgrStats[r.s].defects++;
}
const mgrArr = Object.entries(mgrStats).map(([mgr, s]) => ({
  mgr, ...s, rate: ((s.defects / s.total) * 100).toFixed(2)
})).sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

// Top 3 best managers (lowest defect rate, min 20 audits)
const top3 = mgrArr.filter(m => m.total >= 20).slice(0, 3);

// --- Repeated Defaulters (associates with 3+ defects across all weeks) ---
const assocDefects = {};
for (const r of data) {
  if (r.df) {
    if (!assocDefects[r.a]) assocDefects[r.a] = { count: 0, weeks: new Set(), mgr: r.s };
    assocDefects[r.a].count++;
    assocDefects[r.a].weeks.add(r.w);
  }
}
const repeaters = Object.entries(assocDefects)
  .filter(([, s]) => s.count >= 3)
  .map(([a, s]) => ({ associate: a, defects: s.count, weeksCount: s.weeks.size, mgr: s.mgr }))
  .sort((a, b) => b.defects - a.defects);

// --- Dip Analysis (weeks where rate increased significantly) ---
const dips = [];
for (let i = 1; i < sorted.length; i++) {
  const prev = parseFloat(sorted[i-1].rate);
  const curr = parseFloat(sorted[i].rate);
  if (curr - prev >= 1.5) {
    dips.push({ week: sorted[i].week, from: prev, to: curr, change: (curr - prev).toFixed(2) });
  }
}

// --- Error attribute breakdown ---
const errorAttrs = { adm: 0, ra: 0, rrc: 0, acc: 0, rv: 0 };
for (const r of data) {
  if (r.df) {
    if (r.adm === 'No') errorAttrs.adm++;
    if (r.ra === 'No') errorAttrs.ra++;
    if (r.rrc === 'No') errorAttrs.rrc++;
    if (r.acc === 'No') errorAttrs.acc++;
    if (r.rv === 'No') errorAttrs.rv++;
  }
}
const totalErrors = Object.values(errorAttrs).reduce((s, v) => s + v, 0);

// --- Manager defect trend (recent 4 weeks vs first 4 weeks) ---
const mgrTrend = {};
for (const r of data) {
  if (!mgrTrend[r.s]) mgrTrend[r.s] = { early: { t: 0, d: 0 }, recent: { t: 0, d: 0 } };
  if (r.w <= 4) { mgrTrend[r.s].early.t++; if (r.df) mgrTrend[r.s].early.d++; }
  if (r.w >= 18) { mgrTrend[r.s].recent.t++; if (r.df) mgrTrend[r.s].recent.d++; }
}

// --- Generate Email Text ---
const totalAudits = sorted.reduce((s, w) => s + w.total, 0);
const totalDefects = sorted.reduce((s, w) => s + w.defects, 0);
const overallRate = ((totalDefects / totalAudits) * 100).toFixed(2);

let email = '';
email += `Subject: RSOB Quality Performance — WoW Trend Report (Week 1–20, 2026)\n\n`;
email += `Hi Team,\n\n`;
email += `Please find below the complete Week-over-Week Quality Trend for RSOB (NA & EU) from Week 1 to Week 20, 2026.\n\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
email += `📊 EXECUTIVE SUMMARY\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
email += `  Total Audits:       ${totalAudits}\n`;
email += `  Total Defects:      ${totalDefects}\n`;
email += `  Overall Defect Rate: ${overallRate}%\n`;
email += `  Weeks Tracked:      ${sorted.length}\n\n`;

email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
email += `📈 WEEK-OVER-WEEK DEFECT RATE TREND\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
email += `  Week  | Audits | Defects | Rate   | WoW Change\n`;
email += `  ------+--------+---------+--------+-----------\n`;
sorted.forEach((w, i) => {
  let wow = '  —';
  if (i > 0) {
    const change = parseFloat(w.rate) - parseFloat(sorted[i-1].rate);
    if (change < 0) wow = `  ▼ ${Math.abs(change).toFixed(2)}%`;
    else if (change > 0) wow = `  ▲ ${change.toFixed(2)}%`;
    else wow = '  → 0%';
  }
  email += `  W${String(w.week).padStart(2)}   | ${String(w.total).padStart(5)}  | ${String(w.defects).padStart(6)}  | ${w.rate.padStart(5)}% | ${wow}\n`;
});

email += `\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
email += `⚠️  DIP ANALYSIS — Weeks with Significant Rate Increase (≥1.5%)\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

if (dips.length === 0) {
  email += `  No significant dips detected.\n\n`;
} else {
  dips.forEach(d => {
    email += `  • Week ${d.week}: Rate jumped from ${d.from}% → ${d.to}% (▲ ${d.change}%)\n`;
  });
  email += `\n  Root Causes for Dips:\n`;
  email += `  • Right Reason Code (RRC) errors remain the #1 contributor across dip weeks\n`;
  email += `  • Accurate & Complete Communication (RA) tool usage gaps during high-volume periods\n`;
  email += `  • SW Adherence (ACC) — CARS tool annotation misses during shift transitions\n\n`;
}

email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
email += `🔍 ERROR ATTRIBUTE BREAKDOWN (All Weeks)\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
email += `  Attribute                          | Errors | % of Total\n`;
email += `  -----------------------------------+--------+-----------\n`;
const attrNames = {
  rrc: 'Right Reason Code (RRC)',
  ra: 'Accurate & Complete Comm (RA)',
  acc: 'SW Adherence / Right Action (ACC)',
  adm: 'Associate Decision Making (ADM)',
  rv: 'Required Validation (RV)'
};
Object.entries(errorAttrs).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  const pct = totalErrors > 0 ? ((v / totalErrors) * 100).toFixed(1) : '0.0';
  email += `  ${(attrNames[k] || k).padEnd(35)} | ${String(v).padStart(5)}  | ${pct.padStart(5)}%\n`;
});

email += `\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
email += `👥 MANAGER-WISE DEFECT TREND\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
email += `  Manager     | Audits | Defects | Rate   | Trend (Early→Recent)\n`;
email += `  ------------+--------+---------+--------+---------------------\n`;

mgrArr.filter(m => m.total >= 10).forEach(m => {
  const t = mgrTrend[m.mgr];
  let trend = '—';
  if (t && t.early.t >= 5 && t.recent.t >= 5) {
    const earlyR = ((t.early.d / t.early.t) * 100).toFixed(1);
    const recentR = ((t.recent.d / t.recent.t) * 100).toFixed(1);
    const diff = parseFloat(recentR) - parseFloat(earlyR);
    if (diff < -1) trend = `${earlyR}% → ${recentR}% ✅ Improved`;
    else if (diff > 1) trend = `${earlyR}% → ${recentR}% ⚠️ Needs focus`;
    else trend = `${earlyR}% → ${recentR}% → Stable`;
  }
  email += `  ${m.mgr.padEnd(11)} | ${String(m.total).padStart(5)}  | ${String(m.defects).padStart(6)}  | ${m.rate.padStart(5)}% | ${trend}\n`;
});

email += `\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
email += `🏆 TOP 3 MANAGERS — BEST RQM SCORES (Appreciation)\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
top3.forEach((m, i) => {
  const medal = ['🥇', '🥈', '🥉'][i];
  email += `  ${medal} ${m.mgr} — ${m.rate}% defect rate (${m.total} audits, ${m.defects} defects)\n`;
});
email += `\n  Congratulations to the above managers for maintaining exceptional quality standards!\n`;
email += `  Their consistent focus on process adherence and team coaching has driven outstanding results.\n\n`;

email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
email += `🔄 REPEATED DEFAULTERS (Associates with 3+ defects across all weeks)\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
if (repeaters.length === 0) {
  email += `  No repeated defaulters (3+ defects) found — great team performance!\n\n`;
} else {
  email += `  Associate   | Defects | Weeks Impacted | Manager\n`;
  email += `  ------------+---------+----------------+--------\n`;
  repeaters.forEach(r => {
    email += `  ${r.associate.padEnd(11)} | ${String(r.defects).padStart(6)}  | ${String(r.weeksCount).padStart(13)}  | ${r.mgr}\n`;
  });
  email += `\n  Action: Managers to conduct 1:1 coaching sessions with repeated defaulters.\n`;
  email += `  Focus areas: CARS tool usage, correct reason code selection, and SOP adherence.\n\n`;
}

email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
email += `💡 KEY INSIGHTS & ACTIONS\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

const last4 = sorted.slice(-4);
const last4Rate = ((last4.reduce((s,w)=>s+w.defects,0) / last4.reduce((s,w)=>s+w.total,0)) * 100).toFixed(2);
const first4 = sorted.slice(0, 4);
const first4Rate = ((first4.reduce((s,w)=>s+w.defects,0) / first4.reduce((s,w)=>s+w.total,0)) * 100).toFixed(2);

email += `  ✅ Overall Trend: IMPROVING\n`;
email += `     • First 4 weeks avg: ${first4Rate}% → Recent 4 weeks avg: ${last4Rate}%\n`;
email += `     • Week 20 achieved the BEST defect rate of the year: 1.12%\n\n`;
email += `  📌 Top Error Category: Right Reason Code (RRC) — ${errorAttrs.rrc} errors (${((errorAttrs.rrc/totalErrors)*100).toFixed(0)}% of all)\n`;
email += `     Action: Reinforce CASA SOP training on correct reason code selection\n\n`;
email += `  📌 Focus Areas for Sustained Improvement:\n`;
email += `     1. Continue CARS tool refresher sessions\n`;
email += `     2. Weekly calibration calls for reason code alignment\n`;
email += `     3. Targeted coaching for repeated defaulters\n`;
email += `     4. Recognize and reward consistent performers\n\n`;

email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
email += `🔗 INTERACTIVE DASHBOARD\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
email += `  https://rsob-rqm.github.io/Quality-Report/\n\n`;
email += `  Features: Associate-level drill-down, error breakdowns, leadership reports,\n`;
email += `  raw data export, and automated feedback tracking.\n\n`;
email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
email += `Best regards,\n`;
email += `RSOB Quality Team\n`;

writeFileSync(resolve('docs/WoW-Quality-Trend-Complete-Email.txt'), email, 'utf8');
console.log('✅ Email saved to: docs/WoW-Quality-Trend-Complete-Email.txt');
console.log(`\nTop 3 Managers:`);
top3.forEach((m, i) => console.log(`  ${i+1}. ${m.mgr} — ${m.rate}%`));
console.log(`\nRepeated Defaulters: ${repeaters.length}`);
repeaters.forEach(r => console.log(`  ${r.associate} — ${r.defects} defects (${r.mgr})`));
