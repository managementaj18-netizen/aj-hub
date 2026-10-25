/* A&J Hub ⇄ A&J Passport Scan  (v4)
   Staff scan guests in the Passport Scan app at reception (with room number).
   On the Check-in form: when a room number is entered, fill guest details from
   today's scans for that room. Fills EMPTY fields only — never overwrites typing.
   v2: also fills phone, check-out date, country; adds a "📷 Scan" button + "🔄" re-check.
   v3: "📷 Scan" opens the Passport Scan app INSIDE the check-in form (staff link, no login);
       the scan is saved in the app (owner sees it there) and copied into this form.
   v3.1: nationality code (KH) → form country name (Cambodia).
   v5: the ID / Passport photos from the scan are also put into the form's photo boxes
       (read from A&J Print, same link key). Only empty boxes are filled.
   v4: section ② "photo ID" becomes a Scan card — no photos in the form; the ID photos stay in the
       Passport Scan app. Asks the room no. first if empty, notes "ID in Passport Scan" on the record. */
(function () {
  "use strict";
  var APP = "https://aj-kampot-scan.pages.dev/";
  var API = APP + "api";
  var LS = "aj_scankey";
  var LS_STAFF = "aj_scan_stafflink";
  var PRINT = "https://aj-kampot-print.pages.dev/api/";

  // One-time tablet setup: opened via the QR in the scan app Settings (?scankey=...)
  try {
    var p = new URLSearchParams(location.search), k = p.get("scankey");
    if (k) {
      localStorage.setItem(LS, k);
      p.delete("scankey");
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
      setTimeout(function () { alert("✓ Tablet នេះភ្ជាប់ជាមួយ Passport Scan ហើយ · Tablet connected"); }, 400);
    }
  } catch (e) {}

  function staffLink() { try { return localStorage.getItem(LS_STAFF) || ""; } catch (e) { return ""; } }
  function askStaffLink() {
    var v = prompt("ដាក់ Staff link ពី Passport Scan › Settings (ម្តងគត់លើ tablet នេះ)\nPaste the Staff link (…pages.dev/?k=…)", staffLink());
    if (v === null) return "";
    v = v.trim();
    if (!/^https:\/\/aj-kampot-scan\.pages\.dev\/\?k=[\w-]+/.test(v)) { if (v) alert("Link មិនត្រឹមត្រូវ · Wrong link"); return ""; }
    try { localStorage.setItem(LS_STAFF, v); } catch (e) {}
    return v;
  }

  // Scan panel: the Passport Scan app opened inside the form
  var panelTimer = null;
  function openPanel() {
    var room0 = $("f_room");
    if (room0 && !room0.value.trim()) {
      var rn = prompt("លេខបន្ទប់? · Room no.?", "");
      if (!rn || !rn.trim()) return;
      room0.value = rn.trim().replace(/^room\s*/i, ""); fire(room0, "input"); fire(room0, "change");
    }
    var link = staffLink() || askStaffLink();
    if (!link) return;
    var pn = $("ajScanPanel");
    if (!pn) {
      pn = document.createElement("div");
      pn.id = "ajScanPanel";
      pn.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:10px";
      pn.innerHTML = '<div style="background:#fff;border-radius:16px;width:100%;max-width:520px;height:100%;max-height:900px;display:flex;flex-direction:column;overflow:hidden">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #eee">' +
        '<b id="ajScanTitle" style="flex:1;font-size:15px">📷 ស្កេនភ្ញៀវ · ដាក់លេខបន្ទប់ឲ្យដូចក្នុង form</b>' +
        '<button type="button" id="ajScanDone" style="padding:10px 16px;border:0;border-radius:12px;background:#15803d;color:#fff;font-weight:700;font-size:14px">✓ រួចរាល់</button></div>' +
        '<iframe id="ajScanFrame" allow="camera" style="flex:1;border:0;width:100%"></iframe></div>';
      document.body.appendChild(pn);
      $("ajScanDone").onclick = closePanel;
    }
    var room = $("f_room");
    $("ajScanFrame").src = link;
    var tt = $("ajScanTitle"); if (tt && room) tt.textContent = "📷 ស្កេនភ្ញៀវ · ដាក់បន្ទប់ " + room.value.trim() + " ក្នុង app មុនចុច Save";
    pn.style.display = "flex";
    if (room && room.value.trim()) banner("📷 កំពុងស្កេនសម្រាប់បន្ទប់ " + room.value.trim() + " …", false);
    clearInterval(panelTimer);
    panelTimer = setInterval(function () { lastQ = ""; lookup(false); }, 4000);
  }
  function closePanel() {
    var pn = $("ajScanPanel"); if (pn) { pn.style.display = "none"; $("ajScanFrame").src = "about:blank"; }
    clearInterval(panelTimer);
    lastQ = ""; lookup(true);
  }

  function key() { try { return localStorage.getItem(LS) || ""; } catch (e) { return ""; } }
  function $(id) { return document.getElementById(id); }
  function fire(el, ev) { el.dispatchEvent(new Event(ev, { bubbles: true })); }
  function setVal(el, v) {
    if (el && v && !String(el.value || "").trim()) { el.value = v; fire(el, "input"); fire(el, "change"); return true; }
    return false;
  }
  function setNatSel(el, g) {
    if (!el || el.value) return false;
    var v = g.nat2 || g.nationality;
    if (!v) return false;
    // the form's country list uses English names ("Cambodia"), the scan gives codes ("KH") → convert
    var nm = "";
    try { if (g.nat2) nm = new Intl.DisplayNames(["en"], { type: "region" }).of(g.nat2); } catch (e) {}
    var opt = nm && [].slice.call(el.options || []).filter(function (o) { return o.value.toLowerCase() === nm.toLowerCase(); })[0];
    if (opt) el.value = opt.value;
    else if (typeof window.setNat === "function") window.setNat(el, nm || v); else el.value = nm || v;
    fire(el, "change");
    return !!el.value;
  }
  function fullName(g) { return [g.given_names, g.surname].filter(Boolean).join(" ").trim(); }
  function countryText(g) { return g.country || g.issuing_country_name || g.nationality_name || ""; }

  function banner(msg, ok) {
    var b = $("ajScanBanner");
    if (!b) {
      b = document.createElement("div");
      b.id = "ajScanBanner";
      b.style.cssText = "margin:8px 0;padding:10px 12px;border-radius:12px;font-size:14px;font-weight:600";
      var card = $("ajScanCard");
      if (card) card.appendChild(b);
      else {
        var room = $("f_room"); var host = room && room.closest("label, .f, div");
        (host && host.parentNode ? host.parentNode : document.body).insertBefore(b, host ? host.nextSibling : null);
      }
    }
    b.style.background = ok ? "#e7f6ec" : "#f3f4f6";
    b.style.color = ok ? "#15803d" : "#555";
    b.textContent = msg;
    b.style.display = msg ? "block" : "none";
  }

  // Section ② (photo ID) becomes a Scan card: no photos in the form, they stay in the Passport Scan app
  function addButtons() {
    var room = $("f_room");
    if (!room || $("ajScanBtns")) return;
    var css = "padding:12px 16px;border-radius:12px;border:0;font-weight:700;font-size:15px;cursor:pointer;";
    var w = document.createElement("div");
    w.id = "ajScanBtns";
    w.style.cssText = "display:flex;gap:8px;margin:10px 0;flex-wrap:wrap";
    var a = document.createElement("button");
    a.type = "button"; a.textContent = "📷 ស្កេន ID / Passport";
    a.style.cssText = css + "background:#2563eb;color:#fff;flex:1;min-width:200px";
    a.onclick = openPanel;
    var r = document.createElement("button");
    r.type = "button"; r.textContent = "🔄 ទាញម្តងទៀត";
    r.style.cssText = css + "background:#e5e7eb;color:#111";
    r.onclick = function () { lastQ = ""; photoQ = ""; fbQ = ""; lookup(true); };
    var c = document.createElement("button");
    c.type = "button"; c.textContent = "⚙️"; c.title = "Staff link";
    c.style.cssText = css + "background:#f3f4f6;color:#111";
    c.onclick = askStaffLink;
    w.appendChild(a); w.appendChild(r); w.appendChild(c);

    var sec = $("secPhoto");
    if (sec) {
      var card = document.createElement("div");
      card.id = "ajScanCard";
      card.style.cssText = "margin:8px 0;padding:12px;border:2px dashed #93c5fd;border-radius:14px;background:#eff6ff";
      card.innerHTML = '<div style="font-size:14px;color:#1e3a8a;line-height:1.5">ចុច <b>📷 ស្កេន</b> → ថត ID / Passport ក្នុង app Scan → ដាក់<b>លេខបន្ទប់</b> → Save → ចុច <b>✓ រួចរាល់</b>។ ព័ត៌មានភ្ញៀវ និងរូប ID នឹងចូល form ដោយខ្លួនឯង (មិនបាច់ថតនៅទីនេះទៀតទេ)។</div>';
      card.appendChild(w);
      var h = sec.querySelector("h2");
      if (h) h.innerHTML = h.innerHTML.replace(/ថតឯកសារ ID \/ Passport[^<]*/, "ស្កេន ID / Passport — app Scan");
      [].slice.call(sec.children).forEach(function (el) {
        if (el.tagName === "H2" || el.classList.contains("draftBar")) return;
        el.style.display = "none"; el.setAttribute("data-aj-hidden", "1");
      });
      var show = document.createElement("a");
      show.href = "#"; show.textContent = "ថតរូបក្នុង form ដដែល (ជម្រើសចាស់)";
      show.style.cssText = "display:inline-block;margin-top:6px;font-size:12px;color:#6b7280";
      show.onclick = function (e) {
        e.preventDefault();
        [].slice.call(sec.querySelectorAll('[data-aj-hidden="1"]')).forEach(function (el) { el.style.display = ""; });
        show.remove();
      };
      card.appendChild(show);
      var b0 = $("ajScanBanner"); if (b0) card.appendChild(b0);
      sec.insertBefore(card, h ? h.nextSibling : sec.firstChild);
    } else {
      var host = room.closest("label, .f, div");
      (host && host.parentNode ? host.parentNode : document.body).insertBefore(w, host ? host.nextSibling : null);
    }
  }

  // "No ID photo yet — save anyway?" is not needed when the ID is in the Passport Scan app
  var scanned = false;
  try {
    var _confirm = window.confirm;
    window.confirm = function (msg) {
      if (scanned && /មិនទាន់មានរូប ID/.test(String(msg))) return true;
      return _confirm.apply(window, arguments);
    };
  } catch (e) {}
  function noteScan(n) {
    var nt = $("f_notes"); if (!nt) return;
    var tag = "📷 ID/Passport ក្នុង app Scan";
    if (String(nt.value || "").indexOf(tag) === -1) {
      nt.value = (nt.value ? nt.value.replace(/\s+$/, "") + "\n" : "") + tag + " (" + n + " នាក់)";
      fire(nt, "input"); fire(nt, "change");
    }
  }


  // v5: copy the scanned ID / Passport photos into the form's photo boxes
  // v5.1: the scan app stacks several photos (passport + visa) in one picture with a dark label bar
  //       above each — split them so each goes into its own box (Passport → front, Visa → Visa box).
  var photoQ = "", fbQ = "";
  function toDataUrl(blob) { return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(blob); }); }
  function splitStack(blob) {
    return new Promise(function (res) {
      var url = URL.createObjectURL(blob), img = new Image();
      img.onerror = function () { res([]); };
      img.onload = function () {
        var W = img.naturalWidth, H = img.naturalHeight, c = document.createElement("canvas");
        c.width = W; c.height = H; var x = c.getContext("2d"); x.drawImage(img, 0, 0); URL.revokeObjectURL(url);
        var d = x.getImageData(0, 0, W, H).data;
        var rowMean = function (y) { var s = 0, n = 0; for (var i = y * W * 4; i < (y + 1) * W * 4; i += 16) { s += d[i] + d[i + 1] + d[i + 2]; n++; } return s / n / 3; };
        // dark bands (label bars); bands closer than 22px are one header (dark / label text / dark)
        var bands = [], st = -1, y;
        for (y = 0; y < H; y++) { var dark = rowMean(y) < 25; if (dark && st < 0) st = y; if (!dark && st >= 0) { if (y - st >= 6) bands.push([st, y]); st = -1; } }
        if (st >= 0) bands.push([st, H]);
        var heads = [];
        bands.forEach(function (b) { var l = heads[heads.length - 1]; if (l && b[0] - l[1] <= 22) l[1] = b[1]; else heads.push([b[0], b[1]]); });
        var segs = [], prev = 0;
        heads.forEach(function (h) { if (h[0] - prev > 150) segs.push([prev, h[0]]); prev = h[1]; });
        if (H - prev > 150) segs.push([prev, H]);
        if (segs.length < 1) segs = [[0, H]];
        res(segs.map(function (sg) {
          var h = sg[1] - sg[0], x0 = 0, x1 = W;
          var colMean = function (cx) { var s = 0, n = 0; for (var yy = sg[0]; yy < sg[1]; yy += 4) { var i = (yy * W + cx) * 4; s += d[i] + d[i + 1] + d[i + 2]; n++; } return s / n / 3; };
          while (x0 < W - 50 && colMean(x0) < 20) x0 += 2;
          while (x1 > x0 + 50 && colMean(x1 - 1) < 20) x1 -= 2;
          var o = document.createElement("canvas"); o.width = x1 - x0; o.height = h;
          o.getContext("2d").drawImage(c, x0, sg[0], x1 - x0, h, 0, 0, x1 - x0, h);
          return o.toDataURL("image/jpeg", 0.8);
        }));
      };
      img.src = url;
    });
  }
  function slotFor(label, i) {
    label = String(label || "");
    if (/visa/i.test(label)) return "id_visa";
    if (/back|ក្រោយ/i.test(label)) return "id_back";
    return i === 0 ? "id_front" : "";
  }
  function fillPhotos(r, d, fillText) {
    var q = r + "|" + d; if (q === photoQ) return; photoQ = q;
    if (typeof photos === "undefined" || typeof PHOTO_SLOTS === "undefined") return;
    fetch(PRINT + "hub_room?key=" + encodeURIComponent(key()) + "&room=" + encodeURIComponent(r) + (d ? "&date=" + d : ""), { credentials: "omit" })
      .then(function (res) { return res.json(); })
      .then(function (j) {
        if (!j.ok) { photoQ = ""; return; }
        var G = (j.guests || []).filter(function (g) { return g.doc_type !== "Companion" && !/^C-/.test(String(g.passport_no || "")) && String(g.passport_no || "") !== "-"; });
        if (d) G = G.filter(function (g) { return !g.checkout_date || g.checkout_date > d; });
        var SP = window.__ajScanPass; if (SP && SP.q === q && SP.list.length) G = G.filter(function (g) { return SP.list.indexOf(String(g.passport_no || "").replace(/\s/g, "").toUpperCase()) >= 0; });
        if (!G.length) return;
        if (fillText) {   // the scan app found nobody for this date — fill the basics from here
          fbQ = q;
          setVal($("f_name"), fullName(G[0])); setVal($("f_passport"), G[0].passport_no);
          setVal($("f_phone"), G[0].phone); setVal($("f_co"), G[0].checkout_date);
          scanned = true; noteScan(G.length);
          banner("✅ ស្កេនរួច " + G.length + " នាក់ — ព័ត៌មានបានចូល form — សូមពិនិត្យ (សញ្ជាតិ សូមជ្រើសខ្លួនឯង)", true);
        }
        var withImg = G.filter(function (g) { return g.has_img == 1; });
        var extras = PHOTO_SLOTS.map(function (x) { return x[0]; }).filter(function (k) { return /^id_extra_/.test(k); });
        var n = 0;
        return Promise.all(withImg.map(function (g) {
          return fetch(PRINT + "hub_img?key=" + encodeURIComponent(key()) + "&id=" + g.id, { credentials: "omit" })
            .then(function (res) { return res.ok ? res.blob() : null; })
            .then(function (b) { return b ? splitStack(b) : []; })
            .then(function (parts) { return { g: g, parts: parts }; });
        })).then(function (list) {
          list.forEach(function (it, gi) {
            var labels = String(it.g.docs || "").split(/\s*,\s*/);
            it.parts.forEach(function (u, pi) {
              var slot = gi === 0 ? slotFor(labels[pi], pi) : "";
              if (!slot || photos[slot]) slot = extras.filter(function (k) { return !photos[k]; })[0];
              if (!slot) return;
              photos[slot] = u; n++;
              var box = $("ph_" + slot); if (box && typeof showThumb === "function") showThumb(box, u);
            });
          });
          if (n) {
            var ph = $("photos"); if (ph) { ph.style.display = ""; ph.removeAttribute("data-aj-hidden"); }
            if (typeof updSummary === "function") updSummary();
            var b = $("ajScanBanner"); if (b) b.textContent += " · 📷 រូប " + n + " បានចូល form";
          }
        });
      })
      .catch(function () { photoQ = ""; });
  }

  var lastQ = "", busy = false;
  function lookup(manual) {
    var room = $("f_room"), ci = $("f_ci");
    if (!room || busy) return;
    if (!key()) { if (manual) banner("⚠️ Tablet មិនទាន់ភ្ជាប់ — សូមស្កេន QR ពី Passport Scan › Settings", false); return; }
    var r = room.value.trim().replace(/^room\s*/i, ""), d = ci && ci.value ? ci.value : "";
    var q = r + "|" + d;
    if (!r || q === lastQ) { if (manual && !r) banner("សូមដាក់លេខបន្ទប់ជាមុន · Enter room no. first", false); return; }
    lastQ = q; busy = true;
    fetch(API + "?a=room_lookup&key=" + encodeURIComponent(key()) + "&room=" + encodeURIComponent(r) + (d ? "&date=" + d : ""), { credentials: "omit" })
      .then(function (res) { return res.json(); })
      .then(function (j) {
        if (!j.ok) { banner(j.error === "Bad key" ? "⚠️ Scan QR ចាស់ — សូមស្កេន QR ថ្មីពី Passport Scan" : "", false); return; }
        var G = (j.guests || []).filter(function (g) { return g.doc_type !== "Companion" && !/^C-/.test(String(g.passport_no || "")) && String(g.passport_no || "") !== "-"; });
        window.__ajScanPass = { q: r + "|" + d, list: G.map(function (g) { return String(g.passport_no || "").replace(/\s/g, "").toUpperCase(); }) };
        if (!G.length) { if (fbQ === r + "|" + d) { lastQ = q; return; } banner("📷 មិនទាន់មានការស្កេនសម្រាប់បន្ទប់ " + r + " ថ្ងៃនេះ — ចុច 📷 ស្កេន ID / Passport", false); lastQ = ""; fillPhotos(r, d, true); return; }
        var first = G[0];
        setVal($("f_name"), fullName(first));
        setVal($("f_passport"), first.passport_no);
        setNatSel($("f_nat"), first);
        setVal($("f_phone"), first.phone);
        setVal($("f_co"), first.checkout_date);
        setVal($("f_country"), countryText(first));
        var gs = $("f_guests");
        if (gs && G.length > (+gs.value || 1)) { gs.value = G.length; fire(gs, "input"); fire(gs, "change"); }
        setTimeout(function () {
          var box = $("f_extraGuests");
          if (box && typeof window.addGuestRow === "function") {
            while (box.children.length < G.length - 1) window.addGuestRow();
          }
          var rows = box ? [].slice.call(box.children) : [];
          G.slice(1).forEach(function (g, i) {
            var row = rows[i]; if (!row) return;
            setVal(row.querySelector('[data-c="name"]'), fullName(g));
            setVal(row.querySelector('[data-c="passport"]'), g.passport_no);
            setNatSel(row.querySelector('[data-c="nat"]'), g);
          });
        }, 250);
        scanned = true; noteScan(G.length);
        banner("✅ ស្កេនរួច " + G.length + " នាក់ — ព័ត៌មានបានចូល form — សូមពិនិត្យ", true);
        fillPhotos(r, d, false);
      })
      .catch(function () { lastQ = ""; })
      .then(function () { busy = false; });
  }

  // Room may be typed, or filled when a booking is picked — check every 750 ms while the form is open
  // (waits until the room number has stopped changing, so "1" is not looked up while typing "12")
  var seen = "", stable = 0;
  setInterval(function () {
    if (!/#f\/checkin/.test(location.hash)) { lastQ = ""; return; }
    var room = $("f_room"); if (!room) return;
    addButtons();
    var v = room.value.trim();
    if (!v) { lastQ = ""; photoQ = ""; fbQ = ""; scanned = false; banner("", false); }
    if (v !== seen) { seen = v; stable = 0; return; }
    if (++stable >= 2) lookup(false);
  }, 750);

  // Coming back from the scan app tab → check again right away
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && /#f\/checkin/.test(location.hash)) { lastQ = ""; lookup(false); }
  });
})();

