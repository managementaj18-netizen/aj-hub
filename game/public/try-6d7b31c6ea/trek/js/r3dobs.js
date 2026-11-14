/* Treasure Trek - 3D street: buildings with painted facades, trees, lamps, obstacles, coins, gates, the treasure chest and Angkor Wat */
(function(TK){var R=TK.R3D;if(!R)return;var H=R.H,T=H.T,Pr=R.Props={};
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function pick(r,a){return a[Math.floor(r()*a.length)]}

/* ---------- facade painter: windows, shutters, balconies, shops - one style per region ---------- */
var PAL={
 euro:[["#f0dcc0","#c86a4a","#7a4a3a"],["#e8c4b0","#7a4a3a","#5a3a2a"],["#f6ecd0","#a8452a","#6a3a2a"],["#d8dcc8","#6a4a3a","#4a5a4a"],["#ecd0a8","#8a3a2a","#5a3a2a"]],
 med:[["#f8f4ea","#2a6ab0","#c8503a"],["#f0e6d0","#2a8a9a","#c8503a"],["#fbeee0","#2a6ab0","#a8452a"],["#f2dcc0","#3a7a9a","#b8502a"]],
 namer:[["#b4503a","#5a6a7a","#3a2a24"],["#8a9ab0","#3a4a5a","#2a3a4a"],["#c8b8a0","#5a4a3a","#3a2a24"],["#7ab0d8","#2a5a88","#1a3a58"]],
 latam:[["#f0a070","#a83a2a","#6a2a1a"],["#f0d060","#8a5a2a","#6a3a1a"],["#70c0b0","#2a6a5a","#1a4a3a"],["#e87a9a","#8a2a4a","#5a1a2a"]],
 east:[["#c8402e","#4a2a24","#2a1a14"],["#e8c080","#7a3a24","#4a2a1a"],["#f0e0c0","#3a2a24","#2a1a14"]],
 sea:[["#f0c860","#8a4a2a","#3a7a3a"],["#e88a8a","#6a3a3a","#3a7a3a"],["#70b8c8","#3a5a6a","#2a6a4a"],["#f4e0a0","#7a4a2a","#2a6a4a"]],
 india:[["#f0a098","#8a3a3a","#4a2a2a"],["#f0c890","#7a4a2a","#4a2a1a"],["#d88aa0","#6a2a4a","#3a1a2a"],["#f6e0a0","#8a5a2a","#4a3a1a"]],
 desert:[["#e8cc98","#b8864a","#7a5a2a"],["#dcba82","#a8763a","#6a4a1a"],["#f0dcb0","#c0904a","#7a5a2a"]],
 alps:[["#b88a5a","#5a3a20","#7a2a1a"],["#f0e6d0","#7a3a2a","#4a2a18"],["#a87a4a","#4a2a18","#6a2a1a"]],
 boreal:[["#c8a070","#6a3a20","#8a2a1a"],["#d8d4c8","#4a5a6a","#6a2a1a"],["#a8805a","#4a3018","#5a2a1a"]],
 trop:[["#e8d4a0","#7a5a2a","#2a6a3a"],["#c8a878","#5a3a1a","#2a6a3a"]],
 default:[["#e8d8b8","#8a4a3a","#5a3a2a"],["#d8c8a8","#5a4a4a","#4a3a2a"]]};
var TEX={};Pr.flush=function(){TEX={}};
function winFrame(g,x,y,w,h,kit,lit,arch,shut,col){var trim=col||"#5a4030";g.fillStyle=trim;if(arch){g.beginPath();g.moveTo(x-3,y+h);g.lineTo(x-3,y+w/2);g.arc(x+w/2,y+w/2,w/2+3,Math.PI,0);g.lineTo(x+w+3,y+h);g.closePath();g.fill()}else g.fillRect(x-3,y-3,w+6,h+6);
 var gr=g.createLinearGradient(x,y,x+w,y+h);if(lit){gr.addColorStop(0,"#ffe9a8");gr.addColorStop(1,"#f0b860")}else if(kit==="namer"){gr.addColorStop(0,"#bfe0f4");gr.addColorStop(1,"#5a8ab0")}else{gr.addColorStop(0,"#9ac4e0");gr.addColorStop(1,"#3a5a7a")}g.fillStyle=gr;if(arch){g.beginPath();g.moveTo(x,y+h);g.lineTo(x,y+w/2);g.arc(x+w/2,y+w/2,w/2,Math.PI,0);g.lineTo(x+w,y+h);g.closePath();g.fill()}else g.fillRect(x,y,w,h);
 g.fillStyle="rgba(255,255,255,.28)";g.beginPath();g.moveTo(x+2,y+h);g.lineTo(x+w*.45,y+2);g.lineTo(x+w*.6,y+2);g.lineTo(x+w*.15,y+h);g.fill();
 g.strokeStyle=trim;g.lineWidth=2;g.beginPath();g.moveTo(x+w/2,y+(arch?w/2:0));g.lineTo(x+w/2,y+h);if(!arch){g.moveTo(x,y+h*.5);g.lineTo(x+w,y+h*.5)}g.stroke();
 g.fillStyle=trim;g.fillRect(x-5,y+h,w+10,4);
 if(shut){g.fillStyle=shut;g.fillRect(x-w*.42,y,w*.38,h);g.fillRect(x+w*1.04,y,w*.38,h);g.fillStyle="rgba(0,0,0,.22)";for(var s=1;s<5;s++){g.fillRect(x-w*.42,y+s*h/5,w*.38,1.5);g.fillRect(x+w*1.04,y+s*h/5,w*.38,1.5)}}}
function facade(kit,pi,bays,floors,seed){var key=kit+"|"+pi+"|"+bays+"|"+floors+"|"+seed;if(TEX[key])return TEX[key];var pal=(PAL[kit]||PAL["default"])[pi%(PAL[kit]||PAL["default"]).length],wall=pal[0],roof=pal[1],acc=pal[2];
 var cw=96,fh=84,w=bays*cw,h=floors*fh+30,sc=1;
 var tx=H.tex(w,h,function(g){var r=H.rnd(seed*7+bays*3+floors),gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,H.shade(wall,.12));gr.addColorStop(1,H.shade(wall,-.12));g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(var i=0;i<w*h/60;i++){g.fillStyle="rgba("+(r()<.5?"0,0,0":"255,255,255")+","+(r()*.05)+")";g.fillRect(r()*w,r()*h,1+r()*3,1+r()*2)}
  if(kit==="east"){g.fillStyle=acc;for(var c=0;c<=bays;c++)g.fillRect(c*cw-6,0,12,h)}
  if(kit==="alps"||kit==="boreal"){g.strokeStyle="rgba(40,20,5,.35)";g.lineWidth=2;for(var y=8;y<h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}}
  if(kit==="namer"&&pi%4===1){g.strokeStyle="rgba(255,255,255,.1)";for(var yy=0;yy<h;yy+=12){g.beginPath();g.moveTo(0,yy);g.lineTo(w,yy);g.stroke()}}
  /* ground floor: shop window, door, sign band */
  var gy=h-fh+2;g.fillStyle=H.shade(wall,-.08);g.fillRect(0,gy-8,w,fh);g.fillStyle=acc;g.fillRect(0,gy-10,w,8);
  for(var b=0;b<bays;b++){var x=b*cw;if(b===Math.floor(bays/2)){g.fillStyle="#4a3020";g.fillRect(x+cw*.28,gy+8,cw*.44,fh-10);g.fillStyle="#d8a840";g.fillRect(x+cw*.64,gy+fh*.5,4,4);g.fillStyle="#9ac4e0";g.fillRect(x+cw*.34,gy+14,cw*.32,fh*.34)}
   else{winFrame(g,x+cw*.18,gy+12,cw*.64,fh*.55,kit,r()<.4,false,null,null)}
   var ac=["#d8302a","#2a9a6a","#2a6ad8","#e8a010"][(b+seed)%4];if(kit!=="namer"&&kit!=="alps"){g.fillStyle=ac;g.fillRect(x+cw*.08,gy-2,cw*.84,10);g.fillStyle="rgba(255,255,255,.85)";for(var s=0;s<6;s++)g.fillRect(x+cw*.08+s*cw*.14,gy-2,cw*.07,10)}}
  /* upper floors */
  for(var f=0;f<floors-1;f++){var fy=f*fh+12;g.fillStyle=H.shade(wall,-.2);g.fillRect(0,fy+fh-8,w,4);
   for(var bb=0;bb<bays;bb++){var wx=bb*cw+cw*.24,ww=cw*.52,wh=fh*.56,lit=r()<.3,arch=(kit==="euro"||kit==="med"||kit==="india"||kit==="desert"||kit==="latam")&&r()<.75,shut=(kit==="med"||kit==="sea"||kit==="euro"||kit==="alps")?(kit==="med"?"#2a6ab0":kit==="sea"?"#3a7a3a":"#6a4a3a"):null;
    if(kit==="namer"&&pi%4===3){g.fillStyle="rgba(120,180,220,.8)";g.fillRect(bb*cw+4,fy+6,cw-8,fh-14);g.fillStyle="rgba(255,255,255,.18)";g.fillRect(bb*cw+4,fy+6,(cw-8)*.35,fh-14);continue}
    winFrame(g,wx,fy+10,ww,wh,kit,lit,arch,shut,acc);
    if(kit==="latam"||kit==="euro"||kit==="med"){g.fillStyle=H.shade(acc,-.1);g.fillRect(wx-6,fy+10+wh+4,ww+12,5);g.strokeStyle=H.shade(acc,-.2);g.lineWidth=1.5;for(var bx=0;bx<=ww+12;bx+=8){g.beginPath();g.moveTo(wx-6+bx,fy+10+wh+9);g.lineTo(wx-6+bx,fy+10+wh+20);g.stroke()}}
    if((kit==="euro"||kit==="med"||kit==="alps"||kit==="sea")&&r()<.5){g.fillStyle="#7a4a2a";g.fillRect(wx-2,fy+10+wh+4,ww+4,7);for(var pl=0;pl<4;pl++){g.fillStyle=["#e8442a","#ff9ac0","#ffd24a","#4aa84a"][pl];g.beginPath();g.arc(wx+4+pl*ww/3.4,fy+10+wh+2,4,0,7);g.fill()}}}}
  g.fillStyle=H.shade(roof,-.1);g.fillRect(0,0,w,7);g.fillStyle="rgba(255,255,255,.25)";g.fillRect(0,7,w,2)},false);
 tx.userData={w:w,h:h};TEX[key]=tx;return tx}
function wallTex(kit,pi,seed){var key="w|"+kit+"|"+pi+"|"+seed;if(TEX[key])return TEX[key];var pal=(PAL[kit]||PAL["default"])[pi%(PAL[kit]||PAL["default"]).length];var t=H.tex(64,64,function(g){g.fillStyle=H.shade(pal[0],-.2);g.fillRect(0,0,64,64);var r=H.rnd(seed+4);for(var i=0;i<120;i++){g.fillStyle="rgba(0,0,0,"+(r()*.06)+")";g.fillRect(r()*64,r()*64,2,2)}});TEX[key]=t;return t}

/* ---------- a building: box with facade on the road side, roof, chimney, awning ---------- */
function roofMat(c){return H.mat(c)}
function building(L,sg,r,dmax){var kit=L.kit,pals=PAL[kit]||PAL["default"],pi=Math.floor(r()*pals.length),pal=pals[pi],g=new T.Group();
 var bays=2+Math.floor(r()*3),city=kit==="namer"||kit==="euro"||kit==="med"||kit==="latam"||kit==="india"||kit==="sea";var floors=kit==="namer"?4+Math.floor(r()*4):city?3+Math.floor(r()*3):kit==="east"?2+Math.floor(r()*2):2+Math.floor(r()*2);
 var seed=1+Math.floor(r()*3),tex=facade(kit,pi,bays,floors,seed),fl=bays*2.15,h=tex.userData.h/84*1.9,bx=4.6+r()*2.2,wt=wallTex(kit,pi,seed);
 var road=sg<0?0:1; /* face index toward the road: left side looks +x (0), right side looks -x (1) */
 var mats=[H.mat(0xffffff),H.mat(0xffffff),H.mat(pal[1]),H.mat(0x444444),H.mat(0xffffff),H.mat(0xffffff)];
 var fm=new T.MeshLambertMaterial({map:tex}),wm=new T.MeshLambertMaterial({map:wt});
 var arr=[wm,wm,H.mat(H.shade(pal[0],-.35)),H.mat("#333"),wm,wm];arr[road]=fm;
 /* the end wall that faces the player gets a window facade too */
 var endTex=facade(kit,pi,Math.max(2,Math.round(bx/2.15)),floors,seed+1);arr[4]=new T.MeshLambertMaterial({map:endTex});
 var bm=new T.Mesh(new T.BoxGeometry(bx,h,fl),arr);bm.position.set(0,h/2,0);g.add(bm);
 /* roof */
 var gable=kit==="euro"||kit==="med"||kit==="alps"||kit==="boreal"||kit==="east"||kit==="india"||kit==="sea"&&r()<.5||kit==="trop"||kit==="default"||kit==="latam"&&r()<.4;
 if(kit==="east"){for(var t=0;t<2;t++){var ew=bx+1.2-t*1.2,el=fl+1.2-t*1.2;H.box(ew,.22,el,pal[1],0,h+.1+t*1.2,0,g);H.box(ew-.6,1.0,el-.6,pal[0],0,h+.7+t*1.2,0,g);H.box(ew+.5,.12,el+.5,"#2a1a14",0,h+.22+t*1.2,0,g)}H.cone(.5,.8,H.mat("#d8a830"),0,h+3.1,0,g,6)}
 else if(gable&&kit!=="sea"){var ang=.55,rise=bx/2*Math.tan(ang),sh=new T.Shape();sh.moveTo(-bx/2,0);sh.lineTo(bx/2,0);sh.lineTo(0,rise);sh.closePath();var eg=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:fl,bevelEnabled:false}),H.mat(pal[0]));eg.position.set(0,h,fl/2);g.add(eg);
  var sl=bx/2/Math.cos(ang)+.35;[-1,1].forEach(function(s){var sl2=H.box(sl,.2,fl+.5,pal[1],s*bx/4,h+rise/2+.08,0,g);sl2.rotation.z=-s*ang;sl2.position.x=s*(bx/4+.05)});
  if(r()<.7){H.box(.5,rise*.7,.5,pal[2]||"#6a3a2a",bx*.18*(r()<.5?-1:1),h+rise*.7,fl*.2,g);}}
 else{H.box(bx+.2,.35,fl+.2,H.shade(pal[0],-.25),0,h+.17,0,g);if(kit==="namer"&&r()<.6){H.box(1.2,1.0,1.2,"#9aa6b2",0,h+.85,0,g)}if(kit==="desert"||kit==="india"){H.sph(1.1,H.shade(pal[0],.2),0,h+.4,0,g,null,1,.8,1)}if(kit==="sea"){H.box(bx-.4,.18,fl,pal[1],0,h+.4,0,g)}}
 /* real 3D relief: cornice, plinth, corner pilasters, floor bands, balconies, shop sign, awning, air-con boxes */
 var ds=sg<0?1:-1,unit=1.9/84,fhp=84,bayW=fl/bays;
 H.box(bx+.34,.3,fl+.34,H.shade(pal[0],.22),0,h+.02,0,g);H.box(bx+.14,.55,fl+.14,H.shade(pal[0],-.32),0,.27,0,g);
 [-1,1].forEach(function(a){[-1,1].forEach(function(b){H.box(.4,h,.4,H.shade(pal[0],.14),a*bx/2,h/2,b*fl/2,g)})});
 for(var f=0;f<floors-1;f++){var yb=h-(f*fhp+fhp+4)*unit;H.box(bx+.12,.1,fl+.12,H.shade(pal[0],-.1),0,yb,0,g)}
 var bal=kit==="euro"||kit==="med"||kit==="latam"||kit==="india"||kit==="sea"||kit==="alps";
 if(bal)for(var f2=0;f2<floors-1;f2++)for(var b2=0;b2<bays;b2++){if(r()<.34){var zc=-fl/2+(b2+.5)*bayW,yy=h-(f2*fhp+69)*unit;H.box(.58,.08,bayW*.72,H.shade(pal[0],-.18),ds*(bx/2+.29),yy,zc,g);H.box(.05,.36,bayW*.72,pal[2]||"#5a3a2a",ds*(bx/2+.56),yy+.2,zc,g);H.box(.5,.05,.05,pal[2]||"#5a3a2a",ds*(bx/2+.3),yy+.36,zc-bayW*.34,g);H.box(.5,.05,.05,pal[2]||"#5a3a2a",ds*(bx/2+.3),yy+.36,zc+bayW*.34,g);if(r()<.6){H.sph(.13,["#e8442a","#ff9ac0","#ffd24a"][b2%3],ds*(bx/2+.45),yy+.2,zc+(r()-.5)*.3,g,null,1.2,.8,1)}}}
 if(r()<.5){H.box(.5,.4,.5,"#c8ccd0",ds*(bx/2+.25),h*.45+r()*h*.2,(r()-.5)*fl*.7,g)}
 var names=["CAFE","BAKERY","HOTEL","BOOKS","PIZZA","MARKET","TEA","SHOP","BAR","FLOWERS"],nm=names[Math.floor(r()*names.length)],sm=new T.MeshLambertMaterial({map:banner(nm,false,["#8a2a2a","#2a5a8a","#2a6a4a","#6a4a2a","#5a2a6a"][Math.floor(r()*5)])}),sb=new T.Mesh(new T.BoxGeometry(.16,.5,Math.min(3,fl*.62)),[sm,sm,H.mat("#3a2a20"),H.mat("#3a2a20"),H.mat("#3a2a20"),H.mat("#3a2a20")]);sb.position.set(ds*(bx/2+.12),2.15,0);g.add(sb);
 var aw=H.box(.75,.1,fl*.84,["#d8302a","#2a9a6a","#2a6ad8","#e8a010"][Math.floor(r()*4)],ds*(bx/2+.38),1.85,0,g);aw.rotation.z=-ds*.3;
 g.userData.bx=bx;g.userData.fl=fl;g.userData.h=h;
 return H.merge(g,true,true)}

