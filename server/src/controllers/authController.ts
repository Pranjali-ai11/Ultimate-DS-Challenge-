import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { prisma } from '../db/index.js';
import { databaseFailure, isUniqueConstraintError } from '../db/httpErrors.js';
import { AuthRequest } from '../middleware/auth.js';

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  return secret;
}

function publicUser(user: { id: string; name: string; email: string; avatar: string; title: string; bio: string; created_at: Date }) {
  return { id: user.id, name: user.name, email: user.email, avatar: user.avatar, title: user.title, bio: user.bio, createdAt: user.created_at.toISOString() };
}

function publicProgress(progress: { level: number; unlocked_level: number; xp: number; score: number; completed_challenges: number; accuracy: number; streak: number }) {
  return { level: progress.level, unlockedLevel: progress.unlocked_level, xp: progress.xp, score: progress.score, completedChallenges: progress.completed_challenges, accuracy: progress.accuracy, streak: progress.streak };
}

function signInToken(user: { id: string; email: string; name: string }) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, jwtSecret(), { expiresIn: '7d', jwtid: randomUUID() });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim() || !email.trim() || !password) {
    res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    return;
  }
  if (name.trim().length > 80 || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ success: false, message: 'Enter a valid name and email address.' });
    return;
  }
  if (password.length < 8 || password.length > 200) {
    res.status(400).json({ success: false, message: 'Password must be between 8 and 200 characters.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = `user-${randomUUID()}`;
  const now = new Date();
  try {
    const user = await prisma.$transaction(async tx => {
      const created = await tx.user.create({ data: {
        id: userId, name: name.trim(), email: normalizedEmail, password_hash: passwordHash,
        avatar: 'avatar-1', title: 'Novice Architect', bio: 'Ready to design the impossible with data structures.', created_at: now
      } });
      await tx.userProgress.create({ data: {
        id: `prog-${userId}`, user_id: userId, level: 1, unlocked_level: 1, xp: 0, score: 0,
        completed_challenges: 0, accuracy: 0, streak: 0, last_active: now
      } });
      return created;
    });
    const progress = await prisma.userProgress.findUniqueOrThrow({ where: { user_id: user.id } });
    res.status(201).json({ success: true, message: 'Account created successfully!', token: signInToken(user), user: publicUser(user), progress: publicProgress(progress) });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }
    databaseFailure(res, 'registration', error, 'Server error during registration.');
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    res.status(400).json({ success: false, message: 'Please provide email and password.' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }
    const progress = await prisma.userProgress.findUnique({ where: { user_id: user.id } });
    res.json({
      success: true, message: `Welcome back, ${user.name} 👋`, token: signInToken(user), user: publicUser(user),
      progress: progress ? publicProgress(progress) : { level: 1, unlockedLevel: 1, xp: 0, score: 0, completedChallenges: 0, accuracy: 0, streak: 0 }
    });
  } catch (error) { databaseFailure(res, 'login', error, 'Server error during login.'); }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { progress: true, achievements: { include: { achievement: true } } } });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    const achievements = user.achievements.map(item => ({
      code: item.achievement.code, name: item.achievement.name, description: item.achievement.description,
      icon: item.achievement.icon, requirement: item.achievement.requirement, xpBonus: item.achievement.xp_bonus,
      unlocked: true, unlockedAt: item.unlocked_at.toISOString()
    }));
    res.json({ success: true, user: publicUser(user), progress: user.progress ? publicProgress(user.progress) : { level: 1, unlockedLevel: 1, xp: 0, score: 0, completedChallenges: 0, accuracy: 0, streak: 0 }, achievements });
  } catch (error) { databaseFailure(res, 'profile lookup', error, 'Error retrieving profile.'); }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['email', 'currentPassword', 'newPassword', 'confirmNewPassword'].includes(key))) {
    res.status(400).json({ success: false, message: 'Only email, currentPassword, newPassword, and confirmNewPassword are accepted.' }); return;
  }
  const { email, currentPassword, newPassword, confirmNewPassword } = body;
  if (typeof email !== 'string' || !email.trim() || typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || !newPassword || typeof confirmNewPassword !== 'string' || !confirmNewPassword) {
    res.status(400).json({ success: false, message: 'Enter your email, current password, new password, and confirmation.' }); return;
  }
  if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ success: false, message: 'Enter a valid email address.' }); return;
  }
  if (newPassword.length < 8 || newPassword.length > 200) {
    res.status(400).json({ success: false, message: 'New password must be between 8 and 200 characters.' }); return;
  }
  if (newPassword !== confirmNewPassword) { res.status(400).json({ success: false, message: 'New passwords do not match.' }); return; }
  if (newPassword === currentPassword) { res.status(400).json({ success: false, message: 'Choose a new password different from your current password.' }); return; }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      res.status(401).json({ success: false, message: 'Account verification failed. Check your email and current password.' }); return;
    }
    const password_hash = await bcrypt.hash(newPassword, 10);
    // Compare-and-set prevents a stale verification from overwriting a newer password change.
    const updated = await prisma.user.updateMany({ where: { id: user.id, password_hash: user.password_hash }, data: { password_hash } });
    if (updated.count !== 1) {
      res.status(401).json({ success: false, message: 'Account verification failed. Check your email and current password.' }); return;
    }
    res.json({ success: true, message: 'Password updated successfully. You can now sign in.' });
  } catch (error) { databaseFailure(res, 'password recovery', error, 'Password could not be saved. Please try again.'); }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
  const { name, bio, avatar, title } = req.body || {};
  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 80)) { res.status(400).json({ success: false, message: 'Name must contain 1 to 80 characters.' }); return; }
  if (bio !== undefined && (typeof bio !== 'string' || bio.length > 500)) { res.status(400).json({ success: false, message: 'Bio must be 500 characters or fewer.' }); return; }
  if (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > 80)) { res.status(400).json({ success: false, message: 'Avatar value is invalid.' }); return; }
  if (title !== undefined && (typeof title !== 'string' || title.length > 60)) { res.status(400).json({ success: false, message: 'Title must be 60 characters or fewer.' }); return; }
  try {
    const user = await prisma.user.update({ where: { id: userId }, data: {
      ...(name !== undefined ? { name: name.trim() } : {}), ...(bio !== undefined ? { bio: bio.trim() } : {}),
      ...(avatar !== undefined ? { avatar } : {}), ...(title !== undefined ? { title: title.trim() } : {})
    } });
    res.json({ success: true, message: 'Profile updated successfully!', user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, title: user.title, bio: user.bio } });
  } catch (error) { databaseFailure(res, 'profile update', error, 'Profile could not be saved. Please try again.'); }
}

