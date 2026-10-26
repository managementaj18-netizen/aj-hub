/* msg.js v4 */
/* =====================================================================
   💬 MESSAGES & REQUEST REPLIES — A&J Kampot Hub
   - Boss page:  tab "💬 សារ & សំណើ" inside #boss
       • every staff Request Form (📄 សំណើច្បាប់) waits here → ✅ អនុញ្ញាត / ❌ មិនអនុញ្ញាត + reason
       • send a message to one staff, a shift, a department or everyone (with ready examples)
       • list of sent messages (delete), and each staff member's department
   - Staff page: #f/msg  (tablet / phone, PIN once like the other forms)
       staff tap their SHIFT or DEPARTMENT (not a name — names change) → messages for that group + everyone;
       the boss can add a name ("👤 សម្រាប់") on a message so the right person knows it is for them
   Messages live in the attendance config (cfg.work.msg) — the same saved config that already
   carries the daily-work feedback, so every tablet loads it with the staff list. No new server.
   ===================================================================== */
(function(){
'use strict';
const TZ='Asia/Phnom_Penh';
const LS_ME='ajmsg_grp', LS_SEEN='ajmsg_seen';
const MAX_MSG=40, MAX_DAYS=60, MAX_TXT=600;
const jget=(k,d)=>{try{const v=JSON.parse(ls.get(k)||'null');return v==null?d:v}catch(e){return d}};
const jset=(k,v)=>ls.set(k,JSON.stringify(v));
const _fmt=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
function pp(d){ const o={}; _fmt.formatToParts(d instanceof Date?d:new Date(d)).forEach(p=>o[p.type]=p.value); const H=o.hour==='24'?'00':o.hour; return {date:`${o.year}-${o.month}-${o.day}`,time:`${H}:${o.minute}`}; }
const when=iso=>{ try{ const x=pp(iso); return fmtD(x.date)+' '+x.time; }catch(e){ return ''; } };
const AC=()=>window.ajCfg;
const DEPTS=['អ្នកទទួលភ្ញៀវ / Receptionist','អ្នកសំអាត / Housekeeping','អ្នកជួសជុល / Maintenance','ផ្នែកទូទៅ / General'];
const CATS={info:['📢','ជូនដំណឹង'],warn:['⚠️','កំហុស / ព្រមាន'],shift:['🔁','ប្ដូរម៉ោង / វេន'],ok:['✅','អនុញ្ញាត'],no:['❌','មិនអនុញ្ញាត']};
/* ready examples the boss can tap, then edit */
const EXAMPLES=[
 ['warn','⏰ មកយឺត','ថ្ងៃនេះអ្នកមកធ្វើការយឺតពីម៉ោងវេន។ សូមមកឲ្យទាន់ម៉ោង។ បើមានបញ្ហា សូមប្រាប់មេជាមុន។'],
 ['warn','📋 ភ្លេចការងារ','អ្នកមិនបានធ្វើការងារ ______ តាមបញ្ជីការងារ។ សូមកែតម្រូវ ហើយកុំឲ្យកើតឡើងម្ដងទៀត។'],
 ['warn','📝 ឯកសារភ្ញៀវខ្វះ','ហ្វមឆែកអ៊ីនបន្ទប់ ____ ខ្វះរូប Passport / ហត្ថលេខា។ សូមបំពេញឲ្យគ្រប់ថ្ងៃនេះ។'],
 ['shift','🔁 ប្ដូរវេន OK','មេអនុញ្ញាតឲ្យប្ដូរវេនថ្ងៃទី ____ ពីវេន ____ ទៅវេន ____។ សូមប្រាប់អ្នកជំនួសឲ្យច្បាស់។'],
 ['shift','🚫 ប្ដូរវេនមិនបាន','មិនអាចប្ដូរវេនបានទេ ព្រោះថ្ងៃនោះភ្ញៀវច្រើន / ខ្វះបុគ្គលិក។ សូមធ្វើការតាមវេនដដែល។'],
 ['info','📢 ប្រជុំ','សូមបុគ្គលិកទាំងអស់មកប្រជុំថ្ងៃទី ____ ម៉ោង ____ នៅកន្លែងទទួលភ្ញៀវ។'],
 ['info','👍 អរគុណ','អរគុណសម្រាប់ការខិតខំធ្វើការល្អ! បន្តធ្វើបែបនេះទៀត។']
];
const REPLY_EX={ok:['អនុញ្ញាត។ សូមប្រាប់អ្នកជំនួសឲ្យច្បាស់មុនឈប់។','អនុញ្ញាត។ សូមថែសុខភាព ឆាប់ជាសះស្បើយ។'],
                 no:['មិនអាចអនុញ្ញាតបានទេ ព្រោះថ្ងៃនោះភ្ញៀវពេញ / ខ្វះបុគ្គលិក។','សូមស្នើសុំជាមុនយ៉ាងតិច ៣ ថ្ងៃ។','សូមរកអ្នកជំនួសសិន រួចស្នើសុំម្ដងទៀត។']};

function W(){ const c=AC().get(); if(!c.work||typeof c.work!=='object') c.work={}; const w=c.work;
  if(!Array.isArray(w.msg)) w.msg=[]; return w; }
const msgs=()=>W().msg.filter(x=>x&&x.id&&x.at);
const shifts=()=>AC().get().shifts;
/* staff open the inbox by SHIFT or DEPARTMENT (names change, roles don't) */
const groups=()=>[...shifts().map(x=>({k:'s|'+x.id,t:{k:'s',v:x.id},ic:{m:'🌅',a:'🌇',n:'🌙'}[x.id]||'🕒',n:x.name,sub:x.start+'–'+x.end})),
  ...DEPTS.map(d=>({k:'d|'+d,t:{k:'d',v:d},ic:'👥',n:lbl(d),sub:d.split(' / ')[1]||''}))];
const grpByKey=k=>groups().find(g=>g.k===k)||null;
const toLbl=t=>{ if(!t||t.k==='all') return '📢 សារទូទៅរបស់ក្រុមហ៊ុន';
  if(t.k==='p') return '👤 '+t.v; if(t.k==='d') return '👥 ផ្នែក '+lbl(t.v);
  if(t.k==='s'){ const s=shifts().find(x=>x.id===t.v); return '🕒 '+(s?s.name:t.v); } return ''; };
const legacyP=(m,g)=>{ const st=AC().get().staff.find(x=>x.name===m.to.v); const d=(W().msgDept||{})[m.to.v]; return (g.t.k==='s'&&st&&st.shift===g.t.v)||(g.t.k==='d'&&d===g.t.v); };
const forMe=(m,k)=>{ const t=m.to||{k:'all'}, g=grpByKey(k); if(t.k==='all') return true; if(!g) return false;
  if(t.k==='p') return legacyP(m,g); return t.k===g.t.k&&t.v===g.t.v; };
const newId=()=>'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);

const css=document.createElement('style'); css.textContent=`
.mg-card{border:1px solid var(--line);border-left:6px solid var(--line);border-radius:14px;background:#fff;padding:12px 14px;margin:10px 0}
.mg-card.warn{border-left-color:var(--warn)}.mg-card.ok{border-left-color:var(--ok)}.mg-card.no{border-left-color:var(--bad)}.mg-card.shift{border-left-color:#3b6fb6}.mg-card.info{border-left-color:var(--accent)}
.mg-card.new{box-shadow:0 0 0 3px var(--warnbg)}
.mg-h{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between}
.mg-to{font-size:13px;color:var(--mute)}.mg-txt{white-space:pre-wrap;margin:8px 0 2px;font-size:16px;line-height:1.55}
.mg-req{background:var(--bg);border-radius:10px;padding:8px 10px;margin-top:8px;font-size:14px}
.mg-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.mg-chips button{font:inherit;font-size:14px;border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:6px 12px;cursor:pointer}
.mg-chips button.on{border-color:var(--brand);background:var(--brand);color:#fff}
.mg-names{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin:10px 0}
.mg-names button{font:inherit;border:2px solid var(--line);background:#fff;border-radius:14px;padding:14px 8px;cursor:pointer;font-size:17px}
.mg-names button small{display:block;color:var(--mute);font-size:12px;margin-top:3px}
.mg-badge{display:inline-block;min-width:20px;padding:0 6px;border-radius:99px;background:var(--bad);color:#fff;font-size:12px;text-align:center;margin-left:4px}
.mg-ban{display:block;text-decoration:none;color:inherit;margin:8px 0}
.mg-act{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.mg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
`; document.head.appendChild(css);

const money=$=>{ $=String($||'').trim(); return /^[\d.,]+$/.test($)?'$'+$:$; };
/* 💵 salary cut / ⚠️ policy charge shown on a message (pay: 'none' | 'cut') */
function payHtml(m){ if(!m.pay&&!m.charge) return '';
  const a=m.pay==='cut'?`💵 <b style="color:var(--bad)">កាត់ប្រាក់ខែ</b>${m.cut?' — '+esc(money(m.cut)):''}`:(m.pay==='none'?'💵 <b style="color:var(--ok)">មិនកាត់ប្រាក់ខែ</b>':'');
  const b=m.charge?`⚠️ <b style="color:var(--bad)">ពិន័យតាមគោលការណ៍ (Policy charge)</b> — ${esc(money(m.charge))}<br><span class="muted" style="font-size:13px">ព្រោះស្នើសុំ/ធ្វើក្នុងពេលដែលគោលការណ៍ក្រុមហ៊ុនមិនអនុញ្ញាត — ពិន័យនេះបូកបន្ថែមពីលើការកាត់ប្រាក់ខែ</span>`:'';
  return `<div class="mg-req" style="background:${m.pay==='cut'||m.charge?'var(--badbg)':'var(--okbg)'}">${[a,b].filter(Boolean).join('<br>')}</div>`; }
/* the 💵 / ⚠️ inputs (boss side) */
const payInputs=id=>`<div class="mg-pay" style="margin-top:8px"><label style="font-size:13px;display:block">💵 ប្រាក់ខែ</label>
  <div class="mg-chips"><button data-p="none" onclick="mgPay('${id}','none',this)">✅ មិនកាត់ប្រាក់ខែ</button><button data-p="cut" onclick="mgPay('${id}','cut',this)">✂️ កាត់ប្រាក់ខែ</button></div>
  <input id="${id}_cut" class="hide" placeholder="កាត់ប៉ុន្មាន? ឧ. 5 ឬ ១ ថ្ងៃ / ២ម៉ោង" maxlength="40">
  <label style="font-size:13px;display:block;margin-top:6px">⚠️ ពិន័យតាមគោលការណ៍ (Policy charge) — បំពេញតែពេលគោលការណ៍មិនអនុញ្ញាត ប៉ុន្តែនៅតែធ្វើ</label>
  <input id="${id}_chg" placeholder="ចំនួនពិន័យ ឧ. 10 (ទុកទទេ = គ្មាន)" maxlength="40"><input type="hidden" id="${id}_pay" value=""></div>`;
window.mgPay=(id,v,b)=>{ const h=$(id+'_pay'); const on=h.value!==v; h.value=on?v:''; b.parentElement.querySelectorAll('button').forEach(x=>x.classList.toggle('on',on&&x.dataset.p===v)); $(id+'_cut').classList.toggle('hide',!(on&&v==='cut')); };
const payOf=id=>{ const o={}, p=$(id+'_pay')&&$(id+'_pay').value; if(p) o.pay=p; const c=($(id+'_cut')||{}).value; if(p==='cut'&&c&&c.trim()) o.cut=c.trim().slice(0,40); const g=($(id+'_chg')||{}).value; if(g&&g.trim()) o.charge=g.trim().slice(0,40); return o; };
const payClear=id=>{ ['_cut','_chg','_pay'].forEach(k=>{ if($(id+k)) $(id+k).value=''; }); const w=$(id+'_pay'); if(w) w.closest('.mg-pay').querySelectorAll('button').forEach(x=>x.classList.remove('on')); if($(id+'_cut')) $(id+'_cut').classList.add('hide'); };
function msgCard(m,isNew,boss){ const c=CATS[m.cat]||CATS.info; const r=m.req;
  return `<div class="mg-card ${esc(m.cat||'info')}${isNew?' new':''}"><div class="mg-h"><b>${c[0]} ${esc(c[1])}${isNew?' <span class="pill warn">ថ្មី</span>':''}</b><span class="mg-to">${esc(when(m.at))}</span></div>
  <div class="mg-to">ពីមេ → ${esc(toLbl(m.to))}${m.who?` · 👤 សម្រាប់៖ <b>${esc(m.who)}</b>`:''}</div>
  ${r?`<div class="mg-req">📄 <b>សំណើ៖</b> ${esc(lbl(r.type||''))}${r.from?' · '+esc(fmtD(r.from)):''}${r.to&&r.to!==r.from?' → '+esc(fmtD(r.to)):''}${r.days?' ('+esc(r.days)+' ថ្ងៃ)':''}${r.reason?`<br><span class="muted">មូលហេតុ៖ ${esc(r.reason)}</span>`:''}</div>`:''}
  ${m.m?`<div class="mg-txt">${m.cat==='ok'||m.cat==='no'?'<b>ចម្លើយ / ហេតុផល៖</b> ':''}${esc(m.m)}</div>`:''}${payHtml(m)}
  ${boss?`<div class="mg-act"><button class="btn alt sm" style="color:var(--bad)" onclick="mgDel('${esc(m.id)}')">🗑 លុប</button></div>`:''}</div>`; }

/* =====================================================================
   STAFF SIDE  (#f/msg)
   ===================================================================== */
let ME='';
const seenSet=n=>new Set((jget(LS_SEEN,{})||{})[n]||[]);
function markSeen(n,ids){ const s=jget(LS_SEEN,{})||{}; s[n]=[...new Set([...(s[n]||[]),...ids])].slice(-200); jset(LS_SEEN,s); }
const isAll=m=>!m.to||m.to.k==='all';
const seenAny=id=>Object.values(jget(LS_SEEN,{})||{}).some(a=>Array.isArray(a)&&a.includes(id));
const unread=n=>{ if(n==='all') return msgs().filter(m=>isAll(m)&&!seenAny(m.id)).length; const S=seenSet(n); return msgs().filter(m=>!isAll(m)&&forMe(m,n)&&!S.has(m.id)).length; };
function mgRender(){ const host=$('gfBody'); if(!host) return; ME='';
  host.innerHTML=`<div id="mgMain"><p class="muted">⏳ កំពុងផ្ទុកសារ…</p></div>`;
  drawStaff();
  AC().load(deviceKey()||bossKey()).then(()=>drawStaff()); }
function drawStaff(){ const box=$('mgMain'); if(!box) return;
  if(!ME){ const G=groups(), mine=jget(LS_ME,[]);
    box.innerHTML=`<h2 style="margin-top:6px">💬 សារពីមេ / Messages</h2>
    <div style="text-align:center;font-weight:600">👇 ចុចវេន ឬ ផ្នែករបស់អ្នក</div>
    <div class="mg-names">${G.map((g,i)=>{ const u=unread(g.k); return `<button onclick="mgMe(${i})"><b>${mine.includes(g.k)?'★ ':''}${g.ic} ${esc(g.n)}</b>${u?`<span class="mg-badge">${u}</span>`:''}<small>${esc(g.sub)}</small></button>`; }).join('')}</div>
    <h3 style="margin-top:18px">📢 សារទូទៅរបស់ក្រុមហ៊ុន <span class="muted" style="font-size:13px;font-weight:400">— អ្នកណាក៏មើលបាន</span></h3>${(()=>{ const A=msgs().filter(m=>!m.to||m.to.k==='all'), h0=0; const h=A.map(m=>msgCard(m,!seenAny(m.id))).join(''); markSeen('all',A.map(m=>m.id)); return h||'<p class="muted">មិនទាន់មាន</p>'; })()}
    <p class="muted" style="font-size:13px">📄 ចង់ស្នើសុំច្បាប់ / ប្ដូរវេន / ឈប់? → <a href="#f/leave">បំពេញ «លិខិតស្នើសុំ»</a> ហើយត្រឡប់មកទីនេះដើម្បីមើលចម្លើយពីមេ (ក្នុងផ្នែករបស់អ្នក)។</p>`;
    return; }
  const g=grpByKey(ME); if(!g){ ME=''; return drawStaff(); }
  const S={has:id=>seenSet(ME).has(id)||seenAny(id)}, L=msgs().filter(m=>forMe(m,ME));
  box.innerHTML=`<div class="row" style="justify-content:space-between;flex-wrap:wrap"><h2 style="margin:6px 0">💬 ${g.ic} ${esc(g.n)}</h2><button class="btn alt sm" onclick="mgMe(-1)">← ប្ដូរវេន / ផ្នែក</button></div>
    <div class="muted" style="font-size:13px">${esc(g.sub)} · សារសម្រាប់ក្រុមនេះ + សារទូទៅរបស់ក្រុមហ៊ុន</div>
    ${L.length?L.map(m=>msgCard(m,!S.has(m.id))).join(''):'<p class="muted" style="margin:16px 0">មិនទាន់មានសារទេ ✨</p>'}
    <p class="muted" style="font-size:13px;margin-top:16px">⏳ បើអ្នកបានផ្ញើសំណើ ហើយមិនទាន់ឃើញចម្លើយ = មេកំពុងពិនិត្យ (ឬមើលក្នុងផ្នែកផ្សេង)។ · <a href="#f/leave">📄 ស្នើសុំថ្មី</a></p>`;
  markSeen(ME,L.map(m=>m.id)); }
window.mgMe=i=>{ if(i<0){ ME=''; return drawStaff(); } const g=groups()[i]; ME=g?g.k:''; const mine=jget(LS_ME,[]).filter(k=>grpByKey(k)); if(ME&&!mine.includes(ME)) jset(LS_ME,[ME,...mine].slice(0,3)); drawStaff(); window.scrollTo(0,0); };

DEFS.msg={icon:'💬',short:'សារពីមេ',title:'Messages from Boss',full:'សារពីមេ / Messages',
  sections:[],sigs:[],onRender:()=>mgRender(),
  date:r=>'',room:()=>'',name:()=>'',idn:()=>'',extra:()=>''};
if(!QR_TYPES.includes('msg')) QR_TYPES.splice(QR_TYPES.indexOf('decl'),0,'msg');

/* banner on the staff pages (Request form, Daily work, Attendance): "💬 សារពីមេ" + unread count for this device's names */
function staffBanner(){ const h=location.hash; if(!/^#f\/(leave|work|attend)$/.test(h)) return;
  const host=$('gfBody'); if(!host||host.querySelector('.mg-ban')) return;
  const mine=jget(LS_ME,[]).filter(k=>grpByKey(k)); const u=mine.reduce((s,n)=>s+unread(n),0)+unread('all');
  host.insertAdjacentHTML('afterbegin',`<a class="mg-ban" href="#f/msg"><div class="alert ${u?'warn':'ok'}" style="margin:6px 0">💬 <b>សារពីមេ / ចម្លើយសំណើ</b>${u?` <span class="mg-badge">${u} ថ្មី</span>`:''} — ចុចមើល →</div></a>`); }
function bannerSoon(){ [400,1500,4000].forEach(t=>setTimeout(staffBanner,t)); }
window.addEventListener('hashchange',bannerSoon);
const _wantLoad=()=>/^#f\/(leave|work|attend)$/.test(location.hash)&&AC().load(deviceKey()).then(()=>{ const b=document.querySelector('.mg-ban'); if(b) b.remove(); staffBanner(); });
window.addEventListener('hashchange',_wantLoad);

/* =====================================================================
   BOSS SIDE — tab 💬 សារ & សំណើ
   ===================================================================== */
let LEAVES=[];
const replyOf=id=>msgs().find(m=>m.ref===String(id));
async function pushMsgs(){ /* save the whole config, then read back to be sure the server kept the messages */
  const w=W(); const cut=Date.now()-MAX_DAYS*864e5;
  w.msg=msgs().filter(m=>Date.parse(m.at)>cut).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,MAX_MSG);
  while(w.msg.length>5&&JSON.stringify(AC().get()).length>45000) w.msg.pop();
  AC().set(AC().get());
  await api('setAttCfg',{key:bossKey(),cfg:AC().get()});
  const j=await api('attCfg',{key:bossKey()}); const r=j&&j.cfg&&j.cfg.work;
  const ok=!!(r&&JSON.stringify(r.msg||[])===JSON.stringify(W().msg)); if(j&&j.cfg) AC().set(j.cfg); return ok; }
async function freshCfg(){ try{ await AC().load(bossKey()); }catch(e){} }
const NOKEEP='⚠️ ម៉ាស៊ីនមេមិនបានរក្សាសារ — សូមព្យាយាមម្ដងទៀត ឬប្រាប់ Claude';

function injectBoss(){
  if($('t-msg')||!$('tabs')) return;
  const b=document.createElement('button'); b.dataset.t='msg'; b.innerHTML='💬 សារ & សំណើ<span id="mgTabN"></span>';
  const anchor=document.querySelector('#tabs button[data-t="work"]')||document.querySelector('#tabs button[data-t="attend"]'); anchor?anchor.after(b):$('tabs').appendChild(b);
  const sec=document.createElement('section'); sec.id='t-msg'; sec.className='hide';
  sec.innerHTML=`<div class="row" style="flex-wrap:wrap;gap:8px"><a class="btn alt sm" href="#f/msg" target="_blank" rel="noopener" style="text-decoration:none">💬 បើកទំព័របុគ្គលិក</a><span class="muted" style="font-size:13px">បុគ្គលិកមើលសារតាម QR «💬 សារពីមេ» ឬ ទំព័រ #f/msg</span></div>
  <div class="mg-grid" style="margin-top:12px">
    <div><h2 style="margin-top:0">⏳ សំណើរង់ចាំចម្លើយ</h2><div id="mgPend"></div>
      <details style="margin-top:10px"><summary style="cursor:pointer;font-weight:700">✔ សំណើដែលបានឆ្លើយរួច</summary><div id="mgDone"></div></details></div>
    <div><div class="card"><h2 style="margin-top:0">✉️ ផ្ញើសារថ្មី</h2>
      <label>ផ្ញើទៅ / To (វេន ឬ ផ្នែក)</label><select id="mgTo"></select>
      <input id="mgWho" maxlength="60" placeholder="👤 សម្រាប់អ្នកណា? (ឈ្មោះ — មិនចាំបាច់)" style="margin-top:6px">
      <label style="margin-top:8px;display:block">ប្រភេទ</label><div class="mg-chips" id="mgCat"></div>
      <label style="margin-top:4px;display:block">ឧទាហរណ៍ (ចុចដើម្បីបញ្ចូល ហើយកែបាន)</label><div class="mg-chips" id="mgEx"></div>
      <textarea id="mgTxt" maxlength="${MAX_TXT}" rows="4" placeholder="សរសេរសារ…"></textarea>${payInputs('mgNew')}
      <button class="btn big" id="mgSend" onclick="mgSend()" style="margin-top:8px">📤 ផ្ញើ</button><p id="mgSendMsg" class="muted"></p></div>
      <h2>📜 សារបានផ្ញើ</h2><div id="mgSent"></div></div>
  </div>`;
  const main=document.querySelector('#bossApp main'); const prev=$('t-work')||$('t-attend'); prev?prev.after(sec):main.appendChild(sec);
  freshCfg().then(mgBoss);
}
let CAT='info';
function drawCompose(){ const sel=$('mgTo'); if(!sel) return; const cur=sel.value||'all';
  sel.innerHTML=grpOpts(cur);
  $('mgCat').innerHTML=['info','warn','shift'].map(k=>`<button class="${k===CAT?'on':''}" onclick="mgCat('${k}')">${CATS[k][0]} ${esc(CATS[k][1])}</button>`).join('');
  $('mgEx').innerHTML=EXAMPLES.map((e,i)=>`<button onclick="mgEx(${i})">${esc(e[1])}</button>`).join(''); }
window.mgCat=k=>{ CAT=k; drawCompose(); };
window.mgEx=i=>{ const e=EXAMPLES[i]; CAT=e[0]; $('mgTxt').value=e[2]; drawCompose(); $('mgTxt').focus(); };
function parseTo(v){ if(!v||v==='all') return {k:'all'}; const i=v.indexOf('|'); return {k:v.slice(0,i),v:v.slice(i+1)}; }
window.mgSend=async()=>{ const t=$('mgTxt').value.trim().slice(0,MAX_TXT); if(!t) return alert('សូមសរសេរសារ'); const to=parseTo($('mgTo').value), who=$('mgWho').value.trim().slice(0,60);
  if(!confirm(`ផ្ញើសារទៅ ${toLbl(to)}${who?' · '+who:''}?`)) return;
  const b=$('mgSend'); b.disabled=true; b.textContent='⏳ កំពុងផ្ញើ…';
  try{ await freshCfg(); W().msg.unshift({id:newId(),at:new Date().toISOString(),to,...(who?{who}:{}),cat:CAT,m:t,...payOf('mgNew')}); const ok=await pushMsgs();
    $('mgSendMsg').textContent=ok?'✅ ផ្ញើរួច — បុគ្គលិកនឹងឃើញពេលបើក «💬 សារពីមេ»':NOKEEP; $('mgSendMsg').style.color=ok?'var(--ok)':'var(--bad)'; if(ok){ $('mgTxt').value=''; $('mgWho').value=''; payClear('mgNew'); } mgBoss(); }
  catch(e){ alert('ផ្ញើមិនបាន៖ '+e.message); }
  b.disabled=false; b.textContent='📤 ផ្ញើ'; };
window.mgDel=async id=>{ if(!confirm('🗑 លុបសារនេះ? បុគ្គលិកនឹងលែងឃើញ។')) return;
  try{ await freshCfg(); W().msg=msgs().filter(m=>m.id!==id); await pushMsgs(); mgBoss(); }catch(e){ alert('លុបមិនបាន៖ '+e.message); } };

function grpOpts(sel){ return `<option value="all" ${sel==='all'?'selected':''}>📢 សារទូទៅរបស់ក្រុមហ៊ុន — អ្នកណាក៏មើលបាន</option><optgroup label="🕒 វេន">${shifts().map(x=>`<option value="s|${esc(x.id)}" ${sel==='s|'+x.id?'selected':''}>🕒 ${esc(x.name)} ${esc(x.start)}–${esc(x.end)}</option>`).join('')}</optgroup>
   <optgroup label="👥 ផ្នែក / ជំនាញ">${DEPTS.map(d=>`<option value="d|${esc(d)}" ${sel==='d|'+d?'selected':''}>👥 ${esc(d)}</option>`).join('')}</optgroup>`; }
function reqCard(r,i){ const rp=replyOf(r._id);
  const info=`<b>${esc(r.name||'—')}</b> <span class="muted">${esc(lbl(r.position||''))}</span><br>📄 ${esc(lbl(r.leaveType||''))}${r.halfday?' · '+esc(lbl(r.halfday)):''}${r.other?' · '+esc(r.other):''}<br>📅 ${esc(fmtD(r.fromDate))}${r.toDate&&r.toDate!==r.fromDate?' → '+esc(fmtD(r.toDate)):''}${r.totalDays?' · '+esc(r.totalDays)+' ថ្ងៃ':''}
    ${r.reason?`<div class="mg-txt" style="font-size:14px">💭 ${esc(r.reason)}</div>`:''}${r.covering?`<div class="muted" style="font-size:13px">អ្នកជំនួស៖ ${esc(r.covering)}</div>`:''}`;
  if(rp) return `<div class="mg-card ${rp.cat}">${info}<div class="mg-req">${rp.cat==='ok'?'✅ អនុញ្ញាត':'❌ មិនអនុញ្ញាត'} · ${esc(when(rp.at))} → ${esc(toLbl(rp.to))}${rp.m?`<br>${esc(rp.m)}`:''}</div>${payHtml(rp)}
    <div class="mg-act"><button class="btn alt sm" onclick="mgDel('${esc(rp.id)}')">↩ ដកចម្លើយ</button><button class="btn alt sm" onclick="openRecord('${esc(r._id)}')">📄 មើលហ្វម</button></div></div>`;
  const def=DEPTS.includes(r.position)?'d|'+r.position:'all';
  return `<div class="mg-card warn">${info}
    <label style="margin-top:8px;display:block;font-size:13px">ផ្ញើចម្លើយទៅ (វេន / ផ្នែក)</label><select id="mgRto_${i}">${grpOpts(def)}</select>
    <textarea id="mgRtx_${i}" rows="2" maxlength="${MAX_TXT}" placeholder="ហេតុផល / ចំណាំ (មិនចាំបាច់)" style="margin-top:6px"></textarea>${payInputs('mgRp_'+i)}
    <div class="mg-chips">${REPLY_EX.ok.map(t=>`<button onclick="$('mgRtx_${i}').value=this.textContent">${esc(t)}</button>`).join('')}${REPLY_EX.no.map(t=>`<button onclick="$('mgRtx_${i}').value=this.textContent">${esc(t)}</button>`).join('')}</div>
    <div class="mg-act"><button class="btn" style="background:var(--ok);border-color:var(--ok)" onclick="mgReply(${i},'ok')">✅ អនុញ្ញាត</button><button class="btn" style="background:var(--bad);border-color:var(--bad)" onclick="mgReply(${i},'no')">❌ មិនអនុញ្ញាត</button><button class="btn alt sm" onclick="openRecord('${esc(r._id)}')">📄 មើលហ្វម</button></div></div>`; }
window.mgReply=async(i,st)=>{ const r=LEAVES[i]; if(!r) return; const to=parseTo($('mgRto_'+i).value), t=$('mgRtx_'+i).value.trim().slice(0,MAX_TXT);
  if(st==='no'&&!t&&!confirm('មិនទាន់សរសេរហេតុផលទេ។ ផ្ញើ «មិនអនុញ្ញាត» ដោយគ្មានហេតុផល?')) return;
  try{ await freshCfg(); const w=W();
    w.msg=msgs().filter(m=>m.ref!==String(r._id));
    w.msg.unshift({id:newId(),at:new Date().toISOString(),to,who:String(r.name||'').slice(0,60),cat:st,m:t,ref:String(r._id),...payOf('mgRp_'+i),
      req:{type:r.leaveType||'',from:r.fromDate||'',to:r.toDate||'',days:r.totalDays||'',reason:String(r.reason||'').slice(0,200)}});
    const ok=await pushMsgs(); if(!ok) alert(NOKEEP); mgBoss(); }
  catch(e){ alert('ផ្ញើមិនបាន៖ '+e.message); } };
function pendingCount(){ return LEAVES.filter(r=>!replyOf(r._id)).length; }
function mgBoss(){ if(!$('t-msg')) return;
  const P=[],D=[]; LEAVES.forEach((r,i)=>(replyOf(r._id)?D:P).push(reqCard(r,i)));
  $('mgPend').innerHTML=P.join('')||'<p class="muted">✨ គ្មានសំណើរង់ចាំទេ</p>';
  $('mgDone').innerHTML=D.slice(0,30).join('')||'<p class="muted">មិនទាន់មាន</p>';
  $('mgSent').innerHTML=msgs().filter(m=>!m.ref).slice(0,30).map(m=>msgCard(m,false,true)).join('')||'<p class="muted">មិនទាន់មានសារ</p>';
  const n=pendingCount(); const tn=$('mgTabN'); if(tn) tn.innerHTML=n?`<span class="mg-badge">${n}</span>`:'';
  drawCompose();
  const tile=document.querySelector('#launcher [data-mg] .ts'); if(tile) tile.textContent=n?`⏳ ${n} សំណើរង់ចាំ`:'ផ្ញើសារទៅបុគ្គលិក'; }

/* collect the staff Request Forms (newest first, last 90 days) whenever the boss data reloads */
const _renderAll=window.renderAll;
window.renderAll=renderAll=function(){
  const cut=new Date(Date.now()-90*864e5).toISOString().slice(0,10);
  LEAVES=(Array.isArray(S.forms)?S.forms:[]).filter(r=>r.type==='leave'&&r._id&&String(r.fromDate||r.at||'')>=cut)
    .sort((a,b)=>String(b.at||b.fromDate||'').localeCompare(String(a.at||a.fromDate||'')));
  _renderAll.apply(this,arguments); injectBoss(); mgBoss();
};
const _launch=window.renderLauncher;
window.renderLauncher=renderLauncher=function(){ _launch.apply(this,arguments); const L=$('launcher'); if(!L||L.querySelector('[data-mg]')) return;
  const n=pendingCount(); const d=document.createElement('button'); d.setAttribute('data-mg','1'); d.className='tile'; d.onclick=()=>showTab('msg');
  d.innerHTML=`<span class="ti">💬</span><b>សារ & សំណើ</b><span class="ts">${n?'⏳ '+n+' សំណើរង់ចាំ':'ផ្ញើសារទៅបុគ្គលិក'}</span>`;
  const a=L.querySelector('[data-wk]')||L.querySelector('[data-att]'); a?a.after(d):L.prepend(d); };
function homeLink(){ const h=$('homeList'); if(h&&!h.querySelector('[href="#f/msg"]')) h.insertAdjacentHTML('afterbegin',`<a href="#f/msg"><div class="card"><h3>💬 សារពីមេ / ចម្លើយសំណើ</h3><div class="muted">បុគ្គលិកចុចឈ្មោះខ្លួនឯង ដើម្បីមើលសារ និងចម្លើយពីមេ</div></div></a>`); }
window.addEventListener('hashchange',homeLink);
if(location.hash==='#f/msg') route(); else { homeLink(); bannerSoon(); _wantLoad(); }
if($('bossApp')&&!$('bossApp').classList.contains('hide')){ injectBoss(); mgBoss(); }
})();
