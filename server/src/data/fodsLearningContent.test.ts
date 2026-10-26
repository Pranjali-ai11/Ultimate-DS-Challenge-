import test from 'node:test';
import assert from 'node:assert/strict';
import { FODS_COURSE_UNITS, STRUCTURE_LEARNING_GUIDES } from './fodsLearningContent.js';
import { DATA_STRUCTURES_CATALOG } from './seedData.js';

test('each catalog structure has a complete guide and accurately states its sandbox scope', () => {
  const ids = DATA_STRUCTURES_CATALOG.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length, 'catalog IDs are unique');
  assert.deepEqual(Object.keys(STRUCTURE_LEARNING_GUIDES).sort(), [...ids].sort(), 'every catalog entry has exactly one guide');
  for (const item of DATA_STRUCTURES_CATALOG) {
    const guide = STRUCTURE_LEARNING_GUIDES[item.id];
    assert.ok(guide.syllabus.trim(), item.id + ' states syllabus scope');
    assert.ok(guide.prerequisites.length > 0, item.id + ' states prerequisites');
    assert.ok(guide.mentalModel.length > 40, item.id + ' has a useful mental model');
    assert.ok(guide.representation.length > 40, item.id + ' explains representation');
    assert.ok(guide.invariant.length > 30, item.id + ' states a correctness invariant');
    assert.ok(guide.sandboxOperations.length > 0, item.id + ' lists the actual sandbox controls');
    assert.ok(guide.operationWalkthroughs.length > 0, item.id + ' walks through operations');
    assert.ok(guide.workedExample.steps.length >= 2, item.id + ' includes intermediate example steps');
    assert.ok(guide.complexityReasoning.length >= 2, item.id + ' explains complexity');
    assert.ok(guide.commonMistakes.length >= 2, item.id + ' covers pitfalls');
    assert.ok(guide.checks.length >= 2, item.id + ' checks understanding');
    for (const operation of guide.operationWalkthroughs) {
      assert.ok(operation.precondition && operation.steps.length >= 2 && operation.result && operation.cost && operation.boundary,
        item.id + '/' + operation.operation + ' has precondition, trace, result, cost, and boundary');
    }
  }
  assert.equal(STRUCTURE_LEARNING_GUIDES['priority-queue'].scope, 'core');
  assert.equal(STRUCTURE_LEARNING_GUIDES.heap.scope, 'enrichment');
  assert.equal(STRUCTURE_LEARNING_GUIDES.bst.scope, 'enrichment');
  assert.equal(STRUCTURE_LEARNING_GUIDES['hash-table'].scope, 'enrichment');
  assert.equal(STRUCTURE_LEARNING_GUIDES.graph.scope, 'enrichment');
});

