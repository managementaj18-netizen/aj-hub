var C="asc-v12",F=["./","index.html","lib.js","i18n.js","manifest.json","icon-192.png","icon-512.png","apple-touch-icon.png","logo-for-dark.svg","logo-for-light.svg"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F)}));self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}));self.clients.claim()});
self.addEventListener("fetch",function(e){var r=e.request;if(r.method!=="GET")return;var u=new URL(r.url);if(u.pathname.indexOf("/api/")===0)return;
 e.respondWith(fetch(r).then(function(res){if(res.ok&&u.origin===location.origin){var c2=res.clone();caches.open(C).then(function(ch){ch.put(r,c2)})}return res}).catch(function(){return caches.match(r)}))});
