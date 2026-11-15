(function () {
  // WERK-DEURTJE app-test-work — v61.2 (Amsterdam)
  // Laadt de echte app.js uit versies/opdeling-test en past de werk-set aan
  // (canvas "weekweergave-eigen-regels v2" + "recepten-eigen-momenten v1" + "ai-instellingen v1", gekeurd 15 nov):
  // 1. opslag afgeschermd: 'eetweek.v1' -> 'eetweek.v1.testversie' (je echte eetboek blijft onaangeraakt)
  // 2. WERK-BRUG (v60.0): dagen tonen alleen de eigen momenten uit Mijn regels; lege dag = linkje naar Mijn regels
  // 3. Mijn normale dag volgt de eigen momenten mét ⚡-vinkje (regels-pagina v60.0)
  // 4. Zeg-blok: alleen de eigen momenten van die dag; slim tijdje lezen (dichtst bij nu)
  // 5. VAST (v61.0): recept-groepen volgen je eigen momentnamen uit Mijn regels
  //    (oude keuzes als Ochtend/Lunch/Avondeten blijven werken als je moment zo heet)
  // 6. VAST (v61.0): recept verwijderen gaat naar een prullenbak — per stuk of alles terugzetten
  // 7. VAST (v61.0): AI-instellingen — Mistral-blok blijft zoals het is; extra scherm voor
  //    OpenAI-compatibele aanbieders (webadres + sleutel + model, lege velden);
  //    laatst gebruikt = de actieve aanbieder; alle AI-aanroepen volgen die keuze
  // 8. versie naar v61.0 + eigen testpunten (Deel 6) op de testpagina
  // 9. v61.2: 🧪 Testen-blokje tussen Mijn data en Bewaren & terugzetten (link naar testen.html + Measure-helper), geen testbuild-naam meer
  try {
    var echt = window.localStorage;
    var map = function (k) { return k === 'eetweek.v1' ? 'eetweek.v1.testversie' : k; };
    var vervang = {
      getItem: function (k) { return echt.getItem(map(k)); },
      setItem: function (k, v) { echt.setItem(map(k), v); },
      removeItem: function (k) { echt.removeItem(map(k)); },
      clear: function () { echt.clear(); },
      key: function (i) { return echt.key(i); }
    };
    Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { return vervang; } });
  } catch (e) {}
  var x = new XMLHttpRequest();
  x.open('GET', '../versies/opdeling-test/app.js', true);
  x.onload = function () {
    var t = x.responseText, ok = [];

    // ---- 1. versie mee naar v61.0 ----
    ok.push(t.indexOf("var VERSION = 'v58.9 - 14 nov 20u55';") !== -1);
        t = t.replace("var VERSION = 'v58.9 - 14 nov 20u55';", "var VERSION = 'Mijn Eetboek • v61.2';");
    ok.push(t.indexOf("'Mijn Eetboek — versie ' + VERSION") !== -1);
    t = t.replace("'Mijn Eetboek — versie ' + VERSION", "VERSION"); // v61.3 werk: bovenaan Instellingen alleen de versieregel
    ok.push(t.indexOf("VERSION = 'v58.9 - 14 nov 20u55 (testbuild 14 nov 20u55)';") !== -1);
    t = t.replace("VERSION = 'v58.9 - 14 nov 20u55 (testbuild 14 nov 20u55)';", "VERSION = 'Mijn Eetboek • v61.2';");

    // ---- 2. WERK-BRUG (v60.0): regelsMomenten + nieuwe momentsFor ----
    var OUD_MOM = `  function momentsFor(dow, d, force) {
    var list = momentsBase(dow, d, force);
    list.forEach(function (m) { if (['och', 'ont', 'pz', 'av', 'okb', 'wont', 'wtus', 'opst'].indexOf(m.slot) < 0) m.g = m.g.concat(['NK']); });
    list.push({ slot: 'nacht', t: 'Nacht', p: 'na het slapengaan of midden in de nacht', g: ['LU', 'NE', 'ND', 'NF', 'NA', 'NK'] });
    list.push({ slot: 'move', t: 'Bewegen', p: '', g: [] });
    list.push({ slot: 'eod', t: 'Einde van de dag', p: 'hoeveel trek nog', g: [] });
    return list;
  }`;
    var NIEUW_MOM = `  var RGLKEY = 'eetweek.regels.v1'; // v60.0 werk: opslag van de Regels-pagina (Mijn regels)
  var RGLDAG = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  function regelsMomenten(dow) {
    try {
      var o = JSON.parse(localStorage.getItem(RGLKEY) || '{}');
      var lijst = (o && typeof o === 'object' && !Array.isArray(o) && Array.isArray(o[RGLDAG[dow]])) ? o[RGLDAG[dow]] : null;
      if (!lijst || !lijst.length) return null;
      var uit = [];
      lijst.forEach(function (m) {
        if (!m || !m.naam) return;
        uit.push({ slot: 'rgl:' + (m.id || String(m.naam)), t: String(m.naam).slice(0, 30), p: m.tijd ? String(m.tijd).slice(0, 30) : '', plan: '', g: ['NE', 'ND', 'NF', 'NA', 'NK'], norm: !!m.norm });
      });
      return uit.length ? uit : null;
    } catch (e) { return null; }
  }
  function momentsFor(dow, d, force) {
    var rg = regelsMomenten(dow);
    if (rg) { // v60.0 werk: eigen momenten uit Mijn regels + Nacht; het vaste ritme vervalt
      rg.push({ slot: 'nacht', t: 'Nacht', p: 'na het slapengaan of midden in de nacht', g: ['LU', 'NE', 'ND', 'NF', 'NA', 'NK'] });
      return rg;
    }
    return []; // v60.0 werk: geen eigen momenten = lege dag
  }`;
    ok.push(t.indexOf(OUD_MOM) !== -1);
    t = t.replace(OUD_MOM, NIEUW_MOM);

    // ---- 3. patroonSlots: alleen eigen momenten mét ⚡-vinkje ----
    var OUD_PS = `  function patroonSlots(dow) {
    if (dow === 2 || dow === 5) return ['ont', 'pz', 'lun']; // di/vr: ontbijt + pauze + lunch
    if (dow >= 1 && dow <= 4) return ['ont', 'pz', 'kl'];    // ma/wo/do: ontbijt + pauze + kleine lunch
    return [];
  }`;
    var NIEUW_PS = `  function patroonSlots(dow) {
    var rg = regelsMomenten(dow); // v60.0 werk: alleen de eigen momenten mét ⚡-vinkje
    if (!rg) return [];
    return rg.filter(function (m) { return m.norm; }).map(function (m) { return m.slot; });
  }`;
    ok.push(t.indexOf(OUD_PS) !== -1);
    t = t.replace(OUD_PS, NIEUW_PS);

    // ---- 4. alleEetMomenten: de eigen momenten van die dag ----
    var OUD_AEM = `  function alleEetMomenten(dow) {
    if (dow === 2 || dow === 5) return [
      { slot: 'ont', t: 'Ontbijt', p: '' },
      { slot: 'pz', t: 'Pauze', p: '' },
      { slot: 'lun', t: 'Lunch', p: '' }
    ];
    return [
      { slot: 'ont', t: 'Ontbijt', p: '' },
      { slot: 'pz', t: 'Pauze', p: '' },
      { slot: 'kl', t: 'Kleine lunch', p: '' }
    ];
  }`;
    var NIEUW_AEM = `  function alleEetMomenten(dow) {
    var rg = regelsMomenten(dow); // v60.0 werk: de eigen momenten van die dag (voor Mijn normale dag)
    if (rg) return rg.map(function (m) { return { slot: m.slot, t: m.t, p: m.p }; });
    return [];
  }`;
    ok.push(t.indexOf(OUD_AEM) !== -1);
    t = t.replace(OUD_AEM, NIEUW_AEM);

    // ---- 5. zegMomentStandaard: slim tijdje lezen, anders eerste nog-lege moment ----
    var OUD_ZEG = `  function zegMomentStandaard(id) {
    var ms = zegMomentLijst(id);
    if (!ms.length) return 'Extra, buiten het schema';
    var now = new Date(), hh = now.getHours() + now.getMinutes() / 60;
    var slots = ms.map(function (m) { return m.slot; });
    function pick(l) { for (var i = 0; i < l.length; i++) if (slots.indexOf(l[i]) >= 0) return l[i]; return null; }
    var s = null;
    if (hh < 9) s = pick(['ont', 'wont', 'wtus', 'pz']);
    else if (hh < 11) s = pick(['pz', 'wtus', 'ont', 'wont']);
    else if (hh < 14) s = pick(['lun', 'kl', 'pz', 'mid', 'mdg']);
    else if (hh < 17) s = pick(['mid', 'mdg', 'sport', 'ovb', 'lun', 'kl']);
    else if (hh < 21) s = pick(['av', 'ovb', 'sport', 'mid', 'mdg']);
    else s = pick(['ab', 'nacht', 'av', 'extra']);
    var m = ms.filter(function (x) { return x.slot === s; })[0] || ms[0];
    return m.t;
  }`;
    var NIEUW_ZEG = `  function zegMomentStandaard(id) {
    var ms = zegMomentLijst(id);
    if (!ms.length) return 'Extra, buiten het schema';
    // v60.0 werk: slim tijdje lezen — het moment met een leesbare kloktijd dichtst bij 'nu';
    // geen leesbaar tijdje: het eerste nog-lege moment van die dag
    var dd = dayDoc(id), now = new Date(), hh = now.getHours() + now.getMinutes() / 60;
    var metTijd = [];
    ms.forEach(function (m) {
      var r1 = /(\\d{1,2})[:.](\\d{2})/.exec(m.p || ''), r2 = /(\\d{1,2})\\s*uur/.exec(m.p || '');
      var h = null;
      if (r1) h = (+r1[1]) + (+r1[2]) / 60;
      else if (r2) h = +r2[1];
      if (h != null && isFinite(h) && h >= 0 && h < 24) metTijd.push({ m: m, h: h });
    });
    if (metTijd.length) {
      var best = metTijd[0];
      for (var i = 1; i < metTijd.length; i++) if (Math.abs(metTijd[i].h - hh) < Math.abs(best.h - hh)) best = metTijd[i];
      return best.m.t;
    }
    var es = (dd.entries || []);
    for (var j = 0; j < ms.length; j++) {
      var sl = ms[j].slot;
      if (!es.some(function (e) { return e.slot === sl; }) && !(dd.notes && dd.notes[sl])) return ms[j].t;
    }
    return ms[0].t;
  }`;
    ok.push(t.indexOf(OUD_ZEG) !== -1);
    t = t.replace(OUD_ZEG, NIEUW_ZEG);

    // ---- 6. optButtons: geen vaste extra's; lege dag krijgt linkje naar Mijn regels ----
    var OUD_OPT = `  function optButtons(dow, list, id) {
    var h = '';
    OPTL.forEach(function (o) {
      if (!o.dows[dow]) return;
      if (list.some(function (m) { return m.slot === o.slot; })) return;
      h += '<button class="optbtn" data-act="sheet" data-day="' + id + '" data-slot="' + o.slot + '">+ ' + esc(o.dows[dow]) + '</button>';
    });
    return h ? '<div class="optrow">' + h + '</div>' : '';
  }`;
    var NIEUW_OPT = `  function optButtons(dow, list, id) {
    var rg = regelsMomenten(dow); // v60.0 werk
    if (rg) return ''; // dag mét eigen momenten: geen vaste extra-knoppen meer
    return '<div class="optrow"><a class="optbtn" href="regels.html">+ Eigen moment maken (Mijn regels)</a></div>'; // lege dag: door naar Mijn regels
  }`;
    ok.push(t.indexOf(OUD_OPT) !== -1);
    t = t.replace(OUD_OPT, NIEUW_OPT);

    // ---- 7. VAST (v61.0): recept-groepen = je eigen momentnamen uit Mijn regels ----
    var OUD_RG = `  var RGROUPS = [
    { id: 'ochtend', t: 'Ochtend', slots: ['opst', 'ont', 'pz', 'wont', 'wtus', 'och', 'okb'] },
    { id: 'lunch', t: 'Lunch', slots: ['lun', 'kl', 'lm'] },
    { id: 'middag', t: 'Middag', slots: ['mid', 'mdg', 'sport', 'ovb'] },
    { id: 'avondeten', t: 'Avondeten', slots: ['av'] },
    { id: 'avondblok', t: 'Avondblok', slots: ['ab'] },
    { id: 'extra', t: 'Extra en nacht', slots: ['extra', 'nacht'] }
  ];
  function groupOfSlot(slot) { for (var i = 0; i < RGROUPS.length; i++) if (RGROUPS[i].slots.indexOf(slot) >= 0) return RGROUPS[i].id; return ''; }
  function rWhere(r) { return (r.where || []).filter(function (w) { return RGROUPS.some(function (g) { return g.id === w; }); }); }`;
    var NIEUW_RG = `  var RGROUPS = [ { id: 'extra', t: 'Extra en nacht', slots: ['extra', 'nacht'] } ]; // v61.0 werk: gevuld vanuit Mijn regels
  var RGL_LEGACY = { ochtend: 'ochtend', lunch: 'lunch', middag: 'middag', avondeten: 'avondeten', avondblok: 'avondblok', extra: 'extra en nacht' }; // v61.0 werk: oude recept-keuzes blijven werken als je moment zo heet
  function eigenRgroups() { // v61.0 werk: recept-groepen = je eigen momentnamen uit Mijn regels (alle dagen bij elkaar)
    var perNaam = {}, uit = [];
    for (var dw = 0; dw <= 6; dw++) {
      var lijst = regelsMomenten(dw);
      if (!lijst) continue;
      lijst.forEach(function (m) {
        if (!m || String(m.slot).indexOf('rgl:') !== 0 || m.slot === 'rgl:nacht') return;
        var key = String(m.t).toLowerCase();
        if (!perNaam[key]) { perNaam[key] = { id: 'rgl:' + key, t: String(m.t), slots: [] }; uit.push(perNaam[key]); }
        if (perNaam[key].slots.indexOf(m.slot) < 0) perNaam[key].slots.push(m.slot);
      });
    }
    uit.push({ id: 'extra', t: 'Extra en nacht', slots: ['extra', 'nacht'] });
    RGROUPS.splice(0, RGROUPS.length);
    uit.forEach(function (g) { RGROUPS.push(g); });
  }
  function groupOfSlot(slot) { // v61.0 werk
    for (var i = 0; i < RGROUPS.length; i++) if (RGROUPS[i].slots.indexOf(slot) >= 0) return RGROUPS[i].id;
    if (slot === 'nacht' || slot === 'extra') return 'extra';
    return '';
  }
  function rWhere(r) { // v61.0 werk: recept hoort bij een eigen moment als de naam klopt (oude keuzes blijven zo werken)
    var ws = (r.where || []).slice(), uit = [];
    RGROUPS.forEach(function (g) {
      var raak = ws.indexOf(g.id) >= 0 || (ws.indexOf('extra') >= 0 && g.id === 'extra');
      if (!raak) raak = ws.some(function (w) { return RGL_LEGACY[w] && RGL_LEGACY[w].toLowerCase() === String(g.t).toLowerCase(); });
      if (raak && uit.indexOf(g.id) < 0) uit.push(g.id);
    });
    return uit;
  }
  eigenRgroups();`;
    ok.push(t.indexOf(OUD_RG) !== -1);
    t = t.replace(OUD_RG, NIEUW_RG);

    // ---- 8. VAST (v61.0): verwijderen = prullenbak (per stuk of alles terug) ----
    var OUD_DEL = `    else if (act === 'recdel') {
      var rd = el.getAttribute('data-r');
      if (S.confirmDel === rd) { S.recipes = S.recipes.filter(function (r) { return r.id !== rd; }); S.confirmDel = null; S.recMenu = ''; persist(); toast('Recept verwijderd'); } // v58.1: menu dicht na écht verwijderen (bij de eerste tik blijft het open voor "Echt verwijderen?")
      else S.confirmDel = rd;
      render();
    }`;
    var NIEUW_DEL = `    else if (act === 'recdel') {
      var rd = el.getAttribute('data-r');
      if (S.confirmDel === rd) { var rdel = S.recipes.filter(function (r) { return r.id === rd; })[0]; S.recipes = S.recipes.filter(function (r) { return r.id !== rd; }); if (!S.prullen) S.prullen = []; if (rdel) S.prullen.push(rdel); S.confirmDel = null; S.recMenu = ''; persist(); toast('Recept naar de prullenbak — terugzetten kan bij 🗑️ onderaan'); } // v61.0 werk: verwijderen = prullenbak (menu dicht, terugzetten kan altijd)
      else S.confirmDel = rd;
      render();
    }`;
    ok.push(t.indexOf(OUD_DEL) !== -1);
    t = t.replace(OUD_DEL, NIEUW_DEL);

    // prullenbak bewaren: meenemen in de opslag (schrijven én laden)
    ok.push(t.indexOf("normaal: S.normaal, cat: S.cat || {} }));") !== -1);
    t = t.replace("normaal: S.normaal, cat: S.cat || {} }));", "normaal: S.normaal, cat: S.cat || {}, prullen: S.prullen || [] }));");
    ok.push(t.indexOf("S.normaal = cleanNormaal(o.normaal); S.cat = cleanCat(o.cat); } // v49 + v49-fix: cat geladen") !== -1);
    t = t.replace("S.normaal = cleanNormaal(o.normaal); S.cat = cleanCat(o.cat); } // v49 + v49-fix: cat geladen", "S.normaal = cleanNormaal(o.normaal); S.cat = cleanCat(o.cat); S.prullen = Array.isArray(o.prullen) ? o.prullen : []; } // v49 + v49-fix: cat geladen + v61.0 werk: prullenbak laden");

    // prullenbak tonen onderaan de Recepten-lijst (ook als er niks anders meer staat)
    ok.push(t.indexOf("if (!S.recipes.length) return '<p class=\"hint stat\">Je hebt nog geen recepten.</p>';") !== -1);
    t = t.replace("if (!S.recipes.length) return '<p class=\"hint stat\">Je hebt nog geen recepten.</p>';", "if (!S.recipes.length && !(S.prullen || []).length) return '<p class=\"hint stat\">Je hebt nog geen recepten.</p>';");
    ok.push(t.indexOf("    return h;    return h;") !== -1);
    t = t.replace("    return h;    return h;", `    var pbL = S.prullen || []; // v61.0 werk: prullenbak onderaan Recepten — terugzetten kan altijd
    if (pbL.length) h += '<details class="grp" data-gg="pm:pb"' + (S.grpOpen['pm:pb'] ? ' open' : '') + ' style="margin-top:10px"><summary><span>🗑️ Prullenbak</span><span class="gcnt">' + pbL.length + '</span></summary><div style="padding:0 4px 6px"><p class="hint" style="margin-top:0">Verwijderde recepten — terugzetten kan altijd.</p>' + pbL.map(function (r) { return '<div class="recpick" style="margin-top:6px"><span>' + esc(recEmoji(r) + ' ' + r.name) + '</span> <button class="pill" data-act="recback" data-r="' + r.id + '">↩︎ Terugzetten</button></div>'; }).join('') + '<button class="btn" style="width:100%;margin-top:8px" data-act="recbackall">↩︎ Alles terugzetten</button></div></details>';
    return h;    return h;`);

    // ---- 9. VAST (v61.0): AI-aanbieder — alle aanroepen volgen de actieve keuze ----
    ok.push(t.indexOf("'https://api.mistral.ai/v1/chat/completions'") !== -1);
    t = t.split("'https://api.mistral.ai/v1/chat/completions'").join("aiBase() + 'chat/completions'");
    ok.push(t.indexOf("'https://api.mistral.ai/v1/models'") !== -1);
    t = t.split("'https://api.mistral.ai/v1/models'").join("aiBase() + 'models'");
    ok.push(t.indexOf("var API = 'https://api.mistral.ai/v1/';") !== -1);
    t = t.split("var API = 'https://api.mistral.ai/v1/';").join("var API = aiBase();");
    ok.push(t.indexOf("var GEM_API = 'https://api.mistral.ai/v1/';") !== -1);
    t = t.split("var GEM_API = 'https://api.mistral.ai/v1/';").join("var GEM_API = aiBase();");

    // ---- 10. VAST (v61.0): runtime-blok (prullenbak-knoppen, AI-scherm, actieve aanbieder) ----
    var V61_BLOK = `
  // ================= v61.0 werk: prullenbak + AI-aanbieder (andere, OpenAI-compatibel) =================
  document.addEventListener('click', function (ev) { // v61.0 werk: prullenbak terugzetten
    var el = ev.target && ev.target.closest ? ev.target.closest('[data-act="recback"],[data-act="recbackall"]') : null;
    if (!el) return;
    if (!S.prullen) S.prullen = [];
    if (el.getAttribute('data-act') === 'recback') {
      var rd = el.getAttribute('data-r');
      var r = S.prullen.filter(function (x) { return String(x.id) === String(rd); })[0];
      if (r) { S.prullen = S.prullen.filter(function (x) { return x !== r; }); S.recipes.push(r); persist(); toast('"' + r.name + '" is terug'); render(); }
    } else if (S.prullen.length) {
      S.recipes = S.recipes.concat(S.prullen); S.prullen = []; persist(); toast('Alle recepten zijn terug'); render();
    }
  });
  var AIKEY = 'eetweek.ai.andere.v1';
  var AIACTIEF = 'eetweek.ai.actief';
  function aiAndere() { try { return JSON.parse(localStorage.getItem(AIKEY) || '{}') || {}; } catch (e) { return {}; } }
  function aiAndereKlaar() { var o = aiAndere(); return !!(o && o.base && o.sleutel && o.model); }
  function aiActief() { var a = ''; try { a = localStorage.getItem(AIACTIEF) || ''; } catch (e) {} return (a === 'andere' && aiAndereKlaar()) ? 'andere' : 'mistral'; } // v61.0 werk: laatst gebruikt = actief
  function aiZetActief(wie) { try { localStorage.setItem(AIACTIEF, wie); } catch (e) {} }
  function aiBase() { return aiActief() === 'andere' ? String(aiAndere().base || '').replace(/\\/+$/, '') + '/' : 'https://api.mistral.ai/v1/'; }
  function mistralSleutel() { // v61.0 werk: override — de actieve aanbieder bepaalt de sleutel
    if (aiActief() === 'andere') return String(aiAndere().sleutel || '');
    var k = '';
    try { k = localStorage.getItem('eetweek.gemini.sleutel') || ''; } catch (e) { }
    var ki = $('key'); if (!k && ki) k = String(ki.value || '').trim();
    if (!k) throw new Error('Plak eerst je API-sleutel bij ⚙️ Instellingen — of vul een andere aanbieder in bij 🌐 Andere AI-aanbieder.');
    return k;
  }
  function mistralModel() { // v61.0 werk: override — de actieve aanbieder bepaalt het model
    if (aiActief() === 'andere') return String(aiAndere().model || '');
    var m = '';
    try { var o = JSON.parse(localStorage.getItem('eetweek.gemini.keuzes') || '{}'); m = (o && o.m) || ''; } catch (e) { }
    var mi = $('model'); if (!m && mi) m = String(mi.value || '').trim();
    return m || 'mistral-medium-latest';
  }
  (function () { // v61.0 werk: extra scherm achter het Mistral-blok (alleen waar het Mistral-blok staat)
    var k = $('key'); if (!k) return;
    var host = (k.closest && k.closest('details')) || k.parentElement;
    if (!host || !host.parentNode) return;
    var d = document.createElement('details');
    d.className = 'grp'; d.style.marginTop = '10px';
    d.innerHTML =
      '<summary><span>🌐 Andere AI-aanbieder (OpenAI-compatibel)</span></summary>' +
      '<div style="padding:0 4px 6px">' +
      '<p class="hint" style="margin-top:6px">💡 Deze instellingen gelden voor álles in de app dat AI gebruikt: recept ideeën, recept aanpassen, live zoeken, etiket lezen en de kassabon lezen.</p>' +
      '<p class="hint">Nu in gebruik: <b id="aiNu">…</b></p>' +
      '<label for="aiBase">Webadres (Base URL)</label>' +
      '<input type="text" id="aiBase" autocomplete="off">' +
      '<p class="hint">Het webadres van je eigen aanbieder, zonder /chat/completions erachter — dat doet de app zelf.</p>' +
      '<label for="aiKey">API-sleutel</label>' +
      '<input type="text" id="aiKey" autocomplete="off">' +
      '<p class="hint">Je eigen sleutel van jouw aanbieder, zoals je die daar hebt gekregen.</p>' +
      '<label for="aiModel">Model</label>' +
      '<input type="text" id="aiModel" autocomplete="off">' +
      '<p class="hint">Vul hier de modelnaam in die jouw aanbieder gebruikt.</p>' +
      '<div style="display:flex;align-items:center;gap:10px;min-height:48px;margin-top:12px"><input type="checkbox" id="aiOnthoud"><label for="aiOnthoud" style="margin:0">Onthouden op dit apparaat</label></div>' +
      '<p class="hint">Aangevinkt = de app slaat het webadres, de sleutel en het model op in de lokale opslag van dit apparaat.</p>' +
      '<button class="btn main" style="width:100%" id="aiTestKnop">🔌 Test de verbinding</button>' +
      '<button class="btn" style="width:100%" id="aiModelsKnop">🔎 Welke modellen kan ik gebruiken?</button>' +
      '<p class="hint zz" id="aiStatus" hidden></p>' +
      '</div>';
    host.parentNode.insertBefore(d, host.nextSibling);
    var o0 = aiAndere();
    $('aiBase').value = o0.base || ''; $('aiKey').value = o0.sleutel || ''; $('aiModel').value = o0.model || ''; $('aiOnthoud').checked = !!o0.onthoud;
    function aiStatus(t, fout) { var s = $('aiStatus'); s.hidden = false; s.textContent = t || ''; s.className = 'hint zz' + (fout ? ' err' : ''); }
    function aiNuZet() { $('aiNu').textContent = aiActief() === 'andere' ? 'de andere aanbieder' : 'Mistral'; }
    function aiBewaar() {
      var o2 = { base: $('aiBase').value.trim(), sleutel: $('aiKey').value.trim(), model: $('aiModel').value.trim(), onthoud: $('aiOnthoud').checked };
      try { localStorage.setItem(AIKEY, JSON.stringify(o2)); } catch (e) {}
    }
    ['aiBase', 'aiKey', 'aiModel'].forEach(function (id) { // iets invullen hier = de andere aanbieder wordt de actieve
      $(id).addEventListener('input', function () { aiBewaar(); aiZetActief('andere'); aiNuZet(); });
    });
    $('aiOnthoud').addEventListener('change', aiBewaar);
    $('aiTestKnop').addEventListener('click', function () {
      aiBewaar();
      var base = $('aiBase').value.trim(), key = $('aiKey').value.trim(), model = $('aiModel').value.trim();
      if (!base) { aiStatus('Vul eerst het webadres van je aanbieder in.', true); return; }
      if (!key) { aiStatus('Vul eerst je API-sleutel in.', true); return; }
      if (!model) { aiStatus('Vul nog even de modelnaam in.', true); return; }
      aiZetActief('andere'); aiNuZet();
      aiStatus('Verbinding maken… even geduld');
      fetch(base.replace(/\\/+$/, '') + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model: model, messages: [{ role: 'user', content: 'Zeg alleen: OK' }], max_tokens: 5 }) })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function () { aiStatus('✅ Verbinding gelukt — de app gebruikt nu deze aanbieder'); })
        .catch(function (e) { aiStatus('❌ Verbinding mislukt (' + (e && e.message ? e.message : 'fout') + ') — controleer het webadres, de sleutel en de modelnaam, en probeer het nog eens', true); });
    });
    $('aiModelsKnop').addEventListener('click', function () {
      var base = $('aiBase').value.trim();
      if (!base) { aiStatus('Vul eerst het webadres in, dan kan ik de modellen opvragen.', true); return; }
      aiStatus('Modellen opvragen… even geduld');
      fetch(base.replace(/\\/+$/, '') + '/models', { headers: { 'Authorization': 'Bearer ' + ($('aiKey').value.trim() || 'x') } })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) {
          var ids = (j && j.data ? j.data : []).map(function (m) { return m.id; }).filter(Boolean);
          if (!ids.length) { aiStatus('Geen modellen gevonden — vul de modelnaam zelf in.', true); return; }
          showOut('Modellen van je aanbieder', 'Kies er één en vul die naam in bij Model.', ids.join('\\n'), false);
        })
        .catch(function (e) { aiStatus('Lukt niet (' + (e && e.message ? e.message : 'fout') + ') — vul de modelnaam zelf in.', true); });
    });
    document.addEventListener('click', function (ev) { // v61.0 werk: bij Mistral testen schakelt de app terug naar Mistral
      var el = ev.target && ev.target.closest ? ev.target.closest('button, [data-act]') : null;
      if (!el || el.id === 'aiTestKnop' || el.id === 'aiModelsKnop') return;
      var txt = (el.textContent || '').trim();
      if (txt.indexOf('Test de verbinding') >= 0 || txt.indexOf('verbinding testen') >= 0) { aiZetActief('mistral'); aiNuZet(); }
    }, true);
    aiNuZet();
  })();
  (function () { // v61.2 werk: 🧪 Testen — eigen blokje tussen Mijn data en Bewaren & terugzetten; testbalkje onderaan standaard weg
    try { sessionStorage.setItem('eetweek.testverberg', '1'); } catch (e) {}
    var iv = $('instview'); if (!iv) return;
    var d = document.createElement('details');
    d.className = 'pgrp instgrp'; d.id = 'grpTesten';
    d.innerHTML = '<summary><span class="ci">🧪</span><span>Testen</span></summary>' +
      '<div class="pgin">' +
      '<div class="card"><details class="per" open><summary>📋 Test-rondje</summary>' +
      '<p class="hint" style="margin:6px 0 0">Hiermee kun je controleren of alle onderdelen van Mijn Eetboek goed werken op jouw apparaat — de punten van deze versie staan bij elkaar in een rustig rondje.</p>' +
      '<button class="btn main" style="width:100%" type="button" id="testOpenKnop">▶ Open het test-rondje</button>' +
      '<button class="btn" style="width:100%" type="button" id="testBalkKnop">▸ Toon het testbalkje onderaan</button>' +
      '</details></div>' +
      '<div id="testMeethulpPlek"></div>' +
      '</div>';
    var bew = $('grpBewaren');
    if (bew && bew.parentNode === iv) iv.insertBefore(d, bew); else iv.appendChild(d);
    var mh = $('meethulp'); // v61.2 werk: het Measure-helper verhuist van Bewaren & terugzetten naar Testen
    if (mh && mh.closest) { var mc = mh.closest('.card'); if (mc && $('testMeethulpPlek')) $('testMeethulpPlek').appendChild(mc); }
    $('testOpenKnop').addEventListener('click', function () {
      if ($('testview')) { S.tab = 'test'; render(); if (window.scrollTo) window.scrollTo(0, 0); }
      else location.assign('testen.html');
    });
    $('testBalkKnop').addEventListener('click', function () {
      try { sessionStorage.removeItem('eetweek.testverberg'); } catch (e) {}
      toast('Testbalkje terug'); render();
    });
  })();

`;
    var ANKER_ACC = "  // v58.9: accordion — binnen een lijst staat één deel/onderwerp-blokje tegelijk open";
    ok.push(t.indexOf(ANKER_ACC) !== -1);
    t = t.replace(ANKER_ACC, V61_BLOK + ANKER_ACC);

    // ---- 11. testpunten Deel 6 (v60.0 + v61.0) + deelgrens 5 -> 9 ----
    var PUNTEN =
      '    {"versie":"v60.0","deel":6,"t":"Week: alleen eigen momenten uit Mijn regels","sub":"dag mét eigen momenten toont alleen die; dag zonder eigen momenten is leeg, met alleen een linkje naar Mijn regels; geen kcal op de dagkaarten","ga":"week","doen":"Open Mijn regels en voeg op een dag twee momenten toe (naam + tijdje). Open daarna de Week: toont die dag alleen deze twee momenten? Is een dag zonder eigen momenten leeg en staat daar alleen het linkje naar Mijn regels?"},' + '\n' +
      '    {"versie":"v60.0","deel":6,"t":"Regels-pagina: het ⚡-vinkje","sub":"per eigen moment een vinkje: ⚡ in Mijn normale dag","ga":"test","doen":"Open Mijn regels en voeg een moment toe. Staat onder max kcal het ⚡-vinkje met uitleg? Vink het aan en herlaad de pagina: blijft het vinkje staan?"},' + '\n' +
      '    {"versie":"v60.0","deel":6,"t":"Mijn normale dag volgt het vinkje","sub":"Instellingen toont per weekdag alleen de aangevinkte eigen momenten; de ⚡-knop vult alleen die (ma t/m vr zoals altijd)","ga":"test","doen":"Vink op een weekdag één moment aan en vul er bij Instellingen een product in. Tik in de Week op ⚡: komt het product alleen in dat ene moment?"},' + '\n' +
      '    {"versie":"v60.0","deel":6,"t":"Zeg-blok volgt de eigen momenten","sub":"het uitklaplijstje toont alleen je eigen momenten van die dag; de knop kiest het moment met een leesbaar tijdje dichtst bij nu, anders het eerste nog-lege moment","ga":"week","doen":"Vul bij een eigen moment een tijdje in zoals rond 09:00. Open het zeg-blok op die dag: staan er alleen je eigen momenten in het lijstje en kiest de knop er een logische uit?"},' + '\n' +
      '    {"versie":"v61.0","deel":7,"t":"Recepten: je eigen momentnamen","sub":"recept-groepen volgen Mijn regels; oude keuzes (Ochtend, Lunch, Avondeten enz.) blijven werken als je moment zo heet","ga":"test","doen":"Maak op Mijn regels een moment dat Ochtend heet. Open Recepten: staat onder Per moment een groep Ochtend met je ochtend-recepten? Bewerk een recept en kies bij Waar een andere groep: verhuist het recept?"},' + '\n' +
      '    {"versie":"v61.0","deel":7,"t":"Recepten: prullenbak","sub":"verwijderen is omkeerbaar: het recept gaat naar de prullenbak onderaan Recepten, per stuk of alles terug te zetten; blijft bewaard na herladen","ga":"test","doen":"Verwijder een recept (twee keer tikken). Staat het daarna in de prullenbak onderaan Recepten? Zet het terug. Herlaad de pagina: is de prullenbak nog zoals je hem achterliet?"},' + '\n' +
      '    {"versie":"v61.0","deel":7,"t":"AI: andere aanbieder (OpenAI-compatibel)","sub":"achter het Mistral-blok een extra scherm: lege velden (webadres, sleutel, model, geen placeholders), test-knop en modellen-knop; hint dat het voor alles met AI geldt","ga":"test","doen":"Open het Mistral-blok bij Instellingen: staat daaronder het scherm Andere AI-aanbieder met de hint over alles met AI? Zijn de velden leeg?"},' + '\n' +
      '    {"versie":"v61.0","deel":7,"t":"AI: laatst gebruikt = actief","sub":"iets invullen of testen bij de andere aanbieder schakelt de app over; bij Mistral testen schakelt de app terug; het Nu in gebruik-plaatje volgt op beide schermen","ga":"test","doen":"Typ iets in het webadres-veld van de andere aanbieder: springt Nu in gebruik naar de andere aanbieder? Ga terug naar het Mistral-blok en tik daar op Test de verbinding: springt het plaatje terug naar Mistral?"},' + '\n' +
      '    {"versie":"v61.2","deel":7,"t":"Testen-blokje in Instellingen","sub":"🧪 Testen staat tussen Mijn data en Bewaren & terugzetten, met daarin het test-rondje (link naar testen.html) en het Measure-helper; het balkje onderaan de pagina is standaard weg en via dat blokje terug te halen","ga":"test","doen":"Open Instellingen: staat tussen Mijn data en Bewaren & terugzetten het blokje Testen? Opent de knop het test-rondje (testen.html) en zit het Measure-helper erin? Is het testbalkje onderaan de Week-pagina weg, en komt het terug via het blokje?"},' + '\n';

    ok.push(t.indexOf('var VERS_TESTEN = [') !== -1);
    t = t.replace('var VERS_TESTEN = [', 'var VERS_TESTEN = [\n' + PUNTEN);
    ok.push(t.indexOf('Math.min(5, Math.max(1, VERS_TESTEN[i].deel || 1))') !== -1);
    t = t.split('Math.min(5, Math.max(1, VERS_TESTEN[i].deel || 1))').join('Math.min(9, Math.max(1, VERS_TESTEN[i].deel || 1))');
    ok.push(t.indexOf('Math.min(5, Math.max(1, VERS_TESTEN[di].deel || 1))') !== -1);
    t = t.split('Math.min(5, Math.max(1, VERS_TESTEN[di].deel || 1))').join('Math.min(9, Math.max(1, VERS_TESTEN[di].deel || 1))');

    var s = document.createElement('script');
    s.text = t;
    document.head.appendChild(s);
    if (ok.indexOf(false) !== -1) { try { console.warn('werk-deurtje v61.1: niet alle aanpassingen gelukt — controleer de code'); } catch (e) {} }
  };
  x.onerror = function () {
    document.body.innerHTML = '<p>Kon de app-code niet laden. Kijk even of je internetverbinding het doet en probeer opnieuw.</p>';
  };
  x.send();
})();
