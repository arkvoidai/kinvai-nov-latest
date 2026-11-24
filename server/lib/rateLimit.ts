import type { Request, Response, NextFunction } from 'express';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface BucketEntry {
  count: number;
  resetAt: number;
}

export class MemoryRateLimiter {
  private readonly store = new Map<string, BucketEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: { windowMs: number; maxRequests: number }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  check(key: string, now: number = Date.now()): RateLimitResult {
    const existing = this.store.get(key);
    if (!existing || now >= existing.resetAt) {
      const resetAt = now + this.windowMs;
      this.store.set(key, { count: 1, resetAt });
      this.prune(now);
      return {
        allowed: true,
        remaining: Math.max(0, this.maxRequests - 1),
        resetAt,
      };
    }

    if (existing.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - existing.count),
      resetAt: existing.resetAt,
    };
  }

  prune(now: number = Date.now()): void {
    if (this.store.size < 500) return;
    for (const [k, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(k);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const limiter = new MemoryRateLimiter({
    windowMs: options.windowMs,
    maxRequests: options.maxRequests,
  });
  const prefix = options.keyPrefix || 'rl';

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim() || req.ip || 'unknown'
        : req.ip || 'unknown';
    const result = limiter.check(`${prefix}:${ip}`);

    res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      res.status(429).json({
        error: 'Too many requests. Please try again shortly.',
        retryAfterSeconds: Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)),
      });
      return;
    }

    next();
  };
}
