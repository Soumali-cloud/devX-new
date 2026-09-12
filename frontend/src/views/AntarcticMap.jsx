import React, { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { AlertTriangle, Calendar, Pause, Play, SlidersHorizontal } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { RouteSelector } from '../components/RouteSelector';
import { createRouteLayers } from '../layers/RouteDeckLayer';
import { createIcebergLayers } from '../layers/IcebergDeckLayer';
import { createSeaIcePointsLayer } from '../layers/SeaIcePointsLayer';
import { MOCK_FORECAST_DAYS } from '../services/mockData';

// Keep the operational overview at its intended scale. The map may move north
// and south to inspect the corridor, but horizontal drift is intentionally
// locked so route controls and the polar context stay aligned.
const INITIAL_VIEW_STATE = { longitude: 0, latitude: -72, zoom: 1, minZoom: 0.65, maxZoom: 1, pitch: 0, bearing: 0 };

function formatRouteDistance(route) {
  const distanceKm = Number(route.distanceKm ?? route.distance_km ?? route.distance);
  if (Number.isFinite(distanceKm)) return `${distanceKm.toFixed(1)} km`;

  const distanceNm = Number(route.distance_nm);
  return Number.isFinite(distanceNm) ? `${(distanceNm / 0.539957).toFixed(1)} km` : '—';
}

function createAntarcticBaseMapLayer() {
  return new TileLayer({ id: 'antarctic-geographic-basemap', data: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', minZoom: 0, maxZoom: 19, tileSize: 256, pickable: false, renderSubLayers: (props) => {
    const { boundingBox } = props.tile;
    return new BitmapLayer(props, { data: null, image: props.data, bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]] });
  }});
}

function LegacyRouteEvaluationPanel({ routes, selectedRouteId, setSelectedRouteId }) {
  if (!routes?.length) return null;
  return <div className="absolute left-5 top-28 z-30 w-56 rounded-2xl border border-slate-border/80 bg-ocean-navy/90 p-2.5 opacity-100 shadow-xl backdrop-blur-md">
    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-200"><span>Evaluated Route Trajectories</span><span className="text-[10px] font-normal text-slate-400">Select to highlight</span></div>
    <div className="space-y-2">{routes.map((route) => {
      const routeStyle = route.id === 'fuel_optimal' ? { text: 'text-blue-400', border: 'border-blue-400/60', selected: 'bg-blue-500/10 ring-blue-400/40' } : route.id === 'shortest' ? { text: 'text-red-400', border: 'border-red-400/60', selected: 'bg-red-500/10 ring-red-400/40' } : { text: 'text-emerald-400', border: 'border-emerald-400/60', selected: 'bg-emerald-500/10 ring-emerald-400/40' };
      const selected = route.id === selectedRouteId;
      return <button key={route.id} onClick={() => setSelectedRouteId(route.id)} className={`w-full rounded-xl border p-2 text-left transition-all ${selected ? `${routeStyle.border} ${routeStyle.selected} ring-2` : 'border-slate-border bg-midnight/70 hover:border-slate-500'}`}><span className={`block text-[13px] font-bold ${routeStyle.text}`}>{route.name}</span><span className="mt-1 block font-mono text-[10px] text-slate-200">{route.distance_nm || (route.distance_km * 0.54).toFixed(0)} NM · {route.estimated_fuel_tons} MT</span><span className="block font-mono text-[10px] text-slate-300">Ice risk {(route.ice_risk_score * 100).toFixed(0)}%</span></button>;
    })}</div>
  </div>;
}

