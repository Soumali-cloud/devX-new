import React from 'react';
import { Activity, ArrowRight, Database, Navigation, Shield, Sparkles, TrendingDown, Waves } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export function LandingPage() {
  const { setCurrentTab } = useNavigation();
  const metrics = [
    { label: 'Fuel Burn Reduction', value: '28.4%', sub: 'vs unassisted rhumb-line transit', icon: TrendingDown, targetTab: 'dashboard', hint: 'View Fuel Analytics' },
    { label: 'Iceberg Standoff Compliance', value: '99.8%', sub: 'automated perimeter avoidance', icon: Shield, targetTab: 'map', hint: 'View Standoff Map' },
    { label: 'Active Grid Dimension', value: '316 x 332', sub: 'EPSG:3031 25km raster cells', icon: Database, targetTab: 'visualizations', hint: 'Inspect Raster Tensors' },
    { label: 'Route Compute Latency', value: '< 180 ms', sub: 'multi-objective Pareto solver', icon: Activity, targetTab: 'architecture', hint: 'Inspect ML Architecture' },
  ];

  return <div className="w-full flex flex-col items-center py-10 sm:py-16 select-none">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
      <div className="text-center space-y-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-ice-cyan/30 bg-ocean-navy/80 light:bg-slate-100 text-xs font-mono shadow-sm">
          <Sparkles className="w-4 h-4 text-ice-cyan light:text-research-blue animate-pulse" />
          <span className="text-slate-200 light:text-slate-800 font-semibold tracking-wide">Satellite · Oceanographic · Meteorological AI Decision Support</span>
        </div>
        <div className="space-y-4">
          <div className="inline-block"><span className="text-sm sm:text-base font-mono font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-ice-cyan/15 text-ice-cyan light:text-research-blue border border-ice-cyan/40 shadow-sm">HimYatra: The Polar Journey</span></div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white light:text-ocean-navy uppercase font-sans leading-tight">Antarctic Sea Ice & Navigation DSS</h1>
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-300 light:text-slate-600 leading-relaxed font-normal">An advanced AI/ML-enabled decision support platform capable of forecasting Antarctic sea ice concentration, predicting iceberg trajectories, and identifying safe and fuel-efficient navigation routes for research vessels using satellite, oceanographic, and meteorological datasets.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button onClick={() => setCurrentTab('map')} className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-ice-cyan text-midnight font-bold text-sm tracking-wide shadow-md hover:bg-sky-400 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer btn-glow-cyan"><Navigation className="w-4 h-4" /><span>Launch Navigation Portal</span><ArrowRight className="w-4 h-4" /></button>
          <button onClick={() => setCurrentTab('dashboard')} className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 light:border-slate-300 bg-ocean-navy/80 light:bg-white text-white light:text-ocean-navy font-semibold text-sm hover:border-ice-cyan hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer btn-glow"><Activity className="w-4 h-4 text-ice-cyan light:text-research-blue" /><span>Operational Analytics</span></button>
          <button onClick={() => setCurrentTab('sea-level-impact')} className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-ice-cyan/40 bg-research-blue/30 light:bg-ice-tint text-ice-cyan light:text-research-blue font-semibold text-sm hover:border-ice-cyan hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer btn-glow-cyan"><Waves className="w-4 h-4" /><span>Explore Sea-Level Impact</span><ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return <div key={metric.label} onClick={() => setCurrentTab(metric.targetTab)} className="p-5 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-1.5 shadow-sm hover:border-ice-cyan/70 hover:shadow-glow-cyan/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group" title={`Click to ${metric.hint}`}>
            <div className="flex items-center justify-between text-slate-400 light:text-slate-500"><span className="text-[11px] font-semibold uppercase tracking-wider group-hover:text-ice-cyan light:group-hover:text-research-blue transition-colors">{metric.label}</span><Icon className="w-3.5 h-3.5 text-ice-cyan light:text-research-blue group-hover:scale-110 transition-transform" /></div>
            <div className="text-3xl font-extrabold font-mono text-white light:text-ocean-navy">{metric.value}</div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 light:text-slate-500 font-mono"><span>{metric.sub}</span><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 text-ice-cyan light:text-research-blue transition-all" /></div>
          </div>;
        })}
      </div>
    </div>
  </div>;
}
