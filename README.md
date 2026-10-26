# Ultimate DS Challenge

An educational quiz platform that teaches data structures through real-world scenarios, trade-off questions, hybrid architecture selection, and system optimization challenges.

## Four-level progression

| Level | Track | Questions | Format |
| --- | --- | ---: | --- |
| 01 | Foundation | 21 | Single-select fundamentals |
| 02 | Strategist | 25 | Single-select trade-off scenarios |
| 03 | Hybrid Designer | 9 | Multi-select architecture with partial credit |
| 04 | Optimization Architect | 6 | Multi-select system optimization |

The active syllabus-based assessment contains 61 questions. Optional enrichment content is not counted toward required progress.

The server scores all submissions. Level 1 uses private answer keys; Level 2 uses the configured single best choice. Levels 3 and 4 award partial credit according to satisfied critical requirements. Passed challenges award completion XP once; replay attempts remain recorded but do not award duplicate completion XP.

A learning streak advances at most once per UTC calendar day when a non-empty quiz submission is accepted. Repeated submissions on one UTC date do not add streak days; a missed UTC date resets the streak to one on the next accepted answer.

## Technology

- React, TypeScript, Vite, and Tailwind CSS
- Node.js, Express, and TypeScript
- MySQL persistence through Prisma, with checked-in migrations and relational constraints
- JSON import tool for the retained legacy store (`server/db_store.json` and `server/db_store.json.bak`)
- JWT authentication (set `JWT_SECRET` to at least 32 characters)

## Run locally

Configure MySQL, `DATABASE_URL`, and `JWT_SECRET`, apply migrations, then run the optional safe JSON import. The import is dry-run by default and never overwrites existing database records. Setup commands, test database guidance, import behavior, and troubleshooting are in [`server/docs/MYSQL_SETUP.md`](server/docs/MYSQL_SETUP.md). Password reset requires an email delivery provider and remains disabled until one is configured.

Start the server:

```bash
cd server
npm install
npm start
```

Start the client in a second terminal:

```bash
cd client
npm install
npm run dev
```

## Tests and checks

From the `server` directory, generate the client, apply migrations, and run server tests. To exercise MySQL integration tests, configure `TEST_DATABASE_URL` to a separate disposable MySQL database whose name contains `test`:

```powershell
npm run db:generate
npm run db:migrate:deploy
npm test
npm run build
```

From the `client` directory, run the production typecheck/build and lint:

```powershell
npm run build
npm run lint
```

Without `TEST_DATABASE_URL`, the MySQL integration test is reported as skipped; unit tests for the scoring, streak, achievement, learning content, and JSON importer parser do not require MySQL. The client currently has no automated component test runner.

## Main source locations

- `client/src/pages/ChallengeDetail.tsx` — sequential quiz, submission, and review UI
- `client/src/pages/LevelSelection.tsx` — four-level progression view
- `client/src/pages/ChallengesHub.tsx` — mission catalog and quiz routing
- `server/src/controllers/challengeController.ts` — quiz submission and progress updates
- `server/prisma/schema.prisma` — MySQL relational schema and constraints
- `server/src/db/importLegacyJson.ts` — insert-only, repeatable JSON import
- `server/src/engine/requirementEngine.ts` — requirement coverage and answer derivation
- `server/src/engine/scoringEngine.ts` — single-select and multi-select scoring
- `server/src/engine/achievementRules.ts` and `progressRules.ts` — reward qualification and UTC streak policy
- `server/src/data/seedData.ts` — all challenge and learning data
