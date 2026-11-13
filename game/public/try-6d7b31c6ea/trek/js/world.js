/* Treasure Trek - the world map (level select + flights between countries), seen from above like a satellite view */
(function(TK){
var SC=7;
function pj(lon,lat){return[(lon+180)*SC,(85-lat)*SC]}
function ease(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}
TK.pj=pj;TK.ease=ease;
var landGrad=null,noise=null;
function mkNoise(){var n=document.createElement("canvas");n.width=n.height=160;var g=n.getContext("2d");for(var i=0;i<700;i++){var x=Math.random()*160,y=Math.random()*160;g.fillStyle=Math.random()<.65?"rgba(30,50,20,"+(.06+Math.random()*.12)+")":"rgba(255,255,230,"+(.05+Math.random()*.1)+")";g.beginPath();g.arc(x,y,.8+Math.random()*1.6,0,7);g.fill()}return n}
function landPath(c,poly){c.beginPath();poly.forEach(function(p,i){var q=pj(p[0],p[1]);if(i)c.lineTo(q[0],q[1]);else c.moveTo(q[0],q[1])});c.closePath()}
TK.drawEarth=function(c,vw,vh,cam,t){
 var og=c.createRadialGradient(vw/2,vh*.4,30,vw/2,vh*.5,Math.max(vw,vh)*.8);og.addColorStop(0,"#2288d4");og.addColorStop(.6,"#0f4a96");og.addColorStop(1,"#061c40");c.fillStyle=og;c.fillRect(0,0,vw,vh);
 var z=cam.z;c.save();c.translate(vw/2,cam.cy);c.scale(z,z);c.translate(-cam.x,-cam.y);c.lineJoin="round";
 c.strokeStyle="rgba(255,255,255,.09)";c.lineWidth=1/z;for(var lo=-180;lo<=180;lo+=15){var gx=pj(lo,0)[0];c.beginPath();c.moveTo(gx,0);c.lineTo(gx,145*SC);c.stroke()}for(var la=-60;la<=80;la+=15){var gy=pj(0,la)[1];c.beginPath();c.moveTo(0,gy);c.lineTo(360*SC,gy);c.stroke()}
 TK.WORLD.forEach(function(poly){landPath(c,poly);c.strokeStyle="rgba(120,235,255,.22)";c.lineWidth=18/Math.max(1,z*.9);c.stroke()});
 if(!landGrad){landGrad=c.createLinearGradient(0,pj(0,85)[1],0,pj(0,-60)[1]);var st=[[85,"#d6dcc8"],[66,"#b8c8a0"],[55,"#6aa84a"],[40,"#7aaa50"],[33,"#c8b070"],[22,"#d6bc78"],[12,"#4a9a3a"],[0,"#2a8438"],[-12,"#3f8a3a"],[-25,"#b0a868"],[-40,"#6aa04a"],[-60,"#d6dcc8"]];st.forEach(function(s){landGrad.addColorStop((85-s[0])/145,s[1])})}
 if(!noise)noise=mkNoise();var pat=c.createPattern(noise,"repeat");
 TK.WORLD.forEach(function(poly){landPath(c,poly);c.fillStyle=landGrad;c.fill();c.save();c.clip();c.fillStyle=pat;c.fillRect(0,0,360*SC,145*SC);c.restore();landPath(c,poly);c.strokeStyle="rgba(255,255,255,.45)";c.lineWidth=1.6/z;c.stroke()});
 c.fillStyle="rgba(255,255,255,.2)";for(var ci=0;ci<30;ci++){var cx2=((ci*173+t*7*(1+ci%3))%(360*SC)),cy2=((ci*97)%(130*SC))+40;c.beginPath();c.ellipse(cx2,cy2,40,11,0,0,7);c.ellipse(cx2+26,cy2-6,26,9,0,0,7);c.fill()}
 c.restore()};
TK.mapScreen=function(cam,vw,lon,lat){var p=pj(lon,lat);return[vw/2+(p[0]-cam.x)*cam.z,cam.cy+(p[1]-cam.y)*cam.z]};
function pin(c,x,y,s,col){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=col||"#e8382a";c.strokeStyle="#fff";c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-18,-20,-18,-46,0,-46);c.bezierCurveTo(18,-46,18,-20,0,0);c.fill();c.stroke();c.fillStyle="#fff";c.beginPath();c.arc(0,-30,7,0,7);c.fill();c.restore()}
function plane(c,x,y,ang,s){c.save();c.translate(x,y);c.rotate(ang);c.scale(s,s);c.fillStyle="rgba(0,0,0,.25)";c.beginPath();c.ellipse(4,8,16,5,0,0,7);c.fill();c.fillStyle="#fff";c.strokeStyle="#c8d4e0";c.lineWidth=1.5;c.beginPath();c.moveTo(18,0);c.lineTo(4,-3);c.lineTo(-4,-15);c.lineTo(-8,-14);c.lineTo(-3,-2.5);c.lineTo(-12,-2);c.lineTo(-15,-7);c.lineTo(-18,-6);c.lineTo(-15,0);c.lineTo(-18,6);c.lineTo(-15,7);c.lineTo(-12,2);c.lineTo(-3,2.5);c.lineTo(-8,14);c.lineTo(-4,15);c.lineTo(4,3);c.closePath();c.fill();c.stroke();c.restore()}

/* ---- level-select map controller ---- */
var M={cam:{x:0,y:0,z:2.2,cy:200},sel:0,vw:360,vh:640,fl:null,t:0};
TK.LevelMap=M;
function lvPos(i){var L=TK.LEVELS[i];return pj(L.lon,L.lat)}
function camFor(i,vh){var p=lvPos(i);return{x:p[0],y:p[1],z:2.3,cy:vh*.3}}
M.size=function(w,h){M.vw=w;M.vh=h};
M.select=function(i,instant){M.sel=i;if(instant){var c=camFor(i,M.vh);M.cam=c}else{M.go={t:0,from:{x:M.cam.x,y:M.cam.y,z:M.cam.z},to:camFor(i,M.vh)}}};
M.fly=function(a,b,done){var A=lvPos(a),B=lvPos(b),d=Math.hypot(B[0]-A[0],B[1]-A[1]);M.fl={a:a,b:b,A:A,B:B,t:0,dur:Math.min(5.2,2.6+d/260),zf:Math.max(.5,Math.min(1.7,M.vw*.55/Math.max(80,d))),done:done};M.sel=b;M.go=null};
M.update=function(dt){M.t+=dt;var f=M.fl;
 if(f){f.t+=dt;var u=f.t/f.dur,cx,cy,z,pp=0;
  if(u<.18){var e=ease(u/.18);cx=f.A[0]+(f.B[0]-f.A[0])*.08*e;cy=f.A[1]+(f.B[1]-f.A[1])*.08*e;z=2.3+(f.zf-2.3)*e}
  else if(u<.78){pp=ease((u-.18)/.6);cx=f.A[0]+(f.B[0]-f.A[0])*(.08+.84*pp);cy=f.A[1]+(f.B[1]-f.A[1])*(.08+.84*pp);z=f.zf}
  else{var e3=ease((u-.78)/.22);pp=1;cx=f.A[0]+(f.B[0]-f.A[0])*(.92+.08*e3);cy=f.A[1]+(f.B[1]-f.A[1])*(.92+.08*e3);z=f.zf+(2.3-f.zf)*e3}
  f.pp=pp;M.cam={x:cx,y:cy,z:z,cy:M.vh*.3};if(f.t>=f.dur){var d=f.done;M.fl=null;M.cam=camFor(f.b,M.vh);if(d)d()}return}
 if(M.go){M.go.t+=dt/.9;var g=ease(M.go.t),a=M.go.from,b=M.go.to;M.cam={x:a.x+(b.x-a.x)*g,y:a.y+(b.y-a.y)*g,z:a.z+(b.z-a.z)*g,cy:b.cy};if(M.go.t>=1)M.go=null}};
M.draw=function(c,prog){var vw=M.vw,vh=M.vh,cam=M.cam;TK.drawEarth(c,vw,vh,cam,M.t);
 var L=TK.LEVELS,i;
 /* route between countries */
 c.save();c.translate(vw/2,cam.cy);c.scale(cam.z,cam.z);c.translate(-cam.x,-cam.y);
 for(i=0;i<L.length-1;i++){var A=lvPos(i),B=lvPos(i+1),mx=(A[0]+B[0])/2+(B[1]-A[1])*.18,my=(A[1]+B[1])/2-(B[0]-A[0])*.18,done=prog.stars[i]>0;c.strokeStyle=done?"#ffd84a":"rgba(255,255,255,.8)";c.lineWidth=(done?3.4:2.6)/Math.min(cam.z,2.2);c.setLineDash(done?[]:[6/Math.min(cam.z,2.2),7/Math.min(cam.z,2.2)]);c.beginPath();c.moveTo(A[0],A[1]);c.quadraticCurveTo(mx,my,B[0],B[1]);c.stroke()}c.setLineDash([]);
 var f=M.fl;if(f){var A2=f.A,B2=f.B,mx2=(A2[0]+B2[0])/2+(B2[1]-A2[1])*.18,my2=(A2[1]+B2[1])/2-(B2[0]-A2[0])*.18,pp=f.pp||0,qx=(1-pp)*(1-pp)*A2[0]+2*(1-pp)*pp*mx2+pp*pp*B2[0],qy=(1-pp)*(1-pp)*A2[1]+2*(1-pp)*pp*my2+pp*pp*B2[1],tx=2*(1-pp)*(mx2-A2[0])+2*pp*(B2[0]-mx2),ty=2*(1-pp)*(my2-A2[1])+2*pp*(B2[1]-my2);plane(c,qx,qy,Math.atan2(ty,tx),1/Math.min(cam.z,1.5)*1.1)}
 c.restore();
 /* markers in screen space so they stay readable */
 for(i=0;i<L.length;i++){var p=TK.mapScreen(cam,vw,L[i].lon,L[i].lat),st=prog.stars[i],unlocked=i<=prog.unlocked,sel=i===M.sel&&!f,r=sel?20:(Math.abs(i-M.sel)<=1?14:8),bob=sel?Math.sin(M.t*4)*3:0;if(p[0]<-40||p[0]>vw+40||p[1]<-60||p[1]>vh+40)continue;
  if(unlocked&&!st){c.strokeStyle="rgba(255,235,120,"+(.7-.5*((M.t*1.2+i)%1))+")";c.lineWidth=3;c.beginPath();c.arc(p[0],p[1],r+4+((M.t*1.2+i)%1)*16,0,7);c.stroke()}
  c.fillStyle=unlocked?"#fff":"#aab4c4";c.strokeStyle=sel?"#ffd84a":"rgba(0,20,60,.7)";c.lineWidth=sel?4:3;c.beginPath();c.arc(p[0],p[1],r,0,7);c.fill();c.stroke();
  if(r<12){c.fillStyle=st?"#ffd84a":(unlocked?"#fff":"#8a94a8");c.beginPath();c.arc(p[0],p[1],r*.55,0,7);c.fill()}else if(unlocked)TK.flag(c,L[i].flag,p[0]-r*.62,p[1]-r*.4,r*1.24,r*.8);else{c.fillStyle="#5a6478";c.fillRect(p[0]-5,p[1]-2,10,8);c.strokeStyle="#5a6478";c.lineWidth=2;c.beginPath();c.arc(p[0],p[1]-3,4,Math.PI,0);c.stroke()}
  if(st&&r>=12){for(var s=0;s<3;s++){c.fillStyle=s<st?"#ffd84a":"rgba(0,20,60,.45)";TK.star(c,p[0]+(s-1)*r*.8,p[1]+r+10,5.5)}}
  c.fillStyle="#fff";c.strokeStyle="rgba(0,20,60,.85)";c.lineWidth=3.5;c.lineJoin="round";c.font='400 '+(sel?13:10)+'px "Lilita One",sans-serif';c.textAlign="center";if(sel||Math.abs(i-M.sel)===1){c.strokeText(L[i].n,p[0],p[1]-r-8-bob);c.fillText(L[i].n,p[0],p[1]-r-8-bob)}
  if(sel){pin(c,p[0],p[1]-r-22-bob,.55)}}
 var vg=c.createRadialGradient(vw/2,vh*.4,vh*.2,vw/2,vh*.45,vh*.8);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,10,40,.55)");c.fillStyle=vg;c.fillRect(0,0,vw,vh)};
})(window.TK=window.TK||{});
