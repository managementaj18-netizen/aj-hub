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
    r.onclick = function () { lastQ = ""; photoQ = ""; lookup(true); };
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
  var photoQ = "";
  function toDataUrl(blob) { return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(blob); }); }
  function fillPhotos(r, d) {
    var q = r + "|" + d; if (q === photoQ) return; photoQ = q;
    if (typeof photos === "undefined" || typeof PHOTO_SLOTS === "undefined") return;
    fetch(PRINT + "hub_room?key=" + encodeURIComponent(key()) + "&room=" + encodeURIComponent(r) + (d ? "&date=" + d : ""), { credentials: "omit" })
      .then(function (res) { return res.json(); })
      .then(function (j) {
        if (!j.ok) { photoQ = ""; return; }
        var withImg = (j.guests || []).filter(function (g) { return g.has_img == 1; });
        if (!withImg.length) { photoQ = ""; return; }
        var order = ["id_front"].concat(PHOTO_SLOTS.map(function (x) { return x[0]; }).filter(function (k) { return /^id_extra_/.test(k); }));
        var n = 0;
        return Promise.all(withImg.map(function (g) {
          return fetch(PRINT + "hub_img?key=" + encodeURIComponent(key()) + "&id=" + g.id, { credentials: "omit" })
            .then(function (res) { return res.ok ? res.blob() : null; }).then(function (b) { return b ? toDataUrl(b) : null; });
        })).then(function (urls) {
          urls.forEach(function (u) {
            if (!u) return;
            var dup = Object.keys(photos).some(function (k) { return photos[k] === u; }); if (dup) return;
            var slot = order.filter(function (k) { return !photos[k]; })[0]; if (!slot) return;
            photos[slot] = u; n++;
            var box = $("ph_" + slot); if (box && typeof showThumb === "function") showThumb(box, u);
          });
          if (n) {
            var ph = $("photos"); if (ph) { ph.style.display = ""; ph.removeAttribute("data-aj-hidden"); }
            if (typeof updSummary === "function") updSummary();
            var b = $("ajScanBanner"); if (b) b.textContent += " · 📷 រូប ID " + n + " បានចូល form";
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
        var G = j.guests || [];
        if (!G.length) { banner("📷 មិនទាន់មានការស្កេនសម្រាប់បន្ទប់ " + r + " ថ្ងៃនេះ — ចុច 📷 ស្កេន ID / Passport", false); lastQ = ""; return; }
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
        fillPhotos(r, d);
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
    if (!v) { lastQ = ""; photoQ = ""; scanned = false; banner("", false); }
    if (v !== seen) { seen = v; stable = 0; return; }
    if (++stable >= 2) lookup(false);
  }, 750);

  // Coming back from the scan app tab → check again right away
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && /#f\/checkin/.test(location.hash)) { lastQ = ""; lookup(false); }
  });
})();
