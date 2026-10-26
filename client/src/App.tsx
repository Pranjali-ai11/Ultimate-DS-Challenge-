import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Route pages are split so users download only the page they open.
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const LevelSelection = lazy(() => import('./pages/LevelSelection').then(module => ({ default: module.LevelSelection })));
const ChallengesHub = lazy(() => import('./pages/ChallengesHub').then(module => ({ default: module.ChallengesHub })));
const ResultsPage = lazy(() => import('./pages/ResultsPage').then(module => ({ default: module.ResultsPage })));
const ChallengeDetail = lazy(() => import('./pages/ChallengeDetail').then(module => ({ default: module.ChallengeDetail })));
const LearnHub = lazy(() => import('./pages/LearnHub').then(module => ({ default: module.LearnHub })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(module => ({ default: module.Leaderboard })));
const AchievementsView = lazy(() => import('./pages/AchievementsView').then(module => ({ default: module.AchievementsView })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
const AuthPages = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.AuthPages })));

const RouteLoadingFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center bg-[#070b14] text-slate-400 font-mono text-sm" role="status" aria-live="polite">
    Loading page…
  </div>
);

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return `${window.location.pathname || '/'}${window.location.search}${window.location.hash}`;
  });

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(`${window.location.pathname || '/'}${window.location.search}${window.location.hash}`);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentPath.split('?')[0] !== '/design') return;
    const challengeId = new URLSearchParams(window.location.search).get('challengeId');
    navigate(challengeId ? `/challenges/${encodeURIComponent(challengeId)}` : '/challenges?level=3');
  }, [currentPath, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 font-mono text-sm">
        Initializing terminal environment...
      </div>
    );
  }

  // Strict route authentication checker
  const protectedRoutes = [
    '/dashboard',
    '/levels',
    '/challenges',
    '/results',
    '/design',
    '/profile',
    '/settings',
    '/achievements',
    '/leaderboard'
  ];

  const path = currentPath.split('?')[0].split('#')[0];
  const isProtected = protectedRoutes.some(r => path === r || path.startsWith('/challenges/') || path.startsWith('/results/'));

  // If user is not logged in and attempts to access protected page, route to login
  if (!user && isProtected) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans">
        <Navbar currentPath="/login" navigate={navigate} />
        <main className="flex-1">
          <Suspense fallback={<RouteLoadingFallback />}><AuthPages mode="login" navigate={navigate} /></Suspense>
        </main>
        <Footer navigate={navigate} />
      </div>
    );
  }

  // Render current route
  const renderCurrentRoute = () => {
    // Public / Landing
    if (path === '/') {
      return <LandingPage navigate={navigate} />;
    }

    // Auth
    if (path === '/login') {
      return <AuthPages mode="login" navigate={navigate} />;
    }
    if (path === '/register') {
      return <AuthPages mode="register" navigate={navigate} />;
    }
    if (path === '/forgot-password') {
      return <AuthPages mode="forgot-password" navigate={navigate} />;
    }

    // Learn Hub: /learn
    if (path === '/learn') {
      return <LearnHub navigate={navigate} />;
    }

    // Protected Routes (Only accessible when user is logged in)
    if (path === '/dashboard') {
      return <Dashboard navigate={navigate} />;
    }
    if (path === '/levels') {
      return <LevelSelection navigate={navigate} />;
    }
    if (path === '/challenges') {
      const urlParams = new URLSearchParams(window.location.search);
      const lvl = urlParams.get('level') ? parseInt(urlParams.get('level')!, 10) : undefined;
      return <ChallengesHub navigate={navigate} initialLevel={lvl} initialTopic={urlParams.get('topic') || undefined} />;
    }
    if (path.startsWith('/results/')) {
      let resultId = path.slice('/results/'.length);
      try { resultId = decodeURIComponent(resultId); } catch { resultId = ''; }
      return <ResultsPage resultId={resultId} navigate={navigate} />;
    }
    if (path.startsWith('/challenges/')) {
      const parts = path.split('/');
      const challengeId = parts[2];
      return <ChallengeDetail challengeId={challengeId} navigate={navigate} />;
    }
    if (path === '/leaderboard') {
      return <Leaderboard navigate={navigate} />;
    }
    if (path === '/achievements') {
      return <AchievementsView navigate={navigate} />;
    }
    if (path === '/profile') {
      return <ProfilePage navigate={navigate} />;
    }
    if (path === '/settings') {
      return <SettingsPage navigate={navigate} />;
    }

    // Fallback
    return <LandingPage navigate={navigate} />;
  };

  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(path);

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans">
      {!isAuthPage && <Navbar currentPath={currentPath} navigate={navigate} />}
      <main className="flex-1"><Suspense fallback={<RouteLoadingFallback />}>{renderCurrentRoute()}</Suspense></main>
      {!isAuthPage && <Footer navigate={navigate} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
