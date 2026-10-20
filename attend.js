/* attend.js v5 */
/* =====================================================================
   🕒 STAFF ATTENDANCE (Check In / Check Out) — A&J Kampot Hub
   - Staff page:  #f/attend  (tablet / phone, PIN once like other forms)
   - Boss page:   tab "🕒 វត្តមាន" inside #boss (monthly report, CSV, print)
   Each tap is saved as one record {type:'attend'} in the same Google Sheet
   as the other hub forms. Times are always Cambodia time (Asia/Phnom_Penh),
   even when the boss looks from another country.
   ===================================================================== */
(function(){
'use strict';
const TZ='Asia/Phnom_Penh';
const LS_NAMES='ajatt_names', LS_LOG='ajatt_log', LS_Q='ajatt_queue', LS_CFG='ajatt_cfg';
/* staff list + shifts: set by the boss once (🕒 វត្តមាន → 👥 បុគ្គលិក & វេន), saved in the Google backend, every tablet loads it */
const DEF_SHIFTS=[{id:'m',name:'វេនព្រឹក',start:'07:00',end:'15:00'},{id:'a',name:'វេនល្ងាច',start:'15:00',end:'23:00'},{id:'n',name:'វេនយប់',start:'23:00',end:'07:00'}];
const SHIFT_ICON={m:'🌅',a:'🌇',n:'🌙'};
let CFG=null;
function cfgNorm(c){ c=c&&typeof c==='object'?c:{}; const sh=Array.isArray(c.shifts)&&c.shifts.length?c.shifts:DEF_SHIFTS;
  return {shifts:sh.map(x=>({id:String(x.id),name:String(x.name||''),start:String(x.start||''),end:String(x.end||'')})),staff:(Array.isArray(c.staff)?c.staff:[]).filter(x=>x&&x.name).map(x=>({name:String(x.name),shift:String(x.shift||'')}))}; }
function cfgGet(){ if(!CFG) CFG=cfgNorm(jget(LS_CFG,null)); return CFG; }
function cfgSet(c){ CFG=cfgNorm(c); jset(LS_CFG,CFG); }
const shiftById=id=>cfgGet().shifts.find(x=>x.id===id)||null;
const staffShift=n=>{ const s=cfgGet().staff.find(x=>x.name===n); return s?shiftById(s.shift):null; };
const shiftLbl=sh=>sh?`${SHIFT_ICON[sh.id]||'🕒'} ${sh.name} ${sh.start}–${sh.end}`:'';
async function cfgLoad(key){ try{ const j=await api('attCfg',{key}); if(j&&j.cfg) cfgSet(j.cfg); return true; }catch(e){ return false; } }
const jget=(k,d)=>{try{const v=JSON.parse(ls.get(k)||'null');return v==null?d:v}catch(e){return d}};
const jset=(k,v)=>ls.set(k,JSON.stringify(v));
const _fmt=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
function pp(d){ const o={}; _fmt.formatToParts(d instanceof Date?d:new Date(d)).forEach(p=>o[p.type]=p.value); const H=o.hour==='24'?'00':o.hour;
  return {date:`${o.year}-${o.month}-${o.day}`,time:`${H}:${o.minute}`,sec:o.second}; }
const ppToday=()=>pp(new Date()).date;
const KH_DAYS=['អាទិត្យ','ច័ន្ទ','អង្គារ','ពុធ','ព្រហស្បតិ៍','សុក្រ','សៅរ៍'];
const dayName=s=>KH_DAYS[new Date(s+'T12:00:00Z').getUTCDay()];
const hm=min=>{min=Math.max(0,Math.round(min||0));return Math.floor(min/60)+'ម៉ោង '+String(min%60).padStart(2,'0')+'នាទី'};
const hmShort=min=>{min=Math.max(0,Math.round(min||0));return Math.floor(min/60)+':'+String(min%60).padStart(2,'0')};
const toMin=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d{2})/);return m?(+m[1])*60+(+m[2]):null};

/* ---------- register the form type in the hub ---------- */
DEFS.attend={icon:'🕒',short:'វត្តមានបុគ្គលិក',title:'Staff Check In / Out',full:'វត្តមានបុគ្គលិក / Staff Check In · Check Out',
  sections:[],sigs:[],onRender:()=>attRender(),
  date:r=>r.date||'',room:()=>'',name:r=>r.staff||'',idn:()=>'',extra:r=>r.act==='in'?'ចូល '+(r.time||''):'ចេញ '+(r.time||'')};
if(!TABLET_TYPES.includes('attend')) TABLET_TYPES.push('attend');
if(!QR_TYPES.includes('attend')) QR_TYPES.splice(QR_TYPES.indexOf('decl'),0,'attend');
/* the boss page may already have drawn the QR cards before this file loaded → draw them again so the 🕒 QR shows */
setTimeout(()=>{ try{ if($('tabletLinks')&&$('tabletLinks').children.length&&!$('qr_attend')) renderTabletLinks(); }catch(e){} },0);

