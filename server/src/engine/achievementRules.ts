import type { AchievementDefinition } from '../data/achievementDefinitions.js';

export interface AchievementAttempt {
  challenge_id: string;
  status: string;
  score: number;
}

export interface AchievementChallenge {
  id: string;
  level: number;
  coverageTopics?: unknown;
}

export interface AchievementProgress {
  code: string;
  category: AchievementDefinition['category'];
  topic?: string;
  target?: number;
  current: number;
  percent?: number;
  progressType: 'count' | 'status';
  progressLabel: string;
  eligible: boolean;
  earned: boolean;
  almostEarned: boolean;
}

function canonicalTopic(topic: string): string {
  return topic.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function computeCurrent(
  definition: AchievementDefinition,
  passedIds: Set<string>,
  attempts: AchievementAttempt[],
  levelById: Map<string, number>,
  topicsById: Map<string, Set<string>>,
  streak: number
): number {
  const rule = definition.rule;
  if (rule.type === 'topic') {
    const targetTopic = canonicalTopic(rule.topic);
    const qualifyingIds = new Set(attempts
      .filter(attempt => attempt.status === 'passed' && passedIds.has(attempt.challenge_id))
      .filter(attempt => {
        const challengeLevel = levelById.get(attempt.challenge_id);
        return challengeLevel !== undefined && topicsById.get(attempt.challenge_id)?.has(targetTopic);
      })
      .map(attempt => attempt.challenge_id));
    return Math.min(qualifyingIds.size, rule.target);
  }
  if (rule.type === 'distinct-passes') return Math.min(passedIds.size, rule.target);
  if (rule.type === 'perfect-level') {
    return attempts.some(attempt => attempt.status === 'passed' && attempt.score >= 100 && levelById.get(attempt.challenge_id) === rule.level) ? 1 : 0;
  }
  if (rule.type === 'score-at-least') {
    return attempts.some(attempt => attempt.status === 'passed' && attempt.score >= rule.score) ? 1 : 0;
  }
  return Math.min(Math.max(0, streak), rule.target);
}

export function calculateAchievementProgress(input: {
  definitions: AchievementDefinition[];
  challenges: AchievementChallenge[];
  attempts: AchievementAttempt[];
  streak: number;
  earnedCodes?: ReadonlySet<string>;
}): AchievementProgress[] {
  const challengeIds = new Set(input.challenges.map(challenge => challenge.id));
  const passedIds = new Set(input.attempts
    .filter(attempt => attempt.status === 'passed' && challengeIds.has(attempt.challenge_id))
    .map(attempt => attempt.challenge_id));
  const levelById = new Map(input.challenges.map(challenge => [challenge.id, challenge.level]));
  const topicsById = new Map(input.challenges.map(challenge => [challenge.id, new Set(
    (Array.isArray(challenge.coverageTopics) ? challenge.coverageTopics : [])
      .filter((topic): topic is string => typeof topic === 'string')
      .map(canonicalTopic)
  )]));

  return input.definitions.map(definition => {
    const current = computeCurrent(definition, passedIds, input.attempts, levelById, topicsById, input.streak);
    const rule = definition.rule;
    const target = rule.type === 'topic' || rule.type === 'distinct-passes' || rule.type === 'streak' ? rule.target : undefined;
    const eligible = target !== undefined ? current >= target : current > 0;
    const earned = input.earnedCodes?.has(definition.code) ?? false;
    const countBased = target !== undefined;
    const shownCurrent = earned && target !== undefined ? target : current;
    const percent = target !== undefined ? Math.min(100, Math.round(shownCurrent / target * 100)) : undefined;
    const progressLabel = countBased
      ? `${shownCurrent} / ${target} ${rule.type === 'topic' ? 'challenges' : rule.type === 'streak' ? 'days' : 'completed'}`
      : earned ? 'Requirement met' : 'Requirement not yet met';
    return {
      code: definition.code,
      category: definition.category,
      ...(rule.type === 'topic' ? { topic: rule.topic } : {}),
      ...(target !== undefined ? { target } : {}),
      current: shownCurrent,
      ...(percent !== undefined ? { percent } : {}),
      progressType: countBased ? 'count' as const : 'status' as const,
      progressLabel,
      eligible,
      earned,
      almostEarned: !earned && target !== undefined && target > 1 && shownCurrent === target - 1
    };
  });
}

export function getQualifiedAchievementCodes(input: {
  definitions: AchievementDefinition[];
  challenges: AchievementChallenge[];
  attempts: AchievementAttempt[];
  streak: number;
}): string[] {
  return calculateAchievementProgress(input).filter(item => item.eligible).map(item => item.code);
}

export function getUnawardedAchievementCodes(eligibleCodes: string[], existingCodes: ReadonlySet<string>): string[] {
  return [...new Set(eligibleCodes)].filter(code => !existingCodes.has(code));
}
