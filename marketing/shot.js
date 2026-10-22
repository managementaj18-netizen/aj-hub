const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [f,w,h,o] of [['cover.html',1640,624,'soramma-cover.png'],['profile.html',1080,1080,'soramma-profile.png']]){const p=await b.newPage({viewport:{width:w,height:h}});await p.goto('file://'+process.cwd()+'/'+f);await p.waitForTimeout(1500);await p.screenshot({path:o});}
await b.close()})();
