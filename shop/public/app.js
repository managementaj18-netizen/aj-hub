/* Soramma Shop — app: data store + sync, dashboard, POS, products, sales, reports, receipts. */

/* ---------- money & dates ---------- */
var CUR={USD:{sym:"$",dec:2},KHR:{sym:"៛",dec:0}};
function rnd(n,c){var d=CUR[c||prefs().cur].dec,k=Math.pow(10,d);return Math.round((+n||0)*k+(n<0?-1e-9:1e-9))/k}
function fmt(n,c){c=c||prefs().cur;var d=CUR[c].dec,s=Math.abs(+n||0).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d}),neg=(+n||0)<0&&rnd(n,c)!==0;
 return(neg?"-":"")+(c==="USD"?"$"+s:s+" ៛")}
function pad(n){return("0"+n).slice(-2)}
function isoDate(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function today(){return isoDate(new Date())}
function addDays(iso,n){var d=new Date(iso+"T12:00:00");d.setDate(d.getDate()+n);return isoDate(d)}
function dfmt(iso){return iso&&/^\d{4}-\d{2}-\d{2}$/.test(iso)?iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+iso.slice(0,4):(iso||"")}
function tfmt(ts){var d=new Date(ts);return pad(d.getHours())+":"+pad(d.getMinutes())}
function monthRange(off){var d=new Date();d=new Date(d.getFullYear(),d.getMonth()+off,1);var e=new Date(d.getFullYear(),d.getMonth()+1,0);return[isoDate(d),isoDate(e)]}
function yearRange(){var y=new Date().getFullYear();return[y+"-01-01",y+"-12-31"]}
function num(v){var n=parseFloat(String(v).replace(/,/g,""));return isFinite(n)?n:0}
function mShort(off){var d=new Date();d=new Date(d.getFullYear(),d.getMonth()+off,1);return d.toLocaleDateString(LANG==="km"?"km-KH":"en-GB",{month:"short"})}
function dShort(iso){var d=new Date(iso+"T12:00:00");return d.toLocaleDateString(LANG==="km"?"km-KH":"en-GB",{weekday:"short"})}

/* ---------- data store (records synced to the server) ---------- */
var KINDS=["product","sale","customer","stock","expense","prefs"];
var DB={},SINCE=0,OUTBOX=[],BUSY=false,TIMERS=false,SM=null;
function emptyDB(){var o={};KINDS.forEach(function(k){o[k]={}});return o}
DB=emptyDB();
function dbKey(){return"shop_db_"+(ME&&ME.id)}
function loadLocal(){DB=emptyDB();SINCE=0;OUTBOX=[];SM=null;var o=ME?load(dbKey(),null):null;if(o){DB=o.db||DB;SINCE=o.since||0;OUTBOX=o.out||[];KINDS.forEach(function(k){DB[k]=DB[k]||{}})}}
function saveLocal(){if(ME)save(dbKey(),{db:DB,since:SINCE,out:OUTBOX})}
function put(kind,id,d){DB[kind][id]=d;SM=null;OUTBOX=OUTBOX.filter(function(x){return x.id!==id});OUTBOX.push({id:id,kind:kind,d:d});saveLocal();kick()}
function del(kind,id){delete DB[kind][id];SM=null;OUTBOX=OUTBOX.filter(function(x){return x.id!==id});OUTBOX.push({id:id,kind:kind,del:1});saveLocal();kick()}
var kt=0;function kick(){clearTimeout(kt);kt=setTimeout(function(){flush()},400)}
function flush(){if(!TOK||BUSY||!OUTBOX.length)return Promise.resolve();BUSY=true;var batch=OUTBOX.slice(0,100);
 return api("POST","data",{recs:batch}).then(function(){OUTBOX=OUTBOX.filter(function(x){return batch.indexOf(x)<0});saveLocal();BUSY=false;if(OUTBOX.length)return flush()}).catch(function(e){BUSY=false;errh(e)})}
function pull(){if(!TOK)return Promise.resolve();return api("GET","data?since="+SINCE).then(function(r){var pend={};OUTBOX.forEach(function(x){pend[x.id]=1});
  (r.recs||[]).forEach(function(x){if(pend[x.id]||!DB[x.kind])return;if(x.del)delete DB[x.kind][x.id];else DB[x.kind][x.id]=x.d});
  SM=null;SINCE=r.now;saveLocal();if(r.more)return pull();softRender()}).catch(errh)}
function errh(e){if(e&&e.code==="auth")sessionEnd();else if(e&&e.code==="trial_over"&&ME){ME.expired=true;render()}}
function softRender(){if($("dlg").open||V.page==="cart")return;render()}
function list(kind){return Object.keys(DB[kind]).map(function(id){var o=DB[kind][id];o.id=id;return o})}
var PD={cur:"USD",vatOn:0,vat:10,prefix:"R-",next:1,footer:"",paper:"80",low:5,pay2:""};
function prefs(){var p=(DB.prefs&&DB.prefs.prefs)||{},o={};for(var k in PD)o[k]=p[k]==null?PD[k]:p[k];return o}
function savePrefs(patch){var p=prefs();for(var k in patch)p[k]=patch[k];put("prefs","prefs",p)}

/* ---------- stock & sales maths ---------- */
function stockMap(){if(SM)return SM;SM={};list("product").forEach(function(p){SM[p.id]=num(p.stock0)});list("stock").forEach(function(m){if(SM[m.pid]!=null)SM[m.pid]+=num(m.q)});
 list("sale").forEach(function(s){if(s.void)return;(s.lines||[]).forEach(function(l){if(l.pid&&SM[l.pid]!=null)SM[l.pid]-=num(l.q)})});return SM}
function stockOf(p){var v=stockMap()[p.id];return v==null?0:v}
function lowOf(p){return!!p.track&&stockOf(p)<=num(p.low===""||p.low==null?prefs().low:p.low)}
function sales(f,to){return list("sale").filter(function(s){return!s.void&&s.date>=f&&s.date<=to})}
function cogs(s){return(s.lines||[]).reduce(function(a,l){return a+num(l.c)*num(l.q)},0)}
function saleStat(arr){var r={n:0,total:0,net:0,cost:0,items:0};arr.forEach(function(s){r.n++;r.total+=num(s.total);r.net+=num(s.net);r.cost+=cogs(s);(s.lines||[]).forEach(function(l){r.items+=num(l.q)})});r.total=rnd(r.total);r.net=rnd(r.net);r.cost=rnd(r.cost);r.profit=rnd(r.net-r.cost);return r}
function expenseSum(f,to){return rnd(list("expense").filter(function(x){return x.date>=f&&x.date<=to}).reduce(function(a,x){return a+num(x.amt)},0))}
function cname(id){var c=DB.customer[id];return c?c.name:""}
function cats(){var s={};list("product").forEach(function(p){if(p.cat)s[p.cat]=1});return Object.keys(s).sort()}

/* ---------- cart ---------- */
var CART=[],CDISC={v:0,pct:false},CCUST="",CPAY="cash",CRECV="";
function cartKey(){return"shop_cart_"+(ME&&ME.id)}
function saveCart(){save(cartKey(),{c:CART,d:CDISC,u:CCUST})}
function loadCart(){var o=ME?load(cartKey(),null):null;CART=o&&o.c||[];CDISC=o&&o.d||{v:0,pct:false};CCUST=o&&o.u||"";CPAY="cash";CRECV=""}
function cartCalc(){var p=prefs(),sub=0,qty=0;CART.forEach(function(l){sub+=num(l.q)*num(l.p);qty+=num(l.q)});sub=rnd(sub);var d=CDISC.pct?sub*num(CDISC.v)/100:num(CDISC.v);d=rnd(Math.max(0,Math.min(sub,d)));var net=rnd(sub-d),tax=p.vatOn?rnd(net*num(p.vat)/100):0;return{sub:sub,disc:d,net:net,tax:tax,total:rnd(net+tax),qty:qty}}
function addToCart(pid){var p=DB.product[pid];if(!p)return;p.id=pid;var l=CART.filter(function(x){return x.pid===pid})[0];if(l)l.q=num(l.q)+1;else CART.push({pid:pid,n:p.name,p:num(p.price),c:num(p.cost),q:1});saveCart();render()}
function cartQty(i,dq){var l=CART[i];if(!l)return;l.q=Math.max(0,num(l.q)+dq);if(l.q<=0)CART.splice(i,1);saveCart();render()}

/* ---------- state & shell ---------- */
var V={tab:"home",sub:{sales:"list"},q:"",cat:"",low:false,per:"today",page:null,pid:null,from:"",to:""};
var TABS=[["home","home","nav_home"],["sell","cart","nav_sell"],["items","box","nav_items"],["sales","receipt","nav_sales"]];
P.home='<path d="M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10"/>';P.receipt='<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM8 8h8M8 12h8M8 16h5"/>';
P.cart='<path d="M3 4h2l2.5 11h10L20 7H6.5"/><circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/>';P.box='<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9"/>';
P.alert='<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17.5v.01"/>';P.users='<circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2.5.6 4 2.4 4 6"/>';
P.wallet='<path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h2"/>';P.chart='<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>';
P.edit='<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>';P.arrowin='<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>';P.arrowout='<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>';P.minus='<path d="M5 12h14"/>';P.barcode='<path d="M4 6v12M7 6v12M11 6v12M14 6v12M17 6v12M20 6v12" stroke-width="1.6"/>';P.tag='<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>';
function nav(){$("nav").innerHTML=TABS.map(function(x){return'<button class="'+(V.tab===x[0]?"on":"")+'" data-t="'+x[0]+'"><span>'+ic(x[1],24)+"</span>"+esc(t(x[2]))+"</button>"}).join("")+'<button data-t="__menu"><span>'+ic("menu",24)+"</span>"+esc(t("nav_menu"))+"</button>";
 $("nav").onclick=function(e){var b=e.target.closest("button");if(!b)return;if(b.dataset.t==="__menu"){openDrawer();return}V.tab=b.dataset.t;V.page=null;V.q="";render();window.scrollTo(0,0)}}
function openDrawer(){var d=$("drawer");
 d.innerHTML='<div class="dh"><img src="logo-for-dark.svg" alt=""><b>Soramma Shop<small style="display:block;font-weight:400;opacity:.75;font-size:12px">by Soramma</small></b><button id="dx" aria-label="close">'+ic("x",22)+'</button></div>'+
 (ME?'<button class="mi" data-t="__cust">'+ic("users",20)+esc(t("sh_customers"))+'</button><button class="mi" data-t="__exp">'+ic("wallet",20)+esc(t("sh_expenses"))+'</button><button class="mi" data-t="__demo">'+ic("zap",20)+esc(LANG==="km"?"ទិន្នន័យគំរូ":"Sample data")+'</button><button class="mi" data-t="__pf">'+ic("sliders",20)+esc(t("sh_settings"))+"</button><hr>":"")+
 '<button class="mi" data-t="__lang">'+ic("globe",20)+esc(t("language"))+" · "+esc((LANGS.filter(function(l){return l[0]===LANG})[0]||["","English"])[1])+"</button>"+
 (ME?'<button class="mi" data-t="__sup">'+ic("send",20)+esc(t("support"))+(SUP&&ME.role!=="owner"?'<span class="dot">'+SUP+"</span>":"")+"</button>":"")+
 (ME&&ME.role==="owner"?'<button class="mi" data-t="__inbox">'+ic("text",20)+esc(t("inbox"))+(SUP?'<span class="dot">'+SUP+"</span>":"")+"</button>":"")+
 (ME?'<button class="mi" data-t="__prof">'+ic("user",20)+esc(t("profile"))+"</button>":"")+
 (ME&&ME.role==="owner"?'<button class="mi" data-t="__set">'+ic("users",20)+esc(t("settings"))+"</button>":"")+
 (ME?'<hr><div style="padding:6px 18px"><b>'+esc(t("signed_as",{n:ME.name}))+'</b>'+(ME.role==="owner"?' <span class="pill ok">ADMIN</span>':"")+'</div><button class="mi" data-t="__logout">'+ic("lock",20)+esc(t("logout"))+"</button>":"")+
 '<div class="muted" style="font-size:12px;padding:12px 18px">'+esc(t("privacy_note"))+"</div>";
 d.onclick=function(e){var b=e.target.closest("button");if(!b)return;if(b.id==="dx"){closeDrawer();return}var k=b.dataset.t;if(!k)return;closeDrawer();
  if(k==="__lang")langDialog(false);else if(k==="__set")settingsDialog();else if(k==="__prof")profileDialog();else if(k==="__pf")prefsDialog();else if(k==="__demo")demoDialog();else if(k==="__sup")supportDialog();else if(k==="__inbox")inboxDialog();
  else if(k==="__cust")customersDialog();else if(k==="__exp")expensesDialog();
  else if(k==="__logout"){if(confirm(t("logout")+"?"))api("POST","logout").catch(function(){}).then(function(){TOK="";save(K_TOK,"");location.reload()})}};
 $("ov").classList.remove("hide");d.classList.add("open")}
$("ov").onclick=function(){closeDrawer()};
$("hm").onclick=function(){if(AUTH==="app")openDrawer()};$("hl").onclick=function(){langDialog(false)};

/* ---------- lock / trial ---------- */
function trialBar(){if(!ME||ME.role==="owner"||ME.expires==null||ME.expired)return"";var d=Math.max(0,Math.ceil((ME.expires-Date.now())/86400000));return'<div class="note" style="margin-bottom:12px">'+esc(t("trial_left",{n:d,d:dstr(ME.expires)}))+(PINFO.contact?" · "+linkify(PINFO.contact):"")+"</div>"}
function vLock(){return'<div class="card" style="text-align:center"><h2>'+esc(t("trial_over_t"))+"</h2><p>"+esc(t("trial_over_m"))+"</p>"+(PINFO.contact?"<p><b>"+linkify(PINFO.contact)+'</b></p>':"")+'<button class="b" id="lk_sup">'+esc(t("support"))+'</button> <button class="b alt" id="lk_re">'+esc(t("check_again"))+"</button></div>"}
function lockBind(){var sb=$("lk_sup");if(sb)sb.onclick=function(){supportDialog()};var b=$("lk_re");if(b)b.onclick=function(){api("GET","sync").then(function(r){ME=r.user;PINFO=r;save("shop_me",ME);render();if(!ME.expired)pull();else toast(t("trial_over_t"))}).catch(function(){toast(t("net_err"))})}}

/* ---------- start / boot ---------- */
function timers(){if(TIMERS)return;TIMERS=true;setInterval(function(){if(!document.hidden&&ME&&!ME.expired)flush().then(pull)},30000);setInterval(pollSup,120000);window.addEventListener("online",function(){flush().then(pull)})}
function startApp(){AUTH="app";api("GET","sync").then(function(r){ME=r.user;PINFO=r;SUP=r.sup||0;save("shop_me",ME);loadLocal();loadCart();V.tab="home";V.page=null;render();timers();return flush()}).then(pull).catch(function(e){if(e&&e.code==="auth")sessionEnd();else{AUTH="app";render()}})}
function boot(){render();
 if(TOK){AUTH="app";ME=load("shop_me",null);if(ME){loadLocal();loadCart()}render();api("GET","sync").then(function(r){ME=r.user;PINFO=r;SUP=r.sup||0;save("shop_me",ME);if(!Object.keys(DB.product).length&&!Object.keys(DB.sale).length){loadLocal();loadCart()}render();timers();return flush()}).then(pull).catch(function(e){if(e&&e.code==="auth")sessionEnd();else if(ME)timers()});return}
 api("GET","ping").then(function(p){NEEDSETUP=!!p.setup;PINFO=p;AUTH="login";render()}).catch(function(){NOBACK=true;AUTH="login";render()})}
function render(){nav();$("hm").innerHTML=ic("menu",26);$("hl").innerHTML=ic("globe",24);document.documentElement.lang=LANG;var a=$("app");
 if($("hsub"))$("hsub").textContent="by Soramma"+(AUTH==="app"&&ME&&ME.role==="owner"?" · ADMIN":"");
 $("hm").style.visibility=AUTH==="app"?"visible":"hidden";
 if(AUTH==="boot"){$("nav").innerHTML="";a.innerHTML='<p class="muted" style="text-align:center;padding:40px">'+esc(t("loading"))+"</p>";return}
 if(AUTH==="login"){$("nav").innerHTML="";a.innerHTML=vLogin();bindLogin();return}
 if(ME&&ME.expired){$("nav").innerHTML="";a.innerHTML=vLock();lockBind();return}
 var h;if(V.page==="cart")h=vCart();else if(V.tab==="home")h=vHome();else if(V.tab==="sell")h=vSell();else if(V.tab==="items")h=vItems();else h=vSales();
 a.innerHTML=trialBar()+h+cartBar();bindAll();if(V.tab==="home"&&!V.page&&AUTH==="app")homeChatBind()}
function bindAll(){var a=$("app");
 a.onclick=function(e){var b=e.target.closest("[data-act]");if(!b)return;act(b.dataset.act,b.dataset)};
 var q=$("q");if(q){q.oninput=function(e){V.q=e.target.value;var p=e.target.selectionStart;render();var n=$("q");if(n){n.focus();n.setSelectionRange(p,p)}};
  q.onkeydown=function(e){if(e.key!=="Enter"||V.tab!=="sell")return;var v=q.value.trim();if(!v)return;var hit=list("product").filter(function(p){return p.sku&&String(p.sku)===v})[0];if(hit){V.q="";addToCart(hit.id);var n=$("q");if(n)n.focus()}}}
 var cd=$("c_disc");if(cd)bindCart()}

/* ---------- small ui helpers ---------- */
function dsAttr(ds){var s="";for(var k in ds)s+=" data-"+k+'="'+esc(ds[k])+'"';return s}
function qa(a,i,k,ds){return'<button data-act="'+a+'"'+dsAttr(ds||{})+'><span class="ico">'+ic(i,22)+"</span>"+esc(t(k))+"</button>"}
function dlg(html,wire){$("dbody").innerHTML=html;if(!$("dlg").open)$("dlg").showModal();$("dlg").oncancel=null;$("dbody").onclick=null;wire()}
function closeDlg(){$("dlg").close()}
function opt(v,l,sel){return'<option value="'+esc(v)+'"'+(sel?" selected":"")+">"+esc(l)+"</option>"}
function seg(tab,items){return'<div class="seg">'+items.map(function(x){return'<button data-act="seg" data-tab="'+tab+'" data-v="'+x[0]+'" class="'+(V.sub[tab]===x[0]?"on":"")+'">'+esc(t(x[1]))+"</button>"}).join("")+"</div>"}
function back(){return'<div class="row" style="margin-bottom:10px"><button class="b alt sm" data-act="back">'+ic("x",16)+esc(t("back"))+"</button></div>"}
var PAL=["#1d6fe8","#f97316","#16a34a","#7c3aed","#db2777","#0891b2","#eab308","#ef4444","#64748b"];

/* ---------- charts (inline SVG) ---------- */
function dayBars(S){var W=320,H=132,pb=22,pt=14,n=S.length,mx=1;S.forEach(function(x){mx=Math.max(mx,x.v)});var gw=(W-8)/n,bw=Math.min(26,gw-6),h=H-pb-pt,o="";
 for(var g=0;g<=3;g++){var y=pt+h-h*g/3;o+='<line x1="4" x2="'+(W-4)+'" y1="'+y+'" y2="'+y+'" stroke="#dfe8f4" stroke-width="1"/>'}
 S.forEach(function(x,i){var cx=4+gw*i+gw/2,hh=Math.max(x.v>0?2:0,h*x.v/mx),last=i===n-1;
  o+='<rect x="'+(cx-bw/2)+'" y="'+(pt+h-hh)+'" width="'+bw+'" height="'+hh+'" rx="4" fill="'+(last?"#1d6fe8":"#7fb0f5")+'"/>'+(x.v>0?'<text x="'+cx+'" y="'+(pt+h-hh-4)+'" text-anchor="middle" font-size="8.5" fill="#15233a">'+(x.v>=1e6?(x.v/1e6).toFixed(1)+"M":x.v>=1e3?(x.v/1e3).toFixed(x.v>=1e4?0:1)+"k":Math.round(x.v))+"</text>":"")+
  '<text x="'+cx+'" y="'+(H-7)+'" text-anchor="middle" font-size="9.5" fill="'+(last?"#1d6fe8":"#667896")+'" font-weight="'+(last?700:400)+'">'+esc(x.l)+"</text>"});
 return'<svg viewBox="0 0 '+W+" "+H+'" width="100%" role="img" aria-label="chart">'+o+"</svg>"}
function hbar(items){if(!items.length)return"";var mx=items[0].v||1;return'<div class="hb">'+items.map(function(x,i){return'<div class="hbr"><span class="hbl">'+esc(x.k)+'</span><span class="hbt"><i style="width:'+Math.max(2,x.v/mx*100)+"%;background:"+PAL[i%PAL.length]+'"></i></span><b>'+fmt(x.v)+"</b></div>"}).join("")+"</div>"}
function pie(items){var tot=items.reduce(function(s,x){return s+x.v},0);if(!tot)return"";var cx=70,cy=70,R=64,r=34,ang=-Math.PI/2,paths="";
 items.forEach(function(x,i){var f=x.v/tot,a2=ang+f*2*Math.PI,lg=f>.5?1:0;if(f>=.9999){paths+='<circle cx="'+cx+'" cy="'+cy+'" r="'+((R+r)/2)+'" fill="none" stroke="'+PAL[i%PAL.length]+'" stroke-width="'+(R-r)+'"/>'}
  else{var x1=cx+R*Math.cos(ang),y1=cy+R*Math.sin(ang),x2=cx+R*Math.cos(a2),y2=cy+R*Math.sin(a2),x3=cx+r*Math.cos(a2),y3=cy+r*Math.sin(a2),x4=cx+r*Math.cos(ang),y4=cy+r*Math.sin(ang);
   paths+='<path d="M'+x1.toFixed(1)+" "+y1.toFixed(1)+" A"+R+" "+R+" 0 "+lg+" 1 "+x2.toFixed(1)+" "+y2.toFixed(1)+" L"+x3.toFixed(1)+" "+y3.toFixed(1)+" A"+r+" "+r+" 0 "+lg+" 0 "+x4.toFixed(1)+" "+y4.toFixed(1)+' Z" fill="'+PAL[i%PAL.length]+'"/>'}ang=a2});
 return'<div class="pie"><svg viewBox="0 0 140 140" width="140" height="140">'+paths+'</svg><div class="pl">'+items.map(function(x,i){return'<div><i style="background:'+PAL[i%PAL.length]+'"></i><span>'+esc(x.k)+"</span><b>"+Math.round(x.v/tot*100)+"%</b></div>"}).join("")+"</div></div>"}
function topN(o,k){var a=Object.keys(o).map(function(x){return{k:x,v:o[x]}}).filter(function(x){return x.v>0}).sort(function(a,b){return b.v-a.v});if(a.length>k){var rest=a.slice(k-1).reduce(function(s,x){return s+x.v},0);a=a.slice(0,k-1);a.push({k:t("sh_others"),v:rest})}return a}
function tile(cls,i,l,v,sub){return'<div class="stile '+cls+'"><span>'+ic(i,22)+"</span><b>"+v+"</b><small>"+esc(l)+"</small>"+(sub?"<em>"+sub+"</em>":"")+"</div>"}

/* ---------- home dashboard ---------- */
var HC=null;
function homeChat(){var L=HC||[];return'<div class="card hchat"><div class="row"><b>'+ic("send",18)+" "+esc(t("hd_ask"))+'</b><span class="sp"></span><button class="b alt sm" data-act="chatfull">'+esc(t("hd_ask_more"))+'</button></div><div id="hc_list" class="hc-list">'+(L.length?bubHtml(L.slice(-3)):'<p class="muted" style="margin:6px 0">'+esc(t("hd_ask_none"))+"</p>")+'</div><div class="row" style="align-items:flex-end;margin-top:8px"><textarea id="hc_t" rows="2" placeholder="'+esc(t("hd_ask_ph"))+'" style="margin:0;flex:1"></textarea><button class="b" id="hc_go">'+ic("send",18)+"</button></div></div>"}
function homeChatBind(){var go=$("hc_go");if(!go)return;var load2=function(){api("GET","support").then(function(r){HC=r.messages||[];var l=$("hc_list");if(l){l.innerHTML=HC.length?bubHtml(HC.slice(-3)):'<p class="muted" style="margin:6px 0">'+esc(t("hd_ask_none"))+"</p>";l.scrollTop=l.scrollHeight}if(SUP){SUP=0;badge()}}).catch(function(){})};
 if(HC===null)load2();
 go.onclick=function(){var v=$("hc_t").value.trim();if(!v)return;go.disabled=true;api("POST","support",{text:v}).then(function(r){HC=r.messages||[];$("hc_t").value="";go.disabled=false;var l=$("hc_list");if(l){l.innerHTML=bubHtml(HC.slice(-3));l.scrollTop=l.scrollHeight}toast(t("hd_ask_sent"))}).catch(function(e){go.disabled=false;toast(t(e&&e.code==="too_many"?"too_many":"net_err"))})}}
function vHome(){var td=today(),st=saleStat(sales(td,td)),mo=monthRange(0),ms=sales(mo[0],mo[1]),mst=saleStat(ms),nm=ME&&ME.name?ME.name:"",P2=list("product"),low=P2.filter(lowOf),S=[],k,byP={};
 var h='<div class="dhead"><small>'+esc(biz().name||"Soramma Shop")+" · "+esc(dfmt(td))+"</small><h1>"+esc(t("hd_welcome"))+(nm?", <span>"+esc(nm)+"</span>":"")+"</h1><p>"+esc(t("sh_home_sub"))+"</p></div>";
 h+='<div class="qa">'+qa("go","cart","sh_new_sale",{t:"sell"})+qa("newp","box","sh_new_product")+qa("stockin","arrowin","sh_stock_in")+qa("newexp","wallet","sh_new_expense")+"</div>";
 if(!P2.length)h+='<div class="note" style="margin-bottom:12px">'+esc(t("sh_welcome"))+"</div>";
 if(low.length)h+='<button class="alertbar" data-act="lowlist"><span>'+ic("alert",20)+"</span><b>"+esc(t("sh_low_alert",{n:low.length}))+"</b><u>"+esc(t("sh_open_items"))+" →</u></button>";
 h+='<div class="stiles">'+tile("t1","cart",t("sh_today_sales"),st.n)+tile("t2","box",t("sh_products"),P2.length)+tile("t3","users",t("sh_customers"),list("customer").length)+tile("t4","chart",t("sh_today_rev"),fmt(st.total))+"</div>";
 for(k=-6;k<=0;k++){var d=addDays(td,k);S.push({l:dShort(d),v:saleStat(sales(d,d)).total})}
 ms.forEach(function(s){(s.lines||[]).forEach(function(l){var n=l.n||t("sh_noname");byP[n]=(byP[n]||0)+num(l.q)*num(l.p)})});
 h+='<div class="dgrid"><div class="card"><small class="muted">'+esc(t("sh_last7"))+"</small>"+dayBars(S)+'<div class="row" style="margin-top:6px"><div><small class="muted">'+esc(t("sh_month_sales"))+'</small><b style="display:block;font-size:18px">'+fmt(mst.total)+'</b></div><span class="sp"></span><div style="text-align:right"><small class="muted">'+esc(t("sh_month_profit"))+'</small><b style="display:block;font-size:18px" class="'+(mst.profit<0?"amt-neg":"amt-pos")+'">'+fmt(mst.profit)+"</b></div></div></div>"+
  '<div class="card"><small class="muted">'+esc(t("sh_top_month"))+"</small>"+(Object.keys(byP).length?hbar(topN(byP,6)):'<p class="muted">'+esc(t("sh_no_data"))+"</p>")+"</div></div>";
 var rec=list("sale").sort(function(a,b){return b.at-a.at}).slice(0,5);if(rec.length)h+="<h3>"+esc(t("sh_recent"))+"</h3>"+rec.map(saleItem).join("");
 return h+homeChat()}

/* ---------- sell (POS) ---------- */
function prodTile(p){var s=stockOf(p),out=p.track&&s<=0,low=lowOf(p);return'<button class="pt'+(out?" out":"")+'" data-act="add" data-id="'+esc(p.id)+'"><i style="background:'+PAL[Math.abs(hashS(p.cat||p.name))%PAL.length]+'"></i><b>'+esc(p.name)+"</b><span>"+fmt(p.price)+"</span>"+(p.track?'<small class="'+(out?"bad":low?"warn":"")+'">'+esc(t(out?"sh_out":"sh_left",{n:s}))+"</small>":"")+"</button>"}
function hashS(s){var h=0;s=String(s||"");for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return h}
function prodFilter(){var q=V.q.trim().toLowerCase();return list("product").filter(function(p){return!p.off}).filter(function(p){return(!V.cat||p.cat===V.cat)&&(!q||(p.name+" "+(p.sku||"")+" "+(p.cat||"")).toLowerCase().indexOf(q)>=0)}).sort(function(a,b){return a.name.toLowerCase()<b.name.toLowerCase()?-1:1})}
function catChips(){var C=cats();if(!C.length)return"";return'<div class="chips"><button data-act="cat" data-v="" class="'+(!V.cat?"on":"")+'">'+esc(t("all"))+"</button>"+C.map(function(c){return'<button data-act="cat" data-v="'+esc(c)+'" class="'+(V.cat===c?"on":"")+'">'+esc(c)+"</button>"}).join("")+"</div>"}
function cartLines(){return CART.length?CART.map(function(l,i){return'<div class="cl"><div class="cn"><b>'+esc(l.n)+"</b><small>"+fmt(l.p)+'</small></div><div class="cq"><button data-act="qm" data-i="'+i+'" aria-label="-">'+ic("minus",16)+"</button><b>"+num(l.q)+'</b><button data-act="qp" data-i="'+i+'" aria-label="+">'+ic("plus",16)+'</button></div><b class="ca">'+fmt(num(l.q)*num(l.p))+"</b></div>"}).join(""):'<p class="muted" style="text-align:center;padding:16px 0">'+esc(t("sh_cart_empty"))+"</p>"}
function cartMini(){var c=cartCalc();return'<div class="card cartbox"><div class="row"><b>'+ic("cart",18)+" "+esc(t("sh_cart"))+'</b><span class="sp"></span>'+(CART.length?'<button class="b alt sm" data-act="clr">'+esc(t("sh_clear"))+"</button>":"")+"</div>"+cartLines()+(CART.length?'<div class="row" style="margin-top:8px"><b>'+esc(t("sh_total"))+'</b><span class="sp"></span><b style="font-size:20px">'+fmt(c.total)+'</b></div><button class="b full" style="margin-top:8px" data-act="cart">'+esc(t("sh_checkout"))+"</button>":"")+"</div>"}
function cartBar(){if(V.tab!=="sell"||V.page||!CART.length)return"";var c=cartCalc();return'<button class="cartbar" data-act="cart"><span>'+ic("cart",20)+"<em>"+c.qty+"</em></span><b>"+esc(t("sh_checkout"))+"</b><u>"+fmt(c.total)+"</u></button>"}
function vSell(){var P2=prodFilter(),all=list("product").length;
 var h='<div class="row" style="gap:8px"><input id="q" placeholder="'+esc(t("sh_search_ph"))+'" value="'+esc(V.q)+'" style="margin:0;flex:1" autocomplete="off"><button class="b alt" data-act="scan" aria-label="scan">'+ic("barcode",22)+'</button><button class="b alt" data-act="custom" aria-label="custom">'+ic("plus",22)+"</button></div>"+catChips();
 var grid=P2.length?'<div class="pgrid">'+P2.map(prodTile).join("")+"</div>":'<div class="card" style="text-align:center;padding:26px"><p class="muted">'+esc(t(all?"sh_no_match":"sh_no_products"))+'</p><button class="b" data-act="newp">'+esc(t("sh_new_product"))+"</button></div>";
 return'<div class="pos"><div class="posL">'+h+grid+'</div><div class="posR">'+cartMini()+"</div></div>"}
function vCart(){var c=cartCalc(),p=prefs(),C=list("customer").sort(function(a,b){return a.name<b.name?-1:1}),recv=CRECV===""?c.total:num(CRECV),chg=rnd(recv-c.total);
 var quick=CUR[p.cur].dec?[5,10,20,50,100]:[5000,10000,20000,50000,100000];
 return back()+'<div class="card"><h2 style="margin-top:0">'+ic("cart",20)+" "+esc(t("sh_checkout"))+"</h2>"+cartLines()+'</div>'+
 '<div class="card"><div class="g2"><label>'+esc(t("sh_discount"))+'<input id="c_disc" inputmode="decimal" value="'+(num(CDISC.v)||"")+'" placeholder="0"></label><label>&nbsp;<select id="c_pct">'+opt("amt",p.cur==="USD"?"$":"៛",!CDISC.pct)+opt("pct","%",CDISC.pct)+'</select></label></div>'+
 '<label>'+esc(t("sh_customer"))+'<select id="c_cust">'+opt("","— "+t("sh_walkin")+" —",!CCUST)+C.map(function(x){return opt(x.id,x.name,x.id===CCUST)}).join("")+'</select></label>'+
 '<div class="seg" id="c_pay">'+[["cash","sh_cash"],["bank","sh_bank"],["other","sh_other"]].map(function(x){return'<button data-act="pay" data-v="'+x[0]+'" class="'+(CPAY===x[0]?"on":"")+'">'+esc(t(x[1]))+"</button>"}).join("")+"</div>"+
 (CPAY==="cash"?'<label>'+esc(t("sh_received"))+'<input id="c_recv" inputmode="decimal" value="'+(CRECV===""?"":CRECV)+'" placeholder="'+c.total+'"></label><div class="chips"><button data-act="recv" data-v="'+c.total+'">'+esc(t("sh_exact"))+"</button>"+quick.map(function(q){return'<button data-act="recv" data-v="'+q+'">'+fmt(q)+"</button>"}).join("")+"</div>":"")+"</div>"+
 '<div class="card"><table class="t"><tr><td>'+esc(t("sh_subtotal"))+'</td><td class="r">'+fmt(c.sub)+"</td></tr>"+(c.disc?'<tr><td>'+esc(t("sh_discount"))+'</td><td class="r">-'+fmt(c.disc)+"</td></tr>":"")+(c.tax?'<tr><td>'+esc(t("sh_tax"))+" "+p.vat+'%</td><td class="r">'+fmt(c.tax)+"</td></tr>":"")+'<tr class="tot"><td>'+esc(t("sh_total"))+'</td><td class="r" style="font-size:20px">'+fmt(c.total)+"</td></tr>"+(CPAY==="cash"&&CART.length?'<tr><td>'+esc(t("sh_change"))+'</td><td class="r '+(chg<0?"amt-neg":"amt-pos")+'">'+fmt(chg)+"</td></tr>":"")+'</table><button class="b full" style="margin-top:10px" id="c_go"'+(CART.length?"":" disabled")+">"+ic("check",18)+" "+esc(t("sh_charge"))+" "+fmt(c.total)+"</button></div>"}
function bindCart(){var d=$("c_disc");d.oninput=function(){CDISC.v=d.value;saveCart();refreshTotals()};$("c_pct").onchange=function(e){CDISC.pct=e.target.value==="pct";saveCart();render()};$("c_cust").onchange=function(e){CCUST=e.target.value;saveCart()};
 var r=$("c_recv");if(r)r.oninput=function(){CRECV=r.value;refreshTotals()};
 $("c_go").onclick=charge}
function refreshTotals(){var keep=document.activeElement&&document.activeElement.id,pos=document.activeElement&&document.activeElement.selectionStart;render();if(keep){var n=$(keep);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}}}
function nextNo(){var p=prefs();return p.prefix+("0000"+p.next).slice(-4)}
function charge(){if(!CART.length)return;var c=cartCalc(),p=prefs(),recv=CPAY==="cash"?(CRECV===""?c.total:num(CRECV)):c.total;
 if(CPAY==="cash"&&recv<c.total){toast(t("sh_short"));return}
 var id=rid(),now=Date.now(),s={no:nextNo(),at:now,date:today(),cur:p.cur,lines:CART.map(function(l){return{pid:l.pid||"",n:l.n,q:num(l.q),p:num(l.p),c:num(l.c)}}),sub:c.sub,disc:c.disc,tax:c.tax,net:c.net,total:c.total,pay:CPAY,recv:recv,change:rnd(recv-c.total),cid:CCUST,by:ME?ME.name:""};
 put("sale",id,s);savePrefs({next:p.next+1});CART=[];CDISC={v:0,pct:false};CCUST="";CPAY="cash";CRECV="";saveCart();V.page=null;render();receiptDialog(id)}

