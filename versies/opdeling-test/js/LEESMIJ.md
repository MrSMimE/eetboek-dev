# app/js — de delen van app.js

`app/app.js` wordt gemaakt uit deze losse bestanden. **Werk in deze bestanden, niet in `app/app.js`.**
Na een wijziging: `python3 build-single.py` (dat draait `bouw-app.py` vanzelf eerst).

De delen horen bij één grote app en delen variabelen en functies, dus de volgorde telt (staat in `bouw-app.py`).

| Bestand | Inhoud |
|---|---|
| 01-catalogus | versienummer, catalogus van eten, brood in één tik |
| 02-basis | datum, namen op het scherm, staat, render |
| 03-recepten | recepten, recept plakken |
| 04-producten | producten en prijzen, supermarktnamen en bijna-dubbele namen, product bewerken |
| 05-scanner | Mistral lezen (etiket), bon-crop, kassabon |
| 06-plakken | producten plakken (JSON), prijzen plakken |
| 07-week | lade, eigen producten in de week, vervang dit, combi-suggestie |
| 08-foto | foto |
| 09-opslag | opslag, kopiëren, reservekopie terugzetten |
| 10-uitbreidingen | exportknoppen, oude dagen omzetten, Mijn regels, Kookmodus |
| 11 t/m 14 | het Mistral-tabblad (Kookhulp): schema, recept aanpassen, uitleg en kaarten, sub-tabbladen |
| 15-start-en-thema | recept openen, thema, en het opstarten van de app |
| 16-mistral-sleutel | Mistral API-sleutel + model (tandwiel) |
| 17-snel-invullen | v49: ⚡ "Zelfde als normaal" (Mijn normale dag) + "Zeg wat je at" (AI-voorstel) |

Het buitenste `(function () { ... })()` en het binnenste blok van het Mistral-tabblad staan niet in de losse bestanden; `bouw-app.py` zet ze erom heen.
