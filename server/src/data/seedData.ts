import { FODS_REQUIRED_CHALLENGES } from './fodsQuestionBank.js';
import { ACHIEVEMENT_DEFINITIONS } from './achievementDefinitions.js';
export interface DataStructureDetail {
  id: string;
  name: string;
  category: 'Linear' | 'Hierarchical' | 'Associative' | 'Network';
  shortDesc: string;
  icon: string;
  description: string;
  howItWorks: string;
  timeComplexity: {
    search: string;
    insert: string;
    delete: string;
    space: string;
  };
  advantages: string[];
  disadvantages: string[];
  realWorldUse: string;
  operations: Array<{
    name: string;
    complexity: string;
    description: string;
  }>;
  codeSnippet: string;
}

export const DATA_STRUCTURES_CATALOG: DataStructureDetail[] = [
  {
    id: 'array',
    name: 'Array',
    category: 'Linear',
    shortDesc: 'Contiguous memory block with O(1) random index access',
    icon: 'Grid',
    description: 'An array stores elements in contiguous memory locations. It provides instant random access by index, but resizing and shifting during insertions or deletions can be costly.',
    howItWorks: 'Direct pointer arithmetic calculates element address in O(1): memory_address = base_address + index * element_size.',
    timeComplexity: {
      search: 'O(n) linear / O(log n) if sorted',
      insert: 'O(n) due to element shifting (O(1) at end)',
      delete: 'O(n) due to shifting elements',
      space: 'O(n) contiguous memory',
    },
    advantages: [
      'O(1) instantaneous access via index',
      'High cache locality and spatial memory efficiency',
      'Minimal memory overhead with no extra pointers',
    ],
    disadvantages: [
      'Fixed size allocation (resizing takes O(n))',
      'Expensive insertions and deletions in middle or beginning (O(n))',
      'Contiguous memory requirement can cause allocation issues in large sizes',
    ],
    realWorldUse: 'Matrix computation, image pixel buffers, CPU caching, lookup tables, foundation for heaps and dynamic buffers.',
    operations: [
      { name: 'Access by Index', complexity: 'O(1)', description: 'Direct memory offset calculation.' },
      { name: 'Linear Search', complexity: 'O(n)', description: 'Iterates through elements sequentially.' },
      { name: 'Insert at End', complexity: 'O(1) amortized', description: 'Appends to dynamic array capacity.' },
      { name: 'Insert at Index', complexity: 'O(n)', description: 'Shifts subsequent items to the right.' },
      { name: 'Delete at Index', complexity: 'O(n)', description: 'Shifts subsequent items to the left.' },
    ],
    codeSnippet: `// Array implementation example
class CustomArray {
  private items: number[] = [];
  get(index: number) { return this.items[index]; } // O(1)
  push(val: number) { this.items.push(val); }     // O(1)
  insertAt(idx: number, val: number) {            // O(n)
    this.items.splice(idx, 0, val);
  }
}`
  },
  {
    id: 'linked-list',
    name: 'Linked List',
    category: 'Linear',
    shortDesc: 'Sequential nodes connected by pointers for dynamic allocation',
    icon: 'GitCommit',
    description: 'A linked list represents sequential elements where each node stores a value and one or two pointers to neighbor nodes. Ideal for frequent additions and removals when node references are held.',
    howItWorks: 'Nodes are scattered in heap memory. Insertion or deletion only requires rewiring pointers without moving any other elements.',
    timeComplexity: {
      search: 'O(n) must traverse from head',
      insert: 'O(1) when node pointer is known (O(n) to find index)',
      delete: 'O(1) when node pointer is known (O(n) to find node)',
      space: 'O(n) + pointer overhead per node',
    },
    advantages: [
      'Dynamic size without costly array reallocation',
      'O(1) insertion and deletion at head/tail or given pointer',
      'No contiguous memory block required',
    ],
    disadvantages: [
      'No random access (requires O(n) sequential traversal)',
      'Extra memory consumed for pointer references (next / prev)',
      'Poor cache locality due to scattered heap addresses',
    ],
    realWorldUse: 'Undo/redo buffers, music playlist queues, LRU cache doubly-linked lists, OS free memory block management.',
    operations: [
      { name: 'Prepend (Insert Head)', complexity: 'O(1)', description: 'Points new node to head and updates head.' },
      { name: 'Append (Insert Tail)', complexity: 'O(1)', description: 'With tail pointer, connects tail.next.' },
      { name: 'Delete Given Node', complexity: 'O(1)', description: 'Rewires prev.next to node.next.' },
      { name: 'Search Value', complexity: 'O(n)', description: 'Traverses nodes sequentially.' },
    ],
    codeSnippet: `class ListNode<T> {
  val: T;
  next: ListNode<T> | null = null;
  prev: ListNode<T> | null = null;
  constructor(val: T) { this.val = val; }
}`
  },
  {
    id: 'stack',
    name: 'Stack',
    category: 'Linear',
    shortDesc: 'Last-In, First-Out (LIFO) protocol for state & backtrack management',
    icon: 'Layers',
    description: 'A linear data structure strictly governed by LIFO order. Elements are pushed onto the top and popped off the top in reverse arrival order.',
    howItWorks: 'A pointer tracks the topmost element. Both push and pop access only the top index/node, guaranteeing constant O(1) performance.',
    timeComplexity: {
      search: 'O(n)',
      insert: 'O(1) Push',
      delete: 'O(1) Pop',
      space: 'O(n)',
    },
    advantages: [
      'Strict O(1) operations for push, pop, and peek',
      'Simple, predictable memory management',
      'Natural mechanism for recursive algorithm simulation and state history',
    ],
    disadvantages: [
      'Cannot access middle or bottom elements directly without popping',
      'Potential stack overflow if unbounded',
    ],
    realWorldUse: 'Browser navigation back button, text editor undo stack, compiler parenthesis matching, call stack in execution engines.',
    operations: [
      { name: 'Push', complexity: 'O(1)', description: 'Adds element to the top of the stack.' },
      { name: 'Pop', complexity: 'O(1)', description: 'Removes and returns the topmost element.' },
      { name: 'Peek', complexity: 'O(1)', description: 'Inspects the topmost element without removing it.' },
    ],
    codeSnippet: `class Stack<T> {
  private items: T[] = [];
  push(item: T) { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
}`
  },
  {
    id: 'queue',
    name: 'Queue',
    category: 'Linear',
    shortDesc: 'First-In, First-Out (FIFO) buffer for orderly task dispatching',
    icon: 'Clock',
    description: 'A linear structure enforcing FIFO sequence. Items join at the rear (enqueue) and exit at the front (dequeue). Essential for asynchronous stream buffering.',
    howItWorks: 'Maintains front and rear pointers. When implemented with a circular buffer or linked nodes, enqueue and dequeue are both constant time.',
    timeComplexity: {
      search: 'O(n)',
      insert: 'O(1) Enqueue',
      delete: 'O(1) Dequeue',
      space: 'O(n)',
    },
    advantages: [
      'Fair, orderly first-come first-served processing',
      'Guarantees sequential order preservation',
      'O(1) enqueue and dequeue operations',
    ],
    disadvantages: [
      'No priority distinction (a critical emergency must wait behind routine tasks)',
      'No direct random access to middle items',
    ],
    realWorldUse: 'Printer queues, BFS graph traversal, message brokers (Kafka/RabbitMQ), web server request dispatching buffers.',
    operations: [
      { name: 'Enqueue', complexity: 'O(1)', description: 'Inserts element at the rear of the queue.' },
      { name: 'Dequeue', complexity: 'O(1)', description: 'Extracts element from the front of the queue.' },
      { name: 'Peek Front', complexity: 'O(1)', description: 'Returns the front element without removing it.' },
    ],
    codeSnippet: `class CircularQueue<T> {
  private items: Array<T | undefined>;
  private front = 0;
  private size = 0;
  constructor(private capacity: number) { this.items = new Array(capacity); }
  enqueue(value: T): boolean {
    if (this.size === this.capacity) return false;
    this.items[(this.front + this.size) % this.capacity] = value;
    this.size++;
    return true;
  }
  dequeue(): T | undefined {
    if (this.size === 0) return undefined;
    const value = this.items[this.front];
    this.items[this.front] = undefined;
    this.front = (this.front + 1) % this.capacity;
    this.size--;
    return value;
  }
}`
  },
  {
    id: 'priority-queue',
    name: 'Priority Queue',
    category: 'Hierarchical',
    shortDesc: 'Extracts highest/lowest priority item regardless of arrival order',
    icon: 'SlidersHorizontal',
    description: 'An abstract data type where each element has an assigned numerical priority. The item with highest (or lowest) priority is always served first.',
    howItWorks: 'A priority queue is an ADT, so operation costs depend on its representation. An unsorted array has cheap insertion and a linear scan to extract the best item; a sorted array reverses that trade-off. This optional sandbox uses a binary min-heap, which sifts up on insert and down on extract.',
    timeComplexity: {
      search: 'O(n) for arbitrary key in the shown representations',
      insert: 'Depends on representation: O(1) unsorted array; O(n) sorted array; O(log n) heap',
      delete: 'Extract best: O(n) unsorted array; O(1) sorted array; O(log n) heap',
      space: 'O(n)',
    },
    advantages: [
      'Extraction follows the declared priority order rather than arrival order',
      'A binary-heap implementation offers O(1) peek and O(log n) insertion/extraction',
      'Other representations make different insertion/extraction trade-offs',
    ],
    disadvantages: [
      'Arbitrary element search is slow (O(n))',
      'Updating a specific item requires locating it first (O(n) unless indexed with a hash map)',
    ],
    realWorldUse: 'Hospital emergency room triage, Dijkstra algorithm shortest path, CPU task scheduler, bandwidth traffic shaping.',
    operations: [
      { name: 'Sandbox: Insert in binary min-heap', complexity: 'O(log n)', description: 'The current optional implementation inserts and sifts up.' },
      { name: 'Sandbox: Extract minimum', complexity: 'O(log n)', description: 'The current optional implementation removes the root and sifts the replacement down.' },
      { name: 'Binary-heap peek', complexity: 'O(1)', description: 'A heap exposes its root; other representations may have different peek costs.' },
    ],
    codeSnippet: `class PriorityQueue<T> {
  // Backed by binary heap with priority comparison
  insert(item: T, priority: number): void { /* O(log n) */ }
  extractMax(): T | null { /* O(log n) */ }
}`
  },
  {
    id: 'heap',
    name: 'Heap',
    category: 'Hierarchical',
    shortDesc: 'Complete binary tree satisfying heap ordering property',
    icon: 'Triangle',
    description: 'A specialized tree-based structure. In a Max-Heap, parent keys are always >= children. In a Min-Heap, parent keys are <= children.',
    howItWorks: 'Compactly mapped into a contiguous array where node at index i has children at 2*i + 1 and 2*i + 2. Zero pointer overhead.',
    timeComplexity: {
      search: 'O(n) for non-root',
      insert: 'O(log n)',
      delete: 'O(log n)',
      space: 'O(n) stored compactly in array',
    },
    advantages: [
      'Zero pointer overhead (pure array indexing)',
      'O(1) access to min or max element',
      'Guaranteed balanced tree shape (complete tree)',
    ],
    disadvantages: [
      'Searching for arbitrary keys takes O(n)',
      'Not suitable for sorted range scans',
    ],
    realWorldUse: 'Heapsort algorithm, priority queues, finding the K-th smallest/largest element in data streams, median maintenance.',
    operations: [
      { name: 'Heapify-Up', complexity: 'O(log n)', description: 'Restores heap invariant after insertion.' },
      { name: 'Heapify-Down', complexity: 'O(log n)', description: 'Restores heap invariant after root removal.' },
      { name: 'Build Heap', complexity: 'O(n)', description: 'Constructs heap from unsorted array.' },
    ],
    codeSnippet: `// Array representation of Binary Heap
// Parent: Math.floor((i - 1) / 2)
// Left Child: 2 * i + 1, Right Child: 2 * i + 2`
  },
  {
    id: 'bst',
    name: 'Binary Search Tree',
    category: 'Hierarchical',
    shortDesc: 'Sorted tree allowing logarithmic search, insertion, and range queries',
    icon: 'GitBranch',
    description: 'A node-based binary tree where left subtree contains values smaller than node, and right subtree contains values greater. In-order traversal yields elements in sorted order.',
    howItWorks: 'At each node, compare the key and follow the left or right reference. Operation cost is O(h), where h is the actual tree height; an ordinary BST is not self-balancing and can become a chain.',
    timeComplexity: {
      search: 'O(h): O(log n) balanced-shaped, O(n) skewed',
      insert: 'O(h): O(log n) balanced-shaped, O(n) skewed',
      delete: 'O(h) if implemented; not in this sandbox',
      space: 'O(n)',
    },
    advantages: [
      'Search and insertion follow one root-to-leaf path; they are O(log n) only when tree height is logarithmic',
      'In-order traversal produces fully sorted output in O(n)',
      'Supports range queries (e.g. Find all prices between $20 and $50)',
      'Finds minimum and maximum keys in O(h), where h is tree height (O(log n) only for logarithmic height)',
    ],
    disadvantages: [
      'Can degrade to an O(n) linked list if not balanced',
      'Pointer overhead (left, right, parent)',
      'Slower than O(1) hash tables for pure key lookups',
    ],
    realWorldUse: 'Optional enrichment example: ordered maps/sets often use balanced search trees. This sandbox is an unbalanced BST and does not implement those variants.',
    operations: [
      { name: 'Sandbox: Insert Key', complexity: 'O(h)', description: 'Places a new leaf by comparisons; duplicate keys are ignored.' },
      { name: 'Sandbox: In-order display', complexity: 'O(n)', description: 'Visits left, root, right to display sorted keys.' },
      { name: 'In-Order Traversal', complexity: 'O(n)', description: 'Visits left -> root -> right for sorted data.' },
    ],
    codeSnippet: `class BSTNode {
  val: number;
  left: BSTNode | null = null;
  right: BSTNode | null = null;
  constructor(val: number) { this.val = val; }
}`
  },
  {
    id: 'hash-table',
    name: 'Hash Table',
    category: 'Associative',
    shortDesc: 'Key-value mapping providing average O(1) lookup and mutations',
    icon: 'Hash',
    description: 'Maps unique keys to values using a hashing algorithm. Keys are converted into integer array indices, allowing near-instantaneous key retrieval.',
    howItWorks: 'hash(key) % capacity yields bucket index. Collisions are handled via Chaining (linked lists) or Open Addressing (probing).',
    timeComplexity: {
      search: 'O(1) average / O(n) worst-case collision storm',
      insert: 'O(1) average',
      delete: 'O(1) average',
      space: 'O(n) + bucket capacity overhead',
    },
    advantages: [
      'Blazing fast O(1) average key lookup, insertion, and deletion',
      'Flexible key types (strings, UUIDs, coordinates)',
      'Ideal for indexing and deduplication',
    ],
    disadvantages: [
      'No natural ordering (cannot perform sorted range queries)',
      'Cannot retrieve min/max without scanning all keys (O(n))',
      'Resizing during rehashing is expensive',
      'Performance degrades under hash collisions',
    ],
    realWorldUse: 'User session store, database primary key indexing, routing table dispatchers, symbol tables in compilers, LRU cache lookup map.',
    operations: [
      { name: 'Set (Insert/Update)', complexity: 'O(1) avg', description: 'Hashes key and stores in bucket.' },
      { name: 'Get (Search)', complexity: 'O(1) avg', description: 'Hashes key and retrieves value.' },
      { name: 'Remove (Delete)', complexity: 'O(1) avg', description: 'Removes entry from bucket.' },
    ],
    codeSnippet: `class HashTable<K, V> {
  private buckets: Array<Array<[K, V]>> = [];
  set(key: K, val: V) { /* hash and insert O(1) */ }
  get(key: K): V | undefined { /* hash and find O(1) */ }
}`
  },
  {
    id: 'graph',
    name: 'Graph',
    category: 'Network',
    shortDesc: 'Vertices connected by edges for modeling arbitrary relationships',
    icon: 'Network',
    description: 'A non-linear network consisting of vertices (nodes) linked by edges (connections). Can be directed/undirected, weighted/unweighted, cyclic/acyclic.',
    howItWorks: 'Represented using Adjacency Lists (node -> list of neighbors) or Adjacency Matrices (2D boolean/weight grid).',
    timeComplexity: {
      search: 'O(V + E) BFS / DFS traversal',
      insert: 'O(1) Add vertex/edge',
      delete: 'O(V + E) Remove vertex and linked edges',
      space: 'O(V + E) Adjacency list',
    },
    advantages: [
      'Expresses complex many-to-many relationships naturally',
      'Models relationships and supports traversal when an adjacency structure is provided',
      'Captures real-world networks (roads, friendships, dependencies)',
    ],
    disadvantages: [
      'High computational complexity for traversal and pathfinding',
      'Memory intensive for dense graphs',
      'More complex to implement and debug',
    ],
    realWorldUse: 'Google Maps navigation, social networks (Facebook friend graph), dependency resolution (npm, build systems), internet routing protocols.',
    operations: [
      { name: 'Sandbox: BFS from A', complexity: 'O(V + E)', description: 'Traverses vertices reachable from A with a FIFO work queue; edge weights are ignored.' },
    ],
    codeSnippet: `class Graph {
  private adjList: Map<string, string[]> = new Map();
  addVertex(v: string) { if (!this.adjList.has(v)) this.adjList.set(v, []); }
  addEdge(u: string, v: string) {
    this.adjList.get(u)?.push(v);
    this.adjList.get(v)?.push(u);
  }
}`
  }
];