test('searchable course lessons cover the syllabus categories and include standalone study support', () => {
  assert.deepEqual(FODS_COURSE_UNITS.map(unit => unit.id), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6']);
  const categories = new Set<string>();
  let lessonCount = 0;
  for (const unit of FODS_COURSE_UNITS) {
    assert.ok(unit.outcome.length > 40);
    assert.ok(unit.topics.length >= 3);
    for (const topic of unit.topics) {
      lessonCount += 1;
      categories.add(topic.category);
      assert.ok(topic.explanation.length > 80, unit.id + '/' + topic.title + ' has explanatory content');
      assert.ok(topic.purpose.length > 30, topic.title + ' states a purpose');
      assert.ok(topic.prerequisites.length > 0, topic.title + ' states prerequisites');
      assert.ok(topic.workedSteps.length >= 2, unit.id + '/' + topic.title + ' has intermediate steps');
      assert.ok(topic.result && topic.pitfalls.length > 0 && topic.check && topic.answer);
      assert.ok(topic.complexity.length > 0, topic.title + ' explains complexity');
      assert.ok(topic.edgeCases.length > 0, topic.title + ' addresses edge cases');
      assert.ok(topic.practice.length >= 2, topic.title + ' has explained practice questions');
      assert.ok(topic.summary.length > 30, topic.title + ' has a revision summary');
    }
  }
  assert.equal(lessonCount, 22);
  assert.equal(categories.size, 7);
});

test('teaching examples do not imply one priority-queue implementation or falsely bound an unbalanced BST', () => {
  const queue = DATA_STRUCTURES_CATALOG.find(item => item.id === 'queue')!;
  assert.match(queue.codeSnippet, /CircularQueue/);
  assert.match(queue.codeSnippet, /\(this\.front \+ this\.size\) % this\.capacity/);
  assert.doesNotMatch(queue.codeSnippet, /\.shift\(\)/, 'Array.shift is linear in the number of queued items');

  const priorityQueue = DATA_STRUCTURES_CATALOG.find(item => item.id === 'priority-queue')!;
  assert.match(priorityQueue.howItWorks, /ADT.*costs depend on its representation/);
  assert.match(priorityQueue.timeComplexity.insert, /Depends on representation/);
  assert.match(priorityQueue.operations[0].name, /Sandbox/);

  const bst = DATA_STRUCTURES_CATALOG.find(item => item.id === 'bst')!;
  assert.match(bst.advantages.join(' '), /O\(h\).*O\(log n\) only for logarithmic height/);
});

test('new sparse-transpose, quicksort, and expression-conversion walkthroughs contain consistent traces', () => {
  const topic = (unitId: string, title: string) => FODS_COURSE_UNITS.find(unit => unit.id === unitId)!.topics.find(entry => entry.title === title)!;
  const transpose = topic('unit-2', 'Sparse triplets, addition, and transpose');
  assert.match(transpose.explanation, /simple transpose.*Θ\(Ct\)/i);
  assert.match(transpose.explanation, /fast transpose.*Θ\(C\+t\)/i);
  assert.match(transpose.workedSteps.join(' '), /emit.*\(0,2,7\).*emit.*\(2,0,4\)/i);
  assert.match(transpose.workedSteps.join(' '), /\(2,0,7\).*swapped.*\(0,2,7\)/i);

  const quicksort = topic('unit-3', 'Quick sort and Shell sort');
  assert.match(quicksort.workedSteps.join(' '), /pivot=2/);
  assert.match(quicksort.workedSteps.join(' '), /\[1,2,3,4\]; pivot index 1/);

  const expressions = topic('unit-5', 'Infix, prefix, postfix, conversion, evaluation');
  assert.match(expressions.workedSteps.join(' '), /A\+B\*C/);
  assert.match(expressions.workedSteps.join(' '), /ABC\*\+/);
});

test('the Learn API catalog returns syllabus units and one guide for each real structure', async () => {
  let payload: any;
  await (await import('../controllers/learnController.js')).getLearnCatalog({} as any, { json(value: unknown) { payload = value; } } as any);
  assert.equal(payload.total, DATA_STRUCTURES_CATALOG.length);
  assert.equal(payload.courseUnits.length, 6);
  assert.equal(payload.courseTopics.length, 22);
  assert.ok(payload.courseTopics.every((topic: any) => topic.category && topic.practice.length >= 2));
  assert.equal(payload.structures.filter((item: any) => item.learningGuide).length, DATA_STRUCTURES_CATALOG.length);
  for (const item of DATA_STRUCTURES_CATALOG) {
    let detail: any;
    await (await import('../controllers/learnController.js')).getStructureDetail({ params: { id: item.id } } as any, { json(value: unknown) { detail = value; } } as any);
    assert.equal(detail.structure.id, item.id);
    assert.ok(detail.structure.learningGuide, item.id + ' detail endpoint returns its learning guide');
  }
  let missingStatus = 200;
  await (await import('../controllers/learnController.js')).getStructureDetail({ params: { id: 'missing' } } as any, {
    status(code: number) { missingStatus = code; return this; }, json() { return this; }
  } as any);
  assert.equal(missingStatus, 404);
});
