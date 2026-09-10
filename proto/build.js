// Assemble le prototype autonome à partir de proteus-proto.html.
// Quatre injections, chacune remplacée UNE seule fois :
//   /*FONTS*/          -> proto/fonts.css        (polices embarquées en base64)
//   //WORLD_DATA       -> proto/world_compact.js (fond de carte)
//   __RISK_SNAPSHOT__  -> proto/risk-snapshot.json (scores de secours hors ligne)
const fs = require('fs');
const d = __dirname;
let html = fs.readFileSync(d + '/proteus-proto.html', 'utf8');
const world = fs.readFileSync(d + '/world_compact.js', 'utf8');
const fonts = fs.readFileSync(d + '/fonts.css', 'utf8');
let snapshot = '{"zones":[]}';
try { snapshot = fs.readFileSync(d + '/risk-snapshot.json', 'utf8').trim(); }
catch (e) { console.warn('risk-snapshot.json absent — ZONES_LEGACY prendra le relais'); }

html = html.replace('/*FONTS*/', () => fonts)
           .replace('//WORLD_DATA', () => world)
           .replace('__RISK_SNAPSHOT__', () => snapshot);

fs.writeFileSync(d + '/proteus.html', html);
console.log('proteus.html:', (html.length / 1024 | 0) + ' KB',
  '| fonts:', !html.includes('/*FONTS*/'),
  '| world:', html.includes('const WORLD='),
  '| snapshot:', !html.includes('__RISK_SNAPSHOT__'));
