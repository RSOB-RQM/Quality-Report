import https from 'https';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Week-19 records from RQM spreadsheet (May 2-9, 2026)
const seen = new Set();
const records = [];

// All Week-19 score-100 records [region, date, caseId, associate, supervisor]
const raw = [
["EU","2026-05-06","12558720392","empavan","ahujadiv"],
["EU","2026-05-06","12560024582","ashdarsh","ahujadiv"],
["EU","2026-05-06","12559497022","empavan","ahujadiv"],
["EU","2026-05-05","12555044962","ashdarsh","ahujadiv"],
["NA","2026-05-05","20207909841","harjgang","ahujadiv"],
["EU","2026-05-04","12552248512","charannd","ahujadiv"],
["EU","2026-05-03","12548483112","pulivarv","ahujadiv"],
["EU","2026-05-04","12552164922","dcharsai","ahujadiv"],
["EU","2026-05-04","12552216662","tanishxx","ahujadiv"],
["EU","2026-05-03","12548486202","dcharsai","ahujadiv"],
["EU","2026-05-04","12552228812","charannd","ahujadiv"],
["EU","2026-05-02","12547652082","akkaal","ahujadiv"],
["EU","2026-05-02","12547653042","akkaal","ahujadiv"],
["EU","2026-05-03","12549721462","pulivarv","ahujadiv"],
["EU","2026-05-04","12552298862","ellarish","ahujadiv"],
["EU","2026-05-04","12552505482","meghpul","ahujadiv"],
["EU","2026-05-04","12552310052","meghpul","ahujadiv"],
["EU","2026-05-04","12550920132","ellarish","ahujadiv"],
["EU","2026-05-04","12550960762","tanishxx","ahujadiv"],
["NA","2026-05-09","20261548931","knaveend","aksjais"],
["NA","2026-05-08","20257578831","chpallu","aksjais"],
["NA","2026-05-08","20256297691","chpallu","aksjais"],
["NA","2026-05-05","20207676491","vinodkrv","aksjais"],
["NA","2026-05-04","20225122071","bhdara","aksjais"],
["NA","2026-05-06","20234965911","bhdara","aksjais"],
["NA","2026-05-03","20206888221","knaveend","aksjais"],
["NA","2026-05-04","20226744371","vinodkrv","aksjais"],
["EU","2026-05-04","12551588412","tdivyap","aksjais"],
["EU","2026-05-03","12549388942","saiprsad","aksjais"],
["EU","2026-05-03","12549443222","saiprsad","aksjais"],
["EU","2026-05-04","12550403292","tdivyap","aksjais"],
["NA","2026-05-04","20222455141","chittajc","ancsingh"],
["NA","2026-05-04","20223871411","chittajc","ancsingh"],
["NA","2026-05-06","20208615201","asmsingh","ancsingh"],
["NA","2026-05-03","20222047921","mshaas","ancsingh"],
["NA","2026-05-03","20206875581","sshrea","ancsingh"],
["NA","2026-05-06","20234444421","asmsingh","ancsingh"],
["NA","2026-05-06","20235725541","sshrea","ancsingh"],
["NA","2026-05-03","20217436601","mshaas","ancsingh"],
["EU","2026-05-03","12549544302","shrisai","ancsingh"],
["EU","2026-05-03","12548424202","shrisai","ancsingh"],
["EU","2026-05-03","12548456542","aaindla","ancsingh"],
["EU","2026-05-05","12553174472","wannekac","ancsingh"],
["EU","2026-05-04","12551809272","dasven","ancsingh"],
["EU","2026-05-04","12550540502","rohigmah","ancsingh"],
["EU","2026-05-03","12548573022","aaindla","ancsingh"],
["EU","2026-05-03","12549642522","bondisri","ancsingh"],
["EU","2026-05-04","12550185622","rohigmah","ancsingh"],
["EU","2026-05-04","12550520492","dasven","ancsingh"],
["EU","2026-05-03","12548435202","bondisri","ancsingh"],
["EU","2026-05-05","12553151242","wannekac","ancsingh"],
["EU","2026-05-06","12558693392","shivayvc","augubabu"],
["EU","2026-05-06","12556874492","shivayvc","augubabu"],
["EU","2026-05-03","12549616742","inthiazv","augubabu"],
["EU","2026-05-03","12549655802","maraasho","augubabu"],
["EU","2026-05-05","12552767552","vsandepp","augubabu"],
["EU","2026-05-04","12551401472","inthiazv","augubabu"],
["EU","2026-05-05","12552825802","vsandepp","augubabu"],
["EU","2026-05-05","12552224182","vijachag","augubabu"],
["EU","2026-05-03","12548283282","maraasho","augubabu"],
["EU","2026-05-05","12552598432","vijachag","augubabu"],
["EU","2026-05-04","12550467082","bhagatth","bossayan"],
["EU","2026-05-05","12552750162","kranjich","bossayan"],
["EU","2026-05-05","12552808632","bhagatth","bossayan"],
["EU","2026-05-03","12547748292","kranjich","bossayan"],
["NA","2026-05-09","20258151801","tpadamat","kampatis"],
["NA","2026-05-05","20225647491","fareedhm","kampatis"],
["NA","2026-05-06","20233721681","atkamesw","kampatis"],
["NA","2026-05-03","20224702371","omamdasi","kampatis"],
["NA","2026-05-05","20230709721","fareedhm","kampatis"],
["NA","2026-05-06","20234703241","atkamesw","kampatis"],
["NA","2026-05-05","20229338191","baigvmir","kampatis"],
["NA","2026-05-02","20220441621","tpadamat","kampatis"],
["NA","2026-05-03","20223497081","susgadda","kampatis"],
["NA","2026-05-04","20226696711","baigvmir","kampatis"],
["NA","2026-05-06","20208194541","pulalekh","kampatis"],
["NA","2026-05-03","20220513881","nudurupa","kampatis"],
["NA","2026-05-06","20234184521","susgadda","kampatis"],
["NA","2026-05-05","20230722201","pulalekh","kampatis"],
["NA","2026-05-03","20221946611","saipkuma","kampatis"],
["NA","2026-05-03","20220513661","nudurupa","kampatis"],
["NA","2026-05-03","20219211681","omamdasi","kampatis"],
["NA","2026-05-03","20220494311","saipkuma","kampatis"],
["EU","2026-05-06","12558246562","kotesa","kurmagad"],
["EU","2026-05-05","12553723732","kotesa","kurmagad"],
["NA","2026-05-05","20230584051","mahvfati","kurmagad"],
["NA","2026-05-05","20231430341","samagys","kurmagad"],
["NA","2026-05-04","20222679161","mahvfati","kurmagad"],
["NA","2026-05-05","20231479101","venklokh","kurmagad"],
["NA","2026-05-05","20228590711","venklokh","kurmagad"],
["NA","2026-05-03","20226192231","mirhalik","kurmagad"],
["NA","2026-05-03","20222143381","kadgnana","kurmagad"],
["NA","2026-05-03","20226162491","mirhalik","kurmagad"],
["NA","2026-05-04","20227886251","samagys","kurmagad"],
["EU","2026-05-04","12552167742","bonjaswo","kurmagad"],
["EU","2026-05-03","12549543902","saican","kurmagad"],
["EU","2026-05-03","12549895262","bharaujo","kurmagad"],
["EU","2026-05-03","12549603732","saican","kurmagad"],
["EU","2026-05-03","12549653732","saibodhu","kurmagad"],
["EU","2026-05-03","12548430032","saibodhu","kurmagad"],
["EU","2026-05-02","12548954312","bharaujo","kurmagad"],
["EU","2026-05-04","12552328462","bonjaswo","kurmagad"],
["NA","2026-05-03","20224666191","moizu","mkumrtq"],
["NA","2026-05-04","20228696231","hemkakii","mkumrtq"],
["NA","2026-05-06","20234534701","varmkeyu","mkumrtq"],
["NA","2026-05-03","20226009781","mkhanwr","mkumrtq"],
["NA","2026-05-06","20233937341","varmkeyu","mkumrtq"],
["NA","2026-05-04","20222368551","moizu","mkumrtq"],
["NA","2026-05-03","20221846701","mkhanwr","mkumrtq"],
["NA","2026-05-04","20224978211","hemkakii","mkumrtq"],
["EU","2026-05-05","12553208222","samories","mkumrtq"],
["EU","2026-05-05","12552707792","venkota","mkumrtq"],
["EU","2026-05-05","12551505782","samories","mkumrtq"],
["EU","2026-05-05","12551958592","venkota","mkumrtq"],
["EU","2026-05-05","12553566652","kothrish","mpuranik"],
["NA","2026-05-05","20231571411","kscb","mpuranik"],
["NA","2026-05-03","20226100001","khajakal","mpuranik"],
["NA","2026-05-04","20222807871","menduy","mpuranik"],
["NA","2026-05-03","20223620481","khajakal","mpuranik"],
["NA","2026-05-05","20231250111","kscb","mpuranik"],
["NA","2026-05-04","20227595231","menduy","mpuranik"],
["EU","2026-05-03","12549724042","wsatyasw","mpuranik"],
["EU","2026-05-04","12552620482","binalish","mpuranik"],
["EU","2026-05-03","12548525862","wsatyasw","mpuranik"],
["EU","2026-05-03","12548501892","binalish","mpuranik"],
["NA","2026-05-05","20231264491","vennelgo","mrinshah"],
["NA","2026-05-03","20226043681","pridhvis","mrinshah"],
["NA","2026-05-03","20223587841","gdprasad","mrinshah"],
["NA","2026-05-04","20226790841","akifmirz","mrinshah"],
["NA","2026-05-02","20215728311","kingshur","mrinshah"],
["NA","2026-05-04","20229031101","vennelgo","mrinshah"],
["NA","2026-05-04","20207242631","akifmirz","mrinshah"],
["NA","2026-05-05","20207910871","gdprasad","mrinshah"],
["NA","2026-05-02","20220441491","kingshur","mrinshah"],
["NA","2026-05-03","20222127541","pridhvis","mrinshah"],
["EU","2026-05-04","12550768272","srujeeth","mrinshah"],
["EU","2026-05-04","12552144522","kinthali","mrinshah"],
["EU","2026-05-04","12552236252","srujeeth","mrinshah"],
["EU","2026-05-04","12551006152","kinthali","mrinshah"],
["EU","2026-05-07","12563494922","rishhaab","nmmylava"],
["EU","2026-05-07","12563576642","rishhaab","nmmylava"],
["EU","2026-05-05","12553551432","pparthee","nmmylava"],
["EU","2026-05-05","12553950812","sreejai","nmmylava"],
["EU","2026-05-04","12551304242","yashhuu","nmmylava"],
["EU","2026-05-04","12551740452","chethucs","nmmylava"],
["EU","2026-05-04","12550656602","viineeth","nmmylava"],
["EU","2026-05-05","12554247212","manpauls","nmmylava"],
["EU","2026-05-05","12554376782","nnikill","nmmylava"],
["EU","2026-05-05","12553712242","viineeth","nmmylava"],
["EU","2026-05-05","12553712602","chanilan","nmmylava"],
["EU","2026-05-05","12553829252","pparthee","nmmylava"],
["EU","2026-05-05","12553242802","abiabs","nmmylava"],
["EU","2026-05-05","12552010072","abiabs","nmmylava"],
["EU","2026-05-05","12553029692","sreejai","nmmylava"],
["EU","2026-05-05","12553988602","potthman","nmmylava"],
["EU","2026-05-04","12550637262","manpauls","nmmylava"],
["EU","2026-05-04","12551943202","potthman","nmmylava"],
["EU","2026-05-05","12552081272","chanilan","nmmylava"],
["EU","2026-05-05","12553430662","odsharma","nmmylava"],
["EU","2026-05-04","12550823332","khandenn","nmmylava"],
["EU","2026-05-04","12550507182","nnikill","nmmylava"],
["EU","2026-05-04","12550722682","khandenn","nmmylava"],
["EU","2026-05-04","12549333742","chethucs","nmmylava"],
["EU","2026-05-05","12552451802","odsharma","nmmylava"],
["EU","2026-05-07","12566190592","rutukulz","nsreerag"],
["EU","2026-05-07","12563293512","rutukulz","nsreerag"],
["NA","2026-05-06","20235708961","turumelh","nsreerag"],
["NA","2026-05-05","20231264011","utahura","nsreerag"],
["NA","2026-05-04","20226802001","turumelh","nsreerag"],
["NA","2026-05-04","20223866901","sarasdol","nsreerag"],
["NA","2026-05-03","20225930811","akbarudy","nsreerag"],
["NA","2026-05-05","20230911321","utahura","nsreerag"],
["NA","2026-05-04","20220870021","atifhsn","nsreerag"],
["NA","2026-05-04","20228655461","sarasdol","nsreerag"],
["NA","2026-05-03","20226077691","akbarudy","nsreerag"],
["NA","2026-05-04","20225092731","atifhsn","nsreerag"],
["EU","2026-05-03","12549177812","kummukav","nsreerag"],
["EU","2026-05-05","12552659412","madibp","nsreerag"],
["EU","2026-05-05","12552224122","mummanak","nsreerag"],
["EU","2026-05-05","12553971342","mummanak","nsreerag"],
["EU","2026-05-03","12549625362","ttanmoyd","nsreerag"],
["EU","2026-05-03","12548465472","kummukav","nsreerag"],
["EU","2026-05-03","12548045432","mahreen","nsreerag"],
["EU","2026-05-03","12549307712","mahreen","nsreerag"],
["EU","2026-05-03","12549608772","madibp","nsreerag"],
["EU","2026-05-03","12549144232","ttanmoyd","nsreerag"],
["EU","2026-05-08","12568237712","vjamazon","padakank"],
["EU","2026-05-09","12570449392","vjamazon","padakank"],
["EU","2026-05-03","12548591962","bggunda","padakank"],
["EU","2026-05-03","12549999182","bggunda","padakank"],
["NA","2026-05-03","20220512901","avasdivy","padakank"],
["NA","2026-05-06","20234353461","avasdivy","padakank"],
["NA","2026-05-06","20230216381","abuzars","padakank"],
["NA","2026-05-05","20228382011","snehie","padakank"],
["NA","2026-05-05","20228385861","snehie","padakank"],
["NA","2026-05-06","20235330941","abuzars","padakank"],
["NA","2026-05-04","20222463681","siravipa","padakank"],
["NA","2026-05-05","20224455701","siravipa","padakank"],
["NA","2026-05-02","20220442281","dandupva","padakank"],
["NA","2026-05-04","20229036891","temzjona","poojajsh"],
["NA","2026-05-05","20231200411","temzjona","poojajsh"],
["EU","2026-05-04","12551711542","gouthamy","poojajsh"],
["EU","2026-05-05","12553695032","gouthamy","poojajsh"],
["EU","2026-05-04","12549325122","kotteda","shrmaam"],
["EU","2026-05-03","12548917072","kotteda","shrmaam"],
["EU","2026-05-09","12571221992","pavantru","subhekum"],
["EU","2026-05-09","12571209002","pavantru","subhekum"],
["NA","2026-05-04","20222724881","oyennsri","subhekum"],
["NA","2026-05-03","20226061131","yharsred","subhekum"],
["NA","2026-05-05","20231596621","oyennsri","subhekum"],
["NA","2026-05-04","20226767791","yharsred","subhekum"],
["EU","2026-05-04","12552174612","tvennela","subhekum"],
["EU","2026-05-04","12552256052","namineni","subhekum"],
["EU","2026-05-04","12550764292","vvasala","subhekum"],
["EU","2026-05-03","12548492902","saistaru","subhekum"],
["EU","2026-05-04","12550888442","sirshra","subhekum"],
["EU","2026-05-03","12549729702","saistaru","subhekum"],
["EU","2026-05-04","12550941262","sirshra","subhekum"],
["EU","2026-05-03","12548342782","namineni","subhekum"],
["EU","2026-05-04","12552092922","tvennela","subhekum"],
["EU","2026-05-03","12549707082","vvasala","subhekum"],
["NA","2026-05-09","20258015421","qkuathul","thambido"],
["NA","2026-05-09","20259877381","qkuathul","thambido"],
["NA","2026-05-06","20234466301","sydsaa","thambido"],
["NA","2026-05-06","20208214741","ahmduhm","thambido"],
["NA","2026-05-05","20229627791","beautwne","thambido"],
["NA","2026-05-06","20234510711","krthbb","thambido"],
["NA","2026-05-06","20233813431","ahmduhm","thambido"],
["NA","2026-05-06","20234151361","krthbb","thambido"],
["NA","2026-05-06","20230186311","sydsaa","thambido"],
["NA","2026-05-06","20234285641","beautwne","thambido"],
["EU","2026-05-03","12547817852","usabedi","thambido"],
["EU","2026-05-03","12549054862","usabedi","thambido"],
["EU","2026-05-07","12564785652","gouthmad","ynnikith"],
["EU","2026-05-07","12559977422","gouthmad","ynnikith"],
["EU","2026-05-02","12548944262","patnasa","ynnikith"],
["EU","2026-05-05","12552043942","theerdha","ynnikith"],
["EU","2026-05-05","12552621522","ctdavid","ynnikith"],
["EU","2026-05-05","12553139622","ikoppula","ynnikith"],
["EU","2026-05-03","12549017172","nandunb","ynnikith"],
["EU","2026-05-03","12549100202","varmsoni","ynnikith"],
["EU","2026-05-05","12551285972","ctdavid","ynnikith"],
["EU","2026-05-03","12549088342","ikoppula","ynnikith"],
["EU","2026-05-05","12553139372","patnasa","ynnikith"],
["EU","2026-05-03","12548977682","varmsoni","ynnikith"],
["EU","2026-05-05","12551570902","theerdha","ynnikith"],
["EU","2026-05-05","12551439532","bodjyoth","ynnikith"],
["EU","2026-05-05","12552597452","bodjyoth","ynnikith"],
["EU","2026-05-03","12547687262","nandunb","ynnikith"],
];

