(function () {
  // app-test-work proef: laadt de echte app.js uit versies/opdeling-test,
  // maar sluit eerst de opslag af: alles wat naar 'eetweek.v1' gaat (je echte data!)
  // wordt omgeleid naar 'eetweek.v1.testversie'. Je echte app blijft onaangeraakt.
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
  var s = document.createElement('script');
  s.src = '../versies/opdeling-test/app.js';
  document.head.appendChild(s);
})();
