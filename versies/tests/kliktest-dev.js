// Kliktest-dev voor MrSMimE/eetboek-dev — test de losse map app-test/ (index-zelftest.html).
// ZONDER AI/Mistral-stuff: geen live-opzoek, geen Mistral-aanroepen, geen AI-jury.
// Gebruik: node versies/tests/kliktest-dev.js [pad-naar-testbestand]
//   (zonder argument: app-test/index-zelftest.html; anders nieuwste *single-file.html in versies/)
// Lokaal: bash versies/tests/draai-klikbot-dev.sh   |   CI: sync-dev.yml draait dit na de sync
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..'); // repo-root (script woont in versies/tests/)
const APPTEST = path.join(ROOT, 'versies', 'opdeling-test');
const VERSIES = path.join(ROOT, 'versies');
const RAPPORT_DIR = path.join(__dirname, 'rapport-laatste-dev');
const POORT = parseInt(process.env.POORT || '8137', 10);

function versieNum(f) {
  const m = f.match(/v(\d+)\.(\d+)/);
  return m ? (+m[1]) * 1000 + (+m[2]) : -1;
}
function kiesDoel() {
  // v58.9+ (14 nov 21u3x): losse opdeling — app-test/index-zelftest.html is de single-file testbuild
  const los = path.join(APPTEST, 'index-zelftest.html');
  if (fs.existsSync(los)) return los;
  // oude situatie: nieuwste *single-file.html in versies/
  const singles = fs.readdirSync(VERSIES).filter(f => f.endsWith('---single-file.html')).sort((a, b) => versieNum(a) - versieNum(b));
  if (!singles.length) throw new Error('geen app-test/index-zelftest.html en geen single-file in versies/ — zet eerst een losse testversie neer');
  return path.join(VERSIES, singles[singles.length - 1]);
}

