const assertIndex = (index, min, max, label) => {
  if (!Number.isInteger(index) || index < min || index > max) {
    throw new RangeError(`${label} must be an integer from ${min} through ${max}.`);
  }
};

export function arrayInsertAt(values, index, value) {
  assertIndex(index, 0, values.length, 'Insertion index');
  return [...values.slice(0, index), value, ...values.slice(index)];
}

export function arrayDeleteAt(values, index) {
  assertIndex(index, 0, values.length - 1, 'Deletion index');
  return { values: [...values.slice(0, index), ...values.slice(index + 1)], removed: values[index] };
}

export function arrayUpdateAt(values, index, value) {
  assertIndex(index, 0, values.length - 1, 'Update index');
  const next = [...values];
  const previous = next[index];
  next[index] = value;
  return { values: next, previous };
}

export function arrayLinearSearch(values, target) {
  const index = values.indexOf(target);
  return { index, comparisons: index < 0 ? values.length : index + 1 };
}

export function parseArrayValues(text, maxLength = 10) {
  const trimmed = text.trim();
  if (!trimmed) return { valid: true, values: [], error: null };
  const tokens = trimmed.split(',').map(value => value.trim());
  if (tokens.length > maxLength) return { valid: false, values: [], error: `Enter no more than ${maxLength} integers.` };
  if (tokens.some(value => !/^-?\d+$/.test(value))) return { valid: false, values: [], error: 'Enter comma-separated whole numbers only.' };
  const values = tokens.map(Number);
  if (values.some(value => !Number.isSafeInteger(value))) return { valid: false, values: [], error: 'Each value must be a safe integer.' };
  return { valid: true, values, error: null };
}

export function mergeSortedArrays(left, right) {
  const isAscending = values => values.every((value, index) => index === 0 || values[index - 1] <= value);
  if (!isAscending(left) || !isAscending(right)) throw new RangeError('Both arrays must be sorted in ascending order.');
  const merged = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] <= right[rightIndex]) merged.push(left[leftIndex++]);
    else merged.push(right[rightIndex++]);
  }
  return merged.concat(left.slice(leftIndex), right.slice(rightIndex));
}

export function calculateArrayAddress(baseAddress, elementSize, index) {
  if (!Number.isSafeInteger(baseAddress) || baseAddress < 0) throw new RangeError('Base address must be a non-negative safe integer.');
  if (!Number.isSafeInteger(elementSize) || elementSize < 1) throw new RangeError('Element size must be a positive safe integer.');
  if (!Number.isSafeInteger(index) || index < 0) throw new RangeError('Array index must be a non-negative safe integer.');
  const address = baseAddress + elementSize * index;
  if (!Number.isSafeInteger(address)) throw new RangeError('Calculated address exceeds the safe integer range.');
  return address;
}

export const LIST_VARIANTS = ['singly', 'doubly', 'circular', 'doubly-circular'];
const isDoubly = variant => variant === 'doubly' || variant === 'doubly-circular';
const isCircular = variant => variant === 'circular' || variant === 'doubly-circular';

function relinkNodes(nodes, variant) {
  return nodes.map((node, index) => ({
    ...node,
    prevId: isDoubly(variant) ? nodes[index - 1]?.id ?? (variant === 'doubly-circular' ? nodes.at(-1)?.id ?? null : null) : null,
    nextId: nodes[index + 1]?.id ?? (isCircular(variant) ? nodes[0]?.id ?? null : null),
  }));
}

export function createLinkedList(values = [], variant = 'singly') {
  if (!LIST_VARIANTS.includes(variant)) throw new TypeError(`Unknown linked-list variant: ${variant}`);
  const nodes = values.map((val, index) => ({ id: `node-${index + 1}`, val }));
  const linkedNodes = relinkNodes(nodes, variant);
  return { variant, nodes: linkedNodes, headId: linkedNodes[0]?.id ?? null, tailId: linkedNodes.at(-1)?.id ?? null, nextId: nodes.length + 1 };
}

export function getLinkedListNodes(list) {
  if (!list.headId) return [];
  const byId = new Map(list.nodes.map(node => [node.id, node]));
  const ordered = [];
  const visited = new Set();
  let currentId = list.headId;
  while (currentId && !visited.has(currentId) && ordered.length < list.nodes.length) {
    const node = byId.get(currentId);
    if (!node) break;
    ordered.push(node);
    visited.add(currentId);
    currentId = node.nextId;
  }
  return ordered;
}

export function insertLinkedListAt(list, index, val) {
  const ordered = getLinkedListNodes(list);
  assertIndex(index, 0, ordered.length, 'Insertion position');
  const next = [...ordered];
  next.splice(index, 0, { id: `node-${list.nextId}`, val });
  const nodes = relinkNodes(next, list.variant);
  return { ...list, nodes, headId: nodes[0]?.id ?? null, tailId: nodes.at(-1)?.id ?? null, nextId: list.nextId + 1 };
}

