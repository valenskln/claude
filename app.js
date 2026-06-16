/* ============================================================
   RENAULT TRUCKS – RÉSEAU CONCESSIONNAIRES
   app.js – Application principale
   ============================================================ */

'use strict';

// ============================================================
// CONFIG GROUPES
// ============================================================
const GROUP_CONFIG = [
  { prefix: 'RENAULT TRUCKS GRAND PARIS', name: 'Renault Trucks Grand Paris', color: '#212121' },
  { prefix: 'RENAULT TRUCKS PROVENCE',    name: 'Renault Trucks Provence',    color: '#00695C' },
  { prefix: 'RENAULT TRUCKS MARSEILLE',   name: 'Renault Trucks Marseille',   color: '#0277BD' },
  { prefix: 'BERNARD TRUCKS',             name: 'Bernard Trucks',             color: '#1565C0' },
  { prefix: 'KERTRUCKS',                  name: 'Kertrucks',                  color: '#C62828' },
  { prefix: 'AZUR TDR',                   name: 'Azur TDR',                   color: '#E65100' },
  { prefix: 'FAURIE TRUCKS',              name: 'Faurie Trucks',              color: '#2E7D32' },
  { prefix: 'BERTHIER TRUCKS',            name: 'Berthier Trucks',            color: '#6A1B9A' },
  { prefix: 'BERNIS TRUCKS',              name: 'Bernis Trucks',              color: '#F57F17' },
  { prefix: 'BOURLIER',                   name: 'Bourlier',                   color: '#AD1457' },
  { prefix: 'CATRA',                      name: 'Catra',                      color: '#4E342E' },
  { prefix: 'LOIRET TRUCKS',              name: 'Loiret Trucks',              color: '#558B2F' },
  { prefix: 'CATALOGNE POIDS LOURDS',     name: 'Catalogne Poids Lourds',     color: '#795548' },
  { prefix: 'ETS DARRIGRAND',             name: 'Ets Darrigrand',             color: '#00838F' },
  { prefix: 'TRANSLOC TRUCKS',            name: 'Transloc Trucks',            color: '#1976D2' },
  { prefix: 'SOTRAVI TRUCKS',             name: 'Sotravi Trucks',             color: '#D32F2F' },
  { prefix: 'NORMAN TRUCKS',              name: 'Norman Trucks',              color: '#388E3C' },
  { prefix: 'PICARDI TRUCKS',             name: 'Picardi Trucks',             color: '#7B1FA2' },
  { prefix: 'NORDEST TRUCKS',             name: 'Nordest Trucks',             color: '#0097A7' },
  { prefix: 'ATLANPOIDS',                 name: 'Atlanpoids',                 color: '#F57C00' },
  { prefix: 'CENTRALPOIDS',               name: 'Centralpoids',               color: '#5D4037' },
  { prefix: 'MASSIF TRUCKS',              name: 'Massif Trucks',              color: '#616161' },
  { prefix: 'JURA TRUCKS',               name: 'Jura Trucks',                color: '#827717' },
  { prefix: 'ALPES TRUCKS',              name: 'Alpes Trucks',               color: '#4527A0' },
  { prefix: 'EUROTRUCKS',                name: 'Eurotrucks',                 color: '#00796B' },
  { prefix: 'MEDITERRANEE TRUCKS',       name: 'Méditerranée Trucks',        color: '#01579B' },
  { prefix: 'LANGUEDOC TRUCKS',          name: 'Languedoc Trucks',           color: '#E91E63' },
  { prefix: 'GERS TRUCKS',               name: 'Gers Trucks',                color: '#FF6F00' },
  { prefix: 'SAVOIE TRUCKS',             name: 'Savoie Trucks',              color: '#0288D1' },
  { prefix: 'RHONE TRUCKS',              name: 'Rhône Trucks',               color: '#C2185B' },
  { prefix: 'BRETAGNE TRUCKS',           name: 'Bretagne Trucks',            color: '#303F9F' },
  { prefix: 'GASCOGNE TRUCKS',           name: 'Gascogne Trucks',            color: '#689F38' },
  { prefix: 'CHARENTAIS TRUCKS',         name: 'Charentais Trucks',          color: '#7C4DFF' },
  { prefix: 'PARIS TRUCKS',              name: 'Paris Trucks',               color: '#37474F' },
  { prefix: 'SEINE TRUCKS',              name: 'Seine Trucks',               color: '#00ACC1' },
  { prefix: 'OISE TRUCKS',               name: 'Oise Trucks',                color: '#8D6E63' },
  { prefix: 'LORRAINE TRUCKS',           name: 'Lorraine Trucks',            color: '#546E7A' },
  { prefix: 'ALSACE TRUCKS',             name: 'Alsace Trucks',              color: '#EF6C00' },
  { prefix: 'MIDI TRUCKS',               name: 'Midi Trucks',                color: '#6D4C41' },
  { prefix: 'ARDECHE TRUCKS',            name: 'Ardèche Trucks',             color: '#1B5E20' },
  { prefix: 'TARN TRUCKS',               name: 'Tarn Trucks',                color: '#880E4F' },
  { prefix: 'AVEYRON TRUCKS',            name: 'Aveyron Trucks',             color: '#33691E' },
  { prefix: 'NORD TRUCKS',               name: 'Nord Trucks',                color: '#0D47A1' },
  { prefix: 'BERRY TRUCKS',              name: 'Berry Trucks',               color: '#BF360C' },
  { prefix: 'AUVERGNE TRUCKS',           name: 'Auvergne Trucks',            color: '#4A148C' },
];

