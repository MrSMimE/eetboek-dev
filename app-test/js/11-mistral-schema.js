      var any = false, ph = '';      GROEPEN.forEach(function (g) {        var subs = groepCats(g).map(function (cid) {          var c = catById(cid); if (!c) return null;
