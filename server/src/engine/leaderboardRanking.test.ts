import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateAllTimeXp } from './xpAccounting.js';
import { rankLeaderboardUsers, selectLeaderboardWindow, type LeaderboardUserInput } from './leaderboardRanking.js';

const challenges = [
  { id: 'a', level: 1 }, { id: 'b', level: 1 }, { id: 'c', level: 1 },
  { id: 'd', level: 2 }, { id: 'e', level: 2 }, { id: 'f', level: 2 },
  { id: 'g', level: 3 }, { id: 'h', level: 3 }
];

function user(id: string, createdAt: string, xp: number, attempts: LeaderboardUserInput['attempts'] = [], badgeXp = 0): LeaderboardUserInput {
  return {
    id, name: id, avatar: '', title: '', createdAt,
    completionRewards: xp ? [{ completedAt: createdAt, rewardXp: xp }] : [],
    badgeRewards: badgeXp ? [{ unlockedAt: createdAt, xpBonus: badgeXp }] : [], attempts
  };
}

function rank(users: LeaderboardUserInput[]) {
  return rankLeaderboardUsers(users, challenges, calculateAllTimeXp);
}

test('official rank and displayed XP both use challenge and badge all-time XP, never legacy score', () => {
  const ranked = rank([
    user('legacy-high-score', '2024-01-01', 100),
    user('actual-xp-leader', '2024-02-01', 200, [], 50)
  ]);
  assert.deepEqual(ranked.map(item => [item.id, item.rank, item.xp]), [
    ['actual-xp-leader', 1, 250], ['legacy-high-score', 2, 100]
  ]);
});

test('equal XP including multiple zero-XP accounts receives stable unique positions', () => {
  const ranked = rank([
    user('z-user', '2024-01-02', 0),
    user('b-user', '2024-01-01', 0),
    user('a-user', '2024-01-01', 0)
  ]);
  assert.deepEqual(ranked.map(item => [item.id, item.rank, item.xp]), [
    ['a-user', 1, 0], ['b-user', 2, 0], ['z-user', 3, 0]
  ]);
});

test('one zero-XP account ranks first numerically', () => {
  assert.deepEqual(rank([user('only', '2024-01-01', 0)]).map(item => item.rank), [1]);
});

test('rank derives level from distinct passed challenge thresholds rather than XP', () => {
  const ranked = rank([user('user', '2024-01-01', 9000, [
    { challengeId: 'a', status: 'passed' }, { challengeId: 'a', status: 'passed' },
    { challengeId: 'b', status: 'passed' }, { challengeId: 'c', status: 'passed' }
  ])]);
  assert.equal(ranked[0].level, 2);
  assert.equal(ranked[0].completedChallenges, 3);
});

test('replayed completions are not invented; ranking consumes the unique persisted reward rows', () => {
  const ranked = rank([user('user', '2024-01-01', 100, [
    { challengeId: 'a', status: 'passed' }, { challengeId: 'a', status: 'passed' }
  ])]);
  assert.equal(ranked[0].xp, 100);
  assert.equal(ranked[0].completedChallenges, 1);
});

test('top-N selection returns actual global rank outside the window and avoids replacing it with N+1', () => {
  const ranked = rank(Array.from({ length: 27 }, (_, index) => user(`u-${index}`, new Date(Date.UTC(2024, 0, index + 1)).toISOString(), 1000 - index * 10)));
  const result = selectLeaderboardWindow(ranked, 'u-26', 20);
  assert.equal(result.leaderboard.length, 20);
  assert.equal(result.total, 27);
  assert.equal(result.currentUser?.id, 'u-26');
  assert.equal(result.currentUser?.rank, 27);
  assert.equal(selectLeaderboardWindow(ranked, 'u-0', 20).currentUser?.rank, 1);
  assert.equal(selectLeaderboardWindow(ranked, 'missing', 20).currentUser, null);
});
