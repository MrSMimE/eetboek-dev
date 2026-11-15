  // ---- Kookmodus
  function hasSteps(r) { return !!(r && String(r.steps || '').split('\n').some(function (x) { return x.trim() && !/^(tip|bewaren|opwarmen)\s*:/i.test(x.trim()); })); }
  var COOK_STOP = ['de', 'het', 'een', 'en', 'of', 'met', 'van', 'in', 'op', 'uit', 'naar', 'te', 'per', 'gram', 'stuks', 'stuk', 'plakje', 'plakjes', 'beetje', 'snufje', 'scheut', 'handje', 'naar', 'smaak', 'vers', 'verse', 'fijn', 'grote', 'kleine', 'halve', 'hele', 'zonder', 'extra', 'light', 'volle', 'magere', 'halfvolle', 'ongezoete'];
  function cookWords(n) {
    return normName(String(n || '').split(',')[0].replace(/\([^)]*\)/g, ' ')).replace(/[0-9]+/g, ' ').split(/[^a-zà-ÿ]+/).filter(function (w) { return w && w.length >= 2 && COOK_STOP.indexOf(w) < 0; });
  }
  function cookMentions(text, ing) {
    var t = ' ' + normName(text) + ' ', ws = cookWords(ing.n);
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i], re;
      if (/^(ei|eieren|eiwit|eigeel|eidooier)$/.test(w)) re = /[^a-zà-ÿ](ei|eieren|eiwit|eigeel|eidooier)[^a-zà-ÿ]/;
      else if (w.length < 4) re = new RegExp('[^a-zà-ÿ]' + w + '[^a-zà-ÿ]');
      else re = new RegExp('[^a-zà-ÿ]' + w + '(s|en)?[^a-zà-ÿ]'); // v58.4: hele woorden met meervoud — "augurken" matcht niet meer op de augurkenvocht-stap
      if (re.test(t)) return true;
    }
    return false;
  }
  var COOK_EQUIP = [[/oven|bakplaat|ovenschaal/, 'Oven'], [/muffinvorm|muffinblik|cupcake|papieren vormpjes|bakvorm/, 'Vorm of blik'], [/bakplaat/, 'Bakplaat'], [/bakpapier/, 'Bakpapier'],
    [/koekenpan|braadpan|\bpan\b|wok/, 'Pan'], [/steelpan|pannetje|kookpan/, 'Pannetje'], [/handmixer|mixer\b/, 'Mixer'], [/staafmixer|blender/, 'Blender'], [/mengkom|\bkom\b/, 'Kom'],
    [/magnetron/, 'Magnetron'], [/airfryer/, 'Airfryer'], [/garde|klopper/, 'Garde'], [/spatel|lepel/, 'Spatel of lepel'], [/snijplank|\bmes\b/, 'Mes en snijplank'], [/weegschaal/, 'Weegschaal']];
  function cookEquip(txt) {
    var t = ' ' + normName(txt) + ' ', out = [];
    COOK_EQUIP.forEach(function (e) { if (e[0].test(t) && out.indexOf(e[1]) < 0) out.push(e[1]); });
    return out;
  }
  function cookSplit(line) {
    if (line.length <= 190) return [line];
    var parts = line.match(/[^.!?]+[.!?]*\s*/g) || [line], out = [], cur = '';
    parts.forEach(function (p) {
      if (cur && (cur + p).length > 170) { out.push(cur.trim()); cur = ''; }
      cur += p;
    });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function cookScreens(r) {
    var M = S.recMult || 1, lines = String(r.steps || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean), steps = [], tips = [];
    lines.forEach(function (l) {
      if (/^(tip|bewaren|opwarmen)\s*:/i.test(l)) { tips.push(l); return; }
      cookSplit(l.replace(/^\d+[.)]\s*/, '')).forEach(function (x) { steps.push(x); });
    });
    var scr = []; // v58: géén 'DIT HEB JE NODIG'-startscherm meer — het Voorbereiden-blok in Kookhulp regelt de ingrediënten; kookmodus start meteen bij stap 1
    steps.forEach(function (t) {
      scr.push({ k: 'step', txt: t, ing: (r.ing || []).filter(function (i) { return cookMentions(t, i); }).map(function (i) { return scaleIngText(i, M); }) });
    });
    scr.push({ k: 'end', tips: tips });
    return scr;
  }
  function cookOpen(rid) {
    var r = S.recipes.filter(function (x) { return x.id === rid; })[0]; if (!r || !hasSteps(r)) return;
    S.cook = { id: rid, i: 0, scr: cookScreens(r), name: r.name, emo: recEmoji(r) };
    pushLayer(); document.documentElement.classList.add('lock'); $('cooksheet').hidden = false;
    try { if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request('screen').then(function (l) { if (S.cook) S.cook.wl = l; else l.release(); }, function () { }); } catch (e) { }
    renderCook();
  }
  function forceCloseCook() {
    try { if (S.cook && S.cook.wl) S.cook.wl.release(); } catch (e) { }
    S.cook = null; $('cooksheet').hidden = true;
    if (!S.rg) document.documentElement.classList.remove('lock');
    render();
  }
  function renderCook() {
    var C = S.cook; if (!C) return;
    var sc = C.scr[C.i], n = C.scr.length, nSteps = n - 1, last = C.i === n - 1, first = C.i === 0, body = '';
    var prog = last ? 'Klaar' : 'Stap ' + (C.i + 1) + ' van ' + nSteps; // v58: startscherm eruit — stap 1 is meteen de eerste
    if (sc.k === 'step') {
      body = '<div class="cooktxt">' + esc(sc.txt) + '</div>' + (sc.ing.length ? '<div class="cookbox"><b>Hierbij</b><ul>' + sc.ing.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '');
    } else {
      body = '<div class="cooktitle">Klaar. Eet smakelijk.</div>' + sc.tips.map(function (t) { return '<div class="cookbox">' + esc(t) + '</div>'; }).join('');
    }
    $('cookbody').innerHTML = '<div class="cookhead"><button class="back" data-act="cookclose" aria-label="Stoppen met koken">✕ Stoppen</button><div class="cookprog" aria-live="polite">' + prog + '</div></div>' +
      '<div class="cookbar" aria-hidden="true"><i style="width:' + Math.round(C.i / (n - 1) * 100) + '%"></i></div>' +
      '<div class="cookmain">' + body + '</div>' +
      '<div class="cookfoot"><button class="btn" data-act="cookprev"' + (first ? ' disabled' : '') + '>‹ Vorige</button>' +
      (last ? '<button class="btn main" data-act="cookclose">Klaar</button>' : '<button class="btn main" data-act="cooknext">Volgende ›</button>') + '</div>';
    var m = $('cookbody').querySelector('.cookmain'); if (m) m.scrollTop = 0;
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'rgopen') rgOpen();
    else if (act === 'oudopen') oudOpen();
    else if (act === 'oudclose') requestClose();
    else if (act === 'ouddo') {
      if (!S.oudConfirm) { S.oudConfirm = true; renderOud(); return; }
      var res = oudDo();
      S.oud = { done: true, result: res };
      S.oudConfirm = false;
      renderOud();
      toast(res.entries + ' keuzes omgezet in ' + res.dagen + (res.dagen === 1 ? ' dag' : ' dagen'));
    }
    else if (act === 'rareweek') { var wkey = fmtId(S.start); if (S.rare[wkey]) delete S.rare[wkey]; else S.rare[wkey] = true; persist(); render(); }
    else if (act === 'raredag') { var dkey = el.getAttribute('data-day'); if (S.rareD[dkey]) delete S.rareD[dkey]; else S.rareD[dkey] = true; persist(); render(); }
    else if (act === 'rgclose') requestClose();
    else if (act === 'rgstep') { var k = el.getAttribute('data-k'), m = /^d([0-6]):([a-z]+)$/.exec(k); if (m) { rgSet(k, rgMax(+m[1], m[2]) + (+el.getAttribute('data-s'))); renderRg(); } }
    else if (act === 'rgreset') { rgSet(el.getAttribute('data-k'), rgDefault(+/^d([0-6])/.exec(el.getAttribute('data-k'))[1], el.getAttribute('data-k').split(':')[1])); renderRg(); }
    else if (act === 'rgresetall') { if (!Object.keys(S.maxes).length) return; if (!S.rgConfirm) { S.rgConfirm = true; renderRg(); } else { S.maxes = {}; S.rgConfirm = false; persist(); renderRg(); toast('Teruggezet naar het schema van 7 oktober'); } }
    else if (act === 'cook') cookOpen(el.getAttribute('data-r'));
    else if (act === 'cookclose') requestClose();
    else if (act === 'cooknext') { if (S.cook && S.cook.i < S.cook.scr.length - 1) { S.cook.i++; renderCook(); } }
    else if (act === 'cookprev') { if (S.cook && S.cook.i > 0) { S.cook.i--; renderCook(); } }
    else if (act === 'emo') { S.recMenu = ''; var rid = el.getAttribute('data-r'); S.emoOpen = S.emoOpen === rid ? '' : rid; render(); } // v58.1: ⋮-menuutje dicht na keuze
    else if (act === 'emoset') {
      var r = S.recipes.filter(function (x) { return x.id === el.getAttribute('data-r'); })[0]; if (!r) return;
      var e = el.getAttribute('data-e'); if (e) r.emoji = e; else delete r.emoji;
      persist(); render();
    }
  });

  // Maakt beschikbaar voor de Mistral-module
  var APP = window.APP = { VERSION: VERSION, S: S, $: $, esc: esc, toast: toast, persist: persist, uid: uid, render: render, RGROUPS: RGROUPS, num: num, prijzen: function () { return S.prijzen; }, momentsFor: momentsFor, dayDoc: dayDoc, recKcal: recKcal, recUnknown: recUnknown, ingText: ingText, groupOfSlot: groupOfSlot, saveDay: saveDay, addRecipeAt: addRecipeAt, addDays: addDays, fmtId: fmtId, DOW: DOW, cap: cap, findProd: findProd, kcalFor: kcalFor, unitWord: unitWord, fmtN: fmtN, rgMax: rgMax, recEmoji: recEmoji };

// =====================================================================
  // Mistral-tabblad (overgenomen uit de recept-testpagina v2, met opslaan in Recepten)
  // =====================================================================
  (function () {
    'use strict';
    if (!document.getElementById('gemview')) return; // alleen op Instellingen-pagina
    var API = 'https://api.mistral.ai/v1/';
    var denkOK = null;
    var laatstePrijs = null, laatste = null, laatsteIng = [], laatstePorties = null, laatsteStat = null, laatsteRaw = null, vragenLijst = [];
    var AINAAM = 'Mistral';
    var vriendMode = false, laatsteExtra = [];
    var wijzMag = false;

    // ---- jouw schema (Voedingsschema 7 okt 2026). Kan na vr 13 nov veranderen: pas dan deze getallen aan.
    var DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
    var SCHEMA = {};
    [['avondeten', 'av'], ['lunch', 'lm'], ['ontbijt', 'okb']].forEach(function (x) {
      Object.defineProperty(SCHEMA, x[0], { enumerable: true, get: function () { var a = []; for (var d = 0; d < 7; d++) a.push(APP.rgMax(d, x[1])); return a; } });
    });
    var MOMENTEN = ['ontbijt', 'lunch', 'avondeten', 'tussendoor'];
    var PAST_NAAR_GROEP = { ontbijt: 'ochtend', lunch: 'lunch', avondeten: 'avondeten', tussendoor: 'middag' };

    var VL = { el: 15, tl: 5 };
    var DB = [
      { n: 'Eiwitpoeder', re: /eiwitpoeder|prote[iï]nepoeder/, u: 'g', p: 3.667 },
      { n: 'Kwark', re: /^(?!.*(volle|griekse|yoghurt|skyr|smeer)).*kwark/, u: 'g', p: 0.60 },
      { n: 'Pure cacao', re: /^(?!.*(chocola|nibs)).*cacao/, u: 'g', p: 3.4 },
      { n: 'Cottage cheese', re: /cottage/, u: 'g', p: 0.91 },
      { n: 'Melk (mager)', re: /^(?!.*(halfvol|volle|karne|kokos|haver|soja|amandel|chocola|slag|zoet)).*\bmelk\b/, u: 'ml', p: 0.352, conv: VL },
      { n: 'Halfvolle melk', re: /halfvolle melk|halfvol melk/, u: 'ml', p: 0.46, conv: VL },
      { n: 'Volle melk', re: /\bvolle melk\b/, u: 'ml', p: 0.64, conv: VL },
      { n: 'Karnemelk', re: /karnemelk/, u: 'ml', p: 0.31, conv: VL },
      { n: 'Banaan', re: /banaan|bananen/, u: 'stuk', p: 110 },
      { n: 'Ei (rauw)', re: /(rauw|rauwe|losgeklopt|losgeklopte|verse).*\b(ei|eieren|eitje|eitjes)\b|\b(ei|eieren)\b.*(rauw|losgeklopt)/, u: 'stuk', p: 80 },
      { n: 'Gekookt ei', re: /^(?!.*(wit|dooier|eiwit|poeder)).*\b(ei|eieren|eitje|eitjes)\b/, u: 'stuk', p: 74 },
      { n: 'Ham, plakje', re: /\bham\b/, u: 'stuk', eis: 'plak', p: 13 },
      { n: 'Kipfilet, plakje', re: /\b(kipfilet|kalkoenfilet|kalkoen)\b/, u: 'stuk', eis: 'plak', p: 13 },
      { n: 'Snee brood', re: /\bbrood\b|\bsnee\b|\bsneetje/, u: 'stuk', p: 81 },
      { n: 'Crunchy muesli', re: /muesli/, u: 'g', p: 4.22 },
      { n: 'Frambozen', re: /framboos|frambozen/, u: 'g', p: 0.48 },
      { n: 'Bacon, plakje', re: /\bbacon\b/, u: 'stuk', eis: 'plak', p: 10 },
      { n: 'Spekjes', re: /\b(spekjes|spekreepjes|spekreepje|spekblokjes|spekblokje)\b/, u: 'g', p: 2.98 },
      { n: 'Volle room', re: /(kookroom|kook room).*(35 ?%|\bvol\b|volle)|(35 ?%|\bvol\b|volle).*(kookroom|kook room)/, u: 'ml', p: 3.35, conv: VL },
      { n: 'Volle room', re: /^(?!.*(kook|light|licht|zure|creme|fraiche|koffie|plantaardig|soja|haver|kokos|vetarm)).*\b(slagroom|volle room|dikke room|room)\b/, u: 'ml', p: 3.35, conv: VL },
      { n: 'Turkse knoflooksaus', re: /knoflooksaus|knoflook saus/, u: 'ml', p: 2.9, conv: VL },
      { n: 'Kookroom light', re: /(kookroom|kook room|kookzuivel).*(light|licht)|(light|licht).*(kookroom|kook room|kookzuivel)|kookzuivel/, u: 'ml', p: 0.96, conv: VL },
      { n: 'Kookroom', re: /kookroom|kook room/, u: 'ml', p: 2.07, conv: VL },
      { n: 'Crème fraîche light', re: /creme fraiche.*(light|licht)|(light|licht).*creme fraiche/, u: 'g', p: 1.61, conv: { el: 20, tl: 7 } },
      { n: 'Crème fraîche', re: /creme fraiche/, u: 'g', p: 2.94, conv: { el: 20, tl: 7 } },
      { n: 'Roomboter', re: /^(?!.*(kruiden|pinda)).*\b(roomboter|bakboter|boter)\b/, u: 'g', p: 7.46, conv: { el: 15, tl: 5 } },
      { n: 'Parmezaan', re: /parmezaan|parmigiano|grana padano|pecorino/, u: 'g', p: 4.02, conv: { el: 6, tl: 2 } },
      { n: 'Mozzarella', re: /mozzarella/, u: 'g', p: 2.35 },
      { n: 'Feta', re: /\bfeta\b|saladekaas/, u: 'g', p: 2.76 },
      { n: 'Kaas (48+)', re: /^(?!.*(smeer|room|geiten|blauw|brie|camembert)).*\b(kaas|gouda|goudse|cheddar|emmentaler|gruyere|belegen)\b/, u: 'g', p: 4.09, conv: { el: 8 } },
      { n: 'Kokosmelk', re: /kokosmelk/, u: 'ml', p: 1.82, conv: VL },
      { n: 'Olie', re: /^(?!.*\b(tonijn|sardine|sardientjes|zalm|ansjovis|tomaat|tomaten|zongedroogde)\b).*\b(olijfolie|zonnebloemolie|bakolie|slaolie|raapzaadolie|braadolie|olie)\b/, u: 'ml', p: 8.28, conv: VL },
      { n: 'Aardappelkroketjes (oven)', re: /aardappelkroket|oven ?kroket|^(?!.*(vlees|rund|kalfs|kip|garnalen|ragout|kaas)).*\bkroketjes?\b/, u: 'g', p: 1.52 },
      { n: 'Rösti rondjes', re: /\brosti|roesti/, u: 'g', p: 1.65 },
      { n: 'Aardappelschijfjes (voorgekookt)', re: /^(?!.*(zoete|bataat)).*(aardappelschijfjes|aardappel schijfjes|schijfjes aardappel|roodschillige)/, u: 'g', p: 0.87 },
      { n: 'Hamburgerbroodje luxe', re: /(luxe|brioche).*(hamburgerbroodjes?|burgerbroodjes?|broodjes?)|(hamburgerbroodjes?|burgerbroodjes?).*(luxe|brioche)/, u: 'stuk', p: 224 },
      { n: 'Hamburgerbroodje luxe', re: /(luxe|brioche).*(hamburgerbroodjes?|burgerbroodjes?|broodjes?)|(hamburgerbroodjes?|burgerbroodjes?).*(luxe|brioche)/, u: 'g', p: 2.77 },
      { n: 'Hamburgerbroodje', re: /hamburgerbroodjes?|burgerbroodjes?|(hamburger|burger) (broodjes?|bun|buns)/, u: 'stuk', p: 144 },
      { n: 'Hamburgerbroodje', re: /hamburgerbroodjes?|burgerbroodjes?|(hamburger|burger) (broodjes?|bun|buns)/, u: 'g', p: 2.88 },
      { n: 'Runderhamburger Onze boeren (125 g)', re: /onze boeren.*(hamburger|burger)|(hamburger|burger).*onze boeren/, u: 'stuk', p: 316 },
      { n: 'Runderhamburger Onze boeren (125 g)', re: /onze boeren.*(hamburger|burger)|(hamburger|burger).*onze boeren/, u: 'g', p: 2.53 },
      { n: 'Runderhamburger (kant-en-klaar, ± 100 g)', re: /^(?!.*(broodje|bun|saus|dressing|vega|vegetarisch|plantaardig|kip|kalkoen|vis|zalm|tonijn|gehakt|sla)).*(hamburger|burger)s?\b/, u: 'stuk', p: 221 },
      { n: 'Runderhamburger (kant-en-klaar, ± 100 g)', re: /^(?!.*(broodje|bun|saus|dressing|vega|vegetarisch|plantaardig|kip|kalkoen|vis|zalm|tonijn|gehakt|sla)).*(hamburger|burger)s?\b/, u: 'g', p: 2.21 },
      { n: 'Sperziebonen', re: /sperziebo/, u: 'g', p: 0.32 },
      { n: 'Kipgehakt half plantaardig', re: /kipgehakt.*(plantaardig|minder vet|vega)|(plantaardig|minder vet).*kipgehakt/, u: 'g', p: 1.34 },
      { n: 'Kipgehakt', re: /kipgehakt|gehakt van kip/, u: 'g', p: 2.25 },
      { n: 'Mager rundergehakt', re: /(mager|magere).*(rundergehakt|rund gehakt)|(rundergehakt|rund gehakt).*(mager|magere)/, u: 'g', p: 1.90 },
      { n: 'Rundergehakt', re: /rundergehakt|rund gehakt|rundvleesgehakt/, u: 'g', p: 2.26 },
      { n: 'Shoarma (kip)', re: /^(?!.*(kruid|saus|marinade|broodje|pita|maaltijd|wrap)).*shoarma/, u: 'g', p: 1.58 },
      { n: 'Gebraden kipfilet', re: /(gebraden|gegrilde|gegrild|roasted).*(kipfilet|kippenfilet)|(kipfilet|kippenfilet).*(gebraden|gegrilde|gegrild)|kipfiletblokjes|kipfiletreepjes/, u: 'g', p: 1.40 },
      { n: 'Kipfilet (rauw)', re: /^(?!.*(gerookt|gebraden|beleg|schnitzel|roasted|gegrild)).*\b(kipfilet|kipfilets|kippenfilet|kippenborst|kipborst)\b/, u: 'g', p: 1.14, conv: { stuk: 150 } },
      { n: 'Gerookte zalm', re: /gerookte? zalm|zalm gerookt/, u: 'g', p: 2.07 },
      { n: 'Zalm gekweekt (Atlantisch)', re: /^(?!.*(gerookt|gerookte|sashimi)).*(gekweekt|atlantisch).*\b(zalm|zalmfilet|zalmfilets)\b|^(?!.*(gerookt|gerookte|sashimi)).*\b(zalm|zalmfilet|zalmfilets)\b.*(gekweekt|atlantisch)/, u: 'g', p: 1.79, conv: { stuk: 125 } },
      { n: 'Wilde zalm (diepvries)', re: /^(?!.*(gerookt|gerookte|sashimi)).*\b(zalm|zalmfilet|zalmfilets)\b/, u: 'g', p: 0.99, conv: { stuk: 125 } },
      { n: 'Witvis', re: /^(?!.*(gerookt|gerookte|visstick|vissticks)).*\b(kabeljauw|kabeljauwfilet|koolvis|koolvisfilet|witvis|witvisfilet|heek|heekfilet|schelvis|schelvisfilet|pangasius|tilapia|zeebaars)\b/, u: 'g', p: 0.80, conv: { stuk: 125 } },
      { n: 'Garnalen', re: /^(?!.*(gepaneerd|tempura|gebakken|saus)).*\b(garnaal|garnalen|gamba|gambas|scampi|reuzengarnalen)\b/, u: 'g', p: 0.91 },
      { n: 'Zoete aardappel', re: /zoete aardappel|zoete aardappelen|bataat/, u: 'g', p: 0.96, conv: { stuk: 250 } },
      { n: 'Aardappel', re: /^(?!.*(zoete|puree|chips|friet|partjes|gnocchi|meel|zetmeel|salade)).*\b(aardappel|aardappelen|aardappels|krieltjes|krieltje)\b/, u: 'g', p: 0.88, conv: { stuk: 100 } },
      { n: 'Rijst (droog)', re: /^(?!.*(gekookt|gestoomd|gare|magnetron|zakje|kant en klaar)).*\b(rijst|basmatirijst|basmati|jasmijnrijst|zilvervliesrijst|risottorijst)\b/, u: 'g', p: 3.55 },
      { n: 'Pasta (droog)', re: /^(?!.*(gekookt|saus|pesto|salade|gare|vers|verse|gevuld|gevulde|tortellini|ravioli|gnocchi)).*\b(pasta|spaghetti|penne|macaroni|rigatoni|fusilli|tagliatelle|farfalle|linguine|fettuccine|orzo|vermicelli|lasagnebladen|lasagne bladen|noedels)\b/, u: 'g', p: 3.50 },
      { n: 'Couscous (droog)', re: /^(?!.*(gekookt|gare)).*couscous/, u: 'g', p: 3.53 },
      { n: 'Bloem', re: /\b(tarwebloem|bloem|patentbloem)\b/, u: 'g', p: 3.49, conv: { el: 10, tl: 3 } },
      { n: 'Libanees platbrood', re: /platbrood|libanees brood|libanese brood|pitabrood|pita brood|\bpita\b/, u: 'g', p: 2.16, conv: { stuk: 66 } },
      { n: 'Bakvet (shortening)', re: /shortening|bakvet|frituurvet/, u: 'g', p: 8.8, conv: { el: 12, tl: 4 } },
      { n: 'Wrap volkoren', re: /^(?!.*(platbrood|pita|naan|roti)).*\b(wrap|wraps|tortilla|tortillas|tortillawrap|tortillawraps)\b/, u: 'g', p: 2.82, conv: { stuk: 62 } },
      { n: 'Bouillonblokje', re: /bouillonblok|bouillontablet/, u: 'stuk', p: 30 },
      { n: 'Bouillon (bereid)', re: /bouillon\b|\bfond\b/, u: 'ml', p: 0.06, conv: VL },
      { n: 'Tomatenpuree', re: /tomatenpuree/, u: 'g', p: 0.97, conv: { el: 15, tl: 5, blik: 140 } },
      { n: 'Tomatenblokjes (blik)', re: /tomatenblokjes|tomatenstukjes|gepelde tomaten|gezeefde tomaten|passata|tomaten uit blik|tomaten blik/, u: 'g', p: 0.33, conv: { blik: 400 } },
      { n: 'Ui', re: /^(?!.*(zilver|lente|sjalot|gedroogd|chutney|poeder|soep)).*\b(ui|uien|uitje|uitjes)\b/, u: 'g', p: 0.40, conv: { stuk: 110 } },
      { n: 'Bosui', re: /bosui|lenteui|lente ui/, u: 'g', p: 0.32, conv: { stuk: 15 } },
      { n: 'Sjalot', re: /sjalot/, u: 'g', p: 0.72, conv: { stuk: 30 } },
      { n: 'Prei', re: /\b(prei|preien)\b/, u: 'g', p: 0.31, conv: { stuk: 200 } },
      { n: 'Paprika', re: /^(?!.*(poeder|gerookt|kruiden|gemalen|saus)).*\b(paprika|paprikas|puntpaprika|puntpaprikas)\b/, u: 'g', p: 0.31, conv: { stuk: 160 } },
      { n: 'Courgette', re: /courgette/, u: 'g', p: 0.19, conv: { stuk: 300 } },
      { n: 'Champignons', re: /champignon/, u: 'g', p: 0.30, conv: { stuk: 20 } },
      { n: 'Spinazie', re: /^(?!.*(room|saus)).*\bspinazie\b/, u: 'g', p: 0.35 },
      { n: 'Tomaat', re: /^(?!.*(blokjes|stukjes|puree|passata|gedroogd|ketchup|saus|gepeld|gezeefd|blik|soep|pasta)).*\b(tomaat|tomaten|tomaatjes|cherrytomaten|cherrytomaat|trostomaten)\b/, u: 'g', p: 0.22, conv: { stuk: 120, pak: 250 } },
      { n: 'Knoflook', re: /^(?!.*(poeder|saus|boter|olie)).*(\bknoflook\b|knoflookteen)/, u: 'g', p: 1.58, conv: { teentje: 3 } },
      { n: 'Wortel', re: /\b(wortel|wortelen|worteltjes|peen|winterpeen)\b/, u: 'g', p: 0.41, conv: { stuk: 100 } },
      { n: 'Witte bonen in tomatensaus (blik)', re: /witte bonen.*tomatensaus|tomatensaus.*witte bonen|witte bonen blik/, u: 'g', p: 0.87, conv: { blik: 400 } },
      { n: 'Bloemkool', re: /bloemkool/, u: 'g', p: 0.25 }
    ];
    var BEKEND = DB.map(function (d) { return d.n + ' (' + (d.eis === 'plak' ? 'plakjes' : d.u) + ')'; }).join(', ');
    var EENH = { gram: 'g', gr: 'g', g: 'g', milliliter: 'ml', ml: 'ml', stuk: 'stuk', stuks: 'stuk', st: 'stuk', plak: 'stuk', plakje: 'stuk', plakjes: 'stuk', plakken: 'stuk', snee: 'stuk', sneetjes: 'stuk', snede: 'stuk', eetlepel: 'el', eetlepels: 'el', el: 'el', theelepel: 'tl', theelepels: 'tl', tl: 'tl', blik: 'blik', blikje: 'blik', blikken: 'blik', teen: 'teentje', teentje: 'teentje', teentjes: 'teentje', pakje: 'pak', pakjes: 'pak', bakje: 'pak', bakjes: 'pak' };

    function normU(u) { u = String(u || '').trim().toLowerCase(); return EENH[u] || u; }
    function schoon(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim(); }
    var NUL_RE = /^(?!.*(bouillon|saus|olie|boter|room|melk|kaas|pesto|puree|brood|noten|kokos|cacao|kwark|yoghurt|dip|haring|worst|\brode\b|\bgroene\b|\bgele\b|spaanse|\bchili\b|sambal|jalapeno|\bverse peper)).*\b(zout|zeezout|peper|zwarte peper|witte peper|cayennepeper|kruiden|kruidenmix|specerijen|italiaanse kruiden|oregano|tijm|rozemarijn|salie|laurier|laurierblad|kaneel|nootmuskaat|komijn|djinten|kurkuma|koriander|kerrie|kerriepoeder|currypoeder|paprikapoeder|knoflookpoeder|uienpoeder|chilivlokken|chilipoeder|garam masala|ras el hanout|kruidnagel|piment|peterselie|bieslook|basilicum|dille|munt|gedroogde kruiden|provencaalse kruiden|zeekraal|vanille)\b/;
    var WATER_RE = /^(?:[a-z]+ )?(water|kraanwater|kookwater)(?: .*)?$/;
    function nulKcal(n) { return NUL_RE.test(n) || WATER_RE.test(n); }
    function vind(naam, eenheid) {
      var n = schoon(naam), raw = String(eenheid || '').trim().toLowerCase(), u = normU(raw) || 'stuk', plak = /^plak/.test(raw);
      if (nulKcal(n)) return { n: 'zout, peper, kruiden of water (0 kcal)', p: 0 };
      for (var i = 0; i < DB.length; i++) {
        var d = DB[i];
        if (!d.re.test(n)) continue;
        if (d.u === u && !!d.eis === plak) return { n: d.n, p: d.p };
        if (!plak && d.conv && d.conv[u] != null) return { n: d.n, p: d.p * d.conv[u] };
      }
      return null;
    }
    function getal(w) {
      var s = String(w == null ? '' : w).trim().replace(',', '.');
      if (!s) return 'naar smaak';
      var m = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
      if (m && +m[2]) return Math.round(+m[1] / +m[2] * 100) / 100;
      var x = Number(s);
      return isNaN(x) ? s : x;
    }
    // AI-uitvoer wordt alleen als JSON gelezen en nooit als code uitgevoerd
    function jsonUit(tekst) {
      var t = String(tekst || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      var a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a < 0 || b < a) throw new Error('Mistral gaf geen recept terug. Dit was het antwoord:\n' + t.slice(0, 300));
      return JSON.parse(t.slice(a, b + 1));
    }

    // ---- keuzes (v47.1: het sleutel-stuk zit in 16-mistral-sleutel.js, zodat het tandwiel het ook draait)
    var LUSTSLEUTEL = 'eetweek.gemini.keuzes';

    function lijst(id) { return $(id).value.split(/[,;\n]/).map(function (x) { return x.trim(); }).filter(Boolean).join(', '); }
    function nietIk() { return lijst('nietIk'); }
    function hijEetInfo() {
      if ($('personen').value !== 'vriend' || $('pvriend').value !== '2') return null;
      var t = String($('hijEet').value || '').toLowerCase().trim(); if (!t) return null;
      var m = t.match(/(\d+)\s*(burgers?|hamburgers?|stuks?|broodjes?|st\b)/);
      if (m && +m[1] >= 1 && +m[1] <= 12) return { stuks: +m[1], tekst: t };
      var k = t.match(/(\d[\d.]*)/), n = k ? +k[1].replace(/\./g, '') : 0;
      if (n >= 100 && n <= 3000) return { kcal: n, tekst: t };
      return null;
    }
    function hijEetTekst() {
      var h = hijEetInfo(); if (!h) return '';
      if (h.stuks) return ' Mijn vriend eet bij deze maaltijd ' + h.stuks + ' stuks (' + h.tekst + ') en ik 1: maak het recept voor in totaal ' + (h.stuks + 1) + ' stuks en reken de hoeveelheden daarop (zelfgemaakte burger 125 g gehakt per stuk, kant-en-klare burger ± 100 g per stuk). Zet bij "porties" 2 porties (één maaltijd voor ons samen) en zet het aantal stuks duidelijk in de ingrediënten en de bereiding.';
      return ' Mijn vriend eet bij deze maaltijd ongeveer ' + h.kcal + ' kcal. Maak het recept voor ons samen: mijn deel volgt mijn schema en zijn deel is ongeveer ' + h.kcal + ' kcal, dus reken de totale hoeveelheid daarop. Zet bij "porties" 2 porties (één maaltijd voor ons samen). Noem zelf geen calorieën.';
    }
    function nietHij() { return $('personen').value === 'vriend' ? lijst('nietHij') : ''; }
    function makkelijkAan() { return $('makkelijkT').checked; }
    function keuzesAan() { return !!lijst('voorkeur') || $('versie').value !== 'zo' || $('personen').value !== 'zo' || !!nietIk() || !!nietHij() || makkelijkAan(); }
    var MAKKELIJK_KERN = 'minder stappen, minder snijwerk en zo weinig mogelijk pannen en afwas, waar het kan in één pan of één schaal. Gebruik gemakkelijke producten die gewoon in de supermarkt liggen: kant-en-klare knoflook, voorgesneden of diepvriesgroente, kant-en-klare bouillon, voorgekookte of al geschilde aardappelen (schijfjes, krieltjes, ovenkroketjes of rösti) en kant-en-klare hamburgers in plaats van zelf gehakt kneden. Rijst en pasta koken vindt de gebruiker niet erg: kies dus géén voorgekookte of kant-en-klare rijst of pasta, tenzij ik daar zelf om vraag. Vervang ingewikkelde handelingen door eenvoudige (bijvoorbeeld geen puree stampen als je de aardappelen ook als laagje of gratin kunt leggen).';
    function makkelijkWens() {
      return 'Maak dit recept makkelijker en minder werk, zonder dat het gerecht niet meer op het origineel lijkt: ' + MAKKELIJK_KERN + ' Verander niets wat niet nodig is en houd de smaak zo gelijk mogelijk. Verander de vorm van het gerecht niet (muffins blijven muffins, een soep blijft een soep) en houd het aantal porties gelijk, tenzij ik dat zelf vraag. Maak vooral de stappen makkelijker, bijvoorbeeld alles droog in één kom mengen of minder verschillende schalen. Gebruik geen ingrediënten van de lijstjes "Lust niet". Zet in "wijzigingen" wat je hebt veranderd en waarom, en zet "voorgekookt" of "geschild" in de naam van een ingrediënt dat je zo neemt.';
    }
    function makkelijkNieuw() { return makkelijkAan() ? '\n\nHet recept moet makkelijk en snel te maken zijn: ' + MAKKELIJK_KERN : ''; }
    function makkelijkLees() { return makkelijkAan() ? '\n\nMaak het gelezen recept daarna ook meteen makkelijker, en geef alleen het makkelijkere recept terug. ' + makkelijkWens() : ''; }
    try {
      var opgeslagen = JSON.parse(localStorage.getItem(LUSTSLEUTEL) || '{}');
      $('nietIk').value = opgeslagen.ik || ''; $('nietHij').value = opgeslagen.hij || ''; $('budget').value = opgeslagen.b || '';
      $('voorkeur').value = opgeslagen.v || '';
      if ('l' in opgeslagen) $('lunchMax').value = opgeslagen.l || '';
      if (opgeslagen.m) $('model').value = opgeslagen.m;
    } catch (e) { /* geen opslag */ }
    function bewaarLust() { try { localStorage.setItem(LUSTSLEUTEL, JSON.stringify({ ik: $('nietIk').value, hij: $('nietHij').value, b: $('budget').value, v: $('voorkeur').value, l: $('lunchMax').value, m: $('model').value })); } catch (e) { /* geen opslag */ } }
    function budgetWaarde() { var x = Number(String($('budget').value || '').trim().replace(',', '.')); return isFinite(x) && x > 0 ? x : null; }
    function keuzeRegel() {
      var v = $('versie'), n = $('personen'), pv = $('pvriend'), vr = n.value === 'vriend';
      $('pvriendBlok').hidden = !vr; $('hijEetBlok').hidden = !(vr && pv.value === '2');
      var t = 'Gekozen: ' + v.options[v.selectedIndex].text.toLowerCase() + ', ' + n.options[n.selectedIndex].text.toLowerCase() + (vr ? ' (' + pv.options[pv.selectedIndex].text.toLowerCase() + ')' : '') + '.';
      if (nietIk()) t += ' Lust ik niet: ' + nietIk() + '.';
      if (nietHij()) t += ' Lust hij niet: ' + nietHij() + '.';
      if (lijst('voorkeur')) t += ' Voorkeuren: ' + lijst('voorkeur') + '.';
      if (budgetWaarde()) t += ' Budget: € ' + String(budgetWaarde()).replace('.', ',') + ' per portie.';
      if (lunchMax()) t += ' Mijn maximum voor de lunch: ' + lunchMax() + ' kcal.';
      if (apparaten().length) t += ' Koken met: ' + apparaten().join(' en ') + '.';
      if (hijEetInfo()) t += ' Je vriend eet: ' + hijEetInfo().tekst + '.';
      if (portiesVast()) t += ' Aantal porties: ' + portiesVast() + '.';
      if (momentKeuze()) t += ' Moment: ' + momentKeuze() + ' op ' + DAGEN[dagKeuzeIdx()] + '.';
      if (makkelijkAan()) t += ' Meteen makkelijker gemaakt.';
      ['keuzeTekst', 'keuzeAanpassen', 'keuzeFoto', 'keuzeNieuw'].forEach(function (id) { $(id).textContent = t; });
    }
    $('versie').addEventListener('change', keuzeRegel);
    $('personen').addEventListener('change', keuzeRegel);
    $('pvriend').addEventListener('change', keuzeRegel);
    $('hijEet').addEventListener('input', keuzeRegel);
    if ($('model')) $('model').addEventListener('change', bewaarLust);
    $('portiesVast').addEventListener('input', keuzeRegel);
    ['momentKeuze', 'dagKeuze'].forEach(function (id) { $(id).addEventListener('change', function () { keuzeRegel(); if (!$('rKcal').hidden) { $('btnKcal').click(); $('btnKcal').click(); } }); });
    ['nietIk', 'nietHij', 'budget', 'voorkeur', 'lunchMax'].forEach(function (id) { $(id).addEventListener('input', function () { bewaarLust(); keuzeRegel(); }); });
    function syncMakkelijk(bron) { ['makkelijkT', 'makkelijkF', 'makkelijkN'].forEach(function (id) { $(id).checked = bron.checked; }); keuzeRegel(); }
    ['makkelijkT', 'makkelijkF', 'makkelijkN'].forEach(function (id) { $(id).addEventListener('change', function () { syncMakkelijk(this); }); });
    keuzeRegel();

    var OMREKEN = ' Gelden de hoeveelheden voor een bereik (bijvoorbeeld 4-6 porties), ga dan uit van het laagste getal en zeg dat in "controle". Vermenigvuldig ALLE ingrediënten met dezelfde factor (nieuwe porties gedeeld door oude porties), ook vis, vlees, kruiden en vloeistof, en controleer dat de verhoudingen kloppen.';
    function versieTekst() { return versieBasis() + portiesTekst() + momentTekst(); }
    function versieBasis() {
      var v = $('versie').value, n = $('personen').value, s = '';
      if (v !== 'zo') {
        s += ' Maak het recept lichter, voor iemand met een gezond gewichtsdoel (dit zegt niets over het aantal personen): minder vet, suiker en zout, meer eiwit en vezels, zonder dat het onsmakelijk wordt. Voeg geen vetrijke ingrediënten toe, houd het eenvoudig met producten uit een gewone supermarkt en pas de bereiding aan waar dat nodig is. Zet kort in "wijzigingen" wat je hebt veranderd.';
        s += v === 'lichter_klein' ? ' Maak bovendien één portie ongeveer een kwart kleiner.' : ' Houd de portiegrootte gelijk.';
      }
      var pv = $('pvriend').value;
      if (n === 'vriend') s += (pv === 'zo' ? ' Houd het aantal porties van het recept zoals het is en reken niets om (bijvoorbeeld 4 porties = twee personen, twee maaltijden; staat er een bereik zoals 4-6, kies dan het laagste getal; staat er geen aantal, ga dan uit van 2 porties).' : ' Reken alle hoeveelheden om naar ' + pv + ' porties (' + (pv === '2' ? 'twee personen, één maaltijd' : 'twee personen, twee maaltijden') + ')' + OMREKEN + ' en zet het aantal in "porties". Pas de bereiding aan als dat door de hoeveelheid nodig is (bijvoorbeeld de grootte van de bakvorm). Zet de omrekening kort in "wijzigingen".') + ' Zet in "extra_vriend" 2 of 3 eenvoudige voorstellen voor iets extra\'s dat één van de twee bij één maaltijd (per portie) erbij kan eten omdat die persoon meer energie nodig heeft, passend bij dit recept (bijvoorbeeld extra eiwit of extra koolhydraten, zoals extra bacon, een boterham erbij of een grotere portie pasta). Zet de extra\'s niet in "ingredienten" en niet in de bereiding. Is het recept ook lichter gemaakt en heb je daarvoor iets uit het basisrecept gehaald of verminderd (bijvoorbeeld de helft van de halloumi), zet dat dan als eerste voorstel in "extra_vriend", zodat hij het erbij kan krijgen. Geef elk voorstel dezelfde velden als een ingrediënt (naam, hoeveelheid, eenheid, gewicht_gram, kcal_per_100g); de hoeveelheid is voor één maaltijd.';
      else if (n !== 'zo') s += ' Reken alle hoeveelheden om naar ' + n + (n === '1' ? ' persoon' : ' personen') + OMREKEN + ' en zet het aantal porties in "porties". Pas ook de bereiding aan als dat door de hoeveelheid nodig is (bijvoorbeeld de grootte van de pan of het aantal pannenkoeken). Zet de omrekening kort in "wijzigingen".';
      if (n === 'vriend') s += hijEetTekst();
      return s;
    }
    function lustTekst() {
      var ik = nietIkAlle(), hij = nietHij();
      if (!ik && !hij) return '';
      var t = ' LUST NIET (dit gaat voor op de regel dat je geen ingrediënten vervangt):';
      if (ik) t += ' ik lust niet: ' + ik + '.';
      if (hij) t += ' mijn vriend lust niet: ' + hij + '.';
      t += ' Gebruik deze ingrediënten niet in het recept en ook niet in "extra_vriend". Staat zo\'n ingrediënt in het recept, vervang het dan door het meest verwante ingrediënt dat niet op een van de lijstjes staat: dezelfde familie, smaak en structuur, zodat het gerecht zo veel mogelijk hetzelfde blijft (bijvoorbeeld bosui, ui of sjalot in plaats van prei; champignons of venkel in plaats van prei past niet). Kies alleen iets heel anders als er niets verwants is. Pas de bereiding en de hoeveelheid aan zodat de vervanger goed gaar wordt (bosui is bijvoorbeeld veel sneller gaar dan prei en je hebt er een andere hoeveelheid van nodig). Past er niets goed, laat het ingrediënt dan weg en zet in "controle" dat er geen goede vervanger is en wat je hebt gedaan. Zet elke vervanging of weglating kort in "wijzigingen". Schrijf bij een vervanging nooit "allergie" of "voorkeur" (ik heb geen allergie): zeg alleen dat dit ingrediënt niet gelust wordt en wat ervoor in de plaats kwam. Een ingrediënt dat hier niet staat, laat je gewoon zoals het in het recept staat.';
      return t;
    }
    function voorkeurTekst() {
      var v = lijst('voorkeur');
      return v ? ' MIJN VOORKEUREN (gelden bij elk recept): ' + v + '. Pas een voorkeur alleen toe als die bij dit gerecht past en laat hem anders weg. Verander verder niets zonder reden en zet elke aanpassing die je daardoor doet kort in "wijzigingen".' : '';
    }
    function versieVraag() { var s = versieTekst(); return s ? '\n\nDoe daarna het volgende met het gelezen recept:' + s : ''; }
    var REGELS = 'Je helpt met recepten voor een Nederlandse eetapp. Antwoord alleen met het gevraagde recept als JSON, zonder uitleg eromheen. ' +
      'Schrijf alles in het Nederlands, ook elke ingrediëntnaam, ook als het recept Engels is (bijvoorbeeld "Ground nutmeg" wordt "nootmuskaat", "Chives" wordt "bieslook", "Smoked haddock" wordt "gerookte schelvis", "Raw king prawns" wordt "rauwe garnalen"). Een Engels woord in een ingrediëntnaam is een fout. Schrijf namen correct: het is "nootmuskaat" (niet "nooitmuskaat"). Geef geen calorieën of voedingswaarden in de tekst. Alleen in de velden gewicht_gram en kcal_per_100g van elk ingrediënt geef je een schatting: gewicht_gram is het totale gewicht in gram van de genoemde hoeveelheid (bijvoorbeeld 1 el olijfolie = 14, 1 tl = 5) en kcal_per_100g is een schatting voor dat product, bij twijfel iets aan de hoge kant. Is het een schatting die je niet kunt maken, gebruik dan null. Vul ook "past_bij" (kies precies één: ontbijt, lunch, avondeten of tussendoor, naar wat voor maaltijd dit gerecht normaal is). Laat winkelmerken (zoals C1000, Jumbo, AH, Lidl) weg uit de namen van ingrediënten. ' +
      'Neem de ingrediënten én de bereiding over zoals ze in het recept staan: verander geen kookmethode, bereidingstijd of ingrediënt dat niet gevraagd is (bijvoorbeeld bakken in de oven blijft bakken in de oven). Vervang geen ingrediënten en kies niet zelf tussen het origineel en een alternatief. Heeft het recept een hoofdingrediënt dat iemand mogelijk niet lust of niet in huis heeft (bijvoorbeeld prei, kaas of aardappelen), zet dan in "opmerkingen" precies één zin in deze vorm: "Alternatief: [alternatief] kan ook in plaats van [ingrediënt]." met een passend alternatief uit dezelfde familie (bijvoorbeeld bosui voor prei), zonder het woord "Tip" ervoor. Noemt het recept een alternatief (bijvoorbeeld "geen karnemelk? gebruik yoghurt met melk"), zet dat dan als tip in "opmerkingen". ' +
      'Gebruik een naam uit deze lijst alleen als het echt hetzelfde product is: ' + BEKEND + '. Karnemelk, halfvolle melk en volle melk zijn géén magere melk; Griekse yoghurt, skyr en volle kwark zijn géén kwark. Is het niet hetzelfde, gebruik dan de naam uit het recept. ' +
      'Noem gehakt precies zoals het recept het noemt (bijvoorbeeld "rundergehakt", "mager rundergehakt" of "kipgehakt"); staat er alleen "gehakt", schrijf dan "gehakt" en kies niet zelf een soort. Een ei dat rauw in een beslag, saus of ovenschotel gaat noem je "rauw ei" (meervoud "rauwe eieren"); een gekookt ei noem je "gekookt ei". Geef rijst, pasta en couscous in gram droog gewicht, tenzij het recept zegt dat het gekookt is. Gebruik als eenheid bij voorkeur g, ml, stuk, el, tl, teentje, blik of plakjes. ' +
      'Vleeswaren zoals spek, bacon en ham geef je de eenheid "plakjes". Bacon blijft "bacon" (maak er geen ontbijtspek van). Staat er bij bacon geen hoeveelheid, neem dan 3 plakjes per portie. Staat er bij een ingrediënt geen hoeveelheid (bijvoorbeeld "om te serveren" of "naar smaak"), laat hoeveelheid dan leeg en verzin er geen. ' +
      'Schrijf de bereiding als nette, korte kookstappen. Gebruik in de bereiding nooit een vage verzamelnaam zoals "de visschotelmix" of "het mengsel" zonder te zeggen wat erin zit en wat je ermee doet: noem de ingrediënten en de handeling. Zet nooit je eigen overwegingen, uitleg of haakjes over wat je gedaan hebt in de bereiding of de naam. ' +
      'Staat het recept in een andere taal, vertaal het dan naar het Nederlands en reken maten om naar gram, milliliter, el en tl (1 cup = 240 ml, 1 oz = 28 g, 1 lb = 450 g, 1 tbsp = 1 el, 1 tsp = 1 tl, graden Fahrenheit naar Celsius). ' +
      'Zet in "onzeker" alleen echte twijfels: een woord of getal dat je niet goed kon lezen, of een hoeveelheid die onlogisch lijkt (bijvoorbeeld 2 g sjalot). Lijkt een gelezen woord onlogisch in een kookstap, kies dan het logische kookwoord (bijvoorbeeld "al omscheppend" in plaats van "al omschreven") en zet het in "onzeker". Geen opmerkingen over de foto, het draaien van de foto, merken, vertalen of omrekenen. ' +
      'Zet in "controle" alleen echte problemen met het recept zelf: ontbrekende stappen, onveilige bereiding (kip, ei, vis, rauw vlees), onlogische tijden of bewaartijden. Is er niets, laat het leeg. ' +
      'Vul "wijzigingen" alleen als je hieronder gevraagd wordt het recept lichter te maken, om te rekenen naar een ander aantal personen, of aan te passen naar een wens. Vertalen, maten omrekenen en merken weglaten zijn géén wijzigingen. Anders laat je "wijzigingen" leeg. ' +
      'Vul "extra_vriend" alleen als hieronder gevraagd wordt om extra\'s voor een tweede persoon; anders laat je hem leeg. ' +
      'Zet bij hoeveelheid alleen een getal (bijvoorbeeld 150, 1,5, 1/2 of 2-3), zonder eenheid. Vul bij elk ingrediënt een hoeveelheid in; alleen zout, peper en kruiden mogen leeg blijven (naar smaak). Een ingrediënt dat alleen optioneel is (zoals "eventueel" of "om te serveren") zet je niet in de lijst maar als tip in "opmerkingen". Zet geen eenheid of hoeveelheid in de naam van een ingrediënt. ' +
      'Noem altijd het precieze soort product dat in het recept staat: platbrood is geen wrap, kookroom is geen volle room, en bij pasta noem je een soort (penne, fusilli, spaghetti, tortellini). Staat er alleen "pasta", kies dan zelf het soort dat het best bij het gerecht past. Noem pasta die vers of gevuld is zo in de naam. ' +
      'Zet bij "porties" alleen een aantal porties, in de vorm "4 porties" (geen stuks of gewichten). Reken zelf nooit calorieën per portie uit. Zet in "wijzigingen" alleen echte veranderingen in het recept, nooit een opmerking over wat je niet hebt veranderd. Noem in de bereiding bij elke hoeveelheid die verdeeld wordt ook een maat die je in de keuken kunt gebruiken (bijvoorbeeld "ongeveer 3 grote scheppen"). ' +
      'Gebruik exact deze JSON-opzet: ' + JSON.stringify({
        gelukt: true, reden: '', naam: 'Naam van het recept in het Nederlands', porties: 'bijv. 2 porties, of leeg',
        ingredienten: [{ naam: 'product, in het Nederlands', hoeveelheid: '150', eenheid: 'g/ml/stuk/el/tl/teentje/blik/plakjes', gewicht_gram: 150, kcal_per_100g: 100, vw_per_100g: [8, 5, 2, 10, 3, 2, 0.5] }],
        bereiding: ['stap 1', 'stap 2'], opmerkingen: 'bewaar- of veiligheidstip, of leeg',
        onzeker: [], controle: [], wijzigingen: [], extra_vriend: [], past_bij: 'avondeten'
      }) + ' Kon je geen recept vinden of lezen, zet dan "gelukt" op false en leg kort uit waarom.';

    var DOE_REGELS = ' NIEUWE OPDRACHT VOOR DIT ANTWOORD (die gaat voor op de regel hierboven dat je alleen het recept teruggeeft): je krijgt een bestaand recept en een tekst van de gebruiker. Geef één JSON-object terug in deze opzet: ' +
      JSON.stringify({ soort: 'vraag of wens', antwoord: 'korte tekst in gewone Nederlandse zinnen', recept: null }) +
      '. Bepaal zelf of de tekst een VRAAG is (de gebruiker wil iets weten, bijvoorbeeld "kan ik dit invriezen?" of "waarom prei?") of een WENS of OPMERKING (de gebruiker wil dat het recept anders wordt, of zegt dat iets niet klopt, te weinig of te veel is, bijvoorbeeld "minder zout" of "dit is te weinig voor avondeten"). ' +
      'VRAAG: zet soort op "vraag", zet in "antwoord" een kort en duidelijk antwoord in gewone zinnen zonder opmaak, en zet "recept" op null. Verander het recept niet. Je weet niet hoe het originele recept eruitzag, behalve wat bij "wijzigingen" staat; verzin geen uitleg en zeg kort dat je iets niet kunt zien als je het niet weet. Let bij bewaren en opwarmen op voedselveiligheid. Noem calorieën of voedingswaarden alleen als de vraag er zelf over gaat, en baseer je dan alleen op de getallen in het recept en de berekening die je krijgt; reken niets uit dat je niet kunt onderbouwen. Schattingen van het model zijn bewust iets aan de hoge kant. ' +
      'WENS OF OPMERKING: zet soort op "wens", pas het recept aan en geef het hele aangepaste recept terug in "recept", in dezelfde opzet als hierboven (naam, porties, ingredienten, bereiding, opmerkingen, onzeker, controle, wijzigingen, extra_vriend, past_bij). Zet in "antwoord" in één of twee korte zinnen wat je hebt gedaan. Pas alleen aan wat nodig is en laat de rest zoals het is. Het recept is al aangepast aan eerder gekozen opties (lichter, aantal personen): doe dat niet nog eens. Is er al een lijst "extra_vriend", neem die dan ongewijzigd mee (tenzij de wens daarover gaat); is er geen, laat hem dan leeg. ' +
      'Zegt de tekst dat de portie te klein of te groot is, of dat er te weinig of te veel calorieën in zitten, maak dan zelf de porties groter of kleiner of voeg passende ingrediënten toe of haal ze weg, met aangepaste hoeveelheden en bereiding, zodat de gebruiker zelf niets hoeft te kiezen. Gebruik de berekening en het schema die je krijgt als richting, houd het eenvoudig met producten uit een gewone supermarkt, kies geen vetrijke ingrediënten en maak het gerecht niet onlogisch. ' +
      'Vraagt de gebruiker om een ingrediënt te vervangen, weg te laten of te veranderen, dan moet dat echt in de lijst en de bereiding zijn aangepast; zeg in "antwoord" alleen wat je werkelijk hebt veranderd. Vervangt de gebruiker rijst door pasta, kies dan zelf het soort pasta dat het best past bij het gerecht (bijvoorbeeld penne of fusilli) en noem dat soort. ' +
      'Een vraag in de vorm wat als ik ... (bijvoorbeeld wat als ik weinig geld heb of weinig tijd) behandel je als WENS: pas het recept meteen aan en leg kort uit wat je deed. ' +
      'Een verzoek in de vorm "Mag ik ook ...?", "Kan ik ... erbij?", "Kan ik ... eraan toevoegen?" of "Kan jij ...?" (bijvoorbeeld "kan jij er kaas bij doen?") is een WENS: pas het recept meteen aan. Alleen een vraag over bewaren, invriezen, opwarmen of waarom iets zo is, blijft een VRAAG. ' +
      'TWIJFEL: weet je niet zeker of het een vraag of een wens is, kies dan "wens", pas het recept aan en zeg kort in "antwoord" wat je hebt gedaan. ' +
      'Staat een ingrediënt van de lijstjes "Lust ik niet" of "Lust hij niet" toch in het recept, dan is dat een fout van het recept: pas het aan (wens) en zeg kort wat je hebt vervangen. ' +
      'Controleer na je aanpassing of het recept nog klopt: haal ingrediënten weg die door je aanpassing niet meer nodig zijn (bijvoorbeeld melk of room voor een puree die er niet meer is, of boter die niet meer gebruikt wordt), pas hoeveelheden aan waar dat nodig is, en zorg dat elk ingrediënt in de bereiding voorkomt en dat de bereiding alleen ingrediënten gebruikt die in de lijst staan. Zet in "wijzigingen" kort wat je nu hebt veranderd. Neem de eerdere wijzigingen over, maar schrap of corrigeer elke wijziging die door deze aanpassing niet meer klopt of is vervallen. De lijst moet de huidige stand van het recept ten opzichte van het origineel beschrijven, zonder tegenstrijdigheden.';

    var V14REGELS = ' EXTRA REGELS (v14, deze gaan voor op eerdere regels als ze elkaar tegenspreken): Neem elk ingrediënt dat in de bereiding genoemd wordt ook op in de lijst met ingrediënten (bijvoorbeeld sambal oelek, trassi, daun salam, laos, santen, zout), met de hoeveelheid uit het recept. Verzin nooit een hoeveelheid: staat er geen hoeveelheid in het recept, laat hoeveelheid dan leeg. Hoeveelheden die er wel staan (bijvoorbeeld 1 tl zout) neem je over. Optionele dingen (eventueel kool, maïs, om te serveren) zet je als tip in opmerkingen en niet in de lijst. Geef droge ingrediënten zoals dadels, noten, suiker, bloem en havermout in gram en niet in ml of cup (bijvoorbeeld 1 cup dadels is ± 150 g, 1 cup noten ± 110 g, 1 cup suiker ± 200 g, 2,5 cup bloem ± 300 g). Shortening blijft bakvet (shortening) en wordt niet vervangen door roomboter. Baking soda mag baking soda (zuiveringszout) heten en is iets anders dan bakpoeder. Een matige oven is 180 graden boven en onderwarmte. De gebruiker heeft een hetelucht-oven: reken elke ovenstemperatuur in de bereiding om naar hetelucht (ongeveer 20 graden lager dan boven en onderwarmte, dus 180 wordt 160) en schrijf bijvoorbeeld 160 graden hetelucht. Staat er al hetelucht, laat het dan zo. Platbrood, Libanees brood en pita zijn geen wrap: schrijf dan Libanees platbrood volkoren en nooit wrap. Is het aantal porties bekend (door de gebruiker opgegeven of in het recept genoemd), dan gaat dat altijd voor. Staat het er niet, schat het dan en schrijf bij porties bijvoorbeeld 8 porties (geschat).';
    REGELS += V14REGELS;
    var V14DREGELS = ' EXTRA REGELS (v14d, deze gaan voor op eerdere regels als ze elkaar tegenspreken): Staat er in het recept of de wens geen soort pasta, schrijf dan gewoon "pasta" en kies geen soort (dus niet penne of spaghetti). Kook pasta altijd apart in ruim water en meng hem daarna door of leg hem ernaast, tenzij de gebruiker een eenpansgerecht vraagt; gebruik de saus dan niet als kookvocht voor de pasta. Reken pasta in gram droog gewicht, ongeveer 80 g droog per portie. Voor een gerecht met gehakt voor 4 porties neemt de gebruiker 500 g gehakt (125 g per portie); neem dat als standaard, evenredig bij een ander aantal porties, tenzij het recept of de gebruiker iets anders zegt. Een gehaktsaus zonder groente die er echt doorheen zit maak je standaard met 1 blik tomatenpuree (140 g) en 1 pakje cherrytomaten (250 g), met water of bouillon naar behoefte; zit er wel groente zoals spinazie of ui in de saus, dan mag je tomatenblokjes uit blik gebruiken. Deze regel over tomatenpuree, cherrytomaten en tomatenblokjes geldt alleen voor pasta met een gehaktsaus en niet voor hamburgers, gehaktballen of andere gerechten met gehakt. Haal bij het goedkoper maken nooit vlees, vis of een ander eiwitrijk ingrediënt weg en halveer het niet: kies een goedkopere soort of bespaar op iets anders. Verander je iets aan een eiwitrijk ingrediënt, noem dan in wijzigingen het verschil in eiwit als getal in gram.';
    REGELS += V14DREGELS;
    var V15REGELS = ' EXTRA REGELS (v15, deze gaan voor op eerdere regels als ze elkaar tegenspreken): Maak je hamburgers zelf, gebruik dan 125 g rundergehakt per burger (tenzij de gebruiker een ander gehakt of gewicht noemt) en schrijf in de bereiding een duidelijke stap zoals "Verdeel het gehakt in 2 gelijke delen (ongeveer 125 g per burger) en vorm er platte burgers van." met het echte aantal en nooit een verwarrende formulering. Gebruik je kant-en-klare hamburgers, noem ze dan "runderhamburger (kant-en-klaar)" in stuks (ongeveer 100 g per stuk, bijvoorbeeld AH Runderhamburger). Hamburgerbroodjes noem je "hamburgerbroodje" in stuks. Bij hamburgers gebruik je geen tomatensaus, tomatenpuree of tomatenblokjes, maar bijvoorbeeld plakjes tomaat en sla. Noem aardappelschijfjes "aardappelschijfjes (voorgekookt)", ovenkroketjes "aardappelkroketjes (oven)" en rösti "rösti rondjes". Zout, peper, kruiden en water mogen zonder hoeveelheid in de lijst staan.';
    REGELS += V15REGELS;
    var V16REGELS = ' EXTRA REGELS (v16, deze gaan voor op eerdere regels als ze elkaar tegenspreken): ' +
      'KEUKEN: de gebruiker heeft een gewone hetelucht-oven en een magnetron, maar GEEN airfryer: noem nooit een airfryer. Haar magnetron heeft geen wattage maar standen (laag, middel, hoog) en een timer in minuten: noem bij de magnetron altijd de stand (bijvoorbeeld "op de hoogste stand") en de tijd in hele of halve minuten, en noem NOOIT watt of seconden. Gebruik de magnetron niet voor wat slap wordt of knapperig moet blijven (brood, pizza, muffins, gebakken dingen), wel voor bonen, soep, groente, rijst opwarmen en haverkoekjes. Zet nooit een heel ei in de schaal in de magnetron; kook eieren in een pan (roerei in een kommetje in de magnetron mag). ' +
      'BURGERS: meng bij zelfgemaakte burgers eerst zout, peper en kruiden door het gehakt en vorm daarna pas de burgers; strooi kruiden niet pas na het vormen op de buitenkant. Een ei door het gehakt alleen als de gebruiker erom vraagt. Een gewicht of hoeveelheid die de gebruiker zelf noemt gaat altijd voor. ' +
      'OLIE: zet olie of boter één keer in de ingrediëntenlijst en gebruik die aan het begin voor het eerste dat gebakken wordt. Wat daarna in dezelfde pan komt (ei, ui, enzovoort) gaat in het achtergebleven bakvet, zonder extra olie, en schrijf dat zo in de bereiding. ' +
      'HOEVEELHEDEN: noem bij beleg, salade, smeersels en saus een gewicht per portie of per snee (bijvoorbeeld "ongeveer 50 g per snee") en geen lepelmaat die niet bij het totaalgewicht past (1 el cottage cheese of kwark is ongeveer 20 g; 200 g cottage cheese is een heel bakje). Heb je geen betrouwbare lepelmaat, noem dan alleen het gewicht of "een heel bakje". ' +
      'BEWAREN: tonijnsalade maximaal 2 dagen en eiersalade maximaal 3 dagen in de koelkast; een hardgekookt ei in de schaal maximaal 1 week, gepeld maximaal 2 dagen in een afgesloten bakje. Schrijf nooit een langere bewaartijd dan het recept zelf noemt. ' +
      'SHAKE: stel nooit een maaltijdshake voor, tenzij de gebruiker er zelf om vraagt. ' +
      'MOE OF GEEN TREK: schrijft de gebruiker dat ze moe is of geen trek heeft, maak dan een compact, makkelijk weg te eten gerecht (zacht of vloeibaar, weinig kauwen, weinig koken en afwas), binnen het gewone richtgetal en niet calorierijker. ' +
      'VIS EN GROENTE: gebruik voor zalm in een gerecht wilde zalmfilet uit de diepvries en noem hem zo ("wilde zalmfilet (diepvries)"). Sperziebonen nooit uit de diepvries. ' +
      'VOEDINGSWAARDEN: vul bij elk ingrediënt ook "vw_per_100g" met een schatting voor dat product per 100 g, als lijst van precies 7 getallen in deze volgorde: eiwit, vet, waarvan verzadigd vet, koolhydraten, waarvan suikers, vezels, zout (allemaal in gram). Kun je het niet schatten, gebruik dan null in plaats van de lijst.';
    REGELS += V16REGELS;
    var V17REGELS = ' EXTRA REGELS (v17, deze gaan voor op eerdere regels als ze elkaar tegenspreken): ' +
      'GEPOFTE AARDAPPEL: een gepofte aardappel of gepofte zoete aardappel met schil mag en hoeft niet geschild of voorgekookt te zijn (de gebruiker schilt of kookt verder nooit aardappelen). Noem altijd gewicht en aantal, bijvoorbeeld "1 grote aardappel, ongeveer 300 g" of "1 zoete aardappel, ongeveer 250 g", en kies een formaat dat bij de portie past (ongeveer 200 tot 250 g per portie). Maak hem gaar in de magnetron op de hoogste stand of in de hetelucht-oven. ' +
      'EIEREN VOORAF KOKEN: schrijft de gebruiker dat ze moe is, geen trek heeft of dat het makkelijk moet, ga dan uit van vooraf gekookte eieren die al in de koelkast liggen en zeg dat in de bereiding. Geef dan in "opmerkingen" ook de tip om meteen extra eieren hard te koken voor later, met de bewaartijd: in de schaal maximaal 1 week, gepeld maximaal 2 dagen in een afgesloten bakje. ';
    REGELS += V17REGELS;
    var V26REGELS = ' EXTRA REGELS (v26, deze gaan voor op eerdere regels als ze elkaar tegenspreken): ' +
      'PASTA: kook pasta apart in een pan met water, behalve bij een ovengerecht. Bij een ovengerecht met pasta gaat de pasta ROUW in de schaal, samen met de saus en koud water (ongeveer 2,5 keer zoveel water als pasta, net zoveel dat de pasta onder staat), alles in één schaal, goed afgedekt met aluminiumfolie, in de hetelucht-oven op ongeveer 180 graden, 35 tot 45 minuten. Een bouillonblokje kruimel je direct in de schaal; bereid bouillon nooit apart. ';
    REGELS += V26REGELS;
    function souqTekst(parts) {
      var t = (parts || []).map(function (p) { return p && p.text ? p.text : ''; }).join(' ');
      return /\bsouq\b/i.test(t) ? ' CONTEXT: Souq is een merk van Libanees brood en Arabische producten bij Albert Heijn. Zegt de gebruiker alleen souq of Souq Libanees platbrood, dan bedoelt ze Souq Libanees brood met volkoren tarwemeel (± 66 g, 143 kcal per stuk). Maak het gerecht dan met Libanees platbrood volkoren (nooit met wraps) en leg niet uit wat een souq is. Noemt de gebruiker een ander Souq-product (bijvoorbeeld harissa of knoflooksaus), dan bedoelt ze dat product.' : '';
    }
    function dagKeuzeIdx() { var v = $('dagKeuze').value; return v === 'vandaag' ? new Date().getDay() : +v; }
    function dagTxt() { return DAGEN[dagKeuzeIdx()] + ($('dagKeuze').value === 'vandaag' ? ' (vandaag)' : ''); }
    function momentKeuze() { var v = $('momentKeuze').value; return MOMENTEN.indexOf(v) >= 0 ? v : ''; }
    (function () {
      var sel = $('dagKeuze'), nu = new Date();
      for (var i = 0; i < 7; i++) {
        var d = addDays(nu, i), o = document.createElement('option');
        if (i === 0) { o.value = 'vandaag'; o.textContent = 'Vandaag (' + DAGEN[d.getDay()] + ')'; sel.removeChild(sel.firstChild); }
        else { o.value = String(d.getDay()); o.textContent = DAGEN[d.getDay()] + ' ' + short(d); }
        sel.appendChild(o);
      }
    })();
    function momentTekst() { var m = momentKeuze(); return m ? ' Het recept is bedoeld voor ' + m + ' op ' + DAGEN[dagKeuzeIdx()] + ': zet in past_bij precies ' + m + '.' : ''; }
    function portiesVast() { var x = Math.round(Number(String($('portiesVast').value || '').trim().replace(',', '.'))); return isFinite(x) && x >= 1 && x <= 50 ? x : null; }
    function portiesTekst() { var p = portiesVast(); return p ? ' Het aantal porties is ' + p + ' (door de gebruiker opgegeven en dit gaat voor op alles): zet in porties ' + p + ' porties en pas de hoeveelheden niet aan.' : ''; }
    // =====================================================================
    // v16: voorkeuren per soort gerecht, eigen lunchmaximum, apparaten
    // =====================================================================
    var CATS = [
      { id: 'aardappelen', t: 'Aardappelen', re: /aardappel|krieltje|kroket|rösti|rosti|friet|patat|puree|stamppot|gnocchi|bataat/ },
      { id: 'rijstpasta', t: 'Rijst & Pasta', re: /rijst|pasta|spaghetti|penne|macaroni|fusilli|tagliatelle|couscous|noedel|risotto|lasagne|farfalle|rigatoni|linguine|fettuccine|orzo|tortellini|ravioli/ },
      { id: 'vlees', t: 'Vlees & Burgers', re: /gehakt|burger|\bkip|kippen|rund|vlees|biefstuk|worst|spek|bacon|\bham\b|kalkoen|shoarma|varken|\blam\b/ },
      { id: 'vis', t: 'Vis', re: /\bvis\b|zalm|tonijn|kabeljauw|garnaal|garnalen|haring|makreel|koolvis|pangasius|schelvis|tilapia|scampi|gamba/ },
      { id: 'groente', t: 'Groente', re: /groente|sperziebo|bonen|spinazie|bloemkool|broccoli|\bprei\b|wortel|courgette|paprika|\bsla\b|tomaat|tomaten|\bkool\b|spruiten|champignon|boerenkool|komkommer/ }
    ];
    var CAT_START = {
      aardappelen: { v: 'Alleen geschilde of voorgekookte aardappelen kopen (schijfjes, kleine krieltjes, ovenkroketjes of rösti). Ik schil of kook zelf nooit aardappelen en eet zelden gekookte aardappelen. Uitzondering: een gepofte aardappel (of gepofte zoete aardappel) met schil mag, die hoeft niet geschild: gaar in de magnetron (hoogste stand) of in de hetelucht-oven.', n: '' },
      rijstpasta: { v: 'Bij pasta met gehaktsaus uitsluitend tomatenpuree met cherrytomaten.', n: '' },
      vlees: { v: '', n: '' },
      vis: { v: 'Diepvries wilde zalmfilet (AH), alleen in gerechten zoals pasta, niet als losse filet.', n: '' },
      groente: { v: 'Sperziebonen nooit uit de diepvries (niet lekker). Bij "maak makkelijk": diepvriesspinazie of diepvriesbloemkool als vervanger.', n: '' }
    };
    function catData(id) {
      if (!S.cat || typeof S.cat !== 'object') S.cat = JSON.parse(JSON.stringify(CAT_START));
      if (!S.cat[id] || typeof S.cat[id] !== 'object') S.cat[id] = { v: '', n: '' };
      return S.cat[id];
    }
    function catLust() {
      var l = [];
      CATS.forEach(function (c) {
        String(catData(c.id).n || '').split(/[,;\n]/).forEach(function (x) { x = x.trim().toLowerCase(); if (x && l.indexOf(x) < 0) l.push(x); });
      });
      return l;
    }
    function nietIkAlle() {
      var l = nietIk().split(', ').filter(Boolean), lc = l.map(function (y) { return y.toLowerCase(); });
      catLust().forEach(function (x) { if (lc.indexOf(x) < 0) l.push(x); });
      return l.join(', ');
    }
    function catTelling(id) {
      var d = catData(id), n = 0;
      if (String(d.v || '').trim()) n++;
      n += String(d.n || '').split(/[,;\n]/).filter(function (x) { return x.trim(); }).length;
      return n;
    }
    var catTimer = null;
    function renderCat() {
      var box = $('catBlok'); if (!box) return; box.textContent = '';
      CATS.forEach(function (c) {
        var d = catData(c.id);
        var det = document.createElement('details'); det.className = 'grp';
        var sm = document.createElement('summary'), sp = document.createElement('span'), cnt = document.createElement('span');
        sp.textContent = c.t; cnt.className = 'gcnt'; cnt.textContent = String(catTelling(c.id)); cnt.hidden = !catTelling(c.id);
        sm.appendChild(sp); sm.appendChild(cnt); det.appendChild(sm);
        var l1 = document.createElement('label'); l1.setAttribute('for', 'cv_' + c.id); l1.textContent = 'Voorkeuren / Harde afspraken';
        var ta = document.createElement('textarea'); ta.id = 'cv_' + c.id; ta.value = d.v || ''; ta.style.minHeight = '90px';
        var l2 = document.createElement('label'); l2.setAttribute('for', 'cn_' + c.id); l2.textContent = 'Lust ik niet';
        var inp = document.createElement('input'); inp.type = 'text'; inp.id = 'cn_' + c.id; inp.value = d.n || ''; inp.placeholder = 'Bijvoorbeeld: prei, venkel'; inp.autocomplete = 'off'; inp.setAttribute('autocapitalize', 'off');
        function opslaan(nu) {
          var dd = catData(c.id); dd.v = ta.value; dd.n = inp.value;
          var n = catTelling(c.id); cnt.textContent = String(n); cnt.hidden = !n;
          clearTimeout(catTimer);
          if (nu) persist(); else catTimer = setTimeout(persist, 500);
        }
        ta.addEventListener('input', function () { opslaan(false); }); ta.addEventListener('change', function () { opslaan(true); });
        inp.addEventListener('input', function () { opslaan(false); }); inp.addEventListener('change', function () { opslaan(true); });
        det.appendChild(l1); det.appendChild(ta); det.appendChild(l2); det.appendChild(inp);
        box.appendChild(det);
      });
    }
    // v25: bij "Nieuw" geen gerecht voorstellen dat je al hebt gehad of bewaard hebt
    var EERDERKEY = 'eetweek.gemini.eerder';
    function eerderLijst() {
      try { var a = JSON.parse(localStorage.getItem(EERDERKEY) || '[]'); return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string' && x; }).slice(0, 8) : []; } catch (e) { return []; }
    }
    function onthoudEerder() {
      try {
        if (!laatste || !laatste.name) return;
        var n = String(laatste.name).trim().slice(0, 60); if (!n) return;
        var a = eerderLijst().filter(function (x) { return x.toLowerCase() !== n.toLowerCase(); });
        a.unshift(n); localStorage.setItem(EERDERKEY, JSON.stringify(a.slice(0, 8)));
      } catch (e) { /* geen opslag */ }
    }
    function eerderTekst() {
      var namen = [], seen = {};
      function add(x) { x = String(x || '').trim().slice(0, 60); var k = x.toLowerCase(); if (x && !seen[k]) { seen[k] = 1; namen.push(x); } }
      eerderLijst().forEach(add);
      (S.recipes || []).slice(0, 40).forEach(function (r) { add(r && r.name); });
      if (!namen.length) return '';
      return '\n\nAL EERDER VOORGESTELD OF BEWAARD (stel deze nu niet opnieuw voor): ' + namen.join('; ') + '. Kies een gerecht met een ander hoofdingrediënt dan deze, dus ook geen kleine variant van dezelfde schotel. Alleen als de wens zelf om een van deze gerechten vraagt, mag je er een kiezen.';
    }
    function catTekst(parts) {
      var alles = (parts || []).some(function (p) { return p && p.inline_data; });
      var t = (parts || []).map(function (p) { return p && p.text ? p.text : ''; }).join(' ').split(MAKKELIJK_KERN).join(' ').toLowerCase();
      var out = [];
      CATS.forEach(function (c) {
        var v = String(catData(c.id).v || '').trim(); if (!v) return;
        if (alles || c.re.test(t)) out.push(c.t + ': ' + v);
      });
      return out.length ? ' MIJN AFSPRAKEN PER SOORT GERECHT (harde afspraken van de gebruiker; ze gaan voor op je eigen keuzes, maar alleen voor het soort gerecht waar ze over gaan): ' + out.join(' | ') + '.' : '';
    }
    function lunchMax() {
      var x = Number(String($('lunchMax').value || '').trim().replace(',', '.'));
      return isFinite(x) && x >= 100 && x <= 1500 ? Math.round(x) : null;
    }
    function apparaten() { var a = []; if ($('apMagn').checked) a.push('de magnetron'); if ($('apOven').checked) a.push('de oven'); return a; }
    function apparaatTekst() {
      var a = apparaten(); if (!a.length) return '';
      return ' APPARATEN: ik wil dit recept liefst maken met ' + a.join(' en ') + ' (gebruik dat waar het kan; een pan of ander apparaat alleen als het echt niet anders kan). Schrijf ik in mijn wens zelf iets anders over apparaten (bijvoorbeeld "geen oven"), dan gaat dat voor.';
    }

    // ---- v16: recept blijft staan tot de app dicht gaat (sessionStorage), en Nieuw recept
    var SESKEY = 'eetweek.test.sessie';
    var laatsteBewaard = false;
    function sessieBewaar() {
      try { if (laatsteRaw) sessionStorage.setItem(SESKEY, JSON.stringify({ raw: laatsteRaw, vriend: vriendMode, wijz: wijzMag, bewaard: laatsteBewaard })); } catch (e) { /* geen opslag */ }
    }
    function sessieHerstel() {
      try {
        var s = JSON.parse(sessionStorage.getItem(SESKEY) || 'null');
        if (s && s.raw && typeof s.raw === 'object' && Array.isArray(s.raw.ingredienten)) {
          vriendMode = !!s.vriend; wijzMag = !!s.wijz;
          toon(s.raw, true); laatsteBewaard = !!s.bewaard; sessieBewaar();
        }
      } catch (e) { /* geen opslag of oude gegevens */ }
    }
    function nieuwReceptWis() {
      laatste = null; laatsteRaw = null; laatsteIng = []; laatstePorties = null; laatsteStat = null; laatsteExtra = []; vragenLijst = []; laatstePrijs = null; laatsteBewaard = false;
      try { sessionStorage.removeItem(SESKEY); } catch (e) { /* geen opslag */ }
      ['uitkomst', 'rKcal', 'rPrijs', 'rVW', 'gBewaar', 'rAntwoord', 'btnWens', 'btnStuks', 'btnLust'].forEach(function (id) { $(id).hidden = true; });
      ['vraag', 'invoer', 'wensNieuw', 'orig', 'wens'].forEach(function (id) { $(id).value = ''; });
      var fo = $('foto'); if (fo) { fo.value = ''; $('prev').hidden = true; }
      status(''); window.scrollTo(0, 0);
    }
    var nrTimer = null, NR_TXT = 'Nieuw recept';
    function nrReset() { Array.prototype.forEach.call(document.querySelectorAll('.nieuwrecept'), function (b) { b.textContent = NR_TXT; b.removeAttribute('data-sure'); }); }
    Array.prototype.forEach.call(document.querySelectorAll('.nieuwrecept'), function (b) {
      b.addEventListener('click', function () {
        if (!laatste || laatsteBewaard || b.getAttribute('data-sure')) { clearTimeout(nrTimer); nrReset(); nieuwReceptWis(); return; }
        Array.prototype.forEach.call(document.querySelectorAll('.nieuwrecept'), function (x) { x.textContent = 'Nog niet bewaard. Tik nog een keer om te wissen'; x.setAttribute('data-sure', '1'); });
        clearTimeout(nrTimer); nrTimer = setTimeout(nrReset, 6000);
      });
    });

    // ---- v16: aantal stuks controleren, getal uit de wens controleren
    function stuksControle() {
      var hi = hijEetInfo(); if (!vriendMode || !laatste || !hi || !hi.stuks) return null;
      var w = wie(), tot = 0;
      laatste.ing.forEach(function (i) { if (w.mij.indexOf(i) >= 0) return; if (i.p != null && typeof i.a === 'number') tot += i.a * i.p; });
      var st = stuksInfo(w, 1, tot), nodig = hi.stuks + 1;
      if (!st || st.n === nodig) return null;
      return { n: st.n, naam: st.naam, nodig: nodig, hij: hi.stuks };
    }
    function wensGetal(t) {
      t = String(t || '').toLowerCase();
      var m = t.match(/(?:max(?:imaal|imum)?|tot|onder|hooguit|niet meer dan)\s*(\d{3,4})(?!\d)(?!\s*(?:g\b|gr\b|gram|ml\b|kg\b|min|graden|°))/) || t.match(/(\d{3,4})\s*(?:kcal|calorie)/);
      return m ? +m[1] : null;
    }
    function wensCheck(w) {
      var b = $('btnWens'); b.hidden = true;
      var n = wensGetal(w), kn = kcalNu();
      if (!n || !kn) return '';
      var val = kn.pp != null ? kn.pp : kn.tot;
      if (!val || val <= n * 1.02) return '';
      b.dataset.n = n; b.dataset.v = val; b.textContent = 'Vraag Mistral om maximaal ' + n + ' kcal per portie'; b.hidden = false;
      return 'Je vroeg om maximaal ' + n + ', maar de app rekent ± ' + val + ' kcal per portie' + (kn.open ? ' (minstens: ' + kn.open + ' ingrediënt(en) tellen nog niet mee)' : '') + '. Tik op de knop hieronder om Mistral lagere hoeveelheden te laten maken.';
    }

    // ---- Mistral aanroepen
    function status(t, fout) { var s = $('status'); s.textContent = t || ''; s.dataset.b = fout ? '' : (t || ''); s.className = fout ? 'err' : ''; if (fout && s.scrollIntoView) s.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    function sleutel() {
      var k = $('key').value.trim();
      if (!k) throw new Error('Plak eerst je Mistral API-sleutel in het vak bovenaan.');
      return k;
    }
    function uitleg(res, tekst) {
      var s = res.status;
      if (s === 402) return 'Je Mistral-tegoed of betaalmethode klopt niet. Kijk op console.mistral.ai bij Facturering of je tegoed of betaalmethode in orde is.';
      if (s === 429) return 'Mistral is even op zijn limiet (te veel vragen achter elkaar). Wacht een minuutje en probeer het opnieuw.';
      if (s === 503) return 'Mistral is nu erg druk (ook na een tweede poging). Probeer het over een paar minuten opnieuw.';
      if (s === 400 && /api key|apikey/i.test(tekst)) return 'Mistral accepteert deze sleutel niet. Controleer of je hem helemaal hebt geplakt.';
      if (s === 401 || s === 403) return 'Geen toegang (' + s + '). Controleer je sleutel. Dit kan ook komen doordat het model niet voor jouw sleutel beschikbaar is.';
      if (s === 404) return 'Dit model bestaat niet (voor jouw sleutel). Tik op "Welke modellen kan ik gebruiken?" en kies er een.';
      return 'Fout ' + s + ':\n' + tekst.slice(0, 400);
    } // v49-fix: dubbele onbereikbare return verwijderd
    var TIJDLIMIET = 90000;
    function wacht(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
    async function post(model, body) {
      // Vertaalt het app-formaat naar de Mistral-api en het antwoord terug.
      var m = model; // keurnotitie 6 (8 nov): oude gemini/flash-omzet-restje opgeruimd
      var sys = ((body.systemInstruction && body.systemInstruction.parts) || []).map(function (p) { return p.text || ''; }).join('\n');
      var berichten = [];
      if (sys) berichten.push({ role: 'system', content: sys });
      (body.contents || []).forEach(function (c) {
        var stuk = [];
        (c.parts || []).forEach(function (p) {
          if (p.text) stuk.push({ type: 'text', text: p.text });
          else if (p.inline_data) stuk.push({ type: 'image_url', image_url: { url: 'data:' + p.inline_data.mime_type + ';base64,' + p.inline_data.data } });
        });
        if (stuk.length) berichten.push({ role: c.role === 'model' ? 'assistant' : 'user', content: stuk });
      });
      var vraag = { model: m, messages: berichten };
      if (body.generationConfig && body.generationConfig.responseMimeType === 'application/json') vraag.response_format = { type: 'json_object' };
      async function een() {
        var ctl = new AbortController(), tm = setTimeout(function () { ctl.abort(); }, TIJDLIMIET);
        try {
          return await fetch('https://api.mistral.ai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sleutel() }, body: JSON.stringify(vraag), signal: ctl.signal });
        } catch (e) {
          if (e.name === 'AbortError') throw new Error('Mistral reageert niet binnen ' + Math.round(TIJDLIMIET / 1000) + ' seconden. Probeer het opnieuw, of kies een lichter model (mistral-small-latest).');
          throw new Error('Geen verbinding met Mistral. Controleer je internet.');
        } finally { clearTimeout(tm); }
      }
      var res = await een(); denkOK = true;
      if (res.status === 429) {
        var oud = $('status').dataset.b || '';
        status('Mistral is even druk, ik probeer het over 4 seconden nog een keer...');
        await wacht(4000);
        status(oud);
        res = await een();
      }
      if (!res.ok) {
        var fout = await res.text();
        return { ok: false, status: res.status, text: function () { return Promise.resolve(fout); }, json: function () { return Promise.resolve({}); } };
      }
      var data = await res.json();
      var tekst = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
      var terug = { candidates: [{ content: { parts: [{ text: tekst }] } }] };
      return { ok: true, status: 200, text: function () { return Promise.resolve(JSON.stringify(terug)); }, json: function () { return Promise.resolve(terug); } };
    }
    async function gemini(parts, metTool, zonderKeuzes, extraSysteem) {
      var body = { contents: [{ role: 'user', parts: parts }], systemInstruction: { parts: [{ text: REGELS + (zonderKeuzes ? '' : versieTekst()) + lustTekst() + voorkeurTekst() + catTekst(parts) + prijzenTekst() + (zonderKeuzes ? '' : apparaatTekst()) + (extraSysteem || '') + souqTekst(parts) }] } };
      if (metTool) body.tools = [{ url_context: {} }]; else body.generationConfig = { responseMimeType: 'application/json' };
      var model = mistralModel(); // v58.4: model uit localStorage (standaard mistral-medium-latest), niet uit #model (staat alleen op Instellingen)
      var res = await post(model, body);
      if (!res.ok) throw new Error(uitleg(res, await res.text()));
      var data = await res.json();
      var delen = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
      var tekst = delen.map(function (p) { return p.text || ''; }).join('').trim();
      if (!tekst) throw new Error('Mistral gaf geen tekst terug (mogelijk gefilterd). Probeer een andere invoer.');
      return jsonUit(tekst);
    }

    function maakIng(i) {
      i = i || {};
      var a = getal(i.hoeveelheid), uo = String(i.eenheid || '').trim(), naam = String(i.naam == null ? '' : i.naam).trim().replace(/\s*\((g|gr|gram|ml|el|tl|stuk|stuks)\)/gi, '').replace(/nooitmuskaat/gi, function (m) { return m.charAt(0) === 'N' ? 'Nootmuskaat' : 'nootmuskaat'; });
      var u = normU(uo) || (typeof a === 'number' ? 'stuk' : '');
      var hit = vind(naam, uo), p = hit ? hit.p : null, est = false, g = null, k = null;
      if (!hit && typeof a === 'number' && a > 0) {
        var gg = Number(i.gewicht_gram), kk = Number(i.kcal_per_100g);
        if (isFinite(gg) && isFinite(kk) && gg > 0 && gg <= 2000 && kk >= 0 && kk <= 900) { p = Math.round(kk / 100 * gg / a * 1000) / 1000; est = true; g = gg; k = kk; }
      }
      var lo = uo.toLowerCase(), toonU;
      if (u === 'g' || u === 'ml' || u === 'el' || u === 'tl') toonU = u;
      else if (u === 'stuk' && (!lo || lo === 'stuk' || lo === 'stuks' || lo === 'st')) toonU = '';
      else toonU = lo || u;
      var gr = Number(i.gewicht_gram); gr = (isFinite(gr) && gr > 0 && gr <= 5000) ? gr : null;
      if (gr == null && typeof a === 'number') { if (u === 'el') gr = a * 15; else if (u === 'tl') gr = a * 5; }
      var vwA = null;
      if (Array.isArray(i.vw_per_100g) && i.vw_per_100g.length === 7) {
        var vq = i.vw_per_100g.map(function (q) { return (q === null || q === '' || q === undefined) ? NaN : Number(q); });
        if (vq.every(function (q) { return isFinite(q) && q >= 0 && q <= 100; })) vwA = vq;
      }
      return { n: naam, a: a, u: u, uo: toonU, p: p, _als: hit ? hit.n : null, _est: est, _g: g, _k: k, _gram: gr, _vw: vwA };
    }
    function hijMatch(naam) {
      var t = ' ' + schoon(naam) + ' ';
      return nietHij().split(', ').filter(Boolean).some(function (w) {
        var k = schoon(w); return k && new RegExp(' ' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|en|jes|tjes)? ').test(t);
      });
    }
    function lustControle(r) {
      function norm(t) { return ' ' + schoon(t) + ' '; }
      var tekstIk = norm((r.ingredienten || []).concat(r.extra_vriend || []).map(function (i) { return i.naam; }).join(' ') + ' ' + (r.bereiding || []).map(stapTekst).join(' '));
      var tekstHij = norm((r.extra_vriend || []).map(function (i) { return i.naam; }).join(' '));
      var gevonden = [];
      [['jij', nietIkAlle(), tekstIk], ['hij', nietHij(), tekstHij]].forEach(function (l) {
        l[1].split(', ').filter(Boolean).forEach(function (w) {
          var k = schoon(w); if (!k) return;
          if (new RegExp(' ' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|en|jes|tjes)? ').test(l[2])) gevonden.push({ wie: l[0], w: w });
        });
      });
      return gevonden;
    }
    function ingTekst(x) { return (x.a === 'naar smaak' ? x.n : (String(x.a).replace('.', ',') + ' ' + (x.uo ? x.uo + ' ' : '') + x.n)).replace(/\s+/g, ' ').trim(); }

    function stapTekst(s) {
      if (s == null) return '';
      if (typeof s === 'string' || typeof s === 'number') return String(s).trim();
      if (Array.isArray(s)) return s.map(stapTekst).filter(Boolean).join(' ');
      if (typeof s === 'object') {
        var k = ['stap', 'tekst', 'beschrijving', 'omschrijving', 'instructie', 'text'];
        for (var q = 0; q < k.length; q++) if (s[k[q]] != null && typeof s[k[q]] !== 'object') return String(s[k[q]]).trim();
        return Object.keys(s).map(function (x) { return typeof s[x] === 'object' ? '' : String(s[x]); }).filter(Boolean).join(' ').trim();
      }
      return '';
    }
    // wat is er veranderd? vergelijk twee ontvangen recepten
    function ingVerschil(voor, na) {
      voor = Array.isArray(voor) ? voor : []; na = Array.isArray(na) ? na : [];
      function lijstMap(l) { var m = {}; l.forEach(function (i) { if (i && i.naam) { var k = schoon(i.naam); if (!(k in m)) m[k] = i; } }); return m; }
      var a = lijstMap(voor), b = lijstMap(na), weg = [], erbij = [], anders = [];
      Object.keys(a).forEach(function (k) { if (!(k in b)) weg.push(ingTekst(maakIng(a[k]))); });
      Object.keys(b).forEach(function (k) {
        if (!(k in a)) { erbij.push(ingTekst(maakIng(b[k]))); return; }
        var x = getal(a[k].hoeveelheid), y = getal(b[k].hoeveelheid);
        if (typeof x === 'number' && typeof y === 'number' && x > 0 && Math.abs(y - x) / x >= 0.05 && schoon(a[k].eenheid) === schoon(b[k].eenheid))
          anders.push(b[k].naam + ': ' + String(x).replace('.', ',') + ' wordt ' + String(y).replace('.', ',') + (b[k].eenheid ? ' ' + b[k].eenheid : ''));
      });
      var t = [];
      if (weg.length) t.push('Weg: ' + weg.join('; ') + '.');
      if (erbij.length) t.push('Erbij: ' + erbij.join('; ') + '.');
      if (anders.length) t.push('Andere hoeveelheid: ' + anders.slice(0, 8).join('; ') + '.');
      return t.length ? 'Ingrediënten (door de app vergeleken met daarvoor):\n' + t.join('\n') : '';
    }
    function handtekening(r) {
      return JSON.stringify([(r.ingredienten || []).map(function (i) { return [schoon(i.naam), String(i.hoeveelheid), schoon(i.eenheid)]; }), (r.bereiding || []).map(stapTekst).map(schoon)]);
    }

    // ---- resultaat
    function toon(r, stil) {
      if (!r || typeof r !== 'object' || r.gelukt === false) { status('Dat lukte niet: ' + ((r && r.reden) || 'geen recept gevonden.'), true); return; }
      var pbTxt = schoon(String(r.naam || '') + ' ' + (Array.isArray(r.bereiding) ? r.bereiding : []).map(stapTekst).join(' '));
      if (/platbrood|libanees brood|libanese brood|pitabrood|\bpita\b/.test(pbTxt)) (Array.isArray(r.ingredienten) ? r.ingredienten : []).forEach(function (i) { if (i && /\b(wrap|wraps|tortilla|tortillas)\b/.test(schoon(i.naam))) i.naam = 'Libanees platbrood volkoren'; });
      var ing = (Array.isArray(r.ingredienten) ? r.ingredienten : []).map(maakIng);
      var regels = (Array.isArray(r.bereiding) ? r.bereiding : []).map(stapTekst).filter(Boolean);
      if (r.opmerkingen && String(r.opmerkingen).trim()) regels.push('Tip: ' + String(r.opmerkingen).trim().replace(/^tip\s*:\s*/i, ''));
      laatste = { name: String(r.naam || 'Recept').trim(), ing: ing.map(function (i) { var o = { n: i.n, a: i.a, u: i.u, p: i.p }; if (i._est) o.est = true; return o; }), steps: regels.join('\n'), where: [] };
      laatsteIng = ing;

      laatsteRaw = r; vragenLijst = []; $('rAntwoord').hidden = true; $('vraag').value = ''; $('gBewaar').hidden = true;
      var pm = String(r.porties || '').match(/(\d+)\s*(?:-\s*\d+\s*)?(?:porties?|personen|persoon)\b/i); laatstePorties = pm ? +pm[1] : null;
      var pvast = portiesVast(); if (pvast) { laatstePorties = pvast; r.porties = pvast + ' porties'; }
      laatsteStat = { eigen: ing.filter(function (i) { return i._als; }).length, geschat: ing.filter(function (i) { return i._est; }).length, open: ing.filter(function (i) { return !i._als && !i._est && typeof i.a === 'number'; }).length };
      $('rKcal').hidden = true; $('btnKcal').textContent = 'Toon calorieën'; $('rPrijs').hidden = true; $('btnPrijs').textContent = 'Toon prijs'; laatstePrijs = null;
      $('rVW').hidden = true; $('btnVW').textContent = 'Toon voedingswaarden'; $('btnWens').hidden = true; laatsteBewaard = false;
      $('rNaam').textContent = laatste.name;
      $('rPorties').textContent = r.porties ? '(' + r.porties + ')' : '';
      if (momentKeuze()) r.past_bij = momentKeuze();
      var pb = String(r.past_bij || '').toLowerCase().trim(); if (MOMENTEN.indexOf(pb) < 0) pb = ''; r.past_bij = pb;
      $('rPast').textContent = pb ? 'Past bij: ' + pb : ''; $('rPast').hidden = !pb;
      var ul = $('rIng'); ul.textContent = '';
      ing.forEach(function (i, k) {
        var li = document.createElement('li');
        li.textContent = (ingTekst(i) + (i.a === 'naar smaak' ? ' – naar smaak' : '')).replace(/\s+/g, ' ').trim();
        var tag = document.createElement('span'); tag.className = 'tag';
        tag.textContent = i._als ? ' – herkend als ' + i._als : (i._est ? ' – geschat door ' + AINAAM : (typeof i.a === 'number' ? ' – nog te schatten' : ' – telt niet mee'));
        li.appendChild(tag);
        if (vriendMode) {
          var sel = document.createElement('select'); sel.className = 'wie'; sel.setAttribute('data-k', k); sel.setAttribute('aria-label', 'Voor wie is dit ingrediënt?');
          [['', 'Voor ons allebei'], ['hem', 'Niet voor hem'], ['mij', 'Niet voor mij']].forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; sel.appendChild(op); });
          if (hijMatch(i.n)) { sel.value = 'hem'; }
          li.appendChild(document.createElement('br')); li.appendChild(sel);
        }
        ul.appendChild(li);
      });
      $('rStappen').textContent = regels.map(function (s, k) { return /^(tip|bewaren|opwarmen)\s*:/i.test(s) ? s : (k + 1) + '. ' + s; }).join('\n');
      var wl = $('rWijzLijst'), w = wijzMag ? (Array.isArray(r.wijzigingen) ? r.wijzigingen : []).filter(Boolean) : []; wl.textContent = '';
      w.forEach(function (x) { var li = document.createElement('li'); li.textContent = String(typeof x === 'string' ? x : JSON.stringify(x)); wl.appendChild(li); }); $('rWijz').hidden = !w.length;
      var tw = $('rTwijfel'), o = (r.onzeker || []).filter(Boolean).concat((r.controle || []).filter(Boolean)).map(function (x) { return typeof x === 'string' ? x : JSON.stringify(x); });
      var lc = lustControle(r), bl = $('btnLust');
      lc.forEach(function (x) { o.push(x.w + ' staat nog in het recept, terwijl ' + (x.wie === 'jij' ? 'jij dat' : 'je vriend dat') + ' niet lust'); });
      bl.hidden = !lc.length; bl.dataset.w = lc.map(function (x) { return x.w; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ');
      var sk = stuksControle(), bs = $('btnStuks'); bs.hidden = !sk;
      if (sk) { o.push('je vriend eet ' + sk.hij + ' en jij 1 (samen ' + sk.nodig + ' ' + sk.naam + '), maar het recept is voor ' + sk.n); bs.textContent = 'Vraag Mistral om ' + sk.nodig + ' ' + sk.naam; bs.dataset.n = sk.nodig; bs.dataset.naam = sk.naam; bs.dataset.hij = sk.hij; }
      if (o.length) { tw.hidden = false; tw.textContent = 'Kijk dit zelf even na: ' + o.join('; '); } else tw.hidden = true;
      var ex = vriendMode ? (Array.isArray(r.extra_vriend) ? r.extra_vriend : []).map(maakIng).filter(function (x) { return x.n; }) : [];
      laatsteExtra = ex;
      var el = $('rExtraLijst'); el.textContent = '';
      ex.forEach(function (x, k) {
        var li = document.createElement('li'), lb = document.createElement('label'), cb = document.createElement('input'), sp = document.createElement('span'), tg = document.createElement('span');
        lb.style.cssText = 'display:flex;gap:10px;align-items:flex-start;font-weight:400;font-size:16px;margin:6px 0';
        cb.type = 'checkbox'; cb.setAttribute('data-k', k); cb.style.cssText = 'width:22px;height:22px;flex:none;margin-top:1px';
        sp.textContent = ingTekst(x);
        tg.className = 'tag'; tg.textContent = x._als ? ' – herkend als ' + x._als : (x._est ? ' – geschat door ' + AINAAM : (typeof x.a === 'number' ? ' – nog te schatten' : ' – telt niet mee'));
        sp.appendChild(tg); lb.appendChild(cb); lb.appendChild(sp); li.appendChild(lb); el.appendChild(li);
      });
      $('rExtra').hidden = !ex.length;
      $('kcalDoelBlok').hidden = !vriendMode;
      renderKaarten();
      $('uitkomst').hidden = false;
      if (!stil) status('Klaar. Controleer het voorstel hieronder.' + (wijzMag && /lite/i.test(mistralModel()) ? ' Tip: omrekenen en vervangen gaat nauwkeuriger met een groter model (kies bij Model een groter model (mistral-medium-latest)).' : '')); // v58.4: model uit localStorage
      if (!stil) $('uitkomst').scrollIntoView({ behavior: 'smooth', block: 'start' });
      sessieBewaar();
    }

    async function uitvoeren(knop, taak, houd) {
      status(''); knop.disabled = true;
      var t0 = Date.now(), iv = setInterval(function () {
        var s = $('status'), sec = Math.round((Date.now() - t0) / 1000);
        if (s.dataset.b && sec >= 3) s.textContent = s.dataset.b + ' (' + sec + ' s)';
      }, 1000);
      try {
        await taak(); clearInterval(iv);
        var s = $('status'), sec = Math.round((Date.now() - t0) / 1000);
        if (s.className !== 'err' && s.dataset.b) s.textContent = s.dataset.b + ' Gedaan in ' + sec + ' s' + (denkOK === null ? '.' : denkOK ? ' (korte denktijd aan).' : ' (korte denktijd niet beschikbaar bij dit model).');
      } catch (e) { status(e.message, true); } finally { clearInterval(iv); knop.disabled = false; }
    }

    // ---- knoppen
    $('goTekst').addEventListener('click', function () {
      var t = $('invoer').value.trim();
      uitvoeren(this, async function () {
        if (!t) throw new Error('Plak eerst een link of de tekst van een recept.');
        var link = /^https?:\/\/\S+$/.test(t);
        wijzMag = keuzesAan(); vriendMode = $('personen').value === 'vriend';
        status(link ? 'Webpagina openen en recept lezen...' : 'Recept lezen...');
        var isEngels = window._tekstEngels || /\b(ingredients|tablespoon|teaspoon|chicken|cheese|butter|recipe|cook|minutes|calories|olive oil|servings)\b/i.test(t);
        var extraPrompt = '';
        if (isEngels) {
          extraPrompt += '\n\nBELANGRIJK VOOR ENGELS RECEPT: Vertaal het recept volledig naar helder Nederlands, inclusief alle ingrediënten, eenheden (omgerekend naar gram/ml/stuks) en bereidingsstappen.';
        }
        if (window._tekstMinderCal || isEngels) {
          extraPrompt += '\n\nCALORIEËN VERLAGEN: Veel online recepten bevatten veel vet, boter, olie of room. Pas de hoeveelheden subtiel naar beneden aan zodat het recept past bij een gezond eetschema (± 675 kcal per portie voor avondeten of ± 500 kcal voor lunch). Houd het gerecht smaakvol en zacht, en noem onder "wijzigingen" wat je hebt verlaagd of vervangen.';
        }
        if (window._tekstZachter) {
          extraPrompt += '\n\nSTRUCTUUR: Maak het gerecht zacht en makkelijk verteerbaar (geschikt bij vermoeidheid of weinig eetlust door bijv. medicatie).';
        }
        var prompt = (link ? 'Haal het recept op van deze pagina: ' + t + '\nLees het recept van die pagina zonder iets te verzinnen. Schrijf alles, ook de namen van de ingrediënten, in het Nederlands.' : 'Haal het recept uit deze tekst (schrijf alles, ook de namen van de ingrediënten, in het Nederlands):\n\n' + t) + versieVraag() + makkelijkLees() + (extraPrompt || '');
        toon(await gemini([{ text: prompt }], link));
      });
    });
    $('goAanpassen').addEventListener('click', function () {
      var o = $('orig').value.trim(), w = $('wens').value.trim();
      uitvoeren(this, async function () {
        if (!o || !w) throw new Error('Vul het recept en je wens in.');
        wijzMag = true; vriendMode = $('personen').value === 'vriend';
        status('Recept aanpassen...');
        toon(await gemini([{ text: 'Hier is het recept:\n' + o + '\n\nWens: ' + w + '\n\nPas het recept aan naar deze wens, zodat het echt lekker blijft: denk aan smaak, structuur en vocht, en pas hoeveelheden, kruiden en bereiding aan waar de wijziging dat vraagt (kip is bijvoorbeeld droger en flauwer dan tonijn). Voeg zo nodig een paar ingrediënten toe, maar houd het eenvoudig en met producten uit een gewone supermarkt. Voeg geen vetrijke ingrediënten toe (zoals gewone mayonaise, room, boter of olie) tenzij ze al in het origineel staan. Heeft het recept iets smeuïgs nodig, kies dan een lichte variant: kwark, Griekse yoghurt of light mayonaise (en zeg dat in de naam, bijvoorbeeld "light mayonaise"). Houd het aantal porties gelijk aan het origineel en pas hoeveelheden zo aan dat één portie ongeveer even groot blijft. Houd de calorieën per portie ongeveer gelijk aan het origineel' + (window._aanpasKcal ? ' (dat is ± ' + window._aanpasKcal + ' kcal per portie)' : '') + ', met hooguit 5% verschil. Noemt de wens zelf een aantal calorieën (bijvoorbeeld "rond 120"), dan gaat dat getal voor en betekent "rond" 5% erboven of eronder. Noem zelf geen calorieën in je antwoord. Pas de bewaartijd aan en zet bewaar- of veiligheidstips in "opmerkingen". Zet in "wijzigingen" kort wat je hebt veranderd.' + versieVraag() }], false));
      });
    });

    function verklein(file) {
      return new Promise(function (ok, nee) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () {
          var max = 1600, f = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement('canvas'); c.width = Math.round(img.width * f); c.height = Math.round(img.height * f);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          ok(c.toDataURL('image/jpeg', 0.88).split(',')[1]);
        };
        img.onerror = function () { URL.revokeObjectURL(url); nee(new Error('Deze foto kan ik niet openen. Probeer een jpg of png.')); };
        img.src = url;
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-cam]'), function (b) { b.addEventListener('click', function () { $(b.getAttribute('data-cam') + 'Cam').click(); }); });
    $('foto').addEventListener('change', function () {
      var f = this.files && this.files[0], p = $('prev');
      if (!f) { p.hidden = true; return; }
      p.src = URL.createObjectURL(f); p.hidden = false;
    });
    $('goFoto').addEventListener('click', function () {
      var f = $('foto').files && $('foto').files[0];
      uitvoeren(this, async function () {
        if (!f) throw new Error('Kies eerst een foto.');
        wijzMag = keuzesAan(); vriendMode = $('personen').value === 'vriend';
        status('Foto verkleinen en lezen...');
        var b64 = await verklein(f);
        toon(await gemini([
          { text: 'Lees het recept op de foto (kookboek of handschrift). Lees eerst precies wat er staat en verzin niets. Twijfel je over een woord of getal, zet het dan in "onzeker". Staat er geen leesbaar recept op, zet "gelukt" op false.' + versieVraag() + makkelijkLees() },
          { inline_data: { mime_type: 'image/jpeg', data: b64 } }
        ], false));
      });
    });

    var NIEUW_REGELS = ' NIEUWE OPDRACHT VOOR DIT ANTWOORD (dit gaat voor op de regel dat je ingrediënten en bereiding overneemt uit een recept): er is geen bronrecept. Bedenk zelf een eenvoudig, lekker recept dat past bij de wens van de gebruiker. Gebruik producten uit een gewone Nederlandse supermarkt, een korte bereiding met weinig afwas en geen vetrijke ingrediënten tenzij de wens erom vraagt. Kies een aantal porties dat bij de wens past en zet het in "porties" als "N porties". De gebruiker eet meestal alleen: noemt de wens geen tweede persoon of aantal personen, dan maak je 1 portie (niet 2). Noemt de wens haar vriend of twee personen, dan maak je 2 porties. Noemt de wens een calorie- of schemadoel, of krijg je hieronder een richtgetal, houd je daar globaal aan, maar noem zelf geen calorieën. Laat "wijzigingen" en "controle" leeg, tenzij er een echt probleem is. Heeft het gerecht platbrood nodig, schrijf dan Libanees platbrood volkoren en nooit wrap.';
    // Richtgetal uit het schema voor het moment en de dag (alleen een richtgetal, geen extra aanvraag). Een getal in de wens zelf gaat altijd voor.
    function nieuwRichtgetal(w) {
      var m = momentKeuze(), t = schoon(w);
      if (!m) m = /ontbijt/.test(t) ? 'ontbijt' : /lunch|lunchen/.test(t) ? 'lunch' : /tussendoor|snack|toetje|dessert|tussendoortje/.test(t) ? '' : 'avondeten';
      if (!m || !SCHEMA[m]) return '';
      var eigenL = m === 'lunch' ? lunchMax() : null, mx = eigenL || SCHEMA[m][dagKeuzeIdx()];
      if (!mx) return '';
      var tekst = m === 'avondeten'
        ? ' RICHTGETAL VAN HET SCHEMA: voor één portie avondeten op ' + dagTxt() + ' is dat gemiddeld ± ' + mx + ' kcal (in de praktijk ± ' + (mx - 75) + ' tot ' + (mx + 75) + '). Zorg dat één portie daar globaal bij past.'
        : ' RICHTGETAL VAN HET SCHEMA: voor één portie ' + m + ' op ' + dagTxt() + ' is dat maximaal ± ' + mx + ' kcal. Zorg dat één portie daar globaal onder blijft.';
      return tekst + ' Noemt de wens van de gebruiker zelf een aantal calorieën (bijvoorbeeld "rond 1000"), dan gaat dat getal altijd voor op dit richtgetal. Noem zelf geen calorieën in je antwoord.';
    }
    $('goNieuw').addEventListener('click', function () {
      var w = $('wensNieuw').value.trim();
      uitvoeren(this, async function () {
        if (!w) throw new Error('Typ eerst wat je wilt eten.');
        wijzMag = false; vriendMode = $('personen').value === 'vriend';
        status('Recept bedenken...');
        toon(await gemini([{ text: 'Bedenk een recept voor deze wens:\n' + w + versieVraag() + makkelijkNieuw() }], false, false, NIEUW_REGELS + nieuwRichtgetal(w) + eerderTekst()));
        onthoudEerder();
        var wcn = $('uitkomst').hidden ? '' : wensCheck(w);
        if (wcn) { var bn = $('rAntwoord'); bn.textContent = wcn; bn.hidden = false; }
      });
    });
    if ($('btnTest')) $('btnTest').addEventListener('click', function () {
      uitvoeren(this, async function () {
        status('Verbinding testen...');
        var model = mistralModel(); // v58.4
        var res = await post(model, { contents: [{ role: 'user', parts: [{ text: 'Zeg in één korte Nederlandse zin hallo.' }] }] });
        if (!res.ok) throw new Error(uitleg(res, await res.text()));
        var d = await res.json();
        var t = ((d.candidates || [{}])[0].content || { parts: [] }).parts.map(function (p) { return p.text || ''; }).join('').trim();
        status('De verbinding werkt. Mistral zegt: ' + t);
      });
    });
    if ($('btnModellen')) $('btnModellen').addEventListener('click', function () {
      uitvoeren(this, async function () {
        status('Modellen ophalen...');
        var res = await fetch('https://api.mistral.ai/v1/models', { headers: { 'Authorization': 'Bearer ' + sleutel() } })
          .catch(function () { throw new Error('Geen verbinding met Mistral. Controleer je internet.'); });
        if (!res.ok) throw new Error(uitleg(res, await res.text()));
        var d = await res.json();
        var lst = (d.data || []).map(function (m) { return m.id; }).filter(function (n) { return /mistral-(medium|small)-latest/i.test(n); });
        var dl = $('modellen'); dl.textContent = '';
        lst.forEach(function (n) { var o = document.createElement('option'); o.value = n; dl.appendChild(o); });
        if (!lst.length) { status('Er zijn geen Mistral-modellen gevonden voor deze sleutel.', true); return; }
        $('model').value = lst.indexOf($('model').value) >= 0 ? $('model').value : lst[0]; bewaarLust();
        status('Gevonden: ' + lst.join(', ') + '.\nHet bovenste is nu ingevuld. Je kunt in het veld "Model" een andere kiezen.');
      });
    });

    $('btnPasaan').addEventListener('click', function () {
      var w = $('vraag').value.trim();
      uitvoeren(this, async function () {
        if (!laatsteRaw) throw new Error('Lees eerst een recept in.');
        if (!w) throw new Error('Typ eerst wat er anders moet.');
        wijzMag = true; vriendMode = $('personen').value === 'vriend'; // v49-fix: vriendMode verversen bij "Pas het recept aan"
        status('Recept aanpassen...');
        var voorK = kcalNu(), voorI = laatsteRaw.ingredienten;
        var rPas = await gemini([{ text: 'Hier is het huidige recept als JSON:\n' + JSON.stringify(laatsteRaw) + '\n\nWens: ' + w + '\n\nPas het recept alleen aan zoals gevraagd en laat de rest zoals het is. Het recept is al aangepast aan eerder gekozen opties (lichter, aantal personen): doe dat niet nog eens. Is er al een lijst "extra_vriend", neem die dan ongewijzigd mee (tenzij de wens daarover gaat); is er geen, laat hem dan leeg. Controleer na je aanpassing of het recept nog klopt: haal ingrediënten weg die door je aanpassing niet meer nodig zijn (bijvoorbeeld melk of room voor een puree die er niet meer is, of boter die niet meer gebruikt wordt), pas hoeveelheden aan waar dat nodig is, en zorg dat elk ingrediënt in de bereiding voorkomt en dat de bereiding alleen ingrediënten gebruikt die in de lijst staan. Geef het hele aangepaste recept terug in dezelfde JSON-opzet. Zet in "wijzigingen" kort wat je nu hebt veranderd. Neem de eerdere wijzigingen over, maar schrap of corrigeer elke wijziging die door deze aanpassing niet meer klopt of is vervallen (zeg bijvoorbeeld niet dat je melk voor de puree hebt gebruikt als er geen puree meer is). De lijst moet de huidige stand van het recept ten opzichte van het origineel beschrijven, zonder tegenstrijdigheden.' }], false, true);
        toon(rPas);
        var vg2 = vergelijkKcal(voorK), vi2 = $('uitkomst').hidden ? '' : ingVerschil(voorI, rPas && rPas.ingredienten), t2 = [vg2, vi2].filter(Boolean).join('\n');
        var wc2 = $('uitkomst').hidden ? '' : wensCheck(w);
        if (wc2) t2 = (t2 ? t2 + '\n' : '') + wc2;
        if (t2) { var b2 = $('rAntwoord'); b2.textContent = t2; b2.hidden = false; }
      }, true);
    });
    $('btnMakkelijk').addEventListener('click', function () {
      if (!laatsteRaw) { status('Lees eerst een recept in.', true); return; }
      $('vraag').value = makkelijkWens();
      $('btnPasaan').click();
    });
    $('btnLust').addEventListener('click', function () {
      $('vraag').value = 'Haal ' + this.dataset.w + ' uit het recept: vervang het door het meest verwante ingrediënt dat niet op een van de lijstjes "Lust niet" staat (bijvoorbeeld bosui of ui voor prei), of laat het weg als er niets goed past. Pas de bereiding en de hoeveelheid mee aan.';
      $('btnPasaan').click();
    });
    $('btnSeizoen').addEventListener('click', function () {
      $('vraag').value = 'Vervang de groente in dit recept door groente die nu in het seizoen is en in een gewone supermarkt ligt, en pas de bereiding daarop aan. Zeg kort wat je hebt verwisseld.';
      $('btnDoe').click();
    });
    $('btnInvries').addEventListener('click', function () {
      $('vraag').value = 'Kan ik dit invriezen? Zo ja: hoe moet ik het invriezen, hoe lang blijft het dan goed en hoe warm ik het later het beste op? Zo nee: kort waarom niet.';
      $('btnDoe').click();
    });
    $('btnVraag').addEventListener('click', function () {
      var v = $('vraag').value.trim();
      uitvoeren(this, async function () {
        if (!laatsteRaw) throw new Error('Lees eerst een recept in.');
        if (!v) throw new Error('Typ eerst je vraag.');
        vriendMode = $('personen').value === 'vriend'; // v49-fix: vriendMode verversen bij "Stel een vraag"
        status('Vraag stellen...');
        var body = {
          contents: [{ role: 'user', parts: [{ text: 'Recept (JSON):\n' + JSON.stringify(laatsteRaw) + '\n\nGekozen opties in de pagina: ' + $('keuzeTekst').textContent + ($('rKcal').hidden ? '' : '\n\nBerekening die nu op het scherm staat (met per ingrediënt wat het telt):\n' + $('rKcal').textContent) + ($('rPrijs').hidden ? '' : '\n\nPrijsberekening die nu op het scherm staat:\n' + $('rPrijs').textContent) + (vragenLijst.length ? '\n\nEerdere vragen en je antwoorden (oudste eerst):' + vragenLijst.map(function (q) { return '\nVraag: ' + q.v + '\nAntwoord: ' + q.a; }).join('') : '') + '\n\nVraag: ' + v }] }],
          systemInstruction: { parts: [{ text: 'Je beantwoordt kort en duidelijk in het Nederlands één vraag over dit recept, in gewone zinnen zonder opmaak. Verander het recept niet. Je ziet alleen het huidige recept, de gekozen opties en de eerdere vragen met je antwoorden; je weet niet hoe het originele recept eruitzag of wat er eerder is aangepast, behalve wat bij "wijzigingen" staat. De lijstjes "Lust ik niet" en "Lust hij niet" in de gekozen opties zijn bedoeld om zulke ingrediënten uit het recept te laten of te vervangen. Staat zo een ingrediënt toch in het recept, zeg dan kort dat dat niet had gemoeten en dat de knop "Pas het recept aan" (met bijvoorbeeld "haal prei eruit") dit oplost; verzin geen andere reden. Verzin geen uitleg: weet je iets niet zeker, zeg dan kort dat je dat niet kunt zien. Noem alleen calorieën of voedingswaarden als de vraag er zelf over gaat. Baseer je dan alleen op de getallen in het recept (kcal_per_100g en gewicht_gram) en op de berekening die op het scherm staat, en reken niets uit dat je niet kunt onderbouwen. Beschrijf alleen wat er letterlijk in die berekening staat; staat er geen overzicht per ingrediënt bij, zeg dan dat je dat niet kunt zien. Is er geen berekening op het scherm, zeg dan dat de knop "Toon calorieën" die laat zien en dat daar onder "Bekijk per ingrediënt" staat wat elk ingrediënt telt. Schattingen van het model zijn bewust iets aan de hoge kant gekozen, zodat je niet te weinig telt. Weet je iets niet zeker, zeg dat dan. Let bij bewaren en opwarmen op voedselveiligheid.' }] }
        };
        var res = await post(mistralModel(), body); // v58.4: model uit localStorage
        if (!res.ok) throw new Error(uitleg(res, await res.text()));
        var d = await res.json();
        var t = ((d.candidates || [{}])[0].content || { parts: [] }).parts.map(function (p) { return p.text || ''; }).join('').trim();
        if (!t) throw new Error('Mistral gaf geen antwoord (mogelijk gefilterd). Probeer de vraag anders te stellen.');
        var box = $('rAntwoord'); box.textContent = t; box.hidden = false; vragenLijst.push({ v: v, a: t }); if (vragenLijst.length > 4) vragenLijst.shift();
        status('Antwoord klaar.');
      }, true);
    });

    // verdeling tussen jou en je vriend (alleen bij "met vriend"): de pagina rekent, Mistral niet
    function stuksNaam(n) { n = String(n || 'stuks').toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim(); return /s$/.test(n) ? n : n + 's'; }
    function stuksInfo(w, maaltijden, tot) {
      var best = null, bk = 0;
      if (/burger/.test(schoon(laatste.name + ' ' + laatste.steps))) {
        laatste.ing.forEach(function (i) {
          if (!best && w.mij.indexOf(i) < 0 && typeof i.a === 'number' && i.u === 'g' && /gehakt/.test(schoon(i.n))) { var n = Math.round(i.a / maaltijden / 125); if (n >= 2 && n <= 12) best = { n: n, naam: 'burgers' }; }
        });
        if (best) return best;
      }
      laatste.ing.forEach(function (i) {
        if (w.mij.indexOf(i) >= 0 || i.p == null || typeof i.a !== 'number' || i.u !== 'stuk') return;
        var n = i.a / maaltijden, k = i.a * i.p;
        if (n >= 2 && n <= 24 && Math.abs(n - Math.round(n)) < 0.01 && k / tot >= 0.3 && k > bk) { best = { n: Math.round(n), naam: stuksNaam(i.n) }; bk = k; }
      });
      return best;
    }
    function ratioWaarde() {
      var k = $('ratioKeuze').value; if (k === 'auto') return null;
      var x = k === 'eigen' ? Number(String($('ratioEigen').value || '').trim().replace(',', '.')) : Number(k);
      return isFinite(x) && x >= 1 && x <= 6 ? x : null;
    }
    function verdeling() {
      if (!vriendMode || !laatste) return null;
      var w = wie(), tot = 0, hi = hijEetInfo();
      laatste.ing.forEach(function (i) { if (w.mij.indexOf(i) >= 0) return; if (i.p != null && typeof i.a === 'number') tot += i.a * i.p; });
      if (tot <= 0) return null;
      var maaltijden = hi ? 1 : (laatstePorties && laatstePorties >= 2 ? laatstePorties / 2 : 1), maal = tot / maaltijden;
      var raw = String($('kcalDoel').value || ''), dv = raw.replace(/[^0-9]/g, ''), doel = dv ? +dv : null, bron = 'ingevuld';
      if (doel && /%/.test(raw) && doel < 100) { doel = Math.round(maal * doel / 100); bron = 'ingevuld percentage (' + dv + '%)'; }
      var rt = ratioWaarde(); if (rt) { doel = Math.round(maal / (1 + rt)); bron = 'jij 1 : je vriend ' + String(rt).replace('.', ',') + ' keer zoveel'; }
      if (!doel && hi && hi.kcal && maal > hi.kcal) { doel = Math.round(maal - hi.kcal); bron = 'wat je vriend eet (± ' + hi.kcal + ' kcal)'; }
      if (!doel) { var sc = schemaNu(); if (sc && sc.max) { doel = sc.max; bron = sc.eigen ? 'je eigen maximum voor de lunch' : 'je schema voor ' + sc.moment + ' op ' + sc.dagTxt; } }
      if (!doel || doel <= 0) return null;
      var jij = Math.min(doel, maal), pct = Math.round(jij / maal * 100), delen = Math.max(1, Math.min(9, Math.round(jij / maal * 10)));
      var res = { maal: Math.round(maal), doel: doel, bron: bron, jij: Math.round(jij), hij: Math.round(maal - jij), pct: pct, delen: delen, rest: 10 - delen, maaltijden: maaltijden, stuks: null };
      var st = stuksInfo(w, maaltijden, tot);
      if (st) {
        // jouw aantal komt uit je schemadoel (doel gedeeld door de calorieën per stuk); de calorieën volgen uit dat aantal
        var perStuk = maal / st.n, x = Math.max(1, Math.min(st.n - 1, Math.round(jij / perStuk)));
        if (!rt && hi && hi.stuks && st.n === hi.stuks + 1) x = 1; // het recept is gemaakt voor wat je vriend eet plus 1 voor jou
        res.stuks = { n: st.n, naam: st.naam, jij: x, hij: st.n - x };
        res.jij = Math.round(x * perStuk); res.hij = Math.round(maal - res.jij); res.pct = Math.round(res.jij / maal * 100);
      }
      var exN = [], exK = 0;
      Array.prototype.forEach.call(document.querySelectorAll('#rExtraLijst input:checked'), function (c) {
        var xx = laatsteExtra[+c.getAttribute('data-k')]; if (!xx) return;
        exN.push(ingTekst(xx)); if (xx.p != null && typeof xx.a === 'number') exK += xx.a * xx.p;
      });
      if (exN.length) res.extra = { namen: exN.join(', '), kcal: Math.round(exK) };
      return res;
    }
    function verdelingTekst(v) {
      var ex = v.extra ? ' Zijn extra\'s (' + v.extra.namen + ', ± ' + v.extra.kcal + ' kcal) komen daar bovenop: zijn deel is dan samen ± ' + (v.hij + v.extra.kcal) + ' kcal.' : ' Wat hij extra kiest komt daar bovenop.';
      if (v.stuks) {
        var vs = v.jij - v.doel, ab = Math.abs(vs);
        return 'Verdeling per maaltijd (hele maaltijd ± ' + v.maal + ' kcal; schemadoel ± ' + v.doel + ', uit ' + v.bron + '): jij ' + v.stuks.jij + ' van de ' + v.stuks.n + ' ' + v.stuks.naam + ' = ± ' + v.jij + ' kcal, je vriend ' + v.stuks.hij + ' = ± ' + v.hij + ' kcal.' + ex +
          (ab >= 25 ? ' Jouw deel is ± ' + ab + ' kcal ' + (vs < 0 ? 'lager' : 'hoger') + ' dan je schemadoel. Wil je dichter bij je schemadoel komen, vul dan bij \"Hoeveel eet je vriend ongeveer?\" een ander aantal in en laat het recept opnieuw maken.' : '') +
          ' Verdeel de rest van het eten (bijvoorbeeld bijgerechten) in dezelfde verhouding.';
      }
      return 'Verdeling per maaltijd (hele maaltijd ± ' + v.maal + ' kcal; jouw doel ± ' + v.doel + ', uit ' + v.bron + '): jij ± ' + v.pct + '% (± ' + v.jij + ' kcal), je vriend de rest (± ' + v.hij + ' kcal).' + ex + ' Verdeel het gerecht in 10 gelijke delen (bijvoorbeeld met een lepel of schep) en neem er ' + v.delen + ', je vriend neemt er ' + v.rest + '.';
    }
    $('kcalDoel').addEventListener('input', function () { if (!$('rKcal').hidden) { $('btnKcal').click(); $('btnKcal').click(); } });
    // ---- v17: twee kaarten (jouw portie / zijn portie); calorieën pas na "Toon calorieën"
    function renderKaarten() {
      var box = $('rKaarten'); box.textContent = '';
      var v = (vriendMode && laatste) ? verdeling() : null;
      if (!v) { box.hidden = true; return; }
      var kcalAan = !$('rKcal').hidden, w = wie(), regels = { jij: [], hij: [] };
      var f = v.jij / v.maal, mt = v.maaltijden || 1;
      if (v.stuks) { regels.jij.push(v.stuks.jij + ' van de ' + v.stuks.n + ' ' + v.stuks.naam); regels.hij.push(v.stuks.hij + ' van de ' + v.stuks.n + ' ' + v.stuks.naam); }
      var best = null, bk = 0;
      laatste.ing.forEach(function (i) { if (w.mij.indexOf(i) >= 0 || i.p == null || typeof i.a !== 'number' || i.u !== 'g') return; var k = i.a * i.p; if (k > bk) { best = i; bk = k; } });
      if (best && bk / (v.maal * mt) >= 0.3) {
        var tot = best.a / mt, gj = Math.round(tot * f), gh = Math.round(tot) - gj;
        regels.jij.push(best.n.toLowerCase() + ': ± ' + gj + ' g'); regels.hij.push(best.n.toLowerCase() + ': ± ' + gh + ' g');
      }
      if (!v.stuks) { regels.jij.push('± ' + Math.round(f * 100) + '% van het gerecht'); regels.hij.push('± ' + (100 - Math.round(f * 100)) + '% van het gerecht'); }
      regels.jij.push('de rest (bijgerechten) in dezelfde verhouding'); regels.hij.push('de rest (bijgerechten) in dezelfde verhouding');
      var ex = v.extra ? v.extra.namen : '';
      [['Jouw portie', regels.jij, v.jij, ''], ['Zijn portie', regels.hij, v.hij + (v.extra ? v.extra.kcal : 0), ex]].forEach(function (c) {
        var d = document.createElement('div'); d.className = 'q'; d.style.cssText = 'background:var(--soft);color:var(--fg);margin-top:8px';
        var h = document.createElement('div'); h.style.fontWeight = '600'; h.textContent = c[0]; d.appendChild(h);
        c[1].forEach(function (t) { var p = document.createElement('div'); p.textContent = '• ' + t; d.appendChild(p); });
        if (c[3]) { var p2 = document.createElement('div'); p2.textContent = '• extra (apart): ' + c[3]; d.appendChild(p2); }
        if (kcalAan) { var p3 = document.createElement('div'); p3.className = 'sub'; p3.textContent = '± ' + c[2] + ' kcal' + (c[3] ? ' (met zijn extra\'s)' : ''); d.appendChild(p3); }
        box.appendChild(d);
      });
      var b = document.createElement('div'); b.className = 'sub'; b.style.marginTop = '4px'; b.textContent = 'Verdeeld volgens ' + v.bron + '.'; box.appendChild(b);
      box.hidden = false;
    }
    ['kcalDoel', 'ratioEigen'].forEach(function (id) { $(id).addEventListener('input', renderKaarten); });
    $('ratioKeuze').addEventListener('change', function () { $('ratioEigen').hidden = this.value !== 'eigen'; syncSnelVerhoog(); renderKaarten(); if (!$('rKcal').hidden) { $('btnKcal').click(); $('btnKcal').click(); } });
    function syncSnelVerhoog() {
      var k = $('ratioKeuze').value;
      Array.prototype.forEach.call(document.querySelectorAll('#snelVerhoogBlok [data-ratio]'), function (b) {
        b.setAttribute('aria-pressed', String(k === b.getAttribute('data-ratio')));
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll('#snelVerhoogBlok [data-ratio]'), function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-ratio');
        $('ratioKeuze').value = $('ratioKeuze').value === v ? 'auto' : v;
        $('ratioEigen').hidden = true;
        syncSnelVerhoog(); renderKaarten();
        if (!$('rKcal').hidden) { $('btnKcal').click(); $('btnKcal').click(); }
      });
    });
    syncSnelVerhoog();
    $('ratioEigen').addEventListener('input', function () { if (!$('rKcal').hidden) { $('btnKcal').click(); $('btnKcal').click(); } });
    $('btnKcal').addEventListener('click', function () { setTimeout(renderKaarten, 0); });
    $('rExtraLijst').addEventListener('change', renderKaarten);
    function kcalNu() {
      if (!laatste) return null;
      var w = wie(), tot = 0, open = 0;
      laatste.ing.forEach(function (i) {
        if (w.mij.indexOf(i) >= 0) return;
        if (i.p != null && typeof i.a === 'number') tot += i.a * i.p; else if (typeof i.a === 'number') open++;
      });
      return { tot: Math.round(tot), pp: laatstePorties ? Math.round(tot / laatstePorties) : null, open: open };
    }
    function vergelijkKcal(voor) {
      var na = kcalNu();
      if (!voor || !na || !voor.tot || !na.tot) return '';
      var d = na.tot - voor.tot, pct = Math.round(Math.abs(d) / voor.tot * 100);
      if (pct <= 3) return '';
      if (pct <= 10) return 'Calorieën: ± ' + voor.tot + ' kcal voor de aanpassing, ± ' + na.tot + ' erna (' + pct + '% ' + (d < 0 ? 'minder' : 'meer') + ').';
      return 'Let op: het recept komt nu op ± ' + na.tot + ' kcal in totaal uit, ' + pct + '% ' + (d < 0 ? 'minder' : 'meer') + ' dan daarvoor (± ' + voor.tot + ' kcal, een verschil van ± ' + Math.abs(d) + ' kcal). Klopt dat met wat je wilde? Zo niet, vraag Mistral om het aan te passen. Tik op Toon calorieën en kijk bij Bekijk per ingrediënt wat er verandert.';
    }
    function schemaNu() {
      var rr = laatsteRaw || {}, m = momentKeuze() || rr.past_bij, dag = dagKeuzeIdx();
      if (!(m && SCHEMA[m])) return null;
      var sm = SCHEMA[m][dag], eigen = m === 'lunch' ? lunchMax() : null;
      return { moment: m, dag: DAGEN[dag], dagTxt: dagTxt(), max: eigen || sm, schemaMax: sm, eigen: !!eigen };
    }
    $('btnDoe').addEventListener('click', function () {
      var v = $('vraag').value.trim();
      uitvoeren(this, async function () {
        if (!laatsteRaw) throw new Error('Lees eerst een recept in.');
        if (!v) throw new Error('Typ eerst wat je wilt vragen of laten aanpassen.');
        vriendMode = $('personen').value === 'vriend'; // v49-fix: vriendMode verversen bij "Doe dit"
        status('Mistral kijkt of dit een vraag of een wens is...');
        var kn = kcalNu(), sc = schemaNu(), hulp = '';
        if (kn && kn.pp != null) hulp = '\n\nHulp bij opmerkingen over te weinig of te veel (noem getallen alleen als de tekst daarover gaat): de pagina rekent nu ± ' + kn.pp + ' kcal per portie' + (kn.open ? ' (minstens: ' + kn.open + ' ingrediënt(en) tellen nog niet mee)' : '') + '.' + (sc && sc.max ? (sc.moment === 'avondeten' ? ' Het schema voor avondeten op ' + sc.dagTxt + ' is gemiddeld ± ' + sc.max + ' kcal per portie (in de praktijk ± ' + (sc.max - 75) + ' tot ' + (sc.max + 75) + '); het is geen maximum.' : (sc.eigen ? ' Mijn eigen maximum voor de lunch is ± ' + sc.max + ' kcal per portie (mijn schema voor lunch en middag samen is tot ± ' + (sc.schemaMax || '?') + ').' : ' Het schema voor ' + sc.moment + ' op ' + sc.dagTxt + ' is maximaal ± ' + sc.max + ' kcal per portie.')) : '');
        var tekst = 'Huidig recept (JSON):\n' + JSON.stringify(laatsteRaw) +
          '\n\nGekozen opties in de pagina: ' + $('keuzeTekst').textContent +
          ($('rKcal').hidden ? '' : '\n\nBerekening die nu op het scherm staat (met per ingrediënt wat het telt):\n' + $('rKcal').textContent) +
          ($('rPrijs').hidden ? '' : '\n\nPrijsberekening die nu op het scherm staat:\n' + $('rPrijs').textContent) +
          (vragenLijst.length ? '\n\nEerdere vragen en je antwoorden (oudste eerst):' + vragenLijst.map(function (q) { return '\nVraag: ' + q.v + '\nAntwoord: ' + q.a; }).join('') : '') +
          hulp + '\n\nTekst van de gebruiker: ' + v;
        var r = await gemini([{ text: tekst }], false, true, DOE_REGELS);
        var soort = String(r.soort || '').toLowerCase().trim();
        var rec = (r.recept && typeof r.recept === 'object' && Array.isArray(r.recept.ingredienten)) ? r.recept : null;
        var ant = String(r.antwoord || '').trim();
        if (!rec && Array.isArray(r.ingredienten)) { rec = r; soort = 'wens'; ant = ''; }
        var box = $('rAntwoord');
        if (rec && soort !== 'vraag') {
          if (!rec.porties && laatsteRaw.porties) rec.porties = laatsteRaw.porties;
          if (!rec.past_bij && laatsteRaw.past_bij) rec.past_bij = laatsteRaw.past_bij;
          if (!rec.naam && laatsteRaw.naam) rec.naam = laatsteRaw.naam;
          wijzMag = true;
          var vorige = handtekening(laatsteRaw), voorKcal = kcalNu(), voorIngr = laatsteRaw.ingredienten;
          toon(rec);
          var vg = vergelijkKcal(voorKcal), vi = ingVerschil(voorIngr, rec.ingredienten);
          if ($('uitkomst').hidden) return;
          if (handtekening(rec) === vorige) {
            box.textContent = 'Er is niets veranderd in de ingrediënten of de bereiding. Mistral zegt: ' + (ant || 'geen toelichting') + '\nTik op "Pas het recept aan" als je wilt dat het echt verandert, of formuleer je wens anders.';
            box.hidden = false; status('Het recept is niet veranderd.', true);
            return;
          }
          box.textContent = (ant ? 'Aangepast: ' + ant : 'Ik heb het recept aangepast. Kijk bij "Wat is er veranderd".') + (vg ? '\n' + vg : '') + (vi ? '\n' + vi : '');
          box.hidden = false;
          var wc = wensCheck(v);
          if (wc) box.textContent += '\n' + wc;
          status('Recept aangepast.');
          return;
        }
        if (!ant) throw new Error('Mistral gaf geen antwoord. Probeer het anders te zeggen.');
        if (soort === 'wens') ant += ' (Het recept is niet veranderd.)';
        box.textContent = ant; box.hidden = false;
        vragenLijst.push({ v: v, a: ant }); if (vragenLijst.length > 4) vragenLijst.shift();
        status('Antwoord klaar.');
      }, true);
    });
    $('vraag').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); if (!$('btnDoe').disabled) $('btnDoe').click(); }
    });

    $('btnKcal').addEventListener('click', function () {
      if (!laatste) return;
      var box = $('rKcal');
      if (!box.hidden) { box.hidden = true; this.textContent = 'Toon calorieën'; if (!$('rVW').hidden) renderVW(); return; }
      var tot = 0;
      var w = wie();
      laatste.ing.forEach(function (i) { if (w.mij.indexOf(i) >= 0) return; if (i.p != null && typeof i.a === 'number') tot += i.a * i.p; });
      var s = laatsteStat || { eigen: 0, geschat: 0, open: 0 };
      var txt = (s.open ? 'Minstens ' : '') + '± ' + Math.round(tot) + ' kcal in totaal';
      if (laatstePorties) txt += ' (± ' + Math.round(tot / laatstePorties) + ' per portie, bij ' + laatstePorties + (laatstePorties === 1 ? ' portie)' : ' porties)');
      txt += '.\nUit je eigen lijst: ' + s.eigen + ' ingrediënt(en). Geschat door AI, iets aan de hoge kant: ' + s.geschat + '.';
      txt += s.open ? ' Nog te schatten (tellen niet mee): ' + s.open + '.' : '';
      if (vriendMode) {
        txt += '\nDe extra\'s voor je vriend tellen niet mee.' + (w.mij.length ? ' Wat je als "niet voor mij" hebt aangegeven, is niet meegeteld.' : '');
        if (!verdeling()) txt += '\nVul hieronder in hoeveel calorieën jij voor deze maaltijd wilt (of kies een verhouding), dan toon ik de verdeling tussen jou en je vriend.';
      }
      var pp0 = laatstePorties ? Math.round(tot / laatstePorties) : null, rr = laatsteRaw || {};
      var vdd = vriendMode ? verdeling() : null;
      var pp = (vdd && vdd.stuks) ? vdd.jij : pp0;
      var eenP = (vdd && vdd.stuks) ? 'Jouw deel (' + vdd.stuks.jij + ' van de ' + vdd.stuks.n + ' ' + vdd.stuks.naam + ') is ± ' : 'Eén portie is ± ';
      if (rr.past_bij && pp != null) {
        var dag = dagKeuzeIdx(), mm = momentKeuze() || rr.past_bij, mx = SCHEMA[mm] ? SCHEMA[mm][dag] : null, eigen = mm === 'lunch' ? lunchMax() : null;
        if (eigen) {
          txt += '\nPast bij: lunch. Je eigen maximum voor de lunch is ± ' + eigen + '. ' + eenP + pp + ': ' + (pp <= eigen ? 'dat valt binnen je maximum (er blijft ± ' + (eigen - pp) + ' over).' : 'je zit ± ' + (pp - eigen) + ' erboven. Minder of niets mag altijd en het weekgemiddelde telt.');
          if (mx) txt += '\nJe schema voor lunch en middag samen op ' + dagTxt() + ' is tot ± ' + mx + '. Bij een lunch van ± ' + eigen + ' blijft er ± ' + Math.max(0, mx - eigen) + ' over voor de middag; met deze lunch (± ' + pp + ') is dat ± ' + Math.max(0, mx - pp) + '.';
        } else if (mx) {
          var samen = mm === 'lunch' ? ['lunch en middag samen', 'de middag'] : mm === 'ontbijt' ? ['ontbijt en tussendoor samen', 'het tussendoor'] : [mm, ''];
          var rest = function (v) { var r = mx - v; return r >= 0 ? 'blijft er ± ' + Math.round(r) + ' over' + (samen[1] ? ' voor ' + samen[1] : '') : 'zit je ± ' + Math.round(-r) + ' erboven'; };
          if (mm === 'avondeten') {
            var lo = mx - 75, hi = mx + 75;
            txt += '\nPast bij: avondeten. Je schema voor avondeten op ' + dagTxt() + ' is gemiddeld ± ' + mx + ' (de ene dag wat meer, de andere dag wat minder, in de praktijk ± ' + lo + ' tot ' + hi + '). ' + eenP + pp + (pp < lo ? ': dat is minder, en dat mag altijd.' : pp <= hi ? ': dat valt binnen je gemiddelde.' : ': iets meer dan je gemiddelde. Dat mag, het weekgemiddelde telt.');
          } else {
            txt += '\nPast bij: ' + mm + '. Je schema voor ' + samen[0] + ' op ' + dagTxt() + ': tot ± ' + mx + '. ' + eenP + pp + ': ' + rest(pp) + '.';
            if (pp > mx) txt += ' Minder of niets mag altijd en het weekgemiddelde telt.';
          }
        }
      }
      box.textContent = '';
      var hoofd = document.createElement('div'); hoofd.style.whiteSpace = 'pre-line'; hoofd.textContent = txt; box.appendChild(hoofd);
      var det = document.createElement('details'); det.className = 'per';
      var sm = document.createElement('summary'); sm.textContent = 'Bekijk per ingrediënt'; det.appendChild(sm);
      laatsteIng.forEach(function (x, k) {
        var rij = document.createElement('div'); rij.className = 'perrij';
        var kop = document.createElement('div'); kop.textContent = ingTekst(x) + (x.a === 'naar smaak' ? ' – naar smaak' : '');
        var sub = document.createElement('div'); sub.className = 'sub';
        var overslaan = w.mij.indexOf(laatste.ing[k]) >= 0;
        if (overslaan) sub.textContent = 'Niet voor mij: telt niet mee.';
        else if (x.p != null && typeof x.a === 'number') {
          sub.textContent = '± ' + Math.round(x.a * x.p) + ' kcal' + (x._als ? ' · uit je lijst (' + x._als + ')' : (x._est ? ' · geschat door ' + AINAAM + ': ' + String(x._g).replace('.', ',') + ' g in totaal à ' + String(x._k).replace('.', ',') + ' kcal per 100 g' : ''));
        } else sub.textContent = x.p === 0 ? 'Naar smaak: telt als 0 kcal.' : (typeof x.a === 'number' ? 'Telt niet mee (nog te schatten).' : 'Naar smaak: telt niet mee.');
        rij.appendChild(kop); rij.appendChild(sub); det.appendChild(rij);
      });
      box.appendChild(det);
      box.hidden = false; this.textContent = 'Verberg calorieën';
      if (!$('rVW').hidden) renderVW();
    });

    // ---- prijs
    function euro(x) { return '€ ' + (Math.round(x * 100) / 100).toFixed(2).replace('.', ','); }
    // ---- prijs: uit je eigen lijst "Mijn prijzen" (er wordt niets opgezocht)
    function prijzen() {
      return (Array.isArray(S.prijzen) ? S.prijzen : []).map(function (p) {
        if (!p) return null;
        return {
          n: p.n,
          prijs: (p.pr != null ? p.pr : (p.prijs != null ? p.prijs : 0)),
          inh: (p.inh != null ? p.inh : 1),
          eh: (p.u || p.eh || 'g'),
          opm: (p.bon != null ? 'bonus € ' + p.bon.toFixed(2).replace('.', ',') : (p.opm || ''))
        };
      }).filter(Boolean);
    }
    function inhTekst(e) { return e.eh === 'stuk' ? nl(e.inh) + ' stuks' : nl(e.inh) + ' ' + (e.eh || 'g'); }
    function stamNaam(t) { return schoon(t).replace(/tomaatjes?/g, 'tomaten'); }
    function matchNaam(en, t) {
      var tw = t.split(' ');
      var alles = en.split(' ').every(function (w) { return tw.some(function (z) { return z === w || (w.length >= 4 && z.indexOf(w) >= 0); }); });
      if (alles) return true;
      return t.length >= 4 && en.indexOf(t) >= 0;
    }
    function prijsVind(x) {
      var h = [stamNaam(x.n), stamNaam(x._als)].filter(Boolean), best = null;
      prijzen().forEach(function (e) {
        var en = stamNaam(e && e.n); if (!en) return;
        if (h.some(function (t) { return matchNaam(en, t); }) && (!best || en.length > stamNaam(best.n).length)) best = e;
      });
      return best;
    }
    function gramVan(x) {
      if (typeof x.a !== 'number') return null;
      if (x.u === 'g' || x.u === 'ml') return x.a;
      if (x._gram != null) return x._gram;
      var t = schoon(x.n);
      for (var i = 0; i < DB.length; i++) if (DB[i].re.test(t) && DB[i].conv && DB[i].conv[x.u] != null) return x.a * DB[i].conv[x.u];
      return null;
    }
    function prijsRegel(x) {
      var e = prijsVind(x); if (!e) return null;
      var inh = Number(e.inh), pr = Number(e.prijs);
      if (!(inh > 0) || !(pr > 0) || typeof x.a !== 'number') return { e: e, gebruik: null };
      var used = e.eh === 'stuk' ? (x.u === 'stuk' ? x.a : null) : gramVan(x);
      if (used == null) return { e: e, gebruik: null };
      return { e: e, gebruik: used / inh * pr, packs: Math.max(1, Math.ceil(used / inh - 0.0001)) };
    }
    function getalVeld(v) { var n = Number(String(v == null ? '' : v).replace('€', '').trim().replace(',', '.')); return isFinite(n) && n > 0 ? n : null; }
    function prijsBewaar(n, pr, inh, eh) {
      // v45b.7: zelfde vorm als bij Producten (pr, inh, u). Een bestaand product houdt al zijn andere gegevens (voedingswaarden, categorie, foto).
      if (!Array.isArray(S.prijzen)) S.prijzen = [];
      var ehLit = false, ehKilo = false;
      if (eh === 'l') { ehLit = true; eh = 'ml'; inh = Math.round(inh * 1000 * 1000) / 1000; } // v46.1: échte liter
      if (eh === 'kg') { ehKilo = true; eh = 'g'; inh = Math.round(inh * 1000 * 1000) / 1000; } // v47.3: kilo → gram met vlag
      var key = schoon(n);
      var ex = null; S.prijzen.forEach(function (e) { if (e && schoon(e.n) === key) ex = e; });
      if (ex) { ex.pr = pr; ex.inh = inh; ex.u = eh; ex.lit = ehLit; ex.kilo = ehKilo; } // v47.3
      else S.prijzen.push(cleanProd({ id: uid(), n: n, u: eh, lit: ehLit, kilo: ehKilo, inh: inh, pr: pr, bon: null, alias: [], w: {}, kc: null, cat: guessCats(n), foto: '' })); // v47.3: kilo-vlag
      persist();
    }
    function prijzenTekst() {
      var l = prijzen().filter(function (e) { return e && e.n && Number(e.prijs) > 0 && Number(e.inh) > 0; }).slice(0, 60);
      if (!l.length) return '';
      return ' PRODUCTEN DIE IK VAAK KOOP (met pakprijs): ' + l.map(function (e) { return e.n + ' (' + inhTekst(e) + ' voor ' + euro(Number(e.prijs)) + (e.opm ? ', ' + e.opm : '') + ')'; }).join('; ') + '. Gebruik zo\'n product alleen als het bij het gerecht past en noem het dan met precies de naam uit deze lijst. Staat een product er niet bij, kies dan zelf een gewoon product. Zet geen prijzen in het recept.';
    }
    var wisKey = null;
    function renderPrijzen() {
      var box = $('prijzenLijst'); if (!box) return;
      box.textContent = '';
      var l = prijzen();
      if (!l.length) { var leeg = document.createElement('div'); leeg.className = 'sub'; leeg.textContent = 'Je lijst is nog leeg. Vul hieronder een product in.'; box.appendChild(leeg); return; }
      l.forEach(function (e, i) {
        if (!e) return;
        var rij = document.createElement('div'); rij.className = 'perrij';
        var kop = document.createElement('div'); kop.textContent = e.n;
        var sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = inhTekst(e) + ' voor ' + euro(Number(e.prijs)) + (e.opm ? ' (' + e.opm + ')' : '');
        var rb = document.createElement('div'); rb.className = 'row';
        var b1 = document.createElement('button'); b1.type = 'button'; b1.className = 'btn'; b1.textContent = 'Pas aan';
        b1.addEventListener('click', function () { $('pnaam').value = e.n; $('pprijs').value = String(e.prijs).replace('.', ','); $('pinh').value = String(e.inh).replace('.', ','); $('peh').value = e.eh || 'g'; $('pnaam').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
        var b2 = document.createElement('button'); b2.type = 'button'; b2.className = 'btn'; b2.textContent = wisKey === i ? 'Zeker? Tik nog een keer' : 'Wis';
        b2.addEventListener('click', function () {
          if (wisKey !== i) { wisKey = i; renderPrijzen(); return; }
          wisKey = null; S.prijzen.splice(i, 1); persist(); renderPrijzen();
        });
        rb.appendChild(b1); rb.appendChild(b2);
        rij.appendChild(kop); rij.appendChild(sub); rij.appendChild(rb); box.appendChild(rij);
      });
    }
    if ($('pbewaar')) $('pbewaar').addEventListener('click', function () {
      var n = $('pnaam').value.trim().replace(/\s+/g, ' '), pr = getalVeld($('pprijs').value), inh = getalVeld($('pinh').value);
      if (!n) { status('Vul de naam van het product in.', true); return; }
      if (!pr || !inh) { status('Vul de prijs en de inhoud van het pak in (een getal groter dan 0).', true); return; }
      prijsBewaar(n, pr, inh, $('peh').value);
      ['pnaam', 'pprijs', 'pinh'].forEach(function (id) { $(id).value = ''; });
      renderPrijzen(); status('Prijs bewaard: ' + n + '.');
    });
    if ($('pleeg')) $('pleeg').addEventListener('click', function () { ['pnaam', 'pprijs', 'pinh'].forEach(function (id) { $(id).value = ''; }); });
    var tg = $('tabgem'); if (tg) tg.addEventListener('click', function () { renderPrijzen(); });
    renderPrijzen();

    $('btnPrijs').addEventListener('click', function () {
      if (!laatste) return;
      var box = $('rPrijs');
      if (!box.hidden && laatstePrijs) { box.hidden = true; this.textContent = 'Toon prijs'; return; }
      laatstePrijs = { items: laatsteIng.filter(function (x) { return x.a !== 'naar smaak'; }) };
      if (!laatstePrijs.items.length) { box.textContent = 'Er zijn geen ingrediënten met een hoeveelheid om een prijs voor uit te rekenen.'; box.hidden = false; return; }
      toonPrijs(); this.textContent = 'Verberg prijs';
    });
    function toonPrijs() {
      var box = $('rPrijs'), lp = laatstePrijs; box.textContent = '';
      var tot = 0, pakTot = 0, geteld = 0, rijen = [], duur = [], zonderPrijs = [];
      lp.items.forEach(function (x) {
        var r = prijsRegel(x), naam = ingTekst(x);
        if (!r) { zonderPrijs.push(x.n); rijen.push({ naam: naam, x: x, tekst: 'Geen prijs in je lijst.', vorm: true }); return; }
        if (r.gebruik == null) { rijen.push({ naam: naam, tekst: 'Staat in je lijst (' + r.e.n + ', ' + inhTekst(r.e) + ' voor ' + euro(Number(r.e.prijs)) + '), maar ik kan niet omrekenen hoeveel je ervan gebruikt. Telt niet mee. Pas de eenheid in je lijst aan (bijvoorbeeld stuks) of geef de hoeveelheid in gram.' }); return; }
        geteld++; tot += r.gebruik; pakTot += r.packs * Number(r.e.prijs); duur.push({ n: x.n, k: r.gebruik });
        rijen.push({ naam: naam, tekst: '± ' + euro(r.gebruik) + ' · uit je lijst: ' + r.e.n + ', ' + inhTekst(r.e) + ' voor ' + euro(Number(r.e.prijs)) + (r.e.opm ? ' (' + r.e.opm + ')' : '') });
      });
      var open = lp.items.length - geteld;
      var txt = geteld
        ? 'Ongeveer ' + euro(tot) + ' voor het recept' + (laatstePorties ? ' (± ' + euro(tot / laatstePorties) + ' per portie, bij ' + laatstePorties + (laatstePorties === 1 ? ' portie)' : ' porties)') : '') + '.\nBerekend uit je eigen prijzen in "Mijn prijzen", naar het deel dat in het recept zit. Koop je de hele pakken, dan kost dat ± ' + euro(pakTot) + '.\n' + geteld + ' van ' + lp.items.length + ' ingrediënten hebben een prijs in je lijst' + (open ? '; de rest telt niet mee. Voeg een prijs toe bij "Bekijk per ingrediënt".' : '.')
        : 'Nog geen prijzen uit je lijst voor dit recept. Voeg een prijs toe bij "Bekijk per ingrediënt", of vul "Mijn prijzen" aan.';
      if (zonderPrijs.length) txt += '\nGeen prijs in je lijst voor: ' + zonderPrijs.join(', ') + '. ' + (geteld ? 'Het bedrag hierboven is dus te laag. ' : '') + 'Voeg die prijzen toe bij "Bekijk per ingrediënt".';
      var hoofd = document.createElement('div'); hoofd.style.whiteSpace = 'pre-line'; hoofd.textContent = txt; box.appendChild(hoofd);
      var det = document.createElement('details'); det.className = 'per'; if (open) det.open = true;
      var sm = document.createElement('summary'); sm.textContent = 'Bekijk per ingrediënt'; det.appendChild(sm);
      rijen.forEach(function (r) {
        var rij = document.createElement('div'); rij.className = 'perrij';
        var kop = document.createElement('div'); kop.textContent = r.naam;
        var sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = r.tekst;
        rij.appendChild(kop); rij.appendChild(sub);
        if (r.vorm) {
          var x = r.x, f = document.createElement('div'); f.className = 'row'; f.style.marginTop = '6px';
          var ip = document.createElement('input'); ip.type = 'text'; ip.setAttribute('inputmode', 'decimal'); ip.autocomplete = 'off'; ip.placeholder = 'Prijs pak, bijv. 1,29'; ip.setAttribute('aria-label', 'Prijs van het pak in euro');
          var ii = document.createElement('input'); ii.type = 'text'; ii.setAttribute('inputmode', 'decimal'); ii.autocomplete = 'off'; ii.placeholder = 'Inhoud pak, bijv. 500'; ii.setAttribute('aria-label', 'Inhoud van het pak');
          var se = document.createElement('select'); se.setAttribute('aria-label', 'Eenheid van de inhoud');
          [['g', 'gram'], ['ml', 'milliliter'], ['l', 'liter'], ['stuk', 'stuks']].forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; se.appendChild(op); });
          if (x.u === 'stuk' && gramVan(x) == null) se.value = 'stuk';
          var kb = document.createElement('button'); kb.type = 'button'; kb.className = 'btn main'; kb.textContent = 'Bewaar in Mijn prijzen';
          kb.addEventListener('click', function () {
            var pr = getalVeld(ip.value), inh = getalVeld(ii.value);
            if (!pr || !inh) { status('Vul de prijs en de inhoud van het pak in.', true); return; }
            var nm = String(x._als || x.n).replace(/\s*\(.*?\)/g, '').trim() || String(x.n);
            prijsBewaar(nm, pr, inh, se.value); renderPrijzen(); toonPrijs(); status('Prijs bewaard in Mijn prijzen: ' + nm + '.');
          });
          f.appendChild(ip); f.appendChild(ii); f.appendChild(se); f.appendChild(kb); rij.appendChild(f);
        }
        det.appendChild(rij);
      });
      box.appendChild(det);
      var bud = budgetWaarde(), alle = open === 0, pp = (alle && laatstePorties) ? tot / laatstePorties : null;
      var bm = document.createElement('div'); bm.className = 'perrij'; bm.style.whiteSpace = 'pre-line';
      var dd = duur.sort(function (p, q) { return q.k - p.k; }).slice(0, 4);
      if (bud && pp != null) {
        if (pp > bud) bm.textContent = 'Je budget is ' + euro(bud) + ' per portie. Dit recept komt op ± ' + euro(pp) + ' per portie, dus ± ' + euro(pp - bud) + ' erboven.';
        else bm.textContent = 'Binnen je budget van ' + euro(bud) + ' per portie (± ' + euro(pp) + ').';
      } else if (bud) bm.textContent = 'De vergelijking met je budget kan pas als elk ingrediënt een prijs heeft.';
      if (dd.length) bm.textContent += (bm.textContent ? '\n' : '') + 'Duurste ingrediënten: ' + dd.map(function (d) { return d.n + ' (' + euro(d.k) + ')'; }).join(', ') + '.';
      var rb = document.createElement('div'); rb.className = 'row';
      [['Maak goedkoper', false, true], ['Maak goedkoper met diepvries', true, false]].forEach(function (x) {
        var kb = document.createElement('button'); kb.type = 'button'; kb.className = x[2] ? 'btn main' : 'btn'; kb.textContent = x[0];
        kb.addEventListener('click', function () { goedkoper(bud, pp, dd, x[1]); });
        rb.appendChild(kb);
      });
      bm.appendChild(rb);
      var hn = document.createElement('div'); hn.className = 'sub'; hn.textContent = 'Daarna tik je op "Toon prijs" om het nieuwe bedrag te zien (met je eigen prijzen, dus zonder zoekaanvraag).'; bm.appendChild(hn);
      box.insertBefore(bm, det);
      box.hidden = false;
    }
    function goedkoper(bud, pp, duur, diepvries) {
      var doel = (bud && pp != null && pp > bud) ? 'Maak dit recept goedkoper: mijn budget is ' + euro(bud) + ' per portie en het recept kost nu ± ' + euro(pp) + ' per portie.' :
        'Maak dit recept zo goedkoop als kan' + (pp != null ? ' (het kost nu ± ' + euro(pp) + ' per portie)' : '') + ', zonder dat het gerecht niet meer op het origineel lijkt.';
      $('vraag').value = doel +
        (duur.length ? ' De duurste ingrediënten zijn: ' + duur.map(function (d) { return d.n + ' (± ' + euro(d.k) + ')'; }).join(', ') + '.' : '') +
        ' Vervang dure ingrediënten door goedkopere gewone producten die goed bij het gerecht passen (bijvoorbeeld panga of koolvis in plaats van duurdere vis; noem de soort bij naam, dus "panga" of "koolvis" en niet alleen "witvis")' +
        (diepvries ? ' Diepvries mag, zoals vis, garnalen, zalm of groente (bijvoorbeeld bloemkool of spinazie), als dat goedkoper is. Zet "diepvries" in de naam van een ingrediënt dat je diepvries neemt. Beschrijf in de bereiding precies wat je met elk diepvriesproduct doet: eerst ontdooien (in de koelkast of in een afgesloten zak in koud water), daarna goed droog deppen met keukenpapier (anders komt er vocht in de saus of schotel), en in welke stap het erbij gaat. Gebruik geen vage verzamelnaam zoals "de visschotelmix", maar noem de vis en de garnalen apart.' : ' Gebruik geen diepvriesproducten, alleen gewone verse of gewone verpakte producten.') +
        ' Haal nooit vlees, vis of een ander eiwitrijk ingrediënt weg en halveer het niet om te besparen: kies een goedkopere soort, een goedkoper alternatief met evenveel eiwit, of bespaar op andere ingrediënten. Houd de calorieën en het eiwit per portie zo veel mogelijk gelijk. Haal eiwitpoeder alleen weg als je het eiwit op een andere manier terugbrengt (bijvoorbeeld met kwark), en vervang fruit door iets met een vergelijkbare hoeveelheid suiker (bijvoorbeeld meer diepvriesfruit, banaan of appel in plaats van rozijnen). Noem in wijzigingen het verschil in calorieën en in eiwit, als getal in gram. Voeg extra kruiden of smaakmakers toe als de smaak daardoor minder wordt. Gebruik geen ingrediënten van de lijstjes "Lust niet". Pas de bereiding aan waar dat nodig is. Zet in "wijzigingen" wat je hebt veranderd en waarom.';
      $('btnPasaan').click();
    }

    function nl(x) { return String(Math.round(x * 100) / 100).replace('.', ','); }

    // ---- "niet voor hem / niet voor mij" en export
    function wie() {
      var r = { hem: [], mij: [], mijIdx: [] };
      Array.prototype.forEach.call(document.querySelectorAll('#rIng select.wie'), function (s) {
        var idx = +s.getAttribute('data-k'), i = laatste && laatste.ing[idx];
        if (i && s.value) { r[s.value].push(i); if (s.value === 'mij') r.mijIdx.push(idx); }
      });
      return r;
    }
    // Het recept in de vorm waarin de Eetweek-app het bewaart. Per portie rekent de app straks: hele recept / aantal porties.
    function recObj() {
      var w = wie(), notes = [], gekozen = [];
      var ing = [];
      laatsteIng.forEach(function (x, idx) {
        if (w.mijIdx.indexOf(idx) >= 0) return;
        var o = { n: x.n, a: x.a, u: x.uo, p: x.p };
        if (x._est) o.est = true;
        ing.push(o);
      });
      var steps = laatste.steps || '';
      if (w.hem.length) notes.push('Niet voor hem: ' + w.hem.map(function (i) { return i.n; }).join(', ') + '.');
      if (w.mij.length) notes.push('Niet voor mij (niet meegeteld in mijn calorieën, hij eet ze wel): ' + w.mij.map(function (i) { return i.n; }).join(', ') + '.');
      if (notes.length) steps = (steps ? steps + '\n' : '') + notes.join('\n');
      Array.prototype.forEach.call(document.querySelectorAll('#rExtraLijst input:checked'), function (c) { var x = laatsteExtra[+c.getAttribute('data-k')]; if (x) gekozen.push(ingTekst(x)); });
      if (gekozen.length) steps = (steps ? steps + '\n' : '') + 'Extra voor mijn vriend (telt niet mee voor mij): ' + gekozen.join(', ') + '.';
      var vd = verdeling();
      if (vd) steps = (steps ? steps + '\n' : '') + (vd.stuks ? 'Verdelen: van de ' + vd.stuks.n + ' ' + vd.stuks.naam + ' neem jij er ' + vd.stuks.jij + ' en je vriend er ' + vd.stuks.hij + (vd.maaltijden > 1 ? ' (dit geldt per maaltijd)' : '') + '.' : 'Verdelen: deel het gerecht in 10 gelijke delen. Jij neemt ' + vd.delen + ' delen, je vriend ' + vd.rest + ' delen' + (vd.maaltijden > 1 ? ' (dit geldt per maaltijd)' : '') + '.');
      var rec = { name: laatste.name, ing: ing };
      if (steps) rec.steps = steps;
      if (laatstePorties && laatstePorties > 1) rec.por = laatstePorties;
      return rec;
    }
    function json() { return JSON.stringify(recObj(), null, 2); }
    $('btnKopieer').addEventListener('click', function () {
      if (!laatste) return;
      var klaar = function () { status('Gekopieerd. Dit is het recept in het formaat van je app.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json()).then(klaar, function () { status('Kopiëren lukte niet. Gebruik "Bewaar als bestand".', true); });
      else status('Kopiëren lukte niet. Gebruik "Bewaar als bestand".', true);
    });
    $('btnDownload').addEventListener('click', function () {
      if (!laatste) return;
      var a = document.createElement('a'), n = 'recept_' + laatste.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '.json';
      a.href = URL.createObjectURL(new Blob([json()], { type: 'application/json' })); a.download = n;
      document.body.appendChild(a); a.click(); a.remove();
      status('Bewaard als ' + n + '.');
    });

    // ---- bewaren in Recepten: eerst een voorbeeld, pas opgeslagen na jouw OK
    var gbWhere = [];
    function schoonNaam(t) { return String(t || '').replace(/[\^@-\^_\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60); }
    function uniekeNaam(n) {
      var base = n, k = 2;
      function bestaat(x) { return S.recipes.some(function (r) { return String(r.name).toLowerCase() === x.toLowerCase(); }); }
      while (bestaat(n)) { n = base + ' (' + k + ')'; k++; }
      return n;
    }
    function gBewaarOpen() {
      if (!laatste) return;
      var rec = recObj(), box = $('gBewaar');
      if (!rec.ing.length) { status('Er zijn geen ingrediënten om te bewaren.', true); return; }
      var pb = laatsteRaw && laatsteRaw.past_bij, g0 = PAST_NAAR_GROEP[pb];
      gbWhere = g0 ? [g0] : [];
      box.textContent = '';
      var h = document.createElement('h2'); h.textContent = 'Bewaren in mijn recepten?'; box.appendChild(h);
      var hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'Dit is het voorbeeld. Er wordt pas iets bewaard als je hieronder op "Ja, bewaar" tikt.'; box.appendChild(hint);
      var lb = document.createElement('label'); lb.setAttribute('for', 'gbNaam'); lb.textContent = 'Naam'; box.appendChild(lb);
      var inp = document.createElement('input'); inp.type = 'text'; inp.id = 'gbNaam'; inp.maxLength = 60; inp.autocomplete = 'off'; inp.value = uniekeNaam(schoonNaam(rec.name) || 'Recept'); box.appendChild(inp);
      var lw = document.createElement('label'); lw.textContent = 'Waar wil je dit recept zien? (meerdere mag; niets = bij elk moment)'; box.appendChild(lw);
      var pills = document.createElement('div'); pills.className = 'row'; pills.id = 'gbWaar';
      RGROUPS.forEach(function (g) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = g.t; b.setAttribute('data-w', g.id);
        b.setAttribute('aria-pressed', String(gbWhere.indexOf(g.id) >= 0));
        b.style.cssText = gbWhere.indexOf(g.id) >= 0 ? 'background:var(--accent);color:var(--on-accent);border-color:var(--accent)' : '';
        b.addEventListener('click', function () {
          var i = gbWhere.indexOf(g.id); if (i >= 0) gbWhere.splice(i, 1); else gbWhere.push(g.id);
          var on = gbWhere.indexOf(g.id) >= 0; b.setAttribute('aria-pressed', String(on));
          b.style.cssText = on ? 'background:var(--accent);color:var(--on-accent);border-color:var(--accent)' : '';
        });
        pills.appendChild(b);
      });
      box.appendChild(pills);
      var por = document.createElement('p'); por.className = 'hint';
      por.textContent = rec.por ? 'Recept voor ' + rec.por + ' porties. In de week kies je 1 portie, een halve portie of een eigen hoeveelheid.' : 'Recept voor 1 portie.';
      box.appendChild(por);
      var ul = document.createElement('ul'); ul.className = 'ing';
      rec.ing.forEach(function (x) {
        var li = document.createElement('li'); li.textContent = ingTekst({ a: x.a, uo: x.u, n: x.n }) + (x.est ? ' (geschat door ' + AINAAM + ')' : '') + (x.p == null ? ' (telt niet mee)' : '');
        ul.appendChild(li);
      });
      box.appendChild(ul);
      if (rec.steps) { var st = document.createElement('p'); st.className = 'hint'; st.textContent = 'Met bereiding (' + rec.steps.split('\n').filter(Boolean).length + ' regels).'; box.appendChild(st); }
      var rij = document.createElement('div'); rij.className = 'row';
      var ja = document.createElement('button'); ja.type = 'button'; ja.className = 'btn main'; ja.id = 'gbJa'; ja.textContent = 'Ja, bewaar';
      var nee = document.createElement('button'); nee.type = 'button'; nee.className = 'btn'; nee.id = 'gbNee'; nee.textContent = 'Niet bewaren';
      rij.appendChild(ja); rij.appendChild(nee); box.appendChild(rij);
      ja.addEventListener('click', function () { gBewaarSave(rec); });
      nee.addEventListener('click', function () { box.hidden = true; });
      box.hidden = false;
      if (box.scrollIntoView) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    function gBewaarSave(rec) {
      var nm = schoonNaam($('gbNaam').value);
      if (!nm) { toast('Geef het recept een naam'); return; }
      var nr = { id: uid(), name: uniekeNaam(nm), ing: rec.ing };
      if (rec.steps) nr.steps = rec.steps;
      if (rec.por) nr.por = rec.por;
      var wh = RGROUPS.map(function (g) { return g.id; }).filter(function (x) { return gbWhere.indexOf(x) >= 0; });
      if (wh.length) nr.where = wh;
      S.recipes.push(nr);
      persist(); $('gBewaar').hidden = true; toast('Bewaard bij Recepten'); laatsteBewaard = true; sessieBewaar();
      status('Bewaard als "' + nr.name + '". Je vindt het bij het tabblad Recepten.');
    }
    $('btnBewaar').addEventListener('click', gBewaarOpen);

    // ---- v16: voedingswaarden (los van de calorieën) en kopieerknoppen
    var VW_BEKEND = {
      'Cottage cheese': [12, 3.5, 2.2, 2.8, 2.8, 0, 0.6],
      'Witte bonen in tomatensaus (blik)': [4.6, 0.7, 0.2, 13, 4.2, 5.1, 0.6]
    };
    function r1(x) { return String(Math.round(x * 10) / 10).replace('.', ','); }
    function vwTekst(v) {
      return 'eiwit ± ' + r1(v[0]) + ' g, vet ± ' + r1(v[1]) + ' g (waarvan verzadigd ' + r1(v[2]) + ' g), koolhydraten ± ' + r1(v[3]) + ' g (waarvan suikers ' + r1(v[4]) + ' g), vezels ± ' + r1(v[5]) + ' g, zout ± ' + r1(v[6]) + ' g';
    }
    function vwVan(x) {
      if (x._als && VW_BEKEND[x._als]) return { v: VW_BEKEND[x._als], bron: 'uit het etiket (AH)' };
      if (x._vw) return { v: x._vw, bron: 'geschat door ' + AINAAM };
      return null;
    }
    function renderVW() {
      var box = $('rVW'); if (!laatste) return;
      var w = wie(), kcalAan = !$('rKcal').hidden, tot = [0, 0, 0, 0, 0, 0, 0], geteld = 0, totaalItems = 0, rijen = [];
      laatsteIng.forEach(function (x, k) {
        if (x.a === 'naar smaak' || x.p === 0) return;
        totaalItems++;
        var naam = ingTekst(x);
        if (w.mij.indexOf(laatste.ing[k]) >= 0) { rijen.push([naam, 'Niet voor mij: telt niet mee.']); return; }
        var g = gramVan(x), vw = vwVan(x);
        if (g == null || !vw) { rijen.push([naam, 'Geen voedingswaarden bekend: telt niet mee.']); return; }
        var f = g / 100, vals = vw.v.map(function (q) { return q * f; });
        vals.forEach(function (q, i) { tot[i] += q; }); geteld++;
        var kc = (kcalAan && x.p != null && typeof x.a === 'number') ? ' · ± ' + Math.round(x.a * x.p) + ' kcal' : '';
        rijen.push([naam, vwTekst(vals) + kc + ' · ' + vw.bron]);
      });
      box.textContent = '';
      var por = laatstePorties && laatstePorties > 1 ? laatstePorties : 0;
      var txt = 'Voedingswaarden van het hele recept: ' + vwTekst(tot) + '.';
      if (por) txt += '\nPer portie (bij ' + por + ' porties): ' + vwTekst(tot.map(function (q) { return q / por; })) + '.';
      if (kcalAan) { var kn = kcalNu(); if (kn) txt += '\nCalorieën: ± ' + kn.tot + ' kcal in totaal' + (kn.pp != null ? ' (± ' + kn.pp + ' per portie)' : '') + '.'; }
      txt += '\n' + geteld + ' van ' + totaalItems + ' ingrediënten hebben voedingswaarden' + (geteld < totaalItems ? '; de rest telt niet mee, dus de getallen zijn minimaal' : '') + '. Waarden "geschat door ' + AINAAM + '" zijn een richtlijn, geen etiket.';
      var hoofd = document.createElement('div'); hoofd.style.whiteSpace = 'pre-line'; hoofd.textContent = txt; box.appendChild(hoofd);
      var det = document.createElement('details'); det.className = 'per';
      var sm = document.createElement('summary'); sm.textContent = 'Bekijk per ingrediënt'; det.appendChild(sm);
      rijen.forEach(function (r) {
        var rij = document.createElement('div'); rij.className = 'perrij';
        var kop = document.createElement('div'); kop.textContent = r[0];
        var sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = r[1];
        rij.appendChild(kop); rij.appendChild(sub); det.appendChild(rij);
      });
      box.appendChild(det); box.hidden = false;
    }
    $('btnVW').addEventListener('click', function () {
      if (!laatste) return;
      var box = $('rVW');
      if (!box.hidden) { box.hidden = true; this.textContent = 'Toon voedingswaarden'; return; }
      renderVW(); this.textContent = 'Verberg voedingswaarden';
    });
    $('btnKopPrijs').addEventListener('click', function () {
      if (!laatste) return;
      var items = laatsteIng.filter(function (x) { return x.a !== 'naar smaak' && !nulKcal(schoon(x.n)); });
      var tot = 0, geteld = 0, lines = [];
      items.forEach(function (x) {
        var r = prijsRegel(x), naam = ingTekst(x);
        if (r && r.gebruik != null) { tot += r.gebruik; geteld++; lines.push(naam + ', ± ' + euro(r.gebruik)); } else lines.push(naam + ', geen prijs in mijn lijst');
      });
      var txt = laatste.name + '\n' + lines.join('\n');
      if (geteld) txt += '\nTotaal ± ' + euro(tot) + (laatstePorties && laatstePorties > 1 ? ' (± ' + euro(tot / laatstePorties) + ' per portie, bij ' + laatstePorties + ' porties)' : '') + (geteld < items.length ? ', zonder de ingrediënten zonder prijs' : '');
      copyDirect(txt, 'prijs', 'Ingrediënten met prijs', 'Houd de tekst ingedrukt en kies Kopiëren.');
    });
    if ($('pkopieer')) $('pkopieer').addEventListener('click', function () {
      var l = prijzen().filter(function (e) { return e && e.n; });
      if (!l.length) { status('Je lijst met prijzen is nog leeg.', true); return; }
      copyDirect(l.map(function (e) { return e.n + ', ' + inhTekst(e) + ', ' + euro(Number(e.prijs)) + (e.opm ? ' (' + e.opm + ')' : ''); }).join('\n'), 'prijzen', 'Mijn prijzen', 'Houd de tekst ingedrukt en kies Kopiëren.');
    });
    $('btnStuks').addEventListener('click', function () {
      $('vraag').value = 'Maak dit recept voor in totaal ' + this.dataset.n + ' ' + this.dataset.naam + ': mijn vriend eet er ' + this.dataset.hij + ' en ik 1. Pas de hoeveelheden en de bereiding aan (het aantal stuks moet overal kloppen) en laat de rest zoals het is.';
      $('btnPasaan').click();
    });
    $('btnWens').addEventListener('click', function () {
      $('vraag').value = 'Maak één portie van dit recept maximaal ' + this.dataset.n + ' kcal. De app rekent nu ± ' + this.dataset.v + ' kcal per portie. Verlaag de hoeveelheden van de ingrediënten die het meest bijdragen (houd het gerecht zoals het is, haal geen eiwitrijk ingrediënt weg) en zeg in "wijzigingen" wat je hebt verlaagd.';
      $('btnPasaan').click();
    });
    $('rExtraLijst').addEventListener('change', function () { if (!$('rKcal').hidden) { $('btnKcal').click(); $('btnKcal').click(); } });
    $('apMagn').addEventListener('change', keuzeRegel);
    $('apOven').addEventListener('change', keuzeRegel);

    // ---- sub-tabbladen van het Mistral-tabblad
    var gtabs = document.querySelectorAll('.gtabs button');
    Array.prototype.forEach.call(gtabs, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(gtabs, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        ['aanpassen', 'foto'].forEach(function (t) { $('pane-' + t).hidden = t !== b.getAttribute('data-gtab'); });
        status('');
      });
    });
    APP.renderCat = renderCat;
    renderCat();
    sessieHerstel();
  
    // Snelhulp vermoeidheid & weinig trek: elke knop geeft nu 3 recepten als kaartjes
    var GEMTIP_WENS = {
      moe: 'heel zacht, compact en licht gerecht dat makkelijk weg te eten is zonder veel kauwwerk',
      pan: 'een lichte maaltijd in één pan of één schaal, met groente en eiwit',
      kwark: 'zacht en fris, bijvoorbeeld kwark met banaan en havermout',
      ei: 'licht en zacht met ei, vriendelijk voor de maag'
    };
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-gemtip]');
      if (!b) return;
      var t = b.getAttribute('data-gemtip');
      if (!GEMTIP_WENS[t]) return;
      kaart.wens = GEMTIP_WENS[t];
      kOpen('snelhulp');
      kVraag();
    });

    // Tekst & vertaal tips
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-teksttip]');
      if (!b) return;
      var t = b.getAttribute('data-teksttip');
      var ta = $('invoer');
      var cb = $('makkelijkT');
      if (cb) cb.checked = true;
      if (t === 'engels') {
        window._tekstEngels = true; window._tekstMinderCal = true; window._tekstZachter = false; // v49-fix: vlaggen zetten zodat goTekst de extra prompt echt meekrijgt
        ta.placeholder = 'Plak hier de Engelse tekst of link van het recept. Mistral vertaalt het naar het Nederlands, past de calorieën aan naar je schema en koppelt Nederlandse supermarktprijzen!';
        toast('Engels vertalen actief! Plak de tekst of link en tik op Recept inlezen');
      } else if (t === 'zachter') {
        window._tekstZachter = true; window._tekstEngels = false; // v49-fix
        toast('Zachter & lichter verteerbaar aangezet');
      } else if (t === 'mindercal') {
        window._tekstMinderCal = true; window._tekstEngels = false; window._tekstZachter = false; // v49-fix
        toast('Calorieën verlagen naar schema aangezet');
      }
      ta.focus();
    });

    // Recepten dropdown in Aanpassen
    function updateMistralReceptenDropdown() {
      var sel = $('kiesReceptAanpas'); // v58.7: alleen de Aanpassen-kiezer; het Voorbereiden-blok heeft geen recepten-kiezer meer (🧺 op het kaartje is de ingang)
      var cur = sel ? sel.value : '';
      if (sel) sel.innerHTML = '<option value="">-- Kies uit Mijn Recepten --</option>';
      (S.recipes || []).forEach(function (r) {
        var opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name + (r.por > 1 ? ' (' + r.por + ' porties)' : '');
        if (sel) sel.appendChild(opt);
      });
      if (sel && cur) sel.value = cur;
    }

    // ---- v58: Voorbereiden-blok — afvinkrondjes bij de ingrediënten uit het eigen recept (geen Mistral)
    function vrRender() {
      var lijst = $('vrLijst'); if (!lijst) return;
      var r = (S.recipes || []).filter(function (x) { return x.id === S.vrRec; })[0];
      var welk = $('vrWelk');
      if (!r) { lijst.innerHTML = ''; if (welk) welk.hidden = false; return; }
      if (welk) welk.hidden = true;
      S.vrChecks = S.vrChecks || {}; var ck = S.vrChecks[r.id] = S.vrChecks[r.id] || {};
      var rows = (r.ing || []).map(function (i, idx) {
        var as = typeof i.a === 'number' ? fmtN(i.a) : String(i.a == null ? '' : i.a);
        var qty = i.u === 'x' ? as + '×' : (as + (i.u ? ' ' + i.u : '')); // v58.1: hoeveelheid rechts op de regel
        return '<div class="vrrow' + (ck[idx] ? ' gedaan' : '') + '" data-act="vrtoggle" data-r="' + r.id + '" data-i="' + idx + '" role="checkbox" aria-checked="' + (ck[idx] ? 'true' : 'false') + '"><span class="vrmark" aria-hidden="true"></span><span class="vrtxt">' + esc(cleanIngName(i.n)) + '</span><span class="vrqty">' + esc(qty) + '</span></div>';
      }).join('');
      lijst.innerHTML = (rows ? '<div style="margin-top:10px"><b>' + esc(recEmoji(r) + ' ' + r.name) + '</b><p class="hint small" style="margin:2px 0 6px">Vink af wat je klaarlegt (hoeveelheden van het recept):</p>' + rows + '</div>' : '') +
        (hasSteps(r) ? '<button class="btn" style="width:100%;margin-top:10px" data-act="cook" data-r="' + r.id + '">🍳 Start met koken</button>' : '');
    }
    window.vrRender = vrRender;
    // v58 multi-page: na een sprong vanaf recepten.html staat het recept-id in sessionStorage
    try { var vrH = sessionStorage.getItem('eetweek.vrRec'); if (vrH) { sessionStorage.removeItem('eetweek.vrRec'); if ((S.recipes || []).some(function (x) { return x.id === vrH; })) { S.vrRec = vrH; var khv = $('khGroepVoorbereiden'); if (khv) khv.open = true; } } } catch (e) {}

    // v58: sprong vanaf het kaartje (🧺 Voorbereiden) — zelfde patroon als mistralAanpas: juiste tab, juiste blok open, recept voor-ingeschakeld
    window.mistralVoorbereiden = function (rid) {
      var r = (S.recipes || []).filter(function (x) { return x.id === rid; })[0];
      if (!r) return;
      S.tab = 'gem'; APP.render(); window.scrollTo(0, 0);
      var kh = $('khGroepVoorbereiden'); if (kh) kh.open = true;
      S.vrRec = rid; // v58.7: geen kiezer meer — direct de afvinklijst van dit recept
      vrRender();
      setTimeout(function () { var p = $('khGroepVoorbereiden'); if (p && p.scrollIntoView) p.scrollIntoView(); }, 50);
    };

    // ---- v30: 3 kaartjes met een +. Snelhulp (met recept) en Iets snels nu (zonder recept).
    var kaart = { modus: 'snelhulp', ideeen: [], bezig: false, el: null, mom: '', snel: false, nood: false, meer: false, wens: '', gezien: [], thuis: false, struct: '' };
    function kEl(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function kWeekDagen() {
      var out = [], vandaag = APP.fmtId(new Date());
      for (var i = 0; i < 7; i++) { var dt = APP.addDays(S.start, i); out.push({ id: APP.fmtId(dt), dow: dt.getDay(), t: APP.cap(APP.DOW[dt.getDay()]) + ' ' + dt.getDate() + '/' + (dt.getMonth() + 1), vandaag: APP.fmtId(dt) === vandaag }); }
      return out;
    }
    function kMomenten(dag) {
      return APP.momentsFor(dag.dow, S.days[dag.id] || null).filter(function (m) { return m.slot !== 'move' && m.slot !== 'eod'; });
    }
    function kSluit() { if (kaart.el) { kaart.el.remove(); kaart.el = null; } document.documentElement.classList.remove('lock'); }
    function kOpen(modus) {
      kSluit();
      kaart.modus = 'snelhulp'; kaart.ideeen = []; kaart.mom = ''; kaart.wens = ''; kaart.gezien = [];
      var ov = kEl('div'); ov.id = 'kaartSheet'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
      ov.style.cssText = 'position:fixed;inset:0;z-index:60;background:var(--scrim);display:flex;align-items:flex-end;justify-content:center';
      var bl = kEl('div'); bl.style.cssText = 'background:var(--bg,var(--surface));color:inherit;width:100%;max-width:640px;max-height:92vh;overflow:auto;border-radius:16px 16px 0 0;padding:14px 14px 22px;box-sizing:border-box';
      ov.appendChild(bl); kaart.el = ov; kaart.bl = bl;
      document.body.appendChild(ov); document.documentElement.classList.add('lock');
      ov.addEventListener('click', function (ev) { if (ev.target === ov) kSluit(); });
      kTeken();
    }
    function kTeken() {
      var bl = kaart.bl; bl.textContent = '';
      var kop = kEl('div'); kop.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px';
      kop.appendChild(kEl('h2', '', '💡 3 ideeën')); kop.firstChild.style.margin = '0';
      var x = kEl('button', 'btn', 'Sluiten'); x.type = 'button'; x.id = 'kaartSluit'; x.style.minHeight = '44px'; x.addEventListener('click', kSluit); kop.appendChild(x); bl.appendChild(kop);
      // keurnotitie 4 (8 nov): de hulp staat IN de kaart — korte zin open, lange zin achter rondje-i
      var z1 = kEl('p', 'hint', 'Kies hooguit één ding tegelijk: 🚨 nu eetbaar zonder koken, ⚡ weinig werk, 🏠 alleen uit je voorraad.'); z1.style.margin = '8px 0 0'; bl.appendChild(z1);
      var z2 = kEl('p', 'hint', '🚨 en ⚡ tikken elkaar uit. Alle knoppen gaan naar hetzelfde scherm, met een ander filter.'); z2.style.margin = '4px 0 0'; bl.appendChild(z2);
      // v45b.3: rustige hoofdrij — alleen 🚨 Nood, ⚡ Snel en 🏠 In huis; de rest zit achter "Meer filters"
      var hoofdrij = kEl('div', 'row'); hoofdrij.style.cssText = 'margin-top:8px;display:flex;flex-wrap:wrap;gap:8px';
      var bNood = kEl('button', 'pill vlak-knop', '🚨 Nood (nu eetbaar)'); bNood.type = 'button'; bNood.setAttribute('aria-pressed', String(kaart.nood)); bNood.title = 'Alleen dingen die je nu kunt eten — zonder koken, bakken of afkoelen';
      bNood.addEventListener('click', function () { kaart.nood = !kaart.nood; if (kaart.nood) kaart.snel = false; kaart.ideeen = []; kaart.gezien = []; kTeken(); }); hoofdrij.appendChild(bNood);
      var bSnel = kEl('button', 'pill vlak-knop', '⚡ Snel (weinig werk)'); bSnel.type = 'button'; bSnel.setAttribute('aria-pressed', String(kaart.snel)); bSnel.title = 'Recepten met jouw ⚡-vinkje, of recepten/producten die de app snel vindt';
      bSnel.addEventListener('click', function () { kaart.snel = !kaart.snel; if (kaart.snel) kaart.nood = false; kaart.ideeen = []; kaart.gezien = []; kTeken(); }); hoofdrij.appendChild(bSnel);
      var bThuis = kEl('button', 'pill vlak-knop', '🏠 Alleen wat ik in huis heb'); bThuis.type = 'button'; bThuis.setAttribute('aria-pressed', String(kaart.thuis));
      bThuis.addEventListener('click', function () { kaart.thuis = !kaart.thuis; kaart.ideeen = []; kaart.gezien = []; kTeken(); }); hoofdrij.appendChild(bThuis);
      bl.appendChild(hoofdrij);
      // v45b.3: overige filters (momenten + structuur) achter een uitklapknopje — niets verdwijnt
      var meerDet = kEl('details'); meerDet.style.cssText = 'margin-top:6px';
      if (kaart.meer) meerDet.open = true;
      var sum = kEl('summary', '', 'Meer filters ' + (kaart.meer ? '▴' : '▾')); sum.style.cssText = 'cursor:pointer;min-height:44px;display:flex;align-items:center';
      meerDet.appendChild(sum);
      var meerBl = kEl('div'); meerBl.style.cssText = 'padding-top:6px';
      var momRij = kEl('div', 'row'); momRij.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
      var momButtons = [{ id: '', t: 'Alle momenten' }, { id: 'opst', t: 'Bij opstaan' }].concat(APP.RGROUPS.map(function (g) { return { id: g.id, t: g.t }; }));
      momButtons.forEach(function (m) {
        var b = kEl('button', 'pill vlak-knop', m.t); b.type = 'button'; b.setAttribute('aria-pressed', String(kaart.mom === m.id));
        b.addEventListener('click', function () { kaart.mom = m.id; kaart.ideeen = []; kaart.gezien = []; kTeken(); }); momRij.appendChild(b);
      });
      meerBl.appendChild(momRij);
      var structRij = kEl('div'); structRij.style.cssText = 'margin-top:6px;display:flex;flex-wrap:wrap;gap:8px';
      [{ id: '', t: 'Structuur: alles' }, { id: 'drinkbaar', t: 'Drinkbaar' }, { id: 'zacht', t: 'Zacht' }, { id: 'knapperig', t: 'Knapperig' }].forEach(function (st) {
        var sb = kEl('button', 'pill vlak-knop', st.t); sb.type = 'button'; sb.setAttribute('aria-pressed', String(kaart.struct === st.id));
        sb.addEventListener('click', function () { kaart.struct = st.id; kaart.ideeen = []; kaart.gezien = []; kTeken(); });
        structRij.appendChild(sb);
      });
      meerBl.appendChild(structRij);
      meerDet.appendChild(meerBl);
      meerDet.addEventListener('toggle', function () { kaart.meer = meerDet.open; sum.textContent = 'Meer filters ' + (kaart.meer ? '▴' : '▾'); });
      bl.appendChild(meerDet);
      bl.appendChild(kEl('p', 'hint small', 'Drie ideeën uit je eigen recepten. Kies eventueel een moment, of typ hieronder waar je zin in hebt.'));
      var lb = kEl('label', '', 'Waar heb je zin in? (hoeft niet, bijvoorbeeld ei of kwark)'); lb.setAttribute('for', 'kaartWens'); bl.appendChild(lb);
      var inp = kEl('input'); inp.type = 'text'; inp.id = 'kaartWens'; inp.maxLength = 200; inp.autocomplete = 'off'; inp.placeholder = 'Een woord uit de naam of de ingrediënten'; inp.style.cssText = 'width:100%;min-height:48px;box-sizing:border-box;font-size:16px;padding:0 10px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:inherit'; inp.value = kaart.wens || '';
      inp.value = kaart.wens || ''; inp.addEventListener('input', function () { kaart.wens = inp.value; kaart.gezien = []; }); bl.appendChild(inp);
      var go = kEl('button', 'btn main', kaart.ideeen.length ? 'Volgende 3 ideeën' : 'Geef 3 ideeën'); go.type = 'button'; go.id = 'kaartGo'; go.style.cssText = 'width:100%;margin-top:10px';
      go.disabled = kaart.bezig; if (kaart.bezig) go.textContent = 'Even denken...';
      go.addEventListener('click', kVraag); bl.appendChild(go);
      var fout = kEl('p', 'hint'); fout.id = 'kaartFout'; fout.style.color = 'var(--danger,#b3261e)'; fout.hidden = true; bl.appendChild(fout);
      var lijstEl = kEl('div'); lijstEl.id = 'kaartLijst'; bl.appendChild(lijstEl);
      kaart.ideeen.forEach(function (idee, n) { lijstEl.appendChild(kKaart(idee, n)); });
    }
    function kFout(t) { var f = document.getElementById('kaartFout'); if (!f) return; f.textContent = t || ''; f.hidden = !t; }
    function kSchoon(t, max) { return String(t == null ? '' : t).replace(/h[uü]ttenk[aä]se/gi, 'cottage cheese').replace(/[\^@-\^_\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 200); }
    function isSnelRecipe(r) {
      // v45b.3: Marlijns ⚡-vinkje telt — dat overschrijft de gok van de app
      if (r && r.snel) return true;
      var nm = (r.name || '').toLowerCase();
      if (/mousse|kwark[- ]?fris|kwarkfris|pizza|muffin|koekje|ovenschotel|stoofpot|curry|soep|taart|cake/i.test(nm)) return false;
      var st = String(r.steps || '').toLowerCase();
      if (/kook|bak\b|braden|stoven|verwarm de oven|wacht|koel.*uur|nacht in de/i.test(st)) return false;
      return true;
    }
    window.isSnelRecipe = isSnelRecipe; window.isSnelProduct = isSnelProduct;
    function isSnelProduct(p) {
      var nm = (p.n || '').toLowerCase();
      if (/rundergehakt|gehakt|kipfilet rauw|varkens|biefstuk|ongekookt/i.test(nm)) return false;
      return true;
    }
    // v45b.3: 🚨 Nood is streng — dit moet NU eetbaar zijn, zonder koken/bakken/afkoelen/wachten
    function isNoodRecipe(r) {
      if (!r) return false;
      var nm = (r.name || '').toLowerCase();
      if (/mousse|kwark[- ]?fris|kwarkfris|pizza|muffin|koekje|ovenschotel|stoofpot|curry|soep|taart|cake|broodje|tosti|wrap|lasagne|pasta|rijst|quiche|omelet|gebakken ei|roerei|pannekoek|pannenkoek|wafel/i.test(nm)) return false;
      var st = String(r.steps || '').toLowerCase();
      if (/kook|bak\b|braden|stoven|oven|verwarm|wacht|koel|afkoelen|marineren|marineer|blancher|rusten|laten staan|nacht in de|stoof|grill|airfry|frituur|magnetron|pan\b|koekenpan/i.test(st)) return false;
      // rauw vlees/vis of dingen die je normaal kookt, ook al staat het niet in de stappen
      var ing = (r.ing || []).map(function (i) { return String(i.n || '').toLowerCase(); }).join(' ');
      if (/gehakt|kipfilet rauw|kip rauw|varkens|biefstuk|zalm rauw|tonijn rauw|ongekookt|kippengehakt/i.test(ing)) return false;
      return true;
    }
    window.isNoodRecipe = isNoodRecipe;
    function isNoodProduct(p) {
      if (!p || !p.direct) return false; // "Direct eetbaar" moet aanstaan
      var nm = (p.n || '').toLowerCase();
      if (/rundergehakt|gehakt|kipfilet rauw|varkens|biefstuk|ongekookt|zalm rauw|tonijn rauw|sushi|carpaccio/i.test(nm)) return false;
      return true;
    }
    window.isNoodProduct = isNoodProduct;
    var KAART_STRUCT = {
      drinkbaar: /shake|smoothie|soep|drank|drinkyoghurt|\bpap\b|vla|yoghurtdrink/,
      zacht: /kwark|mousse|yoghurt|\bpap\b|vla|custard|appelmoes|banaan|eiersalade|tonijn|macaroni|lasagne/,
      knapperig: /cracker|koekje|croissant|noten|muesli|granola|appel\b|rauwkost|augurk|tosti|wrap|broodje/
    };
    function kVraag() {
      if (kaart.bezig) return;
      var wens = kSchoon(kaart.wens, 200).toLowerCase();
      var pool = [];

      // Recepten
      (S.recipes || []).forEach(function (r) {
        if (!r || !r.ing || !r.ing.length) return;
        if (kaart.mom) {
          if (kaart.mom === 'opst') {
            if (r.where && r.where.length && r.where.indexOf('ochtend') < 0 && r.where.indexOf('opst') < 0) return;
          } else {
            if (r.where && r.where.length && r.where.indexOf(kaart.mom) < 0) return;
          }
        }
        if (kaart.nood && !isNoodRecipe(r)) return; // v45b.3: 🚨 Nood = nu eetbaar (streng; het ⚡-vinkje telt hier niet)
        if (kaart.snel && !isSnelRecipe(r)) return;
        if (kaart.struct && KAART_STRUCT[kaart.struct]) {
          var stx = [r.name].concat((r.ing || []).map(function (i) { return i.n; })).join(' ').toLowerCase();
          if (!KAART_STRUCT[kaart.struct].test(stx)) return;
        }
        if (kaart.thuis) {
          var thuisTeller = 0;
          (r.ing || []).forEach(function (i) { var pp = APP.findProd(i.n); if (pp && pp.thuis) thuisTeller++; });
          if (!r.ing.length || thuisTeller / r.ing.length < 0.5) return;
        }
        if (wens) {
          var hay = [r.name];
          (r.ing || []).forEach(function (i) {
            hay.push(i.n);
            var p = APP.findProd(i.n);
            if (p) { hay.push(p.n); if (p.alias) hay = hay.concat(p.alias); }
          });
          var tekst = hay.join(' ').toLowerCase();
          if (tekst.indexOf(wens) < 0) return;
        }
        var idee = { type: 'rec', id: 'R:' + r.id, naam: r.name, uitleg: 'Recept', rec: r, _rid: r.id };
        // v45b.3: ⚡-vinkje met eigen minuten + eerlijke waarschuwing voor op het kaartje
        if (r.snel && r.snelMin != null && r.snelMin > 0) idee.min = r.snelMin;
        var warn = kWaarschuwing(r); if (warn) idee.waarschuwing = warn;
        pool.push(idee);
      });

      // Producten uit Prijzen
      (S.prijzen || []).forEach(function (p) {
        if (!p || !p.n) return;
        if (kaart.nood && !isNoodProduct(p)) return; // v45b.3: 🚨 Nood = nu eetbaar ("Direct eetbaar" aan, en niet rauw)
        if (kaart.snel && (!isSnelProduct(p) || !p.direct)) return;
        if (kaart.thuis && !p.thuis) return;
        if (kaart.struct && KAART_STRUCT[kaart.struct] && !KAART_STRUCT[kaart.struct].test(p.n.toLowerCase())) return;
        if (kaart.mom === 'opst') {
          var cs = (p.cat || []).concat(p.n.toLowerCase());
          var cstr = cs.join(' ').toLowerCase();
          var isMorning = /fruit|zuivel|drinkyoghurt|banaan|appel|ei\b|kwark|yoghurt|cracker|ontbijt/i.test(cstr);
          if (!isMorning) return;
        }
        if (wens) {
          var hay = [p.n].concat(p.alias || []).join(' ').toLowerCase();
          if (hay.indexOf(wens) < 0) return;
        }
        var sub = 'Product uit Prijzen' + (p.thuis ? ' · 🏠 in huis' : '') + (p.kc != null ? ' · ' + p.kc + ' kcal/100g' : (p.kst != null ? ' · ' + p.kst + ' kcal/stuk' : ''));
        pool.push({ type: 'prod', id: 'P:' + p.id, naam: p.n, uitleg: sub, prod: p });
      });

      if (!pool.length) {
        kaart.ideeen = [];
        kTeken();
        kFout(wens || kaart.mom || kaart.snel || kaart.nood || kaart.thuis ? 'Geen ideeën gevonden met deze keuze. Probeer een ander moment, schakel Nood of Snel uit of kies een ander zoekwoord.' : 'Nog geen recepten of producten beschikbaar.');
        return;
      }
      // v44: vaste, voorspelbare volgorde (geen random): favorieten eerst, dan op naam;
      // "Volgende 3" toont steeds de volgende nog niet geziene ideeën
      var favNamen = {};
      (S.fav || []).forEach(function (f) { if (f && f.name) favNamen[normName(f.name)] = (f.uses || 1); });
      var gesorteerd = pool.slice().sort(function (a, b) {
        var fa = (a.rec ? favNamen[normName(a.naam)] : null) || 0, fb = (b.rec ? favNamen[normName(b.naam)] : null) || 0;
        if (fa !== fb) return fb - fa;
        return String(a.naam).localeCompare(String(b.naam), 'nl');
      });
      var nieuw = gesorteerd.filter(function (x) { return kaart.gezien.indexOf(x.id) < 0; });
      if (!nieuw.length) { kaart.gezien = []; nieuw = gesorteerd.slice(); }
      var drie = nieuw.slice(0, 3);
      drie.forEach(function (x) { kaart.gezien.push(x.id); });
      kaart.ideeen = drie;
      kTeken();
    }
    // v45b.3: plakkerretje per kaartje — groen = alles in huis, oranje = nog halen (de kaart verbergt nooit iets)
    function kSticker(idee) {
      if (idee.prod) {
        return idee.prod.thuis ? { cls: 'groen', t: '🏠 alles in huis' } : { cls: 'oranje', t: '🛒 je moet dit product nog halen' };
      }
      var missend = 0;
      ((idee.rec && idee.rec.ing) || []).forEach(function (i) { var pp = APP.findProd(i.n); if (!pp || !pp.thuis) missend++; });
      if (!missend) return { cls: 'groen', t: '🏠 alles in huis' };
      return { cls: 'oranje', t: '🛒 je moet nog ' + missend + (missend === 1 ? ' ding' : ' dingen') + ' halen' };
    }
    // v45b.3: eerlijke zinnetjes — wanneer is een recept écht snel of nu eetbaar?
    function kWaarschuwing(r) {
      var st = String(r.steps || '').toLowerCase();
      var nm = (r.name || '').toLowerCase();
      var ing = (r.ing || []).map(function (i) { return String(i.n || '').toLowerCase(); }).join(' ');
      var kookt = /kook|bak\b|braden|stoven|oven|verwarm|grill|airfry|frituur|magnetron|pan\b|koekenpan/i.test(st) || /gebakken ei|roerei|omelet|pizza|muffin|ovenschotel|stoofpot|curry|soep|taart|cake|broodje|tosti|wrap|lasagne|quiche|pannekoek/i.test(nm);
      var koelt = /koel|afkoelen|wacht|rusten|laten staan|nacht in de/i.test(st);
      var gekooktEi = /gekookt ei|gekookte ei|hard ?gekookt ei/i.test(ing + ' ' + nm);
      var min = (r.snelMin != null && r.snelMin > 0) ? '± ' + r.snelMin + ' min werk, maar ' : '';
      var wacht = '';
      var mw = st.match(/(?:koel|afkoelen|wacht|rusten|laten staan)[^.]{0,60}?(\d+)\s*(uur|minuten|min)\b/);
      if (mw) { var v = parseInt(mw[1], 10) || 0; wacht = '± ' + (mw[2] === 'uur' ? v + ' uur' : v + ' min') + ' '; }
      var uit = [];
      if (gekooktEi && !/kook/i.test(st)) uit.push('snel alléén als je gekookte eieren in huis hebt');
      if (kookt && koelt) uit.push(min + 'moet nog ' + wacht + 'afkoelen — niet nu te eten');
      else if (kookt) uit.push(min + 'je moet nog koken/bakken — niet nu te eten');
      else if (koelt) uit.push(min + 'moet nog ' + wacht + 'wachten — niet nu te eten');
      if (!uit.length) return '';
      return uit.join('; ');
    }
    function kKaart(idee, n) {
      var c = kEl('div'); c.className = 'rcard'; c.style.cssText = 'border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-top:10px;background:var(--surface)';
      var top = kEl('div'); top.style.cssText = 'display:flex;gap:10px;align-items:flex-start;justify-content:space-between';
      var tx = kEl('div'); tx.style.flex = '1';
      var nm = kEl('div', '', (idee.rec ? APP.recEmoji({ name: idee.naam, where: idee.rec.where, emoji: idee.rec.emoji }) + ' ' : '') + idee.naam); nm.style.fontWeight = '700'; tx.appendChild(nm);
      // v45b.3: plakkerretje (groen/oranje) — de 🏠 In huis-knop hierboven blijft een losse, optionele filter
      var stk = kSticker(idee); var stkEl = kEl('span', 'sticker ' + stk.cls, stk.t); stkEl.style.display = 'inline-block'; stkEl.style.margin = '4px 0 0'; tx.appendChild(stkEl);
      if (idee.uitleg) { var u = kEl('div', 'hint small', idee.uitleg + (idee.min ? ' (± ' + idee.min + ' min zelf bezig' + (idee.wacht ? ', ' + idee.wacht + ' min wachten' : '') + ')' : '')); u.style.margin = '2px 0 0'; tx.appendChild(u); }
      if (idee.rec) {
        var wh = idee.rec.where && idee.rec.where.length ? idee.rec.where.map(function (w) { var g = APP.RGROUPS.filter(function (x) { return x.id === w; })[0]; return g ? g.t : w; }).join(', ') : 'Bij elk moment';
        var bl2 = kEl('div', 'hint small', 'Blok: ' + wh); bl2.style.margin = '2px 0 0'; tx.appendChild(bl2);
      } else if (idee.prod && idee.prod.direct) {
        var combi = (S.prijzen || []).filter(function (q) { return q && q.id !== idee.prod.id && q.direct; })[0];
        if (combi) { var tip = kEl('div', 'hint small', 'Lekker met ' + combi.n + ' erbij, dan is het een maaltijd'); tip.style.margin = '2px 0 0'; tx.appendChild(tip); }
      }
      if (idee.waarschuwing) { var w = kEl('div', 'hint small', '⚠️ ' + idee.waarschuwing); w.style.margin = '2px 0 0'; tx.appendChild(w); }
      top.appendChild(tx);
      var plus = kEl('button', 'btn main', '+'); plus.type = 'button'; plus.setAttribute('data-kaart-plus', String(n)); plus.setAttribute('aria-label', 'Zet ' + idee.naam + ' in je week'); plus.style.cssText = 'min-width:52px;font-size:22px;padding:0';
      top.appendChild(plus); c.appendChild(top);
      var pick = kEl('div'); pick.hidden = true; pick.style.cssText = 'margin-top:8px;border-top:1px solid var(--line);padding-top:8px'; pick.setAttribute('data-kaart-pick', String(n));
      c.appendChild(pick);
      if (idee.rec) {
        var det = kEl('details'); det.appendChild(kEl('summary', '', 'Recept bekijken'));
        var ul = kEl('ul'); idee.rec.ing.forEach(function (x) { ul.appendChild(kEl('li', '', APP.ingText(x, 1))); }); det.appendChild(ul);
        var st = String(idee.rec.steps || '').split('\n').map(function (t) { return t.trim(); }).filter(Boolean);
        if (st.length) { var ol = kEl('ol'); st.forEach(function (t) { ol.appendChild(kEl('li', '', t.replace(/^\d+[.)]\s*/, ''))); }); det.appendChild(ol); }
        c.appendChild(det);
      }
      plus.addEventListener('click', function () { pick.hidden = !pick.hidden; plus.textContent = pick.hidden ? '+' : '×'; if (!pick.hidden) { kPickTeken(pick, idee); if (pick.scrollIntoView) pick.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } });
      return c;
    }
    function kPickTeken(pick, idee) {
      pick.textContent = '';
      var dagen = kWeekDagen(), def = dagen.filter(function (d) { return d.vandaag; })[0] || dagen[0];
      pick.appendChild(kEl('div', 'hint small', 'Wanneer wil je dit eten?')).style.margin = '0 0 4px';
      var sd = kEl('select'); sd.className = 'kdag'; sd.setAttribute('aria-label', 'Dag'); sd.style.cssText = 'width:100%;min-height:48px;font-size:16px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:inherit;padding:0 8px';
      dagen.forEach(function (d) { var o = kEl('option', '', d.t + (d.vandaag ? ' (vandaag)' : '')); o.value = d.id; if (d.id === def.id) o.selected = true; sd.appendChild(o); });
      var sm = kEl('select'); sm.className = 'kmom'; sm.setAttribute('aria-label', 'Moment'); sm.style.cssText = 'width:100%;min-height:48px;font-size:16px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:inherit;padding:0 8px;margin-top:6px';
      function vulM() {
        var dag = dagen.filter(function (d) { return d.id === sd.value; })[0]; sm.textContent = '';
        var gewenst = '';
        var mm = kMomenten(dag); if (kaart.mom === 'opst') { gewenst = 'opst'; } else if (kaart.mom) { var f1 = mm.filter(function (m) { return APP.groupOfSlot(m.slot) === kaart.mom; })[0]; if (f1) gewenst = f1.slot; } else if (mm.some(function (m) { return m.slot === 'av'; })) gewenst = 'av';
        mm.forEach(function (m) { var o = kEl('option', '', m.t + (m.p ? ' (' + m.p + ')' : '')); o.value = m.slot; if (m.slot === gewenst) o.selected = true; sm.appendChild(o); });
      }
      sd.addEventListener('change', vulM); vulM();
      pick.appendChild(sd); pick.appendChild(sm);
      var rij = kEl('div', 'row'); rij.style.cssText = 'margin-top:8px;display:flex;flex-wrap:wrap;gap:8px';
      var ja = kEl('button', 'btn main', 'Zet in mijn week'); ja.type = 'button'; ja.className = 'btn main kzet';
      ja.addEventListener('click', function () { kZet(idee, sd.value, sm.value); });
      rij.appendChild(ja);
      if (idee.ing && !idee.rec) { var bw = kEl('button', 'btn', 'Alleen bewaren bij Recepten'); bw.type = 'button'; bw.className = 'btn kbewaar'; bw.addEventListener('click', function () { kBewaar(idee, sm.value); toast('Bewaard bij Recepten'); }); rij.appendChild(bw); }
      pick.appendChild(rij);
    }
    function kBewaar(idee, slot) {
      var bestaand = S.recipes.filter(function (r) { return r._kaart === idee.naam; })[0];
      if (bestaand) return bestaand;
      var nr = { id: uid(), name: uniekeNaam(idee.naam), _kaart: idee.naam, ing: idee.ing.map(function (x) { var o = { n: x.n, a: x.a, u: x.uo, p: x.p }; if (x._est) o.est = true; return o; }) }; // v49-fix: _kaart gezet zodat de dedupe-check in kBewaar werkt
      if (idee.steps.length) nr.steps = idee.steps.join('\n');
      var g = APP.groupOfSlot(slot); if (g) nr.where = [g];
      S.recipes.push(nr); persist(); idee._rid = nr.id; return nr;
    }
    function kZet(idee, dagId, slot) {
      var d = APP.dayDoc(dagId), dagTxt = '';
      if (idee.type === 'prod' && idee.prod) {
        var p = idee.prod;
        var u = p.eh || p.u || 'stuk';
        var a = (u === 'stuk' ? 1 : 100);
        var k = APP.kcalFor(p, a, u);
        d.entries.push({
          id: uid(),
          slot: slot,
          key: 'P:' + p.id,
          code: '',
          name: p.n + ', ' + APP.fmtN(a) + ' ' + APP.unitWord(u, a, p),
          k: k != null ? Math.round(k) : null,
          exact: k != null,
          pid: p.id,
          amt: a,
          u: u
        });
        APP.saveDay(dagId); APP.render();
        toast(p.n + ' in je week gezet');
        kSluit();
        return;
      }
      if (idee.ing || idee.rec) {
        var r = idee._rid ? S.recipes.filter(function (x) { return x.id === idee._rid; })[0] : null;
        if (!r) r = kBewaar(idee, slot);
        APP.addRecipeAt(r, dagId, slot, 1);
        APP.saveDay(dagId); APP.render();
        toast(r.name + ' in je week gezet');
        kSluit();
        return;
      } else {
        var oud = d.notes[slot] ? d.notes[slot] + ' / ' : '';
        d.notes[slot] = (oud + idee.naam).slice(0, 400);
      }
      persist(); render();
      var dg = kWeekDagen().filter(function (x) { return x.id === dagId; })[0];
      toast('Erbij gezet: ' + (dg ? dg.t : dagId));
      kSluit();
    }
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-kaart-open]');
      if (b) { ev.preventDefault(); kOpen(b.getAttribute('data-kaart-open')); }
    });
    APP.kaartjes = { open: kOpen, close: kSluit }; // v57: kaartclose kan zo de kaart sluiten

    APP.gem = { post: post, verklein: verklein, jsonUit: jsonUit, uitleg: uitleg, model: function () { return mistralModel(); } }; // v58.4: model uit localStorage, ook zonder #model-veld
    window.updateMistralReceptenDropdown = updateMistralReceptenDropdown;

    window.mistralAanpas = function (rid) { // v58: naamwissel Gemini→Mistral (was window.geminiAanpas)
      var r = (S.recipes || []).filter(function (x) { return x.id === rid; })[0];
      if (!r) return;
      S.tab = 'gem'; APP.render(); window.scrollTo(0, 0);
      var kh = $('khAanpas'); if (kh) kh.open = true; // v47: Kookhulp-tab, blokje automatisch open
      updateMistralReceptenDropdown();
      var sel = $('kiesReceptAanpas'); sel.value = rid;
      var txt = r.name + '\n' + r.ing.map(function (i) { return '- ' + ingText(i, 1); }).join('\n');
      if (r.steps) txt += '\n\nBereiding:\n' + r.steps;
      $('orig').value = txt;
      window._aanpasKcal = (!APP.recUnknown(r) && APP.recKcal(r, 1)) ? Math.round(APP.recKcal(r, 1) / (r.por > 1 ? r.por : 1)) : null;
      $('aanpasWelk').textContent = 'Je past aan: ' + r.name + '. Het origineel blijft staan; het nieuwe recept bewaar je pas als je dat zelf kiest.';
      keuzeRegel();
      $('wens').value = '';
      setTimeout(function () { var p = $('pane-aanpassen'); if (p && p.scrollIntoView) p.scrollIntoView(); }, 50);
    };
    $('orig').addEventListener('input', function () { window._aanpasKcal = null; });
    var selAanpas = $('kiesReceptAanpas');
    if (selAanpas) {
      selAanpas.addEventListener('change', function () {
        var rid = this.value;
        if (!rid) return;
        var r = (S.recipes || []).filter(function (x) { return x.id === rid; })[0];
        if (!r) return;
        var txt = r.name + '\n' + r.ing.map(function (i) { return '- ' + ingText(i, 1); }).join('\n');
        if (r.steps) txt += '\n\nBereiding:\n' + r.steps;
        $('orig').value = txt;
        keuzeRegel();
        $('wens').focus();
        toast('Recept ingeladen! Typ bij "Wat moet er anders?" je wens');
      });
    }

  })();

  // v57: op pagina's zonder #gemview (multi-page, niet kookhulp.html) linken de kaart-knoppen door naar kookhulp.html — de kaart-IIFE laadt daar pas
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-kaart-open]');
    if (b && !document.getElementById('gemview')) { ev.preventDefault(); location.assign('kookhulp.html'); }
  });

  window.openRecipe = function (recipeId) {
    if (!recipeId) return;
    if (!document.getElementById('recview')) { location.assign('recepten.html'); return; } // v57: op index.html (multi-page) geen recview — door naar recepten.html
    S.tab = "rec";
    if (Array.isArray(S.recipes)) {
      var r = S.recipes.filter(function (x) { return x.id === recipeId; })[0];
      if (r) {
        var w = rWhere(r);
        var gid = w.length ? w[0] : "none";
        S.recOpen = S.recOpen || {};
        S.recOpen[gid + ":" + recipeId] = true;
      }
    }
    render();
    setTimeout(function () {
      var el = document.querySelector('[data-rk*="' + recipeId + '"]');
      if (el) {
        el.open = true;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // v45b: thema (licht/donker/extreem-contrast) — laden bij start + knoppen in Instellingen
  var THEMEKEY = 'eetweek.thema';
  function applyTheme(t) {
    var root = document.documentElement;
    if (t === 'light') { root.setAttribute('data-theme', 'light'); }
    else if (t === 'dark') { root.setAttribute('data-theme', 'dark'); }
    else if (t === 'contrast') { root.setAttribute('data-theme', 'contrast'); }
    else { root.removeAttribute('data-theme'); }
    document.querySelectorAll('[data-theme-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-set') === (t || 'auto')));
    });
  }
  function loadTheme() {
    try { return localStorage.getItem(THEMEKEY) || 'auto'; } catch (e) { return 'auto'; }
  }
  function saveTheme(t) {
    try {
      if (t === 'auto') localStorage.removeItem(THEMEKEY);
      else localStorage.setItem(THEMEKEY, t);
    } catch (e) { /* geen opslag */ }
  }
  applyTheme(loadTheme());
  // v50.2/v50.3: Instellingen — één groepje tegelijk open, en binnen een groepje één uitklapper tegelijk
  document.querySelectorAll('#instview details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) {
        // v50.4: één uitklapper tegelijk open binnen hetzelfde pgin (groepje), ook als de kaartjes in eigen .card zitten
        var scope = d.closest('.pgin') || d.parentElement;
        scope.querySelectorAll('details[open]').forEach(function (o) { if (o !== d) o.open = false; });
        if (d.classList.contains('instgrp')) {
          document.querySelectorAll('#instview > .instgrp').forEach(function (o) { if (o !== d) o.open = false; });
        }
      } else {
        // her-tikken sluit het groepje; bij opnieuw openen staat alles binnenin weer dicht
        d.querySelectorAll('details[open]').forEach(function (o) { o.open = false; });
      }
    });
  });
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || !t.getAttribute) return;
    var ts = t.getAttribute('data-theme-set');
    if (ts) { applyTheme(ts); saveTheme(ts); toast(ts === 'auto' ? 'Automatisch (volgt je telefoon)' : ts === 'light' ? 'Licht' : ts === 'dark' ? 'Donker' : 'Extreem contrast'); }
  });

  // v56 DEEL 4: lichte dagstijl (Rustig Salie / Warm Zand, standaard Warm Zand) — data-lightstyle op <html>
  var LSKEY = 'eetweek.lightstyle';
  function applyLightstyle(ls) {
    var root = document.documentElement;
    if (ls === 'salie') root.setAttribute('data-lightstyle', 'salie');
    else root.removeAttribute('data-lightstyle');
    var z = $('lsZand'), s = $('lsSalie');
    if (z) z.checked = (ls !== 'salie');
    if (s) s.checked = (ls === 'salie');
  }
  function loadLightstyle() {
    try { return localStorage.getItem(LSKEY) === 'salie' ? 'salie' : 'zand'; } catch (e) { return 'zand'; }
  }
  function saveLightstyle(ls) {
    try {
      if (ls === 'salie') localStorage.setItem(LSKEY, 'salie');
      else localStorage.removeItem(LSKEY);
    } catch (e) { /* geen opslag */ }
  }
  applyLightstyle(loadLightstyle());
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (!t || !t.getAttribute || t.name !== 'lightstyle') return;
    var ls = t.value === 'salie' ? 'salie' : 'zand';
    applyLightstyle(ls); saveLightstyle(ls);
    toast(ls === 'salie' ? 'Lichte dagstijl: Rustig Salie' : 'Lichte dagstijl: Warm Zand');
  });


  // ---- v57.6: meet-hulpje (standaard UIT) + stijlkeuze per pagina ----
  function meetAan() { try { return localStorage.getItem('eetweek.meetHulp') === '1'; } catch (e) { return false; } }
  function stijlVan(pg) { try { var o = JSON.parse(localStorage.getItem('eetweek.stijl') || '{}'); return o[pg] === 'blok' ? 'blok' : 'plat'; } catch (e) { return 'plat'; } }
  function bewaarStijl(pg, v) { try { var o = JSON.parse(localStorage.getItem('eetweek.stijl') || '{}'); o[pg] = v; localStorage.setItem('eetweek.stijl', JSON.stringify(o)); } catch (e) {} }
  var STIJL_VIEWS = { weekview: 'week', recview: 'rec', prijsview: 'prijs', gemview: 'gem', instview: 'inst' };
  var STIJL_NAAM = { week: 'Week', rec: 'Recepten', prijs: 'Producten', gem: 'Kookhulp', inst: 'Instellingen' };
  function pasStijlToe() { Object.keys(STIJL_VIEWS).forEach(function (id) { var v = $(id); if (v) v.classList.toggle('stijl-blok', stijlVan(STIJL_VIEWS[id]) === 'blok'); }); }
  function meetOpenDeel() {
    var sh = document.querySelector('.sheet:not([hidden])');
    if (sh) {
      var h2 = sh.querySelector('.phead h2'), titel = h2 ? String(h2.textContent || '').trim() : '';
      return { el: sh.querySelector('.panel') || sh, naam: titel || ('popup: ' + (sh.id || '?')) }; // v57.7: leesbare titel van de popup (bv. 'Nieuw product'), anders 'popup: <id>'
    }
    var ids = [['weekview', 'Week'], ['recview', 'Recepten'], ['prijsview', 'Producten'], ['gemview', 'Kookhulp'], ['instview', 'Instellingen']];
    for (var i = 0; i < ids.length; i++) { var v = $(ids[i][0]); if (v && !v.hidden) return { el: v, naam: ids[i][1] }; }
    return { el: document.body, naam: 'Hele pagina' };
  }
  function meetWaarden() {
    var d = meetOpenDeel(), el = d.el, r = el.getBoundingClientRect();
    return { naam: d.naam, ih: window.innerHeight, ch: el.clientHeight, sh: el.scrollHeight, onder: Math.max(0, Math.round(r.bottom - window.innerHeight)) };
  }
  function meetTekst() {
    var m = meetWaarden();
    return 'Meet-hulpje — ' + new Date().toLocaleString('nl-NL') + '\nOpen schermdeel: ' + m.naam + '\nSchermhoogte (window.innerHeight): ' + m.ih + ' px\nHoogte open deel (clientHeight): ' + m.ch + ' px\nScroll-hoogte (scrollHeight): ' + m.sh + ' px\nOnder de schermrand verstopt: ' + m.onder + ' px';
  }
  var _meetT = null;
  function updateMeetBlok() {
    var b = $('meetblok');
    if (!meetAan()) { if (_meetT) { clearInterval(_meetT); _meetT = null; } if (b) b.remove(); return; }
    if (!_meetT) _meetT = setInterval(updateMeetBlok, 500); // v57.7: zolang het meet-hulpje aan staat verversen we elke halve seconde — openen/sluiten van een popup wordt zo meteen meegenomen
    if (!b) {
      b = document.createElement('div'); b.id = 'meetblok';
      b.title = 'Tik voor de meetregels in het uitvoer-scherm (met kopiëren)';
      b.addEventListener('click', function () { showOut('Meet-hulpje', meetOpenDeel().naam + ' — ' + new Date().toLocaleString('nl-NL'), meetTekst(), false); });
      document.body.appendChild(b);
    }
    var m = meetWaarden();
    b.textContent = '📏 ' + m.naam + ' · scherm ' + m.ih + ' px · deel ' + m.ch + '/' + m.sh + ' px · ' + m.onder + ' px eronder';
  }
  function maakStijlPijl(h) {
    var v = h.closest('[id$="view"]'); if (!v) return;
    var pg = STIJL_VIEWS[v.id]; if (!pg) return;
    if (h.querySelector('.stijlpijl')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'stijlpijl'; b.setAttribute('data-act', 'stijlpijl'); b.setAttribute('data-page', pg);
    b.setAttribute('aria-label', 'Stijlkeuze ' + STIJL_NAAM[pg]); b.title = 'Rijen van ' + STIJL_NAAM[pg] + ': plat of als blokjes?';
    b.textContent = '▼';
    h.appendChild(b);
    if (S._stijlOpen === pg) {
      var k = document.createElement('div'); k.className = 'stijlkeuze';
      k.innerHTML = '<span>Rijen:</span>' +
        '<button type="button" class="pill" data-act="stijlzet" data-page="' + pg + '" data-v="plat" aria-pressed="' + (stijlVan(pg) === 'plat') + '">Platte rijen</button>' +
        '<button type="button" class="pill" data-act="stijlzet" data-page="' + pg + '" data-v="blok" aria-pressed="' + (stijlVan(pg) === 'blok') + '">Zachte blokjes</button>';
      h.parentElement.insertBefore(k, h.nextSibling);
    }
  }
  document.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('[data-act]') : null;
    if (!el) return;
    var act2 = el.getAttribute('data-act');
    if (act2 === 'stijlpijl') { var pg = el.getAttribute('data-page'); S._stijlOpen = (S._stijlOpen === pg) ? null : pg; render(); }
    else if (act2 === 'stijlzet') { var pg2 = el.getAttribute('data-page'), vv = el.getAttribute('data-v'); bewaarStijl(pg2, vv); S._stijlOpen = null; pasStijlToe(); render(); toast(STIJL_NAAM[pg2] + ': ' + (vv === 'blok' ? 'zachte blokjes' : 'platte rijen')); }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t && t.id === 'meethulp') { try { if (t.checked) localStorage.setItem('eetweek.meetHulp', '1'); else localStorage.removeItem('eetweek.meetHulp'); } catch (e) {} updateMeetBlok(); }
  });
  window.addEventListener('resize', function () { updateMeetBlok(); });
  (function () { // ▼ bij elk groepje (h2.sec) in een pagina-view
    function check(n) {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'H2' && n.classList.contains('sec')) maakStijlPijl(n);
      if (n.querySelectorAll) n.querySelectorAll('h2.sec').forEach(maakStijlPijl);
    }
    new MutationObserver(function (muts) { muts.forEach(function (m) { m.addedNodes.forEach(check); }); }).observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('h2.sec').forEach(maakStijlPijl);
  })();

  load();
  render();
  stuurNaarAndroid();
  // v47.1: Mistral-sleutel op het tandwiel (instellingen.html / #instview). Draait op élke pagina,
  // maar is alleen actief waar #key bestaat (tandwiel + single-file).
  (function () {
    if (!$('key')) return;
    var SLEUTELKEY = 'eetweek.gemini.sleutel';
    var LUSTSLEUTEL = 'eetweek.gemini.keuzes';
    var API = 'https://api.mistral.ai/v1/';

    function gemStatus(t, fout) {
      var s = $('gemStatus'); if (!s) return;
      s.hidden = false; s.textContent = t || ''; s.className = 'hint zz' + (fout ? ' err' : ''); // 10 nov: testresultaat direct leesbaar (dynamische tekst krijgt nooit een i)
    }
    function sleutel() {
      var k = $('key').value.trim();
      if (!k) throw new Error('Plak eerst je Mistral API-sleutel in het vak bovenaan.');
      return k;
    }
    function bewaarSleutel() {
      try {
        if ($('keyOnthoud').checked && $('key').value.trim()) localStorage.setItem(SLEUTELKEY, $('key').value.trim());
        else localStorage.removeItem(SLEUTELKEY);
      } catch (e) { /* geen opslag */ }
    }
    function bewaarModel() {
      try {
        var opgeslagen = {};
        try { opgeslagen = JSON.parse(localStorage.getItem(LUSTSLEUTEL) || '{}') || {}; } catch (e) { opgeslagen = {}; }
        opgeslagen.m = $('model').value;
        localStorage.setItem(LUSTSLEUTEL, JSON.stringify(opgeslagen));
      } catch (e) { /* geen opslag */ }
    }
    function uitleg(res, tekst) {
      var s = res.status;
      if (s === 402) return 'Je Mistral-tegoed of betaalmethode klopt niet. Kijk op console.mistral.ai bij Facturering of je tegoed of betaalmethode in orde is.';
      if (s === 429) return 'Mistral is even op zijn limiet (te veel vragen achter elkaar). Wacht een minuutje en probeer het opnieuw.';
      if (s === 503) return 'Mistral is nu erg druk (ook na een tweede poging). Probeer het over een paar minuten opnieuw.';
      if (s === 400 && /api key|apikey/i.test(tekst)) return 'Mistral accepteert deze sleutel niet. Controleer of je hem helemaal hebt geplakt.';
      if (s === 401 || s === 403) return 'Geen toegang (' + s + '). Controleer je sleutel. Dit kan ook komen doordat het model niet voor jouw sleutel beschikbaar is.';
      if (s === 404) return 'Dit model bestaat niet (voor jouw sleutel). Tik op "Welke modellen kan ik gebruiken?" en kies er een.';
      return 'Fout ' + s + ':\n' + tekst.slice(0, 400);
    }
    var TIJDLIMIET = 90000;
    async function testVerbinding(knop) {
      gemStatus('Verbinding testen...');
      knop.disabled = true;
      try {
        var model = mistralModel(); // v58.4
        var ctl = new AbortController(), tm = setTimeout(function () { ctl.abort(); }, TIJDLIMIET);
        var res;
        try {
          res = await fetch(API + 'chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sleutel() },
            body: JSON.stringify({ model: model, messages: [{ role: 'user', content: 'Zeg in één korte Nederlandse zin hallo.' }] }),
            signal: ctl.signal
          });
        } catch (e) {
          if (e.name === 'AbortError') throw new Error('Mistral reageert niet binnen ' + Math.round(TIJDLIMIET / 1000) + ' seconden. Probeer het opnieuw, of kies een lichter model (mistral-small-latest).');
          throw new Error('Geen verbinding met Mistral. Controleer je internet.');
        } finally { clearTimeout(tm); }
        if (!res.ok) throw new Error(uitleg(res, await res.text()));
        var d = await res.json();
        var t = ((d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '').trim();
        gemStatus('De verbinding werkt. Mistral zegt: ' + t);
      } catch (e) { gemStatus(e.message, true); }
      knop.disabled = false;
    }
    async function modellenOphalen(knop) {
      gemStatus('Modellen ophalen...');
      knop.disabled = true;
      try {
        var res = await fetch(API + 'models', { headers: { 'Authorization': 'Bearer ' + sleutel() } })
          .catch(function () { throw new Error('Geen verbinding met Mistral. Controleer je internet.'); });
        if (!res.ok) throw new Error(uitleg(res, await res.text()));
        var d = await res.json();
        var lst = (d.data || []).map(function (m) { return m.id; }).filter(function (n) { return /mistral-(medium|small)-latest/i.test(n); });
        var dl = $('modellen'); dl.textContent = '';
        lst.forEach(function (n) { var o = document.createElement('option'); o.value = n; dl.appendChild(o); });
        if (!lst.length) { gemStatus('Er zijn geen Mistral-modellen gevonden voor deze sleutel.', true); return; }
        $('model').value = lst.indexOf($('model').value) >= 0 ? $('model').value : lst[0];
        bewaarModel();
        gemStatus('Gevonden: ' + lst.join(', ') + '.\nHet bovenste is nu ingevuld. Je kunt in het veld "Model" een andere kiezen.');
      } catch (e) { gemStatus(e.message, true); }
      knop.disabled = false;
    }

    try { var sk = localStorage.getItem(SLEUTELKEY); if (sk) $('key').value = sk; } catch (e) { /* geen opslag */ }
    $('key').addEventListener('change', bewaarSleutel);
    $('keyOnthoud').addEventListener('change', bewaarSleutel);
    var bn = document.getElementById('bewaarNieuw'); if (bn) bn.checked = S.bewaarNieuw !== false; // v51.13: bewaar-schakelaar uit instellingen
    var mh = document.getElementById('meethulp'); if (mh) mh.checked = meetAan(); // v57.6: meet-hulpje-schakelaar
    (function () { ['ah', 'lidl', 'jumbo', 'aldi', 'hoogvliet'].forEach(function (c) { var el = document.querySelector('input[data-sup="' + c + '"]'); if (el) el.checked = !S.supers || S.supers[c] !== false; }); })(); // v51.13: mijn supermarkten uit instellingen
    $('btnSleutelWeg').addEventListener('click', function () {
      try { localStorage.removeItem(SLEUTELKEY); } catch (e) { /* geen opslag */ }
      $('key').value = ''; toast('Sleutel verwijderd');
    });
    $('model').addEventListener('change', bewaarModel);
    $('btnTest').addEventListener('click', function () { testVerbinding(this); });
    $('btnModellen').addEventListener('click', function () { modellenOphalen(this); });
  })();
  // ---- v49: Snel invullen — ⚡ "Zelfde als normaal" (vaste dag) + "Zeg wat je at" (tekst → AI-voorstel → dag)
  // Bron: docs/PLAN-fase2-zeg-wat-je-at.md; voorbeeld backup/voorbeelden/voorbeeld-snel-invullen.html;
  // bewezen AI-keten uit testversies/zeg-wat-je-at/index.html (v9.4). Alleen typen, geen microfoon.

  // ---------- data: "Mijn normale dag" als 5 weekdag-patronen (S.normaal: { '1': [{slot,pid,amt,u}], …, '5': […] }) ----------
  // v50.6: elke weekdag ma t/m vr heeft zijn eigen patroon; het weekend hoort er niet bij
  function patroonSlots(dow) {
    if (dow === 2 || dow === 5) return ['ont', 'pz', 'lun']; // di/vr: ontbijt + pauze + lunch
    if (dow >= 1 && dow <= 4) return ['ont', 'pz', 'kl'];    // ma/wo/do: ontbijt + pauze + kleine lunch
    return [];
  }
  function cleanPatroon(arr, dow) {
    var slots = patroonSlots(dow), uit = [];
    if (!Array.isArray(arr)) return uit;
    arr.forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      var slot = String(r.slot || ''), pid = typeof r.pid === 'string' ? r.pid : '', rid = typeof r.rid === 'string' ? r.rid : '';
      var a = num(r.amt);
      if (!slot || (!pid && !rid) || a == null || a <= 0) return; // v57: óók rid-entries (recepten) blijven bewaard — ze verdwenen stilletjes
      if (slots.indexOf(slot) < 0) return; // v50.6: alleen de momenten van die weekdag
      var it = { slot: slot.slice(0, 12), amt: Math.round(a * 100) / 100, u: String(r.u || '').slice(0, 12) };
      if (pid) it.pid = pid.slice(0, 40); else it.rid = rid.slice(0, 40);
      uit.push(it);
    });
    return uit.slice(0, 60);
  }
  function cleanNormaal(o) {
    var uit = {};
    if (Array.isArray(o)) { [1, 2, 3, 4, 5].forEach(function (d) { uit[String(d)] = cleanPatroon(o, d); }); return uit; } // v50.6: oude platte lijst → op alle 5 weekdagen
    if (o && typeof o === 'object') [1, 2, 3, 4, 5].forEach(function (d) { if (Array.isArray(o[String(d)])) uit[String(d)] = cleanPatroon(o[String(d)], d); });
    return uit;
  }
  function normaalVoor(dow) { return (S.normaal && S.normaal[String(dow)]) || []; }
  // Eet-momenten van een dag (Bewegen en Einde van de dag zijn géén eet-momenten)
  function eetMomenten(dow, d) {
    return momentsFor(dow, d || {}).filter(function (m) { return m.slot !== 'move' && m.slot !== 'eod'; });
  }
  // De momenten van het weekdag-patroon (ma/wo/do: kleine lunch; di/vr: lunch; géén avondeten — die vult ze los in de week)
  function alleEetMomenten(dow) {
    if (dow === 2 || dow === 5) return [
      { slot: 'ont', t: 'Ontbijt', p: '' },
      { slot: 'pz', t: 'Pauze', p: '' },
      { slot: 'lun', t: 'Lunch', p: '' }
    ];
    return [
      { slot: 'ont', t: 'Ontbijt', p: '' },
      { slot: 'pz', t: 'Pauze', p: '' },
      { slot: 'kl', t: 'Kleine lunch', p: '' }
    ];
  }

  // ---------- DEEL A: ⚡ "Zelfde als normaal" (per weekdag) ----------
  function normaalEntry(slot, r) {
    if (r.rid) { // wens 8 nov: recept in het patroon -> als echt recept in de dag (1 portie)
      var rc = (S.recipes || []).filter(function (x) { return x.id === r.rid; })[0]; if (!rc) return null;
      return { id: uid(), slot: slot, key: 'R:' + rc.id + ':1', code: '', name: rc.name + ', 1 ' + (rc.unit || 'portie'), k: recKcal(rc, 1), recipe: rc.id, ing: (rc.ing || []).map(function (i2) { return ingText(i2, 1); }).join(', '), unk: recUnknown(rc) };
    }
    var p = prodById(r.pid); if (!p) return null;
    var a = r.amt, u = r.u;
    var antlU = (p.aantal > 0 && p.aantalWoord) ? p.aantalWoord : null;
    var sg0 = stukGram(p); // v50.6: alleen complete stuk-gegevens (aantal stuks + gram per stuk + eigen woord) tellen als stuks
    var hasPiece = !!(antlU && sg0 != null);
    var us = prodUnits(p); if (antlU && us.indexOf(antlU) < 0) us.push(antlU);
    if (hasPiece && (u === antlU || u === 'stuk')) u = antlU;
    else if (us.indexOf(u) < 0) u = (p.eh && us.indexOf(p.eh) >= 0) ? p.eh : p.u;
    if (u === antlU && !hasPiece) u = (p.u === 'stuk' ? 'stuk' : p.u === 'ml' ? 'ml' : 'g'); // v57.5: stuk-product zonder stukgewicht -> 'stuk' (kcalFor geeft dan null) // v50.6: gram-producten blijven in grammen — niet gokken
    var k = (hasPiece && u === antlU) ? kcalFor(p, a * sg0, 'g') : kcalFor(p, a, u);
    var e = { id: uid(), slot: slot, key: 'P:' + p.id, code: '', name: p.n + ', ' + fmtN(a) + ' ' + unitWord(u, a, p), k: k == null ? null : Math.round(k), exact: k != null, pid: p.id, amt: a, u: u };
    if (u === 'g' && k != null && p.kc != null) { e.g = a; e.p = p.kc; }
    if (hasPiece && u === antlU) { e.g = a * sg0; if (k != null && p.kc != null) e.p = p.kc; }
    return e;
  }
  // Vult alleen lege momenten — nooit iets wegmijten of overschrijven
  function normaalDoeHet(id) {
    var p = id.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    var dow = dt.getDay(), pat = normaalVoor(dow);
    if (!pat.length) { toast('Stel eerst een patroon in voor ' + DOW[dow] + ' bij ⚙️ Instellingen → ⚡ Mijn normale dag'); return; }
    var d = dayDoc(id), gezet = 0;
    eetMomenten(dow, d).forEach(function (m) {
      var heeft = d.entries.some(function (e) { return e.slot === m.slot; });
      if (heeft) return;
      pat.forEach(function (r) {
        if (r.slot !== m.slot) return;
        var e = normaalEntry(m.slot, r);
        if (e) { d.entries.push(e); gezet++; }
      });
    });
    if (gezet) { persist(); render(); toast('⚡ ' + gezet + (gezet === 1 ? ' moment' : ' momenten') + ' uit je ' + DOW[dow] + '-patroon erin — pas gerust aan' + (TESTVERSIE ? ' (🧪 testversie: niet weggeschreven)' : '')); }
    else { render(); toast('Alles al vol: de ⚡ vult alleen lege momenten'); }
  }
  // v57 (afspraak v49/v49.2): kleine ⚡ per nog-leeg eet-moment op een deels-lege dag — vult ALLEEN dit moment uit het weekdagpatroon
  function normaalDoeHetMoment(id, slot) {
    if (!id || !slot) return;
    var p = id.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    var dow = dt.getDay(), pat = normaalVoor(dow).filter(function (r) { return r.slot === slot; });
    if (!pat.length) { toast('Geen patroon voor dit moment op ' + DOW[dow] + ' — stel het in bij ⚙️ Instellingen → ⚡ Mijn normale dag'); return; }
    var d = dayDoc(id);
    if (d.entries.some(function (e) { return e.slot === slot; })) { toast('Dit moment is al gevuld — de ⚡ vult alleen lege momenten'); return; }
    var gezet = 0;
    pat.forEach(function (r) { var e = normaalEntry(slot, r); if (e) { d.entries.push(e); gezet++; } });
    if (gezet) { persist(); render(); toast('⚡ ' + gezet + (gezet === 1 ? ' ding' : ' dingen') + ' uit je ' + DOW[dow] + '-patroon erin' + (TESTVERSIE ? ' (🧪 testversie: niet weggeschreven)' : '')); }
    else render();
  }

  // ---------- A1: Instellingen → "Mijn normale dag" (5 weekdag-patronen) ----------
  // v49.1: productkiezer voor "Mijn normale dag" als sheet (zoekbalk + categorieën, zoals in de Week)
  function buildNormSheetList(q) {
    var h = '';
    var recs = (S.recipes || []).filter(function (r) { return !q || normName(r.name).indexOf(q) >= 0; }).sort(function (a, b) { return a.name.localeCompare(b.name, 'nl'); }); // wens 8 nov: recepten in het patroon
    if (q) {
      var list = S.prijzen.filter(function (p) {
        return prodKeys(p).join(' ').indexOf(q) >= 0;
      }).sort(function (a, b) { return a.n.localeCompare(b.n, 'nl'); });
      list.forEach(function (p) {
        h += '<button class="opt" data-act="normSheetAdd" data-p="' + p.id + '"><span class="on">' + esc(p.n) + '<small>' + esc(p.u) + '</small></span></button>';
      });
      recs.forEach(function (r) {
        h += '<button class="opt" data-act="normSheetAddR" data-r="' + r.id + '"><span class="on">🍽 ' + esc(r.name) + '<small>recept</small></span></button>';
      });
      if (!list.length && !recs.length) h += '<p class="hint stat">Geen producten of recepten gevonden.</p>';
    } else {
      h += '<h3>Laatst toegevoegd</h3>';
      var ltw = S.prijzen.slice(-4).reverse();
      if (ltw.length) {
        ltw.forEach(function (p) {
          h += '<button class="opt" data-act="normSheetAdd" data-p="' + p.id + '"><span class="on">' + esc(p.n) + '<small>' + esc(p.u) + '</small></span></button>';
        });
      } else {
        h += '<p class="hint stat">Nog geen producten.</p>';
      }
      // v53.8: in het lege overzicht van "Mijn normale dag" geen recepten-lijst meer — alleen Laatst toegevoegd; recepten vind je via de zoekbalk hierboven
      // v49.1: géén categorieën hier — die staan al bij Producten; alleen zoekbalk + Laatst toegevoegd
    }
    return h;
  }
  function renderNormaalSheet(fresh) {
    var body = $('pbody'), keep = fresh ? 0 : body.scrollTop;
    var dowS = +(S.sheet.dow || 1);
    var m = alleEetMomenten(dowS).filter(function (x) { return x.slot === S.sheet.slot; })[0];
    $('st').textContent = 'Toevoegen';
    $('sp').textContent = 'Voor ' + cap(DOW[dowS]) + (m ? ' · ' + m.t : '');
    var h = '<h3>Zoeken</h3>';
    h += '<input class="note" id="normSheetSearch" type="search" autocomplete="off" placeholder="🔍 Zoek in je producten" aria-label="Zoek in je producten" value="' + esc(S.normSheetQ || '') + '">';
    h += '<div id="normSheetList">' + buildNormSheetList(normName(S.normSheetQ || '')) + '</div>';
    body.innerHTML = h;
    body.scrollTop = keep;
  }
  // DEEL 1 (per moment, week naar patroon): de bewerk-vorm van één moment — twee rustige zones, alléén productnamen (het knopje is de status)
  function normEditHtml(dag, m) {
    var pat = normaalVoor(dag);
    var items = pat.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r.slot === m.slot; });
    var patPids = {}; items.forEach(function (x) { patPids[x.r.rid ? 'R:' + x.r.rid : x.r.pid] = true; });
    var gegeten = {};
    // 8 nov fix: klokje vergelijkt per weekdag — alleen de eigen dag van het patroon telt (afspraak Marlijn)
    for (var i = 0; i < 7; i++) {
      var dt = addDays(S.start, i), did = fmtId(dt), dd = S.days[did];
      if (dd && dd.entries && dt.getDay() === dag) dd.entries.forEach(function (e) { if (e.slot === m.slot && e.pid) gegeten[e.pid] = true; if (e.slot === m.slot && e.recipe) gegeten['R:' + e.recipe] = true; }); // v51.8: recepten uit de week ook als 'nieuw' bij het klokje
    }
    var nieuw = Object.keys(gegeten).filter(function (pid) { return !patPids[pid]; });
    var h = '<div class="zone"><p class="zonekop">Bestaande producten</p>';
    items.forEach(function (x) {
      var keyId = x.r.rid ? 'R:' + x.r.rid : x.r.pid;
      var rcE = x.r.rid ? (S.recipes || []).filter(function (q) { return q.id === x.r.rid; })[0] : null;
      var p = prodById(x.r.pid), nm = rcE ? '🍽 ' + rcE.name : (p ? p.n : '(product niet meer gevonden)');
      var weg = !!(S.patWeg && S.patWeg[dag + ':' + m.slot + ':' + keyId]);
      h += '<div class="zrow"><span class="nm' + (weg ? ' weg' : '') + '">' + esc(nm) + '</span>' +
        '<button class="zbtn wegb" type="button" data-act="normweg" data-dow="' + dag + '" data-slot="' + esc(m.slot) + '" data-pid="' + esc(keyId) + '" aria-pressed="' + weg + '" aria-label="' + esc(nm) + (weg ? ' terug in je patroon' : ' uit je patroon halen') + '">' + (weg ? '↺' : '🗑️') + '</button></div>';
    });
    h += '</div>';
    if (nieuw.length) {
      h += '<div class="zone groen"><p class="zonekop">Nieuw deze ' + DOW[dag] + '</p>';
      nieuw.forEach(function (pid) {
        var isR = pid.indexOf('R:') === 0, rcN = isR ? (S.recipes || []).filter(function (x) { return x.id === pid.slice(2); })[0] : null;
        var p2 = prodById(pid), nm2 = isR ? ('🍽 ' + (rcN ? rcN.name : '(recept niet meer gevonden)')) : (p2 ? p2.n : '(product niet meer gevonden)');
        var aan = !!(S.patErbij && S.patErbij[dag + ':' + m.slot + ':' + pid]);
        h += '<div class="zrow"><span class="nm">' + esc(nm2) + '</span>' +
          '<button class="zbtn' + (aan ? ' aan' : '') + '" type="button" data-act="normerbij" data-dow="' + dag + '" data-slot="' + esc(m.slot) + '" data-pid="' + esc(pid) + '" aria-pressed="' + aan + '" aria-label="' + esc(nm2) + (aan ? ' niet meer erbij' : ' erbij in je patroon') + '">' + (aan ? '✓' : '＋') + '</button></div>';
      });
      h += '</div>';
    }
    h += '<button class="btn main" style="width:100%;margin-top:10px" type="button" data-act="normbijwerk" data-dow="' + dag + '" data-slot="' + esc(m.slot) + '">Werk dit moment bij</button>';
    h += '<button class="btn" style="width:100%;margin-top:8px" type="button" data-act="normniets" data-dow="' + dag + '" data-slot="' + esc(m.slot) + '">Niets — laat zoals het is</button>';
    return h;
  }
  function wisMomentTiks(dag, slot) {
    ['patWeg', 'patErbij'].forEach(function (f) {
      if (!S[f]) return;
      Object.keys(S[f]).forEach(function (k) { if (k.indexOf(dag + ':' + slot + ':') === 0) delete S[f][k]; });
    });
  }
  function renderNormaal() {
    var b = $('normaalbody'); if (!b) return;
    // v50.6--keuring: horizontale rij dagblokjes, alles dicht, één tegelijk; Alles leegmaken = één knop (dubbele tik)
    var h = '<div class="seg" style="margin-top:10px"><button class="pill" type="button" data-act="normleeg">' + (S.normaalLeeg ? 'Zeker weten?' : '🗑️ Alles leegmaken') + '</button></div>';
    // wens 8 nov: week-label — naar welke week de klokjes-koppeling kijkt
    var wkA2 = S.start, wkB2 = addDays(S.start, 6);
    var dezeWeek = fmtId(S.start) <= vandaagId() && vandaagId() <= fmtId(wkB2);
    h += '<p class="hint zz" style="margin:10px 0 0">Kijkt naar: ' + DOW[wkA2.getDay()].toLowerCase() + ' ' + short(wkA2) + ' t/m ' + DOW[wkB2.getDay()].toLowerCase() + ' ' + short(wkB2) +
      (dezeWeek ? '' : ' · <button type="button" data-act="today" style="border:none;background:none;color:var(--accent-text);cursor:pointer;padding:0;font:inherit;text-decoration:underline">↺ naar deze week</button>') + '</p>';
    h += '<div class="seg mvact" style="margin-top:12px">' + [1, 2, 3, 4, 5].map(function (d) {
      return '<button class="pill" type="button" data-act="normdag" data-dow="' + d + '" aria-pressed="' + (S.normDag === d) + '">' + esc(DOW[d].slice(0, 2)) + '</button>';
    }).join('') + '</div>';
    var dag = S.normDag || 0;
    if (dag) {
      var pat = normaalVoor(dag);
      h += '<div class="icatpanel" style="margin-top:12px"><p style="margin:0 0 4px;font-weight:700;font-size:16px">' + cap(DOW[dag]) + (pat.length ? ' <span class="hint" style="font-weight:400">(' + pat.length + ')</span>' : '') + '</p>';
      alleEetMomenten(dag).forEach(function (m) {
        var items = pat.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r.slot === m.slot; });
        var edit = !!(S.normKlok && S.normKlok.dow === dag && S.normKlok.slot === m.slot); // harmonica: één moment tegelijk in de bewerk-vorm
        h += '<details class="grp"' + (edit ? ' open' : '') + ' style="margin-top:10px"><summary style="padding:12px 14px; font-size:16px; cursor:pointer;"><span>' + esc(m.t) + '</span>';
        if (items.length) h += '<span class="gcnt" style="margin-left:auto; background:var(--accent); color:var(--on-accent); border-radius:99px; padding:0 8px; font-size:12px; font-weight:bold;">' + items.length + '</span>';
        h += '<button class="klok' + (edit ? ' open' : '') + '" type="button" data-act="normklok" data-dow="' + dag + '" data-slot="' + esc(m.slot) + '" aria-pressed="' + edit + '" aria-label="Werk ' + esc(m.t) + ' bij met wat je deze ' + DOW[dag] + ' at" title="Week naar patroon: ' + esc(m.t) + '">🕒</button></summary><div style="padding:0 10px 10px">';
        if (edit) { h += normEditHtml(dag, m); }
        else items.forEach(function (x) {
          var rc0 = x.r.rid ? (S.recipes || []).filter(function (q) { return q.id === x.r.rid; })[0] : null; // wens 8 nov: 🍽-look voor recepten
          var p = prodById(x.r.pid), nm = rc0 ? '🍽 ' + rc0.name : (p ? p.n : '(product niet meer gevonden)');
          var antlS = (p && p.aantal > 0 && p.aantalWoord) ? p.aantalWoord : null;
          var stp = (x.r.u === 'stuk' || (p && HUISMATEN[x.r.u] != null) || (antlS && x.r.u === antlS)) ? 1 : 25; // v58.4: normale stapjes — stuk/eigen woord ±1, gram/ml ±25 (was altijd ±0,5)
          h += '<div class="orow" style="margin-top:6px;"><button class="opt" type="button" data-act="normkies" data-dow="' + dag + '" data-slot="' + esc(m.slot) + '" data-i="' + x.i + '"><span class="on">' + esc(nm) + '<small>' + (rc0 ? 'recept — tik om te vervangen' : esc(fmtN(x.r.amt)) + ' ' + esc(x.r.u) + ' — tik om te vervangen') + '</small></span></button>' +
            (rc0 ? '' : '<span class="zegstap" style="margin-top:6px"><button class="pill" type="button" data-act="normstep" data-dow="' + dag + '" data-slot="' + esc(m.slot) + '" data-i="' + x.i + '" data-d="-' + stp + '" aria-label="Minder">−</button>' +
            '<b>' + esc(fmtN(x.r.amt)) + '</b>' +
            '<button class="pill" type="button" data-act="normstep" data-dow="' + dag + '" data-slot="' + esc(m.slot) + '" data-i="' + x.i + '" data-d="' + stp + '" aria-label="Meer">+</button></span>') +
            '<button class="delbtn" type="button" data-act="normdel" data-dow="' + dag + '" data-slot="' + esc(m.slot) + '" data-i="' + x.i + '" aria-label="Haal ' + esc(nm) + ' weg">×</button></div>';
        });
        if (!edit) h += '<button class="toevoegknop" type="button" data-act="normopen" data-dow="' + dag + '" data-slot="' + esc(m.slot) + '" style="margin-top:8px">+ Toevoegen</button>';
        h += '</div></details>';
      });
      h += '</div>';
    }
    b.innerHTML = h;
  }

  // ---------- DEEL B: "Zeg wat je at" (uitklapbaar blok bovenaan Week, standaard dicht) ----------
  var ZEG_EENHEDEN = ['snee', 'plak', 'stuk', 'bakje', 'gram', 'portie', 'ml', 'liter'];
  var ZEG_MAPIJS = { ochtend: 'Bij opstaan', tussendoor: 'Pauze', lunch: 'Lunch', middag: 'Middag', avond: 'Avondeten', avondblok: 'Avondblok', nacht: 'Nacht', extra: 'Extra, buiten het schema' };
  // De dag die open staat (géén koppeling met de klok); anders vandaag als die in de getoonde week zit, anders de eerste dag
  function zegDoelId() {
    var openIds = Object.keys(S.open || {});
    if (openIds.length) return openIds[0];
    if (fmtId(S.start) <= todayId && todayId <= fmtId(addDays(S.start, 6))) return todayId;
    return fmtId(S.start);
  }
  function zegDoelTekst(id) {
    var p = id.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    return cap(DOW[dt.getDay()]) + ' ' + short(dt);
  }
  function zegMomentVan(naam, ms) {
    var n = String(naam || '').trim();
    var namen = ms.map(function (m) { return m.t; });
    if (namen.indexOf(n) >= 0) return n;
    var g = ZEG_MAPIJS[String(n).toLowerCase()];
    if (g && namen.indexOf(g) >= 0) return g;
    if ((n === 'Lunch' || g === 'Lunch') && namen.indexOf('Lunch') < 0 && namen.indexOf('Kleine lunch') >= 0) return 'Kleine lunch';
    if (namen.indexOf('Extra, buiten het schema') >= 0) return 'Extra, buiten het schema';
    return namen[namen.length - 1] || 'Extra, buiten het schema';
  }
  function kiesHtml(kies, doel, i) { // v51.13 deel 3: meerdere kandidaten -> eerst rustig regeltje "X opties gevonden, tik om te kiezen"; na tik top-3 kaartjes + "Meer opties (X)"-deurtje; 1 kandidaat = meteen tonen (kiesHtml geeft dan '')
    if (!kies || kies.length < 2) return '';
    function kaart(k, ki) {
      return '<button class="fchip" type="button" style="text-align:left" data-act="kieskand" data-doel="' + doel + '" data-i="' + i + '" data-k="' + ki + '">' + esc(k.naam) + ' <span class="hint">' + (k.compleet ? '· alle waardes' : '· alleen kcal') + '</span></button>';
    }
    var top3 = kies.slice(0, 3), rest = kies.slice(3);
    return '<div style="margin-top:6px"><details class="per"><summary>' + kies.length + ' opties gevonden — tik om te kiezen</summary><div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">' +
      top3.map(function (k, ki) { return kaart(k, ki); }).join('') + '</div>' +
      (rest.length ? '<details class="per meer" style="margin-top:6px"><summary>Meer opties (' + rest.length + ')</summary><div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">' + rest.map(function (k, ki) { return kaart(k, ki + 3); }).join('') + '</div></details>' : '') +
      '</details></div>';
  }
  // ---- v51.13 kies-flow: uitklap-knoppen (vaste keuzes / recepten / nieuw) ----
  var ZEG_STOPW = { de:1, het:1, een:1, van:1, en:1, met:1, per:1, in:1, op:1, aan:1, voor:1, bij:1, zonder:1, ook:1, wat:1, niet:1, nog:1, uit:1, naar:1, als:1, dan:1, je:1, mijn:1 };
  // v53.1: het zeg-kaartje staat vast bovenaan het Week-scherm (zegHtml); de kies-flow staat in de open dag
  function zegVoorstelHtml(v) {
    var p = v.doel.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    var ms = eetMomenten(dt.getDay(), dayDoc(v.doel));
    var h = '<div class="icatpanel" style="margin-top:10px">';
    if (v.twijfel) h += '<p style="margin:0 0 8px"><b>🤔 De AI twijfelt of alles goed verstaan is — klopt dit voorstel?</b></p>';
    h += '<p class="hint zz" style="margin:0 0 8px">AI-voorstel voor <b>' + esc(zegDoelTekst(v.doel)) + '</b> — pas gerust aan, of laat zoals het is.</p>';
    v.producten.forEach(function (pr, i) {
      // v50.7 test (idee 2): onbekend product = DICHT blokje "Nieuw product" met bewerkbare waardes; prijs blijft leeg
      var isRec = !!pr.rid;
      var bestaand = !isRec && !!findProd(pr.naam);
      h += (bestaand || isRec) ? '<div class="zegprod">' : '<details class="zegprod grp" style="margin-top:8px"><summary><span>' + (pr.wasRec ? '🍰 Als product behandeld: ' : '🆕 Nieuw product: ') + '<b>' + esc(pr.naam) + '</b></span></summary><div style="padding:0 4px 8px">';
      h += '<b>' + esc(pr.aiKeuze || pr.naam) + '</b> <span class="hint" style="margin:0">' + (isRec ? '🎽 uit mijn recepten' : bestaand ? '· AI-voorstel' : pr.wasRec ? '· als product behandeld — waardes hieronder vóór bevestigen aanpassen' : '· nieuw — waardes kun je hieronder aanpassen vóór je bevestigt') + '</span>' + (pr.aiKeuze ? ' <span class="hint" style="margin:0">· je zocht: ' + esc(pr.naam) + '</span>' : '') +
        '<button class="delbtn" style="float:right" type="button" data-act="zegblokweg" data-i="' + i + '" aria-label="Dit blokje weghalen">×</button>' +
        (pr.kies && pr.kies.length > 1 ? kiesHtml(pr.kies, 'zeg', i) : '') +
        '<div class="zegstap"><button class="pill" type="button" data-act="zegmin" data-i="' + i + '" aria-label="Halve minder">−</button>' +
        '<input class="zegamt" data-i="' + i + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(fmtN(pr.aantal)) + '" aria-label="Aantal">' +
        '<button class="pill" type="button" data-act="zegplus" data-i="' + i + '" aria-label="Halve meer">+</button>' +
        '<select class="zegunit" data-i="' + i + '" aria-label="Eenheid">' + (function () { var bp = bestaand ? findProd(pr.naam) : null; var aw = bp && bp.aantalWoord; return (aw && ZEG_EENHEDEN.indexOf(aw) < 0) ? ZEG_EENHEDEN.concat([aw]) : ZEG_EENHEDEN; })().map(function (e) { return '<option value="' + e + '"' + (e === pr.eenheid ? ' selected' : '') + '>' + e + '</option>'; }).join('') + '</select></div>' +
        '<div class="zegstap"><label class="hint" style="margin:0" for="zegmom' + i + '">op welk moment:</label>' +
        '<select class="zegmom" id="zegmom' + i + '" data-i="' + i + '">' + ms.map(function (m) { return '<option value="' + esc(m.t) + '"' + (m.t === pr.moment ? ' selected' : '') + '>' + esc(m.t) + '</option>'; }).join('') + '</select></div>' +
        (isRec ? '<div class="zegstap" style="margin-top:6px"><button class="pill" type="button" data-act="zegrec2prod" data-i="' + i + '">🍽 Toch als product</button></div>' : '');
      if (!bestaand && !isRec) { var bronLab = pr._busy ? '⏳ opzoeken…' : (pr.opgezocht && bronIsUrl(pr.bron)) ? ('opgezocht' + (pr.bron ? ' — bron: ' + esc(pr.bron) : '')) : 'geschat'; h += '<div class="zegstap"><label class="hint zz" style="margin:0">kcal per 100 g (' + bronLab + ' — controleer zelf):</label>' +
        '<input class="zegkcal" data-zkcal="' + i + '" type="text" inputmode="decimal" autocomplete="off" placeholder="bijv. 230" value="' + esc(pr.kcal100 != null ? String(pr.kcal100).replace('.', ',') : '') + '" aria-label="Kcal per 100 g van nieuw product"></div>' +
        '<div class="zegstap"><label class="hint zz" style="margin:0">Prijs in € (' + (pr._busy ? '⏳ opzoeken…' : (pr._prijsBron || 'geschat')) + ' — géén vastfeit, je kunt het aanpassen):</label>' +
        '<input class="zegprijs" data-zprijs="' + i + '" type="text" inputmode="decimal" autocomplete="off" placeholder="bijv. 1,99" value="' + esc(pr.prijs != null ? String(pr.prijs).replace('.', ',') : '') + '" aria-label="Prijs van nieuw product (opgezocht of geschat)"></div>' +
        '<div class="zegstap"><label class="hint" style="margin:0">Voedingswaarden per 100 g (' + bronLab + ' — leeg = onbekend):</label>' +
        '<div class="grid2">' + W_FIELDS.map(function (fw) {
          return '<div><label class="hint" style="margin:0 0 2px;display:block">' + esc(fw[1]) + '</label><input class="zegw" data-zw="' + i + ':' + fw[0] + '" type="text" inputmode="decimal" autocomplete="off" placeholder="—" value="' + esc(pr.w && pr.w[fw[0]] != null ? String(pr.w[fw[0]]).replace('.', ',') : '') + '" aria-label="' + esc(fw[1]) + ' per 100 g van nieuw product"></div>';
        }).join('') + '</div></div>'; }
      h += (bestaand || isRec) ? '</div>' : '</div></details>';
    });
    if (v.notitie) h += '<p class="hint zz" style="margin:8px 0 0">📝 ' + esc(v.notitie) + '</p>';
    h += '<div class="zegstap" style="margin-top:10px"><button class="btn main" type="button" data-act="zegzet">✓ In de dag zetten</button>' +
      '<button class="btn" type="button" data-act="zegweg">Laat maar</button></div></div>';
    return h;
  }
  function mistralSleutel() {
    var k = '';
    try { k = localStorage.getItem('eetweek.gemini.sleutel') || ''; } catch (e) { }
    var ki = $('key'); if (!k && ki) k = String(ki.value || '').trim();
    if (!k) throw new Error('Plak eerst je Mistral API-sleutel bij ⚙️ Instellingen.');
    return k;
  }
  function mistralModel() {
    var m = '';
    try { var o = JSON.parse(localStorage.getItem('eetweek.gemini.keuzes') || '{}'); m = (o && o.m) || ''; } catch (e) { }
    var mi = $('model'); if (!m && mi) m = String(mi.value || '').trim();
    return m || 'mistral-medium-latest'; // v58.4: model staat in localStorage (bewaard via Instellingen), standaard mistral-medium-latest — werkt op alle pagina's
  }
  // v58.4: Mistral-blok (APP.gem) nu op ALLE pagina's geladen — kassabon en etiketten-scanner werken ook op Week/Producten/Instellingen (daarvoor: "Mistral is niet geladen"); op Kookhulp houdt de eigen blok (hierboven) alles zoals het was
  if (!APP.gem) (function () {
    var GEM_API = 'https://api.mistral.ai/v1/';
    function gemJsonUit(tekst) {
      var t = String(tekst || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      var a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a < 0 || b < a) throw new Error('Mistral gaf geen bruikbaar antwoord. Probeer het later opnieuw.');
      return JSON.parse(t.slice(a, b + 1));
    }
    function gemUitleg(res, tekst) {
      var s = res.status;
      if (s === 401 || s === 403) return 'Mistral accepteert deze sleutel niet — controleer je sleutel bij ⚙️ Instellingen.';
      if (s === 404) return 'Dit model is nu niet beschikbaar — kies een ander model bij ⚙️ Instellingen.';
      if (s === 429 || s === 503) return 'Mistral is even druk — probeer het zo opnieuw.';
      if (s === 402) return 'Je Mistral-tegoed of betaalmethode klopt niet (kijk op console.mistral.ai bij Facturering).';
      return 'Mistral kan nu niet, probeer het later opnieuw.';
    }
    async function gemPost(model, body) {
      var sys = ((body.systemInstruction && body.systemInstruction.parts) || []).map(function (p) { return p.text || ''; }).join('\n');
      var berichten = [];
      if (sys) berichten.push({ role: 'system', content: sys });
      (body.contents || []).forEach(function (c) {
        var stuk = [];
        (c.parts || []).forEach(function (p) {
          if (p.text) stuk.push({ type: 'text', text: p.text });
          else if (p.inline_data) stuk.push({ type: 'image_url', image_url: { url: 'data:' + p.inline_data.mime_type + ';base64,' + p.inline_data.data } });
        });
        if (stuk.length) berichten.push({ role: c.role === 'model' ? 'assistant' : 'user', content: stuk });
      });
      var vraag = { model: model, messages: berichten };
      if (body.generationConfig && body.generationConfig.responseMimeType === 'application/json') vraag.response_format = { type: 'json_object' };
      var ctl = new AbortController(), tm = setTimeout(function () { ctl.abort(); }, 90000);
      try {
        return await fetch(GEM_API + 'chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + mistralSleutel() }, body: JSON.stringify(vraag), signal: ctl.signal });
      } catch (e) {
        throw new Error('Mistral kan nu niet, probeer het later opnieuw.');
      } finally { clearTimeout(tm); }
    }
    function gemVerklein(file) {
      return new Promise(function (ok, nee) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () {
          var max = 1600, f = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement('canvas'); c.width = Math.round(img.width * f); c.height = Math.round(img.height * f);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          ok(c.toDataURL('image/jpeg', 0.88).split(',')[1]);
        };
        img.onerror = function () { URL.revokeObjectURL(url); nee(new Error('Deze foto kan ik niet openen. Probeer een jpg of png.')); };
        img.src = url;
      });
    }
    APP.gem = { post: gemPost, verklein: gemVerklein, jsonUit: gemJsonUit, uitleg: gemUitleg, model: function () { return mistralModel(); } };
  })();
  function zegSys(ms, recs) {
    var mn = ms.map(function (m) { return m.t; }).join(', ');
    recs = Array.isArray(recs) ? recs : [];
    return 'Je bent een API-assistent voor het eetdagboek Mijn Eetboek. Zet informele, snel getypte tekst (mogelijk zonder leestekens of aan elkaar geplakte woorden) om in gestructureerde JSON. ' +
      "Vertaalregels: 'brood' of 'boterham' = AH Tijger volkoren (eenheid snee), 'ham' = Schouderham (eenheid plak), 'kwark' = Magere kwark (eenheid bakje), 'drinkyoghurt' of 'optimel' in de ochtend = Optimel proteïne drinkyoghurt peer (eenheid bakje), 'hummus' = Hummus (eenheid bakje). " +
      "Product-zonder-merk-regel: noemt de gebruiker ALLEEN een productnaam zonder merk of supermarkt (bijvoorbeeld 'hummus' of 'pindakaas'), dan is dat gewoon een product: neem de naam letterlijk over, kies de best passende eenheid (bakje/gram/stuk), en probeer met je web search alsnog de actuele voedingswaarden per 100 g en prijs op te zoeken — ook zonder merknaam. Zet zoiets NOOIT in de notitie. " +
      "Verpakkings-regel: kies de eenheid die past bij de verpakking — zak (chips, snoep, rijstwafels), pak, doos, blik, fles of potje = 'stuk'; alleen een yoghurt of dip in een kuipje/bakje = 'bakje'. Nooit 'bakje' bij een zak. " +
      "Bron-regel: zet per product \"opgezocht\" op true ALLEEN als je live web search écht een supermarkt- of merkbron vond — zet die bron dan in \"bron\" (site + productpagina). Lukte de web search niet of vond hij niets? Zet \"opgezocht\" op false en \"bron\" leeg; de waarden zijn dan een schatting uit je eigen kennis. " +
      'Woordgetallen als getal schrijven: anderhalve = 1.5, halve = 0.5, kwart = 0.25, twee = 2. Breuken zijn geldige aantallen: 0.5, 1.5 en 0.25. ' +
      "Aantal-regel: noemt de gebruiker géén aantal, zet dan 1 als aantal, twijfel op true en vermeld in de notitie dat er geen aantal is gehoord (bijv. 'geen aantal gehoord — 1 genomen'). " +
      'Moment-regel: geef élk product het moment waarop het gegeten werd, uit de dagblokken van de gebruiker: ' + mn + '. Geldt de hele zin voor één moment, dan geldt dat moment voor alle producten. Noemt de gebruiker meerdere momenten of tijden in één zin, verdeel de producten dan over die momenten. ' +
      "Tijden zijn moment-aanduiders en nooit een product: kies het blok dat het best past (vóór 7:45 = het vroegste ochtendblok, rond 7:45 = Ontbijt, rond 10:00 = Pauze, rond 12:30 of 'lunch' = het lunchblok van die dag, 's middags of tussen 14:00 en 18:00 = Middag, rond etenstijd of 's avonds = Avondeten, laat op de avond = Avondblok, na het slapengaan of midden in de nacht = Nacht); een exact genoemd tijdstip noem je eventueel óók in de notitie. Twijfel je over het moment, kies dan gewoon het best passende blok — de gebruiker zet het daarna zelf goed in het keuzevakje, dat hoeft niet in de notitie. Past het nergens bij of zegt de gebruiker expliciet 'extra', kies dan Extra, buiten het schema. " +
      "Woorden als 'ook', 'nog een' of 'hetzelfde' betekenen dat het vorige product herhaald wordt op het nieuwe moment. Dingen die geen eten zijn (zoals medicatie) gaan alléén in het veld notitie, nooit als product. Onbekende producten benoem je zoals de gebruiker zei, zonder verzonnen vertalingen. " +
      "Let óók op: 'boterhammen' (meervoud) kan een snel getypt 'boterham met' zijn — reken dan 1 boterham, zet twijfel op true en vermeld het in de notitie; alleen bij een écht genoemd aantal reken je dat aantal. Corrigeer nooit bestaande productnamen die toevallig op een verspreking lijken: 'Schouderham' is gewoon ham. Blijft een woord onduidelijk, verzin dan géén product: zet het in de notitie en zet twijfel op true. " +
      "Je bent een live supermarkt-checker. Noemt de gebruiker een merk of supermarkt (zoals AH of Jumbo), gebruik dan je live web search om direct de actuele prijs en de voedingswaarden per 100 g op te zoeken op de website van die Nederlandse supermarkt. Staat er geen merk bij? Geef dan direct een universele gemiddelde schatting uit je eigen kennis. Vul prijs ALLEEN in als je er een bron voor hebt of het zeker weet — anders laat je het weg (nooit een gok). Vul voedingswaarden_per_100g (eiwit, suiker, verzadigd_vet, zout, vezels) in als je die kunt opzoeken of zeker weet; bij twijfel laat je een veld weg. Geef de data ALTIJD direct terug in de velden van het JSON-antwoord. " +
      "Recept-regel: de gebruiker heeft deze recepten: " + (recs.length ? recs.join(', ') : '(geen)') + ". Noemt de gebruiker er (ongeveer) één van — bijvoorbeeld 'eigen muffin', 'muffin' of 'mijn kwark-fris' — zet dan bij dat item het veld \"recept\" op de exacte receptnaam uit die lijst en laat \"naam\" leeg; het is dan géén product maar een recept. " +
      'Antwoord alléén met een JSON-object met precies deze velden: producten (lijstje met per item óf naam óf recept, plus aantal als getal, eenheid uit: ' + ZEG_EENHEDEN.join(', ') + ', moment uit: ' + mn + ', en optioneel kcal_per_100g, prijs, voedingswaarden_per_100g, opgezocht en bron), notitie (lege string als er niets is) en twijfel (false als er niets te melden is).';
  }
  function zegSchema(ms) {
    return {
      type: 'object',
      properties: {
        producten: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              naam: { type: 'string' },
              recept: { type: 'string' },
              aantal: { type: 'number' },
              eenheid: { type: 'string', enum: ZEG_EENHEDEN },
              moment: { type: 'string', enum: ms.map(function (m) { return m.t; }) },
              kcal_per_100g: { type: 'number' },
              prijs: { type: 'number' },
              opgezocht: { type: 'boolean' },
              bron: { type: 'string' },
              voedingswaarden_per_100g: { type: 'object', properties: { eiwit: { type: 'number' }, suiker: { type: 'number' }, verzadigd_vet: { type: 'number' }, zout: { type: 'number' }, vezels: { type: 'number' } }, additionalProperties: false }
            },
            required: ['aantal', 'eenheid', 'moment'],
            additionalProperties: false
          }
        },
        notitie: { type: 'string' },
        twijfel: { type: 'boolean' }
      },
      required: ['producten', 'notitie', 'twijfel'],
      additionalProperties: false
    };
  }
  // Bestaande AI-kern: chat.completions met de app-sleutel en -model; vangnetten json_schema → json_object → zonder opmaak-eis
  async function zegSchatKern(zin, ms, recs) {
    var body = {
      model: mistralModel(),
      messages: [{ role: 'system', content: zegSys(ms, recs) }, { role: 'user', content: "Verwerk deze invoer: '" + zin + "'" }],
      tools: [{ type: 'web_search' }], tool_choice: 'auto',
      response_format: { type: 'json_schema', json_schema: { schema: zegSchema(ms), name: 'eetboek_voorstel', strict: true } }
    };
    function stuur() {
      return fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + mistralSleutel() },
        body: JSON.stringify(body)
      });
    }
    var resp;
    try {
      resp = await stuur();
      if (!resp.ok && resp.status === 400 && body.tools) { delete body.tools; delete body.tool_choice; resp = await stuur(); } // model kent geen web_search: val terug zonder tools
      if (!resp.ok && resp.status !== 401) { body.response_format = { type: 'json_object' }; resp = await stuur(); }
      if (!resp.ok && resp.status !== 401) { delete body.response_format; resp = await stuur(); }
    } catch (e) {
      if (navigator.onLine === false) throw new Error('Geen internet — de AI heeft verbinding nodig.');
      throw new Error('De aanroep lukte niet. Check je internet en probeer opnieuw.');
    }
    if (!resp.ok) {
      if (resp.status === 401) throw new Error('De sleutel lijkt niet te kloppen (401). Check of hij helemaal geplakt is bij ⚙️ Instellingen.');
      var ft = '';
      try { ft = await resp.text(); try { var fj = JSON.parse(ft); if (fj && fj.message) ft = fj.message; } catch (e2) { } } catch (e) { }
      ft = String(ft || '').slice(0, 300);
      throw new Error('Mistral gaf een fout (' + resp.status + ').' + (ft ? ' ' + ft : '') + ' Probeer het nog eens.');
    }
    var data = await resp.json();
    try { console.log('[zeglive] web_search tool_calls:', JSON.stringify((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.tool_calls) || []), 'citations:', JSON.stringify((data.choices && data.choices[0] && data.choices[0].message.citations) || data.citations || [])); } catch (e) {}
    var txt = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    try { return JSON.parse(String(txt).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()); }
    catch (e) { throw new Error('De AI gaf een antwoord dat niet leesbaar was. Probeer het nog eens.'); }
  }
  // Zet een AI-product om in een dag-entry (gekoppeld aan eigen product als die er is, anders als losse naam)
  // keuring 8 nov (deel 1): na "Toch als product" start dezelfde opzoek-route als bij een nieuw product
  async function zegOpzoekProd(pr) {
    if (!pr || !S.zegVoorstel) return;
    pr._busy = true; zegLiveUpdate(pr);
    try {
      var res = await opzoekRoute(pr.naam);
      if (!S.zegVoorstel) return;
      if (res.kcal100 != null) pr.kcal100 = res.kcal100;
      if (res.w) pr.w = Object.assign({}, pr.w || {}, res.w);
      if (res.prijs != null) pr.prijs = res.prijs;
      pr.opgezocht = res.opgezocht === true;
      pr.bron = res.bron || '';
      if (res.keuze) pr.aiKeuze = res.keuze;
      if (res.kandidaten && res.kandidaten.length > 1) pr.kies = res.kandidaten; else pr.kies = null;
    } catch (e) { /* stilletjes mislukt: velden blijven leeg en bewerkbaar */ }
    pr._busy = false; zegLiveUpdate(pr);
  }
  // v51: live status/velden per product updaten zonder volle render (geen scroll-reset/dichtklappen)
  function zegLiveUpdate(pr) {
    var zv = S.zegVoorstel; if (!zv) return;
    var i = (zv.producten || []).indexOf(pr); if (i < 0) return;
    var bronLab = pr._busy ? '⏳ opzoeken…' : (pr.opgezocht && pr.bron && bronIsUrl(pr.bron)) ? ('opgezocht' + (pr.bron ? ' — bron: ' + pr.bron : '')) : 'geschat';
    var kc = document.querySelector('[data-zkcal="' + i + '"]');
    if (kc) { if (pr.kcal100 != null) kc.value = String(pr.kcal100).replace('.', ','); var l1 = kc.closest('.zegstap') && kc.closest('.zegstap').querySelector('label.hint'); if (l1) l1.textContent = 'kcal per 100 g (' + bronLab + ' — controleer zelf):'; }
    var pe = document.querySelector('[data-zprijs="' + i + '"]');
    if (pe) { if (pr.prijs != null) pe.value = String(pr.prijs).replace('.', ','); var l2 = pe.closest('.zegstap') && pe.closest('.zegstap').querySelector('label.hint'); if (l2) l2.textContent = 'Prijs in € (' + (pr._busy ? '⏳ opzoeken…' : (pr._prijsBron || 'geschat')) + ' — géén vastfeit, je kunt het aanpassen):'; }
    W_FIELDS.forEach(function (fw) {
      var we = document.querySelector('[data-zw="' + i + ':' + fw[0] + '"]');
      if (we && pr.w && pr.w[fw[0]] != null) we.value = String(pr.w[fw[0]]).replace('.', ',');
      if (we) { var l3 = we.closest('.zegstap') && we.closest('.zegstap').querySelector('label.hint'); if (l3 && !l3.dataset.done) { l3.textContent = 'Voedingswaarden per 100 g (' + bronLab + ' — leeg = onbekend):'; l3.dataset.done = '1'; } }
    });
  }
  // keuring 8 nov (deel 2+3): opzoek-route = plank -> Open Food Facts (kcal/voedingswaarden) -> Checkjebon (alleen prijs) -> Mistral (fallback, = "geschat")
  // v55.0 (12 nov) — NEVO-referentiebestand (NL basisproducten, per 100 g: kcal + macro's), stil in de app gebakken.
  // NIET zichtbaar als producten in de Plank; alleen als stille bron ná de eigen Plank en vóór OFF/Checkjebon/AI.
  var NEVO = {
    'brood volkoren': { kcal: 247, eiwit: 9.0, koolhydraten: 41, vet: 3.3, vezel: 6.5, zout: 1.0, alias: ['volkoren brood', 'bruin brood', 'boterham volkoren'] },
    'brood wit': { kcal: 265, eiwit: 9.0, koolhydraten: 49, vet: 3.2, vezel: 2.5, zout: 1.1, alias: ['witbrood', 'boterham wit', 'casino wit'] },
    'brood meergranen': { kcal: 255, eiwit: 9.5, koolhydraten: 43, vet: 3.5, vezel: 6.0, zout: 1.0, alias: ['meergranenbrood', 'volkoren meergranen'] },
    'rijst wit gekookt': { kcal: 130, eiwit: 2.7, koolhydraten: 28, vet: 0.3, vezel: 0.4, zout: 0.0, alias: ['rijst', 'witte rijst'] },
    'rijst volkoren gekookt': { kcal: 112, eiwit: 2.6, koolhydraten: 23, vet: 0.9, vezel: 1.8, zout: 0.0, alias: ['volkoren rijst', 'bruine rijst'] },
    'pasta gekookt': { kcal: 131, eiwit: 5.0, koolhydraten: 25, vet: 1.1, vezel: 1.8, zout: 0.0, alias: ['pasta wit', 'spaghetti gekookt', 'macaroni gekookt'] },
    'pasta volkoren gekookt': { kcal: 124, eiwit: 5.0, koolhydraten: 22, vet: 1.3, vezel: 4.5, zout: 0.0, alias: ['volkoren pasta', 'spaghetti volkoren'] },
    'aardappelen gekookt': { kcal: 76, eiwit: 2.0, koolhydraten: 15, vet: 0.1, vezel: 1.8, zout: 0.0, alias: ['aardappel', 'gekookte aardappel', 'kriel'] },
    'kipfilet gebakken': { kcal: 165, eiwit: 31, koolhydraten: 0, vet: 3.6, vezel: 0, zout: 0.2, alias: ['kip', 'kipfilet', 'gebakken kip'] },
    'gehakt rund mager': { kcal: 178, eiwit: 26, koolhydraten: 0, vet: 8.0, vezel: 0, zout: 0.2, alias: ['gehakt', 'rundvlees gehakt', 'tartaar'] },
    'zalm': { kcal: 208, eiwit: 20, koolhydraten: 0, vet: 13, vezel: 0, zout: 0.1, alias: ['zalmfilet', 'verse zalm'] },
    'tonijn op water blik': { kcal: 116, eiwit: 26, koolhydraten: 0, vet: 1.0, vezel: 0, zout: 0.5, alias: ['tonijn blik', 'tonijn op water'] },
    'ei gekookt': { kcal: 155, eiwit: 13, koolhydraten: 1.1, vet: 11, vezel: 0, zout: 0.3, alias: ['gekookt ei', 'ei hard'] },
    'kaas jong belegen 48+': { kcal: 382, eiwit: 26, koolhydraten: 0, vet: 31, vezel: 0, zout: 2.0, alias: ['kaas 48+', 'jonge kaas', 'belegen kaas', 'plak kaas'] },
    'kaas smeer 30+': { kcal: 320, eiwit: 22, koolhydraten: 2, vet: 24, vezel: 0, zout: 1.8, alias: ['smeerkaas', '30+ smeerkaas'] },
    'ham gekookt': { kcal: 110, eiwit: 18, koolhydraten: 1, vet: 3.0, vezel: 0, zout: 2.2, alias: ['gekookte ham', 'ham plak'] },
    'magere kwark': { kcal: 66, eiwit: 11, koolhydraten: 4, vet: 0.2, vezel: 0, zout: 0.1, alias: ['kwark mager', 'magere kwark 0%'] },
    'griekse yoghurt 0%': { kcal: 57, eiwit: 10, koolhydraten: 4, vet: 0.2, vezel: 0, zout: 0.1, alias: ['yoghurt 0%', 'griekse yoghurt mager'] },
    'melk halfvol 1.5%': { kcal: 46, eiwit: 3.4, koolhydraten: 4.8, vet: 1.5, vezel: 0, zout: 0.1, alias: ['melk', 'halfvolle melk'] },
    'melk mager 0.5%': { kcal: 34, eiwit: 3.5, koolhydraten: 4.9, vet: 0.5, vezel: 0, zout: 0.1, alias: ['magere melk'] },
    'kaasbroodje': { kcal: 300, eiwit: 12, koolhydraten: 32, vet: 12, vezel: 2, zout: 1.5, alias: [] },
    'banaan': { kcal: 89, eiwit: 1.1, koolhydraten: 23, vet: 0.3, vezel: 2.6, zout: 0.0, alias: ['banaan middel'] },
    'appel': { kcal: 52, eiwit: 0.3, koolhydraten: 14, vet: 0.2, vezel: 2.4, zout: 0.0, alias: ['appel middel', 'elstar'] },
    'sinaasappel': { kcal: 47, eiwit: 0.9, koolhydraten: 12, vet: 0.1, vezel: 2.3, zout: 0.0, alias: ['sinaasappel middel'] },
    'broccoli gekookt': { kcal: 34, eiwit: 2.8, koolhydraten: 7, vet: 0.4, vezel: 2.6, zout: 0.0, alias: ['broccoli'] },
    'bloemkool gekookt': { kcal: 25, eiwit: 1.9, koolhydraten: 5, vet: 0.3, vezel: 2.0, zout: 0.0, alias: ['bloemkool'] },
    'spinazie gekookt': { kcal: 23, eiwit: 2.9, koolhydraten: 3.6, vet: 0.4, vezel: 2.2, zout: 0.1, alias: ['spinazie'] },
    'doperwten gekookt': { kcal: 78, eiwit: 5.4, koolhydraten: 14, vet: 0.4, vezel: 5.5, zout: 0.0, alias: ['doperwten', 'verse doperwtjes'] },
    'wortelen gekookt': { kcal: 35, eiwit: 0.8, koolhydraten: 8, vet: 0.2, vezel: 3.0, zout: 0.0, alias: ['wortel', 'winterpeen'] },
    'tomaat': { kcal: 18, eiwit: 0.9, koolhydraten: 3.9, vet: 0.2, vezel: 1.2, zout: 0.0, alias: ['tomaat rauw', 'cherrytomaat'] },
    'komkommer': { kcal: 12, eiwit: 0.7, koolhydraten: 2, vet: 0.1, vezel: 0.5, zout: 0.0, alias: [] },
    'ui rauw': { kcal: 40, eiwit: 1.1, koolhydraten: 9, vet: 0.1, vezel: 1.5, zout: 0.0, alias: ['ui'] },
    'champignons': { kcal: 22, eiwit: 3.1, koolhydraten: 3.3, vet: 0.3, vezel: 1.0, zout: 0.0, alias: ['champignon'] },
    'rode paprika': { kcal: 31, eiwit: 1.0, koolhydraten: 6, vet: 0.3, vezel: 2.1, zout: 0.0, alias: ['paprika rood', 'paprika'] },
    'honing': { kcal: 304, eiwit: 0.3, koolhydraten: 82, vet: 0, vezel: 0.2, zout: 0.0, alias: [] },
    'pindakaas': { kcal: 598, eiwit: 25, koolhydraten: 12, vet: 49, vezel: 6, zout: 1.1, alias: ['pindakaas 100%'] },
    'chocolade puur 70%': { kcal: 546, eiwit: 9.5, koolhydraten: 30, vet: 43, vezel: 11, zout: 0.1, alias: ['pure chocolade', 'chocolade puur'] },
    'havermout': { kcal: 375, eiwit: 13, koolhydraten: 59, vet: 7, vezel: 10, zout: 0.0, alias: ['havermoutvlokken'] },
    'muesli': { kcal: 340, eiwit: 10, koolhydraten: 60, vet: 6, vezel: 8, zout: 0.0, alias: ['crunchy muesli'] },
    'boter': { kcal: 737, eiwit: 0.9, koolhydraten: 0.5, vet: 81, vezel: 0, zout: 0.9, alias: ['roomboter'] },
    'margarine halfvol': { kcal: 360, eiwit: 0, koolhydraten: 0, vet: 40, vezel: 0, zout: 0.4, alias: ['halvarine', 'margarine'] },
    'olijfolie': { kcal: 884, eiwit: 0, koolhydraten: 0, vet: 100, vezel: 0, zout: 0, alias: ['olie olijf'] },
    'mayonaise': { kcal: 680, eiwit: 1.0, koolhydraten: 1.0, vet: 75, vezel: 0, zout: 0.6, alias: ['mayo'] },
    'ketchup': { kcal: 112, eiwit: 1.3, koolhydraten: 24, vet: 0.2, vezel: 0.3, zout: 2.0, alias: ['tomatenketchup'] },
    'suiker': { kcal: 387, eiwit: 0, koolhydraten: 100, vet: 0, vezel: 0, zout: 0, alias: [] },
    'aardappelschijfjes chips': { kcal: 536, eiwit: 6.5, koolhydraten: 50, vet: 33, vezel: 4, zout: 1.8, alias: ['chips', 'chips paprika'] }
  };
  function nevoZoek(naam) { // v55.0 (12 nov): stille NEVO-lookup — hele woorden tegen naam + aliassen; géén product in de Plank
    var qw = normWoorden(naam).filter(function (w) { return w.length > 2; });
    if (!qw.length) return null;
    var keys = Object.keys(NEVO);
    for (var i = 0; i < keys.length; i++) {
      var e = NEVO[keys[i]];
      var woorden = normWoorden(keys[i] + ' ' + (e.alias || []).join(' '));
      if (qw.every(function (w) { return woorden.indexOf(w) >= 0; })) {
        return { naam: keys[i], kcal100: e.kcal, w: { eiwit: e.eiwit, suiker: e.koolhydraten, verz: e.vet, zout: e.zout, vezel: e.vezel }, bron: 'NEVO' };
      }
    }
    return null;
  }
  function metTimeout(promise, ms) { return Promise.race([promise, new Promise(function (res) { setTimeout(function () { res(null); }, ms); })]); } // v55.0 (12 nov): strakke time-out, dan overslaan
  async function opzoekRoute(naam) {
    var plank = findProd(naam);
    var nevo = nevoZoek(naam); // v55.0: vaste volgorde — 1) eigen Plank, 2) stil NEVO-bestand, 3) OFF/Checkjebon (max 2 s), 4) AI-schatting
    var eigenVolledig = !!((plank && plank.kc != null && plank.w && Object.keys(plank.w).length) || (nevo && nevo.kcal100 != null && nevo.w && Object.keys(nevo.w).length));
    var off = null, cb = null, d = {};
    if (!eigenVolledig) { // v57 (13 nov, vaste volgorde 12 nov): zodra Plank óf NEVO een volledig antwoord geeft (kcal + w-waarden) — geen OFF/Checkjebon/Mistral meer; prijs alleen bij een echte bron
      off = await metTimeout(offZoek(naam), 2000); // v55.0 (12 nov): OFF met strakke time-out van max 2 s — dan overslaan
      cb = await metTimeout(checkjebonZoek(naam), 2000); // v55.0 (12 nov): Checkjebon idem, max 2 s — geeft ALLEEN prijzen
      var m = await mistralProductZoek([naam]);
      d = m[0] || {};
    }
    // keurpunt 8 nov: plank leidend — eigen waardes NOOIT overschrijven; lege velden wél per-veld aangevuld (NEVO/OFF, evt. Mistral/web search)
    var kcal100 = (plank && plank.kc != null) ? plank.kc : (nevo && nevo.kcal100 != null) ? nevo.kcal100 : (off && off.kcal100 != null) ? off.kcal100 : (d.kcal_per_100g != null ? d.kcal_per_100g : null);
    var w = {};
    if (plank && plank.w) Object.keys(plank.w).forEach(function (k) { if (plank.w[k] != null) w[k] = plank.w[k]; });
    if (nevo && nevo.w) Object.keys(nevo.w).forEach(function (k) { if (w[k] == null) w[k] = nevo.w[k]; });
    if (off && off.w) Object.keys(off.w).forEach(function (k) { if (w[k] == null) w[k] = off.w[k]; });
    if (d.w) Object.keys(d.w).forEach(function (k) { if (w[k] == null) w[k] = d.w[k]; });
    if (!Object.keys(w).length) w = null;
    var prijs = null, prijsBron = null;
    if (plank && plank.pr != null) { prijs = plank.pr; prijsBron = 'eigen productenplank'; }
    else if (cb && cb.prijs != null && !cb.isEstimate) { prijs = cb.prijs; prijsBron = 'Checkjebon' + (cb.andereSuper ? ' (' + cb.supermarkt + ' — niet jouw winkel)' : ''); } // v51.13: isEstimate -> NOOIT een prijs als 'geschat': leeg laten
    else if (d.prijs != null) { prijs = d.prijs; prijsBron = 'Mistral (echte bron)'; } // Mistral-prijs alleen bij opgezocht=true (nooit een gok); OFF levert nooit een prijs
    var opgezocht = !!(plank || nevo || off || d.opgezocht === true);
    var bron = plank ? 'eigen productenplank' : nevo ? 'NEVO' : (off && off.url ? off.url : (off ? 'Open Food Facts' : (d.opgezocht && d.bron ? d.bron : '')));
    var vlag = (!plank && !nevo && !off && d.kcal_per_100g != null) ? 'controleer even' : ''; // v55.0 (12 nov): AI-schatting op basis van NEVO/Voedingscentrum krijgt het vlaggetje
    var keuze = plank ? plank.n + ' (eigen plank)' : nevo ? nevo.naam + ' (NEVO)' : (off && off.naam) ? off.naam + ' (Open Food Facts)' : (cb && cb.naam) ? cb.naam + ' (Checkjebon)' : ((d.naam || '').trim() || null);
    return { kcal100: kcal100, w: w, prijs: prijs, prijsBron: prijsBron, opgezocht: opgezocht, bron: bron, vlag: vlag, keuze: keuze, kandidaten: (off && off.kandidaten) || null };
  }
  // Open Food Facts (gratis open database): kcal uit energy-kcal_100g (kJ -> kcal als nodig), plus eiwit/suikers/verzadigd vet/zout/vezels
  async function offFetch(url) {
    try {
      var resp = await fetch(url); // v57: custom User-Agent-header weg — browsers negeren die stilletjes
      if (!resp.ok) { await new Promise(function (r) { setTimeout(r, 1500); }); try { resp = await fetch(url); } catch (e2) {} } // v51.13: 1x retry bij 503
      if (!resp.ok) return null;
      return await resp.json();
    } catch (e) { return null; }
  }
  function winkelSuffix(tekst) { // keurpunt 8 nov: elke supermarkt uit de SUPERMARKT-lijst (OFF leest het merkveld — winkelnaam achteraan helpt matchen)
    var u = ' ' + String(tekst || '').toLowerCase() + ' ';
    var winkels = SUPERMARKT.slice().sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < winkels.length; i++) {
      var ws = winkels[i];
      var r = new RegExp('(^|[^a-z0-9])' + ws.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)');
      if (r.test(u)) return ' ' + ws;
    }
    return '';
  }
  function slimmeOpzoekNaam(naam, bronTekst) {
    var sfx = winkelSuffix(bronTekst);
    var n = String(naam || '').trim();
    if (sfx && n.toLowerCase().indexOf(sfx.trim()) < 0) return n + sfx;
    return n;
  }
  // keurpunt 8 nov: OFF-match weegt volledigheid + NL + huismerk mee; bij meerdere kandidaten kies-kaartjes
  async function offZoek(naam) {
    var merk = (findProd(naam) && findProd(naam).merk) || guessMerk(naam) || '';
    var isShop = !!merk && SUPERMARKT.some(function (s) { return normName(s) === normName(merk); });
    var expMerk = (merk && !isShop) ? merk : ''; // keurpunt 8 nov: expliciet genoem merk wint altijd; huismerk-voorrang alleen bij vage/merkloze naam
    var hm = isShop ? huismerkenVan(merk) : [];
    var hmWoorden = [];
    Object.keys(HUISMERK).forEach(function (k) { HUISMERK[k].forEach(function (h) { hmWoorden = hmWoorden.concat(normWoorden(h)); }); });
    var q = encodeURIComponent((String(naam || '').trim() + (merk ? ' ' + merk : '')).trim()); // merk/winkel mee in de OFF-query
    var qHm = (isShop && hm.length) ? encodeURIComponent((String(naam || '').trim() + ' ' + hm.slice(0, 3).join(' ')).trim()) : ''; // huismerken-brug: "lidl smeerkaas" -> ook "milbona smeerkaas ..."
    var fields = 'code,product_name,brands,nutriments,quantity,countries,url';
    var data = await offFetch('https://world.openfoodfacts.org/api/v2/search?search_terms=' + q + '&fields=' + fields + '&page_size=10&json=1'); // v2-API eerst (search.pl is verouderd)
    if (qHm && (!data || !(data.products || []).length)) data = await offFetch('https://world.openfoodfacts.org/api/v2/search?search_terms=' + qHm + '&fields=' + fields + '&page_size=10&json=1');
    if (!data || !(data.products || []).length) data = await offFetch('https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + q + '&search_simple=1&action=process&json=1&page_size=8&fields=' + fields); // vangnet: legacy endpoint
    if (qHm && (!data || !(data.products || []).length)) data = await offFetch('https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + qHm + '&search_simple=1&action=process&json=1&page_size=8&fields=' + fields);
    // v51.13 deel 5: vangnet-check — v2-antwoord met absurde count (miljoenen) of zonder hele-woord-treffer = kapot: niet gebruiken, door naar legacy search.pl
    (function () {
      var prods0 = (data && data.products) || [];
      var wq = normWoorden(naam + ' ' + merk).filter(function (w) { return w.length > 2; });
      var kapot = !data || !prods0.length || (typeof data.count === 'number' && data.count > 1000000) ||
        (wq.length > 0 && !prods0.some(function (p) {
          var pt = String((p.product_name || '') + ' ' + (p.brands || '')).toLowerCase();
          return wq.some(function (w) { return new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)').test(pt); });
        }));
      if (kapot) data = null;
    })();
    if (!data || !(data.products || []).length) data = await offFetch('https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + q + '&search_simple=1&action=process&json=1&page_size=8&fields=' + fields); // v51.13 deel 5: kapot/leeg v2-antwoord -> legacy endpoint
    try {
      if (!data) return null;
      var prods = (data && data.products) || [];
      function naamScore(p) { // v51.13 deel 4: hele-woorden-match via woordgrens — "kaas" grijpt níet naar "pindakaas"
        var pt = String((p.product_name || '') + ' ' + (p.brands || '')).toLowerCase();
        var pw = normWoorden(pt);
        var nw = normWoorden(naam + ' ' + merk);
        if (!pw.length || !nw.length) return 0;
        if (pw.join(' ') === nw.join(' ')) return 3;
        var relevant = nw.filter(function (w) { return w.length > 2; });
        if (!relevant.length) return 0;
        var hits = relevant.filter(function (w) {
          var r = new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)');
          return r.test(pt);
        }).length;
        var j = hits / relevant.length;
        return j > 0 ? j : 0;
      }
      function volledig(p) { // volledigheid telt mee: complete NL-entry wint van half-lege buitenlandse
        var nt = p.nutriments || {}, n = 0;
        ['energy-kcal_100g', 'energy_100g', 'energy-kj_100g', 'proteins_100g', 'sugars_100g', 'saturated-fat_100g', 'salt_100g', 'fiber_100g'].forEach(function (k) { if (typeof nt[k] === 'number' && isFinite(nt[k]) && nt[k] >= 0) n++; });
        return n;
      }
      function isNL(p) { return /netherlands|nl\.openfoodfacts/i.test(String(p.countries || '') + ' ' + String(p.url || '')); }
      function landTekst(p) { return String(p.countries || '') + ' ' + String(p.url || ''); } // v51.12: trapsgewijs landenvangnet (NL -> BE/FR/DE -> world)
      function tredeMatch(p, re) { return re.test(landTekst(p)); }
      var TREDE1 = /netherlands|en:netherlands|nl:nederland|nl\.openfoodfacts/i;
      var TREDE2 = /belgium|en:belgium|belgi[eë]|france|en:france|germany|en:germany|deutschland/i;
      var TREDE3 = /world|en:world/i;
      function merkBonus(p) {
        var pb = normWoorden((p.brands || '') + ' ' + (p.product_name || ''));
        if (expMerk) { var ew = normWoorden(expMerk); return ew.some(function (w) { return w.length > 2 && pb.indexOf(w) >= 0; }) ? 2 : 0; }
        return pb.some(function (w) { return hmWoorden.indexOf(w) >= 0; }) ? 1.5 : 0; // huismerk van mijn winkels wint bij (vrijwel) gelijkwaardige match
      }
      function totaleScore(p) { var ns = naamScore(p); return ns <= 0 ? 0 : ns * 2 + volledig(p) * 0.4 + (isNL(p) ? 1 : 0) + merkBonus(p); }
      var scored = prods.map(function (p) { return { p: p, s: totaleScore(p) }; }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; });
      if (!scored.length) return null;
      var t1 = scored.filter(function (x) { return tredeMatch(x.p, TREDE1); }); // v51.12: trede 1 = alleen Nederland
      var t2 = t1.length ? [] : scored.filter(function (x) { return tredeMatch(x.p, TREDE2); }); // trede 2 pas als trede 1 leeg: BE/FR/DE
      var t3 = (t1.length || t2.length) ? [] : scored.filter(function (x) { return tredeMatch(x.p, TREDE3); }); // trede 3 pas als trede 2 leeg: world
      var gekozen = t1.length ? t1 : (t2.length ? t2 : (t3.length ? t3 : scored)); // trede 3 ook leeg -> alle overige kandidaten (vangnet)
      var best = gekozen[0].p;
      var nt = best.nutriments || {};
      var kc = (typeof nt['energy-kcal_100g'] === 'number' && nt['energy-kcal_100g'] > 0) ? nt['energy-kcal_100g']
        : (typeof nt['energy_100g'] === 'number' && nt['energy_100g'] > 0 ? Math.round(nt['energy_100g'] / 4.184) : null); // vangnet: alleen kJ? kJ / 4,184 = kcal (Tresor: 1885 kJ ≈ 450 kcal)
      if (kc == null && typeof nt['energy-kj_100g'] === 'number' && nt['energy-kj_100g'] > 0) kc = Math.round(nt['energy-kj_100g'] / 4.184);
      if (kc != null) kc = Math.round(kc);
      function g(k) { var x = nt[k]; return (typeof x === 'number' && isFinite(x) && x >= 0 && x <= 100) ? Math.round(x * 100) / 100 : null; }
      var w = {};
      var m = { eiwit: g('proteins_100g'), suiker: g('sugars_100g'), verz: g('saturated-fat_100g'), zout: g('salt_100g'), vezel: g('fiber_100g') };
      Object.keys(m).forEach(function (k) { if (m[k] != null) w[k] = m[k]; });
      if (!Object.keys(w).length) w = null;
      if (kc == null && !w) return null;
      var offN = String(best.product_name || '').trim() + (best.brands ? ' — ' + String(best.brands).split(',')[0].trim() : '');
      var kandidaten = gekozen.slice(0, 4).map(function (x) {
        var nt2 = x.p.nutriments || {};
        var kc2 = (typeof nt2['energy-kcal_100g'] === 'number' && nt2['energy-kcal_100g'] > 0) ? Math.round(nt2['energy-kcal_100g'])
          : ((typeof nt2['energy_100g'] === 'number' && nt2['energy_100g'] > 0) ? Math.round(nt2['energy_100g'] / 4.184) : null);
        var w2 = {};
        [['eiwit', 'proteins_100g'], ['suiker', 'sugars_100g'], ['verz', 'saturated-fat_100g'], ['zout', 'salt_100g'], ['vezel', 'fiber_100g']].forEach(function (mm) {
          var v = nt2[mm[1]]; if (typeof v === 'number' && isFinite(v) && v >= 0 && v <= 100) w2[mm[0]] = Math.round(v * 100) / 100;
        });
        return { naam: (String(x.p.product_name || '').trim() + (x.p.brands ? ' — ' + String(x.p.brands).split(',')[0].trim() : '')).replace(/\s+/g, ' ').trim(), kcal100: kc2, w: Object.keys(w2).length ? w2 : null, compleet: volledig(x.p) >= 5, bron: 'Open Food Facts' };
      });
      return { kcal100: kc, w: w, naam: offN.replace(/\s+/g, ' ').trim() || null, url: best.url || (best.code ? 'https://world.openfoodfacts.org/product/' + best.code : ''), kandidaten: kandidaten };
    } catch (e) { return null; }
  }
  // Checkjebon (echte bibliotheek checkjebon-js.js, MIT): geeft ALLEEN prijzen, live met cache; isEstimate -> "geschat"
  async function checkjebonZoek(naam) { // v51.13 deel 2: alleen aangevinkte supermarkten (volgorde AH, Lidl, rest); alleen elders gevonden -> andereSuper met melding
    try {
      if (!window.checkjebon || typeof window.checkjebon.getPricesForProducts !== 'function') return null;
      var res = await window.checkjebon.getPricesForProducts([String(naam || '')]);
      var mine = ['ah', 'lidl', 'jumbo', 'aldi', 'hoogvliet'].filter(function (c) { return !S.supers || S.supers[c] !== false; });
      var rang = { ah: 0, lidl: 1 };
      function rangVan(code) { var c = String(code || '').toLowerCase(); return rang[c] != null ? rang[c] : 2; }
      var best = null, bestBuiten = null;
      (res || []).forEach(function (sm) {
        var inMine = mine.indexOf(String(sm.code || '').toLowerCase()) >= 0;
        (sm.products || []).forEach(function (pr) {
          if (typeof pr.price !== 'number' || !isFinite(pr.price) || pr.price <= 0) return;
          var cand = { pr: pr, sm: sm, inMine: inMine };
          if (inMine) { if (!best || pr.price < best.pr.price || (pr.price === best.pr.price && rangVan(sm.code) < rangVan(best.sm.code))) best = cand; }
          else if (!bestBuiten || pr.price < bestBuiten.pr.price) bestBuiten = cand;
        });
      });
      var win = best || bestBuiten;
      if (!win) return null;
      return { prijs: Math.round(win.pr.price * 100) / 100, isEstimate: win.pr.isEstimate === true, naam: (win.pr.name || '').trim() || null, supermarkt: win.sm.name || win.sm.code || '', andereSuper: !win.inMine };
    } catch (e) { return null; } // geen internet / niet gevonden: prijs blijft leeg, nooit gokken
  }
  // Mistral live web search per product (batch) — gedeelde kern voor pjLiveZoek en opzoekRoute
  async function mistralProductZoek(namen) {
    // v58.5: supermarkten-filter (S.supers, 'Mijn supermarkten') mee naar de AI — AH uitgevinkt = nooit AH als bron
    var SUPN = { ah: 'Albert Heijn', lidl: 'Lidl', jumbo: 'Jumbo', aldi: 'Aldi', hoogvliet: 'Hoogvliet' };
    var mijnSup = Object.keys(SUPN).filter(function (c) { return !S.supers || S.supers[c] !== false; }).map(function (c) { return SUPN[c]; });
    var superLijst = mijnSup.length ? mijnSup.join(', ') : 'AH, Jumbo, Lidl, Aldi, Hoogvliet';
    var sys = 'Je bent een live supermarkt-checker. Per product in de lijst: zoek met je live web search de actuele voedingswaarden per 100 g (kcal_per_100g, eiwit, suiker, verzadigd_vet, zout, vezels) en de prijs in euro op de website van de Nederlandse supermarkt: ' + superLijst + '. Gebruik NOOIT een supermarkt buiten deze lijst (bv. Albert Heijn als die bij Mijn supermarkten uitgevinkt staat). Vind je écht geen bron, zet "opgezocht" op false en "bron" leeg — de waarden zijn dan een schatting uit je eigen kennis. Vul "prijs" ALLEEN in bij een échte bron — nooit een gok, anders leeg. Zet "bron" ALLEEN op een echte productpagina-URL (https://...) die je écht in de zoekresultaten zag — nooit een verzonnen link (zoals wi100000000); bij twijfel bron leeg. Antwoord ALLEEN met JSON: { producten: [{ naam, kcal_per_100g, prijs, voedingswaarden_per_100g: { eiwit, suiker, verzadigd_vet, zout, vezels }, opgezocht, bron }] }';
    var body = { model: mistralModel(), messages: [{ role: 'system', content: sys }, { role: 'user', content: 'Producten:\n' + namen.join('\n') }], tools: [{ type: 'web_search' }], tool_choice: 'auto', response_format: { type: 'json_object' } };
    function stuur() { return fetch('https://api.mistral.ai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + mistralSleutel() }, body: JSON.stringify(body) }); }
    var resp = await stuur();
    if (!resp.ok && resp.status === 400 && body.tools) { delete body.tools; delete body.tool_choice; resp = await stuur(); }
    if (!resp.ok && resp.status !== 401) { body.response_format = { type: 'json_object' }; resp = await stuur(); }
    if (!resp.ok) throw new Error('Mistral gaf een fout (' + resp.status + ').');
    var data = await resp.json();
    var txt = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    var res = JSON.parse(String(txt).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
    return (res.producten || []).map(function (pr) {
      var w = null;
      if (pr.voedingswaarden_per_100g && typeof pr.voedingswaarden_per_100g === 'object') {
        w = {};
        [['eiwit', 'eiwit'], ['suiker', 'suiker'], ['verzadigd_vet', 'verz'], ['zout', 'zout'], ['vezels', 'vezel']].forEach(function (mm) {
          var x = pr.voedingswaarden_per_100g[mm[0]];
          if (typeof x === 'number' && isFinite(x) && x >= 0 && x <= 100) w[mm[1]] = Math.round(x * 100) / 100;
        });
        if (!Object.keys(w).length) w = null;
      }
      var kc = (typeof pr.kcal_per_100g === 'number' && isFinite(pr.kcal_per_100g) && pr.kcal_per_100g > 0 && pr.kcal_per_100g <= 900) ? Math.round(pr.kcal_per_100g) : null;
      var pr2 = (typeof pr.prijs === 'number' && isFinite(pr.prijs) && pr.prijs >= 0 && pr.prijs <= 100 && pr.opgezocht === true) ? Math.round(pr.prijs * 100) / 100 : null; // prijs alleen bij echte bron
      return { naam: String(pr.naam || ''), kcal_per_100g: kc, prijs: pr2, w: w, opgezocht: pr.opgezocht === true, bron: (typeof pr.bron === 'string' ? pr.bron : '') };
    });
  }
  function zegEntry(slot, pr) {
    var a = pr.aantal, u = pr.eenheid, p = findProd(pr.naam);
    if (p) {
      var antlU = (p.aantal > 0 && p.aantalWoord) ? p.aantalWoord : null;
      var us = prodUnits(p); if (antlU && us.indexOf(antlU) < 0) us.push(antlU);
      var uu = u;
      if (antlU && (u === antlU || u === antlU.replace(/s$/, '') || antlU.replace(/s$/, '') === u)) uu = antlU;
      else if (['snee', 'plak', 'stuk', 'bakje', 'portie'].indexOf(u) >= 0 && p.u === 'stuk') uu = 'stuk';
      else if (u === 'liter') { uu = 'ml'; a = a * 1000; }
      else if (u === 'gram' && p.u === 'g') uu = 'g';
      else if (us.indexOf(uu) < 0) uu = (p.eh && us.indexOf(p.eh) >= 0) ? p.eh : p.u;
      var sgA = (antlU && uu === antlU) ? stukGram(p) : null; // keuring 8 nov: verpakkingseenheid blijft bij het product; kcal bij "1 stuk van de verpakking" via gewicht per stuk
      var k = (sgA != null && p.kc != null) ? a * sgA * p.kc / 100 : kcalFor(p, a, uu);
      var e = { id: uid(), slot: slot, key: 'P:' + p.id, code: '', name: p.n + ', ' + fmtN(a) + ' ' + unitWord(uu, a, p), k: k == null ? null : Math.round(k), exact: k != null, pid: p.id, amt: a, u: uu, bron: p.bron || '' }; // v55.0 (12 nov): bronlabel mee
      if (uu === 'g' && k != null && p.kc != null) { e.g = a; e.p = p.kc; }
      if (antlU && uu === antlU) { var sg = stukGram(p); if (sg != null) { e.g = a * sg; if (k != null && p.kc != null) e.p = p.kc; } }
      return e;
    }
    var uu2 = u === 'gram' ? 'g' : (u === 'liter' ? 'ml' : (['snee', 'plak', 'bakje', 'portie'].indexOf(u) >= 0 ? 'stuk' : u));
    if (u === 'liter') a = a * 1000;
    var k2 = (pr.kcal100 != null && (uu2 === 'g' || uu2 === 'gram')) ? Math.round(a * pr.kcal100 / 100) : null; // v50.7 test: eigen kcal-waarde meerekenen als gram
    return { id: uid(), slot: slot, key: '', code: '', name: repareerProductNaam(pr.naam) + ', ' + fmtN(a) + ' ' + uu2, k: k2, exact: k2 != null };
  }

  // ---------- per moment: ⚡/⏪-bron open — twee rustige zones (zelfde vorm als Instellingen) ----------
  function bronZonesHtml(id, m, bron) {
    var pp = id.split('-'), dt = new Date(+pp[0], +pp[1] - 1, +pp[2]), dow = dt.getDay();
    var d = S.days[id] || { entries: [] };
    var dagPids = {}, dagRids = {};
    (d.entries || []).forEach(function (e) { if (e.slot === m.slot && e.pid) dagPids[e.pid] = true; if (e.slot === m.slot && e.recipe) dagRids[e.recipe] = true; });
    var items = [];
    if (bron === 'norm') {
      normaalVoor(dow).forEach(function (r) { if (r.slot === m.slot) items.push(r.rid ? { rid: r.rid, r: r } : { pid: r.pid, r: r }); }); // v51.8: recepten uit het patroon тоже in de zone
    } else {
      var pw = prevWeekMomenten(id), pdoc = pw ? S.days[pw.prevId] : null;
      (pdoc && pdoc.entries || []).forEach(function (e) { if (e.slot === m.slot) items.push(e.recipe ? { rid: e.recipe, e: e } : (e.pid ? { pid: e.pid, e: e } : null)); });
      items = items.filter(Boolean);
    }
    var h = '', bHtml = '', nHtml = '', nb = 0, nn = 0;
    items.forEach(function (it) {
      var keyId = it.rid ? 'R:' + it.rid : it.pid;
      var rcZ = it.rid ? (S.recipes || []).filter(function (x) { return x.id === it.rid; })[0] : null;
      var pr = prodById(it.pid), nm = rcZ ? '🍽 ' + rcZ.name : (pr ? pr.n : '(product niet meer gevonden)');
      var k = id + ':' + m.slot + ':' + bron + ':' + keyId;
      var added = !!(S.bronAdd && S.bronAdd[k]);
      var alIn = it.rid ? dagRids[it.rid] : dagPids[it.pid];
      if (alIn && !added) {
        bHtml += '<div class="zrow"><span class="nm">' + esc(nm) + ' (staat er al in — blijft staan)</span></div>'; nb++;
      } else {
        nHtml += '<div class="zrow"><span class="nm">' + esc(nm) + '</span>' +
          '<button class="zbtn' + (added ? ' aan' : '') + '" type="button" data-act="bronplus" data-day="' + id + '" data-slot="' + esc(m.slot) + '" data-bron="' + bron + '" data-pid="' + esc(keyId) + '" aria-pressed="' + added + '" aria-label="' + esc(nm) + (added ? ' weer weghalen' : ' erin zetten') + '">' + (added ? '✕' : '＋') + '</button></div>'; nn++;
      }
    });
    if (nb) h += '<div class="zone"><p class="zonekop">Bestaande producten</p>' + bHtml + '</div>'; // lege zone = niet tonen
    if (nn) h += '<div class="zone groen"><p class="zonekop">Nieuw</p>' + nHtml + '</div>';
    return h;
  }
  // ⏪-kopie net zoals prevgo dat deed: eigen id, verder alles mee (hoeveelheid incl.)
  function bronKopieer(e) {
    var e2 = Object.assign({}, e, { id: uid() });
    if (e2.u === 'stuk' && e2.a === 100 && typeof e2.g === 'number' && e2.g > 0 && e2.g !== 100) {
      var pr0 = prodById(e2.pid), sg0 = pr0 ? stukGram(pr0) : null;
      if (sg0) e2.a = Math.round((e2.g / sg0) * 10) / 10;
    }
    return e2;
  }
  // ---------- v49.2: ⏪ "Zelfde als vorige week" (bron = zelfde weekdag vorige week van de ÓPEN dag) ----------
  function prevWeekMomenten(id) {
    var p = id.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    var prevDate = addDays(dt, -7), prevId = fmtId(prevDate), prevD = S.days[prevId];
    if (dayIsRaar(prevId)) return null; // v50.3: raar-gemarkeerde dag is geen bron voor ⏪
    if (!prevD || !(prevD.entries || []).length) return null;
    var ms = eetMomenten(prevDate.getDay(), prevD).filter(function (m) {
      return (prevD.entries || []).some(function (e) { return e.slot === m.slot; });
    });
    if (!ms.length) return null;
    return { prevId: prevId, prevDate: prevDate, dow: dt.getDay(), momenten: ms };
  }
  // ---------- v49.2: ✕ op week-blokjes + "Alles terugzetten" (sessie) ----------
  function wkTerugHtml() {
    if (!S.wkVerw || !S.wkVerw.length) return '';
    return '<div class="row" style="margin:8px 0"><button class="btn" type="button" style="width:100%" data-act="wkherstel">↩︎ Alles terugzetten (' + S.wkVerw.length + ' deze sessie weg)</button></div>';
  }

  // v51.10: ingrediënten slepen naar een ander kopje / andere volgorde (naast de pijltjes; op touch blijven de pijltjes werken)
  document.addEventListener('dragstart', function (ev) {
    var row = ev.target.closest && ev.target.closest('.ingrow-v');
    if (!row || !ev.dataTransfer) return;
    ev.dataTransfer.setData('text/plain', row.getAttribute('data-r') + ':' + row.getAttribute('data-i'));
    ev.dataTransfer.effectAllowed = 'move';
  });
  document.addEventListener('dragover', function (ev) {
    if (!(ev.target.closest && (ev.target.closest('.ingdet') || ev.target.closest('.ingrow-v')))) return;
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
  });
  document.addEventListener('drop', function (ev) {
    var data = ev.dataTransfer && ev.dataTransfer.getData('text/plain');
    if (!data || data.indexOf(':') < 0) return;
    var det = ev.target.closest && ev.target.closest('.ingdet');
    var rowT = ev.target.closest && ev.target.closest('.ingrow-v');
    if (!det && !rowT) return;
    ev.preventDefault();
    var p = data.split(':'), rid = p[0], idx = +p[1];
    var rec = S.recipes.filter(function (r) { return r.id === rid; })[0];
    if (!rec || !rec.ing[idx]) return;
    if (rowT) { // op een regel: erheen schuiven + kopje van die regel overnemen
      var ti = +rowT.getAttribute('data-i');
      var tg = (rec.ing[ti] || {}).g || '';
      var it2 = rec.ing.splice(idx, 1)[0];
      if (idx < ti) ti--;
      rec.ing.splice(ti, 0, it2);
      it2.g = tg;
    } else if (det) { // op een kopje-hood: naar dat kopje
      rec.ing[idx].g = det.getAttribute('data-g') || '';
    }
    persist(); render();
    toast('Ingrediënt versleept' + (TESTVERSIE ? ' (🧪 testversie: niet weggeschreven)' : ''));
  });

  // v51.11 D: touch-slepen bij ingrediënten (HTML5-drag vuurt niet op touch) — lang vasthouden, dan verslepen; pijltjes blijven vangnet
  var _touchDrag = null;
  document.addEventListener('touchstart', function (ev) {
    var row = ev.target.closest && ev.target.closest('.ingrow-v');
    if (!row) return;
    var t = ev.touches[0];
    _touchDrag = { row: row, x: t.clientX, y: t.clientY, timer: setTimeout(function () { _touchDrag.moving = true; row.style.opacity = '0.5'; }, 450) };
  }, { passive: true });
  document.addEventListener('touchmove', function (ev) {
    if (!_touchDrag || !_touchDrag.moving) return;
    ev.preventDefault();
    var t = ev.touches[0];
    var el = document.elementFromPoint(t.clientX, t.clientY);
    document.querySelectorAll('.ingdet.drop-over, .ingrow-v.drop-over').forEach(function (x) { x.classList.remove('drop-over'); });
    var tgt = el && el.closest && (el.closest('.ingdet') || el.closest('.ingrow-v'));
    if (tgt) tgt.classList.add('drop-over');
  }, { passive: false });
  document.addEventListener('touchend', function (ev) {
    if (!_touchDrag) return;
    clearTimeout(_touchDrag.timer);
    var wasMoving = _touchDrag.moving, row = _touchDrag.row;
    _touchDrag = null;
    document.querySelectorAll('.drop-over').forEach(function (x) { x.classList.remove('drop-over'); });
    if (!wasMoving || !row) return;
    var t = ev.changedTouches[0];
    var el = document.elementFromPoint(t.clientX, t.clientY);
    var det = el && el.closest && el.closest('.ingdet');
    var rowT = el && el.closest && el.closest('.ingrow-v');
    if (!det && !rowT) return;
    var rid = row.getAttribute('data-r'), idx = +row.getAttribute('data-i');
    var rec = S.recipes.filter(function (r) { return r.id === rid; })[0];
    if (!rec || !rec.ing[idx]) return;
    if (rowT && rowT !== row) {
      var ti = +rowT.getAttribute('data-i');
      var tg = (rec.ing[ti] || {}).g || '';
      var it2 = rec.ing.splice(idx, 1)[0];
      if (idx < ti) ti--;
      rec.ing.splice(ti, 0, it2);
      it2.g = tg;
    } else if (det) {
      rec.ing[idx].g = det.getAttribute('data-g') || '';
    }
    persist(); render();
    toast('Ingrediënt versleept' + (TESTVERSIE ? ' (🧪 testversie: niet weggeschreven)' : ''));
  });
  // CSS voor drop-markering
  // ---------- v49: actions ----------
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'bronopen') { // ⚡/⏪ per moment: alléén dat moment open (harmonica); nog een tik op hetzelfde icoontje = dicht
      var od = el.getAttribute('data-day'), os = el.getAttribute('data-slot'), ob = el.getAttribute('data-bron');
      var ok = od + ':' + os;
      S.msrc = S.msrc || {};
      if (S.mopen && S.mopen[od] === os && S.msrc[ok] === ob) { S.mopen = {}; delete S.msrc[ok]; }
      else { S.mopen = {}; S.mopen[od] = os; S.msrc = {}; S.msrc[ok] = ob; }
      render();
    }
    else if (act === 'bronplus') { // ＋ = direct erin (eigen id, kopie incl. hoeveelheid); slaat om in ✕ = weer weg
      var gd = el.getAttribute('data-day'), gs = el.getAttribute('data-slot'), gb = el.getAttribute('data-bron'), gpid = el.getAttribute('data-pid');
      var gk = gd + ':' + gs + ':' + gb + ':' + gpid;
      var isRec = gpid && gpid.indexOf('R:') === 0, grid = isRec ? gpid.slice(2) : null; // v51.8: R:rid = recept
      var gpr = prodById(gpid), grc = grid ? (S.recipes || []).filter(function (x) { return x.id === grid; })[0] : null;
      var gnm = grc ? '🍽 ' + grc.name : (gpr ? gpr.n : '(product niet meer gevonden)');
      S.bronAdd = S.bronAdd || {};
      if (S.bronAdd[gk]) {
        var dd0 = dayDoc(gd), ai = -1;
        dd0.entries.forEach(function (e, ix) { if (e.id === S.bronAdd[gk]) ai = ix; });
        if (ai >= 0) dd0.entries.splice(ai, 1);
        delete S.bronAdd[gk];
        persist(); render();
        toast('↺ ' + gnm + ' weer weggehaald' + (TESTVERSIE ? ' (🧪 testversie: niet weggeschreven)' : ''));
      } else {
        var e2 = null, pp2 = gd.split('-'), dt2 = new Date(+pp2[0], +pp2[1] - 1, +pp2[2]);
        if (isRec) { // v51.8: recept overnemen als echt recept
          if (gb === 'norm') {
            var r2r = normaalVoor(dt2.getDay()).filter(function (r) { return r.slot === gs && r.rid === grid; })[0];
            if (r2r) e2 = normaalEntry(gs, r2r);
          } else {
            var pw2r = prevWeekMomenten(gd), pdoc2r = pw2r ? S.days[pw2r.prevId] : null;
            var src2r = ((pdoc2r && pdoc2r.entries) || []).filter(function (e) { return e.slot === gs && e.recipe === grid; })[0];
            if (src2r) e2 = bronKopieer(src2r);
          }
        } else if (gb === 'norm') {
          var r2 = normaalVoor(dt2.getDay()).filter(function (r) { return r.slot === gs && r.pid === gpid; })[0];
          if (r2) e2 = normaalEntry(gs, r2);
        } else {
          var pw2 = prevWeekMomenten(gd), pdoc2 = pw2 ? S.days[pw2.prevId] : null;
          var src2 = ((pdoc2 && pdoc2.entries) || []).filter(function (e) { return e.slot === gs && e.pid === gpid; })[0];
          if (src2) e2 = bronKopieer(src2);
        }
        if (e2) {
          dayDoc(gd).entries.push(e2);
          S.bronAdd[gk] = e2.id;
          persist(); render();
          toast('✓ ' + gnm + ' erin gezet — pas gerust zelf aan' + (TESTVERSIE ? ' (🧪 testversie: niet weggeschreven)' : ''));
        }
      }
    }
    else if (act === 'bronniets') { // zacht sluiten
      var nd0 = el.getAttribute('data-day'), ns0 = el.getAttribute('data-slot');
      S.mopen = {};
      if (S.msrc) delete S.msrc[nd0 + ':' + ns0];
      render();
    }
    else if (act === 'wkdel') {
      var did = el.getAttribute('data-day'), eid = el.getAttribute('data-id');
      S.wkZeker = S.wkZeker || {};
      if (!S.wkZeker[eid]) {
        S.wkZeker[eid] = true; render();
        setTimeout(function () { if (S.wkZeker && S.wkZeker[eid]) { delete S.wkZeker[eid]; render(); } }, 3000);
      } else {
        delete S.wkZeker[eid];
        var dd = dayDoc(did), ge = dd.entries.filter(function (e) { return e.id === eid; })[0];
        if (ge) { dd.entries = dd.entries.filter(function (e) { return e.id !== eid; }); S.wkVerw = S.wkVerw || []; S.wkVerw.push({ day: did, entry: ge }); }
        saveDay(did); render();
        toast('Blokje weg — onderaan kun je "Alles terugzetten"');
      }
    }
    else if (act === 'wkherstel') {
      (S.wkVerw || []).forEach(function (s) { dayDoc(s.day).entries.push(s.entry); });
      var n2 = (S.wkVerw || []).length; S.wkVerw = [];
      persist(); render(); toast('↩︎ ' + n2 + (n2 === 1 ? ' blokje' : ' blokjes') + ' teruggezet');
    }
    else if (act === 'normdag') { var dn = +el.getAttribute('data-dow'); S.normDag = (S.normDag === dn) ? 0 : dn; render(); } // v50.6-kening: horizontale dagblokjes, één tegelijk
    else if (act === 'normdagvul') { normaalDoeHet(el.getAttribute('data-day')); }
    else if (act === 'normmomvul') { normaalDoeHetMoment(el.getAttribute('data-day'), el.getAttribute('data-slot')); } // v57: kleine ⚡ per leeg moment op een deels-lege dag // grote ⚡-knop op een lége dag: direct vullen uit het weekdagpatroon
    else if (act === 'normleeg') { // v50.6 + v57.3: wist alle 5 patronen; eerste tik = bevestiging (label 'Zeker weten?' + toast), pas tweede tik wist echt; vlag reset na 5 s en wordt niet bewaard (sessie-geheugen, zoals wkVerw)
      if (!S.normaalLeeg) {
        S.normaalLeeg = true;
        clearTimeout(S._normLeegT);
        S._normLeegT = setTimeout(function () { S.normaalLeeg = false; render(); }, 5000);
        toast('Nog een keer tikken = echt leegmaken');
        render(); return;
      }
      clearTimeout(S._normLeegT);
      S.normaal = {}; S.normaalLeeg = false; persist(); render();
      toast('Alle 5 patronen leeggemaakt');
    }
    else if (act === 'normopen') {
      var slotN = el.getAttribute('data-slot'), dowN = el.getAttribute('data-dow');
      S.normaalKies = null; S.normSheetQ = '';
      openSheet('normaal', slotN, dowN);
    }
    else if (act === 'normkies') {
      var ks = el.getAttribute('data-slot'), ki = +el.getAttribute('data-i'), kd = el.getAttribute('data-dow');
      S.normaalKies = { slot: ks, i: ki, dow: kd }; S.normSheetQ = '';
      openSheet('normaal', ks, kd);
    }
    else if (act === 'normSheetAdd') {
      var slot = S.sheet.slot;
      var dowA = String(S.sheet.dow || (S.normaalKies && S.normaalKies.dow) || '1');
      var arr = S.normaal[dowA] = S.normaal[dowA] || [];
      var pid = el.getAttribute('data-p');
      var p = prodById(pid);
      if (p) {
        var ki = S.normaalKies ? S.normaalKies.i : -1;
        if (ki >= 0 && arr[ki] && arr[ki].slot === slot) {
          arr[ki].pid = pid;
          arr[ki].u = (p.eh || p.u);
          S.normaalKies = null;
          persist();
          requestClose();
          render();
          toast('Vervangen in je ' + DOW[+dowA] + '-patroon');
        } else {
          var uu2 = (p.eh || p.u);
          var antlU2 = (p.aantal > 0 && p.aantalWoord) ? p.aantalWoord : null;
          var stukLik2 = (uu2 === 'stuk' || HUISMATEN[uu2] != null || (antlU2 && uu2 === antlU2));
          var def2 = stukLik2 ? ((p.la && p.la <= 10) ? p.la : 1) : ((p.la && p.eh === uu2) ? p.la : 100); // v58.4: normale portie (stuk/huismaat/eigen woord = 1, gram/ml = 100 g of laatst gebruikte) — geen 1 gram meer
          var bestaand = arr.filter(function (r) { return r.slot === slot && r.pid === pid; })[0];
          if (bestaand) {
            bestaand.amt = Math.round((bestaand.amt + def2) * 100) / 100;
          } else {
            arr.push({ slot: slot, pid: pid, amt: def2, u: uu2 });
          }
          persist();
          render();
          toast(p.n + ' toegevoegd');
        }
      }
    }
    else if (act === 'normstep') {
      var s2 = el.getAttribute('data-slot'), i2 = +el.getAttribute('data-i'), d2 = parseFloat(el.getAttribute('data-d')), dw2 = el.getAttribute('data-dow') || '1';
      var arr2 = S.normaal[dw2] || [];
      var item = arr2[i2]; if (!item || item.slot !== s2) return;
      item.amt = Math.max(Math.abs(d2), Math.round((item.amt + d2) * 100) / 100); // v58.4: minimum = de stap zelf
      persist(); render();
    }
    else if (act === 'normdel') {
      var s3 = el.getAttribute('data-slot'), i3 = +el.getAttribute('data-i'), dw3 = el.getAttribute('data-dow') || '1';
      var arr3 = S.normaal[dw3] || [];
      if (arr3[i3] && arr3[i3].slot === s3) { arr3.splice(i3, 1); persist(); render(); toast('Weggehaald uit het patroon'); }
    }
    else if (act === 'normklok') { // wens 8 nov (kapot klokje): bewerk-vorm van dit moment, harmonica = één tegelijk
      var kd2 = +el.getAttribute('data-dow'), ks2 = el.getAttribute('data-slot');
      if (S.normKlok && S.normKlok.dow === kd2 && S.normKlok.slot === ks2) S.normKlok = null; else S.normKlok = { dow: kd2, slot: ks2 };
      render();
    }
    else if (act === 'normweg') { // wens 8 nov: "terug in je patroon" toggle
      var wd = +el.getAttribute('data-dow'), ws = el.getAttribute('data-slot'), wp = el.getAttribute('data-pid'), wk2 = wd + ':' + ws + ':' + wp;
      S.patWeg = S.patWeg || {}; if (S.patWeg[wk2]) delete S.patWeg[wk2]; else S.patWeg[wk2] = true;
      render();
    }
    else if (act === 'normerbij') { // wens 8 nov: "erbij deze weekdag" toggle
      var ed = +el.getAttribute('data-dow'), es2 = el.getAttribute('data-slot'), ep = el.getAttribute('data-pid'), ek = ed + ':' + es2 + ':' + ep;
      S.patErbij = S.patErbij || {}; if (S.patErbij[ek]) delete S.patErbij[ek]; else S.patErbij[ek] = true;
      render();
    }
    else if (act === 'normbijwerk') { // wens 8 nov: aan/uit-vinkjes toepassen op het patroon
      var bd = +el.getAttribute('data-dow'), bs = el.getAttribute('data-slot');
      var arrB = S.normaal[String(bd)] = S.normaal[String(bd)] || [];
      arrB.forEach(function (r) { var kk = bd + ':' + bs + ':' + (r.rid ? 'R:' + r.rid : r.pid); if (S.patWeg && S.patWeg[kk]) r._weg = true; });
      for (var bi = arrB.length - 1; bi >= 0; bi--) if (arrB[bi]._weg) { delete arrB[bi]._weg; arrB.splice(bi, 1); } else delete arrB[bi]._weg;
      Object.keys(S.patErbij || {}).forEach(function (k) {
        if (k.indexOf(bd + ':' + bs + ':') !== 0) return;
        var restB = k.slice((bd + ':' + bs + ':').length);
        if (restB.indexOf('R:') === 0) { // v51.8: recept uit de week naar het patroon
          var ridB = restB.slice(2);
          if (!arrB.some(function (r) { return r.slot === bs && r.rid === ridB; })) arrB.push({ slot: bs, rid: ridB });
          return;
        }
        var pidB = restB, pB = prodById(pidB); if (!pB) return;
        var amtB = 1, uB = (pB.eh || pB.u);
        for (var j = 0; j < 7; j++) { var dtB = addDays(S.start, j); if (dtB.getDay() !== bd) continue; var ddB = S.days[fmtId(dtB)]; if (ddB && ddB.entries) ddB.entries.forEach(function (e) { if (e.slot === bs && e.pid === pidB) { amtB = e.amt || 1; uB = e.u || uB; } }); }
        if (!arrB.some(function (r) { return r.slot === bs && r.pid === pidB; })) arrB.push({ slot: bs, pid: pidB, amt: amtB, u: uB });
      });
      wisMomentTiks(bd, bs); S.normKlok = null; persist(); render();
      toast('Moment bijgewerkt — patroon opgeslagen');
    }
    else if (act === 'normniets') { // wens 8 nov: bewerk-vorm sluiten zonder iets te veranderen
      var nd2 = +el.getAttribute('data-dow'), ns2 = el.getAttribute('data-slot');
      wisMomentTiks(nd2, ns2); S.normKlok = null; render();
    }
    else if (act === 'normSheetAddR') { // wens 8 nov: recept toevoegen aan het weekdagpatroon
      var slotR = S.sheet.slot;
      var dowR = String(S.sheet.dow || (S.normaalKies && S.normaalKies.dow) || '1');
      var arrR = S.normaal[dowR] = S.normaal[dowR] || [];
      var rid = el.getAttribute('data-r');
      var rc2 = (S.recipes || []).filter(function (x) { return x.id === rid; })[0];
      if (rc2) {
        var kiR = S.normaalKies ? S.normaalKies.i : -1;
        if (kiR >= 0 && arrR[kiR] && arrR[kiR].slot === slotR && !arrR[kiR].rid) { arrR[kiR] = { slot: slotR, rid: rid }; S.normaalKies = null; }
        else if (!arrR.some(function (r) { return r.slot === slotR && r.rid === rid; })) arrR.push({ slot: slotR, rid: rid });
        persist(); render();
        toast('🍽 ' + rc2.name + ' in je ' + DOW[+dowR] + '-patroon');
      }
    }
    else if (act === 'pjview') { S.pjView = el.getAttribute('data-v'); renderPJ(); } // v50.7 test
    else if (act === 'pjfilter') { S.pjFilter = el.getAttribute('data-v'); S.pjI = 0; renderPJ(); }
    else if (act === 'pjprev') { S.pjI = Math.max((S.pjI || 0) - 1, 0); renderPJ(); }
    else if (act === 'pjnext') { S.pjI = (S.pjI || 0) + 1; renderPJ(); }
    else if (act === 'pjvlag') { var pv2 = S.pj && S.pj.rows && S.pj.rows[+el.getAttribute('data-i')]; if (pv2) { pv2.vlag = !pv2.vlag; renderPJ(); } }
    else if (act === 'pjcheckgo') { var pc2 = S.pj && S.pj.rows && S.pj.rows[+el.getAttribute('data-i')]; if (pc2) { pc2.gecheckt = !pc2.gecheckt; renderPJ(); } }
    else if (act === 'pjschat') { // keuring 7 nov: ✨-vangnet — wat ná het automatische opzoeken nog leeg is, live opnieuw proberen (nooit een gok)
      var nE = (S.pj.rows || []).filter(function (rr) { return !rr.ex && rr.kc == null && rr.kst == null; }).length;
      if (nE) { pjLiveZoek(); toast('✨ ' + nE + ' lege waarde(n) worden opgezocht (plank → Open Food Facts → Checkjebon → Mistral)'); }
      else { renderPJ(); toast('Geen lege waardes meer — niets op te zoeken'); }
    }
    else if (act === 'zegschat') {
      var zin = String(S.zegZin || '').trim();
      if (!zin) { S.zegStatus = { t: 'Typ eerst even wat je at.', fout: true }; render(); return; }
      var id = zegDoelId(), pp = id.split('-'), dt = new Date(+pp[0], +pp[1] - 1, +pp[2]);
      var ms = eetMomenten(dt.getDay(), dayDoc(id));
      S.zegStatus = { t: 'De AI denkt even na…', fout: false }; render();
      zegSchatKern(zin, ms, S.recipes.map(function (r) { return r.name; })).then(function (v) {
        v = v || {};
        var prods = Array.isArray(v.producten) ? v.producten : [];
        var zinNorm = normName(zin);
        S.zegVoorstel = {
          doel: id,
          producten: (function () { var uit = []; prods.forEach(function (pr) {
            var a = (typeof pr.aantal === 'number' && isFinite(pr.aantal)) ? Math.max(0, Math.round(pr.aantal * 100) / 100) : 1;
            var kc = (typeof pr.kcal_per_100g === 'number' && isFinite(pr.kcal_per_100g) && pr.kcal_per_100g > 0 && pr.kcal_per_100g <= 900) ? Math.round(pr.kcal_per_100g) : null;
            var pr0 = (typeof pr.prijs === 'number' && isFinite(pr.prijs) && pr.prijs >= 0 && pr.prijs <= 100) ? Math.round(pr.prijs * 100) / 100 : null;
            var w0 = null;
            if (pr.voedingswaarden_per_100g && typeof pr.voedingswaarden_per_100g === 'object') {
              w0 = {};
              [['eiwit', 'eiwit'], ['suiker', 'suiker'], ['verzadigd_vet', 'verz'], ['zout', 'zout'], ['vezels', 'vezel']].forEach(function (m) {
                var x = pr.voedingswaarden_per_100g[m[0]];
                if (typeof x === 'number' && isFinite(x) && x >= 0 && x <= 100) w0[m[1]] = Math.round(x * 100) / 100;
              });
              if (!Object.keys(w0).length) w0 = null;
            }
            var niveau = null, recHit = null;
            [pr.recept, pr.naam].forEach(function (cn) {
              if (recHit || !cn) return;
              var ck = normName(String(cn));
              if (ck.length < 3) return;
              S.recipes.forEach(function (r) {
                if (recHit) return;
                var rn = normName(r.name);
                var nv = rn ? recMatchNiveau(ck, rn) : null;
                var nz = rn ? recMatchNiveau(zinNorm, rn) : null; // fix: de échte invoer telt ook — de AI mag niet zelf een heel recept gokken
                if (nv === 'sterk' && nz !== 'zwak') recHit = r; // sterk: alleen als de hele receptnaam echt genoemd is
                else if ((nv === 'zwak' || nz === 'zwak') && !niveau) { niveau = 'zwak'; recHit = r; }
              });
            });
            var base = { aantal: a, eenheid: ZEG_EENHEDEN.indexOf(pr.eenheid) >= 0 ? pr.eenheid : 'stuk', moment: zegMomentVan(pr.moment, ms) };
            if (recHit && niveau !== 'zwak') uit.push(Object.assign({ rid: recHit.id, naam: recHit.name, isRec: true, kcal100: null, prijs: null, w: null, opgezocht: false, bron: '' }, base));
            else if (recHit) { // zwakke match: BEIDE blokjes — recept-blokje én product-blokje met mijn eigen woord; opzoek start direct
              uit.push(Object.assign({ rid: recHit.id, naam: recHit.name, isRec: true, kcal100: null, prijs: null, w: null, opgezocht: false, bron: '' }, base));
              var eigenNaam = (String(pr.naam || '').trim() || String(zin || '').trim()).slice(0, 80); var plankHit0 = findProd(eigenNaam);
              uit.push(Object.assign({ naam: eigenNaam, aiKeuze: plankHit0 ? plankHit0.n + ' (eigen plank)' : null, kcal100: kc, prijs: pr0, w: w0, opgezocht: pr.opgezocht === true, bron: (typeof pr.bron === 'string' ? pr.bron : ''), _startLookup: true }, base)); // eigen woord, niet de receptnaam
            } else { var pn0 = String(pr.naam || pr.recept || '').trim().slice(0, 80), pf0 = findProd(pn0); uit.push(Object.assign({ naam: pn0, aiKeuze: pf0 ? pf0.n + ' (eigen plank)' : null, kcal100: kc, prijs: pr0, w: w0, opgezocht: pr.opgezocht === true, bron: (typeof pr.bron === 'string' ? pr.bron : '') }, base)); }
          });
          return uit.filter(function (pr) { return pr.naam; }); })(),
          notitie: String(v.notitie || '').slice(0, 500),
          twijfel: !!v.twijfel
        };
        S.zegStatus = null; render();
        (S.zegVoorstel.producten || []).forEach(function (pp) { if (pp._startLookup || (!pp._busy && !pp.opgezocht && pp.kcal100 == null && pp.naam && !findProd(pp.naam))) { pp._startLookup = false; zegOpzoekProd(pp); } }); // 10 nov: óók nieuw product-blokje start automatisch de opzoek-route
      }).catch(function (e) { S.zegStatus = { t: (e && e.message) || 'Er ging iets mis. Probeer het opnieuw.', fout: true }; render(); });
    }
    else if (act === 'zegzet') {
      var v = S.zegVoorstel; if (!v) return;
      var id2 = v.doel || zegDoelId(), p2 = id2.split('-'), dt2 = new Date(+p2[0], +p2[1] - 1, +p2[2]);
      var d2 = dayDoc(id2), ms2 = eetMomenten(dt2.getDay(), d2), n = 0;
      // v50.7-fix: onbekend product wordt bij bevestigen écht aangemaakt in Mijn producten,
      // zodat het dag-blokje direct gekoppeld is en tikbaar (net als elk ander product)
      v.producten.forEach(function (pr) {
        if (pr.rid || findProd(pr.naam)) return;
        var uu0 = pr.eenheid === 'gram' ? 'g' : (pr.eenheid === 'liter' ? 'ml' : (['snee', 'plak', 'bakje', 'portie'].indexOf(pr.eenheid) >= 0 ? 'stuk' : pr.eenheid));
        if (['g', 'ml', 'stuk'].indexOf(uu0) < 0) uu0 = 'g';
        var np = cleanProd({ id: uid(), n: pr.naam, u: uu0, kc: (pr.kcal100 != null) ? pr.kcal100 : null, pr: pr.prijs != null ? pr.prijs : null, w: pr.w || {} });
        if (np) S.prijzen.push(np);
      });
      v.producten.forEach(function (pr) {
        var m = ms2.filter(function (x) { return x.t === pr.moment; })[0];
        var slot = m ? m.slot : 'extra';
        if (pr.rid) {
          var r0 = S.recipes.filter(function (x) { return String(x.id) === String(pr.rid); })[0];
          if (r0) { addRecipeAt(r0, id2, slot, (typeof pr.aantal === 'number' && pr.aantal > 0) ? pr.aantal : 1); n++; }
          return;
        }
        d2.entries.push(zegEntry(slot, pr)); n++;
      });
      if (n) persist();
      S.zegVoorstel = null; S.zegZin = ''; S.zegStatus = null;
      render();
      toast('✓ ' + n + (n === 1 ? ' product' : ' producten') + ' in de dag gezet: ' + cap(DOW[dt2.getDay()]) + ' ' + short(dt2));
    }
    else if (act === 'zegrec2prod') { // fix: "Toch als product" = product-blokje NAAST het recept-blokje; niets wordt omgezet of hernoemd
      var zi = +el.getAttribute('data-i'), zp2 = S.zegVoorstel && S.zegVoorstel.producten[zi];
      if (zp2 && zp2.rid) {
        var np = { naam: String(S.zegZin || zp2.naam || '').trim().slice(0, 80), aantal: zp2.aantal, eenheid: zp2.eenheid, moment: zp2.moment, kcal100: null, prijs: null, w: null, opgezocht: false, bron: '', _startLookup: true };
        S.zegVoorstel.producten.splice(zi + 1, 0, np);
        zegOpzoekProd(np);
      }
      render();
    }
    else if (act === 'zegweg') { S.zegVoorstel = null; S.zegStatus = null; render(); } // v57: werksheet is weg — geen forceCloseWerk meer
    else if (act === 'zegblokweg') { // fix: per blokje wegklikken (bv. als één van de twee blokjes niet de bedoeling was)
      var bi = +el.getAttribute('data-i');
      if (S.zegVoorstel && S.zegVoorstel.producten[bi]) S.zegVoorstel.producten.splice(bi, 1);
      render();
    }
    else if (act === 'zegmin' || act === 'zegplus') {
      var i = +el.getAttribute('data-i'), pr = S.zegVoorstel && S.zegVoorstel.producten[i]; if (!pr) return;
      pr.aantal = Math.max(0, Math.round((pr.aantal + (act === 'zegplus' ? 0.5 : -0.5)) * 100) / 100);
      var inp = document.querySelector('.zegamt[data-i="' + i + '"]'); if (inp) inp.value = fmtN(pr.aantal);
    }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t || !t.id) return;
    if (t.id === 'normSheetSearch') {
      S.normSheetQ = t.value;
      var listDiv = document.getElementById('normSheetList');
      if (listDiv) listDiv.innerHTML = buildNormSheetList(normName(S.normSheetQ));
      return;
    }
    if (t.id === 'bewaarNieuw') { S.bewaarNieuw = t.checked; persist(); return; } // v51.13: bewaar-schakelaar
    if (t.id === 'zegzin') { S.zegZin = t.value; return; }
    if (t.id === 'zegkaartin') { S.zegIn = t.value; S.zegTik = !!String(t.value || '').trim(); try { localStorage.setItem('eetweek.zegIn', S.zegIn.slice(0, 400)); } catch (e) {} return; } // v53.1 + v55.2 (13 nov) PUNT 6: zegIn persist, knopjes zichtbaar zolang er tekst staat
  });
  document.addEventListener('focusin', function (ev) {
    var t = ev.target;
    if (t && t.id === 'zegkaartin') { // v53.1: knoppen verschijnen pas na tik in het veld — v55.1: beide (🕒/📝)
      S.zegTik = true;
      var bs = document.querySelectorAll('#zegblok [data-act="zegbewaar"], #zegblok [data-act="zegtekst"]');
      for (var bi = 0; bi < bs.length; bi++) bs[bi].hidden = false;
    }
  });
  document.addEventListener('toggle', function (ev) {
    var t = ev.target; if (!t || t.id !== 'zegblok') return;
    S.zegOpen = !!t.open;
  }, true);
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t || !t.id) return;
    if (t.classList && t.classList.contains('zegamt')) {
      var i = +t.getAttribute('data-i'), pr = S.zegVoorstel && S.zegVoorstel.producten[i]; if (!pr) return;
      var n = num(t.value);
      if (n != null) pr.aantal = Math.max(0, Math.round(n * 100) / 100);
    }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute) return;
    if (t.hasAttribute && t.hasAttribute('data-sup')) { S.supers = S.supers || {}; S.supers[t.getAttribute('data-sup')] = t.checked; persist(); return; } // v51.13: mijn supermarkten
    if (t.classList && t.classList.contains('zegamt')) {
      var i = +t.getAttribute('data-i'), pr = S.zegVoorstel && S.zegVoorstel.producten[i]; if (!pr) return;
      var n = num(t.value);
      pr.aantal = Math.max(0, Math.round((n == null ? 0 : n) * 100) / 100);
      t.value = fmtN(pr.aantal);
    } else if (t.classList && t.classList.contains('zegunit')) {
      var i2 = +t.getAttribute('data-i'), pr2 = S.zegVoorstel && S.zegVoorstel.producten[i2];
      if (pr2) pr2.eenheid = t.value;
    } else if (t.classList && t.classList.contains('zegmom')) {
      var i3 = +t.getAttribute('data-i'), pr3 = S.zegVoorstel && S.zegVoorstel.producten[i3];
      if (pr3) pr3.moment = t.value;
    }
  });
  // v50.7-fix: in het recept-scherm klapt maar één sectie tegelijk open; stand wordt onthouden
  document.addEventListener('toggle', function (ev) {
    var t = ev.target;
    if (!t || !t.classList || !t.classList.contains('recsec')) return;
    S.recSec = S.recSec || {};
    S.recSec[t.getAttribute('data-sec')] = !!t.open;
    if (t.open) document.querySelectorAll('#recbody details.recsec').forEach(function (d) { if (d !== t) d.open = false; });
  }, true);

  // v50.7 testversie: input-velden in de nieuwe schermen
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t || !t.getAttribute) return;
    var zk = t.getAttribute('data-zkcal'); // kcal per 100 g bij "Nieuw product" in Zeg wat je at
    if (zk != null && S.zegVoorstel) { var zpr = S.zegVoorstel.producten[+zk]; if (zpr) { var zv = num(t.value); zpr.kcal100 = (zv != null && zv > 0 && zv <= 900) ? zv : null; } return; }
    var zp = t.getAttribute('data-zprijs'); // prijs bij "Nieuw product" (opgezocht/geschat, bewerkbaar)
    if (zp != null && S.zegVoorstel) { var zpr2 = S.zegVoorstel.producten[+zp]; if (zpr2) { var pv2 = num(t.value); zpr2.prijs = (pv2 != null && pv2 >= 0 && pv2 <= 100) ? Math.round(pv2 * 100) / 100 : null; } return; }
    var zw = t.getAttribute('data-zw'); // voedingswaarden per 100 g bij "Nieuw product"
    if (zw != null && S.zegVoorstel) { var pa = zw.split(':'); var zpr3 = S.zegVoorstel.producten[+pa[0]]; if (zpr3) { var wv = num(t.value); zpr3.w = zpr3.w || {}; var wn = (wv != null && wv >= 0 && wv <= 100) ? Math.round(wv * 100) / 100 : null; if (wn == null) delete zpr3.w[pa[1]]; else zpr3.w[pa[1]] = wn; } return; }
    var pf = t.getAttribute('data-pjf'); // bewerkbare velden in de controleer-kaartjes (controleer-stap 2.0)
    if (pf != null && S.pj && S.pj.rows) { var parts = pf.split(':'); var rr2 = S.pj.rows[+parts[0]]; if (rr2) { var key = parts[1], v2 = num(t.value); if (key.indexOf('w_') === 0) { rr2.w = rr2.w || {}; rr2.w[key.slice(2)] = v2; } else rr2[key] = v2; } }
  });

  // v1744: uitleg-regels (p.hint) dicht als standaard; tonen bij focus van het veld of via de i-knop
  function verbergAlleHints() { document.querySelectorAll('p.hint').forEach(function (h) { if (h.getAttribute('data-knop')) return; h.classList.remove('open'); h.style.display = ''; }); }
  function maakHintKnop(h) { return; } // v52: geen automatische rondje-i meer
  function maakHintKnopOud(h) {
    if (h.classList.contains('zz')) return; // wens 8 nov: direct zichtbare zinnetjes krijgen geen rondje-i
    if (!h.textContent.trim()) return; // DEEL 1C: rondje-i alleen bij echte uitleg
    if (!h.parentElement) return; // keurpunt 8 nov: bij re-render (bv. dubbel-tik) kan een hint-node losgeraakt zijn — dan geen knop plaatsen
    if (h.closest('#prodsheet')) return; // in het productformulier geen pijltje nodig (altijd zichtbaar)
    if (h.closest('.zegblok')) return; // v51.13: in zeg-wat-je-at geen rondje-i (tegeltjes zijn dikgedrukt)
    if (h.previousElementSibling && h.previousElementSibling.classList && h.previousElementSibling.classList.contains('hintinfo')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'hintinfo';
    b.setAttribute('aria-label', 'Uitleg tonen of verbergen');
    b.addEventListener('click', function () {
      var toon = !h.classList.contains('open'); // keurnotitie 1: class 'open' op de hint is de enige waarheid; knop-look synct mee
      h.classList.toggle('open', toon);
      h.style.display = '';
      if (toon) h.setAttribute('data-knop', '1'); else h.removeAttribute('data-knop');
      b.classList.toggle('open', toon);
    });
    h.parentElement.insertBefore(b, h);
  }
  document.querySelectorAll('p.hint').forEach(maakHintKnop);
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        if (n.tagName === 'P' && n.classList.contains('hint')) maakHintKnop(n);
        if (n.querySelectorAll) n.querySelectorAll('p.hint').forEach(maakHintKnop);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('focusin', function (e) {
    var v = e.target;
    if (!v || !v.matches || !v.matches('input,select,textarea')) return;
    var n = v.nextElementSibling;
    while (n && !n.matches('input,select,textarea,button,label')) {
      if (n.tagName === 'P' && n.classList.contains('hint')) n.classList.add('open');
      n = n.nextElementSibling;
    }
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () {
      var a = document.activeElement;
      if (a && a.classList && a.classList.contains('hintinfo')) return; // klik op pijltje: hint laten staan
      if (!a || !a.matches || !a.matches('input,select,textarea')) verbergAlleHints();
    }, 150);
  });

