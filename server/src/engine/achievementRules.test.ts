import test from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievementDefinitions.js';
import { INITIAL_ACHIEVEMENTS } from '../data/seedData.js';
import { FODS_REQUIRED_CHALLENGES } from '../data/fodsQuestionBank.js';
import { calculateAchievementProgress, getQualifiedAchievementCodes, getUnawardedAchievementCodes } from './achievementRules.js';

const empty = { definitions: ACHIEVEMENT_DEFINITIONS, challenges: FODS_REQUIRED_CHALLENGES, attempts: [], streak: 0 };
const structureBadges = ACHIEVEMENT_DEFINITIONS.filter(item => item.category === 'Structure');

test('all ten structure badges use reachable canonical coverageTopics and justified targets', () => {
  assert.equal(structureBadges.length, 10);
  const expected = new Map([
    ['array_ace', ['array', 5]], ['linked_list_navigator', ['linked-list', 4]], ['stack_master', ['stack', 3]],
    ['queue_master', ['queue', 3]], ['deque_specialist', ['deque', 3]], ['priority_strategist', ['priority-queue', 4]],
    ['heap_engineer', ['heap', 3]], ['tree_architect', ['bst', 3]], ['hashing_expert', ['hash-table', 4]], ['graph_explorer', ['graph', 3]]
  ]);
  for (const badge of structureBadges) {
    const rule = badge.rule;
    if (rule.type !== 'topic') throw new Error(`${badge.code} must be a topic badge`);
    const available = new Set(FODS_REQUIRED_CHALLENGES.filter(challenge => challenge.coverageTopics.includes(rule.topic)).map(challenge => challenge.id)).size;
    assert.ok(rule.target <= available, `${badge.code} target exceeds its ${available}-challenge pool`);
    assert.deepEqual([rule.topic, rule.target], expected.get(badge.code));
  }
});

test('badge catalog preserves ten existing IDs, adds five unique definitions, and keeps existing XP rewards', () => {
  assert.equal(ACHIEVEMENT_DEFINITIONS.length, 15);
  assert.equal(INITIAL_ACHIEVEMENTS.length, ACHIEVEMENT_DEFINITIONS.length);
  assert.equal(new Set(ACHIEVEMENT_DEFINITIONS.map(item => item.code)).size, 15);
  const existingRewards = new Map([
    ['first_blood', 50], ['stack_master', 100], ['queue_master', 100], ['tree_architect', 150],
    ['graph_explorer', 150], ['hashing_expert', 150], ['hybrid_designer', 200],
    ['system_architect', 300], ['complexity_master', 200], ['streak_master', 150]
  ]);
  for (const [code, xp] of existingRewards) assert.equal(ACHIEVEMENT_DEFINITIONS.find(item => item.code === code)?.xpBonus, xp);
  assert.ok(ACHIEVEMENT_DEFINITIONS.every(item => !/optional enrichment/i.test(item.description + ' ' + item.requirement)));
});

test('topic badges count distinct passed catalog IDs by coverageTopics only', () => {
  const targetBadge = ACHIEVEMENT_DEFINITIONS.find(item => item.code === 'stack_master')!;
  const ids = FODS_REQUIRED_CHALLENGES.filter(challenge => challenge.coverageTopics.includes('stack')).slice(0, 3).map(challenge => challenge.id);
  const twoPasses = ids.slice(0, 2).map(challenge_id => ({ challenge_id, status: 'passed', score: 100 }));
  const current = calculateAchievementProgress({ ...empty, attempts: [...twoPasses, { challenge_id: ids[0], status: 'passed', score: 100 }, { challenge_id: ids[2], status: 'failed', score: 0 }] });
  assert.equal(current.find(item => item.code === targetBadge.code)?.current, 2);
  assert.equal(current.find(item => item.code === targetBadge.code)?.eligible, false);
  const completed = getQualifiedAchievementCodes({ ...empty, attempts: [...twoPasses, { challenge_id: ids[2], status: 'passed', score: 100 }] });
  assert.ok(completed.includes('stack_master'));
  assert.ok(!completed.includes('queue_master'));
});

test('learner selections and answer metadata cannot substitute for coverageTopics', () => {
  const badge = ACHIEVEMENT_DEFINITIONS.find(item => item.code === 'graph_explorer')!;
  const challenge = { id: 'unmapped', level: 1, coverageTopics: [], optimalStructures: ['graph'], question: 'graph', selected_structures: ['graph'] };
  const attempts = Array.from({ length: 3 }, () => ({ challenge_id: 'unmapped', status: 'passed', score: 100 }));
  const progress = calculateAchievementProgress({ definitions: [badge], challenges: [challenge], attempts, streak: 0 });
  assert.equal(progress[0].current, 0);
  assert.equal(progress[0].eligible, false);
});

