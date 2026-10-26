export function shuffleChoices<T>(values: readonly T[], random?: () => number): T[];

export function shuffleChallengeChoices<T extends {
  options?: readonly unknown[];
  availableStructures?: readonly string[];
}>(question: T, random?: () => number): T & {
  options?: unknown[];
  availableStructures?: string[];
};