/* ---------- trees, plants, lamps ---------- */
function tree(kind,r){var g=new T.Group();
 if(kind==="oak"||kind==="cherry"||kind==="birch"){var col=kind==="cherry"?"#ffb0cc":"#4a9a4a",tr=H.cyl(.14,.2,1.5,H.mat("#6a4a2a"),0,.75,0,g,8);var s=1+r()*.5;[[0,2.2,.95],[-.6,1.9,.65],[.6,1.85,.7],[0,2.8,.6]].forEach(function(b,i){H.ico(b[2]*s,H.shade(col,i*.06-.08),b[0]*s,b[1]*s,(i%2?.2:-.2),g)})}
 else if(kind==="fir"||kind==="snowpine"){H.cyl(.1,.14,.6,H.mat("#5a3a20"),0,.3,0,g,8);for(var f=0;f<4;f++){var w=1.15-f*.22;var c=H.cone(w,1.1,H.mat(f%2?"#1f5a3a":"#2a7a4a",{fl:1}),0,.9+f*.62,0,g,9);if(kind==="snowpine"||true){H.cone(w*.62,.5,H.mat("#f4f8ff"),0,1.15+f*.62,0,g,9)}}}
 else if(kind==="palm"){var h=3.2+r()*.8,lean=(r()-.5)*.5;for(var i=0;i<6;i++){H.cyl(.14-i*.012,.16-i*.012,h/6+.02,H.mat("#8a6a3a"),lean*i/6*1.2,.2+i*h/6,0,g,8)}for(var l=0;l<8;l++){var a=l/8*6.283,lf=H.cone(.22,1.7,H.mat(l%2?"#2f9a4a":"#3aaa56",{fl:1}),Math.cos(a)*.7+lean*1.2,h+.15,Math.sin(a)*.7,g,5);lf.rotation.z=Math.cos(a)*1.25;lf.rotation.x=-Math.sin(a)*1.25;}H.sph(.12,"#6a4a2a",lean*1.2,h,0,g);H.sph(.1,"#6a4a2a",lean*1.2+.15,h-.1,.1,g)}
 else if(kind==="cactus"){H.cyl(.3,.34,2.4,H.mat("#3a8a4a"),0,1.2,0,g,10);H.sph(.3,"#3a8a4a",0,2.4,0,g);[[-.55,1.4],[.55,1.0]].forEach(function(a,i){H.cyl(.16,.16,.7,H.mat("#3a8a4a"),a[0],a[1],0,g,8);H.cyl(.16,.16,.5,H.mat("#3a8a4a"),a[0]*.6,a[1]-.3,0,g,8).rotation.z=a[0]>0?-1.2:1.2;H.sph(.16,"#3a8a4a",a[0],a[1]+.36,0,g)})}
 else if(kind==="acacia"){H.cyl(.12,.2,2,H.mat("#5a3a20"),0,1,0,g,8);H.cyl(.08,.1,1,H.mat("#5a3a20"),.3,2.3,0,g,6).rotation.z=-.5;H.cyl(.08,.1,1,H.mat("#5a3a20"),-.3,2.3,0,g,6).rotation.z=.5;[[0,2.9,1.3],[-.8,2.6,.8],[.8,2.6,.8]].forEach(function(b,i){H.sph(b[2],i?"#6a8a30":"#7a9a38",b[0],b[1],0,g,null,1,.3,1)})}
 else if(kind==="banana"||kind==="jungle"){H.cyl(.12,.16,1.8,H.mat("#6a8a2a"),0,.9,0,g,8);for(var j=0;j<7;j++){var a2=j/7*6.283,lf2=H.box(.5,.04,1.5,"#3aa83a",Math.cos(a2)*.7,1.9,Math.sin(a2)*.7,g);lf2.rotation.y=-a2+Math.PI/2;lf2.rotation.x=.55}}
 else if(kind==="baobab"){H.cyl(.8,1.0,2.6,H.mat("#7a5a44"),0,1.3,0,g,12);[-1,0,1].forEach(function(s){var b=H.cyl(.14,.2,1.4,H.mat("#6a4a34"),s*.55,3,0,g,6);b.rotation.z=-s*.6;H.sph(.7,"#5a9a3a",s*1.0,3.9,0,g,null,1,.55,1)})}
 return H.merge(g,true,false)}
