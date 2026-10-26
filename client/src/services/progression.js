/** @typedef {{ totalChallenges: number, levels: Array<{ level: number, totalChallenges: number, rewardXpValues: number[] }>, unlockRequirements: Array<{ targetLevel: number, previousLevel: number, requiredPassed: number }> }} ProgressionSummary */

/** @param {ProgressionSummary | null | undefined} progression @param {number} level */
export function rewardLabel(progression, level) {
  const values = progression?.levels.find(item => item.level === level)?.rewardXpValues;
  if (!values?.length) return 'Reward details unavailable';
  if (values.length === 1) return `+${values[0]} XP per challenge`;
  return `+${values.join(' / ')} XP by challenge`;
}

/** @param {ProgressionSummary | null | undefined} progression @param {number} level */
export function challengeCount(progression, level) {
  return progression?.levels.find(item => item.level === level)?.totalChallenges ?? null;
}

/** @param {ProgressionSummary | null | undefined} progression @param {number} targetLevel */
export function unlockRequirement(progression, targetLevel) {
  const rule = progression?.unlockRequirements.find(item => item.targetLevel === targetLevel);
  return rule
    ? `Complete Level ${rule.previousLevel} to unlock`
    : 'Available by default.';
}
