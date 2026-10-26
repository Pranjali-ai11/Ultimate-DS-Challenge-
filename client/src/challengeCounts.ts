export const REQUIRED_CHALLENGES_BY_LEVEL = [0, 21, 25, 9, 6] as const;
export const REQUIRED_CHALLENGE_COUNT = REQUIRED_CHALLENGES_BY_LEVEL.slice(1).reduce<number>((sum, count) => sum + count, 0);
