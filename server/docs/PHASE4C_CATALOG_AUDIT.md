# Phase 4C — Challenge Catalog Audit

## Source, semantics, and scope

The authoritative active source is `FODS_REQUIRED_CHALLENGES` in `server/src/data/fodsQuestionBank.ts`; `server/src/data/seedData.ts` consumes it as `INITIAL_CHALLENGES`. It contained 61 active challenges before this task and now contains 95. The optional enrichment bank remains separate and is not included in the active denominator. All existing challenge IDs were preserved.

`optimalStructures` remains the answer/scoring contract and is no longer used as a proxy for topic coverage. Each active challenge has curated canonical `coverageTopics`, assigned from the concept required by the prompt and checked against answer/options/requirements/explanations. Incidental prompt words or distractor options do not add mappings. A genuinely multi-topic question may map to more than one topic. The current challenge schema has no hidden/archived availability flag, so every active catalog ID is considered available.

The complete 95-record audit table, including ID, level, difficulty, unit/category, title, prompt, answer metadata, and curated mappings, is in [PHASE4C_CHALLENGE_INVENTORY.md](PHASE4C_CHALLENGE_INVENTORY.md).

## Report A — before corrections

These are the previously reported counts from treating answer/scoring metadata as topic association. They describe the problem being corrected, not reliable topic coverage. Counts are total followed by Level 1 / 2 / 3 / 4.

| Topic | Total | L1 | L2 | L3 | L4 |
|---|---:|---:|---:|---:|---:|
| Array | 28 | 13 | 2 | 9 | 4 |
| Linked List | 9 | 2 | 4 | 1 | 2 |
| Stack | 10 | 5 | 1 | 3 | 1 |
| Queue | 4 | 0 | 1 | 2 | 1 |
| Deque | 2 | 0 | 1 | 1 | 0 |
| Priority Queue | 2 | 1 | 1 | 0 | 0 |
| Binary Heap | 0 | 0 | 0 | 0 | 0 |
| Binary Search Tree | 0 | 0 | 0 | 0 | 0 |
| Hash Table | 0 | 0 | 0 | 0 | 0 |
| Graph Network | 0 | 0 | 0 | 0 | 0 |

## Existing catalog after mapping correction and before additions

These counts are calculated from the curated mappings on the original 61 IDs, before adding the new questions.

| Topic | Total | L1 | L2 | L3 | L4 |
|---|---:|---:|---:|---:|---:|
| Array | 25 | 7 | 5 | 9 | 4 |
| Linked List | 11 | 2 | 6 | 1 | 2 |
| Stack | 9 | 4 | 1 | 3 | 1 |
| Queue | 4 | 0 | 1 | 2 | 1 |
| Deque | 2 | 0 | 1 | 1 | 0 |
| Priority Queue | 2 | 1 | 1 | 0 | 0 |
| Binary Heap | 0 | 0 | 0 | 0 | 0 |
| Binary Search Tree | 0 | 0 | 0 | 0 | 0 |
| Hash Table | 0 | 0 | 0 | 0 | 0 |
| Graph Network | 0 | 0 | 0 | 0 | 0 |

Array had been over-associated by three relative to the audited existing content: 28 raw associations became 25 curated associations. General complexity/pseudocode questions and incidental answer labels are not Array practice. The retained Array tags refer to actual array representation, indexing, operation, address calculation, search, or sorting concepts.

## Report B — final catalog distribution

The active catalog now has 95 challenges: Level 1 = 32, Level 2 = 36, Level 3 = 15, Level 4 = 12. Per-topic totals count distinct catalog challenge IDs. This is not a quota-equality target; it is content-based coverage.

| Topic | Total | L1 | L2 | L3 | L4 |
|---|---:|---:|---:|---:|---:|
| Array | 28 | 7 | 6 | 10 | 5 |
| Linked List | 13 | 2 | 6 | 2 | 3 |
| Stack | 9 | 4 | 1 | 3 | 1 |
| Queue | 8 | 1 | 2 | 3 | 2 |
| Deque | 6 | 1 | 2 | 2 | 1 |
| Priority Queue | 8 | 2 | 2 | 2 | 2 |
| Binary Heap | 7 | 2 | 2 | 2 | 1 |
| Binary Search Tree | 6 | 2 | 2 | 1 | 1 |
| Hash Table | 8 | 2 | 2 | 1 | 3 |
| Graph Network | 6 | 2 | 2 | 1 | 1 |

Other canonical topic counts (total [L1/L2/L3/L4]):

| Topic | Total | L1 | L2 | L3 | L4 |
|---|---:|---:|---:|---:|---:|
| Searching | 7 | 2 | 5 | 0 | 0 |
| Sorting | 12 | 4 | 7 | 0 | 1 |
| Matrix / Sparse Matrix | 5 | 2 | 0 | 2 | 1 |
| Polynomial | 5 | 0 | 3 | 1 | 1 |
| Expressions | 5 | 2 | 1 | 1 | 1 |
| Recursion / Backtracking | 4 | 1 | 1 | 1 | 1 |
| Complexity | 5 | 3 | 1 | 0 | 1 |
| Flowchart / Pseudocode | 2 | 2 | 0 | 0 | 0 |
| Algorithm Design | 2 | 0 | 2 | 0 | 0 |
| Generalized Linked List | 2 | 0 | 2 | 0 | 0 |
| External Sorting | 1 | 0 | 0 | 0 | 1 |

