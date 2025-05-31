// server/src/server.ts - Updated with database initialization
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { TaskController } from './controllers/taskController';
import { chatController } from './controllers/chatController';
import { SummaryController } from './controllers/summaryController';
import uploadRoutes from './routes/upload';
import qaRoutes from './routes/qa';
import summaryRoutes from './routes/summary';
import { initializeDatabase } from './database/connection';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Controllers
const taskController = new TaskController();
const summaryController = new SummaryController();

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    features: {
      realtime: 'enabled',
      uploads: 'enabled',
      qa: 'enabled',
      aiSummary: 'enabled'
    }
  });
});

// Task routes
app.get('/api/tasks', taskController.getTasks.bind(taskController));
app.post('/api/tasks', taskController.createTask.bind(taskController));
app.put('/api/tasks/:id', taskController.updateTask.bind(taskController));
app.delete('/api/tasks/:id', taskController.deleteTask.bind(taskController));

// Chat routes
app.get('/api/chat/:taskId/messages', chatController.getMessages.bind(chatController));
app.post('/api/chat/:taskId/messages', chatController.sendMessage.bind(chatController));
app.delete('/api/chat/:taskId/messages/:messageId', chatController.deleteMessage.bind(chatController));
app.get('/api/chat/:taskId/attachments', chatController.getMessageAttachments.bind(chatController));

// Summary routes
app.use('/api/summary', summaryRoutes);

// QA routes
app.use('/api/qa', qaRoutes);

// File upload routes
app.use('/api/upload', uploadRoutes);

// Initialize controllers with socket.io instance
const initializeControllers = () => {
  chatController.setSocketIO(io);

  // Import and initialize qaController with socket.io
  import('./controllers/qaController').then(({ qaController }) => {
    qaController.setSocketIO(io);
  }).catch(err => {
    console.warn('⚠️ Failed to initialize QA controller:', err.message);
  });
};

initializeControllers();

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.broadcast.emit('user_joined', {
    userId: socket.id,
    timestamp: new Date()
  });

  socket.on('join_task', (taskId: string) => {
    socket.join(`task_${taskId}`);
    console.log(`User ${socket.id} joined task ${taskId}`);
    socket.to(`task_${taskId}`).emit('user_joined_task', {
      userId: socket.id,
      taskId,
      timestamp: new Date()
    });
  });

  socket.on('leave_task', (taskId: string) => {
    socket.leave(`task_${taskId}`);
    console.log(`User ${socket.id} left task ${taskId}`);
    socket.to(`task_${taskId}`).emit('user_left_task', {
      userId: socket.id,
      taskId,
      timestamp: new Date()
    });
  });

  socket.on('task_created', (task) => {
    console.log(`📝 Broadcasting new task: ${task.title}`);
    socket.broadcast.emit('task_created', task);
  });

  socket.on('task_updated', (task) => {
    console.log(`🔄 Broadcasting task update: ${task.title}`);
    socket.broadcast.emit('task_updated', task);
  });

  socket.on('new_message', (message) => {
    console.log(`💬 Broadcasting new message in task ${message.task_id}`);
    socket.to(`task_${message.task_id}`).emit('new_message', message);

    if (message.qaTriggered && message.qaReview) {
      socket.to(`task_${message.task_id}`).emit('qa_review_completed', {
        messageId: message.id,
        taskId: message.task_id,
        qaResult: message.qaReview,
        timestamp: new Date()
      });
      console.log(`🔍 Broadcasting QA review result for message ${message.id}`);
    }
  });

  socket.on('qa_review_triggered', (data) => {
    console.log(`🔍 QA review triggered for message ${data.messageId} in task ${data.taskId}`);
    socket.to(`task_${data.taskId}`).emit('qa_review_started', {
      messageId: data.messageId,
      taskId: data.taskId,
      triggeredBy: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('qa_rules_updated', (data) => {
    console.log(`⚙️ QA rules updated by user ${socket.id}`);
    socket.broadcast.emit('qa_rules_updated', {
      updatedBy: socket.id,
      timestamp: new Date(),
      ...data
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    socket.broadcast.emit('user_left', {
      userId: socket.id,
      timestamp: new Date()
    });
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🗄️ Initializing database...');
    await initializeDatabase();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
      console.log(`🔗 API: http://localhost:${PORT}/api/tasks`);
      console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
      console.log(`🔍 QA: http://localhost:${PORT}/api/qa`);
      console.log(`⚡ Real-time: Socket.io enabled`);
      console.log(`🤖 AI Features: Summary & QA enabled`);
      console.log(`👥 Ready for multiple users!`);

      const features = [
        '✅ Task Management',
        '✅ Real-time Chat',
        '✅ File Uploads',
        '✅ AI Summarization',
        '✅ Quality Assurance',
        '✅ Link Validation',
        '✅ Socket.io Broadcasting',
        '✅ SQLite Database'
      ];

      console.log('\n🎯 Enabled Features:');
      features.forEach(feature => console.log(`   ${feature}`));
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, server, io };