// Orderpaneel: invullen, orderoverzicht, bevestigen en de orderbon.
import * as M from './markt.js';
import * as PF from './portefeuille.js';
import { INSTELLINGEN } from '../data/assets.js';
import { $, $$, activeerTips } from './hulp.js';

const S = { id: null, kant: 'koop', type: 'markt', modus: 'aantal' };
const floor6 = (x) => Math.floor(x * 1e6 + 1e-7) / 1e6;
const parse = (t) => parseFloat(String(t).replace(/\s/g, '').replace(',', '.'));
const dec = (x, d) => x.toFixed(d).replace('.', ',');
const A = () => M.ASSET[S.id];
const TYPES = { markt: 'Market', limit: 'Limit', stop: 'Stop-loss' };

function refPrijs() {
  const k = M.koers(S.id);
  if (S.type === 'markt') return S.kant === 'koop' ? k.ask : k.bid;
  return parse($('#op-prijs').value);
}
function bepaalQty() {
  const raw = parse($('#op-invoer').value);
  if (!(raw > 0)) return NaN;
  if (S.modus === 'aantal') return floor6(raw);
  const p = refPrijs();
  if (!(p > 0)) return NaN;
  if (S.kant === 'koop') {
    const net = A().soort === 'crypto' ? raw / (1 + INSTELLINGEN.kosten.crypto.pct) : raw - INSTELLINGEN.kosten.aandeel.vast;
    return net > 0 ? floor6(net / p) : NaN;
  }
  return floor6(raw / p);
}
const order = () => ({ id: S.id, kant: S.kant, type: S.type, qty: bepaalQty(), prijs: S.type === 'markt' ? null : parse($('#op-prijs').value) });

function standaardPrijs() {
  const k = M.koers(S.id), d = A().dec + (A().prijs < 1 ? 2 : 0);
  $('#op-prijs').value = dec(S.type === 'stop' ? k.bid * 0.97 : S.kant === 'koop' ? k.ask * 0.99 : k.bid * 1.01, d);
}

