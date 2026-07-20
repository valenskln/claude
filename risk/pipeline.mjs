// Proteus.AI — pipeline de scoring des zones à risque.
// Usage : node risk/pipeline.mjs [--out chemin/risk.json] [--history chemin/history.json] [--offline]
//
// Toutes les heures (GitHub Actions) :
//   sources → score 0-10 par zone → tendance 7 j → explication FR → risk.json + history.json
//
// Robustesse : si une source tombe en panne, on réutilise la valeur du run
// précédent pour cette composante (pas de chute artificielle des scores).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { ZONES } from './zones.mjs';
import { fetchGlobalNews, zoneTerms, matchZone } from './sources/gdelt.mjs';
import { fetchAsam } from './sources/asam.mjs';
import { fetchGdacs } from './sources/gdacs.mjs';
import { fetchUsgs } from './sources/usgs.mjs';
import { fetchWaves } from './sources/meteo.mjs';
import { fetchStorms } from './sources/nhc.mjs';
import { havKm, decay } from './sources/util.mjs';

// ---------- arguments ----------
const args = process.argv.slice(2);
const arg = (k, dflt) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : dflt; };
const OUT = arg('--out', 'risk.json');
const HIST = arg('--history', 'history.json');
const OFFLINE = args.includes('--offline');

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const r1 = x => Math.round(x * 10) / 10;

// ---------- état précédent (repli en cas de panne d'une source) ----------
let prev = {};
try {
  if (existsSync(OUT)) {
    for (const z of JSON.parse(readFileSync(OUT, 'utf8')).zones || []) prev[z.id] = z;
  }
} catch { /* pas de précédent : premier run */ }

// ---------- historique (pour la tendance 7 jours) ----------
let history = { entries: [] };
try { if (existsSync(HIST)) history = JSON.parse(readFileSync(HIST, 'utf8')); } catch { }

// ---------- collecte des sources mondiales ----------
console.log(`Proteus.AI pipeline — ${ZONES.length} zones — ${OFFLINE ? 'HORS-LIGNE (scores de base)' : 'en ligne'}`);
let asam = [], gdacs = [], usgs = [], storms = [], waves = [];
const srcOk = { asam: false, gdacs: false, usgs: false, meteo: false, nhc: false, gdelt: 0 };
if (!OFFLINE) {
  try { asam = await fetchAsam(); srcOk.asam = true; console.log(`ASAM  : ${asam.length} incidents (90 j)`); }
  catch (e) { console.warn(`ASAM  : ÉCHEC — ${e.message}`); }
  try { gdacs = await fetchGdacs(); srcOk.gdacs = true; console.log(`GDACS : ${gdacs.length} alertes orange/rouge`); }
  catch (e) { console.warn(`GDACS : ÉCHEC — ${e.message}`); }
  try { usgs = await fetchUsgs(); srcOk.usgs = true; console.log(`USGS  : ${usgs.length} séismes ≥4.5 (24 h)`); }
  catch (e) { console.warn(`USGS  : ÉCHEC — ${e.message}`); }
  try { storms = await fetchStorms(); srcOk.nhc = true; console.log(`NHC   : ${storms.length} cyclones actifs`); }
  catch (e) { console.warn(`NHC   : ÉCHEC — ${e.message}`); }
  try { waves = await fetchWaves(ZONES); srcOk.meteo = true; console.log(`MÉTÉO : vagues max ${Math.max(...waves, 0)} m`); }
  catch (e) { console.warn(`MÉTÉO : ÉCHEC — ${e.message}`); }
}
// presse mondiale : UNE requête, puis tri local par zone
let news = null;
if (!OFFLINE) {
  try { news = await fetchGlobalNews(); srcOk.gdelt = true; }
  catch (e) { console.warn(`GDELT : ÉCHEC — ${e.message}`); }
}

// ---------- dates courtes FR / EN ----------
const frDate = ms => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const enDate = ms => new Date(ms).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

