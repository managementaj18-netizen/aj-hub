// Soramma Laundry (multi-shop) API — Cloudflare Pages Function with a D1 database bound as DB.
// Every shop owner is a separate account (tenant) with its own staff, customers, orders and a trial that locks after N days.
const SCHEMA=[
"CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,num INTEGER,name TEXT NOT NULL,role TEXT NOT NULL,salt TEXT,hash TEXT,active INTEGER DEFAULT 1,duty INTEGER DEFAULT 0,lat REAL,lng REAL,acc REAL,loc_at INTEGER,created INTEGER,tid TEXT,login TEXT,phone TEXT,shop TEXT,expires INTEGER,admin INTEGER DEFAULT 0)",
"CREATE UNIQUE INDEX IF NOT EXISTS users_login ON users(login)",
"CREATE INDEX IF NOT EXISTS users_tid ON users(tid)",
"CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,created INTEGER)",
"CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT)",
"CREATE TABLE IF NOT EXISTS customers(tid TEXT,id TEXT,upd INTEGER,del INTEGER DEFAULT 0,data TEXT,PRIMARY KEY(tid,id))",
"CREATE TABLE IF NOT EXISTS orders(tid TEXT,id TEXT,at TEXT,staff_id TEXT,upd INTEGER,del INTEGER DEFAULT 0,data TEXT,PRIMARY KEY(tid,id))",
"CREATE TABLE IF NOT EXISTS fails(name TEXT PRIMARY KEY,n INTEGER,ts INTEGER)",
"CREATE INDEX IF NOT EXISTS orders_upd ON orders(tid,upd)"
];
let ready=false;
const DAY=86400000;
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const hex=b=>Array.from(new Uint8Array(b)).map(x=>("0"+x.toString(16)).slice(-2)).join("");
const rid=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return hex(a)};
async function hashCode(code,salt){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(code),"PBKDF2",false,["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:100000,hash:"SHA-256"},k,256))}
const now=()=>Date.now();
const clip=(s,n)=>String(s==null?"":s).slice(0,n);
const num=v=>isFinite(+v)?+v:0;
const digits=s=>String(s||"").replace(/\D/g,"");

async function init(db){if(ready)return;await db.batch(SCHEMA.map(s=>db.prepare(s)));ready=true}
const G="_";
async function getSetting(db,tid,k,d){const r=await db.prepare("SELECT v FROM settings WHERE k=?").bind(tid+"|"+k).first();if(!r)return d;try{return JSON.parse(r.v)}catch(e){return d}}
async function setSetting(db,tid,k,v){await db.prepare("INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(tid+"|"+k,JSON.stringify(v)).run()}
async function platform(db){return{trialDays:num(await getSetting(db,G,"trialDays",3))||3,signupOpen:(await getSetting(db,G,"signupOpen",1))?1:0,support:await getSetting(db,G,"support","")}}
const pubUser=(u,x)=>({id:u.id,num:u.num,name:u.name,role:u.role,active:!!u.active,duty:!!u.duty,lat:u.lat,lng:u.lng,acc:u.acc,locAt:u.loc_at,login:u.login||"",phone:u.phone||"",shop:u.shop||"",admin:!!u.admin,expires:x&&x.expires!=null?x.expires:(u.expires==null?null:u.expires),expired:!!(x&&x.expired)})

async function newSession(db,uid){const t=rid(32);await db.prepare("INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)").bind(t,uid,now()).run();return t}
// resolves the signed-in user plus the trial state of the shop they belong to
async function authUser(db,req){const h=req.headers.get("authorization")||"";const t=h.startsWith("Bearer ")?h.slice(7):"";if(!t)return null;
  const u=await db.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND u.active=1").bind(t).first();if(!u)return null;
  const ow=u.role==="staff"?await db.prepare("SELECT * FROM users WHERE id=?").bind(u.tid).first():u;
  if(!ow||!ow.active)return null;
  u.expires=ow.expires;u.expired=!u.admin&&!ow.admin&&ow.expires!=null&&ow.expires<now();u.shop=ow.shop;return u}

function cleanOrder(o,me,existing){
  const lines=(Array.isArray(o.lines)?o.lines:[]).slice(0,200).map(l=>({n:clip(l.n,120),q:num(l.q),p:num(l.p)}));
  const out={id:clip(o.id,40),no:clip(o.no,40),at:clip(o.at,40)||new Date().toISOString(),status:["received","washing","ready","delivered"].includes(o.status)?o.status:"received",
    name:clip(o.name,200),phone:clip(o.phone,50),room:clip(o.room,300),idno:clip(o.idno,100),note:clip(o.note,2000),due:clip(o.due,40),
    paid:!!o.paid,acct:!!o.acct,custId:clip(o.custId,40),staff:clip(o.staff,100),staffId:clip(o.staffId,40),deliveredBy:clip(o.deliveredBy,100),recvName:clip(o.recvName,200),
    loc:o.loc&&isFinite(+o.loc.lat)&&isFinite(+o.loc.lng)?{lat:+o.loc.lat,lng:+o.loc.lng}:null,lines};
  if(me.role!=="owner"){out.staffId=me.id;out.staff=me.name}
  else if(!out.staffId&&existing)out.staffId=existing.staffId||"";
  return out}

async function newOwner(db,body,{admin,days}){
  const biz=clip(body.biz,100).trim(),name=clip(body.name,100).trim(),code=String(body.code||""),ph=digits(body.phone);
  if(!name||code.length<6)return{err:["bad_input",400]};
  if(ph.length<8||ph.length>15)return{err:["bad_phone",400]};
  if(await db.prepare("SELECT 1 x FROM users WHERE login=?").bind(ph).first())return{err:["phone_dup",409]};
  let shop="";for(let i=0;i<20;i++){const s=String(1000+Math.floor(Math.random()*9000));if(!await db.prepare("SELECT 1 x FROM users WHERE shop=?").bind(s).first()){shop=s;break}}
  if(!shop)return{err:["server",500]};
  const id=rid(8),salt=rid(12);
  await db.prepare("INSERT INTO users(id,num,name,role,salt,hash,created,tid,login,phone,shop,expires,admin) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,1,name,"owner",salt,await hashCode(code,salt),now(),id,ph,ph,shop,admin?null:now()+days*DAY,admin?1:0).run();
  await setSetting(db,id,"name",biz||"Soramma Laundry");
  return{id}}

export async function onRequest(ctx){
  const {request:req,env}=ctx,db=env.DB;
  if(!db)return J({error:"no_db"},503);
  const url=new URL(req.url),parts=url.pathname.replace(/^\/api\/?/,"").split("/").filter(Boolean),m=req.method;
  try{
    await init(db);
    const route=parts[0]||"";
    if(route==="ping"&&m==="GET"){const c=await db.prepare("SELECT COUNT(*) c FROM users").first();const p=await platform(db);return J({ok:true,setup:!c.c,signupOpen:p.signupOpen,trialDays:p.trialDays,support:p.support})}
    let body={};if(m==="POST"||m==="PUT"){try{body=await req.json()}catch(e){body={}}}

    if(route==="setup"&&m==="POST"){
      const c=await db.prepare("SELECT COUNT(*) c FROM users").first();if(c.c)return J({error:"already_setup"},403);
      const r=await newOwner(db,body,{admin:true});if(r.err)return J({error:r.err[0]},r.err[1]);
      return J({token:await newSession(db,r.id)})}

    if(route==="signup"&&m==="POST"){
      const c=await db.prepare("SELECT COUNT(*) c FROM users").first();if(!c.c)return J({error:"need_setup"},403);
      const p=await platform(db);if(!p.signupOpen)return J({error:"signup_closed"},403);
      const r=await newOwner(db,body,{admin:false,days:p.trialDays});if(r.err)return J({error:r.err[0]},r.err[1]);
      return J({token:await newSession(db,r.id)})}

    if(route==="login"&&m==="POST"){
      const raw=clip(body.name,100).trim().toLowerCase(),code=String(body.code||""),ph=digits(raw),key=raw.replace(/\s*@\s*/,"@");
      const f=await db.prepare("SELECT * FROM fails WHERE name=?").bind(key).first();
      if(f&&f.n>=8&&now()-f.ts<600000)return J({error:"too_many"},429);
      const u=await db.prepare("SELECT * FROM users WHERE (login=? OR login=?) AND active=1").bind(key,ph&&ph===raw.replace(/[\s\-+]/g,"")?ph:"\u0000").first();
      const ok=u&&u.hash===await hashCode(code,u.salt);
      if(!ok){const n=f&&now()-f.ts<600000?f.n+1:1;await db.prepare("INSERT INTO fails(name,n,ts) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET n=excluded.n,ts=excluded.ts").bind(key,n,now()).run();return J({error:"bad_login"},401)}
      await db.prepare("DELETE FROM fails WHERE name=?").bind(key).run();
      return J({token:await newSession(db,u.id)})}

    const me=await authUser(db,req);if(!me)return J({error:"auth"},401);
    const owner=me.role==="owner",tid=me.tid||me.id;

    if(route==="logout"&&m==="POST"){const t=(req.headers.get("authorization")||"").slice(7);await db.prepare("DELETE FROM sessions WHERE token=?").bind(t).run();return J({ok:true})}

    // ---- platform admin ----
    if(route==="admin"){
      if(!me.admin)return J({error:"forbidden"},403);
      if(parts[1]==="settings"){
        if(m==="PUT"){if(body.trialDays!=null)await setSetting(db,G,"trialDays",Math.max(1,Math.min(365,Math.round(num(body.trialDays))||3)));
          if(body.signupOpen!=null)await setSetting(db,G,"signupOpen",body.signupOpen?1:0);
          if(body.support!=null)await setSetting(db,G,"support",clip(body.support,300))}
        return J(await platform(db))}
      if(parts[1]==="users"&&m==="GET"){
        const r=await db.prepare("SELECT u.id,u.name,u.phone,u.shop,u.active,u.created,u.expires,u.admin,(SELECT COUNT(*) FROM orders o WHERE o.tid=u.id AND o.del=0) orders,(SELECT COUNT(*) FROM users s WHERE s.tid=u.id AND s.role='staff') staff,(SELECT v FROM settings WHERE k=u.id||'|name') biz FROM users u WHERE u.role='owner' ORDER BY u.created DESC").all();
        return J({users:(r.results||[]).map(x=>{let b="";try{b=JSON.parse(x.biz)}catch(e){}return{id:x.id,name:x.name,phone:x.phone,shop:x.shop,active:!!x.active,created:x.created,expires:x.expires,admin:!!x.admin,orders:x.orders,staff:x.staff,biz:b}})})}
      if(parts[1]==="users"&&parts[2]&&m==="POST"){
        const t=await db.prepare("SELECT * FROM users WHERE id=? AND role='owner'").bind(parts[2]).first();if(!t)return J({error:"not_found"},404);
        const a=body.action;
        if(a==="extend"){const d=Math.max(1,Math.min(3650,Math.round(num(body.days))||30));const base=Math.max(now(),t.expires||0);await db.prepare("UPDATE users SET expires=? WHERE id=?").bind(base+d*DAY,t.id).run();return J({ok:true})}
        if(a==="unlimited"){await db.prepare("UPDATE users SET expires=NULL WHERE id=?").bind(t.id).run();return J({ok:true})}
        if(t.admin)return J({error:"forbidden"},403);
        if(a==="disable"||a==="enable"){await db.prepare("UPDATE users SET active=? WHERE id=?").bind(a==="enable"?1:0,t.id).run();if(a==="disable")await db.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE tid=?)").bind(t.id).run();return J({ok:true})}
        if(a==="delete"){await db.batch([db.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE tid=?)").bind(t.id),db.prepare("DELETE FROM orders WHERE tid=?").bind(t.id),db.prepare("DELETE FROM customers WHERE tid=?").bind(t.id),db.prepare("DELETE FROM settings WHERE k LIKE ?").bind(t.id+"|%"),db.prepare("DELETE FROM users WHERE tid=?").bind(t.id)]);return J({ok:true})}
        return J({error:"bad_input"},400)}
      return J({error:"not_found"},404)}

    // the trial of this shop is over: only the lock screen can still read /sync
    if(me.expired){
      if(route==="sync"&&m==="GET"){const p=await platform(db);return J({now:now(),user:pubUser(me,{expires:me.expires,expired:true}),settings:{},users:[],customers:[],orders:[],expired:true,support:p.support})}
      return J({error:"trial_over"},402)}

    if(route==="sync"&&m==="GET"){
      const since=num(url.searchParams.get("since")),t=now();
      const settings={name:await getSetting(db,tid,"name",""),items:await getSetting(db,tid,"items",null),contact:await getSetting(db,tid,"contact",null)};
      const cr=await db.prepare("SELECT id,del,data FROM customers WHERE tid=? AND upd>?").bind(tid,since).all();
      const or=owner?await db.prepare("SELECT id,del,data FROM orders WHERE tid=? AND upd>?").bind(tid,since).all():await db.prepare("SELECT id,del,data FROM orders WHERE tid=? AND upd>? AND staff_id=?").bind(tid,since,me.id).all();
      const ur=await db.prepare("SELECT * FROM users WHERE tid=? ORDER BY num").bind(tid).all();
      const users=(ur.results||[]).filter(u=>owner||u.id===me.id).map(u=>pubUser(u,{expires:null}));
      const p=await platform(db);
      return J({now:t,user:pubUser(me,{expires:me.expires,expired:false}),settings,users,support:p.support,
        customers:(cr.results||[]).map(r=>r.del?{id:r.id,del:1}:JSON.parse(r.data)),
        orders:(or.results||[]).map(r=>r.del?{id:r.id,del:1}:JSON.parse(r.data))})}

    if(route==="settings"&&m==="PUT"){if(!owner)return J({error:"forbidden"},403);
      if(body.name!=null)await setSetting(db,tid,"name",clip(body.name,100));
      if(Array.isArray(body.items))await setSetting(db,tid,"items",body.items.slice(0,300).map(i=>({id:clip(i.id,40),n:clip(i.n,120),cat:clip(i.cat,20),p:num(i.p),u:clip(i.u,10)})));
      if(body.contact)await setSetting(db,tid,"contact",{tg:clip(body.contact.tg,80),wa:clip(body.contact.wa,30),phone:clip(body.contact.phone,30),addr:clip(body.contact.addr,300),tax:clip(body.contact.tax,60)});
      return J({ok:true})}

    if(route==="customers"){
      if(m==="GET")return J({error:"use_sync"},400);
      if(!owner)return J({error:"forbidden"},403);
      if(m==="POST"){const c=body,id=clip(c.id,40)||rid(8);const prices={};if(c.prices&&typeof c.prices==="object")Object.keys(c.prices).slice(0,300).forEach(k=>{if(c.prices[k]!==""&&c.prices[k]!=null&&isFinite(+c.prices[k]))prices[clip(k,40)]=+c.prices[k]});
        const d={id,name:clip(c.name,200),address:clip(c.address,300),phone:clip(c.phone,50),tax:clip(c.tax,60),notes:clip(c.notes,1000),acct:c.acct!==false,prices};
        if(!d.name)return J({error:"bad_input"},400);
        await db.prepare("INSERT INTO customers(tid,id,upd,del,data) VALUES(?,?,?,0,?) ON CONFLICT(tid,id) DO UPDATE SET upd=excluded.upd,del=0,data=excluded.data").bind(tid,id,now(),JSON.stringify(d)).run();return J({ok:true,customer:d})}
      if(m==="DELETE"&&parts[1]){await db.prepare("UPDATE customers SET del=1,upd=? WHERE tid=? AND id=?").bind(now(),tid,parts[1]).run();return J({ok:true})}}

    if(route==="users"){
      if(!owner)return J({error:"forbidden"},403);
      if(m==="POST"){const name=clip(body.name,100).trim(),code=body.code?String(body.code):"";
        if(!name)return J({error:"bad_input"},400);
        const login=name.toLowerCase().replace(/\s*@\s*/g,"")+"@"+me.shop;
        if(body.id){const u=await db.prepare("SELECT * FROM users WHERE id=? AND tid=?").bind(body.id,tid).first();if(!u)return J({error:"not_found"},404);
          if(code){if(code.length<4)return J({error:"bad_input"},400);const salt=rid(12);await db.prepare("UPDATE users SET salt=?,hash=? WHERE id=?").bind(salt,await hashCode(code,salt),u.id).run()}
          if(u.role==="staff"&&login!==u.login){if(await db.prepare("SELECT 1 x FROM users WHERE login=? AND id<>?").bind(login,u.id).first())return J({error:"duplicate"},409);
            await db.prepare("UPDATE users SET login=? WHERE id=?").bind(login,u.id).run()}
          await db.prepare("UPDATE users SET name=?,active=? WHERE id=?").bind(name,body.active===false&&u.role!=="owner"?0:1,u.id).run();
          if(body.active===false&&u.role!=="owner")await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run();
          return J({ok:true})}
        if(code.length<4)return J({error:"bad_input"},400);
        if(await db.prepare("SELECT 1 x FROM users WHERE login=?").bind(login).first())return J({error:"duplicate"},409);
        const mx=await db.prepare("SELECT COALESCE(MAX(num),0) n FROM users WHERE tid=?").bind(tid).first(),id=rid(8),salt=rid(12);
        await db.prepare("INSERT INTO users(id,num,name,role,salt,hash,created,tid,login) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,mx.n+1,name,"staff",salt,await hashCode(code,salt),now(),tid,login).run();return J({ok:true,id,login})}}

    if(route==="orders"){
      if(m==="POST"){const list=Array.isArray(body.orders)?body.orders:[body],bulk=Array.isArray(body.orders);if(bulk&&!owner)return J({error:"forbidden"},403);
        let n=0;
        for(const raw of list.slice(0,2000)){const id=clip(raw.id,40);if(!id)continue;
          const ex=await db.prepare("SELECT staff_id,data FROM orders WHERE tid=? AND id=?").bind(tid,id).first();
          if(ex&&!owner&&ex.staff_id!==me.id)continue;
          const o=cleanOrder(raw,me,ex?JSON.parse(ex.data):null);
          await db.prepare("INSERT INTO orders(tid,id,at,staff_id,upd,del,data) VALUES(?,?,?,?,?,0,?) ON CONFLICT(tid,id) DO UPDATE SET at=excluded.at,staff_id=excluded.staff_id,upd=excluded.upd,del=0,data=excluded.data").bind(tid,id,o.at,o.staffId||null,now()+n,JSON.stringify(o)).run();n++}
        return J({ok:true,n})}
      if(m==="DELETE"&&parts[1]){if(!owner)return J({error:"forbidden"},403);await db.prepare("UPDATE orders SET del=1,upd=? WHERE tid=? AND id=?").bind(now(),tid,parts[1]).run();return J({ok:true})}}

    if(route==="loc"&&m==="POST"){
      const duty=body.duty?1:0;
      if(isFinite(+body.lat)&&isFinite(+body.lng)&&Math.abs(+body.lat)<=90&&Math.abs(+body.lng)<=180)
        await db.prepare("UPDATE users SET duty=?,lat=?,lng=?,acc=?,loc_at=? WHERE id=?").bind(duty,+body.lat,+body.lng,num(body.acc),now(),me.id).run();
      else await db.prepare("UPDATE users SET duty=? WHERE id=?").bind(duty,me.id).run();
      return J({ok:true})}

    return J({error:"not_found"},404);
  }catch(e){return J({error:"server",detail:String(e&&e.message||e).slice(0,200)},500)}
}