function lamp(r,lantern){var g=new T.Group();H.cyl(.06,.09,3.4,H.mat(lantern?"#6a2a14":"#2a2a30"),0,1.7,0,g,8);if(lantern){H.sph(.3,"#e8382a",0,3.2,0,g,{em:"#661008"},1,1.3,1);H.box(.35,.06,.35,"#ffd24a",0,3.55,0,g);H.box(.35,.06,.35,"#ffd24a",0,2.85,0,g)}else{H.box(.5,.07,.07,"#2a2a30",.22,3.38,0,g);H.sph(.14,"#fff1b0",.46,3.28,0,g,{em:"#a88a2a"})}H.box(.3,.2,.3,"#2a2a30",0,.1,0,g);return H.merge(g,true,false)}
function rocks(r,col){var g=new T.Group();for(var i=0;i<3;i++){H.ico(.5+r()*.6,H.shade(col,(r()-.5)*.25),(r()-.5)*1.6,.3,(r()-.5)*1.2,g,1.2,.75,1)}return H.merge(g,true,false)}
function hut(r,L){var g=new T.Group(),wall=pick(r,["#d9b878","#c89a5a","#e8d0a0"]);H.cyl(1.0,1.05,1.3,H.mat(wall),0,.65,0,g,14);H.cone(1.45,1.1,H.mat("#b8862a",{fl:1}),0,1.85,0,g,14);H.box(.4,.7,.1,"#4a3020",0,.4,-1.0,g);return H.merge(g,true,true)}
function adobeHouse(r,L){var g=new T.Group(),c=pick(r,["#e8c898","#d8a878","#f0d4a8"]);H.box(2.4,1.8,2.2,c,0,.9,0,g);H.box(2.5,.15,2.3,H.shade(c,.2),0,1.85,0,g);H.box(.5,.9,.1,"#2a6a8a",0,.45,-1.12,g);H.box(.5,.45,.1,"#2a6a8a",.7,1.1,-1.12,g);return H.merge(g,true,true)}
function snowman(){var g=new T.Group();H.sph(.55,"#f4f8ff",0,.5,0,g);H.sph(.4,"#f4f8ff",0,1.2,0,g);H.sph(.28,"#f4f8ff",0,1.68,0,g);H.cyl(.18,.18,.22,H.mat("#2a2a2a"),0,1.98,0,g,10);H.cyl(.3,.3,.04,H.mat("#2a2a2a"),0,1.87,0,g,10);H.cone(.05,.3,H.mat("#ff8a1a"),0,1.68,-.3,g,6).rotation.x=-Math.PI/2;H.shadowAll(g,true,false);return g}

