/* A&J Hub — check-in forms show the guest ID / passport images straight from the scan app
   (aj-kampot-guest.pages.dev), matched by ROOM + CHECK-IN DATE, instead of the photos that were
   copied into the form (those sometimes included guests from other days).
   Read-only: the saved, signed records are not changed. If the scan app has nobody for that
   room/date, the form falls back to its own photos (minus the ones known to be wrong — photo-fix.js). */
(function () {
  var API = "https://aj-kampot-guest.pages.dev/api";
  var S = { list: null, loading: false, tried: 0 };
  window.AJSCAN = S;
  function key() { try { return localStorage.getItem("aj_scankey") || ""; } catch (e) { return ""; } }
  function ymd(d) { return new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10); }
  function q(o) { return Object.keys(o).map(function (k) { return k + "=" + encodeURIComponent(o[k]); }).join("&"); }
  function E(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(d) { d = String(d || ""); return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.slice(8, 10) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4) : d; }

  function load(cb) {
    if (S.list || S.loading) return;
    var k = key(); if (!k) return;
    S.loading = true; S.tried++;
    var now = new Date();
    var from = ymd(new Date(now.getTime() - 400 * 864e5)), to = ymd(new Date(now.getTime() + 2 * 864e5));
    fetch(API + "?" + q({ a: "hub_guests", key: k, from: from, to: to }), { credentials: "omit" })
      .then(function (r) { return r.json(); })
      .then(function (j) { S.loading = false; if (j && j.ok) { S.list = j.guests || []; if (cb) cb(); refresh(); } })
      .catch(function () { S.loading = false; });
  }

  function match(c) {
    if (!S.list || !c) return [];
    var room = String(c.room || c.key || "").trim(), ci = String(c.ci || "").slice(0, 10);
    if (!room || !/^\d{4}-\d{2}-\d{2}$/.test(ci)) return [];
    return S.list.filter(function (g) {
      if (String(g.room || "").trim() !== room) return false;
      var a = String(g.checkin_date || ""), b = String(g.checkout_date || "");
      if (!a) return false;
      return a <= ci && (b ? b > ci : a === ci);
    });
  }

  function cacheObj() { try { return imgCache; } catch (e) { return null; } }
  function waitObj() { try { return _imgWait; } catch (e) { return null; } }
  function paint() { try { paintImgs(); } catch (e) {} }

  function loadImg(id) {
    var C = cacheObj(), W = waitObj(), k = "scan_" + id;
    if (!C || C[k] || (W && W[k] === 2)) return;
    if (W) W[k] = 2;
    fetch(API + "?" + q({ a: "hub_img", key: key(), id: id }), { credentials: "omit" })
      .then(function (r) { return r.ok ? r.blob() : null; })
      .then(function (b) {
        if (!b) return null;
        return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = function () { res(null); }; fr.readAsDataURL(b); });
      })
      .then(function (u) { if (u) C[k] = u; if (W) delete W[k]; paint(); })
      .catch(function () { if (W) delete W[k]; });
  }

  function section(c, G) {
    var C = cacheObj() || {};
    var figs = G.map(function (g, i) {
      var name = [g.given_names, g.surname].filter(Boolean).join(" ");
      var cap = (i + 1) + ". " + E(name || "—") + (g.name_km ? " (" + E(g.name_km) + ")" : "") +
        (g.passport_no ? " · " + E(g.passport_no) : "") + (g.nationality ? " · " + E(g.nationality) : "") +
        " · " + fmt(g.checkin_date) + (g.checkout_date ? " → " + fmt(g.checkout_date) : "");
      var img = Number(g.has_img) ? '<img data-drive="scan_' + g.id + '" src="' + (C["scan_" + g.id] || "") + '" alt="" style="width:100%;height:auto;max-height:460px;object-fit:contain">' : '<div class="muted" style="padding:24px;text-align:center">គ្មានរូប · no image</div>';
      if (Number(g.has_img)) loadImg(g.id);
      return '<figure class="avoid" style="margin:0 0 12px;break-inside:avoid">' + img + '<figcaption style="font-weight:600">' + cap + "</figcaption></figure>";
    }).join("");
    return '<div class="pb"></div><div class="pbody"><h4>ID / PASSPORT — ពីការស្កេន · Room ' + E(c.room || c.key) + " · " + fmt(c.ci) + " · " + G.length + " នាក់</h4>" +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">' + figs + "</div></div>";
  }

  function wrap() {
    var orig; try { orig = paperCheckin; } catch (e) { return false; }
    if (typeof orig !== "function" || orig.__ajscan) return !!(orig && orig.__ajscan);
    var f = function (c) {
      load();
      var G = match(c);
      if (!G.length) return orig.apply(this, arguments);
      var c2 = {}; for (var k in c) c2[k] = c[k];
      c2.idPhotos = {};
      var html = orig.call(this, c2);
      var sec = section(c, G);
      var i = html.lastIndexOf('<div class="foot">');
      return i >= 0 ? html.slice(0, i) + sec + html.slice(i) : html + sec;
    };
    f.__ajscan = true;
    try { paperCheckin = f; } catch (e) { window.paperCheckin = f; }
    window.paperCheckin = f;
    return true;
  }

  // re-open the form that is on screen once the scan list arrives
  var lastOpen = null;
  function hookOpen() {
    var o; try { o = openRecord; } catch (e) { return; }
    if (typeof o !== "function" || o.__ajscan) return;
    var f = function (id) { lastOpen = id; return o.apply(this, arguments); };
    f.__ajscan = true;
    try { openRecord = f; } catch (e) {}
    window.openRecord = f;
  }
  function refresh() {
    if (!lastOpen) return;
    var box = document.getElementById("dB");
    if (box && box.offsetParent !== null && /GUEST REGISTRATION/i.test(box.textContent || "")) {
      try { openRecord(lastOpen); } catch (e) {}
    }
  }

  function init() { wrap(); hookOpen(); load(); }
  init();
  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
})();
