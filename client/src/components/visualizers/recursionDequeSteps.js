const copy = value => structuredClone(value);
const step = (state, message, stats = {}, highlights = {}, visual = {}) => ({ state: copy(state), message, stats: { calls: 0, placements: 0, backtracks: 0, ...stats }, highlights, visual });

export function makeRecursionSteps(operation, n) {
  if (!Number.isInteger(n) || n < 0 || n > (operation === 'Fibonacci' ? 7 : 10)) throw new Error(operation === 'Fibonacci' ? 'Choose Fibonacci n from 0 to 7 so the call tree stays readable.' : 'Choose an integer from 0 to 10.');
  const frames = [], steps = []; let calls = 0;
  const push = label => { frames.push(label); calls += 1; steps.push(step({ frames, tree: [], result: null }, `CALL ${label}: push a new recursive frame.`, { calls }, {}, { phase: 'call' })); };
  const pop = (label, value) => { frames.pop(); steps.push(step({ frames, tree: [], result: value }, `RETURN ${label} = ${value}: finish this frame and pass its result to the caller.`, { calls }, {}, { phase: 'return' })); return value; };
  if (operation === 'Factorial') {
    const factorial = value => { push(`factorial(${value})`); if (value <= 1) return pop(`factorial(${value})`, 1); const result = value * factorial(value - 1); return pop(`factorial(${value})`, result); };
    const result = factorial(n); steps.push(step({ frames: [], tree: [], result }, `Factorial complete: ${n}! = ${result}.`, { calls }, {}, { phase: 'complete' }));
  } else if (operation === 'Tail-style factorial') {
    const tail = (value, accumulator) => { push(`tailFactorial(${value}, ${accumulator})`); if (value <= 1) return pop(`tailFactorial(${value}, ${accumulator})`, accumulator); const result = tail(value - 1, value * accumulator); return pop(`tailFactorial(${value}, ${accumulator})`, result); };
    const result = tail(n, 1); steps.push(step({ frames: [], tree: [], result }, `Tail-style factorial complete: ${n}! = ${result}.`, { calls }, {}, { phase: 'complete' }));
  } else if (operation === 'Head recursion') {
    const visited = [];
    const head = value => { push(`head(${value})`); if (value > 0) head(value - 1); if (value > 0) { visited.push(value); steps.push(step({ frames, tree: [], visited: [...visited], result: null }, `Work after the recursive call: visit ${value}.`, { calls }, {}, { phase: 'work-on-return' })); } return pop(`head(${value})`, value); };
    head(n); steps.push(step({ frames: [], tree: [], visited, result: [...visited] }, `Head recursion completes its work while returning: ${visited.join(', ') || 'no values'}.`, { calls }, {}, { phase: 'complete' }));
  } else if (operation === 'Indirect recursion') {
    const isEven = value => { push(`isEven(${value})`); if (value === 0) return pop('isEven(0)', true); const result = isOdd(value - 1); return pop(`isEven(${value})`, result); };
    const isOdd = value => { push(`isOdd(${value})`); if (value === 0) return pop('isOdd(0)', false); const result = isEven(value - 1); return pop(`isOdd(${value})`, result); };
    const result = isEven(n); steps.push(step({ frames: [], tree: [], result }, `${n} is ${result ? 'even' : 'odd'}; the mutually recursive calls reached their base case.`, { calls }, {}, { phase: 'complete' }));
  } else if (operation === 'Fibonacci') {
    const tree = []; let nextId = 1;
    const fib = (value, parentId = null, branch = '') => {
      const id = nextId++; const node = { id, value, parentId, branch, status: 'active', result: null }; tree.push(node); calls += 1;
      steps.push(step({ frames: [], tree, result: null }, `CALL fib(${value})${parentId ? ` as ${branch} child` : ''}.`, { calls }, { nodeId: id }, { phase: 'call', nodeId: id }));
      let result;
      if (value <= 1) result = value;
      else result = fib(value - 1, id, 'left') + fib(value - 2, id, 'right');
      node.status = 'complete'; node.result = result;
      steps.push(step({ frames: [], tree, result: null }, `RETURN fib(${value}) = ${result}.`, { calls }, { nodeId: id }, { phase: 'return', nodeId: id }));
      return result;
    };
    const result = fib(n); steps.push(step({ frames: [], tree, result }, `Fibonacci complete: fib(${n}) = ${result}.`, { calls }, {}, { phase: 'complete' }));
  } else throw new Error('Choose a supported recursion example.');
  return steps;
}

