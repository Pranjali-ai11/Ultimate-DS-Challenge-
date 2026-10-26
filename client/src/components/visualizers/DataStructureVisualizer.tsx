import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Search,
  ArrowRight,
  Info
} from 'lucide-react';
import { DataStructureType } from '../../types';
import type { LinkedQueueModel, ListVariant } from './structureOperations';
import {
  LIST_VARIANTS,
  arrayDeleteAt,
  arrayInsertAt,
  calculateArrayAddress,
  mergeSortedArrays,
  parseArrayValues,
  arrayUpdateAt,
  buildBfsTrace,
  circularQueueDequeue,
  circularQueueEnqueue,
  circularQueueValues,
  createCircularQueue,
  createLinkedQueue,
  createLinkedList,
  createTeachingHashTable,
  deleteLinkedListAt,
  getLinkedListNodes,
  hashDelete,
  hashGet,
  hashPut,
  heapExtractMin,
  heapInsert,
  insertBST,
  insertLinkedListAt,
  linkedQueueDequeue,
  linkedQueueEnqueue,
  linkedListSearch,
  searchBST,
  stackPop,
  stackPush,
  traverseBST,
} from './structureOperations';

interface VisualizerProps {
  structureType: DataStructureType;
  interactive?: boolean;
  focusOperation?: string;
}

const VISUALIZER_COPY: Record<DataStructureType, { title: string; instructions: string }> = {
  array: { title: 'Array Operations', instructions: 'Enter a whole number and index to insert, delete, or update at a position; search scans from left to right.' },
  'linked-list': { title: 'Linked List', instructions: 'Select a singly, doubly, circular, or doubly-circular representation. Insert at the head, tail, or a zero-based position; delete by position, traverse, or search by value. The diagram follows the selected next/prev pointer rules.' },
  stack: { title: 'Stack', instructions: 'Push a value onto the top or pop the top frame. The highlighted top changes according to LIFO order.' },
  queue: { title: 'Queue', instructions: 'Enqueue a value at the rear or dequeue the item at the front. The leftmost item leaves first (FIFO).' },
  'priority-queue': { title: 'Priority Queue', instructions: 'Choose an urgency and insert an item, then extract the smallest priority number. This example uses a min-heap; priority 1 leaves first.' },
  heap: { title: 'Min-Heap', instructions: 'Insert a priority to sift it up, or extract the minimum to sift down. The array view shows heap order, not a fully sorted array.' },
  bst: { title: 'Binary Search Tree', instructions: 'Insert an integer key; duplicate keys are ignored. The drawing updates and shows the in-order traversal.' },
  'hash-table': { title: 'Hash Table', instructions: 'Enter a key and value to store or update it. The simple teaching hash maps keys to eight chained buckets; it is not for security.' },
  graph: { title: 'Breadth-First Search', instructions: 'Run BFS from vertex A. Nodes highlight in queue order; displayed edge weights are illustrative and do not affect this unweighted traversal.' }
};

