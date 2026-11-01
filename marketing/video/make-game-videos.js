const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/user/aj-hub/game/public';
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8805);
const W=540,H=960,URL_TXT='play.soramma.app';
const FONT="font-family:'Kantumruy Pro',system-ui,sans-serif";
const card=(html)=>`(()=>{const e=document.createElement('div');e.id='__card';e.style.cssText="position:fixed;inset:0;z-index:100001;background:linear-gradient(135deg,#1f2a44,#2e3d63);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;${FONT};padding:28px";e.innerHTML=${JSON.stringify(html)};document.body.appendChild(e)})()`;
async function rec(name,body){
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true,recordVideo:{dir:'/tmp/sc/gv/'+name,size:{width:W,height:H}}});
 const T0=Date.now();const p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
 await p.addInitScript(()=>{localStorage.setItem('fc_lang','"km"');localStorage.setItem('js_lang','"km"');localStorage.removeItem('js_lv');localStorage.removeItem('fc_best')});
 const cap=async(txt,ms)=>{await p.evaluate(([t,f])=>{let e=document.getElementById('__cap');if(!e){e=document.createElement('div');e.id='__cap';e.style.cssText="position:fixed;left:14px;right:14px;top:96px;z-index:99999;background:#1f2a44ee;color:#fff;border:2px solid #f1d58a;border-radius:18px;padding:12px 16px;font-weight:700;font-size:25px;line-height:1.35;text-align:center;box-shadow:0 8px 24px #0006;pointer-events:none;"+f;document.body.appendChild(e)}e.textContent=t;e.style.display=t?'block':'none'},[txt,FONT]);await p.waitForTimeout(ms)};
 const showCard=async(html,ms)=>{await p.evaluate(card(html));await p.waitForTimeout(ms)};
 await p.addInitScript(()=>{window.__lvlog=[];let l=0;setInterval(()=>{try{if(FC.G.state==='play'&&FC.G.level!==l){l=FC.G.level;window.__lvlog.push({lv:l,t:Date.now()})}}catch(e){}},50)});
 await body(p,cap,showCard);if(name==='fc'){const L=await p.evaluate(()=>window.__lvlog);fs.writeFileSync('/tmp/sc/gv/levels.json',JSON.stringify(L.map(x=>({lv:x.lv,t:(x.t-T0)/1000}))));console.log('levels',JSON.stringify(L.map(x=>[x.lv,(x.t-T0)/1000])))}await c.close();await b.close()}
const hook=(l1,l2)=>`<div style="font-weight:700;font-size:56px;line-height:1.3">${l1}</div><div style="font-weight:700;font-size:36px;line-height:1.4;color:#f1d58a">${l2}</div>`;
const end=(title,sub)=>`<div style="font-weight:700;font-size:50px;line-height:1.2">${title}</div><div style="font-weight:700;font-size:30px;line-height:1.4">${sub}</div><div style="font-weight:700;font-size:30px;color:#f1d58a">${URL_TXT}</div><div style="margin-top:10px;background:#f1d58a;color:#1f2a44;border-radius:99px;padding:10px 22px;font-weight:700;font-size:26px">👍 តាមដាន Page Soramma</div>`;
(async()=>{
 // ---------- Fruit Catch ----------
 await rec('fc',async(p,cap,showCard)=>{
  await p.goto('http://localhost:8805/');await p.waitForSelector('#go');
  await showCard(hook('ចាប់ផ្លែឈើបាន<br>ប៉ុន្មាន? 🧺','លេងឥតគិតថ្លៃ'),2600);await p.evaluate(()=>document.getElementById('__card').remove());
  await cap('អូសម្រាមដៃ ឲ្យកញ្ជើចាប់ផ្លែឈើ',1800);await cap('',100);
  await p.click('#go');
  await p.evaluate(()=>{let s=12345;FC.G.rng=()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296}});
  // a simple "player": follow the lowest good fruit, step aside from bugs
  await p.evaluate(()=>{window.__bot=setInterval(()=>{const G=FC.G;if(G.state!=='play')return;const by=G.py+8;let tgt=null,ty=-1e9;
    G.items.forEach(it=>{if(it.k!=='bad'&&it.y<by&&it.y>ty){ty=it.y;tgt=it}});
    let x=tgt?tgt.x:G.px;
    G.items.forEach(it=>{if(it.k==='bad'&&it.y>by-260&&it.y<by+20&&Math.abs(it.x-x)<62){x=it.x<cv.clientWidth/2?it.x+95:it.x-95}});
    G.tx=Math.max(30,Math.min(cv.clientWidth-30,x));G.ty=cv.clientHeight-130},25)});
  await p.waitForTimeout(7000);await cap('🍍 មាស +5 · 🐛 ដង្កូវ បាត់ជីវិត',2500);await cap('',100);
  await p.waitForTimeout(4000);await cap('ពិន្ទុរាល់ 10 ឡើងកម្រិត ផ្លែឈើជ្រុះលឿនជាង',2800);await cap('',100);
  await p.waitForTimeout(4000);
  await showCard(end('ចាប់ផ្លែឈើ','លេងឥតគិតថ្លៃ លើទូរស័ព្ទ'),3500)});
 // ---------- Juice Sort ----------
 if(process.env.WITH_SORT)await rec('js',async(p,cap,showCard)=>{
  await p.goto('http://localhost:8805/sort/');await p.waitForSelector('#undo');
  await showCard(hook('តម្រៀបពណ៌<br>ឲ្យបានមួយដប 🧪','លេងឥតគិតថ្លៃ'),2600);await p.evaluate(()=>document.getElementById('__card').remove());
  await p.evaluate(()=>JS.newLevel(3));await p.waitForTimeout(500);
  await cap('ចុចដបមួយ ហើយចុចដបមួយទៀត ដើម្បីចាក់ទឹក',2400);await cap('',100);
  const moves=await p.evaluate(()=>{function clone(t){return t.map(x=>x.slice())}function key(s){return s.map(t=>t.join('')).sort().join('|')}function rl(t){var c=t[t.length-1],n=0;for(var i=t.length-1;i>=0&&t[i]===c;i--)n++;return n}
   const seen={};function go(s,path){if(JS.solved(s))return path;const k=key(s);if(seen[k])return null;seen[k]=1;for(let i=0;i<s.length;i++){if(!s[i].length)continue;for(let j=0;j<s.length;j++){if(i===j||!JS.canPour(s[i],s[j]))continue;if(!s[j].length&&rl(s[i])===s[i].length)continue;const n=clone(s);JS.pour(n[i],n[j]);const r=go(n,path.concat([[i,j]]));if(r)return r}}return null}
   return go(clone(JS.S.tubes),[])});
  const pos=async(i)=>p.evaluate((i)=>{layout();const L=LAY[i],r=cv.getBoundingClientRect();return[r.left+L.x+L.w/2,r.top+L.y+L.h/2]},i);
  let n=0;for(const [i,j] of moves){let [x,y]=await pos(i);await p.touchscreen.tap(x,y);await p.waitForTimeout(550);[x,y]=await pos(j);await p.touchscreen.tap(x,y);await p.waitForTimeout(650);n++;
   if(n===3)await cap('ចាក់បានតែពណ៌ដូចគ្នា ឬចូលដបទទេ',2200),await cap('',100)}
  await p.waitForTimeout(900);await cap('ពណ៌មួយដប ទើបឈ្នះ ⭐',1800);await cap('',100);
  await p.waitForTimeout(600);
  await showCard(end('ទឹកផ្លែឈើ','តម្រៀបពណ៌ លេងឥតគិតថ្លៃ'),3500)})
 srv.close();
})();
