import { Response } from 'express';
import { prisma } from '../db/index.js';
import { databaseFailure } from '../db/httpErrors.js';
import { AuthRequest } from '../middleware/auth.js';
import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_DEFINITION_BY_CODE } from '../data/achievementDefinitions.js';
import { getChallenges } from '../db/catalog.js';
import { calculateAchievementProgress } from '../engine/achievementRules.js';

export async function getAllAchievements(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ success: false, message: 'Authentication required.' }); return; }
  try {
    const [all, unlocked, attempts, progress, challenges] = await Promise.all([
      prisma.achievement.findMany({ orderBy: { code: 'asc' } }),
      prisma.userAchievement.findMany({ where: { user_id: userId }, select: { achievement_id: true, unlocked_at: true } }),
      prisma.challengeAttempt.findMany({ where: { user_id: userId }, select: { challenge_id: true, status: true, score: true } }),
      prisma.userProgress.findUnique({ where: { user_id: userId }, select: { streak: true } }),
      getChallenges()
    ]);
    const unlockedByCode = new Map(unlocked.map(item => [item.achievement_id, item.unlocked_at]));
    const earnedCodes = new Set(unlockedByCode.keys());
    const states = calculateAchievementProgress({
      definitions: ACHIEVEMENT_DEFINITIONS,
      challenges: challenges.map(challenge => ({ id: challenge.id, level: challenge.level, coverageTopics: challenge.coverageTopics })),
      attempts,
      streak: progress?.streak || 0,
      earnedCodes
    });
    const stateByCode = new Map(states.map(state => [state.code, state]));
    const achievements = all.map(item => {
      const state = stateByCode.get(item.code);
      const earned = unlockedByCode.has(item.code);
      return {
        id: item.code, code: item.code, name: item.name, title: item.name,
        description: item.description, icon: item.icon, requirement: item.requirement,
        category: ACHIEVEMENT_DEFINITION_BY_CODE.get(item.code)?.category || 'Milestone',
        topic: state?.topic, target: state?.target,
        xpBonus: item.xp_bonus, xpReward: item.xp_bonus,
        unlocked: earned, earned, unlockedAt: unlockedByCode.get(item.code)?.toISOString(),
        progressCurrent: state?.current, progressTarget: state?.target,
        progressPercent: state?.percent, progressType: state?.progressType || 'status',
        progressLabel: state?.progressLabel || (earned ? 'Requirement met' : 'Progress unavailable'),
        eligible: state?.eligible || earned, awardPending: Boolean(state?.eligible && !earned),
        almostEarned: state?.almostEarned || false
      };
    });
    const unlockedCount = new Set(achievements.filter(item => item.earned).map(item => item.code)).size;
    res.json({ success: true, total: achievements.length, unlockedCount, earnedCount: unlockedCount, achievements });
  } catch (error) { databaseFailure(res, 'achievement lookup', error, 'Failed to fetch achievements.'); }
}
