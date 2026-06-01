import Bull from 'bull';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

if (REDIS_URL.includes('upstash.io') && !REDIS_URL.startsWith('redis')) {
  console.error(
    '[Redis] REDIS_URL looks like an Upstash REST URL. Use the Redis URL (redis:// or rediss://) from Upstash → Connect → Redis.'
  );
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
