import test from 'node:test';
import assert from 'node:assert/strict';
import { makeStoredSubmissionFeedback } from './submissionReview.js';

test('answer persistence retains the actual level-specific submitted representation', () => {
  const cases: Array<{ level: number; answer: string | string[] }> = [
    { level: 1, answer: 'option-id-4' },
    { level: 2, answer: 'linked-list' },
    { level: 3, answer: ['array', 'queue'] },
    { level: 4, answer: ['heap', 'graph'] }
  ];
  for (const item of cases) {
    const feedback = makeStoredSubmissionFeedback({ submissionId: 'sub-1', level: item.level, submittedAnswer: item.answer, coverageTopics: ['queue'], syllabusTopic: 'test topic', review: { isCorrect: true, score: 100 } });
    assert.deepEqual(feedback.submittedAnswer, item.answer);
    assert.equal(feedback.level, item.level);
  }
});

test('attempt feedback stores only server review data and does not invent component metrics', () => {
  const feedback = makeStoredSubmissionFeedback({ submissionId: 'sub-2', level: 1, submittedAnswer: null, coverageTopics: [], review: { score: 0, isCorrect: false } });
  assert.equal('performance_score' in feedback, false);
  assert.equal('correctAnswer' in feedback, false);
  assert.equal((feedback.review as Record<string, unknown>).isCorrect, false);
});