function toonVelden() {
  $$('#op-kant button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kant === S.kant)));
  $$('#op-type button').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.type === S.type)); if (b.dataset.type === 'stop') b.disabled = S.kant === 'koop'; });
  $$('#op-modus button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modus === S.modus)));
  $('#lbl-prijs').hidden = S.type === 'markt';
  $('#lbl-prijs-tekst').textContent = S.type === 'limit' ? 'Limietprijs (€)' : 'Stopprijs (€)';
  $('#op-type-tip').dataset.begrip = S.type === 'markt' ? 'market' : S.type === 'limit' ? 'limit' : 'stop';
  $('#op-type-tip').setAttribute('aria-label', 'Uitleg: ' + TYPES[S.type]);
  $('#lbl-invoer-tekst').textContent = S.modus === 'aantal' ? `Aantal ${A().id}` : S.kant === 'koop' ? 'Bedrag dat je uitgeeft (€)' : 'Verkoopwaarde (€)';
  $('#op-submit').textContent = S.kant === 'koop' ? `Koop ${A().id}` : `Verkoop ${A().id}`;
  $('#op-submit').className = 'hoofdknop ' + S.kant;
  $$('.mobiel-balk button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kant === S.kant)));
}

function overzicht() {
  const o = order(), ok = o.qty > 0 && (o.type === 'markt' || o.prijs > 0);
  const e = ok ? PF.schat(o) : null, a = A();
  $('#ov-label-prijs').textContent = S.type === 'markt' ? (S.kant === 'koop' ? 'Verwachte prijs (ask)' : 'Verwachte prijs (bid)') : S.type === 'limit' ? 'Limietprijs' : 'Stopprijs';
  $('#ov-prijs').textContent = e ? M.num(e.prijs, a.dec) : '-';
  $('#ov-aantal').textContent = ok ? M.aantalStr(o.qty) : '-';
  $('#ov-sub').textContent = e ? M.eur(e.sub) : '-';
  $('#ov-kosten').textContent = e ? M.eur(e.fee) : '-';
  $('#ov-totaal-label').textContent = S.kant === 'koop' ? 'Totaal te betalen' : 'Je ontvangt';
  $('#ov-totaal').textContent = e ? M.eur(e.totaal) : '-';
  $('#op-beschikbaar').textContent = S.kant === 'koop' ? `Beschikbaar: ${M.eur(PF.vrijeCash())}` : `Beschikbaar om te verkopen: ${M.aantalStr(PF.vrijeQty(S.id))} ${S.id}`;
  const f = $('#op-invoer').value && ok ? PF.valideer(o) : null;
  $('#op-fout').textContent = f || '';
  const open = M.isOpen(S.id);
  $('#op-markt-dicht').hidden = open;
  $('#op-markt-dicht').textContent = open ? '' : 'Markt gesloten. Je kunt wel een limit-order of stop-loss klaarzetten.';
}

function vulPct(p) {
  const prijs = refPrijs() || M.koers(S.id).mid;
  let qty;
  if (S.kant === 'koop') {
    const b = PF.vrijeCash() * p, net = A().soort === 'crypto' ? b / (1 + INSTELLINGEN.kosten.crypto.pct) : b - INSTELLINGEN.kosten.aandeel.vast;
    qty = net > 0 ? floor6(net / prijs) : 0;
  } else qty = p === 1 ? PF.vrijeQty(S.id) : floor6(PF.vrijeQty(S.id) * p);
  if (S.modus === 'aantal') $('#op-invoer').value = qty ? dec(qty, 6).replace(/,?0+$/, '') : '';
  else $('#op-invoer').value = qty ? dec(Math.floor(qty * prijs * 100) / 100, 2) : '';
  overzicht();
}

// ---------- bevestigen ----------
const dlg = $('#bevestig');
$('#op-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const o = order(), f = PF.valideer(o);
  if (f) { $('#op-fout').textContent = f; return; }
  const s = PF.schat(o);
  $('#bv-titel').textContent = `${S.kant === 'koop' ? 'Koop' : 'Verkoop'} ${A().naam} (${S.id})`;
  $('#bv-lijst').innerHTML = `<dt>Ordertype</dt><dd>${TYPES[S.type]}</dd><dt>${$('#ov-label-prijs').textContent}</dt><dd>${M.num(s.prijs, A().dec)}</dd><dt>Aantal</dt><dd>${M.aantalStr(o.qty)}</dd><dt>Subtotaal</dt><dd>${M.eur(s.sub)}</dd><dt>Kosten</dt><dd>${M.eur(s.fee)}</dd><dt class="tot">${$('#ov-totaal-label').textContent}</dt><dd class="tot">${M.eur(s.totaal)}</dd>`;
  $('#bv-uitleg').textContent = S.type === 'markt' ? 'De order wordt direct uitgevoerd tegen de beste prijs. Dit is nepgeld.' : 'De order blijft openstaan tot de markt jouw prijs haalt. Je kunt hem altijd annuleren bij Portefeuille.';
  dlg.showModal();
});
$('#bv-terug').addEventListener('click', () => dlg.close());
$('#bv-ok').addEventListener('click', () => {
  const o = order(), r = PF.plaats(o);
  dlg.close();
  if (r.fout) { $('#op-fout').textContent = r.fout; return; }
  $('#op-invoer').value = '';
  $('#op-melding').textContent = o.type === 'markt' ? '' : `${TYPES[o.type]}-order geplaatst. Hij staat open bij Portefeuille.`;
  overzicht();
});

