import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';

import connectDB from './src/config/db.js';
import { initSocketIO } from './src/sockets/socketHandler.js';

const app = express();
const httpServer = createServer(app);

// --------------- Global Middleware ---------------
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
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

const start = async () => {
  await connectDB();

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
