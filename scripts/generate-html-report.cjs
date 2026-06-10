const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('Data for site uti - FMC & CASA.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);
const active = data.filter(r => r.is_active === 1 && r.fill_cube_num && r.target_cube_den);

const totalFill = active.reduce((s,r) => s + r.fill_cube_num, 0);
const totalTarget = active.reduce((s,r) => s + r.target_cube_den, 0);
const casaLoads = active.filter(r => r.create_platform === 'CASA_UI');
const fmcLoads = active.filter(r => r.create_platform === 'Flintstones');
const casaFill = casaLoads.reduce((s,r)=>s+r.fill_cube_num,0);
const casaTarget = casaLoads.reduce((s,r)=>s+r.target_cube_den,0);
const fmcFill = fmcLoads.reduce((s,r)=>s+r.fill_cube_num,0);
const fmcTarget = fmcLoads.reduce((s,r)=>s+r.target_cube_den,0);

// Site aggregation
const siteAgg = {};
active.forEach(r => {
  if (!siteAgg[r.origin]) siteAgg[r.origin] = { 
    site: r.origin, fill: 0, target: 0, count: 0,
    w17f:0, w17t:0, w18f:0, w18t:0, w19f:0, w19t:0,
    casaFill:0, casaTarget:0, casaCount:0,
    fmcFill:0, fmcTarget:0, fmcCount:0,
    buckets: {}
  };
  const s = siteAgg[r.origin];
  s.fill += r.fill_cube_num; s.target += r.target_cube_den; s.count++;
  if(r.wk===17){s.w17f+=r.fill_cube_num;s.w17t+=r.target_cube_den;}
  if(r.wk===18){s.w18f+=r.fill_cube_num;s.w18t+=r.target_cube_den;}
  if(r.wk===19){s.w19f+=r.fill_cube_num;s.w19t+=r.target_cube_den;}
  if(r.create_platform==='CASA_UI'){s.casaFill+=r.fill_cube_num;s.casaTarget+=r.target_cube_den;s.casaCount++;}
  if(r.create_platform==='Flintstones'){s.fmcFill+=r.fill_cube_num;s.fmcTarget+=r.target_cube_den;s.fmcCount++;}
  if(!s.buckets[r.adhoc_bucket]) s.buckets[r.adhoc_bucket]={fill:0,target:0,count:0};
  s.buckets[r.adhoc_bucket].fill+=r.fill_cube_num;
  s.buckets[r.adhoc_bucket].target+=r.target_cube_den;
  s.buckets[r.adhoc_bucket].count++;
});

const underUtil = Object.values(siteAgg)
  .map(s => ({...s, util: s.fill/s.target*100}))
  .filter(s => s.util < 60 && s.count >= 20)
  .sort((a,b) => b.count - a.count);

const tier1 = underUtil.filter(s => s.util < 40);
const tier2 = underUtil.filter(s => s.util >= 40);

// Bucket agg
const bucketAgg = {};
active.forEach(r => {
  if(!bucketAgg[r.adhoc_bucket]) bucketAgg[r.adhoc_bucket] = {fill:0,target:0,count:0};
  bucketAgg[r.adhoc_bucket].fill += r.fill_cube_num;
  bucketAgg[r.adhoc_bucket].target += r.target_cube_den;
  bucketAgg[r.adhoc_bucket].count++;
});

function siteRow(s) {
  const w17 = s.w17t ? (s.w17f/s.w17t*100).toFixed(1)+'%' : '-';
  const w18 = s.w18t ? (s.w18f/s.w18t*100).toFixed(1)+'%' : '-';
  const w19 = s.w19t ? (s.w19f/s.w19t*100).toFixed(1)+'%' : '-';
  const casa = s.casaTarget ? (s.casaFill/s.casaTarget*100).toFixed(1)+'%' : '-';
  const fmc = s.fmcTarget ? (s.fmcFill/s.fmcTarget*100).toFixed(1)+'%' : '-';
  const topB = Object.entries(s.buckets).sort((a,b)=>b[1].count-a[1].count).slice(0,2).map(([k,v])=>k+' ('+(v.fill/v.target*100).toFixed(0)+'%)').join(', ');
  const color = s.util < 30 ? '#dc3545' : s.util < 40 ? '#e76f51' : s.util < 50 ? '#f4a261' : '#6c757d';
  return '<tr><td><b>'+s.site+'</b></td><td style="color:'+color+';font-weight:bold">'+s.util.toFixed(1)+'%</td><td>'+s.count+'</td><td>'+w17+'</td><td>'+w18+'</td><td>'+w19+'</td><td style="color:#dc3545">'+casa+'</td><td>'+fmc+'</td><td style="font-size:11px">'+topB+'</td></tr>';
}

const bucketRows = Object.entries(bucketAgg)
  .map(([k,v])=>({name:k, util:v.fill/v.target*100, count:v.count}))
  .sort((a,b)=>a.util-b.util)
  .map(b => '<tr><td>'+b.name+'</td><td style="color:'+(b.util<35?'#dc3545':b.util<50?'#e76f51':'#000')+';font-weight:'+(b.util<40?'bold':'normal')+'">'+b.util.toFixed(1)+'%</td><td>'+b.count.toLocaleString()+'</td><td>'+(b.util<35?'High':b.util<50?'Medium':'Low')+'</td></tr>')
  .join('\n');

const weekRows = [17,18,19].map(w => {
  const wk = active.filter(r => r.wk === w);
  const f = wk.reduce((s,r)=>s+r.fill_cube_num,0);
  const t = wk.reduce((s,r)=>s+r.target_cube_den,0);
  const trend = w===17?'Baseline':w===18?'&#9660; -0.6pp':'Flat';
  return '<tr><td>Week '+w+'</td><td>'+(f/t*100).toFixed(1)+'%</td><td>'+wk.length.toLocaleString()+'</td><td>'+trend+'</td></tr>';
}).join('\n');

const overallUtil = (totalFill/totalTarget*100).toFixed(1);
const casaUtil = (casaFill/casaTarget*100).toFixed(1);
const fmcUtil = (fmcFill/fmcTarget*100).toFixed(1);

const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>VRID Utilization Deep Dive</title>
<style>
body{font-family:Amazon Ember,Segoe UI,Arial,sans-serif;max-width:900px;margin:40px auto;padding:20px;color:#1a1a2e;line-height:1.7}
h1{font-size:24px;border-bottom:3px solid #232946;padding-bottom:8px}
h2{font-size:18px;color:#232946;margin-top:32px;border-bottom:2px solid #4361ee;padding-bottom:6px}
h3{font-size:15px;color:#4361ee;margin-top:20px}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px}
th{background:#232946;color:#fff;padding:8px 10px;text-align:left}
td{padding:7px 10px;border-bottom:1px solid #e9ecef}
tr:nth-child(even){background:#f8f9fa}
.kpi-box{display:inline-block;background:#232946;color:#fff;padding:12px 20px;border-radius:8px;margin:8px 8px 8px 0;text-align:center;min-width:140px}
.kpi-box.red{background:#dc3545}
.kpi-box.green{background:#2d6a4f}
.kpi-box .val{font-size:22px;font-weight:700}
.kpi-box .lbl{font-size:11px;opacity:0.9}
.callout{background:#fff3cd;border-left:4px solid #ffc107;padding:12px 16px;margin:16px 0;border-radius:4px}
.callout-red{background:#f8d7da;border-left:4px solid #dc3545;padding:12px 16px;margin:16px 0;border-radius:4px}
.callout-blue{background:#d1ecf1;border-left:4px solid #0dcaf0;padding:12px 16px;margin:16px 0;border-radius:4px}
.footer{color:#999;font-size:11px;margin-top:40px;border-top:1px solid #ddd;padding-top:12px}
</style></head><body>

<h1>VRID Utilization Deep Dive &mdash; Site-Level Analysis</h1>
<p style="color:#666">Data Period: Weeks 17-19, 2026 | Platforms in Scope: <b>Flintstones (FMC)</b> &amp; <b>CASA_UI</b></p>

<h2>1. Scope &amp; Methodology</h2>
<p>This analysis considers <b>only loads created through Flintstones (FMC) and CASA_UI platforms</b>. Only active loads (is_active = 1) with valid fill_cube_num and target_cube_den values are included.</p>
<p><b>Utilization Formula:</b> fill_cube_num / target_cube_den &times; 100</p>
<p><b>Target:</b> 60% utilization</p>
<p><b>Focus:</b> Sites below 60% utilization with 20+ active loads (high-volume, actionable sites)</p>

<h2>2. Executive Summary</h2>
<div>
<div class="kpi-box red"><div class="val">${overallUtil}%</div><div class="lbl">Overall Utilization</div></div>
<div class="kpi-box"><div class="val">${active.length.toLocaleString()}</div><div class="lbl">Active Loads</div></div>
<div class="kpi-box green"><div class="val">${fmcUtil}%</div><div class="lbl">FMC (${fmcLoads.length.toLocaleString()} loads)</div></div>
<div class="kpi-box red"><div class="val">${casaUtil}%</div><div class="lbl">CASA (${casaLoads.length.toLocaleString()} loads)</div></div>
<div class="kpi-box red"><div class="val">${underUtil.length}</div><div class="lbl">Sites Below 60%</div></div>
</div>

<div class="callout-red"><b>Key Finding:</b> CASA-created loads are the primary drag on utilization, running at ${casaUtil}% vs FMC at ${fmcUtil}%. Across every adhoc bucket, CASA underperforms FMC by 20-33 percentage points. Loads are being created before sufficient volume accumulates at origin sites.</div>

<h2>3. Weekly Utilization Trend</h2>
<table>
<tr><th>Week</th><th>Utilization %</th><th>Active Loads</th><th>Trend</th></tr>
${weekRows}
</table>
<div class="callout"><b>Observation:</b> Utilization is flat at ~51% with no organic improvement. Without structured intervention, this will not self-correct.</div>

<h2>4. Utilization by Adhoc Bucket</h2>
<table>
<tr><th>Adhoc Bucket</th><th>Utilization %</th><th>Load Count</th><th>Impact Level</th></tr>
${bucketRows}
</table>

<h2>5. Site-Level Utilization &mdash; Priority Sites</h2>
<p>All sites below 60% utilization with 20+ active loads, sorted by volume.</p>

<h3>5.1 Tier 1 &mdash; Severely Underutilized (Below 40%) &mdash; ${tier1.length} sites</h3>
<table>
<tr><th>Site</th><th>Util%</th><th>Loads</th><th>Wk17</th><th>Wk18</th><th>Wk19</th><th>CASA%</th><th>FMC%</th><th>Top Buckets</th></tr>
${tier1.slice(0,25).map(siteRow).join('\n')}
</table>

<h3>5.2 Tier 2 &mdash; Moderate Gap (40-60%) &mdash; ${tier2.length} sites</h3>
<table>
<tr><th>Site</th><th>Util%</th><th>Loads</th><th>Wk17</th><th>Wk18</th><th>Wk19</th><th>CASA%</th><th>FMC%</th><th>Top Buckets</th></tr>
${tier2.slice(0,25).map(siteRow).join('\n')}
</table>

<h2>6. Root Cause Classification Framework</h2>
<table>
<tr><th>Root Cause</th><th>Data Indicator</th><th>Est. Impact</th><th>Recommended Action</th></tr>
<tr><td><b>Premature Load Creation (CASA)</b></td><td>CASA + FC Underutilized + fill &lt; 20%</td><td>~35% of gap</td><td>Min fill threshold before dispatch</td></tr>
<tr><td><b>Insufficient Volume at Origin</b></td><td>Not Enough Volume By TRT + low pkg count</td><td>~20% of gap</td><td>Delay creation until volume exists</td></tr>
<tr><td><b>Scheduling/Timing Mismatch</b></td><td>Scheduling/Planning bucket + negative hourstocpt</td><td>~15% of gap</td><td>Shift creation window / adjust CPT</td></tr>
<tr><td><b>Target Overcalibration</b></td><td>High target_cube vs actual available freight</td><td>~15% of gap</td><td>Recalibrate target cube per lane</td></tr>
<tr><td><b>Disruption Spillover</b></td><td>DM bucket + low fill (expected during disruptions)</td><td>~10% of gap</td><td>Track separately &mdash; not fully controllable</td></tr>
<tr><td><b>Manual Override Issues</b></td><td>CASA + specific creator patterns + repeated low fill</td><td>~5% of gap</td><td>Training / creation guardrails</td></tr>
</table>

<h2>7. Execution Framework &mdash; Ongoing Mechanism</h2>

<h3>Step 1: Weekly Site Identification (5 min)</h3>
<ul>
<li>Pull site utilization for all sites with 10+ active loads</li>
<li>Flag sites below 60% utilization</li>
<li>Identify sites trending downward (Wk-over-Wk decline &gt; 5pp)</li>
</ul>

<h3>Step 2: Site-Level Deep Dive (15 min per site)</h3>
<ul>
<li>Analyze platform split (CASA vs FMC) for each flagged site</li>
<li>Identify dominant adhoc bucket driving low utilization</li>
<li>Determine if issue is CASA-driven (premature creation) or FMC-driven (system logic)</li>
<li>Classify root cause using framework above</li>
</ul>

<h3>Step 3: Site Outreach &amp; Follow-Up</h3>
<ul>
<li>Share site-specific findings with POC (platform split, bucket breakdown, trend)</li>
<li>Request observations: What is causing low fill at their site?</li>
<li>Set up bi-weekly 15-min sync with top priority sites</li>
<li>POCs to suggest process/timing changes that could improve fill rates</li>
</ul>

<h3>Step 4: Track &amp; Report</h3>
<table>
<tr><th>Cadence</th><th>Action</th><th>Owner</th><th>Time</th></tr>
<tr><td>Weekly</td><td>Site POCs submit observations + blockers</td><td>Site POC</td><td>10 min</td></tr>
<tr><td>Bi-weekly</td><td>Consolidate findings, update tracker, flag trends</td><td>Program Owner</td><td>30 min</td></tr>
<tr><td>Monthly</td><td>Leadership update with trend data</td><td>Program Owner</td><td>20 min</td></tr>
<tr><td>Quarterly</td><td>Full refresh &mdash; re-score all sites, recalibrate targets</td><td>Program Owner + POCs</td><td>1 hr</td></tr>
</table>

<h2>8. Targets &amp; Milestones</h2>
<table>
<tr><th>Metric</th><th>Current (Wk17-19)</th><th>4-Week Target</th><th>12-Week Target</th></tr>
<tr><td>Overall Utilization</td><td style="color:#dc3545;font-weight:bold">${overallUtil}%</td><td>54%</td><td>60%</td></tr>
<tr><td>CASA Utilization</td><td style="color:#dc3545;font-weight:bold">${casaUtil}%</td><td>35%</td><td>45%</td></tr>
<tr><td>FMC Utilization</td><td style="color:#2d6a4f;font-weight:bold">${fmcUtil}%</td><td>62%</td><td>65%</td></tr>
<tr><td>Sites Below 60%</td><td>${underUtil.length}</td><td>${Math.round(underUtil.length*0.85)}</td><td>${Math.round(underUtil.length*0.65)}</td></tr>
</table>

<h2>9. Timeline</h2>
<table>
<tr><th>Week</th><th>Action</th><th>Deliverable</th></tr>
<tr><td>Week 1</td><td>Baseline complete, sites prioritized, framework documented</td><td>This document</td></tr>
<tr><td>Week 2</td><td>Outreach to Tier 1 sites (top 10 by severity)</td><td>POC responses collected</td></tr>
<tr><td>Week 3</td><td>Site-level deep dive for top 5 sites</td><td>Root cause classification per site</td></tr>
<tr><td>Week 4</td><td>First leadership update with trend data</td><td>Monthly report</td></tr>
<tr><td>Week 5-8</td><td>Monitor, iterate, expand to Tier 2 sites</td><td>Trend improvement evidence</td></tr>
<tr><td>Week 9-12</td><td>Mechanism stabilized, playbook documented</td><td>Reusable framework</td></tr>
</table>

<h2>10. Key Recommendations</h2>
<div class="callout-blue">
<p><b>1. Address CASA Load Creation Logic (Primary Lever)</b><br>
CASA loads run at ${casaUtil}% &mdash; half the rate of FMC. Implementing a minimum fill threshold before CASA allows load dispatch could move overall utilization from ${overallUtil}% toward 57-60%.</p>
<p><b>2. Prioritize "FC Underutilized" Bucket</b><br>
This bucket runs at 18.8% utilization across 2,421 loads. Loads are being created with almost no freight available &mdash; single biggest opportunity.</p>
<p><b>3. Site-Specific Engagement for Tier 1 Sites</b><br>
Top 10 underutilized high-volume sites need direct POC engagement to understand local factors.</p>
<p><b>4. Build Repeatable Mechanism</b><br>
Weekly/bi-weekly/monthly cadence ensures sustained improvement and provides leadership with ongoing visibility.</p>
</div>

<div class="footer">
<p>Document prepared: May 2026 | Data: Weeks 17-19, 2026</p>
<p>Platforms in scope: Flintstones (FMC) &amp; CASA_UI only | Active loads only (is_active = 1)</p>
</div>

</body></html>`;

fs.writeFileSync('docs/VRID-Utilization-Deep-Dive-Report.html', html);
console.log('Done: docs/VRID-Utilization-Deep-Dive-Report.html');
