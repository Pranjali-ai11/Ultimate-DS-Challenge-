import { COURSE_LESSON_DETAILS } from './courseLessonDetails.js';
import type { LessonDetails } from './courseLessonDetails.js';

export type LearningGuide = {
  scope: 'core' | 'enrichment';
  syllabus: string;
  prerequisites: string[];
  mentalModel: string;
  representation: string;
  invariant: string;
  sandboxOperations: string[];
  operationWalkthroughs: Array<{
    operation: string;
    precondition: string;
    steps: string[];
    result: string;
    cost: string;
    boundary: string;
  }>;
  workedExample: { title: string; steps: string[]; result: string; trap: string };
  complexityReasoning: string[];
  commonMistakes: string[];
  checks: Array<{ question: string; answer: string; reasoning: string }>;
};

export const STRUCTURE_LEARNING_GUIDES: Record<string, LearningGuide> = {
  array: {
    scope: 'core', syllabus: 'Required FODS topics: sequential organization, arrays, multidimensional storage, polynomials, and sparse matrices.',
    prerequisites: ['A sequence has positions and an order.', 'An index identifies a position; this guide uses zero-based indices.'],
    mentalModel: 'Numbered seats in one continuous row: a known seat number gives direct access, but opening a gap requires moving later occupants.',
    representation: 'A fixed array has a base address, length, and equal-sized contiguous elements. Address(A[i]) = base + i × elementSize for valid zero-based i. A dynamic array additionally tracks capacity and may allocate a larger block when full; resizing is not part of the fixed-array ADT.',
    invariant: 'Logical length stays between 0 and capacity; valid positions are 0…length−1. Ordered insert/delete preserves the relative order of unaffected items.',
    sandboxOperations: ['Append to end', 'Animated linear search', 'Delete tail', 'Reset'],
    operationWalkthroughs: [
      { operation: 'Read A[i]', precondition: '0 ≤ i < length.', steps: ['Check the index.', 'Compute base + i × elementSize.', 'Read that address.'], result: 'Read one value without scanning earlier entries.', cost: 'Θ(1) time and Θ(1) extra space.', boundary: 'Index −1 or index=length is invalid.' },
      { operation: 'Insert at index k', precondition: '0 ≤ k ≤ length and a free slot exists (or resizing is allowed).', steps: ['Shift k…length−1 one place right, from right to left.', 'Write the new item at k.', 'Increase length.'], result: '[10,20,30], insert 15 at 1 → [10,15,20,30].', cost: 'Θ(n−k) moves, worst Θ(n). Dynamic append is amortized Θ(1), but one resize is Θ(n).', boundary: 'At k=length no old item moves. A full fixed array overflows.' },
      { operation: 'Delete at index k', precondition: '0 ≤ k < length.', steps: ['Save A[k] if needed.', 'Shift k+1…length−1 one place left.', 'Decrease length.'], result: '[10,20,30], delete 1 → [10,30].', cost: 'Θ(n−k−1) moves, worst Θ(n); Θ(1) extra space in place.', boundary: 'Tail deletion moves no other items; empty deletion is invalid.' },
      { operation: 'Linear search', precondition: 'No ordering assumption.', steps: ['Compare from index 0.', 'Stop at first match or continue sequentially.', 'Report absent after the last comparison.'], result: 'Search 30 in [10,20,30] uses 3 comparisons; search 5 reports absent after 3.', cost: 'Best Θ(1), average/worst Θ(n) for unsorted input; Θ(1) extra space.', boundary: 'Duplicates return the first match. Binary search requires sorted input.' }
    ],
    workedExample: { title: 'Row-major address and a shifting insert', steps: ['For A[2][3] in a 3×4 zero-based row-major array, offset = 2×4+3 = 11.', 'With 4-byte elements and base 1000, address = 1000+11×4 = 1044.', 'Insert at index 1 into [10,20,30]: move 30, then 20, then write 15.'], result: 'Address 1044; updated sequence [10,15,20,30].', trap: 'Row-major stride is the number of columns. State index origin, dimensions, and element size.' },
    complexityReasoning: ['Index access is constant because one address calculation suffices.', 'Insert/delete depend on the number of shifted elements, not just operation name.', 'In-place shifts use Θ(1) auxiliary space; storing n items uses Θ(n) total space.'],
    commonMistakes: ['Confusing capacity and current length.', 'Shifting in the wrong direction and overwriting values.', 'Claiming every dynamic-array append is worst-case O(1).', 'Using binary search on unsorted input or the wrong address stride.'],
    checks: [
      { question: 'How many items move to insert at k=2 into length 5?', answer: 'Three.', reasoning: 'Indices 2, 3, and 4 shift right: Θ(n−k).'},
      { question: 'Column-major offset of A[2][1] in a zero-based 3×4 array?', answer: '5 elements.', reasoning: 'column×rows+row = 1×3+2; multiply by element size for bytes.'}
    ]
  },
  'linked-list': {
    scope: 'core', syllabus: 'Required FODS topics: dynamic allocation; singly, doubly, circular, and doubly circular lists; list operations; polynomial lists and GLL.',
    prerequisites: ['A reference identifies an object location, not its value.', 'A node stores data and links to other nodes.'],
    mentalModel: 'A chain of labeled boxes. Each box stores a value and where the next box is; splicing is cheap once found, but finding a position means walking the chain.',
    representation: 'Singly node=(value,next); doubly node=(value,prev,next). Head identifies the first node; an optional tail identifies the last. Circular tail.next=head; a doubly circular list also has head.prev=tail.',
    invariant: 'Every reachable node is visited once in a linear traversal; linear tail.next=null, circular tail.next=head, and doubly linked neighbors point back consistently. Empty lists have no head or tail.',
    sandboxOperations: ['Prepend', 'Append', 'Delete head', 'Reset'],
    operationWalkthroughs: [
      { operation: 'Prepend', precondition: 'Allocation succeeds.', steps: ['Allocate x with the new value.', 'Set x.next to old head.', 'Set head=x; if empty, also set tail=x.'], result: '10→20→30 becomes 5→10→20→30.', cost: 'Θ(1) time and auxiliary space excluding allocation.', boundary: 'Empty list: new node becomes both endpoints.' },
      { operation: 'Append with tail', precondition: 'Allocation succeeds; list maintains a tail reference.', steps: ['Set newNode.next=null.', 'Link old tail to it, or set head if empty.', 'Set tail=newNode.'], result: '10→20 becomes 10→20→30.', cost: 'Θ(1) with maintained tail; Θ(n) without tail.', boundary: 'For circular lists, reconnect tail to head; initialize both endpoints if empty.' },
      { operation: 'Delete a node', precondition: 'Target or predecessor is known.', steps: ['Singly: predecessor.next=target.next.', 'Doubly: update both adjacent links.', 'Update head/tail if needed and release node when required.'], result: '10→20→30, remove 20 → 10→30.', cost: 'Θ(1) rewiring if position known; Θ(n) including search.', boundary: 'Deleting the only node empties both endpoints. A singly list cannot find predecessor from target alone.' },
      { operation: 'Search', precondition: 'Start from head.', steps: ['Compare current value.', 'Stop on match.', 'Otherwise follow next until end.'], result: 'Search 30 in 10→20→30 takes 3 visits.', cost: 'Best Θ(1), worst Θ(n), iterative auxiliary Θ(1).', boundary: 'Circular traversal stops when it returns to head, not at null.' }
    ],
    workedExample: { title: 'Delete head including singleton case', steps: ['For 10→20→30 save old head, set head=head.next (20), detach old head.', 'For 10→null, head becomes null and tail must also become null.'], result: 'Remaining nodes stay reachable and endpoint references agree.', trap: 'Updating head without tail in a one-node list leaves a stale tail; losing oldHead.next can orphan the list.' },
    complexityReasoning: ['Known-node rewiring changes a constant number of references.', 'Finding an index takes Θ(n); lists do not provide array random access.', 'Storage is Θ(n) values plus Θ(n) links; recursive traversal can use Θ(n) call-stack space.'],
    commonMistakes: ['Calling arbitrary-index insertion O(1) while ignoring lookup.', 'Forgetting endpoints for empty/singleton states.', 'Updating only one direction in doubly linked lists.', 'Using null as circular-list termination.'],
    checks: [
      { question: 'Is deleting a value O(1) in a singly linked list?', answer: 'Only if position/predecessor is already known; otherwise worst Θ(n).', reasoning: 'Rewiring is cheap; finding the node is not.' },
      { question: 'What changes when deleting the only node?', answer: 'Both head and tail become null.', reasoning: 'No first or last node remains.'}
    ]
  },
  stack: {
    scope: 'core', syllabus: 'Required FODS topics: stack ADT, sequential/linked representation, multiple stacks, expressions, recursion, and backtracking.',
    prerequisites: ['Operations can be restricted to one end.', 'Bounded structures can be full; all structures can be empty.'],
    mentalModel: 'A stack of plates: only the top is directly available. Last pushed is first popped (LIFO).',
    representation: 'An array implementation tracks a top index (often −1 when empty); a linked implementation tracks a top node. A fixed array can be full; a linked stack depends on allocation.',
    invariant: 'Top is the most recently pushed item. Pop removes exactly it; the lower items keep their order.',
    sandboxOperations: ['Push frame', 'Pop top frame', 'Reset'],
    operationWalkthroughs: [
      { operation: 'Push(x)', precondition: 'Capacity exists or allocation succeeds.', steps: ['Check overflow if fixed.', 'Increase top or link a node above old top.', 'Store x at the new top.'], result: 'A,B then push C → top-to-bottom C,B,A.', cost: 'Θ(1); dynamic-array resize can make one push Θ(n), amortized Θ(1).', boundary: 'Fixed full stack overflows; push on empty is valid.' },
      { operation: 'Pop()', precondition: 'Stack is non-empty.', steps: ['Save top item.', 'Move top down or unlink node.', 'Return the saved item.'], result: 'C,B,A pops C and leaves B,A.', cost: 'Θ(1) time and extra space.', boundary: 'Empty pop is underflow.' },
      { operation: 'Peek()', precondition: 'Stack is non-empty.', steps: ['Read top item.', 'Do not move top or links.'], result: 'Peek C leaves C,B,A unchanged.', cost: 'Θ(1).', boundary: 'Empty peek needs a defined error/optional result.' }
    ],
    workedExample: { title: 'Evaluate postfix 5 2 3 * +', steps: ['Push 5 → [5].', 'Push 2, push 3 → [5,2,3].', 'For *, pop right=3 then left=2; push 6 → [5,6].', 'For +, pop right=6 then left=5; push 11.'], result: '11; a valid expression leaves exactly one value.', trap: 'For subtraction/division, reverse pop order changes the answer.' },
    complexityReasoning: ['Push/pop/peek touch only the top: Θ(1), except occasional dynamic-array resize.', 'Searching an arbitrary item may examine n items.', 'Storage is Θ(n); recursive call frames also use stack space.'],
    commonMistakes: ['Confusing top and bottom.', 'Treating peek as removal.', 'Ignoring underflow/overflow.', 'Reversing operand order or ignoring operator associativity.'],
    checks: [
      { question: 'Push 4, push 7, pop, push 9; what is next pop?', answer: '9.', reasoning: 'It was most recently pushed.' },
      { question: 'Postfix 8 2 − gives what?', answer: '6.', reasoning: 'Pop right=2 and left=8; compute left−right.'}
    ]
  },
  queue: {
    scope: 'core', syllabus: 'Required FODS topics: queue ADT, sequential/circular/linked queues, multiple queues, deques, and priority queues.',
    prerequisites: ['A sequence has arrival order.', 'Front and rear identify queue endpoints.'],
    mentalModel: 'A service line: join at rear, leave at front; FIFO preserves arrival order.',
    representation: 'A naive array may waste freed prefix slots; a circular array reuses them with modulo arithmetic. A linked queue keeps front and rear node references.',
    invariant: 'Dequeue removes the oldest waiting item. Empty linked queue has front=rear=null; singleton has front=rear at the same node.',
    sandboxOperations: ['Enqueue rear', 'Dequeue front', 'Reset'],
    operationWalkthroughs: [
      { operation: 'Enqueue(x)', precondition: 'Bounded queue has space or node allocation succeeds.', steps: ['Check full condition.', 'Write at rear or link after rear.', 'Advance rear; circular array uses (rear+1) mod capacity.'], result: 'A,B then enqueue C keeps A at front and C at rear.', cost: 'Θ(1) with circular indices or linked endpoints; resize may cost Θ(n).', boundary: 'When empty, new item is both front and rear; bounded full queue overflows.' },
      { operation: 'Dequeue()', precondition: 'Queue is non-empty.', steps: ['Save front item.', 'Advance front or unlink first node.', 'If now empty, synchronize rear/empty markers.'], result: 'A,B,C dequeues A and leaves B,C.', cost: 'Θ(1) with suitable circular or linked representation; shifting array is Θ(n).', boundary: 'Empty dequeue underflows; removing the last node resets both endpoints.' },
      { operation: 'Wrap circular index', precondition: 'Capacity m>0 and a full/empty convention is defined.', steps: ['Advance with (index+1) mod m.', 'Reuse freed slots after wrap.', 'Use count, reserved slot, or flag to distinguish full/empty.'], result: 'With capacity 5, index 4 advances to 0.', cost: 'Θ(1).', boundary: 'front==rear alone can be ambiguous.' }
    ],
    workedExample: { title: 'Circular queue reuse', steps: ['Capacity 5; enqueue A,B,C into slots 0,1,2.', 'Dequeue A,B; C remains at front slot 2.', 'Enqueue D,E,F to slots 3,4,0.'], result: 'Logical order C,D,E,F wraps across the array boundary.', trap: 'Physical index order is not logical queue order after wrap-around.' },
    complexityReasoning: ['Enqueue/dequeue can be Θ(1) with maintained endpoints; a shifting-array dequeue is Θ(n).', 'Total queue storage is Θ(n); capacity may exceed item count.', 'State full/empty convention before tracing a circular array.'],
    commonMistakes: ['Removing rear instead of front.', 'Using front==rear for both full and empty without a rule.', 'Leaving stale rear after final linked dequeue.', 'Claiming array slice/copy implementation is constant-time.'],
    checks: [
      { question: 'Enqueue A,B,C; dequeue twice; enqueue D. Order?', answer: 'C,D.', reasoning: 'A and B leave first; D joins behind C.' },
      { question: 'Why use modulo capacity?', answer: 'It wraps rear to index zero and reuses freed slots.', reasoning: 'No shift is required.'}
    ]
  },
  'priority-queue': {
    scope: 'core', syllabus: 'Required FODS topics: priority queue ADT, ascending and descending types.',
    prerequisites: ['A normal queue orders by arrival.', 'State whether smaller or larger priority values mean more urgent.'],
    mentalModel: 'Triage serves by urgency, not arrival. Tie order is a separate policy.',
    representation: 'A priority queue is an ADT, not a required implementation. Unsorted array: cheap insert, scan to extract. Sorted array: shift on insert, cheap extract. A binary heap is a common optional implementation; this sandbox uses an array-backed min-heap and priority 1 is most urgent.',
    invariant: 'Extraction returns an item with best priority under the declared convention. In this min-heap demo, parent priority ≤ child priority.',
    sandboxOperations: ['Insert priority 1…5', 'Extract minimum', 'Reset'],
    operationWalkthroughs: [
      { operation: 'Insert in binary min-heap', precondition: 'Priority convention and tie policy are known.', steps: ['Append at end.', 'Compare to parent.', 'Swap upward while numerically smaller.'], result: 'Insert priority 1 into [2,4,5] → one valid layout [1,2,5,4].', cost: 'Heap Θ(log n); unsorted array Θ(1); sorted-array insertion Θ(n).', boundary: 'Equal priorities do not need swapping; course also distinguishes ascending/descending types.' },
      { operation: 'Extract top', precondition: 'Queue is non-empty.', steps: ['Save root.', 'Move last item to root.', 'Swap down with smaller-priority child until ordered.'], result: 'Smallest numeric priority leaves first.', cost: 'Heap Θ(log n); unsorted array Θ(n); sorted array can extract Θ(1).', boundary: 'One item becomes empty; empty extraction underflows.' }
    ],
    workedExample: { title: 'Ascending versus descending priority', steps: ['If 1=critical and 5=routine, ascending priority serves 1 first.', 'If 100 is the most urgent score, descending order serves 100 first.', 'Insertion order does not determine extraction.'], result: 'State the direction before tracing.', trap: '“Highest” priority is not always numerically largest.' },
    complexityReasoning: ['Operation costs belong to the chosen representation, not the ADT alone.', 'A heap gives Θ(log n) insert/extract and Θ(1) peek; arbitrary search remains Θ(n) without an index.', 'Heap representation is enrichment; priority queues themselves are syllabus core.'],
    commonMistakes: ['Assuming a priority queue is FIFO.', 'Not specifying numeric direction.', 'Assuming every priority queue is a heap.', 'Assuming equal-priority stability without a tie rule.'],
    checks: [
      { question: 'With 1 most urgent, who leaves first: (A,4),(B,1),(C,2)?', answer: 'B.', reasoning: 'Priority overrides arrival order.' },
      { question: 'Does the ADT guarantee O(log n) insertion?', answer: 'No.', reasoning: 'Complexity depends on implementation.'}
    ]
  },
  heap: {
    scope: 'enrichment', syllabus: 'Optional enrichment; heaps are not named in the required FODS units.',
    prerequisites: ['Know complete binary-tree shape.', 'Know zero-based indexing.'],
    mentalModel: 'A tournament whose root holds the minimum (min-heap) or maximum (max-heap). The remainder is not fully sorted.',
    representation: 'At zero-based index i: parent=floor((i−1)/2), left=2i+1, right=2i+2. Completeness fills levels left-to-right, so shape is implicit in the array.',
    invariant: 'Min-heap parent key ≤ child keys; this guarantees a minimum root, not sorted siblings.',
    sandboxOperations: ['Insert and sift up', 'Extract minimum and sift down', 'Reset'],
    operationWalkthroughs: [
      { operation: 'Insert', precondition: 'Storage can grow.', steps: ['Append at end.', 'Compare with parent.', 'Swap up until parent≤key or root.'], result: '[2,5,4], insert 1 → [1,2,4,5].', cost: 'Θ(log n) swaps; one backing-array resize can be Θ(n).', boundary: 'Root has no parent; equal keys satisfy min-heap order.' },
      { operation: 'Extract minimum', precondition: 'Non-empty heap.', steps: ['Save root.', 'Move last item to root and shorten array.', 'Swap with smaller child until ordered.'], result: '[1,3,2,7,6] → extract 1; valid remainder [2,3,6,7].', cost: 'Θ(log n); bottom-up build-heap is Θ(n).', boundary: 'Handle empty, singleton, and one-left-child cases.' }
    ],
    workedExample: { title: 'Sift down', steps: ['Replace removed root 1 by last item 6: [6,3,2,7].', 'Compare children 3 and 2; swap with 2 → [2,3,6,7].'], result: 'Heap order is restored.', trap: 'Swap with the smaller child for a min-heap.' },
    complexityReasoning: ['Complete tree height is Θ(log n); sift moves at most one level per step.', 'Arbitrary search may inspect Θ(n) nodes because heap order does not sort siblings.', 'Storage is Θ(n) array cells.'],
    commonMistakes: ['Treating a heap as sorted.', 'Wrong parent/child index arithmetic.', 'Sifting with the wrong child.', 'Calling insert/extract O(1).'],
    checks: [
      { question: 'Does [1,4,2,9,7] satisfy min-heap order?', answer: 'Yes.', reasoning: '1≤4,2 and 4≤9,7; sibling order is irrelevant.' },
      { question: 'Can next-smallest always be read at index 1?', answer: 'No.', reasoning: 'It is the smaller root child, at index 1 or 2.'}
    ]
  },
  bst: {
    scope: 'enrichment', syllabus: 'Optional enrichment; BST and self-balancing trees are not named in required FODS units.',
    prerequisites: ['Know binary tree nodes with left/right references.', 'Know comparison search.'],
    mentalModel: 'At each node, a comparison sends you left for smaller keys or right for larger keys. Speed depends on height.',
    representation: 'Nodes store keys and left/right child references. This sandbox rejects duplicates and has no rotations or self-balancing.',
    invariant: 'All keys in left subtree are smaller; all keys in right subtree are larger. In-order traversal therefore visits ascending keys.',
    sandboxOperations: ['Insert integer key', 'Ignore duplicate keys', 'View live in-order traversal', 'Reset'],
    operationWalkthroughs: [
      { operation: 'Insert', precondition: 'Input is an integer; duplicates are rejected.', steps: ['Start at root.', 'Compare and choose left or right.', 'Repeat to a null child and attach leaf.'], result: 'Insert 40,20,60,30: 40 root; 20 left; 60 right; 30 right of 20.', cost: 'Θ(h): Θ(log n) if balanced-shaped, Θ(n) if skewed.', boundary: 'Empty tree makes new key root; equal key is rejected.' },
      { operation: 'In-order traversal', precondition: 'Links are valid.', steps: ['Traverse left.', 'Visit node.', 'Traverse right.'], result: 'Example visits 20,30,40,60.', cost: 'Θ(n) time; Θ(h) recursive stack space.', boundary: 'Empty subtree contributes no output.' }
    ],
    workedExample: { title: 'Sorted input can create a slow tree', steps: ['Insert 10,20,30,40 in order.', 'Every new key follows the right link.', 'The resulting height is 4.'], result: 'Search is Θ(n), not Θ(log n).', trap: 'This sandbox does not implement AVL/red-black balancing or deletion.' },
    complexityReasoning: ['Cost is height h: balanced-shaped Θ(log n), skewed Θ(n).', 'In-order traversal must visit all n nodes.', 'Total stored nodes and links use Θ(n) space.'],
    commonMistakes: ['Claiming all BST operations are logarithmic.', 'Checking only immediate children rather than whole subtrees.', 'Claiming delete or balancing controls exist.', 'Calling traversal O(log n).'],
    checks: [
      { question: 'Worst-case search in a BST formed by ascending inserts?', answer: 'Θ(n).', reasoning: 'The tree becomes a chain.' },
      { question: 'What does in-order traversal return?', answer: 'Ascending key order.', reasoning: 'Left, root, then right follows the BST ordering.'}
    ]
  },
  'hash-table': {
    scope: 'enrichment', syllabus: 'Optional enrichment; hashing is not named in required FODS units.',
    prerequisites: ['Keys identify records.', 'Array buckets have bounded indices.'],
    mentalModel: 'A filing rule sends a key to a drawer. Different keys may land in one drawer; collision handling keeps them distinct.',
    representation: 'The demo has 8 buckets, separate chaining, and a teaching hash: sum character codes modulo 8. It demonstrates collisions, not production hashing.',
    invariant: 'Each key is in its selected bucket; putting the same key updates its value instead of adding a duplicate.',
    sandboxOperations: ['Store or update a non-empty key/value', 'See the highlighted bucket and collision chain', 'Reset'],
    operationWalkthroughs: [
      { operation: 'Put(key,value)', precondition: 'Key and value are non-empty.', steps: ['Sum key character codes.', 'Compute sum mod 8.', 'Scan bucket: update same key or append a pair.'], result: 'Different keys with same remainder share a chain.', cost: 'Hash computation Θ(L); expected bucket lookup Θ(1+α) under distribution assumptions, worst Θ(n). This UI copies buckets in Θ(n).', boundary: 'Blank input rejected; a collision does not overwrite a different key.' }
    ],
    workedExample: { title: 'Collision is not data loss', steps: ['“ab” has sum 195; 195 mod 8=3.', '“ba” has the same sum and goes to bucket 3.', 'Chaining keeps both pairs in bucket 3.'], result: 'Both keys remain distinguishable.', trap: 'This weak additive demo hash is not for passwords, security tokens, or production.' },
    complexityReasoning: ['Average constant lookup assumes distribution and controlled load factor α=n/capacity.', 'Worst-case one chain has Θ(n) comparisons.', 'Storage is Θ(n+capacity); rehashing may take Θ(n).'],
    commonMistakes: ['Assuming hashes are unique.', 'Claiming unconditional O(1).', 'Expecting sorted order.', 'Treating a demo hash as secure.'],
    checks: [
      { question: 'Two keys map to bucket 3. What must the table do?', answer: 'Store and distinguish both using its collision policy.', reasoning: 'A bucket is not a unique key identity.' },
      { question: 'Is average O(1) lookup a worst-case bound?', answer: 'No.', reasoning: 'Collision-heavy buckets can require Θ(n).'}
    ]
  },
  graph: {
    scope: 'enrichment', syllabus: 'Optional enrichment; graphs are not named in required FODS units. This sandbox demonstrates BFS only.',
    prerequisites: ['Vertices are entities; edges are relationships.', 'BFS uses a FIFO queue.'],
    mentalModel: 'A map of places and roads. Breadth-first search visits close places before places farther away in number of links.',
    representation: 'The fixed graph is undirected and stores each edge in both adjacency lists. Displayed travel-time labels are illustrative; BFS ignores weights.',
    invariant: 'BFS marks a vertex visited when enqueued, so it enters the queue once. Queue order processes nondecreasing unweighted distance from start.',
    sandboxOperations: ['Run BFS from A', 'Reset traversal', 'No edit, DFS, or weighted shortest-path controls'],
    operationWalkthroughs: [
      { operation: 'BFS from A', precondition: 'Start exists; fixed demo starts at A.', steps: ['Mark/enqueue A.', 'Dequeue a vertex and inspect neighbors.', 'Mark each unseen neighbor before enqueueing.', 'Stop when queue empties.'], result: 'With displayed neighbor order, visit A,B,C,D,E.', cost: 'Θ(V+E) adjacency lists; Θ(V²) adjacency matrix; Θ(V) visited/queue space.', boundary: 'Disconnected vertices are not reached. Weights do not determine BFS order.' }
    ],
    workedExample: { title: 'Trace the demo queue', steps: ['Start [A]; remove A, discover B,C → [B,C].', 'Remove B, discover D → [C,D].', 'Remove C; D already seen, discover E → [D,E].', 'Remove D,E; stop.'], result: 'Order A,B,C,D,E.', trap: 'BFS minimizes edge count in unweighted graphs, not total weight for differently weighted edges.' },
    complexityReasoning: ['Each vertex is enqueued once and each adjacency entry examined once.', 'Animation delay is presentation, not algorithm cost.', 'The SVG graph is fixed, not an editable graph model.'],
    commonMistakes: ['Marking visited only after dequeue, allowing duplicates.', 'Claiming displayed weights affect BFS.', 'Assuming all vertices are reachable.', 'Claiming DFS or Dijkstra controls exist.'],
    checks: [
      { question: 'Why mark on enqueue?', answer: 'To prevent another edge enqueueing the same vertex.', reasoning: 'Each vertex should be processed once.' },
      { question: 'Does BFS find minimum-weight paths with different edge weights?', answer: 'Not in general.', reasoning: 'BFS minimizes number of edges; weighted shortest path is not implemented.'}
    ]
  }
};

