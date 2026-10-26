import { Router } from 'express';
import { register, login, getMe, forgotPassword, updateProfile, updatePassword, logout } from '../controllers/authController.js';
import { getAllChallenges, getChallengeById, submitLevelQuiz } from '../controllers/challengeController.js';
import { getUserProgress } from '../controllers/progressController.js';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { getAllAchievements } from '../controllers/achievementController.js';
import { getLearnCatalog, getStructureDetail } from '../controllers/learnController.js';
import { getSavedSubmission } from '../controllers/resultsController.js';
import { authMiddleware } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();
const authRateLimit = createRateLimiter(15 * 60 * 1000, 20);
const submissionRateLimit = createRateLimiter(60 * 1000, 30);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'ULTIMATE DS CHALLENGE' });
});

// Authentication routes
router.post('/auth/register', authRateLimit, register);
router.post('/auth/login', authRateLimit, login);
router.post('/auth/forgot-password', authRateLimit, forgotPassword);
router.post('/auth/logout', authMiddleware, logout);
router.get('/auth/me', authMiddleware, getMe);
router.patch('/auth/profile', authMiddleware, updateProfile);
router.patch('/auth/password', authMiddleware, authRateLimit, updatePassword);

// Challenge routes
router.get('/challenges', getAllChallenges);
router.get('/challenges/:id', getChallengeById);
router.post('/challenges/level/:level/quiz-submit', submissionRateLimit, authMiddleware, submitLevelQuiz);
router.get('/results/:id', authMiddleware, getSavedSubmission);

// Progress & Stats
router.get('/progress', authMiddleware, getUserProgress);

// Leaderboard & Achievements
router.get('/leaderboard', authMiddleware, getLeaderboard);
router.get('/achievements', authMiddleware, getAllAchievements);

// Educational Learn Hub
router.get('/learn', getLearnCatalog);
router.get('/learn/:id', getStructureDetail);

export default router;
