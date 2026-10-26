import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownUp, Braces, Boxes, GitBranch, Grid2X2, Layers3,
  ListTree, Network, Search, Sigma, Sparkles, Workflow,
} from 'lucide-react';
import type { DataStructureType } from '../../types';
import type { TopicRegistryEntry } from '../../types/learning';
import { resolveTopicVisualizer } from '../../services/topicNavigation.js';
import { ArrayAlgorithmPlayground } from './ArrayAlgorithmPlayground';
import { AdditionalTopicVisualizer } from './AdditionalTopicVisualizer';
import { createDeque } from './recursionDequeSteps.js';
import { DataStructureVisualizer } from './DataStructureVisualizer';
import { makeSearchSteps, makeSortSteps, prepareSortInput, restoreSortOrder, SEARCH_ALGORITHMS, SORT_ALGORITHMS } from './algorithmSteps.js';
import './VisualisationHub.css';

type Choice = { id: string; label: string; icon: typeof Search; kind: 'algorithm' | 'structure' | 'interactive'; structure?: DataStructureType };

const mainChoices: Choice[] = [
  { id: 'Searching', label: 'Searching', icon: Search, kind: 'algorithm' },
  { id: 'Sorting', label: 'Sorting', icon: ArrowDownUp, kind: 'algorithm' },
  { id: 'Compare Lab', label: 'Compare Lab', icon: Workflow, kind: 'algorithm' },
  { id: 'array', label: 'Array', icon: Boxes, kind: 'structure', structure: 'array' },
  { id: 'matrix', label: 'Matrix and Sparse Matrix', icon: Grid2X2, kind: 'interactive' },
  { id: 'polynomial', label: 'Polynomial', icon: Sigma, kind: 'interactive' },
  { id: 'linked-list', label: 'Linked List', icon: GitBranch, kind: 'structure', structure: 'linked-list' },
  { id: 'stack', label: 'Stack', icon: Layers3, kind: 'structure', structure: 'stack' },
  { id: 'expressions', label: 'Expressions', icon: Braces, kind: 'interactive' },
  { id: 'recursion', label: 'Recursion and Backtracking', icon: Workflow, kind: 'interactive' },
  { id: 'queue', label: 'Queue', icon: ListTree, kind: 'structure', structure: 'queue' },
  { id: 'deque', label: 'Deque', icon: ListTree, kind: 'interactive' },
  { id: 'priority-queue', label: 'Priority Queue', icon: Layers3, kind: 'structure', structure: 'priority-queue' },
  { id: 'heap', label: 'Heap', icon: Boxes, kind: 'structure', structure: 'heap' },
  { id: 'bst', label: 'Binary Search Tree', icon: GitBranch, kind: 'structure', structure: 'bst' },
  { id: 'hash-table', label: 'Hash Table', icon: Sparkles, kind: 'structure', structure: 'hash-table' },
  { id: 'graph', label: 'Graph', icon: Network, kind: 'structure', structure: 'graph' },
];

const operationChoices: Record<string, string[]> = {
  array: ['Insert at index', 'Insert at end', 'Delete at index', 'Delete last', 'Update at index', 'Linear search', 'Traverse', 'Merge two sorted arrays', 'Address calculation'],
  'linked-list': ['Prepend Head', 'Append Tail', 'Insert at position', 'Delete position', 'Delete Head', 'Traverse', 'Search value'],
  stack: ['Push value', 'Pop top'],
  queue: ['Enqueue at rear', 'Dequeue from front'],
  matrix: ['Row-major address calculation', 'Column-major address calculation', 'Convert dense matrix to 3-tuple', 'Simple transpose', 'Fast transpose', 'Sparse matrix addition'],
  polynomial: ['Polynomial addition', 'Polynomial multiplication'],
  expressions: ['Infix to Postfix', 'Infix to Prefix', 'Postfix Evaluation', 'Balanced Parentheses'],
  recursion: ['Factorial', 'Fibonacci', 'Tail-style factorial', 'Head recursion', 'Indirect recursion', 'N-Queens', 'Rat in a Maze'],
  deque: ['Insert Front', 'Insert Rear', 'Delete Front', 'Delete Rear', 'Peek Front', 'Peek Rear'],
  'priority-queue': ['Insert priority', 'Extract minimum'],
  heap: ['Insert priority', 'Extract minimum'],
  bst: ['Insert key', 'Search key', 'In-order', 'Pre-order', 'Post-order'],
  'hash-table': ['Insert / update', 'Search', 'Delete'],
  graph: ['Prepare BFS'],
};