// ---------- orderbon ----------
let live = false, bonTimer = 0;
setTimeout(() => { live = true; }, 800);
function bon(o) {
  const h = $('#bon-houder'), a = M.ASSET[o.assetId];
  h.innerHTML = `<div class="bon" role="status"><div class="bon-kop">PAPIER - ORDERBON</div><div class="bon-regel"><span>Tijd</span><span>${M.tijd(o.tijdUit)}</span></div><div class="bon-regel"><span>Order</span><span>#${o.nr} ${o.kant === 'koop' ? 'KOOP' : 'VERKOOP'}</span></div><div class="bon-regel"><span>Asset</span><span>${a.id} ${a.naam}</span></div><div class="bon-regel"><span>Aantal</span><span>${M.aantalStr(o.qty)}</span></div><div class="bon-regel"><span>Prijs</span><span>${M.prijsStr(o.assetId, o.uitvoerPrijs)}</span></div><div class="bon-regel"><span>Kosten</span><span>${M.eur(o.kosten)}</span></div><div class="bon-regel tot"><span>${o.kant === 'koop' ? 'Totaal' : 'Ontvangen'}</span><span>${M.eur(o.totaal)}</span></div><div class="bon-voet">Fictief, geen echte transactie</div></div>`;
  h.className = 'bon-houder print';
  void h.offsetWidth;
  clearTimeout(bonTimer);
  bonTimer = setTimeout(() => { h.className = 'bon-houder weg'; bonTimer = setTimeout(() => { h.className = 'bon-houder'; h.innerHTML = ''; }, 600); }, 4000);
}
M.bus.addEventListener('order', (e) => {
  const d = e.detail;
  if (d.soort === 'gevuld' && live) bon(d.order);
  if (d.soort === 'gevuld' && live && d.order.type !== 'markt') $('#op-melding').textContent = `Order #${d.order.nr} is uitgevoerd.`;
  overzicht();
});

// ---------- bediening ----------
function kies(id) {
  S.id = id;
  $('#op-asset').textContent = `${A().naam} (${A().id})`;
  $('#op-invoer').value = ''; $('#op-melding').textContent = '';
  if (S.type !== 'markt') standaardPrijs();
  toonVelden(); overzicht();
}
M.bus.addEventListener('selecteer', (e) => kies(e.detail));
$$('#op-kant button').forEach((b) => b.addEventListener('click', () => zetKant(b.dataset.kant)));
function zetKant(k) {
  S.kant = k;
  if (k === 'koop' && S.type === 'stop') S.type = 'markt';
  if (S.type !== 'markt') standaardPrijs();
  $('#op-invoer').value = '';
  toonVelden(); overzicht();
}
$$('#op-type button').forEach((b) => b.addEventListener('click', () => { S.type = b.dataset.type; if (S.type !== 'markt') standaardPrijs(); toonVelden(); overzicht(); }));
$$('#op-modus button').forEach((b) => b.addEventListener('click', () => { S.modus = b.dataset.modus; $('#op-invoer').value = ''; toonVelden(); overzicht(); }));
$$('#op-pct button').forEach((b) => b.addEventListener('click', () => vulPct(+b.dataset.p)));
$('#op-invoer').addEventListener('input', overzicht);
$('#op-prijs').addEventListener('input', overzicht);
M.bus.addEventListener('ui-tick', overzicht);

// mobiel: orderpaneel als bottom sheet
const sheet = (aan) => { document.body.classList.toggle('sheet-open', aan); if (aan) $('#op-invoer').focus({ preventScroll: true }); };
export const openSheet = (k) => { if (k) zetKant(k); sheet(true); };
export const sluitSheet = () => sheet(false);
$$('.mobiel-balk button').forEach((b) => b.addEventListener('click', () => openSheet(b.dataset.kant)));
$('#op-sluit').addEventListener('click', () => sheet(false));
$('#sheet-schaduw').addEventListener('click', () => sheet(false));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('sheet-open') && !dlg.open) sheet(false); });
M.bus.addEventListener('open-sheet', (e) => (e.detail ? openSheet() : sluitSheet()));
activeerTips($('#orderpaneel'));
