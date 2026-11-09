// Both games must be installable apps: manifest, icons of the right size, working service worker.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','public');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.mp3':'audio/mpeg'};
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8871,async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
for(const [name,dir] of [['Fruit Catch','fruit'],['English Friends','abc']]){
 const m=JSON.parse(fs.readFileSync(path.join(root,dir,'manifest.json'),'utf8'));
 ok(m.name&&m.short_name&&m.start_url==='./'&&m.scope==='./'&&m.display==='standalone'&&m.orientation==='portrait',name+': manifest has name, start_url, scope, standalone, portrait');
 const sizes=m.icons.map(i=>i.sizes).sort().join();ok(sizes==='192x192,512x512',name+': manifest has 192 and 512 icons');
 for(const i of m.icons){const d=fs.readFileSync(path.join(root,dir,i.src));const w=d.readUInt32BE(16),h=d.readUInt32BE(20);ok(`${w}x${h}`===i.sizes,name+': '+i.src+' really is '+i.sizes)}
 const p=await b.newPage({viewport:{width:360,height:640}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(`http://localhost:8871/${dir}/`);await p.waitForTimeout(800);
 ok(await p.evaluate(()=>!!document.querySelector('link[rel=manifest]')),name+': page links the manifest');
 const reg=await p.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return r.scope});
 ok(reg.endsWith(`/${dir}/`),name+': service worker active for its own folder only: '+reg);
 ok(errs.length===0,name+': no page errors '+errs.join());await p.close()}
await b.close();srv.close()});
