// Compacte le GeoJSON monde en polylignes légères pour un canvas.
// Sortie: JS avec un tableau de polygones [ [lon,lat,lon,lat,...], ... ]
// coords arrondies à 0.2° et encodées en entiers *5 pour réduire la taille.
const fs = require('fs');
const gj = JSON.parse(fs.readFileSync('world110.json', 'utf8'));

const polys = [];
function addRing(ring) {
  // simplifie: arrondi à 0.2°, déduplique les points consécutifs
  const out = [];
  let plx = null, ply = null;
  for (const [lon, lat] of ring) {
    const x = Math.round(lon * 5), y = Math.round(lat * 5);
    if (x === plx && y === ply) continue;
    out.push(x, y); plx = x; ply = y;
  }
  if (out.length >= 8) polys.push(out); // ignore les îlots minuscules
}
for (const f of gj.features) {
  const g = f.geometry;
  if (!g) continue;
  if (g.type === 'Polygon') addRing(g.coordinates[0]);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) addRing(p[0]);
}
const js = 'const WORLD=' + JSON.stringify(polys) + ';';
fs.writeFileSync('world_compact.js', js);
console.log('polygons:', polys.length, 'size:', (js.length / 1024).toFixed(1) + ' KB');