export function deleteLinkedListAt(list, index) {
  const ordered = getLinkedListNodes(list);
  assertIndex(index, 0, ordered.length - 1, 'Deletion position');
  const next = [...ordered];
  const [removed] = next.splice(index, 1);
  const nodes = relinkNodes(next, list.variant);
  return { list: { ...list, nodes, headId: nodes[0]?.id ?? null, tailId: nodes.at(-1)?.id ?? null }, removed };
}

export function linkedListInvariantErrors(list) {
  const errors = [];
  const ordered = getLinkedListNodes(list);
  if (ordered.length !== list.nodes.length) errors.push('Not every node is reachable from HEAD exactly once.');
  if ((ordered[0]?.id ?? null) !== list.headId) errors.push('HEAD does not reference the first node.');
  if ((ordered.at(-1)?.id ?? null) !== list.tailId) errors.push('TAIL does not reference the last node.');
  ordered.forEach((node, index) => {
    const next = ordered[index + 1];
    const expectedNext = next?.id ?? (isCircular(list.variant) ? ordered[0]?.id ?? null : null);
    const expectedPrev = isDoubly(list.variant) ? ordered[index - 1]?.id ?? (list.variant === 'doubly-circular' ? ordered.at(-1)?.id ?? null : null) : null;
    if (node.nextId !== expectedNext) errors.push(`Incorrect next pointer at ${node.id}.`);
    if (node.prevId !== expectedPrev) errors.push(`Incorrect prev pointer at ${node.id}.`);
  });
  return errors;
}

export function linkedListSearch(list, target) {
  const ordered = getLinkedListNodes(list);
  const index = ordered.findIndex(node => node.val === target);
  return { index, visited: index < 0 ? ordered.length : index + 1 };
}

export function stackPush(stack, item) { return [item, ...stack]; }
export function stackPop(stack) { return stack.length ? { stack: stack.slice(1), item: stack[0] } : { stack, item: null }; }

export function createCircularQueue(capacity = 6, values = []) {
  if (!Number.isInteger(capacity) || capacity < 1 || values.length > capacity) throw new RangeError('Circular queue capacity must be positive and hold the initial values.');
  const queue = { slots: Array(capacity).fill(null), front: 0, size: values.length };
  values.forEach((value, index) => { queue.slots[index] = value; });
  return queue;
}

export function circularQueueValues(queue) {
  return Array.from({ length: queue.size }, (_, index) => queue.slots[(queue.front + index) % queue.slots.length]);
}

export function circularQueueEnqueue(queue, value) {
  if (queue.size === queue.slots.length) return { queue, accepted: false };
  const slots = [...queue.slots];
  const rear = (queue.front + queue.size) % slots.length;
  slots[rear] = value;
  return { queue: { ...queue, slots, size: queue.size + 1 }, accepted: true };
}

export function circularQueueDequeue(queue) {
  if (!queue.size) return { queue, item: null };
  const slots = [...queue.slots];
  const item = slots[queue.front];
  slots[queue.front] = null;
  const size = queue.size - 1;
  const front = size === 0 ? 0 : (queue.front + 1) % slots.length;
  return { queue: { ...queue, slots, front, size }, item };
}

export function createLinkedQueue(values = []) {
  const nodes = values.map((value, index) => ({ id: `queue-node-${index + 1}`, value, nextId: index < values.length - 1 ? `queue-node-${index + 2}` : null }));
  return { nodes, frontId: nodes[0]?.id ?? null, rearId: nodes.at(-1)?.id ?? null, nextId: nodes.length + 1 };
}

export function linkedQueueValues(queue) {
  const byId = new Map(queue.nodes.map(node => [node.id, node]));
  const values = [];
  const seen = new Set();
  let currentId = queue.frontId;
  while (currentId && !seen.has(currentId) && values.length < queue.nodes.length) {
    const node = byId.get(currentId);
    if (!node) break;
    seen.add(currentId);
    values.push(node.value);
    currentId = node.nextId;
  }
  return values;
}

export function linkedQueueEnqueue(queue, value) {
  const id = `queue-node-${queue.nextId}`;
  const nodes = queue.nodes.map(node => node.id === queue.rearId ? { ...node, nextId: id } : { ...node });
  nodes.push({ id, value, nextId: null });
  return { nodes, frontId: queue.frontId ?? id, rearId: id, nextId: queue.nextId + 1 };
}

export function linkedQueueDequeue(queue) {
  if (!queue.frontId) return { queue, item: null };
  const front = queue.nodes.find(node => node.id === queue.frontId);
  if (!front) return { queue, item: null };
  const nodes = queue.nodes.filter(node => node.id !== front.id).map(node => ({ ...node }));
  return { queue: { ...queue, nodes, frontId: front.nextId, rearId: nodes.length ? queue.rearId : null }, item: front.value };
}

