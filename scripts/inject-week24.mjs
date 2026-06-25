import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Week-24 records from RSOB audit data
// Zeus export format: score 100 = no defect, <100 = defect
const seen = new Set();
const records = [];

// All score-100 (no defect) records: [region, date, caseId, associate, supervisor]
const raw = [
// EU records
["EU","2026-06-08","12763406882","bsteja","aksjais"],
["EU","2026-06-08","12703983632","inthiazv","augubabu"],
["EU","2026-06-08","12757576342","bonjaswo","subhekum"],
["EU","2026-06-09","12777822442","hmehvish","aksjais"],
["EU","2026-06-08","12765449232","bodjyoth","ynnikith"],
["EU","2026-06-09","12785404972","chethucs","nmmylava"],
["EU","2026-06-08","12764910132","gouthamy","poojajsh"],
["EU","2026-06-08","12765426452","dasven","ancsingh"],
["EU","2026-06-08","12765142312","alsurya","aksjais"],
["EU","2026-06-08","12704764552","kinthali","mrinshah"],
["EU","2026-06-07","12726635292","hepzidu","ynnikith"],
["EU","2026-06-08","12733390772","kinthali","mrinshah"],
["EU","2026-06-08","12764023712","jyonavi","aksjais"],
["EU","2026-06-08","12750341432","khandenn","nmmylava"],
["EU","2026-06-08","12764702612","koppkee","aksjais"],
["EU","2026-06-08","12764632802","kavvyyah","aksjais"],
["EU","2026-06-09","12779574332","ellasaim","aksjais"],
["EU","2026-06-08","12763544392","chanilan","nmmylava"],
["EU","2026-06-08","12764675722","jyonavi","aksjais"],
["EU","2026-06-07","12725859962","inthiazv","augubabu"],
["EU","2026-06-09","12784073372","abiabs","nmmylava"],
["EU","2026-06-08","12763599962","kaakkapo","aksjais"],
["EU","2026-06-08","12764397912","khandenn","nmmylava"],
["EU","2026-06-09","12768957742","bggunda","augubabu"],
["EU","2026-06-08","12767999582","dasven","ancsingh"],
["EU","2026-06-08","12765096762","akhilui","ynnikith"],
["EU","2026-06-08","12710162912","kotesa","kurmagad"],
["EU","2026-06-08","12763981962","ikoppula","ynnikith"],
["EU","2026-06-08","12767430992","bondisri","ancsingh"],
["EU","2026-06-08","12765557042","ishasiri","aksjais"],
["EU","2026-06-08","12740714552","kakandur","ynnikith"],
["EU","2026-06-09","12796230412","bsteja","aksjais"],
["EU","2026-06-08","12765033752","hepzidu","ynnikith"],
["EU","2026-06-08","12763910502","gopsaich","aksjais"],
["EU","2026-06-08","12764499672","akhilsut","aksjais"],
["EU","2026-06-08","12767705862","ikoppula","ynnikith"],
["EU","2026-06-09","12796323832","gopsaich","aksjais"],
["EU","2026-06-08","12765291742","hmehvish","aksjais"],
["EU","2026-06-08","12765497462","akhilsut","aksjais"],
["EU","2026-06-08","12727890602","bonjaswo","subhekum"],
["EU","2026-06-08","12765096772","bhagatth","bossayan"],
["EU","2026-06-09","12796990572","bharaujo","kurmagad"],
["EU","2026-06-09","12766244572","admbadam","kurmagad"],
["EU","2026-06-09","12805199832","ishasiri","aksjais"],
["EU","2026-06-09","12784614302","ellasaim","aksjais"],
["EU","2026-06-08","12765830952","jayasyan","bossayan"],
["EU","2026-06-08","12746036612","kotesa","kurmagad"],
["EU","2026-06-08","12768137322","ellarish","ahujadiv"],
["EU","2026-06-09","12774502302","kavvyyah","aksjais"],
["EU","2026-06-11","12869972712","rishhaab","nmmylava"],
["EU","2026-06-11","12875876802","rishhaab","nmmylava"],
["EU","2026-06-09","12769100242","nandunb","ynnikith"],
["EU","2026-06-10","12820708532","vsandepp","mkumrtq"],
["EU","2026-06-10","12863343982","ksidmoha","aksjais"],
["EU","2026-06-12","12880511822","odsharma","nmmylava"],
["EU","2026-06-12","12875826862","binalish","nmmylava"],
["EU","2026-06-12","12864956622","odsharma","nmmylava"],
["EU","2026-06-12","12878222972","binalish","nmmylava"],
["EU","2026-06-08","12725192802","manpauls","nmmylava"],
["EU","2026-06-09","12783707122","udaylp","aksjais"],
["EU","2026-06-10","12863472892","udaykiri","aksjais"],
["EU","2026-06-09","12789671502","madibp","nsreerag"],
["EU","2026-06-09","12812406122","usabedi","thambido"],
["EU","2026-06-10","12845359882","screddi","aksjais"],
["EU","2026-06-10","12813103912","dmeghak","shrmaam"],
["EU","2026-06-09","12785868402","saistaru","subhekum"],
["EU","2026-06-08","12764105192","nnikill","nmmylava"],
["EU","2026-06-09","12803258282","sreejai","nmmylava"],
["EU","2026-06-10","12814082072","kothrish","mpuranik"],
["EU","2026-06-09","12811997762","rutukulz","nsreerag"],
["EU","2026-06-08","12765534772","mukkalaa","aksjais"],
["EU","2026-06-08","1117LM9CY","viineeth","nmmylava"],
["EU","2026-06-10","12850929632","dmeghak","shrmaam"],
["EU","2026-06-07","12727410272","kummukav","nsreerag"],
["EU","2026-06-08","12764024822","yashhuu","nmmylava"],
["EU","2026-06-09","12770135132","priyaren","bossayan"],
["EU","2026-06-07","12704922802","kranjich","bossayan"],
["EU","2026-06-09","12792269102","rutukulz","nsreerag"],
["EU","2026-06-09","12787754182","simeondc","aksjais"],
["EU","2026-06-09","12811307812","wannekac","ancsingh"],
["EU","2026-06-08","12765352242","usabedi","thambido"],
["EU","2026-06-09","12786434982","pbiyyala","aksjais"],
["EU","2026-06-08","12764098802","ndommeti","bossayan"],
["EU","2026-06-10","12817543032","saistaru","subhekum"],
["EU","2026-06-10","12813389712","pulivarv","ahujadiv"],
["EU","2026-06-08","12763499162","nnikill","nmmylava"],
["EU","2026-06-10","12818822632","pravling","aksjais"],
["EU","2026-06-09","12768536822","nandunb","ynnikith"],
["EU","2026-06-08","12764216332","udaykiri","aksjais"],
["EU","2026-06-09","12811395312","udaylp","aksjais"],
["EU","2026-06-08","12765132392","samories","mkumrtq"],
["EU","2026-06-08","12716834502","samories","mkumrtq"],
["EU","2026-06-09","12787800842","ttanmoyd","nsreerag"],
["EU","2026-06-08","12768292862","mummanak","nsreerag"],
["EU","2026-06-08","12762941942","namineni","subhekum"],
["EU","2026-06-09","12811766332","shrisai","ancsingh"],
["EU","2026-06-08","12765521702","tdugyala","aksjais"],
["EU","2026-06-08","12765513142","pravling","aksjais"],
["EU","2026-06-08","12763716782","varmsoni","ynnikith"],
["EU","2026-06-10","12864377452","kpallavr","ynnikith"],
["EU","2026-06-10","12864783672","sreejai","nmmylava"],
["EU","2026-06-09","12780007862","sirshra","subhekum"],
["EU","2026-06-08","12763657952","potthman","nmmylava"],
["EU","2026-06-07","12722156262","kranjich","bossayan"],
["EU","2026-06-08","12750496502","vvasala","subhekum"],
["EU","2026-06-10","12809498782","sirshra","subhekum"],
["EU","2026-06-08","12751826532","simeondc","aksjais"],
["EU","2026-06-08","12763912102","namineni","subhekum"],
["EU","2026-06-09","12808813282","kottetis","aksjais"],
["EU","2026-06-08","12765407422","kothrish","mpuranik"],
["EU","2026-06-08","12765268292","shivayvc","augubabu"],
["EU","2026-06-09","12783891572","pparthee","nmmylava"],
["EU","2026-06-10","12824603152","mekateja","aksjais"],
["EU","2026-06-08","12764201482","ttanmoyd","nsreerag"],
["EU","2026-06-08","12765286372","wsatyasw","mpuranik"],
["EU","2026-06-10","12867210982","tdugyala","aksjais"],
["EU","2026-06-08","12767593562","saiprsad","aksjais"],
["EU","2026-06-08","12763910222","mekateja","aksjais"],
["EU","2026-06-10","12853559912","yashhuu","nmmylava"],
["EU","2026-06-09","12796991362","madibp","nsreerag"],
["EU","2026-06-08","12744358932","saican","kurmagad"],
["EU","2026-06-08","12728083942","tvennela","subhekum"],
["EU","2026-06-09","12812382452","ctdavid","ynnikith"],
["EU","2026-06-09","12802189002","mukkalaa","aksjais"],
["EU","2026-06-09","12768745142","saiprsad","aksjais"],
["EU","2026-06-10","12811285232","vsandepp","mkumrtq"],
["EU","2026-06-10","12865725122","kpallavr","ynnikith"],
["EU","2026-06-08","12767770552","mummanak","nsreerag"],
["EU","2026-06-07","12700191362","mahreen","nsreerag"],
["EU","2026-06-10","12817234082","ksidmoha","aksjais"],
["EU","2026-06-10","12812556752","priyaren","bossayan"],
["EU","2026-06-10","12836507142","kottetis","aksjais"],
["EU","2026-06-09","12812337872","shrisai","ancsingh"],
["EU","2026-06-09","12812706732","ndommeti","bossayan"],
["EU","2026-06-09","12797314492","theerdha","ynnikith"],
["EU","2026-06-09","12765100212","maraasho","augubabu"],
["EU","2026-06-07","12724642552","patnasa","ynnikith"],
["EU","2026-06-09","12809628582","pparthee","nmmylava"],
["EU","2026-06-08","12748389742","vvasala","subhekum"],
["EU","2026-06-10","12814294482","pulivarv","ahujadiv"],
["EU","2026-06-09","12812264982","wannekac","ancsingh"],
["EU","2026-06-07","12725028182","rsgnaik","bossayan"],
["EU","2026-06-08","12728578922","pavantru","subhekum"],
["EU","2026-06-08","12757722482","saican","kurmagad"],
["EU","2026-06-09","12769496592","shivayvc","augubabu"],
["EU","2026-06-08","12764240072","potthman","nmmylava"],
["EU","2026-06-08","12754219192","akkaal","ahujadiv"],
["EU","2026-06-09","12765658922","admbadam","kurmagad"],
["EU","2026-06-08","12765342942","abiabs","nmmylava"],
["EU","2026-06-08","12768163932","bggunda","augubabu"],
["EU","2026-06-08","12717455452","akkaal","ahujadiv"],
["EU","2026-06-08","12734702782","chanilan","nmmylava"],
["EU","2026-06-09","12767749752","gouthamy","poojajsh"],
["EU","2026-06-08","12765551502","bondisri","ancsingh"],
["EU","2026-06-08","12765051322","bhagatth","bossayan"],
["EU","2026-06-08","12765436812","akhilui","ynnikith"],
["EU","2026-06-09","12785366632","kaakkapo","aksjais"],
["EU","2026-06-09","12787137712","kakandur","ynnikith"],
["EU","2026-06-09","12784317092","bharaujo","kurmagad"],
["EU","2026-06-08","12765595832","bodjyoth","ynnikith"],
["EU","2026-06-08","12762957392","jayasyan","bossayan"],
["EU","2026-06-08","12763687552","chethucs","ahujadiv"],
["EU","2026-06-08","12764929272","alsurya","aksjais"],
["EU","2026-06-07","12726089712","patnasa","ynnikith"],
["EU","2026-06-07","12724497452","maraasho","augubabu"],
["EU","2026-06-08","12769048202","kummukav","nsreerag"],
["EU","2026-06-09","12770215112","wsatyasw","mpuranik"],
["EU","2026-06-08","12768256772","mahreen","nsreerag"],
["EU","2026-06-09","12794743772","ctdavid","ynnikith"],
["EU","2026-06-08","12763054912","manpauls","nmmylava"],
["EU","2026-06-10","12806331612","tvennela","subhekum"],
["EU","2026-06-07","12703295072","rsgnaik","bossayan"],
["EU","2026-06-08","12765428372","screddi","aksjais"],
["EU","2026-06-08","12764221822","pbiyyala","aksjais"],
["EU","2026-06-09","12811343482","theerdha","ynnikith"],
["EU","2026-06-09","12765268292","shivayvc","augubabu"],
// NA records
["NA","2026-06-10","20693725841","utahura","nsreerag"],
["NA","2026-06-11","20722022311","baigvmir","kampatis"],
["NA","2026-06-06","20512459351","sharmshr","aksjais"],
["NA","2026-06-10","20670290801","ogikezia","aksjais"],
["NA","2026-06-06","20532367471","atifhsn","nsreerag"],
["NA","2026-06-12","20778666981","turumelh","nsreerag"],
["NA","2026-06-08","20603654181","sshrea","ancsingh"],
["NA","2026-06-12","20786863901","qkuathul","thambido"],
["NA","2026-06-10","20670206211","vennelgo","mrinshah"],
["NA","2026-06-07","20556457371","varmkeyu","mkumrtq"],
["NA","2026-06-11","20765236561","omamdasi","kampatis"],
["NA","2026-06-10","20698930271","temzjona","mpuranik"],
["NA","2026-06-11","20734478831","siravipa","padakank"],
["NA","2026-06-11","20730853001","tpadamat","kampatis"],
["NA","2026-06-11","20716895551","pulalekh","kampatis"],
["NA","2026-06-10","20680382131","temzjona","mpuranik"],
["NA","2026-06-11","20720355651","nudurupa","kampatis"],
["NA","2026-06-06","20523511961","sydsaa","thambido"],
["NA","2026-06-08","20600663701","raoadit","thambido"],
["NA","2026-06-10","20671214941","ogikezia","aksjais"],
["NA","2026-06-09","20641362181","omamdasi","kampatis"],
["NA","2026-06-09","20606466811","samagys","subhekum"],
["NA","2026-06-11","20715948161","pridhvis","mrinshah"],
["NA","2026-06-08","20595893991","yharsred","subhekum"],
["NA","2026-06-12","20786997431","nudurupa","kampatis"],
["NA","2026-06-07","20556011331","varmkeyu","mkumrtq"],
["NA","2026-06-11","20755527921","atifhsn","nsreerag"],
["NA","2026-06-12","20781136941","turumelh","nsreerag"],
["NA","2026-06-10","20658394011","susgadda","kampatis"],
["NA","2026-06-08","20598983691","raoadit","thambido"],
["NA","2026-06-12","20786538431","baigvmir","kampatis"],
["NA","2026-06-11","20756903601","sarasdol","nsreerag"],
["NA","2026-06-06","20513396311","sshrea","ancsingh"],
["NA","2026-06-09","20634636471","saipkuma","kampatis"],
["NA","2026-06-11","20755907081","vinodkrv","aksjais"],
["NA","2026-06-11","20717098051","pridhvis","mrinshah"],
["NA","2026-06-07","20546115601","venklokh","kurmagad"],
["NA","2026-06-06","20517204971","sharmshr","aksjais"],
["NA","2026-06-11","20766584561","pulalekh","kampatis"],
["NA","2026-06-11","20746030631","siravipa","padakank"],
["NA","2026-06-09","20644653621","tpadamat","kampatis"],
["NA","2026-06-09","20617071121","srigari","ahujadiv"],
["NA","2026-06-07","20545839081","samagys","subhekum"],
["NA","2026-06-12","20796087361","saipkuma","kampatis"],
["NA","2026-06-09","20639829511","sydsaa","thambido"],
["NA","2026-06-12","20747386641","vennelgo","mrinshah"],
["NA","2026-06-09","20614529761","yharsred","subhekum"],
["NA","2026-06-10","20656349791","kingshur","mrinshah"],
["NA","2026-06-12","20798851661","qkuathul","thambido"],
["NA","2026-06-07","20594686091","utahura","nsreerag"],
["NA","2026-06-12","20792591421","sultahee","kampatis"],
["NA","2026-06-11","20754331291","vinodkrv","aksjais"],
["NA","2026-06-12","20778633831","susgadda","kampatis"],
["NA","2026-06-07","20533813541","venklokh","kurmagad"],
["NA","2026-06-09","20628971631","sarasdol","nsreerag"],
["NA","2026-06-12","20765788911","kingshur","mrinshah"],
["NA","2026-06-09","20615881061","srigari","ahujadiv"],
["NA","2026-06-08","20603946511","bhdara","aksjais"],
["NA","2026-06-09","20607479341","mirhalik","kurmagad"],
["NA","2026-06-09","20615870941","mpitala","aksjais"],
["NA","2026-06-09","20635008191","chittajc","ancsingh"],
["NA","2026-06-08","20600069911","asmsingh","ancsingh"],
["NA","2026-06-09","20621894921","hemkakii","mkumrtq"],
["NA","2026-06-09","20606331791","menduy","mpuranik"],
["NA","2026-06-08","20602401431","beautwne","thambido"],
["NA","2026-06-08","20603533501","mkhanwr","mkumrtq"],
["NA","2026-06-08","20596750871","khajakal","mpuranik"],
["NA","2026-06-08","20605592351","bhdara","aksjais"],
["NA","2026-06-08","20598590121","atkamesw","kampatis"],
["NA","2026-06-13","20816555051","vudayana","aksjais"],
["NA","2026-06-13","20823535251","vkasala","mrinshah"],
["NA","2026-06-13","20823049111","pkommuri","mkumrtq"],
["NA","2026-06-13","20818233011","pkommuri","mkumrtq"],
["NA","2026-06-13","20818031211","vudayana","aksjais"],
["NA","2026-06-13","20818837331","vkasala","mrinshah"],
["NA","2026-06-08","20599973901","hershez","aksjais"],
["NA","2026-06-09","20605792231","menduy","mpuranik"],
["NA","2026-06-08","20604066111","mummalee","aksjais"],
["NA","2026-06-09","20617131771","mahvfati","kurmagad"],
["NA","2026-06-08","20604119671","akbarudy","nsreerag"],
["NA","2026-06-07","20594753381","mshaas","ancsingh"],
["NA","2026-06-08","20603320951","ahmduhm","thambido"],
["NA","2026-06-08","20604198761","chpallu","aksjais"],
["NA","2026-06-09","20635148961","chittajc","ancsingh"],
["NA","2026-06-08","20604250111","chpallu","aksjais"],
["NA","2026-06-08","20600392051","fareedhm","kampatis"],
["NA","2026-06-08","20598454521","kscb","mpuranik"],
["NA","2026-06-08","20600535021","mohhsam","aksjais"],
["NA","2026-06-08","20599919021","mpitala","aksjais"],
["NA","2026-06-08","20602920971","krthbb","thambido"],
["NA","2026-06-09","20604695621","mirhalik","kurmagad"],
["NA","2026-06-08","20594779321","kadgnana","subhekum"],
["NA","2026-06-08","20600500151","hershez","aksjais"],
["NA","2026-06-09","20636111511","ahmduhm","thambido"],
["NA","2026-06-07","20594777211","mshaas","ancsingh"],
["NA","2026-06-08","20604595871","akbarudy","nsreerag"],
["NA","2026-06-09","20611688211","mohhsam","aksjais"],
["NA","2026-06-08","20595834101","atkamesw","kampatis"],
["NA","2026-06-08","20603245541","krthbb","thambido"],
["NA","2026-06-09","20635965961","hemkakii","mkumrtq"],
["NA","2026-06-08","20604635281","mkhanwr","mkumrtq"],
["NA","2026-06-09","20607906021","khajakal","mpuranik"],
["NA","2026-06-08","20604525691","mummalee","aksjais"],
["NA","2026-06-08","20594643351","beautwne","thambido"],
["NA","2026-06-08","20599155031","mahvfati","kurmagad"],
["NA","2026-06-08","20602890381","fareedhm","kampatis"],
["NA","2026-06-08","20595126441","kadgnana","subhekum"],
];

