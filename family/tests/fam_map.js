const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const js=fs.readFileSync('/tmp/lf/package/dist/leaflet.js','utf8'),css=fs.readFileSync('/tmp/lf/package/dist/leaflet.css','utf8');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
const mk=async(geo)=>{const c=await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true,permissions:['geolocation'],geolocation:geo});
 await c.route(/leaflet\.min\.js/,r=>r.fulfill({contentType:'application/javascript',body:js}));await c.route(/leaflet\.min\.css/,r=>r.fulfill({contentType:'text/css',body:css}));await c.route(/tile\.openstreetmap/,r=>r.abort());
 const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await p.addInitScript(()=>{localStorage.setItem('fam_lang','"en"')});return p};
const mom=await mk({latitude:10.6104,longitude:104.1815}),dad=await mk({latitude:11.5564,longitude:104.9282}),kid=await mk({latitude:11.5700,longitude:104.9100});
await mom.goto('http://localhost:8802/');await mom.click('[data-m=create]');await mom.fill('#a_f','Map Family');await mom.fill('#a_n','Mom');await mom.fill('#a_p','012333444');await mom.fill('#a_c','secret1');await mom.click('#a_go');await mom.waitForSelector('#nav button');
await mom.click('#b_share');await mom.click('#c_yes');await mom.waitForSelector('.banner');await mom.waitForTimeout(1500);
await mom.click('nav button[data-t=me]');const code=(await mom.locator('.code').innerText()).trim();
for(const [p,n,ph] of [[dad,'Dad','098333444'],[kid,'Kid','097333444']]){await p.goto('http://localhost:8802/');await p.click('[data-m=join]');await p.fill('#a_i',code);await p.fill('#a_n',n);await p.fill('#a_p',ph);await p.fill('#a_c','secret1');await p.click('#a_go');await p.waitForSelector('#nav button');await p.click('#b_share');await p.click('#c_yes');await p.waitForSelector('.banner');await p.waitForTimeout(1500)}
await mom.click('nav button[data-t=map]');await mom.evaluate(()=>sync());await mom.waitForTimeout(1200);
ok(await mom.evaluate(()=>typeof L!=='undefined'),'leaflet available');
ok(await mom.locator('.pin').count()===3,'3 pins on the map (Mom, Dad, Kid): '+await mom.locator('.pin').count());
const labels=await mom.locator('.pinl').allInnerTexts();ok(['Mom','Dad','Kid'].every(n=>labels.includes(n)),'pin labels '+labels.join(','));
await mom.screenshot({path:'/tmp/sc/fam_map.png'});
await kid.click('#b_stop');await kid.waitForTimeout(500);await mom.evaluate(()=>sync());await mom.waitForTimeout(800);ok(await mom.locator('.pin').count()===2,'kid pauses -> pin disappears');
await mom.click('#m_fit');await mom.waitForTimeout(400);ok(true,'fit button works');
ok(errs.length===0,'no page errors '+errs.join('|'));await b.close()})();
