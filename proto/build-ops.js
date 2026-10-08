// Assemble la « salle d'opérations » Proteus : globe du monde + vue focus 3D des 36 zones.
// Usage : node proto/build-ops.js   ->   proteus-ops.html (racine du dépôt)
//
// Identité propre (ni les tokens ni les polices de la carte 2D).
// Injections, chacune remplacée UNE fois dans proto/ops.html :
//   /*FONTS*/        -> proto/fonts-ops/*.woff2 (Chakra Petch, Barlow, JetBrains Mono — OFL)
//   //THREE_JS       -> proto/vendor/three-0.159.0.min.js
//   //WORLD_DATA     -> proto/world_compact.js (trait de côte mondial)
//   //ROUTES_DATA    -> les corridors réels, extraits de proteus-proto.html (source unique)
//   __SNAPSHOT__     -> proto/risk-snapshot.json (scores embarqués, rafraîchis en ligne si possible)
// Le relief, les couloirs de chaque zone et la flotte sont calculés dans la page, à l'ouverture d'une zone.
const fs = require('fs');
const path = require('path');

const d = __dirname;
const root = path.join(d, '..');
const read = f => fs.readFileSync(path.join(d, f), 'utf8');

const snap = JSON.parse(read('risk-snapshot.json'));
if (!snap.zones || snap.zones.length < 10) throw new Error('instantané de risque incomplet');

const app = read('proteus-proto.html');
const r0 = app.indexOf('const ROUTES = {');
const r1 = app.indexOf('\n};', r0);
if (r0 < 0 || r1 < 0) throw new Error('bloc ROUTES introuvable dans proteus-proto.html');
const routes = app.slice(r0, r1 + 3);

const FACES = [
  ['Chakra Petch', '600', 'chakra-petch-latin-600-normal.woff2'], ['Chakra Petch', '700', 'chakra-petch-latin-700-normal.woff2'],
  ['Barlow', '400', 'barlow-latin-400-normal.woff2'], ['Barlow', '500', 'barlow-latin-500-normal.woff2'],
  ['Barlow', '600', 'barlow-latin-600-normal.woff2'], ['JetBrains Mono', '100 800', 'jetbrains-mono-latin-wght-normal.woff2'],
];
const fonts = FACES.map(([fam, w, f]) => `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;` +
  `src:url("data:font/woff2;base64,${fs.readFileSync(path.join(d, 'fonts-ops', f)).toString('base64')}") format('woff2');}`).join('\n');

let html = read('ops.html');
const MARKERS = ['/*FONTS*/', '//THREE_JS', '//WORLD_DATA', '//ROUTES_DATA', '__SNAPSHOT__'];
for (const m of MARKERS) if (!html.includes(m)) throw new Error('marqueur absent de ops.html : ' + m);
html = html.replace('/*FONTS*/', () => fonts)
           .replace('//THREE_JS', () => read('vendor/three-0.159.0.min.js'))
           .replace('//WORLD_DATA', () => read('world_compact.js'))
           .replace('//ROUTES_DATA', () => routes)
           .replace('__SNAPSHOT__', () => JSON.stringify(snap));

fs.writeFileSync(path.join(root, 'proteus-ops.html'), html);
// L'ancienne adresse de la vue focus renvoie vers la nouvelle page, sur la même zone.
fs.writeFileSync(path.join(root, 'focus-zone-3d.html'),
  '<!doctype html><meta charset="utf-8"><title>Proteus · Salle d\'opérations</title>' +
  '<meta http-equiv="refresh" content="0; url=proteus-ops.html?zone=bab-el-mandeb">' +
  '<p>La vue focus a déménagé : <a href="proteus-ops.html?zone=bab-el-mandeb">proteus-ops.html</a></p>\n');

console.log('proteus-ops.html :', (html.length / 1024 | 0) + ' Ko', '| zones', snap.zones.length,
  '| routes', (routes.match(/pts:\[/g) || []).length,
  '| marqueurs restants :', MARKERS.filter(m => html.includes(m)).join(', ') || 'aucun');
