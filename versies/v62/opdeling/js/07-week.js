  function stepsHtml(r) {
    var ls = String(r.steps || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    if (!ls.length) return '';
    var o = '', t = '';
    ls.forEach(function (l) {
      if (/^(tip|bewaren|opwarmen)\s*:/i.test(l)) t += '<p class="rtip">' + esc(l) + '</p>';
      else o += '<li>' + esc(l.replace(/^\d+[.)]\s*/, '')) + '</li>';
    });
    return '<details><summary>Bereiding</summary>' + (o ? '<ol>' + o + '</ol>' : '') + t + '</details>';
  }
  function whereText(r) {
    var w = rWhere(r);
    if (!w.length) return 'Staat bij elk moment. Kies bij Bewerken waar je hem wilt zien.';
    return 'Staat bij: ' + RGROUPS.filter(function (g) { return w.indexOf(g.id) >= 0; }).map(function (g) { return g.t.toLowerCase(); }).join(', ') + '.';
  }
  function recipeMatches(r, q) {
    if (!q) return true;
    var hay = [normName(r.name)];
    (r.ing || []).forEach(function (i) {
      hay.push(normName(i.n));
      var p = findProd(i.n);
      if (p) {
        hay.push(normName(p.n));
        (p.alias || []).forEach(function (a) { hay.push(normName(a)); });
      }
    });
    var words = hay.join(' ').split(' ').filter(Boolean);
    var terms = normName(q).split(' ').filter(Boolean);
    return terms.every(function (t, ti) { // v57 (v54.2-afspraak): hele woorden; alleen het laatste woord mag op een beginstuk matchen
      if (ti === terms.length - 1) return words.some(function (w) { return w.indexOf(t) === 0; });
      return words.indexOf(t) >= 0;
    });
  }
  var COUNTU = /^(x|stuk|stuks|blikje|blikjes|plak|plakken|plakje|plakjes|balletjes|snee|sneetjes|teen|tenen|bol|bollen|)$/;
  function niceQty(v, u, name) {
    var un = String(u || '').toLowerCase().trim(), r;
    if (COUNTU.test(un)) {
      if (/(^|\s)(ei|eieren|eitje|eitjes)(\s|$)/i.test(name)) return Math.max(1, Math.round(v));
      r = Math.round(v * 2) / 2; return r > 0 ? r : 0.5;
    }
    if (un === 'g' || un === 'gr' || un === 'gram' || un === 'ml') return v >= 100 ? Math.round(v / 5) * 5 : v >= 20 ? Math.round(v) : Math.round(v * 2) / 2;
    r = Math.round(v * 2) / 2; return r > 0 ? r : 0.5;
  }
  function scaleIngText(i, m) {
    if (m === 1) return ingText(i, 1);
    var a = i.a, na;
    if (typeof a === 'number') na = niceQty(a * m, i.u, i.n);
    else {
      var s = String(a == null ? '' : a).trim(), rg = /^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)$/.exec(s);
      if (rg) na = fmtN(niceQty(num(rg[1]) * m, i.u, i.n)) + '-' + fmtN(niceQty(num(rg[2]) * m, i.u, i.n));
      else if (/^\d/.test(s) && num(s) != null) na = niceQty(num(s) * m, i.u, i.n);
      else na = a;
    }
    return ingText({ n: i.n, u: i.u, a: na }, 1);
  }
  // v45b.10: ingrediëntentabel (geen bolletjes meer)
  function amtText(i, m) {
      var a = i.a, na;
      if (m === 1) na = a;
      else if (typeof a === 'number') na = niceQty(a * m, i.u, i.n);
      else {
        var s = String(a == null ? '' : a).trim(), rg = /^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)$/.exec(s);
        if (rg) na = fmtN(niceQty(num(rg[1]) * m, i.u, i.n)) + '-' + fmtN(niceQty(num(rg[2]) * m, i.u, i.n));
        else if (/^\d/.test(s) && num(s) != null) na = niceQty(num(s) * m, i.u, i.n);
        else na = a;
      }
      if (na == null) return '';
      var as = typeof na === 'number' ? fmtN(na) : String(na);
      return esc(as) + (i.u && i.u !== 'x' ? ' ' + esc(i.u) : '');
    }
