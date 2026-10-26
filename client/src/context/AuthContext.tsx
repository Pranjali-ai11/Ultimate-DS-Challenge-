import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserProgress, Achievement } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  progress: UserProgress | null;
  achievements: Achievement[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  demoLogin: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProgress: (newProgress: Partial<UserProgress>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const syncAuthoritativeProgress = useCallback(async (fallback: UserProgress) => {
    try {
      const data = await api.getProgress();
      setProgress(data.progress);
    } catch {
      setProgress(fallback);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('udsc_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      setAchievements(data.achievements || []);
      await syncAuthoritativeProgress(data.progress);
    } catch (err) {
      console.warn('Could not restore session, clearing token:', err);
      localStorage.removeItem('udsc_token');
      setUser(null);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [syncAuthoritativeProgress]);

  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    setProgress(res.progress);
    void syncAuthoritativeProgress(res.progress);
    void api.getMe().then(data => setAchievements(data.achievements || [])).catch(() => setAchievements([]));
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await api.register(name, email, pass);
    setUser(res.user);
    setProgress(res.progress);
    void syncAuthoritativeProgress(res.progress);
    void api.getMe().then(data => setAchievements(data.achievements || [])).catch(() => setAchievements([]));
  };

  const demoLogin = async () => {
    await login('alex@example.com', 'password123');
  };

  const logout = () => {
    void api.logout().catch(() => undefined);
    localStorage.removeItem('udsc_token');
    setUser(null);
    setProgress(null);
    setAchievements([]);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const updateUserProgress = useCallback((newProgress: Partial<UserProgress>) => {
    setProgress(prev => (prev ? { ...prev, ...newProgress } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        progress,
        achievements,
        loading,
        login,
        register,
        logout,
        demoLogin,
        refreshUser,
        updateUserProgress
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
