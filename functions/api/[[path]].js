// Soramma Laundry API — Cloudflare Pages Function with a D1 database bound as DB.
const SCHEMA=[
"CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,num INTEGER,name TEXT NOT NULL,role TEXT NOT NULL,salt TEXT,hash TEXT,active INTEGER DEFAULT 1,duty INTEGER DEFAULT 0,lat REAL,lng REAL,acc REAL,loc_at INTEGER,created INTEGER)",
"CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,created INTEGER)",
"CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT)",
"CREATE TABLE IF NOT EXISTS customers(id TEXT PRIMARY KEY,upd INTEGER,del INTEGER DEFAULT 0,data TEXT)",
"CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,at TEXT,staff_id TEXT,upd INTEGER,del INTEGER DEFAULT 0,data TEXT)",
"CREATE TABLE IF NOT EXISTS fails(name TEXT PRIMARY KEY,n INTEGER,ts INTEGER)",
"CREATE INDEX IF NOT EXISTS orders_upd ON orders(upd)"
];
let ready=false;
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const hex=b=>Array.from(new Uint8Array(b)).map(x=>("0"+x.toString(16)).slice(-2)).join("");
const rid=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return hex(a)};
async function hashCode(code,salt){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(code),"PBKDF2",false,["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:100000,hash:"SHA-256"},k,256))}
const now=()=>Date.now();
const clip=(s,n)=>String(s==null?"":s).slice(0,n);
const num=v=>isFinite(+v)?+v:0;

async function init(db){if(ready)return;await db.batch(SCHEMA.map(s=>db.prepare(s)));ready=true}
async function getSetting(db,k,d){const r=await db.prepare("SELECT v FROM settings WHERE k=?").bind(k).first();if(!r)return d;try{return JSON.parse(r.v)}catch(e){return d}}
async function setSetting(db,k,v){await db.prepare("INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(k,JSON.stringify(v)).run()}
const pubUser=u=>({id:u.id,num:u.num,name:u.name,role:u.role,active:!!u.active,duty:!!u.duty,lat:u.lat,lng:u.lng,acc:u.acc,locAt:u.loc_at})

async function newSession(db,uid){const t=rid(32);await db.prepare("INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)").bind(t,uid,now()).run();return t}
async function authUser(db,req){const h=req.headers.get("authorization")||"";const t=h.startsWith("Bearer ")?h.slice(7):"";if(!t)return null;
  const r=await db.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND u.active=1").bind(t).first();return r||null}

function cleanOrder(o,me,existing){
  const lines=(Array.isArray(o.lines)?o.lines:[]).slice(0,200).map(l=>({n:clip(l.n,120),q:num(l.q),p:num(l.p)}));
  const out={id:clip(o.id,40),no:clip(o.no,40),at:clip(o.at,40)||new Date().toISOString(),status:["received","washing","ready","delivered"].includes(o.status)?o.status:"received",
    name:clip(o.name,200),phone:clip(o.phone,50),room:clip(o.room,300),idno:clip(o.idno,100),note:clip(o.note,2000),due:clip(o.due,40),
    paid:!!o.paid,acct:!!o.acct,custId:clip(o.custId,40),staff:clip(o.staff,100),staffId:clip(o.staffId,40),deliveredBy:clip(o.deliveredBy,100),recvName:clip(o.recvName,200),
    loc:o.loc&&isFinite(+o.loc.lat)&&isFinite(+o.loc.lng)?{lat:+o.loc.lat,lng:+o.loc.lng}:null,lines};
  if(me.role!=="owner"){out.staffId=me.id;out.staff=me.name}
  else if(!out.staffId&&existing)out.staffId=existing.staffId||"";
  return out}

export async function onRequest(ctx){
  const {request:req,env}=ctx,db=env.DB;
  if(!db)return J({error:"no_db"},503);
  const url=new URL(req.url),parts=url.pathname.replace(/^\/api\/?/,"").split("/").filter(Boolean),m=req.method;
  try{
    await init(db);
    const route=parts[0]||"";
    if(route==="ping"&&m==="GET"){const c=await db.prepare("SELECT COUNT(*) c FROM users").first();return J({ok:true,setup:!c.c})}
    let body={};if(m==="POST"||m==="PUT"){try{body=await req.json()}catch(e){body={}}}

    if(route==="setup"&&m==="POST"){
      const c=await db.prepare("SELECT COUNT(*) c FROM users").first();if(c.c)return J({error:"already_setup"},403);
      const name=clip(body.name,100).trim(),code=String(body.code||"");if(!name||code.length<6)return J({error:"bad_input"},400);
      const id=rid(8),salt=rid(12);await db.prepare("INSERT INTO users(id,num,name,role,salt,hash,created) VALUES(?,?,?,?,?,?,?)").bind(id,1,name,"owner",salt,await hashCode(code,salt),now()).run();
      if(body.biz)await setSetting(db,"name",clip(body.biz,100));
      return J({token:await newSession(db,id)})}

    if(route==="login"&&m==="POST"){
      const name=clip(body.name,100).trim(),code=String(body.code||""),key=name.toLowerCase();
      const f=await db.prepare("SELECT * FROM fails WHERE name=?").bind(key).first();
      if(f&&f.n>=8&&now()-f.ts<600000)return J({error:"too_many"},429);
      const u=await db.prepare("SELECT * FROM users WHERE lower(name)=? AND active=1").bind(key).first();
      const ok=u&&u.hash===await hashCode(code,u.salt);
      if(!ok){const n=f&&now()-f.ts<600000?f.n+1:1;await db.prepare("INSERT INTO fails(name,n,ts) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET n=excluded.n,ts=excluded.ts").bind(key,n,now()).run();return J({error:"bad_login"},401)}
      await db.prepare("DELETE FROM fails WHERE name=?").bind(key).run();
      return J({token:await newSession(db,u.id),user:pubUser(u)})}

    const me=await authUser(db,req);if(!me)return J({error:"auth"},401);
    const owner=me.role==="owner";

    if(route==="logout"&&m==="POST"){const t=(req.headers.get("authorization")||"").slice(7);await db.prepare("DELETE FROM sessions WHERE token=?").bind(t).run();return J({ok:true})}

    if(route==="sync"&&m==="GET"){
      const since=num(url.searchParams.get("since")),t=now();
      const settings={name:await getSetting(db,"name",""),items:await getSetting(db,"items",null),contact:await getSetting(db,"contact",null)};
      const cr=await db.prepare("SELECT id,del,data FROM customers WHERE upd>?").bind(since).all();
      const or=owner?await db.prepare("SELECT id,del,data FROM orders WHERE upd>?").bind(since).all():await db.prepare("SELECT id,del,data FROM orders WHERE upd>? AND staff_id=?").bind(since,me.id).all();
      const ur=await db.prepare("SELECT * FROM users ORDER BY num").all();
      const users=(ur.results||[]).filter(u=>owner||u.id===me.id).map(pubUser);
      return J({now:t,user:pubUser(me),settings,users,
        customers:(cr.results||[]).map(r=>r.del?{id:r.id,del:1}:JSON.parse(r.data)),
        orders:(or.results||[]).map(r=>r.del?{id:r.id,del:1}:JSON.parse(r.data))})}

    if(route==="settings"&&m==="PUT"){if(!owner)return J({error:"forbidden"},403);
      if(body.name!=null)await setSetting(db,"name",clip(body.name,100));
      if(Array.isArray(body.items))await setSetting(db,"items",body.items.slice(0,300).map(i=>({id:clip(i.id,40),n:clip(i.n,120),cat:clip(i.cat,20),p:num(i.p),u:clip(i.u,10)})));
      if(body.contact)await setSetting(db,"contact",{tg:clip(body.contact.tg,80),wa:clip(body.contact.wa,30),phone:clip(body.contact.phone,30),addr:clip(body.contact.addr,300),tax:clip(body.contact.tax,60)});
      return J({ok:true})}

    if(route==="customers"){
      if(m==="GET")return J({error:"use_sync"},400);
      if(!owner)return J({error:"forbidden"},403);
      if(m==="POST"){const c=body,id=clip(c.id,40)||rid(8);const prices={};if(c.prices&&typeof c.prices==="object")Object.keys(c.prices).slice(0,300).forEach(k=>{if(c.prices[k]!==""&&c.prices[k]!=null&&isFinite(+c.prices[k]))prices[clip(k,40)]=+c.prices[k]});
        const d={id,name:clip(c.name,200),address:clip(c.address,300),phone:clip(c.phone,50),tax:clip(c.tax,60),notes:clip(c.notes,1000),acct:c.acct!==false,prices};
        if(!d.name)return J({error:"bad_input"},400);
        await db.prepare("INSERT INTO customers(id,upd,del,data) VALUES(?,?,0,?) ON CONFLICT(id) DO UPDATE SET upd=excluded.upd,del=0,data=excluded.data").bind(id,now(),JSON.stringify(d)).run();return J({ok:true,customer:d})}
      if(m==="DELETE"&&parts[1]){await db.prepare("UPDATE customers SET del=1,upd=? WHERE id=?").bind(now(),parts[1]).run();return J({ok:true})}}

    if(route==="users"){
      if(!owner)return J({error:"forbidden"},403);
      if(m==="POST"){const name=clip(body.name,100).trim(),code=body.code?String(body.code):"";
        if(!name)return J({error:"bad_input"},400);
        if(body.id){const u=await db.prepare("SELECT * FROM users WHERE id=?").bind(body.id).first();if(!u)return J({error:"not_found"},404);
          if(code){if(code.length<4)return J({error:"bad_input"},400);const salt=rid(12);await db.prepare("UPDATE users SET salt=?,hash=? WHERE id=?").bind(salt,await hashCode(code,salt),u.id).run()}
          await db.prepare("UPDATE users SET name=?,active=? WHERE id=?").bind(name,body.active===false&&u.role!=="owner"?0:1,u.id).run();
          if(body.active===false&&u.role!=="owner")await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run();
          return J({ok:true})}
        if(code.length<4)return J({error:"bad_input"},400);
        const dup=await db.prepare("SELECT 1 x FROM users WHERE lower(name)=?").bind(name.toLowerCase()).first();if(dup)return J({error:"duplicate"},409);
        const mx=await db.prepare("SELECT COALESCE(MAX(num),0) n FROM users").first(),id=rid(8),salt=rid(12);
        await db.prepare("INSERT INTO users(id,num,name,role,salt,hash,created) VALUES(?,?,?,?,?,?,?)").bind(id,mx.n+1,name,"staff",salt,await hashCode(code,salt),now()).run();return J({ok:true,id})}}

    if(route==="orders"){
      if(m==="POST"){const list=Array.isArray(body.orders)?body.orders:[body],bulk=Array.isArray(body.orders);if(bulk&&!owner)return J({error:"forbidden"},403);
        let n=0;
        for(const raw of list.slice(0,2000)){const id=clip(raw.id,40);if(!id)continue;
          const ex=await db.prepare("SELECT staff_id,data FROM orders WHERE id=?").bind(id).first();
          if(ex&&!owner&&ex.staff_id!==me.id)continue;
          const o=cleanOrder(raw,me,ex?JSON.parse(ex.data):null);
          await db.prepare("INSERT INTO orders(id,at,staff_id,upd,del,data) VALUES(?,?,?,?,0,?) ON CONFLICT(id) DO UPDATE SET at=excluded.at,staff_id=excluded.staff_id,upd=excluded.upd,del=0,data=excluded.data").bind(id,o.at,o.staffId||null,now()+n,JSON.stringify(o)).run();n++}
        return J({ok:true,n})}
      if(m==="DELETE"&&parts[1]){if(!owner)return J({error:"forbidden"},403);await db.prepare("UPDATE orders SET del=1,upd=? WHERE id=?").bind(now(),parts[1]).run();return J({ok:true})}}

    if(route==="loc"&&m==="POST"){
      const duty=body.duty?1:0;
      if(isFinite(+body.lat)&&isFinite(+body.lng)&&Math.abs(+body.lat)<=90&&Math.abs(+body.lng)<=180)
        await db.prepare("UPDATE users SET duty=?,lat=?,lng=?,acc=?,loc_at=? WHERE id=?").bind(duty,+body.lat,+body.lng,num(body.acc),now(),me.id).run();
      else await db.prepare("UPDATE users SET duty=? WHERE id=?").bind(duty,me.id).run();
      return J({ok:true})}

    return J({error:"not_found"},404);
  }catch(e){return J({error:"server",detail:String(e&&e.message||e).slice(0,200)},500)}
}