const stappen = [];
const fouten = [];
async function stap(pagina, naam, fn, wachtOp) {
  try {
    if (wachtOp) await pagina.waitForSelector(wachtOp, { timeout: 8000 }).catch(() => {});
    await fn();
    stappen.push({ naam, ok: true });
    console.log('OK  ' + naam);
  } catch (e) {
    stappen.push({ naam, ok: false, fout: String(e && e.message || e) });
    fouten.push(naam + ': ' + (e && e.message || e));
    console.log('FOUT ' + naam + ' — ' + (e && e.message || e));
  }
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
  const doel = process.argv[2] ? path.resolve(process.argv[2]) : kiesDoel();
  const doelMap = path.dirname(doel);
  const doelNaam = path.basename(doel);
  console.log(' Doel: ' + path.relative(ROOT, doel));
  const zips = fs.readdirSync(doelMap).filter(f => f.endsWith('.zip'));
  console.log(' zips in ' + path.relative(ROOT, doelMap) + ': ' + (zips.join(', ') || 'geen'));

  const { chromium } = require('playwright');
  const srv = await serve(doelMap); // de bot start zélf een server — geen apart server.js nodig (geen poort-conflict)
  const pagina = await (await chromium.launch()).newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const pageFouten = [];
  pagina.on('pageerror', e => pageFouten.push('PAGEERROR: ' + String(e).slice(0, 200)));
  pagina.on('console', m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) pageFouten.push('CONSOLE: ' + m.text().slice(0, 200)); });

  const url = 'http://localhost:' + POORT + '/' + encodeURIComponent(doelNaam);

  await stap(pagina, 'Zip-integrity (python3 zipfile, optioneel)', async () => {
    try { execSync('python3 -c "import zipfile,glob; [zipfile.ZipFile(z).testzip() for z in glob.glob(' + JSON.stringify(path.join(doelMap, '*.zip')) + ')]"', { stdio: 'pipe' }); }
    catch (e) { console.log('  (python3 niet beschikbaar — zip-check overgeslagen)'); }
  });

  await stap(pagina, 'Single laadt zonder JS-fouten', async () => {
    await pagina.goto(url, { waitUntil: 'load' });
    await pagina.waitForTimeout(900);
    if (pageFouten.length) throw new Error(pageFouten.join(' | '));
  }, 'body');

  await stap(pagina, 'Tabbalk: 6 SVG-icoon-knoppen zonder tekst, kop (.titlerij) vóór .tabs', async () => {
    const n = await pagina.locator('.tabs .tab').count();
    if (n !== 6) throw new Error('.tabs heeft ' + n + ' knoppen, geen 6');
    const svgs = await pagina.locator('.tabs .tab svg').count();
    if (svgs !== 6) throw new Error(svgs + ' svg-icoontjes, geen 6');
    const teksten = await pagina.$$eval('.tabs .tab', els => els.map(e => (e.textContent || '').trim()));
    if (teksten.some(t => t.length > 0)) throw new Error('tab-knoppen bevatten tekst: ' + teksten.join(','));
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
    for (const a of verwacht) if (menu.indexOf(a) < 0) throw new Error('⋮-menu nééét: ' + a + ' in ' + menu.join(','));
    if (menu.length !== 4) throw new Error('⋮-menu heeft ' + menu.length + ' opties, geen 4');
  });

  await stap(pagina, '⋮-menu direct dicht na Bewerken (en bewerk-scherm open)', async () => {
    await pagina.evaluate(() => { document.querySelector('#recview details.rcard .rcmenu [data-act="recedit"]').click(); });
    await pagina.waitForTimeout(600);
    const n = await pagina.locator('#recview .rcmenu').count();
    if (n !== 0) throw new Error('⋮-menu bleef open na Bewerken');
    const sheet = await pagina.evaluate(() => { const s = document.getElementById('recsheet'); return s && !s.hidden; });
    if (!sheet) throw new Error('recsheet bleef dicht');
    await pagina.evaluate(() => { const b = document.querySelector('#recsheet [data-act="recclose"]'); if (b) b.click(); });
  });

  await stap(pagina, 'Kookhulp: Voorbereiden-blok zonder kiezer, met rustige tekstregel', async () => {
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

  await stap(pagina, 'Producten: zoekbalk filtert + Nieuw product opent popup', async () => {
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
    if (tb) throw new Error('testblok in Instellingen (hoort alleen in de testapp)');
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

  await stap(pagina, 'Alle 6 losse pagina\u2019s (opdeling) laden zonder JS-fouten', async () => {
    if (!fs.existsSync(path.join(APPTEST, 'index.html'))) return; // oude zip-only situatie: overslaan
    const paginas = ['index.html', 'boodschappen.html', 'instellingen.html', 'kookhulp.html', 'producten.html', 'recepten.html'];
    for (const p of paginas) {
      if (!fs.existsSync(path.join(APPTEST, p))) throw new Error('ontbreekt in versies/opdeling-test/: ' + p);
    }
    for (const p of paginas) {
      await pagina.goto('http://localhost:' + POORT + '/' + p, { waitUntil: 'load' });
      await pagina.waitForTimeout(600);
      const kop = await pagina.textContent('h1').catch(() => '');
      if (!/Mijn Eetboek/i.test(kop || '')) throw new Error(p + ': geen kop Mijn Eetboek');
      if (pageFouten.length) throw new Error(p + ': ' + pageFouten.join(' | '));
    }
  });

  // rapport
  fs.mkdirSync(RAPPORT_DIR, { recursive: true });
  const ok = stappen.filter(s => s.ok).length;
  const tijd = new Date().toLocaleString('nl-NL');
  let md = '# Kliktest-dev-rapport — ' + tijd + ' (Nederlandse tijd)\n\nDoel: `' + doelNaam + '`\n\n**' + ok + ' van ' + stappen.length + ' stappen gelukt, ' + pageFouten.length + ' JS-fouten.** ' + (ok === stappen.length && !pageFouten.length ? 'Alles groen 🎉' : 'Er is iets mis — zie hieronder') + '\n\n';
  for (const s of stappen) md += '- [' + (s.ok ? 'x' : ' ') + '] ' + s.naam + (s.fout ? ' — **' + s.fout + '**' : '') + '\n';
  if (pageFouten.length) { md += '\n## JS-fouten\n'; for (const f of pageFouten) md += '- ' + f + '\n'; }
  const best = path.join(RAPPORT_DIR, 'kliktest-dev-' + new Date().toISOString().replace(/[:.]/g, '-') + '.md');
  fs.writeFileSync(best, md);
  console.log('\nRapport: ' + path.relative(ROOT, best));
  console.log(ok + '/' + stappen.length + ' OK, ' + pageFouten.length + ' JS-fouten');
  await pagina.context().browser().close();
  srv.close();
  process.exit(ok === stappen.length && !pageFouten.length ? 0 : 1);
})().catch(e => { console.error('BOT CRASH:', e); process.exit(2); });
