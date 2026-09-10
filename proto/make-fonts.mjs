// Régénère proto/fonts.css en embarquant les woff2 en base64.
// Le prototype est un fichier autonome : aucune police ne peut venir d'un CDN.
// Usage : node proto/make-fonts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FACES = [
  ['Spectral',      '400',     'spectral-400.woff2'],
  ['Spectral',      '600',     'spectral-600.woff2'],
  ['IBM Plex Sans', '400 700', 'plexsans-var.woff2'],   // police variable
  ['IBM Plex Mono', '400',     'plexmono-400.woff2'],
  ['IBM Plex Mono', '600',     'plexmono-600.woff2'],
];
const head = `/* Polices embarquées — le prototype doit fonctionner hors ligne, sans CDN.
   Spectral (serif de titrage, gravure de carte) · IBM Plex Sans (interface,
   police variable 400-700) · IBM Plex Mono (toute valeur mesurée).
   Généré par proto/make-fonts.mjs — ne pas éditer à la main. */`;
const out = [head];
for (const [fam, w, file] of FACES) {
  const p = path.join(here, file);
  if (!fs.existsSync(p)) { console.error('manquant :', file); process.exit(1); }
  const b64 = fs.readFileSync(p).toString('base64');
  out.push(`@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;\n  src:url("data:font/woff2;base64,${b64}") format('woff2');}`);
}
const css = out.join('\n') + '\n';
fs.writeFileSync(path.join(here, 'fonts.css'), css);
console.log('fonts.css :', (css.length/1024|0)+' Ko ·', FACES.length, 'coupes');
