import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const seen = new Set();
const records = [];

// Week-22 records from RQM spreadsheet
// Format: [region, date, caseId, associateLogin, supervisorLogin]

// All 100-score records (no defects)
const rawClean = [
["EU","2026-05-26","12633280692","kinthali","mrinshah"],
["EU","2026-05-26","12633831112","dasven","ancsingh"],
["EU","2026-05-24","12623148042","shrisai","ancsingh"],
["EU","2026-05-25","12625594342","vijachag","mkumrtq"],
["EU","2026-05-27","12635002072","samories","mkumrtq"],
["EU","2026-05-27","12638387482","saiprsad","aksjais"],
["EU","2026-05-25","12627912192","potthman","nmmylava"],
["EU","2026-05-27","12636185332","madibp","nsreerag"],
["EU","2026-05-24","12624112502","bodjyoth","ynnikith"],
["EU","2026-05-26","12634895392","pdsavi","bossayan"],
["EU","2026-05-26","12632148142","viineeth","nmmylava"],
["EU","2026-05-25","12627514102","chanilan","nmmylava"],
["EU","2026-05-25","12625893742","kakandur","ynnikith"],
["EU","2026-05-24","12626231112","srujeeth","mrinshah"],
["EU","2026-05-24","12626465872","charannd","ahujadiv"],
["EU","2026-05-26","12634856872","pulivarv","ahujadiv"],
["EU","2026-05-25","12627253442","vsandepp","mkumrtq"],
["EU","2026-05-24","12626410192","ellarish","ahujadiv"],
["EU","2026-05-27","12636121472","mummanak","nsreerag"],
["EU","2026-05-23","12623613922","charannd","ahujadiv"],
["EU","2026-05-27","12634489052","samories","mkumrtq"],
["EU","2026-05-24","12626228752","ndommeti","bossayan"],
["EU","2026-05-23","12624854612","meghpul","ahujadiv"],
["NA","2026-05-29","20422898551","chpallu","aksjais"],
["NA","2026-05-23","20371865181","khajakal","mpuranik"],
["NA","2026-05-23","20371787641","vennelgo","mrinshah"],
["NA","2026-05-26","20387112841","sultahee","kampatis"],
["NA","2026-05-23","20371834591","vennelgo","mrinshah"],
["NA","2026-05-30","20429455511","rojarsev","mrinshah"],
["NA","2026-05-29","20421464661","chpallu","aksjais"],
["NA","2026-05-24","20374805691","akbarudy","nsreerag"],
["NA","2026-05-24","20375371291","ogikezia","aksjais"],
["NA","2026-05-24","20375292941","ogikezia","aksjais"],
["NA","2026-05-30","20428686351","rojarsev","mrinshah"],
["NA","2026-05-29","20422163621","pridhvis","mrinshah"],
["NA","2026-05-23","20371841831","temzjona","mpuranik"],
["NA","2026-05-23","20371790571","temzjona","mpuranik"],
["NA","2026-05-28","20408083011","pkommuri","mkumrtq"],
["NA","2026-05-28","20406847821","abbarvmv","aksjais"],
["NA","2026-05-27","20394991441","krthbb","thambido"],
["NA","2026-05-25","20380414651","sarasdol","nsreerag"],
["NA","2026-05-28","20404812861","pkommuri","mkumrtq"],
["NA","2026-05-28","20411733941","abbarvmv","aksjais"],
["NA","2026-05-24","20374995671","akbarudy","nsreerag"],
["NA","2026-05-24","20375702721","kingshur","mrinshah"],
["NA","2026-05-25","20377904261","moizu","mkumrtq"],
["NA","2026-05-28","20415250101","pridhvis","mrinshah"],
["NA","2026-05-24","20375453201","kingshur","mrinshah"],
["NA","2026-05-25","20380431651","sarasdol","nsreerag"],
["NA","2026-05-25","20378754401","pulalekh","kampatis"],
["NA","2026-05-25","20378701091","baigvmir","kampatis"],
["NA","2026-05-25","20378644541","fareedhm","kampatis"],
["NA","2026-05-25","20378992291","mkhanwr","mkumrtq"],
["NA","2026-05-25","20378829181","moizu","mkumrtq"],
["NA","2026-05-25","20380879061","kscb","mpuranik"],
["NA","2026-05-25","20381230381","oyennsri","subhekum"],
["NA","2026-05-25","20380672091","chittajc","ancsingh"],
["NA","2026-05-25","20380996971","gdprasad","mrinshah"],
["NA","2026-05-25","20381212831","mahvfati","kurmagad"],
["NA","2026-05-25","20381070821","menduy","mpuranik"],
["NA","2026-05-27","20395570451","vangalap","aksjais"],
["EU","2026-05-29","12648875582","odsharma","nmmylava"],
["EU","2026-05-26","12632700292","mutsagar","ynnikith"],
["EU","2026-05-29","12648896062","odsharma","nmmylava"],
["EU","2026-05-29","12647257482","mutsagar","ynnikith"],
["EU","2026-05-25","12628473232","kummukav","nsreerag"],
["EU","2026-05-26","12634776432","kotesa","kurmagad"],
["EU","2026-05-26","12634504502","vvasala","subhekum"],
["EU","2026-05-24","12626134232","maraasho","augubabu"],
["EU","2026-05-24","12623154802","wsatyasw","mpuranik"],
["EU","2026-05-25","12626086222","hepzidu","ynnikith"],
["EU","2026-05-26","12634647612","namineni","subhekum"],
["EU","2026-05-23","12624157292","pavantru","subhekum"],
["EU","2026-05-27","12635966242","bondisri","ancsingh"],
["EU","2026-05-23","12625325112","pulivarv","ahujadiv"],
["EU","2026-05-27","12633123102","theerdha","ynnikith"],
["EU","2026-05-24","12625107232","dasven","ancsingh"],
["EU","2026-05-24","12626364502","jayasyan","bossayan"],
["EU","2026-05-26","12635392292","hepzidu","ynnikith"],
["EU","2026-05-25","12626770522","kranjich","bossayan"],
["EU","2026-05-24","12626433992","saibodhu","kurmagad"],
["EU","2026-05-26","12634446792","bonjaswo","kurmagad"],
["EU","2026-05-23","12623754432","kothrish","mpuranik"],
["NA","2026-05-27","20400004721","sharmshr","aksjais"],
["EU","2026-05-24","12626255952","sirshra","subhekum"],
["NA","2026-05-25","20381136451","bhdara","aksjais"],
["EU","2026-05-24","12624312332","usabedi","thambido"],
["NA","2026-05-27","20392924871","varmkeyu","mkumrtq"],
["EU","2026-05-23","12626376582","bharaujo","kurmagad"],
["EU","2026-05-25","12627695852","venkota","mkumrtq"],
["NA","2026-05-25","20378664801","hemkakii","mkumrtq"],
["NA","2026-05-25","20381256981","venklokh","kurmagad"],
["EU","2026-05-23","12623802372","empavan","ahujadiv"],
["EU","2026-05-27","12638095422","chanilan","nmmylava"],
["EU","2026-05-25","12627437632","varmsoni","ynnikith"],
["NA","2026-05-25","20380745711","sshrea","ancsingh"],
["EU","2026-05-27","12635186432","patnasa","ynnikith"],
["NA","2026-05-27","20400864881","vudayana","aksjais"],
["NA","2026-05-25","20378532831","ahmduhm","thambido"],
["EU","2026-05-25","12629090342","admbadam","kurmagad"],
["NA","2026-05-25","20378742971","pulalekh","kampatis"],
["NA","2026-05-25","20381187841","menduy","mpuranik"],
["NA","2026-05-25","20380541501","turumelh","nsreerag"],
["NA","2026-05-25","20380803011","chittajc","ancsingh"],
["EU","2026-05-27","12634868012","patnasa","ynnikith"],
["NA","2026-05-27","20402155571","knaveend","aksjais"],
["NA","2026-05-24","20375953851","khajakal","mpuranik"],
["NA","2026-05-27","20402513341","knaveend","aksjais"],
["NA","2026-05-25","20380559711","atifhsn","nsreerag"],
["NA","2026-05-25","20380680411","sshrea","ancsingh"],
["EU","2026-05-25","12627390232","nandunb","ynnikith"],
["EU","2026-05-24","12625093492","shivayvc","augubabu"],
["EU","2026-05-26","12634655392","vvasala","subhekum"],
["NA","2026-05-27","20394911621","saipkuma","kampatis"],
["NA","2026-05-25","20381006821","kadgnana","kurmagad"],
["NA","2026-05-25","20378481051","fareedhm","kampatis"],
["NA","2026-05-25","20375932161","mirhalik","kurmagad"],
["EU","2026-05-23","12623828992","saistaru","subhekum"],
["NA","2026-05-25","20378559691","hemkakii","mkumrtq"],
["EU","2026-05-23","12623328652","dcharsai","ahujadiv"],
["NA","2026-05-27","20394907641","susgadda","kampatis"],
["NA","2026-05-25","20378507941","qkuathul","thambido"],
["NA","2026-05-25","20381165061","yharsred","subhekum"],
["NA","2026-05-25","20380676011","vinodkrv","aksjais"],
["EU","2026-05-24","12624034032","wannekac","ancsingh"],
["EU","2026-05-26","12634490102","kothrish","mpuranik"],
["EU","2026-05-25","12626448902","vsandepp","mkumrtq"],
["NA","2026-05-25","20380623351","atifhsn","nsreerag"],
["EU","2026-05-27","12636210072","ikoppula","ynnikith"],
["NA","2026-05-25","20381101321","bhdara","aksjais"],
["NA","2026-05-27","20394856371","saipkuma","kampatis"],
["EU","2026-05-27","12636159082","theerdha","ynnikith"],
["NA","2026-05-27","20396216501","atkamesw","kampatis"],
["NA","2026-05-27","20400762991","sharmshr","aksjais"],
["NA","2026-05-27","20393307461","varmkeyu","mkumrtq"],
["NA","2026-05-27","20396107401","sultahee","kampatis"],
["NA","2026-05-25","20379220391","utahura","nsreerag"],
["EU","2026-05-26","12634801902","yashhuu","nmmylava"],
["EU","2026-05-24","12626285942","vjamazon","padakank"],
["NA","2026-05-27","20394924501","krthbb","thambido"],
["NA","2026-05-27","20393613591","raoadit","thambido"],
["NA","2026-05-25","20378978011","utahura","nsreerag"],
["NA","2026-05-25","20380852281","vinodkrv","aksjais"],
["NA","2026-05-25","20380933501","samagys","kurmagad"],
["EU","2026-05-26","12634713082","manpauls","nmmylava"],
["EU","2026-05-26","12634207562","kakandur","ynnikith"],
["NA","2026-05-25","20380222291","mshaas","ancsingh"],
["NA","2026-05-25","20380519081","turumelh","nsreerag"],
["NA","2026-05-25","20378861001","omamdasi","kampatis"],
["NA","2026-05-25","20381115961","kadgnana","kurmagad"],
["NA","2026-05-25","20378807191","omamdasi","kampatis"],
["EU","2026-05-24","12626487432","srujeeth","mrinshah"],
["NA","2026-05-25","20380626541","mshaas","ancsingh"],
["NA","2026-05-25","20376022381","mirhalik","kurmagad"],
["NA","2026-05-27","20395086421","nudurupa","kampatis"],
["NA","2026-05-27","20395072261","susgadda","kampatis"],
["EU","2026-05-24","12625555922","shrisai","ancsingh"],
["EU","2026-05-27","12636478832","saiprsad","aksjais"],
["EU","2026-05-27","12635362542","ikoppula","ynnikith"],
["EU","2026-05-24","12626430542","namineni","subhekum"],
["EU","2026-05-26","12634557362","admbadam","kurmagad"],
["NA","2026-05-25","20381251541","mahvfati","kurmagad"],
["NA","2026-05-27","20403432421","samagys","kurmagad"],
["EU","2026-05-26","12632091912","chethucs","nmmylava"],
["EU","2026-05-27","12635243662","bhagatth","bossayan"],
["NA","2026-05-25","20378904711","mkhanwr","mkumrtq"],
["NA","2026-05-25","20381220711","kscb","mpuranik"],
["NA","2026-05-25","20378574131","qkuathul","thambido"],
["NA","2026-05-25","20380838881","venklokh","kurmagad"],
["NA","2026-05-25","20381159701","gdprasad","mrinshah"],
["NA","2026-05-27","20396138791","atkamesw","kampatis"],
["NA","2026-05-27","20393559651","asmsingh","ancsingh"],
["NA","2026-05-25","20378745991","baigvmir","kampatis"],
["NA","2026-05-27","20403389411","harjgang","ahujadiv"],
["NA","2026-05-25","20381094691","oyennsri","subhekum"],
["NA","2026-05-27","20395249641","nudurupa","kampatis"],
["NA","2026-05-27","20403223251","harjgang","ahujadiv"],
["NA","2026-05-25","20378784311","ahmduhm","thambido"],
["EU","2026-05-23","12624200562","akkaal","ahujadiv"],
["EU","2026-05-24","12625034582","sidtabas","bossayan"],
["EU","2026-05-27","12635234932","akhilui","ynnikith"],
["EU","2026-05-26","12632361092","abiabs","nmmylava"],
["EU","2026-05-27","12636030622","usabedi","thambido"],
["EU","2026-05-24","12626265662","kinthali","mrinshah"],
["EU","2026-05-24","12624694932","sidtabas","bossayan"],
["EU","2026-05-24","12623913302","ttanmoyd","nsreerag"],
["EU","2026-05-24","12624257262","jayasyan","bossayan"],
["EU","2026-05-24","12626360952","inthiazv","augubabu"],
["EU","2026-05-23","12625253872","ndommeti","bossayan"],
["EU","2026-05-26","12632442372","saican","kurmagad"],
["EU","2026-05-25","12627954512","vjamazon","padakank"],
["EU","2026-05-26","12631496952","kranjich","bossayan"],
["EU","2026-05-24","12623294022","gouthmad","ynnikith"],
["EU","2026-05-25","12627223002","nandunb","ynnikith"],
["EU","2026-05-25","12627580192","chethucs","nmmylava"],
["EU","2026-05-25","12626591912","madibp","nsreerag"],
["EU","2026-05-26","12632148142","viineeth","nmmylava"],
["EU","2026-05-26","12633594902","manpauls","nmmylava"],
["EU","2026-05-26","12634999682","pparthee","nmmylava"],
["EU","2026-05-26","12634177182","mahreen","nsreerag"],
["EU","2026-05-24","12623155582","bonjaswo","kurmagad"],
["EU","2026-05-25","12628971052","kummukav","nsreerag"],
["EU","2026-05-25","12626893372","bodjyoth","ynnikith"],
["EU","2026-05-25","12627360442","vijachag","mkumrtq"],
["EU","2026-05-27","12637049112","abiabs","nmmylava"],
["EU","2026-05-26","12633479052","khandenn","nmmylava"],
["EU","2026-05-23","12626273282","ellarish","ahujadiv"],
["EU","2026-05-24","12623916192","saibodhu","kurmagad"],
["EU","2026-05-25","12628959202","ttanmoyd","nsreerag"],
["EU","2026-05-26","12632888042","bggunda","augubabu"],
["EU","2026-05-24","12626500162","dcharsai","ahujadiv"],
["EU","2026-05-25","12627139752","pparthee","nmmylava"],
["EU","2026-05-24","12626431442","empavan","ahujadiv"],
["EU","2026-05-24","12626361922","meghpul","ahujadiv"],
["EU","2026-05-25","12626050842","venkota","mkumrtq"],
["EU","2026-05-26","12634444762","sirshra","subhekum"],
["EU","2026-05-24","12626146882","bggunda","augubabu"],
["EU","2026-05-27","12635390952","bhagatth","bossayan"],
["EU","2026-05-24","12624628522","gouthmad","ynnikith"],
["EU","2026-05-23","12624790122","saistaru","subhekum"],
["EU","2026-05-26","12634751642","rishhaab","nmmylava"],
["EU","2026-05-23","12624306102","ahmekal","mpuranik"],
["EU","2026-05-25","12629158492","wsatyasw","mpuranik"],
["EU","2026-05-24","12626232992","wannekac","ancsingh"],
["EU","2026-05-27","12636470722","sreejai","nmmylava"],
["EU","2026-05-24","12626360582","shivayvc","augubabu"],
["EU","2026-05-26","12633065592","bondisri","ancsingh"],
["EU","2026-05-25","12627680942","mummanak","nsreerag"],
["EU","2026-05-24","12626208832","aaindla","ancsingh"],
["EU","2026-05-27","12635731092","akhilui","ynnikith"],
["EU","2026-05-26","12632151292","mahreen","nsreerag"],
["EU","2026-05-26","12634919962","ahmekal","mpuranik"],
["EU","2026-05-26","12633673762","nnikill","nmmylava"],
["EU","2026-05-26","12634711572","potthman","nmmylava"],
["EU","2026-05-24","12626480322","tanishxx","ahujadiv"],
["EU","2026-05-24","12625011612","akkaal","ahujadiv"],
["EU","2026-05-26","12634729352","gouthamy","poojajsh"],
["EU","2026-05-26","12633039962","gouthamy","poojajsh"],
["EU","2026-05-26","12633692232","sreejai","nmmylava"],
["EU","2026-05-24","12626044412","maraasho","augubabu"],
["EU","2026-05-26","12634680372","kotesa","kurmagad"],
["EU","2026-05-26","12632687252","pdsavi","bossayan"],
["EU","2026-05-23","12625792222","ashdarsh","ahujadiv"],
["EU","2026-05-26","12632868942","rishhaab","nmmylava"],
["EU","2026-05-26","12634985812","pavantru","subhekum"],
["EU","2026-05-26","12633789442","yashhuu","nmmylava"],
["EU","2026-05-26","12634288172","khandenn","nmmylava"],
["EU","2026-05-25","12627245822","varmsoni","ynnikith"],
["EU","2026-05-23","12625296132","bharaujo","kurmagad"],
["EU","2026-05-25","12628878522","nnikill","nmmylava"],
["EU","2026-05-25","12627367202","inthiazv","augubabu"],
["EU","2026-05-26","12635247852","saican","kurmagad"],
["EU","2026-05-24","12626233592","aaindla","ancsingh"],
];

