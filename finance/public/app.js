/* Soramma Finance — app: data store + sync, dashboard, sales, finance, tax, printable documents. */

/* ---------- money & dates ---------- */
var CUR={USD:{sym:"$",dec:2},KHR:{sym:"៛",dec:0}};
function rnd(n,c){var d=CUR[c||"USD"].dec,k=Math.pow(10,d);return Math.round((+n||0)*k+(n<0?-1e-9:1e-9))/k}
function fmt(n,c){c=c||"USD";var d=CUR[c].dec,s=Math.abs(+n||0).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d}),neg=(+n||0)<0&&rnd(n,c)!==0;
 return(neg?"-":"")+(c==="USD"?"$"+s:s+" ៛")}
function pad(n){return("0"+n).slice(-2)}
function isoDate(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function today(){return isoDate(new Date())}
function addDays(iso,n){var d=new Date(iso+"T12:00:00");d.setDate(d.getDate()+n);return isoDate(d)}
function dfmt(iso){return iso&&/^\d{4}-\d{2}-\d{2}$/.test(iso)?iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+iso.slice(0,4):(iso||"")}
function diffDays(a,b){return Math.round((new Date(a+"T12:00:00")-new Date(b+"T12:00:00"))/864e5)}
function monthRange(off){var d=new Date();d=new Date(d.getFullYear(),d.getMonth()+off,1);var e=new Date(d.getFullYear(),d.getMonth()+1,0);return[isoDate(d),isoDate(e)]}
function yearRange(){var y=new Date().getFullYear();return[y+"-01-01",y+"-12-31"]}
function num(v){var n=parseFloat(String(v).replace(/,/g,""));return isFinite(n)?n:0}

/* ---------- data store (records synced to the server) ---------- */
var DB={contact:{},invoice:{},txn:{},account:{},prefs:{}},SINCE=0,OUTBOX=[],BUSY=false,TIMERS=false;
function dbKey(){return"fin_db_"+(ME&&ME.id)}
function loadLocal(){DB={contact:{},invoice:{},txn:{},account:{},prefs:{}};SINCE=0;OUTBOX=[];var o=ME?load(dbKey(),null):null;if(o){DB=o.db||DB;SINCE=o.since||0;OUTBOX=o.out||[];["contact","invoice","txn","account","prefs"].forEach(function(k){DB[k]=DB[k]||{}})}}
function saveLocal(){if(ME)save(dbKey(),{db:DB,since:SINCE,out:OUTBOX})}
function put(kind,id,d){DB[kind][id]=d;OUTBOX=OUTBOX.filter(function(x){return x.id!==id});OUTBOX.push({id:id,kind:kind,d:d});saveLocal();kick()}
function del(kind,id){delete DB[kind][id];OUTBOX=OUTBOX.filter(function(x){return x.id!==id});OUTBOX.push({id:id,kind:kind,del:1});saveLocal();kick()}
var kt=0;function kick(){clearTimeout(kt);kt=setTimeout(function(){flush().then(function(){})},400)}
function flush(){if(!TOK||BUSY||!OUTBOX.length)return Promise.resolve();BUSY=true;var batch=OUTBOX.slice(0,100);
 return api("POST","data",{recs:batch}).then(function(){OUTBOX=OUTBOX.filter(function(x){return batch.indexOf(x)<0});saveLocal();BUSY=false;if(OUTBOX.length)return flush()}).catch(function(e){BUSY=false;errh(e)})}
function pull(){if(!TOK)return Promise.resolve();return api("GET","data?since="+SINCE).then(function(r){var pend={};OUTBOX.forEach(function(x){pend[x.id]=1});
  (r.recs||[]).forEach(function(x){if(pend[x.id])return;if(x.del)delete DB[x.kind][x.id];else DB[x.kind][x.id]=x.d});
  SINCE=r.now;saveLocal();if(r.more)return pull();ensureDefaults();softRender()}).catch(errh)}
function errh(e){if(e&&e.code==="auth")sessionEnd();else if(e&&e.code==="trial_over"&&ME){ME.expired=true;render()}}
function softRender(){if(V.page==="edit"||$("dlg").open)return;render()}
function list(kind){return Object.keys(DB[kind]).map(function(id){var o=DB[kind][id];o.id=id;return o})}
function ensureDefaults(){if(!ME||ME.expired||prefs().seeded||SINCE<=0||OUTBOX.length)return;if(!Object.keys(DB.account).length){["USD","KHR"].forEach(function(c){put("account",rid(),{name:t("acc_cash")+" "+c,type:"cash",cur:c,open:0})})}savePrefs({seeded:1})}
var PD={seeded:0,vat:10,vatNo:"",prefix:"INV-",bprefix:"BILL-",terms:15,pay:"",cur:"USD",vatOn:1,next:1,nextb:1};
function prefs(){var p=DB.prefs.prefs||{},o={};for(var k in PD)o[k]=p[k]==null?PD[k]:p[k];return o}
function savePrefs(patch){var p=prefs();for(var k in patch)p[k]=patch[k];put("prefs","prefs",p)}

/* ---------- documents ---------- */
function calc(lines,rate,cur){var sub=0,vat=0;(lines||[]).forEach(function(l){var a=rnd(num(l.q)*num(l.p),cur);sub+=a;if(l.v)vat+=a*rate/100});return{sub:rnd(sub,cur),vat:rnd(vat,cur),total:rnd(sub+rnd(vat,cur),cur)}}
var PAYC=null;function payMap(){if(PAYC)return PAYC;PAYC={};list("txn").forEach(function(x){if(x.inv)PAYC[x.inv]=(PAYC[x.inv]||0)+num(x.amt)});return PAYC}
function paidOf(inv){return rnd(payMap()[inv.id]||0,inv.cur)}
function balOf(inv){return rnd(inv.total-paidOf(inv),inv.cur)}
function statusOf(inv){var b=balOf(inv);if(b<=0)return"paid";if(inv.due&&inv.due<today())return"overdue";return paidOf(inv)>0?"partial":"unpaid"}
var STC={paid:"ok",unpaid:"",partial:"warn",overdue:"bad"};
function stPill(s){return'<span class="pill '+STC[s]+'">'+esc(t("st_"+s))+"</span>"}
function docs(k){return list("invoice").filter(function(x){return x.k===k&&!x.draft})}
function cname(id){var c=DB.contact[id];return c?c.name:"—"}
function nextNo(k){var p=prefs(),n=k==="sale"?p.next:p.nextb,pre=k==="sale"?p.prefix:p.bprefix;return pre+("0000"+n).slice(-4)}
function bumpNo(k){var p=prefs();if(k==="sale")savePrefs({next:p.next+1});else savePrefs({nextb:p.nextb+1})}
function accBal(a){var b=num(a.open);list("txn").forEach(function(x){if(x.acc===a.id)b+=x.dir==="in"?num(x.amt):-num(x.amt)});return rnd(b,a.cur)}
function sumBy(arr,f,c){return rnd(arr.reduce(function(a,x){return a+f(x)},0),c)}
function curSet(){var s={};list("invoice").forEach(function(x){s[x.cur]=1});list("account").forEach(function(x){s[x.cur]=1});if(!Object.keys(s).length)s[prefs().cur]=1;return Object.keys(s).sort().reverse()}

/* ---------- state & shell ---------- */
var V={tab:"home",sub:{sales:"inv",fin:"bills",tax:"vat"},filt:"all",q:"",page:null,pid:null,ed:null,rep:"pl",per:"month",from:"",to:"",acc:null};
ensurePer();function ensurePer(){var r=monthRange(0);V.from=r[0];V.to=r[1]}
var TABS=[["home","home","nav_home"],["sales","receipt","nav_sales"],["fin","bank","nav_finance"],["tax","percent","nav_tax"]];
P.home='<path d="M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10"/>';P.receipt='<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM8 8h8M8 12h8M8 16h5"/>';P.bank='<path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>';P.percent='<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>';
P.users='<circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2.5.6 4 2.4 4 6"/>';P.wallet='<path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h2"/>';P.chart='<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>';P.briefcase='<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>';P.hr='<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6M17 3l2 2 3-3"/>';P.edit='<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>';P.arrowin='<path d="M12 3v14M6 11l6 6 6-6M4 21h16"/>';P.arrowout='<path d="M12 21V7M6 13l6-6 6 6M4 3h16"/>';P.swap='<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>';
function nav(){$("nav").innerHTML=TABS.map(function(x){return'<button class="'+(V.tab===x[0]&&!V.page?"on":V.tab===x[0]?"on":"")+'" data-t="'+x[0]+'"><span>'+ic(x[1],24)+"</span>"+esc(t(x[2]))+"</button>"}).join("")+'<button data-t="__menu"><span>'+ic("menu",24)+"</span>"+esc(t("nav_menu"))+"</button>";
 $("nav").onclick=function(e){var b=e.target.closest("button");if(!b)return;if(b.dataset.t==="__menu"){openDrawer();return}V.tab=b.dataset.t;V.page=null;render();window.scrollTo(0,0)}}
function openDrawer(){var d=$("drawer");
 d.innerHTML='<div class="dh"><img src="logo-for-dark.svg" alt=""><b>Soramma Finance<small style="display:block;font-weight:400;opacity:.75;font-size:12px">by Soramma</small></b><button id="dx" aria-label="close">'+ic("x",22)+'</button></div>'+
 (ME?'<button class="mi" data-t="__proj">'+ic("briefcase",20)+esc(t("nav_projects"))+' <span class="pill">'+esc(t("soon"))+'</span></button><button class="mi" data-t="__hr">'+ic("hr",20)+esc(t("nav_hr"))+' <span class="pill">'+esc(t("soon"))+"</span></button><hr>":"")+
 '<button class="mi" data-t="__lang">'+ic("globe",20)+esc(t("language"))+" · "+esc((LANGS.filter(function(l){return l[0]===LANG})[0]||["","English"])[1])+"</button>"+
 (ME?'<button class="mi" data-t="__pf">'+ic("sliders",20)+esc(t("pf_title"))+"</button>":"")+
 (ME?'<button class="mi" data-t="__sup">'+ic("send",20)+esc(t("support"))+(SUP&&ME.role!=="owner"?'<span class="dot">'+SUP+"</span>":"")+"</button>":"")+
 (ME&&ME.role==="owner"?'<button class="mi" data-t="__inbox">'+ic("text",20)+esc(t("inbox"))+(SUP?'<span class="dot">'+SUP+"</span>":"")+"</button>":"")+
 (ME?'<button class="mi" data-t="__prof">'+ic("user",20)+esc(t("profile"))+"</button>":"")+
 (ME&&ME.role==="owner"?'<button class="mi" data-t="__set">'+ic("users",20)+esc(t("settings"))+"</button>":"")+
 (ME?'<hr><div style="padding:6px 18px"><b>'+esc(t("signed_as",{n:ME.name}))+'</b>'+(ME.role==="owner"?' <span class="pill ok">ADMIN</span>':"")+'</div><button class="mi" data-t="__logout">'+ic("lock",20)+esc(t("logout"))+"</button>":"")+
 '<div class="muted" style="font-size:12px;padding:12px 18px">'+esc(t("privacy_note"))+"</div>";
 d.onclick=function(e){var b=e.target.closest("button");if(!b)return;if(b.id==="dx"){closeDrawer();return}var k=b.dataset.t;if(!k)return;closeDrawer();
  if(k==="__lang")langDialog(false);else if(k==="__set")settingsDialog();else if(k==="__prof")profileDialog();else if(k==="__pf")prefsDialog();else if(k==="__sup")supportDialog();else if(k==="__inbox")inboxDialog();
  else if(k==="__proj"||k==="__hr")soonDialog(k==="__proj"?"nav_projects":"nav_hr");
  else if(k==="__logout"){if(confirm(t("logout")+"?"))api("POST","logout").catch(function(){}).then(function(){TOK="";save(K_TOK,"");location.reload()})}};
 $("ov").classList.remove("hide");d.classList.add("open")}
$("ov").onclick=function(){closeDrawer()};
function soonDialog(k){$("dbody").innerHTML='<h2>'+esc(t(k))+'</h2><p>'+esc(t("soon_note"))+'</p><div class="row"><span class="sp"></span><button class="b alt sm" id="sn_x">'+esc(t("close"))+"</button></div>";if(!$("dlg").open)$("dlg").showModal();$("dlg").oncancel=null;$("dbody").onclick=null;$("sn_x").onclick=function(){$("dlg").close()}}
$("hm").onclick=function(){if(AUTH==="app")openDrawer()};$("hl").onclick=function(){langDialog(false)};

/* ---------- lock / trial ---------- */
function trialBar(){if(!ME||ME.role==="owner"||ME.expires==null||ME.expired)return"";var d=Math.max(0,Math.ceil((ME.expires-Date.now())/86400000));return'<div class="note" style="margin-bottom:12px">'+esc(t("trial_left",{n:d,d:dstr(ME.expires)}))+(PINFO.contact?" · "+linkify(PINFO.contact):"")+"</div>"}
function vLock(){return'<div class="card" style="text-align:center"><h2>'+esc(t("trial_over_t"))+"</h2><p>"+esc(t("trial_over_m"))+"</p>"+(PINFO.contact?"<p><b>"+linkify(PINFO.contact)+'</b></p>':"")+'<button class="b" id="lk_sup">'+esc(t("support"))+'</button> <button class="b alt" id="lk_re">'+esc(t("check_again"))+"</button></div>"}
function lockBind(){var sb=$("lk_sup");if(sb)sb.onclick=function(){supportDialog()};var b=$("lk_re");if(b)b.onclick=function(){api("GET","sync").then(function(r){ME=r.user;PINFO=r;save("fin_me",ME);render();if(!ME.expired)pull();else toast(t("trial_over_t"))}).catch(function(){toast(t("net_err"))})}}

/* ---------- start / boot ---------- */
function timers(){if(TIMERS)return;TIMERS=true;setInterval(function(){if(!document.hidden&&ME&&!ME.expired)flush().then(pull)},30000);setInterval(pollSup,120000);window.addEventListener("online",function(){flush().then(pull)})}
function startApp(){AUTH="app";api("GET","sync").then(function(r){ME=r.user;PINFO=r;SUP=r.sup||0;save("fin_me",ME);loadLocal();V.tab="home";V.page=null;render();timers();return flush()}).then(pull).catch(function(e){if(e&&e.code==="auth")sessionEnd();else{AUTH="app";render()}})}
function boot(){render();
 if(TOK){AUTH="app";ME=load("fin_me",null);if(ME)loadLocal();render();api("GET","sync").then(function(r){ME=r.user;PINFO=r;SUP=r.sup||0;save("fin_me",ME);if(!DB||!Object.keys(DB.account).length)loadLocal();render();timers();return flush()}).then(pull).catch(function(e){if(e&&e.code==="auth")sessionEnd();else if(ME)timers()});return}
 api("GET","ping").then(function(p){NEEDSETUP=!!p.setup;PINFO=p;AUTH="login";render()}).catch(function(){NOBACK=true;AUTH="login";render()})}
function render(){nav();$("hm").innerHTML=ic("menu",26);$("hl").innerHTML=ic("globe",24);document.documentElement.lang=LANG;var a=$("app");
 if($("hsub"))$("hsub").textContent="by Soramma"+(AUTH==="app"&&ME&&ME.role==="owner"?" · ADMIN":"");
 $("hm").style.visibility=AUTH==="app"?"visible":"hidden";
 if(AUTH==="boot"){$("nav").innerHTML="";a.innerHTML='<p class="muted" style="text-align:center;padding:40px">'+esc(t("loading"))+"</p>";return}
 if(AUTH==="login"){$("nav").innerHTML="";a.innerHTML=vLogin();bindLogin();return}
 if(ME&&ME.expired){$("nav").innerHTML="";a.innerHTML=vLock();lockBind();return}
 PAYC=null;var h;
 if(V.page==="doc")h=vDoc();else if(V.page==="edit")h=vEdit();else if(V.page==="acct")h=vAcct();
 else if(V.tab==="home")h=vHome();else if(V.tab==="sales")h=vSales();else if(V.tab==="fin")h=vFin();else h=vTax();
 a.innerHTML=trialBar()+h;bindAll()}
function bindAll(){var a=$("app");
 a.onclick=function(e){var b=e.target.closest("[data-act]");if(!b)return;act(b.dataset.act,b.dataset)};
 var q=$("q");if(q){q.oninput=function(e){V.q=e.target.value;var p=e.target.selectionStart;render();var n=$("q");if(n){n.focus();n.setSelectionRange(p,p)}}}
 if(V.page==="edit")bindEdit()}

/* ---------- small ui helpers ---------- */
function dsAttr(ds){var s="";for(var k in ds)s+=" data-"+k+'="'+esc(ds[k])+'"';return s}
function qa(a,i,k,ds){return'<button data-act="'+a+'"'+dsAttr(ds||{})+'><span class="ico">'+ic(i,22)+"</span>"+esc(t(k))+"</button>"}
function kpi(l,v,cls){return'<div class="kpi '+(cls||"")+'"><small>'+esc(l)+"</small><b>"+v+"</b></div>"}
function seg(tab,items){return'<div class="seg">'+items.map(function(x){return'<button data-act="seg" data-tab="'+tab+'" data-v="'+x[0]+'" class="'+(V.sub[tab]===x[0]?"on":"")+'">'+esc(t(x[1]))+"</button>"}).join("")+"</div>"}
function back(){return'<div class="row" style="margin-bottom:10px"><button class="b alt sm" data-act="back">'+ic("x",16)+esc(t("back"))+"</button></div>"}
function money(v,c){return'<span class="'+(v<0?"amt-neg":"")+'">'+fmt(v,c)+"</span>"}
function curTitle(c,multi){return multi?'<h3 style="margin-top:16px">'+c+"</h3>":""}

/* ---------- Home ---------- */
function plCalc(f,to,c){var inc=0,exp=0,incC={},expC={};
 docs("sale").forEach(function(x){if(x.cur===c&&x.date>=f&&x.date<=to)inc+=num(x.sub)});
 docs("bill").forEach(function(x){if(x.cur===c&&x.date>=f&&x.date<=to)exp+=num(x.sub)});
 var salesInc=inc,billExp=exp;
 list("txn").forEach(function(x){if(x.inv||x.xf||x.cur!==c||x.date<f||x.date>to)return;var a=num(x.amt),k=x.cat||"none";if(x.dir==="in"){incC[k]=(incC[k]||0)+a;inc+=a}else{expC[k]=(expC[k]||0)+a;exp+=a}});
 return{inc:rnd(inc,c),exp:rnd(exp,c),profit:rnd(inc-exp,c),salesInc:rnd(salesInc,c),billExp:rnd(billExp,c),incC:incC,expC:expC}}
function vHome(){var cs=curSet(),multi=cs.length>1,td=today(),m=monthRange(0),has=list("invoice").length||list("txn").length;
 var h='<div class="qa">'+qa("newdoc","receipt","q_invoice",{k:"sale"})+qa("newdoc","briefcase","q_bill",{k:"bill"})+qa("tx","arrowin","q_in",{dir:"in"})+qa("tx","arrowout","q_out",{dir:"out"})+"</div>";
 if(!has)h+='<div class="note" style="margin-bottom:12px">'+esc(t("h_welcome"))+"</div>";
 cs.forEach(function(c){var ar=docs("sale").filter(function(x){return x.cur===c&&balOf(x)>0}),ov=ar.filter(function(x){return x.due&&x.due<td}),ap=docs("bill").filter(function(x){return x.cur===c&&balOf(x)>0}),
  cash=sumBy(list("account").filter(function(a){return a.cur===c}),accBal,c),pl=plCalc(m[0],m[1],c);
  h+=curTitle(c,multi)+'<div class="kpis">'+kpi(t("h_receivable"),fmt(sumBy(ar,balOf,c),c))+kpi(t("h_overdue"),fmt(sumBy(ov,balOf,c),c),ov.length?"warn":"")+kpi(t("h_payable"),fmt(sumBy(ap,balOf,c),c))+kpi(t("h_cash"),fmt(cash,c),"hl")+"</div>"+
  '<div class="card"><b>'+esc(t("h_month"))+'</b><table class="t"><tr><td>'+esc(t("h_income"))+'</td><td class="r">'+fmt(pl.inc,c)+'</td></tr><tr><td>'+esc(t("h_expense"))+'</td><td class="r">'+fmt(pl.exp,c)+'</td></tr><tr class="tot"><td>'+esc(t("h_profit"))+'</td><td class="r">'+money(pl.profit,c)+"</td></tr></table></div>"});
 var rec=docs("sale").sort(function(a,b){return(b.date+b.no)<(a.date+a.no)?-1:1}).slice(0,5);
 if(rec.length)h+="<h3>"+esc(t("h_recent"))+"</h3>"+rec.map(docItem).join("");
 return h}

/* ---------- Sales & purchases ---------- */
function docItem(x){var s=statusOf(x);return'<button class="item" data-act="open" data-id="'+esc(x.id)+'"><span class="th">'+ic("receipt",20)+'</span><div><b>'+esc(x.no||"")+" · "+esc(cname(x.cid))+"</b><small>"+esc(dfmt(x.date))+(x.due?" → "+esc(dfmt(x.due)):"")+'</small></div><div class="amt">'+fmt(x.total,x.cur)+"<small>"+stPill(s)+"</small></div></button>"}
function docList(k){var f=V.filt,q=V.q.trim().toLowerCase(),L=docs(k).filter(function(x){var s=statusOf(x);if(f==="unpaid"&&s==="paid")return false;if(f==="overdue"&&s!=="overdue")return false;if(f==="paid"&&s!=="paid")return false;
  if(q&&(x.no+" "+cname(x.cid)+" "+(x.ref||"")+" "+x.total).toLowerCase().indexOf(q)<0)return false;return true}).sort(function(a,b){return(b.date+b.no)<(a.date+a.no)?-1:1});
 return'<input id="q" placeholder="'+esc(t("search"))+'" value="'+esc(V.q)+'"><div class="chips">'+[["all","all"],["unpaid","st_unpaid"],["overdue","st_overdue"],["paid","st_paid"]].map(function(x){return'<button data-act="filt" data-v="'+x[0]+'" class="'+(f===x[0]?"on":"")+'">'+esc(t(x[1]))+"</button>"}).join("")+"</div>"+
 (L.length?L.map(docItem).join(""):'<p class="muted" style="text-align:center;padding:26px 0">'+esc(t(k==="sale"?"no_invoices":"no_bills"))+"</p>")+
 '<button class="b fab" data-act="newdoc" data-k="'+k+'">'+ic("plus",18)+esc(t(k==="sale"?"new_invoice":"new_bill"))+"</button>"}
function contactsOf(k){return list("contact").filter(function(c){return c.type===k||c.type==="both"}).sort(function(a,b){return a.name<b.name?-1:1})}
function ctList(k){var q=V.q.trim().toLowerCase(),L=contactsOf(k).filter(function(c){return!q||(c.name+" "+(c.phone||"")+" "+(c.email||"")).toLowerCase().indexOf(q)>=0});
 return'<input id="q" placeholder="'+esc(t("search"))+'" value="'+esc(V.q)+'">'+(L.length?L.map(function(c){var open=docs(k==="customer"?"sale":"bill").filter(function(x){return x.cid===c.id&&balOf(x)>0}),cs=["USD","KHR"].map(function(cu){var s=sumBy(open.filter(function(x){return x.cur===cu}),balOf,cu);return s?fmt(s,cu):""}).filter(Boolean).join(" · ");
  return'<button class="item" data-act="ct" data-id="'+esc(c.id)+'"><span class="th">'+ic("user",20)+'</span><div><b>'+esc(c.name)+"</b><small>"+esc([c.phone,c.email].filter(Boolean).join(" · "))+'</small></div><div class="amt"><small>'+esc(cs)+"</small></div></button>"}).join(""):'<p class="muted" style="text-align:center;padding:26px 0">'+esc(t("c_none"))+"</p>")+
 '<button class="b fab" data-act="newct" data-k="'+k+'">'+ic("plus",18)+esc(t(k==="customer"?"c_new_customer":"c_new_vendor"))+"</button>"}
function vSales(){return seg("sales",[["inv","s_invoices"],["cust","s_customers"]])+(V.sub.sales==="inv"?docList("sale"):ctList("customer"))}

/* ---------- Finance tab ---------- */
function accCard(a){return'<button class="item" data-act="acct" data-id="'+esc(a.id)+'"><span class="th">'+ic(a.type==="bank"?"bank":"wallet",20)+'</span><div><b>'+esc(a.name)+"</b><small>"+esc(t(a.type==="bank"?"acc_bank":"acc_cash"))+" · "+a.cur+'</small></div><div class="amt">'+money(accBal(a),a.cur)+"</div></button>"}
function vMoney(){var A=list("account").sort(function(a,b){return a.name<b.name?-1:1}),recent=list("txn").sort(function(a,b){return(b.date+b.id)<(a.date+a.id)?-1:1}).slice(0,12);
 return'<div class="qa">'+qa("tx","arrowin","m_in",{dir:"in"})+qa("tx","arrowout","m_out",{dir:"out"})+qa("xfer","swap","m_xfer")+qa("newacc","plus","m_add_acc")+"</div><h3>"+esc(t("m_accounts"))+"</h3>"+(A.length?A.map(accCard).join(""):'<p class="muted">'+esc(t("none2"))+"</p>")+
 "<h3>"+esc(t("ledger"))+"</h3>"+(recent.length?recent.map(txItem).join(""):'<p class="muted">'+esc(t("no_tx"))+"</p>")}
function txItem(x){var a=DB.account[x.acc],inv=x.inv&&DB.invoice[x.inv];return'<button class="item" data-act="txe" data-id="'+esc(x.id)+'"><span class="th">'+ic(x.dir==="in"?"arrowin":"arrowout",20)+'</span><div><b>'+esc(inv?(inv.no+" · "+cname(inv.cid)):(x.memo||t("cat_"+(x.cat||"none"))))+"</b><small>"+esc(dfmt(x.date)+" · "+(a?a.name:"?")+(x.cat&&!inv?" · "+t("cat_"+x.cat):""))+'</small></div><div class="amt '+(x.dir==="in"?"amt-pos":"amt-neg")+'">'+(x.dir==="in"?"+":"-")+fmt(x.amt,x.cur)+"</div></button>"}
function vAcct(){var a=DB.account[V.pid];if(!a){V.page=null;return vFin()}var T=list("txn").filter(function(x){return x.acc===a.id}).sort(function(x,y){return(y.date+y.id)<(x.date+x.id)?-1:1});
 return back()+'<div class="card"><div class="row"><h2 style="margin:0">'+esc(a.name)+'</h2><span class="sp"></span><button class="b alt sm" data-act="editacc" data-id="'+esc(a.id)+'">'+ic("edit",16)+esc(t("edit"))+'</button></div><p class="muted" style="margin:4px 0">'+esc(t(a.type==="bank"?"acc_bank":"acc_cash"))+" · "+a.cur+'</p><div class="kpi hl"><small>'+esc(t("balance"))+"</small><b>"+fmt(accBal(a),a.cur)+"</b></div></div>"+
 '<div class="qa" style="grid-template-columns:repeat(3,minmax(0,1fr))">'+qa("tx","arrowin","m_in",{dir:"in",acc:a.id})+qa("tx","arrowout","m_out",{dir:"out",acc:a.id})+qa("xfer","swap","m_xfer",{acc:a.id})+"</div><h3>"+esc(t("ledger"))+"</h3>"+(T.length?T.map(txItem).join(""):'<p class="muted">'+esc(t("no_tx"))+"</p>")}
function vFin(){var s=V.sub.fin,h=seg("fin",[["bills","f_bills"],["vendors","f_vendors"],["money","f_money"],["reports","f_reports"]]);
 return h+(s==="bills"?docList("bill"):s==="vendors"?ctList("vendor"):s==="money"?vMoney():vReports())}

/* ---------- reports (generic: tables -> screen, print, CSV) ---------- */
function perRange(){if(V.per==="month")return monthRange(0);if(V.per==="last")return monthRange(-1);if(V.per==="year")return yearRange();return[V.from||today(),V.to||today()]}
function setPer(k){V.per=k;if(k!=="custom"){var r=perRange();V.from=r[0];V.to=r[1]}}
function perBar(){var h='<div class="chips">'+[["month","p_month"],["last","p_last"],["year","p_year"],["custom","p_custom"]].map(function(x){return'<button data-act="per" data-v="'+x[0]+'" class="'+(V.per===x[0]?"on":"")+'">'+esc(t(x[1]))+"</button>"}).join("")+"</div>";
 if(V.per==="custom")h+='<div class="g2"><label>'+esc(t("r_from"))+'<input type="date" id="p_from" value="'+V.from+'"></label><label>'+esc(t("r_to"))+'<input type="date" id="p_to" value="'+V.to+'"></label></div>';return h}
function C(n,c){return{n:n,s:fmt(n,c),c:c}}
function repPL(){var r=perRange(),cs=curSet(),blocks=[];cs.forEach(function(c){var p=plCalc(r[0],r[1],c),rows=[],lab=function(k){return t("cat_"+k)};
  rows.push(["<b>"+esc(t("r_income"))+"</b>",""]);rows.push([t("s_invoices"),C(p.salesInc,c)]);Object.keys(p.incC).forEach(function(k){rows.push([lab(k),C(rnd(p.incC[k],c),c)])});rows.push({tot:1,cells:[t("r_income"),C(p.inc,c)]});
  rows.push(["<b>"+esc(t("r_expense"))+"</b>",""]);rows.push([t("b_bills"),C(p.billExp,c)]);Object.keys(p.expC).forEach(function(k){rows.push([lab(k),C(rnd(p.expC[k],c),c)])});rows.push({tot:1,cells:[t("r_expense"),C(p.exp,c)]});rows.push({tot:1,cells:[t("r_profit"),C(p.profit,c)]});
  blocks.push({h:c,cols:[{t:""},{t:"",r:1}],rows:rows})});
 return{title:t("r_title_pl"),sub:dfmt(r[0])+" – "+dfmt(r[1]),note:t("r_basis"),blocks:blocks}}
function vatCalc(f,to,c){var s=0,b=0,sb=0,bb=0,L=[];docs("sale").forEach(function(x){if(x.cur===c&&x.date>=f&&x.date<=to&&num(x.vat)){s+=num(x.vat);sb+=num(x.sub);L.push([x,"sale"])}});docs("bill").forEach(function(x){if(x.cur===c&&x.date>=f&&x.date<=to&&num(x.vat)){b+=num(x.vat);bb+=num(x.sub);L.push([x,"bill"])}});
 L.sort(function(a,b){return a[0].date<b[0].date?-1:1});return{out:rnd(s,c),inn:rnd(b,c),net:rnd(s-b,c),outBase:rnd(sb,c),inBase:rnd(bb,c),L:L}}
function repVAT(){var r=perRange(),cs=curSet(),blocks=[],p=prefs();cs.forEach(function(c){var v=vatCalc(r[0],r[1],c),rows=[[t("r_vat_out"),C(v.out,c)],[t("r_vat_in"),C(v.inn,c)],{tot:1,cells:[t("r_vat_net"),C(v.net,c)]}];
  blocks.push({h:c,cols:[{t:""},{t:"",r:1}],rows:rows});
  if(v.L.length)blocks.push({h:c+" · "+t("r_invoices"),cols:[{t:t("inv_date")},{t:t("inv_no")},{t:t("c_name")},{t:t("inv_sub"),r:1},{t:t("inv_vat"),r:1}],rows:v.L.map(function(p2){var x=p2[0],sg=p2[1]==="sale"?1:-1;return[dfmt(x.date),x.no,cname(x.cid),C(sg*num(x.sub),c),C(sg*num(x.vat),c)]})})});
 return{title:t("r_title_vat"),sub:dfmt(r[0])+" – "+dfmt(r[1])+(p.vatNo?" · "+t("sh_vatno")+" "+p.vatNo:""),note:"",blocks:blocks}}
function repAging(k){var td=today(),cs=curSet(),blocks=[];cs.forEach(function(c){var L=docs(k).filter(function(x){return x.cur===c&&balOf(x)>0}).sort(function(a,b){return(a.due||a.date)<(b.due||b.date)?-1:1}),bk=[0,0,0,0];
  var rows=L.map(function(x){var od=x.due?diffDays(td,x.due):0,i=od<=0?0:od<=30?1:od<=60?2:3;bk[i]+=balOf(x);return[x.no,cname(x.cid),dfmt(x.due||x.date),od>0?String(od):"",C(balOf(x),c)]});
  rows.push({tot:1,cells:[t(k==="sale"?"r_ar_total":"r_ap_total"),"","","",C(rnd(bk[0]+bk[1]+bk[2]+bk[3],c),c)]});
  ["ag_cur","ag_1","ag_2","ag_3"].forEach(function(a,i){rows.push([t(a),"","","",C(rnd(bk[i],c),c)])});
  blocks.push({h:c,cols:[{t:t("inv_no")},{t:t(k==="sale"?"inv_customer":"inv_vendor")},{t:t("inv_due")},{t:"+"+t("day")},{t:t("inv_bal"),r:1}],rows:rows})});
 return{title:t(k==="sale"?"r_title_ar":"r_title_ap"),sub:dfmt(td),note:"",blocks:blocks}}
function repBal(){var cs=curSet(),blocks=[];cs.forEach(function(c){var A=list("account").filter(function(a){return a.cur===c}).sort(function(a,b){return a.name<b.name?-1:1}),rows=A.map(function(a){return[a.name+" ("+t(a.type==="bank"?"acc_bank":"acc_cash")+")",C(accBal(a),c)]});rows.push({tot:1,cells:[t("balance"),C(sumBy(A,accBal,c),c)]});blocks.push({h:c,cols:[{t:""},{t:"",r:1}],rows:rows})});
 return{title:t("r_title_bal"),sub:dfmt(today()),note:"",blocks:blocks}}
function cellS(x){return x&&typeof x==="object"?(x.n<0?'<span class="amt-neg">'+esc(x.s)+"</span>":esc(x.s)):(/^<b>/.test(String(x))?x:esc(x))}
function repHtml(rep){var h='<div class="card"><h2>'+esc(rep.title)+'</h2><p class="muted" style="margin:0 0 6px">'+esc(rep.sub)+"</p>";
 if(!rep.blocks.length)h+='<p class="muted">'+esc(t("r_nodata"))+"</p>";
 rep.blocks.forEach(function(b){h+=(b.h?"<h3>"+esc(b.h)+"</h3>":"")+'<div style="overflow-x:auto"><table class="t">'+(b.cols.some(function(c){return c.t})?"<tr>"+b.cols.map(function(c){return'<th class="'+(c.r?"r":"")+'">'+esc(c.t)+"</th>"}).join("")+"</tr>":"")+
  b.rows.map(function(r){var cells=r.cells||r;return'<tr class="'+(r.tot?"tot":"")+'">'+cells.map(function(x,i){return'<td class="'+(b.cols[i]&&b.cols[i].r?"r":"")+'">'+cellS(x)+"</td>"}).join("")+"</tr>"}).join("")+"</table></div>"});
 if(rep.note)h+='<p class="muted" style="font-size:12px;margin-bottom:0">'+esc(rep.note)+"</p>";
 return h+'<div class="row" style="margin-top:12px"><button class="b alt sm" data-act="rprint">'+ic("print",16)+esc(t("r_print"))+'</button><button class="b alt sm" data-act="rcsv">'+ic("down",16)+esc(t("r_csv"))+"</button></div></div>"}
function curRep(){var tab=V.tab,s=V.rep;if(tab==="tax")return repVAT();return s==="pl"?repPL():s==="ar"?repAging("sale"):s==="ap"?repAging("bill"):repBal()}
function vReports(){var h='<div class="chips">'+[["pl","r_pl"],["ar","r_ar"],["ap","r_ap"],["bal","r_bal"]].map(function(x){return'<button data-act="rep" data-v="'+x[0]+'" class="'+(V.rep===x[0]?"on":"")+'">'+esc(t(x[1]))+"</button>"}).join("")+"</div>";
 if(V.rep==="pl")h+=perBar();return h+repHtml(curRep())}
function vTax(){return'<div class="row" style="margin-bottom:8px"><h2 style="margin:0">'+esc(t("tax_title"))+'</h2><span class="sp"></span><button class="b alt sm" data-act="pf">'+ic("sliders",16)+esc(t("tax_setup"))+'</button></div><p class="muted" style="margin-top:0">'+esc(t("tax_hint"))+"</p>"+perBar()+repHtml(repVAT())}
function csvOf(rep){var out=[[rep.title],[rep.sub],[]];rep.blocks.forEach(function(b){if(b.h)out.push([b.h]);if(b.cols.some(function(c){return c.t}))out.push(b.cols.map(function(c){return c.t}));b.rows.forEach(function(r){var cells=r.cells||r;out.push(cells.map(function(x){return x&&typeof x==="object"?x.n:String(x).replace(/<[^>]+>/g,"")}))});out.push([])});
 return"﻿"+out.map(function(r){return r.map(function(x){return'"'+String(x).replace(/"/g,'""')+'"'}).join(",")}).join("\n")}
function download(name,blob){var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000)}
function printHtml(h){var fr=document.createElement("iframe");fr.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0";document.body.appendChild(fr);fr.srcdoc=h;
 fr.onload=function(){var w=fr.contentWindow,go=function(){try{w.focus();w.print()}catch(e){toast(t("net_err"))}setTimeout(function(){fr.remove()},60000)},im=w.document.images,n=im.length,d=0;if(!n)return go();Array.prototype.forEach.call(im,function(x){var f2=function(){if(++d===n)go()};x.complete?f2():(x.onload=x.onerror=f2)})}}
function printReport(rep){var B=biz(),h='<!doctype html><meta charset="utf-8"><title>'+esc(rep.title)+'</title><style>@page{size:A4;margin:12mm}body{font-family:system-ui,"Kantumruy Pro",sans-serif;color:#111;font-size:12px}.h{display:flex;align-items:center;gap:14px;border-bottom:3px solid #123c3a;padding-bottom:8px;margin-bottom:10px}.h img{max-height:56px;max-width:120px}.h b{font-size:20px;display:block;color:#123c3a}h3{margin:14px 0 4px}table{border-collapse:collapse;width:100%;margin-bottom:6px}th,td{border-bottom:1px solid #ccc;padding:4px 6px;text-align:left}th{background:#e6f0ee}.r{text-align:right}tr.tot td{font-weight:700;border-top:2px solid #999}.f{margin-top:14px;color:#777;font-size:11px;text-align:center}</style><div class="h">'+(B.logo?'<img src="'+B.logo+'">':"")+"<div><b>"+esc(B.name)+"</b>"+esc(B.info)+'</div><div style="margin-left:auto;text-align:right"><b style="font-size:16px">'+esc(rep.title)+"</b>"+esc(rep.sub)+"</div></div>";
 rep.blocks.forEach(function(b){h+=(b.h?"<h3>"+esc(b.h)+"</h3>":"")+"<table>"+(b.cols.some(function(c){return c.t})?"<tr>"+b.cols.map(function(c){return'<th class="'+(c.r?"r":"")+'">'+esc(c.t)+"</th>"}).join("")+"</tr>":"")+b.rows.map(function(r){var cells=r.cells||r;return'<tr class="'+(r.tot?"tot":"")+'">'+cells.map(function(x,i){return'<td class="'+(b.cols[i]&&b.cols[i].r?"r":"")+'">'+(x&&typeof x==="object"?esc(x.s):(/^<b>/.test(String(x))?x:esc(x)))+"</td>"}).join("")+"</tr>"}).join("")+"</table>"});
 h+=(rep.note?'<p class="f">'+esc(rep.note)+"</p>":"")+'<p class="f">by Soramma Finance</p>';printHtml(h)}

/* ---------- document detail ---------- */
function vDoc(){var x=DB.invoice[V.pid];if(!x){V.page=null;return vSales()}x.id=V.pid;var s=statusOf(x),sale=x.k==="sale",c=DB.contact[x.cid]||{},pays=list("txn").filter(function(p){return p.inv===x.id}).sort(function(a,b){return a.date<b.date?-1:1}),bal=balOf(x);
 var h=back()+'<div class="card"><div class="row"><h2 style="margin:0">'+esc(t(sale?"sh_invoice":"sh_bill").split(" ")[0])+" "+esc(x.no||"")+'</h2><span class="sp"></span>'+stPill(s)+'</div><p class="muted" style="margin:6px 0 2px"><b>'+esc(c.name||"—")+"</b>"+(c.phone?" · "+esc(c.phone):"")+(c.email?" · "+esc(c.email):"")+"</p>"+(c.addr?'<p class="muted" style="margin:0 0 2px">'+esc(c.addr)+"</p>":"")+
 '<p class="muted" style="margin:0">'+esc(t("inv_date"))+": "+esc(dfmt(x.date))+(x.due?" · "+esc(t("inv_due"))+": "+esc(dfmt(x.due)):"")+(x.ref?" · "+esc(x.ref):"")+"</p></div>"+
 '<div class="card"><table class="t"><tr><th>'+esc(t("ln_desc"))+'</th><th class="r">'+esc(t("ln_qty"))+'</th><th class="r">'+esc(t("ln_price"))+'</th><th class="r">'+esc(t("inv_total"))+"</th></tr>"+
 (x.lines||[]).map(function(l){var a=rnd(num(l.q)*num(l.p),x.cur);return"<tr><td>"+esc(l.n||"")+(l.v?' <small class="muted">VAT</small>':"")+'</td><td class="r">'+esc(String(num(l.q)))+'</td><td class="r">'+fmt(num(l.p),x.cur)+'</td><td class="r">'+fmt(a,x.cur)+"</td></tr>"}).join("")+
 '<tr class="tot"><td colspan="3">'+esc(t("inv_sub"))+'</td><td class="r">'+fmt(x.sub,x.cur)+"</td></tr>"+(num(x.vat)?'<tr><td colspan="3">'+esc(t("inv_vat"))+" "+esc(String(x.rate||0))+'%</td><td class="r">'+fmt(x.vat,x.cur)+"</td></tr>":"")+
 '<tr class="tot"><td colspan="3">'+esc(t("inv_total"))+'</td><td class="r">'+fmt(x.total,x.cur)+'</td></tr><tr><td colspan="3">'+esc(t("inv_paid"))+'</td><td class="r">'+fmt(paidOf(x),x.cur)+'</td></tr><tr class="tot"><td colspan="3">'+esc(t("inv_bal"))+'</td><td class="r">'+fmt(bal,x.cur)+"</td></tr></table>"+(x.note?'<p class="muted" style="margin-bottom:0">'+esc(x.note)+"</p>":"")+"</div>"+
 (pays.length?"<h3>"+esc(t("pay_history"))+"</h3>"+pays.map(txItem).join(""):"")+
 '<div class="row" style="margin-top:8px">'+(bal>0?'<button class="b" data-act="pay" data-id="'+esc(x.id)+'">'+ic("check",18)+esc(t(sale?"pay_in":"pay_out"))+"</button>":"")+
 '<button class="b alt" data-act="print" data-id="'+esc(x.id)+'">'+ic("print",18)+esc(t("print"))+'</button><button class="b alt" data-act="pdf" data-id="'+esc(x.id)+'">'+ic("file",18)+"PDF</button>"+'<button class="b alt" data-act="share" data-id="'+esc(x.id)+'">'+ic("send",18)+esc(t("share"))+"</button></div>"+
 '<div class="row" style="margin-top:8px"><button class="b alt sm" data-act="editdoc" data-id="'+esc(x.id)+'">'+ic("edit",16)+esc(t("edit"))+'</button><button class="b alt sm" data-act="dup" data-id="'+esc(x.id)+'">'+ic("copy",16)+esc(t("dup"))+'</button><button class="b bad sm" data-act="deldoc" data-id="'+esc(x.id)+'">'+ic("trash",16)+esc(t("delete"))+"</button></div>";
 return h}

/* ---------- document editor ---------- */
function newDoc(k){var p=prefs();V.ed={id:null,k:k,cid:"",cur:p.cur,date:today(),terms:p.terms,due:addDays(today(),p.terms),dueManual:false,no:nextNo(k),ref:"",note:"",lines:[{n:"",q:1,p:"",v:p.vatOn?1:0}]};V.page="edit";render();window.scrollTo(0,0)}
function editDoc(id,dup){var x=DB.invoice[id];if(!x)return;var p=prefs();V.ed={id:dup?null:id,k:x.k,cid:x.cid,cur:x.cur,date:dup?today():x.date,terms:dup?p.terms:diffDays(x.due||x.date,x.date),due:dup?addDays(today(),p.terms):(x.due||x.date),dueManual:!dup,no:dup?nextNo(x.k):x.no,ref:dup?"":(x.ref||""),note:x.note||"",lines:(x.lines||[]).map(function(l){return{n:l.n,q:l.q,p:l.p,v:l.v?1:0}})};V.page="edit";render();window.scrollTo(0,0)}
function edTotals(){var e=V.ed,c=calc(e.lines.map(function(l){return{q:num(l.q),p:num(l.p),v:l.v}}),prefs().vat,e.cur);return c}
function vEdit(){var e=V.ed,sale=e.k==="sale",C2=contactsOf(sale?"customer":"vendor"),p=prefs();
 var h=back()+'<div class="card"><h2>'+esc(t(e.id?(sale?"edit_invoice":"edit_bill"):(sale?"new_invoice":"new_bill")))+"</h2>"+
 '<label>'+esc(t(sale?"inv_customer":"inv_vendor"))+'<select id="e_c"><option value="">'+esc(t("c_pick"))+"</option>"+C2.map(function(c){return'<option value="'+esc(c.id)+'"'+(c.id===e.cid?" selected":"")+">"+esc(c.name)+"</option>"}).join("")+'<option value="__new">'+esc(t("c_add_new"))+"</option></select></label>"+
 '<div class="g2"><label>'+esc(t("inv_no"))+'<input id="e_no" value="'+esc(e.no)+'"></label><label>'+esc(t("inv_cur"))+'<select id="e_cur">'+Object.keys(CUR).map(function(c){return'<option value="'+c+'"'+(c===e.cur?" selected":"")+">"+c+"</option>"}).join("")+"</select></label></div>"+
 '<div class="g2"><label>'+esc(t("inv_date"))+'<input type="date" id="e_date" value="'+e.date+'"></label><label>'+esc(t("inv_terms"))+'<select id="e_terms">'+[0,7,15,30,45,60].concat([0,7,15,30,45,60].indexOf(e.terms)<0?[e.terms]:[]).map(function(n){return'<option value="'+n+'"'+(n===e.terms?" selected":"")+">"+esc(n?t("terms_n",{n:n}):t("terms_0"))+"</option>"}).join("")+"</select></label></div>"+
 '<label>'+esc(t("inv_due"))+'<input type="date" id="e_due" value="'+(e.due||"")+'"></label>'+(sale?"":'<label>'+esc(t("inv_ref"))+'<input id="e_ref" value="'+esc(e.ref)+'"></label>')+"</div>"+
 '<div class="card lines"><h2>'+esc(t("inv_lines"))+"</h2>"+e.lines.map(function(l,i){return'<div class="ln" data-i="'+i+'"><input class="l_n" placeholder="'+esc(t("ln_desc"))+'" value="'+esc(l.n)+'"><div class="g3"><label style="margin:0">'+esc(t("ln_qty"))+'<input class="l_q" inputmode="decimal" value="'+esc(l.q)+'"></label><label style="margin:0">'+esc(t("ln_price"))+'<input class="l_p" inputmode="decimal" value="'+esc(l.p)+'"></label><div class="row" style="padding-top:18px"><label style="margin:0;white-space:nowrap"><input type="checkbox" class="l_v"'+(l.v?" checked":"")+"> "+esc(t("ln_vat"))+'</label><span class="sp"></span><button class="b bad sm" data-act="delline" data-i="'+i+'" aria-label="x">'+ic("trash",14)+"</button></div></div></div>"}).join("")+
 '<button class="b alt sm" data-act="addline">'+esc(t("ln_add"))+'</button><label style="margin-top:12px">'+esc(t("inv_note"))+'<textarea id="e_note" rows="2">'+esc(e.note)+'</textarea></label><div id="e_tot"></div></div>'+
 '<div class="row"><button class="b" data-act="savedoc">'+ic("check",18)+esc(t("save"))+'</button><button class="b alt" data-act="back">'+esc(t("cancel"))+"</button></div>";
 return h}
function readEd(){var e=V.ed;if(!e||V.page!=="edit")return;var g=function(i){var n=$(i);return n?n.value:null};
 if(g("e_no")!=null){e.no=g("e_no");e.cur=g("e_cur");e.date=g("e_date");e.due=g("e_due");e.note=g("e_note");if($("e_ref"))e.ref=g("e_ref")}
 var L=document.querySelectorAll(".lines .ln");e.lines=Array.prototype.map.call(L,function(n){return{n:n.querySelector(".l_n").value,q:n.querySelector(".l_q").value,p:n.querySelector(".l_p").value,v:n.querySelector(".l_v").checked?1:0}})}
function edTot(){var e=V.ed,c=edTotals(),p=prefs(),n=$("e_tot");if(!n)return;n.innerHTML='<table class="t"><tr><td>'+esc(t("inv_sub"))+'</td><td class="r">'+fmt(c.sub,e.cur)+"</td></tr><tr><td>"+esc(t("inv_vat"))+" "+p.vat+'%</td><td class="r">'+fmt(c.vat,e.cur)+'</td></tr><tr class="tot"><td>'+esc(t("inv_total"))+'</td><td class="r">'+fmt(c.total,e.cur)+"</td></tr></table>"}
function bindEdit(){edTot();var A=$("app");
 A.oninput=function(e){if(V.page!=="edit")return;if(e.target.id==="e_date"||e.target.id==="e_terms"){}else{readEd();edTot()}};
 A.onchange=function(e){if(V.page!=="edit")return;var id=e.target.id;readEd();var ed=V.ed;
  if(id==="e_c"){if(e.target.value==="__new"){contactDialog(ed.k==="sale"?"customer":"vendor","",function(cid){ed.cid=cid;render()});e.target.value=ed.cid||"";return}ed.cid=e.target.value}
  else if(id==="e_terms"){ed.terms=+e.target.value;ed.due=addDays(ed.date,ed.terms);ed.dueManual=false;$("e_due").value=ed.due}
  else if(id==="e_date"){if(!ed.dueManual){ed.due=addDays(ed.date,ed.terms);$("e_due").value=ed.due}}
  else if(id==="e_due"){ed.dueManual=true;ed.terms=diffDays(ed.due,ed.date)}
  else if(id==="e_cur"){render();return}
  edTot()}}
function saveDoc(){readEd();var e=V.ed;if(!e.cid){toast(t("c_need"));return}
 var lines=e.lines.filter(function(l){return num(l.p)!==0||(l.n&&l.n.trim())}).map(function(l){return{n:(l.n||"").trim(),q:num(l.q)||1,p:num(l.p),v:l.v?1:0}});if(!lines.some(function(l){return l.p!==0})){toast(t("lines_need"));return}
 var p=prefs(),c=calc(lines,p.vat,e.cur),id=e.id||rid(),old=e.id&&DB.invoice[e.id];
 put("invoice",id,{k:e.k,no:e.no||nextNo(e.k),ref:e.ref||"",cid:e.cid,date:e.date||today(),due:e.due||e.date,cur:e.cur,lines:lines,sub:c.sub,vat:c.vat,total:c.total,rate:p.vat,note:e.note||"",created:old?old.created:Date.now()});
 if(!e.id)bumpNo(e.k);V.ed=null;V.page="doc";V.pid=id;toast(t("fin_saved"));render();window.scrollTo(0,0)}

/* ---------- dialogs ---------- */
function dlg(html,wire){$("dbody").innerHTML=html;if(!$("dlg").open)$("dlg").showModal();$("dlg").oncancel=null;$("dbody").onclick=null;wire()}
function closeDlg(){$("dlg").close()}
function opt(v,l,sel){return'<option value="'+esc(v)+'"'+(sel?" selected":"")+">"+esc(l)+"</option>"}
function contactDialog(kind,id,cb){var c=id?DB.contact[id]:{type:kind,name:""},used=id&&list("invoice").some(function(x){return x.cid===id});
 dlg('<h2>'+ic("user")+" "+esc(t(id?"c_edit":(kind==="customer"?"c_new_customer":"c_new_vendor")))+'</h2><label>'+esc(t("c_name"))+'<input id="d_n" value="'+esc(c.name||"")+'" autocapitalize="words"></label><div class="g2"><label>'+esc(t("c_phone"))+'<input id="d_p" type="tel" value="'+esc(c.phone||"")+'"></label><label>'+esc(t("c_email"))+'<input id="d_e" type="email" value="'+esc(c.email||"")+'"></label></div><label>'+esc(t("c_addr"))+'<input id="d_a" value="'+esc(c.addr||"")+'"></label><div class="g2"><label>'+esc(t("c_tax"))+'<input id="d_t" value="'+esc(c.tax||"")+'"></label><label>'+esc(t("c_type"))+'<select id="d_ty">'+opt("customer",t("c_customer"),c.type==="customer")+opt("vendor",t("c_vendor"),c.type==="vendor")+opt("both",t("c_both"),c.type==="both")+"</select></label></div>"+
  '<div class="row" style="margin-top:12px">'+(id&&!used?'<button class="b bad sm" id="d_del">'+esc(t("delete"))+"</button>":"")+'<span class="sp"></span><button class="b alt sm" id="d_x">'+esc(t("cancel"))+'</button><button class="b sm" id="d_ok">'+esc(t("save"))+"</button></div>",function(){
  $("d_x").onclick=closeDlg;if($("d_del"))$("d_del").onclick=function(){if(confirm(t("fin_del_q"))){del("contact",id);closeDlg();render()}};
  $("d_ok").onclick=function(){var n=$("d_n").value.trim();if(!n){$("d_n").focus();return}var cid=id||rid();put("contact",cid,{name:n,phone:$("d_p").value.trim(),email:$("d_e").value.trim(),addr:$("d_a").value.trim(),tax:$("d_t").value.trim(),type:$("d_ty").value});closeDlg();if(cb)cb(cid);else render()}})}
function accOptions(cur,sel){return list("account").filter(function(a){return!cur||a.cur===cur}).sort(function(a,b){return a.name<b.name?-1:1}).map(function(a){return opt(a.id,a.name+" ("+a.cur+")",a.id===sel)}).join("")}
function payDialog(id){var x=DB.invoice[id];x.id=id;var sale=x.k==="sale",A=accOptions(x.cur);
 if(!A){dlg('<h2>'+esc(t(sale?"pay_in":"pay_out"))+"</h2><p>"+esc(t("pay_noacc"))+'</p><div class="row"><span class="sp"></span><button class="b alt sm" id="p_x">'+esc(t("close"))+'</button><button class="b sm" id="p_acc">'+esc(t("m_add_acc"))+"</button></div>",function(){$("p_x").onclick=closeDlg;$("p_acc").onclick=function(){accountDialog("",x.cur)}});return}
 dlg('<h2>'+esc(t(sale?"pay_in":"pay_out"))+" · "+esc(x.no)+'</h2><p class="muted" style="margin-top:0">'+esc(t("inv_bal"))+": <b>"+fmt(balOf(x),x.cur)+'</b></p><div class="g2"><label>'+esc(t("pay_amount"))+" ("+x.cur+')<input id="y_a" inputmode="decimal" value="'+balOf(x)+'"></label><label>'+esc(t("pay_date"))+'<input id="y_d" type="date" value="'+today()+'"></label></div><label>'+esc(t("pay_acc"))+'<select id="y_c">'+A+'</select></label><label>'+esc(t("pay_memo"))+'<input id="y_m"></label><div class="row"><span class="sp"></span><button class="b alt sm" id="y_x">'+esc(t("cancel"))+'</button><button class="b sm" id="y_ok">'+esc(t("save"))+"</button></div>",function(){
  $("y_x").onclick=closeDlg;$("y_ok").onclick=function(){var a=rnd(num($("y_a").value),x.cur);if(a<=0){$("y_a").focus();return}put("txn",rid(),{acc:$("y_c").value,date:$("y_d").value||today(),amt:a,dir:sale?"in":"out",cur:x.cur,inv:id,cat:sale?"sales":"bill",memo:$("y_m").value.trim()});closeDlg();toast(t("fin_saved"));render()}})}
var CATS_IN=["sales","other_in"],CATS_OUT=["rent","salary","utilities","supplies","transport","marketing","tax","other"];
function txnDialog(dir,acc,id){var x=id?DB.txn[id]:{dir:dir,date:today(),acc:acc||"",amt:"",cat:"",memo:""};if(id){dir=x.dir;x.id=id}
 var defAcc=x.acc||acc||((list("account").filter(function(a){return a.cur===prefs().cur}).sort(function(a,b){return a.name<b.name?-1:1})[0]||{}).id);var A=accOptions("",defAcc);if(!A){dlg('<h2>'+esc(t("m_add_acc"))+"</h2><p>"+esc(t("pay_noacc"))+'</p><div class="row"><span class="sp"></span><button class="b sm" id="p_acc">'+esc(t("m_add_acc"))+"</button></div>",function(){$("p_acc").onclick=function(){accountDialog("","")}});return}
 var cats=(dir==="in"?CATS_IN:CATS_OUT);
 dlg('<h2>'+esc(t(id?"tx_edit":(dir==="in"?"m_in":"m_out")))+"</h2>"+(x.inv?'<p class="note">'+esc(t("tx_inv"))+"</p>":"")+'<div class="g2"><label>'+esc(t("tx_amount"))+'<input id="t_a" inputmode="decimal" value="'+esc(x.amt)+'"></label><label>'+esc(t("tx_date"))+'<input id="t_d" type="date" value="'+esc(x.date)+'"></label></div><label>'+esc(t("tx_acc"))+'<select id="t_c">'+A+"</select></label>"+(x.inv?"":'<label>'+esc(t("tx_cat"))+'<select id="t_k">'+cats.map(function(k){return opt(k,t("cat_"+k),x.cat===k)}).join("")+"</select></label>")+'<label>'+esc(t("tx_memo"))+'<input id="t_m" value="'+esc(x.memo||"")+'"></label><div class="row">'+(id?'<button class="b bad sm" id="t_del">'+esc(t("delete"))+"</button>":"")+'<span class="sp"></span><button class="b alt sm" id="t_x">'+esc(t("cancel"))+'</button><button class="b sm" id="t_ok">'+esc(t("save"))+"</button></div>",function(){
  $("t_x").onclick=closeDlg;if($("t_del"))$("t_del").onclick=function(){if(confirm(t("fin_del_q"))){var pair=x.xf&&list("txn").filter(function(o){return o.xf===x.xf&&o.id!==id})[0];del("txn",id);if(pair)del("txn",pair.id);closeDlg();render()}};
  $("t_ok").onclick=function(){var a=num($("t_a").value),ac=DB.account[$("t_c").value];if(a<=0||!ac){$("t_a").focus();return}var o={acc:ac.id,date:$("t_d").value||today(),amt:rnd(a,ac.cur),dir:dir,cur:ac.cur,memo:$("t_m").value.trim()};if(x.inv)o.inv=x.inv;if(x.xf)o.xf=x.xf;o.cat=x.inv?x.cat:($("t_k")?$("t_k").value:x.cat);put("txn",id||rid(),o);closeDlg();render()}})}
function xferDialog(from){var A=accOptions("",from);if(list("account").length<2){toast(t("xfer_need"));return}
 dlg('<h2>'+esc(t("m_xfer"))+'</h2><label>'+esc(t("tx_from"))+'<select id="x_f">'+A+'</select></label><label>'+esc(t("tx_to"))+'<select id="x_t">'+accOptions("",(list("account").filter(function(a){return a.id!==from})[0]||{}).id)+'</select></label><div class="g2"><label>'+esc(t("tx_amount"))+'<input id="x_a" inputmode="decimal"></label><label>'+esc(t("tx_date"))+'<input id="x_d" type="date" value="'+today()+'"></label></div><label>'+esc(t("tx_memo"))+'<input id="x_m"></label><div class="row"><span class="sp"></span><button class="b alt sm" id="x_x">'+esc(t("cancel"))+'</button><button class="b sm" id="x_ok">'+esc(t("save"))+"</button></div>",function(){
  $("x_x").onclick=closeDlg;$("x_ok").onclick=function(){var f=DB.account[$("x_f").value],to=DB.account[$("x_t").value],a=num($("x_a").value);if(!f||!to||f.id===to.id||f.cur!==to.cur){toast(t("xfer_need"));return}if(a<=0){$("x_a").focus();return}
   var g=rid(),d=$("x_d").value||today(),m=$("x_m").value.trim();put("txn",rid(),{acc:f.id,date:d,amt:rnd(a,f.cur),dir:"out",cur:f.cur,cat:"transfer",xf:g,memo:m||(t("m_xfer")+" → "+to.name)});put("txn",rid(),{acc:to.id,date:d,amt:rnd(a,f.cur),dir:"in",cur:f.cur,cat:"transfer",xf:g,memo:m||(t("m_xfer")+" ← "+f.name)});closeDlg();render()}})}
function accountDialog(id,cur){var a=id?DB.account[id]:{name:"",type:"cash",cur:cur||prefs().cur,open:0},used=id&&list("txn").some(function(x){return x.acc===id});
 dlg('<h2>'+esc(t(id?"acc_edit":"m_add_acc"))+'</h2><label>'+esc(t("acc_name"))+'<input id="a_n" value="'+esc(a.name)+'"></label><div class="g2"><label>'+esc(t("acc_type"))+'<select id="a_t">'+opt("cash",t("acc_cash"),a.type==="cash")+opt("bank",t("acc_bank"),a.type==="bank")+"</select></label><label>"+esc(t("acc_cur"))+'<select id="a_c"'+(used?" disabled":"")+">"+Object.keys(CUR).map(function(c){return opt(c,c,c===a.cur)}).join("")+'</select></label></div><label>'+esc(t("acc_open"))+'<input id="a_o" inputmode="decimal" value="'+esc(a.open||0)+'"></label><div class="row">'+(id&&!used?'<button class="b bad sm" id="a_del">'+esc(t("delete"))+"</button>":"")+'<span class="sp"></span><button class="b alt sm" id="a_x">'+esc(t("cancel"))+'</button><button class="b sm" id="a_ok">'+esc(t("save"))+"</button></div>",function(){
  $("a_x").onclick=closeDlg;if($("a_del"))$("a_del").onclick=function(){if(confirm(t("fin_del_q"))){del("account",id);closeDlg();V.page=null;render()}};
  $("a_ok").onclick=function(){var n=$("a_n").value.trim();if(!n){$("a_n").focus();return}var c=$("a_c").value;put("account",id||rid(),{name:n,type:$("a_t").value,cur:c,open:rnd(num($("a_o").value),c)});closeDlg();render()}})}
function prefsDialog(){var p=prefs();
 dlg('<h2>'+ic("sliders")+" "+esc(t("pf_title"))+'</h2><div class="g2"><label>'+esc(t("pf_vat"))+'<input id="f_v" inputmode="decimal" value="'+p.vat+'"></label><label>'+esc(t("pf_vat_no"))+'<input id="f_n" value="'+esc(p.vatNo)+'"></label></div><label><input type="checkbox" id="f_o"'+(p.vatOn?" checked":"")+"> "+esc(t("pf_vat_default"))+'</label><div class="g2"><label>'+esc(t("pf_prefix"))+'<input id="f_p" value="'+esc(p.prefix)+'"></label><label>'+esc(t("pf_terms"))+'<input id="f_t" inputmode="numeric" value="'+p.terms+'"></label></div><label>'+esc(t("pf_cur"))+'<select id="f_c">'+Object.keys(CUR).map(function(c){return opt(c,c,c===p.cur)}).join("")+'</select></label><label>'+esc(t("pf_pay"))+'<textarea id="f_pay" rows="3">'+esc(p.pay)+'</textarea></label><div class="row"><span class="sp"></span><button class="b alt sm" id="f_x">'+esc(t("cancel"))+'</button><button class="b sm" id="f_ok">'+esc(t("save"))+"</button></div>",function(){
  $("f_x").onclick=closeDlg;$("f_ok").onclick=function(){savePrefs({vat:Math.max(0,Math.min(100,num($("f_v").value))),vatNo:$("f_n").value.trim(),vatOn:$("f_o").checked?1:0,prefix:$("f_p").value.trim(),terms:Math.max(0,Math.round(num($("f_t").value))),cur:$("f_c").value,pay:$("f_pay").value.trim()});closeDlg();toast(t("fin_saved"));render()}})}

/* ---------- printable A4 document ---------- */
function wrapText(x,text,maxW){var out=[];String(text||"").split("\n").forEach(function(par){var line="",lastSp=-1;for(var i=0;i<par.length;i++){var ch=par[i];if(x.measureText(line+ch).width>maxW&&line){var cut=lastSp>0?lastSp:line.length;out.push(line.slice(0,cut).trimEnd());line=(lastSp>0?line.slice(cut):"").trimStart()+ch;lastSp=-1}else line+=ch;if(ch===" ")lastSp=line.length}out.push(line)});return out}
function docPages(x){var B=biz(),p=prefs(),sale=x.k==="sale",c=DB.contact[x.cid]||{},W=1240,H=1754,M=80,FF='"Kantumruy Pro",system-ui,sans-serif',cu=x.cur;
 return Promise.all([document.fonts&&document.fonts.ready,loadImg(B.logo),loadImg(new URL("logo-for-light.svg",location.href).href)]).then(function(r){var logo=r[1],brand=r[2],pages=[],cv,g,y;
  var col={d:M,qR:W-M-390,pR:W-M-215,a:W-M};
  function head(first){cv=document.createElement("canvas");cv.width=W;cv.height=H;g=cv.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,W,H);g.textBaseline="top";pages.push(cv);var tx=M;
   if(logo){var s=Math.min(first?130/logo.width:80/logo.width,first?130/logo.height:80/logo.height);g.drawImage(logo,M,M,logo.width*s,logo.height*s);tx=M+logo.width*s+24}
   g.fillStyle="#123c3a";g.font="700 "+(first?44:34)+"px "+FF;if(B.name)g.fillText(B.name,tx,M+4);g.fillStyle="#555";g.font="400 23px "+FF;var ly=M+(B.name?(first?62:48):10);if(B.info){g.fillText(B.info,tx,ly);ly+=30}if(p.vatNo&&first)g.fillText(t("sh_vatno")+": "+p.vatNo,tx,ly);
   g.textAlign="right";g.fillStyle="#123c3a";g.font="700 "+(first?50:34)+"px "+FF;g.fillText(t(sale?"sh_invoice":"sh_bill"),W-M,M);g.fillStyle="#222";g.font="600 26px "+FF;g.fillText(x.no||"",W-M,M+(first?64:44));g.textAlign="left";
   g.fillStyle="#123c3a";g.fillRect(M,M+150,W-2*M,4);y=M+185}
  function tblHead(){g.fillStyle="#e6f0ee";g.fillRect(M,y,W-2*M,50);g.fillStyle="#244";g.font="600 22px "+FF;g.fillText(t("sh_desc"),col.d+12,y+13);g.textAlign="right";g.fillText(t("ln_qty"),col.qR,y+13);g.fillText(t("ln_price"),col.pR,y+13);g.fillText(t("inv_total"),col.a-12,y+13);g.textAlign="left";y+=58}
  head(true);
  g.fillStyle="#666";g.font="600 22px "+FF;g.fillText(t(sale?"sh_to":"sh_from").toUpperCase(),M,y);g.fillStyle="#111";g.font="700 32px "+FF;g.fillText(c.name||"",M,y+30);g.fillStyle="#444";g.font="400 24px "+FF;var py=y+72;[c.addr,c.phone,c.email,c.tax?t("sh_vatno")+": "+c.tax:""].filter(Boolean).forEach(function(s){wrapText(g,s,560).forEach(function(l){g.fillText(l,M,py);py+=30})});
  g.textAlign="right";g.fillStyle="#555";g.font="400 24px "+FF;var ry=y;[[t("inv_date"),dfmt(x.date)],[t("inv_due"),dfmt(x.due)],x.ref?[t("inv_ref"),x.ref]:null].filter(Boolean).forEach(function(a){g.fillStyle="#777";g.fillText(a[0],W-M-250,ry);g.fillStyle="#111";g.font="600 24px "+FF;g.fillText(a[1],W-M,ry);g.font="400 24px "+FF;ry+=34});g.textAlign="left";
  y=Math.max(py,ry)+30;tblHead();
  (x.lines||[]).forEach(function(l){g.font="400 25px "+FF;var d=wrapText(g,l.n||"",col.qR-col.d-150),h=Math.max(1,d.length)*34+16;if(y+h>H-150){head(false);tblHead();g.font="400 25px "+FF}
   g.fillStyle="#111";d.forEach(function(s,i){g.fillText(s,col.d+12,y+8+i*34)});g.textAlign="right";g.fillText(String(num(l.q)),col.qR,y+8);g.fillText(fmt(num(l.p),cu),col.pR,y+8);g.fillText(fmt(rnd(num(l.q)*num(l.p),cu),cu),col.a-12,y+8);g.textAlign="left";g.fillStyle="#dde8e5";g.fillRect(M,y+h-2,W-2*M,2);y+=h});
  y+=18;
  var rows=[[t("inv_sub"),fmt(x.sub,cu),0]];if(num(x.vat))rows.push([t("inv_vat")+" "+(x.rate||0)+"%",fmt(x.vat,cu),0]);rows.push([t("inv_total"),fmt(x.total,cu),1]);var pd=paidOf(x);if(pd>0)rows.push([t("inv_paid"),"-"+fmt(pd,cu),0]);rows.push([t("sh_balance"),fmt(balOf(x),cu),1]);if(y+rows.length*40+40>H-130){head(false)}
  rows.forEach(function(a){g.font=(a[2]?"700 ":"400 ")+"27px "+FF;g.fillStyle=a[2]?"#123c3a":"#333";g.textAlign="left";g.fillText(a[0],W-M-470,y);g.textAlign="right";g.fillText(a[1],W-M-12,y);g.textAlign="left";y+=40});
  y+=20;g.fillStyle="#444";g.font="400 23px "+FF;if(x.note){g.fillStyle="#777";g.fillText(t("inv_note"),M,y);y+=30;g.fillStyle="#222";wrapText(g,x.note,W-2*M).forEach(function(l){g.fillText(l,M,y);y+=30});y+=14}
  if(sale&&p.pay&&y<H-240){g.fillStyle="#777";g.fillText(t("sh_pay"),M,y);y+=30;g.fillStyle="#222";wrapText(g,p.pay,W-2*M).slice(0,6).forEach(function(l){if(y<H-130){g.fillText(l,M,y);y+=30}})}
  pages.forEach(function(c2,i){var q=c2.getContext("2d");q.fillStyle="#888";q.font="400 20px "+FF;q.textBaseline="top";q.textAlign="center";var s="by Soramma Finance"+(pages.length>1?" · "+(i+1)+"/"+pages.length:"");q.fillText(s,W/2+(brand?14:0),H-60);if(brand){var tw=q.measureText(s).width;q.drawImage(brand,W/2+14-tw/2-34,H-64,26,26)}});
  return pages})}
function docAction(a,id){var x=DB.invoice[id];if(!x)return;x.id=id;docPages(x).then(function(cv){
 if(a==="print"){printHtml('<!doctype html><meta charset="utf-8"><title>'+esc(x.no||"")+'</title><style>@page{size:A4;margin:0}body{margin:0}img{display:block;width:210mm;height:297mm}</style>'+cv.map(function(c){return'<img src="'+c.toDataURL("image/jpeg",.92)+'">'}).join(""));return}
 var pages=cv.map(function(c){var u=c.toDataURL("image/jpeg",.9),b=atob(u.split(",")[1]),arr=new Uint8Array(b.length);for(var i=0;i<b.length;i++)arr[i]=b.charCodeAt(i);return{jpeg:arr,w:c.width,h:c.height,full:true}}),
  name=(x.no||"document").replace(/[^\w\-]+/g,"_")+".pdf",blob=new Blob([SC.makePdf(pages,x.no||"Document")],{type:"application/pdf"});
 if(a==="share"&&navigator.canShare){var f=new File([blob],name,{type:"application/pdf"});if(navigator.canShare({files:[f]})){navigator.share({files:[f],title:name}).catch(function(){});return}}
 download(name,blob)})}

/* ---------- actions ---------- */
function act(a,d){
 if(a==="seg"){V.sub[d.tab]=d.v;V.q="";V.filt="all";render();return}
 if(a==="filt"){V.filt=d.v;render();return}
 if(a==="back"){V.page=null;V.ed=null;render();return}
 if(a==="open"){V.page="doc";V.pid=d.id;render();window.scrollTo(0,0);return}
 if(a==="newdoc"){newDoc(d.k);return}
 if(a==="editdoc"){editDoc(d.id);return}
 if(a==="dup"){editDoc(d.id,true);return}
 if(a==="deldoc"){if(confirm(t("fin_del_q"))){list("txn").forEach(function(x){if(x.inv===d.id)del("txn",x.id)});del("invoice",d.id);V.page=null;render()}return}
 if(a==="addline"){readEd();V.ed.lines.push({n:"",q:1,p:"",v:prefs().vatOn?1:0});render();return}
 if(a==="delline"){readEd();if(V.ed.lines.length>1)V.ed.lines.splice(+d.i,1);else V.ed.lines=[{n:"",q:1,p:"",v:prefs().vatOn?1:0}];render();return}
 if(a==="savedoc"){saveDoc();return}
 if(a==="pay"){payDialog(d.id);return}
 if(a==="print"||a==="pdf"||a==="share"){docAction(a,d.id);return}
 if(a==="newct"){contactDialog(d.k,"");return}
 if(a==="ct"){contactDialog("",d.id);return}
 if(a==="tx"){txnDialog(d.dir,d.acc||"");return}
 if(a==="txe"){txnDialog("","",d.id);return}
 if(a==="xfer"){xferDialog(d.acc||"");return}
 if(a==="newacc"){accountDialog("");return}
 if(a==="editacc"){accountDialog(d.id);return}
 if(a==="acct"){V.page="acct";V.pid=d.id;render();window.scrollTo(0,0);return}
 if(a==="rep"){V.rep=d.v;render();return}
 if(a==="per"){setPer(d.v);render();return}
 if(a==="pf"){prefsDialog();return}
 if(a==="rprint"){printReport(curRep());return}
 if(a==="rcsv"){var rep=curRep();download("report.csv",new Blob([csvOf(rep)],{type:"text/csv"}));return}}
document.addEventListener("change",function(e){if(e.target.id==="p_from"||e.target.id==="p_to"){V.from=$("p_from").value||V.from;V.to=$("p_to").value||V.to;render()}});
boot();
