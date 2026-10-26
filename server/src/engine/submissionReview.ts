export type StoredSubmissionAnswer = string | string[] | null;

export function makeStoredSubmissionFeedback(input: {
  submissionId: string;
  level: number;
  submittedAnswer: StoredSubmissionAnswer;
  coverageTopics: string[];
  syllabusTopic?: string;
  review: Record<string, unknown>;
}) {
  return JSON.parse(JSON.stringify({
    version: 1,
    submissionId: input.submissionId,
    level: input.level,
    submittedAnswer: input.submittedAnswer,
    coverageTopics: input.coverageTopics,
    syllabusTopic: input.syllabusTopic || null,
    review: input.review
  })) as Record<string, unknown>;
}
