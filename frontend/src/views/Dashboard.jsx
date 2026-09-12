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
  Info,
  BarChart3,
  MapPin,
  Waves,
  Database,
  CalendarDays,
  Mountain
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
  Radar,
  Cell,
  PieChart,
  Pie,
  Label
} from 'recharts';
import { useNavigation } from '../context/NavigationContext';
import { useTheme } from '../context/ThemeContext';
import { POLAR_CLASS_PERFORMANCE } from '../services/mockData';

const antarcticIceberg = 'https://images.unsplash.com/photo-1646282014691-620f9af448a8?auto=format&fit=crop&w=2400&q=90';

function AntarcticMapBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.16]">
      <svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <radialGradient id="antarctic-water" cx="50%" cy="48%" r="66%">
            <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="antarctic-land" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#bae6fd" stopOpacity="0.45" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0.14" />
          </linearGradient>
        </defs>
        <rect width="1400" height="900" fill="url(#antarctic-water)" />
        <g transform="translate(940 430)" fill="none" stroke="#7dd3fc" strokeWidth="1.2">
          <circle r="110" opacity="0.34" /><circle r="210" opacity="0.28" /><circle r="325" opacity="0.2" /><circle r="450" opacity="0.14" />
          {[0, 30, 60, 90, 120, 150].map((angle) => <line key={angle} x1="0" y1="-450" x2="0" y2="450" opacity="0.16" transform={`rotate(${angle})`} />)}
        </g>
        <path d="M939 247 C983 263 1017 295 1060 307 L1117 339 L1155 380 L1137 429 L1176 467 L1139 509 L1091 510 L1063 554 L1012 579 L969 556 L927 587 L880 562 L843 572 L806 532 L755 514 L737 468 L758 426 L735 384 L777 355 L803 310 L850 290 L879 252 Z" fill="url(#antarctic-land)" stroke="#7dd3fc" strokeOpacity="0.55" strokeWidth="2" />
        <path d="M781 365 C841 388 870 358 922 382 C971 404 1010 366 1060 398 C1092 418 1114 447 1141 460 M774 457 C826 429 863 462 905 440 C948 416 993 455 1034 432 C1074 410 1107 438 1149 425 M812 520 C850 490 885 516 923 499 C970 478 1000 522 1041 493 C1072 472 1099 495 1127 482" fill="none" stroke="#e0f2fe" strokeOpacity="0.27" strokeWidth="1" />
      </svg>
    </div>
  );
}

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
  const [hoveredRoute, setHoveredRoute] = React.useState(null);
  const [selectedPolarClass, setSelectedPolarClass] = React.useState(null);

  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const textColor = isDark ? '#94A3B8' : '#475569';

  const comparisonData = (routeData?.routes || []).map(r => ({
    id: r.id,
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
    <div className="relative isolate min-h-screen w-full overflow-hidden bg-[#020b1d] text-white select-none" style={{ backgroundImage: 'radial-gradient(circle at 82% 12%, rgba(14, 165, 233, 0.09), transparent 28%), radial-gradient(circle at 28% 72%, rgba(79, 70, 229, 0.07), transparent 34%), linear-gradient(135deg, #020817 0%, #061225 52%, #030a18 100%)' }}>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-[0.3] saturate-75" style={{ backgroundImage: `url(${antarcticIceberg})` }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-midnight/20 via-midnight/35 to-midnight/55" />
      <aside className="hidden">
        <button onClick={() => setCurrentTab('landing')} className="flex items-center gap-3 rounded-xl px-2 text-left">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-sky-300/40 bg-gradient-to-br from-sky-200 via-sky-600 to-blue-950 shadow-[0_0_28px_rgba(56,189,248,.25)]"><Mountain className="h-8 w-8 text-white" /></div>
          <div><div className="text-lg font-black leading-5 tracking-tight text-slate-200">POLAR<br /><span className="text-sky-400">NAVIGATION</span></div><div className="mt-1 text-[7px] font-mono tracking-widest text-sky-300/70">SAFER ROUTES · A CLEANER TOMORROW</div></div>
        </button>
        <nav className="mt-10 space-y-2">
          {[
            { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
            { id: 'map', label: 'Trajectory Map', icon: MapPin },
            { id: 'sea-level-impact', label: 'Sea Level Impact', icon: Waves },
            { id: 'visualizations', label: 'Scientific Diagnostics', icon: Database },
          ].map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setCurrentTab(id)} className={`flex w-full items-center gap-4 rounded-lg px-4 py-4 text-sm transition-all ${id === 'dashboard' ? 'border-l-4 border-sky-300 bg-sky-500/20 text-sky-300 shadow-[0_8px_24px_rgba(14,165,233,.12)]' : 'text-slate-300 hover:bg-sky-950/60 hover:text-sky-200'}`}><Icon className="h-6 w-6" />{label}</button>)}
        </nav>
        <div className="mt-auto rounded-xl border border-sky-900/60 bg-sky-950/20 p-4 font-mono text-xs italic leading-6 text-slate-300">“Navigating Today for a Safer Tomorrow”</div>
      </aside>
      <div className="relative z-10 w-full py-5 sm:py-7">
      <div className="mx-auto w-full max-w-[1400px] space-y-4 px-4 sm:px-5 lg:px-5">
        
        {/* Dashboard Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-700/80 light:border-slate-200 pb-5">
          <div>
            <h1 className="page-heading text-white light:text-ocean-navy">
              Polar Navigation Analysis
            </h1>
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
          
          <div className="p-5 rounded-2xl border border-sky-400/30 border-t-2 border-t-sky-400 bg-gradient-to-br from-sky-500/15 via-ocean-navy/90 to-ocean-navy/80 space-y-2 shadow-[0_12px_30px_rgba(14,165,233,.12)]">
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

          <div className="p-5 rounded-2xl border border-violet-400/30 border-t-2 border-t-violet-400 bg-gradient-to-br from-violet-500/15 via-ocean-navy/90 to-ocean-navy/80 space-y-2 shadow-[0_12px_30px_rgba(139,92,246,.12)]">
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

          <div className="p-5 rounded-2xl border border-emerald-400/30 border-t-2 border-t-emerald-400 bg-gradient-to-br from-emerald-500/15 via-ocean-navy/90 to-ocean-navy/80 space-y-2 shadow-[0_12px_30px_rgba(16,185,129,.12)]">
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

          <div className="p-5 rounded-2xl border border-amber-400/30 border-t-2 border-t-amber-400 bg-gradient-to-br from-amber-500/15 via-ocean-navy/90 to-ocean-navy/80 space-y-2 shadow-[0_12px_30px_rgba(245,158,11,.12)]">
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

        {/* Power BI-style operational report visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Route Fuel Distribution: 2 Columns */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-700/80 bg-ocean-navy/80 p-5 shadow-sm">
            <div className="grid items-center gap-6 md:grid-cols-[minmax(280px,.85fr)_minmax(0,1.15fr)]">
              <div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><defs><linearGradient id="route-safe-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#16a34a" /></linearGradient><linearGradient id="route-fuel-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#2563eb" /></linearGradient><linearGradient id="route-short-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#f97316" /></linearGradient></defs><Pie data={comparisonData} dataKey="fuelMT" nameKey="name" cx="50%" cy="50%" innerRadius="58%" outerRadius="82%" paddingAngle={5} stroke="none" onMouseEnter={(route) => setHoveredRoute(route)} onMouseLeave={() => setHoveredRoute(null)}>{comparisonData.map((route) => <Cell key={route.id} fill={route.name === 'Safest' ? 'url(#route-safe-top)' : route.name === 'Fuel-Optimal' ? 'url(#route-fuel-top)' : 'url(#route-short-top)'} />)}<Label value="ROUTES" position="center" fill="#e2e8f0" fontSize={14} fontFamily="JetBrains Mono" fontWeight="700" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div>
              <div className="space-y-3"><h3 className="font-mono text-sm font-black uppercase tracking-[0.14em] text-sky-300">Route Fuel Distribution</h3><div className="space-y-2">{comparisonData.map((route) => { const color = route.name === 'Safest' ? 'bg-route-safe' : route.name === 'Fuel-Optimal' ? 'bg-route-fuel' : 'bg-route-short'; const selected = route.id === selectedRouteId; return <button key={route.id} onClick={() => setSelectedRouteId(route.id)} onMouseEnter={() => setHoveredRoute(route)} onMouseLeave={() => setHoveredRoute(null)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${selected ? 'border-sky-400/70 bg-sky-500/15' : hoveredRoute?.id === route.id ? 'border-sky-400/50 bg-sky-500/10' : 'border-slate-700/70 bg-midnight/35 hover:border-slate-500'}`}><span className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${color}`} /><span className="font-mono text-sm font-bold text-slate-100">{route.name}</span></span><span className="font-mono text-sm text-slate-300">{route.fuelMT} MT</span></button>; })}</div></div>
            </div>
          </div>

          {/* Fuel Burn vs. Speed Penalty moves below Route Fuel Distribution. */}
          <div className="hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white light:text-ocean-navy">
                  Power BI: Fuel Burn vs. Speed Penalty
                </h3>
              </div>
              <span className="text-xs font-mono text-ice-cyan bg-research-blue/30 px-2.5 py-1 rounded-lg border border-ice-cyan/30 font-bold">
                Active: {vesselIceClass}
              </span>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
<BarChart data={POLAR_CLASS_PERFORMANCE} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={(event) => { const selected = event?.activePayload?.[0]?.payload; if (selected) setSelectedPolarClass(selected); }}>
                  <defs>
                    <linearGradient id="fuel-burn-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38BDF8" /><stop offset="100%" stopColor="#2563EB" /></linearGradient>
                    <linearGradient id="speed-penalty-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FBBF24" /><stop offset="100%" stopColor="#F97316" /></linearGradient>
                  </defs>
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
                  <Legend content={() => <div className="flex justify-center gap-6 pt-3 text-xs font-medium text-slate-200"><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-gradient-to-b from-sky-400 to-blue-600" />Bunker Fuel Burn (MT)</span><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-gradient-to-b from-amber-300 to-orange-500" />Speed Penalty (%)</span></div>} />
                  <Bar yAxisId="left" dataKey="fuelBurnMT" name="Bunker Fuel Burn (MT)" fill="url(#fuel-burn-gradient)" radius={[5, 5, 0, 0]} />
                  <Bar yAxisId="right" dataKey="speedPenaltyPct" name="Speed Penalty (%)" fill="url(#speed-penalty-gradient)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Radar Chart */}
          <div className="flex min-h-[360px] flex-col rounded-2xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/10 via-ocean-navy/90 to-sky-500/10 p-5 shadow-[0_12px_30px_rgba(168,85,247,.10)]">
            <div className="border-b border-slate-600/50 pb-3">
              <h3 className="font-mono text-sm font-black uppercase tracking-[0.14em] text-sky-300">Navigation Balance</h3>
            </div>
            <div className="min-h-0 flex-1 w-full pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#475569" />
                  <PolarAngleAxis dataKey="metric" tick={false} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {selectedPolarClass && <div className="rounded-xl border border-ice-cyan/50 bg-sky-500/10 px-5 py-4 text-sm shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="font-mono text-xs font-bold text-ice-cyan">{selectedPolarClass.iceClass}</span><span className="ml-3 text-slate-200 light:text-slate-800">Fuel: <strong>{selectedPolarClass.fuelBurnMT} MT</strong> · Speed penalty: <strong>{selectedPolarClass.speedPenaltyPct}%</strong></span></div><button onClick={() => setSelectedPolarClass(null)} className="text-xs font-semibold text-ice-cyan hover:text-white">Close</button></div></div>}

        {/* Fuel Burn vs. Speed Penalty: full-width lower position. */}
        <div className="rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-bold text-base text-white light:text-ocean-navy">Power BI: Fuel Burn vs. Speed Penalty</h3><span className="text-xs font-mono text-ice-cyan bg-research-blue/30 px-2.5 py-1 rounded-lg border border-ice-cyan/30 font-bold">Active: {vesselIceClass}</span></div><div className="h-80 w-full pt-2"><ResponsiveContainer width="100%" height="100%"><BarChart data={POLAR_CLASS_PERFORMANCE} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}><defs><linearGradient id="fuel-burn-bottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38BDF8" /><stop offset="100%" stopColor="#2563EB" /></linearGradient><linearGradient id="speed-penalty-bottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FBBF24" /><stop offset="100%" stopColor="#F97316" /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} /><XAxis dataKey="iceClass" stroke={textColor} fontSize={12} fontFamily="JetBrains Mono" /><YAxis yAxisId="left" stroke={textColor} fontSize={12} fontFamily="JetBrains Mono" unit=" MT" /><YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={12} fontFamily="JetBrains Mono" unit="%" /><Tooltip /><Legend /><Bar yAxisId="left" dataKey="fuelBurnMT" name="Bunker Fuel Burn (MT)" fill="url(#fuel-burn-bottom)" radius={[5, 5, 0, 0]} /><Bar yAxisId="right" dataKey="speedPenaltyPct" name="Speed Penalty (%)" fill="url(#speed-penalty-bottom)" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></div>

        <div className="hidden rounded-2xl border border-slate-700/80 bg-ocean-navy/80 p-5 shadow-sm">
          <div className="grid items-center gap-6 md:grid-cols-[minmax(280px,.85fr)_minmax(0,1.15fr)]">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="route-safe-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#16a34a" /></linearGradient>
                    <linearGradient id="route-fuel-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#2563eb" /></linearGradient>
                    <linearGradient id="route-short-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#f97316" /></linearGradient>
                  </defs>
                  <Pie data={comparisonData} dataKey="fuelMT" nameKey="name" cx="50%" cy="50%" innerRadius="58%" outerRadius="82%" paddingAngle={5} stroke="none" onMouseEnter={(route) => setHoveredRoute(route)} onMouseLeave={() => setHoveredRoute(null)}>
                    {comparisonData.map((route) => <Cell key={route.id} fill={route.name === 'Safest' ? 'url(#route-safe-gradient)' : route.name === 'Fuel-Optimal' ? 'url(#route-fuel-gradient)' : 'url(#route-short-gradient)'} />)}
                    <Label value="ROUTES" position="center" fill="#e2e8f0" fontSize={14} fontFamily="JetBrains Mono" fontWeight="700" />
                  </Pie>
                  <Tooltip cursor={false} content={({ active, payload }) => {
                    if (!active || !payload?.[0]?.payload) return null;
                    const route = payload[0].payload;
                    return <div className="rounded-xl border border-sky-300/50 bg-[#071426]/95 px-4 py-3 font-mono text-xs text-slate-100 shadow-2xl backdrop-blur-md"><div className="mb-2 font-bold text-sky-300">{route.name}</div><div className="grid grid-cols-2 gap-x-5 gap-y-1 text-slate-300"><span>Fuel</span><strong>{route.fuelMT} MT</strong><span>Distance</span><strong>{route.distanceNM} NM</strong><span>Ice exposure</span><strong>{route.iceExposurePct}%</strong><span>Hull stress</span><strong>{route.hullStress}/100</strong><span>Min speed</span><strong>{route.minSpeedKts} kts</strong></div></div>;
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div><h3 className="font-mono text-sm font-black uppercase tracking-[0.14em] text-sky-300">Route Fuel Distribution</h3></div>
              <div className="space-y-2">
                {comparisonData.map((route) => {
                  const color = route.name === 'Safest' ? 'bg-route-safe' : route.name === 'Fuel-Optimal' ? 'bg-route-fuel' : 'bg-route-short';
                  const selected = route.id === selectedRouteId;
                  return <button key={route.id} onClick={() => setSelectedRouteId(route.id)} onMouseEnter={() => setHoveredRoute(route)} onMouseLeave={() => setHoveredRoute(null)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${selected ? 'border-sky-400/70 bg-sky-500/15' : hoveredRoute?.id === route.id ? 'border-sky-400/50 bg-sky-500/10' : 'border-slate-700/70 bg-midnight/35 hover:border-slate-500'}`}><span className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${color}`} /><span className="font-mono text-sm font-bold text-slate-100">{route.name}</span></span><span className="font-mono text-sm text-slate-300">{route.fuelMT} MT</span></button>;
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}
