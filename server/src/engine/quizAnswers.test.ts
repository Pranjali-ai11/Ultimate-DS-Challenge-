import test from 'node:test';
import assert from 'node:assert/strict';
import { getUnansweredQuestionIds } from './quizAnswers.js';

const questions = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];

test('single-choice quiz remains incomplete until every question has a non-empty choice', () => {
  assert.deepEqual(getUnansweredQuestionIds(questions, { q1: 'a' }, 1), ['q2', 'q3']);
  assert.deepEqual(getUnansweredQuestionIds(questions, { q1: 'a', q2: '', q3: null }, 2), ['q2', 'q3']);
  assert.deepEqual(getUnansweredQuestionIds(questions, { q1: 'b', q2: 'a', q3: 'c' }, 2), []);
});

test('multi-select quiz requires a non-empty array for every question', () => {
  assert.deepEqual(getUnansweredQuestionIds(questions, { q1: ['array'], q2: [] }, 3), ['q2', 'q3']);
  assert.deepEqual(getUnansweredQuestionIds(questions, { q1: ['array'], q2: ['stack'], q3: ['queue'] }, 4), []);
});
