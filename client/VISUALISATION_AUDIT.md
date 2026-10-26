# Visualisation Section Audit

## Scope and evidence

This update covers the existing Learn Hub Visualisation workspace and the five previously unavailable topics. Interactive state remains local to the visualizers. No server, Prisma, environment, authentication, scoring, or database files were changed. The Explore Structures tab remains a reference/learning view without the interactive sandbox; interactive demonstrations remain in Visualisation.

The syllabus coverage document at `server/docs/FODS_SYLLABUS_COVERAGE.md` identifies matrix addressing/sparse operations, polynomial operations, expression conversion/evaluation, recursion/backtracking, and restricted deques as relevant course content. The client now has implementations for the operations listed below. Source presence and automated engine tests do not establish browser behavior.

## Visualiser inventory

| Topic | Available interactions | Engine / state | Automated evidence | Browser status |
|---|---|---|---|---|
| Array | Insert at index/end, delete at index/last, update, linear search, traverse, sorted merge, address calculation | Existing array operation engine and shared playback | Existing structure-operation tests passed in this run | Pending; no new browser interaction performed |
| Searching | Linear, Sentinel Linear, Binary, Recursive Binary, Fibonacci | Existing `algorithmSteps.js` snapshots/playback; sorted-copy search retains original indexes | Existing algorithm tests passed in this run | Pending |
| Sorting | Bubble, Selection, Insertion, Shell, Merge, Quick, Heap, Counting, Radix, Bucket | Existing algorithm step generators/playback | Existing algorithm tests passed in this run | Pending |
| Compare Lab | Compare available search/sort algorithms on common configured input | Existing comparison flow and algorithm statistics | Existing code retained; no dedicated UI interaction test | Pending |
| Linked List | Singly, circular, doubly, doubly circular operations | Existing structure-operation engine and pointer models | Existing tests passed in this run | Pending |
| Stack | Push, pop | Existing unbounded stack model | Existing tests passed in this run | Pending |
| Queue | Enqueue rear, dequeue front; available representation selector | Existing queue models | Existing tests passed in this run | Pending |
| Priority Queue / Heap | Insert, extract minimum | Existing min-heap model | Existing tests passed in this run | Pending |
| Binary Search Tree | Insert, search, traversal orders | Existing BST model | Existing tests passed in this run | Pending |
| Hash Table | Insert/update, search, delete with chaining | Existing hash table model | Existing tests passed in this run | Pending |
| Graph | BFS preparation/traversal | Existing fixed graph BFS engine | Existing tests passed in this run | Pending |
| Matrix and Sparse Matrix | Row-major and column-major address calculation; dense to 3-tuple; simple transpose; fast transpose; sparse addition | New pure matrix step generators plus shared additional-topic playback card | Matrix formulas, conversion, transpose equivalence, fast transpose, and addition covered by new tests | Pending |
| Polynomial | Polynomial addition and multiplication | New coefficient/exponent parser and step generator; matching powers combined | Addition, multiplication, and like-term combination covered by new tests | Pending |
| Expressions | Infix to postfix; infix to prefix; postfix evaluation; balanced parentheses | New token/stack step generator | Conversions, evaluation, balanced and unbalanced input covered by new tests | Pending |
| Recursion and Backtracking | Factorial; Fibonacci call tree; tail-style factorial; head recursion; indirect recursion; N-Queens (4–6); editable 5×5 maze | New call/backtracking step generators | Factorial/Fibonacci, N-Queens solution count, and maze path/no-path covered by new tests | Pending |
| Deque | Insert/delete/peek both ends; standard, input-restricted, output-restricted modes; capacity 1–8 | New fixed-capacity circular-buffer model with rule enforcement and operation snapshots | End operations, overflow/underflow, and restricted rules covered by new tests | Pending |

## Implementation details and limits

