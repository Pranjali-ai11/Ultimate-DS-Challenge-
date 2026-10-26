import { prisma } from './index.js';

export type ChallengeData = Record<string, any> & { id: string; slug: string; level: number };

export async function getChallenges(): Promise<ChallengeData[]> {
  const rows = await prisma.challenge.findMany({ orderBy: [{ level: 'asc' }, { id: 'asc' }] });
  return rows.map(row => row.payload as unknown as ChallengeData);
}

export async function findChallenge(idOrSlug: string): Promise<ChallengeData | null> {
  const row = await prisma.challenge.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } });
  return row ? row.payload as unknown as ChallengeData : null;
}