/* ---------- styles ---------- */
const css=document.createElement('style'); css.textContent=`
.att-clock{text-align:center;padding:18px 10px;border-radius:16px;background:#161616;color:#fff;margin:6px 0 14px}
.att-clock .t{font-size:clamp(44px,12vw,72px);font-weight:700;letter-spacing:2px;font-variant-numeric:tabular-nums;line-height:1.05}
.att-clock .d{opacity:.8;margin-top:4px}
.att-names{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.att-n{position:relative;border:2px solid var(--line);background:var(--card);border-radius:14px;padding:16px 10px;text-align:center;cursor:pointer;font:inherit;color:var(--ink);min-height:86px}
.att-n b{display:block;font-size:19px}.att-n small{display:block;color:var(--mute);margin-top:4px;font-size:13px}
.att-n.in{border-color:var(--ok);background:var(--okbg)}.att-n.in small{color:var(--ok);font-weight:600}
.att-n .x{position:absolute;top:4px;right:6px;background:var(--bad);color:#fff;border-radius:50%;width:26px;height:26px;line-height:26px;font-weight:700}
.att-act{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}
.att-act button{font:inherit;border:0;border-radius:16px;padding:22px 8px;font-size:21px;font-weight:700;cursor:pointer;color:#fff}
.att-act .bin{background:#1f7a3a}.att-act .bout{background:#b45309}.att-act button.dim{opacity:.45}
.att-act button small{display:block;font-size:13px;font-weight:400;opacity:.9;margin-top:4px}
.att-sel{text-align:center;font-size:24px;font-weight:700;margin-top:6px}
.att-done{text-align:center;padding:26px 12px;border-radius:16px;margin:10px 0;font-size:22px;font-weight:700}
.att-done.in{background:var(--okbg);color:var(--ok)}.att-done.out{background:var(--warnbg);color:var(--warn)}
.att-log{width:100%;border-collapse:collapse;margin-top:6px}.att-log td{padding:7px 6px;border-bottom:1px solid var(--line)}
.att-who{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.att-chip{padding:7px 12px;border-radius:999px;background:var(--brand2);font-size:14px}.att-chip.in{background:var(--okbg);color:var(--ok);font-weight:600}
td.att-bad{color:var(--bad);font-weight:600}td.att-warn{color:var(--warn);font-weight:600}td.att-ok{color:var(--ok)}
.att-shift{width:92px!important;padding:4px 6px!important}
@media print{.att-noprint{display:none!important}}
`; document.head.appendChild(css);

/* =====================================================================
   STAFF SIDE
   ===================================================================== */
let SEL=null, clockT=null, doneT=null, editNames=false;
const logGet=()=>jget(LS_LOG,[]).filter(x=>x&&x.id);
function logPrune(){ const keep=pp(Date.now()-3*864e5).date; const L=logGet().filter(x=>x.date>=keep||!x.sent); jset(LS_LOG,L); return L; }
function names(){ const C=cfgGet(); if(C.staff.length) return C.staff.map(x=>x.name); const set=new Set(jget(LS_NAMES,[])); logGet().forEach(x=>x.staff&&set.add(x.staff)); return [...set].filter(Boolean).sort((a,b)=>a.localeCompare(b)); }
function lastOf(n){ const L=logGet().filter(x=>x.staff===n).sort((a,b)=>String(a.at).localeCompare(String(b.at))); return L[L.length-1]||null; }
function isIn(n){ const l=lastOf(n); return !!(l&&l.act==='in'&&(Date.now()-new Date(l.at))<18*3600e3); }

