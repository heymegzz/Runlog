import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import WorkspaceMember from '../models/WorkspaceMember.js';
import { getAllowedOrigins } from '../config/cors.js';

let io;

export const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} for user ${socket.userId}`);

    socket.on('join:workspace', async (workspaceId) => {
      try {
        const isMember = await WorkspaceMember.exists({ user: socket.userId, workspace: workspaceId });
        if (isMember) {
          socket.join(`workspace:${workspaceId}`);
          console.log(`📡 Socket ${socket.id} joined workspace:${workspaceId}`);
        } else {
          socket.emit('error', 'Not a member of this workspace');
        }
      } catch (err) {
        console.error('Socket join workspace error:', err);
      }
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
