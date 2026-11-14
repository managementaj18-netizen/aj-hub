/* Treasure Trek - real 3D view (three.js): camera, light, road, sky, street, coins, gates. Characters, buildings and obstacles are in r3dchar.js / r3dobs.js */
(function(TK){
var T=window.THREE;if(!T){TK.R3D=null;return}
var R=TK.R3D={ok:false},H=R.H={};
var W=360,HH=640;
/* ---------- tiny helpers shared by the other r3d files ---------- */
var MC={},GC={};H.texList=[];H.caches=[];
H.memo=function(fn){var c={};H.caches.push(c);return function(){var k=Array.prototype.join.call(arguments,"|");return c[k]||(c[k]=fn.apply(null,arguments))}};
H.free=function(o){o.traverse(function(m){if(!m.isMesh)return;if(m.geometry&&!(m.geometry.userData&&m.geometry.userData.shared))m.geometry.dispose();var ms=Array.isArray(m.material)?m.material:[m.material];ms.forEach(function(x){if(x&&!(x.userData&&x.userData.shared))x.dispose()})})};
H.flush=function(){H.texList.forEach(function(t){t.dispose()});H.texList=[];H.caches.forEach(function(c){for(var k in c)delete c[k]});for(var k in MC)MC[k].dispose();MC={};if(R.Props&&R.Props.flush)R.Props.flush()};
H.mat=function(col,o){o=o||{};var k=col+"|"+(o.t?o.t.uuid:"")+"|"+(o.em||"")+"|"+(o.tr||"")+"|"+(o.ds?1:0)+"|"+(o.fl?1:0);var m=MC[k];if(!m){m=new T.MeshLambertMaterial({color:col,map:o.t||null,transparent:!!o.tr,opacity:o.tr||1,side:o.ds?T.DoubleSide:T.FrontSide,flatShading:!!o.fl});if(o.em)m.emissive=new T.Color(o.em);m.userData.shared=1;MC[k]=m}return m};
H.geo=function(key,fn){var g=GC[key];if(!g){g=GC[key]=fn();g.userData.shared=1}return g};
H.box=function(w,h,d,col,x,y,z,par,o){var m=new T.Mesh(H.geo("b",function(){return new T.BoxGeometry(1,1,1)}),typeof col==="object"&&col.isMaterial?col:H.mat(col,o));m.scale.set(w,h,d);m.position.set(x||0,y||0,z||0);if(par)par.add(m);return m};
H.cyl=function(rt,rb,h,col,x,y,z,par,seg,o){var m=new T.Mesh(H.geo("c"+rt+"_"+rb+"_"+h+"_"+(seg||12),function(){return new T.CylinderGeometry(rt,rb,h,seg||12)}),typeof col==="object"&&col.isMaterial?col:H.mat(col,o));m.position.set(x||0,y||0,z||0);if(par)par.add(m);return m};
H.sph=function(r,col,x,y,z,par,o,sx,sy,sz){var m=new T.Mesh(H.geo("s",function(){return new T.SphereGeometry(1,16,12)}),typeof col==="object"&&col.isMaterial?col:H.mat(col,o));m.scale.set((sx||1)*r,(sy||1)*r,(sz||1)*r);m.position.set(x||0,y||0,z||0);if(par)par.add(m);return m};
H.cone=function(r,h,col,x,y,z,par,seg,o){var m=new T.Mesh(H.geo("k"+r+"_"+h+"_"+(seg||10),function(){return new T.ConeGeometry(r,h,seg||10)}),typeof col==="object"&&col.isMaterial?col:H.mat(col,o));m.position.set(x||0,y||0,z||0);if(par)par.add(m);return m};
H.ico=function(r,col,x,y,z,par,sx,sy,sz){var m=new T.Mesh(H.geo("i",function(){return new T.IcosahedronGeometry(1,1)}),H.mat(col,{fl:1}));m.scale.set((sx||1)*r,(sy||1)*r,(sz||1)*r);m.position.set(x||0,y||0,z||0);if(par)par.add(m);return m};
H.shadowAll=function(o,cast,recv){o.traverse(function(m){if(m.isMesh){m.castShadow=!!cast;m.receiveShadow=!!recv}})};
H.shade=function(hex,t){var c=new T.Color(hex);if(t<0)c.lerp(new T.Color(0x000000),-t);else c.lerp(new T.Color(0xffffff),t);return"#"+c.getHexString()};
H.rnd=function(seed){var s=seed>>>0;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}};
H.tex=function(w,h,fn,rep){var c=document.createElement("canvas");c.width=w;c.height=h;var g=c.getContext("2d");fn(g,w,h);var t=new T.CanvasTexture(c);t.anisotropy=8;if(rep){t.wrapS=t.wrapT=T.RepeatWrapping}H.texList.push(t);return t};

/* merge many small meshes into one mesh per material so phones draw a building in a handful of calls */
H.merge=function(g,cast,recv){g.updateMatrixWorld(true);var inv=new T.Matrix4().copy(g.matrixWorld).invert(),by={},out=new T.Group();
 g.traverse(function(m){if(!m.isMesh)return;if(Array.isArray(m.material)||m.userData.nomerge){m.castShadow=!!cast;m.receiveShadow=!!recv;return}var k=m.material.uuid;(by[k]=by[k]||{mat:m.material,list:[]}).list.push(m)});
 for(var k in by){var e=by[k],pos=[],nor=[],uv=[],idx=[],off=0;
  e.list.forEach(function(m){var geo=m.geometry,rel=new T.Matrix4().multiplyMatrices(inv,m.matrixWorld),nm=new T.Matrix3().getNormalMatrix(rel),Pp=geo.attributes.position,N=geo.attributes.normal,U=geo.attributes.uv,v=new T.Vector3(),i,j;
   for(i=0;i<Pp.count;i++){v.fromBufferAttribute(Pp,i).applyMatrix4(rel);pos.push(v.x,v.y,v.z);if(N){v.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();nor.push(v.x,v.y,v.z)}else nor.push(0,1,0);if(U)uv.push(U.getX(i),U.getY(i));else uv.push(0,0)}
   if(geo.index){for(j=0;j<geo.index.count;j++)idx.push(geo.index.getX(j)+off)}else{for(j=0;j<Pp.count;j++)idx.push(j+off)}off+=Pp.count});
  var mg=new T.BufferGeometry();mg.setAttribute("position",new T.Float32BufferAttribute(pos,3));mg.setAttribute("normal",new T.Float32BufferAttribute(nor,3));mg.setAttribute("uv",new T.Float32BufferAttribute(uv,2));mg.setIndex(idx);
  var mm=new T.Mesh(mg,e.mat);mm.castShadow=!!cast;mm.receiveShadow=!!recv;out.add(mm);e.list.forEach(function(m){if(m.parent)m.parent.remove(m)})}
 g.add(out);return g};
H.T=T;

/* ---------- renderer, camera, light ---------- */
var renderer,scene,camera,sun,hemi,gl;
var roadTex=null,groundTex=null,walkTex=null,roadMesh,groundMesh,walkL,walkR,backdrop,world,ents=new Map(),street={L:[],R:[]},cur=null,curState=null;
R.init=function(canvas){try{renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xbfe4f4,1);
 scene=new T.Scene();camera=new T.PerspectiveCamera(60,W/HH,.1,300);hemi=new T.HemisphereLight(0xcfe8ff,0x8a7a5a,.95);scene.add(hemi);
 sun=new T.DirectionalLight(0xfff2d0,.9);sun.position.set(-9,15,7);sun.target.position.set(0,0,-8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);var sc=sun.shadow.camera;sc.left=-13;sc.right=13;sc.top=24;sc.bottom=-12;sc.near=1;sc.far=48;sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;scene.add(sun);scene.add(sun.target);R.tl=new T.PointLight(0xffc880,0,22);R.tl.position.set(0,4.6,-3);scene.add(R.tl);
 world=new T.Group();scene.add(world);R.scene=scene;R.world=world;R.ok=true;R.camera=camera;R.renderer=renderer;gl=canvas;
 camPlace(0,0);projectConsts();return true}catch(e){R.ok=false;return false}};
