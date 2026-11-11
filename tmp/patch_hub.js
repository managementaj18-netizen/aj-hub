const r = await fetch('/api/v4/accounts/79c0c64e5dae0cbd703477140cfbae15/workers/scripts/aj-guest-app/content/v2', { credentials: 'include' });
const s = await r.text(); const bd = s.slice(0, s.indexOf('\r\n')); let c = s.split(bd)[1]; c = c.slice(c.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '');
const base = c.length, miss = [];
const rep = (a, fn) => { const n = c.split(a).length - 1; if (n !== 1) { miss.push(String(a).slice(0, 60) + ' x' + n); return; } c = c.replace(a, () => fn(a)); };
rep(`async function onOwner(env, m) {`, a => `// A&J Hub Booking Board (read-only) — needs Secret HUB_KEY (a Hub PIN that can open the board / view page)
async function hubBoardText(env) {
  if (!env.HUB_KEY) return '\\nA&J HUB BOOKING BOARD: not connected (owner has not added HUB_KEY yet).';
  try {
    const r = await fetch('https://aj-hub-api.management-aj-18.workers.dev/', { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'board', key: String(env.HUB_KEY).trim() }), signal: AbortSignal.timeout(20000) });
    const j = await r.json();
    if (!j.ok) return '\\nA&J HUB BOOKING BOARD: error ' + (j.error || r.status);
    const today = camDay(), to = camDay(new Date(camNow().getTime() + 14 * 86400000)), from = camDay(new Date(camNow().getTime() - 30 * 86400000));
    const end = b => { const d = new Date(b.start + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + (Number(b.nights) || 1)); return d.toISOString().slice(0, 10); };
    const rows = (j.bookings || []).filter(b => b && b.status !== 'cancelled' && b.start <= to && end(b) >= from && end(b) >= today)
      .sort((a, b) => String(a.start).localeCompare(String(b.start)) || String(a.room).localeCompare(String(b.room)))
      .map(b => [b.room, b.start + '→' + end(b), b.status, b.guest || '', b.guests ? b.guests + 'pax' : '', b.source || '', b.phone || ''].filter(Boolean).join(' | '));
    return '\\nA&J HUB BOOKING BOARD (room | dates | status | guest | pax | source | phone), today ' + today + ', from today to +14 days:\\n' + (rows.join('\\n') || '(none)') + '\\nRooms: Superior+Balcony 101,201,301; Superior 203,204,205,207,303,304,305,307; Twin A 202,302; Twin B 206,306; Family Suite 102,103.';
  } catch (e) { return '\\nA&J HUB BOOKING BOARD: not reachable (' + (e && e.message) + ')'; }
}
` + a);
rep(`  const data = await buildSummary(env, camDay(), 'TODAY DATA');`, () => `  const [data, board, avail] = await Promise.all([buildSummary(env, camDay(), 'TODAY DATA'), hubBoardText(env), availText(env).catch(() => '')]);`);
rep("DATA:\n${data}`;", () => "DATA:\n${data}\n${board}\n${avail}\nYou CAN see room availability (from Nobeds, by room type, next 14 nights) and the A&J Hub Booking Board above. Use them to answer questions about free rooms, who is staying, arrivals and departures. You CAN book rooms (action book). Never say you cannot access the systems when the data is above.`;");
let ok; try { new Function(c.replace(/^import[^\n]*\n/, '').replace('export default', 'const __x=')); ok = 'ok'; } catch (er) { ok = 'ERR ' + er.message; }
let cb; if (!miss.length && ok === 'ok') { try { await navigator.clipboard.writeText(c); cb = 'ok'; } catch (er) { cb = 'ERR ' + er.message; } }
return JSON.stringify({ miss, ok, cb, base, len: c.length }).replace(/[?&=]/g, '~');
