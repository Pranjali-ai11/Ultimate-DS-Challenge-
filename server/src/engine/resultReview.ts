type AttemptForReview = {
  id: string;
  challenge_id: string;
  submission_id?: string | null;
  selected_structures: unknown;
  score: number;
  status: string;
  completed_at: Date;
  feedback?: unknown;
  challenge?: { title?: string; payload?: unknown };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function serializeAttemptReview(attempt: AttemptForReview) {
  const feedback = asRecord(attempt.feedback);
  const review = asRecord(feedback?.review);
  const payload = asRecord(attempt.challenge?.payload);
  return {
    attemptId: attempt.id,
    questionId: attempt.challenge_id,
    submissionId: attempt.submission_id || (typeof feedback?.submissionId === 'string' ? feedback.submissionId : null),
    title: typeof review?.title === 'string' ? review.title : attempt.challenge?.title || 'Historical challenge',
    question: typeof review?.question === 'string' ? review.question : typeof payload?.question === 'string' ? payload.question : typeof payload?.missionBrief === 'string' ? payload.missionBrief : null,
    selectedAnswer: feedback?.submittedAnswer ?? null,
    selectedAnswerLabel: typeof review?.selectedOptionText === 'string' ? review.selectedOptionText : null,
    correctAnswer: review ? {
      optionIds: Array.isArray(review.correctOptionIds) ? review.correctOptionIds : [],
      label: typeof review.correctOptionText === 'string' ? review.correctOptionText : null,
      structures: Array.isArray(review.correctStructures) ? review.correctStructures : []
    } : null,
    correctness: review ? (review.isCorrect === true ? 'correct' : review.isPartial === true ? 'partial' : 'incorrect') : null,
    marksAwarded: attempt.score,
    explanation: typeof review?.explanation === 'string' ? review.explanation : null,
    correctExplanation: typeof review?.correctExplanation === 'string' ? review.correctExplanation : null,
    coverageTopics: Array.isArray(feedback?.coverageTopics) ? feedback.coverageTopics.filter((item): item is string => typeof item === 'string') : [],
    subtopic: typeof feedback?.syllabusTopic === 'string' ? feedback.syllabusTopic : null,
    completedAt: attempt.completed_at.toISOString(),
    answerDetailsAvailable: Boolean(review && feedback && 'submittedAnswer' in feedback)
  };
}