R.setSize=function(cw,ch,pr){if(!R.ok)return;renderer.setPixelRatio(pr);renderer.setSize(cw,ch,false);camera.aspect=cw/ch;camera.updateProjectionMatrix()};
R.shadows=function(on){if(R.ok)sun.castShadow=on};
/* camera sits behind and above the runner, looking down the road like a chase camera */
function camPlace(x,shake){camera.position.set(x*.55,3.0,6.4);camera.rotation.set(-.215,0,0);camera.rotation.order="YXZ";if(shake){camera.position.x+=Math.sin(shake*80)*.1;camera.position.y+=Math.cos(shake*70)*.08}camera.updateMatrixWorld(true)}
/* where things land on the 360x640 screen, so 2D effects (sparkles, scores) line up with the 3D world */
function projectConsts(){var v=new T.Vector3(0,0,0).project(camera);R.YP=(1-v.y)/2*HH;var a=new T.Vector3(2,0,0).project(camera);R.LW=(a.x-v.x)/2*W;var b=new T.Vector3(0,1,0).project(camera);R.UH=Math.abs((v.y-b.y)/2*HH);var f=new T.Vector3(0,0,-1e4).project(camera);R.HZ=(1-f.y)/2*HH}
R.screen=function(x,y,z){var v=new T.Vector3(x,y,z).project(camera);return[(v.x+1)/2*W,(1-v.y)/2*HH]};

