const blk = await fetch(BLK_URL).then(r => r.text());
const r = await fetch('/api/v4/accounts/79c0c64e5dae0cbd703477140cfbae15/workers/scripts/aj-guest-app/content/v2', { credentials: 'include' });
const s = await r.text(); const bd = s.slice(0, s.indexOf('\r\n')); let c = s.split(bd)[1]; c = c.slice(c.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '');
const base = c.length, miss = [];
const rep = (a, fn, all) => { const n = c.split(a).length - 1; if (all ? n < 1 : n !== 1) { miss.push(String(a).slice(0, 50) + ' x' + n); return; } c = all ? c.split(a).join(fn(a)) : c.replace(a, () => fn(a)); };
rep('async function handleSend(request, env) {', a => blk + '\nfunction fbClean(m) { m = JSON.parse(JSON.stringify(m)); if (m.text) m.text = noEmoji(m.text) || "Thank you."; if (m.attachment && m.attachment.payload && m.attachment.payload.text) m.attachment.payload.text = noEmoji(m.attachment.payload.text) || "Please tap below."; return m; }\n' + a);
rep("    if (url.pathname === '/fb/webhook') return handleFb(request, env, url);", a => a + "\n    if (url.pathname.startsWith('/st/')) return stickerResponse(url.pathname.slice(4));");
rep("tgApi(env, 'sendMessage', Object.assign({ chat_id: chatId, text },", () => "tgApi(env, 'sendMessage', Object.assign({ chat_id: chatId, text: noEmoji(text) || 'Thank you.' },");
rep("message: Object.assign({ metadata: 'aj-bot' }, message)", () => "message: Object.assign({ metadata: 'aj-bot' }, fbClean(message))");
rep(".replace(/\\[(APP|MAP|STAFF)\\]/gi, '')", () => ".replace(/\\[(APP|MAP|STAFF|THX)\\]/gi, '')", true);
rep("wantStaff = /\\[STAFF\\]/i.test(reply);", () => "wantStaff = /\\[STAFF\\]/i.test(reply), wantThx = /\\[THX\\]/i.test(reply);", true);
// Telegram: hello sticker on a new conversation, thank-you sticker when [THX]
rep("  await send(clean || '🙏', rows.length ? { reply_markup: { inline_keyboard: rows } } : {});", a =>
  "  const stk = name => tgApi(env, 'sendSticker', Object.assign({ chat_id: chatId, sticker: ST_BASE + name }, biz ? { business_connection_id: biz.business_connection_id } : {})).catch(() => {});\n" +
  "  if (hist.length <= 1) await stk('hello.webp');\n" + a + "\n  if (wantThx) await stk('thanks.webp');");
// Messenger
rep("  if (buttons.length && clean.length <= 640)", a => "  if (hist.length <= 1) await fbSend(env, psid, { attachment: { type: 'image', payload: { url: ST_BASE + 'hello.png', is_reusable: true } } });\n" + a);
rep("  hist.push({ role: 'assistant', content: clean });\n  if (env.PRE) await env.PRE.put('hist:' + key, JSON.stringify(hist), { expirationTtl: HIST_TTL });\n  if (wantStaff) await notifyStaff(env, `🙋 ${who} needs staff (Facebook Messenger)",
  a => "  if (wantThx) await fbSend(env, psid, { attachment: { type: 'image', payload: { url: ST_BASE + 'thanks.png', is_reusable: true } } });\n" + a);
// prompt
const m = c.match(/Plain chat text, 0.1 emoji\./);
if (m) c = c.replace(m[0], 'Plain chat text. Never use emojis or emoticons (no smileys, praying hands, waving hands etc.) - the hotel sends its own branded stickers instead.'); else miss.push('emoji rule');
rep("- AVAILABILITY QUESTIONS:", a => "- THANK-YOU STICKER: when the guest thanks you, says goodbye or ok/bye, or has just finished booking, add the tag [THX] at the end of your reply (we then send our A&J Thank-you sticker). Do not add it in the middle of a conversation.\n" + a);
let ok; try { new Function(c.replace(/^import[^\n]*\n/, '').replace('export default', 'const __x=')); ok = 'ok'; } catch (er) { ok = 'ERR ' + er.message; }
let cb; if (!miss.length && ok === 'ok') { try { await navigator.clipboard.writeText(c); cb = 'ok'; } catch (er) { cb = 'ERR ' + er.message; } }
return JSON.stringify({ miss, ok, cb, base, len: c.length });