// Defect records (score < 100)
const defects = [
  // asmsingh - ancsingh - NA - RA=No (Should've used the recent RS validator tool version)
  {r:"NA",w:24,d:"2026-06-08",tid:"20600167841",a:"asmsingh",s:"ancsingh",dt:"ADHOC Validation",
   adm:"Yes",ra:"No",rrc:"Yes",acc:"Yes",rv:"Yes",df:true,
   rf:"Should've used the recent RS validator tool version",
   c2:"AA Should've used the recent RS validator tool version"},
  // sultahee - kampatis - NA - RA=No (Should have utilized latest CARS Validator Tool version)
  {r:"NA",w:24,d:"2026-06-10",tid:"20682288601",a:"sultahee",s:"kampatis",dt:"ADHOC Validation",
   adm:"Yes",ra:"No",rrc:"Yes",acc:"Yes",rv:"Yes",df:true,
   rf:"Should have utilized latest CARS Validator Tool version",
   c2:"AA Should have used latest version of CARS Validator"},
  // viineeth - nmmylava - EU - RRC=No (Should have selected correct reason code while raising BID on FMC)
  {r:"EU",w:24,d:"2026-06-08",tid:"12764378682",a:"viineeth",s:"nmmylava",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rf:"Should have selected correct reason code while raising BID on FMC",
   c3:"SOP says Reason code AC High volume, AA used AC reactive scheduling for FMC"},
  // kscb - mpuranik - NA - RA=No (Should've used the recent RS validator tool version)
  {r:"NA",w:24,d:"2026-06-08",tid:"20596938591",a:"kscb",s:"mpuranik",dt:"ADHOC Validation",
   adm:"Yes",ra:"No",rrc:"Yes",acc:"Yes",rv:"Yes",df:true,
   rf:"Should've used the recent RS validator tool version",
   c2:"AA Should've used the recent RS validator tool version"},
  // pavantru - subhekum - EU - RA=No (Should have annotated details of RS tool validator)
  {r:"EU",w:24,d:"2026-06-08",tid:"12765084992",a:"pavantru",s:"subhekum",dt:"ADHOC Validation",
   adm:"Yes",ra:"No",rrc:"Yes",acc:"Yes",rv:"Yes",df:true,
   rf:"Should have annotated details of RS tool validator",
   c2:"CARS TOOL annotations sheet for duplicate cases check and CASA applicability."},
];

