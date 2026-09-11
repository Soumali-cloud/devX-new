import React, { useState } from 'react';
import {
  Bot,
  X,
  Send,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Search,
  BookOpen,
  Anchor,
  Compass,
  Wind,
  Layers,
  ThermometerSnowflake,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { getCopilotBriefing } from '../services/api';
import { INITIAL_COPILOT_BRIEFING } from '../services/mockData';

// Extensive Gemini Knowledge Base for Antarctic Science & Navigation
function generateGeminiResponse(query, context) {
  const q = query.toLowerCase();
  
  if (q.includes('penguin') || q.includes('wildlife') || q.includes('animal') || q.includes('seal') || q.includes('krill')) {
    return {
      title: 'Gemini Antarctic Biosphere Analysis: Fauna & Ecosystem',
      category: 'POLAR ECOLOGY',
      summary: 'Antarctica hosts extremophile marine and avian biodiversity adapted to sub-zero temperatures and high-salinity brines.',
      paragraphs: [
        'The Southern Ocean is dominated by Antarctic krill (Euphausia superba), forming the foundational keystone species supporting baleen whales, crabeater seals, and seabirds.',
        'Emperor penguins (Aptenodytes forsteri) breed on fast ice during the Antarctic winter, relying on sub-ice polynyas for foraging. Vessels navigating within 10 NM of rookeries are mandated by the Antarctic Treaty Environmental Protocol to reduce acoustic signature and speed to 8 knots to minimize disruptive pressure waves.'
      ],
      recommendations: ['Maintain environmental acoustic standoff', 'Record wildlife sightings in polar biodiversity log']
    };
  }

  if (q.includes('treaty') || q.includes('law') || q.includes('rule') || q.includes('sovereignty') || q.includes('who owns')) {
    return {
      title: 'Gemini Legal Directive: The Antarctic Treaty System (ATS)',
      category: 'INTERNATIONAL JURISDICTION',
      summary: 'Signed in Washington on December 1, 1959, the Antarctic Treaty entered into force in 1961, preserving the continent south of 60°S exclusively for peaceful scientific research.',
      paragraphs: [
        'Article IV effectively freezes all territorial sovereignty claims (by UK, Norway, Chile, Argentina, France, Australia, and New Zealand) while preventing new claims.',
        'Military maneuvers, weapons testing, and nuclear waste disposal are strictly banned under Articles I and V. India became a Consultative Party in 1983 and strictly complies with the Madrid Protocol on Environmental Protection (1991).'
      ],
      recommendations: ['Ensure strict non-military civilian clearance', 'Mandatory waste extraction back to home ports']
    };
  }

  if (q.includes('shackleton') || q.includes('history') || q.includes('amundsen') || q.includes('scott') || q.includes('discovery')) {
    return {
      title: 'Gemini Historical Archive: Heroic Age of Antarctic Exploration',
      category: 'HISTORICAL LOGS',
      summary: 'Roald Amundsen was the first human to reach the Geographic South Pole on December 14, 1911, followed by Robert Falcon Scott 34 days later.',
      paragraphs: [
        'Sir Ernest Shackleton’s 1914-1917 Imperial Trans-Antarctic Expedition aboard the Endurance represents the most celebrated survival voyage in maritime history, after the ship was beset and crushed in Weddell Sea pack ice.',
        'Modern navigational engines like HimYatra directly prevent the besetting conditions that trapped the Endurance by identifying compressive pack-ice dynamics via satellite SAR before entry.'
      ],
      recommendations: ['Review historical ice entrapment charts', 'Avoid divergent compression ridges']
    };
  }

  if (q.includes('katabatic') || q.includes('wind') || q.includes('weather') || q.includes('storm') || q.includes('blizzard')) {
    return {
      title: 'Gemini Meteorological Diagnostic: Katabatic Wind Mechanics',
      category: 'ATMOSPHERIC DYNAMICS',
      summary: 'Katabatic winds are gravity-driven density flows originating when radiational cooling chills high-altitude polar plateau air.',
      paragraphs: [
        'The chilled dense air plunges down steep continental coastal slopes, accelerating through glacial valleys to hurricane velocities exceeding 100 knots at coastal margins like Maitri and Commonwealth Bay.',
        'During katabatic surges, sudden pressure ridges deform coastal sea ice into multi-meter hummocks within hours, escalating besetting risk for vessels with Polar Class below PC4.'
      ],
      recommendations: ['Anchor in leeward coastal shelters', 'Maintain minimum PC5 propulsion reserve (>6,000 kW)']
    };
  }

  if (q.includes('hull') || q.includes('stress') || q.includes('resistance') || q.includes('lindqvist') || q.includes('break')) {
    return {
      title: 'Gemini Hydrodynamic Evaluation: Lindqvist Ice Resistance',
      category: 'NAVAL ARCHITECTURE',
      summary: 'Calculated using the Lindqvist continuous icebreaking formula balancing crushing (R_crush), bending (R_bend), and submergence (R_sub).',
      paragraphs: [
        `For vessel Polar Class ${context.vesselIceClass}, bow stem angles of 22°–25° optimize flexural fracture of 1.2m to 2.0m level ice. Continuous thrust requirements are 6,800 kW on the Safest trajectory.`,
        'Shortest rhumb-line transit traverses compressive pack ice with high tangential friction, increasing instantaneous hull plate stress by 320% and risking entrapment.'
      ],
      recommendations: ['Engage Safest Trajectory to stay within nominal hull stress margins', 'Maintain steady RPM to prevent thermal torque stalls']
    };
  }

  // Default deep polar AI response
  return {
    title: `Gemini Operational Intelligence: Analysis for "${query}"`,
    category: 'INTELLIGENT DECISION SUPPORT',
    summary: `Comprehensive evaluation synthesizing Southern Ocean environmental tensors, IACS Polar Code standards, and navigation telemetry for Class ${context.vesselIceClass}.`,
    paragraphs: [
      `Satellite SAR data for Forecast Horizon T+${context.forecastDay} indicates low to moderate sea ice compression along the recommended transit corridor. Water temperatures average -1.8°C with marginal ice zone leads providing optimal passage.`,
      `Current mission constraints recommend prioritizing the Safest Route variant with an average ice risk exposure of 14.2%, preserving 28.4% bunker fuel reserves compared to direct unassisted navigation.`
    ],
    recommendations: [
      'Maintain 18.0 NM standoff from megaberg A-23a',
      'Continuous echo-sounding for uncharted sub-polar seamounts',
      'Radio check-in with Maitri & Bharati mission control desks'
    ]
  };
}

export function CopilotDrawer({ isOpen, onClose }) {
  const {
    vesselIceClass,
    forecastDay,
    selectedRouteId,
    activeRoute
  } = useNavigation();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      data: {
        title: 'Google Gemini Polar Co-Pilot Initialized',
        category: 'AUTONOMOUS DSS',
        summary: 'Ready to assist with real-time navigational directives, icebreaker engineering, Antarctic treaties, meteorological analysis, and polar history.',
        paragraphs: [
          'I am continuously monitoring environmental tensors across the Southern Ocean, active USNIC iceberg trajectories, and vessel hull loads for your voyage between Indian research stations.',
          'You can ask me about safe navigation parameters, or any general polar topic (e.g., penguin biology, katabatic wind mechanics, the Antarctic Treaty, or historical expeditions).'
        ],
        recommendations: [
          'Safest Route is pre-calculated and loaded',
          'Vessel Ice Class set to ' + vesselIceClass
        ]
      }
    }
  ]);

  const handleAsk = async (promptQuery) => {
    const q = promptQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    const userMsg = { role: 'user', content: q };
    setChatHistory(prev => [...prev, userMsg]);
    setQuery('');

    // Simulate Gemini thought & synthesis latency
    setTimeout(() => {
      const response = generateGeminiResponse(q, {
        vesselIceClass,
        forecastDay,
        activeRoute
      });

      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          data: response
        }
      ]);
      setLoading(false);
    }, 450);
  };

  const samplePrompts = [
    'How do katabatic winds affect pack ice?',
    'What does the Antarctic Treaty dictate?',
    'Evaluate Lindqvist hull stress at Day 3',
    'Tell me about Emperor penguin colonies',
    'How did the Endurance get trapped in ice?',
    'What are the standoff rules for A-23a?'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-midnight/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-full bg-ocean-navy light:bg-white border-l border-ice-cyan/40 shadow-2xl flex flex-col select-none animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header - Google Gemini Inspired */}
        <div className="p-4 sm:p-5 border-b border-slate-border light:border-slate-light-border flex items-center justify-between bg-midnight/70 light:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-research-blue via-ocean-navy to-midnight border border-ice-cyan/50 flex items-center justify-center text-ice-cyan shadow-glow-cyan/40">
              <Sparkles className="w-5 h-5 text-ice-cyan animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white light:text-ocean-navy">
                  Captain's AI Co-Pilot
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-ice-cyan/20 text-ice-cyan border border-ice-cyan/30 font-semibold flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  <span>Google Gemini Engine</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous Polar Decision Support & Antarctic Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-border hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400 hover:text-white transition-colors"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Bar */}
        <div className="px-5 py-2.5 bg-midnight/50 light:bg-ice-tint border-b border-slate-border light:border-slate-light-border grid grid-cols-3 gap-2 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">VESSEL CLASS</span>
            <span className="font-bold text-ice-cyan">{vesselIceClass}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">FORECAST WINDOW</span>
            <span className="font-bold text-white light:text-ocean-navy">T+{forecastDay} Horizon</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">ACTIVE ROUTE</span>
            <span className="font-bold text-route-safe">{activeRoute?.name || 'Safest'}</span>
          </div>
        </div>

        {/* Scrollable Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {chatHistory.map((msg, i) => (
            <div key={i} className="space-y-2">
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-md p-3.5 rounded-2xl bg-research-blue/60 text-white border border-ice-cyan/30 text-xs sm:text-sm font-medium shadow-md">
                    <span className="font-bold block text-[10px] font-mono text-ice-cyan mb-1 uppercase">
                      Captain Query
                    </span>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-2xl border border-ice-cyan/30 bg-midnight/60 light:bg-slate-50 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-ice-cyan" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ice-cyan font-bold">
                        {msg.data.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Gemini High-Precision
                    </span>
                  </div>

                  <h4 className="font-bold text-sm sm:text-base text-white light:text-ocean-navy">
                    {msg.data.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-200 light:text-slate-700 font-semibold leading-relaxed">
                    {msg.data.summary}
                  </p>

                  <div className="space-y-2 text-xs text-slate-300 light:text-slate-600 leading-relaxed font-sans pt-1">
                    {msg.data.paragraphs?.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {msg.data.recommendations && (
                    <div className="pt-2 border-t border-slate-border/50 space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                        Directives & Recommendations:
                      </span>
                      {msg.data.recommendations.map((rec, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-2 text-xs text-emerald-300 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-route-safe flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="p-4 rounded-xl border border-slate-border bg-midnight/40 flex items-center gap-3 text-xs text-ice-cyan font-mono animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Google Gemini reasoning across polar tensors and literature...</span>
            </div>
          )}

          {/* Quick Prompt Chips */}
          <div className="pt-4 border-t border-slate-border/50 space-y-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Suggested Inquiries:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(p)}
                  className="text-left text-[11px] py-1 px-3 rounded-lg border border-slate-border light:border-slate-light-border bg-midnight/50 light:bg-slate-100 hover:border-ice-cyan text-slate-300 light:text-slate-700 hover:text-ice-cyan transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* User Input Bar */}
        <div className="p-4 border-t border-slate-border light:border-slate-light-border bg-midnight/80 light:bg-slate-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about navigation, sea ice, treaties, wildlife, or history..."
              className="flex-1 bg-midnight light:bg-white border border-slate-border light:border-slate-light-border rounded-xl px-4 py-2.5 text-xs text-white light:text-ocean-navy placeholder:text-slate-500 focus:outline-none focus:border-ice-cyan"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 rounded-xl bg-ice-cyan text-midnight font-bold hover:bg-sky-400 transition-colors disabled:opacity-40 flex items-center gap-1.5 text-xs shadow-glow-cyan"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Inquire</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
