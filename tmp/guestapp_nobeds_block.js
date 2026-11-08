
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
  const f = new URLSearchParams({
    hotel: hid('hotel') || '1508197823', channel: hid('channel') || 'One page', checkin: b.cin, checkout: b.cout,
    total_night: String(b.nights), hidguest: guests, room_id: rid, cardexp: '', qnt: '1', bcolor: '', color: '',
    new_total: Number(b.total || 0).toFixed(2), verification: '', name: b.name, address: b.country || 'Cambodia',
    email: b.email || 'ajkampotboutique@gmail.com', phone: b.phone || '', country: cc, promo: '', comments: note
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