function attRender(){
  const host=$('gfBody'); if(!host) return; SEL=null; editNames=false; logPrune();
  host.innerHTML=`<div class="att-clock"><div class="t" id="attT">--:--</div><div class="d" id="attD"></div></div>
  <div id="attMain"></div>
  <h2 style="margin-top:22px">📋 ថ្ងៃនេះ (ថេប្លេតនេះ)</h2><div id="attLog" class="muted"></div>
  <p class="muted" style="font-size:13px">ម៉ោងគិតតាមម៉ោងកម្ពុជា · បើអ៊ីនធឺណិតដាច់ ទិន្នន័យទុកក្នុងថេប្លេត ហើយផ្ញើទៅមេដោយស្វ័យប្រវត្តិពេលមានអ៊ីនធឺណិតវិញ</p>`;
  clearInterval(clockT); const tick=()=>{ if(!$('attT')){clearInterval(clockT);return;} const p=pp(new Date()); $('attT').textContent=p.time+':'+p.sec; $('attD').textContent='ថ្ងៃ'+dayName(p.date)+' · '+fmtD(p.date); };
  tick(); clockT=setInterval(tick,1000);
  drawMain(); drawLog(); attFlush();
  cfgLoad(deviceKey()||bossKey()).then(ok=>{ if(ok&&!SEL&&$('attMain')&&!$('attMain').querySelector('.att-done')) drawMain(); });
}
function drawMain(){
  const box=$('attMain'); if(!box) return; const N=names();
  if(SEL){ const inNow=isIn(SEL), l=lastOf(SEL);
    box.innerHTML=`<div class="att-sel">👤 ${esc(SEL)}</div><div class="muted" style="text-align:center">${l?(l.act==='in'?'ចូលចុងក្រោយ ':'ចេញចុងក្រោយ ')+esc(l.time)+' ('+esc(fmtD(l.date))+')':'មិនទាន់មានកំណត់ត្រា'}</div>
    <div class="att-act"><button class="bin ${inNow?'dim':''}" onclick="attPunch('in')">✅ ចូលធ្វើការ<small>Check In</small></button><button class="bout ${inNow?'':'dim'}" onclick="attPunch('out')">🏁 ចេញពីការងារ<small>Check Out</small></button></div>
    <div class="row" style="justify-content:center"><button class="btn alt" onclick="attBack()">← ត្រលប់ក្រោយ</button></div>`; return; }
  if(!N.length){ box.innerHTML=`<div class="alert warn">មិនទាន់មានឈ្មោះបុគ្គលិកទេ។ មេបញ្ចូលឈ្មោះ និងវេន នៅ <b>ទំព័រមេ → 🕒 វត្តមាន → 👥 បុគ្គលិក &amp; វេន</b> ហើយឈ្មោះនឹងចេញនៅទីនេះដោយខ្លួនឯង។</div>`; return; }
  const btn=n=>{ const i=isIn(n), l=lastOf(n);
    return `<button class="att-n ${i?'in':''}" onclick="attPick(this.dataset.n)" data-n="${esc(n)}"><b>${esc(n)}</b><small>${i?'🟢 កំពុងធ្វើការ · '+esc(l.time):(l&&l.date===ppToday()?'ចេញ '+esc(l.time):'—')}</small></button>`; };
  const C=cfgGet(); let html='';
  if(C.staff.length){ const groups=C.shifts.map(sh=>[shiftLbl(sh),N.filter(n=>{const x=staffShift(n);return x&&x.id===sh.id})]); groups.push(['ផ្សេងៗ',N.filter(n=>!staffShift(n))]);
    html=groups.filter(g=>g[1].length).map(g=>`<h3 style="margin:14px 0 8px">${esc(g[0])}</h3><div class="att-names">${g[1].map(btn).join('')}</div>`).join(''); }
  else html=`<div class="att-names">${N.map(btn).join('')}</div>`;
  box.innerHTML=`<div style="text-align:center;font-weight:600;margin-bottom:4px">👇 ចុចលើឈ្មោះរបស់អ្នក</div>`+html;
}
function drawLog(){
  const el=$('attLog'); if(!el) return; const t=ppToday(); const L=logGet().filter(x=>x.date===t).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  el.innerHTML=L.length?`<table class="att-log">`+L.map(x=>`<tr><td><b>${esc(x.time)}</b></td><td>${esc(x.staff)}</td><td>${x.act==='in'?'✅ ចូល':'🏁 ចេញ'}</td><td style="text-align:right">${x.sent?'☁️ ផ្ញើរួច':'⏳ រង់ចាំផ្ញើ'}</td></tr>`).join('')+`</table>`:'មិនទាន់មានទេ';
}
window.attPick=n=>{ if(editNames){ if(confirm('លុបឈ្មោះ "'+n+'" ចេញពីថេប្លេតនេះ?\n(កំណត់ត្រាចាស់នៅដដែលនៅមេ)')){ jset(LS_NAMES,jget(LS_NAMES,[]).filter(x=>x!==n)); jset(LS_LOG,logGet().filter(x=>x.staff!==n||!x.sent)); } drawMain(); return; }
  SEL=n; clearTimeout(doneT); drawMain(); window.scrollTo(0,0); };
window.attBack=()=>{ SEL=null; drawMain(); };
window.attAddName=()=>{ const v=(prompt('ឈ្មោះបុគ្គលិក (ឧ. ម៉ើត)')||'').trim().replace(/\s+/g,' ').slice(0,40); if(!v) return; const A=jget(LS_NAMES,[]); if(!A.includes(v)) A.push(v); jset(LS_NAMES,A); editNames=false; drawMain(); };
window.attToggleEdit=()=>{ editNames=!editNames; SEL=null; drawMain(); };
window.attPunch=async act=>{
  const n=SEL; if(!n) return; const l=lastOf(n);
  if(l&&l.act===act&&(Date.now()-new Date(l.at))<12*3600e3){ if(!confirm(`${n} បាន${act==='in'?'ចូល':'ចេញ'}រួចហើយ ម៉ោង ${l.time}។\nចង់កត់${act==='in'?'ចូល':'ចេញ'}ម្ដងទៀតមែនទេ?`)) return; }
  const now=new Date(), p=pp(now); const id=device()+'-'+now.getTime().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  const sh=staffShift(n); const rec={type:'attend',staff:n,act,at:now.toISOString(),date:p.date,time:p.time,ci:p.date,device:device(),ciAt:now.toISOString(),...(sh?{shift:sh.name,shiftStart:sh.start,shiftEnd:sh.end}:{})};
  const L=logGet(); L.push({id,staff:n,act,at:rec.at,date:p.date,time:p.time,sent:false}); jset(LS_LOG,L);
  const Q=jget(LS_Q,{}); Q[id]=rec; jset(LS_Q,Q);
  SEL=null; const box=$('attMain');
  box.innerHTML=`<div class="att-done ${act}">${act==='in'?'✅':'🏁'} ${esc(n)}<br>${act==='in'?'ចូលធ្វើការ':'ចេញពីការងារ'} ម៉ោង ${esc(p.time)}<div style="font-size:15px;font-weight:400;margin-top:8px">${act==='in'?'សូមឲ្យធ្វើការបានល្អ!':'អរគុណ! សម្រាកឲ្យបានល្អ'}</div></div>`;
  drawLog(); clearTimeout(doneT); doneT=setTimeout(()=>{ if(!SEL) drawMain(); },3500);
  attFlush();
};
let flushing=false;
async function attFlush(){
  if(flushing||!navigator.onLine) return; flushing=true;
  try{ const Q=jget(LS_Q,{});
    for(const [id,rec] of Object.entries(Q)){
      try{ const j=await api('submit',{type:'attend',data:rec,key:deviceKey()||bossKey()});
        if(j&&j.pdfToken) api('savePdf',{id:j.id,token:j.pdfToken,type:'attend',pdf:''}).catch(()=>{}); // attendance needs no PDF: use up the one-time ticket so it is not kept
        const q=jget(LS_Q,{}); delete q[id]; jset(LS_Q,q); jset(LS_LOG,logGet().map(x=>x.id===id?{...x,sent:true}:x)); drawLog();
      }catch(e){ if(/WRONG_PIN|NO_STAFF_PIN/.test(e.message)&&$('attLog')){ $('attLog').insertAdjacentHTML('afterbegin','<div class="alert bad">PIN បុគ្គលិកត្រូវបានប្ដូរ — សូមចុច 🔒 ហើយបញ្ចូល PIN ថ្មី។ ទិន្នន័យនៅក្នុងថេប្លេតនេះ មិនបាត់ទេ។</div>'); } break; }
    }
  } finally{ flushing=false; }
}
window.addEventListener('online',attFlush); setInterval(attFlush,60000);

