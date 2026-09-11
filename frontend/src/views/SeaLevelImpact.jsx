import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, BarChart3, CheckCircle2, ChevronDown, ChevronUp,
  Database, Droplets, Info, Loader2, MapPin, Play, Snowflake,
  Thermometer, Waves, Wind
} from 'lucide-react';
import {
  getActiveIcebergs,
  getEnvironmentalSources,
  runIcebergMeltSimulation
} from '../services/api';
import { useNavigation } from '../context/NavigationContext';
import { AntarcticMap } from './AntarcticMap';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis
} from 'recharts';

const YEARS = [1, 5, 10, 20, 30];
const SCENARIOS = ['low', 'moderate', 'high'];

const formatNumber = (value, digits = 1) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
};

const formatMm = (meters) => meters == null ? '--' : `${formatNumber(Number(meters) * 1000, 6)} mm`;

function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/75 light:bg-white shadow-sm ${className}`}>{children}</section>;
}

function SectionTitle({ icon: Icon, eyebrow, title, action }) {
  return <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-700/70 light:border-slate-200 pb-4 mb-5">
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-xl bg-ice-cyan/15 text-ice-cyan light:text-research-blue"><Icon className="w-4 h-4" /></div>
      <div><div className="text-[10px] font-mono font-bold tracking-widest uppercase text-ice-cyan light:text-research-blue">{eyebrow}</div><h2 className="text-lg font-bold text-white light:text-ocean-navy">{title}</h2></div>
    </div>
    {action}
  </div>;
}

function Metric({ label, value, unit, tone = 'text-white' }) {
  return <div className="p-4 rounded-xl bg-midnight/50 light:bg-slate-50 border border-slate-700/60 light:border-slate-200">
    <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400">{label}</div>
    <div className={`mt-2 text-xl font-bold font-mono ${tone}`}>{value}<span className="text-xs ml-1 text-slate-400 font-normal">{unit}</span></div>
  </div>;
}

export function SeaLevelImpact() {
  const { icebergs } = useNavigation();
  const [availableIcebergs, setAvailableIcebergs] = useState(icebergs || []);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ length_m: '', width_m: '', thickness_m: '', shape_factor: '0.78', dimensions_status: 'estimated' });
  const [years, setYears] = useState(30);
  const [scenario, setScenario] = useState('moderate');
  const [chartMetric, setChartMetric] = useState('volume_m3');
  const [result, setResult] = useState(null);
  const [sources, setSources] = useState(null);
  // The backend prefers configured modern forcing, then falls back to this
  // explicitly-labelled local scenario baseline so local development works.
  const [useBaseline, setUseBaseline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([getActiveIcebergs(), getEnvironmentalSources()]).then(([bergRes, sourceRes]) => {
      if (!mounted) return;
      if (bergRes.status === 'fulfilled' && Array.isArray(bergRes.value)) setAvailableIcebergs(bergRes.value);
      if (sourceRes.status === 'fulfilled') setSources(sourceRes.value);
      setLoadingData(false);
    });
    return () => { mounted = false; };
  }, []);

  const selected = useMemo(() => availableIcebergs.find((b) => (b.id || b.iceberg_id) === selectedId), [availableIcebergs, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm((old) => ({
      ...old,
      thickness_m: selected.thickness_m ?? '',
      length_m: selected.length_m ?? '',
      width_m: selected.width_m ?? ''
    }));
    setResult(null);
    setError('');
  }, [selected]);

  const updateForm = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const initialVolume = selected && form.length_m && form.width_m && form.thickness_m
    ? Number(form.length_m) * Number(form.width_m) * Number(form.thickness_m) * Number(form.shape_factor || 0.78) : null;

  const runSimulation = async () => {
    if (!selected) return setError('Select an iceberg before running the model.');
    if (![form.length_m, form.width_m, form.thickness_m].every((v) => Number(v) > 0)) {
      return setError('Length, width, and thickness are required. Enter observed values or clearly mark your dimensions as estimated.');
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await runIcebergMeltSimulation({
        iceberg_id: selected.id || selected.iceberg_id,
        latitude: Number(selected.latitude), longitude: Number(selected.longitude),
        length_m: Number(form.length_m), width_m: Number(form.width_m), thickness_m: Number(form.thickness_m),
        shape_factor: Number(form.shape_factor || 0.78), dimensions_status: form.dimensions_status,
        horizon_years: Number(years), scenario, use_scenario_baseline: useBaseline
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'The melt model is unavailable. Start the project with `npm run dev` so the local API starts with the frontend.');
    } finally { setLoading(false); }
  };

  const checkpoints = result?.checkpoints || [];
  const chartData = result ? [{ year: 'Initial', volume_m3: result.initial_state.volume_m3, mass_kg: result.initial_state.mass_kg, meltwater_m3: 0, sea_level_mm: 0 }, ...checkpoints.map((p) => ({ year: p.date?.slice(0, 4), volume_m3: p.volume_m3, mass_kg: p.mass_kg, meltwater_m3: p.meltwater_m3, sea_level_mm: p.net_sea_level_equivalent_m * 1000 }))] : [];
  const metricLabels = { volume_m3: 'Ice volume (m³)', mass_kg: 'Ice mass (kg)', meltwater_m3: 'Meltwater (m³)', sea_level_mm: 'Net contribution (mm)' };
  const totals = result?.totals;
  const forcing = result?.environmental_conditions;
  const selectedMetrics = selected ? [
    { label: 'Location', value: `${Number(selected.latitude).toFixed(2)}, ${Number(selected.longitude).toFixed(2)}`, unit: '°' },
    selected.area_sq_km != null && { label: 'Observed area', value: formatNumber(selected.area_sq_km), unit: 'km²' },
    selected.thickness_m != null && { label: 'Thickness', value: selected.thickness_m, unit: 'm' },
    selected.source && { label: 'Data source', value: selected.source }
  ].filter(Boolean) : [];
  const forcingMetrics = forcing ? [
    { label: 'Surface temperature', value: formatNumber(forcing.ocean_surface_temp_c, 2), unit: '°C' },
    { label: 'Basal temperature', value: formatNumber(forcing.ocean_basal_temp_c, 2), unit: '°C' },
    { label: 'Current speed', value: formatNumber(Math.hypot(forcing.ocean_integrated_u_m_s, forcing.ocean_integrated_v_m_s), 3), unit: 'm/s' },
    { label: 'Wind speed', value: formatNumber(Math.hypot(forcing.wind_u_m_s, forcing.wind_v_m_s), 2), unit: 'm/s' },
    { label: 'Sea ice concentration', value: formatNumber(forcing.sea_ice_fraction * 100, 1), unit: '%' },
    forcing.salinity_psu != null && { label: 'Salinity', value: formatNumber(forcing.salinity_psu, 2), unit: 'PSU' },
    { label: 'Forcing source', value: forcing.source },
    { label: 'Source status', value: forcing.source_status }
  ].filter(Boolean) : [];

  return <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div><div className="text-[11px] font-mono tracking-widest uppercase text-ice-cyan light:text-research-blue font-bold">Scientific melt module</div><h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white light:text-ocean-navy uppercase">Iceberg Melt & Sea-Level Impact</h1><p className="mt-2 max-w-3xl text-sm text-slate-300 light:text-slate-600">Simulate iceberg melting, track volume loss and estimate the net sea-level contribution under declared environmental conditions.</p></div>
    </div>

    <Card className="p-5"><SectionTitle icon={Snowflake} eyebrow="Inputs" title="Select iceberg and projection" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="text-xs text-slate-400">Iceberg ID<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="mt-1 w-full rounded-xl bg-midnight light:bg-slate-50 border border-slate-700 light:border-slate-300 px-3 py-2.5 text-sm text-white light:text-ocean-navy"><option value="">{loadingData ? 'Loading iceberg data…' : 'Select tracked iceberg'}</option>{availableIcebergs.map((b) => <option key={b.id || b.iceberg_id} value={b.id || b.iceberg_id}>{b.id || b.iceberg_id}</option>)}</select></label>
        <label className="text-xs text-slate-400">Projection period<select value={years} onChange={(e) => setYears(Number(e.target.value))} className="mt-1 w-full rounded-xl bg-midnight light:bg-slate-50 border border-slate-700 light:border-slate-300 px-3 py-2.5 text-sm text-white light:text-ocean-navy">{YEARS.map((y) => <option key={y} value={y}>{y} {y === 1 ? 'Year' : 'Years'}</option>)}</select></label>
        <label className="text-xs text-slate-400">Scenario<select value={scenario} onChange={(e) => setScenario(e.target.value)} className="mt-1 w-full rounded-xl bg-midnight light:bg-slate-50 border border-slate-700 light:border-slate-300 px-3 py-2.5 text-sm capitalize text-white light:text-ocean-navy">{SCENARIOS.map((s) => <option key={s} value={s}>{s} melting</option>)}</select></label>
      </div>
      {selected && <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">{selectedMetrics.map((metric) => <Metric key={metric.label} {...metric} />)}</div>}
      <div className="mt-5 pt-5 border-t border-slate-700/60 light:border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['length_m', 'width_m', 'thickness_m'].map((key) => <label key={key} className="text-xs text-slate-400 capitalize">{key.replace('_m', '')} (m)<input type="number" min="0" value={form[key]} onChange={(e) => updateForm(key, e.target.value)} placeholder="Not available" className="mt-1 w-full rounded-xl bg-midnight light:bg-slate-50 border border-slate-700 light:border-slate-300 px-3 py-2.5 text-sm text-white light:text-ocean-navy" /></label>)}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-slate-400"><label className="flex items-center gap-2"><input type="checkbox" checked={useBaseline} onChange={(e) => setUseBaseline(e.target.checked)} /> Use local scenario baseline when live forcing is unavailable</label><span>Shape factor <input aria-label="Shape factor" type="number" min="0.01" max="1" step="0.01" value={form.shape_factor} onChange={(e) => updateForm('shape_factor', e.target.value)} className="w-20 ml-1 rounded-lg bg-midnight border border-slate-700 px-2 py-1 text-white" /></span></div>
      <button onClick={runSimulation} disabled={loading || !selected} className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ice-cyan text-midnight font-bold text-sm disabled:opacity-40 hover:bg-sky-400 transition-colors btn-glow-cyan">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}{loading ? 'Running melt simulation…' : 'Run melt simulation'}</button>
      {error && <div className="mt-4 p-3 rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-200 text-sm flex gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}</div>}
    </Card>

    <Card className="p-5"><SectionTitle icon={BarChart3} eyebrow="Current state" title="Iceberg physical information" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"><Metric label="Length" value={form.length_m || '--'} unit="m" /><Metric label="Width" value={form.width_m || '--'} unit="m" /><Metric label="Height" value={form.thickness_m || '--'} unit="m" /><Metric label="Area" value={selected?.area_sq_km ?? '--'} unit="km²" /><Metric label="Volume" value={formatNumber(initialVolume)} unit="m³" tone="text-ice-cyan" /><Metric label="Mass" value={initialVolume ? formatNumber(initialVolume * 917) : '--'} unit="kg" /></div>
      <p className="mt-4 text-xs text-slate-400 flex items-center gap-2"><Info className="w-3.5 h-3.5 text-ice-cyan" /> Volume is an estimate from the supplied dimensions and shape factor; exact 3D geometry is not implied.</p>
    </Card>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card className="p-5 lg:col-span-2"><SectionTitle icon={Waves} eyebrow="Environmental conditions" title="Forcing used by the model" />
      {forcing ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{forcingMetrics.map((metric) => <Metric key={metric.label} {...metric} />)}</div> : <div className="py-5 text-sm text-slate-400">Environmental conditions are shown after the backend model runs, using the exact forcing that it consumed.</div>}
      <div className="mt-4 text-xs text-slate-400">{sources?.sources?.filter((s) => s.configured).length ? 'Configured environmental sources are available to the backend.' : 'No live environmental source is configured. The optional scenario baseline remains explicitly labelled as scenario-based.'}</div>
    </Card><Card className="p-5"><SectionTitle icon={Droplets} eyebrow="Impact" title="Net sea-level contribution" /><div className="text-4xl font-black font-mono text-ice-cyan">{formatMm(totals?.net_sea_level_equivalent_m)}</div><div className="text-xs text-slate-400 mt-2">This iceberg only · global projections are separate</div><div className="mt-5 p-3 rounded-xl border border-ice-cyan/25 bg-ice-cyan/5 text-xs leading-relaxed text-slate-300 light:text-slate-600">Floating ice already displaces seawater. This reports the net freshwater-minus-displaced-seawater equivalent, not a global climate projection.</div></Card></div>

    <Card className="p-5"><SectionTitle icon={BarChart3} eyebrow="Projection" title={`${years}-year ice melt projection`} action={<div className="flex gap-1">{['volume_m3', 'mass_kg', 'meltwater_m3', 'sea_level_mm'].map((key) => <button key={key} onClick={() => setChartMetric(key)} className={`px-2 py-1 rounded-lg text-[10px] font-mono ${chartMetric === key ? 'bg-ice-cyan text-midnight' : 'bg-midnight/60 text-slate-400'}`}>{key === 'sea_level_mm' ? 'Impact' : key.split('_')[0]}</button>)}</div>} />
      {!result ? <div className="h-56 flex flex-col items-center justify-center text-center text-slate-400"><BarChart3 className="w-8 h-8 mb-2 opacity-50" /><p>No simulation results yet.</p><p className="text-xs mt-1">Select an iceberg and run the backend model to generate the projection.</p></div> : <ResponsiveContainer width="100%" height={280}><LineChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11 }} /><YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v, 0)} /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10 }} formatter={(value) => [formatNumber(value, 4), metricLabels[chartMetric]]} /><Line type="monotone" dataKey={chartMetric} stroke="#38bdf8" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>}
      {result && <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-400 uppercase font-mono"><tr><th className="p-2">Year</th><th className="p-2">Ice remaining</th><th className="p-2">Ice melted</th><th className="p-2">Meltwater</th><th className="p-2">Contribution</th></tr></thead><tbody>{chartData.map((row, i) => <tr key={`${row.year}-${i}`} className="border-t border-slate-700/60"><td className="p-2 font-mono">{row.year}</td><td className="p-2">{formatNumber(row.volume_m3)} m³</td><td className="p-2">{formatNumber(result.initial_state.volume_m3 - row.volume_m3)} m³</td><td className="p-2">{formatNumber(row.meltwater_m3)} m³</td><td className="p-2">{formatNumber(row.sea_level_mm, 6)} mm</td></tr>)}</tbody></table></div>}
    </Card>

    {result && <Card className="p-5"><SectionTitle icon={CheckCircle2} eyebrow="Results" title="Melting analysis" /><div className="grid grid-cols-2 sm:grid-cols-5 gap-3"><Metric label="Initial ice" value="100" unit="%" /><Metric label="Remaining ice" value={formatNumber((checkpoints.at(-1)?.volume_m3 / result.initial_state.volume_m3) * 100)} unit="%" tone="text-route-safe" /><Metric label="Ice melted" value={formatNumber((totals.melted_ice_volume_m3 / result.initial_state.volume_m3) * 100)} unit="%" tone="text-amber-300" /><Metric label="Meltwater" value={formatNumber(totals.meltwater_m3)} unit="m³" /><Metric label="Model source" value={result.source_status} /></div><button onClick={() => setMethodologyOpen(!methodologyOpen)} className="mt-5 text-xs text-ice-cyan flex items-center gap-1">{methodologyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} View methodology</button>{methodologyOpen && <div className="mt-3 p-4 rounded-xl bg-midnight/50 text-xs text-slate-300 light:text-slate-600 leading-relaxed">This backend model adapts the OceanParcels MeltingIcebergs architecture with basal melting, buoyant convection, and wave erosion. The scenario selection modifies declared forcing; it does not represent an observed forecast. <a className="text-ice-cyan underline" href="https://github.com/Parcels-code/MeltingIcebergs" target="_blank" rel="noreferrer">Model repository</a> · <a className="text-ice-cyan underline" href="https://zenodo.org/doi/10.5281/zenodo.11208937" target="_blank" rel="noreferrer">Zenodo record</a></div>}</Card>}

    <Card className="p-5"><SectionTitle icon={MapPin} eyebrow="Spatial context" title="Antarctic map and trajectory" /><div className="h-[520px] overflow-hidden rounded-xl border border-slate-700/70 light:border-slate-200"><AntarcticMap compact /></div></Card>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Card className="p-5"><SectionTitle icon={Thermometer} eyebrow="Scientific distinction" title="Individual iceberg contribution" /><Metric label="This iceberg" value={formatMm(totals?.net_sea_level_equivalent_m)} /><p className="mt-4 text-xs text-slate-400">A single floating iceberg estimate must not be interpreted as a global sea-level projection. Broader outlook values are intentionally excluded because this backend does not calculate them.</p></Card><Card className="p-5"><SectionTitle icon={Database} eyebrow="Model provenance" title="Data sources & readiness" /><div className="text-sm text-slate-300 light:text-slate-600 space-y-2"><p>Iceberg positions: existing active-iceberg API.</p><p>Environmental forcing: backend-configured sources or explicitly labelled scenario baseline.</p><p>Only measurements and outputs supplied by the backend are rendered.</p></div></Card></div>
  </div>;
}
