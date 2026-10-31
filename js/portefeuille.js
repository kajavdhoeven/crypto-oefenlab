// Portefeuille: saldo, posities, orders (market/limit/stop), opslag, back-up en weergave.
import * as M from './markt.js';
import { INSTELLINGEN } from '../data/assets.js';
import { LijnGrafiek } from './grafiek.js';
import { $, $$, lees, schrijf, hulp, activeerTips } from './hulp.js';

const KEY = 'papier.portefeuille.v1';
const nieuw = () => ({ v: 1, cash: INSTELLINGEN.startKapitaal, pos: {}, orders: [], volgnr: 1, gerealiseerd: 0, waarde: [], stats: { markt: 0, limiet: 0, stop: 0, kopen: 0, verkopen: 0 } });
const opgeslagen = lees(KEY, null);
export const P = opgeslagen && opgeslagen.v === 1 && typeof opgeslagen.cash === 'number' ? opgeslagen : nieuw();
const bewaar = () => schrijf(KEY, P);

// ---------- rekenen ----------
export const kosten = (id, sub) => (M.ASSET[id].soort === 'crypto' ? sub * INSTELLINGEN.kosten.crypto.pct : INSTELLINGEN.kosten.aandeel.vast);
const open = (f) => P.orders.filter((o) => o.status === 'open' && f(o));
export const vrijeCash = () => P.cash - open((o) => o.kant === 'koop').reduce((s, o) => s + o.gereserveerd, 0);
export const bezit = (id) => P.pos[id]?.qty || 0;
export const vrijeQty = (id) => bezit(id) - open((o) => o.kant === 'verkoop' && o.assetId === id).reduce((s, o) => s + o.qty, 0);
export const gevuldAantal = () => P.orders.filter((o) => o.status === 'gevuld').length;

export function schat({ id, kant, type, qty, prijs }) {
  const k = M.koers(id);
  const p = type === 'markt' ? (kant === 'koop' ? k.ask : k.bid) : prijs;
  const sub = qty * p, fee = kosten(id, sub);
  return { prijs: p, sub, fee, totaal: kant === 'koop' ? sub + fee : sub - fee };
}

export function valideer(o) {
  if (!(o.qty > 0)) return 'Vul een aantal of bedrag in.';
  if (o.type !== 'markt' && !(o.prijs > 0)) return 'Vul een geldige prijs in.';
  const e = schat(o), k = M.koers(o.id), a = M.ASSET[o.id];
  if (e.sub < 1) return 'Een order moet minimaal € 1,00 waard zijn.';
  if (o.type === 'markt' && !M.isOpen(o.id)) return 'Markt gesloten: aandelen kun je nu alleen als limit-order klaarzetten.';
  if (o.type === 'stop') {
    if (o.kant !== 'verkoop') return 'Een stop-loss is een verkooporder.';
    if (o.prijs >= k.bid) return `De stopprijs moet onder de huidige bid liggen (${M.num(k.bid, a.dec)}).`;
  }
  if (o.kant === 'koop') {
    if (e.totaal > vrijeCash() + 1e-9) return `Onvoldoende saldo: beschikbaar ${M.eur(vrijeCash())}, nodig ${M.eur(e.totaal)}.`;
  } else {
    if (o.qty > vrijeQty(o.id) + 1e-9) return `Je kunt niet meer verkopen dan je hebt (beschikbaar: ${M.aantalStr(vrijeQty(o.id))} ${o.id}).`;
    if (e.totaal <= 0) return 'De kosten zijn hoger dan de opbrengst.';
  }
  return null;
}

function sluit(o, status, reden) {
  o.status = status; o.tijdUit = M.staat.simTime; o.gereserveerd = 0;
  if (reden) o.reden = reden;
  M.meld('order', { soort: status === 'gevuld' ? 'gevuld' : 'geannuleerd', order: o });
  bewaar();
}

