// Scénario plan par plan. Chaque plan : page, durée (s), setup() une fois, frame(t) à chaque image.
(() => {
  const { clamp, ease, seg, win, lerp } = window.__V;
  const W = 1920, H = 1080;
  const LOGO = `<svg width="132" height="132" viewBox="0 0 26 26"><path d="M13 1.5 23 7.25v11.5L13 24.5 3 18.75V7.25z" fill="none" stroke="#3CD7FF" stroke-width="1.2"/><path d="M13 7 18 13l-5 6-5-6z" fill="#3CD7FF"/></svg>`;
  const cap = (t, a, b, tag, title, sub, x = 90, y = 790, w = 860) => win(t, a, b, .5) > 0 ? { tag, title, sub, x, y, w, a: win(t, a, b, .5) } : null;
  const firstCap = (...cs) => cs.find(c => c) || null;
  // zoom animé : liste de [t0, t1, s, ox, oy] ; renvoie l'état courant (avec interpolation entre clés)
  function zoomTrack(t, keys) {
    let s = 1, ox = W / 2, oy = H / 2;
    for (const [a, b, s2, x2, y2] of keys) { if (t < a) break; const k = seg(t, a, b); s = lerp(s, s2, k); ox = lerp(ox, x2, k); oy = lerp(oy, y2, k); }
    return { s, ox, oy };
  }
  function cursorPath(t, pts) {   // pts : [t, x, y, click?]
    if (!pts.length || t < pts[0][0]) return null;
    let p = pts[0]; for (let i = 1; i < pts.length; i++) { const q = pts[i]; if (t < q[0]) { const k = ease((t - p[0]) / (q[0] - p[0])); return { x: lerp(p[1], q[1], k), y: lerp(p[2], q[2], k), rip: 0 }; } p = q; }
    const last = pts[pts.length - 1]; return { x: last[1], y: last[2], rip: last[3] ? clamp((t - last[0]) / .5, 0, 1) : 0 };
  }
  const once = (o, k, fn) => { if (!o[k]) { o[k] = 1; fn(); } };

  window.__SHOTS = {
    /* ───────────── 1. Accroche, problème, logo (globe en fond) ───────────── */
    intro: { url: 'proteus-ops.html?still=1', dur: 19,
      setup() { __ops.G.autoRot = false; },
      frame(t) {
        const gc = __ops.G.gc; gc.R = lerp(1150, 760, ease(t / 19)); gc.lon = 18 + t * 2.2; gc.lat = 20 + Math.sin(t * .2) * 4;
        __O.panels(0, '.reveal,#tools,#legend,header,#labels');
        __O.veil(t < 8 ? .62 : t < 13.5 ? .74 : .8);
        const big = (txt, a, b) => win(t, a, b, .35) > 0 ? `<div class="w" style="opacity:${win(t, a, b, .35)};letter-spacing:${lerp(.42, .3, seg(t, a, b))}em">${txt}</div>` : '';
        let html = '';
        if (t < 5.2) html = big('MER ROUGE', .3, 1.95) + big('DÉTROIT D’ORMUZ', 1.95, 3.6) + big('MER NOIRE', 3.6, 5.2);
        else if (t < 8.1) { const a = win(t, 5.2, 8.1, .4); html = `<div style="opacity:${a}"><div class="q1">Quand une zone bascule,</div><div class="q2" style="opacity:${seg(t, 5.8, 6.3)}">combien de vos navires y sont exposés&nbsp;?</div></div>`; }
        else if (t < 13.6) { const a = win(t, 8.1, 13.6, .4), r = i => seg(t, 8.5 + i * .9, 9.0 + i * .9);
          html = `<div style="opacity:${a}"><div class="tag" style="top:24%">LE QUOTIDIEN DU SOUSCRIPTEUR RISQUE DE GUERRE</div><div class="stats">
            <b style="opacity:${r(0)}">7 – 8</b><span style="opacity:${r(0)}">Rating de zone : la garantie est suspendue</span>
            <b style="opacity:${r(1)}">1 par 1</b><span style="opacity:${r(1)}">Rétablissement au cas par cas, navire par navire</span>
            <b style="opacity:${r(2)}">0,01 → 3 %</b><span style="opacity:${r(2)}">Le taux de prime guerre selon la zone</span></div></div>`; }
        else { const a = seg(t, 13.7, 14.6);
          html = `<div style="opacity:${a}"><div class="logo" style="transform:translate(-50%,-50%) scale(${lerp(.94, 1, a)})">${LOGO}<b>PROTEUS</b></div>
            <div class="sub" style="opacity:${seg(t, 14.6, 15.4)}"><em>La salle de veille risque de guerre</em><br>pour les souscripteurs et courtiers maritimes</div></div>`; }
        __O.card(html);
      } },

    /* ───────────── 2. Carte mondiale, ranking, fil de veille, clic sur Ormuz ───────────── */
    world: { url: 'proteus-ops.html?still=1', dur: 24,
      setup() { __ops.G.autoRot = false; this.list = __rect('#zlist'); this.feed = __rect('#wfeed'); this.row = __rect('.zr[data-id="hormuz"]'); this.z = SNAPD.zones.find(z => z.id === 'hormuz'); },
      frame(t) {
        const G = __ops.G, gc = G.gc;
        if (t < 18) { gc.R = 820; gc.lon = 30 + t * 1.6; gc.lat = 18; }
        __O.veil(lerp(.5, 0, seg(t, 0, 1.2)));
        __O.panels(t < 18.4 ? seg(t, 0, 1) : 1 - seg(t, 18.4, 19.4));
        const L = this.list, F = this.feed;
        const z = zoomTrack(t, [[3.6, 5, 1.5, L.left - 6, L.top - 40], [8.4, 9.6, 1, W / 2, H / 2], [9.6, 11, 1.45, F.left + F.width + 6, F.top - 40], [14.2, 15.4, 1, W / 2, H / 2]]);
        __O.zoom(z.s, z.ox, z.oy);
        const ringA = Math.max(win(t, 4.6, 8.6, .4), win(t, 10.4, 14.4, .4));
        __O.ring(t < 9 ? __zr(L, z.s, z.ox, z.oy) : __zr(F, z.s, z.ox, z.oy), ringA);
        __O.cap(firstCap(
          cap(t, .9, 4.4, '01 · CARTE MONDIALE', '36 zones à risque, notées chaque heure', '7 sources ouvertes : presse mondiale, Joint War Committee, catastrophes, séismes, cyclones, météo marine.', 520, 760),
          cap(t, 4.6, 8.8, 'LE RANKING', 'Chaque zone notée de 0 à 10…', '…et traduite en rating 1 à 8, le langage du marché. À 7–8 : seuil de suspension.', 1010, 640, 780),
          cap(t, 10.2, 14.6, '02 · FIL DE VEILLE MONDIAL', 'Chaque signal daté, sourcé, vérifiable', 'Presse internationale et listings institutionnels, rattachés à leur zone et à son score.', 120, 640, 780),
          cap(t, 18.2, 24, '03 · VUE FOCUS 3D', 'Plongez dans la zone', 'Un clic sur le ranking, et la zone s’ouvre en relief.', 90, 800)));
        const R = this.row;
        __O.cursor(t < 15.6 || t > 19.6 ? null : cursorPath(t, [[15.6, 1100, 640], [17.4, R.left + 120, R.cy], [17.9, R.left + 120, R.cy, 1]]));
        if (t >= 17.9) once(this, 'click', () => { G.setHover(this.z); G.flyTo({ lat: this.z.c[0], lon: this.z.c[1], R: 300 }, 1500); });
        if (t > 19.4) { gc.R = lerp(300, 175, seg(t, 19.4, 24)); }
      } },

    /* ───────────── 3. Plongée 3D, cumuls, filtre par famille, dossier ───────────── */
    zone: { url: 'proteus-ops.html?zone=hormuz', dur: 24,
      setup() {},
      frame(t) {
        if (!this.k) { if (!__ops.ZV) return; this.k = __rect('#kpis'); this.f = __rect('#fleet'); this.tk = __rect('#kindF [data-k="tanker"]'); this.gs = __rect('#kindF [data-k="gas"]');
          const s1 = __rect('#dossier .grid2'), s2 = __rect(document.querySelector('#dossier .ladder').closest('.sec')); this.d = { left: s1.left, top: s1.top, width: s1.width, height: s2.top + s2.height - s1.top, cx: s1.cx, cy: (s1.top + s2.top + s2.height) / 2 }; }
        __O.panels(seg(t, 5.1, 6.1));
        const K = this.k, F = this.f, D = this.d;
        const z = zoomTrack(t, [[6.4, 7.8, 1.42, K.cx, K.top - 10], [11.4, 12.6, 1.4, F.cx, F.top + F.height + 10], [16.2, 17.2, 1, W / 2, H / 2], [17.2, 18.6, 1.48, D.left + D.width + 10, D.cy]]);
        __O.zoom(z.s, z.ox, z.oy);
        __O.ring(t < 11.6 ? __zr(K, z.s, z.ox, z.oy) : t < 16.4 ? __zr(F, z.s, z.ox, z.oy) : __zr(D, z.s, z.ox, z.oy), Math.max(win(t, 7.4, 11.4, .4), win(t, 12.4, 16.2, .4), win(t, 18.3, 23.6, .4)));
        __O.cap(firstCap(
          cap(t, 0, 5.2, '03 · VUE FOCUS 3D', 'Le détroit d’Ormuz, en relief', 'Trait de côte réel, couloirs de navigation, cercle de zone, navires et passages satellite.', 90, 800),
          cap(t, 7.6, 11.4, '04 · VOS CUMULS', 'Combien êtes-vous exposé, maintenant ?', 'Navires en zone et en approche, exposition coque + cargaison — dont pétrole et gaz.', 330, 560),
          cap(t, 12.4, 16.2, '04 · VOS CUMULS', 'Navire par navire, famille par famille', 'Porte-conteneurs, pétroliers, gaziers : un filtre, et le cumul se recalcule.', 300, 110),
          cap(t, 18.4, 23.8, '05 · DOSSIER DE SOUSCRIPTION', 'Du signal à la décision', 'Score, rating, seuil de suspension, taux indicatif et fiabilité de chaque source.', 110, 300, 760)));
        const T = this.tk, Gs = this.gs, zt = (r) => __zr(r, z.s, z.ox, z.oy);
        if (t > 12.6 && t < 16.3) { const a = zt(T), b = zt(Gs);
          __O.cursor(cursorPath(t, t < 14.4 ? [[12.6, 980, 520], [13.4, a.left + a.width / 2, a.top + a.height / 2], [13.7, a.left + a.width / 2, a.top + a.height / 2, 1]] : [[14.4, a.left + a.width / 2, a.top + a.height / 2], [14.9, b.left + b.width / 2, b.top + b.height / 2], [15.2, b.left + b.width / 2, b.top + b.height / 2, 1]])); }
        else __O.cursor(null);
        if (t >= 13.7) once(this, 'c1', () => document.querySelector('#kindF [data-k="tanker"]').click());
        if (t >= 15.2) once(this, 'c2', () => document.querySelector('#kindF [data-k="gas"]').click());
        if (t >= 16.6) once(this, 'c3', () => document.querySelector('#kindF [data-k="all"]').click());
      } },

    /* ───────────── 4. Passage satellite, contact sans AIS ───────────── */
    sat: { url: 'proteus-ops.html?zone=hormuz&still=1', dur: 13,
      setup() {
        const Z = __ops.ZV, d = Z.ships.find(s => !s.ais); this.d = d;
        if (d) { d.detected = false; d.satT = 0; const S = Z.SATS[0], len = Math.hypot(S.b[0] - S.a[0], S.b[1] - S.a[1]), ud = (d.x - S.a[0]) * S.d[0] + (d.z - S.a[1]) * S.d[1];
          S.t = clamp((ud - S.hl) / len - 3.4 / S.dur, .08, .9);
          Z.flyTo({ R: 1650 * Z.S, phi: .86, theta: Z.cam.theta + .25, tx: d.x * .55, ty: -10 * Z.S, tz: d.z * .55 }, 10); }
        document.getElementById('toast').classList.remove('on');
      },
      frame(t) {
        const Z = __ops.ZV; if (this.d && t < 8.6) Z.cam.theta += .0012;
        __O.cap(firstCap(
          cap(t, .3, 4.6, '06 · RECOUPEMENT SATELLITE', 'AIS ↔ satellite', 'Chaque passage radar recoupe les positions déclarées. Celui qui a coupé son AIS apparaît.', 90, 790),
          cap(t, 4.8, 13, '06 · RECOUPEMENT SATELLITE', 'Un contact sans AIS, à qualifier', 'Une alerte documentée, pas une conclusion : l’analyste qualifie, le souscripteur décide.', 90, 790)));
        if (t >= 8.4 && this.d && this.d.detected) once(this, 'sel', () => Z.selectShip(this.d, true));
      } },

    /* ───────────── 5. Calques de sources, puis vue rasante ───────────── */
    layers: { url: 'proteus-ops.html?zone=hormuz&still=1', dur: 15,
      setup() { const Z = __ops.ZV, ok = s => s.kind === 'tanker' && s.status === 'in' && !s.ballast; this.s = Z.ships.find(s => ok(s) && Z.satOk(s)) || Z.ships.find(ok) || Z.ships.find(s => s.status === 'in'); },
      frame(t) {
        const Z = __ops.ZV;
        if (t >= .2) once(this, 'sel', () => { Z.selectShip(this.s, true); });
        if (t >= 1.5) once(this, 'tilt', () => { Z.follow = null; Z.flyTo({ R: 1500 * Z.S, phi: .74, theta: Z.cam.theta - .5, tx: this.s.x, ty: -95 * Z.S, tz: this.s.z }, 2400); });
        if (t >= 8.2) once(this, 'strait', () => { Z.selectShip(null); Z.flyTo({ ...Z.VIEWS.strait, theta: .35 }, 2600); });
        if (t > 10.8) Z.cam.theta += .0035;
        __O.cap(firstCap(
          cap(t, .6, 8.2, '07 · LA PREUVE EMPILÉE', 'Pour chaque navire, quelle source confirme quoi', 'Position AIS déclarée · passage satellite · presse et Joint War Committee sur la zone.', 90, 800, 900),
          cap(t, 9.4, 15, 'AUTOMATIQUE', '36 zones, modélisées en un clic', 'Du détroit d’Ormuz à la mer Baltique : relief, couloirs et trafic calculés à l’ouverture.', 90, 800)));
      } },

    /* ───────────── 6. La carte de travail 2D ───────────── */
    map2d: { url: 'proteus-prototype.html', dur: 10, locale: 'fr-FR',
      setup() { view.clat = 21; view.clon = 52; view.scale = 4.6; viewDirty = true; this.r = __rect('#pr'); this.s = SHIPS.find(s => s.kind === 'tanker' && s.route === 'gulf'); },
      frame(t) {
        if (t < 1) { view.clat = 21; view.clon = 52; view.scale = 4.6; viewDirty = true; }
        if (t >= .4) once(this, 'sel', () => selectShip(this.s, false));
        const R = this.r, z = zoomTrack(t, [[3.6, 5, 1.4, R.left + R.width + 4, R.top - 30]]);
        __O.zoom(z.s, z.ox, z.oy);
        __O.ring(__zr({ left: R.left, top: R.top, width: R.width, height: 470 }, z.s, z.ox, z.oy), win(t, 4.8, 10, .4));
        __O.cap(firstCap(
          cap(t, .3, 4.6, '08 · LA CARTE DE TRAVAIL', 'Le poste quotidien du souscripteur', 'Carte marine, heatmap du risque, alertes d’entrée en zone — la flotte mondiale en un écran.', 720, 830),
          cap(t, 4.9, 10, '08 · LA CARTE DE TRAVAIL', 'Les navires les plus exposés, classés', 'Porte-conteneurs, pétroliers, gaziers : qui est où, et à quel niveau de risque.', 160, 560, 760)));
      } },

    /* ───────────── 7. AIS réel ───────────── */
    ais: { url: 'proteus-ops.html?still=1', dur: 7,
      setup() { __ops.G.autoRot = false; },
      frame(t) {
        const gc = __ops.G.gc; gc.R = 820; gc.lon = 60 + t * 1.6; gc.lat = 18;
        if (t >= .8) once(this, 'open', () => document.getElementById('aism').classList.add('open'));
        const z = zoomTrack(t, [[1.2, 2.6, 1.22, W / 2, H / 2 - 40]]); __O.zoom(z.s, z.ox, z.oy);
        __O.cap(cap(t, 1.4, 7, '09 · DONNÉES RÉELLES', 'Branché sur l’AIS réel, en un clic', 'Demain : votre portefeuille assuré suivi navire par navire (IMO), satellite inclus.', 90, 820));
      } },

    /* ───────────── 8. Conclusion ───────────── */
    outro: { url: 'proteus-ops.html?still=1', dur: 9,
      setup() { __ops.G.autoRot = false; },
      frame(t) {
        const gc = __ops.G.gc; gc.R = lerp(900, 1250, ease(t / 9)); gc.lon = 80 + t * 2; gc.lat = 18;
        __O.panels(0, '.reveal,#tools,#legend,header,#labels'); __O.veil(lerp(.6, .84, seg(t, 0, 3.4)));
        let html = '';
        if (t < 3.6) { const a = win(t, .2, 3.6, .4); html = `<div style="opacity:${a}"><div class="q1">Proteus éclaire et documente.</div><div class="q2" style="opacity:${seg(t, 1.1, 1.6)};color:#E6EEF9;text-shadow:none">Le souscripteur et le marché décident.</div></div>`; }
        else { const a = seg(t, 3.7, 4.5);
          html = `<div style="opacity:${a}"><div class="logo">${LOGO}<b>PROTEUS</b></div>
            <div class="sub"><em>La salle de veille risque de guerre</em><br>pour les souscripteurs et courtiers maritimes</div>
            <div class="cta" style="opacity:${seg(t, 5, 5.6)}">RÉSERVEZ UNE DÉMONSTRATION</div>
            <div class="foot" style="opacity:${seg(t, 5.4, 6)}">Démonstration · scores de zones réels (instantané du 16/07/2026) · flotte et passages satellite simulés</div></div>`; }
        __O.card(html);
      } },
  };
})();
