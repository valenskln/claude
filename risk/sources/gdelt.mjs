// Antenne GDELT — la presse mondiale, sans clé.
// v1.1 : UN SEUL appel DOC par zone (GDELT limite sévèrement les robots).
// La requête est une simple chaîne de OU entre expressions exactes — les
// structures complexes (ET + OU imbriqués) sont refusées par l'API.
// Le signal "conflit" est déduit localement en analysant les titres reçus.

import { getJSON, sleep } from './util.mjs';

const DOC = 'https://api.gdeltproject.org/api/v2/doc/doc';
const PAUSE = 5000;     // 5 s entre zones — impératif, GDELT bannit les impatients

const CONFLICT_RE = /attack|strike|missile|drone|hijack|seiz|pirac|pirat|blockad|warship|navy|clash|mine|explos|sabotage|kidnap|gunmen|rebel|houthi|shell|bomb|raid|incursion/i;

export async function fetchZoneSignals(zone) {
  const out = { count: 0, conflict: 0, headlines: [], ok: false };
  try {
    const u = `${DOC}?query=${encodeURIComponent(zone.query)}&mode=artlist&format=json&maxrecords=40&timespan=3d&sort=datedesc`;
    const d = await getJSON(u, { tries: 2, wait429: 30000 });
    const arts = d.articles || [];
    out.count = arts.length;
    const seen = new Set();
    for (const a of arts) {
      const title = (a.title || '').trim();
      if (!title) continue;
      if (CONFLICT_RE.test(title)) out.conflict++;
      const k = title.toLowerCase();
      if (out.headlines.length < 3 && !seen.has(k)) {
        seen.add(k);
        out.headlines.push({
          t: title.slice(0, 140), u: a.url,
          s: a.domain || a.sourcecountry || '',
          d: a.seendate || '',
        });
      }
    }
    out.ok = true;
  } catch (e) { console.warn(`  [gdelt] ${zone.id}: ${e.message}`); }
  await sleep(PAUSE);
  return out;
}
