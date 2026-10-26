import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma, initDatabase } from './index.js';
import { parseLegacyStore, LegacyParseResult } from './legacyJson.js';

function iso(value: Date | string): string { return new Date(value).toISOString(); }
function same(left: unknown, right: unknown): boolean {
  const normalize = (value: any): any => {
    if (value === undefined || value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, normalize(value[key])]));
    return value;
  };
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

export function readLegacyJson(file: string): LegacyParseResult {
  const absolute = path.resolve(file);
  const raw = fs.readFileSync(absolute, 'utf8');
  return parseLegacyStore(JSON.parse(raw));
}

export async function importLegacyJson(file: string): Promise<{ imported: Record<string, number>; skipped: Record<string, number>; issues: string[] }> {
  const parsed = readLegacyJson(file);
  if (parsed.issues.length) return { imported: {}, skipped: {}, issues: parsed.issues };
  await initDatabase();

  try {
    const outcome = await prisma.$transaction(async tx => {
      const { users, progress, attempts, userAchievements, revokedTokens } = parsed.data;
      const existingUsers = users.length ? await tx.user.findMany({ where: { OR: [{ id: { in: users.map(item => item.id) } }, { email: { in: users.map(item => item.email) } }] } }) : [];
      const existingProgress = progress.length ? await tx.userProgress.findMany({ where: { OR: [{ id: { in: progress.map(item => item.id) } }, { user_id: { in: progress.map(item => item.user_id) } }] } }) : [];
      const existingAttempts = attempts.length ? await tx.challengeAttempt.findMany({ where: { id: { in: attempts.map(item => item.id) } } }) : [];
      const existingAchievements = userAchievements.length ? await tx.userAchievement.findMany({ where: { OR: [{ id: { in: userAchievements.map(item => item.id) } }, { user_id: { in: userAchievements.map(item => item.user_id) }, achievement_id: { in: userAchievements.map(item => item.achievement_id) } }] } }) : [];
      const existingTokens = revokedTokens.length ? await tx.revokedToken.findMany({ where: { token_id: { in: revokedTokens.map(item => item.token_id) } } }) : [];
      const conflicts: string[] = [];
      const newUsers = users.filter(item => {
        const match = existingUsers.find(row => row.id === item.id || row.email === item.email);
        if (!match) return true;
        const equivalent = match.id === item.id && match.email === item.email && match.name === item.name && match.password_hash === item.password_hash && match.avatar === item.avatar && match.title === item.title && match.bio === item.bio && iso(match.created_at) === iso(item.created_at);
        if (!equivalent) conflicts.push(`User ${item.id}/${item.email} already exists with different data; it was not overwritten.`);
        return false;
      });
      const newProgress = progress.filter(item => {
        const match = existingProgress.find(row => row.id === item.id || row.user_id === item.user_id);
        if (!match) return true;
        const equivalent = match.id === item.id && match.user_id === item.user_id && match.level === item.level && match.unlocked_level === item.unlocked_level && match.xp === item.xp && match.score === item.score && match.completed_challenges === item.completed_challenges && match.accuracy === item.accuracy && match.streak === item.streak && iso(match.last_active) === iso(item.last_active);
        if (!equivalent) conflicts.push(`Progress for user ${item.user_id} already exists with different data; it was not overwritten.`);
        return false;
      });
      const newAttempts = attempts.filter(item => {
        const match = existingAttempts.find(row => row.id === item.id);
        if (!match) return true;
        const equivalent = match.user_id === item.user_id && match.challenge_id === item.challenge_id && same(match.selected_structures, item.selected_structures) && same(match.final_design, item.final_design) && match.score === item.score && match.correctness_score === item.correctness_score && match.performance_score === item.performance_score && match.memory_score === item.memory_score && match.complexity_score === item.complexity_score && match.simplicity_score === item.simplicity_score && match.explanation_score === item.explanation_score && same(match.feedback, item.feedback) && match.status === item.status && iso(match.completed_at) === iso(item.completed_at) && match.reward_awarded === item.reward_awarded;
        if (!equivalent) conflicts.push(`Attempt ${item.id} already exists with different data; it was not overwritten.`);
        return false;
      });
      const newAchievements = userAchievements.filter(item => {
        const match = existingAchievements.find(row => row.id === item.id || (row.user_id === item.user_id && row.achievement_id === item.achievement_id));
        if (!match) return true;
        const equivalent = match.id === item.id && match.user_id === item.user_id && match.achievement_id === item.achievement_id && iso(match.unlocked_at) === iso(item.unlocked_at);
        if (!equivalent) conflicts.push(`Achievement ${item.user_id}/${item.achievement_id} already exists with different data; it was not overwritten.`);
        return false;
      });
      const newTokens = revokedTokens.filter(item => {
        const match = existingTokens.find(row => row.token_id === item.token_id);
        if (!match) return true;
        if (iso(match.expires_at) !== iso(item.expires_at)) conflicts.push(`Revoked token ${item.token_id} already exists with a different expiry; it was not overwritten.`);
        return false;
      });
      if (conflicts.length) throw new Error(`IMPORT_CONFLICT: ${conflicts.join('\n')}`);

      if (newUsers.length) await tx.user.createMany({ data: newUsers });
      if (newProgress.length) await tx.userProgress.createMany({ data: newProgress });
      if (newAttempts.length) await tx.challengeAttempt.createMany({ data: newAttempts.map(item => ({
        ...item,
        selected_structures: item.selected_structures as Prisma.InputJsonValue,
        ...(item.final_design !== undefined ? { final_design: item.final_design as Prisma.InputJsonValue } : {}),
        ...(item.feedback !== undefined ? { feedback: item.feedback as Prisma.InputJsonValue } : {})
      })) as Prisma.ChallengeAttemptCreateManyInput[] });
      if (newAchievements.length) await tx.userAchievement.createMany({ data: newAchievements });
      if (newTokens.length) await tx.revokedToken.createMany({ data: newTokens });

      const earliestPass = new Map<string, Date>();
      for (const attempt of attempts.filter(item => item.status === 'passed')) {
        const key = `${attempt.user_id}\0${attempt.challenge_id}`;
        const current = earliestPass.get(key);
        if (!current || current.getTime() > attempt.completed_at.getTime()) earliestPass.set(key, attempt.completed_at);
      }
      let completionCount = 0;
      for (const [key, completedAt] of earliestPass) {
        const [user_id, challenge_id] = key.split('\0');
        const stableId = `import-${createHash('sha256').update(key).digest('hex')}`;
        const result = await tx.challengeCompletion.createMany({ data: [{ id: stableId, user_id, challenge_id, completed_at: completedAt }], skipDuplicates: true });
        completionCount += result.count;
      }
      return {
        imported: { users: newUsers.length, progress: newProgress.length, attempts: newAttempts.length, userAchievements: newAchievements.length, revokedTokens: newTokens.length, completions: completionCount },
        skipped: { users: users.length - newUsers.length, progress: progress.length - newProgress.length, attempts: attempts.length - newAttempts.length, userAchievements: userAchievements.length - newAchievements.length, revokedTokens: revokedTokens.length - newTokens.length }
      };
    });
    return { ...outcome, issues: [] };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('IMPORT_CONFLICT:')) return { imported: {}, skipped: {}, issues: error.message.slice('IMPORT_CONFLICT:'.length).trim().split('\n') };
    throw error;
  }
}