/* ---------- the street generator ---------- */
Pr.reset=function(L,S){};
var NAT={boreal:["snowpine","snowpine","snowpine"],namer:["oak","oak"],latam:["palm","cactus","oak"],trop:["jungle","banana","jungle","palm"],island:["palm","palm","palm"],andes:["rocks","fir"],pampas:["oak","oak"],savanna:["acacia","baobab","acacia"],desert:["palm","rocks","cactus"],med:["oak","palm"],euro:["oak","oak","birch"],alps:["snowpine","fir"],steppe:["rocks"],india:["palm","banana","oak"],east:["cherry","cherry","fir"],sea:["palm","banana","palm"],pacific:["fir","jungle","oak"],outback:["rocks","cactus","acacia"]};
var CITY={namer:.82,euro:.85,med:.85,latam:.8,east:.7,sea:.78,india:.8,desert:.65,alps:.6,boreal:.5,trop:.28,savanna:.2,island:.3,andes:.3,pampas:.22,steppe:.18,pacific:.3,outback:.15};
Pr.nextPiece=function(L,sg,street,cKey,S){var r=H.rnd((street["n"+cKey.slice(1)]+1)*977+(sg+2)*131+(L.id.charCodeAt(0)*17)+(L.id.charCodeAt(1)||0)*31);var z=street[cKey],kit=L.kit,cityP=CITY[kit]==null?.5:CITY[kit];
 var g,len,xoff=3.95;
 var zn=null;if(R.zones)for(var qi=0;qi<R.zones.length;qi++){var q=R.zones[qi];if(z>=q.a-1&&z<q.b){zn=q;break}}
 if(zn){if(sg>0){street[cKey]=z+8;return null}var first=z<zn.a+7.5,last=z+8>=zn.b;g=tunnelSeg(L,first||last,last&&!first);g.userData.zz=z+4;g.userData.len=4.5;g.userData.zstart=z;g.userData.tun=1;street[cKey]=z+8;return g}
 if(r()<cityP){g=building(L,sg,r);len=g.userData.fl;var xc=sg*(3.95+g.userData.bx/2+.5);g.position.x=xc;g.userData.zz=z;g.userData.len=len;g.userData.cx=xc;street[cKey]=z+len+.06;g.userData.zz=z+len/2;g.userData.len=len/2+.2;g.userData.zstart=z;return g}
 /* gap: tree, lamp, rocks, hut */
 var k=r(),x=sg*(4.3+r()*1.6);len=2.2+r()*2.4;
 if(k<.18&&(kit==="euro"||kit==="med"||kit==="namer"||kit==="latam"||kit==="alps"||kit==="india")){g=lamp(r,false);x=sg*3.45}
 else if(k<.3&&kit==="east"){g=lamp(r,true);x=sg*3.45}
 else if(k<.4&&(kit==="savanna"||kit==="trop"||kit==="island"||kit==="sea"||kit==="pacific"||kit==="outback")){g=kit==="trop"||kit==="island"||kit==="sea"||kit==="pacific"?hut(r,L):adobeHouse(r,L);x=sg*(5.3+r()*1.2);len=3.2}
 else if(k<.5&&(kit==="andes"||kit==="pampas"||kit==="steppe")){g=adobeHouse(r,L);x=sg*(5.3+r()*1.2);len=3.4}
 else if(k<.58&&(kit==="boreal"||kit==="alps")&&r()<.5){g=snowman();x=sg*4.2}
 else{var kinds=NAT[kit]||["oak"],kd=kinds[Math.floor(r()*kinds.length)];if(kd==="rocks")g=rocks(r,"#9a9aa0");else g=tree(kd,r);x=sg*(4.2+r()*3.2)}
 g.position.x=x;g.userData.zz=z+len/2;g.userData.len=len/2+.5;g.userData.zstart=z;street[cKey]=z+len;return g};


