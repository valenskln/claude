// Assemble la vue focus 3D autonome d'une zone (prototype : Bab el-Mandeb).
// Usage : node proto/build-focus.js   ->   focus-zone-3d.html (racine du dépôt)
//
// La vue focus a sa PROPRE identité (« salle d'opérations ») : elle ne reprend volontairement
// ni les tokens ni les polices de la carte 2D.
// Injections, chacune remplacée UNE fois dans proto/focus-zone.html :
//   /*FONTS*/        -> proto/fonts-ops/*.woff2 (Chakra Petch, Barlow, JetBrains Mono — OFL)
//   //THREE_JS       -> proto/vendor/three-0.159.0.min.js
//   __FOCUS_DATA__   -> trait de côte découpé, couloirs, données réelles de la zone
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const d = __dirname;
const root = path.join(d, '..');
const ZONE_ID = 'bab-el-mandeb';
// Cadrage de la maquette : assez large pour contenir le cercle de 300 km de la zone.
const BBOX = { lonMin: 40.2, lonMax: 47.2, latMin: 9.6, latMax: 15.8 };

// ---------- données de la zone (instantané réel) ----------
const snap = JSON.parse(fs.readFileSync(path.join(d, 'risk-snapshot.json'), 'utf8'));
const zone = snap.zones.find(z => z.id === ZONE_ID);
if (!zone) throw new Error('zone introuvable dans le snapshot : ' + ZONE_ID);
const C = { lat: zone.c[0], lon: zone.c[1] };
const KX = Math.cos(C.lat * Math.PI / 180) * 111.32, KZ = 110.57;   // km par degré
const toKm = (lat, lon) => [+((lon - C.lon) * KX).toFixed(2), +(-(lat - C.lat) * KZ).toFixed(2)];
const toLL = ([x, z]) => [C.lat - z / KZ, C.lon + x / KX];

// ---------- trait de côte : découpe des polygones sur le cadre ----------
const world = {}; vm.createContext(world);
vm.runInContext(fs.readFileSync(path.join(d, 'world_compact.js'), 'utf8').replace(/const /g, 'var '), world);
const S = world.WORLD_SCALE;

function clip(poly) {                                   // Sutherland-Hodgman sur le rectangle
  const inside = [p => p[0] >= BBOX.lonMin, p => p[0] <= BBOX.lonMax, p => p[1] >= BBOX.latMin, p => p[1] <= BBOX.latMax];
  const cut = [
    (a, b) => { const t = (BBOX.lonMin - a[0]) / (b[0] - a[0]); return [BBOX.lonMin, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const t = (BBOX.lonMax - a[0]) / (b[0] - a[0]); return [BBOX.lonMax, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const t = (BBOX.latMin - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), BBOX.latMin]; },
    (a, b) => { const t = (BBOX.latMax - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), BBOX.latMax]; },
  ];
  let out = poly;
  for (let e = 0; e < 4 && out.length; e++) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
      const ci = inside[e](cur), pi = inside[e](prev);
      if (ci) { if (!pi) out.push(cut[e](prev, cur)); out.push(cur); }
      else if (pi) out.push(cut[e](prev, cur));
    }
  }
  return out;
}
const strictlyIn = p => p[0] > BBOX.lonMin && p[0] < BBOX.lonMax && p[1] > BBOX.latMin && p[1] < BBOX.latMax;
const land = [], coast = [];
for (const ring of world.WORLD) {
  const pts = []; for (let i = 0; i < ring.length; i += 2) pts.push([ring[i] / S, ring[i + 1] / S]);
  if (!pts.some(p => p[0] > BBOX.lonMin - 1 && p[0] < BBOX.lonMax + 1 && p[1] > BBOX.latMin - 1 && p[1] < BBOX.latMax + 1)) continue;
  const c = clip(pts);
  if (c.length < 3) continue;
  land.push(c.map(p => toKm(p[1], p[0])));
  // Le trait d'encre ne suit que les vraies côtes et frontières, jamais le bord du cadre.
  let run = [];
  for (let i = 0; i <= pts.length; i++) {
    const p = pts[i % pts.length];
    if (strictlyIn(p)) run.push(toKm(p[1], p[0]));
    else { if (run.length > 1) coast.push(run); run = []; }
  }
  if (run.length > 1) coast.push(run);
}
const box = { x0: toKm(0, BBOX.lonMin)[0], x1: toKm(0, BBOX.lonMax)[0], z0: toKm(BBOX.latMax, 0)[1], z1: toKm(BBOX.latMin, 0)[1] };

