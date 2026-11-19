// Builds ./www: the Scan files that go INSIDE the iPhone app (so the screen opens fast).
// Run:  npm run web
const fs=require('fs'),path=require('path');
const pub=path.join(__dirname,'..','..','public'),out=path.join(__dirname,'..','www');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
['lib.js','i18n.js','icon-192.png','icon-512.png','apple-touch-icon.png','logo-for-light.svg','logo-for-dark.svg'].forEach(f=>{if(fs.existsSync(path.join(pub,f)))fs.copyFileSync(path.join(pub,f),path.join(out,f))});
let html=fs.readFileSync(path.join(pub,'index.html'),'utf8');
// no Google Fonts inside the app (it would send the user's address to Google); iPhone has its own Khmer and English fonts
html=html.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>\n?/g,'');
if(html.includes('fonts.googleapis.com'))throw new Error('Google Fonts link still there');
// no web manifest / service worker inside the app
html=html.replace(/<link rel="manifest"[^>]*>\n?/,'');
// inside the app the data service must use the real internet address
const cfg='<script>window.SORAMMA_API="https://scan.soramma.app";</script>\n';
const i=html.indexOf('<script');if(i<0)throw new Error('no script tag');
html=html.slice(0,i)+cfg+html.slice(i);
fs.writeFileSync(path.join(out,'index.html'),html);
console.log('www ready:',fs.readdirSync(out).join(', '));