- The five formerly unavailable topic choices now use the shared Step 3 additional-topic card and a dedicated engine; the old unavailable badges/messages for these topics were removed from the topic configuration.
- Matrix dimensions are capped at 6×6. Address calculation shows the formula and a generated cell/storage trace. Fast transpose computes column counts, start offsets, and destinations from the entered tuples.
- Polynomial input is parsed as coefficient/exponent terms; addition merges exponents and multiplication combines like powers.
- Expression operations show token/stack/output states. Postfix evaluation accepts whitespace-separated integer operands and supported arithmetic operators; parentheses validation handles `()`, `[]`, and `{}`.
- Factorial inputs are capped at 10 and recursive Fibonacci at 7 to keep their actual execution traces readable. N-Queens supports 4–6. The maze is an editable 5×5 grid.
- Deque is a fixed-capacity circular buffer (capacity 1–8). Input-restricted mode blocks front insertion; output-restricted mode blocks rear deletion. State is retained when switching deque operations in the hub.
- Binary Search’s sorted-copy notice is now cyan/blue informational styling and continues to retain original input indexes.
- Shared controls include Play, Pause, Previous, Next, Reset, speed, step position, and status. Their behavior has been source-reviewed but not browser-interacted in this run.
- Complexity labels describe the operation algorithm; visualizer snapshots also retain execution history for playback, so memory used by a full trace can exceed algorithm auxiliary-space complexity.

## Automated verification

Commands executed from `client/`:

```text
node --test src/components/visualizers/algorithmSteps.test.js src/components/visualizers/structureOperations.test.js src/components/visualizers/additionalTopicSteps.test.js
npm run build
npm run lint
```

| Check | Status | Result |
|---|---|---|
| Focused Node test suites | PASS | 47 passed, 0 failed across algorithm, structure-operation, and new additional-topic engine tests |
| TypeScript + Vite production build | PASS | `tsc -b` and Vite build succeeded; Vite emitted its existing >500 kB chunk advisory (largest JS output 568.72 kB) |
| Client lint | PASS | `oxlint` exited 0 with warnings in existing project files; no lint error blocked the command |
| `npm test` | SKIPPED | No `test` script is defined in `client/package.json`; focused tests were run directly with Node’s existing test runner |

## Browser verification and blocker

**BLOCKED — no visualizer browser interaction was completed.** Edge was open at the requested Visualisation route but displayed `ERR_CONNECTION_REFUSED`. The existing Vite dev script was started and reported `http://127.0.0.1:3000/` ready, but Edge subsequently reported `ERR_CONNECTION_TIMED_OUT`; a same-environment HTTP request also failed. No topic, operation, playback control, responsive viewport, or Explore Structures interaction is marked browser-verified.

To unblock, start the client dev server in the same Windows network context used by the browser (`cd "C:\Users\LENOVO\Desktop\FODS CP\client"; npm run dev -- --host 127.0.0.1`) and open `http://127.0.0.1:3000/learn?tab=visualisation`. If the current execution environment cannot expose its localhost listener to Edge, run the command from a Windows terminal on the desktop and then repeat the browser checks.

## Manual checks still required

1. Confirm each previously unavailable topic appears without an unavailable badge and maps to its listed operations.
2. Run both matrix address formulas, sparse conversion/transposes/addition, and inspect tuple/grid changes.
3. Run polynomial addition and multiplication with matching and nonmatching exponents.
4. Step through both infix conversions, postfix evaluation, and balanced/unbalanced parentheses.
5. Step through factorial call/return, Fibonacci call tree, N-Queens, and both a solvable and blocked maze.
6. Exercise deque capacity boundaries and disallowed actions in each mode; confirm state persists across deque operation selection.
7. Check category/topic switching, Play/Pause/Previous/Next/Reset/speed, keyboard focus, and desktop/mobile layout.
8. Confirm Explore Structures remains educational content only and existing Visualisation topics still render their own stages.

No database migration or integration test was run. No browser result is claimed. Phase 3 verification of these topics remains incomplete until the manual browser checks above can be performed.
