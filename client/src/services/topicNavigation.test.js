import test from 'node:test';
import assert from 'node:assert/strict';
import { findTopicEntry, resolveTopicVisualizer } from './topicNavigation.js';

const registry = [
  { id: 'stack', name: 'Stack', aliases: ['lifo'], visualizerIds: ['stack'] },
  { id: 'matrix-sparse-matrix', name: 'Matrix and Sparse Matrix', aliases: ['matrix'], visualizerIds: ['matrix'] }
];
const choices = [{ id: 'stack' }, { id: 'matrix' }];

test('topic deep links resolve canonical names and aliases to the mapped visualizer', () => {
  assert.equal(findTopicEntry(' LIFO ', registry)?.id, 'stack');
  assert.equal(resolveTopicVisualizer('Matrix', registry, choices)?.id, 'matrix');
  assert.equal(resolveTopicVisualizer('stack', registry, choices)?.id, 'stack');
});

test('unknown topics are rejected without choosing an unrelated visualizer', () => {
  assert.equal(findTopicEntry('not-a-topic', registry), undefined);
  assert.equal(resolveTopicVisualizer('not-a-topic', registry, choices), undefined);
});
