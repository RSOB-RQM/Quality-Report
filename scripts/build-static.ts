import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read source data
const auditRaw = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'audit-records.json'), 'utf-8'));
const roleMapping = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'role-mapping.json'), 'utf-8'));
const passwordHashes = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'password-hashes.json'), 'utf-8'));

// Strip to essential fields only
interface MinRecord {
  r: string; // region
  w: number; // transactionWeek
  d: string; // transactionDate
  tid: string; // transactionId
  a: string; // associateLogin
  s: string; // supervisorLogin
  dt: string; // disruptionType
  adm: string;
  af?: string; // admFinding
  ra: string;
  rf?: string; // raFinding
  rrc: string;
  rrf?: string; // rrcFinding
  acc: string;
  acf?: string; // accFinding
  rv: string;
  rvf?: string; // rvFinding
  df: boolean; // defectFlag
  c1?: string; // comments1 (ADM)
  c2?: string; // comments2 (RA)
  c3?: string; // comments3 (RRC)
  c4?: string; // comments4 (ACC)
  c5?: string; // comments5 (RV)
  spr?: string; // spResponse
  spc?: string; // spocResponse
}

const compactRecords: MinRecord[] = auditRaw.map((rec: any) => {
  const obj: MinRecord = {
    r: rec.region,
    w: rec.transactionWeek,
    d: rec.transactionDate,
    tid: rec.transactionId || '',
    a: rec.associateLogin,
    s: rec.supervisorLogin,
    dt: rec.disruptionType,
    adm: rec.adm,
    ra: rec.ra,
    rrc: rec.rrc,
    acc: rec.acc,
    rv: rec.rv,
    df: rec.defectFlag === true,
  };
  if (rec.admFinding && rec.admFinding.trim()) obj.af = rec.admFinding.trim();
  if (rec.raFinding && rec.raFinding.trim()) obj.rf = rec.raFinding.trim();
  if (rec.rrcFinding && rec.rrcFinding.trim()) obj.rrf = rec.rrcFinding.trim();
  if (rec.accFinding && rec.accFinding.trim()) obj.acf = rec.accFinding.trim();
  if (rec.rvFinding && rec.rvFinding.trim()) obj.rvf = rec.rvFinding.trim();
  if (rec.comments1 && rec.comments1.trim()) obj.c1 = rec.comments1.trim();
  if (rec.comments2 && rec.comments2.trim()) obj.c2 = rec.comments2.trim();
  if (rec.comments3 && rec.comments3.trim()) obj.c3 = rec.comments3.trim();
  if (rec.comments4 && rec.comments4.trim()) obj.c4 = rec.comments4.trim();
  if (rec.comments5 && rec.comments5.trim()) obj.c5 = rec.comments5.trim();
  if (rec.spResponse && rec.spResponse.trim()) obj.spr = rec.spResponse.trim();
  if (rec.spocResponse && rec.spocResponse.trim()) obj.spc = rec.spocResponse.trim();
  return obj;
});

const dataJson = JSON.stringify(compactRecords);
const roleJson = JSON.stringify(roleMapping);
const hashJson = JSON.stringify(passwordHashes);

console.log(`Records: ${compactRecords.length}, Data size: ${(dataJson.length / 1024).toFixed(1)} KB`);


