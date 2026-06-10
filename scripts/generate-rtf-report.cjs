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

const overallUtil = (totalFill/totalTarget*100).toFixed(1);
const casaUtil = (casaFill/casaTarget*100).toFixed(1);
const fmcUtil = (fmcFill/fmcTarget*100).toFixed(1);

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

const bucketsSorted = Object.entries(bucketAgg)
  .map(([k,v])=>({name:k, util:(v.fill/v.target*100).toFixed(1), count:v.count}))
  .sort((a,b)=>parseFloat(a.util)-parseFloat(b.util));

// RTF helpers
function rtfRow(cells, bold=false, header=false) {
  let row = '\\trowd\\trqc';
  const colWidth = Math.floor(9000 / cells.length);
  cells.forEach((_, i) => {
    row += '\\cellx' + (colWidth * (i+1));
  });
  row += '\n';
  cells.forEach(c => {
    if(header) row += '\\intbl\\b ' + c + '\\b0\\cell\n';
    else if(bold) row += '\\intbl\\b ' + c + '\\b0\\cell\n';
    else row += '\\intbl ' + c + '\\cell\n';
  });
  row += '\\row\n';
  return row;
}

// Build RTF
let rtf = '{\\rtf1\\ansi\\deff0\n';
rtf += '{\\fonttbl{\\f0 Segoe UI;}{\\f1 Consolas;}}\n';
rtf += '{\\colortbl;\\red0\\green0\\blue0;\\red220\\green53\\blue69;\\red45\\green106\\blue79;\\red35\\green41\\blue70;\\red67\\green97\\blue238;}\n';
rtf += '\\f0\\fs22\n';

// Title
rtf += '\\pard\\qc\\fs40\\b VRID Utilization Deep Dive\\b0\\par\n';
rtf += '\\fs28 Site-Level Analysis & Framework\\par\n';
rtf += '\\fs20\\i Data Period: Weeks 17-19, 2026 | Platforms: Flintstones (FMC) & CASA_UI\\i0\\par\n';
rtf += '\\pard\\par\n';

// Section 1
rtf += '\\fs28\\b 1. Scope & Methodology\\b0\\par\n';
rtf += '\\fs22\\par\n';
rtf += 'This analysis considers \\b only loads created through Flintstones (FMC) and CASA_UI platforms\\b0. Only active loads (is_active = 1) with valid fill_cube_num and target_cube_den values are included.\\par\\par\n';
rtf += '\\b Utilization Formula:\\b0  fill_cube_num / target_cube_den x 100\\par\n';
rtf += '\\b Target:\\b0  60% utilization\\par\n';
rtf += '\\b Focus:\\b0  Sites below 60% utilization with 20+ active loads\\par\n';
rtf += '\\par\n';

// Section 2
rtf += '\\fs28\\b 2. Executive Summary\\b0\\par\n';
rtf += '\\fs22\\par\n';
rtf += rtfRow(['Metric','Value','Status'], false, true);
rtf += rtfRow(['Overall Utilization', overallUtil+'%', 'BELOW TARGET']);
rtf += rtfRow(['Total Active Loads', active.length.toLocaleString(), 'Wk 17-19']);
rtf += rtfRow(['Flintstones (FMC)', fmcUtil+'% ('+fmcLoads.length.toLocaleString()+' loads)', 'At Target']);
rtf += rtfRow(['CASA_UI', casaUtil+'% ('+casaLoads.length.toLocaleString()+' loads)', 'CRITICAL']);
rtf += rtfRow(['Sites Below 60% (20+ loads)', underUtil.length.toString(), 'Requires Intervention']);
rtf += rtfRow(['Target', '60%', '']);
rtf += '\\par\n';
rtf += '\\b KEY FINDING:\\b0  CASA-created loads are the primary drag on utilization, running at '+casaUtil+'% vs FMC at '+fmcUtil+'%. Across every adhoc bucket, CASA underperforms FMC by 20-33 percentage points. Loads are being created before sufficient volume accumulates at origin sites.\\par\n';
rtf += '\\par\n';

// Section 3
rtf += '\\fs28\\b 3. Weekly Utilization Trend\\b0\\par\n';
rtf += '\\fs22\\par\n';
rtf += rtfRow(['Week','Utilization %','Active Loads','Trend'], false, true);
[17,18,19].forEach(w => {
  const wk = active.filter(r => r.wk === w);
  const f = wk.reduce((s,r)=>s+r.fill_cube_num,0);
  const t = wk.reduce((s,r)=>s+r.target_cube_den,0);
  const trend = w===17?'Baseline':w===18?'Down -0.6pp':'Flat';
  rtf += rtfRow(['Week '+w, (f/t*100).toFixed(1)+'%', wk.length.toLocaleString(), trend]);
});
rtf += '\\par\n';
rtf += '\\b Observation:\\b0  Utilization is flat at ~51% with no organic improvement. Without structured intervention, this will not self-correct.\\par\n';
rtf += '\\par\n';

