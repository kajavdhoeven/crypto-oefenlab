// Alle lesteksten en begrippen op een plek.
export const BEGRIPPEN = {
  bid: 'Bid: de hoogste prijs die een koper nu wil betalen. Als jij verkoopt, krijg je (ongeveer) de bid.',
  ask: 'Ask: de laagste prijs waarvoor iemand nu wil verkopen. Als jij koopt, betaal je (ongeveer) de ask.',
  spread: 'Spread: het verschil tussen ask en bid. Dat is een verborgen kostenpost: je koopt iets duurder dan je het direct kunt verkopen.',
  orderboek: 'Orderboek: de lijst met openstaande kooporders (bids) en verkooporders (asks) rond de huidige koers.',
  market: 'Market-order: koop of verkoop meteen tegen de beste prijs die er nu is. Snel, maar je weet de prijs niet exact.',
  limit: 'Limit-order: je bepaalt de prijs. De order wordt alleen uitgevoerd als de markt jouw prijs (of beter) haalt.',
  stop: 'Stop-loss: een verkooporder die automatisch afgaat als de koers onder jouw stopprijs zakt. Zo beperk je je verlies.',
  ongerealiseerd: 'Ongerealiseerd: winst of verlies op papier. Het wordt pas echt (gerealiseerd) als je verkoopt.',
  gerealiseerd: 'Gerealiseerd: winst of verlies van posities die je al hebt verkocht.',
  candle: 'Candle: een staafje dat een tijdsperiode samenvat: open, hoogste, laagste en slotkoers. Het lichaam laat zien hoeveel de koers bewoog.',
  volatiliteit: 'Volatiliteit: hoe sterk een koers schommelt. Hoge volatiliteit betekent grote kansen en grote risico\'s.',
  stablecoin: 'Stablecoin: een munt die probeert op een vaste waarde te blijven, hier rond 1 euro. Weinig winst, weinig schommeling.',
  etf: 'ETF: een fonds dat in een hele mand aandelen tegelijk belegt. Daardoor ben je automatisch gespreid.',
  kosten: 'Kosten: crypto kost 0,25% per order, aandelen kosten 0,50 euro vast per order. Bij kleine bedragen is een vast bedrag relatief duur.',
};

