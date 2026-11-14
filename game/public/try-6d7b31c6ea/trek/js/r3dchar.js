/* Treasure Trek - the 3D runner: jointed body (hips, spine, legs with knees, arms with elbows, head), dressed in each country's traditional clothes */
(function(TK){var R=TK.R3D;if(!R)return;var H=R.H,T=H.T,C=R.Char={};
var P=null;
function lerp(a,b,t){return a+(b-a)*t}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

/* cloth textures: colour fade, pattern, trim line */
var clothTex=function(col,pat,trim,hem){return H.tex(128,128,function(g,w,h){var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,col[0]);gr.addColorStop(1,col[1]);g.fillStyle=gr;g.fillRect(0,0,w,h);var r=H.rnd(9);
 if(pat==="floral"){for(var i=0;i<26;i++){var x=r()*w,y=r()*(h-14);g.fillStyle=trim;for(var p=0;p<5;p++){g.beginPath();g.arc(x+Math.cos(p*1.26)*3.4,y+Math.sin(p*1.26)*3.4,2.4,0,7);g.fill()}g.fillStyle="#ffe066";g.beginPath();g.arc(x,y,1.6,0,7);g.fill()}}
 else if(pat==="gold"||pat==="batik"){g.fillStyle="rgba(255,214,90,.9)";for(var k=0;k<5;k++)g.fillRect(0,14+k*22,w,2.5);for(var j=0;j<28;j++){g.beginPath();g.arc(r()*w,r()*h,1.8,0,7);g.fill()}}
 else if(pat==="cloud"){g.strokeStyle="rgba(255,214,90,.9)";g.lineWidth=2;for(var m=0;m<18;m++){g.beginPath();g.arc(8+(m%6)*22,14+Math.floor(m/6)*34,6,0,5);g.stroke()}}
 else if(pat==="sequin"){for(var q=0;q<90;q++){g.fillStyle="rgba(255,255,255,"+(.4+r()*.5)+")";g.fillRect(r()*w,r()*h,2,2)}}
 else if(pat==="fur"){g.fillStyle="#f4f4f4";for(var u=0;u<9;u++){g.beginPath();g.arc(u*16,h-4,10,0,7);g.fill()}}
 if(hem){g.fillStyle=trim;g.fillRect(0,h-9,w,6)}},true)};clothTex=H.memo(clothTex);

C.build=function(o){var g=new T.Group(),rt=new T.Group();g.add(rt);var sk=o.skin,dk=H.shade(sk,-.16);var parts={root:g,body:rt};
 var hip=new T.Group();hip.position.y=.74;rt.add(hip);parts.hip=hip;
 var pantsCol=o.bottom[0],isPants=o.btype==="pants",isSkirt=o.btype==="skirt",isShorts=o.btype==="shorts";
 /* legs */
 function leg(sd){var th=new T.Group();th.position.set(sd*.125,-.02,0);hip.add(th);
  var upCol=isPants?pantsCol:(isShorts?pantsCol:sk),loCol=isPants?pantsCol:sk;
  var thM=H.cyl(.112,.09,.38,H.mat(upCol),0,-.19,0,th,14);var sh=new T.Group();sh.position.y=-.38;th.add(sh);var shM=H.cyl(.09,.068,.36,H.mat(loCol),0,-.18,0,sh,14);
  H.sph(.112,isPants?pantsCol:(isShorts?pantsCol:sk),0,0,0,th);H.sph(.09,loCol,0,0,0,sh);
  if(isShorts){H.cyl(.118,.114,.19,H.mat(pantsCol),0,-.095,0,th,14)}
  var ft=new T.Group();ft.position.y=-.35;sh.add(ft);var shoe=H.mat(o.shoe[0]);H.sph(.1,o.shoe[0],0,-.035,-.04,ft,null,1.05,.9,1.9);H.box(.19,.045,.36,H.mat(o.shoe[1]),0,-.09,-.06,ft);H.sph(.075,o.shoe[0],0,-.02,.07,ft,null,1.2,1,1);
  return{th:th,sh:sh,ft:ft}}
 parts.legL=leg(-1);parts.legR=leg(1);
 /* skirt or wrap */
 if(isSkirt){var len=clamp(o.blen/71*1.75,.15,.8),sm=new T.Mesh(new T.CylinderGeometry(.24,.31,len,20,1,true),new T.MeshLambertMaterial({map:clothTex(o.bottom,o.bpat,o.trim,true),side:T.DoubleSide}));sm.position.y=.0-len/2+.06;hip.add(sm);parts.skirt=sm}
 /* torso */
 var tor=new T.Group();hip.add(tor);parts.torso=tor;
 var tm=new T.MeshLambertMaterial({map:clothTex(o.top,o.pattern,o.trim,false)});
 var tb=new T.Mesh(new T.CylinderGeometry(.215,.19,.47,20),tm);tb.scale.z=.74;tb.position.y=.25;tor.add(tb);
 var sh1=H.sph(.215,H.mat(o.top[0]),0,.46,0,tor,null,1,.6,.76);
 H.cyl(.19,.215,.1,H.mat(H.shade(o.trim,0)),0,.04,0,tor,20).scale.z=.76;
 /* long tunic / robe */
 var tl=o.tlen||0;if(tl>4){var tlen=clamp(tl*.0235,.16,.86),tu=new T.Mesh(new T.CylinderGeometry(.22,.32,tlen,20,1,true),new T.MeshLambertMaterial({map:clothTex(o.top,o.pattern,o.trim,true),side:T.DoubleSide}));tu.position.y=.42-tlen/2;tu.scale.z=.82;tor.add(tu);parts.tunic=tu}
 /* backpack */
 var bp=new T.Group();bp.position.set(0,.27,.27);bp.scale.setScalar(1.22);tor.add(bp);H.box(.3,.34,.15,"#c98a4a",0,0,0,bp);H.box(.3,.1,.16,"#8f5a28",0,.12,0,bp);H.box(.2,.14,.05,"#a8703a",0,-.06,.09,bp);H.box(.04,.3,.04,"#5a3612",-.1,.0,-.09,bp);H.box(.04,.3,.04,"#5a3612",.1,.0,-.09,bp);H.box(.08,.03,.06,"#e8c25a",0,.12,.09,bp);
 /* neck + head */
 H.cyl(.08,.09,.1,H.mat(dk),0,.57,0,tor,12);
 var hd=new T.Group();hd.position.y=.83;hd.scale.setScalar(1.28);tor.add(hd);parts.head=hd;
 H.sph(.19,sk,0,0,0,hd,null,1,1.03,1);H.sph(.04,dk,-.19,-.01,0,hd);H.sph(.04,dk,.19,-.01,0,hd);
 /* face (only seen on the title screen) */
 H.sph(.022,"#2a1a10",-.07,.02,-.175,hd);H.sph(.022,"#2a1a10",.07,.02,-.175,hd);H.sph(.025,H.shade(sk,-.1),0,-.03,-.19,hd,null,.8,.8,.7);
 /* hair */
 var hc=o.hair,hairM=H.mat(hc);var st=o.acc==="headscarf"?"none":o.style;
 var hsp=new T.Mesh(new T.SphereGeometry(1,18,14,0,Math.PI*2,0,Math.PI*.78),hairM);hsp.scale.set(.205,.2,.2);hsp.position.set(0,.025,.02);hsp.rotation.x=.25;hd.add(hsp);
 if(st==="pony"){var pg=new T.Group();pg.position.set(0,.06,.19);hd.add(pg);var pc=H.cyl(.05,.025,.34,hairM,0,-.16,.02,pg,8);H.sph(.045,o.trim==="#ffd9e8"?"#ff9ab8":"#ffd24a",0,.0,0,pg);parts.pony=pg}
 else if(st==="bun"){H.sph(.1,hairM,0,.24,.04,hd);H.sph(.04,"#ffd24a",0,.2,.02,hd)}
 else if(st==="buns"){H.sph(.085,hairM,-.17,.19,0,hd);H.sph(.085,hairM,.17,.19,0,hd)}
 else if(st==="long"){var lg=new T.Group();lg.position.set(0,.04,.13);hd.add(lg);var lh=H.cyl(.15,.09,.5,hairM,0,-.22,.02,lg,12);lh.scale.z=.5;H.sph(.09,hc,0,-.47,.02,lg,null,1,.8,.55);parts.hairL=lg}
 else if(st==="short"){}
 /* hats and ornaments */
 var ac=o.acc,acc=o.accc||"#d92a2a";
 if(ac==="flower"||ac==="sakura"){for(var f=0;f<6;f++)H.sph(.035,ac==="sakura"?"#ff9ac0":"#ff6fa0",.15+Math.cos(f*1.05)*.04,.12+Math.sin(f*1.05)*.04,-.02,hd);H.sph(.025,"#ffe066",.15,.12,-.02,hd);if(ac==="sakura")H.cyl(.21,.21,.03,H.mat("#d92a5a"),0,.1,0,hd,16)}
 if(ac==="pins"){[-1,1].forEach(function(s){H.sph(.035,"#ffd24a",s*.15,.2,0,hd);H.cyl(.008,.008,.12,H.mat("#ffd24a"),s*.17,.15,0,hd,6).rotation.z=-s*.5})}
 if(ac==="nonla"){var nh=H.cone(.5,.26,H.mat("#e6cf92"),0,.22,0,hd,24);nh.scale.y=.7;H.cyl(.2,.5,.0,H.mat("#d92a2a"),0,.12,0,hd,24);var nr=new T.Mesh(new T.TorusGeometry(.49,.012,6,28),H.mat("#d92a2a"));nr.rotation.x=Math.PI/2;nr.position.y=.1;hd.add(nr)}
 if(ac==="ushanka"){H.sph(.235,"#b0a8a0",0,.06,.0,hd,null,1,.82,1);[-1,1].forEach(function(s){H.box(.075,.22,.14,"#8a827a",s*.2,-.06,.02,hd)});H.box(.3,.16,.06,"#8a827a",0,-.03,.2,hd);H.sph(.035,"#d92a2a",0,.2,-.2,hd);var fur=H.cyl(.24,.24,.04,H.mat("#cfc8c0"),0,.0,0,hd,16)}
 if(ac==="headscarf"){H.sph(.225,"#f6f1e4",0,.03,.01,hd,null,1,.95,1.02);H.box(.3,.5,.035,"#f6f1e4",0,-.3,.18,hd).rotation.x=.12;H.cyl(.215,.215,.045,H.mat("#1c1c1c"),0,.07,0,hd,16);H.cyl(.217,.217,.015,H.mat("#ffd24a"),0,.07,0,hd,16);parts.scarf=hd.children[hd.children.length-3]}
 if(ac==="feathers"){var fc=["#ff4d6d","#ffd24a","#2ac46a","#2a8ae8","#ff9a1f","#c24ad8","#ff4d6d","#ffd24a","#2ac46a"];for(var k=0;k<9;k++){var a=-1.35+k*.34,fe=H.cone(.05,.5+(4-Math.abs(k-4))*.06,H.mat(fc[k]),Math.sin(a)*.2,.22+Math.cos(a)*.14,.12,hd,6);fe.rotation.z=-a*.95;fe.rotation.x=-.25}H.cyl(.215,.215,.05,H.mat("#ffd24a"),0,.1,0,hd,16)}
 if(ac==="krama"){H.cyl(.215,.215,.09,H.mat("#d92a2a"),0,.09,0,hd,16);H.box(.1,.5,.03,"#d92a2a",-.1,-.18,.22,hd).rotation.z=.1;H.cyl(.217,.217,.012,H.mat("#fff"),0,.09,0,hd,16)}
 if(ac==="sombrero"){H.cyl(.5,.5,.03,H.mat(H.shade(acc,-.15)),0,.1,0,hd,28);H.cyl(.12,.16,.2,H.mat(acc),0,.22,0,hd,18);H.cyl(.165,.165,.04,H.mat("#ffd24a"),0,.14,0,hd,18)}
 if(ac==="cowboy"){H.cyl(.36,.36,.03,H.mat(H.shade(acc,-.1)),0,.1,0,hd,24);H.cyl(.14,.17,.19,H.mat(acc),0,.2,0,hd,18);H.cyl(.175,.175,.04,H.mat("#3a2210"),0,.13,0,hd,18)}
 if(ac==="turban"){H.sph(.235,acc,0,.07,0,hd,null,1,.82,1);[.0,.08,.16].forEach(function(y,i){var tr=new T.Mesh(new T.TorusGeometry(.19-i*.02,.05,8,18),H.mat(H.shade(acc,i%2?.12:-.12)));tr.rotation.x=Math.PI/2;tr.position.y=y+.03;hd.add(tr)});H.sph(.03,"#ffd24a",0,.14,-.21,hd)}
 if(ac==="chullo"){var cp=new T.Mesh(new T.SphereGeometry(1,16,12,0,Math.PI*2,0,Math.PI*.62),H.mat(acc));cp.scale.set(.23,.22,.23);cp.position.y=.01;hd.add(cp);[-1,1].forEach(function(s){H.box(.07,.2,.06,acc,s*.2,-.1,.02,hd);H.sph(.03,"#d92a2a",s*.2,-.21,.02,hd)});var cr=new T.Mesh(new T.TorusGeometry(.2,.02,6,18),H.mat("#ffd24a"));cr.rotation.x=Math.PI/2;cr.position.y=.1;hd.add(cr);H.sph(.04,"#fff",0,.22,0,hd)}
 if(ac==="fez"){H.cyl(.13,.16,.2,H.mat(acc),0,.2,0,hd,18);H.cyl(.01,.01,.22,H.mat("#1c1c1c"),0,.28,.1,hd,6).rotation.x=.5}
 if(ac==="beret"){var br=H.sph(.27,acc,-.02,.17,.01,hd,null,1,.28,1);br.rotation.z=.12;H.sph(.025,H.shade(acc,-.3),-.02,.26,.0,hd)}
 if(ac==="cap"){var cp2=new T.Mesh(new T.SphereGeometry(1,16,12,0,Math.PI*2,0,Math.PI*.55),H.mat(acc));cp2.scale.set(.215,.21,.215);cp2.position.y=.03;hd.add(cp2);H.cyl(.216,.216,.03,H.mat("#ffd24a"),0,.1,0,hd,16)}
 if(ac==="beads"){var bc=["#e8442a","#2a8ae8","#ffd24a","#2ac46a"];for(var b=0;b<14;b++){var an=b/14*Math.PI*2;H.sph(.028,bc[b%4],Math.cos(an)*.17,-.2,Math.sin(an)*.15,hd)}H.cyl(.205,.205,.04,H.mat("#e8442a"),0,.08,0,hd,16)}
 /* arms */
 function arm(sd){var sg=new T.Group();sg.position.set(sd*.28,.45,0);tor.add(sg);var sl=o.sleeve,sleeveCol=o.top[0],longS=sl==="long"||sl==="wide",tq=sl==="3/4";
  var uCol=sl==="none"?sk:sleeveCol,fCol=(longS||tq)?sleeveCol:sk;if(tq)fCol=sk;
  H.sph(.105,sl==="none"?sk:sleeveCol,0,0,0,sg);H.cyl(.095,.08,.28,H.mat(uCol),0,-.14,0,sg,12);
  var el=new T.Group();el.position.y=-.28;sg.add(el);H.sph(.08,fCol,0,0,0,el);
  var fm=H.cyl(sl==="wide"?.12:.078,sl==="wide"?.16:.066,.26,H.mat(fCol),0,-.13,0,el,12);
  if(sl==="wide"||longS){H.cyl(.075,.075,.03,H.mat(o.trim),0,-.25,0,el,12)}
  H.sph(.09,sk,0,-.31,0,el,null,1,1.1,.95);return{sh:sg,el:el}}
 parts.armL=arm(-1);parts.armR=arm(1);
 H.mergeLocal(g,true);
 return parts};

/* blob shadow so feet always look planted */
var blob=null;
function blobShadow(){var t=H.tex(64,64,function(g,w,h){var gr=g.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,"rgba(0,0,0,.55)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(0,0,w,h)});var m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.02;return m}
C.set=function(L,world){if(P&&P.root.parent)P.root.parent.remove(P.root);if(blob&&blob.parent)blob.parent.remove(blob);P=C.build(TK.OUTFITS[L.outfit]);P.airK=0;P.rt=0;P.root.scale.setScalar(1.05);var bub=new T.Mesh(new T.SphereGeometry(1.15,18,14),new T.MeshBasicMaterial({color:0x66ccff,transparent:true,opacity:.26,depthWrite:false}));bub.position.y=.9;bub.visible=false;P.root.add(bub);P.bubble=bub;world.add(P.root);if(!blob)blob=blobShadow();world.add(blob);C.parts=P};

/* ---------- animation: run cycle, jump, crouch-slide, blended smoothly ---------- */
var K=["hipY","pitch","lean","twist","head","thL","knL","thR","knR","shL","elL","shR","elR","spread","sy","fa","fb"];
function pose(){var o={};K.forEach(function(k){o[k]=0});return o}
var pr=pose(),pa=pose(),ps=pose(),out=pose();
C.update=function(S,dt,L){if(!P)return;
 var sp=clamp((S.speed-L.v0)/Math.max(3,L.v1-L.v0),0,1),t=S.t,ph=t*(8.2+S.speed*.22);
 P.airK+=((S.h>.04?1:0)-P.airK)*Math.min(1,dt*16);
 var s=Math.sin(ph),c=Math.cos(ph),s2=Math.sin(ph+Math.PI),c2=Math.cos(ph+Math.PI);
 /* run: high knees on the recovery swing, long reach, foot rolls heel-to-toe, arms drive with bent elbows, body rocks */
 var ampT=.85+.2*sp;
 pr.hipY=.725+.04*Math.abs(Math.cos(ph));pr.pitch=0;pr.lean=-(.12+.2*sp);pr.twist=.2*s;pr.head=.12+.18*sp;
 pr.thL=ampT*s+.1;pr.knL=-(.15+1.35*Math.max(0,c));pr.thR=ampT*s2+.1;pr.knR=-(.15+1.35*Math.max(0,c2));
 pr.shL=1.1*s2;pr.shR=1.1*s;pr.elL=1.45+.35*Math.max(0,s2);pr.elR=1.45+.35*Math.max(0,s);pr.spread=.12;pr.sy=1;
 pr.fa=.5*Math.max(0,c)-.35*Math.max(0,-c);pr.fb=.5*Math.max(0,c2)-.35*Math.max(0,-c2);
 /* jump: stretched take-off with one knee driving up, arms thrown wide, then legs reach for the ground */
 var u=clamp(.5+S.vy/16,0,1);
 pa.hipY=lerp(.76,.8,u);pa.pitch=0;pa.lean=lerp(-.05,-.15,u);pa.twist=0;pa.head=.05;
 pa.thL=lerp(.35,1.3,u);pa.knL=lerp(-.3,-1.6,u);pa.thR=lerp(-.05,-.4,u);pa.knR=lerp(-.25,-.5,u);
 pa.shL=lerp(.2,-.9,u);pa.elL=lerp(.6,.4,u);pa.shR=lerp(.9,2.6,u);pa.elR=lerp(.6,.3,u);pa.spread=lerp(.9,.35,u);pa.sy=lerp(.98,1.04,u);pa.fa=lerp(.3,-.2,u);pa.fb=lerp(.3,-.2,u);
 /* slide: a dive-slide along the ground, arms stretched ahead, chest low, feet trailing */
 ps.hipY=.3;ps.pitch=-1.42;ps.lean=0;ps.twist=0;ps.head=.95;ps.thL=.15;ps.knL=-.6;ps.thR=.05;ps.knR=-.9;ps.shL=3.0;ps.elL=.12;ps.shR=2.85;ps.elR=.15;ps.spread=.3;ps.sy=1;ps.fa=-.3;ps.fb=-.3;
 var ws=clamp(S.slideK,0,1)*(1-P.airK),wa=P.airK,wr=Math.max(0,1-wa-ws);
 K.forEach(function(k){out[k]=pr[k]*wr+pa[k]*wa+ps[k]*ws});
 var lq=S.landT>0?S.landT/.2:0;out.hipY-=.12*lq;out.thL+=.5*lq;out.thR+=.5*lq;out.knL-=.8*lq;out.knR-=.8*lq;out.lean-=.15*lq;
 var p=P,th=out.pitch;p.hip.position.y=.74;
 p.body.rotation.x=th;p.body.position.y=out.hipY-.74*Math.cos(th);p.body.position.z=-.74*Math.sin(th);
 p.torso.rotation.x=out.lean;p.torso.rotation.y=out.twist;p.head.rotation.x=out.head-out.lean*.4;p.head.rotation.y=-out.twist*.7;
 p.legL.th.rotation.x=out.thL;p.legL.sh.rotation.x=out.knL;p.legL.ft.rotation.x=out.fa;
 p.legR.th.rotation.x=out.thR;p.legR.sh.rotation.x=out.knR;p.legR.ft.rotation.x=out.fb;
 p.armL.sh.rotation.x=out.shL;p.armL.sh.rotation.z=-out.spread;p.armL.el.rotation.x=out.elL;
 p.armR.sh.rotation.x=out.shR;p.armR.sh.rotation.z=out.spread;p.armR.el.rotation.x=out.elR;
 if(p.skirt){p.skirt.rotation.x=.14*s*wr+.2*ws;p.skirt.rotation.z=.07*c*wr;p.skirt.scale.set(1+.05*Math.abs(s)+.12*wa,1,1+.05*Math.abs(c)+.12*wa)}
 if(p.tunic){p.tunic.rotation.x=.18*s*wr+.1*ws+.25*wa;p.tunic.rotation.z=.05*c}
 if(p.pony){p.pony.rotation.x=.55+.6*s*wr+.3*wa-.5*ws;p.pony.rotation.z=.15*c}
 if(p.hairL){p.hairL.rotation.x=.3+.4*s*wr+.4*wa}
 p.root.position.set(S.x*2,S.h*1.0,0);
 var roll=clamp((S.lane-S.x)*.22,-.3,.3);p.root.rotation.z=roll*(1-ws);p.root.rotation.y=clamp((S.lane-S.x)*-.2,-.28,.28);
 var sq=S.landT>0?1-.1*lq:1;p.root.scale.set(1.05*(1+(1-sq)*.6),1.05*sq*out.sy,1.05*(1+(1-sq)*.6));
 if(S.inv>0&&((S.t*14)|0)%2){p.root.visible=false}else p.root.visible=true;
 if(p.bubble){p.bubble.visible=S.shield>0;p.bubble.scale.setScalar(1+.04*Math.sin(S.t*8));if(S.shield>0&&S.shield<1.2&&((S.t*10)|0)%2)p.bubble.visible=false}
 if(blob){blob.position.x=S.x*2;var k=1-clamp(S.h/3,0,.7);blob.scale.set(.95*k*(1+ws*.9),.95*k*(1+ws*1.1),1);blob.position.z=-ws*.5}}

/* ---------- a separate small 3D stage for portraits (title screen, character sheets): front view, running in place, slowly turning ---------- */
var PR=null;
C.portrait=function(outfit,t,front){if(!PR){var cv=document.createElement("canvas");cv.width=300;cv.height=380;var rd=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});rd.setClearColor(0x000000,0);var sc=new T.Scene();sc.add(new T.HemisphereLight(0xffffff,0xaa9a80,.85));var dl=new T.DirectionalLight(0xfff0d0,.85);dl.position.set(-3,5,5);sc.add(dl);var cam=new T.PerspectiveCamera(28,300/380,.1,50);cam.position.set(0,1.15,5.6);cam.lookAt(0,.92,0);PR={cv:cv,rd:rd,sc:sc,cam:cam,cur:null,key:null}}
 if(PR.key!==outfit){if(PR.cur){PR.sc.remove(PR.cur.root)}PR.cur=C.build(TK.OUTFITS[outfit]);PR.cur.root.scale.setScalar(1.05);PR.sc.add(PR.cur.root);PR.key=outfit}
 var p=PR.cur,ph=t*9,s=Math.sin(ph),c2=Math.cos(ph),s2=Math.sin(ph+Math.PI),c3=Math.cos(ph+Math.PI);
 p.hip.position.y=.74+.04*Math.cos(2*ph);p.torso.rotation.x=-.12;p.torso.rotation.y=.12*s;p.head.rotation.x=.1;
 p.legL.th.rotation.x=1.0*s;p.legL.sh.rotation.x=-(.2+1.1*Math.max(0,c2));p.legR.th.rotation.x=1.0*s2;p.legR.sh.rotation.x=-(.2+1.1*Math.max(0,c3));
 p.legL.ft.rotation.x=-(p.legL.th.rotation.x+p.legL.sh.rotation.x)*.4;p.legR.ft.rotation.x=-(p.legR.th.rotation.x+p.legR.sh.rotation.x)*.4;
 p.armL.sh.rotation.x=1.0*s2;p.armR.sh.rotation.x=1.0*s;p.armL.el.rotation.x=1.2;p.armR.el.rotation.x=1.2;p.armL.sh.rotation.z=-.1;p.armR.sh.rotation.z=.1;
 if(p.skirt){p.skirt.rotation.x=.1*s}if(p.tunic){p.tunic.rotation.x=.14*s}if(p.pony){p.pony.rotation.x=.5+.4*s}
 p.root.rotation.y=Math.PI+(front===false?Math.PI:0)+Math.sin(t*.7)*.5;p.root.position.y=0;
 PR.rd.render(PR.sc,PR.cam);return PR.cv};
})(window.TK=window.TK||{});
