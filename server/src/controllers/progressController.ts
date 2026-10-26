import { Response } from 'express';
import { prisma } from '../db/index.js';
import { databaseFailure } from '../db/httpErrors.js';
import { getChallenges } from '../db/catalog.js';
import { AuthRequest } from '../middleware/auth.js';
import { summarizeProgression, summarizeUserProgress } from '../engine/progressRules.js';
import { calculateAllTimeXp, calculatePeriodXp } from '../engine/xpAccounting.js';
import { calculatePracticeExposure } from '../engine/practiceExposure.js';
import { summarizeDashboardBadges, summarizeDashboardNextStep, summarizeOverallCompletion } from '../engine/dashboardAnalytics.js';
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievementDefinitions.js';
import { calculateAchievementProgress } from '../engine/achievementRules.js';

export async function getUserProgress(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ success: false, message: 'Authentication required.' }); return; }
  try {
    const [progress, userAttempts, allChallenges, completions, badgeAwards, achievementCatalog] = await Promise.all([
      prisma.userProgress.findUnique({ where: { user_id: userId } }),
      prisma.challengeAttempt.findMany({ where: { user_id: userId }, orderBy: { completed_at: 'asc' } }),
      getChallenges(),
      prisma.challengeCompletion.findMany({ where: { user_id: userId }, select: { completed_at: true, challenge: { select: { reward_xp: true } } } }),
      prisma.userAchievement.findMany({ where: { user_id: userId }, select: { achievement_id: true, unlocked_at: true, achievement: { select: { xp_bonus: true } } } }),
      prisma.achievement.findMany({ select: { code: true, name: true } })
    ]);
    const passedAttempts = userAttempts.filter(attempt => attempt.status === 'passed');
    const bestPassed = new Map<string, typeof passedAttempts[number]>();
    for (const attempt of passedAttempts) if (!bestPassed.has(attempt.challenge_id)) bestPassed.set(attempt.challenge_id, attempt);
    const uniquePassed = Array.from(bestPassed.values());
    const passedChallengeIds = new Set(uniquePassed.map(attempt => attempt.challenge_id));
    const derivedProgress = summarizeUserProgress(allChallenges, passedChallengeIds);
    const progression = summarizeProgression(allChallenges);
    const completionRewards = completions.map(item => ({ completedAt: item.completed_at, rewardXp: item.challenge.reward_xp }));
    const badgeRewards = badgeAwards.map(item => ({ unlockedAt: item.unlocked_at, xpBonus: item.achievement.xp_bonus }));
    const allTimeXp = calculateAllTimeXp(completionRewards, badgeRewards);
    const periodXp = calculatePeriodXp(completionRewards, badgeRewards, new Date());

    const practiceExposure = calculatePracticeExposure(allChallenges, userAttempts);
    const overallCompletion = summarizeOverallCompletion(allChallenges, passedChallengeIds);
    const earnedBadgeCodes = new Set(badgeAwards.map(item => item.achievement_id));
    const achievementCodes = new Set(achievementCatalog.map(item => item.code));
    const achievementStates = calculateAchievementProgress({
      definitions: ACHIEVEMENT_DEFINITIONS.filter(definition => achievementCodes.has(definition.code)),
      challenges: allChallenges.map(challenge => ({ id: challenge.id, level: challenge.level, coverageTopics: challenge.coverageTopics })),
      attempts: userAttempts,
      streak: progress?.streak || 0,
      earnedCodes: earnedBadgeCodes
    });
    const badgeSummary = summarizeDashboardBadges(achievementCatalog.map(item => item.code), achievementStates, earnedBadgeCodes);
    const nearestState = badgeSummary.nearest && achievementStates.find(state => state.code === badgeSummary.nearest?.code);
    const nearestDefinition = badgeSummary.nearest && achievementCatalog.find(item => item.code === badgeSummary.nearest?.code);
    const nearestBadge = badgeSummary.nearest && nearestState && nearestDefinition
      ? { ...badgeSummary.nearest, name: nearestDefinition.name, description: nearestState.progressLabel }
      : null;
    const levelTotal = progression.levels.find(item => item.level === derivedProgress.level)?.totalChallenges || 0;
    const currentLevelPassed = derivedProgress.completedChallengesByLevel[derivedProgress.level] || 0;
    const nextStep = summarizeDashboardNextStep({
      level: derivedProgress.level,
      completedAtLevel: currentLevelPassed,
      totalAtLevel: levelTotal,
      totalPassed: derivedProgress.completedChallenges,
      totalChallenges: progression.totalChallenges,
      nextUnlock: derivedProgress.nextUnlock
    });

    const challengeById = new Map(allChallenges.map(challenge => [challenge.id, challenge]));
    const recentActivity = userAttempts.slice(-5).reverse().map(attempt => {
      const challenge = challengeById.get(attempt.challenge_id);
      return { id: attempt.id, challengeTitle: challenge?.title || 'Challenge Attempt', level: challenge?.level || 1, score: attempt.score, status: attempt.status, completedAt: attempt.completed_at.toISOString() };
    });
    res.json({ success: true, progress: {
      userId, level: derivedProgress.level, unlockedLevel: derivedProgress.unlockedLevel, xp: allTimeXp,
      xpTotals: { allTime: allTimeXp, ...periodXp },
      score: progress?.score ?? 0, completedChallenges: derivedProgress.completedChallenges, accuracy: progress?.accuracy ?? 0,
      streak: progress?.streak ?? 0, lastActive: progress?.last_active.toISOString() ?? null,
      hasNextLevel: derivedProgress.hasNextLevel, nextUnlock: derivedProgress.nextUnlock
    }, practiceExposure, recentActivity, completedChallengesByLevel: derivedProgress.completedChallengesByLevel,
    progression,
    dashboard: {
      overallCompletion,
      badgeSummary: { ...badgeSummary, nearest: nearestBadge },
      currentLevelMissions: { passed: currentLevelPassed, total: levelTotal },
      nextStep
    } });
  } catch (error) { databaseFailure(res, 'progress lookup', error, 'Failed to retrieve progress.'); }
}
