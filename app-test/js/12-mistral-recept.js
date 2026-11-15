          var ps = S.prijzen.filter(function (p) { return catsOf(p).indexOf(cid) >= 0; }).sort(function (x, y) { return x.n.localeCompare(y.n, 'nl'); });