/* =====================================================================
   BOSS SIDE — tab 🕒 វត្តមាន
   ===================================================================== */
let ATT=[], attM='', attS='';
function injectBoss(){
  if($('t-attend')||!$('tabs')) return;
  const pb=document.querySelector('#tabs button[data-t="payroll"]'); const b=document.createElement('button'); b.dataset.t='attend'; b.textContent='🕒 វត្តមាន';
  pb?pb.after(b):$('tabs').appendChild(b);
  const sec=document.createElement('section'); sec.id='t-attend'; sec.className='hide';
  sec.innerHTML=`<div class="row att-noprint" style="flex-wrap:wrap">
      <select id="attM" onchange="attBoss()" style="width:auto"></select>
      <select id="attS" onchange="attBoss()" style="width:auto"><option value="">បុគ្គលិកទាំងអស់</option></select>
      <button class="btn sm" onclick="attCsv()">⬇️ CSV (Google Sheets)</button>
      <button class="btn alt sm" onclick="attPrint()">🖨 បោះពុម្ព / PDF</button>
      <button class="btn alt sm" onclick="attEdit(-1)">➕ បញ្ចូលដោយដៃ</button>
      <a class="btn alt sm" href="#f/attend" target="_blank" rel="noopener" style="text-decoration:none">🕒 បើកទំព័របុគ្គលិក</a></div>
    <details id="attCfgBox" class="card att-noprint" style="margin:12px 0"><summary style="cursor:pointer;font-weight:700;font-size:17px">👥 បុគ្គលិក &amp; វេន <span class="muted" id="attCfgSum" style="font-weight:400;font-size:14px"></span></summary><div id="attCfgBody" style="margin-top:10px"></div></details>
    <div id="attPrintArea">
      <h2 style="margin-top:6px">🟢 ថ្ងៃនេះ <span class="muted" id="attTodayD" style="font-size:14px;font-weight:400"></span></h2><div id="attWho" class="att-who"></div>
      <h2 id="attSumH">📊 សង្ខេបប្រចាំខែ</h2><div class="tw"><table id="attSum"></table></div>
      <p class="muted att-noprint" style="font-size:13px">មកយឺត = ចូលក្រោយម៉ោងចាប់ផ្ដើមវេន លើសពី ១០ នាទី · ចេញមុន = ចេញមុនម៉ោងបញ្ចប់វេន លើសពី ១០ នាទី</p>
      <h2>📅 លម្អិតប្រចាំថ្ងៃ</h2><div class="tw"><table id="attDays"></table></div>
    </div>`;
  const main=document.querySelector('#bossApp main'); const pay=$('t-payroll'); pay?pay.after(sec):main.appendChild(sec);
  drawCfg(); cfgLoad(bossKey()).then(ok=>{ if(ok){ EDIT=null; drawCfg(); attBoss(); } });
}
/* ---------- 👥 staff & shifts editor (boss) ---------- */
let EDIT=null;
function drawCfg(){
  const body=$('attCfgBody'); if(!body) return; if(!EDIT) EDIT=JSON.parse(JSON.stringify(cfgGet()));
  const E=EDIT; $('attCfgSum').textContent=`· ${E.staff.length} នាក់ · ${E.shifts.length} វេន`;
  if(!E.staff.length) $('attCfgBox').open=true;
  const opt=cur=>E.shifts.map(sh=>`<option value="${esc(sh.id)}" ${sh.id===cur?'selected':''}>${esc((SHIFT_ICON[sh.id]||'')+' '+sh.name+' '+sh.start+'–'+sh.end)}</option>`).join('')+`<option value="" ${!cur?'selected':''}>— គ្មានវេន —</option>`;
  body.innerHTML=`<p class="muted" style="margin-top:0">① វាយឈ្មោះ → ជ្រើសវេន → ចុច ➕ បន្ថែម ② ធ្វើម្ដងទៀតសម្រាប់បុគ្គលិកម្នាក់ៗ ③ ចុច <b>💾 រក្សាទុក</b>។ ថេប្លេតទាំងអស់នឹងទាញឈ្មោះ និងវេនដោយខ្លួនឯង។</p>
    <div class="row" style="flex-wrap:wrap;gap:8px"><input id="attNewN" placeholder="ឈ្មោះបុគ្គលិក (ឧ. ម៉ើត)" style="flex:1;min-width:160px" onkeydown="if(event.key==='Enter')attCfgAdd()"><select id="attNewS" style="width:auto">${opt(E.shifts[0]&&E.shifts[0].id)}</select><button class="btn" onclick="attCfgAdd()">➕ បន្ថែម</button></div>
    <div class="tw" style="margin-top:10px"><table><tr><th>#</th><th>ឈ្មោះ</th><th>វេន</th><th></th></tr>${E.staff.length?E.staff.map((x,i)=>`<tr><td>${i+1}</td><td><input value="${esc(x.name)}" onchange="attCfgName(${i},this.value)" style="min-width:120px"></td><td><select onchange="attCfgShift(${i},this.value)" style="width:auto">${opt(x.shift)}</select></td><td><button class="btn alt sm" onclick="attCfgDel(${i})">🗑 លុប</button></td></tr>`).join(''):'<tr><td colspan="4" class="muted">មិនទាន់មានបុគ្គលិក — វាយឈ្មោះខាងលើ</td></tr>'}</table></div>
    <h3 style="margin:16px 0 6px">🕒 ម៉ោងវេន</h3>
    <div class="tw"><table><tr><th>វេន</th><th>ចាប់ផ្ដើម</th><th>បញ្ចប់</th></tr>${E.shifts.map((sh,i)=>`<tr><td><input value="${esc(sh.name)}" onchange="attCfgSh(${i},'name',this.value)" style="min-width:110px"></td><td><input type="time" value="${esc(sh.start)}" onchange="attCfgSh(${i},'start',this.value)"></td><td><input type="time" value="${esc(sh.end)}" onchange="attCfgSh(${i},'end',this.value)"></td></tr>`).join('')}</table></div>
    <div class="row" style="margin-top:12px;align-items:center;flex-wrap:wrap"><button class="btn big" id="attCfgSave" onclick="attCfgSave()">💾 រក្សាទុក</button><span id="attCfgMsg" class="muted"></span></div>`;
}
const dirty=()=>{ const m=$('attCfgMsg'); if(m){ m.textContent='⚠️ មិនទាន់រក្សាទុក — ចុច 💾 រក្សាទុក'; m.style.color='var(--bad)'; } };
window.attCfgAdd=()=>{ const n=($('attNewN').value||'').trim().replace(/\s+/g,' ').slice(0,40); if(!n) return $('attNewN').focus();
  if(EDIT.staff.some(x=>x.name===n)) return alert('មានឈ្មោះនេះរួចហើយ');
  EDIT.staff.push({name:n,shift:$('attNewS').value}); const keep=$('attNewS').value; drawCfg(); $('attNewS').value=keep; dirty(); $('attNewN').focus(); };