// ---------- couloirs de navigation (lat, lon) ----------
const SB = [[15.80, 41.30], [15.00, 41.75], [14.30, 42.15], [13.70, 42.45], [13.20, 42.85], [12.85, 43.15],
            [12.66, 43.29], [12.45, 43.55], [12.25, 44.00], [12.15, 44.60], [12.05, 45.30], [12.00, 46.20], [11.95, 47.25]];
const DJ = [[11.88, 47.25], [11.92, 46.20], [11.98, 45.30], [12.05, 44.60], [12.08, 44.05],
            [11.98, 43.72], [11.85, 43.45], [11.72, 43.22]];
function offset(line, dKm) {                            // décalage latéral, normale à gauche du sens de marche
  const P = line.map(([la, lo]) => toKm(la, lo));
  return P.map((p, i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    return toLL([p[0] + (dz / L) * dKm, p[1] - (dx / L) * dKm]);
  });
}
// Voie montante côté yéménite : circulation à droite pour un navire qui remonte vers la mer Rouge.
const NB = offset(SB, 7).reverse();
const lanes = { SB, NB, DJ };

// Garde-fou : un couloir qui traverse la terre fait échouer la construction.
const inPoly = (p, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
};
const lanesKm = {};
for (const [name, ln] of Object.entries(lanes)) {
  const P = ln.map(([la, lo]) => toKm(la, lo));
  for (let i = 0; i < P.length - 1; i++) for (let t = 0; t <= 1; t += 0.02) {
    const q = [P[i][0] + (P[i + 1][0] - P[i][0]) * t, P[i][1] + (P[i + 1][1] - P[i][1]) * t];
    if (land.some(poly => inPoly(q, poly))) throw new Error(`le couloir ${name} passe sur la terre près de ${toLL(q).map(v => v.toFixed(3))}`);
  }
  lanesKm[name] = P;
}

// Contact sans AIS du scénario simulé : doit être en mer.
const DARK = [13.95, 42.35];
if (land.some(poly => inPoly(toKm(...DARK), poly))) throw new Error('le contact simulé est sur la terre');

// ---------- assemblage ----------
const data = {
  geo: { center: C, bbox: BBOX, box, land, coast },
  lanes: lanesKm,
  dark: toKm(...DARK),
  zone: {
    id: zone.id, name: zone.name, c: zone.c, r: zone.r, type: zone.type, jwc: zone.jwc,
    score: zone.score, trend: zone.trend, parts: zone.parts, why: zone.why, hl: zone.hl, inc: zone.inc || [],
    ctx: zone.ctx,
  },
  sources: snap.sources,
  updatedAt: snap.updatedAt,
};

const FACES = [
  ['Chakra Petch', '500', 'chakra-petch-latin-500-normal.woff2'], ['Chakra Petch', '600', 'chakra-petch-latin-600-normal.woff2'],
  ['Chakra Petch', '700', 'chakra-petch-latin-700-normal.woff2'], ['Barlow', '400', 'barlow-latin-400-normal.woff2'],
  ['Barlow', '500', 'barlow-latin-500-normal.woff2'], ['Barlow', '600', 'barlow-latin-600-normal.woff2'],
  ['JetBrains Mono', '100 800', 'jetbrains-mono-latin-wght-normal.woff2'],
];
const fonts = FACES.map(([fam, w, f]) => `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;` +
  `src:url("data:font/woff2;base64,${fs.readFileSync(path.join(d, 'fonts-ops', f)).toString('base64')}") format('woff2');}`).join('\n');

let html = fs.readFileSync(path.join(d, 'focus-zone.html'), 'utf8');
html = html.replace('/*FONTS*/', () => fonts)
           .replace('//THREE_JS', () => fs.readFileSync(path.join(d, 'vendor', 'three-0.159.0.min.js'), 'utf8'))
           .replace('__FOCUS_DATA__', () => JSON.stringify(data));

const out = path.join(root, 'focus-zone-3d.html');
fs.writeFileSync(out, html);
console.log('focus-zone-3d.html :', (html.length / 1024 | 0) + ' Ko',
  '| terres', land.length, '| côtes', coast.length,
  '| couloirs', Object.keys(lanesKm).join('/'), 'sur l’eau',
  '| marqueurs restants :', ['/*FONTS*/', '//THREE_JS', '__FOCUS_DATA__'].filter(m => html.includes(m)).join(', ') || 'aucun');
