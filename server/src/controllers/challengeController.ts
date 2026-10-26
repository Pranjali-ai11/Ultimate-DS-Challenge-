import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../db/index.js';
import { databaseFailure } from '../db/httpErrors.js';
import { getChallenges, findChallenge, ChallengeData } from '../db/catalog.js';
import { RequirementEngine } from '../engine/requirementEngine.js';
import { ScoringEngine } from '../engine/scoringEngine.js';
import { advanceUtcStreak, summarizeProgression, summarizeUserProgress } from '../engine/progressRules.js';
import { calculateAchievementProgress } from '../engine/achievementRules.js';
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievementDefinitions.js';
import { getUnansweredQuestionIds } from '../engine/quizAnswers.js';
import { calculateAllTimeXp } from '../engine/xpAccounting.js';
import { normalizeTopicId } from '../data/topicRegistry.js';
import { makeStoredSubmissionFeedback } from '../engine/submissionReview.js';

function toPublicChallenge(challenge: ChallengeData) {
  const sanitized: any = {
    ...challenge,
    requirements: (challenge.requirements || []).map(({ id, label, description, critical }: any) => ({ id, label, description, critical })),
    options: challenge.options?.map(({ id, text, structureId }: any) => ({ id, text, structureId })),
    comparisonCriteria: challenge.comparisonCriteria?.map(({ criterion, description }: any) => ({ criterion, description }))
  };
  delete sanitized.optimalStructures;
  delete sanitized.simulationScenario;
  return sanitized;
}

export async function getAllChallenges(req: Request, res: Response): Promise<void> {
  try {
    const { level, difficulty, category, topic } = req.query;
    const allChallenges = await getChallenges();
    let list = allChallenges;
    if (level !== undefined) {
      const parsed = Number(level);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 4) { res.status(400).json({ success: false, message: 'Level must be an integer from 1 to 4.' }); return; }
      list = list.filter(challenge => challenge.level === parsed);
    }
    if (difficulty) list = list.filter(challenge => challenge.difficulty.toLowerCase() === String(difficulty).toLowerCase());
    if (category) list = list.filter(challenge => challenge.category.toLowerCase().includes(String(category).toLowerCase()));
    if (topic !== undefined) {
      const topicId = normalizeTopicId(topic);
      if (!topicId) { res.status(400).json({ success: false, message: 'Topic is not in the learning catalog.' }); return; }
      list = list.filter(challenge => Array.isArray(challenge.coverageTopics) && challenge.coverageTopics.includes(topicId));
    }
    res.json({ success: true, total: list.length, challenges: list.map(toPublicChallenge), progression: summarizeProgression(allChallenges) });
  } catch (error) { databaseFailure(res, 'challenge catalog lookup', error, 'Failed to fetch challenges.'); }
}

export async function getChallengeById(req: Request, res: Response): Promise<void> {
  try {
    const challenge = await findChallenge(req.params.id as string);
    if (!challenge) { res.status(404).json({ success: false, message: 'Challenge not found.' }); return; }
    res.json({ success: true, challenge: toPublicChallenge(challenge) });
  } catch (error) { databaseFailure(res, 'challenge lookup', error, 'Failed to load challenge details.'); }
}

function serializeProgress(progress: { level: number; unlocked_level: number; xp: number; score: number; completed_challenges: number; accuracy: number; streak: number }) {
  return { level: progress.level, unlockedLevel: progress.unlocked_level, xp: progress.xp, score: progress.score, completedChallenges: progress.completed_challenges, accuracy: progress.accuracy, streak: progress.streak };
}

type PendingAttempt = {
  challenge: ChallengeData;
  selected: string[];
  score: number;
  passed: boolean;
  review: any;
  submittedAnswer: string | string[] | null;
};

