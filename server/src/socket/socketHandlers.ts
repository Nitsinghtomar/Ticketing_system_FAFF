import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Join task room
    socket.on('join_task', (taskId: string) => {
      socket.join(`task_${taskId}`);
      socket.to(`task_${taskId}`).emit('user_joined', {
        userId: socket.id,
        timestamp: new Date()
      });
    });

    // Leave task room
    socket.on('leave_task', (taskId: string) => {
      socket.leave(`task_${taskId}`);
      socket.to(`task_${taskId}`).emit('user_left', {
        userId: socket.id,
        timestamp: new Date()
      });
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { taskId: string, userName: string }) => {
      socket.to(`task_${data.taskId}`).emit('user_typing', {
        userId: socket.id,
        userName: data.userName,
        typing: true
      });
    });

    socket.on('typing_stop', (data: { taskId: string }) => {
      socket.to(`task_${data.taskId}`).emit('user_typing', {
        userId: socket.id,
        typing: false
      });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
}