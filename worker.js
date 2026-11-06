// A&J Kampot Boutique — Guest Mini App (Cloudflare Worker)
// One file: serves the app page AND forwards guest forms to the staff Telegram group.
// Settings (Cloudflare → Worker → Settings → Variables and Secrets):
//   BOT_TOKEN     = token from @BotFather            (type: Secret)
//   STAFF_CHAT_ID = staff Telegram group id, e.g. -1001234567890
//   PRE           = KV namespace binding — keeps early check-ins for the A&J Hub check-in form
//   ANTHROPIC_API_KEY = Claude API key (Secret) — AI receptionist answers guests on Telegram

const HTML = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover\">\n<title>A&J Kampot Boutique</title>\n<script src=\"https://telegram.org/js/telegram-web-app.js\"></script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js\"></script>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link href=\"https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">\n<style>\n:root{--navy:#14254a;--navy2:#1f3a73;--ink:#1b1f2a;--mute:#6b7280;--line:#e6e8ee;--bg:#f6f7fa;--ok:#15803d;--bad:#b91c1c}\n*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}\nhtml,body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,\"Kantumruy Pro\",system-ui,sans-serif;font-size:15px}\nbody.km{font-family:\"Kantumruy Pro\",Inter,system-ui,sans-serif}\nheader{background:#fff;border-bottom:1px solid var(--line);padding:12px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:5}\nheader img{height:34px}\nheader .t{flex:1;line-height:1.15}\nheader .t b{display:block;font-size:15px;color:var(--navy)}\nheader .t span{font-size:12px;color:var(--mute)}\n.lang{border:1px solid var(--line);background:#fff;border-radius:20px;padding:6px 10px;font-size:13px;font-weight:600;color:var(--navy);cursor:pointer}\nmain{padding:16px;padding-bottom:90px;max-width:560px;margin:0 auto}\n.page{display:none}.page.on{display:block}\nh2{font-size:19px;margin:4px 0 4px;color:var(--navy)}\n.sub{color:var(--mute);font-size:13px;margin:0 0 14px}\n.hero{background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border-radius:16px;padding:18px;margin-bottom:14px}\n.hero b{font-size:18px;display:block;margin-bottom:4px}\n.hero p{margin:0;font-size:13px;opacity:.85}\n.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.tile{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;cursor:pointer;text-align:left;font:inherit;color:inherit}\n.tile .i{font-size:26px}\n.tile b{display:block;margin-top:6px;font-size:14px;color:var(--navy)}\n.tile span{font-size:12px;color:var(--mute)}\n.card{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-bottom:12px}\n.pics{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}\n.pics::-webkit-scrollbar{display:none}\n.pics img{width:100%;flex:0 0 100%;height:200px;object-fit:cover;scroll-snap-align:start;background:#e5e7eb}\n.cb{padding:12px 14px}\n.cb .row{display:flex;justify-content:space-between;align-items:baseline}\n.cb h3{margin:0;font-size:16px}\n.price{font-weight:700;color:var(--navy);font-size:18px}\n.price s{color:var(--mute);font-weight:400;font-size:13px;margin-right:4px}\n.meta{font-size:13px;color:var(--mute);margin:4px 0 10px}\n.btn{display:block;width:100%;border:0;border-radius:12px;padding:13px;font:inherit;font-weight:600;font-size:15px;cursor:pointer;text-align:center;text-decoration:none}\n.btn.p{background:var(--navy);color:#fff}\n.btn.s{background:#fff;color:var(--navy);border:1.5px solid var(--navy)}\n.btn+.btn{margin-top:8px}\n.btn:disabled{opacity:.5}\n.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}\nlabel{display:block;font-size:13px;font-weight:600;margin:12px 0 5px}\ninput,select,textarea{width:100%;border:1px solid #d5d9e2;border-radius:10px;padding:11px;font:inherit;background:#fff;color:var(--ink)}\ntextarea{min-height:70px;resize:vertical}\n.note{background:#fff7e6;border:1px solid #f5d38a;border-radius:10px;padding:10px 12px;font-size:13px;margin:10px 0}\n.items{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.item{background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:10px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:13px;user-select:none}\n.item.on{border-color:var(--navy);background:#eef2fb}\n.item .e{font-size:20px}\n.photos{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}\n.photos .ph{width:76px;height:76px;border-radius:10px;overflow:hidden;position:relative;border:1px solid var(--line)}\n.photos .ph img{width:100%;height:100%;object-fit:cover}\n.photos .ph b{position:absolute;top:2px;right:2px;background:#000a;color:#fff;border-radius:50%;width:20px;height:20px;font-size:12px;display:grid;place-items:center;cursor:pointer}\n.addph{width:76px;height:76px;border:1.5px dashed #aab;border-radius:10px;display:grid;place-items:center;font-size:28px;color:var(--navy);cursor:pointer;background:#fff}\n.list{background:#fff;border:1px solid var(--line);border-radius:14px}\n.list .li{display:flex;gap:12px;padding:12px 14px;border-bottom:1px solid var(--line);align-items:center;text-decoration:none;color:inherit}\n.list .li:last-child{border:0}\n.list .li .e{font-size:22px;width:28px;text-align:center}\n.list .li b{display:block;font-size:14px}\n.list .li span{font-size:12px;color:var(--mute)}\nnav{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--line);display:flex;padding:6px 4px calc(6px + env(safe-area-inset-bottom));z-index:6}\nnav button{flex:1;border:0;background:none;font:inherit;font-size:11px;color:var(--mute);padding:4px 0;cursor:pointer}\nnav button .e{display:block;font-size:20px;filter:grayscale(1);opacity:.6}\nnav button.on{color:var(--navy);font-weight:600}\nnav button.on .e{filter:none;opacity:1}\n.toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;display:none;z-index:9;max-width:90%;text-align:center}\n.done{text-align:center;padding:30px 10px}\n.done .e{font-size:54px}\n.req{color:var(--bad)}\n.en{display:block;font-size:.8em;font-weight:500;opacity:.72;line-height:1.25}\n.btn .en{opacity:.8}\nnav .en{font-size:9px}\n.item .en{font-size:11px}\nh2 .en{font-size:13px;font-weight:600}\n.stay{background:#fff;border:1px solid var(--line);border-radius:14px;padding:4px 12px 12px;margin-bottom:12px}\n.stay .three{display:grid;grid-template-columns:1fr 1fr 90px;gap:8px}\n.stay label{margin-top:8px}\n.tot{font-size:13px;color:var(--mute);margin:-4px 0 10px}\n.tot b{color:var(--ink)}\n.modal{position:fixed;inset:0;background:#0008;z-index:20;display:none;align-items:flex-end;justify-content:center}\n.modal.on{display:flex}\n.sheet{background:#fff;width:100%;max-width:560px;border-radius:18px 18px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));max-height:92vh;overflow:auto}\n.sheet h3{margin:0 0 8px;color:var(--navy)}\n.sum{background:var(--bg);border-radius:10px;padding:10px 12px;font-size:14px}\n.sum div{display:flex;justify-content:space-between;padding:3px 0}\n.code{border:1.5px dashed var(--navy);border-radius:12px;padding:10px 12px;margin:12px 0;display:flex;align-items:center;justify-content:space-between}\n.code b{font-size:20px;letter-spacing:1px;font-family:ui-monospace,monospace}\n.code button{background:var(--navy);color:#fff;border:0;border-radius:8px;padding:8px 12px;font:inherit;font-weight:600;cursor:pointer}\nol.steps{padding-left:18px;font-size:13px;margin:8px 0 14px}\n.qrbox{text-align:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;margin:10px 0}\n.qrbox .bank{font-weight:700;color:#0b4a8b}\n.qrbox #qr img,.qrbox #qr svg{width:220px;height:220px}\n.qrbox .amt{font-size:20px;font-weight:700;color:var(--navy);margin-top:6px}\n</style>\n</head>\n<body>\n<header>\n  <img src=\"https://0d57110f.aj-booking.pages.dev/logo-navy.png\" alt=\"A&J\">\n  <div class=\"t\"><b>A&J Kampot Boutique</b><span data-t=\"tagline\"></span></div>\n  <button class=\"lang\" id=\"langBtn\">ខ្មែរ</button>\n</header>\n\n<main>\n<!-- HOME -->\n<section class=\"page on\" id=\"p-home\">\n  <div class=\"hero\"><b id=\"hello\"></b><p data-t=\"heroP\"></p></div>\n  <div class=\"grid\">\n    <button class=\"tile\" data-go=\"rooms\"><div class=\"i\">🛏️</div><b data-t=\"tRooms\"></b><span data-t=\"tRoomsS\"></span></button>\n    <button class=\"tile\" data-go=\"checkin\"><div class=\"i\">📝</div><b data-t=\"tCheck\"></b><span data-t=\"tCheckS\"></span></button>\n    <button class=\"tile\" data-go=\"request\"><div class=\"i\">🧺</div><b data-t=\"tReq\"></b><span data-t=\"tReqS\"></span></button>\n    <button class=\"tile\" data-go=\"info\"><div class=\"i\">💬</div><b data-t=\"tInfo\"></b><span data-t=\"tInfoS\"></span></button>\n  </div>\n</section>\n\n<!-- ROOMS -->\n<section class=\"page\" id=\"p-rooms\">\n  <h2 data-t=\"tRooms\"></h2>\n  <p class=\"sub\" data-t=\"roomsSub\"></p>\n  <div class=\"stay\">\n    <div class=\"three\">\n      <div><label data-t=\"fCin\"></label><input type=\"date\" id=\"cin\"></div>\n      <div><label data-t=\"fCout\"></label><input type=\"date\" id=\"cout\"></div>\n      <div><label data-t=\"fGuests\"></label><input type=\"number\" id=\"gst\" min=\"1\" max=\"8\" value=\"2\"></div>\n    </div>\n  </div>\n  <div id=\"roomList\"></div>\n</section>\n\n<!-- CHECK-IN -->\n<section class=\"page\" id=\"p-checkin\">\n  <h2 data-t=\"tCheck\"></h2>\n  <p class=\"sub\" data-t=\"checkSub\"></p>\n  <div class=\"note\" data-t=\"docRule\"></div>\n  <div class=\"note\" data-t=\"mateRule\"></div>\n  <form id=\"fCheck\">\n    <label><span data-t=\"fName\"></span> <span class=\"req\">*</span></label>\n    <input name=\"name\" required>\n    <div class=\"two\">\n      <div><label><span data-t=\"fNat\"></span> <span class=\"req\">*</span></label><input name=\"nationality\" required></div>\n      <div><label><span data-t=\"fPass\"></span> <span class=\"req\">*</span></label><input name=\"passport\" required></div>\n    </div>\n    <div class=\"two\">\n      <div><label><span data-t=\"fPhone\"></span> <span class=\"req\">*</span></label><input name=\"phone\" type=\"tel\" required></div>\n      <div><label data-t=\"fSource\"></label>\n        <select name=\"source\"><option>Direct / Telegram</option><option>WhatsApp</option><option>Facebook Messenger</option><option>Booking.com</option><option>Agoda</option><option>Expedia</option><option>Trip.com</option><option data-t=\"other\">Other</option></select></div>\n    </div>\n    <div class=\"two\">\n      <div><label><span data-t=\"fArr\"></span> <span class=\"req\">*</span></label><input name=\"arrival\" type=\"date\" required></div>\n      <div><label data-t=\"fTime\"></label><input name=\"time\" type=\"time\"></div>\n    </div>\n    <div class=\"two\">\n      <div><label data-t=\"fNights\"></label><input name=\"nights\" type=\"number\" min=\"1\" value=\"1\"></div>\n      <div><label data-t=\"fGuests\"></label><input name=\"guests\" type=\"number\" min=\"1\" value=\"2\"></div>\n    </div>\n    <label data-t=\"fTrans\"></label>\n    <select name=\"transport\"><option data-t=\"trCar\">Car</option><option data-t=\"trMoto\">Motorbike</option><option data-t=\"trTuk\">Tuk-tuk</option><option data-t=\"trBus\">Bus / Van</option><option data-t=\"trTaxi\">Taxi</option><option data-t=\"other\">Other</option></select>\n    <label data-t=\"fOthers\"></label>\n    <textarea name=\"others\" data-tp=\"fOthersP\"></textarea>\n    <label><span data-t=\"fDocs\"></span> <span class=\"req\">*</span></label>\n    <div class=\"photos\" id=\"phCheck\"></div>\n    <label data-t=\"fNote\"></label>\n    <textarea name=\"note\"></textarea>\n    <br><button class=\"btn p\" type=\"submit\" data-t=\"send\"></button>\n  </form>\n</section>\n\n<!-- REQUEST -->\n<section class=\"page\" id=\"p-request\">\n  <h2 data-t=\"tReq\"></h2>\n  <p class=\"sub\" data-t=\"reqSub\"></p>\n  <form id=\"fReq\">\n    <div class=\"two\">\n      <div><label><span data-t=\"fRoom\"></span> <span class=\"req\">*</span></label><input name=\"room\" inputmode=\"numeric\" required placeholder=\"203\"></div>\n      <div><label data-t=\"fName\"></label><input name=\"name\"></div>\n    </div>\n    <label data-t=\"borrow\"></label>\n    <div class=\"items\" id=\"itBorrow\"></div>\n    <label data-t=\"buy\"></label>\n    <div class=\"items\" id=\"itBuy\"></div>\n    <label data-t=\"problem\"></label>\n    <div class=\"items\" id=\"itProb\"></div>\n    <label data-t=\"fNote\"></label>\n    <textarea name=\"note\" data-tp=\"reqNoteP\"></textarea>\n    <label data-t=\"fPhotoOpt\"></label>\n    <div class=\"photos\" id=\"phReq\"></div>\n    <br><button class=\"btn p\" type=\"submit\" data-t=\"send\"></button>\n  </form>\n</section>\n\n<!-- INFO / CONTACT -->\n<section class=\"page\" id=\"p-info\">\n  <h2 data-t=\"tInfo\"></h2>\n  <p class=\"sub\" data-t=\"infoSub\"></p>\n  <div class=\"list\">\n    <a class=\"li\" href=\"https://t.me/+85587882020\" target=\"_blank\"><div class=\"e\">✈️</div><div><b>Telegram</b><span>+855 87 882 020</span></div></a>\n    <a class=\"li\" href=\"https://wa.me/85587882020\" target=\"_blank\"><div class=\"e\">🟢</div><div><b>WhatsApp</b><span>+855 87 882 020</span></div></a>\n    <a class=\"li\" href=\"https://m.me/148357296114503\" target=\"_blank\"><div class=\"e\">💙</div><div><b>Messenger</b><span>A&J Kampot Boutique</span></div></a>\n    <a class=\"li\" href=\"tel:+85587882020\"><div class=\"e\">📞</div><div><b data-t=\"call\"></b><span data-t=\"call24\"></span></div></a>\n  </div>\n  <br>\n  <div class=\"list\">\n    <a class=\"li\" href=\"https://www.google.com/maps/search/?api=1&query=A%26J+Kampot+Boutique%2C+Street+%23724%2C+Krang+Village%2C+Krang+Ampil%2C+Kampot%2C+Cambodia\" target=\"_blank\"><div class=\"e\">📍</div><div><b data-t=\"map\"></b><span data-t=\"mapS\"></span></div></a>\n    <div class=\"li\"><div class=\"e\">🕑</div><div><b data-t=\"ciTitle\"></b><span data-t=\"ciS\"></span></div></div>\n    <div class=\"li\"><div class=\"e\">🏊</div><div><b data-t=\"pool\"></b><span>7:30 – 22:00</span></div></div>\n    <div class=\"li\"><div class=\"e\">☕</div><div><b data-t=\"cafe\"></b><span data-t=\"cafeS\"></span></div></div>\n    <div class=\"li\"><div class=\"e\">🚪</div><div><b data-t=\"gate\"></b><span data-t=\"gateS\"></span></div></div>\n    <div class=\"li\"><div class=\"e\">🛵</div><div><b data-t=\"moto\"></b><span data-t=\"motoS\"></span></div></div>\n    <div class=\"li\"><div class=\"e\">🚭</div><div><b data-t=\"smoke\"></b><span data-t=\"smokeS\"></span></div></div>\n  </div>\n</section>\n\n<!-- STAFF BOOKING -->\n<section class=\"page\" id=\"p-staffbook\">\n  <h2 data-t=\"askStaff\"></h2>\n  <p class=\"sub\" data-t=\"sbSub\"></p>\n  <form id=\"fBook\">\n    <label data-t=\"fRoomType\"></label>\n    <select name=\"room\" id=\"sbRoom\"></select>\n    <div class=\"two\">\n      <div><label><span data-t=\"fCin\"></span> <span class=\"req\">*</span></label><input type=\"date\" name=\"cin\" id=\"sbCin\" required></div>\n      <div><label><span data-t=\"fCout\"></span> <span class=\"req\">*</span></label><input type=\"date\" name=\"cout\" id=\"sbCout\" required></div>\n    </div>\n    <div class=\"two\">\n      <div><label data-t=\"fGuests\"></label><input type=\"number\" name=\"guests\" id=\"sbGst\" min=\"1\" value=\"2\"></div>\n      <div><label data-t=\"fTime\"></label><input type=\"time\" name=\"time\"></div>\n    </div>\n    <div class=\"sum\" id=\"sbSum\"></div>\n    <label><span data-t=\"fName\"></span> <span class=\"req\">*</span></label>\n    <input name=\"name\" required>\n    <div class=\"two\">\n      <div><label data-t=\"fNat\"></label><input name=\"country\"></div>\n      <div><label><span data-t=\"fPhone\"></span> <span class=\"req\">*</span></label><input name=\"phone\" type=\"tel\" required></div>\n    </div>\n    <label>Email</label><input name=\"email\" type=\"email\">\n    <label data-t=\"fNote\"></label><textarea name=\"note\"></textarea>\n    <div class=\"qrbox\">\n      <div class=\"bank\">ACLEDA · KHQR</div>\n      <div class=\"sub\" style=\"margin:4px 0 8px\" data-t=\"qrHint\"></div>\n      <div id=\"qr\"></div>\n      <div style=\"font-size:13px;font-weight:600\">A & J Kampot Boutique</div>\n      <div class=\"amt\" id=\"sbDep\"></div>\n    </div>\n    <label><span data-t=\"fReceipt\"></span> <span class=\"req\">*</span></label>\n    <div class=\"photos\" id=\"phBook\"></div>\n    <div class=\"note\" data-t=\"mateRule\"></div>\n    <div class=\"note\" data-t=\"sbHours\"></div>\n    <button class=\"btn p\" type=\"submit\" data-t=\"send\"></button>\n  </form>\n</section>\n\n<!-- DONE -->\n<section class=\"page\" id=\"p-done\">\n  <div class=\"done\"><div class=\"e\">✅</div><h2 data-t=\"thanks\"></h2><p class=\"sub\" id=\"doneMsg\"></p><br><button class=\"btn s\" data-go=\"home\" data-t=\"back\"></button></div>\n</section>\n</main>\n\n<nav>\n  <button data-go=\"home\" class=\"on\"><span class=\"e\">🏠</span><span data-t=\"nHome\"></span></button>\n  <button data-go=\"rooms\"><span class=\"e\">🛏️</span><span data-t=\"nRooms\"></span></button>\n  <button data-go=\"checkin\"><span class=\"e\">📝</span><span data-t=\"nCheck\"></span></button>\n  <button data-go=\"request\"><span class=\"e\">🧺</span><span data-t=\"nReq\"></span></button>\n  <button data-go=\"info\"><span class=\"e\">💬</span><span data-t=\"nInfo\"></span></button>\n</nav>\n<div class=\"toast\" id=\"toast\"></div>\n<div class=\"modal\" id=\"bookModal\"><div class=\"sheet\">\n  <h3 id=\"bmTitle\"></h3>\n  <div class=\"sum\" id=\"bmSum\"></div>\n  <div class=\"code\"><div><div style=\"font-size:11px;color:var(--mute)\" data-t=\"yourCode\"></div><b id=\"bmCode\"></b></div><button type=\"button\" id=\"bmCopy\" data-t=\"copy\"></button></div>\n  <ol class=\"steps\"><li data-t=\"st1\"></li><li data-t=\"st2\"></li><li id=\"bmSt3\"></li></ol>\n  <button class=\"btn p\" id=\"bmGo\" data-t=\"goBook\"></button>\n  <button class=\"btn s\" id=\"bmStaff\" data-t=\"askStaff\"></button>\n  <button class=\"btn\" style=\"background:none;color:var(--mute)\" id=\"bmClose\" data-t=\"close\"></button>\n</div></div>\n\n<script>\nconst API = '/api/send';\nconst NOBEDS = 'https://nobeds.app/DirectForm/Step/b95b08ae-cb76-428d-8401-1394cd8dad44';\nconst KHQR = '00020101021129410009khqr@aclb0114070004703108250206ACLEDA392000118551751447601014520420005802KH53038405921A & J Kampot Boutique6010Phnom Penh621402100885882020630487FD';\nconst TG_CHAT = 'https://t.me/+85587882020';\nconst IMG = 'https://nobeds.app/uploads/';\n\nconst ROOMS = [\n {id:'SR', rid:'2541246', max:2, en:'Superior Room', km:'បន្ទប់ Superior', was:40, price:24, enM:'1 bed (1.6 m) · up to 2 guests', kmM:'គ្រែ 1 (1.6 ម) · ភ្ញៀវ 2 នាក់',\n  pics:['2541246_rentals_6928b091e8b4449a990a56473a234f59','2541246_rentals_cc534b33a7c242ea95d9ac6354067483','2541246_rentals_4d6f2bb903634ee384aa06bcc5f8fd7b','2541246_rentals_82ede7953e784fe29b96e2133c855446','2541246_rentals_9845002f317a4a64bd9b93c57a15eba4']},\n {id:'SRB', rid:'2541247', max:2, en:'Superior Room with Balcony', km:'បន្ទប់ Superior មានវេរ៉ង់ដា', was:65, price:30, enM:'1 bed (1.8 m) · private balcony · up to 2 guests', kmM:'គ្រែ 1 (1.8 ម) · វេរ៉ង់ដាផ្ទាល់ · ភ្ញៀវ 2 នាក់',\n  pics:['2541247_rentals_3949190ecc1945dea3e7f7822aa36c66','2541247_rentals_4bf0b6ca26ca46d9a08332f062e5c1cc','2541247_rentals_6062b6ef342c4bbc8a21c136c1199e06','2541247_rentals_656349ec1b6440a4af0248e8ad06195e','2541247_rentals_48b07ba5c78e411898a58d9a3f7f7ccf']},\n {id:'TA', rid:'2541250', max:2, en:'Twin Room A', km:'បន្ទប់គ្រែពីរ A', was:65, price:32.5, enM:'2 beds (1.2 m) · up to 2 guests', kmM:'គ្រែ 2 (1.2 ម) · ភ្ញៀវ 2 នាក់',\n  pics:['2541250_rentals_607689f355674f27b450af6110daa59e','2541250_rentals_0b17ca3ccedd4b2b9e8804b78a765f5e','2541250_rentals_a6a9e6b1cabb48cd9b5cdacdf995978b','2541250_rentals_211130ef5764462c84b607eb4aea510a','2541250_rentals_d6fad137391e4e2d91de49475d696594','2541250_rentals_adde851fa7c54cb789b05de50736ae00']},\n {id:'TB', rid:'2541251', max:3, en:'Twin Room B', km:'បន្ទប់គ្រែពីរ B', was:75, price:42, enM:'2 beds (1.8 m + 1.2 m) · up to 3 guests', kmM:'គ្រែ 2 (1.8 ម + 1.2 ម) · ភ្ញៀវ 3 នាក់',\n  pics:['2541251_rentals_07826b94aa3d4285bedfc151710ceae1','2541251_rentals_37ad6afd6fdd4892978c853f0f574384','2541251_rentals_55f27ae5d8404c47b5f21e25bc75bd01','2541251_rentals_1a86cf95c7114ae7adca9b999d497d65','2541251_rentals_12b928a913ea462e97ec244aec06c1a3','2541251_rentals_32f0070948de4475bf43cb30f9799bff']},\n {id:'FS', rid:'2541252', max:4, en:'Family Suite', km:'បន្ទប់គ្រួសារ (Family Suite)', was:150, price:94.5, enM:'2 beds (1.6 m) · 2 bathrooms · up to 4 guests', kmM:'គ្រែ 2 (1.6 ម) · បន្ទប់ទឹក 2 · ភ្ញៀវ 4 នាក់',\n  pics:['2541252_rentals_97df1d5a6e43469c94a3e328f06338ed','2541252_rentals_3b7c210b06214d75a5d35a8e7c3fa07f','2541252_rentals_76d2d9f9c01d426a8a97e1c2fa7fc835','2541252_rentals_027507df10b04ebbbb0e25edb83f135c','2541252_rentals_6c68ce77bf6a4f6d89b538b5143c8638','2541252_rentals_051b8b9635354d888ee4f56e338abc59','2541252_rentals_d8dd2df693bb4a2eb6d4ca0e45283600','2541252_rentals_8980811125094f59ba8fefb98248b805']}\n];\n\nconst BORROW = [['🧻','Towel','កន្សែង'],['☂️','Umbrella','ឆ័ត្រ'],['🔌','Phone charger','ខ្សែសាកទូរសព្ទ'],['💨','Hair dryer','ម៉ាស៊ីនផ្លុំសក់'],['👔','Iron','ឆ្នាំងអ៊ុត'],['🛏️','Extra pillow','ខ្នើយបន្ថែម'],['🧣','Extra blanket','ភួយបន្ថែម'],['🧼','Toiletries','សាប៊ូ / ច្រាសធ្មេញ']];\nconst BUY = [['💧','Drinking water','ទឹកសុទ្ធ'],['🥤','Cold drinks','ភេសជ្ជៈត្រជាក់'],['🧺','Laundry service','សេវាបោកអ៊ុត'],['🛵','Rent a motorbike','ជួលម៉ូតូ']];\nconst PROB = [['❄️','A/C not cold','ម៉ាស៊ីនត្រជាក់មិនត្រជាក់'],['🚿','Water / leak','ទឹក / លេចទឹក'],['🧻','No toilet paper','អស់ក្រដាសអនាម័យ'],['📶','Wi‑Fi problem','Wi‑Fi មិនដើរ'],['💡','Light / power','ភ្លើង / អគ្គិសនី'],['🧹','Clean my room','សម្អាតបន្ទប់']];\n\nconst T = {\n en:{tagline:'Kampot · Cambodia',hi:'Welcome',heroP:'Book, check in early, ask for anything — all in one place.',\n  tRooms:'Rooms & booking',tRoomsS:'Photos & direct price',tCheck:'Check in early',tCheckS:'Send your details before arrival',tReq:'Room requests',tReqS:'Borrow items · drinks · fix a problem',tInfo:'Contact & info',tInfoS:'Chat with us · map · hours',\n  roomsSub:'Direct price — cheaper than booking sites. Swipe the photos.',fCin:'Check-in',fCout:'Check-out',nights:'nights',night:'night',total:'Total',depositL:'Deposit (50%)',yourCode:'YOUR DISCOUNT CODE',copy:'Copy',copied:'Code copied',st1:'Your room is already selected — tap Next.',st2:'Fill in your name, country, phone and email.',st3:'Paste the code in “Promo code”, check the total shows {T}, then tap Submit.',goBook:'Copy code & open booking website',close:'Close',sbSub:'Same price. Pay a 50% deposit by QR, upload the receipt — our team books it for you and confirms.',fRoomType:'Room',qrHint:'Scan with ACLEDA, ABA or any KHQR bank app and pay the deposit:',fReceipt:'Payment receipt (screenshot)',sbHours:'Our team books rooms 6:00 AM – 12:00 midnight (Cambodia time). Need it held right now at night? use ① “Book instantly on our website”.',needReceipt:'Please upload your payment receipt.',badDates:'Please choose valid dates.',doneBook:'Thank you! We received your booking request and receipt. Our team will confirm with you soon.',perNight:'/ night',bookNow:'① Book instantly on our website',askStaff:'② Book here — our team arranges it',deposit:'50% deposit holds your room. Same price both ways.',\n  checkSub:'Fill this before you arrive so check-in takes 1 minute. Our staff will finish the rest at reception.',\n  docRule:'🛂 Foreign guests: passport + visa. Cambodian guests: national ID card. Without these documents we cannot check you in.',\n  fName:'Full name (as in passport)',fNat:'Nationality',fPass:'Passport / ID No.',fPhone:'Phone / Telegram / WhatsApp',fSource:'Booked via',fArr:'Arrival date',fTime:'Arrival time',fNights:'Nights',fGuests:'Guests',fTrans:'Coming by',fOthers:'Other guests (name · nationality · passport No.)',fOthersP:'One guest per line',fDocs:'Photos of passport / visa / ID (you and everyone sharing the room)',mateRule:'👥 Sharing the room with a partner or friend? Please bring their passport / ID too — every guest staying in the room must show an ID at check-in.',fNote:'Note',fRoom:'Room No.',fPhotoOpt:'Photo (optional)',\n  trCar:'Car',trMoto:'Motorbike',trTuk:'Tuk-tuk',trBus:'Bus / Van',trTaxi:'Taxi',other:'Other',\n  reqSub:'Tap what you need — our 24‑hour reception gets it right away.',borrow:'Borrow',buy:'Buy / services',problem:'Report a problem',reqNoteP:'Anything else?',\n  send:'Send',sending:'Sending…',thanks:'Sent — thank you!',back:'Back to home',\n  doneCheck:'We received your details. See you soon at A&J Kampot Boutique!',doneReq:'Reception received your request and will come to your room shortly.',\n  needDoc:'Please add at least one photo of your passport / ID.',needItem:'Please choose at least one item or write a note.',fail:'Could not send. Opening Telegram chat instead…',\n  infoSub:'Reception is open 24 hours. Message us any time.',call:'Call reception',call24:'24 hours · +855 87 882 020',map:'Map',mapS:'Kampot town, near the Durian roundabout',ciTitle:'Check-in 14:00 · Check-out 12:00',ciS:'Early arrival? Leave your luggage with us.',pool:'Swimming pool',cafe:'Café corner',cafeS:'8:00 – 17:00 · you may bring outside food',gate:'Front gate closes 1:00 AM',gateS:'Message reception and we open it 24h',moto:'Motorbike rental & laundry',motoS:'Ask at reception or in Room requests',smoke:'No smoking inside',smokeS:'Balcony rooms or outside downstairs',\n  nHome:'Home',nRooms:'Rooms',nCheck:'Check-in',nReq:'Requests',nInfo:'Contact'},\n km:{tagline:'កំពត · កម្ពុជា',hi:'សូមស្វាគមន៍',heroP:'កក់បន្ទប់ Check-in ជាមុន និងស្នើសុំអ្វីក៏បាន — នៅកន្លែងតែមួយ។',\n  tRooms:'បន្ទប់ និងការកក់',tRoomsS:'រូបភាព និងតម្លៃផ្ទាល់',tCheck:'Check-in ជាមុន',tCheckS:'ផ្ញើព័ត៌មានមុនពេលមកដល់',tReq:'សំណើក្នុងបន្ទប់',tReqS:'ខ្ចីរបស់ · ភេសជ្ជៈ · រាយការណ៍បញ្ហា',tInfo:'ទំនាក់ទំនង និងព័ត៌មាន',tInfoS:'ឆាតជាមួយយើង · ផែនទី · ម៉ោង',\n  roomsSub:'តម្លៃផ្ទាល់ — ថោកជាងវេបសាយកក់ផ្សេងៗ។ អូសមើលរូបភាព។',fCin:'ថ្ងៃចូល',fCout:'ថ្ងៃចេញ',nights:'យប់',night:'យប់',total:'សរុប',depositL:'ប្រាក់កក់ (50%)',yourCode:'លេខកូដបញ្ចុះតម្លៃ',copy:'ចម្លង',copied:'បានចម្លងកូដ',st1:'បន្ទប់ត្រូវបានរើសរួចហើយ — ចុច Next។',st2:'បំពេញឈ្មោះ ប្រទេស ទូរសព្ទ និងអ៊ីមែល។',st3:'បិទភ្ជាប់កូដក្នុង “Promo code” ពិនិត្យថាតម្លៃសរុបគឺ {T} រួចចុច Submit។',goBook:'ចម្លងកូដ ហើយបើកវេបសាយកក់',close:'បិទ',sbSub:'តម្លៃដូចគ្នា។ បង់ប្រាក់កក់ 50% តាម QR ហើយ upload វិក្កយបត្រ — បុគ្គលិកនឹងកក់ជូន និងបញ្ជាក់ទៅអ្នក។',fRoomType:'បន្ទប់',qrHint:'ស្កេនដោយ ACLEDA, ABA ឬកម្មវិធីធនាគារ KHQR ណាមួយ ហើយបង់ប្រាក់កក់៖',fReceipt:'វិក្កយបត្របង់ប្រាក់ (រូបថតអេក្រង់)',sbHours:'បុគ្គលិកកក់បន្ទប់ម៉ោង 6:00 ព្រឹក – 12:00 យប់ (ម៉ោងកម្ពុជា)។ បើត្រូវការរក្សាបន្ទប់ភ្លាមនៅពេលយប់ សូមចុច ① “កក់ភ្លាមៗតាមវេបសាយ”។',needReceipt:'សូម upload វិក្កយបត្របង់ប្រាក់។',badDates:'សូមរើសថ្ងៃឱ្យត្រឹមត្រូវ។',doneBook:'អរគុណ! យើងបានទទួលសំណើកក់ និងវិក្កយបត្ររបស់អ្នក។ បុគ្គលិកនឹងបញ្ជាក់ទៅអ្នកឆាប់ៗ។',perNight:'/ យប់',bookNow:'① កក់ភ្លាមៗតាមវេបសាយ',askStaff:'② កក់នៅទីនេះ — បុគ្គលិករៀបចំជូន',deposit:'បង់ប្រាក់កក់ 50% ដើម្បីរក្សាបន្ទប់។ តម្លៃដូចគ្នាទាំងពីរ។',\n  checkSub:'បំពេញមុនពេលមកដល់ ដើម្បីឱ្យ Check-in ត្រឹមតែ 1 នាទី។ បុគ្គលិកនឹងបំពេញបន្ថែមនៅកន្លែងទទួលភ្ញៀវ។',\n  docRule:'🛂 ភ្ញៀវបរទេស៖ លិខិតឆ្លងដែន + ទិដ្ឋាការ។ ភ្ញៀវខ្មែរ៖ អត្តសញ្ញាណប័ណ្ណ។ បើគ្មានឯកសារទាំងនេះ មិនអាច Check-in បានទេ។',\n  fName:'ឈ្មោះពេញ (ដូចក្នុងលិខិតឆ្លងដែន)',fNat:'សញ្ជាតិ',fPass:'លេខលិខិតឆ្លងដែន / អត្តសញ្ញាណប័ណ្ណ',fPhone:'ទូរសព្ទ / Telegram / WhatsApp',fSource:'កក់តាម',fArr:'ថ្ងៃមកដល់',fTime:'ម៉ោងមកដល់',fNights:'ចំនួនយប់',fGuests:'ចំនួនភ្ញៀវ',fTrans:'មកដោយ',fOthers:'ភ្ញៀវផ្សេងទៀត (ឈ្មោះ · សញ្ជាតិ · លេខលិខិត)',fOthersP:'ភ្ញៀវម្នាក់ មួយបន្ទាត់',fDocs:'រូបលិខិតឆ្លងដែន / ទិដ្ឋាការ / អត្តសញ្ញាណប័ណ្ណ (របស់អ្នក និងដៃគូដែលស្នាក់បន្ទប់ជាមួយ)',mateRule:'👥 បើមានដៃគូ ឬមិត្តភក្តិស្នាក់នៅបន្ទប់ជាមួយ សូមត្រៀមអត្តសញ្ញាណប័ណ្ណ ឬលិខិតឆ្លងដែនរបស់ដៃគូមកជាមួយផង — ភ្ញៀវគ្រប់រូបដែលស្នាក់នៅក្នុងបន្ទប់ ត្រូវបង្ហាញអត្តសញ្ញាណពេល Check-in។',fNote:'កំណត់ចំណាំ',fRoom:'លេខបន្ទប់',fPhotoOpt:'រូបភាព (មិនចាំបាច់)',\n  trCar:'ឡាន',trMoto:'ម៉ូតូ',trTuk:'តុកតុក',trBus:'ឡានក្រុង / វ៉ាន់',trTaxi:'តាក់ស៊ី',other:'ផ្សេងៗ',\n  reqSub:'ចុចរើសអ្វីដែលត្រូវការ — កន្លែងទទួលភ្ញៀវ 24 ម៉ោង ទទួលបានភ្លាមៗ។',borrow:'ខ្ចី',buy:'ទិញ / សេវា',problem:'រាយការណ៍បញ្ហា',reqNoteP:'មានអ្វីទៀតទេ?',\n  send:'ផ្ញើ',sending:'កំពុងផ្ញើ…',thanks:'បានផ្ញើរួច — អរគុណ!',back:'ត្រឡប់ទៅទំព័រដើម',\n  doneCheck:'យើងបានទទួលព័ត៌មានរបស់អ្នកហើយ។ ជួបគ្នាឆាប់ៗនៅ A&J Kampot Boutique!',doneReq:'កន្លែងទទួលភ្ញៀវបានទទួលសំណើ ហើយនឹងមកបន្ទប់អ្នកឆាប់ៗ។',\n  needDoc:'សូមបញ្ចូលរូបលិខិតឆ្លងដែន / អត្តសញ្ញាណប័ណ្ណ យ៉ាងហោចណាស់ 1។',needItem:'សូមរើសយ៉ាងហោចណាស់ 1 ឬសរសេរកំណត់ចំណាំ។',fail:'ផ្ញើមិនបាន។ កំពុងបើកឆាត Telegram ជំនួស…',\n  infoSub:'កន្លែងទទួលភ្ញៀវបើក 24 ម៉ោង។ ផ្ញើសារមកបានគ្រប់ពេល។',call:'ទូរសព្ទទៅកន្លែងទទួលភ្ញៀវ',call24:'24 ម៉ោង · +855 87 882 020',map:'ផែនទី',mapS:'ក្នុងក្រុងកំពត ជិតរង្វង់មូលធុរេន',ciTitle:'Check-in 14:00 · Check-out 12:00',ciS:'មកដល់មុន? អាចផ្ញើឥវ៉ាន់ជាមួយយើងបាន។',pool:'អាងហែលទឹក',cafe:'ហាងកាហ្វេ',cafeS:'8:00 – 17:00 · អាចយកម្ហូបពីខាងក្រៅមកញ៉ាំបាន',gate:'ទ្វារធំបិទម៉ោង 1:00 យប់',gateS:'ផ្ញើសារមក យើងបើកឱ្យបាន 24 ម៉ោង',moto:'ជួលម៉ូតូ និងបោកអ៊ុត',motoS:'សួរនៅកន្លែងទទួលភ្ញៀវ ឬក្នុងសំណើក្នុងបន្ទប់',smoke:'ហាមជក់បារីខាងក្នុង',smokeS:'បន្ទប់មានវេរ៉ង់ដា ឬខាងក្រៅជាន់ក្រោម',\n  nHome:'ដើម',nRooms:'បន្ទប់',nCheck:'Check-in',nReq:'សំណើ',nInfo:'ទំនាក់ទំនង'}\n};\n\nconst tg = window.Telegram && Telegram.WebApp;\nconst tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;\nlet lang = 'en';\ntry { lang = localStorage.getItem('aj_lang') || ((tgUser && tgUser.language_code==='km') || (navigator.language||'').startsWith('km') ? 'km' : 'en'); } catch(e){}\nconst qs = s => document.querySelector(s), qsa = s => [...document.querySelectorAll(s)];\nconst t = k => (T[lang][k] ?? T.en[k] ?? k);\nconst esc = x => String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;');\nconst dual = (km, en) => lang==='km' && en && en!==km ? `${esc(km)}<span class=\"en\">${esc(en)}</span>` : esc(lang==='km'?km:en);\nconst tb = k => dual(T.km[k] ?? T.en[k] ?? k, T.en[k] ?? k);   // bilingual HTML\nconst tx = k => (lang==='km' && T.en[k] && T.en[k]!==T.km[k]) ? `${t(k)} / ${T.en[k]}` : t(k); // bilingual plain text\n\nif (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor && tg.setHeaderColor('#ffffff'); } catch(e){} }\n\nfunction applyLang(){\n  document.body.classList.toggle('km', lang==='km');\n  document.documentElement.lang = lang;\n  qs('#langBtn').textContent = lang==='km' ? 'English' : 'ខ្មែរ';\n  qsa('[data-t]').forEach(e => { if (e.tagName==='OPTION') e.textContent = tx(e.dataset.t); else e.innerHTML = tb(e.dataset.t); });\n  qsa('[data-tp]').forEach(e => { e.placeholder = t(e.dataset.tp); });\n  const n = tgUser ? (tgUser.first_name||'') : '';\n  qs('#hello').textContent = tx('hi') + (n ? ', ' + n : '') + ' 👋';\n  renderRooms(); renderItems(); if (qs('#sbRoom').options.length) { fillRoomSelect(); sbCalc(); }\n}\nqs('#langBtn').onclick = () => { lang = lang==='km'?'en':'km'; try{localStorage.setItem('aj_lang',lang)}catch(e){} applyLang(); };\n\nfunction go(p){\n  qsa('.page').forEach(e => e.classList.toggle('on', e.id==='p-'+p));\n  qsa('nav button').forEach(b => b.classList.toggle('on', b.dataset.go===p));\n  window.scrollTo(0,0);\n  if (tg && tg.BackButton) { p==='home' ? tg.BackButton.hide() : tg.BackButton.show(); }\n}\ndocument.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });\nif (tg && tg.BackButton) tg.BackButton.onClick(() => go('home'));\n\nfunction openLink(url){\n  if (tg && tg.openLink && !url.startsWith('https://t.me')) { tg.openLink(url); return; }\n  if (tg && tg.openTelegramLink && url.startsWith('https://t.me')) { tg.openTelegramLink(url); return; }\n  window.open(url, '_blank');\n}\ndocument.addEventListener('click', e => {\n  const a = e.target.closest('a[target=_blank]');\n  if (a && tg) { e.preventDefault(); openLink(a.href); }\n});\n\n// ---- dates ----\nconst iso = d => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);\nconst addDays = (s,n) => { const d = new Date(s+'T00:00:00'); d.setDate(d.getDate()+n); return iso(d); };\nconst nightsOf = (a,b) => Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00'))/86400000);\nconst money = n => '$' + (Math.round(n*100)/100).toFixed(2).replace(/\\.00$/,'');\nconst today = iso(new Date());\nqs('#cin').value = today; qs('#cout').value = addDays(today,1);\nqs('#cin').min = today; qs('#cout').min = addDays(today,1);\nfunction stay(){\n  let a = qs('#cin').value || today, b = qs('#cout').value;\n  if (!b || nightsOf(a,b) < 1) { b = addDays(a,1); qs('#cout').value = b; }\n  qs('#cout').min = addDays(a,1);\n  return { a, b, n: nightsOf(a,b), g: Math.max(1, +qs('#gst').value || 1) };\n}\n['#cin','#cout','#gst'].forEach(id => qs(id).addEventListener('change', renderRooms));\n\nfunction renderRooms(){\n  const st = stay();\n  qs('#roomList').innerHTML = ROOMS.map(r => `\n   <div class=\"card\">\n    <div class=\"pics\">${r.pics.map(p=>`<img loading=\"lazy\" src=\"${IMG+p}.jpg\" alt=\"\">`).join('')}</div>\n    <div class=\"cb\">\n     <div class=\"row\"><h3>${dual(r.km, r.en)}</h3><div class=\"price\"><s>$${r.was}</s>$${r.price}<small style=\"font-size:12px;font-weight:500;color:var(--mute)\"> ${t('perNight')}</small></div></div>\n     <div class=\"meta\">${dual(r.kmM, r.enM)} · ${r.pics.length} 📷</div>\n     <div class=\"tot\">${tx('total')} ${st.n} ${st.n>1?t('nights'):t('night')}: <b>${money(r.price*st.n)}</b> · ${tx('depositL')}: <b>${money(r.price*st.n/2)}</b></div>\n     <button class=\"btn p\" data-book=\"${r.id}\">${tb('bookNow')}</button>\n     <button class=\"btn s\" data-staff=\"${r.id}\">${tb('askStaff')}</button>\n    </div>\n   </div>`).join('') + `<p class=\"sub\">${tb('deposit')}</p>`;\n}\n\n// ---- Book now (instant, Nobeds) ----\nlet cur = null;\nfunction nobedsUrl(r, st){ return `${NOBEDS}?arrdate=${st.a}&depdate=${st.b}&guests=${Math.min(st.g, r.max)}&roomselect=${r.rid}`; }\nfunction openBookModal(id){\n  cur = ROOMS.find(r => r.id===id); const st = stay();\n  qs('#bmTitle').innerHTML = dual(cur.km, cur.en);\n  qs('#bmSum').innerHTML = `<div><span>${t('fCin')} → ${t('fCout')}</span><b>${st.a} → ${st.b}</b></div><div><span>${t('fGuests')}</span><b>${st.g}</b></div><div><span>${t('total')} (${st.n} ${st.n>1?t('nights'):t('night')})</span><b>${money(cur.price*st.n)}</b></div>`;\n  qs('#bmCode').textContent = 'PROMO_' + cur.id;\n  qs('#bmSt3').innerHTML = tb('st3').replace(/\\{T\\}/g, money(cur.price*st.n));\n  qs('#bookModal').classList.add('on');\n}\nasync function copyCode(){\n  const c = qs('#bmCode').textContent;\n  try { await navigator.clipboard.writeText(c); }\n  catch(e){ const ta=document.createElement('textarea'); ta.value=c; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy')}catch(_){} ta.remove(); }\n  toast(tx('copied') + ': ' + c);\n}\nqs('#bmCopy').onclick = copyCode;\nqs('#bmGo').onclick = async () => { await copyCode(); openLink(nobedsUrl(cur, stay())); };\nqs('#bmClose').onclick = () => qs('#bookModal').classList.remove('on');\nqs('#bmStaff').onclick = () => { qs('#bookModal').classList.remove('on'); openStaff(cur.id); };\nqs('#bookModal').addEventListener('click', e => { if (e.target.id==='bookModal') qs('#bookModal').classList.remove('on'); });\n\n// ---- Ask our team (in-app form + KHQR + receipt) ----\nfunction fillRoomSelect(sel){\n  const v = qs('#sbRoom').value;\n  qs('#sbRoom').innerHTML = ROOMS.map(r => `<option value=\"${r.id}\">${lang==='km'?r.km+' / '+r.en:r.en} — $${r.price}${t('perNight')}</option>`).join('');\n  qs('#sbRoom').value = sel || v || 'SR';\n}\nfunction sbCalc(){\n  const r = ROOMS.find(x => x.id===qs('#sbRoom').value) || ROOMS[0];\n  let a = qs('#sbCin').value, b = qs('#sbCout').value;\n  if (a && (!b || nightsOf(a,b) < 1)) { b = addDays(a,1); qs('#sbCout').value = b; }\n  const n = a && b ? nightsOf(a,b) : 0;\n  qs('#sbSum').innerHTML = `<div><span>${n} ${n>1?t('nights'):t('night')} × $${r.price}</span><b>${money(r.price*n)}</b></div><div><span>${tx('depositL')}</span><b>${money(r.price*n/2)}</b></div>`;\n  qs('#sbDep').textContent = n ? money(r.price*n/2) : '';\n  return { r, a, b, n };\n}\n['#sbRoom','#sbCin','#sbCout'].forEach(id => qs(id).addEventListener('change', sbCalc));\nfunction openStaff(id){\n  const st = stay();\n  fillRoomSelect(id);\n  qs('#sbCin').value = st.a; qs('#sbCout').value = st.b; qs('#sbGst').value = st.g;\n  qs('#sbCin').min = today;\n  sbCalc(); go('staffbook');\n}\nfunction drawQR(){\n  try { const q = qrcode(0,'M'); q.addData(KHQR); q.make(); qs('#qr').innerHTML = q.createSvgTag({cellSize:4, margin:2, scalable:true}); }\n  catch(e){ qs('#qr').textContent = 'KHQR'; }\n}\ndocument.addEventListener('click', e => {\n  const bk = e.target.closest('[data-book]'), sf = e.target.closest('[data-staff]');\n  if (bk) openBookModal(bk.dataset.book);\n  if (sf) openStaff(sf.dataset.staff);\n});\n\nfunction renderItems(){\n  const mk = (el, arr) => { const keep = new Set(qsa('#'+el+' .item.on').map(x=>x.dataset.v));\n    qs('#'+el).innerHTML = arr.map(a => `<div class=\"item${keep.has(a[1])?' on':''}\" data-v=\"${a[1]}\"><span class=\"e\">${a[0]}</span><span>${dual(a[2], a[1])}</span></div>`).join(''); };\n  mk('itBorrow', BORROW); mk('itBuy', BUY); mk('itProb', PROB);\n}\ndocument.addEventListener('click', e => { const it = e.target.closest('.item'); if (it) it.classList.toggle('on'); });\n\n// ---- photos (compressed in browser) ----\nconst photoSets = { phCheck: [], phReq: [], phBook: [] };\nfunction initPhotos(id, max){\n  const box = qs('#'+id);\n  const input = document.createElement('input'); input.type='file'; input.accept='image/*'; input.multiple=true; input.style.display='none';\n  document.body.appendChild(input);\n  const draw = () => {\n    box.innerHTML = photoSets[id].map((p,i)=>`<div class=\"ph\"><img src=\"${p.url}\"><b data-del=\"${id}:${i}\">✕</b></div>`).join('') +\n      (photoSets[id].length < max ? `<div class=\"addph\" data-add=\"${id}\">＋</div>` : '');\n  };\n  box.addEventListener('click', e => {\n    if (e.target.dataset.add) input.click();\n    if (e.target.dataset.del) { photoSets[id].splice(+e.target.dataset.del.split(':')[1],1); draw(); }\n  });\n  input.onchange = async () => {\n    for (const f of [...input.files].slice(0, max - photoSets[id].length)) {\n      try { const blob = await shrink(f); photoSets[id].push({blob, url: URL.createObjectURL(blob)}); } catch(e){}\n    }\n    input.value=''; draw();\n  };\n  draw();\n}\nfunction shrink(file){\n  return new Promise((res, rej) => {\n    const img = new Image(); img.onload = () => {\n      const m = 1600, s = Math.min(1, m/Math.max(img.width, img.height));\n      const c = document.createElement('canvas'); c.width = Math.round(img.width*s); c.height = Math.round(img.height*s);\n      c.getContext('2d').drawImage(img,0,0,c.width,c.height);\n      c.toBlob(b => b ? res(b) : rej(), 'image/jpeg', 0.82);\n    }; img.onerror = rej; img.src = URL.createObjectURL(file);\n  });\n}\ninitPhotos('phCheck', 8); initPhotos('phReq', 3);\n\nfunction toast(m){ const el=qs('#toast'); el.textContent=m; el.style.display='block'; clearTimeout(toast.t); toast.t=setTimeout(()=>el.style.display='none',3500); }\n\nasync function send(kind, text, photos, btn, doneKey, data){\n  btn.disabled = true; const old = btn.innerHTML; btn.textContent = tx('sending');\n  try {\n    const fd = new FormData();\n    fd.append('kind', kind); fd.append('text', text);\n    if (data) fd.append('data', JSON.stringify(data));\n    if (tg && tg.initData) fd.append('initData', tg.initData);\n    photos.forEach((p,i) => fd.append('photo'+i, p.blob, 'photo'+i+'.jpg'));\n    const r = await fetch(API, { method:'POST', body: fd });\n    const j = await r.json().catch(()=>({}));\n    if (!r.ok || !j.ok) throw new Error(j.error || r.status);\n    qs('#doneMsg').innerHTML = tb(doneKey); go('done');\n    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');\n    return true;\n  } catch(err) {\n    toast(tx('fail'));\n    setTimeout(()=> openLink(TG_CHAT), 1200);\n    return false;\n  } finally { btn.disabled = false; btn.innerHTML = old; }\n}\nconst who = () => tgUser ? `\\nTelegram: ${tgUser.first_name||''} ${tgUser.last_name||''}${tgUser.username?' @'+tgUser.username:''} (id ${tgUser.id})` : '';\n\nqs('#fCheck').onsubmit = async e => {\n  e.preventDefault();\n  if (!photoSets.phCheck.length) { toast(tx('needDoc')); return; }\n  const d = Object.fromEntries(new FormData(e.target));\n  const txt = `📝 EARLY CHECK-IN\\n` +\n   `Name: ${d.name}\\nNationality: ${d.nationality}\\nPassport/ID: ${d.passport}\\nPhone: ${d.phone}\\nBooked via: ${d.source}\\n` +\n   `Arrival: ${d.arrival} ${d.time||''}\\nNights: ${d.nights} · Guests: ${d.guests}\\nComing by: ${d.transport}` +\n   (d.others ? `\\nOther guests:\\n${d.others}` : '') + (d.note ? `\\nNote: ${d.note}` : '') + who();\n  const data = Object.assign({}, d, tgUser ? { tg: { id: tgUser.id, name: ((tgUser.first_name||'')+' '+(tgUser.last_name||'')).trim(), username: tgUser.username||'' } } : {});\n  if (await send('checkin', txt, photoSets.phCheck, e.target.querySelector('button[type=submit]'), 'doneCheck', data)) {\n    e.target.reset(); photoSets.phCheck.length = 0; initPhotos('phCheck', 8);\n  }\n};\nqs('#fReq').onsubmit = async e => {\n  e.preventDefault();\n  const d = Object.fromEntries(new FormData(e.target));\n  const pick = id => qsa('#'+id+' .item.on').map(x=>x.dataset.v);\n  const b = pick('itBorrow'), y = pick('itBuy'), p = pick('itProb');\n  if (!b.length && !y.length && !p.length && !d.note) { toast(tx('needItem')); return; }\n  const txt = `🧺 ROOM ${d.room} REQUEST` + (d.name ? ` — ${d.name}` : '') +\n   (b.length ? `\\nBorrow: ${b.join(', ')}` : '') + (y.length ? `\\nBuy/Service: ${y.join(', ')}` : '') +\n   (p.length ? `\\n⚠️ Problem: ${p.join(', ')}` : '') + (d.note ? `\\nNote: ${d.note}` : '') + who();\n  if (await send('request', txt, photoSets.phReq, e.target.querySelector('button[type=submit]'), 'doneReq')) {\n    e.target.reset(); qsa('.item.on').forEach(x=>x.classList.remove('on')); photoSets.phReq.length = 0; initPhotos('phReq', 3);\n  }\n};\n\ninitPhotos('phBook', 2);\nqs('#fBook').onsubmit = async e => {\n  e.preventDefault();\n  const c = sbCalc();\n  if (!c.n || c.n < 1) { toast(tx('badDates')); return; }\n  if (!photoSets.phBook.length) { toast(tx('needReceipt')); return; }\n  const d = Object.fromEntries(new FormData(e.target));\n  const txt = `🛏️ BOOKING REQUEST (book for guest)\\nRoom: ${c.r.en}\\nDates: ${c.a} → ${c.b} (${c.n} night${c.n>1?'s':''})\\nGuests: ${d.guests}` + (d.time?`\\nArrival time: ${d.time}`:'') +\n   `\\nTotal: ${money(c.r.price*c.n)} · Deposit 50%: ${money(c.r.price*c.n/2)} (receipt attached)\\nName: ${d.name}\\nCountry: ${d.country||'-'}\\nPhone: ${d.phone}\\nEmail: ${d.email||'-'}` + (d.note?`\\nNote: ${d.note}`:'') + who();\n  if (await send('booking', txt, photoSets.phBook, e.target.querySelector('button[type=submit]'), 'doneBook')) {\n    e.target.reset(); photoSets.phBook.length = 0; initPhotos('phBook', 2);\n  }\n};\n\n// Remember room number for in-house guests\ntry { const rm = localStorage.getItem('aj_room'); if (rm) qs('#fReq [name=room]').value = rm;\n  qs('#fReq [name=room]').addEventListener('change', e => localStorage.setItem('aj_room', e.target.value)); } catch(e){}\n// Deep links: ?page=request&room=203  (for QR codes in each room)\nconst q = new URLSearchParams(location.search);\nconst sp = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || q.get('page');\nif (q.get('room')) qs('#fReq [name=room]').value = q.get('room');\nif (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param && /^room\\d+$/.test(sp)) { qs('#fReq [name=room]').value = sp.slice(4); }\nconst startPage = sp && /^room\\d+$/.test(sp) ? 'request' : sp;\n\ndrawQR();\napplyLang();\nif (startPage && qs('#p-'+startPage)) go(startPage);\n</script>\n</body>\n</html>\n";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/tg/webhook' && request.method === 'POST') return handleTg(request, env, ctx);
    if (url.pathname === '/api/tgsetup') return tgSetup(env, url.origin);

    if (url.pathname === '/api/send' && request.method === 'POST') {
      return handleSend(request, env);
    }
    if (url.pathname.startsWith('/api/pc/')) {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
      return withCors(await handlePre(url, request, env));
    }
    // Helper: open /api/chatid after adding the bot to the staff group and writing any message there
    if (url.pathname === '/api/chatid') {
      if (!env.BOT_TOKEN) return json({ ok: false, error: 'BOT_TOKEN not set' }, 500);
      const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/getUpdates`);
      const j = await r.json();
      const chats = {};
      (j.result || []).forEach(u => {
        const c = (u.message || u.my_chat_member || u.channel_post || {}).chat;
        if (c) chats[c.id] = c.title || c.username || c.first_name;
      });
      return json({ ok: true, chats });
    }
    return new Response(HTML, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' }
    });
  }
};

async function handleSend(request, env) {
  if (!env.BOT_TOKEN || !env.STAFF_CHAT_ID) return json({ ok: false, error: 'not configured' }, 500);
  let form;
  try { form = await request.formData(); } catch { return json({ ok: false, error: 'bad form' }, 400); }

  const kind = String(form.get('kind') || '');
  if (!['checkin', 'request', 'booking'].includes(kind)) return json({ ok: false, error: 'bad kind' }, 400);
  let text = String(form.get('text') || '').slice(0, 3500);
  if (!text.trim()) return json({ ok: false, error: 'empty' }, 400);

  // If opened inside Telegram, check the signature so the name shown is real
  const initData = form.get('initData');
  if (initData) {
    const valid = await checkInitData(String(initData), env.BOT_TOKEN);
    text += valid ? '\n✔️ Telegram verified' : '\n⚠️ Telegram not verified';
  } else {
    text += '\n🌐 Sent from web link (WhatsApp / Messenger / browser)';
  }

  const photos = [];
  for (const [k, v] of form.entries()) {
    if (k.startsWith('photo') && v && typeof v === 'object' && v.size > 0 && v.size < 8_000_000) photos.push(v);
    if (photos.length >= 8) break;
  }

  // Early check-in → keep it (with ID photos) for the A&J Hub check-in form
  if (kind === 'checkin' && env.PRE) {
    try { await savePre(env, form, photos); } catch (e) { text += '\n⚠️ Not saved for Hub: ' + String(e && e.message || e).slice(0, 80); }
  }

  const api = `https://api.telegram.org/bot${env.BOT_TOKEN}`;
  const m = await fetch(`${api}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.STAFF_CHAT_ID, text })
  });
  const mj = await m.json();
  if (!mj.ok) return json({ ok: false, error: mj.description }, 502);

  if (photos.length) {
    const fd = new FormData();
    fd.append('chat_id', env.STAFF_CHAT_ID);
    fd.append('reply_to_message_id', String(mj.result.message_id));
    const media = photos.map((p, i) => {
      fd.append('f' + i, p, 'photo' + i + '.jpg');
      return { type: 'photo', media: 'attach://f' + i };
    });
    if (photos.length === 1) {
      fd.append('photo', photos[0], 'photo.jpg');
      const r = await (await fetch(`${api}/sendPhoto`, { method: 'POST', body: fd })).json();
      if (!r.ok) return json({ ok: false, error: r.description }, 502);
    } else {
      fd.append('media', JSON.stringify(media));
      const r = await (await fetch(`${api}/sendMediaGroup`, { method: 'POST', body: fd })).json();
      if (!r.ok) return json({ ok: false, error: r.description }, 502);
    }
  }
  return json({ ok: true });
}

async function checkInitData(initData, botToken) {
  try {
    const p = new URLSearchParams(initData);
    const hash = p.get('hash'); p.delete('hash');
    const dcs = [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');
    const enc = new TextEncoder();
    const k1 = await crypto.subtle.importKey('raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const secret = await crypto.subtle.sign('HMAC', k1, enc.encode(botToken));
    const k2 = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', k2, enc.encode(dcs));
    const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === hash;
  } catch { return false; }
}

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
}

// ---------- Early check-ins for the A&J Hub ----------
const HUB = 'https://managementaj18-netizen.github.io/aj-hub/';
const TTL = 60 * 60 * 24 * 45; // keep 45 days
function cors() {
  return { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' };
}
function withCors(res) { const h = new Headers(res.headers); Object.entries(cors()).forEach(([k, v]) => h.set(k, v)); return new Response(res.body, { status: res.status, headers: h }); }
function b64(buf) {
  const a = new Uint8Array(buf); let s = '';
  for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
  return btoa(s);
}
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
async function savePre(env, form, photos) {
  let d = {};
  try { d = JSON.parse(String(form.get('data') || '{}')); } catch {}
  const data = {};
  ['name', 'nationality', 'passport', 'phone', 'source', 'arrival', 'time', 'nights', 'guests', 'transport', 'others', 'note'].forEach(k => data[k] = clip(d[k], 600));
  if (d.tg) data.tg = { id: clip(d.tg.id, 20), name: clip(d.tg.name, 80), username: clip(d.tg.username, 40) };
  const pics = [];
  for (const p of photos.slice(0, 8)) pics.push('data:image/jpeg;base64,' + b64(await p.arrayBuffer()));
  const at = Date.now();
  const id = 'pc:' + at + '-' + Math.random().toString(36).slice(2, 8);
  const meta = { name: data.name, nat: data.nationality, arrival: data.arrival, guests: data.guests, n: pics.length, at, used: 0 };
  await env.PRE.put(id, JSON.stringify({ id, at, data, photos: pics }), { metadata: meta, expirationTtl: TTL });
}
async function hubKey(env) { return await env.PRE.get('cfg:hubkey'); }
async function handlePre(url, request, env) {
  if (!env.PRE) return json({ ok: false, error: 'PRE not set' }, 500);
  const what = url.pathname.slice('/api/pc/'.length);
  if (what === 'setup') {
    // Sends the one-time Hub tablet link to the staff Telegram group (the key is never shown on a web page)
    let k = await hubKey(env);
    if (!k) { const a = new Uint8Array(18); crypto.getRandomValues(a); k = [...a].map(b => b.toString(16).padStart(2, '0')).join(''); await env.PRE.put('cfg:hubkey', k); }
    const last = +(await env.PRE.get('cfg:setupsent') || 0);
    if (Date.now() - last < 60000) return json({ ok: true, sent: false, wait: true });
    await env.PRE.put('cfg:setupsent', String(Date.now()));
    const link = HUB + '?pckey=' + k + '#f/checkin';
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.STAFF_CHAT_ID, text: '🔗 A&J Hub ⇄ Guest App\nបើក link នេះម្ដងគត់ នៅលើ tablet / ទូរសព្ទ ដែលប្រើ form Check-in ដើម្បីឃើញភ្ញៀវដែល Check-in ជាមុន។\nOpen once on each Hub tablet:\n' + link + '\n\n(សូមលុបសារនេះក្រោយបើករួច · Delete this message after use)' })
    });
    return json({ ok: true, sent: true });
  }
  const k = await hubKey(env);
  if (!k || url.searchParams.get('key') !== k) return json({ ok: false, error: 'Bad key' }, 403);
  if (what === 'list') {
    const out = []; let cursor;
    do {
      const r = await env.PRE.list({ prefix: 'pc:', cursor });
      r.keys.forEach(x => out.push(Object.assign({ id: x.name }, x.metadata || {})));
      cursor = r.list_complete ? null : r.cursor;
    } while (cursor);
    out.sort((a, b) => String(a.arrival || '').localeCompare(String(b.arrival || '')) || (a.at - b.at));
    return json({ ok: true, list: out });
  }
  const id = url.searchParams.get('id') || '';
  if (!/^pc:\d+-[a-z0-9]+$/.test(id)) return json({ ok: false, error: 'bad id' }, 400);
  const v = await env.PRE.getWithMetadata(id);
  if (!v.value) return json({ ok: false, error: 'not found' }, 404);
  if (what === 'get') return new Response(v.value, { headers: { 'content-type': 'application/json' } });
  if (what === 'used' && request.method === 'POST') {
    const meta = Object.assign({}, v.metadata || {}, { used: Date.now() });
    await env.PRE.put(id, v.value, { metadata: meta, expirationTtl: TTL });
    return json({ ok: true });
  }
  return json({ ok: false, error: 'not found' }, 404);
}

// ================= AI receptionist (Telegram bot + Telegram Business) =================
// Needs: ANTHROPIC_API_KEY (Secret). Optional: AI_MODEL. Webhook is set by opening /api/tgsetup once.
const APP_URL = 'https://aj-guest-app.management-aj-18.workers.dev/';
const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=A%26J+Kampot+Boutique%2C+Street+%23724%2C+Krang+Village%2C+Krang+Ampil%2C+Kampot%2C+Cambodia';
const PAUSE_SEC = 6 * 3600;      // staff typed in a chat → AI stays quiet there for 6 h
const HIST_TTL = 3 * 24 * 3600;  // keep short chat memory 3 days

const SYSTEM = `You are the front-desk receptionist of A&J Kampot Boutique (a small boutique hotel in Kampot town, Cambodia), chatting with guests on Telegram. You reply on behalf of the hotel team.

STYLE (very important)
- Sound like a real, friendly person — never like an AI. Never say you are an AI or a bot unless asked directly.
- Short replies: 1–3 short sentences. Answer ONLY what the guest asked, one step at a time. Never dump all information at once.
- Reply in the guest's language: Khmer if they write Khmer (natural, correct Khmer), otherwise English (or their language if simple).
- In Khmer call a balcony "វេរ៉ង់ដា" and the Durian roundabout "រង្វង់មូលធុរេន".
- Do not use markdown, headings or bullet lists. Plain chat text, 0–1 emoji.
- Never write long raw links. When the guest should see rooms, book, check in early or ask for items, end your reply with the tag [APP]. When they ask for location, end with [MAP]. The system turns these into buttons.

SALES FLOW for room questions
1) Guest asks about rooms / availability → ask: one bed or two beds?
2) One bed → offer only Superior Room ($24/night) and Superior Room with balcony ($30/night). Two beds → Twin A ($32.50, 2 guests) and Twin B ($42, up to 3 guests). Family of 4 → Family Suite ($94.50).
3) Ask which room interests them, then how many people, then recommend and add [APP] so they can see photos and book.
- Live availability: you cannot see it. The app shows real availability and books instantly ("① Book instantly on our website"), or the guest can choose "② Book here — our team arranges it". Don't promise a room is free.
- Prices above are our direct prices (cheaper than booking sites). Direct bookings: 50% deposit to hold the room (paid by ACLEDA/KHQR QR shown in the app), the rest at check-in. Booking.com/Agoda/Expedia guests pay through the OTA.
- Extra guests: say yes, ask their ages — 15+ $10/night, 7–14 $5/night, under 7 free; or suggest Twin B (beds for 3) for comfort.

