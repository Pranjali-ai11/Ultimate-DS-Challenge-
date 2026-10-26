# Phase 4 — Progress and XP Consistency

## Authoritative rules

- Challenge XP is awarded once when a challenge is first passed. The server uses the configured `reward_xp` value for that challenge; the quiz score percentage is not converted into XP.
- Badge XP is awarded once when the badge record is created. A repeated submission does not award the same challenge or badge reward again.
- All-time XP is the sum of persisted challenge-completion rewards and badge bonuses. The `/progress` endpoint returns this value as `progress.xp` and `progress.xpTotals.allTime`; `weekly` and `monthly` are supplied alongside it. Leaderboard XP uses the same accounting function.
- Weekly and monthly totals are rolling 7-day and 30-day UTC timestamp windows. The lower and upper bounds are inclusive. Both challenge completion timestamps and badge unlock timestamps are included.
- Level unlocks continue to follow the established passed-challenge policy: 3 distinct Level 1 passes unlock Level 2, 3 distinct Level 2 passes unlock Level 3, and 2 distinct Level 3 passes unlock Level 4. Level 1 is available by default. Progress is calculated from known passed challenge IDs, not XP.

## Progress API

`GET /progress` returns the user's derived level, unlocked level, passed challenge total, XP totals, `hasNextLevel`, and `nextUnlock`. `nextUnlock` contains the target level, source level, passed count, required count, and percentage; it is `null` at the final level. The response also includes `completedChallengesByLevel` and catalog-derived `progression` metadata (challenge counts, configured reward values, and unlock thresholds). If the progress row is missing, the read response uses the derived new-learner defaults without creating or updating a row; passed counts ignore challenge IDs absent from the current catalog.

The Dashboard now displays the next unlock as a passed-question count and uses the server percentage. It no longer estimates level progress from XP. Dashboard/Navbar progress is synchronized from `/progress`; Levels and Landing use server progression metadata for challenge counts and reward labels. Challenge detail reward text comes from the challenge's configured reward rather than a repeated fixed label.

## Data limitations

The existing schema records unique completion timestamps and relates each completion to the challenge's current `reward_xp`; it does not snapshot the reward amount on each award. Badge records similarly relate to the configured badge bonus. If those configured amounts are edited later, historical period/all-time totals cannot prove the originally awarded amount. No historical XP events were fabricated, no backfill was run, and no schema migration was added. A future reward-configuration change that must preserve exact historical totals would require immutable award amounts/events and an explicitly planned migration/backfill.

Passed attempts are the evidence used for unlock counts. A stale cached `unlocked_level` without matching passed challenge records is not treated as proof of an unlock. Existing legacy learners whose attempts were deleted but whose cached level remains elevated may therefore see the level derived from retained records; restoring such progress requires verified source records, not an inferred XP conversion.

Leaderboard score/rank ordering was intentionally left unchanged; broader ranking changes remain Phase 7 work. No authentication, quiz scoring, XP amounts, or badge qualification rules were changed.

## Verification results

| Check | Status | Result |
|---|---|---|
| Focused server unit tests (`npx tsx --test src/engine/progressRules.test.ts src/engine/xpAccounting.test.ts src/engine/scoringEngine.test.ts src/engine/quizAnswers.test.ts src/engine/achievementRules.test.ts`) | PASS | 21 passed, 0 failed. Covers established unlock boundaries, stale cached unlocks, challenge/badge XP totals, UTC period boundaries, scoring, answer validation, and achievement rules. |
| Server TypeScript build (`npm run build`) | PASS | Completed successfully. |
| Client progression metadata tests (`node --test src/services/progression.test.js`) | PASS | 2 passed, 0 failed. |
| Client production build (`npm run build`) | PASS | Completed. Vite emitted a non-blocking large-chunk advisory for the generated JavaScript bundle. |
| Client lint (`npm run lint`) | PASS | Exit code 0. Existing warnings remain in unrelated/shared files, including unused imports and React lint advisories. |
| Full server `npm test` / MySQL integration | SKIPPED | The configured integration test clears database tables. This task did not verify a separate disposable test database, so the destructive suite was not run. No migrations were run. |
| Authenticated API/browser journey | BLOCKED | Not exercised in this run; the API response changes are covered by source/build and pure-function tests, not a live database-backed request or browser interaction. |

## Files changed for Phase 4

Backend: `src/engine/progressRules.ts`, `src/engine/progressRules.test.ts`, `src/engine/xpAccounting.ts`, `src/engine/xpAccounting.test.ts`, `src/controllers/progressController.ts`, `src/controllers/challengeController.ts`, `src/controllers/leaderboardController.ts`, and regression assertions in `src/db/mysql.integration.test.ts` (not executed).

Client: `src/types/index.ts`, `src/services/api.ts`, `src/services/progression.js`, `src/services/progression.d.ts`, `src/services/progression.test.js`, `src/context/AuthContext.tsx`, `src/pages/Dashboard.tsx`, `src/pages/LevelSelection.tsx`, `src/pages/LandingPage.tsx`, and `src/pages/ChallengeDetail.tsx`.

No database schema, migration, environment file, or dependency was changed.