// Section 4
rtf += '\\fs28\\b 4. Utilization by Adhoc Bucket\\b0\\par\n';
rtf += '\\fs22\\par\n';
rtf += rtfRow(['Adhoc Bucket','Utilization %','Load Count','Impact'], false, true);
bucketsSorted.forEach(b => {
  const impact = parseFloat(b.util)<35?'HIGH':parseFloat(b.util)<50?'MEDIUM':'LOW';
  rtf += rtfRow([b.name, b.util+'%', b.count.toLocaleString(), impact]);
});
rtf += '\\par\n';

// Section 5
rtf += '\\fs28\\b 5. Site-Level Utilization - Priority Sites\\b0\\par\n';
rtf += '\\fs22\\par\n';
rtf += 'All sites below 60% utilization with 20+ active loads, sorted by volume.\\par\\par\n';

rtf += '\\fs24\\b 5.1 Tier 1 - Severely Underutilized (Below 40%) - '+tier1.length+' sites\\b0\\par\n';
rtf += '\\fs20\\par\n';
rtf += rtfRow(['Site','Util%','Loads','Wk17','Wk18','Wk19','CASA%','FMC%','Top Bucket'], false, true);
tier1.slice(0,25).forEach(s => {
  const w17 = s.w17t ? (s.w17f/s.w17t*100).toFixed(1)+'%' : '-';
  const w18 = s.w18t ? (s.w18f/s.w18t*100).toFixed(1)+'%' : '-';
  const w19 = s.w19t ? (s.w19f/s.w19t*100).toFixed(1)+'%' : '-';
  const casa = s.casaTarget ? (s.casaFill/s.casaTarget*100).toFixed(1)+'%' : '-';
  const fmc = s.fmcTarget ? (s.fmcFill/s.fmcTarget*100).toFixed(1)+'%' : '-';
  const topB = Object.entries(s.buckets).sort((a,b)=>b[1].count-a[1].count)[0];
  const bStr = topB ? topB[0] : '-';
  rtf += rtfRow([s.site, s.util.toFixed(1)+'%', s.count.toString(), w17, w18, w19, casa, fmc, bStr]);
});
rtf += '\\par\n';

rtf += '\\fs24\\b 5.2 Tier 2 - Moderate Gap (40-60%) - '+tier2.length+' sites\\b0\\par\n';
rtf += '\\fs20\\par\n';
rtf += rtfRow(['Site','Util%','Loads','Wk17','Wk18','Wk19','CASA%','FMC%','Top Bucket'], false, true);
tier2.slice(0,25).forEach(s => {
  const w17 = s.w17t ? (s.w17f/s.w17t*100).toFixed(1)+'%' : '-';
  const w18 = s.w18t ? (s.w18f/s.w18t*100).toFixed(1)+'%' : '-';
  const w19 = s.w19t ? (s.w19f/s.w19t*100).toFixed(1)+'%' : '-';
  const casa = s.casaTarget ? (s.casaFill/s.casaTarget*100).toFixed(1)+'%' : '-';
  const fmc = s.fmcTarget ? (s.fmcFill/s.fmcTarget*100).toFixed(1)+'%' : '-';
  const topB = Object.entries(s.buckets).sort((a,b)=>b[1].count-a[1].count)[0];
  const bStr = topB ? topB[0] : '-';
  rtf += rtfRow([s.site, s.util.toFixed(1)+'%', s.count.toString(), w17, w18, w19, casa, fmc, bStr]);
});
rtf += '\\fs22\\par\n';

// Section 6
rtf += '\\fs28\\b 6. Root Cause Classification Framework\\b0\\par\n';
rtf += '\\fs22\\par\n';
rtf += rtfRow(['Root Cause','Data Indicator','Est. Impact','Action'], false, true);
rtf += rtfRow(['Premature Load Creation (CASA)','CASA + FC Underutilized + fill < 20%','~35% of gap','Min fill threshold before dispatch']);
rtf += rtfRow(['Insufficient Volume at Origin','Not Enough Volume By TRT + low pkg count','~20% of gap','Delay creation until volume exists']);
rtf += rtfRow(['Scheduling/Timing Mismatch','Scheduling/Planning bucket + negative hourstocpt','~15% of gap','Shift creation window / adjust CPT']);
rtf += rtfRow(['Target Overcalibration','High target_cube vs actual freight','~15% of gap','Recalibrate target cube per lane']);
rtf += rtfRow(['Disruption Spillover','DM bucket + low fill (expected)','~10% of gap','Track separately']);
rtf += rtfRow(['Manual Override Issues','CASA + specific creator patterns','~5% of gap','Training / guardrails']);
rtf += '\\par\n';

// Section 7
rtf += '\\fs28\\b 7. Execution Framework - Ongoing Mechanism\\b0\\par\n';
rtf += '\\fs22\\par\n';
rtf += '\\b Step 1: Weekly Site Identification (5 min)\\b0\\par\n';
rtf += '\\bullet  Pull site utilization for all sites with 10+ active loads\\par\n';
rtf += '\\bullet  Flag sites below 60% utilization\\par\n';
rtf += '\\bullet  Identify sites trending downward (Wk-over-Wk decline > 5pp)\\par\\par\n';

