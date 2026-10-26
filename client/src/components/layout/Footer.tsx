import React from 'react';
import { ArrowRight, Code, Cpu, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#060a12] text-slate-400 text-xs py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-mono font-bold text-white text-sm">
                DS
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                ULTIMATE <span className="text-cyan-400">DS</span> CHALLENGE
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              Learn data structures through four quiz levels, real-world scenarios, and detailed answer reviews.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-cyan-400/90 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Learn. Practice. Improve.</span>
            </div>
          </div>

          {/* Core Navigation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Challenge Hub</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/learn')} className="hover:text-cyan-400 transition-colors">
                  Data Structure Catalog (9 Structures)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/levels')} className="hover:text-cyan-400 transition-colors">
                  4-Level Progression Path
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/challenges')} className="hover:text-cyan-400 transition-colors">
                  Quiz Challenges
                </button>
              </li>
            </ul>
          </div>

          {/* Gamification & Verification */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Progress & Achievements</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/leaderboard')} className="hover:text-cyan-400 transition-colors">
                  Global Leaderboard
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/achievements')} className="hover:text-cyan-400 transition-colors">
                  Achievements (10 Badges)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/dashboard')} className="hover:text-cyan-400 transition-colors">
                  Personal Dashboard & Streaks
                </button>
              </li>
              <li>
                <span className="text-slate-500 font-mono text-[11px]">
                  Built for College Evaluators & Senior Engineers
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Quiz challenge progression */}
        <div className="py-4 px-6 rounded-2xl bg-slate-900/60 border border-slate-800 mb-8 overflow-x-auto">
          <p className="text-[11px] font-mono uppercase text-slate-400 font-bold mb-2">Quiz Challenge Flow:</p>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 min-w-[700px]">
            <span className="px-2 py-1 bg-cyan-950/60 text-cyan-300 rounded border border-cyan-800">🎯 Problem</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded">🧠 Analyze</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded">📦 Select DS</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="px-2 py-1 bg-indigo-950/60 text-indigo-300 rounded border border-indigo-800">🧩 Choose Structures</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="px-2 py-1 bg-purple-950/60 text-purple-300 rounded border border-purple-800">📝 Submit Quiz</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="px-2 py-1 bg-rose-950/60 text-rose-300 rounded border border-rose-800">📊 Server Score</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="px-2 py-1 bg-cyan-950/60 text-cyan-300 rounded border border-cyan-800">🔎 Review Results</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="px-2 py-1 bg-emerald-950/60 text-emerald-300 rounded border border-emerald-800">🏆 Earn XP & Progress</span>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
          <p>© 2026 ULTIMATE DS CHALLENGE. Syllabus-Based Data Structure Learning Platform.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono">
            <span>Desktop Optimized</span>
            <span>•</span>
            <span>Single-Process JSON Persistence</span>
            <span>•</span>
            <span>TypeScript Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