// Defect records for Week-19
const defects = [
  // harjgang - ahujadiv - score 90 - RRC=No
  {r:"NA",w:19,d:"2026-05-05",tid:"20231087131",a:"harjgang",s:"ahujadiv",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rrf:"Should have selected correct reason code while resolving the case",
   c3:"AA Should have selected correct reason code while resolving the case as per CARS Tool decision"},
  // kadgnana - kurmagad - score 90 - RRC=No
  {r:"NA",w:19,d:"2026-05-05",tid:"20231462671",a:"kadgnana",s:"kurmagad",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rrf:"Should have selected correct reason code while resolving the case",
   c3:"AA Should have selected correct reason code while resolving the case as per CASA SOP"},
  // kothrish - mpuranik - score 90 - RRC=No
  {r:"EU",w:19,d:"2026-05-05",tid:"12555024982",a:"kothrish",s:"mpuranik",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rrf:"Should have selected correct reason code while resolving the case",
   c3:"AA Should have selected correct reason code while resolving the case as per CASA SOP"},
  // yashhuu - nmmylava - score 80 - ACC=No (SW Adherence)
  {r:"EU",w:19,d:"2026-05-05",tid:"12553708742",a:"yashhuu",s:"nmmylava",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"Yes",acc:"No",rv:"Yes",df:true,
   acf:"Should have annotated details of RS tool validator",
   c4:"SW: CARS TOOL annotations sheet for duplicate cases check and CASA applicability."},
];

