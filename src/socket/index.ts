// src/socket/index.ts
// Socket.io initialization and event handling for real-time applications and notifications.

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { JwtPayload } from '../types';

interface AuthedSocket extends Socket {
  userId?: string;
}

let io: SocketIOServer;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  // Authenticate every connection with the same JWT used for REST
  io.use(async (socket: AuthedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      socket.userId = payload.userId;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    // Personal room for direct notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('team:subscribe', async (teamId: string) => {
      // Only the team's captain should join its room
      if (!socket.userId) return;
      try {
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: { captainId: true },
        });
        if (team && team.captainId === socket.userId) {
          socket.join(`team:${teamId}`);
        }
      } catch (err) {
        console.error('Error subscribing to team room:', err);
      }
    });

    socket.on('team:unsubscribe', (teamId: string) => {
      socket.leave(`team:${teamId}`);
    });

    socket.on('disconnect', () => {
      // Rooms are cleaned up automatically by Socket.io
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    if (process.env.NODE_ENV === 'test') {
      const noop = () => ({ emit: () => true });
      return { to: noop, emit: () => true } as unknown as SocketIOServer;
    }
    throw new Error('Socket.io not initialized');
  }
  return io;
}
