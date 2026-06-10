import https from 'https';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const seen = new Set();
const records = [];

// Week-17 score-100 records [region, date, caseId, associate, supervisor]
const raw = [
["EU","2026-04-18","12441291882","surekari","ahujadiv"],
["EU","2026-04-22","12452990942","empavan","ahujadiv"],
["EU","2026-04-21","12451490312","ellarish","ahujadiv"],
["EU","2026-04-18","12442387142","schetanc","ahujadiv"],
["EU","2026-04-18","12443711142","sragaren","ahujadiv"],
["EU","2026-04-18","12443683412","schetanc","ahujadiv"],
["EU","2026-04-21","12450583922","ellarish","ahujadiv"],
["EU","2026-04-22","12454374122","empavan","ahujadiv"],
["EU","2026-04-18","12443568092","sragaren","ahujadiv"],
["EU","2026-04-21","12448668292","meghpul","ahujadiv"],
["NA","2026-04-23","20073110911","harjgang","ahujadiv"],
["EU","2026-04-20","12447906832","dcharsai","ahujadiv"],
["EU","2026-04-20","12446498022","ashdarsh","ahujadiv"],
["NA","2026-04-23","20073138511","harjgang","ahujadiv"],
["EU","2026-04-21","12448352662","meghpul","ahujadiv"],
["EU","2026-04-20","12446709542","kurrekr","ahujadiv"],
["EU","2026-04-20","12447405322","ansssn","ahujadiv"],
["EU","2026-04-20","12448066882","pulivarv","ahujadiv"],
["EU","2026-04-20","12447942942","kurrekr","ahujadiv"],
["EU","2026-04-19","12444812942","charannd","ahujadiv"],
["EU","2026-04-18","12442653582","akkaal","ahujadiv"],
["EU","2026-04-19","12443895282","akkaal","ahujadiv"],
["EU","2026-04-20","12448062492","dcharsai","ahujadiv"],
["EU","2026-04-20","12446653702","ashdarsh","ahujadiv"],
["EU","2026-04-18","12443899392","charannd","ahujadiv"],
["EU","2026-04-19","12445039102","gogouth","ahujadiv"],
["EU","2026-04-19","12444901982","gogouth","ahujadiv"],
["EU","2026-04-20","12446603532","ansssn","ahujadiv"],
["EU","2026-04-19","12443385782","tanishxx","ahujadiv"],
["NA","2026-04-25","20088124581","knaveend","aksjais"],
["NA","2026-04-25","20088232451","knaveend","aksjais"],
["EU","2026-04-20","12446996082","tdivyap","aksjais"],
["NA","2026-04-20","20051083151","vinodkrv","aksjais"],
["EU","2026-04-19","12444880702","saiprsad","aksjais"],
["EU","2026-04-20","12447037662","tdivyap","aksjais"],
["NA","2026-04-21","20057571081","vinodkrv","aksjais"],
["NA","2026-04-21","20056577561","bhdara","aksjais"],
["EU","2026-04-19","12444399652","saiprsad","aksjais"],
["EU","2026-04-25","12466484832","wannekac","ancsingh"],
["EU","2026-04-22","12452973492","aaindla","ancsingh"],
["EU","2026-04-23","12458274232","wannekac","ancsingh"],
["EU","2026-04-22","12452656102","aaindla","ancsingh"],
["NA","2026-04-22","20064901161","asmsingh","ancsingh"],
["NA","2026-04-23","20072395821","asmsingh","ancsingh"],
["NA","2026-04-19","20044006141","sshrea","ancsingh"],
["NA","2026-04-20","20051135601","chittajc","ancsingh"],
["NA","2026-04-21","20055543801","chittajc","ancsingh"],
["EU","2026-04-20","12445283342","rohigmah","ancsingh"],
["EU","2026-04-20","12446644312","rohigmah","ancsingh"],
["EU","2026-04-19","12443121252","shrisai","ancsingh"],
["EU","2026-04-19","12444459072","dasven","ancsingh"],
["EU","2026-04-20","12447479732","bondisri","ancsingh"],
["NA","2026-04-19","20044697721","mshaas","ancsingh"],
["NA","2026-04-19","20044072561","mshaas","ancsingh"],
["NA","2026-04-21","20058455251","sshrea","ancsingh"],
["EU","2026-04-21","12450863602","mzu","ancsingh"],
["EU","2026-04-20","12447743272","shrisai","ancsingh"],
["EU","2026-04-19","12444388342","dasven","ancsingh"],
["EU","2026-04-19","12444341942","bondisri","ancsingh"],
["EU","2026-04-20","12446786552","mzu","ancsingh"],
["EU","2026-04-21","12448417052","vijachag","augubabu"],
["EU","2026-04-21","12447892522","vijachag","augubabu"],
["EU","2026-04-21","12449165302","vsandepp","augubabu"],
["NA","2026-04-20","20049184551","beautwne","augubabu"],
["NA","2026-04-21","20054651301","beautwne","augubabu"],
["NA","2026-04-21","20053905871","krthbb","augubabu"],
["NA","2026-04-19","20042749331","ahmduhm","augubabu"],
["NA","2026-04-21","20054019611","krthbb","augubabu"],
["NA","2026-04-19","20042345391","ahmduhm","augubabu"],
["EU","2026-04-21","12447060682","vsandepp","augubabu"],
["EU","2026-04-23","12455285712","samysk","bossayan"],
["EU","2026-04-19","12443743352","kranjich","bossayan"],
["EU","2026-04-23","12455266552","samysk","bossayan"],
["EU","2026-04-21","12449200252","bhagatth","bossayan"],
["EU","2026-04-20","12445037632","kranjich","bossayan"],
["EU","2026-04-21","12448692932","sidtabas","bossayan"],
["EU","2026-04-19","12443977632","sidtabas","bossayan"],
["EU","2026-04-21","12448712322","manikgmr","bossayan"],
["EU","2026-04-19","12442788142","priymogh","bossayan"],
["EU","2026-04-21","12448945652","priymogh","bossayan"],
["EU","2026-04-21","12447098882","manikgmr","bossayan"],
["EU","2026-04-19","12443913212","bhagatth","bossayan"],
["EU","2026-04-19","12444412742","maraasho","hussm"],
["EU","2026-04-19","12444384512","maraasho","hussm"],
["EU","2026-04-21","12449825432","nsaketh","hussm"],
["NA","2026-04-20","20049575191","temzjona","hussm"],
["EU","2026-04-19","12444301262","shivayvc","hussm"],
["EU","2026-04-19","12443053372","shivayvc","hussm"],
["EU","2026-04-20","12445527962","gouthamy","hussm"],
["NA","2026-04-20","20052045691","temzjona","hussm"],
["EU","2026-04-21","12450425552","nsaketh","hussm"],
["EU","2026-04-20","12446626122","inthiazv","hussm"],
["EU","2026-04-20","12447738672","inthiazv","hussm"],
["NA","2026-04-19","20042657431","pulalekh","kampatis"],
["NA","2026-04-19","20043234701","nudurupa","kampatis"],
["NA","2026-04-19","20042636521","susgadda","kampatis"],
["NA","2026-04-19","20043262131","saipkuma","kampatis"],
["NA","2026-04-19","20043510151","saipkuma","kampatis"],
["NA","2026-04-21","20054748591","pulalekh","kampatis"],
["NA","2026-04-21","20054386831","baigvmir","kampatis"],
["NA","2026-04-21","20053983031","bbrni","kampatis"],
["NA","2026-04-21","20053596931","atkamesw","kampatis"],
["NA","2026-04-21","20054808061","omamdasi","kampatis"],
["NA","2026-04-20","20049119131","fareedhm","kampatis"],
["NA","2026-04-21","20054717671","atkamesw","kampatis"],
["NA","2026-04-19","20043472831","susgadda","kampatis"],
["NA","2026-04-20","20048988111","bbrni","kampatis"],
["NA","2026-04-21","20053749981","baigvmir","kampatis"],
["NA","2026-04-20","20049017341","fareedhm","kampatis"],
["NA","2026-04-21","20055100431","omamdasi","kampatis"],
["NA","2026-04-19","20042928621","nudurupa","kampatis"],
["EU","2026-04-20","12448126732","saibodhu","kurmagad"],
["NA","2026-04-21","20059949431","kadgnana","kurmagad"],
["EU","2026-04-20","12447902962","saican","kurmagad"],
["NA","2026-04-22","20067104411","venklokh","kurmagad"],
["NA","2026-04-22","20066551681","venklokh","kurmagad"],
["NA","2026-04-21","20059966371","kadgnana","kurmagad"],
["NA","2026-04-20","20052067081","mahvfati","kurmagad"],
["EU","2026-04-19","12444914082","bharaujo","kurmagad"],
["EU","2026-04-20","12447872202","kotesa","kurmagad"],
["EU","2026-04-19","12442831482","morigm","kurmagad"],
["EU","2026-04-20","12446739532","bonjaswo","kurmagad"],
["EU","2026-04-18","12442599602","bharaujo","kurmagad"],
["NA","2026-04-20","20051590721","samagys","kurmagad"],
["NA","2026-04-19","20045113341","mirhalik","kurmagad"],
["NA","2026-04-20","20051653011","mahvfati","kurmagad"],
["EU","2026-04-20","12446751502","saibodhu","kurmagad"],
["EU","2026-04-19","12444794952","saican","kurmagad"],
["EU","2026-04-20","12448017182","kotesa","kurmagad"],
["NA","2026-04-20","20052077201","samagys","kurmagad"],
["NA","2026-04-19","20045209381","mirhalik","kurmagad"],
["EU","2026-04-20","12446510622","bonjaswo","kurmagad"],
["NA","2026-04-20","20049171731","hemkakii","mkumrtq"],
["EU","2026-04-21","12449661572","venkota","mkumrtq"],
["NA","2026-04-19","20042719171","mkhanwr","mkumrtq"],
["NA","2026-04-19","20043574051","moizu","mkumrtq"],
["NA","2026-04-21","20054760411","varmkeyu","mkumrtq"],
["EU","2026-04-21","12448372942","samories","mkumrtq"],
["NA","2026-04-21","20054978701","moizu","mkumrtq"],
["NA","2026-04-20","20048987011","mkhanwr","mkumrtq"],
["EU","2026-04-21","12448354412","samories","mkumrtq"],
["NA","2026-04-20","20049389441","hemkakii","mkumrtq"],
["EU","2026-04-20","12446261452","venkota","mkumrtq"],
["NA","2026-04-22","20067555391","menduy","mpuranik"],
["EU","2026-04-20","12447850622","gedelahr","mpuranik"],
["NA","2026-04-21","20060258631","menduy","mpuranik"],
["EU","2026-04-19","12442579112","binalish","mpuranik"],
["EU","2026-04-20","12447937452","ksowji","mpuranik"],
["EU","2026-04-19","12444951392","wsatyasw","mpuranik"],
["EU","2026-04-21","12448510522","gedelahr","mpuranik"],
["EU","2026-04-20","12447916782","ksowji","mpuranik"],
["EU","2026-04-19","12444958352","wsatyasw","mpuranik"],
["NA","2026-04-20","20051951231","akifmirz","mpuranik"],
["NA","2026-04-20","20051985671","akifmirz","mpuranik"],
["NA","2026-04-19","20045497561","gdprasad","mpuranik"],
["EU","2026-04-19","12444844302","binalish","mpuranik"],
["NA","2026-04-19","20045445671","khajakal","mpuranik"],
["NA","2026-04-19","20045783431","gdprasad","mpuranik"],
["NA","2026-04-19","20045382611","khajakal","mpuranik"],
["NA","2026-04-19","20046066451","vkasala","mrinshah"],
["NA","2026-04-19","20046441351","vkasala","mrinshah"],
["EU","2026-04-19","12444823312","srujeeth","mrinshah"],
["EU","2026-04-20","12446737702","kothrish","mrinshah"],
["EU","2026-04-21","12448687662","ahmekal","mrinshah"],
["EU","2026-04-19","12444870102","kinthali","mrinshah"],
["EU","2026-04-20","12446767822","kinthali","mrinshah"],
["NA","2026-04-20","20052092891","kscb","mrinshah"],
["EU","2026-04-20","12446685122","ahmekal","mrinshah"],
["NA","2026-04-19","20045115121","pridhvis","mrinshah"],
["NA","2026-04-19","20045738361","pridhvis","mrinshah"],
["EU","2026-04-24","12463900222","odsharma","nmmylava"],
["EU","2026-04-24","12464412372","smadhavy","nmmylava"],
["EU","2026-04-24","12464679932","odsharma","nmmylava"],
["EU","2026-04-24","12465207132","smadhavy","nmmylava"],
["EU","2026-04-22","12454029012","viineeth","nmmylava"],
["EU","2026-04-22","12453663522","viineeth","nmmylava"],
["EU","2026-04-21","12450850802","sreejai","nmmylava"],
["EU","2026-04-20","12446263682","khandenn","nmmylava"],
["EU","2026-04-20","12445940982","abiabs","nmmylava"],
["EU","2026-04-21","12450807372","yashhuu","nmmylava"],
["EU","2026-04-20","12447578042","khandenn","nmmylava"],
["EU","2026-04-21","12450169452","chethucs","nmmylava"],
["EU","2026-04-20","12447889042","manpauls","nmmylava"],
["EU","2026-04-20","12445958892","yashhuu","nmmylava"],
["EU","2026-04-21","12450690172","potthman","nmmylava"],
["EU","2026-04-20","12447616802","abiabs","nmmylava"],
["EU","2026-04-20","12446049872","manpauls","nmmylava"],
["EU","2026-04-21","12450599642","nnikill","nmmylava"],
["EU","2026-04-21","12449401112","pparthee","nmmylava"],
["EU","2026-04-20","12447689922","chanilan","nmmylava"],
["EU","2026-04-20","12446256762","rishhaab","nmmylava"],
["EU","2026-04-21","12448717202","nnikill","nmmylava"],
["EU","2026-04-20","12447078642","pparthee","nmmylava"],
["EU","2026-04-20","12445854962","chethucs","nmmylava"],
["EU","2026-04-21","12449371692","rishhaab","nmmylava"],
["EU","2026-04-21","12450275082","sreejai","nmmylava"],
["EU","2026-04-20","12447108912","kummukav","nsreerag"],
["NA","2026-04-20","20050926841","atifhsn","nsreerag"],
["NA","2026-04-20","20050394931","utahura","nsreerag"],
["NA","2026-04-20","20051734841","turumelh","nsreerag"],
["EU","2026-04-21","12448073922","ttanmoyd","nsreerag"],
["EU","2026-04-19","12444037592","mahreen","nsreerag"],
["NA","2026-04-21","20057195761","utahura","nsreerag"],
["EU","2026-04-19","12444387772","mummanak","nsreerag"],
["EU","2026-04-19","12444502862","mummanak","nsreerag"],
["NA","2026-04-19","20045171801","akbarudy","nsreerag"],
["EU","2026-04-21","12448024022","ttanmoyd","nsreerag"],
["NA","2026-04-20","20050388211","sarasdol","nsreerag"],
["EU","2026-04-21","12450623442","rutukulz","nsreerag"],
["NA","2026-04-19","20044658301","sarasdol","nsreerag"],
["EU","2026-04-19","12444536782","madibp","nsreerag"],
["NA","2026-04-19","20043863311","atifhsn","nsreerag"],
["NA","2026-04-20","20051865001","turumelh","nsreerag"],
["NA","2026-04-19","20043546681","akbarudy","nsreerag"],
["EU","2026-04-20","12446577592","mahreen","nsreerag"],
["EU","2026-04-20","12447855462","madibp","nsreerag"],
["EU","2026-04-21","12450200932","rutukulz","nsreerag"],
["EU","2026-04-20","12447699492","kummukav","nsreerag"],
["EU","2026-04-22","12453965622","bggunda","padakank"],
["NA","2026-04-22","19912448041","kwkxv","padakank"],
["NA","2026-04-19","20043318191","avasdivy","padakank"],
["NA","2026-04-20","20049897801","siravipa","padakank"],
["NA","2026-04-20","20051507381","siravipa","padakank"],
["EU","2026-04-21","12449234092","bggunda","padakank"],
["EU","2026-04-19","12444302552","vjamazon","padakank"],
["NA","2026-04-21","20056254281","snehie","padakank"],
["NA","2026-04-19","20043126781","avasdivy","padakank"],
["NA","2026-04-21","20055003951","abuzars","padakank"],
["NA","2026-04-20","20049792741","abuzars","padakank"],
["NA","2026-04-21","20057905011","snehie","padakank"],
["EU","2026-04-25","12465854902","kotteda","shrmaam"],
["EU","2026-04-25","12465780892","kotteda","shrmaam"],
["EU","2026-04-21","12447693512","dmeghak","shrmaam"],
["EU","2026-04-21","12447448022","dmeghak","shrmaam"],
["EU","2026-04-21","12451660672","sirshra","subhekum"],
["EU","2026-04-21","12451774782","sirshra","subhekum"],
["EU","2026-04-19","12443302882","vvasala","subhekum"],
["NA","2026-04-19","20044845561","yharsred","subhekum"],
["NA","2026-04-19","20046060321","vennelgo","subhekum"],
["NA","2026-04-20","20051697231","oyennsri","subhekum"],
["EU","2026-04-20","12448094362","tvennela","subhekum"],
["EU","2026-04-19","12444861332","pavantru","subhekum"],
["EU","2026-04-20","12446490462","tvennela","subhekum"],
["EU","2026-04-18","12442572982","pavantru","subhekum"],
["EU","2026-04-20","12446168512","sknasar","subhekum"],
["EU","2026-04-19","12444848422","vvasala","subhekum"],
["NA","2026-04-20","20051901161","yharsred","subhekum"],
["NA","2026-04-19","20046138181","vennelgo","subhekum"],
["NA","2026-04-20","20051091441","oyennsri","subhekum"],
["EU","2026-04-20","12447856752","namineni","subhekum"],
["EU","2026-04-20","12446593512","sknasar","subhekum"],
["EU","2026-04-21","12446998272","namineni","subhekum"],
["EU","2026-04-18","12442744022","saistaru","subhekum"],
["NA","2026-04-21","20055217081","sydsaa","thambido"],
["NA","2026-04-20","20049197891","qkuathul","thambido"],
["EU","2026-04-18","12442653482","usabedi","thambido"],
["EU","2026-04-19","12443969592","usabedi","thambido"],
["NA","2026-04-21","20055164751","sydsaa","thambido"],
["EU","2026-04-18","12442371012","bodjyoth","ynnikith"],
["EU","2026-04-18","12443223772","bodjyoth","ynnikith"],
["EU","2026-04-19","12444014392","varmsoni","ynnikith"],
["EU","2026-04-19","12443869792","patnasa","ynnikith"],
["EU","2026-04-21","12447488182","ctdavid","ynnikith"],
["EU","2026-04-21","12449000382","kakandur","ynnikith"],
["EU","2026-04-19","12442766712","gouthmad","ynnikith"],
["EU","2026-04-21","12449205362","theerdha","ynnikith"],
["EU","2026-04-18","12443793842","varmsoni","ynnikith"],
["EU","2026-04-21","12447596922","theerdha","ynnikith"],
["EU","2026-04-21","12448697192","kakandur","ynnikith"],
["EU","2026-04-21","12449490252","gouthmad","ynnikith"],
["EU","2026-04-19","12444073942","nandunb","ynnikith"],
["EU","2026-04-21","12448477962","ctdavid","ynnikith"],
["EU","2026-04-19","12444072642","nandunb","ynnikith"],
["EU","2026-04-21","12449487512","kpallavr","ynnikith"],
["EU","2026-04-21","12449031492","hepzidu","ynnikith"],
["EU","2026-04-21","12447209342","patnasa","ynnikith"],
["EU","2026-04-21","12449570042","hepzidu","ynnikith"],
["EU","2026-04-19","12444017612","ikoppula","ynnikith"],
["EU","2026-04-21","12449652552","akhilui","ynnikith"],
["EU","2026-04-21","12447480642","ikoppula","ynnikith"],
["EU","2026-04-21","12447642562","kpallavr","ynnikith"],
["EU","2026-04-21","12449191822","akhilui","ynnikith"],
];

