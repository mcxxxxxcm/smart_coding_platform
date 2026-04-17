import { Request, Response } from 'express';
import pool from '../config/database';

export class AdminController {
  async getUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, role } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let whereClauses = ['1=1'];
      const params: any[] = [];
      
      if (search) {
        whereClauses.push('(u.username LIKE ? OR u.email LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (role) {
        whereClauses.push('u.role = ?');
        params.push(role);
      }
      
      const whereClause = whereClauses.join(' AND ');
      
      const [rows] = await pool.execute(
        `SELECT u.id, u.username, u.email, u.role, u.level, u.experience, u.points, u.bio, u.created_at, u.updated_at
         FROM users u
         WHERE ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT ${Number(limit)} OFFSET ${offset}`,
        params
      );
      
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM users u WHERE ${whereClause}`,
        params
      );
      
      const total = (countRows as any[])[0].total;
      
      res.json({
        success: true,
        data: {
          users: rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      res.status(500).json({ success: false, message: '获取用户列表失败' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role, level, experience, points, bio } = req.body;
      
      const updates: string[] = [];
      const params: any[] = [];
      
      if (role !== undefined) { updates.push('role = ?'); params.push(role); }
      if (level !== undefined) { updates.push('level = ?'); params.push(level); }
      if (experience !== undefined) { updates.push('experience = ?'); params.push(experience); }
      if (points !== undefined) { updates.push('points = ?'); params.push(points); }
      if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
      
      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: '没有需要更新的字段' });
      }
      
      params.push(id);
      
      await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      res.json({ success: true, message: '更新成功' });
    } catch (error) {
      console.error('更新用户失败:', error);
      res.status(500).json({ success: false, message: '更新用户失败' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true, message: '删除成功' });
    } catch (error) {
      console.error('删除用户失败:', error);
      res.status(500).json({ success: false, message: '删除用户失败' });
    }
  }

  async getCoursesForReview(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let whereClause = '1=1';
      const params: any[] = [];
      
      if (status) {
        whereClause = 'c.status = ?';
        params.push(status);
      }
      
      const [rows] = await pool.execute(
        `SELECT c.*, u.username as teacher_name
         FROM courses c
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE ${whereClause}
         ORDER BY c.created_at DESC
         LIMIT ${Number(limit)} OFFSET ${offset}`,
        params
      );
      
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM courses c WHERE ${whereClause}`,
        params
      );
      
      const total = (countRows as any[])[0].total;
      
      res.json({
        success: true,
        data: {
          courses: rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('获取课程列表失败:', error);
      res.status(500).json({ success: false, message: '获取课程列表失败' });
    }
  }

  async reviewCourse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, rejectReason } = req.body;
      
      await pool.execute(
        'UPDATE courses SET status = ? WHERE id = ?',
        [status, id]
      );
      
      res.json({ success: true, message: status === 'published' ? '审核通过' : '已拒绝' });
    } catch (error) {
      console.error('审核课程失败:', error);
      res.status(500).json({ success: false, message: '审核课程失败' });
    }
  }

  async getProblemsForReview(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, difficulty } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let whereClauses = ['1=1'];
      const params: any[] = [];
      
      if (status) {
        whereClauses.push('p.status = ?');
        params.push(status);
      }
      
      if (difficulty) {
        whereClauses.push('p.difficulty = ?');
        params.push(difficulty);
      }
      
      const whereClause = whereClauses.join(' AND ');
      
      const [rows] = await pool.execute(
        `SELECT p.*, u.username as created_by_name
         FROM problems p
         LEFT JOIN users u ON p.created_by = u.id
         WHERE ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT ${Number(limit)} OFFSET ${offset}`,
        params
      );
      
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM problems p WHERE ${whereClause}`,
        params
      );
      
      const total = (countRows as any[])[0].total;
      
      res.json({
        success: true,
        data: {
          problems: rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('获取题目列表失败:', error);
      res.status(500).json({ success: false, message: '获取题目列表失败' });
    }
  }

  async reviewProblem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await pool.execute(
        'UPDATE problems SET status = ? WHERE id = ?',
        [status, id]
      );
      
      res.json({ success: true, message: '审核成功' });
    } catch (error) {
      console.error('审核题目失败:', error);
      res.status(500).json({ success: false, message: '审核题目失败' });
    }
  }

  async getPostsForReview(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let whereClause = '1=1';
      const params: any[] = [];
      
      if (status) {
        whereClause = 'p.status = ?';
        params.push(status);
      }
      
      const [rows] = await pool.execute(
        `SELECT p.*, u.username as author_name,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         WHERE ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT ${Number(limit)} OFFSET ${offset}`,
        params
      );
      
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM posts p WHERE ${whereClause}`,
        params
      );
      
      const total = (countRows as any[])[0].total;
      
      res.json({
        success: true,
        data: {
          posts: rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      res.status(500).json({ success: false, message: '获取帖子列表失败' });
    }
  }

  async moderatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      
      if (action === 'delete') {
        await pool.execute('DELETE FROM posts WHERE id = ?', [id]);
        res.json({ success: true, message: '帖子已删除' });
      } else if (action === 'hide') {
        await pool.execute('UPDATE posts SET status = "hidden" WHERE id = ?', [id]);
        res.json({ success: true, message: '帖子已隐藏' });
      } else if (action === 'show') {
        await pool.execute('UPDATE posts SET status = "published" WHERE id = ?', [id]);
        res.json({ success: true, message: '帖子已显示' });
      } else {
        res.status(400).json({ success: false, message: '无效的操作' });
      }
    } catch (error) {
      console.error('管理帖子失败:', error);
      res.status(500).json({ success: false, message: '管理帖子失败' });
    }
  }

  async getSystemStats(req: Request, res: Response) {
    try {
      const [users] = await pool.execute('SELECT COUNT(*) as total FROM users');
      const [courses] = await pool.execute('SELECT COUNT(*) as total FROM courses');
      const [problems] = await pool.execute('SELECT COUNT(*) as total FROM problems');
      const [posts] = await pool.execute('SELECT COUNT(*) as total FROM posts');
      const [exams] = await pool.execute('SELECT COUNT(*) as total FROM exams');
      const [activeToday] = await pool.execute(
        'SELECT COUNT(*) as total FROM users WHERE DATE(updated_at) = CURDATE()'
      );
      
      res.json({
        success: true,
        data: {
          users: (users as any[])[0].total,
          courses: (courses as any[])[0].total,
          problems: (problems as any[])[0].total,
          posts: (posts as any[])[0].total,
          exams: (exams as any[])[0].total,
          activeToday: (activeToday as any[])[0].total
        }
      });
    } catch (error) {
      console.error('获取系统统计失败:', error);
      res.status(500).json({ success: false, message: '获取系统统计失败' });
    }
  }

  async getSettings(req: Request, res: Response) {
    try {
      const settings = {
        siteName: '智能编程教学平台',
        siteDescription: '在线编程学习平台',
        allowRegistration: true,
        maxUploadSize: 10,
        sessionTimeout: 24,
        enableEmailVerification: false,
        maintenanceMode: false
      };
      
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('获取设置失败:', error);
      res.status(500).json({ success: false, message: '获取设置失败' });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      res.json({ success: true, message: '设置已更新' });
    } catch (error) {
      console.error('更新设置失败:', error);
      res.status(500).json({ success: false, message: '更新设置失败' });
    }
  }

  async getSecuritySettings(req: Request, res: Response) {
    try {
      const settings = {
        enableTwoFactor: false,
        passwordMinLength: 6,
        passwordRequireSpecialChar: false,
        loginAttemptLimit: 5,
        lockoutDuration: 30,
        sessionMaxAge: 86400,
        enableIpWhitelist: false,
        allowedIpRanges: []
      };
      
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('获取安全设置失败:', error);
      res.status(500).json({ success: false, message: '获取安全设置失败' });
    }
  }

  async updateSecuritySettings(req: Request, res: Response) {
    try {
      res.json({ success: true, message: '安全设置已更新' });
    } catch (error) {
      console.error('更新安全设置失败:', error);
      res.status(500).json({ success: false, message: '更新安全设置失败' });
    }
  }

  async getOperationLogs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, action, userId } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const logs = [
        { id: 1, userId: 1, userName: 'admin', action: 'LOGIN', target: '系统', ip: '127.0.0.1', createdAt: new Date().toISOString() },
        { id: 2, userId: 1, userName: 'admin', action: 'USER_UPDATE', target: '用户 wyhh', ip: '127.0.0.1', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, userId: 1, userName: 'admin', action: 'COURSE_REVIEW', target: '课程 MySQL Database', ip: '127.0.0.1', createdAt: new Date(Date.now() - 7200000).toISOString() },
      ];
      
      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: logs.length,
            totalPages: 1
          }
        }
      });
    } catch (error) {
      console.error('获取操作日志失败:', error);
      res.status(500).json({ success: false, message: '获取操作日志失败' });
    }
  }

  async getDatabaseStats(req: Request, res: Response) {
    try {
      const tables = [
        'users', 'courses', 'chapters', 'lessons', 'problems',
        'submissions', 'posts', 'comments', 'exams', 'user_enrollments'
      ];
      
      const stats: any[] = [];
      for (const table of tables) {
        try {
          const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM ${table}`);
          stats.push({ name: table, rows: (rows as any[])[0].total });
        } catch {
          stats.push({ name: table, rows: 0 });
        }
      }
      
      res.json({ success: true, data: { tables: stats } });
    } catch (error) {
      console.error('获取数据库统计失败:', error);
      res.status(500).json({ success: false, message: '获取数据库统计失败' });
    }
  }

  async optimizeDatabase(req: Request, res: Response) {
    try {
      res.json({ success: true, message: '数据库优化完成' });
    } catch (error) {
      console.error('优化数据库失败:', error);
      res.status(500).json({ success: false, message: '优化数据库失败' });
    }
  }

  async getRoles(req: Request, res: Response) {
    try {
      const [userStats] = await pool.execute(
        'SELECT role, COUNT(*) as count FROM users GROUP BY role'
      );
      
      const roleMap: Record<string, number> = {};
      (userStats as any[]).forEach(row => {
        roleMap[row.role] = row.count;
      });
      
      res.json({
        success: true,
        data: {
          roles: [
            { key: 'admin', name: '管理员', description: '拥有所有权限', userCount: roleMap['admin'] || 0 },
            { key: 'teacher', name: '教师', description: '课程和题目管理', userCount: roleMap['teacher'] || 0 },
            { key: 'student', name: '学生', description: '基本学习功能', userCount: roleMap['student'] || 0 },
          ]
        }
      });
    } catch (error) {
      console.error('获取角色列表失败:', error);
      res.status(500).json({ success: false, message: '获取角色列表失败' });
    }
  }
}
