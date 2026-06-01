import Bull from 'bull';
import IORedis from 'ioredis';

/**
 * Normalize REDIS_URL — fixes common copy-paste mistakes from Upstash / redis-cli.
 */
export const normalizeRedisUrl = (raw) => {
  if (!raw || typeof raw !== 'string') {
    return 'redis://localhost:6379';
  }

  let url = raw.trim();

  // Pasted full command: redis-cli --tls -u redis://default:pass@host:6379
  if (url.includes('redis-cli')) {
    const matches = url.match(/rediss?:\/\/[^\s'"]+/gi);
    if (matches?.length) {
      url = matches[matches.length - 1];
      console.warn('[Redis] REDIS_URL contained redis-cli text; using extracted URL.');
    }
  }

  // Stray quotes or whitespace
  url = url.replace(/^['"]|['"]$/g, '').trim();

  if (!/^rediss?:\/\//i.test(url)) {
    throw new Error(
      'REDIS_URL must start with redis:// or rediss://. ' +
        'On Render, set only the URL from Upstash (Connect → Redis), not the redis-cli command.'
    );
  }

  // Upstash requires TLS
  if (url.includes('upstash.io') && url.startsWith('redis://')) {
    url = url.replace(/^redis:\/\//i, 'rediss://');
  }

  try {
    new URL(url);
  } catch {
    throw new Error(
      `REDIS_URL is not a valid URL. Example: rediss://default:PASSWORD@host.upstash.io:6379`
    );
  }

  return url;
};

const REDIS_URL = normalizeRedisUrl(process.env.REDIS_URL);

if (process.env.REDIS_URL && process.env.REDIS_URL !== REDIS_URL) {
  console.log('[Redis] Using normalized REDIS_URL for connection');
}

const usesTls = REDIS_URL.startsWith('rediss://');

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(usesTls ? { tls: {} } : {}),
};

/** Bull needs a separate ioredis client per connection type (Upstash / TLS safe). */
const createClient = () => new IORedis(REDIS_URL, redisOptions);

const jobQueue = new Bull('runlog-jobs', {
  createClient(type) {
    switch (type) {
      case 'client':
      case 'subscriber':
      case 'bclient':
        return createClient();
      default:
        return createClient();
    }
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

jobQueue.on('error', (err) => {
  console.error('🔴 Bull queue error:', err.message);
});

jobQueue.on('ready', () => {
  console.log('✅ Bull queue connected to Redis');
});

/** Wait for Redis before starting worker/cron (avoids Render startup race). */
export const waitForJobQueue = () =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Redis connection timed out after 20s. Check REDIS_URL on Render.'));
    }, 20000);

    const done = (err) => {
      clearTimeout(timeout);
      if (err) reject(err);
      else resolve();
    };

    jobQueue
      .isReady()
      .then(() => done())
      .catch(done);
  });

export default jobQueue;
