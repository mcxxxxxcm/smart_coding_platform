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
import { testConnection } from './config/database';

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log('注册路由: /api/auth');
app.use('/api/auth', authRoutes);
console.log('注册路由: /api/users');
app.use('/api/users', userRoutes);
console.log('注册路由: /api/courses');
app.use('/api/courses', courseRoutes);
console.log('注册路由: /api/problems');
app.use('/api/problems', problemRoutes);
console.log('注册路由: /api/submissions');
app.use('/api/submissions', submissionRoutes);
console.log('注册路由: /api/community');
app.use('/api/community', communityRoutes);
console.log('注册路由: /api/ai');
app.use('/api/ai', aiRoutes);
console.log('注册路由: /api/exams');
app.use('/api/exams', examRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// 全局错误处理器
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('未捕获的异常:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;

if (require.main === module) {
  const startServer = async () => {
    try {
      console.log('正在连接数据库...');
      const dbConnected = await testConnection();
      
      if (!dbConnected) {
        console.error('数据库连接失败，请检查配置');
        console.error('请确保 MySQL 服务正在运行，且数据库已创建');
        console.error('数据库配置:', {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          user: process.env.DB_USER,
          database: process.env.DB_NAME
        });
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
