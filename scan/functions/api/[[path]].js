// Soramma Scan API — Cloudflare Pages Function with a D1 database bound as DB.
// Accounts: one "owner" (admin of the service) and any number of self-registered users, each with a private library.
const SCHEMA=[
"CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,num INTEGER,name TEXT NOT NULL,role TEXT NOT NULL,salt TEXT,hash TEXT,active INTEGER DEFAULT 1,created INTEGER,phone TEXT,expires INTEGER,biz TEXT,biz_info TEXT,biz_logo TEXT)",
"CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,created INTEGER,ua TEXT)",
"CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT)",
"CREATE TABLE IF NOT EXISTS scans(id TEXT PRIMARY KEY,user_id TEXT,uname TEXT,created INTEGER,upd INTEGER,del INTEGER DEFAULT 0,type TEXT,fields TEXT,text TEXT,npages INTEGER DEFAULT 0,thumb TEXT)",
"CREATE TABLE IF NOT EXISTS scan_pages(scan_id TEXT,idx INTEGER,data TEXT,PRIMARY KEY(scan_id,idx))",
"CREATE INDEX IF NOT EXISTS scans_upd ON scans(upd)",
"CREATE TABLE IF NOT EXISTS fails(name TEXT PRIMARY KEY,n INTEGER,ts INTEGER)",
];
const DAY=86400000;
const RESERVED=/^\s*(admin|administrator|owner|soramma|soramma scan|support)\s*$/i;
let ready=false;
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const hex=b=>Array.from(new Uint8Array(b)).map(x=>("0"+x.toString(16)).slice(-2)).join("");
const rid=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return hex(a)};
async function hashCode(code,salt){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(code),"PBKDF2",false,["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:100000,hash:"SHA-256"},k,256))}
const now=()=>Date.now();
const clip=(s,n)=>String(s==null?"":s).slice(0,n);
const num=v=>isFinite(+v)?+v:0;
function normPhone(s){let d=String(s||"").replace(/[^\d]/g,"");if(d.startsWith("00855"))d=d.slice(5);else if(d.startsWith("855"))d=d.slice(3);if(d&&d[0]!=="0")d="0"+d;return d}

async function init(db){if(ready)return;await db.batch(SCHEMA.map(s=>db.prepare(s)));
  const r=await db.prepare("PRAGMA table_info(users)").all(),cols=(r.results||[]).map(c=>c.name);
  if(!cols.includes("phone"))await db.prepare("ALTER TABLE users ADD COLUMN phone TEXT").run();
  if(!cols.includes("expires"))await db.prepare("ALTER TABLE users ADD COLUMN expires INTEGER").run();
  const sr=await db.prepare("PRAGMA table_info(sessions)").all();if(!(sr.results||[]).some(c=>c.name==="ua"))await db.prepare("ALTER TABLE sessions ADD COLUMN ua TEXT").run();
  for(const c of["biz","biz_info","biz_logo"])if(!cols.includes(c))await db.prepare("ALTER TABLE users ADD COLUMN "+c+" TEXT").run();
  ready=true}
async function getSetting(db,k,d){const r=await db.prepare("SELECT v FROM settings WHERE k=?").bind(k).first();if(!r)return d;try{return JSON.parse(r.v)}catch(e){return d}}
async function setSetting(db,k,v){await db.prepare("INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(k,JSON.stringify(v)).run()}
const pubUser=u=>({id:u.id,name:u.name,phone:u.phone||"",biz:u.biz||"",bizInfo:u.biz_info||"",bizLogo:u.biz_logo||"",role:u.role,active:!!u.active,expires:u.expires==null?null:u.expires,expired:u.role!=="owner"&&u.expires!=null&&now()>u.expires,created:u.created})
async function publicInfo(db){return{trialDays:num(await getSetting(db,"trialDays",3)),signupOpen:!!(await getSetting(db,"signupOpen",1)),needCode:!!(await getSetting(db,"signupCode","")),contact:clip(await getSetting(db,"contact",""),300)}}

function devLabel(req){const u=req.headers.get("user-agent")||"",c=req.headers.get("cf-ipcountry")||"";
  const os=/iPhone|iPad/.test(u)?"iPhone/iPad":/Android/.test(u)?(((u.match(/Android[^;)]*;\s*([^;)]+)/)||[])[1]||"Android").replace(/\s*Build.*/,"").trim()):/Windows/.test(u)?"Windows":/Mac OS/.test(u)?"Mac":/Linux/.test(u)?"Linux":"?";
  const br=/Edg\//.test(u)?"Edge":/OPR\//.test(u)?"Opera":/Chrome\//.test(u)?"Chrome":/Safari\//.test(u)?"Safari":/Firefox\//.test(u)?"Firefox":"";
  return clip(os+(br?" · "+br:"")+(c&&c!=="XX"?" · "+c:""),80)}
async function newSession(db,uid,req){const t=rid(32);await db.prepare("INSERT INTO sessions(token,user_id,created,ua) VALUES(?,?,?,?)").bind(t,uid,now(),req?devLabel(req):"").run();
  const ur=await db.prepare("SELECT role FROM users WHERE id=?").bind(uid).first();
  if(ur&&ur.role!=="owner"){const mx=num(await getSetting(db,"maxDevices",3));if(mx>0)await db.prepare("DELETE FROM sessions WHERE user_id=? AND token NOT IN (SELECT token FROM sessions WHERE user_id=? ORDER BY created DESC LIMIT ?)").bind(uid,uid,mx).run()}
  return t}
async function authUser(db,req){const h=req.headers.get("authorization")||"";const t=h.startsWith("Bearer ")?h.slice(7):"";if(!t)return null;
  const r=await db.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND u.active=1").bind(t).first();return r||null}

export async function onRequest(ctx){
  const {request:req,env}=ctx,db=env.DB;
  if(!db)return J({error:"no_db"},503);
  const url=new URL(req.url),parts=url.pathname.replace(/^\/api\/?/,"").split("/").filter(Boolean),m=req.method;
  try{
    await init(db);
    const route=parts[0]||"";
    if(route==="ping"&&m==="GET"){const c=await db.prepare("SELECT COUNT(*) c FROM users").first();return J({ok:true,setup:!c.c,...(await publicInfo(db))})}
    let body={};if(m==="POST"||m==="PUT"){try{body=await req.json()}catch(e){body={}}}

    if(route==="setup"&&m==="POST"){
      const c=await db.prepare("SELECT COUNT(*) c FROM users").first();if(c.c)return J({error:"already_setup"},403);
      const name=clip(body.name,100).trim(),code=String(body.code||""),phone=normPhone(body.phone);if(!name||code.length<6||phone.length<8)return J({error:"bad_input"},400);
      const id=rid(8),salt=rid(12);await db.prepare("INSERT INTO users(id,num,name,role,salt,hash,created,phone,expires) VALUES(?,?,?,?,?,?,?,?,NULL)").bind(id,1,name,"owner",salt,await hashCode(code,salt),now(),phone).run();
      return J({token:await newSession(db,id,req)})}

    if(route==="signup"&&m==="POST"){
      const c=await db.prepare("SELECT COUNT(*) c FROM users").first();if(!c.c)return J({error:"not_setup"},403);
      const info=await publicInfo(db);if(!info.signupOpen)return J({error:"signup_closed"},403);
      const code=await getSetting(db,"signupCode","");if(code&&String(body.invite||"").trim()!==code)return J({error:"bad_invite"},403);
      const name=clip(body.name,100).trim(),pass=String(body.code||""),phone=normPhone(body.phone);
      if(!name||pass.length<6)return J({error:"bad_input"},400);if(RESERVED.test(name))return J({error:"bad_name"},400);if(phone.length<8||phone.length>15)return J({error:"bad_phone"},400);
      const recent=await db.prepare("SELECT COUNT(*) c FROM users WHERE created>?").bind(now()-3600000).first();if(recent.c>=30)return J({error:"too_many"},429);
      const dup=await db.prepare("SELECT 1 x FROM users WHERE phone=?").bind(phone).first();if(dup)return J({error:"phone_dup"},409);
      const mx=await db.prepare("SELECT COALESCE(MAX(num),0) n FROM users").first(),id=rid(8),salt=rid(12);
      await db.prepare("INSERT INTO users(id,num,name,role,salt,hash,created,phone,expires) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,mx.n+1,name,"user",salt,await hashCode(pass,salt),now(),phone,now()+info.trialDays*DAY).run();
      return J({token:await newSession(db,id,req)})}

    if(route==="login"&&m==="POST"){
      const ident=clip(body.phone||body.name,100).trim(),np=normPhone(ident),key=(np||ident.toLowerCase()),code=String(body.code||"");
      const f=await db.prepare("SELECT * FROM fails WHERE name=?").bind(key).first();
      if(f&&f.n>=8&&now()-f.ts<600000)return J({error:"too_many"},429);
      const u=await db.prepare("SELECT * FROM users WHERE (phone=? AND ?<>'') OR lower(name)=?").bind(np,np,ident.toLowerCase()).first();
      const ok=u&&u.hash===await hashCode(code,u.salt);
      if(!ok){const n=f&&now()-f.ts<600000?f.n+1:1;await db.prepare("INSERT INTO fails(name,n,ts) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET n=excluded.n,ts=excluded.ts").bind(key,n,now()).run();return J({error:"bad_login"},401)}
      await db.prepare("DELETE FROM fails WHERE name=?").bind(key).run();
      if(!u.active)return J({error:"blocked"},403);
      return J({token:await newSession(db,u.id,req),user:pubUser(u)})}

    const me=await authUser(db,req);if(!me)return J({error:"auth"},401);
    const owner=me.role==="owner";

    if(route==="logout"&&m==="POST"){const t=(req.headers.get("authorization")||"").slice(7);await db.prepare("DELETE FROM sessions WHERE token=?").bind(t).run();return J({ok:true})}

    if(route==="sync"&&m==="GET"){
      const out={now:now(),user:pubUser(me),retention:num(await getSetting(db,"scanRetention",0)),...(await publicInfo(db))};
      if(owner){out.signupCode=await getSetting(db,"signupCode","");out.maxDevices=num(await getSetting(db,"maxDevices",3))}
      return J(out)}

    if(route==="profile"&&m==="PUT"){
      const logo=typeof body.bizLogo==="string"&&/^data:image\/(png|jpeg);base64,/.test(body.bizLogo)&&body.bizLogo.length<=90000?body.bizLogo:"";
      const nn=clip(body.name,100).trim(),np=normPhone(body.phone);
      if(np){if(np.length<8||np.length>15)return J({error:"bad_phone"},400);const dup=await db.prepare("SELECT 1 x FROM users WHERE phone=? AND id<>?").bind(np,me.id).first();if(dup)return J({error:"phone_dup"},409)}
      if(nn&&!owner&&RESERVED.test(nn))return J({error:"bad_name"},400);
      await db.prepare("UPDATE users SET biz=?,biz_info=?,biz_logo=?,name=COALESCE(NULLIF(?,''),name),phone=COALESCE(NULLIF(?,''),phone) WHERE id=?").bind(clip(body.biz,100).trim(),clip(body.bizInfo,200).trim(),logo,nn,np,me.id).run();
      return J({ok:true})}

    if(route==="settings"&&m==="PUT"){if(!owner)return J({error:"forbidden"},403);
      if(body.scanRetention!=null)await setSetting(db,"scanRetention",Math.max(0,Math.min(3650,Math.floor(num(body.scanRetention)))));
      if(body.trialDays!=null)await setSetting(db,"trialDays",Math.max(1,Math.min(365,Math.floor(num(body.trialDays)))));
      if(body.signupOpen!=null)await setSetting(db,"signupOpen",body.signupOpen?1:0);
      if(body.signupCode!=null)await setSetting(db,"signupCode",clip(body.signupCode,40).trim());
      if(body.maxDevices!=null)await setSetting(db,"maxDevices",Math.max(0,Math.min(50,Math.floor(num(body.maxDevices)))));
      if(body.contact!=null)await setSetting(db,"contact",clip(body.contact,300));
      return J({ok:true})}

    if(route==="admin"&&parts[1]==="users"){
      if(!owner)return J({error:"forbidden"},403);
      if(m==="GET"){const r=await db.prepare("SELECT u.*,(SELECT COUNT(*) FROM scans s WHERE s.user_id=u.id AND s.del=0) n FROM users u ORDER BY u.created DESC").all();
        const sr=await db.prepare("SELECT user_id,ua,created FROM sessions ORDER BY created DESC").all(),dev={};(sr.results||[]).forEach(x=>{(dev[x.user_id]=dev[x.user_id]||[]).push({ua:x.ua||"",at:x.created})});
        return J({users:(r.results||[]).map(u=>({...pubUser(u),bizLogo:"",scans:u.n,devices:(dev[u.id]||[]).length,lastLogin:(dev[u.id]||[])[0]?dev[u.id][0].at:null,devList:(dev[u.id]||[]).slice(0,8)}))})}
      if(m==="POST"&&parts[2]){const u=await db.prepare("SELECT * FROM users WHERE id=?").bind(parts[2]).first();if(!u)return J({error:"not_found"},404);
        const a=String(body.action||"");if(u.role==="owner"&&a!=="reset")return J({error:"forbidden"},403);
        if(a==="extend"){const base=Math.max(now(),u.expires||0),days=Math.max(1,Math.min(3650,Math.floor(num(body.days))));await db.prepare("UPDATE users SET expires=?,active=1 WHERE id=?").bind(base+days*DAY,u.id).run()}
        else if(a==="signout")await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run();
        else if(a==="unlimited")await db.prepare("UPDATE users SET expires=NULL WHERE id=?").bind(u.id).run();
        else if(a==="block"){await db.prepare("UPDATE users SET active=0 WHERE id=?").bind(u.id).run();await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run()}
        else if(a==="unblock")await db.prepare("UPDATE users SET active=1 WHERE id=?").bind(u.id).run();
        else if(a==="reset"){const pass=String(body.code||"");if(pass.length<6)return J({error:"bad_input"},400);const salt=rid(12);await db.prepare("UPDATE users SET salt=?,hash=? WHERE id=?").bind(salt,await hashCode(pass,salt),u.id).run();await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run()}
        else if(a==="delete"){await db.prepare("DELETE FROM scan_pages WHERE scan_id IN (SELECT id FROM scans WHERE user_id=?)").bind(u.id).run();await db.prepare("DELETE FROM scans WHERE user_id=?").bind(u.id).run();await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run();await db.prepare("DELETE FROM users WHERE id=?").bind(u.id).run()}
        else return J({error:"bad_input"},400);
        return J({ok:true})}}

    if(route==="scans"){
      if(pubUser(me).expired)return J({error:"trial_over"},402);
      const ret=num(await getSetting(db,"scanRetention",0));
      if(m==="GET"&&!parts[1]){
        if(ret>0){const cut=now()-ret*DAY;await db.prepare("UPDATE scans SET del=1,upd=? WHERE del=0 AND created<?").bind(now(),cut).run();await db.prepare("DELETE FROM scan_pages WHERE scan_id IN (SELECT id FROM scans WHERE del=1)").run()}
        const since=num(url.searchParams.get("since")),t=now();
        const r=await db.prepare("SELECT id,user_id,uname,created,upd,del,type,fields,text,npages,thumb FROM scans WHERE upd>? AND user_id=?").bind(since,me.id).all();
        return J({now:t,retention:ret,scans:(r.results||[]).map(x=>x.del?{id:x.id,del:1}:{id:x.id,by:x.uname,uid:x.user_id,created:x.created,type:x.type,fields:JSON.parse(x.fields||"{}"),text:x.text||"",npages:x.npages,thumb:x.thumb||""})})}
      if(parts[1]){
        const sc=await db.prepare("SELECT * FROM scans WHERE id=? AND del=0 AND user_id=?").bind(parts[1],me.id).first();
        if(m==="GET"&&parts[2]==="pages"){if(!sc)return J({error:"not_found"},404);
          const r=await db.prepare("SELECT idx,data FROM scan_pages WHERE scan_id=? ORDER BY idx").bind(sc.id).all();return J({pages:(r.results||[]).map(x=>x.data)})}
        if(m==="DELETE"){if(!sc)return J({ok:true});
          await db.prepare("UPDATE scans SET del=1,upd=? WHERE id=?").bind(now(),sc.id).run();await db.prepare("DELETE FROM scan_pages WHERE scan_id=?").bind(sc.id).run();return J({ok:true})}}
      if(m==="POST"){
        const id=clip(body.id,40);if(!id)return J({error:"bad_input"},400);
        const ex=await db.prepare("SELECT * FROM scans WHERE id=?").bind(id).first();
        if(ex&&ex.user_id!==me.id)return J({error:"forbidden"},403);
        const f={};if(body.fields&&typeof body.fields==="object")Object.keys(body.fields).slice(0,40).forEach(k=>{f[clip(k,30)]=clip(body.fields[k],200)});
        const type=["passport","idcard","document"].includes(body.type)?body.type:"document";
        let pages=null;
        if(Array.isArray(body.pages)){pages=body.pages.slice(0,20);
          for(const d of pages)if(typeof d!=="string"||!d.startsWith("data:image/jpeg;base64,")||d.length>2500000)return J({error:"bad_page"},400)}
        const np=pages?pages.length:(ex?ex.npages:0);
        await db.prepare("INSERT INTO scans(id,user_id,uname,created,upd,del,type,fields,text,npages,thumb) VALUES(?,?,?,?,?,0,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET upd=excluded.upd,del=0,type=excluded.type,fields=excluded.fields,text=excluded.text,npages=excluded.npages,thumb=COALESCE(excluded.thumb,scans.thumb)")
          .bind(id,me.id,me.name,ex?ex.created:(num(body.created)||now()),now(),type,JSON.stringify(f),clip(body.text,20000),np,typeof body.thumb==="string"&&body.thumb.startsWith("data:image/jpeg;base64,")&&body.thumb.length<30000?body.thumb:null).run();
        if(pages){await db.prepare("DELETE FROM scan_pages WHERE scan_id=?").bind(id).run();let i=0;for(const d of pages){await db.prepare("INSERT INTO scan_pages(scan_id,idx,data) VALUES(?,?,?)").bind(id,i++,d).run()}}
        return J({ok:true,n:np})}}

    return J({error:"not_found"},404);
  }catch(e){return J({error:"server",detail:String(e&&e.message||e).slice(0,200)},500)}
}
