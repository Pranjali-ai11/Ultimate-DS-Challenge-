import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAllTimeXp, calculatePeriodXp } from './xpAccounting.js';
import { summarizeProgression } from './progressRules.js';

test('all-time XP is the sum of unique recorded challenge rewards and badge bonuses', () => {
  const completions = [
    { completedAt: '2026-10-20T00:00:00.000Z', rewardXp: 100 },
    { completedAt: '2026-10-21T00:00:00.000Z', rewardXp: 150 }
  ];
  const badges = [{ unlockedAt: '2026-10-21T00:01:00.000Z', xpBonus: 50 }];
  assert.equal(calculateAllTimeXp(completions, badges), 300);
});

test('period XP includes full challenge rewards and badge bonuses at UTC window boundaries', () => {
  const now = new Date('2026-10-24T12:00:00.000Z');
  const weeklyBoundary = new Date('2026-10-17T12:00:00.000Z');
  const justOutsideWeek = new Date(weeklyBoundary.getTime() - 1);
  const monthBoundary = new Date('2026-09-24T12:00:00.000Z');
  const totals = calculatePeriodXp(
    [
      { completedAt: weeklyBoundary, rewardXp: 100 },
      { completedAt: justOutsideWeek, rewardXp: 200 },
      { completedAt: monthBoundary, rewardXp: 300 },
      { completedAt: '2026-10-25T00:00:00.000Z', rewardXp: 500 }
    ],
    [
      { unlockedAt: '2026-10-20T00:00:00.000Z', xpBonus: 50 },
      { unlockedAt: '2026-09-20T00:00:00.000Z', xpBonus: 400 }
    ],
    now
  );
  assert.deepEqual(totals, { weekly: 150, monthly: 650 });
});

test('progression reward summary reflects actual challenge reward data and counts', () => {
  const summary = summarizeProgression([
    { id: 'a', level: 1, rewardXp: 100 }, { id: 'b', level: 1, rewardXp: 125 },
    { id: 'c', level: 2, rewardXp: 150 }
  ]);
  assert.equal(summary.totalChallenges, 3);
  assert.deepEqual(summary.levels[0], { level: 1, totalChallenges: 2, rewardXpValues: [100, 125] });
  assert.deepEqual(summary.unlockRequirements, [
    { targetLevel: 2, previousLevel: 1, requiredPassed: 3 },
    { targetLevel: 3, previousLevel: 2, requiredPassed: 3 },
    { targetLevel: 4, previousLevel: 3, requiredPassed: 2 }
  ]);
});
