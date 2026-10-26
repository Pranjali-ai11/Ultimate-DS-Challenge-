import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/index.js';
import { databaseFailure } from '../db/httpErrors.js';

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  return secret;
}

export interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string; tokenId?: string; expiresAt?: number };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) { res.status(401).json({ success: false, message: 'Authorization token required. Please sign in.' }); return; }
  const token = authHeader.slice('Bearer '.length).trim();
  let decoded: jwt.JwtPayload & { id: string; email: string; name: string };
  try {
    decoded = jwt.verify(token, jwtSecret()) as jwt.JwtPayload & { id: string; email: string; name: string };
    if (!decoded.id || !decoded.email) throw new Error('Invalid token claims.');
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired session. Please sign in again.' });
    return;
  }
  try {
    const tokenId = decoded.jti;
    if (tokenId) {
      const revoked = await prisma.revokedToken.findUnique({ where: { token_id: tokenId }, select: { expires_at: true } });
      if (revoked && revoked.expires_at.getTime() > Date.now()) { res.status(401).json({ success: false, message: 'Session has ended. Please sign in again.' }); return; }
      if (revoked) await prisma.revokedToken.delete({ where: { token_id: tokenId } });
    }
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name, tokenId: decoded.jti, expiresAt: decoded.exp };
    next();
  } catch (error) { databaseFailure(res, 'session verification', error, 'Could not verify the session.'); }
}
