const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/user/aj-hub/game/public';
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8816);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
const mk=async()=>{const c=await b.newContext({viewport:{width:430,height:860},isMobile:true,hasTouch:true,permissions:[]});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(()=>{localStorage.setItem('fc_lang','"en"');window.__shared=[];Object.defineProperty(navigator,'share',{configurable:true,value:(d)=>{window.__shared.push(d.text);return Promise.resolve()}})});return p};
const finish=async(p,score)=>{await p.click('#go');await p.waitForTimeout(150);await p.evaluate(s=>{FC.G.score=s;FC.G.lives=0;FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)},score);await p.waitForTimeout(200)};
// 1) a friend opens a challenge link
let p=await mk();await p.goto('http://localhost:8816/fruit/?c=325&n=Sok&s=ch');await p.waitForSelector('#go');
ok(/Sok scored 325/.test(await p.locator('#tChal').innerText()),'the friend sees: "Sok scored 325! Can you beat it?"');
await p.click('#go');await p.waitForTimeout(150);ok(/325/.test(await p.locator('#goal').innerText())&&await p.locator('#goal:not(.hide)').count()===1,'the target score is shown while playing');
await p.screenshot({path:'/tmp/sc/chal_play.png'});
await p.reload();await p.waitForSelector('#go');await finish(p,400);
ok(/You beat Sok/.test(await p.locator('#tRes').innerText()),'a higher score: "You beat Sok!" ('+await p.locator('#tRes').innerText()+')');await p.screenshot({path:'/tmp/sc/chal_win.png'});
// 2) lower score, tie
p=await mk();await p.goto('http://localhost:8816/fruit/?c=325&n=Sok');await p.waitForSelector('#go');await finish(p,300);ok(/Sok leads by 25/.test(await p.locator('#tRes').innerText()),'a lower score: "Sok leads by 25. Try again!"');
p=await mk();await p.goto('http://localhost:8816/fruit/?c=325&n=Sok');await p.waitForSelector('#go');await finish(p,325);ok(/tie/i.test(await p.locator('#tRes').innerText()),'the same score is a tie');
// 3) the friend shares their own score back with a link
p=await mk();await p.goto('http://localhost:8816/fruit/?c=325&n=Sok');await p.waitForSelector('#go');await finish(p,410);
await p.fill('#nm','Dara');await p.click('#share');await p.waitForTimeout(200);const sh=await p.evaluate(()=>window.__shared[0]||'');
ok(/I scored 410 in Fruit Catch! Can you beat me\? http:\/\/localhost:8816\/fruit\/\?c=410&n=Dara&s=ch$/.test(sh),'share text carries the score and name: '+sh);
ok(await p.evaluate(()=>JSON.parse(localStorage.fc_name))==='Dara','the name is remembered for next time');
// 4) safety: odd values and script tags are harmless
p=await mk();await p.goto('http://localhost:8816/fruit/?c=99999999&n=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');await p.waitForSelector('#go');ok(await p.locator('#tChal.hide').count()===1,'an impossible score in the link is ignored');
p=await mk();await p.goto('http://localhost:8816/fruit/?c=50&n=%3Cb%3Ehack%3C%2Fb%3E%20Bob');await p.waitForSelector('#go');const tt=await p.locator('#tChal').innerText();ok(!/[<>]/.test(tt)&&/hack b Bob|bhackb Bob|hackb Bob|bhack/i.test(tt)||!/[<>]/.test(tt),'odd characters in the name are removed: '+tt);ok(await p.locator('#tChal b').count()===0,'no HTML can be injected through the name');
// 5) normal play without a link is unchanged
p=await mk();await p.goto('http://localhost:8816/fruit/');await p.waitForSelector('#go');ok(await p.locator('#tChal.hide').count()===1&&await p.locator('#goal.hide').count()===1,'no challenge banner without a link');await finish(p,12);ok(await p.locator('#tRes.hide').count()===1,'no result line without a challenge');
ok(errs.length===0,'no page errors '+errs.join());
await b.close();srv.close()})();
