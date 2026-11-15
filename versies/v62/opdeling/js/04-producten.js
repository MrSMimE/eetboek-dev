  function hasWalk(dow) { return moveActs(dow).some(function (a) { return a.id === 'wandel'; }); }
  function moveList(dow, d) {
    var mv = d.move || {}, l = [];
    if (mv.efiets) l.push('Elektrisch fietsen' + (mv.efietsTxt ? ': ' + mv.efietsTxt : ''));
    if (mv.blokje) l.push('Blokje om');
    if (mv.fiets) l.push('Elektrisch fietsen: ' + mv.fiets);
    moveActs(dow).forEach(function (a) { if (mv[a.id]) l.push(a.t + ': ' + mv[a.id]); });
    if (mv.wandel && !hasWalk(dow)) l.push('Wandelen, 30 minuten: ' + mv.wandel);
    return l;
  }
  function moveChips(dow, d) {
    var l = moveList(dow, d);
    if (d.steps) l = l.concat(['Stappen: ± ' + d.steps]);
    if (d.moveNote) l.push(d.moveNote);
    return chipsOf(l);
  }
  function avExtraList(d) {
    var a = d.avExtra || [], l = [];
    if (a.rauwkost) l.push('met rauwkost erbij');
    if (a.fruit) l.push('met fruit erbij');
    return l;
  }
  function avItems() {
    return [{ c: '', n: 'Kleine maaltijd', k: 600, d: '' }, { c: '', n: 'Normale maaltijd', k: 800, d: '' },
      { c: '', n: 'Zwaardere maaltijd / Uit eten', k: 1000, d: '' }, { c: '', n: 'Nog te schatten', k: null, d: '' }];
  }
  function itemsOf(gk) { return gk === 'AV' ? avItems() : G[gk].items; }

  // ---- datum
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtId(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function startOfWeek(d) { return addDays(d, -((d.getDay() - 5 + 7) % 7)); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function short(d) { return d.getDate() + ' ' + MON[d.getMonth()]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // ---- namen op het scherm (opgeslagen gegevens blijven zoals ze waren)
  function stripK(n) {
    var s = String(n).replace(/[,\s]*[(±]*\s*\d+([.,]\d+)?\s*kcal\)?/gi, '').replace(/^[,\s]+|[,\s]+$/g, '');
    return s || 'Eigen keuze';
  }
  function nameFor(e, forText) {
    var n = e.name;
    if (n === 'Avondeten') n = e.k === 600 ? 'Kleine maaltijd' : e.k === 800 ? 'Normale maaltijd' : e.k === 1000 ? 'Zwaardere maaltijd / Uit eten' : 'Avondeten';
    if (forText) return n;
    var m = /^Eigen keuze ± (\d+)$/.exec(n);
    if (m) n = 'Eigen keuze, ' + (SW[m[1]] || 'middel').toLowerCase();
    if (e.exact) n = stripK(n);
    return n;
  }
  function label(e) { return nameFor(e, false); }

  // ---- staat
  var todayId = fmtId(new Date());
  function vandaagId() { return fmtId(new Date()); } // v47.4.1: todayId is een string; als functie heet het vandaagId()
  var S = { start: startOfWeek(new Date()), days: {}, weights: {}, fav: [], lastBackup: null, outKind: '', open: {}, sheet: null, status: 'wachten', recipes: [], seeded: false, mig: [], tab: 'week', rec: null, paste: null, confirmDel: null, confirmClear: false, saveRec: false, recOpen: {}, othOpen: false, ingOpen: {}, grpOpen: {}, prijzen: [], prod: null, pp: null, fotoFor: '', zoom: {}, confirmProd: null, prq: '', plab: [], icat: {}, prSub: 'mijn', icatOpen: '', favAsk: '', fixedAsk: '', lijst: [], confirmLijst: false, freeCats: [], confirmFavDel: null, maxes: {}, rare: {}, rareD: {}, rg: false, rgConfirm: false, rgOpen: {}, cook: null, emoOpen: '', recMenu: '', vrRec: '', vrChecks: {}, oud: null, oudConfirm: false, verw: null, normaal: {} }; // v58: recMenu = ⋮-menuutje op het kaartje open; vrRec/vrChecks = Voorbereiden-blok in Kookhulp (sessie, niet bewaard) // v50.6: S.normaal = 5 weekdag-patronen { '1'..'5': [{slot,pid,amt,u}] } (zie 17-snel-invullen.js)
  // v48 Week-ronde: alles begint dicht (S.open/S.mopen worden niet gepersisteerd)
  S.freeU = 'g'; S.prodAsk = ''; S.pkUnit = '';
  var toastTimer = null;

  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 1600);
  }
  function dayDoc(id) {
    if (!S.days[id]) S.days[id] = { date: id, entries: [], notes: {} };
    if (!S.days[id].entries) S.days[id].entries = [];
    if (!S.days[id].notes) S.days[id].notes = {};
    if (!S.days[id].move) S.days[id].move = {};
    return S.days[id];
  }
  function stripTmpVelden(o) { // v57.5: _opz/_opzBusy zijn sessie-velden (opzoeken) — nooit naar opslag/reservekopie
    return JSON.parse(JSON.stringify(o, function (k, v) { return (k === '_opz' || k === '_opzBusy') ? undefined : v; }));
  }
  function tryStore() {
    try {
      localStorage.setItem(TESTVERSIE ? 'eetweek.v1.testversie' : 'eetweek.v1', JSON.stringify({ days: stripTmpVelden(S.days), weights: S.weights, fav: S.fav, lastBackup: S.lastBackup, hidePlan: true, recipes: stripTmpVelden(S.recipes), seeded: S.seeded, mig: S.mig, prijzen: S.prijzen, icat: S.icat, lijst: S.lijst, maxes: S.maxes, rare: S.rare, rareD: S.rareD || {}, normaal: S.normaal, cat: S.cat || {} })); // TESTVERSIE: nooit naar de echte eetweek.v1 schrijven
      stuurNaarAndroid();
      return true;
    } catch (e) { return false; }
  }
  function stuurNaarAndroid() {
    try {
      if (window.AndroidBridge) {
        if (typeof window.AndroidBridge.stuurRecepten === "function") {
          window.AndroidBridge.stuurRecepten(JSON.stringify(S.recipes || []));
        } else if (typeof window.AndroidBridge.syncRecipes === "function") {
          window.AndroidBridge.syncRecipes(JSON.stringify(S.recipes || []));
        }
      }
    } catch (e) { }
  }
  function persist() {
    if (tryStore()) S.status = 'ok';
    else { S.status = 'geen'; render(); toast('Opslaan lukt niet'); }
    if (TESTVERSIE) toast('🧪 Testversie — er wordt niets weggeschreven naar je echte data');
  }  function saveDay() { persist(); }

  // ---- render
