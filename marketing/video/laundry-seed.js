const {chromium}=require('/opt/node22/lib/node_modules/playwright');
module.exports=async function seed(b,W,H){
const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();p.on('dialog',d=>d.accept());p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8799/');await p.click('.langs button[data-l=km]');await p.waitForSelector('#a_biz');
await p.fill('#a_biz','Soramma Laundry');await p.fill('#a_name','Admin');await p.fill('#a_code','secret1');await p.click('#a_go');await p.waitForSelector('#f_name');await p.waitForTimeout(800);
await p.click('#hm');await p.click('#drawer [data-t=cust]');
for(const [n,a,tx] of [['Lotus Riverside Hotel','Riverside Rd 5','K001'],['Bamboo Guesthouse','Street 3','K002'],['Kampot Pepper Cafe','Old Market','K003']]){await p.click('#cu_add');await p.fill('#cu_name',n);await p.fill('#cu_addr',a);await p.fill('#cu_tax',tx);await p.click('#cu_ok');await p.waitForTimeout(350)}
await p.keyboard.press('Escape');await p.waitForTimeout(300);
if(await p.$('#dx'))await p.click('#dx').catch(()=>{});
async function order(name,lines){await p.click('#nav [data-t=new]');await p.waitForSelector('#f_name');await p.fill('#f_name',name);await p.press('#f_name','Tab');await p.waitForTimeout(200);
 for(let i=0;i<lines.length;i++){if(i>0){await p.click('#addl');await p.waitForTimeout(150)}const sel=(await p.$$('.line select'))[i];await sel.selectOption(lines[i][0]);const q=(await p.$$('.line [data-f=q]'))[i];await q.fill(String(lines[i][1]))}
 await p.click('#save');await p.waitForTimeout(500);await p.click('#d_close');await p.waitForTimeout(250)}
await order('Lotus Riverside Hotel',[['sheet',24],['bathtowel',30],['pillowcase',20]]);
await order('Bamboo Guesthouse',[['sheet',10],['towel',12]]);
await order('Kampot Pepper Cafe',[['tablecloth',8],['napkin',40]]);
await order('Lotus Riverside Hotel',[['duvetcover',6],['bathrobe',8]]);
const st=await c.storageState();await c.close();return st}
