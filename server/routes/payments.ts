import { Router } from 'express';

export const paymentsRouter = Router();

// Stubbed for Prompt 6 (Razorpay & PayPal checkout integration)
paymentsRouter.all('*', (_req, res) => {
  res.status(501).json({
    error: 'Payment routes are scheduled for the checkout integration phase.',
  });
});
