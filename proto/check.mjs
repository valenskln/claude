// Test de fumée du prototype Proteus.AI.
// Usage : node proto/build.js && node proto/check.mjs
// Les captures vont dans $PROTEUS_SHOTS (défaut : <tmp>/proteus-shots) pour ne pas
// polluer le dépôt. Sort en code 1 si une vraie erreur JS est détectée.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.PROTEUS_SHOTS || path.join(os.tmpdir(), 'proteus-shots');
fs.mkdirSync(outDir, { recursive: true });

// Playwright n'est pas toujours résolvable depuis un dossier quelconque : on essaie
// plusieurs spécificateurs, du plus standard au chemin absolu de l'image.
async function loadChromium() {
  const candidates = [
    'playwright-core', 'playwright',
    '/opt/node22/lib/node_modules/playwright/node_modules/playwright-core/index.js',
    '/opt/node22/lib/node_modules/playwright/index.js',
  ];
  for (const c of candidates) {
    try { const m = await import(c); const ch = m.chromium || m.default?.chromium; if (ch) return ch; }
    catch { /* on tente le suivant */ }
  }
  throw new Error('Playwright introuvable — installe-le ou ajuste loadChromium().');
}

const src = path.join(here, 'proteus.html');
if (!fs.existsSync(src)) {
  console.error('proteus.html absent — lance d’abord : node proto/build.js');
  process.exit(1);
}

const chromium = await loadChromium();
const launchOpts = fs.existsSync('/opt/pw-browsers/chromium')
  ? { executablePath: '/opt/pw-browsers/chromium' } : {};
const browser = await chromium.launch(launchOpts);
const page = await browser.newPage({ viewport: { width: 1440, height: 850 } });

const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

// On enveloppe comme le fait l'hôte d'artifact, pour tester dans les mêmes conditions.
const body = fs.readFileSync(src, 'utf8');
const wrapped = path.join(outDir, 'wrapped.html');
fs.writeFileSync(wrapped, '<!doctype html><html><head><meta charset="utf-8"></head><body>' + body + '</body></html>');
await page.goto('file://' + wrapped);
await page.waitForTimeout(4000);

const shot = n => page.screenshot({ path: path.join(outDir, n) });
const has = async sel => (await page.locator(sel).count()) > 0;
const ok = [];   // contrat vérifié
const miss = []; // contrat rompu

await shot('01-initial.png');

// — fiche navire depuis le classement —
const rows = await page.locator('.srow').count();
if (rows > 0) { await page.locator('.srow').first().click(); await page.waitForTimeout(800); }
else miss.push('.srow (aucune ligne de navire)');
await shot('02-ship.png');

// — fiche zone depuis le classement —
if (await has('.zrow')) { await page.locator('.zrow').first().click(); await page.waitForTimeout(800); }
else miss.push('.zrow (aucune ligne de zone)');
await shot('03-zone.png');

// — thème : optionnel tant que la phase 4 n'est pas faite —
if (await has('#bTheme')) {
  await page.locator('#bTheme').click();
  await page.waitForTimeout(700);
  console.log('thème après bascule :', await page.evaluate(() => document.documentElement.dataset.theme || '(défaut)'));
  await shot('04-theme.png');
  await page.locator('#bTheme').click();
  await page.waitForTimeout(400);
  ok.push('#bTheme');
} else {
  console.log('thème : #bTheme absent (attendu avant la phase 4)');
}

// — densité : optionnel tant que la phase 4 n'est pas faite —
if (await has('#bDensity')) { ok.push('#bDensity'); }

console.log('polices embarquées chargées :', await page.evaluate(() => document.fonts.check('14px "IBM Plex Sans"') && document.fonts.check('14px Spectral') && document.fonts.check('14px "IBM Plex Mono"')));

// — recherche —
if (await has('#shipsearch')) {
  await page.locator('#shipsearch').fill('MAERSK');
  await page.waitForTimeout(400);
  const nres = await page.locator('#searchres .sr').count();
  console.log('résultats pour MAERSK :', nres);
  if (nres > 0) { await page.locator('#searchres .sr').first().click(); await page.waitForTimeout(600); }
  else miss.push('#searchres .sr (aucun résultat)');
  await shot('05-search.png');
} else miss.push('#shipsearch');

// — illustration navire : photo ou repli SVG —
await page.waitForTimeout(600);
console.log('visuel de la fiche :', await page.evaluate(() => {
  const a = document.querySelector('#detail .shipart');
  if (!a) return 'absent';
  const img = a.querySelector('img');
  if (img) return 'img chargée=' + (img.naturalWidth > 0);
  return a.querySelector('svg') ? 'repli SVG' : 'vide';
}));

// — filtre top 5 —
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
if (await has('#ftop')) {
  const before = await page.locator('#kShips').textContent();
  await page.locator('#ftop').click();
  await page.waitForTimeout(800);
  console.log('navires avant/après filtre top5 :', before, '→', await page.locator('#kShips').textContent());
  await page.locator('#ftop').click();
  await page.waitForTimeout(400);
} else miss.push('#ftop');

// — zoom profond (utilise les globales view / viewDirty) —
const camOk = await page.evaluate(() => {
  if (typeof view === 'undefined' || typeof viewDirty === 'undefined') return false;
  view.clat = 1.8; view.clon = 102.5; view.scale = 150; viewDirty = true; return true;
});
if (!camOk) miss.push('globales view / viewDirty');
await page.waitForTimeout(600);
await shot('06-zoom.png');
await page.evaluate(() => { if (typeof view !== 'undefined') { view.clat = 18; view.clon = 25; view.scale = 3.4; viewDirty = true; } });
await page.waitForTimeout(400);

// — barre d'état (apparaît en phase 5) —
if (await has('#statusbar')) { ok.push('#statusbar'); console.log('barre d’état :', (await page.locator('#statusbar').textContent()).replace(/\s+/g, ' ').trim()); }

// — parcours AIS (réseau volontairement invalide : on teste la plomberie, pas le flux) —
if (!process.env.PROTEUS_SKIP_AIS && await has('#bMode')) {
  await page.locator('#bMode').click();
  await page.waitForTimeout(400);
  console.log('modale AIS visible :', await page.locator('#aismodal').isVisible());
  await shot('07-ais.png');
  await page.locator('#aiskey').fill('cle-de-test-invalide');
  await page.locator('#aisconnect').click();
  await page.waitForTimeout(6000);
  console.log('statut AIS :', JSON.stringify(await page.locator('#aisstatus').textContent()));
  console.log('mode toujours simulé :', await page.evaluate(() => typeof MODE !== 'undefined' ? MODE : 'n/a'));
  await shot('08-ais-status.png');
}

console.log('lignes de navires :', rows);
console.log('KPI :', await page.locator('#kShips').textContent(), '/', await page.locator('#kAlerts').textContent());

// Les échecs réseau du test AIS sont attendus dans un bac à sable : on les affiche
// mais ils ne font pas échouer le test.
const benign = /aisstream|websocket|net::|ERR_(NAME|INTERNET|CONNECTION|PROXY)|Failed to fetch|risk\.json/i;
const real = errors.filter(e => !benign.test(e));
if (errors.length) console.log('\n--- erreurs console (toutes) ---\n' + errors.join('\n'));
console.log('\nerreurs JS bloquantes :', real.length ? '\n' + real.join('\n') : 'aucune');
if (miss.length) console.log('contrat DOM rompu :', miss.join(', '));
if (ok.length) console.log('contrat étendu présent :', ok.join(', '));
console.log('captures :', outDir);

await browser.close();
if (real.length || miss.length) process.exitCode = 1;
