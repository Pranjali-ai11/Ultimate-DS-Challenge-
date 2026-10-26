# Explore the Data Structures learning area

This is an implementation inventory for the current learning screens. Required course content follows the uploaded CI2001 Fundamentals of Data Structures syllabus. An interactive simulator being present does not mean its implementation is itself part of the required syllabus.

## Syllabus study path

The `GET /api/learn` response serves six study units (`unit-1` through `unit-6`) with topic explanations, a worked trace, result, common pitfalls, and a self-check. Unit III topics include method comparison tables. Coverage is an introductory guided path; it is not a replacement for the complete syllabus/practical work or a comprehensive course assessment.

| Unit | Guided content included | Practical depth still needed |
|---|---|---|
| I — Foundations and analysis | Problem/program/data structure concepts, ADTs, pseudocode and step growth, time/space, divide-and-conquer and greedy examples | More systematic flowchart and linear/quadratic/cubic/log step-count traces; broader best/average/worst and recursive-space exercises |
| II — Arrays, polynomials, sparse matrices | Array ADT and shifts; row/column-major addresses; polynomial forms and operations; sparse triplet addition, simple and fast transpose | More polynomial multiplication traces and matrix edge cases; transpose bounds are now stated with assumptions |
| III — Searching and sorting | Named syllabus searches and sorts, assumptions, worked traces, stability, complexity/comparison tables | More full traces on boundary/equal-key inputs; indexed search remains design-dependent |
| IV — Linked lists | Allocation/node model and list variants, primitive operations, polynomial lists, GLL | More full circular/doubly-linked pointer traces and GLL traversal practice |
| V — Stacks, expressions, recursion, backtracking | Stack operations, infix/postfix/prefix concepts, conversion and evaluation, recursion, delimiters, backtracking | More prefix conversion and operator associativity edge cases; recursive/backtracking dry-run variety |
| VI — Queues and variants | Array/circular/linked queues, shared/fixed multiple queues, restricted deques, priority direction | More queue boundary traces; priority-queue simulator uses a heap implementation even though that representation is enrichment |

## Structure guides and sandbox inventory

Each entry is served by the learning API and rendered with prerequisites, representation, invariant, operation walkthroughs, complexity reasoning, common mistakes, and self-checks. The “sandbox operations” column names what the current interactive simulator supports; it is not a claim that the listed operation set is complete.

| Structure | Scope tag | Current simulator operations | Notes |
|---|---|---|---|
| Array | Core | Append, animated linear search, delete tail, reset | Fixed small sandbox; no arbitrary index insertion/deletion control |
| Linked list | Core | Prepend, append, delete head, reset | Does not simulate all list variants or arbitrary-node deletion |
| Stack | Core | Push, pop, reset | Basic LIFO state only |
| Queue | Core | Enqueue, dequeue, reset | Basic FIFO state only; circular representation is taught, not simulated here |
| Priority queue | Core ADT | Insert priority, extract minimum, reset | Simulator is a min-heap; heap is an optional implementation choice, not required priority-queue knowledge |
| Heap | Optional enrichment | Insert/sift-up, extract-min/sift-down, reset | Not named as a required syllabus structure |
| BST | Optional enrichment | Insert and in-order display | Unbalanced; no deletion or self-balancing algorithms |
| Hash table | Optional enrichment | Put/update and collision display, reset | Simulator uses its stated collision strategy; hashing is not named as required syllabus content |
| Graph | Optional enrichment | BFS from A, reset | Traverses the fixed demo graph; edge weights are ignored; graph algorithms are not named as required syllabus content |

## Verification boundary

Automated data tests check that all six course units and all nine structure guides are present and shaped as expected, including the learning API's catalog/detail responses. Those tests verify content delivery and required fields; they do not independently prove every educational statement, every UI interaction, accessibility conformance, or small-screen layout. See the active assessment coverage inventory in `FODS_SYLLABUS_COVERAGE.md` for question IDs and question-bank limitations.
