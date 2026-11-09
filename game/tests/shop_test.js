const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/user/aj-hub/game/public';
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8824);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
const mk=async(init)=>{const c=await b.newContext({viewport:{width:430,height:860},isMobile:true,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(i=>{localStorage.setItem('fc_lang','"en"');window.__shared=[];Object.defineProperty(navigator,'share',{configurable:true,value:d=>{window.__shared.push(d.text);return Promise.resolve()}});if(i)for(const k in i)localStorage.setItem(k,i[k])},init||null);return p};
const over=async(p,score,secs=40)=>{await p.evaluate(([s,t])=>{FC.G.score=s;FC.G.t=t;FC.G.lives=1;FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)},[score,secs]);await p.waitForTimeout(250)};
// 1) coins are earned by catching fruit
let p=await mk();await p.goto('http://localhost:8824/fruit/');await p.waitForSelector('#go');
ok(/🪙 0/.test(await p.locator('#coinH').innerText()),'new player starts with 0 coins on the home page');
await p.click('#go');await p.waitForTimeout(150);
for(const k of ['ok','ok','gold']){await p.evaluate(k=>{FC.addItem(k);const it=FC.G.items[FC.G.items.length-1];it.x=FC.G.px;it.y=FC.G.py},k);await p.evaluate(()=>FC.step(0.02))}
ok(await p.evaluate(()=>FC.COINS())===5,'two fruit (+1 each) and a golden pineapple (+3) give 5 coins');ok(/🪙 5/.test(await p.locator('#coin').innerText()),'the top bar shows the coins');
await p.screenshot({path:'/tmp/sc/fc_play.png'});
await over(p,100);ok(await p.evaluate(()=>FC.COINS())===10,'a bonus of 1 coin per 20 points is paid at the end (100 points = +5) -> 10 coins');ok(/\+10/.test(await p.locator('#tCoin').innerText()),'the game-over screen says how many coins were earned: '+await p.locator('#tCoin').innerText());
ok(await p.locator('#cont').isVisible()&&/80/.test(await p.locator('#cont').innerText()),'Continue shows its price (80) even when the player has too few coins');
await p.click('#cont');await p.waitForTimeout(100);ok(await p.evaluate(()=>FC.COINS())===10&&await p.evaluate(()=>FC.G.state==='over'),'tapping Continue with too few coins takes nothing and does not restart');
// 2) coins stay on the phone
await p.reload();await p.waitForSelector('#go');ok(await p.evaluate(()=>FC.COINS())===10,'coins are remembered after closing the game');
// 3) shop: not enough coins, then buy
await p.click('#shopB');await p.waitForSelector('#tree');ok(await p.locator('#upg .up').count()===3,'the shop has 3 upgrades: extra lives, bigger basket, magnet');
await p.screenshot({path:'/tmp/sc/fc_shop.png'});
await p.locator('#upg button[data-k="l"]').click();ok(await p.evaluate(()=>FC.UP().l)===0&&/enough/.test(await p.locator('#toast').innerText()),'buying without enough coins is refused: "Not enough coins"');
let q=await mk({fc_coins:'5000'});await q.goto('http://localhost:8824/fruit/');await q.waitForSelector('#go');await q.click('#shopB');
const pr=await q.locator('#upg button[data-k]').allInnerTexts();ok(/80/.test(pr[0])&&/150/.test(pr[1])&&/220/.test(pr[2]),'first-time prices: heart 80, basket 150, magnet 220 (all different)');
await q.locator('#upg button[data-k="l"]').click();ok(await q.evaluate(()=>FC.UP().l===1&&FC.COINS()===4920),'extra lives cost 80 the first time');
ok(await q.locator('#upg .up').first().locator('button[disabled]').count()===1,'once bought, the heart can not be bought twice in the same game');
await q.locator('#upg button[data-k="b"]').click();await q.locator('#upg button[data-k="m"]').click();
ok(await q.evaluate(()=>FC.COINS()===4920-150-220),'basket 150 and magnet 220');
await q.screenshot({path:'/tmp/sc/fc_shop2.png'});
// 4) the upgrades work in the game
await q.click('#shopBack');await q.click('#go');await q.waitForTimeout(150);
ok(await q.evaluate(()=>FC.G.lives===5&&FC.G.maxLives===5),'the heart gives 2 extra lives: 5 lives');
ok(await q.locator('#li').innerText().then(t=>(t.match(/❤️/g)||[]).length===5),'5 hearts are shown');
ok(await q.evaluate(()=>FC.G.pw)>112*1.1,'a bigger basket catches in a wider area ('+Math.round(await q.evaluate(()=>FC.G.pw))+' px instead of 112)');
ok(await q.evaluate(()=>FC.UP().l===0&&FC.UP().b===0&&FC.UP().m===0&&JSON.parse(localStorage.getItem('fc_up')).l===0),'bought upgrades are used up when the game starts (nothing is kept for the next game)');
// magnet: a fruit beside the basket drifts into it
const m=await q.evaluate(()=>{FC.G.spawn=1e9;FC.G.items=[];FC.addItem('ok');const it=FC.G.items[0];it.x=FC.G.px+80;it.y=FC.G.py-120;it.vy=0;const x0=it.x;for(let i=0;i<20;i++)FC.step(0.02);return[x0,it.x,FC.G.px]});
ok(m[1]<m[0]-30,'the magnet pulls a nearby fruit toward the basket (x '+Math.round(m[0])+' -> '+Math.round(m[1])+')');
const far=await q.evaluate(()=>{FC.G.items=[];FC.addItem('ok');const it=FC.G.items[0];it.x=Math.min(W-30,FC.G.px+300);it.y=FC.G.py-120;it.vy=0;const x0=it.x;for(let i=0;i<20;i++)FC.step(0.02);return Math.abs(it.x-x0)<1});ok(far,'a far fruit is not pulled (magnet has a limit)');
const bad=await q.evaluate(()=>{FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.x=FC.G.px+80;it.y=FC.G.py-120;it.vy=0;const x0=it.x;for(let i=0;i<20;i++)FC.step(0.02);return Math.abs(it.x-x0)<1});ok(bad,'bugs are never pulled in');
// 5) continue costs 25 coins, once per game
await q.evaluate(()=>{FC.G.items=[]});await over(q,60);await q.evaluate(()=>{});
const lives0=await q.evaluate(()=>FC.G.lives);
await q.evaluate(()=>{FC.G.lives=1;FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)});await q.waitForTimeout(200);
await q.evaluate(()=>{COINS=1000;FC.G.conts=0;FC.G.state='play';FC.G.lives=1;FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)});await q.waitForTimeout(200);
const price=[80,120,200];
for(let n=0;n<3;n++){
ok(await q.locator('#cont').isVisible()&&(await q.locator('#cont').innerText()).includes(String(price[n])),'Continue #'+(n+1)+' is offered at '+price[n]+' coins');
const c0=await q.evaluate(()=>FC.COINS());await q.click('#cont');await q.waitForTimeout(150);
ok(await q.evaluate(([c,p])=>FC.G.state==='play'&&FC.G.lives===1&&FC.COINS()===c-p,[c0,price[n]]),'Continue #'+(n+1)+' costs '+price[n]+' coins and gives 1 life');
await q.evaluate(()=>{FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)});await q.waitForTimeout(200);}
ok(await q.locator('#cont').isHidden(),'after 3 continues no more Continue in the same game');
// 6) ready-made messages travel in the challenge link
await q.click('#pms .pm[data-i="2"]');ok(await q.evaluate(()=>FC.PM())===2,'a ready-made message can be chosen');
await q.fill('#nm','Dara');await q.click('#share');await q.waitForTimeout(150);const sh=await q.evaluate(()=>window.__shared[0]||'');
ok(/\?c=\d+&n=Dara&m=2&s=ch$/.test(sh),'the share link carries the message number: '+sh);
let f=await mk();const lnk=sh.match(/http\S+/)[0].replace(/^https?:\/\/[^/]+/,'http://localhost:8824');await f.goto(lnk);await f.waitForSelector('#go');
ok(/Rematch/.test(await f.locator('#tChal').innerText())&&/Dara/.test(await f.locator('#tChal').innerText()),'the friend sees the message: '+(await f.locator('#tChal').innerText()).replace(/\n/g,' | '));
await f.screenshot({path:'/tmp/sc/fc_home.png'});
let g=await mk();await g.goto('http://localhost:8824/fruit/?c=100&n=Bob&m=99');await g.waitForSelector('#go');ok(!/💬/.test(await g.locator('#tChal').innerText()),'an invalid message number is ignored (only the 4 ready-made messages exist; no free text)');
let h=await mk();await h.goto('http://localhost:8824/fruit/?c=100&n=Bob&m=%3Cb%3E');await h.waitForSelector('#go');ok(!/💬/.test(await h.locator('#tChal').innerText())&&await h.locator('#tChal b').count()===0,'a non-number message is ignored too');
// 7) deeper zones: nastier creatures, more coins, darker forest
let z=await mk();await z.goto('http://localhost:8824/fruit/');await z.waitForSelector('#go');await z.click('#go');await z.waitForTimeout(150);
const kinds=async(lv)=>z.evaluate(l=>{FC.G.level=l;const s=new Set();for(let i=0;i<300;i++){FC.G.items=[];FC.addItem('bad');s.add(FC.G.items[0].e)}return [...s].sort().join('')},lv);
const has=(s,e)=>s.includes(e);
const k1=await kinds(1),k2=await kinds(2),k5=await kinds(5),k8=await kinds(8),k11=await kinds(11),k14=await kinds(14);
ok(k1==='🐛'&&k2==='🐛','levels 1-2: only the caterpillar');
const kk3=await kinds(3);
ok(has(kk3,'🐜')&&has(kk3,'🐛'),'level 3 adds the ant');
ok(has(k5,'🐝')&&has(k5,'🐜')&&has(k5,'🐛')&&!has(k5,'🕷'),'level 5 adds the bee (caterpillar + ant + bee)');
ok(has(k8,'🕷')&&has(k8,'🐝')&&has(k8,'🐜')&&!has(k8,'🐛')&&!has(k8,'🐍'),'level 8 (forest): spider joined at level 7, the caterpillar is gone, no snake yet');
ok(has(k11,'🐍')&&has(k11,'🕷')&&has(k11,'🐝')&&!has(k11,'🐉')&&!has(k11,'🐜'),'level 11: the snake joins (deep forest), no dragon yet');
ok(has(k14,'🐉')&&has(k14,'🐍')&&has(k14,'🕷')&&!has(k14,'🐝'),'level 14: the dragon joins the snake and spider');
ok(!has(await kinds(14),'🦗')&&!has(await kinds(14),'🦂')&&!has(await kinds(14),'🦇'),'only 6 kinds of creature exist in the game (no cricket, scorpion or bat)');
const maxKinds=await z.evaluate(()=>{let m=0;for(const l of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,18]){FC.G.level=l;const s=new Set();for(let i=0;i<400;i++){FC.G.items=[];FC.addItem('bad');s.add(FC.G.items[0].e)}m=Math.max(m,s.size)}return m});
ok(maxKinds<=3,'never more than 3 kinds of creature at the same time (max seen: '+maxKinds+')');
ok(await z.evaluate(()=>{const t={0:1,9:1,10:2,29:2,30:3,59:3,60:4,99:4,100:5,149:5,150:6,209:6,210:7,279:7,280:8,449:9,450:10,549:10,550:11,580:11,909:13,910:14};return Object.keys(t).every(s=>levelFor(+s)===t[s])}),'levels start at 10, 30, 60, 100, 150, 210, 280, 360, 450, 550 ... points; 580 points = level 11');
const beh=await z.evaluate(()=>{FC.G.level=14;FC.G.state='play';FC.G.spawn=1e9;const mk=(e)=>{FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];const b=BADS.find(x=>x.e===e);Object.assign(it,{e:e,w:b.w||0,wa:b.wa||55,wf:b.wf||55,j:b.j||0,vy:150,y:-30,x:200,x0:200});return it};
 const run=(it,n)=>{const xs=[];for(let i=0;i<n;i++){FC.G.px=-999;FC.step(0.05);xs.push(it.x)}return xs};
 const bee=mk('🐝'),bx=run(bee,60),brange=Math.max(...bx)-Math.min(...bx);
 const snake=mk('🐍'),sx=run(snake,60),srange=Math.max(...sx)-Math.min(...sx);
 const ant=mk('🐜'),ax=run(ant,10);
 FC.G.px=FC.G.tx=180;FC.G.items=[];return{brange:brange,srange:srange,antStraight:Math.max(...ax)-Math.min(...ax)<1}});
