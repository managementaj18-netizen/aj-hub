import { EmailMessage } from "cloudflare:email";
// A&J Kampot Boutique — Guest Mini App (Cloudflare Worker)
// One file: serves the app page AND forwards guest forms to the staff Telegram group.
// Settings (Cloudflare → Worker → Settings → Variables and Secrets):
//   BOT_TOKEN     = token from @BotFather            (type: Secret)
//   STAFF_CHAT_ID = staff Telegram group id, e.g. -1001234567890
//   PRE           = KV namespace binding — keeps early check-ins for the A&J Hub check-in form
//   ANTHROPIC_API_KEY = Claude API key (Secret) — AI receptionist answers guests on Telegram

const HTML = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover\">\n<meta name='description' content='A&amp;J Kampot Boutique, Kampot, Cambodia. See rooms, best direct prices, book and check in early.'>\n<meta property='og:type' content='website'>\n<meta property='og:site_name' content='A&amp;J Kampot Boutique'>\n<meta property='og:title' content='A&amp;J Kampot Boutique · Book Direct'>\n<meta property='og:description' content='Kampot · Cambodia. See rooms, best direct prices, book and check in early. មើលបន្ទប់ និងកក់ដោយផ្ទាល់ តម្លៃល្អបំផុត។'>\n<meta property='og:image' content='https://nobeds.app/uploads/1508197823_background_be67ec7da39c456a9bcdd5a589a6481e.jpg'>\n<meta property='og:url' content='https://aj-guest-app.management-aj-18.workers.dev/'>\n<meta name='twitter:card' content='summary_large_image'>\n<link rel='icon' type='image/png' href='https://0d57110f.aj-booking.pages.dev/favicon.png'>\n<link rel='apple-touch-icon' href='https://0d57110f.aj-booking.pages.dev/favicon.png'>\n<title>A&J Kampot Boutique</title>\n<script src=\"https://telegram.org/js/telegram-web-app.js\"></script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js\"></script>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link href=\"https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">\n<style>\n:root{--navy:#14254a;--navy2:#1f3a73;--ink:#1b1f2a;--mute:#6b7280;--line:#e6e8ee;--bg:#f6f7fa;--ok:#15803d;--bad:#b91c1c}\n*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}\nhtml,body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,\"Kantumruy Pro\",system-ui,sans-serif;font-size:15px}\nbody.km{font-family:\"Kantumruy Pro\",Inter,system-ui,sans-serif}\nheader{background:#fff;border-bottom:1px solid var(--line);padding:12px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:5}\nheader img{height:34px}\nheader .t{flex:1;line-height:1.15}\nheader .t b{display:block;font-size:15px;color:var(--navy)}\nheader .t span{font-size:12px;color:var(--mute)}\n.lang{border:1px solid var(--line);background:#fff;border-radius:20px;padding:6px 10px;font-size:13px;font-weight:600;color:var(--navy);cursor:pointer}\nmain{padding:16px;padding-bottom:90px;max-width:560px;margin:0 auto}\n.page{display:none}.page.on{display:block}\nh2{font-size:19px;margin:4px 0 4px;color:var(--navy)}\n.sub{color:var(--mute);font-size:13px;margin:0 0 14px}\n.hero{background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border-radius:16px;padding:18px;margin-bottom:14px}\n.hero b{font-size:18px;display:block;margin-bottom:4px}\n.hero p{margin:0;font-size:13px;opacity:.85}\n.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.tile{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;cursor:pointer;text-align:left;font:inherit;color:inherit}\n.tile .i{font-size:26px}\n.tile b{display:block;margin-top:6px;font-size:14px;color:var(--navy)}\n.tile span{font-size:12px;color:var(--mute)}\n.card{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-bottom:12px}\n.pics{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}\n.pics::-webkit-scrollbar{display:none}\n.pics img{width:100%;flex:0 0 100%;height:200px;object-fit:cover;scroll-snap-align:start;background:#e5e7eb}\n.cb{padding:12px 14px}\n.cb .row{display:flex;justify-content:space-between;align-items:baseline}\n.cb h3{margin:0;font-size:16px}\n.price{font-weight:700;color:var(--navy);font-size:18px}\n.price s{color:var(--mute);font-weight:400;font-size:13px;margin-right:4px}\n.meta{font-size:13px;color:var(--mute);margin:4px 0 10px}\n.btn{display:block;width:100%;border:0;border-radius:12px;padding:13px;font:inherit;font-weight:600;font-size:15px;cursor:pointer;text-align:center;text-decoration:none}\n.btn.p{background:var(--navy);color:#fff}\n.btn.s{background:#fff;color:var(--navy);border:1.5px solid var(--navy)}\n.btn+.btn{margin-top:8px}\n.btn:disabled{opacity:.5}\n.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}\nlabel{display:block;font-size:13px;font-weight:600;margin:12px 0 5px}\ninput,select,textarea{width:100%;border:1px solid #d5d9e2;border-radius:10px;padding:11px;font:inherit;background:#fff;color:var(--ink)}\ntextarea{min-height:70px;resize:vertical}\n.note{background:#fff7e6;border:1px solid #f5d38a;border-radius:10px;padding:10px 12px;font-size:13px;margin:10px 0}\n.items{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.item{background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:10px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:13px;user-select:none}\n.item.on{border-color:var(--navy);background:#eef2fb}\n.item .e{font-size:20px}\n.photos{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}\n.photos .ph{width:76px;height:76px;border-radius:10px;overflow:hidden;position:relative;border:1px solid var(--line)}\n.photos .ph img{width:100%;height:100%;object-fit:cover}\n.photos .ph b{position:absolute;top:2px;right:2px;background:#000a;color:#fff;border-radius:50%;width:20px;height:20px;font-size:12px;display:grid;place-items:center;cursor:pointer}\n.addph{width:76px;height:76px;border:1.5px dashed #aab;border-radius:10px;display:grid;place-items:center;font-size:28px;color:var(--navy);cursor:pointer;background:#fff}\n.list{background:#fff;border:1px solid var(--line);border-radius:14px}\n.list .li{display:flex;gap:12px;padding:12px 14px;border-bottom:1px solid var(--line);align-items:center;text-decoration:none;color:inherit}\n.list .li:last-child{border:0}\n.list .li .e{font-size:22px;width:28px;text-align:center}\n.list .li b{display:block;font-size:14px}\n.list .li span{font-size:12px;color:var(--mute)}\nnav{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--line);display:flex;padding:6px 4px calc(6px + env(safe-area-inset-bottom));z-index:6}\nnav button{flex:1;border:0;background:none;font:inherit;font-size:11px;color:var(--mute);padding:4px 0;cursor:pointer}\nnav button .e{display:block;font-size:20px;filter:grayscale(1);opacity:.6}\nnav button.on{color:var(--navy);font-weight:600}\nnav button.on .e{filter:none;opacity:1}\n.toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;display:none;z-index:9;max-width:90%;text-align:center}\n.done{text-align:center;padding:30px 10px}\n.done .e{font-size:54px}\n.req{color:var(--bad)}\n.en{display:block;font-size:.8em;font-weight:500;opacity:.72;line-height:1.25}\n.btn .en{opacity:.8}\nnav .en{font-size:9px}\n.item .en{font-size:11px}\nh2 .en{font-size:13px;font-weight:600}\n.stay{background:#fff;border:1px solid var(--line);border-radius:14px;padding:4px 12px 12px;margin-bottom:12px}\n.stay .three{display:grid;grid-template-columns:1fr 1fr 90px;gap:8px}\n.stay label{margin-top:8px}\n.tot{font-size:13px;color:var(--mute);margin:-4px 0 10px}\n.tot b{color:var(--ink)}\n.modal{position:fixed;inset:0;background:#0008;z-index:20;display:none;align-items:flex-end;justify-content:center}\n.modal.on{display:flex}\n.sheet{background:#fff;width:100%;max-width:560px;border-radius:18px 18px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));max-height:92vh;overflow:auto}\n.sheet h3{margin:0 0 8px;color:var(--navy)}\n.sum{background:var(--bg);border-radius:10px;padding:10px 12px;font-size:14px}\n.sum div{display:flex;justify-content:space-between;padding:3px 0}\n.code{border:1.5px dashed var(--navy);border-radius:12px;padding:10px 12px;margin:12px 0;display:flex;align-items:center;justify-content:space-between}\n.code b{font-size:20px;letter-spacing:1px;font-family:ui-monospace,monospace}\n.code button{background:var(--navy);color:#fff;border:0;border-radius:8px;padding:8px 12px;font:inherit;font-weight:600;cursor:pointer}\nol.steps{padding-left:18px;font-size:13px;margin:8px 0 14px}\n.qrbox{text-align:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;margin:10px 0}\n.qrbox .bank{font-weight:700;color:#0b4a8b}\n.qrbox #qr img,.qrbox #qr svg{width:220px;height:220px}\n.qrbox .amt{font-size:20px;font-weight:700;color:var(--navy);margin-top:6px}\n</style>\n</head>\n<body>\n<header>\n  <img src=\"https://0d57110f.aj-booking.pages.dev/logo-navy.png\" alt=\"A&J\">\n  <div class=\"t\"><b>A&J Kampot Boutique</b><span data-t=\"tagline\"></span></div>\n  <button class=\"lang\" id=\"langBtn\">ខ្មែរ</button>\n</header>\n\n<main>\n<!-- HOME -->\n<section class=\"page on\" id=\"p-home\">\n  <div class=\"hero\"><b id=\"hello\"></b><p data-t=\"heroP\"></p></div>\n  <div class=\"grid\">\n    <button class=\"tile\" data-go=\"rooms\"><div class=\"i\">🛏️</div><b data-t=\"tRooms\"></b><span data-t=\"tRoomsS\"></span></button>\n    <button class=\"tile\" data-go=\"checkin\"><div class=\"i\">📝</div><b data-t=\"tCheck\"></b><span data-t=\"tCheckS\"></span></button>\n    <button class=\"tile\" data-go=\"request\"><div class=\"i\">🧺</div><b data-t=\"tReq\"></b><span data-t=\"tReqS\"></span></button>\n    <button class=\"tile\" data-go=\"info\"><div class=\"i\">💬</div><b data-t=\"tInfo\"></b><span data-t=\"tInfoS\"></span></button>\n    <button class=\"tile\" data-go=\"moto\" style=\"grid-column:1/-1\"><div class=\"i\">🛵</div><b data-t=\"tMoto\"></b><span data-t=\"tMotoS\"></span></button>\n  </div>\n</section>\n\n<!-- ROOMS -->\n<section class=\"page\" id=\"p-rooms\">\n  <h2 data-t=\"tRooms\"></h2>\n  <p class=\"sub\" data-t=\"roomsSub\"></p>\n  <div class=\"stay\">\n    <div class=\"three\">\n      <div><label data-t=\"fCin\"></label><input type=\"date\" id=\"cin\"></div>\n      <div><label data-t=\"fCout\"></label><input type=\"date\" id=\"cout\"></div>\n      <div><label data-t=\"fGuests\"></label><input type=\"number\" id=\"gst\" min=\"1\" max=\"8\" value=\"2\"></div>\n    </div>\n  </div>\n  <div id=\"roomList\"></div>\n</section>\n\n<!-- CHECK-IN -->\n<section class=\"page\" id=\"p-checkin\">\n  <h2 data-t=\"tCheck\"></h2>\n  <p class=\"sub\" data-t=\"checkSub\"></p>\n  <div class=\"note\" data-t=\"docRule\"></div>\n  <div class=\"note\" data-t=\"mateRule\"></div>\n  <form id=\"fCheck\">\n    <label><span data-t=\"fName\"></span> <span class=\"req\">*</span></label>\n    <input name=\"name\" required>\n    <div class=\"two\">\n      <div><label><span data-t=\"fNat\"></span> <span class=\"req\">*</span></label><input name=\"nationality\" required></div>\n      <div><label><span data-t=\"fPass\"></span> <span class=\"req\">*</span></label><input name=\"passport\" required></div>\n    </div>\n    <div class=\"two\">\n      <div><label><span data-t=\"fPhone\"></span> <span class=\"req\">*</span></label><input name=\"phone\" type=\"tel\" required></div>\n      <div><label data-t=\"fSource\"></label>\n        <select name=\"source\"><option>Direct / Telegram</option><option>WhatsApp</option><option>Facebook Messenger</option><option>Booking.com</option><option>Agoda</option><option>Expedia</option><option>Trip.com</option><option data-t=\"other\">Other</option></select></div>\n    </div>\n    <div class=\"two\">\n      <div><label><span data-t=\"fArr\"></span> <span class=\"req\">*</span></label><input name=\"arrival\" type=\"date\" required></div>\n      <div><label data-t=\"fTime\"></label><input name=\"time\" type=\"time\"></div>\n    </div>\n    <div class=\"two\">\n      <div><label data-t=\"fNights\"></label><input name=\"nights\" type=\"number\" min=\"1\" value=\"1\"></div>\n      <div><label data-t=\"fGuests\"></label><input name=\"guests\" type=\"number\" min=\"1\" value=\"2\"></div>\n    </div>\n    <label data-t=\"fTrans\"></label>\n    <select name=\"transport\"><option data-t=\"trCar\">Car</option><option data-t=\"trMoto\">Motorbike</option><option data-t=\"trTuk\">Tuk-tuk</option><option data-t=\"trBus\">Bus / Van</option><option data-t=\"trTaxi\">Taxi</option><option data-t=\"other\">Other</option></select>\n    <label data-t=\"fOthers\"></label>\n    <textarea name=\"others\" data-tp=\"fOthersP\"></textarea>\n    <label><span data-t=\"fDocs\"></span> <span class=\"req\">*</span></label>\n    <div class=\"photos\" id=\"phCheck\"></div>\n    <label data-t=\"fNote\"></label>\n    <textarea name=\"note\"></textarea>\n    <br><button class=\"btn p\" type=\"submit\" data-t=\"send\"></button>\n  </form>\n</section>\n\n<!-- REQUEST -->\n<section class=\"page\" id=\"p-request\">\n  <h2 data-t=\"tReq\"></h2>\n  <p class=\"sub\" data-t=\"reqSub\"></p>\n  <form id=\"fReq\">\n    <div class=\"two\">\n      <div><label><span data-t=\"fRoom\"></span> <span class=\"req\">*</span></label><input name=\"room\" inputmode=\"numeric\" required placeholder=\"203\"></div>\n      <div><label data-t=\"fName\"></label><input name=\"name\"></div>\n    </div>\n    <label data-t=\"borrow\"></label>\n    <div class=\"items\" id=\"itBorrow\"></div>\n    <label data-t=\"buy\"></label>\n    <div class=\"items\" id=\"itBuy\"></div>\n    <label data-t=\"problem\"></label>\n    <div class=\"items\" id=\"itProb\"></div>\n    <label data-t=\"fNote\"></label>\n    <textarea name=\"note\" data-tp=\"reqNoteP\"></textarea>\n    <label data-t=\"fPhotoOpt\"></label>\n    <div class=\"photos\" id=\"phReq\"></div>\n    <br><button class=\"btn p\" type=\"submit\" data-t=\"send\"></button>\n  </form>\n</section>\n\n<!-- MOTORBIKE RENTAL -->\n<section class=\"page\" id=\"p-moto\">\n  <h2 data-t=\"tMoto\"></h2>\n  <p class=\"sub\" data-t=\"motoSub\"></p>\n  <form id=\"fMoto\">\n    <div class=\"items\" id=\"itMoto\" style=\"grid-template-columns:1fr 1fr\">\n      <div class=\"item on\" data-v=\"Honda Scoopy\" data-p=\"8\" style=\"padding:14px 8px\"><div style=\"font-size:34px\">🛵</div><b>Honda Scoopy</b><div style=\"font-size:18px;font-weight:700;margin-top:4px\">$8 <span style=\"font-size:12px;font-weight:400\" data-t=\"perDay\"></span></div></div>\n      <div class=\"item\" data-v=\"Honda Air Blade\" data-p=\"5\" style=\"padding:14px 8px\"><div style=\"font-size:34px\">🏍️</div><b>Honda Air Blade</b><div style=\"font-size:18px;font-weight:700;margin-top:4px\">$5 <span style=\"font-size:12px;font-weight:400\" data-t=\"perDay\"></span></div></div>\n    </div>\n    <div class=\"two\">\n      <div><label><span data-t=\"motoFrom\"></span> <span class=\"req\">*</span></label><input name=\"from\" type=\"date\" required></div>\n      <div><label><span data-t=\"motoDays\"></span> <span class=\"req\">*</span></label><input name=\"days\" type=\"number\" min=\"1\" value=\"1\" required></div>\n    </div>\n    <div class=\"two\">\n      <div><label><span data-t=\"fName\"></span> <span class=\"req\">*</span></label><input name=\"name\" required></div>\n      <div><label data-t=\"motoRoomPhone\"></label><input name=\"contact\"></div>\n    </div>\n    <label data-t=\"fNote\"></label>\n    <textarea name=\"note\"></textarea>\n    <div id=\"motoTotal\" style=\"margin:12px 0;font-size:17px;font-weight:700\"></div>\n    <p class=\"sub\" data-t=\"motoNote\" style=\"background:#fff7e6;border-radius:10px;padding:10px\"></p>\n    <button class=\"btn p\" type=\"submit\" data-t=\"motoSend\"></button>\n  </form>\n</section>\n\n<!-- INFO / CONTACT -->\n<section class=\"page\" id=\"p-info\">\n  <h2 data-t=\"tInfo\"></h2>\n  <p class=\"sub\" data-t=\"infoSub\"></p>\n  <div class=\"list\">\n    <a class=\"li\" href=\"https://t.me/+85587882020\" target=\"_blank\"><div class=\"e\"><img src='https://cdn.simpleicons.org/telegram/26A5E4' alt='Telegram' width='28' height='28' style='display:block;margin:auto'></div><div><b>Telegram</b><span>+855 87 882 020</span></div></a>\n    <a class=\"li\" href=\"https://wa.me/85587882020\" target=\"_blank\"><div class=\"e\"><img src='https://cdn.simpleicons.org/whatsapp/25D366' alt='WhatsApp' width='28' height='28' style='display:block;margin:auto'></div><div><b>WhatsApp</b><span>+855 87 882 020</span></div></a>\n    <a class=\"li\" href=\"https://m.me/148357296114503\" target=\"_blank\"><div class=\"e\"><img src='https://cdn.simpleicons.org/messenger/0084FF' alt='Messenger' width='28' height='28' style='display:block;margin:auto'></div><div><b>Messenger</b><span>A&J Kampot Boutique</span></div></a>\n    <a class=\"li\" href=\"tel:+85587882020\"><div class=\"e\">📞</div><div><b data-t=\"call\"></b><span data-t=\"call24\"></span></div></a>\n  </div>\n  <br>\n  <div class=\"list\">\n    <a class=\"li\" href=\"https://www.google.com/maps/search/?api=1&query=A%26J+Kampot+Boutique%2C+Street+%23724%2C+Krang+Village%2C+Krang+Ampil%2C+Kampot%2C+Cambodia\" target=\"_blank\"><div class=\"e\">📍</div><div><b data-t=\"map\"></b><span data-t=\"mapS\"></span></div></a>\n    <div class=\"li\"><div class=\"e\">🕑</div><div><b data-t=\"ciTitle\"></b><span data-t=\"ciS\"></span></div></div>\n    <div class=\"li\"><div class=\"e\">🏊</div><div><b data-t=\"pool\"></b><span>7:30 – 22:00</span></div></div>\n    <div class=\"li\"><div class=\"e\">☕</div><div><b data-t=\"cafe\"></b><span data-t=\"cafeS\"></span></div></div>\n    <div class=\"li\"><div class=\"e\">🚪</div><div><b data-t=\"gate\"></b><span data-t=\"gateS\"></span></div></div>\n    <div class=\"li\"><div class=\"e\">🛵</div><div><b data-t=\"moto\"></b><span data-t=\"motoS\"></span></div></div>\n    <div class=\"li\"><div class=\"e\">🚭</div><div><b data-t=\"smoke\"></b><span data-t=\"smokeS\"></span></div></div>\n  </div>\n</section>\n\n<!-- STAFF BOOKING -->\n<section class=\"page\" id=\"p-staffbook\">\n  <h2 data-t=\"askStaff\"></h2>\n  <p class=\"sub\" data-t=\"sbSub\"></p>\n  <form id=\"fBook\">\n    <label data-t=\"fRoomType\"></label>\n    <select name=\"room\" id=\"sbRoom\"></select>\n    <div class=\"two\">\n      <div><label><span data-t=\"fCin\"></span> <span class=\"req\">*</span></label><input type=\"date\" name=\"cin\" id=\"sbCin\" required></div>\n      <div><label><span data-t=\"fCout\"></span> <span class=\"req\">*</span></label><input type=\"date\" name=\"cout\" id=\"sbCout\" required></div>\n    </div>\n    <div class=\"two\">\n      <div><label data-t=\"fGuests\"></label><input type=\"number\" name=\"guests\" id=\"sbGst\" min=\"1\" value=\"2\"></div>\n      <div><label data-t=\"fTime\"></label><input type=\"time\" name=\"time\"></div>\n    </div>\n    <div class=\"sum\" id=\"sbSum\"></div>\n    <label><span data-t=\"fName\"></span> <span class=\"req\">*</span></label>\n    <input name=\"name\" required>\n    <div class=\"two\">\n      <div><label data-t=\"fNat\"></label><input name=\"country\"></div>\n      <div><label><span data-t=\"fPhone\"></span> <span class=\"req\">*</span></label><input name=\"phone\" type=\"tel\" required></div>\n    </div>\n    <label>Email</label><input name=\"email\" type=\"email\">\n    <label data-t=\"fNote\"></label><textarea name=\"note\"></textarea>\n    <div class=\"qrbox\">\n      <div class=\"bank\">ACLEDA · KHQR</div>\n      <div class=\"sub\" style=\"margin:4px 0 8px\" data-t=\"qrHint\"></div>\n      <div id=\"qr\"></div>\n      <div style=\"font-size:13px;font-weight:600\">A & J Kampot Boutique</div>\n      <div class=\"amt\" id=\"sbDep\"></div>\n    </div>\n    <label><span data-t=\"fReceipt\"></span> <span class=\"req\">*</span></label>\n    <div class=\"photos\" id=\"phBook\"></div>\n    <div class=\"note\" data-t=\"mateRule\"></div>\n    <div class=\"note\" data-t=\"sbHours\"></div>\n    <button class=\"btn p\" type=\"submit\" data-t=\"send\"></button>\n  </form>\n</section>\n\n<!-- DONE -->\n<section class=\"page\" id=\"p-done\">\n  <div class=\"done\"><div class=\"e\">✅</div><h2 data-t=\"thanks\"></h2><p class=\"sub\" id=\"doneMsg\"></p><br><button class=\"btn s\" data-go=\"home\" data-t=\"back\"></button></div>\n</section>\n</main>\n\n<nav>\n  <button data-go=\"home\" class=\"on\"><span class=\"e\">🏠</span><span data-t=\"nHome\"></span></button>\n  <button data-go=\"rooms\"><span class=\"e\">🛏️</span><span data-t=\"nRooms\"></span></button>\n  <button data-go=\"checkin\"><span class=\"e\">📝</span><span data-t=\"nCheck\"></span></button>\n  <button data-go=\"request\"><span class=\"e\">🧺</span><span data-t=\"nReq\"></span></button>\n  <button data-go=\"info\"><span class=\"e\">💬</span><span data-t=\"nInfo\"></span></button>\n</nav>\n<div class=\"toast\" id=\"toast\"></div>\n<div class=\"modal\" id=\"bookModal\"><div class=\"sheet\">\n  <h3 id=\"bmTitle\"></h3>\n  <div class=\"sum\" id=\"bmSum\"></div>\n  <div class=\"code\"><div><div style=\"font-size:11px;color:var(--mute)\" data-t=\"yourCode\"></div><b id=\"bmCode\"></b></div><button type=\"button\" id=\"bmCopy\" data-t=\"copy\"></button></div>\n  <ol class=\"steps\"><li data-t=\"st1\"></li><li data-t=\"st2\"></li><li id=\"bmSt3\"></li></ol>\n  <button class=\"btn p\" id=\"bmGo\" data-t=\"goBook\"></button>\n  <button class=\"btn s\" id=\"bmStaff\" data-t=\"askStaff\"></button>\n  <button class=\"btn\" style=\"background:none;color:var(--mute)\" id=\"bmClose\" data-t=\"close\"></button>\n</div></div>\n\n<script>\nconst API = '/api/send';\nconst NOBEDS = 'https://nobeds.app/DirectForm/Step/b95b08ae-cb76-428d-8401-1394cd8dad44';\nconst KHQR = '00020101021129410009khqr@aclb0114070004703108250206ACLEDA392000118551751447601014520420005802KH53038405921A & J Kampot Boutique6010Phnom Penh621402100885882020630487FD';\nconst TG_CHAT = 'https://t.me/+85587882020';\nconst IMG = 'https://nobeds.app/uploads/';\n\nconst ROOMS = [\n {id:'SR', rid:'2541246', max:2, en:'Superior Room', km:'បន្ទប់ Superior', was:40, price:24, enM:'1 bed (1.6 m) · up to 2 guests', kmM:'គ្រែ 1 (1.6 ម) · ភ្ញៀវ 2 នាក់',\n  pics:['2541246_rentals_6928b091e8b4449a990a56473a234f59','2541246_rentals_cc534b33a7c242ea95d9ac6354067483','2541246_rentals_4d6f2bb903634ee384aa06bcc5f8fd7b','2541246_rentals_82ede7953e784fe29b96e2133c855446','2541246_rentals_9845002f317a4a64bd9b93c57a15eba4']},\n {id:'SRB', rid:'2541247', max:2, en:'Superior Room with Balcony', km:'បន្ទប់ Superior មានវេរ៉ង់ដា', was:65, price:30, enM:'1 bed (1.8 m) · private balcony · up to 2 guests', kmM:'គ្រែ 1 (1.8 ម) · វេរ៉ង់ដាផ្ទាល់ · ភ្ញៀវ 2 នាក់',\n  pics:['2541247_rentals_3949190ecc1945dea3e7f7822aa36c66','2541247_rentals_4bf0b6ca26ca46d9a08332f062e5c1cc','2541247_rentals_6062b6ef342c4bbc8a21c136c1199e06','2541247_rentals_656349ec1b6440a4af0248e8ad06195e','2541247_rentals_48b07ba5c78e411898a58d9a3f7f7ccf']},\n {id:'TA', rid:'2541250', max:2, en:'Twin Room A', km:'បន្ទប់គ្រែពីរ A', was:65, price:32.5, enM:'2 beds (1.2 m) · up to 2 guests', kmM:'គ្រែ 2 (1.2 ម) · ភ្ញៀវ 2 នាក់',\n  pics:['2541250_rentals_607689f355674f27b450af6110daa59e','2541250_rentals_0b17ca3ccedd4b2b9e8804b78a765f5e','2541250_rentals_a6a9e6b1cabb48cd9b5cdacdf995978b','2541250_rentals_211130ef5764462c84b607eb4aea510a','2541250_rentals_d6fad137391e4e2d91de49475d696594','2541250_rentals_adde851fa7c54cb789b05de50736ae00']},\n {id:'TB', rid:'2541251', max:3, en:'Twin Room B', km:'បន្ទប់គ្រែពីរ B', was:75, price:42, enM:'2 beds (1.8 m + 1.2 m) · up to 3 guests', kmM:'គ្រែ 2 (1.8 ម + 1.2 ម) · ភ្ញៀវ 3 នាក់',\n  pics:['2541251_rentals_07826b94aa3d4285bedfc151710ceae1','2541251_rentals_37ad6afd6fdd4892978c853f0f574384','2541251_rentals_55f27ae5d8404c47b5f21e25bc75bd01','2541251_rentals_1a86cf95c7114ae7adca9b999d497d65','2541251_rentals_12b928a913ea462e97ec244aec06c1a3','2541251_rentals_32f0070948de4475bf43cb30f9799bff']},\n {id:'FS', rid:'2541252', max:4, en:'Family Suite', km:'បន្ទប់គ្រួសារ (Family Suite)', was:150, price:94.5, enM:'2 beds (1.6 m) · 2 bathrooms · up to 4 guests', kmM:'គ្រែ 2 (1.6 ម) · បន្ទប់ទឹក 2 · ភ្ញៀវ 4 នាក់',\n  pics:['2541252_rentals_97df1d5a6e43469c94a3e328f06338ed','2541252_rentals_3b7c210b06214d75a5d35a8e7c3fa07f','2541252_rentals_76d2d9f9c01d426a8a97e1c2fa7fc835','2541252_rentals_027507df10b04ebbbb0e25edb83f135c','2541252_rentals_6c68ce77bf6a4f6d89b538b5143c8638','2541252_rentals_051b8b9635354d888ee4f56e338abc59','2541252_rentals_d8dd2df693bb4a2eb6d4ca0e45283600','2541252_rentals_8980811125094f59ba8fefb98248b805']}\n];\n\nconst BORROW = [['🧻','Towel','កន្សែង'],['☂️','Umbrella','ឆ័ត្រ'],['🔌','Phone charger','ខ្សែសាកទូរសព្ទ'],['💨','Hair dryer','ម៉ាស៊ីនផ្លុំសក់'],['👔','Iron','ឆ្នាំងអ៊ុត'],['🛏️','Extra pillow','ខ្នើយបន្ថែម'],['🧣','Extra blanket','ភួយបន្ថែម'],['🧼','Toiletries','សាប៊ូ / ច្រាសធ្មេញ']];\nconst BUY = [['💧','Drinking water','ទឹកសុទ្ធ'],['🥤','Cold drinks','ភេសជ្ជៈត្រជាក់'],['🧺','Laundry service','សេវាបោកអ៊ុត'],['🛵','Rent a motorbike','ជួលម៉ូតូ']];\nconst PROB = [['❄️','A/C not cold','ម៉ាស៊ីនត្រជាក់មិនត្រជាក់'],['🚿','Water / leak','ទឹក / លេចទឹក'],['🧻','No toilet paper','អស់ក្រដាសអនាម័យ'],['📶','Wi‑Fi problem','Wi‑Fi មិនដើរ'],['💡','Light / power','ភ្លើង / អគ្គិសនី'],['🧹','Clean my room','សម្អាតបន្ទប់']];\n\nconst T = {\n en:{tagline:'Kampot · Cambodia',hi:'Welcome',heroP:'Book, check in early, ask for anything — all in one place.',\n  tMoto:'Rent a motorbike',tMotoS:'Scoopy $8 · Air Blade $5 per day',motoSub:'Choose a bike and your dates. We arrange it with our partner rental shop.',perDay:'/ day',motoFrom:'From (date)',motoDays:'Days',motoRoomPhone:'Room No. or phone',motoTotal:'Total',motoNote:'The motorbikes belong to our partner rental shop. The shop asks you to leave your passport or ID card at the shop while you rent. Our team will confirm the bike and pick-up time with you.',motoSend:'Request this motorbike',doneMoto:'Thank you! Our team will check the bike with the rental shop and contact you shortly.',needMoto:'Please choose a motorbike',tRooms:'Rooms & booking',tRoomsS:'Photos & direct price',tCheck:'Check in early',tCheckS:'Send your details before arrival',tReq:'Room requests',tReqS:'Borrow items · drinks · fix a problem',tInfo:'Contact & info',tInfoS:'Chat with us · map · hours',\n  roomsSub:'Direct price — cheaper than booking sites. Swipe the photos.',fCin:'Check-in',fCout:'Check-out',nights:'nights',night:'night',total:'Total',depositL:'Deposit (50%)',yourCode:'YOUR DISCOUNT CODE',copy:'Copy',copied:'Code copied',st1:'Your room is already selected — tap Next.',st2:'Fill in your name, country, phone and email.',st3:'Paste the code in “Promo code”, check the total shows {T}, then tap Submit.',goBook:'Copy code & open booking website',close:'Close',sbSub:'Same price. Pay a 50% deposit by QR, upload the receipt — our team books it for you and confirms.',fRoomType:'Room',qrHint:'Scan with ACLEDA, ABA or any KHQR bank app and pay the deposit:',fReceipt:'Payment receipt (screenshot)',sbHours:'Our team books rooms 6:00 AM – 12:00 midnight (Cambodia time). Need it held right now at night? use ① “Book instantly on our website”.',needReceipt:'Please upload your payment receipt.',badDates:'Please choose valid dates.',doneBook:'Thank you! We received your booking request and receipt. Our team will confirm with you soon.',perNight:'/ night',bookNow:'① Book instantly on our website',askStaff:'② Book here — our team arranges it',deposit:'50% deposit holds your room. Same price both ways.',\n  checkSub:'Fill this before you arrive so check-in takes 1 minute. Our staff will finish the rest at reception.',\n  docRule:'🛂 Foreign guests: passport + visa. Cambodian guests: national ID card. Without these documents we cannot check you in.',\n  fName:'Full name (as in passport)',fNat:'Nationality',fPass:'Passport / ID No.',fPhone:'Phone / Telegram / WhatsApp',fSource:'Booked via',fArr:'Arrival date',fTime:'Arrival time',fNights:'Nights',fGuests:'Guests',fTrans:'Coming by',fOthers:'Other guests (name · nationality · passport No.)',fOthersP:'One guest per line',fDocs:'Photos of passport / visa / ID (you and everyone sharing the room)',mateRule:'👥 Sharing the room with a partner or friend? Please bring their passport / ID too — every guest staying in the room must show an ID at check-in.',fNote:'Note',fRoom:'Room No.',fPhotoOpt:'Photo (optional)',\n  trCar:'Car',trMoto:'Motorbike',trTuk:'Tuk-tuk',trBus:'Bus / Van',trTaxi:'Taxi',other:'Other',\n  reqSub:'Tap what you need — our 24‑hour reception gets it right away.',borrow:'Borrow',buy:'Buy / services',problem:'Report a problem',reqNoteP:'Anything else?',\n  send:'Send',sending:'Sending…',thanks:'Sent — thank you!',back:'Back to home',\n  doneCheck:'We received your details. See you soon at A&J Kampot Boutique!',doneReq:'Reception received your request and will come to your room shortly.',\n  needDoc:'Please add at least one photo of your passport / ID.',needItem:'Please choose at least one item or write a note.',fail:'Could not send. Opening Telegram chat instead…',\n  infoSub:'Reception is open 24 hours. Message us any time.',call:'Call reception',call24:'24 hours · +855 87 882 020',map:'Map',mapS:'Kampot town, near the Durian roundabout',ciTitle:'Check-in 14:00 · Check-out 12:00',ciS:'Early arrival? Leave your luggage with us.',pool:'Swimming pool',cafe:'Café corner',cafeS:'8:00 – 17:00 · you may bring outside food',gate:'Front gate closes 1:00 AM',gateS:'Message reception and we open it 24h',moto:'Motorbike rental & laundry',motoS:'Ask at reception or in Room requests',smoke:'No smoking inside',smokeS:'Balcony rooms or outside downstairs',\n  nHome:'Home',nRooms:'Rooms',nCheck:'Check-in',nReq:'Requests',nInfo:'Contact'},\n km:{tagline:'កំពត · កម្ពុជា',hi:'សូមស្វាគមន៍',heroP:'កក់បន្ទប់ Check-in ជាមុន និងស្នើសុំអ្វីក៏បាន — នៅកន្លែងតែមួយ។',\n  tMoto:'ជួលម៉ូតូ',tMotoS:'Scoopy $8 · Air Blade $5 ក្នុងមួយថ្ងៃ',motoSub:'ជ្រើសរើសម៉ូតូ និងថ្ងៃដែលបងចង់ជួល។ ខាងប្អូននឹងរៀបចំជាមួយហាងជួលម៉ូតូដៃគូជូនបង។',perDay:'/ ថ្ងៃ',motoFrom:'ចាប់ពីថ្ងៃ',motoDays:'ចំនួនថ្ងៃ',motoRoomPhone:'លេខបន្ទប់ ឬលេខទូរស័ព្ទ',motoTotal:'សរុប',motoNote:'ម៉ូតូជារបស់ហាងជួលម៉ូតូដៃគូ។ ហាងតម្រូវឲ្យបងទុកលិខិតឆ្លងដែន ឬអត្តសញ្ញាណប័ណ្ណនៅហាង ក្នុងពេលជួល។ ខាងប្អូននឹងទាក់ទងបងដើម្បីបញ្ជាក់ម៉ូតូ និងម៉ោងទទួលម៉ូតូ។',motoSend:'ស្នើសុំជួលម៉ូតូនេះ',doneMoto:'អរគុណបង! ខាងប្អូននឹងពិនិត្យម៉ូតូជាមួយហាង ហើយទាក់ទងបងឆាប់ៗ។',needMoto:'សូមជ្រើសរើសម៉ូតូ',tRooms:'បន្ទប់ និងការកក់',tRoomsS:'រូបភាព និងតម្លៃផ្ទាល់',tCheck:'Check-in ជាមុន',tCheckS:'ផ្ញើព័ត៌មានមុនពេលមកដល់',tReq:'សំណើក្នុងបន្ទប់',tReqS:'ខ្ចីរបស់ · ភេសជ្ជៈ · រាយការណ៍បញ្ហា',tInfo:'ទំនាក់ទំនង និងព័ត៌មាន',tInfoS:'ឆាតជាមួយយើង · ផែនទី · ម៉ោង',\n  roomsSub:'តម្លៃផ្ទាល់ — ថោកជាងវេបសាយកក់ផ្សេងៗ។ អូសមើលរូបភាព។',fCin:'ថ្ងៃចូល',fCout:'ថ្ងៃចេញ',nights:'យប់',night:'យប់',total:'សរុប',depositL:'ប្រាក់កក់ (50%)',yourCode:'លេខកូដបញ្ចុះតម្លៃ',copy:'ចម្លង',copied:'បានចម្លងកូដ',st1:'បន្ទប់ត្រូវបានរើសរួចហើយ — ចុច Next។',st2:'បំពេញឈ្មោះ ប្រទេស ទូរសព្ទ និងអ៊ីមែល។',st3:'បិទភ្ជាប់កូដក្នុង “Promo code” ពិនិត្យថាតម្លៃសរុបគឺ {T} រួចចុច Submit។',goBook:'ចម្លងកូដ ហើយបើកវេបសាយកក់',close:'បិទ',sbSub:'តម្លៃដូចគ្នា។ បង់ប្រាក់កក់ 50% តាម QR ហើយ upload វិក្កយបត្រ — បុគ្គលិកនឹងកក់ជូន និងបញ្ជាក់ទៅអ្នក។',fRoomType:'បន្ទប់',qrHint:'ស្កេនដោយ ACLEDA, ABA ឬកម្មវិធីធនាគារ KHQR ណាមួយ ហើយបង់ប្រាក់កក់៖',fReceipt:'វិក្កយបត្របង់ប្រាក់ (រូបថតអេក្រង់)',sbHours:'បុគ្គលិកកក់បន្ទប់ម៉ោង 6:00 ព្រឹក – 12:00 យប់ (ម៉ោងកម្ពុជា)។ បើត្រូវការរក្សាបន្ទប់ភ្លាមនៅពេលយប់ សូមចុច ① “កក់ភ្លាមៗតាមវេបសាយ”។',needReceipt:'សូម upload វិក្កយបត្របង់ប្រាក់។',badDates:'សូមរើសថ្ងៃឱ្យត្រឹមត្រូវ។',doneBook:'អរគុណ! យើងបានទទួលសំណើកក់ និងវិក្កយបត្ររបស់អ្នក។ បុគ្គលិកនឹងបញ្ជាក់ទៅអ្នកឆាប់ៗ។',perNight:'/ យប់',bookNow:'① កក់ភ្លាមៗតាមវេបសាយ',askStaff:'② កក់នៅទីនេះ — បុគ្គលិករៀបចំជូន',deposit:'បង់ប្រាក់កក់ 50% ដើម្បីរក្សាបន្ទប់។ តម្លៃដូចគ្នាទាំងពីរ។',\n  checkSub:'បំពេញមុនពេលមកដល់ ដើម្បីឱ្យ Check-in ត្រឹមតែ 1 នាទី។ បុគ្គលិកនឹងបំពេញបន្ថែមនៅកន្លែងទទួលភ្ញៀវ។',\n  docRule:'🛂 ភ្ញៀវបរទេស៖ លិខិតឆ្លងដែន + ទិដ្ឋាការ។ ភ្ញៀវខ្មែរ៖ អត្តសញ្ញាណប័ណ្ណ។ បើគ្មានឯកសារទាំងនេះ មិនអាច Check-in បានទេ។',\n  fName:'ឈ្មោះពេញ (ដូចក្នុងលិខិតឆ្លងដែន)',fNat:'សញ្ជាតិ',fPass:'លេខលិខិតឆ្លងដែន / អត្តសញ្ញាណប័ណ្ណ',fPhone:'ទូរសព្ទ / Telegram / WhatsApp',fSource:'កក់តាម',fArr:'ថ្ងៃមកដល់',fTime:'ម៉ោងមកដល់',fNights:'ចំនួនយប់',fGuests:'ចំនួនភ្ញៀវ',fTrans:'មកដោយ',fOthers:'ភ្ញៀវផ្សេងទៀត (ឈ្មោះ · សញ្ជាតិ · លេខលិខិត)',fOthersP:'ភ្ញៀវម្នាក់ មួយបន្ទាត់',fDocs:'រូបលិខិតឆ្លងដែន / ទិដ្ឋាការ / អត្តសញ្ញាណប័ណ្ណ (របស់អ្នក និងដៃគូដែលស្នាក់បន្ទប់ជាមួយ)',mateRule:'👥 បើមានដៃគូ ឬមិត្តភក្តិស្នាក់នៅបន្ទប់ជាមួយ សូមត្រៀមអត្តសញ្ញាណប័ណ្ណ ឬលិខិតឆ្លងដែនរបស់ដៃគូមកជាមួយផង — ភ្ញៀវគ្រប់រូបដែលស្នាក់នៅក្នុងបន្ទប់ ត្រូវបង្ហាញអត្តសញ្ញាណពេល Check-in។',fNote:'កំណត់ចំណាំ',fRoom:'លេខបន្ទប់',fPhotoOpt:'រូបភាព (មិនចាំបាច់)',\n  trCar:'ឡាន',trMoto:'ម៉ូតូ',trTuk:'តុកតុក',trBus:'ឡានក្រុង / វ៉ាន់',trTaxi:'តាក់ស៊ី',other:'ផ្សេងៗ',\n  reqSub:'ចុចរើសអ្វីដែលត្រូវការ — កន្លែងទទួលភ្ញៀវ 24 ម៉ោង ទទួលបានភ្លាមៗ។',borrow:'ខ្ចី',buy:'ទិញ / សេវា',problem:'រាយការណ៍បញ្ហា',reqNoteP:'មានអ្វីទៀតទេ?',\n  send:'ផ្ញើ',sending:'កំពុងផ្ញើ…',thanks:'បានផ្ញើរួច — អរគុណ!',back:'ត្រឡប់ទៅទំព័រដើម',\n  doneCheck:'យើងបានទទួលព័ត៌មានរបស់អ្នកហើយ។ ជួបគ្នាឆាប់ៗនៅ A&J Kampot Boutique!',doneReq:'កន្លែងទទួលភ្ញៀវបានទទួលសំណើ ហើយនឹងមកបន្ទប់អ្នកឆាប់ៗ។',\n  needDoc:'សូមបញ្ចូលរូបលិខិតឆ្លងដែន / អត្តសញ្ញាណប័ណ្ណ យ៉ាងហោចណាស់ 1។',needItem:'សូមរើសយ៉ាងហោចណាស់ 1 ឬសរសេរកំណត់ចំណាំ។',fail:'ផ្ញើមិនបាន។ កំពុងបើកឆាត Telegram ជំនួស…',\n  infoSub:'កន្លែងទទួលភ្ញៀវបើក 24 ម៉ោង។ ផ្ញើសារមកបានគ្រប់ពេល។',call:'ទូរសព្ទទៅកន្លែងទទួលភ្ញៀវ',call24:'24 ម៉ោង · +855 87 882 020',map:'ផែនទី',mapS:'ក្នុងក្រុងកំពត ជិតរង្វង់មូលធុរេន',ciTitle:'Check-in 14:00 · Check-out 12:00',ciS:'មកដល់មុន? អាចផ្ញើឥវ៉ាន់ជាមួយយើងបាន។',pool:'អាងហែលទឹក',cafe:'ហាងកាហ្វេ',cafeS:'8:00 – 17:00 · អាចយកម្ហូបពីខាងក្រៅមកញ៉ាំបាន',gate:'ទ្វារធំបិទម៉ោង 1:00 យប់',gateS:'ផ្ញើសារមក យើងបើកឱ្យបាន 24 ម៉ោង',moto:'ជួលម៉ូតូ និងបោកអ៊ុត',motoS:'សួរនៅកន្លែងទទួលភ្ញៀវ ឬក្នុងសំណើក្នុងបន្ទប់',smoke:'ហាមជក់បារីខាងក្នុង',smokeS:'បន្ទប់មានវេរ៉ង់ដា ឬខាងក្រៅជាន់ក្រោម',\n  nHome:'ដើម',nRooms:'បន្ទប់',nCheck:'Check-in',nReq:'សំណើ',nInfo:'ទំនាក់ទំនង'}\n};\n\nconst tg = window.Telegram && Telegram.WebApp;\nconst tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;\nlet lang = 'en';\ntry { lang = localStorage.getItem('aj_lang') || ((tgUser && tgUser.language_code==='km') || (navigator.language||'').startsWith('km') ? 'km' : 'en'); } catch(e){}\nconst qs = s => document.querySelector(s), qsa = s => [...document.querySelectorAll(s)];\nconst t = k => (T[lang][k] ?? T.en[k] ?? k);\nconst esc = x => String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;');\nconst dual = (km, en) => lang==='km' && en && en!==km ? `${esc(km)}<span class=\"en\">${esc(en)}</span>` : esc(lang==='km'?km:en);\nconst tb = k => dual(T.km[k] ?? T.en[k] ?? k, T.en[k] ?? k);   // bilingual HTML\nconst tx = k => (lang==='km' && T.en[k] && T.en[k]!==T.km[k]) ? `${t(k)} / ${T.en[k]}` : t(k); // bilingual plain text\n\nif (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor && tg.setHeaderColor('#ffffff'); } catch(e){} }\n\nfunction applyLang(){\n  document.body.classList.toggle('km', lang==='km');\n  document.documentElement.lang = lang;\n  qs('#langBtn').textContent = lang==='km' ? 'English' : 'ខ្មែរ';\n  qsa('[data-t]').forEach(e => { if (e.tagName==='OPTION') e.textContent = tx(e.dataset.t); else e.innerHTML = tb(e.dataset.t); });\n  qsa('[data-tp]').forEach(e => { e.placeholder = t(e.dataset.tp); });\n  const n = tgUser ? (tgUser.first_name||'') : '';\n  qs('#hello').textContent = tx('hi') + (n ? ', ' + n : '') + ' 👋';\n  renderRooms(); renderItems(); if (qs('#sbRoom').options.length) { fillRoomSelect(); sbCalc(); }\n}\nqs('#langBtn').onclick = () => { lang = lang==='km'?'en':'km'; try{localStorage.setItem('aj_lang',lang)}catch(e){} applyLang(); };\n\nfunction go(p){\n  qsa('.page').forEach(e => e.classList.toggle('on', e.id==='p-'+p));\n  qsa('nav button').forEach(b => b.classList.toggle('on', b.dataset.go===p));\n  window.scrollTo(0,0);\n  if (tg && tg.BackButton) { p==='home' ? tg.BackButton.hide() : tg.BackButton.show(); }\n}\ndocument.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });\nif (tg && tg.BackButton) tg.BackButton.onClick(() => go('home'));\n\nfunction openLink(url){\n  if (tg && tg.openLink && !url.startsWith('https://t.me')) { tg.openLink(url); return; }\n  if (tg && tg.openTelegramLink && url.startsWith('https://t.me')) { tg.openTelegramLink(url); return; }\n  window.open(url, '_blank');\n}\ndocument.addEventListener('click', e => {\n  const a = e.target.closest('a[target=_blank]');\n  if (a && tg) { e.preventDefault(); openLink(a.href); }\n});\n\n// ---- dates ----\nconst iso = d => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);\nconst addDays = (s,n) => { const d = new Date(s+'T00:00:00'); d.setDate(d.getDate()+n); return iso(d); };\nconst nightsOf = (a,b) => Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00'))/86400000);\nconst money = n => '$' + (Math.round(n*100)/100).toFixed(2).replace(/\\.00$/,'');\nconst today = iso(new Date());\nqs('#cin').value = today; qs('#cout').value = addDays(today,1);\nqs('#cin').min = today; qs('#cout').min = addDays(today,1);\nfunction stay(){\n  let a = qs('#cin').value || today, b = qs('#cout').value;\n  if (!b || nightsOf(a,b) < 1) { b = addDays(a,1); qs('#cout').value = b; }\n  qs('#cout').min = addDays(a,1);\n  return { a, b, n: nightsOf(a,b), g: Math.max(1, +qs('#gst').value || 1) };\n}\n['#cin','#cout','#gst'].forEach(id => qs(id).addEventListener('change', renderRooms));\n\nfunction renderRooms(){\n  const st = stay();\n  qs('#roomList').innerHTML = ROOMS.map(r => `\n   <div class=\"card\">\n    <div class=\"pics\">${r.pics.map(p=>`<img loading=\"lazy\" src=\"${IMG+p}.jpg\" alt=\"\">`).join('')}</div>\n    <div class=\"cb\">\n     <div class=\"row\"><h3>${dual(r.km, r.en)}</h3><div class=\"price\"><s>$${r.was}</s>$${r.price}<small style=\"font-size:12px;font-weight:500;color:var(--mute)\"> ${t('perNight')}</small></div></div>\n     <div class=\"meta\">${dual(r.kmM, r.enM)} · ${r.pics.length} 📷</div>\n     <div class=\"tot\">${tx('total')} ${st.n} ${st.n>1?t('nights'):t('night')}: <b>${money(r.price*st.n)}</b> · ${tx('depositL')}: <b>${money(r.price*st.n/2)}</b></div>\n     <button class=\"btn p\" data-book=\"${r.id}\">${tb('bookNow')}</button>\n     <button class=\"btn s\" data-staff=\"${r.id}\">${tb('askStaff')}</button>\n    </div>\n   </div>`).join('') + `<p class=\"sub\">${tb('deposit')}</p>`;\n}\n\n// ---- Book now (instant, Nobeds) ----\nlet cur = null;\nfunction nobedsUrl(r, st){ return `${NOBEDS}?arrdate=${st.a}&depdate=${st.b}&guests=${Math.min(st.g, r.max)}&roomselect=${r.rid}`; }\nfunction openBookModal(id){\n  cur = ROOMS.find(r => r.id===id); const st = stay();\n  qs('#bmTitle').innerHTML = dual(cur.km, cur.en);\n  qs('#bmSum').innerHTML = `<div><span>${t('fCin')} → ${t('fCout')}</span><b>${st.a} → ${st.b}</b></div><div><span>${t('fGuests')}</span><b>${st.g}</b></div><div><span>${t('total')} (${st.n} ${st.n>1?t('nights'):t('night')})</span><b>${money(cur.price*st.n)}</b></div>`;\n  qs('#bmCode').textContent = 'PROMO_' + cur.id;\n  qs('#bmSt3').innerHTML = tb('st3').replace(/\\{T\\}/g, money(cur.price*st.n));\n  qs('#bookModal').classList.add('on');\n}\nasync function copyCode(){\n  const c = qs('#bmCode').textContent;\n  try { await navigator.clipboard.writeText(c); }\n  catch(e){ const ta=document.createElement('textarea'); ta.value=c; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy')}catch(_){} ta.remove(); }\n  toast(tx('copied') + ': ' + c);\n}\nqs('#bmCopy').onclick = copyCode;\nqs('#bmGo').onclick = async () => { await copyCode(); openLink(nobedsUrl(cur, stay())); };\nqs('#bmClose').onclick = () => qs('#bookModal').classList.remove('on');\nqs('#bmStaff').onclick = () => { qs('#bookModal').classList.remove('on'); openStaff(cur.id); };\nqs('#bookModal').addEventListener('click', e => { if (e.target.id==='bookModal') qs('#bookModal').classList.remove('on'); });\n\n// ---- Ask our team (in-app form + KHQR + receipt) ----\nfunction fillRoomSelect(sel){\n  const v = qs('#sbRoom').value;\n  qs('#sbRoom').innerHTML = ROOMS.map(r => `<option value=\"${r.id}\">${lang==='km'?r.km+' / '+r.en:r.en} — $${r.price}${t('perNight')}</option>`).join('');\n  qs('#sbRoom').value = sel || v || 'SR';\n}\nfunction sbCalc(){\n  const r = ROOMS.find(x => x.id===qs('#sbRoom').value) || ROOMS[0];\n  let a = qs('#sbCin').value, b = qs('#sbCout').value;\n  if (a && (!b || nightsOf(a,b) < 1)) { b = addDays(a,1); qs('#sbCout').value = b; }\n  const n = a && b ? nightsOf(a,b) : 0;\n  qs('#sbSum').innerHTML = `<div><span>${n} ${n>1?t('nights'):t('night')} × $${r.price}</span><b>${money(r.price*n)}</b></div><div><span>${tx('depositL')}</span><b>${money(r.price*n/2)}</b></div>`;\n  qs('#sbDep').textContent = n ? money(r.price*n/2) : '';\n  return { r, a, b, n };\n}\n['#sbRoom','#sbCin','#sbCout'].forEach(id => qs(id).addEventListener('change', sbCalc));\nfunction openStaff(id){\n  const st = stay();\n  fillRoomSelect(id);\n  qs('#sbCin').value = st.a; qs('#sbCout').value = st.b; qs('#sbGst').value = st.g;\n  qs('#sbCin').min = today;\n  sbCalc(); go('staffbook');\n}\nfunction drawQR(){\n  try { const q = qrcode(0,'M'); q.addData(KHQR); q.make(); qs('#qr').innerHTML = q.createSvgTag({cellSize:4, margin:2, scalable:true}); }\n  catch(e){ qs('#qr').textContent = 'KHQR'; }\n}\ndocument.addEventListener('click', e => {\n  const bk = e.target.closest('[data-book]'), sf = e.target.closest('[data-staff]');\n  if (bk) openBookModal(bk.dataset.book);\n  if (sf) openStaff(sf.dataset.staff);\n});\n\nfunction renderItems(){\n  const mk = (el, arr) => { const keep = new Set(qsa('#'+el+' .item.on').map(x=>x.dataset.v));\n    qs('#'+el).innerHTML = arr.map(a => `<div class=\"item${keep.has(a[1])?' on':''}\" data-v=\"${a[1]}\"><span class=\"e\">${a[0]}</span><span>${dual(a[2], a[1])}</span></div>`).join(''); };\n  mk('itBorrow', BORROW); mk('itBuy', BUY); mk('itProb', PROB);\n}\ndocument.addEventListener('click', e => { const it = e.target.closest('.item'); if (it) it.classList.toggle('on'); });\n\n// ---- photos (compressed in browser) ----\nconst photoSets = { phCheck: [], phReq: [], phBook: [] };\nfunction initPhotos(id, max){\n  const box = qs('#'+id);\n  const input = document.createElement('input'); input.type='file'; input.accept='image/*'; input.multiple=true; input.style.display='none';\n  document.body.appendChild(input);\n  const draw = () => {\n    box.innerHTML = photoSets[id].map((p,i)=>`<div class=\"ph\"><img src=\"${p.url}\"><b data-del=\"${id}:${i}\">✕</b></div>`).join('') +\n      (photoSets[id].length < max ? `<div class=\"addph\" data-add=\"${id}\">＋</div>` : '');\n  };\n  box.addEventListener('click', e => {\n    if (e.target.dataset.add) input.click();\n    if (e.target.dataset.del) { photoSets[id].splice(+e.target.dataset.del.split(':')[1],1); draw(); }\n  });\n  input.onchange = async () => {\n    for (const f of [...input.files].slice(0, max - photoSets[id].length)) {\n      try { const blob = await shrink(f); photoSets[id].push({blob, url: URL.createObjectURL(blob)}); } catch(e){}\n    }\n    input.value=''; draw();\n  };\n  draw();\n}\nfunction shrink(file){\n  return new Promise((res, rej) => {\n    const img = new Image(); img.onload = () => {\n      const m = 1600, s = Math.min(1, m/Math.max(img.width, img.height));\n      const c = document.createElement('canvas'); c.width = Math.round(img.width*s); c.height = Math.round(img.height*s);\n      c.getContext('2d').drawImage(img,0,0,c.width,c.height);\n      c.toBlob(b => b ? res(b) : rej(), 'image/jpeg', 0.82);\n    }; img.onerror = rej; img.src = URL.createObjectURL(file);\n  });\n}\ninitPhotos('phCheck', 8); initPhotos('phReq', 3);\n\nfunction toast(m){ const el=qs('#toast'); el.textContent=m; el.style.display='block'; clearTimeout(toast.t); toast.t=setTimeout(()=>el.style.display='none',3500); }\n\nasync function send(kind, text, photos, btn, doneKey, data){\n  btn.disabled = true; const old = btn.innerHTML; btn.textContent = tx('sending');\n  try {\n    const fd = new FormData();\n    fd.append('kind', kind); fd.append('text', text);\n    if (data) fd.append('data', JSON.stringify(data)); try { const cq = new URLSearchParams(location.search).get('c'); if (cq) fd.append('chat', cq); } catch (e) {}\n    if (tg && tg.initData) fd.append('initData', tg.initData);\n    photos.forEach((p,i) => fd.append('photo'+i, p.blob, 'photo'+i+'.jpg'));\n    const r = await fetch(API, { method:'POST', body: fd });\n    const j = await r.json().catch(()=>({}));\n    if (!r.ok || !j.ok) throw new Error(j.error || r.status);\n    qs('#doneMsg').innerHTML = tb(doneKey); go('done');\n    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');\n    return true;\n  } catch(err) {\n    toast(tx('fail'));\n    setTimeout(()=> openLink(TG_CHAT), 1200);\n    return false;\n  } finally { btn.disabled = false; btn.innerHTML = old; }\n}\nconst who = () => tgUser ? `\\nTelegram: ${tgUser.first_name||''} ${tgUser.last_name||''}${tgUser.username?' @'+tgUser.username:''} (id ${tgUser.id})` : '';\n\nqs('#fCheck').onsubmit = async e => {\n  e.preventDefault();\n  if (!photoSets.phCheck.length) { toast(tx('needDoc')); return; }\n  const d = Object.fromEntries(new FormData(e.target));\n  const txt = `📝 EARLY CHECK-IN\\n` +\n   `Name: ${d.name}\\nNationality: ${d.nationality}\\nPassport/ID: ${d.passport}\\nPhone: ${d.phone}\\nBooked via: ${d.source}\\n` +\n   `Arrival: ${d.arrival} ${d.time||''}\\nNights: ${d.nights} · Guests: ${d.guests}\\nComing by: ${d.transport}` +\n   (d.others ? `\\nOther guests:\\n${d.others}` : '') + (d.note ? `\\nNote: ${d.note}` : '') + who();\n  const data = Object.assign({}, d, tgUser ? { tg: { id: tgUser.id, name: ((tgUser.first_name||'')+' '+(tgUser.last_name||'')).trim(), username: tgUser.username||'' } } : {});\n  if (await send('checkin', txt, photoSets.phCheck, e.target.querySelector('button[type=submit]'), 'doneCheck', data)) {\n    e.target.reset(); photoSets.phCheck.length = 0; initPhotos('phCheck', 8);\n  }\n};\n// Motorbike rental\nfunction motoCalc(){ const on=qs('#itMoto .item.on'); const f=qs('#fMoto'); const d=Math.max(1,parseInt(f.days.value)||1); qs('#motoTotal').textContent = on ? tx('motoTotal')+': $'+(Number(on.dataset.p)*d)+' ('+on.dataset.v+' × '+d+')' : ''; }\nqsa('#itMoto .item').forEach(it => it.onclick = () => { qsa('#itMoto .item').forEach(x=>x.classList.remove('on')); it.classList.add('on'); motoCalc(); });\nqs('#fMoto').addEventListener('input', motoCalc);\ntry { const t=new Date(Date.now()+7*3600000); t.setUTCDate(t.getUTCDate()+1); qs('#fMoto [name=from]').value=t.toISOString().slice(0,10); } catch(e){}\nqs('#fMoto').onsubmit = async e => {\n  e.preventDefault();\n  const on = qs('#itMoto .item.on'); if (!on) { toast(tx('needMoto')); return; }\n  const d = Object.fromEntries(new FormData(e.target)); const days = Math.max(1, parseInt(d.days)||1);\n  const txt = `🛵 MOTORBIKE RENTAL REQUEST\\nBike: ${on.dataset.v} ($${on.dataset.p}/day)\\nFrom: ${d.from} · ${days} day(s) · total $${Number(on.dataset.p)*days}\\nName: ${d.name}` + (d.contact ? `\\nRoom/phone: ${d.contact}` : '') + (d.note ? `\\nNote: ${d.note}` : '') + `\\n(Partner shop keeps the guest's passport/ID)` + who();\n  if (await send('request', txt, [], e.target.querySelector('button[type=submit]'), 'doneMoto')) { e.target.reset(); motoCalc(); }\n};\n\nqs('#fReq').onsubmit = async e => {\n  e.preventDefault();\n  const d = Object.fromEntries(new FormData(e.target));\n  const pick = id => qsa('#'+id+' .item.on').map(x=>x.dataset.v);\n  const b = pick('itBorrow'), y = pick('itBuy'), p = pick('itProb');\n  if (!b.length && !y.length && !p.length && !d.note) { toast(tx('needItem')); return; }\n  const txt = `🧺 ROOM ${d.room} REQUEST` + (d.name ? ` — ${d.name}` : '') +\n   (b.length ? `\\nBorrow: ${b.join(', ')}` : '') + (y.length ? `\\nBuy/Service: ${y.join(', ')}` : '') +\n   (p.length ? `\\n⚠️ Problem: ${p.join(', ')}` : '') + (d.note ? `\\nNote: ${d.note}` : '') + who();\n  if (await send('request', txt, photoSets.phReq, e.target.querySelector('button[type=submit]'), 'doneReq')) {\n    e.target.reset(); qsa('.item.on').forEach(x=>x.classList.remove('on')); photoSets.phReq.length = 0; initPhotos('phReq', 3);\n  }\n};\n\ninitPhotos('phBook', 2);\nqs('#fBook').onsubmit = async e => {\n  e.preventDefault();\n  const c = sbCalc();\n  if (!c.n || c.n < 1) { toast(tx('badDates')); return; }\n  if (!photoSets.phBook.length) { toast(tx('needReceipt')); return; }\n  const d = Object.fromEntries(new FormData(e.target));\n  const txt = `🛏️ BOOKING REQUEST (book for guest)\\nRoom: ${c.r.en}\\nDates: ${c.a} → ${c.b} (${c.n} night${c.n>1?'s':''})\\nGuests: ${d.guests}` + (d.time?`\\nArrival time: ${d.time}`:'') +\n   `\\nTotal: ${money(c.r.price*c.n)} · Deposit 50%: ${money(c.r.price*c.n/2)} (receipt attached)\\nName: ${d.name}\\nCountry: ${d.country||'-'}\\nPhone: ${d.phone}\\nEmail: ${d.email||'-'}` + (d.note?`\\nNote: ${d.note}`:'') + who();\n  if (await send('booking', txt, photoSets.phBook, e.target.querySelector('button[type=submit]'), 'doneBook', {room:c.r.en, cin:c.a, cout:c.b, nights:c.n, guests:d.guests, time:d.time||'', name:d.name, country:d.country||'', phone:d.phone, email:d.email||'', note:d.note||'', total:c.r.price*c.n, deposit:c.r.price*c.n/2})) {\n    e.target.reset(); photoSets.phBook.length = 0; initPhotos('phBook', 2);\n  }\n};\n\n// Remember room number for in-house guests\ntry { const rm = localStorage.getItem('aj_room'); if (rm) qs('#fReq [name=room]').value = rm;\n  qs('#fReq [name=room]').addEventListener('change', e => localStorage.setItem('aj_room', e.target.value)); } catch(e){}\n// Deep links: ?page=request&room=203  (for QR codes in each room)\nconst q = new URLSearchParams(location.search);\nconst sp = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || q.get('page');\nif (q.get('room')) qs('#fReq [name=room]').value = q.get('room');\nif (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param && /^room\\d+$/.test(sp)) { qs('#fReq [name=room]').value = sp.slice(4); }\nconst startPage = sp && /^room\\d+$/.test(sp) ? 'request' : sp;\n\ndrawQR();\napplyLang(); motoCalc();\nif (startPage && qs('#p-'+startPage)) go(startPage);\n</script>\n<script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href')||'';var w=window.Telegram&&window.Telegram.WebApp;if(!w||!w.initData)return;if(h.indexOf('https://t.me/')===0){e.preventDefault();w.openTelegramLink(h);return;}if(h.indexOf('http')===0&&a.target==='_blank'){e.preventDefault();w.openLink(h);return;}if(h.indexOf('tel:')===0&&!/^(ios|android)$/.test(w.platform)){e.preventDefault();var n=h.slice(4);try{navigator.clipboard.writeText(n)}catch(x){}w.showAlert('📞 '+n+'  (copied)');}},true);</script>\n</body>\n</html>\n";

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(runCron(env, event.cron)); },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/tg/webhook' && request.method === 'POST') return handleTg(request, env, ctx);
    if (url.pathname === '/fb/webhook') return handleFb(request, env, url);
    if (url.pathname.startsWith('/st/')) return stickerResponse(url.pathname.slice(4));
    if (url.pathname === '/privacy') return new Response("<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Privacy Policy - A&J Kampot Boutique</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 18px;line-height:1.6;color:#1f2937}h1{color:#14254a}</style></head><body><h1>Privacy Policy</h1><p><b>A&J Kampot Boutique</b>, #163, Street 724, Krang Village, Kampot, Cambodia · ajkampotboutique@gmail.com · +855 87 882 020</p><p>We answer messages from guests on Telegram and Facebook Messenger with the help of an automated assistant, and we offer a Guest App for bookings, early check-in and requests.</p><h2>What we collect</h2><p>Your name, the messages you send us, and any details you choose to give us (phone number, email, nationality, travel dates, booking details, passport/ID photos for check-in, and payment receipts).</p><h2>How we use it</h2><p>Only to answer your questions, arrange your booking and check-in, and provide hotel services. Message history is kept for a few days to keep the conversation in context; check-in details are kept for up to 45 days in the app and then in our hotel records as required by Cambodian law.</p><h2>Sharing</h2><p>We do not sell your data. It is shared only with our staff and the service providers that run our systems (Meta, Telegram, Cloudflare, our booking system and AI providers used to draft replies).</p><h2>Your choices</h2><p>You can ask us at any time to see or delete your data by emailing ajkampotboutique@gmail.com or messaging us.</p><p>Last updated: November 2026</p></body></html>", { headers: { 'content-type': 'text/html; charset=utf-8' } });
    if (url.pathname === '/api/tgsetup') return tgSetup(env, url.origin);
    if (url.pathname === '/api/ota' && request.method === 'POST') return handleOtaIn(request, env);

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


