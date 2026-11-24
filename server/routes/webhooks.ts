import express, { Router } from 'express';

export const webhooksRouter = Router();

// Preserve raw body strictly for webhook signature verification (Razorpay / PayPal)
webhooksRouter.use(express.raw({ type: '*/*', limit: '1mb' }));

// Stubbed for Prompt 6 (Verified payment webhooks)
webhooksRouter.post('/razorpay', (_req, res) => {
  res.status(501).json({ error: 'Razorpay webhook handler not yet activated.' });
});

webhooksRouter.post('/paypal', (_req, res) => {
  res.status(501).json({ error: 'PayPal webhook handler not yet activated.' });
});
