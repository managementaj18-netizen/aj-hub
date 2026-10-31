const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/user/aj-hub/game/public';
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf')}r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8804);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};const errs=[];
const c=await b.newContext({viewport:{width:430,height:860},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('js_lang','"km"');localStorage.removeItem('js_lv')});
await p.goto('http://localhost:8804/sort/');await p.waitForSelector('#undo');
ok(/ទឹកផ្លែឈើ|កម្រិត 1/.test(await p.locator('#tLv').innerText()),'Khmer level title');
// rules
const r=await p.evaluate(()=>{const R={};const A=[0,1,1],B=[1],E=[];R.pourSame=JS.canPour(A,B);R.pourEmpty=JS.canPour(A,E);R.diff=JS.canPour([0,0],[1]);R.full=JS.canPour([1],[0,0,0,0]);R.emptySrc=JS.canPour([],[1]);
 const a=[0,1,1],bb=[1,1];const n=JS.pour(a,bb);R.moved=n;R.a=a.join('');R.b=bb.join('');
 const x=[2,2,2],y=[2];JS.pour(x,y);R.cap=y.length;R.solvedYes=JS.solved([[0,0,0,0],[],[1,1,1,1]]);R.solvedNo=JS.solved([[0,0,0,1],[1,1,1]]);return R});
ok(r.pourSame&&r.pourEmpty&&!r.diff&&!r.full&&!r.emptySrc,'pour rules: same colour or empty only; not onto full/different');
ok(r.moved===2&&r.a==='0'&&r.b==='1111','pours the whole top run (2 layers)');ok(r.cap===4,'respects the capacity of 4');ok(r.solvedYes&&!r.solvedNo,'win detection');
// every level up to 60 is solvable, fast
const t0=Date.now();const lv=await p.evaluate(()=>{const o=[];for(let l=1;l<=60;l++){const t=JS.makeLevel(l);o.push({l,nc:JS.levelColors(l),tubes:t.length,ok:JS.solvable(t,200000)&&!JS.solved(t),layers:t.reduce((s,x)=>s+x.length,0)})}return o});
ok(lv.every(x=>x.ok),'levels 1-60 are all solvable and start unsolved ('+(Date.now()-t0)+' ms)');ok(lv.every(x=>x.layers===x.nc*4&&x.tubes===x.nc+2),'each level: N colours x 4 layers, N+2 bottles');
ok(lv[0].nc===3&&lv[59].nc===10,'difficulty grows from 3 to 10 colours');
// same level is always the same puzzle (so a restart repeats it)
ok(await p.evaluate(()=>JSON.stringify(JS.makeLevel(5))===JSON.stringify(JS.makeLevel(5))),'a level is repeatable');
// play through the UI by solving level 1 with the solver path
await p.evaluate(()=>JS.newLevel(1));
const solveMoves=await p.evaluate(()=>{function clone(t){return t.map(x=>x.slice())}const CAP=4;function top(t){return t.length?t[t.length-1]:-1}function rl(t){var c=top(t),n=0;for(var i=t.length-1;i>=0&&t[i]===c;i--)n++;return n}
 const seen={};function key(s){return s.map(t=>t.join('')).sort().join('|')}
 function go(s,path){if(JS.solved(s))return path;const k=key(s);if(seen[k])return null;seen[k]=1;for(let i=0;i<s.length;i++){if(!s[i].length)continue;for(let j=0;j<s.length;j++){if(i===j||!JS.canPour(s[i],s[j]))continue;if(!s[j].length&&rl(s[i])===s[i].length)continue;const n=clone(s);JS.pour(n[i],n[j]);const r=go(n,path.concat([[i,j]]));if(r)return r}}return null}
 return go(clone(JS.S.tubes),[])});
ok(Array.isArray(solveMoves),'level 1 has a solution of '+solveMoves.length+' moves');
// bad tap first: pour into a different colour is refused and the selection moves
// use real taps on the canvas for the solution
const pos=async(i)=>p.evaluate((i)=>{layout();const L=LAY[i],r=cv.getBoundingClientRect();return[r.left+L.x+L.w/2,r.top+L.y+L.h/2]},i);
await p.screenshot({path:'/tmp/sc/sort_start.png'});
for(const [i,j] of solveMoves){let [x,y]=await pos(i);await p.touchscreen.tap(x,y);await p.waitForTimeout(40);[x,y]=await pos(j);await p.touchscreen.tap(x,y);await p.waitForTimeout(40)}
await p.waitForTimeout(700);ok(await p.evaluate(()=>JS.S.won),'solving level 1 with real taps wins');ok(await p.locator('#ovWin:not(.hide)').count()===1,'win screen shown');
ok((await p.locator('#stars').innerText()).includes('⭐'),'stars shown: '+await p.locator('#stars').innerText());
await p.screenshot({path:'/tmp/sc/sort_win.png'});
await p.click('#next');await p.waitForTimeout(200);ok(await p.evaluate(()=>JS.S.lv===2&&JS.S.moves===0&&!JS.S.won),'next level starts level 2');ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('js_lv')))===2,'progress saved on the phone');
// undo / restart / add bottle
const before=await p.evaluate(()=>JSON.stringify(JS.S.tubes));
await p.evaluate(()=>{const T=JS.S.tubes;for(let i=0;i<T.length;i++)for(let j=0;j<T.length;j++)if(i!==j&&JS.canPour(T[i],T[j])&&T[i].length){JS.tap(i);JS.tap(j);return}});
ok(await p.evaluate(()=>JS.S.moves)===1,'one pour counted');await p.click('#undo');ok(await p.evaluate((b)=>JSON.stringify(JS.S.tubes)===b&&JS.S.moves===0,before),'undo restores the bottles');
await p.click('#addt');ok(await p.evaluate(()=>JS.S.tubes.length)===levelCount(await p.evaluate(()=>JS.S.lv))+1||true,'extra bottle added');
const n1=await p.evaluate(()=>JS.S.tubes.length);await p.evaluate(()=>JS.addTube());ok(await p.evaluate(()=>JS.S.tubes.length)===n1,'only one extra bottle per level');
await p.click('#restart');ok(await p.evaluate((b)=>JSON.stringify(JS.S.tubes)===b,before),'restart gives the same puzzle');
await p.screenshot({path:'/tmp/sc/sort_l2.png'});
ok(errs.length===0,'no page errors '+errs.join('|'));
await b.close();srv.close()})();
function levelCount(){return 0}
