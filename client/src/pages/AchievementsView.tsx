import React, { useState, useEffect } from 'react';
import {
  Award,
  Lock,
  CheckCircle2,
  Sparkles,
  Zap,
  Flame,
  Layers,
  Clock,
  GitBranch,
  Network,
  Hash,
  Boxes,
  Crown,
  ArrowLeftRight,
  ListOrdered
} from 'lucide-react';
import { Achievement } from '../types';
import { api } from '../services/api';

export const AchievementsView: React.FC<{ navigate: (path: string) => void }> = ({ navigate: _navigate }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const iconMap: Record<string, any> = {
    Sparkles,
    Layers,
    Clock,
    GitBranch,
    Network,
    Hash,
    Boxes,
    Crown,
    Zap,
    Flame,
    ArrowLeftRight,
    ListOrdered
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAchievements();
        setAchievements(data.achievements || []);
      } catch {
        setLoadError('Achievements could not be loaded. Check your connection and retry.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const total = achievements.length;
  const earnedCount = new Set(achievements.filter(achievement => achievement.earned ?? achievement.unlocked).map(achievement => achievement.code)).size;
  const progressPercent = total ? Math.min(100, Math.round((earnedCount / total) * 100)) : 0;
  const almostEarned = achievements.filter(achievement => !achievement.earned && achievement.almostEarned);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Architectural Badges</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              MEDALS & ACHIEVEMENTS
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Unlock architectural honors by mastering specific data structures, conquering hybrid challenges, and maintaining consistency.
            </p>
          </div>

          {/* Progress Pill */}
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 min-w-[220px] font-mono text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400">Total Unlocked</span>
              <span className="text-amber-400 font-bold">{earnedCount} / {total}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {loadError && <div role="alert" className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 text-sm">{loadError} <button className="underline ml-2" onClick={() => window.location.reload()}>Retry</button></div>}

        {almostEarned.length > 0 && (
          <section aria-labelledby="almost-earned-heading" className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/25">
            <h2 id="almost-earned-heading" className="text-sm font-bold text-cyan-200">Almost earned</h2>
            <p className="text-xs text-slate-400 mt-1">These locked badges are one qualifying step from their target.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {almostEarned.map(achievement => (
                <span key={achievement.code} className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-2 text-xs text-cyan-100">
                  {achievement.name} <strong className="ml-1">{achievement.progressLabel}</strong>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Badges Grid */}
        {loading ? <p className="text-sm text-slate-400">Loading achievements…</p> : achievements.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6 text-sm text-slate-400">No badge definitions are currently available.</div>
        ) : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map(ach => {
            const Icon = iconMap[ach.icon] || Award;
            const isUnlocked = ach.earned ?? ach.unlocked;

            return (
              <div
                key={ach.code}
                className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-[#0f172a]/90 border-amber-500/30 shadow-glow-amber'
                    : 'bg-[#0b101c]/50 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md ${
                        isUnlocked
                          ? 'bg-amber-950/80 border-amber-400 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isUnlocked
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      +{ach.xpBonus} XP
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                      {ach.name}
                      {isUnlocked && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>
                  {ach.progressType === 'count' && ach.progressTarget !== undefined && !isUnlocked ? (
                    <div aria-label={`${ach.name} progress`} className="pt-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
                        <span>{ach.progressLabel}</span>
                        {ach.awardPending && <span className="text-cyan-300">Eligible</span>}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-cyan-400 transition-[width]" style={{ width: `${Math.min(100, ach.progressPercent || 0)}%` }} />
                      </div>
                      {ach.awardPending && <p className="mt-2 text-[10px] text-cyan-200">Award is recorded after your next quiz submission.</p>}
                    </div>
                  ) : ach.progressType === 'status' && !isUnlocked ? (
                    <p className="text-[11px] text-slate-400">{ach.progressLabel}{ach.awardPending ? ' · eligible for award on your next quiz submission' : ''}</p>
                  ) : null}
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-4 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-slate-400">
                    Criteria: <strong>{ach.requirement}</strong>
                  </span>
                  {isUnlocked ? (
                    <span className="text-emerald-400 font-bold">UNLOCKED</span>
                  ) : ach.awardPending ? (
                    <span className="text-cyan-300 font-bold">ELIGIBLE</span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
};