// Defect records for Week-17
const defects = [
  // tanishxx - ahujadiv - score 70 - RA=No, RRC=No
  {r:"EU",w:17,d:"2026-04-19",tid:"12443767712",a:"tanishxx",s:"ahujadiv",dt:"ADHOC Validation",
   adm:"Yes",ra:"No",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rf:"Should have utilized RS validator tool",
   rrf:"Should have selected correct reason code while resolving Case",
   c2:"1. Should have validated the case using CARS/CASA, AA directly replied as recovery needed\n2. Recovery needed reason code should be used when CASA/CARS denied request.",
   c3:"Should have selected correct reason code while resolving Case"},
  // pulivarv - ahujadiv - score 80 - RA=No (ACC mapped as SW adherence)
  {r:"EU",w:17,d:"2026-04-20",tid:"12446687582",a:"pulivarv",s:"ahujadiv",dt:"ADHOC Validation",
   adm:"Yes",ra:"No",rrc:"Yes",acc:"Yes",rv:"Yes",df:true,
   rf:"Should have utilized RS validator tool",
   c2:"SW: 16. MILK RUN SOP, should have validated the case"},
  // bhdara - aksjais - score 90 - RRC=No
  {r:"NA",w:17,d:"2026-04-19",tid:"20044463461",a:"bhdara",s:"aksjais",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rrf:"Should have selected correct reason code while resolving case",
   c3:"AA should have selected correct reason code while resolving the case as per CARS Validator decision - Adhoc - Exception"},
  // gouthamy - hussm - score 80 - ACC=No
  {r:"EU",w:17,d:"2026-04-20",tid:"12446519812",a:"gouthamy",s:"hussm",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"Yes",acc:"No",rv:"Yes",df:true,
   acf:"Should have annotated details of RS validator tool",
   c4:"SW: CARS TOOL annotations sheet for duplicate cases check and CASA applicability."},
  // varmkeyu - mkumrtq - score 50 - ADM=No
  {r:"NA",w:17,d:"2026-04-21",tid:"20054986051",a:"varmkeyu",s:"mkumrtq",dt:"ADHOC Validation",
   adm:"No",ra:"Yes",rrc:"Yes",acc:"Yes",rv:"Yes",df:true,
   af:"Should have moved case to correct queue",
   c1:"AA should have transferred the case to the correct queue"},
  // kothrish - mrinshah - score 50 - ADM=No
  {r:"EU",w:17,d:"2026-04-20",tid:"12446777182",a:"kothrish",s:"mrinshah",dt:"ADHOC Validation",
   adm:"No",ra:"Yes",rrc:"Yes",acc:"Yes",rv:"Yes",df:true,
   af:"Should not have pushed back case when adhoc was needed",
   c1:"CORR lane, should have added adhoc without validation\nSW: Special case - CORR lanes"},
  // kscb - mrinshah - score 90 - RRC=No
  {r:"NA",w:17,d:"2026-04-20",tid:"20052009061",a:"kscb",s:"mrinshah",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rrf:"Should have selected correct reason code while resolving case",
   c3:"AA should have selected correct reason code as per CASA SOP. It should be RS Validator Decision- Volume"},
  // srujeeth - mrinshah - score 80 - ACC=No
  {r:"EU",w:17,d:"2026-04-19",tid:"12444987952",a:"srujeeth",s:"mrinshah",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"Yes",acc:"No",rv:"Yes",df:true,
   acf:"Should have annotated details of RS validator tool",
   c4:"SW:CARS TOOL annotations sheet for duplicate cases check and CASA applicability."},
  // potthman - nmmylava - score 80 - ACC=No
  {r:"EU",w:17,d:"2026-04-21",tid:"12450404072",a:"potthman",s:"nmmylava",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"Yes",acc:"No",rv:"Yes",df:true,
   acf:"Should have annotated details of RS validator tool",
   c4:"SW: CARS TOOL annotations sheet for duplicate cases check and CASA applicability."},
  // chanilan - nmmylava - score 90 - RRC=No
  {r:"EU",w:17,d:"2026-04-20",tid:"12447483772",a:"chanilan",s:"nmmylava",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rrf:"Should have selected correct reason code while resolving Case",
   c3:"Tool suggested Did not Add-> RS Validator Decision- Volume, AA used RS Validator Decision- DEA Cost for paragon"},
  // vjamazon - padakank - score 80 - RA=No
  {r:"EU",w:17,d:"2026-04-19",tid:"12444404742",a:"vjamazon",s:"padakank",dt:"ADHOC Validation",
   adm:"Yes",ra:"No",rrc:"Yes",acc:"Yes",rv:"Yes",df:true,
   rf:"Should have utilized RS validator tool",
   c2:"RS bid raised >1hr, AA should have validated the case"},
  // saistaru - subhekum - score 80 - ACC=No
  {r:"EU",w:17,d:"2026-04-18",tid:"12443828152",a:"saistaru",s:"subhekum",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"Yes",acc:"No",rv:"Yes",df:true,
   acf:"Should have annotated details of RS tool validator",
   c4:"SW: CARS TOOL annotations sheet for duplicate cases check and CASA applicability."},
  // qkuathul - thambido - score 90 - RRC=No
  {r:"NA",w:17,d:"2026-04-19",tid:"20042675651",a:"qkuathul",s:"thambido",dt:"ADHOC Validation",
   adm:"Yes",ra:"Yes",rrc:"No",acc:"Yes",rv:"Yes",df:true,
   rrf:"Should have selected correct reason code while resolving Case",
   c3:"A should have selected correct reason code while resolving the case as per CASA SOP."},
];

