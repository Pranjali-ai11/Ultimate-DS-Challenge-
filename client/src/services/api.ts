import {
  Challenge,
  User,
  UserProgress,
  Achievement,
  LeaderboardUser,
  LevelQuizResult,
  ProgressionSummary,
  DashboardProgressSummary,
  SavedSubmissionReview
} from '../types';
import { CourseTopic, CourseUnit, LearningGuide, TopicRegistryEntry } from '../types/learning';

const API_BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('udsc_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestApi(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init);
  } catch {
    throw new Error('The service is unavailable. Please try again later.');
  }
}

async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    if (!res.ok) {
      throw new Error('The service is unavailable. Please try again later.');
    }
    throw new Error('The server returned an invalid response. Please try again.');
  }
}
export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; token: string; user: User; progress: UserProgress; message?: string }> {
    const res = await requestApi(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Login failed');
    if (data.token) {
      localStorage.setItem('udsc_token', data.token);
    }
    return data;
  },

  async register(name: string, email: string, password: string): Promise<{ success: boolean; token: string; user: User; progress: UserProgress; message?: string }> {
    const res = await requestApi(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    if (data.token) {
      localStorage.setItem('udsc_token', data.token);
    }
    return data;
  },

  async getMe(): Promise<{ user: User; progress: UserProgress; achievements: Achievement[] }> {
    const res = await requestApi(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeader()
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to fetch current user');
    return data;
  },

  async updateProfile(profile: Partial<User>): Promise<{ user: User; message: string }> {
    const res = await requestApi(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(profile)
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to update profile');
    return data;
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await requestApi(`${API_BASE_URL}/auth/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to update password');
    return data;
  },

  async resetPassword(email: string, currentPassword: string, newPassword: string, confirmNewPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await requestApi(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, currentPassword, newPassword, confirmNewPassword })
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to update password');
    return data;
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeader()
    });
  },

  // Challenges
  async getChallenges(params?: { level?: number; difficulty?: string; category?: string; topic?: string }): Promise<{ challenges: Challenge[]; total: number; progression: ProgressionSummary }> {
    const query = new URLSearchParams();
    if (params?.level) query.append('level', params.level.toString());
    if (params?.difficulty) query.append('difficulty', params.difficulty);
    if (params?.category) query.append('category', params.category);
    if (params?.topic) query.append('topic', params.topic);

    const res = await requestApi(`${API_BASE_URL}/challenges?${query.toString()}`);
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to fetch challenges');
    return data;
  },

  async getChallengeById(id: string): Promise<{ challenge: Challenge }> {
    const res = await requestApi(`${API_BASE_URL}/challenges/${id}`);
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to load challenge');
    return data;
  },

  async submitLevelQuiz(level: number, answers: Record<string, string | string[]>, submissionId: string = window.crypto.randomUUID()): Promise<LevelQuizResult> {
    const res = await requestApi(`${API_BASE_URL}/challenges/level/${level}/quiz-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ answers, submissionId })
    });
    const data = await readJson(res);
    if (!res.ok) {
      const error = new Error(data.message || 'Failed to submit quiz') as Error & { submissionId?: string };
      if (data.code === 'SUBMISSION_ALREADY_PROCESSED' && typeof data.submissionId === 'string') error.submissionId = data.submissionId;
      throw error;
    }
    return data;
  },

  async getSavedSubmission(id: string): Promise<SavedSubmissionReview> {
    const res = await requestApi(`${API_BASE_URL}/results/${encodeURIComponent(id)}`, { headers: getAuthHeader() });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to load saved results');
    return data;
  },

  // Progress
  async getProgress(): Promise<{ progress: UserProgress; practiceExposure: Record<string, { passed: number; total: number; percentage: number }>; recentActivity: any[]; completedChallengesByLevel: Record<number, number>; progression: ProgressionSummary; dashboard: DashboardProgressSummary }> {
    const res = await requestApi(`${API_BASE_URL}/progress`, {
      headers: getAuthHeader()
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to load progress');
    return data;
  },

  // Leaderboard
  async getLeaderboard(): Promise<{ leaderboard: LeaderboardUser[]; currentUser: LeaderboardUser | null; total: number; limit: number }> {
    const res = await requestApi(`${API_BASE_URL}/leaderboard`, { headers: getAuthHeader() });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to fetch leaderboard');
    return data;
  },

  // Achievements
  async getAchievements(): Promise<{ achievements: Achievement[]; total: number; unlockedCount: number; earnedCount: number }> {
    const res = await requestApi(`${API_BASE_URL}/achievements`, {
      headers: getAuthHeader()
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to fetch achievements');
    return data;
  },

  // Learn
  async getLearnCatalog(): Promise<{ structures: Array<{ id: string; learningGuide: LearningGuide } & Record<string, any>>; total: number; courseTopics: CourseTopic[]; courseUnits?: CourseUnit[]; topicRegistry: TopicRegistryEntry[] }> {
    const res = await requestApi(`${API_BASE_URL}/learn`);
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to fetch catalog');
    return data;
  },

  async getStructureDetail(id: string): Promise<{ structure: any }> {
    const res = await requestApi(`${API_BASE_URL}/learn/${id}`);
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to fetch structure details');
    return data;
  }
};
