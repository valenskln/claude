const fs = require('fs');
const d = __dirname;
let html = fs.readFileSync(d + '/proteus-proto.html', 'utf8');
const world = fs.readFileSync(d + '/world_compact.js', 'utf8');
const font = fs.readFileSync(d + '/manrope.b64', 'utf8').trim();
// instantané des scores de risque embarqué en secours (généré par risk/pipeline.mjs)
let snapshot = '{"zones":[]}';
try { snapshot = fs.readFileSync(d + '/risk-snapshot.json', 'utf8').trim(); } catch (e) {
  console.warn('⚠ pas de risk-snapshot.json — secours vide (ZONES_LEGACY prendra le relais)');
}
html = html.replace('//WORLD_DATA', world)
  .replace('__MANROPE_B64__', font)
  .replace('__RISK_SNAPSHOT__', snapshot);
fs.writeFileSync(d + '/proteus.html', html);
console.log('proteus.html:', (html.length / 1024).toFixed(0) + ' KB',
  '| world:', html.includes('const WORLD='), '| font:', !html.includes('__MANROPE_B64__'),
  '| snapshot:', !html.includes('__RISK_SNAPSHOT__'));