window.attCfgName=(i,v)=>{ v=String(v||'').trim().slice(0,40); if(v) EDIT.staff[i].name=v; drawCfg(); dirty(); };
window.attCfgShift=(i,v)=>{ EDIT.staff[i].shift=v; dirty(); };
window.attCfgDel=i=>{ if(!confirm('លុប "'+EDIT.staff[i].name+'" ចេញពីបញ្ជី?\n(កំណត់ត្រាវត្តមានចាស់ៗ នៅដដែល)')) return; EDIT.staff.splice(i,1); drawCfg(); dirty(); };
window.attCfgSh=(i,k,v)=>{ EDIT.shifts[i][k]=String(v||''); drawCfg(); dirty(); };
window.attCfgSave=async()=>{ const b=$('attCfgSave'); b.disabled=true; b.textContent='⏳ កំពុងរក្សាទុក…';
  try{ await api('setAttCfg',{key:bossKey(),cfg:EDIT}); cfgSet(EDIT); EDIT=null; drawCfg(); attBoss(); const m=$('attCfgMsg'); m.textContent='✅ រក្សាទុករួច — ថេប្លេតនឹងឃើញឈ្មោះថ្មីពេលបើកទំព័រ 🕒'; m.style.color='var(--ok)'; }
  catch(e){ alert(/Unknown action/.test(e.message)?'ម៉ាស៊ីនមេ (Apps Script) មិនទាន់ Deploy កំណែថ្មី':'រក្សាទុកមិនបាន៖ '+e.message); }
  finally{ const bb=$('attCfgSave'); if(bb){ bb.disabled=false; bb.textContent='💾 រក្សាទុក'; } } };
