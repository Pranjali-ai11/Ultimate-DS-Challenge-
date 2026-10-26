type ChallengePayload = Record<string, unknown> & { level?: number };

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).filter(key => record[key] !== undefined).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function comparablePayload(payload: ChallengePayload): ChallengePayload {
  const copy = JSON.parse(JSON.stringify(payload)) as ChallengePayload;
  delete copy.coverageTopics;

  // Level 1 answer scoring is keyed by options[].id/isCorrect. These fields
  // label the correct concept in feedback and can be corrected without changing
  // the selected-answer contract. Higher-level optimalStructures are scoring keys.
  if (copy.level === 1) {
    delete copy.availableStructures;
    delete copy.optimalStructures;
    if (Array.isArray(copy.options)) {
      copy.options = copy.options.map((option: unknown) => {
        if (!option || typeof option !== 'object') return option;
        const { structureId: _structureId, ...stableOption } = option as Record<string, unknown>;
        return stableOption;
      });
    }
    if (Array.isArray(copy.requirements)) {
      copy.requirements = copy.requirements.map((requirement: unknown) => {
        if (!requirement || typeof requirement !== 'object') return requirement;
        const { satisfiedBy: _satisfiedBy, ...stableRequirement } = requirement as Record<string, unknown>;
        return stableRequirement;
      });
    }
  }
  return copy;
}

/** Allow only the curated topic labels and non-scoring L1 option labels to sync. */
export function isMetadataOnlyChallengeUpdate(existing: ChallengePayload, desired: ChallengePayload): boolean {
  return canonicalJson(comparablePayload(existing)) === canonicalJson(comparablePayload(desired));
}

type AchievementPayload = Record<string, unknown> & { code?: string; xp_bonus?: number };

/** Descriptive badge metadata may change; the stable ID and XP value may not. */
export function isSafeAchievementMetadataUpdate(existing: AchievementPayload, desired: AchievementPayload): boolean {
  if (existing.code !== desired.code || existing.xp_bonus !== desired.xp_bonus) return false;
  const allowed = new Set(['code', 'name', 'description', 'icon', 'requirement', 'xp_bonus']);
  return [...new Set([...Object.keys(existing), ...Object.keys(desired)])].every(key => allowed.has(key));
}
