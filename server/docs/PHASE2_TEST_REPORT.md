# Phase 2 Test Report

## 1. Project and scope

Project: Ultimate DS Challenge (React, TypeScript, Vite, Express, Prisma, MySQL).
Scope: Phase 2 baseline, backend and frontend checks, database safety review, confirmed documentation correction, and verification. No features or application behavior were changed.

Environment: Windows PowerShell, Node.js v24.19.0, npm 11.17.0. The supplied project folder does not contain Git metadata, so branch and working-tree status could not be verified.

## 2. Baseline results

Inspected the root, client, and server package manifests; root/client/server lockfiles; existing server tests; MySQL integration test; Prisma schema and checked-in migration; MySQL setup guide; and the previous Phase 2 report.

Available scripts include server build, test, Prisma generate/migrations and dev; client build, lint and dev. The root build script runs only the client build. Client build includes TypeScript checking and Vite production compilation.

Both nested lockfiles were compatible with package manifests in offline dry runs. npm ci completed for root, client, and server in the prior Phase 2 run. Server install reported zero vulnerabilities. The initial client audit reported 9 findings (2 moderate, 7 high). This continuation applied a narrow client lockfile update: Vite and source-map-js were upgraded to patched compatible releases, reducing the audit to 7 findings (2 moderate, 5 high). The client manifest remains unchanged and Tailwind CSS remains on version 3.

## 3. Commands and diagnostics

| Command or check | Status | Notes |
|---|---|---|
| npm ci (root) | PASS | Root lockfile installed; no dependencies or vulnerabilities reported. |
| npm ci (client, before dependency remediation) | PASS | 106 packages installed; npm reported 9 vulnerabilities (2 moderate, 7 high). |
| npm ci (server) | PASS | 112 packages installed; npm reported zero vulnerabilities. Lifecycle scripts were restricted by npm policy; Prisma generation was run separately. |
| npm ci --dry-run --ignore-scripts --offline (client and server) | PASS | Both nested lockfiles resolved without network access. |
| npm ls --depth=0 (server) | PASS | Installed server dependency tree was valid before clean installs. |
| npm run db:generate (server) | PASS | Prisma Client generated successfully after npm ci. |
| npm run build (server) | PASS | TypeScript build completed. The first sandboxed attempt could not write to the Desktop project; rerun with project write access succeeded. |
| npm test (baseline) | FAIL | 37 tests passed; the MySQL integration case failed connecting to localhost:3306 at its first table-clear call. No rows were cleared. |
| npm test with TEST_DATABASE_URL temporarily empty | PASS | 37 passed, 1 database integration test skipped. This reran the non-database suite without database access. |
| npm run build (root) | PASS | Verified the root script delegates only to the client production build. |
| npm run build (client) | PASS | TypeScript checking and Vite production compilation completed. |
| npm run lint (client) | PASS | Exit code 0; existing Oxlint warnings for unused imports/variables and React effect/fast-refresh patterns remain. |
| Test-NetConnection localhost:3306 | FAIL | TCP connection was unavailable. No mysqld/mysql process was running. |
| Local app listener check (ports 3000, 3001, 4173, 5173, 8080) | BLOCKED | None of the checked ports had a listener. |
| Browser inventory | BLOCKED | In-app browser is available, but has no tabs; no running project page was available to test. |
| npm audit --json (project root) | PASS | Root package has no dependencies; this result does not represent the client audit. |
| npm audit --json (client, before remediation) | FAIL | npm exited 1 with 9 findings: 2 moderate and 7 high. Initial sandboxed registry access failed DNS resolution; the authorized retry retrieved the audit findings. |
| npm explain (affected client packages) | PASS | Confirmed the dependency paths summarized in section 8. |
| Database migration status | SKIPPED | MySQL was unreachable; no migration-status command, migration, or database test was run. |
| npm update vite fast-glob postcss-nested source-map-js --package-lock-only (client) | PASS | Narrow lockfile update; package.json unchanged. Vite 8.3.1 to 8.3.5 and source-map-js 1.2.1 to 1.2.2; Tailwind CSS stayed at 3.4.19. |
| npm ci (client, after dependency remediation) | PASS | 106 packages installed; npm reported 7 remaining vulnerabilities (2 moderate, 5 high). |
| npm audit --json (client, after remediation) | FAIL | npm exited 1 because 7 findings remain (2 moderate, 5 high), all in the Tailwind CSS 3 dependency group. |
| npm run build (client, after remediation) | PASS | Vite 8.3.5 production build and TypeScript check completed. |
| npm run lint (client, after remediation) | PASS | Exit code 0; existing Oxlint warnings remain. |

