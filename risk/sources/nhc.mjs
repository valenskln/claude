// Antenne NOAA NHC — cyclones tropicaux ACTIFS (Atlantique + Pacifique est/centre).
// Sans clé. Complète GDACS en captant les tempêtes plus tôt et avec position précise.

import { getJSON } from './util.mjs';

const CLASS = { HU: 'ouragan', MH: 'ouragan majeur', TS: 'tempête tropicale', TD: 'dépression tropicale', STS: 'tempête subtropicale' };

export async function fetchStorms() {
  const d = await getJSON('https://www.nhc.noaa.gov/CurrentStorms.json', { tries: 3 });
  return (d.activeStorms || []).map(s => ({
    name: (s.name || '').toString().slice(0, 30),
    kind: CLASS[s.classification] || 'système tropical',
    major: s.classification === 'HU' || s.classification === 'MH',
    lat: +s.latitudeNumeric, lon: +s.longitudeNumeric,
  })).filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lon));
}