function vul(o, prijs) {
  const id = o.assetId, sub = o.qty * prijs, fee = kosten(id, sub);
  o.gereserveerd = 0;
  if (o.kant === 'koop') {
    const totaal = sub + fee;
    if (totaal > P.cash + 1e-9) return sluit(o, 'geannuleerd', 'Onvoldoende saldo bij uitvoering');
    P.cash -= totaal;
    const ps = P.pos[id] || (P.pos[id] = { qty: 0, kost: 0 });
    ps.qty += o.qty; ps.kost += totaal; P.stats.kopen++;
    o.totaal = totaal;
  } else {
    const ps = P.pos[id];
    if (!ps || ps.qty + 1e-9 < o.qty) return sluit(o, 'geannuleerd', 'Onvoldoende bezit bij uitvoering');
    const basis = (ps.kost / ps.qty) * o.qty, ontvangst = sub - fee;
    P.gerealiseerd += ontvangst - basis;
    ps.kost -= basis; ps.qty -= o.qty;
    if (ps.qty < 1e-9) delete P.pos[id];
    P.cash += ontvangst; P.stats.verkopen++;
    o.totaal = ontvangst; o.resultaat = ontvangst - basis;
  }
  o.uitvoerPrijs = prijs; o.kosten = fee;
  sluit(o, 'gevuld');
}

export function plaats(o) {
  const f = valideer(o);
  if (f) return { fout: f };
  const e = schat(o);
  const order = { nr: P.volgnr++, assetId: o.id, kant: o.kant, type: o.type, qty: o.qty, prijs: o.type === 'markt' ? null : o.prijs, status: 'open', tijd: M.staat.simTime, gereserveerd: o.kant === 'koop' ? e.totaal : 0 };
  P.orders.unshift(order);
  P.stats[{ markt: 'markt', limit: 'limiet', stop: 'stop' }[o.type]]++;
  M.meld('order', { soort: 'geplaatst', order });
  if (o.type === 'markt') vul(order, e.prijs); else controleer();
  bewaar();
  return { order };
}

export function annuleer(nr) {
  const o = P.orders.find((x) => x.nr === nr && x.status === 'open');
  if (o) sluit(o, 'geannuleerd', 'Door jou geannuleerd');
}

export function controleer() {
  for (const o of [...P.orders]) {
    if (o.status !== 'open' || !M.isOpen(o.assetId)) continue;
    const k = M.koers(o.assetId);
    if (o.type === 'limit') {
      if (o.kant === 'koop' && k.ask <= o.prijs) vul(o, k.ask);
      else if (o.kant === 'verkoop' && k.bid >= o.prijs) vul(o, k.bid);
    } else if (o.type === 'stop' && k.bid <= o.prijs) vul(o, k.bid);
  }
}

export const posWaarde = (id) => P.pos[id].qty * M.koers(id).bid;
export const totaal = () => P.cash + Object.keys(P.pos).reduce((s, id) => s + posWaarde(id), 0);
const ongerealiseerd = () => Object.keys(P.pos).reduce((s, id) => s + posWaarde(id) - P.pos[id].kost, 0);

function logWaarde() {
  const t = M.staat.simTime, v = totaal(), w = P.waarde, l = w[w.length - 1];
  if (l && Math.floor(l.t / 60000) === Math.floor(t / 60000)) { l.t = t; l.v = v; return; }
  w.push({ t, v });
  if (w.length > 3000) P.waarde = w.filter((_, i) => i % 2 === 0 || i > w.length / 2);
}
M.registreerStap(() => { controleer(); logWaarde(); });

