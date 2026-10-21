/* work.js v1 */
/* =====================================================================
   📋 DAILY WORK REPORT — A&J Kampot Hub (internal, not sold)
   - Staff page:  #f/work  (tablet / phone, PIN once like the other forms)
       staff taps own name → ticks every task of the shift (✔ done / ✖ not done / — n/a) → signs → sends
   - Boss page:   tab "📋 ការងារប្រចាំថ្ងៃ" inside #boss
       checklist editor, today status, per-staff monthly summary, day comparison between staff,
       review of every report (boss marks each task ✔ right / ✖ wrong + comment).
       A wrong tick ("said done, boss found it not done") is counted as a DIFFERENCE.
       The boss comment + wrong tasks are sent back to that staff (shown when the staff opens the page).
   Records: {type:'work'} staff report, {type:'workreview'} boss review (same Google Sheet as the other forms).
   Checklist + feedback live in the attendance config (cfg.work) so every tablet loads them with the staff list.
   ===================================================================== */
(function(){
'use strict';
const TZ='Asia/Phnom_Penh';
const LS_Q='ajwork_q', LS_LOG='ajwork_log', LS_SEEN='ajwork_seen';
const jget=(k,d)=>{try{const v=JSON.parse(ls.get(k)||'null');return v==null?d:v}catch(e){return d}};
const jset=(k,v)=>ls.set(k,JSON.stringify(v));
const _fmt=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
function pp(d){ const o={}; _fmt.formatToParts(d instanceof Date?d:new Date(d)).forEach(p=>o[p.type]=p.value); const H=o.hour==='24'?'00':o.hour; return {date:`${o.year}-${o.month}-${o.day}`,time:`${H}:${o.minute}`}; }
const today=()=>pp(new Date()).date;
const KH_DAYS=['អាទិត្យ','ច័ន្ទ','អង្គារ','ពុធ','ព្រហស្បតិ៍','សុក្រ','សៅរ៍'];
const dayName=s=>KH_DAYS[new Date(s+'T12:00:00Z').getUTCDay()];
const AC=()=>window.ajCfg;
const DEF_TASKS=['ទទួលវេនពីបុគ្គលិកមុនបានត្រឹមត្រូវ (សម្ភារៈ លុយ កំណត់ត្រា)','សម្អាត និងរៀបចំកន្លែងធ្វើការឲ្យស្អាត','ពិនិត្យសោ ភ្លើង ម៉ាស៊ីនត្រជាក់ មុនប្រគល់វេន','កត់ត្រាបញ្ហា/ចំណាំ ដើម្បីប្រគល់ឲ្យវេនបន្ត'];
const tid=t=>{ let h=5381; for(const c of String(t)) h=((h<<5)+h+c.charCodeAt(0))|0; return 't'+(h>>>0).toString(36); };
function wcfg(){ const c=AC().get(); if(!c.work||typeof c.work!=='object') c.work={}; const w=c.work; if(!w.tasks||typeof w.tasks!=='object') w.tasks={}; if(!w.fb||typeof w.fb!=='object') w.fb={}; return w; }
const shifts=()=>AC().get().shifts;
const shiftById=id=>shifts().find(x=>x.id===id)||null;
const staffList=()=>AC().get().staff;
const staffShift=n=>{ const s=staffList().find(x=>x.name===n); return s?shiftById(s.shift):null; };
const mkT=a=>(Array.isArray(a)?a:[]).filter(x=>x&&x.t).map(x=>({id:x.id||tid(x.t),t:String(x.t)}));
const normList=l=>({id:String(l.id),name:String(l.name||'').slice(0,60),shifts:(Array.isArray(l.shifts)?l.shifts:[]).map(String),staff:(Array.isArray(l.staff)?l.staff:[]).map(String),tasks:mkT(l.tasks)});
/* checklists: each has a name, the shifts / staff it is for, and its tasks (the old "tasks per shift" config is converted on the fly) */
function lists(){ const w=wcfg(); if(Array.isArray(w.lists)&&w.lists.length) return w.lists.map(normList);
  const L=[]; shifts().forEach(sh=>{ const t=mkT([...(w.tasks['*']||[]),...(w.tasks[sh.id]||[])]); if(t.length) L.push({id:'sh_'+sh.id,name:sh.name,shifts:[sh.id],staff:[],tasks:t}); });
  if(!L.length) L.push({id:'sample',name:'បញ្ជីគំរូ',shifts:shifts().map(x=>x.id),staff:[],tasks:DEF_TASKS.map(t=>({id:tid(t),t}))});
  return L; }
const listById=id=>lists().find(l=>l.id===id)||null;
const forStaff=(l,n)=>{ const sh=staffShift(n); return l.staff.includes(n)||!!(sh&&l.shifts.includes(sh.id)); };
const lnOf=r=>r.listName||r.shiftName||'';
const ANS_LBL={y:'✔ ធ្វើរួច',n:'✖ មិនបាន',na:'— មិនពាក់ព័ន្ធ'};

/* ---------- register the form type in the hub ---------- */
DEFS.work={icon:'📋',short:'ការងារប្រចាំថ្ងៃ',title:'Daily Work Report',full:'របាយការណ៍ការងារប្រចាំថ្ងៃ / Daily Work Report',
  sections:[],sigs:[],onRender:()=>wkRender(),
  date:r=>r.date||'',room:()=>'',name:r=>r.staff||'',idn:()=>'',extra:r=>lnOf(r)};
if(!TABLET_TYPES.includes('work')) TABLET_TYPES.push('work');
if(!QR_TYPES.includes('work')) QR_TYPES.splice(QR_TYPES.indexOf('decl'),0,'work');
setTimeout(()=>{ try{ if($('tabletLinks')&&$('tabletLinks').children.length&&!$('qr_work')) renderTabletLinks(); }catch(e){} },0);

const css=document.createElement('style'); css.textContent=`
.wk-names{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.wk-n{position:relative;border:2px solid var(--line);background:var(--card);border-radius:14px;padding:16px 10px;text-align:center;cursor:pointer;font:inherit;color:var(--ink);min-height:80px}
.wk-n b{display:block;font-size:19px}.wk-n small{display:block;color:var(--mute);margin-top:4px;font-size:13px}.wk-n.done{border-color:var(--ok);background:var(--okbg)}
.wk-n .x{position:absolute;top:4px;right:6px;background:var(--bad);color:#fff;border-radius:99px;min-width:24px;height:24px;line-height:24px;font-size:13px;font-weight:700;padding:0 6px}
.wk-row{border:1px solid var(--line);border-radius:14px;padding:12px;margin:10px 0;background:var(--card)}
.wk-t{font-weight:600;margin-bottom:8px}
.wk-b{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.wk-b button{font:inherit;border:2px solid var(--line);background:#fff;border-radius:12px;padding:12px 4px;cursor:pointer;color:var(--ink);font-size:15px}
.wk-b button.on[data-v=y]{background:var(--okbg);border-color:var(--ok);color:var(--ok);font-weight:700}
.wk-b button.on[data-v=n]{background:var(--badbg);border-color:var(--bad);color:var(--bad);font-weight:700}
.wk-b button.on[data-v=na]{background:var(--brand2);border-color:var(--mute);font-weight:700}
.wk-row input.wk-note{margin-top:8px}
.wk-row.miss{border-color:var(--bad)}
.wk-fb{border-left:5px solid var(--warn);background:var(--warnbg);border-radius:12px;padding:10px 12px;margin:8px 0}
.wk-fb.seen{opacity:.7}.wk-fb ul{margin:6px 0 0;padding-left:20px}
.wk-done{text-align:center;padding:26px 12px;border-radius:16px;margin:10px 0;font-size:22px;font-weight:700;background:var(--okbg);color:var(--ok)}
td.wk-bad{color:var(--bad);font-weight:600}td.wk-ok{color:var(--ok)}td.wk-warn{color:var(--warn);font-weight:600}
tr.wk-diff td{background:var(--warnbg)}
.wk-cfg textarea{min-height:110px}
.wk-mk{display:flex;gap:6px}.wk-mk button{font:inherit;border:2px solid var(--line);background:#fff;border-radius:10px;padding:8px 12px;cursor:pointer}
.wk-mk button.on[data-m=ok]{background:var(--okbg);border-color:var(--ok);color:var(--ok);font-weight:700}
.wk-mk button.on[data-m=bad]{background:var(--badbg);border-color:var(--bad);color:var(--bad);font-weight:700}
@media print{.wk-noprint{display:none!important}}
`; document.head.appendChild(css);

/* =====================================================================
   STAFF SIDE
   ===================================================================== */
let SEL=null, ANS={}, LIST=null, DATE='', doneT=null;
const logGet=()=>jget(LS_LOG,[]).filter(x=>x&&x.id);
const fbOf=n=>{ const a=wcfg().fb[n]; return Array.isArray(a)?a:[]; };
const seenAt=n=>(jget(LS_SEEN,{})||{})[n]||'';
const unseen=n=>fbOf(n).filter(x=>String(x.at)>seenAt(n));
function wkRender(){
  const host=$('gfBody'); if(!host) return; SEL=null; ANS={};
  host.innerHTML=`<div id="wkMain"></div><h2 style="margin-top:22px">📋 ថ្ងៃនេះ (ថេប្លេតនេះ)</h2><div id="wkLog" class="muted"></div>
  <p class="muted" style="font-size:13px">បើអ៊ីនធឺណិតដាច់ របាយការណ៍ទុកក្នុងថេប្លេត ហើយផ្ញើទៅមេដោយស្វ័យប្រវត្តិពេលមានអ៊ីនធឺណិតវិញ</p>`;
  drawMain(); drawLog(); wkFlush();
  AC().load(deviceKey()||bossKey()).then(ok=>{ if(ok&&!SEL&&$('wkMain')&&!$('wkMain').querySelector('.wk-done')) drawMain(); });
}
function drawMain(){
  const box=$('wkMain'); if(!box) return;
  if(SEL&&LIST) return drawForm(box);
  if(SEL) return drawChoose(box);
  const N=staffList().map(x=>x.name);
  if(!N.length){ box.innerHTML=`<div class="alert warn">មិនទាន់មានឈ្មោះបុគ្គលិកទេ។ មេបញ្ចូលឈ្មោះ និងវេន នៅ <b>ទំព័រមេ → 🕒 វត្តមាន → 👥 បុគ្គលិក &amp; វេន</b> ហើយឈ្មោះនឹងចេញនៅទីនេះដោយខ្លួនឯង។</div>`; return; }
  const t=today(); const sentToday=new Set(logGet().filter(x=>x.date===t).map(x=>x.staff));
  const btn=n=>{ const u=unseen(n).length, sh=staffShift(n);
    return `<button class="wk-n ${sentToday.has(n)?'done':''}" data-n="${esc(n)}" onclick="wkPick(this.dataset.n)">${u?`<span class="x" title="មានសារពីមេ">💬${u}</span>`:''}<b>${esc(n)}</b><small>${sentToday.has(n)?'✅ បានបំពេញថ្ងៃនេះ':(sh?esc(sh.name):'—')}</small></button>`; };
  const groups=shifts().map(sh=>[sh.name+' '+sh.start+'–'+sh.end,N.filter(n=>{const x=staffShift(n);return x&&x.id===sh.id})]); groups.push(['ផ្សេងៗ',N.filter(n=>!staffShift(n))]);
  box.innerHTML=`<h2 style="margin-top:6px">${esc(DEFS.work.full)}</h2><div style="text-align:center;font-weight:600;margin-bottom:4px">👇 ចុចលើឈ្មោះរបស់អ្នក</div>`+
    groups.filter(g=>g[1].length).map(g=>`<h3 style="margin:14px 0 8px">${esc(g[0])}</h3><div class="wk-names">${g[1].map(btn).join('')}</div>`).join('');
}
window.wkPick=n=>{ SEL=n; ANS={}; DATE=today(); LIST=null; clearTimeout(doneT);
  const mine=lists().filter(l=>forStaff(l,n)); if(mine.length===1) LIST=mine[0].id; drawMain(); window.scrollTo(0,0); };
window.wkPickList=id=>{ LIST=id; ANS={}; drawMain(); window.scrollTo(0,0); };
function drawChoose(box){
  const n=SEL, L=lists(), mine=L.filter(l=>forStaff(l,n)), other=L.filter(l=>!forStaff(l,n)), t=today(); const sent=new Set(logGet().filter(x=>x.staff===n&&x.date===t).map(x=>x.list));
  const btn=l=>`<button class="wk-n ${sent.has(l.id)?'done':''}" data-l="${esc(l.id)}" onclick="wkPickList(this.dataset.l)"><b>${esc(l.name)}</b><small>${sent.has(l.id)?'✅ បានបំពេញថ្ងៃនេះ':l.tasks.length+' ការងារ'}</small></button>`;
  box.innerHTML=`<div style="text-align:center;font-size:24px;font-weight:700">👤 ${esc(n)}</div>${fbHtml(n)}<h2>ជ្រើសបញ្ជីដែលត្រូវបំពេញ</h2>
  ${mine.length?`<div class="wk-names">${mine.map(btn).join('')}</div>`:'<div class="muted">មេមិនទាន់កំណត់បញ្ជីសម្រាប់អ្នកទេ — ជ្រើសខាងក្រោម</div>'}
  ${other.length?`<details style="margin-top:14px" ${mine.length?'':'open'}><summary>បញ្ជីផ្សេងទៀត</summary><div class="wk-names" style="margin-top:8px">${other.map(btn).join('')}</div></details>`:''}
  <div class="nav2"><button class="btn alt" onclick="wkBack()">← ត្រលប់ក្រោយ</button></div>`;
  markSeen(n);
}
window.wkBack=()=>{ if(SEL&&LIST&&lists().filter(l=>forStaff(l,SEL)).length!==1){ LIST=null; ANS={}; } else { SEL=null; LIST=null; } drawMain(); };
const fbHtml=n=>{ const fb=fbOf(n).slice(0,5), sn=seenAt(n);
  return fb.length?`<h3>💬 សារពីមេ</h3>`+fb.map(x=>`<div class="wk-fb ${String(x.at)>sn?'':'seen'}"><b>${esc(dayName(x.d))} ${esc(fmtD(x.d))}${x.s?' · '+esc(x.s):''}</b>${x.m?`<div style="white-space:pre-wrap">${esc(x.m)}</div>`:''}${x.bad&&x.bad.length?`<div style="margin-top:4px">❌ ការងារដែលមេឃើញថាមិនត្រឹមត្រូវ៖</div><ul>${x.bad.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`).join(''):''; };
const markSeen=n=>{ const fb=fbOf(n); if(fb.length){ const s=jget(LS_SEEN,{}); s[n]=fb[0].at; jset(LS_SEEN,s); } };
function drawForm(box){
  const n=SEL, li=listById(LIST); if(!li){ LIST=null; return drawChoose(box); } const T=li.tasks;
  box.innerHTML=`<div style="text-align:center;font-size:24px;font-weight:700">👤 ${esc(n)}</div>${fbHtml(n)}
  <div class="fg" style="margin-top:10px"><label>ថ្ងៃទី<input type="date" id="wk_d" value="${esc(DATE)}"></label></div>
  <h2>${esc(li.name)}</h2>
  ${T.length?T.map(x=>`<div class="wk-row" id="wr_${x.id}"><div class="wk-t">${esc(x.t)}</div><div class="wk-b">${['y','n','na'].map(v=>`<button type="button" data-v="${v}" onclick="wkSet('${x.id}','${v}')">${ANS_LBL[v]}</button>`).join('')}</div><input class="wk-note hide" id="wn_${x.id}" placeholder="មូលហេតុ / ចំណាំ (ចាំបាច់)" oninput="wkNote('${x.id}',this.value)"></div>`).join(''):`<div class="alert warn">មេមិនទាន់កំណត់ការងារក្នុងបញ្ជីនេះទេ។</div>`}
  <label>ចំណាំបន្ថែម (បើមាន)<textarea id="wk_notes" rows="3" placeholder="បញ្ហា ឬអ្វីដែលមេគួរដឹង"></textarea></label>
  <h3>✍️ ហត្ថលេខា / Signature</h3><div class="sigwrap"><canvas id="wk_sig"></canvas><div class="ph">✍️ ស៊ីញ៉េនៅទីនេះ / Sign here</div></div>
  <div class="row" style="margin-top:8px"><button class="btn alt sm" onclick="sigClear('wk_sig')">លុប / Clear</button></div>
  <div class="nav2"><button class="btn alt" onclick="wkBack()">← ត្រលប់ក្រោយ</button><button class="btn big" id="wkSend" onclick="wkSubmit()">✅ ផ្ញើរបាយការណ៍</button></div>`;
  initSig('wk_sig'); setTimeout(()=>sigResize('wk_sig'),30); markSeen(n);
}
window.wkSet=(id,v)=>{ const o=ANS[id]||(ANS[id]={v:'',n:''}); o.v=v; const row=$('wr_'+id); row.classList.remove('miss');
  row.querySelectorAll('.wk-b button').forEach(b=>b.classList.toggle('on',b.dataset.v===v)); const i=$('wn_'+id); i.classList.toggle('hide',v!=='n'); if(v==='n') i.focus(); };
window.wkNote=(id,v)=>{ (ANS[id]||(ANS[id]={v:'',n:''})).n=v; };
window.wkSubmit=async()=>{
  const n=SEL, li=listById(LIST), sh=staffShift(n), T=li?li.tasks:[], date=($('wk_d').value||DATE||today());
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return alert('សូមដាក់ថ្ងៃ');
  if(!T.length) return alert('មេមិនទាន់កំណត់ការងារក្នុងបញ្ជីនេះ');
  let first=null; T.forEach(x=>{ const a=ANS[x.id]; const bad=!a||!a.v||(a.v==='n'&&!String(a.n||'').trim()); $('wr_'+x.id).classList.toggle('miss',bad); if(bad&&!first) first=x.id; });
  if(first){ $('wr_'+first).scrollIntoView({behavior:'smooth',block:'center'}); return alert('សូមឆ្លើយគ្រប់ការងារ (បើ ✖ មិនបាន សូមសរសេរមូលហេតុ)'); }
  if(!sigs['wk_sig']||!sigs['wk_sig'].dirty) return alert('សូមស៊ីញ៉េ / Please sign');
  const dup=logGet().find(x=>x.staff===n&&x.date===date&&x.list===LIST);
  if(dup&&!confirm(`${n} បានបំពេញបញ្ជីនេះរួចហើយ (${fmtD(date)}) ម៉ោង ${dup.time}។\nចង់ផ្ញើម្ដងទៀតមែនទេ?`)) return;
  const now=new Date(), p=pp(now); const id=device()+'-'+now.getTime().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  const items={}; T.forEach(x=>{ const a=ANS[x.id]; items[x.id]={v:a.v,...(a.n&&a.v==='n'?{n:String(a.n).trim().slice(0,300)}:{})}; });
  const rec={type:'work',staff:n,list:LIST,listName:li.name,shift:sh?sh.id:'',shiftName:sh?sh.name:'',date,time:p.time,at:now.toISOString(),ci:date,ciAt:now.toISOString(),device:device(),tasks:T,items,notes:($('wk_notes').value||'').trim().slice(0,600),sig:sigData('wk_sig')};
  const L=logGet(); L.push({id,staff:n,list:LIST,date,time:p.time,sent:false}); jset(LS_LOG,L);
  const Q=jget(LS_Q,{}); Q[id]=rec; if(!jset(LS_Q,Q)&&false) return;
  SEL=null; LIST=null; $('wkMain').innerHTML=`<div class="wk-done">✅ ${esc(n)}<br>បានផ្ញើរបាយការណ៍ម៉ោង ${esc(p.time)}<div style="font-size:15px;font-weight:400;margin-top:8px">អរគុណ!</div></div>`;
  window.scrollTo(0,0); drawLog(); clearTimeout(doneT); doneT=setTimeout(()=>{ if(!SEL) drawMain(); },3500); wkFlush();
};
function drawLog(){
  const el=$('wkLog'); if(!el) return; const t=today(); const L=logGet().filter(x=>x.date===t).sort((a,b)=>String(b.time).localeCompare(String(a.time)));
  el.innerHTML=L.length?`<table class="att-log" style="width:100%;border-collapse:collapse">`+L.map(x=>`<tr><td><b>${esc(x.time)}</b></td><td>${esc(x.staff)}</td><td style="text-align:right">${x.sent?'☁️ ផ្ញើរួច':'⏳ រង់ចាំផ្ញើ'}</td></tr>`).join('')+`</table>`:'មិនទាន់មានទេ';
}
let flushing=false;
async function wkFlush(){
  if(flushing||!navigator.onLine) return; flushing=true;
  try{ const Q=jget(LS_Q,{});
    for(const [id,rec] of Object.entries(Q)){
      try{ const j=await api('submit',{type:'work',data:rec,key:deviceKey()||bossKey()});
        if(j&&j.pdfToken) api('savePdf',{id:j.id,token:j.pdfToken,type:'work',pdf:''}).catch(()=>{});
        const q=jget(LS_Q,{}); delete q[id]; jset(LS_Q,q); jset(LS_LOG,logGet().map(x=>x.id===id?{...x,sent:true}:x)); drawLog();
      }catch(e){ if(/WRONG_PIN|NO_STAFF_PIN/.test(e.message)&&$('wkLog')) $('wkLog').insertAdjacentHTML('afterbegin','<div class="alert bad">PIN បុគ្គលិកត្រូវបានប្ដូរ — សូមចុច 🔒 ហើយបញ្ចូល PIN ថ្មី។ របាយការណ៍នៅក្នុងថេប្លេតនៅឡើយ។</div>'); break; }
    }
  } finally{ flushing=false; }
}
window.addEventListener('online',wkFlush); setInterval(wkFlush,60000);

/* =====================================================================
   BOSS SIDE — tab 📋 ការងារប្រចាំថ្ងៃ
   ===================================================================== */
let WORK=[], REV={}, wkM='', wkS='', ROWS=[];
const tasksOf=r=>Array.isArray(r.tasks)?r.tasks:[];
function judge(a,m){ if(!a||!m||a==='na') return ''; if(a==='y'&&m==='bad') return 'false'; if(a==='n'&&m==='ok') return 'diff'; return 'same'; }
function stat(r){ const rv=REV[r._id]; let y=0,n=0,na=0; tasksOf(r).forEach(t=>{ const a=(r.items&&r.items[t.id]||{}).v; if(a==='y')y++; else if(a==='n')n++; else if(a==='na')na++; });
  let chk=0,diff=0; if(rv) tasksOf(r).forEach(t=>{ const j=judge((r.items&&r.items[t.id]||{}).v,(rv.marks&&rv.marks[t.id]||{}).m); if(j){ chk++; if(j!=='same') diff++; } });
  return {y,n,na,rv,chk,diff}; }
function injectBoss(){
  if($('t-work')||!$('tabs')) return;
  const anchor=document.querySelector('#tabs button[data-t="attend"]')||document.querySelector('#tabs button[data-t="payroll"]'); const b=document.createElement('button'); b.dataset.t='work'; b.textContent='📋 ការងារប្រចាំថ្ងៃ';
  anchor?anchor.after(b):$('tabs').appendChild(b);
  const sec=document.createElement('section'); sec.id='t-work'; sec.className='hide';
  sec.innerHTML=`<div class="row wk-noprint" style="flex-wrap:wrap">
      <select id="wkM" onchange="wkBoss()" style="width:auto"></select>
      <select id="wkS" onchange="wkBoss()" style="width:auto"><option value="">បុគ្គលិកទាំងអស់</option></select>
      <button class="btn sm" onclick="wkCsv()">⬇️ CSV (Google Sheets)</button>
      <button class="btn alt sm" onclick="wkPrint()">🖨 បោះពុម្ព / PDF</button>
      <a class="btn alt sm" href="#f/work" target="_blank" rel="noopener" style="text-decoration:none">📋 បើកទំព័របុគ្គលិក</a></div>
    <details id="wkCfgBox" class="card wk-noprint wk-cfg" style="margin:12px 0"><summary style="cursor:pointer;font-weight:700;font-size:17px">✅ បញ្ជីការងារ (Checklist) <span class="muted" id="wkCfgSum" style="font-weight:400;font-size:14px"></span></summary><div id="wkCfgBody" style="margin-top:10px"></div></details>
    <div id="wkPrintArea">
      <h2 style="margin-top:6px">🟢 ថ្ងៃនេះ <span class="muted" id="wkTodayD" style="font-size:14px;font-weight:400"></span></h2><div id="wkWho" class="att-who"></div>
      <h2 id="wkSumH">📊 សង្ខេបប្រចាំខែ</h2><div class="tw"><table id="wkSum"></table></div>
      <p class="muted" style="font-size:13px">ខុសគ្នា = បុគ្គលិកថា «ធ្វើរួច» តែមេឃើញថាមិនត្រឹមត្រូវ ឬបុគ្គលិកថា «មិនបាន» តែមេឃើញថាត្រឹមត្រូវ · ភាពត្រឹមត្រូវ = ការងារដែលមេត្រួតហើយ ហើយចម្លើយដូចគ្នា</p>
      <h2>📑 របាយការណ៍បុគ្គលិក</h2><div class="tw"><table id="wkList"></table></div>
    </div>
    <div class="card wk-noprint" style="margin-top:14px"><h2 style="margin-top:0">🔍 ប្រៀបធៀបបុគ្គលិកក្នុងថ្ងៃតែមួយ</h2>
      <div class="row"><input type="date" id="wkCmpD" onchange="wkCmp()" style="width:auto"></div><div id="wkCmp" style="margin-top:10px"></div></div>`;
  const main=document.querySelector('#bossApp main'); const prev=$('t-attend')||$('t-payroll'); prev?prev.after(sec):main.appendChild(sec);
  $('wkCmpD').value=today(); drawCfg();
  AC().load(bossKey()).then(ok=>{ if(ok){ EDL=null; drawCfg(); wkBoss(); } });
}
/* ---------- ✅ checklist editor ---------- */
let EDL=null;
const newId=()=>'l'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
function drawCfg(){
  const body=$('wkCfgBody'); if(!body) return; if(!EDL) EDL=lists().map(l=>({...l,tasks:l.tasks.map(t=>t.t).join('\n')}));
  $('wkCfgSum').textContent=`· ${EDL.length} បញ្ជី`;
  const staff=staffList().map(x=>x.name);
  body.innerHTML=`<p class="muted" style="margin-top:0">បញ្ជីនីមួយៗមាន <b>ឈ្មោះ</b> (ឧ. វេនព្រឹក, វេនថ្ងៃ, វេនល្ងាច, វេនយប់ ១, ឆែកបន្ទប់ Housekeeping) និង <b>ការងារមួយជួរមួយ</b>។ ជ្រើសថាបញ្ជីនោះសម្រាប់វេនណា ឬបុគ្គលិកណា ហើយគេនឹងឃើញបញ្ជីនោះដោយខ្លួនឯង។ បុគ្គលិកម្នាក់អាចមានច្រើនបញ្ជី។</p>`+
  EDL.map((l,i)=>`<div class="wk-row"><div class="row" style="gap:8px;flex-wrap:nowrap"><input value="${esc(l.name)}" placeholder="ឈ្មោះបញ្ជី" oninput="wkL(${i},'name',this.value)" style="font-weight:700"><button class="btn alt sm" onclick="wkLDel(${i})">🗑</button></div>
    <div style="margin:8px 0 2px" class="muted">សម្រាប់វេន៖</div><div class="row" style="gap:10px">${shifts().map(sh=>`<label style="display:flex;gap:6px;align-items:center;margin:0;font-size:14px"><input type="checkbox" style="width:auto;margin:0" ${l.shifts.includes(sh.id)?'checked':''} onchange="wkLSel(${i},'shifts','${esc(sh.id)}',this.checked)">${esc(sh.name)}</label>`).join('')||'<span class="muted">មិនទាន់មានវេន</span>'}</div>
    ${staff.length?`<details><summary>👤 សម្រាប់បុគ្គលិកជាក់លាក់ ${l.staff.length?'('+l.staff.length+')':''}</summary><div class="row" style="gap:10px">${staff.map(n=>`<label style="display:flex;gap:6px;align-items:center;margin:0;font-size:14px"><input type="checkbox" style="width:auto;margin:0" ${l.staff.includes(n)?'checked':''} onchange="wkLSel(${i},'staff',this.dataset.n,this.checked)" data-n="${esc(n)}">${esc(n)}</label>`).join('')}</div></details>`:''}
    <label style="margin-top:8px">ការងារ (មួយជួរមួយ)<textarea oninput="wkL(${i},'tasks',this.value)" placeholder="ឧ. សម្អាតបន្ទប់ទទួលភ្ញៀវ">${esc(l.tasks)}</textarea></label></div>`).join('')+
  `<div class="row" style="align-items:center;flex-wrap:wrap"><button class="btn alt" onclick="wkLAdd()">➕ បន្ថែមបញ្ជីថ្មី</button><button class="btn big" id="wkCfgSave" onclick="wkCfgSave()">💾 រក្សាទុក</button><span id="wkCfgMsg" class="muted"></span></div>`;
}
window.wkDirty=()=>{ const m=$('wkCfgMsg'); if(m){ m.textContent='⚠️ មិនទាន់រក្សាទុក'; m.style.color='var(--bad)'; } };
window.wkL=(i,k,v)=>{ EDL[i][k]=v; wkDirty(); };
window.wkLSel=(i,k,v,on)=>{ const a=EDL[i][k]; const j=a.indexOf(v); if(on&&j<0) a.push(v); if(!on&&j>=0) a.splice(j,1); wkDirty(); };
window.wkLAdd=()=>{ EDL.push({id:newId(),name:'',shifts:[],staff:[],tasks:''}); drawCfg(); wkDirty(); const t=$('wkCfgBody').querySelectorAll('.wk-row input[placeholder]'); if(t.length) t[t.length-1].focus(); };
window.wkLDel=i=>{ if(!confirm('លុបបញ្ជី "'+(EDL[i].name||'គ្មានឈ្មោះ')+'" ?\n(របាយការណ៍ចាស់ៗនៅដដែល)')) return; EDL.splice(i,1); drawCfg(); wkDirty(); };
async function pushCfg(){ // save the whole config, then read it back to be sure the server kept cfg.work
  const w=wcfg(); AC().set(AC().get());
  await api('setAttCfg',{key:bossKey(),cfg:AC().get()});
  const j=await api('attCfg',{key:bossKey()}); const r=j&&j.cfg&&j.cfg.work;
  return !!(r&&JSON.stringify(r.lists||[])===JSON.stringify(w.lists||[])&&JSON.stringify(r.fb||{})===JSON.stringify(w.fb||{}));
}
const NOKEEP='⚠️ ម៉ាស៊ីនមេ (Google Apps Script) មិនទាន់រក្សា «បញ្ជីការងារ/សារ» ទេ — ត្រូវដំឡើងកំណែថ្មីរបស់ Apps Script (សូមប្រាប់ Claude)';
window.wkCfgSave=async()=>{ const b=$('wkCfgSave'); b.disabled=true; b.textContent='⏳ កំពុងរក្សាទុក…'; const w=wcfg();
  try{ const seen=new Set(); const out=[];
    EDL.forEach(l=>{ const name=String(l.name||'').trim().replace(/\s+/g,' ').slice(0,60); const lines=String(l.tasks||'').split(/\n+/).map(x=>x.trim().replace(/\s+/g,' ').slice(0,200)).filter(Boolean);
      if(!name&&!lines.length) return; const tasks=lines.map(t=>{ let id=tid(t); while(seen.has(id)) id+='x'; seen.add(id); return {id,t}; }); out.push({id:l.id,name:name||'បញ្ជី '+(out.length+1),shifts:l.shifts,staff:l.staff,tasks}); });
    w.lists=out; w.tasks={}; const kept=await pushCfg(); EDL=null; drawCfg(); const m=$('wkCfgMsg'); m.textContent=kept?'✅ រក្សាទុករួច — ថេប្លេតនឹងឃើញបញ្ជីថ្មីពេលបើកទំព័រ 📋':NOKEEP; m.style.color=kept?'var(--ok)':'var(--bad)'; wkBoss(); }
  catch(e){ alert(/Unknown action/.test(e.message)?'ម៉ាស៊ីនមេ (Apps Script) មិនទាន់ Deploy កំណែថ្មី':'រក្សាទុកមិនបាន៖ '+e.message); }
  finally{ const bb=$('wkCfgSave'); if(bb){ bb.disabled=false; bb.textContent='💾 រក្សាទុក'; } } };
/* ---------- main report ---------- */
window.wkBoss=function(){
  if(!$('t-work')) return;
  const months=[...new Set([today().slice(0,7),...WORK.map(r=>String(r.date||'').slice(0,7))])].filter(Boolean).sort().reverse();
  const mSel=$('wkM'); const cur=mSel.value||wkM||months[0]; mSel.innerHTML=months.map(m=>`<option value="${m}">${esc(fmtD(m))}</option>`).join(''); mSel.value=cur; wkM=cur;
  const staffAll=[...new Set([...staffList().map(x=>x.name),...WORK.map(r=>r.staff)])];
  const sSel=$('wkS'); const cs=sSel.value; sSel.innerHTML='<option value="">បុគ្គលិកទាំងអស់</option>'+staffAll.map(n=>`<option>${esc(n)}</option>`).join(''); sSel.value=staffAll.includes(cs)?cs:''; wkS=sSel.value;
  const t=today(); $('wkTodayD').textContent='ថ្ងៃ'+dayName(t)+' '+fmtD(t);
  $('wkWho').innerHTML=staffAll.map(n=>{ const l=WORK.filter(r=>r.staff===n&&r.date===t); if(!l.length) return `<span class="att-chip">⚪ ${esc(n)} — មិនទាន់បំពេញ</span>`;
    return `<span class="att-chip in">✅ ${esc(n)} — ${esc(l.map(x=>x.time).join(', '))}</span>`; }).join('')||'<span class="muted">មិនទាន់មានរបាយការណ៍។ ឲ្យបុគ្គលិកបើកលីង 📋 (ផ្ទាំង លីងថេប្លេត) ហើយចុចឈ្មោះខ្លួនឯង។</span>';
  const MS=WORK.filter(r=>String(r.date).startsWith(wkM)&&(!wkS||r.staff===wkS)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  const sum={}; staffAll.filter(n=>!wkS||n===wkS).forEach(n=>sum[n]={rep:0,days:new Set(),y:0,n:0,rev:0,chk:0,diff:0,fals:0});
  MS.forEach(r=>{ const o=sum[r.staff]; if(!o) return; const s=stat(r); o.rep++; o.days.add(r.date); o.y+=s.y; o.n+=s.n; if(s.rv){ o.rev++; o.chk+=s.chk; o.diff+=s.diff; tasksOf(r).forEach(x=>{ if(judge((r.items[x.id]||{}).v,(s.rv.marks[x.id]||{}).m)==='false') o.fals++; }); } });
  $('wkSumH').textContent='📊 សង្ខេបខែ '+fmtD(wkM);
  const pct=o=>o.chk?Math.round((o.chk-o.diff)/o.chk*100):null;
  $('wkSum').innerHTML=`<tr><th>បុគ្គលិក</th><th>របាយការណ៍</th><th>ថ្ងៃ</th><th>ធ្វើរួច</th><th>មិនបាន</th><th>មេត្រួតហើយ</th><th>ខុសគ្នា</th><th>ភាពត្រឹមត្រូវ</th></tr>`+
    (Object.keys(sum).length?Object.entries(sum).map(([n,o])=>{ const p=pct(o); return `<tr><td><b>${esc(n)}</b></td><td>${o.rep}</td><td>${o.days.size}</td><td class="wk-ok">${o.y}</td><td class="${o.n?'wk-warn':''}">${o.n||'—'}</td><td>${o.rev}/${o.rep}</td><td class="${o.diff?'wk-bad':''}">${o.diff?o.diff+(o.fals?' (មិនពិត '+o.fals+')':''):(o.chk?'0':'—')}</td><td class="${p==null?'':(p>=90?'wk-ok':p>=70?'wk-warn':'wk-bad')}">${p==null?'—':p+'%'}</td></tr>`; }).join(''):'<tr><td colspan="8" class="muted">មិនទាន់មានទិន្នន័យ</td></tr>');
  ROWS=[]; $('wkList').innerHTML=`<tr><th>ថ្ងៃ</th><th>បុគ្គលិក</th><th>វេន</th><th>ធ្វើរួច/សរុប</th><th>មិនបាន</th><th>ការត្រួតពិនិត្យ</th><th class="wk-noprint"></th></tr>`+
    (MS.length?MS.map(r=>{ const s=stat(r), tot=tasksOf(r).length; const ri=ROWS.push(r)-1;
      const rv=!s.rv?'<td class="wk-warn">⏳ មិនទាន់ត្រួត</td>':s.diff?`<td class="wk-bad">⚠️ ខុសគ្នា ${s.diff}/${s.chk}</td>`:`<td class="wk-ok">✅ ត្រឹមត្រូវ${s.chk?' '+s.chk+'/'+s.chk:''}</td>`;
      return `<tr class="${s.diff?'wk-diff':''}"><td>${esc(dayName(r.date))} ${esc(fmtD(r.date))}<br><small class="muted">${esc(r.time||'')}</small></td><td><b>${esc(r.staff)}</b></td><td class="muted">${esc(lnOf(r))}</td><td>${s.y}/${tot}${s.na?' <small class="muted">(+'+s.na+' —)</small>':''}</td><td class="${s.n?'wk-warn':''}">${s.n||'—'}</td>${rv}<td class="wk-noprint" style="white-space:nowrap"><button class="btn sm" onclick="wkReview(${ri})">🔎 ${s.rv?'មើល/កែ':'ត្រួតពិនិត្យ'}</button> <button class="btn alt sm" onclick="wkDel(${ri})">🗑</button></td></tr>`; }).join(''):'<tr><td colspan="7" class="muted">មិនទាន់មានរបាយការណ៍</td></tr>');
  wkCmp();
};
/* ---------- compare staff on the same day ---------- */
window.wkCmp=function(){
  const el=$('wkCmp'); if(!el) return; const d=$('wkCmpD').value||today(); const day=WORK.filter(r=>r.date===d);
  if(!day.length){ el.innerHTML='<span class="muted">គ្មានរបាយការណ៍ថ្ងៃនេះ</span>'; return; }
  const bySh={}; day.forEach(r=>{ const k=r.list||r.shift||'';(bySh[k]=bySh[k]||[]).push(r); });
  el.innerHTML=Object.entries(bySh).map(([k,rs])=>{ const tasks=[]; rs.forEach(r=>tasksOf(r).forEach(t=>{ if(!tasks.some(x=>x.id===t.id)) tasks.push(t); }));
    const cell=(r,t)=>{ const a=(r.items&&r.items[t.id])||null; if(!a) return '<td class="muted">·</td>'; const m=REV[r._id]&&REV[r._id].marks&&REV[r._id].marks[t.id]; const j=judge(a.v,m&&m.m);
      return `<td class="${a.v==='y'?'wk-ok':a.v==='n'?'wk-bad':'muted'}">${a.v==='y'?'✔':a.v==='n'?'✖':'—'}${a.n?`<br><small>${esc(a.n)}</small>`:''}${m?`<br><small class="${j==='same'?'wk-ok':'wk-bad'}">មេ៖ ${m.m==='ok'?'✔ ត្រឹមត្រូវ':'✖ ខុស'}</small>`:''}</td>`; };
    const nm=lnOf(rs[0])||(shiftById(k)||{}).name||'—';
    return `<h3>${esc(nm)}</h3><div class="tw"><table><tr><th>ការងារ</th>${rs.map(r=>`<th>${esc(r.staff)}<br><small class="muted">${esc(r.time||'')}</small></th>`).join('')}</tr>`+
      tasks.map(t=>{ const vs=rs.map(r=>((r.items&&r.items[t.id])||{}).v||''); const differ=new Set(vs.filter(Boolean)).size>1;
        return `<tr class="${differ?'wk-diff':''}"><td>${esc(t.t)}${differ?' <b class="wk-warn">⚠️</b>':''}</td>${rs.map(r=>cell(r,t)).join('')}</tr>`; }).join('')+`</table></div>`; }).join('');
};
/* ---------- 🔎 boss review of one report ---------- */
let RV=null;
window.wkReview=i=>{
  const r=ROWS[i]; if(!r) return; const old=REV[r._id]; RV={r,marks:JSON.parse(JSON.stringify((old&&old.marks)||{})),old};
  $('dT').textContent='🔎 '+r.staff+' · '+dayName(r.date)+' '+fmtD(r.date); try{setDocBtns(null)}catch(e){}
  const rows=tasksOf(r).map(t=>{ const a=(r.items&&r.items[t.id])||{}; return `<div class="wk-row"><div class="wk-t">${esc(t.t)}</div>
    <div class="row" style="align-items:center;justify-content:space-between;flex-wrap:wrap"><span class="${a.v==='y'?'wk-ok':a.v==='n'?'wk-bad':'muted'}">បុគ្គលិក៖ <b>${esc(ANS_LBL[a.v]||'—')}</b>${a.n?' · '+esc(a.n):''}</span>
    <span class="wk-mk" id="wm_${t.id}"><button type="button" data-m="ok" onclick="wkMark('${t.id}','ok')">✔ ត្រឹមត្រូវ</button><button type="button" data-m="bad" onclick="wkMark('${t.id}','bad')">✖ ខុស</button></span></div>
    <input class="wk-note ${RV.marks[t.id]&&RV.marks[t.id].m==='bad'?'':'hide'}" id="wmn_${t.id}" value="${esc((RV.marks[t.id]||{}).n||'')}" placeholder="មេកត់ពីមូលហេតុ (បើមាន)" oninput="wkMarkNote('${t.id}',this.value)"></div>`; }).join('');
  $('dB').innerHTML=`<div style="max-width:640px">${r.notes?`<div class="alert warn">📝 ចំណាំបុគ្គលិក៖ ${esc(r.notes)}</div>`:''}${rows}
    ${r.sig?`<div class="muted" style="margin-top:8px">ហត្ថលេខាបុគ្គលិក</div><img src="${esc(r.sig)}" alt="" style="max-width:260px;background:#fff;border:1px solid var(--line);border-radius:10px">`:''}
    <label style="margin-top:12px">💬 សារទៅបុគ្គលិក (បុគ្គលិកឃើញពេលបើកទំព័រ)<textarea id="wk_cm" rows="3" placeholder="ឧ. សូមសម្អាតបន្ទប់ឲ្យស្អាតជាងនេះ">${esc((old&&old.comment)||'')}</textarea></label>
    <div class="row" style="flex-wrap:wrap;gap:8px"><button class="btn big" id="wkRvSave" onclick="wkRvSave()">💾 រក្សាទុកការត្រួតពិនិត្យ</button><button class="btn alt" onclick="wkRepPrint()">🖨 បោះពុម្ព / PDF</button><button class="btn alt" onclick="wkRepShare()">📤 ផ្ញើបន្ត</button><button class="btn alt" onclick="closeDlg()">បោះបង់</button></div><div id="wkRvMsg" class="muted"></div></div>`;
  tasksOf(r).forEach(t=>paintMark(t.id)); $('dlg').showModal();
};
function paintMark(id){ const w=$('wm_'+id); if(!w) return; const m=(RV.marks[id]||{}).m; w.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.m===m)); const n=$('wmn_'+id); if(n) n.classList.toggle('hide',m!=='bad'); }
window.wkMark=(id,m)=>{ const o=RV.marks[id]||(RV.marks[id]={}); if(o.m===m) delete RV.marks[id]; else o.m=m; paintMark(id); };
window.wkMarkNote=(id,v)=>{ (RV.marks[id]||(RV.marks[id]={})).n=v; };
window.wkRvSave=async()=>{
  const {r,old}=RV; const marks={}; tasksOf(r).forEach(t=>{ const m=RV.marks[t.id]; if(m&&m.m) marks[t.id]={m:m.m,...(m.m==='bad'&&m.n?{n:String(m.n).trim().slice(0,300)}:{})}; });
  const comment=($('wk_cm').value||'').trim().slice(0,600);
  if(!Object.keys(marks).length&&!comment) return alert('សូមចុច ✔ ឬ ✖ យ៉ាងតិចមួយ ឬសរសេរសារ');
  const btn=$('wkRvSave'); btn.disabled=true; btn.textContent='⏳ កំពុងរក្សាទុក…';
  try{
    const bad=tasksOf(r).filter(t=>marks[t.id]&&marks[t.id].m==='bad').map(t=>t.t+(marks[t.id].n?' — '+marks[t.id].n:''));
    const rec={type:'workreview',ref:String(r._id),staff:r.staff,date:r.date,shift:r.shift||'',shiftName:r.shiftName||'',list:r.list||'',listName:lnOf(r),marks,comment,at:new Date().toISOString(),ci:r.date,ciAt:new Date().toISOString(),device:'មេ'};
    const j=await api('submit',{type:'workreview',data:rec,key:bossKey()}); if(j&&j.pdfToken) api('savePdf',{id:j.id,token:j.pdfToken,type:'workreview',pdf:''}).catch(()=>{});
    if(old&&old._id) api('delete',{key:bossKey(),id:String(old._id)}).catch(()=>{});
    REV[r._id]={...rec,_id:j.id};
    let kept=true;
    if(comment||bad.length){ const w=wcfg(); const a=(w.fb[r.staff]=Array.isArray(w.fb[r.staff])?w.fb[r.staff]:[]).filter(x=>!(x.ref===String(r._id)));
      a.unshift({ref:String(r._id),d:r.date,s:lnOf(r),m:comment,bad,at:rec.at}); w.fb[r.staff]=a.slice(0,10); kept=await pushCfg(); }
    closeDlg(); wkBoss(); if(!kept) alert(NOKEEP);
  }catch(e){ alert('រក្សាទុកមិនបាន៖ '+e.message); btn.disabled=false; btn.textContent='💾 រក្សាទុកការត្រួតពិនិត្យ'; }
};
/* ---------- 📤 forward one report (print / PDF / share the text) ---------- */
function repText(r){ const rv=REV[r._id]; const L=[`📋 ${lnOf(r)} — ${r.staff}`,`${dayName(r.date)} ${fmtD(r.date)} ${r.time||''}`,''];
  tasksOf(r).forEach(t=>{ const a=(r.items&&r.items[t.id])||{}, m=rv&&rv.marks&&rv.marks[t.id]; L.push(`${a.v==='y'?'✔':a.v==='n'?'✖':'—'} ${t.t}${a.n?' ('+a.n+')':''}${m?(m.m==='ok'?' [មេ ✔]':' [មេ ✖'+(m.n?': '+m.n:'')+']'):''}`); });
  if(r.notes) L.push('','📝 '+r.notes); if(rv&&rv.comment) L.push('','💬 '+rv.comment); return L.join('\n'); }
window.wkRepShare=async()=>{ const r=RV&&RV.r; if(!r) return; const text=repText(r);
  try{ if(navigator.share){ await navigator.share({title:'A&J Daily Work — '+r.staff,text}); return; } }catch(e){ if(e&&e.name==='AbortError') return; }
  try{ await navigator.clipboard.writeText(text); alert('បានចម្លងអត្ថបទ — ដាក់ក្នុង Telegram / WhatsApp បាន'); }catch(e){ prompt('ចម្លងអត្ថបទនេះ៖',text); } };
window.wkRepPrint=()=>{ const r=RV&&RV.r; if(!r) return; const rv=REV[r._id]; const w=window.open('','_blank'); if(!w) return alert('សូមអនុញ្ញាត pop-up');
  const rows=tasksOf(r).map(t=>{ const a=(r.items&&r.items[t.id])||{}, m=rv&&rv.marks&&rv.marks[t.id]; return `<tr><td>${esc(t.t)}</td><td>${esc(ANS_LBL[a.v]||'—')}${a.n?'<br><small>'+esc(a.n)+'</small>':''}</td><td>${m?(m.m==='ok'?'✔ ត្រឹមត្រូវ':'✖ ខុស'+(m.n?'<br><small>'+esc(m.n)+'</small>':'')):'—'}</td></tr>`; }).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>A&J ${esc(r.staff)} ${esc(r.date)}</title><style>body{font-family:'Kantumruy Pro',system-ui,sans-serif;padding:18px;color:#111}table{width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:13px}th,td{border:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}th{background:#f1f1ee}img.sg{max-width:240px;border:1px solid #ccc}</style></head><body>`+
    docHead('របាយការណ៍ការងារប្រចាំថ្ងៃ / Daily Work Report')+`<p><b>${esc(r.staff)}</b> · ${esc(lnOf(r))} · ${esc(dayName(r.date))} ${esc(fmtD(r.date))} ${esc(r.time||'')}</p><table><tr><th>ការងារ</th><th>បុគ្គលិក</th><th>មេ</th></tr>${rows}</table>`+
    (r.notes?`<p>📝 ${esc(r.notes)}</p>`:'')+(rv&&rv.comment?`<p>💬 ${esc(rv.comment)}</p>`:'')+(r.sig?`<p>ហត្ថលេខាបុគ្គលិក<br><img class="sg" src="${esc(r.sig)}"></p>`:'')+`<script>setTimeout(()=>print(),500)<\/script></body></html>`); w.document.close(); };
window.wkDel=async i=>{ const r=ROWS[i]; if(!r) return;
  if(!confirm(`🗑 លុបរបាយការណ៍នេះ?\n${r.staff} · ${fmtD(r.date)} · ${lnOf(r)}\n(ទៅក្នុងធុងសំរាម — អាចយកមកវិញបាន)`)) return;
  try{ await api('delete',{key:bossKey(),id:String(r._id)}); }catch(e){ return alert('លុបមិនបាន៖ '+e.message); }
  WORK=WORK.filter(x=>String(x._id)!==String(r._id)); wkBoss(); };
window.wkCsv=()=>{
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const MS=WORK.filter(r=>String(r.date).startsWith(wkM)&&(!wkS||r.staff===wkS)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const rows=[['Date','Staff','Checklist','Task','Staff answer','Staff note','Boss check','Boss note','Result','Boss comment']];
  MS.forEach(r=>{ const rv=REV[r._id]; tasksOf(r).forEach(t=>{ const a=(r.items&&r.items[t.id])||{}, m=rv&&rv.marks&&rv.marks[t.id]; const j=judge(a.v,m&&m.m);
    rows.push([r.date,r.staff,lnOf(r),t.t,{y:'Done',n:'Not done',na:'N/A'}[a.v]||'',a.n||'',m?(m.m==='ok'?'Right':'Wrong'):'',m&&m.n||'',j==='false'?'FALSE REPORT':j==='diff'?'DIFFERENT':j==='same'?'Same':'',rv&&rv.comment||'']); }); });
  const blob=new Blob(['﻿'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`AJ-DailyWork-${wkM}${wkS?'-'+wkS:''}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500); };
window.wkPrint=()=>{
  const w=window.open('','_blank'); if(!w) return alert('សូមអនុញ្ញាត pop-up');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>A&J Daily Work ${esc(wkM)}</title><style>body{font-family:'Kantumruy Pro',system-ui,sans-serif;padding:18px;color:#111}table{width:100%;border-collapse:collapse;margin:8px 0 18px;font-size:13px}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f1f1ee}.att-who{display:flex;flex-wrap:wrap;gap:6px}.att-chip{padding:4px 10px;border-radius:99px;background:#eee}.wk-noprint{display:none}tr.wk-diff td{background:#fdf2dc}.wk-bad{color:#b42318;font-weight:600}.wk-ok{color:#1f7a3a}.wk-warn{color:#a15c07;font-weight:600}</style></head><body>`+
    docHead('របាយការណ៍ការងារប្រចាំថ្ងៃ / Daily Work — '+fmtD(wkM)+(wkS?' · '+wkS:''))+$('wkPrintArea').innerHTML+`<script>setTimeout(()=>print(),400)<\/script></body></html>`); w.document.close(); };

/* keep work records out of "ហ្វមទាំងអស់" lists; give them their own tab */
const _renderAll=window.renderAll;
window.renderAll=renderAll=function(){
  if(Array.isArray(S.forms)&&S.forms.some(r=>r.type==='work'||r.type==='workreview')){ const seen=new Set();
    WORK=S.forms.filter(r=>r.type==='work'&&r.staff&&r.at).filter(r=>{ const k=r.staff+'|'+r.shift+'|'+r.at; if(seen.has(k)) return false; seen.add(k); return true; });
    REV={}; S.forms.filter(r=>r.type==='workreview'&&r.ref).sort((a,b)=>String(a.at).localeCompare(String(b.at))).forEach(r=>{ REV[r.ref]=r; });
    S.forms=S.forms.filter(r=>r.type!=='work'&&r.type!=='workreview'); }
  _renderAll.apply(this,arguments); injectBoss(); wkBoss();
};
const _launch=window.renderLauncher;
window.renderLauncher=renderLauncher=function(){ _launch.apply(this,arguments); const L=$('launcher'); if(!L||L.querySelector('[data-wk]')) return;
  const t=today(); const n=new Set(WORK.filter(r=>r.date===t).map(r=>r.staff)).size, un=WORK.filter(r=>!REV[r._id]).length;
  const d=document.createElement('button'); d.setAttribute('data-wk','1'); d.className='tile'; d.onclick=()=>showTab('work');
  d.innerHTML=`<span class="ti">📋</span><b>ការងារប្រចាំថ្ងៃ</b><span class="ts">ថ្ងៃនេះ ${n} នាក់${un?' · ⏳ '+un+' រង់ចាំត្រួត':''}</span>`;
  const att=L.querySelector('[data-att]'); att?att.after(d):L.appendChild(d); };
function homeLink(){ const h=$('homeList'); if(h&&!h.querySelector('[href="#f/work"]')) h.insertAdjacentHTML('afterbegin',`<a href="#f/work"><div class="card"><h3>📋 របាយការណ៍ការងារប្រចាំថ្ងៃ</h3><div class="muted">បុគ្គលិកចុចឈ្មោះខ្លួនឯង ធីកការងារ ហើយស៊ីញ៉េ</div></div></a>`); }
window.addEventListener('hashchange',homeLink);
if(location.hash==='#f/work') route(); else homeLink();
if($('bossApp')&&!$('bossApp').classList.contains('hide')){ injectBoss(); wkBoss(); }
})();
