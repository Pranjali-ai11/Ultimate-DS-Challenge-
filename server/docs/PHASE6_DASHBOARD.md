# Phase 6 — Dashboard Completion, Analytics, and Consistency

## Authoritative data flow

The Dashboard uses the existing authenticated `GET /progress` endpoint. That response is now a single aggregation of the active database-backed challenge payloads, distinct passed challenge attempts, persisted progress/reward records, curated topic metadata, and persisted badge definitions/awards. The endpoint remains read-only for reward, completion, badge, streak, and unlock state. A missing `UserProgress` row is represented with zero/default display fields; the GET request no longer creates that row.

| Dashboard value | Source and rule |
|---|---|
| Current level / unlock | Existing `summarizeUserProgress`: distinct passed catalog challenge IDs and unchanged 3 / 3 / 2 thresholds. |
| Total XP | Existing Phase 4 `calculateAllTimeXp`, including recorded challenge rewards and badge bonuses. |
| Overall completion | Distinct passed IDs present in the catalog / distinct catalog challenge IDs, rounded to a whole percent and bounded to 0–100. |
| Next unlock | Existing server `nextUnlock` object, including passed count, required count, and percentage. It is separate from mission completion. |
| Current mission total and passed | Current unlocked level's catalog count from `summarizeProgression` and distinct passed-by-level result from `summarizeUserProgress`. |
| XP per challenge | Existing catalog-derived reward values from progression metadata. |
| Practice Exposure | Distinct passed catalog IDs per curated `coverageTopics` association / distinct available catalog IDs with that topic. Replays and failures do not count. Queue and Deque are separate. |
| Badge count / nearest badge | Actual persisted badge-definition catalog and earned records, with progress from the shared Phase 5 `calculateAchievementProgress` engine. The nearest badge excludes earned and already-eligible badges and selects the highest percentage among measurable count badges; ties resolve by stable code order. |
| Next Step | Deterministic server summary: remaining qualifying passes for the next unlock; otherwise current-level missions; completed/max-level state at full completion. |

Dashboard loading shows a loading state rather than placeholder metrics. A failed progress request shows a retryable error and does not present cached/default values as authoritative. The Dashboard does not request progress per topic/unit/badge; it uses the single aggregated endpoint.

## Current source-catalog counts

Source inspected: `server/src/data/fodsQuestionBank.ts` (`FODS_REQUIRED_CHALLENGES`). Current source contains 95 challenges: levels 1–4 contain 32 / 36 / 15 / 12. Syllabus-unit metadata remains in the catalog, but Syllabus Unit Progress was intentionally removed from the Dashboard during Phase 7 and is no longer returned as dashboard-only analytics. No unit metadata was deleted or inferred.

Current Practice Exposure denominators computed from source `coverageTopics`:

| Topic | Available |
|---|---:|
| Array | 28 |
| Linked List | 13 |
| Stack | 9 |
| Queue | 8 |
| Deque | 6 |
| Priority Queue | 8 |
| Binary Heap | 7 |
| Binary Search Tree | 6 |
| Hash Table | 8 |
| Graph Network | 6 |

No Dashboard exposure calculation uses `optimalStructures`, learner selections, or question-text matching.

## Phase preservation

- Phase 4 unlock thresholds, XP reward/accounting helpers, streak logic, and challenge scoring were not changed.
- Phase 4C's 95-question source catalog, `syllabusUnit` metadata, and `coverageTopics` mappings were not changed. The Dashboard continues to use the existing curated Deque mappings.
- Phase 5 definitions, badge thresholds/rewards, qualification logic, and award-on-submission behavior were not changed. The dashboard summary calls the existing Phase 5 calculation and does not award anything.
- No migration, schema change, destructive test, or leaderboard change was made.

## Phase 6 verification (before approved Phase 7 removal)

| Area | Status | Result |
|---|---|---|
| Source catalog count and topic denominators | PASS | Computed from the active TypeScript source catalog: 95 total, levels 32 / 36 / 15 / 12, and topic counts above. Unit analytics were subsequently removed from the Dashboard by explicit Phase 7 request. |
| Server focused tests | PASS | 60 passed, 0 failed. Includes new dashboard analytics tests plus progression, XP, Practice Exposure, Phase 4C catalog, Phase 5 achievement and relevant validation/scoring tests. |
| Client focused tests | PASS | 50 passed, 0 failed. Includes existing progression and visualizer operation/algorithm tests. |
| Server build | PASS | `npm run build` completed. |
| Client build | PASS | `npm run build` completed; Vite emitted a non-blocking large-chunk advisory (minified JS about 578 kB). |
| Client lint | PASS | `npm run lint` exited 0. Existing project warnings remain; no Dashboard-specific warning remains after the final edit. |
| Database / API | BLOCKED | MySQL/API service was not available for a live check. No migration or database operation was run. |
| Browser / responsive | BLOCKED | No live API-backed browser session was available; layout and cross-page values were not observed in a browser. |
| Destructive MySQL integration suite | SKIPPED | It can clear tables; the test database has not been verified as a separate disposable target. |

There is no client component test runner; client verification used its existing Node test files. Source tests establish derivation and edge-case behavior, but they do not replace live API/browser verification.

## Approved Phase 7 adjustment

The user explicitly requested removal of the Dashboard's Syllabus Unit Progress section. The UI and dashboard-only `/progress` response field/calculator were removed. Existing `syllabusUnit` challenge metadata is preserved for catalog organization and syllabus audits. Current practice exposure, Deque, mission, badges, nearest achievement, next step, and progression fields remain.
