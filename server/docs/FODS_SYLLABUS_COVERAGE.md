# Required FODS assessment coverage

The uploaded CI2001 Fundamentals of Data Structures syllabus is the authority for this matrix. The active bank now contains **95 questions**: Level 1 = 32, Level 2 = 36, Level 3 = 15, Level 4 = 12. Optional enrichment content remains excluded. The complete challenge-by-challenge content/mapping audit and before/after distributions are in [PHASE4C_CATALOG_AUDIT.md](PHASE4C_CATALOG_AUDIT.md). Status here is based on syllabus coverage; supplementary structure questions are identified separately and are not assigned invented syllabus units.

| Unit | Syllabus topic / practical areas | Status | Active question evidence and remaining gap |
|---|---|---|---|
| I | Problem-to-program, data/information, ADTs, classifications | Partial | `c-l1-08` tests an implementation-independent ADT. Data/information/knowledge and static/dynamic/persistent/ephemeral classifications are not directly assessed. |
| I | Pseudocode, flowcharts, step counts, linear/quadratic/cubic/log constructs | Partial | `c-l1-10`, `c-l1-11`, `c-l1-13`. Flowchart and simple traces exist; there is not a systematic set of linear, cubic, and logarithmic step-count traces. |
| I | Time/space, Big-O/Theta/Omega | Partial | `c-l1-10`, `c-l1-12`, `c-l1-14`, `c-l2-06`, `c-l4-03`. The asymptotic bounds are compared and constant auxiliary space is tested; broad best/average/worst and recursive-space analysis remains limited. |
| I | Divide-and-conquer and greedy strategies | Covered | `c-l2-11`, `c-l2-12` identify recursive divide/combine and the stated unweighted earliest-finish greedy rule. |
| II | Array ADT, traversal, insert, delete, search, update, merge | Partial | `c-l1-03`, `c-l1-09`, `c-l1-16`, `c-l1-20`, `c-l2-25`. Insert/update/search/merge are assessed; a deletion-shift trace and broader operation cost comparison are missing. |
| II | 2D array address calculation, row- and column-major | Covered | `c-l1-03`, `c-l1-21` use explicit zero-based bounds and element sizes. |
| II | Array/structure polynomial representation, addition and multiplication | Partial | `c-l2-13`, `c-l3-02`, `c-l4-06`. Array multiplication and representation comparison are assessed; detailed output tracing for a polynomial product is still limited. |
| II | Sparse representation, addition, simple/fast transpose and time-space trade-off | Covered | `c-l3-01`, `c-l3-09`, `c-l4-01` cover compact triplets, addition, transpose approaches, and count/position auxiliary storage. |
| III | Linear, sentinel, binary, Fibonacci, indexed-sequential search | Covered | `c-l1-04`, `c-l1-09`, `c-l2-01`–`c-l2-03`, `c-l2-14`. Search conditions and sentinel restoration are specified; more comparative performance traces would deepen practical coverage. |
| III | Bubble, insertion, selection, quick, Shell; stability and passes | Partial | `c-l1-05`, `c-l1-15`, `c-l2-04`, `c-l2-06`, `c-l2-15`, `c-l2-16`. Bubble pass, stability, insertion, quick worst case, Shell gap rule, and selection pass are represented; full pass traces and best/average/worst comparison are not comprehensive. |
| III | Counting, radix, bucket; internal/external sorting | Partial | `c-l2-05`, `c-l2-07`, `c-l2-08`, `c-l4-02`. Assumptions and stability are addressed; method-by-method complexity comparison is incomplete. |
| IV | Static/dynamic allocation; singly, doubly, circular, doubly-circular lists | Partial | `c-l1-06`, `c-l4-05`. Deletion constraints and variant selection are covered; allocation and circular-boundary dry runs are not. |
| IV | Create, traverse, search, insert, delete, sort, concatenate | Partial | `c-l1-06`, `c-l1-18`, `c-l2-17`, `c-l2-18`. Search, delete constraint, sort operation, and concatenation appear; full insertion/deletion and sorting traces are missing. |
| IV | Polynomial operations with lists and GLL representation | Partial | `c-l2-09`, `c-l2-10`, `c-l2-19`, `c-l3-02`, `c-l4-06`. Linked addition and GLL representation are assessed; detailed GLL traversal and linked polynomial product dry runs are not. |
| V | Stack ADT, representation, operations, linked stack | Partial | `c-l1-01`, `c-l1-08`, `c-l1-07`. LIFO traces and expression use are tested; linked-stack implementation operations are not directly traced. |
| V | Infix/postfix/prefix conversion/evaluation and balanced delimiters | Partial | `c-l1-07`, `c-l1-17`, `c-l2-20`, `c-l3-03`. Postfix evaluation, prefix evaluation, infix-to-postfix workflow, and balanced checking appear; prefix conversion and operator-precedence edge cases are limited. |
| V | Direct, indirect, tail, tree recursion; backtracking; multiple stacks | Partial | `c-l1-19`, `c-l2-21`, `c-l3-04`, `c-l3-08`, `c-l4-03`. Indirect/tree variants, maze backtracking, shared two-stack storage, and call-stack space are included; direct/tail call traces and backtracking dry runs remain limited. |
| VI | Queue ADT/operations, circular and linked queue | Partial | `c-l1-22`, `c-l2-22`, `c-l2-26`, `c-l3-05`, `c-l3-13`, `c-l4-10`. FIFO trace, circular wraparound, linked-queue singleton behavior, and queue use during BFS are assessed; a longer linked enqueue/dequeue boundary trace remains useful. |
| VI | Multiple queues | Covered | `c-l3-07` tests fixed partitions; `c-l4-04` tests shared capacity without fixed partitions. The design assumptions intentionally differ by level. |
| VI | Deques: input- and output-restricted | Covered | `c-l1-23`, `c-l2-23`, `c-l2-27`, `c-l3-06`, `c-l3-14`, `c-l4-11` distinguish allowed ends and apply deque operations to bounded/circular storage. |
| VI | Ascending and descending priority queues | Covered | `c-l1-02`, `c-l1-32`, `c-l2-24`, `c-l2-28`, `c-l3-10`, `c-l3-15`, `c-l4-07`, `c-l4-12` cover direction, ties, priority behavior, heap implementation, and scheduling scenarios. |

