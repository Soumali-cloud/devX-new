import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';

import { gridToLatLon } from '../utils/geoUtils';

function toDisplayPath(route) {
  if (Array.isArray(route.display_path) && route.display_path.length > 1) {
    return route.display_path;
  }

  if (route.path_coordinate_system === 'wgs84') return route.path || [];

  return (route.path || []).map(([row, column]) => {
    const { lat, lon } = gridToLatLon(row, column);
    return [lon, lat];
  });
}

const ROUTE_COLORS = {
  safest: [34, 197, 94],
  fuel_optimal: [59, 130, 246],
  shortest: [239, 68, 68],
};

export function createRouteLayers({ routes, selectedRouteId, startPoint, goalPoint }) {
  if (!routes || routes.length === 0) return [];

  const pathData = routes.map(r => ({
    id: r.id,
    name: r.name,
    path: toDisplayPath(r), // Deck.gl requires WGS84 [longitude, latitude].
    color: ROUTE_COLORS[r.id] || [148, 163, 184],
    isSelected: r.id === selectedRouteId,
    // Keep a display-ready value on the picked DeckGL object.  Older API
    // payloads use `distance`; current payloads use `distance_km`.
    distanceKm: Number(r.distance_km ?? r.distance),
    distance_km: Number(r.distance_km ?? r.distance),
    distance_nm: Number(r.distance_nm),
    fuel_tons: r.estimated_fuel_tons,
    ice_risk: r.ice_risk_score
  }));

  // Route paths layer
  const pathLayer = new PathLayer({
    id: 'antarctic-routes-layer',
    data: pathData,
    pickable: true,
    widthScale: 1,
    widthMinPixels: 3,
    widthMaxPixels: 14,
    getPath: d => d.path,
    getColor: d => (d.isSelected ? [...d.color, 255] : [...d.color, 105]),
    getWidth: d => (d.isSelected ? 7 : 4),
    capRounded: true,
    jointRounded: true,
    updateTriggers: {
      getColor: [selectedRouteId],
      getWidth: [selectedRouteId],
    }
  });

  // Waypoint endpoints layer (Start & Goal)
  const waypointData = [
    {
      name: startPoint?.name || 'Origin',
      coordinates: [startPoint?.lon || 11.7333, startPoint?.lat || -70.7667],
      color: [34, 197, 94], // Green
      type: 'START'
    },
    {
      name: goalPoint?.name || 'Destination',
      coordinates: [goalPoint?.lon || 76.1953, goalPoint?.lat || -69.4072],
      color: [56, 189, 248], // Cyan
      type: 'GOAL'
    }
  ];

  const waypointsLayer = new ScatterplotLayer({
    id: 'antarctic-waypoints-layer',
    data: waypointData,
    pickable: true,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 6,
    radiusMaxPixels: 18,
    lineWidthMinPixels: 2,
    getPosition: d => d.coordinates,
    getRadius: 8,
    getFillColor: d => [...d.color, 220],
    getLineColor: [255, 255, 255, 240],
  });

  const waypointLabelsLayer = new TextLayer({
    id: 'antarctic-waypoint-labels',
    data: waypointData,
    pickable: false,
    getPosition: d => d.coordinates,
    getText: d => `${d.type}: ${d.name.split(' ')[0]}`,
    getSize: 12,
    getColor: [255, 255, 255, 240],
    getAngle: 0,
    getTextAnchor: 'start',
    getAlignmentBaseline: 'center',
    getPixelOffset: [12, -4],
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
    background: true,
    backgroundColor: [15, 23, 42, 210],
    backgroundPadding: [4, 2],
  });

  return [pathLayer, waypointsLayer, waypointLabelsLayer];
}
