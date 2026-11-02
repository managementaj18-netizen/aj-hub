// What visitors can reach: only released games are inside game/public (the folder Cloudflare deploys).
const fs=require('fs'),path=require('path');
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)process.exitCode=1};
const pub=path.join(__dirname,'../public'),priv='try-6d7b31c6ea',held=path.join(pub,priv);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(pub).map(f=>path.relative(pub,f));
ok(files.includes('index.html'),'Fruit Catch (released) is deployed');
ok(!files.some(f=>/^(sort|kids)\//.test(f)),'held-back games are NOT at their public address');
ok(fs.existsSync(path.join(held,'sort/index.html'))&&fs.existsSync(path.join(held,'kids/index.html')),'held-back games are kept in the private test folder');
const html=fs.readFileSync(path.join(pub,'index.html'),'utf8');
ok(!/href="(\.\/)?(sort|kids)\//.test(html),'the released game does not link to held-back games');
ok(!/Juice Sort|Animal Friends|ទឹកផ្លែឈើ|មិត្តសត្វ/.test(html),'no mention of the held-back games');
ok(/id="soon"/.test(html),'the home page has a line that points to the new game');ok(fs.existsSync(path.join(pub,'abc/index.html'))&&!/noindex/.test(fs.readFileSync(path.join(pub,'abc/index.html'),'utf8')),'English Friends is released: public and allowed to be found');
ok(!html.includes(priv),'the released game never links to the private test folder');
ok(['index.html','sort/index.html','kids/index.html'].every(f=>/noindex/.test(fs.readFileSync(path.join(held,f),'utf8'))),'private pages tell search engines not to list them');
const all=walk(pub).filter(f=>f.endsWith('.html')&&!f.includes(priv)).map(f=>fs.readFileSync(f,'utf8')).join('');ok(!all.includes(priv),'no public page mentions the private folder');
