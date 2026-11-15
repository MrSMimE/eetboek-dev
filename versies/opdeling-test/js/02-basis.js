  var RG_DEF = {
    1: [['mid', 'Middag', 'tot', 250], ['av', 'Avondeten', 'gem', 675], ['ab', 'Avondblok', 'tot', 240]],
    2: [['lm', 'Lunch + middag samen', 'tot', 500], ['av', 'Avondeten', 'gem', 675], ['ab', 'Avondblok', 'tot', 240]],
    3: [['mid', 'Middag', 'tot', 250], ['av', 'Avondeten', 'gem', 725], ['ab', 'Avondblok', 'tot', 210]],
    4: [['mid', 'Middag', 'tot', 250], ['av', 'Avondeten', 'gem', 675], ['ab', 'Avondblok', 'tot', 240]],
    5: [['lm', 'Lunch + middag samen', 'tot', 450], ['sport', 'Na het sporten', 'tot', 240], ['ovb', 'Overbrugging (alleen bij trek)', 'tot', 70], ['av', 'Avondeten', 'gem', 800], ['ab', 'Avondblok', 'tot', 160]],
    6: [['okb', 'Ontbijt + tussendoor samen', 'tot', 350], ['lm', 'Lunch + middag samen', 'tot', 550], ['av', 'Avondeten', 'tot', 800], ['ab', 'Avondblok', 'tot', 240]],
    0: [['okb', 'Ontbijt + tussendoor samen', 'tot', 350], ['lm', 'Lunch + middag samen', 'tot', 550], ['av', 'Avondeten', 'tot', 900], ['ab', 'Avondblok', 'tot', 200]]
  };  function rgRow(dow, slot) { var l = RG_DEF[dow] || []; for (var i = 0; i < l.length; i++) if (l[i][0] === slot) return l[i]; return null; }
  function rgDefault(dow, slot) { var r = rgRow(dow, slot); return r ? r[3] : null; }
  function rgMax(dow, slot) {
    var d = rgDefault(dow, slot); if (d == null) return null;
    var v = S.maxes && S.maxes['d' + dow + ':' + slot];
    return typeof v === 'number' && isFinite(v) ? v : d;
  }
  function avPlan(dow) { var r = rgRow(dow, 'av'); return (r[2] === 'gem' ? 'gemiddeld ± ' : 'tot ') + rgMax(dow, 'av'); }
  function cleanMaxes(o) {
    var out = {}; if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
    Object.keys(o).forEach(function (k) {
      var m = /^d([0-6]):([a-z]+)$/.exec(k), v = o[k];
      if (!m || typeof v !== 'number' || !isFinite(v) || v < 0 || v > 3000) return;
      var d = rgDefault(+m[1], m[2]); if (d == null) return;
      v = Math.round(v); if (v !== d) out[k] = v;
    });
    return out;
  }
  function dagDoel(dow) {
    var t = 0; (RG_DEF[dow] || []).forEach(function (x) { var v = rgMax(dow, x[0]); if (v != null) t += v; });
    return t;
  }
  function weekDoelAuto() {
    var t = 0; [0, 1, 2, 3, 4, 5, 6].forEach(function (d) { t += dagDoel(d); });
    return t;
  }
  function weekIsRaar() { return !!(S.rare && S.rare[fmtId(S.start)]); }
  function dayIsRaar(id) { return !!(S.rareD && S.rareD[id]); }

  // ---- brood in één tik. Oude indeling 'och' (2 sneetjes) blijft voor oude dagen.
  // Nieuw: ontbijt, pauze en kleine lunch elk 1 snee; bij B en C standaard 1,5 plakje.
  var ONE = {
    A: [['NE', 'Snee'], ['NE', 'Cottage cheese met fruit, 50']],
    B: [['NE', 'Snee'], ['NE', 'Smeerkaas, 25'], ['NE', 'Plakje kipfilet'], ['NE', 'Half plakje']],
    C: [['NE', 'Snee'], ['NE', 'Cottage cheese, 50'], ['NE', 'Plakje kipfilet'], ['NE', 'Half plakje']]
  };
  var BROOD = {
    och: {
      A: [['NE', 'Snee'], ['NE', 'Snee'], ['NE', 'Cottage cheese met fruit, 50'], ['NE', 'Cottage cheese met fruit, 50']],
      B: [['NE', 'Snee'], ['NE', 'Snee'], ['NE', 'Smeerkaas, 25'], ['NE', 'Smeerkaas, 25'], ['NE', 'Plakje kipfilet'], ['NE', 'Plakje kipfilet'], ['NE', 'Plakje kipfilet']],
      C: [['NE', 'Snee'], ['NE', 'Snee'], ['NE', 'Cottage cheese, 50'], ['NE', 'Cottage cheese, 50'], ['NE', 'Plakje kipfilet'], ['NE', 'Plakje kipfilet'], ['NE', 'Plakje kipfilet']]
    },
    pz: ONE, kl: ONE
  };
  function isRecipeForSlot(r, slot) {
    if (!r || !r.where) return false;
    var w = Array.isArray(r.where) ? r.where : [r.where];
    var gid = groupOfSlot(slot);
    return w.some(function (x) {
      var s = String(x).toLowerCase().trim();
      if (gid && s === gid) return true;
      if ((slot === 'ont' || slot === 'wont' || slot === 'pz' || slot === 'och' || slot === 'okb') &&
          (s === 'ochtend' || s === 'ontbijt' || s === 'ont' || s === 'wont' || s === 'pz')) return true;
      if ((slot === 'kl' || slot === 'lun' || slot === 'lm') &&
          (s === 'lunch' || s === 'lun' || s === 'kl')) return true;
      if ((slot === 'mid' || slot === 'mdg' || slot === 'sport' || slot === 'ovb') &&
          (s === 'middag' || s === 'mid')) return true;
      if (slot === 'av' && (s === 'avondeten' || s === 'av')) return true;
      if (slot === 'ab' && (s === 'avondblok' || s === 'ab')) return true;
      return false;
    });
  }
  function quickRecipesForSlot(slot) {
    return (S.recipes || []).filter(function (r) { return isRecipeForSlot(r, slot); });
  }
  function isOntbijtSlot(slot) { return slot === "ont" || slot === "wont"; }
  function ontbijtRecipes() {
    return quickRecipesForSlot("ont");
  }
  var PLAKSLOTS = ['ont', 'pz', 'kl'];
  var BROOD_T = { A: 'Cottage cheese met fruit', B: 'Smeerkaas en hartig beleg', C: 'Cottage cheese en hartig beleg' };
