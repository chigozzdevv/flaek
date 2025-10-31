import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyJwt } from '@/utils/jwt';
import { env } from '@/config/env';

let io: Server | null = null;

export function initializeSocket(httpServer: HTTPServer) {
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
  const allowedOriginPatterns = [/^https:\/\/.*\.vercel\.app$/];

  function isAllowedOrigin(origin?: string | null) {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    return allowedOriginPatterns.some((re) => re.test(origin));
  }

  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const payload = verifyJwt(token);
      (socket as any).tenantId = payload.sub;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const tenantId = (socket as any).tenantId;
    console.log(`Client connected: ${socket.id} (tenant: ${tenantId})`);
    
    socket.join(`tenant:${tenantId}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function broadcastJobUpdate(tenantId: string, jobUpdate: any) {
  if (!io) return;
  
  io.to(`tenant:${tenantId}`).emit('job:update', jobUpdate);
}

export function getSocketIO() {
  return io;
}