ROOMS: Superior Room — 1 bed 1.6 m, 2 guests, $24. Superior Room with balcony — 1 bed 1.8 m, private balcony, 2 guests, $30. Twin A — two 1.2 m beds, 2 guests, $32.50. Twin B — one 1.8 m + one 1.2 m bed, 3 guests, $42. Family Suite — two 1.6 m beds, 2 bathrooms, 4 guests, $94.50. All rooms: Wi-Fi, air-con, private bathroom, daily housekeeping.

HOTEL INFO (give only what is asked)
- Check-in from 14:00, check-out before 12:00. Early arrival: they can leave luggage with us; early check-in only if the room is ready. Late check-out until 12:30 if they ask reception first; after 12:30 a full extra night is charged.
- Location: centre of Kampot town near the Durian roundabout, close to the main food places. Don't give directions — add [MAP].
- Swimming pool 7:30–22:00. Café corner 8:00–17:00 with tables; guests may bring outside food.
- Front gate closes 1:00 AM, but staff open it 24 hours — message us.
- Reception staff 24 hours. Motorbike rental and laundry available (ask one at a time). Drinking water and cold drinks sold at reception (no food).
- No smoking inside rooms or the building; smokers can pick a balcony room or smoke downstairs outside.
- ID: foreign guests need passport + visa, Cambodian guests national ID card; every guest staying in the room must show ID. They can check in early in the app [APP].
- Guests already staying can ask for towels, umbrella, charger, water, report AC/water problems etc. in the app "Room requests" [APP], or tell you here.

