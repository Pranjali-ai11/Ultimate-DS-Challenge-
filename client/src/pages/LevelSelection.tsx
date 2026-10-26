import React, { useEffect, useState } from 'react';
import {
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { ProgressionSummary } from '../types';
import { challengeCount, rewardLabel, unlockRequirement } from '../services/progression';

export const LevelSelection: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { progress, updateUserProgress } = useAuth();
  const unlockedLevel = progress?.unlockedLevel || 1;
  const [completedByLevel, setCompletedByLevel] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [progression, setProgression] = useState<ProgressionSummary | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.getProgress().then(data => {
      if (!active) return;
      updateUserProgress(data.progress);
      setProgression(data.progression);
      setCompletedByLevel(data.completedChallengesByLevel);
    }).catch(() => {
      if (active) setProgressError('Level progress and reward details could not be loaded.');
    });
    return () => { active = false; };
  }, [updateUserProgress]);

  const levels = [
    {
      levelNumber: 1,
      name: 'FOUNDATION',
      roleTitle: 'Foundation Builder',
      difficulty: 'Easy',
      xpReward: rewardLabel(progression, 1),
      totalChallenges: challengeCount(progression, 1) ?? 0,
      completedChallenges: completedByLevel[1] || 0,
      unlocked: true,
      unlockCriteria: 'Available by default to all architects.',
      description: 'Master fundamental data structures and their core operations.',
      colorScheme: {
        border: 'border-cyan-500/40',
        badgeBg: 'bg-cyan-950/80',
        badgeText: 'text-cyan-300',
        accent: 'cyan'
      }
    },
    {
      levelNumber: 2,
      name: 'STRATEGIST',
      roleTitle: 'Trade-off Strategist',
      difficulty: 'Medium',
      xpReward: rewardLabel(progression, 2),
      totalChallenges: challengeCount(progression, 2) ?? 0,
      completedChallenges: completedByLevel[2] || 0,
      unlocked: unlockedLevel >= 2,
      unlockCriteria: unlockRequirement(progression, 2),
      description: 'Analyze real-world scenarios and choose the best data structure based on time, memory, ordering, insertion, deletion, and search trade-offs.',
      colorScheme: {
        border: 'border-indigo-500/40',
        badgeBg: 'bg-indigo-950/80',
        badgeText: 'text-indigo-300',
        accent: 'indigo'
      }
    },
    {
      levelNumber: 3,
      name: 'HYBRID DESIGNER',
      roleTitle: 'Hybrid Designer',
      difficulty: 'Hard',
      xpReward: rewardLabel(progression, 3),
      totalChallenges: challengeCount(progression, 3) ?? 0,
      completedChallenges: completedByLevel[3] || 0,
      unlocked: unlockedLevel >= 3,
      unlockCriteria: unlockRequirement(progression, 3),
      description: 'Answer multi-select questions about complementary structures and earn partial credit for requirement coverage.',
      colorScheme: {
        border: 'border-purple-500/40',
        badgeBg: 'bg-purple-950/80',
        badgeText: 'text-purple-300',
        accent: 'purple'
      }
    },
    {
      levelNumber: 4,
      name: 'OPTIMIZATION ARCHITECT',
      roleTitle: 'Optimization Architect',
      difficulty: 'Expert',
      xpReward: rewardLabel(progression, 4),
      totalChallenges: challengeCount(progression, 4) ?? 0,
      completedChallenges: completedByLevel[4] || 0,
      unlocked: unlockedLevel >= 4,
      unlockCriteria: unlockRequirement(progression, 4),
      description: 'Optimize complex systems under competing time, memory, ordering, workload, and scalability constraints.',
      colorScheme: {
        border: 'border-amber-500/40',
        badgeBg: 'bg-amber-950/80',
        badgeText: 'text-amber-300',
        accent: 'amber'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {progressError && <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">{progressError}</div>}
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mastery Progression Roadmap</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            CAMPAIGN LEVELS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Progress through four quiz levels, from core data-structure concepts to advanced system optimization.
          </p>
        </div>

        {/* Visual Progression Tree */}
        <div className="space-y-6 relative">
          {levels.map((lvl, index) => {
            const isCurrent = unlockedLevel === lvl.levelNumber;
            const isCompleted = unlockedLevel > lvl.levelNumber;
            const isLocked = !lvl.unlocked;

            return (
              <div key={lvl.levelNumber} className="relative">
                {/* Connecting arrow if not last */}
                {index < levels.length - 1 && (
                  <div className="absolute left-8 -bottom-7 w-0.5 h-8 bg-gradient-to-b from-cyan-500 to-indigo-500 z-0 hidden md:block" />
                )}

                <div
                  className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                    isLocked
                      ? 'bg-[#0d1424]/40 border-slate-800 opacity-75'
                      : isCurrent
                      ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900 to-[#0f172a] border-cyan-400/80 shadow-glow-cyan'
                      : 'bg-[#0f172a]/80 border-slate-700/80 hover:border-cyan-500/40'
                  }`}
                >
                  {/* Left: Level Icon & Number */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-lg border shadow-lg ${
                        isLocked
                          ? 'bg-slate-900 border-slate-800 text-slate-500'
                          : isCompleted
                          ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400'
                          : 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-glow-cyan'
                      }`}
                    >
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-slate-500" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      ) : (
                        <>
                          <span className="text-[10px] text-cyan-400 uppercase font-semibold">LVL</span>
                          <span>0{lvl.levelNumber}</span>
                        </>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isLocked
                              ? 'bg-slate-900 text-slate-500 border-slate-800'
                              : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {lvl.roleTitle}
                        </span>
                        <span className="text-xs font-mono text-slate-400">• {lvl.difficulty}</span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                        LEVEL 0{lvl.levelNumber}: {lvl.name}
                      </h3>

                      <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                        {lvl.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status & Action */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-left md:text-right font-mono text-xs">
                      <div className="text-amber-400 font-bold">{lvl.xpReward}</div>
                      <div className="text-slate-400 mt-0.5">
                        {lvl.completedChallenges} / {lvl.totalChallenges} Missions Completed
                      </div>
                    </div>

                    {isLocked ? (
                      <div className="flex items-center gap-2 text-xs font-mono text-rose-400 bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-800/60">
                        <Lock className="w-3.5 h-3.5" />
                        <span>🔒 {lvl.unlockCriteria}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/challenges?level=${lvl.levelNumber}`)}
                        className="px-5 py-2.5 rounded-xl font-bold font-mono text-xs bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan flex items-center gap-2 transition-transform transform hover:-translate-y-0.5"
                      >
                        <span>ENTER LEVEL 0{lvl.levelNumber}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
