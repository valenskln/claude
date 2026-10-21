// Réalisation de la vidéo Proteus : surcouche (textes, zoom, curseur, cadre de mise en valeur)
// et scénario de chaque plan. Tout est calculé en fonction du temps du plan (t, en secondes) :
// une image = un appel à __shot.frame(t), puis l'horloge de la page avance de 40 ms.
(() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = x => { x = clamp(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const seg = (t, a, b) => ease((t - a) / (b - a));            // 0 → 1 entre a et b
  const win = (t, a, b, f = .4) => Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b));   // fenêtre avec fondus
  const lerp = (a, b, k) => a + (b - a) * k;
  window.__V = { clamp, ease, seg, win, lerp };

  const CSS = `
  #vroot{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:'Barlow',system-ui,sans-serif;color:#E6EEF9}
  #vveil{position:absolute;inset:0;background:radial-gradient(ellipse 80% 70% at 50% 50%, rgba(3,6,12,.55), rgba(3,6,12,.92))}
  #vcard{position:absolute;inset:0;display:grid;place-items:center;text-align:center}
  #vcard .w{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);font:600 76px/1 'Chakra Petch',sans-serif;letter-spacing:.3em;color:#3CD7FF;text-shadow:0 0 28px rgba(60,215,255,.55)}
  #vcard .q1{position:absolute;left:0;right:0;top:44%;font:500 52px/1.15 'Barlow',sans-serif;color:#E6EEF9}
  #vcard .q2{position:absolute;left:0;right:0;top:53%;font:600 52px/1.15 'Barlow',sans-serif;color:#FFC53D;text-shadow:0 0 24px rgba(255,197,61,.35)}
  #vcard .tag{position:absolute;left:0;right:0;font:600 22px/1 'Chakra Petch',sans-serif;letter-spacing:.32em;color:#97A9C2}
  #vcard .stats{position:absolute;left:50%;top:50%;transform:translate(-50%,-44%);display:grid;grid-template-columns:auto auto;gap:34px 46px;align-items:center;text-align:left}
  #vcard .stats b{font:600 64px/1 'JetBrains Mono',monospace;color:#FF3D71;text-align:right;text-shadow:0 0 22px rgba(255,61,113,.35)}
  #vcard .stats span{font:500 34px/1.2 'Barlow',sans-serif;color:#E6EEF9;max-width:760px}
  #vcard .logo{position:absolute;left:50%;top:41%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:34px}
  #vcard .logo b{font:700 120px/1 'Chakra Petch',sans-serif;letter-spacing:.24em;color:#E6EEF9}
  #vcard .sub{position:absolute;left:0;right:0;top:58%;font:500 38px/1.35 'Barlow',sans-serif;color:#97A9C2}
  #vcard .sub em{font-style:normal;color:#E6EEF9}
  #vcard .cta{position:absolute;left:50%;top:72%;transform:translateX(-50%);padding:18px 34px;border:1.5px solid #3CD7FF;border-radius:10px;font:600 26px/1 'Chakra Petch',sans-serif;letter-spacing:.2em;color:#3CD7FF;background:rgba(60,215,255,.08);box-shadow:0 0 34px rgba(60,215,255,.25)}
  #vcard .foot{position:absolute;left:0;right:0;bottom:44px;font:400 18px/1.4 'JetBrains Mono',monospace;color:#5A6D87}
  #vcap{position:absolute;max-width:860px;padding:22px 28px 24px;border-radius:14px;background:rgba(6,12,22,.86);border:1px solid rgba(120,170,230,.28);
        box-shadow:0 20px 60px rgba(0,0,0,.55);backdrop-filter:blur(10px)}
  #vcap .tag{font:600 16px/1 'Chakra Petch',sans-serif;letter-spacing:.3em;color:#3CD7FF;margin-bottom:12px}
  #vcap .title{font:600 40px/1.12 'Barlow',sans-serif;color:#F2F6FC}
  #vcap .sub{font:400 24px/1.38 'Barlow',sans-serif;color:#A7B7CC;margin-top:10px}
  #vcap .bar{position:absolute;left:0;top:18px;bottom:18px;width:3px;border-radius:2px;background:#3CD7FF;box-shadow:0 0 12px #3CD7FF}
  #vring{position:absolute;border:2px solid #3CD7FF;border-radius:14px;box-shadow:0 0 0 4000px rgba(2,5,10,.38),0 0 30px rgba(60,215,255,.55),inset 0 0 20px rgba(60,215,255,.2)}
  #vcur{position:absolute;width:30px;height:30px;margin:-3px 0 0 -4px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.6))}
  #vrip{position:absolute;border:2px solid #3CD7FF;border-radius:50%}
  `;
  function mount() {
    if (document.getElementById('vroot')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.documentElement.appendChild(st);
    const r = document.createElement('div'); r.id = 'vroot';
    r.innerHTML = `<div id="vveil"></div><div id="vring"></div><div id="vcard"></div><div id="vcap"><div class="bar"></div><div class="tag"></div><div class="title"></div><div class="sub"></div></div>
      <div id="vrip"></div><svg id="vcur" viewBox="0 0 24 24"><path d="M4 2.5 19.5 13l-7 1.4 4 7.1-3 1.6-4-7.1L4 20.5z" fill="#fff" stroke="#03060C" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
    document.documentElement.appendChild(r);
    // les transitions CSS tournent en temps réel : on les coupe, le réalisateur anime lui-même
    const k = document.createElement('style'); k.textContent = `.reveal,.lb,#fade,#toast,.kpi,.ev{transition:none!important} .ev.new{animation:none!important}`; document.documentElement.appendChild(k);
    O.veil(0); O.card(''); O.cap(null); O.ring(null); O.cursor(null);
  }
  const $v = id => document.getElementById(id);
  const O = window.__O = {
    veil(a) { $v('vveil').style.opacity = a; },
    card(html, a = 1) { const c = $v('vcard'); if (c.__h !== html) { c.innerHTML = html; c.__h = html; } c.style.opacity = html ? a : 0; },
    // sous-titre : { tag, title, sub, x, y, a } (x, y : coin haut-gauche en px ; a : opacité 0..1)
    cap(o) { const c = $v('vcap'); if (!o || o.a <= 0) { c.style.opacity = 0; return; }
      const key = o.tag + o.title + o.sub; if (c.__k !== key) { c.querySelector('.tag').textContent = o.tag || ''; c.querySelector('.title').textContent = o.title || ''; c.querySelector('.sub').textContent = o.sub || ''; c.__k = key; }
      c.style.opacity = o.a; c.style.left = o.x + 'px'; c.style.top = (o.y + (1 - o.a) * 18) + 'px'; if (o.w) c.style.maxWidth = o.w + 'px'; },
    ring(r, a = 1) { const e = $v('vring'); if (!r || a <= 0) { e.style.opacity = 0; return; } const p = 10; Object.assign(e.style, { opacity: a, left: r.left - p + 'px', top: r.top - p + 'px', width: r.width + 2 * p + 'px', height: r.height + 2 * p + 'px' }); },
    cursor(p, rip = 0) { const c = $v('vcur'), q = $v('vrip'); if (!p) { c.style.opacity = 0; q.style.opacity = 0; return; }
      c.style.opacity = 1; c.style.left = p.x + 'px'; c.style.top = p.y + 'px';
      if (rip > 0 && rip < 1) { const s = 10 + rip * 46; Object.assign(q.style, { opacity: 1 - rip, left: p.x - s / 2 + 'px', top: p.y - s / 2 + 'px', width: s + 'px', height: s + 'px' }); } else q.style.opacity = 0; },
    // zoom de toute l'interface (le rendu 3D reste net en dessous du facteur 1,6)
    zoom(s, ox, oy) { const b = document.body; b.style.transformOrigin = `${ox}px ${oy}px`; b.style.transform = s > 1.001 ? `scale(${s})` : ''; },
    panels(a, sel = '.reveal,#tools,#legend') { document.querySelectorAll(sel).forEach(e => { e.style.opacity = a; }); },
    hide(sel, a) { document.querySelectorAll(sel).forEach(e => { e.style.opacity = a; }); },
  };
  // rectangle d'un élément dans le repère de l'écran SANS zoom (pour viser avant de zoomer)
  window.__rect = sel => { const b = document.body, tr = b.style.transform; b.style.transform = ''; const el = typeof sel === 'string' ? document.querySelector(sel) : sel; const r = el ? el.getBoundingClientRect() : null; b.style.transform = tr; return r && { left: r.left, top: r.top, width: r.width, height: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; };
  // rectangle à l'écran APRÈS zoom autour d'une origine
  window.__zr = (r, s, ox, oy) => r && { left: ox + (r.left - ox) * s, top: oy + (r.top - oy) * s, width: r.width * s, height: r.height * s };
  document.addEventListener('DOMContentLoaded', mount);
  window.__mount = mount;
})();
