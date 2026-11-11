const r = await fetch('/api/v4/accounts/79c0c64e5dae0cbd703477140cfbae15/workers/scripts/aj-guest-app/content/v2', { credentials: 'include' });
const s = await r.text(); const bd = s.slice(0, s.indexOf('\r\n')); let c = s.split(bd)[1]; c = c.slice(c.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '');
const base = c.length, miss = [];
const rep = (a, fn) => { const n = c.split(a).length - 1; if (n !== 1) { miss.push(String(a).slice(0, 60) + ' x' + n); return; } c = c.replace(a, () => fn(a)); };
rep(`async function onOwner(env, m) {`, a => `// recent guest conversations (Telegram + Messenger), newest first
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
    out.push(\`[chat key=\${key}] \${v.who} (\${v.ch}), last message \${new Date(v.at + 7 * 3600000).toISOString().slice(0, 16).replace('T', ' ')} Cambodia time\${bn ? ' — HAS APP BOOKING' + bn.replace(/\\n/g, ' ') : ''}\\n\` +
      h.map(x => (x.role === 'user' ? '  Guest: ' : '  Bot: ') + String(x.content).replace(/\\[BOOKING ON FILE[^\\]]*\\]/g, '').replace(/\\s+/g, ' ').slice(0, 220)).join('\\n'));
  }
  return out.length ? '\\nRECENT GUEST CHATS (last 3 days, newest first; Telegram hotel account + Messenger):\\n' + out.join('\\n') : '\\nRECENT GUEST CHATS: none in the last 3 days.';
}
async function sendToGuest(env, key, text) {
  const t = noEmoji(text);
  if (key.startsWith('b:')) { const p = key.split(':'); const r = await tgApi(env, 'sendMessage', { business_connection_id: p[1], chat_id: p.slice(2).join(':'), text: t }); if (!r || !r.ok) return (r && r.description) || 'failed'; }
  else if (key.startsWith('d:')) { const r = await tgApi(env, 'sendMessage', { chat_id: key.slice(2), text: t }); if (!r || !r.ok) return (r && r.description) || 'failed'; }
  else if (key.startsWith('f:')) { const r = await fbSend(env, key.slice(2), { text: t }); if (!r || !r.message_id) return (r && r.error && r.error.message) || 'failed (Messenger allows replies only within 24 hours of the guest\\'s last message)'; }
  else return 'unknown chat';
  const h = JSON.parse((await env.PRE.get('hist:' + key)) || '[]'); h.push({ role: 'assistant', content: t }); while (h.length > 16) h.shift();
  await env.PRE.put('hist:' + key, JSON.stringify(h), { expirationTtl: HIST_TTL });
  return '';
}
` + a);
rep(`  const [data, board, avail] = await Promise.all([buildSummary(env, camDay(), 'TODAY DATA'), hubBoardText(env), availText(env).catch(() => '')]);`,
  () => `  const [data, board, avail, chats] = await Promise.all([buildSummary(env, camDay(), 'TODAY DATA'), hubBoardText(env), availText(env).catch(() => ''), recentChatsText(env).catch(() => '')]);`);
rep("DATA:\n${data}\n${board}\n${avail}\n", () => "DATA:\n${data}\n${chats}\n${board}\n${avail}\n");
rep(`- If the owner asks you to BOOK / reserve a room for a guest:`, a => `- If the owner asks you to SEND A MESSAGE / reply to a guest (e.g. "reply to that guest that the room is ready", "tell Thona the QR code is coming"): pick the guest from RECENT GUEST CHATS and return {"action":"message_guest","key":"<the exact chat key>","guest":"<guest name>","text":"<the message to the guest, in the guest's language, polite hotel front-office style, no emoji>","reply":"<short Khmer note to the owner>"}.
- When the owner asks to book for a guest who chatted (e.g. "book for the guest who asked about a Superior room"), take the details (name, room type, dates, guests) from RECENT GUEST CHATS; the guest name can be their chat name. If dates or room are not in the chat, ask the owner.
` + a);
rep(`  if (j.action === 'book' && j.name && j.room && j.cin && j.cout) {`, a => `  if (j.action === 'message_guest' && j.key && j.text) {
    const id = Date.now().toString(36);
    await env.PRE.put('omsg:' + id, JSON.stringify({ key: j.key, text: j.text, guest: j.guest || '' }), { expirationTtl: 86400 });
    return say(\`✉️ សូមមេបញ្ជាក់សារទៅភ្ញៀវ \${j.guest || ''}:\\n\\n"\${noEmoji(j.text)}"\`, { reply_markup: { inline_keyboard: [[{ text: '✅ ផ្ញើ', callback_data: 'om:' + id }, { text: '❌ បោះបង់', callback_data: 'oc:' + id }]] } });
  }
` + a);
rep(`/^(tk|pr|ob|ox):/.test(cd)`, () => `/^(tk|pr|ob|ox|om|oc):/.test(cd)`);
rep(`  if (d.startsWith('ob:') || d.startsWith('ox:')) {`, a => `  if (d.startsWith('om:') || d.startsWith('oc:')) {
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
` + a);
rep(`• /summary — សេចក្តីសង្ខេបឥឡូវ`, a => `• "មានភ្ញៀវណាសួររកបន្ទប់ទេ?" → ខ្ញុំមើលឆាតភ្ញៀវ (Telegram + Messenger) ៣ ថ្ងៃចុងក្រោយ\n• "ឆ្លើយភ្ញៀវ Thona ថា…" → ខ្ញុំផ្ញើជំនួសមេ (ពេលមេចុច ✅)\n` + a);
let ok; try { new Function(c.replace(/^import[^\n]*\n/, '').replace('export default', 'const __x=')); ok = 'ok'; } catch (er) { ok = 'ERR ' + er.message; }
let cb; if (!miss.length && ok === 'ok') { try { await navigator.clipboard.writeText(c); cb = 'ok'; } catch (er) { cb = 'ERR ' + er.message; } }
return JSON.stringify({ miss, ok, cb, base, len: c.length }).replace(/[?&=]/g, '~');
