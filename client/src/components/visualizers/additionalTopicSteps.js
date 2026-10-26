const snapshot = value => structuredClone(value);
const makeStep = (state, message, stats = {}, highlights = {}, visual = {}) => ({
  state: snapshot(state), message, stats: { comparisons: 0, writes: 0, multiplications: 0, calls: 0, ...stats }, highlights, visual,
});

export function parseMatrixInput(text) {
  const rows = text.trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!rows.length || rows.length > 6) throw new Error('Enter between 1 and 6 matrix rows.');
  const matrix = rows.map(row => row.split(/[\s,]+/).map(Number));
  if (matrix.some(row => !row.length || row.length > 6 || row.some(value => !Number.isSafeInteger(value)))) {
    throw new Error('Use 1–6 integer values per row, separated by spaces or commas.');
  }
  if (matrix.some(row => row.length !== matrix[0].length)) throw new Error('Every matrix row must have the same number of columns.');
  return matrix;
}

export function denseToTriplets(matrix) {
  const terms = [];
  matrix.forEach((row, r) => row.forEach((value, c) => { if (value !== 0) terms.push({ row: r, col: c, value }); }));
  return [{ row: matrix.length, col: matrix[0]?.length ?? 0, value: terms.length }, ...terms];
}

export function simpleTranspose(terms) {
  if (!terms.length) return [];
  const [header, ...items] = terms;
  const output = [];
  for (let col = 0; col < header.col; col += 1) {
    for (const item of items) if (item.col === col) output.push({ row: item.col, col: item.row, value: item.value });
  }
  return [{ row: header.col, col: header.row, value: output.length }, ...output];
}

export function fastTranspose(terms) {
  if (!terms.length) return { terms: [], counts: [], starts: [], steps: [] };
  const [header, ...items] = terms;
  const counts = Array(header.col).fill(0);
  const starts = Array(header.col).fill(0);
  const nextPosition = Array(header.col).fill(0);
  const output = Array(items.length);
  const steps = [];
  items.forEach(item => { counts[item.col] += 1; });
  steps.push({ phase: 'count', counts: [...counts], starts: [...starts], nextPosition: [...nextPosition], output: [] });
  let position = 0;
  for (let col = 0; col < counts.length; col += 1) {
    starts[col] = position;
    nextPosition[col] = position;
    position += counts[col];
    steps.push({ phase: 'start', column: col, counts: [...counts], starts: [...starts], nextPosition: [...nextPosition], output: [...output] });
  }
  for (const item of items) {
    const destination = nextPosition[item.col];
    output[destination] = { row: item.col, col: item.row, value: item.value };
    nextPosition[item.col] += 1;
    steps.push({ phase: 'place', item: { ...item }, destination, counts: [...counts], starts: [...starts], nextPosition: [...nextPosition], output: snapshot(output) });
  }
  return { terms: [{ row: header.col, col: header.row, value: output.length }, ...output], counts, starts, nextPosition, steps };
}

