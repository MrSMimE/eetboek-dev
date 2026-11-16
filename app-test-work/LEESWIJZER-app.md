# LEESWIJZER — de grote app opzoeken zonder verdwalen

Werk-bouw van 15 nov 2026 (bijlage bij de werk-afspraken van 15 nov).
Regelnummers horen bij **v58.9 - 14 nov 20u55** op de Test-branch.
Let op: zodra de app verandert, schuiven de regelnummers op. De herkenningswoorden blijven gelden.

De app is één groot bestand (12.665 regels):

- regels 11-805: stijl en uiterlijk (kleuren per stand, donker, contrast)
- regels 807-1670: alle schermen (Week, Recepten, Prijzen, Gedeeld, Instellingen, Boodschappen, Testen)
- regels 1670-12662: al het JavaScript

## Het JavaScript in brokken

| Regels | Brok | Herkenningswoorden |
|---|---|---|
| 1673 | versienummer | var VERSION |
| 1678-1801 | catalogus: vaste producten, ingrediënten, momenten, maxima | I(naam, kcal...), MAXP |
| 1802-1971 | brood in één tik + week-momenten | brood(), momentsFor (r1856), momentsBase (r1864), optButtons |
| 1972-2044 | datum, schermnamen, staat & opslag | startOfWeek, var S (r2001), 'eetweek.v1' (r2023) |
| 2045-2074 | render (welke pagina zie je) | function render() |
| 2075-2699 | recepten bouwen en tonen | STEPS, renderRecipes (r2419) |
| 2700-3014 | recept plakken | renderPaste, pak(o, ...) |
| 3015-4525 | producten & prijzen bewerken | renderRec, product bewerken |
| 4526-5361 | Mistral etiket + kassabon-scanner + privacy-crop | bon-crop, scanner |
| 5362-6557 | producten/prijzen importeren en plakken | renderMulti |
| 6558-7242 | lade, eigen producten in Week, Vervang dit, combi-tips | Meest gekozen |
| 7243-7922 | foto's | foto |
| 7923-8477 | opslag, kopiëren, terugzetten, oude data omzetten | 'eetweek.v1', uitbestand |
| 8478-8535 | Mijn eetmomenten | 'eetweek.regels.v1' |
| 8536-8661 | kookmodus | Kookmodus |
| 8662-10727 | Mistral-kok (schema, ideeën, porties, prijs, bewaren) | jouw schema, Mistral aanroepen |
| 10728-10908 | meet-hulpje | meet-hulpje |
| 10909-12393 | snel invullen: Zelfde als normaal, Zeg wat je at, vorige week | S.normaal, zegMoment |
| 12394-12662 | meeneem-flow, testbalkje, automatische zelftest | VERS_TESTEN, zelftestRun |

## Werk-deuren die hierop rekenen

- app-test-work/app.js (v60.0): laadt versies/opdeling-test/app.js, remapt opslag, vervangt momentsFor/optButtons.
- app.html (v61.2): laadt de echte index.html en patcht die (zelfde brokken, plus regels-sleutel eetweek.regels.zelftestwork.v1).

## Onderhoud

Na elke echte app-wijziging: regelnummers opnieuw bepalen (de herkenningswoorden zoeken). Herkenningswoorden die verdwijnen of hernoemd worden: hier bijwerken.
