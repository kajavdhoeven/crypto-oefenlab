// Marktsimulatie: GBM-koersen, candles, nieuws, handelstijden, orderboek, inhaalslag.
import { ASSETS, INSTELLINGEN, NIEUWS } from '../data/assets.js';

const KEY = 'papier.markt.v1';
const DAG = 86400000;
export const bus = new EventTarget();
export const meld = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
export const ASSET = Object.fromEntries(ASSETS.map((a) => [a.id, a]));
export const staat = { simTime: 0, snelheid: 1, assets: {}, nieuws: [] };
const haken = [];
export const registreerStap = (fn) => haken.push(fn);

// ---------- formatteren ----------
const nfCache = {};
export const num = (n, d = 2) => (nfCache[d] ||= new Intl.NumberFormat('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d })).format(n);
export const eur = (n, d = 2) => (n < 0 && Math.round(Math.abs(n) * 10 ** d) > 0 ? '-' : '') + '€ ' + num(Math.abs(n), d);
export const aantalStr = (q) => (nfCache.q ||= new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 6 })).format(q);
export const pct = (n) => (n < 0 ? '-' : '+') + num(Math.abs(n), 2) + '%';
export const pijl = (n) => (n > 0 ? '▲' : n < 0 ? '▼' : '●');
export const teken = (n) => (n > 0 ? 'op' : n < 0 ? 'neer' : 'vlak');
export const prijsStr = (id, p) => num(p, ASSET[id].dec);

const tz = INSTELLINGEN.beurs.tijdzone;
const fTijd = new Intl.DateTimeFormat('nl-NL', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fKort = new Intl.DateTimeFormat('nl-NL', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
const fDag = new Intl.DateTimeFormat('nl-NL', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit' });
const fDatum = new Intl.DateTimeFormat('nl-NL', { timeZone: tz, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const tijd = (t) => fTijd.format(t);
export const tijdKort = (t) => fKort.format(t);
export const dagTijd = (t) => fDag.format(t);
export const datumTijd = (t) => fDatum.format(t);

// ---------- handelstijden ----------
const fDelen = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
function openRuw(t) {
  const p = {};
  for (const x of fDelen.formatToParts(t)) p[x.type] = x.value;
  const min = +p.hour * 60 + +p.minute;
  return p.weekday !== 'Sat' && p.weekday !== 'Sun' && min >= INSTELLINGEN.beurs.openMin && min < INSTELLINGEN.beurs.sluitMin;
}
let cM = -1, cO = false;
export function beursOpen(t = staat.simTime) {
  const m = Math.floor(t / 60000);
  if (m !== cM) { cM = m; cO = openRuw(t); }
  return cO;
}
let volgende = 0;
export function volgendeOpening(t = staat.simTime) {
  if (volgende > t) return volgende;
  let x = Math.floor(t / 900000) * 900000;
  for (let i = 0; i < 700 && !openRuw(x); i++) x += 900000;
  volgende = x;
  return x;
}
export const isOpen = (id) => ASSET[id].soort === 'crypto' || beursOpen();

// ---------- simulatie ----------
function gauss() {
  let u = 0;
  while (!u) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

function kaars(s, a, oud, nieuw, dt, z) {
  const t0 = Math.floor(staat.simTime / 60000) * 60000;
  let k = s.candles[s.candles.length - 1];
  if (!k || k[0] !== t0) {
    k = [t0, oud, Math.max(oud, nieuw), Math.min(oud, nieuw), nieuw, 0];
    s.candles.push(k);
    if (s.candles.length > INSTELLINGEN.maxKaarsen) s.candles.splice(0, s.candles.length - INSTELLINGEN.maxKaarsen);
  } else {
    if (nieuw > k[2]) k[2] = nieuw;
    if (nieuw < k[3]) k[3] = nieuw;
    k[4] = nieuw;
  }
  k[5] += ((a.volume * dt) / 60) * (0.6 + Math.random() * 0.8) * (1 + 0.3 * Math.abs(z));
}

function nieuwsFeit() {
  const open = beursOpen();
  const kand = ASSETS.filter((a) => a.soort === 'crypto' || open);
  const a = kand[Math.floor(Math.random() * kand.length)];
  const sets = NIEUWS[a.nieuws];
  const n = sets[Math.floor(Math.random() * sets.length)];
  const p = n.p[0] + Math.random() * (n.p[1] - n.p[0]);
  const s = staat.assets[a.id];
  const oud = s.prijs;
  s.prijs = oud * (1 + p / 100);
  kaart(s, a, oud, s.prijs);
  const txt = `${a.naam}: ${n.t}: ${p > 0 ? '+' : '-'}${num(Math.abs(p), 1)}%`;
  const item = { t: staat.simTime, id: a.id, tekst: txt, pct: p };
  staat.nieuws.unshift(item);
  if (staat.nieuws.length > 40) staat.nieuws.length = 40;
  meld('nieuws', item);
}
const kaart = (s, a, oud, nieuw) => kaars(s, a, oud, nieuw, 0, 0);

let stil = false; // true tijdens het opbouwen van de startgeschiedenis (geen nieuws)
function beweeg(dt) {
  staat.simTime += dt * 1000;
  const open = beursOpen();
  const dtD = dt / 86400;
  for (const a of ASSETS) {
    if (a.soort === 'aandeel' && !open) continue;
    const s = staat.assets[a.id];
    const oud = s.prijs;
    const sig = a.volDag * INSTELLINGEN.volMultiplier;
    const z = gauss();
    const nw = a.stabiel
      ? Math.max(0.5, oud + 20 * (a.prijs - oud) * dtD + sig * Math.sqrt(dtD) * z)
      : oud * Math.exp((a.driftDag - 0.5 * sig * sig) * dtD + sig * Math.sqrt(dtD) * z);
    s.prijs = nw;
    kaars(s, a, oud, nw, dt, z);
  }
  if (!stil && Math.random() < dt / INSTELLINGEN.nieuwsGemiddeldSec) nieuwsFeit();
}

function inhaal(minuten, metHaken = true) {
  for (let i = 0; i < minuten; i++) {
    for (let j = 0; j < 4; j++) beweeg(15);
    if (metHaken) for (const h of haken) h();
  }
}

function initieel() {
  staat.simTime = Date.now() - INSTELLINGEN.startGeschiedenisDagen * DAG;
  for (const a of ASSETS) staat.assets[a.id] = { prijs: a.prijs, candles: [] };
  staat.nieuws = [];
  stil = true;
  inhaal(INSTELLINGEN.startGeschiedenisDagen * 1440, false);
  stil = false;
}

export function laad() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch { /* leeg */ }
  const rapport = { minuten: 0 };
  if (d && d.v === 1 && d.assets && ASSETS.every((a) => d.assets[a.id] && d.assets[a.id].candles.length)) {
    staat.simTime = d.simTime;
    staat.assets = d.assets;
    staat.nieuws = d.nieuws || [];
    const gap = Math.min(Date.now() - d.lastReal, INSTELLINGEN.maxInhaalDagen * DAG);
    rapport.minuten = Math.max(0, Math.floor(gap / 60000));
    if (rapport.minuten >= 2) inhaal(rapport.minuten);
  } else initieel();
  return rapport;
}

export function bewaar() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, simTime: staat.simTime, lastReal: Date.now(), assets: staat.assets, nieuws: staat.nieuws }));
  } catch { /* vol of geblokkeerd */ }
}

