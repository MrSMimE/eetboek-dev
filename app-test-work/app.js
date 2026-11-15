(function () {
  // WERK-DEURTJE app-test-work — v60.0 - 15 nov 17u57 (Amsterdam)
  // Laadt de echte app.js uit versies/opdeling-test en past de werk-set aan
  // (canvas "weekweergave-eigen-regels v2", gekeurd 15 nov):
  // 1. opslag afgeschermd: 'eetweek.v1' -> 'eetweek.v1.testversie' (je echte eetboek blijft onaangeraakt)
  // 2. WERK-BRUG: dagen met eigen momenten (Mijn regels, sleutel eetweek.regels.v1) tonen alleen
  //    die momenten; dagen zonder eigen momenten zijn leeg — het vaste ritme vervalt
  // 3. Mijn normale dag volgt de eigen momenten mét ⚡-vinkje (regels-pagina v60.0)
  // 4. Zeg-blok: het uitklaplijstje toont alleen de eigen momenten van die dag; de standaardkeuze
  //    leest een leesbaar tijdje (dichtst bij nu), anders het eerste nog-lege moment
  // 5. vaste extra-knoppen (Iets tussendoor enz.) vervallen; op een lege dag staat een linkje naar Mijn regels
  // 6. versie naar v60.0 + eigen testpunten (Deel 6) op de testpagina
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

    // ---- 1. versie mee naar v60.0 ----
    ok.push(t.indexOf("var VERSION = 'v58.9 - 14 nov 20u55';") !== -1);
    t = t.replace("var VERSION = 'v58.9 - 14 nov 20u55';", "var VERSION = 'v60.0 - 15 nov 17u57';");
    ok.push(t.indexOf("VERSION = 'v58.9 - 14 nov 20u55 (testbuild 14 nov 20u55)';") !== -1);
    t = t.replace("VERSION = 'v58.9 - 14 nov 20u55 (testbuild 14 nov 20u55)';", "VERSION = 'v60.0 - 15 nov 17u57 (testbuild 15 nov 17u57)';");

    // ---- 2. WERK-BRUG: regelsMomenten + nieuwe momentsFor ----
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

    // ---- 7. testpunten Deel 6 + deelgrens 5 -> 9 (zoals de eigen werk-deuren) ----
    var PUNTEN =
      '    {"versie":"v60.0","deel":6,"t":"Week: alleen eigen momenten uit Mijn regels","sub":"dag mét eigen momenten toont alleen die; dag zonder eigen momenten is leeg, met alleen een linkje naar Mijn regels; geen kcal op de dagkaarten","ga":"week","doen":"Open Mijn regels en voeg op een dag twee momenten toe (naam + tijdje). Open daarna de Week: toont die dag alleen deze twee momenten? Is een dag zonder eigen momenten leeg en staat daar alleen het linkje naar Mijn regels?"},' + '\n' +
      '    {"versie":"v60.0","deel":6,"t":"Regels-pagina: het ⚡-vinkje","sub":"per eigen moment een vinkje: ⚡ in Mijn normale dag","ga":"test","doen":"Open Mijn regels en voeg een moment toe. Staat onder max kcal het ⚡-vinkje met uitleg? Vink het aan en herlaad de pagina: blijft het vinkje staan?"},' + '\n' +
      '    {"versie":"v60.0","deel":6,"t":"Mijn normale dag volgt het vinkje","sub":"Instellingen toont per weekdag alleen de aangevinkte eigen momenten; de ⚡-knop vult alleen die (ma t/m vr zoals altijd)","ga":"test","doen":"Vink op een weekdag één moment aan en vul er bij Instellingen een product in. Tik in de Week op ⚡: komt het product alleen in dat ene moment?"},' + '\n' +
      '    {"versie":"v60.0","deel":6,"t":"Zeg-blok volgt de eigen momenten","sub":"het uitklaplijstje toont alleen je eigen momenten van die dag; de knop kiest het moment met een leesbaar tijdje dichtst bij nu, anders het eerste nog-lege moment","ga":"week","doen":"Vul bij een eigen moment een tijdje in zoals rond 09:00. Open het zeg-blok op die dag: staan er alleen je eigen momenten in het lijstje en kiest de knop er een logische uit?"},' + '\n';
    ok.push(t.indexOf('var VERS_TESTEN = [') !== -1);
    t = t.replace('var VERS_TESTEN = [', 'var VERS_TESTEN = [\n' + PUNTEN);
    ok.push(t.indexOf('Math.min(5, Math.max(1, VERS_TESTEN[i].deel || 1))') !== -1);
    t = t.split('Math.min(5, Math.max(1, VERS_TESTEN[i].deel || 1))').join('Math.min(9, Math.max(1, VERS_TESTEN[i].deel || 1))');
    ok.push(t.indexOf('Math.min(5, Math.max(1, VERS_TESTEN[di].deel || 1))') !== -1);
    t = t.split('Math.min(5, Math.max(1, VERS_TESTEN[di].deel || 1))').join('Math.min(9, Math.max(1, VERS_TESTEN[di].deel || 1))');

    var s = document.createElement('script');
    s.text = t;
    document.head.appendChild(s);
    if (ok.indexOf(false) !== -1) { try { console.warn('werk-deurtje v60.0: niet alle aanpassingen gelukt — controleer de code'); } catch (e) {} }
  };
  x.onerror = function () {
    document.body.innerHTML = '<p>Kon de app-code niet laden. Kijk even of je internetverbinding het doet en probeer opnieuw.</p>';
  };
  x.send();
})();
