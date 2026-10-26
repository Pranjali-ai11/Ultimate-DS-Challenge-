import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Bell,
  Lock,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export const SettingsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    setPasswordSubmitting(true);
    try {
      const result = await api.updatePassword(currentPassword, newPassword);
      setPasswordMessage(result.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Password could not be updated. Please try again.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold mb-2">
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Preferences & System Config</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ACCOUNT SETTINGS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure UI themes, telemetry options, audio cues, and account security.
          </p>
        </div>

        {/* Theme & Display */}
        <div className="p-6 rounded-3xl bg-[#0f172a]/90 border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
            Appearance & Visual Theme
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-cyan-400" />}
              </div>
              <div>
                <p className="font-bold text-white text-xs">Current Theme: {theme === 'dark' ? 'Obsidian Dark (Cyberpunk Game)' : 'Light Theme'}</p>
                <p className="text-[11px] text-slate-400">Toggle between immersive dark game styling and accessible clean light styling.</p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan"
            >
              Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        {/* Audio & Feedback */}
        <div className="p-6 rounded-3xl bg-[#0f172a]/90 border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
            Audio & Alert Demo Controls
          </h3>
          <p className="text-xs text-slate-400">These switches change their display state for this page only. Audio playback and browser notifications are not connected.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                  {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                </div>
                <div>
                  <p className="font-bold text-white text-xs">Sound Effects & Haptic Cues</p>
                  <p className="text-[11px] text-slate-400">Play celebratory sounds on level unlock, badge award, and quiz completion.</p>
                </div>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  soundEnabled
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs">Architectural Challenge Alerts</p>
                  <p className="text-[11px] text-slate-400">Notify when new flagship missions and weekly leaderboard updates occur.</p>
                </div>
              </div>

              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  notificationsEnabled
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Security / Password Form */}
        <div className="p-6 rounded-3xl bg-[#0f172a]/90 border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Security & Authentication
          </h3>

          <form onSubmit={handlePasswordReset} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="current-password" className="text-xs font-mono text-slate-400 block mb-1">Current Password</label>
              <input
                id="current-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={event => setCurrentPassword(event.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="text-xs font-mono text-slate-400 block mb-1">New Password</label>
              <input
                id="new-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
                maxLength={200}
                required
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2">
              {passwordMessage ? (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {passwordMessage}
                </span>
              ) : passwordError ? (
                <span role="alert" className="text-xs font-mono text-rose-300">{passwordError}</span>
              ) : (
                <span className="text-[11px] font-mono text-slate-500">
                  New password must be 8 to 200 characters.
                </span>
              )}

              <button
                type="submit"
                disabled={passwordSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
              >
                {passwordSubmitting ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Sign Out Card */}
        <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-rose-300">End Active Session</h4>
            <p className="text-xs text-slate-400">Sign out of this workstation. Your progress is saved in the database.</p>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
