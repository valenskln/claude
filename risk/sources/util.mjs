// Outils communs des connecteurs : fetch avec réessais, pause, distance.

const UA = 'Mozilla/5.0 (compatible; ProteusAI-risk/1.0; +https://valenskln.github.io/claude/)';

export async function getJSON(url, { tries = 3, timeout = 25000, wait429 = 0 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeout);
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, signal: ctrl.signal });
      clearTimeout(t);
      if (res.status === 429 && wait429 && i < tries - 1) {
        // trop de requêtes : longue pause avant de retenter
        await sleep(wait429);
        throw new Error('HTTP 429 (retenté après pause)');
      }
      // 404/410 : ressource absente, pas une panne transitoire — retenter ne
      // sert à rien et ne fait que ralentir le pipeline à chaque run.
      if (res.status === 404 || res.status === 410) throw new Error(`HTTP ${res.status}`, { cause: 'permanent' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.trim()) throw new Error('réponse vide');
      return JSON.parse(text);
    } catch (e) {
      lastErr = e;
      if (e.cause === 'permanent') break;
      if (!String(e.message).includes('429')) await sleep(1500 * (i + 1));
    }
  }
  throw new Error(`${url.split('?')[0]} : ${lastErr.message}`);
}

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const R = 6371;
export function havKm(a1, o1, a2, o2) {
  const d = Math.PI / 180, la1 = a1 * d, la2 = a2 * d;
  const h = Math.sin((a2 - a1) * d / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin((o2 - o1) * d / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Décroissance exponentielle : poids 1 aujourd'hui, 0.5 après `halfLifeDays`.
export function decay(dateMs, halfLifeDays) {
  const age = (Date.now() - dateMs) / 86400000;
  return age < 0 ? 1 : Math.pow(0.5, age / halfLifeDays);
}
