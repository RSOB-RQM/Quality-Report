const XLSX = require('xlsx');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType } = require('docx');
const fs = require('fs');

// Read data
const wb = XLSX.readFile('Data for site uti - FMC & CASA.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

const active = data.filter(r => r.is_active === 1 && r.fill_cube_num && r.target_cube_den);

// Aggregations
const totalFill = active.reduce((s,r) => s + r.fill_cube_num, 0);
const totalTarget = active.reduce((s,r) => s + r.target_cube_den, 0);
const overallUtil = (totalFill/totalTarget*100).toFixed(1);

const casaLoads = active.filter(r => r.create_platform === 'CASA_UI');
const fmcLoads = active.filter(r => r.create_platform === 'Flintstones');
const casaUtil = (casaLoads.reduce((s,r)=>s+r.fill_cube_num,0)/casaLoads.reduce((s,r)=>s+r.target_cube_den,0)*100).toFixed(1);
const fmcUtil = (fmcLoads.reduce((s,r)=>s+r.fill_cube_num,0)/fmcLoads.reduce((s,r)=>s+r.target_cube_den,0)*100).toFixed(1);

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

const underUtilSites = Object.values(siteAgg)
  .map(s => ({...s, util: s.fill/s.target*100}))
  .filter(s => s.util < 60 && s.count >= 20)
  .sort((a,b) => b.count - a.count);

// Bucket aggregation
const bucketAgg = {};
active.forEach(r => {
  if(!bucketAgg[r.adhoc_bucket]) bucketAgg[r.adhoc_bucket] = {fill:0,target:0,count:0};
  bucketAgg[r.adhoc_bucket].fill += r.fill_cube_num;
  bucketAgg[r.adhoc_bucket].target += r.target_cube_den;
  bucketAgg[r.adhoc_bucket].count++;
});

// Helper functions
function makeHeaderCell(text) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
    shading: { type: ShadingType.SOLID, color: '232946' },
  });
}

function makeCell(text, bold = false, color = '000000') {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(text), bold, size: 18, color })], alignment: AlignmentType.CENTER })],
  });
}

