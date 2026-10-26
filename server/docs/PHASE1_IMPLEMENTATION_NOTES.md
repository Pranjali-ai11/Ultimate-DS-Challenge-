# Phase 1 Foundation and Integration Notes

## Topic registry and links

`src/data/topicRegistry.ts` derives question membership from the existing curated `coverageTopics` tags, connects those topics to real course lesson IDs, reference guides, and existing Visualisation Hub choice IDs, and normalizes established aliases. The public Learn catalog now includes the registry and stable lesson IDs. Unknown challenge topic filters return a validation error; unknown learning/visualizer deep links fall back safely.

The custom router now preserves the complete path, query, and hash on initial load and browser history navigation. Supported app routes include `/learn?topic=stack`, `/learn?tab=visualisation&topic=stack&subtopic=Push%20value`, `/learn?tab=structures&topic=stack`, and `/challenges?topic=graph`. `/visualizer` is adapted to the existing route `/learn?tab=visualisation`.

## Saved question answers

`ChallengeAttempt` remains the question-level persisted record (`id`, `challenge_id`, score/status, and completion timestamp). New records also use `submission_id` to group one submitted quiz, and `feedback` JSON stores the original level-specific submitted answer, server-calculated review/correct answer, curated topic tags, syllabus subtopic, and format version. The answer keys remain server-side and are returned only by the authenticated owner-scoped `GET /api/results/:id` endpoint. The client links to `/results/:submissionId` after submission.

Submissions require a client-generated UUID. The server serializes submissions for a user, rejects reuse of a submission UUID, and the schema has a unique `(user_id, submission_id, challenge_id)` constraint. A retry after a lost response can open the already saved review instead of writing duplicate question rows. Existing attempts without detailed feedback remain intact and are shown as historical; their answers are not reconstructed.

## Score storage

`score` remains the awarded question score and `correctness_score` remains its directly measured correctness equivalent. The previous writer copied that same score into performance, memory, complexity, simplicity, and explanation fields, although those dimensions are not measured by the existing quiz. New writes leave those five fields `NULL`. The migration makes only those five columns nullable without altering existing values and adds the submission grouping field/index. No frontend reads these component fields.

## Database step still required

The additive migration is `prisma/migrations/20261025000000_phase1_review_persistence/migration.sql`. It has **not** been applied in this work because the database target has not been verified as a separate disposable development database. Apply it only through the project's normal migration workflow after confirming the target and taking any required backup. The server's new attempt writes require this migration first.

## Coverage report and verification

The catalog/topic snapshot is generated at `docs/PHASE1_TOPIC_COVERAGE.md` from the current 95-question source and registry. Regenerate it from `server/` with `npm run report:topics`.

Checks run in this implementation pass:

- PASS — `npm run db:generate` in `server/`.
- PASS — `npm run build` in `server/`.
- PASS — 74 non-MySQL server tests via `npx tsx --test` with `mysql.integration.test.ts` excluded.
- PASS — 60 client Node tests via `node --test` over `src/**/*.test.js`.
- PASS — `npm run build` in `client/`.
- PASS — `npm run lint` in `client/` (exit 0; it reports existing lint warnings).
- PASS — `npx prisma validate` in `server/`.
- SKIPPED — MySQL integration tests and applying the migration; the configured DB has not been verified as disposable for this task.
- PENDING — Actual browser checks of refresh/back/forward, submission, and saved result review.

Quiz scoring, challenge formats, rewards, unlock thresholds, achievements, and leaderboard rules were not changed. MySQL-backed integration tests and actual browser journeys remain unverified; the automated test/build results are recorded in the final task report.
