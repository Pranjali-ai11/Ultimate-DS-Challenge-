import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Target, Layers, ChevronRight } from 'lucide-react';
import { DataStructureVisualizer } from '../components/visualizers/DataStructureVisualizer';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { ProgressionSummary } from '../types';
import { challengeCount, rewardLabel } from '../services/progression';

export const LandingPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user } = useAuth();
  const [progression, setProgression] = useState<ProgressionSummary | null>(null);
  useEffect(() => {
    let active = true;
    api.getChallenges().then(data => { if (active) setProgression(data.progression); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const handleStartChallenge = () => navigate(user ? '/dashboard' : '/login');

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-slate-800/80">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold shadow-glow-cyan">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /><span>Data Structure Challenge Platform</span>
              </div>
              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-tight">ULTIMATE <br /><span className="text-gradient-cyan">DS CHALLENGE</span></h1>
              <p className="text-xl sm:text-2xl font-mono font-bold text-amber-400">Choose well. Explain your reasoning. Keep improving.</p>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">Practice data structures through four progressive quiz levels, from foundational choices to multi-select optimization challenges with detailed answer reviews.</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button onClick={handleStartChallenge} className="px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-cyan-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black shadow-glow-cyan flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"><Target className="w-4 h-4" /><span>START CHALLENGE</span><ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => navigate('/learn')} className="px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 transition-all flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-400" /><span>EXPLORE DATA STRUCTURES</span></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 font-mono">
                <div><div className="text-2xl font-black text-cyan-400">9</div><div className="text-xs text-slate-400 uppercase tracking-wider">Data Structures incl. enrichment</div></div>
                <div><div className="text-2xl font-black text-indigo-400">{progression?.totalChallenges ?? '—'}</div><div className="text-xs text-slate-400 uppercase tracking-wider">Challenges</div></div>
                <div><div className="text-2xl font-black text-amber-400">4</div><div className="text-xs text-slate-400 uppercase tracking-wider">Quiz Levels</div></div>
                <div><div className="text-2xl font-black text-emerald-400">✓</div><div className="text-xs text-slate-400 uppercase tracking-wider">Answer Reviews</div></div>
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="relative"><div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-3xl blur opacity-30 animate-pulse-slow" /><div className="relative"><DataStructureVisualizer structureType="bst" interactive={true} /></div></div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-2"><span>Optional BST enrichment preview</span><span className="text-cyan-400 font-bold">Try inserting a value</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-[#0a0f1d] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10"><span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">Quiz Challenge Flow</span><h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">Learn through a clear progression</h2><p className="text-xs sm:text-sm text-slate-400 mt-2">Read each scenario, choose a data structure or set of structures, submit your answers, then review the scoring and explanations.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {[
              ['🎯', '1. READ', 'Understand the scenario and its requirements.'],
              ['📦', '2. SELECT', 'Choose one answer or a set of structures.'],
              ['📊', '3. REVIEW', 'See coverage, missed choices, and explanations.'],
              ['🔓', '4. PROGRESS', 'Earn XP for first-time passed challenges and unlock new levels.'],
            ].map(([icon, title, description]) => <div key={title} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center gap-2"><span className="text-xl">{icon}</span><span className="font-bold text-cyan-300">{title}</span><span className="text-[10px] text-slate-400">{description}</span></div>)}
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10"><div><span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">Game Progression</span><h2 className="text-3xl font-extrabold text-white mt-1">Four quiz levels</h2></div><button onClick={() => navigate(user ? '/levels' : '/login')} className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold mt-3 md:mt-0"><span>View progression</span><ChevronRight className="w-4 h-4" /></button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { level: 1, name: 'FOUNDATION', badge: 'FOUNDATION', color: 'cyan', accent: 'text-cyan-400', hover: 'hover:border-cyan-500/50', hoverText: 'group-hover:text-cyan-400', desc: 'Answer single-select questions about core data structure behavior.', count: `${challengeCount(progression, 1) ?? '—'} Questions`, xp: rewardLabel(progression, 1) },
            { level: 2, name: 'STRATEGIST', badge: 'STRATEGIST', color: 'indigo', accent: 'text-indigo-400', hover: 'hover:border-indigo-500/50', hoverText: 'group-hover:text-indigo-400', desc: 'Compare structures across operations, ordering, and memory trade-offs.', count: `${challengeCount(progression, 2) ?? '—'} Questions`, xp: rewardLabel(progression, 2) },
            { level: 3, name: 'HYBRID DESIGNER', badge: 'MULTI-SELECT', color: 'purple', accent: 'text-purple-400', hover: 'hover:border-purple-500/50', hoverText: 'group-hover:text-purple-400', desc: 'Select complementary structures for real-world requirements. Partial coverage earns partial credit.', count: `${challengeCount(progression, 3) ?? '—'} Questions`, xp: rewardLabel(progression, 3) },
            { level: 4, name: 'OPTIMIZATION ARCHITECT', badge: 'ADVANCED', color: 'amber', accent: 'text-amber-400', hover: 'hover:border-amber-500/50', hoverText: 'group-hover:text-amber-400', desc: 'Solve advanced multi-select optimization challenges and review requirement coverage.', count: `${challengeCount(progression, 4) ?? '—'} Questions`, xp: rewardLabel(progression, 4) },
          ].map((item) => <div key={item.level} onClick={() => navigate(user ? `/challenges?level=${item.level}` : '/login')} className={`p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 ${item.hover} transition-all cursor-pointer group flex flex-col justify-between`}><div><div className={`flex items-center justify-between text-xs font-mono ${item.accent} font-bold mb-3`}><span>LEVEL 0{item.level}</span><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{item.badge}</span></div><h3 className={`text-lg font-extrabold text-white ${item.hoverText} transition-colors`}>{item.name}</h3><p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p></div><div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono"><span className="text-slate-400">{item.count}</span><span className={`${item.accent} font-bold`}>{item.xp}</span></div></div>)}
        </div>
      </section>

      <section className="py-16 bg-[#0a0e1c] border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-4"><span className="inline-flex px-3 py-1 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">Unit 2 practical · Level 3 example</span><h2 className="text-2xl sm:text-3xl font-extrabold text-white">Sparse matrix workbench</h2><p className="text-sm text-slate-300 leading-relaxed">Store only nonzero matrix entries in compact triplet form, then transpose the matrix by exchanging row and column coordinates. Compare the simple and fast transpose approaches.</p><button onClick={() => navigate(user ? '/challenges/c-l3-01' : '/login')} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan flex items-center gap-2 font-mono transition-colors"><span>OPEN CHALLENGE</span><ArrowRight className="w-3.5 h-3.5" /></button></div>
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-cyan-500/30"><h3 className="text-sm font-mono text-cyan-300 font-bold mb-4">PRACTICAL TASKS</h3><div className="space-y-3">{['Represent each nonzero value as (row, column, value)', 'Transpose by swapping row and column indices', 'Compare repeated-scan simple transpose with count-based fast transpose'].map((requirement, index) => <div key={requirement} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3"><span className="w-7 h-7 rounded-full bg-cyan-950 text-cyan-300 flex items-center justify-center font-mono text-xs">{index + 1}</span><span className="text-sm text-slate-200">{requirement}</span></div>)}</div><p className="text-xs text-slate-400 mt-4">The quiz evaluates the syllabus-based requirements on the server and shows feedback after submission.</p></div>
        </div>
      </section>

      <section className="py-20 relative text-center"><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"><h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Ready to test your data structure skills?</h2><p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-sans">Start with the fundamentals, build your score, and progress through increasingly advanced challenges.</p><div className="flex flex-wrap items-center justify-center gap-4 pt-4"><button onClick={handleStartChallenge} className="px-8 py-4 rounded-xl font-bold text-base bg-cyan-400 hover:bg-cyan-300 text-black shadow-glow-cyan flex items-center gap-2 transition-all transform hover:scale-105"><span>{user ? 'ENTER CHALLENGE ARENA' : 'SIGN IN TO START'}</span><ArrowRight className="w-5 h-5" /></button></div></div></section>
    </div>
  );
};
