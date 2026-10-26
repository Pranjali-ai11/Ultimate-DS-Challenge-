import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import type { TeachingStep } from './additionalTopicSteps.js';
import { formatPolynomial, makeExpressionSteps, makeMatrixSteps, makePolynomialSteps, parseMatrixInput as parseMatrix, parsePolynomial as parsePoly } from './additionalTopicSteps.js';
import { createDeque, dequeValues, makeMazeSteps, makeNQueensSteps, makeRecursionSteps, runDequeOperation } from './recursionDequeSteps.js';
import type { DequeState } from './recursionDequeSteps.js';

type Topic = 'matrix' | 'polynomial' | 'expressions' | 'recursion' | 'deque';
type Props = {
  topic: Topic;
  operation: string;
  dequeCapacity: number;
  onDequeCapacityChange: (capacity: number) => void;
  dequeMode: string;
  onDequeModeChange: (mode: string) => void;
  dequeState: DequeState;
  onDequeStateChange: (state: DequeState) => void;
};
type Point = [number, number];
type Step = TeachingStep;

const initialMaze = [[0, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 0, 0, 1, 0], [1, 1, 0, 0, 0], [0, 0, 0, 1, 0]];
const initialMatrix = '0 0 5\n0 8 0\n3 0 0';
const initialMatrixB = '1 0 0\n0 2 0\n0 0 1';

const copy = <T,>(value: T): T => structuredClone(value);
const samePoint = (points: Point[] | undefined, r: number, c: number) => points?.some(([row, col]) => row === r && col === c) ?? false;

