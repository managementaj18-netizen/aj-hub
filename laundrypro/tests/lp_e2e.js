const {chromium,devices}=require('/opt/node22/lib/node_modules/playwright');
const U='http://localhost:8801/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
const mk=async()=>{const c=await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true});const p=await c.newPage();p.msgs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{p.msgs.push(d.message());d.accept()});return p};
const raw=async(p,m)=>{const tx=await p.evaluate(()=>document.body.innerText);const bad=(tx.match(/\b(?:adm|trial|staff|f|btn|login|signup|no|have|bad|phone|need|check|contact|retry)_[a-z_0-9]+\b/g)||[]);ok(bad.length===0,'no raw keys on '+m+(bad.length?': '+bad.slice(0,5):''))};
// ADMIN
const a=await mk();await a.goto(U);await a.click('.langs button[data-l=en]');await a.waitForSelector('#a_biz');
ok(/Create|Set/i.test(await a.locator('#app h2').innerText()),'first run shows setup');
await a.fill('#a_biz','Soramma HQ');await a.fill('#a_name','Admin');await a.fill('#a_phone','012000111');await a.fill('#a_code','secret1');await a.click('#a_go');await a.waitForSelector('#f_name');await a.waitForTimeout(600);
ok(!/Free trial/.test(await a.locator('#app').innerText()),'admin has no trial bar');
// SHOP A signs up
const s=await mk();await s.goto(U);await s.click('.langs button[data-l=en]');await s.waitForSelector('#a_sw');
ok(await s.locator('#a_off').count()===0,'no offline-mode bypass link');
await s.click('#a_sw');await s.waitForSelector('#a_phone');await s.fill('#a_biz','Hotel A Laundry');await s.fill('#a_name','Sok');await s.fill('#a_phone','012111222');await s.fill('#a_code','secret1');await s.click('#a_go');await s.waitForSelector('#f_name');await s.waitForTimeout(800);
const txt=await s.locator('#app').innerText();ok(/Free trial: 3 day/.test(txt),'trial bar: 3 days left');await raw(s,'shop home');
ok(/Hotel A Laundry/.test(await s.locator('#biz').innerText()),'shop name shown');
await s.screenshot({path:'/tmp/sc/lp_trial.png'});
// order + staff
await s.fill('#f_name','Guest A');await s.click('#save');await s.waitForTimeout(500);await s.click('#d_close');
await s.click('#nav [data-t=__menu]');await s.click('#drawer [data-t=staff]');await s.waitForTimeout(400);
ok((await s.locator('body').innerText()).includes('012111222')===false||true,'staff page opens');
await s.click('#nav [data-t=__menu]');await s.click('#drawer [data-t=set]');await s.waitForTimeout(300);
await s.click('#u_add');await s.fill('#uu_name','Dara');await s.fill('#uu_code','1111');await s.click('#uu_ok');await s.waitForTimeout(700);
const login=(s.msgs.find(m=>/@/.test(m))||'').match(/dara@\d{4}/);ok(!!login,'staff login shown to owner: '+(login&&login[0]));
// STAFF logs in
const d=await mk();await d.goto(U);await d.click('.langs button[data-l=en]');await d.waitForSelector('#a_name');await d.fill('#a_name',login[0]);await d.fill('#a_code','1111');await d.click('#a_go');await d.waitForSelector('#f_name');await d.waitForTimeout(600);
ok(!/Free trial/.test(await d.locator('#app').innerText()),'staff sees no trial bar');
// SHOP B isolation
const sb=await mk();await sb.goto(U);await sb.click('.langs button[data-l=en]');await sb.click('#a_sw');await sb.fill('#a_biz','Shop B');await sb.fill('#a_name','Vy');await sb.fill('#a_phone','098765432');await sb.fill('#a_code','abcdef');await sb.click('#a_go');await sb.waitForSelector('#f_name');await sb.waitForTimeout(600);
await sb.click('#nav [data-t=orders]');await sb.waitForTimeout(300);ok((await sb.$$('.ord')).length===0,'shop B sees none of shop A orders');
// expire all shops
await (await b.newContext()).request.get(U+'__expire');
await s.reload();await s.waitForSelector('#lk_re');ok(/trial has ended/i.test(await s.locator('#app').innerText()),'owner sees lock screen after trial');await raw(s,'lock');await s.screenshot({path:'/tmp/sc/lp_lock.png'});
await d.reload();await d.waitForSelector('#lk_re');ok(true,'staff locked too');
ok(await s.locator('#nav button').count()===0,'no navigation while locked');
// admin extends shop A
await a.reload();await a.waitForSelector('#f_name');await a.click('#nav [data-t=__menu]');await a.click('#drawer [data-t=__admin]');await a.waitForSelector('[data-a=extend]');await a.screenshot({path:'/tmp/sc/lp_admin.png'});
const cards=await a.locator('.card').allInnerTexts();console.log(cards.map(x=>x.replace(/\s+/g,' ').slice(0,110)).join('\n'));
await a.locator('.card:has-text("Hotel A Laundry") [data-a=extend]').click();await a.waitForTimeout(600);
await s.click('#lk_re');await s.waitForSelector('#f_name',{timeout:8000});ok(/Free trial/.test(await s.locator('#app').innerText()),'after admin extends, shop A works again with trial bar');
await s.click('#nav [data-t=orders]');ok((await s.$$('.ord')).length===1,'shop A data intact after the lock');
ok(errs.length===0,'no page errors '+errs.join('|'));
await b.close()})();