export function makeMatrixSteps(operation, { matrix, matrixB, baseAddress = 1000, elementSize = 4, rowIndex = 0, colIndex = 0 } = {}) {
  if (!Array.isArray(matrix) || !matrix.length || !matrix[0]?.length) throw new Error('Enter a non-empty matrix.');
  const rows = matrix.length, cols = matrix[0].length;
  if (rows > 6 || cols > 6 || matrix.some(row => row.length !== cols)) throw new Error('Matrix dimensions must be rectangular and at most 6 × 6.');
  const state = { matrix: snapshot(matrix), tuples: [], result: [], matrixB: matrixB ? snapshot(matrixB) : null, counts: [], starts: [], storageOrder: [], address: null };
  const steps = [];
  let comparisons = 0, writes = 0;
  if (operation === 'Row-major address calculation' || operation === 'Column-major address calculation') {
    if (![baseAddress, elementSize, rowIndex, colIndex].every(Number.isSafeInteger) || elementSize <= 0) throw new Error('Base address and indexes must be integers; element size must be a positive integer.');
    if (rowIndex < 0 || rowIndex >= rows || colIndex < 0 || colIndex >= cols) throw new Error(`Indexes must satisfy 0 ≤ i < ${rows} and 0 ≤ j < ${cols}.`);
    const rowMajor = operation.startsWith('Row');
    const order = rowMajor ? matrix.flatMap((row, r) => row.map((_, c) => [r, c])) : Array.from({ length: cols }, (_, c) => Array.from({ length: rows }, (_, r) => [r, c])).flat();
    state.storageOrder = order.map(([r, c], index) => ({ row: r, col: c, index }));
    for (const [r, c] of order) {
      const index = rowMajor ? r * cols + c : c * rows + r;
      const address = baseAddress + elementSize * index;
      steps.push(makeStep(state, `Storage position ${index} maps matrix[${r}][${c}] to address ${address}.`, { comparisons, writes }, { current: [r, c], target: [rowIndex, colIndex] }, { phase: 'map', storageIndex: index }));
    }
    const linearIndex = rowMajor ? rowIndex * cols + colIndex : colIndex * rows + rowIndex;
    state.address = baseAddress + elementSize * linearIndex;
    const formula = rowMajor ? `BA + w(i × columns + j) = ${baseAddress} + ${elementSize}(${rowIndex} × ${cols} + ${colIndex})` : `BA + w(j × rows + i) = ${baseAddress} + ${elementSize}(${colIndex} × ${rows} + ${rowIndex})`;
    steps.push(makeStep(state, `${formula} = ${state.address}.`, { comparisons, writes }, { current: [rowIndex, colIndex], target: [rowIndex, colIndex] }, { phase: 'address', formula }));
  } else if (operation === 'Convert dense matrix to 3-tuple') {
    state.tuples = [{ row: rows, col: cols, value: 0 }];
    for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) {
      comparisons += 1;
      const value = matrix[r][c];
      if (value !== 0) { state.tuples.push({ row: r, col: c, value }); state.tuples[0].value += 1; writes += 1; }
      steps.push(makeStep(state, value === 0 ? `Inspect matrix[${r}][${c}] = 0; zero values are omitted from the sparse tuple list.` : `Inspect matrix[${r}][${c}] = ${value}; append (${r}, ${c}, ${value}) to the tuple list.`, { comparisons, writes }, { current: [r, c] }, { phase: value === 0 ? 'zero' : 'nonzero' }));
    }
  } else if (operation === 'Simple transpose' || operation === 'Fast transpose') {
    const source = denseToTriplets(matrix);
    state.tuples = snapshot(source);
    if (operation === 'Simple transpose') {
      const result = [{ row: cols, col: rows, value: source[0].value }];
      for (let col = 0; col < cols; col += 1) for (const item of source.slice(1)) {
        comparisons += 1;
        if (item.col === col) { result.push({ row: item.col, col: item.row, value: item.value }); writes += 1; }
        state.result = snapshot(result);
        steps.push(makeStep(state, item.col === col ? `Column ${col}: move (${item.row}, ${item.col}, ${item.value}) to (${item.col}, ${item.row}, ${item.value}).` : `Column ${col}: tuple at (${item.row}, ${item.col}) is not in this column; continue scanning.`, { comparisons, writes }, { current: [item.row, item.col] }, { phase: 'scan-column', column: col }));
      }
      state.result = result;
    } else {
      const fast = fastTranspose(source);
      state.counts = [...fast.counts]; state.starts = [...fast.starts];
      for (const item of fast.steps) {
        state.counts = [...item.counts]; state.starts = [...item.starts]; state.nextPosition = [...item.nextPosition];
        state.result = item.output.filter(Boolean).map(entry => ({ ...entry }));
        if (item.phase === 'place') writes += 1;
        steps.push(makeStep(state, item.phase === 'count' ? `Count non-zero terms in each column: [${item.counts.join(', ')}].` : item.phase === 'start' ? `Column ${item.column} starts at output position ${item.starts[item.column]}; prefix positions locate each transposed column.` : `Place (${item.item.row}, ${item.item.col}, ${item.item.value}) at output position ${item.destination}.`, { comparisons, writes }, item.phase === 'place' ? { current: [item.item.row, item.item.col] } : {}, { phase: item.phase, column: item.column, destination: item.destination }));
      }
      state.result = snapshot(fast.terms);
    }
  } else if (operation === 'Sparse matrix addition') {
    if (!matrixB || matrixB.length !== rows || matrixB.some(row => row.length !== cols)) throw new Error('Matrix A and Matrix B must have the same dimensions.');
    const a = denseToTriplets(matrix).slice(1), b = denseToTriplets(matrixB).slice(1), result = [];
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      const left = a[i], right = b[j];
      if (left && right) comparisons += 1;
      if (!right || (left && (left.row < right.row || (left.row === right.row && left.col < right.col)))) { result.push({ ...left }); i += 1; writes += 1; steps.push(makeStep({ ...state, result }, `Only A has a term at (${left.row}, ${left.col}); copy ${left.value} to the result.`, { comparisons, writes }, { coordinate: [left.row, left.col] }, { phase: 'copy-a' })); }
      else if (!left || right.row < left.row || (right.row === left.row && right.col < left.col)) { result.push({ ...right }); j += 1; writes += 1; steps.push(makeStep({ ...state, result }, `Only B has a term at (${right.row}, ${right.col}); copy ${right.value} to the result.`, { comparisons, writes }, { coordinate: [right.row, right.col] }, { phase: 'copy-b' })); }
      else { const sum = left.value + right.value; if (sum !== 0) { result.push({ row: left.row, col: left.col, value: sum }); writes += 1; } i += 1; j += 1; steps.push(makeStep({ ...state, result }, `${left.value} + ${right.value} at (${left.row}, ${left.col}) ${sum === 0 ? 'cancel to zero and are omitted' : `combine to ${sum}`}.`, { comparisons, writes }, { coordinate: [left.row, left.col] }, { phase: 'combine' })); }
    }
    state.result = [{ row: rows, col: cols, value: result.length }, ...result];
    steps.push(makeStep(state, `Sparse addition complete with ${result.length} non-zero result term(s).`, { comparisons, writes }, {}, { phase: 'complete' }));
  } else throw new Error('Select a supported matrix operation.');
  if (!steps.length) steps.push(makeStep(state, 'The operation completed without any terms to process.', { comparisons, writes }, {}, { phase: 'complete' }));
  if (steps.at(-1).state !== state) steps.push(makeStep(state, steps.at(-1).message, { comparisons, writes }, {}, { phase: 'complete' }));
  return steps;
}