/* ---------- textures for the road, pavement and ground, painted per country ---------- */
function roadTexture(L){return H.tex(256,512,function(g,w,h){var c1=L.road[0],c2=L.road[1];g.fillStyle=c1;g.fillRect(0,0,w,h);var r=H.rnd(11);for(var i=0;i<900;i++){g.fillStyle="rgba("+(r()<.5?"0,0,0":"255,255,255")+","+(.025+r()*.04)+")";g.fillRect(r()*w,r()*h,1+r()*3,1+r()*3)}
 g.fillStyle=c2;g.fillRect(0,0,w,3);g.globalAlpha=.55;g.fillStyle=c2;for(var k=0;k<2;k++){g.fillRect(0,k*128,w,2)}g.globalAlpha=1;
 var gr=L.ground;if(gr==="stone"){g.strokeStyle="rgba(30,20,20,.28)";g.lineWidth=1.4;for(var yy=0;yy<=h;yy+=32){g.beginPath();g.moveTo(0,yy);g.lineTo(w,yy);g.stroke()}for(var xx=0;xx<=w;xx+=32){var off=0;g.beginPath();g.moveTo(xx,0);g.lineTo(xx,h);g.stroke()}}
 /* lane markings: dashes on the two lane borders (road is 6 wide: borders at 1/3 and 2/3) */
 var edge=L.edge||"#fff";g.fillStyle=gr==="snow"?"rgba(120,150,200,.55)":"rgba(255,255,255,.75)";[w/3,w*2/3].forEach(function(x){for(var y=8;y<h;y+=64)g.fillRect(x-2,y,4,34)});
 g.fillStyle=edge;g.fillRect(2,0,5,h);g.fillRect(w-7,0,5,h);
 if(gr==="asphalt"||gr==="dirt"||gr==="jungle"){g.strokeStyle="rgba(0,0,0,.18)";g.lineWidth=2;g.beginPath();g.moveTo(w*.18,0);g.lineTo(w*.2,h);g.moveTo(w*.82,0);g.lineTo(w*.8,h);g.stroke()}},true)}