export function zetSnelheid(n) { staat.snelheid = n; meld('snelheid', n); }

let laatste = Date.now();
function tik() {
  const nu = Date.now();
  const dt = nu - laatste;
  laatste = nu;
  if (dt > 5000) {
    // tabblad sliep: inhalen in minuten
    inhaal(Math.min(Math.floor((dt * staat.snelheid) / 60000), INSTELLINGEN.maxInhaalDagen * 1440));
  } else {
    const n = Math.max(1, Math.round(dt / 1000)) * staat.snelheid;
    for (let i = 0; i < n; i++) beweeg(1);
    for (const h of haken) h();
  }
  meld('tick');
}
export function start() {
  setInterval(tik, 1000);
  setInterval(bewaar, 15000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) bewaar(); else tik(); });
  addEventListener('pagehide', bewaar);
}

// ---------- uitlezen ----------
export function koers(id) {
  const p = staat.assets[id].prijs, h = ASSET[id].spread / 2;
  return { mid: p, bid: p * (1 - h), ask: p * (1 + h) };
}

export function verandering24u(id) {
  const c = staat.assets[id].candles;
  const doel = staat.simTime - DAG;
  let lo = 0, hi = c.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (c[m][0] <= doel) lo = m; else hi = m - 1; }
  const basis = c[lo][1];
  const nu = staat.assets[id].prijs;
  return { abs: nu - basis, pct: ((nu - basis) / basis) * 100 };
}

export function kaarsen(id, tf) {
  const c = staat.assets[id].candles;
  const m = { '1m': 1, '5m': 5, '1u': 60 }[tf];
  if (m === 1) return c;
  const ms = m * 60000, uit = [];
  let cur = null;
  for (const k of c) {
    const b = Math.floor(k[0] / ms) * ms;
    if (!cur || cur[0] !== b) { cur = [b, k[1], k[2], k[3], k[4], k[5]]; uit.push(cur); }
    else { if (k[2] > cur[2]) cur[2] = k[2]; if (k[3] < cur[3]) cur[3] = k[3]; cur[4] = k[4]; cur[5] += k[5]; }
  }
  return uit;
}

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function orderboek(id) {
  const a = ASSET[id], k = koers(id);
  const bucket = Math.floor(staat.simTime / 4000);
  const seed = [...id].reduce((x, c) => x * 31 + c.charCodeAt(0), 7) + bucket * 977;
  const r = mulberry(seed);
  const basis = a.volume / 20, stap = a.spread * 0.5;
  const rij = (zijde, start) => Array.from({ length: 8 }, (_, i) => {
    const prijs = start * (1 + zijde * i * stap);
    return { prijs, aantal: (basis * (0.3 + r() * 1.2) * (1 + i * 0.15)) / prijs };
  });
  return { asks: rij(1, k.ask), bids: rij(-1, k.bid) };
}
