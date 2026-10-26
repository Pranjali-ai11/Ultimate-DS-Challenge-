import test from 'node:test';
import assert from 'node:assert/strict';
import { ScoringEngine } from './scoringEngine.js';

const requirements = [
  { id: 'lookup', critical: true, satisfiedBy: ['array', 'linked-list'] },
  { id: 'history', critical: true, satisfiedBy: ['linked-list'] }
];

test('multi-select credit follows covered requirements, including valid alternatives', () => {
  const alternative = ScoringEngine.evaluateRequirements({ requirements, selectedStructures: ['linked-list'] });
  assert.equal(alternative.score, 100);
  assert.equal(alternative.coveredCriticalCount, 2);
});

test('partial multi-select credit follows requirement coverage rather than choice count', () => {
  const partial = ScoringEngine.evaluateRequirements({ requirements, selectedStructures: ['array'] });
  assert.equal(partial.coveragePercentage, 50);
  assert.equal(partial.score, 50);
});

test('unneeded offered structures lower architecture score and are identified for feedback', () => {
  const overSelected = ScoringEngine.evaluateRequirements({ requirements, selectedStructures: ['linked-list', 'stack'] });
  assert.equal(overSelected.coveragePercentage, 100);
  assert.equal(overSelected.score, 50);
  assert.deepEqual(overSelected.unnecessarySelections, ['stack']);
});