// Build records
for (const [r, d, tid, a, s] of raw) {
  if (seen.has(tid)) continue;
  seen.add(tid);
  records.push({r, w:17, d, tid, a, s, dt:"ADHOC Validation", adm:"Yes", ra:"Yes", rrc:"Yes", acc:"Yes", rv:"Yes", df:false});
}
for (const rec of defects) {
  if (seen.has(rec.tid)) continue;
  seen.add(rec.tid);
  records.push(rec);
}

console.log(`Generated ${records.length} unique Week-17 records`);
console.log(`  - Clean: ${records.filter(r=>!r.df).length}`);
console.log(`  - Defects: ${records.filter(r=>r.df).length}`);

// Inject into dashboard
const dashPath = resolve('dist/dashboard.html');
let dashHtml = readFileSync(dashPath, 'utf8');
const marker = '];\nconst ROLE_MAPPING';
const idx = dashHtml.indexOf(marker);
if (idx === -1) { console.error('Marker not found'); process.exit(1); }

const newJson = ',' + records.map(r => JSON.stringify(r)).join(',');
dashHtml = dashHtml.slice(0, idx) + newJson + dashHtml.slice(idx);
writeFileSync(dashPath, dashHtml, 'utf8');
writeFileSync(resolve('dist/index.html'), dashHtml, 'utf8');
console.log('Injected into dashboard.html & index.html');

