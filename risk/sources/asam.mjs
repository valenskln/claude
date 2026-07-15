// Antenne ASAM (NGA, marine américaine) — les attaques de navires recensées
// officiellement : piraterie, abordages, tirs, enlèvements. Sans clé.
// Un seul appel mondial (90 derniers jours), le tri par zone se fait ensuite.

import { getJSON } from './util.mjs';

export async function fetchAsam() {
  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const until = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const u = `https://msi.nga.mil/api/publications/asam?minOccurDate=${since}&maxOccurDate=${until}&sortBy=date&output=json`;
  const d = await getJSON(u, { tries: 4 });
  const list = Array.isArray(d) ? d : (d.asam || d.data || []);
  return list.map(x => ({
    date: Date.parse(x.date || x.occurDate || '') || Date.now(),
    lat: +x.latitude, lon: +x.longitude,
    type: (x.hostility || x.hostility_d || 'incident').toString().slice(0, 60),
    victim: (x.victim || '').toString().slice(0, 60),
    desc: (x.description || '').toString().slice(0, 200),
  })).filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lon));
}
