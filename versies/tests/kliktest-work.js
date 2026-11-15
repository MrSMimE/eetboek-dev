// Kliktest-work voor MrSMimE/eetboek-dev — test ALLÉÉN de werk-set, ZONDER AI/Mistral-stuff.
// v2 (15 nov 2026, wens van de gebruiker): geen echte kliktest.js als kindje (die bevat
//   AI-rondes), maar de volledige kern-ronde zelf + Ronde W met alle nieuwe aanpassingen.
// Kern-ronde (zelfde dekking als kliktest-dev, nu op de werk-app):
//   tabbalk 6 SVG-tabjes, alle tabs, recept-kaartje dicht/open + ⋮-menu, Voorbereiden-blok,
//   Producten-zoekbalk + Nieuw product, Instellingen zonder testblok, 3 thema's, breedte.
// Ronde W (nieuwe aanpassingen): v58.10 Regels-werkpagina + aparte opslag, v59.0 rustige
//   testpagina + permanente vinkjes + Archief + ↺ weer open + Regels-kaartje permanent.
// De echte index.html wordt nooit gewijzigd. Gebruik: node versies/tests/kliktest-work.js
// CI: .github/workflows/kliktest-work.yml
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..', '..'); // repo-root (script woont in versies/tests/)
const RAPPORT_DIR = path.join(__dirname, 'rapport-laatste-work');
const POORT = parseInt(process.env.POORT || '8139', 10);
const WERK = 'index-zelftest-work.html';
const REGELS = 'regels-zelftest-work.html';