const coverageNotes: Record<string, string> = {
  array: 'Uses the existing indexed insert/delete/update/search operations and adds traversal, sorted-array merge, and address calculation. Array input is limited to the visualiser’s existing 10-element capacity.',
  'linked-list': 'The existing visualiser supports four pointer variants, insert/delete, traversal and search. Static-memory simulation and Generalized Linked Lists are not present.',
  stack: 'The existing stack is unbounded and supports push/pop. Capacity selection, peek, isFull, overflow, two stacks in one array, and linked-stack modes are not present.',
  queue: 'Linear, circular-buffer, and linked queue modes are present. Multi-Queue is not present; only the circular buffer has a fixed capacity.',
  matrix: 'Matrices are limited to at most 6 × 6. Row/column address formulas use zero-based indexes; sparse operations use row/column/value triplets.',
  polynomial: 'Terms are integer coefficient/exponent pairs, combined by exponent and displayed in descending power order.',
  expressions: 'Conversion supports operands and +, -, *, /, ^ with parentheses; postfix evaluation accepts numeric operands.',
  recursion: 'Factorial inputs are capped at 10; Fibonacci is capped at 7 to keep the actual recursive call tree readable. N-Queens supports 4–6; maze uses an editable 5 × 5 grid.',
  deque: 'Fixed-capacity circular deque, capacity 1–8, with Standard, Input-Restricted, and Output-Restricted rules.',
  'priority-queue': 'The current priority queue is a min-heap: lower numeric priority is extracted first. Highest-priority/descending modes are not present.',
  heap: 'The existing heap demonstration is a min-heap with insert and extract-min. Max-heap, build-heap, and a dedicated heapify control are not present.',
  bst: 'Insert, search, and in-order/pre-order/post-order traversal are present. Node deletion is not present.',
  'hash-table': 'The existing teaching table supports insert/update, lookup and delete with separate chaining.',
  graph: 'The current graph lesson demonstrates BFS on a fixed unweighted graph. DFS, graph editing, and Dijkstra are not present.',
};

function createCompareInput(arrangement: string, size: number, nonce = 1) {
  if (arrangement === 'Already Sorted') return Array.from({ length: size }, (_, i) => i * 3 + 2);
  if (arrangement === 'Reverse Sorted') return Array.from({ length: size }, (_, i) => (size - i) * 3 + 2);
  if (arrangement === 'Duplicates') return Array.from({ length: size }, (_, i) => [2, 5, 2, 8][i % 4]);
  let seed = (0x6d2b79f5 ^ nonce) >>> 0;
  return Array.from({ length: size }, () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return (seed >>> 0) % 29 + 1;
  });
}

