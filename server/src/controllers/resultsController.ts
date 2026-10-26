import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../db/index.js';
import { databaseFailure } from '../db/httpErrors.js';
import { serializeAttemptReview } from '../engine/resultReview.js';

export async function getSavedSubmission(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const id = req.params.id as string;
  if (!userId) { res.status(401).json({ success: false, message: 'Authentication required.' }); return; }
  if (!id || id.length > 191) { res.status(400).json({ success: false, message: 'A valid result ID is required.' }); return; }

  try {
    let attempts = await prisma.challengeAttempt.findMany({
      where: { user_id: userId, submission_id: id },
      include: { challenge: { select: { title: true, payload: true } } },
      orderBy: [{ completed_at: 'asc' }, { challenge_id: 'asc' }]
    });
    if (!attempts.length) {
      const historical = await prisma.challengeAttempt.findFirst({
        where: { user_id: userId, id },
        include: { challenge: { select: { title: true, payload: true } } }
      });
      if (historical) attempts = [historical];
    }
    if (!attempts.length) { res.status(404).json({ success: false, message: 'Saved result was not found.' }); return; }

    const questions = attempts.map(serializeAttemptReview);
    const feedback = attempts[0].feedback as Record<string, unknown> | null;
    res.json({
      success: true,
      submissionId: attempts[0].submission_id || (typeof feedback?.submissionId === 'string' ? feedback.submissionId : null),
      level: typeof feedback?.level === 'number' ? feedback.level : null,
      submittedAt: attempts[0].completed_at.toISOString(),
      historical: questions.some(question => !question.answerDetailsAvailable),
      questions
    });
  } catch (error) { databaseFailure(res, 'saved results lookup', error, 'Failed to load saved results.'); }
}