function makeAttempt(userId: string, item: PendingAttempt, now: Date, rewardAwarded: boolean, submissionId: string) {
  return {
    id: `att-${randomUUID()}`, user_id: userId, challenge_id: item.challenge.id,
    selected_structures: item.selected, score: item.score, correctness_score: item.score,
    submission_id: submissionId,
    feedback: makeStoredSubmissionFeedback({
      submissionId, level: item.challenge.level, submittedAnswer: item.submittedAnswer,
      coverageTopics: item.challenge.coverageTopics || [], syllabusTopic: item.challenge.syllabusTopic,
      review: item.review
    }) as Prisma.InputJsonValue,
    status: item.passed ? 'passed' : 'failed', completed_at: now, reward_awarded: rewardAwarded
  };
}

async function commitSubmission(userId: string, level: number, allChallenges: ChallengeData[], challenges: ChallengeData[], pending: PendingAttempt[], correctCount: number, partialCount: number, reviews: any[], submissionId: string, now: Date, res: Response): Promise<void> {
  const result = await prisma.$transaction(async tx => {
    const progress = await tx.userProgress.upsert({
      where: { user_id: userId },
      create: { id: `prog-${userId}`, user_id: userId, level: 1, unlocked_level: 1, xp: 0, score: 0, completed_challenges: 0, accuracy: 0, streak: 0, last_active: new Date(0) },
      update: {}
    });
    // Serialize submissions for this learner before reading attempts or calculating unlock state.
    await tx.$queryRaw<Array<{ user_id: string }>>(Prisma.sql`SELECT user_id FROM user_progress WHERE user_id = ${userId} FOR UPDATE`);
    const duplicate = await tx.challengeAttempt.findFirst({ where: { user_id: userId, submission_id: submissionId }, select: { id: true } });
    if (duplicate) return { duplicate: true as const };

    const oldAttempts = await tx.challengeAttempt.findMany({ where: { user_id: userId } });
    const priorPassed = new Set(oldAttempts.filter(attempt => attempt.status === 'passed').map(attempt => attempt.challenge_id));
    const existingProgress = summarizeUserProgress(allChallenges, priorPassed);
    if (level > existingProgress.unlockedLevel) return { locked: true as const, unlockedLevel: existingProgress.unlockedLevel };
    let challengeXpEarned = 0;
    let badgeBonusXp = 0;
    const rewardByChallenge = new Map<string, boolean>();
    for (const item of pending) {
      if (!item.passed || priorPassed.has(item.challenge.id)) { rewardByChallenge.set(item.challenge.id, false); continue; }
      const inserted = await tx.challengeCompletion.createMany({
        data: [{ id: `completion-${randomUUID()}`, user_id: userId, challenge_id: item.challenge.id, completed_at: now }],
        skipDuplicates: true
      });
      const awarded = inserted.count === 1;
      rewardByChallenge.set(item.challenge.id, awarded);
      if (awarded) challengeXpEarned += item.challenge.rewardXp;
    }

    const newAttempts = pending.map(item => makeAttempt(userId, item, now, rewardByChallenge.get(item.challenge.id) || false, submissionId));
    if (newAttempts.length) await tx.challengeAttempt.createMany({ data: newAttempts as Prisma.ChallengeAttemptCreateManyInput[] });
    const allAttempts = [...oldAttempts, ...newAttempts];
    const passedAttempts = allAttempts.filter(attempt => attempt.status === 'passed');
    const passedIds = new Set(passedAttempts.map(attempt => attempt.challenge_id));
    const attemptedIds = new Set(allAttempts.map(attempt => attempt.challenge_id));
    const bestScores = new Map<string, number>();
    for (const attempt of allAttempts) bestScores.set(attempt.challenge_id, Math.max(bestScores.get(attempt.challenge_id) || 0, attempt.score));
    const updatedProgress = summarizeUserProgress(allChallenges, passedIds);
    const newlyUnlockedLevel: number | null = updatedProgress.unlockedLevel > existingProgress.unlockedLevel
      ? updatedProgress.unlockedLevel
      : null;
    const streak = advanceUtcStreak(progress.streak, progress.last_active.toISOString(), now);
    const achievementInput = {
      definitions: ACHIEVEMENT_DEFINITIONS,
      challenges: allChallenges.map(challenge => ({ id: challenge.id, level: challenge.level, coverageTopics: challenge.coverageTopics })),
      attempts: allAttempts.map(attempt => ({ challenge_id: attempt.challenge_id, status: attempt.status, score: attempt.score })),
      streak
    };
    const achievementProgress = calculateAchievementProgress(achievementInput);
    const completionAchievements = achievementProgress.filter(item => item.eligible).map(item => item.code);
    const progressByCode = new Map(achievementProgress.map(item => [item.code, item]));
    const awarded: any[] = [];
    for (const code of completionAchievements) {
      const achievement = await tx.achievement.findUnique({ where: { code } });
      if (!achievement) continue;
      const insertion = await tx.userAchievement.createMany({
        data: [{ id: `ua-${randomUUID()}`, user_id: userId, achievement_id: code, unlocked_at: now }],
        skipDuplicates: true
      });
      if (insertion.count === 1) {
        badgeBonusXp += achievement.xp_bonus;
        const state = progressByCode.get(achievement.code);
        awarded.push({
          id: achievement.code, code: achievement.code, name: achievement.name, description: achievement.description,
          icon: achievement.icon, requirement: achievement.requirement, xpBonus: achievement.xp_bonus,
          xpReward: achievement.xp_bonus, category: state?.category || 'Milestone', topic: state?.topic,
          progressCurrent: state?.current, progressTarget: state?.target, progressPercent: state?.percent,
          progressType: state?.progressType || 'status', progressLabel: state?.progressLabel || 'Requirement met',
          unlocked: true, earned: true, newlyEarned: true, almostEarned: false, unlockedAt: now.toISOString()
        });
      }
    }
    const [awardedCompletions, awardedBadges] = await Promise.all([
      tx.challengeCompletion.findMany({ where: { user_id: userId }, select: { completed_at: true, challenge: { select: { reward_xp: true } } } }),
      tx.userAchievement.findMany({ where: { user_id: userId }, select: { unlocked_at: true, achievement: { select: { xp_bonus: true } } } })
    ]);
    const totalAwardedXp = calculateAllTimeXp(
      awardedCompletions.map(item => ({ completedAt: item.completed_at, rewardXp: item.challenge.reward_xp })),
      awardedBadges.map(item => ({ unlockedAt: item.unlocked_at, xpBonus: item.achievement.xp_bonus }))
    );
    const updated = await tx.userProgress.update({ where: { user_id: userId }, data: {
      level: updatedProgress.level, unlocked_level: updatedProgress.unlockedLevel, xp: totalAwardedXp,
      completed_challenges: updatedProgress.completedChallenges,
      accuracy: attemptedIds.size ? Math.round(passedIds.size / attemptedIds.size * 100) : 0,
      score: Array.from(bestScores.values()).reduce((sum, value) => sum + value, 0),
      streak, last_active: now
    } });
    return { locked: false as const, progress: updated, earnedXp: challengeXpEarned + badgeBonusXp, challengeXpEarned, badgeBonusXp, newlyUnlockedLevel, awarded };
  });

  if ('duplicate' in result && result.duplicate) { res.status(409).json({ success: false, code: 'SUBMISSION_ALREADY_PROCESSED', submissionId, message: 'This submission was already saved. Open its saved review to see the result.' }); return; }
  if (result.locked) { res.status(403).json({ success: false, message: `Level ${level} is locked.` }); return; }
  const totalQuestions = challenges.length;
  const percentage = totalQuestions ? Math.round(reviews.reduce((sum, item) => sum + item.score, 0) * 100 / totalQuestions) / 100 : 0;
  res.json({ success: true, submissionId, level, score: percentage, totalQuestions, correctCount, partialCount, incorrectCount: totalQuestions - correctCount - partialCount, percentage, earnedXp: result.earnedXp, challengeXpEarned: result.challengeXpEarned, badgeBonusXp: result.badgeBonusXp, newlyUnlockedLevel: result.newlyUnlockedLevel, newAchievements: result.awarded, reviews, progress: serializeProgress(result.progress) });
}

