/**
 * Realistic Antarctic Datasets and Offline Simulation Engine
 * Conforms to POLAR-EXPEDITION scientific specifications (316x332 raster grid, EPSG:3031)
 */

export const MOCK_ICEBERGS = [
  {
    id: 'A-23a',
    name: 'Iceberg A-23a (Megaberg)',
    latitude: -63.52,
    longitude: -51.24,
    grid_row: 95,
    grid_column: 112,
    area_sq_km: 3900,
    thickness_m: 350,
    drift_speed_knots: 1.4,
    drift_heading_deg: 42,
    threat_level: 'CRITICAL',
    source: 'USNIC / Sentinel-1 SAR',
    last_updated: '2026-09-07T00:00:00Z'
  },
  {
    id: 'D-28',
    name: 'Iceberg D-28',
    latitude: -65.25,
    longitude: 70.15,
    grid_row: 140,
    grid_column: 245,
    area_sq_km: 1636,
    thickness_m: 210,
    drift_speed_knots: 0.9,
    drift_heading_deg: 285,
    threat_level: 'WARNING',
    source: 'USNIC / MODIS',
    last_updated: '2026-09-07T00:00:00Z'
  },
  {
    id: 'B-15AA',
    name: 'Iceberg B-15AA Fragment',
    latitude: -72.10,
    longitude: 172.40,
    grid_row: 220,
    grid_column: 290,
    area_sq_km: 840,
    thickness_m: 180,
    drift_speed_knots: 0.6,
    drift_heading_deg: 310,
    threat_level: 'MONITORED',
    source: 'USNIC / CryoSat-2',
    last_updated: '2026-09-06T18:00:00Z'
  },
  {
    id: 'C-19C',
    name: 'Iceberg C-19C',
    latitude: -67.85,
    longitude: 125.60,
    grid_row: 180,
    grid_column: 270,
    area_sq_km: 520,
    thickness_m: 160,
    drift_speed_knots: 1.1,
    drift_heading_deg: 260,
    threat_level: 'MONITORED',
    source: 'USNIC / Sentinel-1 SAR',
    last_updated: '2026-09-07T01:30:00Z'
  },
  {
    id: 'A-76A',
    name: 'Iceberg A-76A (Drake Passage Track)',
    latitude: -58.40,
    longitude: -48.30,
    grid_row: 60,
    grid_column: 95,
    area_sq_km: 2150,
    thickness_m: 220,
    drift_speed_knots: 1.8,
    drift_heading_deg: 65,
    threat_level: 'CRITICAL',
    source: 'USNIC / Sentinel-3',
    last_updated: '2026-09-07T01:00:00Z'
  }
];

export const MOCK_FORECAST_DAYS = [
  { day: 1, label: 'T+1 (Now)', mean_ice: 0.42, max_ice: 0.98, high_risk_fraction: 0.28, wind_kts: 24, temp_c: -18 },
  { day: 2, label: 'T+2 (+24h)', mean_ice: 0.44, max_ice: 0.99, high_risk_fraction: 0.31, wind_kts: 28, temp_c: -21 },
  { day: 3, label: 'T+3 (+48h)', mean_ice: 0.47, max_ice: 1.00, high_risk_fraction: 0.35, wind_kts: 35, temp_c: -24 },
  { day: 4, label: 'T+4 (+72h)', mean_ice: 0.51, max_ice: 1.00, high_risk_fraction: 0.39, wind_kts: 42, temp_c: -28 },
  { day: 5, label: 'T+5 (+96h)', mean_ice: 0.48, max_ice: 0.97, high_risk_fraction: 0.34, wind_kts: 31, temp_c: -22 },
  { day: 6, label: 'T+6 (+120h)', mean_ice: 0.45, max_ice: 0.95, high_risk_fraction: 0.30, wind_kts: 26, temp_c: -19 },
  { day: 7, label: 'T+7 (+144h)', mean_ice: 0.43, max_ice: 0.94, high_risk_fraction: 0.29, wind_kts: 22, temp_c: -17 }
];

