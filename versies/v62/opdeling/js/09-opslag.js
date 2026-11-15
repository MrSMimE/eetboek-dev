  function recPickOne(r, pre) {
    var u = r.unit, pk = 'pk:' + r.id, rnk = normName(r.name);
    return '<details class="rcard" style="margin-top:6px" data-rk="' + esc(pk) + '"' + (S.recOpen[pk] ? ' open' : '') + '><summary class="rname">' + esc(recEmoji(r) + ' ' + r.name) + '</summary>' +
      '<div class="recpick" style="margin-top:0"><div class="seg" style="margin-top:0"><button class="pill" data-act="recadd" data-r="' + r.id + '" data-f="1">' + (u ? '1 ' + esc(u) : 'Hele portie') + '</button><button class="pill" data-act="recadd" data-r="' + r.id + '" data-f="0.5">' + (u ? 'Halve ' + esc(u) : 'Halve portie') + '</button></div>' +
      '<div class="rowx"><input id="rf-' + (pre || '') + r.id + '" type="text" inputmode="decimal" autocomplete="off" placeholder="Andere hoeveelheid, bijvoorbeeld ' + (u ? '1,4' : '0,75') + '" aria-label="Andere hoeveelheid van ' + esc(r.name) + '"><button class="pill" data-act="recaddx" data-r="' + r.id + '">Toevoegen</button></div>' +
 '</div></details>';
  }
  function recPickBlock(slot) {
    if (!S.recipes.length) return '';
    var gid = groupOfSlot(slot);
    var mine = S.recipes.filter(function (r) { var w = rWhere(r); return w.length && w.indexOf(gid) >= 0; }); // v54.0: alleen de recepten van dit moment (badge = aantal van dit moment)
    var inner = '';
    if (!mine.length) inner += '<p class="hint stat" style="margin-top:0">Geen recepten voor dit moment.</p>';
    inner += mine.map(recPickOne).join('');
    return '<details class="grp" data-gg="REC"' + (grpOpen('REC', false) ? ' open' : '') + '><summary><span>🥣 Uit mijn recepten</span><span class="gcnt">' + mine.length + '</span></summary>' + inner + '</details>'; // v54.0: standaard dicht, geen "Andere recepten"-uitklapje
  }
  function grpOpen(key, def) { return S.grpOpen[key] == null ? def : S.grpOpen[key]; }
  function recFactor(r, f) { return r.fixed != null ? f : f / (r.por > 1 ? r.por : 1); }
  function recLos(r) { return r.fixed == null && !r.unit && r.ing && r.ing.length > 0 && r.ing.length <= 4; }
  function addRecipeLos(r, dayId, slot, f) {
    var d = dayDoc(dayId), grp = uid() + 'g', first = true, ef = recFactor(r, f);
    r.ing.forEach(function (i) {
      var base = amt(i.a), prod = findProd(i.n), q = null, k = null;
      if (base != null && prod && ingIsAntl(i, prod)) {
        // v48.4: eigen aantal-woord (plakjes…) in een recept → omrekenen naar de product-eenheid via verpakking ÷ aantal
        var sgA = stukGram(prod);
        if (sgA != null) q = base * ef * sgA;
      } else if (base != null && prod) q = qtyFor({ a: base * ef, u: i.u }, prod.u);
      if (base != null && i.p != null) k = Math.round(base * ef * i.p);
      else if (q != null) { var kp = prodKcPer(prod); if (kp != null) k = Math.round(q * kp); }
      var e = { id: uid(), slot: slot, key: (prod && q != null) ? 'P:' + prod.id : 'ING:' + uid(), code: first ? r.name : '', grp: grp, name: ingText(i, ef), k: k, exact: k != null };
      if (prod && q != null) { e.pid = prod.id; e.amt = q; e.u = prod.u; if (prod.u === 'g' && k != null && prod.kc != null) { e.g = q; e.p = prod.kc; } }
      d.entries.push(e); first = false;
    });
  }
  function addRecipeAt(r, dayId, slot, f) {
    if (recLos(r)) { addRecipeLos(r, dayId, slot, f); return; }
    var d = dayDoc(dayId), ef = recFactor(r, f), pl = f === 1 ? 'hele portie' : f === 0.5 ? 'halve portie' : fmtN(f) + ' portie';
    var e = r.unit
      ? { id: uid(), slot: slot, key: 'R:' + r.id + ':' + f, code: '', name: cap(f === 1 ? '1 ' + r.unit : fmtN(f) + ' ' + r.unit), k: recKcal(r, ef), recipe: r.id, ing: 'vaste waarde per ' + r.unit, unk: false }
      : { id: uid(), slot: slot, key: 'R:' + r.id + ':' + f, code: '', name: r.name + ', ' + pl, k: recKcal(r, ef), recipe: r.id, ing: r.ing.map(function (i) { return ingText(i, ef); }).join(', '), unk: recUnknown(r) };
    d.entries.push(e);
  }
  function addRecipeEntry(rid, f) {
    var r = S.recipes.filter(function (x) { return x.id === rid; })[0]; if (!r || !f || f <= 0) return;
    addRecipeAt(r, S.sheet.day, S.sheet.slot, f);
    saveDay(S.sheet.day); renderSheet(false);
  }
  function recIngBlock(es) {
    var seen = {}, out = '';
    es.forEach(function (e) {
      if (!e.recipe || seen[e.key]) return; seen[e.key] = 1;
      var rr = S.recipes.filter(function (x) { return x.id === e.recipe; })[0]; if (!rr) return;
      var f = parseFloat(String(e.key).split(':')[2]); if (!(f > 0)) f = 1;
      var inner = '';
      if (!rr.unit) inner += '<ul>' + rr.ing.map(function (i) { return '<li>' + esc(ingText(i, recFactor(rr, f))) + '</li>'; }).join('') + '</ul>';
      inner += stepsHtml(rr);
      if (!inner) return;
      out += '<details class="others"><summary>Ingrediënten en bereiding: ' + esc(rr.name) + '</summary>' + inner + '</details>';
    });
    return out;
  }
  function saveSlotAsRecipe(name) {
    var d = dayDoc(S.sheet.day), es = d.entries.filter(function (e) { return e.slot === S.sheet.slot; });
    if (!es.length) return false;
    var ing = [], idx = {};
    es.forEach(function (e) {
      var n = label(e), key = n + '|' + (e.k == null ? '' : e.k);
      if (idx[key] != null) { ing[idx[key]].a += 1; return; }
      idx[key] = ing.length;
      ing.push({ n: n, a: 1, u: 'x', p: e.k == null ? null : e.k });
    });
    var nr = { id: uid(), name: name, ing: ing }, sg = groupOfSlot(S.sheet.slot); if (sg) nr.where = [sg];
    S.recipes.push(nr);
    persist(); return true;
  }
