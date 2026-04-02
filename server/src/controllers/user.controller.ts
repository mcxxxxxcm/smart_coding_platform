import { Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types/express';
import { AppError } from '../middleware/error.middleware';

export class UserController {
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const [rows] = await pool.execute(
        `SELECT id, username, email, avatar, role, level, experience, points, bio, created_at, updated_at
         FROM users WHERE id = ?`,
        [userId]
      );
      
      const users = rows as Record<string, unknown>[];
      
      if (users.length === 0) {
        throw new AppError('用户不存在', 404);
      }
      
      const [enrollments] = await pool.execute(
        `SELECT COUNT(*) as count FROM user_enrollments WHERE user_id = ?`,
        [userId]
      );
      
      const [submissions] = await pool.execute(
        `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
         FROM submissions WHERE user_id = ?`,
        [userId]
      );
      
      const enrollmentData = enrollments as { count: number }[];
      const submissionData = submissions as { total: number; accepted: number }[];
      
      res.json({
        success: true,
        data: {
          ...users[0],
          stats: {
            enrolledCourses: enrollmentData[0]?.count || 0,
            totalSubmissions: submissionData[0]?.total || 0,
            acceptedSubmissions: submissionData[0]?.accepted || 0
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

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { username, bio, avatar } = req.body;
      
      const updates: string[] = [];
      const values: (string | number | null)[] = [];
      
      if (username) {
        const [existingUsers] = await pool.execute(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [username, userId]
        );
        
        if ((existingUsers as unknown[]).length > 0) {
          throw new AppError('用户名已被使用', 400);
        }
        updates.push('username = ?');
        values.push(username);
      }
      
      if (bio !== undefined) {
        updates.push('bio = ?');
        values.push(bio || null);
      }
      
      if (avatar !== undefined) {
        updates.push('avatar = ?');
        values.push(avatar || null);
      }
      
      if (updates.length === 0) {
        throw new AppError('没有提供要更新的内容', 400);
      }
      
      updates.push('updated_at = NOW()');
      values.push(userId);
      
      await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      const [rows] = await pool.execute(
        `SELECT id, username, email, avatar, role, level, experience, points, bio FROM users WHERE id = ?`,
        [userId]
      );
      
      res.json({
        success: true,
        message: '个人资料更新成功',
        data: (rows as unknown[])[0]
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

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      const [rows] = await pool.execute(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );
      
      const users = rows as { password: string }[];
      
      if (users.length === 0) {
        throw new AppError('用户不存在', 404);
      }
      
      const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
      
      if (!isPasswordValid) {
        throw new AppError('当前密码错误', 400);
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await pool.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, userId]
      );
      
      res.json({
        success: true,
        message: '密码修改成功'
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

  async getProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const [courseProgress] = await pool.execute(
        `SELECT 
          ue.course_id,
          c.title as course_title,
          ue.progress,
          ue.completed,
          ue.enrolled_at
         FROM user_enrollments ue
         JOIN courses c ON ue.course_id = c.id
         WHERE ue.user_id = ?
         ORDER BY ue.enrolled_at DESC`,
        [userId]
      );
      
      const [problemStats] = await pool.execute(
        `SELECT 
          p.difficulty,
          COUNT(DISTINCT s.problem_id) as attempted,
          SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) as solved
         FROM submissions s
         JOIN problems p ON s.problem_id = p.id
         WHERE s.user_id = ?
         GROUP BY p.difficulty`,
        [userId]
      );
      
      res.json({
        success: true,
        data: {
          courses: courseProgress,
          problems: problemStats
        }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '获取学习进度失败'
      } as ApiResponse);
    }
  }

  async getSubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      const [rows] = await pool.execute(
        `SELECT 
          s.id,
          s.problem_id,
          p.title as problem_title,
          p.difficulty,
          s.language,
          s.status,
          s.runtime,
          s.memory,
          s.submitted_at
         FROM submissions s
         JOIN problems p ON s.problem_id = p.id
         WHERE s.user_id = ?
         ORDER BY s.submitted_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      
      const [countRows] = await pool.execute(
        'SELECT COUNT(*) as total FROM submissions WHERE user_id = ?',
        [userId]
      );
      
      const countData = countRows as { total: number }[];
      
      res.json({
        success: true,
        data: rows,
        pagination: {
          page,
          limit,
          total: countData[0].total,
          totalPages: Math.ceil(countData[0].total / limit)
        }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '获取提交记录失败'
      } as ApiResponse);
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      
      const [rows] = await pool.execute(
        `SELECT id, username, avatar, level, experience, points, bio, created_at
         FROM users WHERE id = ?`,
        [userId]
      );
      
      const users = rows as Record<string, unknown>[];
      
      if (users.length === 0) {
        throw new AppError('用户不存在', 404);
      }
      
      res.json({
        success: true,
        data: users[0]
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
}