## Catalog audit summary — 2026-10-24

- The authoritative active source is `FODS_REQUIRED_CHALLENGES` in `server/src/data/fodsQuestionBank.ts`; `INITIAL_CHALLENGES` consumes it. The optional legacy enrichment bank remains separate.
- Exposure uses explicit curated `coverageTopics`. `optimalStructures` remains answer/scoring metadata and is not used as a topic association source.
- Automated checks validate IDs/slugs, levels, prompts, unit/category metadata, canonical coverage tags, answer-option consistency, explanations/rationales, hybrid requirement coverage, supplementary-unit handling, and optional/active ID collisions.
- Original challenge IDs remain present and unique. The 34 additions are IDs c-l1-22–32, c-l2-26–36, c-l3-10–15, and c-l4-07–12; no progression rewards or thresholds were changed.
- Added BST, graph, heap, and hash-table questions are supplementary to the syllabus matrix below; they are explicitly marked Supplementary rather than assigned unsupported syllabus units. Their mappings do not imply the official syllabus requires these topics.
- The audit is an engineering review and does not replace independent faculty moderation.
- Optional legacy enrichment content remains separate from the active assessment and is not served by `INITIAL_CHALLENGES`.

## Remaining assessment gaps

Remaining syllabus opportunities include deeper array deletion traces, linked-list create/insert/delete/sort and circular-boundary dry runs, polynomial multiplication output, direct/tail recursion and backtracking traces, and broader algorithm complexity comparisons. Unit I data/information and data-structure classification terminology also lacks direct questions. New queue/deque questions improve operation and boundary coverage but do not make all implementation traces comprehensive. These gaps are not inferred as covered from adjacent topics.

## Interactive simulator coverage note — 2026-10-23

The syllabus matrix above describes learning/assessment coverage; “Covered” does not imply that the application has an interactive simulator. Current visualizer source provides interactive array operations and Bubble Sort/Binary Search, singly/doubly/circular/doubly-circular linked-list operations, stack, linear/circular/linked queue modes, min-heap/priority queue, BST, chained hash table, and graph BFS. This source inventory is not browser verification; see SIMULATOR_VERIFICATION.md for the separate automated and observed-browser evidence.

The following syllabus topics remain without dedicated interactive demonstrations: multiple stacks, multiple queues, input-restricted and output-restricted deques, polynomial lists, and generalized linked lists (GLL). Linked-list sorting/concatenation and polynomial/GLL operations also remain outside the current sandbox. Static lesson or assessment material for these subjects should not be described as an operational simulator.

