import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/index.js';
import { summarizeUserProgress, advanceUtcStreak } from '../engine/progressRules.js';
import { calculateAchievementProgress } from '../engine/achievementRules.js';
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievementDefinitions.js';
import { calculateAllTimeXp } from '../engine/xpAccounting.js';
import { ScoringEngine } from '../engine/scoringEngine.js';
import { RequirementEngine } from '../engine/requirementEngine.js';
import { makeStoredSubmissionFeedback } from '../engine/submissionReview.js';
import type { ChallengeData } from '../db/catalog.js';

type SubmissionSpec = { level: number; target: number; offset: number };
type Sample = { name: string; email: string; first: string; created: number; submissions: SubmissionSpec[] };
const samples: Sample[] = [
  { name: 'Aarav Mehta', email: 'aarav.mehta@gmail.com', first: 'aarav', created: 1, submissions: [] },
  { name: 'Diya Sharma', email: 'diya.sharma@gmail.com', first: 'diya', created: 2, submissions: [{ level: 1, target: 11, offset: 0 }] },
  { name: 'Rohan Patil', email: 'rohan.patil@gmail.com', first: 'rohan', created: 3, submissions: [{ level: 1, target: 15, offset: 1 }, { level: 1, target: 24, offset: 0 }] },
  { name: 'Meera Iyer', email: 'meera.iyer@gmail.com', first: 'meera', created: 4, submissions: [{ level: 1, target: 26, offset: 3 }, { level: 2, target: 18, offset: 2 }, { level: 2, target: 24, offset: 1 }] },
  { name: 'Kabir Singh', email: 'kabir.singh@gmail.com', first: 'kabir', created: 8, submissions: [{ level: 1, target: 22, offset: 6 }, { level: 2, target: 14, offset: 5 }, { level: 2, target: 19, offset: 4 }, { level: 3, target: 1, offset: 3 }] },
  { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@gmail.com', first: 'sneha', created: 7, submissions: [{ level: 1, target: 30, offset: 4 }, { level: 2, target: 28, offset: 3 }, { level: 3, target: 9, offset: 2 }, { level: 3, target: 11, offset: 1 }] },
  { name: 'Vikram Joshi', email: 'vikram.joshi@gmail.com', first: 'vikram', created: 12, submissions: [{ level: 1, target: 29, offset: 9 }, { level: 2, target: 30, offset: 8 }, { level: 3, target: 10, offset: 7 }, { level: 4, target: 5, offset: 6 }, { level: 4, target: 7, offset: 5 }, { level: 3, target: 13, offset: 4 }, { level: 2, target: 34, offset: 3 }, { level: 4, target: 9, offset: 2 }, { level: 1, target: 32, offset: 1 }, { level: 4, target: 10, offset: 0 }] },
  { name: 'Isha Desai', email: 'isha.desai@gmail.com', first: 'isha', created: 20, submissions: [{ level: 1, target: 20, offset: 14 }, { level: 2, target: 12, offset: 13 }] },
  { name: 'Arjun Nair', email: 'arjun.nair@gmail.com', first: 'arjun', created: 15, submissions: [{ level: 1, target: 30, offset: 11 }, { level: 2, target: 33, offset: 10 }, { level: 3, target: 13, offset: 9 }, { level: 4, target: 9, offset: 8 }, { level: 1, target: 32, offset: 7 }, { level: 2, target: 36, offset: 6 }, { level: 3, target: 15, offset: 5 }, { level: 4, target: 12, offset: 4 }, { level: 1, target: 32, offset: 3 }, { level: 2, target: 36, offset: 2 }, { level: 3, target: 15, offset: 1 }] },
  { name: 'Pranjali', email: 'pranjali@gmail.com', first: 'pranjali', created: 6, submissions: [{ level: 1, target: 27, offset: 5 }, { level: 1, target: 31, offset: 4 }, { level: 2, target: 26, offset: 3 }, { level: 2, target: 31, offset: 2 }, { level: 3, target: 6, offset: 1 }] }
];
const expected = [
  [0, 1, 0, '0/0/0/0', 0, 0, 0, 0], [1350, 2, 1, '11/0/0/0', 32, 34, 1100, 2],
  [2900, 2, 2, '24/0/0/0', 64, 75, 2400, 4], [7400, 3, 3, '26/24/0/0', 104, 74, 5000, 9],
  [6700, 3, 4, '22/19/1/0', 119, 51, 4200, 10], [11900, 4, 4, '30/28/11/0', 98, 83, 6900, 14],
  [17800, 4, 10, '32/34/13/10', 214, 94, 8900, 15], [4300, 3, 2, '20/12/0/0', 68, 47, 3200, 4],
  [19400, 4, 11, '32/36/15/12', 273, 100, 9500, 15], [11100, 4, 5, '31/31/6/0', 151, 82, 6800, 13]
];
const passwords = new Map(samples.map(s => [s.email, `${s.first}@123`]));
function fnv1a(s: string) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function mulberry32(a: number) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ordered(challenges: ChallengeData[], email: string, level: number) {
  const arr = challenges.filter(c => c.level === level).map(c => c.id).sort((a, b) => a.localeCompare(b));
  const rng = mulberry32(fnv1a(`${email}|L${level}`));
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}
function submissionTime(today: Date, offset: number, now: Date) {
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset, 10));
  return offset === 0 ? now : date;
}
function summarize(userAttempts: any[], completions: any[], badges: any[], progress: { streak: number; lastActive: Date }, challenges: ChallengeData[]) {
  const passed = new Set(userAttempts.filter(a => a.status === 'passed').map(a => a.challenge_id));
  const attempted = new Set(userAttempts.map(a => a.challenge_id));
  const best = new Map<string, number>();
  for (const a of userAttempts) best.set(a.challenge_id, Math.max(best.get(a.challenge_id) || 0, a.score));
  const prog = summarizeUserProgress(challenges, passed);
  return { xp: calculateAllTimeXp(completions.map(c => ({ completedAt: c.completed_at, rewardXp: c.reward_xp })), badges.map(b => ({ unlockedAt: b.unlocked_at, xpBonus: b.xp_bonus }))), unlocked: prog.unlockedLevel, streak: progress.streak, byLevel: `${prog.completedChallengesByLevel[1]}/${prog.completedChallengesByLevel[2]}/${prog.completedChallengesByLevel[3]}/${prog.completedChallengesByLevel[4]}`, attempts: userAttempts.length, accuracy: attempted.size ? Math.round(passed.size / attempted.size * 100) : 0, score: [...best.values()].reduce((a, b) => a + b, 0), badges: badges.length, passed };
}
function buildPending(challenges: ChallengeData[], level: number, target: number, email: string, submissionId: string) {
  const order = ordered(challenges, email, level);
  const correctSet = new Set(order.slice(0, target));
  return challenges.filter(c => c.level === level).sort((a, b) => a.id.localeCompare(b.id)).map(challenge => {
    const isCorrect = correctSet.has(challenge.id);
    let submittedAnswer: string | string[];
    let selected: string[];
    let score: number;
    let review: Record<string, any>;
    if (level === 1) {
      const correct = challenge.options.find((x: any) => x.isCorrect);
      const wrong = challenge.options.find((x: any) => !x.isCorrect);
      const answer = isCorrect ? correct.id : wrong.id;
      const selectedOption = challenge.options.find((x: any) => x.id === answer);
      const correctIds = [correct.id];
      selected = [selectedOption.structureId].filter(Boolean);
      score = isCorrect ? 100 : 0;
      const criteria = (challenge.comparisonCriteria || []).filter((x: any) => x.bestChoice === answer || x.bestChoice === correctIds[0]);
      const explanation = [selectedOption?.explanation, !isCorrect && correct?.explanation ? `Correct answer: ${correct.explanation}` : ''].filter(Boolean).join(' ');
      const correctText = correct.text || 'No correct answer configured';
      review = { challengeId: challenge.id, title: challenge.title, category: challenge.category, question: challenge.question || challenge.missionBrief, selectedOptionId: answer, selectedOptionText: selectedOption?.text || 'Not answered', score, structureId: selected[0] || null, structureName: selected[0]?.replaceAll('-', ' ').toUpperCase() || 'Answer', correctOptionId: correctIds[0] || '', correctOptionText: correctText, correctOptionIds: correctIds, correctOptionNames: [correctText], isCorrect, explanation, correctExplanation: correct?.explanation || explanation, relevantReasons: criteria.map((x: any) => `${x.criterion}: ${x.explanation}`) };
      submittedAnswer = answer;
    } else if (level === 2) {
      const correctIds: string[] = challenge.optimalStructures;
      const wrong = challenge.availableStructures.find((x: string) => !correctIds.includes(x));
      const answer = isCorrect ? correctIds[0] : wrong;
      selected = [answer]; score = isCorrect ? 100 : 0;
      const criteria = (challenge.comparisonCriteria || []).filter((x: any) => x.bestChoice === answer || x.bestChoice === correctIds[0]);
      const explanation = criteria.map((x: any) => `${x.criterion}: ${x.explanation}`).join(' ') || `Best choice: ${correctIds.join(', ')}.`;
      const correctText = correctIds.map(id => id.replaceAll('-', ' ').toUpperCase()).join(', ');
      review = { challengeId: challenge.id, title: challenge.title, category: challenge.category, question: challenge.question || challenge.missionBrief, selectedOptionId: answer, selectedOptionText: answer?.replaceAll('-', ' ').toUpperCase() || 'Not answered', score, structureId: selected[0] || null, structureName: selected[0]?.replaceAll('-', ' ').toUpperCase() || 'Answer', correctOptionId: correctIds[0] || '', correctOptionText: correctText, correctOptionIds: correctIds, correctOptionNames: [correctText], isCorrect, explanation, correctExplanation: explanation, relevantReasons: criteria.map((x: any) => `${x.criterion}: ${x.explanation}`) };
      submittedAnswer = answer;
    } else {
      const expected: string[] = challenge.optimalStructures || [];
      const wrong = challenge.availableStructures.find((x: string) => !expected.includes(x));
      selected = isCorrect ? expected : [wrong];
      const evaluated = RequirementEngine.evaluateRequirements(challenge.requirements, selected);
      const scoring = ScoringEngine.evaluateRequirements({ requirements: challenge.requirements, selectedStructures: selected });
      score = scoring.score;
      const critical = challenge.requirements.filter((x: any) => x.critical);
      const coverageReasons = evaluated.coverageList.map((x: any) => `${x.label}: ${x.explanation}`);
      const missing = expected.filter(x => !selected.includes(x));
      const overdesign = scoring.unnecessarySelections.length ? ` Unneeded selections: ${scoring.unnecessarySelections.join(', ')}.` : '';
      const explanation = `Requirement coverage: ${scoring.coveredCriticalCount}/${critical.length} critical requirements (${scoring.coveragePercentage}%). Score after selection precision: ${score}%.${overdesign} ${coverageReasons.join(' ')}`;
      review = { challengeId: challenge.id, title: challenge.title, category: challenge.category, question: challenge.question || challenge.missionBrief, scenario: challenge.missionBrief, selectedOptionId: null, selectedOptionText: selected.map(x => x.replaceAll('-', ' ')).join(', ') || 'Not answered', selectedStructures: selected, correctOptionId: expected[0] || '', correctOptionText: expected.map(x => x.replaceAll('-', ' ').toUpperCase()).join(', '), correctOptionIds: expected, correctOptionNames: expected.map(x => x.replaceAll('-', ' ').toUpperCase()), correctStructures: expected, missingStructures: missing, invalidSelections: scoring.unnecessarySelections, selectedCorrectStructures: selected.filter(x => expected.includes(x)), correctRequiredCount: critical.length, selectedCorrectCount: scoring.coveredCriticalCount, selectedIncorrectCount: scoring.unnecessarySelections.length, isCorrect: score === 100, isPartial: score > 0 && score < 100, status: score === 100 ? 'correct' : score > 0 ? 'partial' : 'incorrect', score, explanation, correctExplanation: challenge.comparisonCriteria?.[0]?.explanation || explanation, relevantReasons: coverageReasons, requirements: challenge.requirements, requirementCoverage: evaluated.coverageList, optimizationRationale: explanation, structureId: expected[0] || 'array', structureName: expected[0]?.replaceAll('-', ' ').toUpperCase() || 'Data Structure' };
      submittedAnswer = selected;
    }
    return { challenge, selected, score, passed: score === 100, submittedAnswer, review, feedback: makeStoredSubmissionFeedback({ submissionId, level, submittedAnswer, coverageTopics: challenge.coverageTopics || [], syllabusTopic: challenge.syllabusTopic, review }) };
  });
}
function expectedMatch(state: ReturnType<typeof summarize>, row: (typeof expected)[number]) {
  const actual = [state.xp, state.unlocked, state.streak, state.byLevel, state.attempts, state.accuracy, state.score, state.badges];
  return { actual, matches: actual.every((v, i) => v === row[i]) };
}