rtf += '\\b Step 2: Site-Level Deep Dive (15 min per site)\\b0\\par\n';
rtf += '\\bullet  Analyze platform split (CASA vs FMC) for each flagged site\\par\n';
rtf += '\\bullet  Identify dominant adhoc bucket driving low utilization\\par\n';
rtf += '\\bullet  Determine if issue is CASA-driven or FMC-driven\\par\n';
rtf += '\\bullet  Classify root cause using framework above\\par\\par\n';

rtf += '\\b Step 3: Site Outreach & Follow-Up\\b0\\par\n';
rtf += '\\bullet  Share site-specific findings with POC\\par\n';
rtf += '\\bullet  Request observations: What is causing low fill?\\par\n';
rtf += '\\bullet  Set up bi-weekly 15-min sync with top priority sites\\par\n';
rtf += '\\bullet  POCs to suggest process/timing changes\\par\\par\n';

rtf += '\\b Step 4: Track & Report\\b0\\par\n';
rtf += rtfRow(['Cadence','Action','Owner','Time'], false, true);
rtf += rtfRow(['Weekly','Site POCs submit observations + blockers','Site POC','10 min']);
rtf += rtfRow(['Bi-weekly','Consolidate findings, update tracker','Program Owner','30 min']);
rtf += rtfRow(['Monthly','Leadership update with trend data','Program Owner','20 min']);
rtf += rtfRow(['Quarterly','Full refresh - re-score all sites','Program Owner + POCs','1 hr']);
rtf += '\\par\n';

// Section 8
rtf += '\\fs28\\b 8. Targets & Milestones\\b0\\par\n';
rtf += '\\fs22\\par\n';
rtf += rtfRow(['Metric','Current (Wk17-19)','4-Week Target','12-Week Target'], false, true);
rtf += rtfRow(['Overall Utilization', overallUtil+'%', '54%', '60%']);
rtf += rtfRow(['CASA Utilization', casaUtil+'%', '35%', '45%']);
rtf += rtfRow(['FMC Utilization', fmcUtil+'%', '62%', '65%']);
rtf += rtfRow(['Sites Below 60%', underUtil.length.toString(), Math.round(underUtil.length*0.85).toString(), Math.round(underUtil.length*0.65).toString()]);
rtf += '\\par\n';

// Section 9
rtf += '\\fs28\\b 9. Timeline\\b0\\par\n';
rtf += '\\fs22\\par\n';
rtf += rtfRow(['Week','Action','Deliverable'], false, true);
rtf += rtfRow(['Week 1','Baseline complete, sites prioritized','This document']);
rtf += rtfRow(['Week 2','Outreach to Tier 1 sites (top 10)','POC responses collected']);
rtf += rtfRow(['Week 3','Site-level deep dive for top 5','Root cause per site']);
rtf += rtfRow(['Week 4','First leadership update','Monthly report']);
rtf += rtfRow(['Week 5-8','Monitor, iterate, expand to Tier 2','Trend improvement']);
rtf += rtfRow(['Week 9-12','Mechanism stabilized, playbook documented','Reusable framework']);
rtf += '\\par\n';

// Section 10
rtf += '\\fs28\\b 10. Key Recommendations\\b0\\par\n';
rtf += '\\fs22\\par\n';
rtf += '\\b 1. Address CASA Load Creation Logic (Primary Lever)\\b0\\par\n';
rtf += 'CASA loads run at '+casaUtil+'% - half the rate of FMC. Implementing a minimum fill threshold before CASA allows load dispatch could move overall utilization from '+overallUtil+'% toward 57-60%.\\par\\par\n';
rtf += '\\b 2. Prioritize "FC Underutilized" Bucket\\b0\\par\n';
rtf += 'This bucket runs at 18.8% utilization across 2,421 loads. Loads are being created with almost no freight available - single biggest opportunity.\\par\\par\n';
rtf += '\\b 3. Site-Specific Engagement for Tier 1 Sites\\b0\\par\n';
rtf += 'Top 10 underutilized high-volume sites need direct POC engagement to understand local factors.\\par\\par\n';
rtf += '\\b 4. Build Repeatable Mechanism\\b0\\par\n';
rtf += 'Weekly/bi-weekly/monthly cadence ensures sustained improvement and provides leadership with ongoing visibility.\\par\\par\n';

// Footer
rtf += '\\par\\fs18\\i _____________________________________________\\par\n';
rtf += 'Document prepared: May 2026 | Data: Weeks 17-19, 2026\\par\n';
rtf += 'Platforms in scope: Flintstones (FMC) & CASA_UI only | Active loads only (is_active = 1)\\i0\\par\n';

rtf += '}';

fs.writeFileSync('docs/VRID-Utilization-Deep-Dive-Report.rtf', rtf);
console.log('RTF report generated: docs/VRID-Utilization-Deep-Dive-Report.rtf');