export function makeNQueensSteps(n) {
  if (!Number.isInteger(n) || n < 4 || n > 6) throw new Error('N-Queens supports board sizes 4 to 6.');
  const board = Array(n).fill(-1), steps = []; let comparisons = 0, placements = 0, backtracks = 0, solutions = 0;
  const safe = (row, col) => { for (let prior = 0; prior < row; prior += 1) { comparisons += 1; if (board[prior] === col || Math.abs(board[prior] - col) === row - prior) return false; } return true; };
  const search = row => {
    if (row === n) { solutions += 1; steps.push(step({ board, solutions, result: null }, `Solution ${solutions} found with one queen in every row and no shared column or diagonal.`, { comparisons, placements, backtracks }, {}, { phase: 'solution' })); return; }
    for (let col = 0; col < n; col += 1) {
      const valid = safe(row, col);
      steps.push(step({ board, solutions, result: null }, valid ? `Try row ${row}, column ${col}: no earlier queen conflicts; place a queen.` : `Try row ${row}, column ${col}: a column or diagonal conflict blocks this square.`, { comparisons, placements, backtracks }, { row, col }, { phase: valid ? 'candidate' : 'conflict' }));
      if (!valid) continue;
      board[row] = col; placements += 1;
      steps.push(step({ board, solutions, result: null }, `Place queen at (${row}, ${col}) and continue with row ${row + 1}.`, { comparisons, placements, backtracks }, { row, col }, { phase: 'place' }));
      search(row + 1);
      if (row < n - 1) { board[row] = -1; backtracks += 1; steps.push(step({ board, solutions, result: null }, `Backtrack from row ${row}; remove its queen and try the next column.`, { comparisons, placements, backtracks }, { row, col }, { phase: 'backtrack' })); }
    }
  };
  search(0);
  steps.push(step({ board, solutions, result: solutions }, `Search complete: found ${solutions} solution(s) for N = ${n}.`, { comparisons, placements, backtracks }, {}, { phase: 'complete' }));
  return steps;
}

export function makeMazeSteps(maze) {
  if (!Array.isArray(maze) || !maze.length || !maze[0]?.length || maze.length > 6 || maze[0].length > 6 || maze.some(row => row.length !== maze[0].length)) throw new Error('Maze must be a rectangular grid no larger than 6 × 6.');
  const rows = maze.length, cols = maze[0].length;
  if (maze[0][0] === 1 || maze[rows - 1][cols - 1] === 1) throw new Error('Start and goal cells must remain open.');
  const visited = [], path = [], backtracked = [], steps = []; let comparisons = 0, found = false;
  const walk = (r, c) => {
    comparisons += 1; visited.push([r, c]); path.push([r, c]);
    steps.push(step({ maze, visited, path, backtracked, result: null }, `Enter open cell (${r}, ${c}) and explore from here.`, { comparisons }, { current: [r, c] }, { phase: 'visit' }));
    if (r === rows - 1 && c === cols - 1) { found = true; steps.push(step({ maze, visited, path, backtracked, result: null }, 'Goal reached. Keep this route as the solution path.', { comparisons }, { current: [r, c] }, { phase: 'goal' })); return true; }
    for (const [nr, nc] of [[r, c + 1], [r + 1, c], [r, c - 1], [r - 1, c]]) {
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (maze[nr][nc] === 1 || visited.some(([vr, vc]) => vr === nr && vc === nc)) continue;
      if (walk(nr, nc)) return true;
    }
    path.pop(); backtracked.push([r, c]);
    steps.push(step({ maze, visited, path, backtracked, result: null }, `Dead end at (${r}, ${c}); backtrack to the previous cell.`, { comparisons }, { current: [r, c] }, { phase: 'backtrack' }));
    return false;
  };
  found = walk(0, 0);
  steps.push(step({ maze, visited, path, backtracked, result: found ? [...path] : null }, found ? `Path found with ${path.length} cells.` : 'No path exists.', { comparisons }, {}, { phase: 'complete' }));
  return steps;
}

