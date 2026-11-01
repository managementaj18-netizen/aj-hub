const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'../public');
let handler,STAT={stt:0,tr:0,lastAudioHead:'',lastTr:null};
(async()=>{
 ({onRequest:handler}=await import('../functions/api/[[path]].js'));
 const AI={async run(model,input){if(model.includes('whisper')){STAT.stt++;STAT.lastAudioHead=String.fromCharCode(...input.audio.slice(0,4));return{text:'សួស្តី អ្នកសុខសប្បាយទេ'}}STAT.tr++;STAT.lastTr=input;return{translated_text:'Hello, how are you?'}}};
 const env={AI,ACCESS_CODE:'good-code'};
 const srv=http.createServer(async(q,r)=>{try{
  if(q.url.startsWith('/api/')){const ch=[];for await(const c of q)ch.push(c);const body=ch.length?Buffer.concat(ch):undefined;
   const res=await handler({request:new Request('http://localhost:8807'+q.url,{method:q.method,headers:{...q.headers,'cf-connecting-ip':'5.5.5.5'},body:['GET','HEAD'].includes(q.method)?undefined:body}),env});r.writeHead(res.status,{'content-type':'application/json'});return r.end(await res.text())}
  let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')}
  r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});r.end(fs.readFileSync(f))}catch(e){r.writeHead(500);r.end(String(e))}}).listen(8807);
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
 const c=await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true,permissions:['microphone']});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('tr_lang','"km"')});
 await p.goto('http://localhost:8807/');await p.waitForSelector('#rec');
 ok(await p.locator('#setup').isVisible(),'asks for the access code first');ok(/កូដ/.test(await p.locator('#sTitle').innerText()),'Khmer text');
 // wrong code is refused, then the right one is accepted
 await p.fill('#code','nope');await p.click('#saveCode');await p.fill('#txt','hello');await p.click('#go');await p.waitForTimeout(800);
 ok(await p.locator('#setup').isVisible(),'a wrong code sends you back to the code box');
 await p.fill('#code','good-code');await p.click('#saveCode');await p.waitForTimeout(1200);
 ok(!(await p.locator('#setup').isVisible()),'right code accepted');
 const t1=await p.locator('.item').first().innerText();ok(/Hello, how are you\?/.test(t1),'the text typed earlier was translated once the code was right: '+t1.replace(/\s+/g,' ').slice(0,80));
 // direction swap
 await p.click('#swap');ok(/English/.test(await p.locator('#from').innerText())&&/ខ្មែរ/.test(await p.locator('#to').innerText()),'direction swapped to English → Khmer');await p.click('#swap');
 // OFFLINE: record a voice and type text; nothing is sent
 await c.setOffline(true);await p.waitForTimeout(300);
 ok(/គ្មានអ៊ីនធឺណិត/.test(await p.locator('#net').innerText()),'offline indicator shown');
 const stt0=STAT.stt,tr0=STAT.tr;
 await p.click('#rec');await p.waitForTimeout(1800);ok(/បញ្ឈប់/.test(await p.locator('#rec').innerText()),'recording started');await p.click('#rec');await p.waitForTimeout(1500);
 await p.fill('#txt','សូមអរគុណ');await p.click('#go');await p.waitForTimeout(500);
 const items=await p.evaluate(async()=>(await TR.all()).map(x=>({...x,blob:x.blob?{size:x.blob.size}:null})));
 ok(items.filter(x=>x.status==='w').length===2,'2 items waiting in the queue while offline (voice + text)');
 ok(items.some(x=>x.kind==='audio'&&x.blob&&x.blob.size>1000),'the voice recording is saved on the phone ('+(items.find(x=>x.kind==='audio')||{blob:{size:0}}).blob.size+' bytes WAV)');
 ok(STAT.stt===stt0&&STAT.tr===tr0,'nothing was sent to the server while offline');
 ok((await p.locator('.st.w').count())===2,'queue shows "waiting for internet"');
 await p.screenshot({path:'/tmp/sc/tr_offline.png'});
 // survives reload while still offline
 await c.setOffline(false);await c.setOffline(true);await p.reload().catch(()=>{});await p.waitForTimeout(800);
 // BACK ONLINE: the queue is processed automatically
 await c.setOffline(false);await p.waitForTimeout(3500);
 const after=await p.evaluate(async()=>(await TR.all()).map(x=>({...x,blob:null})));
 ok(after.every(x=>x.status==='d'),'back online: every item is processed automatically ('+after.map(x=>x.status).join(',')+')');
 ok(STAT.stt===stt0+1&&STAT.tr>=tr0+2,'1 voice sent for speech-to-text and 2 translations made');
 ok(STAT.lastAudioHead==='RIFF','the audio sent is a WAV file');
 const a=after.find(x=>x.kind==='audio');ok(a.orig==='សួស្តី អ្នកសុខសប្បាយទេ'&&a.trans==='Hello, how are you?','voice → Khmer text → English translation stored');
 ok(STAT.lastTr.source_lang&&STAT.lastTr.target_lang,'languages sent: '+STAT.lastTr.source_lang+'→'+STAT.lastTr.target_lang);
 ok((await p.locator('.item .t').count())>=3,'translations are shown on screen');
 await p.screenshot({path:'/tmp/sc/tr_done.png'});
 // delete
 const n=await p.locator('.item').count();await p.locator('.item [data-a=del]').first().click();await p.waitForTimeout(300);ok((await p.locator('.item').count())===n-1,'an item can be deleted');
 await p.click('#lg');ok(/Record/i.test(await p.locator('#recNote').innerText()),'English UI switch');
 ok(errs.length===0,'no page errors '+errs.join('|'));
 await b.close();srv.close()})();
