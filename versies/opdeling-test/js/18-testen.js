// 18-testen.js — testdeel, ALLEEN in app-test/ (promoot.py zet-om kopieert dit bestand NOOIT naar app/)
// v57.8+: Testen-blokje in Instellingen (automatische zelftest + testrondje met meeneem-balkje)
// Alle testcode staat in dit ene bestand; de overige app-test-bestanden zijn byte-identiek aan app/.
TESTVERSIE = true; // 01-catalogus.js declareert 'var TESTVERSIE = false;' — hier voor de testversie op true
VERSION = 'v58.9 - 14 nov 20u55 (testbuild 14 nov 20u55)';
(function () {
  var s = document.createElement('style');
  s.textContent = "/* v57.8: Testen-blokje in Instellingen ( Ontwerp 7, gekeurd 14 nov 09:08 ) \u2014 uitklapdelen, testrijen en zwart balkje-onder (stijl meet-blokje) */\n.testitem { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; margin-top: 8px; font-size: 14px; font-weight: 700; } /* v58.9: elk testpunt een eigen subtiel kaartje, zonder nummer */\n.testitem .tnum { flex: none; color: var(--muted); }\n.testitem .tnm { flex: 1; min-width: 0; overflow-wrap: anywhere; }\n.testitem .tnm small { display: block; font-weight: 400; font-size: 12px; color: var(--muted); }\n.testitem .ga { flex: none; border: 1px solid var(--line); background: var(--soft); border-radius: 10px; min-height: 36px; padding: 0 12px; font-weight: 800; font-size: 13px; color: var(--fg); cursor: pointer; }\n.testitem.klaar .ga { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }\n#testbalk { position: fixed; right: 8px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); z-index: 61; background: #111; color: #fff; border-radius: 12px; padding: 8px 10px; font-size: 12px; line-height: 1.35; max-width: 260px; box-shadow: 0 2px 10px rgba(0,0,0,.45); } /* v58.4: compacter, rechtsonder als zwevend kaartje */\n#testbalk[hidden] { display: none; }\n#testbalk .tbmain { max-height: 40dvh; overflow-y: auto; padding-right: 24px; } /* v58.4: ruimte voor het kruisje rechtsboven */\n#testbalk b { display: block; margin-bottom: 2px; }\n#testbalk .tbknoppen { display: flex; gap: 6px; margin-top: 8px; align-items: center; flex-wrap: wrap; }\n#testbalk .tbknoppen button { flex: none; width: auto; min-width: 34px; padding: 0 8px; border: none; border-radius: 10px; min-height: 34px; font-weight: 800; font-size: 13px; cursor: pointer; background: #2e2e2e; color: #fff; white-space: normal; } /* v58.4: compacter; Volgende-label mag binnen het vak omlopen */ /* v57.8: smalle knopjes rechts: \u2713 doet het, \u2717 gaat fout, \u25b8 volgende */\n#testbalk .tbknoppen button.ok { background: #3E6B4F; }\n#testbalk .tbknoppen button.fout { background: #A95042; }\n#testbalk .tbknoppen #tbx { position: absolute; top: 4px; right: 6px; margin-left: 0; min-width: 28px; min-height: 28px; } /* v58.4: klein kruisje rechtsboven in het venster — verbergt balk+pillete, uitslagen blijven */ /* v57.8: apart klein \u2715 rechts \u2014 weg zonder navigeren; pilletje brengt het terug */\n#testpill { position: fixed; right: 44px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); z-index: 61; background: #111; color: #fff; border: none; border-radius: 99px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,.45); } /* v58.4: rechtsonder, naast het kruisje */\n#testpill[hidden] { display: none; }\n#testpillx { position: fixed; right: 8px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); z-index: 61; width: 30px; height: 30px; border-radius: 50%; border: none; background: #111; color: #fff; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,.45); } /* v58.4: kruisje naast het pilletje — verbergt alles, wist niets */\n#testpillx[hidden] { display: none; }\n/* v57.8: in donker/extreem-contrast zijn #meetblok, #testbalk en #testpill gedempt in thema-kleuren (in Warm Zand / Rustig Salie blijft het zwart) */\n:root[data-theme=\"dark\"] #meetblok, :root[data-theme=\"contrast\"] #meetblok,\n:root[data-theme=\"dark\"] #testbalk, :root[data-theme=\"contrast\"] #testbalk,\n:root[data-theme=\"dark\"] #testpill, :root[data-theme=\"contrast\"] #testpill { background: var(--surface); color: var(--fg); border: 1px solid var(--line); box-shadow: none; }\n:root[data-theme=\"dark\"] #testbalk .tbknoppen button, :root[data-theme=\"contrast\"] #testbalk .tbknoppen button { background: var(--soft); color: var(--fg); }\n:root[data-theme=\"dark\"] #testbalk .tbknoppen button.ok, :root[data-theme=\"contrast\"] #testbalk .tbknoppen button.ok { background: var(--accent); color: var(--on-accent); }\n:root[data-theme=\"dark\"] #testbalk .tbknoppen button.fout, :root[data-theme=\"contrast\"] #testbalk .tbknoppen button.fout { background: var(--weg); color: var(--bg); }\n:root[data-theme=\"dark\"] #testpillx, :root[data-theme=\"contrast\"] #testpillx { background: var(--surface); color: var(--fg); border: 1px solid var(--line); box-shadow: none; }";
  document.head.appendChild(s);
  // v58.8: het testmenu staat op de eigen pagina testen.html (#testview); hier alleen de footer-CSS
  s.textContent += "\n.appfoot { padding: 14px 16px calc(14px + env(safe-area-inset-bottom, 0px)); text-align: center; } .appfoot a, .appfoot button { color: var(--muted); font-size: 13px; font-weight: 700; text-decoration: none; background: none; border: none; cursor: pointer; padding: 10px 14px; border-radius: 99px; } .appfoot a:hover, .appfoot button:hover { background: var(--soft); }";
})();
  // v57.8: Testen-blokje in Instellingen — automatische zelftest + testrondje (klein rondje / volledige check) met meeneem-flow.
  // Indeling + flow: Ontwerp 7 (Voorbeelden/testen-blokje-4-uitklapdelen-14nov.html), keuring Marlijn 14 nov 09:08 + keuren-lijst 14 nov (12:xx).
  var TESTKEY = 'eetweek.testronde'; // uitslagen testrondje bewaard onder eigen sleutel (zoals eetweek.meetHulp)
  var TESTDAG = (String(VERSION).match(/\d+ \w+/) || ['?'])[0]; // v58.9: vinkjes per DAG (bv. '14 nov', zonder tijdstip) — een volgende bouwronde van vandaag behoudt ze
  // VASTE REGEL (afspraak 14 nov): bij ELKE nieuwe versie dit lijstje aanvullen met wat er in die versie is veranderd
  var VERS_TESTEN = [ // v58.9 - 14 nov 20u55 (opgehoopt v58.0 t/m v58.9, gegroepeerd in 5 delen)
    {"versie":"v58.0","deel":1,"t":"Kaal recept-kaartje met korte kernregel","sub":"alleen aantal + kcal per portie/stuk (bv. “12 muffins · ± 110 kcal per muffin” of “1 portie · ± 137 kcal”) — geen lange Totaal-zin, geen prijs en geen ingrediëntenlijst meer op het kaartje","ga":"rec","doen":"Kijk op de Recepten-tab: staat er bij elk recept alleen de korte kernregel?","hand":""},
    {"versie":"v58.0","deel":1,"t":"Drie gelijke knoppen + ⋮-menuutje op het kaartje","sub":"🍳 Start met koken breed bovenaan, daaronder 🧺 Voorbereiden en 📋 Kopiëren; rechtsboven het ⋮-menu met Bewerken / Aanpassen met Mistral / Emoji wijzigen / Verwijderen (geen Kopiëren in het menu)","ga":"rec","doen":"Tik op het ⋮-menuutje rechtsboven op een kaartje — opent het menu met precies die vier acties?","hand":""},
    {"versie":"v58.0","deel":1,"t":"📋 Kopiëren: ingrediënten als losse regels op het klembord","sub":"bv. “295 g banaan” per regel, daarna de toast “Gekopieerd”","ga":"rec","doen":"Tik 📋 Kopiëren op een kaartje en plak de tekst ergens anders (bv. een notitie-app) — staat elk ingrediënt op één eigen regel?","hand":""},
    {"versie":"v58.0","deel":1,"t":"🧺 Voorbereiden-blok in Kookhulp","sub":"afvinkrondjes bij de ingrediënten met hoeveelheden + een 🍳 Start met koken-knop; spring vanaf het kaartje opent meteen het juiste blok met het recept voor-ingeschakeld","ga":"rec","doen":"Tik 🧺 Voorbereiden op een kaartje — kom je in Kookhulp met het Voorbereiden-blok open en het recept gekozen? Vink een paar ingrediënten af.","hand":""},
    {"versie":"v58.0","deel":1,"t":"Kookmodus start meteen bij stap 1","sub":"het “DIT HEB JE NODIG”-startscherm is weg (dat doet het Voorbereiden-blok nu)","ga":"kook","doen":"Tik 🍳 Start met koken op een kaartje — begint de kookmodus meteen bij stap 1 van de bereiding?","hand":""},
    {"versie":"v58.0","deel":1,"t":"In Recept bewerken: Totaal-zin + per-ingrediënt kcal en prijs","sub":"de lange Totaal-zin (incl. “nog te schatten”) staat alléén nog in het bewerk-scherm, mét kcal en prijs per ingrediënt","ga":"recedit","doen":"Open een recept via ⋮ → Bewerken — zie je de lange Totaal-zin én per-ingrediënt kcal en prijs?","hand":"open zelf een recept via het ⋮-menu → Bewerken"},
    {"versie":"v58.3","deel":1,"t":"Recept-kaartje écht dicht","sub":"dicht ALLEEN emoji+naam; tik op het kaartje klapt het open — dan pas kernregel + 3 knoppen + ⋮-menu","ga":"rec","doen":"Kijk op de Recepten-tab: is het kaartje dicht met alleen de naam? Tik erop — klapt het open met kernregel, 🍳/🧺/📋 en ⋮?","hand":""},
    {"versie":"v58.3","deel":1,"t":"\"Per moment\"-groepjes terug","sub":"inklapbare 📁 Per moment → Ochtend/Lunch/… en 📦 Nog in te delen, zoals vóór v58.2","ga":"rec","doen":"Klap \"Per moment\" open op de Recepten-tab — zie je de moment-groepjes met de kaartjes erin?","hand":""},
    {"versie":"v58.3","deel":1,"t":"⋮-menuutje dicht na keuze","sub":"na tik op Bewerken / Aanpassen met Mistral / Emoji wijzigen gaat het menuutje direct dicht (bij Verwijderen pas na \"Echt verwijderen?\")","ga":"rec","doen":"Open het ⋮-menuutje op een kaartje en tik Bewerken — sluit het menuutje direct (ook als het bewerk-scherm opengaat)?","hand":""},
    {"versie":"v58.4","deel":2,"t":"Mistral-model uit localStorage + APP.gem op alle pagina's","sub":"standaard mistral-medium-latest; kassabon/etiket-scanner werken op Week/Producten/Instellingen (geen \"Mistral is niet geladen\"); bij geen sleutel/internet: \"Mistral kan nu niet, probeer het later opnieuw\"","ga":"week","doen":"Open de kassabon-scanner op de Week-tab zonder internet — zie je een gewone melding in plaats van een technische fout?","hand":""},
    {"versie":"v58.4","deel":2,"t":"Kcal bij eigen woorden = per stuk","sub":"\"3 crackers\" = kcal van 3 stuks, \"1 appel\" = kcal van 1 stuk (niet van 3/1 gram)","ga":"moment","doen":"Voeg \"3 crackers\" toe via Zeg wat je at — klopt de kcal (per stuk, niet per gram)?","hand":""},
    {"versie":"v58.4","deel":2,"t":"Sap/moes/jam niet meer \"Binnen de richtlijn\"","sub":"verwerkt fruit (sap, moes, jam, compote) krijgt de gewone controle","ga":"prijsprod","doen":"Zoek in Producten een sap/jam/moes — staat er géén groen \"Binnen de richtlijn\" meer?","hand":""},
    {"versie":"v58.4","deel":2,"t":"Mijn normale dag: normale portie + normale stapjes","sub":"gram-product = 100 g (of laatst gebruikte), stapjes ±25 g; stuk/eigen woord = 1, stap ±1 — geen 1 gram/0,5 meer","ga":"week","doen":"Ga via ⚙️ Instellingen naar ⚡ Mijn normale dag, voeg een product toe — staat er een normale portie met normale stapjes?","hand":""},
    {"versie":"v58.4","deel":2,"t":"Dubbel recept geweerd bij plakken","sub":"zelfde recept twee keer plakken + Bewaar = \"staat er al in\", geen tweede exemplaar","ga":"recplak","doen":"Plak hetzelfde recept twee keer en tik Bewaar — krijg je de melding en staat het maar één keer in Recepten?","hand":""},
    {"versie":"v58.4","deel":2,"t":"Kookmodus: augurken bij de juiste stap; Kwark-Fris één start-knop","sub":"augurken bij de blokjes-stap (niet bij augurkenvocht); Kwark-Fris staat in één moment-groep","ga":"kook","doen":"Open de kookmodus van Tonijnsalade — staat \"augurken\" bij de juiste stap? Staat Kwark-Fris maar één keer in \"Per moment\"?","hand":""},
    {"versie":"v58.5","deel":3,"t":"Zesde tab Boodschappen met getekende SVG-balk","sub":"zes 24px SVG-icoontjes zonder tekst, met aria-label; per pagina het eigen tabje actief; lege boodschappen.html (alleen kop \"Boodschappen\")","ga":"week","doen":"Kijk naar de tab-balk: zes getekende icoontjes? Tik Boodschappen — lege pagina met kop \"Boodschappen\"?","hand":""},
    {"versie":"v58.5","deel":3,"t":"AI-opzoek respecteert Mijn supermarkten","sub":"in de Mistral-prompt staat de lijst van aangevinkte supermarkten; bron-URL alleen bij een échte hit (nooit verzonnen)","ga":"prijsprod","doen":"Vink bij ⚙️ Instellingen → Mijn supermarkten AH uit en doe een live opzoek — komt er géén AH-bron/link meer?","hand":""},
    {"versie":"v58.6","deel":4,"t":"Kop eerst, tabbalk eronder — op elke pagina én in de single","sub":"titelrij \"Mijn Eetboek\" + zon/maan/contrast bovenaan, daaronder zes 24px SVG-tabjes op één rij (geen tekst; Boodschappen zakt niet naar een tweede regel)","ga":"week","doen":"Kijk bovenaan: staat de kop met de drie thema-knopjes eerst en de tabbalk eronder? Zitten alle zes icoontjes op één rij?","hand":""},
    {"versie":"v58.6","deel":4,"t":"Zesde tab Boodschappen werkt ook in de single","sub":"tabbo krijgt aria-pressed mee; lege boodschappen-pagina met kop \"Boodschappen\" (nu ook in de echte app)","ga":"week","doen":"Tik het boodschappen-icoontje in de tabbalk — lege pagina met kop \"Boodschappen\" en het tabje gemarkeerd (aria-pressed)?","hand":""},
    {"versie":"v58.7","deel":5,"t":"Voorbereiden-blok zonder recepten-kiezer","sub":"geen \"Kies uit Mijn Recepten\"-menu meer in het Kookhulp-blok; los open zie je alleen: \"Open een recept bij Recepten en tik op 🧺 Voorbereiden om de ingrediënten klaar te leggen\"","ga":"gem","doen":"Open Kookhulp → Voorbereiden zonder via een kaartje te gaan: zie je alleen de rustige tekstregel? Tik dan bij Recepten op 🧺 Voorbereiden bij een recept — Verschijnt direct de afvinklijst van dát recept?","hand":""},
    {"versie":"v58.8","deel":5,"t":"Eigen testen-pagina met rustige footer-link","sub":"🧪 Testen staat onderaan in de footer, niet in de tabbalk (die houdt 6 tabjes); Instellingen is rustig zonder testblok; de testpagina heeft een duidelijke terugknop","ga":"test","doen":"Tik onderaan op 🧪 Testen — kom je op de testpagina (terugknop aanwezig)? Staat Instellingen zonder testblok?","hand":""},
    {"versie":"v58.8","deel":5,"t":"Nieuw in deze versie per deel gegroepeerd + vinkjes per dag","sub":"elk deel (max 5) heeft een eigen kopje met teller \"x van y nagekomen\"; vinkjes blijven bewaard bij een nieuwe testbuild van dezelfde dag (eetweek.testronde keyed op v58.8)","ga":"test","doen":"Zie je de deel-kopjes met tellers? Vink een punt aan en herlaad de pagina — blijft het vinkje staan?","hand":""},
    {"versie":"v58.9","deel":5,"t":"Strakke testpagina (v58.9)","sub":"testmenu direct onder \"← Terug naar de app\" (geen 🧪 Testen ^-uitklapper); 5 dichte deel-blokjes (één tegelijk open) met teller (x/y) in de kop; kaartjes zonder nummers; footer-link verborgen op de testpagina; knop \"▶ Eerste open punt\"","ga":"test","doen":"Kijk op deze pagina: staan de 3 secties direct onder ← Terug? Zie je Deel 1–5 als dichte blokjes met (x/y) in de kop, één tegelijk open? Werkt ▶ Eerste open punt (springt naar het eerste open punt)?"}
  ];
  // Ochtend-acties expres leeg: geen nieuwe dingen van de versie — ze zitten al in de Volledige check (deel 4)
  var OCHTEND_ACTIES = [];
  // VASTE REGEL (afspraak 14 nov): deze 14 punten synchroon houden met de bot-rondes (tests/kliktest.js) — als de bot-lijst verandert, deze lijst meeveranderen
  var VOL_PUNTEN = [ // v58.9: 14 vaste basischecks, gegroepeerd per onderwerp (grp) — geen dubbele v58-punten
    {"t":"Alle 6 tabs bovenaan één keer aantikken (werkt alles?)","ga":"week","doen":"Tik nu alle 6 tabs (de tab-balk bovenaan, incl. Boodschappen) één keer aan — werkt alles?","grp":"app"},
    {"t":"Weekpijltjes klikken + wisselen tussen platte weergave en blokjes","ga":"week","doen":"Klik de weekpijltjes ‹ › en wissel per groepje tussen platte rijen en blokjes (het grijze ▾). Lukt het wisselen?","grp":"week"},
    {"t":"Een product zoeken, aantal aanpassen en opslaan in een moment","ga":"moment","doen":"Zoek een product, pas het aantal aan en tik Toevoegen. Staat het daarna in het moment?","grp":"week"},
    {"t":"Eten in een moment van vandaag zetten (bijv. je ontbijt via 'Zeg wat je at' of via zoeken) lukt nog","ga":"moment","doen":"Zet je ontbijt van vandaag in een moment. Staat het daarna netjes in je dag?","grp":"week"},
    {"t":"Checken of het lege rondje (10x10 px) en het gevulde stipje goed staan","ga":"week","doen":"Kijk bij de momenten: staat het lege rondje (10×10 px) en het gevulde stipje goed?","grp":"week"},
    {"t":"Een recept met één tik in je moment zetten","sub":"kcal zijn daar bewust verstopt tot ‘Toon calorieën’","ga":"moment","doen":"Tik een recept-chip aan (bij ‘Uit mijn recepten’ of ‘Laatst gekozen’) — staat het recept daarna in je moment?","grp":"week"},
    {"t":"In Nieuw recept / Recept bewerken de Totaal-zin en 'nog te schatten' checken","ga":"recedit","hand":"open zelf een recept via Bewerken","doen":"Onderaan in de popup staat de Totaal-zin: ‘± X kcal voor het hele recept (± Y per portie, bij Z porties) plus nog te schatten’. Tel de ingrediënten na, kijk of het totaal en het portie-getal kloppen, en check of ‘nog te schatten’ klopt: staat de melding er terwijl alle ingrediënten een getal hebben (zoals bij Smeerkaas en hartig beleg: 137, alles geteld, toch de melding), dan tik je ✗.","grp":"rec"},
    {"t":"Zoekbalk gebruiken + nieuw-product-popup openen (komt hij bovenin?)","ga":"prijsprod","doen":"Gebruik de zoekbalk op Producten en open daarna \"Nieuw product\" — opent de popup bovenin?","grp":"prod"},
    {"t":"Recept plakken: tekst plakken bij nieuw recept en opslaan","ga":"recplak","doen":"Plak een recepttekst bij Recept plakken en sla op — lukt dat zonder fouten?","grp":"rec"},
    {"t":"Kookmodus openen (start meteen bij stap 1) en weer netjes afsluiten","ga":"kook","doen":"Open de kookmodus via 🍳 Start met koken op een recept-kaartje — begint hij meteen bij stap 1? Sluit hem daarna netjes af.","hand":"open zelf een recept en tik op 🍳 Start met koken","grp":"rec"},
    {"t":"Wisselen tussen licht, donker en hoog contrast (geen wit op wit?)","ga":"week","doen":"Wissel alle drie de thema’s (licht, donker, hoog contrast) — zie je geen wit op wit?","hand":"klik zelf op ☀️/🌙/◐ rechtsboven in de titelbalk — de app wisselt niet automatisch van thema","grp":"app"},
    {"t":"Breedte-check: even links/rechts vegen (geen 40 px speling?)","ga":"breedte","doen":"Veeg even links/rechts — zie je geen speling? (de app meet het nu ook automatisch)","grp":"app"},
    {"t":"Backup bewaren en terugzetten zonder fouten","ga":"instbewaar","doen":"Open \"Bewaren & terugzetten\", bewaar een backup en zet die terug — gaat dat zonder fouten?","grp":"app"},
    {"t":"Week kopiëren en in de tekst de dagtelling en kcal lezen — klopt het?","ga":"week","doen":"Tik op \"Week kopiëren\" en lees in de tekst of de dagtelling en de kcal kloppen.","grp":"week"}
  ];

  function testLijst(r) { return r === 'klein' ? VERS_TESTEN.concat(OCHTEND_ACTIES) : VOL_PUNTEN; }
  function testState() {
    var st = { v: VERSION, klein: {}, vol: {}, laatste: '' };
    try { var v = JSON.parse(localStorage.getItem(TESTKEY) || 'null'); if (v && typeof v === 'object' && v.v === TESTDAG) { st.klein = v.klein || {}; st.vol = v.vol || {}; st.laatste = v.laatste || ''; } } catch (e) {} // v57.8 punt 7a: versie mismatch (nieuwe versie) = tellers beginnen automatisch op 0
    return st;
  }
  function testStateSave(st) { st.v = TESTDAG; try { localStorage.setItem(TESTKEY, JSON.stringify(st)); } catch (e) {} }
  function testTel(r, st) {
    var n = testLijst(r).length, k = 0;
    for (var i = 0; i < n; i++) if (st[r] && st[r][i]) k++;
    return k + ' van ' + n + ' nagekeken';
  }
  function testItemHtml(r, i, it, st) {
    var done = !!(st[r] && st[r][i]);
    return '<div class="testitem' + (done ? ' klaar' : '') + '" id="ti-' + r + '-' + i + '"><span class="tnm">' + esc(it.t) + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</span>' +
      '<button type="button" class="ga" data-act="testga" data-r="' + r + '" data-i="' + i + '">' + (done ? '✓' : 'Ga ▶') + '</button></div>';
  }
  function renderTesten() {
    var vl = $('verslijst'), vol = $('vollijst');
    if (!vl && !vol) return;
    var st = testState();
    var td = $('testdag'); if (td) { // v58.9 idee 1: één samenvattingsregel bovenaan de testpagina
      var n = VERS_TESTEN.length, k = 0, dn = {};
      for (var i = 0; i < n; i++) { if (st.klein[i]) k++; dn[Math.min(5, Math.max(1, VERS_TESTEN[i].deel || 1))] = 1; }
      td.textContent = String(VERSION).split(' ')[0] + ' · ' + Object.keys(dn).length + ' delen · ' + n + ' punten · ' + k + ' van ' + n + ' nagekeken';
    }
    if (vl) {
      var h = ''; // v58.9: per deel een dicht uitklapblokje 'Deel d · vX–vY (k/n)' — teller alleen in de kop, één blokje tegelijk open (accordion onderaan)
      var delen = {};
      for (var i = 0; i < VERS_TESTEN.length; i++) {
        var d = Math.min(5, Math.max(1, VERS_TESTEN[i].deel || 1));
        (delen[d] = delen[d] || []).push(i);
      }
      Object.keys(delen).sort(function (a, b) { return +a - +b; }).forEach(function (d) {
        var items = delen[d], k = 0, open = [];
        items.forEach(function (i) { if (st.klein[i]) k++; else open.push(i); });
        var vs = items.map(function (i) { return VERS_TESTEN[i].versie || ''; }).filter(Boolean).sort();
        var range = vs.length ? (vs[0] + (vs.length > 1 && vs[vs.length - 1] !== vs[0] ? '–' + vs[vs.length - 1] : '')) : '';
        h += '<details class="per" id="deelK' + d + '"><summary>Deel ' + d + (range ? ' · ' + range : '') + ' <span class="hint stat">(' + k + '/' + items.length + ')</span></summary>';
        open.forEach(function (i) { h += testItemHtml('klein', i, VERS_TESTEN[i], st); });
        h += '</details>';
      });
      vl.innerHTML = h;
    }
    if (vol) {
      var h3 = ''; // v58.9: 14 vaste checks in 4 dichte blokjes per onderwerp, teller (k/n) alleen in de kop
      var VG = [ ['week', '📅 Week & Eten'], ['rec', '🍽️ Recepten & Kookhulp'], ['prod', '📦 Producten & Zoeken'], ['app', '🛒 Boodschappen & App'] ];
      var gidx = {};
      for (var k = 0; k < VOL_PUNTEN.length; k++) { var g = VOL_PUNTEN[k].grp || 'app'; (gidx[g] = gidx[g] || []).push(k); }
      VG.forEach(function (vg) {
        var items = gidx[vg[0]] || [], kk = 0, open = [];
        items.forEach(function (k) { if (st.vol[k]) kk++; else open.push(k); });
        h3 += '<details class="per" id="volG' + vg[0] + '"><summary>' + vg[1] + ' <span class="hint stat">(' + kk + '/' + items.length + ')</span></summary>';
        open.forEach(function (k) { h3 += testItemHtml('vol', k, VOL_PUNTEN[k], st); });
        h3 += '</details>';
      });
      vol.innerHTML = h3;
    }
    var vr = $('testverbergregel'); if (vr) { var verborgen = false; try { verborgen = sessionStorage.getItem('eetweek.testverberg') === '1'; } catch (e) {} vr.hidden = !verborgen; } // v58.4
  }

  // ---- meeneem-flow: balkje onderaan (zelfde stijl als het meet-blokje) + pilletje ----
  var testNu = null; // { r, i } van het punt dat nu loopt
  function testBalk() {
    var b = $('testbalk');
    if (!b) {
      b = document.createElement('div');
      b.id = 'testbalk'; b.hidden = true;
      b.innerHTML = '<div class="tbmain"><b id="tbkop"></b><span id="tbtekst"></span></div>' +
        '<div class="tbknoppen">' +
        '<button type="button" id="tbmin" data-act="testmin" aria-label="Balktje inklappen" title="Inklappen naar pilletje">▾</button>' +
        '<button type="button" class="ok" id="tbgoed" data-act="testgoed" title="Doet het">✓</button>' +
        '<button type="button" class="fout" id="tbfout" data-act="testfout" title="Gaat fout">✗</button>' +
        '<button type="button" class="ok" id="tbvolgende" data-act="testvolgende" hidden title="Volgende punt">▸ Volgende</button>' +
        '<button type="button" id="tbterug" data-act="testterug" title="Terug naar het overzicht in Instellingen">Terug</button>' +
        '<button type="button" id="tbx" data-act="testverberg" aria-label="Testbalkje helemaal verbergen" title="Helemaal verbergen — uitslagen blijven bewaard — pilletje onderin brengt het terug">✕</button>' +
        '</div>';
      document.body.appendChild(b);
    }
    return b;
  }
  function testPill() {
    var p = $('testpill');
    if (!p) {
      p = document.createElement('button');
      p.type = 'button'; p.id = 'testpill'; p.hidden = true; p.setAttribute('data-act', 'testpill');
      document.body.appendChild(p);
    }
    var x = $('testpillx'); // v58.4: kruisje naast het pilletje — verbergt balk+pillete zonder wissen
    if (!x) {
      x = document.createElement('button');
      x.type = 'button'; x.id = 'testpillx'; x.hidden = true; x.setAttribute('data-act', 'testverberg');
      x.setAttribute('aria-label', 'Testbalkje helemaal verbergen (uitslagen blijven bewaard)');
      x.title = 'Verberg balkje + pilletje — opgeslagen uitslagen blijven bewaard';
      x.textContent = '\u2715';
      document.body.appendChild(x);
    }
    return p;
  }
  function testRondeVan() { return testNu ? testNu.r : (testState().laatste || 'vol'); }
  function testPillTekst() {
    var p = testPill(); if (p.hidden) return;
    p.textContent = testTel(testRondeVan(), testState()) + ' ▸';
  }
  function testMin() { // balkje dicht naar pilletje (pijltje ▾ of ✕ weg, of toetsenbord open)
    var b = $('testbalk'); if (!b || b.hidden) return;
    b.hidden = true;
    var p = testPill(); p.hidden = false; testPillTekst();
    var px = $('testpillx'); if (px) px.hidden = false;
  }
  function testPillOpen() { // tik op het pilletje: balkje weer open, verder waar je was
    var p = $('testpill'); if (p) p.hidden = true;
    var px = $('testpillx'); if (px) px.hidden = true;
    var b = testBalk(); b.hidden = false;
  }
  function testTerug() { // v58.9: terug naar de Testen-pagina; bij 'klein' klapt automatisch het deel-blokje van het huidige punt open
    var r = testRondeVan();
    var b = $('testbalk'); if (b) b.hidden = true;
    var p = $('testpill'); if (p) p.hidden = true;
    testGaTab('test');
    var doel = r === 'klein' ? $('deelVers') : $('deelVol');
    if (r === 'klein' && testNu) {
      var it = testLijst('klein')[testNu.i];
      if (it) { var d = Math.min(5, Math.max(1, it.deel || 1)); var dk = $('deelK' + d); if (dk) doel = dk; }
    }
    if (doel) { doel.open = true; if (doel.scrollIntoView) doel.scrollIntoView({ block: 'start' }); }
  }
  function testSluitOpenDeel() {
    var co = document.getElementById('choiceov'); if (co && typeof closeChoice === 'function') closeChoice(true);
    var sh = document.querySelector('.sheet:not([hidden])');
    if (sh) { var b = sh.querySelector('[data-act$="close"]'); if (b) { b.click(); return; } }
  }
  function testGaTab(t) { S.tab = t; render(); if (window.scrollTo) window.scrollTo(0, 0); }
  function testGaMoment() {
    testGaTab('week');
    var wk0 = fmtId(S.start), wk6 = fmtId(addDays(S.start, 6)), vid = vandaagId();
    var day = (vid >= wk0 && vid <= wk6) ? vid : wk0;
    S.open = {}; S.open[day] = true; render();
    var p = day.split('-'), dow = new Date(+p[0], +p[1] - 1, +p[2]).getDay();
    var ms = eetMomenten(dow, dayDoc(day));
    if (ms && ms.length) openSheet(day, ms[0].slot, dow);
  }
  function testGa(r, i) {
    var lijst = testLijst(r), it = lijst[i]; if (!it) return;
    testNu = { r: r, i: i };
    testSluitOpenDeel();
    var auto = '', extraHand = '';
    if (it.ga === 'week' || it.ga === 'tabs' || it.ga === 'breedte') testGaTab('week');
    else if (it.ga === 'moment') testGaMoment();
    else if (it.ga === 'rec') testGaTab('rec');
    else if (it.ga === 'recedit') { testGaTab('rec'); if (S.recipes && S.recipes.length && typeof recEditorOpen === 'function') recEditorOpen(S.recipes[0]); else extraHand = ' ' + (it.hand || 'open zelf een recept via Bewerken') + '.'; }
    else if (it.ga === 'prijsprod') { testGaTab('prijs'); prodOpen(null); }
    else if (it.ga === 'recplak') { testGaTab('rec'); openPaste(); }
    else if (it.ga === 'kook') { testGaTab('rec'); if (S.recipes && S.recipes.length) cookOpen(S.recipes[0].id); else extraHand = ' ' + it.hand + '.'; }
    else if (it.ga === 'inst') testGaTab('inst');
    else if (it.ga === 'instbewaar') { testGaTab('inst'); var g = $('grpBewaren'); if (g) { g.open = true; if (g.scrollIntoView) g.scrollIntoView({ block: 'start' }); } }
    if (it.ga === 'breedte') {
      var sw = document.documentElement.scrollWidth, iw = window.innerWidth;
      auto = ' Zelf gemeten: de app is ' + sw + ' px breed op een scherm van ' + iw + ' px — ' + (sw <= iw + 1 ? 'geen zijwaartse speling.' : 'ER IS nog ' + (sw - iw) + ' px zijwaartse speling!');
    }
    if (it.hand && it.ga !== 'recedit' && it.ga !== 'kook') extraHand = (it.ga ? ' ' : ' Niet automatisch te openen: ') + it.hand + '.';
    var b = testBalk(); b.hidden = false;
    var p = $('testpill'); if (p) p.hidden = true;
    var px3 = $('testpillx'); if (px3) px3.hidden = true;
    $('tbgoed').hidden = false; $('tbfout').hidden = false; $('tbvolgende').hidden = true; $('tbterug').hidden = false;
    var deelTxt = ''; // v58.9 idee 2: balk-kop toont in welk deel je test
    if (r === 'klein' && it.deel) {
      var vv = [];
      for (var di = 0; di < VERS_TESTEN.length; di++) if (Math.min(5, Math.max(1, VERS_TESTEN[di].deel || 1)) === it.deel) vv.push(VERS_TESTEN[di].versie || '');
      vv = vv.filter(Boolean).sort();
      deelTxt = 'Deel ' + it.deel + (vv.length ? ' · ' + vv[0] + (vv.length > 1 && vv[vv.length - 1] !== vv[0] ? '–' + vv[vv.length - 1] : '') : '') + ' — ';
    }
    $('tbkop').textContent = deelTxt + (i + 1) + ' van ' + lijst.length + ' — ' + it.t;
    $('tbtekst').textContent = it.doen + auto + extraHand;
  }
  function testVink(goed) {
    if (!testNu) return;
    var st = testState(), r = testNu.r, i = testNu.i;
    st[r][i] = goed ? 'goed' : 'fout'; st.laatste = r; testStateSave(st);
    renderTesten(); testPillTekst();
    var lijst = testLijst(r), n = lijst.length, volgend = (i + 1 < n) ? i + 1 : -1; // na punt X meteen "ga je door naar punt X+1 van N?"; bij het laatste punt "Klaar!"
    $('tbgoed').hidden = true; $('tbfout').hidden = true; $('tbterug').hidden = false;
    if (volgend >= 0) {
      $('tbkop').textContent = 'Opgeslagen ✓';
      $('tbtekst').textContent = 'Ga je door naar punt ' + (volgend + 1) + ' van ' + n + ' (' + lijst[volgend].t + ')?';
      var vn = $('tbvolgende'); vn.hidden = false; vn.textContent = '▸ Volgende'; // v58.4: kort label, past binnen het compacte vak (punt staat al in de tekst erboven)
      vn.setAttribute('data-r', r); vn.setAttribute('data-i', String(volgend));
    } else {
      $('tbkop').textContent = 'Klaar! Alles nagekeken ✓';
      $('tbtekst').textContent = 'Terug naar het overzicht (Terug) — tik in het Testen-blokje op "📋 Eindrapport maken".';
      $('tbvolgende').hidden = true;
    }
  }
  function testEind(r) {
    var st = testState(), lijst = testLijst(r), n = lijst.length;
    var regels = 'Testrondje — ' + new Date().toLocaleString('nl-NL') + ' — versie ' + VERSION + '\n' +
      'Ronde: ' + (r === 'klein' ? 'klein (Nieuw in deze versie)' : 'volledig (' + n + ' punten)') + '\n';
    var goed = 0, fout = 0;
    for (var i = 0; i < n; i++) {
      var s = st[r] && st[r][i];
      var u = !s ? 'NOG NIET NAGEKEKEN' : (s === 'goed' ? 'NAGEKEKEN GOED' : 'GAAT FOUT');
      if (s === 'goed') goed++; else if (s === 'fout') fout++;
      regels += (i + 1) + '. ' + lijst[i].t + ' ... ' + u + '\n';
    }
    if (r === 'vol') {
      var sw = document.documentElement.scrollWidth, iw = window.innerWidth;
      regels += '\nBreedte-check (automatisch gemeten nu): app ' + sw + ' px op scherm ' + iw + ' px — ' + (sw <= iw + 1 ? 'geen zijwaartse speling' : 'NOG ' + (sw - iw) + ' px zijwaartse speling') + '\n';
    }
    regels += '\nEinde: ' + (goed + fout) + ' van ' + n + ' nagekeken (' + goed + ' goed, ' + fout + ' fout).';
    showOut('Eindrapport testrondje', 'Platte tekst — tik op Kopiëren om mee te sturen.', regels, false);
  }

  // ---- automatische zelftest (deel 2) ----
  function zelftestRun() {
    var iw = window.innerWidth, ih = window.innerHeight;
    var regels = [], goed = 0, fout = 0;
    function regel(naam, ok, detail) {
      regels.push((regels.length + 1) + '. ' + naam + ' ... ' + (ok ? 'GOED' : 'FOUT') + (detail ? ' (' + detail + ')' : ''));
      if (ok) goed++; else fout++;
    }
    var sheets = document.querySelectorAll('.sheet');
    var past = 0, pastFout = [], scrollOk = 0, scrollFout = [], onderOk = 0, onderFout = [];
    for (var si = 0; si < sheets.length; si++) {
      var sh = sheets[si], wasHidden = sh.hidden;
      if (wasHidden) sh.hidden = false;
      try {
        var panel = sh.querySelector('.panel') || sh.querySelector('.cookpanel') || sh;
        var bodyEl = sh.querySelector('.pbody') || sh.querySelector('.cookmain') || panel;
        var r = panel.getBoundingClientRect();
        var cs = getComputedStyle(bodyEl);
        var magScrollen = cs.overflowY === 'auto' || cs.overflowY === 'scroll';
        if (r.left >= -1 && r.right <= iw + 1 && r.top >= -1) past++;
        else pastFout.push((sh.id || '?') + ': ' + Math.round(r.left) + '–' + Math.round(r.right) + ' px op ' + iw + ' px scherm');
        if (magScrollen) scrollOk++; else scrollFout.push(sh.id || '?');
        var onder = r.bottom - ih;
        if (onder <= 1 || magScrollen) onderOk++; else onderFout.push((sh.id || '?') + ': ' + Math.round(onder) + ' px onder de schermrand');
      } finally { if (wasHidden) sh.hidden = true; }
    }
    regel('Popups passen op het scherm', past === sheets.length, past + '/' + sheets.length + ' popups binnen ' + iw + '×' + ih + ' px' + (pastFout.length ? ' — te breed/buiten: ' + pastFout.join(', ') : ''));
    regel('Alle sheets mogen scrollen', scrollFout.length === 0, scrollOk + '/' + sheets.length + ' sheets scrollbaar' + (scrollFout.length ? ' — niet scrollbaar: ' + scrollFout.join(', ') : ''));
    regel('Niks verstopt onder de rand', onderFout.length === 0, onderOk + '/' + sheets.length + ' popups binnen het scherm of via scroll bereikbaar' + (onderFout.length ? ' — verstopt: ' + onderFout.join(', ') : ''));
    var sw = document.documentElement.scrollWidth;
    regel('Geen zijwaartse scroll-breedte', sw <= iw + 1, 'app ' + sw + ' px breed op scherm ' + iw + ' px');
    var opslagOk = false, opslagDetail = '';
    try {
      var key = TESTVERSIE ? 'eetweek.v1.testversie' : 'eetweek.v1';
      var v = localStorage.getItem(key);
      if (v) JSON.parse(v);
      localStorage.setItem('eetweek._zelftest', '1');
      opslagOk = localStorage.getItem('eetweek._zelftest') === '1';
      localStorage.removeItem('eetweek._zelftest');
      opslagDetail = (v ? 'bestaande opslag gelezen (' + v.length + ' tekens), ' : 'nog geen opslag aanwezig, ') + 'lees+schrijf-probe OK';
    } catch (e) { opslagDetail = 'foutmelding: ' + (e && e.message ? e.message : e); }
    regel('Opslag leesbaar', opslagOk, opslagDetail);
    var np = (S.prijzen || []).length;
    regel('Vaste producten aanwezig', np > 0, np + ' product(en) op de plank');
    var tekst = 'Zelf-test — ' + new Date().toLocaleString('nl-NL') + ' — versie ' + VERSION + '\n' + regels.join('\n') + '\n\nEinde: ' + goed + ' goed, ' + fout + ' fout.';
    return { tekst: tekst, goed: goed, fout: fout };
  }
  function zelftest() {
    var stat = $('zelfteststatus');
    if (stat) stat.textContent = 'Lopen… even geduld';
    setTimeout(function () {
      var res = zelftestRun();
      if (stat) stat.textContent = 'Klaar: ' + res.goed + ' goed, ' + res.fout + ' fout' + (res.fout ? ' ⚠' : ' ✓');
      showOut('Zelf-test — ' + new Date().toLocaleString('nl-NL'), 'Platte tekst — tik op Kopiëren.', res.tekst, false);
    }, 30);
  }

  // v58.9: accordion — binnen een lijst staat één deel/onderwerp-blokje tegelijk open
  document.addEventListener('toggle', function (ev) {
    var d = ev.target;
    if (!d || !d.id || !(d.id.indexOf('deelK') === 0 || d.id.indexOf('volG') === 0) || !d.open) return;
    var par = d.parentElement; if (!par) return;
    Array.prototype.forEach.call(par.querySelectorAll('details.per'), function (o) { if (o !== d) o.open = false; });
  }, true);
  document.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('[data-act]') : null;
    if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'zelftest') zelftest();
    else if (act === 'testeerstopen') { var stE = testState(), lijstE = testLijst('klein'); for (var ei = 0; ei < lijstE.length; ei++) { if (!stE.klein[ei]) { testGa('klein', ei); return; } } toast('Alles van deze versie is al nagekeken'); } // v58.9: ▶ Eerste open punt
    else if (act === 'testterug') { if (document.querySelector('.tabs')) { S.tab = 'week'; render(); if (window.scrollTo) window.scrollTo(0, 0); } else { location.assign('index.html'); } } // v58.8: terugknop op de testpagina (single: naar Week; losse pagina: index.html)
    else if (act === 'testga') testGa(el.getAttribute('data-r'), +el.getAttribute('data-i'));
    else if (act === 'testgoed') testVink(true);
    else if (act === 'testfout') testVink(false);
    else if (act === 'testvolgende') testGa(el.getAttribute('data-r'), +el.getAttribute('data-i'));
    else if (act === 'testterug') testTerug();
    else if (act === 'testmin' || act === 'testweg') testMin();
    else if (act === 'testpill') testPillOpen();
    else if (act === 'testeind') testEind(el.getAttribute('data-r'));
    else if (act === 'testreset') { var st2 = testState(); var rr = el.getAttribute('data-r'); st2[rr] = {}; st2.laatste = rr; testStateSave(st2); renderTesten(); testPillTekst(); toast('Vinkjes van dit rondje gewist'); } // v57.8 punt 7: ↺ opnieuw beginnen
    else if (act === 'testwis') { // v58.4: \u2717 alles weg — ALLE testuitslagen wissen (beide rondes, alle versies), dubbele tik zoals 'Alles leegmaken'
      var WKEY = 'eetweek.testwis', nuW = Date.now(), oudW = +(sessionStorage.getItem(WKEY) || 0);
      if (nuW - oudW > 5000) { sessionStorage.setItem(WKEY, String(nuW)); toast('Nog een keer tikken = álle testuitslagen wissen'); return; }
      sessionStorage.removeItem(WKEY);
      try { localStorage.removeItem(TESTKEY); } catch (e) {}
      testNu = null;
      var bw = $('testbalk'); if (bw) bw.hidden = true;
      var pw = $('testpill'); if (pw) pw.hidden = true;
      renderTesten(); testPillTekst(); toast('Alle testuitslagen gewist — alles begint weer bij 0');
    }
    else if (act === 'testverberg') { // v58.4: kruisje rechtsboven in het balkje én naast het pilletje — balk+pillete verbergen, opgeslagen uitslagen BLIJVEN staan
      try { sessionStorage.setItem('eetweek.testverberg', '1'); } catch (e) {}
      testNu = null;
      var bv = $('testbalk'); if (bv) bv.hidden = true;
      var pv = $('testpill'); if (pv) pv.hidden = true;
      var px = $('testpillx'); if (px) px.hidden = true;
      renderTesten(); toast('Testbalkje verborgen — uitslagen blijven bewaard (Testen-blokje → ▸ Toon testbalkje)');
    }
    else if (act === 'testtoon') { // vanuit het Testen-blokje het pilletje (en balkje) weer tonen
      try { sessionStorage.removeItem('eetweek.testverberg'); } catch (e) {}
      renderTesten();
      var pv2 = $('testpill'); if (pv2) { pv2.hidden = false; testPillTekst(); }
      var px2 = $('testpillx'); if (px2) px2.hidden = false;
      toast('Testbalkje terug');
    }
  });
  // v57.8: zodra het toetsenbord opengaat (typen in zoekbalk/zeg-blok) klapt het balkje automatisch dicht naar het pilletje
  document.addEventListener('focusin', function (ev) {
    var t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) testMin();
  });
  if (window.visualViewport && window.visualViewport.addEventListener) {
    window.visualViewport.addEventListener('resize', function () {
      if (window.innerHeight - window.visualViewport.height > 150) testMin();
    });
  }
