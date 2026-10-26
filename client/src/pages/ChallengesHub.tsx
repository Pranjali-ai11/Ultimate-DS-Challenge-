import React, { useState, useEffect } from 'react';
import {
  Target,
  Filter,
  Search,
  Zap,
  ArrowRight,
  Lock
} from 'lucide-react';
import { Challenge } from '../types';
import { TopicRegistryEntry } from '../types/learning';
import { findTopicEntry } from '../services/topicNavigation.js';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ChallengesHub: React.FC<{
  navigate: (path: string) => void;
  initialLevel?: number;
  initialTopic?: string;
}> = ({ navigate, initialLevel, initialTopic }) => {
  const { progress } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>(initialLevel || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [topicNotice, setTopicNotice] = useState('');

  useEffect(() => {
    async function load() {
      try {
        let topicId: string | undefined;
        if (initialTopic) {
          try {
            const catalog = await api.getLearnCatalog();
            const match = findTopicEntry(initialTopic, catalog.topicRegistry as TopicRegistryEntry[]);
            if (match) topicId = match.id;
            else setTopicNotice('This topic is not recognized. Showing all challenges instead.');
          } catch {
            setTopicNotice('Topic filters could not be verified. Showing all challenges instead.');
          }
        }
        const data = await api.getChallenges({ topic: topicId });
        setChallenges(data.challenges || []);
      } catch {
        setLoadError('Challenges could not be loaded. Check your connection and retry.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialTopic]);

  const unlockedLevel = progress?.unlockedLevel || 1;

  const filtered = challenges.filter(c => {
    if (selectedLevel !== 'all' && c.level !== selectedLevel) return false;
    if (selectedDifficulty !== 'all' && c.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.missionBrief.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold mb-2">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Architectural Mission Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              SYSTEM CHALLENGES
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Choose a level to practice foundations, trade-offs, hybrid structure selection, and system optimization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/levels')}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-200 transition-colors"
            >
              Progression Path
            </button>
          </div>
        </div>

        {loadError && <div role="alert" className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 text-sm">{loadError} <button className="underline ml-2" onClick={() => window.location.reload()}>Retry</button></div>}
        {topicNotice && <div role="status" className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-3 text-sm text-cyan-100">{topicNotice}</div>}
        {initialTopic && challenges.length > 0 && !topicNotice && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-3 text-sm text-cyan-100"><span>Showing challenges related to <strong>{initialTopic}</strong>.</span><button type="button" onClick={() => navigate('/challenges')} className="font-mono text-xs font-bold text-cyan-300 underline">Show all challenges</button></div>}

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f172a]/90 p-4 rounded-2xl border border-slate-800">
          {/* Level Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedLevel === 'all'
                  ? 'bg-cyan-500 text-black shadow-glow-cyan'
                  : 'bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              ALL LEVELS ({challenges.length})
            </button>
            {[1, 2, 3, 4].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedLevel === lvl
                    ? 'bg-cyan-500 text-black shadow-glow-cyan'
                    : 'bg-slate-900 text-slate-300 hover:text-white'
                }`}
              >
                LEVEL 0{lvl}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search missions, topics..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder:text-slate-500 focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300 font-mono outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-mono text-sm animate-pulse">
            Loading challenge catalog from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-mono text-sm">
            No missions matched your current search filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(challenge => {
              const isLocked = challenge.level > unlockedLevel;

              return (
                <div
                  key={challenge.id}
                  className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between group ${
                    isLocked
                      ? 'bg-[#0b101c]/60 border-slate-800/80 opacity-75'
                      : 'bg-[#0f172a]/90 border-slate-800 hover:border-cyan-500/50 hover:shadow-glow-cyan'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Level & Reward Tag */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold">
                        LEVEL 0{challenge.level}
                      </span>
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        +{challenge.rewardXp} XP
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-extrabold text-white group-hover:text-cyan-400 transition-colors leading-snug">
                      {challenge.title}
                    </h3>

                    {/* Category pill */}
                    <span className="inline-block text-[11px] font-mono text-indigo-400">
                      Category: {challenge.category}
                    </span>

                    {/* Brief */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {challenge.missionBrief}
                    </p>

                    {/* Requirements checklist preview */}
                    <div className="space-y-1 pt-2">
                      <p className="text-[10px] uppercase font-mono font-bold text-slate-400">Requirements:</p>
                      {challenge.requirements.slice(0, 3).map((r, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 truncate">
                          <span className="text-cyan-400">✓</span>
                          <span className="truncate">{r.label}</span>
                        </div>
                      ))}
                      {challenge.requirements.length > 3 && (
                        <span className="text-[10px] font-mono text-slate-500">
                          +{challenge.requirements.length - 3} more requirements...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Action */}
                  <div className="pt-6 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Difficulty: <strong className="text-white">{challenge.difficulty}</strong>
                    </span>

                    {isLocked ? (
                      <span className="flex items-center gap-1 text-xs font-mono text-slate-500">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    ) : (
                      <button
                        onClick={() => navigate(`/challenges/${challenge.id}`)}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan flex items-center gap-1.5 transition-all"
                      >
                        <span>START MISSION</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
