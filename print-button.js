/* A&J Passport Scan — 🖨️ Print / PDF button (add-on; does not change the Passport Scan app itself)
   Used through a bookmark in the owner's Chrome: open a guest's page in Passport Scan, click the bookmark,
   and a "🖨️ បោះពុម្ព / PDF" button appears above "កែប្រែ · Edit". Print shows only the photo + details. */
(function () {
  "use strict";
  var BM = !!window.__AJP_BM; window.__AJP_BM = false;

  function btnText(b) { return (b.textContent || "").replace(/\s+/g, " ").trim(); }

  function inject() {
    var done = false, btns = document.querySelectorAll("button");
    for (var i = 0; i < btns.length; i++) {
      if (!/^កែប្រែ\s*·\s*Edit$/.test(btnText(btns[i]))) continue;
      var edit = btns[i], row = edit.parentNode, del = null;
      for (var j = 0; j < row.children.length; j++) if (/Delete/.test(btnText(row.children[j]))) del = row.children[j];
      if (!del) continue; /* detail page only (has Edit + Delete), not the edit form */
      done = true;
      if (row.querySelector(".ajp-btn")) continue;
      row.classList.add("ajp-hide");
      var p = document.createElement("button");
      p.type = "button"; p.className = edit.className + " ajp-btn"; p.textContent = "🖨️ បោះពុម្ព / PDF · Print";
      p.onclick = function () {
        var h1 = document.querySelector("h1"), old = document.title;
        if (h1 && h1.textContent.trim()) document.title = h1.textContent.trim();
        window.print();
        setTimeout(function () { document.title = old; }, 800);
      };
      row.insertBefore(p, edit);
    }
    return done;
  }

  if (window.__ajpLoaded) { if (!inject() && BM) alert("សូមបើកទំព័រព័ត៌មានភ្ញៀវមួយជាមុន (ចុចលើឈ្មោះភ្ញៀវ) រួចចុច bookmark ម្តងទៀត\nOpen a guest's page first, then click the bookmark again."); return; }
  window.__ajpLoaded = true;

  var css = document.createElement("style");
  css.textContent =
    "@media print{nav,nav.bn,.back,.toast,.ajp-hide{display:none!important}" +
    "body{background:#fff!important}.page{max-width:none!important;padding:0!important}" +
    "img.preview{max-width:100%!important;max-height:125mm;object-fit:contain;break-inside:avoid}" +
    ".kv{break-inside:avoid;box-shadow:none!important;border:1px solid #ddd!important}@page{margin:12mm}}";
  document.head.appendChild(css);

  new MutationObserver(inject).observe(document.documentElement, { childList: true, subtree: true });
  if (!inject() && BM) alert("សូមបើកទំព័រព័ត៌មានភ្ញៀវមួយជាមុន (ចុចលើឈ្មោះភ្ញៀវ) រួចចុច bookmark ម្តងទៀត\nOpen a guest's page first, then click the bookmark again.");
})();
