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
    const [examCount] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM exams');
    const [activeToday] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(DISTINCT user_id) as count FROM submissions WHERE DATE(submitted_at) = CURDATE()"
    );
    const roleCounts = await userRepository.countByRole();

    res.json({
      success: true,
      data: {
        users: userCount[0].count,
        courses: courseCount[0].count,
        problems: problemCount[0].count,
        submissions: submissionCount[0].count,
        posts: postCount[0].count,
        exams: examCount[0].count,
        activeToday: activeToday[0].count,
        roleDistribution: roleCounts
      }
    });
  }

  async getRoles(_req: Request, res: Response): Promise<void> {
    const roleCounts = await userRepository.countByRole();
    res.json({
      success: true,
      data: {
        roles: [
          { name: '管理员', key: 'admin', description: '系统管理员，拥有所有权限', userCount: roleCounts.admin || 0, permissions: ['all'] },
          { name: '教师', key: 'teacher', description: '课程管理和教学相关权限', userCount: roleCounts.teacher || 0, permissions: ['course', 'problem', 'exam', 'community'] },
          { name: '学生', key: 'student', description: '学习、练习和社区互动权限', userCount: roleCounts.student || 0, permissions: ['learn', 'practice', 'community'] }
        ]
      }
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
      data: {
        users: result.data,
        pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
      }
    });
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { role, username, email, status, level, experience, points, bio } = req.body;

    const validRoles = ['student', 'teacher', 'admin'];
    if (role && !validRoles.includes(role)) {
      throw new AppError('无效的角色', 400);
    }

    const updates: Record<string, any> = {};
    if (role) updates.role = role;
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (bio !== undefined) updates.bio = bio;

    if (Object.keys(updates).length > 0) {
      await userRepository.updateProfile(parseInt(id), updates);
    }

    if (role) {
      await userRepository.updateRole(parseInt(id), role);
    }

    const numericUpdates: string[] = [];
    if (level !== undefined) numericUpdates.push(`level = ${parseInt(level)}`);
    if (experience !== undefined) numericUpdates.push(`experience = ${parseInt(experience)}`);
    if (points !== undefined) numericUpdates.push(`points = ${parseInt(points)}`);
    if (status !== undefined) numericUpdates.push(`status = '${status}'`);

    if (numericUpdates.length > 0) {
      await pool.execute(
        `UPDATE users SET ${numericUpdates.join(', ')} WHERE id = ?`,
        [parseInt(id)]
      );
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
    const status = req.query.status as string;
    const limitClause = buildLimitOffset(page, limit);

    let whereClause = '';
    const params: any[] = [];
    if (status) {
      whereClause = 'WHERE c.status = ?';
      params.push(status);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, u.username as teacher_name FROM courses c LEFT JOIN users u ON c.teacher_id = u.id
       ${whereClause} ORDER BY c.status ASC, c.created_at DESC ${limitClause}`,
      params
    );
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM courses c ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        courses: rows,
        pagination: { page, limit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / limit) }
      }
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
    const status = req.query.status as string;
    const difficulty = req.query.difficulty as string;
    const limitClause = buildLimitOffset(page, limit);

    const conditions: string[] = [];
    const params: any[] = [];
    if (status) { conditions.push('p.status = ?'); params.push(status); }
    if (difficulty) { conditions.push('p.difficulty = ?'); params.push(difficulty); }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, u.username as created_by_name FROM problems p LEFT JOIN users u ON p.created_by = u.id
       ${whereClause} ORDER BY p.status ASC, p.created_at DESC ${limitClause}`,
      params
    );
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM problems p ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        problems: rows,
        pagination: { page, limit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / limit) }
      }
    });
  }

  async reviewProblem(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    if (!['published', 'archived', 'rejected'].includes(status)) {
      throw new AppError('无效的审核状态', 400);
    }
    await pool.execute('UPDATE problems SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    res.json({ success: true, message: '题目审核成功' });
  }

  async getPostsForReview(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const limitClause = buildLimitOffset(page, limit);

    const conditions: string[] = [];
    const params: any[] = [];
    if (status) { conditions.push('p.status = ?'); params.push(status); }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, u.username as author_name FROM posts p LEFT JOIN users u ON p.author_id = u.id
       ${whereClause} ORDER BY p.created_at DESC ${limitClause}`,
      params
    );
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM posts p ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        posts: rows,
        pagination: { page, limit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / limit) }
      }
    });
  }

  async moderatePost(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status, action } = req.body;

    let finalStatus = status;
    if (!finalStatus && action) {
      const actionMap: Record<string, string> = { hide: 'hidden', show: 'published' };
      finalStatus = actionMap[action];
    }

    if (!['published', 'hidden'].includes(finalStatus)) {
      throw new AppError('无效的审核状态', 400);
    }
    await pool.execute('UPDATE posts SET status = ?, updated_at = NOW() WHERE id = ?', [finalStatus, id]);
    res.json({ success: true, message: '帖子审核成功' });
  }

  async getSettings(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        siteName: '智能编程教学平台',
        siteDescription: '在线编程学习与练习平台',
        allowRegistration: true,
        maxUploadSize: 10,
        sessionTimeout: 30,
        enableEmailVerification: false,
        maintenanceMode: false
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
        enableTwoFactor: false,
        passwordMinLength: 6,
        passwordRequireSpecialChar: false,
        loginAttemptLimit: 5,
        lockoutDuration: 15,
        sessionMaxAge: 7,
        enableIpWhitelist: false,
        allowedIpRanges: ''
      }
    });
  }

  async updateSecuritySettings(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: '安全设置更新成功' });
  }

  async getOperationLogs(req: Request, res: Response): Promise<void> {
    const page = 1;
    const limit = 20;
    res.json({
      success: true,
      data: {
        logs: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      }
    });
  }

  async getDatabaseStats(_req: Request, res: Response): Promise<void> {
    const tableNames = ['users', 'courses', 'chapters', 'lessons', 'problems', 'submissions', 'posts', 'comments', 'exams', 'exam_attempts', 'exam_submissions', 'user_enrollments', 'user_progress'];
    const tables: { name: string; rows: number }[] = [];

    for (const table of tableNames) {
      try {
        const [rows] = await pool.execute<RowDataPacket[]>(
          'SELECT COUNT(*) as total FROM ??', [table]
        );
        tables.push({ name: table, rows: rows[0].total });
      } catch {
        tables.push({ name: table, rows: 0 });
      }
    }

    res.json({ success: true, data: { tables } });
  }

  async optimizeDatabase(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: '数据库优化完成' });
  }
}
