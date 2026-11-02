import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
import {makeDB} from './d1shim.mjs';
import {onRequest as mw} from '../functions/_middleware.js';
import {onRequest as api} from '../functions/api/[[path]].js';
const root='/home/user/aj-hub/game/public',DB=makeDB();
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.mp3':'audio/mpeg'};
const ASSETS={fetch:async(req)=>{let f=path.join(root,new URL(req.url).pathname.split('?')[0]);if(f.endsWith('/'))f+='index.html';return fs.existsSync(f)&&fs.statSync(f).isFile()?new Response(fs.readFileSync(f),{status:200,headers:{'content-type':mime[path.extname(f)]||'application/octet-stream'}}):new Response('nf',{status:404})}};
http.createServer(async(q,res)=>{try{
 const chunks=[];for await(const c of q)chunks.push(c);const body=chunks.length&&!['GET','HEAD'].includes(q.method)?Buffer.concat(chunks):undefined;
 const req=new Request('http://'+q.headers.host+q.url,{method:q.method,headers:q.headers,body});
 const env={DB,ADMIN_CODE:'sekret-123',ASSETS};
 const next=async()=>{const u=new URL(req.url);if(u.pathname.startsWith('/api/'))return api({request:req,env});return ASSETS.fetch(req)};
 const r=await mw({request:req,env,next});res.writeHead(r.status,{'content-type':r.headers.get('content-type')||'text/plain'});res.end(Buffer.from(await r.arrayBuffer()))}catch(e){res.writeHead(500);res.end(String(e))}}).listen(+(process.env.PORT||8822),()=>console.log('up'));
