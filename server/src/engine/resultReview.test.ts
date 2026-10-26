import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeAttemptReview } from './resultReview.js';

const completedAt = new Date('2026-10-25T10:00:00.000Z');

test('saved result serialization preserves the submitted answer and trusted review fields', () => {
  const result = serializeAttemptReview({
    id: 'attempt-1', challenge_id: 'question-1', submission_id: 'submission-1', selected_structures: ['stack'], score: 100,
    status: 'passed', completed_at: completedAt,
    feedback: { version: 1, submissionId: 'submission-1', level: 1, submittedAnswer: 'option-c', coverageTopics: ['stack'], syllabusTopic: 'LIFO tracing', review: {
      title: 'Stack trace', question: 'What is on top?', selectedOptionText: 'C', correctOptionIds: ['option-c'], correctOptionText: 'C', isCorrect: true, isPartial: false, explanation: 'Push C last.', correctExplanation: 'Correct.'
    } }
  });
  assert.equal(result.questionId, 'question-1');
  assert.equal(result.selectedAnswer, 'option-c');
  assert.equal(result.correctAnswer?.label, 'C');
  assert.equal(result.correctness, 'correct');
  assert.equal(result.coverageTopics[0], 'stack');
  assert.equal(result.answerDetailsAvailable, true);
});

test('historical attempts without feedback are marked unavailable without inventing answers', () => {
  const result = serializeAttemptReview({
    id: 'old-attempt', challenge_id: 'old-question', selected_structures: ['array'], score: 50,
    status: 'failed', completed_at: completedAt, feedback: null,
    challenge: { title: 'Old question', payload: { missionBrief: 'Historical prompt' } }
  });
  assert.equal(result.question, 'Historical prompt');
  assert.equal(result.selectedAnswer, null);
  assert.equal(result.correctAnswer, null);
  assert.equal(result.answerDetailsAvailable, false);
});