ok(beh.brange>15&&beh.brange<60,'the bee sways a little ('+Math.round(beh.brange)+' px)');
ok(beh.srange>60,'the snake swings wide from side to side ('+Math.round(beh.srange)+' px)');
ok(beh.antStraight,'the ant falls straight down');
// atmosphere: evening leaves, night fireflies, storm rain + lightning
const atm=await z.evaluate(()=>{const out={};FC.G.state='play';for(const [l,n] of [[1,'day'],[8,'evening'],[11,'night'],[14,'storm']]){FC.G.level=l;FC.G.spawn=1e9;FC.G.items=[];FC.G.ps=null;FC.G.pz=-1;FC.step(0.02);out[n]={n:(FC.G.ps||[]).length,z:zone()}}
 FC.G.level=14;FC.G.flash=0;FC.G.nextLt=0.01;FC.step(0.05);out.flash=FC.G.flash;return out});
ok(atm.day.n===0&&atm.evening.n>0&&atm.night.n>0&&atm.storm.n>20,'meadow has no weather; evening has leaves, night has fireflies, the storm has rain ('+atm.evening.n+'/'+atm.night.n+'/'+atm.storm.n+')');
ok(atm.flash>.5,'lightning flashes in the storm');
await z.evaluate(()=>{FC.G.level=1;FC.G.zn=0;FC.G.state='play';FC.G.score=549;FC.G.level=10;FC.G.items=[];FC.addItem('ok');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)});
ok(await z.evaluate(()=>{const c=document.getElementById('wrap').classList;return c.contains('z2')}),'reaching level 11 (550 points) turns the scene to night');
ok(await z.evaluate(()=>Object.keys(SPC).length>=16),'every drawing is also kept as a ready-to-draw canvas copy (fast on phones)');
ok(await z.evaluate(()=>new Promise(r=>setTimeout(()=>r(document.getElementById('wrap').classList.contains('playing')),200))),'while playing the scenery stops swaying (so the game stays smooth)');
const sp=await z.evaluate(()=>{FC.G.level=3;const a=(function(){const v=[];for(let i=0;i<50;i++){FC.G.items=[];FC.addItem('ok');v.push(FC.G.items[0].vy)}return v.reduce((x,y)=>x+y)/v.length})();FC.G.level=8;const b=(function(){const v=[];for(let i=0;i<50;i++){FC.G.items=[];FC.addItem('ok');v.push(FC.G.items[0].vy)}return v.reduce((x,y)=>x+y)/v.length})();FC.G.level=1;const c=(function(){const v=[];for(let i=0;i<50;i++){FC.G.items=[];FC.addItem('ok');v.push(FC.G.items[0].vy)}return v.reduce((x,y)=>x+y)/v.length})();return[c,a,b]});
ok(sp[0]>150&&sp[1]>sp[0]*1.2&&sp[2]>sp[1]*1.2,'fruit speeds up step by step: Lv1 '+Math.round(sp[0])+', Lv3 '+Math.round(sp[1])+', Lv8 '+Math.round(sp[2])+' px/s');
// rhythm breaks: fruit shower and swarm
const wv=await z.evaluate(()=>{const o={};FC.G.state='play';FC.G.spawn=1e9;FC.G.items=[];
 FC.G.level=1;FC.G.wave=null;FC.G.nextWave=0;FC.step(0.02);o.noWaveLv1=!FC.G.wave;
 FC.G.level=3;FC.G.wave=null;FC.G.nextWave=0;FC.step(0.02);o.showerLv3=FC.G.wave&&FC.G.wave.type;
 FC.G.wave.t=0.01;FC.step(0.05);o.ended=!FC.G.wave&&FC.G.nextWave>=17;
 FC.G.level=3;FC.G.wave={type:'shower',t:3};FC.G.items=[];FC.G.spawn=0;let bad=0,n=0;for(let i=0;i<60;i++){FC.G.spawn=0;FC.G.items=[];FC.step(0.001);if(FC.G.items[0]){n++;if(FC.G.items[0].k==='bad')bad++}}o.showerBad=bad;o.showerN=n;
 FC.G.level=8;FC.G.wave={type:'swarm',t:3};let sb=0,sn=0;for(let i=0;i<120;i++){FC.G.spawn=0;FC.G.items=[];FC.step(0.001);if(FC.G.items[0]){sn++;if(FC.G.items[0].k==='bad')sb++}}o.swarmShare=sb/sn;
 FC.G.wave=null;FC.G.nextWave=99;return o});
