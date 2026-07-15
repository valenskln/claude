// Antenne USGS — séismes des dernières 24 h (magnitude ≥ 4.5), mis à jour
// chaque minute. Sans clé. Un appel mondial, filtrage par zone ensuite.

import { getJSON } from './util.mjs';

export async function fetchUsgs() {
  const u = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';
  const d = await getJSON(u, { tries: 4 });
  return (d.features || []).map(f => {
    const p = f.properties || {};
    const g = (f.geometry && f.geometry.coordinates) || [0, 0];
    return {
      lat: +g[1], lon: +g[0],
      mag: +p.mag || 0,
      tsunami: p.tsunami === 1,
      place: (p.place || '').toString().slice(0, 80),
      time: +p.time || Date.now(),
    };
  }).filter(x => Number.isFinite(x.lat) && x.mag >= 4.5);
}
