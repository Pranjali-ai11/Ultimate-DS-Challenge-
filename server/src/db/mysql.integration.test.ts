import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const testUrl = process.env.TEST_DATABASE_URL;
type MockResponse = { statusCode: number; body: any; status(code: number): MockResponse; json(value: any): MockResponse };
const response = (): MockResponse => ({ statusCode: 200, body: undefined, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } });

test('MySQL persistence integration: empty setup, auth, quizzes/rewards, progress, badges, leaderboard, imports, and failure handling', { skip: !testUrl && 'Set TEST_DATABASE_URL to an isolated MySQL database whose name contains "test".' }, async () => {
  const url = new URL(testUrl!);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  assert.match(url.protocol, /^mysql:$/i, 'test datasource must be MySQL');
  assert.match(databaseName.toLowerCase(), /test/, 'refusing to clear a database whose name does not contain test');
  if (process.env.DATABASE_URL && process.env.DATABASE_URL === testUrl) throw new Error('TEST_DATABASE_URL must differ from DATABASE_URL.');

  process.env.DATABASE_URL = testUrl!;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'isolated_mysql_integration_test_secret_2026';
  const { prisma, initDatabase, isDatabaseUnavailable } = await import('./index.js');
  const auth = await import('../controllers/authController.js');
  const challengeController = await import('../controllers/challengeController.js');
  const progressController = await import('../controllers/progressController.js');
  const achievementController = await import('../controllers/achievementController.js');
  const leaderboardController = await import('../controllers/leaderboardController.js');
  const { authMiddleware } = await import('../middleware/auth.js');
  const { getChallenges } = await import('./catalog.js');
  const { importLegacyJson } = await import('./importLegacyJson.js');
  const { INITIAL_CHALLENGES, INITIAL_ACHIEVEMENTS } = await import('../data/seedData.js');
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'udsc-mysql-import-test-'));

  const clearIsolatedDatabase = async () => {
    await prisma.challengeCompletion.deleteMany();
    await prisma.challengeAttempt.deleteMany();
    await prisma.userAchievement.deleteMany();
    await prisma.revokedToken.deleteMany();
    await prisma.userProgress.deleteMany();
    await prisma.user.deleteMany();
    await prisma.challenge.deleteMany();
    await prisma.achievement.deleteMany();
  };

  try {
    await prisma.$connect();
    await clearIsolatedDatabase();
    assert.equal(await prisma.user.count(), 0, 'clean database starts without accounts');
    assert.equal(await prisma.challenge.count(), 0, 'clean database starts without the seeded catalog');
    await initDatabase();
    assert.equal(await prisma.challenge.count(), INITIAL_CHALLENGES.length);
    assert.equal(await prisma.achievement.count(), INITIAL_ACHIEVEMENTS.length);
    assert.equal(await prisma.user.count(), 0, 'initialization does not create demo users');

    const invalidRegistration = response();
    await auth.register({ body: { email: 'not-an-email' } } as any, invalidRegistration as any);
    assert.equal(invalidRegistration.statusCode, 400);

    const email = `mysql-${randomUUID()}@example.invalid`;
    const registration = response();
    await auth.register({ body: { name: 'MySQL Test Learner', email, password: 'valid integration password' } } as any, registration as any);
    assert.equal(registration.statusCode, 201);
    const userId = registration.body.user.id as string;
    const token = registration.body.token as string;
    assert.equal(await prisma.user.count({ where: { id: userId } }), 1);
    assert.equal(await prisma.userProgress.count({ where: { user_id: userId } }), 1);
    assert.notEqual((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).password_hash, 'valid integration password');

    const login = response();
    await auth.login({ body: { email, password: 'valid integration password' } } as any, login as any);
    assert.equal(login.statusCode, 200);
    const authenticated = { user: { id: userId, email, name: 'MySQL Test Learner', tokenId: undefined, expiresAt: undefined } };
    const emptyBadges = response();
    await achievementController.getAllAchievements(authenticated as any, emptyBadges as any);
    assert.equal(emptyBadges.statusCode, 200);
    assert.equal(emptyBadges.body.unlockedCount, 0);
    assert.ok(emptyBadges.body.achievements.every((item: any) => !item.earned && item.progressCurrent === 0 && Number.isFinite(item.progressPercent ?? 0)));
    const profile = response();
    await auth.getMe(authenticated as any, profile as any);
    assert.equal(profile.body.user.id, userId);
    const update = response();
    await auth.updateProfile({ ...authenticated, body: { name: 'Renamed MySQL Learner' } } as any, update as any);
    assert.equal(update.body.user.name, 'Renamed MySQL Learner');
    const passwordUpdate = response();
    await auth.updatePassword({ ...authenticated, body: { currentPassword: 'valid integration password', newPassword: 'new integration password' } } as any, passwordUpdate as any);
    assert.equal(passwordUpdate.statusCode, 200);
    const relogin = response();
    await auth.login({ body: { email, password: 'new integration password' } } as any, relogin as any);
    assert.equal(relogin.statusCode, 200);

    const unverifiedRecovery = response();
    await auth.forgotPassword({ body: { email, newPassword: 'another password', confirmNewPassword: 'another password' } } as any, unverifiedRecovery as any);
    assert.equal(unverifiedRecovery.statusCode, 400, 'a new password alone cannot change an account password');
    const wrongRecoveryPassword = response();
    await auth.forgotPassword({ body: { email, currentPassword: 'wrong password', newPassword: 'another password', confirmNewPassword: 'another password' } } as any, wrongRecoveryPassword as any);
    assert.equal(wrongRecoveryPassword.statusCode, 401, 'recovery requires the existing password');
    const mismatchedRecovery = response();
    await auth.forgotPassword({ body: { email, currentPassword: 'new integration password', newPassword: 'another password', confirmNewPassword: 'different password' } } as any, mismatchedRecovery as any);
    assert.equal(mismatchedRecovery.statusCode, 400, 'recovery rejects mismatched confirmation');
    const recovery = response();
    await auth.forgotPassword({ body: { email, currentPassword: 'new integration password', newPassword: 'another password', confirmNewPassword: 'another password' } } as any, recovery as any);
    assert.equal(recovery.statusCode, 200);
    const recoveredUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    assert.notEqual(recoveredUser.password_hash, 'another password', 'recovery stores a hash, never plaintext');
    const recoveredLogin = response();
    await auth.login({ body: { email, password: 'another password' } } as any, recoveredLogin as any);
    assert.equal(recoveredLogin.statusCode, 200, 'recovered password works through existing login');

    const initialProgress = response();
    await progressController.getUserProgress(authenticated as any, initialProgress as any);
    assert.equal(initialProgress.statusCode, 200);
    assert.equal(initialProgress.body.progress.xp, 0);
    assert.deepEqual(initialProgress.body.progress.xpTotals, { allTime: 0, weekly: 0, monthly: 0 });
    assert.deepEqual(initialProgress.body.progress.nextUnlock, { level: 2, fromLevel: 1, passed: 0, required: 3, percentage: 0 });

    const levelOneChallenges = (await getChallenges()).filter(item => item.level === 1).sort((a, b) => a.id.localeCompare(b.id));
    const firstChallenge = levelOneChallenges[0];
    const answerBody = { answers: Object.fromEntries(levelOneChallenges.map(item => [item.id, item.options.find((option: any) => option.isCorrect)!.id])), submissionId: randomUUID() };
    const invalidSubmission = response();
    await challengeController.submitLevelQuiz({ params: { level: '1' }, body: { answers: { 'unknown-challenge': 'anything' }, submissionId: randomUUID() }, user: authenticated.user } as any, invalidSubmission as any);
    assert.equal(invalidSubmission.statusCode, 400);
    assert.equal(await prisma.challengeAttempt.count({ where: { user_id: userId } }), 0, 'invalid quiz payloads do not create attempts');
    const incompleteSubmission = response();
    await challengeController.submitLevelQuiz({ params: { level: '1' }, body: { answers: { [firstChallenge.id]: answerBody.answers[firstChallenge.id] }, submissionId: randomUUID() }, user: authenticated.user } as any, incompleteSubmission as any);
    assert.equal(incompleteSubmission.statusCode, 400, 'one answered question cannot finalize the level quiz');
    assert.equal(incompleteSubmission.body.answeredQuestions, 1);
    assert.equal(incompleteSubmission.body.remainingQuestions, levelOneChallenges.length - 1);
    assert.equal(await prisma.challengeAttempt.count({ where: { user_id: userId } }), 0, 'incomplete quizzes do not create attempts or results');
    const incompleteMultiSelect = response();
    await challengeController.submitLevelQuiz({ params: { level: '3' }, body: { answers: {}, submissionId: randomUUID() }, user: authenticated.user } as any, incompleteMultiSelect as any);
    assert.equal(incompleteMultiSelect.statusCode, 400, 'an empty multiselect submission cannot finalize an advanced quiz');
    assert.ok(incompleteMultiSelect.body.remainingQuestions > 0);
    assert.equal(await prisma.challengeAttempt.count({ where: { user_id: userId } }), 0);
    const firstSubmission = response();
    await challengeController.submitLevelQuiz({ params: { level: '1' }, body: answerBody, user: authenticated.user } as any, firstSubmission as any);
    assert.equal(firstSubmission.statusCode, 200);
    assert.equal(firstSubmission.body.totalQuestions, levelOneChallenges.length);
    assert.equal(firstSubmission.body.reviews.length, levelOneChallenges.length, 'a complete submission produces one result review per question');
    assert.equal(firstSubmission.body.correctCount, levelOneChallenges.length);
    assert.ok(firstSubmission.body.earnedXp > 0);
    assert.equal(firstSubmission.body.earnedXp, firstSubmission.body.challengeXpEarned + firstSubmission.body.badgeBonusXp);
    assert.ok(firstSubmission.body.badgeBonusXp >= 50, 'earned XP includes the first-step badge bonus');
    assert.ok(firstSubmission.body.newAchievements.length > 0, 'newly earned badges are returned with the submission result');
    const savedFirstAttempts = await prisma.challengeAttempt.findMany({ where: { user_id: userId, submission_id: answerBody.submissionId }, orderBy: { challenge_id: 'asc' } });
    assert.equal(savedFirstAttempts.length, levelOneChallenges.length);
    assert.equal((savedFirstAttempts[0].feedback as any).submittedAnswer, answerBody.answers[savedFirstAttempts[0].challenge_id], 'the actual level 1 option ID is persisted');
    assert.equal(savedFirstAttempts[0].performance_score, null, 'unmeasured performance dimensions are not fabricated');
    const duplicateRequest = response();
    await challengeController.submitLevelQuiz({ params: { level: '1' }, body: answerBody, user: authenticated.user } as any, duplicateRequest as any);
    assert.equal(duplicateRequest.statusCode, 409, 'repeating the same submission ID does not create duplicate question attempts');
    const earnedBadgeRowsAfterFirst = await prisma.userAchievement.findMany({ where: { user_id: userId }, select: { achievement_id: true } });
    assert.ok(earnedBadgeRowsAfterFirst.length > 0);
    const xpAfterFirst = (await prisma.userProgress.findUniqueOrThrow({ where: { user_id: userId } })).xp;
    const replay = response();
    await challengeController.submitLevelQuiz({ params: { level: '1' }, body: { ...answerBody, submissionId: randomUUID() }, user: authenticated.user } as any, replay as any);
    assert.equal(replay.statusCode, 200);
    assert.equal(replay.body.earnedXp, 0);
    assert.equal(replay.body.newAchievements.length, 0, 'a replay does not report or award an already-earned badge again');
    assert.equal((await prisma.userProgress.findUniqueOrThrow({ where: { user_id: userId } })).xp, xpAfterFirst);
    assert.equal((await prisma.userAchievement.findMany({ where: { user_id: userId }, select: { achievement_id: true } })).length, earnedBadgeRowsAfterFirst.length);
    assert.equal(await prisma.challengeCompletion.count({ where: { user_id: userId } }), levelOneChallenges.length, 'each correct challenge reward is persisted once');
    const concurrentReplays = await Promise.all([1, 2].map(async () => {
      const concurrent = response();
      await challengeController.submitLevelQuiz({ params: { level: '1' }, body: { ...answerBody, submissionId: randomUUID() }, user: authenticated.user } as any, concurrent as any);
      return concurrent;
    }));
    assert.ok(concurrentReplays.every(item => item.statusCode === 200 && item.body.earnedXp === 0));
    assert.equal((await prisma.userAchievement.findMany({ where: { user_id: userId }, select: { achievement_id: true } })).length, earnedBadgeRowsAfterFirst.length, 'concurrent replays do not duplicate badge awards');
    assert.equal(await prisma.challengeAttempt.count({ where: { user_id: userId } }), (await getChallenges()).filter(item => item.level === 1).length * 4);

    const progress = response();
    await progressController.getUserProgress(authenticated as any, progress as any);
    assert.equal(progress.statusCode, 200);
    assert.equal(progress.body.progress.xp, xpAfterFirst);
    assert.deepEqual(progress.body.progress.xpTotals, { allTime: xpAfterFirst, weekly: xpAfterFirst, monthly: xpAfterFirst });
    assert.equal(progress.body.progress.completedChallenges, levelOneChallenges.length);
    assert.equal(progress.body.completedChallengesByLevel[1], levelOneChallenges.length);
    assert.equal(progress.body.progress.unlockedLevel, 2);
    assert.deepEqual(progress.body.progress.nextUnlock, { level: 3, fromLevel: 2, passed: 0, required: 3, percentage: 0 });
    assert.deepEqual(progress.body.progression.levels.map((item: any) => item.rewardXpValues), [[100], [150], [250], [400]]);
    const badges = response();
    await achievementController.getAllAchievements(authenticated as any, badges as any);
    assert.ok(badges.body.achievements.some((item: any) => item.code === 'first_blood' && item.unlocked));
    assert.equal(badges.body.total, INITIAL_ACHIEVEMENTS.length);
    assert.equal(badges.body.earnedCount, badges.body.achievements.filter((item: any) => item.earned).length);
    const arrayBadge = badges.body.achievements.find((item: any) => item.code === 'array_ace');
    assert.deepEqual([arrayBadge.progressCurrent, arrayBadge.progressTarget], [5, 5]);
    assert.equal(arrayBadge.earned, true);
    assert.ok(badges.body.achievements.every((item: any) => !/optional enrichment/i.test(item.requirement + ' ' + item.description)));
    const leaderboard = response();
    await leaderboardController.getLeaderboard({ query: { timeframe: 'all-time' }, user: { id: userId } } as any, leaderboard as any);
    assert.equal(leaderboard.body.leaderboard.find((item: any) => item.id === userId)?.xp, xpAfterFirst);
    assert.equal(leaderboard.body.currentUser.xp, xpAfterFirst);
    assert.equal(leaderboard.body.currentUser.isCurrentUser, true);
    assert.ok(Number.isInteger(leaderboard.body.currentUser.rank));
    assert.equal(leaderboard.body.timeframe, 'all-time');
    assert.equal(leaderboard.body.limit, 20);

    const importUser = { id: `import-${randomUUID()}`, name: 'Imported Test', email: `import-${randomUUID()}@example.invalid`, password_hash: '$2a$10$testhashonly', avatar: 'avatar-1', title: 'Learner', bio: '', created_at: new Date().toISOString() };
    const importChallenge = INITIAL_CHALLENGES.find(item => item.level === 1)!;
    const legacy = {
      users: [[importUser.id, importUser], [importUser.email, importUser]],
      progress: [[importUser.id, { id: `prog-${importUser.id}`, user_id: importUser.id, level: 1, unlocked_level: 1, xp: 0, score: 0, completed_challenges: 0, accuracy: 0, streak: 0, last_active: new Date().toISOString() }]],
      attempts: [{ id: `legacy-att-${randomUUID()}`, user_id: importUser.id, challenge_id: importChallenge.id, selected_structures: ['array'], score: 100, correctness_score: 100, performance_score: 100, memory_score: 100, complexity_score: 100, simplicity_score: 100, explanation_score: 100, status: 'passed', completed_at: new Date().toISOString() }],
      userAchievements: [{ id: `legacy-ua-${randomUUID()}`, user_id: importUser.id, achievement_id: INITIAL_ACHIEVEMENTS[0].code, unlocked_at: new Date().toISOString() }],
      revokedTokens: []
    };
    const importFile = path.join(fixtureRoot, 'legacy.json');
    await fs.writeFile(importFile, JSON.stringify(legacy), 'utf8');
    const firstImport = await importLegacyJson(importFile);
    assert.deepEqual(firstImport.issues, []);
    assert.equal(firstImport.imported.users, 1);
    assert.equal(firstImport.imported.completions, 1);
    const secondImport = await importLegacyJson(importFile);
    assert.deepEqual(secondImport.issues, []);
    assert.equal(secondImport.imported.users, 0);
    assert.equal(secondImport.skipped.users, 1);
    assert.equal(await prisma.user.count({ where: { id: importUser.id } }), 1);
    const conflictingLegacy = structuredClone(legacy);
    conflictingLegacy.users = [[importUser.id, { ...importUser, name: 'Do not overwrite' }], [importUser.email, { ...importUser, name: 'Do not overwrite' }]];
    await fs.writeFile(importFile, JSON.stringify(conflictingLegacy), 'utf8');
    const conflictImport = await importLegacyJson(importFile);
    assert.equal(conflictImport.issues.length, 1);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: importUser.id } })).name, importUser.name, 'import conflicts never overwrite existing rows');

    const logoutResponse = response();
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.decode(token) as any;
    await auth.logout({ user: { ...authenticated.user, tokenId: decoded.jti, expiresAt: decoded.exp } } as any, logoutResponse as any);
    assert.equal(logoutResponse.statusCode, 200);
    const middlewareResponse = response();
    let nextCalled = false;
    await authMiddleware({ headers: { authorization: `Bearer ${token}` } } as any, middlewareResponse as any, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(middlewareResponse.statusCode, 401);
    assert.equal(isDatabaseUnavailable({ code: 'P1001' }), true);
  } finally {
    await clearIsolatedDatabase();
    await prisma.$disconnect();
    await fs.rm(fixtureRoot, { recursive: true, force: true });
  }
});