// Build JSON records
for (const [r, d, tid, a, s] of raw) {
  if (seen.has(tid)) continue;
  seen.add(tid);
  records.push({r, w:19, d, tid, a, s, dt:"ADHOC Validation", adm:"Yes", ra:"Yes", rrc:"Yes", acc:"Yes", rv:"Yes", df:false});
}
for (const rec of defects) {
  if (seen.has(rec.tid)) continue;
  seen.add(rec.tid);
  records.push(rec);
}

console.log(`Generated ${records.length} unique Week-19 records`);
console.log(`  - Clean: ${records.filter(r=>!r.df).length}`);
console.log(`  - Defects: ${records.filter(r=>r.df).length}`);

// Read dashboard file and inject
const dashPath = resolve('dist/dashboard.html');
let html = readFileSync(dashPath, 'utf8');

// Find end of RAW_DATA array
const marker = '];\nconst ROLE_MAPPING';
const idx = html.indexOf(marker);
if (idx === -1) {
  console.error('Could not find RAW_DATA end marker');
  process.exit(1);
}

// Insert new records before the closing ];
const newJson = ',' + records.map(r => JSON.stringify(r)).join(',');
html = html.slice(0, idx) + newJson + html.slice(idx);

writeFileSync(dashPath, html, 'utf8');
console.log('Successfully injected Week-19 data into dashboard.html');

