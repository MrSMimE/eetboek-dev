(function () {
  // WERK-DEURTJE versies/work/62 — v62
  // De pleisters zitten AL gebakken in opdeling/app.js (v62-stand, 15 nov 2026).
  // Dit deurtje doet maar twee dingen:
  // 1. opslag afgeschermd: 'eetweek.v1' -> 'eetweek.v1.testversie' (je echte eetboek blijft onaangeraakt)
  // 2. de app-code laden vanuit opdeling/app.js en invoegen — geen aanpassingen meer hier
  try {
    var echt = window.localStorage;
    var map = function (k) { return k === 'eetweek.v1' ? 'eetweek.v1.testversie' : k; };
    var vervang = {
      getItem: function (k) { return echt.getItem(map(k)); },
      setItem: function (k, v) { echt.setItem(map(k), v); },
      removeItem: function (k) { echt.removeItem(map(k)); },
      clear: function () { echt.clear(); },
      key: function (i) { return echt.key(i); }
    };
    Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { return vervang; } });
  } catch (e) {}
  var x = new XMLHttpRequest();
  x.open('GET', 'opdeling/app.js', true);
  x.onload = function () {
    var s = document.createElement('script');
    s.text = x.responseText;
    document.head.appendChild(s);
  };
  x.onerror = function () {
    document.body.innerHTML = '<p>Kon de app-code niet laden. Kijk even of je internetverbinding het doet en probeer opnieuw.</p>';
  };
  x.send();
})();