const operationInfo: Record<string, { explanation: string; time: string; space: string; legend: string }> = {
  'Row-major address calculation': { explanation: 'Row-major storage places each complete row in consecutive memory.', time: 'O(1) address formula · O(rows × cols) visual trace', space: 'O(rows × cols) snapshots', legend: 'Cyan marks the requested element; numbered tags show its linear storage position.' },
  'Column-major address calculation': { explanation: 'Column-major storage places each complete column in consecutive memory.', time: 'O(1) address formula · O(rows × cols) visual trace', space: 'O(rows × cols) snapshots', legend: 'Cyan marks the requested element; numbered tags show its linear storage position.' },
  'Convert dense matrix to 3-tuple': { explanation: 'Scan each cell and record only non-zero values as row, column, value tuples.', time: 'O(rows × cols)', space: 'O(nnz)', legend: 'Amber marks the cell being inspected; cyan tuples are non-zero entries already emitted.' },
  'Simple transpose': { explanation: 'Visit source columns in order and swap each non-zero term’s row and column.', time: 'O(columns × nnz)', space: 'O(nnz)', legend: 'Amber marks the source term currently checked; green rows are in the transpose.' },
  'Fast transpose': { explanation: 'Count terms per source column, compute each output start, then place every term directly.', time: 'O(columns + nnz)', space: 'O(columns + nnz)', legend: 'Cyan shows the current term; violet shows column counts and destination starts.' },
  'Sparse matrix addition': { explanation: 'Merge coordinate-sorted non-zero terms; equal coordinates are added and zero sums omitted.', time: 'O(nnzA + nnzB)', space: 'O(nnzA + nnzB)', legend: 'Amber marks coordinates being compared; green terms are in the result.' },
  'Polynomial addition': { explanation: 'Merge descending exponent lists, adding coefficients when exponents match.', time: 'O(m + n)', space: 'O(m + n)', legend: 'Cyan marks the current A term, violet the current B term, green the running result.' },
  'Polynomial multiplication': { explanation: 'Multiply each term pair, add exponents, multiply coefficients, then combine like powers.', time: 'O(m × n)', space: 'O(u)', legend: 'Cyan and violet mark the selected terms; amber highlights a power being combined.' },
  'Infix to Postfix': { explanation: 'Scan tokens left to right and use an operator stack to respect precedence and parentheses.', time: 'O(t)', space: 'O(t)', legend: 'Cyan marks the scan token; violet is the operator stack; green is emitted output.' },
  'Infix to Prefix': { explanation: 'Reverse and bracket-swap the infix expression, convert with reversed associativity, then reverse the output.', time: 'O(t)', space: 'O(t)', legend: 'Cyan marks the scan token; violet is the operator stack; green is the conversion output.' },
  'Postfix Evaluation': { explanation: 'Push operands; each operator pops its right and left operands and pushes the computed value.', time: 'O(t)', space: 'O(t)', legend: 'Cyan marks the current token; violet items are values on the evaluation stack.' },
  'Balanced Parentheses': { explanation: 'Push opening delimiters and pop only when a matching closer appears at the top.', time: 'O(t)', space: 'O(t)', legend: 'Cyan marks the current delimiter; violet delimiters are open on the stack.' },
  Factorial: { explanation: 'Direct recursion pushes calls until the base case, then returns multiplied values.', time: 'O(n)', space: 'O(n) call stack', legend: 'Cyan is the active call; green marks a returned result.' },
  Fibonacci: { explanation: 'Tree recursion evaluates fib(n − 1) and fib(n − 2) calls before returning their sum.', time: 'O(2^n) calls', space: 'O(n) maximum call depth', legend: 'Cyan is the active call; green nodes have returned.' },
  'Tail-style factorial': { explanation: 'Pass the accumulated product into each recursive call; this JavaScript implementation still uses O(n) frames.', time: 'O(n)', space: 'O(n) call stack', legend: 'Cyan is the active call; green marks a returned accumulator.' },
  'Head recursion': { explanation: 'Make the recursive call before doing work, so values are visited while calls return.', time: 'O(n)', space: 'O(n) call stack', legend: 'Cyan is the active call; green values have been visited on return.' },
  'Indirect recursion': { explanation: 'isEven and isOdd call one another with decreasing input until reaching zero.', time: 'O(n)', space: 'O(n) call stack', legend: 'Cyan is the active isEven/isOdd call; green is the base-case result.' },
  'N-Queens': { explanation: 'Try one column per row, reject column/diagonal conflicts, and backtrack when a row has no valid placement.', time: 'O(n!) upper bound', space: 'O(n) search state + board', legend: 'Cyan is the candidate; green is a placed queen; rose marks a conflict or backtrack.' },
  'Rat in a Maze': { explanation: 'Depth-first backtracking explores open neighboring cells and removes dead ends from the current path.', time: 'O(rows × columns)', space: 'O(rows × columns)', legend: 'Cyan is the current cell; violet is the active path; green is the found path; slate is a wall.' },
  'Insert Front': { explanation: 'Move the circular front index backward and place the value in the new front slot.', time: 'O(1) endpoint operation', space: 'O(capacity)', legend: 'Cyan is FRONT; violet is REAR; green marks the slot changed by this operation.' },
  'Insert Rear': { explanation: 'Place the value at (front + size) modulo capacity, then increase size.', time: 'O(1) endpoint operation', space: 'O(capacity)', legend: 'Cyan is FRONT; violet is REAR; green marks the slot changed by this operation.' },
  'Delete Front': { explanation: 'Remove the front item and advance the front index around the circular buffer.', time: 'O(1) endpoint operation', space: 'O(capacity)', legend: 'Cyan is FRONT; violet is REAR; rose marks the removed slot.' },
  'Delete Rear': { explanation: 'Remove the item at the logical rear without moving other entries.', time: 'O(1) endpoint operation', space: 'O(capacity)', legend: 'Cyan is FRONT; violet is REAR; rose marks the removed slot.' },
  'Peek Front': { explanation: 'Read the front item without changing the deque.', time: 'O(1)', space: 'O(capacity)', legend: 'Cyan is FRONT; violet is REAR; amber marks the inspected end.' },
  'Peek Rear': { explanation: 'Read the rear item without changing the deque.', time: 'O(1)', space: 'O(capacity)', legend: 'Cyan is FRONT; violet is REAR; amber marks the inspected end.' },
};

function createSteps(topic: Topic, operation: string, values: { matrix: number[][]; matrixB: number[][]; base: number; elementSize: number; row: number; col: number; polyA: string; polyB: string; expression: string; n: number; maze: number[][]; deque: ReturnType<typeof createDeque>; mode: string; dequeValue: string }) {
  if (topic === 'matrix') return makeMatrixSteps(operation, { matrix: values.matrix, matrixB: values.matrixB, baseAddress: values.base, elementSize: values.elementSize, rowIndex: values.row, colIndex: values.col });
  if (topic === 'polynomial') return makePolynomialSteps(operation, parsePoly(values.polyA), parsePoly(values.polyB));
  if (topic === 'expressions') return makeExpressionSteps(operation, values.expression);
  if (topic === 'recursion') return operation === 'N-Queens' ? makeNQueensSteps(values.n) : operation === 'Rat in a Maze' ? makeMazeSteps(values.maze) : makeRecursionSteps(operation, values.n);
  if (topic === 'deque') return runDequeOperation(values.deque, values.mode, operation, values.dequeValue).steps;
  return [];
}