| Get-Service -Name MySQL80 (default context) | BLOCKED | Windows denied access to the Service Control Manager. An elevated read-only service query later succeeded. |
| Get-Service and Win32_Service query (elevated) | PASS | MySQL80 is installed and reports Running (automatic start); mysqld.exe process exists. |
| Test-NetConnection localhost, 127.0.0.1, and ::1 -Port 3306 | FAIL | All addresses refused/unavailable; no configured TCP endpoint is reachable. |
| Inspect MySQL my.ini listener options | PASS | MySQL configuration specifies port 3306; no bind-address or skip-networking override was found in inspected server options. |
| npm audit --json (client, current) | FAIL | Exit code 1; 7 findings remain (5 high, 2 moderate). No dependency files were changed. |
| npm explain (remaining packages) | PASS | All seven findings resolve through the direct Tailwind CSS dev dependency; none are production dependencies. |
| npm view current affected major versions | PASS | Latest registry releases remain braces 3.0.3, chokidar 3.6.0, fast-glob 3.3.3, micromatch 4.0.8, postcss-nested 6.2.0, postcss-selector-parser 6.1.5, and Tailwind CSS 3.4.19. |
| npm audit fix --dry-run --json | BLOCKED | Automatic review rejected the invocation as a prohibited npm audit fix command. It did not execute and no files changed. |
| Browser inventory | PASS | In-app browser is available but has no tabs; no running application page is open. |
| App listener check (ports 3000, 5000, 5173) | PASS | The diagnostic completed and found no listeners before this browser check. |
| npm run dev -- --host 127.0.0.1 (client, first attempt) | FAIL | Vite could not write its temporary config under the Desktop project due EPERM. |
| npm run dev -- --host 127.0.0.1 (client, retry) | PASS | Started Vite 8.3.5 at 127.0.0.1:3000 for frontend-only browser testing; stopped it after checks. |
| npm run dev (server) | SKIPPED | Server startup against the unverified normal database was not attempted; no API/database test environment was available. |
| Signed-out protected route browser check | PASS | Opening /dashboard without a token rendered the sign-in gate. Logout revocation and signed-in access were not tested. |
| npm run build (client, first after API fix) | FAIL | TypeScript rejected the helper response type; corrected the type and reran the build. |
| npm run build (client, after type correction) | PASS | TypeScript and Vite production build passed after the API error-handling fix. |
| npm run lint (client, after API fix) | PASS | Oxlint exited 0; pre-existing warnings remain. |
| MySQL migrations and integration test | SKIPPED | No listener was reachable and test database disposability could not be established; migrations and table-clearing tests were not run. |
| Interactive website journeys | BLOCKED | App/API were not running and no browser tab was available; individual journey checklist is in section 11. |

## 4. Backend test results

The non-database suite passed after installation: scoring and quiz answers, progress/streak rules, achievements, learning content and question bank, request validation, error handling, and legacy JSON parsing.

The initial full npm test command automatically invoked the integration case because server/.env contains TEST_DATABASE_URL, before I had established that the target was disposable and safe to clear. This was an unsafe invocation under the stated preconditions. It failed at its first deleteMany call because MySQL was unavailable, so no database operation succeeded and no rows were cleared. I did not rerun the integration test. The later run explicitly set TEST_DATABASE_URL empty and passed the 37 non-database tests with the integration case skipped.

## 5. Frontend build and lint results