function CompareLab({ category }: { category: 'Searching' | 'Sorting' }) {
  const algorithms = category === 'Searching' ? SEARCH_ALGORITHMS : SORT_ALGORITHMS;
  const initialValues = useMemo(() => createCompareInput('Random', 8), []);
  const [chosen, setChosen] = useState<string[]>([...algorithms]);
  const [arrangement, setArrangement] = useState('Random');
  const [size, setSize] = useState(8);
  const [order, setOrder] = useState<'Ascending' | 'Descending'>('Ascending');
  const [inputText, setInputText] = useState(initialValues.join(', '));
  const [values, setValues] = useState(initialValues);
  const [targetText, setTargetText] = useState(String(initialValues[Math.floor(initialValues.length / 2)]));
  const [error, setError] = useState('');
  const [results, setResults] = useState<Array<{ name: string; comparisons: number; swaps: number; shifts: number; result: string; status: string }> | null>(null);
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(1);
  const runTimer = useRef<number | null>(null);
  useEffect(() => () => { if (runTimer.current !== null) window.clearTimeout(runTimer.current); }, []);

  const parseInput = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return { values: [] as number[], error: 'Enter at least one integer.' };
    const parts = trimmed.split(',').map(part => part.trim());
    if (parts.length > 12) return { values: [] as number[], error: 'Use at most 12 comma-separated integers.' };
    if (parts.some(part => !/^-?\d+$/.test(part))) return { values: [] as number[], error: 'Enter whole numbers separated by commas.' };
    const parsed = parts.map(Number);
    if (parsed.some(value => !Number.isSafeInteger(value))) return { values: [] as number[], error: 'Each value must be a safe integer.' };
    return { values: parsed, error: '' };
  };

  const generateInput = () => {
    const nextGeneration = generation + 1;
    const next = createCompareInput(arrangement, size, nextGeneration);
    setGeneration(nextGeneration);
    setInputText(next.join(', '));
    setValues(next);
    setResults(null);
    setError('');
  };
  const applyInput = () => {
    const parsed = parseInput(inputText);
    if (parsed.error) { setError(parsed.error); setResults(null); return; }
    setValues(parsed.values);
    setResults(null);
    setError('');
  };
  const toggle = (name: string) => {
    setChosen(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name]);
    setResults(null);
    setError('');
  };
  const reset = () => {
    if (runTimer.current !== null) window.clearTimeout(runTimer.current);
    runTimer.current = null;
    const next = createCompareInput('Random', 8, 1);
    setChosen([...algorithms]); setArrangement('Random'); setSize(8); setOrder('Ascending');
    setInputText(next.join(', ')); setValues(next); setTargetText(String(next[4]));
    setResults(null); setError(''); setRunning(false); setGeneration(1);
  };
  const compare = () => {
    if (!chosen.length) { setError('Select at least one algorithm to compare.'); setResults(null); return; }
    const parsed = parseInput(inputText);
    if (parsed.error) { setError(parsed.error); setResults(null); return; }
    if (parsed.values.length !== values.length || parsed.values.some((value, index) => value !== values[index])) { setError('Click Apply Input to use the edited array before comparing.'); setResults(null); return; }
    const target = Number(targetText.trim());
    if (category === 'Searching' && (!/^-?\d+$/.test(targetText.trim()) || !Number.isSafeInteger(target))) { setError('Target must be a safe whole number.'); setResults(null); return; }
    setError(''); setResults(null); setRunning(true);
    if (runTimer.current !== null) window.clearTimeout(runTimer.current);
    runTimer.current = window.setTimeout(() => {
      const executed = chosen.map(name => {
        if (category === 'Searching') {
          const trace = makeSearchSteps(name, values, target);
          const final = trace.at(-1);
          const found = final?.foundIndex != null;
          const where = found ? `Found at working index ${final.foundIndex}${final.originalIndex != null ? ` · original index ${final.originalIndex}` : ''}` : 'Not found';
          return { name, comparisons: final?.stats.comparisons ?? 0, swaps: final?.stats.swaps ?? 0, shifts: final?.stats.shifts ?? 0, result: where, status: found ? 'Found' : 'Not found' };
        }
        if ((name === 'Counting Sort' || name === 'Radix Sort') && values.some(value => value < 0)) {
          return { name, comparisons: 0, swaps: 0, shifts: 0, result: 'Requires non-negative integers', status: 'Invalid input' };
        }
        const working = prepareSortInput(values, order);
        const trace = makeSortSteps(name, working);
        const sorted = restoreSortOrder(trace.at(-1)?.array ?? [], order, values);
        const expected = [...values].sort((a, b) => order === 'Ascending' ? a - b : b - a);
        const correct = sorted.length === expected.length && sorted.every((value, index) => value === expected[index]);
        const finalStats = trace.at(-1)?.stats;
        return { name, comparisons: finalStats?.comparisons ?? 0, swaps: finalStats?.swaps ?? 0, shifts: finalStats?.shifts ?? 0, result: `[${sorted.join(', ')}]`, status: correct ? 'Correct output' : 'Incorrect output' };
      });
      setResults(executed); setRunning(false); runTimer.current = null;
    }, 0);
  };

  const maxComparisons = Math.max(1, ...(results ?? []).map(row => row.comparisons));
  const maxMoves = Math.max(1, ...(results ?? []).map(row => row.swaps + row.shifts));
  const sortedCopyRequired = category === 'Searching' && values.some((value, index) => index > 0 && values[index - 1] > value);

  return <section className="vh-panel vh-compare" aria-label="Compare algorithms">
    <div className="vh-compare-head"><div><h3>Compare Lab</h3><p>Run any combination of supported algorithms on the same input. Counts describe this run and vary with the arrangement and size.</p></div><button type="button" className="vh-action-secondary" onClick={reset}>Reset</button></div>
    <div className="vh-subheading"><h4>Input configuration</h4><p>Generated arrays are optional. Edit the values directly and select Apply Input to compare that exact array.</p></div>
    <div className="vh-controls vh-compare-controls">
      <label>Arrangement for Generate<select value={arrangement} onChange={e => setArrangement(e.target.value)}><option>Random</option><option>Already Sorted</option><option>Reverse Sorted</option><option>Duplicates</option></select></label>
      <label>Generated size<select value={size} onChange={e => setSize(Number(e.target.value))}>{Array.from({ length: 8 }, (_, i) => i + 5).map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      <label className="vh-array-input">Integer array<input aria-label="Comparison integer array" value={inputText} onChange={e => { setInputText(e.target.value); setResults(null); }} placeholder="5, 1, 4, 2, 8" /></label>
      {category === 'Searching' && <label>Target<input aria-label="Comparison search target" value={targetText} onChange={e => { setTargetText(e.target.value); setResults(null); }} /></label>}
      {category === 'Sorting' && <label>Sort order<select value={order} onChange={e => { setOrder(e.target.value as 'Ascending' | 'Descending'); setResults(null); }}><option>Ascending</option><option>Descending</option></select></label>}
      <div className="vh-input-actions"><button type="button" className="vh-action-secondary" onClick={generateInput}>Generate new array</button><button type="button" className="vh-action-outline" onClick={applyInput}>Apply Input</button></div>
    </div>
    {error && <p className="vh-error" role="alert">{error}</p>}
    {sortedCopyRequired && <p className="vh-notice" role="status">Order-dependent searches receive a sorted working copy; your input remains unchanged. Found results report both working and original indexes.</p>}
    <div className="vh-subheading vh-selection-heading"><div><h4>Select algorithms <span>{chosen.length} selected</span></h4><p>Choose any number of algorithms in this category.</p></div><div className="vh-selection-actions"><button type="button" className="vh-action-secondary" onClick={() => { setChosen([...algorithms]); setResults(null); setError(''); }}>Select All</button><button type="button" className="vh-action-secondary" onClick={() => { setChosen([]); setResults(null); setError(''); }}>Clear Selection</button></div></div>
    <div className="vh-operation-list" role="group" aria-label={`${category} algorithms to compare`}>
      {algorithms.map(name => <button type="button" key={name} aria-pressed={chosen.includes(name)} className={chosen.includes(name) ? 'vh-chip selected' : 'vh-chip'} onClick={() => toggle(name)}>{name}</button>)}
    </div>
    <div className="vh-compare-run"><button type="button" className="vh-compare-button" onClick={compare} disabled={running || !chosen.length}>{running ? 'Comparing…' : 'Compare Algorithms'}</button><span>{chosen.length} of {algorithms.length} available</span></div>
    {running && <p className="vh-note" role="status" aria-live="polite">Executing the selected generators on the same input…</p>}
    {!results && !running && <div className="vh-empty">Select one or more algorithms, configure the input, then run a comparison to see measured execution statistics.</div>}
    {results && <>
      <div className="vh-subheading"><h4>Comparison results</h4><p>Statistics are taken from each algorithm trace’s final execution counters.</p></div>
      <div className="vh-stage-scroll" role="region" aria-label="Comparison result table; scroll horizontally to inspect all columns" tabIndex={0}><table className="vh-results"><thead><tr><th>Algorithm</th><th>Comparisons</th><th>Swaps</th><th>Shifts</th><th>Result</th><th>Status</th></tr></thead><tbody>{results.map(row => <tr key={row.name}><th>{row.name}</th><td>{row.comparisons}</td><td>{row.swaps}</td><td>{row.shifts}</td><td>{row.result}</td><td className={row.status === 'Found' || row.status === 'Correct output' ? 'vh-status-good' : row.status === 'Invalid input' ? 'vh-status-invalid' : ''}>{row.status}</td></tr>)}</tbody></table></div>
      <div className="vh-chart-grid"><section aria-label="Comparison counts"><h5>Comparisons</h5>{results.map(row => <div className="vh-chart-row" key={row.name}><span>{row.name}</span><div className="vh-meter"><i style={{ width: `${row.comparisons / maxComparisons * 100}%` }} /></div><b>{row.comparisons}</b></div>)}</section><section aria-label="Swap and shift counts"><h5>Swaps + shifts</h5>{results.map(row => <div className="vh-chart-row" key={row.name}><span>{row.name}</span><div className="vh-meter vh-meter-swap"><i style={{ width: `${(row.swaps + row.shifts) / maxMoves * 100}%` }} /></div><b>{row.swaps + row.shifts}</b></div>)}</section></div>
      <p className="vh-note">Compared input: [{values.join(', ')}]{category === 'Searching' ? ` · Target: ${targetText}` : ` · Order: ${order}`}</p>
    </>}
  </section>;
}

