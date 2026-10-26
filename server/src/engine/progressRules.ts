/** Level unlocking is based on distinct passed challenge IDs in the preceding level. */
export const MAX_LEVEL = 4;
export const LEVEL_UNLOCK_REQUIREMENTS = [
  { targetLevel: 2, previousLevel: 1, requiredPassed: 3 },
  { targetLevel: 3, previousLevel: 2, requiredPassed: 3 },
  { targetLevel: 4, previousLevel: 3, requiredPassed: 2 }
] as const;

export interface ProgressChallenge {
  id: string;
  level: number;
  rewardXp?: number;
}

export interface ProgressionSummary {
  totalChallenges: number;
  levels: Array<{ level: number; totalChallenges: number; rewardXpValues: number[] }>;
  unlockRequirements: Array<{ targetLevel: number; previousLevel: number; requiredPassed: number }>;
}

export function summarizeProgression(challenges: ProgressChallenge[]): ProgressionSummary {
  const levels = Array.from({ length: MAX_LEVEL }, (_, index) => index + 1).map(level => {
    const levelChallenges = challenges.filter(challenge => challenge.level === level);
    const rewardXpValues = Array.from(new Set(levelChallenges.map(challenge => challenge.rewardXp).filter((value): value is number => Number.isFinite(value))))
      .sort((a, b) => a - b);
    return { level, totalChallenges: levelChallenges.length, rewardXpValues };
  });
  return { totalChallenges: levels.reduce((sum, item) => sum + item.totalChallenges, 0), levels, unlockRequirements: [...LEVEL_UNLOCK_REQUIREMENTS] };
}

export function summarizeUserProgress(
  challenges: ProgressChallenge[],
  passedChallengeIds: ReadonlySet<string>
) {
  const passedByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const knownPassedIds = new Set<string>();
  for (const challenge of challenges) {
    if (passedChallengeIds.has(challenge.id) && passedByLevel[challenge.level] !== undefined) {
      passedByLevel[challenge.level] += 1;
      knownPassedIds.add(challenge.id);
    }
  }
  // Unlock state is derived from verified passed challenge records. The
  // persisted unlocked_level field is a cache and may be stale or incomplete.
  let unlockedLevel = 1;
  for (const rule of LEVEL_UNLOCK_REQUIREMENTS) {
    if (passedByLevel[rule.previousLevel] >= rule.requiredPassed) unlockedLevel = Math.max(unlockedLevel, rule.targetLevel);
  }
  const nextRule = LEVEL_UNLOCK_REQUIREMENTS.find(rule => rule.targetLevel === unlockedLevel + 1);
  const nextUnlock = nextRule ? {
    level: nextRule.targetLevel,
    fromLevel: nextRule.previousLevel,
    passed: passedByLevel[nextRule.previousLevel],
    required: nextRule.requiredPassed,
    percentage: Math.min(100, Math.round(passedByLevel[nextRule.previousLevel] / nextRule.requiredPassed * 100))
  } : null;
  return {
    level: unlockedLevel,
    unlockedLevel,
    completedChallenges: knownPassedIds.size,
    completedChallengesByLevel: passedByLevel,
    hasNextLevel: unlockedLevel < MAX_LEVEL,
    nextUnlock
  };
}

/** The streak is based on UTC calendar days to make the rule timezone-independent. */
export function advanceUtcStreak(streak: number, lastActive: string | undefined, now: Date): number {
  const previous = lastActive ? new Date(lastActive) : null;
  if (!previous || Number.isNaN(previous.getTime())) return 1;
  const utcDay = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const gapDays = Math.round((utcDay(now) - utcDay(previous)) / 86_400_000);
  if (gapDays === 1) return streak + 1;
  if (gapDays > 1) return 1;
  return Math.max(streak, 1);
}

export function hasAnsweredSingleSelect(answers: Record<string, unknown>): boolean {
  return Object.values(answers).some(answer => typeof answer === 'string' && answer.length > 0);
}

export function hasAnsweredMultiSelect(answers: Record<string, unknown>): boolean {
  return Object.values(answers).some(answer => Array.isArray(answer) && answer.length > 0);
}