The client-only Vite server started after retrying with access to write its temporary config in the supplied Desktop project. The landing page loaded in the in-app browser. The backend was not started because the configured normal database is unverified and the database service does not accept TCP.

Browser checks completed:
- BST sandbox: inserted 42 and verified sorted traversal; a repeated 42 was ignored with the expected status; blank input was rejected with an integer validation message; Reset Canvas restored the default tree. **PASS** for these tested operations.
- Registration form: invalid email was rejected by browser validity checks without submission. **PASS**.
- Offline API error handling: before the fix, submitting a valid local test payload with the API unavailable showed a raw JSON parser exception. After the fix, the same action showed “The service is unavailable. Please try again later.” **PASS after correction**. No account was created.
- Other end-to-end journeys that require an API or database were not performed.

The production build passed after the API response handling correction. Lint passed with existing warnings.
## 6. MySQL integration-test status

**BLOCKED; MySQL integration did not pass. No migration or integration test was run in this continuation.**

Sanitized configuration inspection found DATABASE_URL, TEST_DATABASE_URL, and JWT_SECRET in server/.env; none were set in the current PowerShell process. DATABASE_URL parses as MySQL localhost:3306 database fods_challenge. TEST_DATABASE_URL parses as MySQL localhost:3306 database fods_challenge_test. The values are distinct, the test database name contains “test,” and both URLs point to the same host and port. Credentials and complete values were not displayed.

The MySQL80 Windows service is installed and currently reports Running with automatic start. The mysqld.exe process exists. The default-context service query was denied by Windows permissions; the elevated read-only query succeeded. Despite the running service, TCP checks to localhost, 127.0.0.1, and ::1 on port 3306 all failed, and no listener was present. The inspected MySQL server configuration specifies port 3306 and has no bind-address or skip-networking override. Thus the observed blocker is that the service is not accepting TCP connections on its configured port; the exact MySQL runtime cause could not be determined from this environment.

The test target is not verified disposable. Its separate name and URL are not proof of ownership or safe-to-clear contents. Because the server is unreachable, the database contents and applied migration state could not be inspected. The checked-in migration is MySQL, but this only establishes the repository migration provider, not the live schema state. The integration guard checks protocol, a database name containing “test,” and URL inequality; it does not independently establish disposability. I did not run migrations, integration tests, or table-clearing commands.

To unblock safely:
1. Have an administrator inspect the MySQL80 error log and service configuration, and restore TCP listening on the configured local port. Recheck with Test-NetConnection localhost -Port 3306.
2. Have the database owner explicitly confirm that fods_challenge_test is a separate disposable schema with no valuable data, or create a new dedicated empty test schema and update TEST_DATABASE_URL.
3. Confirm the test URL is MySQL, differs from DATABASE_URL, and points to the confirmed test-only schema.
4. From server, use section 6 of MYSQL_SETUP.md to temporarily point DATABASE_URL at the test schema for migration, then restore the original environment value.
5. Run npm test once with DATABASE_URL and TEST_DATABASE_URL distinct at the initial safety check; the integration case selects TEST_DATABASE_URL internally.
## 7. Confirmed bugs

A frontend API error-handling defect was reproduced in client/src/services/api.ts. When the API was unavailable and its proxy returned a non-JSON error response, the client called response.json() directly and displayed the raw “Unexpected end of JSON input” parser exception. Expected behavior is a concise service-unavailable message.

The shared API request/response helper now converts network failures and non-JSON error responses into “The service is unavailable. Please try again later.” Valid JSON API error messages retain their existing behavior. The offline registration submission was repeated in the browser after the change and displayed the expected message. The client build and lint were rerun; no authentication or business rules changed.

The MySQL setup documentation correction from the prior report remains in place. No other application-code defect was confirmed.
## 8. Client dependency audit

The current npm audit returned 7 findings: 5 high and 2 moderate. The installed versions remain unchanged from the last report. npm explain confirms all affected packages are in the development/build dependency tree rooted at direct devDependency tailwindcss; none are production dependencies.

