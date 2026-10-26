import test from 'node:test';
import assert from 'node:assert/strict';
import { forgotPassword } from './authController.js';

type TestResponse = { statusCode: number; body: any; status(code: number): TestResponse; json(value: any): TestResponse };
const response = (): TestResponse => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; }
});

test('password recovery rejects a new-password-only request before any database lookup', async () => {
  const res = response();
  await forgotPassword({ body: { email: 'learner@example.com', newPassword: 'new secure password', confirmNewPassword: 'new secure password' } } as any, res as any);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /current password/i);
});

test('password recovery validates confirmation, length, and unexpected fields', async () => {
  const mismatch = response();
  await forgotPassword({ body: { email: 'learner@example.com', currentPassword: 'current pass', newPassword: 'new secure password', confirmNewPassword: 'different password' } } as any, mismatch as any);
  assert.equal(mismatch.statusCode, 400);
  assert.match(mismatch.body.message, /do not match/i);

  const tooShort = response();
  await forgotPassword({ body: { email: 'learner@example.com', currentPassword: 'current pass', newPassword: 'short', confirmNewPassword: 'short' } } as any, tooShort as any);
  assert.equal(tooShort.statusCode, 400);
  assert.match(tooShort.body.message, /8 and 200/);

  const extraField = response();
  await forgotPassword({ body: { email: 'learner@example.com', currentPassword: 'current pass', newPassword: 'new secure password', confirmNewPassword: 'new secure password', isAdmin: true } } as any, extraField as any);
  assert.equal(extraField.statusCode, 400);
});
