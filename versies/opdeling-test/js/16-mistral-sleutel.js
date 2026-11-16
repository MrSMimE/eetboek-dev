  // ---- prijzen plakken
  function openPP() {
    S.pp = { text: '', err: '', prev: null };
    pushLayer(); document.documentElement.classList.add('lock'); $('ppsheet').hidden = false; renderPP();
  }
  function forceClosePP() { S.pp = null; $('ppsheet').hidden = true; document.documentElement.classList.remove('lock'); render(); }
  function syncPP() { var ta = $('pptxt'); if (ta && S.pp) S.pp.text = ta.value; }
  function parseContent(txt) {
    var m = /^(.*?)[,\s]+(\d+(?:[.,]\d+)?)\s*(kg|gram|gr|g|ml|cl|liter|l|stuks|stuk|st)\.?\s*$/i.exec(String(txt).trim());
    if (!m) return { n: String(txt).trim(), inh: null, u: null };
    var v = num(m[2]), u = m[3].toLowerCase();
    if (u === 'kg') { v *= 1000; u = 'g'; } else if (u === 'gr' || u === 'gram') u = 'g';
    else if (u === 'l' || u === 'liter') { v *= 1000; u = 'ml'; } else if (u === 'cl') { v *= 10; u = 'ml'; }
    else if (u === 'stuks' || u === 'stuk' || u === 'st') u = 'stuk';
    return { n: m[1].trim().replace(/[,\s]+$/, ''), inh: v, u: u, lit: (m[3].toLowerCase() === 'l' || m[3].toLowerCase() === 'liter') };
  }
  function parsePriceText(text) {
    var rows = [], errs = [];
    String(text || '').split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim(); if (!line) return;
      if (/^\*.*\*$/.test(line) || /^https?:\/\//i.test(line)) return;
      if (line.indexOf('|') < 0) {
        var msh = /^[•*·\-–]?\s*(?:\d+\s*[x×]\s+)?(.*\S)\s*\(\s*(\d+(?:[.,]\d+)?\s*(?:kg|gram|gr|g|ml|cl|liter|l|stuks|stuk|st))\s*\)\s*$/i.exec(line);
        if (msh) line = msh[1].replace(/[\s,]+$/, '') + ', ' + msh[2].replace(/\s+/g, ' ');
      }
      var opm = '', mo = /\s*\(([^)]*)\)\s*$/.exec(line);
      if (mo) { opm = mo[1]; line = line.slice(0, mo.index).trim(); }
      var parts = line.split('|').map(function (x) { return x.trim(); });
      var head = parts[0], pr = null, bon = null, bad = '', rest = parts.slice(1), wv = {};
      if (!rest.length) {
        var m0 = /^(.*\S)[,\s]+€?\s*(\d+[.,]\d{1,2})$/.exec(head);
        if (m0) { head = m0[1].replace(/[\s,€]+$/, ''); pr = num(m0[2]); }
      }
      var mrb = /bonus\D{0,15}(\d+[.,]\d{1,2})/i.exec(opm);
      if (mrb) bon = num(mrb[1]);
      rest.forEach(function (x) {
        if (!x) return;
        var mb = /^(?:ah\s+)?bonus\s*[:=]?\s*€?\s*(\d+(?:[.,]\d{1,2})?)$/i.exec(x);
        if (mb) { bon = num(mb[1]); return; }
        var mw = /^(eiwit|suikers?|verzadigd(?:\s*vet)?|zout|vezels?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*g?$/i.exec(x);
        if (mw) { var kw = mw[1].toLowerCase(); wv[kw.indexOf('eiwit') === 0 ? 'eiwit' : kw.indexOf('suiker') === 0 ? 'suiker' : kw.indexOf('verz') === 0 ? 'verz' : kw.indexOf('zout') === 0 ? 'zout' : 'vezel'] = num(mw[2]); return; }
        var m2 = /^(?:ah\s*)?€?\s*(\d+(?:[.,]\d{1,2})?)$/i.exec(x);
        if (m2) { pr = num(m2[1]); return; }
        bad = x;
      });
      var c = parseContent(head);
      if (bad) { errs.push({ line: line, msg: 'ik begrijp "' + bad + '" niet' }); return; }
      if (!c.n) { errs.push({ line: line, msg: 'er staat geen productnaam' }); return; }
      // keuring 7 nov: een kale naam is gewoon een product — kaartje met lege maat en lege prijs
      rows.push({ n: c.n.slice(0, 80), inh: c.inh, u: c.u, lit: !!c.lit, pr: pr, bon: bon, w: wv });
    });
    return { rows: rows, errs: errs };
  }
  document.addEventListener('input', function (ev) {
    var t = ev.target, k = t && t.getAttribute ? t.getAttribute('data-ppi') : null;
    if (t && t.getAttribute && S.pp && S.pp.prev && t.getAttribute('data-ppn') != null) { var rn = S.pp.prev.rows[+t.getAttribute('data-ppn')]; if (rn) rn.n = t.value.slice(0, 80); return; }
    if (k == null || !S.pp || !S.pp.prev) return;
    var r = S.pp.prev.rows[+k]; if (!r) return;
    var v = String(t.value).trim(), n = v ? num(v) : null;
    r.pr = (n != null && isFinite(n) && n >= 0) ? n : null;
  });
  // v45d.3: per regel direct kiezen wat er gebeurt (zoals bij Producten plakken)
  function ppKeuzeHtml(r, ri, exo) {
    var kz = r.keuze, ctl = '';
    var rd = function (val, titel, sub) { return '<label class="vink"><input type="radio" name="ppk' + ri + '" data-ppk="' + ri + '" value="' + esc(val) + '"' + (kz === val ? ' checked' : '') + '> <span>' + titel + (sub ? '<br><span class="hint" style="margin:0;font-weight:400">' + sub + '</span>' : '') + '</span></label>'; };
    if (exo) {
      kz = kz || 'aanvullen';
      ctl += rd('aanvullen', 'Bijwerken bij <b>' + esc(exo.n) + '</b>', 'Wat je eerder invulde blijft staan') + rd('apart', 'Nieuw product, apart houden', 'Geef het hieronder een andere naam') + rd('skip', 'Overslaan', 'Er wordt niets bewaard');
      if (kz === 'apart') ctl += '<input class="note" data-ppn="' + ri + '" type="text" maxlength="80" autocomplete="off" value="' + esc(r.n) + '" aria-label="Nieuwe naam van het product">';
    } else {
      kz = kz || 'nieuw';
      S.prijzen.filter(function (p) { return bijnaDezelfde(p.n, r.n); }).slice(0, 3).forEach(function (cp) { ctl += rd('p:' + cp.id, 'Mogelijk: <b>' + esc(cp.n) + '</b>', 'Dezelfde: wordt als bijnaam bijgezet en de prijs wordt hier ingevuld'); });
      ctl += rd('nieuw', 'Nieuw product', esc(r.n)) + rd('andere', 'Koppelen aan een ander product dat ik al heb', '');
      if (kz === 'andere') ctl += '<select class="note" data-ppsel="' + ri + '" aria-label="Kies een product om aan te koppelen"><option value="">Kies een product…</option>' +
        S.prijzen.slice().sort(function (x, y) { return x.n.localeCompare(y.n, 'nl'); }).map(function (p) { return '<option value="' + esc(p.id) + '"' + (r.koppel === p.id ? ' selected' : '') + '>' + esc(p.n) + '</option>'; }).join('') + '</select>';
      ctl += rd('skip', 'Overslaan', 'Er wordt niets bewaard');
    }
    return '<div style="margin:0 0 12px;padding-bottom:10px;border-bottom:1px solid var(--line)">' + ctl + '</div>';
  }
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute || !S.pp || !S.pp.prev) return;
    var k = t.getAttribute('data-ppk'), sl = t.getAttribute('data-ppsel');
    if (k != null) { var r = S.pp.prev.rows[+k]; if (r) { r.keuze = t.value; syncPP(); renderPP(); } return; }
    if (sl != null) { var r2 = S.pp.prev.rows[+sl]; if (r2) r2.koppel = t.value; }
  });
  function renderPP() {
    var P = S.pp; if (!P) return;
    var h = '<h3>Lijstje</h3><textarea class="note steps" id="pptxt" placeholder="Plak hier je lijstje, één product per regel" aria-label="Lijstje met prijzen">' + esc(P.text) + '</textarea>';
    h += '<p class="hint">Zo ziet een regel eruit: naam, inhoud, prijs en eventueel een bonusprijs.<br>Productnaam, 200 g | 1,23<br>Productnaam, 200 g, € 1,23<br>Productnaam, 200 g | 1,23 | bonus 0,99<br>Productnaam, 500 g | 1,23 | eiwit 12 | suikers 4,1 | verzadigd 0,1 | zout 0,1 | vezels 0<br>2x Productnaam (160 g)<br>(zo komt het uit een gedeeld lijstje van de AH-app, zonder prijs. De prijs vul je daarna in het voorbeeld in.)</p>';
    h += '<div class="seg mvact"><button class="pill" data-act="ppcheck">Controleer</button></div>';
    if (P.err) h += '<p class="hint" style="color:var(--fg)">' + esc(P.err) + '</p>';
    if (P.prev) {
      var rows = P.prev.rows;
      if (rows.length) {
        h += '<h3>Voorbeeld, zo komt het in je lijst</h3><div class="rcard">' + rows.map(function (r, ri) {
          var exo = S.prijzen.filter(function (p) { return normName(p.n) === normName(r.n); })[0], ex = !!exo;
          var wl = Object.keys(r.w || {}).length ? '<br>Etiket: ' + esc(W_FIELDS.filter(function (f) { return r.w[f[0]] != null; }).map(function (f) { return f[1].toLowerCase() + ' ' + fmtN(r.w[f[0]]); }).join(', ')) : '';
          return '<div class="prow" style="border-top:0"><span class="inm"><b>' + esc(r.n) + '</b><br><span class="hint" style="margin:0">' + (r.inh ? esc(fmtN(r.inh) + ' ' + (r.u === 'stuk' ? 'stuks' : r.u)) : 'inhoud ontbreekt, vul die later in bij Bewerken') + ' · ' + (ex ? 'wordt bijgewerkt' : 'nieuw') + wl + '</span></span><b>' + (r.pr != null ? esc(eur(r.pr)) : (exo && exo.pr != null ? 'blijft ' + esc(eur(exo.pr)) : '<input inputmode="decimal" data-ppi="' + ri + '" placeholder="prijs" aria-label="Prijs van ' + esc(r.n) + '" style="width:5.5em;text-align:right;font:inherit;padding:6px;border:1px solid #999;border-radius:8px">')) + (r.bon != null ? '<br>bonus ' + esc(eur(r.bon)) : '') + '</b></div>' + ppKeuzeHtml(r, ri, exo);
        }).join('') + '</div>';
        h += '<p class="hint">Een product dat er al staat krijgt alleen wat je hier opgeeft; wat je eerder invulde blijft staan. Een prijs die je hier nog niet weet, kun je later invullen bij het product; zonder prijs telt het product niet mee in de receptprijs.</p><div class="btns"><button class="btn main" data-act="ppsave">Bewaar ' + rows.length + (rows.length === 1 ? ' product' : ' producten') + '</button></div>';
      }
      if (P.prev.errs.length) h += '<h3>Deze regels kan ik niet lezen</h3>' + P.prev.errs.map(function (e) { return '<p class="hint" style="margin:4px 0">' + esc(e.line) + '<br>→ ' + esc(e.msg) + '</p>'; }).join('');
    }
    $('ppbody').innerHTML = h;
  }
  function ppCheck() {
    syncPP(); var P = S.pp; if (!P) return;
    if (!(P.text || '').trim()) { P.err = 'Plak eerst een lijstje.'; P.prev = null; renderPP(); return; }
    var res = parsePriceText(P.text);
    if (!res.rows.length && !res.errs.length) { P.err = 'Ik vind geen regels.'; P.prev = null; }
    else { P.err = ''; P.prev = res; }
    renderPP();
  }
  function ppSave() {
    var P = S.pp; if (!P || !P.prev || !P.prev.rows.length) return;
    // v45d.3: controle voor het bewaren
    for (var vi = 0; vi < P.prev.rows.length; vi++) {
      var vr = P.prev.rows[vi], kz0 = vr.keuze || '';
      if (kz0 === 'skip') continue;
      if ((kz0 === 'andere' && !prodById(vr.koppel))) { toast('Kies bij "' + vr.n + '" een product om aan te koppelen'); return; }
      if (kz0 === 'apart' && (!String(vr.n).trim() || S.prijzen.some(function (p) { return normName(p.n) === normName(vr.n); }))) { toast('Geef "' + vr.n + '" een andere naam om het apart te houden'); return; }
    }
    var before = JSON.stringify(S.prijzen), n = 0;
    P.prev.rows.forEach(function (r) {
      var kz = r.keuze || '';
      if (kz === 'skip') return;
      var ex = null;
      if (kz === 'apart') ex = null;
      else if (kz.indexOf('p:') === 0 || kz === 'andere') {
        ex = prodById(kz === 'andere' ? r.koppel : kz.slice(2));
        if (ex && prodKeys(ex).indexOf(normName(r.n)) < 0 && (ex.alias || []).length < 10) ex.alias = (ex.alias || []).concat([r.n]);
      } else S.prijzen.forEach(function (p) { if (normName(p.n) === normName(r.n)) ex = p; });
      if (ex) {
        if (r.pr != null) ex.pr = r.pr; if (r.bon != null) ex.bon = r.bon; if (r.inh) { ex.inh = r.inh; ex.u = r.u; }
        if (!ex.w) ex.w = {}; Object.keys(r.w || {}).forEach(function (k) { ex.w[k] = r.w[k]; });
      }
      else S.prijzen.push({ id: uid(), n: r.n, u: r.u || 'g', lit: !!(r.lit && r.u === 'ml'), inh: r.inh || null, pr: r.pr, bon: r.bon, alias: [], w: JSON.parse(JSON.stringify(r.w || {})), foto: '', cat: guessCats(r.n), lab: [], labx: [] });
      n++;
    });
    if (!tryStore()) { S.prijzen = JSON.parse(before); toast('Opslaan lukt niet'); return; }
    S.status = 'ok'; toast(n + (n === 1 ? ' product bewaard' : ' producten bewaard')); forceClosePP();
  }
  function pricesText() {
    return S.prijzen.map(function (p) {
      var s = p.n + (p.inh ? ', ' + fmtN(p.inh) + ' ' + (p.u === 'stuk' ? 'stuks' : p.u) : '');
      if (p.pr != null) s += ' | ' + p2(p.pr);
      if (p.bon != null) s += ' | bonus ' + p2(p.bon);
      var wn = { eiwit: 'eiwit', suiker: 'suikers', verz: 'verzadigd', zout: 'zout', vezel: 'vezels' };
      Object.keys(wn).forEach(function (k) { if (p.w && p.w[k] != null) s += ' | ' + wn[k] + ' ' + fmtN(p.w[k]); });
      return s;
    }).join('\n');
  }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act');
    if (act !== 'favdel') S.confirmFavDel = null;
    if (act === 'prodnew') prodOpen(null);
    else if (act === 'ingkop') { // v1744: kopje kiezen/wijzigen in kijkscherm
      var kr2 = +el.getAttribute('data-i'), rr2 = el.getAttribute('data-r');
      var recK = S.recipes.filter(function (x) { return x.id === rr2; })[0];
      var rowEl = el.closest('.ingrow-v');
      var prev = rowEl && rowEl.nextElementSibling;
      if (prev && prev.classList && prev.classList.contains('ingkoppick')) { prev.remove(); return; }
      document.querySelectorAll('.ingkoppick').forEach(function (p) { p.remove(); });
      if (!recK || !recK.ing[kr2] || !rowEl) return;
      var kopjes2 = [];
      recK.ing.forEach(function (x) { var g = String(x.g || '').trim(); if (g && kopjes2.indexOf(g) < 0) kopjes2.push(g); });
      var pk2 = document.createElement('div');
      pk2.className = 'ingkoppick ingmovepick';
      pk2.innerHTML = '<p class="hint" style="margin:0 0 6px">Kopje voor ' + esc(recK.ing[kr2].n) + ':</p><div class="seg" style="flex-wrap:wrap">' +
        kopjes2.map(function (g) { return '<button class="pill" data-act="ingkopick" data-r="' + rr2 + '" data-i="' + kr2 + '" data-g="' + esc(g) + '">' + esc(g) + '</button>'; }).join('') +
        '<button class="pill" data-act="ingkopick" data-r="' + rr2 + '" data-i="' + kr2 + '" data-g="">Geen kopje</button>' +
        '<span style="display:inline-flex;gap:4px;align-items:center"><input class="note" id="ingkopnew" type="text" maxlength="30" placeholder="Nieuw kopje…" style="width:120px"><button class="pill" data-act="ingkopnew" data-r="' + rr2 + '" data-i="' + kr2 + '">OK</button></span></div>';
      rowEl.parentElement.insertBefore(pk2, rowEl.nextSibling);
    }
    else if (act === 'ingkopick') {
      var kpR = el.getAttribute('data-r'), kpI = +el.getAttribute('data-i'), kpG = el.getAttribute('data-g');
      var recK2 = S.recipes.filter(function (x) { return x.id === kpR; })[0];
      if (recK2 && recK2.ing[kpI]) { if (kpG) recK2.ing[kpI].g = kpG; else delete recK2.ing[kpI].g; persist(); renderRecipes(); }
    }
    else if (act === 'ingkopnew') {
      var nwI = document.getElementById('ingkopnew');
      var nv2 = nwI ? nwI.value.trim() : '';
      var knR = el.getAttribute('data-r'), knI = +el.getAttribute('data-i');
      var recK3 = S.recipes.filter(function (x) { return x.id === knR; })[0];
      if (recK3 && recK3.ing[knI] && nv2) { recK3.ing[knI].g = nv2; persist(); renderRecipes(); }
    }
    else if (act === 'kopup' || act === 'kopdown') { // v1744: kopje zelf verplaatsen
      ev.preventDefault(); ev.stopPropagation();
      var kr3 = el.getAttribute('data-r'), kg = el.getAttribute('data-g');
      var recM = S.recipes.filter(function (x) { return x.id === kr3; })[0];
      if (recM && recM.kopjes) {
        var ki2 = recM.kopjes.indexOf(kg);
        var j = ki2 + (act === 'kopdown' ? 1 : -1);
        if (ki2 >= 0 && j >= 0 && j < recM.kopjes.length) { var t3 = recM.kopjes[j]; recM.kopjes[j] = recM.kopjes[ki2]; recM.kopjes[ki2] = t3; persist(); renderRecipes(); }
      }
    }
    else if (act === 'kopdel') { // v1744: kopje verwijderen (ingrediënten vallen terug naar geen kopje)
      var dr = el.getAttribute('data-r'), dg = el.getAttribute('data-g');
      var recD = S.recipes.filter(function (x) { return x.id === dr; })[0];
      if (recD) {
        recD.ing.forEach(function (x) { if (String(x.g || '').trim() === dg) delete x.g; });
        if (recD.kopjes) { var di2 = recD.kopjes.indexOf(dg); if (di2 >= 0) recD.kopjes.splice(di2, 1); }
        persist(); renderRecipes();
      }
    }
    else if (act === 'kopnew') { // v1744: nieuw kopje onder 'Ingrediënten'
      ev.preventDefault();
      document.querySelectorAll('.kopnewpick').forEach(function (p) { p.remove(); });
      var pk3 = document.createElement('div');
      pk3.className = 'ingmovepick kopnewpick';
      pk3.innerHTML = '<span style="display:inline-flex;gap:4px;align-items:center"><input class="note" id="kopnewname" type="text" maxlength="30" placeholder="Naam van het kopje…" style="width:160px"><button class="pill" data-act="kopnewok" data-r="' + el.getAttribute('data-r') + '">OK</button></span>';
      el.parentElement.appendChild(pk3);
      var ni = pk3.querySelector('#kopnewname'); ni.focus();
    }
    else if (act === 'kopnewok') {
      var kn3 = document.getElementById('kopnewname');
      var nm3 = kn3 ? kn3.value.trim() : '';
      var recN = S.recipes.filter(function (x) { return x.id === el.getAttribute('data-r'); })[0];
      if (recN && nm3) { recN.kopjes = recN.kopjes || []; if (recN.kopjes.indexOf(nm3) < 0) recN.kopjes.push(nm3); persist(); renderRecipes(); }
    }
    else if (act === 'ingup' || act === 'ingdown') { // v1744: pijltjes wisselen het KOPJE (vorige/volgende uit de beheerlijst)
      var rc = el.getAttribute('data-r'), ic = +el.getAttribute('data-i');
      var recC = S.recipes.filter(function (x) { return x.id === rc; })[0];
      if (recC && recC.ing[ic]) {
        var lijst = (recC.kopjes || []).slice();
        (recC.ing || []).forEach(function (x) { var g = String(x.g || '').trim(); if (g && lijst.indexOf(g) < 0) lijst.push(g); }); // oude g-kopjes erbij
        lijst.push(''); // '' = geen kopje
        var cur = String(recC.ing[ic].g || '').trim();
        var pos = lijst.indexOf(cur); if (pos < 0) pos = lijst.length - 1;
        var dir = (act === 'ingdown') ? 1 : -1;
        var nxt = lijst[(pos + dir + lijst.length) % lijst.length];
        if (nxt) recC.ing[ic].g = nxt; else delete recC.ing[ic].g;
        persist(); renderRecipes();
      }
    }
    else if (act === 'ingrename') { // v1744: kopje in kijkscherm hernoemen (inline veld)
      ev.preventDefault(); ev.stopPropagation();
      var rr = el.getAttribute('data-r'), rg = el.getAttribute('data-g') || ''; // puur uit data-g, nooit uit de tekst
      var sm = el.closest('summary');
      if (!sm || sm.querySelector('.ingrename-in')) return;
      var span = sm.querySelector('.inggrpname');
      var inp = document.createElement('input');
      inp.className = 'note ingrename-in'; inp.value = rg; inp.setAttribute('aria-label', 'Naam van het kopje');
      span.replaceWith(inp); inp.focus(); inp.select();
      inp.addEventListener('change', function () {
        var nv = inp.value.trim();
        var rec2 = S.recipes.filter(function (x) { return x.id === rr; })[0];
        if (rec2) { rec2.ing.forEach(function (x) { if (String(x.g || '').trim() === rg) { if (nv) x.g = nv; else delete x.g; } }); if (rec2.kopjes) { var ki = rec2.kopjes.indexOf(rg); if (ki >= 0) { if (nv) rec2.kopjes[ki] = nv; else rec2.kopjes.splice(ki, 1); } else if (nv) rec2.kopjes.push(nv); } persist(); renderRecipes(); }
      });
      inp.addEventListener('blur', function () { inp.dispatchEvent(new Event('change')); });
    }
    else if (act === 'prodmerge') openMergeModal(el.getAttribute('data-p'));
    else if (act === 'choosemerge') openMergeModal(mergeState.pAId, el.getAttribute('data-p'));
    else if (act === 'setsurv') { mergeState.survivorId = el.value; renderMergePreview(); }
    else if (act === 'domerge') executeProductMerge();
    else if (act === 'mergeclose') closeMergeModal();
    else if (act === 'undomerge') undoLastMerge();
    else if (act === 'prodedit' || act === 'prodopen') { var pe = prodById(el.getAttribute('data-p')); if (pe) prodOpen(pe); }
    else if (act === 'prodfroming') {
      var r = S.recipes.filter(function (x) { return x.id === el.getAttribute('data-r'); })[0], ig = r && r.ing[+el.getAttribute('data-i')];
      if (!ig) return;
      var nm = cleanIngName(ig.n);
      var exP = findProd(nm);
      openChoice({ name: nm || ig.n, prod: exP || null, ctx: 'rec', rid: r.id, idx: +el.getAttribute('data-i') });
    }
    else if (act === 'opzrec') { // v57: 🔎 opzoeken — pas na déze tik start opzoekRoute voor dit ene ingrediënt (eerst Plank/NEVO, zie opzoekRoute)
      var r9 = S.recipes.filter(function (x) { return x.id === el.getAttribute('data-r'); })[0], ig9 = r9 && r9.ing[+el.getAttribute('data-i')];
      if (!ig9 || ig9._opz || ig9._opzBusy) return;
      ig9._opzBusy = true; render();
      opzoekRoute(ig9.n).then(function (res) {
        if (!res) { ig9._opzBusy = false; render(); return; }
        ig9._opz = { bron: res.opgezocht && res.bron ? res.bron : '', naam: res.keuze || '', kcal100: res.kcal100, prijs: res.prijs };
        ig9._opzBusy = false; render();
      }).catch(function () { ig9._opzBusy = false; ig9._opz = { bron: '', naam: '' }; render(); });
    }
    else if (act === 'puurset') { // v47.4.5: twijfelgeval puur natuur — Marlijn kiest, de app onthoudt het per product
      var puP = prodById(el.getAttribute('data-p'));
      if (puP) { puP.puur = el.getAttribute('data-v'); persist(); render(); toast(puP.puur === 'puur' ? 'Puur natuur: krijgt altijd de groene status' : 'Gewone controle: suikers en vezels gelden weer'); }
    }
    else if (act === 'prodclose' || act === 'ppclose') requestClose();
    else if (act === 'prodsave') { if (prodSave()) requestClose(); }
    else if (act === 'prddirect') {
      var dp = prodById(el.getAttribute('data-p'));
      if (dp) { dp.direct = !dp.direct; tryStore(); var dl = $('prlist'); if (dl) dl.innerHTML = prListHtml(); }
    }
    else if (act === 'prdkruid') {
      var kp = prodById(el.getAttribute('data-p'));
      if (kp) { kp.kruid = !kp.kruid; tryStore(); var kl = $('prlist'); if (kl) kl.innerHTML = prListHtml(); }
    }
    else if (act === 'screcrop') scRecrop();
    else if (act === 'prdthuis') {
      var tp = S.prijzen.filter(function (x) { return x.id === el.getAttribute('data-p'); })[0];
      if (tp) { tp.thuis = !tp.thuis; tryStore(); var pl = $('prlist'); if (pl) pl.innerHTML = prListHtml(); var plj = $('prlijst'); if (plj) plj.innerHTML = prLijstHtml(); }
    }
    else if (act === 'icat') { var nk0 = el.getAttribute('data-n'); S.icatOpen = S.icatOpen === nk0 ? '' : nk0; renderSheet(false); }
    else if (act === 'icatset') {
      var nk1 = el.getAttribute('data-n'), cv1 = el.getAttribute('data-v');
      var cur1 = (S.icat[nk1] && S.icat[nk1].length ? S.icat[nk1] : defItemCats(nk1)).slice(), ix1 = cur1.indexOf(cv1);
      if (ix1 >= 0) { if (cur1.length === 1) { toast('Kies minstens 1 categorie'); return; } cur1.splice(ix1, 1); }
      else { if (cur1.length >= 3) { toast('Maximaal 3 categorieën'); return; } cur1.push(cv1); }
      var def1 = defItemCats(nk1);
      if (cur1.length === def1.length && cur1.every(function (x) { return def1.indexOf(x) >= 0; })) delete S.icat[nk1]; else S.icat[nk1] = cur1;
      persist(); renderSheet(false);
    }
    else if (act === 'icatdef') { delete S.icat[el.getAttribute('data-n')]; persist(); renderSheet(false); }
    else if (act === 'prfromrec') openPFR();
    else if (act === 'pfrsave') pfrSave();
    else if (act === 'recfilter') { var rf = el.getAttribute('data-f'); S.recFilter = (S.recFilter === rf) ? '' : rf; render(); } // wens 10 nov: snelfilter-icoontjes Recepten-tab
    else if (act === 'recmult') { S.recMult = parseInt(el.getAttribute('data-v'), 10) || 1; renderRecipes(); }
    else if (act === 'ladd') { var lp = prodById(el.getAttribute('data-p')); if (lp) { var lq = lijstAdd(lp.id, lp.n); toast(lq === 1 ? 'Op je lijstje' : 'Nu ' + lq + '× op je lijstje'); renderPrijzen(); } }
    else if (act === 'lfree') {
      var ln = $('lfree'), lv = ln ? ln.value.trim() : ''; if (!lv) { toast('Typ eerst wat'); return; }
      var lpp = findProd(lv); lijstAdd(lpp ? lpp.id : '', lpp ? lpp.n : lv); S.confirmLijst = false; renderPrijzen();
    }
    else if (act === 'lchk') { var l1 = S.lijst.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]; if (l1) { l1.done = !l1.done; persist(); renderPrijzen(); } }
    else if (act === 'lplus') { var l2 = S.lijst.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]; if (l2) { l2.q = Math.min(99, l2.q + 1); persist(); renderPrijzen(); } }
    else if (act === 'lmin') {
      var l3 = S.lijst.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0];
      if (l3) { if (l3.q > 1) l3.q--; else { S.lijst = S.lijst.filter(function (x) { return x !== l3; }); toast('Van het lijstje gehaald'); } persist(); renderPrijzen(); }
    }
    else if (act === 'ldone') { S.lijst = S.lijst.filter(function (x) { return !x.done; }); persist(); renderPrijzen(); }
    else if (act === 'lweek') {
      var lw = lijstUitWeek(); persist(); renderPrijzen();
      toast(lw ? lw + (lw === 1 ? ' ingrediënt op het lijstje gezet' : ' ingrediënten op het lijstje gezet') : 'Geen ingrediënten gevonden in deze week');
    }
    else if (act === 'lclear') { if (S.confirmLijst) { S.lijst = []; S.confirmLijst = false; persist(); } else S.confirmLijst = true; renderPrijzen(); }
    else if (act === 'lcopy') {
      var op = S.lijst.filter(function (x) { return !x.done; }); if (!op.length) { toast(S.lijst.length ? 'Alles is afgevinkt' : 'Het lijstje is leeg'); return; }
      copyDirect('*Mijn boodschappenlijstje*\n' + op.map(function (x) { var i = lijstInfo(x), ih = inhTxt(i.p); return '• ' + x.q + 'x ' + i.n + (ih ? ' (' + ih + ')' : ''); }).join('\n'), 'lijst', 'Boodschappenlijstje', 'Houd de tekst ingedrukt en kies Kopiëren.');
    }
    else if (act === 'pcat') {
      if (S.prod) { var cv = el.getAttribute('data-v'), ci = S.prod.cat.indexOf(cv);
        if (ci >= 0) S.prod.cat.splice(ci, 1); else if (S.prod.cat.length >= 3) { toast('Maximaal 3 categorieën'); return; } else S.prod.cat.push(cv);
        renderProd(false); }
    }
    else if (act === 'plabp') {
      if (S.prod) { var lv = el.getAttribute('data-v'), on = labOn(S.prod, lv), au = autoLabs(S.prod.w).indexOf(lv) >= 0;
        S.prod.lab = S.prod.lab.filter(function (x) { return x !== lv; }); S.prod.labx = S.prod.labx.filter(function (x) { return x !== lv; });
        if (on) { if (au) S.prod.labx.push(lv); } else S.prod.lab.push(lv);
        renderProd(false); }
    }
    else if (act === 'plabf') {
      var fv = el.getAttribute('data-v'), fi = S.plab.indexOf(fv); if (fi >= 0) S.plab.splice(fi, 1); else S.plab.push(fv);
      renderPrijzen();
    }
    else if (act === 'pftoggle') { if (S.prod) { var pk2 = el.getAttribute('data-k'); S.prod[pk2] = !S.prod[pk2]; renderProd(false); } } // wens 10 nov: kenmerk-pill in het productformulier
    else if (act === 'produnit') { if (S.prod) { var uv = el.getAttribute('data-v'); function pnum2(v) { var x = num(String(v == null ? '' : v).replace('€', '')); return x != null && x >= 0 ? x : null; } // v47.3: kilo-pill (kg ↔ g met vlag)
      if (uv === 'kg') { S.prod.kilo = true; S.prod.lit = false; if (S.prod.u === 'g' && S.prod.inh) S.prod.inh = String(Math.round(pnum2(S.prod.inh) / 1000 * 1000) / 1000).replace('.', ','); S.prod.u = 'g'; }
      else { S.prod.kilo = false; S.prod.lit = (uv === 'l'); S.prod.u = (uv === 'l') ? 'ml' : uv; if (uv === 'g' && S.prod.inh) S.prod.inh = String(Math.round(pnum2(S.prod.inh) * 1000 * 1000) / 1000).replace('.', ','); }
      renderProd(false); } }
    else if (act === 'prodfoto') { S.fotoFor = el.getAttribute('data-p') || ''; $('prodfile').click(); }
    else if (act === 'prodfotodel') {
      var pid = el.getAttribute('data-p');
      if (!pid) { if (S.prod) { S.prod.foto = ''; renderProd(false); } return; }
      var pf = prodById(pid); if (pf) { pf.foto = ''; persist(); render(); toast('Foto weggehaald'); }
    }
    else if (act === 'fotozoom') { var zp = el.getAttribute('data-p'); S.zoom[zp] = !S.zoom[zp]; render(); }
    else if (act === 'prodsw') { if (S.prod) { S.prod.sw = el.getAttribute('data-v') || null; renderProd(false); } }
    else if (act === 'cpopen') { var ck = el.getAttribute('data-k'), cs = cpState(ck); cs.o = !cs.o; if (!cs.o) cs.g = null; cpRefresh(ck); }
    else if (act === 'cpgrp') { var ck2 = el.getAttribute('data-k'), cs2 = cpState(ck2), gv = el.getAttribute('data-v'); cs2.g = cs2.g === gv ? null : gv; cpRefresh(ck2); }
    else if (act === 'prodmeer') { S.prodMeer = !S.prodMeer; renderProd(false); }
    else if (act === 'freemeer') { var fm = $('freemore'); if (fm) fm.hidden = !fm.hidden; el.textContent = fm && !fm.hidden ? 'Minder opties' : 'Meer opties (gewicht per stuk, categorie)'; }
    else if (act === 'koppelklaar') koppelKlaar();
    else if (act === 'wkblader') { S.wkBl = !S.wkBl; renderSheet(false); }
    else if (act === 'ingblader') { S.ingBl = !S.ingBl; renderRec(false); }
    else if (act === 'prblader') { S.prBl = !S.prBl; S.prNw = false; renderPrijzen(); }
    else if (act === 'prnieuw') { S.prNw = !S.prNw; S.prBl = false; renderPrijzen(); }
    else if (act === 'prcatdel') { // v46.4: hele productcategorie verwijderen (dubbele tik = bevestiging)
      var pc = el.getAttribute('data-c');
      if (S.confirmProdCat === pc) { S.prijzen = S.prijzen.filter(function (x) { return catsOf(x).indexOf(pc) < 0; }); S.confirmProdCat = null; persist(); toast('Categorie verwijderd'); }
      else { S.confirmProdCat = pc; toast('Nog een keer tikken = echt verwijderen'); }
      render(); if (S.verw) renderVerw();
    }
    else if (act === 'lcatdel') { // v46.4: hele categorie van het boodschappenlijstje (dubbele tik)
      var lc = el.getAttribute('data-c');
      if (S.confirmLijstCat === lc) { S.lijst = S.lijst.filter(function (l) { return lijstInfo(l).cat !== lc; }); S.confirmLijstCat = null; persist(); toast('Categorie van het lijstje gehaald'); }
      else { S.confirmLijstCat = lc; toast('Nog een keer tikken = echt verwijderen'); }
      renderPrijzen(); if (S.verw) renderVerw(); if (typeof renderInst === 'function') renderInst();
    }
    else if (act === 'lclearall') { // v46.4: álle items van het lijstje in 1x (dubbele tik)
      if (S.confirmLijstAll) { S.lijst = []; S.confirmLijstAll = false; S.confirmLijst = false; persist(); toast('Lijstje leeg'); }
      else { S.confirmLijstAll = true; S.confirmLijst = false; toast('Nog een keer tikken = echt verwijderen'); }
      renderPrijzen(); if (S.verw) renderVerw(); if (typeof renderInst === 'function') renderInst();
    }
    else if (act === 'prdelall') { // v46.4: alle producten in één keer verwijderen (dubbele tik = bevestiging)
      if (S.confirmProdAll) { S.prijzen = []; S.lijst = S.lijst.filter(function (x) { return false; }); S.confirmProdAll = false; S.confirmProd = null; persist(); toast('Alle producten verwijderd'); }
      else { S.confirmProdAll = true; toast('Nog een keer tikken = echt verwijderen'); }
      render(); if (S.verw) renderVerw();
    }
    else if (act === 'proddel') {
      var dp = el.getAttribute('data-p');
      if (S.confirmProd === dp) { S.prijzen = S.prijzen.filter(function (x) { return x.id !== dp; }); S.confirmProd = null; persist(); toast('Product verwijderd'); }
      else S.confirmProd = dp;
      render();
    }
    else if (act === 'ppopen') openPP();
    else if (act === 'pjopen') openPJ();
    else if (act === 'pjclose') requestClose();
    else if (act === 'pjcheck') pjCheck();
    else if (act === 'pjpickfile') { syncPJ(); $('pjfile').click(); }
    else if (act === 'prpj') { openPJ(); } // keuring 8 nov: lijst plakken/bestand vanaf de Producten-tab
    else if (act === 'pjweg') {
      var pjS = S.pj;
      if (pjS && pjS.rows) { var pjI = +el.getAttribute('data-i'); if (pjI >= 0 && pjI < pjS.rows.length) { pjS.rows.splice(pjI, 1); renderPJ(); } }
    }
    else if (act === 'pjsave') pjSave();
    else if (act === 'ppcheck') ppCheck();
    else if (act === 'etikpick') { if (S.prod && !S.prod.busy) $('etikfiles').click(); }
    else if (act === 'livecheckform') { // v51: live check in productformulier (OFF/Checkjebon/Mistral)
      var inputEl = document.querySelector('#prodbody input[data-pf="n"]');
      var formName = String(inputEl ? inputEl.value : (S.prod && S.prod.n) || '').trim(); // live uit het veld
      if (!formName) { toast('Typ eerst hierboven een productnaam!'); return; }
      toast('⏳ Live databases doorzoeken...');
      opzoekRoute(formName).then(function (res) {
        if (!res || (res.kcal100 == null && res.prijs == null)) { S.prod.msg = 'Live check: niets direct gevonden voor "' + formName + '".'; renderProd(false); toast('Helaas niets direct gevonden.'); return; }
        if (res.kcal100 != null && (S.prod.kc == null || String(S.prod.kc).trim() === '')) S.prod.kc = String(res.kcal100).replace('.', ',');
        if (res.prijs != null && (S.prod.pr == null || String(S.prod.pr).trim() === '')) S.prod.pr = p2(res.prijs);
        if (res.w) { S.prod.w = S.prod.w || {}; W_FIELDS.forEach(function (f) { if (res.w[f[0]] != null && (S.prod.w[f[0]] == null || String(S.prod.w[f[0]]).trim() === '')) S.prod.w[f[0]] = String(res.w[f[0]]).replace('.', ','); }); }
        S.prodSec = S.prodSec || {}; S.prodSec['voeding'] = true; S.prodSec['prijs'] = true; S.prodSec['meer'] = true; // live resultaat meteen zichtbaar
        var bron = res.opgezocht && res.bron ? res.bron : 'live database';
        S.prod.msg = 'Live check "' + formName + '" — gevonden: ' + (res.keuze || 'niets direct') + ' (bron: ' + bron + '):' +
          (res.prijs != null ? ' prijs € ' + p2(res.prijs) + ';' : '') +
          (res.kcal100 != null ? ' ' + Math.round(res.kcal100) + ' kcal/100 g;' : '') + ' lege velden aangevuld; eigen waarden ongemoeid.';
        S.prod.kies = (res.kandidaten && res.kandidaten.length > 1) ? res.kandidaten : null;
        renderProd(false);
        toast('✓ Live data verwerkt in dit formulier!');
      }).catch(function () { S.prod.msg = 'Live check mislukt (geen verbinding?).'; renderProd(false); toast('Kon live data niet ophalen'); });
      return;
    }
    else if (act === 'kieskand') { // keurpunt 8 nov: kies-kaartje aangeklikt — bijpassende entry toepassen (alleen lege velden, eigen waarden blijven)
      var kd = el.getAttribute('data-doel'), ki2 = +el.getAttribute('data-k'), ii2 = +el.getAttribute('data-i');
      var tgt = null, lijst = null;
      if (kd === 'prod' && S.prod) { tgt = S.prod; lijst = S.prod.kies; }
      else if (kd === 'pj' && S.pj && S.pj.rows && S.pj.rows[ii2]) { tgt = S.pj.rows[ii2]; lijst = tgt.kies; }
      else if (kd === 'zeg' && S.zegVoorstel && (S.zegVoorstel.producten || [])[ii2]) { tgt = S.zegVoorstel.producten[ii2]; lijst = tgt.kies; }
      var kk = lijst && lijst[ki2];
      if (kk) {
        if (kd === 'prod') {
          if (kk.kcal100 != null && (tgt.kc == null || String(tgt.kc).trim() === '')) tgt.kc = String(kk.kcal100).replace('.', ',');
          if (kk.w) { tgt.w = tgt.w || {}; W_FIELDS.forEach(function (f) { if (kk.w[f[0]] != null && (tgt.w[f[0]] == null || String(tgt.w[f[0]]).trim() === '')) tgt.w[f[0]] = String(kk.w[f[0]]).replace('.', ','); }); }
          tgt.msg = 'Gekozen: ' + kk.naam + ' — ' + (kk.bron || 'Open Food Facts');
          tgt.kies = null; renderProd(false);
        } else if (kd === 'pj') {
          if (kk.kcal100 != null && tgt.kc == null) tgt.kc = kk.kcal100;
          if (kk.w) { tgt.w = tgt.w || {}; Object.keys(kk.w).forEach(function (k2) { if (tgt.w[k2] == null) tgt.w[k2] = kk.w[k2]; }); }
          tgt._keuze = kk.naam + ' — Open Food Facts'; tgt.kies = null; renderPJ();
        } else {
          if (kk.kcal100 != null) tgt.kcal100 = kk.kcal100;
          if (kk.w) tgt.w = Object.assign({}, tgt.w || {}, kk.w);
          tgt.aiKeuze = kk.naam + ' — Open Food Facts'; tgt.opgezocht = true; tgt.bron = kk.bron || ''; tgt.kies = null;
          zegLiveUpdate(tgt); render();
        }
      }
      return;
    }
    else if (act === 'prodkc') { S.prodKc = !S.prodKc; renderProd(false); }
    else if (act === 'prodaantal') { S.prodAantal = !S.prodAantal; renderProd(false); } // v48.2: aantal-per-verpakking blok open/dicht
    else if (act === 'scopen') openSC();
    else if (act === 'scclose') requestClose();
    else if (act === 'scpick') { if (S.sc && !S.sc.busy) $('scfile').click(); }
    else if (act === 'scrm') { var sri = +el.getAttribute('data-i'); if (S.sc && !S.sc.busy) { try { URL.revokeObjectURL(scUrls[sri]); } catch (e) { } scFiles.splice(sri, 1); scUrls.splice(sri, 1); if (sri < (S.sc.cropN || 0)) S.sc.cropN--; S.sc.cropDone = scFiles.length > 0 && (S.sc.cropN || 0) >= scFiles.length; renderSC(); } }
    else if (act === 'scone') { if (S.sc) { S.sc.one = !S.sc.one; renderSC(); } }
    else if (act === 'scgo') scLees();
    else if (act === 'scaan') { var sai = S.sc && S.sc.items[+el.getAttribute('data-i')]; if (sai) { sai.aan = !sai.aan; renderSC(); } }
    else if (act === 'scitdel') { if (S.sc && S.sc.items) { var xi = +el.getAttribute('data-i'); if (confirm('Dit product uit de leeslijst verwijderen?')) { S.sc.items.splice(xi, 1); toast('Verwijderd uit de lijst'); renderSC(); } } }
    else if (act === 'sczoek') { var szi = S.sc && S.sc.items[+el.getAttribute('data-i')]; if (szi) { szi.zoek = true; szi.pid = null; renderSC(); } }
    else if (act === 'scunit') { var sui = S.sc && S.sc.items[+el.getAttribute('data-i')]; if (sui) { var suv = el.getAttribute('data-v'), sou = sui.u; // v46.1: liter; v47.3: kilo
      if (suv === 'l' && sou === 'ml' && sui.inh) sui.inh = Math.round(sui.inh / 1000 * 1000) / 1000;
      else if (suv === 'ml' && sou === 'l' && sui.inh) sui.inh = Math.round(sui.inh * 1000 * 1000) / 1000;
      if (suv === 'kg') { sui.kilo = true; if (sui.u === 'g' && sui.inh) sui.inh = Math.round(sui.inh / 1000 * 1000) / 1000; sui.u = 'g'; }
      else { if (sui.kilo && suv === 'g' && sui.inh) sui.inh = Math.round(sui.inh * 1000 * 1000) / 1000; sui.kilo = false; sui.u = suv; }
      renderSC(); } }
    else if (act === 'scsave') scSave();
    else if (act === 'scnone') { if (S.sc) { S.sc.items = []; S.sc.msg = 'Niets bewaard.'; renderSC(); } }
    else if (act === 'scmode') { if (S.sc && !S.sc.busy) { S.sc.mode = el.getAttribute('data-v'); S.sc.items = []; S.sc.bon = []; S.sc.msg = ''; renderSC(); } }
    else if (act === 'scbonaan') { var bai = S.sc && S.sc.bon[+el.getAttribute('data-i')]; if (bai) { bai.aan = !bai.aan; renderSC(); } }
    else if (act === 'scbondel') { if (S.sc && S.sc.bon) { var di = +el.getAttribute('data-i'); if (confirm('Deze bonregel verwijderen? Producten van anderen (bijv. van je vriend) kun je zo weghalen voordat je bewaart.')) { S.sc.bon.splice(di, 1); toast('Bonregel verwijderd'); renderSC(); } } }
    else if (act === 'scbonsave') bonSave();
    else if (act === 'sckorttoew') { // v46.3: persoonlijke korting handmatig toewijzen aan een productregel
      var ki = S.sc && S.sc.bon[+el.getAttribute('data-i')];
      var persK = S.sc ? S.sc.bon.filter(function (b) { return b.geenEten && b.pr != null && b.pr < 0 && !/^BONUS\s+\S/i.test(String(b.n||'').trim()) && !/^(MIJN AH|BONUSKAART|SPAAR|CARE|INLEG|STATIEGELD|HEFFING|KORTING)/i.test(String(b.n||'').trim()); }) : [];
      if (ki && persK.length) {
        var p = persK.length === 1 ? persK[0] : persK.find(function (b) { return ki.kortToeg && b.n === ki.kortToeg.n; }) || persK[0];
        if (ki.kortToeg && ki.kortToeg.n === p.n) { ki.kortToeg = null; toast('Korting niet toegewezen'); }
        else { S.sc.bon.forEach(function (b) { if (b !== ki) b.kortToeg = null; }); ki.kortToeg = { n: p.n, pr: p.pr }; toast('Korting ' + p.n + ' toegewezen aan ' + ki.n); }
        renderSC();
      }
    }
    else if (act === 'boncat') { var bci = S.sc && S.sc.bon[+el.getAttribute('data-i')]; if (bci) { var cv = el.getAttribute('data-v'); bci.cat = bci.cat || []; var cix = bci.cat.indexOf(cv); if (cix >= 0) bci.cat.splice(cix, 1); else if (bci.cat.length < 3) bci.cat.push(cv); renderSC(); } }
    else if (act === 'scropgo') scCropGo();
    else if (act === 'ppsave') ppSave();
    else if (act === 'prcopy') {
      if (!S.prijzen.length) { toast('Je hebt nog geen prijzen'); return; }
      copyDirect(pricesText(), 'prijzen', 'Mijn prijzen', 'Houd de tekst ingedrukt en kies Kopiëren.');
    }
  });
  document.addEventListener('change', function (ev) {
    if (!ev.target || ev.target.id !== 'prodfile') return;
    var f = ev.target.files && ev.target.files[0]; ev.target.value = '';
    if (!f) return;
    var tid = S.fotoFor;
    resizePhoto(f, function (url) {
      if (!url) { toast('Deze foto kon niet gelezen worden'); return; }
      if (!tid) { if (S.prod) { S.prod.foto = url; renderProd(false); toast('Foto toegevoegd. Tik op Opslaan om hem te bewaren.'); } return; }
      var p = prodById(tid); if (!p) return;
      var old = p.foto; p.foto = url;
      if (!tryStore()) { p.foto = old; toast('De foto past niet meer in het geheugen van de app'); }
      else { S.status = 'ok'; toast('Foto bewaard'); }
      render();
    }, 1400, 0.75);
  });

  function photoOf(d, slot) { return d.photos && d.photos[slot] ? d.photos[slot] : ''; }

  // v48 Week-ronde: rustig week-scherm. Alles begint dicht; één tik opent een dag,
  // nog een tik opent een moment. Één dag en één moment tegelijk open (dicht-geheugen:
  // S.open/S.mopen worden niet gepersisteerd, dus bij binnenkomst is alles dicht).
  // v53: horizontale rij dag-chips bovenin de Week (ma t/m zo) — tik = die dag open, andere dicht; geen stipjes, alleen 🙃 bij een rare dag
  function dayChipsHtml() {
    var h = '<div class="daychips">';
    for (var i = 0; i < 7; i++) {
      var date = addDays(S.start, i), id = fmtId(date), open = !!S.open[id];
      h += '<button class="pill dayhead daychip' + (open ? ' open' : '') + '" type="button" data-act="day" data-day="' + id + '" aria-expanded="' + open + '" aria-pressed="' + open + '" aria-label="' + esc(cap(DOW[date.getDay()]) + ' ' + short(date)) + (id === todayId ? ' (vandaag)' : '') + '">' +
        '<span class="dn">' + esc(DOW[date.getDay()].slice(0, 2)) + '</span>' +
        '<span class="dnum">' + date.getDate() + '</span>' +
        (id === todayId ? '<span class="vandaagdot" title="Vandaag"></span>' : '') +
        (dayIsRaar(id) ? '<span class="tag dtag">🙃</span>' : '') +
        '</button>'; // v53.5: dagnaam boven, dagnummer eronder, 🙃 op een eigen regel eronder
    }
    return h + '</div>';
  }
  // v53: moment-lijst van een dag (zonder Bewegen/Einde van de dag, zoals de rest van de Week)
  function zegMomentLijst(id) {
    var p = id.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    return eetMomenten(dt.getDay(), dayDoc(id));
  }
  // v53: standaard-moment = passend bij de tijd van de dag
  function zegMomentStandaard(id) {
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
  }
  function zegMomentActief(id) {
    var namen = zegMomentLijst(id).map(function (m) { return m.t; });
    if (S.zegMoment && namen.indexOf(S.zegMoment) >= 0) return S.zegMoment;
    return zegMomentStandaard(id);
  }
  // v53.1: vast zeg-kaartje bovenaan het Week-scherm (canvas v12) — zónder kies-flow; die opent via een notitie
  function zegHtml() {
    var id = zegDoelId();
    var ms = zegMomentLijst(id), mom = zegMomentActief(id);
    var h = '<details class="per zegblok" id="zegblok"' + (S.zegOpen ? ' open' : '') + '><summary>Zeg wat je at' +
      '<span class="zegmomwrap"><button class="zegmombtn" type="button" data-act="zegmomdd" aria-haspopup="listbox" aria-expanded="' + !!S.zegMomOpen + '">' + esc(mom) + ' ▾</button>' +
      (S.zegMomOpen ? '<span class="zegmomlist" role="listbox">' + ms.map(function (m) { return '<button type="button" role="option" data-act="zegmomentkies" data-t="' + esc(m.t) + '"' + (m.t === mom ? ' aria-selected="true"' : '') + '>' + esc(m.t) + '</button>'; }).join('') + '</span>' : '') +
      '</span></summary><div style="padding-bottom:10px">';
    h += '<input class="note" id="zegkaartin" type="text" maxlength="400" autocomplete="off" placeholder="Typ hier wat je at..." aria-label="Zeg wat je at" value="' + esc(S.zegIn || '') + '" style="width:100%">';
    // v55.1 (12 nov): leeg veld = geen knoppen; bij typen twee knoppen op één rij — 🕒 Later uitwerken (briefje) / 📝 Alleen tekst (blijvend tekstregeltje, geen kcal)
    h += '<div class="rowx" style="margin:8px 0 0;gap:8px">' +
      '<button class="btn" type="button" style="flex:1;min-width:0" data-act="zegbewaar" data-day="' + id + '"' + (S.zegTik ? '' : ' hidden') + '>🕒 Later uitwerken</button>' +
      '<button class="btn" type="button" style="flex:1;min-width:0" data-act="zegtekst" data-day="' + id + '"' + (S.zegTik ? '' : ' hidden') + '>📝 Alleen tekst</button></div>';
    h += '</div></details>';
    return h;
  }
  // Geen kcal-getallen in het Week-tab (die staan alleen in "Week in 1 oogopslag").
  function dayCard(date) {
    var id = fmtId(date), dow = date.getDay();
    var d = S.days[id] || { entries: [], notes: {} };
    var open = !!S.open[id];
    var h = '<section class="day' + (open ? ' open' : '') + '">';
    h += '<button class="dayhead" data-act="day" data-day="' + id + '" aria-expanded="' + open + '">' +
      '<span class="dn">' + cap(DOW[dow]) + '</span><span class="dd">' + short(date) + '</span>' + (dayIsRaar(id) ? '<span class="tag">🙃</span>' : '') + (d.theme ? '<span class="dth">' + esc(d.theme) + '</span>' : '') +
      (id === todayId ? '<span class="tag">Vandaag</span>' : '') +
      '<span class="chev"></span></button>';
    if (open) {
      h += '<div class="daybody">';
      // v54.1 (11 nov 23:35): géén uitwerk-blok meer bovenin de dag — het briefje uitwerken opent als sheet van onderen (werksheet)
      h += '<div class="rowx" style="margin:0 0 8px"><input class="note" type="text" maxlength="30" autocomplete="off" data-theme="' + id + '" placeholder="Thema van de dag, bijvoorbeeld Fietsdag" aria-label="Thema van de dag" value="' + esc(d.theme || '') + '"></div>';
      // per moment: ⚡ (patroon) en ⏪ (vorige week) staan rechts op elke moment-rij — zie momentCard
      var weekdag = dow >= 1 && dow <= 5;
      var pw = typeof prevWeekMomenten === 'function' ? prevWeekMomenten(id) : null;
      var flitsZin = weekdag && normaalVoor(dow).length; // 5 weekdag-patronen; leeg patroon = ⚡-knop verdwijnt
      var pat = weekdag ? normaalVoor(dow) : [];
      {
        var dagLeeg = !(d.entries || []).length;
        h += '<div class="pillenrow">';
        h += '<button class="dagpill" type="button" data-act="raredag" data-day="' + id + '" aria-label="Dag als raar markeren" title="Dag als raar markeren" aria-pressed="' + dayIsRaar(id) + '">🙃</button>';
        if (flitsZin && dagLeeg) h += '<button class="dagpill" type="button" data-act="normdagvul" data-day="' + id + '" aria-label="Zelfde als normaal" title="Zelfde als normaal">⚡</button>'; // grote ⚡-knop op een lége dag blijft staan
        h += '</div>';
      }
      // v50 inklapsysteem (uit testversies/inlak-dagdelen): momenten gegroepeerd in dagdelen,
      // één dagdeel tegelijk open, daarbinnen één moment; Beweging en Einde van de dag niet in het weekoverzicht.
      var mlist = momentsFor(dow, d).filter(function (m) { return m.slot !== 'move' && m.slot !== 'eod'; });
      var DAGDELEN = [
        { id: 'ochtend', t: 'Ochtend', slots: ['ont', 'pz', 'wont', 'wtus', 'och', 'okb'] },
        { id: 'middag', t: 'Middag', slots: ['kl', 'lun', 'lm', 'mid', 'mdg', 'sport'] },
        { id: 'avond', t: 'Avond', slots: ['av', 'ab', 'ovb'] }, // v50: Overbrugging hoort bij de avond
        { id: 'buiten', t: 'Buiten het schema', slots: ['extra', 'nacht'] }
      ];
      function momentCard(m) {
        var es = (d.entries || []).filter(function (e) { return e.slot === m.slot; });
        var mOpen = !!(S.mopen && S.mopen[id] === m.slot);
        var leeg = !es.length && !(d.notes && d.notes[m.slot]); // v54.2 (13 nov 07:15): notitie telt als inhoud → groen
        var src = S.msrc && S.msrc[id + ':' + m.slot]; // 'norm' | 'prev' als via een bron-icoontje geopend
        var bronNorm = pat.some(function (r) { return r.slot === m.slot; }); // icoontje alléén als de bron minstens één product heeft
        var bronPrev = !!(pw && pw.momenten.some(function (mm) { return mm.slot === m.slot; }));
        var ico = '';
        if (bronNorm) ico += '<button class="mico' + (src === 'norm' ? ' open' : '') + '" type="button" data-act="' + (leeg && weekdag ? 'normmomvul' : 'bronopen') + '" data-day="' + id + '" data-slot="' + esc(m.slot) + '" data-bron="norm" aria-pressed="' + (src === 'norm') + '" aria-label="' + esc(m.t) + ' — van je normale dag" title="' + (leeg && weekdag ? 'Vul dit lege moment uit je normale dag' : 'Van je normale dag (patroon)') + '">⚡</button>'; // v57 (afspraak v49/v49.2): kleine ⚡ per nog-leeg eet-moment op een deels-lege dag (ma–vr); za/zo alleen ⏪
        if (bronPrev) ico += '<button class="mico' + (src === 'prev' ? ' open' : '') + '" type="button" data-act="bronopen" data-day="' + id + '" data-slot="' + esc(m.slot) + '" data-bron="prev" aria-pressed="' + (src === 'prev') + '" aria-label="' + esc(m.t) + ' — van vorige week" title="Van vorige week, zelfde weekdag">⏪</button>';
        var gevuld = es.length > 0; // v57.1: mkop is áltijd data-act="mom" (rij open/dicht); bij een gevuld moment opent een tik op het chipje de popup
        var mh = '<div class="moment' + (mOpen ? ' open' : '') + '" style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border-radius:12px;min-height:48px;width:100%;box-sizing:border-box;padding:0 12px;margin-bottom:8px">' +
          '<button class="mkop" type="button" data-act="mom" data-day="' + id + '" data-slot="' + m.slot + '" aria-expanded="' + mOpen + '" style="flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;background:none;border:0;text-align:left;padding:12px 0;margin:0;cursor:pointer;font:inherit;color:inherit">' +
          '<div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1"><span class="mt" style="font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(m.t) + '</span>' + (mp(m) ? '<span class="mp">' + esc(mp(m)) + '</span>' : '') +
          (leeg ? '<span class="mdot leeg" title="nog leeg"' : '<span class="mdot vol" title="al ingevuld"') + '></span></div>' + // v57.1: 10px + kleur via CSS (.moment .mdot), geen inline maat meer
          '<div style="flex:none;display:flex;align-items:center;margin-left:10px;padding-right:10px"><span class="chev" style="width:9px;height:9px;border-right:2px solid var(--muted);border-bottom:2px solid var(--muted);transform:rotate(45deg);display:inline-block"></span></div></button>' +
          (ico ? '<div class="micos" style="display:flex;gap:6px;align-items:center;flex:none;margin-left:4px">' + ico + '</div>' : ''); // v51.3: robuuste rij — micos los van de knop (geen knop-in-knop), icoontjes rechts
        if (mOpen) { // v57.1 (v51.15-gedrag): inhoud alleen op de OPEN rij — dichte rij is kaal (naam + stipje + pijltje + icoontjes)
          mh += '<div class="minhoud">';
          if (src) mh += bronZonesHtml(id, m, src);
          if (es.length) {
            mh += '<span class="eatchips">' + es.map(function (e) {
              // v45b.5: rustige weekweergave — blokjes tonen de korte naam (zoals v44),
              // geen onderstreping en geen lange teksten. Product, hoeveelheid en prijs
              // blijven bewaard in het entry en zijn zichtbaar in het moment-scherm zelf.
              var prod = e.pid ? prodById(e.pid) : (e.name ? findProd(String(e.name).split(',')[0]) : null);
              var chipContent = (showCode(e.code) ? '<span class="code">' + esc(e.code) + '</span>' : '') + '<span class="nm">' + esc(label(e)) + (e.bron ? ' <span class="tag">' + esc(e.bron) + '</span>' : '') + '</span>'; // v55.0 (12 nov): bronlabel (NEVO)/(AI) zichtbaar in het weekoverzicht
              var chip;
              if (prod) chip = '<button class="chip" data-act="sheet" data-day="' + id + '" data-slot="' + m.slot + '" style="cursor:pointer;text-align:left" title="Open het Toevoegen-scherm van dit moment">' + chipContent + '</button>'; // v57.1: chip-tik = popup
              else {
                var nm = e.name ? String(e.name).split(',')[0].trim() : '';
                if (nm && !e.recipe && e.key && e.key.indexOf('P:') !== 0) chip = '<button class="chip" data-act="sheet" data-day="' + id + '" data-slot="' + m.slot + '" style="cursor:pointer;text-align:left" title="Open het Toevoegen-scherm van dit moment">' + chipContent + '</button>'; // v57.1
                else if (e.recipe) chip = '<button class="chip rchip" data-act="sheet" data-day="' + id + '" data-slot="' + m.slot + '" style="cursor:pointer;text-align:left" title="Open het Toevoegen-scherm van dit moment">' + chipContent + '</button>'; // v57.1
                else chip = '<span class="chip">' + chipContent + '</span>';
              }
              // v49.2: klein ✕ rechts op het blokje (eerste tik = "Zeker?" rood, 3 s, tweede tik = weg; blokje zelf blijft tikbaar)
              var zeker = !!(S.wkZeker && S.wkZeker[e.id]);
              return '<span class="eatrow">' + chip + '<button class="wkdel' + (zeker ? ' sure' : '') + '" type="button" data-act="wkdel" data-day="' + id + '" data-id="' + e.id + '" aria-label="Haal ' + esc(label(e)) + ' weg">' + (zeker ? 'Zeker?' : '✕') + '</button></span>';
            }).join('') + '</span>';
          } else if (!gevuld && !(d.notes && d.notes[m.slot])) {
            mh += '<div class="leeg">Nog niets — één tik om iets te kiezen</div>';
          }
          if (m.slot === 'av') mh += chipsOf(avExtraList(d));
          if (WHYSLOTS.indexOf(m.slot) >= 0) mh += whyChips(d, m.slot);
          if (d.notes && d.notes[m.slot]) { // v57.1: briefje alleen zichtbaar als de rij open is (v55.2 PUNT 2 teruggedraaid)
            mh += '<p class="hint zz" style="margin:8px 0 2px;font-weight:700">📝 JOUW NOTITIE — tik om uit te werken</p>';
            mh += '<div class="notewrap"><button class="notebrief" type="button" data-act="notewerk" data-day="' + id + '" data-slot="' + esc(m.slot) + '" title="Tik om uit te werken">' + esc(d.notes[m.slot]) + ' <span class="npijl">▾</span></button>' +
              '<button class="notedel" type="button" data-act="notedel" data-day="' + id + '" data-slot="' + esc(m.slot) + '" aria-label="Notitie direct weghalen" title="Notitie weghalen">✕</button></div>';
          }
          if (photoOf(d, m.slot)) mh += '<img class="thumb" alt="Foto bij ' + esc(m.t) + '" src="' + photoOf(d, m.slot) + '">';
          mh += '<button class="toevoegknop" data-act="sheet" data-day="' + id + '" data-slot="' + m.slot + '">+ Toevoegen</button>'; // v57.1: + Toevoegen alleen in de open rij (v55.2 PUNT 1A teruggedraaid)
          if (src) mh += '<button class="btn" style="width:100%;margin-top:8px" type="button" data-act="bronniets" data-day="' + id + '" data-slot="' + esc(m.slot) + '">Niets — laat zoals het is</button>';
          // v55.1 (12 nov) DEEL 3: tekstnotities — lijstje onderaan het moment (altijd ónder + Toevoegen), meerdere mag, géén kcal, elk met ✏️ (toch uitwerken) en ✕ (weg)
          var tn9 = (d.tnotes && d.tnotes[m.slot]) || [];
          if (tn9.length) mh += '<div class="tnotelist">' + tn9.map(function (x) {
            return '<div class="tnote"><span class="tntxt">' + esc(x.t) + '</span>' +
              '<button class="tolink" type="button" data-act="tnotewerk" data-day="' + id + '" data-slot="' + esc(m.slot) + '" data-id="' + x.id + '" aria-label="Tekstnotitie toch uitwerken" title="Toch uitwerken (wordt briefje)">✏️</button>' +
              '<button class="notedel" type="button" data-act="tnotedel" data-day="' + id + '" data-slot="' + esc(m.slot) + '" data-id="' + x.id + '" aria-label="Tekstnotitie weghalen" title="Weghalen">✕</button></div>';
          }).join('') + '</div>';
          mh += '</div>';
        }
        mh += '</div>';
        return mh;
      }
      DAGDELEN.forEach(function (g) {
        var ms = mlist.filter(function (m) { return g.slots.indexOf(m.slot) >= 0; });
        if (!ms.length) return;
        var dOpen = !!(S.dopen && S.dopen[id] === g.id);
        h += '<div class="dagdeel' + (dOpen ? ' open' : '') + '">' +
          '<button class="dkop" data-act="dagdeel" data-day="' + id + '" data-dagdeel="' + g.id + '" aria-expanded="' + dOpen + '">' +
          '<span class="dt">' + g.t + '</span><span class="dagdeel-tel">' + ms.length + ' momenten</span><span class="chev"></span></button>';
        if (dOpen) {
          h += '<div class="dbody">';
          ms.forEach(function (m) { h += momentCard(m); });
          h += '</div>';
        }
        h += '</div>';
      });
      h += optButtons(dow, mlist, id);
      h += '</div>';
    }
    return h + '</section>';
  }

  document.addEventListener('input', function (ev) {
    var t = ev.target, tid = t && t.getAttribute ? t.getAttribute('data-theme') : null;
    if (!tid) return;
    var dd = dayDoc(tid), v = String(t.value || '').trim().slice(0, 30);
    if (v) dd.theme = v; else delete dd.theme;
    tryStore();
    var hd = document.querySelector('.dayhead[data-day="' + tid + '"]');
    if (hd) {
      var sp = hd.querySelector('.dth');
      if (v) { if (!sp) { sp = document.createElement('span'); sp.className = 'dth'; hd.insertBefore(sp, hd.querySelector('.cnt')); } sp.textContent = v; }
      else if (sp) sp.parentNode.removeChild(sp);
    }
  });
  function hasData() {
    return Object.keys(S.weights).length > 0 || Object.keys(S.days).some(function (k) { return (S.days[k].entries || []).length || Object.keys(S.days[k].move || {}).length; });
  }
  function backupTip() {
    if (S.status === 'geen' || !hasData()) return '';
    var msg = '';
    if (!S.lastBackup) msg = 'Tip: maak eens een reservekopie, dan raak je niets kwijt.';
    else {
      var p = S.lastBackup.split('-'), n = Math.floor((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) - new Date(+p[0], +p[1] - 1, +p[2])) / 86400000);
      if (n >= 7) msg = 'Tip: je laatste reservekopie is van ' + n + ' dagen geleden.';
    }
    return msg ? '<div class="banner">' + msg + ' <button class="tolink" data-act="backupfile" style="display:inline">Nu bewaren</button></div>' : '';
  }
  function markBackup() { S.lastBackup = fmtId(new Date()); persist(); render(); }

  // =====================================================================
  // Variant C (28 okt) — Toevoegen-menu. Canvas: "Toevoegen makkelijker, Variant C", goedgekeurd.
  // Twee knoppen op Toevoegen: Iets toevoegen en Bewaren. Pas na de tik komt de keuze.
  // De menu-sheets (addsheet, ljsheet, bwsheet, basheet, tgsheet) staan in toevoegen.html.
  // Elke stap heeft een terugknop; Android-terug sluit één niveau (via de popstate in 09-opslag).
  // =====================================================================
  var ADD_SHEETS = ['addsheet', 'bwsheet', 'basheet', 'tgsheet']; // keuring 8 nov: ljsheet (lijst plakken/bestand) verhuisd naar de Producten-tab
  function addShow(id) {
    ADD_SHEETS.forEach(function (x) { var el = $(x); if (el) el.hidden = x !== id; });
  }
  function addCloseAll() {
    var n = (S.addStack || []).length;
    ADD_SHEETS.forEach(function (x) { var el = $(x); if (el) el.hidden = true; });
    S.addStack = null;
    document.documentElement.classList.remove('lock');
    // v45d.7: ook de geschiedenis-lagen opruimen die het menu zelf heeft gepusht —
    // zelfde _skip-truc als closeChoice (04-producten.js): de popstate's die hierop
    // komen worden genegeerd, en een nieuwe pushLayer wacht tot ze voorbij zijn.
    if (n > 0) {
      for (var i = 0; i < n; i++) {
        S._skip = (S._skip || 0) + 1;
        try { history.back(); } catch (e) { S._skip--; }
      }
    }
  }
  function openAdd(id) {
    if (S.addStack && S.addStack.length) return;
    S.addStack = [id];
    pushLayer(); document.documentElement.classList.add('lock');
    addShow(id);
  }
  function addSub(id) {
    if (!S.addStack || !S.addStack.length) return;
    S.addStack.push(id);
    pushLayer();
    addShow(id);
  }
  function addBack() {
    if (!S.addStack || !S.addStack.length) return;
    S.addStack.pop();
    if (S.addStack.length) { addShow(S.addStack[S.addStack.length - 1]); return; }
    addCloseAll();
  }
  // v45d.7: terugknoppen op het scherm — eerst de geschiedenislaag eraf (zoals requestClose),
  // daarna doet de popstate-regel in 09-opslag vanzelf één niveau terug. Geen laag? Dan direct.
  function addBackUi() {
    if (!S.addStack || !S.addStack.length) return;
    if (history.state && history.state.layer) { try { history.back(); return; } catch (e) { } }
    addBack();
  }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'addopen') openAdd('addsheet');
    else if (act === 'bwopen') openAdd('bwsheet');
    else if (act === 'addsub') { var av = el.getAttribute('data-v'); if (S.addStack && S.addStack.length) addSub(av); else openAdd(av); } // v50.1-fix: standalone Terugzetten-kaart opende tgsheet niet (addSub wachtte op een open menu)
    else if (act === 'addback') addBackUi();
    else if (act === 'addclose') addCloseAll();
    else if (act === 'verwopen') openVerw(el.getAttribute('data-v'));
    else if (act === 'verwclose') forceCloseVerw();
    else if (act === 'nieuwstopen') { S.verwKies = { van: vandaagId(), tm: '' }; openVerw('nieuwst'); } // v47.4
    else if (act === 'nieuwstlijst') { S.verwVan = S.verwKies.van; S.verwTm = S.verwKies.tm; S.verw = 'nieuwstlijst'; S.confirmNieuwst = false; renderVerw(); } // v47.4
    else if (act === 'nieuwstkies') { S.verw = 'nieuwst'; S.confirmNieuwst = false; renderVerw(); } // v47.4
    else if (act === 'nieuwstdel') { // v47.4: dubbele tik
      var selN = productenInPeriode(S.verwVan, S.verwTm);
      if (!selN.length) { toast('Op deze dag zijn geen producten toegevoegd'); return; }
      if (!S.confirmNieuwst) { S.confirmNieuwst = true; renderVerw(); return; }
      var idsN = {}; selN.forEach(function (p) { idsN[p.id] = true; });
      S.prijzen = S.prijzen.filter(function (p) { return !idsN[p.id]; });
      S.lijst = S.lijst.filter(function (l) { var i = lijstInfo(l); return !(i.p && idsN[i.p.id]); });
      S.confirmNieuwst = false; persist(); render();
      toast('🗑️ ' + selN.length + ' product' + (selN.length === 1 ? '' : 'en') + ' verwijderd. Je hebt nog ' + S.prijzen.length + ' producten over.');
      forceCloseVerw();
    }
    else if (act === 'addgo') {
      var w = el.getAttribute('data-v');
      if (w === 'kbon') { addCloseAll(); openSC('bon'); }
      else if (w === 'etiket') { addCloseAll(); openSC('prod'); }
      else if (w === 'zelf') { addCloseAll(); prodOpen(null); }
      else if (w === 'pp') { addCloseAll(); openPP(); }
      else if (w === 'pj') { addCloseAll(); openPJ(); }
      else if (w === 'fromrec') { addCloseAll(); openPFR(); }
      else if (w === 'prcopy') {
        addCloseAll();
        if (!S.prijzen.length) { toast('Je hebt nog geen prijzen'); return; }
        copyDirect(pricesText(), 'prijzen', 'Mijn prijzen', 'Houd de tekst ingedrukt en kies Kopiëren.');
      }
      else if (w === 'week') saveWeekFile();
      else if (w === 'recepten') saveRecipesFile();
      else if (w === 'producten') saveProductsFile();
      else if (w === 'prodcsv') saveProductsCsv();
      else if (w === 'bestand') saveFile();
      else if (w === 'kopieer') copyDirect(backupJson(false), 'backup', 'Reservekopie', 'Bewaar deze tekst op een veilige plek, bijvoorbeeld in een notitie.', true); // v48.2-fix: forceer tekst-scherm (ook als klembord werkt) zodat de tekst leesbaar/kopieerbaar is
      else if (w === 'uitbestand') { S.restorePart = el.getAttribute('data-part') || null; var rf = $('restorefile'); if (rf) rf.click(); }
      else if (w === 'plakken') { addCloseAll(); showOut('Reservekopie terugzetten', 'Plak hier de tekst van je reservekopie.', '', true); }
    }
  });

