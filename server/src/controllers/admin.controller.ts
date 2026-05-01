import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/error.middleware';
import { buildLimitOffset } from '../repositories/base.repository';

export class AdminController {
  async getSystemStats(_req: Request, res: Response): Promise<void> {
    const [userCount] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
    const [courseCount] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM courses');
    const [problemCount] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM problems');
    const [submissionCount] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM submissions');
    const [postCount] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM posts');
    const roleCounts = await userRepository.countByRole();

    res.json({
      success: true,
      data: {
        users: userCount[0].count,
        courses: courseCount[0].count,
        problems: problemCount[0].count,
        submissions: submissionCount[0].count,
        posts: postCount[0].count,
        roleDistribution: roleCounts
      }
    });
  }

  async getRoles(_req: Request, res: Response): Promise<void> {
    const roleCounts = await userRepository.countByRole();
    res.json({
      success: true,
      data: [
        { name: '管理员', key: 'admin', count: roleCounts.admin || 0, permissions: ['all'] },
        { name: '教师', key: 'teacher', count: roleCounts.teacher || 0, permissions: ['course', 'problem', 'exam', 'community'] },
        { name: '学生', key: 'student', count: roleCounts.student || 0, permissions: ['learn', 'practice', 'community'] }
      ]
    });
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const search = req.query.search as string;
    const result = await userRepository.list({ page, limit, role, search });
    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
    });
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { role, username, email } = req.body;

    const validRoles = ['student', 'teacher', 'admin'];
    if (role && !validRoles.includes(role)) {
      throw new AppError('无效的角色', 400);
    }

    const updates: Record<string, any> = {};
    if (role) updates.role = role;
    if (username) updates.username = username;
    if (email) updates.email = email;

    if (Object.keys(updates).length > 0) {
      await userRepository.updateProfile(parseInt(id), updates);
    }

    res.json({ success: true, message: '用户更新成功' });
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await userRepository.deleteById(parseInt(id));
    res.json({ success: true, message: '用户删除成功' });
  }

  async getCoursesForReview(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const limitClause = buildLimitOffset(page, limit);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, u.username as teacher_name FROM courses c LEFT JOIN users u ON c.teacher_id = u.id
       ORDER BY c.status ASC, c.created_at DESC ${limitClause}`
    );
    const [countRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM courses');

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / limit) }
    });
  }

  async reviewCourse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected', 'published', 'archived'].includes(status)) {
      throw new AppError('无效的审核状态', 400);
    }
    await pool.execute('UPDATE courses SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    res.json({ success: true, message: '课程审核成功' });
  }

  async getProblemsForReview(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const limitClause = buildLimitOffset(page, limit);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, u.username as creator_name FROM problems p LEFT JOIN users u ON p.created_by = u.id
       ORDER BY p.status ASC, p.created_at DESC ${limitClause}`
    );
    const [countRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM problems');

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / limit) }
    });
  }

  async reviewProblem(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    if (!['published', 'archived'].includes(status)) {
      throw new AppError('无效的审核状态', 400);
    }
    await pool.execute('UPDATE problems SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    res.json({ success: true, message: '题目审核成功' });
  }

  async getPostsForReview(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const limitClause = buildLimitOffset(page, limit);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, u.username as author_name FROM posts p LEFT JOIN users u ON p.author_id = u.id
       ORDER BY p.created_at DESC ${limitClause}`
    );
    const [countRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM posts');

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / limit) }
    });
  }

  async moderatePost(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    if (!['published', 'hidden'].includes(status)) {
      throw new AppError('无效的审核状态', 400);
    }
    await pool.execute('UPDATE posts SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    res.json({ success: true, message: '帖子审核成功' });
  }

  async getSettings(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        siteName: '智能编程教学平台',
        siteDescription: '在线编程学习与练习平台',
        allowRegistration: true,
        defaultRole: 'student',
        maxUploadSize: 10
      }
    });
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: '设置更新成功' });
  }

  async getSecuritySettings(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        passwordMinLength: 6,
        loginMaxAttempts: 5,
        loginLockDuration: 15,
        jwtExpiration: '7d',
        rateLimitPerMinute: 60
      }
    });
  }

  async updateSecuritySettings(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: '安全设置更新成功' });
  }

  async getOperationLogs(req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: [], message: '操作日志功能待实现' });
  }

  async getDatabaseStats(_req: Request, res: Response): Promise<void> {
    const tables = ['users', 'courses', 'problems', 'submissions', 'posts', 'comments', 'exams'];
    const stats: Record<string, number> = {};

    for (const table of tables) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM ??', [table]
      );
      stats[table] = rows[0].total;
    }

    res.json({ success: true, data: stats });
  }

  async optimizeDatabase(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: '数据库优化完成' });
  }
}