function pairUp(list){ // list of punches of ONE staff → shifts
  const P=[...list].sort((a,b)=>String(a.at).localeCompare(String(b.at))); const out=[]; let open=null;
  for(const r of P){
    if(r.act==='in'){ if(open) out.push({...open,miss:'out'}); open={staff:r.staff,date:r.date,inT:r.time,inAt:r.at,inId:r._id,dev:r.device,shift:r.shift,sStart:r.shiftStart,sEnd:r.shiftEnd}; }
    else { if(open&&(new Date(r.at)-new Date(open.inAt))<20*3600e3){ out.push({...open,outT:r.time,outAt:r.at,outDate:r.date,outId:r._id,min:(new Date(r.at)-new Date(open.inAt))/6e4}); open=null; }
      else { if(open){ out.push({...open,miss:'out'}); open=null; } out.push({staff:r.staff,date:r.date,outT:r.time,outAt:r.at,outId:r._id,miss:'in',dev:r.device,shift:r.shift,sStart:r.shiftStart,sEnd:r.shiftEnd}); } }
  }
  if(open){ const stillOn=(Date.now()-new Date(open.inAt))<20*3600e3; out.push({...open,miss:stillOn?'working':'out'}); }
  return out;
}
function shifts(){ const by={}; ATT.forEach(r=>{(by[r.staff]=by[r.staff]||[]).push(r)}); return Object.values(by).flatMap(pairUp).sort((a,b)=>(b.date+(b.inT||b.outT)).localeCompare(a.date+(a.inT||a.outT))); }
const wrapDiff=(t,ref)=>{ const a=toMin(t), b=toMin(ref); if(a==null||b==null) return null; return ((a-b+1440+720)%1440)-720; }; // minutes, works across midnight
function shiftFor(s){ if(s.sStart) return {name:s.shift,start:s.sStart,end:s.sEnd}; const x=staffShift(s.staff); return x; }
function lateMin(s){ const sh=shiftFor(s); if(!sh||!s.inT) return 0; const d=wrapDiff(s.inT,sh.start); return d!=null&&d>10&&d<6*60?d:0; }
function earlyMin(s){ const sh=shiftFor(s); if(!sh||!s.outT||!s.inT) return 0; const d=wrapDiff(s.outT,sh.end); return d!=null&&d< -10&&d>-6*60?-d:0; }
window.attBoss=function(){
  if(!$('t-attend')) return;
  const months=[...new Set([ppToday().slice(0,7),...ATT.map(r=>String(r.date||'').slice(0,7))])].filter(Boolean).sort().reverse();
  const mSel=$('attM'); const cur=mSel.value||attM||months[0]; mSel.innerHTML=months.map(m=>`<option value="${m}">${esc(fmtD(m))}</option>`).join(''); mSel.value=cur; attM=cur;
  const cfgNames=cfgGet().staff.map(x=>x.name); const staffAll=[...new Set([...cfgNames,...ATT.map(r=>r.staff)])];
  const sSel=$('attS'); const cs=sSel.value; sSel.innerHTML='<option value="">បុគ្គលិកទាំងអស់</option>'+staffAll.map(n=>`<option>${esc(n)}</option>`).join(''); sSel.value=staffAll.includes(cs)?cs:''; attS=sSel.value;
  const SH=shifts();
  /* today */
  const t=ppToday(); $('attTodayD').textContent='ថ្ងៃ'+dayName(t)+' '+fmtD(t);
  const tod=SH.filter(s=>s.date===t||s.outDate===t||s.miss==='working');
  const chips=staffAll.map(n=>{ const s=tod.filter(x=>x.staff===n); if(!s.length) return `<span class="att-chip">⚪ ${esc(n)} — មិនទាន់មក</span>`;
    const w=s.find(x=>x.miss==='working'); if(w) return `<span class="att-chip in">🟢 ${esc(n)} — កំពុងធ្វើការ តាំងពី ${esc(w.inT)}</span>`;
    const l=s[0]; return `<span class="att-chip">🏁 ${esc(n)} — ${l.inT?esc(l.inT):'?'} → ${l.outT?esc(l.outT):'?'}</span>`; });
  $('attWho').innerHTML=chips.join('')||'<span class="muted">មិនទាន់មានកំណត់ត្រា។ ឲ្យបុគ្គលិកបើកលីង 🕒 (ផ្ទាំង លីងថេប្លេត) ហើយចុចឈ្មោះខ្លួនឯង។</span>';
  /* month */
  const MS=SH.filter(s=>String(s.date).startsWith(attM)&&(!attS||s.staff===attS));
  const sum={}; staffAll.filter(n=>!attS||n===attS).forEach(n=>sum[n]={days:new Set(),min:0,late:0,lateMin:0,early:0,miss:0});
  MS.forEach(s=>{ const o=sum[s.staff]; if(!o) return; o.days.add(s.date); o.min+=s.min||0; const lm=lateMin(s); if(lm){o.late++;o.lateMin+=lm;} if(earlyMin(s)) o.early++; if(s.miss==='out'||s.miss==='in') o.miss++; });
  $('attSumH').textContent='📊 សង្ខេបខែ '+fmtD(attM);
  $('attSum').innerHTML=`<tr><th>បុគ្គលិក</th><th>ថ្ងៃធ្វើការ</th><th>ម៉ោងសរុប</th><th>មធ្យម/ថ្ងៃ</th><th>មកយឺត</th><th>ចេញមុន</th><th>ភ្លេចចុច</th><th>វេន</th></tr>`+
    (Object.keys(sum).length?Object.entries(sum).map(([n,o])=>`<tr><td><b>${esc(n)}</b></td><td>${o.days.size}</td><td>${hm(o.min)}</td><td>${o.days.size?hmShort(o.min/o.days.size):'—'}</td><td class="${o.late?'att-warn':''}">${o.late?o.late+' ដង ('+o.lateMin+' នាទី)':'—'}</td><td class="${o.early?'att-warn':''}">${o.early?o.early+' ដង':'—'}</td><td class="${o.miss?'att-bad':''}">${o.miss?o.miss+' ដង':'—'}</td><td class="muted">${esc(shiftLbl(staffShift(n))||'—')}</td></tr>`).join(''):'<tr><td colspan="8" class="muted">គ្មានទិន្នន័យខែនេះ</td></tr>');
  ROWS=[]; $('attDays').innerHTML=`<tr><th>ថ្ងៃ</th><th>បុគ្គលិក</th><th>ចូល</th><th>ចេញ</th><th>វេន</th><th>ម៉ោងធ្វើការ</th><th>ស្ថានភាព</th><th class="att-noprint"></th></tr>`+
    (MS.length?MS.map(s=>{ const lm=lateMin(s), em=earlyMin(s); const sh=shiftFor(s);
      const warn=[lm?`⏰ យឺត ${lm} នាទី`:'',em?`↩️ ចេញមុន ${em} នាទី`:''].filter(Boolean).join(' · ');
      const st=s.miss==='working'?`<td class="att-ok">🟢 កំពុងធ្វើការ${lm?' · ⏰ យឺត '+lm+' នាទី':''}</td>`:s.miss==='out'?'<td class="att-bad">⚠️ ភ្លេច Check Out</td>':s.miss==='in'?'<td class="att-bad">⚠️ គ្មាន Check In</td>':warn?`<td class="att-warn">${warn}</td>`:'<td class="att-ok">✅ ត្រឹមត្រូវ</td>';
      const ri=ROWS.push(s)-1;
      return `<tr><td>${esc(dayName(s.date))} ${esc(fmtD(s.date))}</td><td><b>${esc(s.staff)}</b></td><td>${esc(s.inT||'—')}</td><td>${esc(s.outT||'—')}${s.outDate&&s.outDate!==s.date?' <small class="muted">(ថ្ងៃបន្ទាប់)</small>':''}</td><td class="muted">${sh?esc(sh.name||''):'—'}</td><td>${s.min?hm(s.min):'—'}</td>${st}<td class="att-noprint"><button class="btn sm" onclick="attEdit(${ri})">✏️ កែ</button></td></tr>`; }).join(''):'<tr><td colspan="8" class="muted">គ្មានទិន្នន័យ</td></tr>');
};
window.attDel=async id=>{ const r=ATT.find(x=>String(x._id)===String(id)); if(!r) return;
  if(!confirm(`🗑 លុបការចុចនេះ?\n${r.staff} · ${r.act==='in'?'ចូល':'ចេញ'} ${r.time} · ${fmtD(r.date)}\n(ទៅក្នុងធុងសំរាម — អាចយកមកវិញបាន)`)) return;
  try{ await api('delete',{key:bossKey(),id:String(id)}); }catch(e){ return alert('លុបមិនបាន៖ '+e.message); }
  ATT=ATT.filter(x=>String(x._id)!==String(id)); attBoss(); };