/* ---------- products ---------- */
function vItems(){var q=V.q.trim().toLowerCase(),L=list("product").filter(function(p){return(!V.cat||p.cat===V.cat)&&(!V.low||lowOf(p))&&(!q||(p.name+" "+(p.sku||"")+" "+(p.cat||"")).toLowerCase().indexOf(q)>=0)}).sort(function(a,b){return a.name.toLowerCase()<b.name.toLowerCase()?-1:1}),nl=list("product").filter(lowOf).length;
 return'<input id="q" placeholder="'+esc(t("search"))+'" value="'+esc(V.q)+'">'+catChips()+(nl?'<div class="chips"><button data-act="lowtog" class="'+(V.low?"on":"")+'">'+ic("alert",14)+" "+esc(t("sh_low_stock"))+" ("+nl+")</button></div>":"")+
 (L.length?L.map(function(p){var s=stockOf(p),low=lowOf(p);return'<button class="item" data-act="editp" data-id="'+esc(p.id)+'"><span class="th" style="background:'+PAL[Math.abs(hashS(p.cat||p.name))%PAL.length]+'22;color:'+PAL[Math.abs(hashS(p.cat||p.name))%PAL.length]+'">'+ic("box",20)+"</span><div><b>"+esc(p.name)+"</b><small>"+esc([p.cat,p.sku].filter(Boolean).join(" · "))+(p.off?" · "+esc(t("sh_hidden")):"")+'</small></div><div class="amt">'+fmt(p.price)+(p.track?'<small class="'+(s<=0?"bad":low?"warn":"")+'">'+esc(t("sh_left",{n:s}))+"</small>":"")+"</div></button>"}).join(""):'<p class="muted" style="text-align:center;padding:26px 0">'+esc(t("sh_no_products"))+"</p>")+
 '<button class="b fab" data-act="newp">'+ic("plus",18)+esc(t("sh_new_product"))+"</button>"}
