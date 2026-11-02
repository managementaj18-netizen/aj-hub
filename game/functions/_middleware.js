// Each game can have its own address. Add the address as a custom domain of the Pages project "game";
// this file then serves that game's folder at the root of its own address.
//   fruit.soramma.app   -> game/public/fruit/   (Fruit Catch)
//   english.soramma.app -> game/public/abc/     (English Friends)
// Other addresses (play.soramma.app/..., *.pages.dev) are not touched.
const HOSTS={"fruit.soramma.app":"/fruit","english.soramma.app":"/abc"};
export async function onRequest(ctx){
  const url=new URL(ctx.request.url),base=HOSTS[url.hostname];
  if(!base)return ctx.next();
  const p=url.pathname;
  // the data service and the shared counter script live at the top of the site
  if(p.startsWith("/api/")||p==="/track.js"||p===base||p.startsWith(base+"/"))return ctx.next();
  url.pathname=base+(p==="/"?"/":p);
  return ctx.env.ASSETS.fetch(new Request(url.toString(),ctx.request));
}