| Severity | Package and version | Dependency path | Audit fix information and impact |
|---|---|---|---|
| High | braces 3.0.3 | tailwindcss -> chokidar -> braces; tailwindcss -> fast-glob -> micromatch -> braces | Vulnerable to stack-exhaustion denial of service. Affected range <=3.0.3. npm proposes tailwindcss 4.3.3, a major migration. |
| High | chokidar 3.6.0 | tailwindcss -> chokidar | Affected range 2.0.0–3.6.0; the braces issue is inherited. npm proposes Tailwind CSS 4.3.3, a major migration. |
| High | fast-glob 3.3.3 | tailwindcss -> fast-glob -> micromatch | Inherited from micromatch/braces. Audit marks a compatible fix available but does not identify a target version. Latest checked fast-glob 3.x is 3.3.3. |
| High | micromatch 4.0.8 | tailwindcss -> micromatch; tailwindcss -> fast-glob -> micromatch | Inherited from braces. npm proposes Tailwind CSS 4.3.3, a major migration. Latest checked micromatch 4.x is 4.0.8. |
| Moderate | postcss-nested 6.2.0 | tailwindcss -> postcss-nested -> postcss-selector-parser | Inherits the selector-parser CPU-exhaustion issue. Audit marks a compatible fix available but does not identify a target version. Latest checked postcss-nested 6.x is 6.2.0. |
| Moderate | postcss-selector-parser 6.1.4 | tailwindcss -> postcss-selector-parser; tailwindcss -> postcss-nested -> postcss-selector-parser | Quadratic flat-selector parsing can exhaust CPU; affected range <7.1.6. Latest checked 6.x is 6.1.5 and remains in the vulnerable range. npm proposes Tailwind CSS 4.3.3 for the dependency group. |
| High | tailwindcss 3.4.19 | Direct client devDependency | Affected range includes 3.4.19. Latest checked Tailwind CSS 3 release is 3.4.19. The audit's named fix is 4.3.3, which is a major upgrade and can require configuration, PostCSS integration, and generated CSS review. |

The previous compatible update resolved the Vite and source-map-js findings. No dependency change was made in this continuation. client/package.json and client/package-lock.json were left unchanged. The client remains on Tailwind CSS 3 as requested.

Recommended remediation: wait for a Tailwind CSS 3 compatible release that updates the affected dependency graph, then review and apply only the corresponding targeted lockfile update. The audit marks fast-glob and postcss-nested as having a compatible fix without naming a version, but the latest releases checked in those current major ranges are still the installed vulnerable versions. No safe target release was identified for a narrow update. Do not add broad overrides or force transitive major versions without a compatibility review. The only explicit audit fix is Tailwind CSS 4.3.3; that migration is outside this authorization and remains unapplied.

A request to inspect npm's proposed plan using npm audit fix --dry-run --json was blocked by automatic review because it interpreted the invocation as a prohibited npm audit fix command. The command did not execute and no dependency files changed. The exact output from npm audit, npm explain, and npm view was used for this review.
## 9. Regression tests added

No automated frontend regression test was added because the client has no component-test runner. The API-unavailable defect was reproduced and manually retested in the browser after the helper fix. Existing non-database backend tests from the earlier run remain the only automated backend results.

## 10. Remaining failures and environmental blockers

- MySQL80 reports Running, but no TCP listener is reachable on localhost:3306; database contents and migration state cannot be checked.
- The test schema name and URL are separate from the normal database, but its disposability and safety to clear have not been established.
- MySQL integration and migration checks remain blocked and were not run.
- The client audit exits 1 with 7 unresolved development dependency findings (5 high, 2 moderate).
- The client-only browser run covered the landing page, selected BST operations, registration email validation, and API-unavailable feedback. Backend-dependent journeys remain blocked; the Vite process and test tab were closed afterward.
- Client build and lint were rerun after the API error fix and passed; lint retains existing warnings.
- The supplied project folder has no .git metadata, so GitHub branch/working-tree readiness could not be checked.

## 11. Website journey checklist