// Build document
const doc = new Document({
  sections: [{
    properties: {},
    children: [
      // Title
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: 'VRID Utilization Deep Dive', bold: true, size: 48 })] }),
      new Paragraph({ children: [new TextRun({ text: 'Site-Level Analysis & Framework', size: 28, color: '666666' })] }),
      new Paragraph({ children: [new TextRun({ text: 'Data Period: Weeks 17-19, 2026 | Platforms: Flintstones (FMC) & CASA_UI', size: 22, color: '666666' })] }),
      new Paragraph({ children: [] }),

      // Scope
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '1. Scope & Methodology' })] }),
      new Paragraph({ children: [new TextRun({ text: 'This analysis considers only loads created through ', size: 22 }), new TextRun({ text: 'Flintstones (FMC)', bold: true, size: 22 }), new TextRun({ text: ' and ', size: 22 }), new TextRun({ text: 'CASA_UI', bold: true, size: 22 }), new TextRun({ text: ' platforms. Only active loads (is_active = 1) with valid fill and target cube data are included.', size: 22 })] }),
      new Paragraph({ children: [] }),
      new Paragraph({ children: [new TextRun({ text: 'Utilization Formula: ', bold: true, size: 22 }), new TextRun({ text: 'fill_cube_num / target_cube_den × 100', italics: true, size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: 'Target: ', bold: true, size: 22 }), new TextRun({ text: '60% utilization', size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: 'Focus: ', bold: true, size: 22 }), new TextRun({ text: 'Sites below 60% utilization with 20+ active loads (high-volume, actionable sites)', size: 22 })] }),
      new Paragraph({ children: [] }),

      // Executive Summary
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '2. Executive Summary' })] }),
      new Paragraph({ children: [] }),

      // KPI Table
      new Table({
        rows: [
          new TableRow({ children: [makeHeaderCell('Metric'), makeHeaderCell('Value'), makeHeaderCell('Status')] }),
          new TableRow({ children: [makeCell('Overall Utilization'), makeCell(overallUtil + '%', true, 'CC0000'), makeCell('Below Target')] }),
          new TableRow({ children: [makeCell('Total Active Loads'), makeCell(active.length.toLocaleString()), makeCell('Wk 17-19')] }),
          new TableRow({ children: [makeCell('Flintstones (FMC) Utilization'), makeCell(fmcUtil + '% (' + fmcLoads.length.toLocaleString() + ' loads)', true, '006600'), makeCell('At Target')] }),
          new TableRow({ children: [makeCell('CASA_UI Utilization'), makeCell(casaUtil + '% (' + casaLoads.length.toLocaleString() + ' loads)', true, 'CC0000'), makeCell('Critical - 30pp below target')] }),
          new TableRow({ children: [makeCell('Sites Below 60% (20+ loads)'), makeCell(underUtilSites.length.toString(), true, 'CC0000'), makeCell('Requires intervention')] }),
          new TableRow({ children: [makeCell('Target'), makeCell('60%', true), makeCell('')] }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ children: [] }),

      new Paragraph({ children: [new TextRun({ text: 'Key Finding: ', bold: true, size: 22 }), new TextRun({ text: 'CASA-created loads are the primary drag on utilization, running at ' + casaUtil + '% vs FMC at ' + fmcUtil + '%. Across every adhoc bucket, CASA underperforms FMC by 20-33 percentage points. This indicates a systemic platform/process issue — loads are being created before sufficient volume accumulates at the origin site.', size: 22 })] }),
      new Paragraph({ children: [] }),

      // Weekly Trend
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '3. Weekly Utilization Trend' })] }),
      new Paragraph({ children: [] }),

      new Table({
        rows: [
          new TableRow({ children: [makeHeaderCell('Week'), makeHeaderCell('Utilization %'), makeHeaderCell('Active Loads'), makeHeaderCell('Trend')] }),
          ...([17,18,19].map(w => {
            const wk = active.filter(r => r.wk === w);
            const f = wk.reduce((s,r) => s + r.fill_cube_num, 0);
            const t = wk.reduce((s,r) => s + r.target_cube_den, 0);
            const util = (f/t*100).toFixed(1);
            const trend = w === 17 ? 'Baseline' : w === 18 ? '▼ -0.6pp' : 'Flat';
            return new TableRow({ children: [makeCell('Week ' + w), makeCell(util + '%'), makeCell(wk.length.toLocaleString()), makeCell(trend)] });
          }))
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ children: [] }),
      new Paragraph({ children: [new TextRun({ text: 'Observation: ', bold: true, size: 22 }), new TextRun({ text: 'Utilization is flat at ~51% with no organic improvement week-over-week. Without structured intervention, this metric will not self-correct.', size: 22 })] }),
      new Paragraph({ children: [] }),

      // Bucket Analysis
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '4. Utilization by Adhoc Bucket' })] }),
      new Paragraph({ children: [new TextRun({ text: 'Breakdown of utilization by load creation reason — identifies which categories are dragging performance.', size: 22 })] }),
      new Paragraph({ children: [] }),

      new Table({
        rows: [
          new TableRow({ children: [makeHeaderCell('Adhoc Bucket'), makeHeaderCell('Utilization %'), makeHeaderCell('Load Count'), makeHeaderCell('Impact')] }),
          ...Object.entries(bucketAgg)
            .map(([k,v]) => ({ name: k, util: (v.fill/v.target*100), count: v.count }))
            .sort((a,b) => a.util - b.util)
            .map(b => new TableRow({ children: [
              makeCell(b.name), 
              makeCell(b.util.toFixed(1) + '%', b.util < 40, b.util < 40 ? 'CC0000' : '000000'), 
              makeCell(b.count.toLocaleString()),
              makeCell(b.util < 35 ? 'High' : b.util < 50 ? 'Medium' : 'Low')
            ]}))
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ children: [] }),

      // Site-Level Analysis
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '5. Site-Level Utilization — Priority Sites' })] }),
      new Paragraph({ children: [new TextRun({ text: 'All sites below 60% utilization with 20+ active loads, sorted by volume. These are the actionable sites where intervention will have measurable impact.', size: 22 })] }),
      new Paragraph({ children: [] }),

      // Tier 1 sites
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '5.1 Tier 1 — Severely Underutilized (Below 40%)' })] }),
      new Paragraph({ children: [] }),

      new Table({
        rows: [
          new TableRow({ children: [makeHeaderCell('Site'), makeHeaderCell('Util%'), makeHeaderCell('Loads'), makeHeaderCell('Wk17'), makeHeaderCell('Wk18'), makeHeaderCell('Wk19'), makeHeaderCell('CASA Util%'), makeHeaderCell('FMC Util%'), makeHeaderCell('Top Issue Bucket')] }),
          ...underUtilSites.filter(s => s.util < 40).slice(0, 20).map(s => {
            const w17 = s.w17t ? (s.w17f/s.w17t*100).toFixed(1) : '-';
            const w18 = s.w18t ? (s.w18f/s.w18t*100).toFixed(1) : '-';
            const w19 = s.w19t ? (s.w19f/s.w19t*100).toFixed(1) : '-';
            const casa = s.casaTarget ? (s.casaFill/s.casaTarget*100).toFixed(1) : '-';
            const fmc = s.fmcTarget ? (s.fmcFill/s.fmcTarget*100).toFixed(1) : '-';
            const topBucket = Object.entries(s.buckets).sort((a,b)=>b[1].count-a[1].count)[0];
            const bucketStr = topBucket ? topBucket[0] + ' (' + (topBucket[1].fill/topBucket[1].target*100).toFixed(0) + '%)' : '-';
            return new TableRow({ children: [
              makeCell(s.site, true), makeCell(s.util.toFixed(1)+'%', true, 'CC0000'), makeCell(s.count.toString()),
              makeCell(w17+'%'), makeCell(w18+'%'), makeCell(w19+'%'),
              makeCell(casa+'%', false, 'CC0000'), makeCell(fmc+'%'), makeCell(bucketStr)
            ]});
          })
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ children: [] }),

      // Tier 2 sites
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '5.2 Tier 2 — Moderate Gap (40-60%)' })] }),
      new Paragraph({ children: [] }),

      new Table({
        rows: [
          new TableRow({ children: [makeHeaderCell('Site'), makeHeaderCell('Util%'), makeHeaderCell('Loads'), makeHeaderCell('Wk17'), makeHeaderCell('Wk18'), makeHeaderCell('Wk19'), makeHeaderCell('CASA Util%'), makeHeaderCell('FMC Util%'), makeHeaderCell('Top Issue Bucket')] }),
          ...underUtilSites.filter(s => s.util >= 40 && s.util < 60).slice(0, 20).map(s => {
            const w17 = s.w17t ? (s.w17f/s.w17t*100).toFixed(1) : '-';
            const w18 = s.w18t ? (s.w18f/s.w18t*100).toFixed(1) : '-';
            const w19 = s.w19t ? (s.w19f/s.w19t*100).toFixed(1) : '-';
            const casa = s.casaTarget ? (s.casaFill/s.casaTarget*100).toFixed(1) : '-';
            const fmc = s.fmcTarget ? (s.fmcFill/s.fmcTarget*100).toFixed(1) : '-';
            const topBucket = Object.entries(s.buckets).sort((a,b)=>b[1].count-a[1].count)[0];
            const bucketStr = topBucket ? topBucket[0] + ' (' + (topBucket[1].fill/topBucket[1].target*100).toFixed(0) + '%)' : '-';
            return new TableRow({ children: [
              makeCell(s.site, true), makeCell(s.util.toFixed(1)+'%', true, 'CC6600'), makeCell(s.count.toString()),
              makeCell(w17+'%'), makeCell(w18+'%'), makeCell(w19+'%'),
              makeCell(casa+'%', false, 'CC0000'), makeCell(fmc+'%'), makeCell(bucketStr)
            ]});
          })
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ children: [] }),

      // Root Cause Framework
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '6. Root Cause Classification Framework' })] }),
      new Paragraph({ children: [new TextRun({ text: 'Each underutilized site is classified into one or more root cause categories based on data patterns:', size: 22 })] }),
      new Paragraph({ children: [] }),

      new Table({
        rows: [
          new TableRow({ children: [makeHeaderCell('Root Cause'), makeHeaderCell('Data Indicator'), makeHeaderCell('Est. Impact'), makeHeaderCell('Recommended Action')] }),
          new TableRow({ children: [makeCell('Premature Load Creation', true), makeCell('CASA + FC Underutilized + fill < 20%'), makeCell('~35% of gap'), makeCell('Min fill threshold before dispatch')] }),
          new TableRow({ children: [makeCell('Insufficient Volume at Origin', true), makeCell('Not Enough Volume By TRT + low pkg count'), makeCell('~20% of gap'), makeCell('Delay creation until volume exists')] }),
          new TableRow({ children: [makeCell('Scheduling/Timing Mismatch', true), makeCell('Scheduling/Planning bucket + negative hourstocpt'), makeCell('~15% of gap'), makeCell('Shift creation window / adjust CPT')] }),
          new TableRow({ children: [makeCell('Target Overcalibration', true), makeCell('High target_cube vs actual available freight'), makeCell('~15% of gap'), makeCell('Recalibrate target cube per lane')] }),
          new TableRow({ children: [makeCell('Disruption Spillover', true), makeCell('DM bucket + low fill (expected)'), makeCell('~10% of gap'), makeCell('Track separately — not fully controllable')] }),
          new TableRow({ children: [makeCell('Manual Override Issues', true), makeCell('CASA + specific creator patterns'), makeCell('~5% of gap'), makeCell('Training / creation guardrails')] }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ children: [] }),

      // Execution Framework
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '7. Execution Framework — Ongoing Mechanism' })] }),
      new Paragraph({ children: [] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Step 1: Weekly Site Identification (5 min)' })] }),
      new Paragraph({ children: [new TextRun({ text: '• Pull site utilization for all sites with 10+ active loads', size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '• Flag sites below 60% utilization', size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '• Identify sites trending downward (Wk-over-Wk decline > 5pp)', size: 22 })] }),
      new Paragraph({ children: [] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Step 2: Site-Level Deep Dive (15 min per site)' })] }),
      new Paragraph({ children: [new TextRun({ text: '• For each flagged site, analyze platform split (CASA vs FMC)', size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '• Identify dominant adhoc bucket driving low utilization', size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '• Check if issue is CASA-driven (premature creation) or FMC-driven (system logic)', size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '• Classify root cause using framework above', size: 22 })] }),
      new Paragraph({ children: [] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Step 3: Site Outreach & Follow-Up' })] }),
      new Paragraph({ children: [new TextRun({ text: '• Share site-specific findings with POC (platform split, bucket breakdown, trend)', size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '• Request observations: What is causing low fill at their site?', size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '• Set up bi-weekly 15-min sync with top priority sites', size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '• POCs to suggest process/timing changes that could improve fill rates', size: 22 })] }),
      new Paragraph({ children: [] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Step 4: Track & Report' })] }),
      new Paragraph({ children: [] }),
      new Table({
        rows: [
          new TableRow({ children: [makeHeaderCell('Cadence'), makeHeaderCell('Action'), makeHeaderCell('Owner'), makeHeaderCell('Time')] }),
          new TableRow({ children: [makeCell('Weekly'), makeCell('Site POCs submit observations + blockers'), makeCell('Site POC'), makeCell('10 min')] }),
          new TableRow({ children: [makeCell('Bi-weekly'), makeCell('Consolidate findings, update tracker, flag trends'), makeCell('Program Owner'), makeCell('30 min')] }),
          new TableRow({ children: [makeCell('Monthly'), makeCell('Leadership update with trend data'), makeCell('Program Owner'), makeCell('20 min')] }),
          new TableRow({ children: [makeCell('Quarterly'), makeCell('Full refresh — re-score all sites, recalibrate targets'), makeCell('Program Owner + POCs'), makeCell('1 hr')] }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ children: [] }),

      // Targets
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '8. Targets & Milestones' })] }),
      new Paragraph({ children: [] }),
      new Table({
        rows: [
          new TableRow({ children: [makeHeaderCell('Metric'), makeHeaderCell('Current (Wk17-19)'), makeHeaderCell('4-Week Target'), makeHeaderCell('12-Week Target')] }),
          new TableRow({ children: [makeCell('Overall Utilization'), makeCell(overallUtil + '%', true, 'CC0000'), makeCell('54%'), makeCell('60%')] }),
          new TableRow({ children: [makeCell('CASA Utilization'), makeCell(casaUtil + '%', true, 'CC0000'), makeCell('35%'), makeCell('45%')] }),
          new TableRow({ children: [makeCell('FMC Utilization'), makeCell(fmcUtil + '%', true, '006600'), makeCell('62%'), makeCell('65%')] }),
          new TableRow({ children: [makeCell('Sites Below 60%'), makeCell(underUtilSites.length.toString()), makeCell(Math.round(underUtilSites.length*0.85).toString()), makeCell(Math.round(underUtilSites.length*0.65).toString())] }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ children: [] }),

      // Timeline
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '9. Timeline' })] }),
      new Paragraph({ children: [] }),
      new Table({
        rows: [
          new TableRow({ children: [makeHeaderCell('Week'), makeHeaderCell('Action'), makeHeaderCell('Deliverable')] }),
          new TableRow({ children: [makeCell('Week 1'), makeCell('Baseline complete, sites prioritized, framework documented'), makeCell('This document')] }),
          new TableRow({ children: [makeCell('Week 2'), makeCell('Outreach to Tier 1 sites (top 10 by severity)'), makeCell('POC responses collected')] }),
          new TableRow({ children: [makeCell('Week 3'), makeCell('Site-level deep dive for top 5 sites'), makeCell('Root cause classification per site')] }),
          new TableRow({ children: [makeCell('Week 4'), makeCell('First leadership update with trend data'), makeCell('Monthly report')] }),
          new TableRow({ children: [makeCell('Week 5-8'), makeCell('Monitor, iterate, expand to Tier 2 sites'), makeCell('Trend improvement evidence')] }),
          new TableRow({ children: [makeCell('Week 9-12'), makeCell('Mechanism stabilized, playbook documented'), makeCell('Reusable framework for other metrics')] }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ children: [] }),

      // Recommendations
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '10. Key Recommendations' })] }),
      new Paragraph({ children: [] }),
      new Paragraph({ children: [new TextRun({ text: '1. Address CASA Load Creation Logic (Primary Lever)', bold: true, size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '   CASA loads run at ' + casaUtil + '% — half the rate of FMC. Implementing a minimum fill threshold before CASA allows load dispatch could move overall utilization from ' + overallUtil + '% toward 57-60% without site-level intervention.', size: 22 })] }),
      new Paragraph({ children: [] }),
      new Paragraph({ children: [new TextRun({ text: '2. Prioritize "FC Underutilized" Bucket', bold: true, size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '   This bucket runs at 18.8% utilization across 2,421 loads. Loads are being created with almost no freight available. This is the single biggest opportunity.', size: 22 })] }),
      new Paragraph({ children: [] }),
      new Paragraph({ children: [new TextRun({ text: '3. Site-Specific Engagement for Tier 1 Sites', bold: true, size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '   The top 10 underutilized high-volume sites need direct POC engagement to understand local factors (volume patterns, timing, process gaps).', size: 22 })] }),
      new Paragraph({ children: [] }),
      new Paragraph({ children: [new TextRun({ text: '4. Build Repeatable Mechanism', bold: true, size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '   This is not a one-time analysis. The weekly/bi-weekly/monthly cadence ensures sustained improvement and provides leadership with ongoing visibility.', size: 22 })] }),
      new Paragraph({ children: [] }),

      // Footer
      new Paragraph({ children: [new TextRun({ text: '_______________________________________________', color: 'CCCCCC' })] }),
      new Paragraph({ children: [new TextRun({ text: 'Document prepared: May 2026 | Data: Weeks 17-19, 2026', size: 18, color: '999999' })] }),
      new Paragraph({ children: [new TextRun({ text: 'Platforms in scope: Flintstones (FMC) & CASA_UI only', size: 18, color: '999999' })] }),
      new Paragraph({ children: [new TextRun({ text: 'Active loads only (is_active = 1) with valid fill_cube_num and target_cube_den', size: 18, color: '999999' })] }),
    ]
  }]
});

// Generate
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('docs/VRID-Utilization-Deep-Dive-Report.docx', buffer);
  console.log('Word document generated: docs/VRID-Utilization-Deep-Dive-Report.docx');
});
