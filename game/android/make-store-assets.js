// Makes the Google Play screenshots (1080x1920) and the feature graphic (1024x500) for Fruit Catch.
// Run:  node game/android/make-store-assets.js   (needs Playwright + Chromium)
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','public'),out=path.join(__dirname,'store');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png'};
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8851,async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const lang of ['en','km']){
  const c=await b.newContext({viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const p=await c.newPage();
  await p.addInitScript(l=>{localStorage.setItem('fc_lang',JSON.stringify(l));localStorage.setItem('fc_coins','260');localStorage.setItem('fc_best','128');localStorage.setItem('fc_name','"Sokha"')},lang);
  await p.goto('http://localhost:8851/fruit/');await p.waitForSelector('#go');await p.waitForTimeout(500);
  await p.screenshot({path:`${out}/${lang}-1-home.png`});
  await p.click('#shopB');await p.waitForSelector('#tree');await p.waitForTimeout(400);await p.screenshot({path:`${out}/${lang}-4-shop.png`});await p.click('#shopBack');await p.waitForTimeout(200);
  await p.click('#go');await p.waitForTimeout(200);
  const scene=async(level,score,names)=>p.evaluate(([lv,sc,ns])=>{FC.G.spawn=1e9;FC.G.level=lv;FC.G.score=sc;FC.G.items=[];const W=window.innerWidth;ns.forEach((k,i)=>{FC.addItem(k.k);const it=FC.G.items.at(-1);if(k.e)it.e=k.e;it.x=W*(.15+.7*((i*37%100)/100));it.y=90+i*95;it.vy=0;it.w=0});FC.G.px=FC.G.tx=W/2;document.getElementById('wrap').className='z'+Math.min(3,Math.floor((lv-1)/3));if(window.hud)hud()},[level,score,names]);
  await scene(2,14,[{k:'ok'},{k:'gold'},{k:'ok'},{k:'bad'},{k:'ok'},{k:'ok'}]);await p.waitForTimeout(900);await p.screenshot({path:`${out}/${lang}-2-play.png`});
  await scene(10,112,[{k:'ok'},{k:'bad',e:'🐉'},{k:'gold'},{k:'bad',e:'🐍'},{k:'ok'},{k:'bad',e:'🕷️'}]);await p.waitForTimeout(1800);await p.screenshot({path:`${out}/${lang}-3-jungle.png`});
  await c.close();
 }
 const c2=await b.newContext({viewport:{width:1024,height:500}});const g=await c2.newPage();
 await g.setContent(`<body style="margin:0;width:1024px;height:500px;background:linear-gradient(135deg,#7fcdf8,#c9efff 55%,#bfe8a0);font-family:system-ui,sans-serif;position:relative;overflow:hidden">
 <div style="position:absolute;left:60px;top:120px"><div style="font-size:84px;font-weight:800;color:#14502f">Fruit Catch</div><div style="font-size:30px;color:#14502f;margin-top:16px;line-height:1.35">Catch the fruit.<br>Dodge the bugs.<br>Go deeper into the forest.</div></div>
 <div style="position:absolute;right:80px;top:30px;font-size:110px;line-height:1.1;letter-spacing:10px">🥭🍌<br>🍉🍍</div><div style="position:absolute;right:130px;bottom:-30px;font-size:170px">🧺</div></body>`);
 await g.screenshot({path:`${out}/feature-graphic.png`});
 
 // ---- English Friends (package com.soramma.englishfriends) ----
 {const c=await b.newContext({viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const p=await c.newPage();await p.goto('http://localhost:8851/abc/');await p.waitForSelector('.w');await p.waitForTimeout(600);
  await p.screenshot({path:`${out}/abc-1-menu.png`});
  await p.tap('.w[data-i="0"]');await p.waitForTimeout(400);await p.screenshot({path:`${out}/abc-2-story.png`});
  await p.tap('#stGo');await p.waitForTimeout(1800);await p.screenshot({path:`${out}/abc-3-pick.png`});
 
  await c.close()}
 {const c2=await b.newContext({viewport:{width:1024,height:500}});const g=await c2.newPage();
  await g.setContent(`<body style="margin:0;width:1024px;height:500px;background:linear-gradient(135deg,#8fd8ff,#e9f8ff 55%,#8fdc6a);font-family:system-ui,sans-serif;position:relative;overflow:hidden">
  <div style="position:absolute;left:60px;top:110px"><div style="font-size:70px;font-weight:800;color:#2b3a67">English Friends</div><div style="font-size:30px;color:#2b3a67;margin-top:16px;line-height:1.35">Hear it. Tap it. Spell it.<br>First English words with Momo.</div></div>
  <div style="position:absolute;right:50px;top:80px;font-size:200px">🐵</div><div style="position:absolute;right:360px;bottom:30px;font-size:90px;letter-spacing:12px">🍎🐶🌞</div></body>`);
  await g.screenshot({path:`${out}/abc-feature-graphic.png`});await c2.close()}
 await b.close();srv.close()});