// ===== Booking request: formatted Telegram message + PDF + email + A&J Hub =====
const LOGO_JPG = 'https://nobeds.app/uploads/1508197823_logo_c7f896293f154d0a9b8b8fd96a20ccee.jpg';
const BOOKING_EMAILS = ['ajkampotboutique@gmail.com', 'management.aj.18@gmail.com'];
const escH = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmtDay = (iso) => { try { return new Date(String(iso) + 'T00:00:00Z').toUTCString().slice(0, 16); } catch (e) { return String(iso || ''); } };
const money2 = (v) => '$' + (Math.round(Number(v || 0) * 100) / 100).toFixed(2).replace(/\.00$/, '');
function u8b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
const utf8b64 = (s) => u8b64(new TextEncoder().encode(s));
const wrap76 = (s) => s.replace(/(.{76})/g, '$1\r\n');
// Minimal PDF builder for Cloudflare Workers (no libraries). Helvetica text + JPEG images.
function jpegSize(u8) {
  let i = 2;
  while (i < u8.length) {
    if (u8[i] !== 0xFF) { i++; continue; }
    const m = u8[i + 1];
    const len = (u8[i + 2] << 8) | u8[i + 3];
    if ((m >= 0xC0 && m <= 0xC3) || (m >= 0xC5 && m <= 0xC7) || (m >= 0xC9 && m <= 0xCB) || (m >= 0xCD && m <= 0xCF)) {
      return { h: (u8[i + 5] << 8) | u8[i + 6], w: (u8[i + 7] << 8) | u8[i + 8] };
    }
    i += 2 + len;
  }
  return null;
}
function pdfText(s) {
  return String(s == null ? '' : s).replace(/[^\x20-\x7E\xA0-\xFF]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function buildPdf({ logo, title, subtitle, rows, footer, images }) {
  const enc = new TextEncoder();
  const chunks = []; let size = 0; const offs = [];
  const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); size += b.length; };
  const obj = (n, body) => { offs[n] = size; push(n + ' 0 obj\n'); body(); push('\nendobj\n'); };
  const W = 595, H = 842, M = 48;
  const imgs = [];
  if (logo) { const d = jpegSize(logo); if (d) imgs.push({ name: 'L', data: logo, ...d }); }
  (images || []).forEach((im, k) => { const d = jpegSize(im); if (d) imgs.push({ name: 'R' + k, data: im, ...d }); });
  // page 1 content
  let y = H - M; let c = '';
  const L = imgs.find(i => i.name === 'L');
  if (L) { const lh = 56, lw = lh * L.w / L.h; c += `q ${lw.toFixed(1)} 0 0 ${lh} ${M} ${y - lh} cm /L Do Q\n`; }
  c += `BT /F2 18 Tf 0.08 0.16 0.33 rg ${M + (L ? 130 : 0)} ${y - 24} Td (${pdfText(title)}) Tj ET\n`;
  c += `BT /F1 10 Tf 0.35 0.35 0.35 rg ${M + (L ? 130 : 0)} ${y - 42} Td (${pdfText(subtitle)}) Tj ET\n`;
  y -= 76;
  c += `0.85 0.85 0.85 RG 1 w ${M} ${y} m ${W - M} ${y} l S\n`;
  y -= 26;
  for (const r of rows) {
    if (r.section) {
      y -= 6;
      c += `0.93 0.95 0.98 rg ${M} ${y - 6} ${W - 2 * M} 22 re f\n`;
      c += `BT /F2 11 Tf 0.08 0.16 0.33 rg ${M + 8} ${y + 1} Td (${pdfText(r.section)}) Tj ET\n`;
      y -= 28; continue;
    }
    c += `BT /F1 10.5 Tf 0.4 0.4 0.4 rg ${M + 8} ${y} Td (${pdfText(r.k)}) Tj ET\n`;
    const val = pdfText(r.v);
    const lines = []; let cur = '';
    for (const w of val.split(' ')) { if ((cur + ' ' + w).length > 58) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
    lines.push(cur);
    lines.forEach((ln, k) => { c += `BT /${r.bold ? 'F2' : 'F1'} 10.5 Tf 0.1 0.1 0.1 rg ${M + 170} ${y - k * 14} Td (${ln}) Tj ET\n`; });
    y -= 20 + (lines.length - 1) * 14;
  }
  y -= 10;
  c += `0.85 0.85 0.85 RG 1 w ${M} ${y} m ${W - M} ${y} l S\n`;
  (footer || []).forEach((f, k) => { c += `BT /F1 9 Tf 0.45 0.45 0.45 rg ${M} ${y - 18 - k * 13} Td (${pdfText(f)}) Tj ET\n`; });
  const pages = [c];
  imgs.filter(i => i.name !== 'L').forEach((im, k) => {
    const maxW = W - 2 * M, maxH = H - 2 * M - 40;
    const s = Math.min(maxW / im.w, maxH / im.h);
    const w = im.w * s, h = im.h * s;
    pages.push(`BT /F2 13 Tf 0.08 0.16 0.33 rg ${M} ${H - M - 14} Td (${pdfText('Payment receipt / document ' + (k + 1))}) Tj ET\nq ${w.toFixed(1)} 0 0 ${h.toFixed(1)} ${M} ${(H - M - 34 - h).toFixed(1)} cm /${im.name} Do Q\n`);
  });
  // objects: 1 catalog, 2 pages, 3 F1, 4 F2, then images, then page+content pairs
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  let n = 5; const imgNum = {};
  imgs.forEach(im => { imgNum[im.name] = n++; });
  const pageNums = pages.map(() => { const p = n; n += 2; return p; });
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Kids [${pageNums.map(p => p + ' 0 R').join(' ')}] /Count ${pages.length} >>`));
  obj(3, () => push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'));
  obj(4, () => push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'));
  imgs.forEach(im => obj(imgNum[im.name], () => { push(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.data.length} >>\nstream\n`); push(im.data); push('\nendstream'); }));
  const xo = '<< ' + imgs.map(im => `/${im.name} ${imgNum[im.name]} 0 R`).join(' ') + ' >>';
  pages.forEach((pc, k) => {
    const p = pageNums[k];
    const bytes = Uint8Array.from(pc, ch => ch.charCodeAt(0) & 0xFF);
    obj(p, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject ${xo} >> /Contents ${p + 1} 0 R >>`));
    obj(p + 1, () => { push(`<< /Length ${bytes.length} >>\nstream\n`); push(bytes); push('\nendstream'); });
  });
  const xref = size;
  let x = `xref\n0 ${n}\n0000000000 65535 f \n`;
  for (let i = 1; i < n; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  push(x + `trailer\n<< /Size ${n} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(size); let o = 0; for (const ch of chunks) { out.set(ch, o); o += ch.length; }
  return out;
}

async function handleBooking(env, form, photos, via) {
  let d = {};
  try { d = JSON.parse(String(form.get('data') || '{}')); } catch (e) {}
  if (!d.name) return null; // old app version → use the plain message
  const c = (v, n) => String(v == null ? '' : v).slice(0, n || 300).trim();
  const now7 = new Date(Date.now() + 7 * 3600 * 1000);
  const ref = 'AJ' + now7.toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = { name: c(d.name, 80), country: c(d.country, 60), phone: c(d.phone, 40), email: c(d.email, 80), room: c(d.room, 60), cin: c(d.cin, 10), cout: c(d.cout, 10), nights: Number(d.nights) || 0, guests: c(d.guests, 4), time: c(d.time, 10), note: c(d.note, 500), total: Number(d.total) || 0, deposit: Number(d.deposit) || 0 };
  const api = `https://api.telegram.org/bot${env.BOT_TOKEN}`;
  // 1) Telegram message
  const msg = `🛏️ <b>NEW BOOKING REQUEST</b>\n<b>A&amp;J Kampot Boutique</b> · Ref <code>${ref}</code>\n\n` +
    `👤 <b>${escH(b.name)}</b>\n🌍 ${escH(b.country || '-')}\n📞 ${escH(b.phone)}\n✉️ ${escH(b.email || '-')}\n\n` +
    `🏨 <b>${escH(b.room)}</b>\n📅 Check-in: <b>${escH(fmtDay(b.cin))}</b>${b.time ? ' · arriving ' + escH(b.time) : ''}\n` +
    `📅 Check-out: <b>${escH(fmtDay(b.cout))}</b> (${b.nights} night${b.nights > 1 ? 's' : ''})\n👥 Guests: ${escH(b.guests)}\n\n` +
    `💵 Total: <b>${money2(b.total)}</b>\n💳 Deposit 50%: <b>${money2(b.deposit)}</b> · receipt attached\n` +
    (b.note ? `📝 Note: ${escH(b.note)}\n` : '') +
    `\n➡️ Check the deposit in ACLEDA, then tap the button below to block the room in Nobeds.\n📥 Added to A&amp;J Hub check-in form\n${escH(via)}`;
  let ck = '';
  try { const t = String(form.get('chat') || ''); if (t && env.PRE) ck = (await env.PRE.get('chatref:' + t)) || ''; } catch (e) {}
  if (!ck) { try { const u = JSON.parse(new URLSearchParams(String(form.get('initData') || '')).get('user') || 'null'); if (u && u.id) ck = 'd:' + u.id; } catch (e) {} }
  if (env.PRE) {
    await env.PRE.put('bk:' + ref, JSON.stringify({ b, at: Date.now(), ck, rc: photos.length > 0 }), { expirationTtl: TTL });
    if (ck) await env.PRE.put('bkchat:' + ck, ref, { expirationTtl: TTL });
  }
  const mj = await (await fetch(`${api}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: env.STAFF_CHAT_ID, text: msg, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '✅ បញ្ជាក់ និងបិទបន្ទប់ក្នុង Nobeds · Confirm & block', callback_data: 'nb:' + ref }]] } }) })).json();
  if (!mj.ok) return { ok: false, error: mj.description };
  if (photos.length && env.PRE) {
    let ab;
    try { ab = await nobedsBook(b, ref, 'auto (Guest App, receipt uploaded)'); } catch (e) { ab = { ok: false, why: String(e && e.message || e) }; }
    const rec = JSON.parse((await env.PRE.get('bk:' + ref)) || '{}');
    const tg = (m, p) => fetch(`${api}/${m}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) }).catch(() => {});
    if (ab.ok) {
      rec.nb = 'done'; rec.nbBy = 'auto'; rec.nbAt = Date.now();
      await tg('editMessageReplyMarkup', { chat_id: env.STAFF_CHAT_ID, message_id: mj.result.message_id, reply_markup: { inline_keyboard: [[{ text: '🔒 បានបិទក្នុង Nobeds ដោយស្វ័យប្រវត្តិ', callback_data: 'nb:' + ref }]] } });
      await tg('sendMessage', { chat_id: env.STAFF_CHAT_ID, reply_to_message_id: mj.result.message_id, text: `🔒 ${ref}: Bot បានបិទបន្ទប់ក្នុង Nobeds រួចហើយ (${b.room}, ${b.cin} → ${b.cout}, Promo)។\nសូមឆែកប្រាក់កក់ ${money2(b.deposit)} ក្នុង ACLEDA ហើយកត់ក្នុង Nobeds។ បើលុយមិនចូល ឬវិក្កយបត្រខុស សូម Cancel ការកក់នេះក្នុង Nobeds ហើយទាក់ទងភ្ញៀវ។` });
    } else {
      rec.nb = 'fail';
      await tg('sendMessage', { chat_id: env.STAFF_CHAT_ID, reply_to_message_id: mj.result.message_id, text: /not available/.test(String(ab.why)) ? `🚨 ${ref}: បន្ទប់ ${b.room} (${b.cin} → ${b.cout}) ពេញ ឬបិទក្នុង Nobeds ហើយ — Bot មិនបានកក់ទេ ដើម្បីកុំឲ្យកក់ជាន់ (overbook)។\nកុំបញ្ចូលដោយដៃក្នុង Nobeds។ សូមទាក់ទងភ្ញៀវភ្លាម ដើម្បីផ្ដល់បន្ទប់ប្រភេទផ្សេង ឬសងប្រាក់កក់វិញ។` : `⚠️ ${ref}: មិនអាចបិទក្នុង Nobeds ដោយស្វ័យប្រវត្តិបានទេ — ${ab.why}\nសូមឆែកបន្ទប់ទំនេរក្នុង Nobeds មុន ហើយបើនៅទំនេរ ចុចប៊ូតុង ឬបញ្ចូលដោយដៃ។` });
      if (/not available/.test(String(ab.why))) { try { await tellOwner(env, `🚨 [URGENT] ${ref} · ${b.name}: ${b.room} ${b.cin} → ${b.cout} ពេញក្នុង Nobeds ហើយ ភ្ញៀវបានបង់ប្រាក់កក់រួច។ Bot មិនបានកក់ទេ (ការពារ overbook)។ បុគ្គលិកត្រូវទាក់ទងភ្ញៀវ។`); } catch (e) {} }
    }
    await env.PRE.put('bk:' + ref, JSON.stringify(rec), { expirationTtl: TTL });
  }
  try { const rr = JSON.parse((await env.PRE.get('bk:' + ref)) || '{}'); await logEvent(env, { t: 'booking', ref, name: b.name, room: b.room, cin: b.cin, cout: b.cout, total: b.total, deposit: b.deposit, nb: rr.nb || '' }); await tellOwner(env, `🛏️ ការកក់ថ្មីពី App\n${ref} · ${b.name} · ${b.room}\n${b.cin} → ${b.cout} (${b.nights} យប់) · ${b.guests} នាក់\nសរុប $${b.total} · កក់ $${b.deposit}${photos.length ? ' (មានវិក្កយបត្រ)' : ' (គ្មានវិក្កយបត្រ)'}\n${rr.nb === 'done' ? '🔒 បិទក្នុង Nobeds រួច' : '⚠️ មិនទាន់បិទក្នុង Nobeds — បុគ្គលិកត្រូវឆែក'}`); } catch (e) { console.log('owner booking alert', e && e.message); }
  const replyTo = mj.result.message_id;
  // 2) PDF (logo + details + receipts)
  let pdf = null;
  try {
    let logo = null;
    try { const lr = await fetch(LOGO_JPG, { cf: { cacheTtl: 86400, cacheEverything: true } }); if (lr.ok) logo = new Uint8Array(await lr.arrayBuffer()); } catch (e) {}
    const imgs = [];
    for (const p of photos.slice(0, 4)) { try { imgs.push(new Uint8Array(await p.arrayBuffer())); } catch (e) {} }
    pdf = buildPdf({
      logo, title: 'Booking Request', subtitle: 'A&J Kampot Boutique  ·  Kampot, Cambodia  ·  +855 87 882 020',
      rows: [
        { k: 'Reference', v: ref, bold: true }, { k: 'Received', v: now7.toISOString().slice(0, 16).replace('T', ' ') + ' (Cambodia)' },
        { section: 'Guest' }, { k: 'Name', v: b.name, bold: true }, { k: 'Country', v: b.country || '-' }, { k: 'Phone', v: b.phone }, { k: 'Email', v: b.email || '-' },
        { section: 'Stay' }, { k: 'Room type', v: b.room, bold: true }, { k: 'Check-in', v: fmtDay(b.cin) + (b.time ? '  (arriving ' + b.time + ')' : '') }, { k: 'Check-out', v: fmtDay(b.cout) }, { k: 'Nights', v: String(b.nights) }, { k: 'Guests', v: String(b.guests) },
        { section: 'Payment' }, { k: 'Total', v: money2(b.total), bold: true }, { k: 'Deposit (50%)', v: money2(b.deposit) + '  -  receipt attached (' + imgs.length + ' file' + (imgs.length === 1 ? '' : 's') + ')' }, { k: 'Balance at check-in', v: money2(b.total - b.deposit) },
      ].concat(b.note ? [{ section: 'Note' }, { k: 'Guest note', v: b.note }] : []),
      footer: ['Status: REQUEST - not confirmed yet. Staff must check the payment and enter the booking in Nobeds.', 'Sent from the A&J Guest App · ' + via.replace(/[^\x20-\x7E]/g, '').trim()],
      images: imgs
    });
  } catch (e) { console.log('pdf error', e && e.message); }
  const fname = `Booking_${ref}_${b.name.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 30)}.pdf`;
  if (pdf) {
    const fd = new FormData();
    fd.append('chat_id', env.STAFF_CHAT_ID); fd.append('reply_to_message_id', String(replyTo));
    fd.append('caption', `📄 Booking ${ref} · ${b.name}`);
    fd.append('document', new Blob([pdf], { type: 'application/pdf' }), fname);
    const dr = await (await fetch(`${api}/sendDocument`, { method: 'POST', body: fd })).json().catch(() => ({}));
    if (!dr.ok) console.log('pdf send failed', JSON.stringify(dr).slice(0, 200));
  } else if (photos.length) {
    const fd = new FormData(); fd.append('chat_id', env.STAFF_CHAT_ID); fd.append('reply_to_message_id', String(replyTo)); fd.append('photo', photos[0], 'receipt.jpg');
    await fetch(`${api}/sendPhoto`, { method: 'POST', body: fd });
  }
  // 3) Email with the PDF (needs the Cloudflare "send email" binding named EMAIL)
  if (env.EMAIL && pdf) {
    const from = env.EMAIL_FROM || 'booking@ajkampotboutique.org';
    const subject = `New booking request ${ref} - ${b.name} - ${b.room} - ${b.cin}`;
    const plain = `New booking request from the A&J Guest App\n\nRef: ${ref}\nGuest: ${b.name}\nPhone: ${b.phone}\nEmail: ${b.email || '-'}\nRoom: ${b.room}\nCheck-in: ${fmtDay(b.cin)}${b.time ? ' (arriving ' + b.time + ')' : ''}\nCheck-out: ${fmtDay(b.cout)} (${b.nights} nights)\nGuests: ${b.guests}\nTotal: ${money2(b.total)} - Deposit 50%: ${money2(b.deposit)}\n${b.note ? 'Note: ' + b.note + '\n' : ''}\nThe booking details and the payment receipt are in the attached PDF.\nPlease check the payment, enter the booking in Nobeds and confirm with the guest.`;
    const bd = 'ajb_' + ref;
    for (const to of (env.BOOKING_EMAILS ? String(env.BOOKING_EMAILS).split(',') : BOOKING_EMAILS).map(x => x.trim()).filter(Boolean)) {
      const raw = [`From: A&J Guest App <${from}>`, `To: ${to}`, `Subject: =?UTF-8?B?${utf8b64(subject)}?=`, 'MIME-Version: 1.0', `Date: ${new Date().toUTCString()}`, `Message-ID: <${ref}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@ajkampotboutique.org>`, `Content-Type: multipart/mixed; boundary="${bd}"`, '', `--${bd}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(utf8b64(plain)), `--${bd}`, `Content-Type: application/pdf; name="${fname}"`, 'Content-Transfer-Encoding: base64', `Content-Disposition: attachment; filename="${fname}"`, '', wrap76(u8b64(pdf)), `--${bd}--`, ''].join('\r\n');
      try { await env.EMAIL.send(new EmailMessage(from, to, raw)); console.log('email sent', to); } catch (e) { console.log('email failed', to, e && e.message); }
    }
  }
  // 4) A&J Hub check-in form (📥 box)
  if (env.PRE) {
    try {
      const data = { name: b.name, nationality: b.country, passport: '', phone: b.phone, source: 'Direct booking (Guest App) ' + ref, arrival: b.cin, time: b.time, nights: String(b.nights), guests: String(b.guests), transport: '', others: '', note: `Booking ${ref}: ${b.room}, ${b.cin} → ${b.cout}, total ${money2(b.total)}, deposit ${money2(b.deposit)} (receipt in Telegram/email). Email: ${b.email || '-'}${b.note ? '. Note: ' + b.note : ''}` };
      const at = Date.now();
      const id = 'pc:' + at + '-' + Math.random().toString(36).slice(2, 8);
      await env.PRE.put(id, JSON.stringify({ id, at, data, photos: [] }), { metadata: { name: data.name, nat: data.nationality, arrival: data.arrival, guests: data.guests, n: 0, at, used: 0, booking: ref, room: b.room, co: b.cout, total: b.total, deposit: b.deposit, phone: b.phone }, expirationTtl: TTL });
    } catch (e) { console.log('hub save failed', e && e.message); }
  }
  return { ok: true, ref };
}


// ---- Nobeds: put a confirmed Guest App booking into Nobeds (blocks the room + syncs OTAs) ----
const NB_PAGE = 'https://nobeds.app/OnePage/b95b08ae-cb76-428d-8401-1394cd8dad44';
function nbRoomId(name) {
  const n = String(name || '').toLowerCase();
  if (/balcony/.test(n)) return '2541247';
  if (/type\s*a|twin\s*a/.test(n)) return '2541250';
  if (/type\s*b|twin\s*b/.test(n)) return '2541251';
  if (/family/.test(n)) return '2541252';
  if (/superior/.test(n)) return '2541246';
  return '';
}
async function nobedsBook(b, ref, staff) {
  const rid = nbRoomId(b.room);
  if (!rid) return { ok: false, why: 'unknown room type: ' + b.room };
  const guests = String(Math.max(1, parseInt(b.guests, 10) || 1));
  const page = await (await fetch(`${NB_PAGE}/${guests}/${b.cin}/${b.cout}/${rid}`)).text();
  if (!page.includes('book_form')) return { ok: false, why: 'room not available in Nobeds for these dates (full or closed)' };
  const hid = n => { const m = page.match(new RegExp('name="' + n + '"[^>]*value="([^"]*)"')) || page.match(new RegExp('value="([^"]*)"[^>]*name="' + n + '"')); return m ? m[1] : ''; };
  let cc = 'kh';
  const want = String(b.country || '').trim().toLowerCase();
  if (want) for (const m of page.matchAll(/<option value="([a-z]{2})"[^>]*>([^<]+)<\/option>/g)) { if (m[2].trim().toLowerCase() === want) { cc = m[1]; break; } }
  const note = `Guest App ${ref} · Deposit ${money2(b.deposit)} paid (receipt in Telegram)` + (b.time ? ` · arrival ${b.time}` : '') + (b.note ? ` · ${b.note}` : '') + (staff ? ` · confirmed by ${staff}` : '');
  // Nobeds takes the full (rack) stay price and applies the promo code itself → send the rack price + promo; if it can't be read, send our price without promo
  const rack = Number((page.match(/var baseStayPrice\s*=\s*([\d.]+)/) || [])[1] || 0);
  const f = new URLSearchParams({
    hotel: hid('hotel') || '1508197823', channel: hid('channel') || 'One page', checkin: b.cin, checkout: b.cout,
    total_night: String(b.nights), hidguest: guests, room_id: rid, cardexp: '', qnt: '1', bcolor: '', color: '',
    new_total: rack ? rack.toFixed(2) : Number(b.total || 0).toFixed(2), verification: '', name: b.name, address: b.country || 'Cambodia',
    email: b.email || 'ajkampotboutique@gmail.com', phone: b.phone || '', country: cc, promo: rack ? (({ '2541246': 'PROMO_SR', '2541247': 'PROMO_SRB', '2541250': 'PROMO_TA', '2541251': 'PROMO_TB', '2541252': 'PROMO_FS' })[rid] || '') : '', comments: note
  });
  const r = await fetch('https://nobeds.app/DirectForm/SaveBooking', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', referer: `${NB_PAGE}/${guests}/${b.cin}/${b.cout}/${rid}` }, body: f.toString() });
  const t = await r.text();
  if (/reservation confirmation/i.test(t)) return { ok: true };
  return { ok: false, why: 'Nobeds did not confirm (HTTP ' + r.status + ')' };
}
async function onBookingButton(env, q) {
  const api = `https://api.telegram.org/bot${env.BOT_TOKEN}`;
  const call = (m, p) => fetch(`${api}/${m}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) }).then(r => r.json()).catch(() => ({}));
  const msg = q.message || {};
  if (String(msg.chat && msg.chat.id) !== String(env.STAFF_CHAT_ID) || !env.PRE) { await call('answerCallbackQuery', { callback_query_id: q.id }); return; }
  const ref = String(q.data || '').slice(3);
  const key = 'bk:' + ref;
  const raw = await env.PRE.get(key);
  if (!raw) { await call('answerCallbackQuery', { callback_query_id: q.id, text: 'Booking not found / expired', show_alert: true }); return; }
  const rec = JSON.parse(raw);
  if (rec.nb === 'done') { await call('answerCallbackQuery', { callback_query_id: q.id, text: '✅ បានបិទក្នុង Nobeds រួចហើយ · Already in Nobeds', show_alert: true }); return; }
  if (rec.nb === 'busy' && Date.now() - (rec.nbAt || 0) < 60000) { await call('answerCallbackQuery', { callback_query_id: q.id, text: '⏳ កំពុងដំណើរការ…' }); return; }
  rec.nb = 'busy'; rec.nbAt = Date.now();
  await env.PRE.put(key, JSON.stringify(rec), { expirationTtl: TTL });
  await call('answerCallbackQuery', { callback_query_id: q.id, text: '⏳ កំពុងបញ្ចូល Nobeds…' });
  const who = [q.from && q.from.first_name, q.from && q.from.last_name].filter(Boolean).join(' ') || 'staff';
  let res;
  try { res = await nobedsBook(rec.b, ref, who); } catch (e) { res = { ok: false, why: String(e && e.message || e) }; }
  if (res.ok) {
    rec.nb = 'done'; rec.nbBy = who; rec.nbAt = Date.now();
    await env.PRE.put(key, JSON.stringify(rec), { expirationTtl: TTL });
    await call('editMessageReplyMarkup', { chat_id: msg.chat.id, message_id: msg.message_id, reply_markup: { inline_keyboard: [[{ text: '✅ បានបិទក្នុង Nobeds · by ' + who, callback_data: 'nb:' + ref }]] } });
    await call('sendMessage', { chat_id: msg.chat.id, reply_to_message_id: msg.message_id, text: `✅ ${ref}: បានចុះឈ្មោះ ${rec.b.name} ក្នុង Nobeds ហើយ (${rec.b.room}, ${rec.b.cin} → ${rec.b.cout}) · by ${who}\nសូមកត់ប្រាក់កក់ ${money2(rec.b.deposit)} ក្នុង Nobeds ហើយផ្ញើសារបញ្ជាក់ទៅភ្ញៀវ។` });
  } else {
    rec.nb = 'fail'; await env.PRE.put(key, JSON.stringify(rec), { expirationTtl: TTL });
    await call('sendMessage', { chat_id: msg.chat.id, reply_to_message_id: msg.message_id, text: `⚠️ ${ref}: មិនអាចបញ្ចូល Nobeds ដោយស្វ័យប្រវត្តិបានទេ — ${res.why}\nសូមឆែក និងបញ្ចូលដោយដៃក្នុង Nobeds។` });
  }
}


// ---- Facebook Messenger (A&J Facebook Page) — same AI receptionist as Telegram ----
// Needs Secret FB_PAGE_TOKEN (Page access token). Optional Secret FB_APP_SECRET (checks Meta's signature).
// Meta webhook: callback URL <worker>/fb/webhook , verify token FB_VERIFY.
const FB_VERIFY = 'ajkampot-fb-webhook';
const FB_API = 'https://graph.facebook.com/v21.0';
async function fbSend(env, psid, message) {
  const r = await fetch(`${FB_API}/me/messages?access_token=${encodeURIComponent(env.FB_PAGE_TOKEN)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ recipient: { id: psid }, messaging_type: 'RESPONSE', message: Object.assign({ metadata: 'aj-bot' }, fbClean(message)) })
  });
  const j = await r.json().catch(() => ({}));
  if (j.message_id && env.PRE) await env.PRE.put('fbsent:' + j.message_id, '1', { expirationTtl: 3600 });
  if (!r.ok) console.log('fb send failed', JSON.stringify(j).slice(0, 300));
  return j;
}
async function fbSigOk(env, request, raw) {
  if (!env.FB_APP_SECRET) return true;
  const sig = (request.headers.get('x-hub-signature-256') || '').replace(/^sha256=/, '');
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.FB_APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const h = [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(raw)))].map(b => b.toString(16).padStart(2, '0')).join('');
  return h === sig;
}
async function handleFb(request, env, url) {
  if (request.method === 'GET') {
    if (url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === FB_VERIFY) return new Response(url.searchParams.get('hub.challenge') || '', { status: 200 });
    return new Response('forbidden', { status: 403 });
  }
  const raw = await request.text();
  if (!(await fbSigOk(env, request, raw))) return new Response('bad signature', { status: 403 });
  let body = {}; try { body = JSON.parse(raw); } catch (e) {}
  if (body.object !== 'page' || !env.FB_PAGE_TOKEN) return new Response('ok');
  for (const entry of body.entry || []) {
    for (const ev of entry.messaging || []) {
      try { await onFbEvent(env, ev); } catch (e) { console.log('fb error', e && (e.stack || e.message)); }
    }
  }
  return new Response('ok');
}
async function onFbEvent(env, ev) {
  const sid0 = ev.sender && ev.sender.id, isEcho = !!(ev.message && ev.message.is_echo);
  console.log('fb event', JSON.stringify({ k: Object.keys(ev).join(','), echo: isEcho, text: String((ev.message && ev.message.text) || (ev.postback && ev.postback.title) || '').slice(0, 40) }));
  // any guest action (message, button, ad click, "Get started") marks the time: Page auto-replies right after it are not staff
  if (env.PRE && sid0 && !isEcho) await env.PRE.put('fblast:' + sid0, String(Date.now()), { expirationTtl: 3600 });
  let m = ev.message;
  if (!m && ev.postback) m = { text: ev.postback.title || ev.postback.payload || '', mid: 'pb' };
  if (!m) return;
  // Echo = a message the Page itself sent. Our own bot replies are remembered (fbsent:); anything else is staff typing → pause the AI in that chat.
  if (m.is_echo) {
    console.log('fb echo', JSON.stringify({ app: m.app_id, meta: m.metadata, text: String(m.text || '').slice(0, 60) }));
    if (String(m.app_id || '') === '2388376985305109') return;            // our own bot reply
    if (m.metadata === 'aj-bot') return;
    await new Promise(r => setTimeout(r, 1500));                            // let fbSend store fbsent: first
    if (env.PRE && ev.recipient && Date.now() - +(await env.PRE.get('fblast:' + ev.recipient.id) || 0) < 15000) return; // automatic reply right after the guest wrote (Page instant reply etc.), not staff
    if (env.PRE && !(await env.PRE.get('fbsent:' + m.mid)) && ev.recipient && ev.recipient.id) await env.PRE.put('pause:f:' + ev.recipient.id, '1', { expirationTtl: PAUSE_SEC }); await env.PRE.delete('pend:f:' + ev.recipient.id);
    return;
  }
  const psid = ev.sender && ev.sender.id;
  if (!psid) return;
  const key = 'f:' + psid;
  if (env.PRE) await env.PRE.put('fblast:' + psid, String(Date.now()), { expirationTtl: 3600 });
  if (env.PRE && await env.PRE.get('pause:' + key)) return;
  let name = 'Messenger guest';
  try { const p = await (await fetch(`${FB_API}/${psid}?fields=first_name,last_name&access_token=${encodeURIComponent(env.FB_PAGE_TOKEN)}`)).json(); if (p.first_name) name = [p.first_name, p.last_name].filter(Boolean).join(' '); } catch (e) {}
  const who = name + ' (Messenger)';
  const text = (m.text || '').trim();
  if (!text) {
    if (m.sticker_id) return;
    await helloOnce(env, key, () => fbSend(env, psid, { attachment: { type: 'image', payload: { url: ST_BASE + 'hello.png?v=4', is_reusable: true } } }));
    await fbSend(env, psid, { text: 'Thank you! 🙏 Our team will check it and reply shortly. / អរគុណបង! 🙏 ក្រុមការងារយើងនឹងពិនិត្យ ហើយឆ្លើយបងឆាប់ៗ។' });
    await notifyStaff(env, `📎 ${who} sent a photo/file/voice on Facebook Messenger — please check the Page inbox.`, key);
    return;
  }
  fetch(`${FB_API}/me/messages?access_token=${encodeURIComponent(env.FB_PAGE_TOKEN)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ recipient: { id: psid }, sender_action: 'typing_on' }) }).catch(() => {});
  const hist = env.PRE ? JSON.parse(await env.PRE.get('hist:' + key) || '[]') : [];
  hist.push({ role: 'user', content: text });
  while (hist.length > 16) hist.shift();
  while (hist.length && hist[0].role !== 'user') hist.shift();
  let reply = '';
  try { const note = await bookingNote(env, key); reply = await askClaude(env, note ? hist.map((x, i) => i === hist.length - 1 ? { role: 'user', content: x.content + note } : x) : hist); } catch (e) { console.log('claude', e && e.message); }
  if (!reply) {
    await fbSend(env, psid, { text: 'Thank you! Our team will reply shortly. 🙏' });
    await notifyStaff(env, `💬 ${who}: ${text.slice(0, 500)}\n(AI could not answer — please reply in the Page inbox)`, key);
    return;
  }
  const wantApp = /\[APP\]/i.test(reply), wantMap = /\[MAP\]/i.test(reply), wantStaff = /\[STAFF\]/i.test(reply), wantThx = /\[THX\]/i.test(reply), wantUrgent = /\[URGENT\]/i.test(reply);
  const clean = reply.replace(/\[(APP|MAP|STAFF|THX|URGENT|MOTO)\]/gi, '').replace(/[ \t]+\n/g, '\n').trim() || '🙏';
  const buttons = [];
  if (wantApp) buttons.push({ type: 'web_url', url: APP_URL + '?c=' + await chatTok(env, key), title: '📱 Open App' });
  if (wantMap) buttons.push({ type: 'web_url', url: MAP_URL, title: '📍 Map' });
  if (/\[MOTO\]/i.test(reply)) buttons.push({ type: 'web_url', url: APP_URL + '?page=moto&c=' + await chatTok(env, key), title: '🛵 Choose a motorbike' });
  await helloOnce(env, key, () => fbSend(env, psid, { attachment: { type: 'image', payload: { url: ST_BASE + 'hello.png?v=4', is_reusable: true } } }));
  if (buttons.length && clean.length <= 640) await fbSend(env, psid, { attachment: { type: 'template', payload: { template_type: 'button', text: clean, buttons } } });
  else {
    await fbSend(env, psid, { text: clean.slice(0, 2000) });
    if (buttons.length) await fbSend(env, psid, { attachment: { type: 'template', payload: { template_type: 'button', text: '👇', buttons } } });
  }
  if (wantThx) await fbSend(env, psid, { attachment: { type: 'image', payload: { url: ST_BASE + 'thanks.png?v=4', is_reusable: true } } });
  await afterGuestReply(env, { key, who, text, ch: 'Messenger', staff: wantStaff, urgent: wantUrgent });
  hist.push({ role: 'assistant', content: clean });
  if (env.PRE) await env.PRE.put('hist:' + key, JSON.stringify(hist), { expirationTtl: HIST_TTL });
  if (wantStaff) await notifyStaff(env, `🙋 ${who} needs staff (Facebook Messenger):\n"${text.slice(0, 600)}"`, key);
}

// ---- link a guest chat (Telegram / Messenger) to the booking made in the Guest App ----
async function chatTok(env, key) {
  if (!env.PRE || !key) return '';
  let t = await env.PRE.get('tokof:' + key);
  if (!t) {
    t = [...crypto.getRandomValues(new Uint8Array(9))].map(x => (x % 36).toString(36)).join('');
    await env.PRE.put('chatref:' + t, key, { expirationTtl: 2592000 });
    await env.PRE.put('tokof:' + key, t, { expirationTtl: 2592000 });
  }
  return t;
}
async function bookingNote(env, key) {
  if (!env.PRE || !key) return '';
  const ref = await env.PRE.get('bkchat:' + key);
  if (!ref) return '';
  const raw = await env.PRE.get('bk:' + ref);
  if (!raw) return '';
  const r = JSON.parse(raw), b = r.b || {};
  return `\n\n[BOOKING ON FILE for this guest (internal note, never quote it): made in our Guest App, ref ${ref}, ${b.room}, ${b.cin} -> ${b.cout} (${b.nights} night(s)), guest name ${b.name}, total $${b.total}, deposit $${b.deposit}, payment receipt uploaded: ${r.rc ? 'yes' : 'no'}, room held in our booking system: ${r.nb === 'done' ? 'yes' : 'not yet'}]`;
}

// ---- A&J stickers (Hello / Thank you) — served from this worker ----
const STICKERS = { 'hello.webp': 'UklGRuAoAABXRUJQVlA4WAoAAAAQAAAA/wEA3wAAQUxQSFMEAAABoG7btvK22eee7wZlN0Ohlym3ZniVMgQ/lbl9lrqyA7/cPA1qeDg04vvde3bB/iwonZIiYgLwH4vio79RIjFGOGkVo4r8tkissO/szKyDdrBvVPmtkAoAOmcufFhf393ZddB7n17pzc8CQKXyG6AAcObCp/ce0ld3r9VLHQCVTJgKcO7C9Yck2aSUzUdTSvz1nU/nO0AlE6QCLFzfJdkkM7qqWU4kea/XBSqZEBFg4RrJJht91hojB3UX0IlQYOEaadnoudaQg14XIuMnOL1BWqb7WkPeXwN0zDRg9T4t04UtkRunEcdKoRtkphubcbCCIOMT8epNFqMnN2x6FcK4RCwXNnRmK+xrCOMRsZxLQ39+yr6GMA4Ry7kUenRiX0MYXcRyLoU+ndjXEEYVsZxLoVcn9jXIaBQruRT6dWK/qmQUFZ7NpdCzEzdQjUCq6hYb+nbiGnR4ig1mOrc1zbPQYamss6F7N7x1MspwQjjxuBT/YmKNOBzF95bp4JYePic6DJUXmOniDbcxHGxb42PMfAF6OMULzPQy2x7OtrkZM1+AHkbxPDP9zLaHEH80R2PmPLSd4PwezdGSfauxXcRrOdHRjbcrSCuNN5k9jTnNQdsIzjU0V0v8VmKbiPdyoqsb73QgbeQzutvDs20Enbs0X2Oy9xDbnHnob/xMWkRcsERnN96dgbT4iA738FSrdzxuJ7YIR68zu1t+Og/dT/BMonkbEz9HPGh2x+WutNp1uXrqv6n/pv6b+m/qv6n/pv6b+m/qv6n/pv6b+m/qv6n/pv6b+m8kD13ugzYz9zzOLhyEKJ8weZvxwRnIQbjkcTudVl94XDrVQjH/JJuzZW4dDThQcGSP3rbHGkdahONbzL5m5cki9CAcQc09Z+PeEUgLxVIqvpZ587i2EVS3aa6W8muIaBv1OyZPMzbnIa0Uc3vZ0zJvREVrQXWP5miJryO2Q9Qek58ZB2dFDiHoDszcLLFGxGEjaiYvMxt0RQ4l0h2YOVlijYjDR9SWfMzKoCsyBJHu41JcLLGHiGEq1pk9LPPWSZWhQPG9Zf+y9PBZKIYbwonHLO6VWCNi2Cqrj5I5V7YfTlYyNETUfOpbhY9PIGD4Ek/2mTyrlLwSFKMUaJ/Jr0rJK1CMNgTtM3lVKXkZEaMOQftMPlVKXkbE6EPQPpNHlZKXETGOIWif2Z8y8woixjOEaoMlO1PiYBkR4yoBq5nJk3JhvwvFGAfM3WTJXmSJua6gGOsK2mtYsgdZQ96cQxCMuQbMXScte4815P2eImICI7BwjbTG/MZyQw7qLqCYyCDAwjWSbMz8xSw3JAe9LlAJJlUFWPj0Dkk2ycy8xMxyIskH1y+cASrBJKsAM/Of3nnIfZOLNtx398aFcwAqwaRrBaBz5sKn9x7s0kkf7uxu1YuzABAFv4WiFQB0Ts3O11dqB71wZmYWv46C306RWMFXo4rgt1ZENPqoiOA/FAEAVlA4IGYkAADQhACdASoAAuAAPikUiEKhoSESeo0kGAKEsrdwuvcAb/T563zV7OPZq/jwYH2pM1+Jf4P9/9Hy1f6HfRq58ovmX/reuj/QeqH9Hf+b3Av2G/YDrF/uf6gP2c/cj3ef+J/0P917rv7X/ofYF/p/+u///rqexZ+6vsJ/s/6bv72fCZ/Z/+h+4ntP///2AP//6gHCX/038jO/7+hfjr+3nrn+I/OP1r8d/7h/5/c9yd9bn+d5DvrX9s/vH7H/3v/v/7j5Z7z/UX6gX4t/H/61+SP9g/ZzjmdC/bX1BfVb5d/g/7T/j/93/e/3g9qD+g/Lv3C+zn+c9wD+Sf07/F/3X9vP8J/+Pqb/O+DR97/337KfAL/Lf6d/s/73+VP0k/x3++/w/70/7f2m/l/+E/5n+r/ev/UfYN/Hf6F/m/7r/mf/L/gP/5/8vu19gX7Vf933Lv19/75Jm5l8WI596uIhyb2ccoykutTm+g4fLT1NWWdxfQcPlp6mrLO4vnHkYOkM+vLQ1OMkztFjFIAkeE53PWFRaFiIMpUbxbEzblD4HRbEzcL1RT9H1ovAsyrqXeNgVVOkuvzvOenLaFKjeLYmbcofA6LYmbcoNhxyYikyClRvFsSh7R4pHoQFKjeLYmWWDPA4sZzAV/3NPfUwGt9c4+Y6wPTe17OUD3QaY7FazOGNCApUbxbEzZ3aLj6dE7qckiqqZyhmmfhXYuFpVIh75tOyCcwp4t3b5Vd+B4YDShPacbzOLndl0IRihlMVoFHTr/u2DZRIYSGa5OklNRFJtGUdQYICND4qYR96DV0mPv/OyhUPQxueOlaAbYU3sI1hXKbVPQaVXNW/0wdf62oALqqKXu7lrrHz6+JhauvP+YE4KXO6I5n+caw2awXjxzdmDwP6MFfopkmTdmFrMKx1y1XN8cfd+h4Hy59Ym26yGYFgE/5vFvRD7VV0DjoMrRWIUYf0MzzgnDT+921SoyPq7lGGbyPWHY20dajo7W0/yguuCGMDJItlAhrpJ+NywDYX6jmT6WVtT7b6Fk/4o3U7gnRzhIrX2+ZkPNgFamAxZVSLUu14rvSN4JHCjPewmiHMl+lG8lH9ZnsGDf3Atb9sOS7Cr2ot4m4tgWJbyfANdrlLFfMZQo8tubiZU6MfB1CvVg4dwzFcDxFXVMMgCmbb3YycP3xinFRfQ/DYdlsZUGspdJv8y4kALI2cupFlJ3XW7u+cjaaerKR8jX11I3lObcox+hmothNEOZMKjeLYlWeUFRvFsTNuUPOZuVALdJtyiFRvFsTLHUSC1G8WxM25Q+BchTsJlm/pJ7cC7Xk2ovIR1WXmHcTXKHwOi2Jm3KHwOi0B2/5mK+nIacNg2FVd7aOLNEK/wLlDuVXas4OoEAcoykutTm+g4fLT1NWWdxfQcPlp6mrJtBO2DFXWLNI7JgAA/v8NcV1ae9xOjuZOuSLnhEICZ1Eif91YEBE432rPwQB9vL8HXQsDsqdIYo7divca0DGVdrZGGMgPQAqKMne4oFhKu9OZg7rZEHt1RvLoce5ICCBMIcDl7kw7wTSoLiDXGTqep8zN++wDZEca+3cVVPFhhRia5nUs2ousJxP5EAA44zjlU0v1uS+s4/xVrWxqupBks6RT0Mwe5YPj8XJXmpTc4Y3aN0yWtRrdCicf7ETBrYCYQ3bYfQMZNbiaN8kgZuZMO+oFTd6GBOV2tT7pxg2/ZyyAAKifMguVFwzKRxREOmtMd+scWy/9eijb/V9IwvONT1w+kLfGPzzVPQfeD2BmQr3UDrfzAXLHOKPbi9Lo2S9gAKJVf9Q6rOwsDaLnDDqOf5t3odGMI3sdtKX/xV7zrgmcxq2TveeaWtrd58dqjpNfToP40O5jEqQHBJIW9h72mI4w6GNCfAnvGG9ckJqJwbtISnY4E+yiefRR9uoXwURz1EsPbMGs7wcRAmXtuU+qkshcgs2FQIV5yjzav9fCmn1pXCdXvwGAIweQdHdRyPONZAxaA9mEqTdCoXd6paH4i98ORHhft1JMOZ+Ur1uy3o/DnixUHWmuXF9jw8qD7tdPPa7XlziJqO4hOmsmCs8FyRpZr4magNXZDVkRsZPWaD/TJDyaiwboyXBz5XFD0YgZJrG+OqXa7g15aTTqDxZXJ3cw6EZrZki4zhWvHNASFiwDqAAAFil+dFTv195EhriYRoQTklZWiECi/fIUtQKd1OCKrOYytGyOUykcQuGGuWphHaT014XU9SJ5V+H7Jr0usAQN1Se4KLrtMbP3jfnrSvzPIwIrfYd6JGcF/bnIJaA6pe7LLIBDGDhG/mE1zvC5s0VTQmTBKraF1ic6EWhh2IjDntxbBEjMWp1hzFbCk2oTwVjVR54MGzDSjJjHGfAPf6b/80HgjrWGqVOZsEtS/TpzQL20iME16hT/mm4zhqVCKje2iHQUEdWBn0+fVVBiyUX/QvWWE38ylSGQP8AY+YGelSncefd9FMM79Udf3wxd6AdGf38w4L8//fPVjnw78R/JfzNLwj9f17LmvwjH+gbwAOgALUXC4GPQAdhkCA6TWmzdYfezDr5cnhwFMV7tVK3jLFo7S3omxXoR5f425UrhhsRsgL4K6b/Ac/0ZFi2OWuKxC0Cu/5RS7UjDfug7EwZDEjHIv1ShizEKdYcX0IjFEuImw50DtEc9/mCnL3lHpXNDCdodDi2GVDJ4u56/Q/CmpwGTn2OnPsdOeXhtlv+UsOaCfwqBeaRRtIiEDyAISWPuc6n233GRerH+zIVf+rpAWR0jap4i65v8HR1WPqu+MhWX/B0dVkGVw8ex6hTLXpubjlIy8gABhuNJ0EHr3L7ZglwtdGKcv9B8V9a9NLxGRyU/6y+jXIXIAniWXnWMJdSXC12HHLjD0t5kcba4FSaWigOeJoHgBWYvdGoWkhpfeRElIYxWHE2H9SnA8ZYDb/7c/kFJgRNNR3xsv0YrUwqg608KNeon/A/HlHygj/RNWWFYhkWO48sAWfX0ibI1U09ACVhMdIRlVfl5uSnX2KknsQoKnU32IHss5wd/lbE2Lcuj+rNmeDsNenC227Lb1qm7f97CIsyOOPp/9mPwFyVUE75HMcsr7VFkS4oPa/AXsgYTxf8kSmjhVRx5iMs6JTxwxHVMAN9xnthJPzE/LraPCSmicf4i+FGXTcp8nmsRnzxKNAMEmFoczH2Vu8NHNPlpuws8kdhyryWoI+SHke9ej4K0VEpf9IXnFndRDD6ynnkXfk7Q88E8fiwIMG2FXFD2mrk8+eWFyDXgbi6OOVIFlwlaZcv3kFweFtn0q90GhyuLs3hUQjUaKDkWsrAqHkyh+h6xj6rvjyFDEcgMR5WQU7Cm0GfgDFrwlGgtgeGSM1TnVi5LghPcJM9932SA93heNipaKChMa8NHQOuzmeu0tntUedAToQ6OggXUgHiJdjMkkr2P0hvHQSNn+r7LzuYVtCkyeu9a2GrqepJQYecBYvGocm36IU1GmQekyzs6EwV4i4ii3M0loyc4lOb2JI1mMvUuzRMUW43VcJ0mWRr/w1uMDaiIllYeyCAkpk80Bmz9Of8HogQgOE33TwxArfTs86zp7zbvz0a7FcPoAvU1eOEGTkq50C0fDh5xd8LfZ/Lzl1k/4dqddSIAHYKb1NE1FdXbrbBZebQLTnG3KY4WqNzSFZKPsx8xGg016XCZyFKhn1ZG8WuK950EWAJv/i5vwGtPUooMw1h1Bky1UdtDWNjQAiGv2mAzZdfrIg18GKaHJjJ+LQDNOohAaJ96j+Fdo/X/FDWrmSIm17B8bQloPLyQqvYPs7E7Oqkdh3puMAVae+2ykyAT7CUaCf/PjMfp0pt610uF0IKQERYMq6jL26GojAVlXuvRV0nqj4NsNJYZtMiV+0Uv1krCn+CvRRBCwsf6OWwC+7bkKvgWtwGT2L//BzaC8lIuhmzjPhfq15xEHdYx/vwXMRYN+TQCrTg3npQc3a/rGX+xITKmk8Uhtmz9JHROHe+bpzy0Ukic/AK/6dfVitlr1RnNWG2aXenJtAsb1LRynNnA7kBGcH8bUJRGxNkEkaTIo/VtjhSenSEUusrN7j8e8aZkzc8pK4va9mtqOxmwZ9lRNPB55i+5mXXwargTOax1IDMqU/gB07RRlKO2H1/KD/IJwEqBOIbYD8TcPkjyXuStkXNuif8O4dye6dFFv/58q7eTnyal8vlBDzhK5VxqU52KLy56HIJT5p8qd3QRGWG1h4TM/xtR2jOLusCe+BWKnh38bnKwBkjmdz6wQ0QxXMiUzpdnqFFf5JFugArtGTDTR0eFjSVkPdGSVU6Shnc+mfKl+fqhM7bwMjCjek8mOqfsbs/qkR5umlxulesK/Igrdm+Ugg5OdbD6CetuEZPooBLcaYTkm9Uv7QUsqasWhuVXort5GVGJTVMVRi7Af+ugrw9575qNMQQb6+L/zNe+nt+IE53e73RC4ZxMN7R8bFMaS+/ZuuUQhR/9Ab0NR/K3AWig8HNXThxzShmUaygGH7h/zlRpDWi0kfZVx6eVE0+pf37C7o7M0yf26LXdKGLbSDkyG+EbaCPRMMSFKgObWrQ096aNOTy4Gd/wq1PtFQdCVTe1ywCBOQ4E5qbTtY/i8rAGpnnjxDo35UqM4ME6CHFEu66/ib+5XwwK4kXOQRvgdQ0wwSSJ1d4HAJI98t0u/Sf+EkGv93ZHOKQeEaQiRbKqZyHVNrtxgwDEaSuqfYrVckUW5IcvfYKvygD9YT6IqLJTfJLvIKVk+aYKNBi1g4NL8nd5x7gupAS2BS+/Q2My3Y9KwXIBjO/sFmjMGE8oK1340yA2e2eDcurmPks71lNCquHxbxaAlwG9SJYJl56fZ62Oj0lM84plE431xdIAY/tAOJTkPRGwxBLwqxYqv00S1K5LfclbnK1O4+0EEjAMqfpd4sQDOFWlEiBc9YRi4zxnSiVFdD6tLsM0lnwApz67zj+cjWPrr7KUwZQ8kRtMkY0xHqzr/aE3ArQPqfDhbfjIkpIfNbVGSRxRl+ijsTHA8DVeQQ6GI3UE7Gdu0u0ane+VAHqR8C/y1aiOGHayROCFU1zwYHYmBvTkL7McJC2nZ8GpZZt6Y2keNS8cQPoP1qbnCdA4Ae3Zx5Vl5cIlYjaCInamJvfQhKsqoos8U/A1L25lVqKqKtqmWp/7ZIjDHRfo/3U5f2xAQShJArsFrfxMoDXAGeuihFFRfO9mJTZ+v/0F0R24rEhbs/YM+UL4OIbdKbN3qwwEi2JZOAORAnGTxGj5sNNJui+8VE7QzuQ3aUjqJjMSaPURjq+ZEBrB1chEPZae/JsdZ/c5WB5c58qF1M+kTGWJlZVEdh8xplfyZkMI2Jow7MOjlZBtWpSTC0QagFptA8j7FKTwCkhPgu1lfvFS+JMwskbg9MR15zh890nzZMRp9PBqQXAlPYfNvLzoJvcLc2CqW33hKmQUwh3Mn2wtQy11b0yfb125PjaXXzG+xmyTPtM1AdDuZgNXOXh40kqyaD2LfR9R4FGol8cUR9I2sYV1xBVeUQlr0P1FjnzEdmhc0dCvdmurrzqoixBuM2+6zjnK0OFtZtBFpCwADe5Oeeo0qxpIsYGjrs1DRJYlQam8OJK2LZ337tyZhE0YkN3veO1JPWQiaLOP62lhJUP+xeb2zS1skYH3iLPPQzN+ZJ/w8KMvYgt91CmC0o8tPpRJGQf99dnSaNn1mMhjCtPF0PtpPfL9oRQmvQXoWJT5YgSg6kRT1DbmVI0pOX+Te1PWols2jDQVilx/S3tFPnxyr3ndHMUzcovaLgMFzuQnjqMmSAG3lJQowmLpFnaJ7IcdxFw+gZ7LQNGnmP8wAfyMxZoj3OM1J5NBuKdLCv61JeM+RPT1CwjiikwuC/46VyoWrIRslUf0SpCxGQju/MiDLzoclTALknv/Fv3eBA7B4Cdy4RVzLeLgNEMEWTDnRURL4kmMXVKsI+lSQFESCXRUJfyTmQp6jVX2zIKZhp9SCnL+3dJidZ5sAGG3Ae1iv8JPAe3nPt3Pd1JGJf1oIQvDosruUYesYkRDSiYTYrhCUmXVSIsLxbbVFn5CIzHiQi366OwrawzeyAv7K41Ak01yoT4UxanzEGa4O+gKVd8ANihrNeUMuy8yXrnwqpQFkPJzm1pk0LCSjb3QyMmXu6xj6qlI3iLOsb5BwRc213XOfSwxfxv0h/xTnYbCB2uRdL1j9iMKsQrnJCvEmZF2YZNTMNWk1y3YMxgNmlSBFH1akYavdhVkcd8+mocHU9RH3gDcdK7uidJWx88qV+0qxqAwiraVG4mqH4yfdJWh9Jj8sAVck/Dd9/g8c1A+y4yCHl010c60JM0VoN3BtfEOm6LXCmnCmAXXG579iegfl9/R32p5OVEYphBffnuqmpz2ru08eIlqyOVaVHpDlXwAvBgN6rRsOqUrxW/pL9pI+2WItYLmh5hFJUgiDeFfNNMm2UtEYQhk/YNQy/qzfbN6IdQ27DpuFlsOlfbFYyz8VGxupmPCuCi5euohcB45Xs1I6OwEpl9HdpMa7MPmwQn7MplzK7mLGfVd2mAgQ+DhyE9koxLSO35qMRNnuEj1IT/eEDrIF93j5HoM9ycgic31EmMq68X3RWTachhmXaD6WyVrVQMSJTJm3QE/WPd3VOMCnJnLol7mZRuk6NDaXxFLeJ5Cak1hWwUOvPet24IWQN7TsEya8gC/b/ZSCEFPXBfijKCmnzZ7y5f8LMITP/h+mcKfx3HZroPiCxV+Hfj8erdOzBX0rA2sd1cZyeYj+n5EJq68De2fVAzHineGlxYZnfJHv4LBib/eAElBPtxL+8JsF86gx4jG6N9m9nVr+0uJM0IO7TN+RRoQ8EIQFH71+yHXhMnDadjdZc93Iz0e5DfaFWeq1NXjiaKvrWu9/FOysTV+62bap7YD/2Vefb2TfyAPhbkRC2E1eiuB5vR1EPoYsfCd3vdg5uE1vTtreZ1OiHR3AuQCfPpNyQ1crGEkieLDKPKneZgQ5zfRYa3c25zLw6TTsYSz9H8gFIsOCn9O1hM5fxu8oLkVCcGzNG7AVK1laGRNVF8yGF9ldO+vFxGldmKUhHpx9MmoydVAr6YuD3RYfDqSI2Alt8xz/kY+rp4tPjOh6Fo+P08E+0id5M9iAKQAwy67Ihq+8u8DgFqFk6rxegnncI40l8Ofu5R19WcItCP46Q7zhSxcMt8dM48TIukTxlWY9qwF97Nr/1Lqb/H8idYW0HUnC0ybAndilOFUKbTByXz07OZ2UZHUS3QO3G9MXXzg9wz2Wrcld9qIoMlyOZqMYRcoKjwHQs+vRfQUbCATnlKnZOAfEybNFxKmS9YscNY862i0UT9Gin+3KqsKblnnl1Yt/kmJUxU/mwYqo9de8ilr4oqp41xevkZ0ankvQN07yRS90K8qGqsLL2eF97rlnFwKz9KsGy4BWV9NET9Ke8r9+I7JbzYaLA7IpVPHhVE62KxC/SsmROepcpjxTUKn/HA+bw3e09+dDF9maw+IznUuL31OC82YiHvODwYlUxMtYpP5toiRXnR2NkUCVENiUoWs+kO0jrbp4RqSkYio7Os7G3um8eml4wJ4n1cB9yiRQDDEbXiKXJNthv9WBwu+2BftsvgQyYsdV634ZZw2IMO2IQCWe+WVWgsRTMjmfIt/hCvke834qYFr7tLM8Vyog5Bkj6Zrpn79T6QvJ/GzfGrBEd5XY6eYGzOjB6/uXw2epFeV05ckKvfkOQPiGFoyeqCIJlT98vlN50hQjk/S79WYriLgAgysjDyNNCl/emHOlGwGmqJ4n4/1N2pHAgwyIlsoymzT9yyxUjZfYNKuG1eyQMWpg3Xjl9nj+/rFPXsLGhwdMlPNLILE2OLyw/RXDguNB8Kseij4PIYOF6/VoD3dbHoQfg77MzENiIdvY0/4RRYvncwM2RuV8x367xf0RTaqe80IhHtO6TaoZQ3JaSyRWxcbDcJ9nnu3CrrcQ6zuha+EP2d4gv9LH7KiJ3KEbcB6TBrvttIEaOCUB3C4GrHZtkstTCJaI8Wc+ktImk3YbeAGm3DY/72FN4mCCN29+hpCJuUHKZPlcVaySZbx8kCK2VV3nhOvpblZzWTa1IZGVrndpWS9XXO1IwUegoJ6TcDaUY+w1PSH5eOCjUR35DMuUzCGi1HJqNGGUaO59go8vDXGzwB8kelpfs2dqU29RFmf2QudVk1tOO+dEmd289sGfE+hU53D11kCBeAqb8lCwmyCUGEvYxnB6NtpO1jyQJeiWvWlAo58LNJ+IhW6okVFipaNaUlOhDEa07hDsjxRW+tRixNTplTlZQ8BxBIACtYpeBXnkhFL63LPieRWH+cocWau1ADSgMPF6t30yV5Eyt+JI1tavPO3LzM493dgYb5IRkgZh7GgAGKOx4Z0KzbeEsC9xfoVkcnKt+ovhPgmr4IfWl0SpKLasiqChJ+TRWIS8GRGuF1jwV+kRTAWapHQUAVUwFefy2OJ7wPR9GCxSk/gAZ75aGbszNyrjTDXZKOlWj7EGqYzQidgchkE9FJLtN9dXqyc4HhFrdLHZ9FuikKzIJIV285yfqLy9wGj4LhN4szZbN7Gz4JTE9AUDeyNsBDhVnk/bNZcXY4qUhUjVv50QK9UwULj1MCn7kZbS+sMs3ErbE61jvO7Ez7oGwbvnZcOqKkGvK+ToMPjUeaShH1C73P7pHRP5jJRCjW9+TRIPeML9uaqYAFuTf5LIBrKSTJu3x1a8QAKOsNHbk3xQ4ZcO4FgFLGWkwhFtDnXz8u8R3ryAecnKtkhBg3VQEkASNhSY204p940/HBvjcPR/pUzh3xyet4WHOTnx4KqkG1TXeZykLQNnRtKsQJ14ez5cxj3FIBr0TXvh1pvWiaC/Coj+XzUxP7ewAdGtClaihU3hCFoZYjr/B5TYmJTX83wmCrVyzoAab4iZxZY9KT2w2NXX9FAkHiZo4uBny8qorG37PL3LD6y2T5oAWmCgmDY2cUjNM376zURZcKF4mwKgFG4XNssAA7q/BLEwArUksfScMJV/7V6ZvaCBMc4WoWsrROSW7x0qSvl9TM2WPo2ypKQvtnVOGklsAdiiwNvslfQKSf+hc5mO9wAFM6XUwgM6QIwBY8+I25AkcquuRVJwjZLnQQVzT1Wa+N8aVP96/vM+0sKdERpwHa0uZOciVQed7t8/6hocgd594t/NGYeJDJVRNDDwiu7Fk8YmlhcVtN7wcsWmtbf2/SMLdofkwNFbLAow96Bd6HnXwZtRYgi9IV7FbX4M57s28dL3a43fXBkM6dA6kE1WxleGRfANvzFzqzBAWvS+1k4av+GNQZzlCtFJ1oN+wy3y01WSnQ73bj9ezlQYou4vpDZafxtYFSt1gpRtrjP2Jzvo1p3ytVu29lLDsZmzQ9OFePKJ7j/IiTAbwso3VsOk/JLJlIjs1KpRQ04mLIBGVLVOzLjJ139q4MWbcCdoZhD1OXRmv+8aRen9D7hQdgm7X6YJj4I1EfG1/VNv232CCypW5yjojLKpjZempZkAkLVPIuzAC59YyfJpkK8/1lGNR+j9hliwhGYorSxRjOzOOU2067RR7jdn5vzvRTcpBW24Kbw2k8S1Hkp4WyTKucAAYPmZLZ6Sn4/U5qDHl6Q2p+fRA4DbP+FliJ0T78xBvaqEP5pQaNutYN/C5OqSX7BPSBQ9yyJ+g6eXQ6IlfUtvVCrRGoNZHyXA1aPoBdeiYy0tUxdObgP2X0223C2Tk7gPlMrZR8JoPKdnJzbQReefRMNgpZztxJaAdX4ojwiWBMpTBladwplOBTW+QQr5JGxvD66VaFZFf79lUOIWXA5iLODXJo17eMWNV6vg0Yq2vpvMYxSPm22MosWZ0FFhmzh+fmQ3XUMfniRUGr/L5tXZoZSfrm0BvL3011+e2VC4KxVQ4ljOfUrriVFd4CgmyfI7/vPt6D4+b9MToT1/SzJtErIDXGy7gj2QV8Dbt+DdEhKIhvajYgioKw49adHoj+dA+bPDl5yXRqaXRvEKZq2hapIOHIBGvnhFt+fFYe0lAFZkM7ThmFS0W/FsDKyTG6iwTk6ZdbMlrdM5VTAAIbHg1daX3tBNre64y1kYpjERd0hNZVesBXtFTY6Y37wq9ieYrOqJCIk8czwjRJH5+ZmXbr0s8/4o8qiAOPTP+QH+MiCb9e/B+HdWCuVJEhIkvRiqPARQ1UrcEp0n6HZzRjvMhYUhNh1PT87H9kMoz3J55WsRcv5zovgNt1O+0xnxwA2ZrybO7n8x/OQkwOGk9vK7HBnFNvv8/JTk5e8114s4Slrc5qJLgO6S2UcQUG3XLW1DimwOsQEP+gYGQ1FSPHBCWfAMeNWvFvLbrdiYvCWI6yeNPGwA8iHEWE6QFAlVh3f6nQcJeWIj1uWcFo6BmHyGbctBPiK79LT5xthW/i1K50R0nhBLDai5hyZ8/9wGWeSOFzEXCQ644sGdVdptPTNt85YDygFXkWcOKrzeCiziNrnmIZoaiAZxtU5QLD+DPUkCX8GevP84DXPAD0byLTevu8ZWGEZixVL31d0f8zC8b8AsrQURwPPFXPGVsgZbiDGWN3FxKdRiFH6VcYXlXOc9dqtywv8pqoC9oP1DwXjR5q+cPlyhlZuvUuYPAbgij3JooOVBPZGgTmvw10ej4KgSl1CbYoIl51fonEHsXEjxcG+BGjfIHF1d143B4DLY0LJZT8KBrKeAfwwHTQsq2Bq18Fy0Aia2oQviutn7LYq/4KRTk1bXhCU1PI7vmrGoiRNOTlj+sQ1IO4JLaioiuvqcfIL0WglKhT/CIFfICCUQoo9O3ZBPtLxFyogVQw/4M3jy5RJPbZj/eTINR4mKHJPiaDXOlpoHMQfL8jOt6oZzuy4yz8U6yd+7UR6kkkefubAL8km4wkaHM/RCkkUR9BzRVxX4YHIwhAYg1uTDc5z726cpXuyx9gjSZxWu2iMX9yEiKE8baDPobdEDj/1vtaJ81DzMkUznCuHEZW8/dwSkKwPgfzXezy1GTa3SHZdT+MM1nyGCrpdSavL1tx2hSBfUfhKbem89g1ZuLr9z15q/T5E3dY92bdDNNG5lwCHPS1/mMpgAxU5qSDy/o9/ExW8A5MLtSsRHg2QmPDov+uAO0CAG1ANZH3gH7PX3oDxcAAAQWEE8EDsaThKajVeXzdaBhDDzx2u/SaWU9I1x4jbDbAPuNZHT/CCo6luCRU2cNmJykcYO9LtRVdgpWiFtRRnsOL+diRPlY6Fd0gYItBl7344hxv5VWC6rEuJMXSJtQnxeG8De4Yc25EHyg9eRsucgeT1bv3RSfg8BxnsNHmRNdU8SCvKk2ybdJYhoHsWMlp/NyrT7rq8t3Rwj2rHq7ZHYuKeqb2qarSGu/mzVnWzY2l9kTQmzHC7Ob3NQVieXxHn8vU0KcHyv8rm+jVl/6FWiXl5y/huxi3M0bNt0m8ZIbTlGEWfa9v0GbeECsNJv+XzDWYPzYpHelQ5Z6ew51ursrsmpVA9/Ft1yAyAzCwORJKXcMYDcxGpTxsbGpnHYyiSb9zUW0a9pdLQw7Xe1KuxK/a8Ua/Dm65b5/BHkdyMwIheL3tBJqBMSgfzq1eIVUnTg2qkq1+YhN1PP6SuGKBTx+s0i0yzm/GzU4qrdpVlWikip3/ePimW+KgTdil7m17/SEfKD7ELFd1l9FfNayTBMDJszYsd4c1ebFqyoVc1QE4XtKak6I0bgRwUV/30fjXGBEoRcPpmL/hAEpicMtNUSSmL+hva+KZp05CoE12BikkUTYAxroRs/xulbeW5oqrPJWGMXjI87DMf10nvhFylAbzM5U+9Q8r1NFbC5Ea9mzzJifheyDbQpQJAArHr5sweAQ3sOWmvr/eX5KdgdASj+vmLpLGBJ95gZ+Q45d7n/5pDTss02XBRUw4hLSZ/NJZHQJwEpezM7nLF4EhexSuEUEpHbyHwkAnRX//bvcW+Q3aOfW97Jjx5eT63c/7BntJGm44/DOfFib63p68xKn/KaI/hiyf8Is/e0jy/paj7ii0Z5eAdgfwhyrXY7HnfJuiTQPXSLlJC1gsmdPalICWtF9ers25akorwgGYeVBupQGGFZoaVfwLeRS8urQuEWxhb2JKu4zUdeho5R/8SfaYg2DwHy8XYtr17+7Ib7adq7gzy7Q2EL4KmLvl2HUCYc3z/csJ6ywc3NEXyd/LCestdyWmRZsxeGvxutVbnvBHEnHaSp3xiexsx/yD3WiR8O1zkh+7lpPkQspVA5ZtqLt72TVKTD/drCt9omBP9TRIZQMEkupiHpJ/72e8RxMS/z0GXfC38DQXmbt0JCUjCldQ+8vofGmiMmJLKzZ7j20O2WLUG1ZmKHUDFLVOzZ8uP717ovir9ii6nKZYC2GBdSOxed4GL3ZJBHhOUxOT7c4dUWSXzmKWZ4Fah2ScT/wQ3trgAAAA=', 'thanks.webp': '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', 'hello.png': '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', 'thanks.png': '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' };
async function helloOnce(env, key, fn) { if (!env.PRE || !key) return; if (await env.PRE.get('hello:' + key)) return; await env.PRE.put('hello:' + key, '1', { expirationTtl: HIST_TTL }); try { await fn(); } catch (e) {} }
function stickerResponse(name) {
  const b = STICKERS[name]; if (!b) return new Response('not found', { status: 404 });
  const bin = Uint8Array.from(atob(b), c => c.charCodeAt(0));
  return new Response(bin, { headers: { 'content-type': name.endsWith('.png') ? 'image/png' : 'image/webp', 'cache-control': 'public, max-age=86400' } });
}
const ST_BASE = 'https://aj-guest-app.management-aj-18.workers.dev/st/';
// no emojis in messages to guests (A&J house style)
function noEmoji(s) { return String(s || '').replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, '').replace(/[ \t]{2,}/g, ' ').replace(/ +([.,!?។])/g, '$1').replace(/[ \t]+\n/g, '\n').trim(); }

function fbClean(m) { m = JSON.parse(JSON.stringify(m)); if (m.text) m.text = noEmoji(m.text) || "Thank you."; if (m.attachment && m.attachment.payload && m.attachment.payload.text) m.attachment.payload.text = noEmoji(m.attachment.payload.text) || "Please tap below."; return m; }

// ================= Owner's assistant (ជំនួយការរបស់មេ) =================
// Owner registers once: sends "/owner <code>" to @AJKampotBot (code stored in KV cfg:ownercode).
// Then: instant alerts, morning/evening summaries (cron), tasks to staff with a Done button.
const camNow = () => new Date(Date.now() + 7 * 3600 * 1000);
const camDay = (d) => (d || camNow()).toISOString().slice(0, 10);
const camHM = (t) => new Date((t || Date.now()) + 7 * 3600 * 1000).toISOString().slice(11, 16);
async function ownerId(env) { return env.PRE ? await env.PRE.get('cfg:owner') : null; }
async function taskChat(env) { return (env.PRE && await env.PRE.get('cfg:taskchat')) || env.STAFF_CHAT_ID; }
async function tellOwner(env, text, extra) {
  const o = await ownerId(env); if (!o) return null;
  return tgApi(env, 'sendMessage', Object.assign({ chat_id: o, text: String(text).slice(0, 4000), disable_web_page_preview: true }, extra || {}));
}
async function logEvent(env, ev) {
  if (!env.PRE) return;
  try {
    const k = 'ev:' + camDay();
    const a = JSON.parse((await env.PRE.get(k)) || '[]');
    ev.at = Date.now(); a.push(ev); while (a.length > 400) a.shift();
    await env.PRE.put(k, JSON.stringify(a), { expirationTtl: 9 * 86400 });
  } catch (e) { console.log('logEvent', e && e.message); }
}
async function callAI(env, system, messages, max) {
  const key = String(env.AI_KEY || env.ANTHROPIC_API_KEY || '').replace(/[^\x21-\x7e]/g, '');
  const body = JSON.stringify({ model: env.AI_MODEL || 'claude-haiku-5-5', max_tokens: max || 1200, system, messages });
  const call = (auth) => fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: Object.assign({ 'content-type': 'application/json', 'anthropic-version': '2023-06-01' }, auth), body, signal: AbortSignal.timeout(40000) });
  let r = await call({ 'x-api-key': key });
  if (r.status === 401) r = await call({ 'authorization': 'Bearer ' + key });
  const j = await r.json();
  if (!r.ok) throw new Error(r.status + ' ' + ((j.error && j.error.message) || ''));
  return (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
}
// after every guest reply (Telegram / Messenger)
async function afterGuestReply(env, o) {
  await logEvent(env, { t: 'msg', ch: o.ch, key: o.key, who: o.who, q: String(o.text || '').slice(0, 140), staff: !!o.staff, urgent: !!o.urgent });
  if (!env.PRE || !(o.staff || o.urgent)) return;
  const p = { who: o.who, q: String(o.text || '').slice(0, 400), ch: o.ch, at: Date.now(), urgent: !!o.urgent, alerted: 0 };
  if (o.urgent) {
    p.alerted = Date.now();
    await tellOwner(env, `🚨 សារបន្ទាន់ត្រូវបើកមើល\nភ្ញៀវ: ${o.who} (${o.ch})\nសារ: "${p.q}"\nBot បានប្រាប់ភ្ញៀវថាបុគ្គលិកនឹងទាក់ទង។ សូមពិនិត្យភ្លាមៗ។`,
      { reply_markup: { inline_keyboard: [[{ text: '📣 រំលឹកបុគ្គលិក', callback_data: ('pr:' + o.key).slice(0, 64) }]] } });
  }
  await env.PRE.put('pend:' + o.key, JSON.stringify(p), { expirationTtl: 86400 });
}
async function hubBoxText(env) {
  if (!env.PRE) return '';
  const out = [];
  try {
    const bl = await env.PRE.list({ prefix: 'bk:', limit: 1000 });
    const keys = bl.keys.map(k => k.name).sort().slice(-20);
    const recs = await Promise.all(keys.map(k => env.PRE.get(k).then(v => { try { return [k, JSON.parse(v)]; } catch (e) { return null; } })));
    const lines = recs.filter(r => r && r[1] && r[1].b).reverse().map(([k, r]) => { const b = r.b; return '- ' + k.slice(3) + ' · ' + b.name + ' · ' + b.room + ' · ' + b.cin + ' → ' + b.cout + ' · ' + b.guests + ' guests · total $' + b.total + ' · deposit $' + b.deposit + ' · Nobeds: ' + (r.nb === 'done' ? 'blocked' : r.nb === 'fail' ? 'NOT blocked' : 'not yet') + (b.phone ? ' · phone ' + b.phone : ''); });
    out.push(lines.length ? 'APP BOOKINGS (ការកក់ from the Guest App and from the owner, newest first):\n' + lines.join('\n') : 'APP BOOKINGS: none.');
  } catch (e) { out.push('APP BOOKINGS: could not read.'); }
  try {
    const pl = await env.PRE.list({ prefix: 'pc:', limit: 1000 });
    const rows = pl.keys.map(k => k.metadata || {}).filter(m => m.name && !m.used).sort((a, b) => String(a.arrival || '').localeCompare(String(b.arrival || '')));
    out.push(rows.length ? 'A&J HUB CHECK-IN FORM BOX (📥 guests waiting for check-in; staff pick them and assign the room number):\n' + rows.map(m => '- ' + m.name + ' · arrival ' + (m.arrival || '?') + (m.co ? ' → ' + m.co : '') + (m.room ? ' · ' + m.room : '') + ' · ' + (m.guests || '?') + ' guests' + (m.booking ? ' · ' + m.booking : '')).join('\n') : 'A&J HUB CHECK-IN FORM BOX (📥): empty.');
  } catch (e) { out.push('A&J HUB CHECK-IN FORM BOX: could not read.'); }
  return out.join('\n');
}
async function guestReqText(env) {
  if (!env.PRE) return '';
  const out = [];
  for (let d = 0; d < 3; d++) {
    const day = camDay(new Date(camNow().getTime() - d * 86400000));
    const ev = JSON.parse((await env.PRE.get('ev:' + day)) || '[]').filter(e => e.t === 'req');
    ev.forEach(e => out.push('[' + day + ' ' + camHM(e.at) + '] ' + (e.kind === 'checkin' ? 'CHECK-IN FORM' : 'REQUEST') + ': ' + String(e.text || '').replace(/\s+/g, ' ').slice(0, 300)));
  }
  return out.length ? 'GUEST REQUESTS (សំណើភ្ញៀវ from the A&J Guest App, last 3 days, newest day first):\n' + out.slice(0, 25).join('\n') : 'GUEST REQUESTS (សំណើភ្ញៀវ): none in the last 3 days.';
}
async function buildSummary(env, day, title) {
  const ev = JSON.parse((env.PRE && await env.PRE.get('ev:' + day)) || '[]');
  const msgs = ev.filter(e => e.t === 'msg'), books = ev.filter(e => e.t === 'booking'), otas = ev.filter(e => e.t === 'ota');
  const chats = {}; msgs.forEach(e => { chats[e.key] = e; });
  const byCh = {}; Object.values(chats).forEach(e => { byCh[e.ch] = (byCh[e.ch] || 0) + 1; });
  const L = [title, ''];
  L.push(`💬 ភ្ញៀវសរសេរមក: ${Object.keys(chats).length} នាក់` + (Object.keys(byCh).length ? ' (' + Object.entries(byCh).map(([k, v]) => k + ' ' + v).join(', ') + ')' : ''));
  L.push(`🛏️ ការកក់តាម App: ${books.length}`);
  books.forEach(b => L.push(`  • ${b.ref} ${b.name} · ${b.room} · ${b.cin}→${b.cout} · $${b.total} (កក់ $${b.deposit}) ${b.nb === 'done' ? '🔒 បិទ Nobeds រួច' : '⚠️ មិនទាន់បិទ Nobeds'}`));
  if (otas.length) { L.push(`🌐 ការកក់/ការលុបពី OTA: ${otas.length}`); otas.forEach(o => L.push(`  • ${o.kind === 'cancel' ? '❌ លុប' : o.kind === 'modify' ? '✏️ កែ' : '🆕'} ${o.ota} ${o.id} ${o.name || ''} · ${o.room || ''} · ${o.cin || '?'}→${o.cout || '?'}`)); }
  const staffNeed = msgs.filter(e => e.staff || e.urgent);
  if (staffNeed.length) L.push(`🙋 ភ្ញៀវត្រូវការបុគ្គលិក: ${staffNeed.length}` + (msgs.some(e => e.urgent) ? ` (បន្ទាន់ ${msgs.filter(e => e.urgent).length})` : ''));
  // still waiting now
  const pend = [];
  if (env.PRE) { for (const k of (await env.PRE.list({ prefix: 'pend:' })).keys) { const v = JSON.parse((await env.PRE.get(k.name)) || 'null'); if (v) pend.push(v); } }
  if (pend.length) { L.push('', `⏳ នៅរង់ចាំចម្លើយបុគ្គលិក (${pend.length}):`); pend.forEach(p => L.push(`  • ${p.who} (${p.ch}, ${camHM(p.at)}): "${p.q.slice(0, 80)}"`)); }
  // arrivals from the Guest App
  const today = camDay(), tomorrow = camDay(new Date(camNow().getTime() + 86400000));
  const arr = { [today]: [], [tomorrow]: [] };
  if (env.PRE) for (const k of (await env.PRE.list({ prefix: 'pc:' })).keys) { const m = k.metadata || {}; if (!m.used && arr[m.arrival]) arr[m.arrival].push(m.name + (m.room ? ' · ' + m.room : '') + (m.booking ? ' · ' + m.booking : ' · Check-in មុន')); }
  if (arr[today].length) { L.push('', `🏨 ភ្ញៀវ App មកដល់ថ្ងៃនេះ (${arr[today].length}):`); arr[today].forEach(x => L.push('  • ' + x)); }
  if (arr[tomorrow].length) { L.push('', `📅 ភ្ញៀវ App មកដល់ស្អែក (${arr[tomorrow].length}):`); arr[tomorrow].forEach(x => L.push('  • ' + x)); }
  // open tasks
  const open = [];
  if (env.PRE) for (const k of (await env.PRE.list({ prefix: 'task:' })).keys) { const t = JSON.parse((await env.PRE.get(k.name)) || 'null'); if (t && !t.done) open.push(t); }
  if (open.length) { L.push('', `📋 ការងារបុគ្គលិកមិនទាន់ធ្វើរួច (${open.length}):`); open.forEach(t => L.push(`  • ${t.text.slice(0, 90)} (ផ្ញើ ${camHM(t.at)})`)); }
  if (L.length <= 4 && !books.length && !otas.length && !pend.length) L.push('', 'គ្មានរឿងសំខាន់ត្រូវតាមដានទេ។');
  return L.join('\n');
}
async function runCron(env, cron) {
  try {
    // escalate guests still waiting for staff after 15 minutes
    if (env.PRE) {
      for (const k of (await env.PRE.list({ prefix: 'pend:' })).keys) {
        const p = JSON.parse((await env.PRE.get(k.name)) || 'null');
        if (!p || p.alerted || Date.now() - p.at < 15 * 60000) continue;
        p.alerted = Date.now();
        await env.PRE.put(k.name, JSON.stringify(p), { expirationTtl: 86400 });
        await tellOwner(env, `🔔 សារសំខាន់ត្រូវបើកមើល\nភ្ញៀវ: ${p.who} (${p.ch})\nសំណួរ: "${p.q}"\nមិនទាន់មានបុគ្គលិកឆ្លើយ ${Math.round((Date.now() - p.at) / 60000)} នាទីហើយ។`,
          { reply_markup: { inline_keyboard: [[{ text: '📣 រំលឹកបុគ្គលិក', callback_data: ('pr:' + k.name.slice(5)).slice(0, 64) }]] } });
      }
    }
    if (env.PRE) {
      for (const k of (await env.PRE.list({ prefix: 'rem:' })).keys) {
        const v = JSON.parse((await env.PRE.get(k.name)) || 'null');
        if (!v || v.due > Date.now() + 60000) continue;
        if (v.to === 'staff') await postTask(env, '⏰ ' + v.text); else await tellOwner(env, '⏰ រំលឹក: ' + v.text);
        if (v.repeat === 'daily') { while (v.due <= Date.now() + 60000) v.due += 86400000; await env.PRE.put(k.name, JSON.stringify(v), { expirationTtl: 90 * 86400 }); }
        else await env.PRE.delete(k.name);
      }
    }
    if (cron === '0 22 * * *') {
      const y = camDay(new Date(camNow().getTime() - 86400000));
      await tellOwner(env, await buildSummary(env, y, `☀️ អរុណសួស្តីមេ — សេចក្តីសង្ខេបម្សិលមិញ (${y})`));
    }
    if (cron === '0 11 * * *') {
      const d = camDay();
      await tellOwner(env, await buildSummary(env, d, `🌙 សេចក្តីសង្ខេបថ្ងៃនេះ (${d}, ម៉ោង ${camHM()} កំពត)`));
    }
  } catch (e) { console.log('cron error', e && (e.stack || e.message)); }
}
async function postTask(env, text, ownerName) {
  const id = Date.now().toString(36);
  const t = { id, text, at: Date.now(), done: null };
  const r = await tgApi(env, 'sendMessage', { chat_id: await taskChat(env), text: `📋 ការងារពីថ្នាក់ដឹកនាំ\n\n${text}\n\nធ្វើរួច សូមចុចប៊ូតុងខាងក្រោម។`,
    reply_markup: { inline_keyboard: [[{ text: '✅ ធ្វើរួច', callback_data: 'tk:' + id }]] } });
  if (r && r.ok) { t.msg = r.result.message_id; t.chat = r.result.chat.id; }
  await env.PRE.put('task:' + id, JSON.stringify(t), { expirationTtl: 14 * 86400 });
  await logEvent(env, { t: 'task', id, text: text.slice(0, 140) });
  return r && r.ok;
}
async function onAssistantButton(env, q) {
  const d = String(q.data || ''), who = [q.from && q.from.first_name, q.from && q.from.last_name].filter(Boolean).join(' ') || 'staff';
  const ans = (text, alert) => tgApi(env, 'answerCallbackQuery', { callback_query_id: q.id, text, show_alert: !!alert });
  if (d.startsWith('oa:') || d.startsWith('oz:')) {
    if (String(q.from && q.from.id) !== String(await ownerId(env))) { await ans('សម្រាប់តែមេប៉ុណ្ណោះ', true); return; }
    const tok = await env.PRE.get('otareq:' + d.slice(3));
    const edit = (txt) => q.message ? tgApi(env, 'editMessageText', { chat_id: q.message.chat.id, message_id: q.message.message_id, text: txt }) : null;
    if (!tok) { await ans('ផុតកំណត់ហើយ សូម Run ស្គ្រីបម្តងទៀត', true); return; }
    await env.PRE.delete('otareq:' + d.slice(3));
    if (d.startsWith('oa:')) { await env.PRE.put('cfg:otatoken', tok); await edit('✅ បានភ្ជាប់ Gmail រួចហើយ។ ពីឥឡូវ ខ្ញុំនឹងប្រាប់មេភ្លាមៗពេលមានការកក់ពី Agoda, Booking.com, Expedia, Trip.com...'); }
    else await edit('❌ បានបដិសេធការភ្ជាប់នេះ។');
    await ans('OK'); return;
  }
  if (d.startsWith('fc:') || d.startsWith('fx:')) {
    if (String(q.from && q.from.id) !== String(await ownerId(env))) { await ans('សម្រាប់តែមេប៉ុណ្ណោះ', true); return; }
    const k = 'ofm:' + d.slice(3), x = JSON.parse((await env.PRE.get(k)) || 'null');
    const edit = (txt) => q.message ? tgApi(env, 'editMessageText', { chat_id: q.message.chat.id, message_id: q.message.message_id, text: txt }) : null;
    if (!x) { await ans('ទិន្នន័យនេះផុតកំណត់ ឬបានបញ្ចូលរួចហើយ', true); return; }
    await env.PRE.delete(k);
    if (d.startsWith('fx:')) { await ans('បានបោះបង់'); await edit('❌ បានបោះបង់ មិនបានដាក់ចូលទម្រង់ Check-in ទេ។'); return; }
    const at = Date.now(), id = 'pc:' + at + '-' + Math.random().toString(36).slice(2, 8);
    const data = { name: x.name, nationality: x.nationality || '', passport: x.passport || '', phone: x.phone || '', source: x.source || 'Added by the owner (assistant)', arrival: x.arrival, time: '', nights: String(x.nights || 1), guests: String(x.guests || 1), transport: '', others: '', note: [x.room, x.note].filter(Boolean).join(' · ') };
    let co = '';
    try { const dd = new Date(x.arrival + 'T00:00:00Z'); dd.setUTCDate(dd.getUTCDate() + (parseInt(x.nights, 10) || 1)); co = dd.toISOString().slice(0, 10); } catch (e) {}
    await env.PRE.put(id, JSON.stringify({ id, at, data, photos: [] }), { metadata: { name: data.name, nat: data.nationality, arrival: data.arrival, guests: data.guests, n: 0, at, used: 0, booking: x.source || '', room: x.room || '', co, phone: data.phone }, expirationTtl: 60 * 86400 });
    await ans('បានដាក់ចូលហើយ');
    await edit('✅ បានដាក់ ' + data.name + ' ចូលទម្រង់ Check-in (📥) ក្នុង A&J Hub ហើយ។\nមកដល់ ' + data.arrival + ' · ' + data.nights + ' យប់ · ' + data.guests + ' នាក់' + (x.room ? ' · ' + x.room : ''));
    return;
  }
  if (d.startsWith('ot:') || d.startsWith('ou:')) {
    if (String(q.from && q.from.id) !== String(await ownerId(env))) { await ans('សម្រាប់តែមេប៉ុណ្ណោះ', true); return; }
    const k = 'otk:' + d.slice(3), x = JSON.parse((await env.PRE.get(k)) || 'null');
    const edit = (txt) => q.message ? tgApi(env, 'editMessageText', { chat_id: q.message.chat.id, message_id: q.message.message_id, text: txt }) : null;
    if (!x) { await ans('សារនេះផុតកំណត់ ឬបានផ្ញើរួចហើយ', true); return; }
    await env.PRE.delete(k);
    if (d.startsWith('ou:')) { await ans('បានបោះបង់'); await edit('❌ បានបោះបង់ មិនបានផ្ញើទៅបុគ្គលិកទេ។\n\n' + x.text + '\n\nបើចង់កែ សូមប្រាប់ជំនួយការម្ដងទៀត។'); return; }
    const ok = await postTask(env, x.text);
    await ans(ok ? 'បានផ្ញើហើយ' : 'ផ្ញើមិនបាន', !ok);
    await edit((ok ? '✅ បានផ្ញើទៅបុគ្គលិកហើយ ម៉ោង ' + camHM() + ' (កំពត)' : '⚠️ ផ្ញើមិនបាន សូមសាកម្ដងទៀត') + '\n\n📋 ' + x.text);
    return;
  }
  if (d.startsWith('tk:')) {
    const k = 'task:' + d.slice(3), t = JSON.parse((await env.PRE.get(k)) || 'null');
    if (!t) return ans('ការងារនេះផុតកំណត់ហើយ', true);
    if (t.done) return ans('✅ ធ្វើរួចហើយ ដោយ ' + t.by, true);
    t.done = Date.now(); t.by = who;
    await env.PRE.put(k, JSON.stringify(t), { expirationTtl: 14 * 86400 });
    await ans('អរគុណ! ✅');
    if (q.message) await tgApi(env, 'editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [[{ text: `✅ ធ្វើរួច · ${who} · ${camHM()}`, callback_data: d }]] } });
    await tellOwner(env, `✅ ការងាររួចរាល់\n"${t.text.slice(0, 200)}"\nដោយ ${who} ម៉ោង ${camHM()} (កំពត)`);
    return;
  }
  if (d.startsWith('om:') || d.startsWith('oc:')) {
    if (String(q.from && q.from.id) !== String(await ownerId(env))) return ans('សម្រាប់ថ្នាក់ដឹកនាំប៉ុណ្ណោះ', true);
    const k = 'omsg:' + d.slice(3), v = JSON.parse((await env.PRE.get(k)) || 'null');
    const edit = (t) => q.message && tgApi(env, 'editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [[{ text: t, callback_data: 'oc:0' }]] } });
    if (!v) { await edit('—'); return ans('សារនេះផុតកំណត់ ឬបានផ្ញើរួចហើយ', true); }
    await env.PRE.delete(k);
    if (d.startsWith('oc:')) { await edit('❌ បានបោះបង់'); return ans('បានបោះបង់'); }
    const err = await sendToGuest(env, v.key, v.text);
    await edit(err ? '⚠️ ផ្ញើមិនបាន' : '✅ បានផ្ញើទៅភ្ញៀវហើយ');
    if (err) await tellOwner(env, '⚠️ ផ្ញើសារទៅ ' + v.guest + ' មិនបាន: ' + err);
    return ans(err ? 'ផ្ញើមិនបាន' : '✅ បានផ្ញើ');
  }
  if (d.startsWith('ob:') || d.startsWith('ox:')) {
    if (String(q.from && q.from.id) !== String(await ownerId(env))) return ans('សម្រាប់ថ្នាក់ដឹកនាំប៉ុណ្ណោះ', true);
    const k = 'obk:' + d.slice(3), bk = JSON.parse((await env.PRE.get(k)) || 'null');
    const edit = (t) => q.message && tgApi(env, 'editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [[{ text: t, callback_data: 'ox:0' }]] } });
    if (!bk) { await edit('—'); return ans('ការកក់នេះផុតកំណត់ ឬបានធ្វើរួចហើយ', true); }
    await env.PRE.delete(k);
    if (d.startsWith('ox:')) { await edit('❌ បានបោះបង់'); return ans('បានបោះបង់'); }
    await ans('⏳ កំពុងកក់…'); await edit('⏳ កំពុងកក់…');
    const fd = new FormData(); fd.append('data', JSON.stringify(bk));
    let res = null; try { res = await handleBooking(env, fd, [], 'Booked by the owner via the assistant bot'); } catch (e) { console.log('owner booking', e && e.message); }
    const ref = res && res.ref;
    let nb = { ok: false, why: 'booking record failed' };
    if (ref) { try { nb = await nobedsBook(bk, ref, 'owner'); } catch (e) { nb = { ok: false, why: String(e && e.message || e) }; } }
    if (ref && nb.ok) { const rec = JSON.parse((await env.PRE.get('bk:' + ref)) || '{}'); rec.nb = 'done'; rec.nbBy = 'owner'; rec.nbAt = Date.now(); await env.PRE.put('bk:' + ref, JSON.stringify(rec), { expirationTtl: TTL }); }
    await edit(ref ? (nb.ok ? '✅ កក់រួច · ' + ref : '⚠️ ' + ref + ' · មិនទាន់បិទ Nobeds') : '⚠️ កក់មិនបាន');
    await tellOwner(env, ref ? `✅ កក់រួច ${ref}: ${bk.name} · ${bk.room} · ${bk.cin} → ${bk.cout}\n${nb.ok ? '🔒 បានបិទបន្ទប់ក្នុង Nobeds ហើយ' : '⚠️ មិនអាចបិទក្នុង Nobeds: ' + nb.why + ' — បុគ្គលិកត្រូវបញ្ចូលដោយដៃ'}\n📥 ដាក់ក្នុង Form Check-in និងប្រាប់ក្រុមបុគ្គលិករួចហើយ` : '⚠️ មិនអាចកក់បានទេ សូមព្យាយាមម្តងទៀត។');
    return;
  }
  if (d.startsWith('pr:')) {
    if (String(q.from && q.from.id) !== String(await ownerId(env))) return ans('សម្រាប់ថ្នាក់ដឹកនាំប៉ុណ្ណោះ', true);
    const p = JSON.parse((await env.PRE.get('pend:' + d.slice(3))) || 'null');
    await tgApi(env, 'sendMessage', { chat_id: env.STAFF_CHAT_ID, text: `🔔 រំលឹកពីថ្នាក់ដឹកនាំ: ភ្ញៀវ ${p ? p.who + ' (' + p.ch + ')' : ''} កំពុងរង់ចាំចម្លើយ។ ${p ? 'សំណួរ: "' + p.q.slice(0, 200) + '"' : ''}\nសូមឆ្លើយភ្ញៀវភ្លាមៗ។` });
    return ans('📣 បានរំលឹកបុគ្គលិកហើយ');
  }
}
async function claimOwner(env, m) {
  const code = env.PRE && await env.PRE.get('cfg:ownercode');
  const given = String(m.text || '').split(/\s+/)[1] || '';
  if (!code || given !== code) { await tgApi(env, 'sendMessage', { chat_id: m.chat.id, text: 'Sorry, this code is not valid.' }); return; }
  await env.PRE.put('cfg:owner', String(m.from.id));
  await env.PRE.delete('cfg:ownercode');
  await tgApi(env, 'sendMessage', { chat_id: m.chat.id, text: OWNER_HELP });
}
const OWNER_HELP = `✅ សួស្តីមេ! ខ្ញុំជាជំនួយការរបស់មេ។

ខ្ញុំនឹង:
• 🚨 ដាស់តឿនមេភ្លាមៗ ពេលមានរឿងសំខាន់ (ភ្ញៀវត្អូញត្អែរ ភ្ញៀវរង់ចាំបុគ្គលិកលើស ១៥ នាទី ការកក់ថ្មី បញ្ហាបិទបន្ទប់)
• 📊 សង្ខេបជូនមេពេលណាក៏បាន (វាយ /summary) — ខ្ញុំធ្វើការ ២៤ ម៉ោង

មេអាចសរសេរ ឬផ្ញើសំឡេងមកខ្ញុំ ឧ.:
• "ប្រាប់បុគ្គលិកឲ្យលាងម៉ាស៊ីនត្រជាក់បន្ទប់ 203 ស្អែកម៉ោង ៩" → ខ្ញុំផ្ញើទៅក្រុមបុគ្គលិក មានប៊ូតុង ✅ ធ្វើរួច
• "ថ្ងៃនេះមានអ្វីថ្មី?" → ខ្ញុំសង្ខេបជូន
• "កក់បន្ទប់គ្រែមួយ ថ្ងៃ 20-22 ឲ្យ Sok Dara 012345678 បានកក់ $24" → ខ្ញុំបង្ហាញឲ្យមេបញ្ជាក់ ហើយកក់ក្នុង Nobeds + Form Check-in
• "រំលឹកខ្ញុំស្អែកម៉ោង ៩ ព្រឹក ឲ្យបង់ថ្លៃភ្លើង" ឬ "រាល់ថ្ងៃម៉ោង ៧ ព្រឹក រំលឹកបុគ្គលិកឲ្យពិនិត្យទឹក" → ខ្ញុំរំលឹកតាមម៉ោង
• "មានភ្ញៀវណាសួររកបន្ទប់ទេ?" → ខ្ញុំមើលឆាតភ្ញៀវ (Telegram + Messenger) ៣ ថ្ងៃចុងក្រោយ
• "ឆ្លើយភ្ញៀវ Thona ថា…" → ខ្ញុំផ្ញើជំនួសមេ (ពេលមេចុច ✅)
• /summary — សេចក្តីសង្ខេបឥឡូវ · /tasks — ការងារមិនទាន់រួច · /reminders — ការរំលឹក
• ក្នុងក្រុមបុគ្គលិកថ្មី វាយ /setgroup ដើម្បីឲ្យការងារទៅក្រុមនោះ`;
// A&J Hub Booking Board (read-only) — needs Secret HUB_KEY (a Hub PIN that can open the board / view page)
async function hubBoardText(env) {
  if (!env.HUB_KEY) return '\nA&J HUB BOOKING BOARD: not connected (owner has not added HUB_KEY yet).';
  try {
    const r = await fetch('https://script.google.com/macros/s/AKfycbxXsQ6OPA1YZ3MvbmC2CcA0ZaGGRsurb-0Cw0H94Qkzu9QdoYgxIgjiit3XTG4CJs_ccA/exec', { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'board', key: String(env.HUB_KEY).trim() }), redirect: 'follow', signal: AbortSignal.timeout(25000) });
    const j = await r.json();
    if (!j.ok) return '\nA&J HUB BOOKING BOARD: error ' + (j.error || r.status);
    const today = camDay(), to = camDay(new Date(camNow().getTime() + 14 * 86400000)), from = camDay(new Date(camNow().getTime() - 30 * 86400000));
    const end = b => { const d = new Date(b.start + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + (Number(b.nights) || 1)); return d.toISOString().slice(0, 10); };
    const rows = (j.bookings || []).filter(b => b && b.status !== 'cancelled' && b.start <= to && end(b) >= from && end(b) >= today)
      .sort((a, b) => String(a.start).localeCompare(String(b.start)) || String(a.room).localeCompare(String(b.room)))
      .map(b => [b.room, b.start + '→' + end(b), b.status, b.guest || '', b.guests ? b.guests + 'pax' : '', b.source || '', b.phone || ''].filter(Boolean).join(' | '));
    return '\nA&J HUB BOOKING BOARD (room | dates | status | guest | pax | source | phone), today ' + today + ', from today to +14 days:\n' + (rows.join('\n') || '(none)') + '\nRooms: Superior+Balcony 101,201,301; Superior 203,204,205,207,303,304,305,307; Twin A 202,302; Twin B 206,306; Family Suite 102,103.';
  } catch (e) { return '\nA&J HUB BOOKING BOARD: not reachable (' + (e && e.message) + ')'; }
}
// recent guest conversations (Telegram + Messenger), newest first
async function recentChatsText(env) {
  if (!env.PRE) return '';
  const seen = {};
  for (const d of [camDay(new Date(camNow().getTime() - 2 * 86400000)), camDay(new Date(camNow().getTime() - 86400000)), camDay()]) {
    for (const e of JSON.parse((await env.PRE.get('ev:' + d)) || '[]')) if (e.t === 'msg' && e.key) seen[e.key] = { who: e.who, ch: e.ch, at: e.at };
  }
  const list = Object.entries(seen).sort((x, y) => y[1].at - x[1].at).slice(0, 12);
  const out = [];
  for (const [key, v] of list) {
    const h = JSON.parse((await env.PRE.get('hist:' + key)) || '[]').slice(-8);
    const bn = await bookingNote(env, key).catch(() => '');
    out.push(`[chat key=${key}] ${v.who} (${v.ch}), last message ${new Date(v.at + 7 * 3600000).toISOString().slice(0, 16).replace('T', ' ')} Cambodia time${bn ? ' — HAS APP BOOKING' + bn.replace(/\n/g, ' ') : ''}\n` +
      h.map(x => (x.role === 'user' ? '  Guest: ' : '  Bot: ') + String(x.content).replace(/\[BOOKING ON FILE[^\]]*\]/g, '').replace(/\s+/g, ' ').slice(0, 220)).join('\n'));
  }
  return out.length ? '\nRECENT GUEST CHATS (last 3 days, newest first; Telegram hotel account + Messenger):\n' + out.join('\n') : '\nRECENT GUEST CHATS: none in the last 3 days.';
}
async function sendToGuest(env, key, text, tags) {
  const t = noEmoji(text);
  tags = tags || {};
  const tok = (tags.app || tags.moto) ? await chatTok(env, key) : '';
  const btns = [];
  if (tags.app) btns.push({ t: '📱 Open App', u: APP_URL + '?c=' + tok });
  if (tags.moto) btns.push({ t: '🛵 ជ្រើសរើសម៉ូតូ / Choose a motorbike', u: APP_URL + '?page=moto&c=' + tok });
  if (tags.map) btns.push({ t: '📍 Map', u: MAP_URL });
  const kb = (web) => btns.length ? { reply_markup: { inline_keyboard: btns.map(b => [web && b.u !== MAP_URL ? { text: b.t, web_app: { url: b.u } } : { text: b.t, url: b.u }]) } } : {};
  if (key.startsWith('b:')) { const p = key.split(':'); const r = await tgApi(env, 'sendMessage', Object.assign({ business_connection_id: p[1], chat_id: p.slice(2).join(':'), text: t }, kb(false))); if (!r || !r.ok) return (r && r.description) || 'failed'; }
  else if (key.startsWith('d:')) { const r = await tgApi(env, 'sendMessage', Object.assign({ chat_id: key.slice(2), text: t }, kb(true))); if (!r || !r.ok) return (r && r.description) || 'failed'; }
  else if (key.startsWith('f:')) { const r = btns.length && t.length <= 640 ? await fbSend(env, key.slice(2), { attachment: { type: 'template', payload: { template_type: 'button', text: t, buttons: btns.slice(0, 3).map(b => ({ type: 'web_url', url: b.u, title: b.t.slice(0, 20) })) } } }) : await fbSend(env, key.slice(2), { text: t }); if (!r || !r.message_id) return (r && r.error && r.error.message) || 'failed (Messenger allows replies only within 24 hours of the guest\'s last message)'; }
  else return 'unknown chat';
  const h = JSON.parse((await env.PRE.get('hist:' + key)) || '[]'); h.push({ role: 'assistant', content: t }); while (h.length > 16) h.shift();
  await env.PRE.put('hist:' + key, JSON.stringify(h), { expirationTtl: HIST_TTL });
  return '';
}
async function onOwner(env, m) {
  const say = (text, extra) => tgApi(env, 'sendMessage', Object.assign({ chat_id: m.chat.id, text: String(text).slice(0, 4000), disable_web_page_preview: true }, extra || {}));
  let text = (m.text || m.caption || '').trim();
  if (!text && (m.voice || m.audio) && env.GEMINI_API_KEY) { try { const t = await transcribeVoice(env, m.voice || m.audio); if (t && !/^\[UNCLEAR\]/i.test(t)) text = t; } catch (e) {} }
  if (!text) return say((m.voice || m.audio) ? 'សុំទោសមេ ខ្ញុំស្តាប់សំឡេងនេះមិនបានច្បាស់ទេ សូមនិយាយម្តងទៀត ឬសរសេរជាអក្សរ។' : 'សូមសរសេរ ឬផ្ញើសំឡេងមកខ្ញុំ។');
  if (/^\/(start|help)\b/.test(text)) return say(OWNER_HELP);
  if (/^\/summary\b/.test(text)) return say(await buildSummary(env, camDay(), `📊 សេចក្តីសង្ខេបថ្ងៃនេះ (ម៉ោង ${camHM()} កំពត)`));
  if (/^\/reminders\b/.test(text) || /^\/cancel_/.test(text)) {
    const cm = text.match(/^\/cancel_([a-z0-9]+)/);
    if (cm) { await env.PRE.delete('rem:' + cm[1]); return say('🗑️ បានបោះបង់ការរំលឹកហើយ។'); }
    const L = [];
    for (const k of (await env.PRE.list({ prefix: 'rem:' })).keys) { const v = JSON.parse((await env.PRE.get(k.name)) || 'null'); if (v) L.push(v); }
    L.sort((x, y) => x.due - y.due);
    return say(L.length ? '⏰ ការរំលឹក (ម៉ោងកំពត):\n' + L.map(v => `• ${new Date(v.due + 7 * 3600000).toISOString().slice(0, 16).replace('T', ' ')}${v.repeat === 'daily' ? ' (រាល់ថ្ងៃ)' : ''} → ${v.to === 'staff' ? 'បុគ្គលិក' : 'មេ'}: ${v.text.slice(0, 80)}\n   បោះបង់: /cancel_${v.id}`).join('\n') : 'គ្មានការរំលឹកទេ។');
  }
  if (/^\/tasks\b/.test(text)) {
    const open = [];
    for (const k of (await env.PRE.list({ prefix: 'task:' })).keys) { const t = JSON.parse((await env.PRE.get(k.name)) || 'null'); if (t && !t.done) open.push(t); }
    return say(open.length ? '📋 ការងារមិនទាន់រួច:\n' + open.map(t => `• ${t.text.slice(0, 120)} (ផ្ញើ ${camHM(t.at)})`).join('\n') : '✅ គ្មានការងារនៅសល់ទេ។');
  }
  const [data, board, avail, chats, reqs, box, ota] = await Promise.all([buildSummary(env, camDay(), 'TODAY DATA'), hubBoardText(env), availText(env).catch(() => ''), recentChatsText(env).catch(() => ''), guestReqText(env).catch(() => ''), hubBoxText(env).catch(() => ''), otaText(env).catch(() => '')]);
  const sys = `You are the private assistant of the owner ("មេ") of A&J Kampot Boutique, a small hotel in Kampot, Cambodia. The owner lives in Brisbane and manages the hotel remotely; staff are at the hotel 24 hours. YOUR NAME: you are called "ជំនួយការ" (the owner's assistant); the owner may also call you "ជំនួយការមេ", "ជ័យ" or "បូត". A message that starts with one of these names is addressed to you: ignore the name and do what follows. If asked who you are, say you are ជំនួយការរបស់មេ. DAILY WORK CHECK: when the owner asks how today's work is going (e.g. "ការងារប្រចាំថ្ងៃដល់ណាហើយ", "ថ្ងៃនេះមានអីខ្លះ"), use action answer and give a short Khmer list from the data: tasks sent to staff today and whether each is done or still open, reminders due today, today's check-ins and check-outs and new bookings, guests who chatted today and whether they booked, and anything urgent that still needs the owner. Say plainly when a section has nothing. NAMES OF THE PARTS (the owner uses these Khmer names): «ឆាតភ្ញៀវ» = guest chats on the hotel Telegram and Facebook Messenger (GUEST CHATS data); «សំណើភ្ញៀវ» = requests guests send from the A&J Guest App such as towels, cleaning, late check-out, plus check-in forms (GUEST REQUESTS data); «ការកក់» = bookings (Guest App bookings and Nobeds); «A&J Hub» = the hotel board (arrivals, departures, rooms); «ការងារបុគ្គលិក» = tasks the owner sent to staff; «ការរំលឹក» = reminders; «បន្ទប់ទំនេរ» = Nobeds availability. When the owner names one part, answer only about that part. CHECKING A BOOKING: to see whether a guest has booked, look in APP BOOKINGS, the A&J HUB CHECK-IN FORM BOX and GUEST CHATS; give the ref, room, dates, deposit and whether Nobeds is blocked. Bookings made directly in Nobeds or on Booking.com/OTAs are not in your data (you only see them as reduced availability), so say that the owner or staff should check Nobeds for those. A guest already in APP BOOKINGS with Nobeds blocked must NOT be booked again. Bookings made by the owner through you are added to the check-in form box automatically. FILL THE CHECK-IN FORM: when the owner asks you to add / fill a guest into the A&J Hub check-in form (for example a guest who booked by chat, phone, Booking.com or walk-in, or when staff replied to the guest and you stopped answering), use {"action":"checkin_form","name":"<guest name>","nationality":"<country or empty>","phone":"<phone or empty>","passport":"<passport no. or empty>","arrival":"YYYY-MM-DD","nights":"<number>","guests":"<number>","room":"<room type or empty>","source":"<where the booking came from, e.g. Booking.com, Telegram chat, walk-in>","note":"<total, deposit and anything else useful>","reply":"<short Khmer note; it is not added until the owner presses the button>"}. Take details from the owner's words and from GUEST CHATS; never invent a passport number or phone. If the guest is already in the CHECK-IN FORM BOX, do not add again; say so with action answer. Reply ONLY with one JSON object, no other text, no code fences. Keep every "reply" short (at most 2 short sentences) except when the owner asks for a list or summary:
- If the owner asks you to tell / ask / remind staff to do something: {"action":"task","staff_text":"<the instruction rewritten for the staff in clear, polite, natural Khmer, keeping every detail (room numbers, times, dates, amounts). Do not invent details.>","reply":"<short Khmer note to the owner; the message is NOT sent yet, the owner will check it and press Send>"}
- If the owner asks you to SEND A MESSAGE / reply to a guest (e.g. "reply to that guest that the room is ready", "tell Thona the QR code is coming"): pick the guest from RECENT GUEST CHATS and return {"action":"message_guest","key":"<the exact chat key>","guest":"<guest name>","text":"<the message to the guest, in the guest's language, polite hotel front-office style, no emoji>","reply":"<short Khmer note to the owner>"}.
- When the owner asks to book for a guest who chatted (e.g. "book for the guest who asked about a Superior room"), take the details (name, room type, dates, guests) from RECENT GUEST CHATS; the guest name can be their chat name. If dates or room are not in the chat, ask the owner.
- If the owner asks you to BOOK / reserve a room for a guest: {"action":"book","name":"<guest name>","phone":"<phone or empty>","country":"<country in English or empty>","room":"one of: Superior Room | Superior Room with Balcony | Superior Twin Beds Type A | Superior Twin Beds Type B | Family Suite","cin":"YYYY-MM-DD","cout":"YYYY-MM-DD","guests":<number>,"total":<total USD or null if not said>,"deposit":<deposit already paid in USD, 0 if not said>,"note":"<any extra info>","reply":"<short Khmer summary of the booking for the owner to confirm>"}. Room words: one bed / គ្រែមួយ = Superior Room; balcony / វេរ៉ង់ដា = Superior Room with Balcony; Twin A; Twin B; family / គ្រួសារ = Family Suite. If the name, room or dates are missing, use {"action":"answer","reply":"<ask the owner in Khmer for the missing details>"}.
- If the owner wants a reminder at a LATER time or on a schedule (e.g. "remind me tomorrow at 9", "tell staff every day at 7am to check the water", "at 2pm remind staff to ..."): {"action":"remind","to":"owner" or "staff","when":"YYYY-MM-DD HH:MM" (Cambodia time),"repeat":"none" or "daily","text":"<the reminder text in clear polite Khmer; for staff write it as an instruction to staff>","reply":"<short Khmer confirmation to the owner that states the time in Cambodia time and in Brisbane time (Brisbane = Cambodia + 3 hours)>"}. Times the owner gives are Cambodia (hotel) time unless the owner says Brisbane/Australia time (then subtract 3 hours). If no date is given, use the next time that hour comes.
- Otherwise (a question, chat, asking for news or a summary): {"action":"answer","reply":"<helpful, short answer in Khmer (or English if the owner wrote English), using only the DATA below; if the data does not contain the answer, say so honestly>"}
Current Cambodia time: ${camNow().toISOString().slice(0, 16).replace('T', ' ')}.
DATA:
${data}
${chats}
${reqs}
${box}
${ota}
${board}
${avail}
You CAN see OTA bookings (Agoda, Booking.com, Expedia, Trip.com…) in OTA BOOKINGS above: when the owner asks about bookings from Agoda / Booking.com / OTA, answer from that list (new ones today = received at today's date). You CAN see room availability (from Nobeds, by room type, next 14 nights) and the A&J Hub Booking Board above. Use them to answer questions about free rooms, who is staying, arrivals and departures. You CAN book rooms (action book). Never say you cannot access the systems when the data is above.`;
  let out = '';
  try { out = await callAI(env, sys, [{ role: 'user', content: text }], 3000); } catch (e) { return say('⚠️ AI មិនអាចដំណើរការបានទេឥឡូវ: ' + (e && e.message)); }
  let j = null; try { j = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)); } catch (e) {}
  if (!j) { const rm = out.match(/"reply"\s*:\s*"([^"]*)/); return say(rm ? rm[1] + '…\n\n(សូមសួរម្តងទៀតឲ្យខ្លី)' : (out || '...')); }
  if (j.action === 'message_guest' && j.key && j.text) {
    const id = Date.now().toString(36);
    await env.PRE.put('omsg:' + id, JSON.stringify({ key: j.key, text: j.text, guest: j.guest || '' }), { expirationTtl: 86400 });
    return say(`✉️ សូមមេបញ្ជាក់សារទៅភ្ញៀវ ${j.guest || ''}:\n\n"${noEmoji(j.text)}"`, { reply_markup: { inline_keyboard: [[{ text: '✅ ផ្ញើ', callback_data: 'om:' + id }, { text: '❌ បោះបង់', callback_data: 'oc:' + id }]] } });
  }
  if (j.action === 'book' && j.name && j.room && j.cin && j.cout) {
    const PRICE = { 'Superior Room': 24, 'Superior Room with Balcony': 30, 'Superior Twin Beds Type A': 32.5, 'Superior Twin Beds Type B': 42, 'Family Suite': 94.5 };
    const nights = Math.max(1, Math.round((Date.parse(j.cout) - Date.parse(j.cin)) / 86400000) || 1);
    const bk = { room: j.room, cin: j.cin, cout: j.cout, nights, guests: String(j.guests || 2), time: '', name: j.name, country: j.country || '', phone: j.phone || '', email: '', note: (j.note ? j.note + ' · ' : '') + 'booked by owner', total: Number(j.total) || (PRICE[j.room] || 0) * nights, deposit: Number(j.deposit) || 0 };
    const id = Date.now().toString(36);
    await env.PRE.put('obk:' + id, JSON.stringify(bk), { expirationTtl: 86400 });
    return say(`🛏️ សូមមេបញ្ជាក់ការកក់នេះ:\n\nភ្ញៀវ: ${bk.name}${bk.phone ? ' · ' + bk.phone : ''}${bk.country ? ' · ' + bk.country : ''}\nបន្ទប់: ${bk.room}\nថ្ងៃ: ${bk.cin} → ${bk.cout} (${nights} យប់) · ${bk.guests} នាក់\nសរុប: $${bk.total} · បានកក់: $${bk.deposit}${j.note ? '\nចំណាំ: ' + j.note : ''}\n\nពេលយល់ព្រម ខ្ញុំនឹងបិទបន្ទប់ក្នុង Nobeds (បើទំនេរ) ដាក់ក្នុង Form Check-in និងប្រាប់ក្រុមបុគ្គលិក។`,
      { reply_markup: { inline_keyboard: [[{ text: '✅ យល់ព្រមកក់', callback_data: 'ob:' + id }, { text: '❌ បោះបង់', callback_data: 'ox:' + id }]] } });
  }
  if (j.action === 'remind' && j.when && j.text) {
    const m2 = String(j.when).match(/(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/);
    if (!m2) return say('⚠️ ខ្ញុំមិនយល់ម៉ោងនោះទេ សូមប្រាប់ម្តងទៀត ឧ. "ស្អែកម៉ោង ៩ ព្រឹក"។');
    const due = Date.parse(m2[1] + 'T' + m2[2].padStart(2, '0') + ':' + m2[3] + ':00+07:00');
    const id = Date.now().toString(36);
    await env.PRE.put('rem:' + id, JSON.stringify({ id, due, to: j.to === 'staff' ? 'staff' : 'owner', text: j.text, repeat: j.repeat === 'daily' ? 'daily' : 'none' }), { expirationTtl: 90 * 86400 });
    return say('⏰ ' + (j.reply || 'កំណត់ការរំលឹករួចហើយ') + '\n\n' + j.text + (j.repeat === 'daily' ? '\n(រាល់ថ្ងៃ)' : '') + '\n\nបោះបង់: /reminders');
  }
  if (j.action === 'checkin_form' && j.name && j.arrival) {
    const id = Date.now().toString(36);
    await env.PRE.put('ofm:' + id, JSON.stringify(j), { expirationTtl: 2 * 86400 });
    const L = ['📝 សូមមេពិនិត្យ មុនដាក់ចូលទម្រង់ Check-in (A&J Hub):', '', 'ឈ្មោះ: ' + j.name, 'មកដល់: ' + j.arrival + ' · ' + (j.nights || 1) + ' យប់ · ' + (j.guests || 1) + ' នាក់'];
    if (j.room) L.push('បន្ទប់: ' + j.room);
    if (j.nationality) L.push('សញ្ជាតិ: ' + j.nationality);
    if (j.phone) L.push('ទូរស័ព្ទ: ' + j.phone);
    if (j.passport) L.push('លិខិតឆ្លងដែន: ' + j.passport);
    if (j.source) L.push('ប្រភព: ' + j.source);
    if (j.note) L.push('កំណត់ចំណាំ: ' + j.note);
    return say(L.join('\n'), { reply_markup: { inline_keyboard: [[{ text: '✅ ដាក់ចូល', callback_data: 'fc:' + id }, { text: '❌ បោះបង់', callback_data: 'fx:' + id }]] } });
  }
  if (j.action === 'task' && j.staff_text) {
    const id = Date.now().toString(36);
    await env.PRE.put('otk:' + id, JSON.stringify({ text: j.staff_text }), { expirationTtl: 2 * 86400 });
    return say('📝 សូមមេពិនិត្យសារនេះ មុនផ្ញើទៅបុគ្គលិក:\n\n' + j.staff_text + '\n\nបើត្រឹមត្រូវ ចុច ✅ ផ្ញើ។ បើចង់កែ ចុច ❌ ហើយប្រាប់ជំនួយការម្ដងទៀតថាចង់កែអ្វី។', { reply_markup: { inline_keyboard: [[{ text: '✅ ផ្ញើ', callback_data: 'ot:' + id }, { text: '❌ បោះបង់', callback_data: 'ou:' + id }]] } });
  }
  return say(j.reply || out);
}
async function onGroupMsg(env, m) {
  const t = String(m.text || '');
  // staff / owner replies to a guest alert in the staff group -> the bot sends it to that guest
  const rt = m.reply_to_message;
  if (rt && t && !t.startsWith('/') && env.PRE) {
    const key = await env.PRE.get('gm:' + rt.message_id);
    if (key) {
      const hist = JSON.parse((await env.PRE.get('hist:' + key)) || '[]');
      const lastGuest = [...hist].reverse().find(x => x.role === 'user');
      let out = t;
      try {
        out = await callAI(env, 'You are the front desk of A&J Kampot Boutique, a small hotel in Kampot, Cambodia. A staff member wrote a reply (often short, informal Khmer) for a guest. Rewrite it as one polite, warm, professional front-office chat message TO THE GUEST, in the same language the guest wrote in (Khmer guests: natural everyday Khmer, call the guest "បង"). Keep every fact exactly (prices, dates, times, room names, rules); add nothing new, no emojis, no markdown, never write web links. Buttons: if the reply is about renting a motorbike, add the tag [MOTO] at the end (the guest gets a button to choose a bike); if it asks the guest to book, check in early, or use the app, add [APP]; if it is about our location or directions, add [MAP]. Return only the message text (with any tags).', [{ role: 'user', content: 'Guest\'s last message: ' + (lastGuest ? String(lastGuest.content).replace(/\[BOOKING ON FILE[^\]]*\]/g, '').slice(0, 800) : '(unknown)') + '\n\nStaff reply to send: ' + t }], 700) || t;
      } catch (e) { out = t; }
      const tags = { app: /\[APP\]/i.test(out), moto: /\[MOTO\]/i.test(out), map: /\[MAP\]/i.test(out) };
      out = out.replace(/\[(APP|MOTO|MAP)\]/gi, '').replace(/https?:\/\/\S+/g, '').trim() || t;
      const err = await sendToGuest(env, key, out, tags);
      const by = [m.from && m.from.first_name, m.from && m.from.last_name].filter(Boolean).join(' ');
      await tgApi(env, 'sendMessage', { chat_id: m.chat.id, reply_to_message_id: m.message_id, text: err ? '⚠️ ផ្ញើទៅភ្ញៀវមិនបាន: ' + err : '✅ Bot បានផ្ញើទៅភ្ញៀវ' + (by ? ' (ពី ' + by + ')' : '') + ':\n\n' + noEmoji(out) + (tags.moto ? '\n[+ ប៊ូតុង 🛵 ជ្រើសរើសម៉ូតូ]' : '') + (tags.app ? '\n[+ ប៊ូតុង 📱 Open App]' : '') + (tags.map ? '\n[+ ប៊ូតុង 📍 Map]' : '') });
      if (!err) { await env.PRE.delete('pend:' + key); }
      return;
    }
  }
  if (/^\/setgroup\b/.test(t) && String(m.from && m.from.id) === String(await ownerId(env))) {
    await env.PRE.put('cfg:taskchat', String(m.chat.id));
    await tgApi(env, 'sendMessage', { chat_id: m.chat.id, text: '✅ ក្រុមនេះនឹងទទួលការងារពីថ្នាក់ដឹកនាំ តាមរយៈ Bot។' });
  }
}

