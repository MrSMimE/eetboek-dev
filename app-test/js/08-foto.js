  function ingTable(r, M) {
    var known = [], unknown = [];
    r.ing.forEach(function (i, idx) {
      var ikcal = null;
      if (i.p != null && num(i.a) != null) {
        ikcal = Math.round(num(i.a) * i.p * M);
      } else {
        var p = findProd(i.n);
        if (p) {
          var k = ingKcalStrikt(p, num(i.a) || 1, i.u);
          if (k != null) ikcal = Math.round(k * M);
        }
      }
      var ip = findProd(i.n);
      var ingName = cleanIngName(i.n);
      var isKruid = ingKruid(i);
      var row = { i: i, idx: idx, ikcal: ikcal, ip: ip, name: ingName, kruid: isKruid };
      if (ikcal != null || isKruid) known.push(row); else unknown.push(row);
    });
    function nameHtml(row) {
      if (row.ip) return '<button class="inglink" data-act="ingchoice" data-n="' + esc(row.name || row.i.n) + '" data-r="' + r.id + '" data-i="' + row.idx + '" data-p="' + row.ip.id + '">' + esc(row.name || row.i.n) + '</button>';
      if (row.name && !/^(zout|peper|water|kruiden|olie)$/i.test(row.name)) return '<button class="inglink noprod" data-act="ingchoice" data-n="' + esc(row.name) + '" data-r="' + r.id + '" data-i="' + row.idx + '">' + esc(row.name || row.i.n) + '</button>';
      return esc(row.name || row.i.n);
    }
    // v1744: zelfde opbouw als 'Nog te schatten' — naam bovenaan, eronder hoeveelheid · kcal (geen 3 kolommen)
    function rowHtml(row) {
      var kcalTxt = row.ikcal != null ? row.ikcal + ' kcal' : (row.kruid ? '0 kcal' : 'nog te schatten');
      return '<div class="ingrow-v" draggable="true" data-r="' + r.id + '" data-i="' + row.idx + '" title="Sleep naar een kopje of andere regel"><div class="ingrow-top"><span class="inm">' + nameHtml(row) + '</span>' + // v51.10: sleepbaar
        '<span class="ingmovebtns"><button class="ingup" data-act="ingup" data-r="' + r.id + '" data-i="' + row.idx + '" aria-label="' + esc(row.name || row.i.n) + ' naar vorige kopje" title="Naar vorige kopje">↑</button>' +
        '<button class="ingdown" data-act="ingdown" data-r="' + r.id + '" data-i="' + row.idx + '" aria-label="' + esc(row.name || row.i.n) + ' naar volgende kopje" title="Naar volgende kopje">↓</button></span></div>' +
        '<span class="iusub">' + esc(amtText(row.i, M)) + ' · ' + kcalTxt + (row.ip && row.ip.bron ? ' · (' + esc(row.ip.bron) + ')' : '') + '</span></div>'; // v55.2 PUNT 7a: bronlabel in recepten-rij;
    }
    function grpKey(row) { return String(row.i.g || '').trim(); }
    // v1744: kopjes als eigen inklapbare regels met pijltje; dicht = aantal + kcal van de groep
    function grpRows(rows) {
      var out = '', emitted = {};
      var gebruikt = [];
      rows.forEach(function (row) { var g = grpKey(row); if (g && gebruikt.indexOf(g) < 0) gebruikt.push(g); });
      var ordered = (r.kopjes || []).filter(function (g) { return gebruikt.indexOf(g) >= 0 || true; });
      gebruikt.forEach(function (g) { if (ordered.indexOf(g) < 0) ordered.push(g); }); // oude g-kopjes erbij
      var ungrouped = rows.filter(function (row) { return !grpKey(row); });
      ordered.forEach(function (g) { // wens 10 nov: kopje-koppen DIRECT bovenaan, ingrediënten daaronder
        if (emitted[g]) return;
        emitted[g] = 1;
        var grp = rows.filter(function (x) { return grpKey(x) === g; });
        var kcal = 0;
        grp.forEach(function (x) { if (x.ikcal != null) kcal += x.ikcal; });
        var openAttr = (S.grpOpen && S.grpOpen['kp:' + r.id + ':' + g] === false) ? '' : ' open';
        out += '<details class="grp ingdet" data-gg="kp:' + r.id + ':' + g + '" data-g="' + esc(g) + '"' + openAttr + '><summary><span class="ingdet-head"><span class="inggrpname">' + esc(g) + '</span>' +
          '<button class="ingrename" data-act="ingrename" data-r="' + r.id + '" data-g="' + esc(g) + '" aria-label="Kopje ' + esc(g) + ' hernoemen" title="Kopje aanpassen">✏️</button>' +
          '<span class="ingmovebtns" style="flex-direction:row"><button class="ingup" data-act="kopup" data-r="' + r.id + '" data-g="' + esc(g) + '" title="Kopje omhoog">↑</button><button class="ingdown" data-act="kopdown" data-r="' + r.id + '" data-g="' + esc(g) + '" title="Kopje omlaag">↓</button></span></span>' +
          '<span class="kop-stats">' + grp.length + (grp.length === 1 ? ' item' : ' items') + ' · ' + Math.round(kcal) + ' kcal</span></summary><div class="ingdet-in">' + grp.map(rowHtml).join('') + '</div></details>';
      });
      (r.kopjes || []).forEach(function (g) { // leeg kopje (nog zonder ingrediënten) wel tonen
        if (emitted[g]) return;
        emitted[g] = 1;
        var openAttr2 = (S.grpOpen && S.grpOpen['kp:' + r.id + ':' + g] === false) ? '' : ' open';
        out += '<details class="grp ingdet" data-gg="kp:' + r.id + ':' + g + '" data-g="' + esc(g) + '"' + openAttr2 + '><summary><span class="ingdet-head"><span class="inggrpname">' + esc(g) + '</span>' +
          '<button class="ingrename" data-act="ingrename" data-r="' + r.id + '" data-g="' + esc(g) + '" aria-label="Kopje ' + esc(g) + ' hernoemen" title="Kopje aanpassen">✏️</button>' +
          '<span class="ingmovebtns" style="flex-direction:row"><button class="ingup" data-act="kopup" data-r="' + r.id + '" data-g="' + esc(g) + '" title="Kopje omhoog">↑</button><button class="ingdown" data-act="kopdown" data-r="' + r.id + '" data-g="' + esc(g) + '" title="Kopje omlaag">↓</button></span></span>' +
          '<span class="kop-stats">0 items · 0 kcal</span></summary><div class="ingdet-in"></div></details>';
      });
      ungrouped.forEach(function (row) { out += rowHtml(row); }); // losse ingrediënten ná de kopjes
      return out;
    }
    var h = '<div class="inglist">' + grpRows(known.concat(unknown)) + '</div>'; // v1744: ook 'nog te schatten' gewoon in de lijst (met kopje mogelijk)
    return h;
  }
  // wens 10 nov: snelfilters op de eigen receptenlijst
  function recStepCount(r) { return String(r.steps || '').split('\n').filter(function (x) { return x.trim() && !/^(tip|bewaren|opwarmen)\s*:/i.test(x.trim()); }).length; }
  function recFilterMatch(f, r) {
    var n = normName((r.name || '') + ' ' + (r.ing || []).map(function (i) { return normName(i.n || i); }).join(' '));
    if (f === 'moe') return !!r.snel || recStepCount(r) <= 4;
    if (f === 'snel') return !!r.snel && recStepCount(r) <= 5;
    if (f === 'zacht') return /kwark|yoghurt|fruit|smoothie|salade|bessen|citroen/.test(n);
    if (f === 'ei') return /(^| )ei(eren|wit)?( |$)/.test(n) || /kaas|kip|tonijn|zalm|tofu/.test(n);
    return true;
  }
  var RECFILTERS = [ ['moe', '😴', 'Moe & weinig trek'], ['snel', '⚡', 'Snel in 1 pan'], ['zacht', '🧣', 'Zacht & fris'], ['ei', '🍳', 'Eiwitrijk met ei'] ]; // v54.1 (11 nov 23:35): was lokaal in renderRecipes — recListHtml() riep hem buiten die scope aan (ReferenceError, lijst renderde niet)
  // v58: korte kernregel voor op het kaartje — alleen aantal + kcal per portie/stuk (de lange Totaal-zin staat alléén in Recept bewerken)
  function recKernRegel(r, M) {
    M = M || 1;
    var por = r.por || 1, unit = r.unit || 'portie';
    var per = r.fixed != null ? Math.round(r.fixed * M) : Math.round(recKcal(r, M) / (por > 1 ? por : 1));
    if (por > 1) return fmtN(por) + ' ' + unit + 's · ± ' + per + ' kcal per ' + unit;
    if (r.unit) return '± ' + per + ' kcal per ' + r.unit;
    return '1 portie · ± ' + per + ' kcal';
  }
  function recCard(r, gid, M) { // v54.1 fix: was lokaal in renderRecipes — recListHtml() riep hem buiten die scope aan (card is not defined, lijst renderde niet bij typen)
      // v58: kaal kaartje — alleen naam + kernregel + drie gelijke knoppen + ⋮-menuutje rechtsboven. Totaal-zin, per-ingrediënt kcal en prijs staan alléén in Recept bewerken (⋮ → Bewerken); ingrediënten-lijst staat in Kookhulp → Voorbereiden
      var key = gid + ':' + r.id;
      var menuOpen = S.recMenu === r.id;
      // v58.3: kaartje écht dicht — dicht ALLEEN emoji+naam; na tik open: kernregel + 3 knoppen + ⋮ (zoals de kaartjes vroeger)
      return '<details class="rcard" data-rk="' + esc(key) + '" style="position:relative"' + (S.recOpen[key] ? ' open' : '') + '>' +
        '<summary class="rname">' + esc(recEmoji(r) + ' ' + r.name) + '</summary>' +
        '<div class="rcardhead"><span class="hint small" style="font-weight:400;margin:0;color:var(--muted);flex:1;min-width:0">' + esc(recKernRegel(r, M)) + '</span>' +
        '<button class="pill" data-act="recmenu" data-r="' + r.id + '" aria-label="Menu voor ' + esc(r.name) + '" aria-expanded="' + menuOpen + '" style="flex:none">⋮</button></div>' +
        (menuOpen ? '<div class="rcmenu"><button class="pill" data-act="recedit" data-r="' + r.id + '">Bewerken</button><button class="pill" data-act="recgem" data-r="' + r.id + '">Aanpassen met Mistral</button><button class="pill" data-act="emo" data-r="' + r.id + '" aria-expanded="' + (S.emoOpen === r.id) + '">' + esc(recEmoji(r)) + ' Emoji wijzigen</button>' +
        (S.confirmDel === r.id ? '<button class="pill" data-act="recdel" data-r="' + r.id + '">Echt verwijderen?</button>' : '<button class="pill" data-act="recdel" data-r="' + r.id + '">Verwijderen</button>') + '</div>' : '') +
        (hasSteps(r) ? '<button class="btn" style="width:100%;margin-top:10px" data-act="cook" data-r="' + r.id + '">🍳 Start met koken</button>' : '') +
        '<div class="grid2" style="margin-top:8px"><button class="btn" data-act="recprep" data-r="' + r.id + '">🧺 Voorbereiden</button><button class="btn" data-act="reccopy" data-r="' + r.id + '">📋 Kopiëren</button></div>' +
        (S.emoOpen === r.id ? emoPalette(r) : '') + '</details>';
    }
    
  function renderRecipes() {
    var M = S.recMult || 1;
    var h = '<div class="rowx" style="margin-top:6px"><input id="recq" class="note" type="text" maxlength="80" autocomplete="off" placeholder="Recept of ingrediënt zoeken…" value="' + esc(S.recq || '') + '" aria-label="Recepten zoeken"></div>';
    // wens 10 nov: vier snelfilter-icoontjes direct onder de zoekbalk (geen rondje-i, filtert de eigen lijst)
    h += '<div class="chiprow" style="margin-top:8px" role="group" aria-label="Snel filteren">' + RECFILTERS.map(function (f) {
      return '<button class="fchip" type="button" data-act="recfilter" data-f="' + f[0] + '" aria-pressed="' + (S.recFilter === f[0]) + '" title="' + esc(f[2]) + '" aria-label="Filter: ' + esc(f[2]) + '">' + f[1] + '</button>';
    }).join('') + '</div>';
    // v50.7-fix (Ontwerp 1): de vier deuren samen achter één dicht "+ Recept erbij"-blok
    h += '<details class="grp" style="margin-top:10px"><summary><span>＋ Recept erbij</span></summary><div style="padding:0 4px 6px">' +
      '<button class="btn main" style="width:100%" data-act="recnew">Nieuw recept</button>' +
      '<button class="btn" style="width:100%;margin-top:8px" type="button" data-kaart-open="snelhulp">💡 3 ideeën uit mijn recepten</button>' +
      '<button class="btn" style="width:100%;margin-top:8px" data-act="pasteopen">Recept plakken of uit bestand</button>' +
      '</div></details>';
    h += '<div class="chiprow" style="margin-top:10px;align-items:center"><span class="hint" style="margin:0 6px 0 0">Portie</span>' + [1, 2, 3, 4].map(function (n) { return '<button class="fchip" data-act="recmult" data-v="' + n + '" aria-pressed="' + (M === n) + '">×' + n + '</button>'; }).join('') + '</div>' + (M > 1 ? '<p class="hint" style="margin-top:4px">Hoeveelheden in de lijsten hieronder zijn × ' + M + '. Wat al in je week staat, verandert niet.</p>' : '');
    // v50.7-fix (Ontwerp 1): alle momenten samen in ÉÉN dicht "Per moment"-blok (totaal-aantal zichtbaar);
    // daarbinnen per moment een eigen dicht blok, alleen als er minstens 1 recept in zit
    h += '<div id="reclist">' + recListHtml() + '</div>'; // v53.9: bij typen in #recq ververst alleen dit blok (focus blijft in het veld)
    $('recview').innerHTML = h;
  }  function recListHtml() {
    var h = ''; // v54.1 (11 nov 23:35): MOET de eerste regel zijn — zonder deze regel tekent de Recepten-tab nooit
    if (!S.recipes.length) return '<p class="hint stat">Je hebt nog geen recepten.</p>';
    var M = S.recMult || 1;
    var alle = S.recipes.filter(function (r) { return recipeMatches(r, S.recq); });
    if (S.recFilter) {
      var fdef = RECFILTERS.filter(function (f) { return f[0] === S.recFilter; })[0];
      alle = alle.filter(function (r) { return recFilterMatch(S.recFilter, r); });
      h += '<p class="hint zz" style="margin:8px 0 0">Filter: ' + esc(fdef ? fdef[2] : S.recFilter) + ' — tik op het icoontje om uit te zetten (' + alle.length + ')</p>';
    }
    if (!alle.length) return h + '<p class="hint zz">Geen recepten gevonden' + (S.recq ? " voor '" + esc(String(S.recq).trim()) + "'" : '') + '.</p>'; // v54.0: leeg zoekresultaat = nette melding; v57: filter-melding (h) blijft staan bij nul resultaten én zz-klasse (p.hint is standaard verborgen)
    var metMoment = alle.filter(function (r) { return rWhere(r).length; });
    if (metMoment.length) {
      h += '<details class="grp" data-gg="pm:all"' + (S.grpOpen['pm:all'] ? ' open' : '') + ' style="margin-top:10px"><summary><span>📁 Per moment</span><span class="gcnt">' + metMoment.length + '</span></summary><div style="padding:0 4px 6px">';
      var seenPm = {}; // v58.4: een recept met meerdere momenten staat in één groep (anders twee kaartjes met elk een start-knop, bv. Kwark-Fris)
      RGROUPS.forEach(function (g) {
        var list = metMoment.filter(function (r) { return rWhere(r).indexOf(g.id) >= 0 && !seenPm[r.id]; });
        list.forEach(function (r) { seenPm[r.id] = true; });
        if (!list.length) return;
        h += '<details class="grp" data-gg="pm:' + g.id + '"' + (S.grpOpen['pm:' + g.id] ? ' open' : '') + ' style="margin-top:8px"><summary><span>' + esc(g.t) + '</span><span class="gcnt">' + list.length + '</span></summary><div style="padding:0 4px 6px">' + list.map(function (r) { return recCard(r, g.id, M); }).join('') + '</div></details>';
      });
      h += '</div></details>';
    }
    // "Nog in te delen" staat altijd apart eronder, zolang er recepten zonder moment zijn
    var rest = alle.filter(function (r) { return !rWhere(r).length; });
    if (rest.length) h += '<details class="grp" data-gg="pm:rest"' + (S.grpOpen['pm:rest'] ? ' open' : '') + ' style="margin-top:10px"><summary><span>📦 Nog in te delen</span><span class="gcnt">' + rest.length + '</span></summary><div style="padding:0 4px 6px"><p class="hint" style="margin-top:0">Recepten zonder moment — kies bij Bewerken waar je ze wilt zien.</p>' + rest.map(function (r) { return recCard(r, 'none', M); }).join('') + '</div></details>';
    return h;    return h;
  }