/* ---------- ✏️ edit one shift (fix forgotten / wrong check in or out) ---------- */
let ROWS=[];
const ppAt=(date,t)=>new Date(date+'T'+t+':00+07:00').toISOString();
window.attEdit=i=>{
  const s=i>=0?ROWS[i]:null; window._attEditRow=s;
  const names=[...new Set([...cfgGet().staff.map(x=>x.name),...ATT.map(r=>r.staff)])];
  $('dT').textContent=s?'✏️ កែម៉ោង — '+s.staff:'➕ បញ្ចូលម៉ោងដោយដៃ'; try{setDocBtns(null)}catch(e){}
  $('dB').innerHTML=`<div style="display:grid;gap:12px;max-width:420px">
    <label>បុគ្គលិក<br>${s?`<b style="font-size:18px">${esc(s.staff)}</b>`:`<select id="ae_n">${names.map(n=>`<option ${n===attS?'selected':''}>${esc(n)}</option>`).join('')}</select>`}</label>
    <label>ថ្ងៃចូលធ្វើការ<br><input type="date" id="ae_d" value="${esc(s?s.date:ppToday())}"></label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <label>✅ ម៉ោងចូល<br><input type="time" id="ae_in" value="${esc(s&&s.inT||'')}"></label>
      <label>🏁 ម៉ោងចេញ<br><input type="time" id="ae_out" value="${esc(s&&s.outT||'')}"></label></div>
    <p class="muted" style="margin:0;font-size:13px">ម៉ោងកម្ពុជា · បើម៉ោងចេញតិចជាងម៉ោងចូល (វេនយប់) ប្រព័ន្ធគិតជាថ្ងៃបន្ទាប់ដោយខ្លួនឯង · ទុកចន្លោះទទេ = មិនមាន</p>
    <div class="row" style="flex-wrap:wrap;gap:8px"><button class="btn big" id="ae_save" onclick="attEditSave()">💾 រក្សាទុក</button>${s?`<button class="btn alt" onclick="attEditDel()">🗑 លុបវេននេះ</button>`:''}<button class="btn alt" onclick="closeDlg()">បោះបង់</button></div>
    <div id="ae_msg" class="muted"></div></div>`;
  $('dlg').showModal();
};
async function attSubmit(rec){ const j=await api('submit',{type:'attend',data:rec,key:bossKey()}); if(j&&j.pdfToken) api('savePdf',{id:j.id,token:j.pdfToken,type:'attend',pdf:''}).catch(()=>{}); ATT.push({...rec,_id:j.id}); }
async function attRemove(id){ if(!id) return; await api('delete',{key:bossKey(),id:String(id)}); ATT=ATT.filter(x=>String(x._id)!==String(id)); }
window.attEditSave=async()=>{
  const s=window._attEditRow; const n=s?s.staff:($('ae_n')&&$('ae_n').value); if(!n) return alert('សូមជ្រើសបុគ្គលិក (បញ្ចូលឈ្មោះនៅ 👥 បុគ្គលិក & វេន ជាមុនសិន)');
  const d=$('ae_d').value, tin=$('ae_in').value, tout=$('ae_out').value;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) return alert('សូមដាក់ថ្ងៃ');
  if(!tin&&!tout) return alert('សូមដាក់ម៉ោងចូល ឬម៉ោងចេញ');
  const outDate=(tin&&tout&&tout<tin)?addDays(d,1):d;
  const sh=staffShift(n); const base={type:'attend',staff:n,device:'មេ (កែ/បញ្ចូលដោយដៃ)',manual:true,ciAt:new Date().toISOString(),...(sh?{shift:sh.name,shiftStart:sh.start,shiftEnd:sh.end}:{})};
  const btn=$('ae_save'); btn.disabled=true; btn.textContent='⏳ កំពុងរក្សាទុក…';
  try{
    const inChanged=!s||tin!==(s.inT||'')||(s.inT&&d!==s.date), outChanged=!s||tout!==(s.outT||'')||(s.outT&&outDate!==(s.outDate||s.date));
    if(inChanged){ if(tin) await attSubmit({...base,act:'in',at:ppAt(d,tin),date:d,time:tin,ci:d}); if(s&&s.inId) await attRemove(s.inId); }
    if(outChanged){ if(tout) await attSubmit({...base,act:'out',at:ppAt(outDate,tout),date:outDate,time:tout,ci:outDate}); if(s&&s.outId) await attRemove(s.outId); }
    closeDlg(); attBoss();
  }catch(e){ alert('រក្សាទុកមិនបាន៖ '+e.message); btn.disabled=false; btn.textContent='💾 រក្សាទុក'; }
};
window.attEditDel=async()=>{ const s=window._attEditRow; if(!s) return;
  if(!confirm(`🗑 លុបវេននេះ?\n${s.staff} · ${fmtD(s.date)} · ${s.inT||'—'} → ${s.outT||'—'}\n(ទៅក្នុងធុងសំរាម — អាចយកមកវិញបាន)`)) return;
  try{ await attRemove(s.inId); await attRemove(s.outId); closeDlg(); attBoss(); }catch(e){ alert('លុបមិនបាន៖ '+e.message); } };