export function generateSyntheticRoutes(startLat, startLon, endLat, endLon, iceClass = 'PC5') {
  // Class penalties and fuel multipliers
  const classMultipliers = {
    PC1: { fuel: 1.35, speed: 1.25, risk_reduction: 0.45 },
    PC3: { fuel: 1.20, speed: 1.15, risk_reduction: 0.60 },
    PC5: { fuel: 1.00, speed: 1.00, risk_reduction: 1.00 },
    PC7: { fuel: 0.88, speed: 0.85, risk_reduction: 1.45 },
    Standard: { fuel: 0.75, speed: 0.70, risk_reduction: 2.20 }
  };
  const mult = classMultipliers[iceClass] || classMultipliers.PC5;

  const pointsCount = 35;
  const safestPath = [];
  const fuelOptimalPath = [];
  const shortestPath = [];

  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount;
    // Base interpolation
    const baseLat = startLat + (endLat - startLat) * t;
    const baseLon = startLon + (endLon - startLon) * t;

    // Shortest path: direct geodesic-like curve
    shortestPath.push([baseLon, baseLat]);

    // Fuel-optimal: smooth detour hugging lower-concentration Leads
    const fuelOffsetLat = Math.sin(t * Math.PI) * 1.8;
    const fuelOffsetLon = Math.sin(t * Math.PI) * 2.5;
    fuelOptimalPath.push([baseLon + fuelOffsetLon, baseLat + fuelOffsetLat]);

    // Safest: wide skirting of pack-ice boundaries and iceberg hazard perimeters
    const safeOffsetLat = Math.sin(t * Math.PI) * 3.4;
    const safeOffsetLon = Math.sin(t * Math.PI) * -3.8;
    safestPath.push([baseLon + safeOffsetLon, baseLat + safeOffsetLat]);
  }

  return {
    origin: [startLon, startLat],
    destination: [endLon, endLat],
    vessel_ice_class: iceClass,
    routes: [
      {
        id: 'safest',
        name: 'Safest',
        color: '#22C55E',
        path: safestPath,
        distance_km: 1845.2,
        distance_nm: 996.3,
        estimated_fuel_tons: +(84.2 * mult.fuel).toFixed(1),
        ice_risk_score: +(0.14 * mult.risk_reduction).toFixed(3),
        minimum_speed_knots: +(11.8 * mult.speed).toFixed(1),
        peak_power_kw: 6200,
        avg_ice_exposure_pct: 12.4,
        hull_stress_index: +(18 * mult.risk_reduction).toFixed(0),
        status: 'RECOMMENDED_POLAR'
      },
      {
        id: 'fuel_optimal',
        name: 'Fuel-Optimal',
        color: '#3B82F6',
        path: fuelOptimalPath,
        distance_km: 1612.0,
        distance_nm: 870.4,
        estimated_fuel_tons: +(69.8 * mult.fuel).toFixed(1),
        ice_risk_score: +(0.29 * mult.risk_reduction).toFixed(3),
        minimum_speed_knots: +(9.4 * mult.speed).toFixed(1),
        peak_power_kw: 7400,
        avg_ice_exposure_pct: 27.6,
        hull_stress_index: +(38 * mult.risk_reduction).toFixed(0),
        status: 'LEAST_BURN'
      },
      {
        id: 'shortest',
        name: 'Shortest',
        color: '#F59E0B',
        path: shortestPath,
        distance_km: 1420.5,
        distance_nm: 767.0,
        estimated_fuel_tons: +(108.6 * mult.fuel).toFixed(1),
        ice_risk_score: +(0.68 * mult.risk_reduction).toFixed(3),
        minimum_speed_knots: +(5.2 * mult.speed).toFixed(1),
        peak_power_kw: 9850,
        avg_ice_exposure_pct: 64.2,
        hull_stress_index: +(82 * mult.risk_reduction).toFixed(0),
        status: 'HIGH_RISK'
      }
    ]
  };
}

export const DRIFT_VELOCITY_HISTOGRAM = [
  { bin: '0.0 - 0.4 kts', frequency: 18, cumulativePct: 18 },
  { bin: '0.4 - 0.8 kts', frequency: 34, cumulativePct: 52 },
  { bin: '0.8 - 1.2 kts', frequency: 26, cumulativePct: 78 },
  { bin: '1.2 - 1.6 kts', frequency: 14, cumulativePct: 92 },
  { bin: '1.6 - 2.0 kts', frequency: 6, cumulativePct: 98 },
  { bin: '> 2.0 kts', frequency: 2, cumulativePct: 100 }
];

export const POLAR_CLASS_PERFORMANCE = [
  { iceClass: 'PC1', fuelBurnMT: 114, speedPenaltyPct: 8, maxIceThicknessM: 4.5, safetyRating: 98 },
  { iceClass: 'PC3', fuelBurnMT: 101, speedPenaltyPct: 15, maxIceThicknessM: 3.0, safetyRating: 91 },
  { iceClass: 'PC5', fuelBurnMT: 84, speedPenaltyPct: 24, maxIceThicknessM: 2.0, safetyRating: 84 },
  { iceClass: 'PC7', fuelBurnMT: 74, speedPenaltyPct: 42, maxIceThicknessM: 1.2, safetyRating: 68 },
  { iceClass: 'Standard', fuelBurnMT: 63, speedPenaltyPct: 75, maxIceThicknessM: 0.4, safetyRating: 32 }
];

export const INITIAL_COPILOT_BRIEFING = {
  headline: 'Operational Navigation Directive: East Antarctic Coastal Corridor',
  timestamp: '2026-09-07T02:00:00Z',
  classification: 'RESTRICTED / POLAR MISSION CONTROL',
  summary: 'A 48-hour katabatic surge event is developing off Princess Elizabeth Land. High pack-ice deformation is anticipated across sector 70°S, 72°E.',
  advisories: [
    {
      level: 'CRITICAL',
      title: 'A-23a Proximity & Calving Debris',
      detail: 'Iceberg A-23a is undergoing active sub-surface rotational torque. Maintain a minimum perimeter standoff of 15.0 NM to avoid multi-year growlers.'
    },
    {
      level: 'WARNING',
      title: 'Lindqvist Resistance Surge in Sector 4',
      detail: 'Estimated continuous ice thickness exceeds 1.8m in the direct rhumb-line path. Shortest route will demand >9,500 kW sustained thrust with risk of besetting.'
    },
    {
      level: 'RECOMMENDED',
      title: 'Safest Route Selected (PC5 Clearance)',
      detail: 'Recommend engaging the Safest Route variant with 12.4% average ice concentration exposure. Projected fuel burn is 84.2 MT with hull stress index of 18/100.'
    }
  ]
};
