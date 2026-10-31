// Rondleiding in 7 stappen met spotlight, bediening met toetsenbord.
import * as M from './markt.js';
import { $, lees, schrijf } from './hulp.js';

const mobiel = () => matchMedia('(max-width: 959px)').matches;
const STAPPEN = [
  { sel: '.tickerband', titel: 'De tickerband', tekst: 'Net als de oude papieren tickertape: alle koersen schuiven hier voorbij. De pijltjes en plus/min laten zien of een koers is gestegen of gedaald over 24 uur.', voor: () => M.meld('zet-weergave', 'markt') },
  { sel: '.assetlijst', titel: 'De assetlijst', tekst: 'Acht fictieve munten en aandelen. Klik er een aan om de grafiek te zien. Aandelen zijn buiten handelstijden gesloten, crypto is altijd open.' },
  { sel: '.grafiek-wrap', titel: 'De grafiek', tekst: 'Elke candle is een minuut (of 5 minuten, of een uur). Beweeg of tik over de grafiek voor open, hoog, laag en slot. Met 10x en 60x bovenin laat je de tijd sneller lopen.' },
  { sel: '.orderboek', titel: 'Het orderboek', tekst: 'Links de vraagprijzen (asks), eronder de biedingen (bids). Het gat daartussen is de spread: dat is wat je extra betaalt voor snel handelen.' },
  { sel: '.orderpaneel', titel: 'Het orderpaneel', tekst: 'Kies koop of verkoop, het ordertype en hoeveel. Je ziet vooraf de kosten en het totaal. Na uitvoering print er een orderbon.', voor: () => M.meld('open-sheet', true) },
  { sel: '#portefeuille', titel: 'Je portefeuille', tekst: 'Hier zie je je cash, posities, winst en verlies, openstaande orders en geschiedenis. Je begint met 300 euro nepgeld.', voor: () => { M.meld('open-sheet', false); M.meld('zet-weergave', 'portefeuille'); } },
  { sel: '#nav-lessen', titel: 'De lessen', tekst: 'Zes korte lessen met quiz en een opdracht die de site automatisch controleert. Begin bij les 1.', voor: () => M.meld('zet-weergave', 'markt') },
];

let i = 0, spot, kaart, vorigeFocus;
const klaarFlag = 'papier.rondleiding';

function plaats() {
  const s = STAPPEN[i];
  const el = $(s.sel);
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement ? 'instant' : 'auto' });
  const r = el.getBoundingClientRect(), p = 6;
  Object.assign(spot.style, { left: r.left - p + 'px', top: r.top - p + 'px', width: r.width + 2 * p + 'px', height: r.height + 2 * p + 'px' });
  const kh = kaart.offsetHeight, kw = kaart.offsetWidth;
  let top = r.bottom + 14;
  if (top + kh > innerHeight - 8) top = r.top - kh - 14;
  if (top < 8) top = Math.max(8, innerHeight - kh - 8);
  kaart.style.top = top + 'px';
  kaart.style.left = Math.max(12, Math.min(innerWidth - kw - 12, r.left + r.width / 2 - kw / 2)) + 'px';
}
function toon() {
  const s = STAPPEN[i];
  s.voor?.();
  kaart.innerHTML = `<h2 id="tour-titel">${s.titel}</h2><p>${s.tekst}</p><div class="tour-voet"><span class="tel">${i + 1} / ${STAPPEN.length}</span><button type="button" data-a="stop">Overslaan</button><button type="button" data-a="terug"${i ? '' : ' disabled'}>Terug</button><button type="button" class="vol" data-a="verder">${i === STAPPEN.length - 1 ? 'Klaar' : 'Volgende'}</button></div>`;
  $('[data-a=verder]', kaart).focus({ preventScroll: true });
  setTimeout(plaats, mobiel() && i === 4 ? 320 : 60);
}
function stop() {
  spot?.remove(); kaart?.remove(); spot = kaart = null;
  document.removeEventListener('keydown', toets);
  removeEventListener('resize', plaats);
  M.meld('open-sheet', false);
  schrijf(klaarFlag, true);
  vorigeFocus?.focus?.();
}
function toets(e) {
  if (e.key === 'ArrowRight' || e.key === 'Enter') { if (e.target.dataset?.a === 'stop' || e.key === 'ArrowRight') { e.preventDefault(); verder(); } else if (e.key === 'Enter' && !e.target.dataset?.a) verder(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); terug(); }
  else if (e.key === 'Escape') { e.stopPropagation(); stop(); }
  else if (e.key === 'Tab') { const b = [...kaart.querySelectorAll('button:not(:disabled)')], f = b[0], l = b[b.length - 1]; if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); } else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); } }
}
const verder = () => { if (i < STAPPEN.length - 1) { i++; toon(); } else stop(); };
const terug = () => { if (i > 0) { i--; toon(); } };

export function start() {
  if (spot) return;
  i = 0; vorigeFocus = document.activeElement;
  spot = document.createElement('div'); spot.className = 'tour-spot';
  kaart = document.createElement('div'); kaart.className = 'tour-kaart';
  kaart.setAttribute('role', 'dialog'); kaart.setAttribute('aria-modal', 'true'); kaart.setAttribute('aria-labelledby', 'tour-titel');
  document.body.append(spot, kaart);
  kaart.addEventListener('click', (e) => { const a = e.target.dataset?.a; if (a === 'stop') stop(); else if (a === 'terug') terug(); else if (a === 'verder') verder(); });
  document.addEventListener('keydown', toets);
  addEventListener('resize', plaats);
  toon();
}
$('#btn-tour').addEventListener('click', start);
export const eersteBezoek = () => !lees(klaarFlag, false);