function productDialog(id,sku){var p=id?DB.product[id]:{name:"",price:"",cost:"",cat:"",sku:sku||"",track:1,stock0:"",low:"",off:0},used=id&&list("sale").some(function(s){return(s.lines||[]).some(function(l){return l.pid===id})});
 dlg('<h2>'+ic("box")+" "+esc(t(id?"sh_edit_product":"sh_new_product"))+'</h2><label>'+esc(t("sh_name"))+'<input id="d_n" value="'+esc(p.name)+'" autocapitalize="words"></label><div class="g2"><label>'+esc(t("sh_price"))+'<input id="d_p" inputmode="decimal" value="'+esc(p.price)+'"></label><label>'+esc(t("sh_cost"))+'<input id="d_c" inputmode="decimal" value="'+esc(p.cost)+'"></label></div>'+
  '<div class="g2"><label>'+esc(t("sh_category"))+'<input id="d_g" list="d_gl" value="'+esc(p.cat)+'"><datalist id="d_gl">'+cats().map(function(c){return'<option value="'+esc(c)+'">'}).join("")+'</datalist></label><label>'+esc(t("sh_barcode"))+'<div class="row" style="gap:6px;flex-wrap:nowrap"><input id="d_s" value="'+esc(p.sku||"")+'" style="margin:0"><button class="b alt sm" id="d_scan" type="button">'+ic("barcode",18)+"</button></div></label></div>"+
  '<label class="chk"><input type="checkbox" id="d_t"'+(p.track?" checked":"")+"> "+esc(t("sh_track"))+'</label><div class="g2" id="d_sb"><label>'+esc(t("sh_open_stock"))+'<input id="d_o" inputmode="decimal" value="'+esc(p.stock0)+'"></label><label>'+esc(t("sh_low_at"))+'<input id="d_l" inputmode="decimal" value="'+esc(p.low)+'" placeholder="'+prefs().low+'"></label></div>'+
  '<label class="chk"><input type="checkbox" id="d_h"'+(p.off?" checked":"")+"> "+esc(t("sh_hide"))+"</label>"+(id?'<p class="muted" style="margin:4px 0">'+esc(t("sh_in_stock",{n:stockOf(Object.assign({id:id},p))}))+"</p>":"")+
  '<div class="row" style="margin-top:12px">'+(id&&!used?'<button class="b bad sm" id="d_del">'+esc(t("delete"))+"</button>":"")+(id?'<button class="b alt sm" id="d_st">'+esc(t("sh_stock_in"))+"</button>":"")+'<span class="sp"></span><button class="b alt sm" id="d_x">'+esc(t("cancel"))+'</button><button class="b sm" id="d_ok">'+esc(t("save"))+"</button></div>",function(){
  var tg=function(){$("d_sb").style.display=$("d_t").checked?"":"none"};tg();$("d_t").onchange=tg;$("d_x").onclick=closeDlg;$("d_scan").onclick=function(){scanBarcode(function(c){$("d_s").value=c})};
  if($("d_del"))$("d_del").onclick=function(){if(confirm(t("sh_del_q"))){del("product",id);closeDlg();render()}};if($("d_st"))$("d_st").onclick=function(){stockDialog(id)};
  $("d_ok").onclick=function(){var n=$("d_n").value.trim();if(!n){$("d_n").focus();return}var s=$("d_s").value.trim();if(s&&list("product").some(function(x){return x.id!==id&&x.sku===s})){toast(t("sh_dup_code"));return}
   put("product",id||rid(),{name:n,price:num($("d_p").value),cost:num($("d_c").value),cat:$("d_g").value.trim(),sku:s,track:$("d_t").checked?1:0,stock0:num($("d_o").value),low:$("d_l").value===""?"":num($("d_l").value),off:$("d_h").checked?1:0});closeDlg();render()}})}