function RouteEvaluationPanel({ routes, selectedRouteId, setSelectedRouteId }) {
  if (!routes?.length) return null;

  return <div className="absolute left-5 top-28 z-30 w-56 rounded-2xl border border-slate-border/80 bg-ocean-navy/90 p-2.5 shadow-xl backdrop-blur-md">
    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-200"><span>Evaluated Route Trajectories</span><span className="text-[10px] font-normal text-slate-400">Select to highlight</span></div>
    <div className="space-y-2">{routes.map((route) => {
      const routeStyle = route.id === 'fuel_optimal' ? { text: 'text-blue-400', border: 'border-blue-400/60', selected: 'bg-blue-500/10 ring-blue-400/40' } : route.id === 'shortest' ? { text: 'text-red-400', border: 'border-red-400/60', selected: 'bg-red-500/10 ring-red-400/40' } : { text: 'text-emerald-400', border: 'border-emerald-400/60', selected: 'bg-emerald-500/10 ring-emerald-400/40' };
      const distanceKm = Number(route.distance_km ?? route.distance);
      const fuelTons = Number(route.estimated_fuel_tons);
      const iceRisk = Number(route.ice_risk_score);
      const distanceNm = Number(route.distance_nm) || (Number.isFinite(distanceKm) ? distanceKm * 0.539957 : null);
      const selected = route.id === selectedRouteId;
      return <button key={route.id || route.name} onClick={() => setSelectedRouteId(route.id)} className={`w-full rounded-xl border p-2 text-left transition-all ${selected ? `${routeStyle.border} ${routeStyle.selected} ring-2` : 'border-slate-border bg-midnight/70 hover:border-slate-500'}`}><span className={`block text-[13px] font-bold ${routeStyle.text}`}>{route.name}</span><span className="mt-1 block font-mono text-[10px] text-slate-200">{distanceNm === null ? '—' : distanceNm.toFixed(0)} NM · {Number.isFinite(fuelTons) ? fuelTons.toFixed(1) : '—'} MT</span><span className="block font-mono text-[10px] text-slate-300">Ice risk {Number.isFinite(iceRisk) ? `${(iceRisk * 100).toFixed(0)}%` : '—'}</span></button>;
    })}</div>
  </div>;
}

function RouteOptionsPanel({ routes, selectedRouteId, setSelectedRouteId }) {
  if (!routes?.length) return null;

  return <div className="absolute left-5 top-28 z-30 w-56 rounded-2xl border border-slate-border/80 bg-ocean-navy/90 p-2.5 shadow-xl backdrop-blur-md">
    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-200"><span>Evaluated Route Trajectories</span><span className="text-[10px] font-normal text-slate-400">Select to highlight</span></div>
    <div className="space-y-2">{routes.map((route) => {
      const style = route.id === 'fuel_optimal' ? { text: 'text-blue-400', border: '!border-blue-400/60', selected: 'bg-blue-500/10 ring-blue-400/40' } : route.id === 'shortest' ? { text: 'text-red-400', border: '!border-red-400/60', selected: 'bg-red-500/10 ring-red-400/40' } : { text: 'text-emerald-400', border: '!border-emerald-400/60', selected: 'bg-emerald-500/10 ring-emerald-400/40' };
      const distanceKm = Number(route.distance_km ?? route.distance);
      const distanceNm = Number(route.distance_nm) || (Number.isFinite(distanceKm) ? distanceKm * 0.539957 : null);
      const fuelTons = Number(route.estimated_fuel_tons);
      const iceRisk = Number(route.ice_risk_score);
      const speed = Number(route.minimum_speed_knots);
      const selected = route.id === selectedRouteId;
      return <button key={route.id || route.name} onClick={() => setSelectedRouteId(route.id)} className={`w-full rounded-xl border p-2 text-left transition-all ${selected ? `${style.border} ${style.selected} ring-2` : 'border-slate-border bg-midnight/70 hover:border-slate-500'}`}><span className={`block text-[13px] font-bold ${style.text}`}>{route.name}</span><span className="mt-1 block font-mono text-[10px] text-slate-200">Dist: {distanceNm === null ? '—' : `${distanceNm.toFixed(1)} NM`}</span><span className="block font-mono text-[10px] text-slate-200">Fuel: {Number.isFinite(fuelTons) ? `${fuelTons.toFixed(1)} MT` : '—'}</span><span className="block font-mono text-[10px] text-slate-300">Ice risk: {Number.isFinite(iceRisk) ? `${(iceRisk * 100).toFixed(0)}%` : '—'}{Number.isFinite(speed) ? ` · Min ${speed.toFixed(1)} kts` : ''}</span></button>;
    })}</div>
  </div>;
}