The app was not available for end-to-end checks because the backend API and MySQL were unavailable. The client was started alone and the browser completed the three frontend-only checks described in section 5. Remaining backend-dependent journeys are marked BLOCKED in the table. One confirmed API error-display defect was fixed and retested.

| Test | Steps and expected result | Actual result / status |
|---|---|---|
| Registration | Invalid email submission was rejected in-browser. Valid payload submission reached offline API error handling; account creation/sign-in could not be verified. | Invalid email validation PASS; full registration BLOCKED because API is unavailable. |
| Valid and invalid login | Try a wrong password, then the correct password; expect safe error feedback for the wrong password and successful sign-in for the right one. | Not performed; BLOCKED. |
| Logout and protected pages | Open /dashboard while signed out; expect the sign-in gate. Also test logout token revocation and authenticated access when API is available. | Signed-out route gate PASS; logout revocation and authenticated access BLOCKED. |
| Quiz answers | Submit a quiz with both correct and incorrect answers; expect server-authoritative acceptance and feedback. | Not performed; BLOCKED. |
| Score and explanations | Review the result; expect score, correct/incorrect status, and answer explanations to match the submitted answers. | Not performed; BLOCKED. |
| Progress after refresh | Complete an activity and reload; expect progress and XP to persist. | Not performed; BLOCKED. |
| Progress after reauthentication | Sign out and back in, then inspect progress; expect the same stored progress and XP. | Not performed; BLOCKED. |
| Level unlock and XP | Complete the required level challenge and inspect the next level; expect the documented unlock boundary and reward. | Not performed; BLOCKED. |
| Achievements and duplicate rewards | Qualify for an achievement and repeat the successful submission; expect one achievement and no duplicate completion XP. | Not performed; BLOCKED. |
| Leaderboard ordering | Create safe test-account scores and inspect the leaderboard; expect score ordering and tie behavior to match server results. | Not performed; BLOCKED. |
| Visualizer boundaries | On the landing-page BST sandbox, insert 42, repeat 42, submit blank input, then reset; expect sorted traversal, duplicate rejection, validation, and default state restoration. Other visualizers and remaining boundaries are still pending. | Tested BST cases PASS; other visualizer checks BLOCKED pending further browser session. |
| API unavailable state | Submit a valid registration payload while API is stopped; expect a useful message rather than raw parser text. | PASS after correction: “The service is unavailable. Please try again later.” |

After MySQL and both app services are available, use only dedicated test accounts and sample data. Record each actual outcome and any console/API errors in this table.

## 12. Final readiness assessment

**Phase 2 is not ready to close.** MySQL is installed and its service reports Running, but it is not accepting TCP on its configured port. The test database is not confirmed disposable, so migrations and destructive integration tests remain blocked. The client-only browser checks passed after fixing the offline API error display; direct signed-out navigation to /dashboard also showed the sign-in gate. Backend-dependent journeys remain blocked. The client audit still reports 7 development dependency findings, and the only named all-group fix is the prohibited Tailwind CSS 4 major migration.

## 13. Exact remaining work to close Phase 2

1. Restore MySQL TCP availability on localhost:3306 and verify it with Test-NetConnection.
2. Confirm or create a dedicated empty disposable test schema, verify DATABASE_URL and TEST_DATABASE_URL are distinct, apply the migration using the documented PowerShell workflow, and run the existing MySQL integration test.
3. Start client and server against only the confirmed test database, open the client in a browser, execute all 12 checks in section 11, and record actual outcomes.
4. Resolve the 7 audit findings without Tailwind CSS 4 by waiting for compatible patched releases or, if a different migration is desired, obtain separate approval before any dependency changes. Rerun npm audit, client build, and lint after approved remediation.
5. Update this report with the real integration and browser outcomes and confirm no unresolved failures remain.

Files changed in this continuation: client/src/services/api.ts, a focused fix for offline/non-JSON API errors; and server/docs/PHASE2_TEST_REPORT.md, updated with current diagnostics and actual browser results. No dependency files changed.
