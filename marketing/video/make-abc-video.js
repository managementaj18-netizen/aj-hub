// English Friends promo video: slow pacing, real game footage, voices + music added afterwards.
// Usage: node make-abc-video.js   (needs the game at game/public/try-*/abc and ffmpeg + python3/numpy)
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const root='/home/user/aj-hub/game/public';
const priv=fs.readdirSync(root).filter(d=>d.startsWith('try-'))[0];
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.mp3':'audio/mpeg'}[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8815);
const W=540,H=960,URL_TXT='play.soramma.app/abc/',OUT='/tmp/sc/abcv';
const FONT="font-family:'Kantumruy Pro','Baloo 2',system-ui,sans-serif";
const card=(html,bg)=>`(()=>{const e=document.createElement('div');e.id='__card';e.style.cssText="position:fixed;inset:0;z-index:100001;background:${bg||'linear-gradient(160deg,#ffb347,#ff6f91)'};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;${FONT};padding:28px";e.innerHTML=${JSON.stringify(html)};document.body.appendChild(e)})()`;
(async()=>{
 fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true,recordVideo:{dir:OUT,size:{width:W,height:H}}});
 const T0=Date.now(),now=()=>(Date.now()-T0)/1000,EV=[],CUTS=[];
 const p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
 await p.addInitScript(()=>{localStorage.setItem('ef_lang','"km"');localStorage.setItem('ef_mus','false');localStorage.setItem('ef_snd','false');localStorage.removeItem('ef_done');localStorage.removeItem('ef_stars');
  window.__sp=[];let n=0;setInterval(()=>{try{if(EF.SPOKEN.length>n){for(;n<EF.SPOKEN.length;n++)window.__sp.push({w:EF.SPOKEN[n],t:Date.now()})}}catch(e){}},25)});
 // ef_snd=false keeps the recording silent (sound is added afterwards); EF.SPOKEN still logs every word
 const cap=async(txt,ms,top)=>{await p.evaluate(([t,f,tp])=>{let e=document.getElementById('__cap');if(!e){e=document.createElement('div');e.id='__cap';e.style.cssText="position:fixed;left:14px;right:14px;top:"+tp+"px;z-index:99999;background:#ffffffee;color:#2b3a67;border:3px solid #ff9a3c;border-radius:18px;padding:12px 16px;font-weight:700;font-size:25px;line-height:1.35;text-align:center;box-shadow:0 8px 24px #0006;pointer-events:none;"+f;document.body.appendChild(e)}e.style.top=tp+'px';e.textContent=t;e.style.display=t?'block':'none'},[txt,FONT,top||560]);await p.waitForTimeout(ms)};
 const ev=(type)=>EV.push({type,t:now()});
 const target=()=>p.evaluate(()=>EF.G.target[0]);
 const answer=async(hold)=>{const w=await target();await p.locator(`.opt[data-w="${w}"]`).tap();ev('ok');await p.waitForTimeout(hold)};
 const next=async()=>{await p.locator('#pNext:not(.hide), #spNext:not(.hide)').first().tap();ev('tap');await p.waitForTimeout(500)};
 const fast=async(n)=>{for(let i=0;i<n;i++){await p.waitForTimeout(450);const sp=await p.locator('#sSpell:not(.hide)').count();if(sp){const w=await p.evaluate(()=>EF.G.spell.word);for(const ch of w.split(''))await p.locator(`.tile[data-l="${ch}"]:not(.used)`).first().tap();await p.waitForTimeout(1050);await p.locator('#spNext').tap()}else{const w=await target();await p.locator(`.opt[data-w="${w}"]`).tap();await p.waitForTimeout(1050);await p.locator('#pNext').tap()}}await p.waitForTimeout(500)};
 await p.goto(`http://localhost:8815/${priv}/abc/`);await p.waitForSelector('.w');
 // sync flash: a white frame at a known moment, so the sound can be lined up with the picture exactly
 await p.waitForTimeout(600);ev('flashOn');await p.evaluate(card('','#ff0000'));await p.waitForTimeout(500);await p.evaluate(()=>document.getElementById('__card').remove());await p.waitForTimeout(400);
 // 1. hook
 ev('hookStart');
 await p.evaluate(card(`<div style="font-weight:800;font-size:58px;line-height:1.3;text-shadow:0 3px 0 #0003">កូនរៀនអង់គ្លេស<br>ដោយការលេង! 🐵</div><div style="font-weight:800;font-size:36px;line-height:1.4;color:#fff6c2;text-shadow:0 2px 0 #0003">English Friends</div>`));await p.waitForTimeout(4200);
 await p.evaluate(()=>document.getElementById('__card').remove());
 // 2. menu
 await cap('៦ ជំពូក · ៣៦ ពាក្យអង់គ្លេស',3600,730);await cap('',100);
 // 3. farm story
 await p.locator('.w[data-i="0"]').tap();ev('tap');await cap('ម៉ូម៉ូទៅកសិដ្ឋាន ជួយរកមិត្តសត្វ',3200,640);await cap('',100);
 await p.locator('#stGo').tap();ev('tap');
 await cap('មើលអក្សរ ស្តាប់សំឡេង ហើយចុចរូប',100);
 for(let i=0;i<3;i++){await p.waitForTimeout(i===0?2300:1900);await answer(i===0?3200:2800);if(i===0)await cap('',100);await next()}
 // fast-forward learn rounds 4-6 (cut out of the video)
 let a=now();await fast(3);CUTS.push([a,now()]);
 // 4. practice (no words)
 await cap('ជុំក្រោយ ដកអក្សរចេញ ស្តាប់ឲ្យល្អ',3400);await cap('',100);
 await p.waitForTimeout(800);await answer(2800);await next();
 await p.waitForTimeout(1600);await answer(2600);await next();
 // spelling round
 await cap('បន្ទាប់ ត្រូវតម្រៀបអក្សរ',2200);await cap('',100);
 await p.waitForTimeout(1700);
 {const w=await p.evaluate(()=>EF.G.spell.word);for(const ch of w.split('')){await p.locator(`.tile[data-l="${ch}"]:not(.used)`).first().tap();ev('tile');await p.waitForTimeout(950)}}
 await p.waitForTimeout(2400);await next();
 a=now();await fast(3);CUTS.push([a,now()]);
 await p.waitForSelector('#sDone:not(.hide)');ev('win');await p.waitForTimeout(500);await cap('ចប់ជំពូក ទទួលផ្កាយ និងស្ទីគ័រ ⭐',4200);await cap('',100);
 // 5. family characters
 await p.locator('#bhome').tap();ev('tap');await p.waitForTimeout(900);
 await p.locator('.w[data-i="4"]').tap();ev('tap');await p.waitForTimeout(1800);await p.locator('#stGo').tap();ev('tap');
 await cap('គ្រួសារ៖ តួខុសគ្នាច្បាស់ ងាយចាំ',100);await p.waitForTimeout(3600);await answer(2800);await cap('',100);
 // 6. end card
 await p.evaluate(card(`<div style="font-weight:800;font-size:52px;line-height:1.25">English Friends</div><div style="font-weight:700;font-size:30px;line-height:1.4">ក្មេងរៀនអង់គ្លេស ដោយការលេង<br>ឥតគិតថ្លៃ</div><div style="font-weight:800;font-size:32px;color:#fff6c2">${URL_TXT}</div><div style="margin-top:8px;background:#fff6c2;color:#1c5d7a;border-radius:99px;padding:10px 24px;font-weight:700;font-size:26px">👍 តាមដាន Page Soramma</div>`,'linear-gradient(160deg,#35c48b,#1c8fd1)'));
 await p.waitForTimeout(5200);
 const SP=await p.evaluate(()=>window.__sp);const total=now();
 const spoken=SP.map(x=>({type:'say',w:x.w,t:(x.t-T0)/1000}));
 await c.close();await b.close();srv.close();
 const webm=fs.readdirSync(OUT).filter(f=>f.endsWith('.webm'))[0];
 const raw=OUT+'/'+webm;
 let lag=0;try{const o=execFileSync('ffmpeg',['-v','error','-i',raw,'-vf','signalstats,metadata=print:key=lavfi.signalstats.VAVG:file=-','-f','null','-'],{encoding:'utf8',maxBuffer:1<<26});let t=null;for(const l of o.split('\n')){const m=l.match(/pts_time:([\d.]+)/);if(m)t=+m[1];const y=l.match(/VAVG=([\d.]+)/);if(y&&+y[1]>200){lag=t-EV.find(e=>e.type==='flashOn').t;break}}}catch(e){console.log('sync measure failed',e.message)}
 const hs=EV.find(e=>e.type==='hookStart').t;CUTS.unshift([0,Math.max(0,hs-0.05)]);
 const keep=[];let s0=0;for(const [x,y] of CUTS){if(x>s0)keep.push([s0,x]);s0=y}keep.push([s0,total]);
 const dur=keep.reduce((t,[x,y])=>t+y-x,0);
 fs.writeFileSync(OUT+'/events.json',JSON.stringify({events:EV.concat(spoken),cuts:CUTS,total,duration:dur,lag}));
 const fc=keep.map(([x,y],i)=>`[0:v]trim=start=${x}:end=${y},setpts=PTS-STARTPTS[v${i}]`).join(';')+';'+keep.map((_,i)=>`[v${i}]`).join('')+`concat=n=${keep.length}:v=1:a=0[v]`;
 execFileSync('ffmpeg',['-v','error','-y','-i',raw,'-filter_complex',fc,'-map','[v]','-c:v','libx264','-pix_fmt','yuv420p','-crf','23','-r','30',OUT+'/silent.mp4']);
 console.log('picture lag (s):',lag.toFixed(3));
 console.log('video ok, duration',dur.toFixed(1),'cuts',JSON.stringify(CUTS),'spoken',spoken.map(x=>x.w).join(','));
})();
