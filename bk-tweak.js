/* A&J Hub — Booking list v3 (bk-tweak.js)
   • Cancelled bookings hidden from the list (link at the bottom shows them)
   • Direct guests (Walk-in / Telegram / Phone …) checked in or out = paid in full
   • OTA bookings kept apart, with what each OTA still owes
   • NEW: payment method per payment — deposit (usually ACLEDA QR, 50%) and the rest at arrival
     (ABA / ACLEDA / Cash / Wing …). OTA guests can pay at the hotel or through the OTA.
     A summary shows how much came in by each method, split by Direct / Booking.com / Agoda / Trip.com … */
(function () {
  "use strict";
  var OTA_RE = /booking|agoda|trip|expedia|airbnb|ctrip|hostelworld|traveloka|travelocity|hotels\.com|orbitz/i;
  // OTAs that always take the guest's money themselves and pay the hotel later (owner's rule)
  var OTA_COLLECTS = /agoda|trip|ctrip|expedia|travelocity|hotels\.com|orbitz/i;
  var METHODS = [["acleda", "ACLEDA"], ["aba", "ABA"], ["cash", "សាច់ប្រាក់ · Cash"], ["wing", "Wing"], ["ota", "OTA ប្រមូល (មិនទាន់ផ្ទេរ) · OTA collected"], ["otapaid", "OTA ផ្ទេរមកហើយ · OTA paid out"], ["other", "ផ្សេងៗ · Other"]];
  var showCancelled = false;
  var srcFilter = null; // tap a source card → show only that source's bookings
  var MAIN_SRC = ["Booking.com", "Expedia", "Trip.com", "Agoda"]; // always shown, even at $0
  var SRC_COLOR = { "Booking.com": "#003580", "Expedia": "#fdb913", "Trip.com": "#287dfa", "Agoda": "#e2242b", "Traveloka": "#0194f3", "Airbnb": "#ff5a5f", "ភ្ញៀវផ្ទាល់ · Direct": "#1d2433" };
  function num(v) { return Number(v) || 0; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function isOta(b) { return OTA_RE.test(String(b.source || "")); }
  function stayed(b) { return /checked/i.test(String(b.status || "")); }
  function cancelled(b) { return /cancel/i.test(String(b.status || "")); }
  function mLabel(k) { for (var i = 0; i < METHODS.length; i++) if (METHODS[i][0] === k) return METHODS[i][1]; return "មិនបញ្ជាក់ · Not set"; }
  function mShort(k) { return ({ acleda: "ACLEDA", aba: "ABA", cash: "Cash", wing: "Wing", ota: "OTA (មិនទាន់ផ្ទេរ)", otapaid: "OTA ផ្ទេររួច", other: "Other" })[k] || "?"; }
  function otaName(b) {
    var s = String(b.source || "");
    if (/booking/i.test(s)) return "Booking.com";
    if (/agoda/i.test(s)) return "Agoda";
    if (/trip|ctrip/i.test(s)) return "Trip.com";
    if (/expedia|travelocity|hotels\.com|orbitz/i.test(s)) return "Expedia";
    if (/airbnb/i.test(s)) return "Airbnb";
    if (/traveloka/i.test(s)) return "Traveloka";
    return s || "OTA";
  }
  function group(b) { return isOta(b) ? otaName(b) : "ភ្ញៀវផ្ទាល់ · Direct"; }
  // every payment of a booking, with its method ("" = not recorded)
  function pays(b) {
    var out = [];
    var dm = OTA_COLLECTS.test(String(b.source || "")) ? "ota" : "";
    if (num(b.dep)) out.push({ amt: num(b.dep), m: b.depM || dm, k: "dep" });
    if (num(b.bal)) out.push({ amt: num(b.bal), m: b.balM || dm, k: "bal" });
    var rec = out.reduce(function (s, p) { return s + p.amt; }, 0), paid = num(b.paidAmount);
    if (paid > rec + 0.004) out.push({ amt: r2(paid - rec), m: dm, k: "old" });
    // owner's rule: a direct guest who is checked in / out has paid in full
    var tot = num(b.totalPrice), got = Math.max(paid, rec);
    if (!isOta(b) && stayed(b) && tot > got + 0.004) out.push({ amt: r2(tot - got), m: "", k: "assumed" });
    return out;
  }
  function received(b) { return pays(b).reduce(function (s, p) { return s + (p.m === "ota" ? 0 : p.amt); }, 0); }
  function otaHeld(b) { return pays(b).reduce(function (s, p) { return s + (p.m === "ota" ? p.amt : 0); }, 0); }
  function due(b) { return Math.max(r2(num(b.totalPrice) - received(b)), 0); }

  /* ---------- list ---------- */
  function ensureBox(id, after) {
    var box = document.getElementById(id);
    if (!box) {
      var ref = document.getElementById(after);
      if (!ref) return null;
      box = document.createElement("div"); box.id = id;
      ref.parentNode.insertBefore(box, ref.nextSibling);
    }
    return box;
  }
  function payCell(b) {
    if (cancelled(b)) return '<span class="muted">—</span>';
    var tot = num(b.totalPrice), ps = pays(b), got = received(b), d = due(b);
    var how = ps.length ? ps.map(function (p) { return mShort(p.m) + " " + money(p.amt); }).join(" + ") : "";
    if (d <= 0.004) return '<span class="pill ok">✅ ' + money(tot) + '</span>' + (how ? '<div class="muted" style="font-size:11px">' + esc(how) + '</div>' : "");
    if (isOta(b) && stayed(b)) return '<span class="pill" style="background:#e0e8ff;color:#1f3a8a">' + esc(otaName(b)) + ' ជំពាក់ ' + money(d) + '</span>' + (how ? '<div class="muted" style="font-size:11px">' + esc(how) + '</div>' : "");
    return '<span class="pill warn">' + (got ? 'កក់ ' + money(got) + ' · ' : '') + 'ខ្វះ ' + money(d) + '</span>' + (how ? '<div class="muted" style="font-size:11px">' + esc(how) + '</div>' : "");
  }

  window.renderBookings = function () {
    var q = ($("bkQ").value || "").toLowerCase().trim(), m = $("bkM").value;
    var all = S.bk.filter(function (b) {
      return (!m || String(b.start || "").indexOf(m) === 0) &&
        (!q || [b.guest, b.room, b.source, b.status].join(" ").toLowerCase().indexOf(q) >= 0);
    }).sort(function (a, b) { return String(b.start).localeCompare(String(a.start)); });
    var act = all.filter(function (b) { return !cancelled(b); });
    var nCan = all.length - act.length;
    var direct = act.filter(function (b) { return !isOta(b); }), ota = act.filter(isOta);
    var sum = function (l, f) { return l.reduce(function (s, b) { return s + f(b); }, 0); };
    var tot = sum(act, function (b) { return num(b.totalPrice); });
    var nights = sum(act, function (b) { return num(b.nights); });
    var got = sum(act, received);
    var dDue = sum(direct, due), oOwe = sum(ota.filter(stayed), due);
    // 📅 monthly report bar: ‹ previous · month · next ›  (each month shows only its own bookings)
    var stats = document.getElementById("bkStats");
    var bar = document.getElementById("bkMonthBar");
    if (!bar && stats) { bar = document.createElement("div"); bar.id = "bkMonthBar"; stats.parentNode.insertBefore(bar, stats); }
    if (bar) {
      var label = m ? new Date(m + "-01T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "គ្រប់ខែ · All months";
      bar.innerHTML = '<div class="card" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0;padding:10px 12px">' +
        '<button class="btn alt sm" id="bkPrevM">‹ ខែមុន</button><b style="font-size:18px;flex:1;text-align:center">📊 របាយការណ៍ខែ · ' + esc(label) + '</b>' +
        '<button class="btn alt sm" id="bkNextM">ខែក្រោយ ›</button><button class="btn sm" id="bkPrintM">🖨️ PDF / Print</button></div>';
      var shift = function (d) {
        var sel = $("bkM"), cur = sel.value || new Date().toISOString().slice(0, 7);
        var dt = new Date(cur + "-01T00:00:00"); dt.setMonth(dt.getMonth() + d);
        var v = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
        if (![].some.call(sel.options, function (o) { return o.value === v; })) { var o = document.createElement("option"); o.value = v; o.textContent = dt.toLocaleDateString("en-GB", { month: "long", year: "numeric" }); sel.appendChild(o); }
        sel.value = v; window.renderBookings();
      };
      document.getElementById("bkPrevM").onclick = function () { shift(-1); };
      document.getElementById("bkNextM").onclick = function () { shift(1); };
      document.getElementById("bkPrintM").onclick = function () {
        var parts = ["bkStats", "bkSrc", "bkPay", "bkOta"].map(function (id) { var e = document.getElementById(id); return e ? e.outerHTML : ""; }).join("");
        var tbl = document.getElementById("tBk"), list = tbl ? '<table class="lst">' + tbl.innerHTML + "</table>" : "";
        var w = window.open("", "_blank"); if (!w) return alert("សូមអនុញ្ញាត Pop-up");
        w.document.write('<!doctype html><meta charset="utf-8"><title>A&J Booking Report ' + esc(label) + '</title><link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">' +
          '<style>body{font-family:"Kantumruy Pro",sans-serif;margin:24px;color:#1d2433;font-size:12px}h1{font-size:20px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:6px 0 12px}td,th{border:1px solid #d6dbe6;padding:5px 7px;text-align:left}th{background:#f2f5fb}' +
          '.stat{display:inline-block;border:1px solid #d6dbe6;border-radius:8px;padding:6px 12px;margin:0 6px 6px 0}.stat b{display:block;font-size:16px}.pill{padding:1px 6px;border-radius:6px;background:#eef1f7}.card{margin:10px 0}.muted{color:#777}@page{size:A4;margin:12mm}</style>' +
          '<h1>A&amp;J Kampot Boutique — របាយការណ៍ Booking ខែ ' + esc(label) + '</h1><div class="muted">Printed ' + new Date().toLocaleString("en-GB") + '</div>' + parts + list +
          '<script>setTimeout(function(){window.print()},800)<\/script>');
        w.document.close();
      };
    }
    $("bkStats").innerHTML = [["Booking", act.length], ["យប់សរុប", nights], ["តម្លៃសរុប", money(tot)],
      ["ទទួលបានហើយ", money(got)], ["ភ្ញៀវផ្ទាល់ នៅខ្វះ", money(dDue)], ["OTA ជំពាក់", money(oOwe)]]
      .map(function (x) { return '<div class="card stat"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>'; }).join("");

    // 🌐 money by source (Booking.com / Expedia / Trip.com / Agoda / … / Direct) — tap a card to see its bookings
    var srcBox = ensureBox("bkSrc", "bkStats");
    if (srcBox) {
      var bySrc = {};
      MAIN_SRC.forEach(function (k) { bySrc[k] = { n: 0, nights: 0, tot: 0, got: 0, owe: 0, up: 0 }; });
      act.forEach(function (b) {
        var k = group(b), o = bySrc[k] || (bySrc[k] = { n: 0, nights: 0, tot: 0, got: 0, owe: 0, up: 0 });
        o.n++; o.nights += num(b.nights); o.tot += num(b.totalPrice); o.got += received(b);
        if (isOta(b) ? stayed(b) : true) o.owe += due(b); else o.up += due(b);
      });
      var order = MAIN_SRC.concat(Object.keys(bySrc).filter(function (k) { return MAIN_SRC.indexOf(k) < 0 && k.indexOf("Direct") < 0; }).sort())
        .concat(Object.keys(bySrc).filter(function (k) { return k.indexOf("Direct") >= 0; }));
      if (srcFilter && !bySrc[srcFilter]) srcFilter = null;
      var otaTot = 0, otaN = 0; Object.keys(bySrc).forEach(function (k) { if (k.indexOf("Direct") < 0) { otaTot += bySrc[k].tot; otaN += bySrc[k].n; } });
      var card = function (k) {
        var o = bySrc[k], on = srcFilter === k, c = SRC_COLOR[k] || "#6b7280";
        return '<button type="button" class="card" data-src="' + esc(k) + '" style="text-align:left;cursor:pointer;min-width:150px;flex:1 1 150px;margin:0;padding:10px 12px;border:2px solid ' + (on ? c : 'transparent') + ';border-left:6px solid ' + c + ';' + (on ? 'background:#f2f5fb;' : '') + 'font:inherit;color:inherit">' +
          '<div style="font-weight:700">' + esc(k) + '</div>' +
          '<div style="font-size:20px;font-weight:700;margin:2px 0">' + money(r2(o.tot)) + '</div>' +
          '<div class="muted" style="font-size:12px">' + o.n + ' booking · ' + o.nights + ' យប់</div>' +
          (o.owe > 0.004 ? '<div style="font-size:12px;color:#b42318">' + (k.indexOf("Direct") >= 0 ? 'នៅខ្វះ ' : 'ជំពាក់ ') + money(r2(o.owe)) + '</div>' : (o.n ? '<div style="font-size:12px;color:#067647">✅ ទទួលបាន ' + money(r2(o.got)) + '</div>' : '')) + '</button>';
      };
      var sel = srcFilter && bySrc[srcFilter];
      srcBox.innerHTML = '<div class="card" style="margin:10px 0"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px"><b>🌐 ទឹកលុយតាម OTA / ប្រភព · Money by source</b><span class="muted">OTA សរុប: <b>' + money(r2(otaTot)) + '</b> · ' + otaN + ' booking</span></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">' + order.map(card).join("") + '</div>' +
        (sel ? '<div style="margin-top:8px;padding:8px 10px;background:#f2f5fb;border-radius:8px;display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center"><b>' + esc(srcFilter) + '</b>' +
          '<span>Booking: <b>' + sel.n + '</b></span><span>យប់: <b>' + sel.nights + '</b></span><span>តម្លៃសរុប: <b>' + money(r2(sel.tot)) + '</b></span><span>ទទួលបានហើយ: <b>' + money(r2(sel.got)) + '</b></span>' +
          '<span style="color:#b42318">នៅខ្វះ / ជំពាក់: <b>' + money(r2(sel.owe)) + '</b></span>' + (sel.up > 0.004 ? '<span class="muted">មិនទាន់មកដល់: ' + money(r2(sel.up)) + '</span>' : '') +
          '<a href="#" id="bkSrcAll" style="margin-left:auto">✕ បង្ហាញទាំងអស់</a></div>' : '<div class="muted" style="font-size:12px;margin-top:6px">ចុចលើប្រអប់ ដើម្បីមើល Booking របស់ OTA នោះខែនេះ (បញ្ជីខាងក្រោម)</div>') + '</div>';
      [].forEach.call(srcBox.querySelectorAll("[data-src]"), function (el) {
        el.onclick = function () { srcFilter = srcFilter === el.dataset.src ? null : el.dataset.src; window.renderBookings();
          var t = document.getElementById("tBk"); if (srcFilter && t) t.scrollIntoView({ behavior: "smooth", block: "start" }); };
      });
      var all2 = document.getElementById("bkSrcAll"); if (all2) all2.onclick = function (e) { e.preventDefault(); srcFilter = null; window.renderBookings(); };
    }

    // 💰 money received by payment method × source
    var payBox = ensureBox("bkPay", "bkSrc") || ensureBox("bkPay", "bkStats");
    if (payBox) {
      var cols = ["ភ្ញៀវផ្ទាល់ · Direct"], grid = {}, colTot = {}, rowTot = {}, grand = 0;
      act.forEach(function (b) {
        var g = group(b); if (cols.indexOf(g) < 0) cols.push(g);
        pays(b).forEach(function (p) {
          if (p.m === "ota") return; // still with the OTA — shown in the OTA table
          var k = p.m || "";
          grid[k] = grid[k] || {}; grid[k][g] = (grid[k][g] || 0) + p.amt;
          colTot[g] = (colTot[g] || 0) + p.amt; rowTot[k] = (rowTot[k] || 0) + p.amt; grand += p.amt;
        });
      });
      var rowsK = METHODS.map(function (x) { return x[0]; }).concat([""]).filter(function (k) { return rowTot[k]; });
      payBox.innerHTML = '<div class="card" style="margin:10px 0"><b>💰 លុយទទួលបាន តាមវិធីបង់ប្រាក់ · Money received by method</b>' +
        '<div style="overflow-x:auto"><table style="width:100%;margin-top:8px"><tr><th>វិធីបង់ · Method</th>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join("") + '<th>សរុប · Total</th></tr>' +
        (rowsK.length ? rowsK.map(function (k) {
          return '<tr><td><b>' + esc(mLabel(k)) + '</b></td>' + cols.map(function (c) { var v = (grid[k] || {})[c]; return '<td>' + (v ? money(r2(v)) : '<span class="muted">—</span>') + '</td>'; }).join("") + '<td><b>' + money(r2(rowTot[k])) + '</b></td></tr>';
        }).join("") : '<tr><td colspan="' + (cols.length + 2) + '" class="muted">មិនទាន់មាន · none yet</td></tr>') +
        '<tr><td><b>សរុប</b></td>' + cols.map(function (c) { return '<td><b>' + money(r2(colTot[c] || 0)) + '</b></td>'; }).join("") + '<td><b>' + money(r2(grand)) + '</b></td></tr>' +
        '</table></div><div class="muted" style="font-size:12px;margin-top:6px">"មិនបញ្ជាក់" = Booking ចាស់ៗដែលមិនទាន់កត់វិធីបង់ ឬភ្ញៀវផ្ទាល់ដែល Check-in ហើយ (គិតថាបង់គ្រប់)។ បើកការកក់ ➜ ផ្នែក 💳 ដើម្បីកត់ ACLEDA / ABA / Cash។</div></div>';
    }

    // 🌐 what each OTA still owes
    var box = ensureBox("bkOta", "bkPay");
    if (box) {
      var by = {};
      ota.forEach(function (b) {
        var k = otaName(b), o = by[k] || (by[k] = { n: 0, stayed: 0, upcoming: 0, viaOta: 0, held: 0, atHotel: 0, owe: 0 });
        var t = num(b.totalPrice);
        o.n++;
        pays(b).forEach(function (p) { if (p.m === "otapaid") o.viaOta += p.amt; else if (p.m === "ota") o.held += p.amt; else o.atHotel += p.amt; });
        if (stayed(b)) { o.stayed += t; o.owe += due(b); } else o.upcoming += t;
      });
      var keys = Object.keys(by).sort();
      box.innerHTML = keys.length ? '<div class="card" style="margin:10px 0"><b>🌐 OTA — ប្រាក់ដែល OTA នីមួយៗជំពាក់ · Money owed by each OTA</b>' +
        '<div style="overflow-x:auto"><table style="width:100%;margin-top:8px"><tr><th>OTA</th><th>Booking</th><th>ស្នាក់រួច / កំពុងស្នាក់</th><th>ភ្ញៀវបង់នៅសណ្ឋាគារ</th><th>OTA ប្រមូលពីភ្ញៀវ (មិនទាន់ផ្ទេរ)</th><th>OTA ផ្ទេរមកហើយ</th><th style="color:#b42318">OTA នៅជំពាក់</th><th>មិនទាន់មកដល់</th></tr>' +
        keys.map(function (k) { var o = by[k]; return '<tr><td><b>' + esc(k) + '</b></td><td>' + o.n + '</td><td>' + money(r2(o.stayed)) + '</td><td>' + money(r2(o.atHotel)) + '</td><td>' + money(r2(o.held)) + '</td><td>' + money(r2(o.viaOta)) +
          '</td><td><b style="color:#b42318">' + money(r2(o.owe)) + '</b></td><td class="muted">' + money(r2(o.upcoming)) + '</td></tr>'; }).join("") +
        '</table></div><div class="muted" style="font-size:12px;margin-top:6px">ភ្ញៀវ OTA បង់នៅ Reception ➜ កត់ក្នុង 💳 ជា Cash / ABA / ACLEDA។ Agoda / Expedia / Trip.com ប្រមូលលុយពីភ្ញៀវ ➜ "OTA ប្រមូល (មិនទាន់ផ្ទេរ)" = OTA នៅជំពាក់សណ្ឋាគារ។ ពេល OTA ផ្ទេរលុយមកដល់គណនីយើង ➜ ប្ដូរទៅ "OTA ផ្ទេរមកហើយ"។</div></div>' : "";
    }

    var rows = showCancelled ? all : act;
    if (srcFilter) rows = rows.filter(function (b) { return group(b) === srcFilter; });
    var row = function (b) {
      return '<tr style="cursor:pointer' + (cancelled(b) ? ';opacity:.45' : '') + '" data-bk="' + esc(b.bkId || "") + '"><td class="nw">' + fmtD(b.start) + '</td><td class="nw">' + fmtD(bkEnd(b)) + '</td><td><b>' + esc(b.room) + '</b></td><td>' + esc(b.guest) +
        '</td><td>' + esc(b.source || "") + (isOta(b) ? ' <span class="pill" style="background:#e0e8ff;color:#1f3a8a;font-size:10px">OTA</span>' : "") +
        '</td><td>' + statusPill(b.status) + '</td><td>' + money(b.totalPrice) + '</td><td>' + payCell(b) + '</td></tr>';
    };
    var section = function (title, list) {
      return list.length ? '<tr><td colspan="8" style="background:#f2f5fb;font-weight:700;padding:8px">' + title + ' (' + list.length + ')</td></tr>' + list.map(row).join("") : "";
    };
    var dRows = rows.filter(function (b) { return !isOta(b); }), oRows = rows.filter(isOta);
    $("tBk").innerHTML = '<tr><th>ចូល</th><th>ចេញ</th><th>បន្ទប់</th><th>ភ្ញៀវ</th><th>ប្រភព</th><th>ស្ថានភាព</th><th>សរុប</th><th>បង់ប្រាក់</th></tr>' +
      ((dRows.length || oRows.length)
        ? section("🏨 ភ្ញៀវផ្ទាល់ · Direct (Walk-in / Telegram / Phone)", dRows) + section("🌐 OTA (Booking.com / Agoda / Trip.com …)", oRows)
        : '<tr><td colspan="8" class="muted">គ្មាន</td></tr>') +
      (nCan ? '<tr><td colspan="8" class="muted" style="text-align:center;padding:10px"><a href="#" id="bkCanTog">' +
        (showCancelled ? "លាក់ Booking ដែល Cancel" : "បង្ហាញ Booking ដែល Cancel (" + nCan + ")") + '</a></td></tr>' : "");
    var tog = document.getElementById("bkCanTog");
    if (tog) tog.onclick = function (e) { e.preventDefault(); showCancelled = !showCancelled; window.renderBookings(); };
    // tap a row → open that booking (to record payments)
    [].forEach.call(document.querySelectorAll("#tBk tr[data-bk]"), function (tr) {
      if (!tr.dataset.bk || typeof window.openBk !== "function") return;
      tr.onclick = function () { var bb = null; try { bb = BOARD; } catch (e) {} if (bb && bb.bookings && bb.bookings.some(function (x) { return x.bkId === tr.dataset.bk; })) window.openBk(tr.dataset.bk); };
    });
  };

  /* ---------- 💳 payment section inside the booking dialog (owner only) ---------- */
  var payArm = null;
  function sel(id, v) {
    return '<select id="' + id + '"><option value="">— វិធីបង់ —</option>' + METHODS.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === v ? " selected" : "") + '>' + esc(m[1]) + '</option>'; }).join("") + '</select>';
  }
  function readPay() {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    if (!document.getElementById("bkp_dep")) return null;
    return { dep: g("bkp_dep") === "" ? 0 : Number(g("bkp_dep")) || 0, depM: g("bkp_depM"), bal: g("bkp_bal") === "" ? 0 : Number(g("bkp_bal")) || 0, balM: g("bkp_balM") };
  }
  function syncPaid() {
    var p = readPay(), paid = document.getElementById("bk_paid"); if (!p || !paid) return;
    if (p.dep || p.bal) paid.value = r2(p.dep + p.bal);
    var tot = Number((document.getElementById("bk_total") || {}).value) || 0, hint = document.getElementById("bkp_hint");
    if (hint) hint.textContent = tot ? "សរុប " + money(tot) + " · បានបង់ " + money(r2(p.dep + p.bal)) + " · នៅខ្វះ " + money(Math.max(r2(tot - p.dep - p.bal), 0)) : "";
  }
  if (typeof window.openBk === "function" && !window.openBk.__ajPay) {
    var origOpen = window.openBk;
    window.openBk = function (id) {
      var r = origOpen.apply(this, arguments);
      try {
        var role = ""; try { role = ROLE; } catch (e) {} if (role !== "boss") return r;
        var fg = document.querySelector("#dB .fg"); if (!fg || document.getElementById("bkp_dep")) return r;
        var b = id ? (BOARD.bookings.find(function (x) { return x.bkId === id; }) || {}) : {};
        var dep = b.dep !== undefined ? b.dep : (num(b.paidAmount) && !b.bal ? b.paidAmount : "");
        var div = document.createElement("div"); div.className = "card"; div.style.cssText = "margin:10px 0;padding:12px";
        div.innerHTML = '<b>💳 ការបង់ប្រាក់ · Payments</b>' +
          '<div class="fg" style="margin-top:8px"><label>① ប្រាក់កក់ · Deposit ($)<input id="bkp_dep" type="number" step="any" value="' + esc(dep || "") + '" placeholder="ឧ. 50%"></label>' +
          '<label>វិធីបង់ · Method' + sel("bkp_depM", b.depM || (dep && !isOta(b) ? "acleda" : "")) + '</label>' +
          '<label>② បង់ពេលមកដល់ · At arrival ($)<input id="bkp_bal" type="number" step="any" value="' + esc(b.bal || "") + '"></label>' +
          '<label>វិធីបង់ · Method' + sel("bkp_balM", b.balM || "") + '</label></div>' +
          '<div class="row" style="margin:6px 0 0;gap:6px;flex-wrap:wrap"><button type="button" class="btn alt sm" id="bkp_half">50% កក់</button><button type="button" class="btn alt sm" id="bkp_rest">បង់នៅសល់</button></div>' +
          '<p class="muted" id="bkp_hint" style="margin:6px 0 0"></p>' +
          '<p class="muted" style="font-size:12px;margin:4px 0 0">OTA: ភ្ញៀវបង់នៅ Reception ➜ ជ្រើស Cash / ABA / ACLEDA · OTA ប្រមូលលុយ ➜ "OTA ប្រមូល (មិនទាន់ផ្ទេរ)" · OTA ផ្ទេរលុយមកដល់យើង ➜ "OTA ផ្ទេរមកហើយ"</p>';
        fg.parentNode.insertBefore(div, fg.nextSibling);
        ["bkp_dep", "bkp_depM", "bkp_bal", "bkp_balM", "bk_total"].forEach(function (x) { var el = document.getElementById(x); if (el) el.addEventListener("input", syncPaid); if (el) el.addEventListener("change", syncPaid); });
        var tot = function () { return Number((document.getElementById("bk_total") || {}).value) || (num(b.totalPrice)); };
        document.getElementById("bkp_half").onclick = function () { document.getElementById("bkp_dep").value = r2(tot() / 2); if (!document.getElementById("bkp_depM").value) document.getElementById("bkp_depM").value = "acleda"; syncPaid(); };
        document.getElementById("bkp_rest").onclick = function () { var p = readPay(); document.getElementById("bkp_bal").value = Math.max(r2(tot() - p.dep), 0); syncPaid(); };
        syncPaid();
      } catch (e) {}
      return r;
    };
    window.openBk.__ajPay = true;
  }
  // put the payment fields into the booking record when it is saved
  if (typeof window.saveBk === "function" && !window.saveBk.__ajPay) {
    var origSave = window.saveBk;
    window.saveBk = function () {
      payArm = readPay();
      var r = origSave.apply(this, arguments);
      Promise.resolve(r).then(function () { payArm = null; }, function () { payArm = null; });
      return r;
    };
    window.saveBk.__ajPay = true;
  }
  if (typeof window.api === "function" && !window.api.__ajPay) {
    var origApi = window.api;
    window.api = function (a, o) {
      try {
        if (a === "submit" && o && o.type === "bk" && o.data && payArm) {
          o.data.dep = payArm.dep; o.data.depM = payArm.depM; o.data.bal = payArm.bal; o.data.balM = payArm.balM;
          if (payArm.dep || payArm.bal) o.data.paidAmount = r2(payArm.dep + payArm.bal);
        }
      } catch (e) {}
      return origApi.apply(this, arguments);
    };
    window.api.__ajPay = true;
  }

  try { if (document.getElementById("tBk") && window.S && S.bk) window.renderBookings(); } catch (e) {}
})();