export async function updatePassword(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['currentPassword', 'newPassword'].includes(key))) {
    res.status(400).json({ success: false, message: 'Only currentPassword and newPassword are accepted.' }); return;
  }
  const { currentPassword, newPassword } = body;
  if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || !newPassword) { res.status(400).json({ success: false, message: 'Enter your current password and a new password.' }); return; }
  if (newPassword.length < 8 || newPassword.length > 200) { res.status(400).json({ success: false, message: 'New password must be between 8 and 200 characters.' }); return; }
  if (currentPassword === newPassword) { res.status(400).json({ success: false, message: 'Choose a new password different from your current password.' }); return; }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    if (!(await bcrypt.compare(currentPassword, user.password_hash))) { res.status(401).json({ success: false, message: 'Current password is incorrect.' }); return; }
    const password_hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password_hash } });
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) { databaseFailure(res, 'password update', error, 'Password could not be saved. Please try again.'); }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  const { tokenId, expiresAt } = req.user || {};
  if (tokenId && expiresAt) {
    try {
      await prisma.$transaction([
        prisma.revokedToken.upsert({ where: { token_id: tokenId }, create: { token_id: tokenId, expires_at: new Date(expiresAt * 1000) }, update: { expires_at: new Date(expiresAt * 1000) } }),
        prisma.revokedToken.deleteMany({ where: { expires_at: { lte: new Date() } } })
      ]);
    } catch (error) { databaseFailure(res, 'logout', error, 'Session could not be ended on the server. Please retry.'); return; }
  }
  res.json({ success: true, message: 'Signed out.' });
}
