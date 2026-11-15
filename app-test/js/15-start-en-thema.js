    var std = ING_GRPS.map(function (gn) {
      return '<p class="hint" style="margin:10px 0 0"><b>' + esc(gn) + '</b></p>' + ING_DB.map(function (x, i) { return ING_GRP[i] === gn ? '<button class="opt" data-act="ingpick" data-v="d' + i + '"><span class="on">' + esc(x[0]) + '<small>' + esc(x[1]) + '</small></span></button>' : ''; }).join('');
    }).join('');
    ['OP', 'LU', 'ND', 'NE', 'NF', 'NK'].forEach(function (gk) { if (G[gk]) std += '<p class="hint" style="margin:10px 0 0"><b>' + esc(G[gk].t) + '</b></p>' + G[gk].items.map(function (it, i) { return it.h ? '' : '<button class="opt" data-act="ingpick" data-v="g' + gk + ':' + i + '"><span class="on">' + esc(it.n) + '</span></button>'; }).join(''); });
    h += '<details class="others" data-ig="std"' + (S.ingOpen['std'] ? ' open' : '') + '><summary>Standaardlijst van de app (met kcal per keuze)</summary>' + std + '</details>';
    }
    h += '</div>';
    h += '<h3>Of typ zelf een ingrediënt</h3><div class="addrow"><input id="cname" type="text" maxlength="60" autocomplete="off" placeholder="Naam" aria-label="Naam ingrediënt"><input id="camt" type="text" inputmode="decimal" autocomplete="off" placeholder="Aantal" aria-label="Hoeveelheid"><select id="cunit" aria-label="Eenheid"><option>g</option><option>ml</option><option>stuk</option><option>el</option><option>tl</option></select></div>' +
      '<button class="btn" style="width:100%;margin-top:8px" data-act="ingcustom">Eigen ingrediënt toevoegen</button><p class="hint">Een eigen ingrediënt staat wel in het recept, maar telt niet mee in het totaal.</p>';
 return h; })());
    h += sec('ber', '👨‍🍳 Bereiding (hoeft niet)', (function () { var h = '';
    h += '<h3>Bereiding (hoeft niet)</h3><textarea class="note steps" id="recsteps" maxlength="3000" placeholder="Eén stap per regel. Regels die beginnen met Tip:, Bewaren: of Opwarmen: krijgen geen nummer." aria-label="Bereiding">' + esc(R.steps || '') + '</textarea>';
 return h; })());

    body.innerHTML = h; body.scrollTop = keep; calcRecEditTotal();
  }
  function recSave() {
    var R = S.rec; if (!R) return false;
    var nm = ($('recname').value || '').trim();
    if (!nm) { toast('Geef het recept een naam'); return false; }
    if (!R.ing.length) { toast('Voeg minstens één ingrediënt toe'); return false; }
    var dupR = recNaamBestaat(nm, S.recipes.filter(function (x) { return x.id !== (R.id || ''); }));
    if (dupR) { // v57.5: dubbele naam -> eerste tik waarschuwt, tweede tik (binnen 5 s) bewaart pas echt (zelfde rem als 'Alles leegmaken')
      if (S.confirmRecDup !== nm) {
        S.confirmRecDup = nm; clearTimeout(S._recDupT);
        S._recDupT = setTimeout(function () { S.confirmRecDup = null; }, 5000);
        toast('Er is al een recept met deze naam — nog een keer tikken = toch bewaren');
        return false;
      }
      clearTimeout(S._recDupT); S.confirmRecDup = null;
    }
    R.ing.forEach(function (i) { var n = num(i.a); i.a = n != null && String(i.a).indexOf('-') < 0 ? n : i.a; });
    var rec = { id: R.id || uid(), name: nm, ing: R.ing }; var stp = ($('recsteps') ? $('recsteps').value : R.steps || '').trim(); if (stp) rec.steps = stp; if (R.fixed != null) rec.fixed = R.fixed; if (R.unit) rec.unit = R.unit; var pn = num(R.por); if (pn != null && pn > 0 && pn !== 1) rec.por = pn; if (R.snel) { rec.snel = true; var sm2 = num(R.snelMin); if (sm2 != null && sm2 > 0) rec.snelMin = sm2; }
    var wh = RGROUPS.map(function (g) { return g.id; }).filter(function (w) { return (R.where || []).indexOf(w) >= 0; }); if (wh.length) rec.where = wh;
    if (R.emoji) rec.emoji = R.emoji;
    var idx = -1; S.recipes.forEach(function (x, i) { if (x.id === rec.id) idx = i; });
    if (idx >= 0) S.recipes[idx] = rec; else S.recipes.push(rec);
    persist(); toast('Recept bewaard'); return true;
  }
  function forceCloseRec() { S.rec = null; $('recsheet').hidden = true; if (!S.sheet && !S.paste && $('outsheet').hidden) document.documentElement.classList.remove('lock'); render(); }

  // ---- recept plakken
  function openPaste() {
    S.paste = { text: '', err: '', prev: null, where: [] };
    pushLayer(); document.documentElement.classList.add('lock'); $('pastesheet').hidden = false; renderPaste();
  }
  function forceClosePaste() { S.paste = null; $('pastesheet').hidden = true; if (!S.sheet && !S.rec && $('outsheet').hidden) document.documentElement.classList.remove('lock'); render(); }
  function syncPaste() { var ta = $('pastetxt'); if (ta && S.paste) S.paste.text = ta.value; }
  // v45b.8: leest ook andere veldnamen (titel/naam, name/naam bij ingrediënten, "100g" als tekst, stappen als lijstje).
  // Er wordt niets verzonnen: wat niet te lezen is, wordt weggelaten en gemeld.
  function parseRecipeJson(text) {
    var o;
    try { o = JSON.parse(text); } catch (e) { return { err: 'Dit is geen geldige tekst. Plak de volledige JSON, met accolades en al.' }; }
    if (!o || typeof o !== 'object' || Array.isArray(o)) return { err: 'Dit lijkt geen recept. Er wordt een object verwacht.' };
    var omgezet = [], gebruikt = {};
    function pak(obj, namen, label) {
      for (var k = 0; k < namen.length; k++) {
        if (obj && obj[namen[k]] != null && obj[namen[k]] !== '') {
          if (label) {
            if (k > 0) { var t = '"' + namen[k] + '" → "' + namen[0] + '"'; if (omgezet.indexOf(t) < 0) omgezet.push(t); }
            gebruikt[namen[k]] = 1;
          }
          return obj[namen[k]];
        }
      }
      return undefined;
    }
    var rawName = pak(o, ['name', 'titel', 'naam', 'title', 'receptnaam'], true);
    var name = typeof rawName === 'string' ? rawName.trim().slice(0, 60) : '';
    if (!name) return { err: 'Het recept mist het veld "name" (de naam van het recept).\nDe app kent deze velden: name, ing, steps, emoji, por, fixed, where. ' + (Object.keys(o).length ? 'Gevonden in jouw tekst: ' + Object.keys(o).slice(0, 12).join(', ') + '.' : 'In jouw tekst staat verder niets (alleen lege accolades).') };
    var rawIng = pak(o, ['ing', 'ingrediënten', 'ingredienten', 'ingredients', 'ingrediënt'], true);
    if (!Array.isArray(rawIng) || !rawIng.length) return { err: 'Het recept mist het veld "ing" (de ingrediënten).' };
    var ing = [];
    for (var i = 0; i < rawIng.length; i++) {
      var x = rawIng[i];
      var xn = x && typeof x === 'object' ? pak(x, ['n', 'name', 'naam', 'ingredient', 'ingrediënt'], true) : undefined;
      if (typeof x === 'string') return { err: 'Ingrediënt ' + (i + 1) + ' is een losse tekst ("' + x.slice(0, 40) + '"). De app wil per ingrediënt een blokje met de naam, de hoeveelheid en de eenheid, bijvoorbeeld {"n":"Havermout","a":60,"u":"g"}.' };
      if (typeof xn !== 'string' || !xn.trim()) return { err: 'Ingrediënt ' + (i + 1) + ' mist het veld "n" (de naam). Ik zocht ook naar "name", "naam" en "ingredient".' };
      var ra = pak(x, ['a', 'amount', 'aantal', 'hoeveelheid'], true), ru = pak(x, ['u', 'unit', 'eenheid'], true), a = '', u = '';
      if (typeof ra === 'number' && isFinite(ra)) a = ra;
      else if (typeof ra === 'string' && ra.trim()) {
        var mm = /^\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*(.*)$/.exec(ra);
        if (mm) { a = /\//.test(mm[1]) ? mm[1].replace(/\s+/g, '') : parseFloat(mm[1].replace(',', '.')); u = mm[2].trim(); } else { a = ''; u = ra.trim(); }
        if (u && !/^[a-zA-Zµ.% ]+$/.test(u)) { u = ''; }
      }
      if (typeof ru === 'string' && ru.trim()) u = ru.trim();
      var p = (typeof x.p === 'number' && isFinite(x.p)) ? x.p : null;
      ing.push({ n: xn.trim().slice(0, 80), a: a, u: String(u).slice(0, 20), p: p });
    }
    var rec = { name: name, ing: ing };
    var rawSteps = pak(o, ['steps', 'instructies', 'stappen', 'bereiding', 'instructions'], true);
    if (Array.isArray(rawSteps)) rawSteps = rawSteps.filter(function (t) { return typeof t === 'string' && t.trim(); }).map(function (t, k) { return (k + 1) + '. ' + t.trim().replace(/^\d+[.)]\s*/, ''); }).join('\n');
    if (typeof rawSteps === 'string' && rawSteps.trim()) rec.steps = rawSteps.trim().slice(0, 3000);
    var weg = [];
    if (o.fixed != null) { if (typeof o.fixed === 'number' && isFinite(o.fixed)) rec.fixed = o.fixed; else weg.push('fixed (verwacht een getal)'); }
    if (typeof o.por === 'number' && isFinite(o.por) && o.por > 0) rec.por = o.por;
    if (typeof o.emoji === 'string' && o.emoji.trim() && o.emoji.trim().length <= 8) rec.emoji = o.emoji.trim(); else if (o.emoji != null) weg.push('emoji (geen geldige emoji)');
    if (Array.isArray(o.where)) { var ww = RGROUPS.map(function (g) { return g.id; }).filter(function (w) { return o.where.indexOf(w) >= 0; }); if (ww.length) rec.where = ww; }
    else if (o.where != null) weg.push('where (verwacht een lijstje met momenten)');
    var bekend = { name: 1, ing: 1, steps: 1, fixed: 1, por: 1, emoji: 1, where: 1 };
    var onbekend = Object.keys(o).filter(function (k) { return !bekend[k] && !gebruikt[k]; });
    var note = '';
    if (omgezet.length) note += 'Andere veldnamen herkend: ' + omgezet.join(', ') + '. ';
    if (weg.length) note += 'Niet overgenomen: ' + weg.join(', ') + '. ';
    if (onbekend.length) note += 'De app kent deze velden niet en laat ze weg: ' + onbekend.join(', ') + '.';
    return { rec: rec, note: note.trim() };
  }
  function renderPaste() {
    var P = S.paste; if (!P) return;
    var body = $('pastebody');
    if (P.koppel) { body.innerHTML = koppelHtml(P); return; }
    if (P.multi) { body.innerHTML = renderMulti(P); return; }
    var h = '<h3>Recept</h3><textarea class="note steps" id="pastetxt" placeholder="Plak hier het recept (JSON)" aria-label="Recept als tekst">' + esc(P.text) + '</textarea>';
    h += '<div class="seg mvact" style="display:grid;grid-template-columns:1fr 1fr"><button class="pill" data-act="pastecheck">Controleer</button><button class="pill" data-act="pastefile">Kies bestand</button></div>';
    if (P.err) h += '<p class="hint stat" style="color:var(--fg)">' + esc(P.err) + '</p>'; // v57.5: foutmeldingen (plakken/scanner) altijd zichtbaar
    if (P.prev) {
      var r = P.prev, tot = recKcal(r, 1), unk = recUnknown(r);
      if (P.note) h += '<p class="hint" style="color:var(--fg)">ℹ️ ' + esc(P.note) + '</p>';
      // v50.7 test (idee 4): plak-scherm — naam bovenaan, de rest dicht achter één uitklapper
      h += '<h3>Voorbeeld, zo komt het in de app</h3><div class="rcard"><h3>' + esc(r.name) + '</h3><details class="grp" style="margin-top:8px"><summary><span>Ingrediënten, bereiding en koppelingen</span></summary><div style="padding:0 4px 6px"><ul>' +
        r.ing.map(function (i) { var kc = (i.p != null && num(i.a) != null) ? ' (± ' + Math.round(num(i.a) * i.p) + ' kcal)' : (ingKruid(i) ? ' (kruid, 0 kcal)' : ' (nog te schatten)'); return '<li>' + esc(ingText(i, 1)) + esc(kc) + '</li>'; }).join('') +
        '</ul>' + stepsHtml(r) + '</div></details></div>';
      var gk = gekoppeldLijst(r);
      if (gk.length) {
        h += '<h3>Al gekoppeld, kijk even of het klopt</h3><p class="hint" style="margin-top:0">Deze ingrediënten heeft de app herkend aan een product dat je al hebt. Hier hoef je niets te kiezen.</p><div class="rcard" style="padding:10px 12px">' +
          gk.map(function (g) { return '<div style="margin:4px 0"><b>' + esc(g.i) + '</b> → ' + esc(g.p) + '<br><span class="hint" style="margin:0' + (g.bad ? ';color:var(--fg);font-weight:600' : '') + '">' + (g.bad ? '⚠ ' : '') + esc(g.s) + '</span></div>'; }).join('') + '</div>';
      }
      if ((P.kr || []).length) {
        h += '<h3>Wil je nog producten koppelen?</h3><p class="hint" style="margin-top:0">Deze ingrediënten staan nog niet bij Mijn producten, dus ze tellen niet mee in de calorieën. Kies bij elk ingrediënt zelf wat je wilt; er is niets voorgekozen. Bewaren kan pas als alles een keuze heeft.</p>';
        P.kr.forEach(function (kr, ki) { h += koppelRadios(kr, ki); });
      }
      h += '<p class="hint">Totaal ± ' + tot + ' kcal' + (unk ? ', plus ingrediënten die nog te schatten zijn' : '') + '. Met het kcal-getal rekent de app zelf; de tekst hierboven is alleen om te controleren.</p>';
      h += '<h3>Waar wil je dit recept zien?</h3><p class="hint" style="margin-top:0">Meerdere mag. Niets aangevinkt: bij elk moment.</p><div class="seg mvact">' +
        RGROUPS.map(function (g) { return '<button class="pill" data-act="pastewhere" data-w="' + g.id + '" aria-pressed="' + (P.where.indexOf(g.id) >= 0) + '">' + esc(g.t) + '</button>'; }).join('') + '</div>';
      h += '<div class="btns"><button class="btn main" data-act="pastesave">Bewaar bij Recepten</button></div>';
    }
    body.innerHTML = h;
  }
  function recNaamBestaat(n, lijst) {
    var k = String(n || '').trim().toLowerCase();
    return lijst.some(function (r) { return String(r.name || '').trim().toLowerCase() === k; });
  }
  function renderMulti(P) {
    var items = P.multi, n = items.filter(function (m) { return m.on; }).length;
    var h = '<h3>' + items.length + ' bestanden gekozen</h3><p class="hint" style="margin-top:0">Tik bij elk recept waar je het wilt zien. Niets aangevinkt: bij elk moment. Recepten met een naam die je al hebt, of een bestand dat niet klopt, worden niet bewaard.</p>';
    items.forEach(function (m, i) {
      h += '<div class="rcard">';
      if (m.err) { h += '<h3>' + esc(m.file) + '</h3><p class="hint stat" style="color:var(--fg)">Overgeslagen: ' + esc(m.err) + '</p> // v57.5</div>'; return; }
      var r = m.rec;
      h += '<h3>' + esc(r.name) + '</h3>';
      if (m.note) h += '<p class="hint" style="margin-top:0">ℹ️ ' + esc(m.note) + '</p>';
      if (m.dup) { h += '<p class="hint stat" style="color:var(--fg)">Overgeslagen: ' + esc(m.dup) + '</p> // v57.5</div>'; return; }
      h += '<p class="hint" style="margin-top:0">' + r.ing.length + ' ingrediënten, totaal ± ' + recKcal(r, 1) + ' kcal' + (recUnknown(r) ? ', plus ingrediënten die nog te schatten zijn' : '') + '</p>';
      h += '<details><summary>Bekijk het recept</summary><ul>' + r.ing.map(function (g) { return '<li>' + esc(ingText(g, 1)) + '</li>'; }).join('') + '</ul>' + stepsHtml(r) + '</details>';
      h += '<div class="seg mvact">' + RGROUPS.map(function (g) { return '<button class="pill" data-act="multiwhere" data-i="' + i + '" data-w="' + g.id + '" aria-pressed="' + (m.where.indexOf(g.id) >= 0) + '">' + esc(g.t) + '</button>'; }).join('') + '</div>';
      h += '<div class="seg mvact"><button class="pill" data-act="multion" data-i="' + i + '" aria-pressed="' + m.on + '">' + (m.on ? 'Wordt bewaard' : 'Niet bewaren') + '</button></div></div>';
    });
    h += '<div class="btns"><button class="btn main" data-act="multisave"' + (n ? '' : ' disabled') + '>Bewaar alles (' + n + ')</button></div>';
    return h;
  }
  function multiLaad(files) {
    var P = S.paste; if (!P) return;
    var lijst = Array.prototype.slice.call(files), uit = [], klaar = 0;
    lijst.forEach(function (f, i) {
      var fr = new FileReader();
      fr.onload = function () { uit[i] = String(fr.result); fin(); };
      fr.onerror = function () { uit[i] = null; fin(); };
      fr.readAsText(f);
    });
    async function fin() {
      klaar++; if (klaar < lijst.length || !S.paste) return;
      var items = [], gezien = [];
      await Promise.all(lijst.map(async function (f, i) {
        var m = { file: f.name, on: false, where: [] };
        if (uit[i] == null) m.err = 'dit bestand kon ik niet openen.';
        else {
          var tekst = uit[i], isJson = /^\s*[[{]/.test(tekst) || /\.json$/i.test(f.name);
          if (!isJson) { try { tekst = await mistralTekstNaarRecept(tekst); } catch (e) { m.err = 'dit bestand bevat geen leesbaar recept.'; items[i] = m; return; } } // keuring 8 nov: .txt-recept via Mistral
          var res = parseRecipeJson(tekst);
          if (res.err) m.err = /^Dit is geen geldige tekst/.test(res.err) ? 'dit bestand bevat geen geldig recept.' : res.err;
          else {
            m.rec = res.rec; m.note = res.note || ''; m.where = (res.rec.where || []).slice();
            if (recNaamBestaat(res.rec.name, S.recipes)) m.dup = 'je hebt al een recept met deze naam.';
            else if (recNaamBestaat(res.rec.name, gezien)) m.dup = 'dezelfde naam zit al in een ander gekozen bestand.';
            else { m.on = true; gezien.push(res.rec); }
          }
        }
        items[i] = m;
      }));
      if (!S.paste) return;
      S.paste.multi = items; S.paste.err = ''; renderPaste();
    }
  }
  function multiSave() {
    var P = S.paste; if (!P || !P.multi) return;
    var nieuw = 0, over = 0, bewaard = [];
    P.multi.forEach(function (m) {
      if (!m.on || !m.rec) { over++; return; }
      if (recNaamBestaat(m.rec.name, S.recipes)) { over++; return; }
      var rec = JSON.parse(JSON.stringify(m.rec)); rec.id = uid();
      var wh = RGROUPS.map(function (g) { return g.id; }).filter(function (w) { return m.where.indexOf(w) >= 0; });
      if (wh.length) rec.where = wh; else delete rec.where;
      autoProdKcal(rec); S.recipes.push(rec); nieuw++; bewaard.push(rec);
    });
    persist(); koppelStart(bewaard, nieuw + ' ' + (nieuw === 1 ? 'recept' : 'recepten') + ' bewaard' + (over ? ', ' + over + ' overgeslagen' : ''));
  }
  // v45d.4: koppelen kan nu al in het controlescherm van Recept plakken (vóór Bewaar). Alleen bij Bewaar alles (meerdere recepten) komt er na het bewaren nog een extra scherm.
  function autoProdKcal(rec) {
    (rec.ing || []).forEach(function (i) {
      if (i.p != null || ingKruid(i)) return;
      var ex = findProd(i.n); if (!ex) return;
      var kp = prodKcPer(ex);
      if (kp != null && (i.u === ex.u || (i.u === 'x' && ex.u === 'stuk'))) i.p = kp;
    });
  }
  // v45d.5: overzicht van ingrediënten die al aan een bestaand product hangen (alleen kijken, niets kiezen)
  function gekoppeldLijst(rec) {
    var uit = [];
    (rec.ing || []).forEach(function (i) {
      if (ingKruid(i)) return;
      var ex = findProd(i.n); if (!ex) return;
      var w = telWaarschuwing(ex, i.u);
      var tel = (i.p != null && num(i.a) != null) ? '± ' + Math.round(num(i.a) * i.p) + ' kcal in dit recept' : (w ? 'Nog te schatten (' + w + ')' : 'Nog te schatten');
      uit.push({ i: ingText(i, 1), p: ex.n, s: tel, bad: i.p == null });
    });
    return uit;
  }
  function koppelRows(recs) {
    var rows = [], seen = {};
    (recs || []).forEach(function (r) {
      (r.ing || []).forEach(function (i) {
        if (i.p != null || ingKruid(i) || findProd(i.n)) return;
        var k = normName(i.n); if (!k) return;
        if (!seen[k]) { seen[k] = { n: i.n, u: i.u, keuze: '', recIds: [], cands: S.prijzen.filter(function (p) { return bijnaDezelfde(p.n, i.n); }).slice(0, 3).map(function (p) { return p.id; }) }; rows.push(seen[k]); }
        if (r.id && seen[k].recIds.indexOf(r.id) < 0) seen[k].recIds.push(r.id);
      });
    });
    return rows;
  }
  function koppelStart(recs, melding) {
    var P = S.paste;
    var rows = koppelRows(recs);
    if (!P || !rows.length) { toast(melding); forceClosePaste(); return; }
    P.koppel = { rows: rows, melding: melding }; P.prev = null; P.multi = null;
    renderPaste();
    try { $('pastebody').scrollTop = 0; } catch (e) { }
  }
  function koppelRadios(r, i) {
    var rd = function (val, titel, sub) { return '<label class="vink"><input type="radio" name="pkk' + i + '" data-pkk="' + i + '" value="' + esc(val) + '"' + (r.keuze === val ? ' checked' : '') + '> <span>' + titel + (sub ? '<br><span class="hint" style="margin:0;font-weight:400">' + sub + '</span>' : '') + '</span></label>'; };
    var h = '<div class="rcard" style="padding:10px 12px"><b>' + esc(r.n) + '</b>';
    r.cands.forEach(function (cid) { var cp = prodById(cid); if (cp) h += rd('p:' + cid, 'Mogelijk: <b>' + esc(cp.n) + '</b>', (telWaarschuwing(cp, r.u) ? '<b>⚠ ' + esc(telWaarschuwing(cp, r.u)) + '</b>' : 'Dezelfde: wordt als bijnaam bijgezet en de calorieën tellen mee')); });
    return h + rd('nieuw', 'Nieuw product aanmaken', 'Zonder calorieën; die vul je later in bij Producten') + rd('laat', 'Zo laten, niet koppelen', 'Het ingrediënt telt dan niet mee in de calorieën') + '</div>';
  }
  function koppelHtml(P) {
    var K = P.koppel;
    var h = '<h3>' + esc(K.melding) + '</h3><h3>Wil je nog producten koppelen?</h3><p class="hint" style="margin-top:0">Deze ingrediënten staan nog niet bij Mijn producten, dus ze tellen niet mee in de calorieën. Kies bij elk ingrediënt zelf wat je wilt; er is niets voorgekozen.</p>';
    K.rows.forEach(function (r, i) { h += koppelRadios(r, i); });
    return h + '<div class="btns"><button class="btn main" data-act="koppelklaar">Klaar</button></div>';
  }
  function koppelApply(rows, recsFor) {
    var gek = 0, nw = 0;
    rows.forEach(function (r) {
      var recs = recsFor(r);
      if (r.keuze.indexOf('p:') === 0) {
        var pr = prodById(r.keuze.slice(2)); if (!pr) return;
        if (prodKeys(pr).indexOf(normName(r.n)) < 0 && (pr.alias || []).length < 10) pr.alias = (pr.alias || []).concat([r.n]);
        var kp = prodKcPer(pr);
        recs.forEach(function (rc) { rc.ing.forEach(function (i) { if (normName(i.n) === normName(r.n) && i.p == null && kp != null && (i.u === pr.u || (i.u === 'x' && pr.u === 'stuk'))) i.p = kp; }); });
        gek++;
      } else if (r.keuze === 'nieuw') {
        var u = (r.u === 'g' || r.u === 'ml') ? r.u : 'stuk';
        var np = cleanProd({ id: uid(), n: r.n, u: u, inh: null, pr: null, bon: null, alias: [], w: {}, kc: null, cat: guessCats(r.n), foto: '' });
        if (np) { if (S.bewaarNieuw !== false) S.prijzen.push(np); nw++; } // v57: teller heet nw (was n → ReferenceError)
      }
    });
    return { gek: gek, nw: nw };
  }
  function koppelTekst(g) { return g.gek || g.nw ? '. ' + (g.gek ? g.gek + ' gekoppeld' : '') + (g.gek && g.nw ? ', ' : '') + (g.nw ? g.nw + (g.nw > 1 ? ' nieuwe producten' : ' nieuw product') : '') : ''; }
  function koppelKlaar() {
    var P = S.paste; if (!P || !P.koppel) return;
    var open2 = P.koppel.rows.filter(function (k) { return !k.keuze; });
    if (open2.length) { toast('Kies eerst bij "' + open2[0].n + '" wat je wilt'); return; }
    var g = koppelApply(P.koppel.rows, function (r) { return S.recipes.filter(function (x) { return r.recIds.indexOf(x.id) >= 0; }); });
    persist(); tryStore();
    toast(P.koppel.melding + koppelTekst(g)); forceClosePaste();
  }
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute || !S.paste) return;
    var i = t.getAttribute('data-pkk'); if (i == null) return;
    var rows = S.paste.koppel ? S.paste.koppel.rows : (S.paste.kr || []);
    var r = rows[+i]; if (r) r.keuze = t.value;
  });
  function pasteCheck() {
    syncPaste(); var P = S.paste; if (!P) return;
    if (!(P.text || '').trim()) { P.err = 'Plak eerst een recept.'; P.prev = null; renderPaste(); return; }
    var t = P.text.trim();
    if (t.charAt(0) === '{' || t.charAt(0) === '[') { pasteParse(P, t); return; }
    // keuring 8 nov: een recept als gewone tekst mag — Mistral vertaalt het naar het app-formaat (zoals Kookhulp)
    P.err = ''; P.busy = true; renderPaste();
    mistralTekstNaarRecept(t).then(function (json) { if (!S.paste) return; S.paste.busy = false; pasteParse(S.paste, json); }).catch(function (e) { if (!S.paste) return; S.paste.busy = false; S.paste.err = 'Dat lukte niet: ' + ((e && e.message) || 'probeer het opnieuw'); S.paste.prev = null; renderPaste(); });
  }
  function pasteParse(P, t) {
    // v55.2 (13 nov) PUNT 4: een JSON-array = een HELE LIJST recepten in één keer (net als Producten plakken), met rapport per recept
    var arr = null;
    try { var o0 = JSON.parse(t); if (Array.isArray(o0)) arr = o0; else if (o0 && Array.isArray(o0.recipes)) arr = o0.recipes; } catch (e) {} // v55.2 PUNT 4: ook een backup-bestand met "recipes"-lijst (tests/testdata/recepten-testmomenten.json)
    if (arr) {
      var items = [], gezien = [];
      arr.forEach(function (el, i) {
        var m = { file: 'item ' + (i + 1), on: false, where: [] };
        var res = parseRecipeJson(JSON.stringify(el));
        if (res.err) { m.err = res.err; }
        else {
          m.rec = res.rec; m.note = res.note || ''; m.where = (res.rec.where || []).slice();
          if (el && el.id && S.recipes.some(function (r) { return String(r.id) === String(el.id); })) m.dup = 'dubbel id: dit id bestaat al in je recepten.';
          else if (recNaamBestaat(res.rec.name, S.recipes)) m.dup = 'je hebt al een recept met deze naam.';
          else if (recNaamBestaat(res.rec.name, gezien)) m.dup = 'dezelfde naam zit al in een ander item van deze lijst.';
          else { m.on = true; gezien.push(res.rec); }
        }
        items.push(m);
      });
      P.err = ''; P.prev = null; P.multi = items; renderPaste();
      return;
    }
    var res = parseRecipeJson(t);
    if (res.err) { P.err = res.err; P.prev = null; P.note = ''; } else { P.err = ''; P.note = res.note || ''; P.prev = res.rec; autoProdKcal(res.rec); P.kr = koppelRows([res.rec]); if (res.rec.where && !P.where.length) P.where = res.rec.where.slice(); }
    renderPaste();
  }
  // Mistral zet vrije recepttekst om in het app-formaat (zelfde JSON als parseRecipeJson verwacht); de strenge JSON-eis geldt alleen voor back-up-bestanden
  async function mistralTekstNaarRecept(tekst) {
    var sys = 'Zet de volgende recepttekst om in ALLEEN een JSON-object in het app-formaat: { name, ing: [{ n, a, u }], steps, emoji, por }. ing = ingrediëntenlijst, per item n = naam, a = hoeveelheid als getal, u = eenheid (g, ml, stuk, el, tl…); steps = de bereiding als tekst; por = aantal porties als getal (schat als het er niet staat). Antwoord ALLEEN met de JSON.';
    var body = { model: mistralModel(), messages: [{ role: 'system', content: sys }, { role: 'user', content: tekst.slice(0, 4000) }], response_format: { type: 'json_object' } };
    var resp = await fetch('https://api.mistral.ai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + mistralSleutel() }, body: JSON.stringify(body) });
    if (!resp.ok) throw new Error('Mistral gaf een fout (' + resp.status + ').');
    var data = await resp.json();
    var txt = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    return String(txt).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  function pasteSave() {
    var P = S.paste; if (!P || !P.prev) return;
    var open = (P.kr || []).filter(function (k) { return !k.keuze; });
    if (open.length) { toast('Kies eerst bij "' + open[0].n + '" wat je wilt'); return; }
    var rec = JSON.parse(JSON.stringify(P.prev)); rec.id = uid();
    var wh = RGROUPS.map(function (g) { return g.id; }).filter(function (w) { return P.where.indexOf(w) >= 0; }); if (wh.length) rec.where = wh;
    if (recNaamBestaat(rec.name, S.recipes)) { toast('Dit recept staat er al in — niet nogmaals bewaard'); forceClosePaste(); return; } // v58.4: dubbel recept bij plakken geweerd (bij Bewerken melden we het al met dubbele tik, v57.5)
    S.recipes.push(rec);
    var g = koppelApply(P.kr || [], function () { return [rec]; });
    persist(); tryStore(); toast('Recept bewaard' + koppelTekst(g)); forceClosePaste();
  }

  // ======== Producten en Prijzen ========
  var W_FIELDS = [['eiwit', 'Eiwit'], ['suiker', 'Suikers'], ['verz', 'Verzadigd vet'], ['zout', 'Zout'], ['vezel', 'Vezels']];
  function p2(x) { return (Math.round(x * 100) / 100).toFixed(2).replace('.', ','); }
  function eur(x) { return '€ ' + p2(x); }
  function normName(s) {
    return String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/^\s*optioneel:\s*/, '').replace(/[^a-z0-9à-ÿ+ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // ---- v45a: supermarktnamen filteren + bijna-dubbele namen (basisregel 3+4)
  var SUPERMARKT = ['albert heijn', 'ah', 'jumbo', 'lidl', 'aldi', 'dirk', 'vomar', 'vomer', 'plus', 'coop', 'spar', 'deen', 'marqt', 'ekoplaza', 'hoogvliet', 'terra', 'boni', '1 de beste', 'ja!', 'gwoon', "g'woon", 'daily', 'schar', 'korenveld'];
  function stripSupermarkt(naam) {
    var s = ' ' + String(naam || '').toLowerCase() + ' ';
    SUPERMARKT.forEach(function (w) {
      var r = new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)', 'g');
      s = s.replace(r, function (m, a, b) { return a + ' ' + b; });
    });
    s = s.replace(/\s+/g, ' ').trim().replace(/^[,;.\s]+|[,;.\s]+$/g, '');
    return s.replace(/^\w/, function (c) { return c.toUpperCase(); });
  }
  // keurpunt 8 nov: huismerken per winkel — één lijst voor de huismerken-brug (OFF-query) én de huismerk-voorrang bij vage namen
  var HUISMERK = {
    'lidl': ['milbona', 'alesto', 'chef select', 'freshona', 'vemondo'],
    'ah': ['ah', 'ah basic', 'excellent', 'vandaag'],
    'albert heijn': ['ah', 'ah basic', 'excellent', 'vandaag']
  }; // Jumbo-huismerken bewust nog niet (pas als ze in de praktijk ontbreken)
  function huismerkenVan(winkel) {
    var w = normName(winkel);
    var uit = [];
    Object.keys(HUISMERK).forEach(function (k) { if (k === w || w.indexOf(k) >= 0) uit = uit.concat(HUISMERK[k]); });
    return uit;
  }
  function normWoorden(s) { // keurpunt 8 nov: naam naar losse woorden — accenten/apostrofs/slashes/streepjes zijn scheiders of gelijk
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '')
      .replace(/[\/\\|,:;()\[\]{}—–-]/g, ' ').replace(/[^a-z0-9+ ]+/g, ' ').split(/\s+/).filter(Boolean);
  }
  function bijnaDezelfde(a, b) {
    if (onderscheidVerschil(a, b).length) return false;
    var STOP = { de: 1, het: 1, een: 1, van: 1, en: 1, met: 1, per: 1, in: 1, op: 1, aan: 1, voor: 1, bij: 1, zonder: 1 };
    var FLEX = { mager: 'mager', magere: 'mager', vol: 'vol', volle: 'vol', licht: 'licht', lichte: 'licht', puur: 'puur', pure: 'puur', wit: 'wit', witte: 'wit' };
    var isNum = function (w) { return /^\d+(g|ml|kg|l|stuks?|x)?$/.test(w); };
    var clean = function (arr) { return arr.filter(function (w) { return !isNum(w) && !STOP[w]; }).map(function (w) { return FLEX[w] || w; }); };
    var wa = clean(normName(stripSupermarkt(a)).split(' ').filter(Boolean)), wb = clean(normName(stripSupermarkt(b)).split(' ').filter(Boolean));
    if (!wa.length || !wb.length) return false;
    if (wa.join(' ') === wb.join(' ')) return true;
    var kort = wa.length <= wb.length ? wa : wb, lang = wa.length <= wb.length ? wb : wa;
    return kort.every(function (w) { return lang.indexOf(w) >= 0; });
  }
  // v45b.7: woorden die een ander product maken (mager/vol/bio...). Zo'n verschil tussen de bon en je productnaam = nooit automatisch koppelen.
  var ONDERSCHEID = { mager: 'mager', magere: 'mager', halfvol: 'halfvol', halfvolle: 'halfvol', vol: 'vol', volle: 'vol', bio: 'bio', biologisch: 'bio', biologische: 'bio', light: 'light', lichte: 'light', licht: 'light', zero: 'zero', suikervrij: 'suikervrij', ongezoet: 'ongezoet', gezoet: 'gezoet' };
  function onderscheidSet(naam) {
    var o = {}; normName(stripSupermarkt(naam)).split(' ').forEach(function (w) { if (ONDERSCHEID[w]) o[ONDERSCHEID[w]] = true; });
    return o;
  }
  function onderscheidVerschil(a, b) {
    var x = onderscheidSet(a), y = onderscheidSet(b), r = [];
    Object.keys(x).forEach(function (k) { if (!y[k]) r.push(k); });
    Object.keys(y).forEach(function (k) { if (!x[k]) r.push(k); });
    return r;
  }
  function vindMultiples(naam) {
    var n = normName(stripSupermarkt(naam));
    if (!n) return [];
    return S.prijzen.filter(function (p) {
      if (normName(p.n) === n) return true;
      if (bijnaDezelfde(p.n, naam)) return true;
      return (p.alias || []).some(function (a) { return normName(a) === n; });
    });
  }
  // Vinkjes "Neem deze over" bouwen voor een bestaand product ex en een externe bron r (velden: pr, bon, inh, kc, kst, sg, w_*)
  function overVinkjes(ex, r) {
    var o = {};
    if (r.pr != null && ex.pr != null && Math.abs(r.pr - ex.pr) > 0.005) o.pr = true;
    if (r.bon != null && ex.bon != null && Math.abs(r.bon - ex.bon) > 0.005) o.bon = true;
    if (r.inh != null && ex.inh != null && Math.abs(r.inh - ex.inh) > 0.005) o.inh = true;
    if (r.kc != null && ex.kc != null && Math.abs(r.kc - ex.kc) > 0.005) o.kc = true;
    if (r.kst != null && ex.kst != null && Math.abs(r.kst - ex.kst) > 0.005) o.kst = true;
    if (r.sg != null && ex.sg != null && Math.abs(r.sg - ex.sg) > 0.005) o.sg = true;
    if (r.w) Object.keys(r.w).forEach(function (k) { if (r.w[k] != null && ex.w && ex.w[k] != null && Math.abs(r.w[k] - ex.w[k]) > 0.005) o['w_' + k] = true; });
    return o;
  }
  var BON_INH = /(\d+(?:[.,]\d+)?)\s*(kg|kilo|gram|gr|g|ml|cl|l|liter|stuks|stuk|st)\b/i;
  function inhGetal(m) { if (!m) return null; var v = num(m[1]); if (v == null) return null; var u = String(m[2] || '').toLowerCase(); if (u === 'kg' || u === 'kilo') return v * 1000; if (u === 'l' || u === 'liter') return v * 1000; if (u === 'cl') return v * 10; return v; }
  function inhEenheid(u) { u = String(u || '').toLowerCase(); if (u === 'stuk' || u === 'stuks' || u === 'st') return 'stuk'; if (u === 'ml' || u === 'cl' || u === 'l' || u === 'liter') return 'ml'; return 'g'; }
  function voedingsVerschillen(ex, r) {
    var kcE = ex.kc != null ? ex.kc : (ex.kst != null && ex.sg ? ex.kst * 100 / ex.sg : null);
    var kcR = r.kc != null ? r.kc : (r.kst != null && r.sg ? r.kst * 100 / r.sg : null);
    if (kcR != null && kcE != null && Math.abs(kcR - kcE) > 5) return true;
    if (r.kst != null && ex.kst != null && Math.abs(r.kst - ex.kst) > 5) return true;
    if (r.w && ex.w) {
      var d = false;
      W_FIELDS.forEach(function (f) { if (!d && r.w[f[0]] != null && ex.w[f[0]] != null && Math.abs(r.w[f[0]] - ex.w[f[0]]) > 0.5) d = true; });
      if (d) return true;
    }
    return false;
  }
  var CATS = [
    { id: 'groente', i: '🥦', n: 'Groente' }, { id: 'fruit', i: '🍎', n: 'Fruit' }, { id: 'vlees', i: '🥩', n: 'Vlees' },
    { id: 'vis', i: '🐟', n: 'Vis' }, { id: 'vega', i: '🌱', n: 'Vega' }, { id: 'zuivel', i: '🥛', n: 'Zuivel en eieren' },
    { id: 'brood', i: '🍞', n: 'Brood' }, { id: 'beleg', i: '🧀', n: 'Beleg' }, { id: 'ontbijt', i: '🥣', n: 'Ontbijt en granen' },
    { id: 'rijst', i: '🍝', n: 'Rijst, pasta en aardappelen' }, { id: 'blik', i: '🥫', n: 'Blik, saus en kruiden' },
    { id: 'snacks', i: '🍿', n: 'Snacks en zoet' }, { id: 'drinken', i: '🥤', n: 'Drinken' }, { id: 'diepvries', i: '🧊', n: 'Diepvries' }, { id: 'oven', i: '🔥', n: 'Oven' }, { id: 'magnetron', i: '♨️', n: 'Magnetron' },
    { id: 'noten', i: '🥜', n: 'Noten, zaden en pitten' }, { id: 'soep', i: '🍲', n: 'Soep & bouillon' },
    { id: 'sport', i: '🏋️', n: 'Sport & eiwit' }, { id: 'salade', i: '🥗', n: 'Salades & rauwkost' }, { id: 'koud', i: '❄️', n: 'Koud / Geen bereiding' },
    { id: 'overig', i: '📦', n: 'Overig' }
  ];
  // v45c: hoofdgroepen op het Producten-tab
  var GROEPEN = [
    { id: 'vers', i: '🥦', n: 'Vers', c: ['groente', 'fruit', 'salade'] },
    { id: 'eiwit', i: '🥩', n: 'Eiwitten', c: ['vlees', 'vis', 'vega', 'sport'] },
    { id: 'ontbijt', i: '🍞', n: 'Ontbijt & Lunch', c: ['zuivel', 'brood', 'beleg', 'ontbijt'] },
    { id: 'voorraad', i: '🍝', n: 'Voorraadkast', c: ['rijst', 'blik', 'drinken', 'soep'] },
    { id: 'snacks', i: '🍿', n: 'Snacks & Gemak', c: ['snacks', 'noten'] },
    { id: 'overig', i: '📦', n: 'Overig', c: ['overig'] }
  ];
  function groepCats(g) {
    if (g.id !== 'overig') return g.c;
    var inAndere = {}; GROEPEN.forEach(function (x) { if (x.id !== 'overig') x.c.forEach(function (c) { inAndere[c] = 1; }); });
    return g.c.concat(CATS.map(function (c) { return c.id; }).filter(function (id) { return !inAndere[id] && id !== 'overig'; }));
  }
  var LABS = [
    { id: 'diep', i: '🧊', n: 'Diepvries' }, { id: 'makk', i: '⚡', n: 'Makkelijk' }, { id: 'eiwit', i: '💪', n: 'Eiwitrijk' },
    { id: 'vezel', i: '🌾', n: 'Veel vezels' }, { id: 'suiker', i: '🍬', n: 'Weinig suiker' }, { id: 'zout', i: '🧂', n: 'Weinig zout' },
    { id: 'verz', i: '🧈', n: 'Weinig verz. vet' }
  ];
  var AUTOLAB = ['eiwit', 'vezel', 'suiker', 'zout', 'verz'];
  function catById(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i]; return null; }
  function labById(id) { for (var i = 0; i < LABS.length; i++) if (LABS[i].id === id) return LABS[i]; return null; }
  var CAT_RULES = [
    ['blik', /kokos ?(melk|room|cr[eè]me)/],
    ['noten', /amandel|walnoot|walnoten|cashew|hazelnoot|hazelnoten|zonnebloempit|pompoenpit|chiazaad|sesamzaad|notenmix|pitten/],
    ['soep', /soep|bouillon/],
    ['sport', /eiwitreep|proteïnereep|proteinereep|protein|whey|creatine/],
    ['salade', /rauwkost|salademix|coleslaw/],
    ['snacks', /chips|cheetos|doritos|bugles|lay.?s\b|chocola|koek|snoep|(^|[^a-z])ijs([^a-z]|$)|schepijs|reep|popcorn|crisps|biscuit|wafel|\bdrop\b|pinda(?!kaas)|noten|gummies/],
        ['vis', /tonijn|zalm|makreel|haring|sardine|ansjovis|kabeljauw|garnaal|forel|pangasius|mossel/],
    ['drinken', /drink(?!yoghurt)|\bsap\b|limonade|frisdrank|\bcola\b|thee|koffie|siroop|water\b|ice ?tea|shake|bitter lemon/],
    ['brood', /brood|tijger|\bwraps?\b|tortilla|toast|cracker|beschuit|bolletje|broodje|pistolet|\bpita\b|bagel/],
    ['ontbijt', /muesli|havermout|cruesli|cornflakes|granola|havervlokken|lijnzaad/],
    ['zuivel', /yoghurt|kefir|kwark|melk|cottage|eieren|\bei\b|boter|\broom|skyr|\bvla\b|mozzarella|feta|zuivel/],
    ['beleg', /pindakaas|\bjam\b|hagelslag|hummus|smeerkaas|plakjes|\bham\b|salami|beleg|kaas/],
    ['vis', /zalm|tonijn|\bvis|garnaal|kabeljauw|haring|makreel|forel|pangasius|mossel/],
    ['vega', /vega|tofu|tempeh|quorn|vegan|plantaardig/],
    ['vlees', /gehakt|\bkip|rund|varken|burger|worst|bacon|spek|biefstuk|lappen|filet|kalkoen|\blam\b|vlees/],
    ['blik', /\bblik|tomatenpuree|passata|saus|kruiden|\bzout\b|peper|\bolie\b|azijn|mosterd|ketchup|mayonaise|bonen in|kikkererwten|linzen|\bmais\b|soep|bouillon|augurk|zilveruitjes|sambal|witte bonen/],
    ['rijst', /rijst|pasta|spaghetti|macaroni|penne|noedels|couscous|aardappel|krieltjes|friet|rösti|kroket|bulgur/],
    ['fruit', /appel|banaan|\bpeer|sinaasappel|mandarijn|druif|druiven|aardbei|frambo|bosbes|kiwi|mango|ananas|citroen|fruit|meloen|vijg|dragon/],
    ['groente', /tomaat|tomaten|\bsla\b|salade|\bui\b|uien|paprika|komkommer|wortel|spinazie|broccoli|bloemkool|boontjes|sperziebonen|courgette|champignon|knoflook|\bprei|spruiten|aubergine|avocado|groente/]
  ];
  function guessCat(name) {
    var s = String(name || '').toLowerCase();
    for (var i = 0; i < CAT_RULES.length; i++) if (CAT_RULES[i][1].test(s)) return CAT_RULES[i][0];
    return 'overig';
  }
  // v45c.4: plantaardige melk/drank en drinkyoghurt horen bij Zuivel én Drinken (een product mag in meerdere categorieën).
  var PLANT_RE = /(amandel|haver|soja|rijst|cashew|hazelnoot|erwten)[ -]?(melk|drink|drank)|drink ?yoghurt/;
  function guessCats(name) {
    var s = String(name || '').toLowerCase();
    return PLANT_RE.test(s) ? ['zuivel', 'drinken'] : [guessCat(name)];
  }
  function wn(v) { var x = num(String(v == null ? '' : v).replace('€', '')); return (x != null && isFinite(x) && x >= 0) ? x : null; }
  function autoLabs(w) {
    var o = [], x;
    w = w || {};
    if ((x = wn(w.eiwit)) != null && x >= 6) o.push('eiwit');
    if ((x = wn(w.vezel)) != null && x >= 3) o.push('vezel');
    if ((x = wn(w.suiker)) != null && x <= 5) o.push('suiker');
    if ((x = wn(w.zout)) != null && x <= 1.2) o.push('zout');
    if ((x = wn(w.verz)) != null && x <= 3) o.push('verz');
    return o;
  }
  function labOn(p, id) {
    return (p.lab || []).indexOf(id) >= 0 || (autoLabs(p.w).indexOf(id) >= 0 && (p.labx || []).indexOf(id) < 0);
  }
  function labelsOf(p) { return LABS.filter(function (l) { return labOn(p, l.id); }); }
  // v45c: liter is een echte opslageenheid. Intern rekent de app in ml (p.u = 'ml', p.inh in ml); p.lit = true betekent
  // dat het product in liters is ingevoerd en zo wordt getoond. Bestaande ml-producten blijven ml.
  // v46: eigen woord voor 'stuks' (blik, pot, pak, ...). Alleen de weergave verandert; er wordt nog steeds in stuks gerekend.
  var STUKWOORDEN = [['blik', 'blikken'], ['pot', 'potten'], ['pak', 'pakken'], ['fles', 'flessen'], ['zak', 'zakken'], ['bakje', 'bakjes'], ['pakje', 'pakjes'], ['tube', 'tubes'], ['doos', 'dozen'], ['rol', 'rollen']];
  var STUKKLEIN = { blikje: 'blik', potje: 'pot', flesje: 'fles', zakje: 'zak', doosje: 'doos' };
  function stukWoordKey(w) { w = String(w || '').toLowerCase().trim(); if (STUKKLEIN[w]) w = STUKKLEIN[w]; return STUKWOORDEN.some(function (x) { return x[0] === w; }) ? w : null; }
  function stukNaam(p, a) {
    var w = p && p.sw ? STUKWOORDEN.filter(function (x) { return x[0] === p.sw; })[0] : null;
    if (!w) return a === 1 ? 'stuk' : 'stuks';
    return a === 1 ? w[0] : w[1];
  }
  function inhLabel(p) { if (!p || p.inh == null || p.inh === '') return ''; if (p.u === 'ml' && (p.lit || p.inh >= 1000)) return fmtN(p.inh / 1000) + ' liter'; if (p.u === 'g' && (p.kilo || p.inh >= 1000)) return fmtN(p.inh / 1000) + ' kilo'; return fmtN(p.inh) + ' ' + (p.u === 'stuk' ? stukNaam(p, p.inh) : p.u); } // v47.3: kilo-product toont als kilo; v47.4.4: ook zonder vlag: 1000 g en meer wordt kilo, 1000 ml en meer wordt liter
  function catsOf(p) { var c = (p.cat || []).filter(function (x) { return !!catById(x); }); return c.length ? c : ['overig']; }
  // keuring 8 nov: hele-woorden-match (woordgrens) — "kaas" matcht "pindakaas" niet
  function woordMatch(hay, needle) {
    if (!hay || !needle) return false;
    var esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z0-9à-ÿ])' + esc + '([^a-z0-9à-ÿ]|$)').test(hay);
  }
  // keuring-7nov-1330 fix: matchniveau — 'sterk' = (vrijwel) hele receptnaam; 'zwak' = los woord matcht een receptnaam
  function bronIsUrl(b) { b = String(b || ''); return /^https?:\/\//i.test(b) || /\b[a-z0-9-]+\.[a-z]{2,}(\slu|$)/i.test(b); } // 'opgezocht' alleen bij een echte bron-URL
  function recMatchNiveau(ck, rn) {
    if (!ck || !rn) return null;
    if (ck === rn) return 'sterk';
    var cw = ck.split(' '), rw = rn.split(' ');
    var kort = cw.length <= rw.length ? cw : rw, lang = cw.length <= rw.length ? rn : ck;
    var allesErin = kort.every(function (w) { return woordMatch(lang, w); });
    if (allesErin && kort.length >= 2) return 'sterk';
    var deelt = cw.some(function (w) { return w.length > 2 && woordMatch(rn, w); }) || rw.some(function (w) { return w.length > 2 && woordMatch(ck, w); });
    if (woordMatch(ck, rn) || woordMatch(rn, ck) || deelt) return 'zwak';
    return null;
  }
  function guessMerk(naam) { // keurpunt 8 nov: winkelprefix uit de SUPERMARKT-lijst (Hoogvliet, Dirk, Vomar, Plus, Coop erbij); anders eerste merk-woord
    var n = String(naam || '').trim();
    var ln = ' ' + n.toLowerCase() + ' ';
    var winkels = SUPERMARKT.slice().sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < winkels.length; i++) {
      var ws = winkels[i];
      var r = new RegExp('(^|[^a-z0-9])' + ws.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)');
      if (r.test(ln)) return ws === 'ah' ? 'AH' : ws.replace(/^\w/, function (c) { return c.toUpperCase(); });
    }
    var w = n.split(/\s+/)[0] || '';
    if (/^[A-ZÀ-Þ][a-zà-ÿ]+$/.test(w) && !/^(gram|g|ml|l|kg|stuk|stuks|kcal|eiwit|vet|suiker|zout|vezels|ei|thee|water)$/i.test(w)) return w;
    return '';
  }
  function repareerProductNaam(n) {
    var s = String(n || '').replace(/\s+/g, ' ').trim();
    var joined = s.replace(/\b([A-Za-z]) (?=[A-Za-z](?:\s|$))/g, '$1'); // losse letters samenvoegen — v57.5: alléén als het resultaat een bestaand Plank-product is
    var key = normName(s).replace(/\s+/g, '');
    var keyJ = normName(joined).replace(/\s+/g, '');
    var plank = (S.prijzen || []).filter(function (p) { return p && typeof p.n === 'string'; });
    function plankSorteer(arr) {
      arr.sort(function (a, b) {
        var ta = String(a.n).trim().split(/\s+/).filter(Boolean), tb = String(b.n).trim().split(/\s+/).filter(Boolean);
        var sa = ta.filter(function (w) { return w.length <= 2; }).length, sb = tb.filter(function (w) { return w.length <= 2; }).length;
        return (ta.length - tb.length) || (sa - sb) || String(a.n).localeCompare(String(b.n));
      });
      return arr;
    }
    var mJ = plankSorteer(plank.filter(function (p) { return normName(p.n).replace(/\s+/g, '') === keyJ; }));
    if (mJ.length) return mJ[0].n; // v57.5: samengevoegde naam matcht een Plank-product -> die Plank-naam overnemen
    var zelfde = plankSorteer(plank.filter(function (p) { return normName(p.n).replace(/\s+/g, '') === key && p.n !== s; }));
    if (zelfde.length) return zelfde[0].n;
    return s.slice(0, 80); // v57.5: geen Plank-match = naam precies zoals getypt; gissen verboden (harde gekend-lijst en NEVO-sleutel eruit; NEVO blijft interne lookup via nevoZoek)
  }
  function cleanProd(p) {
    // v46: categorie 'tussen' (Tussendoor & meeneem) is vervallen; die producten gaan naar Snacks en zoet (alleen de categorie verandert)
    if (p && Array.isArray(p.cat) && p.cat.indexOf('tussen') >= 0) p.cat = p.cat.map(function (x) { return x === 'tussen' ? 'snacks' : x; });
    if (!p || typeof p !== 'object') return null;
    if (typeof p.n === 'string' && p.n.trim() && !p.merk) p.merk = guessMerk(p.n); // v51: merk automatisch afgeleid
    // v45b.11: een product zonder naam maar mét gegevens (prijs, inhoud, calorieën, foto) verdwijnt niet meer stil;
    // het krijgt de tijdelijke naam "(zonder naam)", zodat Marlijn het kan zien en een naam kan geven.
    if (typeof p.n !== 'string' || !p.n.trim()) {
      var heeft = [p.pr, p.prijs, p.inh, p.kc, p.kst, p.bon].some(function (v) { return typeof v === 'number' && isFinite(v) && v > 0; }) || !!p.foto || (p.w && typeof p.w === 'object' && Object.keys(p.w).length > 0);
      if (!heeft) return null;
      p = Object.assign({}, p, { n: '(zonder naam)' });
    }
    function n2(v) { return typeof v === 'number' && isFinite(v) && v >= 0 ? v : null; }
    var w = {};
    W_FIELDS.forEach(function (f) { var x = p.w ? n2(p.w[f[0]]) : null; if (x != null) w[f[0]] = x; });
    return {
      id: typeof p.id === 'string' && p.id ? p.id : uid(), n: repareerProductNaam(p.n),
      // v45b.7: oude vorm {n, prijs, inh, eh} (bewaard via Instellingen > Mijn prijzen) wordt hier veilig omgezet, zodat de prijs niet meer verdwijnt.
      u: ['g', 'ml', 'stuk'].indexOf(p.u) >= 0 ? p.u : ((p.pr === undefined && p.prijs !== undefined && ['g', 'ml', 'stuk'].indexOf(p.eh) >= 0) ? p.eh : 'g'),
      inh: n2(p.inh) > 0 ? p.inh : null, pr: n2(p.pr === undefined && p.prijs !== undefined ? p.prijs : p.pr), bon: n2(p.bon),
      alias: Array.isArray(p.alias) ? p.alias.filter(function (a) { return typeof a === 'string' && a.trim(); }).map(function (a) { return a.trim().slice(0, 80); }).slice(0, 10) : [],
      sw: (p.u === 'stuk' || p.eh === 'stuk') ? stukWoordKey(p.sw) : null,
      w: w, kc: n2(p.kc), sg: n2(p.sg) > 0 ? p.sg : null, kst: n2(p.kst), eh: (p.pr === undefined && p.prijs !== undefined) ? '' : (['g', 'ml', 'stuk'].indexOf(p.eh) >= 0 ? p.eh : ''), la: n2(p.la) > 0 ? p.la : null, foto: (typeof p.foto === 'string' && p.foto.indexOf('data:image/') === 0) ? p.foto : '',
      hm: (p.hm && typeof p.hm === 'object') ? (function () { var o = {}; Object.keys(HUISMATEN).forEach(function (k) { var v = n2(p.hm[k]); if (v != null && v > 0) o[k] = v; }); return Object.keys(o).length ? o : null; })() : null, // v55.0 (12 nov): eigen gramgewichten per huismaat (standaard = null)
      bron: (typeof p.bron === 'string' && p.bron.trim()) ? p.bron.trim().slice(0, 40) : '', // v55.0 (12 nov): bronlabel (NEVO)/(AI)/(OFF) bij plank-product
      prijsBron: (typeof p.prijsBron === 'string' && p.prijsBron.trim()) ? p.prijsBron.trim().slice(0, 60) : '', // v55.2 (13 nov) PUNT 7b: supermarkt bij de prijs
      cat: Array.isArray(p.cat) ? (function (cc) { if (cc.length === 1 && cc[0] === 'drinken' && /tonijn|zalm|makreel|haring|sardine|ansjovis|kabeljauw|garnaal|forel|pangasius|mossel/i.test(p.n)) return ['vis']; return cc.length ? cc : guessCats(p.n); })(p.cat.filter(function (x, i, a) { return !!catById(x) && a.indexOf(x) === i; }).slice(0, 3)) : guessCats(p.n),
      // v45c: "Makkelijk" is alleen nog een label. Had het product de categorie "makkelijk", dan krijgt het het label.
      lab: (Array.isArray(p.lab) ? p.lab : []).concat(Array.isArray(p.cat) && p.cat.indexOf('makkelijk') >= 0 ? ['makk'] : []).filter(function (x, i, a) { return !!labById(x) && a.indexOf(x) === i; }),
      labx: Array.isArray(p.labx) ? p.labx.filter(function (x, i, a) { return AUTOLAB.indexOf(x) >= 0 && a.indexOf(x) === i; }) : [],
      thuis: !!p.thuis,
      direct: !!p.direct,
      kruid: !!p.kruid,
      lit: !!p.lit && p.u === 'ml',
      kilo: !!p.kilo && p.u === 'g', // v47.3
      gemaakt: (typeof p.gemaakt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.gemaakt)) ? p.gemaakt : null, // v47.4
      aantal: n2(p.aantal) > 0 ? Math.round(p.aantal * 100) / 100 : null, // v48.2: aantal per verpakking (optioneel)
      aantalWoord: typeof p.aantalWoord === 'string' && p.aantalWoord.trim() ? p.aantalWoord.trim().slice(0, 30) : null, // v48.2
      bonTot: (typeof p.bonTot === 'number' && isFinite(p.bonTot) && p.bonTot > 0) ? p.bonTot : null
    };
  }
  function cleanCat(o) { // v49-fix: S.cat (voorkeuren per soort gerecht) opschonen bij laden
    var r = {};
    if (!o || typeof o !== 'object' || Array.isArray(o)) return r;
    Object.keys(o).slice(0, 50).forEach(function (k) {
      var v = o[k];
      if (!v || typeof v !== 'object') return;
      r[String(k).slice(0, 40)] = { v: typeof v.v === 'string' ? v.v.slice(0, 2000) : '', n: typeof v.n === 'string' ? v.n.slice(0, 500) : '' };
    });
    return r;
  }
  function cleanIcat(o) {
    var r = {};
    if (!o || typeof o !== 'object') return r;
    Object.keys(o).slice(0, 600).forEach(function (k) {
      var v = o[k]; if (!Array.isArray(v)) return;
      var f = v.filter(function (x, i, a) { return !!catById(x) && a.indexOf(x) === i; }).slice(0, 3);
      if (f.length && typeof k === 'string' && k.length <= 100) r[k] = f;
    });
    return r;
  }
  function cleanLijst(a) {
    if (!Array.isArray(a)) return [];
    return a.slice(0, 300).map(function (l) {
      if (!l || typeof l !== 'object') return null;
      var q = Math.round(Number(l.q)); if (!(q >= 1)) q = 1; if (q > 99) q = 99;
      var n = typeof l.n === 'string' ? l.n.trim().slice(0, 80) : '', pid = typeof l.pid === 'string' ? l.pid : '';
      if (!n && !pid) return null;
      return { id: typeof l.id === 'string' && l.id ? l.id : uid(), pid: pid, n: n, q: q, done: !!l.done };
    }).filter(Boolean);
  }
  function prodById(id) { for (var i = 0; i < S.prijzen.length; i++) if (S.prijzen[i].id === id) return S.prijzen[i]; return null; }
  function prodKeys(p) { var k = [normName(p.n)]; (p.alias || []).forEach(function (a) { var x = normName(a); if (x) k.push(x); }); return k; }
  function findProd(name) {
    var c = [normName(name), normName(String(name).split(',')[0])].filter(Boolean);
    for (var i = 0; i < S.prijzen.length; i++) {
      var ks = prodKeys(S.prijzen[i]);
      for (var j = 0; j < c.length; j++) if (ks.indexOf(c[j]) >= 0) return S.prijzen[i];
    }
    return null;
  }
  function amt(a) {
    if (typeof a === 'number') return isFinite(a) ? a : null;
    var s = String(a == null ? '' : a).trim().replace(',', '.');
    var m = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/.exec(s);
    if (m) return (parseFloat(m[1]) + parseFloat(m[2])) / 2;
    if (!/^\d/.test(s)) return null;
    var n = parseFloat(s); return isNaN(n) ? null : n;
  }
  var STUKU = /^(stuk|stuks|x|plak|plakken|plakje|plakjes|blikje|blikjes|balletjes|snee|sneetjes)$/;
  function qtyFor(i, pu) {
    var a = amt(i.a); if (a == null) return null;
    var u = String(i.u || '').toLowerCase().trim();
    if (pu === 'g') { if (u === 'g' || u === 'gr' || u === 'gram') return a; if (u === 'kg') return a * 1000; return null; }
    if (pu === 'ml') {
      if (u === 'ml') return a; if (u === 'l') return a * 1000; if (u === 'cl') return a * 10;
      if (/(^|\s)el$/.test(u)) return a * 15; if (/(^|\s)tl$/.test(u)) return a * 5; return null;
    }
    if (pu === 'stuk') return STUKU.test(u) ? a : null;
    return null;
  }
  var BREDE_WOORDEN = { kaas:1, brood:1, melk:1, boter:1, ei:1, eieren:1, rijst:1, pasta:1, kip:1, gehakt:1, yoghurt:1, kwark:1, ham:1, salami:1, chocola:1, hagelslag:1, pindakaas:1, kaasjes:1 };
  function isBroadWord(n) { var w = normWoorden(n); return w.length === 1 && !!BREDE_WOORDEN[w[0]]; } // 10 nov: brede woorden -> kies-kaartjes, nooit stille match
  function findProdFuzzy(n) { // keuring 7nov-1700: eigen plank, dan (bijna)zelfde naam; bij meerdere matches NOOIT gokken
    var p = findProd(n); if (p) return p;
    var cands = S.prijzen.filter(function (x) { return bijnaDezelfde(x.n, n); });
    if (cands.length === 1) return cands[0];
    var mult = vindMultiples(n); if (mult.length === 1 && !isBroadWord(n)) return mult[0]; // 10 nov: broad word = géén auto-pick
    return null;
  }
  function ingCost(i) {
    var p = findProdFuzzy(i.n), res = { p: p, s: 'geenproduct', c: null, cb: null };
    if (!p) return res;
    var q = qtyFor(i, p.u);
    if (q == null) { // keuring 7nov-1700: volume-eenheden (el/tl/ml/l) bij g/ml-verpakking of bakje gewoon toestaan (1 ml ≈ 1 g)
      var vu = String(i.u || '').toLowerCase().trim();
      var vml = vu === 'ml' ? amt(i.a) : vu === 'l' ? amt(i.a) * 1000 : /(^|\s)el$/.test(vu) ? amt(i.a) * 15 : /(^|\s)tl$/.test(vu) ? amt(i.a) * 5 : null;
      if (vml != null && (p.u === 'ml' || p.u === 'g' || (p.u === 'stuk' && p.inh > 0))) q = vml;
    }
    if (q == null) { res.s = 'eenheid'; return res; }
    if (p.pr == null || !(p.inh > 0)) { res.s = 'geenprijs'; return res; }
    res.s = 'ok'; res.c = p.pr / p.inh * q;
    if (p.bon != null) res.cb = p.bon / p.inh * q;
    return res;
  }
  function recPrice(r) {
    var o = { rows: [], sum: 0, sumB: 0, n: 0, nB: 0, miss: 0, por: r.por > 0 ? r.por : 1 };
    r.ing.forEach(function (i, idx) {
      var c = ingCost(i), opt = /^\s*optioneel/i.test(i.n);
      o.rows.push({ i: i, idx: idx, c: c, opt: opt });
      if (opt) return;
      if (c.s === 'ok') { o.sum += c.c; o.sumB += (c.cb != null ? c.cb : c.c); o.n++; if (c.cb != null) o.nB++; } else o.miss++;
    });
    return o;
  }
  function missTxt(n) { return n + (n === 1 ? ' ingrediënt zonder prijs' : ' ingrediënten zonder prijs'); }
  function priceTxt(o, div) {
    if (!o.n) return 'nog niet bekend';
    return (o.miss ? 'minstens ' : '') + '± ' + eur(o.sum / div) + (o.miss ? ' (' + missTxt(o.miss) + ')' : '');
  }
  function bonusTxt(o, div) { return (o.miss ? 'minstens ' : '') + '± ' + eur(o.sumB / div); }
  function priceBox(r) {
    var o = recPrice(r), pk = 'pi:' + r.id;
    var h = '<div class="pricebox"><b>Prijs</b><p>' + esc(priceTxt(o, 1)) + '</p>';
    if (o.nB) h += '<p>Met bonus: ' + esc(bonusTxt(o, 1)) + ' <span class="hint" style="margin:0">(bonusprijs bij ' + o.nB + (o.nB === 1 ? ' ingrediënt)' : ' ingrediënten)') + '</span></p>';
    if (o.por > 1 && o.n) h += '<p>Per ' + esc(r.unit || 'portie') + ' (de lijst geeft er ' + esc(fmtN(o.por)) + '): ' + esc(priceTxt(o, o.por)) + (o.nB ? '; met bonus ' + esc(bonusTxt(o, o.por)) : '') + '</p>';
    var rows = '';
    o.rows.forEach(function (x) {
      var right = x.opt ? 'optioneel, telt niet mee' : (x.c.s === 'ok' ? eur(x.c.c) + (x.c.cb != null ? ' (bonus ' + eur(x.c.cb) + ')' : '') : '—');
      rows += '<div class="prow"><span class="inm">' + esc(ingText(x.i, 1)) + '</span><b>' + esc(right) + '</b></div>';
      if (x.opt) return;
      if (x.c.s === 'geenproduct') {
        rows += '<div class="pbtn">' + (x.i._opz ? (x.i._opz.bron ? 'opgezocht — bron: ' + esc(x.i._opz.bron) : 'geschat uit eigen kennis') + (x.i._opz.naam ? ' · ' + esc(x.i._opz.naam) : '') : (x.i._opzBusy ? '⏳ opzoeken…' : '<button class="pill" data-act="opzrec" data-r="' + r.id + '" data-i="' + x.idx + '">🔎 opzoeken</button>')) + ' <button class="pill" data-act="prodfroming" data-r="' + r.id + '" data-i="' + x.idx + '">Product en prijs toevoegen</button></div>';
      }
      else if (x.c.s === 'eenheid') rows += '<div class="pbtn"><span class="hint" style="margin:0">De hoeveelheid past niet bij de verpakking van dit product.</span> <button class="pill" data-act="prodopen" data-p="' + x.c.p.id + '">Product aanpassen</button></div>';
      else if (x.c.s === 'geenprijs') rows += '<div class="pbtn"><button class="pill" data-act="prodopen" data-p="' + x.c.p.id + '">Prijs aanvullen</button></div>';
    });
    h += '<details data-rk="' + esc(pk) + '"' + (S.recOpen[pk] ? ' open' : '') + '><summary>Prijs per ingrediënt</summary>' + rows + '</details></div>';
    return h;
  }
  function wCheck(k, v) {
    if (k === 'eiwit') return v >= 8 ? 'haalt de richtlijn (8 g of meer)' : 'onder de richtlijn (8 g of meer)';
    if (k === 'suiker') return v <= 5 ? 'binnen de richtlijn (hartig 5 g, zoet 10 g)' : v <= 10 ? 'alleen binnen de richtlijn voor zoet (10 g)' : 'boven de richtlijn (hartig 5 g, zoet 10 g)';
    if (k === 'verz') return v <= 3 ? 'binnen de richtlijn (3 g)' : 'boven de richtlijn (3 g)';
    if (k === 'zout') return v <= 1.2 ? 'binnen de richtlijn (1,2 g)' : 'boven de richtlijn (1,2 g)';
    if (k === 'vezel') return v >= 3 ? 'haalt de richtlijn (3 g of meer)' : 'onder de richtlijn (3 g of meer)';
    return '';
  }
  // v46: kleur bij het etiketwoord: groen = goed, grijs = gemiddeld, rood (in Extreem contrast: amber pil met ⚠) = ver boven de richtlijn. Het woord blijft altijd staan.
  function wClass(k, v) {
    if (k === 'eiwit') return v >= 8 ? 'vww' : 'vwg';
    if (k === 'suiker') return v <= 5 ? 'vww' : v <= 10 ? 'vwg' : 'vwv';
    if (k === 'verz') return v <= 3 ? 'vww' : 'vwv';
    if (k === 'zout') return v <= 1.2 ? 'vww' : 'vwv';
    if (k === 'vezel') return v >= 3 ? 'vww' : 'vwg';
    return 'vwg';
  }
  // v46: kleurklasse voor een etiketwaarde die als tekst in een invulveld staat (leeg = geen kleur)
  function wnCls(k, val) {
    var t = String(val == null ? '' : val).replace(',', '.').trim(); if (t === '' || isNaN(+t)) return '';
    return ' wn ' + wClass(k, +t);
  }
  // v47.4.5: puur natuur — vers fruit, verse groente en rauwe ongezouten noten/zaden slaan de strenge suiker- en vezelcontrole over.
  // Gedroogd fruit, honing en sap vallen hier níet onder (die blijven streng). Bij twijfel kiest Marlijn zelf — de app gokt nooit.
  var PUUR_STRENG = /gedroogd|rozijn|dadels?\b|honing|stroop|sap|moes|jam|compote/i; // v58.4: verwerkt fruit (sap, moes, jam, compote) valt NIET onder puur natuur
  var NOTEN_STRENG = /gezouten|gebrand|geroosterd/i;
  function puurStatus(p) {
    if (!p) return 'nee';
    if (p.puur === 'puur') return 'ja';
    if (p.puur === 'gewoon') return 'nee';
    if (PUUR_STRENG.test(String(p.n || ''))) return 'nee';
    var cs = catsOf(p);
    if (cs.indexOf('fruit') >= 0 || cs.indexOf('groente') >= 0) return 'ja';
    if (cs.indexOf('noten') >= 0 && !NOTEN_STRENG.test(String(p.n || ''))) return 'twijfel';
    return 'nee';
  }
  function bonDatumVal(ms) {
    if (!ms) return '';
    var d = new Date(ms); if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function prodPriceLine(p) { return (p.pr != null ? eur(p.pr) : 'geen prijs') + (p.bon != null ? ' · bonus ' + eur(p.bon) : ''); }
  // v48.2: gewicht per stuk uit verpakking ÷ aantal (werkt bij g, ml én liter — inh zit intern altijd in g/ml)
  function stukGram(p) { if (!p || !(p.aantal > 0) || !(p.inh > 0)) return null; return p.inh / p.aantal; }
  function antalWoord1(p) { return (p.aantalWoord || 'stuk').replace(/s$/, ''); } // enkelvoud: "plakjes" -> "plakje"
  function antalCalc(P) {
    function pn(v) { var x = num(String(v == null ? '' : v).replace('\u20ac', '')); return x != null && x >= 0 ? x : null; } // v48.2-fix: pnum was alleen lokaal in prodSave; hier num() gebruiken
    var inh = pn(P.inh); if (inh != null && P.lit && P.u === 'ml') inh = inh * 1000; if (inh != null && P.kilo && P.u === 'g') inh = inh * 1000;
    var ant = pn(P.aantal);
    if (!(ant > 0) || !(inh > 0)) return '';
    var per = inh / ant, pr = pn(P.pr), w1 = String(P.aantalWoord || '').trim() || 'stuk';
    var s = '1 ' + w1.replace(/s$/, '') + ' ≈ ' + fmtN(Math.round(per * 10) / 10) + (P.u === 'ml' ? ' ml' : ' g');
    if (pr != null) s += ' · ' + eur(Math.round(pr / ant * 100) / 100) + ' per ' + w1.replace(/s$/, '');
    return s;
  }
  function lijstInfo(l) { var p = l.pid ? prodById(l.pid) : null; return { p: p, n: p ? p.n : l.n, cat: p ? catsOf(p)[0] : 'overig' }; }
  function inhTxt(p) { return p && p.inh ? (p.u === 'g' && (p.kilo || p.inh >= 1000) ? fmtN(p.inh / 1000) + ' kilo' : p.u === 'ml' && (p.lit || p.inh >= 1000) ? fmtN(p.inh / 1000) + ' liter' : fmtN(p.inh) + ' ' + (p.u === 'stuk' ? stukNaam(p, p.inh) : p.u)) : ''; } // v47.3: kilo; v47.4.4: ook zonder vlag kilo/liter
  function lijstAdd(pid, name) {
    var ex = null;
    S.lijst.forEach(function (l) { if (pid ? l.pid === pid : (!l.pid && normName(l.n) === normName(name))) ex = l; });
    if (ex) { ex.q = Math.min(99, ex.q + 1); ex.done = false; }
    else S.lijst.push({ id: uid(), pid: pid || '', n: String(name || '').slice(0, 80), q: 1, done: false });
    persist(); return ex ? ex.q : 1;
  }

  function lijstUitWeek() {
    var added = 0;
    for (var d = 0; d < 7; d++) {
      var date = addDays(S.start, d), id = fmtId(date), dag = S.days[id];
      if (!dag || !dag.entries) continue;
      dag.entries.forEach(function (e) {
        if (e.recipe) {
          var r = null; S.recipes.forEach(function (x) { if (x.id === e.recipe) r = x; });
          if (!r || !r.ing) return;
          r.ing.forEach(function (g) {
            if (!g || !g.n || g.p === 0) return;
            var nm = String(g.n).split(',')[0].replace(/\([^)]*\)/g, '').replace(/^\s*optioneel:\s*/i, '').trim();
            if (!nm || PFR_SPICE.test(nm.toLowerCase())) return;
            var p = findProd(nm); lijstAdd(p ? p.id : '', nm); added++;
          });
        } else if (e.key && e.key.indexOf('P:') === 0) {
          var pp = prodById(e.key.slice(2)), nm2 = pp ? pp.n : e.name;
          if (nm2) { lijstAdd(pp ? pp.id : '', nm2); added++; }
        } else if (e.name) {
          var nm3 = String(e.name).split(',')[0].trim();
          if (nm3) { lijstAdd('', nm3); added++; }
        }
      });
    }
    return added;
  }
  function prLijstHtml() {
    var n = S.lijst.length, h = '<h2 class="sec">Boodschappenlijstje' + (n ? ' (' + n + ')' : '') + '</h2>';
    h += '<div class="btns" style="margin-top:8px"><button class="btn" data-act="lweek">Deze week op het lijstje</button></div><p class="hint zz" style="margin-top:4px">Vult het lijstje met de ingrediënten uit de 7 dagen van deze week. Staat iets er al op, dan wordt het aantal bijgeteld.</p>'; // fix-ronde 10 nov: korte zinnetjes direct zichtbaar
    if (!n) h += '<p class="hint stat" style="margin-top:0">Nog leeg. Tik bij een product op "Op het lijstje", of typ hieronder iets zelf.</p>';
    else {
      CATS.forEach(function (c) {
        var its = S.lijst.filter(function (l) { return lijstInfo(l).cat === c.id; });
        if (!its.length) return;
        h += '<div class="lcat"><div class="lch"><span class="ci">' + c.i + '</span><b>' + esc(c.n) + '</b><span class="cn">' + its.length + '</span>' + '</div>' + its.map(function (l) {
          var i = lijstInfo(l), p = i.p, ih = inhTxt(p);
          var line = (p && p.pr != null) ? eur(p.pr * l.q) + (p.bon != null ? ' · bonus ' + eur(p.bon * l.q) : '') : (p ? 'geen prijs' : '');
          return '<div class="lrow' + (l.done ? ' done' : '') + '"><button class="lchk" data-act="lchk" data-id="' + l.id + '" aria-pressed="' + (!!l.done) + '" aria-label="Afvinken: ' + esc(i.n) + '">' + (l.done ? '✓' : '') + '</button>' +
            '<span class="lnm"><span class="lname">' + esc(i.n) + '</span><small class="hint" style="display:block;margin:0">' + esc([ih, line].filter(Boolean).join(' · ')) + '</small></span>' +
            '<span class="lq"><button class="minus" data-act="lmin" data-id="' + l.id + '" aria-label="Eén minder">−</button><b>' + l.q + '×</b><button class="minus" data-act="lplus" data-id="' + l.id + '" aria-label="Eén meer">+</button></span></div>';
        }).join('') + '</div>';
      });
      var s = 0, sb = 0, none = 0, anyb = false, dn = 0;
      S.lijst.forEach(function (l) {
        if (l.done) dn++;
        var p = lijstInfo(l).p; if (!p || p.pr == null) { none++; return; }
        s += p.pr * l.q; sb += (p.bon != null ? p.bon : p.pr) * l.q; if (p.bon != null) anyb = true;
      });
      h += '<div class="pricebox"><p><b>Totaal: ± ' + esc(eur(s)) + '</b></p>' + (anyb ? '<p>Met bonus: ± ' + esc(eur(sb)) + '</p>' : '') +
        '<p class="hint" style="margin:0">' + dn + ' van ' + n + ' afgevinkt' + (none ? '. ' + none + (none === 1 ? ' item heeft geen prijs en telt niet mee.' : ' items hebben geen prijs en tellen niet mee.') : '.') + '</p></div>';
      h += '<div class="btns"><button class="btn main" data-act="lcopy">Kopieer lijstje</button>' + (dn ? '<button class="btn" data-act="ldone">Afgevinkte weghalen</button>' : '') +
        '<button class="btn" data-act="lclear">' + (S.confirmLijst ? 'Echt alles van het lijstje halen?' : 'Lijstje leegmaken') + '</button></div>';
    }
    if (n) { /* h += lclearall-knop; v47: verhuisd naar Instellingen -> Verwijderen */ }
    h += '<div class="rowx" style="margin-top:8px"><input id="lfree" type="text" maxlength="80" autocomplete="off" placeholder="Iets erbij typen, bijvoorbeeld koffiefilters" aria-label="Iets op het lijstje zetten"><button class="pill" data-act="lfree">Toevoegen</button></div>';
    return h;
  }
  function recIngNames() {
    var out = [], seen = {};
    function add(name, unit) {
      var nm = String(name).split(',')[0].replace(/\([^)]*\)/g, '').replace(/^\s*optioneel:\s*/i, '').trim();
      if (!nm || /^(zout|peper|water|kruiden)\b|beslag/i.test(nm)) return;
      var k = normName(nm); if (!k || seen[k]) return; seen[k] = 1;
      var iu = String(unit || '').toLowerCase(), pu = (iu === 'ml' || iu === 'l' || iu === 'cl' || /(^|\s)(el|tl)$/.test(iu)) ? 'ml' : STUKU.test(iu) ? 'stuk' : 'g';
      out.push({ n: nm.charAt(0).toUpperCase() + nm.slice(1), u: pu });
    }
    ING_DB.forEach(function (x) { if (x[2] !== 0) add(x[0], x[1]); });
    S.recipes.forEach(function (r) { (r.ing || []).forEach(function (g) { if (g && g.n && g.p !== 0) add(g.n, g.u); }); });
    return out;
  }
  var PFR_SPICE = /kruid|peper|zout|knoflookpoeder|uienpoeder|paprikapoeder|nootmuskaat|kaneel|kerrie|kurkuma|komijn|oregano|basilicum|tijm|rozemarijn|bakpoeder|specerij|italiaanse/i;
  var PFR_PREP = /^(goed|fijn|grof|in |op |gehal|gepeld|gesneden|gewassen|geraspt|gebakken|gekookt|gewogen|ge[a-z]{4,}d$|uitgeknepen|drooggedept|bovenop|eventueel|naar smaak|optioneel|ca\b|ongeveer|plus|los\b|vers\b|diepvries|klein|groot|dun|dik)/i;
  function pfrParts(raw) {
    var s = String(raw || '').replace(/\([^)]*\)/g, ' ').replace(/^\s*optioneel:\s*/i, '').replace(/\s+in\s+(blokjes|stukjes|plakjes|reepjes|ringen|partjes)\s*$/i, '').replace(/\s+/g, ' ').trim();
    var parts = [];
    s.split(',').map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (sg, idx) {
      if (idx > 0 && PFR_PREP.test(sg)) return;
      // v45b.9: "A of B" wordt twee producten; "of ander ..." is geen product en blijft weg
      sg.split(/\s+(?:en|of)\s+/i).forEach(function (x) { x = x.trim(); if (x && !/^(een\s+)?(ander|andere|ander soort|eventueel|evt)\b/i.test(x)) parts.push(x); });
    });
    return parts;
  }
  // v45b.9: ook "Kookwater van de pasta" en alleen een hoeveelheid ("Een half zakje") zijn geen product
  var PFR_ALLEENHOEV = /^(een\s+|1\s+)?(half|halve|heel|hele|paar|beetje|scheutje|snufje|handje|mespuntje)?\s*(zakje|zakjes|pakje|pakjes|blik|blikje|potje|bakje|plak|plakje|stuk|stukje|el|tl|handvol|mespunt)\s*$/i;
  function pfrSkip(n) { return /^((kokend|koud|lauw|warm|extra)\s+)?water$/i.test(n) || /vocht/i.test(n) || /beslag/i.test(n) || /^(kookwater|kookvocht)\b/i.test(n) || /^water\s+van\b/i.test(n) || PFR_ALLEENHOEV.test(n); }
  function pfrRows() {
    var map = {}, order = [];
    S.recipes.forEach(function (r) {
      (r.ing || []).forEach(function (g) {
        if (!g || !g.n) return;
        var parts = pfrParts(g.n).filter(function (n) { return !pfrSkip(n); });
        parts.forEach(function (n) {
          n = stripSupermarkt(n);
          var key = normName(n); if (!key) return;
          var nm = n.charAt(0).toUpperCase() + n.slice(1), spice = PFR_SPICE.test(n);
          var iu = String(g.u || '').toLowerCase().trim(), u = 'g', kc = null, kst = null;
          if (spice) u = 'g';
          else if (iu === 'ml' || iu === 'l' || iu === 'cl') u = 'ml';
          else if (/(^|\s)(el|tl)$/.test(iu)) u = /olie|azijn|melk|sap|siroop|saus|bouillon/i.test(n) ? 'ml' : 'g';
          else if (STUKU.test(iu)) u = 'stuk';
          if (parts.length === 1 && g.p != null && g.p > 0 && !spice) {
            if (iu === 'g' || iu === 'gr' || iu === 'gram' || iu === 'ml') kc = Math.round(g.p * 1000) / 10;
            else if (STUKU.test(iu)) kst = g.p;
          }
          if (!map[key]) { map[key] = { n: nm, u: u, kc: kc, kst: kst, spice: spice, cat: spice ? ['blik'] : guessCats(n.replace(/\bop water\b/i, '')), from: [] }; order.push(key); }
          var row = map[key];
          if (row.kc == null && kc != null) row.kc = kc;
          if (row.kst == null && kst != null) row.kst = kst;
          if (row.from.indexOf(r.name) < 0) row.from.push(r.name);
        });
      });
    });
    var rows = [], same = 0;
    order.forEach(function (k) {
      var row = map[k], ex = findProd(row.n); row.ex = ex || null;
      // v45b.9: lijkt het op een product dat je al hebt (supermarktnaam of komma verschilt)? Dan "Mogelijk: ..." met keuze, niets voorgekozen.
      row.cand = []; row.keuze = '';
      if (!ex) row.cand = S.prijzen.filter(function (p) { return bijnaDezelfde(p.n, row.n); }).slice(0, 3).map(function (p) { return p.id; });
      if (ex) {
        var fillKc = ex.kc == null && row.kc != null && ex.u !== 'stuk' && row.u !== 'stuk';
        var fillKst = ex.kst == null && row.kst != null && ex.u === 'stuk' && row.u === 'stuk';
        row.fillKc = fillKc; row.fillKst = fillKst;
        if (!fillKc && !fillKst) { same++; return; }
      }
      row.on = true; rows.push(row);
    });
    rows.sort(function (a, b) { return a.n.localeCompare(b.n, 'nl'); });
    return { rows: rows, same: same };
  }
  function openPFR() {
    var res = pfrRows();
    if (!res.rows.length) { toast('Alles uit je recepten staat er al in'); return; }
    S.pj = { text: '', err: '', rows: null, notes: [], rec: res.rows, recSame: res.same };
    pushLayer(); document.documentElement.classList.add('lock'); $('pjsheet').hidden = false; renderPJ();
  }
  function pfrCount() { return (S.pj && S.pj.rec ? S.pj.rec : []).filter(function (r) { return r.on && r.keuze !== 'skip'; }).length; }
  function pfrHtml(P) {
    var nw = P.rec.filter(function (r) { return !r.ex; }).length, up = P.rec.length - nw;
    var h = '<p class="hint" style="margin-top:0">' + nw + ' nieuw, ' + up + ' bestaand (wordt aangevuld). ' + (P.recSame ? P.recSame + ' staan er al volledig in. ' : '') + 'Water en vocht zijn overgeslagen. Haal het vinkje weg bij wat je niet wilt. Er wordt pas iets bewaard als je op Bewaar tikt.</p>';
    P.rec.forEach(function (r, i) {
      var info = r.ex ? 'Bestaat al als ' + r.ex.n + '. Vult aan: calorieën.' : 'Nieuw' + (r.spice ? ' (kruiden)' : '') + ', categorie ' + catById(r.cat[0]).n + (r.kc != null ? ', ' + fmtN(r.kc) + ' kcal per 100 ' + r.u : r.kst != null ? ', ' + fmtN(r.kst) + ' kcal per stuk' : '') + '.';
      if (!r.ex && r.cand && r.cand.length) {
        // v45b.9: bijna-match: drie zichtbare keuzes, niets voorgekozen
        var pk = function (val, titel, sub) { return '<label class="vink"><input type="radio" name="pfrk' + i + '" data-pfrk="' + i + '" value="' + esc(val) + '"' + (r.keuze === val ? ' checked' : '') + '> <span>' + titel + (sub ? '<br><span class="hint" style="margin:0;font-weight:400">' + sub + '</span>' : '') + '</span></label>'; };
        h += '<div class="rcard pfrrow" style="padding:10px 12px"><b>' + esc(r.n) + '</b><span class="hint small" style="display:block;margin:2px 0 6px">Lijkt op een product dat je al hebt. Kies zelf wat je wilt. Uit: ' + esc(r.from.slice(0, 3).join(', ')) + (r.from.length > 3 ? ' e.a.' : '') + '</span>' +
          r.cand.map(function (cid) { var cp = prodById(cid); return cp ? pk('p:' + cid, 'Mogelijk: ' + esc(cp.n), 'Dezelfde, wordt hier als naam bijgezet en vult calorieën aan') : ''; }).join('') +
          pk('nieuw', 'Nieuw product, apart houden', esc(r.n)) + pk('skip', 'Overslaan', 'Er wordt niets bewaard') + '</div>';
        return;
      }
      h += '<label class="rcard pfrrow" style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px"><input type="checkbox" data-pfr="' + i + '"' + (r.on ? ' checked' : '') + ' style="width:24px;height:24px;margin-top:2px"><span><b>' + esc(r.n) + '</b><span class="hint small" style="display:block;margin:2px 0 0">' + esc(info) + ' Uit: ' + esc(r.from.slice(0, 3).join(', ')) + (r.from.length > 3 ? ' e.a.' : '') + '</span></span></label>';
    });
    h += '<div class="btns"><button class="btn main" id="pfrsave" data-act="pfrsave">Bewaar (' + pfrCount() + ')</button></div>';
    return h;
  }
  function pfrSave() {
    var P = S.pj; if (!P || !P.rec) return;
    var rows = P.rec.filter(function (r) { return r.on && r.keuze !== 'skip'; });
    if (!rows.length) { toast('Niets aangevinkt'); return; }
    // v45b.9: bij een bijna-match eerst kiezen
    var open = rows.filter(function (r) { return !r.ex && r.cand && r.cand.length && !r.keuze; });
    if (open.length) { toast('Kies eerst bij "' + open[0].n + '" wat je wilt'); return; }
    var before = JSON.stringify(S.prijzen), nw = 0, up = 0;
    rows.forEach(function (r) {
      var ex = findProd(r.n);
      if (!ex && r.keuze && r.keuze.indexOf('p:') === 0) {
        var tg = prodById(r.keuze.slice(2));
        if (tg) {
          if (prodKeys(tg).indexOf(normName(r.n)) < 0 && (tg.alias || []).length < 10) { tg.alias = (tg.alias || []).concat([r.n]); }
          if (r.kc != null && tg.kc == null && tg.u !== 'stuk' && r.u !== 'stuk') tg.kc = r.kc;
          if (r.kst != null && tg.kst == null && tg.u === 'stuk' && r.u === 'stuk') tg.kst = r.kst;
          up++; return;
        }
      }
      if (ex) {
        if (r.fillKc && ex.kc == null) ex.kc = r.kc;
        if (r.fillKst && ex.kst == null) ex.kst = r.kst;
        up++;
      } else {
        var p = cleanProd({ id: uid(), n: r.n, u: r.u, inh: null, pr: null, bon: null, alias: [], w: {}, kc: r.u === 'stuk' ? null : r.kc, kst: r.u === 'stuk' ? r.kst : null, cat: r.cat.slice(), foto: '', kruid: !!r.spice });
        if (p) { S.prijzen.push(p); nw++; }
      }
    });
    if (!tryStore()) { S.prijzen = JSON.parse(before); toast('Opslaan lukt niet'); return; }
    S.status = 'ok'; toast(nw + ' nieuw, ' + up + ' aangevuld. Vul de inhoud en de prijs in.'); forceClosePJ();
  }
  document.addEventListener('change', function (ev) {
    var tk = ev.target; if (tk && tk.getAttribute && tk.getAttribute('data-pkn') != null && S.prod) { S.prod.kopKeuze = tk.value; renderProd(false); return; }
    var t = ev.target; if (!t || !t.getAttribute || !S.pj || !S.pj.rows) return;
    var pjo = t.getAttribute('data-pjo');
    if (pjo != null) {
      var r0 = S.pj.rows[+pjo]; if (!r0) return;
      r0.overVinkt = r0.overVinkt || {};
      r0.overVinkt[t.getAttribute('data-pok')] = t.checked;
      return;
    }
    var pjk = t.getAttribute('data-pjk');
    if (pjk != null) { var rk = S.pj.rows[+pjk]; if (!rk) return; rk.keuze = t.value; if (t.value !== 'andere') rk.koppel = rk.koppel; renderPJ(); return; }
    var pjsel = t.getAttribute('data-pjsel');
    if (pjsel != null) { var rs = S.pj.rows[+pjsel]; if (rs) rs.koppel = t.value; renderPJ(); return; }
    var pjsk = t.getAttribute('data-pjskip');
    if (pjsk != null) { var rz = S.pj.rows[+pjsk]; if (rz) rz.skipBox = !!t.checked; renderPJ(); return; }
    var pjm = t.getAttribute('data-pjm');
    if (pjm != null) {
      var r1 = S.pj.rows[+pjm]; if (!r1) return;
      var pv = t.getAttribute('data-pjp') || '';
      if (pv.indexOf('alias:') === 0) { r1.aliasAan = pv.slice(6); r1.pid = ''; r1.vervangId = null; }
      else if (pv.indexOf('vervang:') === 0) { r1.vervangId = pv.slice(8); r1.pid = ''; r1.aliasAan = null; }
      else { r1.pid = pv; r1.aliasAan = null; r1.vervangId = null; }
      // v45b.4: bij keuze voor een bestaand product wordt de naam vastgezet op die van het product
      if (r1.pid) { var pp = prodById(r1.pid); if (pp) r1.n = pp.n; }
      renderPJ();
    }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t && t.getAttribute && t.getAttribute('data-pfrk') != null && S.pj && S.pj.rec) {
      var rr = S.pj.rec[+t.getAttribute('data-pfrk')];
      if (rr) { rr.keuze = t.value; rr.on = t.value !== 'skip'; var bb = $('pfrsave'); if (bb) bb.textContent = 'Bewaar (' + pfrCount() + ')'; }
      return;
    }
    if (t && t.getAttribute && t.getAttribute('data-pfr') != null && S.pj && S.pj.rec) {
      S.pj.rec[+t.getAttribute('data-pfr')].on = !!t.checked;
      var b = $('pfrsave'); if (b) b.textContent = 'Bewaar (' + pfrCount() + ')';
    }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target && ev.target.id === 'lfree') { ev.preventDefault(); var b = document.querySelector('[data-act="lfree"]'); if (b) b.click(); }
  });
  // v45a.2: vind waar een product in de week staat
  function weekUsageOf(p) {
    var out = [];
    var keys = prodKeys(p);
    Object.keys(S.days).forEach(function (id) {
      var d = S.days[id];
      if (!d || !d.entries) return;
      d.entries.forEach(function (e) {
        if (e.pid === p.id || (!e.pid && e.name && keys.some(function (k) { return normName(e.name.split(',')[0]) === k; }))) {
          var dt = new Date(+id.split('-')[0], +id.split('-')[1] - 1, +id.split('-')[2]);
          var slotName = '';
          momentsFor(dt.getDay(), d).forEach(function (m) { if (m.slot === e.slot) slotName = m.t; });
          out.push({ day: id, dow: DOW[dt.getDay()], date: dt, slotName: slotName });
        }
      });
    });
    return out;
  }
  // v45a.2: vind in welke recepten een product voorkomt
  function recipeUsageOf(p) {
    var out = [];
    var keys = prodKeys(p);
    (S.recipes || []).forEach(function (r) {
      (r.ing || []).forEach(function (i) {
        if (!i || !i.n) return;
        var iname = normName(String(i.n).split(',')[0]);
        if (keys.some(function (k) { return k === iname; })) {
          if (out.indexOf(r.name) < 0) out.push(r.name);
        }
      });
    });
    return out;
  }
  
  // v46: "tm maart" (zelfde jaar) of "tm maart 2027"
  function bonTmTekst(ts) {
    var d = new Date(ts), MN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    return MN[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '');
  }
  // v48 Week-ronde: rustige productkaart. In het zicht: alleen naam + verpakking + prijs.
  // De rest zit ingeklapt achter blokjes (Staat in je week / Voedingswaarden / Kenmerken),
  // één tegelijk open. Knoppen onderaan blijven.
  function prodRow(p, catid) {
    var key = 'pr:' + p.id + ':' + catid;
    var inhT = p.inh ? inhLabel(p) : 'inhoud nog niet ingevuld';
    var ls = labelsOf(p);
    // v46: rustige regel: naam links, prijs klein rechts (bonus als klein regeltje eronder).
    var h = '<details class="prod2" data-rk="' + esc(key) + '"' + (S.recOpen[key] ? ' open' : '') + '><summary><span class="pnw"><span class="pn">' + esc(p.n) + (p.thuis ? ' 🏠' : '') + (p.direct ? ' 🍽' : '') + (p.kruid ? ' 🌿' : '') + '</span>' + '</span>' + // wens 10 nov: kenmerk-tekentjes bij de productnaam
      '<span class="ppr">' + (p.pr != null ? '<span class="pmain">' + esc(eur(p.pr)) + '</span>' : '<small class="pbon">geen prijs</small>') + (p.bon != null ? '<small class="pbon">bonus ' + esc(eur(p.bon)) + (p.bonTot ? ' (tm ' + bonTmTekst(p.bonTot) + ')' : '') + '</small>' : '') + '</span></summary>';
    // v48: verpakking staat direct onder de kaartkop in het zicht (samen met naam + prijs)
    h += '<p class="rwhere" style="margin-top:2px">Verpakking: ' + esc(inhT) + (p.prijsBron ? ' · ' + esc(p.prijsBron) : '') + (p.bron ? ' · ' + esc(p.bron) : '') + '</p>';
    if ((p.u === 'g' || p.u === 'ml') && !(p.aantal > 0)) h += '<p class="hint small" style="margin:2px 0 0">Tip: vul bij Bewerken het aantal stuks + eigen woord in, dan kun je straks plakjes/stuk kiezen.</p>';
    // v48.2: als het aantal-per-verpakking-blokje gevuld is, één extra regeltje
    var sg2 = stukGram(p);
    if (sg2 != null && p.aantalWoord) {
      var prPer = p.pr != null ? eur(Math.round(p.pr / p.aantal * 100) / 100) : null;
      h += '<p class="rwhere">1 ' + esc(antalWoord1(p)) + ' ≈ ' + esc(fmtN(Math.round(sg2 * 10) / 10)) + (p.u === 'ml' ? ' ml' : ' g') + (prPer ? ' · ' + esc(prPer) + ' per ' + esc(antalWoord1(p)) : '') + '</p>';
    }
    var sumOpen = function (nm) { return S.prodSum && S.prodSum[p.id] === nm; };
    if (p.sg) h += '<details class="psum"><summary>Per stuk</summary><div class="pgin"><p class="rwhere" style="margin:6px 0">Eén stuk weegt ' + esc(fmtN(p.sg)) + ' g.</p></div></details>';
    h += '<div class="prodsumwrap">';
    // v45a.2: waar gebruik ik dit product?
    (function () {
      var wu = weekUsageOf(p), ru = recipeUsageOf(p);
      if (!wu.length && !ru.length) return;
      if (wu.length) {
        var seen = {}, wdays = [];
        wu.forEach(function (w) { if (seen[w.day]) return; seen[w.day] = 1; wdays.push(w); });
        wdays.sort(function (x, y) { return x.day < y.day ? -1 : x.day > y.day ? 1 : 0; });
        var td0 = new Date(), tdMs = new Date(td0.getFullYear(), td0.getMonth(), td0.getDate()).getTime();
        // v46: de 5 dagen dichtst bij vandaag (bij gelijke afstand de komende eerst); getoond op datum
        var near = wdays.slice().sort(function (x, y) { var dx = Math.abs(x.date.getTime() - tdMs), dy = Math.abs(y.date.getTime() - tdMs); return dx - dy || y.date.getTime() - x.date.getTime(); }).slice(0, 5).map(function (x) { return x.day; });
        // v46: bij doorklik vanuit de week: blok open, herkomstdag altijd zichtbaar en gemarkeerd
        var fromDay = (S.prFrom && S.prFrom.pid === p.id) ? S.prFrom.day : null;
        if (fromDay && wdays.some(function (x) { return x.day === fromDay; }) && near.indexOf(fromDay) < 0) { near.pop(); near.push(fromDay); }
        var dayLinks = wdays.map(function (w) {
          var isFrom = fromDay && w.day === fromDay;
          return '<button class="pill wkd' + (near.indexOf(w.day) < 0 ? ' wmore' : '') + (isFrom ? ' wfrom' : '') + '" data-act="gotoweek" data-day="' + w.day + '" style="font-size:13px;padding:0 10px;min-height:36px">' + cap(w.dow) + ' ' + short(w.date) + (w.slotName ? ' · ' + esc(w.slotName) : '') + (isFrom ? ' <span class="wfromt">← hiervandaan</span>' : '') + '</button>';
        });
        // v48 Week-ronde: "Staat in je week" als inklapbaar blokje; bij doorklik vanuit
        // de week staat het open met de herkomstdag gemarkeerd ("← hiervandaan")
        var wOpen = !!fromDay;
        h += '<details class="psum pwk"' + (wOpen ? ' open' : '') + ' data-sum="wk"><summary>📅 Staat in je week \u00b7 ' + wdays.length + (wdays.length === 1 ? ' dag' : ' dagen') + '</summary><div class="pgin"><div class="seg" style="margin:6px 0 0">' + dayLinks.join('') + '</div>' + (wdays.length > 5 ? '<button class="wmorebtn" data-act="wkall">Toon alle ' + wdays.length + ' dagen</button>' : '') + '</div></details>';
      }
      if (ru.length) {
        h += '<details class="psum"><summary>🍽 In recepten \u00b7 ' + ru.length + (ru.length === 1 ? ' recept' : ' recepten') + '</summary><div class="pgin"><p class="rwhere" style="margin:6px 0">' + esc(ru.slice(0, 5).join(', ')) + (ru.length > 5 ? ' …' : '') + '.</p></div></details>';
      }
    })();
    if (p.alias && p.alias.length) h += '<details class="psum"><summary>Alias</summary><div class="pgin"><p class="rwhere" style="margin:6px 0">Herkend in recepten als: ' + esc(p.alias.join(', ')) + '.</p></div></details>';
    var ws = W_FIELDS.filter(function (f) { return p.w && p.w[f[0]] != null; });
    var puur = puurStatus(p); // v47.4.5: puur natuurproducten slaan de strenge controle over
    // v48: etiketblok + puur-keuze zitten ingeklapt achter "Voedingswaarden"
    if (ws.length || puur === 'twijfel') {
      h += '<details class="psum pww"' + (sumOpen('ww') ? ' open' : '') + ' data-sum="ww"><summary>📋 Voedingswaarden</summary><div class="pgin">';
      if (ws.length) {
        h += '<div class="check" style="padding:0 12px 6px;margin-bottom:8px"><p class="hint zz" style="margin:8px 0 0">Etiket per 100 g of 100 ml. Vuistregels, geen wetten. Past het net niet, neem dan een kleinere portie.</p>' +
          ws.map(function (f) {
            if (puur === 'ja') return '<div class="ck"><span>' + esc(f[1]) + ' ' + esc(fmtN(p.w[f[0]])) + ' g</span><b class="vww">binnen de richtlijn</b></div>';
            return '<div class="ck"><span>' + esc(f[1]) + ' ' + esc(fmtN(p.w[f[0]])) + ' g</span><b class="' + wClass(f[0], p.w[f[0]]) + '">' + esc(wCheck(f[0], p.w[f[0]])) + '</b></div>';
          }).join('');
        if (puur === 'ja') h += '<div class="ck"><span>🌿</span><b class="vww">Binnen de richtlijn — dit is een puur natuurproduct boordevol goede voedingsstoffen.</b></div>';
        h += '</div>';
      }
      if (puur === 'twijfel') { // v47.4.5: geen gok — Marlijn kiest zelf, de app onthoudt de keuze per product
        h += '<div class="check" style="padding:0 12px 6px;margin-bottom:8px"><p class="hint" style="margin:8px 0 0">🌿 Puur natuur? Vers fruit, verse groente en rauwe ongezouten noten en zaden vallen buiten de suiker- en vezelcontrole. Bij dit product kan de app dat niet met zekerheid zien — daarom kies jij.</p>' +
          '<div class="seg mvact" style="display:grid;grid-template-columns:1fr 1fr"><button class="pill" data-act="puurset" data-p="' + p.id + '" data-v="puur">Het is puur natuur</button><button class="pill" data-act="puurset" data-p="' + p.id + '" data-v="gewoon">Gewone controle</button></div></div>';
      }
      h += '</div></details>';
    }
    // v48: kenmerken-blokje met de pill-knoppen (In huis / Direct eetbaar / Kruid (0 kcal) niet los in het zicht)
    h += '<details class="psum"' + (sumOpen('kn') ? ' open' : '') + ' data-sum="kn"><summary>🏷️ Kenmerken</summary><div class="pgin">';
    h += '<div class="seg" style="margin:6px 0 8px"><button class="pill" data-act="prdthuis" data-p="' + esc(p.id) + '" aria-pressed="' + (!!p.thuis) + '">' + (p.thuis ? '✓ In huis' : '🏠 In huis') + '</button><button class="pill" data-act="prddirect" data-p="' + esc(p.id) + '" aria-pressed="' + (!!p.direct) + '">' + (p.direct ? '✓ Direct eetbaar' : '⚡ Direct eetbaar') + '</button><button class="pill" data-act="prdkruid" data-p="' + esc(p.id) + '" aria-pressed="' + (!!p.kruid) + '">' + (p.kruid ? '✓ Kruid (0 kcal)' : 'Kruid (0 kcal)') + '</button></div>';
    h += '</div></details>';
    h += '</div>'; // /prodsumwrap
    h += '<div class="seg" style="margin:6px 0 10px"><button class="pill" data-act="ladd" data-p="' + p.id + '">' + (S.lijst.some(function (x) { return x.pid === p.id; }) ? 'Nog een op het lijstje' : 'Op het lijstje') + '</button><button class="pill" data-act="prodmerge" data-p="' + p.id + '">Samenvoegen met…</button><button class="pill" data-act="prodedit" data-p="' + p.id + '">Bewerken</button>' +
      // wens 10 nov: Foto etiket-knop van het product-scherm af (scanner leest etiketten uit foto's); data p.foto blijft onaangeroerd

      '<button class="pill" data-act="proddel" data-p="' + p.id + '">' + (S.confirmProd === p.id ? 'Echt verwijderen?' : 'Verwijderen') + '</button></div></details>';
    return h;
  }
  function prodMatches(p) {
    var q = normName(S.prq || '');
    if (q) {
      var words = prodKeys(p).concat(catsOf(p).map(function (c) { return normName(catById(c).n); })).join(' ').split(' ').filter(Boolean);
      var terms = q.split(' ').filter(Boolean);
      var ok = terms.every(function (t, ti) { // v57 (v54.2-afspraak blijft): hele woorden; alleen het laatste woord mag op een beginstuk ("kaas" vindt pindakaas niet, "haver" vindt Havermout wel)
        if (ti === terms.length - 1) return words.some(function (w) { return w.indexOf(t) === 0; });
        return words.indexOf(t) >= 0;
      });
      if (!ok) return false;
    }
    return (S.plab || []).every(function (id) { return labOn(p, id); });
  }

  // v45a.3: 'Lijken op elkaar'-sectie verwijderd — te veel valse matches (magere vs vol, runder vs mager runder).
  // v45a voorkomt al duplicaten bij scan/bon/import; samenvoegen kan nog steeds via 'Samenvoegen met…' per product.

  var mergeState = { pAId: null, pBId: null, survivorId: null, others: [] };

  function openMergeModal(pAId, pBId, presetSurvivorId) {
    var pA = prodById(pAId); if (!pA) return;
    if (!pBId) {
      mergeState = { pAId: pAId, pBId: null, survivorId: null, others: [] };
      pushLayer(); document.documentElement.classList.add('lock'); $('mergesheet').hidden = false;
      renderMergePick(pA);
      return;
    }
    var pB = prodById(pBId); if (!pB) return;
    var survivor = presetSurvivorId || (((pB.kc != null || pB.kst != null) && !(pA.kc != null || pA.kst != null)) ? pB.id : pA.id);
    mergeState = { pAId: pA.id, pBId: pB.id, survivorId: survivor, others: [pB.id] };
    pushLayer(); document.documentElement.classList.add('lock'); $('mergesheet').hidden = false;
    renderMergePreview();
  }

  function renderMergePick(pA) {
    var body = $('mergebody');
    var h = '<p class="hint" style="margin-top:0">Kies met welk product je <strong>' + esc(pA.n) + '</strong> wilt samenvoegen:</p>' +
      '<input class="note" id="mergepickq" type="text" placeholder="Zoek ander product…" autocomplete="off" style="margin-bottom:10px">' +
      '<div id="mergepicklist">';
    var cand = S.prijzen.filter(function (x) { return x.id !== pA.id; }).sort(function (a, b) { return a.n.localeCompare(b.n, 'nl'); });
    cand.forEach(function (c) {
      h += '<button class="opt" data-act="choosemerge" data-p="' + c.id + '"><span class="on">' + esc(c.n) + '<small>' + (c.kc != null ? (c.kc + ' kcal/100g') : (c.kst != null ? (c.kst + ' kcal/st') : 'geen kcal')) + '</small></span></button>';
    });
    h += '</div>';
    body.innerHTML = h;
  }

  function renderMergePreview() {
    var pA = prodById(mergeState.pAId), pB = prodById(mergeState.pBId);
    if (!pA || !pB) return;
    var surv = mergeState.survivorId === pB.id ? pB : pA;
    var slave = surv.id === pA.id ? pB : pA;
    var body = $('mergebody');

    // Bereken aangevulde gegevens
    var added = [];
    if (surv.kc == null && slave.kc != null) added.push('Calorieën: ' + slave.kc + ' kcal per 100 ' + (slave.u || 'g'));
    if (surv.kst == null && slave.kst != null) added.push('Calorieën per stuk: ' + slave.kst + ' kcal');
    if (surv.sg == null && slave.sg != null) added.push('Gewicht per stuk: ' + slave.sg + ' g');
    if (surv.pr == null && slave.pr != null) added.push('Prijs: € ' + slave.pr.toFixed(2).replace('.', ','));
    if (surv.inh == null && slave.inh != null) added.push('Inhoud: ' + slave.inh + ' ' + (slave.u || 'g'));
    var scats = catsOf(surv).slice(), slcats = catsOf(slave);
    var addedCats = [];
    slcats.forEach(function (c) { if (scats.indexOf(c) < 0 && scats.length + addedCats.length < 3) addedCats.push(c); });
    if (addedCats.length) added.push('Categorie: ' + addedCats.map(function (c) { return catById(c).n; }).join(', '));

    var h = '<div style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:12px">' +
      '<h3 style="margin:0 0 8px">Welk product blijft bewaard?</h3>' +
      '<label style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;background:' + (surv.id === pA.id ? 'var(--accent-soft,#eef6f5)' : 'transparent') + ';cursor:pointer;margin-bottom:6px">' +
      '<input type="radio" name="survrad" value="' + pA.id + '"' + (surv.id === pA.id ? ' checked' : '') + ' data-act="setsurv"> <div><strong>' + esc(pA.n) + '</strong>' + (pA.kc != null ? ' <small>(heeft ' + pA.kc + ' kcal)</small>' : (pA.kst != null ? ' <small>(heeft ' + pA.kst + ' kcal/st)</small>' : '')) + '</div></label>' +
      '<label style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;background:' + (surv.id === pB.id ? 'var(--accent-soft,#eef6f5)' : 'transparent') + ';cursor:pointer">' +
      '<input type="radio" name="survrad" value="' + pB.id + '"' + (surv.id === pB.id ? ' checked' : '') + ' data-act="setsurv"> <div><strong>' + esc(pB.n) + '</strong>' + (pB.kc != null ? ' <small>(heeft ' + pB.kc + ' kcal)</small>' : (pB.kst != null ? ' <small>(heeft ' + pB.kst + ' kcal/st)</small>' : '')) + '</div></label>' +
      '</div>';

    h += '<div style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:12px">' +
      '<h3 style="margin:0 0 6px">Wat gebeurt er?</h3>' +
      '<p style="margin:0 0 6px">· <strong>' + esc(slave.n) + '</strong> wordt als alias gekoppeld aan <strong>' + esc(surv.n) + '</strong>.</p>' +
      '<p style="margin:0 0 6px">· Aangevulde ontbrekende gegevens: ' + (added.length ? '<strong>' + added.join(', ') + '</strong>' : '<em>geen (alleen alias)</em>') + '.</p>' +
      '<p class="hint" style="margin:0 0 4px">· Bestaande gegevens van ' + esc(surv.n) + ' worden nooit overschreven.</p>' +
      '<p class="hint" style="margin:0">· Recepten en weken die al zijn ingevuld behouden hun calorieën.</p>' +
      '</div>';

    h += '<div class="row" style="margin-top:12px"><button class="btn main" data-act="domerge" style="flex:1">Samenvoegen bevestigen</button><button class="btn" data-act="mergeclose" style="flex:1">Annuleren</button></div>';
    body.innerHTML = h;
  }

  function executeProductMerge() {
    var pA = prodById(mergeState.pAId), pB = prodById(mergeState.pBId);
    if (!pA || !pB) return;
    var surv = mergeState.survivorId === pB.id ? pB : pA;
    var slave = surv.id === pA.id ? pB : pA;

    // Sla undo toestand op
    S.lastMergeUndo = {
      prijzen: JSON.parse(JSON.stringify(S.prijzen)),
      days: JSON.parse(JSON.stringify(S.days)),
      recipes: JSON.parse(JSON.stringify(S.recipes))
    };

    // Alias bijwerken
    surv.alias = Array.isArray(surv.alias) ? surv.alias : [];
    if (surv.alias.indexOf(slave.n) < 0 && surv.n !== slave.n) surv.alias.push(slave.n);
    (slave.alias || []).forEach(function (a) {
      if (surv.alias.indexOf(a) < 0 && surv.n !== a) surv.alias.push(a);
    });

    // Aanvullen zonder overschrijven
    if (surv.kc == null && slave.kc != null) surv.kc = slave.kc;
    if (surv.kst == null && slave.kst != null) surv.kst = slave.kst;
    if (surv.sg == null && slave.sg != null) surv.sg = slave.sg;
    if (surv.pr == null && slave.pr != null) surv.pr = slave.pr;
    if (surv.inh == null && slave.inh != null) surv.inh = slave.inh;
    var scats = catsOf(surv).slice(), slcats = catsOf(slave);
    slcats.forEach(function (c) { if (scats.indexOf(c) < 0 && scats.length < 3) scats.push(c); });
    surv.cat = scats;

    // Verwijzingen in S.days bijwerken
    Object.keys(S.days || {}).forEach(function (dk) {
      var d = S.days[dk];
      (d.entries || []).forEach(function (e) {
        if (e.pid === slave.id) {
          e.pid = surv.id;
          e.key = 'P:' + surv.id;
        }
      });
    });

    // Verwijder slave uit S.prijzen
    S.prijzen = S.prijzen.filter(function (x) { return x.id !== slave.id; });

    persist();
    closeMergeModal();
    renderPrijzen();
    toast('Producten samengevoegd');
  }

  function undoLastMerge() {
    if (!S.lastMergeUndo) return;
    S.prijzen = S.lastMergeUndo.prijzen;
    S.days = S.lastMergeUndo.days;
    S.recipes = S.lastMergeUndo.recipes;
    S.lastMergeUndo = null;
    persist();
    renderPrijzen();
    toast('Samenvoeging ongedaan gemaakt');
  }

  function closeMergeModal() {
    $('mergesheet').hidden = true;
    document.documentElement.classList.remove('lock');
    mergeState = { pAId: null, pBId: null, survivorId: null, others: [] };
  }

  // v46: de label-blokken (Diepvries, Makkelijk, Eiwitrijk, ...) zitten dicht achter één tik; er is geen losse rij met label-knoppen meer
  function lblBlokHtml(list) {
    var subs = LABS.map(function (l) { return { l: l, inL: list.filter(function (p) { return labOn(p, l.id); }) }; }).filter(function (x) { return x.inL.length; });
    var uniq = {}; subs.forEach(function (sb) { sb.inL.forEach(function (p) { uniq[p.id] = 1; }); });
    var n = Object.keys(uniq).length;
    var inner = subs.map(function (sb) {
      var k = 'lb:' + sb.l.id;
      return '<details class="pcat lblsub" data-rk="' + k + '"' + (S.recOpen[k] ? ' open' : '') + '><summary><span class="ci">' + sb.l.i + '</span><span>' + esc(sb.l.n) + '</span><span class="cn">' + sb.inL.length + '</span></summary>' + sb.inL.map(function (p) { return prodRow(p, k); }).join('') + '</details>';
    }).join('');
    return '<details class="pgrp lblblok" data-rk="lb:blok"' + (S.recOpen['lb:blok'] ? ' open' : '') + '><summary><span class="ci">🏷</span><span>Label-blokken (' + n + (n === 1 ? ' product' : ' producten') + ')</span><span class="cn lblhint">niet altijd nodig — tik om te openen</span></summary><div class="pgin">' + (inner || '<p class="hint stat" style="margin:8px 12px">Geen producten met een label.</p>') + '</div></details>';
  }
  function prListHtml() {
    var list = S.prijzen.filter(prodMatches).sort(function (a, b) { return a.n.localeCompare(b.n, 'nl'); });
    var filt = !!(normName(S.prq || '') || (S.plab || []).length);
    var h = '';
    if (S.lastMergeUndo) {
      h += '<div class="banner" style="background:var(--accent-soft,#eef6f5);border:1px solid var(--accent,#2c6e64);border-radius:10px;padding:8px 12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center"><span>Laatste samenvoeging</span><button class="pill" data-act="undomerge">Ongedaan maken</button></div>';
    }
    if (!S.prijzen.length) return '<p class="hint stat" style="margin-top:0">Nog geen producten. Tik op Prijzen plakken en plak bijvoorbeeld:</p><div class="pricebox">Productnaam, 200 g | 1,23<br>Productnaam, 200 g | 1,23 | bonus 0,99<br>2x Productnaam (160 g)</div>';
    if (!filt) {
      h += '<div class="seg" style="margin:0 0 8px"><button class="pill" data-act="prblader" aria-pressed="' + !!S.prBl + '">' + (S.prBl ? '🙈 Verberg categorieën' : '📁 Blader per categorie') + '</button></div>';
      if (!S.prBl) {
        // v45c.6: rustig beginscherm: de laatste 4 toegevoegde producten staan er gewoon in, zonder klikken
        var lt = S.prijzen.slice(-4).reverse();
        return h + lblBlokHtml(list) + '<h3 style="margin:8px 0 2px">Laatst toegevoegd</h3><p class="hint zz" style="margin:0 0 6px">Je nieuwste producten — tik erop om ze meteen te gebruiken.</p><div class="pgrp">' + lt.map(prodRow).join('') + '</div>';
      }
    }
    if (!list.length) return '<p class="hint stat" style="margin-top:0">Niets gevonden. Probeer een ander woord.</p>';
    // v45c: zes hoofdgroepen (uitklapbaar) met daarin de categorieën (uitklapbaar) met daarin de productrijen.
    // Categorieën die in geen hoofdgroep horen (diepvries, oven, koud) staan onder Overig, zodat niets verdwijnt.
    var closed = S.pcClosed || {}, tree = '';
    GROEPEN.forEach(function (g) {
      var subs = groepCats(g).map(function (cid) {
        var c = catById(cid); if (!c) return null;
        var inCat = list.filter(function (p) { return catsOf(p).indexOf(cid) >= 0; });
        return inCat.length ? { c: c, inCat: inCat } : null;
      }).filter(Boolean);
      if (!subs.length) return;
      var uniq = {}; subs.forEach(function (sb) { sb.inCat.forEach(function (p) { uniq[p.id] = 1; }); });
      var ids = Object.keys(uniq), gk0 = 'pg:' + g.id;
      var gOpen = S.recOpen[gk0];
      tree += '<details class="pgrp" data-rk="' + gk0 + '"' + (gOpen ? ' open' : '') + '><summary><span class="ci">' + g.i + '</span><span>' + esc(g.n) + '</span><span class="cn">' + ids.length + '</span></summary><div class="pgin">';
      subs.forEach(function (sb) {
        var c = sb.c, inCat = sb.inCat;
        var gk = 'pc:' + c.id, open = S.recOpen[gk];
        tree += '<details class="pcat" data-rk="' + gk + '"' + (open ? ' open' : '') + '><summary><span class="ci">' + c.i + '</span><span>' + esc(c.n) + '</span><span class="cn">' + inCat.length + '</span></summary>' + inCat.map(function (p) { return prodRow(p, c.id); }).join('') + '</details>'; // v47: verwijderknop verhuisd naar Instellingen → 🗑️ Verwijderen
      });
      tree += '</div></details>';
    });
    if (!filt) return h + tree + lblBlokHtml(list);
    // v46: bij zoeken eerst de treffers als regels (standaard open); de label-blokken zitten erachter, dicht, achter één tik
    var out = h + '<details class="pgrp zoekgrp" data-rk="zk:gev"' + (closed['zk:gev'] ? '' : ' open') + '><summary><span class="ci">🔍</span><span>Gevonden</span><span class="cn">' + list.length + '</span></summary><div class="pgin">' + list.map(function (p) { return prodRow(p, 'zk'); }).join('') + '</div></details>';
    out += lblBlokHtml(list);
    return out;
  }
  function prCountText() {
    var n = S.prijzen.filter(prodMatches).length, filt = !!(normName(S.prq || '') || (S.plab || []).length);
    return 'Producten (' + (filt ? n + ' van ' + S.prijzen.length : S.prijzen.length) + ')';
  }
  // v45a.2: renderPrijzen met sub-tabs (Mijn producten / Boodschappenlijst)
  function renderPrijzen() {
    var lijstCount = S.lijst.length;
    var h = '<div class="subtabs">' +
      '<button class="subtab" data-act="prsub" data-v="mijn" aria-pressed="' + (S.prSub !== 'lijst') + '">📦 Mijn producten</button>' +
      '<button class="subtab" data-act="prsub" data-v="lijst" aria-pressed="' + (S.prSub === 'lijst') + '">🛒 Boodschappenlijst' + (lijstCount ? ' <span class="badge">' + lijstCount + '</span>' : '') + '</button>' +
      '</div>';
    if (S.prSub === 'lijst') {
      h += '<div id="prlijst">' + prLijstHtml() + '</div>';
    } else {
      // v47: Producten plakken en Nieuw product staan bij Instellingen → Iets toevoegen.
      h += '<h2 class="sec" style="margin-top:4px">Mijn producten en prijzen</h2><p class="hint" style="margin-top:0">Producten toevoegen: maak er zelf eentje, of plak een lijst / kies een bestand.</p>'; // v57.4: hint noemt beide deuren (Nieuw product-knop + lijst plakken)
      h += '<div class="grid2" style="margin-top:8px">' + // v57.4 (canvas v18, variant B): twee knoppen naast elkaar ipv losse full-width knop
        '<button class="btn" type="button" data-act="prodnew" style="min-height:60px;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px"><span>\u2795 Nieuw product</span><small style="font-weight:400;font-size:12px;opacity:.85">Zelf invullen</small></button>' + // v57.5: beide knoppen gelijke (gewone) stijl — geen btn main meer
        '<button class="btn" type="button" data-act="prpj" style="min-height:60px;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px"><span>\ud83d\udccb Lijst plakken</span><small style="font-weight:400;font-size:12px;opacity:.85">Bestand kan ook</small></button>' +
        '</div>'; // prodnew = prodOpen(null), zelfde formulier als Instellingen -> Zelf iets toevoegen; prpj = lijst plakken of bestand kiezen (ongewijzigd)
      h += '<p class="hint zz" style="margin:4px 0 0">Plak je lijstje of bon — daarna check je samen wat de app ervan begrepen heeft.</p>';
      h += '<h2 class="sec" id="prcount">' + esc(prCountText()) + '</h2>';
      h += '<input class="note" id="prsearch" type="search" autocomplete="off" placeholder="🔍 Zoek een product" aria-label="Zoek een product" value="' + esc(S.prq || '') + '">';
      h += '<div id="prlist">' + prListHtml() + '</div>';
      if (S.prijzen.length) { /* h += prdelall-knop; v47: verhuisd naar Instellingen -> Verwijderen */ }
      h += '<div style="text-align:center;margin:14px 0 4px"><button class="tolink" data-act="nieuwstopen">Verwijder nieuwste producten…</button></div>'; // v47.4
    }
    $('prijsview').innerHTML = h;
    requestAnimationFrame(function () { var br = document.querySelector('#prijsview .btnrow'); if (br) { br.scrollLeft = 0; br.style.display = 'none'; br.offsetHeight; br.style.display = 'flex'; } });
  }
  function labChips(P) {
    return LABS.map(function (l) { return '<button class="fchip" data-act="plabp" data-v="' + l.id + '" aria-pressed="' + labOn(P, l.id) + '">' + l.i + ' ' + esc(l.n) + '</button>'; }).join('');
  }
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t) return;
    if (t.id === 'prsearch') { S.prq = t.value; delete S.recOpen['lb:blok']; var pl = $('prlist'); if (pl) pl.innerHTML = prListHtml(); var pc = $('prcount'); if (pc) pc.textContent = prCountText(); return; }
    if (t.getAttribute && t.getAttribute('data-pw') != null) { t.className = 'note' + wnCls(t.getAttribute('data-pw'), t.value); }
    if (t.getAttribute && t.getAttribute('data-pw') != null) setTimeout(function () { var e = $('plabs'); if (e && S.prod) e.innerHTML = labChips(S.prod); }, 0);
    // v45b.4: naam in het controle-scherm van Producten plakken is bewerkbaar.
    // Eigen invoer zet de keuze automatisch op 'Nieuw product maken' en filtert supermarktnamen weg.
    if (t.getAttribute && t.getAttribute('data-pjn') != null && S.pj && S.pj.rows) {
      var ri2 = +t.getAttribute('data-pjn'), r2 = S.pj.rows[ri2]; if (!r2) return;
      var sn = stripSupermarkt(t.value.trim().slice(0, 80));
      if (sn !== r2.n) { r2.n = sn; if (r2.pid) { r2.pid = ''; r2.aliasAan = null; } }
    }
  });

  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t && t.id === 'isearch') { S.isq = t.value; var r = $('isres'); if (r && S._is) r.innerHTML = S._is(); }
  });

  // ---- v45b.10: gedeelde keuze bij ingrediënt/weekchip/"Product en prijs toevoegen"
  function cleanIngName(n) {
    return String(n || '').split(',')[0].replace(/\([^)]*\)/g, '').replace(/^\s*optioneel:\s*/i, '').trim();
  }
  function openChoice(opts) {
    S.choice = { name: opts.name, prod: opts.prod || null, ctx: opts.ctx || null, rid: opts.rid || null, idx: opts.idx != null ? opts.idx : null, slot: opts.slot || null, day: opts.day || null, entryId: opts.entryId || null };
    var ov = document.createElement('div');
    ov.className = 'choice-overlay'; ov.id = 'choiceov';
    ov.onclick = function (e) { if (e.target === ov) closeChoice(); };
    var pp = document.createElement('div');
    pp.className = 'choice-popup';
    pp.innerHTML = renderChoice();
    pushLayer(); S._chLayer = true; // v45d.1: terug sluit alleen deze popup
    ov.appendChild(pp);
    document.body.appendChild(ov);
    var si = pp.querySelector('.choice-search'); if (si) si.focus();
  }
  function closeChoice(fromPop) {
    var ov = document.getElementById('choiceov'); if (ov) ov.remove();
    S.choice = null;
    if (fromPop) { S._chLayer = false; return; }
    if (S._chLayer) { S._chLayer = false; S._skip = (S._skip || 0) + 1; try { history.back(); } catch (e) { S._skip--; } }
  }
  function renderChoice() { return '<button class="choice-x" data-act="choiceclose" aria-label="Sluiten">✕</button>' + renderChoiceInner(); }
  // v45d.6: bij elke voorgestelde productkeuze zien of het product meetelt in de calorieën
  function choiceUnit() {
    var c = S.choice; if (!c || c.idx == null) return null;
    var ing = null;
    if (c.ctx === 'rec' && c.rid != null) { var r = S.recipes.filter(function (x) { return String(x.id) === String(c.rid); })[0]; ing = r && r.ing[c.idx]; }
    else if (S.rec && S.rec.ing) ing = S.rec.ing[c.idx];
    return ing ? ing.u : null;
  }
  function choiceWaarsch(p) {
    var w = telWaarschuwing(p, choiceUnit());
    return w ? '<br><b>⚠ ' + esc(w.charAt(0).toUpperCase() + w.slice(1)) + '</b>' : '';
  }
  function renderChoiceInner() {
    var c = S.choice; if (!c) return '';
    var nm = c.name, ex = c.prod;
    // v48 Week-ronde: bij een blokje uit de week staat de dag + het moment erbij
    var ctxLine = '';
    if (c.ctx === 'week' && c.day) {
      var dp = String(c.day).split('-'), dd = new Date(+dp[0], +dp[1] - 1, +dp[2]);
      var slotT = '';
      if (c.entryId) { var ddx = dayDoc(c.day); var exx = (ddx.entries || []).filter(function (x) { return String(x.id) === String(c.entryId); })[0]; var mm = momentsFor(dd.getDay(), ddx).filter(function (m) { return exx && m.slot === exx.slot; })[0]; if (mm) slotT = mm.t; }
      ctxLine = '<p class="hint" style="margin:0 0 8px">Dit blokje komt uit je week: ' + esc(cap(DOW[dd.getDay()]) + ' ' + short(dd)) + (slotT ? ' \u00b7 ' + esc(slotT) : '') + '</p>';
    }
    var h = '<h3>' + esc(nm) + '</h3>' + ctxLine + '<div class="choice-list">';
    if (ex) {
      var cats0 = catsOf(ex), ci0 = cats0[0] || '';
      h += '<button class="choice-btn" data-act="choicego" data-p="' + ex.id + '">' +
        '<span class="ci">' + esc(catById(ci0) ? catById(ci0).i : '&#127959;') + '</span>' +
        '<span><span class="cn">Naar dit product in Producten</span><br><span class="cd">' + esc(ex.n) + (ex.inh ? ' · ' + esc(inhLabel(ex)) : '') + (ex.pr != null ? ' · ' + esc(eur(ex.pr)) : '') + choiceWaarsch(ex) + '</span></span></button>';
    } else {
      var best = findProd(nm);
      if (best) {
        var catsB = catsOf(best), ciB = catsB[0] || '';
        h += '<button class="choice-btn" data-act="choicego" data-p="' + best.id + '">' +
          '<span class="ci">' + esc(catById(ciB) ? catById(ciB).i : '&#127959;') + '</span>' +
          '<span><span class="cn">Bestaand product</span><br><span class="cd">' + esc(best.n) + (best.inh ? ' · ' + esc(inhLabel(best)) : '') + (best.pr != null ? ' · ' + esc(eur(best.pr)) : '') + choiceWaarsch(best) + '</span></span></button>';
      } else {
        h += '<button class="choice-btn" data-act="choicebest">' +
          '<span class="ci">&#127959;</span>' +
          '<span><span class="cn">Bestaand product</span><br><span class="cd">Zoek in je producten</span></span></button>';
      }
    }
    // v48 Week-ronde: de overige drie opties staan ingeklapt achter "Iets anders…"
    // (pas na een tik zichtbaar); het voorstel staat standaard bovenaan. "Toch niet" blijft altijd zichtbaar.
    h += '<details class="choice-more"><summary>Iets anders\u2026 (andere opties)</summary><div class="choice-more-in">';
    h += '<button class="choice-btn" data-act="choiceother"><span class="ci">&#128269;</span><span><span class="cn">Ander product</span></span></button>';
    if (c.ctx === 'rec' || c.ctx === 'week') h += '<button class="choice-btn" data-act="choicename"><span class="ci">&#9998;</span><span><span class="cn">Naam aanpassen</span></span></button>';
    h += '<button class="choice-btn new" data-act="chicenew"><span class="ci">&#128462;</span><span><span class="cn">Nieuw product maken</span></span></button>';
    h += '</div></details>';
    h += '</div>';
    h += '<div id="choicenamebox" hidden></div>';
    h += '<div id="choiceotherlist" hidden><button class="pill" style="width:100%;margin-bottom:8px" data-act="choiceback">&larr; Terug naar de keuzes</button><input class="choice-search" id="choicesearch" type="text" placeholder="Kies uit mijn producten…" autocomplete="off" aria-label="Zoek product"></div>';
    h += '<button class="pill" id="choicecancel" style="width:100%;margin-top:12px" data-act="choiceclose">Annuleren</button>';
    return h;
  }
  // v45c.1: bij "Ander product" verdwijnen de andere keuzes, zodat de lijst direct onder de titel staat
  // en niet buiten beeld valt op een telefoon.
  function choiceShowList(on) {
    var pop = document.querySelector('#choiceov .choice-popup'); if (!pop) return;
    var lst = pop.querySelector('.choice-list'), ol = document.getElementById('choiceotherlist'), nb = document.getElementById('choicenamebox');
    if (lst) lst.hidden = !!on; if (ol) ol.hidden = !on; if (nb) nb.hidden = true;
    pop.scrollTop = 0;
  }
  function renderChoiceOther(q) {
    q = normName(q || '');
    var toks = q ? q.split(' ').filter(Boolean) : [];
    function words(p) { return prodKeys(p).join(' ').split(' ').filter(Boolean); }
    var list = S.prijzen.filter(function (p) {
      if (!toks.length) return true;
      var ws = words(p);
      return toks.every(function (t, ti) { // v57: laatste woord mag op een beginstuk; voltooide woorden blijven hele woorden
        if (ti === toks.length - 1) return ws.some(function (w) { return w.indexOf(t) === 0; });
        return ws.indexOf(t) >= 0;
      });
    });
    if (toks.length) {
      var heel = function (p) { var ws = words(p); return toks.every(function (t) { return ws.indexOf(t) >= 0; }) ? 0 : 1; };
      list = list.map(function (p, i) { return { p: p, h: heel(p), i: i }; }).sort(function (a, b) { return a.h - b.h || a.i - b.i; }).map(function (x) { return x.p; });
    }
    list = list.slice(0, 30);
    var h = '';
    if (!list.length) h += '<p class="hint stat" style="margin:10px 0 4px">Geen producten gevonden.</p>';
    list.forEach(function (p) {
      var catsP = catsOf(p), ciP = catsP[0] || '';
      h += '<button class="mini-prod" data-act="choicego" data-p="' + p.id + '"><span>' + esc((catById(ciP) ? catById(ciP).i + ' ' : '') + p.n) + '</span><span class="mp">' + (p.inh ? esc(inhLabel(p)) : '') + (p.pr != null ? ' · ' + esc(eur(p.pr)) : '') + choiceWaarsch(p) + '</span></button>';
    });
    return h;
  }
  // v45b.10.1: naam van het ingrediënt of weekitem aanpassen vanuit de keuzepopup
  function choiceEntry() {
    var c = S.choice; if (!c) return null;
    if (c.ctx === 'rec' && c.rid != null && c.idx != null) {
      var r = S.recipes.filter(function (x) { return String(x.id) === String(c.rid); })[0];
      return r && r.ing[c.idx] ? { get: function () { return r.ing[c.idx].n; }, set: function (v) { r.ing[c.idx].n = v; persist(); renderRecipes(); } } : null;
    }
    if (c.ctx === 'week' && c.day && c.entryId) {
      var d = dayDoc(c.day), e = d.entries.filter(function (x) { return String(x.id) === String(c.entryId); })[0];
      return e ? { get: function () { return e.name; }, set: function (v) { e.name = v; saveDay(c.day); render(); } } : null;
    }
    return null;
  }
  function choiceNameOpen() {
    var en = choiceEntry(), box = document.getElementById('choicenamebox'); if (!en || !box) return;
    var cur = String(en.get() || ''), cm = cur.indexOf(','), head = cm >= 0 ? cur.slice(0, cm) : cur, rest = cm >= 0 ? cur.slice(cm) : '';
    var parts = head.split(/\s+of\s+/i).map(function (x) { return x.trim(); }).filter(Boolean);
    var h = '<button class="pill" style="width:100%;margin-bottom:8px" data-act="choiceback">&larr; Terug naar de keuzes</button>';
    if (parts.length > 1) {
      h += '<p class="hint" style="margin:10px 0 4px">Kies één:</p><div class="seg" style="margin:0 0 8px">' + parts.map(function (x) { var v = x.charAt(0).toUpperCase() + x.slice(1) + rest; return '<button class="pill" data-act="choicenamepart" data-v="' + esc(v) + '">' + esc(x.charAt(0).toUpperCase() + x.slice(1)) + '</button>'; }).join('') + '</div>';
    }
    h += '<input class="choice-search" id="choicenamein" type="text" maxlength="80" autocomplete="off" aria-label="Naam" value="' + esc(cur) + '"><button class="btn main" style="width:100%;margin-top:8px" data-act="choicenamesave">Bewaar naam</button>';
    box.innerHTML = h; box.hidden = false;
    var lst0 = document.querySelector('#choiceov .choice-list'); if (lst0) lst0.hidden = true; var ol0 = document.getElementById('choiceotherlist'); if (ol0) ol0.hidden = true;
    var inp = document.getElementById('choicenamein'); if (inp) inp.focus();
  }
  function choiceNameSave() {
    var en = choiceEntry(), inp = document.getElementById('choicenamein'); if (!en || !inp) return;
    var v = inp.value.trim().slice(0, 80); if (!v) { toast('Geef een naam'); return; }
    closeChoice(); en.set(v); toast('Naam aangepast');
  }
  function choiceGo(pid) {
    var c = S.choice; if (!c) return;
    closeChoice();
    var prod = prodById(pid); if (!prod) return;
    // v45b.10: koppelen in recept/entry als er context is
    if (c.ctx === 'rec' && c.rid != null && c.idx != null) {
      var r = S.recipes.filter(function (x) { return x.id === c.rid; })[0];
      if (r && r.ing[c.idx]) {
        r.ing[c.idx].p = null;
        var kp = prodKcPer(prod);
        if (kp != null) r.ing[c.idx].p = kp;
        // alias toevoegen als de naam nog niet bekend is
        if (!(prod.alias || []).some(function (a) { return normName(a) === normName(c.name); })) {
          prod.alias = prod.alias || []; prod.alias.push(c.name);
        }
        persist(); renderRecipes();
      }
    } else if (c.ctx === 'week' && c.day && c.entryId) {
      var d = dayDoc(c.day);
      var e = d.entries.filter(function (x) { return x.id === c.entryId; })[0];
      if (e) {
        var q = qtyFor({ a: amt(e.name) || 100, u: '' }, prod.u);
        e.pid = prod.id; e.amt = q != null ? q : (amt(e.name) || 100); e.u = prod.u;
        if (prod.u === 'g') { e.g = e.amt; if (prod.kc != null) e.p = prod.kc; } // v50.5 (1-kcal-bug): e.p is kcal per 100 g — prodKcPer gaf per gram (106 → 1,06 → "1")
        saveDay(c.day); renderSheet(false);
      }
    }
    // v46: doorklik = alles dicht, dit ene product open, en de kaart bovenaan in beeld
    S.prFrom = (c.ctx === 'week' && c.day) ? { pid: pid, day: c.day } : null;
    S.tab = 'prijs'; S.prSub = 'mijn'; S.prHighlight = pid; S.prq = ''; S.plab = []; S.prBl = true;
    Object.keys(S.recOpen || {}).forEach(function (k) { if (/^(pr|pc|pg|lb):/.test(k)) delete S.recOpen[k]; });
    S.pcClosed = {};
    render(); window.scrollTo(0, 0);
    setTimeout(function () {
      document.querySelectorAll('#prijsview details.prod2, #prijsview details.pcat, #prijsview details.pgrp').forEach(function (d) { d.open = false; });
      var el2 = document.querySelector('[data-rk="pr:' + pid + ':' + catsOf(prod)[0] + '"]') || document.querySelector('[data-rk^="pr:' + pid + ':"]');
      function opens(e) { for (var q = e && e.parentElement; q; q = q.parentElement) if (q.tagName === 'DETAILS' && !q.open) q.open = true; }
      if (el2) { opens(el2); el2.open = true; el2.classList.add('highlight'); el2.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      setTimeout(function () {
        document.querySelectorAll('.prod2.highlight').forEach(function (x) { x.classList.remove('highlight'); });
        S.prHighlight = null;
      }, 3000);
    }, 80);
  }
  function choiceNew() {
    var c = S.choice; if (!c) return;
    closeChoice();
    var nm = cleanIngName(c.name);
    prodOpen(null, { n: nm || c.name });
    toast('Nieuw product: ' + (nm || c.name));
    if (!findProd(nm || c.name)) prodAutoZoek(); // 10 nov: nieuwe naam -> automatisch opzoeken (plank -> OFF -> Checkjebon -> Mistral)
  }
  async function prodAutoZoek() { // 10 nov: auto-opzoek in het productformulier; lege velden worden aangevuld, eigen/lege blijven leidend
    var P = S.prod; if (!P || P.id || !String(P.n || '').trim() || P._busy) return;
    if (findProd(P.n)) return;
    P._busy = true; renderProd(false);
    try {
      var r = await opzoekRoute(P.n);
      if (!S.prod) return;
      if (r.kcal100 != null && (S.prod.kc == null || S.prod.kc === '')) S.prod.kc = String(Math.round(r.kcal100)).replace('.', ',');
      if (r.w) Object.keys(r.w).forEach(function (k) { if (r.w[k] != null && (S.prod.w[k] == null || S.prod.w[k] === '')) S.prod.w[k] = r.w[k]; });
      if (r.prijs != null && (S.prod.pr == null || S.prod.pr === '')) S.prod.pr = String(r.prijs).replace('.', ',');
      S.prod.opgezocht = r.opgezocht; S.prod.bron = r.bron || ''; S.prod._keuze = r.keuze || ''; S.prod._prijsBron = r.prijsBron || ''; // v51.13: prijs-bron op productpagina
    } catch (e) { /* stil falen: velden blijven leeg/bewerkbaar */ }
    if (S.prod) { S.prod._busy = false; renderProd(false); }
  }

  // ---- product bewerken
  function prodOpen(p, pre) {
    var b = p ? { id: p.id, sw: p.sw || null, n: p.n, u: p.u, inh: p.inh == null ? '' : String(p.lit && p.u === 'ml' ? Math.round(p.inh) / 1000 : (p.kilo && p.u === 'g' ? Math.round(p.inh / 1000 * 1000) / 1000 : p.inh)).replace('.', ','), lit: !!(p.lit && p.u === 'ml'), kilo: !!(p.kilo && p.u === 'g'), pr: p.pr == null ? '' : p2(p.pr), bon: p.bon == null ? '' : p2(p.bon), alias: (p.alias || []).join(', '), w: {}, foto: p.foto || '', kc: p.kc == null ? '' : String(p.kc).replace('.', ','), sg: p.sg == null ? '' : String(p.sg).replace('.', ','), kst: p.kst == null ? '' : String(p.kst).replace('.', ','), eh: p.eh || '', la: p.la == null ? null : p.la, cat: (p.cat || []).slice(), lab: (p.lab || []).slice(), labx: (p.labx || []).slice(), direct: !!p.direct, bonTot: p.bonTot == null ? null : p.bonTot, over: {}, overVinkt: {} }
      : { id: null, sw: null, n: (pre && pre.n) || '', u: (pre && pre.u) || 'g', lit: false, kilo: !!(pre && pre.kilo), inh: '', pr: '', bon: '', alias: '', w: {}, foto: '', kc: '', sg: '', kst: '', eh: '', la: null, cat: [], lab: [], labx: [], direct: false, bonTot: null, over: {}, overVinkt: {}, aantal: '', aantalWoord: '' }; // v47.3: kilo-vlag
    W_FIELDS.forEach(function (f) { var v = p && p.w ? p.w[f[0]] : null; b.w[f[0]] = v == null ? '' : String(v).replace('.', ','); });
    b.puur = p ? (p.puur || null) : null; // v47.4.5: puur-natuurkeuze meenemen naar het formulier
    Object.keys(HUISMATEN).forEach(function (k) { b['hm_' + k] = (p && p.hm && p.hm[k] != null) ? String(p.hm[k]).replace('.', ',') : ''; }); b.bron = p && p.bron ? p.bron : ''; // v55.0 (12 nov): huismaten + bronlabel in het formulier
    if (p) { b.aantal = p.aantal != null ? String(p.aantal).replace('.', ',') : ''; b.aantalWoord = p.aantalWoord || ''; } // v48.2
    S.prod = b; S.prodMeer = false; S.cpk = {}; S.prodKc = false; etikFiles = []; pushLayer(); document.documentElement.classList.add('lock'); $('prodsheet').hidden = false; renderProd(true);
  }
  // v46: categorie kiezen in twee stappen achter één optionele knop (productformulier, scanner, week-ingrediënt, vrij toevoegen):
  // eerst de zes hoofdgroepen, dan pas de categorieën met aantallen. Zelf kiezen blijft per plek zoals het was (chipAct + chipAttrs).
  var CPW = {};
  function cpState(id) { S.cpk = S.cpk || {}; return S.cpk[id] || (S.cpk[id] = { o: false, g: null }); }
  function cpInner(id) {
    var w = CPW[id]; if (!w) return '';
    var sel = (w.sel() || []), st = cpState(id), selC = sel.map(catById).filter(Boolean);
    var h = '<div class="seg mvact"><button class="pill" data-act="cpopen" data-k="' + esc(id) + '" aria-pressed="' + st.o + '">' + (st.o ? 'Categorie sluiten' : (selC.length ? 'Categorie: ' + esc(selC.map(function (c) { return c.n; }).join(', ')) : 'Categorie kiezen (optioneel)')) + '</button></div>';
    if (!st.o) return h;
    h += '<p class="hint" style="margin-top:0">Kies maximaal 3.' + (w.hint || '') + '</p><div class="chiprow">' + GROEPEN.map(function (g) {
      var n = groepCats(g).filter(function (cid) { return sel.indexOf(cid) >= 0; }).length;
      return '<button class="pill" data-act="cpgrp" data-k="' + esc(id) + '" data-v="' + g.id + '" aria-pressed="' + (st.g === g.id) + '">' + g.i + ' ' + esc(g.n) + (n ? ' · ' + n + ' gekozen' : '') + '</button>';
    }).join('') + '</div>';
    var gr = GROEPEN.filter(function (g) { return g.id === st.g; })[0];
    if (gr) h += '<div class="chiprow" style="margin-top:8px">' + groepCats(gr).map(catById).filter(Boolean).map(function (c) {
      var cnt = S.prijzen.filter(function (p) { return catsOf(p).indexOf(c.id) >= 0; }).length;
      return '<button class="fchip" data-act="' + w.act + '" ' + (w.attrs || '') + ' data-v="' + c.id + '" aria-pressed="' + (sel.indexOf(c.id) >= 0) + '">' + c.i + ' ' + esc(c.n) + ' (' + cnt + ')</button>';
    }).join('') + '</div>';
    return h;
  }
  function catWidget(id, getSel, chipAct, chipAttrs, hint) { CPW[id] = { sel: getSel, act: chipAct, attrs: chipAttrs, hint: hint }; return '<div class="cpw" id="cpw-' + esc(id) + '">' + cpInner(id) + '</div>'; }
  function cpRefresh(id) { var e = $('cpw-' + id); if (e) e.innerHTML = cpInner(id); }
  // v46: het ingevulde formulier als 'scan-achtig' object, zodat Vervangen overal dezelfde regels gebruikt (scVervang)
  function prodFormItem(P) {
    function pn(v) { var x = num(String(v == null ? '' : v).replace('€', '')); return x != null && x >= 0 ? x : null; }
    var inh = pn(P.inh); if (inh != null && inh <= 0) inh = null; if (inh != null && P.lit && P.u === 'ml') inh = Math.round(inh * 1000 * 1000) / 1000; if (inh != null && P.kilo && P.u === 'g') inh = Math.round(inh * 1000 * 1000) / 1000; // v47.3: kilo × 1000 → gram
    var w = {}; W_FIELDS.forEach(function (f) { var v = pn(P.w && P.w[f[0]]); if (v != null) w[f[0]] = v; });
    return { n: String(P.n || '').trim().slice(0, 80), inh: inh, u: P.u, pr: pn(P.pr), bon: pn(P.bon), kc: pn(P.kc), w: w };
  }
  function renderProd(fresh) {
    var P = S.prod; if (!P) return;
    var prtt = P.id ? 'Product bewerken' : 'Nieuw product';
    if (S.scFormQ && S.scFormTotaal) prtt = 'Nieuw product (' + (S.scFormTotaal - S.scFormQ.length) + ' van ' + S.scFormTotaal + ')'; // v46.1: canvas-titel "Nieuw product (X van Y)"
    $('prt').textContent = prtt;
    var body = $('prodbody'), keep = fresh ? 0 : body.scrollTop;
    var actEl = document.activeElement, actKey = actEl && actEl.getAttribute ? (actEl.getAttribute('data-pf') || actEl.getAttribute('data-pw') || '') : ''; // v51: focus behouden bij live re-render
    S.prodSec = S.prodSec || {};
    // v1744 (rustige vorm, net als Recept bewerken): alles in dichte secties; één sectie tegelijk open
    function sec(key, titel, binnen, forceOpen) {
      return '<details class="grp prodsec" data-sec="' + key + '" style="margin-top:10px"' + ((forceOpen || S.prodSec[key]) ? ' open' : '') + '><summary><span>' + titel + '</span></summary><div style="padding:0 4px 10px">' + binnen + '</div></details>';
    }
    var h = ''; // keuring 8 nov: knop "Lees etiket" eruit — waarden komen vanzelf uit Open Food Facts / Checkjebon
    if (P.msg) h += '<div class="pricebox" style="margin-top:8px;white-space:pre-line">' + esc(P.msg) + '</div>';
    if (P.kies && P.kies.length > 1) h += kiesHtml(P.kies, 'prod', 0);
    var naamH = '<input class="note" data-pf="n" type="text" maxlength="80" autocomplete="off" placeholder="Bijvoorbeeld: Cottage cheese" value="' + esc(P.n) + '" aria-label="Naam van het product">';
    if (!P.id && P.kopCands && P.kopCands.length) {
      var kd = function (val, titel, sub) { return '<label class="vink"><input type="radio" name="pkn" data-pkn="1" value="' + esc(val) + '"' + (P.kopKeuze === val ? ' checked' : '') + '> <span>' + titel + (sub ? '<br><span class="hint" style="margin:0;font-weight:400">' + sub + '</span>' : '') + '</span></label>'; };
      naamH += '<div class="rcard" style="padding:10px 12px;margin-top:8px"><b>Lijkt op een product dat je al hebt</b><p class="hint" style="margin:2px 0 6px">Kies wat je wilt en tik daarna op Opslaan.</p>' +
        P.kopCands.map(function (cid) {
          var cp = prodById(cid); if (!cp) return '';
          return kd('p:' + cid, 'Bijwerken: <b>' + esc(cp.n) + '</b>', 'Dezelfde: de naam komt erbij als bijnaam en lege velden worden aangevuld. Wat al staat blijft staan.') +
            kd('v:' + cid, 'Vervangen: <b>' + esc(cp.n) + '</b> wordt <b>' + esc(P.n) + '</b>', 'Naam, inhoud, prijs en voedingswaarden worden die van dit formulier. De oude naam blijft herkend.') +
            (P.kopKeuze === 'v:' + cid ? scVervangTekst(cp, prodFormItem(P)) : '');
        }).join('') +
        kd('nieuw', 'Nieuw product, apart houden', esc(P.n)) + '</div>';
    }
    h += '<h3>Naam</h3>' + naamH; // v1744: naam staat los bovenaan, niet in een dichte sectie
    // wens 10 nov: kenmerken direct zichtbaar in het formulier (Nieuw én Bewerken)
    h += '<div class="seg mvact" style="margin:10px 0">' + [['thuis', '🏠', 'In huis'], ['direct', '🍽', 'Direct eetbaar'], ['kruid', '🌿', 'Kruid (0 kcal)']].map(function (k) {
      return '<button class="pill" type="button" data-act="pftoggle" data-k="' + k[0] + '" aria-pressed="' + (!!P[k[0]]) + '">' + (P[k[0]] ? '✓ ' : '') + k[1] + ' ' + k[2] + '</button>';
    }).join('') + '</div>';
    var catH = catWidget('prod', function () { return P.cat; }, 'pcat', '', ' Niets gekozen? Dan kiest de app er één uit de naam.');
    h += catH; // v1744: categorie staat los onder Naam (nieuw én bewerken; de widget heeft zelf al een label)
    h += '<p class="hint zz" style="margin:10px 0 4px">Zoekt actuele prijs en voedingswaarden op. Wat al ingevuld staat, blijft staan.</p>';
    h += '<div style="margin:0 0 4px"><button type="button" class="btn main" style="width:100%;font-weight:700;min-height:44px" data-act="livecheckform">🔍 Check live prijs & etiket</button></div>'; // v51: live check bovenaan, bij nieuw én bewerken
    h += '<p class="hint" style="margin:4px 0 0">Via NEVO, Open Food Facts, Checkjebon en web search. Alleen lege velden worden aangevuld, met markering "opgezocht" of "geschat". Niets gevonden? Alles blijft zoals het was.</p>';
    var verpH = '<div class="seg mvact" style="margin-top:0">' + [['g', 'gram'], ['ml', 'milliliter'], ['l', 'liter'], ['stuk', 'stuks'], ['kg', 'kilo']].map(function (u) { // v47.3: kilo als vijfde pill
      var on = u[0] === 'l' ? (P.u === 'ml' && !!P.lit) : u[0] === 'kg' ? (P.u === 'g' && !!P.kilo) : u[0] === 'ml' ? (P.u === 'ml' && !P.lit) : P.u === u[0];
      return '<button class="pill" data-act="produnit" data-v="' + u[0] + '" aria-pressed="' + on + '">' + u[1] + '</button>';
    }).join('') + '</div><input class="note" data-pf="inh" type="text" inputmode="decimal" autocomplete="off" style="margin-top:8px" placeholder="' + (P.kilo ? 'Hoeveel kilo zit erin? Bijvoorbeeld 1' : P.lit ? 'Hoeveel liter zit erin? Bijvoorbeeld 1,5' : 'Hoeveel zit erin? Bijvoorbeeld 200') + '" value="' + esc(P.inh) + '" aria-label="Inhoud van de verpakking">';
    if (P.u === 'stuk') verpH += '<p class="hint" style="margin:10px 0 4px">Hoe noem je dit stuk? (hoeft niet)</p><div class="chiprow"><button class="fchip" data-act="prodsw" data-v="" aria-pressed="' + !P.sw + '">stuks</button>' + STUKWOORDEN.map(function (x) { return '<button class="fchip" data-act="prodsw" data-v="' + x[0] + '" aria-pressed="' + (P.sw === x[0]) + '">' + x[0] + '</button>'; }).join('') + '</div>';
    h += sec('verpakking', 'Verpakking', verpH, false);
    // v48.2: optioneel blok "Aantal per verpakking" — standaard dicht, alleen open na een tik; leeg laten mag
    var antlOpen = !!S.prodAantal || (P.aantal != null && P.aantal !== '') || !!P.aantalWoord;
    var antlH = '<div class="seg mvact" style="margin-top:0"><button class="pill" data-act="prodaantal" aria-pressed="' + antlOpen + '">🫧 ' + (antlOpen ? 'Verberg aantal per verpakking' : 'Vul in hoeveel stuks/plakjes erin zitten') + '</button></div>';
    if (antlOpen) {
      antlH += '<div class="grid2" style="margin-top:8px"><div><label class="hint" style="margin:0 0 4px;display:block">Aantal stuks</label><input class="note" data-pf="aantal" type="text" inputmode="decimal" autocomplete="off" placeholder="Bijvoorbeeld 11" value="' + esc(P.aantal) + '" aria-label="Aantal stuks per verpakking"></div>' +
        '<div><label class="hint" style="margin:0 0 4px;display:block">Eigen woord</label><input class="note" data-pf="aantalWoord" type="text" maxlength="30" autocomplete="off" placeholder="plakjes, rijstwafels, koeken…" value="' + esc(P.aantalWoord) + '" aria-label="Woord voor één stuk"></div></div>';
      var antlCalc = antalCalc(P);
      if (antlCalc) antlH += '<div class="pricebox" style="margin-top:8px">' + esc(antlCalc) + '</div>';
    }
    h += sec('aantal', 'Aantal per verpakking (optioneel)', antlH, false);
    var prijsH = '<div class="grid2"><div><label class="hint" style="margin:0 0 4px;display:block">Prijs</label><input class="note" data-pf="pr" type="text" inputmode="decimal" autocomplete="off" placeholder="Bijvoorbeeld 2,99" value="' + esc(P.pr) + '" aria-label="Prijs"></div>' +
      '<div><label class="hint" style="margin:0 0 4px;display:block">Bonusprijs (leeg = geen)</label><input class="note" data-pf="bon" type="text" inputmode="decimal" autocomplete="off" placeholder="Bijvoorbeeld 2,49" value="' + esc(P.bon) + '" aria-label="Bonusprijs"></div></div>' +
      '<label class="vink" style="margin-top:8px"><input type="checkbox" data-pf="direct"' + (P.direct ? ' checked' : '') + '> Direct eetbaar (snelle snack, zonder koken)</label>' +
      '<label class="hint" style="margin:10px 0 4px;display:block" for="pfbontot">Bonus tot en met (hoeft niet)</label><input class="note" id="pfbontot" data-pf="bonTot" type="date" value="' + esc(bonDatumVal(P.bonTot)) + '" aria-label="Bonus tot en met"><p class="hint zz" style="margin-top:4px">Leeg = geen einddatum: de bonus blijft staan tot je zelf een datum kiest.</p>';
    h += sec('prijs', 'Prijs per verpakking' + (P._prijsBron ? ' — ' + esc(P._prijsBron) : ''), prijsH, false);
    // v45c.5 + v1744: de rest in één dichte sectie 'Meer opties' (categorie bij nieuw product hoort daar ook bij)
    var meerH = '<p class="hint" style="margin-top:0">Gewicht per stuk (hoeft niet): weegt één stuk een vast aantal gram, bijvoorbeeld 1 wafel = 25 g? Vul dat hier in. Dan kun je dit product bij Week ook in stuks kiezen.</p><input class="note" data-pf="sg" type="text" inputmode="decimal" autocomplete="off" placeholder="Bijvoorbeeld 25" value="' + esc(P.sg) + '" aria-label="Gewicht van één stuk in gram">';
    meerH += '<h3 style="margin-top:12px">Huismaten (hoeft niet)</h3><p class="hint" style="margin-top:0">Standaard: snee 40 g, plakje 20 g, eetlepel 15 g, handje 30 g, bakje 150 g, bol 60 g. Vul je per huismaat een eigen gewicht in (bijvoorbeeld 1 wafel = 25 g bij bol), dan wint dat áltijd van de standaard. Leeg = standaard. Calorieën rekenen via grammen: kcal per 100 g × gram ÷ 100.</p><div class="grid2">' +
      Object.keys(HUISMATEN).map(function (k) { return '<div><label class="hint" style="margin:0 0 4px;display:block">1 ' + esc(k) + ' (standaard ' + HUISMATEN[k] + ' g)</label><input class="note" data-pf="hm_' + k + '" type="text" inputmode="decimal" autocomplete="off" placeholder="Bijvoorbeeld ' + (k === 'snee' ? '40' : '') + '" value="' + esc(P['hm_' + k] || '') + '" aria-label="Eigen gewicht van 1 ' + esc(k) + ' in gram"></div>'; }).join('') + '</div>';
    meerH += '<h3 style="margin-top:12px">Herkennen bij recepten (hoeft niet)</h3><p class="hint" style="margin-top:0">Andere namen waaronder dit product in een recept staat, gescheiden door komma’s.</p><input class="note" data-pf="alias" type="text" maxlength="200" autocomplete="off" placeholder="Bijvoorbeeld: kwark Bayernkrone" value="' + esc(P.alias) + '" aria-label="Andere namen">';
    var voedingH = '<p class="hint" style="margin-top:0">De app zoekt de waarden vanzelf op (NEVO, Open Food Facts, Checkjebon) en vult ze stil in — je kunt ze hieronder zelf aanpassen. De app vergelijkt ze met je richtlijnen.</p>' + (P.bron ? '<p class="hint zz" style="margin:0 0 6px;font-weight:700">Bron van de waarden: (' + esc(P.bron) + ')</p>' : '') + '<div class="grid2">' +
      W_FIELDS.map(function (f) { return '<div><label class="hint" style="margin:0 0 4px;display:block">' + esc(f[1]) + ' (g)</label><input class="note' + wnCls(f[0], P.w[f[0]]) + '" data-pw="' + f[0] + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(P.w[f[0]]) + '" aria-label="' + esc(f[1]) + ' per 100 gram"></div>'; }).join('') + '</div>';
    voedingH += '<div class="seg mvact" style="margin-top:10px"><button class="pill" data-act="prodkc" aria-pressed="' + (!!S.prodKc) + '">' + (S.prodKc ? 'Verberg calorieën' : 'Toon calorieën') + '</button></div>';
    if (S.prodKc) voedingH += '<label class="hint" style="margin:6px 0 4px;display:block">Calorieën (kcal) per 100 g of 100 ml</label><input class="note" data-pf="kc" type="text" inputmode="decimal" autocomplete="off" placeholder="Bijvoorbeeld 230" value="' + esc(P.kc) + '" aria-label="Kilocalorieën per 100 gram">' +
      '<label class="hint" style="margin:10px 0 4px;display:block">Calorieën per stuk (alleen als je het gewicht per stuk niet weet)</label><input class="note" data-pf="kst" type="text" inputmode="decimal" autocomplete="off" placeholder="Bijvoorbeeld 90" value="' + esc(P.kst) + '" aria-label="Kilocalorieën per stuk">';
    h += sec('voeding', 'Voedingswaarden per 100 g of 100 ml (hoeft niet)', voedingH, false);
    meerH += '<h3 style="margin-top:12px">Labels</h3><div class="chiprow" id="plabs">' + labChips(P) + '</div><p class="hint" style="margin-top:0">Eiwitrijk (eiwit 6 g of meer), Veel vezels (3 g of meer), Weinig suiker (5 g of minder), Weinig zout (1,2 g of minder) en Weinig verz. vet (3 g of minder) stelt de app voor als je de etiketwaarden hierboven invult. Jij beslist: tik om een label aan of uit te zetten. Diepvries en Makkelijk kies je zelf. Het zijn alleen zoekhulpjes.</p>';
    h += sec('meer', 'Meer opties (hoeft niet)', meerH, false);
    var ov = P.over || {}, ovKeys = []; // keuring 8 nov: "neem over"-blok hoorde bij Lees etiket (eruit)
    if (ovKeys.length) {
      var wLab = {}; W_FIELDS.forEach(function (f) { wLab['w_' + f[0]] = f[1]; });
      h += '<h3>Al door jou ingevuld — neem over?</h3><p class="hint" style="margin-top:0">De foto las andere waarden dan jij had ingevuld. Jouw waarden blijven staan, tenzij je hieronder aanvinkt.</p>';
      ovKeys.forEach(function (k) {
        var lbl;
        if (k === 'pr') lbl = 'prijs ' + eur(ov.pr) + ' (jij had ' + P.pr + ')';
        else if (k === 'bon') lbl = 'bonusprijs ' + eur(ov.bon) + ' (jij had ' + P.bon + ')';
        else if (k === 'inh') lbl = 'inhoud ' + fmtN(ov.inh) + ' ' + (P.u || 'g') + ' (jij had ' + P.inh + ' ' + (P.u || 'g') + ')';
        else if (k === 'kc') lbl = 'calorieën ' + Math.round(ov.kc) + ' kcal (jij had ' + P.kc + ')';
        else if (wLab[k]) lbl = wLab[k].toLowerCase() + ' ' + fmtN(ov[k]) + ' g (jij had ' + P.w[k.slice(2)] + ' g)';
        else lbl = k;
        h += '<label class="vink over"><input type="checkbox" data-pov="' + k + '"' + (P.overVinkt && P.overVinkt[k] ? ' checked' : '') + '> Neem deze over: ' + esc(lbl) + '</label>';
      });
    }
    body.innerHTML = h; body.scrollTop = keep;
    if (actKey) { var el2 = body.querySelector('[data-pf="' + actKey + '"], [data-pw="' + actKey + '"]'); if (el2) el2.focus({ preventScroll: true }); } // v51: focus herstellen
  }
  // v1744: in het productformulier maar één sectie tegelijk open; stand wordt onthouden
  document.addEventListener('toggle', function (ev) {
    var t = ev.target;
    if (!t || !t.classList || !t.classList.contains('prodsec')) return;
    S.prodSec = S.prodSec || {};
    S.prodSec[t.getAttribute('data-sec')] = !!t.open;
    if (t.open) document.querySelectorAll('#prodbody details.prodsec').forEach(function (d) { if (d !== t) d.open = false; });
  }, true);
  function prodSave() {
    var P = S.prod; if (!P) return false;
    var n = String(P.n || '').trim().slice(0, 80);
    if (!n) { toast('Geef het product een naam'); return false; }
    function pnum(v) { var x = num(String(v == null ? '' : v).replace('€', '')); return x != null && x >= 0 ? x : null; }

    var idx0 = -1; (S.prijzen || []).forEach(function (x, i) { if (P.id && x.id === P.id) idx0 = i; });
    var oldv = idx0 >= 0 ? S.prijzen[idx0] : null; // v57.5: bestaand product al vóór de rec-bouw pakken (oude waarden bij ongeldige invoer)
    var badVelden = [];
    function pnumKeep(v, label, oldVal, noZero) { // v57.5: ongeldige invoer -> melden + oude waarde houden (nooit stille wissing)
      var t = String(v == null ? '' : v).trim().replace('\u20ac', '');
      if (t === '') return null;
      var x = num(t);
      if (x == null || x < 0 || (noZero && x === 0)) { if (badVelden.indexOf(label) < 0) badVelden.push(label); return oldVal != null ? oldVal : null; }
      return x;
    }    var inh = pnumKeep(P.inh, 'inhoud', oldv ? oldv.inh : null, true); if (inh != null && P.lit && P.u === 'ml') inh = Math.round(inh * 1000 * 1000) / 1000; if (inh != null && P.kilo && P.u === 'g') inh = Math.round(inh * 1000 * 1000) / 1000; // v47.3: kilo × 1000 → gram
    var dup = S.prijzen.some(function (x) { return x.id !== P.id && normName(x.n) === normName(n); });
    if (dup && (P.id || P.kopKeuze === 'nieuw')) { toast('Er is al een product met precies de naam "' + n + '". Geef het een andere naam.'); return false; }
    // v45d.3: nieuw product dat lijkt op een product dat je al hebt: eerst zelf kiezen
    if (!P.id) {
      if (!P.kopKeuze) {
        var kc0 = S.prijzen.filter(function (p) { return normName(p.n) === normName(n) || bijnaDezelfde(p.n, n); }).slice(0, 3);
        if (kc0.length) { P.kopCands = kc0.map(function (p) { return p.id; }); renderProd(true); toast('Lijkt op een product dat je al hebt. Kies wat je wilt'); return false; }
      } else if (P.kopKeuze.indexOf('v:') === 0) {
        var tv = prodById(P.kopKeuze.slice(2));
        if (tv) {
          if (S.prijzen.some(function (p) { return p.id !== tv.id && normName(p.n) === normName(n); })) { toast('Er is al een ander product met de naam "' + n + '". Geef het een andere naam.'); return false; }
          var it = prodFormItem(P), snapV = JSON.stringify(S.prijzen);
          scVervang(tv, it);
          var pq = function (v) { var x = num(String(v == null ? '' : v).replace('€', '')); return x != null && x >= 0 ? x : null; };
          if (pq(P.kst) != null) tv.kst = pq(P.kst); if (pq(P.sg) > 0) tv.sg = pq(P.sg);
          if (P.foto) tv.foto = P.foto;
          if (P.cat && P.cat.length) tv.cat = P.cat.slice(0, 3);
          if (it.bon != null && P.bonTot) tv.bonTot = P.bonTot;
          if (!tryStore()) { S.prijzen = JSON.parse(snapV); toast('Opslaan lukt niet'); return false; }
          S.status = 'ok'; toast('Vervangen: ' + tv.n); return true;
        }
      } else if (P.kopKeuze.indexOf('p:') === 0) {
        var tg = prodById(P.kopKeuze.slice(2));
        if (tg) {
          if (prodKeys(tg).indexOf(normName(n)) < 0 && (tg.alias || []).length < 10) tg.alias = (tg.alias || []).concat([n]);
          var pn2 = function (v) { var x = num(String(v == null ? '' : v).replace('€', '')); return x != null && x >= 0 ? x : null; };
          if (tg.pr == null && pn2(P.pr) != null) tg.pr = pn2(P.pr);
          if (!tg.inh && pn2(P.inh) > 0) { tg.inh = P.lit && P.u === 'ml' ? pn2(P.inh) * 1000 : pn2(P.inh); tg.u = P.u; }
          if (tg.kc == null && pn2(P.kc) != null) tg.kc = pn2(P.kc);
          if (!tryStore()) { toast('Opslaan lukt niet'); return false; }
          S.status = 'ok'; toast('Gekoppeld aan ' + tg.n); return true;
        }
      }
    }
    var sgV = pnumKeep(P.sg, 'gewicht per stuk', oldv ? oldv.sg : null, true); var aa = pnumKeep(P.aantal, 'aantal', oldv ? oldv.aantal : null, true);
    var w = {}; W_FIELDS.forEach(function (f) { var v = pnumKeep(P.w[f[0]], 'etiket ' + f[1], oldv && oldv.w ? oldv.w[f[0]] : null, false); if (v != null) w[f[0]] = v; });
    var bonNow = pnumKeep(P.bon, 'bonusprijs', oldv ? oldv.bon : null, false);
    var rec = { id: P.id || uid(), sw: P.u === 'stuk' ? stukWoordKey(P.sw) : null, n: n, u: (!P.id && inh == null) ? '' : P.u, gemaakt: P.id ? (P.gemaakt || null) : vandaagId(), // v47.4: aanmaak-datum alleen bij nieuwe producten
      lit: !!(P.lit && P.u === 'ml'), kilo: !!(P.kilo && P.u === 'g'), inh: inh, pr: pnumKeep(P.pr, 'prijs', oldv ? oldv.pr : null, false), bon: bonNow, direct: !!P.direct, bonTot: (P.bonTot && bonNow != null) ? P.bonTot : null, // v47.3.2: nieuw zonder inhoud = geen eenheid; v57: direct + bonTot stonden in een weggecommentarieerde regel en gingen verloren bij opslaan
      alias: String(P.alias || '').split(',').map(function (a) { return a.trim().slice(0, 80); }).filter(Boolean).slice(0, 10), w: w, kc: pnumKeep(P.kc, 'calorieën', oldv ? oldv.kc : null, false), sg: sgV, kst: pnumKeep(P.kst, 'kcal per stuk', oldv ? oldv.kst : null, false), eh: P.eh || '', la: P.la || null, foto: P.foto || '', puur: P.puur || null, // v47.4.5: puur-natuurkeuze bewaren
      hm: (function () { var o = {}; Object.keys(HUISMATEN).forEach(function (k) { var v = pnum(P['hm_' + k]); if (v != null && v > 0) o[k] = v; }); return Object.keys(o).length ? o : null; })(), // v55.0 (12 nov): huismaten-gramgewichten
      bron: (String(P.bron || '').trim().slice(0, 40)) || '', // v55.0 (12 nov): bronlabel (behouden via oldv hieronder)
      prijsBron: (String(P._prijsBron || '').trim().slice(0, 60)) || '', // v55.2 (13 nov) PUNT 7b: supermarkt bij de prijs
      aantal: aa, aantalWoord: String(P.aantalWoord || '').trim().slice(0, 30) || null, // v48.2: aantal per verpakking
      cat: (P.cat && P.cat.length) ? P.cat.slice(0, 3) : guessCats(n), lab: (P.lab || []).slice(), labx: (P.labx || []).filter(function (x) { return autoLabs(w).indexOf(x) >= 0; }) };
    var ovk = P.overVinkt || {}, ov = P.over || {};
    if (ovk.pr && ov.pr != null) rec.pr = ov.pr;
    if (ovk.bon && ov.bon != null) rec.bon = ov.bon;
    if (ovk.inh && ov.inh != null) rec.inh = ov.inh;
    if (ovk.kc && ov.kc != null) rec.kc = ov.kc;
    W_FIELDS.forEach(function (f) { if (ovk['w_' + f[0]] && ov['w_' + f[0]] != null) w[f[0]] = ov['w_' + f[0]]; });
    var idx = idx0; // v57.5: idx/oldv staan al bovenaan (vóór de rec-bouw)
    if (!rec.prijsBron && oldv) rec.prijsBron = oldv.prijsBron || ''; // v55.2 (13 nov) PUNT 7b
    if (!rec.bron && oldv) rec.bron = oldv.bron || ''; // bronlabel behouden bij bewerken
    rec.thuis = !!(oldv && oldv.thuis);
    if (idx >= 0) S.prijzen[idx] = rec; else S.prijzen.push(rec);
    if (!tryStore()) {
      if (rec.foto) { rec.foto = ''; if (tryStore()) { S.status = 'ok'; toast('De foto past niet meer in het geheugen van de app. Product bewaard zonder foto.'); return true; } }
      if (idx >= 0) S.prijzen[idx] = oldv; else S.prijzen.pop();
      toast('Opslaan lukt niet'); return false;
    }
    S.status = 'ok';
    if (badVelden.length) toast('Ongeldige invoer bij ' + badVelden.join(', ') + ' — de oude waarde blijft staan. Verder wel bewaard.'); // v57.5: nooit stille wissing
    else if (oldv && oldv.pr != null && rec.pr != null && rec.pr > oldv.pr) toast('Product bewaard. Let op: de prijs is gestegen, van ' + eur(oldv.pr) + ' naar ' + eur(rec.pr) + '.');
    else toast('Product bewaard');
    if (!oldv) prodOpzoekNaSave(rec); // keuring 8 nov: nieuw product = naam intypen, opslaan, klaar — de rest wordt opgezocht
    return true;
  }
  // keuring 8 nov (deel 2): na opslaan van een nieuw product lege waardes automatisch opzoeken via dezelfde route
  async function prodOpzoekNaSave(rec) {
    try {
      var res = await opzoekRoute(rec.n);
      if (!S.prod || S.prod.id !== rec.id) return;
      var P = S.prod;
      if (res.kcal100 != null && (P.kc == null || String(P.kc).trim() === '')) P.kc = res.kcal100;
      if (res.w) { P.w = P.w || {}; W_FIELDS.forEach(function (f) { if (res.w[f[0]] != null && (P.w[f[0]] == null || String(P.w[f[0]]).trim() === '')) P.w[f[0]] = res.w[f[0]]; }); }
      if (res.prijs != null && (P.pr == null || String(P.pr).trim() === '')) P.pr = res.prijs;
      if (res.keuze) P.msg = 'Opgezocht na opslaan — gevonden: ' + res.keuze + (res.bron ? ' (' + res.bron + ')' : '');
      if (res.kandidaten && res.kandidaten.length > 1) P.kies = res.kandidaten; else P.kies = null;
      renderProd();
    } catch (e) { /* stilletjes mislukt: lege velden blijven gewoon bewerkbaar */ }
  }
  function forceCloseProd() { S.prod = null; $('prodsheet').hidden = true; document.documentElement.classList.remove('lock'); render(); }


  // ---- v26: Mistral lezen vanuit het Prijzen-scherm (etiket en scanner)
  var etikFiles = [], scFiles = [], scUrls = [], scOrig = [], scOrigUrls = []; // v45b.9: de originele foto's blijven in het geheugen voor "Opnieuw bijsnijden" (ze gaan nooit naar Mistral)
  var LEESREGELS = 'Je leest foto\'s of screenshots van producten: een productpagina of lijst van een webwinkel (bijvoorbeeld ah.nl), de voedingswaardentabel op een verpakking, of een screenshot uit een voedingsapp (bijvoorbeeld MyFitnessPal, FatSecret, Yazio of de Eetmeter). Lees precies wat er staat en verzin niets. Bij een screenshot uit een voedingsapp zie je vaak een tabel met de kolommen "per 100 g" (of "per 100 ml") en "per portie", soms met percentages erachter, en energie staat er als "Energie" in zowel kJ als kcal. Gebruik voor de voedingswaarden UITSLUITEND de kolom per 100 g of per 100 ml; negeer de kolom per portie en alle percentages. Staat energie alleen in kJ (kilojoule) en niet in kcal, reken het dan om: kcal = kJ delen door 4,184, rond af op hele kcal, en zet "energie omgerekend van kJ" in "onzeker". De regels in de tabel kunnen in een andere volgorde staan en andere namen hebben: "Energie" (kcal), "Vet" met "waarvan verzadigde vetzuren", "Koolhydraten" met "waarvan suikers", "Eiwitten" of "Eiwit", "Zout" en "Vezels" of "Voedingsvezels". Herken die synoniemen. Staat er geen productnaam op de foto maar wel een leesbare tabel, zet "naam" dan op null en vul wel alle andere waarden in; de app vult de waarden in onder de naam die de gebruiker zelf al had. Staat er een prijs op de screenshot (bijvoorbeeld "€ 2,19" of "2,19 €"), lees die als "prijs". Antwoord alleen met JSON in deze opzet: ' +
    JSON.stringify({ gelukt: true, reden: '', producten: [{ naam: 'AH Rundergehakt', prijs: 4.19, inhoud: 500, eenheid: 'g', bonus_prijs: null, bonus_tekst: '', eiwit: 20, suikers: 0.5, verzadigd: 7, zout: 0.2, vezels: 0, kcal: 230, onzeker: [] }] }) +
    ' "naam" is de productnaam zoals op de verpakking of in de winkel, met het merk erbij als dat duidelijk te zien is. "prijs" is de normale prijs van het pak in euro (punt als decimaalteken); staat er geen prijs op, zet null. "inhoud" is een getal en "eenheid" is "g", "ml" of "stuk" (kilo wordt gram, liter wordt milliliter; "6 stuks" is 6 stuk); staat de inhoud er niet op, zet inhoud op null. Als de inhoud niet op de bon/etiket staat, vul dan NIETS in bij inhoud; noem wel eventuele productnamen die op de bon staan. Staat er een bonus- of aanbiedingsprijs, zet die in "bonus_prijs" en de tekst erbij in "bonus_tekst", en laat "prijs" de normale prijs zijn (is die niet te zien, zet dan de enige prijs in "prijs" en bonus_prijs op null). De voedingswaarden (eiwit, suikers, verzadigd, zout en vezels in gram; kcal in kilocalorieën, geen kJ) neem je alleen over uit de kolom per 100 g of per 100 ml, met een punt als decimaalteken. "suikers" is het regeltje "waarvan suikers" en "verzadigd" is "waarvan verzadigde vetzuren". Staat er alleen een kolom per portie, zet de voedingswaarden dan op null en zeg dat in "onzeker"; reken niets om. Kun je iets niet lezen of staat het er niet, zet dan null. Twijfel je over een getal, zet het dan in "onzeker" (een lijstje met korte uitleg). Staan er meer producten op een foto, neem ze allemaal op. Lukt het helemaal niet, zet "gelukt" op false met een korte "reden".';
  var LEES_EEN = ' Alle foto\'s horen bij één en hetzelfde product (bijvoorbeeld voorkant, achterkant en tabel). Geef precies één product in "producten" en combineer wat op alle foto\'s staat. Staat er op geen enkele foto een productnaam, geef dan één product met "naam" op null en alle gelezen waarden ingevuld.';
  var BONREGELS = 'Je leest een foto van een kassabonnetje uit de supermarkt: per regel staat een productnaam en een prijs in euro (bijvoorbeeld "MAYONAISE 500ML  2,19" of "1x AH yoghurt 0,89"). Lees ALLE productregels die je kunt lezen; sla regels over met alleen een datum, tijd, BTW, "Totaal", "Subtotaal", "UW VOORDEEL", spaarzegels of kassa-nummers. Lees precies wat er staat en verzin niets. Staat er een markeerletter ((B), B, BB, P of C) bij een productregel, dan is dat ALLEEN een label (dit product heeft bonus), nooit een bedrag: zet "prijs" op de echte prijs en "bonus" op null. Onderaan de bon kunnen aparte kortingsregels staan met een afgeknipte productnaam en een negatief bedrag (bijvoorbeeld "OPTIMELDRINK -3,98" of "AHGEROOKTEZA -1,15"):  lees die regels ook. Een regel met een negatief bedrag is een korting, geen product: tel die bij het bijpassende product als bonus of negeer de regel met een melding. DeDiscount-woorden verschillen per supermarkt: BONUS bij AH, ACTIEPRIJS bij Lidl, ACTIE <productnaam> bij Jumbo, AANBIEDING of VOORDEEL komen ook voor; ze staan meestal ná het product. Een kortingsregel mét een (afgeknipte) productnaam koppel je aan de productregel(s) met diezelfde naam; een kortingsregel zónder productnaam (bijvoorbeeld "MIJN AH MILES -1,00", "BONUSKAART", "CARE INLEGKR") koppel je NOOIT automatisch aan een product — zet die als aparte regel met "geen_eten": true en "bonus": null. Staat er een aantal voor de productnaam (bijvoorbeeld "4x Optimel yoghurt 9,96"), lees dat als "aantal" (alleen als er ÉCHT een aantal staat zoals 2x, 2 ST of x2; twijfel of niets = 1; een weegproduct (per kg) is altijd 1) en zet het bedrag rechts op de regel in "prijs" als het TOTAAL. De app rekent zelf uit: prijs per verpakking = totaal delen door aantal — doe dat zelf NIET. Deel een korting NIET over het aantal: de korting hoort bij de HELE productregel (2 bollen samen -0,09). Lees onderaan ook "UW VOORDEEL" (AH) of "Totaal korting" (Jumbo) als getal in "uw_voordeel" en het TOTAAL als "totaal". Per supermarkt: Lidl — een negatief regeltje direct onder een product (bijvoorbeeld "In prijs verlaagd -0,30" of "Actieprijs -1,07") is de korting van dat product; het B-markeertje op de productregel zelf is geen bedrag. AH — onderaan bij "Bonus:" staan de echte kortingen (bijvoorbeeld "AH ITALIAANSE -0,09", BB/BBOX = Bonus Box); (B) op een productregel is géén bedrag. Jumbo — een negatieve ACTIE-regel (bijvoorbeeld "ACTIE ROZIJNENBOLLEN -1,26") is een korting, koppel op naam; P is een markeertje. Als de inhoud niet op de bon staat, vul dan NIETS in bij artikel_inhoud; noem wel eventuele productnamen die op de bon staan. Antwoord alleen met JSON in deze opzet: ' + JSON.stringify({ gelukt: true, reden: '', bon: [{ naam: 'Mayonaise 500 ml', aantal: 1, prijs: 2.19, bonus: 1, korting_tekst: 'MAYO -2,00', statiegeld: false, geen_eten: false, artikel: 'Mayonaise fijn 500 ml', artikel_inhoud: 500, artikel_eenheid: 'ml', kcal: 680, eiwit: 0.5, suikers: 1, verzadigd: 10, zout: 1.2, vezels: 0, match: 'Mayonaise', match_id: null, zeker: true, onzeker: [] }] }) + ' Per bonregel geef je één item in "bon". "aantal" is het aantal stuks op de regel (standaard 1). "naam" is de productnaam zoals op de bon, zo compleet mogelijk inclusief de inhoud als die erbij staat (bijvoorbeeld "500 ml" of "6 stuks"). "prijs" is het bedrag in euro met een punt als decimaalteken (het bedrag rechts op de regel, niet een aantal of een kiloprijs). "bonus" is de korting per verpakking in euro met een punt als decimaalteken (de kortingsregel gedeeld door het aantal op de productregel, afgerond op centen), of null als dit product geen bonus heeft. "korting_tekst" is de kortingsregel zoals die op de bon staat (of leeg). "statiegeld" is true als de regel statiegeld is (bijvoorbeeld "STATIEGELD 0,15"). "geen_eten" is true als dit géén eet- of drinkproduct is: statiegeld, heffingen, duidelijke niet-eten-artikelen (drogisterij, huishoudelijk) én kaart-/spaarregels zonder productnaam (bijvoorbeeld BONUSKAART, MIJN AH MILES, Care inlegkaart). Bij twijfel zet je "geen_eten" op false — gok nooit. Statiegeld valt altijd onder geen_eten: true. "artikel" is jouw beste voorstel voor het volledige artikel achter de (vaak afgeknipte) bonnaam, bijvoorbeeld "OPTIMEL YOGH" wordt "Optimel yoghurtdrink aardbeien 1 liter": past er een product uit ONZE LIJST op, gebruik dan precies die naam en die inhoud; anders schat je het artikel uit wat je weet, met onzekerheden in "onzeker". Past bij de prijs op de bon een grotere verpakking (bijvoorbeeld 1 liter in plaats van 500 ml) of staat die inhoud zo bij ONZE LIJST, kies dan die grotere verpakking. Twijfel je over de maat, zet "artikel_inhoud" dan op null. Bakkerij- en kassa-afkortingen mag je in het artikel-voorstel uitbreiden als je er redelijk zeker van bent (bijvoorbeeld BB = Bakkersbollen, dus "BB BOULOGNE" wordt "AH Bakkersbollen boulogne"). Twijfel je, laat het naam-voorstel dan zoals op de bon en leg het in "onzeker" uit. Bij een afgekorte productnaam: vul alleen aan als je er zeker van bent, anders laat de naam precies zoals op de bon. "artikel_inhoud" is een getal en "artikel_eenheid" is "g", "ml", "l" of "stuk". De velden kcal (per 100 g of 100 ml) en eiwit, suikers, verzadigd, zout, vezels (in gram) zijn een voorstel bij "artikel"; ken je ze niet goed, zet ze dan op null en zeg dat in "onzeker". "match" is de productnaam uit ONZE LIJST (zie hieronder) die het beste bij dit bonproduct past, of null als er geen goede match is. "match_id" is het id uit ONZE LIJST bij die match, of null. "zeker" is true als de match overduidelijk is (zelfde product, zelfde inhoud), anders false. Is de bonregel vaag of dubbelzinnig (bijvoorbeeld "kipfilet": dat kan vlees of broodbeleg zijn) of passen er meerdere van onze producten op, zet "match" dan op null en "match_id" op null, zet "zeker" op false, en leg in "onzeker" kort uit waarom (bijvoorbeeld "vaag: kan vlees of broodbeleg zijn"). Gok nooit zelf. Twijfel je over een regel of getal, zet het dan in "onzeker" (een lijstje met korte uitleg). Kun je geen enkele productregel lezen, zet "gelukt" op false met een korte "reden".';
  function gemFout(e) {
    var m = e && e.message ? e.message : String(e);
    if (/Plak eerst je Mistral API-sleutel/.test(m)) m = 'Plak eerst je Mistral-sleutel bij het tabblad Instellingen (vak "1. Instellen").';
    else if (/kan nu niet|Geen verbinding|Failed to fetch|NetworkError|reageert niet binnen|^Fout \d+/i.test(m)) m = 'Mistral kan nu niet, probeer het later opnieuw.'; // v58.4: geen technische fouttekst
    return m;
  }
  function lGetal(v) { if (v == null || v === '') return null; var x = typeof v === 'number' ? v : num(String(v)); return x != null && isFinite(x) && x >= 0 ? x : null; }
  // v47.3: bonprijs mag ook negatief zijn (korting); alleen voor de bonprijs
  // v55.2 (13 nov) PUNT 8 HOOFDREGEL (kliktest checkt deze tekst): een negatief bedrag is een korting, geen product — markersletters (B, BB, P, C) zijn labels, nooit bedragen
  function lGetalNeg(v) { if (v == null || v === '') return null; var x = typeof v === 'number' ? v : num(String(v)); return x != null && isFinite(x) ? x : null; }
  // v47.3: prijs per verpakking uit bon-totaal ÷ aantal
  function bonPer(b) { if (b.pr == null) return ''; var a = Math.max(1, b.aantal || 1); return eur(b.pr) + ' totaal · ' + eur(Math.round(b.pr / a * 100) / 100) + ' per verpakking'; }
  function bonPerPr(b) { return b.pr != null ? Math.round(b.pr / Math.max(1, b.aantal || 1) * 100) / 100 : null; } // v47.3.1: prijs per verpakking als getal
  function lNorm(x) {
    if (!x || (x.naam == null && x.prijs == null && x.inhoud == null && x.kcal == null && !(x.eiwit != null || x.suikers != null || x.verzadigd != null || x.zout != null || x.vezels != null))) return null;
    var eh = x.eenheid === 'ml' ? 'ml' : x.eenheid === 'stuk' ? 'stuk' : 'g';
    var w = {}, map = { eiwit: 'eiwit', suiker: 'suikers', verz: 'verzadigd', zout: 'zout', vezel: 'vezels' };
    Object.keys(map).forEach(function (k) { var v = lGetal(x[map[k]]); if (v != null) w[k] = v; });
    var on = Array.isArray(x.onzeker) ? x.onzeker.filter(Boolean).map(String) : (x.onzeker ? [String(x.onzeker)] : []);
    return { aan: true, n: x.naam != null ? String(x.naam).trim().slice(0, 80) : '', pr: lGetal(x.prijs), inh: lGetal(x.inhoud) > 0 ? lGetal(x.inhoud) : null, u: eh, bon: lGetal(x.bonus_prijs), bonT: String(x.bonus_tekst || '').slice(0, 60), w: w, kc: lGetal(x.kcal), onzeker: on.map(function (t) { return t.slice(0, 160); }) };
  }
  // Leest foto's. een = alle foto's in één vraag (één product). Geeft een lijst genormaliseerde producten terug.
  async function gemLees(files, een, regels) {
    if (!APP.gem) throw new Error('Mistral is niet geladen. Open de app opnieuw.');
    var parts = [{ text: (regels || LEESREGELS) + (een && !regels ? LEES_EEN : '') }];
    for (var i = 0; i < files.length; i++) parts.push({ inline_data: { mime_type: 'image/jpeg', data: await APP.gem.verklein(files[i]) } });
    var body = { contents: [{ role: 'user', parts: parts }], generationConfig: { responseMimeType: 'application/json' } };
    var res = await APP.gem.post(APP.gem.model(), body);
    if (!res.ok) throw new Error(APP.gem.uitleg(res, await res.text()));
    var d = await res.json(), cand = (d.candidates || [{}])[0] || {};
    var t = ((cand.content || { parts: [] }).parts || []).map(function (q) { return q.text || ''; }).join('').trim();
    if (!t) throw new Error('Mistral gaf geen tekst terug (mogelijk gefilterd). Probeer een andere foto.');
    var r; try { r = APP.gem.jsonUit(t); } catch (e) { throw new Error('Mistral gaf geen bruikbaar antwoord. Probeer het opnieuw of met een scherpere foto.'); }
    if (regels) {
      var bon = Array.isArray(r.bon) ? r.bon : [];
      gemLees.uwVoordeel = lGetal(r.uw_voordeel); gemLees.totaalBon = lGetal(r.totaal); // v55.2 PUNT 8f: controle-som uit de bon
      if (r.gelukt === false || !bon.length) throw new Error((r.reden ? r.reden + ' ' : (bon.length ? '' : 'Geen productregels gevonden in dit stuk. ')) + 'Tik op "Opnieuw bijsnijden" en kies alleen het deel met productnamen en prijzen. Of maak een nieuwe foto: plat, met goed licht, recht van boven.');
      return bon.map(function (b) {
        if (!b || !String(b.naam || '').trim()) return null;
        var bonOn = Array.isArray(b.onzeker) ? b.onzeker.filter(Boolean).map(String) : (b.onzeker ? [String(b.onzeker)] : []);
        var w = {}; ['eiwit', 'suikers', 'verzadigd', 'zout', 'vezels'].forEach(function (k) { var v = lGetal(b[k]); if (v != null) w[k] = v; });
        var ae = b.artikel_eenheid === 'ml' ? 'ml' : b.artikel_eenheid === 'l' ? 'l' : b.artikel_eenheid === 'stuk' ? 'stuk' : 'g';
        var n0 = String(b.naam).trim().slice(0, 80);
        n0 = n0.replace(/\s*\((B{1,2}|P|C)\)\s*$/i, ''); // v55.2 PUNT 8a: (B)/(BB)/(P)/(C) zijn labels, geen bedragen
        var pr0 = lGetalNeg(b.prijs), kortPr = null;
        if (pr0 != null && pr0 < 0) { kortPr = -pr0; pr0 = null; } // v55.2 PUNT 8: een negatief bedrag is een korting, geen product — prijs leeg, bedrag naar korting
        var ant = lGetal(b.aantal);
        var nAant = n0.match(/^(\d+)\s*[x×]\s*/i); // v47.3: "2x product" → aantal 2, naam zonder prefix
        if (nAant) { ant = Math.max(1, parseInt(nAant[1], 10)); n0 = n0.slice(nAant[0].length).trim(); }
        return { n: n0, nOrig: String(b.naam).trim().slice(0, 80), aantal: ant != null && ant >= 1 ? Math.round(ant) : 1, pr: pr0, kortPr: kortPr, bonus: lGetal(b.bonus), korting: String(b.korting_tekst || '').slice(0, 60) + (kortPr != null ? (b.korting_tekst ? '; ' : '') + '-' + eur(kortPr) : ''), statiegeld: b.statiegeld === true, geenEten: b.statiegeld === true || b.geen_eten === true, aiN: b.artikel != null ? String(b.artikel).trim().slice(0, 80) : '', aiInh: (function () { var ai = lGetal(b.artikel_inhoud); return (ai > 0 && !(ai === 1 && !BON_INH.test(String(b.naam || '')))) ? ai : null; })(), aiU: ae, aiW: w, aiKc: lGetal(b.kcal), match: b.match != null ? String(b.match).trim().slice(0, 80) : '', matchId: b.match_id != null ? String(b.match_id) : null, zeker: b.zeker !== false, onzeker: bonOn.map(function (t) { return t.slice(0, 160); }) };
      }).filter(Boolean);
    }
    if (r.gelukt === false) throw new Error((r.reden ? r.reden + ' ' : '') + 'Tip: maak de foto scherper en dichterbij, met goed licht.');
    if (!Array.isArray(r.producten) || !r.producten.length) throw new Error('Ik zag geen product of voedingswaardentabel op de foto. Zie je een tabel? Fotografeer die dan recht van voren, van dichtbij.');
    var out = r.producten.map(lNorm).filter(Boolean);
    if (!out.length) throw new Error((r.reden ? r.reden + ' ' : '') + 'Ik kon wel iets lezen, maar geen bruikbare productgegevens. Probeer een scherpere foto.');
    return out;
  }
  // -- Lees etiket in het productscherm
  function etikApply(P, it) {
    var vul = [], wl = [], over = {}, overTxt = [];
    function numOf(v) { var x = num(String(v == null ? '' : v).replace('€', '')); return x == null ? null : x; }
    var naam = it.n ? stripSupermarkt(it.n) : '';
    if (!String(P.n || '').trim() && naam) { P.n = naam; vul.push('naam'); }
    if (!String(P.inh || '').trim() && it.inh) { P.inh = String(it.inh).replace('.', ','); P.u = it.u; vul.push('inhoud'); }
    else if (it.inh && String(P.inh || '').trim() && Math.abs(it.inh - (numOf(P.inh) || 0)) > 0.005) { over.inh = it.inh; overTxt.push('inhoud ' + fmtN(it.inh) + ' ' + it.u); }
    if (!String(P.pr || '').trim() && it.pr != null) { P.pr = p2(it.pr); vul.push('prijs'); }
    else if (it.pr != null && String(P.pr || '').trim() && Math.abs(it.pr - (numOf(P.pr) || 0)) > 0.005) { over.pr = it.pr; overTxt.push('prijs ' + eur(it.pr)); }
    if (!String(P.bon || '').trim() && it.bon != null && it.bon > 0) { P.bon = p2(it.bon); vul.push('bonusprijs'); } // v55.2 PUNT 8g: nooit een negatief bedrag als bonusprijs
    else if (it.bon != null && String(P.bon || '').trim() && Math.abs(it.bon - (numOf(P.bon) || 0)) > 0.005) { over.bon = it.bon; overTxt.push('bonusprijs ' + eur(it.bon)); }
    W_FIELDS.forEach(function (f) {
      if (it.w[f[0]] == null) return;
      if (!String(P.w[f[0]] || '').trim()) { P.w[f[0]] = String(it.w[f[0]]).replace('.', ','); wl.push(f[1].toLowerCase()); }
      else if (Math.abs(it.w[f[0]] - (numOf(P.w[f[0]]) || 0)) > 0.005) { over['w_' + f[0]] = it.w[f[0]]; overTxt.push(f[1].toLowerCase() + ' ' + fmtN(it.w[f[0]]) + ' g'); }
    });
    if (!String(P.kc || '').trim() && it.kc != null) P.kc = String(it.kc).replace('.', ',');
    else if (it.kc != null && String(P.kc || '').trim() && Math.abs(it.kc - (numOf(P.kc) || 0)) > 0.005) { over.kc = it.kc; overTxt.push('calorieën ' + Math.round(it.kc) + ' kcal'); }
    P.over = over; P.overVinkt = {};
    var m = [];
    if (it.n && naam && naam !== String(it.n).trim()) m.push('Supermarktnaam uit de naam gehaald: "' + it.n + '" → "' + naam + '".');
    if (!it.n) m.push('Op de foto stond geen productnaam; de waarden zijn ingevuld onder de naam hierboven.');
    if (wl.length || vul.length) m.push('Ingevuld (lege velden): ' + wl.concat(vul).join(', ') + '.');
    if (!wl.length && !vul.length) m.push('Ik vond geen waarden voor lege velden. Staat er alleen een kolom per portie, dan reken ik niets om.');
    if (overTxt.length) m.push('Al door jou ingevuld — niet overschreven: ' + overTxt.join(', ') + '. Vink hieronder "Neem deze over" aan als je een waarde wilt vervangen.');
    if (it.onzeker.length) m.push('Kijk dit zelf even na: ' + it.onzeker.join('; '));
    m.push('Vergelijk de getallen met het etiket en pas aan wat niet klopt.');
    P.msg = m.join('\n');
  }
  async function etikLees(files) {
    var P = S.prod; if (!P || !files.length) return;
    P.busy = true; P.msg = ''; renderProd(false);
    try {
      var its = await gemLees(files, true);
      if (S.prod !== P) return;
      etikApply(P, its[0]);
    } catch (e) { if (S.prod !== P) return; P.msg = 'Dat lukte niet: ' + gemFout(e); }
    P.busy = false; renderProd(false);
  }
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || t.id !== 'etikfiles') return;
    var fs = Array.prototype.slice.call(t.files || []); t.value = '';
    if (fs.length) etikLees(fs);
  });

  // -- Scanner
  // Variant C (28 okt): openSC('bon') opent meteen in de kassabon-modus, openSC() of openSC('prod') in de etiket-modus.
  // De schakelaar bovenin het scannerscherm blijft, dus je kunt altijd van modus wisselen.
  function openSC(m) {
    S.sc = { one: false, items: [], bon: [], mode: (m === 'bon' ? 'bon' : 'prod'), msg: '', busy: false, crop: null, cropDone: false, cropN: 0 };
    scFiles = []; scUrls = []; scOrig = []; scOrigUrls = [];
    pushLayer(); document.documentElement.classList.add('lock'); $('scsheet').hidden = false; renderSC();
  }
  function forceCloseSC() { S.scFormQ = null; S.scFormTotaal = 0; S.sc = null; scFiles = []; scUrls.concat(scOrigUrls).forEach(function (u) { if (u) { try { URL.revokeObjectURL(u); } catch (e) { } } }); scUrls = []; scOrig = []; scOrigUrls = []; $('scsheet').hidden = true; document.documentElement.classList.remove('lock'); render(); }
  function scField(label, key, i, val, ph, cls) {
    return '<div><label class="hint" style="margin:0 0 4px;display:block">' + label + '</label><input class="note' + (cls ? ' ' + cls : '') + '" data-sci="' + i + '" data-sck="' + key + '" type="text" inputmode="decimal" autocomplete="off" placeholder="' + (ph || '') + '" value="' + esc(val == null ? '' : String(val).replace('.', ',')) + '"></div>';
  }
  function renderSC() {
    var P = S.sc; if (!P) return;
    var body = $('scbody'), keep = body.scrollTop;
    var actEl = document.activeElement, actKey = actEl && actEl.getAttribute ? (actEl.getAttribute('data-sc') || actEl.getAttribute('data-pov') || '') : ''; // v51: focus behouden bij live re-render
    var h = '<p class="hint" style="margin-top:0">Kies screenshots (bijvoorbeeld van ah.nl) of foto\'s van verpakkingen. Mistral leest prijs, inhoud en etiketwaarden. Er wordt pas iets bewaard als jij op "Bewaar de aangevinkte" tikt.</p>';
    h += '<div class="seg mvact" style="margin-top:8px"><button class="pill" data-act="scmode" data-v="prod" aria-pressed="' + (P.mode !== 'bon') + '">Producten / etiketten</button><button class="pill" data-act="scmode" data-v="bon" aria-pressed="' + (P.mode === 'bon') + '">Kassabon</button></div>';
    if (P.mode === 'bon') h += '<p class="hint zz" style="margin-top:4px">Fotografeer de bon plat, met goed licht, recht van boven. Plak een klantkaartnummer af of snijd het weg. Mistral leest de productregels en stelt een match met jouw producten voor; jij controleert en vinkt aan.</p>';
    if (P.mode === 'bon' && P.bon && P.bon.length && P.uwVoordeel != null) { // v55.2 PUNT 8f: controle — som kortingsregels = UW VOORDEEL / Totaal korting
      var sumK = 0; P.bon.forEach(function (b) { if (b.pr != null && b.pr < 0) sumK += -b.pr; if (b.kortPr != null) sumK += b.kortPr; });
      sumK = Math.round(sumK * 100) / 100;
      if (Math.abs(sumK - P.uwVoordeel) > 0.005) h += '<p class="banner" style="margin-top:6px">⚠️ Controle bon: som gevonden kortingsregels ± ' + esc(eur(sumK)) + ' klopt niet met "UW VOORDEEL"/"Totaal korting" ' + esc(eur(P.uwVoordeel)) + ' — controleer zelf, de app gokt niet.</p>';
    }
    else h += '<p class="hint zz" style="margin-top:4px">Etiketten en webshops. In de modus Kassabon lees je een kassabon.</p>';
    h += '<button class="btn" style="width:100%" data-act="scpick"' + (P.busy ? ' disabled' : '') + '>' + (scFiles.length ? 'Meer foto\'s toevoegen' : 'Foto\'s of screenshots kiezen') + '</button>';
    if (scFiles.length) {
      h += '<div class="chiprow" style="margin-top:8px">' + scUrls.map(function (u, i) { return '<span style="position:relative;display:inline-block"><img alt="Foto ' + (i + 1) + '" src="' + u + '" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--line)"><button class="del" data-act="scrm" data-i="' + i + '" aria-label="Foto ' + (i + 1) + ' weghalen" style="position:absolute;top:-6px;right:-6px">×</button></span>'; }).join('') + '</div>';
      // v45a.1: bon-crop (privacy) - alleen in bon-modus, alleen voor de eerste foto
      if (P.mode === 'bon' && !P.cropDone && !P.busy) {
        var cN = Math.min(P.cropN || 0, scFiles.length - 1);
        h += '<div class="pricebox" style="margin-top:10px"><p style="margin:0 0 6px"><b>⚠️ Privacy — bon bijsnijden' + (scFiles.length > 1 ? ' (foto ' + (cN + 1) + ' van ' + scFiles.length + ')' : '') + ':</b> schuif het vierkant over het deel met producten en prijzen. Een klantkaartnummer bovenaan valt erbuiten — <b>alleen het vierkant wordt naar Mistral gestuurd</b>, de rest blijft op je telefoon.</p>' +
          '<div style="display:flex;align-items:stretch"><div class="cropscroll" aria-hidden="true"></div><div class="cropwrap" id="scrop" style="margin:6px 0">' +
          '<img id="scropimg" src="' + scUrls[cN] + '" alt="Kassabon — schuif het vierkant over de productregels">' +
          '<div class="cropbox" id="scropbox" style="left:5%;top:15%;width:90%;height:60%">' +
          '<span class="h tl"></span><span class="h tr"></span><span class="h bl"></span><span class="h br"></span>' +
          '</div></div><div class="cropscroll" aria-hidden="true"></div></div>' +
          '<p class="hint" style="margin:4px 0 8px">Verslepen = midden pakken. Hoekje = groter/kleiner maken.</p>' +
          '<button class="btn main" data-act="scropgo" style="width:100%">' + (cN + 1 < scFiles.length ? 'Volgende foto bijsnijden →' : 'Doorgaan: lees alleen dit stuk →') + '</button></div>';
      }
      if (P.mode === 'bon' && P.cropDone && !P.busy && scOrig.some(Boolean)) h += '<button class="btn" style="width:100%;margin-top:10px" data-act="screcrop">Opnieuw bijsnijden</button><p class="hint" style="margin:4px 0 0">Kies een ander stuk van dezelfde bon. Het oude resultaat verdwijnt.</p>';
      if (P.mode !== 'bon' || P.cropDone) {
        h += '<button class="fchip" style="margin-top:10px" data-act="scone" aria-pressed="' + (!!P.one) + '">' + (P.one ? '☑' : '☐') + (P.mode === 'bon' ? ' De bon in één vraag' : ' Deze foto\'s horen bij één product') + '</button>';
        h += '<p class="hint" style="margin-top:4px">' + (P.one ? 'Alle ' + scFiles.length + ' foto\'s gaan in één vraag naar Mistral, voor één product (bijvoorbeeld voorkant en tabel).' : 'Elke foto is een aparte vraag aan Mistral. Staat de tabel op een aparte foto? Vink dan het vakje aan.') + '</p>';
        h += '<button class="btn main" style="width:100%;margin-top:6px" data-act="scgo"' + (P.busy ? ' disabled' : '') + '>' + (P.busy ? 'Bezig met lezen...' : 'Lees de foto\'s') + '</button>';
      }
    }
    if (P.msg) h += '<div class="pricebox" style="margin-top:8px;white-space:pre-line">' + esc(P.msg) + '</div>';
    if (P.items.length) {
      h += '<h3>Overzicht, controleer en pas aan</h3>';
      P.items.forEach(function (it, i) {
        var cleaned = stripSupermarkt(it.n);
        if (cleaned && cleaned !== it.n) it.n = cleaned;
        // v46-scanner: keuze zonder voorselectie. it.pid: null = nog niets gekozen, '' = nieuw product, anders het gekozen product.
        var exN = S.prijzen.filter(function (p) { return normName(p.n) === normName(it.n); })[0];
        var chosenId = it.pid != null ? it.pid : (exN ? exN.id : null);
        var ex = chosenId ? (prodById(chosenId) || null) : null;
        var cands = exN ? [exN] : vindMultiples(it.n).slice(0, 3);
        if (ex && !cands.some(function (p) { return p.id === ex.id; })) cands.unshift(ex);
        var hoe = it.hoe === 'vervang' ? 'vervang' : 'bijwerk';
        h += '<div class="rcard" style="padding:10px;margin-bottom:8px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="fchip" data-act="scaan" data-i="' + i + '" aria-pressed="' + (!!it.aan) + '">' + (it.aan ? '☑ Bewaren' : '☐ Niet bewaren') + '</button> <span class="hint" style="margin:0">' + (ex ? (hoe === 'vervang' ? 'vervangt een product' : 'bestaand product') : 'nieuw') + '</span>' +
          '<button class="fchip" data-act="scitdel" data-i="' + i + '" style="margin-left:auto">✖ Verwijderen</button></div>' +
          '<input class="note" data-sci="' + i + '" data-sck="n" type="text" maxlength="80" autocomplete="off" aria-label="Naam" value="' + esc(it.n) + '" style="margin-top:6px">' +
          '<div class="grid2" style="margin-top:6px">' + scField('Prijs (€)', 'pr', i, it.pr, '2,99') + scField('Bonusprijs (€, leeg = geen)', 'bon', i, it.bon, '') + scField('Inhoud (' + (it.u === 'stuk' ? 'stuks' : it.u === 'l' ? 'liter' : it.u) + ')', 'inh', i, it.inh, '200') +
          '</div><div class="seg mvact">' + [['g', 'gram'], ['ml', 'milliliter'], ['l', 'liter'], ['stuk', 'stuks'], ['kg', 'kilo']].map(function (u) { return '<button class="pill" data-act="scunit" data-i="' + i + '" data-v="' + u[0] + '" aria-pressed="' + (it.u === u[0] || (u[0] === 'kg' && it.u === 'g' && it.kilo)) + '">' + u[1] + '</button>'; }).join('') + '</div>' + // v47.3: kilo-pill // v47.3
          '<details class="psum" style="margin-top:6px"><summary>Etiket per 100 g of 100 ml (leeg = niet gelezen)</summary><div class="grid2" style="margin-top:6px">' + W_FIELDS.map(function (f) { return scField(f[1] + ' (g)', 'w_' + f[0], i, it.w[f[0]], '', it.w[f[0]] != null && isFinite(+it.w[f[0]]) ? 'wn ' + wClass(f[0], +it.w[f[0]]) : ''); }).join('') + '</div></details>' + // wens 8 nov: hele 100 g-blokje in de scanner compacter: dicht uitklapblokje, zelfde patroon als bij een product
          (it.kc != null ? '<p class="hint" style="margin:6px 0 0">Calorieën zijn ook gelezen en worden bewaard (zichtbaar bij het product achter "Toon calorieën").</p>' : '') +
          (it.onzeker.length ? '<p class="hint" style="margin:6px 0 0">Let op: ' + esc(it.onzeker.join('; ')) + '</p>' : '') +
          scKeuzeBox(it, i, cands, ex, hoe, chosenId) +
          (ex && hoe !== 'vervang' ? (function () {
            var o = overVinkjes(ex, it), keys = Object.keys(o), out = '';
            if (!keys.length) return '';
            out += '<div class="pricebox" style="margin:8px 0 0"><p style="margin:0 0 4px"><b>Al door jou ingevuld — niet overschreven:</b></p>';
            var wLab = {}; W_FIELDS.forEach(function (f) { wLab['w_' + f[0]] = f[1]; });
            keys.forEach(function (k) {
              var lbl;
              if (k === 'pr') lbl = 'prijs ' + eur(it.pr) + ' (jij had ' + eur(ex.pr) + ')';
              else if (k === 'bon') lbl = 'bonusprijs ' + eur(it.bon) + ' (jij had ' + eur(ex.bon) + ')';
              else if (k === 'inh') lbl = 'inhoud ' + fmtN(it.inh) + ' ' + (ex.u || 'g') + ' (jij had ' + (ex.inh ? fmtN(ex.inh) + ' ' + ex.u : 'leeg') + ')';
              else if (k === 'kc') lbl = 'calorieën ' + Math.round(it.kc) + ' kcal (jij had ' + (ex.kc != null ? Math.round(ex.kc) + ' kcal' : 'leeg') + ')';
              else if (wLab[k]) lbl = wLab[k].toLowerCase() + ' ' + fmtN(it.w[k.slice(2)]) + ' g (jij had ' + fmtN(ex.w[k.slice(2)]) + ' g)';
              else lbl = k;
              out += '<label class="vink over"><input type="checkbox" data-sco="' + i + '" data-sck2="' + k + '"> Neem deze over: ' + esc(lbl) + '</label>';
            });
            return out + '</div>';
          })() : '') + '</div>';
      });
      h += '<div class="btns"><button class="btn main" data-act="scsave">Bewaar de aangevinkte</button><button class="btn" data-act="scnone">Niets bewaren</button></div>';
    }

    if (P.mode === 'bon' && P.bon.length) {
      h += '<h3>Bon gelezen, controleer de matches</h3>';
      var apartN = P.bon.filter(function (b) { return b.geenEten; }).length; // v46.3
      var persK = P.bon.filter(function (b) { return b.geenEten && b.pr != null && b.pr < 0 && !isBonusKortingRegel(b) && heeftProductNaam(b.n) === false; }); // v46.3 (+fix: BONUS-regels zijn géén persoonlijke korting)
      P.bon.forEach(function (b, i) {
        if (b.geenEten) return; // v46.3: statiegeld/geen-eten staat in het aparte blok onderaan
        var origN = b.nOrig || b.n;
        var cln = stripSupermarkt(b.n);
        if (cln && cln !== b.n) { b.n = cln; b.nOrig = origN; }
        var sug = b.sug ? prodById(b.sug) : null;   // v45b.7: de AI-suggestie; de keuze zelf staat in b.keuze
        var ex = bonProd(b);
        var mult = vindMultiples(b.n).filter(function (p) { return !sug || p.id !== sug.id; });
        var inhM = BON_INH.exec(origN), inhB = inhM ? inhGetal(inhM) : null, uB = inhM ? inhEenheid(inhM[2]) : null;
        var zelfde = ex ? normName(ex.n) === normName(b.n) : false;
        h += '<div class="rcard" style="padding:10px;margin-bottom:8px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="fchip" data-act="scbonaan" data-i="' + i + '" aria-pressed="' + (!!b.aan) + '">' + (b.aan ? '☑ Bijwerken' : '☐ Niet bijwerken') + '</button>' +
          '<button class="fchip" data-act="scbondel" data-i="' + i + '" style="margin-left:auto">✖ Regel verwijderen</button></div>' +
          '<label class="hint" style="margin:8px 0 4px;display:block">Naam (bewerkbaar — de bon had hem mogelijk afgekapt)</label>' +
          '<input class="note" data-boni-n="' + i + '" type="text" maxlength="80" autocomplete="off" aria-label="Productnaam op de bon" value="' + esc(b.n) + '">' +
          '<p style="margin:6px 0 0;font-weight:600">' + (b.pr != null ? 'Prijs: ' + esc(bonPer(b)) : 'Prijs onbekend') + '</p>' +
          '<div style="margin-top:6px"><label class="hint" style="margin:0 0 4px;display:block">Aantal op de bon (minimaal 1)</label><input class="note" data-boni-a="' + i + '" type="text" inputmode="numeric" autocomplete="off" aria-label="Aantal op de bon" value="' + esc(String(b.aantal || 1)) + '">' + (b.nOrig && b.nOrig !== b.n ? '<p class="hint zz" style="margin:4px 0 0">Op de bon stond "' + esc(b.nOrig) + '".</p>' : '') + '</div>';
        if (b.statiegeld) h += '<p class="hint" style="margin:4px 0 0"><b>Statiegeld — automatisch apart gehouden.</b> Meestal hoef je deze regel niet te bewaren.</p>';
        if (!b.geenEten && b.korting && b.bonus != null) h += '<p class="hint zz" style="margin:4px 0 0"><b>Bonus −' + esc(eur(b.bonus).replace('€ ', '€ ')) + '</b> — kortingsregel op de bon: ' + esc(b.korting) + '</p>'; // v46.3-fix: korting zichtbaar bij het product
        h += '<div style="margin-top:6px"><label class="hint zz" style="margin:0 0 4px;display:block">Bonusprijs per verpakking uit de bon (€, leeg = geen)' + (b.korting ? ' — kortingsregel op de bon: ' + esc(b.korting) : '') + '</label><input class="note" data-boni-bon="' + i + '" type="text" inputmode="decimal" autocomplete="off" aria-label="Bonusprijs per verpakking" value="' + esc(b.bonus != null && b.bonus > 0 && !b.bonusVanKorting ? p2(b.bonus) : '') + '"></div>'; // v55.2 PUNT 8g: leeg tenzij échte bonusprijs-regel; een korting is géén bonusprijs en een prijs is nooit negatief
        if (b.aiN) h += '<div class="pricebox" style="margin:8px 0 0"><p style="margin:0 0 4px"><b>AI denkt mee — dit is waarschijnlijk:</b> ' + esc(b.aiN) + (b.aiInh != null ? ' (' + fmtN(b.aiInh) + ' ' + b.aiU + ')' : '') + '</p>' + (b.aiKc != null ? '<p class="hint zz" style="margin:0 0 4px">Voedingswaarden als voorstel (per 100 g of 100 ml): ' + Math.round(b.aiKc) + ' kcal' + (Object.keys(b.aiW).length ? ' · ' + Object.keys(b.aiW).map(function (k) { return (k === 'verzadigd' ? 'verzadigd vet' : k) + ' ' + fmtN(b.aiW[k]); }).join(' · ') : '') + '</p>' : '') + '<p class="hint zz" style="margin:0">De naam hierboven is door de AI aangevuld en bewerkbaar; twijfelde de AI, dan staat dat bij "Let op". Er is nog niets bewaard.</p></div>';
        if (b.boniN && normName(b.boniN) !== normName(b.n)) h += '<p class="hint zz" style="margin:2px 0 0">Op de bon stond "' + esc(b.boniN) + '" — de AI heeft de naam aangevuld tot een bewerkbaar voorstel.</p>';
        else if (b.n !== origN) h += '<p class="hint" style="margin:2px 0 0">Supermarktnaam weggehaald: "' + esc(origN) + '" → "' + esc(b.n) + '".</p>';
        var verschil = sug ? onderscheidVerschil(b.n, sug.n) : [];
        h += '<div class="pricebox" style="margin:8px 0 0"><p style="margin:0 0 4px"><b>' + (sug ? (b.zeker ? 'De app is hier zeker van. Klopt dit?' : 'De app twijfelt. Kies zelf:') : (mult.length ? 'Dit kan op meerdere van jouw producten passen. Kies zelf:' : 'Niets gevonden in jouw producten. Kies zelf, of maak een nieuw product:')) + '</b></p>';
        if (verschil.length) h += '<p class="hint" style="margin:0 0 6px">Let op: verschil in <b>' + esc(verschil.join(', ')) + '</b> tussen de bon en jouw productnaam. Dat kan een ander voedingsprofiel zijn; dan is het een apart product.</p>';
        var bk = function (val, checked, titel, sub) { return '<label class="vink"><input type="radio" name="scbk' + i + '" data-bk="' + i + '" data-bv="' + val + '"' + (checked ? ' checked' : '') + '> <span>' + titel + (sub ? '<br><span class="hint" style="margin:0;font-weight:400">' + sub + '</span>' : '') + '</span></label>'; };
        var bPr = bonPerPr(b); // v47.3.1: per verpakking, nooit het totaal
        if (sug) h += bk('dit', b.keuze === 'dit', (b.zeker ? 'Dit product: ' : 'Mogelijk: ') + '<b>' + esc(sug.n) + '</b>', (sug.inh ? fmtN(sug.inh) + ' ' + sug.u + ' · ' : '') + (sug.pr != null ? 'nu ' + eur(sug.pr) : 'nog geen prijs') + (bPr != null && sug.pr != null && Math.abs(bPr - sug.pr) > 0.005 ? ' → bon ' + eur(bPr) : (bPr != null && sug.pr != null ? ' · prijs gelijk' : '')));
        mult.forEach(function (p) { h += bk('kies:' + p.id, b.keuze === 'kies' && b.pid === p.id, 'Mogelijk: <b>' + esc(p.n) + '</b>', p.inh ? fmtN(p.inh) + ' ' + p.u : ''); });
        h += bk('zoek', b.keuze === 'zoek', 'Ander product kiezen' + (b.keuze === 'zoek' && b.pid && prodById(b.pid) ? ': <b>' + esc(prodById(b.pid).n) + '</b>' : '…'), 'Zoek in jouw producten');
        h += bk('nieuw', b.keuze === 'nieuw', '<b>Nieuw product maken</b>', 'Wordt apart bewaard als "' + esc(b.n) + '"');
        h += '</div>';
        if (b.keuze === 'zoek') {
          var selP = b.pid ? prodById(b.pid) : null;
          h += '<div class="dd' + (selP ? '' : ' open') + '" data-dd="' + i + '" data-ddmode="bon">' +
            '<input class="note" data-ddq="' + i + '" type="text" autocomplete="off" placeholder="Typ om te zoeken in mijn producten…" aria-label="Zoek een product voor deze bonregel" value="' + (selP ? esc(selP.n) : '') + '" style="margin-top:8px">' + // wens 8 nov: zelfde korte tekst als de dag-flow
            '<div class="dd-list">' +
            (S.prijzen.length ? S.prijzen.map(function (p) {
              return '<button type="button" class="dd-item' + (selP && selP.id === p.id ? ' sel' : '') + '" data-ddid="' + p.id + '" data-ddn="' + esc(p.n) + '" style="display:none">' + esc(p.n) + (p.inh ? ' <small>' + fmtN(p.inh) + ' ' + p.u + '</small>' : '') + '</button>'; // wens 8 nov: scanner-zoekveld start leeg, resultaten alleen tijdens typen
            }).join('') : '') +
            '<div class="dd-empty">' + (S.prijzen.length ? 'Typ om te zoeken in mijn producten…' : 'Nog geen producten in je lijst') + '</div>' +
            '</div></div>';
        }
        if (ex && b.keuze !== 'nieuw') {
          // v46: ook bij een kassabon kiezen tussen bijwerken en vervangen (bijwerken = zoals het was)
          var hoeB = b.hoe === 'vervang' ? 'vervang' : 'bijwerk';
          var bh = function (val, titel, sub) { return '<label class="vink"><input type="radio" name="scbh' + i + '" data-bhoe="' + i + '" value="' + val + '"' + (hoeB === val ? ' checked' : '') + '> <span>' + titel + '<br><span class="hint" style="margin:0;font-weight:400">' + sub + '</span></span></label>'; };
          h += '<div class="pricebox" style="margin:8px 0 0"><p style="margin:0 0 4px"><b>Wat wil je met ' + esc(ex.n) + '?</b></p>' +
            bh('bijwerk', 'Bijwerken', 'Naam blijft. Lege velden worden aangevuld; wat jij zelf hebt ingevuld blijft staan.') +
            bh('vervang', 'Vervangen', 'Naam, inhoud en prijs worden die van de bon. De oude naam blijft herkend in recepten.') +
            (hoeB === 'vervang' ? scVervangTekst(ex, { n: bonNaamSchoon(b), inh: inhB, u: uB, pr: bonPerPr(b) }) : '') + '</div>'; // v47.3.1: per verpakking
        }
        if (ex && b.hoe !== 'vervang') {
          var prPerR = bonPerPr(b); // v47.3.1: per verpakking
          var ovB = overVinkjes(ex, { pr: prPerR, bon: b.bonus, inh: inhB }), ovK = Object.keys(ovB);
          if (ovK.length) {
            h += '<div class="pricebox" style="margin:8px 0 0"><p style="margin:0 0 4px"><b>Al door jou ingevuld — niet overschreven:</b></p>';
            ovK.forEach(function (k) {
              var lbl = k === 'pr' ? 'bonprijs ' + eur(prPerR) + ' per verpakking (jij had ' + eur(ex.pr) + ')' : k === 'bon' ? 'bonusprijs ' + eur(b.bonus) + ' (jij had ' + eur(ex.bon) + ')' : 'inhoud ' + fmtN(inhB) + ' ' + (uB || 'g') + ' (jij had ' + (ex.inh ? fmtN(ex.inh) + ' ' + ex.u : 'leeg') + ')';
              h += '<label class="vink over"><input type="checkbox" data-sco="' + i + '" data-sck2="' + k + '"' + (b.overVinkt && b.overVinkt[k] ? ' checked' : '') + '> Neem deze over: ' + esc(lbl) + '</label>';
            });
            h += '</div>';
          }
          if (inhB && !ex.inh) h += '<p class="hint" style="margin:4px 0 0">Inhoud uit de bonnaam: ' + fmtN(inhB) + ' ' + (uB || 'g') + ' (leeg veld, wordt ingevuld).</p>';
        }
        if (b.keuze === 'nieuw') {
          if (inhB) h += '<p class="hint" style="margin:2px 0 0">Inhoud uit de bonnaam: ' + fmtN(inhB) + ' ' + (uB || 'g') + '.</p>';
        }
        if (b.keuze === 'nieuw') h += '<div style="margin-top:6px">' + catWidget('bon' + i, function () { return b.cat || []; }, 'boncat', 'data-i="' + i + '"') + '</div>';
        if (b.aan && (!b.keuze || ((b.keuze === 'zoek' || b.keuze === 'kies') && !ex))) h += '<p class="hint" style="margin:8px 0 0;font-weight:700">⚠ Kies hierboven wat je wilt.</p>';
        if (persK.length) h += '<button class="tolink" style="margin-top:6px" data-act="sckorttoew" data-i="' + i + '">' + (b.kortToeg ? '\u2713 Korting ' + esc(b.kortToeg.n) + ' toegewezen \u2014 tik om te wijzigen' : '\u2193 Persoonlijke korting toewijzen aan deze regel') + '</button>';
        if (b.onzeker.length) h += '<p class="hint" style="margin:4px 0 0">Let op: ' + esc(b.onzeker.join('; ')) + '</p>';
        h += '</div>';
      });
      // v46.3: naamloze persoonlijke kortingen (nooit automatisch gekoppeld)
      if (persK.length) {
        h += '<div class="rcard" style="padding:10px;margin-bottom:8px"><p style="margin:0 0 6px;font-weight:700">Persoonlijke korting op de bon</p>';
        persK.forEach(function (b) { h += '<p style="margin:2px 0">' + esc(b.n) + ' &nbsp;<b>' + eur(b.pr) + '</b></p>'; });
        h += '<p class="hint" style="margin:6px 0 0">Deze korting is aan géén product gekoppeld. Bij een productregel kun je hem hieronder handmatig toewijzen (hoeft niet).</p></div>';
      }
      if (apartN) {
        var tot = 0, lijstA = [];
        P.bon.forEach(function (b, i) {
          if (!b.geenEten) return;
          if (b.pr != null) tot += b.pr;
          var warn = (isBonusKortingRegel(b) && !b.koppelOk) ? ' <span class="hint" style="color:#b00">⚠ niet gekoppeld — geen product gevonden dat hierop past</span>' : '';
          lijstA.push('<div style="display:flex;gap:8px;align-items:center;margin:4px 0;flex-wrap:wrap"><span style="flex:1">' + esc(b.n) + warn + (b.koppelOk ? ' <span class="hint">→ korting verwerkt bij het product</span>' : '') + '</span><b>' + (b.pr != null ? eur(b.pr) : '—') + '</b><button class="fchip" data-act="scbondel" data-i="' + i + '" aria-label="Regel verwijderen">✕</button></div>');
        });
        h += '<div class="rcard" style="padding:10px;margin-bottom:8px"><p style="margin:0 0 6px;font-weight:700">♻️ Statiegeld &amp; geen eten &nbsp;<span class="hint" style="font-weight:400">totaal ' + eur(tot) + '</span></p>' + lijstA.join('') +
          '<p class="hint" style="margin:8px 0 0">Automatisch apart gehouden — statiegeld, geen-eten-producten en spaarregels tellen niet als product en worden nooit als product bewaard. Je hoeft hier niets aan te tikken.</p></div>';
      }
      h += '<div class="btns"><button class="btn main" data-act="scbonsave">Bewaar de aangevinkte</button><button class="btn" data-act="scnone">Niets bewaren</button></div>';
    }
    body.innerHTML = h; body.scrollTop = keep;
    if (actKey) { var el2 = body.querySelector('[data-sc="' + actKey + '"], [data-pov="' + actKey + '"]'); if (el2) el2.focus({ preventScroll: true }); } // v51: focus herstellen
  }
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t || !S.sc || !t.getAttribute) return;
    var i = t.getAttribute('data-sci'); if (i == null) return;
    var it = S.sc.items[+i]; if (!it) return;
    var k = t.getAttribute('data-sck');
    if (k === 'n') it.n = t.value;
    else if (k.indexOf('w_') === 0) { var wk = k.slice(2), v = String(t.value).trim() ? lGetal(t.value) : null; if (v == null) delete it.w[wk]; else it.w[wk] = v; }
    else { var x = String(t.value).trim() ? lGetal(String(t.value).replace('€', '')) : null; it[k] = x; }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute || !S.sc) return;
    var smi = t.getAttribute('data-scmi');
    if (smi != null) {
      var cmp = t.getAttribute('data-scmp') || '';
      var itm = S.sc.items[+smi];
      if (itm) {
        if (cmp === '__zoek') { itm.zoek = true; itm.pid = null; itm.hoe = 'bijwerk'; }
        else { itm.zoek = false; itm.pid = cmp; itm.hoe = t.getAttribute('data-scmh') === 'vervang' ? 'vervang' : 'bijwerk'; }
        itm.overVinkt = {}; renderSC(); return;
      }
      var bb = S.sc.bon[+smi];
      if (bb) { bb.pid = cmp; renderSC(); }
      return;
    }
    var sco = t.getAttribute('data-sco');
    if (sco != null) {
      var its = S.sc.items[+sco];
      if (its) { its.overVinkt = its.overVinkt || {}; its.overVinkt[t.getAttribute('data-sck2')] = t.checked; return; }
      var bb2 = S.sc.bon[+sco];
      if (bb2) { bb2.overVinkt = bb2.overVinkt || {}; bb2.overVinkt[t.getAttribute('data-sck2')] = t.checked; }
      return;
    }
  });
  async function scLees() {
    var P = S.sc; if (!P || !scFiles.length || P.busy) return;
    if (P.mode === 'bon') return bonLees();
    P.busy = true; P.items = []; P.msg = ''; renderSC();
    var fouten = [], lijst = [];
    try {
      if (P.one) {
        P.msg = 'Alle ' + scFiles.length + ' foto\'s lezen in één vraag...'; renderSC();
        try { lijst = await gemLees(scFiles, true); } catch (e) { fouten.push(gemFout(e)); }
      } else {
        for (var k = 0; k < scFiles.length; k++) {
          if (S.sc !== P) return;
          P.msg = 'Foto ' + (k + 1) + ' van ' + scFiles.length + ' lezen...'; renderSC();
          try { lijst = lijst.concat(await gemLees([scFiles[k]], false)); } catch (e) { fouten.push('foto ' + (k + 1) + ': ' + gemFout(e)); }
        }
      }
    } finally { if (S.sc === P) P.busy = false; }
    if (S.sc !== P) return;
    P.items = lijst;
    P.msg = lijst.length ? 'Klaar. Controleer het overzicht; er is nog niets bewaard.' + (fouten.length ? '\nNiet gelukt: ' + fouten.join('; ') : '') : 'Niets gevonden. ' + fouten.join('; ') + (!P.one && scFiles.length > 1 ? '\nTip: staan prijs en tabel op verschillende foto\'s van hetzelfde product? Vink dan "Deze foto\'s horen bij één product" aan.' : '');
    renderSC();
  }

  // ---- v45a.1: bon-crop (privacy) - hulpfuncties
  function scCropRead() {
    var wrap = document.getElementById('scrop'), box = document.getElementById('scropbox');
    if (!wrap || !box) return null;
    return {
      l: parseFloat(box.style.left), t: parseFloat(box.style.top),
      w: parseFloat(box.style.width), h: parseFloat(box.style.height)
    };
  }
  function scCropGo() {
    var P = S.sc; if (!P || !scFiles.length) return;
    var idx = Math.min(P.cropN || 0, scFiles.length - 1);
    var c = scCropRead(); if (!c) return;
    P.crop = c;
    var img = new Image();
    img.onload = function () {
      try {
        var natW = img.naturalWidth, natH = img.naturalHeight;
        var sx = (c.l / 100) * natW, sy = (c.t / 100) * natH;
        var sw = (c.w / 100) * natW, sh = (c.h / 100) * natH;
        var cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(sw)); cv.height = Math.max(1, Math.round(sh));
        var ctx = cv.getContext('2d');
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
        cv.toBlob(function (blob) {
          if (S.sc !== P) return;
          // v45b.8: alleen bij gelukt bijsnijden gaat een foto verder. Bij mislukken niets versturen (privacy).
          if (!blob) { toast('Bijsnijden mislukt. Er is niets naar Mistral gestuurd.'); return; }
          var croppedFile = new File([blob], scFiles[idx].name || 'bon.jpg', { type: 'image/jpeg' });
          if (!scOrig[idx]) { scOrig[idx] = scFiles[idx]; scOrigUrls[idx] = scUrls[idx]; }
          else if (scUrls[idx] !== scOrigUrls[idx]) { try { URL.revokeObjectURL(scUrls[idx]); } catch (e) {} }
          scFiles[idx] = croppedFile;
          scUrls[idx] = URL.createObjectURL(blob);
          P.cropN = idx + 1;
          if (P.cropN >= scFiles.length) {
            P.cropDone = true;
            toast(scFiles.length > 1 ? 'Alle foto\'s bijgesneden. Alleen de vierkanten worden gelezen' : 'Bon bijgesneden. Alleen het vierkant wordt gelezen');
            renderSC();
            scLees();
          } else { toast('Foto ' + (idx + 1) + ' bijgesneden. Nu foto ' + (idx + 2)); renderSC(); }
        }, 'image/jpeg', 0.92);
      } catch (e) { toast('Bijsnijden mislukt. Er is niets naar Mistral gestuurd.'); }
    };
    img.onerror = function () { toast('Foto laden mislukt'); };
    img.src = scUrls[idx];
  }
  // v45b.9: terug naar de originele foto('s) en opnieuw een stuk kiezen. Niets wordt verstuurd.
  function scRecrop() {
    var P = S.sc; if (!P || P.busy) return;
    scFiles = scFiles.map(function (f, i) { return scOrig[i] || f; });
    scUrls = scUrls.map(function (u, i) { var o = scOrigUrls[i]; if (o && o !== u) { try { URL.revokeObjectURL(u); } catch (e) { } } return o || u; });
    P.cropDone = false; P.cropN = 0; P.crop = null; P.bon = []; P.items = []; P.msg = '';
    renderSC();
  }
  // v45a.1: crop-box interactief maken (verslepen + schalen)
  (function initCropBox() {
    var wrap, box, dragging = null, sx = 0, sy = 0, orig = null;
    function bind() {
      wrap = document.getElementById('scrop'); box = document.getElementById('scropbox');
      if (!wrap || !box) return;
      box.addEventListener('pointerdown', function (e) { e.preventDefault(); dragging = 'move'; sx = e.clientX; sy = e.clientY; orig = scCropRead(); });
      box.querySelectorAll('.h').forEach(function (h) {
        h.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); dragging = h.className.replace('h ', ''); sx = e.clientX; sy = e.clientY; orig = scCropRead(); });
      });
    }
    window.addEventListener('pointermove', function (e) {
      if (!dragging || !box || !wrap) return;
      var r = wrap.getBoundingClientRect();
      var dx = (e.clientX - sx) / r.width * 100, dy = (e.clientY - sy) / r.height * 100;
      var l = orig.l, t = orig.t, w = orig.w, h = orig.h;
      if (dragging === 'move') { l += dx; t += dy; }
      else if (dragging === 'br') { w += dx; h += dy; }
      else if (dragging === 'tr') { t += dy; w += dx; h -= dy; }
      else if (dragging === 'bl') { l += dx; w -= dx; h += dy; }
      else if (dragging === 'tl') { l += dx; t += dy; w -= dx; h -= dy; }
      if (l < 0) { w += l; l = 0; } if (t < 0) { h += t; t = 0; }
      if (l + w > 100) w = 100 - l; if (t + h > 100) h = 100 - t;
      if (w < 10) w = 10; if (h < 10) h = 10;
      box.style.left = l + '%'; box.style.top = t + '%';
      box.style.width = w + '%'; box.style.height = h + '%';
    });
    window.addEventListener('pointerup', function () { dragging = null; });
    // observer: als de cropwrap verschijnt, binden
    var obs = new MutationObserver(function () { var nb = document.getElementById('scropbox'); if (nb && nb !== box) bind(); });
    obs.observe(document.body, { childList: true, subtree: true });
    bind();
  })();

  // ---- v44: kassabon lezen (Scanner, modus Kassabon)
  async function bonLees() {
    var P = S.sc; P.busy = true; P.bon = []; P.msg = ''; renderSC();
    var fouten = [], lijst = [];
    try {
      var prodsTxt = S.prijzen.map(function (p) { return JSON.stringify({ id: p.id, naam: p.n, alias: p.alias || [], inhoud: p.inh, eenheid: p.u }); }).join('\n');
      var regels = BONREGELS + '\n\nONZE LIJST met jouw producten (een per regel, als JSON):\n' + prodsTxt;
      if (P.one) {
        P.msg = 'De bon lezen in één vraag...'; renderSC();
        try { lijst = await gemLees(scFiles, true, regels); } catch (e) { fouten.push(gemFout(e)); }
      } else {
        for (var k = 0; k < scFiles.length; k++) {
          if (S.sc !== P) return;
          P.msg = 'Foto ' + (k + 1) + ' van ' + scFiles.length + ' lezen...'; renderSC();
          try { lijst = lijst.concat(await gemLees([scFiles[k]], false, regels)); } catch (e) { fouten.push('foto ' + (k + 1) + ': ' + gemFout(e)); }
        }
      }
    } finally { if (S.sc === P) P.busy = false; }
    if (S.sc !== P) return;
    koppelBonusKortingen(lijst); // v46.3-fix: BONUS-regels als korting koppelen vóór de rest
    P.uwVoordeel = (typeof gemLees.uwVoordeel === 'number') ? gemLees.uwVoordeel : null; // v55.2 PUNT 8f
    P.totaalBon = (typeof gemLees.totaalBon === 'number') ? gemLees.totaalBon : null;
    P.bon = lijst.map(function (b) {
      b.aan = true; b.nOrig = b.n; b.cat = b.cat || null;
      var cln = stripSupermarkt(b.n); if (cln && cln !== b.n) b.n = cln;
      if (b.aiN && !b.statiegeld && !b.geenEten && normName(b.aiN) !== normName(b.n)) { b.boniN = b.n; b.n = stripSupermarkt(b.aiN); }
      if (b.matchId) { var ex = prodById(b.matchId); if (ex) { b.match = ex.n; if (b.aiInh == null && ex.inh) { b.aiInh = ex.inh; b.aiU = (ex.u === 'ml' && ex.lit) ? 'l' : ex.u; } } else b.matchId = null; } // v47.3: inhoud uit eigen product bij match (nooit gokken)
      else if (b.match) { var f = findProd(b.match); if (f) { b.matchId = f.id; b.match = f.n; if (b.aiInh == null && f.inh) { b.aiInh = f.inh; b.aiU = (f.u === 'ml' && f.lit) ? 'l' : f.u; } } else b.matchId = null; }
      // v47.3.3: kandidaat alleen bij echte naam-overeenkomst (anders Jozo-achtige foute koppeling); niets voorgekozen bij twijfel
      var sg0 = null;
      if (b.matchId) { var ex0 = prodById(b.matchId); if (ex0 && (normName(ex0.n) === normName(b.n) || bijnaDezelfde(ex0.n, b.n) || b.zeker === true)) sg0 = ex0; else b.matchId = null; }
      b.sug = b.matchId || null; b.pid = null;
      if (sg0 && onderscheidVerschil(b.n, sg0.n).length) b.zeker = false;
      if (isBonusKortingRegel(b) && b.koppelOk) { b.geenEten = true; b.keuze = 'apart'; } // v46.3-fix: gekoppelde BONUS-regel niet als product
      else b.keuze = b.geenEten ? 'apart' : (sg0 ? (b.zeker ? 'dit' : null) : (vindMultiples(b.n).length ? null : 'nieuw'));
      return b;
    });
    P.msg = lijst.length ? 'Klaar. Controleer per regel de match; er is nog niets bewaard.' + (fouten.length ? '\nNiet gelukt: ' + fouten.join('; ') : '') : 'Mistral vond geen productregels in dit stuk van de bon.\nTik op "Opnieuw bijsnijden" en kies alleen het deel met productnamen en prijzen. Of maak een nieuwe foto: plat, met goed licht, recht van boven.' + (fouten.length ? '\n' + fouten.join('; ') : '');
    renderSC();
  }
  // v45b.7: het gekozen product van een bonregel (of null = nieuw product / nog niets gekozen)
  function bonProd(b) {
    if (b.keuze === 'dit') return b.sug ? prodById(b.sug) : null;
    if (b.keuze === 'kies' || b.keuze === 'zoek') return b.pid ? prodById(b.pid) : null;
    return null;
  }
  // v45b.7: de keuze per bonregel (dit product / mogelijk product / ander product zoeken / nieuw product)
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute || !S.sc || !S.sc.bon) return;
    var bhi = t.getAttribute('data-bhoe');
    if (bhi != null) { var bh2 = S.sc.bon[+bhi]; if (bh2) { bh2.hoe = t.value; renderSC(); } return; }
    var bki = t.getAttribute('data-bk'); if (bki == null) return;
    var bb = S.sc.bon[+bki]; if (!bb) return;
    var v = t.getAttribute('data-bv') || '';
    if (v === 'dit') { bb.keuze = 'dit'; bb.pid = null; }
    else if (v === 'nieuw') { bb.keuze = 'nieuw'; bb.pid = null; }
    else if (v === 'zoek') { bb.keuze = 'zoek'; bb.pid = null; }
    else if (v.indexOf('kies:') === 0) { bb.keuze = 'kies'; bb.pid = v.slice(5); }
    bb.hoe = null; bb.overVinkt = {};   // vinkjes "Neem deze over" horen bij het gekozen product
    renderSC();
  });

  // v46.3: kaart-/spaarregels zonder productnaam herkennen (nooit automatisch koppelen)
  function heeftProductNaam(n) {
    var t = String(n || '').trim().toUpperCase();
    if (!t) return false;
    return !/^(MIJN AH|AH |BONUSKAART|BONUS CARD|SPAAR|CARE|INLEG|STATIEGELD|STATIEL|HEFFING|KORTING|BETAALD|CONTANT|PIN|TERUG|MILES)/.test(t);
  }

  // v46.3-fix: "BONUS <afgeknipte productnaam>" is een kortingsregel, geen productregel
  function isBonusKortingRegel(b) {
    var t = String(b.n || '').trim().toUpperCase();
    // v47.3.3: ook Lidl (ACTIEPRIJS) en Jumbo (ACTIE <naam>); altijd mét bedrag; teken-vrij
    // v55.2 (13 nov) PUNT 8 HOOFDREGEL: een negatief bedrag is een korting, geen product — élke regel met pr < 0 is een kortingsregel (ook AH "Bonus:"-regels en Lidl "In prijs verlaagd")
    if (b.pr != null && b.pr < 0) return true;
    if (b.kortPr != null) return true; // v55.2: negatief bedrag al verplaatst naar kortPr (mapping)
    return /^(BONUS|ACTIEPRIJS|ACTIE PRIJS|ACTIE|AANBIEDING|VOORDEEL|IN PRIJS VERLAAGD)\b/.test(t) && b.pr != null && b.pr !== 0;
  }
  function bonusKortingNaam(n) {
    return String(n || '').trim().replace(/^(BONUS|ACTIEPRIJS|ACTIE PRIJS|ACTIE|AANBIEDING|VOORDEEL|IN PRIJS VERLAAGD)\s*/i, '').replace(/^(AH|BBOX|BB)\s+/i, '').trim(); // v47.3.3 + v55.2 PUNT 8a: AH/BB/BBOX-prefix eraf (markeerletters zijn labels)
  }
  // v46.3-fix: match afgekorte bonnaam op begin van productnaam (case-insensitive, spaties weg)
  function bonNaamMatch(kortNaam, prodNaam) {
    var a = normName(kortNaam), c = normName(prodNaam);
    if (!a || !c) return false;
    if (c === a || c.indexOf(a) === 0) return true; // afgekorte naam is begin van productnaam
    // bon-printer knipt spaties weg: "AHGEROOKTEZA" matcht "ah gerookte zalm" via samengevoegde vorm
    var aJoin = a.replace(/ /g, ''), cJoin = c.replace(/ /g, '');
    if (aJoin.length >= 5 && cJoin.indexOf(aJoin) === 0) return true;
    var aw = a.split(' '), cw = c.split(' ');
    if (aw[0] === cw[0] && aw[0].length >= 2 && cw.slice(0, aw.length).join(' ').indexOf(aw.join(' ')) === 0) return true;
    return false;
  }
  // v46.3-fix: koppel BONUS-kortingsregels aan productregels (vóór de andere mapping)
  function koppelBonusKortingen(bon) {
    var kortingen = bon.filter(isBonusKortingRegel);
    kortingen.forEach(function (k) {
      var kn = bonusKortingNaam(k.n);
      var targets = bon.filter(function (b) { return b !== k && !b.geenEten && !isBonusKortingRegel(b) && bonNaamMatch(kn, b.nOrig || b.n); });
      // v55.2 (13 nov) PUNT 8b: Lidl — "In prijs verlaagd"/"Actieprijs" direct ONDER het product = korting van dat product (positioneel)
      if (!targets.length && /^(IN PRIJS VERLAAGD|ACTIEPRIJS)$/i.test(String(k.n || '').trim())) {
        var idxK = bon.indexOf(k);
        for (var bi = idxK - 1; bi >= 0; bi--) { var cand = bon[bi]; if (cand && !isBonusKortingRegel(cand) && !cand.geenEten && cand.pr != null && cand.pr > 0) { targets = [cand]; break; } }
      }
      if (!targets.length) { k.koppelFail = true; return; } // blijft aparte regel met waarschuwing
      targets.forEach(function (t) {
        var kBedrag = k.pr != null ? k.pr : -(k.kortPr || 0); // v55.2: negatief bedrag kan in pr óf kortPr zitten
        var per = Math.abs(kBedrag) / targets.length; // v55.2 (13 nov) PUNT 8d: korting voor de HELE productregel, NIET per verpakking (delen door aantal eraf)
        var korPer = Math.round(per * 100) / 100;
        t.bonus = (t.pr != null) ? Math.round((t.pr - korPer) * 100) / 100 : korPer; // bonusprijs = productprijs − korting, nooit het negatieve bedrag zelf
        t.bonusVanKorting = true; // v55.2 PUNT 8g: dit is een korting, géén echte bonusprijs-regel → veld "Bonusprijs uit de bon" blijft leeg
        t.korting = (t.korting ? t.korting + '; ' : '') + String(k.n).trim() + ' ' + eur(kBedrag);
      });
      k.geenEten = true; k.koppelOk = true; // géén extra productregel: regel wordt apart blok
    });
  }
  function bonNaamSchoon(b) {
    var nm = String(b.n || '').trim();
    var kaal = nm.replace(new RegExp(BON_INH.source, 'ig'), ' ').replace(/\(\s*\)/g, ' ').replace(/\s+/g, ' ').trim().replace(/^[,;.\-\s]+|[,;.\-\s]+$/g, '');
    return kaal ? kaal.replace(/^\w/, function (c) { return c.toUpperCase(); }) : nm;
  }
  // v46.1: na "Bewaar de aangevinkte" openen de "Nieuw product maken"-keuzes één voor één het formulier (akkoord Marlijn 29 okt, optie A)
  function scFormQueueStart() {
    S.scFormTotaal = (S.scFormQ || []).length;
    if (S.scFormTotaal) {
      // v46.1-fix (canvas): scanner eerst dicht — het formulier komt dan vanzelf in beeld, geen extra ✕ nodig
      var bewaarQ = S.scFormQ, bewaarT = S.scFormTotaal;
      forceCloseSC();
      S.scFormQ = bewaarQ; S.scFormTotaal = bewaarT;
      scFormNext();
    } else forceCloseSC();
  }
  function scFormNext() {
    if (!S.scFormQ || !S.scFormQ.length) { S.scFormTotaal = 0; if (S.sc && !S.prod) forceCloseSC(); return; } // v46.1: teller weer uit als de wachtrij leeg is
    var p = S.scFormQ.shift();
    var nr = S.scFormTotaal - S.scFormQ.length;
    prodOpen(p);
    if (S.scFormTotaal > 1) toast('Nieuw product ' + nr + ' van ' + S.scFormTotaal + ' — bewaren of ✕ overslaan');
  }
  function bonSave() {
    var P = S.sc; if (!P) return;
    var apart = P.bon.filter(function (b) { return b.geenEten; }).length; // v46.3: statiegeld/geen eten wordt nooit als product bewaard
    var rows = P.bon.filter(function (b) { return b.aan && !b.geenEten; });
    var overgeslagen = 0; // v47.4.3: vangnet — minprijs is een korting, nooit een product
    rows = rows.filter(function (b) { var pr0 = bonPerPr(b); if (pr0 != null && pr0 <= 0) { overgeslagen++; return false; } return true; });
    if (!rows.length) { toast(apart ? 'Alleen apart-gehouden regels (statiegeld/geen eten) — er is geen product om te bewaren' : 'Niets aangevinkt'); return; }
    // v45b.7: geen stille keuze. Elke aangevinkte regel heeft een keuze nodig.
    var open = rows.filter(function (b) { return !b.keuze || (b.keuze !== 'nieuw' && !bonProd(b)); });
    if (open.length) { toast('Kies eerst bij "' + (String(open[0].n || '').trim() || 'een regel') + '" wat je wilt'); return; }
    var dubbel = rows.filter(function (b) { return b.keuze === 'nieuw' && S.prijzen.some(function (p) { return normName(p.n) === normName(bonNaamSchoon(b)); }); });
    if (dubbel.length) { toast('Er is al een product met precies de naam "' + bonNaamSchoon(dubbel[0]) + '". Geef het een andere naam.'); return; }
    var dubV = rows.filter(function (b) { var e = bonProd(b); return e && b.hoe === 'vervang' && S.prijzen.some(function (p) { return p.id !== e.id && normName(p.n) === normName(bonNaamSchoon(b)); }); });
    if (dubV.length) { toast('Er is al een ander product met de naam "' + bonNaamSchoon(dubV[0]) + '". Geef de regel een andere naam.'); return; }
    var before = JSON.stringify(S.prijzen), nieuw = 0, bij = 0, gelijk = 0, verv = 0, stuks = 0;
    rows.forEach(function (b) {
      var ex = bonProd(b);
      var prPer = bonPerPr(b); // v47.3.1: bewaar prijs per verpakking, niet het totaal
      stuks += Math.max(1, b.aantal || 1);
      var inhM = BON_INH.exec(b.nOrig || b.n), inhB = inhM ? inhGetal(inhM) : null, uB = inhM ? inhEenheid(inhM[2]) : null;
      var ovk = b.overVinkt || {};
      var effBonus = b.bonus; // v46.3: handmatig toegewezen persoonlijke korting telt als bonus mee
      if (b.kortToeg && b.kortToeg.pr != null) effBonus = (effBonus || 0) + b.kortToeg.pr;
      if (ex && b.hoe === 'vervang') { scVervang(ex, { n: bonNaamSchoon(b), inh: inhB, u: uB, pr: prPer, bon: effBonus }); verv++; } // v47.3: pr = per verpakking
      else if (ex) {
        var snap = JSON.stringify(ex);
        if (prPer != null && ex.pr == null) ex.pr = prPer; // v47.3: per verpakking
        if (effBonus != null && ex.bon == null) ex.bon = effBonus;
        if (inhB && !ex.inh) { ex.inh = inhB; ex.u = uB; }
        if (ovk.pr && prPer != null) ex.pr = prPer; // v47.3: per verpakking
        if (ovk.bon && effBonus != null) ex.bon = effBonus;
        if (ovk.inh && inhB) { ex.inh = inhB; ex.u = uB; }
        if (snap !== JSON.stringify(ex)) bij++; else gelijk++;
      } else {
        var nm = bonNaamSchoon(b); if (!nm) return;
        var aiInh = (b.aiInh != null && !inhB) ? b.aiInh : null, aiLit = !!(aiInh != null && b.aiU === 'l'), aiU = aiLit ? 'ml' : (aiInh != null && (b.aiU === 'ml' || b.aiU === 'g' || b.aiU === 'stuk') ? b.aiU : null);
        if (aiLit) aiInh = aiInh * 1000;
        var aiW = b.aiW || {}, aiKc = (b.aiKc != null && Object.keys(aiW).length) ? b.aiKc : null;
        var slimmeNaam = slimmeOpzoekNaam(nm, b.nOrig || b.n || ''); // supermarkt achteraan -> OFF matcht op merkveld
        var npB = cleanProd({ id: uid(), n: slimmeNaam, gemaakt: vandaagId(), u: (inhB || aiInh) ? (uB || aiU || 'g') : '', lit: aiLit, inh: inhB || aiInh, pr: prPer, bon: effBonus, alias: [], w: JSON.parse(JSON.stringify(aiW)), kc: aiKc, cat: (b.cat && b.cat.length) ? b.cat.slice(0, 3) : guessCats(slimmeNaam), foto: '' }); // v47.4: aanmaak-datum; v47.3.2: geen inhoud = geen eenheid; v47.3: pr = per verpakking
        S.prijzen.push(npB);
        if (b.keuze === 'nieuw') { (S.scFormQ = S.scFormQ || []).push(npB); } // v46.1: daarna één voor één het formulier
        nieuw++;
      }
    });
    if (!tryStore()) { S.prijzen = JSON.parse(before); toast('Opslaan lukt niet'); return; }
    S.status = 'ok';
    var delen = []; // v47.3.2: één duidelijke zin, elk begrip één keer
    if (nieuw) delen.push(nieuw + ' nieuw product' + (stuks > 1 ? ' (' + stuks + ' stuks)' : ''));
    if (bij + verv) delen.push((bij + verv) + ' bijgewerkt');
    if (gelijk) delen.push(gelijk + ' ongewijzigd');
    if (apart) delen.push(apart + ' apart gehouden');
    if (overgeslagen) delen.push(overgeslagen + ' regel' + (overgeslagen > 1 ? 's' : '') + ' overgeslagen (minprijs = korting, geen product)');
    toast(delen.length ? 'Bewaard: ' + delen.join(' \u00b7 ') : (overgeslagen ? overgeslagen + ' regel overgeslagen (minprijs = korting, geen product)' : 'Niets gewijzigd'));
    scFormQueueStart();
  }
  // v46-scanner: keuzeblok bij een gescand product. Niets voorgekozen; de app gokt niet.
  function scKeuzeBox(it, i, cands, ex, hoe, chosenId) {
    if (!cands.length && !it.zoek && it.pid !== '') {
      return '<div class="seg" style="margin:8px 0 0"><button class="pill" data-act="sczoek" data-i="' + i + '">Hoort dit bij een product dat je al hebt?</button></div>';
    }
    var h = '<div class="pricebox" style="margin:8px 0 0"><p style="margin:0 0 4px"><b>' + (cands.length > 1 ? 'Meerdere van jouw producten lijken hierop. Kies zelf wat je wilt:' : 'Is dit een product dat je al hebt? Kies zelf wat je wilt:') + '</b></p>';
    function radio(val, hw, checked, html) {
      return '<label class="vink"><input type="radio" name="scm' + i + '" data-scmi="' + i + '" data-scmp="' + esc(val) + '"' + (hw ? ' data-scmh="' + hw + '"' : '') + (checked ? ' checked' : '') + '> <span>' + html + '</span></label>';
    }
    cands.forEach(function (p) {
      var lab = '<b>' + esc(p.n) + '</b>' + (p.inh ? ' (' + esc(inhLabel(p)) + ')' : '');
      h += radio(p.id, 'bijwerk', chosenId === p.id && hoe === 'bijwerk', 'Bijwerken: ' + lab + '<br><small class="hint" style="margin:0">Alleen lege velden worden aangevuld</small>');
      h += radio(p.id, 'vervang', chosenId === p.id && hoe === 'vervang', 'Vervangen: ' + lab + ' wordt dit nieuwe product<br><small class="hint" style="margin:0">Naam, inhoud, prijs en voedingswaarden worden door de nieuwe vervangen</small>');
    });
    h += radio('', '', it.pid === '', '<b>Nieuw product maken</b>');
    h += radio('__zoek', '', !!it.zoek && it.pid == null, '<b>Ander product kiezen…</b>');
    if (it.zoek && it.pid == null) {
      h += '<div class="dd" data-dd="' + i + '" data-ddmode="prod"><input class="note" data-ddq="' + i + '" type="text" autocomplete="off" placeholder="Typ om te zoeken in mijn producten…" aria-label="Zoek een product om aan te koppelen" value="" style="margin-top:8px"><div class="dd-list">' +
        (S.prijzen.length ? S.prijzen.map(function (p) {
          return '<button type="button" class="dd-item" data-ddid="' + p.id + '" data-ddn="' + esc(p.n) + '">' + esc(p.n) + (p.inh ? ' <small>' + esc(inhLabel(p)) + '</small>' : '') + '</button>';
        }).join('') : '<div class="dd-empty">Nog geen producten in je lijst</div>') + '</div></div>';
    }
    if (chosenId == null && it.pid == null) h += '<p class="hint" style="margin:4px 0 0">⚠ Kies hierboven wat je wilt.</p>';
    if (it.pid === '' && S.prijzen.some(function (p) { return normName(p.n) === normName(it.n); })) h += '<p class="hint" style="margin:4px 0 0">⚠ Er is al een product met precies deze naam. Pas de naam hierboven aan, bijvoorbeeld met de inhoud erbij.</p>';
    if (ex && hoe === 'vervang') h += scVervangTekst(ex, it);
    return h + '</div>';
  }
  function scWKeys(r) { return Object.keys(r.w || {}).filter(function (k) { return r.w[k] != null; }); }
  function scVervangTekst(ex, it) {
    var rows = [], nw = String(it.n || '').trim();
    if (nw && normName(nw) !== normName(ex.n)) rows.push('Naam: ' + esc(ex.n) + ' → ' + esc(nw) + ' (de oude naam blijft herkend in recepten)');
    if (it.inh && (it.inh !== ex.inh || (it.u || ex.u || 'g') !== ex.u)) rows.push('Inhoud: ' + (ex.inh ? esc(inhLabel(ex)) : 'leeg') + ' → ' + esc(fmtN(it.inh) + ' ' + ((it.u || ex.u || 'g') === 'stuk' ? 'stuks' : (it.u || ex.u || 'g'))));
    if (it.pr != null && it.pr !== ex.pr) rows.push('Prijs: ' + (ex.pr != null ? esc(eur(ex.pr)) : 'leeg') + ' → ' + esc(eur(it.pr)));
    if ((it.pr != null || it.bon != null) && ex.bon != null) rows.push('Oude bonusprijs ' + esc(eur(ex.bon)) + (it.bon != null ? ' → ' + esc(eur(it.bon)) : ' wordt gewist'));
    else if (it.bon != null) rows.push('Bonusprijs: ' + esc(eur(it.bon)));
    if (scWKeys(it).length) rows.push('Voedingswaarden en calorieën: de oude worden vervangen door de nieuwe gelezen waarden');
    return '<div class="pricebox" style="margin:8px 0 0"><p style="margin:0 0 4px"><b>Dit verandert bij vervangen:</b></p>' + (rows.length ? rows.map(function (x) { return '<p class="hint" style="margin:2px 0">' + x + '</p>'; }).join('') : '<p class="hint" style="margin:2px 0">Er verandert niets.</p>') + '<p class="hint" style="margin:6px 0 0">Je week en recepten blijven aan dit product gekoppeld. Maak liever eerst een reservekopie: terugdraaien kan niet.</p></div>';
  }
  function scVervang(ex, r) {
    var oud = ex.n, nw = String(r.n || '').trim();
    if (nw && normName(nw) !== normName(oud)) {
      ex.alias = ex.alias || [];
      if (ex.alias.indexOf(oud) < 0 && ex.alias.length < 10) ex.alias.push(oud);
      ex.n = nw;
    }
    if (r.inh) { ex.inh = r.inh; ex.u = r.u || ex.u || 'g'; delete ex.lit; }
    if (r.pr != null) ex.pr = r.pr;
    if (r.pr != null || r.bon != null) { delete ex.bon; delete ex.bonTot; if (r.bon != null) ex.bon = r.bon; }
    if (scWKeys(r).length) {
      ex.w = JSON.parse(JSON.stringify(r.w));
      if (r.kc != null) ex.kc = r.kc; else delete ex.kc;
    } else if (r.kc != null) ex.kc = r.kc;
  }
  function scSave() {
    var P = S.sc; if (!P) return;
    if (P.mode === 'bon') return bonSave();
    var rows = P.items.filter(function (it) { return it.aan; });
    if (!rows.length) { toast('Niets aangevinkt'); return; }
    if (rows.some(function (it) { return !String(it.n || '').trim(); })) { toast('Een aangevinkt product heeft geen naam'); return; }
    var openR = rows.filter(function (it) { return it.pid == null && !S.prijzen.some(function (p) { return normName(p.n) === normName(it.n); }) && (vindMultiples(it.n).length || it.zoek); });
    if (openR.length) { toast('Kies eerst bij "' + String(openR[0].n).trim() + '" wat je wilt'); return; }
    var dupN = rows.filter(function (it) { return it.pid === '' && S.prijzen.some(function (p) { return normName(p.n) === normName(it.n); }); });
    if (dupN.length) { toast('Er is al een product met precies de naam "' + String(dupN[0].n).trim() + '". Geef het een andere naam.'); return; }
    var dupV = rows.filter(function (it) { return it.hoe === 'vervang' && it.pid && S.prijzen.some(function (p) { return p.id !== it.pid && normName(p.n) === normName(it.n); }); });
    if (dupV.length) { toast('Er is al een ander product met de naam "' + String(dupV[0].n).trim() + '". Geef het een andere naam.'); return; }
    var before = JSON.stringify(S.prijzen), n = 0, nwN = 0, bijN = 0, vervN = 0;
    rows.forEach(function (r) {
      if (r.u === 'l') { r = Object.assign({}, r, { u: 'ml', lit: true, inh: r.inh != null ? r.inh * 1000 : r.inh }); } // v46.1: échte liter
      var ex = null; S.prijzen.forEach(function (p) { if (normName(p.n) === normName(r.n)) ex = p; });
      if (r.pid === '') ex = null;
      else if (r.pid) { var mp = prodById(r.pid); if (mp) ex = mp; }
      if (ex && r.hoe === 'vervang' && r.pid) { scVervang(ex, r); vervN++; }
      else if (ex) {
        bijN++;
        if (r.pr != null && ex.pr == null) ex.pr = r.pr;
        if (r.bon != null && ex.bon == null) ex.bon = r.bon;
        if (r.inh && !ex.inh) { ex.inh = r.inh; ex.u = r.u; }
        if (r.kc != null && ex.kc == null) ex.kc = r.kc;
        if (!ex.w) ex.w = {};
        Object.keys(r.w).forEach(function (k) { if (r.w[k] != null && ex.w[k] == null) ex.w[k] = r.w[k]; });
        var ovk = (r.overVinkt || {});
        if (ovk.pr && r.pr != null) ex.pr = r.pr;
        if (ovk.bon && r.bon != null) ex.bon = r.bon;
        if (ovk.inh && r.inh) { ex.inh = r.inh; ex.u = r.u; }
        if (ovk.kc && r.kc != null) ex.kc = r.kc;
        W_FIELDS.forEach(function (f) { if (ovk['w_' + f[0]] && r.w[f[0]] != null) ex.w[f[0]] = r.w[f[0]]; });
      } else { var npS = cleanProd({ id: uid(), n: r.n.trim(), u: r.u, lit: !!r.lit, inh: r.inh, pr: r.pr, bon: r.bon, alias: [], w: JSON.parse(JSON.stringify(r.w)), kc: r.kc, foto: '' }); S.prijzen.push(npS); if (r.pid === '') { (S.scFormQ = S.scFormQ || []).push(npS); } nwN++; } // v46.1: keuze "Nieuw product maken" → daarna één voor één het formulier
      n++;
    });
    if (!tryStore()) { S.prijzen = JSON.parse(before); toast('Opslaan lukt niet'); return; }
    S.status = 'ok';
    var dl = []; if (nwN) dl.push(nwN + ' nieuw'); if (bijN) dl.push(bijN + ' bijgewerkt'); if (vervN) dl.push(vervN + ' vervangen');
    toast(dl.length ? dl.join(', ') : (n + ' bewaard')); scFormQueueStart();
  }
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || t.id !== 'scfile' || !S.sc) return;
    var fs = Array.prototype.slice.call(t.files || []); t.value = '';
    fs.forEach(function (f) { scFiles.push(f); scUrls.push(URL.createObjectURL(f)); });
    if (fs.length && S.sc.mode === 'bon') S.sc.cropDone = false;
    S.sc.items = []; S.sc.bon = []; S.sc.msg = ''; renderSC();
  });
  // v45a.1: bon-naam bewerken (input veld)
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute || !S.sc) return;
    var bn = t.getAttribute('data-boni-n');
    if (bn != null) { var bN = S.sc.bon[+bn]; if (bN) bN.n = t.value; return; }
    var ba = t.getAttribute('data-boni-a');
    if (ba != null) { var bA = S.sc.bon[+ba]; if (bA) { var av = parseInt(String(t.value).replace(',', '.'), 10); bA.aantal = isFinite(av) && av >= 1 ? av : 1; } return; } // v47.3: live, zonder re-render
    var bo = t.getAttribute('data-boni-bon'); if (bo == null) return;
    var bb = S.sc.bon[+bo]; if (!bb) return;
    var bv0 = String(t.value).trim() ? lGetal(String(t.value).replace('€', '')) : null; bb.bonus = (bv0 != null && bv0 > 0) ? bv0 : null; // v55.2 PUNT 8g: een prijs is nooit negatief
  });
  // v47.3: bij verlaten van het aantal-veld opnieuw renderen (prijs per verpakking tonen)
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute || !S.sc || !S.sc.bon) return;
    var ba = t.getAttribute('data-boni-a'); if (ba != null) { var bA = S.sc.bon[+ba]; if (bA) { var av = parseInt(String(t.value).replace(',', '.'), 10); bA.aantal = isFinite(av) && av >= 1 ? av : 1; renderSC(); } return; }
  });
  // v45a.1: doorzoekbare dropdown (bon-modus)
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute || !S.sc) return;
    var ddq = t.getAttribute('data-ddq'); if (ddq == null) return;
    var dd = t.closest('.dd'); if (!dd) return;
    var v = t.value.toLowerCase();
    var items = dd.querySelectorAll('.dd-item');
    var any = false;
    items.forEach(function (it) {
      var txt = (it.getAttribute('data-ddn') || it.textContent).toLowerCase();
      var show = (dd.getAttribute('data-ddmode') === 'bon') ? (!!v && txt.indexOf(v) >= 0) : (!v || txt.indexOf(v) >= 0); // wens 8 nov: in de scanner resultaten alleen tijdens typen, leeg veld = leeg
      it.style.display = show ? '' : 'none';
      if (show) any = true;
    });
    var empty = dd.querySelector('.dd-empty');
    if (empty) empty.style.display = any ? 'none' : '';
    dd.classList.add('open');
  });
  document.addEventListener('focus', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute) return;
    if (t.getAttribute('data-ddq') != null) { var dd = t.closest('.dd'); if (dd) dd.classList.add('open'); }
  }, true);
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t && t.classList && t.classList.contains('dd-item')) {
      var dd = t.closest('.dd'); if (!dd) return;
      var i = dd.getAttribute('data-dd');
      var mode = dd.getAttribute('data-ddmode');
      var id = t.getAttribute('data-ddid');
      var nm = t.getAttribute('data-ddn');
      var q = dd.querySelector('[data-ddq]');
      dd.querySelectorAll('.dd-item').forEach(function (x) { x.classList.remove('sel'); });
      t.classList.add('sel');
      if (q) q.value = nm;
      dd.classList.remove('open');
      var bp = id ? prodById(id) : null;
      if (i != null && S.sc) {
        if (mode === 'bon' && S.sc.bon) {
          var bb = S.sc.bon[+i]; if (bb) {
            bb.keuze = 'zoek'; bb.pid = bp ? bp.id : null; bb.overVinkt = {};
            renderSC();
          }
        } else if (mode === 'prod' && S.sc.items) {
          var it = S.sc.items[+i]; if (it) {
            if (bp) { it.pid = bp.id; it.zoek = false; it.hoe = 'bijwerk'; it.overVinkt = {}; renderSC(); }
          }
        }
      }
      return;
    }
    // klik buiten dropdown sluit 'm
    if (!t.closest || !t.closest('.dd')) {
      document.querySelectorAll('.dd.open').forEach(function (dd) { dd.classList.remove('open'); });
    }
  });
  // v45a.1: als je de dropdown-waarde handmatig wist/wijzigt zonder te kiezen
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute || !S.sc) return;
    var ddq = t.getAttribute('data-ddq'); if (ddq == null) return;
    var dd = t.closest('.dd'); if (!dd) return;
    var i = dd.getAttribute('data-dd');
    var mode = dd.getAttribute('data-ddmode');
    var val = t.value.trim();
    var sel = dd.querySelector('.dd-item.sel');
    var hit = null;
    if (val) S.prijzen.forEach(function (p) { if (normName(p.n) === normName(val)) hit = p; });
    if (!val) {
      if (i != null && S.sc) {
        if (mode === 'bon' && S.sc.bon) { var bb0 = S.sc.bon[+i]; if (bb0) { bb0.keuze = 'zoek'; bb0.pid = null; bb0.overVinkt = {}; renderSC(); } }
        // v46-scanner: een leeg zoekveld wist de gekozen product-keuze niet meer
      }
    } else if (!sel || sel.getAttribute('data-ddn') !== val) {
      if (i != null && S.sc) {
        if (mode === 'bon' && S.sc.bon) { var bb1 = S.sc.bon[+i]; if (bb1) { if (hit) { bb1.keuze = 'zoek'; bb1.pid = hit.id; bb1.overVinkt = {}; renderSC(); } } }
        else if (mode === 'prod' && S.sc.items) { var it1 = S.sc.items[+i]; if (it1 && hit) { it1.pid = hit.id; it1.zoek = false; it1.hoe = 'bijwerk'; it1.overVinkt = {}; renderSC(); } }
      }
    }
  });

  // ---- v35: producten plakken of uit bestand (JSON)
  function catFromAny(v) {
    var a = Array.isArray(v) ? v : (typeof v === 'string' ? v.split(',') : []), out = [];
    a.forEach(function (x) {
      var k = String(x || '').trim().toLowerCase(); if (!k) return;
      var c = CATS.filter(function (c) { return c.id === k || c.n.toLowerCase() === k; })[0];
      if (c && out.indexOf(c.id) < 0) out.push(c.id);
    });
    return out.slice(0, 3);
  }
  function parseProdJson(text, fileLabel) {
    var o;
    try { o = JSON.parse(text); } catch (e) { return { err: 'Dit is geen geldige tekst. Plak de volledige JSON, met haken en accolades.' }; }
    var arr = Array.isArray(o) ? o : (o && Array.isArray(o.producten) ? o.producten : (o && typeof o === 'object' && o.naam ? [o] : null));
    if (!arr || !arr.length) return { err: 'Ik zie geen producten. Verwacht: een lijst met producten, elk met een naam.' };
    var rows = [], skipped = 0, stripped = [];
    function nn(v) { if (typeof v === 'string') v = num(v); return typeof v === 'number' && isFinite(v) && v >= 0 ? v : null; }
    arr.forEach(function (x) {
      if (!x || typeof x.naam !== 'string' || !x.naam.trim()) { skipped++; return; }
      var rawN = x.naam.trim().slice(0, 80), rn = stripSupermarkt(rawN);
      if (rn !== rawN) stripped.push('"' + rawN + '" → "' + rn + '" (supermarktnaam weggehaald)');
      var r = { n: rn };
      if (['g', 'ml', 'stuk'].indexOf(x.eenheid) >= 0) r.u = x.eenheid;
      var inh = nn(x.inhoud); if (inh > 0) r.inh = inh;
      var pr = nn(x.prijs); if (pr != null) r.pr = pr;
      var bn = nn(x.bonus); if (bn != null) r.bon = bn;
      var swk = stukWoordKey(x.stuknaam); if (swk) { r.sw = swk; if (!r.u) r.u = 'stuk'; }
      var kc = nn(x.kcal); if (kc != null) r.kc = kc;
      var ks = nn(x.kcal_stuk); if (ks != null) r.kst = ks;
      var sg = nn(x.gewicht_stuk); if (sg > 0) r.sg = sg;
      var ct = catFromAny(x.categorie); if (ct.length) r.cat = ct;
      if (Array.isArray(x.alias)) { var al = x.alias.filter(function (a) { return typeof a === 'string' && a.trim(); }).map(function (a) { return a.trim().slice(0, 80); }).slice(0, 10); if (al.length) r.alias = al; }
      var wv = {};
      var wBron = (x.w && typeof x.w === 'object') ? x.w : x;
      var wMap = { eiwit: ['eiwit', 'eiwitten'], suiker: ['suiker', 'suikers'], verz: ['verzadigd', 'verzadigd_vet', 'verz'], zout: ['zout'], vezel: ['vezel', 'vezels'] };
      Object.keys(wMap).forEach(function (k) {
        for (var mIdx = 0; mIdx < wMap[k].length; mIdx++) {
          var val = nn(wBron[wMap[k][mIdx]]);
          if (val != null) { wv[k] = val; break; }
        }
      });
      if (Object.keys(wv).length) r.w = wv;
      rows.push(r);
    });
    if (!rows.length) return { err: 'Geen enkel product heeft een naam.' };
    return { rows: rows, skipped: skipped, stripped: stripped };
  }

  // v46: één ingang voor plakken en bestand kiezen: de app herkent zelf JSON, een tabel (Excel/CSV) of gewone tekstregels
  function splitCsvLine(line, d) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (q) { if (ch === '"') { if (line.charAt(i + 1) === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === d) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur); return out;
  }
  var TAB_KEYS = { naam: 'naam', product: 'naam', productnaam: 'naam', inhoud: 'inhoud', verpakking: 'inhoud', hoeveelheid: 'inhoud', eenheid: 'eenheid', prijs: 'prijs', bonus: 'bonus', bonusprijs: 'bonus',
    kcal: 'kcal', energie: 'kcal', subcategorie: 'categorie', 'calorieën': 'kcal', calorieen: 'kcal', kcal_stuk: 'kcal_stuk', 'kcal per stuk': 'kcal_stuk', gewicht_stuk: 'gewicht_stuk', 'gewicht per stuk': 'gewicht_stuk',
    categorie: 'categorie', 'categorieën': 'categorie', categorieen: 'categorie', alias: 'alias', 'andere namen': 'alias', bijnaam: 'alias', bijnamen: 'alias',
    stuknaam: 'stuknaam', stukwoord: 'stuknaam', eiwit: 'eiwit', eiwitten: 'eiwit', suiker: 'suiker', suikers: 'suiker', verzadigd: 'verzadigd', 'verzadigd vet': 'verzadigd', zout: 'zout', vezel: 'vezel', vezels: 'vezel' };
  function parseProdTable(text) {
    var lines = String(text).split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (lines.length < 2) return null;
    var head0 = lines[0].replace(/^﻿/, ''), d = null, hdr = null;
    ['\t', ';', ','].forEach(function (c) {
      if (d) return;
      var cells = splitCsvLine(head0, c).map(function (x) { return x.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(); });
      if (cells.length >= 2 && cells.some(function (x) { return TAB_KEYS[x] === 'naam'; })) { d = c; hdr = cells.map(function (x) { return TAB_KEYS[x] || ''; }); }
    });
    if (!d) return null;
    var arr = [];
    lines.slice(1).forEach(function (ln) {
      var cells = splitCsvLine(ln, d), o = {}, eenh = '';
      hdr.forEach(function (k, i) {
        var v = (cells[i] || '').trim(); if (!k || !v) return;
        if (k === 'categorie') o.categorie = catFromAny([v]).length ? [v] : v.split(/[,/+]/).map(function (x) { return x.trim(); }).filter(Boolean);
        else if (k === 'alias') o.alias = v.split(/[,|]/).map(function (x) { return x.trim(); }).filter(Boolean);
        else if (k === 'eenheid') eenh = v.toLowerCase();
        else o[k] = v;
      });
      var m = o.inhoud ? /^\s*(\d+(?:[.,]\d+)?)\s*(kg|gram|gr|g|ml|cl|liter|l|stuks|stuk|st)?\s*$/i.exec(o.inhoud) : null;
      var u = eenh || (m && m[2] ? m[2].toLowerCase() : '');
      if (m) o.inhoud = num(m[1]);
      if (u) {
        if (u === 'kg') { o.inhoud = (typeof o.inhoud === 'number' ? o.inhoud : num(o.inhoud)) * 1000; u = 'g'; }
        else if (u === 'gr' || u === 'gram') u = 'g';
        else if (u === 'l' || u === 'liter') { o.inhoud = (typeof o.inhoud === 'number' ? o.inhoud : num(o.inhoud)) * 1000; u = 'ml'; }
        else if (u === 'cl') { o.inhoud = (typeof o.inhoud === 'number' ? o.inhoud : num(o.inhoud)) * 10; u = 'ml'; }
        else if (u === 'stuks' || u === 'stuk' || u === 'st') u = 'stuk';
        o.eenheid = u;
      }
      if (o.inhoud && !o.eenheid) o.eenheid = 'g';
      if (o.naam && !o.inhoud) {
        var mn = /^(.*\S)\s*\(\s*(\d+(?:[.,]\d+)?)\s*(kg|gram|gr|g|ml|cl|liter|l|stuks|stuk|st)\s*\)\s*$/i.exec(o.naam);
        if (mn) {
          var iv = num(mn[2]), un = mn[3].toLowerCase();
          if (un === 'kg') { iv *= 1000; un = 'g'; } else if (un === 'gr' || un === 'gram') un = 'g';
          else if (un === 'l' || un === 'liter') { iv *= 1000; un = 'ml'; } else if (un === 'cl') { iv *= 10; un = 'ml'; }
          else if (un === 'stuks' || un === 'stuk' || un === 'st') un = 'stuk';
          o.naam = mn[1]; o.inhoud = iv; if (!o.eenheid) o.eenheid = un;
        }
      }
      if (o.naam && !o.inhoud) {
        var mw = /^(.*\S)\s*\(\s*(blikje|blik|potje|pot|pakje|pak|flesje|fles|zakje|zak|bakje|tube|doosje|doos|rol)\s*\)\s*$/i.exec(o.naam);
        if (mw) { o.naam = mw[1]; o.inhoud = 1; o.eenheid = 'stuk'; o.stuknaam = stukWoordKey(mw[2]) || ''; }
      }
      if (o.naam) arr.push(o);
    });
    return arr.length ? { arr: arr } : { err: 'In de tabel staat geen enkel product onder de kopregel.' };
  }
  function parseAny(text) {
    var t = String(text || '').trim();
    if (!t) return { err: 'Plak eerst je producten.' };
    if (t.charAt(0) === '[' || t.charAt(0) === '{') return parseProdJson(t);
    var tab = parseProdTable(t);
    if (tab) return tab.err ? tab : parseProdJson(JSON.stringify(tab.arr));
    var res = parsePriceText(t);
    if (!res.rows.length) return { err: res.errs.length ? 'Ik kan geen regel lezen. Een voorbeeld: Productnaam, 200 g | 1,23' : 'Ik zie geen producten. Plak een tabel, tekstregels of JSON.' };
    var rows = res.rows.map(function (r) {
      var o = { n: stripSupermarkt(r.n) || r.n };
      if (r.u) o.u = r.u; if (r.inh > 0) o.inh = r.inh; if (r.pr != null) o.pr = r.pr; if (r.bon != null) o.bon = r.bon;
      if (r.w && Object.keys(r.w).length) o.w = r.w;
      return o;
    });
    return { rows: rows, skipped: 0, stripped: [], textErrs: res.errs.map(function (e) { return 'Deze regel kan ik niet lezen: ' + e.line + ' (' + e.msg + ')'; }) };
  }
  function pjMerge(lists) {
    var out = [];
    lists.forEach(function (rows) {
      rows.forEach(function (r) {
        var k = normName(r.n), same = out.filter(function (o) { return normName(o.n) === k; })[0];
        if (same) { Object.keys(r).forEach(function (f) { same[f] = r[f]; }); }
        else out.push(JSON.parse(JSON.stringify(r)));
      });
    });
    out.forEach(function (r) {
      var sn = stripSupermarkt(r.n); if (sn) r.n = sn;
      r.ex = findProd(r.n) || null;
      r.mult = []; r.bijna = null; r.verschil = false;
      if (r.ex && voedingsVerschillen(r.ex, r)) {
        r.bijna = r.ex; r.verschil = true; r.ex = null;
      } else if (!r.ex) {
        var mult = vindMultiples(r.n);
        if (mult.length > 1) r.mult = mult;
        else if (mult.length === 1 && !isBroadWord(r.n)) { r.bijna = mult[0]; r.verschil = voedingsVerschillen(r.bijna, r); } // 10 nov: broad word -> kies-kaartjes
      }
    });
    return out;
  }
  function pjFields(r) {
    var f = [];
    if (r.inh != null) f.push('inhoud'); if (r.pr != null) f.push('prijs');
    if (r.kc != null || r.kst != null) f.push('calorieën'); if (r.sg != null) f.push('gewicht per stuk');
    if (r.w && Object.keys(r.w).length) {
      var wList = W_FIELDS.filter(function (fw) { return r.w[fw[0]] != null; }).map(function (fw) { return fw[1].toLowerCase() + ' <span class="wn ' + wClass(fw[0], r.w[fw[0]]) + '">' + fmtN(r.w[fw[0]]) + ' g</span>'; });
      f.push('voedingswaarden (' + wList.join(', ') + ')');
    }
    if (r.cat) f.push('categorie'); if (r.alias) f.push('andere namen');
    return f;
  }
  function openPJ() {
    S.pj = { text: '', err: '', rows: null, notes: [] };
    pushLayer(); document.documentElement.classList.add('lock'); $('pjsheet').hidden = false; renderPJ();
  }
  function forceClosePJ() { S.pj = null; $('pjsheet').hidden = true; document.documentElement.classList.remove('lock'); render(); }
  function syncPJ() { var ta = $('pjtxt'); if (ta && S.pj) S.pj.text = ta.value; }
  function renderPJ() {
    var P = S.pj; if (!P) return;
    var bodyEl = $('pjbody'), sheetEl = $('pjsheet');
    var keepScroll = bodyEl ? bodyEl.scrollTop : 0, keepSheet = sheetEl ? sheetEl.scrollTop : 0; // v51: live lookup mag niet scrollen/resetten
    var active = document.activeElement && document.activeElement.getAttribute ? document.activeElement.getAttribute('data-pjf') || document.activeElement.getAttribute('data-pjn') || '' : '';
    $('pjt').textContent = P.rec ? 'Producten uit mijn recepten' : 'Plakken of bestand kiezen';
    if (P.rec) { $('pjbody').innerHTML = pfrHtml(P); return; }
    var h = '<h3 style="margin-top:0">Producten</h3><textarea class="note steps" id="pjtxt" placeholder="Plak hier je producten: een tabel uit Excel, tekstregels of JSON. Of kies een bestand." aria-label="Producten als tekst">' + esc(P.text) + '</textarea>';
    h += '<div class="seg mvact" style="display:grid;grid-template-columns:1fr 1fr"><button class="pill" data-act="pjcheck">Controleer</button><button class="pill" data-act="pjpickfile">Kies bestand</button></div>';
    h += '<p class="hint zz" style="margin:6px 0 0">Plak je lijstje of bon — daarna check je samen wat de app ervan begrepen heeft.</p>';
    if (P.err) h += '<p class="hint stat" style="color:var(--fg)">' + esc(P.err) + '</p>'; // v57.5: foutmeldingen (plakken/scanner) altijd zichtbaar
    (P.notes || []).forEach(function (n) { h += '<p class="hint" style="color:var(--fg)">' + esc(n) + '</p>'; });
    if (P.rows) {
      if (!P.rows.length) h += '<p class="hint stat">De lijst is leeg. Plak opnieuw producten of kies een bestand.</p>';
      else {
        var nw = P.rows.filter(function (r) { return !r.ex; }).length, up = P.rows.length - nw;
        if (P.zoekBusy) h += '<p class="hint" style="color:var(--fg);font-weight:700">⏳ Live opzoeken… (' + (P.zoekTeller || 0) + ' van ' + (P.zoekTot || 0) + ')</p>';
        h += '<h3>Controlelijst</h3><p class="hint" style="margin-top:0">' + nw + ' nieuw, ' + up + ' bestaand (alleen lege velden worden aangevuld; jouw eigen waarden blijven staan). Tik op \u274c rechtsboven om een product direct uit de lijst te verwijderen. Er wordt pas iets definitief opgeslagen als je op Bevestigen tikt.</p>';

        // v50.7 testversie — controleer-stap 2.0: voortgang-controlelijst boven de lijst
        S.pjView = S.pjView || 'check'; S.pjFilter = S.pjFilter || 'open';
        var nTot = P.rows.length, nGe = P.rows.filter(function (rr) { return rr.gecheckt; }).length;
        h += '<div class="seg mvact" style="margin:8px 0 4px"><button class="pill" type="button" data-act="pjview" data-v="check" aria-pressed="' + (S.pjView !== 'lijst') + '">☑ Controlelijst</button><button class="pill" type="button" data-act="pjview" data-v="lijst" aria-pressed="' + (S.pjView === 'lijst') + '">☰ Hele lijst</button></div>';
        h += '<p style="margin:4px 0;font-weight:700">' + nGe + ' van ' + nTot + ' gecontroleerd</p>';
        h += '<div class="seg mvact" style="margin:0 0 8px"><button class="pill" type="button" data-act="pjfilter" data-v="open" aria-pressed="' + (S.pjFilter !== 'all') + '">Ongecontroleerd (' + (nTot - nGe) + ')</button><button class="pill" type="button" data-act="pjfilter" data-v="all" aria-pressed="' + (S.pjFilter === 'all') + '">Alle (' + nTot + ')</button></div>';
        if (S.pjView !== 'lijst') {
          var fl = S.pjFilter === 'all' ? P.rows : P.rows.filter(function (rr) { return !rr.gecheckt; });
          if (fl.length) {
            var ci = Math.max(0, Math.min(S.pjI || 0, fl.length - 1)), r0 = fl[ci], ri0 = P.rows.indexOf(r0);
            h += '<div class="rcard" style="border-left:4px solid ' + (r0.gecheckt ? 'var(--accent)' : 'var(--line)') + '">' +
              '<p class="hint" style="margin:0 0 6px">Origineel gedetecteerd: <b>' + esc(r0.n) + '</b>' + (r0._keuze ? ' · <b>gevonden: ' + esc(r0._keuze) + '</b>' : '') + (r0._bron && bronIsUrl(r0._bron) ? ' · <b>opgezocht</b> (bron: ' + esc(r0._bron) + ')' : (r0._est || r0._bron ? ' · <b>geschat</b>' : '')) + '</p>' +
              '<label class="hint" style="margin:0 0 4px;display:block">Naam</label><input class="note" data-pjn="' + ri0 + '" type="text" maxlength="80" value="' + esc(r0.n) + '" aria-label="Naam van het product">' +
              '<div class="grid2" style="margin-top:6px">' +
              '<div><label class="hint" style="margin:0 0 4px;display:block">Inhoud</label><input class="note" data-pjf="' + ri0 + ':inh" type="text" inputmode="decimal" value="' + esc(r0.inh != null ? String(r0.inh).replace('.', ',') : '') + '" aria-label="Inhoud"></div>' +
              '<div><label class="hint" style="margin:0 0 4px;display:block">Prijs (€)</label><input class="note" data-pjf="' + ri0 + ':pr" type="text" inputmode="decimal" value="' + esc(r0.pr != null ? String(r0.pr).replace('.', ',') : '') + '" aria-label="Prijs"></div>' +
              '<div><label class="hint" style="margin:0 0 4px;display:block">kcal per 100 g' + (r0._bron && bronIsUrl(r0._bron) ? ' (opgezoeken)' : (r0._est || r0._bron ? ' (geschat)' : '')) + '</label><input class="note" data-pjf="' + ri0 + ':kc" type="text" inputmode="decimal" value="' + esc(r0.kc != null ? String(r0.kc).replace('.', ',') : '') + '" aria-label="Kcal per 100 g"></div>' +
              '</div>' +
              '<div class="grid2" style="margin-top:6px">' + W_FIELDS.map(function (fw) { return '<div><label class="hint" style="margin:0 0 4px;display:block">' + esc(fw[1]) + ' (g)</label><input class="note" data-pjf="' + ri0 + ':w_' + fw[0] + '" type="text" inputmode="decimal" value="' + esc(r0.w && r0.w[fw[0]] != null ? String(r0.w[fw[0]]).replace('.', ',') : '') + '" aria-label="' + esc(fw[1]) + ' per 100 g"></div>'; }).join('') + '</div>' +
              '<div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap"><button class="fchip" type="button" data-act="pjvlag" data-i="' + ri0 + '" aria-pressed="' + (!!r0.vlag) + '">' + (r0.vlag ? '🚩 twijfel' : '🚩') + '</button>' +
              '<button class="fchip" type="button" data-act="pjcheckgo" data-i="' + ri0 + '" aria-pressed="' + (!!r0.gecheckt) + '">' + (r0.gecheckt ? '☑ Gecontroleerd' : '☐ Markeer als gecontroleerd') + '</button></div></div>' + kiesHtml(r0.kies, 'pj', ri0);
            h += '<div class="btns" style="margin-top:8px"><button class="btn" type="button" data-act="pjprev"' + (ci === 0 ? ' disabled' : '') + '>← Vorige</button><button class="btn main" type="button" data-act="pjnext"' + (ci >= fl.length - 1 ? ' disabled' : '') + '>Volgende →</button></div>';
            h += '<button class="btn" type="button" data-act="pjschat" style="width:100%;margin-top:8px">✨ Lege waardes OPZOEKEN (plank → Open Food Facts → Checkjebon → Mistral — nooit gokken)</button>';
            h += '<p class="hint" style="margin-top:6px">Alles optioneel: meteen op Bevestigen mag ook, niets is verplicht.</p>';
          } else h += '<p class="hint">Alles al gecontroleerd 🎉</p>';
        }
        h += '<div class="btns"><button class="btn main" data-act="pjsave">Bevestigen (' + P.rows.filter(function (r) { return !r.skipBox && r.keuze !== 'skip'; }).length + ')</button></div>';
      }
    }
    bodyEl.innerHTML = h;
    if (keepScroll) bodyEl.scrollTop = keepScroll;
    if (keepSheet && sheetEl) sheetEl.scrollTop = keepSheet;
    if (active) { var el2 = bodyEl.querySelector('[data-pjf="' + active + '"], [data-pjn="' + active + '"]'); if (el2) el2.focus({ preventScroll: true }); }
  }
  // keuring 7 nov: live lookup van de controleer-kaartjes — zelfde web search als bij "Zeg wat je at"
  async function pjLiveZoek() { // keuring 8 nov: via opzoekRoute (plank -> Open Food Facts -> Checkjebon -> Mistral), nooit een gok
    var P = S.pj; if (!P || !P.rows || !P.rows.length || P.zoekBusy) return;
    var todo = P.rows.filter(function (r) { return !r.ex && (r.kc == null || !r.w || !Object.keys(r.w).length || r.pr == null); });
    if (!todo.length) return;
    P.zoekBusy = true; P.zoekTeller = 0; P.zoekTot = todo.length; renderPJ();
    for (var i = 0; i < todo.length; i++) {
      var r = todo[i];
      try {
        var res = await opzoekRoute(slimmeOpzoekNaam(r.n, P.winkelTekst || P.text || '')); // v51: winkelnaam mee voor OFF-merk-match
        if (!S.pj) return;
        if (res.kcal100 != null && r.kc == null) r.kc = res.kcal100;
        if (res.w) { r.w = r.w || {}; Object.keys(res.w).forEach(function (k) { if (r.w[k] == null) r.w[k] = res.w[k]; }); }
        if (res.prijs != null && r.pr == null) r.pr = res.prijs; // route levert alleen echte/gemarkeerde prijzen (nooit een gok)
        r._est = !res.opgezocht; r._bron = res.bron || null; r._prijsBron = res.prijsBron || null; // v51.13: OFF-bron (kcal) en prijs-bron (supermarkt) apart
        if (res.keuze) r._keuze = res.keuze; // keurpunt 8 nov: altijd zichtbaar welke entry gekozen is
        if (res.kandidaten && res.kandidaten.length > 1) r.kies = res.kandidaten; else r.kies = null;
        P.zoekTeller++;
      } catch (e) {
        P.notes = (P.notes || []).concat([r.n + ': opzoeken mislukt (' + ((e && e.message) || 'fout') + ') — het veld blijft leeg en bewerkbaar']);
      }
      renderPJ();
    }
    P.zoekBusy = false; renderPJ();
    if (P.zoekTeller < P.zoekTot) P.notes = (P.notes || []).concat([(P.zoekTot - P.zoekTeller) + ' van ' + P.zoekTot + ' kon niet worden opgezocht — zie de melding per product hierboven; de ✨-knop probeert het opnieuw']);
    toast('⏳ Opgezocht: ' + P.zoekTeller + ' van ' + P.zoekTot + (P.zoekTeller < P.zoekTot ? ' (sommige mislukt — zie melding)' : ' — controleer zelf, pas gerust aan'));
  }
  function pjCheck() {
    syncPJ(); var P = S.pj; if (!P) return;
    P.notes = [];
    if (!(P.text || '').trim()) { P.err = 'Plak eerst je producten.'; P.rows = null; renderPJ(); return; }
    var res = parseAny(P.text);
    if (res.err) { P.err = res.err; P.rows = null; }
    else { P.err = ''; P.rows = pjMerge([res.rows]); if (res.textErrs) P.notes = P.notes.concat(res.textErrs); if (res.skipped) P.notes.push(res.skipped + ' zonder naam overgeslagen.'); if (res.stripped && res.stripped.length) P.notes = P.notes.concat(res.stripped); }
    P.winkelTekst = P.text || ''; // v51: bron-tekst bewaart evt. winkelnaam voor live opzoeken
    renderPJ();
    pjLiveZoek(); // keuring 7 nov: kaartjes worden live opgezocht zodra ze na Controleer verschijnen
  }
  function pjFiles(files) {
    var P = S.pj; if (!P) return;
    var lijst = Array.prototype.slice.call(files), uit = [], klaar = 0;
    lijst.forEach(function (f, i) {
      var fr = new FileReader();
      fr.onload = function () { uit[i] = String(fr.result); fin(); };
      fr.onerror = function () { uit[i] = null; fin(); };
      fr.readAsText(f);
    });
    function fin() {
      klaar++; if (klaar < lijst.length || !S.pj) return;
      var lists = [], notes = [];
      lijst.forEach(function (f, i) {
        if (uit[i] == null) { notes.push(f.name + ': dit bestand kon ik niet openen.'); return; }
        var res = parseAny(uit[i]);
        if (res.err) notes.push(f.name + ': ' + res.err); else { lists.push(res.rows); if (res.textErrs) res.textErrs.forEach(function (x) { notes.push(f.name + ': ' + x); }); if (res.skipped) notes.push(f.name + ': ' + res.skipped + ' zonder naam overgeslagen.'); if (res.stripped) res.stripped.forEach(function (x) { notes.push(f.name + ': ' + x); }); }
      });
      S.pj.text = lijst.length === 1 && uit[0] != null ? uit[0] : S.pj.text;
      S.pj.notes = notes; S.pj.err = '';
      S.pj.rows = lists.length ? pjMerge(lists) : null;
      if (!lists.length) S.pj.err = 'Er zat geen bruikbaar product in.';
      renderPJ();
      pjLiveZoek();
    }
  }
  function pjSave() {
    var P = S.pj; if (!P || !P.rows || !P.rows.length) return;
    var rows = P.rows;
    // v45d: controle voor het bewaren
    rows.forEach(function (x) {
      var kz = x.keuze || '';
      x.skip = !!x.skipBox || kz === 'skip'; x.apart = kz === 'apart';
      x.vervang = kz === 'vervang' || kz.indexOf('v:') === 0 || !!x.vervangId;
      x.kopMode = (kz.indexOf('p:') === 0 || kz.indexOf('v:') === 0 || kz === 'andere') ? 'koppel' : '';
      if (kz.indexOf('p:') === 0 || kz.indexOf('v:') === 0) x.koppel = kz.slice(2);
    });
    for (var vi = 0; vi < rows.length; vi++) {
      var vr = rows[vi]; if (vr.skip) continue;
      if (vr.kopMode === 'koppel' && !prodById(vr.koppel)) { toast('Kies bij "' + vr.n + '" een product om aan te koppelen'); return; }
      if (vr.vervang) { var vt = vr.vervangId ? prodById(vr.vervangId) : (vr.kopMode === 'koppel' ? prodById(vr.koppel) : vr.ex); if (vt && S.prijzen.some(function (p) { return p.id !== vt.id && normName(p.n) === normName(vr.n); })) { toast('Er is al een ander product met de naam "' + vr.n + '". Geef het een andere naam.'); return; } }
      if (vr.apart && findProd(vr.n)) { toast('Geef "' + vr.n + '" een andere naam om het apart te houden'); return; }
    }
    var before = JSON.stringify(S.prijzen), nw = 0, up = 0, vv = 0;
    rows.forEach(function (r) {
      if (r.skip) return;
      // v45b.4: lege naam overslaan (kan niet bewaard worden)
      if (!r.n || !String(r.n).trim()) return;
      r.n = String(r.n).trim().slice(0, 80);
      var ex = r.pid ? prodById(r.pid) : null;
      if (r.vervang) {
        var vx = r.vervangId ? prodById(r.vervangId) : (r.kopMode === 'koppel' ? prodById(r.koppel) : (r.ex || findProd(r.n)));
        if (vx) {
          scVervang(vx, r);
          if (r.kst != null) vx.kst = r.kst; if (r.sg != null) vx.sg = r.sg; if (r.sw) vx.sw = r.sw; else if (vx.u !== 'stuk') delete vx.sw;
          if (r.cat && (!vx.cat || !vx.cat.length)) vx.cat = r.cat.slice(0, 3);
          if (r.alias) { vx.alias = vx.alias || []; r.alias.forEach(function (a) { if (vx.alias.indexOf(a) < 0 && vx.alias.length < 10) vx.alias.push(a); }); }
          vv++; return;
        }
      }
      if (!ex && r.kopMode === 'koppel' && r.koppel) {
        ex = prodById(r.koppel);
        if (ex && prodKeys(ex).indexOf(normName(r.n)) < 0 && (ex.alias || []).length < 10) { ex.alias = (ex.alias || []).concat([r.n]); }
      }
      var isAlias = false;
      if (!ex && r.aliasAan && !r.verschil) { var ap = prodById(r.aliasAan); if (ap) { ap.alias = ap.alias || []; if (ap.alias.indexOf(r.n) < 0 && ap.alias.length < 10) ap.alias.push(r.n); isAlias = true; } }
      // v45b.4: als Marlijn de naam heeft aangepast, telt een eerder gekozen 'bestaand product' niet meer;
      // dan zoeken we opnieuw op de nieuwe naam (eigen invoer is leidend).
      if (!ex && !isAlias && !r.verschil && !r.apart) ex = findProd(r.n);
      var ovk = r.overVinkt || {};
      if (ex) {
        if (r.u && !ex.inh) ex.u = r.u;
        if (r.sw && !ex.sw && ex.u === 'stuk') ex.sw = r.sw;
        if (r.inh != null && ex.inh == null) ex.inh = r.inh;
        if (r.pr != null && ex.pr == null) ex.pr = r.pr;
        if (r.bon != null && ex.bon == null) ex.bon = r.bon;
        if (r.kc != null && ex.kc == null) ex.kc = r.kc;
        if (r.kst != null && ex.kst == null) ex.kst = r.kst;
        if (r.sg != null && ex.sg == null) ex.sg = r.sg;
        if (r.w && Object.keys(r.w).length) {
          ex.w = ex.w || {};
          Object.keys(r.w).forEach(function (k) { if (r.w[k] != null && ex.w[k] == null) ex.w[k] = r.w[k]; });
        }
        if (r.cat && (!ex.cat || !ex.cat.length)) ex.cat = r.cat.slice(0, 3);
        if (r.alias) { ex.alias = ex.alias || []; r.alias.forEach(function (a) { if (ex.alias.indexOf(a) < 0 && ex.alias.length < 10) ex.alias.push(a); }); }
        if (ovk.pr && r.pr != null) ex.pr = r.pr;
        if (ovk.inh && r.inh != null) { ex.inh = r.inh; if (r.u) ex.u = r.u; }
        if (ovk.kc && r.kc != null) ex.kc = r.kc;
        if (ovk.kst && r.kst != null) ex.kst = r.kst;
        if (ovk.sg && r.sg != null) ex.sg = r.sg;
        W_FIELDS.forEach(function (f) { if (ovk['w_' + f[0]] && r.w && r.w[f[0]] != null) { ex.w = ex.w || {}; ex.w[f[0]] = r.w[f[0]]; } });
        up++;
      } else if (isAlias) {
        up++;
      } else {
        var p = cleanProd({ id: uid(), sw: r.sw || null, n: r.n, u: r.u || 'g', inh: r.inh, pr: r.pr, bon: r.bon != null ? r.bon : null, alias: r.alias || [], w: r.w ? JSON.parse(JSON.stringify(r.w)) : {}, kc: r.kc == null ? null : r.kc, sg: r.sg, kst: r.kst == null ? null : r.kst, cat: r.cat || guessCats(r.n), foto: '' });
        if (p) { S.prijzen.push(p); nw++; }
      }
    });
    if (!tryStore()) { S.prijzen = JSON.parse(before); toast('Opslaan lukt niet'); return; }
    S.status = 'ok'; toast(nw + ' nieuw, ' + up + ' bijgewerkt' + (vv ? ', ' + vv + ' vervangen' : '')); forceClosePJ();
  }
  function prodKcPer(p) {
    // kcal per 1 eenheid van het product (g, ml of stuk); null als onbekend
    if (p.u === 'stuk') { if (p.kst != null) return p.kst; if (p.sg && p.kc != null) return p.sg * p.kc / 100; return null; }
    return p.kc != null ? p.kc / 100 : null;
  }
