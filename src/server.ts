import 'dotenv/config';
import { createServer } from 'http';
import { app } from '@/app';
import { env } from '@/config/env';
import { connectMongo } from '@/db/mongo';

async function bootstrap() {
  await connectMongo();

  const server = createServer(app);
  const port = env.PORT;
  server.listen(port, () => {
    console.log(`Flaek server listening on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
