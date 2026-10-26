import React, { useState } from 'react';
import {
  Mail,
  Award,
  Zap,
  Flame,
  Trophy,
  Shield,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const ProfilePage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user, progress, achievements, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [title, setTitle] = useState(user?.title || '');
  const [message, setMessage] = useState<string | null>(null);
  const unlockedAchievements = achievements.filter(achievement => achievement.unlocked);
  const memberSince = user?.createdAt && !Number.isNaN(Date.parse(user.createdAt))
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : 'Date unavailable';

  const handleSave = async () => {
    try {
      await api.updateProfile({ name, bio, title });
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      await refreshUser();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('Failed to update profile.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Profile Card Header */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-[#0f172a] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-mono font-black text-3xl shadow-glow-cyan border-2 border-white/20">
              {(user?.name || 'Alex').charAt(0)}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    {user?.name || 'Architect'}
                  </h1>
                  <p className="text-xs font-mono text-cyan-400 font-bold mt-0.5">
                    {user?.title || 'Novice Architect'} • Level {progress?.level ?? 1}
                  </p>
                </div>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 self-center sm:self-start"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {user?.bio || 'No bio added yet.'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  {user?.email || 'alex@example.com'}
                </span>
                <span>•</span>
                <span>Member since {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Architect Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Bio</label>
                <input
                  type="text"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-black shadow-glow-cyan"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs font-mono text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-cyan-500/20">
            <span className="text-[10px] font-mono text-slate-400">TOTAL EXPERIENCE</span>
            <div className="text-2xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              {progress?.xp ?? 0} XP
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-amber-500/20">
            <span className="text-[10px] font-mono text-slate-400">ACTIVE STREAK</span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              {progress?.streak || 6} Days
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-indigo-500/20">
            <span className="text-[10px] font-mono text-slate-400">TOTAL SCORE</span>
            <div className="text-2xl font-black text-indigo-300 font-mono mt-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-indigo-400" />
              {progress?.score ?? 0}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-emerald-500/20">
            <span className="text-[10px] font-mono text-slate-400">SOLVED MISSIONS</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              {progress?.completedChallenges ?? 0}
            </div>
          </div>
        </div>

        {/* Unlocked Badges Showcase */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0f172a]/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Architect Badges
              </h3>
              <p className="text-xs text-slate-400">Unlocked achievements and honors</p>
            </div>
            <button
              onClick={() => navigate('/achievements')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold"
            >
              View All →
            </button>
          </div>

          {unlockedAchievements.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono text-xs">
              {unlockedAchievements.slice(0, 4).map(achievement => (
                <div key={achievement.id} className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 flex flex-col items-center">
                  <span className="font-bold text-white">{achievement.name}</span>
                  <span className="text-[10px] text-cyan-400">+{achievement.xpBonus} XP</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No badges unlocked yet. Complete a challenge to earn your first one.</p>
          )}
        </div>
      </div>
    </div>
  );
};