async function handleSend(request, env) {
  if (!env.BOT_TOKEN || !env.STAFF_CHAT_ID) return json({ ok: false, error: 'not configured' }, 500);
  let form;
  try { form = await request.formData(); } catch { return json({ ok: false, error: 'bad form' }, 400); }

  const kind = String(form.get('kind') || '');
  if (!['checkin', 'request', 'booking'].includes(kind)) return json({ ok: false, error: 'bad kind' }, 400);
  let text = String(form.get('text') || '').slice(0, 3500);
  if (!text.trim()) return json({ ok: false, error: 'empty' }, 400);
  if (kind !== 'booking') { try { await logEvent(env, { t: 'req', kind, text: text.slice(0, 600) }); } catch (e) {} }

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

  if (kind === 'booking') {
    const br = await handleBooking(env, form, photos, text.split('\n').pop());
    if (br) return json(br, br.ok ? 200 : 502);
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
  if (what === 'del' && request.method === 'POST') { await env.PRE.delete(id); return json({ ok: true }); }
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
- Replies: 1–4 polite, complete sentences. Answer ONLY what the guest asked, one step at a time. Never dump all information at once.
- ONE QUESTION = ONE ANSWER (most important rule). If the guest asks about price, answer the price (for the room kind they asked; e.g. for one bed explain both one-bed types with their prices). If they ask about check-in/out, answer only that. If they ask about a policy, answer only that policy. Never add other information they did not ask for (no extra policies, no deposit or payment details, no booking steps). The 2-ways-to-book message is ONLY for when the guest has clearly decided to book.
- Reply in the guest's language: Khmer if they write Khmer (natural, correct Khmer), otherwise English (or their language if simple).
- KHMER TONE: always call the guest "បង" (never "លោកអ្នក", never "អ្នក"). Refer to yourself as "ប្អូន" and to the hotel as "ខាងប្អូន" (never "ខ្ញុំ", never "ខាងប្អូន"), e.g. "សុំអធ្យាស្រ័យបង ខាងប្អូន...", "ប្អូននឹងពិនិត្យជូនបង", "អញ្ជើញបងមក...". Speak like a well-trained, polite hotel front-office staff member: warm, respectful and professional, in natural spoken Khmer (not stiff book Khmer, no slang). Start with "បាទបង" and use polite words like "សូម", "អរគុណបង", "រីករាយបម្រើបង". Explain clearly in full sentences, never curt one-word answers. Examples: price for one bed: "បាទបង សម្រាប់បន្ទប់គ្រែមួយ ខាងប្អូនមាន ២ ប្រភេទ៖ បន្ទប់ Superior ធម្មតា តម្លៃ $24 ក្នុងមួយយប់ និងបន្ទប់ Superior មានវេរ៉ង់ដា តម្លៃ $30 ក្នុងមួយយប់បង 😊"; price for two beds: "បាទបង សម្រាប់បន្ទប់គ្រែពីរ ខាងប្អូនមាន ២ ប្រភេទ៖ Twin A តម្លៃ $32.50 (សម្រាប់ ២ នាក់) និង Twin B តម្លៃ $42 (សម្រាប់ដល់ ៣ នាក់) ក្នុងមួយយប់បង"; check-in: "បាទបង ខាងប្អូនទទួល Check-in ចាប់ពីម៉ោង 2:00 រសៀល ដល់ម៉ោង 10:00 យប់ ហើយ Check-out មុនម៉ោង 12:00 ថ្ងៃត្រង់បង"; early check-in: "បាទបង បើបន្ទប់រៀបចំរួចមុនម៉ោង ខាងប្អូននឹងសម្រួលឲ្យបងចូលមុនបាន បើមិនទាន់រួចទេ បងអាចផ្ញើវ៉ាលី និងកាបូបទុកនៅកន្លែងទទួលភ្ញៀវបានបង".
- ENGLISH TONE: warm, polite and professional, like good hotel front-office staff ("Certainly!", "Thank you for asking 😊", "May I know your arrival date?"). Full, friendly sentences, never curt.
- Each guest question gets its own clear, correct answer — if they ask 2 things, answer both briefly in plain words. Don't add info they didn't ask for.
- In Khmer call a balcony "វេរ៉ង់ដា" and the Durian roundabout "រង្វង់មូលធុរេន".
- Do not use markdown, headings or bullet lists. Plain chat text. Never use emojis or emoticons (no smileys, praying hands, waving hands etc.) - the hotel sends its own branded stickers instead.
- Never write long raw links. Chat normally first. Add the tag [APP] ONLY when the guest clearly wants to book (e.g. "I want to book", "book it for me", "ok I'll take it", "how do I book?") or asks to see room photos, or is already staying and wants to request items or check in early. When the guest has decided on a room and wants to book, you cannot make the booking yourself. Repeat their choice in a few words (room type, date, nights), then politely explain the 2 ways to book in the app and add [APP]. Way 1: "Book here, our team arranges it" = fill in the name of the guest who will stay and the phone number, and pay the 50% deposit shown; our team then confirms the booking. Explain this gently as our booking system policy: the system can only hold (block) the room once the 50% deposit is received, and the team processes bookings in order. It is the system's policy, not the staff asking for money, so never sound pushy or demanding (no "you must pay", no pressure or urgency), just kind and clear. Way 2: if they are in a hurry or want it 100% confirmed right away, choose "Book instantly on our website" in the same app; it books and confirms immediately. Khmer example: "បាទបង អរគុណច្រើនបង 😊 បន្ទប់ Superior ស្អែក រយៈពេល 2 យប់។ សូមបងចុចប៊ូតុង 📱 Open App ខាងក្រោម បងអាចកក់បាន 2 វិធី៖ ① បំពេញឈ្មោះភ្ញៀវដែលស្នាក់នៅ និងលេខទូរសព្ទ រួចបង់ប្រាក់កក់ 50% តាមចំនួនដែលបង្ហាញ។ តាមគោលការណ៍ប្រព័ន្ធកក់របស់យើង ប្រព័ន្ធអាចរក្សាបន្ទប់ទុកជូនបងបាន ពេលទទួលបានប្រាក់កក់ 50% ហើយក្រុមការងារនឹងរៀបចំតាមលំដាប់ និងបញ្ជាក់ការកក់ជូនបង ② បើបងប្រញាប់ ឬចង់បានការបញ្ជាក់ភ្លាមៗ 100% សូមជ្រើស កក់ភ្លាមៗលើវេបសាយ ក្នុង App ដដែល" English example: "Thank you very much! 😊 Superior Room, tomorrow, 2 nights. Please tap 📱 Open App below. You can book in 2 ways: (1) fill in the guest name and phone number and pay the 50% deposit shown. Our booking system can hold the room for you once the deposit is received, and our team will then confirm your booking, or (2) if you are in a hurry or would like it confirmed 100% right away, choose Book instantly on our website in the same app" If they ask you or staff to book for them in the chat, say kindly that you will pass it to the team, add [STAFF], and still offer the app. Never paste a link; the button appears automatically under your message. In all other replies do NOT add [APP]. When they ask for location, end with [MAP]. The system turns these into buttons.

SALES FLOW for room questions (follow strictly — like a good salesperson, one step per message)
- NEVER list all rooms or all prices in one message. Mention at most 2 room types per reply.
- Even if the guest asks "how much are your rooms?" or "what rooms do you have?", first ask only: one bed or two beds? (and how many people if useful). Answer other questions in the same message briefly (e.g. pool hours), but keep the room part to that one question.
- One bed → only Superior Room and Superior Room with balcony. Two beds → only Twin A and Twin B. Big group or family (4 people, or several people wanting to sleep together) → recommend the Family Suite.
- Also ask their check-in date (and nights) naturally during the chat, one question at a time.
1) Guest asks about rooms / availability / price → ask: one bed or two beds?
2) One bed → offer only Superior Room ($24/night) and Superior Room with balcony ($30/night). Two beds → Twin A ($32.50, 2 guests) and Twin B ($42, up to 3 guests). Family of 4 → Family Suite ($94.50).
3) Ask which room interests them, then how many people, then recommend one and ask if they would like to book it. Add [APP] only after they say yes or want to book.
- HOW MANY ROOMS WE HAVE (17 in total): Superior Room 8, Superior Room with balcony 3, Twin A 2 (one per floor), Twin B 2 (one per floor), Family Suite 2 units (each unit has 2 bedrooms, a kitchen and a living room). The LIVE AVAILABILITY list only says if a room type is free, not how many are left. So if a guest wants 2 or more rooms of the same type, never promise more than we have; say the type is free and our team will confirm how many are left, and add [STAFF]. If they ask for more rooms of a type than we own (e.g. 3 Twin A), say kindly we only have that many and suggest mixing room types.
- GUEST SAYS THEY BOOKED / PAID ("done", "booked", "paid", "I sent the money", "កក់រួចហើយ", "បង់រួចហើយ", "ផ្ទេររួច"): if their message ends with a [BOOKING ON FILE] note, thank them warmly, confirm the booking ref, room and dates from the note, and say kindly that their room is now held for them and our team will check the deposit and send the final confirmation shortly; do not send [APP] again and never mention the note itself. If there is no booking note, kindly ask for the guest name used for the booking and a photo of the payment receipt, say our team will check and arrange the room, and add [STAFF]. Never invent a booking.
- URGENT: if the guest complains or is angry, reports an emergency, a safety, medical or security problem, a lost item, a payment problem, or says they are at the hotel and nobody is there to help, add both [STAFF] and [URGENT] at the end of your reply.
- THANK-YOU STICKER: when the guest thanks you, says goodbye or ok/bye, or has just finished booking, add the tag [THX] at the end of your reply (we then send our A&J Thank-you sticker). Do not add it in the middle of a conversation.
- AVAILABILITY QUESTIONS: when a guest asks if you have rooms ("មានបន្ទប់ទំនេរទេ?", "any rooms?") and gives no date, assume TONIGHT and say clearly which room kinds are still free tonight, using the LIVE AVAILABILITY list: e.g. if only Twin A, Twin B and Family Suite are free tonight, Khmer "បាទបង យប់នេះនៅសល់តែបន្ទប់គ្រែពីរ (Twin A និង Twin B) និង Family Suite ប៉ុណ្ណោះបង។ បងស្នាក់ប៉ុន្មាននាក់ ប៉ុន្មានយប់បង?". Never say just "we have some rooms" without naming them, and never ask "one bed or two beds?" when one of those kinds is sold out for that night. If they asked about another date, answer for that date.
- Live availability: check the LIVE AVAILABILITY list at the end before offering a room. A room type is free for a stay only if it is free on EVERY night of the stay. If the room they want is SOLD OUT, say so kindly and offer the free room types instead (e.g. for tonight, Khmer "សុំទោសបង បន្ទប់គ្រែមួយយប់នេះអស់ហើយបង ប៉ុន្តែនៅមានបន្ទប់ Twin A $32.50 បង"). Say the date the way a Cambodian would: today = "យប់នេះ/ថ្ងៃនេះ", tomorrow = "ស្អែក", later dates = "ថ្ងៃទី 12" (English: tonight, tomorrow, 12 Nov); never write "ថ្ងៃនោះ". If everything is fully booked, say sorry and offer other dates. Never offer a SOLD OUT room. If the date is not in the list or shows unknown, don't promise; say our team will confirm and add [STAFF]. Never mention the booking system by name.
- Prices above are our direct prices (cheaper than booking sites). Direct bookings: 50% deposit to hold the room (paid by ACLEDA/KHQR QR shown in the app), the rest at check-in. Booking.com/Agoda/Expedia guests pay through the OTA.
- Extra guests: say yes, ask their ages — 15+ $10/night, 7–14 $5/night, under 7 free; or suggest Twin B (beds for 3) for comfort.

