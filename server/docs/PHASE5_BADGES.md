# Phase 5 — Badge and Achievement System

## Definition and award model

Badge definitions are configured in `server/src/data/achievementDefinitions.ts`. The `INITIAL_ACHIEVEMENTS` seed projection stores the existing stable badge code, copy, icon, requirement, and XP bonus in MySQL. The rule configuration also supplies the badge category, topic, target, and calculation type. User progress is calculated on the server from persisted challenge attempts, the active challenge catalog, the current UTC streak, and persisted `UserAchievement` rows.

All structure-badge qualification uses canonical `coverageTopics` from the authoritative challenge catalog. It does not inspect learner selections, `optimalStructures`, question or explanation text, or distractors. Passed challenge IDs are deduplicated; unknown/orphan challenge IDs and failed attempts do not count. A multi-topic challenge contributes once to each applicable badge. Count progress is clamped to its target.

Existing `user_achievements` records are preserved. The existing `(user_id, achievement_id)` unique key and `createMany(skipDuplicates)` continue to prevent duplicate records and duplicate badge XP, including repeated submissions. Badge XP is included through the existing completion-plus-badge XP accounting; no new XP ledger or schema migration was added.

## Final badge inventory

Topic pool sizes were checked against the active 95-question catalog. Targets follow one exposure-based scale: 5 for the large Array pool, 4 for medium pools, and 3 for smaller pools. They do not require full topic completion. Existing topic thresholds are retained except Graph Explorer changes from 2 to 3 so that its six-question pool uses the same small-pool target; its XP reward is unchanged.

| Stable ID | Badge | Type / topic | Target and progress rule | XP | Phase status |
|---|---|---|---|---:|---|
| `first_blood` | First Step | Milestone | 1 distinct passed catalog challenge; `current / 1` | 50 | Existing, copy clarified |
| `array_ace` | Array Ace | Structure / Array | 5 distinct passed challenges tagged `array`; pool 28 | 150 | Added |
| `linked_list_navigator` | Linked List Navigator | Structure / Linked List | 4 distinct passed challenges tagged `linked-list`; pool 13 | 150 | Added |
| `stack_master` | Stack Master | Structure / Stack | 3 distinct passed challenges tagged `stack`; pool 9 | 100 | Existing, qualification corrected |
| `queue_master` | Queue Master | Structure / Queue | 3 distinct passed challenges tagged `queue`; pool 8 | 100 | Existing, qualification corrected |
| `deque_specialist` | Deque Specialist | Structure / Deque | 3 distinct passed challenges tagged `deque`; pool 6 | 100 | Added |
| `priority_strategist` | Priority Strategist | Structure / Priority Queue | 4 distinct passed challenges tagged `priority-queue`; pool 8 | 150 | Added |
| `heap_engineer` | Heap Engineer | Structure / Binary Heap | 3 distinct passed challenges tagged `heap`; pool 7 | 150 | Added |
| `tree_architect` | Tree Architect | Structure / Binary Search Tree | 3 distinct passed challenges tagged `bst`; pool 6 | 150 | Existing, copy and qualification corrected |
| `hashing_expert` | Hashing Expert | Structure / Hash Table | 4 distinct passed challenges tagged `hash-table`; pool 8 | 150 | Existing, copy and qualification corrected |
| `graph_explorer` | Graph Explorer | Structure / Graph | 3 distinct passed challenges tagged `graph`; pool 6 | 150 | Existing, target and copy corrected |
| `hybrid_designer` | Hybrid Designer | Milestone | A passed Level 3 challenge with score 100; status progress | 200 | Existing, copy clarified |
| `system_architect` | Optimization Architect | Milestone | A passed Level 4 challenge with score 100; status progress | 300 | Existing, copy clarified |
| `complexity_master` | Complexity Master | Milestone | A passed challenge with score at least 95; status progress | 200 | Existing, copy and criterion clarified |
| `streak_master` | On Fire | Milestone | Current streak reaches 3 consecutive UTC calendar days; `current / 3 days` | 150 | Existing, copy clarified |

No new badge XP is disproportionate to the existing challenge rewards (100/150/250/400 XP by level). Existing badge XP values were not changed.

## API and user interface

