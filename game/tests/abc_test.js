const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/user/aj-hub/game/public';
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'application/octet-stream'});r.end(d)})}).listen(8807);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
const c=await b.newContext({viewport:{width:430,height:860},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__said=[];
 window.SpeechSynthesisUtterance=function(t){this.text=t};
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__said.push(u.text.replace(/\.$/,''));setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return[{name:'Robot espeak',lang:'en-US'},{name:'Samantha',lang:'en-US'},{name:'Daniel',lang:'en-GB'},{name:'Thai',lang:'th-TH'}]},onvoiceschanged:null}})});
await p.goto('http://localhost:8807/abc/');await p.waitForSelector('.w');
ok((await p.locator('.w').count())===6,'6 story worlds to choose from');ok(/English Friends/.test(await p.locator('#tTitle').innerText()),'English title');
// every world has 6 words with Khmer meaning and a picture
ok(await p.evaluate(()=>EF.WORLDS.every(w=>w.words.length===6&&w.words.every(x=>x[0]&&x[1]&&x[2]))),'every world: 6 English words, each with a picture');
await p.screenshot({path:'/tmp/sc/abc_menu.png'});
await p.tap('.w[data-i="0"]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>AC&&AC.state==='running'),'sound engine unlocked by the first touch (iPhone)');
ok(/farm/i.test(await p.locator('#stT').innerText()),'story intro shown (English)');await p.screenshot({path:'/tmp/sc/abc_story.png'});
await p.tap('#stGo');await p.waitForTimeout(1300);
ok(await p.locator('#sPlay:not(.hide)').count()===1&&(await p.locator('.opt').count())===3,'round 1: 3 pictures to choose from');
ok(await p.locator('.opt .lab').count()===3,'first half: each picture shows its English word so the child can read and tap');
let said=await p.evaluate(()=>EF.SPOKEN);ok(said.length>=1&&said[0]===(await p.evaluate(()=>EF.G.target[0])),'the English word is spoken: '+said[0]);
ok(await p.evaluate(()=>Object.keys(EF.AB).length)===36,'all 36 clear voice files were downloaded');
ok(await p.evaluate(()=>EF.PLAYED.length>=1),'the clear recorded voice is played (not the phone voice)');
await p.screenshot({path:'/tmp/sc/abc_play.png'});
// wrong answer: no penalty, hears word again, hint after 2 wrong
const tg=await p.evaluate(()=>EF.G.target[0]);
const wrongSel=`.opt:not([data-w="${tg}"])`;
await p.locator(wrongSel).first().tap();await p.waitForTimeout(700);
ok(/Try again/.test(await p.locator('#pB').innerText()),'wrong tap: gentle message, no penalty');ok((await p.evaluate(()=>EF.SPOKEN.filter(w=>w===EF.G.target[0]).length))>=2,'the word is said again');
await p.locator(wrongSel).nth(1).tap();await p.waitForTimeout(300);
ok(await p.locator('.opt.hint').count()===1,'after 2 mistakes the right picture pulses as a hint');
const stars0=await p.evaluate(()=>+JSON.parse(localStorage.ef_stars||0));
await p.locator(`.opt[data-w="${tg}"]`).tap();await p.waitForTimeout(200);
ok(await p.evaluate(()=>+JSON.parse(localStorage.ef_stars))===stars0+1,'right tap gives a star');ok(await p.locator('.opt.right').count()===1,'right card celebrates');
// play through the whole world (pick + spell rounds)
let spelled=0;
// after a right answer the game WAITS: the child taps Next (no sudden jump)
await p.waitForTimeout(1300);ok(await p.locator('#pNext:not(.hide)').count()===1,'after a right answer a Next button appears (child controls the pace)');
await p.waitForTimeout(2500);ok(await p.evaluate(()=>EF.G.r)===0,'the game does not jump to the next question by itself');
await p.locator('#pNext').tap();await p.waitForTimeout(500);
let hid=false;for(let i=0;i<16;i++){
 if(await p.locator('#sDone:not(.hide)').count())break;
 if(await p.locator('#sSpell:not(.hide)').count()){spelled++;const w=await p.evaluate(()=>EF.G.spell.word);
  for(const ch of w.split('')){await p.locator(`.tile[data-l="${ch}"]:not(.used)`).first().tap();await p.waitForTimeout(60)}
  if(spelled===1){await p.screenshot({path:'/tmp/sc/abc_spell.png'})}
  await p.waitForTimeout(1100);await p.locator('#spNext').tap();await p.waitForTimeout(450)}
 else if(await p.locator('#sPlay:not(.hide)').count()){if(!hid&&(await p.evaluate(()=>EF.G.r))>=6){hid=true;ok(await p.locator('.opt .lab').count()===0,'second half: the words are removed, the child must listen');ok(/without the words/i.test(await p.locator('#pB').innerText()),'a message tells the child the words are gone')}const t2=await p.evaluate(()=>EF.G.target[0]);await p.locator(`.opt[data-w="${t2}"]`).tap();await p.waitForTimeout(1100);await p.locator('#pNext').tap();await p.waitForTimeout(450)}
}
await p.waitForTimeout(2000);
ok(hid,'the second half (without words) was reached');ok(spelled>=1,'a spelling round appears ('+spelled+' spelled)');
ok(await p.locator('#sDone:not(.hide)').count()===1,'world completed: celebration screen');
ok(await p.evaluate(()=>JSON.parse(localStorage.ef_done).indexOf('farm')>=0),'sticker saved for the Farm world');
ok(await p.locator('.confetti').count()>0,'confetti falls');
await p.screenshot({path:'/tmp/sc/abc_done.png'});
// next world + menu shows the star
await p.tap('#dNext');await p.waitForTimeout(300);ok(/hungry|fruit/i.test(await p.locator('#stT').innerText()),'next story: fruits');
await p.tap('#bhome');await p.waitForTimeout(200);ok((await p.locator('.w .done').count())===1,'finished world is marked with a star in the menu');
// music + toggles
const s1=await p.evaluate(()=>EF.MU.step);await p.waitForTimeout(800);ok(await p.evaluate(()=>EF.MU.step)>s1,'soft background music plays');
await p.tap('#bm');const s2=await p.evaluate(()=>EF.MU.step);await p.waitForTimeout(600);ok(await p.evaluate(()=>EF.MU.step)===s2,'music button turns music off');
ok(!(await p.locator('body').innerText()).match(/[\u1780-\u17FF]/),'no Khmer text is shown anywhere in the game (English only, no mistranslations)');
// voice: best English voice is chosen first, child/parent can cycle voices
ok(await p.evaluate(()=>EF.VOICES().length===3&&EF.VOICES()[0].name==='Samantha'&&EF.VOICES()[2].name==='Robot espeak'),'best-sounding English voices first, robotic ones last, non-English dropped');
await p.tap('#bv');await p.waitForTimeout(200);await p.tap('#bv');await p.waitForTimeout(200);ok(await p.evaluate(()=>JSON.parse(localStorage.ef_voice))==='Daniel','voice button: recorded voice first, then each phone voice; choice remembered');ok(/Daniel/.test(await p.locator('#toast').innerText()),'the chosen voice name is shown');
// all worlds playable: every target is spoken
ok(await p.evaluate(()=>new Set(EF.WORLDS.flatMap(w=>w.words.map(x=>x[0]))).size)===36,'36 different words in total');
// no data leaves the phone
const reqs=[];p.on('request',r=>{if(!r.url().startsWith('http://localhost')&&!/fonts\.(googleapis|gstatic)/.test(r.url()))reqs.push(r.url())});await p.reload();await p.waitForTimeout(500);ok(reqs.length===0,'no other website is contacted (safe for children)');
ok(errs.length===0,'no page errors '+errs.join());
await b.close();srv.close()})();