// Push to GitHub
const token = 'YOUR_GITHUB_TOKEN_HERE';
const owner = 'RSOB-RQM';
const repo = 'Quality-Report';

function apiCall(method, path, body) {
  return new Promise((res, rej) => {
    const opts = { hostname:'api.github.com', path, method, headers:{'Authorization':'token '+token,'User-Agent':'node','Accept':'application/vnd.github+json'} };
    if(body) opts.headers['Content-Type']='application/json';
    const req = https.request(opts, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res({status:r.statusCode,data:JSON.parse(d)})}catch{res({status:r.statusCode,data:d})} }); });
    req.on('error', rej);
    if(body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function push() {
  console.log('\nPushing to GitHub...');
  const fc = readFileSync(resolve('dist/index.html'));
  const b64 = fc.toString('base64');
  console.log(`File: ${(fc.length/1024).toFixed(0)} KB`);
  let sha = null;
  let r = await apiCall('GET', `/repos/${owner}/${repo}/contents/index.html`);
  if (r.status === 200) sha = r.data.sha;
  const body = { message: 'Add Week-17 audit data (13 defects, 283 total)', content: b64 };
  if (sha) body.sha = sha;
  r = await apiCall('PUT', `/repos/${owner}/${repo}/contents/index.html`, body);
  if (r.status === 200 || r.status === 201) console.log('✅ Deployed! https://RSOB-RQM.github.io/Quality-Report/');
  else console.log('Failed:', r.status, JSON.stringify(r.data).substring(0, 300));
}
push().catch(e => console.error(e.message));