function RouteMetricsPanel({ routes, selectedRouteId, setSelectedRouteId }) {
  if (!routes?.length) return null;

  return <div className="absolute left-5 top-28 z-30 w-56 rounded-2xl border border-slate-border/80 bg-ocean-navy/90 p-2.5 shadow-xl backdrop-blur-md">
    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-200"><span>Evaluated Route Trajectories</span><span className="text-[10px] font-normal text-slate-400">Select to highlight</span></div>
    <div className="space-y-2">{routes.map((route) => {
      const style = route.id === 'fuel_optimal' ? { text: 'text-blue-400', border: '!border-blue-400/60', selected: 'bg-blue-500/10 ring-blue-400/40' } : route.id === 'shortest' ? { text: 'text-red-400', border: '!border-red-400/60', selected: 'bg-red-500/10 ring-red-400/40' } : { text: 'text-emerald-400', border: '!border-emerald-400/60', selected: 'bg-emerald-500/10 ring-emerald-400/40' };
      const distanceKm = Number(route.distance_km ?? route.distance);
      const fuelTons = Number(route.estimated_fuel_tons);
      const iceRisk = Number(route.ice_risk_score);
      const speed = Number(route.minimum_speed_knots);
      const selected = route.id === selectedRouteId;
      return <button key={route.id || route.name} onClick={() => setSelectedRouteId(route.id)} className={`w-full rounded-xl border p-2 text-left transition-all ${style.border} ${selected ? `${style.selected} ring-2` : 'bg-midnight/70 hover:border-slate-500'}`}>
        <span className={`block text-[13px] font-bold ${style.text}`}>{route.name}</span>
        <span className="mt-1 block font-mono text-[10px] text-slate-200">Dist: {Number.isFinite(distanceKm) ? `${distanceKm.toFixed(1)} km` : '—'}</span>
        <span className="block font-mono text-[10px] text-slate-200">Fuel: {Number.isFinite(fuelTons) ? `${fuelTons.toFixed(2)} MT` : '—'}</span>
        <span className="block font-mono text-[10px] text-slate-300">Ice risk: {Number.isFinite(iceRisk) ? `${(iceRisk * 100).toFixed(1)}%` : '—'}{Number.isFinite(speed) ? ` · Min ${speed.toFixed(1)} kts` : ''}</span>
      </button>;
    })}</div>
  </div>;
}

function ForecastHorizonPanel({ forecastDay, setForecastDay, isPlaying, setIsPlaying }) {
  return <div className="space-y-2 rounded-2xl border border-slate-border/70 bg-ocean-navy/80 p-3 shadow-xl backdrop-blur-md select-none">
    <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-200"><button onClick={() => setIsPlaying(!isPlaying)} className="rounded-lg bg-ice-cyan p-1.5 font-bold text-midnight transition-colors hover:bg-sky-400 btn-glow-cyan" title={isPlaying ? 'Pause timeline' : 'Play timeline'}>{isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button><Calendar className="h-3.5 w-3.5 text-ice-cyan" /><span>Forecast Horizon:</span><span className="font-bold text-ice-cyan">T+{forecastDay} (Day {forecastDay})</span></div>
    <div className="flex gap-3 font-mono text-[11px] text-slate-400"><span>Mean Ice: {(MOCK_FORECAST_DAYS[forecastDay - 1]?.mean_ice * 100).toFixed(0)}%</span><span>Wind: {MOCK_FORECAST_DAYS[forecastDay - 1]?.wind_kts} kts</span></div>
    <div className="grid grid-cols-7 gap-1.5">{MOCK_FORECAST_DAYS.map((day) => { const isSelected = forecastDay === day.day; return <button key={day.day} onClick={() => { setIsPlaying(false); setForecastDay(day.day); }} className={`rounded-lg border px-1 py-1 text-center font-mono text-[11px] transition-all ${isSelected ? 'scale-105 border-ice-cyan bg-ice-cyan font-bold text-midnight shadow-glow-cyan/40 btn-glow-cyan' : 'border-slate-border bg-midnight/60 text-slate-300 hover:border-ice-cyan/60 btn-glow-subtle'}`}><span className="block font-bold">T+{day.day}</span><span className="block text-[9px] opacity-80">{day.temp_c}°C</span></button>; })}</div>
  </div>;
}