// Now copy to index.html and push to GitHub
writeFileSync(resolve('dist/index.html'), html, 'utf8');
console.log('Copied to dist/index.html');

// Push to GitHub
const token = 'YOUR_GITHUB_TOKEN_HERE';
const owner = 'RSOB-RQM';
const repo = 'Quality-Report';

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com', path, method,
      headers: {
        'Authorization': 'token ' + token,
        'User-Agent': 'node',
        'Accept': 'application/vnd.github+json',
      }
    };
    if (body) opts.headers['Content-Type'] = 'application/json';
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function pushToGitHub() {
  console.log('\nPushing to GitHub...');
  const fileContent = readFileSync(resolve('dist/index.html'));
  const base64Content = fileContent.toString('base64');
  console.log(`File size: ${(fileContent.length / 1024).toFixed(0)} KB`);

  let sha = null;
  let res = await apiCall('GET', `/repos/${owner}/${repo}/contents/index.html`);
  if (res.status === 200) sha = res.data.sha;

  const body = { message: 'Add Week-19 & Week-20 audit data (complete)', content: base64Content };
  if (sha) body.sha = sha;

  res = await apiCall('PUT', `/repos/${owner}/${repo}/contents/index.html`, body);
  if (res.status === 200 || res.status === 201) {
    console.log('✅ Deployed! https://RSOB-RQM.github.io/Quality-Report/');
    console.log('(May take 1-2 minutes for GitHub Pages to update)');
  } else {
    console.log('Failed:', res.status, JSON.stringify(res.data).substring(0, 300));
  }
}

pushToGitHub().catch(e => console.error(e.message));