export function parsePolynomial(text) {
  const compact = text.replace(/\s+/g, '');
  if (!compact) throw new Error('Enter a polynomial such as 4x^3 - 2x + 7.');
  const raw = compact.match(/[+-]?[^+-]+/g) ?? [];
  if (raw.join('') !== compact) throw new Error('Use terms like 4x^3, -2x, or 7.');
  const combined = new Map();
  for (const term of raw) {
    const match = term.match(/^([+-]?)(\d*)(x(?:\^(\d+))?)?$/i);
    if (!match || (!match[2] && !match[3])) throw new Error(`Invalid polynomial term: ${term}.`);
    const sign = match[1] === '-' ? -1 : 1;
    const coefficient = sign * (match[3] ? Number(match[2] || 1) : Number(match[2]));
    const exponent = match[3] ? Number(match[4] ?? 1) : 0;
    if (!Number.isSafeInteger(coefficient) || !Number.isSafeInteger(exponent)) throw new Error('Coefficients and exponents must be safe integers.');
    combined.set(exponent, (combined.get(exponent) ?? 0) + coefficient);
  }
  return [...combined].filter(([, coefficient]) => coefficient !== 0).map(([exponent, coefficient]) => ({ coefficient, exponent })).sort((a, b) => b.exponent - a.exponent);
}

export function normalizePolynomial(terms) {
  const byExponent = new Map();
  for (const term of terms) byExponent.set(term.exponent, (byExponent.get(term.exponent) ?? 0) + term.coefficient);
  return [...byExponent].filter(([, coefficient]) => coefficient !== 0).map(([exponent, coefficient]) => ({ coefficient, exponent })).sort((a, b) => b.exponent - a.exponent);
}

