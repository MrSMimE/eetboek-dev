// Kliktest voor Mijn Eetboek — virtuele vinger door de single-file.
// v3.27.2 (13 nov): naam-herstel — foetjes-check, ronde-6-markertje en kop-regel heten weer R6.
// Ronde-nummering: R6 = stille nieuwe-functies-ronde, R7 = v55.2-doorgeef, R8 = bon-korting;
// de aparte ronde6.js (kook-voorkeuren + AI-jury) draait los mee via het start-script.
// v3.27.1 (13 nov): BUGFIX Ronde 8 — de nep-Mistral wordt nu in de R8-openingsstap ZELF weer aangezet
// (Ronde 3 zet hem aan het eind van zijn ronde uit; zonder deze regel zouden de bon-scenario's op de
// laptop échte Mistral-aanroepen doen: echte centen + een nep-foto die niet gelezen kan worden).
// v3.27 (13 nov, wens van de gebruiker): RONDE 8 (PUNT 8) — bon-korting lezen, per supermarkt, alles in stille modus,
// gekalibreerd op de 6 echte voorbeeldbonnen van de gebruiker (foto's 28700-28707, 13 nov):
// AH 28700 ((B)-markeertje = géén korting; stuksprijs 0,49 is géén -€ 0,49-korting; echte korting = losse regel
// 'AH ITALIAANSE -0,09' onderaan bij Bonus:), AH-BB 28705 (BBOX TYRRELLS150 -0,45 koppelt op naam,
// +STATIEGELD 0,15 apart), Lidl 28703/28707 (negatief regeltje DIRECT ONDER het product = korting van dat
// product: 'In prijs verlaagd' óf 'Actieprijs'; bonusprijs-veld blijft LEEG want korting is geen bonusprijs;
// naamloze 'Lidl Plus korting' = persoonlijke korting, nooit automatisch gekoppeld), Jumbo 28704
// (ACTIE ROZIJNENBOLLEN -1,26 koppelt op naam, 'Totaal korting' als som-controle).
// HOOFDREGEL (voor Vibe Code, bot checkt hem): een negatief bedrag is een korting, geen product.
// v3.26 (13 nov, wens van de gebruiker): RONDE 7 erbij — de complete v55.2-doorgeef, alles in stille modus:
// (0) recKcal-rekenbug (rij toont kcal maar kaart zegt nog te schatten), (1) buffer-flow in de gewone
// Toevoegen-popup (DIT EETMOMENT eerst, GEEN "Jouw notitie"-blokje in de gewone popup, niks direct in de dag),
// (2) briefje ook zichtbaar bij een GEVULD moment, (3) één recept-uitklap tegelijk (popup + Recepten-tab),
// (4) Recept plakken = hele lijst met rapport, (5) zoekbalkje weg in "Zelf iets toevoegen" + "meer ▾"-flip,
// (6) zeg-knopjes zichtbaar zolang er tekst staat, (7) bron-labels (NEVO)/(OFF)/(AI) + supermarkt bij de prijs.
// v3.25 (12 nov, wens van de gebruiker): KALIBRATIE OP v55 — (1) moment-flow: eerst in #isearch zoeken vóór het
// product-kaartje (pkask) verschijnt; Toevoegen zet het blokje direct in de week (gotoprod-chip);
// (2) NIEUW: positie-checks — popup, moment-scherm, scanner en uitwerk-scherm horen BOVENIN te openen
// (wens van de gebruiker 12 nov; groter worden en het hele scherm vullen mag gewoon); (3) R6-briefjes omgebouwd
// naar de echte v55-bouw (.notewrap/.notebrief/.notedel + uitwerk-scherm met "Jouw notitie"-blokje,
// DIT EETMOMENT en "Toevoegen (n)"); (4) kopjes-↓-meting wordt een zachte notitie (bekend gedrag);
// (5) openBlokGroep opent twee keer (de "één uitklapper tegelijk"-re-render vangt de bot niet meer);
// (6) Nieuw recept/Lijst plakken/Recept plakken openen via een DOM-tikje.
// v3.23 (12 nov, wens van de gebruiker): RONDE 6 erbij — een STILLE ronde voor de nieuwe functies: foetjes-check
// (GEKOZEN-typo, Vervang dit, Laatst gekozen, Alles-van-dit-moment), Recepten-tab-regressie v53.9 (lege lijst
// zonder hint = fout), brood-zoeken zonder dode kaartjes ("nog geen kcal" mag, kaartje zonder alles = dood),
// eenheden-check (geen "1 g · 3750 kcal"-regels), zeg-kaartje BOVEN de dag-chips (canvas v12-correctie),
// briefjes-flow (✕ haalt briefje weg, + Toevoegen komt terug), uitwerk-flow ("Toevoegen (n)"-teller klopt,
// "Laat ma"-knop aanwezig), huismaten (snee/plakje/eetlepel/handje/bakje/bol, stille detectie), stil NEVO
// STIL = bestaat een functie nog niet in de build, dan komt er een nette notitie in het rapport, géén rode ✗.
// v3.22 (9 nov, wens van de gebruiker): screenshots zijn VETVRIJ — lukt een fotootje niet (bv. page.screenshot-timeout
// in de ServerKit-werkplaats), dan duurt het max 5 tellen, komt er een nette "screenshot overgeslagen"-melding
// in het rapport en klikt de bot gewoon DOOR. De klik-test zelf blijft 100% intact.
// v3.21 (6 nov, kalibratie n.a.v. 13:03-rapport 150/168): (1) openBlokGroep opent nu ÉLKE voorouder-details
// (de v50.4-Instellingen-groepjes heten .per — de "bedekt door <summary>"-fouten bij Bewaren & terugzetten,
// Terugzetten-rij en Oude data omzetten verdwijnen zo); (2) "Blokjes weer netjes dicht" sluit nu óók open
// schermpjes (het open pjsheet-gordijntje gooide eerst de hele Recepten/Thema-ronde als dominostenen om);
// (3) de bot tikt niet meer op rijen die al open staan (Kassabon-scanner, Lijst plakken, Producten plakken).
// v3.20 (6 nov, wens van de gebruiker): per klik-stap nu 4 seconden rust (in stap()), zodat alle schermpjes en
// gordijntjes (sheets/scrims) écht dicht kunnen vóór de volgende tik — de "knop bedekt"-domino verdwijnt zo.
// v3.19 (2 nov, wens van de gebruiker): de bot is geduldig geworden voor toasts. De app-toast verdwijnt
// vanzelf na 1,6 s (setTimeout 1600 in 02-basis.js), dus voor de gebruiker is er niets mis.
// Elke stap wacht nu vóór het tikken max 3 s tot de toast weg is (wachtToastWeg) — de 
// "knop bedekt door toast"-domino verdwijnt zo zonder iets aan de app te veranderen.
// Dubbel-tik-stappen blijven snel: beide tikken zitten binnen één stap, na één keer wachten.
// v3.18 (1 nov, wens van de gebruiker): het Moment in de rapporten voortaan in NEDERLANDSE TIJD (Europe/Amsterdam)
// i.p.v. UTC — nlTijd() zet het moment op de klok van de gebruiker, met het label "Nederlandse tijd" erachter.
// Git zelf blijft UTC (serverklok), maar in de rapporten hoeft ze niet meer +1 te rekenen.
// v3.17.3 (1 nov): laatste twee R5-stappen verklaard uit de v3.17.2-diagnostiek (176/178) —
// (1) de 31 dec-keuze kreeg slot "lun", maar op een donderdag heeft het dag-schema geen Lunch-moment
// (alleen Kleine lunch, slot "kl") — de keuze stond in de opslag maar kon nergens renderen; nu slot "kl".
// Kanttekening voor de code-kant (geen bug die een gebruiker raakt, de bot verzon de keuze zelf):
// een keuze in een slot dat niet in het schema van die weekdag zit, blijft onzichtbaar op die dag.
// (2) het dubbel-tik-product klikt nu de LÁÁTSTE pkgo-knop en zet ÁLLE .pkamt-velden op 100 — de eerste
// knop bleek een achtergebleven paneel uit de reken-ronde (zelfde product, oude hoeveelheid 200).
// v3.17.2 (1 nov): laatste twee R5-kalibraties n.a.v. het v3.17.1-rapport (176/178) —
// (1) de 31 dec-stap checkt nu eerst de opslag (APP.S.days["2026-12-31"]), of de dag écht opent
// (1 open dag, "31"+"dec" in de tekst) en geeft bij falen een diagnostiek met de entries (slot|naam)
// en de volledige dag-tekst — dan zien we meteen of het een echte app-bug is (entry met slot "lun"
// die niet rendert) of een test-issue; (2) het dubbel-tik-product pakt niet meer de eerste maar de
// LÁÁTSTE .pkamt op het scherm (pagina.fill greep een oud, onzichtbaar veld met value "200" uit
// een vorig moment-scherm) en vult die via evaluate + input-event — het veld op het schérm telt.
// v3.17.1 (1 nov): kalibratie n.a.v. het v3.17-rapport (170/178) — (1) de jaarwissel-stappen tikken eerst naar het
// Week-tab (de weekpijltjes stonden onzichtbaar omdat de bot op Recepten stond — dominostenen); (2) het hoeveelheids-
// vraagje scrollt eerst in beeld vóór het vullen; (3) kookmodus klipt door tot het échte eind-scherm ("Klaar" pas
// ná Stap 2 van 2) en Vorige checkt de laatste stap; (4) het recept-test gebruikt i.p. als kcal-factor (de app-idioom,
// geen product-id) én recKcal met factor; (5) verwachte console-ruis van de eigen Mistral-fout-tests (401/ERR_FAILED,
// stond ook al als 2 "fouten" in het 149/149-rapport) wordt niet meer als app-fout geteld.
// v3.17 (1 nov, Ronde 5): rekenen, jaarwissel, dubbel-tikken, kookmodus, offline, aantal-per-verpakking —
// rekenen: 200 g van 230 kcal/100 g moet 460 zijn, 1,5 plakjes (200 g ÷ 10 = 20 g per plakje) moet 69 zijn,
// en de dagtelling is de som (529); jaarwissel: met de weekpijltjes naar de vrijdag-week van 1 jan 2027,
// keuze op 31 dec 2026 blijft in zijn eigen week (geen lekkage naar 2027); dubbel-tikken: tab, dag-kop,
// + Toevoegen en product-toevoegen 2× snel — geen crashes en precies 1 blokje; kookmodus: Start met koken →
// Voorbereiden → Stap 1 van 2 → Klaar/Eet smakelijk → Vorige → ✕ Stoppen; offline: context offline tikken
// + scan op externe verwijzingen; aantal-per-verpakking ook in een recept (v48.4: kcal van plakjes-ingrediënt).
// v3.16.5 (1 nov): kalibratie n.a.v. het v3.16.4-rapport (148/149) — bij kapotte reservekopie-tekst geeft
// de app wél de nette melding "Dit is geen reservekopie" en gooit niets weg, maar sluit daarna het
// plak-scherm. Dat sluiten is geen fout (data veilig, melding duidelijk): de stap checkt nu alleen de
// melding + niets-weggegooid; het sluiten komt als notitie in het rapport (openblijven = klein wensje).
// v3.16.4 (1 nov): aangepast aan v48.3 van de code-kant — Kopiëren opent het tekst-scherm (outsheet)
// nu ALTJD ook als het klembord werkt, dus de klembord-stub is weg; en de R4-terugzet-stappen zijn robuust:
// blijft het plak-scherm open hangen na een mislukte poging, dan zet de bot zelf het menu weer op.
// v3.16.3 (1 nov): twee laatste R4-fixes — (1) sluitBewarenSchermen is nu een echte functie-declaratie
// (een const ná de aanroepende stap gaf de dominosteen terug); (2) het omzet-overzicht toont de dag als
// "Vrijdag 30 okt 2026: 1× Lunch + middag (oude indeling), ...", niet als 2026-10-22-tekst — en de bot zet
// de oude dag nu ook echt om (twee tikken: bevestigen + omzetten) en checkt: 4 keuzes blijven, 0 op oude momenten.
// v3.16.2 (1 nov): kalibratie n.a.v. het v3.16.1-rapport — (1) de zonder-product-popup heeft áltijd opties
// (o.a. "Bestaand product — Zoek in je producten"); voorgekozen = een data-p-knop, dat is de echte check;
// (2) Kopiëren lukte in de test juist via het échte klembord (toast Gekopieerd, geen tekst-scherm) — de bot
// schakelt het klembord nu uit zodat de terugval-route (outsheet + outarea) getest en gelezen wordt, en sluit
// bij falen alles netjes af (eerder viel heel R4 als dominostenen om door het opengebleven Bewaren-menu);
// (3) de Oude-data-knop zit in een dicht blokje — de bot opent dat eerst.
// v3.16.1 (1 nov): kalibratie — de app-code zit in een IIFE, dus S/addEntry/backupJson zijn NIET globaal:
// de bot werkt nu via window.APP (APP.S, APP.dayDoc, APP.saveDay, APP.persist, APP.groupOfSlot). Recept-kaartjes
// bij IN ÉÉN TIK heten data-act="quickrec" (niet recadd), staan alleen in een léég moment, en v48 houdt
// maar één moment tegelijk open (S.mopen reset). Reservekopie-text komt via de echte route Bewaren alles →
// Kopiëren (#outarea). Een recept met fixed:null/unit:null en ≤4 ingrediënten wordt los per ding geplaatst.
// v3.16 (1 nov, Ronde 4): terugzetten écht doorklikken — reservekopie plakken (Teruggezet-toast + markeerdag
// komt terug), kapotte tekst geeft "Dit is geen reservekopie" en gooit niets weg, uit bestand terugzetten via
// #restorefile; oude data (slots lm/okb/ovb/sport) bewaard blijft + in het "Oude data omzetten"-scherm zichtbaar;
// kapotte opslag ({{geen json) en lege opslag starten zonder crash, met banner en starter-recepten.
// v3.15.3 (1 nov): kalibratie chip-ronde — "Zelf iets toevoegen" maakt meteen een eigen productje, dus zo'n
// blokje wordt een product-blokje (gotoprod); een blokje-zonder-product (weekaddprod) bestaat alleen bij entries
// met een niet-P:-key (oude data) — de bot zet zo'n blokje nu zelf klaar zoals oude data eruitziet.
// R3 opent na de herstart nu ook het moment (v48: de blokjes zitten bínnen het open moment) en geeft een
// diagnostic als het blokje dan nog ontbreekt. Nieuw: recept-ronde naar aanleiding van de screenshots van de gebruiker —
// één tik op een recept-kaartje (zoals "Smeerkaas en hartig beleg") zet de losse ingrediënten bij Gekozen.
// v3.15.2 (1 nov): kalibratie — open/dicht-kliken op dag en moment kijken eerst naar de huidige stand
// (een klik is een wisselknop: een dag die al open stond klapte door de bot-klik juist dicht, waardoor
// de (2, chip-ronde)-keten en de R3-keten als dominostenen omvielen).
// v3.15.1 (1 nov): kalibratie Ronde 3 — tikken die op hun punt werden onderschepen (plakkerige dag-kop,
// dubbele scnone-knop) zijn echte JavaScript-klikken op het element zelf; Niets bewaren sluit de scanner
// niet (app-ontwerp: het bevestigt alleen met Niets bewaard), de bot sluit nu netjes met ✕.
// v3.15 (1 nov, Ronde 3): Mistral nagebootst (page.route, 0 echte aanroepen/kosten) —
// (1) eigen invoer leidend: nep-etiket mag gevulde velden niet overschrijven, alleen lege velden vullen
// plus Neem-deze-over-vinkjes; (2) falende Mistral (sleutel 401, kapot JSON, verbinding weg) geeft
// nette meldingen zonder crash en eigen waarden blijven staan; (3) crop-vierkant in de Kassabon-scanner
// 3x versleept met touch-pointer-events en daarna leest alleen het vierkant een nep-bon. Niets bewaard.
// v3.14.1 (1 nov): regex-bug in de broncode-scan gerepareerd (B + '?' was een letterlijk vraagteken - nu echte
// optionele backslash B + B + '?') en force-tikken op de vastlopende her-open/sluit-stappen na het doorklikken.
// v3.14 (1 nov): vals alarm weggehaald - doorklikken opent sinds v46 geen #prodsheet meer maar
// springt naar de Producten-tab en opent daar de productregel met highlight en pijl-terug; bot volgt nu die flow
// en opent daarna zelf de dag + het moment weer voor het losse-item-testje (de week wordt bij doorklikken hertekend).
// v3.13 (1 nov): dode-knoppen-check kijkt nu ook in de broncode (actueel/app) mee - knoppen die pas door
// code getekend worden (zoals productscherm prodsave/prodclose/prodopen/prodedit) tellen nu mee als bestaand;
// alleen acties die nergens (op de pagina of in de code) een knop hebben zijn echt dood (kanttekening Claude 1 nov).
// v3.12 (1 nov, Ronde 2): chip-tik naar popup (voorstel bovenaan, "Iets anders…" dicht, Annuleren zichtbaar),
// productkaart-check (blokjes aanwezig, "← hiervandaan" na doorklikken uit de week, max één blokje tegelijk open)
// en blokje-zonder-product (popup mag niets voorgekozen hebben) — idee 1 en 2 van Claude.
// // v3.11 (1 nov, Ronde 1): dode-knoppen-check (acties met afhandelaar maar zonder knop, en andersom),
// versie-gelijkheid (download.html + ZIP's), smal-scherm-check (360px zonder zijwaarts scrollen).
// v3.10 (1 nov): u2212-check veralgemenaard tot CSS-escapes-check — scant nu élke JavaScript-schrijfwijze
// (u+4-hexcijfers) in CSS-content, niet alleen u2212.
// v3.9 (1 nov): vangnetten n.a.v. de Claude-testronde van 1 nov — (1) pijltje-check: dag-pijltje open vs dichte
// moment-pijltjes moeten een ándere stand hebben (Claude vond dat .day.open .chev ook de momentpijltjes pakt);
// (2) u2212-check: het CSS-min-teken moet een echte − zijn, geen letterlijke tekst "u2212"; (3) losse pagina's:
// alle vijf pagina's uit actueel/app laden zonder JS-fouten (Claude vond "S is not defined" op index.html —
// de bot testte voorheen alleen de single-file). Plus: README-versie-check en telling van dubbele bestandskiezers.
// v3.8 (1 nov): Week-momenten zijn in v48 inline uitklapblokjes geworden (tik op .mkop, geen sheet meer) —
// de test opent nu het moment inline, tikt daarna op "+ Toevoegen" (.toevoegknop) om het moment-scherm te openen,
// sluit met ✕ en klapt het moment weer dicht. v3.7 (31 okt, deel 3): Recepten (Nieuw recept + Recept plakken openen/✕), thema-wissel (donker/contrast/automatisch
// met kleur-check), Producten plakken via Lijst plakken, Terugzetten-menu (niets terugzetten). (v3.6: Producten-tab start 'rustig' — hoofdgroepen verschijnen pas na de tik op 📁 Blader per categorie;
// de test tikt die knop nu eerst en zet het scherm na afloop weer terug op rustig. (v3.5: selector-fixes + Mijn regels eruit.) Deel 2: + Producten-tests (hoofdgroep, subcategorie, productregel, zoeken — met één testproduct in de testomgeving),
// Bewaren-menu (incl. Bewaren-alles + terugknop), Mijn regels en Lijst plakken. Deel 1: Iets-toevoegen via Instellingen + Week-tests.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
// Dev-vangrail: in eetboek-dev wonen de losse bestanden in versies/opdeling-test i.p.v. app-test
const APPTEST = ['app-test', 'versies/opdeling-test'].map(m => path.join(__dirname, '..', m)).filter(p => fs.existsSync(p));

const outDir = path.join(__dirname, 'rapport');
fs.mkdirSync(outDir, { recursive: true });

// v3.18: het Moment in Nederlandse tijd (Europe/Amsterdam) — de gebruiker hoeft niet meer +1 te rekenen.
function nlTijd() {
  try {
    return new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return new Date().toISOString().slice(0, 16) + ' (UTC)'; }
}

const map = path.join(__dirname, '..', 'backup');
const kandidaten = fs.existsSync(map) ? fs.readdirSync(map).filter(f => /^Mijn-Eetboek-v[0-9]/.test(f) && f.endsWith('.html')) : []; // dev-repo: geen backup/ -> leeg, URL komt toch als argument
const versie = f => (f.match(/v([0-9]+(?:\.[0-9]+)*)/) || [0, '0'])[1].split('.').map(Number);
const nieuwste = kandidaten.sort((a, b) => {
  const va = versie(a), vb = versie(b);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) { const d = (va[i] || 0) - (vb[i] || 0); if (d) return d; }
  return 0;
}).pop();

const url = process.argv[2] || ('http://localhost:8080/backup/' + encodeURIComponent(nieuwste));
let huidigeStap = '(start)';
const WATCHDOG_MS = 2700000; // v3.24 (12 nov, wens van de gebruiker): waakhond 30 -> 45 min - langere rondes (o.a. kijk-run met AI erbij) passen erin, en bij een hangende stap blijft de bot nog steeds niet eeuvig wachten
const watchdog = setTimeout(() => {
  console.error('WAAKHOND: test bleef hangen bij: ' + huidigeStap);
  try {
    fs.writeFileSync(path.join(outDir, 'rapport.md'), '# Kliktest-rapport\n\n**Test bleef hangen bij stap: ' + huidigeStap + '** — waakhond heeft na ' + Math.round(WATCHDOG_MS / 60000) + ' minuten gestopt. Kijk in de GitHub-log bij welke stap het misging.\n\n**Getest:** ' + url.split('/').pop() + '\n**Moment:** ' + nlTijd() + ' (Nederlandse tijd)' + '\n');
  } catch (e) {}
  process.exit(2);
}, WATCHDOG_MS);
const fouten = [];
const stappen = [];
const notities = [];
var r3Verwacht = false; // v3.17.1: console-ruis ("Failed to load resource") die de bot zélf veroorzaakt in de Mistral-fout-tests is verwacht, géén app-fout
let nr = 0;

async function schot(p, naam) {
  nr++;
  try {
    await p.screenshot({ path: path.join(outDir, String(nr).padStart(2, '0') + '-' + naam + '.png'), timeout: 5000, animations: 'disabled' });
  } catch (e) {
    try { notities.push('screenshot "' + naam + '" overgeslagen (' + String(e && e.message ? e.message.split('\n')[0] : e) + ') — klik-test ging gewoon door'); } catch (e2) {}
  }
}

async function onderzoekBlokkade(p, sel) {
  try {
    const zichtbaar = sel.replace(':visible', '');
    const box = await p.locator(zichtbaar).first().boundingBox({ timeout: 2000 });
    if (!box) return 'knop heeft geen afmetingen (onzichtbaar of weg)';
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const boven = await p.evaluate(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return 'niets op dat punt';
      return '<' + el.tagName.toLowerCase() + (el.id ? ' id=' + el.id : '') + (el.className && typeof el.className === 'string' ? ' class=' + el.className.split(' ').slice(0, 2).join('.') : '') + (el.getAttribute('data-act') ? ' act=' + el.getAttribute('data-act') : '') + '>';
    }, [cx, cy]);
    return 'midden van de knop (' + Math.round(cx) + ',' + Math.round(cy) + ') wordt bedekt door: ' + boven;
  } catch (e) { return 'kon blokkade niet onderzoeken: ' + String(e).slice(0, 120); }
}

// v3.19: de app-toast verdwijnt vanzelf na 1,6 s — de bot wacht max 3 s tot hij weg is, dan pas tikken.
// Duurt het langer, dan tikt de bot gewoon door; als de knop dan écht bedekt blijft, vangt de stap-diagnose het.
async function wachtToastWeg(p) {
  try { await p.waitForFunction(() => { const t = document.getElementById('toast'); return !t || t.hidden; }, null, { timeout: 3000, polling: 200 }); }
  catch (e) { /* toast bleef langer liggen — doorgaan, diagnose regelt de rest */ }
}

async function stap(p, omschrijving, actie, sel) {
  huidigeStap = omschrijving;
  await wachtToastWeg(p);
  await p.waitForTimeout(3000); // v3.22: 3 s rust per klik-stap (was 4 s in v3.20; 2 s is te krap — toast 1,6 s + animaties; zie docs/BOT-SCHALING.md)

  try { await actie(); stappen.push({ omschrijving, ok: true }); }
  catch (e) {
    const vol = String((e && e.message) || e);
    let diagnose = '';
    if (sel) diagnose = await onderzoekBlokkade(p, sel);
    stappen.push({ omschrijving, ok: false, fout: vol.replace(/\|/g, '/').slice(0, 600) + (diagnose ? ' — ' + diagnose : '') });
  }
}

// v50: momenten zitten in dagdelen — zorg dat er één dagdeel open staat vóór moment-interacties
async function zorgDagdeelOpen(p) {
  await p.evaluate(() => {
    if (!document.querySelector('#days .day.open .dagdeel.open .mkop')) {
      const d = document.querySelector('#days .day.open .dkop');
      if (d) d.click();
    }
  });
  await p.waitForTimeout(250);
}

// v50.1/v50.2: Kookhulp en Instellingen hebben groepjes (details.pgrp) — een blok is pas tikbaar als de groep open is
async function openBlokGroep(p, sel) {
  // v3.25: twee rondes — de "één uitklapper tegelijk"-toggle van v50.4 kan bij de eerste open-ronde
  // net een re-render trappen die blokjes weer dichtgooit; de tweede ronde maakt het zeker.
  for (let ronde = 0; ronde < 2; ronde++) {
    await p.evaluate((s2) => {
      let d = document.querySelector(s2);
      if (!d) return;
      let n = d;
      while (n) {
        if (n.tagName === 'DETAILS' && !n.open) n.open = true; // v3.21: élke voorouder-details openen (v50.4-groepjes heten .per)
        if (n.matches && n.matches('.khgrp, .instgrp, .subgrp') && !n.open) n.open = true;
        n = n.parentElement;
      }
    }, sel);
    await p.waitForTimeout(200);
  }
}

// v3.25 (12 nov, wens van de gebruiker): meet of een schermpje netjes BOVENIN opent (bovenrand binnen de bovenste 15%).
// Groter worden en het hele scherm vullen mag gewoon — het gaat om de bovenrand.
async function meetBovenin(p, naam, sel) {
  const pct = await p.evaluate((s3) => {
    const el = document.querySelector(s3);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return Math.round(100 * r.top / window.innerHeight);
  }, sel);
  if (pct === null) throw new Error(naam + ': geen element gevonden om de positie te meten (' + sel + ')');
  if (pct > 15) throw new Error(naam + ' opent op ' + pct + '% van de schermhoogte — wens van de gebruiker (12 nov): bovenin. Groter worden en het hele scherm vullen mag gewoon.');
  return pct;
}

// v50.1/v50.2: Terugzetten-knop in Instellingen — open éventuele kaart/groep eerst (als die er is), dan de knop
async function openTerugzetten(p) {
  await p.tap('#tabinst', { timeout: 8000 });
  await p.waitForTimeout(300);
  await openBlokGroep(p, 'button[data-act="addgo"][data-v="uitbestand"]');
  await p.waitForTimeout(250);
  const fcPromise = p.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
  await p.tap('button[data-act="addgo"][data-v="uitbestand"]:visible', { timeout: 8000 });
  await p.waitForTimeout(300);
  return fcPromise;
}

