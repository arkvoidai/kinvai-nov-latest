import { Router } from 'express';
import { z } from 'zod';
import { createRateLimitMiddleware } from '../lib/rateLimit.ts';
import { getSupabaseAdmin } from '../services/supabaseAdmin.ts';

export const formsRouter = Router();

const NewsletterBodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.')
    .max(254, 'Email address is too long.'),
  // Hidden honeypot field: real humans leave this empty
  website: z.string().max(120).optional().default(''),
});

const newsletterLimiter = createRateLimitMiddleware({
  windowMs: 60_000,
  maxRequests: 5,
  keyPrefix: 'newsletter',
});

/**
 * Pure validation helper exported for unit testing.
 */
export function validateNewsletterPayload(input: unknown) {
  return NewsletterBodySchema.safeParse(input);
}

formsRouter.post('/newsletter', newsletterLimiter, async (req, res) => {
  const parsed = NewsletterBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Enter a valid email address.',
    });
    return;
  }

  // Honeypot triggered — silently accept without touching database
  if (parsed.data.website.trim().length > 0) {
    res.status(200).json({
      ok: true,
      duplicate: false,
      message: "You're on the list. Expect quiet notes when new systems ship.",
    });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    res.status(503).json({
      error: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
    });
    return;
  }

  try {
    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert({ email: parsed.data.email });

    if (error) {
      // Postgres unique_violation (23505) — already subscribed
      if (error.code === '23505' || /duplicate key/i.test(error.message || '')) {
        res.status(200).json({
          ok: true,
          duplicate: true,
          message: "You're already subscribed — no need to sign up twice.",
        });
        return;
      }

      res.status(500).json({
        error: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
      });
      return;
    }

    res.status(201).json({
      ok: true,
      duplicate: false,
      message: "You're on the list. Expect quiet notes when new systems ship.",
    });
  } catch {
    res.status(500).json({
      error: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
    });
  }
});

formsRouter.post('/contact', (_req, res) => {
  res.status(501).json({
    error: 'Contact submission endpoint is scheduled for the support wiring phase.',
  });
});
