import { Router } from 'express';

export const mediaRouter = Router();

// Stubbed for Prompt 2 (Gemini still-life cover generation)
mediaRouter.all('*', (_req, res) => {
  res.status(501).json({
    error: 'Media generation routes are scheduled for the imagery phase.',
  });
});
