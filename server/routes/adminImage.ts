import express, { Router } from 'express';
import { z } from 'zod';
import { MemoryRateLimiter } from '../lib/rateLimit.ts';
import { requireAdmin } from '../middleware/requireAdmin.ts';
import { GeminiServiceError, generateProductCoverImage } from '../services/gemini.ts';

export const adminImageRouter = Router();

// Allow larger JSON bodies on this route specifically for optional referenceImageBase64 edits
adminImageRouter.use(express.json({ limit: '10mb' }));

// Per-admin rate limiter: max 6 image generations per minute
const perAdminImageLimiter = new MemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 6,
});

const GenerateImageBodySchema = z.object({
  productId: z.string().trim().min(1, 'productId is required.').max(128),
  prompt: z.string().trim().min(10, 'Prompt must be at least 10 characters.').max(3000),
  model: z.string().trim().min(3).max(120).optional(),
  referenceImageBase64: z.string().trim().min(16).max(8_500_000).optional(),
  edit: z.boolean().optional().default(false),
});

adminImageRouter.post('/generate', requireAdmin, async (req, res) => {
  const adminUserId = typeof res.locals.adminUserId === 'string' ? res.locals.adminUserId : 'admin';

  const rateResult = perAdminImageLimiter.check(`admin-image:${adminUserId}`);
  res.setHeader('X-RateLimit-Limit', '6');
  res.setHeader('X-RateLimit-Remaining', String(rateResult.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rateResult.resetAt / 1000)));

  if (!rateResult.allowed) {
    res.status(429).json({
      error: 'Rate limit exceeded: maximum 6 image generations per minute per admin.',
      retryAfterSeconds: Math.max(1, Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
    });
    return;
  }

  const parsed = GenerateImageBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid image generation request.',
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const result = await generateProductCoverImage({
      prompt: parsed.data.prompt,
      model: parsed.data.model,
      referenceImageBase64: parsed.data.referenceImageBase64,
      edit: parsed.data.edit,
    });

    res.status(200).json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
      modelUsed: result.modelUsed,
    });
  } catch (err) {
    if (err instanceof GeminiServiceError) {
      res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    res.status(500).json({
      error: 'Unable to generate image right now. Please try again.',
    });
  }
});
