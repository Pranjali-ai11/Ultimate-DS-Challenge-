import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllTimeLeaderboardRequest } from './leaderboardController.js';

test('leaderboard accepts only the all-time mode and rejects period ranking modes', () => {
  assert.equal(isAllTimeLeaderboardRequest(undefined), true);
  assert.equal(isAllTimeLeaderboardRequest('all-time'), true);
  assert.equal(isAllTimeLeaderboardRequest('weekly'), false);
  assert.equal(isAllTimeLeaderboardRequest('monthly'), false);
  assert.equal(isAllTimeLeaderboardRequest('7-days'), false);
});
