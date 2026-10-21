// Cadres 1080×1080 pour les versions carrées LinkedIn : bandeau titre en haut, mention en bas,
// fenêtre transparente au milieu (1080×608) où vient se poser la vidéo 16:9.
import fs from 'node:fs';
const m = await import('/opt/node-tools/node_modules/playwright-core/index.js'); const chromium = m.chromium || m.default.chromium;
const F = '/home/user/claude/proto/fonts-ops/';
const font = (fam, file, w) => `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format('woff2')}`;
const css = [font('Barlow', 'barlow-latin-500-normal.woff2', 500), font('Barlow', 'barlow-latin-600-normal.woff2', 600),
  font('Chakra Petch', 'chakra-petch-latin-600-normal.woff2', 600), font('Chakra Petch', 'chakra-petch-latin-700-normal.woff2', 700)].join('');
const CLIPS = {
  'film': ['Film de démonstration', 'La salle de veille risque de guerre maritime'],
  'ranking': ['Le ranking des 36 zones', 'Score 0–10, traduit dans le rating du marché'],
  'cumuls-3d': ['Vos cumuls en zone, en 3D', 'Navires présents et en approche, coque et cargaison'],
  'satellite': ['Le navire qui coupe son AIS', 'Chaque passage satellite recoupe l’AIS déclaré'],
  'preuve': ['La preuve empilée', 'AIS, satellite, presse, Joint War Committee'],
  'carte-2d': ['La carte de travail', 'Heatmap, alertes d’entrée en zone, navires exposés'],
  'teaser': ['Proteus', 'La salle de veille risque de guerre maritime'],
};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
for (const [k, [title, sub]] of Object.entries(CLIPS)) {
  await p.setContent(`<style>${css}
    html,body{margin:0;width:1080px;height:1080px;background:transparent}
    .top,.bot{position:absolute;left:0;right:0;height:236px;background:#05090F;display:flex;flex-direction:column;justify-content:center;padding:0 64px;box-sizing:border-box}
    .top{top:0;gap:14px;border-bottom:1px solid #1C2A3C}.bot{bottom:0;gap:10px;border-top:1px solid #1C2A3C}
    .brand{display:flex;align-items:center;gap:12px;font:700 22px/1 'Chakra Petch';letter-spacing:.3em;color:#3CD7FF}
    .t{font:600 52px/1.08 'Barlow';color:#F2F6FC}
    .s{font:500 28px/1.3 'Barlow';color:#97A9C2}
    .n{font:600 16px/1 'Chakra Petch';letter-spacing:.22em;color:#FF6F93;text-transform:uppercase}
  </style>
  <div class="top"><div class="brand"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2 21 7v10l-9 5-9-5V7z" stroke="#3CD7FF" stroke-width="1.6"/><path d="M12 7.5 16 12l-4 4.5L8 12z" fill="#3CD7FF"/></svg>PROTEUS</div><div class="t">${title}</div></div>
  <div class="bot"><div class="s">${sub}</div><div class="n">Prototype · flotte simulée</div></div>`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `carre/cadre-${k}.png`, omitBackground: true });
}
await b.close(); console.log('cadres ok');