export function formatPolynomial(terms) {
  if (!terms.length) return '0';
  return terms.map((term, index) => {
    const abs = Math.abs(term.coefficient), body = term.exponent === 0 ? String(abs) : `${abs === 1 ? '' : abs}x${term.exponent === 1 ? '' : `^${term.exponent}`}`;
    return `${index === 0 ? (term.coefficient < 0 ? '-' : '') : term.coefficient < 0 ? ' - ' : ' + '}${body}`;
  }).join('');
}

export function makePolynomialSteps(operation, a, b) {
  const state = { a: snapshot(a), b: snapshot(b), result: [], aIndex: 0, bIndex: 0, currentProduct: null };
  const steps = []; let comparisons = 0, writes = 0, multiplications = 0;
  if (operation === 'Polynomial addition') {
    let i = 0, j = 0; const result = [];
    while (i < a.length || j < b.length) {
      const left = a[i], right = b[j];
      state.aIndex = i; state.bIndex = j;
      if (!left) { result.push({ ...right }); j += 1; writes += 1; steps.push(makeStep({ ...state, result }, `Copy B's remaining ${formatPolynomial([right])} term into the result.`, { comparisons, writes }, { b: j - 1 }, { phase: 'copy-b' })); }
      else if (!right) { result.push({ ...left }); i += 1; writes += 1; steps.push(makeStep({ ...state, result }, `Copy A's remaining ${formatPolynomial([left])} term into the result.`, { comparisons, writes }, { a: i - 1 }, { phase: 'copy-a' })); }
      else { comparisons += 1; if (left.exponent === right.exponent) { const sum = left.coefficient + right.coefficient; if (sum) { result.push({ coefficient: sum, exponent: left.exponent }); writes += 1; } steps.push(makeStep({ ...state, result }, `Both terms have exponent ${left.exponent}. Add coefficients: ${left.coefficient} + ${right.coefficient} = ${sum}.`, { comparisons, writes }, { a: i, b: j }, { phase: 'combine' })); i += 1; j += 1; }
        else if (left.exponent > right.exponent) { result.push({ ...left }); writes += 1; steps.push(makeStep({ ...state, result }, `A's exponent ${left.exponent} is larger; copy ${formatPolynomial([left])} into the result.`, { comparisons, writes }, { a: i }, { phase: 'copy-a' })); i += 1; }
        else { result.push({ ...right }); writes += 1; steps.push(makeStep({ ...state, result }, `B's exponent ${right.exponent} is larger; copy ${formatPolynomial([right])} into the result.`, { comparisons, writes }, { b: j }, { phase: 'copy-b' })); j += 1; }
      }
      state.result = snapshot(result);
    }
    state.result = normalizePolynomial(result);
  } else if (operation === 'Polynomial multiplication') {
    const result = new Map();
    for (let i = 0; i < a.length; i += 1) for (let j = 0; j < b.length; j += 1) {
      const coefficient = a[i].coefficient * b[j].coefficient, exponent = a[i].exponent + b[j].exponent;
      state.aIndex = i; state.bIndex = j; state.currentProduct = { coefficient, exponent };
      const previous = result.get(exponent) ?? 0; result.set(exponent, previous + coefficient); writes += 1; multiplications += 1;
      state.result = normalizePolynomial([...result].map(([e, c]) => ({ exponent: e, coefficient: c })));
      steps.push(makeStep(state, `(${formatPolynomial([a[i]])})(${formatPolynomial([b[j]])}) = ${formatPolynomial([{ coefficient, exponent }])}${previous ? `; combine with existing x^${exponent} coefficient ${previous}.` : '.'}`, { comparisons, writes, multiplications }, { a: i, b: j }, { phase: previous ? 'combine-product' : 'multiply' }));
    }
    state.result = normalizePolynomial([...result].map(([exponent, coefficient]) => ({ coefficient, exponent })));
  } else throw new Error('Select Polynomial addition or Polynomial multiplication.');
  steps.push(makeStep(state, `${operation} complete: ${formatPolynomial(state.result)}.`, { comparisons, writes, multiplications }, {}, { phase: 'complete' }));
  return steps;
}

const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
const rightAssociative = new Set(['^']);
export function tokenizeExpression(expression) {
  const compact = expression.replace(/\s+/g, '');
  const tokens = compact.match(/[A-Za-z][A-Za-z0-9]*|\d+(?:\.\d+)?|[()+\-*/^]/g) ?? [];
  if (!compact || tokens.join('') !== compact) throw new Error('Use operands, + - * / ^, and parentheses.');
  return tokens;
}

