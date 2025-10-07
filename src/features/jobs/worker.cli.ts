import 'dotenv/config';
import { connectMongo } from '@/db/mongo';
import { startSubmitWorker } from '@/features/jobs/queue/submit.worker';

async function main() {
  await connectMongo();
  const worker = startSubmitWorker();
  // eslint-disable-next-line no-console
  console.log('Job worker started');
  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error('Job failed', job?.id, err);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });

