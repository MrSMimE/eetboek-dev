  function recEditorOpen(r) {
    // v45b.3: snel-vinkje + minuten meenemen (Marlijns vinkje overschrijft de gok van de app)
    S.ingq = '';
    S.rec = r ? { id: r.id, name: r.name, fixed: r.fixed, unit: r.unit, por: r.por, steps: r.steps || '', emoji: r.emoji || '', where: rWhere(r).slice(), ing: JSON.parse(JSON.stringify(r.ing)), snel: !!r.snel, snelMin: r.snelMin != null ? String(r.snelMin).replace('.', ',') : '' } : { id: null, name: '', steps: '', where: [], ing: [], snel: false, snelMin: '' };
    pushLayer(); document.documentElement.classList.add('lock'); $('recsheet').hidden = false; renderRec(true);
  }  function calcRecEditTotal() {
    var el = $('rectotalline'); if (!el || !S.rec) return;
    var R = S.rec;
    var porInp = $('recpor');
    var por = porInp ? num(porInp.value) : (R.por || 1);
    if (!por || por <= 0) por = 1;
    var tot = 0, hasUnk = false;
    (R.ing || []).forEach(function (i, idx) {
      var inp = document.querySelector('input[data-ia="' + idx + '"]');
      var a = inp ? num(inp.value) : num(i.a);
      if (a == null) a = 0;
      var kEl = document.querySelector('.irk[data-irk="' + idx + '"]'); // v58: per-ingrediënt kcal alléén hier in het bewerk-scherm
      var ik = null;
      if (i.p != null) {
        tot += a * i.p; ik = Math.round(a * i.p);
      } else {
        var p = findProd(i.n);
        if (p) {
          var k = ingKcalStrikt(p, a, i.u);
          if (k != null) { tot += k; ik = Math.round(k); } else hasUnk = true;
        } else {
          hasUnk = true;
        }
      }
      if (kEl) kEl.textContent = ik != null ? ik + ' kcal' : 'nog te schatten';
    });
    var totKcal = Math.round(tot);
    var txt = (totKcal === 0 && hasUnk) ? 'Totaal: nog te schatten (er telt nog niets mee)' : 'Totaal: ± ' + totKcal + ' kcal voor het hele recept' + (por > 1 ? ' (± ' + Math.round(totKcal / por) + ' per portie, bij ' + fmtN(por) + ' porties)' : '') + (hasUnk ? ' plus nog te schatten' : '');
    el.textContent = txt;
    // v48.4: live "= N g"-bevestiging onder elk ingrediënt met aantal-blokje
    (R.ing || []).forEach(function (i, idx) {
      var cv = document.querySelector('.recconv[data-rc="' + idx + '"]');
      if (!cv) return;
      var p2 = findProd(i.n);
      if (p2 && ingIsAntl(i, p2)) {
        var g = ingGram(i);
        cv.textContent = (g != null) ? '= ' + fmtN(Math.round(g * 10) / 10) + (p2.u === 'ml' ? ' ml' : ' g') : '';
      } else cv.textContent = '';
    });
  }
  // v45b.11: zoeken in alle ingrediëntlijsten tegelijk; dubbele namen worden één keer getoond
  // (eerst je eigen producten, dan de standaardlijst, dan de lijsten van de app).
  function recIngSearch(q) {
    var toks = normName(q).split(' ').filter(Boolean); if (!toks.length) return '';
    var seen = {}, out = [];
    function ok(n) { var ws = normName(n).split(' '); return toks.every(function (t) { return ws.some(function (w) { return w.indexOf(t) === 0; }); }); }
    function add(name, v, sub) { var k = normName(name); if (!k || seen[k] || !ok(name)) return; seen[k] = 1; var ws = k.split(' '); out.push({ name: name, v: v, sub: sub, hele: toks.every(function (t) { return ws.indexOf(t) >= 0; }) ? 0 : 1, i: out.length }); }
    S.prijzen.forEach(function (p) { add(p.n, 'p' + p.id, (antlWoord(p) ? antlWoord(p) : (p.u === 'stuk' ? stukNaam(p, 2) : p.u)) + (prodKcPer(p) == null && !antlWoord(p) ? ' · telt niet mee' : '') + ' · mijn producten'); });
    ING_DB.forEach(function (x, i) { add(x[0], 'd' + i, x[1]); });
    ['OP', 'LU', 'ND', 'NE', 'NF', 'NK'].forEach(function (gk) { if (G[gk]) G[gk].items.forEach(function (it, i) { if (!it.h) add(it.n, 'g' + gk + ':' + i, 'lijst van de app'); }); });
    out.sort(function (a, b) { return a.hele - b.hele || a.i - b.i; });
    if (!out.length) return '<p class="hint stat">Niets gevonden. Typ het hieronder bij "Of typ zelf een ingrediënt".</p>';
    return out.slice(0, 30).map(function (r) { return '<button class="opt" data-act="ingpick" data-v="' + esc(r.v) + '"><span class="on">' + esc(r.name) + '<small>' + esc(r.sub) + '</small></span></button>'; }).join('');
  }
  function renderRec(fresh) {
    var R = S.rec; if (!R) return;
    $('rt').textContent = R.id ? 'Recept bewerken' : 'Nieuw recept';
    var body = $('recbody'), keep = fresh ? 0 : body.scrollTop;
    S.recSec = S.recSec || {};
    // v50.7-fix (rustige vorm): alles in dichte secties; bovenaan de totaalregel, één sectie tegelijk open
    function sec(key, titel, binnen) {
      return '<details class="grp recsec" data-sec="' + key + '" style="margin-top:10px"' + (S.recSec[key] ? ' open' : '') + '><summary><span>' + titel + '</span></summary><div style="padding:0 4px 10px">' + binnen + '</div></details>';
    }
    var h = '<div id="rectotalline" style="background:var(--accent-soft, #f0f4f8);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:12px;font-weight:600;font-size:15px"></div>';
    h += sec('naam', '📝 Naam &amp; momenten', (function () { var h = '';
    h += '<h3>Naam</h3><input class="note" id="recname" type="text" maxlength="60" autocomplete="off" placeholder="Bijvoorbeeld: Mousse met kersen" value="' + esc(R.name) + '">';
    h += '<h3>Waar wil je dit recept zien?</h3><p class="hint" style="margin-top:0">Meerdere mag. Niets aangevinkt: bij elk moment. Bij andere momenten vind je hem onder Andere recepten.</p><div class="seg mvact">' +
      RGROUPS.map(function (g) { return '<button class="pill" data-act="recwhere" data-w="' + g.id + '" aria-pressed="' + (R.where.indexOf(g.id) >= 0) + '">' + esc(g.t) + '</button>'; }).join('') + '</div>';
 return h; })());
    h += sec('por', '🔢 Porties &amp; prijs', (function () { var h = '';
    h += '<h3>Prijs: hoeveel geeft deze lijst? (hoeft niet)</h3><p class="hint" style="margin-top:0">Alleen voor de prijs per portie of per stuk. Laat leeg als de lijst één portie is. De muffinlijst is bijvoorbeeld voor 12 muffins.</p><input class="note" id="recpor" type="text" inputmode="decimal" autocomplete="off" placeholder="Bijvoorbeeld 12" value="' + esc(R.por != null ? String(R.por).replace('.', ',') : '') + '" aria-label="Aantal porties of stuks van deze lijst">';
    if (R.id) h += '<div style="margin-top:10px">' + priceBox({ id: R.id, name: R.name, ing: R.ing, por: R.por, unit: R.unit }) + '</div>'; // v58: prijs (incl. per-ingrediënt) alléén in het bewerk-scherm, niet meer op het kaartje
 return h; })());
    h += sec('snel', '⚡ Snelheid (hoeft niet)', (function () { var h = '';
    // v45b.3: ⚡ Snel te maken — vinkje + optioneel minuten-veld (overschrijft de gok van de app)
    h += '<h3>Snelheid (hoeft niet)</h3><label class="vink" style="margin-top:0"><input type="checkbox" id="recsnel"' + (R.snel ? ' checked' : '') + '> ⚡ Snel te maken (weinig werk, wél koken/bakken mag)</label>' +
      '<div id="recsnelMinBlok"' + (R.snel ? '' : ' hidden') + ' style="margin-top:8px"><label for="recsnelMin">Hoeveel minuten ben je zelf bezig? (leeg = gok van de app)</label><input class="note" id="recsnelMin" type="text" inputmode="numeric" autocomplete="off" placeholder="Bijvoorbeeld 10" value="' + esc(R.snelMin || '') + '" aria-label="Minuten zelf bezig"></div>';
 return h; })());
    h += sec('ing', '🧂 Ingrediënten (' + R.ing.length + ' stuk)', (function () { var h = '';
    h += '<h3>Ingrediënten</h3>';
    if (!R.ing.length) h += '<p class="hint stat" style="margin-top:0">Nog niets toegevoegd.</p>';
R.ing.forEach(function (i, idx) {
      var pr = findProd(i.n), au = pr ? antlWoord(pr) : null, isAntl = !!(au && ingIsAntl(i, pr));
      h += '<div class="ingrow"><span class="inm">' + esc(i.n) + '<span class="iu"> · ' + esc(i.u === 'x' ? 'aantal' : i.u) + '</span></span>' +
        '<input data-ia="' + idx + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(String(i.a).replace('.', ',')) + '" aria-label="Hoeveelheid ' + esc(i.n) + '">' +
        '<span class="irk" data-irk="' + idx + '"></span>' + // v58: per-ingrediënt kcal in het bewerk-scherm (gevuld door calcRecEditTotal)
        '<button class="del" data-act="ingdel" data-i="' + idx + '" aria-label="Haal ' + esc(i.n) + ' weg">×</button></div>';
      // v48.4: klein "= N g"-regeltje ter bevestiging bij een ingrediënt met aantal-per-verpakking-blokje
      if (isAntl) h += '<p class="hint recconv" data-rc="' + idx + '" style="margin:2px 0 0"></p>';
    });
    
    if (R.fixed != null) h += '<p class="hint">Dit recept rekent met een vaste waarde. Hoeveelheden aanpassen verandert niets aan de berekening.</p>';
    h += '<h3>Ingrediënt kiezen</h3><p class="hint" style="margin-top:0">Zoek hieronder, of tik een groep open en tik op een ingrediënt om het toe te voegen. Het rekent per gram.</p>';
    h += '<input class="note" id="ingq" type="text" autocomplete="off" placeholder="Zoek een ingrediënt of product…" aria-label="Zoek een ingrediënt" value="' + esc(S.ingq || '') + '"><div id="ingqres">' + (S.ingq ? recIngSearch(S.ingq) : '') + '</div><div id="inggroups"' + (S.ingq ? ' hidden' : '') + '>';
    // v45c.6: rustig: laatste 4 producten direct, de lijsten achter 'Blader per categorie'; de twee standaardlijsten van de app samen in één kopje
    var ltr = S.prijzen.slice(-4).reverse();
    if (ltr.length) h += '<p class="hint zz" style="margin:10px 0 4px"><b>Laatst toegevoegd</b> — je nieuwste producten, tik erop om ze meteen te gebruiken.</p>' + ltr.map(function (p) { return '<button class="opt" data-act="ingpick" data-v="p' + esc(p.id) + '"><span class="on">' + esc(p.n) + '<small>' + esc(antlWoord(p) ? antlWoord(p) : (p.u === 'stuk' ? stukNaam(p, 2) : p.u)) + (prodKcPer(p) == null && !antlWoord(p) ? ' · telt niet mee' : '') + '</small></span></button>'; }).join('');
    h += '<div class="seg mvact"><button class="pill" data-act="ingblader" aria-pressed="' + !!S.ingBl + '">' + (S.ingBl ? '🙈 Verberg categorieën' : '📁 Blader per categorie') + '</button></div>';
    if (S.ingBl) {
    function optP(p) { return '<button class="opt" data-act="ingpick" data-v="p' + esc(p.id) + '"><span class="on">' + esc(p.n) + '<small>' + esc(antlWoord(p) ? antlWoord(p) : (p.u === 'stuk' ? stukNaam(p, 2) : p.u)) + (prodKcPer(p) == null && !antlWoord(p) ? ' · telt niet mee' : '') + '</small></span></button>'; }
  
