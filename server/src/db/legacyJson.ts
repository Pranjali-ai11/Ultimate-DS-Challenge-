import { INITIAL_CHALLENGES, INITIAL_ACHIEVEMENTS } from '../data/seedData.js';

export type LegacyUser = { id: string; name: string; email: string; password_hash: string; avatar: string; title: string; bio: string; created_at: Date };
export type LegacyProgress = { id: string; user_id: string; level: number; unlocked_level: number; xp: number; score: number; completed_challenges: number; accuracy: number; streak: number; last_active: Date };
export type LegacyAttempt = {
  id: string; user_id: string; challenge_id: string; selected_structures: string[]; final_design?: unknown;
  score: number; correctness_score: number; performance_score: number; memory_score: number; complexity_score: number;
  simplicity_score: number; explanation_score: number; feedback?: unknown; status: 'passed' | 'failed';
  completed_at: Date; reward_awarded: boolean | null; submission_id?: string | null;
};
export type LegacyUserAchievement = { id: string; user_id: string; achievement_id: string; unlocked_at: Date };
export type LegacyStore = {
  users: LegacyUser[]; progress: LegacyProgress[]; attempts: LegacyAttempt[];
  userAchievements: LegacyUserAchievement[]; revokedTokens: Array<{ token_id: string; expires_at: Date }>;
};

export type LegacyParseResult = { data: LegacyStore; issues: string[]; counts: Record<string, number> };

const asObject = (value: unknown): value is Record<string, any> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const validDate = (value: unknown): Date | null => {
  const date = new Date(value as string | number);
  return Number.isFinite(date.getTime()) ? date : null;
};