export function AntarcticMap({ compact = false }) {
  const { forecastDay, setForecastDay, routeData, selectedRouteId, setSelectedRouteId, startPoint, goalPoint, icebergs, seaIcePoints, safetyRadiusNM } = useNavigation();
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showIcebergs, setShowIcebergs] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showRouteConfig, setShowRouteConfig] = useState(false);
  const [showForecastHorizon, setShowForecastHorizon] = useState(false);
  const [hoverInfo, setHoverInfo] = useState(null);
  useEffect(() => { if (!isPlaying) return undefined; const interval = setInterval(() => setForecastDay((day) => (day >= 7 ? 1 : day + 1)), 2000); return () => clearInterval(interval); }, [isPlaying, setForecastDay]);
  useEffect(() => {
    if (!routeData?.routes?.length && !icebergs.length) return;
    setViewState((current) => ({ ...current, longitude: 0, latitude: -72, zoom: Math.min(current.zoom, 1) }));
  }, [routeData, icebergs]);
  const layers = [createAntarcticBaseMapLayer(), createSeaIcePointsLayer({ points: seaIcePoints }), showIcebergs && createIcebergLayers({ icebergs, safetyRadiusNM }), showRoutes && createRouteLayers({ routes: routeData?.routes || [], selectedRouteId, startPoint, goalPoint })].filter(Boolean);
  return <div className={`relative w-full overflow-hidden bg-midnight select-none ${compact ? 'h-full min-h-[520px]' : 'h-[calc(100vh-4rem)]'}`}>
    <div className="absolute inset-0 h-full w-full"><DeckGL views={new MapView({ id: 'polar-stereographic-view', repeat: true })} viewState={viewState} onViewStateChange={({ viewState: nextState }) => setViewState({ ...nextState, longitude: INITIAL_VIEW_STATE.longitude, latitude: Math.max(-82, Math.min(-55, nextState.latitude)), zoom: Math.min(INITIAL_VIEW_STATE.maxZoom, Math.max(INITIAL_VIEW_STATE.minZoom, nextState.zoom)), bearing: 0, pitch: 0 })} controller={{ dragPan: true, dragRotate: false, touchRotate: false, scrollZoom: true, touchZoom: true, doubleClickZoom: true, keyboard: true }} layers={layers} getCursor={() => 'crosshair'} onHover={(info) => setHoverInfo(info.object ? info : null)} /></div>
    {hoverInfo?.object && <div className="pointer-events-none absolute z-50 rounded-xl border border-slate-border bg-ocean-navy/95 p-3 font-mono text-xs text-white shadow-2xl backdrop-blur-md" style={{ left: hoverInfo.x + 12, top: hoverInfo.y + 12 }}>{hoverInfo.object.threat_level ? <div className="space-y-1"><div className="flex items-center gap-1.5 font-bold text-iceberg-red"><AlertTriangle className="h-3.5 w-3.5" /><span>{hoverInfo.object.name}</span></div><div>Threat: {hoverInfo.object.threat_level}</div><div>Drift: {hoverInfo.object.drift_speed_knots} kts @ {hoverInfo.object.drift_heading_deg}°</div><div>Area: {hoverInfo.object.area_sq_km} sq km</div><div>Thickness: {hoverInfo.object.thickness_m} m</div></div> : hoverInfo.object.concentration !== undefined ? <div className="space-y-1"><div className="font-bold text-ice-cyan">Sea-Ice Tensor Grid Cell</div><div>Concentration: {(hoverInfo.object.concentration * 100).toFixed(0)}%</div><div>Lat/Lon: {hoverInfo.object.position?.[1]?.toFixed(2)}°S, {hoverInfo.object.position?.[0]?.toFixed(2)}°E</div></div> : hoverInfo.object.name ? <div className="space-y-1"><div className="font-bold text-route-safe">Route Trajectory: {hoverInfo.object.name}</div><div>Total Distance: {hoverInfo.object.distance_km} km</div><div>Est Fuel: {hoverInfo.object.fuel_tons} MT</div><div>Mean Risk: {(hoverInfo.object.ice_risk * 100).toFixed(1)}%</div></div> : null}</div>}
    <RouteMetricsPanel routes={routeData?.routes} selectedRouteId={selectedRouteId} setSelectedRouteId={setSelectedRouteId} />
    <div className="absolute bottom-8 left-4 z-20 flex items-center gap-3 rounded-xl border border-slate-border/80 bg-ocean-navy/90 px-3 py-2 font-mono text-[10px] text-slate-200 shadow-xl backdrop-blur-md" aria-label="Route legend">
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Safest</span>
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" />Fuel-Optimal</span>
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Shortest</span>
    </div>
    <div className="absolute right-5 top-28 z-30 flex flex-col items-end gap-2"><button onClick={() => { setShowRouteConfig((visible) => !visible); setShowForecastHorizon(false); }} className="flex items-center gap-2 rounded-xl border border-ice-cyan/40 bg-ocean-navy/90 px-3 py-2 text-xs font-semibold text-ice-cyan shadow-xl backdrop-blur-md hover:bg-ocean-navy" aria-expanded={showRouteConfig}><SlidersHorizontal className="h-4 w-4" />{showRouteConfig ? 'Hide route filters' : 'Configure routes'}</button><button onClick={() => { setShowForecastHorizon((visible) => !visible); setShowRouteConfig(false); }} className="flex items-center gap-2 rounded-xl border border-ice-cyan/40 bg-ocean-navy/90 px-3 py-2 text-xs font-semibold text-ice-cyan shadow-xl backdrop-blur-md hover:bg-ocean-navy" aria-expanded={showForecastHorizon}><Calendar className="h-4 w-4" />{showForecastHorizon ? 'Hide forecast horizon' : 'Forecast horizon'}</button></div>
    <div className={`absolute right-5 top-40 z-30 max-h-[calc(100%-12rem)] w-[calc(100%-2.5rem)] max-w-md overflow-y-auto rounded-2xl origin-top-right shadow-2xl transition-all duration-300 ease-out ${showRouteConfig ? 'translate-y-0 opacity-100' : '-translate-y-5 pointer-events-none opacity-0'}`} aria-hidden={!showRouteConfig}><RouteSelector onClose={() => setShowRouteConfig(false)} /></div>
    <div className={`absolute right-5 top-[12.25rem] z-30 w-[calc(100%-2.5rem)] max-w-md origin-top-right transition-all duration-300 ease-out ${showForecastHorizon ? 'translate-y-0 opacity-100' : '-translate-y-5 pointer-events-none opacity-0'}`} aria-hidden={!showForecastHorizon}><ForecastHorizonPanel forecastDay={forecastDay} setForecastDay={setForecastDay} isPlaying={isPlaying} setIsPlaying={setIsPlaying} /></div>
    <div className="absolute bottom-6 right-4 z-20 flex items-center gap-1.5 rounded-xl border border-slate-border bg-ocean-navy/90 p-1.5 font-mono text-xs shadow-xl"><button onClick={() => setShowIcebergs(!showIcebergs)} className={`rounded-lg px-2 py-1 transition-all btn-glow-subtle ${showIcebergs ? 'border border-iceberg-red/40 bg-iceberg-red/20 text-iceberg-red' : 'text-slate-500'}`}>Icebergs</button><button onClick={() => setShowRoutes(!showRoutes)} className={`rounded-lg px-2 py-1 transition-all btn-glow-subtle ${showRoutes ? 'border border-route-safe/40 bg-route-safe/20 text-route-safe' : 'text-slate-500'}`}>Routes</button></div>
    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="absolute bottom-2 left-3 z-20 rounded bg-midnight/75 px-1.5 py-0.5 text-[9px] text-slate-300 hover:text-white">© OpenStreetMap contributors</a>
  </div>;
}