WHEN TO CALL STAFF
If the guest sends a payment receipt, wants a booking changed/cancelled/refunded, complains, has an emergency, asks something you don't know, or asks for a human — reply kindly that our team will help shortly, and add the tag [STAFF] at the end. Never invent facts, prices or policies.`;

async function tgApi(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  return r.json().catch(() => ({}));
}
async function webhookSecret(env) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ajwh:' + env.BOT_TOKEN));
  return [...new Uint8Array(h)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function tgSetup(env, origin) {
  if (!env.BOT_TOKEN) return json({ ok: false, error: 'BOT_TOKEN not set' }, 500);
  const r = await tgApi(env, 'setWebhook', {
    url: origin + '/tg/webhook', secret_token: await webhookSecret(env),
    allowed_updates: ['message', 'business_connection', 'business_message'], drop_pending_updates: true
  });
  return json({ ok: !!r.ok, telegram: r.description || '', ai: !!(env.AI_KEY || env.ANTHROPIC_API_KEY) });
}

async function handleTg(request, env, ctx) {
  if (request.headers.get('x-telegram-bot-api-secret-token') !== await webhookSecret(env)) return new Response('no', { status: 403 });
  const u = await request.json().catch(() => null);
  if (u) ctx.waitUntil(onUpdate(env, u).catch(e => console.log('bot error', e && e.stack || e)));
  return new Response('ok');
}

async function onUpdate(env, u) {
  if (u.business_connection) {
    const c = u.business_connection;
    if (env.PRE) await env.PRE.put('biz:' + c.id, JSON.stringify({ user: c.user && c.user.id, enabled: c.is_enabled }));
    await tgApi(env, 'sendMessage', { chat_id: env.STAFF_CHAT_ID, text: c.is_enabled ? '✅ AI receptionist is now connected to the hotel Telegram account and will reply to guests.' : '⏸️ AI receptionist was disconnected from the hotel Telegram account.' });
    return;
  }
  const biz = u.business_message;
  const m = biz || u.message;
  if (!m || !m.chat || m.chat.type !== 'private') return;
  const chatId = m.chat.id;
  const key = (biz ? 'b:' + biz.business_connection_id + ':' : 'd:') + chatId;

  // Business chat: a message written by the hotel account itself (staff) → pause the AI in that chat
  if (biz) {
    if (m.sender_business_bot) return;               // our own reply echoed back
    if (m.from && m.from.id !== chatId) {            // outgoing message typed by staff
      if (env.PRE) await env.PRE.put('pause:' + key, '1', { expirationTtl: PAUSE_SEC });
      return;
    }
    if (env.PRE && await env.PRE.get('pause:' + key)) return;
  }

  const send = (text, extra) => tgApi(env, 'sendMessage', Object.assign({ chat_id: chatId, text },
    biz ? { business_connection_id: biz.business_connection_id } : {}, extra || {}));
  const name = [m.from && m.from.first_name, m.from && m.from.last_name].filter(Boolean).join(' ') || 'Guest';
  const who = name + (m.from && m.from.username ? ' @' + m.from.username : '');

  if (!biz && m.text && /^\/start\b/.test(m.text)) {
    const km = (m.from && m.from.language_code) === 'km';
    await send(km ? 'សួស្តី! 👋 សូមស្វាគមន៍មកកាន់ A&J Kampot Boutique។ មានអ្វីឱ្យយើងជួយទេ? អ្នកក៏អាចមើលបន្ទប់ កក់ ឬស្នើសុំអ្វីៗក្នុង App បានដែរ។'
                  : 'Hello! 👋 Welcome to A&J Kampot Boutique. How can we help you? You can also see our rooms, book or ask for anything in our app.',
      { reply_markup: { inline_keyboard: [[{ text: '📱 Open App', web_app: { url: APP_URL } }]] } });
    return;
  }

  const text = (m.text || m.caption || '').slice(0, 1500);
  if (!text) {
    // photo / voice / sticker with no text → let staff handle it
    const media = m.photo ? 'photo' : m.voice ? 'voice message' : m.document ? 'file' : m.sticker ? 'sticker' : 'message';
    if (!m.sticker) {
      await send(m.from && m.from.language_code === 'km' ? 'អរគុណ! 🙏 បុគ្គលិករបស់យើងនឹងពិនិត្យ ហើយឆ្លើយអ្នកឆាប់ៗ។' : 'Thank you! 🙏 Our team will check it and reply shortly.');
      await notifyStaff(env, `📎 ${who} sent a ${media}${biz ? ' to the hotel Telegram' : ' to @AJKampotBot'} — please check the chat.`);
    }
    return;
  }

  if (!(env.AI_KEY || env.ANTHROPIC_API_KEY)) {
    await send('Thank you for your message! Our team will reply shortly. 🙏', { reply_markup: appButtons(biz) });
    await notifyStaff(env, `💬 ${who}: ${text.slice(0, 500)}\n(AI not set up yet — please reply)`);
    return;
  }

  const hist = env.PRE ? JSON.parse(await env.PRE.get('hist:' + key) || '[]') : [];
  hist.push({ role: 'user', content: text });
  while (hist.length > 16) hist.shift();
  while (hist.length && hist[0].role !== 'user') hist.shift();

  let reply = '';
  try { reply = await askClaude(env, hist); } catch (e) { console.log('claude', e && e.message); }
  if (!reply) {
    await send('Thank you! Our team will reply shortly. 🙏');
    await notifyStaff(env, `💬 ${who}: ${text.slice(0, 500)}\n(AI could not answer — please reply)`);
    return;
  }

  const wantApp = /\[APP\]/i.test(reply), wantMap = /\[MAP\]/i.test(reply), wantStaff = /\[STAFF\]/i.test(reply);
  const clean = reply.replace(/\[(APP|MAP|STAFF)\]/gi, '').replace(/[ \t]+\n/g, '\n').trim();
  const rows = [];
  if (wantApp) rows.push([biz ? { text: '📱 Open App', url: APP_URL } : { text: '📱 Open App', web_app: { url: APP_URL } }]);
  if (wantMap) rows.push([{ text: '📍 Map', url: MAP_URL }]);
  await send(clean || '🙏', rows.length ? { reply_markup: { inline_keyboard: rows } } : {});

  hist.push({ role: 'assistant', content: clean || '🙏' });
  if (env.PRE) await env.PRE.put('hist:' + key, JSON.stringify(hist), { expirationTtl: HIST_TTL });
  if (wantStaff) await notifyStaff(env, `🙋 ${who} needs staff${biz ? ' (hotel Telegram chat)' : ' (@AJKampotBot chat)'}:\n"${text.slice(0, 600)}"`);
}

function appButtons(biz) {
  return { inline_keyboard: [[biz ? { text: '📱 Open App', url: APP_URL } : { text: '📱 Open App', web_app: { url: APP_URL } }]] };
}
async function notifyStaff(env, text) {
  if (env.STAFF_CHAT_ID) await tgApi(env, 'sendMessage', { chat_id: env.STAFF_CHAT_ID, text });
}
async function askClaude(env, messages) {
  const now = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': String(env.AI_KEY || env.ANTHROPIC_API_KEY || '').replace(/[^\x21-\x7e]/g, ''), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 400, system: SYSTEM + `\n\nCurrent date/time in Cambodia: ${now}.`, messages })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
  return (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
}
