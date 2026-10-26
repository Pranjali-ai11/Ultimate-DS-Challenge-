import { summarizeUserProgress } from './progressRules.js';

export interface LeaderboardAttempt {
  challengeId: string;
  status: string;
}

export interface LeaderboardUserInput {
  id: string;
  name: string;
  avatar: string;
  title: string;
  createdAt: Date | string;
  completionRewards: Array<{ completedAt: Date | string; rewardXp: number }>;
  badgeRewards: Array<{ unlockedAt: Date | string; xpBonus: number }>;
  attempts: LeaderboardAttempt[];
}

export interface LeaderboardChallenge {
  id: string;
  level: number;
}

export interface RankedLeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  title: string;
  level: number;
  xp: number;
  completedChallenges: number;
}

function timestamp(value: Date | string): number {
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

/** All-time leaderboard ranks by the same recorded completion and badge XP as /progress. */
export function rankLeaderboardUsers(
  users: LeaderboardUserInput[],
  challenges: LeaderboardChallenge[],
  calculateAllTimeXp: (completionRewards: LeaderboardUserInput['completionRewards'], badgeRewards: LeaderboardUserInput['badgeRewards']) => number
): RankedLeaderboardUser[] {
  const knownChallengeIds = new Set(challenges.map(challenge => challenge.id));
  return users.map(user => {
    const passedIds = new Set(user.attempts
      .filter(attempt => attempt.status === 'passed' && knownChallengeIds.has(attempt.challengeId))
      .map(attempt => attempt.challengeId));
    const progress = summarizeUserProgress(challenges, passedIds);
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar || 'avatar-1',
      title: user.title || 'Learner',
      level: progress.unlockedLevel,
      xp: calculateAllTimeXp(user.completionRewards, user.badgeRewards),
      completedChallenges: progress.completedChallenges,
      createdAt: timestamp(user.createdAt)
    };
  }).sort((a, b) => b.xp - a.xp || a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    .map(({ createdAt: _createdAt, ...user }, index) => ({ ...user, rank: index + 1 }));
}

export function selectLeaderboardWindow<T extends RankedLeaderboardUser>(
  rankedUsers: T[],
  currentUserId: string,
  limit = 20
): { leaderboard: T[]; currentUser: T | null; total: number } {
  const topLimit = Number.isInteger(limit) && limit > 0 ? limit : 20;
  return {
    leaderboard: rankedUsers.slice(0, topLimit),
    currentUser: rankedUsers.find(user => user.id === currentUserId) ?? null,
    total: rankedUsers.length
  };
}