/* ---------- tunnels: stone walls, arched ribs, pipes, caged lamps, ceiling strips ---------- */
function tunnelSeg(L,portal,exit){var g=new T.Group(),len=8,wt=stone("#6a645a");wt.repeat.set(len/2,3);var wm=new T.MeshLambertMaterial({map:wt}),dark=H.mat("#2a2624"),metal=H.mat("#3a3632");
 [-1,1].forEach(function(s){var w=new T.Mesh(new T.BoxGeometry(1.2,6.6,len),wm);w.position.set(s*5.6,3.3,0);g.add(w);
  H.box(.7,5.6,.7,dark,s*4.95,2.8,0,g);H.box(.9,.4,.9,metal,s*4.95,.2,0,g);H.box(.9,.3,.9,metal,s*4.95,5.5,0,g);
  var p1=H.cyl(.14,.14,len,H.mat("#b8683a"),s*4.75,3.7,0,g,10);p1.rotation.x=Math.PI/2;var p2=H.cyl(.1,.1,len,H.mat("#3a9aa0"),s*4.78,4.5,0,g,10);p2.rotation.x=Math.PI/2;
  H.box(.3,.1,.5,"#8a8a90",s*4.75,3.7,.9,g);H.box(.3,.1,.5,"#8a8a90",s*4.75,3.7,-1.9,g);
  H.sph(.2,"#ffe0a0",s*4.62,3.0,2.6,g,{em:"#ffb050"});H.box(.34,.5,.34,"#2a2624",s*4.62,3.0,2.6,g,{tr:.35});H.box(.1,.5,.1,"#2a2624",s*4.7,3.0,2.6,g);
  H.box(.14,.05,.7,"#9ae0ff",s*3.2,.26,1.2,g,{em:"#3a8aa8"});H.box(.14,.05,.7,"#9ae0ff",s*3.2,.26,-2.8,g,{em:"#3a8aa8"})});
 H.box(12.2,.8,len,"#2e2a28",0,6.8,0,g);
 [-1,1].forEach(function(s){var ch=H.box(2.4,.5,len,"#35302e",s*4.9,6.2,0,g);ch.rotation.z=s*.75});
 var beam=H.box(9.8,.55,.7,metal,0,6.2,0,g);for(var i=-2;i<=2;i++)H.sph(.07,"#aaa",i*1.8,6.2,-.36,g);
 H.box(.5,.5,.5,"#3a3632",0,6.0,-.2,g);
 H.box(.8,.1,2.4,"#fff2c8",0,6.38,0,g,{em:"#ffe8a0"});H.box(.8,.1,2.4,"#fff2c8",0,6.38,-4,g,{em:"#ffe8a0"});
 if(portal){H.box(1.6,7.6,1.2,"#4a443c",-5.6,3.8,-len/2+.4,g);H.box(1.6,7.6,1.2,"#4a443c",5.6,3.8,-len/2+.4,g);var sign=new T.Mesh(new T.BoxGeometry(5,.9,.2),new T.MeshLambertMaterial({map:banner(exit?"EXIT":"TUNNEL",false,"#d89a20")}));sign.position.set(0,7.3,-len/2+.4);g.add(sign)}
 return H.merge(g,false,false)}
/* ---------- coin, magnet, gate, chest ---------- */
var coinGeo=null;
Pr.coin=function(){var g=new T.Group(),gm=H.mat("#ffd84a");var d=new T.Mesh(H.geo("coin",function(){return new T.CylinderGeometry(.34,.34,.09,24)}),gm);d.rotation.x=Math.PI/2;g.add(d);var rim=new T.Mesh(H.geo("coinrim",function(){return new T.TorusGeometry(.34,.035,8,24)}),H.mat("#fff0a0"));g.add(rim);var st=new T.Mesh(H.geo("coinstar",function(){var s=new T.Shape();for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,rr=i%2?.07:.17;i?s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}return new T.ShapeGeometry(s)}),H.mat("#d8a010"));st.position.z=.05;g.add(st);var st2=st.clone();st2.position.z=-.05;st2.rotation.y=Math.PI;g.add(st2);H.mergeLocal(g,false);return g};
Pr.magnet=function(){var g=new T.Group();var arc=new T.Mesh(new T.TorusGeometry(.32,.11,10,20,Math.PI),H.mat("#e02a2a",{em:"#400808"}));arc.position.y=.2;g.add(arc);[-1,1].forEach(function(s){H.box(.22,.34,.22,"#e02a2a",s*.32,.02,0,g);H.box(.22,.14,.23,"#f4f4f8",s*.32,-.1,0,g)});var gl=new T.Mesh(new T.SphereGeometry(.6,12,10),new T.MeshBasicMaterial({color:0x7ad0ff,transparent:true,opacity:.25,depthWrite:false}));gl.position.y=.15;g.add(gl);return g};
var banner=function(txt,fin,col){return H.tex(256,64,function(g,w,h){g.fillStyle=fin?"#fff":col;g.fillRect(0,0,w,h);if(fin){g.fillStyle="#111";for(var i=0;i<16;i++)for(var j=0;j<4;j++)if((i+j)%2)g.fillRect(i*16,j*16,16,16)}g.fillStyle=fin?"#d92a2a":"#fff";g.strokeStyle="rgba(0,0,0,.7)";g.lineWidth=6;g.font='700 34px "Lilita One",sans-serif';g.textAlign="center";g.textBaseline="middle";g.strokeText(txt,w/2,h/2+2);g.fillText(txt,w/2,h/2+2);g.strokeStyle="#ffd84a";g.lineWidth=4;g.strokeRect(2,2,w-4,h-4)})};banner=H.memo(banner);
Pr.gate=function(fin){var g=new T.Group();[-1,1].forEach(function(s){H.cyl(.16,.2,4.2,H.mat("#2a1a10"),s*3.2,2.1,0,g,10);H.sph(.25,"#ffd84a",s*3.2,4.3,0,g)});var bm=new T.Mesh(new T.BoxGeometry(6.8,1.3,.2),new T.MeshLambertMaterial({map:banner(fin?"FINISH":"CHECKPOINT",fin,"#2ac46a")}));bm.position.y=4;g.add(bm);H.shadowAll(g,true,false);return g};
Pr.chest=function(){var g=new T.Group();H.box(1.7,.95,1.1,H.mat("#a85a18"),0,.48,0,g);H.box(1.74,.14,1.14,"#ffd84a",0,.62,0,g);H.box(.24,.4,.12,"#ffd84a",0,.62,-.6,g);var lid=new T.Group();lid.position.set(0,.95,.55);g.add(lid);var lm=new T.Mesh(new T.CylinderGeometry(.58,.58,1.7,14,1,false,0,Math.PI),H.mat("#c0701e"));lm.rotation.z=Math.PI/2;lm.rotation.y=Math.PI/2;lm.position.set(0,0,-.55);lid.add(lm);g.userData.lid=lid;var glow=new T.Mesh(new T.SphereGeometry(1.8,12,10),new T.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.0,depthWrite:false}));glow.position.y=1.2;g.add(glow);g.userData.glow=glow;var gold=new T.Group();g.add(gold);g.userData.gold=gold;for(var i=0;i<10;i++){var cn=Pr.coin();cn.scale.setScalar(.7);cn.visible=false;gold.add(cn)}H.shadowAll(g,true,false);return g};
Pr.chestAnim=function(o,open,z){var u=o.userData;u.lid.rotation.x=-open*1.25;u.glow.material.opacity=open*.35+(z<20?.08:0);u.gold.children.forEach(function(c,i){c.visible=open>.2;var a=i*.9+performance.now()*.002,rad=.3+open*.8+(i%3)*.2;c.position.set(Math.cos(a)*rad*.9,1.0+Math.abs(Math.sin(a))*rad,Math.sin(a)*.3);c.rotation.y=a})};

