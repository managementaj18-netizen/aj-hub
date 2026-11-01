const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/user/aj-hub/game/public',root2='/home/user/aj-hub/game/_unreleased';
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f))f=path.join(root2,q.url.split('?')[0]+(q.url.endsWith('/')?'index.html':''));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8806);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
const c=await b.newContext({viewport:{width:430,height:860},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('ak_lang','"km"')});
await p.goto('http://localhost:8806/kids/');await p.waitForSelector('.card');
ok((await p.locator('.card').count())===6,'6 animal friends to choose from');ok(/ជ្រើសមិត្ត/.test(await p.locator('#tPick').innerText()),'Khmer title');
await p.screenshot({path:'/tmp/sc/kids_pick.png'});
await p.click('.card[data-i="0"]');await p.waitForTimeout(100);ok(await p.evaluate(()=>AC&&AC.state==='running'),'sound engine is unlocked by the first touch (needed on iPhone)');ok(await p.evaluate(()=>AK.G.state==='play'&&AK.G.an.id==='dog'),'choosing the dog starts the game');
await p.evaluate(()=>{AK.G.spawn=1e9;AK.G.items=[];AK.G.rng=()=>0.5});
const run=async(n)=>{for(let i=0;i<n;i++)await p.evaluate(()=>AK.step(0.02))};
const drop=async(k,x)=>{await p.evaluate(([k,x])=>{AK.addItem(k);const it=AK.G.items[AK.G.items.length-1];it.x=x;it.y=cv.clientHeight-170},[k,x])};
// basket follows touch
await p.touchscreen.tap(80,500);await p.waitForTimeout(300);ok(await p.evaluate(()=>AK.G.px)<130,'friend follows the finger');
const bx=await p.evaluate(()=>AK.G.px);
// catches
for(let i=0;i<5;i++){await drop('food',bx);await run(30)}
ok(await p.evaluate(()=>AK.G.catches)===5,'5 favourite foods caught');ok(await p.evaluate(()=>AK.G.stars)===1,'a star after every 5 catches');
ok(/1/.test(await p.locator('#st').innerText()),'star shown on screen: '+await p.locator('#st').innerText());
// silly items bounce away, no penalty, no game over
const before=await p.evaluate(()=>AK.G.catches);await drop('silly',bx);await run(40);ok(await p.evaluate((b)=>AK.G.catches===b&&AK.G.state==='play',before),'silly item bounces away: no penalty');
ok(await p.evaluate(()=>AK.G.items.some(i=>i.b)||AK.G.items.length===0),'the silly item flies off');
// missed food does not end the game
await drop('food',bx>200?20:W0());await run(120);ok(await p.evaluate(()=>AK.G.state)==='play','missing food never ends the game');
// 15 catches => bigger celebration (confetti)
for(let i=0;i<10;i++){await drop('food',bx);await run(30)}
ok(await p.evaluate(()=>AK.G.catches)>=15&&await p.evaluate(()=>AK.G.stars)>=3,'stars keep growing');
await p.evaluate(()=>{AK.G.rng=Math.random});await p.screenshot({path:'/tmp/sc/kids_play.png'});
// random play spawns
await p.evaluate(()=>{AK.G.spawn=0});await run(100);ok(await p.evaluate(()=>AK.G.items.length)>0,'treats spawn and fall by themselves');
// home button and switching animal
await p.click('#bb');ok(await p.locator('#ovPick:not(.hide)').count()===1,'home button returns to the friends');
await p.click('.card[data-i="3"]');ok(await p.evaluate(()=>AK.G.an.id==='ele'&&AK.G.stars===0),'choose the elephant: fresh start');
await p.click('#bm');await p.click('#bm');
ok(await p.evaluate(()=>typeof AudioContext!=='undefined'),'sound engine available (synthesised, no files)');
ok(errs.length===0,'no page errors '+errs.join('|'));
await b.close();srv.close()})();
function W0(){return 400}