function stockDialog(pid){var p=DB.product[pid];if(!p)return;p.id=pid;
 dlg('<h2>'+ic("arrowin")+" "+esc(t("sh_stock_in"))+" · "+esc(p.name)+'</h2><p class="muted" style="margin-top:0">'+esc(t("sh_in_stock",{n:stockOf(p)}))+'</p><label>'+esc(t("sh_qty_change"))+'<input id="k_q" inputmode="decimal" placeholder="+10 / -2"></label><label>'+esc(t("sh_note"))+'<input id="k_n"></label><div class="row" style="margin-top:12px"><span class="sp"></span><button class="b alt sm" id="k_x">'+esc(t("cancel"))+'</button><button class="b sm" id="k_ok">'+esc(t("save"))+"</button></div>",function(){
  $("k_x").onclick=closeDlg;$("k_ok").onclick=function(){var q=num($("k_q").value);if(!q){$("k_q").focus();return}put("stock",rid(),{pid:pid,q:q,date:today(),at:Date.now(),note:$("k_n").value.trim()});if(!p.track){p.track=1;put("product",pid,p)}closeDlg();toast(t("fin_saved"));render()}})}
function stockPick(){var L=list("product").sort(function(a,b){return a.name.toLowerCase()<b.name.toLowerCase()?-1:1});if(!L.length){productDialog("");return}
 dlg('<h2>'+ic("arrowin")+" "+esc(t("sh_stock_in"))+'</h2><label>'+esc(t("sh_product"))+'<select id="k_p">'+L.map(function(p){return opt(p.id,p.name)}).join("")+'</select></label><div class="row" style="margin-top:12px"><span class="sp"></span><button class="b alt sm" id="k_x">'+esc(t("cancel"))+'</button><button class="b sm" id="k_go">'+esc(t("next"))+"</button></div>",function(){$("k_x").onclick=closeDlg;$("k_go").onclick=function(){var v=$("k_p").value;stockDialog(v)}})}

