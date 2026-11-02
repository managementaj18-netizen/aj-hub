const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const {spawn}=require('child_process');
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
(async()=>{
 const srv=spawn('node',['server_stats.mjs'],{cwd:__dirname,env:{...process.env,PORT:'8817',ROOT:'/home/user/aj-hub/game/public',HANDLER:'/home/user/aj-hub/game/functions/api/[[path]].js'},stdio:'ignore'});
 await new Promise(r=>setTimeout(r,1500));
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const player=async()=>{const c=await b.newContext({viewport:{width:430,height:860},isMobile:true,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(()=>localStorage.setItem('fc_lang','"en"'));return p};
 const finish=async(p,score,secs)=>{await p.click('#go');await p.waitForTimeout(150);await p.evaluate(([s,t])=>{FC.G.score=s;FC.G.t=t;FC.G.lives=0;FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)},[score,secs]);await p.waitForTimeout(600)};
 // player 1: home page has name, best score, leaderboard, challenge
 const a=await player();await a.goto('http://localhost:8817/fruit/');await a.waitForSelector('#go');
 ok(await a.locator('#nm0').count()===1&&await a.locator('#lb').count()===1&&await a.locator('#chb').count()===1&&await a.locator('#best').count()===1,'home page has: name box, best score, leaderboard, challenge button');
 ok(/Play first/.test(await a.locator('#chb').innerText()),'challenge button asks to play first when there is no score yet');
 await a.fill('#nm0','Sok');await a.locator('#nm0').blur();await a.waitForTimeout(150);
 await finish(a,120,30);
 ok(/#1 today/.test(await a.locator('#tRank').innerText()),'after the game the player sees the place: '+await a.locator('#tRank').innerText());
 await a.screenshot({path:'/tmp/sc/home_end.png'});
 // player 2 plays too and beats player 1
 const bb=await player();await bb.goto('http://localhost:8817/fruit/');await bb.waitForSelector('#go');await finish(bb,200,40);
 ok(/Type your name/.test(await bb.locator('#tRank').innerText()),'no name yet: the player is told to type a name to join the board');
 await bb.fill('#nm','Dara');await bb.locator('#nm').blur();await bb.waitForTimeout(500);
 ok(/#1 today/.test(await bb.locator('#tRank').innerText()),'after typing a name the score is sent: '+await bb.locator('#tRank').innerText());
 // leaderboard panel on the home page of player 1
 await a.click('#homeB');await a.waitForTimeout(200);ok(await a.locator('#ovStart:not(.hide)').count()===1,'Home button returns to the home page');
 ok(/Play|Challenge a friend/.test(await a.locator('#chb').innerText())&&!/Play first/.test(await a.locator('#chb').innerText()),'now the challenge button is ready (best score exists)');
 await a.click('#lb');await a.waitForSelector('#lbList li');const rows=await a.locator('#lbList li').allInnerTexts();
 ok(rows.length===2&&/Dara/.test(rows[0])&&/200/.test(rows[0])&&/Sok/.test(rows[1]),'leaderboard shows Dara 200 first, Sok 120 second: '+rows.join(' | ').replace(/\n/g,' '));
 ok(await a.locator('#lbList li.me').count()===1&&/Sok/.test(await a.locator('#lbList li.me').innerText()),'my own row is highlighted');
 await a.screenshot({path:'/tmp/sc/home_lb.png'});
 await a.click('#lbTabs button[data-p="all"]');await a.waitForTimeout(300);ok(await a.locator('#lbList li').count()===2,'tabs: today / this week / all time');
 await a.click('#lbBack');ok(await a.locator('#ovStart:not(.hide)').count()===1,'Back returns to the home page');
 // challenge button shares the best score
 await a.evaluate(()=>{window.__s=[];Object.defineProperty(navigator,'share',{configurable:true,value:d=>{window.__s.push(d.text);return Promise.resolve()}})});await a.click('#chb');await a.waitForTimeout(150);
 ok(/\?c=120&n=Sok&s=ch$/.test(await a.evaluate(()=>window.__s[0]||'')),'challenge button shares the best score with the name: '+await a.evaluate(()=>window.__s[0]));
 // the board works for a brand new phone with no name (view only)
 const c=await player();await c.goto('http://localhost:8817/fruit/');await c.waitForSelector('#go');await c.click('#lb');await c.waitForSelector('#lbList li');ok(await c.locator('#lbList li').count()===2&&await c.locator('#lbList li.me').count()===0,'a new visitor can read the board before playing');
 await c.screenshot({path:'/tmp/sc/home_lb2.png'});
 ok(errs.length===0,'no page errors '+errs.join());
 await b.close();srv.kill();
})();
