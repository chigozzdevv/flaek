import 'dotenv/config';
import { connectMongo } from '@/db/mongo';
import { runRetentionOnce } from '@/features/ingest/retention.worker';

async function main() {
  await connectMongo();
  await runRetentionOnce();
  console.log('Retention completed');
}

main().catch((e) => { console.error(e); process.exit(1); });

