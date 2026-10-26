import { Request, Response, NextFunction } from 'express';

type Bucket = { count: number; resetAt: number };
export function createRateLimiter(windowMs: number, maxRequests: number) {
  const buckets = new Map<string, Bucket>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (buckets.size > 10_000) for (const [ip, value] of buckets) if (value.resetAt <= now) buckets.delete(ip);
    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', Math.max(0, maxRequests - bucket.count));
    if (bucket.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
      return;
    }
    next();
  };
}
