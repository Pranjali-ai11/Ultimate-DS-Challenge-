export type LessonDetails = {
  category: string;
  purpose: string;
  prerequisites: string[];
  pseudocode?: string;
  complexity: string[];
  edgeCases: string[];
  practice: Array<{ question: string; answer: string; reasoning: string }>;
  summary: string;
};

/** Focused supplements turn the syllabus outline into independent, searchable lessons. */
export const COURSE_LESSON_DETAILS: Record<string, LessonDetails> = {
  'Data, information, knowledge, ADT, and classifications': {
    category: 'Foundations & complexity', purpose: 'Choose and describe a data organization without confusing its behavior with its implementation.',
    prerequisites: ['Values can be stored and related.', 'An operation is an action performed on stored values.'],
    pseudocode: 'ADT Queue\n  enqueue(item)\n  dequeue() -> oldest item\n  isEmpty() -> boolean',
    complexity: ['An ADT has no single complexity until an implementation is chosen.', 'An array and a linked representation may satisfy the same queue contract with different memory and operation costs.'],
    edgeCases: ['Static/dynamic describes allocation or growth, not whether relationships are linear.', 'Persistent/ephemeral distinguishes retained old versions from updates that replace the current state.'],
    practice: [
      { question: 'Is “queue” an implementation?', answer: 'It is an ADT; arrays and linked nodes can implement it.', reasoning: 'The ADT defines observable operations and their behavior, while representation specifies storage.' },
      { question: 'Can a structure be linear and dynamically allocated?', answer: 'Yes.', reasoning: 'Classification dimensions describe different properties and are not mutually exclusive.' }
    ],
    summary: 'Define behavior first, then choose a representation; keep relationship, allocation, and versioning classifications separate.'
  },
  'Algorithm design, pseudocode, flowcharts, correctness': {
    category: 'Foundations & complexity', purpose: 'Turn an informal requirement into finite steps whose output can be justified.',
    prerequisites: ['Identify valid inputs and required output.', 'Know assignment, comparison, and repetition.'],
    pseudocode: 'MAX(A, n)\n  if n = 0: report empty input\n  best <- A[0]\n  for i <- 1 to n-1\n    if A[i] > best: best <- A[i]\n  return best',
    complexity: ['The maximum routine performs n−1 comparisons for n>0: Θ(n) time.', 'It stores one running value and index: Θ(1) auxiliary space.'],
    edgeCases: ['Empty input needs a defined result or error.', 'All-negative input must not be handled by initializing the maximum to zero.', 'Duplicate maxima do not change the returned maximum value.'],
    practice: [
      { question: 'What invariant proves MAX is correct?', answer: 'After processing index i, best is the maximum of A[0…i].', reasoning: 'Initialization establishes the claim for i=0; each comparison preserves it for the enlarged prefix.' },
      { question: 'What must a flowchart or pseudocode state for an empty list?', answer: 'The specified empty-input behavior.', reasoning: 'An algorithm must define what happens for every input in its stated domain.' }
    ],
    summary: 'State the input contract, termination, and an invariant; test boundaries before translating the design into code.'
  },
  'Time, space, asymptotic notation, step counting': {
    category: 'Foundations & complexity', purpose: 'Compare resource growth as input size increases under explicit input and cost assumptions.',
    prerequisites: ['Know what n measures.', 'Be able to count loop iterations and recursive calls.'],
    pseudocode: 'i <- n\nwhile i > 1\n  i <- floor(i / 2)',
    complexity: ['The loop halves i each time, so it runs Θ(log n) times.', 'Distinguish total space (input plus output and temporary memory) from auxiliary space (temporary memory only).', 'O is an upper bound, Ω a lower bound, and Θ a tight bound; none names a case by itself.'],
    edgeCases: ['n≤1 executes no halving iteration.', 'For nested loops, count actual dependent bounds; triangular loops need not be Θ(n²).', 'Recursive stack depth can dominate auxiliary space.'],
    practice: [
      { question: 'For i=1…n with a fixed number of operations per iteration, what is the time?', answer: 'Θ(n).', reasoning: 'There are n iterations, each contributing constant work.' },
      { question: 'Does O(n) necessarily mean worst-case time?', answer: 'No.', reasoning: 'Big-O is an upper-bound notation; the input case must be stated separately.' }
    ],
    summary: 'Define n and the case, count operations, simplify growth, and state whether space is total or auxiliary.'
  },
  'Divide-and-conquer and greedy methods': {
    category: 'Foundations & complexity', purpose: 'Recognize two design strategies and determine what reasoning is needed to justify their choices.',
    prerequisites: ['A problem can be divided into smaller instances.', 'A feasible solution can be compared by an objective.'],
    pseudocode: 'DIVIDE_AND_CONQUER(x): solve small x directly; split x; solve each part; combine results\nGREEDY: sort candidates by rule; repeatedly choose the next feasible candidate',
    complexity: ['A divide-and-conquer recurrence depends on subproblem count, size, and combine cost.', 'Greedy runtime includes sorting or candidate selection; correctness requires a proof, not a complexity argument.'],
    edgeCases: ['A greedy choice valid for unweighted activity selection is not automatically valid when activities have weights.', 'A split must make progress and the combine step must preserve correctness.'],
    practice: [
      { question: 'Why does earliest-finish selection work for unweighted compatible activities?', answer: 'Choosing the earliest finish leaves at least as much remaining time for later choices.', reasoning: 'An exchange argument can replace the first activity of an optimal solution with the earliest-finishing one without reducing the number selected.' },
      { question: 'Does the same choice rule solve weighted activity selection?', answer: 'Not in general.', reasoning: 'The objective changes; a locally earliest finish may discard a high-value compatible activity.' }
    ],
    summary: 'Divide-and-conquer needs a recurrence and valid combine step; greedy needs a justified choice rule for the exact objective.'
  },
  'Array ADT and ordered operations': {
    category: 'Arrays, polynomials & sparse matrices', purpose: 'Perform sequence operations while accounting for index validity, capacity, and shifting.',
    prerequisites: ['Indices identify positions.', 'Logical length may be smaller than allocated capacity.'],
    pseudocode: 'INSERT(A, n, k, x):\n  require 0 <= k <= n and free capacity\n  for i <- n-1 down to k: A[i+1] <- A[i]\n  A[k] <- x; n <- n+1',
    complexity: ['Access/update by valid index: Θ(1).', 'Insert at k: Θ(n−k) moves; delete at k: Θ(n−k−1) moves.', 'Linear search: Θ(n) worst case; dynamic-array append is amortized Θ(1), with Θ(n) resize events.'],
    edgeCases: ['Insert at n moves nothing; insert into a full fixed array is invalid.', 'Delete from an empty array and access index n are invalid.', 'Merging sorted arrays requires a policy for equal keys.'],
    practice: [
      { question: 'Insert at index 2 into a length-5 array. How many old values move?', answer: '3.', reasoning: 'Indices 2, 3, and 4 move one place right.' },
      { question: 'How can two sorted arrays be merged in linear time?', answer: 'Compare their current front items, copy the smaller, advance that input, then append the remaining suffix.', reasoning: 'Each input position is consumed once, for Θ(m+n) time and Θ(m+n) output space.' }
    ],
    summary: 'Array indexing is direct; ordered insertion and deletion pay for shifting. Always check bounds, length, and capacity.'
  },
  'Row-major/column-major address calculations': {
    category: 'Arrays, polynomials & sparse matrices', purpose: 'Translate a multidimensional index into a byte address for a stated layout.',
    prerequisites: ['Know dimensions, base address, element size, and index origin.', 'This lesson’s formulas use zero-based indices.'],
    pseudocode: 'rowMajorOffset(r,c,R,C) = r*C + c\ncolumnMajorOffset(r,c,R,C) = c*R + r\naddress = base + offset*elementSize',
    complexity: ['Address calculation uses a fixed number of arithmetic operations: Θ(1) time and Θ(1) extra space.'],
    edgeCases: ['Require 0≤r<R and 0≤c<C.', 'For one-based indices subtract the lower bounds before applying the offset formula.', 'Use the number of columns as the row-major stride and rows as the column-major stride.'],
    practice: [
      { question: 'For a zero-based 3×4 array, what is the row-major element offset of A[2][1]?', answer: '9.', reasoning: '2×4+1=9 elements from the base.' },
      { question: 'At base 100 with 2-byte elements, what is that element’s byte address?', answer: '118.', reasoning: '100+(9×2)=118.' }
    ],
    summary: 'Write the layout and indexing assumptions first; compute the element offset, then multiply by bytes per element.'
  },
  'Polynomial array/structure representation': {
    category: 'Arrays, polynomials & sparse matrices', purpose: 'Represent coefficients and exponents so addition and multiplication can be traced correctly.',
    prerequisites: ['A polynomial is a sum of coefficient×variable^exponent terms.', 'Only like exponents can be combined.'],
    pseudocode: 'ADD(P,Q):\n  compare current exponents\n  copy the term with larger exponent\n  if exponents equal: add coefficients and advance both\n  append remaining terms',
    complexity: ['Dense coefficient-array storage through degree d uses Θ(d) space.', 'Adding two exponent-ordered term lists of m and n terms takes Θ(m+n).', 'Naive multiplication forms mn term pairs before equal exponents are combined.'],
    edgeCases: ['Zero coefficients may be omitted in sparse term representations.', 'Different exponents are copied, not added.', 'Multiplication must add exponents and multiply coefficients.'],
    practice: [
      { question: 'Add (2x²+3) and (x²−1).', answer: '3x²+2.', reasoning: 'Combine the x² coefficients (2+1) and constants (3−1).' },
      { question: 'Multiply (2x²)(3x³).', answer: '6x⁵.', reasoning: 'Multiply coefficients and add exponents.' }
    ],
    summary: 'Dense arrays suit compact exponent ranges; ordered term records suit sparse exponents. Combine only equal powers.'
  },
  'Sparse triplets, addition, and transpose': {
    category: 'Arrays, polynomials & sparse matrices', purpose: 'Store only nonzero matrix entries and transform them without scanning or storing every zero.',
    prerequisites: ['A matrix entry is identified by row and column.', 'Triplets are ordered by row then column.'],
    pseudocode: 'FAST_TRANSPOSE(terms, C): count terms in each column; prefix-sum start positions; place each (r,c,v) as (c,r,v) at next[c]',
    complexity: ['For R rows, C columns, and t nonzeros, simple transpose is Θ(Ct) in the standard triplet scan.', 'Fast transpose is Θ(C+t) time and Θ(C+t) temporary/output space.', 'Merging sorted triplets for addition is Θ(tA+tB).'],
    edgeCases: ['A zero matrix has no data terms but still has dimensions.', 'Drop a coordinate whose sum becomes zero if the format stores nonzeros only.', 'Transposed output must be sorted by its new row/column order.'],
    practice: [
      { question: 'Transpose term (2,0,7).', answer: '(0,2,7).', reasoning: 'Transpose swaps row and column, not the value.' },
      { question: 'Why can fast transpose beat simple transpose for a wide matrix?', answer: 'It counts each column once and places each term once instead of scanning all t terms for every column.', reasoning: 'The comparison is Θ(C+t) versus Θ(Ct), under triplet representation assumptions.' }
    ],
    summary: 'A transpose swaps coordinates; fast transpose uses column counts and prefix positions to preserve sorted triplets.'
  },
  'Linear, sentinel, binary, Fibonacci, indexed-sequential search': {
    category: 'Searching', purpose: 'Choose a search based on ordering, random access, and any directory or probe assumptions.',
    prerequisites: ['Know whether keys are sorted.', 'Understand index ranges and comparison counts.'],
    pseudocode: 'LINEAR(A,x): for i=0..n-1: if A[i]=x return i; return NOT_FOUND\nBINARY(A,x): low=0; high=n-1; while low<=high: mid=floor((low+high)/2); compare; discard the impossible sorted half\nFIBONACCI(A,x): grow Fibonacci numbers until fib>=n; offset=-1; probe min(offset+fib2,n-1); compare and shrink Fibonacci offsets; check the one remaining item\nINDEXED_SEQUENTIAL: use sorted block boundary keys to choose a candidate block; scan that block',
    complexity: ['Linear and sentinel search are Θ(n) worst case; sentinel can reduce boundary checks but not growth.', 'Binary and Fibonacci search are Θ(log n) comparisons on sorted data; iterative auxiliary space is Θ(1).', 'Indexed-sequential search cost depends on directory search and block size; binary-searched directory plus block scan is Θ(log(n/b)+b).'],
    edgeCases: ['Empty input returns not found without reading an element.', 'Binary/Fibonacci require sorted input.', 'Sentinel search must restore any overwritten guard slot.', 'Indexed-sequential bounds require stated block and directory assumptions.'],
    practice: [
      { question: 'Binary-search [2,5,8,12,16] for 12 using lower-middle probes.', answer: 'Probe 8, then 12; found in two comparisons.', reasoning: 'Sorted order proves the left half can be discarded after probing 8.' },
      { question: 'If n=100 and block size b=10, roughly how many directory levels and block items are examined?', answer: 'About log₂10 directory comparisons, then at most 10 block items.', reasoning: 'The stated binary-directory design has Θ(log(n/b)+b) worst-case work.' }
    ],
    summary: 'Linear variants do not require sorting; binary and Fibonacci do. State the input order and exact design before claiming a bound.'
  },
  'Bubble, insertion, selection': {
    category: 'Sorting', purpose: 'Trace elementary comparison sorts and compare adaptiveness, stability, and pass behavior.',
    prerequisites: ['A comparison determines key order.', 'A pass changes or confirms a portion of the sequence.'],
    pseudocode: 'INSERTION(A): for i=1..n-1: save A[i]; shift larger prefix values right; place saved value in the gap\nBUBBLE(A): repeat adjacent compare/swap passes; stop early after a pass with no swaps\nSELECTION(A): for each start position, find the minimum in the suffix and swap it into place',
    complexity: ['All three are Θ(n²) average/worst comparison sorts.', 'Optimized bubble and insertion are Θ(n) best case on already ordered input.', 'Selection remains Θ(n²) comparisons even when already sorted; all use Θ(1) auxiliary space in-place.'],
    edgeCases: ['A 0- or 1-item sequence is already sorted.', 'Insertion is stable when only strictly larger values shift.', 'Ordinary swap-based selection is not stable.'],
    practice: [
      { question: 'Insert 4 into the sorted prefix [2,5,7].', answer: '[2,4,5,7].', reasoning: 'Shift 7 and 5 right, then place 4 in the gap.' },
      { question: 'Which method still scans the unsorted suffix for a minimum on sorted input?', answer: 'Selection sort.', reasoning: 'Its selection step compares the remaining suffix every pass.' }
    ],
    summary: 'Bubble exchanges neighbors, insertion maintains a sorted prefix, and selection repeatedly chooses a suffix minimum.'
  },
  'Quick sort and Shell sort': {
    category: 'Sorting', purpose: 'Understand partition recursion and gap-based insertion passes without hiding implementation assumptions.',
    prerequisites: ['Partition divides keys around a pivot.', 'Insertion sort can sort elements in a subsequence.'],
    pseudocode: 'QUICKSORT(low, high): if low < high: p <- partition(A, low, high); QUICKSORT(low,p-1); QUICKSORT(p+1,high)\nSHELL: for each decreasing gap ending at 1: insertion-sort each gap subsequence',
    complexity: ['Quicksort is Θ(n log n) for balanced partitions on average and Θ(n²) in the worst case.', 'Recursive auxiliary space is Θ(log n) average and Θ(n) worst with unbalanced recursion.', 'Shell-sort costs depend on its gap sequence; halving gaps have a conservative O(n²) worst-case bound.'],
    edgeCases: ['All-equal keys can expose poor partition schemes.', 'A trace must name pivot choice and partition method.', 'The final Shell gap must be 1 for a fully sorted sequence.'],
    practice: [
      { question: 'What is the worst-case recurrence for quicksort with one empty side each time?', answer: 'T(n)=T(n−1)+Θ(n), hence Θ(n²).', reasoning: 'Partition scans n items and recursion reduces size by only one.' },
      { question: 'Why must Shell’s final gap be 1?', answer: 'It performs a final ordinary insertion-sort pass across the whole sequence.', reasoning: 'Earlier gapped passes alone do not guarantee complete order.' }
    ],
    summary: 'Quicksort depends on partition balance; Shell sort depends on its gap sequence. Include those assumptions in every trace.'
  },
  'Counting, radix, bucket; internal/external sorting': {
    category: 'Sorting', purpose: 'Use key structure or storage location to select a sorting method and state when its efficiency claim applies.',
    prerequisites: ['Know comparison sorting versus key-based sorting.', 'Know the key range or digit representation.'],
    pseudocode: 'COUNTING: count each key; prefix-sum counts; place items in output\nLSD_RADIX: for each digit from least to most significant: stable-sort by that digit',
    complexity: ['Counting: Θ(n+k) time and Θ(n+k) space for n keys in range k.', 'LSD radix: Θ(d(n+b)) time for d digits and base b with a stable digit sort.', 'Bucket: expected Θ(n+k) only under a suitable distribution and bucket method; worst case may be Θ(n²).', 'External sorting uses disk/block I/O when data do not fit working memory.'],
    edgeCases: ['Negative or very wide keys need an explicit encoding/range strategy for counting/radix.', 'Stable digit passes are required for LSD radix.', 'Concentrating all values in one bucket invalidates expected-linear behavior.'],
    practice: [
      { question: 'Count [2,1,2] with key range 0…2.', answer: 'Counts [0,1,2], output [1,2,2].', reasoning: 'Emit each key as many times as its frequency.' },
      { question: 'Why must an LSD radix pass be stable?', answer: 'To preserve the ordering established by less-significant digits.', reasoning: 'The next pass groups by a more-significant digit while retaining previous order among ties.' }
    ],
    summary: 'Non-comparison sorts trade generality for assumptions about key ranges, digits, or distribution; external sorting is about storage limits.'
  },
  'Allocation, node model, list variants, GLL': {
    category: 'Linked lists & GLL', purpose: 'Choose link structure and termination rules that match the required sequential or nested data.',
    prerequisites: ['References identify nodes.', 'A node can contain a value and one or more links.'],
    pseudocode: 'Singly node: (data, next)\nDoubly node: (data, prev, next)\nGLL node: (tag, atom-or-sublist-link)',
    complexity: ['A node uses Θ(1) storage plus its links; n list nodes use Θ(n) total storage.', 'Dynamic allocation avoids a fixed contiguous block but incurs per-node link/allocation overhead.'],
    edgeCases: ['Linear lists terminate at null; circular lists terminate when traversal returns to its start.', 'Empty and one-node circular lists need links initialized consistently.', 'GLL traversal must inspect the tag before interpreting a link.'],
    practice: [
      { question: 'What is the stopping test for one full circular-list traversal?', answer: 'Stop when the current reference returns to the start node.', reasoning: 'There is no null link at the end.' },
      { question: 'What extra consistency rule applies to a doubly linked list?', answer: 'Each next/previous pair must point back to each other.', reasoning: 'Forward and reverse traversals depend on both links agreeing.' }
    ],
    summary: 'Pick linear, circular, singly, doubly, or generalized links deliberately and define empty/singleton invariants.'
  },
  'Create, traverse, search, insert, delete, sort, concatenate': {
    category: 'Linked lists & GLL', purpose: 'Perform list primitives while separating link rewiring cost from the cost of finding a position.',
    prerequisites: ['Know head and optional tail references.', 'Know which node or predecessor is available.'],
    pseudocode: 'CREATE: initialize head/tail to empty\nTRAVERSE: visit node; follow next until null (or return to start for circular list)\nDELETE_AFTER(prev): target <- prev.next; prev.next <- target.next; if target is tail: tail <- prev; release target',
    complexity: ['Traversal/search and indexed insertion/deletion are Θ(n) when a scan is needed.', 'Head insertion/deletion is Θ(1); append is Θ(1) only with a maintained tail.', 'Sorting cost depends on algorithm; concatenation is Θ(1) only with compatible lists and tails, otherwise a scan may be needed.'],
    edgeCases: ['Update both head and tail for empty/singleton transitions.', 'A singly linked node alone does not provide its predecessor.', 'Circular concatenation must preserve exactly one cycle.'],
    practice: [
      { question: 'Delete index 4 when only head is available. Is it O(1)?', answer: 'No; locating the predecessor takes Θ(n).', reasoning: 'Only the final pointer rewiring is constant-time.' },
      { question: 'What pointers change to concatenate disjoint linear lists A and B when A has a tail?', answer: 'A.tail.next=B.head and A.tail=B.tail.', reasoning: 'The assumption of disjoint lists and a maintained tail permits constant-time linking.' }
    ],
    summary: 'Finding nodes usually costs a traversal; then a constant number of correct link updates performs the primitive.'
  },
  'Polynomial lists and GLL polynomial representation': {
    category: 'Linked lists & GLL', purpose: 'Represent sparse polynomial terms dynamically and compare list and array approaches.',
    prerequisites: ['Each term has a coefficient and exponent.', 'Like exponents combine; ordered lists permit merge-style addition.'],
    pseudocode: 'ADD_TERMS(P,Q): compare exponents; copy larger exponent; add equal exponents; omit zero sums; append remainder',
    complexity: ['Adding exponent-sorted lists of m and n terms is Θ(m+n).', 'Pairwise multiplication begins with Θ(mn) term products; combine equal exponents using an explicitly chosen method.', 'Array versus list costs depend on exponent range, density, and combining strategy.'],
    edgeCases: ['Remove zero-coefficient terms if using a sparse representation.', 'A GLL needs a defined tag and nested sublist format.', 'Do not call polynomial multiplication linear without stronger constraints.'],
    practice: [
      { question: 'Add 3x²+2x and x²−1.', answer: '4x²+2x−1.', reasoning: 'Merge by exponent, adding only the two x² coefficients.' },
      { question: 'What is the initial pair count when multiplying m-term and n-term polynomials?', answer: 'mn.', reasoning: 'Each term in one polynomial pairs with every term in the other.' }
    ],
    summary: 'Store coefficient/exponent pairs, order them for merge operations, and state how equal products are combined.'
  },
  'Stack implementations and multiple stacks': {
    category: 'Stacks, expressions & recursion', purpose: 'Use LIFO storage for nested work and manage capacity for one or more stacks.',
    prerequisites: ['A sequence has a designated top.', 'A bounded array has finite capacity.'],
    pseudocode: 'PUSH(S,x): if full report overflow; top <- top+1; A[top] <- x\nPOP(S): if empty report underflow; x <- A[top]; top <- top-1; return x',
    complexity: ['Push, pop, and peek are Θ(1) for a fixed array or linked top.', 'Dynamic-array resize may cost Θ(n) for one push but Θ(1) amortized.', 'Two stacks growing inward share capacity; collision check is Θ(1).'],
    edgeCases: ['Empty top is −1 in the common zero-based array convention.', 'Two stacks collide when their next writes would use the same cell.', 'A failed pop must not change stack state.'],
    practice: [
      { question: 'Push 4, push 7, pop, then push 9. What is the next pop?', answer: '9.', reasoning: 'It is the most recently pushed remaining item.' },
      { question: 'How can two stacks share one array?', answer: 'Grow one top from the left and one from the right, stopping before their indices meet.', reasoning: 'Unused cells can be used by either stack until the shared free region is exhausted.' }
    ],
    summary: 'A stack exposes only its top. Guard underflow/overflow and keep separate top state for every stack.'
  },
  'Infix, prefix, postfix, conversion, evaluation': {
    category: 'Stacks, expressions & recursion', purpose: 'Represent precedence and grouping explicitly, then evaluate expressions with a stack.',
    prerequisites: ['Know operands, operators, parentheses, precedence, and associativity.', 'For multi-digit tokens, tokenize before scanning.'],
    pseudocode: 'INFIX_TO_POSTFIX: emit operands; use an operator stack to enforce precedence/associativity; pop to matching parentheses\nINFIX_TO_PREFIX: reverse tokens and parentheses, convert using adjusted associativity, then reverse output\nEVALUATE_POSTFIX: scan left-to-right; pop right then left for each operator; push result; finish with one value',
    complexity: ['Conversion/evaluation is Θ(n) time and Θ(n) auxiliary stack space for n tokens.', 'Each token is pushed/popped a bounded number of times.'],
    edgeCases: ['Reject mismatched parentheses, too few operands, division by zero when evaluating, and leftover values.', 'Exponentiation is often right-associative; equal-precedence pop rules must reflect the operator.', 'Prefix evaluation scans right-to-left and operand order still matters.'],
    practice: [
      { question: 'Convert A+B*C to postfix.', answer: 'ABC*+.', reasoning: 'Multiplication has higher precedence, so B*C is emitted before +.' },
      { question: 'Evaluate postfix 8 2 − 3 ÷.', answer: '2.', reasoning: 'Pop right=2 and left=8 to get 6; then pop right=3 and left=6 to get 2.' }
    ],
    summary: 'Stacks preserve operators or operands; preserve precedence, associativity, and left/right operand order.'
  },
  'Direct, indirect, tail, and tree recursion': {
    category: 'Stacks, expressions & recursion', purpose: 'Classify recursive call patterns and trace termination and call-stack use.',
    prerequisites: ['A function can call itself directly or through another function.', 'Each active call has its own local state.'],
    pseudocode: 'SUM(n): if n=0 return 0; return n + SUM(n-1)',
    complexity: ['A single chain with depth n has Θ(n) time when each call does constant work and Θ(n) stack space.', 'Tree recursion time depends on total calls, while stack space depends on maximum active depth.', 'Tail-call space reduction must not be assumed unless the runtime guarantees optimization.'],
    edgeCases: ['Base case must be reachable.', 'Negative input needs a contract or separate base case.', 'Large depth may exhaust the runtime stack.'],
    practice: [
      { question: 'Is f calling g and g calling f direct or indirect recursion?', answer: 'Indirect recursion.', reasoning: 'The recursive cycle passes through another function.' },
      { question: 'For SUM(3) with SUM(0)=0, what value is returned?', answer: '6.', reasoning: '3+2+1+0=6; four calls are active at the deepest point including the base call.' }
    ],
    summary: 'Show the base case and call pattern; count total calls for time and maximum active depth for stack space.'
  },
  'Balanced delimiters and backtracking': {
    category: 'Stacks, expressions & recursion', purpose: 'Use a stack for properly nested symbols and undo state when exploring a failed choice.',
    prerequisites: ['Openers and matching closers are defined.', 'A search can make and reverse a tentative choice.'],
    pseudocode: 'N_QUEENS(row): if row=n return success\nfor each column: if column and both diagonals are free: place queen; mark constraints\n  if N_QUEENS(row+1) succeeds: return success\n  remove queen; unmark constraints\nreturn failure',
    complexity: ['Delimiter checking is Θ(n) time and Θ(n) worst-case stack space.', 'Backtracking can be exponential; bound depends on branching factor and search depth.'],
    edgeCases: ['Empty string is balanced.', '([)] fails despite equal counts.', 'Backtracking must undo every mutation made by a failed branch.'],
    practice: [
      { question: 'Is ([)] balanced?', answer: 'No.', reasoning: 'At `)`, the latest unmatched opener is `[`, which does not match.' },
      { question: 'What does a maze solver need to restore after a dead end?', answer: 'The visited/path state introduced by that branch.', reasoning: 'Undoing the tentative choice allows another route to explore the same state correctly.' }
    ],
    summary: 'Validate nesting with top-of-stack order; model backtracking as choose, recurse, and undo.'
  },
  'Array, circular, linked queues': {
    category: 'Queues, deques & priority queues', purpose: 'Maintain FIFO order while selecting an implementation that reuses space correctly.',
    prerequisites: ['Front is the next item to leave; rear is where the next item joins.', 'A bounded queue needs a full/empty convention.'],
    pseudocode: 'ENQUEUE(x): if full report overflow; A[rear] <- x; rear <- (rear+1) mod capacity; count++\nDEQUEUE(): if empty report underflow; x <- A[front]; front <- (front+1) mod capacity; count--; return x',
    complexity: ['Circular-array and linked queue enqueue/dequeue are Θ(1) with maintained indices/endpoints.', 'A naive array dequeue that shifts every item is Θ(n).', 'Queue storage is Θ(n) items or Θ(capacity) allocated cells.'],
    edgeCases: ['Capacity must be positive.', 'Count or another marker distinguishes full from empty when front equals rear.', 'Removing the last linked item resets both front and rear.'],
    practice: [
      { question: 'Capacity 4 and rear index 3; where is the next insertion?', answer: 'Index 0.', reasoning: '(3+1) mod 4 wraps to zero.' },
      { question: 'Why can front==rear be ambiguous?', answer: 'It can describe either no items or a full ring depending on the convention.', reasoning: 'Track count, reserve one slot, or use a full flag.' }
    ],
    summary: 'Queue operations preserve FIFO; circular indices reuse array slots, while linked endpoints avoid shifting.'
  },
  'Multiple queues and restricted deques': {
    category: 'Queues, deques & priority queues', purpose: 'Distinguish multi-queue storage strategies and the exact endpoint restrictions of deque variants.',
    prerequisites: ['A deque has front and rear ends.', 'Insertion is input and deletion is output.'],
    pseudocode: 'INPUT-RESTRICTED: insertRear only; deleteFront or deleteRear\nOUTPUT-RESTRICTED: insertFront or insertRear; deleteFront only',
    complexity: ['A deque implemented with a circular array or doubly linked list can support endpoint operations in Θ(1).', 'A fixed partition uses Θ(1) endpoint updates but cannot lend unused cells without a shared pool.'],
    edgeCases: ['Define behavior on empty/full structures.', 'A shared free-node pool must ensure a node belongs to only one queue.', 'Restricted variant names which operation is limited.'],
    practice: [
      { question: 'Which deque permits deletion at both ends but insertion at only one?', answer: 'Input-restricted deque.', reasoning: 'Input refers to insertion and is the restricted operation.' },
      { question: 'What is a drawback of fixed partitions for multiple queues?', answer: 'One queue may overflow while another partition has unused capacity.', reasoning: 'Partitioned capacity is not automatically shareable.' }
    ],
    summary: 'Name the restricted operation precisely, and state whether multiple queues use fixed partitions or shared storage.'
  },
  'Ascending/descending priority queues': {
    category: 'Queues, deques & priority queues', purpose: 'Remove the item with the declared priority order rather than simply the oldest arrival.',
    prerequisites: ['Every item has a priority key.', 'Define whether smaller or larger keys are served first and how ties are handled.'],
    pseudocode: 'EXTRACT_MIN from unsorted array: scan for smallest key; remove it; return it\nEXTRACT_MIN from sorted array: remove first item',
    complexity: ['Unsorted array: Θ(1) insert and Θ(n) extract.', 'Sorted array: Θ(n) insert (shifting) and Θ(1) extract.', 'A heap is an optional representation with Θ(log n) insert/extract, not a property of the ADT itself.'],
    edgeCases: ['Empty extraction underflows.', 'Equal priorities need a stated tie policy if arrival order matters.', 'Ascending/descending refer to key order; “highest priority” can mean either convention.'],
    practice: [
      { question: 'Ascending queue with priorities 4,1,3: what order is removed?', answer: '1, then 3, then 4.', reasoning: 'Ascending serves the smallest numeric key first.' },
      { question: 'Does every priority queue insert in Θ(log n)?', answer: 'No.', reasoning: 'The ADT permits representations with different costs; logarithmic insertion is for a heap implementation.' }
    ],
    summary: 'State the numeric priority direction and representation before tracing or analyzing a priority queue.'
  }
};
