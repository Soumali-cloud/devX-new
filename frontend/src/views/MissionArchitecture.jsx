import React from 'react';
import {
  Cpu,
  Layers,
  Anchor,
  Compass,
  ArrowRight,
  Database,
  Activity,
  Workflow
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export function MissionArchitecture() {
  const { setCurrentTab } = useNavigation();

  const capabilities = [
    {
      icon: Layers,
      title: 'Real-Time 2D Sea-Ice Tensor Forecasting',
      tag: 'T1 - T7 Horizons',
      badgeColor: 'text-ice-cyan bg-research-blue/30 border-ice-cyan/30',
      formula: 'I(t+Δt) = f(I_t, U_10, V_10, T_sfc, ∇·(u_ice I))',
      desc: 'Predictive 316x332 grid rasterization capturing sea ice pack drift, thermodynamic melt, and freezing front progression with sub-25km spatial fidelity over the Southern Ocean basin.'
    },
    {
      icon: Cpu,
      title: 'XGBoost Iceberg Kinematic Drift Tracking',
      tag: 'Machine Learning',
      badgeColor: 'text-purple-300 bg-purple-900/30 border-purple-500/30',
      formula: 'm(dv/dt) = F_air + F_water + F_coriolis + F_sea_surface_slope',
      desc: 'Dynamic kinematic trajectory modeling integrating Coriolis acceleration, Ekman surface current shear, and ERA5 katabatic wind vectors for megabergs (A-23a, D-28) down to growlers.'
    },
    {
      icon: Anchor,
      title: 'Lindqvist Vessel Resistance Engine',
      tag: 'Hydrodynamic Physics',
      badgeColor: 'text-amber-300 bg-amber-900/30 border-amber-500/30',
      formula: 'R_ice = R_crush + R_bend + R_submerge',
      desc: 'Continuous analytical modeling of continuous ice crushing, flexural bending, and hull submersion forces across Polar Classes PC1 through PC7 to prevent besetting incidents in heavy pack ice.'
    },
    {
      icon: Compass,
      title: 'Multi-Objective A* Pathfinding Engine',
      tag: 'Pareto Optimization',
      badgeColor: 'text-emerald-300 bg-emerald-900/30 border-emerald-500/30',
      formula: 'cost = α · Dist + β · Fuel(R_ice) + γ · Risk(Ice, Iceberg)',
      desc: 'Parallel generation of Safest, Fuel-Optimal, and Geodesic Shortest trajectories with Pareto trade-off optimization between transit delay and bunker fuel burn.'
    }
  ];

  const pipelineSteps = [
    {
      step: '01',
      title: 'Raw Sensor Ingestion',
      source: 'Sentinel-1 SAR, CryoSat-2, USNIC Iceberg Bulletins & ERA5 Atmospheric Reanalysis',
      output: 'Geotiff / NetCDF Rasters'
    },
    {
      step: '02',
      title: 'EPSG:3031 Projection',
      source: 'Polar Stereographic Coordinate Transformation onto uniform 316 x 332 grid (25km cells)',
      output: 'Tensor Array [7, 316, 332]'
    },
    {
      step: '03',
      title: 'Physics & ML Inference',
      source: 'Lindqvist Resistance Engine + XGBoost Iceberg Kinematic Drift Trajectory Engine',
      output: 'Resistance Field & Hazard Radii'
    },
    {
      step: '04',
      title: 'Multi-Objective Route Solver',
      source: 'A* Pathfinding across lead channels with vessel Polar Class constraints (PC1 - PC7)',
      output: 'Safest, Fuel-Optimal, Shortest Waypoints'
    }
  ];

  return (
    <div className="w-full flex flex-col items-center py-8 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 light:border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-ice-cyan light:text-research-blue uppercase tracking-widest">
                Core Technical Blueprint
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-research-blue/30 light:bg-ice-tint text-ice-cyan light:text-research-blue border border-ice-cyan/30 font-semibold">
                Polar AI Marine Engineering
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-ocean-navy">
              Mission Architecture & Computational Core
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600">
              Mathematical foundations, hydrodynamic physics engines, machine learning pipelines, and spatial tensor models underpinning HimYatra: The Polar Journey.
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('map')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ice-cyan text-midnight font-bold text-xs shadow-sm hover:bg-sky-400 transition-all self-start sm:self-center"
          >
            <Compass className="w-4 h-4" />
            <span>Open in Map Engine</span>
          </button>
        </div>

        {/* 4 Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-4 shadow-sm hover:border-ice-cyan/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-midnight light:bg-ice-tint border border-slate-700 flex items-center justify-center text-ice-cyan light:text-research-blue group-hover:border-ice-cyan transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white light:text-ocean-navy">
                        {cap.title}
                      </h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-block mt-0.5 ${cap.badgeColor}`}>
                        {cap.tag}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-midnight/60 light:bg-slate-50 border border-slate-700/80 font-mono text-xs text-ice-cyan light:text-research-blue">
                  <span className="text-[10px] text-slate-400 block mb-0.5">GOVERNING RELATION:</span>
                  {cap.formula}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 leading-relaxed">
                  {cap.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* 4-Stage Pipeline */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3">
            <Workflow className="w-5 h-5 text-ice-cyan light:text-research-blue" />
            <h2 className="text-lg font-bold text-white light:text-ocean-navy">
              End-to-End Decision Support Data Pipeline
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pipelineSteps.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-700/80 bg-midnight/50 light:bg-slate-50 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-ice-cyan/40">
                    {p.step}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-research-blue/30 text-ice-cyan border border-ice-cyan/20">
                    STAGE {idx + 1}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white light:text-ocean-navy">
                  {p.title}
                </h4>
                <p className="text-xs text-slate-400 leading-normal">
                  {p.source}
                </p>
                <div className="pt-2 border-t border-slate-700/50 text-[11px] font-mono text-emerald-400">
                  Out: {p.output}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Station Coordination Banner */}
        <div className="p-6 sm:p-8 rounded-2xl border border-research-blue/40 bg-gradient-to-r from-ocean-navy via-midnight to-ocean-navy light:from-ice-tint light:via-white light:to-ice-tint flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-ice-cyan uppercase tracking-wider">
              Antarctic Continental Corridors
            </span>
            <h3 className="text-xl font-bold text-white light:text-ocean-navy">
              Connecting Maitri Station (Queen Maud Land) & Bharati Station (Larsemann Hills)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600">
              Validated against historical icebreaker logs across Cape Town and Hobart resupply voyages.
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('map')}
            className="whitespace-nowrap px-6 py-3 rounded-xl bg-research-blue hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors border border-ice-cyan/30 shadow-sm"
          >
            <span>Launch Navigation Canvas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
