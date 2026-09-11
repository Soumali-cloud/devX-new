import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Layers,
  Wind,
  Waves,
  Sliders,
  Compass,
  BarChart2,
  Activity,
  MapPin
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useNavigation } from '../context/NavigationContext';
import { useTheme } from '../context/ThemeContext';
import { DRIFT_VELOCITY_HISTOGRAM } from '../services/mockData';
import { gridToLatLon } from '../utils/geoUtils';

export function Visualizations() {
  const { forecastDay, setForecastDay } = useNavigation();
  const { isDark } = useTheme();

  const [activeVizTab, setActiveVizTab] = useState('heatmap');
  const [colorMap, setColorMap] = useState('polar');
  const [minIceFilter, setMinIceFilter] = useState(0.15);
  const [hoverGridCell, setHoverGridCell] = useState(null);

  const canvasRef = useRef(null);

  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const textColor = isDark ? '#94A3B8' : '#475569';

  useEffect(() => {
    if (activeVizTab !== 'heatmap') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 332;
    const height = 316;
    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const idx = (r * width + c) * 4;
        
        const dr = (r - 158) / 158;
        const dc = (c - 166) / 166;
        const dist = Math.sqrt(dr * dr + dc * dc);

        let val = 0;
        if (dist < 0.45) {
          val = 0.95;
        } else if (dist < 0.85) {
          const angle = Math.atan2(dr, dc);
          const wave = Math.sin(angle * 5 + forecastDay * 0.7) * 0.15;
          val = Math.max(0, 1.0 - (dist - 0.45) / 0.4 + wave);
        } else {
          val = 0.05;
        }

        if (val < minIceFilter) {
          val = 0;
        }

        if (val === 0) {
          data[idx] = isDark ? 2 : 240;
          data[idx + 1] = isDark ? 6 : 249;
          data[idx + 2] = isDark ? 23 : 255;
          data[idx + 3] = 255;
        } else if (colorMap === 'polar') {
          data[idx] = Math.round(val * 255);
          data[idx + 1] = Math.round(180 + val * 75);
          data[idx + 2] = 255;
          data[idx + 3] = Math.round(val * 230 + 25);
        } else if (colorMap === 'thermal') {
          data[idx] = Math.round(Math.min(255, val * 350));
          data[idx + 1] = Math.round(Math.sin(val * Math.PI) * 255);
          data[idx + 2] = Math.round((1 - val) * 255);
          data[idx + 3] = 240;
        } else {
          const gray = Math.round(val * 255);
          data[idx] = gray;
          data[idx + 1] = gray;
          data[idx + 2] = gray;
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [activeVizTab, colorMap, minIceFilter, forecastDay, isDark]);

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 332 / rect.width;
    const scaleY = 316 / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX);
    const row = Math.floor((e.clientY - rect.top) * scaleY);

    if (row >= 0 && row < 316 && col >= 0 && col < 332) {
      const geo = gridToLatLon(row, col);
      const dr = (row - 158) / 158;
      const dc = (col - 166) / 166;
      const dist = Math.sqrt(dr * dr + dc * dc);
      const approxVal = dist < 0.45 ? 0.95 : dist < 0.85 ? Math.max(0, 1.0 - (dist - 0.45) / 0.4) : 0.05;

      setHoverGridCell({
        row,
        col,
        lat: geo.lat,
        lon: geo.lon,
        concentration: +(approxVal.toFixed(2))
      });
    }
  };

  const vectorPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 18; i++) {
      const lat = -62 - (i % 6) * 2.8;
      const lon = -60 + Math.floor(i / 6) * 45;
      const u10 = +(Math.cos(i) * 12 + 8).toFixed(1);
      const v10 = +(Math.sin(i) * 14 - 6).toFixed(1);
      const uCurr = +(u10 * 0.035).toFixed(2);
      const vCurr = +(v10 * 0.035).toFixed(2);
      const windSpeed = Math.sqrt(u10 * u10 + v10 * v10).toFixed(1);
      pts.push({ id: i, lat, lon, u10, v10, uCurr, vCurr, windSpeed });
    }
    return pts;
  }, []);

  return (
    <div className="w-full flex flex-col items-center py-8 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Header & Sub-Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 light:border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-ice-cyan light:text-research-blue uppercase tracking-widest">
                Scientific Diagnostics
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-research-blue/30 text-ice-cyan border border-ice-cyan/30">
                ERA5 / NSIDC Tensors
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-ocean-navy">
              Atmospheric, Oceanographic & Iceberg Dispersion
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              High-resolution 316x332 grid raster matrices, coupled wind-current vectors, and empirical drift distributions.
            </p>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-ocean-navy/80 light:bg-slate-100 border border-slate-700/80 light:border-slate-200 self-start sm:self-center">
            <button
              onClick={() => setActiveVizTab('heatmap')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeVizTab === 'heatmap'
                  ? 'bg-ice-cyan text-midnight shadow-sm font-bold btn-glow-cyan'
                  : 'text-slate-400 hover:text-white light:hover:text-ocean-navy btn-glow-subtle'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>316x332 Matrix</span>
            </button>
            <button
              onClick={() => setActiveVizTab('vectors')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeVizTab === 'vectors'
                  ? 'bg-ice-cyan text-midnight shadow-sm font-bold btn-glow-cyan'
                  : 'text-slate-400 hover:text-white light:hover:text-ocean-navy btn-glow-subtle'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>ERA5 Vectors</span>
            </button>
            <button
              onClick={() => setActiveVizTab('histogram')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeVizTab === 'histogram'
                  ? 'bg-ice-cyan text-midnight shadow-sm font-bold btn-glow-cyan'
                  : 'text-slate-400 hover:text-white light:hover:text-ocean-navy btn-glow-subtle'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Kinematic Velocity</span>
            </button>
          </div>
        </div>

        {/* View 1: 316x332 Sea Ice Spatial Heatmap */}
        {activeVizTab === 'heatmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-4 shadow-sm flex flex-col items-center">
              <div className="w-full flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white light:text-ocean-navy">
                    Sea Ice Spatial Concentration Heatmap (316 x 332 Grid)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Forecast Day T+{forecastDay} EPSG:3031 raster matrix projection
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  1 Pixel = ~25 km Cell
                </span>
              </div>

              <div className="relative border border-slate-700 rounded-xl overflow-hidden bg-midnight shadow-inner max-w-md w-full aspect-[332/316]">
                <canvas
                  ref={canvasRef}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={() => setHoverGridCell(null)}
                  className="w-full h-full cursor-crosshair image-rendering-pixelated"
                />
              </div>

              <div className="w-full p-3.5 rounded-xl border border-slate-700/80 bg-midnight/60 light:bg-slate-50 flex items-center justify-between text-xs font-mono">
                {hoverGridCell ? (
                  <>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-ice-cyan" />
                      <span>Grid [Row: <strong>{hoverGridCell.row}</strong>, Col: <strong>{hoverGridCell.col}</strong>]</span>
                    </div>
                    <div>Lat: {hoverGridCell.lat.toFixed(2)}°S, Lon: {hoverGridCell.lon.toFixed(2)}°E</div>
                    <div className="text-ice-cyan font-bold">
                      Concentration: {(hoverGridCell.concentration * 100).toFixed(0)}%
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-center w-full">
                    Hover mouse over heatmap to inspect grid tensor coordinates
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-6 shadow-sm">
              <div>
                <h3 className="font-bold text-base text-white light:text-ocean-navy">
                  Matrix Rendering Controls
                </h3>
                <p className="text-xs text-slate-400 light:text-slate-600">
                  Spectrophotometric transfer functions & temporal progression
                </p>
              </div>

              {/* Dynamic 7-Day Horizon Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 light:text-slate-700">
                  <span>Forecast Horizon:</span>
                  <span className="font-mono text-ice-cyan font-bold">Day T+{forecastDay}</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <button
                      key={d}
                      onClick={() => setForecastDay(d)}
                      className={`py-1.5 rounded-lg text-center font-mono text-[11px] transition-all border cursor-pointer ${
                        forecastDay === d
                          ? 'bg-ice-cyan text-midnight font-bold border-ice-cyan shadow-sm scale-105 btn-glow-cyan'
                          : 'bg-midnight/60 light:bg-slate-50 text-slate-300 light:text-slate-700 border-slate-700 hover:border-ice-cyan/60 btn-glow-subtle'
                      }`}
                      title={`Simulate Day T+${d} sea-ice concentration`}
                    >
                      T+{d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 light:text-slate-700 block">
                  Colormap Palette:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'polar', label: 'Polar Blue' },
                    { id: 'thermal', label: 'Thermal Ice' },
                    { id: 'grayscale', label: 'Grayscale' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setColorMap(p.id)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                        colorMap === p.id
                          ? 'bg-ice-cyan text-midnight font-bold border-ice-cyan shadow-sm btn-glow-cyan'
                          : 'bg-midnight/60 light:bg-slate-50 text-slate-300 light:text-slate-700 border-slate-700 hover:border-ice-cyan/50 btn-glow-subtle'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 light:text-slate-700">
                  <span>Concentration Cutoff Filter:</span>
                  <span className="font-mono text-ice-cyan font-bold">{(minIceFilter * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={minIceFilter}
                  onChange={(e) => setMinIceFilter(parseFloat(e.target.value))}
                  className="w-full accent-ice-cyan cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0% (All Water)</span>
                  <span>80% (Dense Pack)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-700/70 bg-midnight/50 light:bg-slate-50 space-y-2 text-xs font-mono">
                <div className="font-bold text-ice-cyan text-[11px]">TENSOR SPECIFICATIONS</div>
                <div className="flex justify-between"><span>Matrix Dimensions:</span><strong className="text-white light:text-ocean-navy">316 x 332</strong></div>
                <div className="flex justify-between"><span>Total Cells:</span><strong className="text-white light:text-ocean-navy">104,912</strong></div>
                <div className="flex justify-between"><span>Coordinate CRS:</span><strong className="text-white light:text-ocean-navy">EPSG:3031</strong></div>
                <div className="flex justify-between"><span>Projection Center:</span><strong className="text-white light:text-ocean-navy">-90.00° Lat</strong></div>
                <div className="flex justify-between"><span>Grid Spacing:</span><strong className="text-white light:text-ocean-navy">25.0 km</strong></div>
              </div>

            </div>

          </div>
        )}

        {/* View 2: ERA5 Atmospheric & Oceanic Vector Fields */}
        {activeVizTab === 'vectors' && (
          <div className="p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
              <div>
                <h3 className="font-bold text-base text-white light:text-ocean-navy">
                  ERA5 Atmospheric Wind (10m) & Surface Current Vectors
                </h3>
                <p className="text-xs text-slate-400">
                  Coupled u10, v10 atmospheric stress and u_curr, v_curr Ekman drift fields
                </p>
              </div>
              <span className="text-xs font-mono text-route-short bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                Katabatic Surge Active (Queen Maud Land)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vectorPoints.map(v => (
                <div
                  key={v.id}
                  className="p-4 rounded-xl border border-slate-700/80 light:border-slate-200 bg-midnight/50 light:bg-slate-50 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white light:text-ocean-navy">
                      Sector {v.lat.toFixed(1)}°S, {v.lon.toFixed(1)}°E
                    </span>
                    <Wind className="w-4 h-4 text-ice-cyan" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/50 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">WIND SPEED</span>
                      <strong className="text-amber-400">{v.windSpeed} kts</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">u10 / v10 VECTORS</span>
                      <span>{v.u10} / {v.v10} m/s</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SURFACE CURRENT</span>
                      <strong className="text-ice-cyan">{(Math.sqrt(v.uCurr*v.uCurr + v.vCurr*v.vCurr) * 1.94).toFixed(2)} kts</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">u_curr / v_curr</span>
                      <span>{v.uCurr} / {v.vCurr} m/s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View 3: Historical Iceberg Drift Velocity Distribution */}
        {activeVizTab === 'histogram' && (
          <div className="p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-6 shadow-sm">
            <div className="border-b border-slate-700/80 pb-3">
              <h3 className="font-bold text-base text-white light:text-ocean-navy">
                Historical Iceberg Drift Velocity Empirical Distribution
              </h3>
              <p className="text-xs text-slate-400">
                Statistical dispersion across 2,400+ USNIC and Sentinel tracked tabular icebergs
              </p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DRIFT_VELOCITY_HISTOGRAM} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="bin" stroke={textColor} fontSize={12} fontFamily="JetBrains Mono" />
                  <YAxis stroke={textColor} fontSize={12} fontFamily="JetBrains Mono" unit="%" />
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
                  <Bar dataKey="frequency" name="Frequency (%)" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-midnight/50 light:bg-slate-50 border border-slate-700 text-xs font-mono">
                <span className="text-slate-400 block">MEDIAN DRIFT SPEED</span>
                <strong className="text-lg text-white light:text-ocean-navy">0.74 Knots</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-midnight/50 light:bg-slate-50 border border-slate-700 text-xs font-mono">
                <span className="text-slate-400 block">95TH PERCENTILE GALE DRIFT</span>
                <strong className="text-lg text-amber-400">1.82 Knots</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-midnight/50 light:bg-slate-50 border border-slate-700 text-xs font-mono">
                <span className="text-slate-400 block">MODEL CORRELATION R²</span>
                <strong className="text-lg text-route-safe">0.914 (XGBoost)</strong>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
