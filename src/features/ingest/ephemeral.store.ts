import { getRedis } from '@/db/redis';
import { newId } from '@/utils/id';

const prefix = 'ingest:ephem:';

export async function putEphemeral(buffer: Buffer, ttlSec: number): Promise<{ ref: string }>{
  const ref = newId('ephem');
  const key = prefix + ref;
  const redis = getRedis();
  await redis.set(key, buffer, 'EX', ttlSec);
  return { ref };
}

export async function getEphemeral(ref: string): Promise<Buffer | null> {
  const key = prefix + ref;
  const redis = getRedis();
  const buf = await (redis as any).getBuffer(key);
  return buf as Buffer | null;
}

export async function delEphemeral(ref: string): Promise<void> {
  const key = prefix + ref;
  const redis = getRedis();
  await redis.del(key);
}

