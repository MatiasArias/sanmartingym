import Redis from 'ioredis';
import { config } from '@/lib/config';

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function getClient(): Redis {
  const url = config.redisUrl;
  if (!url) {
    throw new Error(
      'Falta la URL de Redis. Configurá SANMARTIN_REDIS_URL o REDIS_URL en .env.local (copiá .env.example y rellená REDIS_URL).'
    );
  }
  if (globalThis.__redis) return globalThis.__redis;
  globalThis.__redis = new Redis(url);
  return globalThis.__redis;
}

/** Parsea valor de Redis: JSON o string. */
export function parse(val: string | null): unknown {
  if (val == null) return null;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

/** Cliente Redis: get/set/lpush/lrange/keys/del/zadd/zcount/zrem. Serializa objetos en JSON. Inicialización perezosa. */
export const redis = {
  async get(key: string): Promise<unknown> {
    const val = await getClient().get(key);
    return parse(val);
  },
  async set(key: string, value: unknown): Promise<void> {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    await getClient().set(key, str);
  },
  async lpush(key: string, ...values: unknown[]): Promise<number> {
    const strValues = values.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
    return getClient().lpush(key, ...strValues);
  },
  async lrange(key: string, start: number, stop: number): Promise<unknown[]> {
    const arr = await getClient().lrange(key, start, stop);
    return arr.map((s) => parse(s));
  },
  async keys(pattern: string): Promise<string[]> {
    return getClient().keys(pattern);
  },
  async del(key: string): Promise<number> {
    return getClient().del(key);
  },
  async zadd(key: string, score: number, member: string): Promise<number> {
    return getClient().zadd(key, score, member);
  },
  async zcount(key: string, min: number | string, max: number | string): Promise<number> {
    return getClient().zcount(key, min, max);
  },
  async zrem(key: string, ...members: string[]): Promise<number> {
    return getClient().zrem(key, ...members);
  },
};
