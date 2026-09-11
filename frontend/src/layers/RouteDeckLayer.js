import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';

export function createRouteLayers({ routes, selectedRouteId, startPoint, goalPoint }) {
  if (!routes || routes.length === 0) return [];

  const pathData = routes.map(r => ({
    id: r.id,
    name: r.name,
    path: r.path, // Array of [lon, lat]
    color: r.id === 'safest' 
      ? [34, 197, 94] 
      : r.id === 'fuel_optimal' 
      ? [59, 130, 246] 
      : [245, 158, 11],
    isSelected: r.id === selectedRouteId,
    distance_km: r.distance_km,
    fuel_tons: r.estimated_fuel_tons,
    ice_risk: r.ice_risk_score
  }));

  // Route paths layer
  const pathLayer = new PathLayer({
    id: 'antarctic-routes-layer',
    data: pathData,
    pickable: true,
    widthScale: 1,
    widthMinPixels: 2,
    widthMaxPixels: 12,
    getPath: d => d.path,
    getColor: d => (d.isSelected ? [...d.color, 255] : [...d.color, 140]),
    getWidth: d => (d.isSelected ? 6 : 3),
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
