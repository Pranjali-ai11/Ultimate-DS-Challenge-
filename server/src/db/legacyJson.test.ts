import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLegacyStore } from './legacyJson.js';
import { INITIAL_CHALLENGES, INITIAL_ACHIEVEMENTS } from '../data/seedData.js';

const user = { id: 'u-test', name: 'Test Learner', email: 'test@example.invalid', password_hash: 'bcrypt-hash', avatar: 'avatar-1', title: 'Learner', bio: '', created_at: '2026-01-01T00:00:00.000Z' };
const fixture = (): any => ({
  users: [[user.id, user], [user.email, user]],
  progress: [['u-test', { id: 'p-test', user_id: user.id, level: 1, unlocked_level: 1, xp: 0, score: 0, completed_challenges: 0, accuracy: 0, streak: 0, last_active: '2026-01-01T00:00:00.000Z' }]],
  attempts: [], userAchievements: [], revokedTokens: []
});

test('legacy import parser deduplicates the store’s id/email aliases and preserves timestamps', () => {
  const parsed = parseLegacyStore(fixture());
  assert.deepEqual(parsed.issues, []);
  assert.equal(parsed.counts.users, 1);
  assert.equal(parsed.counts.progress, 1);
  assert.ok(parsed.data.users[0].created_at instanceof Date);
});

test('legacy import parser reports orphaned and malformed relationships instead of guessing', () => {
  const data = fixture();
  data.attempts = [{ id: 'bad', user_id: 'missing-user', challenge_id: 'missing-challenge', selected_structures: [], score: 0, correctness_score: 0, performance_score: 0, memory_score: 0, complexity_score: 0, simplicity_score: 0, explanation_score: 0, status: 'passed', completed_at: 'not-a-date' }];
  const parsed = parseLegacyStore(data);
  assert.equal(parsed.data.attempts.length, 0);
  assert.equal(parsed.issues.length, 1);
  assert.match(parsed.issues[0], /unresolved user\/challenge reference/);
});

test('legacy import parser validates against actual challenge and achievement catalogs', () => {
  const data = fixture();
  data.attempts = [{ id: 'att-test', user_id: user.id, challenge_id: INITIAL_CHALLENGES[0].id, selected_structures: ['array'], score: 100, correctness_score: 100, performance_score: 100, memory_score: 100, complexity_score: 100, simplicity_score: 100, explanation_score: 100, status: 'passed', completed_at: '2026-01-02T00:00:00.000Z' }];
  data.userAchievements = [{ id: 'ua-test', user_id: user.id, achievement_id: INITIAL_ACHIEVEMENTS[0].code, unlocked_at: '2026-01-02T00:00:00.000Z' }];
  const parsed = parseLegacyStore(data);
  assert.deepEqual(parsed.issues, []);
  assert.equal(parsed.data.attempts[0].reward_awarded, null);
  assert.equal(parsed.data.userAchievements.length, 1);
});

test('legacy importer preserves optional saved-answer submission identifiers', () => {
  const data = fixture();
  data.attempts = [{ id: 'att-review', user_id: user.id, challenge_id: INITIAL_CHALLENGES[0].id, selected_structures: ['array'], score: 100, correctness_score: 100, performance_score: 100, memory_score: 100, complexity_score: 100, simplicity_score: 100, explanation_score: 100, feedback: { submittedAnswer: 'option-a' }, submission_id: 'saved-submission-1', status: 'passed', completed_at: '2026-01-02T00:00:00.000Z' }];
  const parsed = parseLegacyStore(data);
  assert.deepEqual(parsed.issues, []);
  assert.equal(parsed.data.attempts[0].submission_id, 'saved-submission-1');
  assert.deepEqual(parsed.data.attempts[0].feedback, { submittedAnswer: 'option-a' });
});

test('legacy importer flags duplicate question rows inside a grouped submission', () => {
  const data = fixture();
  const base = { user_id: user.id, challenge_id: INITIAL_CHALLENGES[0].id, selected_structures: ['array'], score: 100, correctness_score: 100, performance_score: 100, memory_score: 100, complexity_score: 100, simplicity_score: 100, explanation_score: 100, submission_id: 'same-submission', status: 'passed', completed_at: '2026-01-02T00:00:00.000Z' };
  data.attempts = [{ id: 'att-review-1', ...base }, { id: 'att-review-2', ...base }];
  const parsed = parseLegacyStore(data);
  assert.equal(parsed.data.attempts.length, 1);
  assert.match(parsed.issues[0], /duplicates a question in submission/);
});
