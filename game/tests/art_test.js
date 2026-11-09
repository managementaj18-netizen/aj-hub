// Fruit Catch uses its own drawn artwork (art.js). Every item the game can drop must have a picture that really loads.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','public');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png'};
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8881,async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
const p=await b.newPage({viewport:{width:360,height:640}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8881/fruit/');await p.waitForSelector('#go');await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const names=Object.keys(ART);const bad=names.filter(k=>!(SPR[k]&&SPR[k].complete&&SPR[k].naturalWidth>0));
 const used=[].concat(GOOD,[GOLD],BADS.map(x=>x.e),["🧺"]);const miss=used.filter(e=>!ARTMAP[e]||!ART[ARTMAP[e]]);
 return{n:names.length,bad:bad,miss:miss}});
ok(r.n>=16&&r.bad.length===0,'all '+r.n+' drawings load as images'+(r.bad.length?': broken '+r.bad:''));
ok(r.miss.length===0,'every fruit, creature and the basket the game uses has its own drawing'+(r.miss.length?': missing '+r.miss:''));
ok(await p.evaluate(()=>document.querySelectorAll('#logo img').length===2&&document.querySelectorAll('#tLeg img').length===5),'home page shows the drawings (logo + legend), not emoji');
// canvas really draws pictures (not blank): put a mango in the middle and look for non-background pixels
await p.click('#go');await p.waitForTimeout(150);
const px=await p.evaluate(()=>{FC.G.spawn=1e9;FC.G.items=[];FC.addItem('ok');const it=FC.G.items[0];it.e='🥭';it.x=FC.G.px;it.y=200;it.vy=0;it.rot=0;FC.step(0.001);draw();const c=document.querySelector('canvas'),x=c.getContext('2d');const d=x.getImageData(Math.round(it.x*(c.width/c.clientWidth))-20,Math.round(200*(c.height/c.clientHeight))-20,40,40).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>200)n++;return n});
ok(px>300,'the canvas draws the mango picture ('+px+' solid pixels)');
ok(errs.length===0,'no page errors '+errs.join());
await b.close();srv.close()});
