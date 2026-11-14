/* Treasure Trek - the whole world: all 195 countries, regional looks, outfits, difficulty tiers */
(function(TK){
/* All 195 countries in travel order: each stop is near the one before it. [id,name,lat,lon,look,capital] */
TK.ROUTE=[["ca","Canada",56.0,-106.0,"boreal","Ottawa"],
["us","United States",39.0,-98.0,"namer","Washington, D.C."],
["mx","Mexico",23.6,-102.5,"latam","Mexico City"],
["gt","Guatemala",15.5,-90.3,"latam","Guatemala City"],
["bz","Belize",17.2,-88.5,"trop","Belmopan"],
["sv","El Salvador",13.8,-88.9,"latam","San Salvador"],
["hn","Honduras",14.8,-86.6,"latam","Tegucigalpa"],
["ni","Nicaragua",12.9,-85.2,"trop","Managua"],
["cr","Costa Rica",9.9,-84.1,"trop","San José"],
["pa","Panama",8.5,-80.0,"trop","Panama City"],
["jm","Jamaica",18.1,-77.3,"island","Kingston"],
["cu","Cuba",21.5,-79.5,"island","Havana"],
["bs","Bahamas",25.0,-77.4,"island","Nassau"],
["ht","Haiti",19.0,-72.4,"island","Port-au-Prince"],
["do","Dominican Republic",18.9,-70.2,"island","Santo Domingo"],
["ag","Antigua and Barbuda",17.1,-61.8,"island","St. John's"],
["kn","Saint Kitts and Nevis",17.3,-62.7,"island","Basseterre"],
["dm","Dominica",15.4,-61.4,"island","Roseau"],
["lc","Saint Lucia",13.9,-61.0,"island","Castries"],
["vc","Saint Vincent and the Grenadines",13.2,-61.2,"island","Kingstown"],
["bb","Barbados",13.2,-59.5,"island","Bridgetown"],
["gd","Grenada",12.1,-61.7,"island","St. George's"],
["tt","Trinidad and Tobago",10.5,-61.3,"island","Port of Spain"],
["ve","Venezuela",7.0,-66.0,"trop","Caracas"],
["co","Colombia",4.6,-74.3,"andes","Bogotá"],
["ec","Ecuador",-1.8,-78.2,"andes","Quito"],
["pe","Peru",-9.2,-75.0,"andes","Lima"],
["bo","Bolivia",-16.5,-64.7,"andes","Sucre"],
["cl","Chile",-33.0,-70.7,"andes","Santiago"],
["ar","Argentina",-34.0,-64.0,"pampas","Buenos Aires"],
["uy","Uruguay",-32.5,-55.8,"pampas","Montevideo"],
["py","Paraguay",-23.4,-58.4,"trop","Asunción"],
["br","Brazil",-10.0,-52.0,"trop","Brasília"],
["sr","Suriname",4.0,-56.0,"trop","Paramaribo"],
["gy","Guyana",5.0,-59.0,"trop","Georgetown"],
["cv","Cabo Verde",16.0,-24.0,"island","Praia"],
["sn","Senegal",14.5,-14.5,"savanna","Dakar"],
["gm","Gambia",13.4,-15.4,"savanna","Banjul"],
["gw","Guinea-Bissau",12.0,-15.0,"savanna","Bissau"],
["gn","Guinea",10.9,-10.9,"trop","Conakry"],
["sl","Sierra Leone",8.5,-11.8,"trop","Freetown"],
["lr","Liberia",6.4,-9.4,"trop","Monrovia"],
["ci","Ivory Coast",7.5,-5.5,"trop","Yamoussoukro"],
["gh","Ghana",7.9,-1.0,"savanna","Accra"],
["tg","Togo",8.6,0.8,"savanna","Lomé"],
["bj","Benin",9.3,2.3,"savanna","Porto-Novo"],
["ng","Nigeria",9.1,8.7,"savanna","Abuja"],
["cm","Cameroon",5.7,12.7,"trop","Yaoundé"],
["gq","Equatorial Guinea",1.6,10.5,"trop","Malabo"],
["st","Sao Tome and Principe",0.3,6.7,"island","São Tomé"],
["ga","Gabon",-0.8,11.6,"trop","Libreville"],
["cg","Republic of the Congo",-0.7,15.2,"trop","Brazzaville"],
["cd","DR Congo",-2.9,23.7,"trop","Kinshasa"],
["ao","Angola",-12.3,17.5,"savanna","Luanda"],
["na","Namibia",-22.0,17.0,"desert","Windhoek"],
["bw","Botswana",-22.3,24.7,"savanna","Gaborone"],
["za","South Africa",-30.5,25.0,"savanna","Pretoria"],
["ls","Lesotho",-29.6,28.2,"savanna","Maseru"],
["sz","Eswatini",-26.5,31.5,"savanna","Mbabane"],
["mz","Mozambique",-18.7,35.5,"savanna","Maputo"],
["zw","Zimbabwe",-19.0,29.1,"savanna","Harare"],
["zm","Zambia",-13.1,27.8,"savanna","Lusaka"],
["mw","Malawi",-13.3,34.3,"savanna","Lilongwe"],
["tz","Tanzania",-6.4,34.9,"savanna","Dodoma"],
["km","Comoros",-11.9,43.3,"island","Moroni"],
["mg","Madagascar",-19.0,46.9,"trop","Antananarivo"],
["mu","Mauritius",-20.3,57.6,"island","Port Louis"],
["sc","Seychelles",-4.7,55.5,"island","Victoria"],
["ke","Kenya",0.2,37.9,"savanna","Nairobi"],
["ug","Uganda",1.4,32.3,"savanna","Kampala"],
["rw","Rwanda",-1.9,29.9,"savanna","Kigali"],
["bi","Burundi",-3.4,29.9,"savanna","Gitega"],
["ss","South Sudan",7.9,30.2,"savanna","Juba"],
["et","Ethiopia",9.1,40.5,"savanna","Addis Ababa"],
["er","Eritrea",15.2,39.8,"desert","Asmara"],
["dj","Djibouti",11.8,42.6,"desert","Djibouti"],
["so","Somalia",5.2,46.2,"desert","Mogadishu"],
["sd","Sudan",15.6,30.2,"desert","Khartoum"],
["td","Chad",15.5,18.7,"desert","N'Djamena"],
["cf","Central African Republic",6.6,20.9,"trop","Bangui"],
["ne","Niger",17.6,8.1,"desert","Niamey"],
["ml","Mali",17.6,-4.0,"desert","Bamako"],
["bf","Burkina Faso",12.2,-1.6,"savanna","Ouagadougou"],
["mr","Mauritania",20.3,-10.9,"desert","Nouakchott"],
["ma","Morocco",31.8,-7.1,"desert","Rabat"],
["dz","Algeria",28.0,2.6,"desert","Algiers"],
["tn","Tunisia",34.0,9.5,"med","Tunis"],
["ly","Libya",26.3,17.2,"desert","Tripoli"],
["eg","Egypt",26.8,30.8,"desert","Cairo"],
["il","Israel",31.5,34.9,"desert","Jerusalem"],
["ps","Palestine",31.9,35.2,"desert","Ramallah"],
["lb","Lebanon",33.9,35.9,"med","Beirut"],
["sy","Syria",35.0,38.5,"desert","Damascus"],
["jo","Jordan",31.0,36.8,"desert","Amman"],
["sa","Saudi Arabia",24.0,45.0,"desert","Riyadh"],
["ye","Yemen",15.5,47.5,"desert","Sana'a"],
["om","Oman",21.0,57.0,"desert","Muscat"],
["ae","United Arab Emirates",24.0,54.0,"desert","Abu Dhabi"],
["qa","Qatar",25.3,51.2,"desert","Doha"],
["bh","Bahrain",26.0,50.5,"desert","Manama"],
["kw","Kuwait",29.3,47.5,"desert","Kuwait City"],
["iq","Iraq",33.0,44.0,"desert","Baghdad"],
["ir","Iran",32.0,53.0,"desert","Tehran"],
["az","Azerbaijan",40.4,47.7,"steppe","Baku"],
["am","Armenia",40.2,45.0,"steppe","Yerevan"],
["ge","Georgia",42.2,43.5,"steppe","Tbilisi"],
["tr","Turkey",39.0,35.0,"med","Ankara"],
["cy","Cyprus",35.0,33.4,"med","Nicosia"],
["gr","Greece",39.0,22.0,"med","Athens"],
["al","Albania",41.1,20.1,"med","Tirana"],
["mk","North Macedonia",41.6,21.7,"euro","Skopje"],
["bg","Bulgaria",42.7,25.5,"euro","Sofia"],
["rs","Serbia",44.0,21.0,"euro","Belgrade"],
["me","Montenegro",42.7,19.3,"med","Podgorica"],
["ba","Bosnia and Herzegovina",44.0,17.8,"euro","Sarajevo"],
["hr","Croatia",45.1,15.2,"med","Zagreb"],
["si","Slovenia",46.1,14.8,"alps","Ljubljana"],
["it","Italy",42.8,12.6,"med","Rome"],
["sm","San Marino",43.9,12.45,"med","San Marino"],
["va","Vatican City",41.9,12.45,"med","Vatican City"],
["mt","Malta",35.9,14.4,"med","Valletta"],
["mc","Monaco",43.7,7.4,"med","Monaco"],
["ad","Andorra",42.5,1.6,"alps","Andorra la Vella"],
["es","Spain",40.0,-3.7,"med","Madrid"],
["pt","Portugal",39.6,-8.0,"med","Lisbon"],
["fr","France",46.6,2.4,"euro","Paris"],
["lu","Luxembourg",49.8,6.1,"euro","Luxembourg"],
["be","Belgium",50.6,4.6,"euro","Brussels"],
["nl","Netherlands",52.2,5.6,"euro","Amsterdam"],
["gb","United Kingdom",54.0,-2.5,"euro","London"],
["ie","Ireland",53.3,-8.0,"euro","Dublin"],
["is","Iceland",64.9,-18.5,"boreal","Reykjavík"],
["no","Norway",61.0,9.0,"boreal","Oslo"],
["se","Sweden",62.0,15.0,"boreal","Stockholm"],
["dk","Denmark",56.0,10.0,"euro","Copenhagen"],
["de","Germany",51.0,10.4,"euro","Berlin"],
["ch","Switzerland",46.8,8.2,"alps","Bern"],
["li","Liechtenstein",47.2,9.55,"alps","Vaduz"],
["at","Austria",47.5,14.5,"alps","Vienna"],
["cz","Czechia",49.8,15.5,"euro","Prague"],
["sk","Slovakia",48.7,19.7,"euro","Bratislava"],
["hu","Hungary",47.2,19.5,"euro","Budapest"],
["ro","Romania",45.9,25.0,"euro","Bucharest"],
["md","Moldova",47.2,28.5,"euro","Chișinău"],
["ua","Ukraine",49.0,32.0,"euro","Kyiv"],
["by","Belarus",53.7,28.0,"euro","Minsk"],
["pl","Poland",52.0,19.4,"euro","Warsaw"],
["lt","Lithuania",55.3,23.9,"euro","Vilnius"],
["lv","Latvia",56.9,24.6,"euro","Riga"],
["ee","Estonia",58.7,25.5,"boreal","Tallinn"],
["fi","Finland",64.5,26.0,"boreal","Helsinki"],
["ru","Russia",58.0,60.0,"boreal","Moscow"],
["kz","Kazakhstan",48.0,67.0,"steppe","Astana"],
["kg","Kyrgyzstan",41.2,74.8,"steppe","Bishkek"],
["uz","Uzbekistan",41.4,64.6,"steppe","Tashkent"],
["tj","Tajikistan",38.9,71.0,"steppe","Dushanbe"],
["tm","Turkmenistan",39.0,59.5,"steppe","Ashgabat"],
["af","Afghanistan",33.9,67.7,"steppe","Kabul"],
["pk","Pakistan",30.0,70.0,"steppe","Islamabad"],
["in","India",22.0,79.0,"india","New Delhi"],
["mv","Maldives",3.2,73.2,"island","Malé"],
["lk","Sri Lanka",7.9,80.7,"island","Colombo"],
["bd","Bangladesh",23.7,90.4,"india","Dhaka"],
["bt","Bhutan",27.5,90.4,"andes","Thimphu"],
["np","Nepal",28.4,84.1,"andes","Kathmandu"],
["cn","China",35.0,103.0,"east","Beijing"],
["mn","Mongolia",46.9,103.8,"steppe","Ulaanbaatar"],
["kp","North Korea",40.3,127.5,"east","Pyongyang"],
["kr","South Korea",36.5,127.9,"east","Seoul"],
["jp","Japan",36.2,138.3,"east","Tokyo"],
["ph","Philippines",12.9,122.8,"sea","Manila"],
["pw","Palau",7.5,134.6,"island","Ngerulmud"],
["fm","Micronesia",6.9,158.2,"island","Palikir"],
["mh","Marshall Islands",7.1,171.2,"island","Majuro"],
["ki","Kiribati",1.4,173.0,"island","Tarawa"],
["nr","Nauru",-0.5,166.9,"island","Yaren"],
["tv","Tuvalu",-8.5,179.2,"island","Funafuti"],
["ws","Samoa",-13.8,187.9,"island","Apia"],
["to","Tonga",-21.2,184.8,"island","Nukuʻalofa"],
["nz","New Zealand",-41.0,174.0,"pacific","Wellington"],
["fj","Fiji",-17.7,178.0,"island","Suva"],
["vu","Vanuatu",-15.4,166.9,"island","Port Vila"],
["sb","Solomon Islands",-9.6,160.2,"island","Honiara"],
["pg","Papua New Guinea",-6.3,143.9,"trop","Port Moresby"],
["au","Australia",-25.0,134.0,"outback","Canberra"],
["tl","Timor-Leste",-8.9,125.7,"sea","Dili"],
["id","Indonesia",-2.5,118.0,"sea","Jakarta"],
["bn","Brunei",4.5,114.7,"sea","Bandar Seri Begawan"],
["sg","Singapore",1.35,103.82,"sea","Singapore"],
["my","Malaysia",4.2,102.0,"sea","Kuala Lumpur"],
["mm","Myanmar",21.9,95.9,"sea","Naypyidaw"],
["th","Thailand",15.9,100.9,"sea","Bangkok"],
["la","Laos",19.9,102.5,"sea","Vientiane"],
["vn","Vietnam",16.0,107.8,"sea","Hanoi"],
["kh","Cambodia",12.6,104.9,"sea","Phnom Penh"]];

/* ---------- regional looks: every country gets one, famous ones get their own details on top ---------- */
TK.KITS={
 boreal:{sky:["#6a9ad0","#b0cee8","#eaf2fa"],sun:"#ffffff",fog:"#dde8f4",tint:"rgba(170,200,255,.07)",road:["#dfe7f0","#d2dce8"],verge:["#f4f8fd","#e6eef8"],edge:"#9ab4d6",ground:"snow",scen:["snowpine","bldg","snowpine","cabin","bldg","snowpine","lamppost"],weather:"snow",obs:{block:"snowman",low:"snowlog",high:"icicle"},pal:["#e9f2fb","#8ab4e0","#4a6a90"],outfit:"parka"},
 namer:{sky:["#3a8ee0","#9acaf0","#eaf6ff"],sun:"#fffbe0",fog:"#d8ecf8",tint:"rgba(120,190,255,.04)",road:["#52565e","#4a4e56"],verge:["#6aae48","#5a9e3c"],edge:"#f4f4f4",ground:"asphalt",scen:["bldg","bldg","oak","bldg","barn","bldg","lamppost"],weather:"none",obs:{block:"cart",low:"barrier",high:"gantry"},pal:["#3a6ac8","#d92a2a","#fff"],outfit:"cowboy"},
 latam:{sky:["#2f92e0","#98d0f0","#fff0c8"],sun:"#fff4c0",fog:"#f4e4c0",tint:"rgba(255,190,110,.06)",road:["#a8805a","#9c7650"],verge:["#a8b858","#98a84c"],edge:"#e8d8a8",ground:"dirt",scen:["bldg","adobe","bldg","palm","bldg","church","cactus"],weather:"dust",obs:{block:"cart",low:"stonewall",high:"laundry"},pal:["#2a9a6a","#e8442a","#ffd24a"],outfit:"huipil"},
 trop:{sky:["#2aa8c8","#8fd8c0","#e8f8d0"],sun:"#fff7b8",fog:"#cfe8c4",tint:"rgba(60,160,90,.1)",road:["#8a6a42","#7e603c"],verge:["#2e8a3a","#287a34"],edge:"#5a8a2a",ground:"jungle",scen:["jtree","fern","banana","jtree","fern","jtree"],weather:"leaves",obs:{block:"stump",low:"jlog",high:"vines"},pal:["#2a7a3a","#ffd24a","#e8442a"],outfit:"explorer"},
 island:{sky:["#1c9ae0","#7cd4f0","#e4faff"],sun:"#fffbe0",fog:"#d8f2f4",tint:"rgba(80,200,230,.06)",road:["#e8d8a8","#dccb98"],verge:["#4ac070","#3cb062"],edge:"#fff4d0",ground:"sand",scen:["palm","palm","hut","sailboat","palm","reed"],weather:"leaves",obs:{block:"stump",low:"bamboo",high:"vines"},pal:["#18a8d8","#ffd24a","#ff7a5a"],outfit:"islander"},
 andes:{sky:["#3a7ad0","#98c0ea","#f0f4fa"],sun:"#ffffff",fog:"#e4eaf4",tint:"rgba(150,170,230,.07)",road:["#9a8a78","#8e7e6c"],verge:["#a8a468","#98945a"],edge:"#e8d8b8",ground:"dirt",scen:["llama","boulder","adobe","boulder","llama","fir"],weather:"none",obs:{block:"stump",low:"stonewall",high:"lintel"},pal:["#c8442a","#ffd24a","#2a8ae8"],outfit:"poncho"},
 pampas:{sky:["#3a8ee0","#a8d4f0","#f4fbff"],sun:"#fff8d0",fog:"#e4f0e4",tint:"rgba(160,210,120,.05)",road:["#a08a64","#947e5a"],verge:["#a0c050","#90b044"],edge:"#e8dcb8",ground:"dirt",scen:["oak","reed","windmill","oak","reed","barn"],weather:"none",obs:{block:"cart",low:"stonewall",high:"gantry"},pal:["#3a6ac8","#fff","#8a5a2a"],outfit:"gaucho"},
 savanna:{sky:["#3a98e0","#f4d49a","#ffeec8"],sun:"#fff0b8",fog:"#f4dcaa",tint:"rgba(255,190,100,.08)",road:["#b8864a","#ac7c42"],verge:["#c8b060","#b8a052"],edge:"#e8d098",ground:"dirt",scen:["acacia","baobab","acacia","hut","rock","acacia"],weather:"dust",obs:{block:"stump",low:"stonewall",high:"vines"},pal:["#e8a010","#2a9a4a","#c8302a"],outfit:"dashiki"},
 desert:{sky:["#4aa8e8","#f2d49a","#ffe9b8"],sun:"#fff0b8",fog:"#f1d8a4",tint:"rgba(255,200,100,.08)",road:["#d9b878","#cfae6e"],verge:["#e8c888","#dcbc7a"],edge:"#b8923c",ground:"sand",scen:["bldg","palmdate","bldg","minaret","mosque","bldg","rock"],weather:"dust",obs:{block:"glyph",low:"stonewall",high:"lintel"},pal:["#c8a050","#ffd24a","#4a7ac8"],outfit:"thobe"},
 med:{sky:["#2a8ae0","#8ec8f0","#f4f8ff"],sun:"#fff6d0",fog:"#e8f0f4",tint:"rgba(255,220,160,.05)",road:["#a89c88","#9c907c"],verge:["#8ab050","#7aa044"],edge:"#f0e8d8",ground:"stone",scen:["bldg","cypress","bldg","bldg","church","sailboat","bldg"],weather:"none",obs:{block:"cart",low:"barrier",high:"laundry"},pal:["#2a6ab0","#f6f0e4","#c8503a"],outfit:"fisher"},
 euro:{sky:["#4a8ad8","#a8c8ec","#eef4fc"],sun:"#fffbe8",fog:"#e0eaf0",tint:"rgba(150,190,230,.05)",road:["#585c66","#50545e"],verge:["#5aa44a","#4c943e"],edge:"#f0f0f0",ground:"asphalt",scen:["bldg","bldg","oak","bldg","church","bldg","lamppost","windmill"],weather:"none",obs:{block:"cart",low:"barrier",high:"laundry"},pal:["#2a5aa8","#d8302a","#f4f0e0"],outfit:"folk"},
 alps:{sky:["#2a80d8","#90c4f0","#eef6ff"],sun:"#ffffff",fog:"#e4eef8",tint:"rgba(160,200,255,.05)",road:["#6a6e76","#62666e"],verge:["#5eae4a","#50a040"],edge:"#f4f4f4",ground:"asphalt",scen:["bldg","snowpine","bldg","cabin","bldg","snowpine","church"],weather:"none",obs:{block:"cart",low:"barrier",high:"icicle"},pal:["#d8302a","#f4f0e0","#2a6a3a"],outfit:"dirndl"},
 steppe:{sky:["#3a86d8","#a0c8ec","#f4f0dc"],sun:"#fff8d8",fog:"#ece8d4",tint:"rgba(200,200,140,.06)",road:["#a89a70","#9c8e66"],verge:["#a8b45a","#98a44e"],edge:"#e8dcb0",ground:"dirt",scen:["yurt","boulder","reed","yurt","boulder","rock"],weather:"dust",obs:{block:"stump",low:"stonewall",high:"lintel"},pal:["#2a6ab0","#c8301a","#ffd24a"],outfit:"deel"},
 india:{sky:["#e8883a","#ffc27a","#fff0c8"],sun:"#fff4c0",fog:"#f8dcb0",tint:"rgba(255,160,80,.08)",road:["#b8946a","#ac8860"],verge:["#8ab848","#7aa83c"],edge:"#f0d8a0",ground:"dirt",scen:["bldg","temple","bldg","palm","bldg","tuktuk","banana"],weather:"petals",obs:{block:"cyclo",low:"bamboo",high:"laundry"},pal:["#e8a010","#d92a5a","#2a8a8a"],outfit:"sari"},
 east:{sky:["#e8423a","#ff9a5a","#ffe0a0"],sun:"#fff3b0",fog:"#f7d3b0",tint:"rgba(255,120,80,.06)",road:["#8a8a94","#7e7e88"],verge:["#c9a35a","#b8924a"],edge:"#c42a22",ground:"stone",scen:["bldg","pagoda","bldg","cherry","lantern","bldg","bamboo"],weather:"petals",obs:{block:"lion",low:"rope",high:"paifang"},pal:["#d93a2e","#ffd24a","#7a2418"],outfit:"hanfu"},
 sea:{sky:["#ff9ab8","#ffd28f","#fff1c8"],sun:"#fff4c2",fog:"#fbe6c4",tint:"rgba(255,180,120,.06)",road:["#b48e5c","#a98456"],verge:["#6fc64a","#5fb63c"],edge:"#e8c880",ground:"dirt",scen:["bldg","palm","bldg","hut","banana","bldg","nonla"],weather:"petals",obs:{block:"cyclo",low:"bamboo",high:"vines"},pal:["#e8b82a","#d92a2a","#2a7a3a"],outfit:"batik"},
 pacific:{sky:["#2a9ae0","#90d0f0","#eaf8ff"],sun:"#fffbe0",fog:"#d8ecf4",tint:"rgba(90,200,220,.06)",road:["#7a6a58","#6e5e4c"],verge:["#4aa850","#3c9844"],edge:"#e8e0c8",ground:"dirt",scen:["kiwi","fern","oak","kiwi","fern","reed"],weather:"leaves",obs:{block:"stump",low:"jlog",high:"vines"},pal:["#1c1c1c","#f4f4f4","#2aa86a"],outfit:"maori"},
 outback:{sky:["#2a8ae0","#f0c88a","#ffe6b8"],sun:"#fff0b8",fog:"#f6d8a8",tint:"rgba(255,160,80,.09)",road:["#c8744a","#bc6a42"],verge:["#d8944a","#c88640"],edge:"#f0c898",ground:"dirt",scen:["boulder","acacia","rock","reed","acacia","cactus"],weather:"dust",obs:{block:"stump",low:"stonewall",high:"vines"},pal:["#d8683a","#2a6ad8","#ffd24a"],outfit:"akubra"}
};

/* traditional clothing: [label, skin, hair-style, top colors, bottom colors, extras] */
var SK={a:"#f2c9a8",b:"#e8b890",c:"#d9a070",d:"#c28458",e:"#9a6a44",f:"#6e4630"};
function ot(nm,skin,hair,hcol,o){var b={nm:nm,btype:"pants",blen:0,tlen:17,skin:SK[skin],hair:hcol,style:hair,top:["#3a6ac8","#23488e"],trim:"#ffd24a",pattern:"none",long:false,bottom:["#2a3a5a","#1a2540"],bpat:"none",sleeve:"long",shoe:["#6a4a2a","#3e2a14"],acc:"none"};for(var k in o)b[k]=o[k];return b}
var O=TK.OUTFITS;
O.parka=ot("Red parka & toque","a","none","#4a3020",{top:["#d92a2a","#8a1a18"],trim:"#f4f4f4",pattern:"fur",tlen:22,acc:"chullo",accc:"#f4f4f4",bottom:["#2a3a5a","#1a2540"]});
O.cowboy=ot("Denim jacket & cowboy hat","b","short","#5a3a20",{top:["#4a7ad0","#2a4a98"],trim:"#f4f4f4",tlen:18,bottom:["#2a4a8a","#1a3066"],shoe:["#8a5a2a","#5a3a14"],acc:"cowboy",accc:"#b0803a"});
O.huipil=ot("Embroidered huipil","d","long","#1a1210",{btype:"skirt",blen:24,tlen:12,top:["#f6f0e4","#d8cfb8"],trim:"#e8442a",pattern:"floral",bottom:["#2a6ab8","#1a468a"],bpat:"gold",sleeve:"short",acc:"flower"});
O.explorer=ot("Rainforest explorer kit","c","pony","#2a1a12",{btype:"shorts",top:["#7ab84a","#4a8a2a"],trim:"#f4e8b0",tlen:14,bottom:["#a88a4a","#7a6430"],sleeve:"short",acc:"cap",accc:"#4a8a2a"});
O.islander=ot("Island shirt & flower lei","d","long","#1a1210",{btype:"shorts",top:["#ff8a3a","#d8541a"],trim:"#ffe066",pattern:"floral",tlen:14,bottom:["#2a9ad8","#1a6aa8"],sleeve:"short",shoe:["#f4d8a8","#c49a5a"],acc:"flower"});
O.poncho=ot("Poncho & woolly chullo","d","pony","#1a1210",{top:["#c8442a","#8a2a18"],trim:"#ffd24a",pattern:"gold",tlen:24,sleeve:"wide",bottom:["#3a3a5a","#242440"],acc:"chullo",accc:"#2a8ae8"});
O.gaucho=ot("Gaucho beret & bombachas","b","short","#2a1a12",{top:["#f6f0e4","#d4cbb4"],trim:"#c8301a",tlen:20,bottom:["#8a8a6a","#66664a"],shoe:["#3a2418","#22140c"],acc:"beret",accc:"#1c1c1c"});
O.dashiki=ot("Dashiki shirt & kufi cap","e","none","#1a1210",{top:["#e8a010","#b87008"],trim:"#2a9a4a",pattern:"gold",tlen:20,bottom:["#2a8a4a","#1a6030"],sleeve:"wide",acc:"cap",accc:"#c8301a"});
O.thobe=ot("White thobe & ghutra","c","none","#1a1210",{top:["#f6f1e4","#d8cfb8"],trim:"#c8a050",tlen:34,long:true,bottom:["#f6f1e4","#d8cfb8"],sleeve:"long",shoe:["#8a5a2a","#5a3a14"],acc:"headscarf"});
O.fisher=ot("Sailor stripes & cap","b","short","#3a2418",{top:["#f4f4f4","#cfd4dc"],trim:"#2a4a98",pattern:"none",tlen:16,bottom:["#2a3a5a","#1a2540"],sleeve:"3/4",acc:"cap",accc:"#2a4a98"});
O.folk=ot("Folk vest & feathered cap","a","short","#6a4a2a",{top:["#f4f0e0","#d0c8b0"],trim:"#c8302a",pattern:"floral",tlen:18,bottom:["#3a5a8a","#24406a"],sleeve:"long",shoe:["#5a3a20","#38240e"],acc:"cap",accc:"#3a6a3a"});
O.dirndl=ot("Dirndl & alpine hat","a","long","#c89a50",{btype:"skirt",blen:26,tlen:10,top:["#f8f4ec","#d8d0c0"],trim:"#c8302a",pattern:"floral",bottom:["#2a6ab8","#1a468a"],bpat:"none",sleeve:"short",shoe:["#5a3a20","#38240e"],acc:"cowboy",accc:"#3a6a3a"});
O.deel=ot("Deel coat & pointed hat","c","none","#1a1210",{top:["#2a6ab8","#1a468a"],trim:"#ffd24a",pattern:"gold",tlen:34,long:true,bottom:["#2a3a5a","#1a2540"],sleeve:"long",shoe:["#3a2418","#22140c"],acc:"cap",accc:"#c8301a"});
O.sari=ot("Silk sari","d","buns","#120c08",{btype:"skirt",blen:32,tlen:12,top:["#e8a010","#c07808"],trim:"#f4f4f4",pattern:"gold",bottom:["#d92a5a","#a01a40"],bpat:"gold",sleeve:"short",shoe:["#e8c25a","#a8861a"],acc:"flower"});
O.batik=ot("Batik & songkok cap","c","pony","#1a1210",{btype:"skirt",blen:22,tlen:8,top:["#2a9a8a","#1a6a60"],trim:"#ffd24a",pattern:"floral",bottom:["#8a2a5a","#5a1a3a"],bpat:"batik",sleeve:"3/4",shoe:["#f4d8a8","#c49a5a"],acc:"cap",accc:"#1c1c1c"});
O.maori=ot("Korowai feather cloak","d","none","#1a1210",{btype:"skirt",blen:20,tlen:20,top:["#4a3220","#2a1a10"],trim:"#2aa86a",pattern:"fur",bottom:["#8a6a3a","#5a4222"],sleeve:"none",shoe:["#f4d8a8","#c49a5a"],acc:"beads"});
O.akubra=ot("Outback oilskin & Akubra","b","short","#6a4a2a",{top:["#b8a070","#8a7448"],trim:"#f4f0e0",tlen:22,bottom:["#5a4a30","#3a2e1c"],shoe:["#5a3a20","#38240e"],acc:"cowboy",accc:"#a8782a"});
O.kimono=ot("Kimono & obi sash","a","buns","#17100c",{btype:"skirt",blen:30,tlen:30,top:["#e8708a","#b84a68"],trim:"#f4f4f4",pattern:"floral",long:true,bottom:["#e8708a","#b84a68"],sleeve:"wide",shoe:["#f4efe4","#c4b898"],acc:"sakura"});
O.hanbok=ot("Hanbok","a","pony","#17100c",{btype:"skirt",blen:30,tlen:12,top:["#f2d84a","#c8a818"],trim:"#d92a5a",pattern:"none",bottom:["#d92a8a","#9a1a60"],sleeve:"wide",shoe:["#f4efe4","#c4b898"],acc:"pins"});
O.thai=ot("Thai silk dress","c","bun","#17100c",{btype:"skirt",blen:28,tlen:10,top:["#c42a6a","#8a1a48"],trim:"#ffd24a",pattern:"gold",bottom:["#2a8a9a","#1a5a68"],bpat:"gold",sleeve:"short",shoe:["#e8c25a","#a8861a"],acc:"pins"});
O.longyi=ot("Longyi & thanaka","c","pony","#17100c",{btype:"skirt",blen:28,tlen:10,top:["#f4f0e8","#d0c8b8"],trim:"#c42a2a",bottom:["#2a5aa8","#1a3a78"],bpat:"gold",sleeve:"3/4",shoe:["#e8c25a","#a8861a"],acc:"flower"});
O.sinh=ot("Lao sinh skirt","c","bun","#17100c",{btype:"skirt",blen:28,tlen:10,top:["#f4f0e8","#d0c8b8"],trim:"#c42a2a",bottom:["#c42a2a","#8a1818"],bpat:"gold",sleeve:"short",shoe:["#e8c25a","#a8861a"],acc:"flower"});
O.barong=ot("Barong tagalog","c","short","#17100c",{top:["#f6ecd0","#d8c8a0"],trim:"#c8a050",pattern:"gold",tlen:18,bottom:["#2a2a2a","#14141a"],sleeve:"long",shoe:["#3a2418","#22140c"],acc:"none"});
O.maasai=ot("Maasai shuka & beads","f","none","#120c08",{btype:"skirt",blen:24,tlen:20,top:["#d82a2a","#9a1818"],trim:"#2a6ad8",pattern:"floral",bottom:["#d82a2a","#9a1818"],bpat:"none",sleeve:"none",shoe:["#8a6a3a","#5a4222"],acc:"beads"});
O.habesha=ot("Habesha white dress","e","buns","#120c08",{btype:"skirt",blen:34,tlen:20,top:["#faf6ee","#d8d0c0"],trim:"#2a9a4a",pattern:"gold",bottom:["#faf6ee","#d8d0c0"],bpat:"gold",sleeve:"long",shoe:["#8a5a2a","#5a3a14"],acc:"headscarf"});
O.kente=ot("Kente cloth","f","none","#120c08",{btype:"skirt",blen:24,tlen:26,top:["#e8a010","#2a8a3a"],trim:"#c8302a",pattern:"gold",bottom:["#2a8a3a","#c8302a"],bpat:"gold",sleeve:"none",shoe:["#8a6a3a","#5a4222"],acc:"cap",accc:"#e8a010"});
O.tuareg=ot("Indigo turban & robe","d","none","#1a1210",{top:["#2a4a9a","#18306a"],trim:"#c8a050",tlen:34,long:true,bottom:["#2a4a9a","#18306a"],sleeve:"wide",shoe:["#8a5a2a","#5a3a14"],acc:"turban",accc:"#2a4a9a"});
O.djellaba=ot("Djellaba & red fez","c","none","#1a1210",{top:["#3a8ab8","#1f5a82"],trim:"#ffd24a",tlen:34,long:true,bottom:["#3a8ab8","#1f5a82"],sleeve:"wide",shoe:["#e8c25a","#a8861a"],acc:"fez",accc:"#c8201a"});
O.evzone=ot("Greek fustanella","b","short","#2a1a12",{btype:"skirt",blen:14,tlen:16,top:["#f6f0e4","#d4cbb4"],trim:"#2a5aa8",bottom:["#f6f0e4","#d4cbb4"],bpat:"none",sleeve:"wide",shoe:["#c8201a","#8a1010"],acc:"fez",accc:"#c8201a"});
O.flamenco=ot("Flamenco dress","b","bun","#1a1210",{btype:"skirt",blen:30,tlen:14,top:["#d8201a","#9a1010"],trim:"#f4f4f4",pattern:"floral",bottom:["#d8201a","#9a1010"],bpat:"none",sleeve:"3/4",shoe:["#1c1c1c","#0a0a0a"],acc:"flower"});
O.breton=ot("Breton stripes & beret","a","short","#3a2418",{top:["#f4f4f4","#2a4a98"],trim:"#2a4a98",tlen:16,bottom:["#2a3a5a","#1a2540"],sleeve:"3/4",acc:"beret",accc:"#c8201a"});
O.tartan=ot("Tartan kilt & tam","a","short","#c8602a",{btype:"skirt",blen:14,tlen:16,top:["#2a3a5a","#1a2540"],trim:"#c8a050",bottom:["#c8302a","#8a1810"],bpat:"none",sleeve:"long",shoe:["#3a2418","#22140c"],acc:"beret",accc:"#2a5a3a"});
O.irish=ot("Aran jumper & flat cap","a","short","#c85a2a",{top:["#f2ead4","#d4c8a8"],trim:"#2a8a3a",tlen:20,bottom:["#4a3a2a","#2a2018"],acc:"cap",accc:"#3a3a3a"});
O.bunad=ot("Norwegian bunad","a","long","#d8b068",{btype:"skirt",blen:30,tlen:12,top:["#f8f4ec","#d8d0c0"],trim:"#d8a020",pattern:"floral",bottom:["#c8201a","#8a1010"],bpat:"gold",sleeve:"long",shoe:["#3a2418","#22140c"],acc:"pins"});
O.sami=ot("Sámi gákti","a","none","#8a6a3a",{top:["#2a6ad8","#1a3a98"],trim:"#e8442a",pattern:"gold",tlen:22,sleeve:"wide",bottom:["#2a3a5a","#1a2540"],shoe:["#8a5a2a","#5a3a14"],acc:"chullo",accc:"#c8201a"});
O.swede=ot("Folk dress & flower crown","a","long","#e8c878",{btype:"skirt",blen:26,tlen:12,top:["#f8f4ec","#d8d0c0"],trim:"#2a6ad8",bottom:["#2a6ad8","#1a3a98"],bpat:"none",sleeve:"short",shoe:["#3a2418","#22140c"],acc:"flower"});
O.fez=ot("Fez & embroidered vest","c","none","#1a1210",{top:["#f6f0e4","#d4cbb4"],trim:"#c8201a",pattern:"gold",tlen:18,bottom:["#2a5a8a","#1a3a60"],acc:"fez",accc:"#c8201a"});
O.shalwar=ot("Shalwar kameez & cap","c","none","#1a1210",{top:["#4a8a6a","#2a5a44"],trim:"#ffd24a",tlen:26,long:true,bottom:["#4a8a6a","#2a5a44"],sleeve:"long",shoe:["#c8a050","#8a6a2a"],acc:"cap",accc:"#f4f0e0"});
O.chokha=ot("Georgian chokha","b","short","#1a1210",{top:["#2a2a32","#14141a"],trim:"#c8a050",tlen:30,long:true,bottom:["#2a2a32","#14141a"],sleeve:"wide",shoe:["#1c1c1c","#0a0a0a"],acc:"cap",accc:"#2a2a32"});
O.gho=ot("Bhutanese gho","c","short","#1a1210",{top:["#c8201a","#8a1010"],trim:"#f4f4f4",pattern:"gold",tlen:20,sleeve:"wide",bottom:["#c8201a","#8a1010"],shoe:["#3a2418","#22140c"],acc:"none"});
O.dhaka=ot("Daura suruwal & topi","c","short","#1a1210",{top:["#f4f0e8","#d0c8b8"],trim:"#c8201a",tlen:22,bottom:["#f4f0e8","#d0c8b8"],acc:"cap",accc:"#d8a030"});
O.lava=ot("Island sulu wrap","d","long","#1a1210",{btype:"skirt",blen:26,tlen:8,top:["#f4f0e8","#d0c8b8"],trim:"#2a9ad8",pattern:"floral",bottom:["#c8201a","#8a1010"],bpat:"none",sleeve:"short",shoe:["#f4d8a8","#c49a5a"],acc:"flower"});
O.sarong=ot("Sarong & shell necklace","e","long","#120c08",{btype:"skirt",blen:26,tlen:8,top:["#2a9ad8","#1a68a0"],trim:"#f4f4f4",pattern:"floral",bottom:["#2aa86a","#1a7a48"],bpat:"batik",sleeve:"short",shoe:["#f4d8a8","#c49a5a"],acc:"beads"});
O.yankee=O.cowboy;
O.ukr=ot("Vyshyvanka & flower wreath","a","long","#c89a50",{btype:"skirt",blen:26,tlen:12,top:["#f8f4ec","#d8d0c0"],trim:"#c8201a",pattern:"floral",bottom:["#2a5aa8","#1a3a78"],bpat:"none",sleeve:"long",shoe:["#c8201a","#8a1010"],acc:"flower"});
O.magyar=ot("Folk vest & ribbon hat","a","short","#3a2418",{top:["#f4f0e0","#d0c8b0"],trim:"#c8201a",pattern:"floral",tlen:20,bottom:["#2a2a32","#14141a"],shoe:["#3a2418","#22140c"],acc:"cap",accc:"#2a2a32"});
O.dutch=ot("Dutch clogs & bonnet","a","long","#e8c878",{btype:"skirt",blen:24,tlen:10,top:["#2a6ad8","#1a3a98"],trim:"#f4f4f4",bottom:["#f4f4f4","#cfd4dc"],bpat:"none",sleeve:"short",shoe:["#e8a030","#b87810"],acc:"cap",accc:"#f4f4f4"});

var OUT={ca:"parka",us:"cowboy",mx:"huipil",cr:"explorer",jm:"islander",cu:"fisher",ve:"explorer",co:"poncho",ec:"poncho",pe:"poncho",bo:"poncho",cl:"poncho",ar:"gaucho",uy:"gaucho",py:"gaucho",sn:"dashiki",gm:"dashiki",gw:"dashiki",gn:"dashiki",sl:"dashiki",lr:"dashiki",ci:"kente",gh:"kente",tg:"kente",bj:"dashiki",ng:"dashiki",ke:"maasai",tz:"maasai",ug:"dashiki",rw:"dashiki",bi:"dashiki",et:"habesha",er:"habesha",ml:"tuareg",ne:"tuareg",td:"tuareg",mr:"tuareg",ma:"djellaba",dz:"djellaba",tn:"djellaba",ly:"thobe",so:"maasai",dj:"thobe",ss:"dashiki",sd:"thobe",il:"thobe",ps:"thobe",lb:"fez",tr:"fez",cy:"evzone",gr:"evzone",al:"fez",me:"fez",ba:"fez",rs:"folk",hr:"folk",si:"dirndl",mk:"folk",bg:"folk",ro:"folk",md:"ukr",ua:"ukr",by:"ukr",pl:"folk",lt:"folk",lv:"folk",ee:"folk",hu:"magyar",cz:"folk",sk:"folk",at:"dirndl",de:"dirndl",ch:"dirndl",li:"dirndl",fr:"breton",es:"flamenco",pt:"fisher",it:"fisher",ie:"irish",gb:"tartan",nl:"dutch",be:"dutch",dk:"folk",no:"bunad",se:"swede",fi:"sami",is:"parka",ge:"chokha",am:"fez",az:"fez",ir:"fez",kz:"deel",uz:"deel",tm:"deel",tj:"deel",kg:"deel",mn:"deel",af:"shalwar",pk:"shalwar",in:"sari",bd:"sari",lk:"sari",mv:"sarong",np:"dhaka",bt:"gho",kr:"hanbok",kp:"hanbok",jp:"kimono",ph:"barong",th:"thai",mm:"longyi",la:"sinh",id:"batik",my:"batik",bn:"batik",tl:"batik",pg:"sarong",fj:"lava",ws:"lava",to:"lava",tv:"lava",ki:"lava",nr:"lava",mh:"lava",fm:"lava",pw:"lava",vu:"sarong",sb:"sarong",nz:"maori",au:"akubra"};

/* what each famous place is known for (shown on the level card; everything else says its capital) */
var LM={ca:"Rockies · Maple leaf · Moose",us:"Statue of Liberty · Grand Canyon",mx:"Pyramids of the Maya · Tacos",gt:"Tikal Maya temples",cu:"Old cars · Havana streets",jm:"Reggae · Blue Mountains",br:"Amazon Rainforest · Christ the Redeemer",pe:"Machu Picchu · Llamas",ar:"Tango · Patagonia",cl:"Atacama Desert · Easter Island",co:"Coffee fields · Cartagena",eg:"Pyramids of Giza · Sphinx · Desert",ma:"Blue medina · Sahara gates",ke:"Safari · Maasai Mara",za:"Table Mountain · Safari",tz:"Kilimanjaro · Serengeti",et:"Highlands · Coffee homeland",ng:"Nollywood · Rich cultures",gh:"Kente cloth · Gold Coast",mg:"Lemurs · Baobab Alley",sa:"Desert sands · Holy cities",ae:"Dubai skyline · Falcons",il:"Old Jerusalem · Dead Sea",jo:"Petra rose-red city",ir:"Persepolis · Persian gardens",tr:"Cappadocia balloons · Hagia Sophia",gr:"Acropolis · Blue-and-white islands",it:"Colosseum · Venice canals · Pizza",fr:"Eiffel Tower · Croissants · Lavender",es:"Flamenco · Sagrada Família",pt:"Lisbon trams · Blue tiles",gb:"Big Ben · Red buses · Castles",ie:"Green hills · Castles · Clovers",is:"Geysers · Northern lights",no:"Fjords · Vikings",se:"Midsummer · Wooden houses",fi:"Lapland · Northern lights",dk:"Colourful harbour · Little Mermaid",nl:"Windmills · Tulips · Bicycles",be:"Chocolate · Medieval squares",de:"Castles · Black Forest · Pretzels",ch:"Alps · Chocolate · Cowbells",at:"Alps · Music · Castles",cz:"Prague towers · Castles",pl:"Old Town squares · Bison forest",hu:"Danube · Thermal baths",ua:"Golden domes · Sunflower fields",ru:"Red Square domes · Snowy forest",kz:"Endless steppe · Eagle hunters",mn:"Gers · Wild horses · Steppe",in:"Taj Mahal · Colourful festivals",np:"Mount Everest · Prayer flags",bt:"Tiger's Nest monastery",lk:"Tea hills · Elephants",cn:"Great Wall · Panda · Dragon",jp:"Mount Fuji · Cherry blossoms · Temples",kr:"Palaces · K-pop · Hanbok",ph:"Beaches · 7,000 islands",th:"Golden temples · Tuk-tuks · Elephants",vn:"Ha Long Bay · Conical hats · Rice fields",la:"Mekong river · Golden stupas",mm:"Bagan temples · Golden pagodas",id:"Bali · Volcanoes · Komodo dragons",my:"Petronas Towers · Rainforest",sg:"Merlion · Marina Bay · Supertrees",au:"Uluru · Kangaroos · Outback",nz:"Fjords · Hobbit hills · Kiwi birds",fj:"Coral lagoons · Friendly smiles",kh:"Angkor Wat · Bayon · Apsara"};

/* little true facts */
var FACT={ca:"Canada has more lakes than the rest of the world put together.",us:"The Statue of Liberty was a gift from France.",mx:"Chocolate and chilli both come from Mexico's region.",br:"The Amazon makes about 20% of the world's oxygen.",pe:"Machu Picchu was built by the Inca about 600 years ago.",eg:"The Great Pyramid was the tallest building for 3,800 years.",ke:"Every year over a million wildebeest cross the Mara river.",ma:"Chefchaouen's blue walls keep homes cool.",gr:"The first Olympic Games were held in Greece.",it:"Venice is built on more than 100 small islands.",fr:"France makes over 1,000 kinds of cheese.",es:"Spain's flamenco is a UNESCO treasure.",gb:"Big Ben is really the bell, not the tower.",no:"Norway's fjords were carved by glaciers.",fi:"Finland has about 188,000 lakes.",nl:"A quarter of the Netherlands is below sea level.",de:"Germany has over 20,000 castles.",ch:"Switzerland has more than 1,500 lakes.",ru:"Russia is so big it has 11 time zones.",in:"The Taj Mahal took about 20 years to build.",jp:"Japan has over 6,800 islands.",kr:"Hanbok means Korean clothes.",cn:"The Great Wall is more than 21,000 km long!",th:"Thailand's old name, Siam, means 'land of the free'.",vn:"The conical hat is called nón lá, made from palm leaves.",id:"Indonesia has more than 17,000 islands.",sg:"The Merlion has a lion's head and a fish's body!",au:"Uluru glows red at sunrise and sunset.",nz:"New Zealand has more sheep than people.",kh:"Angkor Wat is the largest religious monument in the world.",np:"Mount Everest is the highest mountain on Earth.",tr:"Hot-air balloons float over Cappadocia every morning.",is:"Iceland has no mosquitoes at all.",mn:"Mongolia has about 3 million people and many more horses.",mg:"Most of Madagascar's animals live nowhere else.",za:"South Africa has three capital cities.",tz:"Kilimanjaro is Africa's tallest mountain.",et:"Coffee was first discovered in Ethiopia.",jo:"Petra is called the Rose City.",ae:"Dubai's Burj Khalifa is the tallest building in the world.",ar:"Argentina is the birthplace of the tango.",cl:"Chile is over 4,000 km long but very narrow.",cu:"Havana is famous for its colourful classic cars.",ph:"The Philippines has more than 7,000 islands.",mm:"Bagan has thousands of old temples.",la:"Laos is called the Land of a Million Elephants."};

/* difficulty: easy / medium / hard in a wave, but climbing steadily (like Candy Crush) */
var WAVE=[0,0,1,0,1,0,1,1,0,2,1,1,0,2,1,2];
function tierFor(i,n){var p=i/(n-1),w=WAVE[i%WAVE.length];if(p<.12)return w>1?1:(w);if(p>.95)return 2;var t=w+(p>.72?1:0);return Math.min(2,t)}
var TIER={0:{nm:"EASY",v0:10.5,v1:16.5,len:1800,dd:.1},1:{nm:"MEDIUM",v0:12.5,v1:19.5,len:2400,dd:.5},2:{nm:"HARD",v0:14.5,v1:23,len:3000,dd:.95}};


var CHS={ca:"polar",us:"bear",mx:"jaguar",gt:"jaguar",bz:"jaguar",sv:"dog",hn:"puma",ni:"jaguar",cr:"jaguar",pa:"jaguar",cu:"bull",jm:"dog",do:"dog",ve:"jaguar",co:"jaguar",ec:"puma",pe:"puma",bo:"puma",cl:"puma",ar:"puma",uy:"bull",py:"jaguar",br:"jaguar",sr:"jaguar",gy:"jaguar",
 sn:"lion",gm:"lion",ng:"lion",gh:"lion",ci:"elephant",cm:"lion",ga:"elephant",cd:"elephant",ao:"lion",na:"lion",bw:"elephant",za:"lion",zw:"lion",zm:"lion",mw:"lion",tz:"lion",ke:"lion",ug:"lion",rw:"lion",et:"lion",so:"lion",sd:"lion",td:"lion",ne:"jackal",ml:"jackal",ma:"lion",dz:"jackal",tn:"lion",ly:"jackal",eg:"jackal",mg:"dog",
 il:"lion",jo:"jackal",sa:"jackal",ae:"jackal",ir:"lion",tr:"wolf",gr:"wolf",it:"wolf",es:"bull",pt:"bull",fr:"wolf",gb:"lion",ie:"wolf",is:"polar",no:"polar",se:"bear",fi:"bear",dk:"wolf",nl:"lion",be:"lion",de:"bear",ch:"bear",at:"bear",pl:"bear",cz:"lion",hu:"wolf",ro:"wolf",bg:"lion",rs:"wolf",hr:"wolf",ua:"wolf",by:"bear",ru:"bear",
 kz:"wolf",mn:"wolf",uz:"wolf",kg:"wolf",tj:"wolf",tm:"wolf",af:"wolf",pk:"wolf",in:"tiger",bd:"tiger",lk:"elephant",np:"tiger",bt:"tiger",cn:"panda",kr:"tiger",kp:"tiger",jp:"bear",ph:"dog",id:"tiger",my:"tiger",sg:"lion",th:"elephant",la:"elephant",vn:"tiger",kh:"tiger",mm:"elephant",au:"kangaroo",nz:"dog",pg:"dog",fj:"dog"};
var CHK={boreal:"bear",namer:"bear",latam:"jaguar",trop:"jaguar",island:"dog",andes:"puma",pampas:"puma",savanna:"lion",desert:"jackal",med:"wolf",euro:"wolf",alps:"bear",steppe:"wolf",india:"tiger",east:"tiger",sea:"tiger",pacific:"dog",outback:"kangaroo"};
function build(){
 var FE={};TK.FEATURED.forEach(function(f){FE[f.id]=f});
 var n=TK.ROUTE.length;
 TK.LEVELS=TK.ROUTE.map(function(r,i){
  var id=r[0],kit=TK.KITS[r[4]],fe=FE[id],t=tierFor(i,n);if(id==="kh")t=2;
  var T=TIER[t],L={};
  for(var k in kit)L[k]=kit[k];
  if(fe)for(var k2 in fe)L[k2]=fe[k2];
  L.id=id;L.n=r[1].toUpperCase();L.lat=r[2];L.lon=r[3];L.cap=r[5];L.flag=id;L.kit=r[4];L.hz=fe&&fe.hz?fe.hz:r[4];
  L.km=(fe&&fe.km)||"";
  L.outfit=(fe&&fe.outfit)||OUT[id]||kit.outfit;
  L.lm=(fe&&fe.lm)||LM[id]||("Capital: "+r[5]);
  L.fact=(fe&&fe.fact)||FACT[id]||("The capital of "+r[1]+" is "+r[5]+".");
  L.chaser=CHS[id]||CHK[r[4]]||"dog";L.tier=t;L.tn=T.nm;L.dd=T.dd;L.len=T.len+(id==="kh"?500:0);L.v0=T.v0;L.v1=T.v1+(id==="kh"?1.5:0);
  return L});
}
build();
})(window.TK=window.TK||{});
