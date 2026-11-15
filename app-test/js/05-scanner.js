  function render() {
    var tb = S.tab;
    if (tb === 'invoer') tb = 'week'; // v47: de Toevoegen-tab bestaat niet meer (vinger-vingnet voor oude opslag)
    if (tb !== 'prijs') S.prFrom = null;
    // v45b.3: versienummer staat bovenaan Instellingen; kopregel is gewoon 'Mijn Eetboek'
    var verEl = $('appversie'); if (verEl) verEl.textContent = 'Mijn Eetboek — versie ' + VERSION;
    var wl = $('weeklabel'); if (wl) wl.innerHTML = 'Vr ' + short(S.start) + ' t/m do ' + short(addDays(S.start, 6)) + (weekIsRaar() ? ' <small>🙃</small>' : '') + '<small>' + (fmtId(S.start) === fmtId(startOfWeek(new Date())) ? 'Deze week' : 'Andere week') + '</small>';
    var rw = $('rareweekbtn'); if (rw) { rw.setAttribute('aria-pressed', String(weekIsRaar())); rw.textContent = weekIsRaar() ? '✓ Rare week aangezet (tik om uit te zetten)' : '🙃 Deze week was gewoon raar'; }
    var tl = $('todaylink'); if (tl) tl.hidden = fmtId(S.start) === fmtId(startOfWeek(new Date()));
    var bnEl = $('banner'); if (bnEl) { var bn = S.status === 'geen' ? '<div class="banner">Opslaan lukt niet in deze weergave. Wat je invult blijft alleen staan zolang je dit scherm open houdt. Gebruik Week kopiëren om niets kwijt te raken.</div>' : ''; bnEl.innerHTML = bn + backupTip(); }
    var daysEl = $('days'); if (daysEl) { var h = dayChipsHtml(); var wk0 = fmtId(S.start), wk6 = fmtId(addDays(S.start, 6)); Object.keys(S.open || {}).forEach(function (oid) { if (oid < wk0 || oid > wk6) return; var p = oid.split('-'); h += dayCard(new Date(+p[0], +p[1] - 1, +p[2])); }); daysEl.innerHTML = h; } // v53: horizontale dag-chips bovenin + alleen de open dag van déze week eronder
    var zg = $('zeg'); if (zg) zg.innerHTML = zegHtml(); // v53.1: vast zeg-kaartje bovenaan het Week-scherm, vóór de dag-chips
    var ob = $('optbottom'); if (ob) ob.innerHTML = (typeof wkTerugHtml === 'function' ? wkTerugHtml() : '') + optBottom(); // v49.2: "Alles terugzetten" boven de extra momenten
    var wv = $('weekview'); if (wv) wv.hidden = tb !== 'week'; var nw = $('navwrap'); if (nw) nw.hidden = tb !== 'week'; var rv = $('recview'); if (rv) rv.hidden = tb !== 'rec'; var pv = $('prijsview'); if (pv) pv.hidden = tb !== 'prijs'; var gv = $('gemview'); if (gv) gv.hidden = tb !== 'gem'; var iv = $('invoerview'); if (iv) iv.hidden = tb !== 'invoer'; var bv = $('boview'); if (bv) bv.hidden = (tb !== 'bo') && !!$('weekview'); // v58.6: Boodschappen-tab in de single (op de losse pagina geen weekview -> altijd zichtbaar)
    var tv = $('testview'); if (tv) tv.hidden = (tb !== 'test') && !!$('weekview'); // v58.8: Testen-pagina in de single (op de losse pagina testen.html geen weekview -> altijd zichtbaar)
    var af = document.querySelector('.appfoot'); if (af) af.hidden = (tb === 'test'); // v58.9: op de testpagina zelf geen footer-link 🧪 Testen (je bent er al)
    var iv2 = $('instview'); if (iv2) iv2.hidden = tb !== 'inst';
    var tw = $('tabweek'); if (tw) tw.setAttribute('aria-pressed', String(tb === 'week')); var tr = $('tabrec'); if (tr) tr.setAttribute('aria-pressed', String(tb === 'rec')); var tp = $('tabprijs'); if (tp) tp.setAttribute('aria-pressed', String(tb === 'prijs')); var ti = $('tabinvoer'); if (ti) ti.setAttribute('aria-pressed', String(tb === 'invoer')); var tg = $('tabgem'); if (tg) tg.setAttribute('aria-pressed', String(tb === 'gem'));
    var tin = $('tabinst'); if (tin) tin.setAttribute('aria-pressed', String(tb === 'inst'));
    var tbo = $('tabbo'); if (tbo) tbo.setAttribute('aria-pressed', String(tb === 'bo')); // v58.6: Boodschappen-tab aria-pressed meeschakelen
    if (tb === 'rec' && $('recview')) renderRecipes();
    if (tb === 'prijs' && $('prijsview')) renderPrijzen();
    if (tb === 'gem' && typeof updateMistralReceptenDropdown === 'function') updateMistralReceptenDropdown();
    if (tb === 'gem' && typeof window.vrRender === 'function') window.vrRender(); // v58: Voorbereiden-blok (checklist) up-to-date
    if (tb === 'test' && typeof renderTesten === 'function') renderTesten(); // v58.8: Testen-pagina renderen
    if (tb === 'inst' && typeof renderInst === 'function') renderInst();
    pasStijlToe(); updateMeetBlok(); // v57.6: stijlkeuze per pagina toepassen + meet-hulpje bijwerken
  }

  // ---- recepten
  function starterRecipes() {
    function ing(n, a, u, p) { return { n: n, a: a, u: u, p: p == null ? null : p }; }
    return [
      { id: uid() + 'a', name: 'Tonijnsalade', fixed: 140, steps: STEPS.tonijn, ing: [ing('Tonijn op water, goed uitgeknepen', 1, 'blikje'), ing('Zoetzure augurken in blokjes', '2-3', 'stuks'), ing('Magere kwark of Griekse yoghurt', 2, 'flinke el'), ing('Augurkenvocht', 1, 'tl')] },
      { id: uid() + 'b', name: 'Eiersalade', fixed: 295, steps: STEPS.ei, ing: [ing('Gekookte eieren', 3, 'stuks'), ing('Ham', 50, 'g'), ing('Magere kwark', 2, 'el'), ing('Augurkenvocht', '1-2', 'tl')] },
      { id: uid() + 'c', name: 'Mousse met poeder', ing: [ing('Eiwitpoeder', 25, 'g', 3.667), ing('Kwark Bayernkrone eiwitrijk', 100, 'g', 0.66), ing('Pure cacao', 5, 'g', 3.4), ing('Banaan', 0.75, 'stuk', 110)] },
      { id: uid() + 'd', name: 'Mousse zonder poeder', ing: [ing('Kwark Bayernkrone eiwitrijk', 150, 'g', 0.66), ing('Pure cacao', 5, 'g', 3.4), ing('Banaan', 0.5, 'stuk', 110)] },
      pizzaRecipe(),
      muffinRecipe(),
      koekjeRecipe(),
      kwarkFrisRecipe()
    ];
  }
  var STEPS = {
    tonijn: 'Knijp de tonijn goed uit en doe hem in een kommetje.\nSnijd de augurken in kleine blokjes en roer ze erdoor.\nMeng de kwark of Griekse yoghurt erdoor.\nVoeg als laatste de augurkenvocht toe, en peper en zout naar smaak.\nBewaren: afgesloten in de koelkast, maximaal 2 dagen (zo staat het in je schema). Het is genoeg voor 2 lunches.',
    ei: 'Kook de eieren hard (ongeveer 10 minuten), laat ze afkoelen en pel ze.\nPrak de eieren fijn met een vork.\nSnijd de ham in kleine stukjes en roer ze erdoor.\nMeng de kwark erdoor, voeg de augurkenvocht toe en maak af met peper en zout.\nBewaren: afgesloten in de koelkast, maximaal 3 dagen.',
    pizza: 'Verwarm de oven goed voor op 180 graden hetelucht.\nMeng de tomatenpuree met 1 tot 2 eetlepels water, de kruidenmix en een snufje knoflookpoeder. Smeer dit uit op het brood tot net aan de rand.\nLeg er eerst de spinazie op (vers, een flinke handvol). Diepvriesspinazie eerst kort bakken met knoflookpoeder, peper en nootmuskaat.\nVerdeel de ham en kip in stukjes, daarna de olijven (als je die wilt) en de gehalveerde, drooggedepte mozzarellaballetjes.\nLeg de gehalveerde cherrytomaatjes erop, snijkant naar boven. Eventueel een beetje Parmezaan erover.\nBak 10 minuten op 180 graden en kijk na 7 minuten. Wordt de rand donkerbruin, haal hem er dan eerder uit.\nStrooi na het bakken een snufje kruiden over de hete pizza en eet hem meteen.\nTip: de broden zijn groot. Laat het ene brood heel en snijd het andere doormidden, zodat alles op het rooster past.\nOpwarmen: 2 tot 3 minuten op 180 graden in de oven (kijk na 2 minuten). Niet in de magnetron, dan wordt de bodem slap.\nTip: gebruik geen extra zout, haal smaak uit kruiden, knoflook, peper, olijven en Parmezaan.',
    muffin: 'Verwarm de oven voor op 165 graden hetelucht.\nMeng het poeder, de havermout, het lijnzaad, de cacao, het bakpoeder en 23 g muesli eerst droog.\nPrak de banaan heel fijn. Roer de kwark en de pindakaas erdoor en schep de droge mix erdoor.\nLaat het beslag ruim 15 minuten rusten, poeder en lijnzaad nemen veel vocht op. Roer daarna voorzichtig de frambozen erdoor.\nTip: is het beslag te dik, voeg dan 1 el kwark of een scheutje melk toe. Is het te nat, voeg dan 1 el havermout toe.\nVul de vormpjes (silicone, doorsnede 7 cm) met ± 51 g beslag. Meer dan 56 g is te veel en 65 g past niet. Strooi 4 tot 5 g muesli per muffin erbovenop en druk lichtjes aan. Dit geeft ± 12 muffins.\nBak 20 tot 25 minuten en prik vanaf ± 18 minuten. Schoon is klaar. Wordt de bovenkant te donker, leg er dan folie op. Is de binnenkant nog nat, bak dan 5 minuten langer.\nLaat de muffins 10 minuten in het vormpje staan en daarna op een rooster helemaal afkoelen. Zonder ei stevigen ze daar pas op.\nMaak van het restbeslag (± 190 g) koekjes, zie het recept Koekjes uit restbeslag.\nTip: zo gebakken zijn ze van binnen droog maar niet te droog. Is een muffin toch te droog, bak dan de volgende keer 5 minuten korter of voeg 1 el kwark toe.\nTip: doe de topping (cottage cheese, appel, kaneel) pas bij het eten erop en kies die apart.\nBewaren: ± 4 muffins in de koelkast (3 tot 4 dagen, in een gesloten bak, er zit kwark in). De rest per stuk invriezen en ontdooien in de koelkast. Rauw beslag invriezen is niet aan te raden, want het bakpoeder verliest kracht.\nOpwarmen: kort in de oven, niet in de magnetron.',
    koekje: 'Gebruik het restbeslag van de muffins (± 190 g).\nWeeg het beslag per koekje en druk het plat tot rondjes van ± 2 cm dik. Voor kleine koekjes: ± 47 g beslag per koekje, dat geeft er 4 uit ± 190 g. Dit is nog niet getest.\nBak ze in een koekenpan met deksel op laag tot middelhoog vuur, ± 6 tot 7 minuten per kant.\nDe koekjes zijn eerst zacht en worden na afkoelen stevig. Laat ze even liggen voor je ze eet.\nTip: in de app tel je een koekje in muffins. Gebakken gewicht gedeeld door 50 = aantal muffins. Een koekje van ± 90 g is 1,7 muffin, een koekje van ± 75 g is 1,4 muffin en een klein koekje van ± 47 g beslag telt als 1 muffin. Vul dat getal in bij Andere hoeveelheid.\nTip: ze zijn lekker koud uit de koelkast (meer korstje, steviger). Doe de topping (cottage cheese, appel, kaneel, eventueel muesli) pas bij het eten erop en kies die apart.\nBewaren: in de koelkast, 3 tot 4 dagen in een gesloten bak, net als de muffins. Per stuk invriezen kan ook.\nOpwarmen: kort in de oven, niet in de magnetron.'
  };
  function pizzaRecipe() {
    return { id: uid() + 'p', name: 'Pizza op Libanees brood', fixed: 345, steps: STEPS.pizza, ing: [
      { n: 'Libanees brood volkoren', a: 1, u: 'stuk', p: null }, { n: 'Tomatenpuree', a: 2, u: 'el', p: null },
      { n: 'Kruidenmix en knoflookpoeder', a: 1, u: 'tl', p: null }, { n: 'Verse spinazie', a: '30-40', u: 'g', p: null },
      { n: 'Gerookte ham', a: 2, u: 'plakken', p: null }, { n: 'Gebraden kipfilet met bieslook', a: 2, u: 'plakken', p: null },
      { n: 'Mini mozzarella light, gehalveerd', a: '4-5', u: 'balletjes', p: null }, { n: 'Cherrytomaatjes, gehalveerd', a: 'een paar', u: '', p: null },
      { n: 'Optioneel: zwarte olijfplakjes', a: 10, u: 'g', p: null }, { n: 'Optioneel: Parmezaan', a: 5, u: 'g', p: null } ] };
  }
  function muffinRecipe() {
    return { id: uid() + 'm', name: 'Muffin', unit: 'muffin', fixed: 110, por: 12, where: ['ochtend'], steps: STEPS.muffin, ing: [
      { n: 'Banaan, gepeld gewogen (3 bananen)', a: 295, u: 'g', p: null }, { n: 'Havermout', a: 60, u: 'g', p: null },
      { n: 'Bayernkrone Magere Kwark Eiwitrijk', a: 190, u: 'g', p: null }, { n: 'Pindakaas', a: 21, u: 'g', p: null },
      { n: 'Frambozen (diepvries)', a: 80, u: 'g', p: null }, { n: 'Cacao', a: 17, u: 'g', p: null },
      { n: 'Bakpoeder (een half zakje)', a: 8, u: 'g', p: null }, { n: 'Crunchy muesli, in het beslag', a: 23, u: 'g', p: null },
      { n: 'Crunchy muesli, bovenop (4 tot 5 g per muffin)', a: '60-70', u: 'g', p: null },
      { n: 'Vegan vanille-poeder (Healthy Fit)', a: 50, u: 'g', p: null }, { n: 'Gebroken lijnzaad', a: 50, u: 'g', p: null } ] };
  }
  function koekjeRecipe() {
    return { id: uid() + 'q', name: 'Koekjes uit restbeslag', unit: 'muffin (koekje)', fixed: 110, steps: STEPS.koekje, ing: [
      { n: 'Restbeslag van het muffinbeslag', a: 190, u: 'g', p: null } ] };
  }
