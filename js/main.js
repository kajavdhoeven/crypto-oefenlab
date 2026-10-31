// Verbindt markt, grafiek en interface.
import * as M from './markt.js';
import { ASSETS } from '../data/assets.js';
import { KaarsGrafiek } from './grafiek.js';
import { $, $$, lees, schrijf, hulp, activeerTips } from './hulp.js';
import * as PF from './portefeuille.js';
import './orderpaneel.js';
import './lessen.js';
import { start as startTour } from './rondleiding.js';

const ui = lees('papier.ui', { gekozen: ASSETS[0].id, tf: '1m' });
if (!M.ASSET[ui.gekozen]) ui.gekozen = ASSETS[0].id;
export const gekozen = () => ui.gekozen;

const gevuldVoor = PF.gevuldAantal();
const rapport = M.laad();
rapport.gevuld = PF.gevuldAantal() - gevuldVoor;
PF.init();
M.start();

// ---------- tickerband ----------
const tkHtml = ASSETS.map((a) => `<span class="tk" data-id="${a.id}"><b>${a.id}</b><span class="tk-p"></span><span class="tk-c"></span></span>`).join('');
$('#tape').innerHTML = [0, 1, 2, 3].map((i) => `<div class="tape-set"${i ? ' aria-hidden="true"' : ''}>${tkHtml}</div>`).join('');

// ---------- assetlijst ----------
$('#assets').innerHTML = ASSETS.map((a) => `<li><button type="button" class="asset" data-id="${a.id}" aria-pressed="false">
  <span class="nm">${a.naam}<small>${a.id}</small></span><span class="pr"></span>
  <span class="rl">${a.rol}</span><span class="ch"></span><span class="zi" hidden>Markt gesloten</span></button></li>`).join('');
$('#assets').addEventListener('click', (e) => {
  const b = e.target.closest('.asset');
  if (b) kies(b.dataset.id);
});

function flits(el, nieuw) {
  const oud = +el.dataset.v;
  el.dataset.v = nieuw;
  if (!oud || oud === nieuw) return;
  const k = nieuw > oud ? 'flits-op' : 'flits-neer';
  el.classList.remove('flits-op', 'flits-neer');
  void el.offsetWidth;
  el.classList.add(k);
}
const kleurKlasse = (n) => M.teken(n);

// ---------- grafiek ----------
const grafiek = new KaarsGrafiek($('#grafiek'));
function tekenGrafiek() {
  const id = ui.gekozen, a = M.ASSET[id];
  const ft = ui.tf === '1u' ? M.dagTijd : M.tijdKort;
  grafiek.zet(M.kaarsen(id, ui.tf), { fp: (p) => M.num(p, a.dec), ft, laatste: M.staat.assets[id].prijs });
  $('#grafiek').setAttribute('aria-label', `Koersgrafiek van ${a.naam}, laatste koers ${M.eur(M.staat.assets[id].prijs, a.dec)}`);
}

