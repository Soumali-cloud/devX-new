import React, { useState } from 'react';
import {
  Ship,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldAlert,
  Fuel,
  Gauge,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { ANTARCTIC_PRESETS, POLAR_ICE_CLASSES } from '../utils/geoUtils';

export function RouteSelector() {
  const {
    startPoint,
    setStartPoint,
    goalPoint,
    setGoalPoint,
    vesselIceClass,
    setVesselIceClass,
    routeData,
    selectedRouteId,
    setSelectedRouteId,
    isComputing,
    refreshRoutes
  } = useNavigation();

  return (
    <div className="bg-ocean-navy/90 light:bg-white/95 backdrop-blur-md rounded-2xl border border-slate-border light:border-slate-light-border p-4 shadow-xl space-y-4 text-xs select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-border/60 light:border-slate-light-border pb-3">
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-ice-cyan light:text-research-blue" />
          <span className="font-bold text-sm text-white light:text-ocean-navy uppercase tracking-wider">
            Vessel Route Configuration
          </span>
        </div>
        <button
          onClick={refreshRoutes}
          disabled={isComputing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-research-blue/40 light:bg-slate-100 hover:bg-research-blue/60 text-ice-cyan light:text-research-blue border border-ice-cyan/30 transition-all duration-200 disabled:opacity-50 btn-glow"
        >
          <RefreshCw className={`w-3 h-3 ${isComputing ? 'animate-spin' : ''}`} />
          <span>{isComputing ? 'Computing...' : 'Recalculate'}</span>
        </button>
      </div>

      {/* Polar Class Picker */}
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-300 light:text-slate-700 flex items-center justify-between">
          <span>Polar Ice Class (IACS):</span>
          <span className="text-ice-cyan font-mono font-bold">{vesselIceClass}</span>
        </label>
        <div className="grid grid-cols-5 gap-1">
          {POLAR_ICE_CLASSES.map(cls => (
            <button
              key={cls.id}
              onClick={() => setVesselIceClass(cls.id)}
              className={`py-1.5 px-2 rounded-lg font-mono font-semibold text-center border transition-all ${
                vesselIceClass === cls.id
                  ? 'bg-ice-cyan text-midnight border-ice-cyan shadow-glow-cyan/40 btn-glow-cyan'
                  : 'bg-midnight/60 light:bg-slate-50 text-slate-300 light:text-slate-600 border-slate-border light:border-slate-light-border hover:border-ice-cyan/60 btn-glow-subtle'
              }`}
              title={`${cls.label} - Power: ${cls.power}`}
            >
              {cls.id}
            </button>
          ))}
        </div>
      </div>

      {/* Start / Goal Coordinates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Origin Preset */}
        <div className="space-y-1">
          <label className="text-slate-300 light:text-slate-600 flex items-center gap-1 font-medium">
            <MapPin className="w-3 h-3 text-route-safe" />
            <span>Origin Landmark:</span>
          </label>
          <select
            value={startPoint.id}
            onChange={(e) => {
              const found = ANTARCTIC_PRESETS.find(p => p.id === e.target.value);
              if (found) setStartPoint(found);
            }}
            className="w-full bg-midnight/80 light:bg-slate-50 border border-slate-border light:border-slate-light-border rounded-lg p-2 text-white light:text-ocean-navy font-mono text-xs focus:outline-none focus:border-ice-cyan"
          >
            {ANTARCTIC_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="text-[10px] text-slate-400 font-mono">
            {startPoint.lat.toFixed(2)}°S, {startPoint.lon.toFixed(2)}°E
          </div>
        </div>

        {/* Destination Preset */}
        <div className="space-y-1">
          <label className="text-slate-300 light:text-slate-600 flex items-center gap-1 font-medium">
            <Navigation className="w-3 h-3 text-ice-cyan" />
            <span>Destination:</span>
          </label>
          <select
            value={goalPoint.id}
            onChange={(e) => {
              const found = ANTARCTIC_PRESETS.find(p => p.id === e.target.value);
              if (found) setGoalPoint(found);
            }}
            className="w-full bg-midnight/80 light:bg-slate-50 border border-slate-border light:border-slate-light-border rounded-lg p-2 text-white light:text-ocean-navy font-mono text-xs focus:outline-none focus:border-ice-cyan"
          >
            {ANTARCTIC_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="text-[10px] text-slate-400 font-mono">
            {goalPoint.lat.toFixed(2)}°S, {goalPoint.lon.toFixed(2)}°E
          </div>
        </div>

      </div>

      {/* Multi-Route Options Switcher */}
      {routeData?.routes && (
        <div className="space-y-2 pt-2 border-t border-slate-border/60 light:border-slate-light-border">
          <div className="text-slate-300 light:text-slate-600 font-semibold flex items-center justify-between">
            <span>Evaluated Route Trajectories:</span>
            <span className="text-[10px] text-slate-400">Select to highlight</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {routeData.routes.map(r => {
              const isSelected = selectedRouteId === r.id;
              const colorMap = {
                safest: { border: 'border-route-safe', text: 'text-route-safe', bg: 'bg-route-safe/10' },
                fuel_optimal: { border: 'border-route-fuel', text: 'text-route-fuel', bg: 'bg-route-fuel/10' },
                shortest: { border: 'border-route-short', text: 'text-route-short', bg: 'bg-route-short/10' }
              };
              const col = colorMap[r.id] || colorMap.safest;

              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? `${col.border} ${col.bg} ring-2 ring-ice-cyan/40 btn-glow`
                      : 'border-slate-border light:border-slate-light-border bg-midnight/40 light:bg-slate-50 hover:border-slate-400 btn-glow-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold ${col.text}`}>{r.name}</span>
                    {isSelected && <CheckCircle2 className={`w-3.5 h-3.5 ${col.text}`} />}
                  </div>
                  
                  <div className="space-y-0.5 text-[11px] font-mono text-slate-300 light:text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Dist:</span>
                      <span className="font-bold">{r.distance_nm || (r.distance_km * 0.54).toFixed(0)} NM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fuel:</span>
                      <span className="font-bold">{r.estimated_fuel_tons} MT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ice Risk:</span>
                      <span className="font-bold">{(r.ice_risk_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
