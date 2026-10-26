import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleChoices, shuffleChallengeChoices } from './challengeChoices.js';

test('Fisher-Yates shuffles a copy and does not mutate the source choices', () => {
  const choices = ['A', 'B', 'C', 'D'];
  const shuffled = shuffleChoices(choices, () => 0);

  assert.deepEqual(choices, ['A', 'B', 'C', 'D']);
  assert.deepEqual(shuffled, ['B', 'C', 'D', 'A']);
  assert.notEqual(shuffled, choices);
});

test('challenge choices retain stable answer IDs and correctness while display order changes', () => {
  const question = {
    id: 'question-1',
    options: [
      { id: 'a', text: 'first', isCorrect: true },
      { id: 'b', text: 'second', isCorrect: false },
      { id: 'c', text: 'third', isCorrect: false },
      { id: 'd', text: 'fourth', isCorrect: false }
    ],
    availableStructures: ['array', 'stack', 'queue'],
    optimalStructures: ['array']
  };
  const shuffled = shuffleChallengeChoices(question, () => 0);

  assert.deepEqual(question.options.map(option => option.id), ['a', 'b', 'c', 'd']);
  assert.deepEqual(shuffled.options.map(option => option.id), ['b', 'c', 'd', 'a']);
  assert.deepEqual([...shuffled.options].filter(option => option.isCorrect).map(option => option.id), ['a']);
  assert.deepEqual([...shuffled.availableStructures].sort(), ['array', 'queue', 'stack']);
  assert.deepEqual(shuffled.optimalStructures, ['array']);
  assert.deepEqual(question.availableStructures, ['array', 'stack', 'queue']);
});

test('answer selection remains tied to an option ID after display order changes', () => {
  const selectedOptionId = 'stable-choice-id';
  const choices = shuffleChoices([
    { id: selectedOptionId, text: 'answer' },
    { id: 'other', text: 'distractor' }
  ], () => 0);

  assert.equal(choices.find(option => option.id === selectedOptionId).id, selectedOptionId);
});

test('a new shuffle can be generated for a new question lifecycle', () => {
  const choices = ['A', 'B', 'C', 'D'];
  const first = shuffleChoices(choices, () => 0);
  const second = shuffleChoices(choices, () => 0.999999);

  assert.notDeepEqual(first, second);
  assert.deepEqual(choices, ['A', 'B', 'C', 'D']);
});