// v47.4: live datumvelden in het verwsheet (nieuwste producten) — telling meerekenen zonder re-render
document.addEventListener('input', function (ev) {
  var t = ev.target; if (!t || !t.id) return;
  if (t.id === 'nwVan' || t.id === 'nwTm') {
    if (!S.verwKies) S.verwKies = { van: vandaagId(), tm: '' };
    if (t.id === 'nwVan') S.verwKies.van = t.value; else S.verwKies.tm = t.value;
    var tel = $('nwTel'); if (tel) tel.textContent = nieuwstTelling(S.verwKies.van, S.verwKies.tm, productenInPeriode(S.verwKies.van, S.verwKies.tm));
  }
});
  // ---- lade
  function openSheet(id, slot, dow) {
    pushLayer();
    S.sheet = { day: id, slot: slot, dow: dow != null ? +dow : null, buf: true, sel: [], added: {} }; // v50.6: dow voor het weekdag-patroon — v55.2 (13 nov) PUNT 1B: élke dag-popup is een buffer (sel = DIT EETMOMENT, pas Toevoegen (n) zet in de dag)
    S.vv = ''; S.prodAsk = ''; S.pkUnit = ''; S.freeU = 'g'; S.icatOpen = ''; S.favAsk = ''; S.freeCats = []; S.cpk = {}; S.grpOpen = {}; S.confirmClear = false; S.saveRec = false; S.othOpen = false; S.confirmFavDel = null;
    document.documentElement.classList.add('lock');
    $('sheet').hidden = false;
    renderSheet(true);
  }
  function pushLayer() { if (S._skip > 0) { setTimeout(pushLayer, 40); return; } try { history.pushState({ layer: 1 }, ''); } catch (e) { } }
  function requestClose() {
    if (history.state && history.state.layer) { history.back(); return; }
    // v47.4.3: zonder echt laagje géén paginastap terug — direct het open venster sluiten, pagina blijft staan
    if (S.cook) forceCloseCook(); else if (S.rg) forceCloseRg(); else if (S.oud) forceCloseOud(); else if (S.verw) forceCloseVerw(); else if (S.sc) forceCloseSC(); else if (S.pj) forceClosePJ(); else if (S.pp) forceClosePP(); else if (S.prod) forceCloseProd(); else if (S.paste) forceClosePaste(); else if (S.rec) forceCloseRec(); else if (S.sheet) forceCloseSheet(); else forceCloseOut();
  }
  function forceCloseSheet() {
    var a = document.activeElement; if (a && a.blur) a.blur();
    S.sheet = null; $('sheet').hidden = true;
    document.documentElement.classList.remove('lock');
    render();
  }
  function sheetMoment() {
    var p = S.sheet.day.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    var m = momentsFor(dt.getDay(), dayDoc(S.sheet.day), S.sheet.slot).filter(function (x) { return x.slot === S.sheet.slot; })[0];
    return { m: m, dow: dt.getDay(), date: dt };
  }
  function photoBlock(d, slot) {
    var ph = photoOf(d, slot);
    var h = '<h3>Foto</h3>';
    if (ph) {
      h += '<img class="bigphoto" alt="Foto" src="' + ph + '"><div class="seg mvact"><button class="pill" data-act="photoadd">Andere foto</button><button class="pill" data-act="photodel">Foto weghalen</button></div>';
    } else {
      h += '<button class="btn" style="width:100%" data-act="photoadd">Foto toevoegen</button>';
    }
    return h;
  }
  function plakCount(list) {
    var p = plakItems(), n = 0;
    list.forEach(function (e) { if (e.key === 'NE:' + p.full.i) n += 1; else if (e.key === 'NE:' + p.half.i) n += 0.5; });
    return n;
  }
  function setPlak(grp, target) {
    var d = dayDoc(S.sheet.day), slot = S.sheet.slot, p = plakItems();
    var isPlak = function (e) { return e.slot === slot && e.grp === grp && (e.key === 'NE:' + p.full.i || e.key === 'NE:' + p.half.i); };
    d.entries = d.entries.filter(function (e) { return !isPlak(e); });
    var last = -1; d.entries.forEach(function (e, i) { if (e.slot === slot && e.grp === grp) last = i; });
    var add = target === 1 ? [p.full] : target === 2 ? [p.full, p.full] : [p.full, p.half];
    var neu = add.map(function (f) { return { id: uid(), slot: slot, key: 'NE:' + f.i, code: '', grp: grp, name: f.it.n, k: f.it.k }; });
    Array.prototype.splice.apply(d.entries, [last + 1, 0].concat(neu));
    saveDay(S.sheet.day); renderSheet(false);
  }
  var ITEM_CAT_RULES = [
    [/^snee brood/i, ['brood']],
    [/melba|cracker|rijstwafel/i, ['brood', 'ontbijt']],
    [/smeerkaas|kipfilet|plakje|pindakaas/i, ['beleg']],
    [/cottage cheese|gekookt ei|eiersalade/i, ['zuivel', 'beleg']],
    [/drinkyoghurt/i, ['drinken', 'zuivel']],
    [/^melk|maaltijdshake|eiwitpoeder|limonadesiroop/i, ['drinken']],
    [/muesli|lijnzaad/i, ['ontbijt']],
    [/^peer|vijgen|mango|kiwi|dragon|appelmoes|banaan|mandarijn|aardbeien/i, ['fruit']],
    [/rauwkost/i, ['groente']],
    [/tonijnsalade|zalm/i, ['vis']],
    [/kwark.fris/i, ['zuivel', 'snacks']],
    [/muffin|chips|^ijs|nibbit|koek|chocola|snoep|popcorn|nootjes|borrel/i, ['snacks']],
    [/^cacao/i, ['blik', 'drinken']]
  ];
  function defItemCats(name) {
    for (var i = 0; i < ITEM_CAT_RULES.length; i++) if (ITEM_CAT_RULES[i][0].test(name)) return ITEM_CAT_RULES[i][1].slice();
    return guessCats(name);
  }
  function itemCats(it) {
    var o = S.icat[normName(it.n)];
    if (Array.isArray(o) && o.length) { var f = o.filter(function (x) { return !!catById(x); }).slice(0, 3); if (f.length) return f; }
    return defItemCats(it.n);
  }
  function icatPanel(it) {
    var nk = normName(it.n), cur = itemCats(it), has = !!(S.icat[nk] && S.icat[nk].length);
    return '<div class="icatpanel"><p class="hint" style="margin:0 0 6px">Categorie van ' + esc(it.n) + ' (maximaal 3). Jouw keuze gaat voor.</p>' +
      catWidget('ic-' + nk, function () { return cur; }, 'icatset', 'data-n="' + esc(nk) + '"') + (has ? '<button class="pill" data-act="icatdef" data-n="' + esc(nk) + '">Terug naar standaard</button>' : '') + '</div>';
  }
  function favAskHtml(i, idn) {
    if (S.favAsk === '' || S.favAsk !== i || !S.fav[i]) return '';
    return '<div class="icatpanel"><p class="hint" style="margin:0 0 6px">Hoeveel gram ' + esc(stripK(S.fav[i].name)) + '?</p><div class="rowx" style="margin-top:0"><input class="favgram" id="' + idn + '" type="text" inputmode="decimal" autocomplete="off" placeholder="Bijvoorbeeld 40" aria-label="Hoeveel gram"><button class="pill" data-act="favgo" data-i="' + i + '">Toevoegen</button></div><button class="tolink" data-act="favno">Annuleer</button></div>';
  }
  function favGramVal() {
    var v = ''; Array.prototype.forEach.call(document.querySelectorAll('.favgram'), function (x) { if (!v && x.value.trim()) v = x.value; });
    return v === '' ? null : num(v);
  }
  
  var FIXED_INFO = [
    { match: 'cottage cheese met fruit', base: 'Cottage cheese met fruit', u: 'g', rate: 0.96, p100: 96, def: 50 },
    { match: 'cottage cheese', base: 'Cottage cheese', u: 'g', rate: 0.91, p100: 91, def: 50 },
    { match: 'smeerkaas', base: 'Smeerkaas', u: 'g', rate: 1.36, p100: 136, def: 25 },
    { match: ['proteïne drinkyoghurt', 'drinkyoghurt'], base: 'Proteïne drinkyoghurt', u: 'ml', rate: 0.428, p100: 43, def: 250 },
    { match: 'melk', not: 'cacao', base: 'Melk', u: 'ml', rate: 0.352, p100: 35, def: 250 },
    { match: 'pindakaas', base: 'Pindakaas', u: 'g', rate: 5.97, p100: 597, def: 10 },
    { match: ['crunchy muesli', 'muesli'], base: 'Crunchy muesli', u: 'g', rate: 4.22, p100: 422, def: 10 },
    { match: 'ijs', base: 'IJs', u: 'g', rate: 1.42, p100: 142, def: 50 },
    { match: 'eiwitpoeder', base: 'Eiwitpoeder', u: 'g', rate: 3.667, p100: 367, def: 30 },
    { match: 'havermout', base: 'Havermout', u: 'g', rate: 3.76, p100: 376, def: 30 },
    { match: 'gebroken lijnzaad', base: 'Gebroken lijnzaad', u: 'g', rate: 4.77, p100: 477, def: 10 },
    { match: 'rauwkost', base: 'Rauwkost of snoepgroente', u: 'g', rate: 0.35, p100: 35, def: 100 },
    { match: 'banaan', base: 'Banaan', u: 'stuk', rate: 110, p100: null, def: 1 },
    { match: 'gekookt ei', base: 'Gekookt ei', u: 'stuk', rate: 74, p100: null, def: 1 },
    { match: ['kipfilet of ham', 'plakje kipfilet of ham', 'kipfilet'], base: 'Kipfilet of ham', u: 'plakje', rate: 13, p100: null, def: 1 },
    // v26
    { match: 'cacao', base: 'Cacao', u: 'theelepel', rate: 17, p100: null, def: 1 },
    { match: 'vijgen', base: 'Vijgen', u: 'g', rate: 0.64, p100: 64, def: 100 },
    { match: 'mango', base: 'Mango', u: 'g', rate: 0.60, p100: 60, def: 100 },
    { match: 'dragon fruit', base: 'Dragon fruit', u: 'g', rate: 0.55, p100: 55, def: 100 },
    { match: 'appelmoes', base: 'Appelmoes 0%', u: 'g', rate: 0.52, p100: 52, def: 100 },
    { match: 'peer', base: 'Peer', u: 'stuk', rate: 85, p100: null, def: 1 },
    { match: 'kiwi', base: 'Kiwi', u: 'stuk', rate: 55, p100: null, def: 1 },
    { match: 'aardbeien', base: 'Aardbeien of frambozen', u: 'g', rate: 0.35, p100: 35, def: 100 },
    { match: 'melba toast', base: 'Melba toast', u: 'stuk', rate: 13, p100: null, def: 3 },
    { match: 'maaltijdshake', base: 'Maaltijdshake', u: 'ml', rate: 1.0, p100: 100, def: 250 },
    { match: 'zalm, 100 g gerookt', base: 'Gerookte zalm met mayo (2 laagjes per 100 g)', u: 'g', rate: 2.57, p100: null, def: 100 }
  ];
  function fixUnitPl(u) { return u === 'stuk' ? 'stuks' : (u === 'plakje' ? 'plakjes' : (u === 'theelepel' ? 'theelepels' : u)); }
  function fixedGramInfo(n) {
    if (!n) return null;
    var s = n.toLowerCase().trim();
    for (var i = 0; i < FIXED_INFO.length; i++) {
      var item = FIXED_INFO[i];
      var matches = false;
      if (Array.isArray(item.match)) {
        matches = item.match.some(function (m) { return s.indexOf(m) === 0; });
      } else {
        matches = s.indexOf(item.match) === 0;
      }
      if (matches) {
        if (item.not && s.indexOf(item.not) >= 0) continue;
        return item;
      }
    }
    return null;
  }
  function extractDefAmount(name) {
    var m = String(name || '').match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml)\b/i);
    if (m) return parseFloat(m[1].replace(',', '.'));
    return null;
  }
  function fixedAskHtml(key, fg, defVal) {
    if (S.fixedAsk !== key) return '';
    var v = (defVal != null ? defVal : (fg.def != null ? fg.def : (fg.u === 'ml' ? 250 : (fg.u === 'stuk' || fg.u === 'plakje' || fg.u === 'theelepel' ? 1 : 50))));
    var uTxt = fixUnitPl(fg.u);
    return '<div class="icatpanel"><p class="hint" style="margin:0 0 6px">Hoeveel ' + uTxt + ' ' + esc(fg.base) + '?</p><div class="rowx" style="margin-top:0"><input class="fixgram" id="fg_' + esc(key.replace(':', '_')) + '" type="text" inputmode="decimal" autocomplete="off" value="' + v + '" aria-label="Hoeveel ' + uTxt + '"><button class="pill" data-act="fixgo" data-key="' + esc(key) + '">Toevoegen</button></div><button class="tolink" data-act="fixno">Annuleer</button></div>';
  }
  function fixGramVal() {
    var v = ''; Array.prototype.forEach.call(document.querySelectorAll('.fixgram'), function (x) { if (!v && x.value.trim()) v = x.value; });
    return v === '' ? null : num(v);
  }
  function focusFixGram() {
    setTimeout(function () {
      var xs = document.querySelectorAll('.fixgram');
      if (xs.length) {
        xs[0].focus();
        try { xs[0].select(); } catch (e) { }
        try { xs[0].scrollIntoView({ block: 'center' }); } catch (e) { }
      }
    }, 30);
  }


  // ---- v27: eigen producten uit Prijzen in Week, Meest gekozen, eenheden en gewicht per stuk
  var UNAME = { g: 'gram', ml: 'milliliter', stuk: 'stuks' };
  var HUISMATEN = { snee: 40, plakje: 20, eetlepel: 15, handje: 30, bakje: 150, bol: 60 }; // v55.0 (12 nov): standaard-gramgewichten huismaten; per product eigen gewicht (p.hm) wint áltijd van de standaard
  function huismaatGram(p, u) { if (HUISMATEN[u] == null) return null; var e = (p && p.hm) ? p.hm[u] : null; return (typeof e === 'number' && isFinite(e) && e > 0) ? e : HUISMATEN[u]; }
  function freePh(u, sg) {
    if (u === 'ml') return { k: 'kcal per 100 ml', g: 'Hoeveel milliliter' };
    if (u === 'stuk') return { k: sg ? 'kcal per 100 g' : 'kcal per stuk', g: 'Hoeveel stuks (0,5 mag)' };
    return { k: 'kcal per 100 g', g: 'Hoeveel gram' };
  }
  function prodUnits(p) {
    var l = [p.u];
    if (p.sg) { if (p.u === 'g') l.push('stuk'); else if (p.u === 'stuk') l.push('g'); }
    if (p.u === 'g') Object.keys(HUISMATEN).forEach(function (u) { if (l.indexOf(u) < 0) l.push(u); }); // v55.0 (12 nov): huismaten als kiesbare eenheid bij gram-producten
    return l;
  }
  function kcalFor(p, a, u) {
    if (p.kruid && p.kc == null && p.kst == null) return 0; // v45b.9: kruid zonder eigen kcal telt als 0 (jij hebt het als kruid gemarkeerd)
    var uu = String(u == null ? '' : u).toLowerCase().trim();
    if (uu === '') uu = String(p.u || 'g').toLowerCase(); // v57.5: lege eenheid = product-eenheid (stuk-aantal NOOIT als grammen behandelen)
    if (HUISMATEN[uu] != null) { // v55.0 (12 nov): huismaat -> via grammen (kc per 100 g × gram ÷ 100); per-stuk-kcal telt direct
      var hg = huismaatGram(p, uu);
      if (p.kc != null) return a * hg * p.kc / 100;
      if (p.kst != null) return a * p.kst;
      return null;
    }
    if (uu === 'stuk' || STUKU.test(uu)) { // v57.5: stuk(-woord) zonder bekend stukgewicht = null ("?"), geen gok
      if (p.kst != null) return a * p.kst;
      var sg = p.sg != null ? p.sg : stukGram(p);
      if (sg != null && p.kc != null) return a * sg * p.kc / 100;
      return null;
    }
    var antlU = (p.aantal > 0 && p.aantalWoord) ? String(p.aantalWoord).toLowerCase().trim() : null;
    if (antlU && uu === antlU) { // v58.4: eigen woord (crackers, appel…) = stuks — kcal van N stuks, nooit van N gram
      if (p.kst != null) return a * p.kst;
      var sgA = p.sg != null ? p.sg : stukGram(p);
      if (sgA != null && p.kc != null) return a * sgA * p.kc / 100;
      return null;
    }
    if (p.kc != null) return a * p.kc / 100;
    return null;
  }
  function unitWord(u, a, p) { if (u === 'stuk') return stukNaam(p, a); var antlU = (p && p.aantal > 0 && p.aantalWoord) ? p.aantalWoord : null; if (antlU && u === antlU) return a === 1 ? antlU.replace(/s$/, '').toLowerCase() : antlU.toLowerCase(); return u; } // v48.2: eigen woord in de blokjestekst
  function unitName(u, p) { if (HUISMATEN[u] != null) return u; return u === 'stuk' && p && p.sw ? stukNaam(p, 2) : UNAME[u]; }
  function addProdEntry(p, a, u, k) {
    var e = { key: 'P:' + p.id, code: '', name: p.n + ', ' + fmtN(a) + ' ' + unitWord(u, a, p), k: k == null ? null : Math.round(k), exact: k != null, pid: p.id, amt: a, u: u, bron: p.bron || '' }; // v55.0 (12 nov): bronlabel (NEVO)/(AI) mee het entry in
    if (u === 'g' && k != null && p.kc != null) { e.g = a; e.p = p.kc; }
    if (HUISMATEN[u] != null && k != null && p.kc != null) { e.g = a * huismaatGram(p, u); e.p = p.kc; } // v55.0 (12 nov): huismaat -> grammen bewaren bij het entry
    // v48.2: bij invoer in het eigen aantal-woord (plakjes…) ook het bijbehorende gramgewicht bewaren, zodat "= 20 g" klopt
    var antlU0 = (p.aantal > 0 && p.aantalWoord) ? p.aantalWoord : null;
    if (antlU0 && u === antlU0) { var sg0 = stukGram(p); if (sg0 != null) { e.g = a * sg0; if (k != null && p.kc != null) e.p = p.kc; } }
    addEntry(e);
  }
  function ensureProduct(name, u, kcIn, sg) {
    var p = findProd(name);
    if (!p) {
      p = cleanProd({ id: uid(), n: name, u: u, inh: null, pr: null, bon: null, alias: [], w: {}, kc: null, cat: (function () { var gc = (S.freeCats && S.freeCats.length) ? S.freeCats.slice(0, 3) : guessCats(name); return gc.length ? gc : ['overig']; })() }); // v54.2: geen categorie gekozen = automatisch "Overig"
      S.prijzen.push(p);
    }
    if (u === 'stuk') {
      if (sg) { if (p.sg == null) p.sg = sg; if (kcIn != null && p.kc == null) p.kc = kcIn; }
      else if (kcIn != null && p.kst == null) p.kst = kcIn;
    } else if (kcIn != null && p.kc == null) p.kc = kcIn;
    p.eh = u;
    return p;
  }
  function pkPanel(p) {
    var us = prodUnits(p), u = (S.pkUnit && us.indexOf(S.pkUnit) >= 0) ? S.pkUnit : ((p.eh && us.indexOf(p.eh) >= 0) ? p.eh : p.u);
    // v48.2: product mét aantal-per-verpakking -> extra eenheid met het eigen woord (plakjes, rijstwafels…)
    var antlU = (p.aantal > 0 && p.aantalWoord) ? p.aantalWoord : null;
    if (antlU && us.indexOf(antlU) < 0) us.push(antlU);
    if (antlU && S.pkUnit === antlU) u = antlU; else if (u === p.u && antlU && p.la != null && p.eh === antlU) u = antlU;
    S.pkUnit = u;
    var def = (u === 'stuk' || HUISMATEN[u] != null || (antlU && u === antlU)) ? ((p.la && p.la <= 10) ? p.la : 1) : ((p.la && p.eh === u) ? p.la : 100); // v50.4: naar stuk/plakjes start 1 á 2, geen 100 — v55.0: huismaten net als stuk
    var h = '<div class="icatpanel"><p class="hint" style="margin:0 0 6px">Hoeveel ' + (antlU && u === antlU ? antlU : unitName(u, p)) + ' ' + esc(p.n) + '?</p>';
    if (us.length > 1) h += '<div class="seg" style="margin:0 0 8px">' + us.map(function (x) { return '<button class="pill" data-act="pkunit" data-v="' + x + '" aria-pressed="' + (x === u) + '">' + (x === 'stuk' ? 'Stuks' : x === 'g' ? 'Gram' : x === 'ml' ? 'Milliliter' : esc(x)) + '</button>'; }).join('') + '</div>';
    h += '<div class="rowx" style="margin-top:0"><input class="pkamt" type="text" inputmode="decimal" autocomplete="off" value="' + esc(fmtN(def)) + '" aria-label="Hoeveel ' + (antlU && u === antlU ? antlU : unitName(u, p)) + '"><button class="pill" data-act="pkgo" data-p="' + p.id + '">Toevoegen</button></div>';
    // v48.2: bij eenheden uit het aantal-blokje klein bevestigingsregeltje "= N g" (kcal rekent de app zelf)
    if (antlU && u === antlU) {
      var sg0 = stukGram(p);
      h += '<p class="hint pkconv" id="pkconv" style="margin:6px 0 0"></p>';
    }
    if (kcalFor(p, 1, u) == null) {
      var per = (u === 'stuk' && !p.sg);
      h += '<p class="hint" style="margin:8px 0 4px">Bij dit product staan nog geen calorieën. Vul ze één keer in, dan onthoudt de app ze (hoeft niet).</p><input class="pkkc" type="text" inputmode="decimal" autocomplete="off" placeholder="' + (per ? 'kcal per stuk' : (u === 'ml' ? 'kcal per 100 ml' : 'kcal per 100 g')) + '" aria-label="Calorieën van dit product">';
    }
    h += '<button class="tolink" data-act="pkno">Annuleer</button></div>';
    return h;
  }
  function focusPk() {
    setTimeout(function () {
      var xs = document.querySelectorAll('.pkamt');
      for (var i = 0; i < xs.length; i++) { if (xs[i].offsetParent !== null) { xs[i].focus(); try { xs[i].select(); } catch (e) { } try { xs[i].scrollIntoView({ block: 'center' }); } catch (e) { } break; } }
    }, 30);
  }
  function rowHtml(r, counts) {
    var ci = r.cs.map(function (x) { return catById(x).i; }).join(' '), h = '';
    if (r.pid) {
      var p = prodById(r.pid); if (!p) return '';
      var pkey = 'P:' + p.id, pc = counts[pkey] || 0, nokc = (p.kc == null && p.kst == null) ? ' · nog geen kcal' : '', psub;
      if (r.cur) {
        var palso = catsOf(p).filter(function (x) { return x !== r.cur; }).map(function (x) { return catById(x).i + ' ' + catById(x).n; });
        psub = 'uit Prijzen' + (palso.length ? ' · ook bij: ' + palso.join(', ') : '');
      } else psub = (ci ? ci + ' ' : '') + 'uit Prijzen · ' + unitName(p.u, p) + nokc;
      h += '<div class="orow"><button class="opt" data-act="pkask" data-p="' + p.id + '"><span class="on">' + esc(p.n) + '<small>' + esc(psub) + '</small></span>' + (pc ? '<span class="n">' + pc + '×</span>' : '') + '</button>' +
        (pc ? '<button class="minus" data-act="minus" data-key="' + esc(pkey) + '" aria-label="Haal één keer ' + esc(p.n) + ' weg">−</button>' : '') + '</div>';
      if (S.prodAsk === p.id) h += pkPanel(p);
    } else if (r.fav != null) {
      var f = S.fav[r.fav]; if (!f) return '';
      var isSure = S.confirmFavDel === r.fav;
      h += '<div class="orow"><button class="opt" data-act="fav" data-i="' + r.fav + '"><span class="on">' + esc(stripK(r.it.n)) + '<small>' + ci + ' zelf toegevoegd' + (f.p != null ? ', vul de gram in' : '') + '</small></span></button>' +
        (f.p == null && f.k == null ? '<button class="catbtn" data-act="favfill" data-i="' + r.fav + '" aria-label="Voeg gram en kcal per 100 g toe voor ' + esc(stripK(f.name)) + '">Gram</button>' : '') +
        '<button class="delbtn' + (isSure ? ' sure' : '') + '" data-act="favdel" data-i="' + r.fav + '" aria-label="Haal weg">' + (isSure ? 'Zeker?' : '×') + '</button></div>' + favAskHtml(r.fav, 'favgram3');
    } else {
      var key = r.gk + ':' + r.i, c = counts[key] || 0, sm = ((ci ? ci + ' ' : '') + (r.it.d ? esc(r.it.d) : '')).trim();
      var sfg = fixedGramInfo(r.it.n);
      h += '<div class="orow"><button class="opt" data-act="' + (sfg ? 'fixask' : 'pick') + '" data-g="' + r.gk + '" data-i="' + r.i + '" data-key="' + esc(key) + '"><span class="on">' + esc(r.it.n) + (sm ? '<small>' + sm + '</small>' : '') + '</span>' + (c ? '<span class="n">' + c + '×</span>' : '') + '</button>' +
        (c ? '<button class="minus" data-act="minus" data-key="' + esc(key) + '" aria-label="Haal één keer ' + esc(r.it.n) + ' weg">−</button>' : '') + '</div>';
      if (sfg && S.fixedAsk === key) h += fixedAskHtml(key, sfg, extractDefAmount(r.it.n));
    }
    return h;
  }
  // Meest gekozen: hoe vaak gekozen, recente keuzes tellen zwaarder (halfwaardetijd 3 weken), keuzes bij dit moment tellen dubbel
  function meestList(m) {
    var now = new Date(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()), sc = {};
    function add(id, row, w) { var x = sc[id] || (sc[id] = { row: row, s: 0 }); x.s += w; }
    Object.keys(S.days).forEach(function (did) {
      var pp = did.split('-'), age = Math.max(0, Math.round((t0 - new Date(+pp[0], +pp[1] - 1, +pp[2])) / 86400000));
      if (isNaN(age)) return;
      var w = Math.pow(0.5, age / 21);
      (S.days[did].entries || []).forEach(function (e) {
        var b = (S.sheet && e.slot === S.sheet.slot) ? 2 : 1;
        if (e.pid) { var p = prodById(e.pid); if (p) add('P:' + e.pid, { pid: p.id, it: { n: p.n, d: '' }, cs: catsOf(p) }, w * b); return; }
        if (/^[A-Z]{2}:\d+$/.test(e.key || '')) {
          var pr = e.key.split(':'), gk = pr[0], i = +pr[1];
          if (gk === 'AV' || m.g.indexOf(gk) < 0 || !G[gk] || !G[gk].items[i] || G[gk].items[i].h) return;
          var it = G[gk].items[i]; add(e.key, { gk: gk, i: i, it: it, cs: itemCats(it) }, w * b);
        }
      });
    });
    S.fav.forEach(function (f, i) {
      var age = Math.max(0, Math.round((t0 - new Date(f.t || 0)) / 86400000)), fit = { n: f.name, d: '' };
      add('F:' + i, { fav: i, it: fit, cs: itemCats(fit) }, (f.uses || 1) * Math.pow(0.5, age / 21));
    });
    return Object.keys(sc).map(function (k) { return sc[k]; }).filter(function (x) { return x.s >= 0.15; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 10).map(function (x) { return x.row; });
  }
  function meestGekozenHtml(m, counts, gOpen) {
    var list = meestList(m);
    if (!list.length) return '';
    return '<details class="grp" data-gg="FAV"' + (gOpen('FAV', false) ? ' open' : '') + '><summary><span>Meest gekozen</span><span class="gcnt">' + list.length + '</span></summary>' + list.map(function (r) { return rowHtml(r, counts); }).join('') + '</details>';
  }
  // Gelijke woorden bij het zoeken (v28)
  var SYN = [['chips', 'crisps', 'chipjes'], ['koek', 'koekje', 'koekjes', 'koeken', 'biscuit'], ['ijs', 'schepijs', 'roomijs'],
    ['yoghurt', 'yogurt'], ['mayonaise', 'mayo'], ['frisdrank', 'limonade'], ['burger', 'hamburger']];
  function synOf(w) {
    var out = [];
    if (w.length < 3) return out;
    SYN.forEach(function (g) {
      if (g.some(function (m) { return m === w || (w.length >= 4 && m.indexOf(w) === 0); })) g.forEach(function (m) { if (m !== w && out.indexOf(m) < 0) out.push(m); });
    });
    return out;
  }
  function searchHtml(m, counts) {
    var q = normName(S.isq || '');
    if (!q) return ''; // leeg zoekveld = helemaak niks eronder
    var words = q.split(' '), rows = [];
    function hit(txt) { // v54.2 (13 nov 07:15): HELE woorden — géén woorddelen ("kaas" matcht "pindakaas" NIET); v57: het laatste woord mag wél op een beginstuk ("haver" vindt Havermout)
      var t = normWoorden(txt);
      return words.every(function (w, wi) {
        if (wi === words.length - 1) return t.some(function (x) { return x.indexOf(w) === 0; });
        return t.indexOf(w) >= 0;
      });
    }
    S.prijzen.forEach(function (p) { if (hit(prodKeys(p).join(' '))) rows.push({ pid: p.id, it: { n: p.n, d: '' }, cs: catsOf(p) }); });
    var gid = groupOfSlot(m.slot);
    var rr = S.recipes.filter(function (r) { return (!gid || rWhere(r).indexOf(gid) >= 0) && hit(r.name); }); // v54.2: recepten ALLEEN van dit moment
    var h = '<p class="hint stat" style="margin:6px 0">' + (rows.length || rr.length ? (rows.length + (rr.length ? ' · ' + rr.length + ' recepten' : '') + ' gevonden') : 'Geen producten of recepten gevonden.') + '</p>';
    rows.slice(0, 30).forEach(function (r) { // v54.2: kaartje = alléén naam + "eigen product" + kcal
      var p = prodById(r.pid); if (!p) return;
      var kct = (p.u === 'stuk' && p.kst != null) ? Math.round(p.kst) + ' kcal/stuk' : (p.kc != null ? p.kc + ' kcal/100g' : 'nog geen kcal');
      h += '<div class="orow"><button class="opt" data-act="pkask" data-p="' + p.id + '"><span class="on">' + esc(p.n) + (S.sheet && S.sheet.note && S.sheet.added && S.sheet.added['P:' + p.id] ? ' ✔' : '') + '<small>eigen product · ' + esc(kct) + '</small></span></button></div>'; // v55.0 (12 nov): ✔ op het kaartje als het in "Dit eetmoment" staat
      if (S.prodAsk === p.id) h += pkPanel(p); // v54.3 (12 nov): zoekresultaat-kaartje reageert wél — tik opent het aantal/eenheid-paneel (ook bij "nog geen kcal")
    });
    rr.forEach(function (r) { // v54.2: recept-kaartje = 🍽 + naam + "recept" + kcal
      var rk = recKcal(r, 1);
      h += '<div class="orow"><button class="opt" data-act="recadd" data-r="' + r.id + '" data-f="1"><span class="on">' + esc(recEmoji(r) + ' ' + r.name) + (S.sheet && S.sheet.note && S.sheet.added && S.sheet.added['R:' + r.id] ? ' ✔' : '') + '<small>🍽 recept · ' + (rk != null ? Math.round(rk) + ' kcal' : 'nog te schatten') + '</small></span></button></div>'; // v55.0 (12 nov): ✔ op het recept-kaartje
    });
    if (!rows.length && !rr.length) h += '<button class="btn" style="width:100%" data-act="isadd">Zelf toevoegen: ' + esc(S.isq.trim()) + '</button>';
    return h;
  }
  function focusGram() {
    setTimeout(function () {
      var xs = document.querySelectorAll('.favgram');
      for (var i = 0; i < xs.length; i++) { var dt = xs[i].closest('details'); if (!dt || dt.open) { xs[i].focus(); try { xs[i].scrollIntoView({ block: 'center' }); } catch (e) { } break; } }
    }, 30);
  }
  function itemGroupsHtml(m, counts, gOpen) {
    var h = '', rest = [];
    m.g.forEach(function (gk) {
      if (gk !== 'AV') { rest.push(gk); return; }
      var gn = 0, gl = '';
      itemsOf(gk).forEach(function (it, i) {
        if (it.h) return;
        var key = gk + ':' + i, c = counts[key] || 0; gn += c;
        gl += (c ? '<div class="orow">' : '') + '<button class="opt" data-act="pick" data-g="' + gk + '" data-i="' + i + '">' +
          '<span class="on">' + esc(it.n) + (it.d ? '<small>' + esc(it.d) + '</small>' : '') + '</span>' +
          (c ? '<span class="n">' + c + '×</span>' : '') + '</button>' +
          (c ? '<button class="minus" data-act="minus" data-key="' + esc(key) + '" aria-label="Haal één keer ' + esc(it.n) + ' weg">−</button></div>' : '');
      });
      h += '<details class="grp" data-gg="' + gk + '"' + (gOpen(gk, true) ? ' open' : '') + '><summary><span>Wat was het ongeveer?</span>' + (gn ? '<span class="gcnt">' + gn + '×</span>' : '') + '</summary>' + gl + '</details>';
    });
    if (!S.wkBl) return h;
    var rows = [];
    rest.forEach(function (gk) {
      itemsOf(gk).forEach(function (it, i) { if (!it.h) rows.push({ gk: gk, i: i, it: it, cats: itemCats(it) }); });
    });
    S.fav.forEach(function (f, i) { var fit = { n: f.name, d: '' }; rows.push({ fav: i, it: fit, cats: itemCats(fit) }); });
    S.prijzen.slice().sort(function (a, b) { return a.n.localeCompare(b.n, 'nl'); }).forEach(function (p) { rows.push({ pid: p.id, it: { n: p.n, d: '' }, cats: catsOf(p) }); });
    CATS.forEach(function (c) {
      var inC = rows.filter(function (r) { return r.cats.indexOf(c.id) >= 0; });
      if (!inC.length) return;
      var gn = 0, gl = '';
      inC.forEach(function (r) {
        if (r.pid) {
          gn += counts['P:' + r.pid] || 0;
          gl += rowHtml({ pid: r.pid, it: r.it, cs: r.cats, cur: c.id }, counts);
          return;
        }
        if (r.fav != null) {
          var fnk = normName(r.it.n), falso = r.cats.filter(function (x) { return x !== c.id; }).map(function (x) { return catById(x).i + ' ' + catById(x).n; });
          var fsub = 'zelf toegevoegd' + (S.fav[r.fav].p != null ? ', vul de gram in' : '') + (falso.length ? ' · ook bij: ' + falso.join(', ') : '');
          var isSure = S.confirmFavDel === r.fav;
          gl += '<div class="orow"><button class="opt" data-act="fav" data-i="' + r.fav + '"><span class="on">' + esc(stripK(r.it.n)) + '<small>' + esc(fsub) + '</small></span></button>' +
            '<button class="delbtn' + (isSure ? ' sure' : '') + '" data-act="favdel" data-i="' + r.fav + '" aria-label="Haal ' + esc(stripK(r.it.n)) + ' weg">' + (isSure ? 'Zeker?' : '×') + '</button>' +
            '<button class="catbtn" data-act="icat" data-n="' + esc(fnk) + '" aria-label="Categorie van ' + esc(stripK(r.it.n)) + '">Categorie</button></div>';
          if (S.icatOpen === fnk) gl += icatPanel(r.it);
          gl += favAskHtml(r.fav, 'favgram2');
          return;
        }
        var key = r.gk + ':' + r.i, cnt = counts[key] || 0, nk = normName(r.it.n); gn += cnt;
        var also = r.cats.filter(function (x) { return x !== c.id; }).map(function (x) { return catById(x).i + ' ' + catById(x).n; });
        var sub = (r.it.d ? esc(r.it.d) : '') + (r.it.d && also.length ? ' · ' : '') + (also.length ? 'ook bij: ' + esc(also.join(', ')) : '');
        var fg = fixedGramInfo(r.it.n);
        gl += '<div class="orow"><button class="opt" data-act="' + (fg ? 'fixask' : 'pick') + '" data-g="' + r.gk + '" data-i="' + r.i + '" data-key="' + esc(key) + '">' +
          '<span class="on">' + esc(r.it.n) + (sub ? '<small>' + sub + '</small>' : '') + '</span>' +
          (cnt ? '<span class="n">' + cnt + '×</span>' : '') + '</button>' +
          (cnt ? '<button class="minus" data-act="minus" data-key="' + esc(key) + '" aria-label="Haal één keer ' + esc(r.it.n) + ' weg">−</button>' : '') +
          '<button class="catbtn" data-act="icat" data-n="' + esc(nk) + '" aria-label="Categorie van ' + esc(r.it.n) + '">Categorie</button></div>';
        if (fg && S.fixedAsk === key) gl += fixedAskHtml(key, fg, extractDefAmount(r.it.n));
        if (S.icatOpen === nk) gl += icatPanel(r.it);
      });
      var gk2 = 'C' + c.id;
      h += '<details class="grp" data-gg="' + gk2 + '"' + (gOpen(gk2, gn > 0) ? ' open' : '') + '><summary><span>' + c.i + ' ' + esc(c.n) + '</span>' + (gn ? '<span class="gcnt">' + gn + '×</span>' : '<span class="gnum">' + inC.length + '</span>') + '</summary>' + gl + '</details>';
    });
    return h;
  }
  // ---- v28: Vervang dit (alleen met je eigen Prijzen-lijst)
  function priceFor(p, a, u) {
    if (p.pr == null || !(p.inh > 0)) return null;
    var per = p.pr / p.inh;
    if (u === p.u) return per * a;
    if (p.u === 'g' && u === 'stuk' && p.sg) return per * a * p.sg;
    if (p.u === 'stuk' && u === 'g' && p.sg) return per * a / p.sg;
    return null;
  }
  function p100(p) { return (p.pr != null && p.inh > 0 && p.u !== 'stuk') ? p.pr / p.inh * 100 : null; }
  function vvCandidates(e) {
    var p = prodById(e.pid); if (!p || e.amt == null) return { none: 'Van dit product weet ik de hoeveelheid niet.' };
    var u = e.u || p.u, a = e.amt, pr0 = priceFor(p, a, u);
    if (pr0 == null) return { none: 'Bij ' + p.n + ' staat nog geen prijs of inhoud bij Producten, dus ik kan niet vergelijken.' };
    var k0 = kcalFor(p, a, u), cs0 = catsOf(p), l0 = labelsOf(p).map(function (l) { return l.id; });
    var list = [];
    S.prijzen.forEach(function (c) {
      if (c.id === p.id) return;
      if (!catsOf(c).some(function (x) { return cs0.indexOf(x) >= 0; })) return;
      var pc = priceFor(c, a, u), kc = kcalFor(c, a, u);
      if (pc == null || kc == null || pc >= pr0 - 0.005) return;
      if (k0 != null && kc > k0 + 0.5) return;
      var per0 = p100(p), per1 = p100(c);
      if (per0 != null && per1 != null && per1 >= per0) return;
      var lc = labelsOf(c).map(function (l) { return l.id; });
      var kept = 0, lost = [];
      ['eiwit', 'vezel', 'suiker', 'zout', 'verz'].forEach(function (id) { if (l0.indexOf(id) >= 0) { if (lc.indexOf(id) >= 0) kept++; else lost.push(id); } });
      var note = '';
      var e0 = p.w && p.w.eiwit, e1 = c.w && c.w.eiwit;
      if (e0 != null && e1 != null && e0 > 0 && e1 < e0 * 0.7) note = 'Let op: veel minder eiwit';
      else if (lost.indexOf('eiwit') >= 0) note = 'Let op: niet meer eiwitrijk';
      else if (lost.indexOf('vezel') >= 0) note = 'Let op: minder vezels';
      list.push({ c: c, save: pr0 - pc, kept: kept, lost: lost.length, note: note, lab: labelsOf(c).filter(function (l) { return ['eiwit', 'vezel'].indexOf(l.id) >= 0; }).map(function (l) { return l.i + ' ' + l.n; }).join(', ') });
    });
    list.sort(function (x, y) { return (x.lost - y.lost) || (y.save - x.save) || (y.kept - x.kept); });
    if (!list.length) return { none: 'Ik vond niets in je Prijzen-lijst dat in dezelfde categorie goedkoper is en niet meer kcal heeft voor deze hoeveelheid.' };
    return { list: list.slice(0, 3) };
  }
  function vvPanel(e) {
    var r = vvCandidates(e), h = '<div class="icatpanel"><p class="hint" style="margin:0 0 6px">Goedkoper in dezelfde categorie, bij dezelfde hoeveelheid (' + esc(label(e)) + '):</p>';
    if (r.none) h += '<p class="hint" style="margin:0 0 6px">' + esc(r.none) + '</p>';
    else r.list.forEach(function (x) {
      h += '<button class="opt" data-act="vvgo" data-id="' + e.id + '" data-p="' + x.c.id + '"><span class="on">' + esc(x.c.n) + '<small>Scheelt ' + esc(eur(x.save)) + (x.lab ? ' · ' + esc(x.lab) : '') + (x.note ? ' · ' + esc(x.note) : '') + '</small></span></button>';
    });
    return h + '<button class="tolink" data-act="vvno">Sluiten</button></div>';
  }
  // ---- v28: combi-suggestie, alleen op je eigen weken
  function combiList(es) {
    if (!es.length || !S.sheet) return [];
    var slot = S.sheet.slot, pair = {}, last = {}, have = {};
    es.forEach(function (e) { have[e.key] = true; });
    Object.keys(S.days).forEach(function (did) {
      var seen = {}, ks = [];
      (S.days[did].entries || []).forEach(function (e) {
        if (e.slot !== slot || e.grp || !e.key || e.key === 'AV' || e.key.indexOf('AV:') === 0) return;
        if (!seen[e.key]) { seen[e.key] = true; ks.push(e.key); }
        last[e.key] = e;
      });
      ks.forEach(function (a) { ks.forEach(function (b) { if (a !== b) { pair[a + '>' + b] = (pair[a + '>' + b] || 0) + 1; } }); });
    });
    var out = [];
    Object.keys(have).forEach(function (a) {
      Object.keys(last).forEach(function (b) {
        if (have[b] || !(pair[a + '>' + b] >= 3)) return;
        if (S.cbSkip && S.cbSkip[slot + '|' + b]) return;
        var le = last[b];
        if (le.pid && !prodById(le.pid)) return;
        var ex = out.filter(function (o) { return o.key === b; })[0];
        if (ex) { if (pair[a + '>' + b] > ex.n) ex.n = pair[a + '>' + b]; } else out.push({ key: b, n: pair[a + '>' + b], e: le });
      });
    });
    out.sort(function (x, y) { return y.n - x.n; });
    return out.slice(0, 2);
  }
  function combiHtml(es) {
    return combiList(es).map(function (o) {
      return '<div class="orow"><button class="opt" data-act="cbadd" data-key="' + esc(o.key) + '"><span class="on">Ook ' + esc(label(o.e)) + ' toevoegen?<small>Dat kies je vaak hierbij</small></span><span class="n">+</span></button>' +
        '<button class="delbtn" data-act="cbno" data-key="' + esc(o.key) + '" aria-label="Niet meer voorstellen">×</button></div>';
    }).join('');
  }
  function laatstBlock(m) { // v54.2 (13 nov 07:30): in de Toevoegen-popup ook de laatste 4 producten van dit moment als kies-rij (dicht)
    var out = [], seen = {};
    Object.keys(S.days || {}).sort().reverse().forEach(function (did) {
      (S.days[did].entries || []).forEach(function (e) {
        if (out.length >= 4 || e.slot !== m.slot || e.recipe || !e.pid) return;
        var p = prodById(e.pid); if (!p || seen[p.id]) return; seen[p.id] = 1; out.push(p);
      });
    });
    (S.fav || []).slice().sort(function (a, b) { return b.t - a.t; }).forEach(function (f) {
      if (out.length >= 4) return;
      var p = findProd(f.name); if (p && !seen[p.id]) { seen[p.id] = 1; out.push(p); }
    });
    if (!out.length) return '';
    var h = '<details class="grp" style="margin-top:10px"><summary><span>🕑 Laatst gekozen</span><span class="gcnt">' + out.length + '</span></summary><div style="padding:0 4px 6px">';
    out.forEach(function (p) {
      var kct = (p.u === 'stuk' && p.kst != null) ? Math.round(p.kst) + ' kcal/stuk' : (p.kc != null ? p.kc + ' kcal/100g' : 'nog geen kcal');
      h += '<div class="orow"><button class="opt" data-act="pkask" data-p="' + p.id + '"><span class="on">' + esc(p.n) + '<small>eigen product · ' + esc(kct) + '</small></span></button></div>';
      if (S.prodAsk === p.id) h += pkPanel(p); // v54.3 (12 nov): Laatst gekozen-kaartje reageert ook — tik opent het paneel
    });
    return h + '</div></details>';
  }
  function freeKiesHtml() { // v54.2 (13 nov 07:15): kies-kaartjes na 🔎 Zoeken — zónder "Zelf invullen…"
    if (S.freeBusy) return '<p class="hint zz" style="margin:8px 0">🔍 Zoeken…</p>';
    if (!S.freeKies || !S.freeKies.length) return '';
    var h = '<div style="margin-top:8px">';
    S.freeKies.forEach(function (k, i) {
      h += '<button class="wkitem" type="button" data-act="freekies" data-i="' + i + '" style="width:100%;text-align:left"><span class="nm">' + esc(k.naam || '') + '<small>opgezocht' + (k.bron ? ' (' + esc(k.bron) + ')' : ' (OFF, NL eerst)') + (k.kcal100 != null ? ' · ' + k.kcal100 + ' kcal/100g' : '') + '</small></span></button>';
    });
    return h + '</div>';
  }
  function renderSheet(fresh) {
    if (!S.sheet) return;
    if (S.sheet.day === 'normaal') { renderNormaalSheet(fresh); return; } // v49.1: productkiezer voor "Mijn normale dag"
    var info = sheetMoment(), m = info.m, d = dayDoc(S.sheet.day);
    if (!m) { forceCloseSheet(); return; }
    var body = $('pbody'), keep = fresh ? 0 : body.scrollTop;
    $('st').textContent = 'Toevoegen · ' + m.t; // v54.1 deel 5: kop zoals canvas v2
    $('sp').textContent = cap(DOW[info.dow]) + ' ' + short(info.date) + (mp(m) ? ' · ' + mp(m) : '');
    if (m.slot === 'move') {
      var mv = d.move || {};
      var mh = '<h3>Wat heb je gedaan?</h3><p class="hint" style="margin-top:0">Tik aan wat je deed. Nog een keer tikken haalt het weg.</p>';
      MOVE_PICKS.forEach(function (pk) {
        var on = !!mv[pk.id];
        mh += '<button class="opt" data-act="mvpick" data-a="' + pk.id + '" aria-pressed="' + on + '"><span class="on">' + esc(pk.t) + (pk.d ? '<small>' + esc(pk.d) + '</small>' : '') + '</span>' + (on ? '<span class="n">✓</span>' : '') + '</button>';
        if (pk.id === 'efiets' && on) mh += '<input class="note" id="efietstxt" type="text" maxlength="200" autocomplete="off" style="margin-top:6px" placeholder="Ondersteuning, bijvoorbeeld: heen en terug op één na hoogste" aria-label="Welke ondersteuning" value="' + esc(mv.efietsTxt || '') + '">';
      });
      if (mv.fiets) mh += '<p class="hint">Eerder ingevuld: Elektrisch fietsen: ' + esc(mv.fiets) + ' <button class="tolink" data-act="mvold" data-a="fiets" style="display:inline">weghalen</button></p>';
      if (mv.wandel && !hasWalk(info.dow)) mh += '<p class="hint">Eerder ingevuld: Wandelen, 30 minuten: ' + esc(mv.wandel) + ' <button class="tolink" data-act="mvold" data-a="wandel" style="display:inline">weghalen</button></p>';
      moveActs(info.dow).forEach(function (a) {
        mh += '<h3>' + esc(a.t) + '</h3><div class="seg mvact">' + a.o.map(function (o) {
          return '<button class="pill" data-act="mv" data-a="' + a.id + '" data-v="' + esc(o) + '" aria-pressed="' + (mv[a.id] === o) + '">' + esc(o) + '</button>';
        }).join('') + '</div>';
      });
      mh += '<h3>Toelichting (hoeft niet)</h3><textarea class="note" id="movenote" rows="3" maxlength="500" placeholder="Bijvoorbeeld: niet gefietst vanwege het weer">' + esc(d.moveNote || '') + '</textarea>';
      mh += '<h3>Stappen van je smartwatch (schatting)</h3><div class="kcalrow"><input id="steps" type="text" inputmode="numeric" autocomplete="off" placeholder="Bijvoorbeeld 6500" value="' + (d.steps ? esc(String(d.steps)) : '') + '" aria-label="Aantal stappen vandaag"></div><p class="hint">Invullen hoeft niet. Een smartwatch telt tillen op werk ook mee, dus dit is een ruwe schatting.</p>';
      body.innerHTML = mh; body.scrollTop = keep; return;
    }
    if (m.slot === 'eod') {
      var ee = d.eod || {};
      var eh = '<p class="hint" style="margin-top:10px">Aan het eind van de dag. Het waarom van iets extras zet je bij het moment zelf. Dit is om te begrijpen wat je nodig had, niet om te beoordelen. Tik nog een keer op je keuze om hem weg te halen.</p>';
      eh += '<h3>Hoeveel trek heb je nog?</h3><div class="seg mvact">' + TREK.map(function (o) {
        return '<button class="pill" data-act="trek" data-v="' + esc(o) + '" aria-pressed="' + (ee.trek === o) + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
      eh += '<h3>Toelichting (hoeft niet)</h3><input class="note" id="note" type="text" maxlength="400" autocomplete="off" placeholder="Bijvoorbeeld: veel trek na het sporten" value="' + esc(d.notes.eod || '') + '">';
      body.innerHTML = eh; body.scrollTop = keep; return;
    }
    var es = d.entries.filter(function (e) { return e.slot === S.sheet.slot; });
    var counts = {}; es.forEach(function (e) { counts[e.key] = (counts[e.key] || 0) + 1; });
    var h = ''; // v54.1 deel 5: GEKOZEN/Vervang dit/Alles weghalen/Bewaar als recept horen NIET in de Toevoegen-popup (canvas v2)
    // v53.9: geen apart in-één-tik-blok meer — recepten voor dit moment staan in het lege Zoeken-overzicht
    var prev = prevEntries();
    if (fresh) S.isq = '';
    S._is = function () { return searchHtml(m, counts); };
    if (S.sheet.note) { // v55.2 (13 nov): alléén bij een notitie: notitie-blokje + chips bovenaan (NIET in de gewone popup)
      h += '<p class="hint zz" style="margin:0 0 4px;font-weight:700">Jouw notitie</p><div class="briefje">' + esc(S.sheet.note) + '</div>';
      h += noteChipsHtml();
    }
    h += ditMomentHtml(); // v55.2 (13 nov) PUNT 1B: DIT EETMOMENT-buffer staat in élke Toevoegen-popup (boven ZOEKEN) — tikken zet regels hier, niets gaat direct de dag in
    h += '<h3>Zoeken</h3><input class="note" id="isearch" type="search" autocomplete="off" placeholder="🔍 Zoek in je producten en recepten" aria-label="Zoek in de eetlijst" value="' + esc(S.isq || '') + '"><div id="isres">' + searchHtml(m, counts) + '</div>';
    if (NOPHOTO.indexOf(m.slot) < 0) h += recPickBlock(m.slot);
    h += laatstBlock(m); // v54.2 (13 nov 07:30): laatste 4 producten van dit moment als kies-rij
    var fU = S.freeU || 'g';
    // v54.2 (13 nov 07:15): uitklapje DICHT met naamveld, eenheden + "meer ▾", en TWEE knoppen: 🔎 Zoeken (AI-opzoek, kies-kaartjes NL eerst) / ✏️ Toevoegen (direct opslaan, kcal later — nóóit automatisch opzoeken)
    h += '<details class="grp" style="margin-top:10px" id="freedet"' + (S.freeDetOpen ? ' open' : '') + '><summary><span>✏️ Zelf iets toevoegen</span></summary><div style="padding:0 4px 6px">' +
      '<div class="rowx" style="margin-top:8px"><input id="freename" class="note" type="text" maxlength="80" autocomplete="off" placeholder="' + (m.slot === 'av' ? 'Bijvoorbeeld: Bloemkoolovenschotel' : 'Bijvoorbeeld: Kruidenroomkaas') + '" aria-label="Wat was het"></div>' +
      '<div class="seg mvact" id="funits">' + [['g', 'Gram'], ['ml', 'Milliliter'], ['stuk', 'Stuks']].map(function (u) { return '<button class="pill" data-act="fu" data-v="' + u[0] + '" aria-pressed="' + (fU === u[0]) + '">' + u[1] + '</button>'; }).join('') + '<button class="pill" type="button" data-act="freemore" aria-expanded="' + (!!S.freeMore) + '">meer ▾</button></div>' +
      (S.freeMore ? '<div class="seg mvact">' + [['snee', 'Snee'], ['bol', 'Bol'], ['bakje', 'Bakje'], ['handje', 'Handje'], ['plakje', 'Plakje'], ['eetlepel', 'Eetlepel']].map(function (u) { return '<button class="pill" data-act="fu" data-v="' + u[0] + '" aria-pressed="' + (fU === u[0]) + '">' + u[1] + '</button>'; }).join('') + '</div>' : '') +
      // v55.2 (13 nov) PUNT 5a: het kleine zoekbalkje (freeq) in dit uitklapje is WEG — dubbelop met de gewone ZOEKEN-balk erboven
      '<div class="rowx" style="margin-top:8px"><button class="btn zoek" type="button" data-act="freezoek" style="flex:1;justify-content:center">🔎 Zoeken</button><button class="btn main" type="button" data-act="freeadd" style="flex:1;justify-content:center">✏️ Toevoegen</button></div>' +
      freeKiesHtml() +
      '</div></details>';
    // v53.6/v53.7 (layout-ronde deel 1): Toevoegen-gordijn slank — Meest gekozen, Blader per categorie en Wat was het? zijn niet meer te zien; Laatst toegevoegd staat in het lege Zoeken-overzicht
    function gOpen(key, def) { return S.grpOpen[key] == null ? def : S.grpOpen[key]; }
    if (m.slot === 'av') {
      var ax = d.avExtra || {};
      h += '<h3>Erbij gegeten (hoeft niet)</h3><div class="seg mvact">' +
        '<button class="pill" data-act="avx" data-v="rauwkost" aria-pressed="' + (!!ax.rauwkost || (S.sheet && S.sheet.buf && (S.sheet.sel || []).some(function (s) { return s.t === 'avx' && s.v === 'rauwkost'; }))) + '">met rauwkost erbij</button>' +
        '<button class="pill" data-act="avx" data-v="fruit" aria-pressed="' + (!!ax.fruit || (S.sheet && S.sheet.buf && (S.sheet.sel || []).some(function (s) { return s.t === 'avx' && s.v === 'fruit'; }))) + '">met fruit erbij</button></div>';
    }
    if (WHYSLOTS.indexOf(S.sheet.slot) >= 0) {
      h += '<h3>Waarom at je dit? (hoeft niet, meerdere mag)</h3><div class="seg mvact">' + WHY.filter(function (o) { return o !== 'Zo gepland'; }).map(function (o) {
        return '<button class="pill" data-act="swhy" data-v="' + esc(o) + '" aria-pressed="' + (whyOf(d, S.sheet.slot).indexOf(o) >= 0) + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
      h += '<input class="note" id="whynote" type="text" maxlength="300" autocomplete="off" style="margin-top:8px" placeholder="Of typ zelf je reden (hoeft niet)" aria-label="Eigen reden" value="' + esc(whyTextOf(d, S.sheet.slot)) + '">';
    }
    // v53.6 (layout-ronde deel 1): "Wat was het? (hoeft niet)" staat niet meer in dit scherm — notities maak je via het zeg-kaartje bovenaan de Week
    // v55.2 (13 nov) PUNT 1B punt 5: onderaan áltijd de groene knop — pas actief bij n>0; dán gaat alles in één keer het moment in én sluit de popup
    var nN = (S.sheet.sel || []).length;
    h += '<div style="margin-top:14px"><button class="btn main" type="button" data-act="sheetconfirm" style="width:100%"' + (nN > 0 ? '' : ' disabled') + '>Toevoegen (' + nN + ')</button>' +
      (S.sheet.note ? '<button class="tolink" type="button" data-act="sheettext" style="margin-top:8px">Alleen als tekst bewaren</button>' : '') + '</div>'; // v55.1: vangnet alléén in het notitie-uitwerk-scherm
    body.innerHTML = h;
    body.scrollTop = keep;
  }
  // v55.1 (12 nov) — chips UIT JE NOTITIE: ALLE herkende woorden (niet alleen het eerste), via Plank + aliaslijst "andere namen"
  function noteChipsHtml() {
    var note = S.sheet.note || '';
    var woorden = normWoorden(note).filter(function (w) { return w.length > 2 && !ZEG_STOPW[w]; });
    var chips = [], seenW = {};
    woorden.forEach(function (w) {
      if (seenW[w]) return; // v56.2 punt 5: elk herkend woord 1x als chip (was: per matchend product een chip)
      var hit = null;
      (S.prijzen || []).forEach(function (p) {
        if (hit) return;
        var nw = normWoorden(prodKeys(p).join(' '));
        if (nw.indexOf(w) >= 0) hit = p;
      });
      if (hit) { seenW[w] = 1; chips.push({ w: w, p: hit }); }
    });
    if (!chips.length) return '';
    var h = '<p class="hint zz" style="margin:10px 0 4px;font-weight:700">UIT JE NOTITIE — tik om toe te voegen</p><div class="chiprow">';
    chips.forEach(function (c) {
      var added = !!(S.sheet.added && S.sheet.added['P:' + c.p.id]);
      h += '<button class="fchip' + (added ? ' on' : '') + '" type="button" data-act="notechip" data-p="' + c.p.id + '" aria-pressed="' + added + '" title="' + esc(c.w + ' → ' + c.p.n) + '">' + esc(c.w) + (added ? ' ✔' : '') + '</button>';
    });
    return h + '</div>';
  }
  function ditMomentHtml() { // v55.1 (12 nov): "DIT EETMOMENT" — alle gekozen dingen (chips én zoekresultaten) op één plek, per regel aantal + eenheid + ✕
    var sel = (S.sheet && S.sheet.sel) || [];
    var h = '<h3 style="margin-top:14px">DIT EETMOMENT (' + sel.length + ')</h3>';
    if (!sel.length) h += '<p class="hint stat" style="margin-top:0">Nog niets aangevinkt — tik op een chip hierboven of op een zoekresultaat.</p>';
    sel.forEach(function (s, i) {
      if (s.t === 'avx') { // v55.2 (13 nov) PUNT 1B: ERBIJ GEGEVEN-regel in de buffer
        var avNm = s.v === 'rauwkost' ? 'met rauwkost erbij' : s.v === 'fruit' ? 'met fruit erbij' : s.v;
        h += '<div class="orow" style="align-items:center"><span class="on" style="flex:1;min-width:0"><b>' + esc(avNm) + '</b> <small class="hint">erbij gegeten</small></span>' +
          '<button class="delbtn" type="button" data-act="seldel" data-i="' + i + '" aria-label="Haal ' + esc(avNm) + ' weg">✕</button></div>';
        return;
      }
      var nm = s.t === 'r' ? (recEmoji(s.r) + ' ' + s.r.name) : s.p.n;
      var us = s.t === 'r' ? [s.r.unit || 'portie'] : prodUnits(s.p);
      h += '<div class="orow" style="align-items:center"><span class="on" style="flex:1;min-width:0"><b>' + esc(nm) + '</b> ' +
        '<input class="note selamt" data-i="' + i + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(fmtN(s.amt)) + '" style="width:60px;display:inline-block;margin:0 6px" aria-label="Aantal van ' + esc(nm) + '">' +
        '<select class="selunit" data-i="' + i + '" aria-label="Eenheid van ' + esc(nm) + '">' + us.map(function (u) { return '<option value="' + esc(u) + '"' + (u === s.u ? ' selected' : '') + '>' + esc(s.t === 'r' ? u : unitName(u, s.p)) + '</option>'; }).join('') + '</select></span>' +
        '<button class="delbtn" type="button" data-act="seldel" data-i="' + i + '" aria-label="Haal ' + esc(nm) + ' weg">✕</button></div>';
    });
    return h;
  }
  function hasSlot(d, slot) { return d.entries.some(function (e) { return e.slot === slot; }); }
  function prevEntries() {
    var p = S.sheet.day.split('-'), prev = fmtId(addDays(new Date(+p[0], +p[1] - 1, +p[2]), -1));
    var pd = S.days[prev];
    return pd && pd.entries ? pd.entries.filter(function (e) { return e.slot === S.sheet.slot; }) : [];
  }
  function rememberFav(name, k, p) {
    var key = name.toLowerCase() + '|' + k, f = S.fav.filter(function (x) { return x.key === key; })[0];
    if (f) { f.uses++; f.t = Date.now(); if (p != null) f.p = p; } else S.fav.push({ key: key, name: name, k: k, p: p == null ? null : p, uses: 1, t: Date.now() });
    S.fav.sort(function (a, b) { return b.t - a.t; });
    // v22: ruim bewaard (300 items), dus je raakt je eigen keuzes niet zomaar kwijt
    S.fav = S.fav.slice(0, 300);
  }
  function addEntry(e) {
    var d = dayDoc(S.sheet.day);
    e.id = uid(); e.slot = S.sheet.slot;
    d.entries.push(e);
    saveDay(S.sheet.day); renderSheet(false);
  }
  function applyQuick(q) {
    var d = dayDoc(S.sheet.day), slot = S.sheet.slot, list = BROOD[slot] && BROOD[slot][q], first = true, grp = uid();
    if (!list) return;
    list.forEach(function (r) {
      var f = findItem(r[0], r[1]); if (!f) return;
      d.entries.push({ id: uid(), slot: slot, key: r[0] + ':' + f.i, code: first ? q : '', grp: grp, name: f.it.n, k: f.it.k });
      first = false;
    });
    saveDay(S.sheet.day); renderSheet(false); toast('Optie ' + q + ' ingevuld');
  }

  // ---- foto
  function resizePhoto(file, cb, maxPx, quality) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var max = maxPx || 800, w = img.naturalWidth, h = img.naturalHeight, r = Math.min(1, max / Math.max(w, h));
      var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * r)); cv.height = Math.max(1, Math.round(h * r));
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      var out = ''; try { out = cv.toDataURL('image/jpeg', quality || 0.7); } catch (e) { }
      URL.revokeObjectURL(url); cb(out);
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(''); };
    img.src = url;
  }

  function removeGroup(grp) {
    var d = dayDoc(S.sheet.day), slot = S.sheet.slot;
    d.entries = d.entries.filter(function (e) { return !(e.slot === slot && e.grp === grp); });
    saveDay(S.sheet.day); renderSheet(false); toast('Optie weggehaald');
  }
  // v48 Week-ronde: binnen een productkaart maar één inklapblok tegelijk open
  document.addEventListener('toggle', function (ev) {
    var t = ev.target;
    if (!t || t.tagName !== 'DETAILS' || !t.classList.contains('psum') || !t.open) return;
    var wrap = t.closest('.prodsumwrap') || t.parentElement;
    if (!wrap) return;
    wrap.querySelectorAll('details.psum[open]').forEach(function (d) { if (d !== t) d.open = false; });
  }, true);
  // v55.2 (13 nov) PUNT 3: één recept-uitklap tegelijk — in de Toevoegen-popup, het notitie-uitwerk-scherm én de Recepten-tab;
  // een kaartje dichtklappen sluit óók zijn ingrediënten-uitklap
  document.addEventListener('toggle', function (ev) {
    var t = ev.target;
    if (!t || t.tagName !== 'DETAILS' || !t.classList.contains('rcard') || !t.open) return;
    var wrap = t.closest('#pbody, #werkbody, #reclist') || t.parentElement;
    if (!wrap) return;
    wrap.querySelectorAll('details.rcard[open]').forEach(function (d) {
      if (d === t) return;
      d.querySelectorAll('details[open]').forEach(function (x) { x.open = false; });
      d.open = false;
    });
  }, true);
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act'), id = el.getAttribute('data-day');
    if (act !== 'slotclear' && S.sheet && S.confirmClear) S.confirmClear = false;
    if (act !== 'favdel') S.confirmFavDel = null;
    // v48 Week-ronde: één dag tegelijk open (dicht-geheugen); tik op open dag sluit hem
    if (act === 'day') { var wasOpen = !!S.open[id]; S.open = {}; if (!wasOpen) S.open[id] = true; S.mopen = {}; S.dopen = {}; render(); }
    else if (act === 'dagdeel') { var dg = el.getAttribute('data-dagdeel'); var wasD = !!(S.dopen && S.dopen[id] === dg); S.dopen = {}; if (!wasD) S.dopen[id] = dg; render(); }
    else if (act === 'zegmomdd') { // v53.1: pijltje rechts in de titelregel = echte uitklap-lijst met de momenten (kiezen, niet wisselen)
      ev.preventDefault(); // klik in de summary mag het kaartje zélf niet open/dicht klappen
      S.zegMomOpen = !S.zegMomOpen; render();
    }
    else if (act === 'zegmomentkies') { // v53.1: kies een moment uit de uitklap-lijst
      ev.preventDefault();
      S.zegMoment = el.getAttribute('data-t'); S.zegMomOpen = false; render();
    }
    else if (act === 'zegbewaar') { // v53.1: opslaan = notitie bij het gekozen moment op de gekozen dag (geen opzoek, geen kcal)
      var zb = el.getAttribute('data-day'), zin = String(S.zegIn || '').trim();
      if (!zin) { toast('Typ eerst even wat je at'); return; }
      var msB = zegMomentLijst(zb), momB = zegMomentActief(zb);
      var slotB = (msB.filter(function (m) { return m.t === momB; })[0] || msB[0] || { slot: 'extra' }).slot;
      var dB = dayDoc(zb), oudB = dB.notes && dB.notes[slotB];
      dB.notes[slotB] = ((oudB ? oudB + ' / ' : '') + zin).slice(0, 400);
      S.zegIn = ''; try { localStorage.removeItem('eetweek.zegIn'); } catch (e2) {} persist(); render(); toast('Notitie bewaard bij ' + momB);
    }
    else if (act === 'zegtekst') { // v55.1 (12 nov): 📝 Alleen tekst — blijvend tekstregeltje bij het moment, géén kcal, nooit openklikken
      var zb2 = el.getAttribute('data-day'), zin2 = String(S.zegIn || '').trim();
      if (!zin2) { toast('Typ eerst even wat je at'); return; }
      var msB2 = zegMomentLijst(zb2), momB2 = zegMomentActief(zb2);
      var slotB2 = (msB2.filter(function (m) { return m.t === momB2; })[0] || msB2[0] || { slot: 'extra' }).slot;
      var dB2 = dayDoc(zb2);
      dB2.tnotes = dB2.tnotes || {}; dB2.tnotes[slotB2] = dB2.tnotes[slotB2] || [];
      dB2.tnotes[slotB2].push({ id: uid(), t: zin2.slice(0, 400) });
      S.zegIn = ''; try { localStorage.removeItem('eetweek.zegIn'); } catch (e2) {} persist(); render(); toast('Tekst bewaard bij ' + momB2);
    }
    else if (act === 'notewerk') { // v55.0 (12 nov): tik op het briefje opent het TOEVOEGEN-scherm mét het notitie-blokje bovenaan + suggestie-chips
      var nd = el.getAttribute('data-day'), ns = el.getAttribute('data-slot');
      var dN = dayDoc(nd), tekst = (dN.notes && dN.notes[ns]) || '';
      if (!tekst) return;
      openSheet(nd, ns);
      S.sheet.note = tekst; S.sheet.sel = []; S.sheet.added = {};
      renderSheet(true);
    }
    else if (act === 'notedel') { // v55.0 (12 nov): klein ✕ op het briefje — notitie direct weg, + Toevoegen-blokje komt terug
      var nd9 = el.getAttribute('data-day'), ns9 = el.getAttribute('data-slot');
      var dd9 = dayDoc(nd9);
      if (dd9.notes && dd9.notes[ns9]) delete dd9.notes[ns9];
      persist(); render(); toast('Notitie weggehaald');
    }
    else if (act === 'tnotewerk') { // v55.1 (12 nov): ✏️ op een tekstnotitie — wordt briefje mét chips (uitwerk-flow)
      var ndT = el.getAttribute('data-day'), nsT = el.getAttribute('data-slot'), idT = el.getAttribute('data-id');
      var dT = dayDoc(ndT), tnT = (dT.tnotes && dT.tnotes[nsT]) || [];
      var xT = tnT.filter(function (x) { return x.id === idT; })[0];
      if (!xT) return;
      dT.tnotes[nsT] = tnT.filter(function (x) { return x.id !== idT; });
      if (!dT.tnotes[nsT].length) delete dT.tnotes[nsT];
      var oudT = dT.notes && dT.notes[nsT];
      dT.notes[nsT] = ((oudT ? oudT + ' / ' : '') + xT.t).slice(0, 400); // briefje (max 1) — tekst appended als er al een was
      persist(); render(); toast('Tekstnotitie omgezet in briefje — tik erop om uit te werken');
    }
    else if (act === 'tnotedel') { // v55.1 (12 nov): ✕ op een tekstnotitie — weg
      var ndD = el.getAttribute('data-day'), nsD = el.getAttribute('data-slot'), idD = el.getAttribute('data-id');
      var dD = dayDoc(ndD), tnD = (dD.tnotes && dD.tnotes[nsD]) || [];
      dD.tnotes[nsD] = tnD.filter(function (x) { return x.id !== idD; });
      if (dD.tnotes && dD.tnotes[nsD] && !dD.tnotes[nsD].length) delete dD.tnotes[nsD];
      persist(); render(); toast('Tekstnotitie weggehaald');
    }
    else if (act === 'sheettext') { // v55.1 (12 nov): vangnet in het uitwerk-scherm — briefje alsnog als tekstregeltje bewaren (NIET weghalen als er al een briefje is: dit IS het briefje)
      if (!S.sheet || !S.sheet.note) return;
      var dS = dayDoc(S.sheet.day);
      if (dS.notes && dS.notes[S.sheet.slot]) {
        dS.tnotes = dS.tnotes || {}; dS.tnotes[S.sheet.slot] = dS.tnotes[S.sheet.slot] || [];
        dS.tnotes[S.sheet.slot].push({ id: uid(), t: dS.notes[S.sheet.slot].slice(0, 400) });
        delete dS.notes[S.sheet.slot];
      }
      persist(); forceCloseSheet(); toast('Alleen als tekst bewaard — geen kcal');
    }
    else if (act === 'notechip') { // v55.0 (12 nov): chip uit de notitie — tik = toevoegen aan DIT EETMOMENT (nogmaals tik = eraf)
      if (!S.sheet || !S.sheet.buf) return;
      var pc9 = prodById(el.getAttribute('data-p')); if (!pc9) return;
      var selC = S.sheet.sel.filter(function (s) { return s.t === 'p' && s.p.id === pc9.id; })[0];
      if (selC) { S.sheet.sel = S.sheet.sel.filter(function (s) { return s !== selC; }); delete S.sheet.added['P:' + pc9.id]; }
      else { var usC = prodUnits(pc9); S.sheet.sel.push({ t: 'p', p: pc9, amt: 1, u: (pc9.eh && usC.indexOf(pc9.eh) >= 0) ? pc9.eh : usC[0] }); S.sheet.added['P:' + pc9.id] = true; }
      renderSheet(false);
    }
    else if (act === 'seldel') { // v55.0 (12 nov): ✕ op een regel van DIT EETMOMENT — v55.2: in élke buffer-popup
      if (!S.sheet || !S.sheet.buf) return;
      var i9 = +el.getAttribute('data-i'), s9 = (S.sheet.sel || [])[i9];
      if (s9) { S.sheet.sel.splice(i9, 1); if (s9.t === 'p') delete S.sheet.added['P:' + s9.p.id]; else delete S.sheet.added['R:' + s9.r.id]; }
      renderSheet(false);
    }
    else if (act === 'sheetconfirm') { // v55.2 (13 nov) PUNT 1B: "Toevoegen (n)" — ALLES in één keer het moment in, popup dicht; bij een notitie verdwijnt het briefje automatisch
      if (!S.sheet || !S.sheet.buf) return;
      var nC0 = (S.sheet.sel || []).length; if (!nC0) { toast('Nog niets aangevinkt'); return; }
      var dC = dayDoc(S.sheet.day), nC = 0;
      var hadNote = !!(S.sheet && S.sheet.note); // v57: onthouden vóór forceCloseSheet (zet S.sheet op null) — anders leest de toast S.sheet.note van null
      var warn1g = false; // v57.5: uitwerk-scherm — product bevestigd terwijl de hoeveelheid nog op de standaard 1 g staat
      (S.sheet.sel || []).forEach(function (s) {
        if (s.t === 'r') { addRecipeAt(s.r, S.sheet.day, S.sheet.slot, s.amt || 1); nC++; }
        else if (s.t === 'avx') { dC.avExtra = dC.avExtra || {}; dC.avExtra[s.v] = !dC.avExtra[s.v]; if (!dC.avExtra[s.v]) delete dC.avExtra[s.v]; nC++; }
        else { var pC = s.p, uC = s.u, aC = num(s.amt) != null && num(s.amt) > 0 ? num(s.amt) : 1; if (hadNote && uC === 'g' && (num(s.amt) == null || num(s.amt) === 1)) warn1g = true; addProdEntry(pC, aC, uC, kcalFor(pC, aC, uC)); nC++; }
      });
      if (S.sheet.note && dC.notes && dC.notes[S.sheet.slot]) delete dC.notes[S.sheet.slot]; // notitie uitgewerkt = automatisch weg
      persist();
      forceCloseSheet();
      toast('✔ ' + nC + (nC === 1 ? ' ding' : ' dingen') + ' in het moment gezet' + (hadNote ? ' — de notitie is uitgewerkt' : ''));
      if (warn1g) toast('Hoeveelheid staat nog op 1 g — klopt dat?'); // v57.5: wegklikbaar, blokkeert niet; de 1 g zelf blijft staan
    }
    else if (act === 'kaartclose') { var ksh = $('kaartsheet'); if (ksh) ksh.hidden = true; if (window.APP && APP.kaartjes && APP.kaartjes.close) APP.kaartjes.close(); else document.documentElement.classList.remove('lock'); } // v57: scrim/✕ van de kaartjes-kaart sluiten (net als kSluit)
    else if (act === 'mom') { var ms = el.getAttribute('data-slot'); var wasM = !!(S.mopen && S.mopen[id] === ms); S.mopen = {}; if (!wasM) S.mopen[id] = ms; if (S.msrc) Object.keys(S.msrc).forEach(function (k) { if (k.indexOf(id + ':') === 0) delete S.msrc[k]; }); render(); }
    else if (act === 'sheet') openSheet(id, el.getAttribute('data-slot'));
    else if (act === 'quick') applyQuick(el.getAttribute('data-q'));
    else if (act === "quickrec") {
      var qr = S.recipes.filter(function (x) { return x.id === el.getAttribute("data-r"); })[0];
      if (qr) { addRecipeEntry(qr.id, 1); toast(qr.name + " ingevuld"); }
    }
    else if (act === 'grpdel') removeGroup(el.getAttribute('data-grp'));
    else if (act === 'plak') setPlak(el.getAttribute('data-grp'), parseFloat(el.getAttribute('data-v')));
    else if (act === 'slotclear') {
      if (!S.confirmClear) { S.confirmClear = true; renderSheet(false); return; }
      var dc = dayDoc(S.sheet.day), sc = S.sheet.slot;
      dc.entries = dc.entries.filter(function (e) { return e.slot !== sc; });
      S.confirmClear = false; S.saveRec = false;
      saveDay(S.sheet.day); renderSheet(false); toast('Alles weggehaald');
    }
    else if (act === 'srstart') { S.saveRec = true; renderSheet(false); var si2 = $('srname'); if (si2) si2.focus(); }
    else if (act === 'srsave') {
      var srn = ($('srname').value || '').trim();
      if (!srn) { toast('Geef het recept een naam'); return; }
      if (saveSlotAsRecipe(srn)) { S.saveRec = false; renderSheet(false); toast('Bewaard bij Recepten'); }
    }
    else if (act === 'freeadd') {
      var fn = ($('freename').value || '').trim();
      if (!fn) { toast('Typ eerst wat het was'); return; }
      var fuu = S.freeU || 'g', fsgEl = $('fsg'), fkEl = $('fk100'), fgEl = $('fgram'); // v53.6: velden mogen ontbreken (layout-ronde: slank scherm)
      if (['g', 'ml', 'stuk'].indexOf(fuu) < 0) fuu = 'stuk'; // v54.2: snee/bol/bakje/handje/plakje/eetlepel = stuk
      var fkt = fkEl ? fkEl.value.trim() : '', fgt = fgEl ? fgEl.value.trim() : '', fst = (fuu === 'stuk' && fsgEl) ? fsgEl.value.trim() : '';
      var fp0 = fkt ? num(fkt) : null, fg0 = fgt ? num(fgt) : null, fs0 = fst ? num(fst) : null;
      var fsg2 = (fuu === 'stuk' && fs0 != null && fs0 > 0) ? fs0 : null;
      var fkmax = (fuu === 'stuk' && !fsg2) ? 5000 : 900;
      if (fkt && (fp0 == null || fp0 <= 0 || fp0 > fkmax)) { toast(fuu === 'stuk' && !fsg2 ? 'Kcal per stuk klopt niet, bijvoorbeeld 90' : 'Kcal per 100 g of ml klopt niet, bijvoorbeeld 520'); return; }
      if (fgt && (fg0 == null || fg0 <= 0 || fg0 > (fuu === 'stuk' ? 200 : 5000))) { toast(fuu === 'stuk' ? 'Aantal stuks klopt niet, bijvoorbeeld 2' : 'Hoeveelheid klopt niet, bijvoorbeeld 40'); return; }
      if (fst && (fs0 == null || fs0 <= 0 || fs0 > 5000)) { toast('Gram per stuk klopt niet, bijvoorbeeld 25'); return; }
      var fkU = null;
      if (fp0 != null && fg0 != null) fkU = fuu === 'stuk' ? (fsg2 ? fg0 * fsg2 * fp0 / 100 : fg0 * fp0) : fg0 * fp0 / 100;
      var fprod = ensureProduct(fn, fuu, fp0, fsg2);
      S.freeCats = [];
      if (fg0 != null) { fprod.la = fg0; addProdEntry(fprod, fg0, fuu, fkU != null ? fkU : kcalFor(fprod, fg0, fuu)); }
      else addEntry({ key: 'P:' + fprod.id, code: '', name: fn, k: null, pid: fprod.id });
      S.freeKies = null; S.freeMore = false;
      toast(fp0 != null && fg0 == null ? 'Toegevoegd. Zonder hoeveelheid kan ik de calorieën niet uitrekenen' : 'Toegevoegd — kcal nog te schatten');
    }
    else if (act === 'freemore') { S.freeMore = !S.freeMore; renderSheet(false); } // v54.2: "meer ▾" klap
    else if (act === 'freezoek') { // v54.2 (13 nov 07:30): 🔎 Zoeken BLIJFT AI — OFF-kies-kaartjes (top 4, NL eerst); de zoekbalk (freeq) is voor eigen producten/recepten
      var fn2 = ((($('freeq') && $('freeq').value) || ($('freename') && $('freename').value) || '')).trim();
      if (!fn2) { toast('Typ eerst wat je zoekt'); return; }
      S.freeBusy = true; S.freeKies = null; renderSheet(false);
      offZoek(fn2).then(function (off) {
        S.freeKies = ((off && off.kandidaten) || []).slice(0, 4);
        S.freeBusy = false; renderSheet(false);
      }).catch(function () { S.freeBusy = false; S.freeKies = []; renderSheet(false); toast('Niets gevonden bij opzoeken'); });
    }
    else if (act === 'freekies') {
      var fc = (S.freeKies || [])[+el.getAttribute('data-i')];
      if (fc) { var fnEl = $('freename'); if (fnEl) fnEl.value = fc.naam || fnEl.value; S.freeKc = fc.kcal100 != null ? fc.kcal100 : null; toast('Gekozen: ' + fc.naam); }
      S.freeKies = null; renderSheet(false);
    }
    else if (act === 'tab') { S.tab = el.getAttribute('data-t');
      if (S.tab === 'gem') document.querySelectorAll('#gemview details').forEach(function (d) { d.open = false; });
      // punt F (10 nov): Kookhulp/Cook-voorkeuren beginnen altijd met ALLE blokjes dicht
      S.confirmDel = null; S.confirmProd = null; S.confirmProdAll = null; S.confirmProdCat = null; S.confirmLijstAll = null; S.confirmLijstCat = null; S.confirmLijst = null; render(); window.scrollTo(0, 0); }
    else if (act === 'prsub') { S.prSub = el.getAttribute('data-v'); render(); }
    else if (act === 'wkrow') { var wl = el.nextElementSibling; if (wl) { var wop = wl.hidden; wl.hidden = !wop; el.setAttribute('aria-expanded', wop ? 'true' : 'false'); el.classList.toggle('open', wop); } }
    else if (act === 'wkall') { var wl2 = el.closest('.wlist'); if (wl2) { wl2.classList.add('alle'); el.hidden = true; } }
    else if (act === 'gotoweek') { var gd = el.getAttribute('data-day'); if (gd) { var p = gd.split('-'); S.start = startOfWeek(new Date(+p[0], +p[1] - 1, +p[2])); S.tab = 'week'; S.open = {}; S.open[gd] = true; S.mopen = {}; S.prSub = 'mijn'; render(); window.scrollTo(0, 0); var sec = document.querySelector('.dayhead[data-day="' + gd + '"]'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
    else if (act === 'gotoprod') { var pid = el.getAttribute('data-p'); if (pid) { var prod = prodById(pid); if (prod) { var ctxR = el.getAttribute('data-ctx'), ridC = el.getAttribute('data-r'), idxC = el.getAttribute('data-i'); var dayC = el.getAttribute('data-day'), eidC = el.getAttribute('data-e'); if (ctxR === 'rec') { openChoice({ name: prod.n, prod: prod, ctx: 'rec', rid: ridC, idx: idxC != null ? +idxC : null }); } else if (dayC && eidC) { openChoice({ name: prod.n, prod: prod, ctx: 'week', day: dayC, entryId: eidC }); } else { choiceGo(pid); } } } }
    else if (act === 'weekaddprod') { var wnm = el.getAttribute('data-n'); if (wnm) { var dayC2 = el.getAttribute('data-day'), eidC2 = el.getAttribute('data-e'); var ex2 = findProd(wnm); if (dayC2 && eidC2) { openChoice({ name: wnm, prod: ex2 || null, ctx: 'week', day: dayC2, entryId: eidC2 }); } else if (ex2) { openChoice({ name: wnm, prod: ex2 }); } else { openChoice({ name: wnm, prod: null }); } } }
    else if (act === 'ingchoice') { var icn = el.getAttribute('data-n'), icr = el.getAttribute('data-r'), ici = el.getAttribute('data-i'); var icp = el.getAttribute('data-p'); if (icn && icr != null && ici != null) { openChoice({ name: icn, prod: icp ? prodById(icp) : null, ctx: 'rec', rid: icr, idx: +ici }); } }
    else if (act === 'choiceclose') { closeChoice(); }
    else if (act === 'choiceback') { choiceShowList(false); }
    else if (act === 'choiceother') { choiceShowList(true); var olx = document.getElementById('choiceotherlist'); if (olx) { var orx = document.getElementById('choiceotherres'); if (!orx) { orx = document.createElement('div'); orx.id = 'choiceotherres'; olx.appendChild(orx); } orx.innerHTML = renderChoiceOther(''); var six = document.getElementById('choicesearch'); if (six) six.focus(); } }
    else if (act === 'choicebest') { choiceShowList(true); var olx = document.getElementById('choiceotherlist'); if (olx) { var orx = document.getElementById('choiceotherres'); if (!orx) { orx = document.createElement('div'); orx.id = 'choiceotherres'; olx.appendChild(orx); } orx.innerHTML = renderChoiceOther(''); var six = document.getElementById('choicesearch'); if (six) six.focus(); } }
    else if (act === 'choicename') { choiceNameOpen(); }
    else if (act === 'choicenamepart') { var cni = document.getElementById('choicenamein'); if (cni) cni.value = el.getAttribute('data-v') || ''; }
    else if (act === 'choicenamesave') { choiceNameSave(); }
    else if (act === 'choicego') { choiceGo(el.getAttribute('data-p')); }
    else if (act === 'chicenew') { choiceNew(); }
    else if (act === 'recgem') { S.recMenu = ''; if (window.mistralAanpas) window.mistralAanpas(el.getAttribute('data-r')); else if (!document.getElementById('gemview')) location.assign('kookhulp.html'); } // v58.1: ⋮-menuutje dicht na keuze // v57: op andere pagina's (multi-page) doorlinken naar kookhulp.html; v58: naamwissel Gemini→Mistral — geminiAanpas heet nu mistralAanpas
    else if (act === 'recmenu') { var mrid = el.getAttribute('data-r'); S.recMenu = S.recMenu === mrid ? '' : mrid; render(); } // v58: ⋮-menuutje op het kaartje open/dicht
    else if (act === 'recprep') { var prid = el.getAttribute('data-r'); if (window.mistralVoorbereiden) window.mistralVoorbereiden(prid); else { try { if (prid) sessionStorage.setItem('eetweek.vrRec', prid); } catch (e) {} location.assign('kookhulp.html'); } } // v58: 🧺 Voorbereiden — zelfde spring-patroon als de Mistral-knop (multi-page: recept-id via sessionStorage mee)
    else if (act === 'reccopy') { var cr = S.recipes.filter(function (x) { return x.id === el.getAttribute('data-r'); })[0]; if (cr) copyDirect((cr.ing || []).map(function (i) { return ingText(i, 1); }).join('\n'), 'rec', 'Ingrediënten kopiëren', 'Houd de tekst ingedrukt en kies Kopiëren.'); } // v58: 📋 Kopiëren — gewone regels, één ingrediënt per regel (zelfde tekst als bij Aanpassen met Mistral)
    else if (act === 'vrtoggle') { var vr2 = el.getAttribute('data-r'), vi2 = el.getAttribute('data-i'); S.vrChecks = S.vrChecks || {}; S.vrChecks[vr2] = S.vrChecks[vr2] || {}; S.vrChecks[vr2][vi2] = !S.vrChecks[vr2][vi2]; if (window.vrRender) window.vrRender(); } // v58: afvinkrondje in het Voorbereiden-blok (sessie)
    else if (act === 'recnew') recEditorOpen(null);
    else if (act === 'recedit') { S.recMenu = ''; recEditorOpen(S.recipes.filter(function (r) { return r.id === el.getAttribute('data-r'); })[0]); render(); } // v58.3: render() erbij — anders bleef het menuutje in het DOM staan (ook over het bewerk-scherm heen)
    else if (act === 'recopen') { var ro = S.recipes.filter(function (r) { return r.id === el.getAttribute('data-r'); })[0]; if (ro && window.openRecipe) window.openRecipe(ro.id); }
    else if (act === 'recdel') {
      var rd = el.getAttribute('data-r');
      if (S.confirmDel === rd) { S.recipes = S.recipes.filter(function (r) { return r.id !== rd; }); S.confirmDel = null; S.recMenu = ''; persist(); toast('Recept verwijderd'); } // v58.1: menu dicht na écht verwijderen (bij de eerste tik blijft het open voor "Echt verwijderen?")
      else S.confirmDel = rd;
      render();
    }
    else if (act === 'recadd') {
      if (S.sheet && S.sheet.buf) { // v55.2 (13 nov) PUNT 1B: in de buffer-popup gaat een recept-kaartje naar DIT EETMOMENT (met ✔ op het kaartje); niets direct in de dag
        var rr9 = S.recipes.filter(function (x) { return String(x.id) === String(el.getAttribute('data-r')); })[0];
        if (rr9) {
          var f9 = parseFloat(el.getAttribute('data-f')) || 1;
          var sel9 = S.sheet.sel.filter(function (s) { return s.t === 'r' && String(s.r.id) === String(rr9.id); })[0];
          if (sel9) { S.sheet.sel = S.sheet.sel.filter(function (s) { return s !== sel9; }); delete S.sheet.added['R:' + rr9.id]; }
          else { S.sheet.sel.push({ t: 'r', r: rr9, amt: f9, u: rr9.unit || 'portie' }); S.sheet.added['R:' + rr9.id] = true; }
          renderSheet(false);
        }
        return;
      }
      addRecipeEntry(el.getAttribute('data-r'), parseFloat(el.getAttribute('data-f')));
    }
    else if (act === 'recaddx') {
      var rid2 = el.getAttribute('data-r'), inp = el.parentNode.querySelector('input'), fv = inp ? num(inp.value) : null;
      if (fv == null || fv <= 0 || fv > 10) { toast('Vul een getal in, bijvoorbeeld 0,75'); return; }
      addRecipeEntry(rid2, fv);
    }
    else if (act === 'recclose') requestClose();
    else if (act === 'recsave') { if (recSave()) requestClose(); }
    else if (act === 'recwhere') {
      var wv = el.getAttribute('data-w'), wi = S.rec.where.indexOf(wv);
      if (wi >= 0) S.rec.where.splice(wi, 1); else S.rec.where.push(wv);
      renderRec(false);
    }
    else if (act === 'ingdel') { S.rec.ing.splice(+el.getAttribute('data-i'), 1); renderRec(false); }
    else if (act === 'ingpick') {
      var sv2 = el.getAttribute('data-v'); if (!sv2) return;
      if (sv2.charAt(0) === 'p') { var pp0 = prodById(sv2.slice(1)); if (!pp0) return; var kp = prodKcPer(pp0); var aw = antlWoord(pp0); S.rec.ing.push(aw ? { n: pp0.n, a: 1, u: aw, p: null } : { n: pp0.n, a: pp0.u === 'stuk' ? 1 : 100, u: pp0.u === 'stuk' ? 'stuk' : pp0.u, p: kp }); }
      else if (sv2.charAt(0) === 'd') { var x = ING_DB[+sv2.slice(1)]; S.rec.ing.push({ n: x[0], a: x[3], u: x[1], p: x[2] }); }
      else { var pr = sv2.slice(1).split(':'), it2 = G[pr[0]].items[+pr[1]]; S.rec.ing.push({ n: it2.n, a: 1, u: 'x', p: it2.k }); }
      S.ingq = ''; renderRec(false); toast('Toegevoegd');
    }
    else if (act === 'ingcustom') {
      var cn = ($('cname').value || '').trim(), ca = $('camt').value.trim();
      if (!cn || !ca) { toast('Vul naam en aantal in'); return; }
      var can = num(ca); S.rec.ing.push({ n: cn, a: can != null ? can : ca, u: $('cunit').value, p: null });
      renderRec(false);
    }
    else if (act === 'pasteopen') openPaste();
    else if (act === 'pjexport') saveProductsFile();
    else if (act === 'pasteclose') requestClose();
    else if (act === 'pastecheck') pasteCheck();
    else if (act === 'pastefile') { syncPaste(); $('pastefile').click(); }
    else if (act === 'pastewhere') {
      syncPaste();
      var pw = el.getAttribute('data-w'), pwi = S.paste.where.indexOf(pw);
      if (pwi >= 0) S.paste.where.splice(pwi, 1); else S.paste.where.push(pw);
      renderPaste();
    }
    else if (act === 'pastesave') pasteSave();
    else if (act === 'multiwhere' && S.paste && S.paste.multi) {
      var mm = S.paste.multi[+el.getAttribute('data-i')], mw = el.getAttribute('data-w');
      if (mm) { var mi = mm.where.indexOf(mw); if (mi >= 0) mm.where.splice(mi, 1); else mm.where.push(mw); renderPaste(); }
    }
    else if (act === 'multion' && S.paste && S.paste.multi) {
      var m2 = S.paste.multi[+el.getAttribute('data-i')]; if (m2) { m2.on = !m2.on; renderPaste(); }
    }
    else if (act === 'multisave') multiSave();
    else if (act === 'photoadd') $('photofile').click();
    else if (act === 'photodel') {
      var dp = dayDoc(S.sheet.day); if (dp.photos) delete dp.photos[S.sheet.slot];
      saveDay(S.sheet.day); renderSheet(false);
    }
    else if (act === 'avx') {
      var da = dayDoc(S.sheet.day), vx = el.getAttribute('data-v');
      if (S.sheet && S.sheet.buf) { // v55.2 (13 nov) PUNT 1B: ERBIJ GEGEVEN gaat óók via de buffer (regel in DIT EETMOMENT met ✕)
        var selA = S.sheet.sel.filter(function (s) { return s.t === 'avx' && s.v === vx; })[0];
        if (selA) S.sheet.sel = S.sheet.sel.filter(function (s) { return s !== selA; });
        else S.sheet.sel.push({ t: 'avx', v: vx, amt: 1, u: '' });
        renderSheet(false); return;
      }
      if (!da.avExtra) da.avExtra = {};
      if (da.avExtra[vx]) delete da.avExtra[vx]; else da.avExtra[vx] = true;
      saveDay(S.sheet.day); renderSheet(false);
    }
    else if (act === 'copyprev') {
      var dd = dayDoc(S.sheet.day);
      prevEntries().forEach(function (e) { var c = JSON.parse(JSON.stringify(e)); c.id = uid(); c.slot = S.sheet.slot; dd.entries.push(c); });
      saveDay(S.sheet.day); renderSheet(false);
    } else if (act === 'fav') {
      var fi0 = +el.getAttribute('data-i'), f = S.fav[fi0];
      if (f) {
        if (f.p != null) { S.favAsk = (S.favAsk !== '' && S.favAsk === fi0) ? '' : fi0; renderSheet(false); if (S.favAsk !== '') focusGram(); }
        else { var nm2 = f.name, k2 = f.k; rememberFav(nm2, k2); addEntry({ key: 'X:' + uid(), code: '', name: nm2, k: k2, exact: k2 != null }); }
      }
    } else if (act === 'favgo') {
      var fgi = +el.getAttribute('data-i'), fgf = S.fav[fgi], fgv = favGramVal();
      if (!fgf || fgf.p == null) return;
      if (fgv == null || fgv <= 0 || fgv > 5000) { toast('Vul de gram in, bijvoorbeeld 40'); return; }
      var fgn = fgf.name, fgp = fgf.p; S.favAsk = ''; rememberFav(fgn, fgf.k == null ? null : fgf.k, fgp);
      addEntry({ key: 'X:' + uid(), code: '', name: fgn + ', ' + fmtN(fgv) + ' g', k: Math.round(fgp * fgv / 100), exact: true, g: fgv, p: fgp }); toast('Toegevoegd');
    } else if (act === 'isadd') {
      var fnm = $('freename'); if (fnm) { fnm.value = (S.isq || '').trim(); fnm.focus(); try { fnm.scrollIntoView({ block: 'center' }); } catch (e) { } }
    } else if (act === 'favno') {
      S.favAsk = ''; renderSheet(false);
    } else if (act === 'fixask') {
      var fk = el.getAttribute('data-key');
      S.fixedAsk = (S.fixedAsk === fk ? '' : fk);
      renderSheet(false);
      if (S.fixedAsk) focusFixGram();
    } else if (act === 'fixno') {
      S.fixedAsk = ''; renderSheet(false);
    } else if (act === 'fixgo') {
      var fk2 = el.getAttribute('data-key'), parts = fk2.split(':'), it2 = itemsOf(parts[0])[+parts[1]];
      var fgi2 = fixedGramInfo(it2 ? it2.n : '');
      var fgv2 = fixGramVal();
      if (!fgi2 || fgv2 == null || fgv2 <= 0 || fgv2 > 5000) {
        var uDesc = fgi2 ? fixUnitPl(fgi2.u) : 'gram/ml';
        toast('Vul het aantal ' + uDesc + ' in');
        return;
      }
      var cal2 = Math.round(fgv2 * fgi2.rate);
      var uName = fgi2.u;
      if (fgi2.u === 'stuk') uName = fgv2 > 1 ? 'stuks' : 'stuk';
      else if (fgi2.u === 'plakje') uName = fgv2 > 1 ? 'plakjes' : 'plakje';
      else if (fgi2.u === 'theelepel') uName = fgv2 > 1 ? 'theelepels' : 'theelepel';
      var ename2 = fgi2.base + ', ' + fmtN(fgv2) + ' ' + uName;
      S.fixedAsk = '';
      addEntry({ key: fk2, code: '', name: ename2, k: cal2, exact: true, g: fgv2, p: fgi2.p100, u: fgi2.u, free: true });
      toast('Toegevoegd: ' + ename2);
    } else if (act === 'favfill') {
      var ffi = S.fav[+el.getAttribute('data-i')];
      if (ffi) { $('freename').value = stripK(ffi.name); var kk = $('fk100'); if (kk) { kk.focus(); try { kk.scrollIntoView({ block: 'center' }); } catch (e) { } } toast('Vul kcal per 100 g in en tik op Toevoegen'); }
    } else if (act === 'favdel') {
      var fi = +el.getAttribute('data-i');
      if (S.confirmFavDel === fi) {
        S.fav.splice(fi, 1); S.favAsk = ''; S.confirmFavDel = null; persist(); renderSheet(false); toast('Item verwijderd');
      } else {
        S.confirmFavDel = fi; renderSheet(false); toast('Tik nog een keer om te verwijderen');
      }
    } else if (act === 'swhy') {
      var ds = dayDoc(S.sheet.day), sv = el.getAttribute('data-v'), sl = S.sheet.slot;
      if (!ds.why) ds.why = {};
      if (!ds.why[sl]) ds.why[sl] = [];
      var si = ds.why[sl].indexOf(sv); if (si >= 0) ds.why[sl].splice(si, 1); else ds.why[sl].push(sv);
      saveDay(S.sheet.day); renderSheet(false);
    } else if (act === 'trek') {
      var de = dayDoc(S.sheet.day), vv = el.getAttribute('data-v');
      if (!de.eod) de.eod = { trek: '', why: [] };
      de.eod.trek = de.eod.trek === vv ? '' : vv;
      saveDay(S.sheet.day); renderSheet(false);
    } else if (act === 'mv') {
      var md = dayDoc(S.sheet.day), a2 = el.getAttribute('data-a'), v2 = el.getAttribute('data-v');
      if (md.move[a2] === v2) delete md.move[a2]; else md.move[a2] = v2;
      saveDay(S.sheet.day); renderSheet(false);
    } else if (act === 'mvpick') {
      var mp2 = dayDoc(S.sheet.day), a3 = el.getAttribute('data-a');
      if (mp2.move[a3]) { delete mp2.move[a3]; if (a3 === 'efiets') delete mp2.move.efietsTxt; } else mp2.move[a3] = true;
      saveDay(S.sheet.day); renderSheet(false);
    } else if (act === 'mvold') {
      var mo = dayDoc(S.sheet.day); delete mo.move[el.getAttribute('data-a')];
      saveDay(S.sheet.day); renderSheet(false);
    }
    else if (act === 'close') requestClose();
    else if (act === 'vv') { var vid = el.getAttribute('data-id'); S.vv = (S.vv === vid) ? '' : vid; renderSheet(false); }
    else if (act === 'vvno') { S.vv = ''; renderSheet(false); }
    else if (act === 'vvgo') {
      var dv = dayDoc(S.sheet.day), vi = -1, vid2 = el.getAttribute('data-id'), np = prodById(el.getAttribute('data-p'));
      dv.entries.forEach(function (x, ix) { if (x.id === vid2) vi = ix; });
      if (vi < 0 || !np) return;
      var oe = dv.entries[vi], ou = oe.u || (np.u === 'stuk' ? 'stuk' : 'g'), ok = kcalFor(np, oe.amt, ou); // v57.5: stuk-product zonder stukgewicht -> 'stuk' (kcalFor geeft dan null), niet als grammen
      var ne = { id: oe.id, slot: oe.slot, key: 'P:' + np.id, code: '', name: np.n + ', ' + fmtN(oe.amt) + ' ' + unitWord(ou, oe.amt, np), k: ok == null ? null : Math.round(ok), exact: ok != null, pid: np.id, amt: oe.amt, u: ou };
      if (ou === 'g' && ok != null && np.kc != null) { ne.g = oe.amt; ne.p = np.kc; }
      dv.entries[vi] = ne; S.vv = '';
      saveDay(S.sheet.day); renderSheet(false); toast('Vervangen door ' + np.n);
    }
    else if (act === 'cbadd') {
      var cb = el.getAttribute('data-key'), src = null;
      Object.keys(S.days).forEach(function (did) { (S.days[did].entries || []).forEach(function (x) { if (x.slot === S.sheet.slot && x.key === cb && !x.grp) src = x; }); });
      if (!src) return;
      var ce = { key: src.key, code: '', name: src.name, k: src.k, exact: src.exact };
      ['pid', 'amt', 'u', 'g', 'p'].forEach(function (f) { if (src[f] != null) ce[f] = src[f]; });
      addEntry(ce);
    }
    else if (act === 'cbno') { S.cbSkip = S.cbSkip || {}; S.cbSkip[S.sheet.slot + '|' + el.getAttribute('data-key')] = true; renderSheet(false); }
    else if (act === 'pick') {
      var gk = el.getAttribute('data-g'), i = +el.getAttribute('data-i');
      var it = itemsOf(gk)[i];
      addEntry({ key: gk + ':' + i, code: it.c, name: it.n, k: it.k });
    } else if (act === 'minus') {
      var dm = dayDoc(S.sheet.day), mk = el.getAttribute('data-key');
      for (var q = dm.entries.length - 1; q >= 0; q--) {
        if (dm.entries[q].slot === S.sheet.slot && dm.entries[q].key === mk) { if (dm.entries[q].grp && showCode(dm.entries[q].code)) { removeGroup(dm.entries[q].grp); return; } dm.entries.splice(q, 1); break; }
      }
      saveDay(S.sheet.day); renderSheet(false);
    } else if (act === 'del') {
      var d = dayDoc(S.sheet.day), rid = el.getAttribute('data-id');
      var ge = d.entries.filter(function (e) { return e.id === rid; })[0];
      if (ge && ge.grp && showCode(ge.code)) { removeGroup(ge.grp); return; }
      d.entries = d.entries.filter(function (e) { return e.id !== rid; });
      saveDay(S.sheet.day); renderSheet(false);
    } else if (act === 'prev') { S.start = addDays(S.start, -7); render(); }
    else if (act === 'next') { S.start = addDays(S.start, 7); render(); }
    else if (act === 'today') { S.start = startOfWeek(new Date()); render(); }
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'whynote' && S.sheet) {
      var dw = dayDoc(S.sheet.day), vw = ev.target.value.trim();
      if (whyTextOf(dw, S.sheet.slot) === vw) return;
      if (!dw.whyText) dw.whyText = {};
      if (vw) dw.whyText[S.sheet.slot] = vw; else delete dw.whyText[S.sheet.slot];
      saveDay(S.sheet.day);
    }
    if (ev.target.id === 'note' && S.sheet) {
      var d = dayDoc(S.sheet.day), v = ev.target.value.trim();
      if ((d.notes[S.sheet.slot] || '') === v) return;
      if (v) d.notes[S.sheet.slot] = v; else delete d.notes[S.sheet.slot];
      saveDay(S.sheet.day);
    }
    if (ev.target.id === 'photofile' && S.sheet) {
      var f = ev.target.files && ev.target.files[0]; ev.target.value = '';
      if (!f) return;
      var dayId = S.sheet.day, slot = S.sheet.slot;
      resizePhoto(f, function (url) {
        if (!url) { toast('Deze foto kon niet gelezen worden'); return; }
        var dp = dayDoc(dayId), old = dp.photos ? dp.photos[slot] : undefined;
        if (!dp.photos) dp.photos = {};
        dp.photos[slot] = url;
        if (!tryStore()) {
          if (old) dp.photos[slot] = old; else delete dp.photos[slot];
          toast('Foto past niet meer in het geheugen van de app');
        } else S.status = 'ok';
        if (S.sheet) renderSheet(false);
      });
    }
    if (ev.target.id === 'pjfile') {
      var pjs = ev.target.files ? Array.prototype.slice.call(ev.target.files) : []; ev.target.value = '';
      if (pjs.length && S.pj) pjFiles(pjs);
    }
    if (ev.target.id === 'pastefile') {
      var pfs = ev.target.files ? Array.prototype.slice.call(ev.target.files) : []; ev.target.value = '';
      if (!pfs.length || !S.paste) return;
      if (pfs.length > 1) { multiLaad(pfs); return; }
      var pf = pfs[0];
      var pr2 = new FileReader();
      pr2.onload = function () { if (!S.paste) return; S.paste.text = String(pr2.result); S.paste.prev = null; S.paste.err = ''; renderPaste(); pasteCheck(); };
      pr2.readAsText(pf);
    }
  });
  document.addEventListener('input', function (ev) {
    if (!ev.target) return;
    if (!S.sheet && !S.rec && !S.prod) return;
    if (S.prod && ev.target.getAttribute) {
      var pfk = ev.target.getAttribute('data-pf'), pwk = ev.target.getAttribute('data-pw'), pov = ev.target.getAttribute('data-pov');
      if (pov) { S.prod.overVinkt = S.prod.overVinkt || {}; S.prod.overVinkt[pov] = ev.target.checked; return; }
      if (pfk === 'direct') { S.prod.direct = ev.target.checked; return; }
      if (pfk === 'bonTot') {
        // v46: zelf gekozen einddatum (tot en met, dus tot het einde van die dag); leeg = geen einddatum
        var bm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ev.target.value || ''));
        S.prod.bonTot = bm ? new Date(+bm[1], +bm[2] - 1, +bm[3], 23, 59, 59, 999).getTime() : null;
        return;
      }
      if (pfk) { S.prod[pfk] = ev.target.value; return; }
      if (pwk) { S.prod.w[pwk] = ev.target.value; return; }
    }
    if (S.sheet && ev.target.classList && ev.target.classList.contains('selamt')) { var sa9 = +ev.target.getAttribute('data-i'); if (S.sheet.sel[sa9]) { S.sheet.sel[sa9].amt = ev.target.value; } return; } // v55.0 (12 nov): aantal in "Dit eetmoment"; v57: note-voorwaarde weg — de velden worden ook zonder notitie getoond
    if (S.sheet && ev.target.classList && ev.target.classList.contains('selunit')) { var su9 = +ev.target.getAttribute('data-i'); if (S.sheet.sel[su9]) { S.sheet.sel[su9].u = ev.target.value; } return; } // v55.0 (12 nov): eenheid in "Dit eetmoment"; v57: note-voorwaarde weg
    if (ev.target.id === 'recpor' && S.rec) { S.rec.por = ev.target.value; return; }
    if (ev.target.id === 'recname' && S.rec) { S.rec.name = ev.target.value; return; }
    if (ev.target.id === 'recsteps' && S.rec) { S.rec.steps = ev.target.value; return; }
    if (ev.target.id === 'recsnel' && S.rec) { S.rec.snel = ev.target.checked; var sb2 = document.getElementById('recsnelMinBlok'); if (sb2) sb2.hidden = !ev.target.checked; return; }
    if (ev.target.id === 'recsnelMin' && S.rec) { S.rec.snelMin = ev.target.value; return; }
    if (ev.target.getAttribute && ev.target.getAttribute('data-ia') != null && S.rec) { S.rec.ing[+ev.target.getAttribute('data-ia')].a = ev.target.value; calcRecEditTotal(); return; } // v48.4: live "= N g" meerekenen bij typen
        if (ev.target.id === 'steps') {
      var v = ev.target.value.replace(/[^0-9]/g, '').slice(0, 6), dd = dayDoc(S.sheet.day);
      if (ev.target.value !== v) ev.target.value = v;
      if (v) dd.steps = +v; else delete dd.steps;
      saveDay(S.sheet.day);
    } else if (ev.target.id === 'movenote') {
      var dn = dayDoc(S.sheet.day), tv = ev.target.value.trim();
      if (tv) dn.moveNote = tv; else delete dn.moveNote;
      saveDay(S.sheet.day);
    } else if (ev.target.id === 'efietstxt') {
      var df = dayDoc(S.sheet.day), ft = ev.target.value.trim();
      if (ft) df.move.efietsTxt = ft; else delete df.move.efietsTxt;
      saveDay(S.sheet.day);
    }
  });
  document.addEventListener('toggle', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute) return;
    if (t.id === 'freedet') { S.freeDetOpen = t.open; return; } // v55.2 (13 nov) PUNT 5b: "meer" klapt het hele uitklapje niet meer dicht
    if (t.id === 'othrec') { S.othOpen = t.open; return; }
    var gg = t.getAttribute('data-gg'); if (gg) { S.grpOpen[gg] = t.open; return; }
    var ig = t.getAttribute('data-ig'); if (ig) { if (t.open) S.ingOpen[ig] = true; else delete S.ingOpen[ig]; return; }
    var rk = t.getAttribute('data-rk');
    // v45c: bij zoeken of filteren staan alle gevonden groepen open; dat onthouden we niet als keuze van Marlijn.
    if (rk) { if (t.open) S.recOpen[rk] = true; else delete S.recOpen[rk]; if (rk.indexOf('pc:') === 0 || rk.indexOf('pg:') === 0 || rk.indexOf('zk:') === 0) { S.pcClosed = S.pcClosed || {}; if (t.open) delete S.pcClosed[rk]; else S.pcClosed[rk] = true; } }
  }, true);
  // v46: op Producten is er maar één open per laag: een product, een categorie en een hoofdgroep sluiten de vorige.
  document.addEventListener('click', function (ev) {
    var sm = ev.target && ev.target.closest ? ev.target.closest('summary') : null; if (!sm) return;
    var d = sm.parentElement; if (!d || !d.matches || d.open) return;
    if (d.matches('details.prod2')) {
      document.querySelectorAll('#prijsview details.prod2[open]').forEach(function (o) { if (o !== d) o.open = false; });
      return;
    }
    if (d.matches('#recview details.rcard')) { // v1744: in de receptenlijst maar één recept tegelijk open
      document.querySelectorAll('#recview details.rcard[open]').forEach(function (o) { if (o !== d) o.open = false; });
      return;
    }
    if (d.matches('#gemview details.per')) { // v1744: in Kookhulp maar één blok tegelijk open (net als bij recept)
      var kh = d.closest('.khgrp');
      if (kh) kh.querySelectorAll('details.per[open]').forEach(function (o) { if (o !== d) o.open = false; }); // punt F fix: blokjes zitten in .card, dus descendants (was :scope >)
      return;
    }
    if (!d.matches('details.pgrp, details.pcat') || d.matches('.zoekgrp, .lblblok')) return;
    var isG = d.classList.contains('pgrp'), par = isG ? d.parentElement : d.closest('.pgrp');
    if (!par) return;
    par.querySelectorAll(isG ? ':scope > details.pgrp[open]' : 'details.pcat[open]').forEach(function (o) { if (o !== d) o.open = false; });
    document.querySelectorAll('#prijsview details.prod2[open]').forEach(function (o) { if (!d.contains(o)) o.open = false; });
  }, true);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target && (ev.target.id === 'freename' || ev.target.id === 'fk100' || ev.target.id === 'fgram' || ev.target.id === 'srname')) {
      ev.preventDefault();
      var b = document.querySelector('[data-act="' + (ev.target.id === 'srname' ? 'srsave' : 'freeadd') + '"]'); if (b) b.click();
      return;
    }
    if (ev.key === 'Enter' && ev.target && (ev.target.className === 'favgram' || ev.target.className === 'fixgram')) {
      ev.preventDefault();
      var bg = ev.target.parentNode.querySelector('[data-act="favgo"], [data-act="fixgo"]'); if (bg) bg.click();
      return;
    }

    if (ev.key === 'Escape' && (S.cook || S.rg || S.rec || S.sheet || S.paste || S.prod || S.pp || S.sc || !$('outsheet').hidden)) requestClose();
  });
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act="fcat"]'); if (!el) return;
    var v = el.getAttribute('data-v'), i = S.freeCats.indexOf(v);
    if (i >= 0) S.freeCats.splice(i, 1);
    else if (S.freeCats.length >= 3) { toast('Maximaal 3 categorieën'); return; }
    else S.freeCats.push(v);
    el.setAttribute('aria-pressed', String(S.freeCats.indexOf(v) >= 0));
    cpRefresh('free');
  });

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'fu') {
      S.freeU = el.getAttribute('data-v');
      Array.prototype.forEach.call(document.querySelectorAll('#funits [data-act="fu"]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === S.freeU)); });
      var blk = $('fsgBlock'); if (blk) blk.hidden = S.freeU !== 'stuk';
      var sgi = $('fsg'), ph = freePh(S.freeU, !!(sgi && sgi.value.trim())), ki = $('fk100'), gi = $('fgram');
      if (ki) ki.placeholder = ph.k; if (gi) gi.placeholder = ph.g;
    }
    else if (act === 'pkask') { // v55.2 (13 nov) PUNT 1B: in de buffer-popup opent tik het aantal/eenheid-paneel; pas "Toevoegen" in dat paneel zet de regel in DIT EETMOMENT
      var pid0 = el.getAttribute('data-p');
      S.prodAsk = (S.prodAsk === pid0) ? '' : pid0; S.pkUnit = ''; S.fixedAsk = ''; S.favAsk = '';
      renderSheet(false); if (S.prodAsk) focusPk();
    }
    else if (act === 'pkunit') { S.pkUnit = el.getAttribute('data-v'); renderSheet(false); focusPk(); }
    else if (act === 'pkno') { S.prodAsk = ''; renderSheet(false); }
    else if (act === 'pkgo') {
      var p = prodById(el.getAttribute('data-p')); if (!p) return;
      var pn = el.closest('.icatpanel'), ai = pn && pn.querySelector('.pkamt'), ki2 = pn && pn.querySelector('.pkkc');
      var u = S.pkUnit || p.u, a = ai ? num(ai.value) : null;
      // v48.2: eenheid = eigen woord uit het aantal-blokje (plakjes…): omrekenen naar gram/ml via verpakking ÷ aantal
      var antlU2 = (p.aantal > 0 && p.aantalWoord) ? p.aantalWoord : null;
      var isAntl = !!(antlU2 && u === antlU2);
      var maxA = isAntl ? 200 : (u === 'stuk' || HUISMATEN[u] != null ? 200 : 5000); // v55.0: huismaat telt als stuk-achtig aantal
      if (a == null || a <= 0 || a > maxA) { toast(isAntl || u === 'stuk' ? 'Vul het aantal in, bijvoorbeeld 1,5' : 'Vul de hoeveelheid in, bijvoorbeeld 40'); return; }
      if (ki2 && ki2.value.trim()) {
        var kv = num(ki2.value), per = (u === 'stuk' && !p.sg);
        if (kv == null || kv <= 0 || kv > (per ? 5000 : 900)) { toast(per ? 'Kcal per stuk klopt niet, bijvoorbeeld 90' : 'Kcal per 100 g of ml klopt niet, bijvoorbeeld 230'); return; }
        if (per) p.kst = kv; else p.kc = kv;
      }
      if (S.sheet && S.sheet.buf) { // v55.2 (13 nov) PUNT 1B: buffer-popup — regel naar DIT EETMOMENT, nog niets in de dag
        var selG = S.sheet.sel.filter(function (s) { return s.t === 'p' && s.p.id === p.id; })[0];
        if (!selG) { S.sheet.sel.push({ t: 'p', p: p, amt: a, u: u }); S.sheet.added['P:' + p.id] = true; }
        else { selG.amt = a; selG.u = u; }
        S.prodAsk = ''; p.eh = u; p.la = a;
        renderSheet(false); toast('In DIT EETMOMENT gezet — ' + (S.sheet.sel || []).length + ' gekozen');
        return;
      }
      S.prodAsk = ''; p.eh = u; p.la = a;
      if (isAntl) {
        var sg2 = stukGram(p);
        var gAmt = sg2 != null ? a * sg2 : null;
        addProdEntry(p, a, u, gAmt != null ? kcalFor(p, gAmt, 'g') : kcalFor(p, a, u));
      } else {
        addProdEntry(p, a, u, kcalFor(p, a, u));
      }
      toast('Toegevoegd');
    }
  });
  // v48.2: live "= N g"-bevestiging onder het aantal-veld in het moment-scherm
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t && t.classList && t.classList.contains('pkamt')) {
      var cv = document.getElementById('pkconv');
      if (cv) {
        var panel = t.closest('.icatpanel');
        var p0 = panel && panel.querySelector('[data-act="pkgo"]');
        var pr0 = p0 && prodById(p0.getAttribute('data-p'));
        if (pr0 && pr0.aantal > 0 && pr0.aantalWoord && S.pkUnit === pr0.aantalWoord) {
          var sg3 = stukGram(pr0), av = num(t.value);
          cv.textContent = (sg3 != null && av != null && av > 0) ? '= ' + fmtN(Math.round(av * sg3 * 10) / 10) + (pr0.u === 'ml' ? ' ml' : ' g') : '';
        } else cv.textContent = '';
      }
    }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t && t.id === 'choicesearch') { var or_ = document.getElementById('choiceotherres'); if (or_) or_.innerHTML = renderChoiceOther(t.value); return; }
    if (t && t.id === 'ingq') { S.ingq = t.value; var ir = document.getElementById('ingqres'), ig = document.getElementById('inggroups'); if (ir) ir.innerHTML = recIngSearch(t.value); if (ig) ig.hidden = !!t.value.trim(); return; }
    if (t && t.id === 'recq') { S.recq = t.value; var rl = $('reclist'); if (rl) rl.innerHTML = recListHtml(); return; } // v53.9: per-letter-render gefixt — focus blijft in het zoekveld
    if (t && t.id === 'mergepickq') {
      var q = normName(t.value);
      var pA = prodById(mergeState.pAId);
      var cand = S.prijzen.filter(function (x) { return x.id !== (pA ? pA.id : ''); });
      if (q) cand = cand.filter(function (x) { return prodKeys(x).join(' ').indexOf(q) >= 0; });
      var listDiv = $('mergepicklist');
      if (listDiv) {
        listDiv.innerHTML = cand.map(function (c) {
          return '<button class="opt" data-act="choosemerge" data-p="' + c.id + '"><span class="on">' + esc(c.n) + '<small>' + (c.kc != null ? (c.kc + ' kcal/100g') : (c.kst != null ? (c.kst + ' kcal/st') : 'geen kcal')) + '</small></span></button>';
        }).join('');
      }
      return;
    }
    if (!t || t.id !== 'fsg') return;
    var ki = $('fk100'); if (ki) ki.placeholder = freePh(S.freeU, !!t.value.trim()).k;
  });
  document.addEventListener('keydown', function (ev) {
    var t = ev.target; if (ev.key !== 'Enter' || !t || !t.className || typeof t.className !== 'string') return;
    if (t.className.indexOf('pkamt') >= 0 || t.className.indexOf('pkkc') >= 0) {
      ev.preventDefault(); var pn = t.closest('.icatpanel'), b = pn && pn.querySelector('[data-act="pkgo"]'); if (b) b.click();
    }
  });
  // v45b.6.3: toetsenbord-toegang voor div[role=button][data-act] (Enter/Spatie activeert, net als een echte knop)
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var el = ev.target.closest ? ev.target.closest('div[role="button"][data-act]') : null;
    if (!el) return;
    ev.preventDefault();
    el.click();
  });

  // ---- opslag, kopiëren en terugzetten
  function load() {
    try { S.zegIn = String(localStorage.getItem('eetweek.zegIn') || '').slice(0, 400); S.zegTik = !!S.zegIn.trim(); } catch (e) {} // v55.2 (13 nov) PUNT 6: zeg-veld + knopjes blijven na herstart
    try {
      var raw = localStorage.getItem('eetweek.v1');
      if (raw) { var o = JSON.parse(raw); S.days = o.days || {}; S.weights = o.weights || {}; S.fav = o.fav || []; S.lastBackup = o.lastBackup || null; S.recipes = o.recipes || []; S.seeded = !!o.seeded || S.recipes.length > 0; S.mig = o.mig || []; S.prijzen = (Array.isArray(o.prijzen) ? o.prijzen : []).map(cleanProd).filter(Boolean); S.icat = cleanIcat(o.icat); S.lijst = cleanLijst(o.lijst); S.maxes = cleanMaxes(o.maxes); S.rare = (o.rare && typeof o.rare === 'object' && !Array.isArray(o.rare)) ? o.rare : {}; S.rareD = (o.rareD && typeof o.rareD === 'object' && !Array.isArray(o.rareD)) ? o.rareD : {}; S.normaal = cleanNormaal(o.normaal); S.cat = cleanCat(o.cat); } // v49 + v49-fix: cat geladen
    } catch (e) { S.status = 'geen'; }
    if (!S.seeded) { S.recipes = starterRecipes(); S.seeded = true; S.mig = ['pizza', 'muffin', 'kwarkfris', 'v12', 'v13']; }
    migrate();
    // v45c.4: eenmalig: bestaande plantenmelken en drinkyoghurt met één categorie krijgen er Zuivel én Drinken bij.
    try {
      if (!localStorage.getItem('eetweek.mig45c4')) {
        S.prijzen.forEach(function (p) { if (p.cat && p.cat.length === 1 && PLANT_RE.test(String(p.n).toLowerCase())) p.cat = ['zuivel', 'drinken']; });
        localStorage.setItem('eetweek.mig45c4', '1');
      }
      if (!localStorage.getItem('eetweek.mig45d')) {
        S.prijzen.forEach(function (p) { if (p.cat && p.cat.length === 1 && p.cat[0] === 'zuivel' && /kokos ?(melk|room|cr[eè]me)/.test(String(p.n).toLowerCase())) p.cat = ['blik']; });
        localStorage.setItem('eetweek.mig45d', '1');
      }
    } catch (e) {}
    S.recipes = stripTmpVelden(S.recipes || []); S.days = stripTmpVelden(S.days || {}); // v57.5: bij laden eenmalig _opz/_opzBusy opruimen — tryStore hieronder slaat dan al schoon op (opslag + reservekopie)
    tryStore();
  }
  function entryText(e) {
    var br = e.bron ? ' (' + e.bron + ')' : ''; // v55.0 (12 nov): bronlabel zichtbaar in week-kopiëren
    if (e.exact && e.k != null) {
      if (e.p != null && e.g != null) return e.name + ' (' + e.k + ' kcal, berekend uit ' + fmtN(e.p) + ' kcal per 100 g)' + br;
      return e.name + ' (' + e.k + ' kcal)' + br;
    }
    if (e.ing) return 'Recept: ' + e.name + ': ' + e.ing + ' (± ' + e.k + (e.unk ? ', plus eigen ingrediënten nog te schatten' : '') + ')' + br;
    var n = nameFor(e, true);
    return (showCode(e.code) ? e.code + ' ' : '') + n + (e.k == null ? (/schatten/.test(n) ? '' : ' (nog te schatten)') : (/± \d+$/.test(n) ? '' : ' (± ' + e.k + ')')) + br;
  }
  function weekText() {
    var wk = 0, wkOpen = 0, leeg = 0;
    var t = 'Mijn Eetboek, vrijdag ' + short(S.start) + ' t/m donderdag ' + short(addDays(S.start, 6)) + ' ' + addDays(S.start, 6).getFullYear() + '\n';
    for (var i = 0; i < 7; i++) {
      var date = addDays(S.start, i), id = fmtId(date), d = S.days[id] || { entries: [], notes: {} };
      var raarDag = dayIsRaar(id);
      t += '\n' + cap(DOW[date.getDay()]) + ' ' + short(date) + (raarDag ? ' 🙃' : '') + (d.theme ? ' (thema: ' + d.theme + ')' : '') + ':\n';
      if (raarDag) t += '- 🙃 dit was een rare dag — de getallen hoeven niets te betekenen (telt wel gewoon mee)\n'; // v50.5: rare dag gemarkeerd in de tekst
      var any = false;
      momentsFor(date.getDay(), d).forEach(function (m) {
        var es = (d.entries || []).filter(function (e) { return e.slot === m.slot; });
        if (m.slot === 'eod') return;
        var note = d.notes && d.notes[m.slot];
        var tnL = (d.tnotes && d.tnotes[m.slot]) || []; // v55.1 (12 nov): tekstnotities — als tekst mee in de week-kopie, nóóit kcal
        var wl = whyOf(d, m.slot).slice();
        if (whyTextOf(d, m.slot)) wl.push(whyTextOf(d, m.slot));
        var ex = m.slot === 'av' ? avExtraList(d) : [];
        var ph = NOPHOTO.indexOf(m.slot) < 0 && photoOf(d, m.slot);
        if (!es.length && !note && !tnL.length && !wl.length && !ex.length && !ph) return;
        any = true;
        var extras = [];
        if (ex.length) extras.push(ex.join(', '));
        if (wl.length) extras.push('waarom: ' + wl.join(', '));
        if (note) { extras.push('notitie: ' + note); } // v56.2 punt 6: briefjes alléén in de dagregel, geen aparte sectie onderaan
        tnL.forEach(function (x) { extras.push('tekstnotitie: ' + x.t); }); // v55.1 (12 nov): tekstnotities als tekst mee, tellen nóóit in kcal; v56.2 punt 6: geen aparte sectie
        if (ph) extras.push('foto toegevoegd');
        var mk = 0, mOpen = 0;
        es.forEach(function (e) { if (typeof e.k === 'number') mk += e.k; else mOpen++; });
        var sam = es.length > 1 ? ' → samen ± ' + Math.round(mk) + (mOpen ? ' (+ ' + mOpen + ' nog te schatten)' : '') : '';
        var oudNote = es.some(function (e2) { return e2.oudSlot; }) ? ' [was: ' + es.filter(function (e2) { return e2.oudSlot; }).map(function (e2) { return OUD_NAAM[e2.oudSlot] || e2.oudSlot; }).join(', ') + ']' : '';
        t += '- ' + m.t + oudNote + ': ' + es.map(entryText).join('; ') + sam + (extras.length ? (es.length ? ' | ' : '') + extras.join(' | ') : '') + '\n'; // v50.5: (schema: …)-restjes eruit (incl. "vaste ochtend")
      });
      var ml = moveList(date.getDay(), d);
      if (ml.length) { any = true; t += '- Bewegen: ' + ml.join('; ') + '\n'; }
      if (d.moveNote) { any = true; t += '- Bewegen, toelichting: ' + d.moveNote + '\n'; }
      if (d.steps) { any = true; t += '- Stappen smartwatch: ± ' + d.steps + ' (schatting door Marlijn, telt tillen op werk ook mee)\n'; }
      var eo = d.eod || {}, en = d.notes && d.notes.eod;
      if (eo.trek || (eo.why && eo.why.length) || en) {
        any = true;
        t += '- Einde van de dag: ' + [eo.trek ? 'trek: ' + eo.trek : '', (eo.why && eo.why.length) ? 'waarom iets specifieks gegeten: ' + eo.why.join(', ') : '', en ? 'toelichting: ' + en : ''].filter(Boolean).join(' | ') + '\n';
      }
      if (!any) t += '- niets gekozen\n';
      var dk = 0, dOpen = 0;
      (d.entries || []).forEach(function (e) { if (typeof e.k === 'number') dk += e.k; else dOpen++; });
      if (!(d.entries || []).length) leeg++;
      else t += '- Dagtotaal (hele dag): ± ' + Math.round(dk) + (dOpen ? ' (+ ' + dOpen + ' nog te schatten)' : '') + '\n';
      wk += dk; wkOpen += dOpen;
    }
    if (weekIsRaar()) {
      t += '\nWeektotaal: geen weektotaal (deze week is gemarkeerd als rare week)';
      t += '\nDeze week is gemarkeerd als een rare week: de getallen hoeven niets te betekenen — goed dat je er gewoon was.';
    } else {
      t += '\nWeektotaal: ± ' + Math.round(wk) + ', weekgemiddelde: ± ' + Math.round(wk / 7) + ' per dag (over 7 dagen)';
    }
    t += '\nWeek (som van mijn maxima): ' + weekDoelAuto() + ' kcal — ' + ((weekDoelAuto() - wk) >= 0 ? 'nog ± ' + Math.round(weekDoelAuto() - wk) + ' kcal over' : '± ' + Math.round(wk - weekDoelAuto()) + ' kcal over');
    if (wkOpen) t += '\nNog te schatten: ' + wkOpen + (wkOpen === 1 ? ' item, telt niet mee in de totalen' : ' items, tellen niet mee in de totalen');
    if (leeg) t += '\nDagen zonder ingevulde keuzes: ' + leeg + (leeg === 1 ? ' dag' : ' dagen');
 // v53: notities per dag + moment apart in de weektekst
    t += '\nAlle kcal zijn schattingen; notities tellen niet mee.\n';
    return t;
  }
  function showOut(title, sub, text, restore, kind) {
    S.outKind = kind || '';
    $('ot').textContent = title; $('op').textContent = sub;
    var ta = $('outarea'); ta.value = text; ta.readOnly = !restore;
    ta.style.display = (!restore && /lukt hier niet/.test(sub)) ? 'none' : ''; // v56.2 punt 7: geen zichtbare JSON-code; kopiëren pakt ta.value gewoon mee
    $('outcopy').hidden = !!restore; $('outrestore').hidden = !restore;
    pushLayer(); $('outsheet').hidden = false; document.documentElement.classList.add('lock');
    if (!restore) { ta.focus(); ta.select(); ta.setSelectionRange(0, text.length); }
  }
  function forceCloseOut() { $('outsheet').hidden = true; document.documentElement.classList.remove('lock'); }
  window.addEventListener('popstate', function () {
    // v45d.1: staat de keuze-popup open? Dan sluit terug alleen die popup (het scherm eronder blijft staan)
    if (S._skip > 0) { S._skip--; return; }
    if (document.getElementById('choiceov')) { closeChoice(true); return; }
    // Variant C (28 okt): staat het Toevoegen-menu open? Dan sluit terug één niveau van het menu
    if (S.addStack && S.addStack.length) { addBack(); return; }
    if (S.cook) { forceCloseCook(); return; }
    if (S.rg) { forceCloseRg(); return; }
    if (S.oud) { forceCloseOud(); return; }
    if (S.verw) { forceCloseVerw(); return; } // v47: Verwijderen-sheet op het tandwiel
    if (S.sc) { forceCloseSC(); return; }
    if (S.pj) { forceClosePJ(); return; }
    if (S.pp) { forceClosePP(); return; }
    if (S.prod) { forceCloseProd(); if (S.scFormQ && S.scFormQ.length) scFormNext(); else if (S.scFormQ && S.sc) forceCloseSC(); return; } // v46.1: na het formulier de volgende (of netjes afronden)
    if (S.paste) { forceClosePaste(); return; }
    if (S.rec) { forceCloseRec(); return; }
    if (S.sheet) forceCloseSheet();
    if (!$('outsheet').hidden) forceCloseOut();
  });
  function copyDirect(text, kind, title, sub, forceSheet) {
    function done() { toast('Gekopieerd'); if (kind === 'backup') markBackup(); }
    function fallback() {
      var ta = document.createElement('textarea'), ok = false;
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      try { ok = document.execCommand('copy'); } catch (e) { }
      ta.remove();
      if (ok) done(); else showOut(title, sub, text, false, kind);
    }
    // v48.2-fix: forceSheet (Reservekopie kopiëren) toont áltijd het tekst-scherm — het klembord alleen is niet leesbaar Genoeg op telefoon
    if (forceSheet) { showOut(title, sub, text, false, kind); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  function copyOut() {
    var ta = $('outarea'), t = ta.value; ta.select(); ta.setSelectionRange(0, t.length);
    function fallback() {
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { }
      toast(ok ? 'Gekopieerd' : 'Houd de tekst ingedrukt en kies Kopiëren');
      if (ok && S.outKind === 'backup') markBackup();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast('Gekopieerd'); if (S.outKind === 'backup') markBackup(); }, fallback);
    else fallback();
  }
  function backupJson(withPhotos) {
    return JSON.stringify({ v: 1, days: S.days, weights: S.weights, fav: S.fav, recipes: S.recipes, mig: S.mig, prijzen: S.prijzen, icat: S.icat, lijst: S.lijst, maxes: S.maxes, rare: S.rare, rareD: S.rareD || {}, normaal: S.normaal, cat: S.cat || {} }, withPhotos ? null : function (k, v) { return (k === 'photos' || k === 'foto') ? undefined : v; }); // v49: normaal mee in reservekopie; v49-fix: cat mee
  }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'weektext') copyDirect(weekText(), 'week', 'Week kopiëren', 'Houd de tekst ingedrukt en kies Kopiëren.');
    else if (act === 'backup') copyDirect(backupJson(false), 'backup', 'Reservekopie', 'Bewaar deze tekst op een veilige plek, bijvoorbeeld in een notitie.');
    else if (act === 'restore') showOut('Reservekopie terugzetten', 'Plak hier de tekst van je reservekopie.', '', true);
    else if (act === 'outcopy') copyOut();
    else if (act === 'outclose') requestClose();
    else if (act === 'outrestore') { if (restoreFrom($('outarea').value)) requestClose(); }
    else if (act === 'backupfile') saveFile();
    else if (act === 'restorefile') $('restorefile').click();
  });
  function restoreFrom(text) {
    try {
      var o = JSON.parse(text);
      if (!o || typeof o.days !== 'object') throw new Error('x');
      if (typeof o.weights !== 'object') { // v56.2 punt 8: week-bestand (alleen {v, days}) — dagen mergen in de bestaande week
        Object.keys(o.days).forEach(function (k) { S.days[k] = o.days[k]; });
        persist(); render(); toast('Week teruggezet'); return true;
      }
      var part = S.restorePart || null; S.restorePart = null;
      if (part && part !== 'days' && part !== 'recipes' && part !== 'prijzen') part = null;
      var old = S.days;
      if (!part || part === 'days') { S.days = o.days; S.weights = o.weights; S.fav = o.fav || []; }
      if ((!part || part === 'recipes') && Array.isArray(o.recipes)) { S.recipes = o.recipes; S.seeded = true; S.mig = o.mig || []; migrate(); }
      Object.keys(old).forEach(function (k) {
        var op = old[k] && old[k].photos, np = S.days[k] && S.days[k].photos;
        if (op && Object.keys(op).length && S.days[k] && !(np && Object.keys(np).length)) S.days[k].photos = op;
      });
      if ((!part || part === 'prijzen') && Array.isArray(o.prijzen)) {
        var oldP = S.prijzen;
        S.prijzen = o.prijzen.map(cleanProd).filter(Boolean);
        S.prijzen.forEach(function (p) { if (!p.foto) { var op2 = oldP.filter(function (x) { return x.id === p.id; })[0]; if (op2 && op2.foto) p.foto = op2.foto; } });
      }
      if (o.icat && typeof o.icat === 'object') S.icat = cleanIcat(o.icat);
      if (Array.isArray(o.lijst)) S.lijst = cleanLijst(o.lijst);
      S.maxes = cleanMaxes(o.maxes);
      S.rare = (o.rare && typeof o.rare === 'object' && !Array.isArray(o.rare)) ? o.rare : {};
      S.rareD = (o.rareD && typeof o.rareD === 'object' && !Array.isArray(o.rareD)) ? o.rareD : {};
      S.normaal = cleanNormaal(o.normaal); S.cat = cleanCat(o.cat); // v49 + v49-fix
      persist(); render(); toast('Teruggezet');
      return true;
    } catch (e) { toast('Dit is geen reservekopie'); return false; }
  }
  // v46: producten als tabel (CSV, puntkomma + UTF-8 met BOM zodat Excel in Nederland het goed opent)
  function saveProductsCsv() {
    if (!S.prijzen.length) { toast('Je hebt nog geen producten om te bewaren'); return; }
    var kol = ['naam', 'inhoud', 'eenheid', 'prijs', 'bonus', 'kcal', 'kcal_stuk', 'gewicht_stuk', 'categorie', 'alias', 'stuknaam', 'eiwit', 'suiker', 'verzadigd', 'zout', 'vezel'];
    function cel(v) { if (v == null) return ''; var t = typeof v === 'number' ? String(v).replace('.', ',') : String(v); return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }
    var regels = [kol.join(';')];
    S.prijzen.forEach(function (p) {
      var w = p.w || {};
      regels.push([p.n, p.inh, p.u || 'g', p.pr, p.bon, p.kc, p.kst, p.sg, (p.cat || []).join(', '), (p.alias || []).join(', '), p.sw || '', w.eiwit, w.suiker, w.verz, w.zout, w.vezel].map(cel).join(';'));
    });
    var text = '﻿' + regels.join('\r\n'), name = 'Mijn-Producten-' + fmtId(new Date()) + '.csv';
    try {
      var file = new File([text], name, { type: 'text/csv' });
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [file] })) {
        // v53-fix: weigering van het deel-menuutje wordt wél opgevangen → altijd het tekst-scherm als plan B
        navigator.share({ files: [file], title: 'Mijn Producten (tabel)' }).then(function () { }, function () { showOut('Mijn Producten (tabel)', 'Bewaren als bestand lukt hier niet. Tik op Kopiëren en bewaar de tekst in een notitie.', text, false, 'producten'); });
        return;
      }
    } catch (e) { }
    showOut('Mijn Producten (tabel)', 'Bewaren als bestand lukt hier niet. Tik op Kopiëren en bewaar de tekst in een notitie.', text, false, 'producten');
  }
  function saveProductsFile() {
    if (!S.prijzen.length) { toast('Je hebt nog geen producten om te bewaren'); return; }
    var cleanList = S.prijzen.map(function (p) {
      var o = { naam: p.n, categorie: p.cat || ['overig'], eenheid: p.u || 'g' };
      if (p.inh != null) o.inhoud = p.inh;
      if (p.pr != null) o.prijs = p.pr;
      if (p.bon != null) o.bonus_prijs = p.bon;
      if (p.kc != null) o.kcal = p.kc;
      if (p.kst != null) o.kcal_stuk = p.kst;
      if (p.sg != null) o.gewicht_stuk = p.sg;
      if (p.w && Object.keys(p.w).length) o.w = p.w;
      if (p.alias && p.alias.length) o.alias = p.alias;
      if (p.sw) o.stuknaam = p.sw;
      return o;
    });
    var text = JSON.stringify(cleanList, null, 2), name = 'Mijn-Producten-' + fmtId(new Date()) + '.json';
    try {
      var file = new File([text], name, { type: 'application/json' });
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Mijn Producten' }).then(function () { }, function () { showOut('Mijn Producten', 'Bewaren als bestand lukt hier niet. Tik op Kopiëren en bewaar de tekst in een notitie.', text, false, 'producten'); });
        return;
      }
    } catch (e) { }
    showOut('Mijn Producten', 'Bewaren als bestand lukt hier niet. Tik op Kopiëren en bewaar de tekst in een notitie.', text, false, 'producten');
  }

  function saveRecipesFile() {
    if (!S.recipes.length) { toast('Je hebt nog geen recepten om te bewaren'); return; }
    var cleanList = S.recipes.map(function (r) {
      var o = { name: r.name, ing: r.ing || [] };
      if (r.steps) o.steps = r.steps;
      if (r.por != null) o.por = r.por;
      if (r.fixed != null) o.fixed = r.fixed;
      if (r.unit) o.unit = r.unit;
      if (r.where && r.where.length) o.where = r.where;
      if (r.emoji) o.emoji = r.emoji;
      return o;
    });
    var text = JSON.stringify(cleanList, null, 2), name = 'Mijn-Recepten-' + fmtId(new Date()) + '.json';
    try {
      var file = new File([text], name, { type: 'application/json' });
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Mijn Recepten' }).then(function () { }, function () { showOut('Mijn Recepten', 'Bewaren als bestand lukt hier niet. Tik op Kopiëren en bewaar de tekst in een notitie.', text, false, 'recepten'); });
        return;
      }
    } catch (e) { }
    showOut('Mijn Recepten', 'Bewaren als bestand lukt hier niet. Tik op Kopiëren en bewaar de tekst in een notitie.', text, false, 'recepten');
  }

  // Variant C (28 okt): Bewaren week — alleen je weekdagen apart als bestand bewaren.
  // Zelfde patroon als saveProductsFile: delen via het deelvenster, anders downloaden, anders tekst tonen.
  function saveWeekFile() {
    var heeft = Object.keys(S.days || {}).some(function (k) { var d = S.days[k]; return d && (d.entries || []).length; });
    if (!heeft) { toast('Er staat nog niets in je week'); return; }
    var weekDays = {}; for (var i = 0; i < 7; i++) { var wid = fmtId(addDays(S.start, i)); if (S.days[wid]) weekDays[wid] = S.days[wid]; } // v56.2 punt 8: alleen de 7 dagen van de huidige week, geen recipes/prijzen/lijst
    var text = JSON.stringify({ v: 1, days: weekDays }, null, 2), name = 'Mijn-Week-' + fmtId(new Date()) + '.json';
    try {
      var file = new File([text], name, { type: 'application/json' });
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Mijn Week' }).then(function () { }, function () { showOut('Mijn Week', 'Bewaren als bestand lukt hier niet. Tik op Kopiëren en bewaar de tekst in een notitie.', text, false, 'week'); });
        return;
      }
    } catch (e) { }
    showOut('Mijn Week', 'Bewaren als bestand lukt hier niet. Tik op Kopiëren en bewaar de tekst in een notitie.', text, false, 'week');
  }

  function saveFile() {
    var text = backupJson(true), name = 'Eetweek-reservekopie-' + fmtId(new Date()) + '.json';
    try {
      var file = new File([text], name, { type: 'application/json' });
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Reservekopie Mijn Eetboek' }).then(markBackup, function () { showOut('Reservekopie', 'Bewaren als bestand lukt hier niet. Tik op Kopiëren en bewaar de tekst in een notitie.', backupJson(false), false, 'backup'); });
        return;
      }
    } catch (e) { }
    showOut('Reservekopie', 'Bewaren als bestand lukt hier niet. Tik op Kopiëren en bewaar de tekst in een notitie.', backupJson(false), false, 'backup');
  }
  // v45b: restorefile-input kan op meerdere pagina's staan (index.html + toevoegen.html); elk exemplaar koppelen
  document.querySelectorAll('#restorefile').forEach(function (inp) {
    inp.addEventListener('change', function (ev) {
    var f = ev.target.files && ev.target.files[0]; if (!f) return;
    var r = new FileReader(); r.onload = function () { restoreFrom(String(r.result)); ev.target.value = ''; }; r.readAsText(f);
    });
  });


  // =====================================================================
  // v40: exportknoppen voor recepten en producten
  // =====================================================================
  var EMO_RULES = [
    [/muffin|cupcake/, '🧁'], [/koekje|koek\b|cookie/, '🍪'], [/pizza/, '🍕'], [/tonijn|zalm|vis\b|makreel|haring|kibbeling/, '🐟'],
    [/\bei\b|eieren|omelet|roerei|\bei[a-z]*/, '🥚'], [/burger/, '🍔'], [/kip|kalkoen/, '🍗'], [/gehakt|vlees|biefstuk|worst|spek|ham\b/, '🥩'],
    [/pasta|spaghetti|macaroni|lasagne|noedel/, '🍝'], [/rijst|nasi|risotto/, '🍚'], [/soep|stamppot|bouillon/, '🍲'], [/salade|sla\b/, '🥗'],
    [/banaan/, '🍌'], [/appel|peer\b|peren/, '🍎'], [/tomaat|tomaten/, '🍅'], [/aardappel|friet|patat/, '🥔'], [/pindakaas|pinda|noten/, '🥜'],
    [/kwark|mousse|muesli|yoghurt|havermout|pap\b|vla/, '🥣'], [/\bijs\b|ijsje/, '🍨'], [/kaas|toast kaas/, '🧀'], [/melk|shake|smoothie/, '🥛'], [/brood|boterham|broodje|tosti|sandwich/, '🍞']
  ];
  var EMO_GROUP = { ochtend: '🥣', lunch: '🥪', middag: '🍎', avondeten: '🍽️', avondblok: '🍨', extra: '🍴' };
  var EMO_PALETTE = ['🧁', '🍪', '🍕', '🐟', '🥚', '🍗', '🍔', '🥩', '🍝', '🍚', '🍲', '🥗', '🍌', '🍎', '🍅', '🥔', '🥜', '🥣', '🍨', '🧀', '🥛', '🍞', '🥪', '🍽️', '🍰', '🥞', '🍓', '🥕'];
  function recEmoji(r) {
    if (r && typeof r.emoji === 'string' && r.emoji) return r.emoji;
    var nm = normName((r && r.name) || '');
    for (var i = 0; i < EMO_RULES.length; i++) if (EMO_RULES[i][0].test(nm)) return EMO_RULES[i][1];
    var w = r && r.where ? rWhere(r) : [];
    if (w.length && EMO_GROUP[w[0]]) return EMO_GROUP[w[0]];
    return '🍴';
  }
  function emoPalette(r) {
    return '<div class="emopal" role="group" aria-label="Kies een emoji voor ' + esc(r.name) + '">' +
      EMO_PALETTE.map(function (e) { return '<button class="pill" data-act="emoset" data-r="' + r.id + '" data-e="' + e + '" aria-pressed="' + (r.emoji === e) + '" aria-label="Emoji ' + e + '">' + e + '</button>'; }).join('') +
      '<button class="pill" data-act="emoset" data-r="' + r.id + '" data-e="" aria-pressed="' + (!r.emoji) + '">Automatisch</button></div>';
  }

  // ---- v45b.4: oude dagen omzetten naar de nieuwe indeling
  // Oude momenten: lm (lunch+middag samen), okb (ochtendblok), ovb (overbrugging), sport (na het sporten).
  // Ze blijven nu alleen zichtbaar als er iets in staat; deze functie zet de entries om naar de nieuwe slots.
  var OUD_MAP = { lm: 'lun', okb: 'wont', ovb: 'extra', sport: 'mdg' };
  var OUD_NAAM = { lm: 'Lunch + middag (oude indeling)', okb: 'Ochtendblok (oude indeling)', ovb: 'Overbrugging (oude indeling)', sport: 'Na het sporten (oude indeling)' };
  function oudHasData() {
    var n = 0;
    Object.keys(S.days || {}).forEach(function (id) {
      var d = S.days[id]; if (!d || !d.entries) return;
      d.entries.forEach(function (e) { if (e.slot && OUD_MAP[e.slot]) n++; });
    });
    return n;
  }
  function oudPreview() {
    // Geeft een overzicht: per dag hoeveel entries per oud moment
    var per = {};
    Object.keys(S.days || {}).forEach(function (id) {
      var d = S.days[id]; if (!d || !d.entries) return;
      var tell = {};
      d.entries.forEach(function (e) { if (e.slot && OUD_MAP[e.slot]) tell[e.slot] = (tell[e.slot] || 0) + 1; });
      if (Object.keys(tell).length) per[id] = tell;
    });
    return per;
  }
  function oudDo() {
    // Echt omzetten. Niets wordt weggegooid: entries met een oud slot krijgen een nieuw slot.
    // Notities en foto's bij het oude slot verplaatsen we mee naar het nieuwe slot (als die leeg is).
    var log = [], dagen = 0, entries = 0, notities = 0, fotos = 0, over = 0;
    Object.keys(S.days || {}).forEach(function (id) {
      var d = S.days[id]; if (!d || !d.entries) return;
      var changed = false;
      var newEntries = [];
      d.entries.forEach(function (e) {
        if (e.slot && OUD_MAP[e.slot]) {
          var ns = OUD_MAP[e.slot];
          var e2 = JSON.parse(JSON.stringify(e));
          e2.slot = ns;
          // aantekening op het entry zelf (zodat het in de weektekst zichtbaar blijft waar het vandaan kwam)
          e2.oudSlot = e.slot;
          newEntries.push(e2);
          entries++;
          log.push(id + ': "' + (e.name || e.key || '?') + '" ' + OUD_NAAM[e.slot] + ' → ' + ns);
          changed = true;
        } else {
          newEntries.push(e);
        }
      });
      if (changed) {
        d.entries = newEntries;
        // notities mee verhuizen
        if (d.notes) Object.keys(OUD_MAP).forEach(function (os) {
          if (d.notes[os]) { var nn = OUD_MAP[os]; if (!d.notes[nn]) { d.notes[nn] = d.notes[os]; notities++; } delete d.notes[os]; }
        });
        // foto's mee verhuizen
        if (d.photos) Object.keys(OUD_MAP).forEach(function (os) {
          if (d.photos[os]) { var np = OUD_MAP[os]; if (!d.photos[np]) { d.photos[np] = d.photos[os]; fotos++; } delete d.photos[os]; }
        });
        // why / whyText mee verhuizen
        if (d.why) Object.keys(OUD_MAP).forEach(function (os) {
          if (d.why[os] && d.why[os].length) { var nw2 = OUD_MAP[os]; d.why[nw2] = (d.why[nw2] || []).concat(d.why[os]); delete d.why[os]; }
        });
        if (d.whyText) Object.keys(OUD_MAP).forEach(function (os) {
          if (d.whyText[os]) { var nt2 = OUD_MAP[os]; if (!d.whyText[nt2]) d.whyText[nt2] = d.whyText[os]; delete d.whyText[os]; }
        });
        dagen++;
      }
    });
    // migratievlag zodat we dit maar 1x melden
    if (S.mig.indexOf('v45b4_oude_dagen') < 0) S.mig.push('v45b4_oude_dagen');
    persist();
    return { dagen: dagen, entries: entries, notities: notities, fotos: fotos, log: log };
  }
  function oudOpen() {
    S.oud = { done: false }; S.oudConfirm = false;
    pushLayer(); document.documentElement.classList.add('lock');
    $('oudsheet').hidden = false; renderOud();
  }
  function forceCloseOud() { S.oud = null; S.oudConfirm = false; $('oudsheet').hidden = true; document.documentElement.classList.remove('lock'); render(); }
  // v47: Verwijderen-sheet op het tandwiel (spiegelt oudOpen)
  function openVerw(mode) {
    S.verw = mode;
    pushLayer(); document.documentElement.classList.add('lock');
    $('verwsheet').hidden = false; renderVerw();
  }
  function forceCloseVerw() { S.verw = null; $('verwsheet').hidden = true; document.documentElement.classList.remove('lock'); render(); }
  function renderVerw() {
    var b = $('verwbody'); if (!b) return;
    var h = '';
    if (S.verw === 'menu') {
      h += '<h3 style="margin-top:0">Verwijderen</h3>';
      h += '<p class="hint" style="margin-top:0">Kies wat je wilt verwijderen. Eerste tik = bevestiging aan, tweede tik = echt verwijderen.</p>';
      h += '<button class="opt" data-act="verwopen" data-v="prodcat"><span class="on">🗑️ Categorie verwijderen<small>alle producten van één categorie</small></span></button>';
      h += '<button class="opt" data-act="prdelall"><span class="on">🗑️ Alle producten in één keer verwijderen…<small>alle producten van Producten</small></span></button>';
      h += '<button class="opt" data-act="verwopen" data-v="lijstcat"><span class="on">🗑️ Categorie weg (boodschappenlijstje)<small>alleen van het lijstje, producten blijven</small></span></button>';
      h += '<button class="opt" data-act="lclearall"><span class="on">🗑️ Alles in één keer van het lijstje halen…</span></button>';
      h += '<div class="btns" style="margin-top:10px"><button class="btn" data-act="verwclose">✕ Toch niet</button></div>';
      b.innerHTML = h; return;
    }
    if (S.verw === 'prodcat') {
      h += '<h3 style="margin-top:0">Productcategorie verwijderen</h3>';
      h += '<p class="hint" style="margin-top:0">Eerste tik laat zien hoeveel producten erin zitten, tweede tik verwijdert ze echt.</p>';
      var leeg = true;
      CATS.forEach(function (c) {
        var inCat = S.prijzen.filter(function (p) { return catsOf(p).indexOf(c.id) >= 0; });
        if (!inCat.length) return; leeg = false;
        h += '<button class="opt" data-act="prcatdel" data-c="' + c.id + '"><span class="on">' + c.i + ' ' + esc(c.n) +
          '<small>' + inCat.length + ' product' + (inCat.length === 1 ? '' : 'en') +
          (S.confirmProdCat === c.id ? ' — Echt álle ' + inCat.length + ' verwijderen? Tik nog een keer' : '') + '</small></span></button>';
      });
      if (leeg) h += '<p class="hint stat">Je hebt nog geen producten.</p>';
    } else if (S.verw === 'nieuwst') {
      // v47.4: kies-scherm (per dag, optioneel t/m)
      if (!S.verwKies) S.verwKies = { van: vandaagId(), tm: '' };
      var vk = S.verwKies;
      var sel = productenInPeriode(vk.van, vk.tm);
      h += '<h3 style="margin-top:0">Verwijder nieuwste producten</h3>';
      h += '<label class="hint" style="display:block;margin:6px 0 4px">Van welke dag?</label><input class="note" type="date" id="nwVan" value="' + esc(vk.van) + '" aria-label="Van welke dag?">';
      h += '<label class="hint" style="display:block;margin:10px 0 4px">Tot en met (alleen als je meerdere dagen wilt)</label><input class="note" type="date" id="nwTm" value="' + esc(vk.tm || '') + '" aria-label="Tot en met (leeg = alleen die ene dag)">';
      h += '<p class="hint" id="nwTel" style="margin-top:8px">' + esc(nieuwstTelling(vk.van, vk.tm, sel)) + '</p>';
      h += '<div class="btns" style="margin-top:10px"><button class="btn main" data-act="nieuwstlijst"' + (sel.length ? '' : ' disabled') + '>Laat zien welke het zijn</button><button class="btn" data-act="verwclose">Toch niet</button></div>';
    } else if (S.verw === 'nieuwstlijst') {
      // v47.4: lijst-then-dubbele-tik
      var sel2 = productenInPeriode(S.verwVan, S.verwTm);
      var perDag = {};
      sel2.forEach(function (p) { var d = p.gemaakt || ''; perDag[d] = (perDag[d] || 0) + 1; });
      var dagen = Object.keys(perDag).sort();
      var kopTxt = 'Deze ' + sel2.length + ' product' + (sel2.length === 1 ? '' : 'en') + ' gaan weg (' + (dagen.length > 1 ? 'per dag · ' + dagen[0] + ' t/m ' + dagen[dagen.length - 1] : 'per dag · ' + dagen[0]) + '):';
      h += '<button class="back" style="margin:0 0 8px -8px" data-act="nieuwstkies">‹ Terug naar kiezen</button>';
      h += '<p style="font-size:14px;color:var(--muted);margin:0 0 8px">' + esc(kopTxt) + '</p>';
      h += '<div style="max-height:40vh;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:6px 10px">';
      sel2.forEach(function (p) {
        h += '<div style="padding:4px 0;border-bottom:1px solid var(--line)">' + esc(p.n) + '<small style="display:block;color:var(--muted)">toegevoegd ' + esc(dagTekst(p.gemaakt)) + '</small></div>';
      });
      h += '</div>';
      h += '<p class="hint zz" style="margin:10px 0 0">⚠️ Weg = weg. Eerst terugkijken? Maak een reservekopie via Bewaren → Bewaren producten.</p>';
      h += '<div class="btns" style="margin-top:10px"><button class="btn main" data-act="nieuwstdel">' + (S.confirmNieuwst ? 'Weet je het zeker? Tik nog een keer' : 'Verwijder deze ' + sel2.length + ' product' + (sel2.length === 1 ? '' : 'en')) + '</button></div>';
    } else if (S.verw === 'lijstcat') {
      h += '<h3 style="margin-top:0">Categorie weg van het lijstje</h3>';
      h += '<p class="hint" style="margin-top:0">De producten zelf blijven bestaan — alleen het lijstje wordt leeggeruimd.</p>';
      var lleeg = true;
      CATS.forEach(function (c) {
        var its = S.lijst.filter(function (l) { return lijstInfo(l).cat === c.id; });
        if (!its.length) return; lleeg = false;
        h += '<button class="opt" data-act="lcatdel" data-c="' + c.id + '"><span class="on">' + c.i + ' ' + esc(c.n) +
          '<small>' + its.length + ' op het lijstje' +
          (S.confirmLijstCat === c.id ? ' — Echt deze hele categorie weg? Tik nog een keer' : '') + '</small></span></button>';
      });
      if (lleeg) h += '<p class="hint">Er staat nog niets op het lijstje.</p>';
    }
    h += '<div class="btns"><button class="btn" data-act="verwclose">✕ Toch niet</button></div>';
    b.innerHTML = h;
  }
  // v47.4: producten met aanmaak-datum in periode (van t/m tm; tm leeg = alleen van; tm vóór van = alleen van)
  function productenInPeriode(van, tm) {
    if (!van) return [];
    var tot = (tm && tm >= van) ? tm : van;
    return S.prijzen.filter(function (p) { return p.gemaakt && p.gemaakt >= van && p.gemaakt <= tot; });
  }
  function dagTekst(id) {
    if (!id) return 'datum onbekend';
    var p = id.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return cap(DOW[d.getDay()]) + ' ' + d.getDate() + ' ' + MON[d.getMonth()];
  }
  function nieuwstTelling(van, tm, sel) {
    if (!sel.length) return 'Op deze dag zijn geen producten toegevoegd.';
    var perDag = {};
    sel.forEach(function (p) { perDag[p.gemaakt] = (perDag[p.gemaakt] || 0) + 1; });
    var dagen = Object.keys(perDag).sort();
    if (dagen.length === 1) return 'Op ' + dagTekst(dagen[0]) + ' zijn ' + sel.length + ' product' + (sel.length === 1 ? '' : 'en') + ' toegevoegd.';
    var dl = dagen.map(function (d) { return dagTekst(d) + ' ' + perDag[d]; }).join(', ');
    return 'Van ' + dagTekst(dagen[0]) + ' t/m ' + dagTekst(dagen[dagen.length - 1]) + ' samen ' + sel.length + ' product' + (sel.length === 1 ? '' : 'en') + ' toegevoegd: ' + dl + '.';
  }
  // v47: live teksten van de Verwijderen-knoppen op het tandwiel
  function renderInst() {
    var bpa = $('btnVerwProdAll'), bla = $('btnVerwLijstAll');
    if (bpa) bpa.innerHTML = S.confirmProdAll
      ? '<span>Echt álle ' + S.prijzen.length + ' producten verwijderen? Dit kan niet ongedraaid worden — maak eerst een reservekopie.</span><small>Tik nog een keer om zeker te weten</small>'
      : '<span>Alle producten in één keer verwijderen…</span><small>eerste tik = bevestiging aan</small>';
    if (bla) bla.innerHTML = S.confirmLijstAll
      ? '<span>Echt álle ' + S.lijst.length + ' items van het lijstje halen?</span><small>Tik nog een keer om zeker te weten</small>'
      : '<span>Alles in één keer van het lijstje halen…</span><small>eerste tik = bevestiging aan</small>';
    if ($('normaalbody') && typeof renderNormaal === 'function') renderNormaal(); // v49: ⚡ Mijn normale dag
  }
  function renderOud() {
    var b = $('oudbody'); if (!b) return;
    var per = oudPreview(), n = oudHasData();
    var h = '';
    if (S.oud && S.oud.done) {
      var r = S.oud.result || {};
      h += '<h3 style="margin-top:0">Klaar</h3>';
      h += '<p class="hint" style="margin-top:0">' + (r.dagen || 0) + ' dag' + ((r.dagen || 0) === 1 ? '' : 'en') + ' omgezet · ' + (r.entries || 0) + ' keuze' + ((r.entries || 0) === 1 ? '' : 's') + ' verplaatst' +
        ((r.notities || 0) ? ' · ' + r.notities + ' notitie' + (r.notities === 1 ? '' : 's') + ' meeverhuisd' : '') +
        ((r.fotos || 0) ? ' · ' + r.fotos + ' foto' + (r.fotos === 1 ? '' : "\'s") + ' meeverhuisd' : '') + '.</p>';
      h += '<p class="hint">Niets is weggegooid. Bij elke verplaatste keuze staat in de weektekst waar die vandaan kwam (oude indeling).</p>';
      if (r.log && r.log.length) {
        h += '<h3>Wat is omgezet</h3><ul class="ing">' + r.log.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>';
      }
      h += '<div class="btns"><button class="btn main" data-act="oudclose">Sluiten</button></div>';
      b.innerHTML = h; return;
    }
    h += '<h3 style="margin-top:0">Oude dagen omzetten</h3>';
    h += '<p class="hint" style="margin-top:0">Sommige dagen in je week gebruiken nog de oude indeling: <b>Lunch + middag samen</b>, <b>Ochtendblok</b>, <b>Overbrugging</b> en <b>Na het sporten</b>. Die momenten zie je nu alleen als er iets in staat.</p>';
    h += '<p class="hint">Met deze knop zet je die keuzes om naar de nieuwe momenten: <b>Lunch + middag</b> → <b>Lunch</b>, <b>Ochtendblok</b> → <b>Ontbijt</b>, <b>Overbrugging</b> → <b>Extra, buiten het schema</b>, <b>Na het sporten</b> → <b>Middag</b>. Notities, foto\'s en "waarom"-keuzes verhuizen mee. <b>Niets wordt weggegooid.</b></p>';
    if (!n) {
      h += '<div class="pricebox" style="margin-top:8px">Er zijn geen oude dagen meer gevonden. Alles staat al in de nieuwe indeling.</div>';
      h += '<div class="btns"><button class="btn" data-act="oudclose">Sluiten</button></div>';
      b.innerHTML = h; return;
    }
    var ids = Object.keys(per).sort();
    h += '<h3>Gevonden: ' + n + ' oude keuze' + (n === 1 ? '' : 's') + ' in ' + ids.length + ' dag' + (ids.length === 1 ? '' : 'en') + '</h3>';
    h += '<ul class="ing">';
    ids.forEach(function (id) {
      var p = id.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
      var t = Object.keys(per[id]).map(function (s) { return per[id][s] + '× ' + OUD_NAAM[s]; }).join(', ');
      h += '<li><b>' + esc(cap(DOW[dt.getDay()])) + ' ' + dt.getDate() + ' ' + MON[dt.getMonth()] + ' ' + dt.getFullYear() + '</b>: ' + esc(t) + '</li>';
    });
    h += '</ul>';
    h += '<div class="pricebox" style="margin-top:8px"><b>Let op:</b> dit kan niet teruggedraaid worden. Maak eerst een reservekopie (die staat bij ⚙️ Instellingen, blokje 💾 Bewaren), dan weet je zeker dat je oude week bewaard blijft.</div>';
    if (S.oudConfirm) {
      h += '<p class="hint" style="color:var(--fg)"><b>Weet je het zeker?</b> Tik nog een keer op omzetten om het echt te doen.</p>';
    }
    h += '<div class="btns">' +
      '<button class="btn main" data-act="ouddo">' + (S.oudConfirm ? 'Ja, echt omzetten' : 'Oude dagen omzetten') + '</button>' +
      '<button class="btn" data-act="oudclose">Annuleren</button></div>';
    b.innerHTML = h;
  }

  // ---- Mijn eetmomenten
  var RG_ORDER = [1, 2, 3, 4, 5, 6, 0];
  function rgOpen() {
    S.rg = true; S.rgConfirm = false; pushLayer(); document.documentElement.classList.add('lock');
    $('rgsheet').hidden = false; renderRg();
  }
  function forceCloseRg() { S.rg = false; S.rgConfirm = false; $('rgsheet').hidden = true; document.documentElement.classList.remove('lock'); render(); }
  function rgSet(k, v) {
    var m = /^d([0-6]):([a-z]+)$/.exec(k); if (!m) return;
    var d = rgDefault(+m[1], m[2]); if (d == null) return;
    v = Math.round(v); if (!isFinite(v)) return; v = Math.max(0, Math.min(3000, v));
    if (v === d) delete S.maxes[k]; else S.maxes[k] = v;
    persist();
  }
  function renderRg() {
    var b = $('rgbody'); if (!b) return; var st = b.scrollTop;
    var changed = Object.keys(S.maxes).length;
    var h = '<h3>Zo werkt het schema</h3><ul class="rgbul">' +
      '<li>Elk moment heeft een maximum ("tot"), behalve het avondeten doordeweeks: dat is een gemiddelde.</li>' +
      '<li>Er is geen minimum. Minder eten of een moment overslaan mag altijd.</li>' +
      '<li>De middag kies je uit Blok 3 of Blok 8, de avond uit Blok Avond, Blok 3 of Blok 8. In 1 of 2 delen.</li>' +
      '<li>In het weekend is het avondeten een maximum.</li>' +
      '<li>Heb je \'s avonds vaak grote trek na een lege middag? Neem dan iets kleins in de middag.</li>' +
      '<li>Het weekgemiddelde telt, niet één dag.</li>' +
      '<li>Kleine dingen (een mandarijn, wat aardbeien, rauwkost, 2 augurken met zilveruitjes) tellen mee: reken ± 35 kcal per keer.</li></ul>' +
      '<p class="hint zz">Dit schema is er om van te profiteren, niet om aan te voldoen. Een dag die anders loopt is geen mislukking.</p>' + // fix-ronde 10 nov: korte zinnetjes direct zichtbaar
      '<h3>Vrije Keuze-check</h3><div class="ck"><span>Calorieën</span><b>≤ ± 250 kcal</b></div>' +
      '<div class="ck"><span>Eiwit</span><b>liefst 8–10 g of meer</b></div><div class="ck"><span>Suikers</span><b>≤ 5 g hartig · ≤ 10 g zoet</b></div>' +
      '<div class="ck"><span>Verzadigd vet</span><b>≤ 3 g</b></div><div class="ck"><span>Zout</span><b>≤ 1,2 g</b></div><div class="ck"><span>Vezels</span><b>≥ 3 g</b></div>' +
      '<p class="hint">Past een product er net niet in? Neem dan een kleinere portie, binnen het maximum van dat moment.</p>' +
      '<h3>Mijn maxima per moment</h3><p class="hint" style="margin-top:0">Tik op een dag. Pas een getal aan met − en + (stappen van 10) of typ het zelf. Minder mag altijd.</p>';
    RG_ORDER.forEach(function (d) {
      var rows = RG_DEF[d], nch = rows.filter(function (r) { return rgMax(d, r[0]) !== r[3]; }).length;
      h += '<details class="grp" data-rgd="' + d + '"' + (S.rgOpen[d] ? ' open' : '') + '><summary><span>' + esc(cap(DOW[d])) + '</span><span class="gcnt">' + (nch ? nch + ' aangepast' : rows.length) + '</span></summary>';
      rows.forEach(function (r) {
        var k = 'd' + d + ':' + r[0], v = rgMax(d, r[0]), ch = v !== r[3];
        h += '<div class="rgrow"><div class="rgl"><b>' + esc(r[1]) + '</b><div class="hint small" style="margin:0">' + (r[2] === 'gem' ? 'gemiddelde' : 'maximum') + ' · standaard ' + r[3] + (ch ? ' · aangepast' : '') + '</div></div>' +
          '<div class="rgin"><button class="pill" data-act="rgstep" data-k="' + k + '" data-s="-10" aria-label="10 minder, ' + esc(r[1]) + ' ' + esc(DOW[d]) + '">−</button>' +
          '<input type="text" inputmode="numeric" autocomplete="off" data-rgk="' + k + '" value="' + v + '" aria-label="' + esc(r[1]) + ' ' + esc(DOW[d]) + ', kcal">' +
          '<button class="pill" data-act="rgstep" data-k="' + k + '" data-s="10" aria-label="10 meer, ' + esc(r[1]) + ' ' + esc(DOW[d]) + '">+</button></div></div>' +
          (ch ? '<div style="text-align:right"><button class="pill" data-act="rgreset" data-k="' + k + '">Terug naar ' + r[3] + '</button></div>' : '');
      });
      h += '<p class="hint" style="margin:6px 0 0">Samen op deze dag: <b>' + dagDoel(d) + ' kcal</b> (alleen de momenten met een maximum hier).</p></details>';
    });
    h += '<div class="seg"><button class="pill" data-act="rgresetall"' + (changed ? '' : ' disabled') + '>' + (S.rgConfirm ? 'Echt alles terugzetten?' : 'Terug naar het schema van 7 oktober') + '</button></div>' +
      '<p class="hint">Het weekoverzicht op Week laat geen calorieën zien tot je op "Toon calorieën" tikt. Je maxima staan alleen hier.</p>';
    b.innerHTML = h; b.scrollTop = st;
  }
  document.addEventListener('toggle', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute) return;
    var d = t.getAttribute('data-rgd'); if (d != null) { if (t.open) S.rgOpen[d] = true; else delete S.rgOpen[d]; }
  }, true);
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute) return;
    var k = t.getAttribute('data-rgk'); if (!k) return;
    var n = num(t.value); if (n == null) { renderRg(); return; }
    rgSet(k, n); renderRg();
  });