const INDEPENDENT_GROUP = { prefix: '__INDEPENDENT__', name: 'Indépendants', color: '#757575' };

// ============================================================
// STATE
// ============================================================
let map, clusterGroup, heatLayer;
let allDealers = [];
let markerObjs = [];       // { dealer, marker, group }
let groupVisibility = {};
let activeFilters = { region: '', department: '' };
let isHeatmap = false;
let isTop10Mode = false;
let charts = {};
let darkTileLayer = null;

// ============================================================
// GROUP DETECTION
// ============================================================
function detectGroup(nameUpper) {
  // Match longest prefix first
  const sorted = [...GROUP_CONFIG].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const g of sorted) {
    if (nameUpper.startsWith(g.prefix)) return g;
  }
  return INDEPENDENT_GROUP;
}

// ============================================================
// INIT
// ============================================================
async function init() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Impossible de charger data.json');
    const raw = await res.json();

    // Deduplicate by name
    const seen = new Set();
    const deduped = raw.filter(d => {
      const key = d.name.trim().toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Enrich
    allDealers = deduped.map(d => ({
      ...d,
      nameUpper: d.name.trim().toUpperCase(),
      group: detectGroup(d.name.trim().toUpperCase()),
    }));

    // Init group visibility
    getUniqueGroups().forEach(g => { groupVisibility[g.name] = true; });

    // Setup
    initMap();
    createMarkers();
    buildSidebar();
    buildFilters();
    buildLegend();
    updateStats();
    setupEvents();

    hideLoader();
  } catch (err) {
    document.getElementById('map-loader').innerHTML =
      `<div style="color:#ef4444;font-weight:600">Erreur : ${err.message}</div>`;
  }
}

// ============================================================
// MAP INIT
// ============================================================
function initMap() {
  map = L.map('map', {
    center: [46.5, 2.5],
    zoom: 6,
    zoomControl: true,
    preferCanvas: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 55,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    iconCreateFunction: createClusterIcon,
    chunkedLoading: true,
  });

  map.addLayer(clusterGroup);
}

function createClusterIcon(cluster) {
  const children = cluster.getAllChildMarkers();
  // Count by group
  const counts = {};
  children.forEach(m => {
    const g = m.options.groupName || 'Indépendants';
    counts[g] = (counts[g] || 0) + 1;
  });
  const dominantName = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const group = [...GROUP_CONFIG, INDEPENDENT_GROUP].find(g => g.name === dominantName);
  const color = group ? group.color : '#2563eb';

  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 50 ? 42 : 52;

  return L.divIcon({
    html: `<div style="
      background:${color};
      width:${size}px;height:${size}px;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:${size < 40 ? 11 : 13}px;
      border:2.5px solid rgba(255,255,255,0.85);
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    ">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ============================================================
// MARKERS
// ============================================================
function createMarkers() {
  markerObjs = [];

  allDealers.forEach(dealer => {
    const { color, name: groupName } = dealer.group;

    const icon = L.divIcon({
      html: `<div style="
        background:${color};
        width:13px;height:13px;
        border-radius:50%;
        border:2px solid rgba(255,255,255,0.9);
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
      "></div>`,
      className: '',
      iconSize: [13, 13],
      iconAnchor: [6, 6],
    });

    const marker = L.marker([dealer.lat, dealer.lng], {
      icon,
      groupName,
      dealerName: dealer.name,
    });

    marker.bindPopup(buildPopupHTML(dealer), { maxWidth: 280 });

    markerObjs.push({ dealer, marker, group: dealer.group });
  });

  refreshMarkers();
}

