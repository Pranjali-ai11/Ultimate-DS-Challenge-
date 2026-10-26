import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface AuthPageProps {
  mode: 'login' | 'register' | 'forgot-password';
  navigate: (path: string) => void;
}

export const AuthPages: React.FC<AuthPageProps> = ({ mode, navigate }) => {
  const { login, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showRecoveryPasswords, setShowRecoveryPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/dashboard');
      } else if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        await register(name, email, password);
        navigate('/dashboard');
      } else if (mode === 'forgot-password') {
        if (!email.trim()) throw new Error('Enter your registered email address.');
        if (!currentPassword) throw new Error('Enter your current password to verify this account.');
        if (!newPassword) throw new Error('Enter a new password.');
        if (newPassword.length < 8 || newPassword.length > 200) throw new Error('New password must be between 8 and 200 characters.');
        if (!confirmNewPassword) throw new Error('Confirm your new password.');
        if (newPassword !== confirmNewPassword) throw new Error('The new passwords do not match.');
        if (newPassword === currentPassword) throw new Error('Choose a new password different from your current password.');
        const result = await api.resetPassword(email, currentPassword, newPassword, confirmNewPassword);
        setSuccessMsg(result.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[250px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-mono font-bold text-white shadow-glow-cyan text-base">
              DS
            </div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              ULTIMATE <span className="text-cyan-400">DS</span> CHALLENGE
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mt-3">
            {mode === 'login' && 'Sign in to Terminal'}
            {mode === 'register' && 'Architect Enrollment'}
            {mode === 'forgot-password' && 'Password Recovery'}
          </h2>

          <p className="text-xs text-slate-400 font-mono">
            {mode === 'login' && 'Authentication is required. Enter your credentials to access challenges.'}
            {mode === 'register' && 'Create your account to unlock levels, XP, and badges.'}
            {mode === 'forgot-password' && 'Verify with your current password, then choose a new one.'}
          </p>
        </div>

        {/* Auth Form Card - Clean, Secure, No Demo Access */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0f172a]/95 border border-cyan-500/30 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="text-xs font-mono text-slate-300 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    placeholder="e.g. Pranjali Deshpande"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-500 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="text-xs font-mono text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); setSuccessMsg(null); }}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-500 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="auth-password" className="text-xs font-mono text-slate-300">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-500 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            )}

            {mode === 'forgot-password' && (
              <>
                <p className="text-xs leading-relaxed text-amber-200/90" role="note">
                  For your security, this form requires your current password. If you have forgotten it, contact the site administrator; verified email recovery is not configured.
                </p>
                <div>
                  <label htmlFor="recovery-current-password" className="text-xs font-mono text-slate-300 block mb-1">Current Password (verification)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="recovery-current-password"
                      type={showRecoveryPasswords ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={e => { setCurrentPassword(e.target.value); setError(null); setSuccessMsg(null); }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="recovery-new-password" className="text-xs font-mono text-slate-300 block mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="recovery-new-password"
                      type={showRecoveryPasswords ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={200}
                      required
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(null); setSuccessMsg(null); }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Use 8–200 characters.</p>
                </div>
                <div>
                  <label htmlFor="recovery-confirm-password" className="text-xs font-mono text-slate-300 block mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="recovery-confirm-password"
                      type={showRecoveryPasswords ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={200}
                      required
                      value={confirmNewPassword}
                      onChange={e => { setConfirmNewPassword(e.target.value); setError(null); setSuccessMsg(null); }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  aria-pressed={showRecoveryPasswords}
                  onClick={() => setShowRecoveryPasswords(value => !value)}
                  className="inline-flex items-center gap-2 text-xs font-mono text-cyan-300 hover:text-cyan-200"
                >
                  {showRecoveryPasswords ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  {showRecoveryPasswords ? 'Hide passwords' : 'Show passwords'}
                </button>
              </>
            )}

            {error && (
              <div role="alert" className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-xs font-mono text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div role="status" className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs font-mono text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-bold font-mono text-xs bg-cyan-400 hover:bg-cyan-300 text-black shadow-glow-cyan flex items-center justify-center gap-2 transition-all mt-2"
            >
              <span>
                {mode === 'login' && 'SIGN IN TO TERMINAL'}
                {mode === 'register' && 'INITIALIZE ARCHITECT ACCOUNT'}
                {mode === 'forgot-password' && 'UPDATE PASSWORD'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs font-mono text-slate-400">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-cyan-400 hover:text-cyan-300 font-bold underline ml-1"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-cyan-400 hover:text-cyan-300 font-bold underline ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
