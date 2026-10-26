import test from 'node:test';
import assert from 'node:assert/strict';
import { CANONICAL_CHALLENGE_TOPICS, FODS_REQUIRED_CHALLENGES } from './fodsQuestionBank.js';
import { OPTIONAL_ENRICHMENT_CHALLENGES } from './seedData.js';
import { calculatePracticeExposure } from '../engine/practiceExposure.js';

test('active bank contains the recorded four-level distribution and derives its total from those levels', () => {
  const levelCounts = [1, 2, 3, 4].map(level => FODS_REQUIRED_CHALLENGES.filter(item => item.level === level).length);
  assert.deepEqual(levelCounts, [32, 36, 15, 12]);
  assert.equal(FODS_REQUIRED_CHALLENGES.length, levelCounts.reduce((sum, count) => sum + count, 0));
});

test('catalog extension preserves all original IDs and adds only new unique challenge IDs', () => {
  const originalIds = [
    ...Array.from({ length: 21 }, (_, i) => `c-l1-${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 25 }, (_, i) => `c-l2-${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 9 }, (_, i) => `c-l3-${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 6 }, (_, i) => `c-l4-${String(i + 1).padStart(2, '0')}`)
  ];
  const activeIds = new Set(FODS_REQUIRED_CHALLENGES.map(item => item.id));
  assert.ok(originalIds.every(id => activeIds.has(id)), 'an existing challenge ID was removed or renumbered');
  assert.equal(new Set(FODS_REQUIRED_CHALLENGES.map(item => item.id)).size, FODS_REQUIRED_CHALLENGES.length);
});

test('corrected practice exposure uses curated topic metadata and catalog-derived denominators', () => {
  const exposure = calculatePracticeExposure(FODS_REQUIRED_CHALLENGES, []);
  assert.deepEqual(Object.fromEntries(Object.entries(exposure).map(([topic, value]) => [topic, value.total])), {
    array: 28, 'linked-list': 13, stack: 9, queue: 8, deque: 6, 'priority-queue': 8, heap: 7, bst: 6, 'hash-table': 8, graph: 6
  });
  assert.deepEqual(exposure.graph, { passed: 0, total: 6, percentage: 0 });
  assert.deepEqual(exposure.bst, { passed: 0, total: 6, percentage: 0 });
  assert.deepEqual(exposure['hash-table'], { passed: 0, total: 8, percentage: 0 });
  assert.deepEqual(exposure.heap, { passed: 0, total: 7, percentage: 0 });
  assert.equal(FODS_REQUIRED_CHALLENGES.find(item => item.id === 'c-l1-10')?.coverageTopics.includes('array'), false);
  assert.equal(FODS_REQUIRED_CHALLENGES.find(item => item.id === 'c-l1-10')?.optimalStructures[0], 'complexity', 'answer choice metadata reflects the tested concept');
});

test('supplementary structure coverage is distributed across all levels', () => {
  for (const topic of ['heap', 'bst', 'hash-table', 'graph']) {
    const levels = [1, 2, 3, 4].map(level => FODS_REQUIRED_CHALLENGES.filter(item => item.level === level && item.coverageTopics.includes(topic)).length);
    assert.ok(levels.every(count => count > 0), `${topic} is absent from at least one level`);
  }
  assert.equal(FODS_REQUIRED_CHALLENGES.filter(item => item.coverageTopics.includes('deque')).length, 6);
});

test('every item has unique identity and explicit syllabus unit/topic', () => {
  const ids = FODS_REQUIRED_CHALLENGES.map(item => item.id);
  const slugs = FODS_REQUIRED_CHALLENGES.map(item => item.slug);
  assert.equal(new Set(ids).size, ids.length, 'duplicate question IDs');
  assert.equal(new Set(slugs).size, slugs.length, 'duplicate slugs');
  const units = new Set(FODS_REQUIRED_CHALLENGES.map(item => item.syllabusUnit).filter((unit): unit is number => unit !== undefined));
  assert.deepEqual([...units].sort(), [1, 2, 3, 4, 5, 6]);
  for (const item of FODS_REQUIRED_CHALLENGES) {
    if (item.syllabusUnit !== undefined) assert.ok(item.syllabusUnit >= 1 && item.syllabusUnit <= 6, `${item.id} has invalid syllabus unit`);
    else assert.equal(item.category, 'Supplementary', `${item.id} without a syllabus unit must be marked Supplementary`);
    assert.ok(item.syllabusTopic?.trim(), `${item.id} missing syllabus topic`);
    assert.ok(item.question?.trim(), `${item.id} missing prompt`);
    assert.ok(item.rewardXp > 0, `${item.id} has invalid reward`);
    assert.ok(item.coverageTopics?.length, `${item.id} missing curated topic coverage`);
    assert.equal(new Set(item.coverageTopics).size, item.coverageTopics.length, `${item.id} has duplicate coverage tags`);
    for (const topic of item.coverageTopics) assert.ok(CANONICAL_CHALLENGE_TOPICS.has(topic), `${item.id} has noncanonical coverage tag ${topic}`);
  }
  assert.equal(new Set(FODS_REQUIRED_CHALLENGES.map(item => item.question.trim())).size, FODS_REQUIRED_CHALLENGES.length, 'duplicate active question prompt');
});

test('level 1 MCQs have four distinct options and exactly one correct answer', () => {
  for (const item of FODS_REQUIRED_CHALLENGES.filter(question => question.level === 1)) {
    assert.equal(item.options?.length, 4, `${item.id} must have four choices`);
    assert.equal(new Set(item.options?.map(option => option.id)).size, 4, `${item.id} has duplicate option IDs`);
    assert.equal(item.options?.filter(option => option.isCorrect).length, 1, `${item.id} must have exactly one correct option`);
    for (const option of item.options || []) assert.ok(option.explanation?.trim(), `${item.id}/${option.id} missing rationale`);
  }
});

test('level 2 single-choice answers and level 3/4 solutions reference offered choices', () => {
  for (const item of FODS_REQUIRED_CHALLENGES.filter(question => question.level === 2)) {
    assert.equal(item.optimalStructures.length, 1, `${item.id} must have one best choice`);
    assert.ok(item.availableStructures.includes(item.optimalStructures[0]), `${item.id} answer is not offered`);
    assert.ok(item.comparisonCriteria?.length, `${item.id} needs explanatory trade-off feedback`);
    assert.equal(item.comparisonCriteria?.filter(criteria => criteria.bestChoice === item.optimalStructures[0]).length, 1, `${item.id} must have exactly one correct comparison choice`);
    for (const choice of item.availableStructures) assert.ok(item.comparisonCriteria?.some(criteria => criteria.bestChoice === choice && criteria.explanation.trim()), `${item.id}/${choice} needs explanation`);
  }
  for (const item of FODS_REQUIRED_CHALLENGES.filter(question => question.level === 3 || question.level === 4)) {
    assert.ok(item.optimalStructures.length > 0, `${item.id} has no solution`);
    for (const answer of item.optimalStructures) assert.ok(item.availableStructures.includes(answer), `${item.id} solution is not offered: ${answer}`);
    for (const requirement of item.requirements.filter(req => req.critical)) {
      assert.ok(item.optimalStructures.some(answer => requirement.satisfiedBy?.includes(answer)), `${item.id} has uncovered critical requirement ${requirement.id}`);
    }
  }
});


test('supplementary structure choices have matching curated coverage and syllabus units are not invented', () => {
  const supplementary = FODS_REQUIRED_CHALLENGES.filter(item => item.category === 'Supplementary');
  assert.ok(supplementary.length > 0);
  for (const item of supplementary) assert.equal(item.syllabusUnit, undefined, `${item.id} was assigned an unsupported syllabus unit`);
  for (const topic of ['heap', 'bst', 'hash-table', 'graph']) {
    assert.ok(supplementary.some(item => item.coverageTopics.includes(topic)), `missing supplementary ${topic} coverage`);
  }
});

test('optional enrichment IDs are unique and cannot collide with the required bank', () => {
  const optionalIds = OPTIONAL_ENRICHMENT_CHALLENGES.map(item => item.id);
  const activeIds = new Set(FODS_REQUIRED_CHALLENGES.map(item => item.id));
  assert.equal(new Set(optionalIds).size, optionalIds.length, 'duplicate optional question IDs');
  for (const id of optionalIds) assert.ok(!activeIds.has(id), `optional ID collides with required bank: ${id}`);
});

test('quick-sort worst-case assessment offers complexity choices and scores the stated worst case', () => {
  const item = FODS_REQUIRED_CHALLENGES.find(question => question.id === 'c-l2-06');
  assert.ok(item);
  assert.equal(item.optimalStructures[0], 'Θ(n²)');
  assert.ok(item.availableStructures.includes('Θ(n²)'));
  assert.ok('comparisonCriteria' in item && item.comparisonCriteria.every(criteria => criteria.explanation?.trim()));
});

test('required challenges include practical coverage for previously missing syllabus topics', () => {
  const topics = new Set(FODS_REQUIRED_CHALLENGES.map(item => item.syllabusTopic));
  for (const topic of [
    'Pseudocode tracing and step count', 'Auxiliary space complexity',
    'Flowchart and pseudocode tracing', 'Big-O, Big-Theta, and Big-Omega',
    'Divide-and-conquer algorithm strategy', 'Greedy algorithm strategy',
    'Polynomial representation and addition using linked lists', 'Polynomial multiplication using arrays',
    'Array merging and ordered lists', 'Sparse matrix representation and addition',
    'Indexed sequential search', 'Bubble sort pass tracing', 'Shell sort pass tracing',
    'Selection sort pass tracing', 'Linked-list traversal and search', 'Linked-list concatenation',
    'Generalized linked-list polynomial representation', 'Prefix expression evaluation',
    'Balanced-parentheses checking with a stack', 'Direct, indirect, tail, and tree recursion', 'Linked-list sorting operation',
    'Multiple stacks with sequential representation', 'Linked queue operations and boundary conditions',
    'Input-restricted and output-restricted deques', 'Ascending and descending priority queues',
    'Array update operation', 'Column-major multidimensional array address calculation',
    'Multiple queues with fixed sequential partitions', 'Multiple queues and sequential representation'
  ]) {
    assert.ok(topics.has(topic), `missing syllabus topic: ${topic}`);
  }
});

test('new assessment traces have independently checked answers and cover distinct multi-queue designs', () => {
  const questions = new Map(FODS_REQUIRED_CHALLENGES.map(item => [item.id, item]));
  const expectedText = new Map([
    ['c-l1-13', '1, 3'],
    ['c-l1-14', 'T(n) is O(n²), Θ(n²), and Ω(n²).'],
    ['c-l1-15', '[1, 4, 2, 5]'],
    ['c-l1-16', '[1, 2, 4L, 4R, 6, 7]'],
    ['c-l1-17', '15'],
    ['c-l1-18', 'Sort'],
    ['c-l1-19', 'Function A calls B, and B later calls A.'],
    ['c-l1-20', 'Assign the new value directly to A[k].'],
    ['c-l1-21', '210']
  ]);
  for (const [id, expected] of expectedText) {
    const item = questions.get(id);
    assert.ok(item, `missing ${id}`);
    assert.ok('options' in item, `${id} is not an MCQ`);
    assert.equal(item.options?.find(option => option.isCorrect)?.text, expected, `${id} answer regression`);
  }
  assert.equal(questions.get('c-l2-15')?.optimalStructures[0], 'shell-sort');
  assert.equal(questions.get('c-l2-16')?.optimalStructures[0], 'selection-sort');
  const partitioned = questions.get('c-l3-07')!;
  const shared = questions.get('c-l4-04')!;
  assert.match(partitioned.question, /fixed maximum capacities/i);
  assert.match(shared.question, /unused slots/i);
  assert.notEqual(partitioned.syllabusTopic, shared.syllabusTopic);
});
