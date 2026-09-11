import React, { useState } from 'react';
import {
  Sliders,
  Sun,
  Moon,
  Server,
  Key,
  ShieldAlert,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Radio,
  Lock,
  Unlock,
  LogOut,
  Mail
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../context/NavigationContext';
import { checkHealth } from '../services/api';

export function Settings() {
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    apiStatus,
    verifyApi,
    iceConcentrationAlert,
    setIceConcentrationAlert,
    safetyRadiusNM,
    setSafetyRadiusNM,
    maxHullStress,
    setMaxHullStress,
    isAdminAuth,
    adminLogin,
    adminLogout
  } = useNavigation();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [endpoint, setEndpoint] = useState(() => {
    return localStorage.getItem('himyatra_api_endpoint') || 'http://127.0.0.1:8000';
  });

  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('himyatra_api_key') || 'dev-polar-secret-key-2026';
  });

  const [offlineMode, setOfflineMode] = useState(() => {
    return localStorage.getItem('himyatra_offline_mode') === 'true';
  });

  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    const res = adminLogin(loginEmail, loginPassword);
    if (!res.success) {
      setLoginError('Invalid credentials. Required: devx2026@gmail.com / rss');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const start = performance.now();
      const res = await checkHealth();
      const latency = Math.round(performance.now() - start);
      if (res.status === 'online') {
        setTestResult({ success: true, message: `Connected successfully (${latency} ms latency)` });
      } else if (res.status === 'offline-mode') {
        setTestResult({ success: true, message: 'Offline simulation mode active' });
      } else {
        setTestResult({ success: false, message: `Backend unavailable: ${res.error || 'Connection refused'}` });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
      verifyApi();
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('himyatra_api_endpoint', endpoint);
    localStorage.setItem('himyatra_api_key', apiKey);
    localStorage.setItem('himyatra_offline_mode', offlineMode ? 'true' : 'false');
    setSavedSuccess(true);
    verifyApi();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setEndpoint('http://127.0.0.1:8000');
    setApiKey('dev-polar-secret-key-2026');
    setOfflineMode(false);
    setIceConcentrationAlert(70);
    setSafetyRadiusNM(15);
    setMaxHullStress(65);
    localStorage.removeItem('himyatra_api_endpoint');
    localStorage.removeItem('himyatra_api_key');
    localStorage.removeItem('himyatra_offline_mode');
    setSavedSuccess(true);
    verifyApi();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // If not authenticated as Admin, show centered login gate
  if (!isAdminAuth) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-12 px-4 select-none">
        <div className="w-full max-w-md p-8 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white shadow-xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-midnight light:bg-ice-tint border border-ice-cyan/40 mx-auto flex items-center justify-center text-ice-cyan light:text-research-blue shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white light:text-ocean-navy">
              Operational Administration Gate
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Restricted portal area for configuring real-time FastAPI endpoints, anomaly sensitivity thresholds, and machine learning daemon parameters.
            </p>
          </div>

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-ice-cyan" />
                <span>Admin Email:</span>
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="devx2026@gmail.com"
                required
                className="w-full bg-midnight/80 light:bg-slate-50 border border-slate-700 light:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-white light:text-ocean-navy font-mono focus:outline-none focus:border-ice-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-ice-cyan" />
                <span>Passkey:</span>
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="rss"
                required
                className="w-full bg-midnight/80 light:bg-slate-50 border border-slate-700 light:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-white light:text-ocean-navy font-mono focus:outline-none focus:border-ice-cyan"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-iceberg-red/10 border border-iceberg-red/40 text-xs text-red-300 font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-ice-cyan text-midnight font-bold text-xs shadow-sm hover:bg-sky-400 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Authorize & Access Settings</span>
            </button>
          </form>

          <div className="p-3.5 rounded-xl bg-midnight/50 light:bg-slate-50 border border-slate-700/80 text-[11px] font-mono text-slate-400 text-center">
            Authorized Personnel: <br />
            <strong className="text-ice-cyan">devx2026@gmail.com</strong> / <strong className="text-ice-cyan">rss</strong>
          </div>

        </div>
      </div>
    );
  }

  // Admin Authenticated View
  return (
    <div className="w-full flex flex-col items-center py-8 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 light:border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5" />
                <span>Admin Session Active</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                devx2026@gmail.com
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-ocean-navy">
              Operational Settings & Machine Learning Daemon Targets
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Configure backend REST proxies, API keys, and autonomous hull safety limits.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={adminLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Session</span>
            </button>
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-ice-cyan text-midnight font-bold text-xs shadow-sm hover:bg-sky-400 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-route-safe" />
            <span>Operational parameters successfully synchronized.</span>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Theme Switcher */}
          <div className="p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-4 shadow-sm">
            <div className="border-b border-slate-700/80 pb-3">
              <h3 className="font-bold text-base text-white light:text-ocean-navy">
                Interface Color Scheme
              </h3>
              <p className="text-xs text-slate-400">
                Switch between Midnight Polar Dark and Clean Ice White
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { if (!isDark) toggleTheme(); }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isDark
                    ? 'border-ice-cyan bg-midnight/80 ring-2 ring-ice-cyan/40 shadow-sm'
                    : 'border-slate-700 bg-midnight/30 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1 font-bold text-sm text-white">
                  <span className="flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-ice-cyan" />
                    <span>Dark Mode</span>
                  </span>
                  {isDark && <CheckCircle2 className="w-4 h-4 text-ice-cyan" />}
                </div>
                <p className="text-[11px] text-slate-400">Default Deep Ocean Navy & Midnight</p>
              </button>

              <button
                onClick={() => { if (isDark) toggleTheme(); }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  !isDark
                    ? 'border-research-blue bg-white ring-2 ring-research-blue/40 shadow-sm'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1 font-bold text-sm text-white light:text-ocean-navy">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Mode</span>
                  </span>
                  {!isDark && <CheckCircle2 className="w-4 h-4 text-research-blue" />}
                </div>
                <p className="text-[11px] text-slate-400">Clean Ice White & Daylight Clarity</p>
              </button>
            </div>
          </div>

          {/* Card 2: Backend API Target */}
          <div className="p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div>
                <h3 className="font-bold text-base text-white light:text-ocean-navy">
                  FastAPI ML Backend Daemon
                </h3>
                <p className="text-xs text-slate-400">
                  Direct connection for 2D sea-ice tensor inference
                </p>
              </div>
              <span className="text-xs font-mono text-route-safe">
                {apiStatus.connected ? 'ONLINE' : 'FALLBACK SIM'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 light:text-slate-700">
                  Service Endpoint URL:
                </label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="w-full bg-midnight/80 light:bg-slate-50 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white light:text-ocean-navy focus:outline-none focus:border-ice-cyan"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 light:text-slate-700">
                  X-API-Key Secret:
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-midnight/80 light:bg-slate-50 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white light:text-ocean-navy focus:outline-none focus:border-ice-cyan"
                />
              </div>

              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 rounded-xl bg-research-blue hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 border border-ice-cyan/30 disabled:opacity-50"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>{testing ? 'Pinging Endpoint...' : 'Test Backend Connection'}</span>
              </button>

              {testResult && (
                <div className={`text-xs font-mono flex items-center gap-1.5 ${testResult.success ? 'text-route-safe' : 'text-route-short'}`}>
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Sliders Grid */}
        <div className="p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-6 shadow-sm">
          <div className="border-b border-slate-700/80 pb-3">
            <h3 className="font-bold text-base text-white light:text-ocean-navy">
              Autonomous Safety Envelopes & Anomaly Sliders
            </h3>
            <p className="text-xs text-slate-400">
              Configure threshold limits for real-time route alerts and diversion algorithms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-4 rounded-xl border border-slate-700/60 bg-midnight/50 light:bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 light:text-slate-700">
                <span>Pack-Ice Alert Limit:</span>
                <span className="font-mono text-ice-cyan font-bold">{iceConcentrationAlert}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={iceConcentrationAlert}
                onChange={(e) => setIceConcentrationAlert(parseInt(e.target.value))}
                className="w-full accent-ice-cyan cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Triggers visual detour warning when grid concentration exceeds this ceiling.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-700/60 bg-midnight/50 light:bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 light:text-slate-700">
                <span>Iceberg Standoff Perimeter:</span>
                <span className="font-mono text-ice-cyan font-bold">{safetyRadiusNM} NM</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={safetyRadiusNM}
                onChange={(e) => setSafetyRadiusNM(parseInt(e.target.value))}
                className="w-full accent-ice-cyan cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Enforces a minimum radial exclusion zone around active USNIC detected tabular icebergs.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-700/60 bg-midnight/50 light:bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 light:text-slate-700">
                <span>Max Allowable Hull Stress:</span>
                <span className="font-mono text-amber-400 font-bold">{maxHullStress} / 100</span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={maxHullStress}
                onChange={(e) => setMaxHullStress(parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Lindqvist resistance threshold before pathfinder triggers mandatory course divert.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