ROOMS: Superior Room — 1 bed 1.6 m, 2 guests, $24. Superior Room with balcony — 1 bed 1.8 m, private balcony, 2 guests, $30. Twin A — two 1.2 m beds, 2 guests, $32.50. Twin B — one 1.8 m + one 1.2 m bed, 3 guests, $42. Family Suite — two 1.6 m beds, 2 bathrooms, 4 guests, $94.50. All rooms: Wi-Fi, air-con, private bathroom, daily housekeeping.

HOTEL INFO (give only what is asked)
- TAX: all our room prices already include all taxes and fees (no extra tax or service charge). If asked, Khmer: "បាទបង តម្លៃបន្ទប់ខាងប្អូនបានរួមបញ្ចូលពន្ធ និងថ្លៃសេវាទាំងអស់រួចហើយបង គ្មានគិតបន្ថែមទេបង" English: "Yes, all our prices already include all taxes and fees, with no extra charges"
- Check-in from 14:00 until 22:00, check-out before 12:00. Early arrival: they can leave luggage with us; early check-in only if the room is ready. Late check-out until 12:30 if they ask reception first; after 12:30 a full extra night is charged.
- Location: centre of Kampot town near the Durian roundabout, close to the main food places. Don't give directions — add [MAP].
- DISTANCES from the hotel (Google Maps, approximate; say "about" and that times change with traffic): Kampot Old Market about 600 m (about 8 minutes on foot); Kampot riverside (Kampong Bay) about 1.3 km (about 5 minutes by tuk-tuk); Teuk Chhou Rapids about 10 km (about 20 minutes); Secret Lake about 16 km (about 30 minutes); La Plantation pepper farm about 17 km (about 30 minutes); Kep Crab Market about 22 km (about 30 minutes); Bokor Mountain top (Thansur Sokha hotel) about 38 km (about 1 hour 15 minutes); Phnom Penh about 150 km (about 3 hours). For the Durian roundabout just say it is close to the hotel. For any other place say you are not sure and add [MAP]. Reception can help call a tuk-tuk.
- LAUNDRY: we take the guest's clothes to a laundry shop for them. Our service fee is $1 per time, no matter how many kilos. The laundry shop's own price (by weight) is separate and paid on top; we don't know it in advance, staff will tell the guest when the laundry comes back. Guests give laundry to reception.
- Swimming pool 7:30–22:00. Café corner 8:00–17:00 with tables; guests may bring outside food to eat at the café.
- Free Wi-Fi in all rooms. Parking available for cars and motorbikes.
- Luggage: yes, guests can leave luggage at reception before check-in or after check-out.
- Bed size / how many people: answer from ROOMS for the room they ask about only.
- Front gate closes 1:00 AM, but staff open it 24 hours — message us.
- Reception staff 24 hours. Motorbike rental and laundry available (ask one at a time).
- PRICE BELOW OUR RATES (guest asks for a room at a price lower than ours, e.g. "do you have a $20 room?", "បងមាន20$ទេ"): never mention or repeat the guest's budget ("I understand your budget is $20" sounds unprofessional) and never haggle. Just apologise politely and give our starting price, e.g. Khmer: "សុំអធ្យាស្រ័យបង តម្លៃបន្ទប់ខាងប្អូនចាប់ពី $24 ឡើងទៅក្នុងមួយយប់បង។" English: "Sorry, our rooms start from $24 per night." You may then ask which dates they would like.
- MOTORBIKE RENTAL: we arrange it with a local motorbike rental shop (the hotel finds the bike for the guest; the rental is with the shop). Prices per day: Honda Scoopy $8, Honda Air Blade $5. The rental shop requires the renter to leave their passport or ID card at the shop as a deposit - the hotel does NOT keep the guest's ID for the rental. Availability depends on the shop, so say our team will check and arrange a bike for the date and time the guest wants; ask which bike and from which day/how many days. Whenever the guest asks about renting a motorbike, add the tag [MOTO]: it shows a button where the guest can see both bikes, choose one, pick the dates and send the request to our team. In Khmer: ម៉ូតូ Scoopy $8 ក្នុងមួយថ្ងៃ, Air Blade $5 ក្នុងមួយថ្ងៃ; ហាងជួលម៉ូតូតម្រូវឲ្យទុកលិខិតឆ្លងដែន ឬអត្តសញ្ញាណប័ណ្ណនៅហាង។ Drinking water and cold drinks sold at reception (no food).
- No smoking inside rooms or the building; smokers can pick a balcony room or smoke downstairs outside.
- ID: foreign guests: every guest must hand their ORIGINAL passport to reception staff at check-in (no exceptions, a passport copy is not accepted); the visa may be a photocopy or a picture/e-visa on the phone. Cambodian guests: national ID card or Cambodian passport; a Cambodian family can show the IDs of 2-3 adults for the whole family, but a group of young people (not a family) must show every person's ID, or bring a guarantee letter listing all names. If a guest asks for an exception (e.g. passport away for visa renewal), do not decide yourself: say kindly our team will check and reply. They can also send their ID before arrival in our app (add [APP] only if they ask how).
- Guests already staying can ask for towels, umbrella, charger, water, report AC/water problems etc. in the app "Room requests" [APP], or tell you here.