/* ---------- Angkor Wat: stepped platform, five lotus-bud towers, moat bridge ---------- */
Pr.angkor=function(zz){var g=new T.Group(),st="#c8b48a",dk="#a8946a",roof="#8a7a58";
 H.box(30,1.2,18,st,0,.6,0,g);H.box(24,1.2,14,dk,0,1.8,0,g);H.box(18,1.2,10,st,0,3.0,0,g);
 function tower(x,z,s){var t=new T.Group();t.position.set(x,4.2,z);g.add(t);var ww=3.2*s;for(var i=0;i<4;i++){var w=ww*(1-i*.17);H.box(w,1.6*s,w,i%2?dk:st,0,.8*s+i*1.6*s,0,t);H.box(w*1.12,.2*s,w*1.12,roof,0,1.62*s+i*1.6*s,0,t)}H.cone(ww*.38,3.4*s,H.mat("#b09a6a"),0,6.4*s+1.7*s,0,t,10);H.cyl(.07*s,.07*s,1*s,H.mat("#e8c25a"),0,6.4*s+3.8*s,0,t,6)}
 tower(0,0,1.5);[[-6,-3],[6,-3],[-6,3],[6,3]].forEach(function(p){tower(p[0],p[1],1)});
 for(var i=0;i<9;i++){H.box(1.0,2.6,1.0,st,-12+i*3,1.6,9.4,g);H.box(1.2,.2,1.2,dk,-12+i*3,3,9.4,g)}
 H.box(4,.2,14,"#a8946a",0,.1,-16,g);var moat=new T.Mesh(new T.PlaneGeometry(50,8),H.mat("#4aa8c0"));moat.rotation.x=-Math.PI/2;moat.position.set(0,.03,-14);g.add(moat);
 g.position.x=0;g.userData.zz=zz;g.userData.len=40;g.userData.zstart=zz;return H.merge(g,true,true)};