// Defect records
const defects = [
  // tanishxx - RRC=No (score 90) - Should have selected correct reason code
  {r:"EU",w:22,d:"2026-05-24",tid:"12624636262",a:"tanishxx",s:"ahujadiv",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rrf:"Should have selected correct reason code while resolving case",
   c3:"Shoud have not used recovery needed reason code for paragon, when OG and REcovery are active"},
  // yharsred - ADM=No (score 80) - CASA details and meta data not annotated
  {r:"NA",w:22,d:"2026-05-25",tid:"20381211421",a:"yharsred",s:"subhekum",dt:"ADHOC Validation",
   adm:"No",ra:"Yes",rrc:"Yes",acc:"Yes",rv:"Yes",df:true,
   af:"CASA details and meta data not annotated",
   c1:"CASA details and meta data not annotated."},
  // ashdarsh - RRC=No (score 90) - Should have selected correct reason code
  {r:"EU",w:22,d:"2026-05-23",tid:"12624854642",a:"ashdarsh",s:"ahujadiv",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rrf:"Should have selected correct reason code while resolving Case",
   c3:"Should have used VRID cancelled-Low volume reason code for paragon, AA used RS-No Actions"},
  // vudayana - ADM=No (score 50) - Should have transferred the case to the correct queue
  {r:"NA",w:22,d:"2026-05-27",tid:"20400388171",a:"vudayana",s:"aksjais",dt:"ADHOC Validation",
   adm:"No",ra:"No",rrc:"No",acc:"No",rv:"No",df:true,
   af:"Should have transferred the case to the correct queue",
   c1:"AA should have transferred the case to the concerned queue as the shipper account wasn't in the scope of RS"},
];

