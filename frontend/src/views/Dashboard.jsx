import React from 'react';
import {
  Fuel,
  Percent,
  Compass,
  AlertOctagon,
  Ship,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Gauge,
  ArrowUpRight,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useNavigation } from '../context/NavigationContext';
import { useTheme } from '../context/ThemeContext';
import { POLAR_CLASS_PERFORMANCE } from '../services/mockData';

export function Dashboard() {
  const {
    activeRoute,
    routeData,
    selectedRouteId,
    setSelectedRouteId,
    vesselIceClass,
    setVesselIceClass,
    setCurrentTab
  } = useNavigation();

  const { isDark } = useTheme();

  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const textColor = isDark ? '#94A3B8' : '#475569';

  const comparisonData = (routeData?.routes || []).map(r => ({
    name: r.name,
    distanceNM: r.distance_nm || Math.round(r.distance_km * 0.54),
    fuelMT: r.estimated_fuel_tons,
    iceExposurePct: r.avg_ice_exposure_pct || Math.round(r.ice_risk_score * 100),
    hullStress: r.hull_stress_index || Math.round(r.ice_risk_score * 90),
    minSpeedKts: r.minimum_speed_knots
  }));

  const radarData = [
    { metric: 'Safety Index', value: 100 - (activeRoute?.hull_stress_index || 20), fullMark: 100 },
    { metric: 'Fuel Economy', value: Math.max(10, 100 - (activeRoute?.estimated_fuel_tons || 80) * 0.7), fullMark: 100 },
    { metric: 'Speed Margin', value: ((activeRoute?.minimum_speed_knots || 10) / 15) * 100, fullMark: 100 },
    { metric: 'Lead Utilization', value: 100 - (activeRoute?.avg_ice_exposure_pct || 15) * 1.2, fullMark: 100 },
    { metric: 'Hull Reserve', value: Math.max(15, 100 - (activeRoute?.hull_stress_index || 18) * 1.1), fullMark: 100 }
  ];

  return (
    <div className="w-full flex flex-col items-center py-8 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Dashboard Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-700/80 light:border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-ice-cyan light:text-research-blue uppercase tracking-widest">
                Hydrodynamic Analytics
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-research-blue/40 light:bg-ice-tint text-ice-cyan light:text-research-blue border border-ice-cyan/30 font-semibold">
                IMO Polar Code Compliant
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-ocean-navy">
              Vessel Hydrodynamic & Route Performance Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600">
              Comparative telemetry across Lindqvist hull resistance models, fuel consumption curves, and ice concentration exposures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Dynamic Polar Class Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-midnight/60 light:bg-slate-100 border border-slate-700/80 light:border-slate-200 text-xs font-mono">
              <span className="text-[10px] text-slate-400 light:text-slate-600 px-2 uppercase font-semibold">Class:</span>
              {['PC3', 'PC5', 'PC7', 'Standard'].map(cls => (
                <button
                  key={cls}
                  onClick={() => setVesselIceClass(cls)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    vesselIceClass === cls
                      ? 'bg-ice-cyan text-midnight shadow-sm btn-glow-cyan'
                      : 'text-slate-300 light:text-slate-600 hover:text-white light:hover:text-ocean-navy hover:bg-slate-800/50 light:hover:bg-slate-200'
                  }`}
                  title={`Simulate Class ${cls} hydrodynamics`}
                >
                  {cls}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentTab('map')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 light:border-slate-300 bg-ocean-navy/80 light:bg-white text-white light:text-ocean-navy text-xs font-semibold hover:border-ice-cyan transition-all cursor-pointer shadow-sm btn-glow"
              title="View active trajectory on polar map"
            >
              <Compass className="w-3.5 h-3.5 text-ice-cyan light:text-research-blue" />
              <span>View Map</span>
            </button>

          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Est. Fuel Consumption</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Fuel className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white light:text-ocean-navy">
                {activeRoute?.estimated_fuel_tons || '84.2'}
              </span>
              <span className="text-xs font-mono text-slate-400">Metric Tons</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-24.4 MT saved vs rhumb-line</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Mean Ice Concentration</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white light:text-ocean-navy">
                {activeRoute?.avg_ice_exposure_pct || ((activeRoute?.ice_risk_score || 0.14) * 100).toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-slate-400">Exposure</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Pack-ice thickness: 0.8 - 1.4m
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Distance Over Ground</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white light:text-ocean-navy">
                {activeRoute?.distance_nm || Math.round((activeRoute?.distance_km || 1845) * 0.54)}
              </span>
              <span className="text-xs font-mono text-slate-400">Nautical Miles</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {activeRoute?.distance_km || 1845} km total trajectory
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Hull Stress Risk Index</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white light:text-ocean-navy">
                {activeRoute?.hull_stress_index || '18'}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100 Max</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SAFE (Nominal Margin &gt; 80)</span>
            </div>
          </div>

        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Bar Chart: 2 Columns */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white light:text-ocean-navy">
                  Fuel Burn vs. Speed Penalty Across Polar Ice Classes
                </h3>
                <p className="text-xs text-slate-400">
                  Lindqvist hydrodynamic hull resistance simulation
                </p>
              </div>
              <span className="text-xs font-mono text-ice-cyan bg-research-blue/30 px-2.5 py-1 rounded-lg border border-ice-cyan/30 font-bold">
                Active: {vesselIceClass}
              </span>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={POLAR_CLASS_PERFORMANCE} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="iceClass" stroke={textColor} fontSize={12} fontFamily="JetBrains Mono" />
                  <YAxis yAxisId="left" stroke={textColor} fontSize={12} fontFamily="JetBrains Mono" unit=" MT" />
                  <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={12} fontFamily="JetBrains Mono" unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="fuelBurnMT" name="Bunker Fuel Burn (MT)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="speedPenaltyPct" name="Speed Penalty (%)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Radar Chart */}
          <div className="p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-white light:text-ocean-navy">
                Autonomous Navigation Balance
              </h3>
              <p className="text-xs text-slate-400">
                Multi-objective capability envelope
              </p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke={gridColor} />
                  <PolarAngleAxis dataKey="metric" stroke={textColor} fontSize={11} fontFamily="Inter" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={textColor} fontSize={9} />
                  <Radar name="Active Path" dataKey="value" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-xs font-mono text-slate-400 text-center pt-3 border-t border-slate-700/60 light:border-slate-200">
              Selected: <strong className="text-route-safe">{activeRoute?.name || 'Safest'}</strong>
            </div>
          </div>

        </div>

        {/* Comparative Trajectory Table */}
        <div className="p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white light:text-ocean-navy">
                Comparative Trajectory Options (A* Multi-Objective Optimizer)
              </h3>
              <p className="text-xs text-slate-400">
                Click any row to switch active route highlighted on the map and analytics
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-700/80 light:border-slate-200 text-slate-400 light:text-slate-600">
                  <th className="py-3 px-4 font-semibold uppercase">Route Type</th>
                  <th className="py-3 px-4 font-semibold uppercase">Distance</th>
                  <th className="py-3 px-4 font-semibold uppercase">Fuel Burn</th>
                  <th className="py-3 px-4 font-semibold uppercase">Ice Exposure</th>
                  <th className="py-3 px-4 font-semibold uppercase">Hull Stress</th>
                  <th className="py-3 px-4 font-semibold uppercase">Min Speed</th>
                  <th className="py-3 px-4 font-semibold uppercase">Operational Directive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 light:divide-slate-200">
                {comparisonData.map((row, idx) => {
                  const isSelected = selectedRouteId === (row.name.toLowerCase().replace('-', '_'));
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedRouteId(row.name.toLowerCase().replace('-', '_'))}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-research-blue/30 light:bg-ice-tint text-white light:text-ocean-navy font-bold'
                          : 'hover:bg-slate-800/40 light:hover:bg-slate-50 text-slate-300 light:text-slate-600'
                      }`}
                    >
                      <td className="py-3.5 px-4 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          row.name === 'Safest' ? 'bg-route-safe' : row.name === 'Fuel-Optimal' ? 'bg-route-fuel' : 'bg-route-short'
                        }`} />
                        <span>{row.name}</span>
                      </td>
                      <td className="py-3.5 px-4">{row.distanceNM} NM</td>
                      <td className="py-3.5 px-4">{row.fuelMT} MT</td>
                      <td className="py-3.5 px-4">{row.iceExposurePct}%</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          row.hullStress > 60 ? 'bg-iceberg-red/20 text-red-300' : 'bg-route-safe/20 text-emerald-300'
                        }`}>
                          {row.hullStress} / 100
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{row.minSpeedKts} kts</td>
                      <td className="py-3.5 px-4">
                        {row.name === 'Safest' ? (
                          <span className="text-route-safe font-bold">PRIMARY POLAR DIRECTIVE</span>
                        ) : row.name === 'Fuel-Optimal' ? (
                          <span className="text-route-fuel">LEAST ENERGY BURN</span>
                        ) : (
                          <span className="text-route-short font-bold">EMERGENCY RUN ONLY</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
