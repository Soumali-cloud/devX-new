import React from 'react';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export function ConsultAIFloatingButton() {
  const { copilotOpen, setCopilotOpen, currentTab } = useNavigation();

  // Tab label for dynamic context indicator
  const tabNames = {
    landing: 'Home Overview',
    map: 'Polar Map',
    dashboard: 'Analytics',
    visualizations: 'Scientific Data',
    architecture: 'Architecture',
    news: 'Polar News',
    settings: 'Settings'
  };

  const activeContext = tabNames[currentTab] || 'Mission DSS';

  return (
    <aside aria-label="Polar AI Copilot Assistant" className="fixed bottom-6 right-6 z-40 flex items-center select-none group">
      {/* Outer Pulse Wave Ring */}
      <span className="absolute -inset-1 rounded-full bg-ice-cyan/40 opacity-75 blur-sm group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none" />

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setCopilotOpen(!copilotOpen)}
        aria-label="Consult AI Assistant"
        className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-ocean-navy via-slate-900 to-research-blue light:from-white light:via-slate-50 light:to-ice-tint border border-ice-cyan/60 light:border-ice-cyan shadow-xl hover:shadow-glow-cyan/50 hover:scale-105 active:scale-95 transition-all duration-300 text-white light:text-ocean-navy focus:outline-none btn-glow-cyan cursor-pointer"
      >
        {/* Glowing Icon Beacon */}
        <div className="relative w-8 h-8 rounded-full bg-ice-cyan flex items-center justify-center text-midnight shadow-md flex-shrink-0">
          <Sparkles className="w-4 h-4 text-midnight animate-spin" style={{ animationDuration: '8s' }} />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-ocean-navy light:border-white rounded-full animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-ocean-navy light:border-white rounded-full" />
        </div>

        {/* Text and Dynamic Page Context */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs tracking-wide uppercase font-sans text-white light:text-ocean-navy">
              Consult AI
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-ice-cyan/20 text-ice-cyan light:text-research-blue font-bold border border-ice-cyan/30">
              Gemini
            </span>
          </div>
          <span className="text-[10px] text-slate-300 light:text-slate-600 font-mono tracking-tight">
            {activeContext} Advisor
          </span>
        </div>

        {/* Action Icon */}
        <MessageSquare className="w-3.5 h-3.5 text-ice-cyan light:text-research-blue ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
      </button>
    </aside>
  );
}
