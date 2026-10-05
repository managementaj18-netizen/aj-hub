/* A&J Hub ⇄ A&J Passport Scan
   On the Check-in form: when a room number is entered, fill guest name / passport / nationality
   from passports scanned today for that room. Fills EMPTY fields only — never overwrites typing. */
(function () {
  "use strict";
  var API = "https://aj-kampot-scan.pages.dev/api";
  var LS = "aj_scankey";

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

  function key() { try { return localStorage.getItem(LS) || ""; } catch (e) { return ""; } }
  function $(id) { return document.getElementById(id); }
  function fire(el, ev) { el.dispatchEvent(new Event(ev, { bubbles: true })); }
  function setVal(el, v) { if (el && v && !el.value.trim()) { el.value = v; fire(el, "input"); fire(el, "change"); return true; } return false; }
  function setNatSel(el, g) {
    if (!el || el.value) return false;
    var v = g.nat2 || g.nationality;
    if (typeof window.setNat === "function") window.setNat(el, v); else el.value = v;
    fire(el, "change");
    return !!el.value;
  }
  function fullName(g) { return [g.given_names, g.surname].filter(Boolean).join(" ").trim(); }

  function banner(msg, ok) {
    var b = $("ajScanBanner");
    if (!b) {
      b = document.createElement("div");
      b.id = "ajScanBanner";
      b.style.cssText = "margin:8px 0;padding:10px 12px;border-radius:12px;font-size:14px;font-weight:600";
      var room = $("f_room"); var host = room && room.closest("label, .f, div");
      (host && host.parentNode ? host.parentNode : document.body).insertBefore(b, host ? host.nextSibling : null);
    }
    b.style.background = ok ? "#e7f6ec" : "#f3f4f6";
    b.style.color = ok ? "#15803d" : "#555";
    b.textContent = msg;
    b.style.display = msg ? "block" : "none";
  }

  var lastQ = "", busy = false;
  function lookup() {
    var room = $("f_room"), ci = $("f_ci");
    if (!room || !key() || busy) return;
    var r = room.value.trim(), d = ci && ci.value ? ci.value : "";
    var q = r + "|" + d;
    if (!r || q === lastQ) return;
    lastQ = q; busy = true;
    fetch(API + "?a=room_lookup&key=" + encodeURIComponent(key()) + "&room=" + encodeURIComponent(r) + (d ? "&date=" + d : ""))
      .then(function (res) { return res.json(); })
      .then(function (j) {
        if (!j.ok) { banner(j.error === "Bad key" ? "⚠️ Scan QR ចាស់ — សូមស្កេន QR ថ្មីពី Passport Scan" : "", false); return; }
        var G = j.guests || [];
        if (!G.length) { banner("📷 មិនទាន់មានការស្កេនសម្រាប់បន្ទប់ " + r + " ថ្ងៃនេះ", false); return; }
        var first = G[0];
        setVal($("f_name"), fullName(first));
        setVal($("f_passport"), first.passport_no);
        setNatSel($("f_nat"), first);
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
        banner("✓ បំពេញពីការស្កេន " + G.length + " នាក់ · Filled from Passport Scan — សូមពិនិត្យ", true);
      })
      .catch(function () { lastQ = ""; })
      .then(function () { busy = false; });
  }

  // Room may be typed, or filled when a booking is picked — check every second while the form is open
  // (waits until the room number has stopped changing for ~1.5 s, so "1" is not looked up while typing "12")
  var seen = "", stable = 0;
  setInterval(function () {
    if (!/#f\/checkin/.test(location.hash)) { lastQ = ""; return; }
    var room = $("f_room"); if (!room) return;
    var v = room.value.trim();
    if (!v) { lastQ = ""; banner("", false); }
    if (v !== seen) { seen = v; stable = 0; return; }
    if (++stable >= 2) lookup();
  }, 750);
})();
