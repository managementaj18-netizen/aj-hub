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
// Version 1 is free: the Pro features (Report tab, business details/logo) are hidden. Set HIDE_PRO=0 when Pro (subscription) ships in version 1.1.
const HIDE_PRO=process.env.HIDE_PRO!=='0';
// In-App Purchase bridge: bundle src/iap.js (RevenueCat) into www/iap.js
require('esbuild').buildSync({entryPoints:[path.join(__dirname,'..','src','iap.js')],bundle:true,format:'iife',minify:true,outfile:path.join(out,'iap.js')});
const rc=JSON.parse(fs.readFileSync(path.join(__dirname,'..','iap-config.json'),'utf8')).revenueCatPublicKey;
if(/PASTE/.test(rc))console.warn('WARNING: iap-config.json still has the placeholder key; the subscription screen will say "not ready".');
// inside the app the data service must use the real internet address
const cfg='<script>window.SORAMMA_API="https://scan.soramma.app";window.SA_RC_KEY='+JSON.stringify(rc)+';window.SA_HIDE_PRO='+JSON.stringify(HIDE_PRO)+';</script>\n<script src="iap.js"></script>\n';
const i=html.indexOf('<script');if(i<0)throw new Error('no script tag');
html=html.slice(0,i)+cfg+html.slice(i);
fs.writeFileSync(path.join(out,'index.html'),html);
console.log('www ready:',fs.readdirSync(out).join(', '));