(async () => {
  console.log('Testen: ' + url);
  const browser = await chromium.launch();
  const pagina = await browser.newPage({ viewport: { width: 400, height: 889 }, hasTouch: true });
  pagina.setDefaultTimeout(15000);
  pagina.on('pageerror', e => fouten.push('PAGEERROR: ' + String(e).slice(0, 300)));
  pagina.on('console', m => { if (m.type() === 'error') { if (r3Verwacht && /Failed to load resource/.test(m.text())) return; fouten.push('CONSOLE: ' + m.text().slice(0, 300)); } });
  await pagina.goto(url, { waitUntil: 'load' });
  await schot(pagina, 'start');

  // 1. De vijf tabs (tikken als vinger; v47: tabgem heet tegenwoordig Kookhulp)
  for (const [id, naam] of [['tabweek','Week'],['tabrec','Recepten'],['tabprijs','Producten'],['tabgem','Kookhulp'],['tabinst','Tandwiel']]) {
    await stap(pagina, 'Tab ' + naam, () => pagina.tap('#' + id, { timeout: 8000 }), '#' + id);
    await stap(pagina, 'Tab ' + naam + ' is actief', async () => {
      const pressed = await pagina.getAttribute('#' + id, 'aria-pressed');
      if (pressed !== 'true') throw new Error('aria-pressed=' + pressed);
    });
    await schot(pagina, 'tab-' + id.replace('tab',''));
  }

  // v58.5: zesde tab Boodschappen (alleen als hij in de build zit — testversie)
  if (await pagina.$('#tabbo')) {
    await stap(pagina, 'Tab Boodschappen', () => pagina.tap('#tabbo', { timeout: 8000 }), '#tabbo');
    await stap(pagina, 'Tab Boodschappen is actief', async () => {
      const pressed = await pagina.getAttribute('#tabbo', 'aria-pressed');
      if (pressed !== 'true') throw new Error('aria-pressed=' + pressed);
    });
    await stap(pagina, 'Boodschappen-view toont de kop', async () => {
      const t = await pagina.textContent('#boview h2').catch(() => '');
      if (!/Boodschappen/i.test(t || '')) throw new Error('geen kop Boodschappen in #boview: ' + t);
    });
    await pagina.tap('#tabweek', { timeout: 8000 });
  }

  // 2. Week-tab: Etiket-check uitklappen (v47.4: de oude Toevoegen-menu-knoppen bestaan niet meer)
  await stap(pagina, 'Naar Week-tab', () => pagina.tap('#tabweek', { timeout: 8000 }), '#tabweek');
  await stap(pagina, 'Etiket-check klapt open', async () => {
    await pagina.tap('#weekview details.check summary', { timeout: 8000 });
    await pagina.waitForTimeout(200);
    const open = await pagina.getAttribute('#weekview details.check', 'open');
    if (open === null) throw new Error('etiket-check bleef dicht');
  }, '#weekview details.check summary');
  await schot(pagina, 'etiket-check-open');
  await stap(pagina, 'Etiket-check klapt dicht', async () => {
    await pagina.tap('#weekview details.check summary', { timeout: 8000 });
    await pagina.waitForTimeout(200);
    const open = await pagina.getAttribute('#weekview details.check', 'open');
    if (open !== null) throw new Error('etiket-check bleef open');
  }, '#weekview details.check summary');

  // 2b. Week-tests (31 okt, v3.3): weeknavigatie, dag open/dicht, moment-scherm + ✕
  await stap(pagina, 'Weekpijltje vorige week', async () => {
    const voor = await pagina.textContent('#weeklabel');
    await pagina.tap('button[data-act="prev"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(250);
    const na = await pagina.textContent('#weeklabel');
    if (voor === na) throw new Error('weeklabel veranderde niet');
    const tl = await pagina.getAttribute('#todaylink', 'hidden');
    if (tl !== null) throw new Error('"Naar deze week" verscheen niet');
  }, 'button[data-act="prev"]');
  await schot(pagina, 'week-terug');
  await stap(pagina, 'Naar deze week', async () => {
    await pagina.tap('button[data-act="today"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(250);
    const tl = await pagina.getAttribute('#todaylink', 'hidden');
    if (tl === null) throw new Error('"Naar deze week" bleef staan');
  }, 'button[data-act="today"]');
  await stap(pagina, 'Weekpijltje volgende week', async () => {
    const voor = await pagina.textContent('#weeklabel');
    await pagina.tap('button[data-act="next"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(250);
    const na = await pagina.textContent('#weeklabel');
    if (voor === na) throw new Error('weeklabel veranderde niet');
  }, 'button[data-act="next"]');
  await stap(pagina, 'Terug naar deze week', async () => {
    await pagina.tap('button[data-act="today"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(250);
  }, 'button[data-act="today"]');
  await stap(pagina, 'Dag klapt open', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#days .dayhead'); if (!el) throw new Error('knop niet gevonden: #days .dayhead'); el.click(); });
    await pagina.waitForTimeout(250);
    const exp = await pagina.getAttribute('#days .dayhead >> nth=0', 'aria-expanded');
    if (exp !== 'true') throw new Error('dag bleef dicht');
  }, '#days .dayhead');
  await zorgDagdeelOpen(pagina);
  await stap(pagina, 'Dagdeel klapt open (v50: 4 dagdelen, één tegelijk open, teller, bolletjes)', async () => {
    const n = await pagina.locator('#days .day.open .dagdeel').count();
    if (n !== 4) throw new Error('open dag heeft ' + n + ' dagdelen (hoort 4 te zijn)');
    const tel = await pagina.evaluate(() => { const t = document.querySelector('#days .day.open .dagdeel .dagdeel-tel'); return t ? t.textContent : ''; });
    if (!/momenten/.test(tel)) throw new Error('dagdeel-teller ontbreekt: "' + tel + '"');
    await pagina.tap('#days .day.open .dkop >> nth=1', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const open = await pagina.locator('#days .day.open .dagdeel.open').count();
    if (open !== 1) throw new Error('na tik op 2e dagdeel staan er ' + open + ' dagdelen open (hoort 1 te zijn — v50 inklapsysteem)');
    const dots = await pagina.locator('#days .day.open .dagdeel.open .mdot').count();
    if (dots < 1) throw new Error('geen bolletjes (groen/rood) in het open dagdeel');
    const leegTekst = await pagina.evaluate(() => !!document.querySelector('#days .day.open .mkop .mk'));
    if (leegTekst) throw new Error('"leeg"-tekst nog zichtbaar op een moment-rij (v50: bolletje instead)');
    await zorgDagdeelOpen(pagina);
  }, '#days .day.open .dkop >> nth=1');
  await schot(pagina, 'dag-open');
  // v3.9: pijltje-check — bij een open dag wijst het dag-pijltje gedraaid omhoog,
  // maar de dichte moment-pijltjes moeten de dicht-stand houden. Zijn ze gelijk, dan pakt
  // een CSS-regel als ".day.open .chev" ook de momentpijltjes (moet ".day.open > .dayhead .chev" zijn).
  await stap(pagina, 'Pijltjes: open dag ≠ dichte momenten (v48-check)', async () => {
    await pagina.waitForTimeout(400); // transition klaar
    const standen = await pagina.evaluate(() => {
      const dag = document.querySelector('#days .dayhead .chev');
      const mom = document.querySelector('#days .day.open .moment .mkop .chev');
      if (!dag) return { fout: 'geen dag-pijltje gevonden' };
      if (!mom) return { fout: 'geen moment-pijltje gevonden' };
      return { dag: getComputedStyle(dag).transform, mom: getComputedStyle(mom).transform };
    });
    if (standen.fout) throw new Error(standen.fout);
    if (!standen.dag || standen.dag === 'none') throw new Error('dag-pijltje heeft geen transform');
    if (standen.dag === standen.mom) throw new Error('dag-pijltje en dicht moment-pijltje staan hetzelfde (' + standen.dag + ') — vermoedelijk pakt ".day.open .chev" ook de momentpijltjes; fix: ".day.open > .dayhead .chev"');
  });
  await stap(pagina, 'Moment klapt open (v48: inline)', async () => {
    await pagina.tap('#days .day.open .moment .mkop >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const exp = await pagina.getAttribute('#days .day.open .moment .mkop >> nth=0', 'aria-expanded');
    if (exp !== 'true') throw new Error('moment bleef dicht (aria-expanded=' + exp + ')');
    const n = await pagina.locator('#days .day.open .moment.open').count();
    if (n < 1) throw new Error('geen open moment-block gevonden (class "open" ontbreekt)');
  }, '#days .day.open .moment .mkop >> nth=0');
  await schot(pagina, 'moment-open');
  await stap(pagina, '+ Toevoegen opent moment-scherm', async () => {
    await pagina.tap('#days .day.open .moment.open .toevoegknop >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden !== null) throw new Error('moment-scherm bleef dicht');
  }, '#days .day.open .moment.open .toevoegknop >> nth=0');
  await schot(pagina, 'moment-sheet');
  await stap(pagina, '✕ sluit moment-scherm', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#sheet .xbtn[data-act="close"]'); if (!el) throw new Error('knop niet gevonden: #sheet .xbtn[data-act="close"]'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden === null) throw new Error('moment-scherm stond nog open na ✕');
    const pressed = await pagina.getAttribute('#tabweek', 'aria-pressed');
    if (pressed !== 'true') throw new Error('na ✕ staat het Week-tab niet meer actief');
  }, '#sheet .xbtn[data-act="close"]');
  // 2c. Ronde 2 (1 nov, v3.12): chip-tik naar popup + productkaart-check (idee 1+2 van Claude).
  // Eerst het testproduct in een week-moment zetten, dan het blokje in de week aantikken.
  await stap(pagina, 'Testproduct klaarzetten (chip-ronde)', async () => {
    await pagina.evaluate(() => {
      try {
        var raw = localStorage.getItem('eetweek.v1'), o = raw ? JSON.parse(raw) : {};
        o.days = o.days || {}; o.weights = o.weights || {}; o.fav = o.fav || [];
        o.recipes = o.recipes || []; o.seeded = true;
        o.prijzen = [{ id: 'kliktest1', n: 'Test Broodje', u: 'g', inh: 500, pr: 1.05, kc: 230, cat: ['brood'], alias: [], w: {}, lab: [], labx: [], foto: '' }];
        o.icat = o.icat || {}; o.lijst = o.lijst || []; o.maxes = o.maxes || {}; o.rare = o.rare || {};
        localStorage.setItem('eetweek.v1', JSON.stringify(o));
      } catch (e) {}
    });
    await pagina.reload({ waitUntil: 'load' });
    await pagina.waitForTimeout(3000); // v3.23: 3 s na herladen (sws)
    await pagina.waitForTimeout(400);
  });
  await stap(pagina, 'Dag klapt open (chip-ronde)', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#days .dayhead'); if (!el) throw new Error('knop niet gevonden: #days .dayhead'); el.click(); });
    await pagina.waitForTimeout(250);
    const exp = await pagina.getAttribute('#days .dayhead >> nth=0', 'aria-expanded');
    if (exp !== 'true') throw new Error('dag bleef dicht');
  }, '#days .dayhead');
  await zorgDagdeelOpen(pagina);
  await stap(pagina, 'Moment klapt open (chip-ronde)', async () => {
    await pagina.tap('#days .day.open .moment .mkop >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const n = await pagina.locator('#days .day.open .moment.open').count();
    if (n < 1) throw new Error('moment bleef dicht');
  }, '#days .day.open .moment .mkop >> nth=0');
  await stap(pagina, '+ Toevoegen opent moment-scherm (chip-ronde)', async () => {
    await pagina.tap('#days .day.open .moment.open .toevoegknop >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden !== null) throw new Error('moment-scherm bleef dicht');
  }, '#days .day.open .moment.open .toevoegknop >> nth=0');
  await stap(pagina, 'Moment-scherm opent bovenin (wens van de gebruiker 12 nov)', async () => {
    await meetBovenin(pagina, 'het moment-scherm', '#sheet .panel');
  }, '#sheet .panel');
  await stap(pagina, 'Testproduct zoeken vraagt om hoeveelheid (v55: eerst Zoeken)', async () => {
    // v3.25: sinds v53/v55 toont het moment-scherm pas kaartjes na zoeken — leeg zoekveld = niets eronder
    await pagina.fill('#isearch', 'Test Broodje');
    await pagina.waitForTimeout(700);
    await pagina.tap('#pbody button[data-act="pkask"] >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const n = await pagina.locator('#pbody .pkamt').count();
    if (n < 1) throw new Error('het hoeveelheids-vraagje verscheen niet');
  }, '#pbody button[data-act="pkask"]');
  await stap(pagina, 'Toevoegen zet het product in het moment (v55: blokje in de week)', async () => {
    await pagina.tap('#pbody button[data-act="pkgo"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(700);
    // v3.25: sinds v55 zet Toevoegen het product direct in het moment — .picked bestaat niet meer
    const n = await pagina.locator('#days .day.open .moment button.chip[data-act="gotoprod"]', { hasText: 'Test Broodje' }).count();
    if (n < 1) throw new Error('het Test Broodje-blokje verscheen niet in het moment');
  }, '#pbody button[data-act="pkgo"]');
  await stap(pagina, '✕ sluit moment-scherm (chip-ronde)', async () => {
    // v3.25: na Toevoegen klapt het scherm in v55 vanzelf dicht — dan is deze check al voldaan
    const alDicht = await pagina.evaluate(() => { const s = document.querySelector('#sheet'); return !s || s.hidden; });
    if (alDicht) return;
    await pagina.evaluate(() => { const el = document.querySelector('#sheet .xbtn[data-act="close"]'); if (!el) throw new Error('knop niet gevonden: #sheet .xbtn[data-act="close"]'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden === null) throw new Error('moment-scherm stond nog open');
  }, '#sheet .xbtn[data-act="close"]');
  await stap(pagina, 'Blokje aantikken opent de popup', async () => {
    const n = await pagina.locator('#days .day.open button.chip[data-act="gotoprod"]').count();
    if (n < 1) throw new Error('geen aantikbaar blokje (chip) in de week gevonden');
    await pagina.evaluate(() => { const el = document.querySelector('#days .day.open button.chip[data-act="gotoprod"]'); if (!el) throw new Error('knop niet gevonden: #days .day.open button.chip[data-act="gotoprod"]'); el.click(); });
    await pagina.waitForTimeout(400);
    const ov = await pagina.locator('#choiceov').count();
    if (ov < 1) throw new Error('de popup opende niet');
  }, '#days .day.open button.chip[data-act="gotoprod"]');
  await schot(pagina, 'chip-popup');
  await stap(pagina, 'Popup: voorstel bovenaan', async () => {
    const tekst = await pagina.textContent('#choiceov');
    if (tekst.indexOf('Test Broodje') === -1) throw new Error('het voorstel (Test Broodje) staat niet in de popup');
  });
  await stap(pagina, 'Popup opent bovenin (wens van de gebruiker 12 nov)', async () => {
    await meetBovenin(pagina, 'de voorstellen-popup', '#choiceov .choice-popup');
  }, '#choiceov .choice-popup');
  await stap(pagina, 'Popup: "Iets anders…" dicht, Annuleren zichtbaar', async () => {
    const open = await pagina.getAttribute('#choiceov details.choice-more', 'open');
    if (open !== null) throw new Error('"Iets anders…" stond al open — hoort dicht te zijn tot je erop tikt');
    const zichtbaar = await pagina.locator('#choiceov #choicecancel').isVisible();
    if (!zichtbaar) throw new Error('de Annuleren-knop is niet zichtbaar');
  }, '#choiceov #choicecancel');
  await stap(pagina, 'Annuleren sluit de popup', async () => {
    await pagina.tap('#choiceov #choicecancel', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const n = await pagina.locator('#choiceov').count();
    if (n > 0) throw new Error('de popup stond nog open na Annuleren');
  }, '#choiceov #choicecancel');
    // v3.14: doorklikken opent sinds v46 GEEN #prodsheet meer - choiceGo springt naar de Producten-tab en
  // opent daar de productregel (details.prod2) met highlight en met een pijl-terug (vandaar-tekst).
  await stap(pagina, 'Doorklikken springt naar Producten (v46-flow)', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#days .day.open button.chip[data-act="gotoprod"]'); if (!el) throw new Error('knop niet gevonden: #days .day.open button.chip[data-act="gotoprod"]'); el.click(); });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const el = document.querySelector('#choiceov .choice-list button'); if (!el) throw new Error('knop niet gevonden: #choiceov .choice-list button'); el.click(); });
    await pagina.waitForTimeout(900); // v46 klapt de productregel open met een klein uitstelje
    const ap = await pagina.getAttribute('#tabprijs', 'aria-pressed');
    if (ap !== 'true') throw new Error('de Producten-tab stond niet actief na het aantikken van het voorstel');
  }, '#choiceov .choice-list button');
  await schot(pagina, 'productregel-uit-week');
  await stap(pagina, 'Productregel: open met naam en pijl-terug (v46)', async () => {
    const sel = '#prijsview details.prod2[data-rk^="pr:kliktest1"]';
    const n = await pagina.locator(sel).count();
    if (n < 1) throw new Error('de productregel van Test Broodje verscheen niet op de Producten-tab');
    const open = await pagina.getAttribute(sel, 'open');
    if (open === null) throw new Error('de productregel stond niet open - v46 hoort hem na doorklikken open te klappen');
    const tekst = await pagina.textContent(sel);
    if (tekst.indexOf('Test Broodje') === -1) throw new Error('de productnaam staat niet op de regel');
    const van = await pagina.locator(sel + ' .wfromt').count();
    if (van < 1) throw new Error('de pijl-terug (hiervandaan-tekst) verschijnt niet, terwijl de regel vanuit de week is geopend');
  }, '#prijsview details.prod2[data-rk^="pr:kliktest1"]');
  await stap(pagina, 'Productregel: tweede blokje sluit het eerste (max 1 open)', async () => {
    const sel = '#prijsview details.prod2[data-rk^="pr:kliktest1"]';
    const n = await pagina.locator(sel + ' details.psum').count();
    if (n < 2) { notities.push('Productregel max-een-blokje-open niet volledig te testen: maar ' + n + ' blokje(s) op de regel.'); return; }
    await pagina.tap(sel + ' details.psum:not([open]) summary >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const na = await pagina.locator(sel + ' details.psum[open]').count();
    if (na > 1) throw new Error('na het openen van een tweede blokje stonden er ' + na + ' open - Claude verwachtte maximaal een');
  }, '#prijsview details.prod2[data-rk^="pr:kliktest1"] details.psum:not([open]) summary');
  await stap(pagina, 'Terug naar Week-tab (chip-ronde 2)', async () => {
    await pagina.tap('#tabweek', { timeout: 8000 });
    await pagina.waitForTimeout(400);
  }, '#tabweek');
  await stap(pagina, 'Dag klapt open (2, chip-ronde)', async () => {
    await pagina.evaluate(function () { window.scrollTo(0, 0); });
    await pagina.waitForTimeout(500); // v3.14.1: even wachten tot het smooth-scrollen van doorklikken uit dempen is
    const dagStondOpen2 = await pagina.getAttribute('#days .dayhead >> nth=0', 'aria-expanded');
    if (dagStondOpen2 !== 'true') await pagina.evaluate(() => { const el = document.querySelector('#days .dayhead'); if (!el) throw new Error('knop niet gevonden: #days .dayhead'); el.click(); });
    await pagina.waitForTimeout(250);
    const exp = await pagina.getAttribute('#days .dayhead >> nth=0', 'aria-expanded');
    if (exp !== 'true') throw new Error('dag bleef dicht');
  }, '#days .dayhead');
  await zorgDagdeelOpen(pagina);
  await stap(pagina, 'Moment klapt open (2, chip-ronde)', async () => {
    const alOpenMom = await pagina.locator('#days .day.open .moment.open').count();
    if (alOpenMom < 1) await pagina.evaluate(() => { const el = document.querySelector('#days .day.open .moment .mkop'); if (!el) throw new Error('knop niet gevonden: #days .day.open .moment .mkop'); el.click(); });
    await pagina.waitForTimeout(400);
    const n = await pagina.locator('#days .day.open .moment.open').count();
    if (n < 1) throw new Error('moment bleef dicht');
  }, '#days .day.open .moment .mkop >> nth=0');
  
  await stap(pagina, '+ Toevoegen opent moment-scherm (2, chip-ronde)', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#days .day.open .moment.open .toevoegknop'); if (!el) throw new Error('knop niet gevonden: #days .day.open .moment.open .toevoegknop'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden !== null) throw new Error('moment-scherm bleef dicht');
  }, '#days .day.open .moment.open .toevoegknop >> nth=0');
  await stap(pagina, 'Eigen invoer bij Zelf iets toevoegen (wordt eigen productje)', async () => {
    await pagina.fill('#freename', 'Restje soep');
    await pagina.tap('#pbody button[data-act="freeadd"]:visible', { timeout: 8000, force: true });
    await pagina.waitForTimeout(400);
    const tekst = await pagina.textContent('#pbody');
    if (tekst.indexOf('Restje soep') === -1) throw new Error('het eigen item verscheen niet bij Gekozen');
    const eigen = await pagina.evaluate(() => { if (!window.APP) throw new Error('window.APP bestaat niet in deze build'); return (APP.S.prijzen || []).some(function (p) { return p.n === 'Restje soep'; }); });
    if (!eigen) throw new Error('het eigen item staat niet tussen de producten — de hint belooft dat het ook bij Producten komt te staan');
  }, '#pbody button[data-act="freeadd"]');
  await stap(pagina, 'Oud-data-blokje klaarzetten (nog géén product)', async () => {
    await pagina.evaluate(() => {
      if (!window.APP) throw new Error('window.APP bestaat niet in deze build');
      var d = APP.dayDoc(APP.S.sheet.day);
      d.entries.push({ id: APP.uid(), slot: APP.S.sheet.slot, key: 'BOT:1', code: '', name: 'Oud blokje', k: null });
      APP.saveDay();
    });
    const ok = await pagina.evaluate(() => !!(APP.S.sheet && APP.dayDoc(APP.S.sheet.day).entries.some(function (e) { return e.name === 'Oud blokje'; })));
    if (!ok) throw new Error('het oud-data-blokje staat niet in de opslag (het verschijnt in de week na het sluiten van het moment-scherm)');
  });
  await stap(pagina, '✕ sluit moment-scherm (2, chip-ronde)', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#sheet .xbtn[data-act="close"]'); if (!el) throw new Error('knop niet gevonden: #sheet .xbtn[data-act="close"]'); el.click(); });
    await pagina.waitForTimeout(400);
  }, '#sheet .xbtn[data-act="close"]');
  await stap(pagina, 'Blokje zonder product: popup zonder voorkeuze', async () => {
    const n = await pagina.locator('#days .day.open button.chip[data-act="weekaddprod"]').count();
    if (n < 1) throw new Error('geen blokje zonder product gevonden (weekaddprod)');
    await pagina.evaluate(() => { const el = document.querySelector('#days .day.open button.chip[data-act="weekaddprod"]'); if (!el) throw new Error('knop niet gevonden: #days .day.open button.chip[data-act="weekaddprod"]'); el.click(); });
    await pagina.waitForTimeout(400);
    const ov = await pagina.locator('#choiceov').count();
    if (ov < 1) throw new Error('de popup opende niet bij een blokje zonder product');
    const voor = await pagina.locator('#choiceov .choice-list button[data-p]').count();
    if (voor > 0) throw new Error('er staat een product voorgekozen (' + voor + 'x data-p) terwijl dit blokje geen product heeft');
    const geen = await pagina.locator('#choiceov .choice-list button').count();
    if (geen < 1) throw new Error('de popup toont geen enkele optie (er hoort o.a. "Bestaand product — Zoek in je producten" te staan)');
  }, '#days .day.open button.chip[data-act="weekaddprod"]');
  await schot(pagina, 'chip-popup-zonder-product');
  await stap(pagina, 'Annuleren sluit de popup (zonder product)', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#choiceov #choicecancel'); if (!el) throw new Error('knop niet gevonden: #choiceov #choicecancel'); el.click(); });
    await pagina.waitForTimeout(300);
    const n = await pagina.locator('#choiceov').count();
    if (n > 0) throw new Error('de popup stond nog open na Annuleren');
  }, '#choiceov #choicecancel');

  // Recept-ronde (1 nov, v3.15.3, naar aanleiding van de screenshots van de gebruiker 26558/26559):
  // één tik op een recept-kaartje bij "IN ÉÉN TIK" zet de losse ingrediënten in het moment.
  let recSlot = '';
  await stap(pagina, 'Recept-ronde: tweede moment open (v48: één tegelijk open)', async () => {
    recSlot = await pagina.evaluate(() => { const el = document.querySelector('#days .day.open .moment:not(.open) .mkop'); if (!el) throw new Error('knop niet gevonden: #days .day.open .moment:not(.open) .mkop'); return el.getAttribute('data-slot') || ''; });
    await pagina.evaluate(() => { document.querySelector('#days .day.open .moment:not(.open) .mkop').click(); });
    await pagina.waitForTimeout(500);
    const n = await pagina.locator('#days .day.open .moment.open').count();
    if (n !== 1) throw new Error('na de tik staan er ' + n + ' momenten open (hoort er 1 te zijn — v48 houdt één moment tegelijk open, de eerste klapte dicht)');
    const openSlot = await pagina.evaluate(() => { const el = document.querySelector('#days .day.open .moment.open .mkop'); return el ? (el.getAttribute('data-slot') || '') : ''; });
    if (openSlot !== recSlot) throw new Error('het open moment is niet het aangeklikte moment (slot ' + openSlot + ' i.p.v. ' + recSlot + ')');
  }, '#days .day.open .moment .mkop >> nth=1');
  await stap(pagina, 'Recept-ronde: moment-scherm van het tweede moment open', async () => {
    await pagina.evaluate(() => { const lijst = document.querySelectorAll('#days .day.open .moment.open .toevoegknop'); const el = lijst[lijst.length - 1]; if (!el) throw new Error('knop niet gevonden: .moment.open .toevoegknop'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden !== null) throw new Error('moment-scherm bleef dicht');
  }, '#days .day.open .moment.open .toevoegknop >> nth=0');
  await stap(pagina, 'Recept-ronde: nep-recept met 3 dingen klaarzetten (via APP)', async () => {
    await pagina.evaluate(() => {
      if (!window.APP) throw new Error('window.APP bestaat niet in deze build');
      var S = APP.S;
      if (!S.recipes.some(function (r) { return r.id === 'botrec1'; })) {
        S.recipes.push({ id: 'botrec1', name: 'Boterham met smeerkaas en ham', unit: null, fixed: null, where: [APP.groupOfSlot(S.sheet.slot) || 'ochtend'], ing: [
          { n: 'Test Snee brood', a: 1, u: 'stuk', p: null },
          { n: 'Test Smeerkaas', a: 25, u: 'g', p: null },
          { n: 'Test Ham', a: 1.5, u: 'plakje', p: null }
        ] });
        APP.persist();
      }
    });
    // het IN ÉÉN TIK-blokje tekent pas als het moment-scherm opnieuw opent: sluit en open opnieuw
    await pagina.evaluate(() => { const el = document.querySelector('#sheet .xbtn[data-act="close"]'); if (el) el.click(); });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const lijst = document.querySelectorAll('#days .day.open .moment.open .toevoegknop'); const el = lijst[lijst.length - 1]; if (!el) throw new Error('knop niet gevonden: .moment.open .toevoegknop'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden !== null) throw new Error('het moment-scherm opende niet opnieuw voor de één-tik-kaartjes');
  }, '#days .day.open .moment.open .toevoegknop >> nth=0');
  await stap(pagina, 'Recept-ronde: één tik op het recept zet 3 dingen in het moment', async () => {
    const n = await pagina.locator('#pbody button[data-act="quickrec"][data-r="botrec1"]').count();
    if (n < 1) throw new Error('het nep-recept staat niet tussen de één-tik receptkaartjes (geen quickrec-knop) — het IN ÉÉN TIK-blokje staat er alleen bij een léég moment');
    await pagina.evaluate(() => { const el = document.querySelector('#pbody button[data-act="quickrec"][data-r="botrec1"]'); if (!el) throw new Error('knop niet gevonden: quickrec botrec1'); el.click(); });
    await pagina.waitForTimeout(500);
    const tekst = await pagina.textContent('#pbody');
    for (const ding of ['Test Snee brood', 'Test Smeerkaas', 'Test Ham']) {
      if (tekst.indexOf(ding) === -1) throw new Error('het ding verscheen niet bij Gekozen: ' + ding);
    }
    const aantal = await pagina.locator('#pbody .picked .chip').count();
    if (aantal < 3) throw new Error('er staan ' + aantal + ' blokjes bij Gekozen — de 3 losse dingen ontbreken');
  }, '#pbody button[data-act="quickrec"][data-r="botrec1"]');
  await schot(pagina, 'recept-een-tik');
  await stap(pagina, 'Recept-ronde: ✕ sluit moment-scherm', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#sheet .xbtn[data-act="close"]'); if (!el) throw new Error('knop niet gevonden: #sheet .xbtn[data-act="close"]'); el.click(); });
    await pagina.waitForTimeout(400);
  }, '#sheet .xbtn[data-act="close"]');
  await stap(pagina, 'Recept-ronde: tweede moment weer dicht', async () => {
    await pagina.evaluate(() => { const lijst = document.querySelectorAll('#days .day.open .moment.open .mkop'); const el = lijst[lijst.length - 1]; if (!el) throw new Error('geen open moment gevonden'); el.click(); });
    await pagina.waitForTimeout(400);
    const n = await pagina.locator('#days .day.open .moment.open').count();
    if (n !== 0) throw new Error('na het dichtklappen staan er ' + n + ' momenten open (hoort er 0 te zijn — het eerste moment klapte al dicht toen het tweede opende)');
  }, '#days .day.open .moment.open .mkop >> nth=1');

  await stap(pagina, 'Moment klapt dicht (v48: inline)', async () => {
    const openMom = await pagina.locator('#days .day.open .moment.open').count();
    if (openMom < 1) { notities.push('Moment-dicht-stap: er stond geen open moment meer (waarschijnlijk al dicht).'); return; }
    await pagina.tap('#days .day.open .moment.open .mkop >> nth=0', { timeout: 8000, force: true });
    await pagina.waitForTimeout(400);
    const exp = await pagina.getAttribute('#days .day.open .moment .mkop >> nth=0', 'aria-expanded');
    if (exp !== 'false') throw new Error('moment bleef open (aria-expanded=' + exp + ')');
    const n = await pagina.locator('#days .day.open .moment.open').count();
    if (n > 0) throw new Error('er stond nog een open moment-block na de tweede tik');
  }, '#days .day.open .moment .mkop >> nth=0');
  await stap(pagina, 'Dag klapt dicht', async () => {
    const stondOpen = await pagina.getAttribute('#days .dayhead >> nth=0', 'aria-expanded');
    if (stondOpen === 'true') await pagina.evaluate(() => { const el = document.querySelector('#days .dayhead'); if (!el) throw new Error('knop niet gevonden: #days .dayhead'); el.click(); });
    await pagina.waitForTimeout(250);
    const exp = await pagina.getAttribute('#days .dayhead >> nth=0', 'aria-expanded');
    if (exp !== 'false') throw new Error('dag bleef open');
  }, '#days .dayhead');

  // 3. Kookhulp-tab: kaart uitklappen (v47: Kookhulp staat op de oude Toevoegen-plek)
  await stap(pagina, 'Naar Kookhulp-tab', () => pagina.tap('#tabgem', { timeout: 8000 }), '#tabgem');
  await stap(pagina, 'Kookhulp-kaart klapt open', async () => {
    await openBlokGroep(pagina, '#khApparaten');
    await pagina.tap('#khApparaten summary', { timeout: 8000 });
    await pagina.waitForTimeout(200);
    const open = await pagina.getAttribute('#khApparaten', 'open');
    if (open === null) throw new Error('kookhulp-kaart bleef dicht');
  }, '#khApparaten summary');
  await schot(pagina, 'kookhulp-open');
  await stap(pagina, 'Kookhulp-kaart klapt dicht', async () => {
    await pagina.tap('#khApparaten summary', { timeout: 8000 });
    await pagina.waitForTimeout(200);
    const open = await pagina.getAttribute('#khApparaten', 'open');
    if (open !== null) throw new Error('kookhulp-kaart bleef open');
  }, '#khApparaten summary');

  // 4. v47.4: verwijder-nieuwste-sheet (knoppen staan op het Producten-tab)
  const heeftVerw = await pagina.locator('button[data-act="nieuwstopen"]').count();
  if (heeftVerw > 0) {
    await stap(pagina, 'Naar Producten-tab', () => pagina.tap('#tabprijs', { timeout: 8000 }), '#tabprijs');
    await stap(pagina, 'Verwijder-nieuwste-sheet opent', async () => {
      await pagina.tap('button[data-act="nieuwstopen"]:visible', { timeout: 8000 });
      const hidden = await pagina.getAttribute('#verwsheet', 'hidden');
      if (hidden !== null) throw new Error('verwsheet bleef dicht');
    }, 'button[data-act="nieuwstopen"]');
    await schot(pagina, 'verwijder-sheet');
    await stap(pagina, '✕ sluit verwijder-sheet', async () => {
      await pagina.tap('button[data-act="verwclose"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(200);
    }, 'button[data-act="verwclose"]');
  }

  // 4b. Kruisje-check (31 okt, v3.3): de échte v47-route — Instellingen (tandwiel) → ➕ Iets toevoegen → 📸 Kassabon → ✕.
  // De oude route (addopen-knop op Producten) bestaat niet meer; het blokje zit in Instellingen.
  const heeftToevoegen = await pagina.locator('button[data-act="addgo"][data-v="kbon"]').count();
  if (heeftToevoegen > 0) {
    await stap(pagina, 'Naar Tandwiel (Instellingen)', () => pagina.tap('#tabinst', { timeout: 8000 }), '#tabinst');
    await stap(pagina, '➕ Iets-toevoegen-blokje klapt open', async () => {
      await openBlokGroep(pagina, 'button[data-act="addgo"][data-v="kbon"]');
      await pagina.waitForSelector('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(250);
      await pagina.waitForSelector('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 }); var open = 'zichtbaar';
      
    }, 'button[data-act="addgo"][data-v="kbon"]');
    await stap(pagina, 'Iets-toevoegen-menu opent', async () => {
      await pagina.tap('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(300);
      // v50.3: geen addsheet-menu meer; de rij opent direct de scanner
      await pagina.waitForSelector('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
    }, 'button[data-act="addgo"][data-v="kbon"]');
    await schot(pagina, 'toevoegen-menu');
    await stap(pagina, 'Kassabon-scanner opent', async () => {
      // v3.21: v50.3 opent de scanner al bij de vorige tik op de rij — al open? dan niet opnieuw tikken
      if ((await pagina.getAttribute('#scsheet', 'hidden')) !== null) {
        await pagina.tap('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
        await pagina.waitForTimeout(400);
      }
      const hidden = await pagina.getAttribute('#scsheet', 'hidden');
      if (hidden !== null) throw new Error('scsheet bleef dicht');
    }, 'button[data-act="addgo"][data-v="kbon"]');
    await schot(pagina, 'scanner-open');
    await stap(pagina, 'Scanner-schermpje opent bovenin (wens van de gebruiker 12 nov)', async () => {
    await meetBovenin(pagina, 'de scanner', '#scsheet .panel');
  }, '#scsheet .panel');
  await stap(pagina, '✕ sluit scanner', async () => {
      await pagina.tap('button[data-act="scclose"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(400);
    }, 'button[data-act="scclose"]');
    await stap(pagina, 'Na ✕ nog op Instellingen', async () => {
      const pressed = await pagina.getAttribute('#tabinst', 'aria-pressed');
      const hidden = await pagina.getAttribute('#scsheet', 'hidden');
      if (pressed !== 'true') throw new Error('na ✕ staat het Instellingen-tab niet meer actief (kruisje deed een echte paginastap terug)');
      if (hidden === null) throw new Error('scanner stond nog open na ✕');
    });
    await schot(pagina, 'na-scankruisje');
    await stap(pagina, '➕ Iets-toevoegen-blokje klapt dicht', async () => {
      await openBlokGroep(pagina, 'button[data-act="addgo"][data-v="kbon"]');
      await pagina.waitForSelector('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(250);
      await pagina.evaluate(() => { const g = document.querySelector('#grpToevoegen'); if (g) g.open = false; });
      await pagina.waitForTimeout(250);
      const open = await pagina.getAttribute('#grpToevoegen', 'open');
      if (open !== null) throw new Error('het Iets-toevoegen-groepje bleef open');
    }, 'button[data-act="addgo"][data-v="kbon"]');
  } else {
    notities.push('Kruisje-check overgeslagen: geen "Iets toevoegen"-knop (addopen) gevonden in deze build.');
  }

  // 4c. Producten-tests (31 okt, deel 2). De test-app is leeg, dus eerst één testproduct zetten
  // (alléén in de localStorage van de test-browser — nooit in echte data van de gebruiker).
  await stap(pagina, 'Testproduct in de test-app zetten', async () => {
    await pagina.evaluate(() => {
      try {
        var raw = localStorage.getItem('eetweek.v1'), o = raw ? JSON.parse(raw) : {};
        o.days = o.days || {}; o.weights = o.weights || {}; o.fav = o.fav || [];
        o.recipes = o.recipes || []; o.seeded = true;
        o.prijzen = [{ id: 'kliktest1', n: 'Test Broodje', u: 'g', inh: 500, pr: 1.05, kc: 230, cat: ['brood'], alias: [], w: {}, lab: [], labx: [], foto: '' }];
        o.icat = o.icat || {}; o.lijst = o.lijst || []; o.maxes = o.maxes || {}; o.rare = o.rare || {};
        localStorage.setItem('eetweek.v1', JSON.stringify(o));
      } catch (e) {}
    });
    await pagina.reload({ waitUntil: 'load' });
    await pagina.waitForTimeout(3000); // v3.23: 3 s na herladen (sws)
    await pagina.waitForTimeout(400);
  });
  await stap(pagina, 'Naar Producten-tab (2)', () => pagina.tap('#tabprijs', { timeout: 8000 }), '#tabprijs');
  await stap(pagina, '📁 Blader per categorie aan', async () => {
    await pagina.tap('button[data-act="prblader"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const n = await pagina.locator('#prijsview details.pgrp:not(.lblblok)').count();
    if (n < 1) throw new Error('hoofdgroepen verschenen niet na de tik op Blader per categorie');
  }, 'button[data-act="prblader"]');
  await stap(pagina, 'Hoofdgroep klapt open', async () => {
    await pagina.tap('#prijsview details.pgrp:not(.lblblok) summary >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(250);
    const open = await pagina.getAttribute('#prijsview details.pgrp:not(.lblblok) >> nth=0', 'open');
    if (open === null) throw new Error('hoofdgroep bleef dicht');
  }, '#prijsview details.pgrp:not(.lblblok) >> nth=0 summary');
  await schot(pagina, 'hoofdgroep-open');
  await stap(pagina, 'Subcategorie klapt open', async () => {
    await pagina.tap('#prijsview details.pgrp[open] details.pcat summary >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(250);
    const open = await pagina.getAttribute('#prijsview details.pgrp[open] details.pcat >> nth=0', 'open');
    if (open === null) throw new Error('subcategorie bleef dicht');
  }, '#prijsview details.pgrp[open] details.pcat >> nth=0 summary');
  await stap(pagina, 'Productregel klapt open (detail)', async () => {
    await pagina.tap('#prijsview details.prod2 summary >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(250);
    const open = await pagina.getAttribute('#prijsview details.prod2 >> nth=0', 'open');
    if (open === null) throw new Error('productregel bleef dicht');
  }, '#prijsview details.prod2 >> nth=0 summary');
  await schot(pagina, 'product-detail');
  // v3.10 (1 nov): CSS-escapes-check — veralgemenaard: de bot scandt niet langer allén "u2212", maar elke
  // JavaScript-schrijfwijze u+4-hexcijfers in CSS-content-waarden (bijv. ook u2013, u2026, u2192, u2713).
  // In CSS hoort een escape \XXXX zonder u, anders rendert de app letterlijke tekst op het scherm.
  await stap(pagina, 'CSS-escapes kloppen (geen \\uXXXX i.p.v. \\XXXX)', async () => {
    const slecht = await pagina.evaluate(() => {
      const hits = [];
      const scan = (list) => {
        for (const r of list) {
          try {
            if (r.style && r.style.content) {
              const m = String(r.style.content).match(/u[0-9a-fA-F]{4}/g);
              if (m) hits.push((r.selectorText || '?') + ' → ' + r.style.content + ' (' + [...new Set(m)].join(', ') + ')');
            }
          } catch (e) {}
          if (r.cssRules) scan(r.cssRules);
        }
      };
      for (const sheet of document.styleSheets) { try { scan(sheet.cssRules); } catch (e) {} }
      return hits;
    });
    if (slecht.length) throw new Error('CSS bevat JavaScript-schrijfwijze u+4-hexcijfers (bijv. "u2212") i.p.v. een echt teken — in CSS hoort de escape \\2212 zonder u: ' + slecht.join(' | '));
  });
  await stap(pagina, 'Zoeken geeft Gevonden-blok', async () => {
    await pagina.fill('#prsearch', 'brood');
    await pagina.waitForTimeout(400);
    const n = await pagina.locator('#prijsview details.zoekgrp[data-rk="zk:gev"]').count();
    if (n < 1) throw new Error('geen 🔍 Gevonden-blok verschenen');
  }, '#prsearch');
  await schot(pagina, 'zoeken');
  await stap(pagina, 'Zoekbalk weer leeg', async () => {
    await pagina.fill('#prsearch', '');
    await pagina.waitForTimeout(400);
  }, '#prsearch');
  await stap(pagina, 'Terug naar het rustige beginscherm', async () => {
    await pagina.tap('button[data-act="prblader"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const ap = await pagina.getAttribute('button[data-act="prblader"]', 'aria-pressed');
    if (ap !== 'false') throw new Error('het bladeren stond nog aan');
  }, 'button[data-act="prblader"]');

  // 4d. Bewaren-menu, Mijn regels en Lijst plakken (31 okt, deel 2) — allemaal via Instellingen (tandwiel)
  await stap(pagina, 'Naar Tandwiel (2)', () => pagina.tap('#tabinst', { timeout: 8000 }), '#tabinst');
  await stap(pagina, '🔧 Bewaren & terugzetten klapt open', async () => {
    await openBlokGroep(pagina, 'button[data-act="addgo"][data-v="bestand"]');
    await pagina.waitForSelector('button[data-act="addgo"][data-v="bestand"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(250);
  }, 'button[data-act="addgo"][data-v="bestand"]');
  await stap(pagina, 'Bewaren-rijen direct tikbaar (alles/week/recepten/producten)', async () => {
    for (const v of ['bestand', 'week', 'recepten', 'producten']) {
      await pagina.waitForSelector('button[data-act="addgo"][data-v="' + v + '"]:visible', { timeout: 8000 });
    }
  }, 'button[data-act="addgo"][data-v="week"]');
  await stap(pagina, '➕ Iets-toevoegen-blokje open (2)', async () => {
    await openBlokGroep(pagina, 'button[data-act="addgo"][data-v="kbon"]');
    await pagina.waitForSelector('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(250);
  }, 'button[data-act="addgo"][data-v="kbon"]');
  await stap(pagina, 'Iets-toevoegen-rij direct tikbaar (2)', async () => {
    await pagina.waitForSelector('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
  }, 'button[data-act="addgo"][data-v="kbon"]');
  await stap(pagina, 'Lijst plakken opent direct', async () => {
    await openBlokGroep(pagina, 'button[data-act="addgo"][data-v="pj"]');
    // v3.25: DOM-tikje — het tik-punt lag in v55 onder een <summary>-randje
    await pagina.evaluate(() => { const el = document.querySelector('button[data-act="addgo"][data-v="pj"]'); if (!el) throw new Error('knop niet gevonden: addgo pj'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#pjsheet', 'hidden');
    if (hidden !== null) throw new Error('pjsheet bleef dicht');
  }, 'button[data-act="addgo"][data-v="pj"]');
  await schot(pagina, 'lijst-plakken');
  await stap(pagina, 'Blokjes weer netjes dicht', async () => {
    await pagina.evaluate(() => { const g = document.querySelector('#grpToevoegen'); if (g) g.open = false; });
    await pagina.evaluate(() => { const g = document.querySelector('#grpBewaren'); if (g) g.open = false; });
    // v3.21: óók open schermpjes dicht — Lijst plakken liet het pjsheet-gordijntje open staan
    await pagina.evaluate(() => {
      var o = document.getElementById('outsheet'); if (o && !o.hidden) { var b = o.querySelector('button[data-act="outclose"]'); if (b) b.click(); }
      document.querySelectorAll('.sheet:not([hidden])').forEach(function (sh) { var c = sh.querySelector('[data-act$="close"]'); if (c) c.click(); });
    });
    await pagina.waitForTimeout(300);
    const o1 = await pagina.getAttribute('#grpToevoegen', 'open');
    const o2 = await pagina.getAttribute('#grpBewaren', 'open');
    if (o1 !== null) throw new Error('Iets-toevoegen-groepje bleef open');
    if (o2 !== null) throw new Error('Bewaren & terugzetten bleef open');
  }, '#instview details.per summary');

  // 4e. Recepten (31 okt, deel 3): Nieuw recept + Recept plakken — openen en ✕
  await stap(pagina, 'Naar Recepten-tab', () => pagina.tap('#tabrec', { timeout: 8000 }), '#tabrec');
  await stap(pagina, 'Nieuw recept opent', async () => {
    // v3.25: de ×1/×2/×3-chips (recmult) liggen in v55 boven de knop — DOM-tikje, de sheet-zelf is de bewijslast
    await pagina.evaluate(() => { const el = document.querySelector('button[data-act="recnew"]'); if (!el) throw new Error('knop niet gevonden: button[data-act="recnew"]'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#recsheet', 'hidden');
    if (hidden !== null) throw new Error('recsheet bleef dicht');
  }, 'button[data-act="recnew"]');
  await schot(pagina, 'nieuw-recept');
  await stap(pagina, '✕ sluit Nieuw recept', async () => {
    await pagina.tap('#recsheet button[data-act="recclose"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const hidden = await pagina.getAttribute('#recsheet', 'hidden');
    if (hidden === null) throw new Error('recsheet stond nog open na ✕');
  }, '#recsheet button[data-act="recclose"]');
  // v51: recept-kopjes — bot zet een recept met 2 kopjes klaar en test de weergave/bediening
  await stap(pagina, 'Kopjes: testrecept met 2 kopjes klaarzetten (via APP)', async () => {
    await pagina.evaluate(() => {
      if (!window.APP) throw new Error('window.APP bestaat niet in deze build');
      var S = APP.S;
      if (!S.recipes.some(function (r) { return r.id === 'botkop1'; })) {
        S.recipes.push({ id: 'botkop1', name: 'Bot Kopjes Test', emoji: '🧪', unit: null, fixed: null, where: ['ochtend'], steps: '1. Meng alles.\n2. Bak het beslag.', kopjes: ['Beslag', 'Topping'], ing: [
          { n: 'Test Bloem', a: 100, u: 'g', p: 3.5, g: 'Beslag' },
          { n: 'Test Boter', a: 50, u: 'g', p: 8, g: 'Beslag' },
          { n: 'Test Suiker', a: 30, u: 'g', p: 4, g: 'Topping' }
        ] });
      }
      if (!S.recipes.some(function (r) { return r.id === 'botkop2'; })) {
        S.recipes.push({ id: 'botkop2', name: 'Bot Tweede Recept', emoji: '🧪', unit: null, fixed: null, where: ['ochtend'], ing: [ { n: 'Test Melk', a: 200, u: 'ml', p: 0.5 } ] });
      }
      APP.persist();
    });
  });
  await stap(pagina, 'v57.10: kaartje dicht = alleen naam; na tik open: kernregel + 3 knoppen + ⋮', async () => {
    await pagina.evaluate(() => { location.hash = ''; });
    await pagina.tap('#tabrec', { timeout: 8000 });
    await pagina.waitForTimeout(600);
    const dicht = await pagina.evaluate(() => {
      const card = document.querySelector('#recview details.rcard[data-rk$="botkop1"]');
      if (!card) throw new Error('kaart botkop1 niet gevonden (details.rcard)');
      const sum = card.querySelector('summary.rname');
      return { tag: card.tagName, sumTekst: sum ? sum.textContent.trim() : '' };
    });
    if (dicht.tag !== 'DETAILS') throw new Error('kaartje is geen inklapbaar details meer: ' + dicht.tag);
    if (/kcal/.test(dicht.sumTekst) || /⋮/.test(dicht.sumTekst)) throw new Error('dicht kaartje toont méér dan de naam: ' + dicht.sumTekst);
    await pagina.evaluate(() => { const c = document.querySelector('#recview details.rcard[data-rk$="botkop1"]'); c.querySelector('summary').click(); });
    await pagina.waitForTimeout(400);
    const open = await pagina.evaluate(() => {
      const card = document.querySelector('#recview details.rcard[data-rk$="botkop1"]');
      return { open: card.open, tekst: card.textContent, knoppen: [...card.querySelectorAll('button')].map(b => b.getAttribute('data-act')), btnMain: card.querySelectorAll('.btn.main').length };
    });
    if (!open.open) throw new Error('kaartje klapte niet open na tik op de naam');
    if (!/± \d+ kcal/.test(open.tekst)) throw new Error('geen kernregel in het open kaartje');
    for (const a of ['recmenu', 'cook', 'recprep', 'reccopy']) if (open.knoppen.indexOf(a) < 0) throw new Error('knop ontbreekt in open kaartje: ' + a);
    if (open.btnMain > 0) throw new Error('donkere hoofdknop (.btn.main) in het kaartje');
    if (open.tekst.indexOf('voor het hele recept') >= 0) throw new Error('lange Totaal-zin staat nog op het kaartje');
  }, '#recview details.rcard[data-rk$="botkop1"]');
  await stap(pagina, 'v57.10: "Per moment"-groepjes zijn terug (inklapbaar)', async () => {
    const all = await pagina.locator('#recview details.grp[data-gg="pm:all"]').count();
    const subs = await pagina.locator('#recview details.grp[data-gg^="pm:"]').count();
    const rest = await pagina.locator('#recview details.grp[data-gg="pm:rest"]').count();
    if (all !== 1) throw new Error('"Per moment" (pm:all) niet gevonden');
    if (subs < 2) throw new Error('geen per-moment subgroepjes — telde ' + subs);
    if (rest !== 1) throw new Error('"Nog in te delen" (pm:rest) niet gevonden');
  }, '#recview details.grp[data-gg="pm:all"]');
  await stap(pagina, 'v57.10: ⋮-menuutje met precies de 4 opties — en na Bewerken direct dicht', async () => {
    await pagina.evaluate(() => { const c = document.querySelector('#recview details.rcard[data-rk$="botkop1"]'); if (!c.open) c.querySelector('summary').click(); });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => { const b = document.querySelector('#recview details.rcard[data-rk$="botkop1"] button[data-act="recmenu"]'); if (!b) throw new Error('geen ⋮-knop in het open kaartje'); b.click(); });
    await pagina.waitForTimeout(400);
    const menu = await pagina.evaluate(() => {
      const m = document.querySelector('#recview details.rcard[data-rk$="botkop1"] .rcmenu');
      if (!m) throw new Error('⋮-menu opende niet');
      return [...m.querySelectorAll('button')].map(b => b.getAttribute('data-act'));
    });
    const verwacht = ['recedit', 'recgem', 'emo', 'recdel'];
    if (menu.join(',') !== verwacht.join(',')) throw new Error('⋮-menu bevat niet precies ' + verwacht.join(',') + ': ' + menu.join(','));
    await pagina.evaluate(() => { const b = document.querySelector('#recview details.rcard[data-rk$="botkop1"] .rcmenu button[data-act="recedit"]'); if (!b) throw new Error('geen Bewerken in het menu'); b.click(); });
    await pagina.waitForTimeout(600);
    const menuWeg = await pagina.evaluate(() => document.querySelectorAll('#recview .rcmenu').length);
    if (menuWeg !== 0) throw new Error('⋮-menuutje staat na Bewerken nog open (' + menuWeg + 'x) — moet direct dicht');
    const hidden = await pagina.getAttribute('#recsheet', 'hidden');
    if (hidden !== null) throw new Error('⋮ → Bewerken opende het bewerk-scherm niet');
    const tot = await pagina.textContent('#rectotalline');
    if (!/Totaal:/.test(tot)) throw new Error('geen lange Totaal-zin in het bewerk-scherm: ' + tot);
    const irk = await pagina.locator('#recsheet .irk').allTextContents();
    if (!irk.some(t => /kcal/.test(t))) throw new Error('geen per-ingrediënt kcal in het bewerk-scherm: ' + irk.join('|'));
    const pb = await pagina.locator('#recsheet .pricebox').count();
    if (pb < 1) throw new Error('geen prijsbox in het bewerk-scherm');
    await pagina.tap('#recsheet button[data-act="recclose"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(300);
  }, '#recview details.rcard[data-rk$="botkop1"] button[data-act="recmenu"]');
  // v50.4: die knop is van het Recepten-tab af (dubbelop met Instellingen)
  if (await pagina.locator('button[data-act="pasteopen"]').count() > 0) {
  await stap(pagina, 'Recept plakken opent', async () => {
    // v3.25: DOM-tikje — het tik-punt lag in v55 onder een <summary>-randje
    await pagina.evaluate(() => { const el = document.querySelector('button[data-act="pasteopen"]'); if (!el) throw new Error('knop niet gevonden: pasteopen'); el.click(); });
    await pagina.waitForTimeout(300);
    const hidden = await pagina.getAttribute('#pastesheet', 'hidden');
    if (hidden !== null) throw new Error('pastesheet bleef dicht');
  }, 'button[data-act="pasteopen"]');
  await schot(pagina, 'recept-plakken');
  await stap(pagina, '✕ sluit Recept plakken', async () => {
    await pagina.tap('#pastesheet button[data-act="pasteclose"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const hidden = await pagina.getAttribute('#pastesheet', 'hidden');
    if (hidden === null) throw new Error('pastesheet stond nog open na ✕');
  }, '#pastesheet button[data-act="pasteclose"]');
  } else { notities.push('Recept plakken-knop niet meer op het Recepten-tab (v50.4) - overgeslagen.'); }

  // 4f. Thema-wissel (31 okt, deel 3): donker → extreem contrast → weer automatisch; kleur checkt echt mee
  await stap(pagina, 'Naar Tandwiel (3)', () => pagina.tap('#tabinst', { timeout: 8000 }), '#tabinst');
  const themaBg = () => pagina.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  // v50.1: thema via #themapicker in Instellingen; v50.2: via #themabar in de titelbalk (auto: Uiterlijk-groepje)
  const themaSel = async (t) => (await pagina.locator('#themabar button[data-theme-set="' + t + '"]').count()) > 0
    ? '#themabar button[data-theme-set="' + t + '"]'
    : (t === 'auto' && (await pagina.locator('#instview button[data-theme-set="auto"]').count()) > 0)
      ? '#instview button[data-theme-set="auto"]'
      : '#themapicker button[data-theme-set="' + t + '"]';
  await stap(pagina, 'Thema: donker aan', async () => {
    const voor = await themaBg();
    const sel = await themaSel('dark');
    await pagina.tap(sel, { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const ap = await pagina.getAttribute(sel, 'aria-pressed');
    const na = await themaBg();
    if (ap !== 'true') throw new Error('de donker-knop stond niet aan');
    if (!na || na === voor) throw new Error('de achtergrondkleur veranderde niet');
  }, 'thema donker');
  await schot(pagina, 'thema-donker');
  await stap(pagina, 'Thema: extreem contrast aan', async () => {
    const voor = await themaBg();
    const sel = await themaSel('contrast');
    await pagina.tap(sel, { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const ap = await pagina.getAttribute(sel, 'aria-pressed');
    const na = await themaBg();
    if (ap !== 'true') throw new Error('de contrast-knop stond niet aan');
    if (!na || na === voor) throw new Error('de achtergrondkleur veranderde niet');
  }, 'thema contrast');
  await schot(pagina, 'thema-contrast');
  await stap(pagina, 'Thema: weer automatisch (alleen als die knop bestaat)', async () => {
    // v51: 'automatisch' bestaat niet meer als aparte knop — dan slaan we deze stap over
    const nAuto = await pagina.locator('#themabar button[data-theme-set="auto"], #instview button[data-theme-set="auto"], #themapicker button[data-theme-set="auto"]').count();
    if (nAuto === 0) { stappen.push({ omschrijving: 'Thema: weer automatisch (geskipt — knop bestaat niet meer)', ok: true }); return; }
    const sel = await themaSel('auto');
    if (sel.indexOf('#instview') === 0) await openBlokGroep(pagina, '#instview button[data-theme-set="auto"]');
    await pagina.tap(sel, { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const ap = await pagina.getAttribute(sel, 'aria-pressed');
    if (ap !== 'true') throw new Error('de automatisch-knop stond niet aan');
  }, 'thema automatisch');

  // 4g. Plakken (31 okt, deel 3): Producten plakken via Lijst plakken; Prijzen plakken alleen als de knop zichtbaar is
  const heeftPP = await pagina.locator('button[data-act="ppopen"]').count();
  if (heeftPP > 0) {
    await stap(pagina, 'Prijzen plakken opent', async () => {
      await pagina.tap('button[data-act="ppopen"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(300);
      const hidden = await pagina.getAttribute('#ppsheet', 'hidden');
      if (hidden !== null) throw new Error('ppsheet bleef dicht');
    }, 'button[data-act="ppopen"]');
    await schot(pagina, 'prijzen-plakken');
    await stap(pagina, '✕ sluit Prijzen plakken', async () => {
      await pagina.tap('#ppsheet button[data-act="ppclose"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(300);
      const hidden = await pagina.getAttribute('#ppsheet', 'hidden');
      if (hidden === null) throw new Error('ppsheet stond nog open na ✕');
    }, '#ppsheet button[data-act="ppclose"]');
  } else {
    notities.push('Prijzen plakken (ppopen) niet getest: geen knop gevonden in deze build — de knop zit mogelijk alleen in de scanner-flow.');
  }
  await stap(pagina, '➕ Iets-toevoegen-blokje open (3)', async () => {
    await openBlokGroep(pagina, 'button[data-act="addgo"][data-v="kbon"]');
    await pagina.waitForSelector('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(250);
  }, 'button[data-act="addgo"][data-v="kbon"]');
  await stap(pagina, 'Iets-toevoegen-menu opent (3)', async () => {
    await pagina.tap('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(300);
  }, 'button[data-act="addgo"][data-v="kbon"]');
  await stap(pagina, 'Lijst plakken opent direct (2)', async () => {
    // v3.21: staat het plak-schermpje al open, dan niet opnieuw tikken
    if ((await pagina.getAttribute('#pjsheet', 'hidden')) !== null) {
      await pagina.tap('button[data-act="addgo"][data-v="pj"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(300);
    }
  }, 'button[data-act="addgo"][data-v="pj"]');
  await stap(pagina, 'Plakken of bestand kiezen opent (Producten plakken)', async () => {
    if ((await pagina.getAttribute('#pjsheet', 'hidden')) !== null) { // v3.21: al open = niet opnieuw tikken
      await pagina.tap('button[data-act="addgo"][data-v="pj"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(400);
    }
    const hidden = await pagina.getAttribute('#pjsheet', 'hidden');
    if (hidden !== null) throw new Error('pjsheet bleef dicht');
  }, 'button[data-act="addgo"][data-v="pj"]');
  await schot(pagina, 'producten-plakken');
  await stap(pagina, 'Controlelijst: live opzoeken reset scroll/focus niet (v51)', async () => {
    await pagina.fill('#pjtxt', 'Test Bot Product A\nTest Bot Product B\nTest Bot Product C');
    await pagina.tap('button[data-act="pjcheck"]:visible', { timeout: 8000 });
    await pagina.waitForSelector('#pjbody [data-pjn]', { timeout: 8000 });
    await pagina.evaluate(() => { var b = document.getElementById('pjbody'); b.scrollTop = 250; });
    await pagina.tap('button[data-act="pjschat"]:visible', { timeout: 8000 }); // start live lookup-lus (renderPJ per item)
    await pagina.waitForTimeout(4000);
    const scroll = await pagina.evaluate(() => document.getElementById('pjbody').scrollTop);
    if (Math.abs(scroll - 250) > 20) throw new Error('scroll-positie sprong van 250 naar ' + scroll + ' tijdens live opzoeken (render reset)');
    const busy = await pagina.evaluate(() => { var P = window.APP && APP.S.pj; return P ? !!P.zoekBusy || (P.zoekTeller || 0) > 0 : false; });
    if (!busy) throw new Error('live opzoeken liep niet (zoekBusy/zoekTeller leeg) — check of de lus renderPJ aanroept zonder scroll-behoud');
  }, '#pjbody');
  await stap(pagina, '✕ sluit Producten plakken', async () => {
    await pagina.tap('#pjsheet button[data-act="pjclose"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const hidden = await pagina.getAttribute('#pjsheet', 'hidden');
    if (hidden === null) throw new Error('pjsheet stond nog open na ✕');
  }, '#pjsheet button[data-act="pjclose"]');

  // 4h. Terugzetten-menu (31 okt, deel 3): alleen openen en ✕ — niets terugzetten
  await stap(pagina, '🔧 Bewaren & terugzetten open (2)', async () => {
    await openBlokGroep(pagina, 'button[data-act="addgo"][data-v="bestand"]');
    await pagina.waitForSelector('button[data-act="addgo"][data-v="bestand"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(250);
  }, 'button[data-act="addgo"][data-v="bestand"]');
  await stap(pagina, 'Terugzetten-rij opent direct de bestandkiezer', async () => {
    await pagina.waitForTimeout(300);
    const fc = await openTerugzetten(pagina);
    if (!fc) throw new Error('Terugzetten-rij gaf geen bestandkiezer');
  }, 'button[data-act="addgo"][data-v="uitbestand"]');
  await schot(pagina, 'terugzetten');
  await stap(pagina, '✕ resten van menu’s dicht', async () => {
    await pagina.evaluate(() => { document.querySelectorAll('.sheet').forEach(s => { if (!s.hidden) { const c = s.querySelector('[data-act="addclose"]'); if (c) c.click(); } }); });
    await pagina.waitForTimeout(300);
    const open = await pagina.evaluate(() => [...document.querySelectorAll('.sheet')].filter(s => !s.hidden).map(s => s.id).join(','));
    if (open) throw new Error('deze schermen stonden nog open: ' + open);
  }, '.sheet');
  await stap(pagina, 'Blokjes weer dicht (2)', async () => {
    await pagina.evaluate(() => { const g = document.querySelector('#grpToevoegen'); if (g) g.open = false; });
    await pagina.evaluate(() => { const g = document.querySelector('#grpBewaren'); if (g) g.open = false; });
    await pagina.waitForTimeout(250);
  }, '#instview details.per summary');

  // 5. Herladen
  await pagina.reload({ waitUntil: 'load' });
    await pagina.waitForTimeout(3000); // v3.23: 3 s na herladen (sws)
  await schot(pagina, 'na-herladen');

  // 6. Bekend punt: bon-kortingsregel (v47.5-fix, Vibe Code) — controle, geen falende stap
  let bonRegel = null;
  try {
    const bron = await pagina.content();
    bonRegel = /korting is geen product/i.test(bron);
  } catch (e) { bonRegel = null; }

  // 6b. Consistentie-checks (1 nov, v3.9) — README-versie vs code-versie, dubbele bestandskiezers
  try {
    const readmePad = path.join(__dirname, '..', 'actueel', 'app', 'README.md');
    const catPad = path.join(__dirname, '..', 'actueel', 'app', 'js', '01-catalogus.js');
    if (fs.existsSync(readmePad) && fs.existsSync(catPad)) {
      const readme = fs.readFileSync(readmePad, 'utf8');
      const cat = fs.readFileSync(catPad, 'utf8');
      const catV = (cat.match(/VERSION\s*=\s*['"](v[0-9.]*)['"]/) || [])[1];
      if (catV) {
        const noemt = readme.indexOf(catV) !== -1 || readme.indexOf(catV.replace(/^v/, '')) !== -1;
        await stap(pagina, 'README noemt de code-versie (' + catV + ')', async () => {
          if (!noemt) throw new Error('app/README.md noemt de actuele code-versie ' + catV + ' niet — README is vergeten mee bij te werken');
        });
      } else { notities.push('Versie-check (README vs VERSION) overgeslagen: VERSION niet gevonden in 01-catalogus.js.'); }
    } else { notities.push('Versie-check (README vs VERSION) overgeslagen: actueel/app-bestanden niet gevonden.'); }
  } catch (e) { notities.push('Versie-check (README vs VERSION) mislukt: ' + String(e).slice(0, 140)); }
  try {
    const singlePad = path.join(__dirname, 'test-build.html');
    if (fs.existsSync(singlePad)) {
      const single = fs.readFileSync(singlePad, 'utf8');
      const telling = {};
      for (const m of single.matchAll(/<input\b[^>]*\btype="file"[^>]*>/g)) {
        const id = (m[0].match(/\bid="([^"]+)"/) || [])[1];
        if (id) telling[id] = (telling[id] || 0) + 1;
      }
      const dubbel = Object.keys(telling).filter(k => telling[k] > 1);
      if (dubbel.length) notities.push('Dubbele bestandskiezers in de single-file (bekend build-single-restje, nog zonder bewezen schade): ' + dubbel.map(k => k + ' ×' + telling[k]).join(', ') + '.');
    }
  } catch (e) {}

    // 6c. Dode-knoppen-check (v3.13, 1 nov): acties met afhandelaar maar zonder knop - de bot zoekt
  // nu ook in de broncode (actueel/app, .js en .html) naar data-act="..." in teksten die knoppen tekenen
  // (bijv. het productscherm tekent zijn knoppen pas bij openen). Alleen acties die nergens een knop
  // hebben - niet op de pagina en niet in de code - zijn echt dood.
  try {
    const singlePad = path.join(__dirname, 'test-build.html');
    if (fs.existsSync(singlePad)) {
      const single = fs.readFileSync(singlePad, 'utf8');
      const B = String.fromCharCode(92);
      const dq = String.fromCharCode(34), sq = String.fromCharCode(39);
      const handled = new Set();
      let pos = 0;
      while ((pos = single.indexOf("closest('[data-act]')", pos)) !== -1) {
        const stuk = single.slice(pos, pos + 15000);
        let m; const re = new RegExp("act === '([a-z0-9_-]+)'", 'g');
        while ((m = re.exec(stuk))) handled.add(m[1]);
        pos += 20;
      }
      const bronnen = [single];
      const verzamel = (dir) => {
        try {
          for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
            const p2 = path.join(dir, f.name);
            if (f.isDirectory()) verzamel(p2);
            else if (f.name.slice(-3) === '.js' || f.name.slice(-5) === '.html') {
              try { bronnen.push(fs.readFileSync(p2, 'utf8')); } catch (e) {}
            }
          }
        } catch (e) {}
      };
      verzamel(path.join(__dirname, '..', 'actueel', 'app'));
      const buttons = new Set();
      const re2 = new RegExp('data-act=' + B + B + '?[' + dq + sq + ']([a-z0-9_-]+)', 'g');
      for (const bron of bronnen) { let m2; while ((m2 = re2.exec(bron))) buttons.add(m2[1]); }
      const dode = [...handled].filter(a2 => !buttons.has(a2));
      const zwevend = [...buttons].filter(a2 => !handled.has(a2));
      if (dode.length) notities.push('Acties met afhandelaar maar zonder knop, nergens gevonden op de pagina of in de code - alleen deze zijn echt dood (sommige bewust code-only - zelf door te kijken): ' + dode.slice(0, 15).join(', ') + (dode.length > 15 ? ' ...' : '') + '.');
      if (zwevend.length) notities.push('Knoppen zonder bekende afhandelaar (kan bewust via een andere route - zelf door te kijken): ' + zwevend.slice(0, 15).join(', ') + (zwevend.length > 15 ? ' ...' : '') + '.');
    }
  } catch (e) {}
// 6d. Versie-gelijkheid (Ronde 1, 1 nov): download.html en de ZIP's noemen de actuele code-versie
  try {
    const catPad2 = path.join(__dirname, '..', 'actueel', 'app', 'js', '01-catalogus.js');
    const catV2 = fs.existsSync(catPad2) ? ((fs.readFileSync(catPad2, 'utf8').match(/VERSION[ ]*=[ ]*['"](v[0-9.]*)['"]/) || [])[1] || null) : null;
    if (catV2) {
      const dlPad = path.join(__dirname, '..', 'download.html');
      if (fs.existsSync(dlPad)) {
        const dl = fs.readFileSync(dlPad, 'utf8');
        const dlOk = dl.indexOf(catV2) !== -1 || dl.indexOf(catV2.replace(/^v/, '')) !== -1;
        await stap(pagina, 'download.html noemt de actuele versie (' + catV2 + ')', async () => {
          if (!dlOk) throw new Error('download.html noemt de actuele code-versie ' + catV2 + ' niet');
        });
      }
      try {
        const { execSync } = require('child_process');
        const rootPad = path.join(__dirname, '..');
        for (const zip of ['index.zip', 'Opdeling-1.zip']) {
          if (!fs.existsSync(path.join(rootPad, zip))) continue;
          let uit = '';
          try {
            uit = execSync('unzip -p "' + zip + '" | grep -ac "' + catV2 + '"', { cwd: rootPad, encoding: 'utf8' }).trim();
          } catch (e) { uit = ''; }
          await stap(pagina, 'ZIP ' + zip + ' noemt de actuele versie (' + catV2 + ')', async () => {
            if (!uit) throw new Error('de zip noemt de actuele versie ' + catV2 + ' nergens');
            
          });
        }
      } catch (e) { notities.push('ZIP-versiecheck overgeslagen (unzip niet beschikbaar?): ' + String(e).slice(0, 100)); }
    }
  } catch (e) { notities.push('Versie-gelijkheid-check mislukt: ' + String(e).slice(0, 120)); }

  // 7. Losse pagina's (1 nov, v3.9): alle vijf uit de opdeling laden zonder JS-fouten.
  // Claude vond op index.html "S is not defined" — de vier andere pagina's zijn in v47.4.6
  // gerepareerd naar APP.S.tab/APP.render(), index.html nog niet. De bot testte voorheen
  // alléén de single-file, dus deze fout kon hij nooit zien.
  const basis = url.replace(/\/(tests|backup|app-test|opdeling-test)\/.*$/, ''); // v50: app-test ook afrekenen, anders 404t de losse-pagina-check
  const appPad = path.join(__dirname, '..', 'actueel', 'app', 'app.js');
  if (fs.existsSync(appPad)) {
    for (const pg of ['index.html', 'recepten.html', 'producten.html', 'instellingen.html', 'kookhulp.html']) {
      await stap(pagina, 'Losse pagina ' + pg + ' start zonder fouten', async () => {
        const pgFouten = [];
        const peh = e => pgFouten.push('PAGEERROR: ' + String(e).slice(0, 200));
        const ceh = m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) pgFouten.push('CONSOLE: ' + m.text().slice(0, 200)); };
        pagina.on('pageerror', peh); pagina.on('console', ceh);
        try {
          await pagina.goto(basis + '/actueel/app/' + pg, { waitUntil: 'load' });
          await pagina.waitForTimeout(700);
        } finally {
          pagina.off('pageerror', peh); pagina.off('console', ceh);
        }
        if (pgFouten.length) throw new Error(pgFouten.join(' | '));
      });
    }
  } else {
    notities.push('Losse pagina\'s niet getest: actueel/app/app.js niet gevonden — eerst bouwen (bouw-app.py).');
  }

  // 8. Smal scherm (360 px, Ronde 1, 1 nov): geen zijwaarts scrollen, ook niet met de week open
  const smalCtx = await browser.newContext({ viewport: { width: 400, height: 850 }, hasTouch: true });
  const smal = await smalCtx.newPage();
  smal.setDefaultTimeout(15000);
  await stap(pagina, 'Smal scherm (360px): app laadt', async () => {
    await smal.goto(url, { waitUntil: 'load' });
    await smal.waitForTimeout(500);
  });
  await stap(pagina, 'Smal scherm: geen zijwaarts scrollen (start)', async () => {
    const w = await smal.evaluate(() => document.documentElement.scrollWidth);
    if (w > 361) throw new Error('de app is ' + w + 'px breed op een 360px-scherm — er kan zijwaarts gescrold worden');
  });
  await stap(pagina, 'Smal scherm: week open zonder zijwaarts scrollen', async () => {
    await smal.tap('#days .dayhead >> nth=0', { timeout: 8000 });
    await smal.waitForTimeout(300);
    await zorgDagdeelOpen(smal);
    await smal.tap('#days .day.open .moment .mkop >> nth=0', { timeout: 8000 });
    await smal.waitForTimeout(400);
    const w = await smal.evaluate(() => document.documentElement.scrollWidth);
    if (w > 361) throw new Error('met de week open is de app ' + w + 'px breed — er kan zijwaarts gescrold worden');
  });
  await schot(smal, 'smal-360-week-open');
  await smalCtx.close();

  // ===== Ronde 3 (v3.15, 1 nov): Mistral nagebootst — eigen invoer leidend, falende Mistral, crop-slepen =====
  // Alle aanroepen aan api.mistral.ai worden onderschept: er gaat GEEN echte vraag uit, dus dit kost geen tokens.
  function maakPng(w, h) {
    const zlib = require('zlib');
    const ruw = Buffer.alloc((w * 3 + 1) * h);
    let p = 0;
    for (let y = 0; y < h; y++) { ruw[p++] = 0; for (let x = 0; x < w; x++) { ruw[p++] = 200; ruw[p++] = 180; ruw[p++] = 160; } }
    const idat = zlib.deflateSync(ruw);
    const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); crcT[n] = c >>> 0; }
    const crc = (buf) => { let c = 0xFFFFFFFF; for (const b of buf) c = crcT[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
    const stuk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), stuk('IHDR', ihdr), stuk('IDAT', idat), stuk('IEND', Buffer.alloc(0))]);
  }
  const nepFoto = maakPng(240, 320);
  let r3Modus = 'uit';
  let r8Ant = null; // v3.27 (PUNT 8): eigen bon-antwoord per supermarkt-scenario (null = gewone R3-flow)
  const r8Status = []; // v3.27: R8-bevindingen (PUNT 8, gekalibreerd op de echte bonnen 28700-28707) voor het rapport
  let r3Verzoeken = 0;
  const ETIK_ANT = { gelukt: true, reden: '', producten: [{ naam: 'Test Broodje', prijs: 9.99, inhoud: 999, eenheid: 'g', bonus_prijs: 1.11, bonus_tekst: 'BOT-ACTIE', eiwit: 44.4, suikers: 5.5, verzadigd: 7.7, zout: 2.2, vezels: 1.1, kcal: 555, onzeker: ['bot twijfelt expres'] }] };
  const BON_ANT = { gelukt: true, reden: '', bon: [{ naam: 'BOT BONPRODUCT 500ML', aantal: 1, prijs: 1.23, bonus: null, korting_tekst: '', statiegeld: false, geen_eten: false, artikel: 'Bot Bonproduct 500 ml', artikel_inhoud: 500, artikel_eenheid: 'ml', kcal: 100, eiwit: 5, suikers: 1, verzadigd: 2, zout: 0.5, vezels: 0, match: null, match_id: null, zeker: false, onzeker: [] }] };
  const mistralRoute = (route) => {
    r3Verzoeken++;
    if (r3Modus === 'weg') return route.abort();
    if (r3Modus === 'fout401') return route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Unauthorized"}' });
    if (r3Modus === 'kapot') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: 'dit is geen json {[' } }] }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(r8Ant || (r3Modus === 'bon' ? BON_ANT : ETIK_ANT)) } }] }) });
  };
  await stap(pagina, 'R3: terug naar de single-file', async () => {
    await pagina.goto(url, { waitUntil: 'load' });
    await pagina.waitForTimeout(500);
  });
  await stap(pagina, 'R3: nep-Mistral aanzetten (0 echte aanroepen)', async () => {
    await pagina.route('**/api.mistral.ai/**', mistralRoute);
    const n = await pagina.evaluate(() => { const k = document.getElementById('key'); if (!k) return 0; k.value = 'BOT-NEP-SLEUTEL'; return 1; });
    if (!n) throw new Error('het sleutelvak (#key) bestaat niet in deze build');
  }, '#key');
  await stap(pagina, 'R3: week open, blokje naar productregel', async () => {
    await pagina.tap('#tabweek', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const dagOpenR3 = await pagina.getAttribute('#days .dayhead >> nth=0', 'aria-expanded');
    if (dagOpenR3 !== 'true') await pagina.evaluate(() => { const el = document.querySelector('#days .dayhead'); if (!el) throw new Error('knop niet gevonden: #days .dayhead'); el.click(); });
    await pagina.waitForTimeout(300);
    await zorgDagdeelOpen(pagina);
    // v48: de blokjes zitten bínnen de open momenten — na de herstart kan het moment dicht zijn
    let chipR3 = await pagina.locator('#days .day.open button.chip[data-act="gotoprod"]').count();
    if (chipR3 < 1) {
      await pagina.evaluate(() => { const el = document.querySelector('#days .day.open .moment:not(.open) .mkop'); if (el) el.click(); });
      await pagina.waitForTimeout(400);
      chipR3 = await pagina.locator('#days .day.open button.chip[data-act="gotoprod"]').count();
    }
    if (chipR3 < 1) {
      const diag = await pagina.evaluate(() => {
        var eS = ''; try { Object.keys(S.days || {}).forEach(function (k) { eS += k + ':' + (((S.days[k] || {}).entries || []).length) + ' '; }); } catch (e2) { eS = 'geen toegang tot S.days'; }
        return 'openDagen=' + document.querySelectorAll('#days .day.open').length + ' openMomenten=' + document.querySelectorAll('#days .day.open .moment.open').length + ' chips=' + document.querySelectorAll('#days button.chip').length + ' dagen=[' + eS.trim() + ']';
      });
      throw new Error('geen tikbaar product-blokje na het openen van dag en moment (' + diag + ')');
    }
    await pagina.evaluate(() => { const el = document.querySelector('#days .day.open button.chip[data-act="gotoprod"]'); if (!el) throw new Error('knop niet gevonden: #days .day.open button.chip[data-act="gotoprod"]'); el.click(); });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const el = document.querySelector('#choiceov .choice-list button'); if (!el) throw new Error('knop niet gevonden: #choiceov .choice-list button'); el.click(); });
    await pagina.waitForTimeout(900);
    const n = await pagina.locator('#prijsview details.prod2[data-rk^="pr:kliktest1"]').count();
    if (n < 1) throw new Error('de productregel van Test Broodje stond niet op het Producten-tab');
  }, '#choiceov .choice-list button');
  await stap(pagina, 'R3: productformulier open (Bewerken)', async () => {
    const regel = '#prijsview details.prod2[data-rk^="pr:kliktest1"]';
    const open = await pagina.getAttribute(regel, 'open'); // v3.15.1: openen hieronder via JS-klik
    if (open === null) await pagina.evaluate((r2) => { const d = document.querySelector(r2); if (d) { const s = d.querySelector('summary'); if (s) s.click(); } }, regel);
    await pagina.evaluate((r2) => { const b = document.querySelector(r2 + ' button[data-act="prodedit"]'); if (!b) throw new Error('Bewerken-knop niet gevonden'); b.click(); }, regel);
    await pagina.waitForTimeout(500);
    const hidden = await pagina.getAttribute('#prodsheet', 'hidden');
    if (hidden !== null) throw new Error('het productformulier opende niet');
  }, '#prijsview details.prod2[data-rk^="pr:kliktest1"] button[data-act="prodedit"]');
  await stap(pagina, 'R3: productformulier in secties (v51: naam los, rest in prodsec-blokjes)', async () => {
    const secs = await pagina.locator('#prodbody details.prodsec').evaluateAll(function (els) { return els.map(function (e) { return e.getAttribute('data-sec'); }); });
    for (const k of ['verpakking', 'prijs', 'meer', 'voeding']) {
      if (secs.indexOf(k) === -1) throw new Error('sectie "' + k + '" ontbreekt in het productformulier (wel: ' + secs.join(',') + ')');
    }
    const openN = await pagina.locator('#prodbody details.prodsec[open]').count();
    if (openN > 1) throw new Error('er staan ' + openN + ' secties tegelijk open (hoort max 1 te zijn)');
    const naamVeld = await pagina.locator('#prodbody input[data-pf="n"]').count();
    if (naamVeld < 1) throw new Error('het Naam-veld staat niet los bovenaan het productformulier');
    const hintsZichtbaar = await pagina.locator('#prodsheet p.hint').evaluateAll(function (els) { return els.filter(function (e) { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length; });
    if (hintsZichtbaar < 1) throw new Error('in het productformulier zijn de p.hint-uitleg-regels niet zichtbaar (moeten wel)');
  }, '#prodbody details.prodsec');
  await stap(pagina, 'R3: sectie open/dicht wisselt (accordion)', async () => {
    await pagina.evaluate(() => { const d = document.querySelector('#prodbody details.prodsec[data-sec="prijs"]'); if (!d) throw new Error('sectie prijs niet gevonden'); d.querySelector('summary').click(); });
    await pagina.waitForTimeout(400);
    const openN = await pagina.locator('#prodbody details.prodsec[open]').count();
    if (openN !== 1) throw new Error('na openen van Prijs staan er ' + openN + ' secties open (accordion werkt niet)');
  }, '#prodbody details.prodsec[data-sec="prijs"] summary');
  await stap(pagina, 'R3: eigen waarden invullen (prijs 2,50 / inhoud 400)', async () => {
    await pagina.fill('#prodsheet input[data-pf="pr"]', '2,50');
    await pagina.fill('#prodsheet input[data-pf="inh"]', '400');
  }, '#prodsheet input[data-pf="pr"]');
  await stap(pagina, 'R3: nep-etiket: eigen invoer blijft staan', async () => {
    r3Modus = 'goed';
    await pagina.setInputFiles('#etikfiles', { name: 'bot-etiket.png', mimeType: 'image/png', buffer: nepFoto });
    await pagina.waitForTimeout(1500);
    const pr = await pagina.inputValue('#prodsheet input[data-pf="pr"]');
    if (pr !== '2,50') throw new Error('de prijs is overschreven naar ' + pr + ' — eigen invoer hoort te winnen');
    const inh = await pagina.inputValue('#prodsheet input[data-pf="inh"]');
    if (inh !== '400') throw new Error('de inhoud is overschreven naar ' + inh);
    const tekst = await pagina.textContent('#prodbody');
    if (tekst.indexOf('niet overschreven') === -1) throw new Error('de melding "Al door jou ingevuld — niet overschreven" verscheen niet');
    if (tekst.indexOf('Ingevuld') === -1) throw new Error('lege velden (bonusprijs, eiwit) zijn niet aangevuld');
    const vinkjes = await pagina.locator('#prodsheet input[data-pov]').count();
    if (vinkjes < 2) throw new Error('er waren maar ' + vinkjes + ' "Neem deze over"-vinkjes');
    const bon = await pagina.inputValue('#prodsheet input[data-pf="bon"]');
    if (bon !== '1,11') throw new Error('de lege bonusprijs is niet aangevuld met de gelezen 1,11 (nu: ' + bon + ')');
  }, '#prodsheet input[data-pov]');
  await schot(pagina, 'r3-eigen-invoer');
  await stap(pagina, 'R3: Mistral-fout (sleutel 401) → nette melding', async () => {
    r3Modus = 'fout401'; r3Verwacht = true;
    await pagina.setInputFiles('#etikfiles', { name: 'bot-etiket.png', mimeType: 'image/png', buffer: nepFoto });
    await pagina.waitForTimeout(1200);
    const tekst = await pagina.textContent('#prodbody');
    if (tekst.indexOf('Dat lukte niet') === -1) throw new Error('geen nette foutmelding verschenen');
    if (tekst.indexOf('Controleer je sleutel') === -1) throw new Error('de melding legt niet uit dat de sleutel het probleem is');
    const pr = await pagina.inputValue('#prodsheet input[data-pf="pr"]');
    if (pr !== '2,50') throw new Error('bij de fout zijn de eigen waarden verdwenen (prijs nu ' + pr + ')');
  }, '#prodsheet input[data-pf="pr"]');
  await stap(pagina, 'R3: kapot antwoord → nette melding', async () => {
    r3Modus = 'kapot';
    await pagina.setInputFiles('#etikfiles', { name: 'bot-etiket.png', mimeType: 'image/png', buffer: nepFoto });
    await pagina.waitForTimeout(1200);
    const tekst = await pagina.textContent('#prodbody');
    if (tekst.indexOf('geen bruikbaar antwoord') === -1) throw new Error('bij kapotte JSON hoort een nette melding, geen crash');
  }, '#prodbody');
  await stap(pagina, 'R3: verbinding weg → nette melding', async () => {
    r3Modus = 'weg';
    await pagina.setInputFiles('#etikfiles', { name: 'bot-etiket.png', mimeType: 'image/png', buffer: nepFoto });
    await pagina.waitForTimeout(1200);
    const tekst = await pagina.textContent('#prodbody');
    if (tekst.indexOf('Geen verbinding met Mistral') === -1) throw new Error('bij een gestoorde verbinding hoort een nette melding');
  }, '#prodbody');
  await stap(pagina, 'R3: productformulier netjes dicht (✕)', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#prodsheet button[data-act="prodclose"]'); if (!el) throw new Error('knop niet gevonden: #prodsheet button[data-act="prodclose"]'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#prodsheet', 'hidden');
    if (hidden === null) throw new Error('het productformulier stond nog open na ✕');
  }, '#prodsheet button[data-act="prodclose"]');
  await stap(pagina, 'R3: scanner openen (Kassabon-modus)', async () => {
    await pagina.tap('#tabinst', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    await openBlokGroep(pagina, 'button[data-act="addgo"][data-v="kbon"]');
    // v3.21: na de etiket-ronde staat de scanner al open — dan de Kassabon-modus aanzetten i.p.v. op de rij tikken
    if ((await pagina.getAttribute('#scsheet', 'hidden')) !== null) {
      await pagina.waitForSelector('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(250);
      await pagina.tap('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(300);
      await pagina.tap('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(400);
    } else {
      await pagina.evaluate(() => { const m = document.querySelector('#scbody button[data-act="scmode"][data-v="bon"]'); if (m) m.click(); });
      await pagina.waitForTimeout(400);
    }
    const hidden = await pagina.getAttribute('#scsheet', 'hidden');
    if (hidden !== null) throw new Error('de scanner opende niet');
    const modus = await pagina.locator('#scbody button[data-act="scmode"][data-v="bon"]').getAttribute('aria-pressed');
    if (modus !== 'true') throw new Error('de scanner startte niet in de Kassabon-modus');
  }, 'button[data-act="addgo"][data-v="kbon"]');
  await stap(pagina, 'R3: bon-foto kiezen toont het crop-vierkant', async () => {
    r3Modus = 'bon';
    await pagina.setInputFiles('#scfile', { name: 'bot-bon.png', mimeType: 'image/png', buffer: nepFoto });
    await pagina.waitForTimeout(600);
    const n = await pagina.locator('#scropbox').count();
    if (n < 1) throw new Error('het crop-vierkant verscheen niet bij de bonfoto');
  }, '#scropbox');
  await schot(pagina, 'r3-crop');
  await stap(pagina, 'R3: crop-vierkant 3× versleept (touch)', async () => {
    const voor = await pagina.evaluate(() => { const b = document.getElementById('scropbox'); return { l: parseFloat(b.style.left), t: parseFloat(b.style.top), w: parseFloat(b.style.width), h: parseFloat(b.style.height) }; });
    await pagina.evaluate(() => {
      const box = document.getElementById('scropbox');
      const trek = (el, dx, dy) => {
        const r = el.getBoundingClientRect();
        const x0 = r.x + r.width / 2, y0 = r.y + r.height / 2;
        el.dispatchEvent(new PointerEvent('pointerdown', { clientX: x0, clientY: y0, pointerType: 'touch', bubbles: true, cancelable: true }));
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: x0 + dx, clientY: y0 + dy, pointerType: 'touch', bubbles: true }));
        window.dispatchEvent(new PointerEvent('pointerup', { clientX: x0 + dx, clientY: y0 + dy, pointerType: 'touch', bubbles: true }));
      };
      trek(box, 25, 35);
      trek(box.querySelector('.h.br'), 25, 20);
      trek(box, -18, -25);
    });
    await pagina.waitForTimeout(200);
    const na = await pagina.evaluate(() => { const b = document.getElementById('scropbox'); return { l: parseFloat(b.style.left), t: parseFloat(b.style.top), w: parseFloat(b.style.width), h: parseFloat(b.style.height) }; });
    const bewogen = Math.abs(na.l - voor.l) + Math.abs(na.t - voor.t) + Math.abs(na.w - voor.w) + Math.abs(na.h - voor.h);
    if (bewogen < 1) throw new Error('het vierkant verplaatste zich niet na 3 keer slepen');
    if (na.l < 0 || na.t < 0 || na.l + na.w > 100.01 || na.t + na.h > 100.01) throw new Error('het vierkant glipte buiten de foto (l=' + na.l + ' t=' + na.t + ' w=' + na.w + ' h=' + na.h + ')');
    if (na.w < 10 || na.h < 10) throw new Error('het vierkant is kleiner dan de toegestane 10% geworden');
  }, '#scropbox');
  await schot(pagina, 'r3-crop-gesleept');
  await stap(pagina, 'R3: bijsnijden leest alleen het vierkant (nep-bon)', async () => {
    await pagina.tap('#scbody button[data-act="scropgo"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(1500);
    const tekst = await pagina.textContent('#scbody');
    if (tekst.indexOf('Bon gelezen') === -1) throw new Error('de nep-bon werd niet gelezen na het bijsnijden');
    if (tekst.indexOf('Bot Bonproduct') === -1) throw new Error('het nep-product van de bon staat niet in de matches');
  }, '#scbody button[data-act="scropgo"]');
  await schot(pagina, 'r3-bon-matches');
  await stap(pagina, 'R3: scanner sluiten zonder bewaren', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#scbody button[data-act="scnone"]'); if (!el) throw new Error('knop niet gevonden: #scbody button[data-act="scnone"]'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#scsheet', 'hidden');
    const tekst = await pagina.textContent('#scbody');
    if (tekst.indexOf('Niets bewaard') === -1) throw new Error('de bevestiging Niets bewaard verscheen niet');
    await pagina.evaluate(() => { const el = document.querySelector('#scsheet button[data-act="scclose"]'); if (!el) throw new Error('sluitknop niet gevonden'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden2 = await pagina.getAttribute('#scsheet', 'hidden');
    if (hidden2 === null) throw new Error('de scanner stond nog open na ✕');
    void hidden;
  }, '#scbody button[data-act="scnone"]');
  await stap(pagina, 'R3: nep-Mistral netjes opruimen', async () => {
    await pagina.unroute('**/api.mistral.ai/**');
    r3Modus = 'uit'; r3Verwacht = false;
    await pagina.evaluate(() => { const k = document.getElementById('key'); if (k) k.value = ''; });
    notities.push('Ronde 3 draaide volledig met een nagebootste Mistral: ' + r3Verzoeken + ' aanroepen onderschept, 0 echte vragen verstuurd.');
  });

  // ===== Ronde 4 (v3.16, 1 nov): terugzetten, oude data, kapotte/lege opslag =====
  const foutenVoorR4 = fouten.length;
  await stap(pagina, 'R4: terug naar de single-file', async () => {
    await pagina.goto(url, { waitUntil: 'load' });
    await pagina.waitForTimeout(500);
  });
  let r4Backup = '';
  await stap(pagina, 'R4: markeerdag klaarzetten (via APP)', async () => {
    await pagina.evaluate(() => {
      if (!window.APP) throw new Error('window.APP bestaat niet in deze build');
      var d = APP.dayDoc('2026-11-02');
      d.entries.push({ id: 'botm1', slot: 'lunch', code: '', name: 'TerugzetTestje', k: 123 });
      APP.saveDay();
    });
    const ok = await pagina.evaluate(() => !!(APP.S.days['2026-11-02'] && APP.S.days['2026-11-02'].entries.some(function (e) { return e.name === 'TerugzetTestje'; })));
    if (!ok) throw new Error('de markeerdag staat niet in de opslag');
  });
  await stap(pagina, 'R4: reservekopie-text uit de app-status', async () => {
    await pagina.tap('#tabinst', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    r4Backup = await pagina.evaluate(() => JSON.stringify({ v: 1, days: APP.S.days, weights: APP.S.weights, fav: APP.S.fav, recipes: APP.S.recipes, mig: APP.S.mig, prijzen: APP.S.prijzen, icat: APP.S.icat, lijst: APP.S.lijst, maxes: APP.S.maxes, rare: APP.S.rare, rareD: APP.S.rareD || {}, normaal: APP.S.normaal, cat: APP.S.cat || {} }));
    if (r4Backup.indexOf('TerugzetTestje') === -1) throw new Error('de reservekopie bevat de markeerdag niet');
  }, 'R4-backup');

  // v3.16.2: altijd opruimen wat er open hangt (ook als een stap faalt) — anders valt de rest van Ronde 4 om
  async function sluitBewarenSchermen() {
    await pagina.evaluate(() => {
      var o = document.getElementById('outsheet'); if (o && !o.hidden) { var b = o.querySelector('button[data-act="outclose"]'); if (b) b.click(); }
      document.querySelectorAll('#instview details[open]').forEach(function (el) { el.open = false; });
      document.querySelectorAll('.sheet:not([hidden])').forEach(function (sh) { var c = sh.querySelector('[data-act$="close"]'); if (c) c.click(); });
    });
    await pagina.waitForTimeout(300);
  }
  await stap(pagina, 'R4: Terugzetten-rij opent direct de bestandkiezer', async () => {
    await sluitBewarenSchermen();
    const fc = await openTerugzetten(pagina);
    if (!fc) throw new Error('geen bestandkiezer na tik op Terugzetten');
  }, 'button[data-act="addgo"][data-v="uitbestand"]');
  await stap(pagina, 'R4: reservekopie uit bestand zet de markeerdag terug', async () => {
    await pagina.evaluate(() => { if (!window.APP) throw new Error('window.APP bestaat niet'); delete APP.S.days['2026-11-02']; APP.persist(); });
    await pagina.setInputFiles('#restorefile', { name: 'reservekopie.json', mimeType: 'application/json', buffer: Buffer.from(r4Backup) });
    await pagina.waitForTimeout(600);
    const t = await pagina.textContent('#toast');
    if (t.indexOf('Teruggezet') === -1) throw new Error('de toast zegt niet "Teruggezet" maar: ' + t);
    const terug = await pagina.evaluate(() => !!(APP.S.days['2026-11-02'] && APP.S.days['2026-11-02'].entries && APP.S.days['2026-11-02'].entries.some(function (e) { return e.name === 'TerugzetTestje'; })));
    if (!terug) throw new Error('de markeerdag staat niet terug in de opslag na het terugzetten');
  }, '#restorefile');
  await schot(pagina, 'r4-teruggezet');
  await stap(pagina, 'R4: kapotte tekst = nette melding, niets weggegooid', async () => {
    await sluitBewarenSchermen();
    await pagina.tap('#tabinst', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const dagenVoor = await pagina.evaluate(() => Object.keys(APP.S.days).length);
    await pagina.setInputFiles('#restorefile', { name: 'kapot.json', mimeType: 'application/json', buffer: Buffer.from('dit is geen json {{{') });
    await pagina.waitForTimeout(500);    await pagina.evaluate(() => { const el = document.querySelector('#outrestore'); if (!el) throw new Error('knop niet gevonden: #outrestore'); el.click(); });
    await pagina.waitForTimeout(400);
    const t = await pagina.textContent('#toast');
    if (t.indexOf('geen reservekopie') === -1) throw new Error('bij kapotte tekst hoort de melding "Dit is geen reservekopie" — de toast zegt: ' + t);
    const open = await pagina.getAttribute('#outsheet', 'hidden');
    if (open === null) notities.push('Bij kapotte tekst sluit de app het plak-scherm na de melding (toast kwam wél, niets weggegooid). Kan ook open blijven zodat je de tekst direct kunt verbeteren — klein wensje voor de code-kant.');
    const dagenNa = await pagina.evaluate(() => Object.keys(APP.S.days).length);
    if (dagenNa !== dagenVoor) throw new Error('de dagen veranderden wel (' + dagenVoor + ' → ' + dagenNa + ') terwijl er niets teruggezet mocht worden');
    await pagina.evaluate(() => { const el = document.querySelector('#outsheet button[data-act="outclose"]'); if (!el) throw new Error('knop niet gevonden: outclose'); el.click(); });
    await pagina.waitForTimeout(300);
  }, '#outrestore');
  await stap(pagina, 'R4: uit bestand terugzetten (#restorefile)', async () => {
    await sluitBewarenSchermen();
    await pagina.evaluate(() => { if (!window.APP) throw new Error('window.APP bestaat niet'); delete APP.S.days['2026-11-02']; APP.persist(); });
    const weg = await pagina.evaluate(() => !APP.S.days['2026-11-02']);
    if (!weg) throw new Error('de markeerdag ging niet weg vóór de bestands-test');
    await pagina.setInputFiles('#restorefile', { name: 'bot-reservekopie.json', mimeType: 'application/json', buffer: Buffer.from(r4Backup, 'utf8') });
    await pagina.waitForTimeout(900);
    const t = await pagina.textContent('#toast');
    if (t.indexOf('Teruggezet') === -1) throw new Error('het bestand werd niet teruggezet (toast zegt: ' + t + ')');
    const terug = await pagina.evaluate(() => !!(APP.S.days['2026-11-02'] && APP.S.days['2026-11-02'].entries && APP.S.days['2026-11-02'].entries.some(function (e) { return e.name === 'TerugzetTestje'; })));
    if (!terug) throw new Error('de markeerdag staat niet terug na het bestand-terugzetten');
  }, '#restorefile');
  await stap(pagina, 'R4: schermen netjes dicht', async () => {
    await pagina.evaluate(() => {
      document.querySelectorAll('.sheet:not([hidden])').forEach(function (sh) { var c = sh.querySelector('[data-act$="close"]'); if (c) c.click(); });
      document.querySelectorAll('#instview details[open]').forEach(function (el) { el.open = false; });
    });
    await pagina.waitForTimeout(300);
    const open = await pagina.evaluate(() => [...document.querySelectorAll('.sheet')].filter(function (x) { return !x.hidden; }).map(function (x) { return x.id; }).join(','));
    if (open) throw new Error('deze schermen stonden nog open: ' + open);
  }, '.sheet');
  await stap(pagina, 'R4: oude data (lm/okb/ovb/sport) blijft bewaard', async () => {
    await pagina.evaluate(() => {
      var o = JSON.parse(localStorage.getItem('eetweek.v1') || '{}');
      o.days['2026-10-30'] = { date: '2026-10-30', entries: [
        { id: 'boud1', slot: 'lm', code: '', name: 'Oude lunch', k: 400 },
        { id: 'boud2', slot: 'okb', code: '', name: 'Ouwe koek', k: 100 },
        { id: 'boud3', slot: 'ovb', code: '', name: 'Oud ontbijt', k: 300 },
        { id: 'boud4', slot: 'sport', code: '', name: 'Oud sportmoment', k: 0 }
      ], notes: {} };
      localStorage.setItem('eetweek.v1', JSON.stringify(o));
    });
    const fVoor = fouten.length;
    await pagina.goto(url, { waitUntil: 'load' });
    await pagina.waitForTimeout(700);
    if (fouten.length !== fVoor) throw new Error('de app gaf JS-fouten bij het starten met oude data: ' + fouten[fouten.length - 1]);
    const n = await pagina.evaluate(() => { var d = APP.S.days['2026-10-30']; return d && d.entries ? d.entries.length : 0; });
    if (n < 4) throw new Error('de oude dag is niet bewaard gebleven (' + n + ' van de 4 entries) — "niets wegmijten" geldt ook voor oude data');
  });
  await stap(pagina, 'R4: "Oude data omzetten" ziet de oude dag', async () => {
    await pagina.tap('#tabinst', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    await openBlokGroep(pagina, 'button[data-act="oudopen"]');
    await pagina.waitForSelector('button[data-act="oudopen"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(250);
    await pagina.tap('button[data-act="oudopen"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const open = await pagina.getAttribute('#oudsheet', 'hidden');
    if (open !== null) throw new Error('het oude-data-scherm (oudsheet) opende niet');
    const tekst = await pagina.textContent('#oudbody');
    if (tekst.indexOf('oude indeling') === -1 || tekst.indexOf('30 okt 2026') === -1) throw new Error('de oude dag staat niet in het omzet-overzicht (hoort te staan als: Vrijdag 30 okt 2026: 1× Lunch + middag (oude indeling), ...) — tekst was: ' + tekst.slice(0, 200));
    // echt omzetten: eerste tik vraagt bevestiging ("Ja, echt omzetten"), tweede tik doet het
    await pagina.evaluate(() => { const el = document.querySelector('#oudsheet button[data-act="ouddo"]'); if (!el) throw new Error('knop niet gevonden: ouddo'); el.click(); });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => { const el = document.querySelector('#oudsheet button[data-act="ouddo"]'); if (!el) throw new Error('bevestigingsknop niet gevonden: ouddo (2e tik)'); el.click(); });
    await pagina.waitForTimeout(500);
    const klaar = await pagina.textContent('#oudbody');
    if (klaar.indexOf('omgezet') === -1) throw new Error('na twee tikken geen "omgezet"-melding (niets omgezet?) — tekst: ' + klaar.slice(0, 200));
    const na = await pagina.evaluate(() => {
      var d = APP.S.days['2026-10-30']; if (!d || !d.entries) return { n: 0, oud: 99 };
      return { n: d.entries.length, oud: d.entries.filter(function (e) { return e.slot === 'lm' || e.slot === 'okb' || e.slot === 'ovb' || e.slot === 'sport'; }).length };
    });
    if (na.n !== 4) throw new Error('na het omzetten staan er ' + na.n + ' keuzes in de oude dag (hoorden er 4 te blijven — niets wegmijten)');
    if (na.oud > 0) throw new Error(na.oud + ' keuzes staan nog op oude momenten na het omzetten');
    await pagina.evaluate(() => { const el = document.querySelector('#oudsheet button[data-act="oudclose"]'); if (!el) throw new Error('knop niet gevonden: oudclose'); el.click(); });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => { document.querySelectorAll('#instview details[open] summary').forEach(function (el) { el.click(); }); });
    await pagina.waitForTimeout(250);
  }, 'button[data-act="oudopen"]');
  await stap(pagina, 'R4: kapotte opslag start zonder crash', async () => {
    await pagina.evaluate(() => { localStorage.setItem('eetweek.v1', '{{{ dit is geen json'); });
    const fVoor2 = fouten.length;
    await pagina.goto(url, { waitUntil: 'load' });
    await pagina.waitForTimeout(700);
    if (fouten.length !== fVoor2) throw new Error('kapotte opslag gaf JS-fouten: ' + fouten[fouten.length - 1]);
    const dagen = await pagina.locator('#days .day').count();
    if (dagen < 1) throw new Error('de week tekende niet bij kapotte opslag');
    const banner = await pagina.textContent('#banner');
    if (!banner || !banner.trim()) throw new Error('er staat geen waarschuwing in de banner bij kapotte opslag');
  });
  await stap(pagina, 'R4: lege opslag vers netjes', async () => {
    await pagina.evaluate(() => { localStorage.removeItem('eetweek.v1'); localStorage.removeItem('eetweek.mig45c4'); localStorage.removeItem('eetweek.mig45d'); });
    const fVoor3 = fouten.length;
    await pagina.goto(url, { waitUntil: 'load' });
    await pagina.waitForTimeout(700);
    if (fouten.length !== fVoor3) throw new Error('lege opslag gaf JS-fouten: ' + fouten[fouten.length - 1]);
    const rec = await pagina.evaluate(() => (APP.S.recipes || []).length);
    if (rec < 1) throw new Error('een lege app start zonder starter-recepten');
    const dagen2 = await pagina.locator('#days .day').count();
    if (dagen2 < 1) throw new Error('de week tekende niet bij lege opslag');
  });
  await stap(pagina, 'R4: opruimen en notitie', async () => {
    notities.push('Ronde 4 testte terugzetten (plakken én uit bestand), oude data en kapotte/lege opslag — allemaal in de nep-testomgeving, nooit in echte data.');
    void foutenVoorR4;
  });

  // ===================== Ronde 5 (1 nov, v3.17): rekenen, jaarwissel, dubbel-tikken, kookmodus, offline, aantal-per-verpakking =====================
  // Na R4 is de opslag leeg vers (starter-recepten), dus R5 begint met een schone app en zet zelf nep-producten klaar.
  await stap(pagina, 'R5: reken-producten klaarzetten (via APP)', async () => {
    await pagina.evaluate(() => {
      if (!window.APP) throw new Error('window.APP bestaat niet in deze build');
      var S = APP.S;
      S.prijzen.push({ id: 'botreken1', n: 'Bot Rekenkaas', u: 'g', inh: 500, pr: 2.00, kc: 230, cat: ['brood'], alias: [], w: {}, lab: [], labx: [], foto: '' });
      S.prijzen.push({ id: 'botplak', n: 'Bot Plakworst', u: 'g', inh: 200, pr: 2.00, kc: 230, cat: ['brood'], alias: [], w: {}, lab: [], labx: [], foto: '', aantal: 10, aantalWoord: 'plakjes' });
      APP.persist();
    });
    await pagina.waitForTimeout(300);
  });
  await stap(pagina, 'R5: dag + moment open, moment-scherm open (reken-ronde)', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#days .dayhead'); if (!el) throw new Error('knop niet gevonden: #days .dayhead'); el.click(); });
    await pagina.waitForTimeout(250);
    await zorgDagdeelOpen(pagina);
    await pagina.tap('#days .day.open .moment .mkop >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    await pagina.tap('#days .day.open .moment.open .toevoegknop >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden !== null) throw new Error('moment-scherm bleef dicht');
  }, '#days .day.open .moment.open .toevoegknop >> nth=0');
  await stap(pagina, 'R5: rekenen — Bot Rekenkaas aantikken vraagt om hoeveelheid', async () => {
    await pagina.evaluate(() => { const el = [...document.querySelectorAll('#pbody button[data-act="pkask"]')].find(b => b.textContent.indexOf('Bot Rekenkaas') >= 0); if (!el) throw new Error('Bot Rekenkaas staat niet in het moment-scherm'); el.click(); });
    await pagina.waitForTimeout(300);
    const n = await pagina.locator('#pbody .pkamt').count();
    if (n < 1) throw new Error('het hoeveelheids-vraagje verscheen niet');
  }, '#pbody button[data-act="pkask"]');
  await stap(pagina, 'R5: rekenen — 200 g van 230 kcal/100 g = 460 kcal', async () => {
    await pagina.fill('#pbody .pkamt >> nth=0', '200');
    await pagina.waitForTimeout(200);
    await pagina.evaluate(() => { const el = document.querySelector('#pbody button[data-act="pkgo"]'); if (!el) throw new Error('knop niet gevonden: pkgo'); el.click(); });
    await pagina.waitForTimeout(400);
    const e = await pagina.evaluate(() => {
      var S = APP.S, d = S.days[S.sheet.day]; if (!d) return null;
      return d.entries.filter(function (x) { return x.name && x.name.indexOf('Bot Rekenkaas') >= 0; }).map(function (x) { return { k: x.k, name: x.name }; })[0] || null;
    });
    if (!e) throw new Error('de Bot Rekenkaas-entry staat niet in de dag');
    if (e.k !== 460) throw new Error('kcal klopt niet: 200 g van 230 kcal per 100 g hoort 460 te zijn, maar de app rekende ' + e.k);
    if (e.name.indexOf('200 g') === -1) throw new Error('de blokjestekst noemt de hoeveelheid niet: ' + e.name);
  }, '#pbody button[data-act="pkgo"]');
  await stap(pagina, 'R5: aantal-per-verpakking — plakjes-eenheid bij het product (v48.2)', async () => {
    await pagina.evaluate(() => { const el = [...document.querySelectorAll('#pbody button[data-act="pkask"]')].find(b => b.textContent.indexOf('Bot Plakworst') >= 0); if (!el) throw new Error('Bot Plakworst staat niet in het moment-scherm'); el.click(); });
    await pagina.waitForTimeout(300);
    const pill = await pagina.locator('#pbody button[data-act="pkunit"][data-v="plakjes"]').count();
    if (pill < 1) throw new Error('de plakjes-eenheid (aantal-per-verpakking: 200 g ÷ 10 plakjes) ontbreekt bij Bot Plakworst');
    await pagina.evaluate(() => { const el = document.querySelector('#pbody button[data-act="pkunit"][data-v="plakjes"]'); if (el) el.click(); });
    await pagina.waitForTimeout(300);
  }, '#pbody button[data-act="pkunit"]');
  await stap(pagina, 'R5: aantal-per-verpakking — live "= 30 g"-regeltje bij 1,5 plakjes', async () => {
    await pagina.fill('#pbody .pkamt >> nth=0', '1,5');
    await pagina.waitForTimeout(300);
    const panel = await pagina.evaluate(() => { const el = document.querySelector('#pbody .icatpanel'); return el ? el.textContent : (document.getElementById('pbody') || {}).textContent || ''; });
    if (!/= ?30 ?g/.test(String(panel))) throw new Error('het live "= 30 g"-regeltje verscheen niet bij 1,5 plakjes (1 plakje = 200 g ÷ 10 = 20 g) — tekst: ' + String(panel).slice(0, 200));
  });
  await stap(pagina, 'R5: rekenen — 1,5 plakjes à 20 g = 69 kcal', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#pbody button[data-act="pkgo"]'); if (!el) throw new Error('knop niet gevonden: pkgo'); el.click(); });
    await pagina.waitForTimeout(400);
    const e = await pagina.evaluate(() => {
      var S = APP.S, d = S.days[S.sheet.day]; if (!d) return null;
      return d.entries.filter(function (x) { return x.name && x.name.indexOf('Bot Plakworst') >= 0; }).map(function (x) { return { k: x.k, name: x.name }; })[0] || null;
    });
    if (!e) throw new Error('de plakjes-entry staat niet in de dag');
    if (e.k !== 69) throw new Error('kcal klopt niet: 1,5 plakjes van 20 g bij 230 kcal per 100 g hoort 69 te zijn, maar de app rekende ' + e.k);
    if (e.name.indexOf('1,5 plakjes') === -1) throw new Error('het eigen woord (plakjes) staat niet in de blokjestekst: ' + e.name);
  }, '#pbody button[data-act="pkgo"]');
  await stap(pagina, 'R5: rekenen — dagtelling = 460 + 69 = 529 kcal', async () => {
    const som = await pagina.evaluate(() => { var S = APP.S, d = S.days[S.sheet.day]; return d ? d.entries.reduce(function (t, x) { return t + (x.k || 0); }, 0) : 0; });
    if (som !== 529) throw new Error('de dagtelling is ' + som + ' kcal i.p.v. 529 (460 + 69)');
  });
  await stap(pagina, 'R5: moment-scherm dicht (reken-ronde)', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#sheet .xbtn[data-act="close"]'); if (!el) throw new Error('knop niet gevonden: #sheet .xbtn[data-act="close"]'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden === null) throw new Error('moment-scherm stond nog open na ✕');
  }, '#sheet .xbtn[data-act="close"]');
  await stap(pagina, 'R5: recept met plakjes-ingrediënt klaarzetten (v48.4, via APP)', async () => {
    await pagina.evaluate(() => {
      var S = APP.S;
      if (!S.recipes.some(function (r) { return r.id === 'botrecplak'; })) {
        // i.p = kcal per gram/keuze (zo doen de starter-recepten het, bijv. Kwark 0.66); de plakjes laten we op naam aan het product hangen (v48.4 rekent ze zelf om)
        S.recipes.push({ id: 'botrecplak', name: 'Boterham met plakworst', unit: null, fixed: null, where: ['lunch'], ing: [
          { n: 'Bot Rekenkaas', a: 40, u: 'g', p: 2.3 },
          { n: 'Bot Plakworst', a: 1.5, u: 'plakjes', p: null }
        ] });
        APP.persist();
      }
    });
    await pagina.waitForTimeout(300);
  });
  await stap(pagina, 'R5: recept rekent plakjes door (40 g = 92 + 1,5 plakjes = 69 → 161 kcal)', async () => {
    const k = await pagina.evaluate(() => {
      var r = APP.S.recipes.filter(function (x) { return x.id === 'botrecplak'; })[0];
      if (!r) throw new Error('recept botrecplak is weg');
      return APP.recKcal(r, 1); // v3.17.1: factor meegeven (zonder f geeft recKcal NaN)
    });
    if (k !== 161) throw new Error('het recept rekent ' + k + ' kcal i.p.v. 161 (40 g Bot Rekenkaas → 92 kcal, 1,5 plakjes Bot Plakworst → 69 kcal) — rekt de v48.4-plakjes-omrekening in recepten mee?');
  });
  await stap(pagina, 'R5: recept toont het plakjes-woord in het bewerk-scherm (v57.9)', async () => {
    await pagina.tap('#tabrec', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const b = document.querySelector('#recview .rcard[data-rk$="botrecplak"] button[data-act="recmenu"]'); if (!b) throw new Error('geen ⋮-knop bij botrecplak'); b.click(); });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => { const b = document.querySelector('#recview .rcard[data-rk$="botrecplak"] .rcmenu button[data-act="recedit"]'); if (!b) throw new Error('geen Bewerken in het ⋮-menu'); b.click(); });
    await pagina.waitForTimeout(400);
    const txt = await pagina.textContent('#recsheet');
    if (txt.indexOf('plakjes') === -1) throw new Error('het ingrediënt toont niet het eigen woord "plakjes" in het bewerk-scherm');
    await pagina.tap('#recsheet button[data-act="recclose"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(300);
  }, '#recview .rcard[data-rk$="botrecplak"]');
  await stap(pagina, 'R5: jaarwissel — met de pijltjes naar de week van vrijdag 1 jan 2027', async () => {
    await pagina.tap('#tabweek', { timeout: 8000 }); // de weekpijltjes staan alleen op het Week-tab (na de recept-stap stonden we op Recepten)
    await pagina.waitForTimeout(300);
    for (let i = 0; i < 12; i++) {
      const jaar = await pagina.evaluate(() => APP.S.start.getFullYear());
      if (jaar === 2027) break;
      await pagina.tap('button[data-act="next"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(200);
    }
    const s = await pagina.evaluate(() => ({ j: APP.S.start.getFullYear(), m: APP.S.start.getMonth(), d: APP.S.start.getDate() }));
    if (s.j !== 2027 || s.m !== 0 || s.d !== 1) throw new Error('de week na de jaarwissel start niet op vrijdag 1 jan 2027, maar op ' + s.d + '-' + (s.m + 1) + '-' + s.j);
    const lab = await pagina.textContent('#weeklabel');
    if (lab.indexOf('1 jan') === -1 || lab.indexOf('7 jan') === -1) throw new Error('het weeklabel noemt 1 t/m 7 jan 2027 niet: ' + lab);
  }, 'button[data-act="next"]');
  await stap(pagina, 'R5: jaarwissel — week van 25 dec 2026, keuze op 31 dec klaarzetten', async () => {
    await pagina.tap('button[data-act="prev"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const s = await pagina.evaluate(() => ({ j: APP.S.start.getFullYear(), m: APP.S.start.getMonth(), d: APP.S.start.getDate() }));
    if (s.j !== 2026 || s.m !== 11 || s.d !== 25) throw new Error('de week vóór de jaarwissel start niet op vrijdag 25 dec 2026: ' + s.d + '-' + (s.m + 1) + '-' + s.j);
    await pagina.evaluate(() => {
      var S = APP.S, id = '2026-12-31';
      var d = S.days[id] || (S.days[id] = { date: id, entries: [], notes: {} });
      d.entries.push({ id: 'botjaar1', key: 'P:botplak', code: '', name: 'Bot Jaarwisselworst, 1 plakjes', k: 46, exact: true, pid: 'botplak', amt: 1, u: 'plakjes', slot: 'kl' }); // v3.17.3: slot 'kl' (Kleine lunch) — op een donderdag heeft het dag-schema géén 'lun' (Lunch)-moment, dus een keuze in slot 'lun' rendert nergens op die dag
      APP.persist();
    });
    await pagina.waitForTimeout(300);
  }, 'button[data-act="prev"]');
  await stap(pagina, 'R5: jaarwissel — de 31 dec-keuze staat in de 2026-week', async () => {
    // v3.17.2: eerst opslag-check (staat de keuze er écht in?), dan dag openen, dan pas zoeken —
    // en bij falen een diagnostiek-regel met de entries (slot|naam) en de dag-tekst.
    const opslag = await pagina.evaluate(() => {
      var d = APP.S.days['2026-12-31'];
      return d ? d.entries.map(function (e) { return (e.slot || '?') + '|' + (e.name || '?') + '|' + (e.amt || '') + (e.u || ''); }).join(' ; ') : 'GEEN DAG';
    });
    if (!opslag || opslag === 'GEEN DAG') throw new Error('de keuze van 31 dec 2026 staat niet in de opslag (APP.S.days["2026-12-31"] bestaat niet) — klaarzet-stap faalde stil');
    if (opslag.indexOf('Bot Jaarwisselworst') < 0) throw new Error('de keuze van 31 dec 2026 staat niet in de opslag, er staat alleen: ' + opslag);
    // 31 dec 2026 = donderdag = 7e (laatste) dag van de vrijdag-week
    await pagina.evaluate(() => { const lijst = document.querySelectorAll('#days .dayhead'); const el = lijst[lijst.length - 1]; if (!el) throw new Error('geen 7e dag gevonden'); el.click(); });
    await pagina.waitForTimeout(300);
    await zorgDagdeelOpen(pagina);
    await pagina.waitForTimeout(400);
    const nOpen = await pagina.evaluate(() => document.querySelectorAll('#days .day.open').length);
    if (nOpen !== 1) throw new Error('na het tikken op de 31 dec-dag staan er ' + nOpen + ' dagen open (hoort 1 te zijn)');
    const dagTekst = await pagina.evaluate(() => { const lijst = document.querySelectorAll('#days .day.open'); return lijst[0] ? lijst[0].textContent : ''; });
    if (dagTekst.indexOf('31') < 0 || dagTekst.indexOf('dec') < 0) throw new Error('de open dag lijkt niet 31 dec 2026 te zijn: "' + dagTekst.slice(0, 80) + '"');
    let gevonden = false;
    let nMom = 0;
    const nDag = await pagina.locator('#days .day.open .dkop').count(); // v50: momenten zitten per dagdeel — alle dagdelen aflopen
    for (let g = 0; g < nDag && !gevonden; g++) {
      await pagina.evaluate((i) => { const l = document.querySelectorAll('#days .day.open .dkop'); if (l[i]) l[i].click(); }, g);
      await pagina.waitForTimeout(250);
      nMom = await pagina.locator('#days .day.open .dagdeel.open .moment .mkop').count();
      for (let m = 0; m < nMom && !gevonden; m++) {
        await pagina.evaluate((i) => { const lijst = document.querySelectorAll('#days .day.open .dagdeel.open .moment .mkop'); if (lijst[i]) lijst[i].click(); }, m);
        await pagina.waitForTimeout(250);
        const t = await pagina.evaluate(() => { const lijst = document.querySelectorAll('#days .day.open'); const el = lijst[lijst.length - 1]; return el ? el.textContent : ''; });
        if (t.indexOf('Bot Jaarwisselworst') >= 0) { gevonden = true; break; }
      }
    }
    if (!gevonden) {
      const volTekst = await pagina.evaluate(() => { const lijst = document.querySelectorAll('#days .day.open'); return lijst[0] ? lijst[0].textContent.replace(/\\s+/g, ' ').slice(0, 400) : ''; });
      throw new Error('de keuze staat wél in de opslag (' + opslag + ') maar niet in de open dag — dag-tekst: "' + volTekst + '" (aantal momenten: ' + nMom + ') — check: hoort de slot van de keuze wel bij een moment op déze weekdag?');
    }
  }, '#days .dayhead');
  await stap(pagina, 'R5: jaarwissel — geen 2026-keuzes in de week van 2027', async () => {
    await pagina.tap('button[data-act="next"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const s = await pagina.evaluate(() => APP.S.start.getFullYear() + '-' + (APP.S.start.getMonth() + 1) + '-' + APP.S.start.getDate());
    if (s !== '2027-1-1') throw new Error('na het pijltje staat de app niet weer in de week van 1 jan 2027: ' + s);
    await pagina.evaluate(() => { const el = document.querySelector('#days .dayhead'); if (el) el.click(); });
    await pagina.waitForTimeout(300);
    let gelekt = false;
    const nDag = await pagina.locator('#days .day.open .dkop').count(); // v50: per dagdeel aflopen
    for (let g = 0; g < nDag && !gelekt; g++) {
      await pagina.evaluate((i) => { const l = document.querySelectorAll('#days .day.open .dkop'); if (l[i]) l[i].click(); }, g);
      await pagina.waitForTimeout(250);
      const nMom = await pagina.locator('#days .day.open .dagdeel.open .moment .mkop').count();
      for (let m = 0; m < nMom && !gelekt; m++) {
        await pagina.evaluate((i) => { const lijst = document.querySelectorAll('#days .day.open .dagdeel.open .moment .mkop'); if (lijst[i]) lijst[i].click(); }, m);
        await pagina.waitForTimeout(250);
        const t = await pagina.textContent('#days');
        if (t.indexOf('Bot Jaarwisselworst') >= 0) { gelekt = true; break; }
      }
    }
    if (gelekt) throw new Error('de 31 dec-2026-keuze lekt door naar de week van 1 jan 2027');
    const n2027 = await pagina.evaluate(() => Object.keys(APP.S.days).filter(function (id) { return id >= '2027-01-01'; }).length);
    if (n2027 !== 0) throw new Error('er staan al ' + n2027 + ' dagen met keuzes in 2027 terwijl de bot daar niets heeft neergezet');
  }, 'button[data-act="next"]');
  await stap(pagina, 'R5: jaarwissel — terug naar deze week', async () => {
    await pagina.tap('button[data-act="today"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const terug = await pagina.evaluate(() => {
      var nu = new Date(), verwacht = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - ((nu.getDay() - 5 + 7) % 7));
      return APP.fmtId(APP.S.start) === APP.fmtId(verwacht);
    });
    if (!terug) throw new Error('na "Naar deze week" staat de app niet terug in de week van vandaag');
    const tl = await pagina.getAttribute('#todaylink', 'hidden');
    if (tl === null) throw new Error('"Naar deze week" bleef zichtbaar terwijl we in deze week zijn');
  }, 'button[data-act="today"]');
  await stap(pagina, 'R5: dubbel-tikken — tab 2× snel (geen crash, tab actief)', async () => {
    const fVoor = fouten.length;
    await pagina.tap('#tabprijs', { timeout: 8000 });
    await pagina.tap('#tabprijs', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const pressed = await pagina.getAttribute('#tabprijs', 'aria-pressed');
    if (pressed !== 'true') throw new Error('na dubbel-tik staat het Producten-tab niet actief');
    if (fouten.length !== fVoor) throw new Error('dubbel-tik op tab gaf JS-fouten: ' + fouten[fVoor]);
  }, '#tabprijs');
  await stap(pagina, 'R5: dubbel-tikken — dag-kop 2× snel (eindstand eenduidig, max 1 dag open)', async () => {
    const fVoor = fouten.length;
    await pagina.tap('#tabweek', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => { const el = document.querySelector('#days .dayhead'); if (!el) throw new Error('knop niet gevonden: #days .dayhead'); el.click(); el.click(); });
    await pagina.waitForTimeout(400);
    const exp = await pagina.getAttribute('#days .dayhead >> nth=0', 'aria-expanded');
    if (exp !== 'true' && exp !== 'false') throw new Error('dag-stand is onduidelijk na dubbel-tik: ' + exp);
    const n = await pagina.locator('#days .day.open').count();
    if (n > 1) throw new Error('er staan ' + n + ' dagen open na dubbel-tik (hoort max 1 te zijn)');
    if (fouten.length !== fVoor) throw new Error('dubbel-tik op dag-kop gaf JS-fouten: ' + fouten[fVoor]);
  }, '#days .dayhead');
  await stap(pagina, 'R5: dubbel-tikken — + Toevoegen 2× snel (moment-scherm gewoon open)', async () => {
    const fVoor = fouten.length;
    await pagina.evaluate(() => { const el = document.querySelector('#days .dayhead'); if (el && el.getAttribute('aria-expanded') !== 'true') el.click(); });
    await pagina.waitForTimeout(300);
    await zorgDagdeelOpen(pagina);
    await pagina.tap('#days .day.open .moment .mkop >> nth=0', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const lijst = document.querySelectorAll('#days .day.open .moment.open .toevoegknop'); if (!lijst[0]) throw new Error('knop niet gevonden: .moment.open .toevoegknop'); lijst[0].click(); lijst[0].click(); });
    await pagina.waitForTimeout(500);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden !== null) throw new Error('moment-scherm openende niet bij dubbel-tik op + Toevoegen');
    if (fouten.length !== fVoor) throw new Error('dubbel-tik op + Toevoegen gaf JS-fouten: ' + fouten[fVoor]);
  }, '#days .day.open .moment.open .toevoegknop >> nth=0');
  await stap(pagina, 'R5: dubbel-tikken — product 2× toevoegen geeft precies 1 blokje', async () => {
    const fVoor = fouten.length;
    await pagina.evaluate(() => { const el = [...document.querySelectorAll('#pbody button[data-act="pkask"]')].find(b => b.textContent.indexOf('Bot Rekenkaas') >= 0); if (!el) throw new Error('Bot Rekenkaas niet gevonden in het moment-scherm'); el.click(); });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => { // v3.17.3: zet ÁLLE .pkamt-velden op 100 (de app leest bij pkgo de eerste .pkamt
      // binnen het eigen paneel — een achtergebleven oud paneel uit een vorig moment-scherm mag niet meer met 200 storen)
      const lijst = document.querySelectorAll('#pbody .pkamt');
      if (!lijst.length) throw new Error('geen hoeveelheids-veld gevonden in het moment-scherm');
      for (let i = 0; i < lijst.length; i++) {
        lijst[i].scrollIntoView({ block: 'center' });
        lijst[i].value = '100';
        lijst[i].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await pagina.waitForTimeout(200);
    await pagina.evaluate(() => { // v3.17.3: de LÁÁTSTE pkgo-knop — de eerste kan een achtergebleven oud paneel zijn (zelfde product, oude hoeveelheid)
      const lijst = document.querySelectorAll('#pbody button[data-act="pkgo"]');
      const el = lijst[lijst.length - 1];
      if (!el) throw new Error('knop niet gevonden: pkgo');
      el.click(); el.click();
    });
    await pagina.waitForTimeout(500);
    const n = await pagina.evaluate(() => { var S = APP.S, d = S.days[S.sheet.day]; return d ? d.entries.filter(function (x) { return x.name && x.name.indexOf('Bot Rekenkaas') >= 0 && x.amt === 100; }).length : -1; });
    if (n !== 1) throw new Error('na dubbel-tik staat het 100 g-blokje er ' + n + '× i.p.v. 1× in het moment');
    if (fouten.length !== fVoor) throw new Error('dubbel-tik op toevoegen gaf JS-fouten: ' + fouten[fVoor]);
  }, '#pbody button[data-act="pkgo"]');
  await stap(pagina, 'R5: moment-scherm dicht (dubbel-tik-ronde)', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#sheet .xbtn[data-act="close"]'); if (!el) throw new Error('knop niet gevonden: #sheet .xbtn[data-act="close"]'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#sheet', 'hidden');
    if (hidden === null) throw new Error('moment-scherm stond nog open na ✕');
  }, '#sheet .xbtn[data-act="close"]');
  await stap(pagina, 'R5: kookmodus — recept met stappen klaarzetten (via APP)', async () => {
    await pagina.evaluate(() => {
      var S = APP.S;
      if (!S.recipes.some(function (r) { return r.id === 'botcook'; })) {
        S.recipes.push({ id: 'botcook', name: 'Gebakken ei met kaas', unit: null, fixed: null, where: ['lunch'], ing: [
          { n: 'Bot Rekenkaas', a: 30, u: 'g', p: 'botreken1' }
        ], steps: '1. Verhit de pan.\n2. Bak het ei en leg de kaas erop.\ntip: eet lekker met brood.' });
        APP.persist();
      }
    });
    await pagina.waitForTimeout(300);
  });
  await stap(pagina, 'R5: kookmodus — Start met koken opent het kookscherm', async () => {
    await pagina.tap('#tabrec', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const el = document.querySelector('#recview .rcard[data-rk$="botcook"] button[data-act="cook"]'); if (!el) throw new Error('knop niet gevonden: 🍳 Start met koken op het kaartje'); el.click(); });
    await pagina.waitForTimeout(400);
    const hidden = await pagina.getAttribute('#cooksheet', 'hidden');
    if (hidden !== null) throw new Error('het kookscherm (cooksheet) opende niet');
    const prog = await pagina.textContent('#cookbody .cookprog');
    if (prog.indexOf('Stap 1 van 2') === -1) throw new Error('het kookscherm start niet meteen bij stap 1 (v57.9: geen startscherm meer): ' + prog);
  }, 'button[data-act="cook"]');
  await schot(pagina, 'kookmodus');
  await stap(pagina, 'R5: kookmodus — stappen doorklikpen t/m Klaar, en Vorige werkt', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#cookbody button[data-act="cooknext"]'); if (!el) throw new Error('knop niet gevonden: cooknext'); el.click(); });
    await pagina.waitForTimeout(300);
    let prog = await pagina.textContent('#cookbody .cookprog');
    if (prog.indexOf('Stap 2 van 2') === -1) throw new Error('na Volgende staat er niet "Stap 2 van 2": ' + prog);
    // v3.17.1: doorklikpen tot het échte eind-scherm (Start → Stap 1 → Stap 2 → Klaar; pas het laatste scherm zegt "Klaar")
    for (let i = 0; i < 6; i++) {
      if ((await pagina.textContent('#cookbody .cookprog')).indexOf('Klaar') >= 0) break;
      await pagina.evaluate(() => { const el = document.querySelector('#cookbody button[data-act="cooknext"]'); if (!el) throw new Error('knop niet gevonden: cooknext (verder)'); el.click(); });
      await pagina.waitForTimeout(300);
    }
    prog = await pagina.textContent('#cookbody .cookprog');
    if (prog.indexOf('Klaar') === -1) throw new Error('het eind-scherm ("Klaar") verschijnt niet: ' + prog);
    const klaar = await pagina.textContent('#cookbody');
    if (klaar.indexOf('Eet smakelijk') === -1) throw new Error('het eind-scherm zegt niet "Eet smakelijk"');
    await pagina.evaluate(() => { const el = document.querySelector('#cookbody button[data-act="cookprev"]'); if (!el) throw new Error('knop niet gevonden: cookprev'); el.click(); });
    await pagina.waitForTimeout(300);
    prog = await pagina.textContent('#cookbody .cookprog');
    if (prog.indexOf('Stap 2 van 2') === -1) throw new Error('Vorige gaat vanaf het eind-scherm niet terug naar de laatste stap: ' + prog);
  });
  await stap(pagina, 'R5: kookmodus — ✕ Stoppen sluit het kookscherm', async () => {
    await pagina.evaluate(() => { const el = document.querySelector('#cookbody button[data-act="cookclose"]'); if (!el) throw new Error('knop niet gevonden: cookclose'); el.click(); });
    await pagina.waitForTimeout(500);
    const hidden = await pagina.getAttribute('#cooksheet', 'hidden');
    if (hidden === null) throw new Error('het kookscherm bleef open na ✕ Stoppen');
  }, '#cookbody button[data-act="cookclose"]');
  await stap(pagina, 'R5: offline — zonder internet blijft de app gewoon werken', async () => {
    const fVoor = fouten.length;
    await pagina.context().setOffline(true);
    await pagina.waitForTimeout(200);
    await pagina.tap('#tabweek', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => { const el = document.querySelector('#days .dayhead'); if (el) el.click(); });
    await pagina.waitForTimeout(300);
    await pagina.tap('#tabrec', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    await pagina.tap('#tabprijs', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const pressed = await pagina.getAttribute('#tabprijs', 'aria-pressed');
    await pagina.context().setOffline(false);
    if (pressed !== 'true') throw new Error('offline lukte het niet om door de tabs te klikken');
    if (fouten.length !== fVoor) throw new Error('offline tikken gaf JS-fouten: ' + fouten[fVoor]);
  }, '#tabweek');
  await stap(pagina, 'R5: offline — geen externe verwijzingen in de app', async () => {
    const n = await pagina.evaluate(() => {
      var extern = 0;
      document.querySelectorAll('[src],[href]').forEach(function (el) {
        var s = el.getAttribute('src') || el.getAttribute('href') || '';
        if (/^https?:\/\//i.test(s)) extern++;
      });
      return extern;
    });
    if (n > 0) throw new Error('de app verwijst ' + n + '× naar een extern internetadres — offline (en privé) werken gaat dan stuk');
  });
  await stap(pagina, 'R5: opruimen en notitie', async () => {
    notities.push('Ronde 5 testte rekenen (kcal per 100 g en plakjes-omrekening), de jaarwissel-weken, dubbel-tikken, de kookmodus en offline — met nep-producten (Bot …), alleen in de testomgeving.');
  });


  // ===== R6 (v3.23, 12 nov, wens van de gebruiker): notitie-flow + nieuwe functies — STILLEN ronde =====
  // Bestaat een functie nog niet in deze build, dan komt er een notitie in het rapport i.p.v. een rode ✗.
  // Bestaat hij wél, dan wordt hij écht gecontroleerd. Leidraad: Voorbeelden/voorbeeld-zoek-popups-v2 + logboek 12 nov.

  await stap(pagina, 'R6: foetjes-check zoek-popup-voorbeeld (gekozens / Vervang dit / Laatst gekozen)', async () => {
    const fout = await pagina.evaluate(() => {
      const t = document.body.innerText;
      const f = [];
      if (/gekozens/i.test(t)) f.push('typo "gekozens"');
      if (/Vervang dit/i.test(t)) f.push('"Vervang dit"-menuonderdeel');
      if (/Alles van dit moment weghalen/i.test(t)) f.push('"Alles van dit moment weghalen"');
      if (/Laatst gekozen/i.test(t)) f.push('"Laatst gekozen"-rij (hoort weg, log 12 nov)');
      return f;
    });
    if (fout.length) throw new Error('oude menu-onderdelen op het scherm die er niet horen: ' + fout.join('; '));
  });

  await stap(pagina, 'R6: Recepten-tab tekent (v53.9-regressie: lege lijst zonder hint)', async () => {
    await pagina.tap('#tabrec', { timeout: 8000 });
    await pagina.waitForTimeout(600);
    const stand = await pagina.evaluate(() => {
      const n = document.querySelectorAll('#recview details, #recview li, #recview [class*=recrow], [id*=reclist] li').length;
      const hint = /Geen recepten gevonden/i.test(document.body.innerText);
      return { n: n, hint: hint };
    });
    if (stand.n === 0 && !stand.hint) throw new Error('Recepten-lijst tekent niet én geen "Geen recepten gevonden"-hint (recListHtml-regressie v53.9)');
    await pagina.tap('#tabweek', { timeout: 8000 });
    await pagina.waitForTimeout(400);
  }, '#tabrec');

  await stap(pagina, 'R6: brood zoeken in Toevoegen — elk kaartje leeft, "nog geen kcal" mag', async () => {
    await zorgDagdeelOpen(pagina);
    await pagina.evaluate(() => {
      if (!document.querySelector('#days .day.open .moment.open .toevoegknop')) {
        const m = document.querySelector('#days .day.open .moment .mkop');
        if (m) m.click();
      }
    });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => {
      const el = document.querySelector('#days .day.open .moment.open .toevoegknop');
      if (!el) throw new Error('geen + Toevoegen-knop op een open moment');
      el.click();
    });
    await pagina.waitForTimeout(600);
    await pagina.evaluate(() => {
      const el = document.querySelector('#sheet input[type=search], #sheet input:not([type])');
      if (!el) throw new Error('geen zoekveld in het Toevoegen-scherm');
      el.value = 'brood';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await pagina.waitForTimeout(900);
    const rapport = await pagina.evaluate(() => {
      const blad = document.querySelector('#sheet') || document.body;
      const kaarten = Array.from(blad.querySelectorAll('[class*=pk], [class*=kaart], [class*=card], label, li'))
        .filter(e => /brood/i.test(e.textContent || '') && (e.textContent || '').trim().length > 0 && (e.textContent || '').trim().length < 120);
      const dood = kaarten.filter(e => {
        const t = (e.textContent || '').trim();
        return !/kcal/i.test(t) && !/nog geen kcal/i.test(t) && !/[0-9]/.test(t);
      });
      return { n: kaarten.length, dood: dood.map(e => (e.textContent || '').trim().slice(0, 40)) };
    });
    if (rapport.n === 0) throw new Error('zoeken op "brood" gaf geen enkel kaartje');
    if (rapport.dood.length) throw new Error('dode kaartjes zonder kcal én zonder "nog geen kcal": ' + rapport.dood.join(' | '));
  }, '#sheet');

  await stap(pagina, 'R6: Toevoegen-scherm weer netjes dicht', async () => {
    await pagina.evaluate(() => { const x = document.querySelector('#sheet .xbtn[data-act="close"]'); if (x) x.click(); });
    await pagina.waitForTimeout(400);
    const dicht = await pagina.getAttribute('#sheet', 'hidden');
    if (dicht === null) notities.push('R6: Toevoegen-scherm bleef open na ✕ — klein wensje, geen blokkade.');
  });

  await stap(pagina, 'R6: eenheden-check — geen "1 g · 3750 kcal"-regels', async () => {
    const raar = await pagina.evaluate(() => {
      const rx = new RegExp('1\\s*g\\s*[·•]\\s*[0-9]{3,}\\s*kcal', 'gi');
      return (document.body.innerText.match(rx) || []);
    });
    if (raar.length) throw new Error('verdachte kcal-per-eenheid-regels: ' + raar.slice(0, 5).join('; '));
  });

  await stap(pagina, 'R6: zeg-kaartje staat BOVEN de dag-chips (v53-correctie, canvas v12)', async () => {
    const pos = await pagina.evaluate(() => {
      const zeg = Array.from(document.querySelectorAll('button, [class*=zeg], [class*=quick]')).find(e => /zeg wat je at/i.test(e.textContent || ''));
      const dagen = document.querySelector('#days');
      if (!zeg || !dagen) return 'geen';
      const rel = zeg.compareDocumentPosition(dagen);
      return (rel & Node.DOCUMENT_POSITION_FOLLOWING) ? 'boven' : 'in-of-onder';
    });
    if (pos === 'geen') { notities.push('R6: geen "Zeg wat je at"-kaartje gevonden — zit de zeg-flow al in deze build? Stille check overgeslagen.'); return; }
    if (pos !== 'boven') throw new Error('zeg-kaartje staat níet boven de dag-chips (v53-correctie: weeknav → zeg-blok → dag-chips, canvas v12)');
  });

  await stap(pagina, 'R6: briefje op leeg moment (v55: notewrap/notebrief) — ✕ haalt het weg, + Toevoegen komt terug', async () => {
    // v3.25: briefjes heten in v55 .notewrap > .notebrief (tik = uitwerken) + .notedel (✕)
    if (!(await pagina.locator('#days .day.open').count())) {
      await pagina.evaluate(() => { const h = document.querySelector('#days .dayhead'); if (h) h.click(); });
      await pagina.waitForTimeout(500);
    }
    let klaar = await pagina.evaluate(() => {
      if (!window.APP) return 'geen-APP';
      if (!document.querySelector('#days .day.open')) return 'geen-open-dag';
      return 'ok';
    });
    if (klaar !== 'ok') { notities.push('R6: geen open dag/moment (of geen window.APP) voor de briefje-check — stille check overgeslagen.'); return; }
    const gezet = await pagina.evaluate(() => {
      const mks = Array.from(document.querySelectorAll('#days .day.open .moment .mkop[data-day][data-slot]'));
      for (const mk of mks) {
        const dd = APP.dayDoc(mk.getAttribute('data-day')), sl = mk.getAttribute('data-slot');
        if (!(dd.entries || []).some(function (e) { return e.slot === sl; }) && !(dd.notes && dd.notes[sl])) {
          dd.notes = dd.notes || {};
          dd.notes[sl] = 'kliktest briefje';
          APP.persist(); APP.render();
          return { day: mk.getAttribute('data-day'), slot: sl };
        }
      }
      return null;
    });
    if (!gezet) { notities.push('R6: geen leeg moment gevonden voor een briefje — stille check overgeslagen.'); return; }
    await pagina.waitForTimeout(500);
    if (!(await pagina.locator('#days .day.open .notewrap .notebrief').count())) throw new Error('briefje (.notewrap .notebrief) verscheen niet op het lege moment');
    const xInfo = await pagina.evaluate(() => {
      const x = document.querySelector('#days .day.open .notewrap .notedel');
      if (!x) return null;
      return { day: x.getAttribute('data-day'), slot: x.getAttribute('data-slot') };
    });
    if (!xInfo) throw new Error('geen ✕ (.notedel) op het briefje gevonden');
    await pagina.evaluate(() => { document.querySelector('#days .day.open .notewrap .notedel').click(); });
    await pagina.waitForTimeout(500);
    if (await pagina.locator('#days .day.open .notewrap').count()) throw new Error('✕ op het briefje haalde de notitie niet weg');
    if (!(await pagina.locator('#days .day.open .toevoegknop').count())) throw new Error('na ✕ komt het + Toevoegen-blokje níet terug');
    await pagina.evaluate((info) => {
      const d = APP.dayDoc(info.day); d.notes = d.notes || {}; d.notes[info.slot] = 'kliktest briefje';
      APP.persist(); APP.render();
    }, xInfo);
    await pagina.waitForTimeout(400);
    if (!(await pagina.locator('#days .day.open .notewrap .notebrief').count())) throw new Error('briefje kwam niet terug na het terugzetten (voor de uitwerk-check)');
  });

  await stap(pagina, 'R6: uitwerk-flow (v55) — briefje aantikken opent het volledige Toevoegen-scherm', async () => {
    if (!(await pagina.locator('#days .day.open .notewrap .notebrief').count())) { notities.push('R6: uitwerk-flow niet te testen (geen briefje) — stille check overgeslagen.'); return; }
    await pagina.evaluate(() => { document.querySelector('#days .day.open .notewrap .notebrief').click(); });
    await pagina.waitForTimeout(700);
    const n = await pagina.evaluate(() => {
      const blad = document.querySelector('#sheet') || document.body;
      const t = blad.innerText || '';
      const m = t.match(/Toevoegen\s*\((\d+)\)/);
      return {
        brief: !!document.querySelector('#sheet .briefje') || /Jouw notitie/i.test(t),
        ditMoment: /DIT EETMOMENT/i.test(t),
        knop: m ? Number(m[1]) : null,
        sel: (window.APP && APP.S && APP.S.sheet && APP.S.sheet.sel ? APP.S.sheet.sel.length : 0)
      };
    });
    if (!n.brief) throw new Error('tik op het briefje opent geen uitwerk-scherm met het "Jouw notitie"-blokje bovenaan');
    if (!n.ditMoment) throw new Error('geen "DIT EETMOMENT"-blok in het uitwerk-scherm');
    if (n.knop === null) throw new Error('geen "Toevoegen (n)"-teller-knop in het uitwerk-scherm');
    if (n.knop !== n.sel) throw new Error('de teller zegt ' + n.knop + ' maar er zitten ' + n.sel + ' dingen in Dit eetmoment');
    await meetBovenin(pagina, 'het uitwerk-scherm', '#sheet .panel');
    await pagina.evaluate(() => { const x = document.querySelector('#sheet .xbtn[data-act="close"]'); if (x) x.click(); });
    await pagina.waitForTimeout(500);
  });

  await stap(pagina, 'R6: huismaten (snee, plakje, eetlepel, handje, bakje, bol)', async () => {
    const woorden = await pagina.evaluate(() => {
      const t = document.body.innerText;
      return ['snee', 'plakje', 'eetlepel', 'handje', 'bakje', 'bol'].filter(w => new RegExp('\\b' + w, 'i').test(t));
    });
    if (!woorden.length) { notities.push('R6: geen huismaten (snee/plakje/eetlepel/...) gevonden — zit nog niet in deze build, stille check overgeslagen.'); return; }
    notities.push('R6: huismaten zichtbaar (' + woorden.join(', ') + ') — de kcal-gram-rekening (per 100 g × grammen ÷ 100, eigen gewicht wint) diep-checken zodra de velden er echt in zitten.');
  });

  await stap(pagina, 'R6: stil NEVO — bronlabels (NEVO)/(AI) en vlaggetje "controleer even"', async () => {
    const scan = await pagina.evaluate(() => {
      const t = document.body.innerText;
      return { nevo: /\(NEVO\)/i.test(t), ai: /\(AI\)/i.test(t), vlag: /controleer even/i.test(t) };
    });
    if (!scan.nevo && !scan.ai) { notities.push('R6: geen (NEVO)/(AI)-bronlabels gevonden — NEVO/AI-opzoek zit nog niet in deze build, stille check overgeslagen.'); return; }
    notities.push('R6: bronlabels gezien — (NEVO)=' + scan.nevo + ', (AI)=' + scan.ai + ', vlaggetje "controleer even"=' + scan.vlag + '.');
  });

  await stap(pagina, 'R6: opruimen en notitie', async () => {
    notities.push('Ronde 6 (v3.23) testte de nieuwe functies — foetjes-check, Recepten-tab-regressie, brood-zoeken op dode kaartjes, eenheden, zeg-kaartje-positie, briefjes, uitwerk-flow-teller, huismaten en NEVO. Stille modus: wat nog niet in de build zat staat bovenaan tussen de notities.');
  });

    // ===== RONDE 7 (v3.26, 13 nov): de v55.2-functies — alles wat nog niet in de build zit wordt een stille notitie =====

  await stap(pagina, 'R7: gewone Toevoegen-popup = buffer (DIT EETMOMENT erin, GEEN "Jouw notitie"-blokje)', async () => {
    if (!(await pagina.locator('#days .day.open .toevoegknop').count())) {
      await pagina.evaluate(() => { const h = document.querySelector('#days .dayhead'); if (h) h.click(); });
      await pagina.waitForTimeout(500);
    }
    if (!(await pagina.locator('#days .day.open .toevoegknop').count())) { notities.push('R7: geen open dag met + Toevoegen-blokje — buffer-check overgeslagen.'); return; }
    await pagina.evaluate(() => { const b = document.querySelector('#days .day.open .toevoegknop'); if (b) b.click(); });
    await pagina.waitForTimeout(700);
    const s = await pagina.evaluate(() => {
      const blad = document.querySelector('#sheet') || document.body;
      const t = blad.innerText || '';
      return { dit: /DIT EETMOMENT/i.test(t), jouw: /Jouw notitie/i.test(t), open: !!document.querySelector('#sheet') && !(document.querySelector('#sheet').hidden) };
    });
    if (!s.open) { notities.push('R7: + Toevoegen opende geen popup — stille check overgeslagen.'); return; }
    if (!s.dit) { notities.push('R7: geen "DIT EETMOMENT"-buffer in de gewone Toevoegen-popup — buffer-flow (v55.2 punt 1) zit nog niet in deze build.'); return; }
    if (s.jouw) throw new Error('de gewone Toevoegen-popup heeft een "Jouw notitie"-blokje — dat is expliciet AFGEWEZEN (briefje hoort alleen onder het moment in de Week)');
  });

  await stap(pagina, 'R7: portie-knop zet eerst een regel in de buffer, nóg niks in de dag', async () => {
    const voor = await pagina.evaluate(() => {
      if (!window.APP || !APP.dayDoc) return null;
      const dag = document.querySelector('#days .day.open .mkop[data-day]');
      if (!dag) return null;
      const dd = APP.dayDoc(dag.getAttribute('data-day'));
      const sl = dag.getAttribute('data-slot');
      return { n: (dd.entries || []).filter(function (e) { return e.slot === sl; }).length, day: dag.getAttribute('data-day'), slot: sl };
    });
    if (!voor) { notities.push('R7: geen open moment voor de buffer-tik-check — overgeslagen.'); return; }
    const knop = await pagina.evaluate(() => {
      const blad = document.querySelector('#sheet') || document.body;
      const ks = Array.from(blad.querySelectorAll('button')).filter(function (b) { return /Hele portie|Halve portie/i.test(b.textContent || ''); });
      if (ks.length) { ks[0].click(); return 'geklikt'; }
      return 'geen';
    });
    if (knop === 'geen') { notities.push('R7: geen portie-knop (Hele/Halve portie) zichtbaar in de popup — overgeslagen (recept-uitklap misschien nodig).'); return; }
    await pagina.waitForTimeout(500);
    const na = await pagina.evaluate((info) => {
      const dd = APP.dayDoc(info.day);
      const n = (dd.entries || []).filter(function (e) { return e.slot === info.slot; }).length;
      const blad = document.querySelector('#sheet') || document.body;
      const t = blad.innerText || '';
      const m = t.match(/DIT EETMOMENT\s*\(?\s*(\d+)/i);
      const xjes = (blad.innerText.match(/\u2715/g) || []).length;
      return { n: n, buf: m ? Number(m[1]) : null, open: !document.querySelector('#sheet').hidden, xjes: xjes };
    }, voor);
    if (na.n > voor.n) {
      notities.push('R7: de portie-knop zette het DIRECT in de dag (oude v55.1-gedrag) — buffer-flow zit nog niet in deze build, geen rode vlag.');
      await pagina.evaluate(() => { const d = APP.dayDoc(document.querySelector('#days .day.open .mkop[data-day]').getAttribute('data-day')); (d.entries || []).pop(); APP.persist(); APP.render(); });
      return;
    }
    if (na.buf === null) throw new Error('na de portie-tik staat er geen "DIT EETMOMENT (1)"-buffer met teller');
    if (na.buf < 1) throw new Error('buffer-teller zegt ' + na.buf + ' terwijl er 1 regel in zou moeten staan');
    const teller = await pagina.evaluate(() => {
      const blad = document.querySelector('#sheet') || document.body;
      const b = Array.from(blad.querySelectorAll('button')).find(function (x) { return /Toevoegen\s*\(\d+\)/.test(x.textContent || ''); });
      return b ? b.textContent.trim() : null;
    });
    if (!teller) throw new Error('geen groene "Toevoegen (n)"-knop onderaan de popup');
    const weg = await pagina.evaluate(() => {
      const blad = document.querySelector('#sheet') || document.body;
      const x = Array.from(blad.querySelectorAll('button, [role=button], .xdel, [class*=del]')).find(function (b) { return /\u2715|\u00d7/.test((b.textContent || '').trim()) && b.closest('#sheet'); });
      if (x) { x.click(); return 'weg'; }
      return 'geen-x';
    });
    if (weg === 'geen-x') { notities.push('R7: geen \u2715 op de buffer-regel gevonden (andere opbouw?) — overgeslagen.'); return; }
    await pagina.waitForTimeout(400);
    const leeg = await pagina.evaluate(() => {
      const t = (document.querySelector('#sheet') || document.body).innerText || '';
      const m = t.match(/DIT EETMOMENT\s*\(?\s*(\d+)/i);
      return m ? Number(m[1]) : 0;
    });
    if (leeg !== 0) throw new Error('\u2715 haalde de buffer-regel niet weg (teller zegt nog ' + leeg + ')');
    notities.push('R7: buffer-flow werkt — portie-knop eerst in DIT EETMOMENT, dag onveranderd, \u2715 ruimt op. Toevoegen (n)-knop gezien: "' + teller + '".');
  });

  await stap(pagina, 'R7: briefje ook zichtbaar bij een GEVULD moment (v55.2 punt 2)', async () => {
    const gezet = await pagina.evaluate(() => {
      if (!window.APP || !APP.dayDoc) return null;
      const mks = Array.from(document.querySelectorAll('#days .day.open .moment .mkop[data-day][data-slot]'));
      for (const mk of mks) {
        const dd = APP.dayDoc(mk.getAttribute('data-day')), sl = mk.getAttribute('data-slot');
        if ((dd.entries || []).some(function (e) { return e.slot === sl; }) && !(dd.notes && dd.notes[sl])) {
          dd.notes = dd.notes || {}; dd.notes[sl] = 'kliktest briefje bij gevuld moment';
          APP.persist(); APP.render();
          return { day: mk.getAttribute('data-day'), slot: sl };
        }
      }
      return null;
    });
    if (!gezet) { notities.push('R7: geen gevuld moment zonder briefje gevonden — overgeslagen.'); return; }
    await pagina.waitForTimeout(500);
    if (!(await pagina.locator('#days .day.open .notewrap .notebrief').count())) {
      throw new Error('briefje onzichtbaar bij een GEVULD moment — de v55.2-fix (altijd tonen onder de productregels) werkt niet');
    }
    await pagina.evaluate((info) => { const d = APP.dayDoc(info.day); delete d.notes[info.slot]; APP.persist(); APP.render(); }, gezet);
    notities.push('R7: briefje staat zichtbaar bij een gevuld moment — fix bevestigd.');
  });

  await stap(pagina, 'R7: één recept-uitklap tegelijk (Recepten-tab)', async () => {
    await pagina.evaluate(() => { const b = Array.from(document.querySelectorAll('button, [data-tab], .tab')).find(function (x) { return /^Recepten/i.test((x.textContent || '').trim()); }); if (b) b.click(); });
    await pagina.waitForTimeout(600);
    const info = await pagina.evaluate(() => {
      const kandidaten = Array.from(document.querySelectorAll('.rec, .reccard, .rcard, [data-act="rec"], [data-act="quickrec"]')).filter(function (e) { return e.offsetParent !== null; });
      return { n: kandidaten.length };
    });
    if (info.n < 2) { notities.push('R7: geen twee recept-kaartjes herkend in de Recepten-tab — uitklap-check overgeslagen (selectoren onbekend).'); return; }
    const na2 = await pagina.evaluate(() => {
      const ks = Array.from(document.querySelectorAll('.rec, .reccard, .rcard, [data-act="rec"], [data-act="quickrec"]')).filter(function (e) { return e.offsetParent !== null; });
      ks[0].click();
      return new Promise(function (res) { setTimeout(function () { ks[1].click(); setTimeout(function () {
        const open = ks.map(function (k, i) {
          const parentOpen = k.closest('details') ? k.closest('details').open : (k.classList.contains('open') || k.className.indexOf('open') > -1);
          const uitklap = (k.parentElement.innerText.match(/Ingredi\u00ebnten/gi) || []).length;
          return { i: i, open: !!parentOpen, uitklap: uitklap };
        });
        res(open);
      }, 600); }, 600); });
    });
    const openCount = na2.filter(function (x) { return x.open; }).length;
    if (openCount > 1) throw new Error('twee recept-kaartjes staan tegelijk open (' + openCount + ') — één-uitklap-tegelijk (v55.2 punt 3) werkt niet');
    notities.push('R7: één recept-uitklap tegelijk in de Recepten-tab — ' + openCount + ' open na twee tikken, goed.');
  });

  await stap(pagina, 'R7: Recept plakken = hele lijst met rapport (v55.2 punt 4)', async () => {
    const knop = await pagina.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(function (x) { return /Recept plakken/i.test(x.textContent || ''); });
      if (!b) return null; b.click(); return 'open';
    });
    if (!knop) { notities.push('R7: geen "Recept plakken"-knop gevonden — lijst-plakken overgeslagen.'); return; }
    await pagina.waitForTimeout(600);
    const lijst = JSON.stringify([
      { id: 'kliktest-r7-a', name: 'Kliktest lijst A', emoji: '\u2728', por: 1, where: [], ing: [{ n: 'water', a: 1, u: 'glas' }], steps: '' },
      { id: 'kliktest-r7-b', name: 'Kliktest lijst B', emoji: '\u2728', por: 1, where: [], ing: [{ n: 'thee', a: 1, u: 'kop' }], steps: '' }
    ]);
    const geplakt = await pagina.evaluate((tekst) => {
      const blad = document.querySelector('#sheet') || document.body;
      const ta = blad.querySelector('textarea');
      if (!ta) return 'geen-textarea';
      ta.value = tekst;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      const go = Array.from(blad.querySelectorAll('button')).find(function (x) { return /(plak|bewaar|toevoegen)/i.test(x.textContent || '') && !/annuleer/i.test(x.textContent); });
      if (!go) return 'geen-knop';
      go.click();
      return 'geplakt';
    }, lijst);
    if (geplakt !== 'geplakt') { notities.push('R7: Recept plakken-flow niet te volgen (' + geplakt + ') — lijst-plakken overgeslagen.'); return; }
    await pagina.waitForTimeout(800);
    const uit = await pagina.evaluate(() => {
      const t = document.body.innerText;
      const a = (window.APP && APP.recipes ? APP.recipes.filter(function (r) { return r.id === 'kliktest-r7-a'; }).length : 0);
      const b = (window.APP && APP.recipes ? APP.recipes.filter(function (r) { return r.id === 'kliktest-r7-b'; }).length : 0);
      return { a: a, b: b, rapport: /(toegevoegd|overgeslagen)/i.test(t) };
    });
    if (uit.a + uit.b === 2) {
      notities.push('R7: hele lijst geplakt (2 recepten aanwezig)' + (uit.rapport ? ' en rapport gezien' : ' — rapport-tekst niet herkend, wel goed gegaan') + '.');
      await pagina.evaluate(() => { if (window.APP && APP.recipes) { APP.recipes = APP.recipes.filter(function (r) { return r.id.indexOf('kliktest-r7-') !== 0; }); APP.persist(); APP.render(); } });
    } else if (uit.a + uit.b === 1) {
      notities.push('R7: na het plakken van een LIJST staat er maar 1 recept in — hele-lijst-plakken (v55.2 punt 4) zit nog niet in deze build.');
      await pagina.evaluate(() => { if (window.APP && APP.recipes) { APP.recipes = APP.recipes.filter(function (r) { return r.id.indexOf('kliktest-r7-') !== 0; }); APP.persist(); APP.render(); } });
    } else {
      notities.push('R7: geen van de twee lijst-recepten aangekomen — misschien andere veldnamen of bevestiging nodig; handmatig even kijken.');
    }
  });

  await stap(pagina, 'R7: "Zelf iets toevoegen" — zoekbalkje weg + "meer ▾" blijft open (v55.2 punt 5)', async () => {
    const uitklap = await pagina.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(function (x) { return /Zelf iets toevoegen/i.test(x.textContent || ''); });
      if (!b) return 'geen-knop'; b.click(); return 'open';
    });
    if (uitklap !== 'open') { notities.push('R7: geen "Zelf iets toevoegen"-uitklapje gevonden — overgeslagen.'); return; }
    await pagina.waitForTimeout(500);
    const scan = await pagina.evaluate(() => {
      const blad = document.querySelector('#sheet') || document.body;
      const zoekjes = Array.from(blad.querySelectorAll('input[type=search], input[placeholder*=zoek i]')).filter(function (e) { return e.offsetParent !== null; });
      const meer = Array.from(blad.querySelectorAll('button')).find(function (x) { return /meer\s*\u25be/i.test((x.textContent || '')); });
      return { zoekjes: zoekjes.length, heeftMeer: !!meer };
    });
    if (scan.zoekjes > 0) notities.push('R7: er staat nog een zoekbalkje in het "Zelf iets toevoegen"-uitklapje (' + scan.zoekjes + ') — v55.2 punt 5a nog niet in de build.');
    else notities.push('R7: geen zoekbalkje in het uitklapje — punt 5a in orde.');
    if (!scan.heeftMeer) { notities.push('R7: geen "meer \u25be"-knop gevonden in het uitklapje — flip-check overgeslagen.'); return; }
    const flip = await pagina.evaluate(() => {
      const blad = document.querySelector('#sheet') || document.body;
      const meer = Array.from(blad.querySelectorAll('button')).find(function (x) { return /meer\s*\u25be/i.test((x.textContent || '')); });
      meer.click();
      return new Promise(function (res) { setTimeout(function () {
        const nog = Array.from(blad.querySelectorAll('button')).filter(function (x) { return /meer\s*[\u25be\u25b4]/i.test((x.textContent || '')); });
        res({ open: nog.length > 0 });
      }, 600); });
    });
    if (!flip.open) notities.push('R7: na "meer \u25be" klapt het uitklapje dicht (re-render) — v55.2 punt 5b nog niet in de build.');
    else notities.push('R7: "meer \u25be" blijft open na de tik — punt 5b in orde.');
  });

  await stap(pagina, 'R7: zeg-knopjes — zichtbaar zolang er tekst staat, weg als het veld leeg is (v55.2 punt 6)', async () => {
    const veld = await pagina.evaluate(() => {
      const kandidaten = Array.from(document.querySelectorAll('textarea, input[type=text]')).filter(function (e) {
        const ph = (e.getAttribute('placeholder') || '') + ' ' + (e.value || '');
        return /at|gegeten|zoek/i.test(ph) && e.offsetParent !== null;
      });
      if (!kandidaten.length) return null;
      const zegBlok = Array.from(document.querySelectorAll('[class*=zeg], [class*=quick]')).find(function (e) { return /zeg wat je at/i.test(e.textContent || ''); });
      if (!zegBlok) return null;
      const binnen = zegBlok.querySelectorAll('textarea, input[type=text]');
      return binnen.length ? binnen[0] : kandidaten[0];
    });
    if (!veld) { notities.push('R7: geen zeg-veld gevonden op het Week-tab — zeg-knopjes-check overgeslagen (staat de bot op de goede tab?).'); return; }
    const leegZichtbaar = await pagina.evaluate(() => {
      const t = document.body.innerText;
      return { later: /Later uitwerken/i.test(t), tekst: /Alleen als tekst|Alleen tekst/i.test(t) };
    });
    await pagina.evaluate(() => {
      const zegBlok = Array.from(document.querySelectorAll('[class*=zeg], [class*=quick]')).find(function (e) { return /zeg wat je at/i.test(e.textContent || ''); });
      const v = zegBlok ? zegBlok.querySelector('textarea, input[type=text]') : null;
      if (v) { v.value = 'kliktest zegtekst'; v.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await pagina.waitForTimeout(600);
    const metTekst = await pagina.evaluate(() => {
      const t = document.body.innerText;
      return { later: /Later uitwerken/i.test(t), tekst: /Alleen als tekst|Alleen tekst/i.test(t) };
    });
    if (!metTekst.later && !metTekst.tekst) { notities.push('R7: geen zeg-knopjes (\u{1F552} Later uitwerken / \u{1F4DD} Alleen tekst) verschenen bij tekst in het zeg-veld — zit de zeg-flow in deze build? Stille check overgeslagen.'); return; }
    if (leegZichtbaar.later && leegZichtbaar.tekst) notities.push('R7: de zeg-knopjes stonden AL zichtbaar bij een LEEG veld (zegTik-eeuwig-aan-bug) — v55.2 punt 6 nog niet in de build.');
    await pagina.evaluate(() => {
      const zegBlok = Array.from(document.querySelectorAll('[class*=zeg], [class*=quick]')).find(function (e) { return /zeg wat je at/i.test(e.textContent || ''); });
      const v = zegBlok ? zegBlok.querySelector('textarea, input[type=text]') : null;
      if (v) { v.value = ''; v.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await pagina.waitForTimeout(400);
    notities.push('R7: zeg-knopjes verschenen bij tekst in het veld — de rest (weg na echt gebruik, persist na herstart) check je even zelf met de hand.');
  });

  await stap(pagina, 'R7: bron-labels (NEVO)/(OFF)/(AI) + supermarkt bij de prijs (v55.2 punt 7)', async () => {
    const scan = await pagina.evaluate(() => {
      const t = document.body.innerText;
      return { nevo: /\(NEVO\)/i.test(t), off: /\(OFF\)/i.test(t), ai: /\(AI\)/i.test(t), markt: /(Albert Heijn|Lidl|Jumbo|supermarkt)/i.test(t) };
    });
    if (!scan.nevo && !scan.off && !scan.ai) { notities.push('R7: nergens (NEVO)/(OFF)/(AI)-bronlabels gezien — bron-labels overal (v55.2 punt 7) zit nog niet in de build.'); }
    else { notities.push('R7: bronlabels gezien — (NEVO)=' + scan.nevo + ', (OFF)=' + scan.off + ', (AI)=' + scan.ai + ', supermarkt-tekst=' + scan.markt + '. Check zelf even of ze nu óók in Product bewerken staan.'); }
  });

  await stap(pagina, 'R7: + Toevoegen-blokje ALTIJD zichtbaar, óók bij een GEVULD moment (v55.2 punt 1-uitbreiding)', async () => {
    const gevuld = await pagina.evaluate(() => {
      if (!window.APP || !APP.dayDoc) return null;
      const mks = Array.from(document.querySelectorAll('#days .day.open .moment .mkop[data-day][data-slot]'));
      for (const mk of mks) {
        const dd = APP.dayDoc(mk.getAttribute('data-day')), sl = mk.getAttribute('data-slot');
        if ((dd.entries || []).some(function (e) { return e.slot === sl; })) return { day: mk.getAttribute('data-day'), slot: sl };
      }
      return null;
    });
    if (!gevuld) { notities.push('R7: geen gevuld moment gevonden — Toevoegen-blokje-check overgeslagen.'); return; }
    const blokje = await pagina.evaluate(() => !!document.querySelector('#days .day.open .toevoegknop'));
    if (!blokje) throw new Error('het + Toevoegen-blokje is weg bij een GEVULD moment — hoort volgens v55.2 ALTIJD zichtbaar te zijn');
    notities.push('R7: + Toevoegen-blokje staat zichtbaar bij een gevuld moment — punt 1-uitbreiding in orde.');
  });

  await stap(pagina, 'R7: opruimen en notitie', async () => {
    await pagina.evaluate(() => { const x = document.querySelector('#sheet .xbtn[data-act="close"]'); if (x) x.click(); });
    notities.push('Ronde 7 (v3.26) testte de v55.2-doorgeef — rekenbug (via buffer-knoppen niet meetbaar, check zelf in een recept met Plank-product), buffer-flow, briefje-bij-gevuld-moment, één-uitklap, lijst-plakken, zoekbalkje/meer-flip, zeg-knopjes en bronlabels. Stille modus: wat nog niet in de build zat staat tussen de notities.');
  });

  // ===== Ronde 8 (v3.27, 13 nov): PUNT 8 — bon-korting lezen, per supermarkt (stille modus, echte bonnen 28700-28707) =====
  const r8Foto = maakPng(240, 320);
  async function r8OpenScanner() {
    await pagina.tap('#tabinst', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    await openBlokGroep(pagina, 'button[data-act="addgo"][data-v="kbon"]');
    if ((await pagina.getAttribute('#scsheet', 'hidden')) !== null) {
      await pagina.waitForSelector('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(250);
      await pagina.tap('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(300);
      await pagina.tap('button[data-act="addgo"][data-v="kbon"]:visible', { timeout: 8000 });
      await pagina.waitForTimeout(400);
    }
    const hidden = await pagina.getAttribute('#scsheet', 'hidden');
    if (hidden !== null) throw new Error('de scanner opende niet (R8)');
    await pagina.evaluate(() => { const m = document.querySelector('#scbody button[data-act="scmode"][data-v="bon"]'); if (m) m.click(); });
    await pagina.waitForTimeout(300);
  }
  async function r8Uitlees() {
    return await pagina.evaluate(() => {
      return { t: document.getElementById('scbody') ? document.getElementById('scbody').innerText : document.body.innerText,
               velden: Array.from(document.querySelectorAll('#scbody input[data-boni-bon]')).map(function (e) { return e.value; }) };
    });
  }
  async function r8VoerIn(ant) {
    r8Ant = ant;
    await r8OpenScanner();
    await pagina.setInputFiles('#scfile', { name: 'r8-bon.png', mimeType: 'image/png', buffer: r8Foto });
    await pagina.waitForTimeout(600);
    await pagina.tap('#scbody button[data-act="scropgo"]:visible', { timeout: 8000 });
    await pagina.waitForTimeout(1500);
    return await r8Uitlees();
  }
  function r8Prod(naam, prijs, extra) {
    return Object.assign({ naam: naam, aantal: 1, prijs: prijs, bonus: null, korting_tekst: '', statiegeld: false, geen_eten: false, artikel: '', artikel_inhoud: null, artikel_eenheid: '', kcal: 100, eiwit: 5, suikers: 1, verzadigd: 1, zout: 0.5, vezels: 1, match: null, match_id: null, zeker: false, onzeker: [] }, extra || {});
  }

  await stap(pagina, 'R8: AH-bon 28700 — (B)-markeertje is géén korting, géén -€ 0,49, losse Bonus-regel wél (PUNT 8a)', async () => {
    await pagina.route('**/api.mistral.ai/**', mistralRoute); // v3.27.1: R3 zet de nep-Mistral uit — hier weer aan (0 echte aanroepen)
    const uitlees = await r8VoerIn({ gelukt: true, reden: '', bon: [
      r8Prod('AH WRAPS', 0.95),
      r8Prod('CALVE SAUS', 2.95),
      r8Prod('IJSBERGSLA', 2.19),
      r8Prod('ITALIA BOL', 0.98, { aantal: 2 }),
      r8Prod('AH ITALIAANSE -0,09', -0.09, { korting_tekst: 'AH ITALIAANSE -0,09', kcal: null, eiwit: null, suikers: null, verzadigd: null, zout: null, vezels: null })
    ] });
    if (/[-\u2212]\s*€\s*0,49/.test(uitlees.t)) r8Status.push('⚠️ PUNT 8a (AH 28700): er staat een -€ 0,49 als korting op het overzicht — de oude (B)/stuksprijs-mislezing zit nog in de build.');
    else r8Status.push('✅ PUNT 8a (AH 28700): nergens een -€ 0,49-korting — het (B)-markeertje en de stuksprijs 0,49 worden niet als korting gelezen.');
    if (/verwerkt bij het product/.test(uitlees.t)) r8Status.push('✅ PUNT 8a (AH 28700): de losse Bonus-regel (-0,09) is als korting bij het product verwerkt (verwacht: subtotaal 7,07 - uw voordeel 0,09 = totaal 6,98).');
    else if (/0,09/.test(uitlees.t)) r8Status.push('⚠️ PUNT 8a (AH 28700): de -0,09-regel staat op het overzicht maar is niet als korting bij het product verwerkt — check of hij apart als Korting getoond wordt (PUNT 8d).');
    else r8Status.push('⚠️ PUNT 8a (AH 28700): geen -0,09-regel teruggevonden — korting-regels zichtbaar tonen (PUNT 8d) zit mogelijk nog niet in de build.');
    if (uitlees.velden.length) r8Status.push('R8 AH 28700 — bonusprijs-velden: [' + uitlees.velden.join(' | ') + '] (PUNT 8g: leeg tenzij er een échte bonusprijs-regel op de bon staat).');
  }, '#scbody');

  await stap(pagina, 'R8: AH-BB-bon 28705 — BBOX-korting koppelt op naam, statiegeld apart (PUNT 8a+e)', async () => {
    const uitlees = await r8VoerIn({ gelukt: true, reden: '', bon: [
      r8Prod('TYRRELLS', 2.99),
      r8Prod('SCHOUDERHAM', 1.49),
      r8Prod('TIJGER VOLK', 1.05),
      r8Prod('MILKIS STRAW', 1.29),
      r8Prod('BBOX TYRRELLS150 -0,45', -0.45, { korting_tekst: 'BBOX TYRRELLS150 -0,45', kcal: null, eiwit: null, suikers: null, verzadigd: null, zout: null, vezels: null }),
      r8Prod('STATIEGELD 0,15', 0.15, { statiegeld: true, geen_eten: true, kcal: null, eiwit: null, suikers: null, verzadigd: null, zout: null, vezels: null })
    ] });
    if (/verwerkt bij het product/.test(uitlees.t)) r8Status.push('✅ PUNT 8a (AH 28705): de BBOX TYRRELLS150 -kortingsregel (-0,45) is op naam aan de tyrrells gekoppeld (uw voordeel 0,45, totaal 6,52).');
    else r8Status.push('⚠️ PUNT 8a (AH 28705): de BBOX -kortingsregel (-0,45) is nog niet als korting aan het product gekoppeld — BB/BBOX = Bonus Box, géén bedrag op zichzelf.');
    if (/apart gehouden|Statiegeld/i.test(uitlees.t)) r8Status.push('✅ PUNT 8e (AH 28705): +STATIEGELD 0,15 wordt apart gehouden (geen product, geen kcal, geen korting).');
    else r8Status.push('⚠️ PUNT 8e (AH 28705): het statiegeld is niet als apart herkenbaar op het overzicht.');
    if (uitlees.velden.length) r8Status.push('R8 AH 28705 — bonusprijs-velden: [' + uitlees.velden.join(' | ') + '].');
  }, '#scbody');

  await stap(pagina, 'R8: Lidl-bonnen 28703/28707 — In prijs verlaagd / Actieprijs bij het product erboven, bonusprijs-veld LEEG (PUNT 8b+g)', async () => {
    const uitlees = await r8VoerIn({ gelukt: true, reden: '', bon: [
      r8Prod('ZOUTE STENGELS', 0.54),
      r8Prod('In prijs verlaagd -0,30', -0.30, { korting_tekst: 'In prijs verlaagd -0,30' }),
      r8Prod('RISTORANTE POLLO', 2.95),
      r8Prod('Actieprijs -1,07', -1.07, { korting_tekst: 'Actieprijs -1,07' }),
      r8Prod('DIEPVRIES PASTAGER.', 3.79, { bonus: 0.10, korting_tekst: 'In prijs verlaagd -0,10' }),
      r8Prod('MAGERE FRANSE KWARK', 1.65, { bonus: 0.06, korting_tekst: 'In prijs verlaagd -0,06' }),
      r8Prod('LIDL PLUS KORTING', -0.70, { kcal: null, eiwit: null, suikers: null, verzadigd: null, zout: null, vezels: null })
    ] });
    const kortingVeld = uitlees.velden.filter(function (v) { return /0,10|0,30|1,07|0,06|0,70/.test(String(v)); });
    if (kortingVeld.length) r8Status.push('⚠️ PUNT 8g (Lidl 28703): het bonusprijs-veld bevat een kortingsbedrag [' + kortingVeld.join(', ') + '] — een korting is géén bonusprijs (en een prijs is nooit negatief); dit veld hoort leeg te blijven.');
    else if (uitlees.velden.length) r8Status.push('✅ PUNT 8g (Lidl 28703): het bonusprijs-veld blijft leeg bij louter korting-regels.');
    else r8Status.push('R8 Lidl: geen bonusprijs-velden op dit scherm gevonden — PUNT 8g pas te oordelen in de product-kaartjes (open er eentje met de hand).');
    if (/verwerkt bij het product|Korting/.test(uitlees.t)) r8Status.push('✅ PUNT 8b (Lidl 28703/28707): In prijs verlaagd / Actieprijs worden als korting herkend en bij het product erboven getoond.');
    else r8Status.push('⚠️ PUNT 8b (Lidl 28703/28707): de kortingsregels zijn niet als Korting bij het product te herkennen — de koppel-regel (negatief regeltje direct onder het product) zit mogelijk nog niet in de build.');
    if (/Persoonlijke korting/.test(uitlees.t)) r8Status.push('✅ PUNT 8b (Lidl 28701): de naamloze Lidl Plus-korting (-0,70) staat als persoonlijke korting apart, niet automatisch gekoppeld.');
    else r8Status.push('⚠️ PUNT 8b (Lidl 28701): de naamloze Lidl Plus-korting (-0,70) is niet als aparte persoonlijke korting herkenbaar.');
  }, '#scbody');

  await stap(pagina, 'R8: Jumbo-bon 28704 — ACTIE-regel koppelt op naam, Totaal korting als controle (PUNT 8c)', async () => {
    const uitlees = await r8VoerIn({ gelukt: true, reden: '', bon: [
      r8Prod('MELK HV 1 L', 0.85),
      r8Prod('REEZE ROZIJNENBOLLEN', 2.25),
      r8Prod('ACTIE ROZIJNENBOLLEN', -1.26, { korting_tekst: 'ACTIE ROZIJNENBOLLEN -1,26', kcal: null, eiwit: null, suikers: null, verzadigd: null, zout: null, vezels: null })
    ] });
    if (/verwerkt bij het product/.test(uitlees.t)) r8Status.push('✅ PUNT 8c (Jumbo 28704): de ACTIE-regel (-1,26) is op naam aan de rozijnenbollen gekoppeld (Totaal korting 1,26 als som-controle).');
    else r8Status.push('⚠️ PUNT 8c (Jumbo 28704): de ACTIE-regel (-1,26) is niet als korting aan het product gekoppeld — P = markeertje, geen bedrag; de korting hoort bij de HELE productregel.');
    r8Status.push('R8 Jumbo 28704 — bonusprijs-velden: [' + (uitlees.velden.join(' | ') || 'geen') + '].');
  }, '#scbody');

  await stap(pagina, 'R8: opruimen + hoofdregel-check (een negatief bedrag is een korting, geen product)', async () => {
    await pagina.evaluate(() => { const n = document.querySelector('#scbody button[data-act="scnone"]'); if (n) n.click(); });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const c = document.querySelector('#scsheet button[data-act="scclose"]'); if (c) c.click(); });
    await pagina.waitForTimeout(300);
    await pagina.unroute('**/api.mistral.ai/**');
    r8Ant = null;
    let r8Hoofd = bonRegel === true;
    try { const bron = await pagina.content(); if (/negatief bedrag is een korting, geen product/i.test(bron)) r8Hoofd = true; } catch (e) { /* bonRegel geldt */ }
    if (r8Hoofd) r8Status.push('✅ PUNT 8-hoofdregel: de leesregel staat in de code (een negatief bedrag is een korting, geen product).');
    else r8Status.push('⚠️ PUNT 8-hoofdregel: de leesregel (een negatief bedrag is een korting, geen product) staat nog niet in de code.');
    r8Status.push('R8: Ronde 8 draaide volledig met een nagebootste Mistral (0 echte aanroepen) en de échte bonregels van de foto’s 28700-28707. De som-controles met UW VOORDEEL / Totaal korting (PUNT 8f: AH 7,07 - 0,09 = 6,98; AH-BB 6,97 - 0,45 = 6,52; Jumbo 14,08 met Totaal korting 1,26) loop je het beste met de hand na na de app-bouw.');
  }, '#scbody');


  // ===================== v58.4 (14 nov 19u18, fix-ronde) =====================
  await stap(pagina, 'v58.4: APP.gem geladen op de startpagina — model uit localStorage, standaard mistral-medium-latest', async () => {
    const r = await pagina.evaluate(() => {
      if (!window.APP || !APP.gem || typeof APP.gem.post !== 'function' || typeof APP.gem.model !== 'function') return 'APP.gem ontbreekt op deze pagina';
      if (document.getElementById('model')) return 'onverwachte #model op deze pagina';
      var m = APP.gem.model();
      return m === 'mistral-medium-latest' ? true : 'model=' + m;
    });
    if (r !== true) throw new Error(String(r));
  });
  await stap(pagina, 'v58.4: kookmodus — augurken-ingrediënt bij de blokjes-stap, niet bij de augurkenvocht-stap', async () => {
    await pagina.evaluate(() => {
      var S = APP.S;
      if (!S.recipes.some(function (r) { return r.id === 'botaugurk'; })) {
        S.recipes.push({ id: 'botaugurk', name: 'Bot Augurkensalade', unit: null, fixed: null, where: ['lunch'], ing: [
          { n: 'Zoetzure augurken in blokjes', a: 2, u: 'stuk', p: 'botaug1' },
          { n: 'Augurkenvocht', a: 1, u: 'tl', p: 'botaug2' }
        ], steps: 'Snijd de augurken in kleine blokjes en roer ze erdoor.\nVoeg als laatste het augurkenvocht toe.\nTip: lekker met ei.' });
        APP.persist();
      }
    });
    await pagina.waitForTimeout(300);
    await pagina.tap('#tabrec', { timeout: 8000 }).catch(function () {});
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const el = document.querySelector('#recview .rcard[data-rk$="botaugurk"] button[data-act="cook"]'); if (!el) throw new Error('knop niet gevonden: cook op botaugurk-kaartje'); el.click(); });
    await pagina.waitForTimeout(400);
    const scr = await pagina.evaluate(() => { var C = APP.S.cook; return C ? C.scr.map(function (s) { return (s.txt || '') + '||' + (s.ing || []).join(', '); }) : null; });
    if (!scr) throw new Error('kookmodus opende niet');
    const vocht = scr.filter(function (s) { return /augurkenvocht/i.test(s.split('||')[0]); })[0];
    const blok = scr.filter(function (s) { return /augurken in blokjes/i.test(s.split('||')[0]); })[0];
    if (!vocht || !blok) throw new Error('stappen niet gevonden: ' + scr.join(' / '));
    if (/augurken(?!vocht)/i.test(vocht.split('||')[1] || '')) throw new Error('augurken staat óók bij de augurkenvocht-stap: ' + vocht);
    if (!/augurken/i.test(blok.split('||')[1] || '')) throw new Error('augurken staat niet bij de blokjes-stap: ' + blok);
    await pagina.evaluate(() => { const el = document.querySelector('#cookbody button[data-act="cookclose"]'); if (el) el.click(); });
    await pagina.waitForTimeout(300);
  });
  await stap(pagina, 'v58.4: bron-checks — PUUR_STRENG sap/moes/jam, kcalFor eigen woord, pasteSave dubbel geweerd, APP.gem-blok, contrast-kleuren', async () => {
    const them = fs.readFileSync(path.join(APPTEST[0] || path.join(__dirname, '..', 'app-test'), 'js', '15-start-en-thema.js'), 'utf8');
    const m = them.match(/PUUR_STRENG = (\/[^;]+;)/);
    if (!m || !/sap/.test(m[1]) || !/moes/.test(m[1]) || !/jam/.test(m[1])) throw new Error('PUUR_STRENG zonder sap/moes/jam');
    if (!/recNaamBestaat\(rec\.name, S\.recipes\)/.test(them)) throw new Error('pasteSave checkt geen dubbele naam');
    const kc = fs.readFileSync(path.join(APPTEST[0] || path.join(__dirname, '..', 'app-test'), 'js', '16-mistral-sleutel.js'), 'utf8');
    if (!/antlU && uu === antlU/.test(kc)) throw new Error('kcalFor zonder eigen-woord-branch');
    const s17 = fs.readFileSync(path.join(APPTEST[0] || path.join(__dirname, '..', 'app-test'), 'js', '17-snel-invullen.js'), 'utf8');
    if (!/if \(!APP\.gem\)/.test(s17)) throw new Error('APP.gem all-pages blok ontbreekt');
    const css = fs.readFileSync(path.join(APPTEST[0] || path.join(__dirname, '..', 'app-test'), 'style.css'), 'utf8');
    for (const hex of ['#675E53', '#556459', '#A04638', '#C79A7E']) if (css.indexOf(hex) < 0) throw new Error('contrast-kleur ontbreekt in style.css: ' + hex);
  });

  // ===================== v58.5 (14 nov 19u50, test-only: boodschappen-tab + AI-supermarktenfilter) =====================
  await stap(pagina, 'v58.5: .bottomnav heeft 6 SVG-tabjes, per pagina één active, boodschappen.html aanwezig', async () => {
    for (const map of ['app-test', 'app'].filter(m => fs.existsSync(path.join(__dirname, '..', m)))) {
    const at = path.join(__dirname, '..', map);
    for (const pg of ['index.html', 'recepten.html', 'producten.html', 'kookhulp.html', 'instellingen.html', 'boodschappen.html']) {
      const src = fs.readFileSync(path.join(at, pg), 'utf8');
      const nv = (src.match(/<nav class="bottomnav">[\s\S]*?<\/nav>/) || [''])[0];
      if ((nv.match(/<svg /g) || []).length !== 6) throw new Error(pg + ': geen 6 svg-tabjes in de balk');
      if ((nv.match(/<a href=/g) || []).length !== 6) throw new Error(pg + ': geen 6 links in de balk');
      if ((nv.match(/class="active"/g) || []).length !== 1) throw new Error(pg + ': niet precies één active tab');
      if ((nv.match(/aria-label=/g) || []).length !== 6) throw new Error(pg + ': niet elk tabje heeft een aria-label');
    }
    const bo = fs.readFileSync(path.join(at, 'boodschappen.html'), 'utf8');
    if (!/Boodschappen<\/h2>/.test(bo)) throw new Error('boodschappen.html: geen kop Boodschappen');
    const css = fs.readFileSync(path.join(at, 'style.css'), 'utf8');
    if (!/\.bottomnav a svg \{[\s\S]*?width: 24px;/.test(css)) throw new Error('style.css: nieuwe bottomnav-CSS (24px svg) ontbreekt');
    if (!/position: sticky;[\s\S]{0,200}?top: 0;/.test(css)) throw new Error('style.css: sticky top:0 van .bottomnav fehlt');
    if (/\.bottomnav a\.gear/.test(css)) throw new Error(map + ' style.css: oude .gear-regel nog aanwezig');
    }
  });
  await stap(pagina, 'v58.5/v58.6: app-test én app losse pagina\'s laden zonder JS-fouten (incl. boodschappen.html)', async () => {
    const basis = url.replace(/\/(tests|backup|app-test|opdeling-test)\/.*$/, '');
    for (const map of ['app-test', 'app'].filter(m => fs.existsSync(path.join(__dirname, '..', m)))) for (const pg of ['index.html', 'recepten.html', 'producten.html', 'kookhulp.html', 'instellingen.html', 'boodschappen.html']) {
      const pgFouten = [];
      const peh = e => pgFouten.push('PAGEERROR: ' + String(e).slice(0, 200));
      const ceh = m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) pgFouten.push('CONSOLE: ' + m.text().slice(0, 200)); };
      pagina.on('pageerror', peh); pagina.on('console', ceh);
      try {
        await pagina.goto(basis + '/' + map + '/' + pg, { waitUntil: 'load' });
        await pagina.waitForTimeout(700);
      } finally { pagina.off('pageerror', peh); pagina.off('console', ceh); }
      if (pgFouten.length) throw new Error(map + '/' + pg + ': ' + pgFouten.join(' | '));
    }
  });
  // ===================== v58.6 (14 nov 20u15: kop eerst + SVG-tabbalk in single én echte app) =====================
  await stap(pagina, 'v58.6: single .tabs = 6 SVG-knoppen zonder tekst; .titlerij staat vóór .tabs in .top', async () => {
    const n = await pagina.locator('.tabs .tab').count();
    if (n !== 6) throw new Error('.tabs heeft ' + n + ' knoppen, geen 6');
    const svgs = await pagina.locator('.tabs .tab svg').count();
    if (svgs !== 6) throw new Error('.tabs heeft ' + svgs + ' svg-icoontjes, geen 6');
    const teksten = await pagina.$$eval('.tabs .tab', els => els.map(e => (e.textContent || '').trim()));
    if (teksten.some(t => t.length > 0)) throw new Error('tab-knoppen bevatten nog tekst: ' + teksten.join(','));
    const ids = await pagina.$$eval('.tabs .tab', els => els.map(e => e.id));
    for (const id of ['tabweek', 'tabrec', 'tabprijs', 'tabgem', 'tabinst', 'tabbo']) {
      if (ids.indexOf(id) < 0) throw new Error('tab-id ontbreekt in single: ' + id);
    }
    const kopVoorTabs = await pagina.evaluate(() => {
      const top = document.querySelector('.top');
      const ti = top && top.querySelector('.titlerij');
      const tb = top && top.querySelector('.tabs');
      return !!(ti && tb && (ti.compareDocumentPosition(tb) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    if (!kopVoorTabs) throw new Error('in .top staat .tabs niet ná .titlerij (kop eerst)');
    const bo = await pagina.$('#tabbo');
    if (!bo) throw new Error('geen #tabbo in de single');
    await pagina.tap('#tabbo', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const pressed = await pagina.getAttribute('#tabbo', 'aria-pressed');
    if (pressed !== 'true') throw new Error('tabbo aria-pressed=' + pressed + ' na tik');
    const boZichtbaar = await pagina.evaluate(() => { const b = document.getElementById('boview'); return b && !b.hidden; });
    if (!boZichtbaar) throw new Error('#boview bleef verborgen na tik op #tabbo');
    const kop = await pagina.textContent('#boview h2').catch(() => '');
    if (!/Boodschappen/i.test(kop || '')) throw new Error('geen kop Boodschappen in #boview: ' + kop);
    await pagina.tap('#tabweek', { timeout: 8000 });
  });
  // ===================== v58.7 (14 nov 20u26: kiesmenu weg uit Voorbereiden-blok; \u{1F9FA} op kaartje opent direct de afvinklijst) =====================
  await stap(pagina, 'v58.7: Voorbereiden-blok zonder recepten-kiezer; los open alleen de tekstregel', async () => {
    const sel = await pagina.$('#khGroepVoorbereiden select');
    if (sel) throw new Error('#khGroepVoorbereiden bevat nog een select');
    const txt = (await pagina.textContent('#vrWelk').catch(() => '')) || '';
    if (!/Open een recept bij Recepten en tik op . Voorbereiden om de ingredi\u00ebnten klaar te leggen/i.test(txt.replace(/\s+/g, ' '))) throw new Error('#vrWelk tekst klopt niet: ' + txt);
    await pagina.tap('#tabgem', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const k = document.getElementById('khGroepVoorbereiden'); if (k) k.open = true; if (window.APP) APP.S.vrRec = ''; if (window.vrRender) window.vrRender(); });
    await pagina.waitForTimeout(300);
    const los = await pagina.evaluate(() => {
      const k = document.getElementById('khGroepVoorbereiden');
      return { open: !!(k && k.open), select: !!k.querySelector('select'), rows: document.querySelectorAll('#vrLijst .vrrow').length, welk: !document.getElementById('vrWelk').hidden };
    });
    if (!los.open) throw new Error('Voorbereiden-blok ging niet open');
    if (los.select) throw new Error('blok bevat nog een select');
    if (los.rows !== 0) throw new Error('zonder gekozen recept toch rijen in #vrLijst: ' + los.rows);
    if (!los.welk) throw new Error('#vrWelk verborgen terwijl er geen recept gekozen is');
  });
  await stap(pagina, 'v58.7: \u{1F9FA} Voorbereiden op een kaartje opent direct de afvinklijst van dat recept', async () => {
    await pagina.tap('#tabrec', { timeout: 8000 });
    await pagina.waitForTimeout(500);
    await pagina.evaluate(() => { const c = document.querySelector('#recview details.rcard'); if (!c) throw new Error('geen kaartje'); if (!c.open) c.querySelector('summary').click(); });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => { const b = document.querySelector('#recview details.rcard button[data-act="recprep"]'); if (!b) throw new Error('geen recprep-knop in open kaartje'); b.click(); });
    await pagina.waitForTimeout(500);
    const st = await pagina.evaluate(() => ({
      tab: window.APP && APP.S ? APP.S.tab : '?',
      rows: document.querySelectorAll('#vrLijst .vrrow').length,
      kop: (document.querySelector('#vrLijst b') || { textContent: '' }).textContent,
      blokOpen: document.getElementById('khGroepVoorbereiden').open,
      sel: !!document.getElementById('kiesReceptVoorbereiden')
    }));
    if (st.tab !== 'gem') throw new Error('na recprep niet op Kookhulp-tab: ' + st.tab);
    if (!st.blokOpen) throw new Error('Voorbereiden-blok niet open na recprep');
    if (st.rows < 1) throw new Error('geen afvink-rijen in #vrLijst na recprep');
    if (!st.kop) throw new Error('geen receptnaam boven de afvinklijst');
    if (st.sel) throw new Error('kiesReceptVoorbereiden bestaat nog in de DOM');
  }, '#recview details.rcard');
  // ===================== v58.8 (14 nov 20u30, test-only: eigen testen-pagina testen.html + footer-link, per-deel groepering, vinkjes per dag) =====================
  await stap(pagina, 'v58.8: \u{1F9EA} Testen via footer (tabbalk houdt 6 knoppen); testpagina opent met testmenu + terugknop; Instellingen zonder testblok', async () => {
    const tabs = await pagina.locator('.tabs .tab').count();
    if (tabs !== 6) throw new Error('.tabs heeft ' + tabs + ' knoppen, geen 6 — Testen mag niet in de tabbalk');
    const ft = await pagina.$('.appfoot [data-t="test"]');
    if (!ft) throw new Error('geen \u{1F9EA} Testen-knop in de footer (.appfoot)');
    await ft.tap({ timeout: 8000 });
    await pagina.waitForTimeout(400);
    const st = await pagina.evaluate(() => ({
      tab: window.APP && APP.S ? APP.S.tab : '?',
      tvZichtbaar: !!(document.getElementById('testview') && !document.getElementById('testview').hidden),
      versRijen: document.querySelectorAll('#verslijst .testitem').length,
      deelKopjes: [...document.querySelectorAll('#verslijst details.per summary')].map(s => (s.textContent || '').trim()),
      testenblokInInst: !!document.querySelector('#instview #testenblok'),
      terug: !!document.querySelector('#testview [data-act="testterug"]'),
      balkCss: /#testbalk \{[\s\S]*?right: 8px;[\s\S]*?max-width: 260px;/.test(document.querySelector('style') ? '' : '') || true
    }));
    if (st.tab !== 'test') throw new Error('footer-tik zette S.tab niet op test: ' + st.tab);
    if (!st.tvZichtbaar) throw new Error('#testview bleef verborgen na footer-tik');
    if (st.versRijen < 1) throw new Error('geen testpunten in #verslijst');
    if (!st.deelKopjes.some(t => /Deel 1/.test(t))) throw new Error('geen per-deel kopje in Nieuw in deze versie: ' + st.deelKopjes.join(' | '));
    if (st.testenblokInInst) throw new Error('#testenblok zit nog in #instview (Instellingen)');
    if (!st.terug) throw new Error('geen terugknop op de testpagina');
    await pagina.tap('#testview [data-act="testterug"]', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const tab2 = await pagina.evaluate(() => window.APP && APP.S ? APP.S.tab : '?');
    if (tab2 !== 'week') throw new Error('terugknop ging niet naar week: ' + tab2);
  });
  // ===================== v58.9 (14 nov 20u55, test-only: strakke testpagina — 23 punten in 5 delen, 14 checks in 4 groepen, kaartjes, dag-sleutel, ideetjes 1-4) =====================
  await stap(pagina, 'v58.9: testpagina strak — 3 secties direct in #testview, 5 deel-blokjes (x/y) in de kop, 4 vol-groepen, kaartjes zonder nummers, footer verborgen op test-tab, samenvatting bovenaan', async () => {
    await pagina.tap('.appfoot [data-t="test"]', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const st = await pagina.evaluate(() => {
      const tv = document.getElementById('testview');
      const foot = document.querySelector('.appfoot');
      return {
        direct: tv ? tv.querySelectorAll(':scope > details.per').length : -1,
        testenblok: !!(tv && tv.querySelector('details#testenblok')),
        footerHidden: foot ? foot.hidden : null,
        deelBlokken: [...document.querySelectorAll('#verslijst > details.per > summary')].map(s => (s.textContent || '').replace(/\s+/g, ' ').trim()),
        volGroepen: [...document.querySelectorAll('#vollijst > details.per > summary')].map(s => (s.textContent || '').replace(/\s+/g, ' ').trim()),
        items: document.querySelectorAll('#verslijst .testitem').length,
        volItems: document.querySelectorAll('#vollijst .testitem').length,
        nummers: document.querySelectorAll('#verslijst .tnum, #vollijst .tnum').length,
        testdag: (document.getElementById('testdag') || { textContent: '' }).textContent,
        eerstOpen: !!document.querySelector('[data-act="testeerstopen"]')
      };
    });
    if (st.direct !== 3) throw new Error('#testview heeft ' + st.direct + ' direct kind-details, geen 3 (geen buitenste 🧪 Testen ^)');
    if (st.testenblok) throw new Error('buitenste testenblok-wrapper nog aanwezig');
    if (st.footerHidden !== true) throw new Error('footer niet verborgen op de test-tab');
    if (st.deelBlokken.length !== 5) throw new Error('geen 5 deel-blokjes: ' + st.deelBlokken.join(' | '));
    if (!/Deel 1 · v58\.0–v58\.3 \(\d+\/\d+\)/.test(st.deelBlokken[0] || '')) throw new Error('deel 1 kop klopt niet: ' + (st.deelBlokken[0] || ''));
    if (!/Deel 5 · v58\.7–v58\.9/.test(st.deelBlokken[4] || '')) throw new Error('deel 5 kop klopt niet: ' + (st.deelBlokken[4] || ''));
    if (st.volGroepen.length !== 4) throw new Error('geen 4 vol-groepen: ' + st.volGroepen.join(' | '));
    if (st.items !== 23) throw new Error('verslijst heeft ' + st.items + ' punten, geen 23');
    if (st.volItems !== 14) throw new Error('vollijst heeft ' + st.volItems + ' punten, geen 14');
    if (st.nummers !== 0) throw new Error('nog voorloopnummers (.tnum) in de lijsten: ' + st.nummers);
    if (!/v58\.9 · 5 delen · 23 punten · 0 van 23 nagekeken/.test(st.testdag)) throw new Error('testdag-samenvatting klopt niet: ' + st.testdag);
    if (!st.eerstOpen) throw new Error('geen ▶ Eerste open punt-knop');
    // accordion: twee deel-blokjes openzetten -> alleen de laatste blijft open
    await pagina.evaluate(() => { const d1 = document.getElementById('deelK1'), d2 = document.getElementById('deelK2'); if (d1) d1.open = true; if (d2) d2.open = true; });
    await pagina.waitForTimeout(200);
    const acc = await pagina.evaluate(() => ({ k1: document.getElementById('deelK1').open, k2: document.getElementById('deelK2').open }));
    if (!(acc.k2 && !acc.k1)) throw new Error('accordion werkt niet: deelK1=' + acc.k1 + ' deelK2=' + acc.k2);
    // idee 4: ▶ Eerste open punt opent het balkje met deel in de kop (idee 2)
    await pagina.tap('[data-act="testeerstopen"]', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const balk = await pagina.evaluate(() => { const b = document.getElementById('testbalk'); return { hidden: b.hidden, kop: (document.getElementById('tbkop') || { textContent: '' }).textContent }; });
    if (balk.hidden) throw new Error('testbalk ging niet open na ▶ Eerste open punt');
    if (!/Deel 1 · v58\.0–v58\.3/.test(balk.kop)) throw new Error('tbkop toont geen deel-range: ' + balk.kop);
    await pagina.evaluate(() => { const b = document.getElementById('testbalk'); if (b) b.hidden = true; });
    await pagina.tap('#testview [data-act="testterug"]', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const tab3 = await pagina.evaluate(() => window.APP && APP.S ? APP.S.tab : '?');
    if (tab3 !== 'week') throw new Error('terugknop ging niet naar week: ' + tab3);
    const foot2 = await pagina.evaluate(() => { const f = document.querySelector('.appfoot'); return f ? f.hidden : null; });
    if (foot2 !== false) throw new Error('footer bleef verborgen ná terug naar week');
  });
  await stap(pagina, 'v58.5: Mistral-prompt stuurt supermarkten-filter (S.supers) mee + bron-URL regel', async () => {
    const s17 = fs.readFileSync(path.join(APPTEST[0] || path.join(__dirname, '..', 'app-test'), 'js', '17-snel-invullen.js'), 'utf8');
    if (!/superLijst/.test(s17) || !/Gebruik NOOIT een supermarkt buiten deze lijst/.test(s17)) throw new Error('supermarkten-filter ontbreekt in mistralProductZoek');
    if (!/nooit een verzonnen link/.test(s17)) throw new Error('bron-URL regel ontbreekt in mistralProductZoek');
  });

  await stap(pagina, 'Losse pagina\u2019s van de opdeling (versies/opdeling-test) laden zonder JS-fouten', async () => {
    const od = path.join(__dirname, '..', 'versies', 'opdeling-test');
    if (!fs.existsSync(path.join(od, 'index.html'))) return; // map niet aanwezig: netjes overslaan
    const basis2 = url.replace(/\/(tests|backup|app-test|opdeling-test)\/.*$/, '');
    for (const pg of ['index.html', 'recepten.html', 'producten.html', 'kookhulp.html', 'instellingen.html', 'boodschappen.html']) {
      const pf = [];
      const peh = e => pf.push('PAGEERROR: ' + String(e).slice(0, 200));
      const ceh = m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) pf.push('CONSOLE: ' + m.text().slice(0, 200)); };
      pagina.on('pageerror', peh); pagina.on('console', ceh);
      try {
        await pagina.goto(basis2 + '/versies/opdeling-test/' + pg, { waitUntil: 'load' });
        await pagina.waitForTimeout(700);
      } finally { pagina.off('pageerror', peh); pagina.off('console', ceh); }
      if (pf.length) throw new Error('opdeling-test/' + pg + ': ' + pf.join(' | '));
    }
  });

const okCount = stappen.filter(s => s.ok).length;
  let md = '# Kliktest-rapport\n\n';
  md += '**' + okCount + ' van ' + stappen.length + ' stappen gelukt, ' + fouten.length + ' JavaScript-fouten.** ';
  md += (okCount === stappen.length && !fouten.length) ? 'Alles groen \u{1F389}' : 'Er is iets mis — lees hieronder';
  md += '\n\n**Getest:** ' + url.split('/').pop() + '\n**Moment:** ' + nlTijd() + ' (Nederlandse tijd)' + '\n\n';
  md += '| Stap | Resultaat | Melding |\n|---|---|---|\n';
  for (const s of stappen) md += '| ' + s.omschrijving + ' | ' + (s.ok ? '✅' : '❌') + ' | ' + (s.fout ? s.fout.replace(/\n/g, ' ') : '') + ' |\n';
  md += '\n## JavaScript-fouten (' + fouten.length + ')\n\n';
  md += fouten.length ? fouten.map(f => '- ' + f).join('\n') + '\n' : 'Geen \u{1F389}\n';
  md += '\n## PUNT 8: bon-korting per supermarkt (12 nov, echte bonnen 28700-28707)\n\n';
  r8Status.forEach(function (s) { md += '- ' + s + '\n'; });
  if (!r8Status.length) md += '- Ronde 8 (PUNT 8) is niet gedraaid in deze run.\n';
  md += '\n### Hoofdregel\n\n';
  md += bonRegel === true
    ? '\u2705 De bon-leesregel over korting is aanwezig (regel: \"een negatief bedrag is een korting, geen product\").\n'
    : '\u26a0\u00ef\u00b8 Nog \u00e9\u00e9n bekent punt: korting-regels op een kassabon (bijv. OPTIMELDRINK -3,98) kunnen nog als apart product met minprijs binnenkomen. Fix-plan voor Vibe Code ligt klaar; deze regel wordt groen zodra de leesregel toegevoegd is.\n';
    if (notities.length) { md += '\n## Overgeslagen controles\n\n'; notities.forEach(function (n) { md += '- \u26a0\u00ef\u00b8 ' + n + '\n'; }); }
fs.writeFileSync(path.join(outDir, 'rapport.md'), md);
  console.log('Klaar: ' + (stappen.length - okCount) + ' van ' + stappen.length + ' stappen mislukt, ' + fouten.length + ' JS-fouten.');
  await browser.close();
  clearTimeout(watchdog);
  process.exit(stappen.some(s => !s.ok) || fouten.length ? 1 : 0);
})();



