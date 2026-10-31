/* weekly.js v1 */
/* =====================================================================
   📦 WEEKLY DOCUMENTS — A&J Kampot Hub (boss page)
   Once a week (Sunday) the boss presses one button and the week's documents (Mon → Sun) are
   gathered into combined PDFs and saved to Google Drive (A&J Hub Files › PDF › Weekly › YYYY-MM):
     ① សំណើបុគ្គលិក   — Request Forms (with the boss's decision + the staff's acknowledgment signature)
     ② ហ្វម Check-in  — guest check-in forms
     ③ ហ្វមភ្ញៀវផ្សេងៗ — Booking, Cancellation, Luggage, Arrival, Companion, Guarantee …
   Nothing is sent by itself: on Sunday (or later, if last week was not sent yet) the home page shows
   a reminder with the button. Big groups are split into parts so each PDF stays a reasonable size.
   ===================================================================== */
(function(){
'use strict';
if(typeof DEFS==='undefined'||typeof S==='undefined') return;
const LS_SENT='ajhub_weekly_sent';
const PART={req:10,checkin:5,guest:8};
const CATS=[
  {k:'req',n:'① សំណើបុគ្គលិក',en:'Staff Requests',types:['leave']},
  {k:'checkin',n:'② ហ្វម Check-in',en:'Check-in Forms',types:['checkin']},
  {k:'guest',n:'③ ហ្វមភ្ញៀវផ្សេងៗ',en:'Booking · Cancellation · Other guest forms',types:['booking','cancel','luggage','arrival','companion','guarantee','decl']}];
const jget=(k,d)=>{try{const v=JSON.parse(ls.get(k)||'null');return v==null?d:v}catch(e){return d}};
const jset=(k,v)=>{try{ls.set(k,JSON.stringify(v))}catch(e){}};
const dm=s=>String(s||'').slice(8,10)+'-'+String(s||'').slice(5,7);
const dmy2=s=>dm(s)+'-'+String(s||'').slice(0,4);

/* weeks run Monday → Sunday */
function monday(day){ const d=new Date(day+'T00:00:00'); const w=(d.getDay()+6)%7; return addDays(day,-w); }
const weekEnd=mon=>addDays(mon,6);
function dueWeek(){ const t=todayStr(), mon=monday(t); return new Date(t+'T00:00:00').getDay()===0?mon:addDays(mon,-7); } /* Sunday → this week, else last week */
const weekLbl=mon=>`${dm(mon)} ដល់ ${dmy2(weekEnd(mon))}`;

/* the date a form belongs to: check-in → arrival day; staff request → the day it was finished
   (staff signed the acknowledgment, else the boss replied, else it was sent); others → day it was signed */
const tday=t=>t?ymd(new Date(t)):'';
const cfgMsgs=()=>{ const c=window.ajCfg&&window.ajCfg.get&&window.ajCfg.get(); return (c&&c.work&&Array.isArray(c.work.msg))?c.work.msg:[]; };
function dayOf(r){ if(r.type==='checkin') return String(r.ci||'').slice(0,10);
  if(r.type==='leave'){ const id=String(r._id); const ack=(S.forms||[]).filter(a=>a.type==='msgack'&&a.ref===id).map(a=>a.ciAt).sort().pop();
    const rp=cfgMsgs().find(m=>m.ref===id); const t=ack||(rp&&rp.at); if(t) return tday(t); }
  const a=tday(r.ciAt); return a||String(fDate(r)||'').slice(0,10); }
function weekForms(mon){ const end=weekEnd(mon), F=allForms();
  const edited=new Set(F.map(r=>r.editOf).filter(Boolean).map(String));
  const out={}; CATS.forEach(c=>{ out[c.k]=F.filter(r=>c.types.includes(r.type)&&!edited.has(String(r._id))&&(r.type==='checkin'||DEFS[r.type]))
    .filter(r=>{ const d=dayOf(r); return d&&d>=mon&&d<=end; })
    .sort((a,b)=>(dayOf(a)+String(a.ciAt||'')).localeCompare(dayOf(b)+String(b.ciAt||''))); });
  return out; }
const paperOf=r=>r.type==='checkin'?paperCheckin(r):paperGeneric(r);

/* cover page listing every document of the part */
function cover(c,mon,list,part,parts){
  return `<div class="paper"><div class="pbody"><h3 class="dt">📦 ឯកសារប្រចាំសប្តាហ៍ / Weekly Documents</h3>
  <p><b>A&amp;J Kampot Boutique</b> · សប្តាហ៍ ${esc(weekLbl(mon))}</p>
  <p><b>${esc(c.n)}</b> — ${esc(c.en)}${parts>1?` · ភាគ ${part}/${parts}`:''} · ${list.length} ឯកសារ</p>
  <table class="ext" style="margin-top:10px"><tr><th>#</th><th>ថ្ងៃ</th><th>ឯកសារ</th><th>ឈ្មោះ</th></tr>
  ${list.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(dmy2(dayOf(r)))}</td><td>${esc((r.type==='checkin'?'Check-in':(DEFS[r.type]||{}).title||r.type))}${r.type==='checkin'&&r.room?' · Room '+esc(r.room):''}</td><td>${esc(fName(r)||'')}</td></tr>`).join('')}</table>
  <p class="muted" style="margin-top:12px">ផ្ញើពី A&amp;J Hub · ${esc(new Date().toLocaleString('en-GB'))}</p></div></div>`; }

async function buildPart(c,mon,list,part,parts){
  const ids=list.flatMap(driveIdsOf); if(ids.length) await fetchImgs(ids,3);
  const box=document.createElement('div'); box.style.cssText='position:fixed;left:-10000px;top:0;width:794px';
  box.innerHTML=cover(c,mon,list,part,parts)+list.map(r=>`<div class="pb">${paperOf(r)}</div>`).join('');
  document.body.appendChild(box);
  try{ const title=`សប្តាហ៍ ${weekLbl(mon)} - ${c.n}${parts>1?` (ភាគ ${part}-${parts})`:''}`;
    const uri=await (await pdfWorker(box,title)).w.outputPdf('datauristring');
    const j=await api('savePdf',{key:bossKey(),id:`weekly-${mon}-${c.k}-${part}`,type:'weekly',month:mon.slice(0,7),title,pdf:uri});
    return {title,url:j.url}; }
  finally{ box.remove(); } }

/* ---------- dialog ---------- */
let WK=null, RUN=false;
function openWeekly(mon){ WK=mon||dueWeek(); $('dT').textContent='📦 ឯកសារប្រចាំសប្តាហ៍'; $('docBtns').innerHTML=''; drawWeekly(); if(!$('dlg').open) $('dlg').showModal(); }
window.openWeekly=openWeekly;
function drawWeekly(res){ const W=weekForms(WK), sent=jget(LS_SENT,{})[WK], cur=dueWeek();
  const opts=[0,1,2,3,4,5,6,7].map(i=>addDays(monday(todayStr()),-7*i)).map(m=>`<option value="${m}" ${m===WK?'selected':''}>${esc(weekLbl(m))}${m===cur?' ← សប្តាហ៍ត្រូវផ្ញើ':''}${jget(LS_SENT,{})[m]?' ✅':''}</option>`).join('');
  const total=CATS.reduce((s,c)=>s+W[c.k].length,0);
  $('dB').innerHTML=`<div class="card"><label>សប្តាហ៍ (ច័ន្ទ → អាទិត្យ)</label><select onchange="openWeekly(this.value)" style="max-width:360px">${opts}</select>
    ${sent?`<div class="alert ok" style="margin-top:10px">✅ សប្តាហ៍នេះបានផ្ញើរួច · ${esc(new Date(sent.at).toLocaleString('en-GB'))}${(sent.files||[]).length?'<br>'+sent.files.map(f=>`<a href="${esc(f.url)}" target="_blank" rel="noopener">📄 ${esc(f.title)}</a>`).join('<br>'):''}</div>`:''}
    <table class="tw" style="width:100%;margin-top:12px">${CATS.map(c=>`<tr><td><b>${esc(c.n)}</b><div class="muted" style="font-size:12px">${esc(c.en)}</div></td><td style="text-align:right;font-size:20px"><b>${W[c.k].length}</b></td></tr>`).join('')}</table>
    ${W.req.length?`<p class="muted" style="font-size:13px">សំណើបុគ្គលិក៖ ${W.req.filter(r=>reqState(r)==='ack').length} ស៊ីញ៉េទទួលយករួច · ${W.req.filter(r=>reqState(r)==='replied').length} មេឆ្លើយ តែបុគ្គលិកមិនទាន់ស៊ីញ៉េ · ${W.req.filter(r=>reqState(r)==='open').length} មិនទាន់ឆ្លើយ</p>`:''}
    <button class="btn big" id="wkGo" style="margin-top:10px" ${total&&!RUN?'':'disabled'} onclick="weeklySend()">☁️ ប្រមូល & ផ្ញើទៅ Google Drive (${total} ឯកសារ)</button>
    <p id="wkStat" class="muted" style="margin-top:8px">${res||'ឯកសារនឹងទៅ Google Drive › A&amp;J Hub Files › PDF › Weekly'}</p></div>`; }
/* request form state for the summary line */
function reqState(r){ const id=String(r._id); if((S.forms||[]).some(a=>a.type==='msgack'&&a.ref===id)) return 'ack';
  return cfgMsgs().some(m=>m.ref===id)?'replied':'open'; }
window.weeklySend=async()=>{ if(RUN) return; const mon=WK, W=weekForms(mon); const st=t=>{ const e=$('wkStat'); if(e) e.innerHTML=t; };
  const jobs=[]; CATS.forEach(c=>{ const L=W[c.k], n=PART[c.k]; const parts=Math.ceil(L.length/n); for(let p=0;p<parts;p++) jobs.push([c,L.slice(p*n,p*n+n),p+1,parts]); });
  if(!jobs.length) return;
  RUN=true; const b=$('wkGo'); if(b) b.disabled=true; const files=[]; let bad=0;
  try{ for(let i=0;i<jobs.length;i++){ const [c,L,p,ps]=jobs[i]; st(`⏳ កំពុងបង្កើត PDF ${i+1}/${jobs.length} · ${esc(c.n)}${ps>1?' ភាគ '+p:''} … (សូមកុំបិទទំព័រ)`);
      try{ files.push(await buildPart(c,mon,L,p,ps)); }catch(e){ bad++; } }
    if(files.length){ const s=jget(LS_SENT,{}); s[mon]={at:new Date().toISOString(),files,bad}; Object.keys(s).sort().slice(0,-12).forEach(k=>delete s[k]); jset(LS_SENT,s); }
  } finally{ RUN=false; }
  drawWeekly(`✅ ផ្ញើ PDF ${files.length} ទៅ Google Drive`+(bad?` · <b style="color:var(--bad)">⚠️ មិនបាន ${bad} — ចុចម្ដងទៀត</b>`:''));
  weeklyBanner(); };

/* ---------- home: tile + Sunday reminder ---------- */
function weeklyBanner(){ const L=$('launcher'); if(!L) return; const old=document.getElementById('wkBan'); if(old) old.remove();
  const mon=dueWeek(); if(jget(LS_SENT,{})[mon]) return; const W=weekForms(mon); const n=CATS.reduce((s,c)=>s+W[c.k].length,0); if(!n) return;
  const isSun=new Date(todayStr()+'T00:00:00').getDay()===0;
  L.insertAdjacentHTML('beforebegin',`<div id="wkBan" class="alert warn" style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:10px 0">
    <div>📦 <b>${isSun?'ថ្ងៃអាទិត្យ — ':''}ដល់ពេលផ្ញើឯកសារប្រចាំសប្តាហ៍</b> · សប្តាហ៍ ${esc(weekLbl(mon))} · ${n} ឯកសារ</div>
    <button class="btn sm" onclick="openWeekly()">☁️ ផ្ញើទៅ Drive</button></div>`); }
const _launch=window.renderLauncher;
window.renderLauncher=renderLauncher=function(){ _launch.apply(this,arguments); try{ wkTile(); }catch(e){ console.warn('weekly',e); } };
function wkTile(){ const L=$('launcher'); if(!L) return;
  if(!L.querySelector('[data-wkly]')){ const mon=dueWeek(), sent=jget(LS_SENT,{})[mon]; const d=document.createElement('button'); d.setAttribute('data-wkly','1'); d.className='tile'; d.onclick=()=>openWeekly();
    d.innerHTML=`<span class="ti">📦</span><b>ឯកសារប្រចាំសប្តាហ៍</b><span class="ts">${sent?'✅ ផ្ញើរួច':'ផ្ញើរៀងរាល់ថ្ងៃអាទិត្យ'}</span>`;
    const a=L.querySelector('[data-mg]'); a?a.after(d):L.appendChild(d); }
  weeklyBanner(); }
if($('launcher')&&$('bossApp')&&!$('bossApp').classList.contains('hide')) try{ renderLauncher(); }catch(e){}
})();
