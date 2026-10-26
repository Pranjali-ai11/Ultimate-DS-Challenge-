import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePracticeExposure } from './practiceExposure.js';

const challenges = [
  { id: 'a', coverageTopics: ['array'] },
  { id: 'b', coverageTopics: ['array'] },
  { id: 'c', coverageTopics: ['stack', 'queue'] },
  { id: 'deque-a', coverageTopics: ['deque'] },
  { id: 'deque-b', coverageTopics: ['double-ended-queue'] },
  { id: 'd', coverageTopics: ['binary-heap'] },
  { id: 'e', coverageTopics: ['descending-priority-queue'] },
  { id: 'unmapped', coverageTopics: ['searching'] }
];

test('exposure starts at zero and uses distinct passed relevant challenges over catalog total', () => {
  const empty = calculatePracticeExposure(challenges, []);
  assert.deepEqual(empty.array, { passed: 0, total: 2, percentage: 0 });
  const one = calculatePracticeExposure(challenges, [{ challenge_id: 'a', status: 'passed' }]);
  assert.deepEqual(one.array, { passed: 1, total: 2, percentage: 50 });
  const all = calculatePracticeExposure(challenges, [
    { challenge_id: 'a', status: 'passed' },
    { challenge_id: 'b', status: 'passed' }
  ]);
  assert.deepEqual(all.array, { passed: 2, total: 2, percentage: 100 });
});

test('replays and failures do not increase exposure, and values cannot exceed 100%', () => {
  const exposure = calculatePracticeExposure(challenges, [
    { challenge_id: 'a', status: 'passed' },
    { challenge_id: 'a', status: 'passed' },
    { challenge_id: 'b', status: 'failed' },
    { challenge_id: 'not-in-catalog', status: 'passed' }
  ]);
  assert.deepEqual(exposure.array, { passed: 1, total: 2, percentage: 50 });
  assert.ok(Object.values(exposure).every(value => value.percentage <= 100));
});

test('one multi-topic challenge contributes once to each topic and aliases are explicit', () => {
  const exposure = calculatePracticeExposure(challenges, [{ challenge_id: 'c', status: 'passed' }, { challenge_id: 'd', status: 'passed' }]);
  assert.deepEqual(exposure.stack, { passed: 1, total: 1, percentage: 100 });
  assert.deepEqual(exposure.queue, { passed: 1, total: 1, percentage: 100 });
  assert.deepEqual(exposure.heap, { passed: 1, total: 1, percentage: 100 });
  assert.deepEqual(exposure['priority-queue'], { passed: 0, total: 1, percentage: 0 });
});

test('Deque exposure is separate from Queue and uses curated deque coverage', () => {
  const exposure = calculatePracticeExposure(challenges, [
    { challenge_id: 'deque-a', status: 'passed' },
    { challenge_id: 'deque-a', status: 'passed' },
    { challenge_id: 'deque-b', status: 'failed' }
  ]);
  assert.deepEqual(exposure.deque, { passed: 1, total: 2, percentage: 50 });
  assert.deepEqual(exposure.queue, { passed: 0, total: 1, percentage: 0 });
});

test('zero-denominator topics are safely represented as zero percent with total zero', () => {
  const exposure = calculatePracticeExposure([{ id: 'other', coverageTopics: ['searching'] }], []);
  assert.deepEqual(exposure.graph, { passed: 0, total: 0, percentage: 0 });
  assert.deepEqual(exposure.bst, { passed: 0, total: 0, percentage: 0 });
});

test('challenge prose and distractor choices do not create structure associations', () => {
  const exposure = calculatePracticeExposure([
    { id: 'incidental', coverageTopics: ['array'], optimalStructures: ['graph', 'hash-table'], availableStructures: ['graph', 'hash-table'], question: 'Use a graph and hash table.' }
  ], [{ challenge_id: 'incidental', status: 'passed' }]);
  assert.equal(exposure.array.total, 1);
  assert.equal(exposure.graph.total, 0);
  assert.equal(exposure['hash-table'].total, 0);
});