export type CourseTopic = LessonDetails & { title: string; explanation: string; workedSteps: string[]; result: string; pitfalls: string[]; check: string; answer: string; comparison?: Array<{ method: string; condition: string; best: string; average: string; worst: string; stable: string; extraSpace: string }> };
export type CourseUnit = { id: string; title: string; outcome: string; topics: CourseTopic[] };

const BASE_FODS_COURSE_UNITS = [
  {
    id: 'unit-1', title: 'Unit I — Algorithms and data structures',
    outcome: 'Move from a problem to an algorithm, select a representation, and justify efficiency under stated assumptions.',
    topics: [
      { title: 'Data, information, knowledge, ADT, and classifications', explanation: 'Data are recorded values; information is data interpreted in context; knowledge is usable understanding derived from information. A data structure organizes data. An ADT specifies values and operations without fixing representation. Linear/non-linear describe relationships; static/dynamic describe allocation or size behavior; persistent/ephemeral describe whether old versions survive updates.', workedSteps: ['A queue ADT promises enqueue at rear and dequeue at front.', 'An array or linked representation can implement that behavior.', 'The contract stays the same while representation and cost differ.'], result: 'Separate what an ADT promises from how it is stored.', pitfalls: ['Calling an array the only possible ADT representation.', 'Confusing static/dynamic allocation with linear/non-linear relationships.'], check: 'Can one ADT have multiple representations?', answer: 'Yes; behavior can match while operation costs differ.' },
      { title: 'Algorithm design, pseudocode, flowcharts, correctness', explanation: 'An algorithm is a finite, unambiguous set of steps mapping valid inputs to required output. Pseudocode and flowcharts communicate before choosing a language. State assumptions, termination, and a loop invariant.', workedSteps: ['Find maximum in non-empty list.', 'Set best to first item.', 'For each remaining item, replace best only if current is larger.', 'Return best.'], result: 'After each prefix, best is that prefix’s maximum; after the last item it is the full maximum.', pitfalls: ['Initializing to zero fails if all values are negative.', 'Empty input needs a specified behavior.'], check: 'What invariant justifies the maximum algorithm?', answer: 'best is the maximum of all values processed so far.' },
      { title: 'Time, space, asymptotic notation, step counting', explanation: 'Time counts primitive work as input n grows. Auxiliary space is temporary storage; total space also includes input/output. O is an upper bound, Ω a lower bound, Θ a tight bound. A bound needs an input model and case; Big-O does not automatically mean worst-case.', workedSteps: ['One constant-work loop of n iterations: n steps → Θ(n).', 'Two nested loops each run n times: n×n → Θ(n²).', 'Three nested n-loops: n³ iterations → Θ(n³).', 'Repeatedly halve n until 1: k≈log₂n → Θ(log n).'], result: 'Linear, quadratic, cubic, and logarithmic constructs grow differently; count loop executions before simplifying.', pitfalls: ['Ignoring actual loop bounds.', 'Treating all operations as equal without stating the step model.', 'Ignoring recursive call-stack space.'], check: 'How many iterations does repeated halving take?', answer: 'Θ(log n), since each step reduces the remaining size by a constant factor.' },
      { title: 'Divide-and-conquer and greedy methods', explanation: 'Divide-and-conquer splits, solves subproblems, and combines results. Greedy chooses locally according to a rule; correctness requires proof that the choice can belong to an optimum. A plausible choice is not itself a proof.', workedSteps: ['For unweighted compatible activities, sort by finish time.', 'Choose the compatible activity finishing earliest.', 'Discard overlapping activities and repeat.'], result: 'The earliest finish leaves the largest remaining time for this specific unweighted objective.', pitfalls: ['Assuming every locally best choice is globally best.', 'Applying unweighted interval reasoning to weighted activities.'], check: 'Does earliest-finish automatically solve weighted scheduling?', answer: 'No; weights change the objective and the rule is not generally optimal.' }
    ]
  },
  {
    id: 'unit-2', title: 'Unit II — Arrays, polynomials, and sparse matrices',
    outcome: 'Trace array operations and address calculations, and explain polynomial and sparse representations.',
    topics: [
      { title: 'Array ADT and ordered operations', explanation: 'Traversal visits occupied positions; search finds values; update replaces; insert opens a slot; delete closes a gap; merge combines ordered sequences. Insert/delete costs include shifted elements.', workedSteps: ['A=[2,5,9], insert 7 at index 2.', 'Shift 9 right.', 'Write 7 and increase logical length.'], result: '[2,5,7,9]. Cost Θ(n−k) shifts.', pitfalls: ['Shifting the wrong direction.', 'Confusing capacity with length.'], check: 'Worst-case insert at front?', answer: 'Θ(n) because all existing elements may move.' },
      { title: 'Row-major/column-major address calculations', explanation: 'State index origin, dimensions, base, element size, and storage order. For zero-based R×C: row-major offset=rC+c; column-major offset=cR+r; byte address=base+offset×elementSize.', workedSteps: ['3×4 A[2][1]: row-major offset 2×4+1=9.', 'Column-major offset 1×3+2=5.', 'With base 100 and 2-byte elements, addresses are 118 and 110.'], result: 'Same logical element, different memory offset.', pitfalls: ['Using rows as the row-major stride.', 'Forgetting index origin or element byte size.'], check: 'What is the row-major stride?', answer: 'Number of columns.' },
      { title: 'Polynomial array/structure representation', explanation: 'Dense coefficient arrays use index as exponent and store zeros. Term lists store (coefficient, exponent) and can suit sparse exponents. Addition combines equal exponents; multiplication pairs terms, multiplies coefficients, adds exponents, then combines equal exponents.', workedSteps: ['(2x²+3)+(x²−1).', 'At x² add 2+1=3; at x⁰ add 3−1=2.'], result: '3x²+2.', pitfalls: ['Adding unlike exponents.', 'Forgetting to add exponents during multiplication.'], check: 'What is (2x²)(3x³)?', answer: '6x⁵.' },
      { title: 'Sparse triplets, addition, and transpose', explanation: 'Triplets store dimensions, nonzero count, then (row,column,value), commonly row-major sorted. Addition merges coordinate-sorted terms in Θ(tA+tB) time. Simple transpose scans each of C columns and all t terms: Θ(Ct) time and Θ(t) output space. Fast transpose counts terms per column, prefix-sums starting positions, then places each term once: Θ(C+t) time and Θ(C+t) auxiliary/output space. These bounds assume the usual triplet representation.', workedSteps: ['A is 3×3 with (0,2,4),(2,0,7).', 'For original column 0, emit the term (2,0,7) with row/column swapped: (0,2,7).', 'Column 1 has no terms; column 2 emits (0,2,4) as (2,0,4).', 'Both simple and fast transpose produce row-major triplets (0,2,7),(2,0,4).'], result: 'Transpose swaps row/column and sorts output by its new row; only nonzeros are stored.', pitfalls: ['Swapping coordinates but leaving output unsorted.', 'Mixing matrix column count with nonzero count in the complexity.', 'Keeping a term whose sum is zero.'], check: 'What if equal coordinates sum to zero?', answer: 'Omit the term in a nonzero-only representation.' }
    ]
  },
  {
    id: 'unit-3', title: 'Unit III — Searching and sorting',
    outcome: 'Trace the named algorithms and compare assumptions, stability, passes, and complexity.',
    topics: [
      { title: 'Linear, sentinel, binary, Fibonacci, indexed-sequential search', explanation: 'Linear checks in order and needs no sorted input. Sentinel places a target in a safe terminal slot to reduce boundary checks, then restores overwritten data. Binary halves a sorted range; Fibonacci uses Fibonacci-sized probes on sorted input. Indexed-sequential uses an index to choose a block then searches within it; cost depends on block/index design.', workedSteps: ['Binary search [2,5,8,12,16] for 12.', 'Mid 8: keep [12,16].', 'Next mid 12: found in two comparisons.', 'For indexed-sequential search with block size b and a binary-searched directory, first find one of about n/b blocks, then scan at most b items.'], result: 'Discarding half is justified only by sorted order; indexed-search cost depends on the directory and block design.', pitfalls: ['Binary/Fibonacci on unsorted input.', 'Not restoring sentinel-overwritten data.', 'Stating indexed-sequential cost without its design assumptions.'], check: 'What allows binary search to discard half?', answer: 'Sorted order proves the target cannot be in the discarded half.', comparison: [
        { method: 'Linear', condition: 'Unsorted or sorted; scan in order', best: 'Θ(1)', average: 'Θ(n)', worst: 'Θ(n)', stable: 'N/A', extraSpace: 'Θ(1)' },
        { method: 'Sentinel linear', condition: 'Writable guard slot or equivalent boundary scheme', best: 'Θ(1)', average: 'Θ(n)', worst: 'Θ(n)', stable: 'N/A', extraSpace: 'Θ(1)' },
        { method: 'Binary', condition: 'Sorted random-access sequence', best: 'Θ(1)', average: 'Θ(log n)', worst: 'Θ(log n)', stable: 'N/A', extraSpace: 'Θ(1) iterative' },
        { method: 'Fibonacci', condition: 'Sorted sequence and valid Fibonacci probe bounds', best: 'Θ(1)', average: 'Θ(log n)', worst: 'Θ(log n)', stable: 'N/A', extraSpace: 'Θ(1) iterative' },
        { method: 'Indexed sequential', condition: 'Sorted blocks; directory binary-searched; block size b', best: 'Directory hit + short scan', average: 'Design-dependent', worst: 'Θ(log(n/b)+b)', stable: 'N/A', extraSpace: 'Θ(n/b) directory' }
      ] },
      { title: 'Bubble, insertion, selection', explanation: 'Bubble swaps adjacent out-of-order items; optimized bubble stops after a no-swap pass. Insertion grows a sorted prefix by shifting larger items; strict-greater shifting is stable. Selection selects the minimum remaining item per pass; ordinary swap selection is not stable.', workedSteps: ['Bubble [5,1,4]: pass 1 compares 5/1 then 5/4 → [1,4,5].', 'Pass 2 makes no swap, so optimized bubble stops.', 'Insertion [5,2,4]: insert 2 → [2,5,4]; insert 4 → [2,4,5].', 'Selection [64,25,12,22]: after selecting minima, [12,25,64,22] → [12,22,64,25] → [12,22,25,64].'], result: 'Insertion adapts to nearly sorted data; selection still scans the suffix every pass. Bubble has at most n−1 passes; optimized bubble may stop earlier.', pitfalls: ['Confusing passes and comparisons.', 'Calling ordinary selection stable.', 'Ignoring equal-key order in stability checks.'], check: 'Which method scans for one minimum per pass?', answer: 'Selection sort; comparisons remain Θ(n²).', comparison: [
        { method: 'Bubble (early stop)', condition: 'Adjacent swaps; stop after no-swap pass', best: 'Θ(n)', average: 'Θ(n²)', worst: 'Θ(n²)', stable: 'Yes, if equal keys are not swapped', extraSpace: 'Θ(1)' },
        { method: 'Insertion', condition: 'Insert next item into sorted prefix', best: 'Θ(n)', average: 'Θ(n²)', worst: 'Θ(n²)', stable: 'Yes, with strict-greater shifts', extraSpace: 'Θ(1)' },
        { method: 'Selection (swap form)', condition: 'Select minimum from unsorted suffix', best: 'Θ(n²)', average: 'Θ(n²)', worst: 'Θ(n²)', stable: 'Usually no', extraSpace: 'Θ(1)' }
      ] },
      { title: 'Quick sort and Shell sort', explanation: 'Quick sort partitions around a pivot and recursively sorts partitions: average/balanced Θ(n log n), worst Θ(n²); trace needs a named partition rule. Shell sort performs insertion-like passes with decreasing gaps ending at 1; cost depends on the gap sequence.', workedSteps: ['Use Lomuto partition with the last item as pivot on [4,1,3,2]; pivot=2, i starts at −1.', 'Scan 4: no swap. Scan 1: swap it into the left partition → [1,4,3,2], i=0. Scan 3: no swap.', 'Swap pivot 2 with A[i+1]=4 → [1,2,3,4]; pivot index 1.', 'Recurse on [1] and [3,4].', 'Shell sort [8,3,7,4] with gaps 2 then 1: gap-2 [7,3,8,4], then gap-1 [3,4,7,8].'], result: 'Always state pivot/partition and gap sequence; different valid conventions produce different intermediate states.', pitfalls: ['Claiming quicksort always Θ(n log n).', 'Giving a quicksort trace without pivot/partition rule.', 'Claiming one universal Shell bound.'], check: 'Worst-case quicksort with repeatedly unbalanced partitions?', answer: 'Θ(n²).', comparison: [
        { method: 'Quicksort', condition: 'Comparison sort; pivot/partition strategy stated', best: 'Θ(n log n)', average: 'Θ(n log n)', worst: 'Θ(n²)', stable: 'Usually no', extraSpace: 'Θ(log n) average recursion; Θ(n) worst' },
        { method: 'Shell sort', condition: 'Gap sequence ends with 1; costs depend on sequence', best: 'Sequence-dependent', average: 'Sequence-dependent', worst: 'For halving gaps, O(n²) conservative bound', stable: 'No', extraSpace: 'Θ(1)' }
      ] },
      { title: 'Counting, radix, bucket; internal/external sorting', explanation: 'Counting sort counts keys in a bounded range; radix sorts digits using a stable sub-sort; bucket distributes values into ranges and sorts within buckets. Costs depend on range k, digit count d/base b, distribution, and bucket sub-sort. Internal fits working data in main memory; external sorting uses external storage and block transfers.', workedSteps: ['Counting [2,1,2] over keys 0…2 gives counts [0,1,2].', 'Emit by frequency → [1,2,2].', 'For LSD radix, stable-sort by ones then tens so equal current digits retain prior order.', 'Bucket sort is expected-linear only under a favorable distribution and suitable bucket sort.'], result: 'Non-comparison methods rely on their input assumptions.', pitfalls: ['Ignoring k in counting sort.', 'Using unstable LSD digit passes.', 'Claiming bucket sort linear for arbitrary distributions.'], check: 'Why must an LSD radix sub-sort be stable?', answer: 'So earlier less-significant digit order survives ties on the current digit.', comparison: [
        { method: 'Counting', condition: 'Integer keys in range of size k', best: 'Θ(n+k)', average: 'Θ(n+k)', worst: 'Θ(n+k)', stable: 'Yes, with cumulative-count output variant', extraSpace: 'Θ(n+k)' },
        { method: 'LSD Radix', condition: 'd digits in base b; stable digit sort', best: 'Θ(d(n+b))', average: 'Θ(d(n+b))', worst: 'Θ(d(n+b))', stable: 'Yes, if each digit pass is stable', extraSpace: 'Typically Θ(n+b)' },
        { method: 'Bucket', condition: 'Values distribute evenly; insertion sort within buckets', best: 'Θ(n+k)', average: 'Expected Θ(n+k) under distribution assumption', worst: 'Θ(n²) if concentrated in one bucket', stable: 'Depends on within-bucket method', extraSpace: 'Θ(n+k)' }
      ] }
    ]
  },
  {
    id: 'unit-4', title: 'Unit IV — Linked lists',
    outcome: 'Preserve links while choosing a list variant and performing primitive operations and polynomial/GLL work.',
    topics: [
      { title: 'Allocation, node model, list variants, GLL', explanation: 'Static allocation reserves a region; dynamic allocation creates/releases nodes as needed. Singly nodes point forward; doubly nodes both ways; circular links tail back to head; doubly circular also links head.prev to tail. A GLL node distinguishes an atom from a sublist reference. Define its tag/shape before traversal.', workedSteps: ['Linear: head→A→B→null.', 'Circular: head→A→B→head.', 'Doubly circular also makes each next link’s target point back via prev.'], result: 'Termination differs: null for linear, return to head for circular.', pitfalls: ['Using null as circular stopping rule.', 'Updating next but not prev.', 'Confusing GLL atoms with sublists.'], check: 'What ends one full circular traversal?', answer: 'Returning to the starting node.' },
      { title: 'Create, traverse, search, insert, delete, sort, concatenate', explanation: 'Create initializes valid empty state; traverse visits nodes; search follows links; insert/delete rewires links; sort must state its algorithm; concatenate connects compatible lists. Complexity includes finding the target position.', workedSteps: ['Delete B from A→B→C: set A.next=C.', 'Deleting head updates head.', 'Deleting the only node clears head and tail.'], result: 'Nodes remain reachable and retain the intended sequence.', pitfalls: ['Losing the head before saving next.', 'Calling indexed insert O(1) while excluding traversal.', 'Breaking closure while concatenating circular lists.'], check: 'Does constant-time rewiring make insert-by-index O(1)?', answer: 'No; locating the predecessor costs Θ(n).' },
      { title: 'Polynomial lists and GLL polynomial representation', explanation: 'Polynomial nodes commonly store coefficient, exponent, and next pointer in exponent order. Addition merges ordered lists; multiplication forms term pairs then combines equal exponents. A GLL polynomial needs an explicitly defined nested record format.', workedSteps: ['P=3x²+2x and Q=x²−1.', 'Equal leading exponent: 3+1=4; copy remaining 2x and −1.', 'Result 4x²+2x−1.'], result: 'Ordered terms allow addition in Θ(m+n); pair formation in multiplication is Θ(mn) before combining.', pitfalls: ['Combining unlike exponents.', 'Assuming polynomial multiply is linear.', 'Leaving GLL structure undefined.'], check: 'What property makes list addition a one-pass merge?', answer: 'Both term lists are ordered by exponent.' }
    ]
  },
  {
    id: 'unit-5', title: 'Unit V — Stacks, expressions, recursion, backtracking',
    outcome: 'Trace stack operations and expressions, then reason about recursive calls and undo-based search.',
    topics: [
      { title: 'Stack implementations and multiple stacks', explanation: 'Array stack tracks top/capacity; linked stack tracks top node. Both are LIFO. Multiple stacks need separate top states; shared storage needs an explicit collision/full rule.', workedSteps: ['Two stacks share indices 0…7.', 'Left grows from 0; right grows from 7.', 'Full when their next slots meet.'], result: 'Separate tops preserve independent LIFO order while sharing free capacity.', pitfalls: ['Using one top for both.', 'Forgetting overflow when top regions meet.'], check: 'When do inward-growing stacks collide?', answer: 'When both next pushes would need the same slot.' },
      { title: 'Infix, prefix, postfix, conversion, evaluation', explanation: 'Infix puts operators between operands; postfix after; prefix before. Precedence, parentheses, and associativity determine grouping. During infix-to-postfix conversion, emit operands immediately, push operators, pop higher-precedence operators (and equal-precedence left-associative ones) before pushing a new operator, and pop to the matching opening parenthesis at a close. Postfix scans left-to-right with a stack; prefix often scans right-to-left. For noncommutative operators, preserve operand order.', workedSteps: ['Convert A+B*C: emit A; push +; emit B; push * because it outranks +; emit C.', 'At end, pop * then + → postfix ABC*+.', 'Evaluate (8−2)÷3 as postfix 8 2 − 3 ÷.', 'Pop 8,2 for − → 6; push 3; pop 6,3 for ÷ → 2.'], result: 'Precedence makes multiplication happen before addition; valid postfix evaluation leaves exactly one result.', pitfalls: ['Ignoring precedence/associativity.', 'Reversing operands.', 'Popping past an opening parenthesis.', 'Accepting too few operands or extra stack values.'], check: 'What should a valid postfix evaluation leave?', answer: 'Exactly one result.' },
      { title: 'Direct, indirect, tail, and tree recursion', explanation: 'Direct calls itself; indirect recurses through another function; tail makes recursive call the final action; tree recursion makes multiple recursive calls. Each active call stores parameters/local state/return location. A base case must terminate.', workedSteps: ['sum(3)→sum(2)→sum(1)→sum(0)=0.', 'Return: 1, then 3, then 6.', 'Maximum active depth is four calls including base.'], result: 'A single chain of depth n uses Θ(n) stack space unless runtime optimization is verified.', pitfalls: ['Missing/unreachable base case.', 'Assuming all runtimes optimize tail calls.', 'Confusing total calls with simultaneous depth.'], check: 'Space for a depth-n recursive chain?', answer: 'Θ(n) call-stack space in the general case.' },
      { title: 'Balanced delimiters and backtracking', explanation: 'Push each opener; each closer must match the current top; stack must end empty. Backtracking tries a choice, records state, then undoes it on failure. Search may be exponential if branching choices grow.', workedSteps: ['For {[()]}, push {,[,(; match ),],}.', 'No unmatched opener remains.', 'In a maze, mark a cell, explore a neighbor, and unmark on failure.'], result: 'Delimiter checking is Θ(n) time and Θ(n) worst-case stack space.', pitfalls: ['Equal opener/closer counts do not ensure nesting: ([)] fails.', 'Failing to undo tentative state.', 'Claiming backtracking is polynomial without a bound.'], check: 'Why is ([)] invalid?', answer: 'The close bracket does not match the most recent unmatched opener.' }
    ]
  },
  {
    id: 'unit-6', title: 'Unit VI — Queues, deques, priority queues',
    outcome: 'Preserve FIFO order and distinguish queue variants and priority directions.',
    topics: [
      { title: 'Array, circular, linked queues', explanation: 'Queue enqueues at rear and dequeues at front. Circular array wraps indices to reuse space; linked queue uses front/rear references. Specify bounded full/empty detection: count, reserved slot, or flag.', workedSteps: ['Capacity 4, rear=3.', 'Next enqueue position is (3+1) mod 4 = 0.', 'Freed prefix slot is reused without shifting.'], result: 'Logical order follows front and count/markers, not physical array order.', pitfalls: ['Ambiguous front==rear.', 'Stale rear after last dequeue.', 'Claiming shift-based dequeue Θ(1).'], check: 'If capacity 4 and rear 3, next index?', answer: '0.' },
      { title: 'Multiple queues and restricted deques', explanation: 'Multiple queues can use fixed partitions or shared storage with free-space ownership. A deque supports both-end operations. Input-restricted allows insertion at one specified end and deletion at both; output-restricted allows insertion at both and deletion at one specified end.', workedSteps: ['Input-restricted: insert rear only; delete front or rear.', 'Output-restricted: insert at either end; delete front only.', 'Shared pool must prevent two queues owning the same node.'], result: 'The restriction names which operation is limited.', pitfalls: ['Swapping input/output meanings.', 'Assuming a fixed partition lends unused cells.', 'Losing queue ownership in shared storage.'], check: 'Which type restricts insertion only?', answer: 'Input-restricted deque.' },
      { title: 'Ascending/descending priority queues', explanation: 'Extraction follows priority, not arrival alone. Under the course convention, ascending serves smallest key first; descending serves largest first. State ties policy. An unsorted/sorted array, list, or heap has different costs.', workedSteps: ['Ascending priorities 4,1,3 → 1,3,4.', 'Descending priorities 4,1,3 → 4,3,1.', 'Order does not depend on arrival unless tie rule says so.'], result: 'Declare numeric priority direction before tracing.', pitfalls: ['Treating priority as FIFO.', 'Saying “highest” without a numeric convention.', 'Assuming heap costs for every representation.'], check: 'If smaller means higher priority, ascending removes?', answer: 'The smallest key first.' }
    ]
  }
];

export const FODS_COURSE_UNITS: CourseUnit[] = BASE_FODS_COURSE_UNITS.map(unit => ({
  id: unit.id,
  title: unit.title,
  outcome: unit.outcome,
  topics: unit.topics.map(topic => {
    const details = COURSE_LESSON_DETAILS[topic.title];
    if (!details) throw new Error(`Missing lesson details for: ${topic.title}`);
    return { ...topic, ...details };
  })
}));

/** Flat, categorized lessons are the primary Learning Hub catalog. */
export const FODS_COURSE_TOPICS: CourseTopic[] = FODS_COURSE_UNITS.flatMap(unit => unit.topics);
