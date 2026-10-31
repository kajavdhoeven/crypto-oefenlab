// Zelf getekende grafieken op canvas: candlesticks met volume en een lijngrafiek.
const kl = () => {
  const s = getComputedStyle(document.documentElement);
  const g = (n) => s.getPropertyValue(n).trim();
  return { ink: g('--ink-2'), papier: g('--papier'), amber: g('--amber'), op: g('--stijgen'), neer: g('--dalen'), dim: g('--dim'), lijn: g('--lijn'), inkDiep: g('--ink') };
};
const MONO = '11px "IBM Plex Mono", ui-monospace, monospace';

class Doek {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.hover = null;
    const zet = (e) => { const r = canvas.getBoundingClientRect(); this.hover = { x: e.clientX - r.left, y: e.clientY - r.top }; this.teken(); };
    const weg = () => { this.hover = null; this.teken(); };
    canvas.addEventListener('pointermove', zet);
    canvas.addEventListener('pointerdown', zet);
    canvas.addEventListener('pointerleave', weg);
    canvas.addEventListener('pointercancel', weg);
    new ResizeObserver(() => this.teken()).observe(canvas);
    document.fonts?.ready.then(() => this.teken());
  }
  voorbereid() {
    const r = this.c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    const w = Math.max(10, Math.round(r.width)), h = Math.max(10, Math.round(r.height));
    if (this.c.width !== w * d || this.c.height !== h * d) { this.c.width = w * d; this.c.height = h * d; }
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    this.ctx.clearRect(0, 0, w, h);
    this.w = w; this.h = h; this.k = kl();
    this.ctx.font = MONO;
    return this.ctx;
  }
  label(c, tekst, x, y, bg, fg, uitlijn = 'left') {
    const b = c.measureText(tekst).width + 10;
    const bx = uitlijn === 'center' ? x - b / 2 : x;
    c.fillStyle = bg; c.fillRect(bx, y - 9, b, 18);
    c.fillStyle = fg; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(tekst, bx + 5, y);
  }
}

export class KaarsGrafiek extends Doek {
  // opt: { fp(prijs), ft(tijd), laatste }
  zet(kaarsen, opt) { this.kaarsen = kaarsen; this.opt = opt; this.teken(); }
  teken() {
    if (!this.kaarsen || !this.kaarsen.length) return;
    const c = this.voorbereid(), { w, h, k } = this, o = this.opt;
    const pr = 78, pb = 22, pt = 10, pw = w - pr, ph = h - pb - pt;
    const volH = ph * 0.18, prH = ph - volH - 8;
    const slot = w < 520 ? 7 : 9;
    const n = Math.max(5, Math.floor(pw / slot));
    const vis = this.kaarsen.slice(-n);
    let lo = Infinity, hi = -Infinity, vm = 0;
    for (const q of vis) { if (q[3] < lo) lo = q[3]; if (q[2] > hi) hi = q[2]; if (q[5] > vm) vm = q[5]; }
    const pad = (hi - lo || hi * 0.002) * 0.1; lo -= pad; hi += pad;
    const y = (p) => pt + ((hi - p) / (hi - lo)) * prH;
    const x0 = pw - vis.length * slot;
    c.textBaseline = 'middle'; c.textAlign = 'left';
    for (let i = 0; i <= 4; i++) {
      const p = lo + ((hi - lo) * i) / 4, yy = Math.round(y(p)) + 0.5;
      c.strokeStyle = k.lijn; c.lineWidth = 1; c.beginPath(); c.moveTo(0, yy); c.lineTo(pw, yy); c.stroke();
      c.fillStyle = k.dim; c.fillText(o.fp(p), pw + 8, yy);
    }
    const stapT = Math.ceil(100 / slot);
    c.textAlign = 'center';
    for (let i = vis.length - 1; i >= 0; i -= stapT) { c.fillStyle = k.dim; c.fillText(o.ft(vis[i][0]), x0 + i * slot + slot / 2, h - 9); }
    const bw = Math.max(3, Math.floor(slot * 0.62));
    vis.forEach((q, i) => {
      const cx = Math.round(x0 + i * slot + slot / 2), omhoog = q[4] >= q[1], kleur = omhoog ? k.op : k.neer;
      c.fillStyle = kleur; c.globalAlpha = 0.35;
      const vh = vm ? (q[5] / vm) * volH : 0;
      c.fillRect(cx - bw / 2, pt + ph - vh, bw, vh);
      c.globalAlpha = 1;
      c.strokeStyle = kleur; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx + 0.5, y(q[2])); c.lineTo(cx + 0.5, y(q[3])); c.stroke();
      const yt = y(Math.max(q[1], q[4])), yb = y(Math.min(q[1], q[4]));
      c.fillRect(Math.round(cx - bw / 2), yt, bw, Math.max(1, yb - yt));
    });
    if (o.laatste != null) {
      const yl = Math.min(pt + prH, Math.max(pt, y(o.laatste)));
      c.setLineDash([3, 3]); c.strokeStyle = k.amber; c.beginPath(); c.moveTo(0, yl); c.lineTo(pw, yl); c.stroke(); c.setLineDash([]);
      this.label(c, o.fp(o.laatste), pw + 2, yl, k.amber, k.inkDiep);
    }
    const hv = this.hover;
    if (hv && hv.x >= 0 && hv.x <= pw && hv.y >= pt && hv.y <= pt + ph) {
      const i = Math.min(vis.length - 1, Math.max(0, Math.floor((hv.x - x0) / slot)));
      const q = vis[i], cx = x0 + i * slot + slot / 2;
      c.setLineDash([4, 4]); c.strokeStyle = k.papier; c.globalAlpha = 0.6; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx, pt); c.lineTo(cx, pt + ph); c.moveTo(0, hv.y); c.lineTo(pw, hv.y); c.stroke();
      c.setLineDash([]); c.globalAlpha = 1;
      if (hv.y <= pt + prH) this.label(c, o.fp(hi - ((hv.y - pt) / prH) * (hi - lo)), pw + 2, hv.y, k.papier, k.inkDiep);
      this.label(c, o.ft(q[0]), Math.min(Math.max(cx, 30), pw - 30), h - 9, k.papier, k.inkDiep, 'center');
      const tekst = `O ${o.fp(q[1])}  H ${o.fp(q[2])}  L ${o.fp(q[3])}  S ${o.fp(q[4])}  V ${Math.round(q[5]).toLocaleString('nl-NL')}`;
      c.textAlign = 'left'; c.textBaseline = 'top';
      const tw = c.measureText(tekst).width + 12;
      c.fillStyle = k.inkDiep; c.globalAlpha = 0.85; c.fillRect(4, 4, tw, 20); c.globalAlpha = 1;
      c.fillStyle = k.papier; c.fillText(tekst, 10, 8);
    }
  }
}

