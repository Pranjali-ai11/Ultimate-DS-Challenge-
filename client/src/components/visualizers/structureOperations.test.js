import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  arrayDeleteAt, arrayInsertAt, arrayLinearSearch, arrayUpdateAt, calculateArrayAddress, mergeSortedArrays, parseArrayValues,
  buildBfsTrace, circularQueueDequeue, circularQueueEnqueue,
  circularQueueValues, createCircularQueue, createLinkedList, createTeachingHashTable,
  createLinkedQueue, deleteLinkedListAt, getLinkedListNodes, hashDelete, hashGet, hashPut,
  heapExtractMin, heapInsert, insertBST, insertLinkedListAt,
  isMinHeap, linkedListInvariantErrors, linkedListSearch, linkedQueueDequeue, linkedQueueEnqueue, linkedQueueInvariantErrors, linkedQueueValues, searchBST, stackPop, stackPush,
  traverseBST,
} from './structureOperations.js';

describe('array operations', () => {
  it('inserts, deletes, updates and searches without mutating prior arrays', () => {
    const start = [10, 20, 30];
    assert.deepEqual(arrayInsertAt(start, 0, 5), [5, 10, 20, 30]);
    assert.deepEqual(arrayInsertAt(start, 2, 25), [10, 20, 25, 30]);
    assert.deepEqual(arrayInsertAt(start, 3, 40), [10, 20, 30, 40]);
    assert.deepEqual(arrayDeleteAt(start, 1), { values: [10, 30], removed: 20 });
    assert.deepEqual(arrayUpdateAt(start, 1, 22), { values: [10, 22, 30], previous: 20 });
    assert.deepEqual(arrayLinearSearch([2, 2, 3], 2), { index: 0, comparisons: 1 });
    assert.deepEqual(arrayLinearSearch([], 5), { index: -1, comparisons: 0 });
    assert.deepEqual(start, [10, 20, 30]);
    assert.throws(() => arrayInsertAt(start, -1, 1), RangeError);
    assert.throws(() => arrayDeleteAt([], 0), RangeError);
  });

  it('parses custom array values, merges sorted arrays, and calculates element addresses safely', () => {
    assert.deepEqual(parseArrayValues(' -2, 4, 4 '), { valid: true, values: [-2, 4, 4], error: null });
    assert.deepEqual(parseArrayValues(''), { valid: true, values: [], error: null });
    assert.equal(parseArrayValues('1, 2.5').valid, false);
    assert.deepEqual(mergeSortedArrays([-2, 4, 4], [0, 4]), [-2, 0, 4, 4, 4]);
    assert.throws(() => mergeSortedArrays([2, 1], [3]), RangeError);
    assert.equal(calculateArrayAddress(1000, 4, 3), 1012);
    assert.throws(() => calculateArrayAddress(1000, 0, 2), RangeError);
  });
});