ok(wv.noWaveLv1&&wv.showerLv3==='shower'&&wv.ended,'a wave starts every ~20-30 s from level 2 (shower), lasts a few seconds and then waits again');
ok(wv.showerBad===0&&wv.showerN>50,'a fruit shower drops only fruit (no creatures)');
ok(wv.swarmShare>.4,'a swarm drops many creatures ('+Math.round(wv.swarmShare*100)+'%)');
ok(await z.evaluate(()=>{FC.G.level=1;const a=badP();FC.G.level=9;const b=badP();FC.G.level=14;const c=badP();return a<=.12&&b>.25&&c>=.37&&c>a*3}),'creatures are rare at the start (12%) and come out much more as you go deeper (38% at Lv14)');
const cc=async(lv)=>z.evaluate(l=>{FC.G.level=l;FC.G.state='play';FC.G.items=[];const c0=FC.COINS();FC.addItem('ok');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02);return FC.COINS()-c0},lv);
ok(await cc(1)===1&&await cc(8)===2&&await cc(11)===3&&await cc(14)===4,'fruit pays 1 / 2 / 3 / 4 coins deeper in the forest');
const dm=await z.evaluate(()=>{FC.G.level=14;FC.G.state='play';FC.G.lives=3;FC.G.maxLives=3;FC.G.spawn=1e9;FC.G.tx=FC.G.px;FC.G.ty=FC.G.py;FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.e='🐉';it.d=2;it.w=0;it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02);return FC.G.lives});ok(dm===1,'a dragon takes 2 lives (lives left '+dm+')');
await z.evaluate(()=>{FC.G.level=7;FC.G.state='play';FC.G.score=279;FC.G.lives=3;FC.G.items=[];FC.addItem('ok');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)});
ok(await z.evaluate(()=>document.getElementById('wrap').classList.contains('z1')),'the scenery changes to forest when level 8 is reached (280 points)');
await q.evaluate(()=>FC.start());await q.waitForTimeout(100);
ok(await q.evaluate(()=>FC.G.maxLives===3&&FC.G.pw===112&&FC.G.up.m===0),'the next game starts with the normal 3 lives, normal basket and no magnet - buy again to get them back');
await q.reload();await q.waitForSelector('#go');ok(await q.evaluate(()=>FC.UP().l===0),'after closing and reopening the game nothing is kept either');
ok(errs.length===0,'no page errors '+errs.join());
await b.close();srv.close()})();