/* ---------- obstacles ---------- */
var STRIPE=null,STONE=null,GLYPH=null;
var stripes=function(a,b){return H.tex(64,64,function(g){g.fillStyle=a;g.fillRect(0,0,64,64);g.fillStyle=b;for(var i=-2;i<6;i++){g.beginPath();g.moveTo(i*16,64);g.lineTo(i*16+16,64);g.lineTo(i*16+48,0);g.lineTo(i*16+32,0);g.fill()}},true)};stripes=H.memo(stripes);
var stone=function(col){return H.tex(64,64,function(g){g.fillStyle=col;g.fillRect(0,0,64,64);var r=H.rnd(3);for(var i=0;i<160;i++){g.fillStyle="rgba("+(r()<.5?"0,0,0":"255,255,255")+","+(r()*.12)+")";g.fillRect(r()*64,r()*64,2+r()*3,2)}g.strokeStyle="rgba(0,0,0,.3)";g.lineWidth=1.5;for(var y=0;y<=64;y+=21){g.beginPath();g.moveTo(0,y);g.lineTo(64,y);g.stroke()}for(var y2=0;y2<64;y2+=21){var o=(y2/21)%2?16:0;for(var x=o;x<64;x+=32){g.beginPath();g.moveTo(x,y2);g.lineTo(x,y2+21);g.stroke()}}},true)};stone=H.memo(stone);
var glyphTex=function(col,line){return H.tex(128,128,function(g){g.fillStyle=col;g.fillRect(0,0,128,128);g.strokeStyle=line;g.lineWidth=4;g.strokeRect(6,6,116,116);g.lineWidth=3;g.beginPath();g.ellipse(64,40,20,12,0,0,7);g.moveTo(64,52);g.lineTo(64,100);g.moveTo(36,70);g.lineTo(92,70);g.moveTo(30,104);g.lineTo(54,92);g.moveTo(74,92);g.lineTo(98,104);g.stroke()})};glyphTex=H.memo(glyphTex);
var gantryTex=H.memo(function(){return H.tex(128,32,function(c,a,b){c.fillStyle="#1a8a4a";c.fillRect(0,0,a,b);c.strokeStyle="#fff";c.lineWidth=2;c.strokeRect(2,2,a-4,b-4);c.fillStyle="#fff";c.beginPath();c.moveTo(a/2,26);c.lineTo(a/2-10,8);c.lineTo(a/2+10,8);c.fill()})});
var SK={
 cart:function(w,c){var g=new T.Group();H.box(w*.9,.9,1.1,"#9a6a3a",0,.45,0,g);H.box(w*.95,.08,1.2,"#c08a4a",0,.94,0,g);[-1,1].forEach(function(s){H.cyl(.05,.05,1.7,H.mat("#5a3a20"),s*w*.44,1.3,-.5,g,6)});var aw=new T.Mesh(new T.BoxGeometry(w*1.05,.08,1.5),new T.MeshLambertMaterial({map:stripes("#d8302a","#f6f0e4")}));aw.position.set(0,1.78,-.25);aw.rotation.x=.2;g.add(aw);for(var i=0;i<4;i++)H.sph(.2,["#e8442a","#ffd24a","#4aa84a","#ff8a1a"][i],-.55+i*.37,1.14,0,g);H.box(.5,.4,.5,"#b8884a",.5,1.15,.3,g);return g},
 cyclo:function(w){var g=new T.Group();H.box(1.2,.7,1.9,"#2a6ad8",0,.7,0,g);H.box(1.1,.7,.9,"#f6e068",0,1.35,.3,g);H.box(1.2,.1,1.1,"#2a6ad8",0,1.75,.3,g);[-1,1].forEach(function(s){H.cyl(.32,.32,.12,H.mat("#222"),s*.55,.32,.6,g,14).rotation.z=Math.PI/2});H.cyl(.32,.32,.12,H.mat("#222"),0,.32,-.75,g,14).rotation.z=Math.PI/2;return g},
 lion:function(w){var g=new T.Group();H.box(1.5,.7,1.1,"#8a8a90",0,.35,0,g);H.sph(.6,"#d8302a",0,1.2,0,g,null,1,.85,1.2);[-1,1].forEach(function(s){H.box(.2,.5,.2,"#d8302a",s*.3,.65,-.45,g);H.box(.2,.5,.2,"#d8302a",s*.3,.65,.45,g)});H.sph(.42,"#ffd24a",0,1.7,-.55,g);H.sph(.5,"#c0201a",0,1.7,-.45,g,null,1,1,.7);H.sph(.3,"#d8302a",0,1.62,-.8,g);H.sph(.07,"#fff",-.14,1.74,-1.05,g);H.sph(.07,"#fff",.14,1.74,-1.05,g);H.cone(.1,.25,H.mat("#ffd24a"),-.3,2.1,-.5,g,6);H.cone(.1,.25,H.mat("#ffd24a"),.3,2.1,-.5,g,6);return g},
 snowman:function(){var g=snowman();return g},
 glyph:function(w){var g=new T.Group();var m=new T.MeshLambertMaterial({map:glyphTex("#d8be84","#7a5a2a")});var b=new T.Mesh(new T.BoxGeometry(w*.9,1.7,1.1),[H.mat("#c8ae74"),H.mat("#c8ae74"),H.mat("#e0c88c"),H.mat("#a8904a"),m,m]);b.position.y=.85;g.add(b);H.box(w*.95,.14,1.15,"#e8d098",0,1.75,0,g);return g},
 stump:function(w){var g=new T.Group();for(var i=0;i<3;i++){var c=H.cyl(.38,.38,1.5,H.mat("#7a5a34"),(i-1)*.78,.38+(i===1?.7:0),0,g,12);c.rotation.z=Math.PI/2;c.rotation.y=0;c.rotation.x=0;c.position.z=i===1?0:.25}H.cyl(.5,.55,1.3,H.mat("#6a4a2a"),0,.65,-.15,g,12);H.cyl(.46,.46,.04,H.mat("#d8b878"),0,1.32,-.15,g,12);H.sph(.3,"#3a8a3a",.4,1.3,.2,g,null,1,.5,1);return g},
 templeblock:function(w){var g=new T.Group();var m=new T.MeshLambertMaterial({map:glyphTex("#b8a47e","#5a4a2a")});var b=new T.Mesh(new T.BoxGeometry(w*.9,1.7,1.1),[H.mat("#a89874"),H.mat("#a89874"),H.mat("#c8b88c"),H.mat("#8a7a58"),m,m]);b.position.y=.85;g.add(b);H.box(w*.95,.16,1.15,"#c8b88c",0,1.75,0,g);return g}};
var LK={
 barrier:function(w){var g=new T.Group();var m=new T.MeshLambertMaterial({map:stripes("#e02a2a","#f6f6f6")});var bar=new T.Mesh(new T.BoxGeometry(w,.26,.14),m);bar.position.y=.48;g.add(bar);[-1,1].forEach(function(s){H.box(.1,.55,.1,"#444",s*(w/2-.15),.28,0,g);H.box(.1,.1,.6,"#444",s*(w/2-.15),.05,0,g)});return g},
 bamboo:function(w){var g=new T.Group();[-1,1].forEach(function(s){H.cyl(.06,.06,.9,H.mat("#8a9a3a"),s*(w/2-.1),.45,0,g,6)});[.25,.52].forEach(function(y){var b=H.cyl(.07,.07,w,H.mat("#a8b448"),0,y,0,g,8);b.rotation.z=Math.PI/2;for(var k=-2;k<=2;k++)H.cyl(.075,.075,.03,H.mat("#6a7a28"),k*w*.2,y,0,g,8).rotation.z=Math.PI/2});return g},
 rope:function(w){var g=new T.Group();[-1,1].forEach(function(s){H.cyl(.07,.09,.7,H.mat("#8a2a14"),s*(w/2-.1),.35,0,g,8);H.sph(.1,"#ffd24a",s*(w/2-.1),.72,0,g)});var r=H.cyl(.04,.04,w-.2,H.mat("#d8302a"),0,.58,0,g,6);r.rotation.z=Math.PI/2;return g},
 snowlog:function(w){var g=new T.Group();var l=H.cyl(.3,.3,w,H.mat("#7a5a34"),0,.3,0,g,12);l.rotation.z=Math.PI/2;var s=H.sph(.34,"#f4f8ff",0,.5,0,g,null,w*.5,.45,1);return g},
 stonewall:function(w){var g=new T.Group();var m=new T.MeshLambertMaterial({map:stone("#b8a888")});m.map.repeat.set(w/1.2,.5);var b=new T.Mesh(new T.BoxGeometry(w,.55,.4),m);b.position.y=.28;g.add(b);H.box(w+.06,.1,.46,"#d0c4a0",0,.58,0,g);return g},
 jlog:function(w){var g=new T.Group();var l=H.cyl(.3,.3,w,H.mat("#6a4a2a"),0,.3,0,g,12);l.rotation.z=Math.PI/2;for(var i=0;i<5;i++)H.sph(.16,"#3a8a3a",-w*.4+i*w*.2,.58,(i%2-.5)*.1,g,null,1,.6,1);return g},
 naga:function(w){var g=new T.Group();H.box(w,.45,.4,"#a89874",0,.24,0,g);H.box(w+.06,.1,.46,"#c8b88c",0,.5,0,g);[-1,1].forEach(function(s){H.sph(.2,"#8a7a58",s*(w/2-.1),.62,0,g);H.cone(.07,.2,H.mat("#8a7a58"),s*(w/2-.1),.82,0,g,5)});return g}};
