const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/user/aj-hub/game/public';
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8803);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
const c=await b.newContext({viewport:{width:430,height:860},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('fc_lang','"km"');localStorage.removeItem('fc_best')});
await p.goto('http://localhost:8803/');await p.waitForSelector('#go');
ok(/ចាប់ផ្លែឈើ/.test(await p.locator('#tTitle').innerText()),'Khmer title');ok(!/\b(title|how|go)\b/.test(await p.locator('#ovStart').innerText().then(x=>x.replace(/\s+/g,' '))),'no raw keys');
await p.screenshot({path:'/tmp/sc/game_menu.png'});
await p.click('#go');await p.waitForTimeout(100);ok(await p.evaluate(()=>FC.G.state)==='play','game starts');
// freeze the random spawns, then drive the game deterministically
await p.evaluate(()=>{FC.G.spawn=1e9;FC.G.items=[];FC.G.rng=()=>0.5});
const W=await p.evaluate(()=>cv.clientWidth),H=await p.evaluate(()=>cv.clientHeight);
// 1) basket follows a finger drag
await p.touchscreen.tap(60,500);await p.waitForTimeout(250);let px=await p.evaluate(()=>FC.G.px);ok(px<120,'basket moves to the finger (left): '+Math.round(px));
await p.touchscreen.tap(370,500);await p.waitForTimeout(400);px=await p.evaluate(()=>FC.G.px);ok(px>300,'basket moves to the finger (right): '+Math.round(px));
// 2) catch a fruit = +1, then a gold = +5
const drop=async(k,x)=>{await p.evaluate(([k,x])=>{FC.addItem(k);const it=FC.G.items[FC.G.items.length-1];it.x=x;it.y=cv.clientHeight-120},[k,x])};
const run=async(n)=>{for(let i=0;i<n;i++)await p.evaluate(()=>FC.step(0.02))};
const bx=await p.evaluate(()=>FC.G.px);
await drop('ok',bx);await run(30);ok(await p.evaluate(()=>FC.G.score)===1,'catching a fruit gives +1');
await drop('gold',bx);await run(30);ok(await p.evaluate(()=>FC.G.score)===6,'catching the pineapple gives +5 (score 6)');
// 3) missed fruit costs nothing; a bug costs a life
await drop('ok',20);await run(60);ok(await p.evaluate(()=>FC.G.score===6&&FC.G.lives===3),'a missed fruit costs nothing');
await drop('bad',bx);await run(30);ok(await p.evaluate(()=>FC.G.lives)===2,'catching a bug loses a life');
await drop('bad',20);await run(60);ok(await p.evaluate(()=>FC.G.lives)===2,'a missed bug is harmless');
// 4) level up at 10 points
for(let i=0;i<4;i++){await drop('ok',bx);await run(30)}
ok(await p.evaluate(()=>FC.G.level)===2,'level 2 at 10 points (score '+await p.evaluate(()=>FC.G.score)+')');
await p.evaluate(()=>{FC.addItem('ok');FC.addItem('bad')});await p.screenshot({path:'/tmp/sc/game_play.png'});
// 5) pause stops the world
await p.click('#bp');const s1=await p.evaluate(()=>FC.G.t);await p.waitForTimeout(300);const s2=await p.evaluate(()=>FC.G.t);ok(s1===s2&&await p.locator('#ovPause:not(.hide)').count()===1,'pause freezes the game');await p.click('#resume');
// 6) game over, best score saved, restart
await drop('bad',bx);await run(30);await drop('bad',bx);await run(30);
ok(await p.evaluate(()=>FC.G.state)==='over'&&await p.locator('#ovEnd:not(.hide)').count()===1,'game over after 3 lives');
const fs2=await p.locator('#fs').innerText();ok(+fs2>=10,'final score shown: '+fs2);ok(/កំណត់ត្រាថ្មី/.test(await p.locator('#tBest').innerText()),'new record message');
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('fc_best')))===+fs2,'best score saved in the phone');
await p.screenshot({path:'/tmp/sc/game_over.png'});
await p.click('#again');await p.waitForTimeout(100);ok(await p.evaluate(()=>FC.G.state==='play'&&FC.G.score===0&&FC.G.lives===3),'play again resets');
// 7) random play spawns things and they fall
await p.evaluate(()=>{FC.G.rng=Math.random;FC.G.spawn=0});await run(120);ok(await p.evaluate(()=>FC.G.items.length)>0,'fruit spawns by itself and falls');
// language switch
await p.click('#bp');await p.click('#resume');
ok(errs.length===0,'no page errors '+errs.join('|'));
await b.close();srv.close()})();
