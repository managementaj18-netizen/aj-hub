// A&J Kampot Boutique — Guest Mini App (Cloudflare Worker)
// One file: serves the app page AND forwards guest forms to the staff Telegram group.
// Settings (Cloudflare → Worker → Settings → Variables and Secrets):
//   BOT_TOKEN     = token from @BotFather            (type: Secret)
//   STAFF_CHAT_ID = staff Telegram group id, e.g. -1001234567890
//   PRE           = KV namespace binding — keeps early check-ins for the A&J Hub check-in form
//   ANTHROPIC_API_KEY = Claude API key (Secret) — AI receptionist answers guests on Telegram

const HTML = __HTML__;

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
  return json({ ok: !!r.ok, telegram: r.description || '', ai: !!env.ANTHROPIC_API_KEY });
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

  if (!env.ANTHROPIC_API_KEY) {
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
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 400, system: SYSTEM + `\n\nCurrent date/time in Cambodia: ${now}.`, messages })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
  return (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
}
