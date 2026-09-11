import { ScatterplotLayer } from '@deck.gl/layers';

// Sparse backend-selected dense sea-ice markers; deliberately not a full raster field.
export function createSeaIcePointsLayer({ points }) {
  if (!points?.length) return null;
  return new ScatterplotLayer({
    id: 'significant-sea-ice-points',
    data: points,
    pickable: true,
    stroked: true,
    filled: true,
    radiusUnits: 'meters',
    radiusMinPixels: 5,
    radiusMaxPixels: 11,
    getPosition: (point) => [Number(point.longitude), Number(point.latitude)],
    getRadius: (point) => 26000 + Number(point.concentration || 0) * 24000,
    getFillColor: (point) => point.concentration >= 0.9 ? [255, 255, 255, 220] : [125, 211, 252, 210],
    getLineColor: [14, 116, 144, 255],
    lineWidthMinPixels: 1,
  });
}
