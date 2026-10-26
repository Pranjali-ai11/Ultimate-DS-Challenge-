# Phase 7 — All-Time Leaderboard

## Ranking and API

The authenticated `GET /api/leaderboard` endpoint returns only all-time ranking data. The official displayed XP and sort key are the same Phase 4 `calculateAllTimeXp` result: persisted unique challenge-completion rewards plus persisted badge bonuses. Legacy `score` is not queried or used for rank. Replaying a passed challenge does not create another completion reward under the existing completion uniqueness/reward policy; the leaderboard only sums the persisted completion rows and badge award rows.

Ranks are computed server-side across all persisted users, including users with zero XP and users without attempts/progress rows. Level comes from the existing `summarizeUserProgress` using distinct passed challenge IDs present in the active catalog, preserving the 3 / 3 / 2 progression requirements; XP does not determine level.

Ordering is:

1. All-time XP descending.
2. Account creation timestamp ascending.
3. Stable user ID ascending.

Positions are unique sequential integers, including tied and zero XP values. The endpoint returns the Top 20 plus the authenticated user's globally ranked record. The current-user record is not repeated in the separate “Your Rank” display when already present in the Top 20. The list is read-only. No user, attempt, progress, completion, streak, award, or persisted rank data is created or updated by the leaderboard controller.

Weekly/monthly leaderboard modes are deliberately excluded; Phase 4 weekly/monthly XP accounting helpers remain untouched. A non-all-time timeframe query is rejected. No schema migration was needed.

## Dashboard adjustment

The Dashboard's Syllabus Unit Progress cards and their dashboard-only API analytics were removed by explicit product request. Existing challenge `syllabusUnit` metadata and syllabus audit documentation remain unchanged. Practice Exposure, including its separate Deque row, overall completion, Current Mission, next unlock, badges, nearest badge, and deterministic Next Step remain.

## Verification

| Area | Status | Result |
|---|---|---|
| Ranking helper and mode tests | PASS | Covers authoritative XP rather than legacy score, badge XP, stable ties, multiple zero-XP users, only-user rank #1, level from passed challenges, replay reward rows, Top 20, exact outside-window global rank, and rejection of weekly/monthly modes. |
| Dashboard source regression | PASS | Confirms the syllabus unit section is absent and Practice Exposure, Deque, mission, badge, nearest badge, and Next Step remain present. |
| Phase 4/4C/5/6 focused regressions | PASS | 66 server tests and 52 client Node tests passed, including progression, XP, catalog, exposure, badge, dashboard, and visualization regression tests. |
| Server build | PASS | `npm run build` completed. |
| Client build | PASS | `npm run build` completed; Vite reported the existing non-blocking >500 kB bundle advisory. |
| Client lint | PASS | `npm run lint` exited 0 with existing warnings outside the changed leaderboard/dashboard implementation. |
| Database/API/browser | BLOCKED | Final local TCP checks found no listener on API port 5000 or MySQL port 3306. Do not run destructive tests against an unverified database. |
| MySQL integration suite | SKIPPED | The suite can clear tables; the target was not verified as a separate disposable test database. |
| Responsive browser checks | BLOCKED | Requires live browser/API availability. |

No weekly/monthly leaderboard, prizes, seasons, leagues, pagination, or social features were added.
