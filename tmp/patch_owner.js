const blk = await fetch(BLK_URL).then(r => r.text());
const r = await fetch('/api/v4/accounts/79c0c64e5dae0cbd703477140cfbae15/workers/scripts/aj-guest-app/content/v2', { credentials: 'include' });
const s = await r.text(); const bd = s.slice(0, s.indexOf('\r\n')); let c = s.split(bd)[1]; c = c.slice(c.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '');
const base = c.length, miss = [];
const rep = (a, fn, all) => { const n = c.split(a).length - 1; if (all ? n < 1 : n !== 1) { miss.push(String(a).slice(0, 60) + ' x' + n); return; } c = all ? c.split(a).join(fn(a)) : c.replace(a, () => fn(a)); };
rep('async function handleSend(request, env) {', a => blk + '\n' + a);
rep('export default {\n  async fetch(request, env, ctx) {', () => 'export default {\n  async scheduled(event, env, ctx) { ctx.waitUntil(runCron(env, event.cron)); },\n  async fetch(request, env, ctx) {');
rep("  if (u.callback_query) { if (String(u.callback_query.data || '').startsWith('nb:')) await onBookingButton(env, u.callback_query); return; }", () =>
  "  if (u.callback_query) { const cd = String(u.callback_query.data || ''); if (cd.startsWith('nb:')) await onBookingButton(env, u.callback_query); else if (/^(tk|pr):/.test(cd)) await onAssistantButton(env, u.callback_query); return; }\n" +
  "  if (u.message && u.message.chat && u.message.chat.type !== 'private') { await onGroupMsg(env, u.message); return; }\n" +
  "  if (u.message && /^\\/owner\\b/.test(u.message.text || '')) { await claimOwner(env, u.message); return; }\n" +
  "  if (u.message && u.message.from && String(u.message.from.id) === String(await ownerId(env))) { await onOwner(env, u.message); return; }");
rep("wantThx = /\\[THX\\]/i.test(reply);", () => "wantThx = /\\[THX\\]/i.test(reply), wantUrgent = /\\[URGENT\\]/i.test(reply);", true);
rep(".replace(/\\[(APP|MAP|STAFF|THX)\\]/gi, '')", () => ".replace(/\\[(APP|MAP|STAFF|THX|URGENT)\\]/gi, '')", true);
rep("  hist.push({ role: 'assistant', content: clean || '🙏' });", a => "  await afterGuestReply(env, { key, who, text, ch: biz ? 'Telegram' : 'Telegram bot', staff: wantStaff, urgent: wantUrgent });\n" + a);
rep("  hist.push({ role: 'assistant', content: clean });", a => "  await afterGuestReply(env, { key, who, text, ch: 'Messenger', staff: wantStaff, urgent: wantUrgent });\n" + a);
rep("await env.PRE.put('pause:' + key, '1', { expirationTtl: PAUSE_SEC });", a => a + " await env.PRE.delete('pend:' + key);", true);
rep("await env.PRE.put('pause:f:' + ev.recipient.id, '1', { expirationTtl: PAUSE_SEC });", a => a + " await env.PRE.delete('pend:f:' + ev.recipient.id);");
rep("    await env.PRE.put('bk:' + ref, JSON.stringify(rec), { expirationTtl: TTL });\n  }", a => a + "\n  try { const rr = JSON.parse((await env.PRE.get('bk:' + ref)) || '{}'); await logEvent(env, { t: 'booking', ref, name: b.name, room: b.room, cin: b.cin, cout: b.cout, total: b.total, deposit: b.deposit, nb: rr.nb || '' }); await tellOwner(env, `🛏️ ការកក់ថ្មីពី App\\n${ref} · ${b.name} · ${b.room}\\n${b.cin} → ${b.cout} (${b.nights} យប់) · ${b.guests} នាក់\\nសរុប $${b.total} · កក់ $${b.deposit}${photos.length ? ' (មានវិក្កយបត្រ)' : ' (គ្មានវិក្កយបត្រ)'}\\n${rr.nb === 'done' ? '🔒 បិទក្នុង Nobeds រួច' : '⚠️ មិនទាន់បិទក្នុង Nobeds — បុគ្គលិកត្រូវឆែក'}`); } catch (e) { console.log('owner booking alert', e && e.message); }");
rep("- THANK-YOU STICKER:", a => "- URGENT: if the guest complains or is angry, reports an emergency, a safety, medical or security problem, a lost item, a payment problem, or says they are at the hotel and nobody is there to help, add both [STAFF] and [URGENT] at the end of your reply.\n" + a);
let ok; try { new Function(c.replace(/^import[^\n]*\n/, '').replace('export default', 'const __x=')); ok = 'ok'; } catch (er) { ok = 'ERR ' + er.message; }
let cb; if (!miss.length && ok === 'ok') { try { await navigator.clipboard.writeText(c); cb = 'ok'; } catch (er) { cb = 'ERR ' + er.message; } }
return JSON.stringify({ miss, ok, cb, base, len: c.length }).replace(/[?&=]/g, '~');
