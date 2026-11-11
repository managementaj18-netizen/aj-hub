/* A&J Hub — boss home layout: a KPI strip on top, then the tiles grouped by area.
   Every other script still adds its own tile to #launcher; this runs last and only rearranges them. */
(function(){
const GROUPS=[
  {k:'ops',  t:'ប្រតិបត្តិការប្រចាំថ្ងៃ', e:'Daily operations', m:['ថ្ងៃនេះ','រង់ចាំ Check-in','Booking Board','Booking','Housekeeping','Inhouse Report','ស្តុក & ភេសជ្ជៈ']},
  {k:'forms',t:'ហ្វមភ្ញៀវ',               e:'Guest forms',      m:['ហ្វមទាំងអស់','ហ្វម Booking','ហ្វមឆែកអ៊ីន','ភ្ញៀវមក-ចេញ','ភ្ញៀវរួម','លិខិតធានា','លុបចោលបន្ទប់','ផ្ញើឥវ៉ាន់']},
  {k:'staff',t:'បុគ្គលិក',                 e:'Staff',            m:['សារ & សំណើ','វត្តមានបុគ្គលិក','ការងារប្រចាំថ្ងៃ','សំណើច្បាប់','យាមខាងក្រៅ','ប្រាក់ខែ','ច្បាប់ការងារ']},
  {k:'sys',  t:'របាយការណ៍ & ប្រព័ន្ធ',     e:'Reports & system', m:['របាយការណ៍ខែ','ឯកសារប្រចាំសប្តាហ៍','Backup','លីងថេប្លេត','pmsuite','Guest Declaration']}
];
const num=s=>{ const m=String(s||'').match(/\d+/); return m?+m[0]:0; };
function kpis(L, tiles){
  const sub=name=>{ const b=tiles.find(x=>x.querySelector('b')?.textContent.trim()===name); return b?b.querySelector('.ts')?.textContent||'':''; };
  const go=name=>{ const b=tiles.find(x=>x.querySelector('b')?.textContent.trim()===name); return b?b:null; };
  let arr=0,inh=0;
  try{ const day=todayStr(), live=b=>!/cancel/i.test(b.status); arr=S.bk.filter(b=>b.start===day&&live(b)).length; inh=S.bk.filter(b=>b.start<=day&&bkEnd(b)>day&&live(b)).length; }catch(e){}
  const K=[
    {n:arr, l:'មកដល់ថ្ងៃនេះ', s:'Arrivals', t:'ថ្ងៃនេះ'},
    {n:inh, l:'កំពុងស្នាក់នៅ', s:'In-house', t:'ថ្ងៃនេះ'},
    {n:num(sub('រង់ចាំ Check-in')), l:'រង់ចាំ Check-in', s:'Waiting', t:'រង់ចាំ Check-in', warn:1},
    {n:num(sub('Housekeeping')), l:'បន្ទប់ត្រូវសម្អាត', s:'To clean', t:'Housekeeping', warn:1},
    {n:num(sub('សារ & សំណើ')), l:'សំណើរង់ចាំ', s:'Requests', t:'សារ & សំណើ', warn:1},
    {n:num(sub('ស្តុក & ភេសជ្ជៈ')), l:'ស្តុកជិតអស់', s:'Low stock', t:'ស្តុក & ភេសជ្ជៈ', warn:1}
  ];
  const strip=document.createElement('div'); strip.className='kpis';
  K.forEach(k=>{ const c=document.createElement('button'); c.type='button'; c.className='kpi'+(k.warn&&k.n>0?' hot':'');
    c.innerHTML=`<span class="kn">${k.n}</span><span class="kl">${k.l}</span><span class="ks">${k.s}</span>`;
    const t=go(k.t); if(t) c.onclick=()=>t.click(); strip.appendChild(c); });
  return strip;
}
function arrange(){
  const L=document.getElementById('launcher'); if(!L) return;
  const tiles=[...L.querySelectorAll('.tile')]; if(!tiles.length) return;
  const name=b=>(b.querySelector('b')?.textContent||'').trim();
  const wrap=document.createElement('div'); wrap.className='home2';
  wrap.appendChild(kpis(L,tiles));
  const used=new Set();
  const all=[...GROUPS,{k:'other',t:'ផ្សេងៗ',e:'Other',m:[]}];
  all.forEach(g=>{
    const list=g.k==='other'?tiles.filter(b=>!used.has(b)):g.m.map(n=>tiles.find(b=>name(b)===n)).filter(Boolean);
    if(!list.length) return;
    const sec=document.createElement('section'); sec.className='hgrp';
    sec.innerHTML=`<div class="hgh"><span>${g.t}</span><small>${g.e}</small></div>`;
    const grid=document.createElement('div'); grid.className='hgrid';
    list.forEach(b=>{ used.add(b); const ts=b.querySelector('.ts'); if(ts&&/⏳|ត្រូវ|ជិតអស់|រង់ចាំ/.test(ts.textContent)&&num(ts.textContent)>0) b.classList.add('due'); grid.appendChild(b); });
    sec.appendChild(grid); wrap.appendChild(sec);
  });
  L.innerHTML=''; L.classList.add('arranged'); L.appendChild(wrap);
}
const prev=window.renderLauncher;
if(typeof prev==='function'){
  window.renderLauncher=renderLauncher=function(){ prev.apply(this,arguments); try{ arrange(); }catch(e){ console.warn('home layout',e); } };
  if(document.getElementById('launcher')&&document.getElementById('bossApp')&&!document.getElementById('bossApp').classList.contains('hide')) try{ renderLauncher(); }catch(e){}
}
})();
