const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/user/aj-hub/game/public';
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'application/javascript':'application/octet-stream'});r.end(d)})}).listen(8841,async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
for(const [name,url,sel] of [['Fruit Catch','/fruit/','#soon'],['English Friends','/abc/','#foll']]){
 const p=await b.newPage({viewport:{width:430,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__opened=[];window.open=(u)=>{window.__opened.push(u);return null}});
 await p.goto('http://localhost:8841'+url);await p.waitForSelector(sel);await p.waitForTimeout(300);
 ok(/follow|តាមដាន/i.test(await p.locator(sel).innerText()),name+': the "follow Page Soramma" line is shown');
 await p.locator(sel).click();await p.waitForTimeout(150);
 const o=await p.evaluate(()=>window.__opened);
 ok(o.length===1&&o[0]==='https://www.facebook.com/share/1JSphYg6k3/',name+': tapping it opens the Soramma Facebook Page: '+o.join());
 ok(errs.length===0,name+': no page errors '+errs.join());
 await p.close()}
await b.close();srv.close()});
