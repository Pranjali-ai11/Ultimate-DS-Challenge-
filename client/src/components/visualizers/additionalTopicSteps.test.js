import test from 'node:test';
import assert from 'node:assert/strict';
import {
  denseToTriplets, fastTranspose, formatPolynomial, makeExpressionSteps, makeMatrixSteps,
  makePolynomialSteps, normalizePolynomial, parseMatrixInput, parsePolynomial, simpleTranspose,
} from './additionalTopicSteps.js';
import { createDeque, dequeValues, makeMazeSteps, makeNQueensSteps, makeRecursionSteps, runDequeOperation } from './recursionDequeSteps.js';

const final = steps => steps.at(-1);

test('matrix address formulas use row and column major indexes', () => {
  const matrix = [[1, 2, 3], [4, 5, 6]];
  assert.equal(final(makeMatrixSteps('Row-major address calculation', { matrix, baseAddress: 1000, elementSize: 4, rowIndex: 0, colIndex: 2 })).state.address, 1008);
  assert.equal(final(makeMatrixSteps('Column-major address calculation', { matrix, baseAddress: 1000, elementSize: 4, rowIndex: 0, colIndex: 2 })).state.address, 1016);
  assert.deepEqual(parseMatrixInput('0 0 5\n0 8 0\n3 0 0'), [[0, 0, 5], [0, 8, 0], [3, 0, 0]]);
});

test('dense conversion, simple transpose, fast transpose and sparse addition are correct', () => {
  const matrix = [[0, 0, 5], [0, 8, 0], [3, 0, 0]], tuples = denseToTriplets(matrix);
  assert.deepEqual(tuples, [{ row: 3, col: 3, value: 3 }, { row: 0, col: 2, value: 5 }, { row: 1, col: 1, value: 8 }, { row: 2, col: 0, value: 3 }]);
  const simple = simpleTranspose(tuples), fast = fastTranspose(tuples);
  assert.deepEqual(fast.terms, simple);
  assert.ok(fast.steps.length > 0);
  assert.deepEqual(final(makeMatrixSteps('Convert dense matrix to 3-tuple', { matrix })).state.tuples, tuples);
  const sum = final(makeMatrixSteps('Sparse matrix addition', { matrix: [[1, 0], [0, 2]], matrixB: [[3, 4], [0, -2]] }));
  assert.deepEqual(sum.state.result, [{ row: 2, col: 2, value: 2 }, { row: 0, col: 0, value: 4 }, { row: 0, col: 1, value: 4 }]);
});

test('polynomial addition and multiplication combine equal powers', () => {
  const a = parsePolynomial('4x^3 + 2x^2 - 5x + 7'), b = parsePolynomial('2x^3 - 2x^2 + 3');
  const added = final(makePolynomialSteps('Polynomial addition', a, b)).state.result;
  assert.equal(formatPolynomial(added), '6x^3 - 5x + 10');
  const multiplied = final(makePolynomialSteps('Polynomial multiplication', parsePolynomial('x + 1'), parsePolynomial('x - 1'))).state.result;
  assert.equal(formatPolynomial(multiplied), 'x^2 - 1');
  assert.deepEqual(normalizePolynomial([{ coefficient: 2, exponent: 1 }, { coefficient: -2, exponent: 1 }]), []);
});

test('expression conversions, evaluation and delimiter checks produce correct final states', () => {
  assert.equal(final(makeExpressionSteps('Infix to Postfix', 'A + B * C')).state.result, 'A B C * +');
  assert.equal(final(makeExpressionSteps('Infix to Prefix', 'A + B * C')).state.result, '+ A * B C');
  assert.equal(final(makeExpressionSteps('Infix to Prefix', 'A ^ B ^ C')).state.result, '^ A ^ B C');
  assert.equal(final(makeExpressionSteps('Postfix Evaluation', '5 3 + 2 *')).state.result, 16);
  assert.equal(final(makeExpressionSteps('Balanced Parentheses', '{a + [b * (c)]}')).state.result, true);
  assert.equal(final(makeExpressionSteps('Balanced Parentheses', '([)]')).state.result, false);
  assert.throws(() => makeExpressionSteps('Postfix Evaluation', '5 +'), /needs two operands/);
});

test('recursive generators show real calls, results and bounded backtracking', () => {
  const factorial = makeRecursionSteps('Factorial', 5);
  assert.equal(final(factorial).state.result, 120);
  assert.equal(Math.max(...factorial.map(item => item.state.frames.length)), 5);
  assert.equal(final(makeRecursionSteps('Tail-style factorial', 5)).state.result, 120);
  assert.deepEqual(final(makeRecursionSteps('Head recursion', 3)).state.result, [1, 2, 3]);
  assert.equal(final(makeRecursionSteps('Indirect recursion', 8)).state.result, true);
  const fib = makeRecursionSteps('Fibonacci', 5);
  assert.equal(final(fib).state.result, 5);
  assert.ok(fib.some(item => item.state.tree.length > 1));
  const queens = final(makeNQueensSteps(4));
  assert.equal(queens.state.result, 2);
  assert.ok(queens.stats.backtracks > 0);
});

test('maze solver finds a path and reports a blocked maze', () => {
  const found = final(makeMazeSteps([[0, 0, 0], [1, 1, 0], [0, 0, 0]]));
  assert.ok(Array.isArray(found.state.result));
  assert.deepEqual(found.state.result[0], [0, 0]);
  assert.deepEqual(found.state.result.at(-1), [2, 2]);
  assert.equal(final(makeMazeSteps([[0, 1], [1, 0]])).state.result, null);
});

test('deque enforces capacity, FIFO-like endpoints and restricted rules', () => {
  let deque = createDeque(2);
  deque = runDequeOperation(deque, 'Standard Deque', 'Insert Rear', 'B').state;
  deque = runDequeOperation(deque, 'Standard Deque', 'Insert Front', 'A').state;
  assert.deepEqual(dequeValues(deque), ['A', 'B']);
  assert.match(runDequeOperation(deque, 'Standard Deque', 'Insert Rear', 'C').state.lastResult, /full/);
  deque = runDequeOperation(deque, 'Standard Deque', 'Delete Rear').state;
  assert.deepEqual(dequeValues(deque), ['A']);
  const blocked = runDequeOperation(deque, 'Input-Restricted Deque', 'Insert Front', 'X');
  assert.match(blocked.state.lastResult, /not allowed/);
  const blockedRearDelete = runDequeOperation(deque, 'Output-Restricted Deque', 'Delete Rear');
  assert.match(blockedRearDelete.state.lastResult, /not allowed/);
  assert.match(runDequeOperation(createDeque(2), 'Standard Deque', 'Delete Front').state.lastResult, /empty/);
});
