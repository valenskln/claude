// Horloge virtuelle : la page n'avance que quand le réalisateur appelle __step(ms).
(() => {
  let t = 0, id = 1; const raf = [], timers = [];
  const realNow = performance.now.bind(performance);
  performance.now = () => t;
  window.requestAnimationFrame = cb => { raf.push(cb); return id++; };
  window.cancelAnimationFrame = () => {};
  window.setTimeout = (fn, ms = 0, ...a) => { const o = { id: id++, at: t + (+ms || 0), fn, a }; timers.push(o); return o.id; };
  window.setInterval = (fn, ms = 0, ...a) => { const o = { id: id++, at: t + (+ms || 1), fn, a, every: Math.max(1, +ms || 1) }; timers.push(o); return o.id; };
  window.clearTimeout = window.clearInterval = i => { const k = timers.findIndex(x => x.id === i); if (k >= 0) timers.splice(k, 1); };
  window.__vt = () => t;
  window.__step = ms => {
    const end = t + ms;
    for (;;) { timers.sort((a, b) => a.at - b.at); const n = timers[0]; if (!n || n.at > end) break; t = Math.max(t, n.at);
      if (n.every) n.at += n.every; else timers.shift();
      try { typeof n.fn === 'function' ? n.fn(...n.a) : null; } catch (e) { console.error('timer', e); } }
    t = end;
    const list = raf.splice(0); for (const cb of list) { try { cb(t); } catch (e) { console.error('raf', e && e.stack || e); } }
  };
})();