export async function submitLevelQuiz(req: AuthRequest, res: Response): Promise<void> {
  const level = Number(req.params.level);
  if (!Number.isInteger(level) || level < 1 || level > 4) { res.status(400).json({ success: false, message: 'Level must be an integer from 1 to 4.' }); return; }
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required to submit quiz.' }); return; }
    const answers = req.body?.answers;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) { res.status(400).json({ success: false, message: 'A valid answers object is required.' }); return; }
    if (Object.keys(req.body).some(key => !['answers', 'submissionId'].includes(key))) { res.status(400).json({ success: false, message: 'Only answers and a submission ID are accepted; scores are calculated by the server.' }); return; }
    const submissionId = req.body?.submissionId;
    if (typeof submissionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) { res.status(400).json({ success: false, message: 'A valid submission ID is required.' }); return; }
    const allChallenges = await getChallenges();
    const challenges = allChallenges.filter(challenge => challenge.level === level).sort((a, b) => a.id.localeCompare(b.id));
    if (Object.keys(answers).some(id => !challenges.some(challenge => challenge.id === id))) { res.status(400).json({ success: false, message: 'Answers contain a challenge outside this level.' }); return; }
    const pending: PendingAttempt[] = [];
    const reviews: any[] = [];
    let correctCount = 0;
    let partialCount = 0;
    for (const challenge of challenges) {
      const answer = answers[challenge.id];
      let selected: string[] = [];
      let score = 0;
      let isCorrect = false;
      let isPartial = false;
      let review: any;
      if (level === 1 || level === 2) {
        if (answer !== undefined && answer !== null && typeof answer !== 'string') { res.status(400).json({ success: false, message: `Answer for ${challenge.id} must be one choice ID or null.` }); return; }
        if (typeof answer === 'string') {
          const choices: string[] = level === 1 ? (challenge.options || []).map((option: any) => option.id) : challenge.availableStructures;
          if (!choices.includes(answer)) { res.status(400).json({ success: false, message: `Choice is not offered for ${challenge.id}.` }); return; }
          selected = [level === 1 ? challenge.options.find((option: any) => option.id === answer)?.structureId : answer].filter(Boolean);
        }
        const selectedId = typeof answer === 'string' ? answer : null;
        const selectedOption = level === 1 ? challenge.options?.find((option: any) => option.id === selectedId) : null;
        const correctOption = level === 1 ? challenge.options?.find((option: any) => option.isCorrect) : null;
        const correctIds: string[] = level === 1 ? (correctOption ? [correctOption.id] : []) : challenge.optimalStructures;
        isCorrect = level === 1 ? Boolean(selectedOption && selectedOption.isCorrect) : Boolean(selectedId && correctIds.includes(selectedId));
        score = isCorrect ? 100 : 0;
        if (isCorrect) correctCount += 1;
        const criteria = (challenge.comparisonCriteria || []).filter((entry: any) => entry.bestChoice === selectedId || entry.bestChoice === correctIds[0]);
        const selectedWhy = selectedOption?.explanation;
        const explanation = level === 1
          ? [selectedWhy, !isCorrect && correctOption?.explanation ? `Correct answer: ${correctOption.explanation}` : ''].filter(Boolean).join(' ')
          : criteria.map((entry: any) => `${entry.criterion}: ${entry.explanation}`).join(' ') || `Best choice: ${correctIds.join(', ')}.`;
        const selectedText = level === 1 ? selectedOption?.text || 'Not answered' : selectedId?.replaceAll('-', ' ').toUpperCase() || 'Not answered';
        const correctText = level === 1 ? correctOption?.text || 'No correct answer configured' : correctIds.map((id: string) => id.replaceAll('-', ' ').toUpperCase()).join(', ');
        review = {
          challengeId: challenge.id, title: challenge.title, category: challenge.category,
          question: challenge.question || challenge.missionBrief, selectedOptionId: selectedId, selectedOptionText: selectedText,
          score, structureId: selected[0] || null, structureName: selected[0]?.replaceAll('-', ' ').toUpperCase() || 'Answer',
          correctOptionId: correctIds[0] || '', correctOptionText: correctText, correctOptionIds: correctIds,
          correctOptionNames: [correctText], isCorrect, explanation, correctExplanation: correctOption?.explanation || explanation,
          relevantReasons: criteria.map((entry: any) => `${entry.criterion}: ${entry.explanation}`)
        };
      } else {
        if (answer !== undefined && (!Array.isArray(answer) || answer.some((choice: unknown) => typeof choice !== 'string'))) { res.status(400).json({ success: false, message: `Answers for ${challenge.id} must be an array of choice IDs.` }); return; }
        const choices = Array.isArray(answer) ? answer : [];
        if (new Set(choices).size !== choices.length || choices.some((choice: string) => !challenge.availableStructures.includes(choice))) { res.status(400).json({ success: false, message: `Answers for ${challenge.id} contain a duplicate or unoffered choice.` }); return; }
        selected = choices;
        const evaluated = RequirementEngine.evaluateRequirements(challenge.requirements, selected);
        const scoring = ScoringEngine.evaluateRequirements({ requirements: challenge.requirements, selectedStructures: selected });
        const critical = challenge.requirements.filter((item: any) => item.critical);
        const expected: string[] = challenge.optimalStructures || [];
        score = scoring.score;
        isCorrect = score === 100;
        isPartial = score > 0 && score < 100;
        if (isCorrect) correctCount += 1;
        else if (isPartial) partialCount += 1;
        const coverageReasons = evaluated.coverageList.map((item: any) => `${item.label}: ${item.explanation}`);
        const missing = expected.filter(item => !selected.includes(item));
        const overdesign = scoring.unnecessarySelections.length ? ` Unneeded selections: ${scoring.unnecessarySelections.join(', ')}.` : '';
        const explanation = `Requirement coverage: ${scoring.coveredCriticalCount}/${critical.length} critical requirements (${scoring.coveragePercentage}%). Score after selection precision: ${score}%.${overdesign} ${coverageReasons.join(' ')}`;
        review = {
          challengeId: challenge.id, title: challenge.title, category: challenge.category,
          question: challenge.question || challenge.missionBrief, scenario: challenge.missionBrief,
          selectedOptionId: null, selectedOptionText: selected.map(item => item.replaceAll('-', ' ')).join(', ') || 'Not answered',
          selectedStructures: selected, correctOptionId: expected[0] || '', correctOptionText: expected.map(item => item.replaceAll('-', ' ').toUpperCase()).join(', '),
          correctOptionIds: expected, correctOptionNames: expected.map(item => item.replaceAll('-', ' ').toUpperCase()),
          correctStructures: expected, missingStructures: missing, invalidSelections: scoring.unnecessarySelections,
          selectedCorrectStructures: selected.filter(item => expected.includes(item)), correctRequiredCount: critical.length,
          selectedCorrectCount: scoring.coveredCriticalCount, selectedIncorrectCount: scoring.unnecessarySelections.length,
          isCorrect, isPartial, status: isCorrect ? 'correct' : isPartial ? 'partial' : 'incorrect', score,
          explanation, correctExplanation: challenge.comparisonCriteria?.[0]?.explanation || explanation,
          relevantReasons: coverageReasons, requirements: challenge.requirements, requirementCoverage: evaluated.coverageList,
          optimizationRationale: explanation, structureId: expected[0] || 'array',
          structureName: expected[0]?.replaceAll('-', ' ').toUpperCase() || 'Data Structure'
        };
      }
      pending.push({ challenge, selected, score, passed: isCorrect, review, submittedAnswer: typeof answer === 'string' || Array.isArray(answer) ? answer : null });
      reviews.push(review);
    }
    const unansweredQuestionIds = getUnansweredQuestionIds(challenges, answers, level);
    if (unansweredQuestionIds.length) {
      res.status(400).json({
        success: false,
        message: `Answer all ${challenges.length} questions before submitting (${unansweredQuestionIds.length} remaining).`,
        answeredQuestions: challenges.length - unansweredQuestionIds.length,
        remainingQuestions: unansweredQuestionIds.length,
        unansweredQuestionIds
      });
      return;
    }
    await commitSubmission(userId, level, allChallenges, challenges, pending, correctCount, partialCount, reviews, submissionId, new Date(), res);
  } catch (error) { databaseFailure(res, 'quiz submission', error, 'Failed to process quiz submission.'); }
}
