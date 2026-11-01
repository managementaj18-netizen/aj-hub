// Soramma Games — private visitor counter. Cloudflare Pages Function + D1 (binding DB, secret ADMIN_CODE).
// Tables are prefixed "gm_" so it can share a D1 database another app already uses.
// Privacy: only an anonymous random id made in the phone is stored. No name, no phone number, no IP address.
const SCHEMA=[
"CREATE TABLE IF NOT EXISTS gm_stat(day TEXT,game TEXT,ev TEXT,src TEXT,n INTEGER DEFAULT 0,PRIMARY KEY(day,game,ev,src))",
"CREATE TABLE IF NOT EXISTS gm_vis(day TEXT,vid TEXT,game TEXT,src TEXT,PRIMARY KEY(day,vid,game))",
"CREATE INDEX IF NOT EXISTS gm_vis_vid ON gm_vis(vid)",
"CREATE TABLE IF NOT EXISTS gm_rate(k TEXT PRIMARY KEY,n INTEGER,ts INTEGER)"
];
let ready=false;
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const EV=["visit","play","install","share","fb"];
const clip=(s,n)=>String(s==null?"":s).replace(/[^\w.\-]/g,"").slice(0,n);
const dayOf=t=>new Date(t).toISOString().slice(0,10);
async function init(db){if(ready)return;await db.batch(SCHEMA.map(s=>db.prepare(s)));ready=true}
function same(a,b){a=String(a);b=String(b);if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0}

export async function onRequest(ctx){
  const {request:req,env}=ctx,db=env.DB;
  const url=new URL(req.url),route=url.pathname.replace(/^\/api\/?/,"").split("/")[0]||"",m=req.method;
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