var HK={
 gantry:function(w){var g=new T.Group();[-1,1].forEach(function(s){H.cyl(.08,.1,2.1,H.mat("#7a828c"),s*(w/2-.1),1.05,0,g,8)});var bd=new T.Mesh(new T.BoxGeometry(w-.1,.55,.12),new T.MeshLambertMaterial({map:gantryTex()}));bd.position.y=1.42;g.add(bd);return g},
 laundry:function(w){var g=new T.Group();[-1,1].forEach(function(s){H.cyl(.08,.1,2.2,H.mat("#6a4a2a"),s*(w/2-.1),1.1,0,g,8)});var r=H.cyl(.03,.03,w,H.mat("#d8d0c0"),0,1.95,0,g,4);r.rotation.z=Math.PI/2;["#e8442a","#2a8ae8","#ffd24a","#f6f0e4","#2ac46a"].forEach(function(c,i){H.box(.4,.65,.04,c,-w*.38+i*w*.19,1.62,0,g)});return g},
 paifang:function(w){var g=new T.Group();[-1,1].forEach(function(s){H.cyl(.14,.16,2.3,H.mat("#c42a22"),s*(w/2-.15),1.15,0,g,10)});H.box(w,.4,.3,"#c42a22",0,1.5,0,g);H.box(w+.4,.12,.5,"#ffd24a",0,1.78,0,g);H.box(w+.6,.14,.7,"#4a2a14",0,1.9,0,g);return g},
 icicle:function(w){var g=new T.Group();[-1,1].forEach(function(s){H.cyl(.1,.12,2.1,H.mat("#9ab4d6"),s*(w/2-.1),1.05,0,g,8)});H.box(w,.4,.3,"#f4f8ff",0,1.55,0,g);for(var i=0;i<9;i++)H.cone(.07,.3+((i*7)%4)*.07,H.mat("#cfe6fa"),-w*.4+i*w*.1,1.2,0,g,6).rotation.x=Math.PI;return g},
 lintel:function(w){var g=new T.Group();var m=H.mat("#c8ae74");[-1,1].forEach(function(s){H.box(.34,2.2,.34,"#b89e64",s*(w/2-.17),1.1,0,g)});var b=new T.Mesh(new T.BoxGeometry(w,.42,.4),new T.MeshLambertMaterial({map:glyphTex("#d8be84","#7a5a2a")}));b.position.y=1.5;g.add(b);return g},
 vines:function(w){var g=new T.Group();[-1,1].forEach(function(s){H.cyl(.12,.14,2.2,H.mat("#5a3a20"),s*(w/2-.1),1.1,0,g,8)});H.box(w,.3,.3,"#6a4a2a",0,1.55,0,g);for(var i=0;i<8;i++){var x=-w*.42+i*w*.12;H.cyl(.02,.02,.4,H.mat("#3a8a3a"),x,1.32,0,g,4);H.sph(.1,"#3a9a3a",x,1.12,0,g,null,1,1.2,1)}return g},
 gopura:function(w){var g=new T.Group();[-1,1].forEach(function(s){H.box(.36,2.2,.36,"#a89874",s*(w/2-.18),1.1,0,g)});var b=new T.Mesh(new T.BoxGeometry(w,.44,.42),new T.MeshLambertMaterial({map:glyphTex("#b8a47e","#5a4a2a")}));b.position.y=1.5;g.add(b);H.cone(.3,.5,H.mat("#a89874"),0,1.95,0,g,4);return g}};

/* ---------- long trains/trams (block a lane for a stretch), rolling barrels, shield ---------- */
var trainTex=H.memo(function(body,acc,len){var t=H.tex(256,128,function(g,w,h){g.fillStyle=body;g.fillRect(0,0,w,h);g.fillStyle=acc;g.fillRect(0,h*.78,w,h*.1);g.fillRect(0,h*.06,w,h*.05);for(var i=0;i<4;i++){var x=i*64+10;g.fillStyle="#1a2a3a";g.fillRect(x,h*.22,44,h*.34);var gr=g.createLinearGradient(x,0,x+44,0);gr.addColorStop(0,"rgba(180,220,255,.5)");gr.addColorStop(.4,"rgba(180,220,255,0)");g.fillStyle=gr;g.fillRect(x,h*.22,44,h*.34);g.strokeStyle="rgba(0,0,0,.4)";g.lineWidth=2;g.strokeRect(x,h*.22,44,h*.34)}g.strokeStyle="rgba(0,0,0,.35)";g.beginPath();g.moveTo(1,0);g.lineTo(1,h);g.stroke()},true);t.repeat.set(len/4.1,1);return t});
Pr.train=function(L,len){var g=new T.Group(),pal=L.pal||["#d8302a","#fff","#2a5a8a"],body=pal[2]&&pal[2]!==pal[0]?pal[2]:"#2a5a8a",acc=pal[0],tx=trainTex(body,acc,Math.round(len)),m=new T.MeshLambertMaterial({map:tx}),roof=H.mat(H.shade(body,.25)),dk=H.mat("#26282e");
 var b=new T.Mesh(new T.BoxGeometry(1.75,2.2,len),[m,m,roof,dk,H.mat(body),H.mat(body)]);b.position.set(0,1.5,-len/2);g.add(b);
 H.box(1.8,.5,len+.05,"#2a2c32",0,.35,-len/2,g);
 H.box(1.5,.12,len*.9,"#9aa0a8",0,2.66,-len/2,g);
 for(var i=0;i<Math.floor(len/4);i++)H.box(.5,.14,.7,"#cfd4da",0,2.75,-2-i*4,g);
 var fw=H.box(1.5,.9,.06,"#1a2a3a",0,1.95,.04,g);H.box(1.6,.12,.08,acc,0,1.3,.05,g);
 [-1,1].forEach(function(s){H.box(.3,.22,.08,"#fff8c8",s*.55,.8,.05,g,{em:"#ffe890"})});
 H.box(1.1,.3,.1,"#fff",0,2.4,.05,g);
 return g};
Pr.roller=function(){var g=new T.Group();var bar=new T.Group();bar.position.y=.55;g.add(bar);g.userData.spin=bar;var c=H.cyl(.55,.55,1.2,H.mat("#a8702a"),0,0,0,bar,18);c.rotation.z=Math.PI/2;[-.45,0,.45].forEach(function(x){var t=new T.Mesh(H.geo("rollring",function(){return new T.TorusGeometry(.56,.04,6,20)}),H.mat("#3a3a40"));t.rotation.y=Math.PI/2;t.position.x=x;bar.add(t)});H.box(.1,.9,.1,"#5a3a14",0,0,0,bar).rotation.x=0;H.shadowAll(g,true,false);return g};
Pr.shield=function(){var g=new T.Group();var o=new T.Mesh(H.geo("shd",function(){return new T.OctahedronGeometry(.42)}),H.mat("#3aa0ff",{em:"#144a88"}));o.position.y=.1;g.add(o);var b=new T.Mesh(new T.SphereGeometry(.62,14,10),new T.MeshBasicMaterial({color:0x66ccff,transparent:true,opacity:.28,depthWrite:false}));g.add(b);g.userData.spin=o;return g};
Pr.obstacle=function(L,type,full){var o=L.obs||{},name=o[type],w=full?5.8:1.7,g;
 var tab=type==="block"?SK:type==="low"?LK:HK;var f=tab[name]||tab[Object.keys(tab)[0]];g=f(w,L);if(full){g.scale.x=1}
 H.shadowAll(g,true,true);return g}
})(window.TK=window.TK||{});
