// Antenne ASAM (NGA, marine américaine) — les attaques de navires recensées
// officiellement : piraterie, abordages, tirs, enlèvements. Sans clé.
// Un seul appel mondial (90 derniers jours), le tri par zone se fait ensuite.

import { getJSON } from './util.mjs';

export async function fetchAsam() {
  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const until = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  // l'API .mil change parfois de forme : on tente plusieurs variantes connues
  const candidates = [
    `https://msi.nga.mil/api/publications/asam?minOccurDate=${since}&maxOccurDate=${until}&sortBy=date&output=json`,
    `https://msi.nga.mil/api/publications/asam?sortBy=date&output=json`,
    `https://msi.nga.mil/api/publications/asam?output=json`,
    `https://msi.nga.mil/api/publications/asam`,
  ];
  let d = null, used = '';
  for (const u of candidates) {
    try { d = await getJSON(u, { tries: 2 }); used = u; break; }
    catch (e) { console.warn(`  [asam] variante KO (${e.message.slice(-30)})`); }
  }
  if (!d) throw new Error('toutes les variantes ASAM ont échoué');
  console.log(`  [asam] variante OK : ${used.split('?')[0]}?${(used.split('?')[1] || '').slice(0, 40)}`);
  const list = Array.isArray(d) ? d : (d.asam || d.data || []);
  return list.map(x => ({
    date: Date.parse(x.date || x.occurDate || '') || Date.now(),
    lat: +x.latitude, lon: +x.longitude,
    type: (x.hostility || x.hostility_d || 'incident').toString().slice(0, 60),
    victim: (x.victim || '').toString().slice(0, 60),
    desc: (x.description || '').toString().slice(0, 200),
  })).filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lon));
}
