import React, { useState } from 'react';
import {
  Newspaper,
  AlertTriangle,
  Clock,
  Search,
  ChevronRight,
  X
} from 'lucide-react';
import { ANTARCTIC_NEWS } from '../services/newsData';

export function PolarNews() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState(null);

  const categories = [
    'All',
    'Expedition Dispatches',
    'Cryosphere & Ice Shelves',
    'Weather & Katabatic Warnings',
    'Marine & Environmental Research',
    'International Polar Treaty'
  ];

  const filteredNews = ANTARCTIC_NEWS.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col items-center py-8 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 light:border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-ice-cyan light:text-research-blue uppercase tracking-widest">
                Live Environmental Intelligence
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-route-safe/20 text-route-safe border border-route-safe/30">
                SYNCHRONIZED FEED
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-ocean-navy">
              Antarctic News & Scientific Bulletins
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600">
              Real-time polar dispatches, cryospheric observations, ice shelf calving notices, and polar vessel expedition communications.
            </p>
          </div>

          <div className="relative w-full sm:w-72 self-start sm:self-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bulletins, vessels..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-midnight/80 light:bg-white border border-slate-700 light:border-slate-200 text-xs text-white light:text-ocean-navy focus:outline-none focus:border-ice-cyan"
            />
          </div>
        </div>

        {/* Urgent Alert Banner */}
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/50 bg-amber-500/10 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300 uppercase tracking-wider font-mono">
                ACTIVE OPERATIONAL BULLETIN: MEGABERG A-23A & KATABATIC ALERT
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <p className="text-amber-200/90 leading-relaxed">
              All vessels transiting the Weddell Sea confluence and Larsemann Hills corridor must maintain continuous S-band radar watches and adhere to the 18.0 NM standoff perimeter.
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/60 light:border-slate-200 pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-ice-cyan text-midnight shadow-sm font-bold'
                  : 'bg-ocean-navy/80 light:bg-slate-100 text-slate-300 light:text-slate-700 border border-slate-700/80 hover:border-ice-cyan/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((news) => (
            <article
              key={news.id}
              onClick={() => setActiveArticle(news)}
              className="p-6 rounded-2xl border border-slate-700/80 light:border-slate-200 bg-ocean-navy/80 light:bg-white space-y-4 shadow-sm hover:border-ice-cyan/60 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-research-blue/40 text-ice-cyan border border-ice-cyan/30">
                    {news.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{news.relativeTime}</span>
                  </span>
                </div>

                <h3 className="font-bold text-base text-white light:text-ocean-navy group-hover:text-ice-cyan transition-colors leading-snug">
                  {news.headline}
                </h3>

                <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed line-clamp-3">
                  {news.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-700/60 light:border-slate-200 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{news.source}</span>
                <span className="text-ice-cyan light:text-research-blue flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold">
                  <span>Read Bulletin</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Full Article Modal */}
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md">
            <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-ocean-navy light:bg-white border border-ice-cyan/40 p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
              
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-research-blue/40 text-ice-cyan border border-ice-cyan/30 font-bold">
                    {activeArticle.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{activeArticle.source}</span>
                </div>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white light:text-ocean-navy leading-tight">
                {activeArticle.headline}
              </h2>

              <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
                <span>Published: {new Date(activeArticle.timestamp).toUTCString()}</span>
                <span>•</span>
                <span>{activeArticle.readTime}</span>
              </div>

              <div className="p-4 rounded-xl bg-midnight/60 light:bg-slate-50 border border-slate-700 light:border-slate-200 text-xs sm:text-sm text-slate-200 light:text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                {activeArticle.content}
              </div>

              <div className="pt-4 border-t border-slate-700/80 light:border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-400 light:text-slate-600 font-mono">Verified Dispatch — Polar Maritime Operations Desk</span>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="px-5 py-2 rounded-xl bg-ice-cyan text-midnight font-bold"
                >
                  Close Bulletin
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
