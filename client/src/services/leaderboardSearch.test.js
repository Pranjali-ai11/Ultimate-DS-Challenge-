import test from 'node:test';
import assert from 'node:assert/strict';
import { filterLeaderboardUsers } from './leaderboardSearch.js';

const users = [
  { id: 'a', name: 'Priya Sharma', title: 'Novice Architect', rank: 1 },
  { id: 'b', name: 'Kavya Yaadav', title: 'Novice Architect', rank: 4 }
];

test('leaderboard search matches public names and keeps original global ranks', () => {
  const filtered = filterLeaderboardUsers(users, 'kavya');

  assert.deepEqual(filtered.map(user => ({ name: user.name, rank: user.rank })), [
    { name: 'Kavya Yaadav', rank: 4 }
  ]);
  assert.deepEqual(users.map(user => user.rank), [1, 4]);
});

test('leaderboard search does not search role titles and preserves the list for a blank query', () => {
  assert.deepEqual(filterLeaderboardUsers(users, 'architect'), []);
  assert.equal(filterLeaderboardUsers(users, '   '), users);
});
