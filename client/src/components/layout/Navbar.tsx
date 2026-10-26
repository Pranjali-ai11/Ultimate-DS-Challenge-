import React, { useState } from 'react';
import {
  Compass,
  BookOpen,
  Target,
  Layers,
  Trophy,
  Award,
  Flame,
  Zap,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, progress, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/', icon: Compass, public: true },
    { label: 'Dashboard', path: '/dashboard', icon: Sparkles, authRequired: true },
    { label: 'Learn Hub', path: '/learn', icon: BookOpen, public: true },
    { label: 'Levels', path: '/levels', icon: Layers, authRequired: true },
    { label: 'Challenges', path: '/challenges', icon: Target, authRequired: true },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy, authRequired: true },
    { label: 'Badges', path: '/achievements', icon: Award, authRequired: true },
  ];

  const handleNav = (path: string, authRequired: boolean = false) => {
    if (authRequired && !user) {
      navigate('/login');
    } else {
      navigate(path);
    }
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/95 backdrop-blur-xl border-b border-cyan-500/20 text-slate-100 shadow-xl">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Brand Logo - Perfectly centered vertically */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-400 to-indigo-500 flex items-center justify-center p-[2px] shadow-glow-cyan shrink-0 transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#070b14] rounded-[9px] flex items-center justify-center">
                <span className="font-mono font-extrabold text-cyan-400 text-base tracking-wider">DS</span>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-xs sm:text-lg text-white group-hover:text-cyan-400 transition-colors whitespace-nowrap leading-none">
                  <span className="hidden sm:inline">ULTIMATE </span><span className="text-cyan-400">DS</span><span className="hidden sm:inline"> CHALLENGE</span>
                </span>
                <span className="hidden 2xl:inline-block px-1.5 py-0.5 text-[9px] uppercase font-mono font-bold tracking-widest bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 rounded">
                  v2.0
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 font-mono tracking-tight whitespace-nowrap leading-none mt-1">
                Can You Design the Impossible?
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links - Compact, centered, no wrapping */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path, link.authRequired)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glow-cyan'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {!user && link.authRequired && (
                    <Lock className="w-3 h-3 text-slate-500 ml-0.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Section: Stats, Theme, User Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Gamification Stats (When Logged In) */}
            {user && progress && (
              <div className="hidden xl:flex items-center gap-1.5 font-mono text-xs">
                {/* Streak */}
                <div
                  className="h-9 flex items-center gap-1 px-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl"
                  title="Daily Streak"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-bold">{progress.streak}d</span>
                </div>

                {/* XP */}
                <div
                  className="h-9 flex items-center gap-1 px-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-xl"
                  title="Total XP"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-bold">{progress.xp} XP</span>
                </div>

                {/* Level Badge */}
                <div
                  className="h-9 flex items-center gap-1 px-2.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-xl"
                  title="Architect Level"
                >
                  <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Lvl</span>
                  <span className="font-extrabold">{progress.level}</span>
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/60 shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Profile or Login Buttons */}
            {user ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="h-9 flex items-center gap-2 px-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 transition-all text-left"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block pr-1">
                    <p className="text-xs font-semibold leading-none text-white max-w-[110px] truncate">{user.name}</p>
                    <p className="text-[9px] text-cyan-400 font-mono leading-none mt-0.5 max-w-[110px] truncate">{user.title || 'Architect'}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#0d1424] border border-cyan-500/30 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2.5 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>

                    <button
                      onClick={() => handleNav('/dashboard', true)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>My Dashboard</span>
                    </button>

                    <button
                      onClick={() => handleNav('/profile', true)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70"
                    >
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => handleNav('/achievements', true)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Badges & Achievements</span>
                    </button>

                    <button
                      onClick={() => handleNav('/settings', true)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Settings</span>
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-950/40 font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-700/60"
                >
                  Sign In
                </button>

                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-glow-cyan transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors border border-slate-800"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-primary-navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <nav id="mobile-primary-navigation" aria-label="Mobile primary navigation" className="lg:hidden border-t border-slate-800 bg-[#070b14]/98 px-4 pt-3 pb-6 space-y-2 backdrop-blur-2xl">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path, link.authRequired)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{link.label}</span>
                </div>
                {!user && link.authRequired && (
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Sign in required
                  </span>
                )}
              </button>
            );
          })}
          {!user && (
            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 text-center text-xs font-semibold rounded-xl bg-slate-800 text-white"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  navigate('/register');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 text-center text-xs font-bold rounded-xl bg-cyan-600 text-white shadow-glow-cyan"
              >
                Sign Up
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};
