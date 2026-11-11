const r = await fetch('/api/v4/accounts/79c0c64e5dae0cbd703477140cfbae15/workers/scripts/aj-guest-app/content/v2', { credentials: 'include' });
const s = await r.text(); const bd = s.slice(0, s.indexOf('\r\n')); let c = s.split(bd)[1]; c = c.slice(c.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '');
const base = c.length, miss = [];
const rep = (a, fn) => { const n = c.split(a).length - 1; if (n !== 1) { miss.push(String(a).slice(0, 60) + ' x' + n); return; } c = c.replace(a, () => fn(a)); };
// prompt: booking action
rep(`- If the owner wants a reminder at a LATER time`, a => `- If the owner asks you to BOOK / reserve a room for a guest: {"action":"book","name":"<guest name>","phone":"<phone or empty>","country":"<country in English or empty>","room":"one of: Superior Room | Superior Room with Balcony | Superior Twin Beds Type A | Superior Twin Beds Type B | Family Suite","cin":"YYYY-MM-DD","cout":"YYYY-MM-DD","guests":<number>,"total":<total USD or null if not said>,"deposit":<deposit already paid in USD, 0 if not said>,"note":"<any extra info>","reply":"<short Khmer summary of the booking for the owner to confirm>"}. Room words: one bed / គ្រែមួយ = Superior Room; balcony / វេរ៉ង់ដា = Superior Room with Balcony; Twin A; Twin B; family / គ្រួសារ = Family Suite. If the name, room or dates are missing, use {"action":"answer","reply":"<ask the owner in Khmer for the missing details>"}.
` + a);
// handler
rep(`  if (j.action === 'remind' && j.when && j.text) {`, a => `  if (j.action === 'book' && j.name && j.room && j.cin && j.cout) {
    const PRICE = { 'Superior Room': 24, 'Superior Room with Balcony': 30, 'Superior Twin Beds Type A': 32.5, 'Superior Twin Beds Type B': 42, 'Family Suite': 94.5 };
    const nights = Math.max(1, Math.round((Date.parse(j.cout) - Date.parse(j.cin)) / 86400000) || 1);
    const bk = { room: j.room, cin: j.cin, cout: j.cout, nights, guests: String(j.guests || 2), time: '', name: j.name, country: j.country || '', phone: j.phone || '', email: '', note: (j.note ? j.note + ' · ' : '') + 'booked by owner', total: Number(j.total) || (PRICE[j.room] || 0) * nights, deposit: Number(j.deposit) || 0 };
    const id = Date.now().toString(36);
    await env.PRE.put('obk:' + id, JSON.stringify(bk), { expirationTtl: 86400 });
    return say(\`🛏️ សូមមេបញ្ជាក់ការកក់នេះ:\\n\\nភ្ញៀវ: \${bk.name}\${bk.phone ? ' · ' + bk.phone : ''}\${bk.country ? ' · ' + bk.country : ''}\\nបន្ទប់: \${bk.room}\\nថ្ងៃ: \${bk.cin} → \${bk.cout} (\${nights} យប់) · \${bk.guests} នាក់\\nសរុប: $\${bk.total} · បានកក់: $\${bk.deposit}\${j.note ? '\\nចំណាំ: ' + j.note : ''}\\n\\nពេលយល់ព្រម ខ្ញុំនឹងបិទបន្ទប់ក្នុង Nobeds (បើទំនេរ) ដាក់ក្នុង Form Check-in និងប្រាប់ក្រុមបុគ្គលិក។\`,
      { reply_markup: { inline_keyboard: [[{ text: '✅ យល់ព្រមកក់', callback_data: 'ob:' + id }, { text: '❌ បោះបង់', callback_data: 'ox:' + id }]] } });
  }
` + a);
// callbacks
rep(`/^(tk|pr):/.test(cd)`, () => `/^(tk|pr|ob|ox):/.test(cd)`);
rep(`  if (d.startsWith('pr:')) {`, a => `  if (d.startsWith('ob:') || d.startsWith('ox:')) {
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
    await tellOwner(env, ref ? \`✅ កក់រួច \${ref}: \${bk.name} · \${bk.room} · \${bk.cin} → \${bk.cout}\\n\${nb.ok ? '🔒 បានបិទបន្ទប់ក្នុង Nobeds ហើយ' : '⚠️ មិនអាចបិទក្នុង Nobeds: ' + nb.why + ' — បុគ្គលិកត្រូវបញ្ចូលដោយដៃ'}\\n📥 ដាក់ក្នុង Form Check-in និងប្រាប់ក្រុមបុគ្គលិករួចហើយ\` : '⚠️ មិនអាចកក់បានទេ សូមព្យាយាមម្តងទៀត។');
    return;
  }
` + a);
// help text: no fixed summary times
rep(`• ☀️ ផ្ញើសេចក្តីសង្ខេបម៉ោង ៨ ព្រឹក និង 🌙 ម៉ោង ៩ យប់ (ម៉ោង Brisbane)`, () => `• 📊 សង្ខេបជូនមេពេលណាក៏បាន (វាយ /summary) — ខ្ញុំធ្វើការ ២៤ ម៉ោង`);
rep(`• "ថ្ងៃនេះមានអ្វីថ្មី?" → ខ្ញុំសង្ខេបជូន`, a => a + `\n• "កក់បន្ទប់គ្រែមួយ ថ្ងៃ 20-22 ឲ្យ Sok Dara 012345678 បានកក់ $24" → ខ្ញុំបង្ហាញឲ្យមេបញ្ជាក់ ហើយកក់ក្នុង Nobeds + Form Check-in`);
let ok; try { new Function(c.replace(/^import[^\n]*\n/, '').replace('export default', 'const __x=')); ok = 'ok'; } catch (er) { ok = 'ERR ' + er.message; }
let cb; if (!miss.length && ok === 'ok') { try { await navigator.clipboard.writeText(c); cb = 'ok'; } catch (er) { cb = 'ERR ' + er.message; } }
return JSON.stringify({ miss, ok, cb, base, len: c.length }).replace(/[?&=]/g, '~');
