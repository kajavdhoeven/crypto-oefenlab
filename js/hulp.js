// Kleine gedeelde hulpjes: selectors, opslag en tooltips (?-icoontjes).
import { BEGRIPPEN } from '../data/lessen.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const lees = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
export const schrijf = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* geblokkeerd */ } };

const tip = document.createElement('div');
tip.className = 'tooltip'; tip.hidden = true; tip.id = 'tooltip'; tip.setAttribute('role', 'tooltip');
document.body.append(tip);
let tipKnop = null;
function toonTip(knop) {
  tipKnop = knop;
  tip.textContent = BEGRIPPEN[knop.dataset.begrip] || '';
  tip.hidden = false;
  knop.setAttribute('aria-describedby', 'tooltip');
  knop.setAttribute('aria-expanded', 'true');
  const r = knop.getBoundingClientRect(), t = tip.getBoundingClientRect();
  tip.style.left = Math.max(8, Math.min(innerWidth - t.width - 8, r.left + r.width / 2 - t.width / 2)) + 'px';
  tip.style.top = (r.bottom + 8 + t.height > innerHeight ? r.top - t.height - 8 : r.bottom + 8) + 'px';
}
function verbergTip() { tip.hidden = true; if (tipKnop) tipKnop.setAttribute('aria-expanded', 'false'); tipKnop = null; }
export function activeerTips(root = document) {
  $$('.vraag[data-begrip]', root).forEach((k) => {
    if (k.dataset.klaar) return;
    k.dataset.klaar = '1';
    k.addEventListener('mouseenter', () => toonTip(k));
    k.addEventListener('mouseleave', verbergTip);
    k.addEventListener('focus', () => toonTip(k));
    k.addEventListener('blur', verbergTip);
    k.addEventListener('click', (e) => { e.stopPropagation(); tipKnop === k && !tip.hidden ? verbergTip() : toonTip(k); });
  });
}
addEventListener('click', verbergTip);
addEventListener('keydown', (e) => { if (e.key === 'Escape') verbergTip(); });
addEventListener('scroll', verbergTip, { passive: true });
export const hulp = (b, label) => `<button type="button" class="vraag" data-begrip="${b}" aria-label="Uitleg: ${label || b}">?</button>`;

