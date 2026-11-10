// Makes the App Store screenshots for iPhone: 6.9" (1320x2868) and 6.5" (1284x2778).
// Run:  node game/ios-app/make-ios-shots.js   (needs Playwright + Chromium)
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','public'),out=path.join(__dirname,'store');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png'};
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8852,async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const [tag,w,h] of [['6.9',440,956],['6.5',428,926]]){
  const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const p=await c.newPage();
  await p.addInitScript(()=>{localStorage.setItem('fc_lang','"en"');localStorage.setItem('fc_coins','260');localStorage.setItem('fc_best','128');localStorage.setItem('fc_name','"Sokha"')});
  await p.goto('http://localhost:8852/fruit/');await p.waitForSelector('#go');await p.waitForTimeout(500);
  await p.screenshot({path:`${out}/iphone-${tag}-1-home.png`});
  await p.click('#shopB');await p.waitForSelector('#upg .up');await p.waitForTimeout(400);await p.screenshot({path:`${out}/iphone-${tag}-4-shop.png`});await p.click('#shopBack');await p.waitForTimeout(200);
  await p.click('#go');await p.waitForTimeout(200);
  const scene=async(level,score,names)=>p.evaluate(([lv,sc,ns])=>{FC.G.spawn=1e9;FC.G.level=lv;FC.G.score=sc;FC.G.items=[];const W=window.innerWidth;ns.forEach((k,i)=>{FC.addItem(k.k);const it=FC.G.items.at(-1);if(k.e)it.e=k.e;it.x=W*(.15+.7*((i*37%100)/100));it.y=100+i*105;it.vy=0;it.w=0});FC.G.px=FC.G.tx=W/2;(function(w){w.classList.remove('z0','z1','z2','z3');w.classList.add('z'+(lv>=14?3:lv>=11?2:lv>=8?1:0))})(document.getElementById('wrap'))},[level,score,names]);
  await scene(2,14,[{k:'ok'},{k:'gold'},{k:'ok'},{k:'bad'},{k:'ok'},{k:'ok'}]);await p.waitForTimeout(900);await p.screenshot({path:`${out}/iphone-${tag}-2-play.png`});
  await scene(11,560,[{k:'ok'},{k:'bad',e:'🐍'},{k:'gold'},{k:'bad',e:'🕷️'},{k:'ok'},{k:'bad',e:'🐉'}]);await p.waitForTimeout(1800);await p.screenshot({path:`${out}/iphone-${tag}-3-night.png`});
  await c.close();
 }
 await b.close();srv.close()});
