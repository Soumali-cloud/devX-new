/**
 * Geospatial Utilities for HimYatra Antarctic Navigation Portal
 * EPSG:3031 Polar Stereographic Projection and 316x332 Grid Transformations
 */

const RADIUS = 6378137.0;
const ECCENTRICITY = 0.08181919;
const STANDARD_PARALLEL = (-71.0 * Math.PI) / 180.0;
const MIN_METRIC = -3950000.0;
const MAX_METRIC = 3950000.0;
const GRID_ROWS = 316;
const GRID_COLS = 332;

function polarT(phi) {
  const sinPhi = Math.sin(phi);
  const val = (1.0 - ECCENTRICITY * sinPhi) / (1.0 + ECCENTRICITY * sinPhi);
  return Math.tan(Math.PI / 4.0 - phi / 2.0) / Math.pow(val, ECCENTRICITY / 2.0);
}

const MC = Math.cos(STANDARD_PARALLEL) / Math.sqrt(
  1.0 - Math.pow(ECCENTRICITY, 2) * Math.pow(Math.sin(STANDARD_PARALLEL), 2)
);
const T_STD = polarT(STANDARD_PARALLEL);

/**
 * Convert WGS84 Latitude and Longitude to EPSG:3031 Metric (X, Y)
 */
export function latLonToEPSG3031(lat, lon) {
  const phi = (lat * Math.PI) / 180.0;
  const lambda = (lon * Math.PI) / 180.0;
  const t = polarT(phi);
  const rho = (RADIUS * MC * t) / T_STD;
  const x = rho * Math.sin(lambda);
  const y = -rho * Math.cos(lambda);
  return { x, y };
}

/**
 * Convert WGS84 Latitude and Longitude to [row, col] on the 316x332 raster grid
 */
export function latLonToGrid(lat, lon) {
  const { x, y } = latLonToEPSG3031(lat, lon);
  const row = Math.round(((MAX_METRIC - y) / (MAX_METRIC - MIN_METRIC)) * (GRID_ROWS - 1));
  const col = Math.round(((x - MIN_METRIC) / (MAX_METRIC - MIN_METRIC)) * (GRID_COLS - 1));
  return [
    Math.max(0, Math.min(GRID_ROWS - 1, row)),
    Math.max(0, Math.min(GRID_COLS - 1, col)),
  ];
}

/**
 * Convert [row, col] on 316x332 raster grid back to approximate WGS84 Latitude and Longitude
 */
export function gridToLatLon(row, col) {
  const y = MAX_METRIC - (row / (GRID_ROWS - 1)) * (MAX_METRIC - MIN_METRIC);
  const x = MIN_METRIC + (col / (GRID_COLS - 1)) * (MAX_METRIC - MIN_METRIC);

  const rho = Math.sqrt(x * x + y * y);
  if (rho === 0) return { lat: -90.0, lon: 0.0 };

  const lon = (Math.atan2(x, -y) * 180.0) / Math.PI;

  const t = (rho * T_STD) / (RADIUS * MC);
  // Iterative approximation for latitude from conformal sphere
  let phi = Math.PI / 2.0 - 2.0 * Math.atan(t);
  for (let i = 0; i < 5; i++) {
    const sinPhi = Math.sin(phi);
    const con = ECCENTRICITY * sinPhi;
    phi = Math.PI / 2.0 - 2.0 * Math.atan(t * Math.pow((1.0 - con) / (1.0 + con), ECCENTRICITY / 2.0));
  }
  const lat = (phi * 180.0) / Math.PI;
  return { lat, lon };
}

/**
 * Converts kilometers to nautical miles
 */
export function kmToNauticalMiles(km) {
  return km * 0.539957;
}

/**
 * Haversine distance between two lat/lon coordinates in kilometers
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Antarctic Stations and Waypoint Presets
 */
export const ANTARCTIC_PRESETS = [
  {
    id: 'maitri',
    name: 'Maitri Station (India)',
    lat: -70.7667,
    lon: 11.7333,
    description: 'Schirmacher Oasis, Queen Maud Land',
  },
  {
    id: 'bharati',
    name: 'Bharati Station (India)',
    lat: -69.4072,
    lon: 76.1953,
    description: 'Larsemann Hills, East Antarctica',
  },
  {
    id: 'mcmurdo',
    name: 'McMurdo Station (US)',
    lat: -77.846,
    lon: 166.668,
    description: 'Ross Island, Southern Ross Sea',
  },
  {
    id: 'davis',
    name: 'Davis Station (Australia)',
    lat: -68.576,
    lon: 77.967,
    description: 'Vestfold Hills, Princess Elizabeth Land',
  },
  {
    id: 'cape_approach',
    name: 'Cape Town Approach Waypoint',
    lat: -60.0,
    lon: 20.0,
    description: 'Sub-polar open ocean rendezvous waypoint',
  },
  {
    id: 'hobart_approach',
    name: 'Hobart Approach Waypoint',
    lat: -62.0,
    lon: 145.0,
    description: 'Southern Ocean transit entry point',
  }
];

export const POLAR_ICE_CLASSES = [
  { id: 'PC1', label: 'PC1 - Year-round icebreaker (All polar waters)', power: 'High', capability: 'Extreme' },
  { id: 'PC3', label: 'PC3 - Year-round operation in second-year ice', power: 'High', capability: 'Severe' },
  { id: 'PC5', label: 'PC5 - Year-round in medium first-year ice (Standard Polar Research)', power: 'Medium-High', capability: 'Standard' },
  { id: 'PC7', label: 'PC7 - Summer/Autumn operation in thin first-year ice', power: 'Medium', capability: 'Moderate' },
  { id: 'Standard', label: 'Standard Open Water (Ice-strengthened hull only)', power: 'Normal', capability: 'Light/None' },
];