function buildPopupHTML(dealer) {
  const { color } = dealer.group;
  return `
    <div class="popup-content">
      <div class="popup-header" style="background:${color}">
        <strong>${escapeHtml(dealer.name)}</strong>
      </div>
      <div class="popup-body">
        <div class="popup-row">
          <span class="popup-label">Groupe</span>
          <span class="popup-value" style="color:${color}">${escapeHtml(dealer.group.name)}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Ville</span>
          <span class="popup-value">${escapeHtml(dealer.city)}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Département</span>
          <span class="popup-value">${escapeHtml(dealer.department)}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Région</span>
          <span class="popup-value">${escapeHtml(dealer.region)}</span>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getFilteredMarkers() {
  return markerObjs.filter(({ dealer, group }) => {
    if (!groupVisibility[group.name]) return false;
    if (activeFilters.region && dealer.region !== activeFilters.region) return false;
    if (activeFilters.department && dealer.department !== activeFilters.department) return false;
    return true;
  });
}

function refreshMarkers() {
  clusterGroup.clearLayers();
  if (isHeatmap) return;

  const visible = getFilteredMarkers();
  const layerArr = visible.map(m => m.marker);
  clusterGroup.addLayers(layerArr);
  updateStats(visible.length);
}

// ============================================================
// HEATMAP
// ============================================================
function toggleHeatmap() {
  isHeatmap = !isHeatmap;
  const btn = document.getElementById('btn-toggle-heatmap');

  if (isHeatmap) {
    clusterGroup.clearLayers();
    const pts = getFilteredMarkers().map(({ dealer }) => [dealer.lat, dealer.lng, 1]);
    heatLayer = L.heatLayer(pts, { radius: 38, blur: 22, maxZoom: 10, gradient: { 0.4: '#3b82f6', 0.65: '#f59e0b', 1.0: '#ef4444' } }).addTo(map);
    btn.querySelector('.btn-label').textContent = 'Marqueurs';
    btn.querySelector('span:first-child').textContent = '📍';
    btn.classList.add('active');
  } else {
    if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
    refreshMarkers();
    btn.querySelector('.btn-label').textContent = 'Heatmap';
    btn.querySelector('span:first-child').textContent = '🌡️';
    btn.classList.remove('active');
  }
}

// ============================================================
// GROUPS
// ============================================================
function getUniqueGroups() {
  const map = new Map();
  allDealers.forEach(d => {
    const n = d.group.name;
    if (!map.has(n)) map.set(n, { ...d.group, count: 0 });
    map.get(n).count++;
  });
  return [...map.values()].sort((a, b) => b.count - a.count);
}

// ============================================================
// SIDEBAR
// ============================================================
function buildSidebar() {
  const container = document.getElementById('group-list');
  const groups = getUniqueGroups();

  container.innerHTML = groups.map(g => `
    <div class="group-item">
      <label class="group-label">
        <input type="checkbox" class="group-checkbox" data-group="${escapeHtml(g.name)}" checked>
        <span class="group-color-dot" style="background:${g.color}"></span>
        <span class="group-name" title="${escapeHtml(g.name)}">${escapeHtml(g.name)}</span>
        <span class="group-count">${g.count}</span>
      </label>
    </div>
  `).join('');

  container.querySelectorAll('.group-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      groupVisibility[cb.dataset.group] = cb.checked;
      refreshMarkers();
      if (isHeatmap) { map.removeLayer(heatLayer); heatLayer = null; isHeatmap = false; toggleHeatmap(); }
    });
  });
}

// ============================================================
// FILTERS
// ============================================================
function buildFilters() {
  const regions = [...new Set(allDealers.map(d => d.region))].sort();
  const departments = [...new Set(allDealers.map(d => d.department))].sort();

  const rSel = document.getElementById('filter-region');
  regions.forEach(r => {
    const o = document.createElement('option');
    o.value = r; o.textContent = r;
    rSel.appendChild(o);
  });

  const dSel = document.getElementById('filter-department');
  departments.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    dSel.appendChild(o);
  });

  rSel.addEventListener('change', () => {
    activeFilters.region = rSel.value;
    refreshMapIfHeatmap();
  });
  dSel.addEventListener('change', () => {
    activeFilters.department = dSel.value;
    refreshMapIfHeatmap();
  });

  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    rSel.value = ''; dSel.value = '';
    activeFilters.region = ''; activeFilters.department = '';
    refreshMapIfHeatmap();
  });
}

function refreshMapIfHeatmap() {
  if (isHeatmap) {
    if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
    isHeatmap = false;
    const btn = document.getElementById('btn-toggle-heatmap');
    btn.querySelector('.btn-label').textContent = 'Heatmap';
    btn.querySelector('span:first-child').textContent = '🌡️';
    btn.classList.remove('active');
  }
  refreshMarkers();
}

// ============================================================
// LEGEND
// ============================================================
function buildLegend() {
  const groups = getUniqueGroups();
  const maxShown = 9;
  const shown = groups.slice(0, maxShown);

  document.getElementById('legend-items').innerHTML = shown.map(g => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${g.color}"></span>
      <span>${escapeHtml(g.name)}</span>
    </div>
  `).join('') + (groups.length > maxShown
    ? `<div class="legend-more">+${groups.length - maxShown} autres groupes</div>` : '');
}