describe('linked-list variants', () => {
  for (const variant of ['singly', 'doubly', 'circular', 'doubly-circular']) {
    it(`${variant} preserves links for empty, singleton, insert, delete and traversal`, () => {
      const specifiedRepro = insertLinkedListAt(createLinkedList([24, 45, 78], variant), 0, 42);
      assert.deepEqual(getLinkedListNodes(specifiedRepro).map(node => node.val), [42, 24, 45, 78]);
      assert.equal(specifiedRepro.nodes.find(node => node.id === specifiedRepro.headId)?.val, 42);
      assert.equal(specifiedRepro.nodes.find(node => node.id === specifiedRepro.headId)?.nextId, getLinkedListNodes(specifiedRepro)[1].id);
      assert.deepEqual(linkedListInvariantErrors(specifiedRepro), []);
      let list = createLinkedList([], variant);
      assert.deepEqual(linkedListInvariantErrors(list), []);
      list = insertLinkedListAt(list, 0, 24);
      assert.deepEqual(getLinkedListNodes(list).map(node => node.val), [24]);
      assert.deepEqual(linkedListInvariantErrors(list), []);
      list = insertLinkedListAt(list, 0, 42);
      list = insertLinkedListAt(list, 2, 78);
      list = insertLinkedListAt(list, 2, 45);
      assert.deepEqual(getLinkedListNodes(list).map(node => node.val), [42, 24, 45, 78]);
      assert.deepEqual(linkedListInvariantErrors(list), []);
      const head = list.nodes.find(node => node.id === list.headId);
      assert.equal(head.val, 42);
      assert.equal(getLinkedListNodes(list)[0].nextId, getLinkedListNodes(list)[1].id);
      const { list: withoutHead, removed: removedHead } = deleteLinkedListAt(list, 0);
      assert.equal(removedHead.val, 42);
      assert.deepEqual(getLinkedListNodes(withoutHead).map(node => node.val), [24, 45, 78]);
      assert.deepEqual(linkedListInvariantErrors(withoutHead), []);
      const { list: withoutTail } = deleteLinkedListAt(withoutHead, 2);
      assert.deepEqual(getLinkedListNodes(withoutTail).map(node => node.val), [24, 45]);
      assert.deepEqual(linkedListInvariantErrors(withoutTail), []);
      const { list: withoutMiddle } = deleteLinkedListAt(withoutTail, 1);
      assert.deepEqual(getLinkedListNodes(withoutMiddle).map(node => node.val), [24]);
      assert.deepEqual(linkedListInvariantErrors(withoutMiddle), []);
      assert.deepEqual(linkedListSearch(specifiedRepro, 45), { index: 2, visited: 3 });
      assert.deepEqual(linkedListSearch(specifiedRepro, 99), { index: -1, visited: 4 });
      assert.throws(() => deleteLinkedListAt(createLinkedList([], variant), 0), RangeError);
      assert.throws(() => insertLinkedListAt(list, 5, 1), RangeError);
    });
  }
});

describe('stack and circular queue', () => {
  it('preserves LIFO order and empty-pop state', () => {
    let stack = [];
    stack = stackPush(stack, 'A'); stack = stackPush(stack, 'B'); stack = stackPush(stack, 'C');
    for (const expected of ['C', 'B', 'A']) {
      const result = stackPop(stack); stack = result.stack; assert.equal(result.item, expected);
    }
    assert.equal(stackPop(stack).item, null);
    assert.deepEqual(stack, []);
  });
  it('wraps, detects full and empty, and preserves FIFO order', () => {
    let queue = createCircularQueue(3);
    queue = circularQueueEnqueue(queue, 'A').queue;
    queue = circularQueueEnqueue(queue, 'B').queue;
    assert.equal(circularQueueDequeue(queue).item, 'A');
    queue = circularQueueDequeue(queue).queue;
    queue = circularQueueEnqueue(queue, 'C').queue;
    queue = circularQueueEnqueue(queue, 'D').queue;
    assert.deepEqual(circularQueueValues(queue), ['B', 'C', 'D']);
    assert.equal(circularQueueEnqueue(queue, 'E').accepted, false);
    for (const expected of ['B', 'C', 'D']) {
      const result = circularQueueDequeue(queue); queue = result.queue; assert.equal(result.item, expected);
    }
    assert.equal(circularQueueDequeue(queue).item, null);
    assert.deepEqual(circularQueueValues(queue), []);
  });
  it('maintains linked FRONT/REAR pointers through empty, singleton and FIFO transitions', () => {
    let queue = createLinkedQueue();
    assert.deepEqual(linkedQueueInvariantErrors(queue), []);
    queue = linkedQueueEnqueue(queue, 'A');
    assert.equal(queue.frontId, queue.rearId);
    assert.deepEqual(linkedQueueInvariantErrors(queue), []);
    queue = linkedQueueEnqueue(queue, 'B');
    queue = linkedQueueEnqueue(queue, 'C');
    assert.deepEqual(linkedQueueValues(queue), ['A', 'B', 'C']);
    assert.deepEqual(linkedQueueInvariantErrors(queue), []);
    for (const expected of ['A', 'B', 'C']) {
      const result = linkedQueueDequeue(queue); queue = result.queue; assert.equal(result.item, expected);
      assert.deepEqual(linkedQueueInvariantErrors(queue), []);
    }
    assert.equal(queue.frontId, null);
    assert.equal(queue.rearId, null);
    assert.equal(linkedQueueDequeue(queue).item, null);
  });
});