// ---------- calcul zone par zone ----------
const zonesOut = [];
for (let zi = 0; zi < ZONES.length; zi++) {
  const z = ZONES[zi];
  const p = prev[z.id] || {};
  const parts = { base: r1(clamp(z.base + (z.jwc ? 1 : 0), 0, 4)), mar: 0, con: 0, nat: 0, met: 0 };
  const why = [], why_en = [];
  let hl = [], inc = [];

  // — incidents maritimes (ASAM), décroissance demi-vie 14 j —
  if (srcOk.asam) {
    const near = asam.filter(a => havKm(a.lat, a.lon, z.c[0], z.c[1]) <= z.r * 1.2);
    const S = near.reduce((s, a) => s + decay(a.date, 14), 0);
    parts.mar = r1(Math.min(3.5, 3.5 * S / 4));
    inc = near.sort((a, b) => b.date - a.date).slice(0, 3)
      .map(a => ({ d: frDate(a.date), t: a.type || 'incident' }));
    if (near.length) {
      const last = near.sort((a, b) => b.date - a.date)[0];
      why.push(`${near.length} incident${near.length > 1 ? 's' : ''} maritime${near.length > 1 ? 's' : ''} recensé${near.length > 1 ? 's' : ''} en 90 j (dernier : ${frDate(last.date)} — ${last.type.toLowerCase()})`);
      why_en.push(`${near.length} maritime incident${near.length > 1 ? 's' : ''} recorded in the last 90 days (latest: ${enDate(last.date)} — ${last.type.toLowerCase()})`);
    }
  } else { parts.mar = (p.parts && p.parts.mar) || 0; inc = p.inc || []; }

  // — catastrophes naturelles (GDACS + USGS + cyclones NHC) —
  if (srcOk.gdacs || srcOk.usgs || srcOk.nhc) {
    let nat = 0;
    for (const g of gdacs) {
      if (havKm(g.lat, g.lon, z.c[0], z.c[1]) <= z.r * 1.5) {
        nat += g.level === 'red' ? 3 : 1.5;
        why.push(`alerte ${g.type} GDACS niveau ${g.level === 'red' ? 'rouge' : 'orange'}${g.name ? ` (${g.name})` : ''}`);
        why_en.push(`GDACS ${g.type_en} alert, ${g.level === 'red' ? 'red' : 'orange'} level${g.name ? ` (${g.name})` : ''}`);
      }
    }
    for (const q of usgs) {
      if (q.mag >= 6 && havKm(q.lat, q.lon, z.c[0], z.c[1]) <= z.r * 1.2) {
        nat += Math.min(2, q.mag - 5.5) + (q.tsunami ? 2 : 0);
        why.push(`séisme M${q.mag.toFixed(1)}${q.tsunami ? ' avec alerte tsunami' : ''} — ${q.place}`);
        why_en.push(`M${q.mag.toFixed(1)} earthquake${q.tsunami ? ' with tsunami alert' : ''} — ${q.place}`);
      }
    }
    for (const s of storms) {
      if (havKm(s.lat, s.lon, z.c[0], z.c[1]) <= z.r * 1.5) {
        nat += s.major ? 2 : 1;
        why.push(`${s.kind} ${s.name} en activité à proximité (NOAA)`);
        why_en.push(`${s.kind_en} ${s.name} active nearby (NOAA)`);
      }
    }
    parts.nat = r1(Math.min(3, nat));
  } else { parts.nat = (p.parts && p.parts.nat) || 0; }

  // — météo marine : vague maximale prévue sous 36 h au centre de zone —
  if (srcOk.meteo) {
    const w = waves[zi] || 0;
    parts.met = r1(w >= 9 ? 1.5 : w >= 7 ? 1.1 : w >= 5 ? 0.7 : w >= 4 ? 0.4 : 0);
    if (w >= 7) { why.push(`mer très dangereuse prévue : vagues jusqu'à ${w} m sous 36 h`); why_en.push(`very dangerous seas forecast: waves up to ${w} m within 36 h`); }
    else if (w >= 5) { why.push(`mer forte prévue : vagues jusqu'à ${w} m sous 36 h`); why_en.push(`rough seas forecast: waves up to ${w} m within 36 h`); }
  } else { parts.met = (p.parts && (p.parts.met ?? p.parts.ten)) || 0; }

  // — presse mondiale (GDELT) : correspondance locale zone ↔ articles —
  if (news) {
    const g = matchZone(news, zoneTerms(z));
    parts.con = r1(Math.min(2.5, 2.5 * g.conflict / 6));      // titres "conflit" sur 24 h
    if (g.conflict >= 4) {
      why.push(`actualité conflictuelle : ${g.conflict} titres évoquant attaques ou tensions en 24 h`);
      why_en.push(`conflict-related news: ${g.conflict} headlines mentioning attacks or tensions in 24 h`);
    } else if (g.conflict >= 2) {
      why.push(`signaux conflictuels dans la presse (${g.conflict} titres en 24 h)`);
      why_en.push(`conflict signals in the press (${g.conflict} headlines in 24 h)`);
    }
    hl = g.headlines.length ? g.headlines : (p.hl || []);
  } else if (!OFFLINE) {
    parts.con = (p.parts && p.parts.con) || 0;
    hl = p.hl || [];
  } else { parts.con = 0; hl = []; }

  if (z.jwc) { why.push('zone listée par les assureurs de guerre (Joint War Committee)'); why_en.push('zone listed by war risk underwriters (Joint War Committee)'); }
  if (why.length === 0) { why.push('aucun signal dynamique notable — risque structurel de fond'); why_en.push('no notable dynamic signal — baseline structural risk'); }

  const score = r1(clamp(parts.base + parts.mar + parts.con + parts.nat + parts.met, 0, 10));

  // — tendance vs il y a ~7 jours —
  // On n'affiche une vraie tendance que si on a un point d'historique
  // raisonnablement proche de 7 j (5,5 à 8,5 j) : sinon (historique encore
  // trop jeune, ou trou de plusieurs jours) on affiche "stable" plutôt que
  // de comparer à un point bien plus proche et fausser la tendance affichée.
  let trend = '▶';
  const target = Date.now() - 7 * 86400000;
  const past = history.entries
    .filter(e => e.s[z.id] != null && Math.abs(e.t - target) <= 1.5 * 86400000)
    .sort((a, b) => Math.abs(a.t - target) - Math.abs(b.t - target))[0];
  if (past) {
    const d = score - past.s[z.id];
    trend = d >= 0.7 ? '▲' : d <= -0.7 ? '▼' : '▶';
  }

  // — familles actives (puces de la fiche) —
  const f = [], f_en = [];
  if (parts.mar >= 0.5) { f.push('Incidents maritimes'); f_en.push('Maritime incidents'); }
  if (parts.con >= 0.8) { f.push('Conflit armé'); f_en.push('Armed conflict'); }
  if (parts.nat >= 1) { f.push('Catastrophe naturelle'); f_en.push('Natural disaster'); }
  if (parts.met >= 0.7) { f.push('Météo dangereuse'); f_en.push('Hazardous weather'); }
  if (z.jwc) { f.push('Zone JWC'); f_en.push('JWC-listed zone'); }
  if (!f.length) {
    f.push(z.type === 'détroit' ? 'Passage stratégique' : 'Veille de fond');
    f_en.push(z.type === 'détroit' ? 'Strategic chokepoint' : 'Baseline watch');
  }

  zonesOut.push({ id: z.id, name: z.name, name_en: z.name_en, c: z.c, r: z.r, type: z.type, jwc: z.jwc,
    score, trend, parts, why, why_en, hl, inc, ctx: z.ctx, ctx_en: z.ctx_en, f, f_en });
  console.log(`  ${z.id.padEnd(14)} score ${score}  [base ${parts.base} mar ${parts.mar} con ${parts.con} nat ${parts.nat} met ${parts.met}] ${trend}`);
}

// ---------- écriture ----------
const out = {
  v: 1,
  updatedAt: new Date().toISOString(),
  offline: OFFLINE || undefined,
  sources: srcOk,
  zones: zonesOut.sort((a, b) => b.score - a.score),
};
mkdirSync(dirname(OUT) || '.', { recursive: true });
writeFileSync(OUT, JSON.stringify(out));

history.entries.push({ t: Date.now(), s: Object.fromEntries(zonesOut.map(z => [z.id, z.score])) });
const cutoff = Date.now() - 90 * 86400000;
history.entries = history.entries.filter(e => e.t >= cutoff).slice(-2400);
writeFileSync(HIST, JSON.stringify(history));

console.log(`\nrisk.json écrit (${zonesOut.length} zones) — top 3 : ${out.zones.slice(0, 3).map(z => `${z.name} ${z.score}`).join(' · ')}`);