/* ---------- barcode scanning (camera, scanner gun, or typing) ---------- */
function scanBarcode(cb){var stream=null,timer=0,done=false,can=!!(window.BarcodeDetector&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
 var stop=function(){done=true;clearInterval(timer);if(stream)stream.getTracks().forEach(function(x){x.stop()})};
 dlg('<h2>'+ic("barcode")+" "+esc(t("sh_scan"))+"</h2>"+(can?'<video id="sc_v" playsinline muted autoplay style="width:100%;border-radius:12px;background:#000;max-height:46vh"></video>':'<p class="muted">'+esc(t("sh_noscan"))+"</p>")+'<label>'+esc(t("sh_type_code"))+'<input id="sc_m" inputmode="text" autocomplete="off"></label><div class="row" style="margin-top:10px"><span class="sp"></span><button class="b alt sm" id="sc_x">'+esc(t("cancel"))+'</button><button class="b sm" id="sc_ok">OK</button></div>',function(){
  var finish=function(c){if(done)return;stop();closeDlg();cb(String(c).trim())};$("dlg").oncancel=stop;$("sc_x").onclick=function(){stop();closeDlg()};$("sc_ok").onclick=function(){var v=$("sc_m").value.trim();if(v)finish(v)};$("sc_m").onkeydown=function(e){if(e.key==="Enter"){var v=$("sc_m").value.trim();if(v)finish(v)}};setTimeout(function(){if($("sc_m"))$("sc_m").focus()},80);
  if(!can)return;navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(function(s){if(done){s.getTracks().forEach(function(x){x.stop()});return}stream=s;var v=$("sc_v");v.srcObject=s;var det=new BarcodeDetector();timer=setInterval(function(){if(done||!v.videoWidth)return;det.detect(v).then(function(r){if(r&&r.length)finish(r[0].rawValue)}).catch(function(){})},250)}).catch(function(){var v=$("sc_v");if(v)v.outerHTML='<p class="muted">'+esc(t("sh_noscan"))+"</p>"})})}
function scanToCart(){scanBarcode(function(c){var hit=list("product").filter(function(p){return p.sku===c&&!p.off})[0];if(hit){addToCart(hit.id);toast(hit.name)}else{toast(t("sh_code_new",{c:c}));productDialog("",c)}})}

/* ---------- sales history, receipts, reports ---------- */
function perRange(){var td=today();if(V.per==="today")return[td,td];if(V.per==="yest"){var y=addDays(td,-1);return[y,y]}if(V.per==="week")return[addDays(td,-6),td];if(V.per==="month")return monthRange(0);if(V.per==="last")return monthRange(-1);if(V.per==="year")return yearRange();return["0000-01-01","9999-12-31"]}
function perBar(){return'<div class="chips">'+[["today","p_today"],["yest","p_yest"],["week","p_week"],["month","p_month"],["last","p_last"],["year","p_year"],["all","p_all"]].map(function(x){return'<button data-act="per" data-v="'+x[0]+'" class="'+(V.per===x[0]?"on":"")+'">'+esc(t(x[1]))+"</button>"}).join("")+"</div>"}
function payName(x){return t(x==="cash"?"sh_cash":x==="bank"?"sh_bank":"sh_other")}
function saleItem(s){var n=(s.lines||[]).reduce(function(a,l){return a+num(l.q)},0);return'<button class="item" data-act="sale" data-id="'+esc(s.id)+'"><span class="th">'+ic("receipt",20)+'</span><div><b>'+esc(s.no)+(s.void?" · "+esc(t("sh_void")):"")+"</b><small>"+esc(dfmt(s.date)+" "+tfmt(s.at))+" · "+n+" "+esc(t("sh_items"))+(s.cid?" · "+esc(cname(s.cid)):"")+'</small></div><div class="amt"'+(s.void?' style="text-decoration:line-through;opacity:.6"':"")+">"+fmt(s.total)+"<small>"+esc(payName(s.pay))+"</small></div></button>"}
function vSales(){var h=seg("sales",[["list","sh_history"],["rep","sh_reports"]])+perBar(),r=perRange();
 if(V.sub.sales==="list"){var q=V.q.trim().toLowerCase(),L=list("sale").filter(function(s){return s.date>=r[0]&&s.date<=r[1]&&(!q||s.no.toLowerCase().indexOf(q)>=0)}).sort(function(a,b){return b.at-a.at}),st=saleStat(L.filter(function(s){return!s.void}));
  return h+'<input id="q" placeholder="'+esc(t("sh_receipt_no"))+'" value="'+esc(V.q)+'"><div class="kpis"><div class="kpi hl"><small>'+esc(t("sh_total"))+"</small><b>"+fmt(st.total)+'</b></div><div class="kpi"><small>'+esc(t("sh_orders"))+"</small><b>"+st.n+"</b></div></div>"+(L.length?L.map(saleItem).join(""):'<p class="muted" style="text-align:center;padding:26px 0">'+esc(t("sh_no_sales"))+"</p>")}
 return h+vReports(r)}
function vReports(r){var A=sales(r[0],r[1]),st=saleStat(A),ex=expenseSum(r[0],r[1]),byP={},byC={},byPay={},byD={},days=0,d,i;
 A.forEach(function(s){byPay[payName(s.pay)]=(byPay[payName(s.pay)]||0)+num(s.total);byD[s.date]=(byD[s.date]||0)+num(s.total);(s.lines||[]).forEach(function(l){var a=num(l.q)*num(l.p),pr=l.pid&&DB.product[l.pid],n=l.n||t("sh_noname"),c=(pr&&pr.cat)||t("sh_uncat");byP[n]=(byP[n]||0)+a;byC[c]=(byC[c]||0)+a})});
 var S=[];if(V.per==="today"||V.per==="yest"){var hr={};A.forEach(function(s){var k=new Date(s.at).getHours();hr[k]=(hr[k]||0)+num(s.total)});var hs=Object.keys(hr).map(Number),h0=Math.min(8,hs.length?Math.min.apply(null,hs):8),h1=Math.max(20,hs.length?Math.max.apply(null,hs):20);for(i=h0;i<=h1;i++)S.push({l:String(i),v:hr[i]||0})}
 else if(V.per==="year"||V.per==="all"){var mm={};A.forEach(function(s){var k=s.date.slice(0,7);mm[k]=(mm[k]||0)+num(s.total)});Object.keys(mm).sort().slice(-12).forEach(function(k){S.push({l:mShort(+k.slice(5)-1-(new Date().getMonth()))+"",v:mm[k]})})}
 else{var a0=r[0],cnt=Math.min(31,Math.round((new Date(r[1]+"T12:00:00")-new Date(a0+"T12:00:00"))/864e5)+1);for(i=0;i<cnt;i++){d=addDays(a0,i);S.push({l:cnt>10?String(+d.slice(8)):dShort(d),v:byD[d]||0})}}
 var h='<div class="tiles">'+[[t("sh_sales_t"),fmt(st.total)],[t("sh_orders"),st.n],[t("sh_avg"),fmt(st.n?st.total/st.n:0)],[t("sh_gross"),fmt(st.profit)]].map(function(x){return'<div class="tile"><small>'+esc(x[0])+"</small><b>"+x[1]+"</b></div>"}).join("")+"</div>"+
  '<div class="kpis"><div class="kpi"><small>'+esc(t("sh_expenses"))+"</small><b>"+fmt(ex)+'</b></div><div class="kpi hl"><small>'+esc(t("sh_net"))+"</small><b>"+fmt(st.profit-ex)+"</b></div></div>";
 if(!st.n)return h+'<div class="card" style="text-align:center;padding:26px"><p class="muted">'+esc(t("sh_no_sales"))+"</p></div>";
 return h+'<div class="agrid"><div class="card"><div class="band sm">'+esc(t("sh_by_time"))+"</div>"+dayBars(S)+'</div><div class="card"><div class="band sm">'+esc(t("sh_by_product"))+"</div>"+hbar(topN(byP,8))+'</div><div class="card"><div class="band sm">'+esc(t("sh_by_cat"))+"</div>"+pie(topN(byC,8))+'</div><div class="card"><div class="band sm">'+esc(t("sh_by_pay"))+"</div>"+pie(topN(byPay,4))+'</div></div><div class="row" style="margin-top:12px"><button class="b alt sm" data-act="csv">'+ic("file",16)+" CSV</button></div>"}
function csvSales(){var r=perRange(),q=function(v){return'"'+String(v==null?"":v).replace(/"/g,'""')+'"'},rows=[["Receipt","Date","Time","Item","Qty","Price","Amount","Payment","Customer","Void"]];
 list("sale").filter(function(s){return s.date>=r[0]&&s.date<=r[1]}).sort(function(a,b){return a.at-b.at}).forEach(function(s){(s.lines||[]).forEach(function(l){rows.push([s.no,s.date,tfmt(s.at),l.n,l.q,l.p,rnd(num(l.q)*num(l.p)),s.pay,cname(s.cid),s.void?"VOID":""])})});
 var blob=new Blob(["﻿"+rows.map(function(x){return x.map(q).join(",")}).join("\r\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="sales-"+today()+".csv";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
function receiptText(s){var B=biz(),L=[B.name||"Soramma Shop",s.no+" · "+dfmt(s.date)+" "+tfmt(s.at),""];(s.lines||[]).forEach(function(l){L.push(l.n+"  "+num(l.q)+" x "+fmt(l.p,s.cur)+" = "+fmt(num(l.q)*num(l.p),s.cur))});L.push("");if(s.disc)L.push(t("sh_discount")+": -"+fmt(s.disc,s.cur));if(s.tax)L.push(t("sh_tax")+": "+fmt(s.tax,s.cur));L.push(t("sh_total")+": "+fmt(s.total,s.cur));L.push(payName(s.pay));var f=prefs().footer;if(f)L.push("",f);return L.join("\n")}
function receiptHtml(s){var B=biz(),p=prefs(),w=p.paper,a4=w==="a4",css='@page{size:'+(a4?"A4":w+"mm auto")+';margin:'+(a4?"14mm":"3mm")+'}body{font-family:system-ui,"Kantumruy Pro",sans-serif;color:#000;margin:0;font-size:'+(a4?"13px":"12px")+';width:'+(a4?"auto":"100%")+'}.c{text-align:center}h1{font-size:'+(a4?"22px":"16px")+';margin:2px 0}.m{color:#444;font-size:11px}hr{border:0;border-top:1px dashed #000;margin:6px 0}table{width:100%;border-collapse:collapse}td{padding:2px 0;vertical-align:top}td.r{text-align:right;white-space:nowrap}.tot td{font-weight:700;font-size:'+(a4?"16px":"14px")+';border-top:1px solid #000;padding-top:4px}img.l{max-height:50px;max-width:140px}';
 var h='<!doctype html><meta charset="utf-8"><title>'+esc(s.no)+'</title><style>'+css+'</style><div class="c">'+(B.logo&&ME&&ME.bizLogo?'<img class="l" src="'+esc(B.logo)+'" alt="">':"")+"<h1>"+esc(B.name||"Soramma Shop")+"</h1>"+(B.info?'<div class="m">'+esc(B.info).replace(/\n/g,"<br>")+"</div>":"")+'</div><hr><div class="m">'+esc(s.no)+" · "+esc(dfmt(s.date)+" "+tfmt(s.at))+(s.by?" · "+esc(s.by):"")+(s.cid?"<br>"+esc(cname(s.cid)):"")+"</div><hr><table>";
 (s.lines||[]).forEach(function(l){h+="<tr><td colspan=2>"+esc(l.n)+"</td></tr><tr><td>&nbsp;&nbsp;"+num(l.q)+" × "+esc(fmt(l.p,s.cur))+'</td><td class="r">'+esc(fmt(num(l.q)*num(l.p),s.cur))+"</td></tr>"});
 h+="</table><hr><table>"+(s.disc||s.tax?"<tr><td>"+esc(t("sh_subtotal"))+'</td><td class="r">'+esc(fmt(s.sub,s.cur))+"</td></tr>":"")+(s.disc?"<tr><td>"+esc(t("sh_discount"))+'</td><td class="r">-'+esc(fmt(s.disc,s.cur))+"</td></tr>":"")+(s.tax?"<tr><td>"+esc(t("sh_tax"))+'</td><td class="r">'+esc(fmt(s.tax,s.cur))+"</td></tr>":"")+'<tr class="tot"><td>'+esc(t("sh_total"))+'</td><td class="r">'+esc(fmt(s.total,s.cur))+"</td></tr><tr><td>"+esc(payName(s.pay))+'</td><td class="r">'+(s.pay==="cash"?esc(fmt(s.recv,s.cur))+" / "+esc(fmt(s.change,s.cur)):"")+"</td></tr></table><hr>"+
 (p.footer?'<div class="c">'+esc(p.footer).replace(/\n/g,"<br>")+"</div>":"")+'<div class="c m" style="margin-top:6px">by Soramma Shop</div>';return h}
function printHtml(h){var fr=document.createElement("iframe");fr.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0";document.body.appendChild(fr);fr.srcdoc=h;
 fr.onload=function(){var w=fr.contentWindow,go=function(){try{w.focus();w.print()}catch(e){toast(t("net_err"))}setTimeout(function(){fr.remove()},60000)},im=w.document.images,n=im.length,d=0;if(!n)return go();Array.prototype.forEach.call(im,function(x){var f2=function(){if(++d===n)go()};x.complete?f2():(x.onload=x.onerror=f2)})}}
function receiptDialog(id,detail){var s=DB.sale[id];if(!s)return;s.id=id;
 dlg('<h2>'+ic("receipt")+" "+esc(s.no)+(s.void?' <span class="pill bad">'+esc(t("sh_void"))+"</span>":"")+'</h2><div class="rcp">'+esc(receiptText(s)).replace(/\n/g,"<br>")+'</div><div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="b" id="r_p">'+ic("print",16)+" "+esc(t("sh_print"))+'</button><button class="b alt" id="r_s">'+ic("send",16)+" "+esc(t("sh_share"))+"</button>"+(detail&&!s.void?'<button class="b bad sm" id="r_v">'+esc(t("sh_void_do"))+"</button>":"")+'<span class="sp"></span><button class="b alt" id="r_x">'+esc(t(detail?"close":"sh_new_sale"))+"</button></div>",function(){
  $("r_x").onclick=function(){closeDlg();if(!detail){V.tab="sell";render()}};$("r_p").onclick=function(){printHtml(receiptHtml(s))};
  $("r_s").onclick=function(){var tx=receiptText(s);if(navigator.share)navigator.share({title:s.no,text:tx}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(tx).then(function(){toast(t("sh_copied"))});else prompt("",tx)};
  if($("r_v"))$("r_v").onclick=function(){if(confirm(t("sh_void_q"))){s.void=1;s.voidAt=Date.now();var o=Object.assign({},s);delete o.id;put("sale",id,o);closeDlg();toast(t("sh_voided"));render()}}})}

/* ---------- customers, expenses, settings ---------- */
function customersDialog(){var L=list("customer").sort(function(a,b){return a.name<b.name?-1:1});
 dlg('<h2>'+ic("users")+" "+esc(t("sh_customers"))+'</h2><div style="max-height:46vh;overflow:auto">'+(L.length?L.map(function(c){var tot=rnd(list("sale").filter(function(s){return!s.void&&s.cid===c.id}).reduce(function(a,s){return a+num(s.total)},0));return'<button class="item" data-id="'+esc(c.id)+'"><span class="th">'+ic("user",20)+'</span><div><b>'+esc(c.name)+"</b><small>"+esc(c.phone||"")+'</small></div><div class="amt">'+fmt(tot)+"</div></button>"}).join(""):'<p class="muted">'+esc(t("sh_no_customers"))+"</p>")+'</div><div class="row" style="margin-top:10px"><span class="sp"></span><button class="b alt sm" id="u_x">'+esc(t("close"))+'</button><button class="b sm" id="u_new">'+ic("plus",16)+" "+esc(t("sh_new_customer"))+"</button></div>",function(){
  $("u_x").onclick=closeDlg;$("u_new").onclick=function(){customerDialog("")};$("dbody").onclick=function(e){var b=e.target.closest("button.item");if(b)customerDialog(b.dataset.id)}})}
function customerDialog(id){var c=id?DB.customer[id]:{name:"",phone:""};
 dlg('<h2>'+ic("user")+" "+esc(t(id?"sh_edit_customer":"sh_new_customer"))+'</h2><label>'+esc(t("c_name"))+'<input id="d_n" value="'+esc(c.name)+'" autocapitalize="words"></label><label>'+esc(t("c_phone"))+'<input id="d_p" type="tel" value="'+esc(c.phone||"")+'"></label><div class="row" style="margin-top:12px">'+(id?'<button class="b bad sm" id="d_del">'+esc(t("delete"))+"</button>":"")+'<span class="sp"></span><button class="b alt sm" id="d_x">'+esc(t("cancel"))+'</button><button class="b sm" id="d_ok">'+esc(t("save"))+"</button></div>",function(){
  $("d_x").onclick=function(){customersDialog()};if($("d_del"))$("d_del").onclick=function(){if(confirm(t("fin_del_q"))){del("customer",id);customersDialog();render()}};
  $("d_ok").onclick=function(){var n=$("d_n").value.trim();if(!n){$("d_n").focus();return}put("customer",id||rid(),{name:n,phone:$("d_p").value.trim()});customersDialog();render()}})}
function expensesDialog(){var L=list("expense").sort(function(a,b){return(b.date+b.at)<(a.date+a.at)?-1:1}).slice(0,30);
 dlg('<h2>'+ic("wallet")+" "+esc(t("sh_expenses"))+'</h2><div style="max-height:40vh;overflow:auto">'+(L.length?L.map(function(x){return'<button class="item" data-id="'+esc(x.id)+'"><span class="th">'+ic("arrowout",20)+'</span><div><b>'+esc(x.cat||t("sh_expense"))+"</b><small>"+esc(dfmt(x.date)+(x.note?" · "+x.note:""))+'</small></div><div class="amt">'+fmt(x.amt)+"</div></button>"}).join(""):'<p class="muted">'+esc(t("sh_no_expenses"))+"</p>")+'</div><div class="row" style="margin-top:10px"><span class="sp"></span><button class="b alt sm" id="e_x">'+esc(t("close"))+'</button><button class="b sm" id="e_new">'+ic("plus",16)+" "+esc(t("sh_new_expense"))+"</button></div>",function(){
  $("e_x").onclick=closeDlg;$("e_new").onclick=function(){expenseDialog("")};$("dbody").onclick=function(e){var b=e.target.closest("button.item");if(b)expenseDialog(b.dataset.id)}})}
function expenseDialog(id){var x=id?DB.expense[id]:{date:today(),amt:"",cat:"",note:""},C={};list("expense").forEach(function(e){if(e.cat)C[e.cat]=1});
 dlg('<h2>'+ic("wallet")+" "+esc(t("sh_new_expense"))+'</h2><div class="g2"><label>'+esc(t("sh_amount"))+'<input id="x_a" inputmode="decimal" value="'+esc(x.amt)+'"></label><label>'+esc(t("pay_date"))+'<input id="x_d" type="date" value="'+esc(x.date)+'"></label></div><label>'+esc(t("sh_category"))+'<input id="x_c" list="x_cl" value="'+esc(x.cat||"")+'"><datalist id="x_cl">'+Object.keys(C).map(function(c){return'<option value="'+esc(c)+'">'}).join("")+'</datalist></label><label>'+esc(t("sh_note"))+'<input id="x_n" value="'+esc(x.note||"")+'"></label><div class="row" style="margin-top:12px">'+(id?'<button class="b bad sm" id="x_del">'+esc(t("delete"))+"</button>":"")+'<span class="sp"></span><button class="b alt sm" id="x_x">'+esc(t("cancel"))+'</button><button class="b sm" id="x_ok">'+esc(t("save"))+"</button></div>",function(){
  $("x_x").onclick=function(){expensesDialog()};if($("x_del"))$("x_del").onclick=function(){if(confirm(t("fin_del_q"))){del("expense",id);expensesDialog();render()}};
  $("x_ok").onclick=function(){var a=num($("x_a").value);if(!a){$("x_a").focus();return}put("expense",id||rid(),{amt:a,date:$("x_d").value||today(),cat:$("x_c").value.trim(),note:$("x_n").value.trim(),at:Date.now()});expensesDialog();render()}})}
function prefsDialog(){var p=prefs();
 dlg('<h2>'+ic("sliders")+" "+esc(t("sh_settings"))+'</h2><div class="g2"><label>'+esc(t("pf_cur"))+'<select id="f_c">'+opt("USD","USD ($)",p.cur==="USD")+opt("KHR","KHR (៛)",p.cur==="KHR")+'</select></label><label>'+esc(t("sh_paper"))+'<select id="f_w">'+opt("80","80 mm",p.paper==="80")+opt("58","58 mm",p.paper==="58")+opt("a4","A4",p.paper==="a4")+'</select></label></div><label class="chk"><input type="checkbox" id="f_o"'+(p.vatOn?" checked":"")+"> "+esc(t("sh_tax_on"))+'</label><div class="g2"><label>'+esc(t("sh_tax"))+' %<input id="f_v" inputmode="decimal" value="'+p.vat+'"></label><label>'+esc(t("sh_low_default"))+'<input id="f_l" inputmode="decimal" value="'+p.low+'"></label></div><div class="g2"><label>'+esc(t("sh_prefix"))+'<input id="f_p" value="'+esc(p.prefix)+'"></label><label>'+esc(t("sh_next_no"))+'<input id="f_n" inputmode="numeric" value="'+p.next+'"></label></div><label>'+esc(t("sh_footer"))+'<textarea id="f_f" rows="2">'+esc(p.footer)+'</textarea></label><div class="row" style="margin-top:12px"><span class="sp"></span><button class="b alt sm" id="f_x">'+esc(t("cancel"))+'</button><button class="b sm" id="f_ok">'+esc(t("save"))+"</button></div>",function(){
  $("f_x").onclick=closeDlg;$("f_ok").onclick=function(){savePrefs({cur:$("f_c").value,paper:$("f_w").value,vatOn:$("f_o").checked?1:0,vat:Math.max(0,Math.min(100,num($("f_v").value))),low:Math.max(0,num($("f_l").value)),prefix:$("f_p").value.trim(),next:Math.max(1,Math.round(num($("f_n").value))||1),footer:$("f_f").value.trim()});closeDlg();toast(t("fin_saved"));render()}})}
function customDialog(){var p=prefs();
 dlg('<h2>'+ic("tag")+" "+esc(t("sh_custom"))+'</h2><label>'+esc(t("sh_name"))+'<input id="m_n" autocapitalize="words"></label><label>'+esc(t("sh_price"))+' ('+p.cur+')<input id="m_p" inputmode="decimal"></label><div class="row" style="margin-top:12px"><span class="sp"></span><button class="b alt sm" id="m_x">'+esc(t("cancel"))+'</button><button class="b sm" id="m_ok">'+esc(t("sh_add_cart"))+"</button></div>",function(){
  $("m_x").onclick=closeDlg;$("m_ok").onclick=function(){var pr=num($("m_p").value);if(!pr){$("m_p").focus();return}CART.push({pid:"",n:$("m_n").value.trim()||t("sh_custom"),p:pr,c:0,q:1});saveCart();closeDlg();render()}})}

/* ---------- actions ---------- */
function act(a,d){
 if(a==="seg"){V.sub[d.tab]=d.v;V.q="";render();return}
 if(a==="per"){V.per=d.v;render();return}
 if(a==="cat"){V.cat=d.v;render();return}
 if(a==="back"){V.page=null;render();return}
 if(a==="go"){V.tab=d.t;V.page=null;render();window.scrollTo(0,0);return}
 if(a==="add"){addToCart(d.id);return}
 if(a==="qp"){cartQty(+d.i,1);return}
 if(a==="qm"){cartQty(+d.i,-1);return}
 if(a==="clr"){if(confirm(t("sh_clear")+"?")){CART=[];saveCart();V.page=null;render()}return}
 if(a==="cart"){V.page="cart";render();window.scrollTo(0,0);return}
 if(a==="pay"){CPAY=d.v;render();return}
 if(a==="recv"){CRECV=d.v;render();return}
 if(a==="scan"){scanToCart();return}
 if(a==="custom"){customDialog();return}
 if(a==="newp"){productDialog("");return}
 if(a==="editp"){productDialog(d.id);return}
 if(a==="stockin"){stockPick();return}
 if(a==="newexp"){expenseDialog("");return}
 if(a==="lowlist"){V.tab="items";V.low=true;V.q="";V.cat="";render();window.scrollTo(0,0);return}
 if(a==="lowtog"){V.low=!V.low;render();return}
 if(a==="sale"){receiptDialog(d.id,true);return}
 if(a==="csv"){csvSales();return}
 if(a==="chatfull"){supportDialog();return}
}

/* ---------- sample data for demos / training (original names; every record id starts with "demo_") ---------- */
var DEMO_P=[["Iced coffee","កាហ្វេទឹកកក",2.5,0.9,"Drinks",40],["Hot coffee","កាហ្វេក្តៅ",2,0.7,"Drinks",40],["Milk tea","តែទឹកដោះគោ",2.2,0.8,"Drinks",30],["Fresh orange juice","ទឹកក្រូចស្រស់",2.8,1.1,"Drinks",25],["Bottled water","ទឹកបរិសុទ្ធ",0.5,0.2,"Drinks",60],["Butter croissant","នំក្រូស្សង់",1.8,0.8,"Food",18],["Chocolate cake slice","នំខេកសូកូឡា",3,1.3,"Food",12],["Chicken sandwich","សាំងវិចមាន់",3.5,1.6,"Food",14],["Fried rice","បាយឆា",3.2,1.4,"Food",0],["French fries","ដំឡូងបារាំងបំពង់",2,0.8,"Food",20]];
var DEMO_NAMES=[["Sokha","សុខា"],["Dara","ដារ៉ា"],["Vanna","វណ្ណា"]];
function demoCount(){return list("product").filter(function(x){return String(x.id).indexOf("demo_")===0}).length}
function demoLoad(){
 var p=prefs(),seed=7,rnd01=function(){seed=(seed*9301+49297)%233280;return seed/233280},ids=[];
 DEMO_P.forEach(function(d,i){var id="demo_p"+i;ids.push(id);put("product",id,{name:LANG==="km"?d[1]:d[0],price:d[2],cost:d[3],cat:d[4],sku:"88"+(1000+i),track:d[5]?1:0,stock0:d[5],low:d[5]?5:"",off:0})});
 DEMO_NAMES.forEach(function(n,i){put("customer","demo_c"+i,{name:LANG==="km"?n[1]:n[0],phone:""})});
 var k=0,hours=[8,9,10,11,12,13,15,16,17,18,19];
 for(var day=6;day>=0;day--){var d=new Date();d.setDate(d.getDate()-day);var n=day===0?5:9+Math.floor(rnd01()*6);
  for(var j=0;j<n;j++){var lines=[],cnt=1+Math.floor(rnd01()*3),sub=0,net=0;
   for(var q=0;q<cnt;q++){var pi=Math.floor(rnd01()*DEMO_P.length),d0=DEMO_P[pi],qty=1+Math.floor(rnd01()*2);lines.push({pid:ids[pi],n:LANG==="km"?d0[1]:d0[0],q:qty,p:d0[2],c:d0[3]});sub+=qty*d0[2]}
   sub=Math.round(sub*100)/100;var t0=new Date(d.getFullYear(),d.getMonth(),d.getDate(),hours[Math.floor(rnd01()*hours.length)],Math.floor(rnd01()*60)),pay=rnd01()<0.7?"cash":"bank";
   k++;put("sale","demo_s"+k,{no:"DEMO-"+("000"+k).slice(-3),at:t0.getTime(),date:isoDate(t0),cur:p.cur,lines:lines,sub:sub,disc:0,tax:0,net:sub,total:sub,pay:pay,recv:sub,change:0,cid:rnd01()<0.3?"demo_c"+Math.floor(rnd01()*3):"",by:ME?ME.name:""})}}
 SM=null}
function demoClear(){["product","sale","customer","stock","expense"].forEach(function(kd){Object.keys(DB[kd]).forEach(function(id){if(String(id).indexOf("demo_")===0)del(kd,id)})});SM=null}
function demoDialog(){var n=demoCount(),km=LANG==="km";
 dlg('<h2>'+ic("zap")+" "+esc(km?"ទិន្នន័យគំរូ":"Sample data")+'</h2><p class="muted">'+esc(km?"បញ្ចូលទំនិញ អតិថិជន និងការលក់ 7 ថ្ងៃ សម្រាប់បង្ហាញ ឬបង្ហាត់បុគ្គលិក។ ទិន្នន័យពិតរបស់អ្នកមិនប៉ះពាល់ទេ ហើយអាចលុបបានគ្រប់ពេល។":"Adds products, customers and 7 days of sales for demos or staff training. Your real data is not touched and you can remove it any time.")+'</p>'+(n?'<p><b>'+esc(km?"មានទិន្នន័យគំរូរួចហើយ":"Sample data is loaded")+"</b></p>":"")+
  '<div class="row" style="margin-top:12px"><button class="b alt sm" id="dm_x">'+esc(t("close"))+'</button><span class="sp"></span>'+(n?'<button class="b bad sm" id="dm_rm">'+esc(km?"លុបទិន្នន័យគំរូ":"Remove sample data")+"</button>":'<button class="b sm" id="dm_go">'+esc(km?"បញ្ចូលទិន្នន័យគំរូ":"Load sample data")+"</button>")+"</div>",function(){
  $("dm_x").onclick=closeDlg;if($("dm_go"))$("dm_go").onclick=function(){demoLoad();closeDlg();toast(km?"បានបញ្ចូលទិន្នន័យគំរូ":"Sample data loaded");render()};if($("dm_rm"))$("dm_rm").onclick=function(){if(confirm(km?"លុបទិន្នន័យគំរូទាំងអស់?":"Remove all sample data?")){demoClear();closeDlg();render()}}})}
boot();
