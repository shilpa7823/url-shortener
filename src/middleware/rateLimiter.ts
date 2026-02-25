import { Request, Response, NextFunction } from 'express';
import redis from 'redis';

const redisClient = redis.createClient();

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = `rate_limit:${req.ip}`;
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

  try {
    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, Math.ceil(windowMs / 1000));
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

    if (current > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: await redisClient.ttl(key),
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next();
  }
}

export default rateLimiter;
