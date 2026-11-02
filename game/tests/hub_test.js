const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/user/aj-hub/game/public';
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.mp3':'audio/mpeg'}[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8820);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
const pg=async()=>{const c=await b.newContext({viewport:{width:430,height:860},isMobile:true,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));return p};
const go=async(u)=>{const p=await pg();await p.goto('http://localhost:8820'+u);await p.waitForTimeout(700);return p};
let p=await go('/');ok(new URL(p.url()).pathname==='/games/','a plain visit to play.soramma.app shows the list of games');
ok(await p.locator('a.g').count()===2&&/Fruit Catch/.test(await p.locator('#gf').innerText())&&/English Friends/.test(await p.locator('#ga').innerText()),'the list has Fruit Catch and English Friends as separate choices');
ok(!/Juice|Animal/i.test(await p.locator('body').innerText()),'unreleased games are not mentioned');await p.screenshot({path:'/tmp/sc/hub.png'});
await p.click('#ga');await p.waitForSelector('.w');ok(new URL(p.url()).pathname==='/abc/'&&/s=hub/.test(p.url()),'tapping English Friends opens it (source "hub" is kept)');
await p.click('a.sm[href="/games/"]');await p.waitForSelector('a.g');ok(new URL(p.url()).pathname==='/games/','English Friends has a "More games" link back to the list');
p=await go('/');await p.click('#gf');await p.waitForSelector('#go');ok(new URL(p.url()).pathname==='/fruit/','tapping Fruit Catch opens Fruit Catch');
await p.click('#more');await p.waitForSelector('a.g');ok(new URL(p.url()).pathname==='/games/','Fruit Catch has an "All games" button back to the list');
// old links keep working
p=await go('/?c=325&n=Sok&s=ch');ok(new URL(p.url()).pathname==='/fruit/'&&/c=325/.test(p.url())&&/#tChal/.test('#tChal')&&await p.locator('#tChal:not(.hide)').count()===1,'old challenge links still open Fruit Catch with the challenge');
p=await go('/?s=fb');ok(new URL(p.url()).pathname==='/fruit/','the earlier Facebook post link (?s=fb) still opens Fruit Catch');
p=await go('/?hub=1&s=fb');ok(new URL(p.url()).pathname==='/games/','a link with hub=1 shows the list of games');
p=await go('/games/?s=fb');ok(new URL(p.url()).pathname==='/games/'&&await p.locator('a.g').count()===2,'/games/ is the list of games and never redirects');
// fruit catch lives on its own address and still works
p=await go('/fruit/');ok(await p.locator('#go').count()===1&&await p.locator('#nm0').count()===1,'/fruit/ is Fruit Catch with its home page');
ok(await p.evaluate(async()=>(await fetch('/fruit/manifest.json')).ok&&(await fetch('/fruit/sw.js')).ok),'Fruit Catch has its own manifest and service worker');
ok((await (await fetch('http://localhost:8820/sw.js')).text()).includes('unregister'),'the old root service worker removes itself');
ok(errs.length===0,'no page errors '+errs.join());
await b.close();srv.close()})();
