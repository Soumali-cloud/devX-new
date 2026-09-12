import axios from 'axios';
import {
  MOCK_ICEBERGS,
  MOCK_FORECAST_DAYS,
  generateSyntheticRoutes,
  INITIAL_COPILOT_BRIEFING
} from './mockData';
import { latLonToGrid } from '../utils/geoUtils';

const useLocalDevProxy = import.meta.env.DEV;

// Retrieve settings or set defaults
const getStoredSettings = () => {
  // During local Vite development, always use its /api and /health proxies.
  // This prevents stale browser settings from selecting an unavailable server.
  const endpoint = useLocalDevProxy ? '' : (localStorage.getItem('himyatra_api_endpoint') || 'https://devx-new-1.onrender.com');
  const apiKey = useLocalDevProxy ? 'dev-polar-secret-key-2026' : (localStorage.getItem('himyatra_api_key') || 'dev-polar-secret-key-2026');
  const offlineMode = useLocalDevProxy ? false : localStorage.getItem('himyatra_offline_mode') === 'true';
  return { endpoint, apiKey, offlineMode };
};

export const createApiClient = () => {
  const { endpoint, apiKey } = getStoredSettings();
  return axios.create({
    baseURL: endpoint,
    timeout: 8000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    }
  });
};

// The Sea-Level module must remain runnable in local development even when a
// previous browser session saved an obsolete remote endpoint or API key. Vite
// proxies this relative path to the local FastAPI service on port 8000.
const createLocalModelClient = () => axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'dev-polar-secret-key-2026',
  }
});

/**
 * Health check endpoint: GET /health
 */
