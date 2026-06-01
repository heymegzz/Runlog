import { Server } from 'socket.io';

let io;

export const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('join:workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`📡 Socket ${socket.id} joined workspace:${workspaceId}`);
    });

    socket.on('leave:workspace', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

/**
 * Emit an execution result to all clients in a workspace room.
 * @param {string} workspaceId
 * @param {object} payload - { jobId, jobName, status, statusCode, durationMs, executedAt, executionId }
 */
export const emitExecutionUpdate = (workspaceId, payload) => {
  try {
    const ioInstance = getIO();
    ioInstance.to(`workspace:${workspaceId}`).emit('execution:done', payload);
  } catch (err) {
    // Socket not initialized (tests, CLI) — silently ignore
    console.warn('[Socket] Could not emit execution update:', err.message);
  }
};

/**
 * Emit a job status change to workspace room.
 * @param {string} workspaceId
 * @param {object} payload - { jobId, status }
 */
export const emitJobUpdated = (workspaceId, payload) => {
  try {
    const ioInstance = getIO();
    ioInstance.to(`workspace:${workspaceId}`).emit('job:updated', payload);
  } catch (err) {
    console.warn('[Socket] Could not emit job update:', err.message);
  }
};