// taak.id wordt automatisch gecontroleerd in js/lessen.js
export const LESSEN = [
  {
    id: 'koers', titel: 'Wat is een koers?', samenvatting: 'Bid, ask, spread en het orderboek',
    uitleg: [
      'Een koers is de prijs van de laatste transactie. Maar er is niet één prijs: kopers en verkopers hebben elk hun eigen prijs.',
      'De bid is de hoogste prijs die een koper nu biedt. De ask is de laagste prijs waarvoor iemand wil verkopen. Het verschil is de spread.',
      'Het orderboek toont alle wachtende biedingen en vraagprijzen rond de koers. Als jij een market-order plaatst, wordt die uitgevoerd tegen de beste prijs uit dat boek: je koopt tegen de ask en verkoopt tegen de bid.',
      'Een kleine spread betekent dat veel mensen handelen (liquide markt). Een grote spread, zoals bij de memecoin, kost je meer.',
    ],
    quiz: [
      { vraag: 'Je koopt met een market-order. Tegen welke prijs gebeurt dat?', opties: ['De bid', 'De ask', 'De gemiddelde prijs van gisteren'], juist: 1, uitleg: 'Kopers betalen de ask, de laagste prijs waarvoor iemand wil verkopen. Verkopers krijgen de bid.' },
      { vraag: 'Wat is de spread?', opties: ['Het verschil tussen ask en bid', 'De winst van de beurs per dag', 'Het aantal orders in het orderboek'], juist: 0, uitleg: 'De spread is ask min bid. Het is een verborgen kost: je koopt iets duurder dan je het meteen kunt verkopen.' },
      { vraag: 'Welke asset heeft in Papier de grootste spread?', opties: ['De stablecoin', 'De index-ETF', 'De memecoin'], juist: 2, uitleg: 'Bij weinig handel en grote schommelingen vragen marktpartijen een grotere marge. Daarom heeft de memecoin de grootste spread.' },
    ],
    taak: { id: 'selecteer3', tekst: 'Bekijk bid en ask van 3 verschillende assets door ze aan te klikken in de assetlijst.' },
  },
  {
    id: 'ordertypes', titel: 'Market-order of limit-order', samenvatting: 'Snel handelen of zelf de prijs bepalen',
    uitleg: [
      'Met een market-order koop of verkoop je meteen tegen de beste prijs die er nu is. Je weet zeker dat de order wordt uitgevoerd, maar niet precies tegen welke prijs.',
      'Met een limit-order bepaal je zelf de prijs. Een koop-limit op 100 euro wordt alleen uitgevoerd als je voor 100 euro of minder kunt kopen. Een verkoop-limit alleen voor die prijs of hoger.',
      'Het nadeel: de markt haalt jouw prijs misschien nooit. Dan blijft je order openstaan zonder dat er iets gebeurt.',
      'Aandelen kun je buiten handelstijden niet via een market-order kopen, maar wel als limit-order klaarzetten. Bij de opening wordt hij dan uitgevoerd als de prijs klopt.',
    ],
    quiz: [
      { vraag: 'Wanneer is een limit-order handig?', opties: ['Als je precies wilt bepalen tegen welke prijs je handelt', 'Als je zeker wilt weten dat de order meteen uitgevoerd wordt', 'Als je kosten wilt vermijden'], juist: 0, uitleg: 'Een limit-order geeft prijszekerheid, maar geen uitvoeringszekerheid.' },
      { vraag: 'De ask is 50 euro. Je plaatst een koop-limit op 48 euro. Wat gebeurt er?', opties: ['Direct gekocht voor 48', 'Direct gekocht voor 50', 'De order wacht tot de ask 48 of lager is'], juist: 2, uitleg: 'Je wilt maximaal 48 betalen. Zolang de ask hoger is, blijft de order openstaan.' },
      { vraag: 'Wat is een nadeel van een market-order?', opties: ['Hij wordt nooit uitgevoerd', 'Je weet de exacte prijs vooraf niet', 'Hij werkt alleen voor crypto'], juist: 1, uitleg: 'De prijs kan tussen klikken en uitvoeren verschuiven, zeker bij snelle markten.' },
    ],
    taak: { id: 'limiet', tekst: 'Plaats een limit-order (koop of verkoop).' },
  },
  {
    id: 'kosten', titel: 'Kosten en spread', samenvatting: 'Waarom je direct na kopen in de min staat',
    uitleg: [
      'Zodra je iets koopt, staat je portefeuille meestal licht in de min. Dat is geen foutje, het zijn de kosten van handelen.',
      'Je koopt tegen de ask, maar je portefeuille wordt gewaardeerd tegen de bid (wat je nu zou krijgen als je verkoopt). Het verschil is de spread. Daar komen de orderkosten bovenop: 0,25% bij crypto, 0,50 euro vast bij aandelen.',
      'Een vast bedrag is bij kleine orders relatief duur. 0,50 euro op een order van 20 euro is 2,5%. Op 200 euro is het 0,25%.',
      'Veel kopen en verkopen kost dus elke keer opnieuw. Daarom moet een koers eerst genoeg stijgen om je kosten terug te verdienen voordat je winst maakt.',
    ],
    quiz: [
      { vraag: 'Waarom staat je positie direct na een aankoop in de min?', opties: ['De spread en de orderkosten', 'Omdat de markt altijd daalt', 'Omdat de site fout rekent'], juist: 0, uitleg: 'Je betaalt de ask en kosten, maar je positie is bid-waarde. Dat verschil moet de koers eerst goedmaken.' },
      { vraag: 'Wat is relatief duurder: 0,50 euro vaste kosten op een order van 20 euro of van 200 euro?', opties: ['Van 20 euro', 'Van 200 euro', 'Hetzelfde'], juist: 0, uitleg: '0,50 op 20 is 2,5%, op 200 is 0,25%. Kleine orders met vaste kosten zijn duur.' },
    ],
    taak: { id: 'koop', tekst: 'Koop iets met een market-order en bekijk bij Portefeuille je ongerealiseerde resultaat.' },
  },
  {
    id: 'spreiden', titel: 'Spreiden', samenvatting: 'Niet alles op een asset',
    uitleg: [
      'Als je al je geld in een asset stopt, hangt je hele resultaat van die ene koers af. Gaat het mis, dan heb je geen vangnet.',
      'Spreiden betekent je geld verdelen over assets die niet precies hetzelfde bewegen: bijvoorbeeld crypto en aandelen, groot en klein, risicovol en rustig.',
      'Een index-ETF doet dit voor je: één product dat een hele mand aandelen volgt. Een rustig aandeel zoals een supermarktketen dempt de schommelingen van een memecoin.',
      'Spreiden voorkomt niet dat je verliest, maar het maakt de kans kleiner dat één slechte keuze alles kost. Let wel op: bij elke aankoop betaal je kosten, dus meer assets betekent ook meer kosten.',
    ],
    quiz: [
      { vraag: 'Wat is het belangrijkste doel van spreiden?', opties: ['Altijd winst maken', 'Het effect van een enkele tegenvaller beperken', 'Minder kosten betalen'], juist: 1, uitleg: 'Spreiden verlaagt het risico dat één asset je hele resultaat bepaalt. Winst garandeert het niet.' },
      { vraag: 'Welke combinatie is het best gespreid?', opties: ['Alleen de memecoin', 'Memecoin en een andere crypto', 'Een crypto, een ETF en een rustig aandeel'], juist: 2, uitleg: 'Verschillende soorten assets bewegen niet allemaal tegelijk dezelfde kant op.' },
    ],
    taak: { id: 'drie', tekst: 'Bezit tegelijk minstens 3 verschillende assets in je portefeuille.' },
  },
  {
    id: 'stoploss', titel: 'Risico beperken met een stop-loss', samenvatting: 'Automatisch verkopen als het misgaat',
    uitleg: [
      'Een stop-loss is een verkooporder die pas afgaat als de koers onder jouw stopprijs zakt. Zo hoef je niet de hele dag naar de koers te kijken.',
      'Stel: je koopt voor 100 euro en zet een stop-loss op 90. Zakt de koers naar 90, dan verkoopt Papier automatisch en is je verlies beperkt tot ongeveer 10 procent.',
      'Let op: na het activeren wordt het een market-order. Bij een plotselinge daling, bijvoorbeeld door slecht nieuws, kan de uitvoerprijs dus lager liggen dan je stopprijs.',
      'Zet je stop niet te dicht op de koers: normale schommelingen activeren hem dan onnodig. Een stop-loss is een vangnet, geen garantie.',
    ],
    quiz: [
      { vraag: 'Wat doet een stop-loss?', opties: ['Hij koopt extra als de koers daalt', 'Hij verkoopt automatisch als de koers onder je stopprijs zakt', 'Hij voorkomt altijd verlies'], juist: 1, uitleg: 'Het is een automatische verkooporder die je verlies beperkt, maar niet garandeert.' },
      { vraag: 'Waarom kan je uitvoerprijs lager zijn dan je stopprijs?', opties: ['Omdat de koers razendsnel daalt voordat de order uitgevoerd wordt', 'Omdat de site de prijs aanpast', 'Dat kan nooit'], juist: 0, uitleg: 'Na activeren wordt de order tegen de dan geldende bid uitgevoerd. Bij een koerssprong kan die lager zijn.' },
    ],
    taak: { id: 'stop', tekst: 'Koop iets en plaats daarna een stop-loss-order op je positie.' },
  },
  {
    id: 'crypto-aandelen', titel: 'Crypto vs aandelen en FOMO', samenvatting: 'Handelstijden, volatiliteit en emoties',
    uitleg: [
      'Crypto handelt 24/7. Aandelen alleen op werkdagen van 09:00 tot 17:30; erbuiten staat de koers stil. Nieuws buiten beurstijd kan dus zorgen voor een sprong bij de opening.',
      'Crypto is gemiddeld volatieler. Een memecoin kan in een uur 20 procent bewegen, een supermarktaandeel nauwelijks. Een stablecoin blijft rond 1 euro: weinig risico, ook weinig kans op winst.',
      'FOMO (fear of missing out) is de drang om in te stappen omdat een koers hard stijgt. Meestal koop je dan op de top. Paniekverkopen na een daling is het spiegelbeeld: je maakt een tijdelijk verlies definitief.',
      'Elke keer dat je op emotie handelt, betaal je spread en kosten. Een vooraf bedacht plan met limit-orders en een stop-loss beschermt je tegen jezelf.',
    ],
    quiz: [
      { vraag: 'Wat is FOMO?', opties: ['Een soort order', 'De angst iets te missen waardoor je achter een hype aan rent', 'Een kostenpost van crypto'], juist: 1, uitleg: 'Fear of missing out. Je koopt vaak na een stijging en daardoor te duur.' },
      { vraag: 'Wat gebeurt er met aandelen buiten handelstijden?', opties: ['De koers stijgt snel', 'De koers staat stil', 'Ze worden automatisch verkocht'], juist: 1, uitleg: 'Er is geen handel, dus geen nieuwe koers. Je kunt wel een limit-order klaarzetten.' },
      { vraag: 'Waarom kost paniekverkopen vaak geld?', opties: ['Je verkoopt na een daling en maakt het verlies definitief, plus je betaalt kosten', 'Er is een speciale boete', 'Verkopen kost altijd 10%'], juist: 0, uitleg: 'Koersen herstellen vaak, maar dat mis je als je al verkocht hebt. De kosten komen erbovenop.' },
    ],
    taak: { id: 'mix', tekst: 'Bezit tegelijk minstens een crypto en een aandeel (of ETF).' },
  },
];
