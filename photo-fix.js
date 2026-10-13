/* A&J Hub — hide ID photos that were wrongly pulled into check-in forms (10–13 Oct 2026).
   The scan link used to load every guest ever scanned in a room, so old guests' IDs
   were attached to new forms. The saved records are NOT changed; these photos are only
   hidden on screen and in PDFs. Backup of the data: "Copy of A&J Hub Data" in Drive. */
(function () {
  var HIDE = "1hkEI49oAiznjUcxwh-Ru9mnI6nUzoCrX,1JKQXA7e9a0y5H6hXP4xt5u1PDG6A2Hiu,1jGlR8x-jf2CjFlhcepMzu6q326SeODap,13RnJMS-jQ3hU6wCPsW3WFuOJaGgbjojs,1wRB7TYQMLD3ADgRBTpPVWa1B1OKZY3NN,1J9EYiSGUTCEkj-zW17992ZRKcsOx5UIf,1nrGk281oyVOtD6Td1QnPNXOQ4W_xUaBj,1WKeae__p07PPeI0WDwpMNgz802lllOj_,1FdOa6XxybA50pEMr-vvbCK8lrEJ2GSmN,1K8NBFMnU9vcFBYyYXJwO-RACM-cj6sFR,1Xd4TOmEUvztW5Qsu440KXmKr0_Lgpqf-,1gHBpCfZQwld7N6OvjsMFpAwqxP_AgQUk,1MSTgp21fDmJQukZgK2mvbUm4VtIV343O,1eKrJdjUisE7IIi56QTWpQSt9hGXKuFC-,1phWrQaZk4BvhrSidQFcjOgSRUefll4YU,1HlvCPQJBk9frLVbd9icgM9XTKrgedu42,1zvU08V3mHKKCO8F5LUgmoljpRpPi6sK6,1KyYoiXJ03P_-7paoM_8YDRCtcaOY_Dla,10RD2UMeC5tFxQp3zNwjeE8PkzyX69Rng,1ujLcQfBZQnlvO3-pAc6c1fR8Q4Ika_ZE,15V5HTkiAG32dt0ZhIXFUwkX_CEQGN2N7,1wBKhPv7R5qpVqcfVUU3qNnc80xJsHk00,1bJAc6N9BJfmNB4mdorR_FLgHVY4v0xTU,1p2QxzA3FSOC-L_KF6wsTk7Lf1oskS8Qv,14iQeWBXTWJt7cAbjKjdDEYgcYqDqAqFM,1t98DXOf7_sQoDXy1ZGl_kGciapujAmNN,1WEXrViDauCdm1NcmcZpBpTqgTs-p3M-H,1TFIGqBWefaV3bhYlJIBWe-QQ23YJqE0x,1TH5XBuFzYOM3HTEwSHsQfwlW7ofE_jD_,1mQWe5_MGHsoL64CDVng5S_qlRMeZAWV8,1azykV5vzr_CCiUoXYmaLB4DDj9xnC3N3,1Nl_gj6QNCTtrDP8ddXyo7iZNBdVhdt8W,13bwPUYhnollhPHbU5mqDT9TsxX5bDac_,1PoQ1qFdSN3VW6ix8rk3_Fsolpd5VrAhL,1EzUCs1jmgK5ao4fdXvokFbYLiI3KdXMS,1xOGJjYaSlM6M-fyBbcF-ojcGIWla2ZfI,1N52gtSWXiv-jRxQiHuI2gvWnYHde-Y5H,1xuDZoZ9zYYz8BDZIqspora5AaU0eVKQH,1OZW4G9kbJTxJDeOnzH3A-wX8NewtcczR,18oxqEkeZeA1SXnUTA5U5ZzwWIYVRZqd_,1_nb0Mgu1TQNYK4pbSIy8NCjWI8BVCGM_,1xawHpBX07Lo47J-Dvxjv59krD-E3NFNu,1B91n72BmxWjlQLu-BtZxpqpqprcFHedp,1ARYanqkR2CvqKw0-C_qOZ5AxADiIXz_g,1hPuBcU7j6x2-QGQOJQv8g7ogVJvPtRRz,1NaZFnxOm4JYQM1CCr--ttCAtJQm7hstL,1dWKfeC0okck8kv7OtfDdig5WMBlQYO3w,1NHiLhKIKUsVnuKuegjW6ow3Emo_-H-fv,1v10dGRj4AcQLOJd6SNV3CXlRtNbpHrA5,11-Z6TM9FkLeSvdbE5Vm4DJ8WrL0FE6J5,16bOXmXJPTQJRSY7y9Zek9ycklHlhjxlm,1JPx7fUcLySb26SePTm5Rnim2E-Ijgyky,1tmWGjd7D3fPBaZbNfnUsScW55zsAMLrW,1dgqoLIkwIVJjdUe4e7u4JbGB8kvMRmeW,1V2MXHE0REBe86ecpEmFssqrRWzSdW5ub,1VVuXTdfSM6uHqEMyk9fCaooDMAW6dgw6,1y77hNZP3gJLWQRJdD5O6O6Xk_YWY8Xua,1bXDcoqCG-oMCn9swAqujSFAEoltjsEFE,1Bnb7OTpsZiShePxXZS1LQSvfJyGjpa8X,198K2qp5qpEm1CqdjoKuSwZ32HsPJh_m7,1F_N5k_2qCdVGIQ78H_gVbFRrWSwqLHKz,1ytrtzG-uF9eLDqmzUEhxPvW4Os5SzNRg,1chUMzTApA4ELe5HgjBlypdjXHAt3Psub,198Ybefxe0qIAt-sVGs7HD21Q9dO5yDR2,1eAY57rT6jy7UPw1GxCvXkDaaqUDZV6-G,1kqqz_99_KaDM6prsUK80jcd6phMQav9C,1G8zCLAuyBcjTXxtiTlehKdjD35WzVr8f,1QAy4JNfQLaf7AAyoCQQ4lpsBDuQG-HxM,1YpOLHjejYQzH1JxddRlQstjnO7eRaulf,1NvROrlpNhPql6fwP5f0eKKHnt3K-2Kl6,1Wl0ABNm2UMuZasDAeIwE1GLvTs9R3Cnc,1zv38f2VAflD-pDr3G9UGaG2JD6mXIpUd,18XLvw2bmb28HYRQ0E7wAxE3JN7u5EcBZ,1UuSuAMASHMi2SQJoxxu1pMU6TJFGfxvI,1Tt-DeIQ8JQTKjAY3EirYkgSp663dzMag,1v_gnHVLyDVHKVdnzrguWLvZs3O6u1E7N,1MBEwnPyDj4T1Y0Vh7YE6xgga6dgcvzlF,1O1r4usvoNLvLvSPFhww72z-V3UKbhsJz,1r6yTcdSFJr9yx9cqJ7tOkEdA12ocOFNj,1nPYMouFp83Yv0SndTY6noPv_zOFQVNrW,1acdXUqErcQ6ATY56pPdzq-a4a5seu-7K,12mCBnztahfUXw3WfDxnNn7V62TZTOi-l,12xHi0gmOR_zeXnxbyLPx-cw01yZa0PL1,19UNiIv4Xq_s8ODgVuy0ceSCAXzz1ttpi,18tsaAY1UCYWb9TR1o3qPdV-38Cx-zWm6,1Uyyrsp33vVQELSZRiNW91Z0FqQF5FNaC,1hq3evcRN-9scxWh1LwIOuS5eh0iQltJ9,19kHb_Urlzw_NuqYbtSOGCVHq0p0KPOSf,1RrW9uJM8OPT7Y4lBpyc3yWCMOTdtEvX6,1khBRf7Z6AX-R1jKhuWvIHVdKXGYQOT6x,1dBxSlLfb7MV_m2iV6YVyrcN1fP3hwaaz,1KkT89r5R6V3tg1IdqAsSaC7KfPTsZcHp,1DGqaSrTObQHXMe_mNoddXrpJ2DtScTHD,1kwCffxPNpqt45UD8AgrTEgSxetrqxHIO,1tMNqrHoh6nBSa6cxd9o_Js9_ZkuvR_yM,1yZLE9CNN1lQH-0nhMwSPzM0jOkkBZgfr,1Wx397h6dWyYCxysJjBvjzE3v1HzCYGV8,1XeapfzVtsjnRvFOn3bdw4JsX7IleKegP,1f89svseXrOFv_nlqCy6mIxzRZfCXGlEx,1z-JSguG3l0Q1PAZCDjYXtQf6uuNtEPIx,1SuzIgbWKT09xQDyHILO14ZkyDidCNPeB,1AdlEPbLUJSlXmYAhcDaVmDF892HvjCGF,1Rj4fxvxFhhxq43mQzw9u_aV0cpaSFpmm,1SQfvqdq4PLeZozGFt16H1Sg8ZAaiKR81,1aOYQ6vaBEwgRHhfgTcPx5laTQRhhu5-Y,1DP9T3VzUzu_MczSCdcvB0s5HCIyMixdi,1YV1d6miX-adevEXF3cT_bhC_nRIJssMq,1HCSnDILY1leAfmWrEeIznGLfnd7Hc_s3,11vTa6Csqag1tpqPyB4yJGgnhjY0FzBhJ,1D3K0sEY9inwHiktQlI_W449gi9_HDziL,1423l5iZbiY1B47rHmwQyFJfANO62ZZ5i,1hZ15qxBmx8NQTA3bsoV1CRrC0W8uadF-,1du0x-9dFBuKI1OM3yDcUbBkiXow2VbV5,1fDEw1QUYGXdWpRVAaXApRNYgUCfPLrl1,1PhiaeV00qsTnBy9EUr1JjfdUbU-k7O9T,1DMpSYtix3e2voBIhg3fR2kEJnPiYwgnn,1NFDCX27taTuSMM8Ef8969Tcd4GxgWKl7".split(",");
  var H = {}; HIDE.forEach(function (x) { H[x] = 1; });
  window.AJ_PHOTO_HIDE = H;
  function wrap() {
    var orig = window.imgsHTML;
    if (typeof orig !== "function" || orig.__ajfix) return false;
    var f = function (list) {
      var hidden = 0;
      var keep = (list || []).filter(function (it) {
        var s = it && it[0];
        if (typeof s === "string" && s.indexOf("drive:") === 0 && H[s.slice(6)]) { hidden++; return false; }
        return true;
      });
      var html = orig.call(this, keep);
      if (hidden) html += '<div class="muted" style="font-size:12px;margin:6px 0">ℹ️ លាក់រូប ID ' + hidden + ' សន្លឹក ដែលជារបស់ភ្ញៀវថ្ងៃផ្សេង (ចូលខុស)។ រូបត្រឹមត្រូវមាននៅក្នុង app ស្កេន។</div>';
      return html;
    };
    f.__ajfix = true;
    window.imgsHTML = f;
    return true;
  }
  function wrapP() {
    var o = window.pImg;
    if (typeof o !== "function" || o.__ajfix) return false;
    var f = function (v) {
      if (typeof v === "string" && v.indexOf("drive:") === 0 && H[v.slice(6)]) return "";
      return o.apply(this, arguments);
    };
    f.__ajfix = true;
    window.pImg = f;
    return true;
  }
  function all() { wrap(); wrapP(); }
  all();
  document.addEventListener("DOMContentLoaded", all);
  window.addEventListener("load", all);
})();
