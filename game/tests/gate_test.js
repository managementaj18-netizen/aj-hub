// What visitors can reach: only released games are inside game/public (the folder Cloudflare deploys).
const fs=require('fs'),path=require('path');
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
const pub=path.join(__dirname,'../public'),held=path.join(__dirname,'../_unreleased');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(pub).map(f=>path.relative(pub,f));
ok(files.includes('index.html'),'Fruit Catch (released) is deployed');
ok(!files.some(f=>/^(sort|kids)\//.test(f)),'held-back games are NOT in the deployed folder');
ok(fs.existsSync(path.join(held,'sort/index.html'))&&fs.existsSync(path.join(held,'kids/index.html')),'held-back games are kept safely in _unreleased');
const html=fs.readFileSync(path.join(pub,'index.html'),'utf8');
ok(!/href="(\.\/)?(sort|kids)\//.test(html),'the released game does not link to held-back games');
ok(!/Juice Sort|Animal Friends|ទឹកផ្លែឈើ|មិត្តសត្វ/.test(html),'no mention of the held-back games');
ok(/id="soon"/.test(html),'a soft "new games coming soon" line is shown instead');
