// Soramma Family — share location inside a family. Cloudflare Pages Function + D1 (binding DB).
// All tables are prefixed "fam_" so this app can live in a D1 database that another app already uses (no extra database needed).
// Members share only after they agree, can pause at any time, and nobody sees a paused member's position.
const SCHEMA=[
"CREATE TABLE IF NOT EXISTS fam_family(gid TEXT PRIMARY KEY,name TEXT,code TEXT UNIQUE,created INTEGER)",
"CREATE TABLE IF NOT EXISTS fam_users(id TEXT PRIMARY KEY,gid TEXT,name TEXT NOT NULL,role TEXT NOT NULL,login TEXT UNIQUE,salt TEXT,hash TEXT,created INTEGER,sharing INTEGER DEFAULT 0,lat REAL,lng REAL,acc REAL,ts INTEGER)",
"CREATE INDEX IF NOT EXISTS fam_users_gid ON fam_users(gid)",
"CREATE TABLE IF NOT EXISTS fam_sessions(token TEXT PRIMARY KEY,user_id TEXT,created INTEGER)",
"CREATE TABLE IF NOT EXISTS fam_fails(name TEXT PRIMARY KEY,n INTEGER,ts INTEGER)"
];
let ready=false;
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const hex=b=>Array.from(new Uint8Array(b)).map(x=>("0"+x.toString(16)).slice(-2)).join("");
const rid=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return hex(a)};
async function hashCode(code,salt){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(code),"PBKDF2",false,["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:100000,hash:"SHA-256"},k,256))}
const now=()=>Date.now();
const clip=(s,n)=>String(s==null?"":s).slice(0,n);
const digits=s=>String(s||"").replace(/\D/g,"");
async function init(db){if(ready)return;await db.batch(SCHEMA.map(s=>db.prepare(s)));ready=true}
async function newSession(db,uid){const t=rid(32);await db.prepare("INSERT INTO fam_sessions(token,user_id,created) VALUES(?,?,?)").bind(t,uid,now()).run();return t}
async function authUser(db,req){const h=req.headers.get("authorization")||"";const t=h.startsWith("Bearer ")?h.slice(7):"";if(!t)return null;
  return await db.prepare("SELECT u.* FROM fam_sessions s JOIN fam_users u ON u.id=s.user_id WHERE s.token=?").bind(t).first()}
async function addUser(db,{gid,name,phone,code,role}){
  const ph=digits(phone);if(!name||String(code||"").length<6)return{err:["bad_input",400]};
  if(ph.length<8||ph.length>15)return{err:["bad_phone",400]};
  if(await db.prepare("SELECT 1 x FROM fam_users WHERE login=?").bind(ph).first())return{err:["phone_dup",409]};
  const id=rid(8),salt=rid(12);
  await db.prepare("INSERT INTO fam_users(id,gid,name,role,login,salt,hash,created) VALUES(?,?,?,?,?,?,?,?)").bind(id,gid,name,role,ph,salt,await hashCode(String(code),salt),now()).run();
  return{id}}
const members=async(db,me)=>{const r=await db.prepare("SELECT * FROM fam_users WHERE gid=? ORDER BY created").bind(me.gid).all();
  return(r.results||[]).map(u=>({id:u.id,name:u.name,role:u.role,me:u.id===me.id,sharing:!!u.sharing,ts:u.ts||null,...(u.sharing&&u.lat!=null?{lat:u.lat,lng:u.lng,acc:u.acc}:{})}))};

export async function onRequest(ctx){
  const {request:req,env}=ctx,db=env.DB;
  if(!db)return J({error:"no_db"},503);
  const url=new URL(req.url),parts=url.pathname.replace(/^\/api\/?/,"").split("/").filter(Boolean),m=req.method,route=parts[0]||"";
  try{
    await init(db);
    if(route==="ping"&&m==="GET")return J({ok:true});
    let body={};if(m==="POST"||m==="PUT"){try{body=await req.json()}catch(e){body={}}}

    if(route==="signup"&&m==="POST"){
      const gid=rid(6),fname=clip(body.family,80).trim()||"Family";
      let code="";for(let i=0;i<20;i++){const c=String(100000+Math.floor(Math.random()*900000));if(!await db.prepare("SELECT 1 x FROM fam_family WHERE code=?").bind(c).first()){code=c;break}}
      if(!code)return J({error:"server"},500);
      const r=await addUser(db,{gid,name:clip(body.name,60).trim(),phone:body.phone,code:body.code,role:"owner"});if(r.err)return J({error:r.err[0]},r.err[1]);
      await db.prepare("INSERT INTO fam_family(gid,name,code,created) VALUES(?,?,?,?)").bind(gid,fname,code,now()).run();
      return J({token:await newSession(db,r.id)})}

    if(route==="join"&&m==="POST"){
      const f=await db.prepare("SELECT * FROM fam_family WHERE code=?").bind(digits(body.invite)).first();if(!f)return J({error:"bad_invite"},404);
      const n=await db.prepare("SELECT COUNT(*) c FROM fam_users WHERE gid=?").bind(f.gid).first();if(n.c>=20)return J({error:"family_full"},403);
      const r=await addUser(db,{gid:f.gid,name:clip(body.name,60).trim(),phone:body.phone,code:body.code,role:"member"});if(r.err)return J({error:r.err[0]},r.err[1]);
      return J({token:await newSession(db,r.id)})}

    if(route==="login"&&m==="POST"){
      const ph=digits(body.phone),code=String(body.code||"");
      const f=await db.prepare("SELECT * FROM fam_fails WHERE name=?").bind(ph).first();
      if(f&&f.n>=8&&now()-f.ts<600000)return J({error:"too_many"},429);
      const u=ph?await db.prepare("SELECT * FROM fam_users WHERE login=?").bind(ph).first():null;
      if(!u||u.hash!==await hashCode(code,u.salt)){const n=f&&now()-f.ts<600000?f.n+1:1;await db.prepare("INSERT INTO fam_fails(name,n,ts) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET n=excluded.n,ts=excluded.ts").bind(ph,n,now()).run();return J({error:"bad_login"},401)}
      await db.prepare("DELETE FROM fam_fails WHERE name=?").bind(ph).run();
      return J({token:await newSession(db,u.id)})}

    const me=await authUser(db,req);if(!me)return J({error:"auth"},401);

    if(route==="logout"&&m==="POST"){await db.prepare("DELETE FROM fam_sessions WHERE token=?").bind((req.headers.get("authorization")||"").slice(7)).run();return J({ok:true})}

    if(route==="sync"&&m==="GET"){
      const f=await db.prepare("SELECT * FROM fam_family WHERE gid=?").bind(me.gid).first();
      return J({now:now(),me:{id:me.id,name:me.name,role:me.role,sharing:!!me.sharing},family:{name:f.name,code:f.code},members:await members(db,me)})}

    // position update (only stored while the member has sharing on)
    if(route==="loc"&&m==="POST"){
      const lat=+body.lat,lng=+body.lng;if(!isFinite(lat)||!isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return J({error:"bad_input"},400);
      if(!me.sharing)return J({ok:true,ignored:true});
      await db.prepare("UPDATE fam_users SET lat=?,lng=?,acc=?,ts=? WHERE id=?").bind(lat,lng,isFinite(+body.acc)?+body.acc:0,now(),me.id).run();return J({ok:true})}

    // turn sharing on/off; turning off wipes the stored position
    if(route==="sharing"&&m==="POST"){
      if(body.on)await db.prepare("UPDATE fam_users SET sharing=1 WHERE id=?").bind(me.id).run();
      else await db.prepare("UPDATE fam_users SET sharing=0,lat=NULL,lng=NULL,acc=NULL WHERE id=?").bind(me.id).run();
      return J({ok:true})}

    // leave the family (members) or remove a member (owner); leaving deletes the account and its position
    if(route==="members"&&m==="DELETE"){
      const id=parts[1]||me.id,u=id===me.id?me:await db.prepare("SELECT * FROM fam_users WHERE id=? AND gid=?").bind(id,me.gid).first();
      if(!u)return J({error:"not_found"},404);
      if(u.id!==me.id&&me.role!=="owner")return J({error:"forbidden"},403);
      if(u.role==="owner"){const o=await db.prepare("SELECT COUNT(*) c FROM fam_users WHERE gid=? AND id<>?").bind(me.gid,u.id).first();
        if(o.c){const nx=await db.prepare("SELECT id FROM fam_users WHERE gid=? AND id<>? ORDER BY created LIMIT 1").bind(me.gid,u.id).first();await db.prepare("UPDATE fam_users SET role='owner' WHERE id=?").bind(nx.id).run()}}
      await db.batch([db.prepare("DELETE FROM fam_sessions WHERE user_id=?").bind(u.id),db.prepare("DELETE FROM fam_users WHERE id=?").bind(u.id)]);
      const left=await db.prepare("SELECT COUNT(*) c FROM fam_users WHERE gid=?").bind(me.gid).first();if(!left.c)await db.prepare("DELETE FROM fam_family WHERE gid=?").bind(me.gid).run();
      return J({ok:true})}

    return J({error:"not_found"},404);
  }catch(e){return J({error:"server",detail:String(e&&e.message||e).slice(0,200)},500)}
}
