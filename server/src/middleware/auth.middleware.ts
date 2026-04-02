import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedRequest, ApiResponse } from '../types/express';
import pool from '../config/database';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      } as ApiResponse);
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
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
    
    req.user = users[0];
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    } as ApiResponse);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未认证'
      } as ApiResponse);
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: '没有权限执行此操作'
      } as ApiResponse);
      return;
    }
    
    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, config.jwt.secret) as { id: number };
    
    const [rows] = await pool.execute(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.id]
    );
    
    const users = rows as { id: number; username: string; email: string; role: string }[];
    
    if (users.length > 0) {
      req.user = users[0];
    }
    
    next();
  } catch {
    next();
  }
};
