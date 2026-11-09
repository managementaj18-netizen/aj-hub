// Builds ./www: the game files that go INSIDE the iPhone app (so the game opens and plays without internet).
// Run:  npm run web      (the Mac steps in README.md do this for you)
const fs=require('fs'),path=require('path');
const pub=path.join(__dirname,'..','..','public'),out=path.join(__dirname,'..','www');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const copy=(from,to)=>fs.copyFileSync(path.join(pub,from),path.join(out,to||path.basename(from)));
['art.js','icon-192.png','icon-512.png','manifest.json'].forEach(f=>copy('fruit/'+f));
copy('track.js');
let html=fs.readFileSync(path.join(pub,'fruit','index.html'),'utf8');
if(!html.includes('../track.js'))throw new Error('index.html does not load ../track.js any more - update make-www.js');
html=html.replace('../track.js','track.js');
// no Google Fonts inside the app: it would send every player's address to Google. iPhone has its own Khmer and English fonts (the CSS already falls back to system-ui).
html=html.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>\n?/,'');
if(html.includes('fonts.googleapis.com'))throw new Error('Google Fonts link still there');
// inside the app the data service and the share links must use the real internet address
const cfg='<script>window.SORAMMA_API="https://play.soramma.app";window.SORAMMA_SHARE="https://play.soramma.app/fruit/";</script>\n';
const i=html.indexOf('<script');if(i<0)throw new Error('no script tag');
html=html.slice(0,i)+cfg+html.slice(i);
fs.writeFileSync(path.join(out,'index.html'),html);
console.log('www ready:',fs.readdirSync(out).join(', '));