export const DataStructureVisualizer: React.FC<VisualizerProps> = ({
  structureType,
  interactive = true,
  focusOperation,
}) => {
  const visualizerRef = useRef<HTMLDivElement>(null);
  // Input state
  const [inputValue, setInputValue] = useState<string>('42');
  const [inputKey, setInputKey] = useState<string>('user_101');
  const [priorityValue, setPriorityValue] = useState<number>(1);
  const [positionValue, setPositionValue] = useState<string>('0');
  const [activeMessage, setActiveMessage] = useState<string>('Ready for operations.');
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [listVariant, setListVariant] = useState<ListVariant>('singly');
  const [queueMode, setQueueMode] = useState<'linear' | 'circular' | 'linked'>(() => focusOperation === 'Circular Queue' ? 'circular' : focusOperation === 'Linked Queue' ? 'linked' : 'linear');
  const [circularQueue, setCircularQueue] = useState(() => createCircularQueue(6, ['Job #101', 'Job #102', 'Job #103', 'Job #104']));
  const [linkedQueue, setLinkedQueue] = useState<LinkedQueueModel>(() => createLinkedQueue(['Job #101', 'Job #102', 'Job #103', 'Job #104']));
  const [hashAction, setHashAction] = useState<'put' | 'get' | 'delete'>(() => focusOperation === 'Search' ? 'get' : focusOperation === 'Delete' ? 'delete' : 'put');
  const [graphStart, setGraphStart] = useState('A');
  const [graphTrace, setGraphTrace] = useState<ReturnType<typeof buildBfsTrace>>([]);
  const [graphStep, setGraphStep] = useState(0);
  const [graphPlaying, setGraphPlaying] = useState(false);
  const [bstTraversal, setBstTraversal] = useState<number[]>([]);
  const [bstVisitedNodes, setBstVisitedNodes] = useState<number[]>([]);
  const [bstHighlight, setBstHighlight] = useState<number | null>(null);
  const arraySearchTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Concrete states for each data structure:
  // 1. Array
  const [arrayData, setArrayData] = useState<number[]>([12, 25, 42, 67, 89, 99]);
  const [arrayInputText, setArrayInputText] = useState('12, 25, 42, 67, 89, 99');
  const [arrayOperation, setArrayOperation] = useState('insert-index');
  const [arraySecondText, setArraySecondText] = useState('13, 48, 73');
  const [arrayBaseAddress, setArrayBaseAddress] = useState('1000');
  const [arrayElementSize, setArrayElementSize] = useState('4');
  const [arrayMergeView, setArrayMergeView] = useState<{ left: number[]; right: number[]; output: number[] } | null>(null);
  // 2. Linked List
  const [listModel, setListModel] = useState(() => createLinkedList([10, 24, 45, 78]));
  const listData = getLinkedListNodes(listModel);
  const [listChange, setListChange] = useState<{ before: number[]; after: number[]; pointerChange: string; changedNextIndices: number[] } | null>(null);
  // 3. Stack
  const [stackData, setStackData] = useState<string[]>(['Frame 1: main()', 'Frame 2: calculate()', 'Frame 3: sort()']);
  // 4. Queue
  const [queueData, setQueueData] = useState<string[]>(['Job #101', 'Job #102', 'Job #103', 'Job #104']);
  // 5. Heap / Priority Queue
  const [heapData, setHeapData] = useState<Array<{ val: number; priority: number; label: string }>>([
    { val: 1, priority: 1, label: 'Cardiac ER' },
    { val: 2, priority: 2, label: 'Severe Trauma' },
    { val: 4, priority: 4, label: 'Fracture' },
    { val: 5, priority: 5, label: 'Fever' }
  ]);
  // 6. BST
  interface BSTNode {
    val: number;
    left?: BSTNode;
    right?: BSTNode;
  }
  const [bstRoot, setBstRoot] = useState<BSTNode | undefined>({
    val: 50,
    left: { val: 30, left: { val: 20 }, right: { val: 40 } },
    right: { val: 70, left: { val: 60 }, right: { val: 80 } }
  });
  // 7. Hash Table (8 buckets)
  const [hashBuckets, setHashBuckets] = useState(() => createTeachingHashTable([
    { key: 'user_101', val: 'Alice' },
    { key: 'user_102', val: 'Bob' },
    { key: 'token_x', val: 'Session-A' },
    { key: 'user_103', val: 'Charlie' },
    { key: 'user_104', val: 'Diana' },
  ]));
  // 8. Graph (Vertices and Edges)
  const [graphNodes] = useState([
    { id: 'A', x: 80, y: 70, label: 'Router A' },
    { id: 'B', x: 220, y: 50, label: 'Router B' },
    { id: 'C', x: 140, y: 160, label: 'Server C' },
    { id: 'D', x: 300, y: 140, label: 'Gateway D' },
    { id: 'E', x: 200, y: 220, label: 'Database E' }
  ]);
  const [graphEdges] = useState([
    { from: 'A', to: 'B', weight: '4ms' },
    { from: 'A', to: 'C', weight: '2ms' },
    { from: 'B', to: 'D', weight: '3ms' },
    { from: 'C', to: 'D', weight: '1ms' },
    { from: 'C', to: 'E', weight: '5ms' },
    { from: 'D', to: 'E', weight: '2ms' }
  ]);
  const [visitedGraphNodes, setVisitedGraphNodes] = useState<string[]>([]);

  // Reset helper
  const handleReset = () => {
    if (arraySearchTimer.current) clearInterval(arraySearchTimer.current);
    arraySearchTimer.current = null;
    setIsSearching(false);
    setInputValue('42');
    setInputKey('user_101');
    setPriorityValue(1);
    setPositionValue('0');
    setArrayData([12, 25, 42, 67, 89, 99]);
    setArrayInputText('12, 25, 42, 67, 89, 99');
    setArrayOperation('insert-index');
    setArraySecondText('13, 48, 73');
    setArrayBaseAddress('1000');
    setArrayElementSize('4');
    setArrayMergeView(null);
    setListModel(createLinkedList([10, 24, 45, 78], listVariant));
    setListChange(null);
    setStackData(['Frame 1: main()', 'Frame 2: calculate()', 'Frame 3: sort()']);
    setQueueData(['Job #101', 'Job #102', 'Job #103', 'Job #104']);
    setCircularQueue(createCircularQueue(6, ['Job #101', 'Job #102', 'Job #103', 'Job #104']));
    setLinkedQueue(createLinkedQueue(['Job #101', 'Job #102', 'Job #103', 'Job #104']));
    setHashAction('put');
    setHeapData([
      { val: 1, priority: 1, label: 'Cardiac ER' },
      { val: 2, priority: 2, label: 'Severe Trauma' },
      { val: 4, priority: 4, label: 'Fracture' },
      { val: 5, priority: 5, label: 'Fever' }
    ]);
    setBstRoot({
      val: 50,
      left: { val: 30, left: { val: 20 }, right: { val: 40 } },
      right: { val: 70, left: { val: 60 }, right: { val: 80 } }
    });
    setHashBuckets(createTeachingHashTable([
      { key: 'user_101', val: 'Alice' },
      { key: 'user_102', val: 'Bob' },
      { key: 'token_x', val: 'Session-A' },
      { key: 'user_103', val: 'Charlie' },
      { key: 'user_104', val: 'Diana' },
    ]));
    setVisitedGraphNodes([]);
    setGraphTrace([]);
    setGraphStep(0);
    setGraphPlaying(false);
    setGraphStart('A');
    setBstTraversal([]);
    setBstVisitedNodes([]);
    setBstHighlight(null);
    setHighlightedIndices([]);
    setHighlightedKeys([]);
    setActiveMessage('Reset structure to default state.');
  };

  // 1. Array Operations
  const handleArrayInsert = (source = arrayData) => {
    const val = Number(inputValue);
    if (!inputValue.trim() || !Number.isSafeInteger(val)) {
      setActiveMessage('Enter a valid whole number before inserting into the array.');
      return;
    }
    if (source.length >= 10) {
      setActiveMessage('Array capacity reached (maximum 10 elements).');
      return;
    }
    const next = [...source, val];
    setArrayData(next);
    setArrayInputText(next.join(', '));
    setHighlightedIndices([source.length]);
    setActiveMessage(`Logical dynamic-array append is amortized O(1); this React preview copies ${source.length} items (O(n)).`);
  };

  const handleArrayDelete = (source = arrayData) => {
    if (source.length === 0) {
      setActiveMessage('Array is empty; there is no final element to delete.');
      return;
    }
    const removed = source[source.length - 1];
    const next = source.slice(0, -1);
    setArrayData(next);
    setArrayInputText(next.join(', '));
    setActiveMessage(`Deleted tail value ${removed}. Logical dynamic-array tail deletion is O(1); this React preview copies ${source.length} items (O(n)).`);
  };

  const readPosition = (max: number, label: string): number | null => {
    const position = Number(positionValue);
    if (!/^\d+$/.test(positionValue.trim()) || !Number.isSafeInteger(position) || position < 0 || position > max) {
      setActiveMessage(`${label} index must be a whole number from 0 through ${max}.`);
      return null;
    }
    return position;
  };

  const handleArrayInsertAt = (source = arrayData) => {
    const val = Number(inputValue);
    if (!inputValue.trim() || !Number.isSafeInteger(val)) { setActiveMessage('Enter a valid safe whole number before inserting into the array.'); return; }
    if (source.length >= 10) { setActiveMessage('Array capacity reached (maximum 10 elements).'); return; }
    const position = readPosition(source.length, 'Insertion');
    if (position === null) return;
    const next = arrayInsertAt(source, position, val);
    setArrayData(next);
    setArrayInputText(next.join(', '));
    setHighlightedIndices(Array.from({ length: source.length - position + 1 }, (_, offset) => position + offset));
    setActiveMessage(`Inserted ${val} at index ${position}. Values from that position shifted right; an array insertion takes O(n) time.`);
  };

  const handleArrayDeleteAt = (source = arrayData) => {
    if (!source.length) { setActiveMessage('Array is empty; there is no index to delete.'); return; }
    const position = readPosition(source.length - 1, 'Deletion');
    if (position === null) return;
    const { values: next, removed } = arrayDeleteAt(source, position);
    setArrayData(next);
    setArrayInputText(next.join(', '));
    setHighlightedIndices(Array.from({ length: source.length - position - 1 }, (_, offset) => position + offset));
    setActiveMessage(`Deleted ${removed} from index ${position}. Later values shifted left; an indexed array deletion takes O(n) time.`);
  };

  const handleArrayUpdate = (source = arrayData) => {
    const val = Number(inputValue);
    if (!inputValue.trim() || !Number.isSafeInteger(val)) { setActiveMessage('Enter a valid safe whole number before updating the array.'); return; }
    if (!source.length) { setActiveMessage('Array is empty; there is no element to update.'); return; }
    const position = readPosition(source.length - 1, 'Update');
    if (position === null) return;
    const { values: next, previous } = arrayUpdateAt(source, position, val);
    setArrayData(next);
    setArrayInputText(next.join(', '));
    setHighlightedIndices([position]);
    setActiveMessage(`Updated index ${position} from ${previous} to ${val}. Direct indexed access is O(1).`);
  };

  const handleArraySearch = (source = arrayData) => {
    const target = Number(inputValue);
    if (!inputValue.trim() || !Number.isSafeInteger(target)) {
      setActiveMessage('Enter a valid whole number before searching the array.');
      return;
    }
    if (!source.length) { setArrayData(source); setArrayInputText(''); setActiveMessage('Array is empty; no comparisons were made.'); return; }
    setIsSearching(true);
    setArrayData(source);
    setArrayInputText(source.join(', '));
    let step = 0;
    if (arraySearchTimer.current) clearInterval(arraySearchTimer.current);
    arraySearchTimer.current = setInterval(() => {
      if (step < source.length) {
        setHighlightedIndices([step]);
        if (source[step] === target) {
          if (arraySearchTimer.current) clearInterval(arraySearchTimer.current);
          arraySearchTimer.current = null;
          setIsSearching(false);
          setActiveMessage(`Found ${target} at index [${step}]! Comparisons: ${step + 1}.`);
          return;
        }
        step++;
      } else {
        if (arraySearchTimer.current) clearInterval(arraySearchTimer.current);
        arraySearchTimer.current = null;
        setIsSearching(false);
        setHighlightedIndices([]);
        setActiveMessage(`${target} not found after ${source.length} comparisons (O(n)).`);
      }
    }, 350);
  };

  const handleArrayUseInput = () => {
    const parsed = parseArrayValues(arrayInputText);
    if (!parsed.valid) { setActiveMessage(parsed.error ?? 'Enter valid array values.'); return; }
    setArrayData(parsed.values);
    setHighlightedIndices([]);
    setArrayMergeView(null);
    setActiveMessage(parsed.values.length ? `Loaded ${parsed.values.length} array value${parsed.values.length === 1 ? '' : 's'} from your input.` : 'Loaded an empty array. Insert a value before running an indexed operation.');
  };

  const handleArrayMerge = (source = arrayData) => {
    const parsedRight = parseArrayValues(arraySecondText);
    if (!parsedRight.valid) { setActiveMessage(`Second array: ${parsedRight.error}`); return; }
    const right = parsedRight.values;
    if ([...source, ...right].length > 10) {
      setActiveMessage('The merged result is limited to 10 values in this visualizer.');
      return;
    }
    let output: number[];
    try { output = mergeSortedArrays(source, right); }
    catch { setActiveMessage('Both arrays must be sorted in ascending order before merging. No values were changed.'); return; }
    setArrayMergeView({ left: [...source], right, output });
    setArrayData(output);
    setArrayInputText(output.join(', '));
    setHighlightedIndices(output.map((_, index) => index));
    setActiveMessage(`Merged ${source.length} + ${right.length} sorted values using two pointers in O(n + m) time.`);
  };

  const handleArrayAddress = (source = arrayData) => {
    const base = Number(arrayBaseAddress.trim());
    const size = Number(arrayElementSize.trim());
    if (!/^\d+$/.test(arrayBaseAddress.trim()) || !Number.isSafeInteger(base) || base < 0) { setActiveMessage('Base address must be a non-negative safe integer.'); return; }
    if (!/^\d+$/.test(arrayElementSize.trim()) || !Number.isSafeInteger(size) || size < 1) { setActiveMessage('Element size must be a positive whole number of bytes.'); return; }
    const index = readPosition(source.length - 1, 'Address calculation');
    if (index === null) return;
    let address: number;
    try { address = calculateArrayAddress(base, size, index); }
    catch (error) { setActiveMessage(error instanceof Error ? error.message : 'Address calculation inputs are invalid.'); return; }
    setArrayData(source);
    setArrayInputText(source.join(', '));
    setHighlightedIndices([index]);
    setActiveMessage(`Address(A[${index}]) = ${base} + (${index} × ${size}) = ${address}. Direct access is O(1).`);
  };

  const handleArrayTraverse = (source = arrayData) => {
    if (arraySearchTimer.current) clearInterval(arraySearchTimer.current);
    setArrayData(source);
    setArrayInputText(source.join(', '));
    if (!source.length) { setActiveMessage('Array is empty; there are no elements to traverse.'); return; }
    setIsSearching(true);
    let step = 0;
    setHighlightedIndices([]);
    setActiveMessage(`Traversal started across ${arrayData.length} elements.`);
    arraySearchTimer.current = setInterval(() => {
      if (step < source.length) {
        const current = step++;
        setHighlightedIndices([current]);
        setActiveMessage(`Traverse step ${current + 1}/${source.length}: visit index ${current}, value ${source[current]}.`);
      } else {
        if (arraySearchTimer.current) clearInterval(arraySearchTimer.current);
        arraySearchTimer.current = null;
        setIsSearching(false);
        setActiveMessage(`Traversal complete: visited ${source.length} elements in index order.`);
      }
    }, 450);
  };

  const runArrayOperation = () => {
    const parsed = parseArrayValues(arrayInputText);
    if (!parsed.valid) { setActiveMessage(parsed.error ?? 'Enter valid array values.'); return; }
    const source = parsed.values;
    setArrayMergeView(null);
    if (arrayOperation === 'insert-index') handleArrayInsertAt(source);
    else if (arrayOperation === 'insert-end') handleArrayInsert(source);
    else if (arrayOperation === 'delete-index') handleArrayDeleteAt(source);
    else if (arrayOperation === 'delete-last') handleArrayDelete(source);
    else if (arrayOperation === 'update-index') handleArrayUpdate(source);
    else if (arrayOperation === 'linear-search') handleArraySearch(source);
    else if (arrayOperation === 'traverse') handleArrayTraverse(source);
    else if (arrayOperation === 'merge') handleArrayMerge(source);
    else if (arrayOperation === 'address') handleArrayAddress(source);
  };

  // 2. Linked List Operations
  const formatListState = (values: number[]) => values.length
    ? `${listVariant.startsWith('doubly') ? 'NULL ← ' : 'HEAD → '}${values.join(listVariant.startsWith('doubly') ? ' ↔ ' : ' → ')}${listVariant.includes('circular') ? ' → HEAD (cycle)' : ' → NULL'} · HEAD → ${values[0]} · TAIL → ${values[values.length - 1]}`
    : 'HEAD = NULL · TAIL = NULL';

  const handleListVariantChange = (variant: ListVariant) => {
    if (!LIST_VARIANTS.includes(variant)) return;
    const values = listData.map(node => node.val);
    setListVariant(variant);
    setListModel(createLinkedList(values, variant));
    setListChange(null);
    setHighlightedIndices([]);
    setActiveMessage(`Changed to ${variant} linked-list representation. Existing values were retained and links were rebuilt to match the selected variant.`);
  };

  const handleListPrepend = () => {
    setListChange(null);
    setHighlightedIndices([]);
    const val = Number(inputValue);
    if (!inputValue.trim() || !Number.isInteger(val)) {
      setActiveMessage('Enter a valid whole number before inserting into the list.');
      return;
    }
    const before = listData.map(node => node.val);
    const nextModel = insertLinkedListAt(listModel, 0, val);
    const next = getLinkedListNodes(nextModel);
    setListModel(nextModel);
    const pointerChange = before.length ? `HEAD now references ${val}; its next points to the previous head ${before[0]}.${listVariant.includes('circular') ? ` The old tail’s next now points back to new HEAD ${val}.` : ''}${listVariant.startsWith('doubly') ? ` Its prev points to ${listVariant === 'doubly-circular' ? `TAIL (${before.at(-1)})` : 'NULL'}; the old head’s prev now points back to ${val}.` : ''}` : `HEAD and TAIL now reference ${val}; its next is ${listVariant.includes('circular') ? 'HEAD (itself)' : 'NULL'}.${listVariant.startsWith('doubly') ? ` Its prev is ${listVariant === 'doubly-circular' ? 'TAIL (itself)' : 'NULL'}.` : ''}`;
    setListChange({ before, after: next.map(node => node.val), pointerChange, changedNextIndices: [0] });
    setHighlightedIndices(before.length ? [0, 1] : [0]);
    setActiveMessage(`Inserted ${val} at the head. ${pointerChange} Pointer rewiring is O(1); this React preview copies ${listData.length} nodes (O(n)).`);
  };

  const handleListAppend = () => {
    setListChange(null);
    setHighlightedIndices([]);
    const val = Number(inputValue);
    if (!inputValue.trim() || !Number.isInteger(val)) {
      setActiveMessage('Enter a valid whole number before inserting into the list.');
      return;
    }
    const before = listData.map(node => node.val);
    const nextModel = insertLinkedListAt(listModel, listData.length, val);
    const next = getLinkedListNodes(nextModel);
    setListModel(nextModel);
    const pointerChange = before.length ? `The old tail’s next now points to ${val}; TAIL moves to it and its next is ${listVariant.includes('circular') ? 'HEAD' : 'NULL'}.${listVariant.startsWith('doubly') ? ` Its prev points to ${before.at(-1)}.` : ''}` : `HEAD and TAIL now reference ${val}; its next is ${listVariant.includes('circular') ? 'HEAD (itself)' : 'NULL'}.${listVariant.startsWith('doubly') ? ` Its prev is ${listVariant === 'doubly-circular' ? 'TAIL (itself)' : 'NULL'}.` : ''}`;
    setListChange({ before, after: next.map(node => node.val), pointerChange, changedNextIndices: before.length ? [before.length - 1, before.length] : [0] });
    setHighlightedIndices(before.length ? [before.length - 1, before.length] : [0]);
    setActiveMessage(`Appended ${val} at the tail. ${pointerChange} Finding a tail is O(n) without a maintained tail reference; this preview copies ${listData.length} nodes (O(n)).`);
  };

  const handleListInsertAt = () => {
    setListChange(null);
    setHighlightedIndices([]);
    const val = Number(inputValue);
    if (!inputValue.trim() || !Number.isInteger(val)) { setActiveMessage('Enter a valid whole number before inserting into the list.'); return; }
    const position = readPosition(listData.length, 'Insertion');
    if (position === null) return;
    const before = listData.map(node => node.val);
    const nextModel = insertLinkedListAt(listModel, position, val);
    const next = getLinkedListNodes(nextModel);
    setListModel(nextModel);
    const pointerChange = before.length === 0
      ? `HEAD and TAIL now reference ${val}; its next is ${listVariant.includes('circular') ? 'HEAD (itself)' : 'NULL'}.`
      : position === 0
      ? `HEAD now references ${val}; its next points to the previous head ${before[0]}.${listVariant.includes('circular') ? ` The old tail’s next now points back to new HEAD ${val}.` : ''}${listVariant.startsWith('doubly') ? ` Its prev points to ${listVariant === 'doubly-circular' ? `TAIL (${before.at(-1)})` : 'NULL'}; the old head’s prev now points back to ${val}.` : ''}`
        : position === before.length
          ? `The previous tail’s next now points to ${val}; TAIL moves to it and its next is ${listVariant.includes('circular') ? 'HEAD' : 'NULL'}.${listVariant.startsWith('doubly') ? ` Its prev points to ${before.at(-1)}.` : ''}`
          : `The predecessor ${before[position - 1]} now points to ${val}; the new node points to ${before[position]}.${listVariant.startsWith('doubly') ? ` Its prev/next point to ${before[position - 1]}/${before[position]}, and the successor’s prev points back to ${val}.` : ''}`;
    setListChange({ before, after: next.map(node => node.val), pointerChange, changedNextIndices: position === 0 ? [0] : position === before.length ? [position - 1, position] : [position - 1, position] });
    setHighlightedIndices(Array.from(new Set([position > 0 ? position - 1 : 0, position, ...(position < before.length ? [position + 1] : [])])));
    setActiveMessage(`Inserted ${val} at position ${position}. ${pointerChange} Locating a position/predecessor is O(n); rewiring known next pointers is O(1). This React array preview copies the nodes (O(n)).`);
  };

  const handleListDeleteAt = () => {
    setListChange(null);
    setHighlightedIndices([]);
    if (!listData.length) { setActiveMessage('Linked list is empty; there is no position to delete.'); return; }
    const position = readPosition(listData.length - 1, 'Deletion');
    if (position === null) return;
    const before = listData.map(node => node.val);
    const { list: nextModel, removed } = deleteLinkedListAt(listModel, position);
    const next = getLinkedListNodes(nextModel);
    setListModel(nextModel);
    const successorValue = next[0]?.val ?? 'NULL';
    const tailValue = next.at(-1)?.val ?? 'NULL';
    const pointerChange = before.length === 1
      ? `The only node was removed; HEAD and TAIL are now NULL.${listVariant.startsWith('doubly') ? ' Both prev/next endpoint links are empty.' : ''}`
      : position === 0
        ? `HEAD now points to the successor ${successorValue}; the removed head is no longer reachable.${listVariant.includes('circular') ? ` TAIL.next now points to ${successorValue}.` : ''}${listVariant.startsWith('doubly') ? ` Its prev is ${listVariant === 'doubly-circular' ? `TAIL (${tailValue})` : 'NULL'}; the old successor.prev points to the new HEAD.` : ''}`
        : position === before.length - 1
          ? `The predecessor at index ${position - 1} now points to ${listVariant.includes('circular') ? 'HEAD' : 'NULL'}; TAIL moves to ${next[next.length - 1].val}.${listVariant.startsWith('doubly') ? ` New tail.prev points to ${listVariant === 'doubly-circular' ? next.at(-2)?.val ?? next[0].val : next.length > 1 ? next.at(-2)?.val : 'NULL'}.` : ''}`
          : `The predecessor at index ${position - 1} now points to the successor ${next[position].val}.${listVariant.startsWith('doubly') ? ` The successor.prev now points back to ${next[position - 1].val}.` : ''}`;
    const affected = next.length ? position === 0 ? [0] : position === before.length - 1 ? [next.length - 1] : [position - 1, position] : [];
    setListChange({ before, after: next.map(node => node.val), pointerChange, changedNextIndices: position === 0 ? [] : [position - 1] });
    setHighlightedIndices(affected);
    setActiveMessage(`Deleted ${removed.val} at position ${position}. ${pointerChange} Locating the node/predecessor is O(n); rewiring known pointers is O(1). This React array preview copies the nodes (O(n)).`);
  };

  const handleListTraverse = () => {
    setListChange(null);
    setHighlightedIndices(listData.map((_, index) => index));
    setActiveMessage(listData.length ? `Traversal visits each of ${listData.length} nodes once from HEAD in order: ${listData.map(node => node.val).join(' → ')}${listVariant.includes('circular') ? ' and stops after one cycle back to HEAD' : ' through TAIL to NULL'}. Time O(n), auxiliary space O(1).` : 'Traversal complete: the list is empty (HEAD = NULL).');
  };

  const handleListSearch = () => {
    setListChange(null);
    setHighlightedIndices([]);
    const target = Number(inputValue);
    if (!inputValue.trim() || !Number.isInteger(target)) { setActiveMessage('Enter a valid whole number before searching the list.'); return; }
    const { index: position, visited } = linkedListSearch(listModel, target);
    setHighlightedIndices(position < 0 ? [] : [position]);
    setActiveMessage(position < 0 ? `${target} is not in the list after checking ${visited} nodes (O(n)).` : `Found ${target} at position ${position} after checking ${visited} node(s) (O(n) worst case).`);
  };

  const handleListDelete = () => {
    setListChange(null);
    setHighlightedIndices([]);
    if (listData.length === 0) {
      setActiveMessage('Linked list is empty; there is no head node to delete.');
      return;
    }
    const before = listData.map(node => node.val);
    const removed = listData[0];
    const nextModel = deleteLinkedListAt(listModel, 0).list;
    setListModel(nextModel);
    const next = getLinkedListNodes(nextModel);
    const successorValue = next[0]?.val ?? 'NULL';
    const tailValue = next.at(-1)?.val ?? 'NULL';
    const pointerChange = next.length ? `HEAD now points to the successor ${successorValue}.${listVariant.includes('circular') ? ` TAIL.next now points to ${successorValue}.` : ''}${listVariant.startsWith('doubly') ? ` Its prev is ${listVariant === 'doubly-circular' ? `TAIL (${tailValue})` : 'NULL'}.` : ''}` : 'The only node was removed; HEAD and TAIL are now NULL.';
    setListChange({ before, after: next.map(node => node.val), pointerChange, changedNextIndices: [] });
    setHighlightedIndices(next.length ? [0] : []);
    setActiveMessage(`Deleted head node ${removed.val}. ${pointerChange} Removing a known head is O(1) pointer work; this React array preview copies ${listData.length} nodes (O(n)).`);
  };

  // 3. Stack Operations
  const handleStackPush = () => {
    const label = inputValue ? `Call: ${inputValue}()` : `Frame #${stackData.length + 1}`;
    setStackData(stackPush(stackData, label)); // top at 0
    setActiveMessage(`Logical stack push is amortized O(1); this React preview copies ${stackData.length} items (O(n)).`);
  };

  const handleStackPop = () => {
    if (stackData.length === 0) {
      setActiveMessage('Stack Underflow! Stack is already empty.');
      return;
    }
    const { stack: next, item: popped } = stackPop(stackData);
    setStackData(next);
    setActiveMessage(`Popped "${popped}" from TOP. The next item, if any, is now TOP. Stack pop is O(1) in the ADT; this React preview copies ${stackData.length} items (O(n)).`);
  };

  // 4. Queue Operations
  const handleQueueEnqueue = () => {
    const label = inputValue ? `Job: ${inputValue}` : `Packet #${(queueMode === 'circular' ? circularQueue.size : queueMode === 'linked' ? linkedQueue.nodes.length : queueData.length) + 1}`;
    if (queueMode === 'linked') {
      const previousRear = linkedQueue.nodes.find(node => node.id === linkedQueue.rearId);
      setLinkedQueue(linkedQueueEnqueue(linkedQueue, label));
      setActiveMessage(previousRear ? `Enqueued "${label}" at REAR. ${previousRear.value}.next now points to it; its next is NULL. Linked-queue enqueue is O(1) with a rear reference; this React preview copies O(n) node records.` : `Enqueued "${label}" into an empty linked queue; FRONT and REAR both reference it and next is NULL. Endpoint update is O(1); preview copies node records.`);
      return;
    }
    if (queueMode === 'circular') {
      const result = circularQueueEnqueue(circularQueue, label);
      if (!result.accepted) {
        setActiveMessage(`Circular queue is full (capacity ${circularQueue.slots.length}); no item was added.`);
        return;
      }
      const rear = (circularQueue.front + circularQueue.size) % circularQueue.slots.length;
      setCircularQueue(result.queue);
      setActiveMessage(`Enqueued "${label}" at circular slot ${rear}. Rear advances modulo capacity; FIFO order is preserved.`);
      return;
    }
    setQueueData([...queueData, label]);
    setActiveMessage(`FIFO enqueue shown; this React array preview copies ${queueData.length} items (O(n)).`);
  };

  const handleQueueDequeue = () => {
    if (queueMode === 'linked') {
      const { queue: next, item } = linkedQueueDequeue(linkedQueue);
      if (item === null) { setActiveMessage('Linked queue is empty; nothing was dequeued. FRONT and REAR remain NULL.'); return; }
      setLinkedQueue(next);
      const nextFront = next.nodes.find(node => node.id === next.frontId);
      setActiveMessage(`Dequeued "${item}" from FRONT. ${nextFront ? `FRONT now references "${nextFront.value}".` : 'Queue is empty; FRONT and REAR are NULL.'} Linked dequeue is O(1) with an endpoint reference; preview copies O(n) node records.`);
      return;
    }
    if (queueMode === 'circular') {
      const result = circularQueueDequeue(circularQueue);
      if (result.item === null) {
        setActiveMessage('Circular queue is empty; no item was removed.');
        return;
      }
      setCircularQueue(result.queue);
      setActiveMessage(`Dequeued "${result.item}" from FRONT. ${result.queue.size ? `Front advances to slot ${result.queue.front}.` : 'Queue is now empty; front resets to slot 0.'}`);
      return;
    }
    if (queueData.length === 0) {
      setActiveMessage('Queue is empty!');
      return;
    }
    const dequeued = queueData[0];
    setQueueData(queueData.slice(1));
    setActiveMessage(`Dequeued "${dequeued}" from FRONT (FIFO); this array preview shifts by copying ${queueData.length} items (O(n)).`);
  };

  // 5. Heap / Priority Queue Operations
  const handleHeapInsert = () => {
    const priority = priorityValue;
    const label = inputValue || `Patient-${heapData.length + 1}`;
    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      setActiveMessage('Choose a valid priority from 1 through 5.');
      return;
    }
    const updated = heapInsert(heapData, { val: priority, priority, label });
    setHeapData(updated);
    setActiveMessage(`Inserted "${label}" at priority ${priority}. It sifted up as needed; equal priorities are not swapped, but heap extraction does not promise FIFO tie order. Heap insertion is O(log n); the React preview copies ${heapData.length} items (O(n)).`);
  };

  const handleHeapExtract = () => {
    if (heapData.length === 0) {
      setActiveMessage('Priority Queue is empty!');
      return;
    }
    const { heap: updated, item: top } = heapExtractMin(heapData);
    if (!top) return;
    setHeapData(updated);
    setActiveMessage(`Extracted minimum-priority item "${top.label}" (${top.priority}) and sifted down as needed. Heap extraction is O(log n); the React preview copies O(n) items.`);
  };

  // 6. BST Insert
  const handleBSTInsert = () => {
    const val = Number(inputValue);
    if (!inputValue.trim() || !Number.isInteger(val)) {
      setActiveMessage('Enter a valid whole number before inserting into the search tree.');
      return;
    }
    let current: BSTNode | undefined = bstRoot;
    while (current && current.val !== val) current = val < current.val ? current.left : current.right;
    const inserted = !current;
    if (inserted) setBstRoot(prev => insertBST(prev, val));
    setBstTraversal([]);
    setBstVisitedNodes([]);
    setBstHighlight(inserted ? val : null);
    setActiveMessage(inserted ? `Inserted ${val}; BST insertion is O(h), where h is tree height (average O(log n), worst O(n)).` : `${val} is already in the BST; duplicate keys are ignored.`);
  };

  const handleBSTSearch = () => {
    const val = Number(inputValue);
    if (!inputValue.trim() || !Number.isInteger(val)) { setActiveMessage('Enter a valid whole-number key before searching the BST.'); return; }
    const result = searchBST(bstRoot, val);
    setBstTraversal([]);
    setBstVisitedNodes(result.visited);
    setBstHighlight(result.visited.at(-1) ?? null);
    setActiveMessage(result.found ? `Found ${val} after visiting ${result.visited.length} node(s): ${result.visited.join(' → ')}. Search is O(h).` : `${val} was not found after visiting ${result.visited.length} node(s): ${result.visited.join(' → ') || 'empty tree'}. Search is O(h).`);
  };

  const handleBSTStartTraversal = (order: 'in-order' | 'pre-order' | 'post-order') => {
    const values = traverseBST(bstRoot, order);
    setBstTraversal(values);
    setBstVisitedNodes([]);
    setBstHighlight(null);
    setActiveMessage(values.length ? `${order} traversal ready: ${values.join(' → ')}. Use Next visit to reveal one node at a time.` : `Cannot traverse: the BST is empty. ${order} traversal has no visits.`);
  };

  const handleBSTNextVisit = () => {
    if (!bstTraversal.length || bstVisitedNodes.length >= bstTraversal.length) return;
    const nextValue = bstTraversal[bstVisitedNodes.length];
    const visited = [...bstVisitedNodes, nextValue];
    setBstVisitedNodes(visited);
    setBstHighlight(nextValue);
    setActiveMessage(visited.length === bstTraversal.length
      ? `Traversal complete: ${visited.join(' → ')}. In-order is ascending because every left subtree is smaller than its node and every right subtree is larger.`
      : `Visit ${nextValue} (${visited.length}/${bstTraversal.length}). Next node: ${bstTraversal[visited.length]}.`);
  };

  const handleBSTPreviousVisit = () => {
    if (!bstTraversal.length || !bstVisitedNodes.length) return;
    const visited = bstVisitedNodes.slice(0, -1);
    setBstVisitedNodes(visited);
    setBstHighlight(visited.at(-1) ?? null);
    setActiveMessage(visited.length ? `Restored traversal after ${visited.length} visit(s); current node ${visited.at(-1)}.` : 'Traversal returned to its initial state; no node is currently highlighted.');
  };

  const handleBSTClear = () => {
    setBstRoot(undefined);
    setBstTraversal([]);
    setBstVisitedNodes([]);
    setBstHighlight(null);
    setActiveMessage('BST cleared. Insert a whole-number key to create a root node.');
  };

  const bstPositions: Array<{ val: number; x: number; y: number }> = [];
  const bstLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  let bstDepth = 0;
  const countBSTNodes = (node?: BSTNode): number => node ? 1 + countBSTNodes(node.left) + countBSTNodes(node.right) : 0;
  const bstWidth = Math.max(340, (countBSTNodes(bstRoot) + 1) * 48);
  const layoutBST = (node: BSTNode | undefined, depth: number, left: number, right: number, parent?: { x: number; y: number }) => {
    if (!node) return;
    const position = { x: (left + right) / 2, y: 30 + depth * 62 };
    bstDepth = Math.max(bstDepth, depth);
    bstPositions.push({ val: node.val, ...position });
    if (parent) bstLines.push({ x1: parent.x, y1: parent.y, x2: position.x, y2: position.y });
    layoutBST(node.left, depth + 1, left, position.x, position);
    layoutBST(node.right, depth + 1, position.x, right, position);
  };
  layoutBST(bstRoot, 0, 0, bstWidth);
  const bstInOrder: number[] = [];
  const collectBSTInOrder = (node?: BSTNode) => {
    if (!node) return;
    collectBSTInOrder(node.left);
    bstInOrder.push(node.val);
    collectBSTInOrder(node.right);
  };
  collectBSTInOrder(bstRoot);

  const heapTreeWidth = Math.max(360, (heapData.length + 1) * 48);
  const heapTreeDepth = heapData.length ? Math.floor(Math.log2(heapData.length)) : 0;
  const heapTreeHeight = 60 + heapTreeDepth * 64;
  const heapTreeNodes = heapData.map((item, index) => {
    const depth = Math.floor(Math.log2(index + 1));
    const firstIndex = 2 ** depth - 1;
    const positionInLevel = index - firstIndex;
    return { ...item, index, x: ((positionInLevel + 0.5) / 2 ** depth) * heapTreeWidth, y: 28 + depth * 64 };
  });

  // 7. Hash Table Insert
  const handleHashInsert = () => {
    const key = inputKey.trim();
    const val = inputValue.trim();
    if (!key || (hashAction === 'put' && !val)) {
      setActiveMessage(hashAction === 'put' ? 'Enter both a non-empty key and value before storing a hash-table entry.' : 'Enter a non-empty key before looking up or deleting a hash-table entry.');
      return;
    }
    if (hashAction === 'put') {
      const result = hashPut(hashBuckets, key, val);
      setHashBuckets(result.buckets);
      setHighlightedKeys([key]);
      setActiveMessage((result.updated ? 'Updated' : 'Stored') + ' "' + key + '" in teaching-hash bucket ' + result.bucketIndex + '. Collisions remain chained; state update copies the buckets (O(n)).');
      return;
    }
    const result = hashGet(hashBuckets, key);
    if (hashAction === 'get') {
      setHighlightedKeys(result.entry ? [key] : []);
      setActiveMessage(result.entry ? 'Found "' + key + '" → "' + result.entry.val + '" in bucket ' + result.bucketIndex + '. This additive character-code hash is illustrative, not for security.' : 'Key "' + key + '" was not found in bucket ' + result.bucketIndex + '; the table was not changed.');
      return;
    }
    const deleted = hashDelete(hashBuckets, key);
    if (deleted.removed) setHashBuckets(deleted.buckets);
    setHighlightedKeys([]);
    setActiveMessage(deleted.removed ? 'Deleted "' + key + '" from bucket ' + deleted.bucketIndex + '; other chained entries were preserved.' : 'Key "' + key + '" was not found in bucket ' + deleted.bucketIndex + '; the table was not changed.');
  };

  // 8. Graph BFS traversal simulation
  const handleGraphBFS = () => {
    const trace = buildBfsTrace(graphNodes, graphEdges, graphStart);
    setGraphPlaying(false);
    setGraphTrace(trace);
    setGraphStep(0);
    setVisitedGraphNodes([]);
    setActiveMessage(trace.length ? `BFS trace prepared from ${graphStart}. Use Play or Next step to process the FIFO queue; displayed edge weights do not affect traversal.` : `Start vertex ${graphStart} does not exist in this graph.`);
  };

  const handleGraphNextStep = () => {
    if (graphStep >= graphTrace.length) return;
    const step = graphTrace[graphStep];
    const nextStep = graphStep + 1;
    setGraphStep(nextStep);
    setVisitedGraphNodes(step.visited);
    setActiveMessage(nextStep === graphTrace.length
      ? `BFS complete: visited ${graphTrace.length} vertices in order ${graphTrace.map(item => item.current).join(' → ')}. Time O(V + E); edge weights are ignored.`
      : `Step ${nextStep}/${graphTrace.length}: process ${step.current}; FIFO queue after expansion: [${step.queue.join(', ') || 'empty'}]. Visited: ${step.visited.join(', ')}.`);
  };

  const handleGraphPreviousStep = () => {
    const previousStep = Math.max(0, graphStep - 1);
    setGraphPlaying(false);
    setGraphStep(previousStep);
    const orderedVisited = graphTrace.slice(0, previousStep).at(-1)?.visited ?? [];
    setVisitedGraphNodes(orderedVisited);
    setActiveMessage(previousStep ? `Restored BFS after ${previousStep} step(s); visited ${orderedVisited.join(', ')}.` : `BFS is at its initial state from ${graphStart}; no vertices have been visited.`);
  };

  useEffect(() => {
    if (structureType !== 'graph' || !graphPlaying) return;
    if (graphStep >= graphTrace.length) return;
    const timer = setTimeout(() => {
      const step = graphTrace[graphStep];
      const nextStep = graphStep + 1;
      setGraphStep(nextStep);
      setVisitedGraphNodes(step.visited);
      setActiveMessage(nextStep === graphTrace.length
        ? `BFS complete: visited ${graphTrace.length} vertices in order ${graphTrace.map(item => item.current).join(' → ')}. Time O(V + E); edge weights are ignored.`
        : `Step ${nextStep}/${graphTrace.length}: process ${step.current}; FIFO queue after expansion: [${step.queue.join(', ') || 'empty'}].`);
      if (nextStep === graphTrace.length) setGraphPlaying(false);
    }, 650);
    return () => clearTimeout(timer);
  }, [graphPlaying, graphStep, graphTrace, structureType]);

  useEffect(() => {
    if (structureType !== 'array' && arraySearchTimer.current) {
      clearInterval(arraySearchTimer.current);
      arraySearchTimer.current = null;
      setIsSearching(false);
      setHighlightedIndices([]);
    }
  }, [structureType]);

  useEffect(() => () => {
    if (arraySearchTimer.current) clearInterval(arraySearchTimer.current);
  }, []);

  useEffect(() => {
    if (!focusOperation || !visualizerRef.current) return;
    if (structureType === 'array') {
      const arrayOperations: Record<string, string> = {
        'Insert at index': 'insert-index', 'Insert at end': 'insert-end', 'Delete at index': 'delete-index',
        'Delete last': 'delete-last', 'Update at index': 'update-index', 'Linear search': 'linear-search',
        Traverse: 'traverse', 'Merge two sorted arrays': 'merge', 'Address calculation': 'address',
      };
      if (arrayOperations[focusOperation]) setArrayOperation(arrayOperations[focusOperation]);
    }
    if (structureType === 'queue' && ['Linear Queue', 'Circular Queue', 'Linked Queue'].includes(focusOperation)) {
      const mode = focusOperation === 'Circular Queue' ? 'circular' : focusOperation === 'Linked Queue' ? 'linked' : 'linear';
      if (queueMode !== mode) setQueueMode(mode);
    }
    if (structureType === 'hash-table' && ['Search', 'Delete', 'Insert / update'].includes(focusOperation)) {
      const action = focusOperation === 'Search' ? 'get' : focusOperation === 'Delete' ? 'delete' : 'put';
      if (hashAction !== action) setHashAction(action);
    }
    const wanted = focusOperation.toLocaleLowerCase();
    const action = Array.from(visualizerRef.current.querySelectorAll<HTMLButtonElement>('button'))
      .find(button => button.textContent?.toLocaleLowerCase().includes(wanted));
    const selectorValues: Record<string, string> = {
      'Insert at index': 'insert-index', 'Insert at end': 'insert-end', 'Delete at index': 'delete-index',
      'Delete last': 'delete-last', 'Update at index': 'update-index', 'Linear search': 'linear-search',
      Traverse: 'traverse', 'Merge two sorted arrays': 'merge', 'Address calculation': 'address',
      'Linear Queue': 'linear', 'Circular Queue': 'circular', 'Linked Queue': 'linked',
      Search: 'get', Delete: 'delete', 'Insert / update': 'put',
    };
    const selector = Array.from(visualizerRef.current.querySelectorAll<HTMLSelectElement>('select'))
      .find(control => control.value === selectorValues[focusOperation]);
    (action ?? selector)?.focus({ preventScroll: true });
    (action ?? selector)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [focusOperation, structureType, queueMode, hashAction, arrayOperation]);

  return (
    <div ref={visualizerRef} data-structure-visualizer className="w-full bg-[#0b101d] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-100">
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-extrabold text-base sm:text-lg tracking-wide text-white font-mono" id="visualizer-title">
            Interactive Visualizer
          </h3>
          <span className="text-xs text-slate-400">{VISUALIZER_COPY[structureType].title}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
            Local Teaching State (not saved)
          </span>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          title="Reset this visualizer to its default data"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset Canvas</span>
        </button>
      </div>

      <p className="text-xs leading-relaxed text-slate-300" aria-labelledby="visualizer-title">{VISUALIZER_COPY[structureType].instructions} Reset Canvas restores the starter state; changes are local and are not saved.</p>

      {/* Interactive Controls Bar */}
      {interactive && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-[#070b14] p-3 rounded-xl border border-slate-800/80">
          {structureType === 'linked-list' && (
            <label className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
              Representation
              <select aria-label="Linked-list representation" value={listVariant} onChange={event => handleListVariantChange(event.target.value as ListVariant)} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white">
                {LIST_VARIANTS.map(variant => <option key={variant} value={variant}>{variant === 'doubly-circular' ? 'Doubly circular' : variant[0].toUpperCase() + variant.slice(1)}</option>)}
              </select>
            </label>
          )}
          {structureType === 'queue' && (
            <label className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
              Representation
              <select aria-label="Queue representation" value={queueMode} onChange={event => setQueueMode(event.target.value as 'linear' | 'circular' | 'linked')} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white">
                <option value="linear">Linear FIFO (unbounded preview)</option>
                <option value="circular">Circular buffer (capacity 6)</option>
                <option value="linked">Linked queue (front/rear nodes)</option>
              </select>
            </label>
          )}
          {structureType === 'hash-table' && (
            <label className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
              Operation
              <select aria-label="Hash-table operation" value={hashAction} onChange={event => setHashAction(event.target.value as 'put' | 'get' | 'delete')} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white">
                <option value="put">Store / update</option><option value="get">Lookup</option><option value="delete">Delete key</option>
              </select>
            </label>
          )}
          {structureType === 'graph' && (
            <label className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
              Start vertex
              <select aria-label="BFS start vertex" value={graphStart} onChange={event => { setGraphStart(event.target.value); setGraphTrace([]); setGraphStep(0); setVisitedGraphNodes([]); setGraphPlaying(false); }} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white">
                {graphNodes.map(node => <option key={node.id} value={node.id}>{node.id} — {node.label}</option>)}
              </select>
            </label>
          )}
          {/* Key or Label input for Hash / KV */}
          {structureType === 'hash-table' && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono text-slate-400">Key:</span>
              <input
                type="text"
                aria-label="Hash table key"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="Key"
                className="w-24 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-white font-mono focus:border-cyan-500 outline-none"
              />
            </div>
          )}

          {/* Priority selector for Priority Queue & Heap */}
          {(structureType === 'priority-queue' || structureType === 'heap') && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono text-slate-400">Urgency:</span>
              <select
                aria-label="Priority value"
                value={priorityValue}
                onChange={e => setPriorityValue(parseInt(e.target.value, 10))}
                className="px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-amber-300 font-mono outline-none"
              >
                <option value={1}>Prio 1 (Critical ER)</option>
                <option value={2}>Prio 2 (High)</option>
                <option value={3}>Prio 3 (Medium)</option>
                <option value={4}>Prio 4 (Low)</option>
                <option value={5}>Prio 5 (Routine)</option>
              </select>
            </div>
          )}

          {structureType === 'array' && (
            <div className="grid w-full gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1 text-[11px] font-mono text-slate-300 sm:col-span-2">
                Array values (up to 10 integers)
                <span className="flex min-w-0 gap-2">
                  <input aria-label="Array values" value={arrayInputText} onChange={event => setArrayInputText(event.target.value)} placeholder="12, 25, 42" className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" />
                  <button type="button" onClick={handleArrayUseInput} disabled={isSearching} className="rounded-md border border-cyan-500/60 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-950 disabled:opacity-50">Use Input</button>
                </span>
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-mono text-slate-300">
                Operation
                <select aria-label="Array operation" value={arrayOperation} onChange={event => setArrayOperation(event.target.value)} className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white">
                  <option value="insert-index">Insert at index</option><option value="insert-end">Insert at end</option>
                  <option value="delete-index">Delete at index</option><option value="delete-last">Delete last</option>
                  <option value="update-index">Update at index</option><option value="linear-search">Linear search</option>
                  <option value="traverse">Traverse</option><option value="merge">Merge two sorted arrays</option><option value="address">Address calculation</option>
                </select>
              </label>
              {['insert-index', 'insert-end', 'update-index', 'linear-search'].includes(arrayOperation) && <label className="flex flex-col gap-1 text-[11px] font-mono text-slate-300">{arrayOperation === 'linear-search' ? 'Target' : 'Value'}<input aria-label={arrayOperation === 'linear-search' ? 'Search target' : 'Array operation value'} value={inputValue} onChange={event => setInputValue(event.target.value)} className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label>}
              {['insert-index', 'delete-index', 'update-index', 'address'].includes(arrayOperation) && <label className="flex flex-col gap-1 text-[11px] font-mono text-slate-300">Index (zero based)<input type="number" min="0" step="1" aria-label="Array operation index" value={positionValue} onChange={event => setPositionValue(event.target.value)} className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label>}
              {arrayOperation === 'merge' && <label className="flex flex-col gap-1 text-[11px] font-mono text-slate-300 sm:col-span-2">Second sorted array<input aria-label="Second sorted array" value={arraySecondText} onChange={event => setArraySecondText(event.target.value)} placeholder="13, 48, 73" className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label>}
              {arrayOperation === 'address' && <div className="grid grid-cols-2 gap-2"><label className="flex flex-col gap-1 text-[11px] font-mono text-slate-300">Base address<input aria-label="Array base address" value={arrayBaseAddress} onChange={event => setArrayBaseAddress(event.target.value)} className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label><label className="flex flex-col gap-1 text-[11px] font-mono text-slate-300">Element size (bytes)<input aria-label="Array element size" value={arrayElementSize} onChange={event => setArrayElementSize(event.target.value)} className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label></div>}
              <div className="flex items-end"><button type="button" onClick={runArrayOperation} disabled={isSearching} className="min-h-10 w-full rounded-md bg-cyan-600 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50">Run</button></div>
              <p className="text-[11px] leading-relaxed text-slate-400 sm:col-span-2" aria-live="polite">{arrayOperation === 'insert-index' || arrayOperation === 'delete-index' ? 'Indexed insertion/deletion shifts elements and takes O(n) time.' : arrayOperation === 'insert-end' || arrayOperation === 'delete-last' ? 'End updates are logically O(1) for a dynamic array; this immutable React preview copies state.' : arrayOperation === 'update-index' || arrayOperation === 'address' ? 'Indexed access is O(1). Address formula: base + (index × element size).' : arrayOperation === 'linear-search' || arrayOperation === 'traverse' ? 'Sequential scan takes O(n) time; each visited index is highlighted.' : 'Two-pointer merge requires both inputs sorted and takes O(n + m) time.'}</p>
            </div>
          )}

          {/* Shared Value input for non-array structures */}
          {structureType !== 'array' && <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-slate-400">Value:</span>
            <input type="text" aria-label="Data structure operation value" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="e.g. 42" className="w-24 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-white font-mono focus:border-cyan-500 outline-none" />
          </div>}

          {structureType === 'linked-list' && (
            <label className="flex items-center gap-1 text-[11px] font-mono text-slate-400">Index / position:
              <input type="number" min="0" step="1" aria-label="Array or linked-list index" value={positionValue} onChange={event => setPositionValue(event.target.value)} className="w-16 px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-white" />
            </label>
          )}

          {/* Action Buttons depending on DS */}
          <div className="flex flex-wrap items-center gap-2">
            {structureType === 'linked-list' && (
              <>
                <button onClick={handleListInsertAt} className="flex items-center gap-1 px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold rounded-md"><Plus className="w-3 h-3" /> Insert at position</button>
                <button onClick={handleListDeleteAt} disabled={!listData.length} className="flex items-center gap-1 px-3 py-1 bg-rose-800 hover:bg-rose-700 disabled:opacity-50 text-rose-100 text-xs font-bold rounded-md"><Trash2 className="w-3 h-3" /> Delete position</button>
                <button onClick={handleListTraverse} className="flex items-center gap-1 px-3 py-1 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-md">Traverse</button>
                <button onClick={handleListSearch} className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-md"><Search className="w-3 h-3" /> Search value</button>
                <button
                  onClick={handleListPrepend}
                  className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-md"
                >
                  <Plus className="w-3 h-3" /> Prepend Head
                </button>
                <button
                  onClick={handleListAppend}
                  className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md"
                >
                  <Plus className="w-3 h-3" /> Append Tail
                </button>
                <button
                  onClick={handleListDelete}
                  className="flex items-center gap-1 px-3 py-1 bg-rose-900 hover:bg-rose-800 text-rose-200 text-xs font-bold rounded-md"
                >
                  <Trash2 className="w-3 h-3" /> Delete Head
                </button>
              </>
            )}

            {structureType === 'stack' && (
              <>
                <button
                  onClick={handleStackPush}
                  className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-md shadow-glow-cyan"
                >
                  <Plus className="w-3 h-3" /> Push value
                </button>
                <button
                  onClick={handleStackPop}
                  className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-md"
                >
                  <Trash2 className="w-3 h-3" /> Pop top
                </button>
              </>
            )}

            {structureType === 'queue' && (
              <>
                <button
                  onClick={handleQueueEnqueue}
                  className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-md"
                >
                  <Plus className="w-3 h-3" /> Enqueue at rear
                </button>
                <button
                  onClick={handleQueueDequeue}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-md"
                >
                  <ArrowRight className="w-3 h-3" /> Dequeue from front
                </button>
              </>
            )}

            {(structureType === 'priority-queue' || structureType === 'heap') && (
              <>
                <button
                  onClick={handleHeapInsert}
                  className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-md"
                >
                  <Plus className="w-3 h-3" /> Insert priority
                </button>
                <button
                  onClick={handleHeapExtract}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-md"
                >
                  <Trash2 className="w-3 h-3" /> Extract minimum
                </button>
              </>
            )}

            {structureType === 'bst' && (
              <>
                <button onClick={handleBSTInsert} className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-md"><Plus className="w-3 h-3" /> Insert key</button>
                <button onClick={handleBSTSearch} className="flex items-center gap-1 px-3 py-1 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-md"><Search className="w-3 h-3" /> Search key</button>
                <button onClick={() => handleBSTStartTraversal('in-order')} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-md">In-order</button>
                <button onClick={() => handleBSTStartTraversal('pre-order')} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-md">Pre-order</button>
                <button onClick={() => handleBSTStartTraversal('post-order')} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-md">Post-order</button>
                <button onClick={handleBSTPreviousVisit} disabled={!bstTraversal.length || !bstVisitedNodes.length} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold rounded-md">Previous visit</button>
                <button onClick={handleBSTNextVisit} disabled={bstVisitedNodes.length >= bstTraversal.length} className="px-3 py-1 bg-cyan-800 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold rounded-md">Next visit</button>
                <button onClick={handleBSTClear} className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 text-xs font-bold rounded-md">Clear tree</button>
              </>
            )}

            {structureType === 'hash-table' && (
              <button
                onClick={handleHashInsert}
                className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-md"
              >
                {hashAction === 'put' ? <><Plus className="w-3 h-3" /> Store or update</> : hashAction === 'get' ? <><Search className="w-3 h-3" /> Look up key</> : <><Trash2 className="w-3 h-3" /> Delete key</>}
              </button>
            )}

            {structureType === 'graph' && (
              <>
                <button onClick={handleGraphBFS} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md"><Play className="w-3 h-3" /> Prepare BFS</button>
                <button onClick={() => setGraphPlaying(true)} disabled={!graphTrace.length || graphStep >= graphTrace.length || graphPlaying} className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-bold rounded-md">Play</button>
                <button onClick={() => setGraphPlaying(false)} disabled={!graphPlaying} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold rounded-md">Pause</button>
                <button onClick={handleGraphPreviousStep} disabled={!graphStep || graphPlaying} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold rounded-md">Previous</button>
                <button onClick={handleGraphNextStep} disabled={!graphTrace.length || graphStep >= graphTrace.length || graphPlaying} className="px-3 py-1 bg-cyan-800 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold rounded-md">Next step</button>
                <button onClick={handleReset} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-md">Reset traversal</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Status banner */}
      <div role="status" aria-live="polite" className="flex w-full min-w-0 flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/20 text-xs font-mono text-cyan-300">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="min-w-0 break-words">{activeMessage}</span>
      </div>

      {/* Visual Canvas Display */}
      <div className="w-full min-h-[260px] bg-[#070b14] rounded-xl border border-slate-800 p-4 flex items-center justify-center overflow-x-auto relative">
        {/* ================= ARRAY ================= */}
        {structureType === 'array' && (
          <div className="flex flex-col items-center gap-4">
            {arrayMergeView && <div className="w-full max-w-3xl space-y-1 rounded-lg border border-violet-500/30 bg-slate-900/70 p-3 text-center font-mono text-xs" aria-live="polite">
              <p className="text-slate-300">Left: [{arrayMergeView.left.join(', ')}]</p>
              <p className="text-slate-300">Right: [{arrayMergeView.right.join(', ')}]</p>
              <p className="font-bold text-emerald-300">Merged: [{arrayMergeView.output.join(', ')}]</p>
            </div>}
            {arrayData.length === 0 ? <p className="py-8 text-sm text-slate-400">Array is empty. Append or insert a value to begin.</p> : <div role="region" aria-label="Array elements and indexes" className="max-w-full overflow-x-auto p-2">
            <div className="flex w-max min-w-full items-center justify-center gap-1.5">
              {arrayData.map((val, idx) => {
                const isHighlight = highlightedIndices.includes(idx);
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className={`w-14 h-16 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-sm border transition-all duration-300 ${
                        isHighlight
                          ? 'bg-cyan-500 text-black border-cyan-300 scale-110 shadow-glow-cyan'
                          : 'bg-slate-900 text-cyan-300 border-slate-700 hover:border-cyan-500/40'
                      }`}
                    >
                      <span>{val}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1">[{idx}]</span>
                  </div>
                );
              })}
            </div></div>}
            <p className="text-[11px] font-mono text-slate-400">
              Contiguous block: address = base + (index × 4 bytes). Direct O(1) offset addressing.
            </p>
          </div>
        )}

        {/* ================= LINKED LIST ================= */}
        {structureType === 'linked-list' && (
          <div className="flex w-full min-w-0 flex-col items-center gap-4">
            {listChange && (
              <div className="w-full max-w-3xl rounded-lg border border-cyan-500/25 bg-slate-900/80 p-3 text-xs leading-relaxed text-slate-200" aria-label="Linked list operation before and after">
                <p><strong className="text-slate-400">Before:</strong> {formatListState(listChange.before)}</p>
                <p className="mt-1"><strong className="text-cyan-300">After:</strong> {formatListState(listChange.after)}</p>
                <p className="mt-1"><strong className="text-amber-300">Pointer change:</strong> {listChange.pointerChange}</p>
              </div>
            )}
            {listData.length === 0 ? <p className="text-sm text-slate-400 py-8">List is empty: HEAD = NULL and TAIL = NULL.</p> : <div role="region" aria-label="Linked list diagram; scroll horizontally to see every node" tabIndex={0} className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2">
              <div className="flex w-max min-w-full items-center justify-center gap-2 p-2">
              {listData.map((node, idx) => {
                const nextNode = listData.find(item => item.id === node.nextId);
                const prevNode = listData.find(item => item.id === node.prevId);
                const isDoublyList = listVariant.startsWith('doubly');
                const isCircularList = listVariant.includes('circular');
                const nextPointer = nextNode ? `next → ${nextNode.val}` : 'next → NULL';
                const prevPointer = prevNode ? `prev ← ${prevNode.val}` : 'prev ← NULL';
                return (
                  <div key={node.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      {idx === 0 && <span className={`mb-1 text-[10px] uppercase font-mono font-bold ${highlightedIndices.includes(idx) ? 'text-amber-300' : 'text-cyan-400'}`}>HEAD{listData.length === 1 ? ' / TAIL' : ''}</span>}
                      {idx === listData.length - 1 && idx !== 0 && <span className={`mb-1 text-[10px] uppercase font-mono font-bold ${highlightedIndices.includes(idx) ? 'text-amber-300' : 'text-amber-400'}`}>TAIL</span>}
                      <div className={`flex shrink-0 items-stretch rounded-xl bg-slate-900 border overflow-hidden shadow-lg transition-colors duration-200 motion-reduce:transition-none ${highlightedIndices.includes(idx) ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-cyan-500/30'}`}>
                        {isDoublyList && <span className="self-center px-2 py-3 text-[10px] font-mono text-violet-300 bg-violet-950/40 border-r border-slate-800">{prevPointer}</span>}
                        <span className="self-center px-3.5 py-3 font-mono font-extrabold text-white text-sm bg-slate-800/80">{node.val}</span>
                        <span className={`self-center px-2 py-3 text-[10px] font-mono border-l border-slate-800 transition-colors duration-200 motion-reduce:transition-none ${listChange?.changedNextIndices.includes(idx) ? 'text-amber-200 bg-amber-950/70' : 'text-cyan-300 bg-cyan-950/40'}`}>{nextPointer}</span>
                      </div>
                    </div>
                    {idx < listData.length - 1 ? (
                      <ArrowRight aria-hidden="true" className={`w-5 h-5 mx-1 shrink-0 transition-colors duration-200 motion-reduce:transition-none ${listChange?.changedNextIndices.includes(idx) ? 'text-amber-300' : 'text-cyan-400'}`} />
                    ) : (
                      <div className={`ml-2 px-2 py-1 text-[10px] font-mono border rounded ${isCircularList ? 'bg-cyan-950/50 border-cyan-700 text-cyan-200' : 'bg-rose-950/50 border-rose-800 text-rose-300'}`}>
                        {isCircularList ? '↻ HEAD' : 'NULL'}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>}
            <p className="w-full text-center text-[11px] leading-relaxed font-mono text-slate-400">
              {listVariant.startsWith('doubly') ? 'Doubly linked nodes store prev and next references.' : 'Singly linked nodes store next references.'} {listVariant.includes('circular') ? 'The tail next pointer returns to HEAD; traversal stops after visiting each node once.' : 'The tail next pointer is NULL.'} Locating an arbitrary position/predecessor is O(n); rewiring known pointers is O(1). This teaching model stores explicit node links; React updates copy O(n) node records.
            </p>
          </div>
        )}

        {/* ================= STACK ================= */}
        {structureType === 'stack' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase font-bold">
              <span>LIFO Protocol</span>
              <span className="text-slate-500">|</span>
              <span>Top of Stack Pointer ↓</span>
            </div>
            <div className="w-64 flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-950 border-2 border-dashed border-cyan-500/30">
              {stackData.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">Stack is Empty</div>
              ) : (
                stackData.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl font-mono text-xs flex items-center justify-between border transition-all ${
                      idx === 0
                        ? 'bg-cyan-500 text-black font-extrabold border-cyan-300 shadow-glow-cyan'
                        : 'bg-slate-900 text-slate-200 border-slate-800'
                    }`}
                  >
                    <span>{item}</span>
                    {idx === 0 && <span className="text-[9px] uppercase px-1.5 py-0.5 bg-black text-cyan-400 rounded">TOP</span>}
                  </div>
                ))
              )}
            </div>
            <div className="w-64 h-2 bg-cyan-500/40 rounded-full" />
          </div>
        )}

        {/* ================= QUEUE ================= */}
        {structureType === 'queue' && (
          <div className="flex flex-col items-center gap-4">
            {queueMode === 'linear' ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 w-full max-w-lg text-xs font-mono px-2">
                  <span className="text-amber-400 font-bold">← FRONT (array preview dequeue copies O(n))</span>
                  <span className="text-cyan-400 font-bold">REAR →</span>
                </div>
                <div className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-2xl">
                  <div className="flex w-max min-w-full items-center gap-2 bg-slate-950 p-3 rounded-2xl border-2 border-dashed border-slate-700">
                    {queueData.length === 0 ? <span className="text-slate-500 text-xs font-mono py-4">Queue Empty</span> : queueData.map((item, idx) => (
                      <div key={idx} className={`px-3 py-2 rounded-xl font-mono text-xs whitespace-nowrap border ${idx === 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold' : 'bg-slate-900 text-slate-200 border-slate-700'}`}>
                        {idx === 0 && <span className="mr-1 text-[9px]">FRONT</span>}{item}{idx === queueData.length - 1 && <span className="ml-1 text-[9px] text-cyan-300">REAR</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] font-mono text-slate-400">Linear FIFO: no fixed capacity; this React array preview copies/shifts O(n) items on updates.</p>
              </>
            ) : queueMode === 'circular' ? (
              <>
                <p className="text-xs font-mono text-slate-300">Capacity {circularQueue.slots.length} · {circularQueue.size === circularQueue.slots.length ? 'FULL' : circularQueue.size === 0 ? 'EMPTY' : `${circularQueue.size} occupied`}</p>
                <div role="region" aria-label="Circular queue slots; scroll horizontally to inspect every slot" tabIndex={0} className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
                  <div className="flex w-max min-w-full items-stretch justify-center gap-2 bg-slate-950 p-3 rounded-xl border-2 border-dashed border-slate-700">
                    {circularQueue.slots.map((item, index) => {
                      const hasFront = circularQueue.size > 0 && index === circularQueue.front;
                      const rear = circularQueue.size ? (circularQueue.front + circularQueue.size - 1) % circularQueue.slots.length : -1;
                      const hasRear = index === rear;
                      return <div key={index} className={`w-24 shrink-0 rounded-lg border p-2 text-center ${hasFront ? 'border-amber-400 bg-amber-950/50' : hasRear ? 'border-cyan-400 bg-cyan-950/40' : 'border-slate-700 bg-slate-900'}`}>
                        <span className="block text-[10px] text-slate-500">slot [{index}]</span>
                        <span className="block min-h-8 break-words py-1 text-xs text-white">{item ?? 'empty'}</span>
                        <span className="block text-[9px] font-bold text-amber-300">{hasFront ? 'FRONT' : ''}{hasFront && hasRear ? ' / ' : ''}{hasRear ? 'REAR' : ''}</span>
                      </div>;
                    })}
                  </div>
                </div>
                <p className="text-[11px] text-center font-mono text-slate-400">Logical FIFO order: [{circularQueueValues(circularQueue).join(', ')}]. Front and size disambiguate empty/full; slots wrap modulo capacity. Enqueue/dequeue are O(1) buffer operations.</p>
              </>
            ) : (
              <>
                {linkedQueue.nodes.length === 0 ? <p className="py-8 text-sm text-slate-400">Linked queue is empty: FRONT = NULL and REAR = NULL.</p> : (
                  <div role="region" aria-label="Linked queue node diagram; scroll horizontally to inspect all nodes" tabIndex={0} className="w-full max-w-full min-w-0 overflow-x-auto rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
                    <div className="flex w-max min-w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 p-3">
                      {linkedQueue.nodes.map((node, index) => {
                        const nextNode = linkedQueue.nodes.find(item => item.id === node.nextId);
                        return <React.Fragment key={node.id}>
                          <div className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-cyan-500/40 bg-slate-900 p-2 text-center">
                            <span className="text-[9px] font-bold text-amber-300">{node.id === linkedQueue.frontId ? 'FRONT' : ''}{node.id === linkedQueue.frontId && node.id === linkedQueue.rearId ? ' / ' : ''}{node.id === linkedQueue.rearId ? 'REAR' : ''}</span>
                            <span className="text-xs text-white">{node.value}</span>
                            <span className="text-[10px] text-cyan-300">next → {nextNode?.value ?? 'NULL'}</span>
                          </div>
                          {index < linkedQueue.nodes.length - 1 && <ArrowRight aria-hidden="true" className="w-5 h-5 shrink-0 text-cyan-400" />}
                        </React.Fragment>;
                      })}
                    </div>
                  </div>
                )}
                <p className="text-center text-[11px] font-mono text-slate-400">Linked FIFO keeps FRONT and REAR node references; each node links to its successor, and REAR.next is NULL. Endpoint updates are O(1); this React preview copies O(n) node records.</p>
              </>
            )}
          </div>
        )}

        {/* ================= HEAP / PRIORITY QUEUE ================= */}
        {(structureType === 'priority-queue' || structureType === 'heap') && (
          <div className="flex w-full min-w-0 flex-col items-center gap-3">
            <div className="text-xs font-mono text-cyan-300 font-bold">Binary min-heap tree (root stores the minimum priority)</div>
            <div role="region" aria-label="Min-heap tree; scroll horizontally to inspect all nodes" tabIndex={0} className="w-full max-w-full min-w-0 overflow-x-auto rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
              <svg role="img" aria-label="Heap tree derived from the same array representation" width={heapTreeWidth} height={heapTreeHeight} viewBox={`0 0 ${heapTreeWidth} ${heapTreeHeight}`}>
                <title>Each heap child is connected to its parent using zero-based array indexes.</title>
                {heapTreeNodes.slice(1).map(node => {
                  const parent = heapTreeNodes[Math.floor((node.index - 1) / 2)];
                  return <line key={`heap-edge-${node.index}`} x1={parent.x} y1={parent.y} x2={node.x} y2={node.y} stroke="#475569" strokeWidth="2" />;
                })}
                {heapTreeNodes.map(node => <g key={`heap-node-${node.index}`}>
                  <circle cx={node.x} cy={node.y} r="20" fill={node.index === 0 ? '#92400e' : '#0f172a'} stroke={node.index === 0 ? '#fbbf24' : '#22d3ee'} strokeWidth="2" />
                  <text x={node.x} y={node.y + 4} textAnchor="middle" className={`structure-svg-node-label${node.index === 0 ? ' structure-svg-node-label--inverse' : ''}`} fontSize="11" fontWeight="bold">{node.priority}</text>
                  <text x={node.x} y={node.y + 32} textAnchor="middle" fill="#cbd5e1" fontSize="9">[{node.index}] {node.label}</text>
                </g>)}
              </svg>
            </div>
            <div className="flex max-w-full flex-wrap justify-center gap-2" aria-label="Heap array representation">
              {heapData.map((item, idx) => <span key={`${item.label}-${idx}`} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-200">[{idx}] {item.priority}: {item.label}</span>)}
            </div>
            <p className="text-center text-[11px] leading-relaxed font-mono text-slate-400">Tree links are derived from the same heap array: parent=floor((i−1)/2), left=2i+1, right=2i+2. Equal priorities satisfy heap order; extraction is not guaranteed FIFO among ties.</p>
          </div>
        )}

        {/* ================= BINARY SEARCH TREE ================= */}
        {structureType === 'bst' && (
          <div className="flex w-full min-w-0 flex-col items-center gap-2">
            {bstPositions.length === 0 ? <p className="py-8 text-sm text-slate-400">BST is empty. Insert an integer key to create the root.</p> : <div role="region" aria-label="Binary search tree diagram; scroll horizontally for wide trees" tabIndex={0} className="w-full max-w-full min-w-0 overflow-x-auto rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
              <svg role="img" aria-label="Binary search tree current state" width={bstWidth} height={90 + bstDepth * 62} viewBox={`0 0 ${bstWidth} ${90 + bstDepth * 62}`}>
                <title>Binary search tree; visited nodes are highlighted and each node comes from current tree state.</title>
                {bstLines.map((line, index) => <line key={`line-${index}`} {...line} stroke="#0ea5e9" strokeWidth="1.5" />)}
                {bstPositions.map((node, index) => {
                  const isCurrent = node.val === bstHighlight;
                  const wasVisited = bstVisitedNodes.includes(node.val);
                  return <g key={`${node.val}-${index}`}>
                    <circle cx={node.x} cy={node.y} r="17" fill={isCurrent ? '#b45309' : index === 0 ? '#0369a1' : '#0f172a'} stroke={isCurrent ? '#fbbf24' : wasVisited ? '#a78bfa' : '#38bdf8'} strokeWidth="2" />
                    <text x={node.x} y={node.y + 4} textAnchor="middle" className={`structure-svg-node-label${isCurrent || index === 0 ? ' structure-svg-node-label--inverse' : ''}`} fontSize="11" fontWeight="bold" fontFamily="monospace">{node.val}</text>
                  </g>;
                })}
              </svg>
            </div>}
            <p className="text-center text-[11px] leading-relaxed font-mono text-slate-400">In-order: [{bstInOrder.join(', ')}]. In-order visits left subtree, node, right subtree, yielding ascending keys under the BST ordering invariant.</p>
            {bstTraversal.length > 0 && <p className="text-xs text-cyan-200">Traversal visits: [{bstTraversal.join(' → ')}] · revealed {bstVisitedNodes.length}/{bstTraversal.length}</p>}
          </div>
        )}

        {/* ================= HASH TABLE ================= */}
        {structureType === 'hash-table' && (
          <div className="w-full max-w-xl flex flex-col gap-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {hashBuckets.map((bucket, bIdx) => (
                <div key={bIdx} className="bg-slate-900/90 border border-slate-700 rounded-xl p-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] text-cyan-400 border-b border-slate-800 pb-1 mb-1">
                    <span>Bucket [{bIdx}]</span>
                    <span>{bucket.length} items</span>
                  </div>
                  {bucket.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">empty</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {bucket.map((item, i) => (
                        <div
                          key={i}
                          title={highlightedKeys.includes(item.key) ? 'Recently inserted or updated key' : undefined}
                          className={`px-1.5 py-1 bg-slate-950 rounded text-[11px] text-slate-200 border truncate ${highlightedKeys.includes(item.key) ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-cyan-500/20'}`}
                        >
                          <span className="text-cyan-300 font-bold">{item.key}</span>: {item.val}{highlightedKeys.includes(item.key) && <span className="sr-only"> recently inserted or updated</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] font-mono text-slate-400 mt-2">
              Teaching hash with chaining: lookup depends on key length, bucket distribution, and load.
            </p>
          </div>
        )}

        {/* ================= GRAPH ================= */}
        {structureType === 'graph' && (
          <div className="flex flex-col items-center">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-xs font-mono" aria-label="Breadth-first-search queue">
              <span className="font-bold text-cyan-300">FIFO queue:</span>
              {(graphStep > 0 ? graphTrace[graphStep - 1]?.queue ?? [] : graphTrace.length ? [graphStart] : [graphStart]).map((id, index) => <span key={`${id}-${index}`} className="rounded border border-cyan-700 bg-cyan-950/50 px-2 py-1 text-cyan-100">{id}</span>)}
              {graphStep > 0 && graphTrace[graphStep - 1]?.queue.length === 0 && <span className="text-slate-500">empty</span>}
              {graphTrace.length > 0 && <span className="text-slate-400">Step {graphStep}/{graphTrace.length}</span>}
            </div>
            <svg role="img" aria-label="Undirected graph and BFS traversal state" width="380" height="260" className="overflow-visible">
              <title>Static weighted graph; the available operation performs breadth-first traversal only.</title>
              {/* Edges */}
              {graphEdges.map((e, idx) => {
                const u = graphNodes.find(n => n.id === e.from)!;
                const v = graphNodes.find(n => n.id === e.to)!;
                const isVisited = visitedGraphNodes.includes(e.from) && visitedGraphNodes.includes(e.to);
                const currentStep = graphStep > 0 ? graphTrace[graphStep - 1] : undefined;
                const isInspected = currentStep?.inspectedEdges.some(edge => (edge.from === e.from && edge.to === e.to) || (edge.from === e.to && edge.to === e.from)) ?? false;
                return (
                  <g key={idx}>
                    <line
                      x1={u.x}
                      y1={u.y}
                      x2={v.x}
                      y2={v.y}
                      stroke={isInspected ? '#fbbf24' : isVisited ? '#06b6d4' : '#334155'}
                      strokeWidth={isInspected ? 3 : isVisited ? 2.5 : 1.5}
                      strokeDasharray={isInspected || isVisited ? undefined : '4 2'}
                    />
                    <text
                      x={(u.x + v.x) / 2}
                      y={(u.y + v.y) / 2 - 4}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {e.weight}
                    </text>
                  </g>
                );
              })}

              {/* Vertices */}
              {graphNodes.map(node => {
                const isVisited = visitedGraphNodes.includes(node.id);
                const isCurrent = graphStep > 0 && graphTrace[graphStep - 1]?.current === node.id;
                return (
                  <g key={node.id} className="cursor-pointer">
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="16"
                      fill={isCurrent ? '#b45309' : isVisited ? '#0891b2' : '#0f172a'}
                      stroke={isCurrent ? '#fbbf24' : isVisited ? '#22d3ee' : '#475569'}
                      strokeWidth="2"
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      className={`structure-svg-node-label${isCurrent || isVisited ? ' structure-svg-node-label--inverse' : ''}`}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {node.id}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 24}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            <p className="text-[11px] font-mono text-slate-400 mt-2">
              Static undirected adjacency-list example. Run BFS to visit reachable vertices in FIFO order; edge weights are displayed but are not used by this traversal.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
