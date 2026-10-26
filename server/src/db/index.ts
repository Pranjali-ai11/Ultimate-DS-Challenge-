import { PrismaClient } from '@prisma/client';
import { INITIAL_CHALLENGES, INITIAL_ACHIEVEMENTS } from '../data/seedData.js';
import { isMetadataOnlyChallengeUpdate, isSafeAchievementMetadataUpdate } from './catalogSync.js';

export const prisma = new PrismaClient();

function canonicalJson(value: any): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).filter(key => value[key] !== undefined).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function validateDatabaseUrl(value = process.env.DATABASE_URL): string | null {
  if (!value) return 'DATABASE_URL is missing. Set it to a MySQL connection URL in server/.env.';
  try {
    const url = new URL(value);
    if (url.protocol !== 'mysql:') return 'DATABASE_URL must use the mysql:// protocol.';
    if (!url.hostname || !url.pathname || url.pathname === '/') return 'DATABASE_URL must include a MySQL host and database name.';
  } catch {
    return 'DATABASE_URL is not a valid MySQL connection URL.';
  }
  return null;
}

export async function initDatabase(): Promise<void> {
  const configurationError = validateDatabaseUrl();
  if (configurationError) throw new Error(configurationError);

  try {
    await prisma.$connect();
    await prisma.$transaction(async tx => {
      await tx.challenge.createMany({
        data: INITIAL_CHALLENGES.map(challenge => ({
          id: challenge.id,
          slug: challenge.slug,
          level: challenge.level,
          title: challenge.title,
          reward_xp: challenge.rewardXp,
          payload: challenge as object
        })),
        skipDuplicates: true
      });
      await tx.achievement.createMany({
        data: INITIAL_ACHIEVEMENTS.map(achievement => ({
          code: achievement.code,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          requirement: achievement.requirement,
          xp_bonus: achievement.xpBonus
        })),
        skipDuplicates: true
      });
      const [storedChallenges, storedAchievements] = await Promise.all([
        tx.challenge.findMany({ where: { id: { in: INITIAL_CHALLENGES.map(item => item.id) } } }),
        tx.achievement.findMany({ where: { code: { in: INITIAL_ACHIEVEMENTS.map(item => item.code) } } })
      ]);
      const challengeById = new Map(storedChallenges.map(item => [item.id, item]));
      const achievementByCode = new Map(storedAchievements.map(item => [item.code, item]));
      const challengeConflict = INITIAL_CHALLENGES.find(item => {
        const stored = challengeById.get(item.id);
        return !stored || stored.slug !== item.slug || stored.level !== item.level || stored.title !== item.title || stored.reward_xp !== item.rewardXp || !isMetadataOnlyChallengeUpdate(stored.payload as Record<string, unknown>, item as Record<string, unknown>);
      });
      const achievementConflict = INITIAL_ACHIEVEMENTS.find(item => {
        const stored = achievementByCode.get(item.code);
        return !stored || !isSafeAchievementMetadataUpdate(stored, {
          code: item.code, name: item.name, description: item.description, icon: item.icon,
          requirement: item.requirement, xp_bonus: item.xpBonus
        });
      });
      if (challengeConflict || achievementConflict) throw new Error('Seed catalog differs from existing MySQL rows. Existing rows were preserved; review the catalog before starting.');
      for (const challenge of INITIAL_CHALLENGES) {
        const stored = challengeById.get(challenge.id)!;
        if (canonicalJson(stored.payload) !== canonicalJson(challenge)) {
          await tx.challenge.update({ where: { id: challenge.id }, data: { payload: challenge as object } });
        }
      }
      for (const achievement of INITIAL_ACHIEVEMENTS) {
        const stored = achievementByCode.get(achievement.code)!;
        if (stored.name !== achievement.name || stored.description !== achievement.description || stored.icon !== achievement.icon || stored.requirement !== achievement.requirement) {
          await tx.achievement.update({ where: { code: achievement.code }, data: {
            name: achievement.name, description: achievement.description, icon: achievement.icon, requirement: achievement.requirement
          } });
        }
      }
    });
  } catch (error) {
    await prisma.$disconnect().catch(() => undefined);
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : undefined;
    const detail = code ? ` (database error ${code})` : '';
    throw new Error(`Could not connect to or initialize MySQL${detail}. Check that MySQL is running, DATABASE_URL is correct, and migrations have been applied.`);
  }
}

export function isDatabaseUnavailable(error: unknown): boolean {
  if (typeof error === 'object' && error && 'code' in error) {
    return ['P1000', 'P1001', 'P1002', 'P1003', 'P1010', 'P1011', 'P1017'].includes(String(error.code));
  }
  return false;
}

export function logDatabaseError(context: string, error: unknown): void {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'unknown';
  console.error(`[database] ${context} failed (code: ${code}).`);
}