// Build clean records
for (const [r, d, tid, a, s] of rawClean) {
  if (seen.has(tid)) continue;
  seen.add(tid);
  records.push({r, w:22, d, tid, a, s, dt:"ADHOC Validation", adm:"Yes", ra:"Yes", rrc:"Yes", acc:"Yes", rv:"Yes", df:false});
}

// Add defect records
for (const rec of defects) {
  if (seen.has(rec.tid)) continue;
  seen.add(rec.tid);
  records.push(rec);
}

console.log(`Generated ${records.length} unique Week-22 records`);
console.log(`NA: ${records.filter(r=>r.r==='NA').length}, EU: ${records.filter(r=>r.r==='EU').length}`);
console.log(`Defects: ${records.filter(r=>r.df).length}`);

// Inject into both dashboard files
const files = ['dist/index.html', 'dist/dashboard.html'];

for (const file of files) {
  const dashPath = resolve(file);
  let html;
  try { html = readFileSync(dashPath, 'utf8'); } catch(e) { console.log(`SKIP: ${file} not found`); continue; }

  // Find end of RAW_DATA array
  const marker = '];\nconst ROLE_MAPPING';
  let idx = html.indexOf(marker);
  if (idx === -1) {
    // Try alternate marker without newline
    const altMarker = '];const ROLE_MAPPING';
    idx = html.indexOf(altMarker);
    if (idx === -1) {
      // Try finding just the end of RAW_DATA
      const rawEnd = html.indexOf('const ROLE_MAPPING');
      if (rawEnd > 0) {
        // Search backwards for ];
        let searchBack = rawEnd - 1;
        while (searchBack > 0 && html[searchBack] !== ']') searchBack--;
        if (html[searchBack] === ']') {
          idx = searchBack;
        }
      }
    }
  }

  if (idx === -1 || idx < 0) {
    console.error(`Could not find RAW_DATA end marker in ${file}`);
    continue;
  }

  // Insert new records before the closing ]
  const newJson = ',' + records.map(r => JSON.stringify(r)).join(',');
  html = html.slice(0, idx) + newJson + html.slice(idx);

  writeFileSync(dashPath, html, 'utf8');
  console.log(`Injected Week-22 into ${file} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
}