// ---------- opslag: back-up, importeren, opnieuw beginnen ----------
export function exporteer() {
  const d = { papier: 1, gemaakt: new Date().toISOString(), portefeuille: P, markt: lees('papier.markt.v1', null), lessen: lees('papier.lessen.v1', null) };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' }));
  a.download = `papier-back-up-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export async function importeer(bestand) {
  let d;
  try { d = JSON.parse(await bestand.text()); } catch { return 'Dit is geen geldig back-upbestand.'; }
  if (!d || d.papier !== 1 || !d.portefeuille || typeof d.portefeuille.cash !== 'number' || !Array.isArray(d.portefeuille.orders)) return 'Dit bestand is geen Papier-back-up.';
  schrijf(KEY, d.portefeuille);
  if (d.markt) schrijf('papier.markt.v1', d.markt);
  if (d.lessen) schrijf('papier.lessen.v1', d.lessen);
  location.reload();
  return null;
}
export function opnieuw() {
  for (const k of Object.keys(P)) delete P[k];
  Object.assign(P, nieuw());
  logWaarde(); bewaar();
  M.meld('order', { soort: 'reset' });
}
export function init() {
  P.waarde = P.waarde.filter((w) => w.t > 1e12);
  if (!P.waarde.length) { logWaarde(); bewaar(); }
}

// ---------- weergave ----------
const rij = (c) => c.map((x) => `<td>${x}</td>`).join('');
const naam = (id) => `${M.ASSET[id].naam} <small class="mono">${id}</small>`;
const plTekst = (abs, p) => `${M.pijl(abs)} ${abs >= 0 ? '+' : '-'}${M.eur(Math.abs(abs))}${p == null ? '' : ` (${M.pct(p)})`}`;
const kleur = (n) => (Math.abs(n) < 0.005 ? 'vlak' : n > 0 ? 'op' : 'neer');
const tabelLeeg = (n, t) => `<tr><td colspan="${n}" class="leeg">${t}</td></tr>`;
const typeTekst = (o) => ({ markt: 'Market', limit: 'Limit', stop: 'Stop-loss' }[o.type]);

$('#portefeuille').innerHTML = `
  <div class="tegels">
    <div class="tegel"><span class="tl">Totaalwaarde</span><b class="mono" id="pf-totaal"></b><span class="mono sub" id="pf-start"></span></div>
    <div class="tegel"><span class="tl">Cash</span><b class="mono" id="pf-cash"></b><span class="mono sub" id="pf-res"></span></div>
    <div class="tegel"><span class="tl">Ongerealiseerd ${hulp('ongerealiseerd', 'ongerealiseerd')}</span><b class="mono" id="pf-ong"></b></div>
    <div class="tegel"><span class="tl">Gerealiseerd ${hulp('gerealiseerd', 'gerealiseerd')}</span><b class="mono" id="pf-ger"></b></div>
  </div>
  <div class="pf-blok"><h3 class="kopje">Totaalwaarde over tijd</h3><div class="pf-grafiek"><canvas id="pf-grafiek" role="img" aria-label="Lijngrafiek van je totaalwaarde over tijd"></canvas></div></div>
  <div class="pf-blok"><h3 class="kopje">Posities</h3><div class="tabel-wrap"><table><thead><tr><th scope="col">Asset</th><th scope="col">Aantal</th><th scope="col">Gem. prijs</th><th scope="col">Waarde</th><th scope="col">Winst/verlies</th><th scope="col"><span class="verborgen">Actie</span></th></tr></thead><tbody id="pf-pos"></tbody></table></div></div>
  <div class="pf-blok"><h3 class="kopje">Openstaande orders</h3><div class="tabel-wrap"><table><thead><tr><th scope="col">Nr</th><th scope="col">Asset</th><th scope="col">Order</th><th scope="col">Aantal</th><th scope="col">Prijs</th><th scope="col">Gereserveerd</th><th scope="col"><span class="verborgen">Actie</span></th></tr></thead><tbody id="pf-open"></tbody></table></div></div>
  <div class="pf-blok"><h3 class="kopje">Ordergeschiedenis</h3><div class="tabel-wrap hoog"><table><thead><tr><th scope="col">Nr</th><th scope="col">Tijd</th><th scope="col">Asset</th><th scope="col">Order</th><th scope="col">Aantal</th><th scope="col">Prijs</th><th scope="col">Kosten</th><th scope="col">Status</th></tr></thead><tbody id="pf-hist"></tbody></table></div></div>
  <div class="pf-blok backup">
    <button type="button" class="knop-klein" id="pf-export">Exporteer back-up</button>
    <button type="button" class="knop-klein" id="pf-import">Importeer back-up</button>
    <input type="file" id="pf-bestand" accept="application/json,.json" hidden>
    <button type="button" class="knop-klein gevaar" id="pf-reset">Opnieuw beginnen met ${M.eur(INSTELLINGEN.startKapitaal, 0)}</button>
    <p class="hint" id="pf-melding" role="status"></p>
  </div>`;
activeerTips($('#portefeuille'));

const lijn = new LijnGrafiek($('#pf-grafiek'));
let posSleutel = '';

function toonOrders() {
  $('#pf-open').innerHTML = open(() => true).map((o) => `<tr><td>${o.nr}</td><td>${naam(o.assetId)}</td><td>${o.kant === 'koop' ? 'Koop' : 'Verkoop'} ${typeTekst(o).toLowerCase()}</td><td>${M.aantalStr(o.qty)}</td><td>${M.prijsStr(o.assetId, o.prijs)}</td><td>${o.gereserveerd ? M.eur(o.gereserveerd) : '-'}</td><td><button type="button" class="knop-klein" data-annuleer="${o.nr}" aria-label="Annuleer order ${o.nr}">Annuleren</button></td></tr>`).join('') || tabelLeeg(7, 'Geen openstaande orders.');
  $('#pf-hist').innerHTML = P.orders.filter((o) => o.status !== 'open').slice(0, 100).map((o) => `<tr><td>${o.nr}</td><td>${M.datumTijd(o.tijdUit)}</td><td>${naam(o.assetId)}</td><td>${o.kant === 'koop' ? 'Koop' : 'Verkoop'} ${typeTekst(o).toLowerCase()}</td><td>${M.aantalStr(o.qty)}</td><td>${o.uitvoerPrijs ? M.prijsStr(o.assetId, o.uitvoerPrijs) : '-'}</td><td>${o.kosten != null ? M.eur(o.kosten) : '-'}</td><td>${o.status === 'gevuld' ? '✓ Uitgevoerd' : '✕ Geannuleerd' + (o.reden ? ` <small>(${o.reden})</small>` : '')}</td></tr>`).join('') || tabelLeeg(8, 'Nog geen uitgevoerde of geannuleerde orders.');
}

function toonPosities() {
  const ids = Object.keys(P.pos), sleutel = ids.join();
  const tb = $('#pf-pos');
  if (sleutel !== posSleutel) {
    posSleutel = sleutel;
    tb.innerHTML = ids.map((id) => `<tr data-id="${id}"><th scope="row">${naam(id)}</th><td data-c="qty"></td><td data-c="gem"></td><td data-c="w"></td><td data-c="pl"></td><td><button type="button" class="knop-klein" data-handel="${id}">Handel</button></td></tr>`).join('') || tabelLeeg(6, 'Je hebt nog geen posities. Koop iets op het tabblad Markt.');
  }
  for (const id of ids) {
    const ps = P.pos[id], tr = $(`tr[data-id="${id}"]`, tb), w = posWaarde(id), pl = w - ps.kost;
    $('[data-c=qty]', tr).textContent = M.aantalStr(ps.qty);
    $('[data-c=gem]', tr).textContent = M.prijsStr(id, ps.kost / ps.qty);
    $('[data-c=w]', tr).textContent = M.eur(w);
    const c = $('[data-c=pl]', tr); c.className = kleur(pl); c.textContent = plTekst(pl, (pl / ps.kost) * 100);
  }
}

export function toon() {
  const t = totaal(), res = t - INSTELLINGEN.startKapitaal, ong = ongerealiseerd();
  $('#pf-totaal').textContent = M.eur(t);
  $('#pf-start').className = 'mono sub ' + kleur(res);
  $('#pf-start').textContent = `${plTekst(res, (res / INSTELLINGEN.startKapitaal) * 100)} t.o.v. start`;
  $('#pf-cash').textContent = M.eur(P.cash);
  const gres = P.cash - vrijeCash();
  $('#pf-res').textContent = gres > 0 ? `waarvan ${M.eur(gres)} gereserveerd` : 'vrij te besteden';
  $('#pf-ong').className = 'mono ' + kleur(ong); $('#pf-ong').textContent = plTekst(ong);
  $('#pf-ger').className = 'mono ' + kleur(P.gerealiseerd); $('#pf-ger').textContent = plTekst(P.gerealiseerd);
  toonPosities();
  if ($('#portefeuille').offsetParent) lijn.zet([...P.waarde, { t: M.staat.simTime, v: t }], { basis: INSTELLINGEN.startKapitaal, fe: (v) => M.eur(v), ft: M.dagTijd });
}

$('#portefeuille').addEventListener('click', (e) => {
  const an = e.target.closest('[data-annuleer]'), ha = e.target.closest('[data-handel]');
  if (an) annuleer(+an.dataset.annuleer);
  if (ha) { M.meld('zet-asset', ha.dataset.handel); M.meld('zet-weergave', 'markt'); }
});
$('#pf-export').addEventListener('click', exporteer);
$('#pf-import').addEventListener('click', () => $('#pf-bestand').click());
$('#pf-bestand').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const fout = await importeer(f);
  if (fout) $('#pf-melding').textContent = fout;
});
$('#pf-reset').addEventListener('click', () => {
  if (confirm(`Weet je zeker dat je opnieuw wilt beginnen met ${M.eur(INSTELLINGEN.startKapitaal, 0)}? Je posities, orders en geschiedenis worden gewist. Je lesvoortgang blijft staan.`)) {
    opnieuw(); toonOrders(); toon();
    $('#pf-melding').textContent = 'Je bent opnieuw begonnen met 300 euro.';
  }
});
M.bus.addEventListener('order', () => { toonOrders(); toon(); });
M.bus.addEventListener('ui-tick', toon);
M.bus.addEventListener('weergave', () => requestAnimationFrame(toon));
toonOrders();
