import { Response } from 'express';
import { prisma } from '../db/index.js';
import { databaseFailure } from '../db/httpErrors.js';
import { getChallenges } from '../db/catalog.js';
import type { AuthRequest } from '../middleware/auth.js';
import { calculateAllTimeXp } from '../engine/xpAccounting.js';
import { rankLeaderboardUsers, selectLeaderboardWindow } from '../engine/leaderboardRanking.js';

export const LEADERBOARD_LIMIT = 20;

export function isAllTimeLeaderboardRequest(timeframe: unknown): boolean {
  return timeframe === undefined || timeframe === 'all-time';
}

export async function getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ success: false, message: 'Authentication required.' }); return; }
  if (!isAllTimeLeaderboardRequest(req.query.timeframe)) {
    res.status(400).json({ success: false, message: 'Only the all-time leaderboard is available.' });
    return;
  }
  try {
    const challenges = await getChallenges();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        title: true,
        created_at: true,
        completions: { select: { completed_at: true, challenge: { select: { reward_xp: true } } } },
        achievements: { select: { unlocked_at: true, achievement: { select: { xp_bonus: true } } } },
        attempts: { select: { challenge_id: true, status: true } }
      },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }]
    });
    const ranked = rankLeaderboardUsers(users.map(user => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      title: user.title,
      createdAt: user.created_at,
      completionRewards: user.completions.map(item => ({ completedAt: item.completed_at, rewardXp: item.challenge.reward_xp })),
      badgeRewards: user.achievements.map(item => ({ unlockedAt: item.unlocked_at, xpBonus: item.achievement.xp_bonus })),
      attempts: user.attempts.map(attempt => ({ challengeId: attempt.challenge_id, status: attempt.status }))
    })), challenges.map(challenge => ({ id: challenge.id, level: challenge.level })), calculateAllTimeXp);
    const window = selectLeaderboardWindow(ranked, userId, LEADERBOARD_LIMIT);
    const leaderboard = window.leaderboard.map(user => ({ ...user, isCurrentUser: user.id === userId }));
    const currentUser = window.currentUser ? { ...window.currentUser, isCurrentUser: true } : null;
    res.json({ success: true, timeframe: 'all-time', total: window.total, limit: LEADERBOARD_LIMIT, leaderboard, currentUser });
  } catch (error) { databaseFailure(res, 'leaderboard lookup', error, 'Failed to fetch leaderboard.'); }
}