function validateInfix(tokens) {
  let expectsOperand = true, depth = 0;
  for (const token of tokens) {
    const operand = /^[A-Za-z][A-Za-z0-9]*$/.test(token) || /^\d+(?:\.\d+)?$/.test(token);
    if (operand) {
      if (!expectsOperand) throw new Error('Place an operator between operands.');
      expectsOperand = false;
    } else if (token === '(') {
      if (!expectsOperand) throw new Error('Place an operator before an opening parenthesis.');
      depth += 1;
    } else if (token === ')') {
      if (expectsOperand || depth === 0) throw new Error('Check the position and matching pair of parentheses.');
      depth -= 1; expectsOperand = false;
    } else if (precedence[token]) {
      if (expectsOperand) throw new Error(`Operator ${token} needs a left operand.`);
      expectsOperand = true;
    }
  }
  if (expectsOperand) throw new Error('Expression must end with an operand.');
  if (depth !== 0) throw new Error('Mismatched parentheses.');
}

export function makeExpressionSteps(operation, expression) {
  const tokens = operation === 'Balanced Parentheses'
    ? [...expression]
    : operation === 'Postfix Evaluation'
      ? expression.trim().split(/\s+/).filter(Boolean)
      : tokenizeExpression(expression);
  const steps = [];
  let comparisons = 0, writes = 0;
  if (operation === 'Balanced Parentheses') {
    const stack = [];
    for (let i = 0; i < expression.length; i += 1) {
      const token = expression[i];
      if ('([{'.includes(token)) { stack.push({ token, index: i }); writes += 1; steps.push(makeStep({ expression, stack: stack.map(x => x.token), output: '', token, result: null }, `Push opening delimiter ${token} at position ${i}.`, { comparisons, writes }, { current: i }, { phase: 'push' })); }
      else if (')]}'.includes(token)) { comparisons += 1; const pair = { ')': '(', ']': '[', '}': '{' }[token], top = stack.at(-1);
        if (top?.token === pair) { stack.pop(); writes += 1; steps.push(makeStep({ expression, stack: stack.map(x => x.token), output: '', token, result: null }, `Closing ${token} matches ${pair}; pop the stack.`, { comparisons, writes }, { current: i }, { phase: 'pop' })); }
        else { steps.push(makeStep({ expression, stack: stack.map(x => x.token), output: '', token, result: false }, `Closing ${token} has no matching ${pair} at the top of the stack.`, { comparisons, writes }, { current: i }, { phase: 'mismatch' })); break; }
      }
    }
    const balanced = stack.length === 0 && !steps.some(step => step.visual.phase === 'mismatch');
    steps.push(makeStep({ expression, stack: stack.map(x => x.token), output: '', token: null, result: balanced }, balanced ? 'Balanced: every opening delimiter has a matching closing delimiter in the correct order.' : 'Not balanced: an opening delimiter remains unmatched or a closing delimiter did not match.', { comparisons, writes }, {}, { phase: 'complete' }));
  } else if (operation === 'Postfix Evaluation') {
    const stack = [];
    tokens.forEach((token, index) => {
      if (/^-?(?:\d+(?:\.\d+)?)$/.test(token)) { stack.push(Number(token)); writes += 1; steps.push(makeStep({ expression, token, stack: [...stack], output: '', result: null }, `Push operand ${token} onto the evaluation stack.`, { comparisons, writes }, { current: index }, { phase: 'push' })); }
      else if (precedence[token]) { if (stack.length < 2) throw new Error(`Operator ${token} at token ${index + 1} needs two operands.`); const right = stack.pop(), left = stack.pop(); comparisons += 1; const value = token === '+' ? left + right : token === '-' ? left - right : token === '*' ? left * right : token === '/' ? left / right : left ** right; if (!Number.isFinite(value)) throw new Error('Expression produced a non-finite result.'); stack.push(value); writes += 1; steps.push(makeStep({ expression, token, stack: [...stack], output: '', result: null, operands: [left, right], value }, `Pop ${left} and ${right}, apply ${token}: ${left} ${token} ${right} = ${value}.`, { comparisons, writes }, { current: index }, { phase: 'evaluate' })); }
      else throw new Error(`Invalid postfix token: ${token}.`);
    });
    if (stack.length !== 1) throw new Error('A valid postfix expression must leave exactly one value.');
    steps.push(makeStep({ expression, token: null, stack: [...stack], output: '', result: stack[0] }, `Evaluation complete: ${stack[0]}.`, { comparisons, writes }, {}, { phase: 'complete' }));
  } else if (operation === 'Infix to Postfix' || operation === 'Infix to Prefix') {
    validateInfix(tokens);
    const prefix = operation === 'Infix to Prefix';
    const scan = prefix ? [...tokens].reverse().map(token => token === '(' ? ')' : token === ')' ? '(' : token) : tokens;
    const stack = [], output = [];
    for (let i = 0; i < scan.length; i += 1) {
      const token = scan[i];
      if (/^[A-Za-z][A-Za-z0-9]*$/.test(token) || /^\d+(?:\.\d+)?$/.test(token)) { output.push(token); writes += 1; steps.push(makeStep({ expression, scan, token, scanIndex: i, stack: [...stack], output: [...output], result: null }, `Append operand ${token} to the ${prefix ? 'reversed postfix' : 'postfix'} output.`, { comparisons, writes }, { current: i }, { phase: 'operand', conversion: prefix ? 'prefix' : 'postfix' })); }
      else if (token === '(') { stack.push(token); steps.push(makeStep({ expression, scan, token, scanIndex: i, stack: [...stack], output: [...output], result: null }, 'Push opening parenthesis onto the operator stack.', { comparisons, writes }, { current: i }, { phase: 'push-paren' })); }
      else if (token === ')') { while (stack.length && stack.at(-1) !== '(') { const op = stack.pop(); output.push(op); writes += 1; steps.push(makeStep({ expression, scan, token, scanIndex: i, stack: [...stack], output: [...output], result: null }, `Pop ${op} until the matching opening parenthesis and append it to output.`, { comparisons, writes }, { current: i }, { phase: 'pop-op' })); } if (!stack.length) throw new Error('Mismatched parentheses.'); stack.pop(); steps.push(makeStep({ expression, scan, token, scanIndex: i, stack: [...stack], output: [...output], result: null }, 'Discard the matching parenthesis pair.', { comparisons, writes }, { current: i }, { phase: 'close-paren' })); }
      else if (precedence[token]) {
        while (stack.length && precedence[stack.at(-1)]) { comparisons += 1; const top = stack.at(-1); const equalShouldPop = prefix ? rightAssociative.has(token) : !rightAssociative.has(token); if (precedence[top] < precedence[token] || (precedence[top] === precedence[token] && !equalShouldPop)) break; output.push(stack.pop()); writes += 1; }
        stack.push(token); steps.push(makeStep({ expression, scan, token, scanIndex: i, stack: [...stack], output: [...output], result: null }, `Push ${token}; precedence and associativity determine which earlier operators are emitted first.`, { comparisons, writes }, { current: i }, { phase: 'push-op', conversion: prefix ? 'prefix' : 'postfix' }));
      } else throw new Error(`Unsupported token ${token}.`);
    }
    while (stack.length) { const op = stack.pop(); if (op === '(') throw new Error('Mismatched parentheses.'); output.push(op); writes += 1; steps.push(makeStep({ expression, scan, token: null, scanIndex: scan.length, stack: [...stack], output: [...output], result: null }, `Pop remaining operator ${op} to the output.`, { comparisons, writes }, {}, { phase: 'drain', conversion: prefix ? 'prefix' : 'postfix' })); }
    const resultTokens = prefix ? [...output].reverse() : output;
    const result = resultTokens.join(' ');
    steps.push(makeStep({ expression, scan, token: null, scanIndex: scan.length, stack: [], output: [...output], result }, `${operation} conversion complete: ${result}.`, { comparisons, writes }, {}, { phase: 'complete', conversion: prefix ? 'prefix' : 'postfix' }));
  } else throw new Error('Select a supported expression operation.');
  return steps;
}