// ============================================================
// STATS
// ============================================================
function updateStats(visibleCount) {
  document.getElementById('stat-total').textContent = allDealers.length;
  document.getElementById('stat-groups').textContent = getUniqueGroups().length;
  document.getElementById('stat-visible').textContent =
    visibleCount !== undefined ? visibleCount : getFilteredMarkers().length;
}

// ============================================================
// STATS MODAL
// ============================================================
function showStatsModal() {
  document.getElementById('stats-modal').classList.remove('hidden');

  const groups = getUniqueGroups();
  const regions = {};
  allDealers.forEach(d => { regions[d.region] = (regions[d.region] || 0) + 1; });
  const regionEntries = Object.entries(regions).sort((a, b) => b[1] - a[1]);

  document.getElementById('stats-summary').innerHTML = `
    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-number">${allDealers.length}</div>
        <div class="stats-label">Concessionnaires</div>
      </div>
      <div class="stats-card">
        <div class="stats-number">${groups.length}</div>
        <div class="stats-label">Groupes</div>
      </div>
      <div class="stats-card">
        <div class="stats-number">${Object.keys(regions).length}</div>
        <div class="stats-label">Régions</div>
      </div>
      <div class="stats-card">
        <div class="stats-number">${[...new Set(allDealers.map(d => d.department))].length}</div>
        <div class="stats-label">Départements</div>
      </div>
    </div>
  `;

  const top10 = groups.slice(0, 10);
  document.getElementById('top10-table').innerHTML = `
    <h3>🏆 Top 10 groupes par nombre de sites</h3>
    <table class="stats-table">
      <thead>
        <tr><th>#</th><th>Groupe</th><th>Sites</th><th>Part</th></tr>
      </thead>
      <tbody>
        ${top10.map((g, i) => `
          <tr>
            <td><strong>${i + 1}</strong></td>
            <td><span class="inline-dot" style="background:${g.color}"></span>${escapeHtml(g.name)}</td>
            <td><strong>${g.count}</strong></td>
            <td>${((g.count / allDealers.length) * 100).toFixed(1)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // Destroy old charts
  Object.values(charts).forEach(c => c.destroy());
  charts = {};

  // Doughnut – top 10 groups
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#e2e8f0' : '#1e293b';

  const ctx1 = document.getElementById('chart-groups').getContext('2d');
  charts.groups = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: top10.map(g => g.name),
      datasets: [{
        data: top10.map(g => g.count),
        backgroundColor: top10.map(g => g.color),
        borderWidth: 2,
        borderColor: isDark ? '#1e293b' : '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 10 }, color: textColor, boxWidth: 12, padding: 6 },
        },
        title: { display: true, text: 'Répartition par groupe (Top 10)', color: textColor, font: { size: 13 } },
      },
    },
  });

  // Bar – regions
  const ctx2 = document.getElementById('chart-regions').getContext('2d');
  charts.regions = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: regionEntries.map(([r]) => r),
      datasets: [{
        label: 'Sites',
        data: regionEntries.map(([, c]) => c),
        backgroundColor: '#2563eb',
        borderRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Sites par région', color: textColor, font: { size: 13 } },
      },
      scales: {
        x: { beginAtZero: true, ticks: { color: textColor }, grid: { color: isDark ? '#334155' : '#e2e8f0' } },
        y: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
      },
    },
  });
}

