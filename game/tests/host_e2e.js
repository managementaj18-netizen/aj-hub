const {chromium}=require('/opt/node22/lib/node_modules/playwright');const {spawn}=require('child_process');
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
(async()=>{const srv=spawn('node',['server_host.mjs'],{cwd:__dirname,env:{...process.env,PORT:'8822'},stdio:'ignore'});await new Promise(r=>setTimeout(r,1500));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--host-resolver-rules=MAP *.soramma.app 127.0.0.1']});const errs=[];
const pg=async()=>{const c=await b.newContext({viewport:{width:430,height:860},isMobile:true,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(()=>localStorage.setItem('fc_lang','"en"'));return p};
// Fruit Catch has its own address
let p=await pg();await p.goto('http://fruit.soramma.app:8822/?s=fb');await p.waitForSelector('#go');
ok(/Fruit Catch/.test(await p.locator('#tTitle').innerText())&&await p.locator('#nm0').count()===1,'fruit.soramma.app shows Fruit Catch with its home page');
ok(await p.locator('body').innerText().then(t=>!/English Friends/.test(t)),'Fruit Catch does not mention or link to other games');
await p.fill('#nm0','Sok');await p.locator('#nm0').blur();await p.click('#go');await p.waitForTimeout(150);
await p.evaluate(()=>{FC.G.score=150;FC.G.t=40;FC.G.lives=0;FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)});await p.waitForTimeout(700);
ok(!/#\d/.test(await p.locator('#tRank').innerText()),'no ranking shown to players on the Fruit Catch address');
await p.evaluate(()=>{window.__s=[];Object.defineProperty(navigator,'share',{configurable:true,value:d=>{window.__s.push(d.text);return Promise.resolve()}})});await p.click('#share');await p.waitForTimeout(150);
ok(/^I scored 150 in Fruit Catch! Can you beat me\? http:\/\/fruit\.soramma\.app:8822\/\?c=150&n=Sok&s=ch$/.test(await p.evaluate(()=>window.__s[0]||'')),'challenge links use the Fruit Catch address: '+await p.evaluate(()=>window.__s[0]));
// English Friends has its own address
let e=await pg();await e.goto('http://english.soramma.app:8822/?s=fb');await e.waitForSelector('.w');
ok(/English Friends/.test(await e.locator('#tTitle').innerText())&&await e.locator('.w').count()===6,'english.soramma.app shows English Friends with its 6 worlds');
await e.waitForTimeout(800);ok(await e.evaluate(()=>Object.keys(EF.AB).length)===36,'all 36 voice files load on the English Friends address');
ok(await e.locator('body').innerText().then(t=>!/Fruit Catch/.test(t)),'English Friends does not mention or link to other games');
await e.locator('.w[data-i="0"]').tap();await e.locator('#stGo').tap();await e.waitForTimeout(1200);ok(await e.evaluate(()=>EF.PLAYED.length)>=1,'the voice plays on the English Friends address');
// the same server still serves the old path style
let o=await pg();await o.goto('http://play.soramma.app:8822/abc/');await o.waitForSelector('.w');ok(true,'play.soramma.app/abc/ still works');
await o.goto('http://play.soramma.app:8822/?c=100&n=Bob');await o.waitForSelector('#go');ok(new URL(o.url()).pathname==='/fruit/'&&await o.locator('#tChal:not(.hide)').count()===1,'old challenge links on play.soramma.app still open Fruit Catch');
ok(errs.length===0,'no page errors '+errs.join());
await b.close();srv.kill()})();
