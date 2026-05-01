import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import problemRoutes from './routes/problem.routes';
import submissionRoutes from './routes/submission.routes';
import communityRoutes from './routes/community.routes';
import aiRoutes from './routes/ai.routes';
import examRoutes from './routes/exam.routes';
import executeRoutes from './routes/execute.routes';
import adminRoutes from './routes/admin.routes';
import { testConnection } from './config/database';
import { connectRedis, isRedisConnected } from './config/redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: '请求过于频繁，请稍后再试' }
});

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', limiter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: isRedisConnected() ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

if (require.main === module) {
  const startServer = async () => {
    try {
      const dbConnected = await testConnection();
      if (!dbConnected) {
        console.error('数据库连接失败，请检查配置');
      }

      try {
        await connectRedis();
        console.log('Redis 缓存已初始化');
      } catch (redisErr) {
        console.warn('Redis 连接失败，将不使用缓存:', (redisErr as Error).message);
      }

      app.listen(PORT, () => {
        console.log(`服务器运行在端口 ${PORT}`);
        console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`健康检查: http://localhost:${PORT}/health`);
      });
    } catch (error) {
      console.error('服务器启动失败:', error);
      process.exit(1);
    }
  };

  startServer();
}