// ---------- kies asset ----------
export function kies(id) {
  ui.gekozen = id; schrijf('papier.ui', ui);
  M.meld('selecteer', id);
  $$('.asset').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  const a = M.ASSET[id];
  $('#k-naam').textContent = `${a.naam} (${a.id})`;
  $('#k-rol').textContent = `${a.rol} - ${a.soort === 'crypto' ? 'crypto, 24/7 open' : 'aandeel, ma-vr 09:00-17:30'}`;
  toonTick();
}
$$('.tf button').forEach((b) => b.addEventListener('click', () => {
  ui.tf = b.dataset.tf; schrijf('papier.ui', ui);
  $$('.tf button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  tekenGrafiek();
}));
$$('.tf button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.tf === ui.tf)));

// ---------- orderboek en nieuws ----------
function tekenOrderboek() {
  const id = ui.gekozen, a = M.ASSET[id], ob = M.orderboek(id), k = M.koers(id);
  const max = Math.max(...ob.asks.map((x) => x.aantal), ...ob.bids.map((x) => x.aantal));
  const rij = (x, z) => `<div class="ob-rij ${z}"><i style="width:${(x.aantal / max) * 100}%"></i><span>${M.num(x.prijs, a.dec)}</span><span>${M.aantalStr(+x.aantal.toPrecision(3))}</span></div>`;
  $('#ob-asks').innerHTML = [...ob.asks].reverse().map((x) => rij(x, 'ask')).join('');
  $('#ob-bids').innerHTML = ob.bids.map((x) => rij(x, 'bid')).join('');
  $('#ob-mid').innerHTML = `Spread ${M.num(k.ask - k.bid, a.dec + 2)} (${M.num(((k.ask - k.bid) / k.mid) * 100, 2)}%) ${hulp('spread')}`;
  activeerTips($('#ob-mid'));
}
function tekenNieuws() {
  $('#nieuws').innerHTML = M.staat.nieuws.slice(0, 12).map((n) => `<li><time>${M.tijdKort(n.t)}</time><span class="${n.pct > 0 ? 'op' : 'neer'}">${M.pijl(n.pct)}</span> ${n.tekst}</li>`).join('') || '<li>Nog geen nieuws.</li>';
}
M.bus.addEventListener('nieuws', tekenNieuws);

// ---------- elke tick ----------
function toonTick() {
  const id = ui.gekozen, a = M.ASSET[id];
  for (const x of ASSETS) {
    const p = M.staat.assets[x.id].prijs, v = M.verandering24u(x.id);
    const t = kleurKlasse(v.pct);
    const b = $(`.asset[data-id="${x.id}"]`);
    const pr = $('.pr', b), ch = $('.ch', b);
    pr.textContent = M.num(p, x.dec); flits(pr, p);
    ch.className = 'ch ' + t; ch.textContent = `${M.pijl(v.pct)} ${M.pct(v.pct)}`;
    $('.zi', b).hidden = M.isOpen(x.id);
    $$(`.tk[data-id="${x.id}"]`).forEach((s) => {
      $('.tk-p', s).textContent = M.num(p, x.dec);
      const c = $('.tk-c', s); c.className = 'tk-c ' + t; c.textContent = `${M.pijl(v.pct)} ${M.pct(v.pct)}`;
    });
  }
  const p = M.staat.assets[id].prijs, k = M.koers(id), v = M.verandering24u(id);
  const kp = $('#k-prijs'); kp.textContent = M.eur(p, a.dec); flits(kp, p);
  const kv = $('#k-verschil'); kv.className = 'mono ' + kleurKlasse(v.pct);
  kv.textContent = `${M.pijl(v.pct)} ${v.abs >= 0 ? '+' : '-'}${M.num(Math.abs(v.abs), a.dec)} (${M.pct(v.pct)}) 24u`;
  const open = M.isOpen(id);
  $('#k-status').innerHTML = `<span>Bid <b class="mono">${M.num(k.bid, a.dec)}</b> ${hulp('bid')}</span><span>Ask <b class="mono">${M.num(k.ask, a.dec)}</b> ${hulp('ask')}</span><span>Spread <b class="mono">${M.num(((k.ask - k.bid) / k.mid) * 100, 2)}%</b> ${hulp('spread')}</span>` +
    (open ? '' : `<span class="st">Markt gesloten, opent ${M.dagTijd(M.volgendeOpening())}</span>`);
  activeerTips($('#k-status'));
  const g = $('#gesloten');
  g.hidden = open;
  if (!open) g.textContent = `Markt gesloten - opent ${M.dagTijd(M.volgendeOpening())}`;
  $('#klok').textContent = `${M.dagTijd(M.staat.simTime)} NL`;
  tekenGrafiek();
  tekenOrderboek();
  M.meld('ui-tick');
}
M.bus.addEventListener('tick', toonTick);

// ---------- weergave, snelheid, banner ----------
export function zetWeergave(v) {
  document.body.dataset.view = v;
  $$('.tab').forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.view === v)));
  M.meld('weergave', v);
  if (v !== 'lessen') requestAnimationFrame(() => tekenGrafiek());
}
$$('.tab').forEach((t) => t.addEventListener('click', () => zetWeergave(t.dataset.view)));
$$('.snelheid button').forEach((b) => b.addEventListener('click', () => {
  M.zetSnelheid(+b.dataset.s);
  $$('.snelheid button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));
export function toonBanner(tekst) {
  const b = $('#banner');
  b.hidden = false;
  b.innerHTML = `<span>${tekst}</span><button type="button">Sluiten</button>`;
  $('button', b).addEventListener('click', () => { b.hidden = true; });
}
if (rapport.minuten >= 2) {
  const u = Math.floor(rapport.minuten / 60), m = rapport.minuten % 60;
  toonBanner(`Welkom terug! De markt is ${u ? u + ' uur en ' : ''}${m} min doorgelopen terwijl je weg was.` + (rapport.gevuld ? ` Tijdens die tijd zijn ${rapport.gevuld} openstaande order(s) uitgevoerd. Zie je ordergeschiedenis.` : ''));
}

M.bus.addEventListener('zet-weergave', (e) => zetWeergave(e.detail));
M.bus.addEventListener('zet-asset', (e) => kies(e.detail));
activeerTips();
tekenNieuws();
kies(ui.gekozen);

import { eersteBezoek } from './rondleiding.js';
if (eersteBezoek()) setTimeout(startTour, 700);
