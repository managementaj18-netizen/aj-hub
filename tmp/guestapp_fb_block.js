
// ---- Facebook Messenger (A&J Facebook Page) — same AI receptionist as Telegram ----
// Needs Secret FB_PAGE_TOKEN (Page access token). Optional Secret FB_APP_SECRET (checks Meta's signature).
// Meta webhook: callback URL <worker>/fb/webhook , verify token FB_VERIFY.
const FB_VERIFY = 'ajkampot-fb-webhook';
const FB_API = 'https://graph.facebook.com/v21.0';
async function fbSend(env, psid, message) {
  const r = await fetch(`${FB_API}/me/messages?access_token=${encodeURIComponent(env.FB_PAGE_TOKEN)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ recipient: { id: psid }, messaging_type: 'RESPONSE', message })
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
  const m = ev.message;
  if (!m) return;
  // Echo = a message the Page itself sent. Our own bot replies are remembered (fbsent:); anything else is staff typing → pause the AI in that chat.
  if (m.is_echo) {
    if (env.PRE && !(await env.PRE.get('fbsent:' + m.mid)) && ev.recipient && ev.recipient.id) await env.PRE.put('pause:f:' + ev.recipient.id, '1', { expirationTtl: PAUSE_SEC });
    return;
  }
  const psid = ev.sender && ev.sender.id;
  if (!psid) return;
  const key = 'f:' + psid;
  if (env.PRE && await env.PRE.get('pause:' + key)) return;
  let name = 'Messenger guest';
  try { const p = await (await fetch(`${FB_API}/${psid}?fields=first_name,last_name&access_token=${encodeURIComponent(env.FB_PAGE_TOKEN)}`)).json(); if (p.first_name) name = [p.first_name, p.last_name].filter(Boolean).join(' '); } catch (e) {}
  const who = name + ' (Messenger)';
  const text = (m.text || '').trim();
  if (!text) {
    if (m.sticker_id) return;
    await fbSend(env, psid, { text: 'Thank you! 🙏 Our team will check it and reply shortly. / អរគុណបង! 🙏 ក្រុមការងារយើងនឹងពិនិត្យ ហើយឆ្លើយបងឆាប់ៗ។' });
    await notifyStaff(env, `📎 ${who} sent a photo/file/voice on Facebook Messenger — please check the Page inbox.`);
    return;
  }
  fetch(`${FB_API}/me/messages?access_token=${encodeURIComponent(env.FB_PAGE_TOKEN)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ recipient: { id: psid }, sender_action: 'typing_on' }) }).catch(() => {});
  const hist = env.PRE ? JSON.parse(await env.PRE.get('hist:' + key) || '[]') : [];
  hist.push({ role: 'user', content: text });
  while (hist.length > 16) hist.shift();
  while (hist.length && hist[0].role !== 'user') hist.shift();
  let reply = '';
  try { reply = await askClaude(env, hist); } catch (e) { console.log('claude', e && e.message); }
  if (!reply) {
    await fbSend(env, psid, { text: 'Thank you! Our team will reply shortly. 🙏' });
    await notifyStaff(env, `💬 ${who}: ${text.slice(0, 500)}\n(AI could not answer — please reply in the Page inbox)`);
    return;
  }
  const wantApp = /\[APP\]/i.test(reply), wantMap = /\[MAP\]/i.test(reply), wantStaff = /\[STAFF\]/i.test(reply);
  const clean = reply.replace(/\[(APP|MAP|STAFF)\]/gi, '').replace(/[ \t]+\n/g, '\n').trim() || '🙏';
  const buttons = [];
  if (wantApp) buttons.push({ type: 'web_url', url: APP_URL, title: '📱 Open App' });
  if (wantMap) buttons.push({ type: 'web_url', url: MAP_URL, title: '📍 Map' });
  if (buttons.length && clean.length <= 640) await fbSend(env, psid, { attachment: { type: 'template', payload: { template_type: 'button', text: clean, buttons } } });
  else {
    await fbSend(env, psid, { text: clean.slice(0, 2000) });
    if (buttons.length) await fbSend(env, psid, { attachment: { type: 'template', payload: { template_type: 'button', text: '👇', buttons } } });
  }
  hist.push({ role: 'assistant', content: clean });
  if (env.PRE) await env.PRE.put('hist:' + key, JSON.stringify(hist), { expirationTtl: HIST_TTL });
  if (wantStaff) await notifyStaff(env, `🙋 ${who} needs staff (Facebook Messenger):\n"${text.slice(0, 600)}"`);
}
