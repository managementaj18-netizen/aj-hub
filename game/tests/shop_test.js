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
await q.locator('#upg button[data-k="l"]').click();ok(await q.evaluate(()=>FC.UP().l===1&&FC.COINS()===4900),'level 1 extra life costs 100 coins');
await q.locator('#upg button[data-k="l"]').click();ok(await q.evaluate(()=>FC.UP().l===2&&FC.COINS()===4650),'level 2 costs 250 coins');
await q.locator('#upg button[data-k="l"]').click();ok(await q.evaluate(()=>FC.UP().l===3&&FC.COINS()===4150),'level 3 costs 500 coins');
ok(await q.locator('#upg .up').first().locator('button[disabled]').count()===1,'after level 3 the button shows Max level');
await q.locator('#upg button[data-k="b"]').click();await q.locator('#upg button[data-k="m"]').click();
await q.screenshot({path:'/tmp/sc/fc_shop2.png'});
// 4) the upgrades work in the game
await q.click('#shopBack');await q.click('#go');await q.waitForTimeout(150);
ok(await q.evaluate(()=>FC.G.lives===6&&FC.G.maxLives===6),'3 extra-life levels: the game starts with 6 lives (3 + 3)');
ok(await q.locator('#li').innerText().then(t=>(t.match(/❤️/g)||[]).length===6),'6 hearts are shown');
ok(await q.evaluate(()=>FC.G.pw)>112*1.1,'a bigger basket catches in a wider area ('+Math.round(await q.evaluate(()=>FC.G.pw))+' px instead of 112)');
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
ok(await kinds(1)==='🐛','level 1-3 only has caterpillars');
ok((await kinds(4)).includes('🕷')&&!(await kinds(4)).includes('🐍'),'level 4+ adds spiders, no snakes yet');
ok((await kinds(7)).includes('🐍')&&!(await kinds(7)).includes('🐉'),'level 7+ adds snakes');
ok((await kinds(10)).includes('🐉'),'level 10+ adds dragons');
const cc=async(lv)=>z.evaluate(l=>{FC.G.level=l;FC.G.state='play';FC.G.items=[];const c0=FC.COINS();FC.addItem('ok');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02);return FC.COINS()-c0},lv);
ok(await cc(1)===1&&await cc(4)===2&&await cc(7)===3&&await cc(10)===4,'fruit pays 1 / 2 / 3 / 4 coins deeper in the forest');
const dm=await z.evaluate(()=>{FC.G.level=10;FC.G.state='play';FC.G.lives=3;FC.G.maxLives=3;FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.e='🐉';it.d=2;it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02);return FC.G.lives});ok(dm===1,'a dragon takes 2 lives');
await z.evaluate(()=>{FC.G.level=9;FC.G.state='play';FC.G.score=99;FC.G.lives=3;FC.G.items=[];FC.addItem('ok');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)});
ok(await z.evaluate(()=>document.getElementById('wrap').className)==='z3','the scenery gets darker (dark jungle) at level 10');
ok(errs.length===0,'no page errors '+errs.join());
await b.close();srv.close()})();
