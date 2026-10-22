// A&J Tax API — Cloudflare Pages Function with a D1 database bound as DB.
// Accounts: one "owner" (admin of the service) and any number of self-registered users, each with a private library.
const SCHEMA=[
"CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,num INTEGER,name TEXT NOT NULL,role TEXT NOT NULL,salt TEXT,hash TEXT,active INTEGER DEFAULT 1,created INTEGER,phone TEXT,expires INTEGER,biz TEXT,biz_info TEXT,biz_logo TEXT)",
"CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,created INTEGER,ua TEXT)",
"CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT)",
"CREATE TABLE IF NOT EXISTS rec(user_id TEXT NOT NULL,id TEXT NOT NULL,kind TEXT NOT NULL,d TEXT,upd INTEGER,del INTEGER DEFAULT 0,PRIMARY KEY(user_id,id))",
"CREATE INDEX IF NOT EXISTS rec_upd ON rec(user_id,upd)",
"CREATE TABLE IF NOT EXISTS support(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT,from_owner INTEGER,auto INTEGER DEFAULT 0,text TEXT,created INTEGER,read INTEGER DEFAULT 0)",
"CREATE INDEX IF NOT EXISTS support_u ON support(user_id)",
"CREATE TABLE IF NOT EXISTS fails(name TEXT PRIMARY KEY,n INTEGER,ts INTEGER)",
];
const DAY=86400000;
const KINDS=["month","year","staff","cfg"];
const AUTO_DEFAULT="អរគុណ! យើងបានទទួលសាររបស់អ្នក ហើយនឹងឆ្លើយតបឆាប់ៗ។ / Thank you! We received your message and will reply soon.";
const RESERVED=/^\s*(admin|administrator|owner|soramma|soramma scan|soramma finance|soramma shop|a&j tax|support)\s*$/i;
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
async function publicInfo(db){return{trialDays:num(await getSetting(db,"trialDays",3)),signupOpen:!!(await getSetting(db,"signupOpen",0)),needCode:!!(await getSetting(db,"signupCode","")),contact:clip(await getSetting(db,"contact",""),300)}}

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
      const out={now:now(),user:pubUser(me),...(await publicInfo(db))};
      if(owner){out.signupCode=await getSetting(db,"signupCode","");out.maxDevices=num(await getSetting(db,"maxDevices",3));out.supportAuto=await getSetting(db,"supportAuto",AUTO_DEFAULT)}
      const un=owner?await db.prepare("SELECT COUNT(*) c FROM support WHERE from_owner=0 AND read=0").first():await db.prepare("SELECT COUNT(*) c FROM support WHERE user_id=? AND from_owner=1 AND auto=0 AND read=0").bind(me.id).first();out.sup=un.c;
      return J(out)}

    if(route==="profile"&&m==="PUT"){
      const logo=typeof body.bizLogo==="string"&&/^data:image\/(png|jpeg);base64,/.test(body.bizLogo)&&body.bizLogo.length<=90000?body.bizLogo:"";
      const nn=clip(body.name,100).trim(),np=normPhone(body.phone);
      if(np){if(np.length<8||np.length>15)return J({error:"bad_phone"},400);const dup=await db.prepare("SELECT 1 x FROM users WHERE phone=? AND id<>?").bind(np,me.id).first();if(dup)return J({error:"phone_dup"},409)}
      if(nn&&!owner&&RESERVED.test(nn))return J({error:"bad_name"},400);
      await db.prepare("UPDATE users SET biz=?,biz_info=?,biz_logo=?,name=COALESCE(NULLIF(?,''),name),phone=COALESCE(NULLIF(?,''),phone) WHERE id=?").bind(clip(body.biz,100).trim(),clip(body.bizInfo,200).trim(),logo,nn,np,me.id).run();
      return J({ok:true})}

    if(route==="settings"&&m==="PUT"){if(!owner)return J({error:"forbidden"},403);
      if(body.trialDays!=null)await setSetting(db,"trialDays",Math.max(1,Math.min(365,Math.floor(num(body.trialDays)))));
      if(body.signupOpen!=null)await setSetting(db,"signupOpen",body.signupOpen?1:0);
      if(body.signupCode!=null)await setSetting(db,"signupCode",clip(body.signupCode,40).trim());
      if(body.maxDevices!=null)await setSetting(db,"maxDevices",Math.max(0,Math.min(50,Math.floor(num(body.maxDevices)))));
      if(body.supportAuto!=null)await setSetting(db,"supportAuto",clip(body.supportAuto,300));
      if(body.contact!=null)await setSetting(db,"contact",clip(body.contact,300));
      return J({ok:true})}

    if(route==="support"){
      const SEL="SELECT id,from_owner,auto,text,created FROM support WHERE user_id=? ORDER BY id DESC LIMIT 100";
      if(m==="POST"){const text=clip(body.text,1000).trim();if(!text)return J({error:"bad_input"},400);
        const day=await db.prepare("SELECT COUNT(*) c FROM support WHERE user_id=? AND from_owner=0 AND created>?").bind(me.id,now()-DAY).first();if(day.c>=30)return J({error:"too_many"},429);
        await db.prepare("INSERT INTO support(user_id,from_owner,text,created,read) VALUES(?,0,?,?,0)").bind(me.id,text,now()).run();
        const au=await getSetting(db,"supportAuto",AUTO_DEFAULT),rec=await db.prepare("SELECT COUNT(*) c FROM support WHERE user_id=? AND from_owner=1 AND created>?").bind(me.id,now()-12*3600000).first();
        if(au&&!rec.c)await db.prepare("INSERT INTO support(user_id,from_owner,auto,text,created,read) VALUES(?,1,1,?,?,1)").bind(me.id,au,now()).run()}
      else if(m!=="GET")return J({error:"not_found"},404);
      else await db.prepare("UPDATE support SET read=1 WHERE user_id=? AND from_owner=1").bind(me.id).run();
      const r=await db.prepare(SEL).bind(me.id).all();return J({messages:(r.results||[]).reverse().map(x=>({id:x.id,mine:!x.from_owner,auto:!!x.auto,text:x.text,at:x.created}))})}

    if(route==="admin"&&parts[1]==="support"){
      if(!owner)return J({error:"forbidden"},403);
      if(!parts[2]&&m==="GET"){const r=await db.prepare("SELECT s.user_id uid,u.name,u.phone,u.biz,MAX(s.id) last,SUM(CASE WHEN s.from_owner=0 AND s.read=0 THEN 1 ELSE 0 END) unread FROM support s JOIN users u ON u.id=s.user_id GROUP BY s.user_id ORDER BY last DESC LIMIT 100").all(),rows=r.results||[],lt={};
        for(const x of rows){const l=await db.prepare("SELECT text,created,from_owner FROM support WHERE id=?").bind(x.last).first();lt[x.uid]=l}
        return J({threads:rows.map(x=>({uid:x.uid,name:x.name,phone:x.phone||"",biz:x.biz||"",unread:x.unread,text:(lt[x.uid]||{}).text||"",at:(lt[x.uid]||{}).created||0,mine:!!(lt[x.uid]||{}).from_owner}))})}
      if(parts[2]){const uid=parts[2],u=await db.prepare("SELECT id,name,phone,biz FROM users WHERE id=?").bind(uid).first();if(!u)return J({error:"not_found"},404);
        if(m==="POST"){const text=clip(body.text,1000).trim();if(!text)return J({error:"bad_input"},400);await db.prepare("INSERT INTO support(user_id,from_owner,text,created,read) VALUES(?,1,?,?,0)").bind(uid,text,now()).run()}
        else if(m==="GET")await db.prepare("UPDATE support SET read=1 WHERE user_id=? AND from_owner=0").bind(uid).run();
        const r=await db.prepare("SELECT id,from_owner,auto,text,created FROM support WHERE user_id=? ORDER BY id DESC LIMIT 100").bind(uid).all();
        return J({user:{id:u.id,name:u.name,phone:u.phone||"",biz:u.biz||""},messages:(r.results||[]).reverse().map(x=>({id:x.id,mine:!!x.from_owner,auto:!!x.auto,text:x.text,at:x.created}))})}}

    if(route==="admin"&&parts[1]==="users"){
      if(!owner)return J({error:"forbidden"},403);
      if(m==="GET"){const r=await db.prepare("SELECT u.*,(SELECT COUNT(*) FROM rec r WHERE r.user_id=u.id AND r.del=0 AND r.kind='month') n FROM users u ORDER BY u.created DESC").all();
        const sr=await db.prepare("SELECT user_id,ua,created FROM sessions ORDER BY created DESC").all(),dev={};(sr.results||[]).forEach(x=>{(dev[x.user_id]=dev[x.user_id]||[]).push({ua:x.ua||"",at:x.created})});
        return J({users:(r.results||[]).map(u=>({...pubUser(u),bizLogo:"",docs:u.n,devices:(dev[u.id]||[]).length,lastLogin:(dev[u.id]||[])[0]?dev[u.id][0].at:null,devList:(dev[u.id]||[]).slice(0,8)}))})}
      if(m==="POST"&&parts[2]){const u=await db.prepare("SELECT * FROM users WHERE id=?").bind(parts[2]).first();if(!u)return J({error:"not_found"},404);
        const a=String(body.action||"");if(u.role==="owner"&&a!=="reset")return J({error:"forbidden"},403);
        if(a==="extend"){const base=Math.max(now(),u.expires||0),days=Math.max(1,Math.min(3650,Math.floor(num(body.days))));await db.prepare("UPDATE users SET expires=?,active=1 WHERE id=?").bind(base+days*DAY,u.id).run()}
        else if(a==="signout")await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run();
        else if(a==="unlimited")await db.prepare("UPDATE users SET expires=NULL WHERE id=?").bind(u.id).run();
        else if(a==="block"){await db.prepare("UPDATE users SET active=0 WHERE id=?").bind(u.id).run();await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run()}
        else if(a==="unblock")await db.prepare("UPDATE users SET active=1 WHERE id=?").bind(u.id).run();
        else if(a==="reset"){const pass=String(body.code||"");if(pass.length<6)return J({error:"bad_input"},400);const salt=rid(12);await db.prepare("UPDATE users SET salt=?,hash=? WHERE id=?").bind(salt,await hashCode(pass,salt),u.id).run();await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run()}
        else if(a==="delete"){await db.prepare("DELETE FROM rec WHERE user_id=?").bind(u.id).run();await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run();await db.prepare("DELETE FROM users WHERE id=?").bind(u.id).run()}
        else return J({error:"bad_input"},400);
        return J({ok:true})}}

    if(route==="data"){
      if(pubUser(me).expired)return J({error:"trial_over"},402);
      if(m==="GET"){const since=num(url.searchParams.get("since")),t=now();
        const r=await db.prepare("SELECT id,kind,d,upd,del FROM rec WHERE user_id=? AND upd>? ORDER BY upd LIMIT 2000").bind(me.id,since).all(),rows=r.results||[];
        const more=rows.length>=2000;return J({now:more?rows[rows.length-1].upd:t,more,recs:rows.map(x=>x.del?{id:x.id,kind:x.kind,del:1,upd:x.upd}:{id:x.id,kind:x.kind,upd:x.upd,d:JSON.parse(x.d||"{}")})})}
      if(m==="POST"){const L=Array.isArray(body.recs)?body.recs.slice(0,200):[];if(!L.length)return J({ok:true,now:now()});
        const cnt=await db.prepare("SELECT COUNT(*) c FROM rec WHERE user_id=?").bind(me.id).first();if(cnt.c>60000)return J({error:"full"},413);
        const st=[],t=now();
        for(const x of L){const id=clip(x&&x.id,40),kind=x&&x.kind;if(!id||!KINDS.includes(kind))continue;
          if(x.del){st.push(db.prepare("INSERT INTO rec(user_id,id,kind,d,upd,del) VALUES(?,?,?,?,?,1) ON CONFLICT(user_id,id) DO UPDATE SET del=1,upd=excluded.upd,d=NULL").bind(me.id,id,kind,null,t));continue}
          const js=JSON.stringify(x.d&&typeof x.d==="object"?x.d:{});if(js.length>30000)continue;
          st.push(db.prepare("INSERT INTO rec(user_id,id,kind,d,upd,del) VALUES(?,?,?,?,?,0) ON CONFLICT(user_id,id) DO UPDATE SET d=excluded.d,kind=excluded.kind,upd=excluded.upd,del=0").bind(me.id,id,kind,js,t))}
        if(st.length)await db.batch(st);return J({ok:true,now:t,n:st.length})}}

    return J({error:"not_found"},404);
  }catch(e){return J({error:"server",detail:String(e&&e.message||e).slice(0,200)},500)}
}
