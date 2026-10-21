// node shoot.mjs <plan> [preview]  → images JPEG dans frames/<plan>/
import fs from 'node:fs';
const m = await import('/opt/node-tools/node_modules/playwright-core/index.js'); const chromium = m.chromium || m.default.chromium;
const name = process.argv[2], preview = process.argv[3] === 'preview';
const FPS = 25, DT = 1000 / FPS;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const meta = { intro: {}, world: {}, zone: { pre: 3 }, sat: {}, layers: {}, map2d: { locale: 'fr-FR' }, ais: {}, outro: {} }[name];
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, locale: meta.locale || 'fr-FR' });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', c => c.type() === 'error' && !/ERR_|Failed to load/.test(c.text()) && errs.push(c.text().slice(0, 200)));
const font = (fam, w, f) => `@font-face{font-family:'${fam}';font-weight:${w};src:url("data:font/woff2;base64,${fs.readFileSync('/home/user/claude/proto/fonts-ops/' + f).toString('base64')}") format('woff2');}`;
const fontsCss = [font('Chakra Petch', 600, 'chakra-petch-latin-600-normal.woff2'), font('Chakra Petch', 700, 'chakra-petch-latin-700-normal.woff2'), font('Barlow', 400, 'barlow-latin-400-normal.woff2'),
  font('Barlow', 500, 'barlow-latin-500-normal.woff2'), font('Barlow', 600, 'barlow-latin-600-normal.woff2'), font('JetBrains Mono', '100 800', 'jetbrains-mono-latin-wght-normal.woff2')].join('\n');
await p.addInitScript({ path: 'vclock.js' }); await p.addInitScript({ path: 'dir.js' }); await p.addInitScript({ path: 'shots.js' });
const url = await p.evaluate ? null : null;
const shotUrl = { intro: 'proteus-ops.html?still=1', world: 'proteus-ops.html?still=1', zone: 'proteus-ops.html?zone=hormuz', sat: 'proteus-ops.html?zone=hormuz&still=1', layers: 'proteus-ops.html?zone=hormuz&still=1', map2d: 'proteus-prototype.html', ais: 'proteus-ops.html?still=1', outro: 'proteus-ops.html?still=1' }[name];
await p.goto('file:///home/user/claude/' + shotUrl);
await p.addStyleTag({ content: fontsCss });
await p.evaluate(() => { window.__mount(); try { localStorage.setItem('proteus_lang', 'fr'); } catch (e) {} });
await p.waitForTimeout(1200);
await p.evaluate(() => document.fonts.ready);
const pre = meta.pre != null ? meta.pre : 25;
for (let i = 0; i < pre; i++) await p.evaluate(dt => __step(dt), DT);
await p.screenshot({ path: '/dev/null', type: 'jpeg', timeout: 180000 }).catch(() => {});   // chauffe : compilation des shaders
await p.evaluate(n => __SHOTS[n].setup && __SHOTS[n].setup(), name);
const dur = await p.evaluate(n => __SHOTS[n].dur, name);
const dir = `frames/${name}${preview ? '-pv' : ''}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const N = Math.round(dur * FPS), stepK = preview ? 5 : 1, every = preview ? 10 : 1;   // aperçu : pas de 200 ms, une image toutes les 2 s
const t0 = Date.now(); let k = 0;
for (let i = 0; i < N; i += stepK) {
  const t = i / FPS;
  await p.evaluate(([n, t]) => __SHOTS[n].frame(t), [name, t]);
  await p.evaluate(dt => __step(dt), DT * stepK);
  if (!preview || (i % every === 0)) await p.screenshot({ path: `${dir}/${String(preview ? i : k).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92, timeout: 180000 });
  k++;
  if (!preview && k % 50 === 0) console.log(name, k, '/', N, Math.round((Date.now() - t0) / k) + ' ms/img');
}
console.log(name, 'terminé :', k, 'images', Math.round((Date.now() - t0) / 1000) + ' s', errs.length ? 'ERREURS ' + JSON.stringify(errs.slice(0, 5)) : 'sans erreur');
await b.close();
