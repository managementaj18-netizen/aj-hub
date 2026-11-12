// Soramma Games — private visitor counter. Cloudflare Pages Function + D1 (binding DB, secret ADMIN_CODE).
// Tables are prefixed "gm_" so it can share a D1 database another app already uses.
// Privacy: only an anonymous random id made in the phone is stored. No name, no phone number, no IP address.
const SCHEMA=[
"CREATE TABLE IF NOT EXISTS gm_stat(day TEXT,game TEXT,ev TEXT,src TEXT,n INTEGER DEFAULT 0,PRIMARY KEY(day,game,ev,src))",
"CREATE TABLE IF NOT EXISTS gm_vis(day TEXT,vid TEXT,game TEXT,src TEXT,PRIMARY KEY(day,vid,game))",
"CREATE INDEX IF NOT EXISTS gm_vis_vid ON gm_vis(vid)",
"CREATE TABLE IF NOT EXISTS gm_rate(k TEXT PRIMARY KEY,n INTEGER,ts INTEGER)",
"CREATE TABLE IF NOT EXISTS gm_score(game TEXT,vid TEXT,period TEXT,name TEXT,score INTEGER,ts INTEGER,PRIMARY KEY(game,vid,period))",
"CREATE INDEX IF NOT EXISTS gm_score_top ON gm_score(game,period,score DESC)"
];
// Everything the owner runs, in one list. Only sent to someone who knows the owner code, so the private test addresses stay private.
const OWNER={
  games:[
    {id:"fruit",name:"Fruit Catch",e:"🧺",url:"https://play.soramma.app/",status:"live",note:"leaderboard + challenges"},
    {id:"abc",name:"English Friends",e:"🐵",url:"https://play.soramma.app/abc/",status:"live",note:"36 words, kids"},
    {id:"sort",name:"Juice Sort",e:"🧪",url:"https://play.soramma.app/try-6d7b31c6ea/sort/",status:"held",note:"ready, not announced"},
    {id:"merge",name:"Fruit Merge",e:"🍉",url:"https://play.soramma.app/try-6d7b31c6ea/merge/",status:"held",note:"merge game, ready to try"},
    {id:"kids",name:"Animal Friends",e:"🐾",url:"https://play.soramma.app/try-6d7b31c6ea/kids/",status:"held",note:"ready, not announced"}],
  apps:[
    {name:"Laundry Pro",e:"🧺",url:"https://laundrypro.soramma.app",status:"live",note:"own login, multi-shop"},
    {name:"Family location",e:"📍",url:"https://family-1zn.pages.dev",status:"live",note:"own login"},
    {name:"Shop",e:"🛍️",url:"https://soramma-shop.pages.dev",status:"live",note:"own login"},
    {name:"Soramma landing",e:"🌐",url:"https://soramma.app",status:"live",note:"contact page"},
    {name:"Translate (Khmer-English)",e:"🗣️",url:"",status:"todo",note:"built, not set up on Cloudflare yet"}]};
let ready=false;
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store","access-control-allow-origin":"*"}});
const EV=["visit","play","install","share","fb"];
const clip=(s,n)=>String(s==null?"":s).replace(/[^\w.\-]/g,"").slice(0,n);
const dayOf=t=>new Date(t).toISOString().slice(0,10);
// Cambodia time (UTC+7) decides when a "day" and a "week" (Monday start) begin
const local=t=>new Date(t+7*36e5);
const dayKey=t=>"d:"+local(t).toISOString().slice(0,10);
const weekKey=t=>{const d=local(t),m=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-((d.getUTCDay()+6)%7)));return"w:"+m.toISOString().slice(0,10)};
const periods=t=>({day:dayKey(t),week:weekKey(t),all:"all"});
const cleanName=x=>String(x==null?"":x).replace(/[^\p{L}\p{M}\p{N} ._-]/gu,"").replace(/\s+/g," ").trim().slice(0,14);
async function totalOf(db,game,period){const r=await db.prepare("SELECT COUNT(*) c FROM gm_score WHERE game=? AND period=?").bind(game,period).first();return r?r.c:0}
async function rankOf(db,game,period,score){const r=await db.prepare("SELECT COUNT(*) c FROM gm_score WHERE game=? AND period=? AND score>?").bind(game,period,score).first();return(r?r.c:0)+1}
async function init(db){if(ready)return;await db.batch(SCHEMA.map(s=>db.prepare(s)));ready=true}
function same(a,b){a=String(a);b=String(b);if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0}