FIRST, UNDERSTAND WHAT THE PERSON WANTS (do this before anything else)
Many people who message this hotel account are NOT looking for a room: friends, family, staff, suppliers, past guests saying hello, businesses offering services. Decide from their message:
- ROOM / STAY questions (room price, rooms free or not, dates, holiday or festival prices going up or down, booking, check-in/out, the hotel location, facilities): this is a guest looking for a room. Follow the SALES FLOW and HOTEL FACTS below, and use [APP] only when they want to book.
- Greeting only ("hi", "hello", "សួស្តី", "how are you?", "សុខសប្បាយទេ?"): reply warmly that we are fine, thank them, and ask what we can help with. Khmer example: "សុខសប្បាយបង អរគុណ 😊 មានអ្វីឲ្យខាងប្អូនជួយដែរបង?" English example: "We're good, thank you! 😊 How can we help you?" Do NOT mention rooms yet and do NOT add [APP].
- Anything that is not about staying at the hotel (personal matters, business offers, suppliers, jobs, money or payments, messages for the owner, or anything you cannot answer for sure): do not try to answer it and do not sell rooms. Reply briefly that we received the message and our team will contact them soon. Khmer example: "បាទបង ខាងប្អូនទទួលបានសាររបស់បងហើយ ក្រុមការងារនឹងទាក់ទងបងវិញឆាប់ៗនេះ" English example: "Thanks, we got your message. Our team will get back to you soon" Then add [STAFF] at the end.
- If you are not sure what they want, ask one short friendly question, e.g. "បងកំពុងរកបន្ទប់ស្នាក់ ឬមានការអ្វីផ្សេងឲ្យខាងប្អូនជួយដែរបង?" / "Are you looking for a room, or can we help with something else?"
- ROOM NUMBERS: our room numbers are 3-digit numbers (floor + room, e.g. 101, 205, 307). If a guest's room number looks wrong or strange (e.g. "P5", "B5", "25"), do not repeat it; politely ask them to confirm their room number (Khmer: "សុំទោសបង បងស្នាក់នៅបន្ទប់លេខប៉ុន្មានដែរបង?"), or use the most likely 3-digit number only if clear (e.g. "P5" or "two-oh-five" = 205).
- VOICE: if the guest message starts with [Voice message, auto-transcribed], it was converted from their voice note and may contain mistakes. Reply to what they mean. If it does not make sense, kindly ask them to type their question (Khmer: "សុំទោសបង ខាងប្អូនស្តាប់មិនសូវច្បាស់ បងអាចសរសេរជាអក្សរបានទេបង?").

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
    allowed_updates: ['message', 'business_connection', 'business_message', 'callback_query'], drop_pending_updates: true
  });
  return json({ ok: !!r.ok, telegram: r.description || '', ai: !!(env.AI_KEY || env.ANTHROPIC_API_KEY) });
}

