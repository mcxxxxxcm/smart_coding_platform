import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import pool from '../config/database';
import { ApiResponse } from '../types/express';
import { AppError } from '../middleware/error.middleware';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;
      
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );
      
      if ((existingUsers as unknown[]).length > 0) {
        throw new AppError('用户名或邮箱已被注册', 400);
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const [result] = await pool.execute(
        `INSERT INTO users (username, email, password, role, level, experience, points, created_at, updated_at)
         VALUES (?, ?, ?, 'student', 1, 0, 0, NOW(), NOW())`,
        [username, email, hashedPassword]
      );
      
      const insertResult = result as { insertId: number };
      const userId = insertResult.insertId;
      
      const signOptions: SignOptions = { expiresIn: '7d' };
      const token = jwt.sign({ id: userId }, config.jwt.secret, signOptions);
      
      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          token,
          user: {
            id: userId,
            username,
            email,
            role: 'student'
          }
        }
      } as ApiResponse);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        } as ApiResponse);
        return;
      }
      throw error;
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      const [rows] = await pool.execute(
        'SELECT id, username, email, password, role, avatar, level, experience, points FROM users WHERE email = ?',
        [email]
      );
      
      const users = rows as {
        id: number;
        username: string;
        email: string;
        password: string;
        role: string;
        avatar: string | null;
        level: number;
        experience: number;
        points: number;
      }[];
      
      if (users.length === 0) {
        throw new AppError('邮箱或密码错误', 401);
      }
      
      const user = users[0];
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new AppError('邮箱或密码错误', 401);
      }
      
      const signOptions: SignOptions = { expiresIn: '7d' };
      const token = jwt.sign({ id: user.id }, config.jwt.secret, signOptions);
      
      await pool.execute(
        'UPDATE users SET updated_at = NOW() WHERE id = ?',
        [user.id]
      );
      
      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            level: user.level,
            experience: user.experience,
            points: user.points
          }
        }
      } as ApiResponse);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        } as ApiResponse);
        return;
      }
      throw error;
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      } as ApiResponse);
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { id: number };
      
      const [rows] = await pool.execute(
        'SELECT id, username, email, role FROM users WHERE id = ?',
        [decoded.id]
      );
      
      const users = rows as { id: number; username: string; email: string; role: string }[];
      
      if (users.length === 0) {
        res.status(401).json({
          success: false,
          message: '用户不存在'
        } as ApiResponse);
        return;
      }
      
      const signOptions: SignOptions = { expiresIn: '7d' };
      const newToken = jwt.sign({ id: users[0].id }, config.jwt.secret, signOptions);
      
      res.json({
        success: true,
        message: '令牌刷新成功',
        data: { token: newToken }
      } as ApiResponse);
    } catch {
      res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      } as ApiResponse);
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: '登出成功'
    } as ApiResponse);
  }
}
