/* Treasure Trek - optional real 3D hero model (.glb) with skeleton animation.
   Put hero.glb (and optionally hero_run.glb, hero_jump.glb, hero_slide.glb) in the "models" folder and list them in models/manifest.json.
   If no model is listed, the built-in blocky runner is used. */
(function(TK){var R=TK.R3D;if(!R)return;var T=R.H.T,Hh=R.Hero={ready:false,scene:null,clips:{},cfg:{}};
function cls(n){n=(n||"").toLowerCase();if(/slide|roll|dive|crouch|duck|skid/.test(n))return"slide";if(/jump|leap|hop|fly|air/.test(n))return"jump";if(/run|sprint|jog|dash|walk/.test(n))return"run";return null}
Hh.load=function(base,done){var fin=function(){done&&done()};
 if(!T.GLTFLoader||!T.SkeletonUtils){fin();return}
 fetch(base+"manifest.json?v="+Date.now()).then(function(r){return r.ok?r.json():{files:[]}}).catch(function(){return{files:[]}}).then(function(m){Hh.cfg=m||{};var files=Hh.cfg.files||[];if(!files.length){fin();return}
  var left=files.length,L=new T.GLTFLoader();files.forEach(function(f){L.load(base+f,function(g){var skinned=false;g.scene.traverse(function(o){if(o.isSkinnedMesh)skinned=true});
    if(skinned&&!Hh.scene)Hh.scene=g.scene;
    g.animations.forEach(function(a){var k=cls(a.name)||cls(f)||(g.animations.length===1?"run":null);if(k&&!Hh.clips[k])Hh.clips[k]=a;if(!Hh.any)Hh.any=a});
    if(--left===0){prep();fin()}},undefined,function(){if(--left===0){prep();fin()}})})})};
function prep(){if(!Hh.scene)return;var box=new T.Box3().setFromObject(Hh.scene),h=Math.max(.01,box.max.y-box.min.y);Hh.k=(1.78/h)*(Hh.cfg.scale||1);Hh.off=-box.min.y*Hh.k;if(!Hh.clips.run&&Hh.any)Hh.clips.run=Hh.any;Hh.ready=!!Hh.clips.run}
/* one runner built from the model: group -> model, mixer with run / jump / slide actions */
Hh.make=function(o){var g=new T.Group(),m=T.SkeletonUtils.clone(Hh.scene);m.scale.setScalar(Hh.k);m.position.y=Hh.off;m.rotation.y=Hh.cfg.rotY==null?Math.PI:Hh.cfg.rotY;g.add(m);
 m.traverse(function(x){if(x.isMesh){x.castShadow=true;x.frustumCulled=false;if(Hh.cfg.tint!==false&&x.material){var mt=Array.isArray(x.material)?x.material:[x.material];x.material=mt.map(function(a){a=a.clone();if(/shirt|top|cloth|jacket|dress|outfit|coat|hoodie/i.test(a.name||x.name)&&o&&o.top)a.color.multiply(new T.Color(o.top[0]));return a});if(x.material.length===1)x.material=x.material[0]}}});
 var mixer=new T.AnimationMixer(m),acts={};["run","jump","slide"].forEach(function(k){var c=Hh.clips[k];if(!c)return;var a=mixer.clipAction(c);if(k!=="run"){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true}acts[k]=a});
 if(acts.run)acts.run.play();
 return{root:g,model:m,mixer:mixer,acts:acts,cur:"run",airK:0}};
})(window.TK=window.TK||{});