// ============================================================
// SEARCH
// ============================================================
function setupSearch() {
  const input = document.getElementById('global-search');
  const results = document.getElementById('search-results');
  const clearBtn = document.getElementById('search-clear');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    clearBtn.classList.toggle('hidden', !q);

    if (!q || q.length < 2) {
      results.classList.remove('visible');
      results.innerHTML = '';
      return;
    }

    const matches = allDealers.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      d.group.name.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q)
    ).slice(0, 12);

    if (!matches.length) {
      results.innerHTML = '<div class="search-empty">Aucun résultat trouvé</div>';
      results.classList.add('visible');
      return;
    }

    results.innerHTML = matches.map((d, i) => `
      <div class="search-result-item" data-idx="${i}"
           style="border-left:3px solid ${d.group.color}">
        <div class="search-result-name">${highlight(escapeHtml(d.name), q)}</div>
        <div class="search-result-meta">
          ${escapeHtml(d.city)} · ${escapeHtml(d.department)} ·
          <span style="color:${d.group.color}">${escapeHtml(d.group.name)}</span>
        </div>
      </div>
    `).join('');
    results.classList.add('visible');

    results.querySelectorAll('.search-result-item').forEach((el, i) => {
      el.addEventListener('click', () => {
        const d = matches[i];
        focusDealer(d);
        results.classList.remove('visible');
        input.value = '';
        clearBtn.classList.add('hidden');
      });
    });
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.add('hidden');
    results.classList.remove('visible');
    results.innerHTML = '';
    input.focus();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#search-container')) {
      results.classList.remove('visible');
    }
  });
}

function highlight(html, query) {
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return html.replace(re, '<mark style="background:#fef08a;padding:0 1px;border-radius:2px">$1</mark>');
}

function focusDealer(dealer) {
  map.setView([dealer.lat, dealer.lng], 14);
  const mo = markerObjs.find(m => m.dealer.name === dealer.name);
  if (mo) {
    if (isHeatmap) {
      if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
      isHeatmap = false;
      refreshMarkers();
    }
    clusterGroup.zoomToShowLayer(mo.marker, () => {
      setTimeout(() => mo.marker.openPopup(), 200);
    });
  }
}

// ============================================================
// TOP 10 TOGGLE
// ============================================================
function toggleTop10() {
  isTop10Mode = !isTop10Mode;
  const top10Names = new Set(getUniqueGroups().slice(0, 10).map(g => g.name));

  document.querySelectorAll('.group-checkbox').forEach(cb => {
    const isIn = top10Names.has(cb.dataset.group);
    cb.checked = isTop10Mode ? isIn : true;
    groupVisibility[cb.dataset.group] = isTop10Mode ? isIn : true;
  });

  refreshMarkers();

  const btn = document.getElementById('btn-top10');
  btn.querySelector('.btn-label').textContent = isTop10Mode ? 'Tous' : 'Top 10';
  btn.querySelector('span:first-child').textContent = isTop10Mode ? '🔙' : '🏆';
  btn.classList.toggle('active', isTop10Mode);
}

// ============================================================
// DARK MODE
// ============================================================
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  const btn = document.getElementById('btn-dark-mode');

  btn.querySelector('span:first-child').textContent = isDark ? '☀️' : '🌙';
  btn.querySelector('.btn-label').textContent = isDark ? 'Clair' : 'Sombre';

  // Swap tile layer
  if (isDark) {
    map.eachLayer(l => { if (l instanceof L.TileLayer && !l.options._isDark) map.removeLayer(l); });
    darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
      _isDark: true,
    }).addTo(map);
  } else {
    if (darkTileLayer) { map.removeLayer(darkTileLayer); darkTileLayer = null; }
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
  }
}

// ============================================================
// EXPORT
// ============================================================
function getExportData() {
  return getFilteredMarkers().map(({ dealer }) => ({
    nom: dealer.name,
    groupe: dealer.group.name,
    ville: dealer.city,
    departement: dealer.department,
    region: dealer.region,
    latitude: dealer.lat,
    longitude: dealer.lng,
  }));
}