export function linkedQueueInvariantErrors(queue) {
  const errors = [];
  const values = linkedQueueValues(queue);
  if (values.length !== queue.nodes.length) errors.push('Not every queue node is reachable from FRONT exactly once.');
  if (!queue.nodes.length && (queue.frontId !== null || queue.rearId !== null)) errors.push('Empty queue endpoints are not NULL.');
  if (queue.nodes.length && (queue.nodes.find(node => node.id === queue.frontId)?.value !== values[0] || queue.nodes.find(node => node.id === queue.rearId)?.nextId !== null)) errors.push('Queue FRONT/REAR links are inconsistent.');
  return errors;
}

export function heapInsert(heap, item) {
  const next = [...heap, item];
  let index = next.length - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (next[parent].priority <= next[index].priority) break;
    [next[parent], next[index]] = [next[index], next[parent]];
    index = parent;
  }
  return next;
}

export function heapExtractMin(heap) {
  if (!heap.length) return { heap, item: null };
  const next = [...heap];
  const item = next[0];
  const last = next.pop();
  if (next.length) {
    next[0] = last;
    let index = 0;
    while (true) {
      const left = 2 * index + 1;
      const right = left + 1;
      let smallest = index;
      if (left < next.length && next[left].priority < next[smallest].priority) smallest = left;
      if (right < next.length && next[right].priority < next[smallest].priority) smallest = right;
      if (smallest === index) break;
      [next[index], next[smallest]] = [next[smallest], next[index]];
      index = smallest;
    }
  }
  return { heap: next, item };
}

export function isMinHeap(heap) {
  return heap.every((item, index) => index === 0 || heap[Math.floor((index - 1) / 2)].priority <= item.priority);
}

export function insertBST(node, value) {
  if (!node) return { val: value };
  if (value === node.val) return node;
  return value < node.val
    ? { ...node, left: insertBST(node.left, value) }
    : { ...node, right: insertBST(node.right, value) };
}

export function traverseBST(node, order = 'in-order', result = []) {
  if (!node) return result;
  if (order === 'pre-order') result.push(node.val);
  traverseBST(node.left, order, result);
  if (order === 'in-order') result.push(node.val);
  traverseBST(node.right, order, result);
  if (order === 'post-order') result.push(node.val);
  return result;
}

export function searchBST(node, value) {
  const visited = [];
  let current = node;
  while (current) {
    visited.push(current.val);
    if (value === current.val) return { found: true, visited };
    current = value < current.val ? current.left : current.right;
  }
  return { found: false, visited };
}

export function teachingHash(key, bucketCount = 8) {
  let sum = 0;
  for (let index = 0; index < key.length; index += 1) sum += key.charCodeAt(index);
  return sum % bucketCount;
}

export function hashPut(buckets, key, value) {
  const bucketIndex = teachingHash(key, buckets.length);
  const next = buckets.map(bucket => bucket.map(entry => ({ ...entry })));
  const existing = next[bucketIndex].find(entry => entry.key === key);
  const updated = Boolean(existing);
  if (existing) existing.val = value;
  else next[bucketIndex].push({ key, val: value });
  return { buckets: next, bucketIndex, updated };
}

export function createTeachingHashTable(entries = [], bucketCount = 8) {
  const buckets = Array.from({ length: bucketCount }, () => []);
  for (const entry of entries) {
    const bucketIndex = teachingHash(entry.key, bucketCount);
    const existing = buckets[bucketIndex].find(item => item.key === entry.key);
    if (existing) existing.val = entry.val;
    else buckets[bucketIndex].push({ ...entry });
  }
  return buckets;
}

export function hashGet(buckets, key) {
  const bucketIndex = teachingHash(key, buckets.length);
  return { bucketIndex, entry: buckets[bucketIndex].find(entry => entry.key === key) ?? null };
}

export function hashDelete(buckets, key) {
  const bucketIndex = teachingHash(key, buckets.length);
  const next = buckets.map(bucket => bucket.filter(entry => entry.key !== key));
  const removed = next[bucketIndex].length !== buckets[bucketIndex].length;
  return { buckets: next, bucketIndex, removed };
}

export function buildBfsTrace(nodes, edges, start) {
  if (!nodes.some(node => node.id === start)) return [];
  const adjacency = new Map(nodes.map(node => [node.id, []]));
  edges.forEach(edge => {
    adjacency.get(edge.from)?.push(edge.to);
    adjacency.get(edge.to)?.push(edge.from);
  });
  const queue = [start];
  const visited = new Set([start]);
  const trace = [];
  while (queue.length) {
    const current = queue.shift();
    const inspectedEdges = (adjacency.get(current) ?? []).map(to => ({ from: current, to }));
    for (const neighbor of adjacency.get(current) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push(neighbor);
    }
    trace.push({ current, queue: [...queue], visited: [...visited], inspectedEdges });
  }
  return trace;
}
