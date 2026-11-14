/* Treasure Trek - the game: one level per country, a trip around the world */
(function(TK){
var $=function(i){return document.getElementById(i)};
function ld(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var W=360,H=640,HZ=205,YP=545,D0=18,LW=96,UH=60,ZMAX=74,G=26,NL=TK.LEVELS.length;
function P(x,z){var s=D0/(D0+z);return{sx:180+x*LW*s,sy:HZ+(YP-HZ)*s,s:s}}
var rr=TK.rr,shade=TK.shade;
var cv=$("cv"),cx=cv.getContext("2d"),dpr=Math.min(1.5,window.devicePixelRatio||1);
var prog=ld("tk3_prog",null);if(!prog||!prog.stars||prog.stars.length!==NL)prog={stars:TK.LEVELS.map(function(){return 0}),unlocked:0,coins:0};if(/[?&]unlock/.test(location.search))prog.unlocked=NL-1;
function saveProg(){sv("tk3_prog",prog)}
var S=TK.S={mode:"home",over:true,paused:false,li:0,L:TK.LEVELS[0],D:0,speed:13,lane:0,x:0,h:0,vy:0,slide:0,slideK:0,landT:0,jb:0,hearts:3,coins:0,spawned:0,hits:0,inv:0,t:0,ents:[],scen:[],parts:[],wx:[],nextRow:0,nextScen:0,banner:null,flash:0,shake:0,done:false,doneT:0,cp:null,cpHit:{},snd:ld("tk3_snd",true),seen:ld("tk3_seen",false),afterHow:false,sel:0};
var AC=null;TK.audio=function(){AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();TK.Music.init(AC);return AC};
function tone(f,d,tp,v){if(!S.snd)return;try{TK.audio();var o=AC.createOscillator(),g=AC.createGain();o.type=tp||"sine";o.frequency.value=f;g.gain.setValueAtTime(v||.1,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}

/* ---------------- one level per country ---------------- */
var NEAR={panda:1,dragon:1,merlion:1,nonla:1,junk:1,bayon:1,apsara:1,tuktuk:1,church:1,cabin:1,obelisk:1,lamppost:1,bldg:1,yurt:1,adobe:1,llama:1,barn:1,windmill:1,townhouse:1,mosque:1,minaret:1,temple:1,totem:1,sailboat:1,cypress:1};
function addScen(z){var L=S.L,k=L.scen[(Math.random()*L.scen.length)|0],left=Math.random()<.5,near=k==="bldg"?2.72+Math.random()*.25:NEAR[k]?2.15+Math.random()*.5:2.4+Math.random()*2.6;S.scen.push({k:k,x:(left?-1:1)*near,z:z,left:left,v:(Math.random()*3)|0})}
function addCoins(lane,z,n,arc){for(var i=0;i<n;i++){S.ents.push({t:"coin",lane:lane,z:z+i*2.4,hh:arc?.7+Math.sin(i/(n-1)*Math.PI)*1.45:.7});S.spawned++}}
function rowGap(){var p=S.D/S.L.len;return Math.max(11,27-S.L.dd*9-p*6)}
function spawnRow(z){if(z<45||z>S.L.len-70)return;var r=Math.random(),lanes=[-1,0,1],L=lanes[(Math.random()*3)|0];if(Math.random()<.04){S.ents.push({t:"mag",lane:L,z:z});return}var T=["block","low","high"],hard=Math.min(1,S.L.dd*.7+S.D/S.L.len*.45);
 if(r<.30+(1-hard)*.15){addCoins(L,z,5+((Math.random()*3)|0),Math.random()<.45)}
 else if(r<.62){var t=T[(Math.random()*3)|0];S.ents.push({t:t,lane:L,z:z});var o=lanes.filter(function(l){return l!==L});addCoins(o[(Math.random()*2)|0],z,4,false)}
 else if(r<.90){var a=lanes.slice();a.sort(function(){return Math.random()-.5});var t1=T[(Math.random()*3)|0],t2=T[(Math.random()*3)|0];S.ents.push({t:t1,lane:a[0],z:z});S.ents.push({t:t2,lane:a[1],z:z});addCoins(a[2],z,5,false)}
 else{var ft=Math.random()<.5?"low":"high";S.ents.push({t:ft,lane:0,z:z,full:true});addCoins(0,z-6,4,false)}}
var OVC={};
function overlayFor(L){var f=OVC[L.id];if(f)return f;f=document.createElement("canvas");f.width=180;f.height=320;var c=f.getContext("2d");c.scale(.5,.5);c.fillStyle=L.tint;c.fillRect(0,0,W,H);var gl=c.createRadialGradient(250,HZ-66,6,250,HZ-66,200);gl.addColorStop(0,"rgba(255,245,200,.22)");gl.addColorStop(1,"rgba(255,245,200,0)");c.fillStyle=gl;c.fillRect(0,0,W,H);var vg=c.createRadialGradient(180,330,200,180,330,480);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.28)");c.fillStyle=vg;c.fillRect(0,0,W,H);OVC[L.id]=f;return f}
var FOGC={};
function fogFor(L){var f=FOGC[L.id];if(f)return f;f=document.createElement("canvas");f.width=W;f.height=90;var c=f.getContext("2d");var g=c.createLinearGradient(0,0,0,90);g.addColorStop(0,L.fog);g.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=g;c.fillRect(0,0,W,90);FOGC[L.id]=f;return f}
var CLD=null;
function cloudSprite(){if(CLD)return CLD;CLD=document.createElement("canvas");CLD.width=160;CLD.height=60;var c=CLD.getContext("2d");c.scale(1,.4);var g=c.createRadialGradient(80,75,2,80,75,70);g.addColorStop(0,"rgba(255,255,255,.85)");g.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=g;c.beginPath();c.arc(80,75,70,0,7);c.fill();return CLD}
var SKYC={};
function skyFor(L){var f=SKYC[L.id];if(f)return f;f=document.createElement("canvas");f.width=W*2;f.height=(HZ+4)*2;var c=f.getContext("2d");c.scale(2,2);var g=c.createLinearGradient(0,0,0,HZ);g.addColorStop(0,L.sky[0]);g.addColorStop(.55,L.sky[1]);g.addColorStop(1,L.sky[2]);c.fillStyle=g;c.fillRect(0,0,W,HZ+4);
 var sx=250,sg=c.createRadialGradient(sx,HZ-66,4,sx,HZ-66,110);sg.addColorStop(0,L.sun);sg.addColorStop(.25,"rgba(255,255,255,.5)");sg.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=sg;c.fillRect(0,0,W,HZ);c.fillStyle=L.sun;c.beginPath();c.arc(sx,HZ-66,22,0,7);c.fill();
 c.save();c.translate(sx,HZ-66);for(var i=0;i<9;i++){c.rotate(Math.PI*2/9);var rg=c.createLinearGradient(0,0,0,-260);rg.addColorStop(0,"rgba(255,255,255,.16)");rg.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=rg;c.beginPath();c.moveTo(0,0);c.lineTo(-14,-260);c.lineTo(14,-260);c.fill()}c.restore();SKYC[L.id]=f;return f}
function startLevel(i,fromCp){var L=TK.LEVELS[i];try{TK.audio();TK.Music.mute(!S.snd);TK.Music.play(L,false);roar()}catch(e){}S.li=i;S.L=L;S.mode="play";S.over=false;S.paused=false;S.done=false;S.doneT=0;
 var cp=fromCp&&S.cp&&S.cp.li===i?S.cp:null;if(!cp)S.cp=null;S.cpHit={};
 S.D=cp?cp.D:0;S.coins=cp?cp.coins:0;S.spawned=cp?cp.spawned:0;S.hits=0;S.hearts=3;S.speed=L.v0;S.lane=0;S.x=0;S.h=0;S.vy=0;S.slide=0;S.slideK=0;S.landT=0;S.jb=0;S.inv=0;S.cd=.04;S.cx=180;S.mag=0;S.txt=[];S.near=0;S.ents=[];S.scen=[];S.parts=[];S.wx=[];S.shake=0;S.flash=0;
 TK.clearSceneCache();TK.clearObstacleCache();TK.clearOutfitCache();S.hz=TK.buildHorizon(L);S.sky=skyFor(L);S.ovl=overlayFor(L);S.fog=fogFor(L);S.of=TK.OUTFITS[L.outfit];
 S.nextRow=S.D+45;S.nextScen=S.D;while(S.nextScen<S.D+ZMAX){addScen(S.nextScen+2);S.nextScen+=3.8+Math.random()*4.4}
 S.ents.push({t:i===NL-1?"chest":"finish",lane:0,z:L.len});[.5,.8].forEach(function(f,k){if(L.len*f>S.D+30)S.ents.push({t:"cp",lane:0,z:L.len*f,k:k})});
 for(var w=0;w<48;w++)S.wx.push(newWx(true));
 banner();hud();["ovStart","ovLevels","ovHow","ovDone","ovFail"].forEach(function(id){$(id).classList.add("hide")});$("top").classList.remove("hide");$("stage").classList.remove("hide");if(window.GT)GT.hit("play","trek")}
function banner(){S.banner={t0:S.t,txt:S.L}}
function hud(){$("sc").textContent=S.coins;$("ds").textContent=Math.floor(S.D)+"m";var h="";for(var i=0;i<3;i++)h+='<i style="--h:'+(i<S.hearts?HEART1:HEART0)+'"></i>';$("hr").innerHTML=h}
var HEART1='url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27M12 21.5S3 16 3 9.6A5 5 0 0 1 12 7a5 5 0 0 1 9 2.6C21 16 12 21.5 12 21.5z%27 fill=%27%23ff4d6d%27 stroke=%27%23fff%27 stroke-width=%272%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")',HEART0='url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27M12 21.5S3 16 3 9.6A5 5 0 0 1 12 7a5 5 0 0 1 9 2.6C21 16 12 21.5 12 21.5z%27 fill=%27%23ffffff55%27 stroke=%27%23ffffffaa%27 stroke-width=%272%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")';

/* ---------------- controls ---------------- */
function move(d){if(S.mode!=="play"||S.over||S.done||S.paused)return;var n=Math.max(-1,Math.min(1,S.lane+d));if(n!==S.lane){S.lane=n;tone(300,.06,"triangle",.07)}}
function jump(){if(S.mode!=="play"||S.over||S.done||S.paused)return;if(S.h<.05){S.vy=9.2;S.slide=0;S.jb=0;tone(420,.12,"triangle",.09)}else S.jb=.16}
function slide(){if(S.mode!=="play"||S.over||S.done||S.paused)return;if(S.h>.05)S.vy=-14;S.slide=.85;tone(200,.1,"sawtooth",.05)}
function burst(x,y,col,n){for(var i=0;i<n;i++){var a=Math.random()*6.28,s=50+Math.random()*130;S.parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:.5+Math.random()*.3,c:col,r:2+Math.random()*3})}}
function roar(){tone(90,.5,"sawtooth",.16);setTimeout(function(){tone(70,.6,"sawtooth",.14)},120)}
function ftxt(s,x,y,col){S.txt.push({s:s,x:x,y:y,t:0,c:col||"#fff"})}
function hit(){if(S.inv>0)return;var close=S.cd<.42;S.hearts-=close?2:1;S.cd=0;S.hits++;roar();S.inv=1.5;S.speed*=.7;S.shake=.4;tone(110,.3,"sawtooth",.12);burst(180+S.x*LW,YP-50,"#ffd84a",14);hud();if(S.hearts<=0)failLevel()}

/* ---------------- one step of the run ---------------- */
function step(dt){
 if(S.mode!=="play"||S.over||S.paused)return;var L=S.L;
 if(!S.done){var pr=Math.min(1,S.D/L.len),tgt=L.v0+(L.v1-L.v0)*(pr<.12?pr*pr*8:.115+(pr-.12)*1.0);tgt=Math.min(L.v1,tgt);S.speed+=(tgt-S.speed)*Math.min(1,dt*1.2);TK.Music.setSpeed(S.speed);S.D+=S.speed*dt}
 else{S.doneT+=dt;S.speed=Math.max(0,S.speed-dt*20);S.D+=S.speed*dt}
 if(S.D>L.len-55&&!S.done)S.lane=0;
 S.x+=(S.lane-S.x)*Math.min(1,dt*13);
 if(S.h>0||S.vy>0){S.vy-=G*dt;S.h+=S.vy*dt;if(S.h<=0){S.h=0;if(S.vy<-3){S.landT=.2;for(var di=0;di<7;di++)S.parts.push({x:180+S.x*LW+(Math.random()-.5)*40,y:YP,vx:(Math.random()-.5)*110,vy:-20-Math.random()*40,life:.35,c:"rgba(255,255,255,.65)",r:3+Math.random()*3})}S.vy=0;if(S.jb>0){S.jb=0;S.vy=9.2;tone(420,.12,"triangle",.09)}}}
 S.cd=Math.min(1.2,S.cd+dt*(S.cd<.45?.075:.04));TK.Music.setDanger(S.cd<.4);if(S.mag>0)S.mag-=dt;for(var ti=S.txt.length-1;ti>=0;ti--){S.txt[ti].t+=dt;if(S.txt[ti].t>1)S.txt.splice(ti,1)}
 if(S.slide>0)S.slide-=dt;S.slideK+=((S.slide>0?1:0)-S.slideK)*Math.min(1,dt*16);if(S.landT>0)S.landT-=dt;if(S.jb>0)S.jb-=dt;if(S.inv>0)S.inv-=dt;if(S.shake>0)S.shake-=dt;if(S.flash>0)S.flash-=dt;
 if(!S.done){while(S.nextRow<S.D+ZMAX){spawnRow(S.nextRow);S.nextRow+=rowGap()}}
 while(S.nextScen<S.D+ZMAX){addScen(S.nextScen);S.nextScen+=3.8+Math.random()*4.4}
 var cy=S.h+.62;
 S.ents.forEach(function(e){if(e.dead)return;var z=e.z-S.D;
  if(e.t==="cp"){if(z<0&&!S.cpHit[e.k]){S.cpHit[e.k]=1;S.cp={li:S.li,D:e.z,coins:S.coins,spawned:S.spawned};S.banner={t0:S.t,cp:true};tone(700,.12,"triangle",.1)}return}
  if(z>.9||z<-.7)return;
  if(e.t==="mag"){if(Math.abs(e.lane-S.x)<.65&&Math.abs(cy-e.hh)<.9){e.dead=true;S.mag=8;ftxt("MAGNET!",180,YP-120,"#7ad0ff");tone(520,.1,"triangle",.1);setTimeout(function(){tone(780,.15,"triangle",.1)},90)}return}
  if(e.t==="coin"){var pull=S.mag>0&&z<9&&Math.abs(e.lane-S.x)<1.6;if(pull||Math.abs(e.lane-S.x)<.6&&Math.abs(cy-e.hh)<.66){e.dead=true;S.coins++;burst(180+e.lane*LW,YP-e.hh*UH,"#ffd84a",5);tone(880+(S.coins%8)*60,.07,"triangle",.07);hud()}return}
  if(e.t==="finish"||e.t==="chest")return;
  var ex=e.full?0:e.lane,hw=e.full?1.7:.6;if(Math.abs(ex-S.x)>hw){if(e.t==="block"&&!e.nm&&z<.2&&Math.abs(ex-S.x)<hw+.5){e.nm=1;S.coins+=2;ftxt("CLOSE CALL! +2",180+S.x*LW,YP-130,"#ffd84a");tone(990,.08,"triangle",.09);hud()}return}
  if(e.t==="block")hit();else if(e.t==="low"){if(S.h<.62)hit()}else if(e.t==="high"){if(S.slide<=0)hit()}});
 if(!S.done&&S.D>=L.len){S.done=true;S.doneT=0;tone(660,.2,"triangle",.14);setTimeout(function(){tone(880,.2,"triangle",.14)},180);setTimeout(function(){tone(1100,.35,"triangle",.14)},380)}
 if(S.done&&S.doneT>(S.li===NL-1?2.8:1.6))completeLevel();
 if(Math.floor(S.D)!==S.lastD){S.lastD=Math.floor(S.D);$("ds").textContent=S.lastD+"m"}}

/* ---------------- results ---------------- */
function starsFor(){var r=S.spawned?S.coins/S.spawned:1,s=1;if(r>=.6)s++;if(S.hits<=1)s++;return s}
function completeLevel(){if(S.over)return;S.over=true;var st=starsFor();prog.stars[S.li]=Math.max(prog.stars[S.li],st);prog.unlocked=Math.max(prog.unlocked,Math.min(NL-1,S.li+1));prog.coins+=S.coins;saveProg();S.cp=null;
 var L=S.L,last=S.li===NL-1;$("dTitle").textContent=last?"TREASURE FOUND!":"LEVEL COMPLETE!";$("dSub").textContent=last?"អ្នកបានរកឃើញកំណប់នៅអង្គរវត្ត! ដំណើរជុំវិញពិភពលោកបានបញ្ចប់!":L.n+" · "+(L.km||L.cap);
 var sh="";for(var i=0;i<3;i++)sh+='<span class="'+(i<st?"on":"")+'" style="animation-delay:'+(i*.18)+'s">★</span>';$("dStars").innerHTML=sh;$("dCoins").textContent=S.coins;$("dHits").textContent=S.hits;$("dFact").textContent=L.fact;
 var stamps="";TK.LEVELS.forEach(function(T,i){if(i>S.li||i<S.li-11)return;var on=prog.stars[i]>0;stamps+='<div class="stamp'+(on?" on":"")+'" style="--r:'+((i%2?5:-6))+'deg"><canvas data-f="'+T.flag+'" width="44" height="30"></canvas><b>'+T.n+"</b></div>"});$("dStamps").innerHTML=stamps;Array.prototype.forEach.call($("dStamps").querySelectorAll("canvas"),function(cn){var g=cn.getContext("2d");TK.flag(g,cn.getAttribute("data-f"),2,2,40,26)});
 $("dNext").textContent=last?"WORLD MAP":"NEXT COUNTRY";$("dNext").onclick=function(){$("ovDone").classList.add("hide");if(last)showLevels(S.li,null);else{showLevels(S.li,S.li+1)}};
 $("dAgain").onclick=function(){startLevel(S.li,false)};
 $("ovDone").classList.remove("hide");$("top").classList.add("hide")}
function failLevel(){if(S.over)return;S.over=true;TK.Music.stop();tone(150,.5,"sawtooth",.1);$("fSub").textContent=(S.cd<.5?"CAUGHT BY THE "+(S.L.chaser||"beast").toUpperCase()+"! ":"")+S.L.n+" · "+Math.floor(S.D/S.L.len*100)+"%";var hasCp=S.cp&&S.cp.li===S.li;$("fRetry").textContent=hasCp?"RETRY FROM CHECKPOINT":"TRY AGAIN";$("fRetry").onclick=function(){startLevel(S.li,hasCp)};$("fMap").onclick=function(){$("ovFail").classList.add("hide");showLevels(S.li,null)};setTimeout(function(){$("ovFail").classList.remove("hide");$("top").classList.add("hide")},700)}

/* ---------------- level select (the world map) ---------------- */
var lc=$("lc"),lx=lc.getContext("2d");
function showLevels(sel,flyTo){try{if(S.snd){TK.audio();TK.Music.mute(false);TK.Music.play(TK.LEVELS[sel],true)}}catch(e){}S.mode="levels";S.over=true;["ovStart","ovHow","ovDone","ovFail"].forEach(function(id){$(id).classList.add("hide")});$("ovLevels").classList.remove("hide");$("top").classList.add("hide");sizeLevels();
 var M=TK.LevelMap;M.select(sel,true);S.sel=sel;
 if(flyTo!=null){$("lvCard").classList.add("away");M.fly(sel,flyTo,function(){S.sel=flyTo;cardFor(flyTo);$("lvCard").classList.remove("away");tone(700,.15,"triangle",.1)})}else{cardFor(sel);$("lvCard").classList.remove("away")}}
function cardFor(i){var L=TK.LEVELS[i],unlocked=i<=prog.unlocked,st=prog.stars[i];S.sel=i;TK.LevelMap.select(i,false);
 $("cName").textContent=L.n;$("cKm").textContent=(L.km?L.km+" · ":"")+"LEVEL "+(i+1)+" / "+NL+" · "+L.tn;$("cKm").className="t"+L.tier;$("cLm").textContent=L.lm;$("cOutfit").textContent=outfitName(L.outfit);
 var sh="";for(var k=0;k<3;k++)sh+='<span class="'+(k<st?"on":"")+'">★</span>';$("cStars").innerHTML=sh;
 $("cPlay").textContent=unlocked?(st?"PLAY AGAIN":"PLAY"):"LOCKED";$("cPlay").classList.toggle("lock",!unlocked);$("cNote").textContent=unlocked?"":"Finish "+TK.LEVELS[i-1].n+" to unlock";
 $("cPrev").disabled=i===0;$("cNext").disabled=i===NL-1;$("cPrev10").disabled=i<1;$("cNext10").disabled=i>=Math.min(prog.unlocked,NL-1);var fc=$("cFlag").getContext("2d");fc.clearRect(0,0,60,40);TK.flag(fc,L.flag,2,2,56,36)}
function outfitName(id){return TK.OUTFITS[id].nm||id}
function sizeLevels(){var r=$("ovLevels").getBoundingClientRect();if(!r.width)return;lc.width=Math.round(r.width*dpr);lc.height=Math.round(r.height*dpr);TK.LevelMap.size(r.width,r.height);TK.LevelMap.select(S.sel,true)}

/* ---------------- drawing the world of a level ---------------- */
function wxNew(){}
function newWx(init){var T=S.L.weather,w={x:Math.random()*W,y:init?Math.random()*H:-10,p:Math.random()*6.28,s:1+Math.random()*2.5};if(T==="snow"){w.vy=40+Math.random()*60;w.vx=-10+Math.random()*20}else if(T==="petals"||T==="leaves"){w.vy=25+Math.random()*30;w.vx=-20+Math.random()*30}else if(T==="dust"){w.y=HZ+Math.random()*(H-HZ);w.vx=-90-Math.random()*90;w.vy=Math.random()*8;w.x=Math.random()*W}else{w.vy=0;w.vx=0}return w}
function updWx(dt){var T=S.L.weather;if(T==="none")return;S.wx.forEach(function(w){w.x+=(w.vx-S.x*10)*dt;w.y+=w.vy*dt;w.p+=dt*2;if(T==="dust"){if(w.x<-20){w.x=W+10;w.y=HZ+Math.random()*(H-HZ)}}else if(w.y>H+10||w.x<-20||w.x>W+20){w.y=-10;w.x=Math.random()*W}})}
function drawWx(c){var T=S.L.weather;if(T==="none")return;S.wx.forEach(function(w){if(T==="snow"){c.fillStyle="rgba(255,255,255,"+(.5+w.s*.15)+")";c.beginPath();c.arc(w.x,w.y,w.s*.9,0,7);c.fill()}
 else if(T==="petals"){c.fillStyle=w.s>2?"#ffc4d8":"#fff0f4";c.save();c.translate(w.x,w.y);c.rotate(w.p);c.beginPath();c.ellipse(0,0,w.s*1.6,w.s*.8,0,0,7);c.fill();c.restore()}
 else if(T==="leaves"){c.fillStyle=w.s>2?"#7bd86a":"#e8b82a";c.save();c.translate(w.x,w.y);c.rotate(w.p);c.beginPath();c.ellipse(0,0,w.s*1.8,w.s*.9,0,0,7);c.fill();c.restore()}
 else if(T==="dust"){c.strokeStyle="rgba(255,230,170,"+(.12+w.s*.03)+")";c.lineWidth=w.s*.7;c.beginPath();c.moveTo(w.x,w.y);c.lineTo(w.x+22*w.s,w.y-1);c.stroke()}})}
function decals(c,L,par,idx,a,b){var seed=(idx*7919+13)>>>0;function r(){seed=(seed*9301+49297)%233280;return seed/233280}var g=L.ground,s=a.s;
 function ell(x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill()}
 var yy=function(t){return b.sy+(a.sy-b.sy)*t};
 if(g==="asphalt"){if(r()<.3){c.strokeStyle="rgba(20,20,26,.35)";c.lineWidth=Math.max(1,1.6*s);var x0=(r()-.5)*1.6*LW*s;c.beginPath();c.moveTo(180+x0,yy(.8));c.lineTo(180+x0+10*s,yy(.5));c.lineTo(180+x0+3*s,yy(.2));c.stroke()}if(r()<.2)ell(180+(r()-.5)*1.5*LW*s,yy(.5),16*s,4*s,"rgba(20,20,30,.18)")}
 else if(g==="dirt"||g==="jungle"){c.fillStyle="rgba(60,35,10,.16)";[-.7,.7].forEach(function(o){c.beginPath();c.moveTo(180+(o-.14)*LW*a.s,a.sy);c.lineTo(180+(o+.14)*LW*a.s,a.sy);c.lineTo(180+(o+.14)*LW*b.s,b.sy);c.lineTo(180+(o-.14)*LW*b.s,b.sy);c.fill()});for(var i=0;i<3;i++)ell(180+(r()-.5)*1.7*LW*s,yy(r()),(1.5+r()*2)*s,(1+r())*s,"rgba(90,70,40,.5)");if(g==="jungle"&&r()<.35){c.strokeStyle="rgba(70,45,20,.7)";c.lineWidth=Math.max(1.5,3*s);var x1=(r()-.5)*1.2*LW*s;c.beginPath();c.moveTo(180-1.7*LW*s,yy(.5));c.quadraticCurveTo(180+x1,yy(.9),180+1.7*LW*s,yy(.4));c.stroke()}if(r()<.18)ell(180+(r()-.5)*LW*s,yy(.5),20*s,5*s,"rgba(120,190,230,.35)")}
 else if(g==="stone"){c.strokeStyle="rgba(40,30,30,.22)";c.lineWidth=Math.max(1,1.4*s);c.beginPath();c.moveTo(180-1.78*LW*a.s,a.sy);c.lineTo(180+1.78*LW*a.s,a.sy);var off=par?.5:0;for(var k=-3;k<=3;k++){var xx=(k+off)*.5*LW;c.moveTo(180+xx*a.s,a.sy);c.lineTo(180+xx*b.s,b.sy)}c.stroke()}
 else if(g==="snow"){c.fillStyle="rgba(120,160,210,.16)";[-.65,.65].forEach(function(o){c.beginPath();c.moveTo(180+(o-.1)*LW*a.s,a.sy);c.lineTo(180+(o+.1)*LW*a.s,a.sy);c.lineTo(180+(o+.1)*LW*b.s,b.sy);c.lineTo(180+(o-.1)*LW*b.s,b.sy);c.fill()});for(var j=0;j<4;j++){var sx=180+(r()-.5)*3.2*LW*s;ell(sx,yy(r()),(1+r()*2)*s,(.6+r())*s,"rgba(255,255,255,.9)")}}
 else if(g==="sand"){c.strokeStyle="rgba(255,240,200,.35)";c.lineWidth=Math.max(1,1.6*s);for(var q=0;q<2;q++){var xs=180+(r()-.5)*3*LW*s;c.beginPath();c.moveTo(xs-22*s,yy(.5));c.quadraticCurveTo(xs,yy(.7),xs+22*s,yy(.45));c.stroke()}if(r()<.3)ell(180+(r()-.5)*3.2*LW*s,yy(.5),3*s,2*s,"rgba(120,90,50,.5)")}
 var vx=r()<.5?-1:1,vxp=180+vx*(1.9+r()*2.2)*LW*s;
 if(L.id==="ru")ell(vxp,yy(.5),(5+r()*8)*s,(2+r()*3)*s,"rgba(210,225,245,.8)");
 else if(L.id==="eg")ell(vxp,yy(.5),(6+r()*10)*s,(2+r()*3)*s,"rgba(200,160,90,.5)");
 else{c.fillStyle=par?"rgba(40,110,30,.5)":"rgba(90,170,60,.4)";for(var t=0;t<3;t++){var tx=vxp+t*3*s;c.beginPath();c.moveTo(tx-2*s,yy(.5));c.lineTo(tx,yy(.5)-8*s);c.lineTo(tx+2*s,yy(.5));c.fill()}}}
function drawPlayer(c){var of=S.L.outfit,px=180+S.x*LW,gy=YP-S.h*UH,run=S.t*15*(S.speed/13),air=S.h>.04?(S.vy>2.5?.55:S.vy>-2.5?1:.75):0,f=TK.outfitSprite(of,run,(!air&&S.slideK>.4)?3:air);
 var k=S.slideK,lean=Math.max(-.3,Math.min(.3,(S.lane-S.x)*.42)),bob=air?0:Math.abs(Math.sin(run))*(S.slideK>.4?1:3.4),sx=1,sy=1-.05*k,vy=S.vy;
 if(air){sy*=1+Math.min(.1,Math.abs(vy)*.011);sx*=1-Math.min(.05,Math.abs(vy)*.005)}
 if(S.landT>0){var q=S.landT/.2;sx*=1+.16*q;sy*=1-.18*q}
 if(S.inv>0&&((S.t*14)|0)%2)c.globalAlpha=.4;
 c.fillStyle="rgba(0,0,0,"+(.3-S.h*.1)+")";c.beginPath();c.ellipse(px,YP+2,(26-S.h*7)*(1+.2*k),7-S.h*2,0,0,7);c.fill();
 c.save();c.translate(px,gy-bob);c.rotate(lean+(air?0:Math.min(.07,(S.speed-12)*.007)));c.scale(sx,sy);c.drawImage(f,-70,-142,140,150);c.restore();c.globalAlpha=1}
function drawEnt(c,e){var z=e.z-S.D;if(z<-2||z>ZMAX)return;var al=Math.max(0,Math.min(1,(ZMAX-z)/16));c.globalAlpha=al;var L=S.L;
 if(e.t==="coin"){var cp=P(e.lane,z),cr=UH*.24*cp.s,ch=e.hh*UH*cp.s,wob=Math.abs(Math.cos(S.t*5+e.z));c.fillStyle="rgba(0,0,0,.18)";c.beginPath();c.ellipse(cp.sx,cp.sy,cr*.9,cr*.3,0,0,7);c.fill();var gg=c.createRadialGradient(cp.sx-cr*.3,cp.sy-ch-cr*.3,1,cp.sx,cp.sy-ch,cr);gg.addColorStop(0,"#fff3a0");gg.addColorStop(.5,"#ffd84a");gg.addColorStop(1,"#c88a0a");c.fillStyle=gg;c.beginPath();c.ellipse(cp.sx,cp.sy-ch,cr*Math.max(.25,wob),cr,0,0,7);c.fill();c.strokeStyle="#a86a08";c.lineWidth=Math.max(.8,cr*.1);c.stroke();if(wob>.5){c.fillStyle="#c88a0a";TK.star(c,cp.sx,cp.sy-ch,cr*.5)}}
 else if(e.t==="mag"){var mp=P(e.lane,z),mr=UH*.42*mp.s,my=mp.sy-UH*.95*mp.s+Math.sin(S.t*4+e.z)*mr*.15;var gl2=c.createRadialGradient(mp.sx,my,mr*.2,mp.sx,my,mr*2.2);gl2.addColorStop(0,"rgba(120,210,255,.7)");gl2.addColorStop(1,"rgba(120,210,255,0)");c.fillStyle=gl2;c.fillRect(mp.sx-mr*2.3,my-mr*2.3,mr*4.6,mr*4.6);c.lineCap="butt";c.lineWidth=mr*.55;c.strokeStyle="#e02a2a";c.beginPath();c.arc(mp.sx,my,mr*.8,Math.PI*1.0,Math.PI*2.0,false);c.lineTo(mp.sx+mr*.8,my+mr*.9);c.moveTo(mp.sx-mr*.8,my);c.lineTo(mp.sx-mr*.8,my+mr*.9);c.stroke();c.strokeStyle="#f4f4f8";c.lineWidth=mr*.56;c.beginPath();c.moveTo(mp.sx-mr*.8,my+mr*.55);c.lineTo(mp.sx-mr*.8,my+mr*.95);c.moveTo(mp.sx+mr*.8,my+mr*.55);c.lineTo(mp.sx+mr*.8,my+mr*.95);c.stroke();c.fillStyle="rgba(0,0,0,.2)";c.beginPath();c.ellipse(mp.sx,mp.sy,mr*.9,mr*.22,0,0,7);c.fill()}
 else if(e.t==="finish"||e.t==="cp"){var a0=P(-1.95,z),a1=P(1.95,z),u3=UH*a0.s,fin=e.t==="finish";c.fillStyle="#2a1a10";c.fillRect(a0.sx-u3*.14,a0.sy-u3*3.3,u3*.28,u3*3.3);c.fillRect(a1.sx-u3*.14,a1.sy-u3*3.3,u3*.28,u3*3.3);c.fillStyle=fin?"#fff":"#2ac46a";rr(c,a0.sx-u3*.2,a0.sy-u3*3.5,a1.sx-a0.sx+u3*.4,u3*.85,u3*.1);c.fill();if(fin){c.fillStyle="#111";var cw=(a1.sx-a0.sx+u3*.4)/12,ch2=u3*.85/3;for(var i=0;i<12;i++)for(var j=0;j<3;j++)if((i+j)%2)c.fillRect(a0.sx-u3*.2+i*cw,a0.sy-u3*3.5+j*ch2,cw,ch2)}c.strokeStyle="#ffd84a";c.lineWidth=Math.max(2,u3*.06);rr(c,a0.sx-u3*.2,a0.sy-u3*3.5,a1.sx-a0.sx+u3*.4,u3*.85,u3*.1);c.stroke();c.fillStyle=fin?"#d92a2a":"#fff";c.font='400 '+Math.max(8,u3*.5)+'px "Lilita One",sans-serif';c.textAlign="center";c.strokeStyle="rgba(0,0,0,.6)";c.lineWidth=Math.max(2,u3*.08);var tx=(a0.sx+a1.sx)/2,ty=a0.sy-u3*2.95;c.strokeText(fin?"FINISH":"CHECKPOINT",tx,ty);c.fillText(fin?"FINISH":"CHECKPOINT",tx,ty)}
 else if(e.t==="chest"){var q=P(0,z),u4=UH*q.s,open=S.done?Math.min(1,S.doneT/1.2):0;c.fillStyle="rgba(0,0,0,.25)";c.beginPath();c.ellipse(q.sx,q.sy,u4*.9,u4*.22,0,0,7);c.fill();if(S.done||z<20){var gl=c.createRadialGradient(q.sx,q.sy-u4*.8,u4*.1,q.sx,q.sy-u4*.8,u4*(1.8+open*1.4));gl.addColorStop(0,"rgba(255,236,150,.8)");gl.addColorStop(1,"rgba(255,236,150,0)");c.fillStyle=gl;c.fillRect(q.sx-u4*3.5,q.sy-u4*4,u4*7,u4*5)}
  var cg=c.createLinearGradient(0,q.sy-u4*.9,0,q.sy);cg.addColorStop(0,"#b0621a");cg.addColorStop(1,"#6a3410");c.fillStyle=cg;rr(c,q.sx-u4*.8,q.sy-u4*.9,u4*1.6,u4*.9,u4*.08);c.fill();c.strokeStyle="#3a1c06";c.lineWidth=Math.max(1.5,u4*.06);c.stroke();c.fillStyle="#ffd84a";c.fillRect(q.sx-u4*.8,q.sy-u4*.55,u4*1.6,u4*.1);c.fillRect(q.sx-u4*.1,q.sy-u4*.62,u4*.2,u4*.22);
  c.save();c.translate(q.sx-u4*.8,q.sy-u4*.9);c.rotate(-open*1.1);c.fillStyle="#c0701e";c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(u4*.8,-u4*.75,u4*1.6,0);c.closePath();c.fill();c.stroke();c.restore();
  if(open>.2){c.fillStyle="#ffd84a";for(var k=0;k<14;k++){var ang=k*.9+S.t*2,rad=u4*(.3+open*.9+(k%3)*.2);c.beginPath();c.arc(q.sx+Math.cos(ang)*rad*.9,q.sy-u4*1.1-Math.abs(Math.sin(ang))*rad,u4*.1,0,7);c.fill()}}}
 else{var p=P(e.lane,z),sd=e.full?0:(e.lane<0?1:e.lane>0?-1:0),spr=TK.obstacleSprite(L,e.t,sd,!!e.full),s=p.s;var lw=spr.lw;if(p.sx+lw*s*.5<0||p.sx-lw*s*.5>W){c.globalAlpha=1;return}c.drawImage(spr,p.sx-lw*.5*s,p.sy-182*s,lw*s,190*s)}
 c.globalAlpha=1}
function drawWorld(c){var L=S.L,t=S.t,fl=S.flash>0?S.flash/.4:0;
 c.drawImage(S.sky,0,0,W,HZ+4);
 var cs=cloudSprite();[[40,56,30],[170,34,24],[300,80,28]].forEach(function(cl,i){var x=((cl[0]+t*(3+i*1.5))%(W+160))-80;c.drawImage(cs,x-cl[2]*2,cl[1]-cl[2]*.55,cl[2]*4,cl[2]*1.1)});
 var par=-S.x*1.2;c.drawImage(S.hz,par-60,0,W+120,HZ+4);
 if(L.id==="kh"){var pr=Math.max(0,Math.min(1,S.D/L.len));var asc=.55+pr*1.0;c.drawImage(TK.angkorSprite(),180+par*.6-130*asc,HZ+2-156*asc,260*asc,160*asc);var fg=c.createLinearGradient(0,HZ-60,0,HZ+6);fg.addColorStop(0,"rgba(255,230,170,0)");fg.addColorStop(1,L.fog);c.fillStyle=fg;c.fillRect(0,HZ-60,W,66)}
 var seg=4,off=S.D%(seg*2),N=Math.ceil(ZMAX/seg)+2,ER=1.78*LW,vc=L.verge,rc=L.road,idx0=Math.floor(S.D/seg);
 for(var k=N;k>=0;k--){var z0=k*seg-off-5,z1=z0+seg,a=P(0,Math.max(z0,-5)),b=P(0,z1),pr2=(Math.floor((S.D+z0)/seg)%2+2)%2,gi=Math.floor((S.D+z0)/seg);
  c.fillStyle=vc[pr2];c.fillRect(0,b.sy,W,a.sy-b.sy+1);
  var r0=ER*a.s,r1=ER*b.s;c.fillStyle=rc[pr2];c.beginPath();c.moveTo(a.sx-r0,a.sy);c.lineTo(a.sx+r0,a.sy);c.lineTo(b.sx+r1,b.sy);c.lineTo(b.sx-r1,b.sy);c.fill();
  var e0=.12*LW*a.s,e1=.12*LW*b.s;c.fillStyle=L.edge;c.beginPath();c.moveTo(a.sx-r0,a.sy);c.lineTo(a.sx-r0-e0,a.sy);c.lineTo(b.sx-r1-e1,b.sy);c.lineTo(b.sx-r1,b.sy);c.moveTo(a.sx+r0,a.sy);c.lineTo(a.sx+r0+e0,a.sy);c.lineTo(b.sx+r1+e1,b.sy);c.lineTo(b.sx+r1,b.sy);c.fill();
  if(pr2===0){var wa=.03*LW*a.s,wb=.03*LW*b.s,xa=.5*LW*a.s,xb=.5*LW*b.s;c.fillStyle=L.ground==="snow"?"rgba(120,160,210,.5)":"rgba(255,255,255,.5)";c.beginPath();c.moveTo(a.sx-xa-wa,a.sy);c.lineTo(a.sx-xa+wa,a.sy);c.lineTo(b.sx-xb+wb,b.sy);c.lineTo(b.sx-xb-wb,b.sy);c.moveTo(a.sx+xa-wa,a.sy);c.lineTo(a.sx+xa+wa,a.sy);c.lineTo(b.sx+xb+wb,b.sy);c.lineTo(b.sx+xb-wb,b.sy);c.fill()}
  if(a.s<.9&&a.s>.22)decals(c,L,pr2,gi,a,b)}
 c.drawImage(S.fog,0,HZ,W,90);
 var items=[];S.scen.forEach(function(s){var z=s.z-S.D;if(z>-2&&z<ZMAX)items.push({z:z,s:s})});S.ents.forEach(function(e){var z=e.z-S.D;if(z>-2&&z<ZMAX)items.push({z:z,e:e})});items.sort(function(a,b){return b.z-a.z});
 var drew=false;items.forEach(function(it){if(!drew&&it.z<.3){drawPlayer(c);drew=true}if(it.s){var p=P(it.s.x,it.z);if(p.sx+130*p.s<0||p.sx-130*p.s>W)return;var sp=TK.sceneSprite(L,it.s.k,it.s.left,it.s.v,p.s<.5);if(it.z>ZMAX-16)c.globalAlpha=Math.max(0,(ZMAX-it.z)/16);c.drawImage(sp,p.sx-130*p.s,p.sy-310*p.s,260*p.s,330*p.s);c.globalAlpha=1}else drawEnt(c,it.e)});
 if(!drew)drawPlayer(c);
 for(var i=0;i<S.parts.length;i++){var q=S.parts[i];c.globalAlpha=Math.max(0,q.life*2);c.fillStyle=q.c;c.beginPath();c.arc(q.x,q.y,q.r,0,7);c.fill()}c.globalAlpha=1;
 drawChaser(c);drawLines(c);
 drawWx(c);
 S.txt.forEach(function(q){var u=q.t;c.globalAlpha=Math.max(0,1-u*u);c.font='400 22px "Lilita One",sans-serif';c.textAlign="center";c.lineWidth=5;c.strokeStyle="rgba(30,10,0,.8)";c.strokeText(q.s,q.x,q.y-u*50);c.fillStyle=q.c;c.fillText(q.s,q.x,q.y-u*50)});c.globalAlpha=1;
 /* light: colour grade, sun glare and vignette */
 c.drawImage(S.ovl,0,0,W,H);
 if(fl>0){c.fillStyle="rgba(255,255,255,"+fl*.6+")";c.fillRect(0,0,W,H)}}

function drawChaser(c){if(S.cd>=1.05||S.done)return;var sp=TK.chaserSprite(S.L.chaser||"dog",S.t*15*(S.speed/13)),sc=.74-Math.min(.5,S.cd)*.12;S.cx+=(180+S.x*LW*.9-S.cx)*.12;var w=260*sc,h=220*sc,y=H-h+14+S.cd*S.cd*150;c.globalAlpha=Math.min(1,(1.05-S.cd)*3);c.drawImage(sp,S.cx-w/2,y,w,h);c.globalAlpha=1;
 if(S.cd<.4){var a=(.4-S.cd)*.9;var g=c.createRadialGradient(180,H*.55,H*.2,180,H*.55,H*.75);g.addColorStop(0,"rgba(220,0,0,0)");g.addColorStop(1,"rgba(220,0,0,"+a+")");c.fillStyle=g;c.fillRect(0,0,W,H)}}
function drawLines(c){var L=S.L,f=Math.max(0,Math.min(1,(S.speed-L.v0-1.5)/Math.max(3,L.v1-L.v0)));if(f<.05)return;c.strokeStyle="rgba(255,255,255,"+(.1+f*.35)+")";c.lineWidth=1.6;c.beginPath();for(var i=0;i<16;i++){var a=((i*37)%100)/100*6.283,ph=((S.t*(2+f*2)+i*.173)%1),r0=120+ph*230,r1=r0+40+f*70;var sx=Math.cos(a),sy=Math.sin(a)*.9;if(sy<.1&&Math.abs(sx)<.4)continue;c.moveTo(180+sx*r0,HZ+40+sy*r0*1.4);c.lineTo(180+sx*r1,HZ+40+sy*r1*1.4)}c.stroke()}
function drawHud(c){var L=S.L,x0=26,x1=W-26,y=24,pr=Math.min(1,S.D/L.len);
 c.fillStyle="rgba(0,0,0,.38)";rr(c,x0-8,y-14,x1-x0+16,32,16);c.fill();c.strokeStyle="rgba(255,255,255,.35)";c.lineWidth=3;c.lineCap="round";c.beginPath();c.moveTo(x0+10,y+2);c.lineTo(x1-10,y+2);c.stroke();c.strokeStyle="#ffd84a";c.beginPath();c.moveTo(x0+10,y+2);c.lineTo(x0+10+(x1-x0-20)*pr,y+2);c.stroke();
 [.5,.8].forEach(function(f){var px=x0+10+(x1-x0-20)*f;c.fillStyle=pr>=f?"#2ac46a":"#fff";c.beginPath();c.arc(px,y+2,4,0,7);c.fill()});
 TK.flag(c,L.flag,x0+2,y-10,18,12);var ex=x1-10;c.fillStyle="#fff";c.fillRect(ex-6,y-6,12,10);c.fillStyle="#111";c.fillRect(ex-6,y-6,6,5);c.fillRect(ex,y-1,6,5);
 var kx=x0+10+(x1-x0-20)*pr;c.fillStyle="#d92a2a";c.beginPath();c.arc(kx,y+2,6,0,7);c.fill();c.strokeStyle="#fff";c.lineWidth=2;c.stroke()}
function drawBanner(c){var b=S.banner;if(!b)return;var t=S.t-b.t0;
 if(b.cp){if(t>1.6){S.banner=null;return}c.save();c.globalAlpha=Math.min(1,t*5,(1.6-t)*4);c.fillStyle="rgba(20,120,60,.9)";rr(c,90,250,180,40,20);c.fill();c.fillStyle="#fff";c.font='400 20px "Lilita One",sans-serif';c.textAlign="center";c.fillText("CHECKPOINT!",180,277);c.restore();return}
 if(t>3.6){S.banner=null;return}var L=b.txt,a=Math.min(1,t*4,(3.6-t)*3),yy=244-ease(Math.min(1,t*3))*10;
 c.save();c.globalAlpha=a;c.translate(W/2,yy);var sc=.88+.12*Math.min(1,t*4);c.scale(sc,sc);c.fillStyle="rgba(0,0,0,.3)";rr(c,-160,-56,320,134,26);c.fill();var g=c.createLinearGradient(0,-60,0,74);g.addColorStop(0,"rgba(0,20,50,.82)");g.addColorStop(1,"rgba(0,20,50,.66)");c.fillStyle=g;rr(c,-156,-60,312,134,26);c.fill();c.strokeStyle="#ffd84a";c.lineWidth=4;c.stroke();
 TK.flag(c,L.flag,-136,-36,64,42);c.fillStyle="#9fd8ff";c.textAlign="left";c.font='400 14px "Lilita One",sans-serif';c.fillText("LEVEL "+(S.li+1)+" / "+NL,-56,-34);c.fillStyle="#fff";c.font='400 36px "Lilita One",sans-serif';c.fillText(L.n,-56,4);c.fillStyle="#ffe9a8";c.font='700 19px "Kantumruy Pro",sans-serif';c.fillText(L.km||("Capital: "+L.cap),-56,30);c.fillStyle="#cfe9ff";c.font='700 12px "Kantumruy Pro",sans-serif';c.fillText(L.lm,-136,64);c.restore()}
function ease(x){return x*x*(3-2*x)}
function render(){cx.setTransform(cv.width/W,0,0,cv.height/H,0,0);cx.save();if(S.shake>0)cx.translate(Math.sin(S.t*80)*5*S.shake,Math.cos(S.t*70)*4*S.shake);drawWorld(cx);cx.restore();drawHud(cx);drawBanner(cx);
 if(S.paused){cx.fillStyle="rgba(0,0,0,.5)";cx.fillRect(0,0,W,H);cx.fillStyle="#fff";cx.font='400 48px "Lilita One",sans-serif';cx.textAlign="center";cx.fillText("PAUSED",W/2,H/2);cx.font='400 18px "Lilita One",sans-serif';cx.fillText("Tap to continue",W/2,H/2+34)}
 if(S.done&&S.li===NL-1&&S.doneT>.3){cx.fillStyle="#ffd84a";cx.strokeStyle="#5a2a06";cx.lineWidth=8;cx.font='400 44px "Lilita One",sans-serif';cx.textAlign="center";cx.strokeText("TREASURE!",W/2,150);cx.fillText("TREASURE!",W/2,150)}
 else if(S.done&&S.doneT>.2){cx.fillStyle="#fff";cx.strokeStyle="#0a4a30";cx.lineWidth=8;cx.font='400 44px "Lilita One",sans-serif';cx.textAlign="center";cx.strokeText("FINISH!",W/2,150);cx.fillText("FINISH!",W/2,150)}}
var Q=1,fAcc=0,fN=0;
function setBacking(){var st=$("stage"),w=st.clientWidth-8,h=st.clientHeight,sc=Math.min(w/W,h/H);cv.style.width=W*sc+"px";cv.style.height=H*sc+"px";cv.width=Math.round(W*sc*dpr*Q);cv.height=Math.round(H*sc*dpr*Q)}
function resize(){setBacking();sizeHome();sizeLevels()}
/* adaptive quality: if the phone cannot keep up, draw at a lower resolution so the game stays smooth */
function adapt(dt){fAcc+=dt;fN++;if(fN>=40){var avg=fAcc/fN;if(avg>.026&&Q>.55){Q=Math.max(.55,Q-.15);setBacking()}else if(avg<.0185&&Q<1){Q=Math.min(1,Q+.1);setBacking()}fAcc=0;fN=0}}

/* ---------------- the home screen: the explorer changes into each country's clothes ---------------- */
var hc=$("hc"),hx=hc.getContext("2d"),HW=360,HH=640,HS={x:0,y:0,w:0,h:0};
function sizeHome(){var o=$("ovStart");if(!o||o.classList.contains("hide"))return;var r=o.getBoundingClientRect();HW=r.width;HH=r.height;hc.width=Math.round(HW*dpr);hc.height=Math.round(HH*dpr);var hr=$("hero").getBoundingClientRect();HS={x:hr.left-r.left,y:hr.top-r.top,w:hr.width,h:hr.height}}
var HOME=["jp","fr","eg","br","in","it","au","ke","gr","pe","kr","no","cn","th","mx","ru"].map(function(id){return TK.LEVELS.findIndex(function(l){return l.id===id})});
function drawHome(t){var c=hx;c.setTransform(hc.width/HW,0,0,hc.height/HH,0,0);var i=HOME[Math.floor(t/2.4)%HOME.length],L=TK.LEVELS[i],lp=TK.pj(L.lon,L.lat),sw=(t/2.4)%1;
 var cam={x:lp[0]+Math.sin(t*.2)*20,y:lp[1]+Math.cos(t*.15)*10,z:1.5,cy:HH*.5};TK.drawEarth(c,HW,HH,cam,t);
 var dim=c.createLinearGradient(0,0,0,HH);dim.addColorStop(0,"rgba(255,160,60,.30)");dim.addColorStop(.5,"rgba(255,160,60,.08)");dim.addColorStop(1,"rgba(255,160,60,.35)");c.fillStyle=dim;c.fillRect(0,0,HW,HH);
 var cxh=HW/2,cyh=HS.y+HS.h*.5,sc=Math.min(HS.h/150,2.2),f=TK.outfitSprite(L.outfit,t*13,0);
 var gl=c.createRadialGradient(cxh,cyh,10,cxh,cyh,HS.h*.7);gl.addColorStop(0,"rgba(255,235,150,.55)");gl.addColorStop(1,"rgba(255,235,150,0)");c.fillStyle=gl;c.fillRect(0,HS.y-20,HW,HS.h+40);
 c.save();c.translate(cxh,HS.y+HS.h*.82);c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(0,2,34*sc,8*sc,0,0,7);c.fill();c.scale(sc,sc);c.globalAlpha=Math.min(1,sw*8,(1-sw)*8+.2);c.drawImage(f,-70,-142,140,150);c.restore();c.globalAlpha=1;
 TK.flag(c,L.flag,cxh-28,HS.y+HS.h*.02,56,36);c.fillStyle="#fff";c.strokeStyle="rgba(60,20,0,.85)";c.lineWidth=5;c.lineJoin="round";c.font='400 22px "Lilita One",sans-serif';c.textAlign="center";c.strokeText(L.n,cxh,HS.y+HS.h*.02+58);c.fillText(L.n,cxh,HS.y+HS.h*.02+58);c.font='700 13px "Kantumruy Pro",sans-serif';c.lineWidth=4;c.strokeText(outfitName(L.outfit),cxh,HS.y+HS.h*.02+76);c.fillText(outfitName(L.outfit),cxh,HS.y+HS.h*.02+76)}

/* ---------------- how-to pictures ---------------- */
function howPics(){var a=$("p1").getContext("2d"),b=$("p2").getContext("2d"),c=$("p3").getContext("2d");
 function bg(g){g.fillStyle="#d9d2c6";g.fillRect(0,0,172,128);g.fillStyle="#b8a888";g.fillRect(40,0,92,128);g.fillStyle="rgba(255,255,255,.6)";g.fillRect(70,0,3,128);g.fillRect(100,0,3,128)}
 function arrow(g,x0,y0,x1,y1){g.strokeStyle="#e8582a";g.lineWidth=7;g.lineCap="round";g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();var an=Math.atan2(y1-y0,x1-x0);g.fillStyle="#e8582a";g.beginPath();g.moveTo(x1+Math.cos(an)*10,y1+Math.sin(an)*10);g.lineTo(x1+Math.cos(an+2.5)*14,y1+Math.sin(an+2.5)*14);g.lineTo(x1+Math.cos(an-2.5)*14,y1+Math.sin(an-2.5)*14);g.fill()}
 bg(a);a.fillStyle="#d93a2e";a.fillRect(56,40,26,26);a.fillStyle="#ffd84a";a.beginPath();a.arc(118,52,9,0,7);a.fill();arrow(a,62,104,112,104);
 bg(b);b.fillStyle="#ffd84a";for(var i=0;i<8;i++)b.fillRect(52+i*8.5,70,6,12);b.fillStyle="#3a2a20";b.fillRect(50,70,4,22);b.fillRect(118,70,4,22);arrow(b,86,100,86,30);
 bg(c);c.fillStyle="#3a2a20";c.fillRect(50,20,4,60);c.fillRect(118,20,4,60);c.fillStyle="#d93a2e";c.fillRect(50,32,72,28);c.fillStyle="#fff";c.beginPath();c.moveTo(78,38);c.lineTo(94,38);c.lineTo(86,52);c.fill();arrow(c,86,30,86,104)}
function showHow(then){S.afterHow=!!then;$("ovHow").classList.remove("hide")}

/* ---------------- input ---------------- */
var tp=null;
function gStart(x,y){if(S.mode!=="play")return;if(S.paused){S.paused=false;TK.Music.duck(false);return}tp={x:x,y:y}}
function gAct(dx,dy,th){var ax=Math.abs(dx),ay=Math.abs(dy);if(ax>=th&&ax>=ay){move(dx>0?1:-1);return true}if(ay>=th){if(dy<0)jump();else slide();return true}return false}
function gMove(x,y){if(!tp)return;if(gAct(x-tp.x,y-tp.y,tp.acted?54:20)){tp.x=x;tp.y=y;tp.acted=true}}
cv.addEventListener("touchstart",function(e){e.preventDefault();var t=e.changedTouches[0];gStart(t.clientX,t.clientY)},{passive:false});
cv.addEventListener("touchmove",function(e){e.preventDefault();var t=e.changedTouches[0];gMove(t.clientX,t.clientY)},{passive:false});
cv.addEventListener("touchend",function(e){e.preventDefault();var t=e.changedTouches[0];if(tp&&!tp.acted)gAct(t.clientX-tp.x,t.clientY-tp.y,12);tp=null},{passive:false});
cv.addEventListener("touchcancel",function(){tp=null});
document.addEventListener("touchmove",function(e){if(S.mode==="play")e.preventDefault()},{passive:false});
cv.addEventListener("pointerdown",function(e){if(e.pointerType==="touch")return;gStart(e.clientX,e.clientY);try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener("pointermove",function(e){if(e.pointerType==="touch")return;gMove(e.clientX,e.clientY)});
cv.addEventListener("pointerup",function(e){if(e.pointerType==="touch")return;if(tp&&!tp.acted)gAct(e.clientX-tp.x,e.clientY-tp.y,12);tp=null});
window.addEventListener("keydown",function(e){var k=e.key;if(k==="ArrowLeft"||k==="a")move(-1);else if(k==="ArrowRight"||k==="d")move(1);else if(k==="ArrowUp"||k==="w"||k===" ")jump();else if(k==="ArrowDown"||k==="s")slide();else if(k==="p")S.paused=!S.paused});
function playFromHome(){if(!S.seen){S.seen=true;sv("tk3_seen",true);showHow(true)}else showLevels(Math.min(prog.unlocked,NL-1),null)}
$("go").onclick=playFromHome;$("how-ok").onclick=function(){$("ovHow").classList.add("hide");if(S.afterHow){S.afterHow=false;showLevels(Math.min(prog.unlocked,NL-1),null)}};
$("howB").onclick=function(){showHow(false)};$("pz").onclick=function(){if(S.mode==="play"&&!S.over){S.paused=!S.paused;TK.Music.duck(S.paused)}};
$("cPlay").onclick=function(){if(S.sel<=prog.unlocked)startLevel(S.sel,false);else tone(130,.15,"square",.05)};
$("cPrev10").onclick=function(){if(!TK.LevelMap.fl)cardFor(Math.max(0,S.sel-10))};$("cNext10").onclick=function(){if(!TK.LevelMap.fl)cardFor(Math.min(prog.unlocked,NL-1,S.sel+10))};
$("cPrev").onclick=function(){if(S.sel>0&&!TK.LevelMap.fl)cardFor(S.sel-1)};$("cNext").onclick=function(){if(S.sel<NL-1&&!TK.LevelMap.fl)cardFor(S.sel+1)};
$("lvBack").onclick=function(){$("ovLevels").classList.add("hide");$("ovStart").classList.remove("hide");S.mode="home";sizeHome()};
$("fHome").onclick=function(){$("ovFail").classList.add("hide");showLevels(S.li,null)};
function setSnd(){$("snd").style.opacity=S.snd?1:.4;$("sndH").style.opacity=S.snd?1:.45}setSnd();
$("snd").onclick=$("sndH").onclick=function(){S.snd=!S.snd;sv("tk3_snd",S.snd);setSnd();try{TK.audio();TK.Music.mute(!S.snd)}catch(e){}};
function share(txt,el){try{if(navigator.share)navigator.share({text:txt,url:location.href.split("?")[0]+"?s=share"});else if(navigator.clipboard){navigator.clipboard.writeText(txt+" "+location.href);if(el&&el.tagName==="BUTTON"&&!el.classList.contains("ic"))el.textContent="LINK COPIED"}}catch(e){}}
$("dShare").onclick=function(){share("I finished "+S.L.n+" in Treasure Trek! Can you travel around the world and find the treasure at Angkor Wat?",this)};$("shareH").onclick=function(){share("Travel the world in Treasure Trek - run through 7 countries and find the treasure at Angkor Wat!",this)};
$("resetP").onclick=function(){if(confirm("Reset your world tour progress?")){prog={stars:TK.LEVELS.map(function(){return 0}),unlocked:0,coins:0};saveProg();cardFor(0)}};
window.addEventListener("resize",resize);

/* ---------------- main loop ---------------- */
var acc=0,last=0,ht=0;
function frame(dt){S.t+=dt;acc+=dt;var n=0;while(acc>=1/120&&n<12){step(1/120);acc-=1/120;n++}if(acc>1/30)acc=0;
 S.ents=S.ents.filter(function(e){return!e.dead&&e.z>S.D-6});S.scen=S.scen.filter(function(q){return q.z>S.D-6});
 for(var i=S.parts.length-1;i>=0;i--){var p=S.parts[i];p.life-=dt;p.vy+=700*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.life<=0)S.parts.splice(i,1)}updWx(dt)}
function loop(ts){var dt=Math.min(.05,(ts-last)/1000||0);last=ts;
 if(S.mode==="play"){if(!S.over&&!S.paused){frame(dt);adapt(dt)}else S.t+=dt;render()}
 else if(S.mode==="levels"){S.t+=dt;var M=TK.LevelMap;M.update(dt);M.draw(lx.setTransform(lc.width/M.vw,0,0,lc.height/M.vh,0,0)||lx,prog)}
 else{S.t+=dt;ht+=dt;if(!HS.w)sizeHome();drawHome(ht)}
 requestAnimationFrame(loop)}
resize();hud();howPics();$("hb").textContent=prog.stars.reduce(function(a,b){return a+b},0)+" / "+NL*3;
requestAnimationFrame(loop);
TK.api={S:S,frame:frame,step:step,startLevel:startLevel,showLevels:showLevels,move:move,jump:jump,slide:slide,prog:prog,render:render,NL:NL,completeLevel:completeLevel,failLevel:failLevel};
})(window.TK=window.TK||{});
