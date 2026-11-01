// Soramma Translate API — Cloudflare Pages Function using Workers AI (binding AI) and a secret ACCESS_CODE.
// POST /api/stt        raw audio (WAV) -> {text}
// POST /api/translate  {text,from,to}  -> {text}
// Without ACCESS_CODE configured every request is refused, so nobody can burn the free AI allowance by accident.
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const LANGS={km:"km",en:"en"};
const MAX_AUDIO=6*1024*1024,MAX_TEXT=2000;
function same(a,b){a=String(a||"");b=String(b||"");if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0}
const hits=new Map();
function limited(ip){const now=Date.now(),a=(hits.get(ip)||[]).filter(t=>now-t<60000);a.push(now);hits.set(ip,a);if(hits.size>500)hits.clear();return a.length>30}
export async function onRequest(ctx){
  const {request:req,env}=ctx,url=new URL(req.url),route=url.pathname.replace(/^\/api\/?/,"").split("/")[0],m=req.method;
  try{
    if(route==="ping"&&m==="GET")return J({ok:true,ai:!!env.AI,locked:!env.ACCESS_CODE});
    if(m!=="POST")return J({error:"not_found"},404);
    if(!env.ACCESS_CODE)return J({error:"not_configured"},503);
    const code=req.headers.get("x-code");if(!same(code,env.ACCESS_CODE))return J({error:"bad_code"},401);
    if(limited(req.headers.get("cf-connecting-ip")||"x"))return J({error:"too_many"},429);
    if(!env.AI)return J({error:"no_ai"},503);
    if(route==="stt"){
      const buf=await req.arrayBuffer();if(!buf.byteLength)return J({error:"bad_input"},400);if(buf.byteLength>MAX_AUDIO)return J({error:"too_big"},413);
      const r=await env.AI.run("@cf/openai/whisper",{audio:Array.from(new Uint8Array(buf))});
      return J({text:String((r&&r.text)||"").trim()})}
    if(route==="translate"){
      let b={};try{b=await req.json()}catch(e){}
      const text=String(b.text||"").trim().slice(0,MAX_TEXT),from=LANGS[b.from],to=LANGS[b.to];
      if(!text||!from||!to||from===to)return J({error:"bad_input"},400);
      const r=await env.AI.run("@cf/meta/m2m100-1.2b",{text,source_lang:from,target_lang:to});
      return J({text:String((r&&(r.translated_text||r.text))||"").trim()})}
    return J({error:"not_found"},404);
  }catch(e){return J({error:"server",detail:String(e&&e.message||e).slice(0,160)},500)}
}
