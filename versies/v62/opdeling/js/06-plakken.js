  function kwarkFrisRecipe() {
    return { id: uid() + 'k', name: 'Kwark-Fris', where: ['ochtend', 'avondblok'], steps: STEPS.kwarkfris, ing: [
      { n: 'Magere kwark', a: 150, u: 'g', p: 0.52 }, { n: 'Pure cacao (1 tl)', a: 5, u: 'g', p: 3.4 },
      { n: 'Crunchy muesli', a: 10, u: 'g', p: 4.22 }, { n: 'Frambozen of ander diepvriesfruit', a: 50, u: 'g', p: 0.48 } ] };
  }
  STEPS.kwarkfris = 'Doe de kwark in een kom en roer de cacao erdoor.\nZoetstof erdoor mag, als het nodig is.\nLeg het diepvriesfruit erop. Even laten staan maakt het fruit zachter en de kwark lekker fris.\nStrooi de muesli er pas vlak voor het eten over, dan blijft hij krokant.\nTip: weekendvariant uit je schema is 25 g muesli en 100 g frambozen. Pas de grammen aan bij Bewerken, of maak er een eigen recept van.\nTip: 1 el gebroken lijnzaad erdoor mag ook (kies die los bij Eten, maximaal 2 el per dag).';  function migrate() {
    S.mig = S.mig || [];
    S.recipes.forEach(function (r) {
      if (!r.steps && r.name === 'Tonijnsalade' && r.fixed === 140) r.steps = STEPS.tonijn;
      if (!r.steps && r.name === 'Eiersalade' && r.fixed === 295) r.steps = STEPS.ei;
      if (r.name === 'Muffin' && r.steps && r.steps.indexOf('± 75 g) blijven slap.') >= 0) r.steps = r.steps.replace('± 75 g) blijven slap.', '± 75 g) zijn eerst zacht en worden na afkoelen stevig.');
    });
    if (S.mig.indexOf("v35b_muffin_where") < 0) {
      S.mig.push("v35b_muffin_where");
      S.recipes.forEach(function (r) {
        if (r.name === "Muffin" && (!r.where || !r.where.length)) {
          r.where = ["ochtend"];
        }
      });
    }
    if (S.mig.indexOf('kwarkfris') < 0) {
      S.mig.push('kwarkfris');
      if (!S.recipes.some(function (r) { return r.name === 'Kwark-Fris'; })) S.recipes.push(kwarkFrisRecipe());
    }
    if (S.mig.indexOf('pizza') < 0) {
      S.mig.push('pizza');
      if (!S.recipes.some(function (r) { return r.name === 'Pizza op Libanees brood'; })) S.recipes.push(pizzaRecipe());
    }
    if (S.mig.indexOf('muffin') < 0) {
      S.mig.push('muffin');
      if (!S.recipes.some(function (r) { return r.name === 'Muffin'; })) S.recipes.push(muffinRecipe());
    }
    if (S.mig.indexOf('v12') < 0) {
      S.mig.push('v12');
      S.recipes.forEach(function (r) {
        if (!r.steps) return;
        if (r.name === 'Muffin' && r.steps.indexOf('Maak van het restbeslag (± 190 g) koekjes in een koekenpan') >= 0) { r.steps = STEPS.muffin; return; }
        if (r.name === 'Muffin' || r.name === 'Pizza op Libanees brood') {
          r.steps = r.steps.replace(/in oven of airfryer/g, 'in de oven').replace(/in de oven of airfryer/g, 'in de oven');
        }
      });
      if (!S.recipes.some(function (r) { return r.name === 'Koekjes uit restbeslag'; })) S.recipes.push(koekjeRecipe());
    }
    if (S.mig.indexOf('v13') < 0) {
      S.mig.push('v13');
      S.recipes.forEach(function (r) { if (r.name === 'Muffin' && r.unit === 'muffin' && r.por == null) r.por = 12; });
    }
    if (S.mig.indexOf('v22b') < 0) {
      S.mig.push('v22b');
      if (Array.isArray(S.fav)) {
        S.fav = S.fav.filter(function (f) {
          if (!f || !f.name) return false;
          if (/,\s*\d+\s*(?:g|ml)/i.test(f.name) && fixedGramInfo(f.name)) return false;
          if (/,\s*\d+\s*(?:g|ml),\s*\d+\s*(?:g|ml)/i.test(f.name)) return false;
          return true;
        });
      }
    }
    if (S.mig.indexOf('v44_aanbieding_wisser') < 0) {
      S.mig.push('v44_aanbieding_wisser');
      var nu = Date.now(), gewist = 0;
      S.prijzen.forEach(function (p) {
        if (p.bon != null && p.bonTot && p.bonTot <= nu) { delete p.bon; delete p.bonTot; gewist++; }
      });
      if (gewist) tryStore();
    }
    if (S.mig.indexOf('v37_geen_vast') < 0) {
      S.mig.push('v37_geen_vast');
      var PV = {
        'Tonijnsalade': [140, [[/vocht/i, 0], [/tonijn/i, 105], [/augurk/i, 2], [/kwark|yoghurt/i, 15]]],
        'Eiersalade': [295, [[/vocht/i, 0], [/eieren/i, 74], [/ham/i, 1.1], [/kwark/i, 9]]],
        'Pizza op Libanees brood': [345, [[/libanees/i, 143], [/tomatenpuree/i, 15], [/kruid/i, 0], [/spinazie/i, 0.25], [/ham/i, 13], [/kip/i, 13], [/mozzarella/i, 12], [/cherry/i, 0], [/olijf|olijven/i, 1.2], [/parmezaan/i, 4]]]
      };
      S.recipes.forEach(function (r) {
        var pv = PV[r.name]; if (!pv || r.unit || r.fixed !== pv[0]) return;
        delete r.fixed;
        (r.ing || []).forEach(function (i) {
          if (i.p != null) return;
          for (var q = 0; q < pv[1].length; q++) if (pv[1][q][0].test(i.n)) { i.p = pv[1][q][1]; break; }
        });
      });
    }
  }
  function num(v) { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; }
  function fmtN(x) { var r = Math.round(x * 2) / 2; return String(r).replace('.', ','); } // v50.4: nette halve/hele amounts (10,75 g -> 11)
  function ingText(i, f) {
    var a = i.a, nn = typeof a === 'number' ? a * (f || 1) : (f && f !== 1 && num(a) != null && String(a).indexOf('-') < 0 ? num(a) * f : a);
    var as = typeof nn === 'number' ? fmtN(nn) : String(nn);
    return i.u === 'x' ? as + '× ' + i.n : as + ' ' + (i.u ? i.u + ' ' : '') + i.n;
  }
  function recKcal(r, f) {
    if (r.fixed != null) return Math.round(r.fixed * f);
    var t = 0; r.ing.forEach(function (i) {
      var a = num(i.a); if (a == null) return;
      if (i.p != null) { t += a * i.p; return; }
      var p = findProd(i.n); if (p) { var k = ingKcalStrikt(p, a, i.u); if (k != null) t += k; } // v55.2 (13 nov) PUNT 0: zelfde regel als de ingrediëntenrij — ingKcalStrikt zodra findProd matcht; ingIsAntl (eigen aantal-woord) zit ín ingKcalStrikt
    });
    return Math.round(t * f);
  }
  // v48.4: product met aantal-per-verpakking-blokje (p.aantal + p.aantalWoord) — het eigen woord (plakjes…) als eenheid in een recept
  function antlWoord(p) { return (p && p.aantal > 0 && p.aantalWoord) ? p.aantalWoord : null; }
  function ingIsAntl(i, p) { var au = antlWoord(p); return !!(au && p && String(i.u || '').trim().toLowerCase() === au.toLowerCase()); }
  // gram/ml van een ingrediënt via het gekoppelde product (ook bij het eigen aantal-woord), of null
  function ingGram(i) {
    var p = findProd(i.n); if (!p) return null;
    var a = amt(i.a); if (a == null) return null;
    if (ingIsAntl(i, p)) { var sg = stukGram(p); return sg != null ? a * sg : null; }
    return qtyFor({ a: a, u: i.u }, p.u);
  }
  // v45b.9: een ingrediënt dat jij als kruid hebt gemarkeerd telt als 0 kcal en is dus niet "nog te schatten"
  function ingKruid(i) { var q = findProd(i.n); return !!(q && q.kruid); }
  // v45d.6: gekoppeld maar niet tellend = niet af. Strenge kcal-berekening voor recepten: alleen g, ml en stuk (x) tellen; andere eenheden (blikje, el, tl...) niet.
  function ingKcalStrikt(p, a, u) {
    if (!p) return null;
    if (p.kruid && p.kc == null && p.kst == null) return 0;
    var eh = (u === 'x') ? 'stuk' : u;
    if (ingIsAntl({ u: u }, p)) { var sg0 = stukGram(p); return sg0 != null ? kcalFor(p, a * sg0, 'g') : null; }
    if (eh !== 'g' && eh !== 'ml' && eh !== 'stuk') return null;
    return kcalFor(p, a, eh);
  }
  // Waarom telt dit product niet mee? '' als het wel meetelt.
  function telWaarschuwing(p, u) {
    if (!p || p.kruid) return '';
    var eh = u ? ((u === 'x') ? 'stuk' : u) : p.u;
    if (ingKcalStrikt(p, 1, eh) != null) return '';
    if (prodKcPer(p) == null) return 'telt niet mee: dit product heeft geen calorieën';
    return 'telt niet mee: andere eenheid (het product staat in ' + (p.u === 'stuk' ? stukNaam(p, 2) : p.u) + ')';
  }  function recUnknown(r) { return r.fixed == null && r.ing.some(function (i) { return i.p == null && !ingKruid(i); }); }
