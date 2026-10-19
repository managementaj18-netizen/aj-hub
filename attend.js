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
const LS_NAMES='ajatt_names', LS_LOG='ajatt_log', LS_Q='ajatt_queue', LS_SHIFT='ajatt_shift';
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
function names(){ const set=new Set(jget(LS_NAMES,[])); logGet().forEach(x=>x.staff&&set.add(x.staff)); return [...set].filter(Boolean).sort((a,b)=>a.localeCompare(b)); }
function lastOf(n){ const L=logGet().filter(x=>x.staff===n).sort((a,b)=>String(a.at).localeCompare(String(b.at))); return L[L.length-1]||null; }
function isIn(n){ const l=lastOf(n); return !!(l&&l.act==='in'&&(Date.now()-new Date(l.at))<18*3600e3); }

function attRender(){
  const host=$('gfBody'); if(!host) return; SEL=null; editNames=false; logPrune();
  host.innerHTML=`<div class="att-clock"><div class="t" id="attT">--:--</div><div class="d" id="attD"></div></div>
  <div id="attMain"></div>
  <h2 style="margin-top:22px">📋 ថ្ងៃនេះ (ថេប្លេតនេះ)</h2><div id="attLog" class="muted"></div>
  <div class="row att-noprint" style="margin-top:14px;flex-wrap:wrap"><button class="btn alt sm" onclick="attAddName()">➕ បន្ថែមឈ្មោះបុគ្គលិក</button><button class="btn alt sm" onclick="attToggleEdit()">✏️ កែ / លុបឈ្មោះ</button></div>
  <p class="muted" style="font-size:13px">ម៉ោងគិតតាមម៉ោងកម្ពុជា · បើអ៊ីនធឺណិតដាច់ ទិន្នន័យទុកក្នុងថេប្លេត ហើយផ្ញើទៅមេដោយស្វ័យប្រវត្តិពេលមានអ៊ីនធឺណិតវិញ</p>`;
  clearInterval(clockT); const tick=()=>{ if(!$('attT')){clearInterval(clockT);return;} const p=pp(new Date()); $('attT').textContent=p.time+':'+p.sec; $('attD').textContent='ថ្ងៃ'+dayName(p.date)+' · '+fmtD(p.date); };
  tick(); clockT=setInterval(tick,1000);
  drawMain(); drawLog(); attFlush();
}
function drawMain(){
  const box=$('attMain'); if(!box) return; const N=names();
  if(SEL){ const inNow=isIn(SEL), l=lastOf(SEL);
    box.innerHTML=`<div class="att-sel">👤 ${esc(SEL)}</div><div class="muted" style="text-align:center">${l?(l.act==='in'?'ចូលចុងក្រោយ ':'ចេញចុងក្រោយ ')+esc(l.time)+' ('+esc(fmtD(l.date))+')':'មិនទាន់មានកំណត់ត្រា'}</div>
    <div class="att-act"><button class="bin ${inNow?'dim':''}" onclick="attPunch('in')">✅ ចូលធ្វើការ<small>Check In</small></button><button class="bout ${inNow?'':'dim'}" onclick="attPunch('out')">🏁 ចេញពីការងារ<small>Check Out</small></button></div>
    <div class="row" style="justify-content:center"><button class="btn alt" onclick="attBack()">← ត្រលប់ក្រោយ</button></div>`; return; }
  if(!N.length){ box.innerHTML=`<div class="alert warn">មិនទាន់មានឈ្មោះបុគ្គលិកនៅលើថេប្លេតនេះទេ។ ចុច <b>➕ បន្ថែមឈ្មោះបុគ្គលិក</b> ខាងក្រោម (ធ្វើតែម្ដងគត់)។</div>`; return; }
  box.innerHTML=`<div style="text-align:center;font-weight:600;margin-bottom:10px">👇 ចុចលើឈ្មោះរបស់អ្នក</div><div class="att-names">`+N.map(n=>{ const i=isIn(n), l=lastOf(n);
    return `<button class="att-n ${i?'in':''}" onclick="attPick(this.dataset.n)" data-n="${esc(n)}">${editNames?'<span class="x">×</span>':''}<b>${esc(n)}</b><small>${i?'🟢 កំពុងធ្វើការ · '+esc(l.time):(l&&l.date===ppToday()?'ចេញ '+esc(l.time):'—')}</small></button>`; }).join('')+`</div>`;
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
  const rec={type:'attend',staff:n,act,at:now.toISOString(),date:p.date,time:p.time,ci:p.date,device:device(),ciAt:now.toISOString()};
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
      <button class="btn alt sm" onclick="attManual()">➕ បញ្ចូលដោយដៃ</button>
      <a class="btn alt sm" href="#f/attend" target="_blank" rel="noopener" style="text-decoration:none">🕒 បើកទំព័របុគ្គលិក</a></div>
    <div id="attPrintArea">
      <h2 style="margin-top:6px">🟢 ថ្ងៃនេះ <span class="muted" id="attTodayD" style="font-size:14px;font-weight:400"></span></h2><div id="attWho" class="att-who"></div>
      <h2 id="attSumH">📊 សង្ខេបប្រចាំខែ</h2><div class="tw"><table id="attSum"></table></div>
      <p class="muted att-noprint" style="font-size:13px">«ម៉ោងចូល» = ម៉ោងដែលបុគ្គលិកត្រូវមកដល់ (ដាក់ម្ដងគត់ — ប្រើដើម្បីរាប់ការមកយឺត លើសពី ១០ នាទី)។ ទុកចន្លោះទទេ បើមិនចង់រាប់។</p>
      <h2>📅 លម្អិតប្រចាំថ្ងៃ</h2><div class="tw"><table id="attDays"></table></div>
    </div>`;
  const main=document.querySelector('#bossApp main'); const pay=$('t-payroll'); pay?pay.after(sec):main.appendChild(sec);
}
function pairUp(list){ // list of punches of ONE staff → shifts
  const P=[...list].sort((a,b)=>String(a.at).localeCompare(String(b.at))); const out=[]; let open=null;
  for(const r of P){
    if(r.act==='in'){ if(open) out.push({...open,miss:'out'}); open={staff:r.staff,date:r.date,inT:r.time,inAt:r.at,inId:r._id,dev:r.device}; }
    else { if(open&&(new Date(r.at)-new Date(open.inAt))<20*3600e3){ out.push({...open,outT:r.time,outAt:r.at,outDate:r.date,outId:r._id,min:(new Date(r.at)-new Date(open.inAt))/6e4}); open=null; }
      else { if(open){ out.push({...open,miss:'out'}); open=null; } out.push({staff:r.staff,date:r.date,outT:r.time,outAt:r.at,outId:r._id,miss:'in',dev:r.device}); } }
  }
  if(open){ const stillOn=(Date.now()-new Date(open.inAt))<20*3600e3; out.push({...open,miss:stillOn?'working':'out'}); }
  return out;
}
function shifts(){ const by={}; ATT.forEach(r=>{(by[r.staff]=by[r.staff]||[]).push(r)}); return Object.values(by).flatMap(pairUp).sort((a,b)=>(b.date+(b.inT||b.outT)).localeCompare(a.date+(a.inT||a.outT))); }
function lateMin(s){ const sh=jget(LS_SHIFT,{})[s.staff]; const a=toMin(sh), b=toMin(s.inT); if(a==null||b==null) return 0; const d=b-a; return d>10&&d<6*60?d:0; }
window.attBoss=function(){
  if(!$('t-attend')) return;
  const months=[...new Set([ppToday().slice(0,7),...ATT.map(r=>String(r.date||'').slice(0,7))])].filter(Boolean).sort().reverse();
  const mSel=$('attM'); const cur=mSel.value||attM||months[0]; mSel.innerHTML=months.map(m=>`<option value="${m}">${esc(fmtD(m))}</option>`).join(''); mSel.value=cur; attM=cur;
  const staffAll=[...new Set(ATT.map(r=>r.staff))].sort((a,b)=>a.localeCompare(b));
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
  const shiftMap=jget(LS_SHIFT,{});
  const sum={}; staffAll.filter(n=>!attS||n===attS).forEach(n=>sum[n]={days:new Set(),min:0,late:0,lateMin:0,miss:0});
  MS.forEach(s=>{ const o=sum[s.staff]; if(!o) return; o.days.add(s.date); o.min+=s.min||0; const lm=lateMin(s); if(lm){o.late++;o.lateMin+=lm;} if(s.miss==='out'||s.miss==='in') o.miss++; });
  $('attSumH').textContent='📊 សង្ខេបខែ '+fmtD(attM);
  $('attSum').innerHTML=`<tr><th>បុគ្គលិក</th><th>ថ្ងៃធ្វើការ</th><th>ម៉ោងសរុប</th><th>មធ្យម/ថ្ងៃ</th><th>មកយឺត</th><th>ភ្លេចចុច</th><th class="att-noprint">ម៉ោងចូល</th></tr>`+
    (Object.keys(sum).length?Object.entries(sum).map(([n,o])=>`<tr><td><b>${esc(n)}</b></td><td>${o.days.size}</td><td>${hm(o.min)}</td><td>${o.days.size?hmShort(o.min/o.days.size):'—'}</td><td class="${o.late?'att-warn':''}">${o.late?o.late+' ដង ('+o.lateMin+' នាទី)':'—'}</td><td class="${o.miss?'att-bad':''}">${o.miss?o.miss+' ដង':'—'}</td><td class="att-noprint"><input type="time" class="att-shift" value="${esc(shiftMap[n]||'')}" data-n="${esc(n)}" onchange="attSetShift(this)"></td></tr>`).join(''):'<tr><td colspan="7" class="muted">គ្មានទិន្នន័យខែនេះ</td></tr>');
  $('attDays').innerHTML=`<tr><th>ថ្ងៃ</th><th>បុគ្គលិក</th><th>ចូល</th><th>ចេញ</th><th>ម៉ោងធ្វើការ</th><th>ស្ថានភាព</th><th class="att-noprint"></th></tr>`+
    (MS.length?MS.map(s=>{ const lm=lateMin(s);
      const st=s.miss==='working'?'<td class="att-ok">🟢 កំពុងធ្វើការ</td>':s.miss==='out'?'<td class="att-bad">⚠️ ភ្លេច Check Out</td>':s.miss==='in'?'<td class="att-bad">⚠️ គ្មាន Check In</td>':lm?`<td class="att-warn">⏰ យឺត ${lm} នាទី</td>`:'<td class="att-ok">✅ ត្រឹមត្រូវ</td>';
      const ids=[s.inId,s.outId].filter(Boolean).map(String);
      return `<tr><td>${esc(dayName(s.date))} ${esc(fmtD(s.date))}</td><td><b>${esc(s.staff)}</b></td><td>${esc(s.inT||'—')}</td><td>${esc(s.outT||'—')}${s.outDate&&s.outDate!==s.date?' <small class="muted">(ថ្ងៃបន្ទាប់)</small>':''}</td><td>${s.min?hm(s.min):'—'}</td>${st}<td class="att-noprint">${ids.map(id=>`<button class="btn alt sm" title="លុបការចុចខុស" onclick="attDel('${esc(id)}')">🗑</button>`).join(' ')}</td></tr>`; }).join(''):'<tr><td colspan="7" class="muted">គ្មានទិន្នន័យ</td></tr>');
};
window.attSetShift=el=>{ const m=jget(LS_SHIFT,{}); if(el.value) m[el.dataset.n]=el.value; else delete m[el.dataset.n]; jset(LS_SHIFT,m); attBoss(); };
window.attDel=async id=>{ const r=ATT.find(x=>String(x._id)===String(id)); if(!r) return;
  if(!confirm(`🗑 លុបការចុចនេះ?\n${r.staff} · ${r.act==='in'?'ចូល':'ចេញ'} ${r.time} · ${fmtD(r.date)}\n(ទៅក្នុងធុងសំរាម — អាចយកមកវិញបាន)`)) return;
  try{ await api('delete',{key:bossKey(),id:String(id)}); }catch(e){ return alert('លុបមិនបាន៖ '+e.message); }
  ATT=ATT.filter(x=>String(x._id)!==String(id)); attBoss(); };
window.attManual=async()=>{
  const staffAll=[...new Set(ATT.map(r=>r.staff))];
  const n=(prompt('ឈ្មោះបុគ្គលិក'+(staffAll.length?' ('+staffAll.join(', ')+')':''),attS||'')||'').trim(); if(!n) return;
  const act=(prompt('វាយ 1 = ចូល (Check In) · 2 = ចេញ (Check Out)','2')||'').trim(); if(!['1','2'].includes(act)) return;
  const date=(prompt('ថ្ងៃ (YYYY-MM-DD)',ppToday())||'').trim(); if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return alert('ថ្ងៃមិនត្រឹមត្រូវ');
  const time=(prompt('ម៉ោង (HH:MM) ម៉ោងកម្ពុជា','17:00')||'').trim(); if(!/^\d{1,2}:\d{2}$/.test(time)) return alert('ម៉ោងមិនត្រឹមត្រូវ');
  const tt=time.padStart(5,'0'); const at=new Date(date+'T'+tt+':00+07:00').toISOString();
  const rec={type:'attend',staff:n,act:act==='1'?'in':'out',at,date,time:tt,ci:date,device:'មេ (បញ្ចូលដោយដៃ)',manual:true,ciAt:new Date().toISOString()};
  try{ const j=await api('submit',{type:'attend',data:rec,key:bossKey()}); if(j&&j.pdfToken) api('savePdf',{id:j.id,token:j.pdfToken,type:'attend',pdf:''}).catch(()=>{}); ATT.push({...rec,_id:j.id}); attBoss(); }
  catch(e){ alert('រក្សាទុកមិនបាន៖ '+e.message); } };
window.attCsv=()=>{
  const MS=shifts().filter(s=>String(s.date).startsWith(attM)&&(!attS||s.staff===attS)).reverse();
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const rows=[['Date','Day','Staff','Check In','Check Out','Hours','Minutes','Status','Late (min)']].concat(MS.map(s=>[s.date,dayName(s.date),s.staff,s.inT||'',s.outT||'',s.min?hmShort(s.min):'',Math.round(s.min||0),
    s.miss==='working'?'Working':s.miss==='out'?'Missing check-out':s.miss==='in'?'Missing check-in':'OK',lateMin(s)||'']));
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