test('a passed multi-topic challenge contributes once to every mapped topic badge', () => {
  const id = 'c-l3-13';
  const progress = calculateAchievementProgress({ ...empty, attempts: [{ challenge_id: id, status: 'passed', score: 100 }] });
  assert.equal(progress.find(item => item.code === 'graph_explorer')?.current, 1);
  assert.equal(progress.find(item => item.code === 'queue_master')?.current, 1);
});

test('progress is capped, earned progress stays at target, and almost-earned excludes earned badges', () => {
  const ids = FODS_REQUIRED_CHALLENGES.filter(challenge => challenge.coverageTopics.includes('deque')).slice(0, 4).map(item => item.id);
  const attempts = ids.map(challenge_id => ({ challenge_id, status: 'passed', score: 100 }));
  const progress = calculateAchievementProgress({ ...empty, attempts });
  const deque = progress.find(item => item.code === 'deque_specialist')!;
  assert.equal(deque.current, 3);
  assert.equal(deque.percent, 100);
  assert.equal(deque.eligible, true);
  assert.equal(deque.almostEarned, false);
  const almost = calculateAchievementProgress({ ...empty, attempts: attempts.slice(0, 2) }).find(item => item.code === 'deque_specialist')!;
  assert.equal(almost.progressLabel, '2 / 3 challenges');
  assert.equal(almost.almostEarned, true);
  const stored = calculateAchievementProgress({ ...empty, attempts: attempts.slice(0, 2), earnedCodes: new Set(['deque_specialist']) }).find(item => item.code === 'deque_specialist')!;
  assert.equal(stored.current, 3);
  assert.equal(stored.almostEarned, false);
});

test('general milestone rules are calculated from persistent history', () => {
  const attempt = (challenge_id: string, level: number, score: number) => ({ challenge_id, status: 'passed', score });
  const oneChallenge = calculateAchievementProgress({ ...empty, attempts: [attempt('c-l1-01', 1, 100)] });
  assert.equal(oneChallenge.find(item => item.code === 'first_blood')?.eligible, true);
  assert.equal(oneChallenge.find(item => item.code === 'complexity_master')?.eligible, true);
  assert.equal(oneChallenge.find(item => item.code === 'hybrid_designer')?.eligible, false);
  const catalog = FODS_REQUIRED_CHALLENGES;
  const fullHistory = calculateAchievementProgress({ ...empty, attempts: [
    attempt('c-l3-01', 3, 100), attempt('c-l4-01', 4, 100)
  ], challenges: catalog, streak: 3 });
  assert.equal(fullHistory.find(item => item.code === 'hybrid_designer')?.eligible, true);
  assert.equal(fullHistory.find(item => item.code === 'system_architect')?.eligible, true);
  assert.equal(fullHistory.find(item => item.code === 'streak_master')?.eligible, true);
  const noPerfect = calculateAchievementProgress({ ...empty, attempts: [attempt('c-l3-01', 3, 75)], streak: 2 });
  assert.equal(noPerfect.find(item => item.code === 'hybrid_designer')?.eligible, false);
  assert.equal(noPerfect.find(item => item.code === 'streak_master')?.eligible, false);
});

test('empty and advanced histories produce safe, bounded badge progress', () => {
  const emptyState = calculateAchievementProgress(empty);
  assert.equal(emptyState.filter(item => item.eligible).length, 0);
  assert.equal(emptyState.filter(item => item.earned).length, 0);
  assert.ok(emptyState.every(item => item.current === 0 && (item.percent === undefined || Number.isFinite(item.percent))));
  const allTopicAttempts = FODS_REQUIRED_CHALLENGES.map(challenge => ({ challenge_id: challenge.id, status: 'passed', score: 100 }));
  const advanced = calculateAchievementProgress({ ...empty, attempts: allTopicAttempts, streak: 50 });
  for (const state of advanced.filter(item => item.category === 'Structure')) {
    assert.equal(state.eligible, true, `${state.code} should be reachable from the full catalog`);
    assert.ok(state.current <= (state.target || 0), `${state.code} progress exceeded target`);
  }
});

test('award candidate selection is idempotent for stored and repeated codes', () => {
  assert.deepEqual(getUnawardedAchievementCodes(['array_ace', 'array_ace', 'queue_master'], new Set(['array_ace'])), ['queue_master']);
});
