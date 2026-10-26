# MySQL setup and JSON import

The server now uses MySQL through Prisma. It does not fall back to JSON if MySQL is missing or unavailable. The old `db_store.json` and `db_store.json.bak` are retained as import sources and backups.

## 1. Install and start MySQL on Windows

Install MySQL Community Server 8.0 (or use an existing MySQL 8 server). During setup, create a local administrative account and remember its password. Start the MySQL service from Windows **Services**. If the service is named `MySQL80` and your terminal has administrator rights, you can also run:

```powershell
Start-Service MySQL80
```

Check that the MySQL command-line client is available:

```powershell
mysql --version
mysql -u root -p
```

## 2. Create development and test databases

At the MySQL prompt, use a new local app account. Replace the example password with a long unique password. Do not reuse the root password.

```sql
CREATE DATABASE ultimate_ds_challenge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE ultimate_ds_challenge_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'udsc_app'@'127.0.0.1' IDENTIFIED BY 'replace_with_a_local_password';
GRANT ALL PRIVILEGES ON ultimate_ds_challenge.* TO 'udsc_app'@'127.0.0.1';
GRANT ALL PRIVILEGES ON ultimate_ds_challenge_test.* TO 'udsc_app'@'127.0.0.1';
```

The integration test suite deletes rows in its configured test database, so `TEST_DATABASE_URL` must point to a separate database whose name contains `test`. Never point it at the development or production database.

## 3. Configure the server

From `server`, copy `.env.example` to `.env` only if you do not already have a `.env` file. This project currently may have an older PostgreSQL `DATABASE_URL`; replace that one setting with your MySQL URL. Keep your existing `JWT_SECRET` private and at least 32 characters long. URL-encode special characters in the database username or password.

```dotenv
DATABASE_URL=mysql://udsc_app:YOUR_PASSWORD@127.0.0.1:3306/ultimate_ds_challenge
TEST_DATABASE_URL=mysql://udsc_app:YOUR_PASSWORD@127.0.0.1:3306/ultimate_ds_challenge_test
```

Generate Prisma Client and apply the checked-in migration:

```powershell
npm run db:generate
npm run db:migrate:deploy
```

`migrate:deploy` creates tables but does not import, delete, or replace JSON data.

## 4. Review and import the existing JSON data

From the `server` directory, run a dry run first. It reads the JSON and reports the records it can import without connecting to or changing the database:

```powershell
npm run db:import:json
```

The default input is `server/db_store.json`. To inspect a different file, pass its path after the script command. Apply the import only after the dry-run report has no validation issues:

```powershell
npm run db:import:json -- --apply
```

The importer preserves user, progress, attempt, achievement, and revoked-token IDs where those records have IDs. It validates references against the existing challenge and achievement catalogs, and creates one-time completion rows from passed attempts so a replay cannot re-award old completion XP. It inserts records only. A repeat import skips identical records; a conflicting existing record stops the transaction instead of overwriting it. Malformed or orphaned records stop the import and are reported for review. The JSON source and backup remain untouched.

After an import, compare the printed counts and inspect the database before starting the app.

## 5. Start the app

The root production build remains:

```powershell
# from the project root
npm run build

# from server, after the database is configured and migrated
npm start
```

The server seeds missing challenge and achievement catalog rows with `INSERT ... IGNORE`-style duplicate skipping. Existing catalog rows are not overwritten. Startup fails with a sanitized error if the MySQL URL, connection, or migration is invalid.

## 6. Run tests against the isolated test database

Only use a separate, disposable MySQL database for integration tests. Before running them, confirm that TEST_DATABASE_URL uses mysql://, its database name contains test, and it differs from the normal DATABASE_URL. Confirm that this target is safe to clear and can be migrated independently. The integration test selects TEST_DATABASE_URL internally after checking that it differs from DATABASE_URL; it clears the test database tables before the assertions and again during cleanup.

Apply the checked-in migration to the disposable test database, then run the server suite with the normal database URL restored for its initial safety check. In PowerShell, from the server directory:

    $previousDatabaseUrl = $env:DATABASE_URL
    $normalDatabaseUrl = ((Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1) -split '=', 2)[1].Trim().Trim('"').Trim("'")
    $testDatabaseUrl = ((Get-Content .env | Where-Object { $_ -match '^TEST_DATABASE_URL=' } | Select-Object -First 1) -split '=', 2)[1].Trim().Trim('"').Trim("'")
    if ([string]::IsNullOrWhiteSpace($normalDatabaseUrl) -or [string]::IsNullOrWhiteSpace($testDatabaseUrl)) {
      throw 'DATABASE_URL and TEST_DATABASE_URL must both be set in .env.'
    }
    if ($normalDatabaseUrl -eq $testDatabaseUrl) {
      throw 'DATABASE_URL and TEST_DATABASE_URL must point to different databases.'
    }

    try {
      $env:DATABASE_URL = $testDatabaseUrl
      npm run db:migrate:deploy
      if ($LASTEXITCODE -ne 0) {
        throw 'Test database migration failed.'
      }
    }
    finally {
      if ($null -eq $previousDatabaseUrl) {
        Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
      } else {
        $env:DATABASE_URL = $previousDatabaseUrl
      }
    }

    try {
      $env:DATABASE_URL = $normalDatabaseUrl
      npm test
    }
    finally {
      if ($null -eq $previousDatabaseUrl) {
        Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
      } else {
        $env:DATABASE_URL = $previousDatabaseUrl
      }
    }

Both environment overrides are restored even when a command fails. npm test starts with DATABASE_URL pointing at the normal database and TEST_DATABASE_URL pointing at the separate test database; the integration test selects TEST_DATABASE_URL internally after the safety check. Other server tests run without MySQL. The client checks (from the client directory) are:

    npm run build
    npm run lint
## Troubleshooting

- **`DATABASE_URL must use mysql://`**: the server `.env` still points at PostgreSQL; update the URL to `mysql://`.
- **MySQL connection refused / Prisma P1001**: start the MySQL service and verify host and port (default `127.0.0.1:3306`).
- **Access denied / Prisma P1000**: check the app account, password, host grant (`localhost` versus `127.0.0.1`), and URL encoding. Do not paste passwords into logs or issue reports.
- **Unknown database**: create the database in step 2 before deploying migrations.
- **Table does not exist**: from `server`, run `npm run db:migrate:deploy` against the intended database.
- **Import validation error**: leave both JSON files intact, fix or manually review the named record, then run the dry run again. The importer will not silently skip malformed relationships.
- **Import conflict**: compare the existing MySQL row with the JSON record. The importer does not overwrite it; resolve the conflict deliberately before retrying.