function exportCSV() {
  const data = getExportData();
  if (!data.length) return alert('Aucune donnée à exporter.');
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(','));
  const csv = '﻿' + [headers.join(','), ...rows].join('\r\n');
  downloadBlob(csv, 'concessionnaires-renault-trucks.csv', 'text/csv;charset=utf-8;');
}

function exportExcel() {
  if (typeof XLSX === 'undefined') return alert('Bibliothèque Excel non disponible.');
  const data = getExportData();
  if (!data.length) return alert('Aucune donnée à exporter.');
  const headers = ['Nom', 'Groupe', 'Ville', 'Département', 'Région', 'Latitude', 'Longitude'];
  const rows = data.map(r => [r.nom, r.groupe, r.ville, r.departement, r.region, r.latitude, r.longitude]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Column widths
  ws['!cols'] = [{ wch: 40 }, { wch: 30 }, { wch: 20 }, { wch: 22 }, { wch: 30 }, { wch: 10 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Concessionnaires');
  XLSX.writeFile(wb, 'concessionnaires-renault-trucks.xlsx');
}

function exportGeoJSON() {
  const data = getExportData();
  if (!data.length) return alert('Aucune donnée à exporter.');
  const geojson = {
    type: 'FeatureCollection',
    features: data.map(d => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
      properties: { nom: d.nom, groupe: d.groupe, ville: d.ville, departement: d.departement, region: d.region },
    })),
  };
  downloadBlob(JSON.stringify(geojson, null, 2), 'concessionnaires-renault-trucks.geojson', 'application/geo+json');
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// SIDEBAR TOGGLE
// ============================================================
function setupSidebar() {
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('btn-toggle-sidebar');
  btn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const collapsed = sidebar.classList.contains('collapsed');
    btn.textContent = collapsed ? '▶' : '◀';
    setTimeout(() => map.invalidateSize(), 320);
  });
}

// ============================================================
// EVENTS SETUP
// ============================================================
function setupEvents() {
  // Topbar buttons
  document.getElementById('btn-toggle-heatmap').addEventListener('click', toggleHeatmap);
  document.getElementById('btn-top10').addEventListener('click', toggleTop10);
  document.getElementById('btn-stats').addEventListener('click', showStatsModal);
  document.getElementById('btn-dark-mode').addEventListener('click', toggleDarkMode);

  // Export dropdown
  const exportDropdown = document.getElementById('export-dropdown');
  document.getElementById('btn-export').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('export-menu').classList.toggle('visible');
  });
  document.getElementById('export-csv').addEventListener('click', () => {
    exportCSV();
    document.getElementById('export-menu').classList.remove('visible');
  });
  document.getElementById('export-excel').addEventListener('click', () => {
    exportExcel();
    document.getElementById('export-menu').classList.remove('visible');
  });
  document.getElementById('export-geojson').addEventListener('click', () => {
    exportGeoJSON();
    document.getElementById('export-menu').classList.remove('visible');
  });

  // Close dropdown on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#export-dropdown')) {
      document.getElementById('export-menu').classList.remove('visible');
    }
  });

  // Group all / none
  document.getElementById('btn-check-all').addEventListener('click', () => {
    document.querySelectorAll('.group-checkbox').forEach(cb => {
      cb.checked = true;
      groupVisibility[cb.dataset.group] = true;
    });
    isTop10Mode = false;
    document.getElementById('btn-top10').classList.remove('active');
    document.getElementById('btn-top10').querySelector('.btn-label').textContent = 'Top 10';
    document.getElementById('btn-top10').querySelector('span:first-child').textContent = '🏆';
    refreshMapIfHeatmap();
  });

  document.getElementById('btn-uncheck-all').addEventListener('click', () => {
    document.querySelectorAll('.group-checkbox').forEach(cb => {
      cb.checked = false;
      groupVisibility[cb.dataset.group] = false;
    });
    refreshMapIfHeatmap();
  });

  // Modal close
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', () => {
      el.closest('.modal').classList.add('hidden');
    });
  });

  // Search
  setupSearch();
  // Sidebar
  setupSidebar();
}

// ============================================================
// LOADER
// ============================================================
function hideLoader() {
  const loader = document.getElementById('map-loader');
  loader.classList.add('hidden');
}

// ============================================================
// START
// ============================================================
document.addEventListener('DOMContentLoaded', init);