// Build the HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RSOB - Quality Performance Dashboard - NA & EU</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;color:#1e293b;min-height:100vh}
#app{min-height:100vh}
.nav{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:#1e40af;box-shadow:0 2px 8px rgba(30,64,175,.15)}
.nav-title{font-weight:700;font-size:18px;color:#fff;letter-spacing:-.01em}
.nav-links{display:flex;align-items:center;gap:12px}
.nav-link{font-size:13px;font-weight:600;color:#dbeafe;text-decoration:none;padding:4px 10px;border-radius:6px;background:rgba(255,255,255,.1);cursor:pointer;border:none}
.nav-link.active{background:rgba(255,255,255,.25)}
.nav-right{display:flex;align-items:center;gap:12px}
.role-badge{padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;color:#fff;border:1px solid rgba(255,255,255,.3)}
.role-admin{background:#7c3aed}
.role-manager{background:#2563eb}
.role-associate{background:#059669}
.user-name{font-size:14px;color:#dbeafe}
.logout-btn{padding:4px 12px;font-size:12px;border:1px solid rgba(255,255,255,.3);border-radius:6px;background:rgba(255,255,255,.1);color:#fff;cursor:pointer}
.main{max-width:1200px;margin:0 auto;padding:24px 16px}
.login-wrap{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5}
.login-form{background:#fff;padding:32px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);width:360px;display:flex;flex-direction:column;gap:16px}
.login-form h1{font-size:20px;text-align:center;color:#1e293b}
.login-form label{display:flex;flex-direction:column;gap:4px;font-size:14px;color:#475569}
.login-form input{padding:8px 12px;border:1px solid #cbd5e1;border-radius:4px;font-size:14px}
.login-form button{padding:10px 16px;background:#1e40af;color:#fff;border:none;border-radius:4px;font-size:14px;cursor:pointer;font-weight:600}
.login-form button:hover{background:#1e3a8a}
.login-error{color:#dc2626;background:#fef2f2;padding:8px 12px;border-radius:4px;font-size:13px}
.section{background:#fff;border-radius:8px;padding:20px;border:1px solid #e2e8f0;margin-bottom:20px}
.section-blue{border-left:4px solid #1e40af}
.section-red{border:1px solid #fecaca;border-left:4px solid #dc2626}
.section-insight{background:#eff6ff;border:1px solid #93c5fd;border-left:4px solid #1e40af;border-radius:8px;padding:16px;margin-bottom:20px}
.section h3{font-size:16px;font-weight:600;margin-bottom:12px}
.filter-bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 16px;background:#fff;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px}
.filter-bar label{font-size:13px;color:#64748b;display:flex;align-items:center;gap:6px}
.filter-bar select,.filter-bar input{padding:7px 12px;border:1px solid #dbeafe;border-radius:6px;font-size:13px;background:#fff;min-width:140px;color:#1e293b}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#fff;background:#1e40af}
td{padding:8px 12px;font-size:13px;border-bottom:1px solid #f1f5f9}
tr:nth-child(even){background:#f8fafc}
.csv-btn{padding:5px 14px;font-size:12px;font-weight:600;border:1px solid #dbeafe;border-radius:6px;background:#eff6ff;color:#1e40af;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.csv-btn:hover{background:#dbeafe}
.toggle-group{display:flex;gap:0;margin-bottom:16px}
.toggle-btn{padding:6px 16px;border:1px solid #e2e8f0;cursor:pointer;font-size:13px;font-weight:500;background:#fff;color:#64748b}
.toggle-btn:first-child{border-radius:6px 0 0 6px}
.toggle-btn:last-child{border-radius:0 6px 6px 0}
.toggle-btn.active{background:#1e40af;color:#fff;border-color:#1e40af}
.card-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.card{background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0;flex:1 1 0;min-width:140px}
.card-label{font-size:12px;color:#64748b}
.card-value{font-size:24px;font-weight:700;color:#1e293b}
.tab-bar{display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:16px}
.tab-btn{padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;border:none;background:transparent;color:#64748b;border-bottom:2px solid transparent;margin-bottom:-2px}
.tab-btn.active{color:#1e40af;border-bottom-color:#1e40af}
.badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;margin-right:4px}
.badge-adm{background:#f5f3ff;color:#7c3aed}
.badge-ra{background:#eff6ff;color:#2563eb}
.badge-rrc{background:#fef2f2;color:#dc2626}
.badge-acc{background:#fffbeb;color:#d97706}
.badge-rv{background:#ecfdf5;color:#059669}
.yes-no{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#fff}
.yes-no.yes{background:#16a34a}
.yes-no.no{background:#dc2626}
.defect-row{background:#fef2f2 !important}
.pagination{display:flex;justify-content:center;align-items:center;gap:16px;padding:16px 0}
.page-btn{padding:6px 16px;font-size:13px;border:1px solid #dbeafe;border-radius:6px;background:#fff;color:#1e40af;cursor:pointer;font-weight:600}
.page-btn:disabled{color:#94a3b8;cursor:default;background:#f1f5f9}
.bar{height:18px;border-radius:4px;min-width:4px}
.bar-adm{background:linear-gradient(90deg,#7c3aed,#a78bfa)}
.bar-ra{background:linear-gradient(90deg,#2563eb,#60a5fa)}
.bar-rrc{background:linear-gradient(90deg,#dc2626,#f87171)}
.bar-acc{background:linear-gradient(90deg,#d97706,#fbbf24)}
.bar-rv{background:linear-gradient(90deg,#059669,#34d399)}
.rate-green{color:#059669}
.rate-yellow{color:#d97706}
.rate-red{color:#dc2626}
.bg-green{background:#ecfdf5}
.bg-yellow{background:#fffbeb}
.bg-red{background:#fef2f2}
.expand-btn{padding:3px 10px;font-size:11px;font-weight:600;border:1px solid #dbeafe;border-radius:4px;background:#eff6ff;color:#1e40af;cursor:pointer}
.expand-btn.active{background:#1e40af;color:#fff}
.repeat-badge{margin-left:6px;display:inline-block;padding:1px 6px;border-radius:4px;background:#dc2626;color:#fff;font-size:10px;font-weight:700}
.hidden{display:none}
.flex-between{display:flex;justify-content:space-between;align-items:center}
.mb-16{margin-bottom:16px}
.mb-8{margin-bottom:8px}
.text-muted{color:#64748b;font-size:13px}
.text-sm{font-size:13px}
.fw-600{font-weight:600}
.sort-header{cursor:pointer;user-select:none}
.email-btn{padding:4px 12px;font-size:11px;font-weight:600;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;border:none;color:#fff}
.email-btn-appreciate{background:#059669}
.email-btn-appreciate:hover{background:#047857}
.email-btn-feedback{background:#d97706}
.email-btn-feedback:hover{background:#b45309}
.feedback-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;margin-left:6px}
.feedback-pending{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
.feedback-shared{background:#ecfdf5;color:#059669;border:1px solid #a7f3d0}
.feedback-completed{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0}
.ems-btn{padding:4px 12px;font-size:11px;font-weight:600;border-radius:6px;cursor:pointer;border:none;color:#fff;background:#dc2626}
.ems-btn:hover{background:#b91c1c}
.leadership-section{background:#fff;border-radius:8px;padding:20px;border:1px solid #e2e8f0;margin-bottom:20px;border-left:4px solid #1e40af}
.leadership-table{width:100%;border-collapse:collapse;margin-bottom:16px}
.leadership-table th{text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#fff;background:#1e40af}
.leadership-table td{padding:8px 12px;font-size:13px;border-bottom:1px solid #f1f5f9}
.leadership-table tr:nth-child(even){background:#f8fafc}
.copy-btn{padding:5px 14px;font-size:12px;font-weight:600;border:1px solid #dbeafe;border-radius:6px;background:#eff6ff;color:#1e40af;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.copy-btn:hover{background:#dbeafe}
.export-btn{padding:5px 14px;font-size:12px;font-weight:600;border:1px solid #dbeafe;border-radius:6px;background:#eff6ff;color:#1e40af;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.export-btn:hover{background:#dbeafe}
.toast-msg{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 24px;background:#1e293b;color:#fff;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:opacity .3s ease;pointer-events:none}
.toast-msg.show{opacity:1}
</style>
</head>
<body>
<div id="app"></div>
<script>
// ============================================================================
// EMBEDDED DATA
// ============================================================================
const RAW_DATA = ${dataJson};
const ROLE_MAPPING = ${roleJson};
const PASSWORD_HASHES = ${hashJson};

// Expand compact records to full format
const AUDIT_DATA = RAW_DATA.map(r => ({
  region: r.r,
  transactionWeek: r.w,
  transactionDate: r.d,
  transactionId: r.tid || '',
  associateLogin: r.a,
  supervisorLogin: r.s,
  disruptionType: r.dt,
  adm: r.adm,
  admFinding: r.af || '',
  ra: r.ra,
  raFinding: r.rf || '',
  rrc: r.rrc,
  rrcFinding: r.rrf || '',
  acc: r.acc,
  accFinding: r.acf || '',
  rv: r.rv,
  rvFinding: r.rvf || '',
  comments1: r.c1 || '',
  comments2: r.c2 || '',
  comments3: r.c3 || '',
  comments4: r.c4 || '',
  comments5: r.c5 || '',
  spResponse: r.spr || '',
  spocResponse: r.spc || '',
  defectFlag: r.df
}));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const MONTH_NAMES = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
const ATTRS = [{key:'adm',label:'ADM',fKey:'admFinding',cKey:'comments1'},{key:'ra',label:'RA',fKey:'raFinding',cKey:'comments2'},{key:'rrc',label:'RRC',fKey:'rrcFinding',cKey:'comments3'},{key:'acc',label:'ACC',fKey:'accFinding',cKey:'comments4'},{key:'rv',label:'RV',fKey:'rvFinding',cKey:'comments5'}];
const ATTR_FULL_NAMES = {ADM:'Associate - Decision Making',RA:'SW Adherence- Befitting Action(Right Action)',RRC:'Right Reason Code',ACC:'Accurate & Complete Communication (Information shared with Site)',RV:'Required Validation (Necessary Checks)'};
const ATTR_QUESTIONS = {ADM:'If we have SW was it followed to arrive at the decision to add truck, Cancel truck or deny?',RA:'Was the right action taken as per SW outcome?',RRC:'Was the right reason code used?',ACC:'Was the required information shared with the site (Not applicable for WIMS?)',RV:'Did the associate do all the necessary checks and act accordingly?'};
const ATTR_COLORS = {ADM:'#7c3aed',RA:'#2563eb',RRC:'#dc2626',ACC:'#d97706',RV:'#059669'};
const ATTR_BG = {ADM:'#f5f3ff',RA:'#eff6ff',RRC:'#fef2f2',ACC:'#fffbeb',RV:'#ecfdf5'};
const SHIFT_MAPPING = {ahujadiv:'Night',aksjais:'Afternoon',ancsingh:'Afternoon',aravadev:'Not Active',augubabu:'Afternoon',bharady:'Moved to other process',bossayan:'Morning',hussm:'Not Active',kampatis:'Morning',kurmagad:'Night',mkumrtq:'Morning',mpuranik:'Night',mrinshah:'Night',nmmylava:'Afternoon',nsreerag:'Afternoon',padakank:'Afternoon',sahigour:'Night',sggarimi:'Not Active',srujann:'Moved to other process',subhekum:'Night',thambido:'Morning',vudaths:'Not Active',ynnikith:'Morning'};

function rateColor(rate){if(rate<=5)return'#059669';if(rate<=10)return'#d97706';return'#dc2626';}
function rateBg(rate){if(rate<=5)return'#ecfdf5';if(rate<=10)return'#fffbeb';return'#fef2f2';}
function computeRate(defects,audited){if(audited===0)return 0;return Math.round((defects/audited)*10000)/100;}
function countErrors(r){let c=0;if(r.adm==='No')c++;if(r.ra==='No')c++;if(r.rrc==='No')c++;if(r.acc==='No')c++;if(r.rv==='No')c++;return c;}

function escapeCsv(val){const s=String(val);if(s.includes(',')||s.includes('"')||s.includes('\\n'))return'"'+s.replace(/"/g,'""')+'"';return s;}
function downloadCsv(filename,headers,rows){const csv=[headers.map(escapeCsv).join(','),...rows.map(r=>r.map(escapeCsv).join(','))].join('\\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);}

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================
function computeWeeklySummary(records){
  const map=new Map();
  for(const r of records){
    const e=countErrors(r);
    if(map.has(r.transactionWeek)){const x=map.get(r.transactionWeek);x.totalAudited++;if(r.defectFlag)x.totalDefects++;x.totalErrors+=e;}
    else map.set(r.transactionWeek,{week:r.transactionWeek,totalAudited:1,totalDefects:r.defectFlag?1:0,totalErrors:e});
  }
  return[...map.values()].sort((a,b)=>a.week-b.week);
}

function computeMonthlySummary(records){
  const map=new Map();
  for(const r of records){
    const[y,m]=r.transactionDate.split('-');const key=y+'-'+m;const e=countErrors(r);
    if(map.has(key)){const x=map.get(key);x.totalAudited++;if(r.defectFlag)x.totalDefects++;x.totalErrors+=e;}
    else map.set(key,{month:parseInt(m),year:parseInt(y),totalAudited:1,totalDefects:r.defectFlag?1:0,totalErrors:e});
  }
  return[...map.values()].map(d=>({...d,defectRate:computeRate(d.totalDefects,d.totalAudited)})).sort((a,b)=>a.year-b.year||a.month-b.month);
}

function computeErrorBreakdown(records){
  const counts={ADM:0,RA:0,RRC:0,ACC:0,RV:0};
  for(const r of records){if(r.adm==='No')counts.ADM++;if(r.ra==='No')counts.RA++;if(r.rrc==='No')counts.RRC++;if(r.acc==='No')counts.ACC++;if(r.rv==='No')counts.RV++;}
  return Object.entries(counts).filter(([,c])=>c>0).map(([a,c])=>({attribute:a,count:c})).sort((a,b)=>b.count-a.count);
}

function computeCommonFindingsByWeek(records){
  const weekMap=new Map();
  for(const r of records){
    for(const attr of ATTRS){
      if(r[attr.key]==='No'){
        const f=r[attr.fKey];if(!f)continue;
        const wk=r.transactionWeek;
        if(!weekMap.has(wk))weekMap.set(wk,new Map());
        const attrMap=weekMap.get(wk);
        if(!attrMap.has(attr.label))attrMap.set(attr.label,new Map());
        const fm=attrMap.get(attr.label);fm.set(f,(fm.get(f)||0)+1);
      }
    }
  }
  const result=[];
  for(const[week,attrMap]of weekMap){
    let total=0;const groups=[];
    for(const[attribute,fm]of attrMap){
      const findings=[...fm.entries()].map(([finding,count])=>({finding,count})).sort((a,b)=>b.count-a.count);
      total+=findings.length;groups.push({attribute,findings});
    }
    if(total>0)result.push({week,groups,totalDistinctFindings:total});
  }
  return result.sort((a,b)=>a.week-b.week);
}

function computeAssociateSummaries(records,allRecords){
  const map=new Map();
  for(const r of records){
    if(!map.has(r.associateLogin))map.set(r.associateLogin,{login:r.associateLogin,audits:0,defects:0,errors:[],findings:[]});
    const x=map.get(r.associateLogin);x.audits++;
    if(r.defectFlag)x.defects++;
    for(const attr of ATTRS){if(r[attr.key]==='No'){x.errors.push(attr.label);const f=r[attr.fKey];const c=r[attr.cKey]||'';if(f)x.findings.push({attribute:attr.label,finding:f,comment:c});}}
  }
  const result=[];
  for(const[login,d]of map){
    const rate=computeRate(d.defects,d.audits);
    // Count error attributes
    const attrCount=new Map();
    for(const e of d.errors){attrCount.set(e,(attrCount.get(e)||0)+1);}
    const errorAttributes=[...attrCount.entries()].map(([attribute,count])=>({attribute,count})).sort((a,b)=>b.count-a.count);
    // Top findings
    const fMap=new Map();
    const fComments=new Map();
    for(const f of d.findings){const k=f.attribute+'||'+f.finding;fMap.set(k,(fMap.get(k)||0)+1);if(f.comment&&!fComments.has(k))fComments.set(k,f.comment);}
    const topFindings=[...fMap.entries()].map(([k,count])=>{const[attribute,finding]=k.split('||');return{attribute,finding,count,comment:fComments.get(k)||''};}).sort((a,b)=>b.count-a.count).slice(0,5);
    // Trend
    const weeks=computeWeeklySummary(records.filter(r=>r.associateLogin===login));
    let trend='stable';
    if(weeks.length>=2){const last=weeks[weeks.length-1];const prev=weeks[weeks.length-2];const lr=computeRate(last.totalDefects,last.totalAudited);const pr=computeRate(prev.totalDefects,prev.totalAudited);if(lr<pr)trend='improving';else if(lr>pr)trend='regressing';}
    result.push({associateLogin:login,totalAudits:d.audits,totalDefects:d.defects,defectRate:rate,errorAttributes,topFindings,trend});
  }
  return result.sort((a,b)=>b.defectRate-a.defectRate);
}

function computeRepeatedDefaulters(records){
  // Rolling last 5 weeks
  const allWeeks=[...new Set(records.map(r=>r.transactionWeek))].sort((a,b)=>a-b);
  const last5=allWeeks.slice(-5);
  const filtered=records.filter(r=>last5.includes(r.transactionWeek));
  const map=new Map();
  for(const r of filtered){
    if(!r.defectFlag)continue;
    if(!map.has(r.associateLogin))map.set(r.associateLogin,new Map());
    const wm=map.get(r.associateLogin);wm.set(r.transactionWeek,(wm.get(r.transactionWeek)||0)+1);
  }
  const result=[];
  for(const[login,wm]of map){
    if(wm.size>=3){
      const weeklyDefects=[...wm.entries()].map(([week,defectCount])=>({week,defectCount})).sort((a,b)=>a.week-b.week);
      result.push({associateLogin:login,totalWeeksWithDefects:wm.size,weeklyDefects});
    }
  }
  return result.sort((a,b)=>b.totalWeeksWithDefects-a.totalWeeksWithDefects);
}

function computeWeekSummaryTable(records){
  const weekly=computeWeeklySummary(records);
  if(weekly.length===0)return[];
  const metrics=['Total Audited','Total Defects','Total Errors','Defect Rate (%)'];
  return metrics.map(metric=>({
    metric,
    values:weekly.map(w=>{
      let val;
      if(metric==='Total Audited')val=w.totalAudited;
      else if(metric==='Total Defects')val=w.totalDefects;
      else if(metric==='Total Errors')val=w.totalErrors;
      else val=computeRate(w.totalDefects,w.totalAudited)+'%';
      return{week:w.week,value:val};
    })
  }));
}

function computeLeadershipReport(records, regionFilter, weekFilter) {
  var filtered = records;
  if (regionFilter) filtered = records.filter(function(r) { return r.region === regionFilter; });
  
  var allWeeks = [];
  var weekSet = {};
  for (var wi = 0; wi < filtered.length; wi++) {
    if (!weekSet[filtered[wi].transactionWeek]) { weekSet[filtered[wi].transactionWeek] = true; allWeeks.push(filtered[wi].transactionWeek); }
  }
  allWeeks.sort(function(a, b) { return a - b; });
  var selectedWeeks;
  if (weekFilter === 'all') { selectedWeeks = allWeeks; }
  else if (weekFilter === 'last8') { selectedWeeks = allWeeks.slice(-8); }
  else if (weekFilter && weekFilter !== 'last4' && !isNaN(parseInt(weekFilter))) { selectedWeeks = [parseInt(weekFilter)]; }
  else { selectedWeeks = allWeeks.slice(-4); }
  var last4Records = filtered.filter(function(r) { return selectedWeeks.indexOf(r.transactionWeek) >= 0; });

  // 1. regionSummary: per-region per-week (last 4 weeks)
  var regionMap = new Map();
  for (var i = 0; i < last4Records.length; i++) {
    var rec = last4Records[i];
    if (!regionMap.has(rec.region)) regionMap.set(rec.region, new Map());
    var weekMap = regionMap.get(rec.region);
    if (!weekMap.has(rec.transactionWeek)) weekMap.set(rec.transactionWeek, { audited: 0, defects: 0 });
    var entry = weekMap.get(rec.transactionWeek);
    entry.audited++;
    if (rec.defectFlag) entry.defects++;
  }
  var regionSummary = [];
  for (var regionEntry of regionMap) {
    var region = regionEntry[0];
    var wMap = regionEntry[1];
    var weeks = [];
    for (var wEntry of wMap) {
      var wk = wEntry[0];
      var d = wEntry[1];
      weeks.push({ week: wk, audited: d.audited, defects: d.defects, rate: computeRate(d.defects, d.audited) });
    }
    weeks.sort(function(a, b) { return a.week - b.week; });
    var trend = 'stable';
    if (weeks.length >= 2) {
      var firstRate = weeks[0].rate;
      var lastRate = weeks[weeks.length - 1].rate;
      if (lastRate < firstRate) trend = 'improving';
      else if (lastRate > firstRate) trend = 'regressing';
    }
    regionSummary.push({ region: region, weeks: weeks, trend: trend });
  }
  regionSummary.sort(function(a, b) { return a.region.localeCompare(b.region); });

  // 2. Monthly summary
  var monthMap = new Map();
  for (var mi = 0; mi < filtered.length; mi++) {
    var mr = filtered[mi];
    var parts = mr.transactionDate.split('-');
    var mKey = parts[0] + '-' + parts[1];
    if (!monthMap.has(mKey)) monthMap.set(mKey, { month: parseInt(parts[1]), year: parseInt(parts[0]), audited: 0, defects: 0 });
    var me = monthMap.get(mKey);
    me.audited++;
    if (mr.defectFlag) me.defects++;
  }
  var monthlySummary = [];
  for (var mEntry of monthMap) {
    var md = mEntry[1];
    monthlySummary.push({ month: md.month, year: md.year, audited: md.audited, defects: md.defects, rate: computeRate(md.defects, md.audited) });
  }
  monthlySummary.sort(function(a, b) { return a.year - b.year || a.month - b.month; });

  // 3. Defect-wise breakdown (by attribute, last 4 weeks)
  var defectBreakdown = computeErrorBreakdown(last4Records);

  // 4. Manager-wise performance (rolling 4 weeks)
  var mgrMap = new Map();
  for (var j = 0; j < last4Records.length; j++) {
    var r = last4Records[j];
    if (!mgrMap.has(r.supervisorLogin)) mgrMap.set(r.supervisorLogin, { audited: 0, defects: 0, weekData: new Map() });
    var mge = mgrMap.get(r.supervisorLogin);
    mge.audited++;
    if (r.defectFlag) mge.defects++;
    if (!mge.weekData.has(r.transactionWeek)) mge.weekData.set(r.transactionWeek, { audited: 0, defects: 0 });
    var mwd = mge.weekData.get(r.transactionWeek);
    mwd.audited++;
    if (r.defectFlag) mwd.defects++;
  }
  var managerComparison = [];
  for (var mgEntry of mgrMap) {
    var mgr = mgEntry[0];
    var mgd = mgEntry[1];
    var mgrWeeks = [];
    for (var mwEntry of mgd.weekData) {
      mgrWeeks.push({ week: mwEntry[0], audited: mwEntry[1].audited, defects: mwEntry[1].defects, rate: computeRate(mwEntry[1].defects, mwEntry[1].audited) });
    }
    mgrWeeks.sort(function(a, b) { return a.week - b.week; });
    managerComparison.push({ manager: mgr, audited: mgd.audited, defects: mgd.defects, rate: computeRate(mgd.defects, mgd.audited), weeks: mgrWeeks });
  }
  managerComparison.sort(function(a, b) { return b.rate - a.rate; });

  // 5. repeatedDefaulters
  var rd = computeRepeatedDefaulters(last4Records);
  var repeatedDefaulters = rd.map(function(d) { return { login: d.associateLogin, weeksWithDefects: d.totalWeeksWithDefects }; });

  // 6. bestPractices
  var bestPractices = [
    'Schedule weekly 1:1 coaching sessions with associates who have defect rates above 10%.',
    'Review top error attributes (ADM, RA, RRC) in team huddles to reinforce correct procedures.',
    'Use the EMS portal to formally document repeated performance issues for associates with 3+ weeks of defects.',
    'Recognize and celebrate associates with 0% defect rates to reinforce quality standards.',
    'Cross-train team members on disruption types that show the highest error rates.',
    'Ensure all associates complete the latest SOP refresher training before the next audit cycle.'
  ];

  // 7. Shift-wise performance
  var shiftMap = new Map();
  for (var si = 0; si < last4Records.length; si++) {
    var sr = last4Records[si];
    var shift = SHIFT_MAPPING[sr.supervisorLogin] || 'Unknown';
    if (shift === 'Not Active' || shift === 'Moved to other process') continue;
    if (!shiftMap.has(shift)) shiftMap.set(shift, { audited: 0, defects: 0 });
    var se = shiftMap.get(shift);
    se.audited++;
    if (sr.defectFlag) se.defects++;
  }
  var shiftPerformance = [];
  for (var shEntry of shiftMap) {
    shiftPerformance.push({ shift: shEntry[0], audited: shEntry[1].audited, defects: shEntry[1].defects, rate: computeRate(shEntry[1].defects, shEntry[1].audited) });
  }
  shiftPerformance.sort(function(a, b) { return b.rate - a.rate; });

  // 8. Defect reason trend (week-wise by attribute and finding)
  var reasonTrendMap = new Map();
  for (var dri = 0; dri < last4Records.length; dri++) {
    var drr = last4Records[dri];
    for (var drj = 0; drj < ATTRS.length; drj++) {
      var dra = ATTRS[drj];
      if (drr[dra.key] === 'No') {
        var drf = drr[dra.fKey] || 'No finding recorded';
        var category = (dra.label === 'RRC') ? 'Tool Controllable' : 'Associate Controllable';
        var drKey = category + '||' + dra.label + '||' + drf;
        if (!reasonTrendMap.has(drKey)) reasonTrendMap.set(drKey, new Map());
        var drwm = reasonTrendMap.get(drKey);
        drwm.set(drr.transactionWeek, (drwm.get(drr.transactionWeek) || 0) + 1);
      }
    }
  }
  var defectReasonTrend = [];
  for (var drtEntry of reasonTrendMap) {
    var parts = drtEntry[0].split('||');
    var weekCounts = {};
    var totalCount = 0;
    for (var drtw of drtEntry[1]) { weekCounts[drtw[0]] = drtw[1]; totalCount += drtw[1]; }
    defectReasonTrend.push({ category: parts[0], attribute: parts[1], finding: parts[2], weekCounts: weekCounts, total: totalCount });
  }
  defectReasonTrend.sort(function(a, b) { return a.category.localeCompare(b.category) || a.attribute.localeCompare(b.attribute) || b.total - a.total; });

  // 9. Appeal data
  var appealRaised = 0; var appealAccepted = 0; var appealNotAccepted = 0;
  var appealByWeek = new Map();
  for (var ai = 0; ai < last4Records.length; ai++) {
    var ar = last4Records[ai];
    if (ar.spResponse && ar.spResponse.toLowerCase().indexOf('not aligned') >= 0) {
      appealRaised++;
      if (!appealByWeek.has(ar.transactionWeek)) appealByWeek.set(ar.transactionWeek, { raised: 0, accepted: 0, notAccepted: 0 });
      var aw = appealByWeek.get(ar.transactionWeek); aw.raised++;
      if (ar.spocResponse) {
        if (ar.spocResponse.indexOf('Not Accepted') >= 0) { appealNotAccepted++; aw.notAccepted++; }
        else if (ar.spocResponse.indexOf('Accepted') >= 0) { appealAccepted++; aw.accepted++; }
      }
    }
  }
  var appealWeekData = [];
  for (var awEntry of appealByWeek) { appealWeekData.push({ week: awEntry[0], raised: awEntry[1].raised, accepted: awEntry[1].accepted, notAccepted: awEntry[1].notAccepted }); }
  appealWeekData.sort(function(a, b) { return a.week - b.week; });
  var appealSummary = { raised: appealRaised, accepted: appealAccepted, notAccepted: appealNotAccepted, acceptedPct: appealRaised > 0 ? computeRate(appealAccepted, appealRaised) : 0, weekData: appealWeekData };

  return { regionSummary: regionSummary, monthlySummary: monthlySummary, defectBreakdown: defectBreakdown, managerComparison: managerComparison, repeatedDefaulters: repeatedDefaulters, bestPractices: bestPractices, selectedWeeks: selectedWeeks, shiftPerformance: shiftPerformance, defectReasonTrend: defectReasonTrend, appealSummary: appealSummary };
}

// ============================================================================
// STATE
// ============================================================================
let state={
  user:null, // {login, role}
  currentView:'dashboard', // 'dashboard' | 'rawdata'
  adminTab:'process', // 'process' | 'team'
  filters:{region:'',weekPreset:'last4',selectedWeeks:[],selectedMonth:null},
  rawFilters:{region:'',week:'',month:'',search:'',page:1},
  weekMonthView:'weekly',
  expandedAssociates:new Set(),
  sortKey:'defectRate',
  sortAsc:false,
  leadershipRegion:'',
  leadershipWeek:'last4',
  l5Tab:'managers',
};

// ============================================================================
// AUTH
// ============================================================================
function getUser(){
  const stored=sessionStorage.getItem('dashboard_user');
  if(stored)return JSON.parse(stored);
  return null;
}
function setUser(login){
  const entry=ROLE_MAPPING.find(r=>r.login===login);
  const role=entry?entry.role:'associate';
  const l4managers=entry&&entry.l4managers?entry.l4managers:[];
  const user={login,role,l4managers};
  sessionStorage.setItem('dashboard_user',JSON.stringify(user));
  return user;
}
function logout(){sessionStorage.removeItem('dashboard_user');state.user=null;render();}

// ============================================================================
// FILTER LOGIC
// ============================================================================
function getAvailableWeeks(){return[...new Set(AUDIT_DATA.map(r=>r.transactionWeek))].sort((a,b)=>a-b);}
function getAvailableMonths(){return[...new Set(AUDIT_DATA.map(r=>parseInt(r.transactionDate.split('-')[1])))].sort((a,b)=>a-b);}
function getAvailableRegions(){return[...new Set(AUDIT_DATA.map(r=>r.region))].sort();}

function getFilteredRecords(){
  let records=AUDIT_DATA;
  const{region,selectedWeeks,selectedMonth}=state.filters;
  const user=state.user;
  // Role-based filtering
  if(user.role==='associate'){records=records.filter(r=>r.associateLogin===user.login);}
  else if(user.role==='manager'){records=records.filter(r=>r.supervisorLogin===user.login);}
  else if(user.role==='l5'){
    // L5 sees data for their reporting L4 managers
    const mgrs=user.l4managers||[];
    if(state.l5Tab==='managers'){records=records.filter(r=>mgrs.indexOf(r.supervisorLogin)>=0);}
    else{records=records.filter(r=>mgrs.indexOf(r.supervisorLogin)>=0);}
  }
  else if(user.role==='admin'&&state.adminTab==='team'){records=records.filter(r=>r.supervisorLogin===user.login);}
  // Region
  if(region)records=records.filter(r=>r.region===region);
  // Week/Month
  if(selectedMonth){
    records=records.filter(r=>parseInt(r.transactionDate.split('-')[1])===selectedMonth);
  }else if(selectedWeeks.length>0){
    records=records.filter(r=>selectedWeeks.includes(r.transactionWeek));
  }
  return records;
}

function applyWeekPreset(preset){
  state.filters.weekPreset=preset;
  state.filters.selectedMonth=null;
  const allWeeks=getAvailableWeeks();
  if(preset==='last4')state.filters.selectedWeeks=allWeeks.slice(-4);
  else if(preset==='last8')state.filters.selectedWeeks=allWeeks.slice(-8);
  else if(preset==='all')state.filters.selectedWeeks=[];
  else{
    const wk=parseInt(preset);
    if(!isNaN(wk))state.filters.selectedWeeks=[wk];
  }
}

// Initialize default filter
function initFilters(){
  const allWeeks=getAvailableWeeks();
  state.filters.selectedWeeks=allWeeks.slice(-4);
}

// ============================================================================
// RENDER ENGINE
// ============================================================================
function render(){
  const app=document.getElementById('app');
  state.user=getUser();
  if(!state.user){app.innerHTML=renderLogin();bindLogin();return;}
  if(state.currentView==='rawdata'){app.innerHTML=renderRawData();bindRawData();return;}
  if(state.currentView==='leadership'){const report=computeLeadershipReport(AUDIT_DATA,state.leadershipRegion||'',state.leadershipWeek||'last4');app.innerHTML=renderNav()+'<div class="main">'+renderLeadershipReport(report)+'</div>';bindLeadership();return;}
  if(state.currentView==='glossary'){app.innerHTML=renderNav()+'<div class="main">'+renderGlossary()+'</div>';bindDashboard();return;}
  app.innerHTML=renderDashboard();bindDashboard();
}

// ============================================================================
// LOGIN
// ============================================================================
function renderLogin(){
  return\`<div class="login-wrap"><form class="login-form" id="loginForm">
    <h1>RSOB - Quality Performance Dashboard<br><span style="font-size:14px;color:#64748b;font-weight:400">NA & EU</span></h1>
    <label>Login ID<input type="text" id="loginInput" placeholder="Enter your corporate login ID" autofocus></label>
    <label>Password<input type="password" id="passwordInput" placeholder="Enter your password"></label>
    <div id="loginError" class="login-error hidden"></div>
    <button type="submit">Sign In</button>
    <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:8px">Your login and password determine what data you can see.<br>Contact your admin if you need your password.</p>
  </form></div>\`;
}
async function sha256(message){
  const msgBuffer=new TextEncoder().encode(message);
  const hashBuffer=await crypto.subtle.digest('SHA-256',msgBuffer);
  const hashArray=Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b=>b.toString(16).padStart(2,'0')).join('');
}
function bindLogin(){
  document.getElementById('loginForm').onsubmit=async function(e){
    e.preventDefault();
    const val=document.getElementById('loginInput').value.trim().toLowerCase();
    const pwd=document.getElementById('passwordInput').value;
    if(!val){document.getElementById('loginError').textContent='Login ID is required.';document.getElementById('loginError').classList.remove('hidden');return;}
    if(!pwd){document.getElementById('loginError').textContent='Password is required.';document.getElementById('loginError').classList.remove('hidden');return;}
    // Check if this login exists in the data
    const hasData=AUDIT_DATA.some(r=>r.associateLogin===val||r.supervisorLogin===val);
    const isInRoleMapping=ROLE_MAPPING.some(r=>r.login===val);
    if(!hasData&&!isInRoleMapping){document.getElementById('loginError').textContent='Login not found. Please use your corporate login ID.';document.getElementById('loginError').classList.remove('hidden');return;}
    // Verify password
    const expectedHash=PASSWORD_HASHES[val];
    if(!expectedHash){document.getElementById('loginError').textContent='No password set for this login. Contact admin.';document.getElementById('loginError').classList.remove('hidden');return;}
    const inputHash=await sha256(pwd);
    if(inputHash!==expectedHash){document.getElementById('loginError').textContent='Incorrect password.';document.getElementById('loginError').classList.remove('hidden');return;}
    state.user=setUser(val);
    initFilters();
    state.currentView='glossary';
    render();
  };
}

// ============================================================================
// DASHBOARD
// ============================================================================
function renderDashboard(){
  const user=state.user;
  const records=getFilteredRecords();
  const weekly=computeWeeklySummary(records);
  const monthly=computeMonthlySummary(records);
  const errorBreakdown=computeErrorBreakdown(records);
  const commonFindings=computeCommonFindingsByWeek(records);
  const weekTable=computeWeekSummaryTable(records);
  const associateSummaries=computeAssociateSummaries(records,AUDIT_DATA);
  const repeatedDefaulters=computeRepeatedDefaulters(records);

  let content='';
  // Admin tabs
  if(user.role==='admin'){
    content+=renderAdminTabs();
  }
  // L5 tabs
  if(user.role==='l5'){
    content+=renderL5Tabs();
  }
  // Filter bar
  content+=renderFilterBar();
  // Insights
  content+=renderInsights(weekly,errorBreakdown,repeatedDefaulters,user.role==='associate');
  // Performance summary
  content+=renderPerformanceSummary(weekly,monthly);
  // Week summary table
  content+=renderWeekSummaryTable(weekTable);
  // Trend chart
  if(user.role!=='associate'){
    content+=renderTrendChart(weekly,monthly);
  }
  // L5 Manager view: show L4 managers summary
  if(user.role==='l5'&&state.l5Tab==='managers'){
    var l4Mgrs=user.l4managers||[];
    var mgrSummaries=[];
    for(var mi=0;mi<l4Mgrs.length;mi++){
      var mgrRecords=records.filter(function(r){return r.supervisorLogin===l4Mgrs[mi];});
      var mgrWeekly=computeWeeklySummary(mgrRecords);
      var totalAud=mgrRecords.length;var totalDef=mgrRecords.filter(function(r){return r.defectFlag;}).length;
      mgrSummaries.push({manager:l4Mgrs[mi],audited:totalAud,defects:totalDef,rate:computeRate(totalDef,totalAud),weekly:mgrWeekly});
    }
    content+=renderL5ManagerSummary(mgrSummaries);
  }
  // Associate summary (admin/manager/l5)
  if(user.role!=='associate'){
    content+=renderAssociateSummary(associateSummaries,repeatedDefaulters);
    content+=renderRepeatedDefaulters(repeatedDefaulters);
  }
  // Error breakdown
  content+=renderErrorBreakdown(errorBreakdown);
  // Common findings
  content+=renderCommonFindings(commonFindings);
  // Associate-specific: error detail, best practices
  if(user.role==='associate'){
    content+=renderErrorDetailForAssociate(records);
    content+=renderBestPractices();
  }
  // Best practices for all non-associate roles
  if(user.role!=='associate'){
    content+=renderBestPractices();
  }
  // Raw data note for manager/l5/team view
  if(user.role==='manager'||user.role==='l5'||(user.role==='admin'&&state.adminTab==='team')){
    content+=\`<div class="section" style="text-align:center"><p class="text-muted">Transaction-level detail is available in <a href="#" onclick="state.currentView='rawdata';render();return false;" style="color:#1e40af;font-weight:600;text-decoration:none">View Raw Data</a></p></div>\`;
  }

  return renderNav()+\`<div class="main">\${content}</div>\`;
}

function renderNav(){
  const user=state.user;
  const roleClass=user.role==='l5'?'role-manager':'role-'+user.role;
  const roleLabels={admin:'Admin',manager:'L4 Manager',l5:'L5 Manager',associate:'Associate'};
  const roleLabel=roleLabels[user.role]||user.role;
  const dashActive=state.currentView==='dashboard'?'active':'';
  const rawActive=state.currentView==='rawdata'?'active':'';
  const leaderActive=state.currentView==='leadership'?'active':'';
  const glossaryActive=state.currentView==='glossary'?'active':'';
  var navLinks='<button class="nav-link '+glossaryActive+'" onclick="state.currentView=\\'glossary\\';render()">Glossary</button>';
  navLinks+='<button class="nav-link '+dashActive+'" onclick="state.currentView=\\'dashboard\\';render()">Dashboard</button>';
  navLinks+='<button class="nav-link '+rawActive+'" onclick="state.currentView=\\'rawdata\\';render()">Raw Data</button>';
  if(user.role==='admin'){navLinks+='<button class="nav-link '+leaderActive+'" onclick="state.currentView=\\'leadership\\';render()">Leadership Report</button>';}
  return\`<nav class="nav">
    <div style="display:flex;align-items:center;gap:20px">
      <span class="nav-title">RSOB - Quality Performance Dashboard - NA & EU</span>
      <span style="width:1px;height:20px;background:rgba(255,255,255,.3)"></span>
      \${navLinks}
    </div>
    <div class="nav-right">
      <a href="https://forms.office.com/pages/responsepage.aspx?id=ShCAUi1HOEWczx4dDv6LG_ZtilvFoQpFq5WE5nIo_yBUQUNXNThaTkRIRjFHWlE4MDNKRldCRlpaVy4u&route=shorturl" target="_blank" style="padding:4px 12px;font-size:11px;font-weight:600;border-radius:6px;background:#059669;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:4px">\\uD83D\\uDCDD Feedback</a>
      <span class="role-badge \${roleClass}">\${roleLabel}</span>
      <span class="user-name">\${user.login}</span>
      <button class="logout-btn" onclick="logout()">Logout</button>
    </div>
  </nav>\`;
}

function renderAdminTabs(){
  const pActive=state.adminTab==='process'?'active':'';
  const tActive=state.adminTab==='team'?'active':'';
  return\`<div class="tab-bar"><button class="tab-btn \${pActive}" onclick="state.adminTab='process';render()">Process View</button><button class="tab-btn \${tActive}" onclick="state.adminTab='team';render()">Team View</button></div>\`;
}

function renderL5Tabs(){
  const mActive=state.l5Tab==='managers'?'active':'';
  const aActive=state.l5Tab==='associates'?'active':'';
  return'<div class="tab-bar"><button class="tab-btn '+mActive+'" onclick="state.l5Tab=\\'managers\\';render()">Manager Overview</button><button class="tab-btn '+aActive+'" onclick="state.l5Tab=\\'associates\\';render()">Associate Details</button></div>';
}

function renderL5ManagerSummary(mgrSummaries){
  if(mgrSummaries.length===0)return'<div class="section"><h3>Reporting Managers</h3><p class="text-muted">No manager data available.</p></div>';
  var html='<div class="section"><h3 style="color:#1e40af;margin-bottom:16px">Reporting L4 Managers Performance</h3>';
  html+='<table><thead><tr><th>Manager</th><th style="text-align:center">Total Audits</th><th style="text-align:center">Defects</th><th style="text-align:center">Defect Rate</th><th>Trend</th></tr></thead><tbody>';
  for(var i=0;i<mgrSummaries.length;i++){
    var m=mgrSummaries[i];
    var trend='stable';
    if(m.weekly.length>=2){var f=computeRate(m.weekly[0].totalDefects,m.weekly[0].totalAudited);var l=computeRate(m.weekly[m.weekly.length-1].totalDefects,m.weekly[m.weekly.length-1].totalAudited);if(l<f)trend='improving';else if(l>f)trend='regressing';}
    var tIcon=trend==='improving'?'<span style="color:#059669;font-weight:600">Improving</span>':trend==='regressing'?'<span style="color:#dc2626;font-weight:600">Regressing</span>':'<span style="color:#64748b">Stable</span>';
    html+='<tr><td style="font-weight:600">'+m.manager+'</td><td style="text-align:center">'+m.audited+'</td><td style="text-align:center">'+m.defects+'</td><td style="text-align:center;font-weight:600;color:'+rateColor(m.rate)+'">'+m.rate+'%</td><td>'+tIcon+'</td></tr>';
  }
  html+='</tbody></table>';
  // Bar chart
  html+='<div style="margin-top:16px">';
  for(var j=0;j<mgrSummaries.length;j++){
    var mg=mgrSummaries[j];var barW=Math.min(mg.rate*3,100);
    html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:13px;font-weight:600;color:#475569;width:90px">'+mg.manager+'</span><div style="flex:1;background:#f1f5f9;border-radius:4px;height:22px"><div style="width:'+barW+'%;height:100%;border-radius:4px;background:'+rateColor(mg.rate)+'"></div></div><span style="font-size:13px;font-weight:600;color:'+rateColor(mg.rate)+';width:60px;text-align:right">'+mg.rate+'%</span></div>';
  }
  html+='</div></div>';
  return html;
}

function renderFilterBar(){
  const regions=getAvailableRegions();
  const allWeeks=getAvailableWeeks();
  const months=getAvailableMonths();
  const{region,weekPreset,selectedMonth}=state.filters;
  let regionOpts='<option value="">All Regions</option>'+regions.map(r=>\`<option value="\${r}" \${region===r?'selected':''}>\${r}</option>\`).join('');
  let weekOpts=\`<option value="last4" \${weekPreset==='last4'?'selected':''}>Last 4 Weeks</option><option value="last8" \${weekPreset==='last8'?'selected':''}>Last 8 Weeks</option><option value="all" \${weekPreset==='all'?'selected':''}>All Weeks</option>\`+allWeeks.map(w=>\`<option value="\${w}" \${weekPreset===String(w)?'selected':''}>WK \${w}</option>\`).join('');
  let monthOpts='<option value="">All Months</option>'+months.map(m=>\`<option value="\${m}" \${selectedMonth===m?'selected':''}>\${MONTH_NAMES[m]}</option>\`).join('');
  return\`<div class="filter-bar">
    <span style="font-size:13px;font-weight:600;color:#1e40af">Filters:</span>
    <label>Region: <select id="filterRegion">\${regionOpts}</select></label>
    <label>Weeks: <select id="filterWeeks">\${weekOpts}</select></label>
    <label>Month: <select id="filterMonth">\${monthOpts}</select></label>
  </div>\`;
}

function renderInsights(weekly,errorBreakdown,repeatedDefaulters,personalized){
  const insights=[];
  if(weekly.length>=2){
    const recent=weekly.slice(-4);const first=recent[0];const last=recent[recent.length-1];
    const fr=computeRate(first.totalDefects,first.totalAudited);const lr=computeRate(last.totalDefects,last.totalAudited);
    if(lr<fr)insights.push('Defect rate trending ↓ from '+fr+'% to '+lr+'% over the last '+recent.length+' weeks');
    else if(lr>fr)insights.push('Defect rate trending ↑ from '+fr+'% to '+lr+'% over the last '+recent.length+' weeks');
    else insights.push('Defect rate stable at '+lr+'% over the last '+recent.length+' weeks');
  }else if(weekly.length===1){insights.push('Current defect rate: '+computeRate(weekly[0].totalDefects,weekly[0].totalAudited)+'%');}
  if(errorBreakdown.length>0){const total=errorBreakdown.reduce((s,a)=>s+a.count,0);const top=errorBreakdown[0];const pct=total>0?Math.round(top.count/total*100):0;insights.push('Top defect category: '+top.attribute+' ('+pct+'% of all errors)');}
  if(!personalized&&repeatedDefaulters.length>0)insights.push(repeatedDefaulters.length+' associate'+(repeatedDefaulters.length!==1?'s':'')+' with repeated defects across 3+ weeks');
  if(weekly.length>0){const ta=weekly.reduce((s,w)=>s+w.totalAudited,0);const td=weekly.reduce((s,w)=>s+w.totalDefects,0);insights.push(ta+' total audits, '+td+' defects ('+computeRate(td,ta)+'% overall rate)');}
  if(insights.length===0)return'';
  return\`<div class="section-insight"><h3 style="color:#1e40af;font-size:15px">💡 \${personalized?'Your Insights':'Key Insights'}</h3><ul style="padding-left:20px;list-style:disc">\${insights.map(t=>'<li style="font-size:13px;margin-bottom:6px;line-height:1.5">'+t+'</li>').join('')}</ul></div>\`;
}

function renderPerformanceSummary(weekly,monthly){
  const view=state.weekMonthView;
  const items=view==='weekly'?weekly.map(w=>({label:'Week '+w.week,audited:w.totalAudited,defects:w.totalDefects,errors:w.totalErrors,rate:computeRate(w.totalDefects,w.totalAudited)})):monthly.map(m=>({label:MONTH_NAMES[m.month]+' '+m.year,audited:m.totalAudited,defects:m.totalDefects,errors:m.totalErrors,rate:m.defectRate}));
  const ta=items.reduce((s,i)=>s+i.audited,0);const td=items.reduce((s,i)=>s+i.defects,0);const te=items.reduce((s,i)=>s+i.errors,0);const or=computeRate(td,ta);
  let cards=\`<div class="card" style="border-top:3px solid #1e40af"><div class="card-label">Total Audited</div><div class="card-value">\${ta}</div></div>
    <div class="card" style="border-top:3px solid #dc2626"><div class="card-label">Total Defects</div><div class="card-value">\${td}</div></div>
    <div class="card" style="border-top:3px solid #d97706"><div class="card-label">Total Errors</div><div class="card-value">\${te}</div></div>
    <div class="card" style="border-top:3px solid #059669"><div class="card-label">Defect Rate</div><div class="card-value" style="color:\${rateColor(or)}">\${or}%</div></div>\`;
  let periodCards=items.map(i=>\`<div class="card" style="border-left:3px solid \${rateColor(i.rate)==='#059669'?'#1e40af':rateColor(i.rate)};min-width:160px"><div style="font-size:13px;font-weight:600;margin-bottom:8px">\${i.label}</div><div style="font-size:12px;color:#64748b">Audited: \${i.audited} · Defects: \${i.defects}</div><div style="font-size:18px;font-weight:700;color:\${rateColor(i.rate)};margin-top:4px">\${i.rate}%</div></div>\`).join('');
  return\`<div class="section"><div class="toggle-group"><button class="toggle-btn \${view==='weekly'?'active':''}" onclick="state.weekMonthView='weekly';render()">Weekly</button><button class="toggle-btn \${view==='monthly'?'active':''}" onclick="state.weekMonthView='monthly';render()">Monthly</button></div><div class="card-row">\${cards}</div><div class="card-row">\${periodCards}</div></div>\`;
}

function renderWeekSummaryTable(rows){
  if(rows.length===0||rows[0].values.length===0)return'<div class="section"><h3>Week-wise Summary</h3><p class="text-muted">No weekly data available.</p></div>';
  const weeks=rows[0].values.map(v=>v.week);
  const csvId='csvWeekSummary';
  let thead='<th style="text-align:left">Metric</th>'+weeks.map(w=>'<th style="text-align:center">WK '+w+'</th>').join('');
  let tbody=rows.map((row,ri)=>{
    const isRate=row.metric.toLowerCase().includes('rate');
    let cells='<td style="font-weight:600;text-align:left">'+row.metric+'</td>';
    cells+=row.values.map(v=>{
      const val=String(v.value);const num=parseFloat(val);
      const style=isRate?'font-weight:600;color:'+rateColor(num)+';background:'+rateBg(num):'';
      return'<td style="text-align:center;'+style+'">'+val+'</td>';
    }).join('');
    return'<tr>'+cells+'</tr>';
  }).join('');
  return\`<div class="section"><div class="flex-between mb-16"><h3>Week-wise Summary</h3><button class="csv-btn" onclick="downloadWeekSummary()">📥 Download CSV</button></div><div style="overflow-x:auto"><table><thead><tr>\${thead}</tr></thead><tbody>\${tbody}</tbody></table></div></div>\`;
}

function renderTrendChart(weekly,monthly){
  const weeklyRates=weekly.map(w=>({label:'Wk '+w.week,rate:computeRate(w.totalDefects,w.totalAudited)}));
  const monthlyRates=monthly.map(m=>({label:MONTH_NAMES[m.month]+' '+m.year,rate:m.defectRate}));
  function trendIcon(prev,curr){if(curr<prev)return'<span style="color:#059669;font-weight:600">↓</span>';if(curr>prev)return'<span style="color:#dc2626;font-weight:600">↑</span>';return'<span style="color:#64748b">—</span>';}
  function buildTable(rates,title){
    if(rates.length===0)return'<p class="text-muted">No data available.</p>';
    let rows=rates.map((item,idx)=>{
      const prev=idx>0?rates[idx-1].rate:null;
      const trend=prev!==null?trendIcon(prev,item.rate):'—';
      return\`<tr><td>\${item.label}</td><td style="font-weight:600;color:\${rateColor(item.rate)}">\${item.rate}%</td>\${rates.length>=2?'<td>'+trend+'</td>':''}</tr>\`;
    }).join('');
    return\`<table><thead><tr><th>Period</th><th>Defect Rate</th>\${rates.length>=2?'<th>Trend</th>':''}</tr></thead><tbody>\${rows}</tbody></table>\`;
  }
  return\`<div class="section section-blue"><h3>Defect Rate Trends</h3><div style="display:flex;gap:24px;flex-wrap:wrap"><div style="flex:1 1 300px"><h4 style="font-size:14px;font-weight:600;color:#1e40af;margin-bottom:8px">Week-over-Week</h4>\${buildTable(weeklyRates,'Weekly')}</div><div style="flex:1 1 300px"><h4 style="font-size:14px;font-weight:600;color:#1e40af;margin-bottom:8px">Month-over-Month</h4>\${buildTable(monthlyRates,'Monthly')}</div></div></div>\`;
}

function renderAssociateSummary(summaries,repeatedDefaulters){
  if(summaries.length===0)return'<div class="section"><h3>Associate-wise Summary</h3><p class="text-muted">No associate data available.</p></div>';
  const defaulterSet=new Set(repeatedDefaulters.map(d=>d.associateLogin));
  const isManagerOrAdmin=state.user.role!=='associate';
  const sorted=[...summaries].sort((a,b)=>{
    if(state.sortKey==='associateLogin')return state.sortAsc?a.associateLogin.localeCompare(b.associateLogin):b.associateLogin.localeCompare(a.associateLogin);
    return state.sortAsc?a[state.sortKey]-b[state.sortKey]:b[state.sortKey]-a[state.sortKey];
  });
  const sortInd=(key)=>state.sortKey===key?(state.sortAsc?' ▲':' ▼'):'';
  // Determine current/most recent week and selected week for feedback tracking
  const allDataWeeks=getAvailableWeeks();
  const mostRecentWeek=allDataWeeks.length>0?allDataWeeks[allDataWeeks.length-1]:0;
  const selectedWeeks=state.filters.selectedWeeks;
  const currentWeek=selectedWeeks.length>0?Math.max(...selectedWeeks):mostRecentWeek;
  const isCurrentWeek=currentWeek===mostRecentWeek;
  // Initialize feedback tracker for manager/admin
  if(isManagerOrAdmin&&currentWeek>=15){
    const associateLogins=summaries.map(function(s){return s.associateLogin;});
    initFeedbackTracker(state.user.login,currentWeek,associateLogins);
  }
  var feedbackStatus=isManagerOrAdmin&&currentWeek>=15?getFeedbackStatus(state.user.login,currentWeek):{};
  const colSpan=isManagerOrAdmin?9:7;
  let rows=sorted.map((row,idx)=>{
    const isDefaulter=defaulterSet.has(row.associateLogin);
    const isExpanded=state.expandedAssociates.has(row.associateLogin);
    const trendIcons={improving:{icon:'↓',color:'#059669'},regressing:{icon:'↑',color:'#dc2626'},stable:{icon:'—',color:'#64748b'}};
    const t=trendIcons[row.trend]||trendIcons.stable;
    const rowBg=isDefaulter?'background:#fef2f2':'';
    const badges=row.errorAttributes.slice(0,3).map(a=>'<span class="badge badge-'+a.attribute.toLowerCase()+'">'+a.attribute+'('+a.count+')</span>').join('');
    const expandBtn=row.topFindings.length>0?\`<button class="expand-btn \${isExpanded?'active':''}" onclick="toggleAssociate('\${row.associateLogin}')">\${isExpanded?'Hide':'Show'} Findings</button>\`:'<span style="color:#94a3b8;font-size:11px">—</span>';
    // Actions column content
    var actionsCell='';
    if(isManagerOrAdmin){
      if(row.defectRate===0){
        actionsCell='<button class="email-btn email-btn-appreciate" onclick="sendEmail(\\'appreciate\\',\\''+row.associateLogin+'\\')">Appreciate ✉</button>';
      }else{
        actionsCell='<button class="email-btn email-btn-feedback" onclick="sendEmail(\\'feedback\\',\\''+row.associateLogin+'\\')">Feedback ✉</button>';
      }
    }
    // Status column content
    var statusCell='';
    if(isManagerOrAdmin){
      if(currentWeek<15){
        statusCell='\\u2014';
      }else if(!isCurrentWeek){
        statusCell='<span class="feedback-badge feedback-completed">Completed</span>';
      }else{
        var assocStatus=feedbackStatus[row.associateLogin]||'Pending';
        if(assocStatus==='Shared'){
          statusCell='<span class="feedback-badge feedback-shared">Shared</span>';
        }else{
          statusCell='<span class="feedback-badge feedback-pending">Pending</span>';
        }
      }
    }
    let html=\`<tr style="\${rowBg}"><td>\${row.associateLogin}\${isDefaulter?'<span class="repeat-badge">REPEAT</span>':''}</td><td>\${row.totalAudits}</td><td style="font-weight:600">\${row.totalDefects}</td><td style="font-weight:600;color:\${rateColor(row.defectRate)};background:\${rateBg(row.defectRate)}">\${row.defectRate}%</td><td>\${badges}</td><td style="font-weight:600;color:\${t.color}">\${t.icon}</td><td>\${expandBtn}</td>\`;
    if(isManagerOrAdmin){
      html+=\`<td>\${actionsCell}</td><td>\${statusCell}</td>\`;
    }
    html+='</tr>';
    if(isExpanded&&row.topFindings.length>0){
      const findingsHtml=row.topFindings.map(f=>{
        const isOthers=f.finding.toLowerCase()==='others';
        const commentHtml=isOthers&&f.comment?'<div style="font-size:11px;color:#64748b;margin-top:4px;padding:4px 8px;background:#f8fafc;border-radius:4px;border-left:2px solid #94a3b8">RQM Comments: '+f.comment+'</div>':'';
        return\`<div style="display:flex;flex-direction:column;gap:4px;padding:6px 10px;border-radius:6px;background:#fff;border:1px solid #e2e8f0"><div style="display:flex;align-items:flex-start;gap:8px"><span class="badge badge-\${f.attribute.toLowerCase()}" style="flex-shrink:0">\${f.attribute}</span><span style="font-size:12px;color:#334155;flex:1">\${f.finding}</span><span style="font-size:11px;color:#94a3b8;flex-shrink:0">\${f.count}x</span></div>\${commentHtml}</div>\`;
      }).join('');
      html+=\`<tr style="background:#f8fafc"><td colspan="\${colSpan}" style="padding:12px 20px;border-bottom:1px solid #e2e8f0"><div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:8px">Top Auditor Findings for \${row.associateLogin}:</div><div style="display:flex;flex-direction:column;gap:6px">\${findingsHtml}</div></td></tr>\`;
    }
    return html;
  }).join('');
  var actionsHeader=isManagerOrAdmin?'<th>Actions</th><th>Status</th>':'';
  return\`<div class="section"><div class="flex-between mb-16"><h3>Associate-wise Summary</h3><button class="csv-btn" onclick="downloadAssociateSummary()">📥 Download CSV</button></div><p class="text-muted mb-8">\${summaries.length} associates · \${summaries.reduce((s,r)=>s+r.totalAudits,0)} total audits</p><div style="overflow-x:auto"><table><thead><tr><th class="sort-header" onclick="sortAssociates('associateLogin')">Associate\${sortInd('associateLogin')}</th><th class="sort-header" onclick="sortAssociates('totalAudits')">Total Audits\${sortInd('totalAudits')}</th><th class="sort-header" onclick="sortAssociates('totalDefects')">Defects\${sortInd('totalDefects')}</th><th class="sort-header" onclick="sortAssociates('defectRate')">Defect Rate\${sortInd('defectRate')}</th><th>Top Errors</th><th>Trend</th><th>Details</th>\${actionsHeader}</tr></thead><tbody>\${rows}</tbody></table></div></div>\`;
}

function renderRepeatedDefaulters(defaulters){
  if(defaulters.length===0)return\`<div class="section section-red"><h3 style="color:#dc2626">Repeated Defaulters</h3><p class="text-muted">No repeated defaulters found — great team performance!</p></div>\`;
  const isManagerOrAdmin=state.user.role!=='associate';
  const allWeeks=[...new Set(defaulters.flatMap(d=>d.weeklyDefects.map(w=>w.week)))].sort((a,b)=>a-b);
  let thead='<th style="text-align:left">Associate</th><th>Weeks</th>'+allWeeks.map(w=>'<th>WK '+w+'</th>').join('');
  if(isManagerOrAdmin)thead+='<th>Actions</th>';
  let tbody=defaulters.map(d=>{
    const weekMap=new Map(d.weeklyDefects.map(w=>[w.week,w.defectCount]));
    let cells='<td style="text-align:left;font-weight:600">'+d.associateLogin+'</td><td style="font-weight:600;color:#dc2626">'+d.totalWeeksWithDefects+'</td>';
    cells+=allWeeks.map(w=>{const c=weekMap.get(w)||0;return'<td style="font-weight:'+(c>0?'600':'400')+';color:'+(c>0?'#dc2626':'#94a3b8')+'">'+(c>0?c:'—')+'</td>';}).join('');
    if(isManagerOrAdmin){
      cells+='<td><button class="ems-btn" onclick="openEmsLink(\\''+d.associateLogin+'\\')">EMS</button></td>';
    }
    return'<tr style="background:#fef2f2">'+cells+'</tr>';
  }).join('');
  return\`<div class="section section-red"><div class="flex-between mb-8"><h3 style="color:#dc2626">Repeated Defaulters</h3><button class="csv-btn" onclick="downloadDefaulters()">📥 Download CSV</button></div><p class="text-muted mb-16">Associates with defects in 3 or more of the last 5 weeks (rolling)</p><div style="overflow-x:auto"><table><thead><tr>\${thead}</tr></thead><tbody>\${tbody}</tbody></table></div></div>\`;
}

function renderErrorBreakdown(breakdown){
  if(breakdown.length===0)return'<div class="section"><h3>Error Attribute Breakdown</h3><p class="text-muted">No errors recorded.</p></div>';
  const total=breakdown.reduce((s,a)=>s+a.count,0);
  const max=breakdown[0].count;
  let rows=breakdown.map((entry,idx)=>{
    const pct=total>0?Math.round(entry.count/total*10000)/100:0;
    const barWidth=max>0?(entry.count/max*100):0;
    return\`<tr><td style="font-weight:600;color:\${ATTR_COLORS[entry.attribute]||'#3b82f6'}" title="\${entry.attribute}">\${entry.attribute}</td><td>\${entry.count}</td><td>\${pct}%</td><td><div class="bar bar-\${entry.attribute.toLowerCase()}" style="width:\${barWidth}%"></div></td></tr>\`;
  }).join('');
  return\`<div class="section"><div class="flex-between mb-16"><h3>Error Attribute Breakdown</h3><button class="csv-btn" onclick="downloadErrorBreakdown()">📥 Download CSV</button></div><table><thead><tr><th>Attribute</th><th>Count</th><th>%</th><th style="width:40%">Frequency</th></tr></thead><tbody>\${rows}</tbody></table></div>\`;
}

function renderCommonFindings(weekFindings){
  if(weekFindings.length===0)return'<div class="section"><h3>Common Findings</h3><p class="text-muted">No errors recorded — great work!</p></div>';
  // Build a flat table: Week | Attribute | Finding | Count
  var tableRows=[];
  for(var wi=0;wi<weekFindings.length;wi++){
    var wf=weekFindings[wi];
    for(var gi=0;gi<wf.groups.length;gi++){
      var g=wf.groups[gi];
      var color=ATTR_COLORS[g.attribute]||'#475569';
      var bg=ATTR_BG[g.attribute]||'#f1f5f9';
      for(var fi=0;fi<g.findings.length;fi++){
        var f=g.findings[fi];
        tableRows.push('<tr><td style="text-align:center;font-weight:600">WK '+wf.week+'</td><td><span style="padding:2px 8px;border-radius:4px;background:'+bg+';color:'+color+';font-size:11px;font-weight:700">'+g.attribute+'</span> '+(ATTR_FULL_NAMES[g.attribute]||'')+'</td><td style="font-size:12px;color:#334155">'+f.finding+'</td><td style="text-align:center;font-weight:600">'+f.count+'</td></tr>');
      }
    }
  }
  var totalDistinct=weekFindings.reduce(function(s,wf){return s+wf.totalDistinctFindings;},0);
  return\`<div class="section"><div class="flex-between mb-8"><h3>Common Findings</h3><button class="csv-btn" onclick="downloadCommonFindings()">📥 Download CSV</button></div><p class="text-muted mb-16">\${totalDistinct} distinct finding\${totalDistinct!==1?'s':''} across all attributes</p><div style="overflow-x:auto"><table><thead><tr><th style="text-align:center">Week</th><th>Attribute</th><th>Finding</th><th style="text-align:center">Count</th></tr></thead><tbody>\${tableRows.join('')}</tbody></table></div></div>\`;
}

function renderErrorDetailForAssociate(records){
  const errorRecords=records.filter(r=>countErrors(r)>0);
  if(errorRecords.length===0)return'<div class="section"><h3>Error Details</h3><p class="text-muted">No errors found — keep up the great work!</p></div>';
  let rows=errorRecords.sort((a,b)=>b.transactionWeek-a.transactionWeek).map(r=>{
    const attrs=[];const findings=[];
    for(const attr of ATTRS){if(r[attr.key]==='No'){attrs.push(attr.label);const f=r[attr.fKey];if(f)findings.push(attr.label+': '+f);}}
    return\`<tr><td>WK \${r.transactionWeek}</td><td>\${r.transactionDate}</td><td>\${r.disruptionType}</td><td>\${attrs.map(a=>'<span class="badge badge-'+a.toLowerCase()+'">'+a+'</span>').join('')}</td><td style="font-size:11px;color:#64748b;white-space:normal;max-width:300px">\${findings.join('; ')||'—'}</td></tr>\`;
  }).join('');
  return\`<div class="section"><h3 style="margin-bottom:16px">Error Details</h3><div style="overflow-x:auto"><table><thead><tr><th>Week</th><th>Date</th><th>Disruption</th><th>Failed Attributes</th><th>Findings</th></tr></thead><tbody>\${rows}</tbody></table></div></div>\`;
}

function renderBestPractices(){
  return\`<div class="section" style="border-left:4px solid #059669"><h3 style="color:#059669">💡 Best Practices</h3><ul style="padding-left:20px;list-style:disc;font-size:13px;color:#334155;line-height:1.8">
    <li>Always verify CARS tool output before proceeding with cancellation</li>
    <li>Select the correct reason code as per CASA SOP guidelines</li>
    <li>Check for Central Dock Approval login when required</li>
    <li>Annotate SSP/RFFV data correctly after each action</li>
    <li>Reach out to team leader when CARS tool does not show output</li>
    <li>Transfer non-volume driven requests to the correct queue</li>
  </ul></div>\`;
}

// ============================================================================
// GLOSSARY
// ============================================================================
function renderGlossary(){
  // --- Section 1: Quality Parameters Visual Cards ---
  var cardsHtml='';
  var attrDescriptions={
    ADM:'Evaluates whether the associate followed the Standard Work (SW) to make the correct decision — add truck, cancel truck, or deny the request.',
    RA:'Checks if the associate took the correct action as per the SW outcome. This includes proper annotation of RS tool validator details and using the latest tool version.',
    RRC:'Verifies that the associate selected the correct reason code while resolving or cancelling a case. Incorrect codes lead to misreporting and downstream issues.',
    ACC:'Assesses whether all required information was accurately and completely shared with the site. Not applicable for WIMS cases.',
    RV:'Confirms the associate performed all necessary validation checks (e.g., CPT, VRID, shipment status) before taking action.'
  };
  var attrImpact={
    ADM:'Incorrect decisions can lead to unnecessary truck additions or missed cancellations, impacting cost and SLA.',
    RA:'Wrong actions result in unresolved disruptions, repeated contacts, and customer impact.',
    RRC:'Wrong reason codes corrupt reporting data, making it harder to identify systemic issues.',
    ACC:'Incomplete communication causes site confusion, delays, and repeat disruptions.',
    RV:'Skipping validations leads to premature or incorrect actions on cases.'
  };
  for(var i=0;i<ATTRS.length;i++){
    var a=ATTRS[i];
    var color=ATTR_COLORS[a.label]||'#475569';
    var bg=ATTR_BG[a.label]||'#f1f5f9';
    // Calculate current error count for this attribute
    var allWeeks=getAvailableWeeks();
    var last4=allWeeks.slice(-4);
    var recentRecs=AUDIT_DATA.filter(function(r){return last4.indexOf(r.transactionWeek)>=0;});
    var errCount=0;
    for(var j=0;j<recentRecs.length;j++){if(recentRecs[j][a.key]==='No')errCount++;}
    var errRate=(errCount/recentRecs.length*100).toFixed(1);
    cardsHtml+='<div style="background:'+bg+';border-radius:12px;padding:20px;border-left:5px solid '+color+';margin-bottom:16px">';
    cardsHtml+='<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">';
    cardsHtml+='<div style="flex:1;min-width:280px">';
    cardsHtml+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="padding:4px 14px;border-radius:6px;background:'+color+';color:#fff;font-size:14px;font-weight:700">'+a.label+'</span><span style="font-size:15px;font-weight:600;color:#1e293b">'+ATTR_FULL_NAMES[a.label]+'</span></div>';
    cardsHtml+='<p style="font-size:13px;color:#334155;margin-bottom:8px;line-height:1.5">'+attrDescriptions[a.label]+'</p>';
    cardsHtml+='<p style="font-size:12px;color:#64748b;margin-bottom:6px"><strong>Audit Question:</strong> '+ATTR_QUESTIONS[a.label]+'</p>';
    cardsHtml+='<p style="font-size:12px;color:#64748b"><strong>Business Impact:</strong> '+attrImpact[a.label]+'</p>';
    cardsHtml+='</div>';
    cardsHtml+='<div style="text-align:center;min-width:100px;padding:12px 16px;background:#fff;border-radius:8px;border:1px solid '+color+'33">';
    cardsHtml+='<div style="font-size:11px;color:#64748b;margin-bottom:4px">Last 4 Weeks</div>';
    cardsHtml+='<div style="font-size:22px;font-weight:700;color:'+color+'">'+errCount+'</div>';
    cardsHtml+='<div style="font-size:11px;color:#64748b">errors ('+errRate+'%)</div>';
    cardsHtml+='</div></div></div>';
  }

  // --- Section 2: Scoring Methodology ---
  var scoringHtml='<div class="section" style="border-left:4px solid #1e40af;margin-bottom:20px">';
  scoringHtml+='<h3 style="color:#1e40af;margin-bottom:12px">\\uD83D\\uDCCA Scoring Methodology</h3>';
  scoringHtml+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px">';
  scoringHtml+='<div style="padding:12px;background:#f8fafc;border-radius:8px"><strong style="font-size:13px">Defect Detection</strong><p style="font-size:12px;color:#475569;margin-top:4px">Overall% column: 100% (1.0) = No defect. Below 100% = Defect present. Each transaction = 1 audit count.</p></div>';
  scoringHtml+='<div style="padding:12px;background:#f8fafc;border-radius:8px"><strong style="font-size:13px">Defect Rate Formula</strong><p style="font-size:12px;color:#475569;margin-top:4px">(Audits with Defects \\u00F7 Total Audits) \\u00D7 100</p></div>';
  scoringHtml+='<div style="padding:12px;background:#f8fafc;border-radius:8px"><strong style="font-size:13px">Color Coding</strong><p style="font-size:12px;color:#475569;margin-top:4px"><span style="color:#059669">\\u25CF Green \\u2264 5%</span> &nbsp; <span style="color:#d97706">\\u25CF Yellow 5-10%</span> &nbsp; <span style="color:#dc2626">\\u25CF Red > 10%</span></p></div>';
  scoringHtml+='<div style="padding:12px;background:#f8fafc;border-radius:8px"><strong style="font-size:13px">Repeated Defaulter</strong><p style="font-size:12px;color:#475569;margin-top:4px">Associate with defects in 3 or more weeks out of the rolling last 5 weeks.</p></div>';
  scoringHtml+='</div></div>';

  // --- Section 3: Actions & Impact (W14 spike and improvement) ---
  var actionsHtml='<div class="section" style="border-left:4px solid #059669;margin-bottom:20px">';
  actionsHtml+='<h3 style="color:#059669;margin-bottom:12px">\\uD83D\\uDE80 Actions & Impact — Quality Improvement Journey</h3>';
  actionsHtml+='<p class="text-muted mb-16">Analysis of defect trend from Week 12-18 and actions that drove significant improvement.</p>';
  // Trend visual
  actionsHtml+='<div style="display:flex;align-items:flex-end;gap:8px;margin-bottom:20px;padding:16px;background:#f8fafc;border-radius:8px">';
  var trendData=[{wk:12,rate:7.1},{wk:13,rate:7.0},{wk:14,rate:7.2},{wk:15,rate:4.0},{wk:16,rate:4.9},{wk:18,rate:2.5}];
  for(var ti=0;ti<trendData.length;ti++){
    var td=trendData[ti];
    var barH=Math.max(td.rate*8,10);
    var barColor=td.rate>7?'#dc2626':td.rate>5?'#d97706':'#059669';
    actionsHtml+='<div style="display:flex;flex-direction:column;align-items:center;flex:1">';
    actionsHtml+='<span style="font-size:11px;font-weight:700;color:'+barColor+';margin-bottom:4px">'+td.rate+'%</span>';
    actionsHtml+='<div style="width:100%;max-width:50px;height:'+barH+'px;background:'+barColor+';border-radius:4px 4px 0 0;opacity:0.85"></div>';
    actionsHtml+='<span style="font-size:11px;color:#64748b;margin-top:4px">WK'+td.wk+'</span>';
    actionsHtml+='</div>';
  }
  actionsHtml+='</div>';
  // Root cause for W12-14 high trend
  actionsHtml+='<div style="margin-bottom:16px;padding:14px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca">';
  actionsHtml+='<strong style="color:#dc2626;font-size:13px">\\u26A0\\uFE0F Why were Weeks 12-14 high? (7.0-7.2%)</strong>';
  actionsHtml+='<ul style="font-size:12px;color:#334155;margin-top:8px;padding-left:20px;line-height:1.8">';
  actionsHtml+='<li><strong>RA errors spiked</strong> — Associates not annotating RS tool validator details (6 cases in WK14 alone)</li>';
  actionsHtml+='<li><strong>RRC errors elevated</strong> — Wrong cancel reason codes (4 cases WK14) + wrong resolve codes (3 cases WK14)</li>';
  actionsHtml+='<li><strong>NA region</strong> hit 7.8% in WK14 with concentrated errors in reason code selection</li>';
  actionsHtml+='<li><strong>Root cause:</strong> New SOP updates were rolled out in WK11 but associates were still using old workflows</li>';
  actionsHtml+='</ul></div>';
  // Actions taken
  actionsHtml+='<div style="margin-bottom:16px;padding:14px;background:#eff6ff;border-radius:8px;border:1px solid #93c5fd">';
  actionsHtml+='<strong style="color:#1e40af;font-size:13px">\\uD83D\\uDEE0\\uFE0F Actions Introduced (Post Week 14)</strong>';
  actionsHtml+='<ul style="font-size:12px;color:#334155;margin-top:8px;padding-left:20px;line-height:1.8">';
  actionsHtml+='<li><strong>RS Tool Validator Refresher</strong> — Mandatory training session for all associates on proper annotation steps</li>';
  actionsHtml+='<li><strong>Reason Code Decision Tree</strong> — Visual flowchart distributed mapping disruption types to correct reason codes</li>';
  actionsHtml+='<li><strong>Daily Pre-shift Huddles</strong> — 5-min quality focus in every shift handover reviewing top errors from previous day</li>';
  actionsHtml+='<li><strong>1:1 Coaching for Repeated Defaulters</strong> — Targeted sessions for associates with 3+ weeks of defects</li>';
  actionsHtml+='<li><strong>Quality Dashboard Launch</strong> — Self-service visibility for all associates and managers to track their own performance</li>';
  actionsHtml+='<li><strong>Weekly Error Pattern Sharing</strong> — Top 3 errors shared via team communication channels every Monday</li>';
  actionsHtml+='</ul></div>';
  // Impact
  actionsHtml+='<div style="padding:14px;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0">';
  actionsHtml+='<strong style="color:#059669;font-size:13px">\\u2705 Impact Achieved (Week 15-18)</strong>';
  actionsHtml+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px">';
  actionsHtml+='<div style="text-align:center;padding:10px;background:#fff;border-radius:6px"><div style="font-size:20px;font-weight:700;color:#059669">7.2% \\u2192 2.5%</div><div style="font-size:11px;color:#64748b">Overall Defect Rate (WK14\\u2192WK18)</div></div>';
  actionsHtml+='<div style="text-align:center;padding:10px;background:#fff;border-radius:6px"><div style="font-size:20px;font-weight:700;color:#059669">-65%</div><div style="font-size:11px;color:#64748b">Defect Rate Reduction</div></div>';
  actionsHtml+='<div style="text-align:center;padding:10px;background:#fff;border-radius:6px"><div style="font-size:20px;font-weight:700;color:#059669">-56%</div><div style="font-size:11px;color:#64748b">RRC Errors (NA Region)</div></div>';
  actionsHtml+='<div style="text-align:center;padding:10px;background:#fff;border-radius:6px"><div style="font-size:20px;font-weight:700;color:#059669">4 \\u2192 0</div><div style="font-size:11px;color:#64748b">RA Errors in WK18</div></div>';
  actionsHtml+='</div></div>';
  actionsHtml+='</div>';

  // --- Combine all sections ---
  var html='<div style="margin-bottom:24px"><h2 style="font-size:20px;color:#1e293b;margin-bottom:4px">\\uD83D\\uDCD6 Quality Parameters & Glossary</h2><p class="text-muted">Understanding the 5 quality attributes that define audit performance in RSOB.</p></div>';
  html+=cardsHtml;
  html+=scoringHtml;
  html+=actionsHtml;
  return html;
}

// ============================================================================
// LEADERSHIP REPORT RENDERING
// ============================================================================
function renderLeadershipReport(report) {
  if (!report.regionSummary.length && !report.managerComparison.length) {
    return '<div class="leadership-section"><h3>Leadership Analysis Report</h3><p class="text-muted">No data available for leadership report.</p></div>';
  }
  var html = '';
  // Region filter bar
  var regions = getAvailableRegions();
  var regionOpts = '<option value="">All Regions (Consolidated)</option>';
  for (var roi = 0; roi < regions.length; roi++) {
    regionOpts += '<option value="' + regions[roi] + '"' + (state.leadershipRegion === regions[roi] ? ' selected' : '') + '>' + regions[roi] + '</option>';
  }
  var lWeeks = getAvailableWeeks();
  var weekOpts = '<option value="last4"' + (state.leadershipWeek === 'last4' ? ' selected' : '') + '>Last 4 Weeks</option>';
  weekOpts += '<option value="last8"' + (state.leadershipWeek === 'last8' ? ' selected' : '') + '>Last 8 Weeks</option>';
  weekOpts += '<option value="all"' + (state.leadershipWeek === 'all' ? ' selected' : '') + '>All Weeks</option>';
  for (var lwi = 0; lwi < lWeeks.length; lwi++) {
    weekOpts += '<option value="' + lWeeks[lwi] + '"' + (state.leadershipWeek === String(lWeeks[lwi]) ? ' selected' : '') + '>WK ' + lWeeks[lwi] + '</option>';
  }
  html += '<div class="filter-bar" style="margin-bottom:16px"><span style="font-size:13px;font-weight:600;color:#1e40af">Filters:</span><label>Region: <select id="leadershipRegion">' + regionOpts + '</select></label><label>Weeks: <select id="leadershipWeek">' + weekOpts + '</select></label></div>';

  html += '<div class="leadership-section">';
  html += '<div class="flex-between mb-16"><h3 style="color:#1e40af;font-size:18px">Leadership Analysis Report' + (state.leadershipRegion ? ' \\u2014 ' + state.leadershipRegion : ' \\u2014 NA & EU') + '</h3>';
  html += '<div style="display:flex;gap:8px"><button class="copy-btn" onclick="copyLeadershipReport()">\\uD83D\\uDCCB Copy to Clipboard</button>';
  html += '<button class="export-btn" onclick="exportLeadershipCsv()">\\uD83D\\uDCE5 Export CSV</button></div></div>';

  // 1. Region Summary (Week-wise, last 4 weeks)
  if (report.regionSummary.length > 0) {
    var allWeeks = [];
    var weekSet = {};
    for (var ri = 0; ri < report.regionSummary.length; ri++) {
      for (var wi = 0; wi < report.regionSummary[ri].weeks.length; wi++) {
        var wk = report.regionSummary[ri].weeks[wi].week;
        if (!weekSet[wk]) { weekSet[wk] = true; allWeeks.push(wk); }
      }
    }
    allWeeks.sort(function(a, b) { return a - b; });
    html += '<h4 style="font-size:15px;font-weight:600;color:#1e40af;margin-bottom:8px">Week-wise Performance (Last 4 Weeks)</h4>';
    html += '<table class="leadership-table"><thead><tr><th>Region</th><th>Metric</th>';
    for (var whi = 0; whi < allWeeks.length; whi++) html += '<th style="text-align:center">WK ' + allWeeks[whi] + '</th>';
    html += '<th>Trend</th></tr></thead><tbody>';
    for (var rsi = 0; rsi < report.regionSummary.length; rsi++) {
      var rs = report.regionSummary[rsi];
      var wdm = {};
      for (var wdi = 0; wdi < rs.weeks.length; wdi++) wdm[rs.weeks[wdi].week] = rs.weeks[wdi];
      var tA = rs.trend === 'improving' ? '\\u2193 Improving' : rs.trend === 'regressing' ? '\\u2191 Regressing' : '\\u2014 Stable';
      var tC = rs.trend === 'improving' ? '#059669' : rs.trend === 'regressing' ? '#dc2626' : '#64748b';
      html += '<tr><td rowspan="3" style="font-weight:600;vertical-align:middle">' + rs.region + '</td><td style="font-size:12px;color:#64748b">Audited</td>';
      for (var a1 = 0; a1 < allWeeks.length; a1++) { var w1 = wdm[allWeeks[a1]]; html += '<td style="text-align:center">' + (w1 ? w1.audited : '\\u2014') + '</td>'; }
      html += '<td rowspan="3" style="font-weight:600;color:' + tC + ';vertical-align:middle">' + tA + '</td></tr>';
      html += '<tr><td style="font-size:12px;color:#64748b">Defects</td>';
      for (var a2 = 0; a2 < allWeeks.length; a2++) { var w2 = wdm[allWeeks[a2]]; html += '<td style="text-align:center;color:#dc2626">' + (w2 ? w2.defects : '\\u2014') + '</td>'; }
      html += '</tr><tr><td style="font-size:12px;color:#64748b">Rate</td>';
      for (var a3 = 0; a3 < allWeeks.length; a3++) { var w3 = wdm[allWeeks[a3]]; html += w3 ? '<td style="text-align:center;font-weight:600;color:' + rateColor(w3.rate) + '">' + w3.rate + '%</td>' : '<td style="text-align:center">\\u2014</td>'; }
      html += '</tr>';
    }
    html += '</tbody></table>';
  }

  // 2. Month-wise Comparison
  if (report.monthlySummary && report.monthlySummary.length > 0) {
    html += '<h4 style="font-size:15px;font-weight:600;color:#1e40af;margin:16px 0 8px">Month-wise Comparison</h4>';
    html += '<table class="leadership-table"><thead><tr><th>Month</th><th style="text-align:center">Audited</th><th style="text-align:center">Defects</th><th style="text-align:center">Defect Rate</th></tr></thead><tbody>';
    for (var msi = 0; msi < report.monthlySummary.length; msi++) {
      var ms = report.monthlySummary[msi];
      html += '<tr><td style="font-weight:600">' + MONTH_NAMES[ms.month] + ' ' + ms.year + '</td>';
      html += '<td style="text-align:center">' + ms.audited + '</td>';
      html += '<td style="text-align:center">' + ms.defects + '</td>';
      html += '<td style="text-align:center;font-weight:600;color:' + rateColor(ms.rate) + '">' + ms.rate + '%</td></tr>';
    }
    html += '</tbody></table>';
  }

  // 3. Defect-wise Breakdown (by attribute)
  if (report.defectBreakdown && report.defectBreakdown.length > 0) {
    var totalErrs = report.defectBreakdown.reduce(function(s, a) { return s + a.count; }, 0);
    html += '<h4 style="font-size:15px;font-weight:600;color:#1e40af;margin:16px 0 8px">Defect-wise Breakdown (Last 4 Weeks)</h4>';
    html += '<table class="leadership-table"><thead><tr><th>Attribute</th><th style="text-align:center">Count</th><th style="text-align:center">%</th><th>Category</th></tr></thead><tbody>';
    for (var dbi = 0; dbi < report.defectBreakdown.length; dbi++) {
      var db = report.defectBreakdown[dbi];
      var pct = totalErrs > 0 ? Math.round(db.count / totalErrs * 10000) / 100 : 0;
      var category = (db.attribute === 'ADM' || db.attribute === 'RA' || db.attribute === 'RRC') ? 'Associate Controllable' : 'Tool/Process Controllable';
      var catColor = category === 'Associate Controllable' ? '#d97706' : '#2563eb';
      html += '<tr><td style="font-weight:600;color:' + (ATTR_COLORS[db.attribute] || '#475569') + '">' + db.attribute + ' \\u2014 ' + (ATTR_FULL_NAMES[db.attribute] || '') + '</td>';
      html += '<td style="text-align:center;font-weight:600">' + db.count + '</td>';
      html += '<td style="text-align:center">' + pct + '%</td>';
      html += '<td><span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:' + (category === 'Associate Controllable' ? '#fffbeb' : '#eff6ff') + ';color:' + catColor + '">' + category + '</span></td></tr>';
    }
    html += '</tbody></table>';
  }

  // 4. Manager-wise Performance (Rolling 4 Weeks)
  if (report.managerComparison.length > 0) {
    html += '<h4 style="font-size:15px;font-weight:600;color:#1e40af;margin:16px 0 8px">Manager-wise Performance (Rolling 4 Weeks)</h4>';
    var mgrWeeks = report.selectedWeeks || [];
    html += '<table class="leadership-table"><thead><tr><th>Manager</th><th style="text-align:center">Total Audits</th><th style="text-align:center">Defects</th><th style="text-align:center">Defect Rate</th>';
    for (var mwhi = 0; mwhi < mgrWeeks.length; mwhi++) html += '<th style="text-align:center">WK ' + mgrWeeks[mwhi] + '</th>';
    html += '</tr></thead><tbody>';
    for (var mi = 0; mi < report.managerComparison.length; mi++) {
      var mc = report.managerComparison[mi];
      html += '<tr><td style="font-weight:600">' + mc.manager + '</td>';
      html += '<td style="text-align:center">' + mc.audited + '</td>';
      html += '<td style="text-align:center">' + mc.defects + '</td>';
      html += '<td style="text-align:center;font-weight:600;color:' + rateColor(mc.rate) + '">' + mc.rate + '%</td>';
      var mcWdm = {};
      if (mc.weeks) { for (var mcwi = 0; mcwi < mc.weeks.length; mcwi++) mcWdm[mc.weeks[mcwi].week] = mc.weeks[mcwi]; }
      for (var mwi = 0; mwi < mgrWeeks.length; mwi++) {
        var mwd = mcWdm[mgrWeeks[mwi]];
        html += mwd ? '<td style="text-align:center;font-weight:600;color:' + rateColor(mwd.rate) + '">' + mwd.rate + '%</td>' : '<td style="text-align:center">\\u2014</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
  }

  // 5. Repeated Defaulters
  if (report.repeatedDefaulters.length > 0) {
    html += '<h4 style="font-size:15px;font-weight:600;color:#dc2626;margin:16px 0 8px">Repeated Defaulters</h4>';
    html += '<table class="leadership-table"><thead><tr><th>Associate</th><th style="text-align:center">Weeks with Defects</th></tr></thead><tbody>';
    for (var di = 0; di < report.repeatedDefaulters.length; di++) {
      var def = report.repeatedDefaulters[di];
      html += '<tr><td style="font-weight:600">' + def.login + '</td>';
      html += '<td style="text-align:center;font-weight:600;color:#dc2626">' + def.weeksWithDefects + '</td></tr>';
    }
    html += '</tbody></table>';
  }

  // 6. Shift-wise Performance
  if (report.shiftPerformance && report.shiftPerformance.length > 0) {
    html += '<h4 style="font-size:15px;font-weight:600;color:#1e40af;margin:16px 0 8px">Shift-wise Performance (Last 4 Weeks)</h4>';
    html += '<table class="leadership-table"><thead><tr><th>Shift</th><th style="text-align:center">Total Audits</th><th style="text-align:center">Defects</th><th style="text-align:center">Defect Rate</th></tr></thead><tbody>';
    for (var shi = 0; shi < report.shiftPerformance.length; shi++) {
      var sp = report.shiftPerformance[shi];
      html += '<tr><td style="font-weight:600">' + sp.shift + '</td>';
      html += '<td style="text-align:center">' + sp.audited + '</td>';
      html += '<td style="text-align:center">' + sp.defects + '</td>';
      html += '<td style="text-align:center;font-weight:600;color:' + rateColor(sp.rate) + '">' + sp.rate + '%</td></tr>';
    }
    html += '</tbody></table>';
  }

  // 7. Defect Reason Trend (Week-wise)
  if (report.defectReasonTrend && report.defectReasonTrend.length > 0) {
    var trendWeeks = report.selectedWeeks || [];
    html += '<h4 style="font-size:15px;font-weight:600;color:#1e40af;margin:16px 0 8px">Area of Opportunity \\u2014 Defect Reason Trend</h4>';
    html += '<table class="leadership-table"><thead><tr><th>Category</th><th>Attribute</th><th style="max-width:300px">Defect Use Case</th>';
    for (var twi = 0; twi < trendWeeks.length; twi++) html += '<th style="text-align:center" colspan="2">WK ' + trendWeeks[twi] + '</th>';
    html += '</tr><tr><th></th><th></th><th></th>';
    for (var twi2 = 0; twi2 < trendWeeks.length; twi2++) html += '<th style="text-align:center;font-size:11px">Count</th><th style="text-align:center;font-size:11px">%</th>';
    html += '</tr></thead><tbody>';
    var lastCat = '';
    var lastAttr = '';
    for (var drti = 0; drti < report.defectReasonTrend.length; drti++) {
      var drt = report.defectReasonTrend[drti];
      var catCell = drt.category !== lastCat ? '<td style="font-weight:600;color:' + (drt.category === 'Tool Controllable' ? '#2563eb' : '#d97706') + '">' + drt.category + '</td>' : '<td></td>';
      var attrCell = drt.attribute !== lastAttr || drt.category !== lastCat ? '<td style="font-weight:600;color:' + (ATTR_COLORS[drt.attribute] || '#475569') + '">' + (ATTR_FULL_NAMES[drt.attribute] || drt.attribute) + '</td>' : '<td></td>';
      html += '<tr>' + catCell + attrCell + '<td style="font-size:12px;max-width:300px;white-space:normal">' + drt.finding + '</td>';
      for (var twi3 = 0; twi3 < trendWeeks.length; twi3++) {
        var cnt = drt.weekCounts[trendWeeks[twi3]] || 0;
        // Get total audited for that week to compute contribution %
        var weekTotal = 0;
        for (var rsi2 = 0; rsi2 < report.regionSummary.length; rsi2++) {
          for (var wsi = 0; wsi < report.regionSummary[rsi2].weeks.length; wsi++) {
            if (report.regionSummary[rsi2].weeks[wsi].week === trendWeeks[twi3]) weekTotal += report.regionSummary[rsi2].weeks[wsi].audited;
          }
        }
        var contrib = weekTotal > 0 ? computeRate(cnt, weekTotal) : 0;
        html += '<td style="text-align:center;font-weight:' + (cnt > 0 ? '600' : '400') + ';color:' + (cnt > 0 ? '#dc2626' : '#94a3b8') + '">' + cnt + '</td>';
        html += '<td style="text-align:center;font-size:12px;color:#64748b">' + contrib + '%</td>';
      }
      html += '</tr>';
      lastCat = drt.category;
      lastAttr = drt.attribute;
    }
    html += '</tbody></table>';
  }

  // 8. Appeal Summary
  if (report.appealSummary && report.appealSummary.raised > 0) {
    var ap = report.appealSummary;
    html += '<h4 style="font-size:15px;font-weight:600;color:#7c3aed;margin:16px 0 8px">Appeal Summary</h4>';
    // Summary cards
    html += '<div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap">';
    html += '<div style="flex:1;min-width:120px;padding:12px;background:#f5f3ff;border-radius:8px;border:1px solid #ddd6fe;text-align:center"><div style="font-size:12px;color:#7c3aed">Appeals Raised</div><div style="font-size:24px;font-weight:700;color:#7c3aed">' + ap.raised + '</div></div>';
    html += '<div style="flex:1;min-width:120px;padding:12px;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;text-align:center"><div style="font-size:12px;color:#059669">Accepted</div><div style="font-size:24px;font-weight:700;color:#059669">' + ap.accepted + '</div></div>';
    html += '<div style="flex:1;min-width:120px;padding:12px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;text-align:center"><div style="font-size:12px;color:#dc2626">Not Accepted</div><div style="font-size:24px;font-weight:700;color:#dc2626">' + ap.notAccepted + '</div></div>';
    html += '<div style="flex:1;min-width:120px;padding:12px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;text-align:center"><div style="font-size:12px;color:#1e40af">Acceptance Rate</div><div style="font-size:24px;font-weight:700;color:#1e40af">' + ap.acceptedPct + '%</div></div>';
    html += '</div>';
    // Week-wise appeal table
    if (ap.weekData.length > 0) {
      html += '<table class="leadership-table"><thead><tr><th>Week</th><th style="text-align:center">Raised</th><th style="text-align:center">Accepted</th><th style="text-align:center">Not Accepted</th><th style="text-align:center">Acceptance %</th></tr></thead><tbody>';
      for (var api = 0; api < ap.weekData.length; api++) {
        var awd = ap.weekData[api];
        var awPct = awd.raised > 0 ? computeRate(awd.accepted, awd.raised) : 0;
        html += '<tr><td style="font-weight:600">WK ' + awd.week + '</td>';
        html += '<td style="text-align:center;font-weight:600;color:#7c3aed">' + awd.raised + '</td>';
        html += '<td style="text-align:center;color:#059669">' + awd.accepted + '</td>';
        html += '<td style="text-align:center;color:#dc2626">' + awd.notAccepted + '</td>';
        html += '<td style="text-align:center;font-weight:600;color:' + rateColor(100 - awPct) + '">' + awPct + '%</td></tr>';
      }
      html += '</tbody></table>';
    }
  }

  // 9. Visual Charts (CSS bar charts)
  // Defect Rate by Region bar chart
  if (report.regionSummary.length > 0) {
    html += '<h4 style="font-size:15px;font-weight:600;color:#1e40af;margin:16px 0 8px">Defect Rate Trend by Region</h4>';
    html += '<div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:16px">';
    for (var chi = 0; chi < report.regionSummary.length; chi++) {
      var crs = report.regionSummary[chi];
      html += '<div style="flex:1;min-width:280px"><h5 style="font-size:13px;font-weight:600;color:#475569;margin-bottom:8px">' + crs.region + '</h5>';
      for (var cwi = 0; cwi < crs.weeks.length; cwi++) {
        var cw = crs.weeks[cwi];
        var barW = Math.min(cw.rate * 3, 100);
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:12px;color:#64748b;width:45px">WK ' + cw.week + '</span><div style="flex:1;background:#f1f5f9;border-radius:4px;height:20px;position:relative"><div style="width:' + barW + '%;height:100%;border-radius:4px;background:' + rateColor(cw.rate) + ';transition:width .3s"></div></div><span style="font-size:12px;font-weight:600;color:' + rateColor(cw.rate) + ';width:50px;text-align:right">' + cw.rate + '%</span></div>';
      }
      html += '</div>';
    }
    html += '</div>';
  }

  // Shift performance bar chart
  if (report.shiftPerformance && report.shiftPerformance.length > 0) {
    html += '<h4 style="font-size:15px;font-weight:600;color:#1e40af;margin:16px 0 8px">Defect Rate by Shift</h4>';
    html += '<div style="margin-bottom:16px">';
    var shiftColors = {Morning:'#2563eb',Afternoon:'#d97706',Night:'#7c3aed'};
    for (var schi = 0; schi < report.shiftPerformance.length; schi++) {
      var scp = report.shiftPerformance[schi];
      var scBarW = Math.min(scp.rate * 3, 100);
      var scColor = shiftColors[scp.shift] || '#64748b';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:13px;font-weight:600;color:#475569;width:80px">' + scp.shift + '</span><div style="flex:1;background:#f1f5f9;border-radius:4px;height:24px;position:relative"><div style="width:' + scBarW + '%;height:100%;border-radius:4px;background:' + scColor + '"></div></div><span style="font-size:13px;font-weight:600;color:' + scColor + ';width:80px;text-align:right">' + scp.rate + '% (' + scp.defects + '/' + scp.audited + ')</span></div>';
    }
    html += '</div>';
  }

  // 10. Best Practices
  if (report.bestPractices.length > 0) {
    html += '<h4 style="font-size:15px;font-weight:600;color:#059669;margin:16px 0 8px">\\uD83D\\uDCA1 Best Practices</h4>';
    html += '<ul style="padding-left:20px;list-style:disc;font-size:13px;color:#334155;line-height:1.8">';
    for (var bi = 0; bi < report.bestPractices.length; bi++) {
      html += '<li>' + report.bestPractices[bi] + '</li>';
    }
    html += '</ul>';
  }

  html += '</div>';
  return html;
}

// ============================================================================
// RAW DATA VIEW
// ============================================================================
function renderRawData(){
  const user=state.user;
  let records=AUDIT_DATA;
  // Role-based filtering
  if(user.role==='associate')records=records.filter(r=>r.associateLogin===user.login);
  else if(user.role==='manager')records=records.filter(r=>r.supervisorLogin===user.login);
  // Apply raw filters
  const{region,week,month,search}=state.rawFilters;
  if(region)records=records.filter(r=>r.region===region);
  if(week)records=records.filter(r=>r.transactionWeek===parseInt(week));
  if(month)records=records.filter(r=>parseInt(r.transactionDate.split('-')[1])===parseInt(month));
  if(search)records=records.filter(r=>r.associateLogin.toLowerCase().includes(search.toLowerCase()));
  
  const totalCount=records.length;
  const pageSize=50;
  const totalPages=Math.max(1,Math.ceil(totalCount/pageSize));
  const page=Math.min(state.rawFilters.page,totalPages);
  const pageRecords=records.slice((page-1)*pageSize,page*pageSize);
  
  const regions=getAvailableRegions();
  const allWeeks=getAvailableWeeks();
  const months=getAvailableMonths();

  let regionOpts='<option value="">All Regions</option>'+regions.map(r=>\`<option value="\${r}" \${region===r?'selected':''}>\${r}</option>\`).join('');
  let weekOpts='<option value="">All Weeks</option>'+allWeeks.map(w=>\`<option value="\${w}" \${week===String(w)?'selected':''}>WK \${w}</option>\`).join('');
  let monthOpts='<option value="">All Months</option>'+months.map(m=>\`<option value="\${m}" \${month===String(m)?'selected':''}>\${MONTH_NAMES[m]}</option>\`).join('');

  let tableRows=pageRecords.length===0?'<tr><td colspan="13" style="text-align:center;padding:32px;color:#94a3b8">No records found for the selected filters.</td></tr>':pageRecords.map((r,idx)=>{
    const isDefect=r.defectFlag;
    const findings=[];
    for(const attr of ATTRS){if(r[attr.key]==='No'){const f=r[attr.fKey];if(f)findings.push(attr.label+': '+f);}}
    const findStr=findings.join('; ')||'—';
    const rowClass=isDefect?'defect-row':'';
    function ynCell(val){return'<span class="yes-no '+(val==='Yes'?'yes':'no')+'">'+val+'</span>';}
    return\`<tr class="\${rowClass}"><td>\${r.transactionWeek}</td><td>\${r.transactionDate}</td><td>\${r.region}</td><td style="font-weight:600">\${r.associateLogin}</td><td>\${r.supervisorLogin}</td><td>\${r.disruptionType}</td><td style="text-align:center">\${ynCell(r.adm)}</td><td style="text-align:center">\${ynCell(r.ra)}</td><td style="text-align:center">\${ynCell(r.rrc)}</td><td style="text-align:center">\${ynCell(r.acc)}</td><td style="text-align:center">\${ynCell(r.rv)}</td><td style="text-align:center"><span class="yes-no \${isDefect?'no':'yes'}">\${isDefect?'Yes':'No'}</span></td><td style="white-space:normal;max-width:350px;font-size:11px;color:#64748b">\${findStr}</td></tr>\`;
  }).join('');

  let pagination='';
  if(totalPages>1){
    pagination=\`<div class="pagination"><button class="page-btn" \${page<=1?'disabled':''} onclick="rawPage(\${page-1})">← Previous</button><span class="text-sm" style="color:#475569">Page \${page} of \${totalPages}</span><button class="page-btn" \${page>=totalPages?'disabled':''} onclick="rawPage(\${page+1})">Next →</button></div>\`;
  }

  return renderNav()+\`<div class="main">
    <div style="margin-bottom:16px"><button class="nav-link" style="background:#eff6ff;color:#1e40af;border:1px solid #dbeafe" onclick="state.currentView='dashboard';render()">← Back to Dashboard</button></div>
    <h2 style="font-size:20px;font-weight:700;margin-bottom:16px">Raw Audit Data <span class="text-muted" style="font-weight:400;margin-left:12px">\${totalCount} record\${totalCount!==1?'s':''}</span></h2>
    <div style="margin-bottom:16px"><button class="csv-btn" onclick="downloadRawData()">📥 Download CSV (current page)</button></div>
    <div class="filter-bar">
      <span style="font-size:13px;font-weight:600;color:#1e40af">Filters:</span>
      <label>Region: <select id="rawRegion">\${regionOpts}</select></label>
      <label>Week: <select id="rawWeek">\${weekOpts}</select></label>
      <label>Month: <select id="rawMonth">\${monthOpts}</select></label>
      <div style="display:flex;align-items:center;gap:6px"><input type="text" id="rawSearch" placeholder="Search associate login…" value="\${search}" style="padding:7px 12px;border:1px solid #dbeafe;border-radius:6px;font-size:13px;min-width:200px"><button class="csv-btn" onclick="rawSearchApply()">Search</button></div>
    </div>
    <div style="overflow-x:auto;border-radius:8px;border:1px solid #e2e8f0;background:#fff">
      <table style="min-width:1200px"><thead><tr><th>Wk</th><th>Date</th><th>Region</th><th>Associate</th><th>Supervisor</th><th>Disruption Type</th><th style="text-align:center">ADM</th><th style="text-align:center">RA</th><th style="text-align:center">RRC</th><th style="text-align:center">ACC</th><th style="text-align:center">RV</th><th style="text-align:center">Defect</th><th style="min-width:250px">Findings</th></tr></thead><tbody>\${tableRows}</tbody></table>
    </div>
    \${pagination}
  </div>\`;
}

// ============================================================================
// EVENT BINDINGS
// ============================================================================
function bindDashboard(){
  const regionEl=document.getElementById('filterRegion');
  const weeksEl=document.getElementById('filterWeeks');
  const monthEl=document.getElementById('filterMonth');
  if(regionEl)regionEl.onchange=function(){state.filters.region=this.value;render();};
  if(weeksEl)weeksEl.onchange=function(){applyWeekPreset(this.value);render();};
  if(monthEl)monthEl.onchange=function(){
    const val=this.value;
    if(val){state.filters.selectedMonth=parseInt(val);state.filters.selectedWeeks=[];state.filters.weekPreset='';}
    else{state.filters.selectedMonth=null;applyWeekPreset('last4');}
    render();
  };
}

function bindRawData(){
  const regionEl=document.getElementById('rawRegion');
  const weekEl=document.getElementById('rawWeek');
  const monthEl=document.getElementById('rawMonth');
  const searchEl=document.getElementById('rawSearch');
  if(regionEl)regionEl.onchange=function(){state.rawFilters.region=this.value;state.rawFilters.page=1;render();};
  if(weekEl)weekEl.onchange=function(){state.rawFilters.week=this.value;state.rawFilters.page=1;render();};
  if(monthEl)monthEl.onchange=function(){state.rawFilters.month=this.value;if(this.value)state.rawFilters.week='';state.rawFilters.page=1;render();};
  if(searchEl)searchEl.onkeydown=function(e){if(e.key==='Enter')rawSearchApply();};
}

function bindLeadership(){
  const regionEl=document.getElementById('leadershipRegion');
  const weekEl=document.getElementById('leadershipWeek');
  if(regionEl)regionEl.onchange=function(){state.leadershipRegion=this.value;render();};
  if(weekEl)weekEl.onchange=function(){state.leadershipWeek=this.value;render();};
}

// Global functions called from onclick
function toggleAssociate(login){
  if(state.expandedAssociates.has(login))state.expandedAssociates.delete(login);
  else state.expandedAssociates.add(login);
  render();
}
function sortAssociates(key){
  if(state.sortKey===key)state.sortAsc=!state.sortAsc;
  else{state.sortKey=key;state.sortAsc=false;}
  render();
}
function sendEmail(type, login){
  var records=getFilteredRecords().filter(function(r){return r.associateLogin===login;});
  var weeks=records.map(function(r){return r.transactionWeek;});
  var weekNumber=weeks.length>0?Math.max.apply(null,weeks):0;
  var email;
  if(type==='appreciate'){
    email=buildAppreciationEmail(login,records,weekNumber);
  }else{
    var defects=records.filter(function(r){return r.defectFlag;}).length;
    var rate=computeRate(defects,records.length);
    email=buildFeedbackEmail(login,records,rate,weekNumber);
  }
  var link=buildMailtoLink(email.to,email.subject,email.body);
  window.location.href=link;
  setFeedbackShared(state.user.login,weekNumber,login);
  render();
}
function openEmsLink(login){
  var records=getFilteredRecords().filter(function(r){return r.associateLogin===login&&r.defectFlag;});
  var weeks=records.map(function(r){return r.transactionWeek;});
  var weekNumber=weeks.length>0?Math.max.apply(null,weeks):0;
  var url=buildEmsLink(login,records,weekNumber);
  window.open(url,'_blank');
}
function showToast(msg) {
  var existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();
  var el = document.createElement('div');
  el.className = 'toast-msg show';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.classList.remove('show'); setTimeout(function() { el.remove(); }, 300); }, 2000);
}
function copyLeadershipReport() {
  var report = computeLeadershipReport(AUDIT_DATA, state.leadershipRegion || '', state.leadershipWeek || 'last4');
  var text = '';
  text += '=== Leadership Analysis Report — NA & EU ===\\n\\n';

  // Region Summary
  text += '--- Region Summary ---\\n';
  for (var ri = 0; ri < report.regionSummary.length; ri++) {
    var rs = report.regionSummary[ri];
    var trendLabel = rs.trend === 'improving' ? 'Improving' : rs.trend === 'regressing' ? 'Regressing' : 'Stable';
    text += '\\nRegion: ' + rs.region + '  (Trend: ' + trendLabel + ')\\n';
    text += '  Week     Audited  Defects  Rate\\n';
    text += '  -------  -------  -------  ------\\n';
    for (var wi = 0; wi < rs.weeks.length; wi++) {
      var w = rs.weeks[wi];
      var wkStr = ('WK ' + w.week).padEnd(9);
      var audStr = String(w.audited).padEnd(9);
      var defStr = String(w.defects).padEnd(9);
      text += '  ' + wkStr + audStr + defStr + w.rate + '%\\n';
    }
  }

  // Manager Comparison
  text += '\\n--- Manager Comparison ---\\n';
  text += '  Manager          Audits  Defects  Rate\\n';
  text += '  ---------------  ------  -------  ------\\n';
  for (var mi = 0; mi < report.managerComparison.length; mi++) {
    var mc = report.managerComparison[mi];
    var mgrStr = mc.manager.padEnd(17);
    var maStr = String(mc.audited).padEnd(8);
    var mdStr = String(mc.defects).padEnd(9);
    text += '  ' + mgrStr + maStr + mdStr + mc.rate + '%\\n';
  }

  // Repeated Defaulters
  if (report.repeatedDefaulters.length > 0) {
    text += '\\n--- Repeated Defaulters ---\\n';
    text += '  Associate        Weeks with Defects\\n';
    text += '  ---------------  ------------------\\n';
    for (var di = 0; di < report.repeatedDefaulters.length; di++) {
      var def = report.repeatedDefaulters[di];
      text += '  ' + def.login.padEnd(17) + def.weeksWithDefects + '\\n';
    }
  }

  // Best Practices
  if (report.bestPractices.length > 0) {
    text += '\\n--- Best Practices ---\\n';
    for (var bi = 0; bi < report.bestPractices.length; bi++) {
      text += '  \\u2022 ' + report.bestPractices[bi] + '\\n';
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('Copied!');
    }).catch(function() {
      showToast('Copy failed \\u2014 please select text manually');
    });
  } else {
    showToast('Copy failed \\u2014 please select text manually');
  }
}
function exportLeadershipCsv() {
  var report = computeLeadershipReport(AUDIT_DATA, state.leadershipRegion || '', state.leadershipWeek || 'last4');
  var headers = ['Section', 'Region/Manager/Associate', 'Week', 'Audited', 'Defects', 'Rate', 'Trend'];
  var rows = [];

  // Region Summary rows
  for (var ri = 0; ri < report.regionSummary.length; ri++) {
    var rs = report.regionSummary[ri];
    for (var wi = 0; wi < rs.weeks.length; wi++) {
      var w = rs.weeks[wi];
      rows.push(['Region Summary', rs.region, 'WK ' + w.week, w.audited, w.defects, w.rate + '%', rs.trend]);
    }
  }

  // Manager Comparison rows
  for (var mi = 0; mi < report.managerComparison.length; mi++) {
    var mc = report.managerComparison[mi];
    rows.push(['Manager Comparison', mc.manager, '', mc.audited, mc.defects, mc.rate + '%', '']);
  }

  // Repeated Defaulters rows
  for (var di = 0; di < report.repeatedDefaulters.length; di++) {
    var def = report.repeatedDefaulters[di];
    rows.push(['Repeated Defaulters', def.login, '', '', '', '', def.weeksWithDefects + ' weeks']);
  }

  downloadCsv('leadership-report.csv', headers, rows);
}
function rawPage(p){state.rawFilters.page=p;render();}
function rawSearchApply(){const el=document.getElementById('rawSearch');state.rawFilters.search=el?el.value:'';state.rawFilters.page=1;render();}

// CSV Downloads
function downloadWeekSummary(){
  const records=getFilteredRecords();const rows=computeWeekSummaryTable(records);
  if(rows.length===0)return;
  const weeks=rows[0].values.map(v=>v.week);
  const headers=['Metric',...weeks.map(w=>'WK '+w)];
  const csvRows=rows.map(r=>[r.metric,...r.values.map(v=>v.value)]);
  downloadCsv('week-summary.csv',headers,csvRows);
}
function downloadAssociateSummary(){
  const records=getFilteredRecords();
  const summaries=computeAssociateSummaries(records,AUDIT_DATA);
  const headers=['Associate','Total Audits','Defects','Defect Rate','Top Errors','Trend'];
  const csvRows=summaries.map(r=>[r.associateLogin,r.totalAudits,r.totalDefects,r.defectRate+'%',r.errorAttributes.slice(0,3).map(a=>a.attribute+'('+a.count+')').join(', '),r.trend]);
  downloadCsv('associate-summary.csv',headers,csvRows);
}
function downloadDefaulters(){
  const records=getFilteredRecords();
  const defaulters=computeRepeatedDefaulters(records);
  if(defaulters.length===0)return;
  const allWeeks=[...new Set(defaulters.flatMap(d=>d.weeklyDefects.map(w=>w.week)))].sort((a,b)=>a-b);
  const headers=['Associate','Weeks with Defects',...allWeeks.map(w=>'WK '+w)];
  const csvRows=defaulters.map(d=>{const wm=new Map(d.weeklyDefects.map(w=>[w.week,w.defectCount]));return[d.associateLogin,d.totalWeeksWithDefects,...allWeeks.map(w=>wm.get(w)||0)];});
  downloadCsv('repeated-defaulters.csv',headers,csvRows);
}
function downloadErrorBreakdown(){
  const records=getFilteredRecords();
  const breakdown=computeErrorBreakdown(records);
  const total=breakdown.reduce((s,a)=>s+a.count,0);
  const headers=['Attribute','Count','Percentage'];
  const csvRows=breakdown.map(e=>[e.attribute,e.count,(total>0?Math.round(e.count/total*10000)/100:0)+'%']);
  downloadCsv('error-breakdown.csv',headers,csvRows);
}
function downloadCommonFindings(){
  const records=getFilteredRecords();
  const weekFindings=computeCommonFindingsByWeek(records);
  const headers=['Week','Attribute','Finding','Count'];
  const csvRows=[];
  for(const wf of weekFindings)for(const g of wf.groups)for(const f of g.findings)csvRows.push([wf.week,g.attribute,f.finding,f.count]);
  downloadCsv('common-findings.csv',headers,csvRows);
}
function downloadRawData(){
  const user=state.user;let records=AUDIT_DATA;
  if(user.role==='associate')records=records.filter(r=>r.associateLogin===user.login);
  else if(user.role==='manager')records=records.filter(r=>r.supervisorLogin===user.login);
  const{region,week,month,search}=state.rawFilters;
  if(region)records=records.filter(r=>r.region===region);
  if(week)records=records.filter(r=>r.transactionWeek===parseInt(week));
  if(month)records=records.filter(r=>parseInt(r.transactionDate.split('-')[1])===parseInt(month));
  if(search)records=records.filter(r=>r.associateLogin.toLowerCase().includes(search.toLowerCase()));
  const pageSize=50;const page=state.rawFilters.page;
  const pageRecords=records.slice((page-1)*pageSize,page*pageSize);
  const headers=['Wk','Date','Region','Associate','Supervisor','Disruption Type','ADM','RA','RRC','ACC','RV','Defect','Findings'];
  const csvRows=pageRecords.map(r=>{
    const findings=[];for(const attr of ATTRS){if(r[attr.key]==='No'){const f=r[attr.fKey];if(f)findings.push(attr.label+': '+f);}}
    return[r.transactionWeek,r.transactionDate,r.region,r.associateLogin,r.supervisorLogin,r.disruptionType,r.adm,r.ra,r.rrc,r.acc,r.rv,r.defectFlag?'Yes':'No',findings.join('; ')];
  });
  downloadCsv('raw-data.csv',headers,csvRows);
}

// ============================================================================
// EMAIL GENERATION
// ============================================================================
function buildMailtoLink(to, subject, body) {
  var encodedBody = encodeURIComponent(body);
  var encodedSubject = encodeURIComponent(subject);
  var uri = 'mailto:' + encodeURIComponent(to) + '?subject=' + encodedSubject + '&body=' + encodedBody;
  if (uri.length > 2000) {
    var prefix = 'mailto:' + encodeURIComponent(to) + '?subject=' + encodedSubject + '&body=';
    var truncNote = encodeURIComponent('[Content truncated]');
    var maxBodyLen = 2000 - prefix.length - truncNote.length;
    if (maxBodyLen < 0) maxBodyLen = 0;
    var truncatedEncoded = encodedBody.substring(0, maxBodyLen);
    var lastPct = truncatedEncoded.lastIndexOf('%');
    if (lastPct >= 0 && lastPct > truncatedEncoded.length - 3) {
      truncatedEncoded = truncatedEncoded.substring(0, lastPct);
    }
    uri = prefix + truncatedEncoded + truncNote;
  }
  return uri;
}

function buildAppreciationEmail(associateLogin, records, weekNumber) {
  var to = associateLogin + '@amazon.com';
  var txIds = records.map(function(r) { return r.transactionId || r.transactionDate; });
  var uniqueTxIds = txIds.filter(function(d, i) { return txIds.indexOf(d) === i; });
  var disruptions = records.map(function(r) { return r.disruptionType; });
  var uniqueDisruptions = disruptions.filter(function(d, i) { return disruptions.indexOf(d) === i; });
  var subject = 'Appreciation for Strong SOP Adherence | Week-' + weekNumber;
  var NL = '\\n';
  var body = 'Hi ' + associateLogin + ',' + NL +
    'I wanted to take a moment to appreciate the way you handled the cases for Week-' + weekNumber + '.' + NL + NL +
    'PERFORMANCE SUMMARY' + NL +
    'Week: ' + weekNumber + NL +
    'Total Audits Monitored: ' + records.length + NL +
    'Defect Rate: 0%' + NL +
    'Transaction ID(s): ' + uniqueTxIds.join(', ') + NL +
    'Disruption Type(s): ' + uniqueDisruptions.join(', ') + NL + NL +
    'Your approach clearly reflected a solid understanding of the SOP, especially in aligning actions with the defined special case guidelines. The way you navigated through the process and ensured the right action was taken demonstrates strong attention to detail and process adherence.' + NL + NL +
    'It is great to see consistent application of checks around CAPS and package data in SSP before proceeding. This level of diligence directly contributes to maintaining quality and reducing the need for follow-ups.' + NL + NL +
    'Keep up the excellent work and continue setting this standard in your daily operations.' + NL + NL +
    'Best regards';
  return { to: to, subject: subject, body: body };
}

function buildFeedbackEmail(associateLogin, records, defectRate, weekNumber) {
  var to = associateLogin + '@amazon.com';
  var subject = 'Week-' + weekNumber + ' RQM Feedback Summary';
  var defectRecords = records.filter(function(r) { return r.defectFlag; });
  var NL = '\\n';
  var body = 'Hi ' + associateLogin + ',' + NL +
    'Please find your Week ' + weekNumber + ' quality feedback attached. Kindly review the details and confirm acknowledgment upon receipt.' + NL + NL +
    'PERFORMANCE SUMMARY' + NL +
    'Week: ' + weekNumber + NL +
    'Total Audits Monitored: ' + records.length + NL +
    'Defects Found: ' + defectRecords.length + NL +
    'Defect Rate: ' + defectRate + '%' + NL + NL;

  for (var i = 0; i < defectRecords.length; i++) {
    var r = defectRecords[i];
    var txId = r.transactionId || r.transactionDate;
    body += 'TRANSACTION ' + (i + 1) + ' -' + NL;
    body += 'Transaction ID: ' + txId + NL;
    body += 'Transaction Date: ' + r.transactionDate + NL;
    body += 'Disruption Type: ' + r.disruptionType + NL;
    var errorNum = 1;
    for (var j = 0; j < ATTRS.length; j++) {
      var attr = ATTRS[j];
      if (r[attr.key] === 'No') {
        var fullName = ATTR_FULL_NAMES[attr.label] || attr.label;
        var finding = r[attr.fKey] || 'No finding recorded';
        var comment = r[attr.cKey] || '';
        var issueText = (finding.toLowerCase() === 'others' && comment) ? comment : finding;
        body += NL + 'Error ' + errorNum + ':' + NL;
        body += 'Attribute: ' + fullName + NL;
        body += 'Issue Identified: ' + issueText + NL;
        body += 'Action Required: Please review the SOP guidelines for ' + fullName + ' and ensure proper adherence to avoid similar errors.' + NL;
        errorNum++;
      }
    }
    body += NL;
  }

  body += 'Best Practices To Follow -' + NL;
  body += '1. Always verify CARS tool output before providing any details.' + NL;
  body += '2. Select the correct reason code as per CASA SOP guidelines.' + NL;
  body += '3. Check for Central Dock Approval login when required.' + NL;
  body += '4. Annotate SSP/RFFV data correctly after each action.' + NL;
  body += '5. Reach out to team leader when CARS tool does not show output.' + NL;
  body += '6. Transfer non-volume driven requests to the correct queue.' + NL + NL;

  body += 'Next Steps -' + NL;
  body += '1. Acknowledge this feedback.' + NL;
  body += '2. Review the relevant SOP sections for the identified errors.' + NL;
  body += '3. Reach out if you need any clarification.' + NL + NL;
  body += 'Best regards';
  return { to: to, subject: subject, body: body };
}

function buildEmsLink(associateLogin, records, weekNumber) {
  // EMS SharePoint form uses specific field internal names for pre-filling
  // The newifs.aspx form accepts field values via URL hash or query params
  var baseUrl = 'https://share.amazon.com/sites/EMS%202.0/Lists/EMS%2020/Item/newifs.aspx';
  var params = [];
  params.push('List=9f074620-5522-456d-9a0f-9aa4a5478776');
  params.push('Source=' + encodeURIComponent('https://share.amazon.com/sites/EMS%202.0/Lists/EMS%2020/20    EMS.aspx'));
  params.push('RootFolder=');
  params.push('Web=2b2c046c-c3ea-4166-b309-758029b5e7aa');
  if (!records || records.length === 0) {
    return baseUrl + '?' + params.join('&');
  }
  var firstRec = records[0];
  // Build summary text for clipboard/reference
  var txIds = records.map(function(r) { return r.transactionId || r.transactionDate; });
  var uniqueTxIds = txIds.filter(function(d, i) { return txIds.indexOf(d) === i; });
  var summaryParts = [];
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    for (var j = 0; j < ATTRS.length; j++) {
      var attr = ATTRS[j];
      if (r[attr.key] === 'No') {
        var finding = r[attr.fKey] || 'No finding recorded';
        summaryParts.push(attr.label + ': ' + finding + ' (TxID: ' + (r.transactionId || r.transactionDate) + ')');
      }
    }
  }
  // Copy EMS form data to clipboard so manager can paste into the form fields
  var emsData = 'EMS FORM DATA - Copy and paste into the respective fields:\\n\\n' +
    'Team: OB\\n' +
    'Week: Week' + weekNumber + '\\n' +
    'Associate Login: ' + associateLogin + '\\n' +
    'Manager Login: ' + (firstRec.supervisorLogin || '') + '\\n' +
    'Region: ' + (firstRec.region || '') + '\\n' +
    'EMS Category: Performance\\n' +
    'Case/WIMs ID: ' + uniqueTxIds.join(', ') + '\\n' +
    'Summary: ' + summaryParts.join('; ') + '\\n' +
    'Skip Manager: (Select manually)';
  // Try to copy to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(emsData).then(function() {
      showToast('EMS form data copied to clipboard! Paste into the form fields.');
    }).catch(function() {});
  }
  return baseUrl + '?' + params.join('&');
}

// ============================================================================
// FEEDBACK TRACKER
// ============================================================================
var _feedbackMemory = {};

function getFeedbackStatus(managerLogin, weekNumber) {
  var key = 'feedback_' + managerLogin + '_wk' + weekNumber;
  try {
    var raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // localStorage disabled or corrupted JSON — try in-memory fallback
    if (_feedbackMemory[key]) {
      return _feedbackMemory[key];
    }
  }
  // Check in-memory fallback if localStorage had nothing
  if (_feedbackMemory[key]) {
    return _feedbackMemory[key];
  }
  return {};
}

function setFeedbackShared(managerLogin, weekNumber, associateLogin) {
  var key = 'feedback_' + managerLogin + '_wk' + weekNumber;
  var status = getFeedbackStatus(managerLogin, weekNumber);
  status[associateLogin] = 'Shared';
  try {
    localStorage.setItem(key, JSON.stringify(status));
  } catch (e) {
    // QuotaExceededError or localStorage disabled — fall back to in-memory
    _feedbackMemory[key] = status;
  }
}

function initFeedbackTracker(managerLogin, weekNumber, associateLogins) {
  var key = 'feedback_' + managerLogin + '_wk' + weekNumber;
  var existing = getFeedbackStatus(managerLogin, weekNumber);
  var hasExisting = Object.keys(existing).length > 0;
  var status = hasExisting ? existing : {};
  for (var i = 0; i < associateLogins.length; i++) {
    if (!status[associateLogins[i]]) {
      status[associateLogins[i]] = 'Pending';
    }
  }
  try {
    localStorage.setItem(key, JSON.stringify(status));
  } catch (e) {
    // QuotaExceededError or localStorage disabled — fall back to in-memory
    _feedbackMemory[key] = status;
  }
}

// ============================================================================
// INIT
// ============================================================================
(function init(){
  const user=getUser();
  if(user){state.user=user;initFilters();}
  render();
})();
<\/script>
</body>
</html>`;

// Write output
const distDir = join(__dirname, '..', 'dist');
if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, 'dashboard.html'), html, 'utf-8');
console.log(`✅ Written to dist/dashboard.html (${(html.length / 1024).toFixed(1)} KB)`);
