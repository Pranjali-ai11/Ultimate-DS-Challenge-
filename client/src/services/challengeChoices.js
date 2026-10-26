/** Return a shuffled copy without mutating the challenge catalog. */
export function shuffleChoices(values, random = Math.random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const sample = random();
    const boundedSample = Number.isFinite(sample) ? Math.min(Math.max(sample, 0), 0.9999999999999999) : 0;
    const swapIndex = Math.floor(boundedSample * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/** Shuffle only choice display order; answer IDs and question data remain unchanged. */
export function shuffleChallengeChoices(question, random = Math.random) {
  return {
    ...question,
    ...(Array.isArray(question.options) ? { options: shuffleChoices(question.options, random) } : {}),
    ...(Array.isArray(question.availableStructures) ? { availableStructures: shuffleChoices(question.availableStructures, random) } : {})
  };
}
