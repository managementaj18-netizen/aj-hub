import {makeDB} from './d1shim.mjs';
import {onRequest} from '../functions/api/[[path]].js';
const DB=makeDB();
const H={'x-admin-code':'sekret-123'};
const call=async(method,path,body,hdr)=>{const r=await onRequest({request:new Request('http://x'+path,{method,headers:{'content-type':'application/json',...(hdr||{})},body:body?JSON.stringify(body):undefined}),env:{DB,ADMIN_CODE:'sekret-123'}});return{s:r.status,j:await r.json()}};
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
const sub=(vid,name,score,t=60)=>call('POST','/api/score',{game:'fruit',vid,name,score,t});
let r=await sub('phoneAAAA1111','Sok',120);ok(r.s===200&&r.j.ranks.all.rank===1,'first score is rank 1');
r=await sub('phoneBBBB2222','Dara',300);ok(r.j.ranks.all.rank===1&&r.j.ranks.day.rank===1,'a higher score takes rank 1');
r=await sub('phoneAAAA1111','Sok',200);ok(r.j.ranks.all.rank===2&&r.j.ranks.all.best===200,'own best is kept and improved: rank 2, best 200');
r=await sub('phoneAAAA1111','Sok',50);ok(r.j.ranks.all.best===200,'a worse game never lowers the best');
r=await sub('phoneCCCC3333','Neary',90);
r=await call('GET','/api/top?game=fruit&period=all&vid=phoneAAAA1111');
ok(r.s===200&&r.j.top.map(x=>x.score).join()==='300,200,90'&&r.j.total===3,'the public board shows scores and how many players (3), sorted');
ok(r.j.dist&&r.j.dist[8]===1&&r.j.dist[6]===1&&r.j.dist[4]===1&&Object.keys(r.j.dist).length===3,'the board says how many players reached each level: 300 pts = Lv8, 200 = Lv6, 90 = Lv4 '+JSON.stringify(r.j.dist));
ok(r.j.top.length>0&&r.j.top.slice(5).every(x=>!('name' in x))&&r.j.top.slice(0,5).every(x=>'name' in x),'the public board shows names only for the top 5');
ok(r.j.top.filter(x=>x.me).length===1&&r.j.top[1].me===true&&r.j.me.rank===2,'only my own row is marked and my place is returned');
r=await call('GET','/api/top?game=fruit&period=all',null,{'x-admin-code':'wrong'});ok(r.s===200,'a wrong code still gets the public board');
r=await call('GET','/api/top?game=fruit&period=all&vid=phoneAAAA1111',null,H);
ok(r.j.top.map(x=>x.name).join()==='Dara,Sok,Neary'&&r.j.top.map(x=>x.score).join()==='300,200,90','the owner (with the secret code) sees the names: Dara 300, Sok 200, Neary 90');

ok(!JSON.stringify(r.j).includes('phoneAAAA1111'),'phone ids are never sent to other players');
for(const per of ['day','week']){r=await call('GET','/api/top?game=fruit&period='+per,null,H);ok(r.s===200&&r.j.top.length===3,per+' board has the same 3 players today');}
r=await call('GET','/api/top?game=fruit&period=year',null,H);ok(r.s===400,'unknown period refused');
r=await sub('phoneDDDD4444','Cheater',99999,5);ok(r.s===422,'a score that is impossible for 5 seconds is refused');
r=await sub('phoneDDDD4444','Cheater',50,5);ok(r.s===200,'a plausible score is accepted');
r=await sub('phoneEEEE5555','<b>Hack</b>',40);r=await call('GET','/api/top?game=fruit&period=all',null,H);ok(r.j.top.some(x=>x.name==='bHackb')&&!r.j.top.some(x=>/[<>]/.test(x.name)),'names are cleaned: no < > characters');
r=await sub('phoneFFFF6666','  ',40);ok(r.s===200,'a player without a name is accepted and counts');r=await call('GET','/api/top?game=fruit&period=all',null,H);ok(r.j.top.some(x=>x.name===''&&x.score===40),'the owner sees it with an empty name');r=await call('GET','/api/top?game=fruit&period=all');ok(r.j.total>=4&&r.j.top.slice(5).every(x=>!('name' in x)),'it is counted in the number of players; only the top 5 can show names');r=await sub('phoneFFFF6666','Ok',0);ok(r.s===400,'score 0 refused');r=await sub('short','Ok',10);ok(r.s===400,'bad id refused');
r=await sub('phoneGGGG7777','សុខា',70);r=await call('GET','/api/top?game=fruit&period=all',null,H);ok(r.j.top.some(x=>x.name==='សុខា'),'Khmer names work');
let last;for(let i=0;i<65;i++)last=await sub('phoneHHHH8888','Spam',10+i%3);ok(last.s===429,'one phone cannot flood the board (429 after 60)');
r=await call('POST','/api/score-delete',{name:'Spam'});ok(r.s===401,'deleting a name needs the owner code');
r=await call('POST','/api/score-delete',{name:'Spam'},{'x-admin-code':'sekret-123'});r=await call('GET','/api/top?game=fruit&period=all',null,H);ok(!r.j.top.some(x=>x.name==='Spam'),'the owner can remove a name from the board');
r=await call('GET','/api/top?game=sort&period=all',null,H);ok(r.j.top.length===0,'each game has its own board');

