// Serves the scan app (folder /scan) on scan.* hostnames; everything else passes through.
export async function onRequest(ctx){
  const url=new URL(ctx.request.url);
  if(url.hostname.startsWith("scan.")&&!url.pathname.startsWith("/api/")&&!url.pathname.startsWith("/scan/")&&ctx.env.ASSETS){
    url.pathname="/scan"+(url.pathname==="/"?"/":url.pathname);
    return ctx.env.ASSETS.fetch(new Request(url.toString(),ctx.request));
  }
  return ctx.next();
}
