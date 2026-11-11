const r = await fetch('/api/v4/accounts/79c0c64e5dae0cbd703477140cfbae15/workers/scripts/aj-guest-app/content/v2', { credentials: 'include' });
const s = await r.text(); const bd = s.slice(0, s.indexOf('\r\n')); let c = s.split(bd)[1]; c = c.slice(c.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '');
const base = c.length, miss = [];
const rep = (a, fn) => { const n = c.split(a).length - 1; if (n !== 1) { miss.push(String(a).slice(0, 60) + ' x' + n); return; } c = c.replace(a, () => fn(a)); };
// 1) AI prompt: new "remind" action
rep(`- Otherwise (a question, chat, asking for news or a summary):`, a => `- If the owner wants a reminder at a LATER time or on a schedule (e.g. "remind me tomorrow at 9", "tell staff every day at 7am to check the water", "at 2pm remind staff to ..."): {"action":"remind","to":"owner" or "staff","when":"YYYY-MM-DD HH:MM" (Cambodia time),"repeat":"none" or "daily","text":"<the reminder text in clear polite Khmer; for staff write it as an instruction to staff>","reply":"<short Khmer confirmation to the owner that states the time in Cambodia time and in Brisbane time (Brisbane = Cambodia + 3 hours)>"}. Times the owner gives are Cambodia (hotel) time unless the owner says Brisbane/Australia time (then subtract 3 hours). If no date is given, use the next time that hour comes.
` + a);
// 2) handle it
rep(`  if (j.action === 'task' && j.staff_text) {`, a => `  if (j.action === 'remind' && j.when && j.text) {
    const m2 = String(j.when).match(/(\\d{4}-\\d{2}-\\d{2})[ T](\\d{1,2}):(\\d{2})/);
    if (!m2) return say('⚠️ ខ្ញុំមិនយល់ម៉ោងនោះទេ សូមប្រាប់ម្តងទៀត ឧ. "ស្អែកម៉ោង ៩ ព្រឹក"។');
    const due = Date.parse(m2[1] + 'T' + m2[2].padStart(2, '0') + ':' + m2[3] + ':00+07:00');
    const id = Date.now().toString(36);
    await env.PRE.put('rem:' + id, JSON.stringify({ id, due, to: j.to === 'staff' ? 'staff' : 'owner', text: j.text, repeat: j.repeat === 'daily' ? 'daily' : 'none' }), { expirationTtl: 90 * 86400 });
    return say('⏰ ' + (j.reply || 'កំណត់ការរំលឹករួចហើយ') + '\\n\\n' + j.text + (j.repeat === 'daily' ? '\\n(រាល់ថ្ងៃ)' : '') + '\\n\\nបោះបង់: /reminders');
  }
  if (/^\\/reminders\\b/.test(text)) {}
` + a);
// 3) /reminders list + cancel command
rep(`  if (/^\\/tasks\\b/.test(text)) {`, a => `  if (/^\\/reminders\\b/.test(text) || /^\\/cancel_/.test(text)) {
    const cm = text.match(/^\\/cancel_([a-z0-9]+)/);
    if (cm) { await env.PRE.delete('rem:' + cm[1]); return say('🗑️ បានបោះបង់ការរំលឹកហើយ។'); }
    const L = [];
    for (const k of (await env.PRE.list({ prefix: 'rem:' })).keys) { const v = JSON.parse((await env.PRE.get(k.name)) || 'null'); if (v) L.push(v); }
    L.sort((x, y) => x.due - y.due);
    return say(L.length ? '⏰ ការរំលឹក (ម៉ោងកំពត):\\n' + L.map(v => \`• \${new Date(v.due + 7 * 3600000).toISOString().slice(0, 16).replace('T', ' ')}\${v.repeat === 'daily' ? ' (រាល់ថ្ងៃ)' : ''} → \${v.to === 'staff' ? 'បុគ្គលិក' : 'មេ'}: \${v.text.slice(0, 80)}\\n   បោះបង់: /cancel_\${v.id}\`).join('\\n') : 'គ្មានការរំលឹកទេ។');
  }
` + a);
// 4) cron: send due reminders
rep(`    if (cron === '0 22 * * *') {`, a => `    if (env.PRE) {
      for (const k of (await env.PRE.list({ prefix: 'rem:' })).keys) {
        const v = JSON.parse((await env.PRE.get(k.name)) || 'null');
        if (!v || v.due > Date.now() + 60000) continue;
        if (v.to === 'staff') await postTask(env, '⏰ ' + v.text); else await tellOwner(env, '⏰ រំលឹក: ' + v.text);
        if (v.repeat === 'daily') { while (v.due <= Date.now() + 60000) v.due += 86400000; await env.PRE.put(k.name, JSON.stringify(v), { expirationTtl: 90 * 86400 }); }
        else await env.PRE.delete(k.name);
      }
    }
` + a);
// 5) help text
rep(`• /summary — សេចក្តីសង្ខេបឥឡូវ · /tasks — ការងារមិនទាន់រួច`, a => `• "រំលឹកខ្ញុំស្អែកម៉ោង ៩ ព្រឹក ឲ្យបង់ថ្លៃភ្លើង" ឬ "រាល់ថ្ងៃម៉ោង ៧ ព្រឹក រំលឹកបុគ្គលិកឲ្យពិនិត្យទឹក" → ខ្ញុំរំលឹកតាមម៉ោង
` + a + ` · /reminders — ការរំលឹក`);
c = c.replace("  if (/^\\/reminders\\b/.test(text)) {}\n", '');
let ok; try { new Function(c.replace(/^import[^\n]*\n/, '').replace('export default', 'const __x=')); ok = 'ok'; } catch (er) { ok = 'ERR ' + er.message; }
let cb; if (!miss.length && ok === 'ok') { try { await navigator.clipboard.writeText(c); cb = 'ok'; } catch (er) { cb = 'ERR ' + er.message; } }
return JSON.stringify({ miss, ok, cb, base, len: c.length }).replace(/[?&=]/g, '~');
