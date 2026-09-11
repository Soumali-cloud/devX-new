import { ScatterplotLayer } from '@deck.gl/layers';

// Generates a responsive sea-ice field around the Antarctic perimeter
export function createSeaIceGridLayers({ forecastDay = 1, opacity = 0.65 }) {
  const points = [];
  const rings = 14;
  const sectors = 42;

  // Day factor simulates expansion / retreat of pack ice across T1..T7
  const dayShift = (forecastDay - 1) * 0.035;

  for (let r = 0; r < rings; r++) {
    // Latitudes from coastal shelf (-78 deg) to marginal ice zone (-60 deg)
    const baseLat = -78 + r * 1.35;
    
    for (let s = 0; s < sectors; s++) {
      const lon = -180 + (s / sectors) * 360;
      
      // Calculate realistic concentration with regional variations (Weddell Sea, Ross Sea)
      const weddellMod = (lon > -60 && lon < -20) ? 0.35 : 0.0;
      const rossMod = (lon > 160 || lon < -150) ? 0.30 : 0.0;
      const noise = Math.sin(s * 0.45 + forecastDay * 0.8) * 0.15;
      
      // Higher concentration close to mainland, fading to marginal ice zone
      const radialGradient = Math.max(0, 1.0 - (r / rings) * 1.15);
      let concentration = Math.min(1.0, Math.max(0.05, radialGradient + weddellMod + rossMod + noise + dayShift));

      // Color mapping: Open water (deep blue) -> Brash/Pancake (cyan) -> Multi-year pack (pure white)
      let color;
      if (concentration > 0.8) {
        color = [255, 255, 255]; // Dense pack ice / fast ice
      } else if (concentration > 0.5) {
        color = [186, 230, 253]; // Close pack ice (Light Ice Cyan)
      } else if (concentration > 0.25) {
        color = [56, 189, 248];  // Open pack ice (Antarctic Cyan)
      } else {
        color = [30, 58, 138];   // Very open water / marginal ice (Research Blue)
      }

      points.push({
        position: [lon, baseLat],
        concentration: +(concentration.toFixed(2)),
        color,
        radius: 32000 + (concentration * 24000) // meters
      });
    }
  }

  return new ScatterplotLayer({
    id: `antarctic-sea-ice-grid-t${forecastDay}`,
    data: points,
    pickable: true,
    opacity: opacity,
    stroked: false,
    filled: true,
    radiusUnits: 'meters',
    getPosition: d => d.position,
    getRadius: d => d.radius,
    getFillColor: d => [...d.color, Math.round(d.concentration * 190 + 30)],
    updateTriggers: {
      getFillColor: [forecastDay],
      getRadius: [forecastDay]
    }
  });
}
