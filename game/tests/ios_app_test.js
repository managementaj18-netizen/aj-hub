// The iPhone app carries the game files inside it. They must talk to the real internet address and make real share links.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path'),{execSync}=require('child_process');
execSync('node '+path.join(__dirname,'..','ios-app','scripts','make-www.js'),{stdio:'ignore'});
const root=path.join(__dirname,'..','ios-app','www');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png'};
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8896,async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
ok(!/fonts\.googleapis|fonts\.gstatic/.test(html),'no Google Fonts inside the app (players addresses are not sent to Google)');
ok(!/<script src="\.\.\//.test(html)&&fs.existsSync(path.join(root,'track.js'))&&fs.existsSync(path.join(root,'art.js')),'all files the page needs are inside the app folder');
const c=await b.newContext({viewport:{width:430,height:860},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[],calls=[];p.on('pageerror',e=>errs.push(e.message));
await c.route('https://play.soramma.app/**',r=>{calls.push(r.request().method()+' '+r.request().url());r.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:JSON.stringify({ok:true,total:1,dist:{3:1},top:[{score:50,me:true}],me:{score:50,rank:1},ranks:{day:{rank:1,best:50,total:1},week:{rank:1,best:50,total:1},all:{rank:1,best:50,total:1}}})})});
await p.addInitScript(()=>{localStorage.setItem('fc_lang','"en"');window.__shared=[];Object.defineProperty(navigator,'share',{configurable:true,value:d=>{window.__shared.push(d.text);return Promise.resolve()}})});
await p.goto('http://localhost:8896/');await p.waitForSelector('#go');await p.waitForTimeout(600);
ok(await p.evaluate(()=>window.SORAMMA_API==='https://play.soramma.app'),'the app knows the real internet address');
await p.click('#go');await p.waitForTimeout(150);
await p.evaluate(()=>{FC.G.score=100;FC.G.t=30;FC.G.lives=0;FC.G.items=[];FC.addItem('bad');const it=FC.G.items[0];it.x=FC.G.px;it.y=FC.G.py;FC.step(0.02)});await p.waitForTimeout(800);
ok(calls.some(x=>x.startsWith('POST https://play.soramma.app/api/score')),'the score is sent to https://play.soramma.app/api/score');
ok(calls.some(x=>x.includes('/api/hit')),'visit/play counts go to the real address too');
await p.fill('#nm','Sok');await p.click('#share');await p.waitForTimeout(200);
const sh=await p.evaluate(()=>window.__shared[0]||'');
ok(/https:\/\/play\.soramma\.app\/fruit\/\?c=100&n=Sok/.test(sh),'share links point to https://play.soramma.app/fruit/ (not to the phone): '+sh);
ok(await p.evaluate(()=>/of 1/.test(document.getElementById('tRank').innerText)),'the place after the game is shown');
ok(errs.length===0,'no page errors '+errs.join());
await b.close();srv.close()});
