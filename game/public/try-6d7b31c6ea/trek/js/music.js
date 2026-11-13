/* Treasure Trek - procedural music: a different tune for every country. The beat gets faster and fuller as the runner speeds up. */
(function(TK){
var SCALES={
 sea:[0,2,4,7,9],east:[0,2,5,7,9],island:[0,2,4,7,9],pacific:[0,2,4,7,9],namer:[0,2,4,5,7,9,11],pampas:[0,2,4,5,7,9,10],
 desert:[0,1,4,5,7,8,10],euro:[0,2,4,5,7,9,11],med:[0,2,4,5,7,9,11],alps:[0,2,4,5,7,9,11],boreal:[0,2,3,5,7,8,10],
 andes:[0,3,5,7,10],savanna:[0,2,4,7,9],latam:[0,2,4,5,7,9,10],india:[0,1,4,5,7,8,11],steppe:[0,3,5,7,10],trop:[0,2,4,7,9],outback:[0,2,4,7,9]};
var PROG=[[0,4,5,3],[0,3,4,3],[5,3,0,4],[0,5,3,4],[0,2,3,4]];
var M=TK.Music={on:true,L:null,ac:null,out:null,timer:null,step:0,next:0,speed:10,vol:1,seed:1,menu:false};
function rng(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function hash(str){var h=7;for(var i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))>>>0;return h}
function hz(m){return 440*Math.pow(2,(m-69)/12)}
M.init=function(ac){if(M.ac===ac)return;M.ac=ac;var g=ac.createGain();g.gain.value=.5;var f=ac.createBiquadFilter();f.type="lowpass";f.frequency.value=7000;g.connect(f);f.connect(ac.destination);M.out=g;M.filter=f;
 var nb=ac.createBuffer(1,ac.sampleRate*.5,ac.sampleRate),d=nb.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;M.noise=nb};
function note(t,m,len,type,vol,det){var ac=M.ac,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=hz(m);if(det)o.detune.value=det;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0008,t+len);o.connect(g);g.connect(M.out);o.start(t);o.stop(t+len+.02)}
function hat(t,vol,open){var ac=M.ac,s=ac.createBufferSource(),g=ac.createGain(),f=ac.createBiquadFilter();s.buffer=M.noise;f.type="highpass";f.frequency.value=7000;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+(open?.12:.04));s.connect(f);f.connect(g);g.connect(M.out);s.start(t);s.stop(t+.14)}
function kick(t,vol){var ac=M.ac,o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(M.out);o.start(t);o.stop(t+.22)}
function snare(t,vol){var ac=M.ac,s=ac.createBufferSource(),g=ac.createGain(),f=ac.createBiquadFilter();s.buffer=M.noise;f.type="bandpass";f.frequency.value=1800;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);s.connect(f);f.connect(g);g.connect(M.out);s.start(t);s.stop(t+.14)}

/* build the little song for a country: root note, chords, a 16-step motif, and the sound colour of its region */
function compose(L){var r=rng(hash(L.id||"x")),sc=SCALES[L.kit]||SCALES.euro,root=48+((r()*7)|0)+(L.id==="kh"?2:0),pr=PROG[(r()*PROG.length)|0],motif=[],i;
 for(i=0;i<16;i++){var p=r();motif.push(p<.38?-1:((r()*sc.length*1.6)|0))}
 motif[0]=0;var color={desert:["sawtooth","triangle"],boreal:["triangle","sine"],east:["triangle","sine"],india:["sawtooth","triangle"],steppe:["triangle","triangle"],andes:["triangle","sine"],sea:["triangle","sine"],island:["triangle","sine"]}[L.kit]||["square","triangle"];
 return{root:root,sc:sc,pr:pr,motif:motif,lead:color[0],bass:color[1],swing:L.kit==="latam"||L.kit==="savanna"||L.kit==="island"?.12:0}}
function degree(S,d,oct){var n=S.sc.length,o=Math.floor(d/n);return S.root+S.sc[((d%n)+n)%n]+12*(o+(oct||0))}

M.play=function(L,menu){if(!M.ac)return;M.stop();M.L=L;M.menu=!!menu;M.S=compose(L);M.step=0;M.next=M.ac.currentTime+.06;M.speed=menu?9:L.v0;M.out.gain.setTargetAtTime(M.on?(menu?.22:.34):0,M.ac.currentTime,.05);M.timer=setInterval(tick,25)};
M.stop=function(){if(M.timer){clearInterval(M.timer);M.timer=null}if(M.out&&M.ac)M.out.gain.setTargetAtTime(0,M.ac.currentTime,.05)};
M.setSpeed=function(v){M.speed=v};
M.mute=function(m){M.on=!m;if(!M.on&&M.out)M.out.gain.setTargetAtTime(0,M.ac.currentTime,.03);else if(M.out&&M.timer)M.out.gain.setTargetAtTime(M.menu?.22:.34,M.ac.currentTime,.05)};
M.duck=function(d){if(M.out&&M.timer&&M.on)M.out.gain.setTargetAtTime(d?.08:(M.menu?.22:.34),M.ac.currentTime,.05)};
M.bpm=function(){return M.menu?84:78+(M.speed-10)*5.2};
function tick(){var ac=M.ac;if(!ac||!M.S)return;if(ac.state==="suspended")return;
 while(M.next<ac.currentTime+.14){var s=M.step,S=M.S,bpm=M.bpm(),sd=60/bpm/4,t=M.next,k=s%16,bar=Math.floor(s/16),chord=S.pr[bar%4],lvl=M.menu?0:Math.max(0,Math.min(1,(M.speed-10)/12));
  if(S.swing&&k%2===1)t+=sd*S.swing;
  /* bass on beats */
  if(k%4===0||(lvl>.5&&k%8===6))note(t,degree(S,chord,-2),sd*(k%4===0?3.2:1.4),S.bass,.34);
  /* chord pad stab */
  if(k===0)[0,2,4].forEach(function(o){note(t,degree(S,chord+o,0),sd*7,"sine",.07)});
  /* lead motif */
  var m=S.motif[k];if(m>=0&&(!M.menu||k%2===0)){var dd=m+(bar%2?2:0);note(t,degree(S,chord+dd,1),sd*(1.6+(k%4===0?1:0)),S.lead,M.menu?.08:.1)}
  /* drums arrive as the run speeds up */
  if(!M.menu){if(k%4===0)kick(t,.5);if(lvl>.15&&k%4===2)hat(t,.07+lvl*.05,false);if(lvl>.4&&k%8===4)snare(t,.2);if(lvl>.65&&k%2===1)hat(t,.05,false);if(lvl>.8&&k%4===3)note(t,degree(S,chord+4,2),sd*.9,S.lead,.05)}
  else if(k%8===0)kick(t,.18);
  M.next+=sd;M.step++}}
})(window.TK=window.TK||{});