The authenticated `GET /api/achievements` response returns the actual database definition count and each badge’s stable ID, name, description, icon, requirement, category, topic where applicable, XP reward, earned status/date, progress type/label, current/target/percentage where meaningful, eligibility, pending-award status, and almost-earned flag. Earned count is the number of distinct earned badge codes. The client does not calculate qualification.

The Badges page derives its total from the returned list and shows `current / target` plus a progress bar for locked count badges. It shows meaningful status text instead of artificial numbers for composite milestones. Locked count badges one item below target appear in the small “Almost earned” section. Earned cards show the earned state/date; progress is clamped. An empty response is displayed as zero definitions without a fabricated denominator.

The achievements GET endpoint remains read-only. A historical user at/above a target sees complete progress and “Eligible”/“Award is recorded after your next quiz submission.” The next ordinary quiz submission re-evaluates all persisted qualifying history, awards eligible badges in the existing transaction, and records the actual award timestamp then. Users need not replay the previously passed challenge for progress to appear, but a later submission is needed to persist a retroactive award/XP. This avoids mutating XP as a side effect of opening a page and does not fabricate historical timestamps.

## Definition synchronization and persistence

The existing ten badge IDs are retained and five new stable IDs are inserted. At normal initialization, existing badge rows may update only approved display metadata (`name`, `description`, `icon`, `requirement`) when the stable code and XP amount match the configured definition. New definitions are inserted. Existing XP values are guarded against change; earned user rows are not deleted or rewritten. No database migration, wipe, or destructive reseed is required.

## Verification and limitations

- Automated unit tests validate all ten structure topic/target definitions against current catalog coverage; target must not exceed available distinct challenge IDs.
- Unit tests cover distinct passes, replay deduplication, failed attempts, multi-topic mapping, ignoring answer selections/answer-key/text, progress caps, almost-earned state, milestone conditions, and duplicate candidate filtering.
- Safe metadata-sync tests verify approved description/requirement changes while protecting IDs, XP, and unknown fields.
- The full MySQL integration suite was not run for this change because it can clear tables and no separately verified disposable database was available. Database synchronization, API behavior, and real-browser behavior remain unverified live.
- The achievements GET path does not award retroactively; if a prior user is eligible but not yet recorded, the next normal quiz submission records the badge and its XP. No existing attempt or award timestamps are backfilled.
- There is no separate `Mastery` claim: badge progress means passed challenge coverage, not proof of mastery.

### Final Phase 5 verification status

| Check | Status | Result |
|---|---|---|
| Focused server unit tests | PASS | 55 tests passed, 0 failed. Covers achievement rules, metadata synchronization, catalog/Practice Exposure/progress/XP helpers, scoring, learning content, legacy JSON, HTTP errors, and auth-recovery validation. |
| Server TypeScript build | PASS | `npm run build` completed successfully. |
| Client production build | PASS | `npm run build` completed successfully after the badge UI changes. Vite emitted a bundle-size advisory for the 572.89 kB minified JavaScript chunk. |
| Client lint | PASS | `npm run lint` exited 0. Existing warnings remain in app/context, footer, challenges, leaderboard, challenge detail, and visualizer files; no lint error blocked the command. |
| MySQL integration suite / database synchronization | SKIPPED | The integration suite can clear tables. No separately verified disposable test database was available, so it was not run and no badge definitions were synchronized to a live database. |
| Live API and browser verification | BLOCKED | At the final diagnostic, the backend API port and MySQL port had no TCP listener. The rendered badge page and award response could not be verified interactively. |
| Client component test suite | SKIPPED | The client has no `npm test` script or configured component-test runner. Server pure-rule tests cover the badge calculations. |

The read-only API design is intentional. An automatic review rejected changing `GET /api/achievements` into a mutating endpoint that would award badges and XP while a user merely opens the page. The implementation instead reports historical eligibility and records the badge and XP during the next ordinary quiz submission. Immediate retroactive persistence would require a separate explicit reconciliation action or job; it should not be implemented as a GET side effect.

Phase 5 rules and UI are implemented and pass the available source-level tests/build/lint. Live database synchronization, endpoint behavior against MySQL, and browser behavior remain unverified; complete those checks against the intended environment before treating Phase 5 as fully verified or beginning Phase 6.
