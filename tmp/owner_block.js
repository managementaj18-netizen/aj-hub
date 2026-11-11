
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
  const call = (auth) => fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: Object.assign({ 'content-type': 'application/json', 'anthropic-version': '2023-06-01' }, auth), body });
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
async function buildSummary(env, day, title) {
  const ev = JSON.parse((env.PRE && await env.PRE.get('ev:' + day)) || '[]');
  const msgs = ev.filter(e => e.t === 'msg'), books = ev.filter(e => e.t === 'booking');
  const chats = {}; msgs.forEach(e => { chats[e.key] = e; });
  const byCh = {}; Object.values(chats).forEach(e => { byCh[e.ch] = (byCh[e.ch] || 0) + 1; });
  const L = [title, ''];
  L.push(`💬 ភ្ញៀវសរសេរមក: ${Object.keys(chats).length} នាក់` + (Object.keys(byCh).length ? ' (' + Object.entries(byCh).map(([k, v]) => k + ' ' + v).join(', ') + ')' : ''));
  L.push(`🛏️ ការកក់តាម App: ${books.length}`);
  books.forEach(b => L.push(`  • ${b.ref} ${b.name} · ${b.room} · ${b.cin}→${b.cout} · $${b.total} (កក់ $${b.deposit}) ${b.nb === 'done' ? '🔒 បិទ Nobeds រួច' : '⚠️ មិនទាន់បិទ Nobeds'}`));
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
  if (L.length <= 4 && !books.length && !pend.length) L.push('', 'គ្មានរឿងសំខាន់ត្រូវតាមដានទេ។');
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
• ☀️ ផ្ញើសេចក្តីសង្ខេបម៉ោង ៨ ព្រឹក និង 🌙 ម៉ោង ៩ យប់ (ម៉ោង Brisbane)

មេអាចសរសេរ ឬផ្ញើសំឡេងមកខ្ញុំ ឧ.:
• "ប្រាប់បុគ្គលិកឲ្យលាងម៉ាស៊ីនត្រជាក់បន្ទប់ 203 ស្អែកម៉ោង ៩" → ខ្ញុំផ្ញើទៅក្រុមបុគ្គលិក មានប៊ូតុង ✅ ធ្វើរួច
• "ថ្ងៃនេះមានអ្វីថ្មី?" → ខ្ញុំសង្ខេបជូន
• /summary — សេចក្តីសង្ខេបឥឡូវ · /tasks — ការងារមិនទាន់រួច
• ក្នុងក្រុមបុគ្គលិកថ្មី វាយ /setgroup ដើម្បីឲ្យការងារទៅក្រុមនោះ`;
async function onOwner(env, m) {
  const say = (text, extra) => tgApi(env, 'sendMessage', Object.assign({ chat_id: m.chat.id, text: String(text).slice(0, 4000), disable_web_page_preview: true }, extra || {}));
  let text = (m.text || m.caption || '').trim();
  if (!text && (m.voice || m.audio) && env.GEMINI_API_KEY) { try { const t = await transcribeVoice(env, m.voice || m.audio); if (t && !/^\[UNCLEAR\]/i.test(t)) text = t; } catch (e) {} }
  if (!text) return say('សូមសរសេរ ឬផ្ញើសំឡេងមកខ្ញុំ។');
  if (/^\/(start|help)\b/.test(text)) return say(OWNER_HELP);
  if (/^\/summary\b/.test(text)) return say(await buildSummary(env, camDay(), `📊 សេចក្តីសង្ខេបថ្ងៃនេះ (ម៉ោង ${camHM()} កំពត)`));
  if (/^\/tasks\b/.test(text)) {
    const open = [];
    for (const k of (await env.PRE.list({ prefix: 'task:' })).keys) { const t = JSON.parse((await env.PRE.get(k.name)) || 'null'); if (t && !t.done) open.push(t); }
    return say(open.length ? '📋 ការងារមិនទាន់រួច:\n' + open.map(t => `• ${t.text.slice(0, 120)} (ផ្ញើ ${camHM(t.at)})`).join('\n') : '✅ គ្មានការងារនៅសល់ទេ។');
  }
  const data = await buildSummary(env, camDay(), 'TODAY DATA');
  const sys = `You are the private assistant of the owner ("មេ") of A&J Kampot Boutique, a small hotel in Kampot, Cambodia. The owner lives in Brisbane and manages the hotel remotely; staff are at the hotel 24 hours. Reply ONLY with one JSON object, no other text:
- If the owner asks you to tell / ask / remind staff to do something: {"action":"task","staff_text":"<the instruction rewritten for the staff in clear, polite, natural Khmer, keeping every detail (room numbers, times, dates, amounts). Do not invent details.>","reply":"<short Khmer confirmation to the owner>"}
- Otherwise (a question, chat, asking for news or a summary): {"action":"answer","reply":"<helpful, short answer in Khmer (or English if the owner wrote English), using only the DATA below; if the data does not contain the answer, say so honestly>"}
Current Cambodia time: ${camNow().toISOString().slice(0, 16).replace('T', ' ')}.
DATA:
${data}`;
  let out = '';
  try { out = await callAI(env, sys, [{ role: 'user', content: text }], 900); } catch (e) { return say('⚠️ AI មិនអាចដំណើរការបានទេឥឡូវ: ' + (e && e.message)); }
  let j = null; try { j = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)); } catch (e) {}
  if (!j) return say(out || '...');
  if (j.action === 'task' && j.staff_text) {
    const ok = await postTask(env, j.staff_text);
    return say((ok ? '✅ ' : '⚠️ ') + (j.reply || 'បានផ្ញើទៅបុគ្គលិកហើយ') + '\n\n📋 ' + j.staff_text);
  }
  return say(j.reply || out);
}
async function onGroupMsg(env, m) {
  const t = String(m.text || '');
  if (/^\/setgroup\b/.test(t) && String(m.from && m.from.id) === String(await ownerId(env))) {
    await env.PRE.put('cfg:taskchat', String(m.chat.id));
    await tgApi(env, 'sendMessage', { chat_id: m.chat.id, text: '✅ ក្រុមនេះនឹងទទួលការងារពីថ្នាក់ដឹកនាំ តាមរយៈ Bot។' });
  }
}
