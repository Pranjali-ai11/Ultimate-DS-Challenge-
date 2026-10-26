import 'dotenv/config';
import path from 'node:path';
import { importLegacyJson, readLegacyJson } from '../db/importLegacyJson.js';
import { prisma } from '../db/index.js';

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const inputPath = args.find(arg => arg !== '--apply') || path.resolve(process.cwd(), 'db_store.json');
  let parsed: ReturnType<typeof readLegacyJson>;
  try { parsed = readLegacyJson(inputPath); }
  catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Import validation found invalid JSON syntax in the selected source file.');
      process.exitCode = 2;
      return;
    }
    throw error;
  }
  console.log(`JSON source: ${path.resolve(inputPath)}`);
  console.log(`Parsed records: ${JSON.stringify(parsed.counts)}`);
  if (parsed.issues.length) {
    console.error(`Import validation found ${parsed.issues.length} issue(s):`);
    for (const issue of parsed.issues) console.error(`- ${issue}`);
    process.exitCode = 2;
    return;
  }
  if (!apply) {
    console.log('Dry run only: no database was changed. Review this report, then rerun with --apply to import.');
    return;
  }
  const result = await importLegacyJson(inputPath);
  if (result.issues.length) {
    console.error(`Import stopped without overwriting existing data. Conflicts: ${result.issues.length}`);
    for (const issue of result.issues) console.error(`- ${issue}`);
    process.exitCode = 3;
    return;
  }
  console.log(`Inserted records: ${JSON.stringify(result.imported)}`);
  console.log(`Already present and unchanged: ${JSON.stringify(result.skipped)}`);
  console.log('The JSON source and its backup were left unchanged.');
}

main().catch(error => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'unknown';
  console.error(`JSON import failed (database/error code: ${code}). Check the sanitized message above, MySQL availability, and DATABASE_URL; no credentials are logged.`);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
