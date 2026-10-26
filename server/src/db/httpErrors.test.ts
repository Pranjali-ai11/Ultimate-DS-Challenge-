import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDatabaseUrl, isDatabaseUnavailable } from './index.js';
import { databaseFailure } from './httpErrors.js';

test('database configuration rejects missing, malformed, and non-MySQL URLs without fallback', () => {
  assert.match(validateDatabaseUrl('') || '', /missing/);
  assert.match(validateDatabaseUrl('postgresql://localhost/db') || '', /mysql/);
  assert.match(validateDatabaseUrl('not a url') || '', /valid MySQL/);
  assert.equal(validateDatabaseUrl('mysql://user:password@127.0.0.1:3306/app'), null);
});

test('database connection failures are classified as unavailable and returned without leaking details', () => {
  assert.equal(isDatabaseUnavailable({ code: 'P1001' }), true);
  const response = { code: 200, body: undefined as any, status(code: number) { this.code = code; return this; }, json(body: any) { this.body = body; return this; } };
  const errors: unknown[][] = [];
  const originalError = console.error;
  console.error = (...parts: unknown[]) => { errors.push(parts); };
  try { databaseFailure(response as any, 'test', { code: 'P1001', message: 'mysql://user:secret@host/db' }, 'fallback'); }
  finally { console.error = originalError; }
  assert.equal(response.code, 503);
  assert.deepEqual(response.body, { success: false, message: 'The database is unavailable. Please try again shortly.' });
  assert.equal(JSON.stringify(response.body).includes('secret'), false);
  assert.equal(JSON.stringify(errors).includes('secret'), false);
});
