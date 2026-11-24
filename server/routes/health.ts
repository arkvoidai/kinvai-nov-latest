import { Router } from 'express';
import { getPublicServerConfig } from '../lib/config.ts';

export const healthRouter = Router();

healthRouter.get('/healthz', (_req, res) => {
  const pub = getPublicServerConfig();
  res.status(200).json({
    status: 'ok',
    service: 'kinvai',
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(pub.supabaseUrl && pub.supabasePublishableKey),
    flags: pub.flags,
  });
});