describe('min-heap', () => {
  it('maintains parent ordering and extracts minima including equal priorities', () => {
    let heap = [];
    for (const [label, priority] of [['A', 4], ['B', 1], ['C', 1], ['D', 3]]) {
      heap = heapInsert(heap, { label, priority });
      assert.equal(isMinHeap(heap), true);
    }
    const extracted = [];
    while (heap.length) {
      const result = heapExtractMin(heap);
      extracted.push(result.item);
      heap = result.heap;
      assert.equal(isMinHeap(heap), true);
    }
    assert.deepEqual(extracted.map(item => item.priority), [1, 1, 3, 4]);
    assert.deepEqual(extracted.slice(0, 2).map(item => item.label), ['B', 'C']);
    assert.equal(heapExtractMin([]).item, null);
  });
});

describe('binary search tree', () => {
  it('rejects duplicates, searches and returns all traversal orders', () => {
    let root;
    for (const value of [8, 4, 12, 2, 6, 10, 14]) root = insertBST(root, value);
    const duplicateRoot = insertBST(root, 8);
    assert.deepEqual(traverseBST(root), [2, 4, 6, 8, 10, 12, 14]);
    assert.deepEqual(traverseBST(root, 'pre-order'), [8, 4, 2, 6, 12, 10, 14]);
    assert.deepEqual(traverseBST(root, 'post-order'), [2, 6, 4, 10, 14, 12, 8]);
    assert.equal(duplicateRoot, root);
    assert.deepEqual(searchBST(root, 6), { found: true, visited: [8, 4, 6] });
    assert.deepEqual(searchBST(root, 7), { found: false, visited: [8, 4, 6] });
  });
});

describe('hash table operations', () => {
  it('uses the teaching hash, chains collisions, updates and deletes only the selected key', () => {
    const empty = Array.from({ length: 8 }, () => []);
    const first = hashPut(empty, 'ab', 'one');
    const second = hashPut(first.buckets, 'ba', 'two');
    assert.equal(first.bucketIndex, second.bucketIndex);
    assert.equal(second.buckets[first.bucketIndex].length, 2);
    const update = hashPut(second.buckets, 'ab', 'updated');
    assert.equal(update.updated, true);
    assert.equal(hashGet(update.buckets, 'ab').entry.val, 'updated');
    const removed = hashDelete(update.buckets, 'ab');
    assert.equal(removed.removed, true);
    assert.equal(hashGet(removed.buckets, 'ba').entry.val, 'two');
    assert.equal(hashGet(removed.buckets, 'ab').entry, null);
  });
  it('places seeded records in buckets matching the displayed hash function', () => {
    const buckets = createTeachingHashTable([{ key: 'user_101', val: 'Alice' }, { key: 'user_102', val: 'Bob' }]);
    assert.equal(hashGet(buckets, 'user_101').entry.val, 'Alice');
    assert.equal(hashGet(buckets, 'user_102').entry.val, 'Bob');
    assert.notEqual(hashGet(buckets, 'user_101').bucketIndex, hashGet(buckets, 'user_102').bucketIndex);
  });
});

describe('graph breadth-first traversal', () => {
  it('records queue and visited states, ignores repeat edges, and supports any valid start', () => {
    const nodes = ['A', 'B', 'C', 'D', 'E'].map(id => ({ id }));
    const edges = [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }, { from: 'C', to: 'E' }, { from: 'D', to: 'E' }];
    const trace = buildBfsTrace(nodes, edges, 'A');
    assert.deepEqual(trace.map(step => step.current), ['A', 'B', 'C', 'D', 'E']);
    assert.deepEqual(trace[0].queue, ['B', 'C']);
    assert.deepEqual(trace[2].visited, ['A', 'B', 'C', 'D', 'E']);
    assert.deepEqual(buildBfsTrace(nodes, edges, 'C').map(step => step.current), ['C', 'A', 'D', 'E', 'B']);
    assert.deepEqual(buildBfsTrace(nodes, edges, 'missing'), []);
    assert.deepEqual(trace.map(step => step.current), ['A', 'B', 'C', 'D', 'E']);
  });
});