export class LijnGrafiek extends Doek {
  // opt: { basis, fe(euro), ft(tijd) }
  zet(punten, opt) { this.p = punten; this.opt = opt; this.teken(); }
  teken() {
    if (!this.p || !this.p.length) return;
    const c = this.voorbereid(), { w, h, k } = this, o = this.opt, p = this.p;
    const pr = 78, pb = 20, pt = 10, pw = w - pr, ph = h - pb - pt;
    let lo = o.basis, hi = o.basis;
    for (const q of p) { if (q.v < lo) lo = q.v; if (q.v > hi) hi = q.v; }
    const pad = (hi - lo || 1) * 0.15; lo -= pad; hi += pad;
    const t0 = p[0].t, t1 = p[p.length - 1].t || t0 + 1;
    const x = (t) => (t1 === t0 ? pw : ((t - t0) / (t1 - t0)) * pw);
    const y = (v) => pt + ((hi - v) / (hi - lo)) * ph;
    c.textBaseline = 'middle'; c.textAlign = 'left';
    for (let i = 0; i <= 3; i++) {
      const v = lo + ((hi - lo) * i) / 3, yy = Math.round(y(v)) + 0.5;
      c.strokeStyle = k.lijn; c.lineWidth = 1; c.beginPath(); c.moveTo(0, yy); c.lineTo(pw, yy); c.stroke();
      c.fillStyle = k.dim; c.fillText(o.fe(v), pw + 8, yy);
    }
    c.setLineDash([4, 4]); c.strokeStyle = k.dim; c.beginPath(); c.moveTo(0, y(o.basis)); c.lineTo(pw, y(o.basis)); c.stroke(); c.setLineDash([]);
    c.beginPath();
    p.forEach((q, i) => (i ? c.lineTo(x(q.t), y(q.v)) : c.moveTo(x(q.t), y(q.v))));
    c.strokeStyle = k.amber; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke();
    c.lineTo(x(t1), pt + ph); c.lineTo(x(t0), pt + ph); c.closePath(); c.fillStyle = k.amber; c.globalAlpha = 0.08; c.fill(); c.globalAlpha = 1;
    c.textAlign = 'center'; c.fillStyle = k.dim;
    c.fillText(o.ft(t0), 28, h - 8); c.fillText(o.ft(t1), pw - 28, h - 8);
    const hv = this.hover;
    if (hv && hv.x >= 0 && hv.x <= pw) {
      let b = p[0], d = Infinity;
      for (const q of p) { const dd = Math.abs(x(q.t) - hv.x); if (dd < d) { d = dd; b = q; } }
      const cx = x(b.t), cy = y(b.v);
      c.strokeStyle = k.papier; c.globalAlpha = 0.5; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(cx, pt); c.lineTo(cx, pt + ph); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
      c.fillStyle = k.papier; c.beginPath(); c.arc(cx, cy, 4, 0, 7); c.fill();
      const tekst = `${o.fe(b.v)}  ${o.ft(b.t)}`;
      const tw = c.measureText(tekst).width + 12, tx = Math.min(Math.max(cx - tw / 2, 2), pw - tw);
      c.fillStyle = k.papier; c.fillRect(tx, pt, tw, 20); c.fillStyle = k.inkDiep; c.textAlign = 'left'; c.fillText(tekst, tx + 6, pt + 10);
    }
  }
}
