  function findItem(gk, prefix) {
    var items = G[gk].items;
    for (var i = 0; i < items.length; i++) if (items[i].n.indexOf(prefix) === 0) return { i: i, it: items[i] };
    return null;
  }  function plakItems() { return { full: findItem('NE', 'Plakje kipfilet'), half: findItem('NE', 'Half plakje') }; }

  // Heeft een oud moment (och, lm) nog iets? Dan blijft het zichtbaar.
  function slotHasData(d, slot) {
    if (!d) return false;
    return (d.entries || []).some(function (e) { return e.slot === slot; }) || !!(d.notes && d.notes[slot]) ||
      whyOf(d, slot).length > 0 || !!whyTextOf(d, slot) || !!photoOf(d, slot);
  }
  function momentsFor(dow, d, force) {
    var list = momentsBase(dow, d, force);
    list.forEach(function (m) { if (['och', 'ont', 'pz', 'av', 'okb', 'wont', 'wtus', 'opst'].indexOf(m.slot) < 0) m.g = m.g.concat(['NK']); });
    list.push({ slot: 'nacht', t: 'Nacht', p: 'na het slapengaan of midden in de nacht', g: ['LU', 'NE', 'ND', 'NF', 'NA', 'NK'] });
    list.push({ slot: 'move', t: 'Bewegen', p: '', g: [] });
    list.push({ slot: 'eod', t: 'Einde van de dag', p: 'hoeveel trek nog', g: [] });
    return list;
  }
  function momentsBase(dow, d, force) {
    var BD = ['ND', 'NE', 'NF', 'NA'], BE = ['NE', 'ND', 'NF', 'NA'], BA = ['NA', 'ND', 'NE', 'NF'];
    function keep(slot) { return true; } // v50: álles er weer in — het inklapsysteem (dagdelen) geeft de ruimte; "alleen bij iets" vervalt
    var av = { slot: 'av', t: 'Avondeten', p: '', plan: avPlan(dow), g: ['AV', 'NE', 'ND', 'NF', 'NA'] };
    var ab = { slot: 'ab', t: 'Avondblok', p: '', plan: 'tot ' + rgMax(dow, 'ab'), g: BA };
    var extra = { slot: 'extra', t: 'Extra, buiten het schema', p: '', g: ['LU'].concat(BD) };
    function brood() {
      var l = [];
      l.push({ slot: 'ont', t: 'Ontbijt', p: '', plan: 'samen met Pauze de vaste ochtend', g: BE }); // v50: 'oude indeling'-momenten (och) eruit
      l.push({ slot: 'pz', t: 'Pauze', p: '', plan: 'samen met Ontbijt de vaste ochtend', g: BE });
      return l;
    }
    function lunch(tot, mdgT) {
      var l = [];
      l.push({ slot: 'lun', t: 'Lunch', p: '', plan: 'samen met Middag tot ' + tot, g: ['LU'].concat(BD) }); // v50: 'lm' (oude indeling) eruit
      if (keep('mdg')) l.push({ slot: 'mdg', t: mdgT || 'Middag', p: '', plan: 'samen met Lunch tot ' + tot, g: BD.slice() });
      return l;
    }
    if (dow === 1 || dow === 3 || dow === 4) return brood().concat([{ slot: 'kl', t: 'Kleine lunch', p: '', g: BE }, { slot: 'mid', t: 'Middag', p: '', plan: 'tot ' + rgMax(dow, 'mid'), g: BD }, av, ab, extra]);
    if (dow === 2) return brood().concat(lunch(rgMax(2, 'lm')), [av, ab, extra]);
    if (dow === 5) return brood().concat(lunch(rgMax(5, 'lm'), 'Iets voor het sporten'), [{ slot: 'sport', t: 'Na het sporten', p: '', plan: 'tot ' + rgMax(5, 'sport'), g: BD }], keep('ovb') ? [{ slot: 'ovb', t: 'Overbrugging', p: '', plan: 'alleen bij trek, tot ' + rgMax(5, 'ovb'), g: BD }] : [], [av, ab, extra]); // v50: op vrijdag heet Middag 'Iets voor het sporten'
    var ochtend = [];
    ochtend.push({ slot: 'wont', t: 'Ontbijt', p: '', plan: 'samen met Tussendoor ochtend tot ' + rgMax(dow, 'okb'), g: BE }); // v50: 'okb' (oude indeling) eruit
    if (keep('wtus')) ochtend.push({ slot: 'wtus', t: 'Tussendoor ochtend', p: '', plan: 'samen met Ontbijt tot ' + rgMax(dow, 'okb'), g: BE });
    return ochtend.concat(lunch(rgMax(dow, 'lm')), [av, ab, extra]);
  }
  // Bewegen: lijstje om aan te tikken. Vrijdag houdt de sportoefeningen met Gedaan / Deels / Niet.
  var MOVE_PICKS = [{ id: 'efiets', t: 'Elektrisch fietsen' }, { id: 'blokje', t: 'Blokje om', d: 'hoeft niet' }];
  // Optionele momenten: staan verborgen tot er iets in staat of ze op de knop tikt.
  var OPTL = [
    { slot: 'wtus', after: 'wont', dows: { 6: 'Iets tussendoor', 0: 'Iets tussendoor' } },
    { slot: 'mdg', after: 'lun', dows: { 2: 'Iets in de middag', 5: 'Iets voor het sporten', 6: 'Iets in de middag', 0: 'Iets in de middag' } },
    { slot: 'ovb', after: 'sport', dows: { 5: 'Iets voor het avondeten' } }
  ];
  function optButtons(dow, list, id) {
    var h = '';
    OPTL.forEach(function (o) {
      if (!o.dows[dow]) return;
      if (list.some(function (m) { return m.slot === o.slot; })) return;
      h += '<button class="optbtn" data-act="sheet" data-day="' + id + '" data-slot="' + o.slot + '">+ ' + esc(o.dows[dow]) + '</button>';
    });
    return h ? '<div class="optrow">' + h + '</div>' : '';
  }
  // Blok onderaan: automatisch voor vandaag, alleen als deze week open staat.
  function optBottom() {
    if (fmtId(S.start) !== fmtId(startOfWeek(new Date()))) return '';
    var p = todayId.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]), dow = dt.getDay();
    var b = optButtons(dow, momentsFor(dow, S.days[todayId]), todayId);
    return b ? '<h2 class="sec">Extra moment toevoegen</h2><p class="hint" style="margin:0 0 8px">Voor vandaag, ' + DOW[dow] + ' ' + short(dt) + '.</p>' + b : '';
  }
  function moveActs(dow) {
    var a = [];
    if (dow === 2 || dow === 4 || dow === 5) a.push({ id: 'wandel', t: 'Wandelen, 30 minuten', o: ['Gedaan', 'Deels', 'Niet'] });
    if (dow === 5) {
      a.push({ id: 'arm', t: 'Armoefeningen met de weerstandsband', o: ['Gedaan', 'Deels', 'Niet'] });
      a.push({ id: 'boks', t: 'Interval boksen en benen', o: ['Gedaan', 'Deels', 'Niet'] });
    }
    return a;
  }
  var TREK = ['Geen trek', 'Een beetje trek', 'Veel trek'];
  var WHY = ['Echte trek', 'Zin in iets', 'Gewoonte', 'Gezelligheid', 'Stress of spanning', 'Verveling', 'Moe of slecht geslapen', 'Uit eten of sociaal', 'Zo gepland'];
  var WHYSLOTS = ['extra', 'ab', 'okb', 'wont', 'wtus', 'ovb', 'nacht'];
  var NOPHOTO = ['move', 'eod'];
  function whyOf(d, slot) { return (d.why && d.why[slot]) || []; }
  function whyTextOf(d, slot) { return (d.whyText && d.whyText[slot]) || ''; }
  function whyChips(d, slot) {
    var l = whyOf(d, slot).slice();
    if (whyTextOf(d, slot)) l.push(whyTextOf(d, slot));
    return l.length ? '<span class="chips">' + l.map(function (x) { return '<span class="chip"><span class="nm">Waarom: ' + esc(x) + '</span></span>'; }).join('') + '</span>' : '';
  }
  function mp(m) { return m.p || ''; }
  function eodList(d) {
    var e = d.eod || {}, l = [];
    if (e.trek) l.push(e.trek);
    (e.why || []).forEach(function (w) { l.push('Waarom: ' + w); });
    return l;
  }
  function chipsOf(l) {
    return l.length ? '<span class="chips">' + l.map(function (x) { return '<span class="chip"><span class="nm">' + esc(x) + '</span></span>'; }).join('') + '</span>' : '';
  }  function showCode(c) { return c === 'A' || c === 'B' || c === 'C'; }
