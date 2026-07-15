// VIGIE — pipeline de scoring des zones à risque.
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
import { fetchZoneSignals } from './sources/gdelt.mjs';
import { fetchAsam } from './sources/asam.mjs';
import { fetchGdacs } from './sources/gdacs.mjs';
import { fetchUsgs } from './sources/usgs.mjs';
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
console.log(`VIGIE pipeline — ${ZONES.length} zones — ${OFFLINE ? 'HORS-LIGNE (scores de base)' : 'en ligne'}`);
let asam = [], gdacs = [], usgs = [];
const srcOk = { asam: false, gdacs: false, usgs: false, gdelt: 0 };
if (!OFFLINE) {
  try { asam = await fetchAsam(); srcOk.asam = true; console.log(`ASAM  : ${asam.length} incidents (90 j)`); }
  catch (e) { console.warn(`ASAM  : ÉCHEC — ${e.message}`); }
  try { gdacs = await fetchGdacs(); srcOk.gdacs = true; console.log(`GDACS : ${gdacs.length} alertes orange/rouge`); }
  catch (e) { console.warn(`GDACS : ÉCHEC — ${e.message}`); }
  try { usgs = await fetchUsgs(); srcOk.usgs = true; console.log(`USGS  : ${usgs.length} séismes ≥4.5 (24 h)`); }
  catch (e) { console.warn(`USGS  : ÉCHEC — ${e.message}`); }
}

// ---------- date FR courte ----------
const frDate = ms => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

// ---------- calcul zone par zone ----------
const zonesOut = [];
for (const z of ZONES) {
  const p = prev[z.id] || {};
  const parts = { base: r1(clamp(z.base + (z.jwc ? 1 : 0), 0, 4)), mar: 0, con: 0, nat: 0, ten: 0 };
  const why = [];
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
    }
  } else { parts.mar = (p.parts && p.parts.mar) || 0; inc = p.inc || []; }

  // — catastrophes naturelles (GDACS + USGS) —
  if (srcOk.gdacs || srcOk.usgs) {
    let nat = 0;
    for (const g of gdacs) {
      if (havKm(g.lat, g.lon, z.c[0], z.c[1]) <= z.r * 1.5) {
        nat += g.level === 'red' ? 3 : 1.5;
        why.push(`alerte ${g.type} GDACS niveau ${g.level === 'red' ? 'rouge' : 'orange'}${g.name ? ` (${g.name})` : ''}`);
      }
    }
    for (const q of usgs) {
      if (q.mag >= 6 && havKm(q.lat, q.lon, z.c[0], z.c[1]) <= z.r * 1.2) {
        nat += Math.min(2, q.mag - 5.5) + (q.tsunami ? 2 : 0);
        why.push(`séisme M${q.mag.toFixed(1)}${q.tsunami ? ' avec alerte tsunami' : ''} — ${q.place}`);
      }
    }
    parts.nat = r1(Math.min(3, nat));
  } else { parts.nat = (p.parts && p.parts.nat) || 0; }

  // — presse mondiale (GDELT) : un appel par zone, analyse des titres —
  if (!OFFLINE) {
    const g = await fetchZoneSignals(z);
    if (g.ok) {
      srcOk.gdelt++;
      parts.con = r1(Math.min(2.5, 2.5 * g.conflict / 10));   // titres "conflit" sur 3 j
      parts.ten = r1(Math.min(1.5, 1.5 * g.count / 35));      // attention médiatique
      if (g.conflict >= 5)
        why.push(`actualité conflictuelle : ${g.conflict} titres évoquant attaques ou tensions en 3 j`);
      else if (g.conflict >= 2)
        why.push(`signaux conflictuels dans la presse (${g.conflict} titres en 3 j)`);
      if (g.count >= 30) why.push('très forte attention médiatique sur la zone');
      hl = g.headlines.length ? g.headlines : (p.hl || []);
    } else {
      parts.con = (p.parts && p.parts.con) || 0;
      parts.ten = (p.parts && p.parts.ten) || 0;
      hl = p.hl || [];
    }
  } else { parts.con = 0; parts.ten = 0; hl = []; }

  if (z.jwc) why.push('zone listée par les assureurs de guerre (Joint War Committee)');
  if (why.length === 0) why.push('aucun signal dynamique notable — risque structurel de fond');

  const score = r1(clamp(parts.base + parts.mar + parts.con + parts.nat + parts.ten, 0, 10));

  // — tendance vs il y a ~7 jours —
  let trend = '▶';
  const target = Date.now() - 7 * 86400000;
  const past = history.entries
    .filter(e => e.s[z.id] != null)
    .sort((a, b) => Math.abs(a.t - target) - Math.abs(b.t - target))[0];
  if (past) {
    const d = score - past.s[z.id];
    trend = d >= 0.7 ? '▲' : d <= -0.7 ? '▼' : '▶';
  }

  // — familles actives (puces de la fiche) —
  const f = [];
  if (parts.mar >= 0.5) f.push('Incidents maritimes');
  if (parts.con >= 0.8) f.push('Conflit armé');
  if (parts.nat >= 1) f.push('Catastrophe naturelle');
  if (parts.ten >= 0.7) f.push('Attention médiatique');
  if (z.jwc) f.push('Zone JWC');
  if (!f.length) f.push(z.type === 'détroit' ? 'Passage stratégique' : 'Veille de fond');

  zonesOut.push({ id: z.id, name: z.name, c: z.c, r: z.r, type: z.type, jwc: z.jwc,
    score, trend, parts, why, hl, inc, ctx: z.ctx, f });
  console.log(`  ${z.id.padEnd(14)} score ${score}  [base ${parts.base} mar ${parts.mar} con ${parts.con} nat ${parts.nat} ten ${parts.ten}] ${trend}`);
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
