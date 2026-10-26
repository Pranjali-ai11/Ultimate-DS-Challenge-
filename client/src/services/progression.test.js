import test from 'node:test';
import assert from 'node:assert/strict';
import { challengeCount, rewardLabel, unlockRequirement } from './progression.js';

const progression = {
  totalChallenges: 5,
  levels: [
    { level: 1, totalChallenges: 2, rewardXpValues: [100] },
    { level: 2, totalChallenges: 3, rewardXpValues: [125, 150] }
  ],
  unlockRequirements: [
    { targetLevel: 2, previousLevel: 1, requiredPassed: 3 },
    { targetLevel: 3, previousLevel: 2, requiredPassed: 3 },
    { targetLevel: 4, previousLevel: 3, requiredPassed: 2 }
  ]
};

test('reward and challenge labels use server progression metadata without fallback numbers', () => {
  assert.equal(rewardLabel(progression, 1), '+100 XP per challenge');
  assert.equal(rewardLabel(progression, 2), '+125 / 150 XP by challenge');
  assert.equal(rewardLabel(null, 1), 'Reward details unavailable');
  assert.equal(challengeCount(progression, 2), 3);
  assert.equal(challengeCount(null, 2), null);
});

test('unlock text uses server thresholds and does not invent a requirement', () => {
  assert.equal(unlockRequirement(progression, 2), 'Complete Level 1 to unlock');
  assert.equal(unlockRequirement(progression, 3), 'Complete Level 2 to unlock');
  assert.equal(unlockRequirement(progression, 4), 'Complete Level 3 to unlock');
  assert.equal(unlockRequirement(null, 4), 'Available by default.');
});
