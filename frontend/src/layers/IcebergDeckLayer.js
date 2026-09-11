import { ScatterplotLayer, LineLayer, TextLayer } from '@deck.gl/layers';

export function createIcebergLayers({ icebergs, safetyRadiusNM = 15 }) {
  if (!icebergs || icebergs.length === 0) return [];

  const formattedData = icebergs.map(b => {
    const lat = Number(b.latitude);
    const lon = Number(b.longitude);
    const isCritical = b.threat_level === 'CRITICAL';
    const isWarning = b.threat_level === 'WARNING';
    const color = isCritical 
      ? [248, 113, 113] // Iceberg Red
      : isWarning 
      ? [245, 158, 11]  // Amber Warning
      : [56, 189, 248]; // Cyan Monitored

    // Drift vector end point
    const headingRad = ((b.drift_heading_deg || 0) * Math.PI) / 180;
    const speed = b.drift_speed_knots || 1.0;
    const driftLength = 0.6 * speed; // visual vector length in degrees
    const endLon = lon + Math.sin(headingRad) * driftLength;
    const endLat = lat + Math.cos(headingRad) * (driftLength * 0.4);

    return {
      ...b,
      coordinates: [lon, lat],
      driftTarget: [endLon, endLat],
      color,
      isCritical
    };
  });

  // Iceberg Center Points
  const icebergPointsLayer = new ScatterplotLayer({
    id: 'antarctic-iceberg-points',
    data: formattedData,
    pickable: true,
    opacity: 0.95,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 6,
    radiusMaxPixels: 14,
    lineWidthMinPixels: 2,
    getPosition: d => d.coordinates,
    getRadius: d => (d.isCritical ? 12 : 8),
    getFillColor: d => [...d.color, 230],
    getLineColor: [255, 255, 255, 240],
  });

  // Iceberg Safety Exclusion Zone (Radius circles)
  const icebergSafetyRadiusLayer = new ScatterplotLayer({
    id: 'antarctic-iceberg-safety-zones',
    data: formattedData,
    pickable: false,
    opacity: 0.25,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 16,
    radiusMaxPixels: 45,
    lineWidthMinPixels: 1,
    getPosition: d => d.coordinates,
    getRadius: 28,
    getFillColor: d => [...d.color, 45],
    getLineColor: d => [...d.color, 180],
  });

  // Drift Velocity Vectors
  const driftVectorsLayer = new LineLayer({
    id: 'antarctic-iceberg-drift-vectors',
    data: formattedData,
    pickable: false,
    getWidth: 2.5,
    getSourcePosition: d => d.coordinates,
    getTargetPosition: d => d.driftTarget,
    getColor: d => [...d.color, 220],
  });

  // Iceberg Label Tags
  const icebergLabelsLayer = new TextLayer({
    id: 'antarctic-iceberg-labels',
    data: formattedData,
    pickable: false,
    getPosition: d => d.coordinates,
    getText: d => `${d.id} (${d.drift_speed_knots} kts)`,
    getSize: 11,
    getColor: [255, 255, 255, 230],
    getAngle: 0,
    getTextAnchor: 'start',
    getAlignmentBaseline: 'bottom',
    getPixelOffset: [10, -10],
    fontFamily: 'JetBrains Mono, monospace',
    fontWeight: 'bold',
    background: true,
    backgroundColor: [15, 23, 42, 220],
    backgroundPadding: [4, 2],
  });

  return [icebergSafetyRadiusLayer, driftVectorsLayer, icebergPointsLayer, icebergLabelsLayer];
}
