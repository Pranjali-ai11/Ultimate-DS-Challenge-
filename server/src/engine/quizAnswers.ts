type QuizQuestion = {
  id: string;
  options?: Array<{ id: string }>;
  availableStructures?: string[];
};

/** Lists questions without a non-empty answer of the shape used by this level. */
export function getUnansweredQuestionIds(
  questions: QuizQuestion[],
  answers: Record<string, unknown>,
  level: number
): string[] {
  return questions.filter(question => {
    const answer = answers[question.id];
    if (level <= 2) return typeof answer !== 'string' || answer.trim().length === 0;
    return !Array.isArray(answer) || answer.length === 0 || answer.some(choice => typeof choice !== 'string' || !choice.trim());
  }).map(question => question.id);
}
