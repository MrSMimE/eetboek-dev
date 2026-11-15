// Kliktest-work voor MrSMimE/eetboek-dev — DE ECHTE KLIKTEST op de werk-set.
// v1 (15 nov 2026, Vibe Work):
//   1. Draait de volledige echte kliktest (kliktest.js, ~2900 regels, alle rondes incl. v58.x)
//      tegen de werk-app (index-zelftest-work.html laadt de echte index.html + werk-ombouw).
//   2. Daarna een eigen RONDE W: alle nieuwe aanpassingen van de werk-set nagekeken —
//      v58.10 (Regels-werkpagina + aparte opslag) en v59.0 (rustige testpagina + permanente
//      vinkjes + Archief + ↺ weer open + Regels-kaartje permanent).
// De echte index.html wordt nooit gewijzigd. Gebruik: node versies/tests/kliktest-work.js
// CI: .github/workflows/kliktest-work.yml
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..', '..'); // repo-root (script woont in versies/tests/)
const RAPPORT_DIR = path.join(__dirname, 'rapport-laatste-work');
const ECHTE_RAPPORT = path.join(__dirname, 'rapport', 'rapport.md');
const POORT = parseInt(process.env.POORT || '8139', 10);
const WERK = 'index-zelftest-work.html';
const REGELS = 'regels-zelftest-work.html';
const URL_WERK = 'http://localhost:' + POORT + '/' + WERK;

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
  fs.mkdirSync(RAPPORT_DIR, { recursive: true });
  const srv = await serve(ROOT);

  // ---------- 1. DE ECHTE KLIKTEST op de werk-app ----------
  console.log('\n=== DEEL 1: de echte kliktest (kliktest.js) op de werk-app ===\n');
  const echteExit = await new Promise(res => {
    const p = spawn(process.execPath, [path.join(__dirname, 'kliktest.js'), URL_WERK], { stdio: 'inherit' });
    p.on('exit', c => res(c == null ? 2 : c));
  });
  let echteRapport = '';
  try { echteRapport = fs.readFileSync(ECHTE_RAPPORT, 'utf8'); } catch (e) { echteRapport = '(geen rapport.md geschreven — kliktest.js crashte?)'; }
  const echteOk = echteExit === 0;
  console.log('\n=== DEEL 2: RONDE W — nieuwe aanpassingen van de werk-set ===\n');

  // ---------- 2. eigen ronde: alle nieuwe aanpassingen ----------
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const pagina = await ctx.newPage();
  const pageFouten = [];
  pagina.on('pageerror', e => pageFouten.push('PAGEERROR: ' + String(e).slice(0, 200)));
  pagina.on('console', m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) pageFouten.push('CONSOLE: ' + m.text().slice(0, 200)); });
  const base = 'http://localhost:' + POORT + '/';

  // W1 — Regels-werkpagina
  await stap(pagina, 'W1 Regels-werk laadt zonder JS-fouten; 7 dag-chips; "+ Eigen moment toevoegen"-knop; kaartje zichtbaar bij vers rondje', async () => {
    await pagina.goto(base + REGELS + '#testen', { waitUntil: 'load' });
    await pagina.waitForTimeout(1500);
    if (pageFouten.length) throw new Error(pageFouten.join(' | '));
    const st = await pagina.evaluate(() => {
      const chips = [...document.querySelectorAll('#rglDagen button, #rglDagen .chip, #rglDagen > *')].length;
      const toevoegen = !!document.querySelector('[data-act="rgltoevoegen"]');
      const kaart = !!(document.getElementById('rgltest') && !document.getElementById('rgltest').hidden);
      return { chips, toevoegen, kaart };
    });
    if (st.chips < 7) throw new Error(st.chips + ' dag-chips, geen 7');
    if (!st.toevoegen) throw new Error('geen "+ Eigen moment toevoegen"-knop');
    if (!st.kaart) throw new Error('kaartje niet zichtbaar bij vers rondje');
  });

  // W2 — Eigen moment: toevoegen, naam + kcal, totaalregel
  await stap(pagina, 'W2 Eigen moment toevoegen: naam + kcal invullen, totaalregel telt mee, daarna netjes verwijderen', async () => {
    await pagina.evaluate(() => { const b = document.querySelector('[data-act="rgltoevoegen"]'); if (!b) throw new Error('knop weg'); b.click(); });
    await pagina.waitForTimeout(400);
    const invoer = await pagina.evaluate(() => {
      const m = document.querySelector('.rgl-mom');
      if (!m) throw new Error('geen nieuw moment');
      const naam = m.querySelector('input[data-f="naam"]');
      const kcal = m.querySelector('input[data-f="kcal"]');
      if (!naam || !kcal) throw new Error('naam- of kcal-invoer ontbreekt');
      return { mid: m.getAttribute('data-mid') };
    });
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

  // W3 — terug naar de werk-app
  await stap(pagina, 'W3 "← Terug naar de app" springt naar de werk-app (index-zelftest-work.html)', async () => {
    const ging = await pagina.evaluate(() => {
      const knoppen = [...document.querySelectorAll('a, button')];
      const terug = knoppen.find(k => /Terug naar de app/i.test(k.textContent || ''));
      if (!terug) throw new Error('geen Terug-knop');
      terug.click();
      return true;
    });
    await pagina.waitForTimeout(2500);
    if (!ging || !/index-zelftest-work\.html/.test(pagina.url())) throw new Error('URL na Terug = ' + pagina.url());
  });

  // W4 — werk-app: versie, aparte opslag, footer, #testen
  await stap(pagina, 'W4 Werk-app: VERSION v59.0, TESTVERSIE aan (aparte opslag), footer met 📋 Regels-knop, #testen opent het Testen-tab', async () => {
    await pagina.goto(base + WERK + '#testen', { waitUntil: 'load' });
    await pagina.waitForTimeout(1800);
    if (pageFouten.length) throw new Error(pageFouten.join(' | '));
    const st = await pagina.evaluate(() => ({
      v: (typeof VERSION === 'undefined') ? '' : String(VERSION),
      testversie: (typeof TESTVERSIE === 'undefined') ? null : !!TESTVERSIE,
      regelsLink: !!document.querySelector('footer a[href="regels-zelftest-work.html"]'),
      testview: !!(document.getElementById('testview') && !document.getElementById('testview').hidden)
    }));
    if (!/v59\.0/.test(st.v)) throw new Error('VERSION = ' + st.v);
    if (!st.testversie) throw new Error('TESTVERSIE staat niet aan — geen aparte opslag!');
    if (!st.regelsLink) throw new Error('footer mist de Regels-knop');
    if (!st.testview) throw new Error('#testen opent het Testen-tab niet');
  });

  // W5 — rustige testpagina
  await stap(pagina, 'W5 Rustige testpagina: "🆕 Te doen", géén deel-tellers, géén reset-knoppen op het hoofdscherm, v59.0-punt aanwezig', async () => {
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

  // W6 — afvinken → Archief, permanent na herladen
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

  // W7 — Archief: ↺ weer open
  await stap(pagina, 'W7 Archief openklappen + "↺ weer open" → punt staat direct terug in Te doen', async () => {
    await pagina.evaluate(() => { const a = document.getElementById('testarchief'); if (!a) throw new Error('geen Archief'); a.open = true; const u = a.querySelector('[data-act="testunvink"]'); if (!u) throw new Error('geen ↺ weer open-knop'); u.click(); });
    await pagina.waitForTimeout(500);
    const terug = await pagina.evaluate(() => [...document.querySelectorAll('#verslijst .testitem [data-act="testga"]')].length);
    if (!terug) throw new Error('punt staat niet terug in Te doen');
  });

  // W8 — kaartje volgt het vinkje (end-to-end), permanent over dagen
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
    // oudere-dag-simulatie: zet de opslag op "14 nov" en herlaad — kaartje moet VERBORGEN blijven (geen dag-reset)
    await pagina.evaluate(() => { try { const r = JSON.parse(localStorage.getItem('eetweek.testronde') || '{}'); r.v = '14 nov'; localStorage.setItem('eetweek.testronde', JSON.stringify(r)); } catch (e) {} });
    await pagina.reload({ waitUntil: 'load' });
    await pagina.waitForTimeout(1500);
    const weg2 = await pagina.evaluate(() => !!(document.getElementById('rgltest') && document.getElementById('rgltest').hidden));
    if (!weg2) throw new Error('kaartje kwam terug na oudere-dag-simulatie — de dag-reset is niet weg!');
  });

  // W9 — #kaartje terughaal
  await stap(pagina, 'W9 "#kaartje" in de URL haalt het kaartje terug om zelf te checken', async () => {
    await pagina.goto(base + REGELS + '#kaartje', { waitUntil: 'load' });
    await pagina.waitForTimeout(1500);
    const terug = await pagina.evaluate(() => !!(document.getElementById('rgltest') && !document.getElementById('rgltest').hidden));
    if (!terug) throw new Error('#kaartje toont het kaartje niet');
  });

  // W10 — aparte opslag: werk-app raakt de echte opslag niet aan
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

  // opruimen
  await pagina.evaluate(() => { try { localStorage.removeItem('eetweek.testronde'); localStorage.removeItem('eetweek.regels.kaartje'); localStorage.removeItem('eetweek.regels.zelftestwork.v1'); } catch (e) {} }).catch(() => {});

  // ---------- 3. rapport ----------
  const okW = stappen.filter(s => s.ok).length;
  let md = '# Kliktest-work-rapport — ' + nlTijd() + ' (Nederlandse tijd)\n\nGetest: **' + WERK + '** + **' + REGELS + '** (alléén de werk-set; de echte index.html is niet gewijzigd)\n\n';
  md += '## DEEL 1 — de echte kliktest (kliktest.js)\n\n**' + (echteOk ? 'GROEN 🎉 (exit 0)' : 'ROOD — exit ' + echteExit) + '** — het volledige rapport van de echte kliktest staat in `versies/tests/rapport/rapport.md` (en als artifact bijgevoegd).\n\n';
  md += '## DEEL 2 — Ronde W: nieuwe aanpassingen van de werk-set\n\n**' + okW + ' van ' + stappen.length + ' stappen gelukt, ' + pageFouten.length + ' JS-fouten.**\n\n';
  for (const s of stappen) md += '- [' + (s.ok ? 'x' : ' ') + '] ' + s.naam + (s.fout ? ' — **' + s.fout + '**' : '') + '\n';
  if (pageFouten.length) { md += '\n### JS-fouten ronde W\n'; for (const f of pageFouten) md += '- ' + f + '\n'; }
  const totaalGroen = echteOk && okW === stappen.length && !pageFouten.length;
  md += '\n**Totaal: ' + (totaalGroen ? 'alles groen 🎉' : 'ER IS IETS MIS — zie boven') + '**\n';
  const best = path.join(RAPPORT_DIR, 'kliktest-work-' + new Date().toISOString().replace(/[:.]/g, '-') + '.md');
  fs.writeFileSync(best, md);
  try { fs.copyFileSync(ECHTE_RAPPORT, path.join(RAPPORT_DIR, 'kliktest-echte-rapport.md')); } catch (e) {}
  console.log('\nRapport: ' + path.relative(ROOT, best));
  console.log('Echte kliktest: ' + (echteOk ? 'GROEN' : 'ROOD (' + echteExit + ')') + ' | Ronde W: ' + okW + '/' + stappen.length + ' OK');
  await browser.close();
  srv.close();
  process.exit(totaalGroen ? 0 : 1);
})().catch(e => { console.error('BOT CRASH:', e); process.exit(2); });
