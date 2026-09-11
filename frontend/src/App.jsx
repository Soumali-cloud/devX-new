import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './views/LandingPage';
import { AntarcticMap } from './views/AntarcticMap';
import { Dashboard } from './views/Dashboard';
import { Visualizations } from './views/Visualizations';
import { Settings } from './views/Settings';
import { SeaLevelImpact } from './views/SeaLevelImpact';
import { Shield } from 'lucide-react';

import { CopilotDrawer } from './components/CopilotDrawer';
import { ConsultAIFloatingButton } from './components/ConsultAIFloatingButton';

function ViewRouter() {
  const { currentTab } = useNavigation();

  return (
    <div className="flex-1 w-full flex flex-col">
      {currentTab === 'landing' && <LandingPage />}
      {currentTab === 'map' && <AntarcticMap />}
      {currentTab === 'dashboard' && <Dashboard />}
      {currentTab === 'visualizations' && <Visualizations />}
      {currentTab === 'settings' && <Settings />}
      {currentTab === 'sea-level-impact' && <SeaLevelImpact />}
    </div>
  );
}

function AppContent() {
  const { copilotOpen, setCopilotOpen } = useNavigation();

  return (
    <div className="min-h-screen w-full flex flex-col bg-midnight text-white light:bg-white light:text-ocean-navy transition-colors duration-200 overflow-x-hidden">
      {/* Top Fixed Persistent Navigation Bar */}
      <Navbar />

      {/* Main Content Area with top padding for fixed header */}
      <main className="flex-1 w-full pt-16">
        <ViewRouter />
      </main>

      {/* Global Dynamic Consult AI Floating Fly Point */}
      <ConsultAIFloatingButton />

      {/* Global Consult AI Copilot Drawer */}
      <CopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />

      {/* Persistent Static Footer (Page scrolls under) */}
      <footer className="sticky bottom-0 z-30 w-full border-t border-slate-700/80 light:border-slate-200 py-3 px-4 sm:px-8 bg-ocean-navy/95 light:bg-slate-50/95 backdrop-blur-md text-xs text-slate-400 light:text-slate-600 select-none shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white light:text-ocean-navy">HimYatra</span>
            <span className="text-slate-500">|</span>
            <span className="text-ice-cyan light:text-research-blue font-semibold">
              HimYatra: The Polar Journey
            </span>
            <span className="text-slate-500">|</span>
            <span>Antarctic Sea Ice & Navigation DSS</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 light:text-slate-500">
            <span>EPSG:3031 Coordinate Reference System</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 light:text-emerald-600 font-semibold">Operational DSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </ThemeProvider>
  );
}