async function main() {
  const databaseName = process.env.DATABASE_URL ? decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1)) : '';
  console.log(`Database: ${databaseName || '(unavailable)'}`);
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed when NODE_ENV=production.');
  if (!process.argv.includes('--confirm')) throw new Error('Refusing without --confirm.');
  if (!databaseName) throw new Error('DATABASE_URL must include a database name.');
  if (databaseName.toLowerCase().endsWith('_test')) throw new Error('Refusing to seed a database ending in _test.');
  const reset = process.argv.includes('--reset-sample');
  const [challengeRows, achievementRows] = await Promise.all([prisma.challenge.findMany({ orderBy: [{ level: 'asc' }, { id: 'asc' }] }), prisma.achievement.findMany()]);
  if (challengeRows.length !== 95 || achievementRows.length !== 15) throw new Error(`Found ${challengeRows.length} challenges and ${achievementRows.length} achievements; expected 95 and 15. Start the server once to seed its catalog.`);
  const challenges = challengeRows.map(row => row.payload as unknown as ChallengeData);
  const achievements = new Map(achievementRows.map(a => [a.code, a]));
  if (ACHIEVEMENT_DEFINITIONS.some(a => !achievements.has(a.code))) throw new Error('Database achievement catalog does not match the application definitions.');
  const today = new Date();
  const midnight = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const now = new Date(Date.now() - 2 * 60 * 60 * 1000);
  if (now < midnight) throw new Error('Offset-0 time would be before 00:00 UTC today. Rerun later.');
  const existing = await prisma.user.findMany({ where: { email: { in: samples.map(s => s.email) } }, select: { email: true } });
  const existingEmails = new Set(existing.map(user => user.email));
  if (existingEmails.size && !reset) console.log(`Skipping existing sample users: ${[...existingEmails].join(', ')}`);
  // Simulate all users before any write so expected-value mismatches cannot leave partial data.
  const simulations: Array<{ sample: Sample; attempts: any[]; completions: any[]; badges: any[]; progress: any; mismatch: string }> = [];
  for (let index = 0; index < samples.length; index++) {
    const sample = samples[index];
    if (existingEmails.has(sample.email) && !reset) continue;
    const userId = `user-SIMULATED-${index}`;
    const createdAt = new Date(Date.UTC(midnight.getUTCFullYear(), midnight.getUTCMonth(), midnight.getUTCDate() - sample.created, 8));
    let progress = { streak: 0, lastActive: createdAt };
    const attempts: any[] = [], completions: any[] = [], badges: any[] = [];
    const submissions = [...sample.submissions].sort((a, b) => b.offset - a.offset);
    for (const spec of submissions) {
      const time = submissionTime(midnight, spec.offset, now);
      const submissionId = randomUUID();
      const pending = buildPending(challenges, spec.level, spec.target, sample.email, submissionId);
      const priorPassed = new Set(attempts.filter(a => a.status === 'passed').map(a => a.challenge_id));
      const existingProg = summarizeUserProgress(challenges, priorPassed);
      if (spec.level > existingProg.unlockedLevel) throw new Error(`${sample.email}: level ${spec.level} is locked during simulation.`);
      for (const p of pending) if (p.passed && !priorPassed.has(p.challenge.id)) completions.push({ challenge_id: p.challenge.id, completed_at: time, reward_xp: p.challenge.rewardXp });
      attempts.push(...pending.map(p => ({ challenge_id: p.challenge.id, status: p.passed ? 'passed' : 'failed', score: p.score, submission_id: submissionId, completed_at: time, reward_awarded: p.passed && !priorPassed.has(p.challenge.id), selected_structures: p.selected, feedback: p.feedback })));
      progress = { streak: advanceUtcStreak(progress.streak, progress.lastActive.toISOString(), time), lastActive: time };
      const states = calculateAchievementProgress({ definitions: ACHIEVEMENT_DEFINITIONS, challenges: challenges.map(c => ({ id: c.id, level: c.level, coverageTopics: c.coverageTopics })), attempts, streak: progress.streak });
      const badgeCodes = new Set(badges.map(b => b.achievement_id));
      for (const state of states) if (state.eligible && !badgeCodes.has(state.code)) {
        const dbAchievement = achievements.get(state.code)!;
        badges.push({ achievement_id: state.code, unlocked_at: time, xp_bonus: dbAchievement.xp_bonus });
        badgeCodes.add(state.code);
      }
    }
    const state = summarize(attempts, completions, badges, progress, challenges);
    const { actual, matches } = expectedMatch(state, expected[index]);
    simulations.push({ sample, attempts, completions, badges, progress, mismatch: matches ? '' : `actual ${JSON.stringify(actual)} expected ${JSON.stringify(expected[index])}` });
  }
  const mismatches = simulations.filter(x => x.mismatch);
  if (mismatches.length) { for (const m of mismatches) console.error(`${m.sample.email}: ${m.mismatch}`); throw new Error('Simulated results differ from STEP 6. No database rows were written.'); }
  if (!reset && existingEmails.size) {
    // Existing users are intentionally not included in a re-seed; the full-table expectation only applies to users recreated in this invocation.
  }
  for (const simulation of simulations) {
    const { sample } = simulation;
    const userId = `user-${randomUUID()}`;
    const createdAt = new Date(Date.UTC(midnight.getUTCFullYear(), midnight.getUTCMonth(), midnight.getUTCDate() - sample.created, 8));
    const passHash = await bcrypt.hash(passwords.get(sample.email)!, 10);
    await prisma.$transaction(async tx => {
      if (reset) await tx.user.deleteMany({ where: { email: sample.email } });
      await tx.user.create({ data: { id: userId, name: sample.name, email: sample.email, password_hash: passHash, avatar: 'avatar-1', title: 'Novice Architect', bio: 'Ready to design the impossible with data structures.', created_at: createdAt } });
      await tx.userProgress.create({ data: { id: `prog-${userId}`, user_id: userId, level: 1, unlocked_level: 1, xp: 0, score: 0, completed_challenges: 0, accuracy: 0, streak: 0, last_active: createdAt } });
      const attempts: any[] = [], completions: any[] = [], badges: any[] = [];
      for (const spec of [...sample.submissions].sort((a, b) => b.offset - a.offset)) {
        const time = submissionTime(midnight, spec.offset, now);
        const submissionId = randomUUID();
        const pending = buildPending(challenges, spec.level, spec.target, sample.email, submissionId);
        const passedBefore = new Set(attempts.filter(a => a.status === 'passed').map(a => a.challenge_id));
        for (const p of pending) if (p.passed && !passedBefore.has(p.challenge.id)) completions.push({ id: `completion-${randomUUID()}`, user_id: userId, challenge_id: p.challenge.id, completed_at: time });
        const newRows = pending.map(p => ({ id: `att-${randomUUID()}`, user_id: userId, challenge_id: p.challenge.id, selected_structures: p.selected as Prisma.InputJsonValue, score: p.score, correctness_score: p.score, submission_id: submissionId, feedback: p.feedback as Prisma.InputJsonValue, status: p.passed ? 'passed' : 'failed', completed_at: time, reward_awarded: p.passed && !passedBefore.has(p.challenge.id) }));
        attempts.push(...newRows);
        if (completions.length) await tx.challengeCompletion.createMany({ data: completions.splice(0) });
        await tx.challengeAttempt.createMany({ data: newRows });
        const streak = advanceUtcStreak((await tx.userProgress.findUniqueOrThrow({ where: { user_id: userId }, select: { streak: true, last_active: true } })).streak, (await tx.userProgress.findUniqueOrThrow({ where: { user_id: userId }, select: { last_active: true } })).last_active.toISOString(), time);
        const allAttempts = await tx.challengeAttempt.findMany({ where: { user_id: userId } });
        const earned = new Set(badges.map(b => b.achievement_id));
        const states = calculateAchievementProgress({ definitions: ACHIEVEMENT_DEFINITIONS, challenges: challenges.map(c => ({ id: c.id, level: c.level, coverageTopics: c.coverageTopics })), attempts: allAttempts, streak });
        for (const state of states) if (state.eligible && !earned.has(state.code)) {
          const a = achievements.get(state.code)!;
          const badge = { id: `ua-${randomUUID()}`, user_id: userId, achievement_id: state.code, unlocked_at: time };
          await tx.userAchievement.create({ data: badge });
          badges.push({ ...badge, xp_bonus: a.xp_bonus }); earned.add(state.code);
        }
        const passed = new Set(allAttempts.filter(a => a.status === 'passed').map(a => a.challenge_id));
        const attempted = new Set(allAttempts.map(a => a.challenge_id));
        const best = new Map<string, number>();
        for (const a of allAttempts) best.set(a.challenge_id, Math.max(best.get(a.challenge_id) || 0, a.score));
        const prog = summarizeUserProgress(challenges, passed);
        const awardedCompletions = await tx.challengeCompletion.findMany({ where: { user_id: userId }, select: { completed_at: true, challenge: { select: { reward_xp: true } } } });
        const awardedBadges = await tx.userAchievement.findMany({ where: { user_id: userId }, select: { unlocked_at: true, achievement: { select: { xp_bonus: true } } } });
        const xp = calculateAllTimeXp(awardedCompletions.map(c => ({ completedAt: c.completed_at, rewardXp: c.challenge.reward_xp })), awardedBadges.map(b => ({ unlockedAt: b.unlocked_at, xpBonus: b.achievement.xp_bonus })));
        await tx.userProgress.update({ where: { user_id: userId }, data: { level: prog.level, unlocked_level: prog.unlockedLevel, xp, completed_challenges: prog.completedChallenges, accuracy: attempted.size ? Math.round(passed.size / attempted.size * 100) : 0, score: [...best.values()].reduce((a, b) => a + b, 0), streak, last_active: time } });
      }
      // No-submission users retain sign-up defaults. All written progress was derived after each simulated commit.
    });
    console.log(`Created ${sample.email} (${passwords.get(sample.email)})`);
  }
  console.log('Seed complete.');
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Seed failed.'); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
