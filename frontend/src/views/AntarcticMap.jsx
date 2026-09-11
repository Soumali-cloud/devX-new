import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import {
  Play,
  Pause,
  RotateCcw,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Shield,
  Fuel,
  Ship,
  Bot,
  AlertTriangle,
  Info,
  Calendar
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { RouteSelector } from '../components/RouteSelector';
import { createRouteLayers } from '../layers/RouteDeckLayer';
import { createIcebergLayers } from '../layers/IcebergDeckLayer';
import { createSeaIceGridLayers } from '../layers/SeaIceGridLayer';
import { MOCK_FORECAST_DAYS } from '../services/mockData';

const INITIAL_VIEW_STATE = {
  longitude: 45,
  latitude: -72,
  zoom: 2.6,
  minZoom: 1.5,
  maxZoom: 9,
  pitch: 25,
  bearing: 0,
};

export function AntarcticMap({ compact = false }) {
  const {
    forecastDay,
    setForecastDay,
    routeData,
    selectedRouteId,
    startPoint,
    goalPoint,
    icebergs,
    safetyRadiusNM,
    activeRoute
  } = useNavigation();

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSeaIce, setShowSeaIce] = useState(true);
  const [showIcebergs, setShowIcebergs] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [hoverInfo, setHoverInfo] = useState(null);

  // 7-day timeline auto-playback
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setForecastDay(prev => (prev >= 7 ? 1 : prev + 1));
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, setForecastDay]);

  // Build deck.gl layers
  const layers = [
    showSeaIce && createSeaIceGridLayers({ forecastDay }),
    showIcebergs && createIcebergLayers({ icebergs, safetyRadiusNM }),
    showRoutes && createRouteLayers({
      routes: routeData?.routes || [],
      selectedRouteId,
      startPoint,
      goalPoint
    })
  ].filter(Boolean);

  const resetView = () => {
    setViewState(INITIAL_VIEW_STATE);
  };

  const zoomIn = () => {
    setViewState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.5, 9) }));
  };

  const zoomOut = () => {
    setViewState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.5, 1.5) }));
  };

  return (
    <div className={`relative w-full ${compact ? 'h-full min-h-[520px]' : 'h-[calc(100vh-4rem)]'} overflow-hidden bg-midnight select-none`}>
      
      {/* Deck.gl Geospatial Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <DeckGL
          views={new MapView({ id: 'polar-stereographic-view', controller: true })}
          viewState={viewState}
          onViewStateChange={({ viewState: nextState }) => setViewState(nextState)}
          layers={layers}
          getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'crosshair')}
          onHover={info => setHoverInfo(info.object ? info : null)}
        />
      </div>

      {/* Hover Tooltip */}
      {hoverInfo && hoverInfo.object && (
        <div
          className="absolute z-50 pointer-events-none p-3 rounded-xl bg-ocean-navy/95 text-white border border-slate-border text-xs font-mono shadow-2xl backdrop-blur-md"
          style={{ left: hoverInfo.x + 12, top: hoverInfo.y + 12 }}
        >
          {hoverInfo.object.threat_level ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-iceberg-red">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{hoverInfo.object.name}</span>
              </div>
              <div>Threat: {hoverInfo.object.threat_level}</div>
              <div>Drift: {hoverInfo.object.drift_speed_knots} kts @ {hoverInfo.object.drift_heading_deg}°</div>
              <div>Area: {hoverInfo.object.area_sq_km} sq km</div>
              <div>Thickness: {hoverInfo.object.thickness_m} m</div>
            </div>
          ) : hoverInfo.object.concentration !== undefined ? (
            <div className="space-y-1">
              <div className="font-bold text-ice-cyan">Sea-Ice Tensor Grid Cell</div>
              <div>Concentration: {(hoverInfo.object.concentration * 100).toFixed(0)}%</div>
              <div>Lat/Lon: {hoverInfo.object.position?.[1]?.toFixed(2)}°S, {hoverInfo.object.position?.[0]?.toFixed(2)}°E</div>
            </div>
          ) : hoverInfo.object.name ? (
            <div className="space-y-1">
              <div className="font-bold text-route-safe">Route Trajectory: {hoverInfo.object.name}</div>
              <div>Total Distance: {hoverInfo.object.distance_km} km</div>
              <div>Est Fuel: {hoverInfo.object.fuel_tons} MT</div>
              <div>Mean Risk: {(hoverInfo.object.ice_risk * 100).toFixed(1)}%</div>
            </div>
          ) : null}
        </div>
      )}

      {/* Top Left: Polar Mission Status HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-sm">
        <div className="p-3 rounded-2xl bg-ocean-navy/90 light:bg-white/95 backdrop-blur-md border border-slate-border light:border-slate-light-border shadow-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ice-cyan light:text-research-blue font-bold">
              EPSG:3031 Polar Stereographic
            </span>
            <span className="w-2 h-2 rounded-full bg-route-safe animate-pulse" />
          </div>
          <div className="text-sm font-bold text-white light:text-ocean-navy flex items-center justify-between">
            <span>Antarctic Southern Ocean Basin</span>
            <span className="text-xs text-slate-400 font-mono">Zoom: {viewState.zoom.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300 light:text-slate-600 pt-1 border-t border-slate-border/50">
            <span>Active Bergs: <strong className="text-iceberg-red">{icebergs.length}</strong></span>
            <span>Forecast Day: <strong className="text-ice-cyan">T+{forecastDay}</strong></span>
          </div>
        </div>
      </div>

      {/* Top Right: Route Selector Controls HUD */}
      <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 max-h-[calc(100vh-14rem)] overflow-y-auto">
        <RouteSelector />
      </div>

      {/* Bottom Center: 7-Day Sea Ice Timeline Scrubbing Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
        <div className="p-3 rounded-2xl bg-ocean-navy/90 light:bg-white/95 backdrop-blur-md border border-slate-border light:border-slate-light-border shadow-2xl space-y-2 select-none">
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-lg bg-ice-cyan text-midnight hover:bg-sky-400 font-bold transition-colors btn-glow-cyan"
                title={isPlaying ? 'Pause timeline' : 'Play timeline'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <div className="flex items-center gap-1 text-slate-200 light:text-slate-800 font-semibold font-mono text-xs">
                <Calendar className="w-3.5 h-3.5 text-ice-cyan light:text-research-blue" />
                <span>Forecast Horizon:</span>
                <span className="text-ice-cyan font-bold">T+{forecastDay} (Day {forecastDay})</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span>Mean Ice: {(MOCK_FORECAST_DAYS[forecastDay - 1]?.mean_ice * 100).toFixed(0)}%</span>
              <span>Katabatic Wind: {MOCK_FORECAST_DAYS[forecastDay - 1]?.wind_kts} kts</span>
            </div>
          </div>

          {/* Scrubbing Step Buttons */}
          <div className="grid grid-cols-7 gap-1.5">
            {MOCK_FORECAST_DAYS.map(d => {
              const isSelected = forecastDay === d.day;
              return (
                <button
                  key={d.day}
                  onClick={() => {
                    setIsPlaying(false);
                    setForecastDay(d.day);
                  }}
                  className={`py-1 px-1 rounded-lg text-center font-mono text-[11px] transition-all border ${
                    isSelected
                      ? 'bg-ice-cyan text-midnight font-bold border-ice-cyan shadow-glow-cyan/40 scale-105 btn-glow-cyan'
                      : 'bg-midnight/60 light:bg-slate-100 text-slate-300 light:text-slate-700 border-slate-border light:border-slate-light-border hover:border-ice-cyan/60 btn-glow-subtle'
                  }`}
                >
                  <span className="block font-bold">T+{d.day}</span>
                  <span className="block text-[9px] opacity-80">{d.temp_c}°C</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Floating Canvas Utility Buttons (Left Side) */}
      <div className="absolute bottom-6 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          title="Zoom In"
          className="p-2 rounded-xl bg-ocean-navy/90 light:bg-white border border-slate-border light:border-slate-light-border text-white light:text-ocean-navy hover:border-ice-cyan shadow-lg btn-glow"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className="p-2 rounded-xl bg-ocean-navy/90 light:bg-white border border-slate-border light:border-slate-light-border text-white light:text-ocean-navy hover:border-ice-cyan shadow-lg btn-glow"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset Antarctic Perspective"
          className="p-2 rounded-xl bg-ocean-navy/90 light:bg-white border border-slate-border light:border-slate-light-border text-white light:text-ocean-navy hover:border-ice-cyan shadow-lg btn-glow"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Visibility Toggles (Bottom Right) */}
      <div className="absolute bottom-6 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-ocean-navy/90 light:bg-white border border-slate-border light:border-slate-light-border shadow-xl text-xs font-mono">
        <button
          onClick={() => setShowSeaIce(!showSeaIce)}
          className={`px-2 py-1 rounded-lg transition-all btn-glow-subtle ${
            showSeaIce ? 'bg-ice-cyan/20 text-ice-cyan border border-ice-cyan/40' : 'text-slate-500'
          }`}
        >
          Sea-Ice
        </button>
        <button
          onClick={() => setShowIcebergs(!showIcebergs)}
          className={`px-2 py-1 rounded-lg transition-all btn-glow-subtle ${
            showIcebergs ? 'bg-iceberg-red/20 text-iceberg-red border border-iceberg-red/40' : 'text-slate-500'
          }`}
        >
          Icebergs
        </button>
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`px-2 py-1 rounded-lg transition-all btn-glow-subtle ${
            showRoutes ? 'bg-route-safe/20 text-route-safe border border-route-safe/40' : 'text-slate-500'
          }`}
        >
          Routes
        </button>
      </div>

    </div>
  );
}