Every major data structure in the first table has representation at each of the four levels. Array remains the largest pool because it is directly tested by array operations, address calculations, searches, sorts, and sequential storage topics; its curated share is 28 of 95 (29.5%), down from 28 of 61 (45.9%) under the old inferred mapping. Linked List at 13 includes legitimate linked-list/GLL/polynomial and combined-structure questions. No major structure remains at zero or has a zero-count level.

Some non-structure algorithm/topic labels remain concentrated by level: Searching has no L3/L4-tagged record; Sorting has no L3-tagged record and one L4 record; Matrix/Sparse Matrix has no L2 record; Polynomial has no L1 record. These are visible syllabus-depth opportunities, not grounds for assigning unrelated mappings. They are recorded for future content planning rather than filled with extra questions in this structure-balancing pass.

## Mapping corrections and new challenge groups

- All 61 existing records now have explicit curated topic mappings. The project previously inferred exposure from `optimalStructures`, a field designed for answer selection; it undercounted linked-list/queue concepts and had zero coverage for several supported structures while over-associating generic topics with Array. Explicit metadata separates the two meanings.
- Seven existing Level 1 feedback labels were corrected to match their actual concept: c-l1-05 (sorting), c-l1-10 (complexity), c-l1-11 (flowchart/pseudocode), c-l1-12 (complexity), c-l1-13 (flowchart/pseudocode), c-l1-14 (complexity), c-l1-19 (recursion). Level 1 answer IDs and correctness remain unchanged; these labels are non-scoring feedback metadata.
- 34 new challenges were added: c-l1-22–32 (11), c-l2-26–36 (11), c-l3-10–15 (6), and c-l4-07–12 (6). Questions cover queue/deque/PQ/heap/BST/hash/graph with operation traces, selection/use cases, edge behavior, and trade-offs rather than repeated definitions. Level/difficulty distribution follows the existing four stages; the supplementary structures do not receive invented syllabus units.
- Exact prompts and each challenge’s answer metadata and topic tags appear in the linked record-by-record inventory. Automated catalog tests validate prompt uniqueness, IDs/slugs, level and syllabus metadata, valid options and answers, rationales, hybrid requirements, and canonical mappings.

## Practice Exposure and progression

The calculation remains `distinct passed challenge IDs tagged for a topic / distinct active catalog IDs tagged for that topic × 100`. Replays are deduplicated, failed attempts are excluded, and a multi-topic challenge contributes once to each mapped topic. The denominator is built from the authoritative catalog, not hard-coded. Dashboard exposure denominators are Array 28, Linked List 13, Stack 9, Queue 8, Priority Queue 8, Binary Heap 7, Binary Search Tree 6, Hash Table 8, and Graph 6. Deque has six tagged challenges but is not added to the existing Dashboard card in this phase. None of the nine displayed topics has a zero denominator.

At Phase 4C close, the Dashboard exposure list contained the nine topics shown above and did not yet show Deque. Phase 6 adds Deque as a separate row; its current denominator is six from the same curated `coverageTopics` source, and it is not merged with Queue.

Level unlock thresholds, XP per level, reward accounting, replay reward rules, badge XP, streaks, and leaderboard logic were not changed. New rewards use the established per-level values (100/150/250/400 XP). The server builds progression totals from the returned challenge catalog, and the existing client consumes that progression response; totals are not hard-coded to 61. Normal initialization inserts new IDs and permits only constrained metadata-only payload updates. It does not delete challenges or attempt/completion records. No migrations or destructive reseed were run. Database/API synchronization was not live-verified.

## Badge readiness input (Phase 5 not started)

Initial challenge pools are available for Array (28), Linked List (13), Stack (9), Queue (8), Heap (7), BST/Tree (6), Hashing (8), and Graph (6). These provide meaningful multi-level question coverage to inform later badge criteria. This does not define badge requirements or imply mastery; faculty review remains appropriate.

## Verification status

| Check | Status | Notes |
|---|---|---|
| Catalog and exposure focused tests | PASS | 53 selected non-MySQL tests passed, including catalog integrity, mappings, exposure, progression, XP, scoring, validation and catalog-sync safety. |
| Server build | PASS | `npm run build` in `server/`. |
| Client build | PASS | `npm run build` in `client/`; existing bundle-size advisory remains. |
| Client lint | PASS | `npm run lint` exited 0; pre-existing warnings remain. |
| Full `npm test` suite | BLOCKED | The package script includes destructive MySQL integration tests. An attempted run could not connect to localhost:3306 at its first database-clearing call, so no table operation succeeded and no database rows were changed. The suite did not pass; do not rerun without a separately verified disposable DB. |
| Live database/API synchronization | BLOCKED | No connection to the configured MySQL service was established; the catalog initializer was not run against user data. |
| Real-browser challenge journeys | SKIPPED | No browser challenge-flow verification was performed in this catalog task. |

The active application has no archived/hidden challenge status. Browser/API checks and database catalog synchronization remain final QA items; Phase 4C content/catalog work does not claim those checks passed.