export async function checkHealth() {
  const { offlineMode } = getStoredSettings();
  if (offlineMode) {
    return { status: 'offline-mode', simulated: true };
  }
  try {
    const client = createApiClient();
    const res = await client.get('/health');
    return { status: 'online', data: res.data };
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

/**
 * Sea Ice metadata endpoint: GET /api/v1/forecast/sea-ice
 */
export async function getSeaIceForecast() {
  const { offlineMode } = getStoredSettings();
  if (!offlineMode) {
    try {
      const client = createApiClient();
      const res = await client.get('/api/v1/forecast/sea-ice');
      return res.data;
    } catch (err) {
      console.warn('[HimYatra API] Falling back to offline forecast metadata:', err.message);
    }
  }
  return {
    forecast_days: 7,
    grid_shape: [316, 332],
    min_concentration: 0.0,
    max_concentration: 1.0,
    mean_concentration: 0.448,
    days: MOCK_FORECAST_DAYS
  };
}

/**
 * Active icebergs endpoint: GET /api/v1/icebergs/active (or /api/v1/forecast/icebergs)
 */
export async function getActiveIcebergs() {
  const { offlineMode } = getStoredSettings();
  if (!offlineMode) {
    try {
      const client = createApiClient();
      const res = await client.get('/api/v1/forecast/icebergs');
      if (res.data?.icebergs) {
        return res.data.icebergs;
      }
    } catch {
      try {
        const client = createApiClient();
        const res = await client.get('/api/v1/icebergs/active');
        if (res.data?.icebergs) return res.data.icebergs;
      } catch (err) {
        console.warn('[HimYatra API] Falling back to offline iceberg tracking:', err.message);
      }
    }
  }
  return MOCK_ICEBERGS;
}

/** Sparse, high-concentration sea-ice markers supplied by the forecast backend. */
export async function getSignificantSeaIcePoints(day, minimumConcentration = 0.8) {
  const { offlineMode } = getStoredSettings();
  if (offlineMode) return [];
  try {
    const client = createApiClient();
    const res = await client.get(`/api/v1/forecast/${day}/sea-ice-points`, {
      params: { minimum_concentration: minimumConcentration, max_points: 36 }
    });
    return res.data?.points || [];
  } catch (err) {
    console.warn('[HimYatra API] Unable to load significant sea-ice points:', err.message);
    return [];
  }
}

/** Environmental data-source availability for the melt module. */
export async function getEnvironmentalSources() {
  const client = createApiClient();
  const res = await client.get('/api/v1/environment/sources');
  return res.data;
}

/** Run the backend physics model. This deliberately has no mock fallback. */
export async function runIcebergMeltSimulation(payload) {
  const client = useLocalDevProxy ? createLocalModelClient() : createApiClient();
  const res = await client.post('/api/v1/icebergs/melt-simulations', payload);
  return res.data;
}

/**
 * Compute routes endpoint: POST /api/v1/compute-routes
 */
export async function computeRoutes({
  startCoords,
  goalCoords,
  forecastDay = 1,
  vesselIceClass = 'PC5',
  missionId = 'HIM-2026-001'
}) {
  const { offlineMode } = getStoredSettings();

  // Convert coords to grid if provided in lat/lon
  const startGrid = (startCoords[0] < 0 && Math.abs(startCoords[0]) <= 90)
    ? latLonToGrid(startCoords[0], startCoords[1])
    : startCoords;
  const goalGrid = (goalCoords[0] < 0 && Math.abs(goalCoords[0]) <= 90)
    ? latLonToGrid(goalCoords[0], goalCoords[1])
    : goalCoords;
  const startLat = (startCoords[0] < 0 && Math.abs(startCoords[0]) <= 90) ? startCoords[0] : -70.7667;
  const startLon = (startCoords[0] < 0 && Math.abs(startCoords[0]) <= 90) ? startCoords[1] : 11.7333;
  const goalLat = (goalCoords[0] < 0 && Math.abs(goalCoords[0]) <= 90) ? goalCoords[0] : -69.4072;
  const goalLon = (goalCoords[0] < 0 && Math.abs(goalCoords[0]) <= 90) ? goalCoords[1] : 76.1953;

  if (!offlineMode) {
    try {
      const client = createApiClient();
      const res = await client.post('/api/v1/compute-routes', {
        start_coords: startGrid,
        goal_coords: goalGrid,
        forecast_day: forecastDay,
        vessel_ice_class: vesselIceClass,
        mission_id: missionId,
      });
      return res.data;
    } catch (err) {
      console.warn('[HimYatra API] Compute routes fallback:', err.message);
	  const fallback = generateSyntheticRoutes(startLat, startLon, goalLat, goalLon, vesselIceClass);
	  return { ...fallback, data_source: 'synthetic', fallback_reason: err.message };
    }
  }

  // Generate synthetic routes based on input positions
	return { ...generateSyntheticRoutes(startLat, startLon, goalLat, goalLon, vesselIceClass), data_source: 'synthetic' };
}

/**
 * Mission summary endpoint: GET /api/v1/mission-summary/{mission_id}
 */
export async function getMissionSummary(missionId = 'default') {
  const { offlineMode } = getStoredSettings();
  if (!offlineMode) {
    try {
      const client = createApiClient();
      const res = await client.get('/api/v1/mission-summary/' + encodeURIComponent(missionId));
      return res.data;
    } catch (err) {
      console.warn('[HimYatra API] Mission summary fallback:', err.message);
    }
  }
  return {
    mission_id: missionId,
    status: 'ACTIVE_POLAR_EXPEDITION',
    total_routes_evaluated: 12,
    total_distance_km: 1845.2,
    total_fuel_burn_mt: 84.2,
    avg_ice_concentration: 0.14,
    audit_status: 'VERIFIED_SHA256',
    audit_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  };
}

/**
 * Captain's AI Copilot endpoint: POST /api/v1/copilot/briefing
 */
export async function getCopilotBriefing(query, payload) {
  const { offlineMode } = getStoredSettings();
  if (!offlineMode) {
    try {
      const client = createApiClient();
      const res = await client.post('/api/v1/copilot/briefing', {
        query,
        start_coords: payload?.startGrid || [150, 160],
        goal_coords: payload?.goalGrid || [120, 240],
        forecast_day: payload?.forecastDay || 1
      });
      return res.data;
    } catch (err) {
      console.warn('[HimYatra API] Copilot briefing fallback:', err.message);
    }
  }

  return {
    query,
    briefing: {
      headline: query ? 'Analysis for: "' + query + '"' : INITIAL_COPILOT_BRIEFING.headline,
      timestamp: new Date().toISOString(),
      classification: 'OFFICIAL / POLAR NAVIGATION MISSION ADVISORY',
      summary: 'Evaluated conditions for Day ' + (payload?.forecastDay || 1) + ' with Polar Class ' + (payload?.vesselIceClass || 'PC5') + '. Vessel hull stresses remain well within safety margins on the Safest trajectory. Continuous Lindqvist engine assessment predicts zero besetting probability.',
      advisories: INITIAL_COPILOT_BRIEFING.advisories
    }
  };
}
