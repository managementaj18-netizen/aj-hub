/* A&J Hub ⇄ A&J Guest App — "Check-in ជាមុន" (precheck.js v1)
   Guests fill "Check in early" in the Guest App (aj-guest-app) before they arrive: name, nationality,
   passport no., phone, dates + photos of passport / visa / ID. The Guest App keeps it for 45 days.
   On the Check-in form a card lists those guests. Staff tap the guest's name → the form is filled
   (text + ID photos into the photo boxes) → the guest only signs. Companions are scanned as usual
   (📷 Scan with the room number). Nothing is overwritten except the fields of the guest you picked.
   One-time tablet setup: open the link the Guest App sends to the staff Telegram group (?pckey=...). */
(function () {
  "use strict";
  var API = "https://aj-guest-app.management-aj-18.workers.dev/api/pc/";
  var LS = "aj_pckey";
  var LIST = [], showUsed = false, loading = false, lastLoad = 0;

  try {
    var p = new URLSearchParams(location.search), k = p.get("pckey");
    if (k) {
      localStorage.setItem(LS, k);
      p.delete("pckey");
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
      setTimeout(function () { alert("✓ Tablet នេះភ្ជាប់ជាមួយ Guest App ហើយ · Tablet connected to Guest App"); }, 400);
    }
  } catch (e) {}

  function key() { try { return localStorage.getItem(LS) || ""; } catch (e) { return ""; } }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fire(el, ev) { el.dispatchEvent(new Event(ev, { bubbles: true })); }
  function put(el, v) { if (el && v != null && String(v).trim() !== "") { el.value = String(v).trim(); fire(el, "input"); fire(el, "change"); } }
  function addDays(d, n) { try { var x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); } catch (e) { return ""; } }
  function today() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function fmt(d) { try { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); } catch (e) { return d || ""; } }
  function pickOpt(sel, re) {
    if (!sel) return;
    var o = [].slice.call(sel.options || []).filter(function (x) { return re.test(x.text); })[0];
    if (o) { sel.value = o.value || o.text; fire(sel, "change"); }
  }

  function card() {
    var c = $("pcCard");
    if (c) return c;
    var first = $("secSign"); if (!first || !first.parentNode) return null;
    c = document.createElement("section");
    c.id = "pcCard";
    c.className = "st";
    c.style.cssText = "border:2px solid #1f3a73;border-radius:14px;padding:12px 14px;margin-bottom:12px;background:#f3f6fc";
    first.parentNode.insertBefore(c, first);
    return c;
  }

  function draw(msg) {
    var c = card(); if (!c) return;
    var head = '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="font-size:16px;color:#14254a">📥 ភ្ញៀវ Check-in ជាមុន · Pre-checked-in guests</b>' +
      '<span style="flex:1"></span><button type="button" class="btn alt sm" id="pcReload">🔄</button></div>';
    if (!key()) {
      c.innerHTML = head + '<div class="muted" style="margin:6px 0">Tablet នេះមិនទាន់ភ្ជាប់ជាមួយ Guest App · This tablet is not connected yet.</div>' +
        '<button type="button" class="btn" id="pcSetup">📨 ផ្ញើ link ភ្ជាប់ទៅក្រុម Telegram · Send setup link</button>';
      $("pcSetup").onclick = function () {
        fetch(API + "setup", { credentials: "omit" }).then(function (r) { return r.json(); }).then(function (j) {
          alert(j.sent ? "✓ បានផ្ញើ link ទៅក្រុម Telegram “A&J សំណើភ្ញៀវ” — បើក link នោះនៅលើ tablet នេះ" : "សូមរង់ចាំ 1 នាទី ហើយសាកម្តងទៀត · Wait 1 minute");
        }).catch(function () { alert("⚠️ No internet"); });
      };
      $("pcReload").onclick = function () { draw(); };
      return;
    }
    var rows = LIST.filter(function (x) { return showUsed || !x.used; });
    var t = today();
    var body = rows.length ? rows.map(function (x) {
      var soon = x.arrival && x.arrival <= addDays(t, 1);
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid #dde3ef' + (x.used ? ';opacity:.55' : '') + '">' +
        '<div style="flex:1;min-width:0"><b>' + esc(x.name || "—") + '</b> <span class="muted">· ' + esc(x.nat || "") + '</span>' +
        '<div class="muted" style="font-size:12px">' + (soon ? '🟢 ' : '') + 'មកដល់ · Arrive ' + esc(fmt(x.arrival)) + ' · 👥 ' + esc(x.guests || 1) + ' · 📷 ' + (x.n || 0) + (x.used ? ' · ✓ ប្រើរួច' : '') + '</div></div>' +
        '<button type="button" class="btn sm" data-pc="' + esc(x.id) + '">✍️ ជ្រើស · Use</button></div>';
    }).join("") : '<div class="muted" style="padding:6px 0">' + (msg || 'មិនមានភ្ញៀវ Check-in ជាមុនទេ · No pre-check-ins') + '</div>';
    c.innerHTML = head + '<div class="muted" style="font-size:12px;margin:4px 0 2px">ចុចឈ្មោះភ្ញៀវ → ព័ត៌មាន និងរូប ID ចូល form → ភ្ញៀវគ្រាន់តែស៊ីញ៉េ។ ដៃគូ: ចុច 📷 Scan ដាក់លេខបន្ទប់។</div>' +
      body + '<label class="muted" style="font-size:12px;display:inline-flex;gap:6px;margin-top:6px"><input type="checkbox" id="pcUsed"' + (showUsed ? " checked" : "") + '> បង្ហាញដែលប្រើរួច · Show used</label>' +
      '<div id="pcMsg" style="display:none;margin-top:8px;padding:8px 10px;border-radius:10px;background:#e7f6ec;color:#15803d;font-weight:600"></div>';
    $("pcReload").onclick = function () { load(true); };
    $("pcUsed").onchange = function () { showUsed = this.checked; draw(); };
    [].slice.call(c.querySelectorAll("[data-pc]")).forEach(function (b) { b.onclick = function () { use(b.getAttribute("data-pc"), b); }; });
  }

  function load(force) {
    if (loading || !key()) { draw(); return; }
    if (!force && Date.now() - lastLoad < 30000) { draw(); return; }
    loading = true;
    fetch(API + "list?key=" + encodeURIComponent(key()), { credentials: "omit", cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) { if (j.error === "Bad key") { try { localStorage.removeItem(LS); } catch (e) {} } LIST = []; draw("⚠️ " + (j.error || "error")); return; }
        LIST = j.list || []; lastLoad = Date.now(); draw();
      })
      .catch(function () { draw("⚠️ មិនអាចភ្ជាប់បាន · Offline"); })
      .then(function () { loading = false; });
  }

  function use(id, btn) {
    if (btn) { btn.disabled = true; btn.textContent = "…"; }
    fetch(API + "get?key=" + encodeURIComponent(key()) + "&id=" + encodeURIComponent(id), { credentials: "omit", cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (rec) {
        var d = rec.data || {};
        put($("f_name"), d.name);
        if (d.nationality) { var n = $("f_nat"); if (n && typeof window.setNat === "function") { window.setNat(n, d.nationality); fire(n, "change"); } else put(n, d.nationality); }
        put($("f_passport"), d.passport);
        put($("f_phone"), d.phone);
        if (d.arrival) {
          put($("f_ci"), d.arrival); put($("f_arrival"), d.arrival);
          var nn = Math.max(1, parseInt(d.nights, 10) || 1), co = addDays(d.arrival, nn); put($("f_co"), co);
          setTimeout(function () { var c = $("f_co"); if (c && c.value !== co) put(c, co); }, 400);
        }
        if (+d.guests > 0) put($("f_guests"), d.guests);
        var tr = String(d.transport || "");
        pickOpt($("f_transport"), /Car/i.test(tr) ? /Car/ : /Motor/i.test(tr) ? /Motorbike/ : /Tuk/i.test(tr) ? /Tuk/ : /Taxi/i.test(tr) ? /Taxi/ : /Bus|Van/i.test(tr) ? /Bus/ : /^$/);
        var src = String(d.source || "");
        pickOpt($("f_src"), /Booking\.com/i.test(src) ? /Booking\.com/ : /Agoda/i.test(src) ? /Agoda/ : /Expedia/i.test(src) ? /Expedia/ : /Trip\.com/i.test(src) ? /Trip\.com/ : /Phone/);
        var extra = ["📱 Check-in ជាមុនតាម Guest App"];
        if (d.time) extra.push("Arrival time " + d.time);
        if (d.others) extra.push("Other guests: " + String(d.others).replace(/\s*\n\s*/g, "; "));
        if (d.note) extra.push("Guest note: " + d.note);
        if (d.tg && (d.tg.username || d.tg.name)) extra.push("Telegram: " + (d.tg.username ? "@" + d.tg.username : d.tg.name));
        var no = $("f_notes"); if (no) { var line = extra.join(" · "); if (no.value.indexOf("Guest App") < 0) { no.value = (no.value ? no.value + "\n" : "") + line; fire(no, "input"); } }
        var n = 0;
        if (typeof photos !== "undefined" && typeof PHOTO_SLOTS !== "undefined") {
          var order = PHOTO_SLOTS.map(function (x) { return x[0]; }).filter(function (k) { return k !== "id_visa"; });
          (rec.photos || []).forEach(function (u) {
            var slot = order.filter(function (k) { return !photos[k]; })[0]; if (!slot) return;
            photos[slot] = u; n++;
            var box = $("ph_" + slot); if (box && typeof showThumb === "function") showThumb(box, u);
          });
          if (n) { var ph = $("photos"); if (ph) { ph.style.display = ""; ph.removeAttribute("data-aj-hidden"); } }
          if (typeof updSummary === "function") try { updSummary(); } catch (e) {}
        }
        fetch(API + "used?key=" + encodeURIComponent(key()) + "&id=" + encodeURIComponent(id), { method: "POST", credentials: "omit" }).catch(function () {});
        LIST.forEach(function (x) { if (x.id === id) x.used = Date.now(); });
        draw();
        var m = $("pcMsg");
        if (m) { m.style.display = "block"; m.textContent = "✅ " + (d.name || "") + " — ព័ត៌មាន + រូប ID " + n + " បានចូល form។ សូមដាក់លេខបន្ទប់ ពិនិត្យ ហើយឱ្យភ្ញៀវស៊ីញ៉េ។"; }
        var room = $("f_room"); if (room && !room.value) try { room.scrollIntoView({ block: "center" }); } catch (e) {}
      })
      .catch(function () { alert("⚠️ មិនអាចទាញព័ត៌មានបាន · Could not load"); if (btn) { btn.disabled = false; btn.textContent = "✍️ ជ្រើស · Use"; } });
  }

  function tick() {
    var on = /^#(f\/checkin|tablet)\b/.test(location.hash) && $("secSign");
    var c = $("pcCard");
    if (!on) { if (c) c.style.display = "none"; return; }
    if (c) c.style.display = "";
    load(false);
  }
  window.addEventListener("hashchange", function () { setTimeout(tick, 300); });
  setInterval(tick, 30000);
  setTimeout(tick, 800);
})();
