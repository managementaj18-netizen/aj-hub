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
   const res=await handler({request:new Request('http://localhost:8808'+q.url,{method:q.method,headers:{...q.headers,'cf-connecting-ip':'5.5.5.5'},body:['GET','HEAD'].includes(q.method)?undefined:body}),env});r.writeHead(res.status,{'content-type':'application/json'});return r.end(await res.text())}
  let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')}
  r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});r.end(fs.readFileSync(f))}catch(e){r.writeHead(500);r.end(String(e))}}).listen(8808);
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
 const c=await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true,permissions:['microphone']});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('tr_lang','"km"');localStorage.setItem('tr_code','"good-code"')});
 await p.goto('http://localhost:8808/');await p.waitForSelector('#meet');
 ok(/ប្រជុំ/.test(await p.locator('#meet').innerText()),'meeting button in Khmer');
 await p.click('#meet');await p.waitForTimeout(9000);
 ok(await p.locator('#meet').evaluate(e=>e.classList.contains('on')),'meeting mode is on');
 await p.click('#meet');await p.waitForTimeout(2500);
 const n=await p.locator('#feed .f').count();const txt=await p.locator('#feed').innerText();
 ok(n>=1,'at least one piece was heard and shown: '+n+' | '+txt.replace(/\s+/g,' ').slice(0,100));
 ok(STAT.stt>=1&&STAT.lastAudioHead==='RIFF','audio sent as WAV (RIFF): '+STAT.stt);
 ok(errs.length===0,'no page errors '+errs.join(';'));
 await b.close();process.exit(process.exitCode||0)})();
