import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Search } from 'lucide-react';
import { LeaderboardUser } from '../types';
import { api } from '../services/api';
import { filterLeaderboardUsers } from '../services/leaderboardSearch.js';

export const Leaderboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate: _navigate }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    api.getLeaderboard().then(data => {
      if (!active) return;
      setLeaderboard(data.leaderboard || []);
      setCurrentUser(data.currentUser || null);
      setTotalUsers(data.total || 0);
      setLoadError(null);
    }).catch(() => {
      if (active) setLoadError('All-Time Leaderboard could not be loaded. Check your connection and retry.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reloadKey]);

  const filtered = filterLeaderboardUsers(leaderboard, search);

  const top3 = leaderboard.slice(0, 3);
  const currentUserIsInTopN = currentUser ? leaderboard.some(user => user.id === currentUser.id) : false;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>All-Time Rankings</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              LEADERBOARD
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Ranked by total XP actually earned across completed challenges and badge rewards.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 px-4 py-3 text-xs font-mono text-cyan-200">ALL-TIME • {totalUsers} USER{totalUsers === 1 ? '' : 'S'}</div>
        </div>

        {loadError && <div role="alert" className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 text-sm">{loadError} <button className="underline ml-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" onClick={() => { setLoading(true); setReloadKey(key => key + 1); }}>Retry</button></div>}

        {loading ? <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-12 text-center text-sm text-slate-400" role="status" aria-live="polite">Loading all-time rankings…</div> : !loadError && totalUsers === 0 ? <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-12 text-center text-sm text-slate-400"><Trophy className="mx-auto mb-3 h-10 w-10 text-slate-600" /><p className="font-bold text-white">No leaderboard users yet</p></div> : null}

        {/* Dynamic Podium for Top Ranked Architects */}
        {!loading && !loadError && top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Rank 2 (Silver) */}
            {top3.length >= 2 ? (
              <div className="order-2 md:order-1 p-6 rounded-3xl bg-[#0f172a]/90 border border-slate-700/60 shadow-xl flex flex-col items-center text-center space-y-3 relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 text-black font-black text-xl flex items-center justify-center shadow-lg">
                  #2
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{top3[1].name}{top3[1].isCurrentUser ? ' (You)' : ''}</h3>
                  <p className="text-xs text-slate-400 font-mono">{top3[1].title}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-cyan-400 font-bold">Level {top3[1].level}</span>
                  <span className="text-cyan-300 font-bold">{top3[1].xp.toLocaleString()} XP</span>
                </div>
              </div>
            ) : (
              <div className="hidden md:block order-2 md:order-1" />
            )}

            {/* Rank 1 (Gold) */}
            {top3.length >= 1 && (
              <div className="order-1 md:order-2 p-8 rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-[#0f172a] border border-amber-500/50 shadow-glow-amber flex flex-col items-center text-center space-y-4 relative transform md:-translate-y-3">
                <Crown className="w-8 h-8 text-amber-400 animate-bounce" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-black font-black text-2xl flex items-center justify-center shadow-glow-amber">
                  #1
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{top3[0].name}{top3[0].isCurrentUser ? ' (You)' : ''}</h3>
                  <p className="text-xs text-amber-300 font-mono font-bold">{top3[0].title}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-cyan-400 font-bold">Level {top3[0].level}</span>
                  <span className="text-cyan-300 font-bold">{top3[0].xp.toLocaleString()} XP</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3.length >= 3 ? (
              <div className="order-3 md:order-3 p-6 rounded-3xl bg-[#0f172a]/90 border border-slate-700/60 shadow-xl flex flex-col items-center text-center space-y-3 relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
                  #3
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{top3[2].name}{top3[2].isCurrentUser ? ' (You)' : ''}</h3>
                  <p className="text-xs text-slate-400 font-mono">{top3[2].title}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-cyan-400 font-bold">Level {top3[2].level}</span>
                  <span className="text-cyan-300 font-bold">{top3[2].xp.toLocaleString()} XP</span>
                </div>
              </div>
            ) : (
              <div className="hidden md:block order-3 md:order-3" />
            )}
          </div>
        )}

        {/* Search & Full Table */}
        {!loading && !loadError && totalUsers > 0 && <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
              Top {leaderboard.length} Users ({totalUsers} total)
            </h3>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users..."
                aria-label="Search leaderboard users"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder:text-slate-500 focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {filtered.length === 0 && search ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs rounded-2xl border border-slate-800 bg-[#0f172a] space-y-2">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-white font-bold text-sm">No users match this search</p>
              <p className="text-slate-400">Try another name.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0f172a]">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-[#070b14] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">RANK</th>
                    <th className="p-3.5">USER</th>
                    <th className="p-3.5">LEVEL</th>
                    <th className="p-3.5 text-cyan-400">TOTAL XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {filtered.map(user => (
                    <tr key={user.id} className={`${user.isCurrentUser ? 'bg-cyan-950/40 ring-1 ring-inset ring-cyan-500/30' : ''} hover:bg-slate-900/60 transition-colors`}>
                      <td className="p-3.5 font-bold text-white">
                        #{user.rank}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-cyan-300 text-xs">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs leading-none">{user.name}{user.isCurrentUser ? ' (You)' : ''}</p>
                            <p className="text-[10px] text-slate-400 leading-none mt-1">{user.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                          Lvl {user.level}
                        </span>
                      </td>
                      <td className="p-3.5 text-cyan-300 font-bold">{user.xp.toLocaleString()} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>}
        {!loading && !loadError && currentUser && !currentUserIsInTopN && <section className="space-y-3" aria-labelledby="your-rank-heading">
          <h2 id="your-rank-heading" className="font-bold text-sm text-cyan-300 font-mono uppercase tracking-wider">Your Rank</h2>
          <div className="overflow-x-auto rounded-2xl border border-cyan-500/40 bg-cyan-950/20">
            <table className="w-full text-xs font-mono text-left"><thead className="sr-only"><tr><th>Rank</th><th>User</th><th>Level</th><th>Total XP</th></tr></thead>
              <tbody><tr className="text-slate-100"><td className="p-3.5 font-bold">#{currentUser.rank}</td><td className="p-3.5 font-bold">{currentUser.name} (You)</td><td className="p-3.5">Level {currentUser.level}</td><td className="p-3.5 font-bold text-cyan-300">{currentUser.xp.toLocaleString()} XP</td></tr></tbody>
            </table>
          </div>
        </section>}
      </div>
    </div>
  );
};
