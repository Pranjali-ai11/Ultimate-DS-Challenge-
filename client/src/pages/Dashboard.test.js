import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const dashboardSource = await readFile(fileURLToPath(new URL('./Dashboard.tsx', import.meta.url)), 'utf8');

test('Dashboard omits syllabus-unit progress while retaining approved progress cards', () => {
  assert.doesNotMatch(dashboardSource, /Syllabus Unit Progress|syllabus-progress-heading|Unit \['I', 'II'/);
  assert.match(dashboardSource, /Practice Exposure/);
  assert.match(dashboardSource, /'deque': 'Deque'/);
  assert.match(dashboardSource, /Mission completion/);
  assert.match(dashboardSource, /Next Step:/);
  assert.match(dashboardSource, /Badges Earned/);
  assert.match(dashboardSource, /Nearest badge/);
});

test('Leaderboard UI exposes only all-time ranking and the approved row fields', async () => {
  const leaderboardSource = await readFile(fileURLToPath(new URL('./Leaderboard.tsx', import.meta.url)), 'utf8');
  assert.doesNotMatch(leaderboardSource, /weekly|monthly|7 Days|30 Days|Top This Week|Monthly Champions/i);
  assert.match(leaderboardSource, /All-Time Rankings/);
  assert.match(leaderboardSource, /Your Rank/);
  assert.match(leaderboardSource, /isCurrentUser/);
  assert.match(leaderboardSource, /TOTAL XP/);
  assert.doesNotMatch(leaderboardSource, /SCORE|BADGES|CHALLENGES/);
});
