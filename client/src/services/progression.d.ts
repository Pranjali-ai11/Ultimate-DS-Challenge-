import type { ProgressionSummary } from '../types';
export function rewardLabel(progression: ProgressionSummary | null | undefined, level: number): string;
export function challengeCount(progression: ProgressionSummary | null | undefined, level: number): number | null;
export function unlockRequirement(progression: ProgressionSummary | null | undefined, targetLevel: number): string;
