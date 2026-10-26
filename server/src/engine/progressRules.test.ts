import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceUtcStreak, hasAnsweredMultiSelect, hasAnsweredSingleSelect } from './progressRules.js';

test('UTC streak advances once on a new UTC day and stays stable on retries', () => {
  const dayOne = new Date('2026-04-12T23:59:00.000Z');
  const sameDayAfterMidnightLocal = new Date('2026-04-12T23:59:59.000Z');
  const nextUtcDay = new Date('2026-04-13T00:01:00.000Z');
  assert.equal(advanceUtcStreak(1, dayOne.toISOString(), sameDayAfterMidnightLocal), 1);
  assert.equal(advanceUtcStreak(1, dayOne.toISOString(), nextUtcDay), 2);
  assert.equal(advanceUtcStreak(2, nextUtcDay.toISOString(), nextUtcDay), 2);
});

test('UTC streak resets after a missed day and starts at one for absent or invalid history', () => {
  assert.equal(advanceUtcStreak(5, '2026-04-10T23:59:00.000Z', new Date('2026-04-12T00:01:00.000Z')), 1);
  assert.equal(advanceUtcStreak(0, undefined, new Date('2026-04-12T00:01:00.000Z')), 1);
  assert.equal(advanceUtcStreak(4, 'invalid', new Date('2026-04-12T00:01:00.000Z')), 1);
});

test('a blank quiz submission does not count as a learning activity', () => {
  assert.equal(hasAnsweredSingleSelect({}), false);
  assert.equal(hasAnsweredSingleSelect({ q1: null, q2: '' }), false);
  assert.equal(hasAnsweredSingleSelect({ q1: 'a' }), true);
  assert.equal(hasAnsweredMultiSelect({ q1: [], q2: [] }), false);
  assert.equal(hasAnsweredMultiSelect({ q1: ['array'] }), true);
});

test('level unlock progress uses distinct passed counts and the established 3/3/2 boundaries', async () => {
  const { summarizeProgression, summarizeUserProgress } = await import('./progressRules.js');
  const challenges = [
    ...['a', 'b', 'c', 'd'].map(id => ({ id, level: 1, rewardXp: 100 })),
    ...['e', 'f', 'g'].map(id => ({ id, level: 2, rewardXp: 150 })),
    ...['h', 'i'].map(id => ({ id, level: 3, rewardXp: 250 })),
    { id: 'j', level: 4, rewardXp: 400 }
  ];
  assert.deepEqual(summarizeProgression(challenges).levels.map(item => item.rewardXpValues), [[100], [150], [250], [400]]);
  const newUser = summarizeUserProgress(challenges, new Set());
  assert.equal(newUser.unlockedLevel, 1);
  assert.deepEqual(newUser.nextUnlock, { level: 2, fromLevel: 1, passed: 0, required: 3, percentage: 0 });
  const beforeBoundary = summarizeUserProgress(challenges, new Set(['a', 'b']));
  assert.equal(beforeBoundary.unlockedLevel, 1);
  assert.equal(beforeBoundary.nextUnlock?.percentage, 67);
  const atBoundary = summarizeUserProgress(challenges, new Set(['a', 'b', 'c']));
  assert.equal(atBoundary.unlockedLevel, 2);
  assert.deepEqual(atBoundary.nextUnlock, { level: 3, fromLevel: 2, passed: 0, required: 3, percentage: 0 });
  const final = summarizeUserProgress(challenges, new Set(['a', 'b', 'c', 'e', 'f', 'g', 'h', 'i']));
  assert.equal(final.unlockedLevel, 4);
  assert.equal(final.hasNextLevel, false);
  assert.equal(final.nextUnlock, null);
});

test('progress ignores orphan IDs and does not trust a stale persisted unlock without passed records', async () => {
  const { summarizeUserProgress } = await import('./progressRules.js');
  const challenges = ['a', 'b', 'c'].map(id => ({ id, level: 1, rewardXp: 100 }));
  const summary = summarizeUserProgress(challenges, new Set(['a', 'b', 'c', 'orphan']));
  assert.equal(summary.completedChallenges, 3);
  assert.equal(summary.unlockedLevel, 2);
  assert.equal(summary.level, 2);
  const inconsistent = summarizeUserProgress(challenges, new Set());
  assert.equal(inconsistent.unlockedLevel, 1);
  assert.equal(inconsistent.completedChallenges, 0);
});
