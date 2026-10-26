import assert from 'node:assert/strict';
import test from 'node:test';
import type { AchievementProgress } from './achievementRules.js';
import { summarizeDashboardBadges, summarizeDashboardNextStep, summarizeOverallCompletion } from './dashboardAnalytics.js';

test('overall completion uses unique catalog IDs, ignores unknown IDs, and clamps safely', () => {
  const catalog = [{ id: 'a', level: 1 }, { id: 'a', level: 1 }, { id: 'b', level: 2 }];
  assert.deepEqual(summarizeOverallCompletion(catalog, new Set()), { passed: 0, total: 2, percentage: 0 });
  assert.deepEqual(summarizeOverallCompletion(catalog, new Set(['a', 'a', 'unknown'])), { passed: 1, total: 2, percentage: 50 });
  assert.deepEqual(summarizeOverallCompletion(catalog, new Set(['a', 'b', 'unknown'])), { passed: 2, total: 2, percentage: 100 });
  assert.deepEqual(summarizeOverallCompletion([], new Set(['unknown'])), { passed: 0, total: 0, percentage: 0 });
});

test('badge summary uses actual unique badge catalog, excludes earned and eligible badges, and selects closest measurable badge', () => {
  const states: AchievementProgress[] = [
    { code: 'earned', category: 'Structure', current: 3, target: 3, percent: 100, progressType: 'count', progressLabel: '3 / 3 challenges', eligible: true, earned: true, almostEarned: false },
    { code: 'near', category: 'Structure', current: 2, target: 3, percent: 67, progressType: 'count', progressLabel: '2 / 3 challenges', eligible: false, earned: false, almostEarned: true },
    { code: 'far', category: 'Structure', current: 1, target: 4, percent: 25, progressType: 'count', progressLabel: '1 / 4 challenges', eligible: false, earned: false, almostEarned: false },
    { code: 'milestone', category: 'Milestone', current: 0, progressType: 'status', progressLabel: 'Not yet met', eligible: false, earned: false, almostEarned: false }
  ];
  assert.deepEqual(summarizeDashboardBadges(['earned', 'near', 'far', 'milestone', 'near'], states, new Set(['earned'])), {
    total: 4, earned: 1, nearest: { code: 'near', current: 2, target: 3, percentage: 67, progressLabel: '2 / 3' }
  });
  assert.deepEqual(summarizeDashboardBadges([], [], new Set()), { total: 0, earned: 0, nearest: null });
});

test('next step preserves unlock progress separately from mission completion and handles final completion', () => {
  assert.deepEqual(summarizeDashboardNextStep({ level: 1, completedAtLevel: 7, totalAtLevel: 32, totalPassed: 7, totalChallenges: 95, nextUnlock: { level: 2, fromLevel: 1, passed: 2, required: 3 } }), {
    label: 'Pass 1 more qualifying Level 1 challenge to unlock Level 2.', path: '/challenges?level=1', completed: false
  });
  assert.deepEqual(summarizeDashboardNextStep({ level: 4, completedAtLevel: 12, totalAtLevel: 12, totalPassed: 95, totalChallenges: 95, nextUnlock: null }), {
    label: 'You have completed all available challenges at the maximum level.', completed: true
  });
});