export function AdditionalTopicVisualizer({ topic, operation, dequeCapacity, onDequeCapacityChange, dequeMode, onDequeModeChange, dequeState, onDequeStateChange }: Props) {
  const [matrixText, setMatrixText] = useState(initialMatrix);
  const [matrixBText, setMatrixBText] = useState(initialMatrixB);
  const [baseText, setBaseText] = useState('1000');
  const [elementSizeText, setElementSizeText] = useState('4');
  const [rowText, setRowText] = useState('1');
  const [colText, setColText] = useState('1');
  const [polyA, setPolyA] = useState('4x^3 + 2x^2 - 5x + 7');
  const [polyB, setPolyB] = useState('2x^3 - 2x^2 + 3');
  const [expression, setExpression] = useState(operation === 'Postfix Evaluation' ? '5 3 + 2 *' : operation === 'Balanced Parentheses' ? '{a + [b * (c)]}' : 'A + B * C');
  const [nText, setNText] = useState(topic === 'recursion' && operation === 'N-Queens' ? '4' : '5');
  const [maze, setMaze] = useState<number[][]>(() => copy(initialMaze));
  const [dequeValue, setDequeValue] = useState('42');
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [speed, setSpeed] = useState(700);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [inputNotice, setInputNotice] = useState('');

  const inputValues = useMemo(() => {
    try {
      return { matrix: topic === 'matrix' ? parseMatrix(matrixText) : [[0]], matrixB: topic === 'matrix' ? parseMatrix(matrixBText) : [[0]], base: Number(baseText), elementSize: Number(elementSizeText), row: Number(rowText), col: Number(colText), polyA, polyB, expression, n: Number(nText), maze, deque: dequeState, mode: dequeMode, dequeValue };
    } catch {
      return null;
    }
  }, [topic, matrixText, matrixBText, baseText, elementSizeText, rowText, colText, polyA, polyB, expression, nText, maze, dequeState, dequeMode, dequeValue]);

  const current = steps[stepIndex];
  const info = operationInfo[operation] ?? operationInfo.Factorial;
  const parsedMatrix = useMemo(() => { try { return parseMatrix(matrixText); } catch { return null; } }, [matrixText]);
  const parsedMatrixB = useMemo(() => { try { return parseMatrix(matrixBText); } catch { return null; } }, [matrixBText]);

  const run = () => {
    setPlaying(false); setError(''); setInputNotice('');
    try {
      if (!parsedMatrix && topic === 'matrix') throw new Error('Enter a rectangular matrix with 1–6 rows and columns.');
      if (!parsedMatrixB && topic === 'matrix' && operation === 'Sparse matrix addition') throw new Error('Enter Matrix B as a rectangular matrix with 1–6 rows and columns.');
      const values = {
        matrix: parsedMatrix ?? [[0]], matrixB: parsedMatrixB ?? [[0]],
        base: Number(baseText), elementSize: Number(elementSizeText), row: Number(rowText), col: Number(colText),
        polyA, polyB, expression, n: Number(nText), maze, deque: dequeState, mode: dequeMode, dequeValue,
      };
      if (topic === 'matrix' && [baseText, elementSizeText, rowText, colText].some(value => !value.trim())) throw new Error('Enter a base address, element size, row index, and column index.');
      if (topic === 'matrix' && [values.base, values.elementSize, values.row, values.col].some(value => !Number.isSafeInteger(value))) throw new Error('Address inputs must be whole numbers.');
      if (topic === 'recursion' && !Number.isInteger(values.n)) throw new Error('Enter a whole-number recursion input.');
      const next = createSteps(topic, operation, values);
      if (!next.length) throw new Error('No execution steps were generated for this input.');
      setSteps(next); setStepIndex(0);
      if (topic === 'deque') {
        const result = runDequeOperation(dequeState, dequeMode, operation, dequeValue);
        onDequeStateChange(result.state);
      }
    } catch (reason) {
      setSteps([]); setStepIndex(0); setError(reason instanceof Error ? reason.message : 'Unable to run this operation.');
    }
  };

  const reset = () => {
    setPlaying(false); setStepIndex(0); setError('');
    if (topic === 'deque') { onDequeStateChange(createDeque(dequeCapacity)); setSteps([]); }
    else if (inputValues) {
      try { setSteps(createSteps(topic, operation, inputValues)); } catch { setSteps([]); }
    } else setSteps([]);
  };

  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= steps.length - 1) return;
    const timer = window.setTimeout(() => {
      setStepIndex(index => Math.min(index + 1, steps.length - 1));
      if (stepIndex + 1 >= steps.length - 1) setPlaying(false);
    }, speed);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, steps.length, speed]);

  const setInput = (setter: (value: string) => void, value: string) => { setter(value); setInputNotice('Inputs changed. Run the operation to generate a fresh trace.'); };
  const updateCapacity = (value: number) => { onDequeCapacityChange(value); onDequeStateChange(createDeque(value)); setSteps([]); setStepIndex(0); setPlaying(false); };
  const toggleWall = (r: number, c: number) => { if ((r === 0 && c === 0) || (r === maze.length - 1 && c === maze[0].length - 1)) return; setMaze(currentMaze => currentMaze.map((line, ri) => line.map((cell, ci) => ri === r && ci === c ? (cell ? 0 : 1) : cell))); setInputNotice('Maze changed. Run the operation to generate a fresh trace.'); };

  return <section className="vh-additional" aria-label={`${operation} visualization`}>
    <header className="vh-additional-heading"><div><p>INTERACTIVE DEMONSTRATION</p><h3>{operation}</h3><span>{info.explanation}</span></div><div className="vh-complexity"><span>TIME <b>{info.time}</b></span><span>AUXILIARY SPACE <b>{info.space}</b></span></div></header>
    <div className="vh-additional-inputs">
      {topic === 'matrix' && <>
        <label className="vh-additional-field vh-wide">Matrix A<textarea aria-label="Matrix A values" value={matrixText} onChange={event => setInput(setMatrixText, event.target.value)} rows={3} /></label>
        {operation === 'Sparse matrix addition' && <label className="vh-additional-field vh-wide">Matrix B<textarea aria-label="Matrix B values" value={matrixBText} onChange={event => setInput(setMatrixBText, event.target.value)} rows={3} /></label>}
        {(operation.includes('address')) && <>
          <label className="vh-additional-field">Base address<input aria-label="Base address" value={baseText} onChange={event => setInput(setBaseText, event.target.value)} /></label>
          <label className="vh-additional-field">Element size<input aria-label="Element size in bytes" value={elementSizeText} onChange={event => setInput(setElementSizeText, event.target.value)} /></label>
          <label className="vh-additional-field">Row index i<input aria-label="Row index i" value={rowText} onChange={event => setInput(setRowText, event.target.value)} /></label>
          <label className="vh-additional-field">Column index j<input aria-label="Column index j" value={colText} onChange={event => setInput(setColText, event.target.value)} /></label>
        </>}
      </>}
      {topic === 'polynomial' && <>
        <label className="vh-additional-field vh-wide">Polynomial A<input aria-label="Polynomial A" value={polyA} onChange={event => setInput(setPolyA, event.target.value)} /></label>
        <label className="vh-additional-field vh-wide">Polynomial B<input aria-label="Polynomial B" value={polyB} onChange={event => setInput(setPolyB, event.target.value)} /></label>
      </>}
      {topic === 'expressions' && <label className="vh-additional-field vh-wide">{operation === 'Postfix Evaluation' ? 'Postfix expression' : 'Expression'}<input aria-label={operation === 'Postfix Evaluation' ? 'Postfix expression' : 'Expression'} value={expression} onChange={event => setInput(setExpression, event.target.value)} /></label>}
      {topic === 'recursion' && operation !== 'Rat in a Maze' && <label className="vh-additional-field">{operation === 'N-Queens' ? 'Board size' : 'Input n'}<select aria-label={operation === 'N-Queens' ? 'N-Queens board size' : 'Recursion input n'} value={nText} onChange={event => setInput(setNText, event.target.value)}>{(operation === 'N-Queens' ? [4, 5, 6] : operation === 'Fibonacci' ? [0, 1, 2, 3, 4, 5, 6, 7] : Array.from({ length: 11 }, (_, i) => i)).map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
      {topic === 'deque' && <>
        <label className="vh-additional-field">Capacity<select aria-label="Deque capacity" value={dequeCapacity} onChange={event => updateCapacity(Number(event.target.value))}>{Array.from({ length: 8 }, (_, i) => i + 1).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="vh-additional-field">Mode<select aria-label="Deque mode" value={dequeMode} onChange={event => { onDequeModeChange(event.target.value); setSteps([]); setStepIndex(0); setPlaying(false); }}>{['Standard Deque', 'Input-Restricted Deque', 'Output-Restricted Deque'].map(mode => <option key={mode}>{mode}</option>)}</select></label>
        {operation.startsWith('Insert') && <label className="vh-additional-field">Value<input aria-label="Deque insertion value" value={dequeValue} onChange={event => setDequeValue(event.target.value)} /></label>}
      </>}
      <button type="button" className="vh-action-outline vh-additional-run" onClick={run}>Run Operation</button>
    </div>
    {topic === 'recursion' && operation === 'Rat in a Maze' && <div className="vh-maze-editor"><span>Maze editor · click open cells to toggle walls; start and goal stay open.</span><MazeGrid maze={maze} onToggle={toggleWall} /></div>}
    {error && <p className="vh-error" role="alert">{error}</p>}
    {inputNotice && !error && <p className="vh-note" role="status">{inputNotice}</p>}
    <div className="vh-additional-stage">
      {topic === 'matrix' && <MatrixStage operation={operation} step={current} matrix={parsedMatrix} matrixB={parsedMatrixB} />}
      {topic === 'polynomial' && <PolynomialStage step={current} polyA={polyA} polyB={polyB} />}
      {topic === 'expressions' && <ExpressionStage operation={operation} step={current} expression={expression} />}
      {topic === 'recursion' && <RecursionStage operation={operation} step={current} maze={maze} n={Number(nText)} />}
      {topic === 'deque' && <DequeStage step={current} deque={current?.state ?? dequeState} capacity={dequeCapacity} />}
    </div>
    <p className="vh-additional-legend"><strong>Legend</strong> · {info.legend}</p>
    <p className="vh-additional-status" role="status" aria-live="polite">{current?.message ?? (error || 'Adjust the inputs and run this operation to inspect its execution.')}</p>
    <div className="vh-additional-stats">{Object.entries(current?.stats ?? {}).map(([label, value]) => <span key={label}>{label}: <b>{value}</b></span>)}</div>
    <div className="vh-playback">
      <div className="vh-playback-buttons">
        <button type="button" aria-label="Play visualization" className="vh-play" disabled={!steps.length || stepIndex >= steps.length - 1} onClick={() => setPlaying(true)}><Play size={15} />Play</button>
        <button type="button" aria-label="Pause visualization" className="vh-neutral" disabled={!playing} onClick={() => setPlaying(false)}><Pause size={15} />Pause</button>
        <button type="button" aria-label="Previous step" className="vh-neutral" disabled={!steps.length || stepIndex <= 0} onClick={() => { setPlaying(false); setStepIndex(index => Math.max(0, index - 1)); }}><SkipBack size={15} />Previous</button>
        <button type="button" aria-label="Next step" className="vh-next" disabled={!steps.length || stepIndex >= steps.length - 1} onClick={() => { setPlaying(false); setStepIndex(index => Math.min(steps.length - 1, index + 1)); }}><SkipForward size={15} />Next</button>
        <button type="button" aria-label="Reset visualization" className="vh-neutral" onClick={reset}><RotateCcw size={15} />Reset</button>
      </div>
      <label className="vh-speed">Speed <input aria-label="Visualization speed" type="range" min="250" max="1400" step="50" value={speed} onChange={event => setSpeed(Number(event.target.value))} /> <span>{speed} ms</span></label>
      <div className="vh-step-progress"><span>Step {steps.length ? stepIndex + 1 : 0} of {steps.length}</span><progress value={steps.length ? stepIndex + 1 : 0} max={Math.max(steps.length, 1)} /></div>
    </div>
  </section>;
}

function MatrixGrid({ matrix, current, storageOrder = [], target, title }: { matrix: number[][]; current?: Point; storageOrder?: Array<{ row: number; col: number; index: number }>; target?: Point; title: string }) {
  return <div className="vh-matrix-block"><h4>{title}</h4><div className="vh-matrix-grid" style={{ gridTemplateColumns: `repeat(${matrix[0]?.length ?? 1}, minmax(44px, 1fr))` }}>{matrix.flatMap((row, r) => row.map((value, c) => {
    const order = storageOrder.find(item => item.row === r && item.col === c)?.index;
    const active = current?.[0] === r && current?.[1] === c, selected = target?.[0] === r && target?.[1] === c;
    return <div key={`${r}-${c}`} className={`vh-matrix-cell${active ? ' active' : ''}${selected ? ' target' : ''}`}><b>{value}</b>{order !== undefined && <small>#{order}</small>}<small>[{r},{c}]</small></div>;
  }))}</div></div>;
}

function TupleTable({ tuples, title }: { tuples: Array<{ row: number; col: number; value: number }>; title: string }) {
  return <div className="vh-tuple-block"><h4>{title}</h4><div className="vh-tuple-scroll"><table><thead><tr><th>row</th><th>col</th><th>value</th></tr></thead><tbody>{tuples.map((tuple, index) => <tr key={`${tuple.row}-${tuple.col}-${index}`}><td>{tuple.row}</td><td>{tuple.col}</td><td>{tuple.value}</td></tr>)}</tbody></table>{!tuples.length && <p>No non-zero terms yet.</p>}</div></div>;
}

function MatrixStage({ operation, step, matrix, matrixB }: { operation: string; step?: Step; matrix: number[][] | null; matrixB: number[][] | null }) {
  if (!matrix) return <p className="vh-empty">Enter a valid matrix to preview its cells.</p>;
  const state = step?.state ?? { matrix, matrixB, result: [], tuples: [], counts: [], starts: [], storageOrder: [], address: null };
  const current = step?.highlights?.current as Point | undefined;
  if (operation.includes('address')) return <><div className="vh-visual-columns"><MatrixGrid matrix={matrix} current={current} target={step?.highlights?.target} storageOrder={state.storageOrder} title="Matrix and memory order" /><div className="vh-result-card"><h4>Address formula</h4><code>{step?.visual?.formula ?? 'Run the operation to calculate the address.'}</code><strong>{state.address !== null ? `Computed address: ${state.address}` : 'Address pending'}</strong><p>{operation.startsWith('Row') ? 'Rows are stored contiguously.' : 'Columns are stored contiguously.'}</p></div></div></>;
  if (operation === 'Sparse matrix addition') {
    const result = state.result ?? [];
    const header = result[0];
    const dense = header ? Array.from({ length: header.row }, () => Array(header.col).fill(0)) : [];
    result.slice(1).forEach((term: { row: number; col: number; value: number }) => { if (dense[term.row]) dense[term.row][term.col] = term.value; });
    return <><div className="vh-visual-columns"><MatrixGrid matrix={matrix} title="Matrix A" /><span className="vh-plus-sign">+</span><MatrixGrid matrix={matrixB ?? [[0]]} title="Matrix B" /><span className="vh-plus-sign">=</span><MatrixGrid matrix={dense.length ? dense : [[0]]} title="Result matrix" /></div><TupleTable tuples={result.slice(1)} title="Result 3-tuple" /></>;
  }
  if (operation === 'Convert dense matrix to 3-tuple') return <div className="vh-visual-columns"><MatrixGrid matrix={matrix} current={current} title="Dense matrix" /><TupleTable tuples={state.tuples ?? []} title="3-tuple representation" /></div>;
  const resultTuples = state.result?.[0]?.row !== undefined ? state.result.slice(1) : state.result ?? [];
  return <div className="vh-visual-columns"><TupleTable tuples={state.tuples?.slice(1) ?? []} title="Original tuple" /><TupleTable tuples={resultTuples} title="Transposed tuple" />{operation === 'Fast transpose' && <div className="vh-result-card"><h4>Fast transpose workspace</h4><p>count[]: [{(state.counts ?? []).join(', ')}]</p><p>start[]: [{(state.starts ?? []).join(', ')}]</p><p>next position[]: [{(state.nextPosition ?? []).join(', ')}]</p><p>Current destination: {step?.visual?.destination ?? '—'}</p></div>}</div>;
}

function PolynomialStage({ step, polyA, polyB }: { step?: Step; polyA: string; polyB: string }) {
  const state = step?.state;
  const list = (terms: Array<{ coefficient: number; exponent: number }> = [], pointer?: number) => <div className="vh-term-list">{terms.length ? terms.map((term, index) => <span key={`${term.exponent}-${index}`} className={index === pointer ? 'active' : ''}>{formatPolynomial([term])}</span>) : <span className="muted">0</span>}</div>;
  return <div className="vh-polynomial-stage"><section><h4>Polynomial A</h4><code>{state ? formatPolynomial(state.a) : polyA}</code>{list(state?.a, step?.highlights?.a)}</section><section><h4>Polynomial B</h4><code>{state ? formatPolynomial(state.b) : polyB}</code>{list(state?.b, step?.highlights?.b)}</section><section className="result"><h4>Running result</h4><code>{formatPolynomial(state?.result ?? [])}</code>{list(state?.result)}</section>{state?.currentProduct && <p className="vh-product-equation">Selected product: {formatPolynomial([state.currentProduct])}</p>}</div>;
}

function ExpressionStage({ operation, step, expression }: { operation: string; step?: Step; expression: string }) {
  const state = step?.state;
  return <div className="vh-expression-stage"><div className="vh-expression-source"><h4>Expression</h4><code>{expression}</code><p>Current token: <strong>{state?.token ?? '—'}</strong> · Scan position: <strong>{state?.scanIndex ?? step?.highlights?.current ?? '—'}</strong></p></div><div className="vh-visual-columns"><section><h4>{operation === 'Postfix Evaluation' ? 'Operand stack' : 'Operator stack'}</h4><div className="vh-stack-visual">{(state?.stack ?? []).map((item: string | number, index: number) => <span key={`${item}-${index}`}>{item}</span>)}{!state?.stack?.length && <small>empty</small>}</div></section>{operation !== 'Balanced Parentheses' && <section><h4>{operation === 'Postfix Evaluation' ? 'Operation' : operation === 'Infix to Prefix' ? 'Reversed postfix (reversed at finish)' : 'Postfix output'}</h4><code className="vh-expression-output">{operation === 'Postfix Evaluation' ? state?.value !== undefined ? `${state.operands?.[0]} ${state.token} ${state.operands?.[1]} = ${state.value}` : 'Waiting for an operator' : (state?.output ?? []).join(' ') || 'empty'}</code></section>}</div>{state?.result !== null && state?.result !== undefined && <p className="vh-result-card"><strong>{operation === 'Balanced Parentheses' ? state.result ? 'Balanced' : 'Not balanced' : `Result: ${state.result}`}</strong></p>}</div>;
}

function TreeStage({ tree, activeId }: { tree: Array<{ id: number; value: number; parentId: number | null; branch: string; status: string; result: number | null }>; activeId?: number }) {
  const nodes = new Map(tree.map(node => [node.id, { ...node, children: [] as number[] }]));
  tree.forEach(node => { if (node.parentId) nodes.get(node.parentId)?.children.push(node.id); });
  const positions = new Map<number, { x: number; y: number }>(); let leaf = 0;
  const place = (id: number, depth: number): number => { const node = nodes.get(id)!; const childXs = node.children.map(child => place(child, depth + 1)); const x = childXs.length ? childXs.reduce((a, b) => a + b, 0) / childXs.length : 45 + leaf++ * 54; positions.set(id, { x, y: 35 + depth * 76 }); return x; };
  if (tree.length) place(tree[0].id, 0);
  const width = Math.max(440, 90 + leaf * 54), height = Math.max(110, Math.max(0, ...[...positions.values()].map(point => point.y)) + 55);
  return <svg className="vh-call-tree" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Fibonacci recursive call tree"><g>{tree.filter(node => node.parentId).map(node => { const a = positions.get(node.parentId!)!, b = positions.get(node.id)!; return <line key={`edge-${node.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />; })}</g><g>{tree.map(node => { const point = positions.get(node.id)!; return <g key={node.id} transform={`translate(${point.x} ${point.y})`}><circle className={`${node.id === activeId ? 'active' : ''} ${node.status === 'complete' ? 'complete' : ''}`} r="19" /><text y="4">{node.value}</text><title>fib({node.value}) {node.status}{node.result === null ? '' : ` = ${node.result}`}</title></g>; })}</g></svg>;
}

function MazeGrid({ maze, onToggle, step, pathColor = false }: { maze: number[][]; onToggle?: (r: number, c: number) => void; step?: Step; pathColor?: boolean }) {
  const visited = (step?.state?.visited ?? []) as Point[], path = (step?.state?.path ?? []) as Point[], backtracked = (step?.state?.backtracked ?? []) as Point[], current = step?.highlights?.current as Point | undefined;
  return <div className="vh-maze-grid" style={{ gridTemplateColumns: `repeat(${maze[0]?.length ?? 1}, minmax(34px, 1fr))` }}>{maze.flatMap((row, r) => row.map((cell, c) => {
    const isPath = samePoint(path, r, c), isVisited = samePoint(visited, r, c), isBacktracked = samePoint(backtracked, r, c), isCurrent = samePoint(current ? [current] : [], r, c), isStart = r === 0 && c === 0, isGoal = r === maze.length - 1 && c === maze[0].length - 1;
    const label = isStart ? 'START' : isGoal ? 'GOAL' : cell ? 'WALL' : isCurrent ? 'CURRENT' : isPath ? pathColor ? 'PATH' : 'ACTIVE PATH' : isBacktracked ? 'BACKTRACKED' : isVisited ? 'VISITED' : 'OPEN';
    return onToggle ? <button type="button" key={`${r}-${c}`} aria-label={`Maze row ${r}, column ${c}, ${label}; toggle wall`} onClick={() => onToggle(r, c)} className={`vh-maze-cell${cell ? ' wall' : ''}${isStart ? ' start' : ''}${isGoal ? ' goal' : ''}`}>{isStart ? 'S' : isGoal ? 'G' : cell ? '■' : '□'}</button> : <div key={`${r}-${c}`} className={`vh-maze-cell${cell ? ' wall' : ''}${isStart ? ' start' : ''}${isGoal ? ' goal' : ''}${isCurrent ? ' current' : ''}${isPath ? pathColor ? ' found-path' : ' path' : ''}${isBacktracked ? ' backtracked' : ''}${isVisited ? ' visited' : ''}`} aria-label={`row ${r}, column ${c}: ${label}`}>{isStart ? 'S' : isGoal ? 'G' : cell ? '■' : '□'}</div>;
  }))}</div>;
}

function RecursionStage({ operation, step, maze, n }: { operation: string; step?: Step; maze: number[][]; n: number }) {
  const state = step?.state;
  if (operation === 'N-Queens') {
    const board = state?.board ?? Array(n).fill(-1), candidate = step?.highlights;
    return <div className="vh-queens-stage"><div className="vh-queens-board" style={{ gridTemplateColumns: `repeat(${board.length}, minmax(35px, 1fr))` }}>{board.flatMap((queen: number, row: number) => board.map((_: unknown, col: number) => { const isQueen = queen === col, isCandidate = candidate?.row === row && candidate?.col === col; return <div key={`${row}-${col}`} className={`vh-queen-cell${(row + col) % 2 ? ' dark' : ''}${isCandidate ? step?.visual?.phase === 'conflict' || step?.visual?.phase === 'backtrack' ? ' conflict' : ' candidate' : ''}${isQueen ? ' queen' : ''}`}>{isQueen ? '♛' : isCandidate ? '·' : ''}</div>; }))}</div><p>Solutions found: <strong>{state?.solutions ?? 0}</strong> · one queen per row; columns and diagonals must remain clear.</p></div>;
  }
  if (operation === 'Rat in a Maze') return <MazeGrid maze={maze} step={step} pathColor />;
  if (operation === 'Fibonacci') return <div className="vh-recursion-stage"><TreeStage tree={state?.tree ?? []} activeId={step?.highlights?.nodeId} /><p>Recursive calls: <strong>{step?.stats.calls ?? 0}</strong> · result: <strong>{state?.result ?? 'in progress'}</strong></p></div>;
  return <div className="vh-recursion-stage"><h4>{step?.visual?.phase === 'call' ? 'CALL' : step?.visual?.phase === 'return' || step?.visual?.phase === 'work-on-return' ? 'RETURN / UNWIND' : 'RECURSION'}</h4><div className="vh-call-stack">{(state?.frames ?? []).map((frame: string, index: number) => <div className={index === state.frames.length - 1 ? 'active' : ''} key={`${frame}-${index}`}><span>{index === state.frames.length - 1 ? 'ACTIVE' : `FRAME ${index}`}</span><code>{frame}</code></div>)}{!state?.frames?.length && <p>Call stack is empty.</p>}</div><p>Completed result: <strong>{state?.result === null || state?.result === undefined ? 'in progress' : Array.isArray(state.result) ? state.result.join(', ') : state.result.toString()}</strong></p></div>;
}

function DequeStage({ step, deque, capacity }: { step?: Step; deque: ReturnType<typeof createDeque>; capacity: number }) {
  const active = step?.highlights?.index as number | undefined;
  const rear = deque.size ? (deque.front + deque.size - 1) % capacity : -1;
  return <div className="vh-deque-stage"><div className="vh-deque-pointer-row" style={{ gridTemplateColumns: `repeat(${capacity}, minmax(0, 1fr))` }}><span style={{ gridColumn: deque.size ? `${deque.front + 1}` : '1' }}>↓ FRONT</span><span style={{ gridColumn: deque.size ? `${rear + 1}` : `${capacity}` }}>↓ REAR</span></div><div className="vh-deque-slots" style={{ gridTemplateColumns: `repeat(${capacity}, minmax(45px, 1fr))` }}>{deque.slots.map((value, index) => <div key={index} className={`vh-deque-slot${index === deque.front && deque.size ? ' front' : ''}${index === rear ? ' rear' : ''}${index === active ? ' changed' : ''}`}><span>{value ?? ' '}</span><small>[{index}]</small></div>)}</div><p>Logical order: [{dequeValues(deque).join(', ')}] · size {deque.size}/{capacity} · {deque.lastResult ?? 'Ready'}{step?.visual?.phase === 'blocked' && ' · operation was rejected'}</p></div>;
}
