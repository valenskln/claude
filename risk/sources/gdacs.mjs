// Antenne GDACS (ONU / Commission européenne) — catastrophes naturelles en cours
// avec niveau d'alerte vert / orange / rouge. Sans clé. Un appel mondial.

import { getJSON } from './util.mjs';

const TYPES = { EQ: 'séisme', TC: 'cyclone', FL: 'inondation', VO: 'éruption', TS: 'tsunami', DR: 'sécheresse' };
const TYPES_EN = { EQ: 'earthquake', TC: 'cyclone', FL: 'flood', VO: 'eruption', TS: 'tsunami', DR: 'drought' };

export async function fetchGdacs() {
  const u = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;VO;TS&alertlevel=orange;red';
  const d = await getJSON(u, { tries: 4 });
  const feats = d.features || [];
  return feats.map(f => {
    const p = f.properties || {};
    const g = (f.geometry && f.geometry.coordinates) || [0, 0];
    return {
      lat: +g[1], lon: +g[0],
      level: (p.alertlevel || '').toLowerCase(),            // 'orange' | 'red'
      type: TYPES[p.eventtype] || p.eventtype || 'événement',
      type_en: TYPES_EN[p.eventtype] || p.eventtype || 'event',
      name: (p.eventname || p.name || '').toString().slice(0, 60),
      score: +p.alertscore || 0,
    };
  }).filter(x => Number.isFinite(x.lat) && (x.level === 'orange' || x.level === 'red'));
}
