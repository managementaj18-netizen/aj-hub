/* Treasure Trek - data: levels (one country each), traditional outfits, world map shapes */
(function(TK){
/* A trip around the world. One level = one country. Each has its own look, weather, obstacles and traditional clothes. */
TK.LEVELS=[
 {id:"sg",n:"SINGAPORE",km:"សិង្ហបុរី",flag:"sg",lon:103.82,lat:1.35,len:2000,v0:13,v1:19,
  sky:["#2aa6ee","#8fdcf7","#e6f8ff"],sun:"#fffbe0",fog:"#d4eef8",tint:"rgba(120,200,255,.05)",
  road:["#4c515e","#454a56"],verge:["#4fae52","#46a049"],edge:"#f4f4f4",ground:"asphalt",
  scen:["tower","supertree","palm","merlion","supertree","tower"],lm:"Merlion · Marina Bay · Supertrees",hz:"sg",weather:"none",
  obs:{block:"cart",low:"barrier",high:"gantry"},pal:["#e8442a","#fff","#1b7a8a"],outfit:"kebaya",
  fact:"The Merlion has a lion's head and a fish's body!"},
 {id:"vn",n:"VIETNAM",km:"វៀតណាម",flag:"vn",lon:107.0,lat:20.95,len:2200,v0:13.5,v1:19.5,
  sky:["#ff9ab8","#ffd28f","#fff1c8"],sun:"#fff4c2",fog:"#fbe6c4",tint:"rgba(255,180,120,.06)",
  road:["#b48e5c","#a98456"],verge:["#8fd64a","#7fc63c"],edge:"#e8c880",ground:"dirt",
  scen:["palm","hut","karst","nonla","junk","palm","bamboo"],lm:"Ha Long Bay · Conical hats · Rice fields",hz:"vn",weather:"petals",
  obs:{block:"cyclo",low:"bamboo",high:"laundry"},pal:["#e8b82a","#d92a2a","#2a7a3a"],outfit:"aodai",
  fact:"The conical hat is called nón lá, made from palm leaves."},
 {id:"cn",n:"CHINA",km:"ប្រទេសចិន",flag:"cn",lon:116.4,lat:39.9,len:2400,v0:14,v1:20,
  sky:["#e8423a","#ff9a5a","#ffe0a0"],sun:"#fff3b0",fog:"#f7d3b0",tint:"rgba(255,120,80,.06)",
  road:["#8a8a94","#7e7e88"],verge:["#c9a35a","#b8924a"],edge:"#c42a22",ground:"stone",
  scen:["lantern","pagoda","bamboo","panda","dragon","lantern"],lm:"Great Wall · Panda · Dragon",hz:"cn",weather:"petals",
  obs:{block:"lion",low:"rope",high:"paifang"},pal:["#d93a2e","#ffd24a","#7a2418"],outfit:"hanfu",
  fact:"The Great Wall is more than 21,000 km long!"},
 {id:"ru",n:"RUSSIA",km:"រុស្ស៊ី",flag:"ru",lon:37.6,lat:55.75,len:2600,v0:14.5,v1:20.5,
  sky:["#7a9ac8","#bcd0e6","#eef3fa"],sun:"#ffffff",fog:"#e4ecf6",tint:"rgba(170,200,255,.08)",
  road:["#e4ebf4","#d7e0ec"],verge:["#f6f9ff","#e9f0fa"],edge:"#9ab4d6",ground:"snow",
  scen:["fir","fir","cabin","church","lamppost","fir"],lm:"Red Square domes · Snowy forest",hz:"ru",weather:"snow",
  obs:{block:"snowman",low:"snowlog",high:"icicle"},pal:["#e9f2fb","#8ab4e0","#4a6a90"],outfit:"ushanka",
  fact:"Russia is so big it has 11 time zones."},
 {id:"eg",n:"EGYPT",km:"អេហ្ស៊ីប",flag:"eg",lon:31.2,lat:30.0,len:2800,v0:15,v1:21,
  sky:["#4aa8e8","#f2d49a","#ffe9b8"],sun:"#fff0b8",fog:"#f1d8a4",tint:"rgba(255,200,100,.08)",
  road:["#d9b878","#cfae6e"],verge:["#e8c888","#dcbc7a"],edge:"#b8923c",ground:"sand",
  scen:["palmdate","obelisk","rock","cactus","palmdate","obelisk"],lm:"Pyramids of Giza · Sphinx · Desert",hz:"eg",weather:"dust",
  obs:{block:"glyph",low:"stonewall",high:"lintel"},pal:["#c8a050","#ffd24a","#4a7ac8"],outfit:"galabeya",
  fact:"The Great Pyramid was the tallest building for 3,800 years."},
 {id:"br",n:"BRAZIL",km:"ប្រេស៊ីល",flag:"br",lon:-60.0,lat:-3.1,len:3000,v0:15.5,v1:21.5,
  sky:["#2aa86a","#8fd8a0","#e8f8d0"],sun:"#fff7b8",fog:"#cfe8c4",tint:"rgba(60,160,90,.1)",
  road:["#8a6a42","#7e603c"],verge:["#2e8a3a","#287a34"],edge:"#5a8a2a",ground:"jungle",
  scen:["jtree","fern","banana","jtree","fern","jtree"],lm:"Amazon Rainforest · Christ the Redeemer",hz:"br",weather:"leaves",
  obs:{block:"stump",low:"jlog",high:"vines"},pal:["#2a7a3a","#ffd24a","#e8442a"],outfit:"samba",
  fact:"The Amazon makes about 20% of the world's oxygen."},
 {id:"kh",n:"CAMBODIA",km:"កម្ពុជា",flag:"kh",lon:103.86,lat:13.36,len:3200,v0:16,v1:22,
  sky:["#ff6a3d","#ffb347","#ffe9a8"],sun:"#ffe9a0",fog:"#fbe0a8",tint:"rgba(255,140,60,.08)",
  road:["#cfa56e","#c29a62"],verge:["#7fb84a","#70a93d"],edge:"#f0d090",ground:"stone",
  scen:["sugar","pillar","lotus","bayon","apsara","tuktuk","sugar"],lm:"Angkor Wat · Bayon · Apsara",hz:"kh",weather:"dust",
  obs:{block:"templeblock",low:"naga",high:"gopura"},pal:["#a89678","#e8c25a","#7a6c52"],outfit:"sampot",
  fact:"Angkor Wat is the largest religious monument in the world."}
];

/* traditional clothing for each country (drawn on the runner) */
TK.OUTFITS={
 kebaya:{btype:"skirt",blen:22,tlen:8,skin:"#e9b48a",hair:"#2a1a14",style:"bun",
  top:["#3fc2b0","#1f8f86"],trim:"#ffd9e8",pattern:"floral",long:false,
  bottom:["#c8455a","#8f2a40"],bpat:"batik",sleeve:"3/4",shoe:["#f4d8a8","#c49a5a"],acc:"flower"},
 aodai:{btype:"pants",blen:0,tlen:30,skin:"#ecb98e",hair:"#1a1210",style:"pony",
  top:["#fbfbff","#d8e4f4"],trim:"#ff9ab8",pattern:"none",long:true,
  bottom:["#ffffff","#e8eef8"],bpat:"none",sleeve:"long",shoe:["#f4efe4","#c4b898"],acc:"nonla"},
 hanfu:{btype:"skirt",blen:26,tlen:28,skin:"#f0c49a",hair:"#17100c",style:"buns",
  top:["#d92a2a","#9a1818"],trim:"#ffd24a",pattern:"cloud",long:true,
  bottom:["#e8b82a","#b88a10"],bpat:"none",sleeve:"wide",shoe:["#7a1818","#4a0c0c"],acc:"pins"},
 ushanka:{btype:"pants",blen:0,tlen:17,skin:"#f2c9a8",hair:"#6a4a2a",style:"none",
  top:["#c4302a","#8a1c18"],trim:"#f4f4f4",pattern:"fur",long:true,
  bottom:["#2a3a5a","#1a2540"],bpat:"none",sleeve:"long",shoe:["#6a4a2a","#3e2a14"],acc:"ushanka"},
 galabeya:{btype:"pants",blen:0,tlen:33,skin:"#d9a070",hair:"#1a1210",style:"none",
  top:["#f6f1e4","#d8cfb8"],trim:"#ffd24a",pattern:"gold",long:true,
  bottom:["#f6f1e4","#d8cfb8"],bpat:"none",sleeve:"long",shoe:["#8a5a2a","#5a3a14"],acc:"headscarf"},
 samba:{btype:"shorts",blen:0,tlen:0,skin:"#c98a5c",hair:"#241610",style:"long",
  top:["#ffd24a","#e8a010"],trim:"#2ac46a",pattern:"sequin",long:false,
  bottom:["#2ac46a","#148a48"],bpat:"none",sleeve:"none",shoe:["#e8442a","#a82818"],acc:"feathers"},
 sampot:{btype:"skirt",blen:22,tlen:6,skin:"#dca47a",hair:"#1c1410",style:"pony",
  top:["#fff3d6","#e8d6a8"],trim:"#e8b82a",pattern:"none",long:false,
  bottom:["#7a2a9a","#4a1666"],bpat:"gold",sleeve:"short",shoe:["#e8c25a","#a8861a"],acc:"krama"}
};

/* rough world continents (lon,lat) used for the top-down map view */
TK.WORLD=[
 /* North America */
 [[-168,66],[-162,70],[-141,70],[-125,70],[-110,73],[-95,72],[-85,69],[-80,63],[-90,57],[-82,52],[-78,57],[-67,60],[-61,56],[-56,52],[-65,47],[-70,43],[-74,40],[-76,35],[-81,31],[-80,26],[-83,29],[-89,30],[-97,27],[-97,21],[-94,18],[-90,21],[-87,21],[-88,16],[-84,14],[-83,10],[-80,8.5],[-84,8],[-88,13],[-93,16],[-98,16.5],[-105,20],[-110,24],[-112,29],[-115,30],[-117,33],[-121,35],[-124,41],[-124,48],[-130,54],[-137,59],[-147,61],[-152,58],[-158,57],[-164,55],[-162,59],[-166,62]],
 /* Greenland */ [[-56,60],[-44,60],[-30,68],[-20,72],[-18,80],[-35,83],[-58,82],[-70,78],[-58,70]],
 /* South America */
 [[-80,9],[-72,12],[-62,10.5],[-52,5],[-50,0],[-44,-2.5],[-35,-5.5],[-35,-9],[-38.5,-14],[-41,-22],[-48,-26],[-53,-34],[-58,-38],[-63,-41],[-65,-47],[-68,-53],[-72,-52],[-74,-46],[-73,-38],[-71,-30],[-70,-20],[-76,-14],[-81,-6],[-80,-2],[-78,2],[-77,7]],
 /* Africa */
 [[-17,21],[-13,28],[-9,33],[-5.5,35.8],[10,37],[11,33],[20,32],[25,32],[32,31],[34.5,28],[38,21],[43,12],[51,12],[48,5],[41,-2],[40,-10],[35,-18],[33,-26],[27,-34],[20,-35],[18,-30],[12,-18],[13,-8],[9,-1],[9,4],[4,6],[-4,5],[-8,4],[-13,8],[-17,14]],
 /* Madagascar */ [[44,-13],[50,-15],[48,-24],[44,-24],[43,-18]],
 /* Eurasia */
 [[-9,37],[-9,43.5],[-1.5,43.5],[-4.5,48.5],[1.5,51],[4,52],[8,54],[8.5,57],[10.5,57.5],[10.5,55],[12.5,54.5],[19,54.5],[21,57],[24,59],[30,60],[22,60.5],[21,64],[25,65.5],[22,66],[17,62],[18.5,60],[16,56],[12.5,56],[11,59],[5,59],[5,62],[14,67.5],[22,70],[30,70.5],[41,67],[35,64],[44,66],[60,69],[67,69],[72,72],[80,73],[88,75],[104,77.5],[114,73.5],[128,72],[140,72],[160,70],[170,70],[180,68.5],[180,65],[170,64],[163,60],[162,57],[156,51],[155,57],[142,59],[136,54],[141,52],[140,48],[135,43],[130,42.5],[129,40],[127,39],[129,35.5],[126,34.5],[126.5,37.5],[125,39.5],[121.5,40.5],[118,39],[121.5,37],[119,34],[122,31],[121,28],[117,23.5],[111,21.5],[108,21.5],[106.5,19.5],[108,16],[109.2,12],[105,8.6],[104.8,10.3],[103,11],[100.8,13.2],[99.6,10],[100.4,7.2],[103.5,4],[104.2,1.4],[101.3,2.8],[100.3,5.5],[98.3,8],[98.5,13],[97.8,16],[94.5,16],[94,19.5],[92,21.5],[88.5,22],[87,21],[80,15.5],[77.5,8],[76,11],[73,17],[72.5,21],[68,23.5],[66.5,25.5],[61,25.3],[57,25.8],[56.5,27.2],[52,27.8],[50,30],[48,30],[48.5,28],[50,26.5],[51,24.5],[54,24.2],[56,26],[58,23.5],[59.8,22.5],[57,19],[52,16],[45,12.8],[43,13],[42.5,16],[39,21.5],[35,28],[34.5,31],[35.8,34.5],[36,36.5],[33,36],[28,36.8],[27,40],[26.5,41],[23,40.5],[24,38],[22,37],[19.5,40],[19,42],[13.5,45.5],[12.5,44],[16,41.5],[18.5,40],[16,38],[15.5,40],[12,42],[10,44],[8,44],[3,43.3],[3,42],[0.5,40.5],[-0.5,38.5],[-2,36.7],[-5.4,36],[-8.8,37]],
 /* British Isles, Iceland, Japan, Indonesia, Philippines, Taiwan-free, Australia, New Zealand */
 [[-5,50],[1.5,51],[0,53],[-2,57],[-5,58.5],[-6,56],[-3,54],[-5,52]],
 [[-24,64],[-14,64.5],[-14,66],[-22,66.5]],
 [[130,31],[132,34],[135,34.5],[139,35.5],[140.5,38],[141.5,41],[140,43],[142,45.5],[144,43],[142,41],[140,36],[136,33.5]],
 [[95.3,5.6],[98,4],[100.5,.5],[103.5,-2],[106,-5.8],[104.5,-5.9],[101,-3],[98.5,1],[95.6,3.5]],
 [[109,1.5],[111,2],[114,4.8],[117,7],[119,5],[118,1],[116,-3.5],[112,-3.2],[110,-1.5]],
 [[105.5,-6.8],[108,-6.5],[111,-6.5],[114.5,-7.6],[112,-8.4],[108,-7.8],[105.8,-7.2]],
 [[120,18.5],[122,18],[122,14],[124,12.5],[125.5,9.5],[126,7],[124,6.5],[122,8],[121,10.5],[120,13.5]],
 [[113,-22],[114,-26],[115,-34],[118,-35],[124,-33.5],[129,-31.5],[135,-35],[138,-35],[140,-38],[146,-39],[150,-37],[153,-32],[153,-25],[146,-19],[142,-10.5],[141,-17],[136,-12],[131,-12],[127,-14],[122,-18]],
 [[172,-34],[178,-38],[176,-41],[172,-41]],[[167,-46],[174,-41.5],[171,-44],[168,-47]]
];
})(window.TK=window.TK||{});
