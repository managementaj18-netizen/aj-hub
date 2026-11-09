const line = await fetch(LINE_URL).then(r => r.text());
const r = await fetch('/api/v4/accounts/79c0c64e5dae0cbd703477140cfbae15/workers/scripts/aj-guest-app/content/v2', { credentials: 'include' });
const s = await r.text(); const bd = s.slice(0, s.indexOf('\r\n')); let c = s.split(bd)[1]; c = c.slice(c.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '');
const base = c.length, miss = [];
const rep = (a, fn) => { const n = c.split(a).length - 1; if (n !== 1) { miss.push(String(a).slice(0, 50) + ' x' + n); return; } c = c.replace(a, () => fn(a)); };
const m = c.match(/const STICKERS = \{[^\n]*\};/); if (m) c = c.replace(m[0], () => line); else miss.push('stickers');
rep("  if (hist.length <= 1) await stk('hello.webp');\n", () => "  await helloOnce(env, key, () => stk('hello.webp'));\n");
rep("  if (hist.length <= 1) await fbSend(env, psid, { attachment: { type: 'image', payload: { url: ST_BASE + 'hello.png', is_reusable: true } } });\n", () => "  await helloOnce(env, key, () => fbSend(env, psid, { attachment: { type: 'image', payload: { url: ST_BASE + 'hello.png', is_reusable: true } } }));\n");
// media first message (Telegram)
rep("    if (!m.sticker) {\n      await send(", a => "    if (!m.sticker) {\n      await helloOnce(env, key, () => tgApi(env, 'sendSticker', Object.assign({ chat_id: chatId, sticker: ST_BASE + 'hello.webp' }, biz ? { business_connection_id: biz.business_connection_id } : {})));\n      await send(");
// media first message (Messenger)
rep("    if (m.sticker_id) return;\n", a => a + "    await helloOnce(env, key, () => fbSend(env, psid, { attachment: { type: 'image', payload: { url: ST_BASE + 'hello.png', is_reusable: true } } }));\n");
let ok; try { new Function(c.replace(/^import[^\n]*\n/, '').replace('export default', 'const __x=')); ok = 'ok'; } catch (er) { ok = 'ERR ' + er.message; }
let cb; if (!miss.length && ok === 'ok') { try { await navigator.clipboard.writeText(c); cb = 'ok'; } catch (er) { cb = 'ERR ' + er.message; } }
return JSON.stringify({ miss, ok, cb, base, len: c.length });
