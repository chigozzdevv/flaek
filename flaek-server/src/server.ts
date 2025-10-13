import 'dotenv/config';
import { createServer } from 'http';
import { app } from '@/app';
import { env } from '@/config/env';
import { connectMongo } from '@/db/mongo';
import { initializeSocket } from '@/features/jobs/job.socket';
import { startSubmitWorker } from '@/features/jobs/queue/submit.worker';
import { startResultWorker } from '@/features/jobs/queue/result.worker';

async function bootstrap() {
  await connectMongo();

  const server = createServer(app);
  initializeSocket(server);
  
  console.log('[Bootstrap] Starting workers...');
  const submitWorker = startSubmitWorker();
  const resultWorker = startResultWorker();
  
  // Set up event handlers before waiting
  submitWorker.on('completed', (job) => {
    console.log(`[Submit Worker] Job completed: ${job?.id}`);
  });
  
  submitWorker.on('failed', (job, err) => {
    console.error(`[Submit Worker] Job failed: ${job?.id}`, err.message);
  });
  
  submitWorker.on('active', (job) => {
    console.log(`[Submit Worker] Job active: ${job?.id}`);
  });
  
  resultWorker.on('completed', (job) => {
    console.log(`[Result Worker] Job completed: ${job?.id}`);
  });
  
  resultWorker.on('failed', (job, err) => {
    console.error(`[Result Worker] Job failed: ${job?.id}`, err.message);
  });
  
  resultWorker.on('active', (job) => {
    console.log(`[Result Worker] Job active: ${job?.id}`);
  });
  
  // Wait for workers to be ready and give them time to connect
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Submit worker timeout')), 10000);
      submitWorker.once('ready', () => { 
        clearTimeout(timeout);
        // Small delay to ensure worker is fully connected
        setTimeout(resolve, 500);
      });
      submitWorker.once('error', reject);
    }),
    new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Result worker timeout')), 10000);
      resultWorker.once('ready', () => { 
        clearTimeout(timeout);
        setTimeout(resolve, 500);
      });
      resultWorker.once('error', reject);
    })
  ]);
  
  console.log('[Bootstrap] Workers ready');
  
  const port = env.PORT;
  server.listen(port, () => {
    console.log(`Flaek server listening on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
