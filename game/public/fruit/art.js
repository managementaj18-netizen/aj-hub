/* Soramma Fruit Catch — own artwork (SVG), one consistent style: soft shapes, warm dark outline.
   Good things (fruit) have a smiling face. Bad things (creatures) have angry eyes.
   Everything is drawn in a 100x100 box. The game turns each one into an image and draws it on the canvas. */
(function(){
var O='stroke="#3b2a20" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';
function wrap(s){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'+s+'</svg>'}
// happy face
function face(x,y,w){w=w||9;var a=x-w,b=x+w;
 return '<g><ellipse cx="'+a+'" cy="'+y+'" rx="3.4" ry="4.2" fill="#3b2a20"/><ellipse cx="'+b+'" cy="'+y+'" rx="3.4" ry="4.2" fill="#3b2a20"/>'+
  '<circle cx="'+(a+1)+'" cy="'+(y-1.6)+'" r="1.2" fill="#fff"/><circle cx="'+(b+1)+'" cy="'+(y-1.6)+'" r="1.2" fill="#fff"/>'+
  '<path d="M'+(x-5)+' '+(y+7)+' Q'+x+' '+(y+13)+' '+(x+5)+' '+(y+7)+'" fill="none" stroke="#3b2a20" stroke-width="2.6" stroke-linecap="round"/>'+
  '<ellipse cx="'+(a-4)+'" cy="'+(y+6)+'" rx="3.2" ry="2" fill="#ff7a8a" opacity=".55"/><ellipse cx="'+(b+4)+'" cy="'+(y+6)+'" rx="3.2" ry="2" fill="#ff7a8a" opacity=".55"/></g>'}
// angry eyes (cx1, cx2, cy, size)
function eyes(x1,x2,y,r){r=r||6;
 function one(x,dir){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fff" '+O.replace('3.5','2.4')+'/><circle cx="'+(x-dir*1.2)+'" cy="'+(y+1)+'" r="'+(r*.5)+'" fill="#b3001b"/><circle cx="'+(x-dir*1.2+1)+'" cy="'+(y)+'" r="'+(r*.17)+'" fill="#fff"/>'+
  '<path d="M'+(x-dir*(r+3))+' '+(y-r-1)+' L'+(x+dir*(r+2))+' '+(y-r+3.5)+'" stroke="#3b2a20" stroke-width="3.4" stroke-linecap="round"/>'}
 return one(x1,-1)+one(x2,1)}
var A={};

A.mango=wrap('<defs><radialGradient id="g1" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffe066"/><stop offset=".55" stop-color="#ffb703"/><stop offset="1" stop-color="#ef7b2f"/></radialGradient></defs>'+
 '<path d="M52 14C80 12 94 40 86 64C78 88 46 96 28 80C10 64 20 26 52 14Z" fill="url(#g1)" '+O+'/>'+
 '<path d="M74 24C86 40 84 62 72 78" fill="none" stroke="#ef476f" stroke-width="9" opacity=".35" stroke-linecap="round"/>'+
 '<path d="M54 15C56 3 72 0 82 7C74 17 64 19 54 15Z" fill="#3da35d" '+O+'/><path d="M58 13C66 9 72 9 77 9" fill="none" stroke="#2a7a44" stroke-width="2" stroke-linecap="round"/>'+
 '<ellipse cx="35" cy="34" rx="6" ry="10" fill="#fff" opacity=".45" transform="rotate(25 35 34)"/>'+face(52,56));

A.banana=wrap('<path d="M16 68C12 40 34 16 74 10C80 9 84 15 79 19C56 28 48 46 50 72C51 86 24 90 16 68Z" fill="#ffd23f" '+O+'/>'+
 '<path d="M24 66C22 48 34 30 58 20" fill="none" stroke="#fff3b0" stroke-width="5" stroke-linecap="round" opacity=".7"/>'+
 '<path d="M74 10C78 6 84 8 84 13C84 16 82 18 79 19Z" fill="#7a4b2a" '+O+'/>'+
 '<path d="M20 74C24 86 40 88 50 76" fill="none" stroke="#e0a800" stroke-width="3" stroke-linecap="round"/>'+
 '<circle cx="19" cy="72" r="4.5" fill="#7a4b2a" '+O+'/>'+face(36,56,6.5));

A.watermelon=wrap('<path d="M7 28A43 43 0 0 0 93 28Z" fill="#43b05c" '+O+'/>'+
 '<path d="M13 28A37 37 0 0 0 87 28Z" fill="#e6f7cf"/><path d="M18 28A32 32 0 0 0 82 28Z" fill="#ff5a6e"/>'+
 '<path d="M7 28H93" stroke="#3b2a20" stroke-width="3.5" stroke-linecap="round"/>'+
 '<g fill="#3b2a20"><ellipse cx="28" cy="38" rx="2.2" ry="3.4" transform="rotate(-20 28 38)"/><ellipse cx="72" cy="38" rx="2.2" ry="3.4" transform="rotate(20 72 38)"/><ellipse cx="38" cy="33" rx="2" ry="3" /><ellipse cx="62" cy="33" rx="2" ry="3"/></g>'+
 face(50,46,8)+'<path d="M20 32C26 28 34 28 38 30" fill="none" stroke="#fff" stroke-width="2.5" opacity=".5" stroke-linecap="round"/>');

A.coconut=wrap('<defs><radialGradient id="g2" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#b9805a"/><stop offset="1" stop-color="#7a4b2a"/></radialGradient></defs>'+
 '<circle cx="50" cy="52" r="38" fill="url(#g2)" '+O+'/>'+
 '<g stroke="#5a3519" stroke-width="2" stroke-linecap="round" opacity=".55"><path d="M22 36L28 40M30 24L34 30M70 22L66 30M80 40L74 44M20 60L27 58M78 64L72 62M36 82L38 75M64 83L62 76"/></g>'+
 '<ellipse cx="34" cy="32" rx="8" ry="12" fill="#fff" opacity=".28" transform="rotate(30 34 32)"/>'+face(50,52,10));

A.orange=wrap('<defs><radialGradient id="g3" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffc84a"/><stop offset=".6" stop-color="#ff9f1c"/><stop offset="1" stop-color="#e86a10"/></radialGradient></defs>'+
 '<circle cx="50" cy="54" r="37" fill="url(#g3)" '+O+'/>'+
 '<g fill="#e07a10" opacity=".5"><circle cx="24" cy="46" r="1.6"/><circle cx="76" cy="44" r="1.6"/><circle cx="30" cy="74" r="1.6"/><circle cx="70" cy="76" r="1.6"/><circle cx="62" cy="28" r="1.6"/></g>'+
 '<path d="M50 17C48 8 56 3 66 6C64 14 58 18 50 17Z" fill="#3da35d" '+O+'/><rect x="48" y="14" width="5" height="8" rx="2" fill="#7a4b2a"/>'+
 '<ellipse cx="33" cy="38" rx="7" ry="11" fill="#fff" opacity=".4" transform="rotate(28 33 38)"/>'+face(50,56,10));

A.pineapple=wrap('<defs><radialGradient id="g4" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff3a0"/><stop offset=".5" stop-color="#ffd23f"/><stop offset="1" stop-color="#f0a500"/></radialGradient></defs>'+
 '<path d="M50 4L40 22L26 12L34 30L18 28L34 40H66L82 28L66 30L74 12L60 22Z" fill="#2fa84f" '+O+'/>'+
 '<ellipse cx="50" cy="64" rx="29" ry="32" fill="url(#g4)" '+O+'/>'+
 '<g stroke="#d28a00" stroke-width="2" opacity=".6" stroke-linecap="round"><path d="M30 46L58 90M42 40L70 82M60 38L32 82M72 46L44 90M24 60L50 92M76 62L56 92"/></g>'+
 '<g fill="#fff"><path d="M82 46l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M14 60l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z"/></g>'+
 face(50,64,9));

// the basket (drawn bigger on screen)
A.basket=wrap('<path d="M16 46C14 14 86 14 84 46" fill="none" stroke="#3b2a20" stroke-width="13" stroke-linecap="round"/>'+
 '<path d="M16 46C14 14 86 14 84 46" fill="none" stroke="#d9a05b" stroke-width="7" stroke-linecap="round"/>'+
 '<path d="M10 44H90L80 86Q50 94 20 86Z" fill="#e0a458" '+O+'/>'+
 '<g stroke="#b9783a" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M14 56H86M17 68H83M20 80H80"/><path d="M28 46L22 84M42 46L38 88M58 46L62 88M72 46L78 84"/></g>'+
 '<rect x="8" y="38" width="84" height="12" rx="6" fill="#f0b968" '+O+'/>'+
 '<path d="M18 43H40" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>');

// ---- creatures (angry) ----
A.caterpillar=wrap('<g '+O+'><circle cx="18" cy="68" r="12" fill="#8fd14f"/><circle cx="33" cy="60" r="13" fill="#7bc043"/><circle cx="49" cy="58" r="13" fill="#8fd14f"/><circle cx="64" cy="60" r="13" fill="#7bc043"/></g>'+
 '<g stroke="#3b2a20" stroke-width="3" stroke-linecap="round"><path d="M18 78v7M33 72v8M49 71v8M64 73v8"/></g>'+
 '<circle cx="78" cy="48" r="17" fill="#5aa02c" '+O+'/>'+
 '<path d="M72 33Q68 22 62 20M84 32Q88 22 94 22" fill="none" stroke="#3b2a20" stroke-width="3" stroke-linecap="round"/><circle cx="62" cy="20" r="3" fill="#e63946"/><circle cx="94" cy="22" r="3" fill="#e63946"/>'+
 eyes(72,86,46,5.5)+
 '<path d="M70 58Q78 53 86 58" fill="#fff" stroke="#3b2a20" stroke-width="2.4"/><path d="M73 58l2 3 2-3M79 58l2 3 2-3" fill="none" stroke="#3b2a20" stroke-width="1.8"/>');

A.ant=wrap('<g '+O+'><ellipse cx="22" cy="62" rx="15" ry="12" fill="#c0392b"/><circle cx="46" cy="58" r="9" fill="#e74c3c"/><circle cx="68" cy="50" r="16" fill="#c0392b"/></g>'+
 '<g stroke="#3b2a20" stroke-width="3" stroke-linecap="round" fill="none"><path d="M38 64L32 80M46 66L46 82M54 64L60 80"/><path d="M62 36Q58 22 50 18M74 36Q80 22 90 20"/></g>'+
 eyes(63,76,50,5)+'<path d="M64 62Q70 58 76 62" fill="none" stroke="#3b2a20" stroke-width="2.6" stroke-linecap="round"/>');

A.spider=wrap('<g stroke="#2d1e4a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M30 50L10 34L6 52M28 58L8 68L12 84M72 50L92 34L94 52M74 58L94 68L90 84"/></g>'+
 '<ellipse cx="50" cy="58" rx="27" ry="25" fill="#6b4aa8" '+O+'/>'+
 '<path d="M50 40L56 56L50 74L44 56Z" fill="#c9b6ff" opacity=".6"/>'+
 eyes(40,60,50,6.5)+
 '<path d="M42 66Q50 62 58 66" fill="#fff" stroke="#3b2a20" stroke-width="2.4"/><path d="M45 66l2 5 2-5M51 66l2 5 2-5" fill="#fff" stroke="#3b2a20" stroke-width="1.8"/>');

A.snake=wrap('<path d="M22 88C-2 72 50 66 34 46C20 30 54 24 62 36" fill="none" stroke="#3b2a20" stroke-width="22" stroke-linecap="round"/>'+
 '<path d="M22 88C-2 72 50 66 34 46C20 30 54 24 62 36" fill="none" stroke="#4cba52" stroke-width="15.5" stroke-linecap="round"/>'+
 '<path d="M22 88C-2 72 50 66 34 46C20 30 54 24 62 36" fill="none" stroke="#a8e86a" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 9"/>'+
 '<ellipse cx="72" cy="30" rx="19" ry="15" fill="#4cba52" '+O+'/>'+
 '<path d="M90 34L98 32M90 38L98 42" stroke="#e63946" stroke-width="3" stroke-linecap="round"/>'+
 eyes(66,80,26,5.2)+'<path d="M64 38Q73 43 82 37" fill="none" stroke="#3b2a20" stroke-width="2.6" stroke-linecap="round"/>');

A.dragon=wrap('<path d="M18 74C0 70 4 48 22 54" fill="none" stroke="#3b2a20" stroke-width="14" stroke-linecap="round"/>'+
 '<path d="M18 74C0 70 4 48 22 54" fill="none" stroke="#e63946" stroke-width="8" stroke-linecap="round"/>'+
 '<path d="M30 40L16 18L44 30Z" fill="#ffb703" '+O+'/><path d="M70 40L84 18L56 30Z" fill="#ffb703" '+O+'/>'+
 '<path d="M24 56C6 56 4 36 18 34C26 46 30 50 34 52Z" fill="#ff7a59" '+O+'/><path d="M76 56C94 56 96 36 82 34C74 46 70 50 66 52Z" fill="#ff7a59" '+O+'/>'+
 '<ellipse cx="50" cy="68" rx="28" ry="24" fill="#e63946" '+O+'/><ellipse cx="50" cy="74" rx="16" ry="15" fill="#ffd9a0"/>'+
 '<g stroke="#e5a96b" stroke-width="2" fill="none"><path d="M38 70H62M40 78H60"/></g>'+
 '<ellipse cx="50" cy="42" rx="25" ry="22" fill="#e63946" '+O+'/>'+
 '<path d="M40 24L43 12L48 22M46 22L50 8L54 22M52 22L57 12L60 24" fill="#ffb703" '+O.replace('3.5','2.6')+'/>'+
 eyes(39,61,38,5.6)+
 '<path d="M36 52Q50 70 64 52Q50 58 36 52Z" fill="#7a1020" '+O.replace('3.5','2.6')+'/><path d="M41 55l2.4 5 2.4-4M59 55l-2.4 5-2.4-4" fill="#fff" stroke="#3b2a20" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="50" cy="49" rx="9" ry="3.4" fill="#ff7a59"/><circle cx="46" cy="49" r="1.4" fill="#3b2a20"/><circle cx="54" cy="49" r="1.4" fill="#3b2a20"/>'+
 '<path d="M50 92Q44 100 50 100Q56 100 50 92Z" fill="#ffb703" opacity=".9"/>');

// new creatures for later levels
A.bee=wrap('<defs><clipPath id="c"><ellipse cx="50" cy="60" rx="30" ry="24"/></clipPath></defs><ellipse cx="30" cy="30" rx="14" ry="9" fill="#cfefff" opacity=".85" '+O+' transform="rotate(-28 30 30)"/><ellipse cx="62" cy="26" rx="14" ry="9" fill="#cfefff" opacity=".85" '+O+' transform="rotate(24 62 26)"/>'+
 '<ellipse cx="50" cy="60" rx="30" ry="24" fill="#ffd23f" '+O+'/>'+
 '<path d="M38 38V82M52 36V84M66 40V80" stroke="#3b2a20" stroke-width="8" opacity=".9" clip-path="url(#c)"/>'+
 '<ellipse cx="50" cy="60" rx="30" ry="24" fill="none" '+O+'/>'+
 '<path d="M80 56L94 60L80 66Z" fill="#3b2a20"/>'+
 eyes(36,54,52,5.4)+'<path d="M38 66Q45 62 52 66" fill="none" stroke="#3b2a20" stroke-width="2.6" stroke-linecap="round"/>');

A.cricket=wrap('<path d="M24 62L8 44L20 40L34 54M34 70L16 90H32L46 76" fill="#6aa84f" '+O+'/>'+
 '<ellipse cx="52" cy="62" rx="30" ry="18" fill="#6aa84f" '+O+'/><path d="M30 58Q52 44 74 58" fill="none" stroke="#a8d870" stroke-width="5" stroke-linecap="round"/>'+
 '<circle cx="76" cy="46" r="15" fill="#7cc15e" '+O+'/><path d="M70 34L62 14M82 34L92 14" stroke="#3b2a20" stroke-width="3" stroke-linecap="round"/>'+
 eyes(71,83,45,4.8)+'<path d="M72 55Q77 52 82 55" fill="none" stroke="#3b2a20" stroke-width="2.4" stroke-linecap="round"/>'+
 '<path d="M58 78L66 92H78L70 78" fill="#6aa84f" '+O+'/>');

A.scorpion=wrap('<path d="M24 78C4 64 10 30 36 22C46 20 50 30 42 34C28 38 26 56 38 66" fill="none" stroke="#3b2a20" stroke-width="13" stroke-linecap="round"/>'+
 '<path d="M24 78C4 64 10 30 36 22C46 20 50 30 42 34C28 38 26 56 38 66" fill="none" stroke="#c76a1a" stroke-width="7.5" stroke-linecap="round"/>'+
 '<path d="M36 18L48 10L46 24Z" fill="#e63946" '+O+'/>'+
 '<ellipse cx="62" cy="68" rx="24" ry="17" fill="#d9822b" '+O+'/>'+
 '<path d="M80 60Q94 52 94 66Q92 76 82 74" fill="#d9822b" '+O+'/><path d="M80 52Q94 44 96 56" fill="#c76a1a" '+O+' opacity="0"/>'+
 '<circle cx="76" cy="54" r="9" fill="#d9822b" '+O+'/>'+
 eyes(56,70,64,4.6)+'<path d="M56 76Q63 72 70 76" fill="none" stroke="#3b2a20" stroke-width="2.4" stroke-linecap="round"/>');

A.bat=wrap('<path d="M50 54L4 30C8 48 6 62 18 74C26 68 32 72 38 78C42 70 46 68 50 72Z" fill="#5a3f86" '+O+'/>'+
 '<path d="M50 54L96 30C92 48 94 62 82 74C74 68 68 72 62 78C58 70 54 68 50 72Z" fill="#5a3f86" '+O+'/>'+
 '<ellipse cx="50" cy="56" rx="18" ry="20" fill="#7a5aa8" '+O+'/>'+
 '<path d="M36 38L32 20L46 32M64 38L68 20L54 32" fill="#7a5aa8" '+O+'/>'+
 eyes(43,57,52,5)+'<path d="M45 64Q50 61 55 64" fill="#fff" stroke="#3b2a20" stroke-width="2"/><path d="M47 64l1.5 3 1.5-3M51 64l1.5 3 1.5-3" fill="none" stroke="#3b2a20" stroke-width="1.5"/>');

window.ART=A;
// emoji name -> artwork name (so the game keeps using the same item names)
window.ARTMAP={"🥭":"mango","🍌":"banana","🍉":"watermelon","🥥":"coconut","🍊":"orange","🍍":"pineapple","🧺":"basket","🐛":"caterpillar","🐜":"ant","🐝":"bee","🦗":"cricket","🕷️":"spider","🦂":"scorpion","🦇":"bat","🐍":"snake","🐉":"dragon"};
window.SPR={};
Object.keys(A).forEach(function(k){var im=new Image();im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(A[k]);window.SPR[k]=im});
window.artUrl=function(k){return"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(A[k])};
})();