window.attCsv=()=>{
  const MS=shifts().filter(s=>String(s.date).startsWith(attM)&&(!attS||s.staff===attS)).reverse();
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const rows=[['Date','Day','Staff','Shift','Check In','Check Out','Hours','Minutes','Status','Late (min)','Left early (min)']].concat(MS.map(s=>[s.date,dayName(s.date),s.staff,(shiftFor(s)||{}).name||'',s.inT||'',s.outT||'',s.min?hmShort(s.min):'',Math.round(s.min||0),
    s.miss==='working'?'Working':s.miss==='out'?'Missing check-out':s.miss==='in'?'Missing check-in':'OK',lateMin(s)||'',earlyMin(s)||'']));
  const blob=new Blob(['﻿'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`AJ-Attendance-${attM}${attS?'-'+attS:''}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500); };
window.attPrint=()=>{
  const w=window.open('','_blank'); if(!w) return alert('សូមអនុញ្ញាត pop-up');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>A&J Attendance ${esc(attM)}</title><style>body{font-family:'Kantumruy Pro',system-ui,sans-serif;padding:18px;color:#111}table{width:100%;border-collapse:collapse;margin:8px 0 18px;font-size:13px}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#eee}.att-noprint{display:none}h2{font-size:17px}.muted{color:#666}.att-who{display:flex;flex-wrap:wrap;gap:6px}.att-chip{border:1px solid #ccc;border-radius:12px;padding:3px 8px;font-size:12px}</style></head><body>`+
    docHead('របាយការណ៍វត្តមានបុគ្គលិក / Staff Attendance — '+fmtD(attM)+(attS?' · '+attS:''))+$('attPrintArea').innerHTML+`<script>setTimeout(()=>print(),400)<\/script></body></html>`); w.document.close(); };

/* keep attendance records out of "ហ្វមទាំងអស់" / Today lists; give them their own tab */
const _renderAll=window.renderAll;
window.renderAll=renderAll=function(){
  if(Array.isArray(S.forms)&&S.forms.some(r=>r.type==='attend')){ const seen=new Set(); // same tap sent twice (slow internet) → keep one
    ATT=S.forms.filter(r=>r.type==='attend'&&r.staff&&r.at).filter(r=>{ const k=r.staff+'|'+r.act+'|'+r.at; if(seen.has(k)) return false; seen.add(k); return true; });
    S.forms=S.forms.filter(r=>r.type!=='attend'); }
  _renderAll.apply(this,arguments); injectBoss(); attBoss();
};
const _launch=window.renderLauncher;
window.renderLauncher=renderLauncher=function(){ _launch.apply(this,arguments); const L=$('launcher'); if(!L||L.querySelector('[data-att]')) return;
  const t=ppToday(); const inNow=new Set(); shifts().forEach(s=>{ if(s.miss==='working') inNow.add(s.staff); });
  const d=document.createElement('button'); d.setAttribute('data-att','1'); d.className='tile'; d.onclick=()=>showTab('attend');
  d.innerHTML=`<span class="ti">🕒</span><b>វត្តមានបុគ្គលិក</b><span class="ts">${inNow.size} នាក់កំពុងធ្វើការ</span>`;
  const pay=[...L.children].find(x=>/ប្រាក់ខែ/.test(x.textContent)); pay?pay.before(d):L.appendChild(d); };

/* home page link + open straight away if the page was loaded on #f/attend */
function homeLink(){ const h=$('homeList'); if(h&&!h.querySelector('[href="#f/attend"]')) h.insertAdjacentHTML('afterbegin',`<a href="#f/attend"><div class="card"><h3>🕒 Check In / Check Out បុគ្គលិក</h3><div class="muted">បុគ្គលិកចុចឈ្មោះខ្លួនឯង ពេលមកដល់ និងពេលចេញ</div></div></a>`); }
window.addEventListener('hashchange',homeLink);
if(location.hash==='#f/attend') route(); else homeLink();
if($('bossApp')&&!$('bossApp').classList.contains('hide')){ injectBoss(); attBoss(); }
})();
