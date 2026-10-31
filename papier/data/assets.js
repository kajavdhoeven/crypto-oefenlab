// Alle fictieve assets en instellingen op een plek. Alles hier is verzonnen.
export const INSTELLINGEN = {
  startKapitaal: 300,
  volMultiplier: 1.3,        // iets levendiger dan in het echt
  nieuwsGemiddeldSec: 1200,  // gemiddeld 1 nieuwsbericht per 20 gesimuleerde minuten
  maxInhaalDagen: 7,
  maxKaarsen: 4320,          // 3 dagen aan 1-minuut-candles
  startGeschiedenisDagen: 3,
  kosten: { crypto: { pct: 0.0025 }, aandeel: { vast: 0.5 } },
  beurs: { openMin: 9 * 60, sluitMin: 17 * 60 + 30, tijdzone: 'Europe/Amsterdam' },
  snelheden: [1, 10, 60],
};

// volDag = volatiliteit per dag (als fractie), driftDag = lichte trend per dag,
// spread = totale bid/ask-afstand als fractie van de koers, volume = euro per minuut (gemiddeld)
export const ASSETS = [
  { id: 'AUR', naam: 'Aurum', soort: 'crypto', rol: 'Digitaal goud', prijs: 41850, dec: 2, volDag: 0.03, driftDag: 0.0004, spread: 0.0012, volume: 90000, nieuws: 'goud' },
  { id: 'NBL', naam: 'Nebula Chain', soort: 'crypto', rol: 'Smart-contractmunt', prijs: 2315.4, dec: 2, volDag: 0.045, driftDag: 0.0005, spread: 0.002, volume: 60000, nieuws: 'smart' },
  { id: 'KWAK', naam: 'Kwakcoin', soort: 'crypto', rol: 'Memecoin', prijs: 0.0842, dec: 4, volDag: 0.12, driftDag: 0, spread: 0.01, volume: 25000, nieuws: 'meme' },
  { id: 'ANK', naam: 'Anker Euro', soort: 'crypto', rol: 'Stablecoin', prijs: 1, dec: 4, volDag: 0.0006, driftDag: 0, spread: 0.0004, volume: 70000, nieuws: 'stabiel', stabiel: true },
  { id: 'ZTX', naam: 'Zentrix Technologies', soort: 'aandeel', rol: 'Groot techbedrijf', prijs: 187.4, dec: 2, volDag: 0.022, driftDag: 0.0004, spread: 0.0015, volume: 50000, nieuws: 'tech' },
  { id: 'VLT', naam: 'Voltara Energie', soort: 'aandeel', rol: 'Energiebedrijf', prijs: 42.15, dec: 2, volDag: 0.018, driftDag: 0.0002, spread: 0.002, volume: 30000, nieuws: 'energie' },
  { id: 'BPL', naam: 'Boodschap Plus', soort: 'aandeel', rol: 'Supermarktketen', prijs: 31.8, dec: 2, volDag: 0.009, driftDag: 0.0002, spread: 0.0025, volume: 20000, nieuws: 'super' },
  { id: 'WIX', naam: 'Wereld Index ETF', soort: 'aandeel', rol: 'Index-ETF', prijs: 112.6, dec: 2, volDag: 0.011, driftDag: 0.0003, spread: 0.0008, volume: 45000, nieuws: 'index' },
];

// p = [min, max] in procenten (met teken)
export const NIEUWS = {
  goud: [
    { t: 'Grote vermogensbeheerder kondigt fonds aan', p: [3, 7] },
    { t: 'Strengere regels aangekondigd', p: [-6, -3] },
    { t: 'Netwerkactiviteit op recordhoogte', p: [2, 5] },
    { t: 'Grote houder verkoopt een flinke positie', p: [-5, -2] },
  ],
  smart: [
    { t: 'Update live: lagere transactiekosten', p: [4, 9] },
    { t: 'Beveiligingslek ontdekt in populaire app', p: [-12, -6] },
    { t: 'Bekend bedrijf bouwt op dit netwerk', p: [3, 8] },
  ],
  meme: [
    { t: 'Influencer plaatst grappige video', p: [10, 25] },
    { t: 'Handelsplatform stopt met promotie', p: [-25, -10] },
    { t: 'Grote houders verkopen', p: [-20, -8] },
    { t: 'Hype op sociale media explodeert', p: [12, 30] },
  ],
  stabiel: [
    { t: 'Kortstondige onrust op de markt', p: [-0.6, -0.2] },
    { t: 'Reserves bevestigd door controle', p: [0.2, 0.5] },
  ],
  tech: [
    { t: 'Kwartaalcijfers boven verwachting', p: [4, 8] },
    { t: 'Productlancering uitgesteld', p: [-7, -3] },
    { t: 'Grote nieuwe klant binnengehaald', p: [2, 5] },
    { t: 'Toezichthouder start onderzoek', p: [-5, -2] },
  ],
  energie: [
    { t: 'Olie- en gasprijzen stijgen', p: [2, 5] },
    { t: 'Storing bij grote installatie', p: [-6, -3] },
    { t: 'Overheid verhoogt subsidie voor groene energie', p: [2, 6] },
  ],
  super: [
    { t: 'Omzet in de feestmaand hoger dan verwacht', p: [1, 3] },
    { t: 'Prijzenoorlog tussen supermarkten', p: [-3, -1] },
  ],
  index: [
    { t: 'Rentebesluit valt mee voor de markt', p: [1, 2.5] },
    { t: 'Onrust in de wereldeconomie', p: [-2.5, -1] },
  ],
};
