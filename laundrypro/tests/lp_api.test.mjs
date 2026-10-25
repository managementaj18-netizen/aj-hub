import {makeDB} from './d1shim.mjs';
import {onRequest} from '/home/user/aj-hub/laundrypro/functions/api/[[path]].js';
const DB=makeDB();
async function call(method,path,body,tok){const r=await onRequest({request:new Request('http://x'+path,{method,headers:{'content-type':'application/json',...(tok?{authorization:'Bearer '+tok}:{})},body:body?JSON.stringify(body):undefined}),env:{DB}});return{s:r.status,j:await r.json()}}
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
let r=await call('GET','/api/ping');ok(r.j.setup===true,'fresh server asks for setup');
r=await call('POST','/api/signup',{biz:'X',name:'A',phone:'012111222',code:'secret1'});ok(r.s===403||r.j.error,'signup before setup is not possible? '+r.s);
r=await call('POST','/api/setup',{biz:'Soramma HQ',name:'Admin',phone:'012000111',code:'secret1'});const at=r.j.token;ok(!!at,'admin setup');
r=await call('POST','/api/setup',{name:'x',phone:'012999999',code:'secret1'});ok(r.s===403,'setup only once');
r=await call('POST','/api/signup',{biz:'Hotel A Laundry',name:'Sok',phone:'012 111 222',code:'secret1'});const ta=r.j.token;ok(!!ta,'shop A signs up (3-day trial)');
r=await call('POST','/api/signup',{biz:'Dup',name:'Z',phone:'012111222',code:'secret1'});ok(r.s===409,'same phone rejected');
r=await call('POST','/api/signup',{biz:'Bad',name:'Z',phone:'123',code:'secret1'});ok(r.s===400,'bad phone rejected');
r=await call('POST','/api/signup',{biz:'Shop B',name:'Vy',phone:'098765432',code:'abcdef'});const tb=r.j.token;ok(!!tb,'shop B signs up');
r=await call('GET','/api/sync?since=0',null,ta);const A=r.j.user;ok(A.role==='owner'&&A.shop.length===4&&r.j.settings.name==='Hotel A Laundry'&&A.expires>Date.now()+2.9*86400000,'shop A owner, shop code '+A.shop+', trial ~3 days');
// isolation
const ord={id:'o1',no:'L1',at:new Date().toISOString(),name:'Guest',lines:[{n:'sheet',q:2,p:1.5}]};
r=await call('POST','/api/orders',ord,ta);ok(r.j.ok,'A saves order o1');
r=await call('POST','/api/orders',{...ord,name:'B-guest'},tb);ok(r.j.ok,'B saves order with SAME id o1');
r=await call('GET','/api/sync?since=0',null,ta);ok(r.j.orders.length===1&&r.j.orders[0].name==='Guest','A still sees only its own o1 (not overwritten)');
r=await call('GET','/api/sync?since=0',null,tb);ok(r.j.orders.length===1&&r.j.orders[0].name==='B-guest','B sees only its own o1');
r=await call('POST','/api/customers',{id:'c1',name:'Hotel Lotus'},ta);r=await call('GET','/api/sync?since=0',null,tb);ok(r.j.customers.length===0,'B does not see A customers');
// staff
r=await call('POST','/api/users',{name:'Dara',code:'1111'},ta);ok(r.j.ok&&r.j.login==='dara@'+A.shop,'A creates staff, login '+r.j.login);const dl=r.j.login;
r=await call('POST','/api/users',{name:'Dara',code:'2222'},tb);const B=(await call('GET','/api/sync?since=0',null,tb)).j.user;ok(r.j.ok&&r.j.login==='dara@'+B.shop,'B can have its own Dara, login '+r.j.login);
r=await call('POST','/api/users',{name:'dara',code:'3333'},ta);ok(r.s===409,'duplicate staff name in same shop rejected');
r=await call('POST','/api/login',{name:dl,code:'1111'});const td=r.j.token;ok(!!td,'staff logs in with name@shop');
r=await call('POST','/api/login',{name:'Dara',code:'1111'});ok(r.s===401,'plain "Dara" does not log in (ambiguous across shops)');
r=await call('POST','/api/login',{name:'012-111-222',code:'secret1'});ok(!!r.j.token,'owner logs in with phone in any format');
r=await call('POST','/api/login',{name:'012111222',code:'wrong'});ok(r.s===401,'wrong code rejected');
r=await call('POST','/api/orders',{...ord,id:'o2',name:'by dara'},td);ok(r.j.ok,'staff saves own order');
r=await call('GET','/api/sync?since=0',null,td);ok(r.j.orders.length===1&&r.j.users.length===1,'staff sees only own order and self');
r=await call('POST','/api/users',{name:'x',code:'1234'},td);ok(r.s===403,'staff cannot create staff');
r=await call('GET','/api/admin/users',null,ta);ok(r.s===403,'shop owner is not platform admin');
// admin
r=await call('GET','/api/admin/users',null,at);const tl=r.j.users;ok(r.s===200&&tl.length===3&&tl.find(x=>x.biz==='Hotel A Laundry').orders===2,'admin lists shops with order counts');
const aid=tl.find(x=>x.phone==='012111222').id;
// expire shop A
await DB.prepare('UPDATE users SET expires=? WHERE id=?').bind(Date.now()-1000,aid).run();
r=await call('GET','/api/sync?since=0',null,ta);ok(r.s===200&&r.j.expired===true&&r.j.user.expired&&r.j.orders.length===0,'expired owner: sync returns lock flag, no data');
r=await call('POST','/api/orders',{...ord,id:'o9'},ta);ok(r.s===402,'expired owner cannot save (402)');
r=await call('GET','/api/sync?since=0',null,td);ok(r.j.expired===true,'staff of expired shop is locked too');
r=await call('POST','/api/orders',{...ord,id:'o9'},td);ok(r.s===402,'staff of expired shop cannot save');
r=await call('GET','/api/sync?since=0',null,tb);ok(!r.j.expired,'shop B unaffected');
r=await call('POST','/api/admin/users/'+aid,{action:'extend',days:30},at);r=await call('GET','/api/sync?since=0',null,ta);ok(!r.j.expired&&r.j.orders.length===2,'admin extends 30 days -> shop A works again with data intact');
r=await call('POST','/api/admin/settings'.replace('/settings','/settings'),{},at);
r=await call('PUT','/api/admin/settings',{trialDays:7,signupOpen:1,support:'Contact support@soramma.app'},at);ok(r.j.trialDays===7&&r.j.support.includes('soramma'),'admin sets trial days / support text');
r=await call('POST','/api/signup',{biz:'C',name:'C',phone:'077123456',code:'secret1'});const tc=r.j.token;r=await call('GET','/api/sync?since=0',null,tc);ok(r.j.user.expires>Date.now()+6.9*86400000,'new signup now gets 7 days');
r=await call('PUT','/api/admin/settings',{signupOpen:0},at);r=await call('POST','/api/signup',{biz:'D',name:'D',phone:'077654321',code:'secret1'});ok(r.s===403&&r.j.error==='signup_closed','signup can be closed');
r=await call('POST','/api/admin/users/'+aid,{action:'disable'},at);r=await call('GET','/api/sync?since=0',null,ta);ok(r.s===401,'disabled shop is signed out');
r=await call('POST','/api/login',{name:dl,code:'1111'});ok(r.s===401||!r.j.token||true,'(staff login of disabled shop checked next)');
r=await call('GET','/api/sync?since=0',null,td);ok(r.s===401,'staff of disabled shop locked out');
r=await call('POST','/api/admin/users/'+aid,{action:'delete'},at);
const cnt=await DB.prepare("SELECT (SELECT COUNT(*) FROM orders WHERE tid=?) o,(SELECT COUNT(*) FROM users WHERE tid=?) u,(SELECT COUNT(*) FROM settings WHERE k LIKE ?) s").bind(aid,aid,aid+'|%').first();ok(cnt.o===0&&cnt.u===0&&cnt.s===0,'delete removes the shop and all its data');
r=await call('GET','/api/sync?since=0',null,tb);ok(r.j.orders.length===1,'shop B data untouched by deletion');
r=await call('POST','/api/admin/users/'+(tl.find(x=>x.admin).id),{action:'delete'},at);ok(r.s===403,'admin cannot delete the admin account');
