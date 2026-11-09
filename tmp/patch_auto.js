// run in the Cloudflare tab: builds the patched worker and copies it to the clipboard
const r = await fetch('/api/v4/accounts/79c0c64e5dae0cbd703477140cfbae15/workers/scripts/aj-guest-app/content/v2', { credentials: 'include' });
const s = await r.text(); const bd = s.slice(0, s.indexOf('\r\n')); let c = s.split(bd)[1]; c = c.slice(c.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '');
const base = c.length, miss = [];
const rep = (a, fn, all) => { const n = c.split(a).length - 1; if (all ? n < 1 : n !== 1) { miss.push(a.slice(0, 50) + ' x' + n); return; } c = all ? c.split(a).join(fn(a)) : c.replace(a, () => fn(a)); };

// 1) helpers
rep('async function handleSend(request, env) {', a => `// ---- link a guest chat (Telegram / Messenger) to the booking made in the Guest App ----
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
  return \`\\n\\n[BOOKING ON FILE for this guest (internal note, never quote it): made in our Guest App, ref \${ref}, \${b.room}, \${b.cin} -> \${b.cout} (\${b.nights} night(s)), guest name \${b.name}, total $\${b.total}, deposit $\${b.deposit}, payment receipt uploaded: \${r.rc ? 'yes' : 'no'}, room held in our booking system: \${r.nb === 'done' ? 'yes' : 'not yet'}]\`;
}
` + a);

// 2) give the AI the booking note (Telegram + Messenger)
rep('try { reply = await askClaude(env, hist); }', () => 'try { const note = await bookingNote(env, key); reply = await askClaude(env, note ? hist.map((x, i) => i === hist.length - 1 ? { role: \'user\', content: x.content + note } : x) : hist); }', true);

// 3) Open App buttons carry the chat token
rep("if (wantApp) rows.push([biz ? { text: '📱 Open App', url: APP_URL } : { text: '📱 Open App', web_app: { url: APP_URL } }]);",
  () => "if (wantApp) { const au = APP_URL + '?c=' + await chatTok(env, key); rows.push([biz ? { text: '📱 Open App', url: au } : { text: '📱 Open App', web_app: { url: au } }]); }");
rep("if (wantApp) buttons.push({ type: 'web_url', url: APP_URL, title: '📱 Open App' });",
  () => "if (wantApp) buttons.push({ type: 'web_url', url: APP_URL + '?c=' + await chatTok(env, key), title: '📱 Open App' });");

// 4) the app sends the token back with the booking
rep("if (data) fd.append('data', JSON.stringify(data));", a => a + " try { const cq = new URLSearchParams(location.search).get('c'); if (cq) fd.append('chat', cq); } catch (e) {}");

// 5) booking record remembers the chat + receipt
rep("if (env.PRE) await env.PRE.put('bk:' + ref, JSON.stringify({ b, at: Date.now() }), { expirationTtl: TTL });", () =>
`let ck = '';
  try { const t = String(form.get('chat') || ''); if (t && env.PRE) ck = (await env.PRE.get('chatref:' + t)) || ''; } catch (e) {}
  if (!ck) { try { const u = JSON.parse(new URLSearchParams(String(form.get('initData') || '')).get('user') || 'null'); if (u && u.id) ck = 'd:' + u.id; } catch (e) {} }
  if (env.PRE) {
    await env.PRE.put('bk:' + ref, JSON.stringify({ b, at: Date.now(), ck, rc: photos.length > 0 }), { expirationTtl: TTL });
    if (ck) await env.PRE.put('bkchat:' + ck, ref, { expirationTtl: TTL });
  }`);

// 6) receipt uploaded -> block the room in Nobeds straight away
rep("if (!mj.ok) return { ok: false, error: mj.description };", a => a + `
  if (photos.length && env.PRE) {
    let ab;
    try { ab = await nobedsBook(b, ref, 'auto (Guest App, receipt uploaded)'); } catch (e) { ab = { ok: false, why: String(e && e.message || e) }; }
    const rec = JSON.parse((await env.PRE.get('bk:' + ref)) || '{}');
    const tg = (m, p) => fetch(\`\${api}/\${m}\`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) }).catch(() => {});
    if (ab.ok) {
      rec.nb = 'done'; rec.nbBy = 'auto'; rec.nbAt = Date.now();
      await tg('editMessageReplyMarkup', { chat_id: env.STAFF_CHAT_ID, message_id: mj.result.message_id, reply_markup: { inline_keyboard: [[{ text: '🔒 បានបិទក្នុង Nobeds ដោយស្វ័យប្រវត្តិ', callback_data: 'nb:' + ref }]] } });
      await tg('sendMessage', { chat_id: env.STAFF_CHAT_ID, reply_to_message_id: mj.result.message_id, text: \`🔒 \${ref}: Bot បានបិទបន្ទប់ក្នុង Nobeds រួចហើយ (\${b.room}, \${b.cin} → \${b.cout}, Promo)។\\nសូមឆែកប្រាក់កក់ \${money2(b.deposit)} ក្នុង ACLEDA ហើយកត់ក្នុង Nobeds។ បើលុយមិនចូល ឬវិក្កយបត្រខុស សូម Cancel ការកក់នេះក្នុង Nobeds ហើយទាក់ទងភ្ញៀវ។\` });
    } else {
      rec.nb = 'fail';
      await tg('sendMessage', { chat_id: env.STAFF_CHAT_ID, reply_to_message_id: mj.result.message_id, text: \`⚠️ \${ref}: មិនអាចបិទក្នុង Nobeds ដោយស្វ័យប្រវត្តិបានទេ — \${ab.why}\\nសូមឆែក ហើយចុចប៊ូតុង ឬបញ្ចូលដោយដៃក្នុង Nobeds។\` });
    }
    await env.PRE.put('bk:' + ref, JSON.stringify(rec), { expirationTtl: TTL });
  }`);

// 7) receptionist rule
rep("- AVAILABILITY QUESTIONS:", a => "- GUEST SAYS THEY BOOKED / PAID (\"done\", \"booked\", \"paid\", \"I sent the money\", \"កក់រួចហើយ\", \"បង់រួចហើយ\", \"ផ្ទេររួច\"): if their message ends with a [BOOKING ON FILE] note, thank them warmly, confirm the booking ref, room and dates from the note, and say kindly that their room is now held for them and our team will check the deposit and send the final confirmation shortly; do not send [APP] again and never mention the note itself. If there is no booking note, kindly ask for the guest name used for the booking and a photo of the payment receipt, say our team will check and arrange the room, and add [STAFF]. Never invent a booking.\n" + a);

let ok; try { new Function(c.replace(/^import[^\n]*\n/, '').replace('export default', 'const __x=')); ok = 'ok'; } catch (er) { ok = 'ERR ' + er.message; }
let cb; if (!miss.length && ok === 'ok') { try { await navigator.clipboard.writeText(c); cb = 'ok'; } catch (er) { cb = 'ERR ' + er.message; } }
JSON.stringify({ miss, ok, cb, base, len: c.length });