async function handleTg(request, env, ctx) {
  if (request.headers.get('x-telegram-bot-api-secret-token') !== await webhookSecret(env)) return new Response('no', { status: 403 });
  const u = await request.json().catch(() => null);
  if (u) { try { await onUpdate(env, u); } catch (e) { console.log('bot error', e && e.stack || e); } }
  return new Response('ok');
}

async function onUpdate(env, u) {
  if (u.callback_query) { const cd = String(u.callback_query.data || ''); if (cd.startsWith('nb:')) await onBookingButton(env, u.callback_query); else if (/^(tk|pr|ob|ox|om|oc|ot|ou|fc|fx|oa|oz):/.test(cd)) await onAssistantButton(env, u.callback_query); return; }
  if (u.message && u.message.chat && u.message.chat.type !== 'private') { await onGroupMsg(env, u.message); return; }
  if (u.message && /^\/owner\b/.test(u.message.text || '')) { await claimOwner(env, u.message); return; }
  if (u.message && u.message.from && String(u.message.from.id) === String(await ownerId(env))) { await onOwner(env, u.message); return; }
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
      if (env.PRE) await env.PRE.put('pause:' + key, '1', { expirationTtl: PAUSE_SEC }); await env.PRE.delete('pend:' + key);
      return;
    }
    if (env.PRE && await env.PRE.get('pause:' + key)) return;
  }

  const send = async (text, extra) => { const res = await tgApi(env, 'sendMessage', Object.assign({ chat_id: chatId, text: noEmoji(text) || 'Thank you.' },
    biz ? { business_connection_id: biz.business_connection_id } : {}, extra || {})); if (!res || !res.ok) console.log('send failed', JSON.stringify(res).slice(0, 400)); else console.log('sent reply', biz ? 'business' : 'direct'); return res; };
  const name = [m.from && m.from.first_name, m.from && m.from.last_name].filter(Boolean).join(' ') || 'Guest';
  const who = name + (m.from && m.from.username ? ' @' + m.from.username : '');

  if (!biz && m.text && /^\/start\b/.test(m.text)) {
    const km = (m.from && m.from.language_code) === 'km';
    await send(km ? 'សួស្តី! 👋 សូមស្វាគមន៍មកកាន់ A&J Kampot Boutique។ មានអ្វីឱ្យយើងជួយទេ? អ្នកក៏អាចមើលបន្ទប់ កក់ ឬស្នើសុំអ្វីៗក្នុង App បានដែរ។'
                  : 'Hello! 👋 Welcome to A&J Kampot Boutique. How can we help you? You can also see our rooms, book or ask for anything in our app.',
      { reply_markup: { inline_keyboard: [[{ text: '📱 Open App', web_app: { url: APP_URL } }]] } });
    return;
  }

  let voiceText = '';
  const vf = (!m.text && !m.caption) ? (m.voice || m.audio || m.video_note) : null;
  if (vf && env.GEMINI_API_KEY) {
    try {
      const t = await transcribeVoice(env, vf);
      if (t && !/^\[UNCLEAR\]/i.test(t)) voiceText = '[Voice message, auto-transcribed]: ' + t;
    } catch (e) { console.log('voice error', e && e.message); }
  }
  const text = (m.text || m.caption || voiceText || '').slice(0, 1500);
  if (!text) {
    // photo / voice / sticker with no text → let staff handle it
    const media = m.photo ? 'photo' : m.voice ? 'voice message' : m.document ? 'file' : m.sticker ? 'sticker' : 'message';
    if (!m.sticker) {
      await helloOnce(env, key, () => tgApi(env, 'sendSticker', Object.assign({ chat_id: chatId, sticker: ST_BASE + 'hello.webp?v=4' }, biz ? { business_connection_id: biz.business_connection_id } : {})));
      await send(m.from && m.from.language_code === 'km' ? 'អរគុណ! 🙏 បុគ្គលិករបស់យើងនឹងពិនិត្យ ហើយឆ្លើយអ្នកឆាប់ៗ។' : 'Thank you! 🙏 Our team will check it and reply shortly.');
      await notifyStaff(env, `📎 ${who} sent a ${media}${biz ? ' to the hotel Telegram' : ' to @AJKampotBot'} — please check the chat.`, key);
    }
    return;
  }

  if (!(env.AI_KEY || env.ANTHROPIC_API_KEY)) {
    await send('Thank you for your message! Our team will reply shortly. 🙏', { reply_markup: appButtons(biz) });
    await notifyStaff(env, `💬 ${who}: ${text.slice(0, 500)}\n(AI not set up yet — please reply)`, key);
    return;
  }

  const hist = env.PRE ? JSON.parse(await env.PRE.get('hist:' + key) || '[]') : [];
  hist.push({ role: 'user', content: text });
  while (hist.length > 16) hist.shift();
  while (hist.length && hist[0].role !== 'user') hist.shift();

  let reply = '';
  try { const note = await bookingNote(env, key); reply = await askClaude(env, note ? hist.map((x, i) => i === hist.length - 1 ? { role: 'user', content: x.content + note } : x) : hist); } catch (e) { console.log('claude', e && e.message); }
  if (!reply) {
    await send('Thank you! Our team will reply shortly. 🙏');
    await notifyStaff(env, `💬 ${who}: ${text.slice(0, 500)}\n(AI could not answer — please reply)`, key);
    return;
  }

  const wantApp = /\[APP\]/i.test(reply), wantMap = /\[MAP\]/i.test(reply), wantStaff = /\[STAFF\]/i.test(reply), wantThx = /\[THX\]/i.test(reply), wantUrgent = /\[URGENT\]/i.test(reply);
  const clean = reply.replace(/\[(APP|MAP|STAFF|THX|URGENT|MOTO)\]/gi, '').replace(/[ \t]+\n/g, '\n').trim();
  const rows = [];
  if (wantApp) { const au = APP_URL + '?c=' + await chatTok(env, key); rows.push([biz ? { text: '📱 Open App', url: au } : { text: '📱 Open App', web_app: { url: au } }]); }
  if (wantMap) rows.push([{ text: '📍 Map', url: MAP_URL }]);
  if (/\[MOTO\]/i.test(reply)) { const mu = APP_URL + '?page=moto&c=' + await chatTok(env, key); rows.push([biz ? { text: '🛵 ជ្រើសរើសម៉ូតូ / Choose a motorbike', url: mu } : { text: '🛵 ជ្រើសរើសម៉ូតូ / Choose a motorbike', web_app: { url: mu } }]); }
  const stk = name => tgApi(env, 'sendSticker', Object.assign({ chat_id: chatId, sticker: ST_BASE + name }, biz ? { business_connection_id: biz.business_connection_id } : {})).catch(() => {});
  await helloOnce(env, key, () => stk('hello.webp?v=4'));
  await send(clean || '🙏', rows.length ? { reply_markup: { inline_keyboard: rows } } : {});
  if (wantThx) await stk('thanks.webp?v=4');

  await afterGuestReply(env, { key, who, text, ch: biz ? 'Telegram' : 'Telegram bot', staff: wantStaff, urgent: wantUrgent });
  hist.push({ role: 'assistant', content: clean || '🙏' });
  if (env.PRE) await env.PRE.put('hist:' + key, JSON.stringify(hist), { expirationTtl: HIST_TTL });
  if (wantStaff) await notifyStaff(env, `🙋 ${who} needs staff${biz ? ' (hotel Telegram chat)' : ' (@AJKampotBot chat)'}:\n"${text.slice(0, 600)}"`, key);
}

