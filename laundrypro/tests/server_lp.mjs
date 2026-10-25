import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
import {makeDB} from './d1shim.mjs';const {onRequest}=await import(process.env.HANDLER||'/home/user/aj-hub/functions/api/[[path]].js');
const DB=makeDB();const root=process.env.ROOT||'/home/user/aj-hub/laundry';
const mime={'.html':'text/html','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.gz':'application/gzip','.wasm':'application/wasm','.jpg':'image/jpeg','.json':'application/json'};
http.createServer(async(req,res)=>{try{
 if(req.url.startsWith('/__expire')){await DB.prepare('UPDATE users SET expires=? WHERE admin=0 AND role=?').bind(Date.now()-1000,'owner').run();res.writeHead(200);res.end('ok');return}
 if(req.url.startsWith('/api/')){const chunks=[];for await(const c of req)chunks.push(c);const body=chunks.length?Buffer.concat(chunks):undefined;
  const r=await onRequest({request:new Request('http://localhost:8799'+req.url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:body}),env:{DB}});
  res.writeHead(r.status,{'content-type':'application/json'});res.end(await r.text());return}
 let f=req.url.split('?')[0];if(f==='/')f='/index.html';const fp=path.join(root,f);
 if(!fs.existsSync(fp)){res.writeHead(404);res.end('nf');return}
 res.writeHead(200,{'content-type':mime[path.extname(fp)]||'application/octet-stream'});res.end(fs.readFileSync(fp))}catch(e){res.writeHead(500);res.end(String(e))}}).listen(+(process.env.PORT||8799),()=>console.log('up'));
