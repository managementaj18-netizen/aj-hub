const {chromium}=require('/opt/node22/lib/node_modules/playwright');const {spawn}=require('child_process');
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
(async()=>{const srv=spawn('node',['server_stats.mjs'],{cwd:__dirname,env:{...process.env,PORT:'8823',ROOT:'/home/user/aj-hub/game/public',HANDLER:'/home/user/aj-hub/game/functions/api/[[path]].js'},stdio:'ignore'});await new Promise(r=>setTimeout(r,1500));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
const pg=async()=>{const c=await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));return p};
// public: the page source must not contain the private addresses
const html=require('fs').readFileSync('/home/user/aj-hub/game/public/admin.html','utf8');ok(!/try-[0-9a-f]{6,}/.test(html)&&!/Juice Sort|Animal Friends/.test(html),'the public page file does not contain private addresses or unreleased game names');
const api=await (await fetch('http://localhost:8823/api/owner')).status;ok(api===401,'the owner list is refused without the code ('+api+')');
// two players put a score on the board
const pl=await pg();await pl.addInitScript(()=>localStorage.setItem('fc_lang','"en"'));await pl.goto('http://localhost:8823/fruit/');await pl.waitForSelector('#go');await pl.fill('#nm0','Bad Name');await pl.locator('#nm0').blur();await pl.click('#go');await pl.waitForTimeout(150);
await pl.evaluate(()=>{FC.G.score=90;FC.G.t=40;FC.G.lives=0;FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)});await pl.waitForTimeout(600);
const p=await pg();await p.goto('http://localhost:8823/admin.html');await p.fill('#code','wrong');await p.click('#go');await p.waitForTimeout(900);ok(/មិនត្រូវ/.test(await p.locator('#err').innerText()),'a wrong code is refused');
await p.fill('#code','sekret-123');await p.click('#go');await p.waitForSelector('#out:not([hidden])');await p.waitForTimeout(700);
const t=await p.locator('#games').innerText();ok(/Fruit Catch/.test(t)&&/English Friends/.test(t)&&/Juice Sort/.test(t)&&/Animal Friends/.test(t)&&/Fruit Merge/.test(t)&&/Smoothie Shift/.test(t),'all four games are in one list for the owner');
ok(await p.locator('#games .chip.live').count()===2&&await p.locator('#games .chip.held').count()===4,'two are marked released, two are marked held back');
ok(/Laundry Pro/.test(await p.locator('#apps').innerText())&&/Family/.test(await p.locator('#apps').innerText())&&await p.locator('#apps a.btn').count()>=3,'the other apps are listed with Open buttons');
ok(await p.locator('#games a.btn').count()===6,'every game has an Open button (including the private test ones)');
ok(/Bad Name/.test(await p.locator('#ptb').innerText()),'the Fruit Catch leaderboard is shown to the owner');
await p.screenshot({path:'/tmp/sc/owner.png',fullPage:true});
p.on('dialog',d=>d.accept());await p.locator('#ptb button').first().click();await p.waitForTimeout(700);ok(!/Bad Name/.test(await p.locator('#ptb').innerText()),'the owner removes a name with one tap');
ok(errs.length===0,'no page errors '+errs.join());
await b.close();srv.kill()})();
