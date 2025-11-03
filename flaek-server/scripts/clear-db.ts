import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to access Mongo database handle');
  }

  const collections = [
    'users',
    'tenants',
    'datasets',
    'operations',
    'jobs',
    'creditledgers',
    'webhooks',
  ];

  const existing = await db.listCollections().toArray();
  const existingNames = new Set(existing.map((c) => c.name));

  for (const name of collections) {
    if (!existingNames.has(name)) {
      console.log(`Skipping ${name} (collection not found)`);
      continue;
    }
    const result = await db.collection(name).deleteMany({});
    console.log(`Cleared ${name}: deleted ${result.deletedCount ?? 0} documents`);
  }

  await mongoose.disconnect();
  console.log('Database cleared.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
