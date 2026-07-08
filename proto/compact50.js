// Compacte Natural Earth 50m (pays + lacs + fleuves) en données canvas légères.
// Coordonnées arrondies à 0.1° et encodées en entiers ×10.
const fs = require('fs');
const S = 25;

function ringToInts(ring, minPts) {
  const out = [];
  let plx = null, ply = null;
  for (const [lon, lat] of ring) {
    const x = Math.round(lon * S), y = Math.round(lat * S);
    if (x === plx && y === ply) continue;
    out.push(x, y); plx = x; ply = y;
  }
  return out.length >= minPts * 2 ? out : null;
}
function collect(file, minPts, lineStrings) {
  const gj = JSON.parse(fs.readFileSync(file, 'utf8'));
  const polys = [];
  for (const f of gj.features) {
    const g = f.geometry; if (!g) continue;
    if (lineStrings) {
      if (g.type === 'LineString') { const r = ringToInts(g.coordinates, minPts); if (r) polys.push(r); }
      else if (g.type === 'MultiLineString') for (const l of g.coordinates) { const r = ringToInts(l, minPts); if (r) polys.push(r); }
    } else {
      if (g.type === 'Polygon') { const r = ringToInts(g.coordinates[0], minPts); if (r) polys.push(r); }
      else if (g.type === 'MultiPolygon') for (const p of g.coordinates) { const r = ringToInts(p[0], minPts); if (r) polys.push(r); }
    }
  }
  return polys;
}
// lacs : uniquement les plus grands (scalerank 0-1)
function collectLakes() {
  const gj = JSON.parse(fs.readFileSync('ne50_lakes.json', 'utf8'));
  gj.features = gj.features.filter(f => (f.properties.scalerank ?? 9) <= 1);
  fs.writeFileSync('_lakes_f.json', JSON.stringify(gj));
  return collect('_lakes_f.json', 5, false);
}
// fleuves : principaux (scalerank <= 4)
function collectRivers() {
  const gj = JSON.parse(fs.readFileSync('ne50_rivers.json', 'utf8'));
  gj.features = gj.features.filter(f => (f.properties.scalerank ?? 9) <= 4);
  fs.writeFileSync('_rivers_f.json', JSON.stringify(gj));
  return collect('_rivers_f.json', 3, true);
}
const world = collect('ne50_countries.json', 4, false);
const lakes = collectLakes();
const rivers = collectRivers();
const js = 'const WORLD_SCALE=' + S + ';\n'
  + 'const WORLD=' + JSON.stringify(world) + ';\n'
  + 'const LAKES=' + JSON.stringify(lakes) + ';\n'
  + 'const RIVERS=' + JSON.stringify(rivers) + ';';
fs.writeFileSync('world_compact.js', js);
console.log('pays:', world.length, 'lacs:', lakes.length, 'fleuves:', rivers.length,
  '| taille totale:', (js.length / 1024).toFixed(0) + ' KB');
