import dotenv from 'dotenv';
dotenv.config();

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'REDIS_URL'];
const missingEnv = requiredEnv.filter((env) => !process.env[env]);
if (missingEnv.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

import connectDB from './src/config/db.js';
import { corsOrigin } from './src/config/cors.js';
import { initSocketIO } from './src/sockets/socketHandler.js';

const app = express();
const httpServer = createServer(app);

// --------------- Global Middleware ---------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);
app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------- Health Check ---------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'runlog-api', timestamp: new Date() });
});

// --------------- Routes ---------------
import authRoutes      from './src/routes/auth.routes.js';
import workspaceRoutes from './src/routes/workspace.routes.js';
import jobRoutes       from './src/routes/job.routes.js';
import executionRoutes from './src/routes/execution.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import apikeyRoutes    from './src/routes/apikey.routes.js';

app.use('/api/auth',       authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/jobs',       jobRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/analytics',  analyticsRoutes);
app.use('/api/api-keys',   apikeyRoutes);

// --------------- Error Handler ---------------
import errorHandler from './src/middleware/errorHandler.js';
app.use(errorHandler);

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5005;

import startCronScanner from './src/scheduler/cronScanner.js';
import startWorker      from './src/scheduler/worker.js';
import { waitForJobQueue } from './src/config/redis.js';

const start = async () => {
  await connectDB();

  try {
    await waitForJobQueue();
  } catch (err) {
    console.error('FATAL: Could not connect to Redis/Bull queue:', err.message);
    process.exit(1);
  }

  // Initialize Socket.IO (must come before worker so socket is ready)
  initSocketIO(httpServer);

  // Initialize execution engine
  startCronScanner();
  startWorker();

  httpServer.listen(PORT, () => {
    console.log(`🚀 RunLog API running on port ${PORT}`);
  });
};

start();
