const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const U='http://localhost:8802/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
const mk=async(geo)=>{const c=await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true,permissions:['geolocation'],geolocation:geo});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await p.addInitScript(()=>{localStorage.setItem('fam_lang','"en"')});return p};
const raw=async(p,m)=>{const tx=await p.evaluate(()=>document.body.innerText);const bad=(tx.match(/\b(?:e|st|fit|sharing|consent|code|keep|ago|open|loc)_[a-z_0-9]+\b/g)||[]);ok(bad.length===0,'no raw keys on '+m+(bad.length?': '+bad.slice(0,4):''))};
// Mom
const mom=await mk({latitude:10.6104,longitude:104.1815});await mom.goto(U);await mom.waitForSelector('#a_go');
ok(!(await mom.locator('#a_n').count()),'login screen first');
await mom.click('[data-m=create]');await mom.fill('#a_f','Sam Family');await mom.fill('#a_n','Mom');await mom.fill('#a_p','012111222');await mom.fill('#a_c','secret1');await mom.click('#a_go');
await mom.waitForSelector('#nav button');await mom.waitForTimeout(500);await raw(mom,'map');
ok(await mom.locator('#b_share').count()===1,'nobody shares by default (share button offered)');
await mom.click('nav button[data-t=me]');const code=(await mom.locator('.code').innerText()).trim();ok(/^\d{6}$/.test(code),'invite code '+code);
// Dad joins
const dad=await mk({latitude:11.5564,longitude:104.9282});await dad.goto(U);await dad.click('[data-m=join]');await dad.fill('#a_i',code);await dad.fill('#a_n','Dad');await dad.fill('#a_p','098111111');await dad.fill('#a_c','secret1');await dad.click('#a_go');await dad.waitForSelector('#nav button');
await dad.click('nav button[data-t=people]');ok((await dad.locator('.mem').count())===2,'dad sees both family members');
ok(await dad.locator('.pill.off').count()===2,'nobody is shown as sharing yet');
// Dad agrees to share (consent dialog)
await dad.click('#b_share');await dad.waitForSelector('#c_yes');ok(/Everyone in your family/.test(await dad.locator('#dbody').innerText()),'consent explained before sharing');
await dad.click('#c_no');ok(await dad.locator('.banner').count()===0,'cancel = not sharing');
await dad.click('#b_share');await dad.click('#c_yes');await dad.waitForSelector('.banner');await dad.waitForTimeout(1800);
// Mom sees Dad
await mom.click('nav button[data-t=people]');await mom.waitForTimeout(300);await mom.evaluate(()=>sync());await mom.waitForTimeout(600);
const dadRow=await mom.locator('.mem:has-text("Dad")').innerText();ok(/Sharing/.test(dadRow)&&/Last seen/.test(dadRow),'mom sees Dad sharing: '+dadRow.replace(/\s+/g,' '));
const href=await mom.locator('.mem:has-text("Dad") a').getAttribute('href');ok(/google\.com\/maps\?q=11\.5564,104\.9282/.test(href),'Google Maps link with Dad position');
ok(!/Last seen/.test(await mom.locator('.mem:has-text("Mom")').innerText()),'mom herself not sharing');
await mom.screenshot({path:'/tmp/sc/fam_people.png'});
// map view
await mom.click('nav button[data-t=map]');await mom.waitForTimeout(800);const hasL=await mom.evaluate(()=>typeof L!=='undefined');console.log('leaflet loaded:',hasL);
if(hasL){ok(await mom.locator('.pin').count()===1,'one pin on the map (Dad)');await mom.screenshot({path:'/tmp/sc/fam_map.png'})}
// Dad pauses -> disappears
await dad.click('#b_stop');await dad.waitForTimeout(600);await mom.evaluate(()=>sync());await mom.waitForTimeout(500);await mom.click('nav button[data-t=people]');
ok(/Not sharing/.test(await mom.locator('.mem:has-text("Dad")').innerText())&&(await mom.locator('.mem:has-text("Dad") a').count())===0,'after Dad pauses, mom cannot see him');
// owner removes / leave
await mom.click('nav button[data-t=me]');await mom.click('[data-rm]');await mom.waitForTimeout(500);ok(await mom.locator('[data-rm]').count()===0,'owner removed Dad');
await raw(mom,'me');
await mom.click('#o_lang');ok(/ក/.test(await mom.locator('#app').innerText()),'Khmer UI');await raw(mom,'me (km)');
ok(errs.length===0,'no page errors '+errs.join('|'));
await b.close()})();
