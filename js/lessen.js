// Lessenpagina: uitleg, quiz, automatisch gecontroleerde praktijkopdracht en voortgang.
import * as M from './markt.js';
import { P } from './portefeuille.js';
import { LESSEN } from '../data/lessen.js';
import { $, $$, lees, schrijf } from './hulp.js';

const KEY = 'papier.lessen.v1';
const V = lees(KEY, { quiz: {}, taak: {}, selectie: [] });
V.quiz ||= {}; V.taak ||= {}; V.selectie ||= [];
const bewaar = () => schrijf(KEY, V);

const soort = (id) => M.ASSET[id].soort;
const CHECKS = {
  selecteer3: () => V.selectie.length >= 3,
  limiet: () => P.stats.limiet >= 1,
  koop: () => P.stats.kopen >= 1,
  drie: () => Object.keys(P.pos).length >= 3,
  stop: () => P.stats.stop >= 1,
  mix: () => { const s = Object.keys(P.pos).map(soort); return s.includes('crypto') && s.includes('aandeel'); },
};

function controleer() {
  let nieuw = false;
  for (const l of LESSEN) {
    if (!V.taak[l.taak.id] && CHECKS[l.taak.id]()) {
      V.taak[l.taak.id] = true; nieuw = true;
      M.meld('les-taak', l);
    }
  }
  if (nieuw) { bewaar(); toon(); }
}
const klaar = (l) => !!V.taak[l.taak.id] && l.quiz.every((_, i) => V.quiz[`${l.id}:${i}`] != null);

M.bus.addEventListener('selecteer', (e) => {
  if (!V.selectie.includes(e.detail)) { V.selectie.push(e.detail); bewaar(); controleer(); }
});
M.bus.addEventListener('order', controleer);
M.bus.addEventListener('ui-tick', controleer);

function toon() {
  const open = $$('.les[open]').map((d) => d.dataset.id);
  const nKlaar = LESSEN.filter(klaar).length;
  $('#lessen').innerHTML = `
    <div class="les-kop"><h2>Lessen</h2><p>${nKlaar} van ${LESSEN.length} lessen voltooid. Maak de quiz en voer de opdracht uit in de echte app: de site controleert die vanzelf.</p>
      <div class="voortgang" role="progressbar" aria-valuemin="0" aria-valuemax="${LESSEN.length}" aria-valuenow="${nKlaar}"><i style="width:${(nKlaar / LESSEN.length) * 100}%"></i></div></div>
    ${LESSEN.map((l, n) => `
    <details class="les" data-id="${l.id}"${open.includes(l.id) ? ' open' : ''}>
      <summary><span class="nr mono">${n + 1}</span><span class="lt"><b>${l.titel}</b><small>${l.samenvatting}</small></span><span class="badge ${klaar(l) ? 'klaar' : ''}">${klaar(l) ? '✓ Voltooid' : 'Open'}</span></summary>
      <div class="les-inhoud">
        ${l.uitleg.map((p) => `<p>${p}</p>`).join('')}
        <h4>Quiz</h4>
        ${l.quiz.map((q, i) => { const k = `${l.id}:${i}`, g = V.quiz[k]; return `
          <fieldset class="vraag-blok" data-k="${k}"><legend>${i + 1}. ${q.vraag}</legend>
            ${q.opties.map((o, j) => `<label class="optie${g != null && j === q.juist ? ' goed' : ''}${g === j && j !== q.juist ? ' fout' : ''}"><input type="radio" name="${k}" value="${j}"${g === j ? ' checked' : ''}${g != null ? ' disabled' : ''}> <span>${o}${g != null && j === q.juist ? ' <b>(goed)</b>' : ''}${g === j && j !== q.juist ? ' <b>(fout)</b>' : ''}</span></label>`).join('')}
            ${g != null ? `<p class="uitleg-ant">${g === q.juist ? '✓ Goed. ' : '✕ Niet helemaal. '}${q.uitleg}</p>` : ''}
          </fieldset>`; }).join('')}
        <h4>Praktijkopdracht</h4>
        <p class="opdracht ${V.taak[l.taak.id] ? 'klaar' : ''}"><span aria-hidden="true">${V.taak[l.taak.id] ? '✓' : '○'}</span> ${l.taak.tekst} <b>${V.taak[l.taak.id] ? '(gedaan)' : '(nog niet gedaan)'}</b></p>
        ${V.taak[l.taak.id] ? '' : '<button type="button" class="knop-klein" data-naar-markt>Naar de markt</button>'}
      </div>
    </details>`).join('')}`;
}
$('#lessen').addEventListener('change', (e) => {
  const r = e.target.closest('input[type=radio]');
  if (!r) return;
  const k = r.name;
  if (V.quiz[k] != null) return;
  V.quiz[k] = +r.value; bewaar(); toon();
  const open = $(`.les[data-id="${k.split(':')[0]}"]`); if (open) open.open = true;
});
$('#lessen').addEventListener('click', (e) => { if (e.target.closest('[data-naar-markt]')) M.meld('zet-weergave', 'markt'); });
toon();