export function createDeque(capacity = 6) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 8) throw new Error('Deque capacity must be from 1 to 8.');
  return { slots: Array(capacity).fill(null), front: 0, size: 0, lastResult: null };
}

export function dequeValues(deque) {
  return Array.from({ length: deque.size }, (_, offset) => deque.slots[(deque.front + offset) % deque.slots.length]);
}

export function runDequeOperation(deque, mode, operation, value) {
  const state = copy(deque), steps = [], capacity = state.slots.length;
  const blocked = (mode === 'Input-Restricted Deque' && operation === 'Insert Front') || (mode === 'Output-Restricted Deque' && operation === 'Delete Rear');
  if (blocked) {
    state.lastResult = `${operation} is not allowed in ${mode}.`;
    steps.push(step(state, state.lastResult, {}, {}, { phase: 'blocked' }));
    return { steps, state };
  }
  if (operation.startsWith('Insert')) {
    if (state.size === capacity) { state.lastResult = `Deque is full (capacity ${capacity}); no item was inserted.`; steps.push(step(state, state.lastResult, {}, {}, { phase: 'overflow' })); return { steps, state }; }
    if (!String(value ?? '').trim()) throw new Error('Enter a value to insert.');
    const before = copy(state);
    steps.push(step(before, `Prepare to insert ${String(value).trim()} at ${operation === 'Insert Front' ? 'FRONT' : 'REAR'}.`, {}, {}, { phase: 'begin-insert' }));
    if (operation === 'Insert Front') state.front = (state.front - 1 + capacity) % capacity;
    const index = operation === 'Insert Front' ? state.front : (state.front + state.size) % capacity;
    state.slots[index] = String(value).trim(); state.size += 1; state.lastResult = `Inserted ${String(value).trim()} at ${operation === 'Insert Front' ? 'FRONT' : 'REAR'} (slot ${index}).`;
    steps.push(step(state, state.lastResult, { writes: 1 }, { index }, { phase: 'insert', end: operation === 'Insert Front' ? 'front' : 'rear' }));
  } else if (operation.startsWith('Delete')) {
    if (!state.size) { state.lastResult = 'Deque is empty; no item was removed.'; steps.push(step(state, state.lastResult, {}, {}, { phase: 'underflow' })); return { steps, state }; }
    const before = copy(state);
    steps.push(step(before, `Prepare to remove the item at ${operation === 'Delete Front' ? 'FRONT' : 'REAR'}.`, {}, {}, { phase: 'begin-delete' }));
    const index = operation === 'Delete Front' ? state.front : (state.front + state.size - 1) % capacity;
    const removed = state.slots[index]; state.slots[index] = null; state.size -= 1;
    if (state.size === 0) state.front = 0; else if (operation === 'Delete Front') state.front = (state.front + 1) % capacity;
    state.lastResult = `Removed ${removed} from ${operation === 'Delete Front' ? 'FRONT' : 'REAR'} (slot ${index}).`;
    steps.push(step(state, state.lastResult, { writes: 1 }, { index }, { phase: 'delete', end: operation === 'Delete Front' ? 'front' : 'rear' }));
  } else if (operation === 'Peek Front' || operation === 'Peek Rear') {
    if (!state.size) state.lastResult = 'Deque is empty; there is no value to peek.';
    else { const index = operation === 'Peek Front' ? state.front : (state.front + state.size - 1) % capacity; state.lastResult = `${operation === 'Peek Front' ? 'FRONT' : 'REAR'} is ${state.slots[index]} at slot ${index}.`; }
    steps.push(step(state, state.lastResult, {}, state.size ? { index: operation === 'Peek Front' ? state.front : (state.front + state.size - 1) % capacity } : {}, { phase: 'peek' }));
  } else throw new Error('Select a valid deque operation.');
  return { steps, state };
}
