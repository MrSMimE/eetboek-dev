# LEESWIJZER — de grote app opzoeken zonder verdwalen

**Bron voor JS-wijzigingen: versies/work/62/opdeling/app.js, lees LEESWIJZER-app.md; de losse deeltjes bestaan niet meer.**

Dit is de werk-app zoals die op 15 nov 2026 stond (v62). Alle pleisters tot en met v62 zitten al in de code gebakken:

- versieregel: `Mijn Eetboek • v62`
- eigen eetmomenten uit Mijn regels (met ⚡-vinkje voor Mijn normale dag), recept-groepen volgen je eigen momentnamen
- prullenbak bij verwijderde recepten (per stuk of alles terugzetten)
- AI-aanbieder: Mistral of een OpenAI-compatibele aanbieder (webadres + sleutel + model)
- 🧪 Testen-blokje in Instellingen (link naar het test-rondje + Measure-helper), testpunten Deel 6 en 7
- Boodschappen-tab verborgen; footerknoppen 🍽️ Eetmomenten + ℹ️ Over & Feedback alleen op Week en Instellingen; tabbalk verdeeld over 5 gelijke kolommen

## Wat staat er in deze map

- `app.html` — de grote deur: laadt de echte app ( ../../../index.html ) en pleistert die. Werkt alleen zolang de repo-mapstructuur klopt.
- `index.html`, `recepten.html`, `producten.html`, `kookhulp.html`, `boodschappen.html`, `instellingen.html`, `regels.html`, `testen.html`, `over.html`, `overzicht.html`, `style.css`, `checkjebon-js.js` — de kleine deur-pagina's.
- `app.js` — een dun laadtje: schermt de opslag af (`eetweek.v1` → `eetweek.v1.testversie`, je echte eetboek blijft onaangeraakt) en laadt `opdeling/app.js`. Er zitten géén pleisters meer in.
- `opdeling/app.js` — dé app zelf: één groot JS-bestand, 11.177 regels, versgebakken v62.
- `opdeling/*.html` + `opdeling/style.css` — de multi-page variant die bij datzelfde app.js hoort.

## Het grote JavaScript in brokken

Regelnummers horen bij deze exacte versie (11.177 regels). Zodra de app verandert schuiven ze op; de herkenningswoorden blijven gelden. Zoek op het woord, niet op het nummer.

| Regel | Brok | Herkenningswoord |
|---|---|---|
| 3 | versienummer | `var VERSION` |
| 10 | catalogus: vaste producten en kcal | `function I(` |
| 89 | eigen momenten uit Mijn regels lezen | `regelsMomenten` |
| 209 | opslag Mijn regels | `'eetweek.regels.v1'` |
| 224 | welke momenten bij welke dag (eigen regels eerst) | `momentsFor` |
| 232 | momenten zonder eigen regels | `momentsBase` |
| 238 | brood in één tik | `function brood(` |
| 273 | begin van de week | `startOfWeek` |
| 365 | staat & opslag, Mijn normale dag | `var S =` / `S.normaal` |
| 387 | hoofdopslag | `'eetweek.v1'` |
| 410 | welke pagina zie je | `function render()` |
| 430 | recepten bouwen en tonen | `renderRecipes`, `renderRec` |
| 436 | meet-hulpje (in Instellingen) | `meet-hulpje` |
| 443 | recept-stappen | `STEPS` |
| 828 | prullenbak verwijderde recepten | `Prullenbak` |
| 1069 | recept plakken | `renderPaste` |
| 1136 | producten/prijzen importeren en plakken | `renderMulti` |
| 1355 | AI-aanbieder (Mistral of eigen) | `mistralModel`, `aiBase` |
| 3031 | Mistral etiket + kassabon-scanner + privacy-crop | `bon-crop` |
| 4628 | Zeg wat je at (slim tijdje lezen) | `zegMoment` |
| 4920 | opslag, kopiëren, terugzetten, oude data omzetten | `uitbestand` |
| 5098 | eigen producten in Week, Vervang dit, combi-tips | `Meest gekozen` |
| 6912 | kookmodus | `Kookmodus` |
| 7038 | Mistral-kok (schema, ideeën, porties, prijs) | `jouw schema` |
| 10657 | testpunten van het test-rondje | `VERS_TESTEN` |
| 10925 | automatische zelftest | `zelftestRun` |
| 11094 | 🧪 Testen-blokje in Instellingen | `grpTesten` |

## Onderhoud

Na elke oplevering krijgen `opdeling/app.js` en deze leeswijzer samen een beurtje: eerst de code verversen, daarna de regelnummers opnieuw bepalen (herkenningswoorden zoeken) en hier bijwerken. Herkenningswoorden die verdwijnen of hernoemd worden: hier meteen aanpassen.