export const OPTIONAL_ENRICHMENT_CHALLENGES = [
  // ==========================================
  // LEVEL 1: FOUNDATION (10 Challenges)
  // ==========================================
  {
    id: 'c-l1-01',
    slug: 'lifo-browser-history',
    title: 'Mission 01: Browser Back-Button Navigation',
    level: 1,
    difficulty: 'Easy',
    category: 'Web Navigation',
    missionBrief: 'Web browsers allow users to visit pages and return to the most recently visited page using the Back button. Which data structure naturally follows this Last-In, First-Out sequence?',
    question: 'Which data structure is fundamentally designed to pop elements in reverse arrival order (LIFO)?',
    options: [
      {
        id: 'opt-1',
        text: 'Queue',
        structureId: 'queue',
        explanation: 'Incorrect. Queue follows FIFO (First-In, First-Out), which would return the oldest visited page first rather than the most recent.',
        isCorrect: false,
      },
      {
        id: 'opt-2',
        text: 'Stack',
        structureId: 'stack',
        explanation: 'Correct! A Stack operates strictly on LIFO (Last-In, First-Out). Pushing new pages onto the stack and popping when pressing Back ensures the user returns to the immediately preceding page.',
        isCorrect: true,
      },
      {
        id: 'opt-3',
        text: 'Binary Search Tree',
        structureId: 'bst',
        explanation: 'Incorrect. A BST sorts elements by key comparison rather than temporal visitation sequence.',
        isCorrect: false,
      },
      {
        id: 'opt-4',
        text: 'Hash Table',
        structureId: 'hash-table',
        explanation: 'Incorrect. Hash tables provide key-value lookups but maintain no inherent chronological order.',
        isCorrect: false,
      }
    ],
    requirements: [
      { id: 'r1', label: 'LIFO Ordering', description: 'Retrieve most recently added page first', critical: true, satisfiedBy: ['stack'] }
    ],
    availableStructures: ['stack', 'queue', 'hash-table', 'bst'],
    optimalStructures: ['stack'],
    rewardXp: 100
  },
  {
    id: 'c-l1-02',
    slug: 'fifo-printer-spooler',
    title: 'Mission 02: Office Print Job Spooler',
    level: 1,
    difficulty: 'Easy',
    category: 'Operating Systems',
    missionBrief: 'In a shared office printer, multiple employees send print documents simultaneously. Documents must be printed strictly in the order they were submitted to ensure fairness.',
    question: 'Which data structure enforces First-In, First-Out (FIFO) processing?',
    options: [
      {
        id: 'opt-1',
        text: 'Queue',
        structureId: 'queue',
        explanation: 'Correct! A Queue guarantees FIFO order: the first document enqueued is the first document dequeued and printed.',
        isCorrect: true,
      },
      {
        id: 'opt-2',
        text: 'Stack',
        structureId: 'stack',
        explanation: 'Incorrect. A Stack would print the last submitted document first, unfairly starving earlier submissions.',
        isCorrect: false,
      },
      {
        id: 'opt-3',
        text: 'Graph',
        structureId: 'graph',
        explanation: 'Incorrect. A Graph models network topology, not sequential order.',
        isCorrect: false,
      },
      {
        id: 'opt-4',
        text: 'Heap',
        structureId: 'heap',
        explanation: 'Incorrect. A Heap orders by priority value rather than arrival time.',
        isCorrect: false,
      }
    ],
    requirements: [
      { id: 'r1', label: 'FIFO Ordering', description: 'Print documents in exact order of submission', critical: true, satisfiedBy: ['queue'] }
    ],
    availableStructures: ['queue', 'stack', 'graph', 'heap'],
    optimalStructures: ['queue'],
    rewardXp: 100
  },
  {
    id: 'c-l1-03',
    slug: 'fast-session-cache',
    title: 'Mission 03: High-Speed User Session Cache',
    level: 1,
    difficulty: 'Easy',
    category: 'Backend Systems',
    missionBrief: 'An authentication server receives 100,000 requests per second. Each request includes a unique session token that must be validated in constant time without scanning through memory.',
    question: 'Which structure provides average O(1) lookup when given a unique key?',
    options: [
      {
        id: 'opt-1',
        text: 'Linked List',
        structureId: 'linked-list',
        explanation: 'Incorrect. Searching a Linked List takes linear O(n) time, causing major bottlenecks under high traffic.',
        isCorrect: false,
      },
      {
        id: 'opt-2',
        text: 'Binary Search Tree',
        structureId: 'bst',
        explanation: 'Incorrect. BST lookup takes O(log n), which is good but slower than constant O(1).',
        isCorrect: false,
      },
      {
        id: 'opt-3',
        text: 'Hash Table',
        structureId: 'hash-table',
        explanation: 'Correct! Hash Tables convert string keys into memory indices using a hashing function, achieving average O(1) lookup time.',
        isCorrect: true,
      },
      {
        id: 'opt-4',
        text: 'Array',
        structureId: 'array',
        explanation: 'Incorrect. Finding an item in an unsorted array takes O(n) linear search.',
        isCorrect: false,
      }
    ],
    requirements: [
      { id: 'r1', label: 'Instant O(1) Key Lookup', description: 'Validate session token without scanning', critical: true, satisfiedBy: ['hash-table'] }
    ],
    availableStructures: ['hash-table', 'linked-list', 'bst', 'array'],
    optimalStructures: ['hash-table'],
    rewardXp: 100
  },
  {
    id: 'c-l1-04',
    slug: 'hierarchical-file-system',
    title: 'Mission 04: File System Directory Hierarchy',
    level: 1,
    difficulty: 'Easy',
    category: 'Storage Architecture',
    missionBrief: 'You must represent an operating system disk structure: a root drive contains folders, each folder contains subfolders and files in a nested parent-child relationship.',
    question: 'Which structure naturally models hierarchical parent-child relationships?',
    options: [
      {
        id: 'opt-1',
        text: 'Tree / Binary Search Tree',
        structureId: 'bst',
        explanation: 'Correct! Tree structures model nested, hierarchical relationships where a parent node branches into multiple child subtrees.',
        isCorrect: true,
      },
      {
        id: 'opt-2',
        text: 'Stack',
        structureId: 'stack',
        explanation: 'Incorrect. A stack only stores a single 1D linear sequence.',
        isCorrect: false,
      },
      {
        id: 'opt-3',
        text: 'Hash Table',
        structureId: 'hash-table',
        explanation: 'Incorrect. A flat hash table cannot intuitively represent depth, parentage, and subtree navigation.',
        isCorrect: false,
      },
      {
        id: 'opt-4',
        text: 'Queue',
        structureId: 'queue',
        explanation: 'Incorrect. A queue is a linear FIFO sequence without branch hierarchies.',
        isCorrect: false,
      }
    ],
    requirements: [
      { id: 'r1', label: 'Hierarchical Branching', description: 'Store nested parent-child nodes', critical: true, satisfiedBy: ['bst'] }
    ],
    availableStructures: ['bst', 'stack', 'hash-table', 'queue'],
    optimalStructures: ['bst'],
    rewardXp: 100
  },
  {
    id: 'c-l1-05',
    slug: 'social-network-friendships',
    title: 'Mission 05: Social Network Relationships',
    level: 1,
    difficulty: 'Easy',
    category: 'Social Media',
    missionBrief: 'In a global network of 500 million users, each user can follow or be friends with multiple people. We need to find connections, degrees of separation, and mutual friends.',
    question: 'Which data structure best represents many-to-many connections between entities?',
    options: [
      {
        id: 'opt-1',
        text: 'Graph',
        structureId: 'graph',
        explanation: 'Correct! A Graph represents entities as vertices and friendships as edges, allowing pathfinding algorithms (like BFS) to calculate degrees of separation.',
        isCorrect: true,
      },
      {
        id: 'opt-2',
        text: 'Array',
        structureId: 'array',
        explanation: 'Incorrect. An array cannot natively capture arbitrary relational graphs without separate adjacency mappings.',
        isCorrect: false,
      },
      {
        id: 'opt-3',
        text: 'Queue',
        structureId: 'queue',
        explanation: 'Incorrect. A queue only manages sequential arrival order.',
        isCorrect: false,
      },
      {
        id: 'opt-4',
        text: 'Stack',
        structureId: 'stack',
        explanation: 'Incorrect. A stack is for LIFO backtracking, not complex networked connectivity.',
        isCorrect: false,
      }
    ],
    requirements: [
      { id: 'r1', label: 'Arbitrary Relational Network', description: 'Model many-to-many user connections', critical: true, satisfiedBy: ['graph'] }
    ],
    availableStructures: ['graph', 'array', 'queue', 'stack'],
    optimalStructures: ['graph'],
    rewardXp: 100
  },
  {
    id: 'c-l1-06',
    slug: 'emergency-er-triage-basic',
    title: 'Mission 06: Emergency Room Triage Ordering',
    level: 1,
    difficulty: 'Easy',
    category: 'Healthcare',
    missionBrief: 'Patients arrive with varying severity ratings (1 = critical gunshot wound, 5 = minor sprained finger). Critical patients must be treated immediately, regardless of when they entered the room.',
    question: 'Which structure always extracts the highest/lowest priority item efficiently?',
    options: [
      {
        id: 'opt-1',
        text: 'Priority Queue / Heap',
        structureId: 'priority-queue',
        explanation: 'Correct! A Priority Queue (backed by a Binary Heap) dynamically orders elements by severity, ensuring critical patients are dequeued first in O(log n) time.',
        isCorrect: true,
      },
      {
        id: 'opt-2',
        text: 'Queue',
        structureId: 'queue',
        explanation: 'Incorrect. A standard queue would force a critical patient to wait behind minor injuries who arrived earlier (FIFO).',
        isCorrect: false,
      },
      {
        id: 'opt-3',
        text: 'Stack',
        structureId: 'stack',
        explanation: 'Incorrect. A stack treats the latest arrival first, ignoring medical urgency.',
        isCorrect: false,
      },
      {
        id: 'opt-4',
        text: 'Linked List',
        structureId: 'linked-list',
        explanation: 'Incorrect. A plain linked list requires an O(n) search to find the highest priority patient.',
        isCorrect: false,
      }
    ],
    requirements: [
      { id: 'r1', label: 'Priority Dispatching', description: 'Serve highest urgency first', critical: true, satisfiedBy: ['priority-queue', 'heap'] }
    ],
    availableStructures: ['priority-queue', 'queue', 'stack', 'linked-list'],
    optimalStructures: ['priority-queue'],
    rewardXp: 100
  },
  {
    id: 'c-l1-07',
    slug: 'contiguous-spatial-buffer',
    title: 'Mission 07: Audio Sample Buffer with Direct Indexing',
    level: 1,
    difficulty: 'Easy',
    category: 'Audio Engineering',
    missionBrief: 'A digital audio workstation processes sound in 44,100 samples per second. The DSP chip must read sample number 14,200 instantaneously without walking node pointers.',
    question: 'Which structure provides contiguous memory layout with O(1) index calculation?',
    options: [
      {
        id: 'opt-1',
        text: 'Array',
        structureId: 'array',
        explanation: 'Correct! An Array reserves contiguous memory blocks where index i is accessed in O(1) via base + i * size pointer math.',
        isCorrect: true,
      },
      {
        id: 'opt-2',
        text: 'Linked List',
        structureId: 'linked-list',
        explanation: 'Incorrect. Accessing sample 14,200 in a linked list requires traversing 14,200 pointer hops.',
        isCorrect: false,
      },
      {
        id: 'opt-3',
        text: 'Graph',
        structureId: 'graph',
        explanation: 'Incorrect. Graph nodes are scattered across memory.',
        isCorrect: false,
      },
      {
        id: 'opt-4',
        text: 'Stack',
        structureId: 'stack',
        explanation: 'Incorrect. Stacks only provide direct access to the top element.',
        isCorrect: false,
      }
    ],
    requirements: [
      { id: 'r1', label: 'Instant Index Access', description: 'Direct O(1) addressing', critical: true, satisfiedBy: ['array'] }
    ],
    availableStructures: ['array', 'linked-list', 'graph', 'stack'],
    optimalStructures: ['array'],
    rewardXp: 100
  },
  {
    id: 'c-l1-08',
    slug: 'middle-insertion-pointers',
    title: 'Mission 08: Dynamic Playlist with Mid-Point Splicing',
    level: 1,
    difficulty: 'Easy',
    category: 'Media Player',
    missionBrief: 'A DJ creates a playlist. While a song is playing, they often drag a new song directly between two existing songs. When the cursor reference is held, insertion must not require shifting thousands of items.',
    question: 'Which structure can insert an item in O(1) without shifting elements when the pointer is known?',
    options: [
      {
        id: 'opt-1',
        text: 'Linked List',
        structureId: 'linked-list',
        explanation: 'Correct! Inserting a node between two linked list nodes requires only adjusting two pointer references (prev.next and next.prev), with zero element shifting.',
        isCorrect: true,
      },
      {
        id: 'opt-2',
        text: 'Array',
        structureId: 'array',
        explanation: 'Incorrect. Inserting into the middle of an array requires shifting all subsequent elements rightward (O(n)).',
        isCorrect: false,
      },
      {
        id: 'opt-3',
        text: 'Stack',
        structureId: 'stack',
        explanation: 'Incorrect. Stacks forbid inserting into the middle.',
        isCorrect: false,
      },
      {
        id: 'opt-4',
        text: 'Queue',
        structureId: 'queue',
        explanation: 'Incorrect. Queues only permit enqueueing at the rear.',
        isCorrect: false,
      }
    ],
    requirements: [
      { id: 'r1', label: 'Pointer Splicing', description: 'Insert between nodes without memory shifting', critical: true, satisfiedBy: ['linked-list'] }
    ],
    availableStructures: ['linked-list', 'array', 'stack', 'queue'],
    optimalStructures: ['linked-list'],
    rewardXp: 100
  },
  {
    id: 'c-l1-09',
    slug: 'ordered-range-queries',
    title: 'Mission 09: E-Commerce Price Range Filter',
    level: 1,
    difficulty: 'Easy',
    category: 'E-Commerce',
    missionBrief: 'Shoppers on an online store frequently filter products by price: "Show all watches between $150 and $300 in sorted order". We need logarithmic search and sorted in-order traversal.',
    question: 'Which data structure maintains sorted key order and supports logarithmic search and range scans?',
    options: [
      {
        id: 'opt-1',
        text: 'Binary Search Tree',
        structureId: 'bst',
        explanation: 'Correct! BSTs maintain sorted keys: in-order traversal yields items in ascending order, and finding the range boundary takes O(log n).',
        isCorrect: true,
      },
      {
        id: 'opt-2',
        text: 'Hash Table',
        structureId: 'hash-table',
        explanation: 'Incorrect. Hash tables do not maintain sorted order; range scanning requires examining every bucket (O(n)).',
        isCorrect: false,
      },
      {
        id: 'opt-3',
        text: 'Stack',
        structureId: 'stack',
        explanation: 'Incorrect. A stack is for LIFO order, not key-ordered range queries.',
        isCorrect: false,
      },
      {
        id: 'opt-4',
        text: 'Queue',
        structureId: 'queue',
        explanation: 'Incorrect. Queues do not support sorted ordering or range filtering.',
        isCorrect: false,
      }
    ],
    requirements: [
      { id: 'r1', label: 'Ordered Traversal & Range Query', description: 'Scan items between min and max price', critical: true, satisfiedBy: ['bst'] }
    ],
    availableStructures: ['bst', 'hash-table', 'stack', 'queue'],
    optimalStructures: ['bst'],
    rewardXp: 100
  },
  {
    id: 'c-l1-10',
    slug: 'call-stack-recursion',
    title: 'Mission 10: Compiler Execution Call Stack',
    level: 1,
    difficulty: 'Easy',
    category: 'Compilers',
    missionBrief: 'When a function calls another function recursively (funcA calls funcB, which calls funcC), the runtime must resume funcB when funcC returns, and then resume funcA when funcB returns.',
    question: 'Which structure powers runtime function call frames and recursion unwinding?',
    options: [
      {
        id: 'opt-1',
        text: 'Stack',
        structureId: 'stack',
        explanation: 'Correct! The call stack pushes execution frames as functions are invoked and pops them when functions return, directly matching LIFO order.',
        isCorrect: true,
      },
      {
        id: 'opt-2',
        text: 'Queue',
        structureId: 'queue',
        explanation: 'Incorrect. A queue would resume funcA before funcB finishes.',
        isCorrect: false,
      },
      {
        id: 'opt-3',
        text: 'Heap',
        structureId: 'heap',
        explanation: 'Incorrect. Binary heaps are for priority ordering, not recursive call stack frames.',
        isCorrect: false,
      },
      {
        id: 'opt-4',
        text: 'Graph',
        structureId: 'graph',
        explanation: 'Incorrect. While call graphs model relationships, execution unwinding uses a stack.',
        isCorrect: false,
      }
    ],
    requirements: [
      { id: 'r1', label: 'Execution Unwinding', description: 'Resume deepest nested function first', critical: true, satisfiedBy: ['stack'] }
    ],
    availableStructures: ['stack', 'queue', 'heap', 'graph'],
    optimalStructures: ['stack'],
    rewardXp: 100
  },

  // ==========================================
  // LEVEL 2: COMPARISON & TRADE-OFFS (8 Challenges)
  // ==========================================
  {
    id: 'c-l2-01',
    slug: 'read-heavy-vs-write-heavy',
    title: 'Mission 11: High-Frequency Search vs Insertion',
    level: 2,
    difficulty: 'Medium',
    category: 'System Architect',
    missionBrief: 'You are designing an in-memory product index. Requirements: 90% of traffic is searching for items by SKU, while 10% is adding new products. Compare Array, BST, and Hash Table across Search, Insertion, Deletion, and Ordering.',
    comparisonCriteria: [
      {
        criterion: 'Search Efficiency',
        description: 'Need fast average lookup time for high search volume.',
        bestChoice: 'hash-table',
        explanation: 'Hash Table provides O(1) average lookup vs O(log n) for BST and O(n) for unsorted Array.'
      },
      {
        criterion: 'Insertion Efficiency',
        description: 'Need fast dynamic insertion for new inventory arrivals.',
        bestChoice: 'hash-table',
        explanation: 'Hash Table inserts in O(1) average without shifting elements.'
      },
      {
        criterion: 'Alphabetical / Sorted Catalog Walk',
        description: 'Need to render products in alphabetical or price order.',
        bestChoice: 'bst',
        explanation: 'BST naturally maintains sorted keys (O(n) in-order traversal), whereas Hash Table has no sorted order.'
      }
    ],
    requirements: [
      { id: 'r1', label: 'Frequent O(1) Search', description: 'Average O(1) key retrieval', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r2', label: 'Frequent Insertion', description: 'Low overhead additions', critical: true, satisfiedBy: ['hash-table', 'linked-list'] }
    ],
    availableStructures: ['array', 'bst', 'hash-table', 'linked-list'],
    optimalStructures: ['hash-table'],
    rewardXp: 150
  },
  {
    id: 'c-l2-02',
    slug: 'dynamic-leaderboard-ranks',
    title: 'Mission 12: Real-Time Gaming Leaderboard',
    level: 2,
    difficulty: 'Medium',
    category: 'Gaming Architecture',
    missionBrief: '100,000 players continuously submit high scores. The game needs to display the Top 10 players instantly on every tick, while periodically inserting new scores.',
    comparisonCriteria: [
      {
        criterion: 'Top 10 Extraction',
        description: 'Instantly retrieve highest scoring players.',
        bestChoice: 'heap',
        explanation: 'A Max-Heap provides O(1) peek at root, and building/maintaining top K takes O(log K).'
      },
      {
        criterion: 'Score Update Cost',
        description: 'Sifting new scores into ranking structure.',
        bestChoice: 'heap',
        explanation: 'Heap insertion takes O(log n) vs O(n) element shifts in a sorted array.'
      }
    ],
    requirements: [
      { id: 'r1', label: 'Instant Top Element Access', description: 'O(1) access to top score', critical: true, satisfiedBy: ['heap', 'priority-queue'] },
      { id: 'r2', label: 'Logarithmic Score Updates', description: 'O(log n) score insertion', critical: true, satisfiedBy: ['heap', 'bst'] }
    ],
    availableStructures: ['array', 'heap', 'bst', 'hash-table'],
    optimalStructures: ['heap'],
    rewardXp: 150
  },
  {
    id: 'c-l2-03',
    slug: 'embedded-sensor-memory',
    title: 'Mission 13: Memory-Constrained IoT Sensor Buffer',
    level: 2,
    difficulty: 'Medium',
    category: 'Embedded Systems',
    missionBrief: 'A micro-controller has only 16KB of RAM. It records temperature readings every millisecond. Memory overhead from pointers must be near zero to avoid out-of-memory crashes.',
    comparisonCriteria: [
      {
        criterion: 'Memory Overhead per Element',
        description: 'Avoid storing auxiliary pointer references.',
        bestChoice: 'array',
        explanation: 'A static Array has 0 extra bytes overhead per element. Linked lists require 8 to 16 bytes per node for pointers!'
      },
      {
        criterion: 'Cache Locality',
        description: 'Continuous memory block for hardware prefetching.',
        bestChoice: 'array',
        explanation: 'Arrays are contiguous, maximizing CPU cache line utilization.'
      }
    ],
    requirements: [
      { id: 'r1', label: 'Minimal Memory Overhead', description: 'No pointer baggage', critical: true, satisfiedBy: ['array'] },
      { id: 'r2', label: 'Predictable Footprint', description: 'Fixed buffer size without heap fragmentation', critical: true, satisfiedBy: ['array'] }
    ],
    availableStructures: ['array', 'linked-list', 'hash-table', 'bst'],
    optimalStructures: ['array'],
    rewardXp: 150
  },
  {
    id: 'c-l2-04',
    slug: 'undo-redo-ring-buffer',
    title: 'Mission 14: Fixed-Capacity Graphic Editor Undo Buffer',
    level: 2,
    difficulty: 'Medium',
    category: 'Desktop Software',
    missionBrief: 'Photoshop allows up to 50 undo actions. When action 51 arrives, the oldest action (action 1) is automatically discarded, while the user can continuously undo/redo recent actions.',
    comparisonCriteria: [
      {
        criterion: 'LIFO Undo Semantics',
        description: 'Undo should reverse the most recent action.',
        bestChoice: 'stack',
        explanation: 'Stack models LIFO undo naturally.'
      },
      {
        criterion: 'Oldest Item Eviction',
        description: 'Drop oldest action when capacity reaches 50.',
        bestChoice: 'queue',
        explanation: 'Queue FIFO behavior drops oldest item. A circular buffer/deque combines stack and queue characteristics.'
      }
    ],
    requirements: [
      { id: 'r1', label: 'LIFO Backtracking', description: 'Undo latest action first', critical: true, satisfiedBy: ['stack'] },
      { id: 'r2', label: 'Bounded Capacity Eviction', description: 'Drop oldest item when full', critical: true, satisfiedBy: ['queue', 'array'] }
    ],
    availableStructures: ['stack', 'queue', 'array', 'bst'],
    optimalStructures: ['stack', 'array'],
    rewardXp: 150
  },
  {
    id: 'c-l2-05',
    slug: 'range-vs-exact-lookup',
    title: 'Mission 15: Stock Portfolio Price Thresholds',
    level: 2,
    difficulty: 'Medium',
    category: 'FinTech',
    missionBrief: 'A financial trading platform stores live stock quotes. Traders execute two main queries: (1) Find stock quote for ticker AAPL, and (2) Find all stocks trading between $50 and $100.',
    comparisonCriteria: [
      {
        criterion: 'Exact Ticker Lookup',
        description: 'Instant quote for known symbol.',
        bestChoice: 'hash-table',
        explanation: 'Hash Table achieves O(1) average lookup for symbol strings.'
      },
      {
        criterion: 'Price Range Scan',
        description: 'Query all assets within price interval.',
        bestChoice: 'bst',
        explanation: 'BST maintains ordered keys; finding range start and traversing takes O(log n + k).'
      }
    ],
    requirements: [
      { id: 'r1', label: 'Exact Ticker Query', description: 'Fast O(1) single key lookup', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r2', label: 'Range Search Capability', description: 'Retrieve elements within [min, max]', critical: true, satisfiedBy: ['bst'] }
    ],
    availableStructures: ['hash-table', 'bst', 'linked-list', 'stack'],
    optimalStructures: ['bst', 'hash-table'],
    rewardXp: 150
  },
  {
    id: 'c-l2-06',
    slug: 'network-packet-router',
    title: 'Mission 16: Internet Packet Routing & Hop Table',
    level: 2,
    difficulty: 'Medium',
    category: 'Networking',
    missionBrief: 'A core router on the internet backbone must inspect the destination IP address of incoming packets and forward them through the optimal path with least latency.',
    comparisonCriteria: [
      {
        criterion: 'Network Topology Modeling',
        description: 'Represent physical routers and fiber connections.',
        bestChoice: 'graph',
        explanation: 'Graphs accurately model networks of nodes connected by weighted latency links.'
      },
      {
        criterion: 'Fast Interface Forwarding',
        description: 'Match IP prefix to outgoing hardware port.',
        bestChoice: 'hash-table',
        explanation: 'Hash Table / Trie provides ultra-fast route lookup for incoming packet IP.'
      }
    ],
    requirements: [
      { id: 'r1', label: 'Network Pathfinding', description: 'Find shortest latency path', critical: true, satisfiedBy: ['graph'] },
      { id: 'r2', label: 'Fast Destination Routing', description: 'Map target IP to interface port', critical: true, satisfiedBy: ['hash-table'] }
    ],
    availableStructures: ['graph', 'hash-table', 'queue', 'linked-list'],
    optimalStructures: ['graph', 'hash-table'],
    rewardXp: 150
  },
  {
    id: 'c-l2-07',
    slug: 'dynamic-priority-task-queue',
    title: 'Mission 17: Cloud Batch Job Scheduler',
    level: 2,
    difficulty: 'Medium',
    category: 'Cloud Infrastructure',
    missionBrief: 'A server farm accepts compute jobs with variable compute priorities. If a job is waiting too long, its priority is dynamically escalated to prevent starvation.',
    comparisonCriteria: [
      {
        criterion: 'Highest Priority Worker Dispatch',
        description: 'Hand next job to idle compute node.',
        bestChoice: 'priority-queue',
        explanation: 'Priority Queue serves top priority task in O(log n).'
      },
      {
        criterion: 'Arbitrary Job Lookup for Priority Escalation',
        description: 'Find waiting job by JobID to boost priority.',
        bestChoice: 'hash-table',
        explanation: 'Heap takes O(n) to find by JobID; Hash Table finds it in O(1).'
      }
    ],
    requirements: [
      { id: 'r1', label: 'Priority Dispatching', description: 'Serve highest priority task first', critical: true, satisfiedBy: ['priority-queue', 'heap'] },
      { id: 'r2', label: 'Fast Task ID Search', description: 'Locate task by ID to escalate', critical: true, satisfiedBy: ['hash-table'] }
    ],
    availableStructures: ['priority-queue', 'heap', 'hash-table', 'queue'],
    optimalStructures: ['priority-queue', 'hash-table'],
    rewardXp: 150
  },
  {
    id: 'c-l2-08',
    slug: 'prefix-autocomplete-search',
    title: 'Mission 18: Search Engine Auto-Complete Bar',
    level: 2,
    difficulty: 'Medium',
    category: 'Search Engine',
    missionBrief: 'As a user types "dat...", the search engine must suggest queries starting with that prefix. We must compare sorted arrays, hash tables, and hierarchical prefix trees.',
    comparisonCriteria: [
      {
        criterion: 'Prefix Matching',
        description: 'Find all words sharing a common starting substring.',
        bestChoice: 'bst',
        explanation: 'Tree structures group common prefixes and allow sub-tree exploration.'
      },
      {
        criterion: 'Exact Word Verification',
        description: 'Check if exact word exists in dictionary.',
        bestChoice: 'hash-table',
        explanation: 'Hash Table checks exact presence in O(1).'
      }
    ],
    requirements: [
      { id: 'r1', label: 'Prefix Search', description: 'Find entries matching query prefix', critical: true, satisfiedBy: ['bst'] },
      { id: 'r2', label: 'Fast Exact Match', description: 'Verify existing dictionary entry', critical: true, satisfiedBy: ['hash-table'] }
    ],
    availableStructures: ['bst', 'hash-table', 'array', 'stack'],
    optimalStructures: ['bst'],
    rewardXp: 150
  },

  // ==========================================
  // LEVEL 3: MULTI-TASK & HYBRID DESIGN (6 Challenges)
  // ==========================================
  {
    id: 'c-l3-01',
    slug: 'emergency-hospital-hybrid',
    title: 'Mission 19: Emergency Hospital Command Center',
    level: 3,
    difficulty: 'Hard',
    category: 'Healthcare',
    missionBrief: 'Hospital triage requires: (1) Treat highest severity patient first (Priority), (2) Instant patient lookup by Patient ID (O(1) Search), (3) Maintain chronological admission history (History Order). Single structures fail because Heap lacks fast ID search, Hash Table lacks priority sorting, and Linked List lacks fast search.',
    requirements: [
      { id: 'r-prio', label: 'Emergency Priority Triage', description: 'Highest priority patient must be served first', critical: true, satisfiedBy: ['priority-queue', 'heap'] },
      { id: 'r-search', label: 'Instant Patient ID Search', description: 'Patient must be searchable in O(1) using Patient ID', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r-history', label: 'Chronological Admission History', description: 'Maintain temporal sequence of arriving patients', critical: true, satisfiedBy: ['linked-list', 'array'] }
    ],
    availableStructures: ['priority-queue', 'hash-table', 'linked-list', 'bst', 'queue', 'stack'],
    optimalStructures: ['priority-queue', 'hash-table', 'linked-list'],
    rewardXp: 250,
    simulationScenario: {
      title: 'Emergency Triage & Patient Lookup',
      initialDataCount: 4,
      sampleOperations: [
        { op: 'INSERT', payload: { id: 'P101', name: 'John Doe', priority: 1, condition: 'Cardiac Arrest' }, expectedTargetStructure: 'priority-queue' },
        { op: 'INSERT', payload: { id: 'P102', name: 'Jane Smith', priority: 4, condition: 'Minor Cut' }, expectedTargetStructure: 'priority-queue' },
        { op: 'SEARCH', payload: { id: 'P101' }, expectedTargetStructure: 'hash-table' },
        { op: 'DEQUEUE', payload: {}, expectedTargetStructure: 'priority-queue' }
      ]
    }
  },
  {
    id: 'c-l3-02',
    slug: 'lru-cache-hybrid',
    title: 'Mission 20: In-Memory High-Speed LRU Cache',
    level: 3,
    difficulty: 'Hard',
    category: 'Distributed Systems',
    missionBrief: 'Design a Least Recently Used (LRU) Cache with capacity K. Requirements: (1) O(1) get(key) lookup, (2) O(1) put(key, value) insertion, (3) Evict least recently accessed item in O(1) when capacity is reached. A hash map alone cannot track recency in O(1), and a linked list alone cannot search in O(1).',
    requirements: [
      { id: 'r-lookup', label: 'O(1) Key Lookup', description: 'Retrieve value for key in constant time', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r-recency', label: 'O(1) Eviction & Recency Order', description: 'Move accessed node to front and evict tail in O(1)', critical: true, satisfiedBy: ['linked-list'] }
    ],
    availableStructures: ['hash-table', 'linked-list', 'array', 'bst', 'queue'],
    optimalStructures: ['hash-table', 'linked-list'],
    rewardXp: 250,
    simulationScenario: {
      title: 'LRU Cache Get/Put Operations',
      initialDataCount: 3,
      sampleOperations: [
        { op: 'INSERT', payload: { key: 'token_user_1', val: 'ActiveSession' }, expectedTargetStructure: 'hash-table' },
        { op: 'SEARCH', payload: { key: 'token_user_1' }, expectedTargetStructure: 'hash-table' },
        { op: 'DELETE', payload: { key: 'token_user_old' }, expectedTargetStructure: 'linked-list' }
      ]
    }
  },
  {
    id: 'c-l3-03',
    slug: 'ecommerce-catalog-filter',
    title: 'Mission 21: E-Commerce Product Index & Price Range Filter',
    level: 3,
    difficulty: 'Hard',
    category: 'E-Commerce',
    missionBrief: 'An online marketplace needs: (1) Instant O(1) product lookup by SKU barcode, (2) Fast range filtering (e.g. products priced between $50 and $150), (3) Maintain sorted inventory display. Hash table provides O(1) lookup but cannot do range scans; BST does range scans but has O(log n) lookup.',
    requirements: [
      { id: 'r-sku', label: 'O(1) SKU Barcode Lookup', description: 'Instant product page load by unique SKU', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r-range', label: 'Price Range Filtering', description: 'Query items in [minPrice, maxPrice] in sorted order', critical: true, satisfiedBy: ['bst'] }
    ],
    availableStructures: ['hash-table', 'bst', 'array', 'queue'],
    optimalStructures: ['hash-table', 'bst'],
    rewardXp: 250
  },
  {
    id: 'c-l3-04',
    slug: 'music-streamer-playlist-history',
    title: 'Mission 22: Music Player Streaming Queue & History',
    level: 3,
    difficulty: 'Hard',
    category: 'Audio Streaming',
    missionBrief: 'Spotify-style playback engine: (1) Skip forward and backward smoothly between songs, (2) Instant O(1) song search by Title/SongID to jump to track, (3) Maintain upcoming queue buffer.',
    requirements: [
      { id: 'r-nav', label: 'Bi-directional Track Navigation', description: 'Traverse Next and Previous tracks with pointers', critical: true, satisfiedBy: ['linked-list'] },
      { id: 'r-search', label: 'Direct SongID Indexing', description: 'Jump to any song in library in O(1)', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r-queue', label: 'Upcoming Playback Queue', description: 'FIFO buffer for user queued songs', critical: true, satisfiedBy: ['queue'] }
    ],
    availableStructures: ['linked-list', 'hash-table', 'queue', 'stack', 'heap'],
    optimalStructures: ['linked-list', 'hash-table', 'queue'],
    rewardXp: 250
  },
  {
    id: 'c-l3-05',
    slug: 'stock-order-book-hybrid',
    title: 'Mission 23: Real-Time Financial Limit Order Book',
    level: 3,
    difficulty: 'Hard',
    category: 'FinTech',
    missionBrief: 'A high-frequency exchange order book matches buyers and sellers: (1) Match highest buy bid with lowest sell ask instantly, (2) Fast O(1) order cancellation by OrderID, (3) Execute matching orders in FIFO order at same price point.',
    requirements: [
      { id: 'r-match', label: 'Best Bid / Ask Matching', description: 'Instant O(1) access to highest bid and lowest ask', critical: true, satisfiedBy: ['heap', 'priority-queue'] },
      { id: 'r-cancel', label: 'O(1) Order Cancellation by ID', description: 'Find and cancel active orders immediately', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r-fifo', label: 'Price-Time Priority Queue', description: 'Execute orders at same price in arrival order', critical: true, satisfiedBy: ['queue', 'linked-list'] }
    ],
    availableStructures: ['heap', 'hash-table', 'queue', 'bst'],
    optimalStructures: ['heap', 'hash-table', 'queue'],
    rewardXp: 250
  },
  {
    id: 'c-l3-06',
    slug: 'dedup-job-scheduler',
    title: 'Mission 24: Distributed Cloud Job Scheduler with Deduplication',
    level: 3,
    difficulty: 'Hard',
    category: 'Cloud Systems',
    missionBrief: 'Thousands of microservices push async jobs to a worker pool: (1) Execute highest priority jobs first, (2) Reject duplicate job payloads in O(1) if already pending, (3) Log execution history.',
    requirements: [
      { id: 'r-priority', label: 'Priority Dispatching', description: 'Serve critical compute jobs ahead of background sync', critical: true, satisfiedBy: ['priority-queue', 'heap'] },
      { id: 'r-dedup', label: 'O(1) Deduplication Check', description: 'Verify if job signature is already queued', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r-history', label: 'Execution Audit Log', description: 'Chronological record of completed jobs', critical: true, satisfiedBy: ['linked-list', 'array'] }
    ],
    availableStructures: ['priority-queue', 'hash-table', 'linked-list', 'bst'],
    optimalStructures: ['priority-queue', 'hash-table', 'linked-list'],
    rewardXp: 250
  },

  // ==========================================
  // LEVEL 4: SYSTEM DESIGN ARCHITECT (5 Missions)
  // ==========================================
  {
    id: 'c-l4-01',
    slug: 'hospital-system-design-flagship',
    title: 'Mission 25: Smart City Metropolitan Hospital Core',
    level: 4,
    difficulty: 'Expert',
    category: 'Healthcare Infrastructure',
    missionBrief: 'Design the full data architecture for a regional emergency hospital. The system processes 10,000 patient interactions daily. Requirements: (1) Critical patient priority triage, (2) Instant patient record lookup by Government Health ID, (3) Complete chronological medical history log, (4) Doctor-to-Department and Bed-to-Patient relational assignment network, (5) Real-time analytical reporting.',
    requirements: [
      { id: 'r1', label: 'Emergency Priority Triage', description: 'Highest severity patients must be routed to ICU immediately', critical: true, satisfiedBy: ['priority-queue', 'heap'] },
      { id: 'r2', label: 'O(1) Patient ID Lookup', description: 'Retrieve patient demographics and insurance in constant time', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r3', label: 'Chronological Clinical Audit Log', description: 'Immutable sequential history of treatments and prescriptions', critical: true, satisfiedBy: ['linked-list', 'array'] },
      { id: 'r4', label: 'Doctor-Department Relational Network', description: 'Model hospital department connectivity, doctor rotations, and beds', critical: true, satisfiedBy: ['graph'] },
      { id: 'r5', label: 'Dynamic Sorting for Capacity Reports', description: 'Filter beds and wards by occupancy percentage', critical: false, satisfiedBy: ['bst', 'array'] }
    ],
    availableStructures: ['priority-queue', 'hash-table', 'linked-list', 'graph', 'bst', 'queue', 'stack', 'array', 'heap'],
    optimalStructures: ['priority-queue', 'hash-table', 'linked-list', 'graph'],
    rewardXp: 400
  },
  {
    id: 'c-l4-02',
    slug: 'global-social-network-core',
    title: 'Mission 26: Global Social Network Feed & Graph Engine',
    level: 4,
    difficulty: 'Expert',
    category: 'Social Media',
    missionBrief: 'Design Twitter/Meta scale architecture: (1) Graph of follower/friend relationships to compute recommendations and degrees of connection, (2) O(1) user profile indexing, (3) Real-time LIFO newsfeed rendering of latest posts, (4) In-memory message queues for live direct messages.',
    requirements: [
      { id: 'r1', label: 'Social Graph Topology', description: 'Model user follow relationships and calculate mutual friends via BFS', critical: true, satisfiedBy: ['graph'] },
      { id: 'r2', label: 'O(1) Profile & Handle Index', description: 'Instant resolution of @username to UserRecord', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r3', label: 'Reverse-Chronological Post Feed', description: 'Render freshest posts at top of timeline (LIFO / Stack semantics)', critical: true, satisfiedBy: ['stack', 'linked-list'] },
      { id: 'r4', label: 'Live Message Queue', description: 'Sequential FIFO delivery of direct chat messages', critical: true, satisfiedBy: ['queue'] }
    ],
    availableStructures: ['graph', 'hash-table', 'stack', 'queue', 'bst', 'heap', 'linked-list'],
    optimalStructures: ['graph', 'hash-table', 'stack', 'queue'],
    rewardXp: 400
  },
  {
    id: 'c-l4-03',
    slug: 'autonomous-vehicle-navigation',
    title: 'Mission 27: Autonomous Fleet Navigation & Traffic Router',
    level: 4,
    difficulty: 'Expert',
    category: 'Autonomous Systems',
    missionBrief: 'Architect the routing brain for 5,000 self-driving taxis: (1) Street intersection road network with distance and traffic weights, (2) Dijkstra pathfinding with Min-Priority queue for exploring lowest-cost nodes, (3) O(1) lookup of vehicle ID to current coordinates, (4) Waypoint turn-by-turn instruction sequence.',
    requirements: [
      { id: 'r1', label: 'Road Network Graph', description: 'Model intersections as vertices and roads as weighted edges', critical: true, satisfiedBy: ['graph'] },
      { id: 'r2', label: 'Pathfinding Priority Queue', description: 'Min-Heap for selecting next lowest-latency intersection in Dijkstra', critical: true, satisfiedBy: ['priority-queue', 'heap'] },
      { id: 'r3', label: 'Vehicle Fleet Hash Map', description: 'Instant lookup of taxi GPS coordinates and availability', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r4', label: 'Sequential Waypoint Route', description: 'Ordered sequence of turns for vehicle trajectory', critical: true, satisfiedBy: ['linked-list', 'array'] }
    ],
    availableStructures: ['graph', 'priority-queue', 'hash-table', 'linked-list', 'bst', 'stack'],
    optimalStructures: ['graph', 'priority-queue', 'hash-table', 'linked-list'],
    rewardXp: 400
  },
  {
    id: 'c-l4-04',
    slug: 'ecommerce-flash-sale-engine',
    title: 'Mission 28: Flash Sale High-Concurrency Inventory Engine',
    level: 4,
    difficulty: 'Expert',
    category: 'E-Commerce',
    missionBrief: 'Black Friday flash sale: 100,000 users compete for 500 limited items. Requirements: (1) Strict FIFO request queue for fairness, (2) Instant O(1) inventory count check and stock locking, (3) Expiring reservation timers (Min-Heap to auto-release unpaid items after 10 mins), (4) Audit log of transactions.',
    requirements: [
      { id: 'r1', label: 'Fair FIFO Request Queue', description: 'Process checkout requests strictly in arrival order', critical: true, satisfiedBy: ['queue'] },
      { id: 'r2', label: 'Instant Inventory Lookup', description: 'O(1) item stock level queries and atomic locks', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r3', label: 'Reservation Expiration Min-Heap', description: 'Track next earliest reservation to expire in O(1)', critical: true, satisfiedBy: ['heap', 'priority-queue'] },
      { id: 'r4', label: 'Audit Trail', description: 'Sequential log of successful payments', critical: true, satisfiedBy: ['linked-list', 'array'] }
    ],
    availableStructures: ['queue', 'hash-table', 'heap', 'linked-list', 'bst', 'stack'],
    optimalStructures: ['queue', 'hash-table', 'heap', 'linked-list'],
    rewardXp: 400
  },
  {
    id: 'c-l4-05',
    slug: 'cloud-task-dependency-orchestrator',
    title: 'Mission 29: Cloud Workflow & DAG Dependency Orchestrator',
    level: 4,
    difficulty: 'Expert',
    category: 'DevOps & Cloud',
    missionBrief: 'Kubernetes/Airflow workflow engine executing complex build pipelines: (1) Directed Acyclic Graph (DAG) for step dependencies, (2) Topological sort and execution ready queue for unblocked tasks, (3) O(1) task status queries by UUID, (4) Call stack for nested sub-pipeline evaluation.',
    requirements: [
      { id: 'r1', label: 'Task Dependency DAG', description: 'Model prerequisites and validate no circular dependencies', critical: true, satisfiedBy: ['graph'] },
      { id: 'r2', label: 'Ready-to-Run Priority Queue', description: 'Dispatch tasks whose prerequisites have completed', critical: true, satisfiedBy: ['priority-queue', 'queue'] },
      { id: 'r3', label: 'Task UUID Index', description: 'Instant O(1) status lookup for telemetry dashboards', critical: true, satisfiedBy: ['hash-table'] },
      { id: 'r4', label: 'Sub-Pipeline Execution Stack', description: 'Manage nested recursive sub-flow frames', critical: true, satisfiedBy: ['stack'] }
    ],
    availableStructures: ['graph', 'priority-queue', 'hash-table', 'stack', 'bst', 'linked-list'],
    optimalStructures: ['graph', 'priority-queue', 'hash-table', 'stack'],
    rewardXp: 400
  }
].map(challenge => ({
  ...challenge,
  id: `optional-${challenge.id}`,
  slug: `optional-${challenge.slug}`
}));

export const INITIAL_CHALLENGES = FODS_REQUIRED_CHALLENGES;

export const INITIAL_ACHIEVEMENTS = ACHIEVEMENT_DEFINITIONS.map(({ code, name, description, icon, requirement, xpBonus }) => ({
  code, name, description, icon, requirement, xpBonus
}));

export const INITIAL_LEADERBOARD = [
  { rank: 1, id: 'u-1', name: 'Alex Rivera', avatar: 'avatar-1', title: 'Optimization Architect', level: 4, xp: 4850, score: 980, completedChallenges: 24, badgesCount: 9 },
  { rank: 2, id: 'u-2', name: 'Sarah Chen', avatar: 'avatar-2', title: 'Hybrid Designer', level: 3, xp: 3920, score: 870, completedChallenges: 20, badgesCount: 7 },
  { rank: 3, id: 'u-3', name: 'Marcus Vance', avatar: 'avatar-3', title: 'Strategist', level: 3, xp: 3450, score: 790, completedChallenges: 18, badgesCount: 6 },
  { rank: 4, id: 'u-4', name: 'Elena Rostova', avatar: 'avatar-4', title: 'Complexity Master', level: 2, xp: 2800, score: 650, completedChallenges: 15, badgesCount: 5 },
  { rank: 5, id: 'u-5', name: 'David Kim', avatar: 'avatar-5', title: 'Strategist', level: 2, xp: 2300, score: 540, completedChallenges: 12, badgesCount: 4 },
  { rank: 6, id: 'u-6', name: 'Priya Patel', avatar: 'avatar-6', title: 'Foundation Builder', level: 2, xp: 1950, score: 480, completedChallenges: 10, badgesCount: 3 },
  { rank: 7, id: 'u-7', name: 'Lucas Meyer', avatar: 'avatar-7', title: 'Novice Architect', level: 1, xp: 1200, score: 320, completedChallenges: 7, badgesCount: 2 },
  { rank: 8, id: 'u-8', name: 'Aisha Al-Mansoor', avatar: 'avatar-8', title: 'Novice Architect', level: 1, xp: 850, score: 210, completedChallenges: 5, badgesCount: 2 }
];
