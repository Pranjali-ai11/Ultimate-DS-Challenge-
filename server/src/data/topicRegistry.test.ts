import test from 'node:test';
import assert from 'node:assert/strict';
import { CANONICAL_CHALLENGE_TOPICS, FODS_REQUIRED_CHALLENGES } from './fodsQuestionBank.js';
import { getTopic, normalizeTopicId, TOPIC_REGISTRY, validateTopicRegistry } from './topicRegistry.js';

test('central topic registry has unique, valid module and challenge mappings', () => {
  assert.deepEqual(validateTopicRegistry(), []);
  assert.equal(new Set(TOPIC_REGISTRY.map(topic => topic.id)).size, TOPIC_REGISTRY.length);
  for (const topic of TOPIC_REGISTRY) {
    assert.ok(topic.name.length > 0);
    assert.ok(topic.questionIds.every(id => id.length > 0));
  }
  assert.deepEqual([...CANONICAL_CHALLENGE_TOPICS].filter(id => !TOPIC_REGISTRY.some(topic => topic.id === id)), []);
  assert.deepEqual([...new Set(FODS_REQUIRED_CHALLENGES.flatMap(question => question.coverageTopics))].filter(id => !TOPIC_REGISTRY.some(topic => topic.id === id)), []);
});

test('topic registry normalizes known aliases and safely rejects unknown topics', () => {
  assert.equal(normalizeTopicId('LIFO'), 'stack');
  assert.equal(normalizeTopicId('Graph Network'), 'graph');
  assert.equal(normalizeTopicId('BST'), 'bst');
  assert.equal(getTopic('unknown-topic'), undefined);
  assert.equal(normalizeTopicId(undefined), undefined);
});
