import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Compass,
  Navigation,
  Activity,
  BarChart3,
  Sliders,
  Sun,
  Moon,
  Radio,
  Clock,
  Lock,
  Unlock,
  ChevronRight,
  Shield
  ,Waves
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../context/NavigationContext';

export function Navbar() {
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    currentTab,
    setCurrentTab,
    apiStatus,
    verifyApi,
    isAdminAuth,
    vesselIceClass,
    forecastDay,
  } = useNavigation();
  const [utcTime, setUtcTime] = useState('');
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);

  // Live UTC Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const iso = now.toUTCString().replace('GMT', 'UTC');
      setUtcTime(iso);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLeftDrawerOpen) {
        setIsLeftDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLeftDrawerOpen]);

  const navItems = [
    { id: 'landing', label: 'Home', icon: Compass, desc: 'Mission overview & quick launch' },
    { id: 'map', label: 'Live Map', icon: Navigation, desc: 'EPSG:3031 Polar Deck.gl engine' },
    { id: 'dashboard', label: 'Analytics', icon: Activity, desc: 'Vessel fuel, ice & hull stress' },
    { id: 'sea-level-impact', label: 'Sea-Level Impact', icon: Waves, desc: 'Iceberg melt & net contribution' },
    { id: 'visualizations', label: 'Scientific Data', icon: BarChart3, desc: '316x332 grid & ERA5 vectors' },
    { id: 'settings', label: 'Admin Settings', icon: Sliders, desc: 'Operational parameters', restricted: true },
  ];

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    setIsLeftDrawerOpen(false);
  };

  const activeItem = navItems.find((i) => i.id === currentTab) || navItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <>
      {/* Top Persistent Fixed Header with Balanced Alignment */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b backdrop-blur-md bg-ocean-navy/95 border-slate-700/80 text-white light:bg-white/95 light:border-slate-200 light:text-ocean-navy shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Left: 3-Line Menu Trigger + Official Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            
            {/* 3-Line Menu Button (triggers left slide-in navbar drawer) */}
            <button
              onClick={() => setIsLeftDrawerOpen(true)}
              className="flex items-center gap-2 p-2 px-2.5 sm:px-3 rounded-xl border border-slate-700/80 light:border-slate-300 bg-midnight/60 light:bg-slate-100 hover:border-ice-cyan text-ice-cyan light:text-research-blue transition-all duration-200 focus:outline-none shadow-sm group btn-glow"
              aria-label="Open Navigation Sidebar"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline font-mono text-xs font-semibold text-slate-200 light:text-slate-700 group-hover:text-ice-cyan light:group-hover:text-research-blue">
                Modules
              </span>
            </button>

            {/* Official Portal Identity */}
            <div 
              onClick={() => handleSelectTab('landing')}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
              title="Return to Home Overview"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-research-blue via-ocean-navy to-midnight border border-ice-cyan/40 group-hover:border-ice-cyan flex items-center justify-center text-ice-cyan shadow-sm transition-all group-hover:scale-105">
                <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wider text-base sm:text-lg text-white light:text-ocean-navy uppercase font-sans">
                    HimYatra
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 light:text-slate-600 font-medium tracking-tight truncate max-w-[170px] sm:max-w-none">
                  Antarctic Navigation & Iceberg Trajectory
                </span>
              </div>
            </div>

          </div>

          {/* Center: Dynamic Active Module & Mission Telemetry HUD */}
          <div 
            onClick={() => setIsLeftDrawerOpen(true)}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-700/80 light:border-slate-200 bg-midnight/50 light:bg-slate-100 hover:border-ice-cyan text-xs font-mono cursor-pointer transition-all duration-200 group shadow-sm select-none"
            title="Click to switch modules from navbar drawer"
          >
            <div className="flex items-center gap-1.5 text-ice-cyan light:text-research-blue font-bold">
              <ActiveIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>{activeItem.label}</span>
            </div>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 light:text-slate-600 font-medium">
              Class {vesselIceClass || 'PC5'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 light:text-emerald-600 font-semibold">
              Day T+{forecastDay || 1}
            </span>
          </div>

          {/* Right Controls: System Status, UTC Clock, AI Shortcut, Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Live API Status Pill (interactive: click to verify API) */}
            <button
              onClick={verifyApi}
              title="Click to check live backend connectivity"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-700/80 light:border-slate-200 bg-midnight/50 light:bg-slate-100 text-xs font-mono hover:border-ice-cyan transition-colors"
            >
              <Radio className={`w-3 h-3 ${apiStatus?.connected ? 'text-route-safe animate-pulse' : 'text-route-short'}`} />
              <span className="text-slate-400 light:text-slate-600 hidden xs:inline">SYS:</span>
              <span className={`font-semibold ${apiStatus?.connected ? 'text-route-safe' : 'text-route-short'}`}>
                {apiStatus?.connected ? 'ONLINE' : (apiStatus?.simulated ? 'SIMULATED' : 'OFFLINE')}
              </span>
            </button>

            {/* UTC Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-700/80 light:border-slate-200 bg-midnight/50 light:bg-slate-100 text-xs font-mono text-slate-300 light:text-slate-700">
              <Clock className="w-3.5 h-3.5 text-ice-cyan light:text-research-blue" />
              <span>{utcTime || 'UTC'}</span>
            </div>

            {/* Admin status tag if logged in */}
            {isAdminAuth && (
              <button 
                onClick={() => handleSelectTab('settings')}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/30 text-[10px] font-mono font-bold hover:bg-amber-500/30 transition-all"
                title="Admin session active - Click for Settings"
              >
                <Unlock className="w-3 h-3" />
                <span>ADMIN</span>
              </button>
            )}


            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark / Light Mode"
              title={isDark ? "Switch to White Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-xl border border-slate-700/80 light:border-slate-300 bg-midnight/50 light:bg-slate-100 text-ice-cyan light:text-research-blue hover:border-ice-cyan hover:scale-105 active:scale-95 transition-all shadow-sm btn-glow"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-300 hover:rotate-90 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-research-blue hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

          </div>

        </div>
      </header>

      {/* 3-Line Menu: Slides in from the LEFT SIDE */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          
          {/* Backdrop */}
          <div 
            onClick={() => setIsLeftDrawerOpen(false)}
            className="fixed inset-0 bg-midnight/80 backdrop-blur-sm"
          />

          {/* Left Side Drawer Content */}
          <aside className="relative w-80 sm:w-96 h-full bg-ocean-navy light:bg-white border-r border-slate-700/80 light:border-slate-200 shadow-2xl flex flex-col justify-between z-10 select-none animate-in slide-in-from-left duration-300">
            
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-slate-700/80 light:border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-research-blue to-ocean-navy border border-ice-cyan/40 flex items-center justify-center text-ice-cyan shadow-sm">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white light:text-ocean-navy tracking-wider uppercase">
                      HimYatra Portal
                    </h2>
                    <p className="text-[11px] text-ice-cyan light:text-research-blue font-medium">
                      AI-Enabled Polar Navigation & Iceberg Trajectory DSS
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsLeftDrawerOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400 hover:text-white light:hover:text-ocean-navy transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items (One by one vertically on the left side) */}
              <div className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-12rem)]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 px-3 block mb-2 font-bold">
                  Operational Modules
                </span>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isActive
                          ? 'border-ice-cyan bg-ice-cyan/15 text-white light:text-ocean-navy ring-1 ring-ice-cyan/30 shadow-sm'
                          : 'border-transparent hover:border-slate-700/80 hover:bg-midnight/40 light:hover:bg-slate-100 text-slate-300 light:text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-ice-cyan text-midnight' : 'bg-midnight/60 light:bg-slate-200 text-ice-cyan light:text-research-blue'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white light:text-ocean-navy">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      {item.restricted && !isAdminAuth ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>


            {/* Drawer Bottom Info */}
            <div className="p-4 border-t border-slate-700/80 light:border-slate-200 bg-midnight/50 light:bg-slate-50 text-[11px] font-mono text-slate-400 light:text-slate-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>Time: {utcTime}</span>
                <span className={apiStatus.connected ? 'text-route-safe' : 'text-route-short'}>
                  {apiStatus.connected ? 'ONLINE' : 'SIMULATED'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 light:text-slate-600 font-semibold">
                HimYatra: The Polar Journey
              </div>
            </div>

          </aside>
        </div>
      )}
    </>
  );
}
