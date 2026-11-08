
// ===== Booking request: formatted Telegram message + PDF + email + A&J Hub =====
const LOGO_JPG = 'https://nobeds.app/uploads/1508197823_logo_c7f896293f154d0a9b8b8fd96a20ccee.jpg';
const BOOKING_EMAILS = ['ajkampotboutique@gmail.com', 'management.aj.18@gmail.com'];
const escH = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmtDay = (iso) => { try { return new Date(String(iso) + 'T00:00:00Z').toUTCString().slice(0, 16); } catch (e) { return String(iso || ''); } };
const money2 = (v) => '$' + (Math.round(Number(v || 0) * 100) / 100).toFixed(2).replace(/\.00$/, '');
function u8b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
const utf8b64 = (s) => u8b64(new TextEncoder().encode(s));
const wrap76 = (s) => s.replace(/(.{76})/g, '$1\r\n');
// Minimal PDF builder for Cloudflare Workers (no libraries). Helvetica text + JPEG images.
function jpegSize(u8) {
  let i = 2;
  while (i < u8.length) {
    if (u8[i] !== 0xFF) { i++; continue; }
    const m = u8[i + 1];
    const len = (u8[i + 2] << 8) | u8[i + 3];
    if ((m >= 0xC0 && m <= 0xC3) || (m >= 0xC5 && m <= 0xC7) || (m >= 0xC9 && m <= 0xCB) || (m >= 0xCD && m <= 0xCF)) {
      return { h: (u8[i + 5] << 8) | u8[i + 6], w: (u8[i + 7] << 8) | u8[i + 8] };
    }
    i += 2 + len;
  }
  return null;
}
function pdfText(s) {
  return String(s == null ? '' : s).replace(/[^\x20-\x7E\xA0-\xFF]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function buildPdf({ logo, title, subtitle, rows, footer, images }) {
  const enc = new TextEncoder();
  const chunks = []; let size = 0; const offs = [];
  const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); size += b.length; };
  const obj = (n, body) => { offs[n] = size; push(n + ' 0 obj\n'); body(); push('\nendobj\n'); };
  const W = 595, H = 842, M = 48;
  const imgs = [];
  if (logo) { const d = jpegSize(logo); if (d) imgs.push({ name: 'L', data: logo, ...d }); }
  (images || []).forEach((im, k) => { const d = jpegSize(im); if (d) imgs.push({ name: 'R' + k, data: im, ...d }); });
  // page 1 content
  let y = H - M; let c = '';
  const L = imgs.find(i => i.name === 'L');
  if (L) { const lh = 56, lw = lh * L.w / L.h; c += `q ${lw.toFixed(1)} 0 0 ${lh} ${M} ${y - lh} cm /L Do Q\n`; }
  c += `BT /F2 18 Tf 0.08 0.16 0.33 rg ${M + (L ? 130 : 0)} ${y - 24} Td (${pdfText(title)}) Tj ET\n`;
  c += `BT /F1 10 Tf 0.35 0.35 0.35 rg ${M + (L ? 130 : 0)} ${y - 42} Td (${pdfText(subtitle)}) Tj ET\n`;
  y -= 76;
  c += `0.85 0.85 0.85 RG 1 w ${M} ${y} m ${W - M} ${y} l S\n`;
  y -= 26;
  for (const r of rows) {
    if (r.section) {
      y -= 6;
      c += `0.93 0.95 0.98 rg ${M} ${y - 6} ${W - 2 * M} 22 re f\n`;
      c += `BT /F2 11 Tf 0.08 0.16 0.33 rg ${M + 8} ${y + 1} Td (${pdfText(r.section)}) Tj ET\n`;
      y -= 28; continue;
    }
    c += `BT /F1 10.5 Tf 0.4 0.4 0.4 rg ${M + 8} ${y} Td (${pdfText(r.k)}) Tj ET\n`;
    const val = pdfText(r.v);
    const lines = []; let cur = '';
    for (const w of val.split(' ')) { if ((cur + ' ' + w).length > 58) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
    lines.push(cur);
    lines.forEach((ln, k) => { c += `BT /${r.bold ? 'F2' : 'F1'} 10.5 Tf 0.1 0.1 0.1 rg ${M + 170} ${y - k * 14} Td (${ln}) Tj ET\n`; });
    y -= 20 + (lines.length - 1) * 14;
  }
  y -= 10;
  c += `0.85 0.85 0.85 RG 1 w ${M} ${y} m ${W - M} ${y} l S\n`;
  (footer || []).forEach((f, k) => { c += `BT /F1 9 Tf 0.45 0.45 0.45 rg ${M} ${y - 18 - k * 13} Td (${pdfText(f)}) Tj ET\n`; });
  const pages = [c];
  imgs.filter(i => i.name !== 'L').forEach((im, k) => {
    const maxW = W - 2 * M, maxH = H - 2 * M - 40;
    const s = Math.min(maxW / im.w, maxH / im.h);
    const w = im.w * s, h = im.h * s;
    pages.push(`BT /F2 13 Tf 0.08 0.16 0.33 rg ${M} ${H - M - 14} Td (${pdfText('Payment receipt / document ' + (k + 1))}) Tj ET\nq ${w.toFixed(1)} 0 0 ${h.toFixed(1)} ${M} ${(H - M - 34 - h).toFixed(1)} cm /${im.name} Do Q\n`);
  });
  // objects: 1 catalog, 2 pages, 3 F1, 4 F2, then images, then page+content pairs
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  let n = 5; const imgNum = {};
  imgs.forEach(im => { imgNum[im.name] = n++; });
  const pageNums = pages.map(() => { const p = n; n += 2; return p; });
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Kids [${pageNums.map(p => p + ' 0 R').join(' ')}] /Count ${pages.length} >>`));
  obj(3, () => push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'));
  obj(4, () => push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'));
  imgs.forEach(im => obj(imgNum[im.name], () => { push(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.data.length} >>\nstream\n`); push(im.data); push('\nendstream'); }));
  const xo = '<< ' + imgs.map(im => `/${im.name} ${imgNum[im.name]} 0 R`).join(' ') + ' >>';
  pages.forEach((pc, k) => {
    const p = pageNums[k];
    const bytes = Uint8Array.from(pc, ch => ch.charCodeAt(0) & 0xFF);
    obj(p, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject ${xo} >> /Contents ${p + 1} 0 R >>`));
    obj(p + 1, () => { push(`<< /Length ${bytes.length} >>\nstream\n`); push(bytes); push('\nendstream'); });
  });
  const xref = size;
  let x = `xref\n0 ${n}\n0000000000 65535 f \n`;
  for (let i = 1; i < n; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  push(x + `trailer\n<< /Size ${n} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(size); let o = 0; for (const ch of chunks) { out.set(ch, o); o += ch.length; }
  return out;
}

async function handleBooking(env, form, photos, via) {
  let d = {};
  try { d = JSON.parse(String(form.get('data') || '{}')); } catch (e) {}
  if (!d.name) return null; // old app version → use the plain message
  const c = (v, n) => String(v == null ? '' : v).slice(0, n || 300).trim();
  const now7 = new Date(Date.now() + 7 * 3600 * 1000);
  const ref = 'AJ' + now7.toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = { name: c(d.name, 80), country: c(d.country, 60), phone: c(d.phone, 40), email: c(d.email, 80), room: c(d.room, 60), cin: c(d.cin, 10), cout: c(d.cout, 10), nights: Number(d.nights) || 0, guests: c(d.guests, 4), time: c(d.time, 10), note: c(d.note, 500), total: Number(d.total) || 0, deposit: Number(d.deposit) || 0 };
  const api = `https://api.telegram.org/bot${env.BOT_TOKEN}`;
  // 1) Telegram message
  const msg = `🛏️ <b>NEW BOOKING REQUEST</b>\n<b>A&amp;J Kampot Boutique</b> · Ref <code>${ref}</code>\n\n` +
    `👤 <b>${escH(b.name)}</b>\n🌍 ${escH(b.country || '-')}\n📞 ${escH(b.phone)}\n✉️ ${escH(b.email || '-')}\n\n` +
    `🏨 <b>${escH(b.room)}</b>\n📅 Check-in: <b>${escH(fmtDay(b.cin))}</b>${b.time ? ' · arriving ' + escH(b.time) : ''}\n` +
    `📅 Check-out: <b>${escH(fmtDay(b.cout))}</b> (${b.nights} night${b.nights > 1 ? 's' : ''})\n👥 Guests: ${escH(b.guests)}\n\n` +
    `💵 Total: <b>${money2(b.total)}</b>\n💳 Deposit 50%: <b>${money2(b.deposit)}</b> · receipt attached\n` +
    (b.note ? `📝 Note: ${escH(b.note)}\n` : '') +
    `\n➡️ Please check the payment, enter the booking in Nobeds and confirm with the guest.\n📥 Added to A&amp;J Hub check-in form\n${escH(via)}`;
  const mj = await (await fetch(`${api}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: env.STAFF_CHAT_ID, text: msg, parse_mode: 'HTML' }) })).json();
  if (!mj.ok) return { ok: false, error: mj.description };
  const replyTo = mj.result.message_id;
  // 2) PDF (logo + details + receipts)
  let pdf = null;
  try {
    let logo = null;
    try { const lr = await fetch(LOGO_JPG, { cf: { cacheTtl: 86400, cacheEverything: true } }); if (lr.ok) logo = new Uint8Array(await lr.arrayBuffer()); } catch (e) {}
    const imgs = [];
    for (const p of photos.slice(0, 4)) { try { imgs.push(new Uint8Array(await p.arrayBuffer())); } catch (e) {} }
    pdf = buildPdf({
      logo, title: 'Booking Request', subtitle: 'A&J Kampot Boutique  ·  Kampot, Cambodia  ·  +855 87 882 020',
      rows: [
        { k: 'Reference', v: ref, bold: true }, { k: 'Received', v: now7.toISOString().slice(0, 16).replace('T', ' ') + ' (Cambodia)' },
        { section: 'Guest' }, { k: 'Name', v: b.name, bold: true }, { k: 'Country', v: b.country || '-' }, { k: 'Phone', v: b.phone }, { k: 'Email', v: b.email || '-' },
        { section: 'Stay' }, { k: 'Room type', v: b.room, bold: true }, { k: 'Check-in', v: fmtDay(b.cin) + (b.time ? '  (arriving ' + b.time + ')' : '') }, { k: 'Check-out', v: fmtDay(b.cout) }, { k: 'Nights', v: String(b.nights) }, { k: 'Guests', v: String(b.guests) },
        { section: 'Payment' }, { k: 'Total', v: money2(b.total), bold: true }, { k: 'Deposit (50%)', v: money2(b.deposit) + '  -  receipt attached (' + imgs.length + ' file' + (imgs.length === 1 ? '' : 's') + ')' }, { k: 'Balance at check-in', v: money2(b.total - b.deposit) },
      ].concat(b.note ? [{ section: 'Note' }, { k: 'Guest note', v: b.note }] : []),
      footer: ['Status: REQUEST - not confirmed yet. Staff must check the payment and enter the booking in Nobeds.', 'Sent from the A&J Guest App · ' + via.replace(/[^\x20-\x7E]/g, '').trim()],
      images: imgs
    });
  } catch (e) { console.log('pdf error', e && e.message); }
  const fname = `Booking_${ref}_${b.name.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 30)}.pdf`;
  if (pdf) {
    const fd = new FormData();
    fd.append('chat_id', env.STAFF_CHAT_ID); fd.append('reply_to_message_id', String(replyTo));
    fd.append('caption', `📄 Booking ${ref} · ${b.name}`);
    fd.append('document', new Blob([pdf], { type: 'application/pdf' }), fname);
    const dr = await (await fetch(`${api}/sendDocument`, { method: 'POST', body: fd })).json().catch(() => ({}));
    if (!dr.ok) console.log('pdf send failed', JSON.stringify(dr).slice(0, 200));
  } else if (photos.length) {
    const fd = new FormData(); fd.append('chat_id', env.STAFF_CHAT_ID); fd.append('reply_to_message_id', String(replyTo)); fd.append('photo', photos[0], 'receipt.jpg');
    await fetch(`${api}/sendPhoto`, { method: 'POST', body: fd });
  }
  // 3) Email with the PDF (needs the Cloudflare "send email" binding named EMAIL)
  if (env.EMAIL && pdf) {
    const from = env.EMAIL_FROM || 'booking@ajkampotboutique.org';
    const subject = `New booking request ${ref} - ${b.name} - ${b.room} - ${b.cin}`;
    const plain = `New booking request from the A&J Guest App\n\nRef: ${ref}\nGuest: ${b.name}\nPhone: ${b.phone}\nEmail: ${b.email || '-'}\nRoom: ${b.room}\nCheck-in: ${fmtDay(b.cin)}${b.time ? ' (arriving ' + b.time + ')' : ''}\nCheck-out: ${fmtDay(b.cout)} (${b.nights} nights)\nGuests: ${b.guests}\nTotal: ${money2(b.total)} - Deposit 50%: ${money2(b.deposit)}\n${b.note ? 'Note: ' + b.note + '\n' : ''}\nThe booking details and the payment receipt are in the attached PDF.\nPlease check the payment, enter the booking in Nobeds and confirm with the guest.`;
    const bd = 'ajb_' + ref;
    for (const to of (env.BOOKING_EMAILS ? String(env.BOOKING_EMAILS).split(',') : BOOKING_EMAILS).map(x => x.trim()).filter(Boolean)) {
      const raw = [`From: A&J Guest App <${from}>`, `To: ${to}`, `Subject: =?UTF-8?B?${utf8b64(subject)}?=`, 'MIME-Version: 1.0', `Date: ${new Date().toUTCString()}`, `Message-ID: <${ref}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@ajkampotboutique.org>`, `Content-Type: multipart/mixed; boundary="${bd}"`, '', `--${bd}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(utf8b64(plain)), `--${bd}`, `Content-Type: application/pdf; name="${fname}"`, 'Content-Transfer-Encoding: base64', `Content-Disposition: attachment; filename="${fname}"`, '', wrap76(u8b64(pdf)), `--${bd}--`, ''].join('\r\n');
      try { await env.EMAIL.send(new EmailMessage(from, to, raw)); console.log('email sent', to); } catch (e) { console.log('email failed', to, e && e.message); }
    }
  }
  // 4) A&J Hub check-in form (📥 box)
  if (env.PRE) {
    try {
      const data = { name: b.name, nationality: b.country, passport: '', phone: b.phone, source: 'Direct booking (Guest App) ' + ref, arrival: b.cin, time: b.time, nights: String(b.nights), guests: String(b.guests), transport: '', others: '', note: `Booking ${ref}: ${b.room}, ${b.cin} → ${b.cout}, total ${money2(b.total)}, deposit ${money2(b.deposit)} (receipt in Telegram/email). Email: ${b.email || '-'}${b.note ? '. Note: ' + b.note : ''}` };
      const at = Date.now();
      const id = 'pc:' + at + '-' + Math.random().toString(36).slice(2, 8);
      await env.PRE.put(id, JSON.stringify({ id, at, data, photos: [] }), { metadata: { name: data.name, nat: data.nationality, arrival: data.arrival, guests: data.guests, n: 0, at, used: 0, booking: ref }, expirationTtl: TTL });
    } catch (e) { console.log('hub save failed', e && e.message); }
  }
  return { ok: true, ref };
}
