// Recopie les tokens RÉELS de l'application dans le design system.
// Sans cela le document dériverait, exactement comme charte-graphique.html
// dont toutes les valeurs avaient été recopiées à la main puis oubliées.
// Usage : node proto/sync-design-system.mjs   (puis vérifier avec --check)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const APP = path.join(here, 'proteus-proto.html');
const DS  = path.join(root, 'design-system.html');
const FONTS = path.join(here, 'fonts.css');

const app = fs.readFileSync(APP, 'utf8');

// Le bloc va du premier :root jusqu'à la fin du bloc de densité.
const start = app.indexOf('  :root{');
const endMark = '[data-density="comfortable"]{';
const endIdx = app.indexOf(endMark, start);
if (start < 0 || endIdx < 0) { console.error('bloc de tokens introuvable dans l’app'); process.exit(1); }
const close = app.indexOf('\n  }', endIdx);
const tokens = app.slice(start, close + 4).trimEnd();

let ds = fs.readFileSync(DS, 'utf8');
const B = '/* TOKENS:BEGIN */', E = '/* TOKENS:END */';
const i = ds.indexOf(B), j = ds.indexOf(E);
if (i < 0 || j < 0) { console.error('marqueurs TOKENS absents de design-system.html'); process.exit(1); }
const wanted = B + '\n' + tokens + '\n  ' + E;
const current = ds.slice(i, j + E.length);

if (process.argv.includes('--check')) {
  if (current.trim() !== wanted.trim()) {
    console.error('✗ design-system.html a dérivé — relance : node proto/sync-design-system.mjs');
    process.exit(1);
  }
  console.log('✓ design system aligné sur les tokens de l’application');
  process.exit(0);
}

ds = ds.slice(0, i) + wanted + ds.slice(j + E.length);
if (ds.includes('/*FONTS*/')) ds = ds.replace('/*FONTS*/', () => fs.readFileSync(FONTS, 'utf8'));
fs.writeFileSync(DS, ds);
const n = (tokens.match(/--[a-z0-9-]+\s*:/g) || []).length;
console.log('design-system.html synchronisé :', n, 'tokens ·', (ds.length/1024|0)+' Ko');