export async function onRequest(ctx){
  const {request:req,env}=ctx,db=env.DB;
  const url=new URL(req.url),route=url.pathname.replace(/^\/api\/?/,"").split("/")[0]||"",m=req.method;
  // the phone app (iPhone/Android) calls this service from its own files, so browsers ask first (preflight). Only the plain headers are allowed: the owner code header is never allowed from other sites.
  if(m==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type","access-control-max-age":"86400"}});
  if(!db)return J({error:"no_db"},503);
  try{
    await init(db);
    if(route==="ping")return J({ok:true});

    // ---- count one event (called by the games) ----
    if(route==="hit"&&m==="POST"){
      let b={};try{b=JSON.parse((await req.text()).slice(0,2000))}catch(e){return J({error:"bad"},400)}
      const ev=String(b.ev||""),game=clip(b.game||"fruit",24),src=clip(b.src||"direct",24).toLowerCase(),vid=clip(b.vid,40);
      if(EV.indexOf(ev)<0||vid.length<8)return J({error:"bad"},400);
      const t=Date.now(),day=dayOf(t);
      // keep one phone from flooding the numbers: at most 300 events per phone per day
      const rk=vid+":"+day,rr=await db.prepare("SELECT n FROM gm_rate WHERE k=?").bind(rk).first();
      if(rr&&rr.n>=300)return J({ok:true,skipped:true});
      await db.prepare("INSERT INTO gm_rate(k,n,ts) VALUES(?,1,?) ON CONFLICT(k) DO UPDATE SET n=n+1,ts=?").bind(rk,t,t).run();
      if(ev==="visit")await db.prepare("INSERT OR IGNORE INTO gm_vis(day,vid,game,src) VALUES(?,?,?,?)").bind(day,vid,game,src).run();
      await db.prepare("INSERT INTO gm_stat(day,game,ev,src,n) VALUES(?,?,?,?,1) ON CONFLICT(day,game,ev,src) DO UPDATE SET n=n+1").bind(day,game,ev,src).run();
      return J({ok:true})}

    // ---- a player finishes a game: keep their best (today / this week / all time) ----
    if(route==="score"&&m==="POST"){
      let b={};try{b=JSON.parse((await req.text()).slice(0,2000))}catch(e){return J({error:"bad"},400)}
      const game=clip(b.game||"fruit",24),vid=clip(b.vid,40),name=cleanName(b.name),score=Math.floor(+b.score),secs=+b.t;
      if(vid.length<8||!(score>=1&&score<=99999)||!(secs>=0))return J({error:"bad"},400);
      // a score has to be possible for the time played (about 15 points per second at most)
      if(score>15*secs+10)return J({error:"implausible"},422);
      const t=Date.now(),rk=vid+":s:"+dayKey(t),rr=await db.prepare("SELECT n FROM gm_rate WHERE k=?").bind(rk).first();
      if(rr&&rr.n>=60)return J({error:"slow_down"},429);
      await db.prepare("INSERT INTO gm_rate(k,n,ts) VALUES(?,1,?) ON CONFLICT(k) DO UPDATE SET n=n+1,ts=?").bind(rk,t,t).run();
      const P=periods(t),ranks={};
      for(const k of Object.keys(P)){
        await db.prepare("INSERT INTO gm_score(game,vid,period,name,score,ts) VALUES(?,?,?,?,?,?) ON CONFLICT(game,vid,period) DO UPDATE SET name=CASE WHEN excluded.name<>'' THEN excluded.name ELSE name END,ts=CASE WHEN excluded.score>score THEN excluded.ts ELSE ts END,score=MAX(score,excluded.score)").bind(game,vid,P[k],name,score,t).run();
        const mine=await db.prepare("SELECT score FROM gm_score WHERE game=? AND vid=? AND period=?").bind(game,vid,P[k]).first();
        ranks[k]={rank:await rankOf(db,game,P[k],mine.score),best:mine.score,total:await totalOf(db,game,P[k])}}
      return J({ok:true,ranks})}

    // ---- the leaderboard (top 10 and, if asked, your own place) ----
    if(route==="top"&&m==="GET"){
      // public board shows names only for the top 5 (if the player typed one); everyone else is anonymous. The owner (secret code) also sees the names.
      const isAdmin=!!env.ADMIN_CODE&&same(req.headers.get("x-admin-code")||"",env.ADMIN_CODE);
      const game=clip(url.searchParams.get("game")||"fruit",24),per=url.searchParams.get("period")||"all",vid=clip(url.searchParams.get("vid"),40);
      const P=periods(Date.now());if(!P[per])return J({error:"bad"},400);
      const rows=(await db.prepare("SELECT vid,name,score FROM gm_score WHERE game=? AND period=? ORDER BY score DESC,ts ASC LIMIT 10").bind(game,P[per]).all()).results||[];
      let me=null;if(vid.length>=8){const mine=await db.prepare("SELECT score FROM gm_score WHERE game=? AND vid=? AND period=?").bind(game,vid,P[per]).first();if(mine)me={score:mine.score,rank:await rankOf(db,game,P[per],mine.score)}}
      const allSc=(await db.prepare("SELECT score FROM gm_score WHERE game=? AND period=? LIMIT 5000").bind(game,P[per]).all()).results||[],dist={};
      for(const x of allSc){let n=1;while(n<14&&5*(n+1)*n<=x.score)n++;dist[n]=(dist[n]||0)+1}
      return J({period:per,total:await totalOf(db,game,P[per]),dist,top:rows.map((x,i)=>isAdmin||(i<5&&x.name)?{name:x.name,score:x.score,me:!!vid&&x.vid===vid}:{score:x.score,me:!!vid&&x.vid===vid}),me})}

    // ---- the owner removes a player from the boards (needs the secret code) ----
    if(route==="score-delete"&&m==="POST"){
      const code=env.ADMIN_CODE;if(!code)return J({error:"no_admin_code"},503);
      if(!same(req.headers.get("x-admin-code")||"",code)){await new Promise(r=>setTimeout(r,400));return J({error:"denied"},401)}
      let b={};try{b=JSON.parse((await req.text()).slice(0,500))}catch(e){return J({error:"bad"},400)}
      const name=cleanName(b.name);if(!name)return J({error:"bad"},400);
      await db.prepare("DELETE FROM gm_score WHERE name=?").bind(name).run();return J({ok:true})}

    // ---- the owner page: every app and game in one list (needs the secret code) ----
    if(route==="owner"&&m==="GET"){
      const code=env.ADMIN_CODE;if(!code)return J({error:"no_admin_code"},503);
      if(!same(req.headers.get("x-admin-code")||"",code)){await new Promise(r=>setTimeout(r,400));return J({error:"denied"},401)}
      return J(OWNER)}

    // ---- every player who typed a name (owner only): search, pages, newest/best first ----
    if(route==="players"&&m==="GET"){
      const code=env.ADMIN_CODE;if(!code)return J({error:"no_admin_code"},503);
      if(!same(req.headers.get("x-admin-code")||"",code)){await new Promise(r=>setTimeout(r,400));return J({error:"denied"},401)}
      const game=clip(url.searchParams.get("game")||"fruit",24),size=Math.max(1,Math.min(500,parseInt(url.searchParams.get("size"))||50)),page=Math.max(0,parseInt(url.searchParams.get("page"))||0);
      const q=cleanName(url.searchParams.get("q")||"").replace(/[%_]/g,""),sort=url.searchParams.get("sort")==="score"?"s.score DESC":"s.ts DESC";
      const like="%"+q+"%";
      const tot=(await db.prepare("SELECT COUNT(*) c FROM gm_score WHERE game=? AND period='all'").bind(game).first())||{c:0};
      const named=(await db.prepare("SELECT COUNT(*) c FROM gm_score WHERE game=? AND period='all' AND name<>''").bind(game).first())||{c:0};
      const match=(await db.prepare("SELECT COUNT(*) c FROM gm_score WHERE game=? AND period='all' AND name<>'' AND name LIKE ?").bind(game,like).first())||{c:0};
      const rows=(await db.prepare("SELECT s.name,s.score,s.ts,v.first,v.last,v.days,v.src FROM gm_score s LEFT JOIN (SELECT vid,MIN(day) first,MAX(day) last,COUNT(DISTINCT day) days,MAX(src) src FROM gm_vis GROUP BY vid) v ON v.vid=s.vid WHERE s.game=? AND s.period='all' AND s.name<>'' AND s.name LIKE ? ORDER BY "+sort+" LIMIT ? OFFSET ?").bind(game,like,size,page*size).all()).results||[];
      return J({total:tot.c,named:named.c,match:match.c,page,size,rows})}

    // ---- numbers for the owner (needs the secret code) ----
    if(route==="stats"&&m==="GET"){
      const code=env.ADMIN_CODE;
      if(!code)return J({error:"no_admin_code"},503);
      if(!same(req.headers.get("x-admin-code")||"",code)){await new Promise(r=>setTimeout(r,400));return J({error:"denied"},401)}
      const days=Math.max(1,Math.min(90,parseInt(url.searchParams.get("days"))||14));
      const from=dayOf(Date.now()-(days-1)*864e5);
      const stat=(await db.prepare("SELECT day,game,ev,src,n FROM gm_stat WHERE day>=?").bind(from).all()).results||[];
      const vis=(await db.prepare("SELECT day,game,COUNT(*) c FROM gm_vis WHERE day>=? GROUP BY day,game").bind(from).all()).results||[];
      const uniq=(await db.prepare("SELECT COUNT(DISTINCT vid) c FROM gm_vis WHERE day>=?").bind(from).first())||{c:0};
      const uall=(await db.prepare("SELECT COUNT(DISTINCT vid) c FROM gm_vis").first())||{c:0};
      const back=(await db.prepare("SELECT COUNT(*) c FROM (SELECT vid FROM gm_vis WHERE day>=? GROUP BY vid HAVING COUNT(DISTINCT day)>1)").bind(from).first())||{c:0};
      const bySrc=(await db.prepare("SELECT src,COUNT(DISTINCT vid) c FROM gm_vis WHERE day>=? GROUP BY src ORDER BY c DESC").bind(from).all()).results||[];
      const sum=ev=>stat.filter(s=>s.ev===ev).reduce((a,s)=>a+s.n,0);
      const perDay={};for(let i=days-1;i>=0;i--)perDay[dayOf(Date.now()-i*864e5)]={visitors:0,plays:0};
      vis.forEach(v=>{if(perDay[v.day])perDay[v.day].visitors+=v.c});
      stat.filter(s=>s.ev==="play").forEach(s=>{if(perDay[s.day])perDay[s.day].plays+=s.n});
      const games={};stat.forEach(s=>{const g=games[s.game]||(games[s.game]={plays:0,installs:0,shares:0,fb:0});if(s.ev==="play")g.plays+=s.n;if(s.ev==="install")g.installs+=s.n;if(s.ev==="share")g.shares+=s.n;if(s.ev==="fb")g.fb+=s.n});
      vis.forEach(v=>{const g=games[v.game]||(games[v.game]={plays:0,installs:0,shares:0,fb:0});g.visitors=(g.visitors||0)+v.c});
      return J({days,visitors:uniq.c,visitorsAllTime:uall.c,returning:back.c,plays:sum("play"),installs:sum("install"),shares:sum("share"),fbClicks:sum("fb"),perDay,games,sources:bySrc})}
    return J({error:"not_found"},404);
  }catch(e){return J({error:"server",detail:String(e&&e.message||e).slice(0,120)},500)}
}
