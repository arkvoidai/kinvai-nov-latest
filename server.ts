import 'dotenv/config';
import { createApp } from './server/app.ts';

const PORT = Number(process.env.PORT || 3000);

async function start(): Promise<void> {
  const app = await createApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[kinvai] server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[kinvai] failed to start server:', err);
  process.exit(1);
});