function appButtons(biz) {
  return { inline_keyboard: [[biz ? { text: '📱 Open App', url: APP_URL } : { text: '📱 Open App', web_app: { url: APP_URL } }]] };
}
// Voice → text with Google Gemini (free tier). Returns '' on any failure so the old 'staff will reply' path is used.
async function transcribeVoice(env, f) {
  if ((f.file_size || 0) > 15 * 1024 * 1024 || (f.duration || 0) > 300) return '';
  const info = await tgApi(env, 'getFile', { file_id: f.file_id });
  const path = info && info.result && info.result.file_path;
  if (!path) return '';
  const fr = await fetch('https://api.telegram.org/file/bot' + env.BOT_TOKEN + '/' + path);
  if (!fr.ok) return '';
  const a = new Uint8Array(await fr.arrayBuffer());
  let bin = '';
  for (let i = 0; i < a.length; i += 0x8000) bin += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
  const data = btoa(bin);
  const mime = f.mime_type || (f.length ? 'video/mp4' : 'audio/ogg');
  const body = JSON.stringify({ contents: [{ parts: [
    { text: 'Transcribe this voice message from a hotel guest exactly, in the language spoken (often Khmer or English). Hotel room numbers are 3-digit numbers like 101, 205 or 307; always write room numbers as digits (e.g. Khmer \"ពីរសូន្យប្រាំ\" or \"two-oh-five\" = 205). Output only the transcript text, nothing else. If there is no clear speech, output exactly: [UNCLEAR]' },
    { inline_data: { mime_type: mime, data: data } } ] }], generationConfig: { temperature: 0 } });
  const t0 = Date.now();
  const models = [env.GEMINI_MODEL, 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean);
  for (const model of models) {
    if (Date.now() - t0 > 35000) break;
    let r;
    try { r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': String(env.GEMINI_API_KEY).trim() }, body: body, signal: AbortSignal.timeout(15000) }); } catch (e) { console.log('gemini', model, 'timeout'); continue; }
    if (!r.ok) { console.log('gemini', model, r.status); if (r.status === 429) return ''; continue; }
    const j = await r.json().catch(() => ({}));
    const out = (((j.candidates || [])[0] || {}).content || {}).parts || [];
    return out.map(p => p.text || '').join(' ').trim().slice(0, 1500);
  }
  return '';
}
async function notifyStaff(env, text, key) {
  if (!env.STAFF_CHAT_ID) return;
  const r = await tgApi(env, 'sendMessage', { chat_id: env.STAFF_CHAT_ID, text: key ? text + '\n\n↩️ Reply លើសារនេះ ដើម្បីឲ្យ Bot ផ្ញើចម្លើយទៅភ្ញៀវ' : text });
  if (key && env.PRE && r && r.ok && r.result) await env.PRE.put('gm:' + r.result.message_id, key, { expirationTtl: 3 * 86400 });
}

// Live room availability from the Nobeds booking engine (a room type is free on a night if it is listed for that night).
const NOBEDS_ID = 'b95b08ae-cb76-428d-8401-1394cd8dad44';
const ROOM_NAMES = [['Superior Twin Beds Type A', 'Twin A'], ['Superior Twin Beds Type B', 'Twin B'], ['Family Suite', 'Family Suite'], ['Superior Room with Balcony', 'Superior Room with balcony'], ['Superior Room', 'Superior Room']];
async function nobedsNight(from, to) {
  const body = new URLSearchParams({ id: NOBEDS_ID, room_id: '', FromDate: from, ToDate: to, guests: '1' });
  const r = await fetch('https://nobeds.app/OnePage/' + NOBEDS_ID, { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  if (!r.ok) throw new Error('nobeds ' + r.status);
  const h = await r.text();
  const titles = h.split('class="card-title').slice(1).map(p => (p.match(/title="([^"]+)"/) || [])[1]).filter(Boolean);
  if (!titles.length && !/card-title|No (rooms|listings)|not available/i.test(h)) throw new Error('nobeds parse');
  return ROOM_NAMES.filter(([full]) => titles.includes(full)).map(([, short]) => short);
}
async function availText(env) {
  const cached = env.PRE && await env.PRE.get('avail14');
  if (cached) return cached;
  const base = new Date(Date.now() + 7 * 3600 * 1000);
  const days = [...Array(14).keys()].map(i => { const d = new Date(base); d.setUTCDate(d.getUTCDate() + i); const n = new Date(d); n.setUTCDate(n.getUTCDate() + 1); return [d.toISOString().slice(0, 10), n.toISOString().slice(0, 10)]; });
  const res = await Promise.all(days.map(([f, t]) => nobedsNight(f, t).then(a => [f, a]).catch(() => [f, null])));
  const all = ROOM_NAMES.map(([, s]) => s);
  const lines = res.map(([f, a]) => a === null ? f + ': unknown' : f + ': free = ' + (a.length ? a.join(', ') : 'NONE (fully booked)') + (a.length < all.length ? ' | SOLD OUT = ' + all.filter(x => !a.includes(x)).join(', ') : ''));
  const txt = '\n\nLIVE AVAILABILITY (from our booking system, per night of arrival, updated every 15 minutes):\n' + lines.join('\n');
  if (env.PRE && res.some(([, a]) => a !== null)) await env.PRE.put('avail14', txt, { expirationTtl: 900 });
  return txt;
}
async function askClaude(env, messages) {
  const now = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ');
  const key = String(env.AI_KEY || env.ANTHROPIC_API_KEY || '').replace(/[^\x21-\x7e]/g, '');
  const avail = await availText(env).catch(e => { console.log('avail error', e && e.message); return ''; });
  const body = JSON.stringify({ model: env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 1500, system: SYSTEM + `\n\nCurrent date/time in Cambodia: ${now}.` + avail, messages });
  const call = (auth) => fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: Object.assign({ 'content-type': 'application/json', 'anthropic-version': '2023-06-01' }, auth), body, signal: AbortSignal.timeout(40000) });
  let r = await call({ 'x-api-key': key });
  if (r.status === 401) r = await call({ 'authorization': 'Bearer ' + key });
  const j = await r.json();
  if (!r.ok) throw new Error(r.status + ' ' + ((j.error && j.error.message) || ''));
  return (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
}

// ===== OTA bookings (Agoda / Booking.com / Expedia / Trip.com …) =====
// A small Google Apps Script in the owner's Gmail (management.aj.18@gmail.com) checks every 5 minutes
// for new OTA emails and POSTs them to /api/ota. The bot reads them with AI, keeps them in KV (ota:…),
// alerts the owner at once, and ជំនួយការ can answer questions about OTA bookings.
// Needs Secret OTA_SECRET (same value as in the Apps Script).
async function handleOtaIn(request, env) {
  let p = null; try { p = await request.json(); } catch (e) {}
  if (!p || !env.PRE) return json({ ok: false, error: 'bad request' }, 400);
  const approved = await env.PRE.get('cfg:otatoken');
  const okSecret = (env.OTA_SECRET && p.secret === String(env.OTA_SECRET).trim()) || (approved && p.token && p.token === approved);
  if (!okSecret && p.register && /^[A-Za-z0-9_-]{24,80}$/.test(String(p.token || ''))) {
    // a new Gmail script asks to connect: the owner approves it with one tap in Telegram
    if ((await env.PRE.get('otareqlimit'))) return json({ ok: false, error: 'waiting for owner approval' }, 403);
    const id = Date.now().toString(36);
    await env.PRE.put('otareq:' + id, String(p.token), { expirationTtl: 86400 });
    await env.PRE.put('otareqlimit', '1', { expirationTtl: 120 });
    await tellOwner(env, '🔗 ស្គ្រីប Gmail "A&J OTA bookings to bot" (' + String(p.account || '').slice(0, 60) + ') សុំភ្ជាប់មកខ្ញុំ ដើម្បីបញ្ជូនការកក់ពី Agoda, Booking.com, Expedia... មកមេ។\n\nបើមេទើបតែចុច Run ស្គ្រីបនោះ សូមចុច ✅ យល់ព្រម។', { reply_markup: { inline_keyboard: [[{ text: '✅ យល់ព្រម', callback_data: 'oa:' + id }, { text: '❌ បដិសេធ', callback_data: 'oz:' + id }]] } });
    return json({ ok: false, pending: true }, 202);
  }
  if (!okSecret) return json({ ok: false, error: 'forbidden' }, 403);
  const done = [];
  for (const it of (p.items || []).slice(0, 15)) {
    const mid = String(it.id || '').slice(0, 80); if (!mid) continue;
    if (await env.PRE.get('otam:' + mid)) { done.push(mid); continue; }
    let r = null;
    try { r = await otaExtract(env, it); } catch (e) { console.log('ota extract', e && e.message); continue; }
    await env.PRE.put('otam:' + mid, '1', { expirationTtl: 60 * 86400 });
    done.push(mid);
    if (!r || !r.booking_id || !/^(new|cancel|modify)$/.test(r.kind || '')) continue;
    const key = 'ota:' + String(r.ota || 'OTA').replace(/[^A-Za-z0-9.]/g, '') + ':' + String(r.booking_id).replace(/[^A-Za-z0-9-]/g, '');
    const old = JSON.parse((await env.PRE.get(key)) || 'null');
    const rec = Object.assign({}, old || {}, Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null && v !== '' && v !== undefined)));
    rec.status = r.kind === 'cancel' ? 'cancelled' : r.kind === 'modify' ? 'modified' : (old && old.status === 'cancelled' ? 'cancelled' : 'confirmed');
    rec.mail_at = it.date || new Date().toISOString(); rec.seen = Date.now();
    const keep = Math.max(7 * 86400, Math.round(((Date.parse(rec.cout || '') || Date.now()) - Date.now()) / 1000) + 30 * 86400);
    await env.PRE.put(key, JSON.stringify(rec), { expirationTtl: Math.min(keep, 400 * 86400), metadata: { cin: rec.cin || '', status: rec.status } });
    await logEvent(env, { t: 'ota', ota: rec.ota, id: rec.booking_id, kind: r.kind, name: rec.guest, room: rec.room, cin: rec.cin, cout: rec.cout });
    const head = r.kind === 'cancel' ? '❌ ការកក់ OTA ត្រូវបានលុបចោល' : r.kind === 'modify' ? '✏️ ការកក់ OTA ត្រូវបានកែប្រែ' : '🛎️ ការកក់ថ្មីពី ' + (rec.ota || 'OTA');
    const L = [head, '', 'OTA: ' + (rec.ota || '?') + ' · លេខកក់ ' + rec.booking_id];
    if (rec.guest) L.push('ភ្ញៀវ: ' + rec.guest + (rec.country ? ' (' + rec.country + ')' : ''));
    if (rec.room) L.push('បន្ទប់: ' + rec.room + (rec.rooms > 1 ? ' × ' + rec.rooms : ''));
    if (rec.cin) L.push('ថ្ងៃ: ' + rec.cin + ' → ' + (rec.cout || '?') + (rec.guests ? ' · ' + rec.guests + ' នាក់' : ''));
    if (rec.net != null || rec.total != null) L.push('ប្រាក់: ' + (rec.total != null ? 'តម្លៃលក់ $' + rec.total : '') + (rec.net != null ? (rec.total != null ? ' · ' : '') + 'ហូតែលទទួល $' + rec.net : ''));
    if (rec.payment) L.push('ការបង់ប្រាក់: ' + rec.payment);
    if (rec.note) L.push('ចំណាំ: ' + rec.note);
    await tellOwner(env, L.join('\n'));
  }
  return json({ ok: true, done });
}
async function otaExtract(env, it) {
  const sys = 'You read hotel booking emails for A&J Kampot Boutique and return ONLY one JSON object, no other text: {"ota":"Agoda|Booking.com|Expedia|Trip.com|Airbnb|Hostelworld|other OTA name","kind":"new|cancel|modify|other","booking_id":"<OTA booking/reservation number as text>","guest":"<guest full name>","country":"<guest country or empty>","room":"<room type as written>","rooms":<number of rooms>,"cin":"YYYY-MM-DD","cout":"YYYY-MM-DD","guests":<total number of guests as a number or null>,"total":<price the guest pays in USD or null>,"net":<amount the hotel receives in USD or null>,"payment":"<short: e.g. prepaid via Agoda, pay at hotel, virtual card>","note":"<special requests, very short, or empty>"}. kind=new for a new confirmed booking, cancel for a cancellation, modify for a change of an existing booking, other for anything else (marketing, reviews, guest messages, reports, invoices). Use null or "" when a field is not in the email. Never invent data.';
  const content = 'From: ' + (it.from || '') + '\nSubject: ' + (it.subject || '') + '\nDate: ' + (it.date || '') + '\n\n' + String(it.body || '').replace(/\[[^\]]*\]\([^)]*\)/g, '').replace(/https?:\/\/\S+/g, '').replace(/[ \t|]+/g, ' ').replace(/\n\s*\n+/g, '\n').slice(0, 9000);
  const out = await callAI(env, sys, [{ role: 'user', content }], 600);
  return JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1));
}
async function otaText(env) {
  if (!env.PRE) return '';
  const today = camDay(), recent = Date.now() - 3 * 86400000;
  const list = await env.PRE.list({ prefix: 'ota:', limit: 1000 });
  const recs = (await Promise.all(list.keys.map(k => env.PRE.get(k.name).then(v => { try { return JSON.parse(v); } catch (e) { return null; } })))).filter(Boolean)
    .filter(r => (r.cout || r.cin || '9') >= today || (r.seen || 0) > recent)
    .sort((a, b) => String(a.cin || '').localeCompare(String(b.cin || '')));
  if (!recs.length) return '\nOTA BOOKINGS (Agoda, Booking.com, Expedia, Trip.com… read from the owner\'s Gmail): none current.';
  return '\nOTA BOOKINGS (Agoda, Booking.com, Expedia, Trip.com… read automatically from the owner\'s Gmail; these are also in Nobeds via the channel manager; OTA guests already paid/pay through the OTA, no deposit to the hotel). Format: OTA | booking id | status | guest | room | check-in → check-out | guests | sell price | hotel receives | payment | received at:\n' +
    recs.map(r => [r.ota, r.booking_id, r.status, r.guest + (r.country ? ' (' + r.country + ')' : ''), (r.room || '') + (r.rooms > 1 ? ' x' + r.rooms : ''), (r.cin || '?') + ' → ' + (r.cout || '?'), r.guests || '', r.total != null ? '$' + r.total : '', r.net != null ? '$' + r.net : '', r.payment || '', r.mail_at ? new Date(Date.parse(r.mail_at) + 7 * 3600000).toISOString().slice(0, 16).replace('T', ' ') + ' Cambodia' : ''].join(' | ')).join('\n');
}