// Build JSON records from score-100 entries
for (const [r, d, tid, a, s] of raw) {
  if (seen.has(tid)) continue;
  seen.add(tid);
  records.push({r, w:24, d, tid, a, s, dt:"ADHOC Validation", adm:"Yes", ra:"Yes", rrc:"Yes", acc:"Yes", rv:"Yes", df:false});
}
// Add defect records
for (const rec of defects) {
  if (seen.has(rec.tid)) continue;
  seen.add(rec.tid);
  records.push(rec);
}

const totalRecords = records.length;
const defectCount = defects.length;
const defectRate = ((defectCount / totalRecords) * 100).toFixed(1);

console.log(`Generated ${totalRecords} unique Week-24 records (${defectCount} defects, rate: ${defectRate}%)`);

// Read dist/index.html and inject
const dashPath = resolve('dist/index.html');
let html = readFileSync(dashPath, 'utf8');

// Find end of RAW_DATA array
const marker1 = '];\nconst ROLE_MAPPING';
const marker2 = '];\r\nconst ROLE_MAPPING';
let idx = html.indexOf(marker1);
let markerLen = marker1.length;
if (idx === -1) {
  idx = html.indexOf(marker2);
  markerLen = marker2.length;
}
if (idx === -1) {
  // Try just finding the pattern with any whitespace
  const regex = /\];\s*const ROLE_MAPPING/;
  const match = regex.exec(html);
  if (match) {
    idx = match.index;
    markerLen = match[0].length;
  }
}
if (idx === -1) {
  console.error('Could not find RAW_DATA end marker');
  process.exit(1);
}

// Insert new records before the closing ];
const newJson = ',' + records.map(r => JSON.stringify(r)).join(',');
html = html.slice(0, idx) + newJson + html.slice(idx);

writeFileSync(dashPath, html, 'utf8');
console.log('Successfully injected Week-24 data into dist/index.html');

// Update "Last Updated" text
html = readFileSync(dashPath, 'utf8');
html = html.replace(
  /Last Updated: 18 June 2026 \| Week 23/g,
  'Last Updated: 26 June 2026 | Week 24'
);

// Update trendData array to add week 24
html = html.replace(
  /\{wk:23,rate:0\.7\}\]/,
  `{wk:23,rate:0.7},{wk:24,rate:${defectRate}}]`
);

// Update "Week 16-23" to "Week 16-24"
html = html.replace(/Week 16-23/g, 'Week 16-24');

writeFileSync(dashPath, html, 'utf8');
console.log(`Updated Last Updated to "26 June 2026 | Week 24", trendData with wk:24 rate:${defectRate}, and Week range to 16-24`);
