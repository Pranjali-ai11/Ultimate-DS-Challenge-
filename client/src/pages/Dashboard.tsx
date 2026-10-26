import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Flame,
  Zap,
  Target,
  Trophy,
  Award,
  ArrowRight,
  Clock,
  Layers,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { DashboardProgressSummary, ProgressionSummary, UserProgress } from '../types';
import { challengeCount, rewardLabel } from '../services/progression';
import { api } from '../services/api';

export const Dashboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user, progress, achievements, updateUserProgress } = useAuth();
  const [practiceExposure, setPracticeExposure] = useState<Record<string, { passed: number; total: number; percentage: number }>>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [progression, setProgression] = useState<ProgressionSummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardProgressSummary | null>(null);
  const [authoritativeProgress, setAuthoritativeProgress] = useState<UserProgress | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    api.getProgress().then(data => {
      if (!active) return;
      setAuthoritativeProgress(data.progress);
      updateUserProgress(data.progress);
      setProgression(data.progression);
      setDashboard(data.dashboard);
      setPracticeExposure(data.practiceExposure);
      setRecentActivity(data.recentActivity);
    }).catch(() => {
      if (active) setStatsError('Dashboard data could not be loaded. Please try again.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [updateUserProgress, reloadKey]);

  const userName = user?.name || 'Architect';
  const dashboardProgress = authoritativeProgress ?? progress;
  const currentLevel = dashboardProgress?.unlockedLevel ?? dashboardProgress?.level ?? 1;
  const currentXp = dashboardProgress?.xp ?? 0;
  const nextUnlock = dashboardProgress?.nextUnlock ?? null;
  const totalChallengeCount = progression?.totalChallenges ?? 0;
  const totalScore = dashboardProgress?.score ?? 0;
  const completedCount = dashboardProgress?.completedChallenges ?? 0;
  const streakDays = dashboardProgress?.streak ?? 0;

  const levelNames: Record<number, string> = {
    1: 'Foundation Builder',
    2: 'Strategist',
    3: 'Hybrid Designer',
    4: 'Optimization Architect'
  };

  const missionConfigs: Record<number, {
    levelNumber: number;
    tag: string;
    title: string;
    description: string;
    tags: string[];
    buttonText: string;
    buttonLink: string;
    metaText: string;
    color: {
      border: string;
      bg: string;
      text: string;
      badgeBg: string;
      btnBg: string;
    };
  }> = {
    1: {
      levelNumber: 1,
      tag: 'CURRENT MISSION: LEVEL 1 FOUNDATION',
      title: 'Level 01: Foundation Challenges',
      description: 'Practice foundational FODS concepts across arrays, searching and sorting, linked lists, stacks, queues, and complexity.',
      tags: ['✓ Arrays & Algorithms', '✓ Linked Structures', '✓ Stacks & Queues'],
      buttonText: 'START LEVEL 1 QUIZ',
      buttonLink: '/challenges?level=1',
      metaText: `${challengeCount(progression, 1) ?? '—'} Questions`,
      color: {
        border: 'border-cyan-500/30',
        bg: 'from-slate-950 via-[#0f172a] to-cyan-950/30',
        text: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        btnBg: 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan'
      }
    },
    2: {
      levelNumber: 2,
      tag: 'CURRENT MISSION: LEVEL 2 STRATEGIST',
      title: 'Level 02: Architectural Trade-Off Analysis',
      description: 'Level 1 complete! Now analyze deep operational trade-offs across Search, Insertion, Deletion, and Memory overhead to find optimal structures.',
      tags: ['✓ Multi-Criteria Matrix', '✓ Search vs Insert Trade-offs', '✓ Memory Footprint'],
      buttonText: 'START LEVEL 2 MISSIONS',
      buttonLink: '/challenges?level=2',
      metaText: `${challengeCount(progression, 2) ?? '—'} Missions`,
      color: {
        border: 'border-indigo-500/30',
        bg: 'from-slate-950 via-[#0f172a] to-indigo-950/30',
        text: 'text-indigo-400',
        badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        btnBg: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-glow-indigo'
      }
    },
    3: {
      levelNumber: 3,
      tag: 'CURRENT MISSION: LEVEL 3 HYBRID DESIGNER',
      title: 'Level 03: Hybrid Designer',
      description: 'Answer multi-select questions about real-world requirements and earn partial credit for correct selections.',
      tags: ['✓ Multi-Select Quiz', '✓ Requirement Coverage', '✓ Partial Scoring'],
      buttonText: 'START LEVEL 3 QUIZ',
      buttonLink: '/challenges?level=3',
      metaText: `${challengeCount(progression, 3) ?? '—'} Missions`,
      color: {
        border: 'border-purple-500/30',
        bg: 'from-slate-950 via-[#0f172a] to-purple-950/30',
        text: 'text-purple-400',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        btnBg: 'bg-purple-500 hover:bg-purple-400 text-white shadow-glow-purple'
      }
    },
    4: {
      levelNumber: 4,
      tag: 'CURRENT MISSION: LEVEL 4 OPTIMIZATION ARCHITECT',
      title: 'Level 04: Optimization Architect',
      description: 'Answer advanced multi-select questions about time, memory, ordering, workload, and scalability.',
      tags: ['✓ Workload Analysis', '✓ Complexity Trade-Offs', '✓ Optimization Reasoning'],
      buttonText: 'START LEVEL 4 CHALLENGE',
      buttonLink: '/challenges?level=4',
      metaText: `${challengeCount(progression, 4) ?? '—'} Missions`,
      color: {
        border: 'border-amber-500/30',
        bg: 'from-slate-950 via-[#0f172a] to-amber-950/30',
        text: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        btnBg: 'bg-amber-500 hover:bg-amber-400 text-black shadow-glow-amber'
      }
    }
  };

  const activeMission = missionConfigs[currentLevel] || missionConfigs[1];

  const unlockedBadges = achievements.filter(a => a.unlocked);
  const currentMission = dashboard?.currentLevelMissions;
  const completionPercent = dashboard?.overallCompletion.percentage ?? 0;
  const finalChallengesComplete = currentLevel === 4 && completedCount >= totalChallengeCount && totalChallengeCount > 0;
  const missionActionText = finalChallengesComplete ? 'REVIEW LEVELS' : activeMission.buttonText;
  const missionActionPath = finalChallengesComplete ? '/levels' : activeMission.buttonLink;

  if (loading) {
    return <div className="min-h-screen bg-[#070b14] text-slate-100 px-4 py-12" role="status" aria-live="polite">
      <div className="max-w-7xl mx-auto rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-8 text-center text-slate-300">Loading your dashboard…</div>
    </div>;
  }

  if (statsError || !dashboard || !progression || !dashboardProgress) {
    return <div className="min-h-screen bg-[#070b14] text-slate-100 px-4 py-12">
      <div className="max-w-3xl mx-auto rounded-2xl border border-amber-500/30 bg-[#0f172a] p-8 text-center">
        <p role="alert" className="text-amber-200">{statsError || 'Dashboard data is unavailable.'}</p>
        <button type="button" onClick={() => { setLoading(true); setStatsError(null); setReloadKey(value => value + 1); }} className="mt-5 rounded-xl border border-cyan-500/50 px-5 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-950/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">Retry</button>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {statsError && <div role="alert" className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 text-sm">{statsError}</div>}
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Level 0{currentLevel} — {levelNames[currentLevel] || 'Foundation Builder'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
              WELCOME, {userName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {currentLevel === 1
                ? 'Master Level 1 Foundation questions, advance to Level 2 trade-offs, and unlock Level 3 multi-select challenges.'
                : currentLevel === 2
                ? 'Analyze real-world workload and data-structure trade-offs in the Level 2 Strategist quiz.'
                : currentLevel === 3
                ? 'Choose structures for real-world requirements in Level 3 and review your partial-credit feedback.'
                : 'Tackle Level 4 optimization challenges across workload, performance, and memory constraints.'}
            </p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={() => navigate('/challenges')}
              className="px-5 py-3 rounded-xl font-bold text-xs font-mono bg-cyan-400 hover:bg-cyan-300 text-black shadow-glow-cyan flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Target className="w-4 h-4 text-black" />
              <span>START CHALLENGES</span>
            </button>
            <button
              onClick={() => navigate('/learn')}
              className="px-4 py-3 rounded-xl font-bold text-xs font-mono bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Learn Hub</span>
            </button>
          </div>
        </div>

        {/* 4 Core Stat Cards (Strictly Genuine Values) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* XP Progress */}
          <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-cyan-500/20 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="font-bold">EXPERIENCE (XP)</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{currentXp}</div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>Unlock progress</span>
                <span className="text-cyan-400 font-bold">{nextUnlock ? `Next unlock: ${nextUnlock.passed} of ${nextUnlock.required} passed` : dashboardProgress.hasNextLevel === false ? 'Maximum level reached' : 'Unlock details unavailable'}</span>
              </div>
              {nextUnlock && <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-label={`Progress to level ${nextUnlock.level}`} aria-valuemin={0} aria-valuemax={nextUnlock.required} aria-valuenow={nextUnlock.passed}>
                <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${nextUnlock.percentage}%` }} />
              </div>}
            </div>
          </div>

          {/* Total Score */}
          <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-indigo-500/20 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="font-bold">TOTAL SCORE</span>
              <Trophy className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{totalScore}</div>
            <p className="text-xs text-slate-400 mt-2">
              Aggregated accuracy & correctness across all missions.
            </p>
          </div>

          {/* Challenges Completed */}
          <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-purple-500/20 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="font-bold">CHALLENGES SOLVED</span>
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {dashboard.overallCompletion.passed} <span className="text-base text-slate-500 font-normal">/ {dashboard.overallCompletion.total}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {dashboard.overallCompletion.total > 0
                ? `${completionPercent}% of the available challenge bank passed.`
                : 'No challenges are available in the catalog.'}
            </p>
          </div>

          {/* Streak */}
          <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-amber-500/20 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="font-bold">ACTIVE STREAK</span>
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="text-3xl font-black text-amber-400 font-mono">🔥 {streakDays} DAY{streakDays > 1 ? 'S' : ''}</div>
            <p className="text-xs text-slate-400 mt-2">
              Pass challenges on consecutive UTC days to maintain your streak.
            </p>
          </div>
        </div>

        {/* Two Columns: Current Recommended Mission & Practice Exposure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Recommended Mission + Recent Activity */}
          <div className="lg:col-span-7 space-y-6">
            {/* Dynamic Current / Recommended Mission Card based on user level */}
            <div className={`p-6 rounded-3xl bg-gradient-to-tr ${activeMission.color.bg} border ${activeMission.color.border} shadow-xl space-y-4`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono uppercase tracking-widest ${activeMission.color.text} font-bold`}>
                  {activeMission.tag}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${activeMission.color.badgeBg}`}>
                  {rewardLabel(progression, activeMission.levelNumber)}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">
                  {activeMission.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeMission.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
                {activeMission.tags.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
                    {t}
                  </span>
                ))}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-300">Mission completion</span>
                  <span className="font-mono text-cyan-200">{currentMission?.passed ?? 0} / {currentMission?.total ?? 0} passed</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label={`Level ${currentLevel} mission completion`} aria-valuemin={0} aria-valuemax={currentMission?.total ?? 0} aria-valuenow={currentMission?.passed ?? 0}>
                  <div className="h-full rounded-full bg-indigo-400 transition-all duration-500" style={{ width: `${currentMission?.total ? Math.min(100, Math.round(currentMission.passed / currentMission.total * 100)) : 0}%` }} />
                </div>
              </div>

              <div className="text-xs text-slate-300" role="status">
                <span className="font-bold text-cyan-300">Next Step: </span>{dashboard.nextStep.label}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => navigate(missionActionPath)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all transform hover:scale-105 ${activeMission.color.btnBg}`}
                >
                  <span>{missionActionText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-right text-xs font-mono text-slate-400">{currentMission?.total ?? challengeCount(progression, activeMission.levelNumber) ?? '—'} Missions</span>
              </div>
            </div>

            {/* Recent Activity List (Genuine User Activity) */}
            <div className="p-6 rounded-3xl bg-[#0f172a]/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Recent Architect Activity
                </h3>
                <span className="text-xs font-mono text-slate-400">{recentActivity.length} Completed Runs</span>
              </div>

              {recentActivity.length === 0 ? (
                <div className="py-8 text-center text-slate-500 font-mono text-xs">
                  No challenges completed yet. Solve your first challenge to see your activity here!
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          item.status === 'passed' ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400' : 'bg-rose-950 border border-rose-500/40 text-rose-400'
                        }`}>
                          {item.status === 'passed' ? '✓' : '✗'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{item.challengeTitle}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Level {item.level} • {new Date(item.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className={`font-extrabold text-sm ${item.status === 'passed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.score}
                        </span>
                        <span className="text-[10px] text-slate-500"> / 100</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Practice Exposure Grid */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-[#0f172a]/80 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Practice Exposure
                  </h3>
                  <p className="text-xs text-slate-400">Distinct passed challenges out of those mapped to each structure; this is exposure, not mastery.</p>
                </div>
                <button
                  onClick={() => navigate('/learn')}
                  className="shrink-0 whitespace-nowrap text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  Learn All →
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                {Object.keys(practiceExposure).length === 0 && (
                  <p className="text-slate-400" role="status">
                    {loading ? 'Loading exposure data…' : 'Exposure data is unavailable.'}
                  </p>
                )}
                {Object.entries(practiceExposure).map(([dsKey, exposure]) => {
                  const { passed, total, percentage: pct } = exposure;
                  const labelMap: Record<string, string> = {
                    'array': 'Array',
                    'linked-list': 'Linked List',
                    'stack': 'Stack (LIFO)',
                    'queue': 'Queue (FIFO)',
                    'deque': 'Deque',
                    'priority-queue': 'Priority Queue',
                    'heap': 'Binary Heap',
                    'bst': 'Binary Search Tree',
                    'hash-table': 'Hash Table',
                    'graph': 'Graph Network'
                  };
                  return (
                    <div key={dsKey} className="space-y-1">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_2.5rem] items-center gap-2 text-[11px]">
                        <span className="min-w-0 truncate text-slate-300 font-semibold">{labelMap[dsKey] || dsKey}</span>
                        <span className="whitespace-nowrap text-center text-slate-400 font-normal tabular-nums">
                          {total > 0 ? `${passed} / ${total}` : 'No mapped challenges'}
                        </span>
                        <span className={`whitespace-nowrap text-right tabular-nums ${total > 0 && pct > 0 ? "text-cyan-400 font-bold" : "text-slate-500 font-normal"}`}>
                          {total > 0 ? `${pct}%` : '—'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${total > 0 ? pct : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Badges Preview (Genuine Unlocked Badges) */}
            <div className="p-6 rounded-3xl bg-[#0f172a]/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Badges Earned ({dashboard.badgeSummary.earned} / {dashboard.badgeSummary.total})
                </h3>
                <button
                  onClick={() => navigate('/achievements')}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  View All →
                </button>
              </div>

              {dashboard.badgeSummary.earned === 0 ? (
                <div className="py-6 text-center text-slate-500 font-mono text-xs">
                  No badges earned yet. Complete challenges to earn your first badge.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 text-center">
                  {unlockedBadges.slice(0, 4).map(b => (
                    <div key={b.code} className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 flex flex-col items-center">
                      <span className="text-2xl mb-1">🏅</span>
                      <span className="text-[10px] font-mono text-slate-300 truncate w-full">{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {dashboard.badgeSummary.nearest && <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-3" aria-label="Nearest badge progress">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wide text-cyan-300">Nearest badge</div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{dashboard.badgeSummary.nearest.name}</span>
                  <span className="text-xs font-mono text-cyan-200">{dashboard.badgeSummary.nearest.progressLabel}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label={`${dashboard.badgeSummary.nearest.name} progress`} aria-valuemin={0} aria-valuemax={dashboard.badgeSummary.nearest.target} aria-valuenow={dashboard.badgeSummary.nearest.current}>
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${dashboard.badgeSummary.nearest.percentage}%` }} />
                </div>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