const stappen = [];
const fouten = [];
async function stap(pagina, naam, fn, wachtOp) {
  try {
    if (wachtOp) await pagina.waitForSelector(wachtOp, { timeout: 9000 }).catch(() => {});
    await fn();
    stappen.push({ naam, ok: true });
    console.log('OK  ' + naam);
  } catch (e) {
    stappen.push({ naam, ok: false, fout: String(e && e.message || e) });
    fouten.push(naam + ': ' + (e && e.message || e));
    console.log('FOUT ' + naam + ' — ' + (e && e.message || e));
  }
}
function nlTijd() {
  try { return new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch (e) { return new Date().toISOString().slice(0, 16); }
}
function serve(dir) {
  const srv = http.createServer((q, s) => {
    let d = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
    if (fs.existsSync(d) && fs.statSync(d).isDirectory()) d = path.join(d, 'index.html');
    fs.readFile(d, (e, b) => { if (e) { s.statusCode = 404; s.end('404'); } else { s.end(b); } });
  });
  return new Promise(res => srv.listen(POORT, () => res(srv)));
}

(async () => {
  // ---------- 0. werk-set compleet? ----------
  for (const f of [WERK, REGELS, 'index.html', path.join('app-test-work', 'regels.html')]) {
    if (!fs.existsSync(path.join(ROOT, f))) { console.error('STORING: werk-set incompleet, mist ' + f); process.exit(1); }
  }
  const { chromium } = require('playwright');
  const srv = await serve(ROOT);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const pagina = await ctx.newPage();
  const pageFouten = [];
  pagina.on('pageerror', e => pageFouten.push('PAGEERROR: ' + String(e).slice(0, 200)));
  pagina.on('console', m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) pageFouten.push('CONSOLE: ' + m.text().slice(0, 200)); });
  const base = 'http://localhost:' + POORT + '/';

  // ===================== KERN-RONDE (geen AI) =====================
  await stap(pagina, 'Werk-app laadt zonder JS-fouten; VERSION v59.0; TESTVERSIE aan (aparte opslag)', async () => {
    await pagina.goto(base + WERK + '#testen', { waitUntil: 'load' });
    await pagina.waitForTimeout(1800);
    if (pageFouten.length) throw new Error(pageFouten.join(' | '));
    const st = await pagina.evaluate(() => ({
      v: (typeof VERSION === 'undefined') ? '' : String(VERSION),
      testversie: (typeof TESTVERSIE === 'undefined') ? null : !!TESTVERSIE
    }));
    if (!/v59\.0/.test(st.v)) throw new Error('VERSION = ' + st.v);
    if (!st.testversie) throw new Error('TESTVERSIE staat niet aan — geen aparte opslag!');
  }, 'body');

  await stap(pagina, '#testen opent meteen het Testen-tab', async () => {
    const zicht = await pagina.evaluate(() => { const t = document.getElementById('testview'); return !!(t && !t.hidden); });
    if (!zicht) { const b = document.getElementById('tabtest'); if (b) await b.click(); await pagina.waitForTimeout(600); }
    const nuzicht = await pagina.evaluate(() => { const t = document.getElementById('testview'); return !!(t && !t.hidden); });
    if (!nuzicht) throw new Error('#testview blijft verborgen');
  });

  await stap(pagina, 'Tabbalk: 6 SVG-icoon-knoppen zonder tekst; kop (.titlerij) vóór .tabs', async () => {
    const n = await pagina.locator('.tabs .tab').count();
    if (n !== 6) throw new Error('.tabs heeft ' + n + ' knoppen, geen 6');
    const svgs = await pagina.locator('.tabs .tab svg').count();
    if (svgs !== 6) throw new Error(svgs + ' svg-icoontjes, geen 6');
    const teksten = await pagina.$$eval('.tabs .tab', els => els.map(e => (e.textContent || '').trim()));
    if (teksten.some(t => t.length > 0)) throw new Error('tab-knoppen bevatten tekst');
    const kopEerst = await pagina.evaluate(() => {
      const top = document.querySelector('.top');
      const ti = top && top.querySelector('.titlerij');
      const tb = top && top.querySelector('.tabs');
      return !!(ti && tb && (ti.compareDocumentPosition(tb) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    if (!kopEerst) throw new Error('.tabs staat niet ná .titlerij');
  });

  await stap(pagina, 'Alle 6 tabs tikken → aria-pressed', async () => {
    for (const id of ['tabweek', 'tabrec', 'tabprijs', 'tabgem', 'tabbo', 'tabinst']) {
      await pagina.tap('#' + id, { timeout: 8000 });
      await pagina.waitForTimeout(250);
      const p = await pagina.getAttribute('#' + id, 'aria-pressed');
      if (p !== 'true') throw new Error(id + ' aria-pressed=' + p);
    }
    const kop = await pagina.textContent('#boview h2').catch(() => '');
    if (!/Boodschappen/i.test(kop || '')) throw new Error('#boview h2 = ' + kop);
  });

  await stap(pagina, 'Recepten: kaartje dicht (alleen naam), open → kernregel + 3 knoppen + ⋮ met 4 acties', async () => {
    await pagina.tap('#tabrec', { timeout: 8000 });
    await pagina.waitForTimeout(500);
    const dicht = await pagina.evaluate(() => {
      const c = document.querySelector('#recview details.rcard');
      if (!c) throw new Error('geen details.rcard');
      return { tag: c.tagName, sum: (c.querySelector('summary.rname') || { textContent: '' }).textContent.trim() };
    });
    if (dicht.tag !== 'DETAILS') throw new Error('geen details: ' + dicht.tag);
    if (/kcal|⋮/.test(dicht.sum)) throw new Error('summary toont meer dan de naam: ' + dicht.sum);
    await pagina.evaluate(() => { const c = document.querySelector('#recview details.rcard'); c.querySelector('summary').click(); });
    await pagina.waitForTimeout(400);
    const open = await pagina.evaluate(() => {
      const c = document.querySelector('#recview details.rcard');
      return { tekst: c.textContent, knoppen: [...c.querySelectorAll('button')].map(b => b.getAttribute('data-act')) };
    });
    if (!/± \d+ kcal/.test(open.tekst)) throw new Error('geen kernregel in open kaartje');
    for (const a of ['cook', 'recprep', 'reccopy', 'recmenu']) if (open.knoppen.indexOf(a) < 0) throw new Error('knop ontbreekt: ' + a);
    await pagina.evaluate(() => { document.querySelector('#recview details.rcard button[data-act="recmenu"]').click(); });
    await pagina.waitForTimeout(300);
    const menu = await pagina.evaluate(() => {
      const c = document.querySelector('#recview details.rcard');
      return [...c.querySelectorAll('.rcmenu [data-act]')].map(b => b.getAttribute('data-act'));
    });
    const verwacht = ['recedit', 'recgem', 'emo', 'recdel'];
    for (const a of verwacht) if (menu.indexOf(a) < 0) throw new Error('⋮-menu mist: ' + a + ' in ' + menu.join(','));
    if (menu.length !== 4) throw new Error('⋮-menu heeft ' + menu.length + ' opties, geen 4');
  });

  await stap(pagina, '⋮-menu direct dicht na Bewerken (bewerk-scherm open en weer netjes dicht)', async () => {
    await pagina.evaluate(() => { document.querySelector('#recview details.rcard .rcmenu [data-act="recedit"]').click(); });
    await pagina.waitForTimeout(600);
    const n = await pagina.locator('#recview .rcmenu').count();
    if (n !== 0) throw new Error('⋮-menu bleef open na Bewerken');
    const sheet = await pagina.evaluate(() => { const s = document.getElementById('recsheet'); return s && !s.hidden; });
    if (!sheet) throw new Error('recsheet bleef dicht');
    await pagina.evaluate(() => { const b = document.querySelector('#recsheet [data-act="recclose"]'); if (b) b.click(); });
  });

  await stap(pagina, 'Kookhulp: Voorbereiden-blok zonder recepten-kiezer, met rustige tekstregel', async () => {
    await pagina.tap('#tabgem', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const k = document.getElementById('khGroepVoorbereiden'); if (k) k.open = true; });
    await pagina.waitForTimeout(200);
    const st = await pagina.evaluate(() => ({
      select: !!document.querySelector('#khGroepVoorbereiden select'),
      welk: !(document.getElementById('vrWelk') || { hidden: true }).hidden,
      tekst: (document.getElementById('vrWelk') || { textContent: '' }).textContent
    }));
    if (st.select) throw new Error('Voorbereiden-blok bevat nog een select');
    if (!st.welk) throw new Error('#vrWelk verborgen');
    if (!/Open een recept bij Recepten en tik op . Voorbereiden om de ingrediënten klaar te leggen/i.test(st.tekst.replace(/\s+/g, ' '))) throw new Error('tekstregel klopt niet: ' + st.tekst);
  });

  await stap(pagina, 'Producten: zoekbalk filtert + Nieuw product opent popup bovenin', async () => {
    await pagina.tap('#tabprijs', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    await pagina.fill('#prodzoek', 'kwark');
    await pagina.waitForTimeout(300);
    const n = await pagina.locator('#prijsview .prod2, #prijsview details').count();
    if (n < 1) throw new Error('zoekbalk gaf geen resultaten');
    await pagina.evaluate(() => { const b = document.querySelector('button[data-act="prodnew"]'); if (!b) throw new Error('geen Nieuw product-knop'); b.click(); });
    await pagina.waitForTimeout(400);
    const open = await pagina.evaluate(() => { const s = document.getElementById('prodsheet'); return s && !s.hidden; });
    if (!open) throw new Error('prodsheet bleef dicht');
    await pagina.evaluate(() => { document.querySelectorAll('.sheet:not([hidden])').forEach(sh => { const c = sh.querySelector('[data-act$="close"]'); if (c) c.click(); }); });
  });

  await stap(pagina, 'Instellingen: geen testblok; 3 thema-knoppen; donker thema werkt', async () => {
    await pagina.tap('#tabinst', { timeout: 8000 });
    await pagina.waitForTimeout(400);
    const tb = await pagina.$('#instview #testenblok');
    if (tb) throw new Error('testblok in Instellingen');
    const th = await pagina.locator('#themabar button').count();
    if (th !== 3) throw new Error('themabar heeft ' + th + ' knoppen, geen 3');
    await pagina.tap('#themabar button[data-theme-set="dark"]', { timeout: 8000 });
    await pagina.waitForTimeout(300);
    const th2 = await pagina.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (th2 !== 'dark') throw new Error('data-theme=' + th2 + ' na donker-tik');
  });

  await stap(pagina, 'Breedte: geen zijwaartse scroll op 390px', async () => {
    const sw = await pagina.evaluate(() => document.documentElement.scrollWidth);
    if (sw > 390 + 1) throw new Error('app is ' + sw + ' px breed op 390 px scherm');
  });

  // ===================== RONDE W — nieuwe aanpassingen (v58.10 + v59.0) =====================
  await stap(pagina, 'W1 Regels-werk laadt zonder JS-fouten; 7 dag-chips; "+ Eigen moment toevoegen"-knop; kaartje zichtbaar bij vers rondje', async () => {
    await pagina.goto(base + REGELS + '#testen', { waitUntil: 'load' });
    await pagina.waitForTimeout(1500);
    if (pageFouten.length) throw new Error(pageFouten.join(' | '));
    const st = await pagina.evaluate(() => ({
      chips: [...document.querySelectorAll('#rglDagen button, #rglDagen .chip, #rglDagen > *')].length,
      toevoegen: !!document.querySelector('[data-act="rgltoevoegen"]'),
      kaart: !!(document.getElementById('rgltest') && !document.getElementById('rgltest').hidden)
    }));
    if (st.chips < 7) throw new Error(st.chips + ' dag-chips, geen 7');
    if (!st.toevoegen) throw new Error('geen "+ Eigen moment toevoegen"-knop');
    if (!st.kaart) throw new Error('kaartje niet zichtbaar bij vers rondje');
  });

  await stap(pagina, 'W2 Eigen moment toevoegen: naam + kcal invullen, totaalregel telt mee, daarna netjes verwijderen', async () => {
    await pagina.evaluate(() => { const b = document.querySelector('[data-act="rgltoevoegen"]'); if (!b) throw new Error('knop weg'); b.click(); });
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const m = document.querySelector('.rgl-mom'); if (!m) throw new Error('geen nieuw moment'); if (!m.querySelector('input[data-f="naam"]') || !m.querySelector('input[data-f="kcal"]')) throw new Error('naam- of kcal-invoer ontbreekt'); });
    await pagina.fill('.rgl-mom input[data-f="naam"]', 'Boterham');
    await pagina.fill('.rgl-mom input[data-f="kcal"]', '137');
    await pagina.waitForTimeout(400);
    const totaal = await pagina.evaluate(() => { const t = document.querySelector('.rgl-totaal'); return t ? t.textContent : ''; });
    if (!/137/.test(totaal)) throw new Error('totaalregel telt de 137 kcal niet mee: ' + totaal);
    await pagina.evaluate(() => { const v = document.querySelector('.rgl-mom .verw'); if (v) v.click(); });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => { const v = document.querySelector('.rgl-mom .verw'); if (v) v.click(); });
    await pagina.waitForTimeout(400);
    const weg = await pagina.evaluate(() => !document.querySelector('.rgl-mom'));
    if (!weg) throw new Error('moment is niet verwijderd na de dubbel-tik');
  });

  await stap(pagina, 'W3 "← Terug naar de app" springt naar de werk-app (index-zelftest-work.html)', async () => {
    await pagina.evaluate(() => {
      const terug = [...document.querySelectorAll('a, button')].find(k => /Terug naar de app/i.test(k.textContent || ''));
      if (!terug) throw new Error('geen Terug-knop');
      terug.click();
    });
    await pagina.waitForTimeout(2500);
    if (!/index-zelftest-work\.html/.test(pagina.url())) throw new Error('URL na Terug = ' + pagina.url());
  });

  await stap(pagina, 'W4 Footer met 📋 Regels-knop naar de Regels-werkpagina', async () => {
    const okRegels = await pagina.evaluate(() => !!document.querySelector('footer a[href="regels-zelftest-work.html"]'));
    if (!okRegels) throw new Error('footer mist de Regels-knop');
  });

  await stap(pagina, 'W5 Rustige testpagina: "🆕 Te doen", géén deel-tellers, géén reset-knoppen op het hoofdscherm, v59.0-punt aanwezig', async () => {
    await pagina.goto(base + WERK + '#testen', { waitUntil: 'load' });
    await pagina.waitForTimeout(1800);
    const st = await pagina.evaluate(() => {
      const vs = document.getElementById('deelVers'); if (!vs) throw new Error('geen #deelVers');
      const sum = (vs.querySelector('summary') || { textContent: '' }).textContent.trim();
      const tellers = [...vs.querySelectorAll('#verslijst summary')].filter(s => /\(\d+\/\d+\)/.test(s.textContent)).length;
      const knoppenBuiten = [...vs.querySelectorAll('[data-act="testreset"], [data-act="testwis"]')].filter(k => !k.closest('#testarchief')).length;
      const v59 = (typeof VERS_TESTEN !== 'undefined') && VERS_TESTEN.some(p => /Rustige testpagina/.test(p.t || ''));
      return { sum, tellers, knoppenBuiten, v59: !!v59 };
    });
    if (!/Te doen/.test(st.sum)) throw new Error('summary = ' + st.sum);
    if (st.tellers) throw new Error(st.tellers + ' deel-kopjes met (x/y)-teller');
    if (st.knoppenBuiten) throw new Error('reset/wis-knoppen op het hoofdscherm');
    if (!st.v59) throw new Error('v59.0-testpunt mist');
  });

  await stap(pagina, 'W6 Punt afvinken (✓) → weg uit Te doen en in het Archief; permanent na herladen (geen dag-reset)', async () => {
    await pagina.evaluate(() => { const k = document.querySelector('#verslijst .testitem [data-act="testga"]'); if (!k) throw new Error('geen open punt'); k.click(); });
    await pagina.waitForTimeout(800);
    await pagina.evaluate(() => { const g = document.getElementById('tbgoed'); if (!g) throw new Error('testbalkje/✓-knop ontbreekt'); g.click(); });
    await pagina.waitForTimeout(500);
    await pagina.reload({ waitUntil: 'load' });
    await pagina.waitForTimeout(1800);
    const st = await pagina.evaluate(() => {
      const r = JSON.parse(localStorage.getItem('eetweek.testronde') || 'null');
      const nogOpen = [...document.querySelectorAll('#verslijst .testitem [data-act="testga"]')].length;
      const archief = document.getElementById('testarchief');
      return { vink: !!(r && r.klein && r.klein[0]), nogOpen, archief: !!(archief && archief.textContent.indexOf('Regels') > -1) };
    });
    if (!st.vink) throw new Error('vinkje niet bewaard na herladen');
    if (st.nogOpen) throw new Error('afgevinkt punt staat nog in Te doen');
    if (!st.archief) throw new Error('punt staat niet in het Archief');
  }, '#testview');

  await stap(pagina, 'W7 Archief openklappen + "↺ weer open" → punt staat direct terug in Te doen', async () => {
    await pagina.evaluate(() => { const a = document.getElementById('testarchief'); if (!a) throw new Error('geen Archief'); a.open = true; const u = a.querySelector('[data-act="testunvink"]'); if (!u) throw new Error('geen ↺ weer open-knop'); u.click(); });
    await pagina.waitForTimeout(500);
    const terug = await pagina.evaluate(() => [...document.querySelectorAll('#verslijst .testitem [data-act="testga"]')].length);
    if (!terug) throw new Error('punt staat niet terug in Te doen');
  });

  await stap(pagina, 'W8 Kaartje bij Regels volgt het vinkje: open zolang het punt open is, weg na ✓, én nóg weg na de OUDERE-dag-simulatie (permanent)', async () => {
    await pagina.goto(base + REGELS + '#testen', { waitUntil: 'load' });
    await pagina.waitForTimeout(1500);
    const zichtbaar = await pagina.evaluate(() => !!(document.getElementById('rgltest') && !document.getElementById('rgltest').hidden));
    if (!zichtbaar) throw new Error('kaartje zou zichtbaar moeten zijn (punt weer open)');
    await pagina.goto(base + WERK + '#testen', { waitUntil: 'load' });
    await pagina.waitForTimeout(1800);
    await pagina.evaluate(() => { const k = document.querySelector('#verslijst .testitem [data-act="testga"]'); if (k) k.click(); });
    await pagina.waitForTimeout(800);
    await pagina.evaluate(() => { const g = document.getElementById('tbgoed'); if (g) g.click(); });
    await pagina.waitForTimeout(500);
    await pagina.goto(base + REGELS + '#testen', { waitUntil: 'load' });
    await pagina.waitForTimeout(1500);
    const weg = await pagina.evaluate(() => !!(document.getElementById('rgltest') && document.getElementById('rgltest').hidden));
    if (!weg) throw new Error('kaartje niet verborgen na ✓');
    await pagina.evaluate(() => { try { const r = JSON.parse(localStorage.getItem('eetweek.testronde') || '{}'); r.v = '14 nov'; localStorage.setItem('eetweek.testronde', JSON.stringify(r)); } catch (e) {} });
    await pagina.reload({ waitUntil: 'load' });
    await pagina.waitForTimeout(1500);
    const weg2 = await pagina.evaluate(() => !!(document.getElementById('rgltest') && document.getElementById('rgltest').hidden));
    if (!weg2) throw new Error('kaartje kwam terug na oudere-dag-simulatie — de dag-reset is niet weg!');
  });

  await stap(pagina, 'W9 "#kaartje" in de URL haalt het kaartje terug om zelf te checken', async () => {
    await pagina.goto(base + REGELS + '#kaartje', { waitUntil: 'load' });
    await pagina.waitForTimeout(1500);
    const terug = await pagina.evaluate(() => !!(document.getElementById('rgltest') && !document.getElementById('rgltest').hidden));
    if (!terug) throw new Error('#kaartje toont het kaartje niet');
  });

  await stap(pagina, 'W10 Aparte opslag: werk-app schrijft alléén naar de test-opslag; eetweek.v1 blijft onaangeraakt', async () => {
    await pagina.goto(base + WERK, { waitUntil: 'load' });
    await pagina.waitForTimeout(1200);
    const st = await pagina.evaluate(() => ({
      test: !!localStorage.getItem('eetweek.v1.testversie') || (typeof TESTVERSIE !== 'undefined' && !!TESTVERSIE),
      echt: !!localStorage.getItem('eetweek.v1')
    }));
    if (!st.test) throw new Error('geen test-opslag / TESTVERSIE uit');
    if (st.echt) throw new Error('eetweek.v1 bestaat in de werk-context — de werk-app heeft de echte opslag aangeraakt!');
  });

  // opruimen (netjes voor de volgende ronde)
  await pagina.evaluate(() => { try { localStorage.removeItem('eetweek.testronde'); localStorage.removeItem('eetweek.regels.kaartje'); localStorage.removeItem('eetweek.regels.zelftestwork.v1'); } catch (e) {} }).catch(() => {});

  // ---------- rapport ----------
  fs.mkdirSync(RAPPORT_DIR, { recursive: true });
  const ok = stappen.filter(s => s.ok).length;
  let md = '# Kliktest-work-rapport — ' + nlTijd() + ' (Nederlandse tijd)\n\nGetest: **' + WERK + '** + **' + REGELS + '** (alléén de werk-set; ZONDER AI/Mistral-stuff; de echte index.html is niet gewijzigd)\n\n**' + ok + ' van ' + stappen.length + ' stappen gelukt, ' + pageFouten.length + ' JS-fouten.** ' + (ok === stappen.length && !pageFouten.length ? 'Alles groen 🎉' : 'Er is iets mis — zie hieronder') + '\n\n## Kern-ronde\n\n';
  let sectie = 'kern';
  for (const s of stappen) {
    if (s.naam.startsWith('W1')) { md += '\n## Ronde W — nieuwe aanpassingen (v58.10 + v59.0)\n\n'; sectie = 'W'; }
    md += '- [' + (s.ok ? 'x' : ' ') + '] ' + s.naam + (s.fout ? ' — **' + s.fout + '**' : '') + '\n';
  }
  if (pageFouten.length) { md += '\n## JS-fouten\n'; for (const f of pageFouten) md += '- ' + f + '\n'; }
  const best = path.join(RAPPORT_DIR, 'kliktest-work-' + new Date().toISOString().replace(/[:.]/g, '-') + '.md');
  fs.writeFileSync(best, md);
  console.log('\nRapport: ' + path.relative(ROOT, best));
  console.log(ok + '/' + stappen.length + ' OK, ' + pageFouten.length + ' JS-fouten');
  await browser.close();
  srv.close();
  process.exit(ok === stappen.length && !pageFouten.length ? 0 : 1);
})().catch(e => { console.error('BOT CRASH:', e); process.exit(2); });
