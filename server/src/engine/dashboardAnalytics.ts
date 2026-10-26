import type { AchievementProgress } from './achievementRules.js';

export interface DashboardChallenge {
  id: string;
  level: number;
}

export function summarizeOverallCompletion(
  challenges: DashboardChallenge[],
  passedChallengeIds: ReadonlySet<string>
): { passed: number; total: number; percentage: number } {
  const catalog = new Map(challenges.map(challenge => [challenge.id, challenge]));
  const passed = [...passedChallengeIds].filter(id => catalog.has(id)).length;
  const total = catalog.size;
  return { passed, total, percentage: total ? Math.min(100, Math.round(passed / total * 100)) : 0 };
}

export interface DashboardBadgeSummary {
  total: number;
  earned: number;
  nearest: null | {
    code: string;
    current: number;
    target: number;
    percentage: number;
    progressLabel: string;
  };
}

export function summarizeDashboardBadges(
  catalogCodes: string[],
  states: AchievementProgress[],
  earnedCodes: ReadonlySet<string>
): DashboardBadgeSummary {
  const uniqueCodes = new Set(catalogCodes);
  const earned = new Set([...earnedCodes].filter(code => uniqueCodes.has(code))).size;
  const nearestCandidates = states
    .filter(state => uniqueCodes.has(state.code) && !earnedCodes.has(state.code) && state.progressType === 'count' && Number.isFinite(state.target) && (state.target ?? 0) > 0 && !state.eligible)
    .map(state => {
      const target = state.target as number;
      const current = Math.max(0, Math.min(target, state.current));
      return {
        code: state.code,
        current,
        target,
        percentage: Math.min(100, Math.round(current / target * 100)),
        progressLabel: `${current} / ${target}`
      };
    })
    .sort((a, b) => b.percentage - a.percentage || a.code.localeCompare(b.code));

  return { total: uniqueCodes.size, earned, nearest: nearestCandidates[0] ?? null };
}

export function summarizeDashboardNextStep(input: {
  level: number;
  completedAtLevel: number;
  totalAtLevel: number;
  totalPassed: number;
  totalChallenges: number;
  nextUnlock: null | { level: number; fromLevel: number; passed: number; required: number };
}): { label: string; path?: string; completed: boolean } {
  const { level, completedAtLevel, totalAtLevel, totalPassed, totalChallenges, nextUnlock } = input;
  if (nextUnlock) {
    const remaining = Math.max(0, nextUnlock.required - nextUnlock.passed);
    return {
      label: remaining === 0
        ? `Level ${nextUnlock.level} is ready to unlock.`
        : `Pass ${remaining} more qualifying Level ${nextUnlock.fromLevel} challenge${remaining === 1 ? '' : 's'} to unlock Level ${nextUnlock.level}.`,
      path: `/challenges?level=${nextUnlock.fromLevel}`,
      completed: false
    };
  }
  if (level === 4 && totalChallenges > 0 && totalPassed >= totalChallenges) {
    return { label: 'You have completed all available challenges at the maximum level.', completed: true };
  }
  if (totalAtLevel > completedAtLevel) {
    return { label: `Continue Level ${level} missions (${completedAtLevel} of ${totalAtLevel} passed).`, path: `/challenges?level=${level}`, completed: false };
  }
  return { label: `Level ${level} is your current maximum unlocked level.`, path: '/levels', completed: false };
}