function walkTexture(L){return H.tex(64,128,function(g,w,h){g.fillStyle=L.ground==="snow"?"#f1f6fc":L.ground==="sand"?"#e8d29a":L.ground==="dirt"||L.ground==="jungle"?"#a89070":"#bdb8b0";g.fillRect(0,0,w,h);g.strokeStyle="rgba(0,0,0,.22)";g.lineWidth=1.5;for(var y=0;y<=h;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.stroke();var r=H.rnd(3);for(var i=0;i<200;i++){g.fillStyle="rgba(0,0,0,"+(r()*.06)+")";g.fillRect(r()*w,r()*h,2,2)}},true)}
function groundTexture(L){var base=L.verge[0],dk=L.verge[1];return H.tex(128,128,function(g,w,h){g.fillStyle=base;g.fillRect(0,0,w,h);var r=H.rnd(5),sn=L.ground==="snow",sd=L.ground==="sand";for(var i=0;i<1400;i++){var x=r()*w,y=r()*h;g.fillStyle=sn?"rgba(180,200,235,"+(.1+r()*.12)+")":sd?"rgba(160,120,60,"+(.06+r()*.08)+")":(r()<.5?dk:H.shade(base,.15));g.globalAlpha=sn||sd?1:.35;g.fillRect(x,y,1+r()*3,1+r()*4)}g.globalAlpha=1;if(!sn&&!sd){g.strokeStyle=H.shade(base,-.18);g.lineWidth=1;for(var j=0;j<60;j++){var a=r()*w,b=r()*h;g.beginPath();g.moveTo(a,b);g.lineTo(a+1,b-5-r()*4);g.stroke()}}},true)}
function skyTexture(L){var hz=R.HZ/HH;return H.tex(256,512,function(g,w,h){var hy=hz*h,gr=g.createLinearGradient(0,0,0,hy);gr.addColorStop(0,L.sky[0]);gr.addColorStop(.55,L.sky[1]);gr.addColorStop(1,L.sky[2]);g.fillStyle=gr;g.fillRect(0,0,w,hy+2);g.fillStyle=L.fog;g.fillRect(0,hy,w,h-hy);var sx=w*.72,sy=hy-46,sg=g.createRadialGradient(sx,sy,3,sx,sy,90);sg.addColorStop(0,L.sun);sg.addColorStop(.3,"rgba(255,255,255,.55)");sg.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=sg;g.fillRect(0,0,w,hy);g.fillStyle=L.sun;g.beginPath();g.arc(sx,sy,15,0,7);g.fill();var rs=H.rnd(2);for(var i=0;i<6;i++){var cx=rs()*w,cy=hy*.15+rs()*hy*.5,cw=40+rs()*60;var cg=g.createRadialGradient(cx,cy,2,cx,cy,cw);cg.addColorStop(0,"rgba(255,255,255,.6)");cg.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=cg;g.save();g.translate(cx,cy);g.scale(1,.32);g.translate(-cx,-cy);g.beginPath();g.arc(cx,cy,cw,0,7);g.fill();g.restore()}})}

R.reset=function(L,S){if(!R.ok)return;cur=L;curState=S;
 while(world.children.length){var o=world.children.pop();H.free(o)}ents.clear();H.flush();street={L:[],R:[],cL:S.D-8,cR:S.D-8,nL:0,nR:0};
 scene.fog=new T.Fog(L.fog,24,100);renderer.setClearColor(L.fog,1);scene.background=skyTexture(L);
 var wc=new T.Color(L.sky[2]).lerp(new T.Color("#fff4e0"),.65);hemi.color.copy(wc);hemi.groundColor.set(H.shade(L.verge[1],.15));hemi.intensity=.68;sun.color.set(L.sun==="#ffffff"?"#fff6e0":L.sun);sun.intensity=.62;
 roadTex=roadTexture(L);walkTex=walkTexture(L);groundTex=groundTexture(L);groundTex.repeat.set(48,48);
 var rm=new T.MeshLambertMaterial({map:roadTex});roadMesh=new T.Mesh(new T.PlaneGeometry(6.2,260),rm);roadMesh.rotation.x=-Math.PI/2;roadMesh.position.set(0,0,-110);roadMesh.receiveShadow=true;roadTex.repeat.set(1,260/8);world.add(roadMesh);
 var wm=new T.MeshLambertMaterial({map:walkTex});walkTex.repeat.set(1.6/2,260/4);[-1,1].forEach(function(s){var w=new T.Mesh(new T.BoxGeometry(1.7,.22,260),new T.MeshLambertMaterial({map:walkTex}));w.position.set(s*(3.1+.85),.11,-110);w.receiveShadow=true;world.add(w);var cb=new T.Mesh(new T.BoxGeometry(.12,.26,260),H.mat(H.shade(L.edge||"#e8e8e8",-.05)));cb.position.set(s*3.15,.12,-110);world.add(cb)});
 groundMesh=new T.Mesh(new T.PlaneGeometry(520,520),new T.MeshLambertMaterial({map:groundTex}));groundMesh.rotation.x=-Math.PI/2;groundMesh.position.set(0,-.03,-120);groundMesh.receiveShadow=true;world.add(groundMesh);
 var hz=TK.buildHorizon(L),bt=new T.CanvasTexture(hz);var bp=new T.Mesh(new T.PlaneGeometry(330,330*(hz.height/hz.width)),new T.MeshBasicMaterial({map:bt,transparent:true,fog:false,depthWrite:false}));bp.position.set(0,330*(hz.height/hz.width)/2-3,-215);bp.renderOrder=-1;backdrop=bp;world.add(bp);
 R.zones=[];if(L.len>1500){(L.len>2300?[.3,.64]:[.46]).forEach(function(f){var a=Math.round(L.len*f/8)*8;R.zones.push({a:a,b:a+152,first:true})})}R.base={hemi:.68,sun:.62,fog:new T.Color(L.fog)};
 R.Char.set(L,world);R.Props.reset(L,S);if(L.id==="kh"){var ak=R.Props.angkor(L.len+36);street.L.push(ak);world.add(ak)}};
function disposeTree(o){if(o.parent)o.parent.remove(o)}

/* ---------- per-frame: street, entities, runner, camera ---------- */
function ensureStreet(S){var L=cur;["L","R"].forEach(function(sd){var cKey="c"+sd,sg=sd==="L"?-1:1;while(street[cKey]<S.D+64){var p=R.Props.nextPiece(L,sg,street,cKey,S);street["n"+sd]++;if(p){p.userData.zz=p.userData.zz;street[sd].push(p);world.add(p)}}});
 [street.L,street.R].forEach(function(arr){for(var i=arr.length-1;i>=0;i--){var p=arr[i];if(p.userData.zz+p.userData.len<S.D-14){world.remove(p);H.free(p);arr.splice(i,1)}else p.position.z=-(p.userData.zz-S.D)}})}
function mkEntity(e){var L=cur,g=null;if(e.t==="coin")g=R.Props.coin();else if(e.t==="mag")g=R.Props.magnet();else if(e.t==="shield")g=R.Props.shield();else if(e.t==="roll")g=R.Props.roller();else if(e.t==="block"&&e.len)g=R.Props.train(L,e.len);else if(e.t==="finish"||e.t==="cp")g=R.Props.gate(e.t==="finish");else if(e.t==="chest")g=R.Props.chest();else g=R.Props.obstacle(L,e.t,!!e.full);return g}
function syncEnts(S){var seen=new Set();S.ents.forEach(function(e){var z=e.z-S.D;if(e.dead||z>86||z+(e.len||0)<-2.6){var o0=ents.get(e);if(o0){world.remove(o0);H.free(o0);ents.delete(e)}return}seen.add(e);var o=ents.get(e);if(!o){o=mkEntity(e);o.userData.e=e;ents.set(e,o);world.add(o)}
  var x=e.full?0:e.lane*2;o.position.set(x,0,-z);if(e.t==="coin"){o.position.y=e.hh*1.0;o.rotation.y=S.t*3.2+e.z;o.scale.setScalar(1)}else if(e.t==="mag"){o.position.y=.9+Math.sin(S.t*4)*.08;o.rotation.y=S.t*2}else if(e.t==="shield"){o.position.y=.9+Math.sin(S.t*4)*.08;o.userData.spin.rotation.y=S.t*2.5}else if(e.t==="roll"){o.userData.spin.rotation.x=-z*1.9}else if(e.t==="chest"){R.Props.chestAnim(o,S.done?Math.min(1,S.doneT/1.2):0,z)}});
 ents.forEach(function(o,e){if(!seen.has(e)){world.remove(o);H.free(o);ents.delete(e)}})}

R.render=function(S,dt){if(!R.ok||!cur)return;
 ensureStreet(S);syncEnts(S);
 var tk=0;(R.zones||[]).forEach(function(q){var e=Math.max(0,Math.min(1,(S.D-(q.a-6))/16)),x=Math.max(0,Math.min(1,((q.b+6)-S.D)/16));tk=Math.max(tk,Math.min(e,x))});R.tk=tk;if(R.base){hemi.intensity=R.base.hemi*(1-.55*tk);sun.intensity=R.base.sun*(1-.85*tk);scene.fog.color.copy(R.base.fog).lerp(new T.Color(0x0c1418),tk);scene.fog.near=24-14*tk;scene.fog.far=100-38*tk;R.tl.intensity=tk*1.5;backdrop.visible=tk<.6}
 var off=S.D;roadTex.offset.y=(off/8)%1;walkTex.offset.y=(off/4)%1;
 var sp=Math.max(0,Math.min(1,(S.speed-cur.v0)/Math.max(3,cur.v1-cur.v0)));camera.fov=60+sp*6+(S.shake>0?2:0);camera.updateProjectionMatrix();
 camPlace(S.x*2,S.shake>0?S.shake:0);
 R.Char.update(S,dt,cur);
 /* the backdrop follows the camera sideways a hair so it feels far away */
 backdrop.position.x=S.x*.6;
 renderer.render(scene,camera)};
R.onLevelChar=function(L){R.Char.set(L,world)};
})(window.TK=window.TK||{});
