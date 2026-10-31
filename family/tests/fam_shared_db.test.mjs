// the family app and Laundry (multi-shop) must work side by side inside ONE D1 database
import {makeDB} from './d1shim.mjs';
import {onRequest as fam} from '/home/user/aj-hub/family/functions/api/[[path]].js';
import {onRequest as lp} from '/home/user/aj-hub/laundrypro/functions/api/[[path]].js';
const DB=makeDB();
const call=async(h,method,path,body,tok)=>{const r=await h({request:new Request('http://x'+path,{method,headers:{'content-type':'application/json',...(tok?{authorization:'Bearer '+tok}:{})},body:body?JSON.stringify(body):undefined}),env:{DB}});return{s:r.status,j:await r.json()}};
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
let r=await call(lp,'POST','/api/setup',{biz:'HQ',name:'Admin',phone:'012000111',code:'secret1'});const at=r.j.token;ok(!!at,'laundry admin created in the shared DB');
r=await call(lp,'POST','/api/signup',{biz:'Shop',name:'Sok',phone:'012111222',code:'secret1'});const st=r.j.token;
r=await call(lp,'POST','/api/orders',{id:'o1',no:'L1',name:'Guest',lines:[{n:'x',q:1,p:2}]},st);ok(r.j.ok,'laundry order saved');
r=await call(fam,'POST','/api/signup',{family:'F',name:'Mom',phone:'012111222',code:'secret1'});const mt=r.j.token;ok(!!mt,'family signup works even with the same phone as a laundry shop (separate tables)');
r=await call(fam,'POST','/api/sharing',{on:true},mt);r=await call(fam,'POST','/api/loc',{lat:10,lng:104},mt);r=await call(fam,'GET','/api/sync',null,mt);ok(r.j.members[0].lat===10,'family location works');
r=await call(lp,'GET','/api/sync?since=0',null,st);ok(r.j.orders.length===1&&r.j.user.role==='owner','laundry data untouched by the family app');
r=await call(lp,'POST','/api/login',{name:'012111222',code:'secret1'});ok(!!r.j.token,'laundry login still works');
r=await call(fam,'POST','/api/login',{phone:'012111222',code:'secret1'});ok(!!r.j.token,'family login works');
const t=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();console.log((t.results||[]).map(x=>x.name).join(', '));
