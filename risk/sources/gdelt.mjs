// Antenne GDELT — la presse mondiale, rafraîchie toutes les 15 minutes, sans clé.
// Trois usages par zone :
//   1. GEO 2.0  : combien d'articles à vocabulaire "conflit" sont géolocalisés DANS la zone (7 j)
//   2. DOC artlist : les derniers titres de presse de la zone (pour la fiche)
//   3. DOC timelinetone : la tonalité moyenne de l'actualité de la zone (négative = tension)

import { getJSON, sleep } from './util.mjs';

const GEO = 'https://api.gdeltproject.org/api/v2/geo/geo';
const DOC = 'https://api.gdeltproject.org/api/v2/doc/doc';
const PAUSE = 2600; // ms entre appels — politesse imposée par GDELT

const CONFLICT_VOCAB = '(attack OR strike OR missile OR drone OR seizure OR hijack OR piracy OR blockade OR warship OR clash OR mine)';

export async function fetchZoneSignals(zone) {
  const out = { conflictHits: 0, tone: 0, headlines: [], ok: { geo: false, art: false, tone: false } };

  // 1. volume "conflit" géolocalisé dans le rayon de la zone (fenêtre 7 j de l'API GEO)
  try {
    const u = `${GEO}?query=${encodeURIComponent(`${CONFLICT_VOCAB} near:${zone.c[0]},${zone.c[1]},${zone.r}km`)}&format=geojson`;
    const g = await getJSON(u);
    for (const f of (g.features || [])) out.conflictHits += (f.properties && f.properties.count) || 1;
    out.ok.geo = true;
  } catch (e) { console.warn(`  [gdelt-geo] ${zone.id}: ${e.message}`); }
  await sleep(PAUSE);

  // 2. derniers titres de presse (fenêtre 48 h, requête par mots-clés de la zone)
  try {
    const u = `${DOC}?query=${encodeURIComponent(zone.query)}&mode=artlist&format=json&maxrecords=8&timespan=48h&sort=datedesc`;
    const d = await getJSON(u);
    const seen = new Set();
    for (const a of (d.articles || [])) {
      const title = (a.title || '').trim();
      if (!title || seen.has(title.toLowerCase())) continue;
      seen.add(title.toLowerCase());
      out.headlines.push({
        t: title.slice(0, 140),
        u: a.url,
        s: a.domain || a.sourcecountry || '',
        d: a.seendate || '',           // format AAAAMMJJHHMMSS
      });
      if (out.headlines.length >= 3) break;
    }
    out.ok.art = true;
  } catch (e) { console.warn(`  [gdelt-doc] ${zone.id}: ${e.message}`); }
  await sleep(PAUSE);

  // 3. tonalité moyenne sur 7 jours (< 0 = négatif ; < -6 = très tendu)
  try {
    const u = `${DOC}?query=${encodeURIComponent(zone.query)}&mode=timelinetone&format=json&timespan=7d`;
    const d = await getJSON(u);
    const serie = d.timeline && d.timeline[0] && d.timeline[0].data || [];
    if (serie.length) {
      // moyenne pondérée vers les dernières 24 h (les 4 derniers points pèsent double)
      let sum = 0, w = 0;
      serie.forEach((p, i) => { const k = i >= serie.length - 4 ? 2 : 1; sum += p.value * k; w += k; });
      out.tone = sum / w;
    }
    out.ok.tone = true;
  } catch (e) { console.warn(`  [gdelt-tone] ${zone.id}: ${e.message}`); }
  await sleep(PAUSE);

  return out;
}