function choiceFromTopic(value: string, registry: TopicRegistryEntry[]) {
  return resolveTopicVisualizer(value, registry, mainChoices)?.id;
}

export function VisualisationHub({ initialTopic = '', topicRegistry = [], navigate }: { initialTopic?: string; topicRegistry?: TopicRegistryEntry[]; navigate?: (path: string) => void }) {
  const query = new URLSearchParams(window.location.search);
  const initialSelected = choiceFromTopic(initialTopic || query.get('topic') || '', topicRegistry) || 'Searching';
  const requestedSubtopic = query.get('subtopic') || '';
  const initialOperation = operationChoices[initialSelected]?.includes(requestedSubtopic) ? requestedSubtopic : operationChoices[initialSelected]?.[0] || '';
  const [selected, setSelected] = useState(initialSelected);
  const [algorithm, setAlgorithm] = useState(() => initialSelected === 'Sorting'
    ? SORT_ALGORITHMS.includes(requestedSubtopic) ? requestedSubtopic : 'Bubble Sort'
    : initialSelected === 'Searching' ? SEARCH_ALGORITHMS.includes(requestedSubtopic) ? requestedSubtopic : 'Linear Search'
      : requestedSubtopic || 'Searching');
  const [operation, setOperation] = useState(initialOperation);
  const [dequeCapacity, setDequeCapacity] = useState(6);
  const [dequeMode, setDequeMode] = useState('Standard Deque');
  const [dequeState, setDequeState] = useState(() => createDeque(6));
  const main = mainChoices.find(item => item.id === selected) ?? mainChoices[0];
  const isSearch = selected === 'Searching';
  const isSort = selected === 'Sorting';
  const algorithmOptions = isSearch ? SEARCH_ALGORITHMS : SORT_ALGORITHMS;
  const operations = operationChoices[selected] ?? [];
  const structure = main.structure;

  const syncUrl = (choiceId: string, nextOperation?: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'visualisation');
    const topic = topicRegistry.find(entry => entry.visualizerIds.includes(choiceId));
    if (topic) url.searchParams.set('topic', topic.id);
    else url.searchParams.delete('topic');
    if (nextOperation) url.searchParams.set('subtopic', nextOperation);
    else url.searchParams.delete('subtopic');
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      const value = params.get('topic') || '';
      const choice = choiceFromTopic(value, topicRegistry);
      if (choice) {
        setSelected(choice);
        const subtopic = params.get('subtopic') || '';
        if (choice === 'Searching') setAlgorithm(SEARCH_ALGORITHMS.includes(subtopic) ? subtopic : 'Linear Search');
        else if (choice === 'Sorting') setAlgorithm(SORT_ALGORITHMS.includes(subtopic) ? subtopic : 'Bubble Sort');
        else if (choice === 'Compare Lab') setAlgorithm(subtopic === 'Sorting' ? 'Sorting' : 'Searching');
        setOperation(operationChoices[choice]?.includes(subtopic) ? subtopic : operationChoices[choice]?.[0] || '');
      }
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [topicRegistry]);

  const chooseMain = (item: Choice) => {
    setSelected(item.id);
    setOperation(operationChoices[item.id]?.[0] ?? '');
    if (item.id === 'Searching') setAlgorithm('Linear Search');
    if (item.id === 'Sorting') setAlgorithm('Bubble Sort');
    if (item.id === 'Compare Lab') setAlgorithm('Searching');
    syncUrl(item.id, operationChoices[item.id]?.[0]);
  };

  const relatedLessonTopic = topicRegistry.find(entry => entry.visualizerIds.includes(main.id) && entry.relatedLessonIds.some(id => id.startsWith('unit-')));

  return <section className="visualisation-hub" aria-label="Visualisation learning workspace">
    <header className="vh-heading"><span>INTERACTIVE LEARNING WORKSPACE</span><h2>Visualisation</h2><p>Choose a topic, select an available algorithm or operation, then inspect the real execution. Teaching state stays local and is not saved.</p></header>
    <section className="vh-panel">
      <div className="vh-step-title"><span>1</span><h3>Choose what to visualise</h3></div>
      <div className="vh-group"><h4>Algorithms</h4><div className="vh-choice-grid">{mainChoices.filter(item => item.id === 'Searching' || item.id === 'Sorting' || item.id === 'Compare Lab').map(item => <ChoiceButton key={item.id} item={item} selected={selected === item.id} onSelect={chooseMain} />)}</div></div>
      <div className="vh-group"><h4>Data structures and other topics</h4><div className="vh-choice-grid">{mainChoices.filter(item => !['Searching', 'Sorting', 'Compare Lab'].includes(item.id)).map(item => <ChoiceButton key={item.id} item={item} selected={selected === item.id} onSelect={chooseMain} />)}</div></div>
    </section>

    <section className="vh-panel">
      <div className="vh-step-title"><span>2</span><h3>{isSearch || isSort ? 'Choose an algorithm' : selected === 'Compare Lab' ? 'Choose a category to compare' : 'Choose an operation'}</h3></div>
      {(isSearch || isSort) && <div className="vh-operation-list" role="group" aria-label={`${selected} algorithms`}>
        {algorithmOptions.map(name => <button type="button" key={name} aria-pressed={algorithm === name} className={algorithm === name ? 'vh-chip selected' : 'vh-chip'} onClick={() => { setAlgorithm(name); syncUrl(selected, name); }}>{name}</button>)}
      </div>}
      {selected === 'Compare Lab' && <div className="vh-operation-list" role="group" aria-label="Compare category">
        {(['Searching', 'Sorting'] as const).map(name => <button key={name} type="button" aria-pressed={algorithm === name} className={algorithm === name ? 'vh-chip selected' : 'vh-chip'} onClick={() => { setAlgorithm(name); syncUrl(selected, name); }}>{name}</button>)}
      </div>}
      {operations.length > 0 && <div className="vh-operation-list" role="group" aria-label={`${main.label} operations`}>
        {operations.map(name => <button key={name} type="button" aria-pressed={operation === name} className={operation === name ? 'vh-chip selected' : 'vh-chip'} onClick={() => { setOperation(name); syncUrl(selected, name); }}>{name}</button>)}
      </div>}
      {structure && operations.length > 0 && <p className="vh-note">Choose an operation to move focus to its control below. The operation runs only when you activate that control. {coverageNotes[selected]}</p>}
      {main.kind === 'interactive' && <p className="vh-note">Choose an operation to open its real step-based demonstration below. {coverageNotes[selected]}</p>}
    </section>

    <section className="vh-panel vh-watch">
      <div className="vh-step-title"><span>3</span><h3>Watch it run</h3></div>
      {relatedLessonTopic && navigate && <div className="vh-learning-link"><span>Want the concept behind this demonstration?</span><button type="button" onClick={() => navigate(`/learn?topic=${encodeURIComponent(relatedLessonTopic.id)}`)}>Learn this concept</button></div>}
      {(isSearch || isSort) && <ArrayAlgorithmPlayground embedded category={isSearch ? 'Searching' : 'Sorting'} algorithm={algorithm} />}
      {selected === 'Compare Lab' && <CompareLab key={algorithm} category={algorithm === 'Sorting' ? 'Sorting' : 'Searching'} />}
      {structure && <DataStructureVisualizer key={selected} structureType={structure} interactive focusOperation={operation} />}
      {main.kind === 'interactive' && <AdditionalTopicVisualizer key={`${selected}:${operation}`} topic={selected as 'matrix' | 'polynomial' | 'expressions' | 'recursion' | 'deque'} operation={operation} dequeCapacity={dequeCapacity} onDequeCapacityChange={setDequeCapacity} dequeMode={dequeMode} onDequeModeChange={setDequeMode} dequeState={dequeState} onDequeStateChange={setDequeState} />}
      <p className="vh-local-note">Local teaching state (not saved)</p>
    </section>
  </section>;
}

function ChoiceButton({ item, selected, onSelect }: { item: Choice; selected: boolean; onSelect: (item: Choice) => void }) {
  const Icon = item.icon;
  return <button type="button" aria-pressed={selected} className={`vh-choice${selected ? ' selected' : ''}`} onClick={() => onSelect(item)}><Icon aria-hidden="true" size={17} /><span>{item.label}</span></button>;
}