export function parseLegacyStore(input: unknown): LegacyParseResult {
  const issues: string[] = [];
  const empty: LegacyStore = { users: [], progress: [], attempts: [], userAchievements: [], revokedTokens: [] };
  if (!asObject(input)) return { data: empty, issues: ['Root value must be an object.'], counts: { users: 0, progress: 0, attempts: 0, userAchievements: 0, revokedTokens: 0 } };
  const source = input as Record<string, any>;
  const rootKeys = new Set(['users', 'progress', 'attempts', 'userAchievements', 'revokedTokens']);
  for (const key of Object.keys(source)) if (!rootKeys.has(key)) issues.push(`Unknown persisted root field ${key}; review it before importing.`);
  const knownChallengeIds = new Set(INITIAL_CHALLENGES.map(item => item.id));
  const knownAchievementCodes = new Set(INITIAL_ACHIEVEMENTS.map(item => item.code));

  const usersById = new Map<string, LegacyUser>();
  if (!Array.isArray(source.users)) issues.push('users must be a key/value array.');
  else source.users.forEach((entry: unknown, index: number) => {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string' || !asObject(entry[1])) { issues.push(`users[${index}] is not a valid key/value entry.`); return; }
    const value = entry[1];
    const allowed = new Set(['id', 'name', 'email', 'password_hash', 'avatar', 'title', 'bio', 'created_at']);
    for (const key of Object.keys(value)) if (!allowed.has(key)) issues.push(`users[${index}] has an unrecognized field ${key}.`);
    if (typeof value.id !== 'string' || !value.id || typeof value.name !== 'string' || !value.name || typeof value.email !== 'string' || !value.email || typeof value.password_hash !== 'string' || !value.password_hash) { issues.push(`users[${index}] is missing a required identity or password-hash field.`); return; }
    if (entry[0] !== value.id && entry[0].toLowerCase() !== value.email.toLowerCase()) { issues.push(`users[${index}] map key does not match its user ID or email alias.`); return; }
    if (value.id.length > 191 || value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.name.length > 80 || (value.avatar ?? '').length > 80 || (value.title ?? '').length > 60 || (value.bio ?? '').length > 500) { issues.push(`users[${index}] has an invalid email or exceeds a MySQL field limit.`); return; }
    const createdAt = validDate(value.created_at);
    if (!createdAt) { issues.push(`users[${index}] has an invalid created_at value.`); return; }
    const user: LegacyUser = { id: value.id, name: value.name, email: value.email.toLowerCase(), password_hash: value.password_hash, avatar: value.avatar || 'avatar-1', title: value.title || 'Novice Architect', bio: value.bio || '', created_at: createdAt };
    const existing = usersById.get(user.id);
    if (existing && JSON.stringify({ ...existing, created_at: existing.created_at.toISOString() }) !== JSON.stringify({ ...user, created_at: user.created_at.toISOString() })) { issues.push(`User ${user.id} has conflicting duplicate records.`); return; }
    usersById.set(user.id, user);
  });
  const emailOwner = new Map<string, string>();
  for (const user of usersById.values()) {
    const prior = emailOwner.get(user.email);
    if (prior && prior !== user.id) issues.push(`Email collision between users ${prior} and ${user.id}; neither record can safely share that unique email.`);
    emailOwner.set(user.email, user.id);
  }
  const userIds = new Set(usersById.keys());

  const progressByUser = new Map<string, LegacyProgress>();
  if (!Array.isArray(source.progress)) issues.push('progress must be a key/value array.');
  else source.progress.forEach((entry: unknown, index: number) => {
    if (!Array.isArray(entry) || entry.length !== 2 || !asObject(entry[1])) { issues.push(`progress[${index}] is not a valid key/value entry.`); return; }
    const value = entry[1];
    const allowed = new Set(['id', 'user_id', 'level', 'unlocked_level', 'xp', 'score', 'completed_challenges', 'accuracy', 'streak', 'last_active']);
    for (const key of Object.keys(value)) if (!allowed.has(key)) issues.push(`progress[${index}] has an unrecognized field ${key}.`);
    const ints = ['level', 'unlocked_level', 'xp', 'score', 'completed_challenges', 'streak'];
    if (entry[0] !== value.user_id) { issues.push(`progress[${index}] map key does not match its user ID.`); return; }
    if (typeof value.id !== 'string' || value.id.length > 191 || typeof value.user_id !== 'string' || !userIds.has(value.user_id) || ints.some(key => !Number.isInteger(value[key]) || value[key] < 0) || typeof value.accuracy !== 'number' || !Number.isFinite(value.accuracy) || value.accuracy < 0 || value.accuracy > 100) { issues.push(`progress[${index}] is malformed or references an unknown user.`); return; }
    const lastActive = validDate(value.last_active);
    if (!lastActive) { issues.push(`progress[${index}] has an invalid last_active value.`); return; }
    const item: LegacyProgress = { id: value.id, user_id: value.user_id, level: value.level, unlocked_level: value.unlocked_level, xp: value.xp, score: value.score, completed_challenges: value.completed_challenges, accuracy: value.accuracy, streak: value.streak, last_active: lastActive };
    if (progressByUser.has(item.user_id)) issues.push(`Multiple progress records reference user ${item.user_id}.`);
    else progressByUser.set(item.user_id, item);
  });

  const attempts: LegacyAttempt[] = [];
  const attemptIds = new Set<string>();
  const submittedQuestionKeys = new Set<string>();
  if (!Array.isArray(source.attempts)) issues.push('attempts must be an array.');
  else source.attempts.forEach((value: unknown, index: number) => {
    if (!asObject(value)) { issues.push(`attempts[${index}] is not an object.`); return; }
    const allowed = new Set(['id', 'user_id', 'challenge_id', 'selected_structures', 'final_design', 'score', 'correctness_score', 'performance_score', 'memory_score', 'complexity_score', 'simplicity_score', 'explanation_score', 'feedback', 'status', 'completed_at', 'reward_awarded', 'submission_id']);
    for (const key of Object.keys(value)) if (!allowed.has(key)) issues.push(`attempts[${index}] has an unrecognized field ${key}.`);
    const scoreKeys = ['score', 'correctness_score', 'performance_score', 'memory_score', 'complexity_score', 'simplicity_score', 'explanation_score'];
    if (typeof value.id !== 'string' || !value.id || value.id.length > 191 || attemptIds.has(value.id) || typeof value.user_id !== 'string' || !userIds.has(value.user_id) || typeof value.challenge_id !== 'string' || !knownChallengeIds.has(value.challenge_id) || !Array.isArray(value.selected_structures) || value.selected_structures.some((item: unknown) => typeof item !== 'string') || scoreKeys.some(key => !Number.isInteger(value[key]) || value[key] < 0 || value[key] > 100) || !['passed', 'failed'].includes(value.status) || (value.reward_awarded !== undefined && typeof value.reward_awarded !== 'boolean') || (value.submission_id !== undefined && value.submission_id !== null && (typeof value.submission_id !== 'string' || !value.submission_id || value.submission_id.length > 191))) { issues.push(`attempts[${index}] has invalid fields, a duplicate ID, or an unresolved user/challenge reference.`); return; }
    const submissionQuestionKey = value.submission_id ? `${value.user_id}\0${value.submission_id}\0${value.challenge_id}` : '';
    if (submissionQuestionKey && submittedQuestionKeys.has(submissionQuestionKey)) { issues.push(`attempts[${index}] duplicates a question in submission ${value.submission_id}.`); return; }
    const completedAt = validDate(value.completed_at);
    if (!completedAt) { issues.push(`attempts[${index}] has an invalid completed_at value.`); return; }
    attemptIds.add(value.id);
    if (submissionQuestionKey) submittedQuestionKeys.add(submissionQuestionKey);
    attempts.push({
      id: value.id, user_id: value.user_id, challenge_id: value.challenge_id, selected_structures: value.selected_structures,
      ...(value.final_design !== undefined && value.final_design !== null ? { final_design: value.final_design } : {}),
      score: value.score, correctness_score: value.correctness_score, performance_score: value.performance_score,
      memory_score: value.memory_score, complexity_score: value.complexity_score, simplicity_score: value.simplicity_score,
      explanation_score: value.explanation_score,
      ...(value.feedback !== undefined && value.feedback !== null ? { feedback: value.feedback } : {}),
      status: value.status, completed_at: completedAt,
      ...(typeof value.submission_id === 'string' ? { submission_id: value.submission_id } : {}),
      reward_awarded: typeof value.reward_awarded === 'boolean' ? value.reward_awarded : null
    });
  });

  const userAchievements: LegacyUserAchievement[] = [];
  const achievementPairs = new Set<string>();
  if (!Array.isArray(source.userAchievements)) issues.push('userAchievements must be an array.');
  else source.userAchievements.forEach((value: unknown, index: number) => {
    if (asObject(value)) {
      const allowed = new Set(['id', 'user_id', 'achievement_id', 'unlocked_at']);
      for (const key of Object.keys(value)) if (!allowed.has(key)) issues.push(`userAchievements[${index}] has an unrecognized field ${key}.`);
    }
    if (!asObject(value) || typeof value.id !== 'string' || typeof value.user_id !== 'string' || !userIds.has(value.user_id) || typeof value.achievement_id !== 'string' || !knownAchievementCodes.has(value.achievement_id)) { issues.push(`userAchievements[${index}] has invalid fields or an unresolved reference.`); return; }
    const unlockedAt = validDate(value.unlocked_at);
    const pair = `${value.user_id}\0${value.achievement_id}`;
    if (!unlockedAt || achievementPairs.has(pair)) { issues.push(`userAchievements[${index}] has an invalid date or duplicate user/achievement pair.`); return; }
    achievementPairs.add(pair);
    userAchievements.push({ id: value.id, user_id: value.user_id, achievement_id: value.achievement_id, unlocked_at: unlockedAt });
  });

  const revokedTokens: LegacyStore['revokedTokens'] = [];
  const tokenIds = new Set<string>();
  if (source.revokedTokens !== undefined && !Array.isArray(source.revokedTokens)) issues.push('revokedTokens must be a key/value array.');
  else (source.revokedTokens || []).forEach((entry: unknown, index: number) => {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string' || tokenIds.has(entry[0]) || typeof entry[1] !== 'number' || !Number.isFinite(entry[1])) { issues.push(`revokedTokens[${index}] is malformed or duplicated.`); return; }
    tokenIds.add(entry[0]);
    revokedTokens.push({ token_id: entry[0], expires_at: new Date(entry[1]) });
  });

  const data = { users: Array.from(usersById.values()), progress: Array.from(progressByUser.values()), attempts, userAchievements, revokedTokens };
  const completionKeys = new Set(data.attempts.filter(attempt => attempt.status === 'passed').map(attempt => `${attempt.user_id}\0${attempt.challenge_id}`));
  return { data, issues, counts: { users: data.users.length, progress: data.progress.length, attempts: data.attempts.length, passedChallengeCompletions: completionKeys.size, userAchievements: data.userAchievements.length, revokedTokens: data.revokedTokens.length } };
}
