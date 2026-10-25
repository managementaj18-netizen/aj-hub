/* A&J Hub — Companion form: "save first, finish later" (comp-draft.js)
   1) The companion signs → staff tap "💾 រក្សាទុកសិន" → the form is kept on THIS tablet (not sent to the boss yet).
   2) Later staff open it from "📝 ហ្វមរង់ចាំបំពេញ", add the ID / passport details & photos,
      then tap ✅ Save as usual → it is sent to the boss and removed from the waiting list. */
(function () {
  "use strict";
  var ON = /#f\/companion/;
  var LIST = [], curId = null;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function db() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open("ajhub_comp", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("drafts", { keyPath: "id" }); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction("drafts", mode), q = fn(t.objectStore("drafts"));
        t.oncomplete = function () { res(q && q.result); }; t.onerror = function () { rej(t.error); };
      });
    });
  }
  function load() {
    return tx("readonly", function (s) { return s.getAll(); })
      .then(function (l) { LIST = (l || []).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); }); })
      .catch(function () { LIST = []; })
      .then(drawList);
  }
  function when(at) { try { return new Date(at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  function drawList() {
    var box = $("cdList"); if (!box) return;
    if (!LIST.length) { box.innerHTML = ""; box.style.display = "none"; return; }
    box.style.display = "block";
    box.innerHTML = '<b>📝 ហ្វមស៊ីញ៉េរួច — រង់ចាំបំពេញ ID (' + LIST.length + ')</b>' +
      '<div class="muted" style="font-size:12px;margin:2px 0 8px">រក្សាទុកក្នុងថេប្លេតនេះ មិនទាន់ផ្ញើទៅមេ។ ចុច ✍️ បំពេញ ដើម្បីបន្ថែម ID/រូបថត ហើយចុច ✅ រក្សាទុក ដើម្បីផ្ញើ។</div>' +
      LIST.map(function (d) {
        var f = d.fields || {};
        return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 0;border-top:1px solid #e5e7eb">' +
          '<span style="font-weight:700;min-width:44px">' + esc(f.g_room || "—") + '</span>' +
          '<span style="flex:1;min-width:140px">' + esc(f.g_name || "(មិនទាន់មានឈ្មោះ)") + '<br><small class="muted">ភ្ញៀវកក់៖ ' + esc(f.g_guestName || "") + ' · ' + esc(when(d.at)) + '</small></span>' +
          (d.id === curId ? '<span class="pill warn">កំពុងបំពេញ</span>' :
            '<button type="button" class="btn sm" data-cd-open="' + esc(d.id) + '">✍️ បំពេញ</button>') +
          '<button type="button" class="btn alt sm" data-cd-del="' + esc(d.id) + '">🗑️</button></div>';
      }).join("");
  }
  function inject() {
    var body = $("gfBody"), sub = $("gSubmit");
    if (!body || !sub || $("cdBtn")) return;
    var list = document.createElement("div"); list.id = "cdList";
    list.style.cssText = "display:none;margin:12px 0;padding:12px;border:2px dashed #111;border-radius:12px;background:#fafafa";
    body.insertBefore(list, body.firstChild.nextSibling);
    var b = document.createElement("button"); b.type = "button"; b.id = "cdBtn"; b.className = "btn alt";
    b.textContent = "💾 រក្សាទុកសិន — បំពេញ ID ពេលក្រោយ"; b.onclick = saveDraft;
    sub.parentNode.insertBefore(b, sub);
    if (curId) {
      var n = document.createElement("div"); n.className = "alert warn"; n.id = "cdNote"; n.style.marginTop = "10px";
      n.innerHTML = "✍️ កំពុងបំពេញហ្វមដែលរក្សាទុកសិន — បន្ថែម ID/រូបថត រួចចុច ✅ រក្សាទុក ដើម្បីផ្ញើទៅមេ";
      list.parentNode.insertBefore(n, list.nextSibling);
    }
    load();
  }
  function saveDraft() {
    var s = typeof sigs !== "undefined" && sigs.gs_sig;
    if (!s || !s.dirty) { alert("សូមឲ្យភ្ញៀវរួមស៊ីញ៉េជាមុនសិន / Please sign first."); return; }
    var f = {};
    $("gfBody").querySelectorAll('[id^="g_"]').forEach(function (el) { if (el.type === "checkbox" || !("value" in el)) return; f[el.id] = el.value; });
    var d = { id: curId || ("c" + Date.now().toString(36)), at: new Date().toISOString(), fields: f,
      agree: !!($("g_agree") && $("g_agree").checked), photos: Object.assign({}, (typeof G !== "undefined" && G.photos) || {}), sig: sigData("gs_sig") };
    tx("readwrite", function (st) { return st.put(d); }).then(function () {
      try { if (f.g_staffName) localStorage.setItem("ajhub_staff", f.g_staffName); } catch (e) {}
      alert("✅ រក្សាទុកសិនហើយ (ក្នុងថេប្លេតនេះ) — មិនទាន់ផ្ញើទៅមេទេ។\nពេលមាន ID/រូបថត ចុច «✍️ បំពេញ» ក្នុងបញ្ជី «📝 ហ្វមរង់ចាំបំពេញ» រួចចុច ✅ រក្សាទុក។");
      curId = null; openGeneric("companion"); window.scrollTo(0, 0);
    }).catch(function (e) { alert("រក្សាទុកមិនបាន៖ " + (e && e.message || e)); });
  }
  function openDraft(id) {
    var d = LIST.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    curId = id; openGeneric("companion"); inject();
    Object.keys(d.fields || {}).forEach(function (k) {
      var el = $(k); if (!el) return; var v = d.fields[k];
      if (k === "g_nat" && typeof setNat === "function") setNat(el, v); else el.value = v;
    });
    if ($("g_agree")) $("g_agree").checked = !!d.agree;
    if (typeof G !== "undefined") {
      G.photos = Object.assign({}, d.photos || {});
      Object.keys(G.photos).forEach(function (k) { if ($("gp_" + k) && typeof showThumb === "function") showThumb($("gp_" + k), G.photos[k]); });
    }
    setTimeout(function () {
      var s = sigs.gs_sig; if (!s || !d.sig) return;
      var im = new Image();
      im.onload = function () { var r = s.c.getBoundingClientRect(); s.ctx.drawImage(im, 0, 0, r.width, r.height); s.dirty = true; var ph = s.c.parentElement.querySelector(".ph"); if (ph) ph.style.opacity = 0; };
      im.src = d.sig;
    }, 150);
    drawList();
    var idEl = $("g_idNo"); if (idEl) setTimeout(function () { idEl.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300);
  }
  function delDraft(id) {
    var d = LIST.filter(function (x) { return x.id === id; })[0];
    if (!confirm("លុបហ្វមដែលរក្សាទុកសិននេះ? " + (d ? (d.fields.g_name || d.fields.g_room || "") : "") + "\nហត្ថលេខា និងរូបថតនឹងបាត់។")) return;
    if (curId === id) curId = null;
    tx("readwrite", function (st) { return st.delete(id); }).catch(function () {}).then(load);
  }
  document.addEventListener("click", function (e) {
    var o = e.target.closest && e.target.closest("[data-cd-open]"); if (o) { e.preventDefault(); openDraft(o.getAttribute("data-cd-open")); return; }
    var x = e.target.closest && e.target.closest("[data-cd-del]"); if (x) { e.preventDefault(); delDraft(x.getAttribute("data-cd-del")); }
  });
  setInterval(function () {
    if (!ON.test(location.hash)) { curId = null; return; }
    inject();
    // a continued draft was sent successfully (Thank-you screen shown) → remove it from the waiting list
    var done = $("gfDone");
    if (curId && done && !done.classList.contains("hide")) {
      var id = curId; curId = null;
      tx("readwrite", function (st) { return st.delete(id); }).catch(function () {}).then(load);
    }
  }, 700);
})();
