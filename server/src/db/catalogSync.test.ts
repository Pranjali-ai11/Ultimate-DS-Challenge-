import assert from 'node:assert/strict';
import test from 'node:test';
import { isMetadataOnlyChallengeUpdate, isSafeAchievementMetadataUpdate } from './catalogSync.js';

test('catalog sync accepts curated coverage metadata without changing challenge behavior', () => {
  const oldPayload = { id: 'c-l2-01', level: 2, question: 'Find a sorted key.', optimalStructures: ['binary-search'] };
  const newPayload = { ...oldPayload, coverageTopics: ['searching'] };
  assert.equal(isMetadataOnlyChallengeUpdate(oldPayload, newPayload), true);
});

test('catalog sync accepts corrected L1 feedback labels while preserving answer IDs and correctness', () => {
  const oldPayload = {
    id: 'c-l1-10', level: 1, question: 'Find the bound.', availableStructures: ['array'], optimalStructures: ['array'],
    options: [{ id: 'a', isCorrect: true, text: 'Theta n squared', structureId: 'array' }],
    requirements: [{ id: 'r1', label: 'Complexity', critical: true, satisfiedBy: ['array'] }]
  };
  const newPayload = {
    ...oldPayload, availableStructures: ['complexity'], optimalStructures: ['complexity'], coverageTopics: ['complexity'],
    options: [{ id: 'a', isCorrect: true, text: 'Theta n squared', structureId: 'complexity' }],
    requirements: [{ id: 'r1', label: 'Complexity', critical: true, satisfiedBy: ['complexity'] }]
  };
  assert.equal(isMetadataOnlyChallengeUpdate(oldPayload, newPayload), true);
});

test('catalog sync refuses question, answer-key, or higher-level scoring changes', () => {
  const existing = { id: 'c-l2-01', level: 2, question: 'Find a sorted key.', optimalStructures: ['binary-search'] };
  assert.equal(isMetadataOnlyChallengeUpdate(existing, { ...existing, question: 'Changed prompt.' }), false);
  assert.equal(isMetadataOnlyChallengeUpdate(existing, { ...existing, optimalStructures: ['linear-search'] }), false);
});

test('achievement sync allows descriptive changes while preserving IDs and XP', () => {
  const stored = { code: 'tree_architect', name: 'Tree Architect', description: 'Old copy', icon: 'GitBranch', requirement: 'Old rule', xp_bonus: 150 };
  const desired = { ...stored, description: 'Pass three distinct Binary Search Tree challenges.', requirement: 'Pass 3 distinct Binary Search Tree challenges' };
  assert.equal(isSafeAchievementMetadataUpdate(stored, desired), true);
  assert.equal(isSafeAchievementMetadataUpdate(stored, { ...desired, code: 'new_code' }), false);
  assert.equal(isSafeAchievementMetadataUpdate(stored, { ...desired, xp_bonus: 250 }), false);
  assert.equal(isSafeAchievementMetadataUpdate(stored, { ...desired, optionalEnrichment: true }), false);
});
