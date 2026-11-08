/* Soramma Games — anonymous visit counter. Sends only a random id made in this phone (no name, no number, no IP). */
(function(){
var FB="https://www.facebook.com/share/1JSphYg6k3/";/* Facebook Page of Soramma */
function ld(k){try{return localStorage.getItem(k)}catch(e){return null}}function sv(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var vid=ld("gm_vid");if(!vid){vid="";for(var i=0;i<24;i++)vid+="abcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random()*36));sv("gm_vid",vid)}
function source(){var q=(location.search.match(/[?&]s=([\w-]+)/)||[])[1];if(q)return q.toLowerCase();
 var r="";try{r=document.referrer?new URL(document.referrer).hostname:""}catch(e){}
 if(!r||r===location.hostname)return"direct";
 if(/facebook|fb\.com|fb\.me|l\.facebook/.test(r))return"facebook";if(/instagram/.test(r))return"instagram";if(/t\.me|telegram/.test(r))return"telegram";if(/google/.test(r))return"google";if(/tiktok/.test(r))return"tiktok";return"other"}
var src=source();try{src=sessionStorage.getItem("gm_src")||src;sessionStorage.setItem("gm_src",src)}catch(e){}
function hit(ev,game){try{var body=JSON.stringify({ev:ev,game:game||"fruit",src:src,vid:vid});
 if(navigator.sendBeacon&&navigator.sendBeacon("/api/hit",new Blob([body],{type:"application/json"})))return;
 fetch("/api/hit",{method:"POST",body:body,headers:{"content-type":"application/json"},keepalive:true}).catch(function(){})}catch(e){}}
window.addEventListener("appinstalled",function(){hit("install",window.GT&&GT.game)});
window.GT={hit:hit,vid:vid,FB:FB,game:"fruit",openFB:function(){hit("fb",GT.game);if(FB)window.open(FB,"_blank")}};
})();
