  // v45b.3: versienummer op één plek — bij een nieuwe versie alleen deze regel aanpassen
  var VERSION = 'v58.9 - 14 nov 20u55';
  var TESTVERSIE = false; // testversie: leest eetweek.v1, schrijft alleen naar eetweek.v1.testversie
  var DOW = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  var MON = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

  // ---- catalogus. I(naam, kcal, omschrijving, verborgen). Indexen NOOIT verschuiven: nieuwe items achteraan,
  // oude items verbergen (h = true) zodat oude invoer zijn naam en teller houdt.
  function I(n, k, d, h) { return { c: '', n: n, k: k, d: d || '', h: !!h }; }
  var G = {
    OP: { t: 'Bij opstaan', items: [
      I('Proteïne drinkyoghurt, 250 ml', 107), I('Banaan, half', 55, '', true),
      I('Rauwkost of snoepgroente', 35, 'ook augurken en zilveruitjes')] },
    LU: { t: 'Lunch zonder brood', items: [
      I('Tonijnsalade, halve portie', 70), I('Tonijnsalade, hele portie', 140),
      I('Eiersalade, halve portie', 148), I('Eiersalade, hele portie', 295),
      I('Zalm, 100 g gerookt + 2 kleine laagjes mayo', 257, 'brood kies je los erbij')] },
    ND: { t: 'Blok 3 · Drinken', items: [
      I('Melk met cacao', 105, '', true), I('Melk met limonadesiroop', 88, '', true), I('Proteïne drinkyoghurt, 250 ml', 107),
      I('Maaltijdshake, half flesje 250 ml', 250, 'bij een kleiner maximum: 200 ml'),
      I('Melk, 250 ml', 88, 'siroop kies je bij Kleine dingen'),
      I('Eiwitpoeder, 15 g', 55, 'mousse of shake', true), I('Eiwitpoeder, 30 g', 110, 'als shake of mousse', true),
      I('Eiwitpoeder', 110, 'voor shake of mousse')] },
    NE: { t: 'Blok 3 · Eten', items: [
      I('Snee brood', 85), I('Cottage cheese, 32 g', 29, '', true), I('Cottage cheese met fruit, 32 g', 31, '', true),
      I('Smeerkaas, 30 g', 41, '', true), I('Plakje kipfilet of ham', 13, '', true), I('Gekookt ei, half', 37, '', true), I('Gekookt ei, heel', 74, '', true),
      I('Melba toastje, per stuk', 13), I('Cracker (rogge of volkoren), per stuk', 33),
      I('Rijstwafel, per stuk', 27),
      I('Pindakaas, mespunt (± 5 g)', 33, '', true),
      I('Pindakaas, theelepel (± 10 g)', 66, '', true),
      I('Gebroken lijnzaad', 48, 'maximaal 2 el per dag'),
      I('Melba toast, 3 stuks', 39, 'half pakje'),
      I('Melba toast, 1 pakje (6 stuks)', 77),
      I('Smeerkaas, 25 g', 34, 'voor op brood of toast', true),
      I('Cottage cheese, 25 g', 23, 'voor op toast', true),
      I('Cottage cheese, 50 g', 46, 'voor op een snee', true),
      I('Cottage cheese met fruit, 50 g', 48, 'appel-kaneel, perzik of mango', true),
      I('Half plakje kipfilet of ham', 7, 'ham of kipfilet', true),
      I('Crunchy muesli, 10 g', 42, 'bijvoorbeeld door kwark', true),
      I('Crunchy muesli, 25 g', 106, 'bijvoorbeeld door kwark', true),
      I('Gekookt ei', 74, 'per stuk (0,5 kan ook)'),
      I('Kipfilet of ham', 13, 'per plakje (0,5 kan ook)'),
      I('Cottage cheese', 46, 'voor op brood of toast'),
      I('Cottage cheese met fruit', 48, 'appel-kaneel, perzik of mango'),
      I('Smeerkaas', 34, 'voor op brood of toast'),
      I('Pindakaas', 60, 'voor op brood of cracker'),
      I('Crunchy muesli', 42, 'door kwark of yoghurt')] },
    NF: { t: 'Blok 3 · Fruit en groente', items: [
      I('Peer, heel', 85), I('Vijgen, 100 g', 64), I('Mango, 100 g', 60), I('Kiwi', 55), I('Dragon fruit, 100 g', 55),
      I('Appelmoes 0%, 100 g', 52), I('Banaan, kwart', 28, '', true), I('Banaan, half', 55, '', true), I('Banaan, heel', 110, '', true),
      I('Banaan', 110, 'per stuk (0,5 of 0,25 kan ook)')] },
    NA: { t: 'Blok 3 · Avond en snacks', items: [
      I('Eigen muffin', 100, 'cottage cheese los erbij kiezen'),
      I('Kwark-Fris avond', 160, 'kwark met fruit en muesli'), I('Kwark-Fris weekend', 242, 'kwark met fruit en muesli'),
      I('Chips of proteïne-crisps', 100, '', true),
      I('IJS, 50 g (± 86 ml)', 71, 'Lidl High Protein', true), I('IJS, 100 g (± 172 ml)', 142, '', true), I('IJS, hele pot (290 g)', 412, '', true),
      I('IJs', 71, 'Lidl High Protein')] },
    NK: { t: 'Blok 3 · Kleine dingen', items: [
      I('Mandarijn, 1 stuk', 35), I('Aardbeien of frambozen, tot 100 g', 35),
      I('Rauwkost of snoepgroente', 35, 'cherrytomaatjes, komkommer, paprika, zilveruitjes, augurken'),
      I('Cacao, 1 theelepel', 17, 'voor in melk of mousse'), I('Limonadesiroop, suikervrij', 0)] }
  };
  var SIZES = [50, 100, 150, 250, 400, 600];
  var SW = { 50: 'Heel klein', 100: 'Klein', 150: 'Middel', 250: 'Groot', 400: 'Heel groot', 600: 'Zeer groot' };
  // ingrediënten voor recepten: [naam, eenheid, kcal per eenheid, standaardhoeveelheid]
  var ING_DB = [['Eiwitpoeder', 'g', 3.667, 25], ['Kwark Bayernkrone eiwitrijk', 'g', 0.66, 100], ['Magere kwark', 'g', 0.52, 100],
    ['Pure cacao', 'g', 3.4, 5], ['Cottage cheese', 'g', 0.91, 50], ['Cottage cheese met fruit', 'g', 0.97, 50],
    ['Melk (mager)', 'ml', 0.352, 250], ['Banaan', 'stuk', 110, 1], ['Gekookt ei', 'stuk', 74, 1], ['Ham, plakje', 'stuk', 13, 1], ['Snee brood', 'stuk', 85, 1],
    ['Crunchy muesli', 'g', 4.22, 10], ['Frambozen (diepvries)', 'g', 0.48, 50],
    // v9: nieuwe ingrediënten, alleen achteraan toevoegen
    ['Kwark', 'g', 0.60, 100], ['Smeerkaas', 'g', 1.36, 25], ['Pindakaas', 'g', 5.97, 5], ['Havermout', 'g', 3.76, 30],
    ['Gebroken lijnzaad', 'g', 4.77, 10], ['Appel (Elstar)', 'g', 0.59, 150], ['Kipfilet, plakje', 'stuk', 13, 1],
    ['Proteïne drinkyoghurt', 'ml', 0.428, 250], ['Mini mozzarella light', 'g', 1.65, 30], ['Tomatenpuree', 'g', 0.97, 20],
    ['Libanees brood volkoren', 'stuk', 143, 1], ['Cherrytomaten', 'g', 0.22, 50], ['Rundergehakt (gewoon)', 'g', 2.26, 125],
    ['Basmatirijst (droog)', 'g', 3.55, 75], ['Boerenkool, gesneden', 'g', 0.33, 200], ['Stamppot-aardappelen, geschild', 'g', 0.77, 200]];
  // Groep per ingrediënt (zelfde volgorde als ING_DB), voor het uitklapbare keuzelijstje
  var ING_GRP = ['Overig', 'Zuivel', 'Zuivel', 'Overig', 'Zuivel', 'Zuivel', 'Zuivel', 'Groente en fruit', 'Vlees, ei en beleg', 'Vlees, ei en beleg', 'Brood en granen',
    'Brood en granen', 'Groente en fruit',
    'Zuivel', 'Zuivel', 'Vlees, ei en beleg', 'Brood en granen', 'Overig', 'Groente en fruit', 'Vlees, ei en beleg', 'Zuivel', 'Zuivel', 'Groente en fruit', 'Brood en granen',
    'Groente en fruit', 'Vlees, ei en beleg', 'Brood en granen', 'Groente en fruit', 'Groente en fruit'];
  var ING_GRPS = ['Zuivel', 'Brood en granen', 'Vlees, ei en beleg', 'Groente en fruit', 'Overig'];
  // Waar een recept verschijnt: groepen van momenten. Geen keuze = bij elk moment.
  var RGROUPS = [
    { id: 'ochtend', t: 'Ochtend', slots: ['opst', 'ont', 'pz', 'wont', 'wtus', 'och', 'okb'] },
    { id: 'lunch', t: 'Lunch', slots: ['lun', 'kl', 'lm'] },
    { id: 'middag', t: 'Middag', slots: ['mid', 'mdg', 'sport', 'ovb'] },
    { id: 'avondeten', t: 'Avondeten', slots: ['av'] },
    { id: 'avondblok', t: 'Avondblok', slots: ['ab'] },
    { id: 'extra', t: 'Extra en nacht', slots: ['extra', 'nacht'] }
  ];
  function groupOfSlot(slot) { for (var i = 0; i < RGROUPS.length; i++) if (RGROUPS[i].slots.indexOf(slot) >= 0) return RGROUPS[i].id; return ''; }
  function rWhere(r) { return (r.where || []).filter(function (w) { return RGROUPS.some(function (g) { return g.id === w; }); }); }
  // Maxima per moment uit het schema van 7 oktober. Je kunt ze aanpassen bij Mijn regels (S.maxes).
