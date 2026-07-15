// Antenne Open-Meteo Marine — hauteur de vagues prévue (36 prochaines heures)
// au centre de chaque zone. Sans clé, et UNE SEULE requête pour toutes les zones.
// Les centres situés à terre (ex. canal de Suez) renvoient null → 0.

import { getJSON } from './util.mjs';

export async function fetchWaves(zones) {
  const lats = zones.map(z => z.c[0]).join(',');
  const lons = zones.map(z => z.c[1]).join(',');
  const u = `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&hourly=wave_height&forecast_days=2&timezone=UTC`;
  const d = await getJSON(u, { tries: 3 });
  const arr = Array.isArray(d) ? d : [d];
  return arr.map(x => {
    const h = (x && x.hourly && x.hourly.wave_height) || [];
    let max = 0;
    for (const v of h.slice(0, 36)) if (v != null && v > max) max = v;
    return Math.round(max * 10) / 10;   // vague max prévue, en mètres
  });
}
