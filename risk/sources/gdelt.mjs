// Antenne GDELT — la presse mondiale, sans clé.
// v1.3 : UNE SEULE requête mondiale (les IP partagées de GitHub sont trop
// limitées pour 36 appels). On récupère les ~250 derniers articles maritimes
// des 24 h, puis chaque zone est associée localement à ses articles par
// correspondance de mots-clés dans les titres. Zéro pacing, zéro 429.

import { getJSON, sleep } from './util.mjs';

const DOC = 'https://api.gdeltproject.org/api/v2/doc/doc';

const CONFLICT_RE = /attack|strike|missile|drone|hijack|seiz|pirac|pirat|blockad|warship|navy|clash|mine|explos|sabotage|kidnap|gunmen|rebel|houthi|shell|bomb|raid|incursion|warns|threat/i;

// requêtes candidates, de la plus riche à la plus simple (la 1re qui marche gagne)
const QUERIES = [
  // deux groupes OU reliés par ET implicite — syntaxe documentée GDELT
  '(ship OR vessel OR tanker OR cargo OR maritime OR port OR strait) (attack OR missile OR piracy OR hijacked OR seized OR blockade OR strike OR navy OR mine)',
  // repli : chaîne OU plate, acceptée à coup sûr
  '"cargo ship" OR "container ship" OR tanker OR piracy OR "Red Sea" OR "Strait of Hormuz" OR "Black Sea" OR "South China Sea" OR "Gulf of Guinea"',
];

export async function fetchGlobalNews() {
  let arts = null, usedQuery = -1;
  for (let qi = 0; qi < QUERIES.length; qi++) {
    try {
      const u = `${DOC}?query=${encodeURIComponent(QUERIES[qi])}&mode=artlist&format=json&maxrecords=250&timespan=24h&sort=datedesc`;
      const d = await getJSON(u, { tries: 3, wait429: 45000 });
      if (Array.isArray(d.articles)) { arts = d.articles; usedQuery = qi; break; }
    } catch (e) { console.warn(`  [gdelt] requête ${qi + 1} KO : ${e.message.slice(-60)}`); await sleep(8000); }
  }
  if (!arts) throw new Error('GDELT inaccessible (toutes requêtes)');
  console.log(`  [gdelt] requête ${usedQuery + 1} OK — ${arts.length} articles maritimes (24 h)`);
  const seen = new Set();
  const out = [];
  for (const a of arts) {
    const title = (a.title || '').trim();
    if (!title) continue;
    const k = title.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      t: title.slice(0, 140), tl: k, u: a.url,
      s: a.domain || a.sourcecountry || '', d: a.seendate || '',
      conflict: CONFLICT_RE.test(title),
    });
  }
  return out;
}

// termes de correspondance d'une zone : les expressions de zone.query + son nom
export function zoneTerms(zone) {
  const terms = [];
  for (const m of zone.query.matchAll(/"([^"]+)"/g)) terms.push(m[1].toLowerCase());
  for (const w of zone.query.split(/\s+OR\s+/)) {
    const t = w.replaceAll('"', '').trim().toLowerCase();
    if (t && !terms.includes(t)) terms.push(t);
  }
  return terms;
}

// articles d'une zone : le titre contient au moins un terme de la zone
export function matchZone(articles, terms) {
  const mine = articles.filter(a => terms.some(t => a.tl.includes(t)));
  const conflict = mine.filter(a => a.conflict);
  return {
    count: mine.length,
    conflict: conflict.length,
    headlines: [...conflict, ...mine.filter(a => !a.conflict)].slice(0, 3)
      .map(({ t, u, s, d }) => ({ t, u, s, d })),
  };
}