/* A&J Hub ⇄ Passport Scan — Companion form #f/companion (v1)
   When a room number is entered, fill the companion's name, phone, ID no., nationality and
   photos (face → Photo box, ID → ID box) from the companions scanned for that room on that date
   in the A&J Guest Scan app; also fills the registered guest's name. Fills EMPTY fields only.
   "📷 ស្កេនដៃគូ" opens the Guest Scan app's Add-companion screen inside the form (staff link). */
(function () {
  "use strict";
  var GUEST = "https://aj-kampot-guest.pages.dev/";
  var SCAN_API = "https://aj-kampot-scan.pages.dev/api";
  var PRINT = "https://aj-kampot-print.pages.dev/api/";
  var ON = /#f\/companion/;
  function $(id) { return document.getElementById(id); }
  function key() { try { return localStorage.getItem("aj_scankey") || ""; } catch (e) { return ""; } }
  function staffK() { try { var l = localStorage.getItem("aj_scan_stafflink") || ""; return l ? new URL(l).searchParams.get("k") || "" : ""; } catch (e) { return ""; } }
  function fire(el, ev) { el.dispatchEvent(new Event(ev, { bubbles: true })); }
  function setVal(el, v) { if (el && v && !String(el.value || "").trim()) { el.value = v; fire(el, "input"); fire(el, "change"); return true; } return false; }
  function isComp(g) { return g && (g.doc_type === "Companion" || /^C-/.test(String(g.passport_no || ""))); }
  function idNo(p) { p = String(p || ""); return /^C-#/.test(p) ? "" : p.replace(/^C-/, ""); }
  function fullName(g) { return [g.given_names, g.surname].filter(Boolean).join(" ").trim(); }
  function roomVal() { var r = $("g_room"); return r ? r.value.trim().replace(/^room\s*/i, "") : ""; }
  function dateVal() { var d = $("g_regDate"); return d && d.value ? d.value : ""; }

  function banner(msg, ok) {
    var b = $("ajCompBanner"); if (!b) return;
    b.style.background = ok ? "#e7f6ec" : "#f3f4f6"; b.style.color = ok ? "#15803d" : "#555";
    b.innerHTML = msg; b.style.display = msg ? "block" : "none";
  }
  function addCard() {
    var room = $("g_room"); if (!room || $("ajCompCard")) return;
    var host = $("gp_photo"); host = host && host.closest(".sec, section, fieldset, .card") || (room.closest("label, .f, div") || {}).parentNode;
    if (!host) return;
    var css = "padding:12px 16px;border-radius:12px;border:0;font-weight:700;font-size:15px;cursor:pointer;";
    var c = document.createElement("div");
    c.id = "ajCompCard";
    c.style.cssText = "margin:10px 0;padding:12px;border:2px dashed #f9a8d4;border-radius:14px;background:#fdf2f8";
    c.innerHTML = '<div style="font-size:14px;color:#9d174d;line-height:1.5">ដាក់<b>លេខបន្ទប់</b> → ឈ្មោះ ទូរស័ព្ទ និងរូបដៃគូ ដែលបានស្កេនក្នុង app Scan នឹងចូល form ដោយខ្លួនឯង។ មិនទាន់ស្កេន? ចុច <b>📷 ស្កេនដៃគូ</b>។</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" id="ajCompScan" style="' + css + 'background:#db2777;color:#fff;flex:1;min-width:180px">📷 ស្កេនដៃគូ</button>' +
      '<button type="button" id="ajCompRe" style="' + css + 'background:#e5e7eb;color:#111">🔄 ទាញម្តងទៀត</button></div>' +
      '<div id="ajCompPick" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>' +
      '<div id="ajCompBanner" style="display:none;margin-top:8px;padding:10px 12px;border-radius:12px;font-size:14px;font-weight:600"></div>';
    var h = host.querySelector && host.querySelector("h2, h3");
    if (host.id === "gfBody" || !h) { var sec = room.closest("label, .f, div"); sec.parentNode.insertBefore(c, sec.nextSibling); }
    else host.insertBefore(c, h.nextSibling);
    $("ajCompScan").onclick = openPanel;
    $("ajCompRe").onclick = function () { lastQ = ""; lookup(true); };
  }

  var timer = null;
  function openPanel() {
    var room = $("g_room");
    if (room && !room.value.trim()) {
      var rn = prompt("លេខបន្ទប់? · Room no.?", ""); if (!rn || !rn.trim()) return;
      room.value = rn.trim().replace(/^room\s*/i, ""); fire(room, "input"); fire(room, "change");
    }
    var k = staffK();
    if (!k) { alert("សូមដាក់ Staff link ជាមុន (⚙️ នៅលើ Check-in form) · Set the staff link first"); return; }
    var pn = $("ajCompPanel");
    if (!pn) {
      pn = document.createElement("div"); pn.id = "ajCompPanel";
      pn.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:10px";
      pn.innerHTML = '<div style="background:#fff;border-radius:16px;width:100%;max-width:520px;height:100%;max-height:900px;display:flex;flex-direction:column;overflow:hidden">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #eee"><b id="ajCompTitle" style="flex:1;font-size:15px">👥 ស្កេនដៃគូ</b>' +
        '<button type="button" id="ajCompDone" style="padding:10px 16px;border:0;border-radius:12px;background:#15803d;color:#fff;font-weight:700;font-size:14px">✓ រួចរាល់</button></div>' +
        '<iframe id="ajCompFrame" allow="camera" style="flex:1;border:0;width:100%"></iframe></div>';
      document.body.appendChild(pn);
      $("ajCompDone").onclick = closePanel;
    }
    var r = roomVal();
    $("ajCompTitle").textContent = "👥 ស្កេនដៃគូ · បន្ទប់ " + r + " · ថតរូប → Save → ✓ រួចរាល់";
    $("ajCompFrame").src = GUEST + "?k=" + encodeURIComponent(k) + "#comp/new?room=" + encodeURIComponent(r);
    pn.style.display = "flex";
    clearInterval(timer); timer = setInterval(function () { lastQ = ""; lookup(false); }, 4000);
  }
  function closePanel() {
    var pn = $("ajCompPanel"); if (pn) { pn.style.display = "none"; $("ajCompFrame").src = "about:blank"; }
    clearInterval(timer); lastQ = ""; lookup(true);
  }

  // split the stacked photo (dark label bar above each photo) into separate pictures
  function splitStack(blob) {
    return new Promise(function (res) {
      var url = URL.createObjectURL(blob), img = new Image();
      img.onerror = function () { res([]); };
      img.onload = function () {
        var W = img.naturalWidth, H = img.naturalHeight, c = document.createElement("canvas");
        c.width = W; c.height = H; var x = c.getContext("2d"); x.drawImage(img, 0, 0); URL.revokeObjectURL(url);
        var d = x.getImageData(0, 0, W, H).data;
        var rowMean = function (y) { var s = 0, n = 0; for (var i = y * W * 4; i < (y + 1) * W * 4; i += 16) { s += d[i] + d[i + 1] + d[i + 2]; n++; } return s / n / 3; };
        var bands = [], st = -1, y;
        for (y = 0; y < H; y++) { var dark = rowMean(y) < 25; if (dark && st < 0) st = y; if (!dark && st >= 0) { if (y - st >= 6) bands.push([st, y]); st = -1; } }
        if (st >= 0) bands.push([st, H]);
        var heads = [];
        bands.forEach(function (b) { var l = heads[heads.length - 1]; if (l && b[0] - l[1] <= 22) l[1] = b[1]; else heads.push([b[0], b[1]]); });
        var segs = [], prev = 0;
        heads.forEach(function (h) { if (h[0] - prev > 150) segs.push([prev, h[0]]); prev = h[1]; });
        if (H - prev > 150) segs.push([prev, H]);
        if (segs.length < 1) segs = [[0, H]];
        res(segs.map(function (sg) {
          var h = sg[1] - sg[0], x0 = 0, x1 = W;
          var colMean = function (cx) { var s = 0, n = 0; for (var yy = sg[0]; yy < sg[1]; yy += 4) { var i = (yy * W + cx) * 4; s += d[i] + d[i + 1] + d[i + 2]; n++; } return s / n / 3; };
          while (x0 < W - 50 && colMean(x0) < 20) x0 += 2;
          while (x1 > x0 + 50 && colMean(x1 - 1) < 20) x1 -= 2;
          var o = document.createElement("canvas"); o.width = x1 - x0; o.height = h;
          o.getContext("2d").drawImage(c, x0, sg[0], x1 - x0, h, 0, 0, x1 - x0, h);
          return o.toDataURL("image/jpeg", 0.8);
        }));
      };
      img.src = url;
    });
  }
  function putPhoto(k, u) {
    if (typeof G === "undefined" || !G.photos || G.photos[k] || !u) return false;
    G.photos[k] = u; var box = $("gp_" + k); if (box && typeof showThumb === "function") showThumb(box, u);
    return true;
  }
  function fillPhotos(c) {
    if (c.has_img != 1) return Promise.resolve(0);
    return fetch(PRINT + "hub_img?key=" + encodeURIComponent(key()) + "&id=" + c.id, { credentials: "omit" })
      .then(function (r) { return r.ok ? r.blob() : null; })
      .then(function (b) { return b ? splitStack(b) : []; })
      .then(function (parts) {
        var labels = String(c.docs || "").split(/\s*,\s*/), n = 0;
        parts.forEach(function (u, i) {
          var isId = /ID card|document/i.test(labels[i] || "") && !/Companion photo/i.test(labels[i] || "");
          if (putPhoto(isId ? "idPhoto" : "photo", u) || putPhoto(isId ? "photo" : "idPhoto", u)) n++;
        });
        return n;
      }).catch(function () { return 0; });
  }

  var cache = { q: "", list: [], guests: [] };
  function fill(c) {
    setVal($("g_name"), fullName(c));
    setVal($("g_phone"), c.phone);
    setVal($("g_idNo"), idNo(c.passport_no));
    var nat = $("g_nat");
    if (nat && !nat.value && typeof setNat === "function") { var nm = "Cambodia"; try { if (c.nat2) nm = new Intl.DisplayNames(["en"], { type: "region" }).of(c.nat2); } catch (e) {} setNat(nat, nm); fire(nat, "change"); }
    if (cache.guests[0]) setVal($("g_guestName"), fullName(cache.guests[0]));
    banner("✅ ដៃគូ <b>" + fullName(c).replace(/</g, "&lt;") + "</b> បានចូល form — សូមពិនិត្យ ហើយឲ្យគាត់ចុះហត្ថលេខា", true);
    fillPhotos(c).then(function (n) { if (n) { var b = $("ajCompBanner"); if (b) b.innerHTML += " · 📷 រូប " + n; } });
  }
  function picker(list) {
    var p = $("ajCompPick"); if (!p) return;
    p.innerHTML = "";
    if (list.length < 2) return;
    list.forEach(function (c) {
      var b = document.createElement("button"); b.type = "button";
      b.textContent = "👥 " + fullName(c);
      b.style.cssText = "padding:8px 12px;border-radius:999px;border:1px solid #f9a8d4;background:#fff;color:#9d174d;font-weight:600;cursor:pointer";
      b.onclick = function () { ["g_name", "g_phone", "g_idNo"].forEach(function (id) { var el = $(id); if (el) el.value = ""; }); if (typeof G !== "undefined" && G.photos) { ["photo", "idPhoto"].forEach(function (k) { delete G.photos[k]; var box = $("gp_" + k); if (box) { var im = box.querySelector("img"); if (im) im.remove(); } }); } fill(c); };
      p.appendChild(b);
    });
  }
  var lastQ = "", busy = false;
  function lookup(manual) {
    if (busy || !$("g_room")) return;
    if (!key()) { if (manual) banner("⚠️ Tablet មិនទាន់ភ្ជាប់ Passport Scan — សូមស្កេន QR ពី Settings", false); return; }
    var r = roomVal(), d = dateVal(), q = r + "|" + d;
    if (!r) { if (manual) banner("សូមដាក់លេខបន្ទប់ជាមុន · Enter room no. first", false); return; }
    if (q === lastQ) return;
    lastQ = q; busy = true;
    var kk = encodeURIComponent(key()), rr = encodeURIComponent(r);
    Promise.all([
      fetch(PRINT + "hub_room?key=" + kk + "&room=" + rr + (d ? "&date=" + d : ""), { credentials: "omit" }).then(function (x) { return x.json(); }),
      fetch(SCAN_API + "?a=room_lookup&key=" + kk + "&room=" + rr + (d ? "&date=" + d : ""), { credentials: "omit" }).then(function (x) { return x.json(); }).catch(function () { return {}; }),
      fetch(PRINT + "hub_room?key=" + kk + "&room=" + rr, { credentials: "omit" }).then(function (x) { return x.json(); }).catch(function () { return {}; })
    ]).then(function (a) {
      var all = (a[0] && a[0].guests) || [], info = (a[1] && a[1].guests) || [];
      var byNo = {}; info.forEach(function (g) { byNo[String(g.passport_no || "")] = g; });
      var list = all.filter(isComp).map(function (c) { var g = byNo[String(c.passport_no || "")]; if (g) c.nat2 = g.nat2; return c; }).sort(function (x, y) { return y.id - x.id; });
      cache = { q: q, list: list, guests: ((a[2] && a[2].guests) || all).filter(function (g) { return !isComp(g); }).sort(function (x, y) { return y.id - x.id; }) };
      picker(list);
      if (!list.length) { if (cache.guests[0]) setVal($("g_guestName"), fullName(cache.guests[0])); banner("👥 មិនទាន់មានដៃគូស្កេនសម្រាប់បន្ទប់ " + r + " ថ្ងៃនេះ — ចុច 📷 ស្កេនដៃគូ", false); lastQ = ""; return; }
      fill(list[0]);
    }).catch(function () { lastQ = ""; }).then(function () { busy = false; });
  }

  var seen = "", stable = 0;
  setInterval(function () {
    if (!ON.test(location.hash)) { lastQ = ""; seen = ""; return; }
    var room = $("g_room"); if (!room) return;
    addCard();
    var v = room.value.trim() + "|" + dateVal();
    if (!room.value.trim()) { lastQ = ""; banner("", false); }
    if (v !== seen) { seen = v; stable = 0; return; }
    if (++stable >= 2 && room.value.trim()) lookup(false);
  }, 750);
  document.addEventListener("visibilitychange", function () { if (!document.hidden && ON.test(location.hash)) { lastQ = ""; lookup(false); } });
})();
