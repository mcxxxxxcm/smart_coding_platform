import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedQuery } from '../types/express';
import { AppError } from '../middleware/error.middleware';

export class CourseController {
  async getCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('获取课程列表...');
      const { page = '1', limit = '10', category, difficulty, search, status, teacher_only } = req.query as PaginatedQuery & {
        category?: string;
        difficulty?: string;
        search?: string;
        status?: string;
        teacher_only?: string;
      };
      
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      let whereClause = 'WHERE 1=1';
      const params: (string | number)[] = [];
      
      // 如果是教师且请求自己的课程，显示所有状态
      if (teacher_only === 'true' && req.user?.role === 'teacher') {
        whereClause += ' AND c.teacher_id = ?';
        params.push(req.user.id);
      } else if (req.user?.role === 'admin') {
        // 管理员可以看到所有课程
      } else {
        // 其他用户只能看到已发布的课程
        whereClause += " AND c.status = 'published'";
      }
      
      if (status && (req.user?.role === 'admin' || req.user?.role === 'teacher')) {
        whereClause += ' AND c.status = ?';
        params.push(status);
      }
      
      if (category) {
        whereClause += ' AND c.category = ?';
        params.push(category);
      }
      
      if (difficulty) {
        whereClause += ' AND c.difficulty = ?';
        params.push(difficulty);
      }
      
      if (search) {
        whereClause += ' AND (c.title LIKE ? OR c.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      const sql = `SELECT 
        c.id, c.title, c.description, c.cover_image, c.category, c.difficulty,
        c.duration, c.price, c.enrollment_count, c.rating, c.status, c.created_at,
        u.username as teacher_name, u.avatar as teacher_avatar
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`;
      
      console.log('SQL:', sql);
      console.log('Params:', params);
      
      const [rows] = await pool.execute(sql, params);
      
      const countSql = `SELECT COUNT(*) as total FROM courses c ${whereClause}`;
      const [countRows] = await pool.execute(countSql, params);
      
      const countData = countRows as { total: number }[];
      console.log('课程数量:', countData[0].total);
      
      res.json({
        success: true,
        message: '获取成功',
        data: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countData[0].total,
          totalPages: Math.ceil(countData[0].total / limitNum)
        }
      } as ApiResponse);
    } catch (error) {
      console.error('获取课程列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取课程列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      } as ApiResponse);
    }
  }

  async getCourseById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      
      const [rows] = await pool.execute(
        `SELECT 
          c.*,
          u.username as teacher_name, u.avatar as teacher_avatar, u.bio as teacher_bio
         FROM courses c
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE c.id = ?`,
        [courseId]
      );
      
      const courses = rows as Record<string, unknown>[];
      
      if (courses.length === 0) {
        throw new AppError('课程不存在', 404);
      }
      
      const course = courses[0];
      
      const [chapters] = await pool.execute(
        `SELECT id, title, description, \`order\`
         FROM chapters
         WHERE course_id = ?
         ORDER BY \`order\` ASC`,
        [courseId]
      );
      
      const chapterList = chapters as { id: number }[];
      
      for (const chapter of chapterList) {
        const [lessons] = await pool.execute(
          `SELECT id, title, duration, \`order\`, is_free
           FROM lessons
           WHERE chapter_id = ?
           ORDER BY \`order\` ASC`,
          [chapter.id]
        );
        (chapter as Record<string, unknown>).lessons = lessons;
      }
      
      (course as Record<string, unknown>).chapters = chapters;
      
      if (req.user) {
        const [enrollment] = await pool.execute(
          'SELECT * FROM user_enrollments WHERE user_id = ? AND course_id = ?',
          [req.user.id, courseId]
        );
        
        (course as Record<string, unknown>).isEnrolled = (enrollment as unknown[]).length > 0;
        
        if ((enrollment as unknown[]).length > 0) {
          const enrollmentData = enrollment as { progress: number; completed: boolean }[];
          (course as Record<string, unknown>).userProgress = enrollmentData[0].progress;
          (course as Record<string, unknown>).isCompleted = enrollmentData[0].completed;
        }
      }
      
      res.json({
        success: true,
        data: course
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

  async getCourseChapters(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      
      const [chapters] = await pool.execute(
        `SELECT id, title, description, \`order\`
         FROM chapters
         WHERE course_id = ?
         ORDER BY \`order\` ASC`,
        [courseId]
      );
      
      res.json({
        success: true,
        data: chapters
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '获取章节列表失败'
      } as ApiResponse);
    }
  }

  async getLesson(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: courseId, lessonId } = req.params;
      const userId = req.user!.id;
      
      const [enrollment] = await pool.execute(
        'SELECT * FROM user_enrollments WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
      );
      
      const [rows] = await pool.execute(
        'SELECT * FROM lessons WHERE id = ?',
        [lessonId]
      );
      
      const lessons = rows as { is_free: boolean }[];
      
      if (lessons.length === 0) {
        throw new AppError('课时不存在', 404);
      }
      
      const lesson = lessons[0];
      
      if (!lesson.is_free && (enrollment as unknown[]).length === 0) {
        throw new AppError('请先报名课程', 403);
      }
      
      res.json({
        success: true,
        data: lessons[0]
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

  async enrollCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      const userId = req.user!.id;
      
      const [existing] = await pool.execute(
        'SELECT * FROM user_enrollments WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
      );
      
      if ((existing as unknown[]).length > 0) {
        throw new AppError('已经报名过该课程', 400);
      }
      
      await pool.execute(
        `INSERT INTO user_enrollments (user_id, course_id, progress, completed, enrolled_at)
         VALUES (?, ?, 0, false, NOW())`,
        [userId, courseId]
      );
      
      await pool.execute(
        'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
        [courseId]
      );
      
      res.json({
        success: true,
        message: '课程报名成功'
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

  async updateProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      const userId = req.user!.id;
      const { lessonId, progress } = req.body;
      
      await pool.execute(
        `INSERT INTO user_progress (user_id, course_id, lesson_id, progress, completed, last_accessed)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE progress = ?, completed = ?, last_accessed = NOW()`,
        [userId, courseId, lessonId, progress, progress >= 100, progress, progress >= 100]
      );
      
      const [progressRows] = await pool.execute(
        `SELECT AVG(progress) as avg_progress FROM user_progress WHERE user_id = ? AND course_id = ?`,
        [userId, courseId]
      );
      
      const progressData = progressRows as { avg_progress: number }[];
      const avgProgress = Math.round(progressData[0].avg_progress || 0);
      
      await pool.execute(
        `UPDATE user_enrollments 
         SET progress = ?, completed = ? 
         WHERE user_id = ? AND course_id = ?`,
        [avgProgress, avgProgress >= 100, userId, courseId]
      );
      
      if (avgProgress >= 100) {
        await pool.execute(
          `UPDATE users SET experience = experience + 100, points = points + 50 WHERE id = ?`,
          [userId]
        );
      }
      
      res.json({
        success: true,
        message: '进度更新成功',
        data: { progress: avgProgress, completed: avgProgress >= 100 }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '更新进度失败'
      } as ApiResponse);
    }
  }

  async createCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, category, difficulty, duration, price, cover_image } = req.body;
      const teacherId = req.user!.id;
      
      console.log('创建课程参数:', { title, description, category, difficulty, duration, price, cover_image, teacherId });
      
      const [result] = await pool.execute(
        `INSERT INTO courses 
         (title, description, category, difficulty, teacher_id, duration, price, cover_image, status, enrollment_count, rating, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0, 0.00, NOW(), NOW())`,
        [
          title || '',
          description || '',
          category || 'frontend',
          difficulty || 'beginner',
          teacherId,
          duration || 0,
          price || 0,
          cover_image || null
        ]
      );
      
      const insertResult = result as { insertId: number };
      
      res.status(201).json({
        success: true,
        message: '课程创建成功',
        data: { id: insertResult.insertId }
      } as ApiResponse);
    } catch (error) {
      console.error('创建课程错误:', error);
      res.status(500).json({
        success: false,
        message: '创建课程失败',
        error: error instanceof Error ? error.message : '未知错误'
      } as ApiResponse);
    }
  }

  async updateCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      console.log('更新课程 - courseId:', courseId, 'userId:', userId, 'userRole:', userRole);
      
      const [courses] = await pool.execute(
        'SELECT teacher_id FROM courses WHERE id = ?',
        [courseId]
      );
      
      const courseList = courses as { teacher_id: number }[];
      
      console.log('查询到的课程:', courseList);
      
      if (courseList.length === 0) {
        throw new AppError('课程不存在', 404);
      }
      
      const teacherId = Number(courseList[0].teacher_id);
      const currentUserId = Number(userId);
      
      console.log('teacherId:', teacherId, 'currentUserId:', currentUserId, '比较结果:', teacherId !== currentUserId);
      
      if (userRole !== 'admin' && teacherId !== currentUserId) {
        throw new AppError('没有权限修改此课程', 403);
      }
      
      const { title, description, category, difficulty, duration, price, cover_image, status } = req.body;
      
      const updates: string[] = [];
      const values: (string | number)[] = [];
      
      if (title) { updates.push('title = ?'); values.push(title); }
      if (description) { updates.push('description = ?'); values.push(description); }
      if (category) { updates.push('category = ?'); values.push(category); }
      if (difficulty) { updates.push('difficulty = ?'); values.push(difficulty); }
      if (duration !== undefined) { updates.push('duration = ?'); values.push(duration); }
      if (price !== undefined) { updates.push('price = ?'); values.push(price); }
      if (cover_image) { updates.push('cover_image = ?'); values.push(cover_image); }
      if (status) { updates.push('status = ?'); values.push(status); }
      
      if (updates.length === 0) {
        throw new AppError('没有提供要更新的内容', 400);
      }
      
      updates.push('updated_at = NOW()');
      values.push(courseId);
      
      await pool.execute(
        `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      res.json({
        success: true,
        message: '课程更新成功'
      } as ApiResponse);
    } catch (error) {
      console.error('更新课程错误:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        } as ApiResponse);
        return;
      }
      res.status(500).json({
        success: false,
        message: '更新课程失败'
      } as ApiResponse);
    }
  }

  async deleteCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      console.log('删除课程 - courseId:', courseId, 'userId:', userId, 'userRole:', userRole);
      
      const [courses] = await pool.execute(
        'SELECT teacher_id FROM courses WHERE id = ?',
        [courseId]
      );
      
      const courseList = courses as { teacher_id: number }[];
      
      console.log('查询到的课程:', courseList);
      
      if (courseList.length === 0) {
        throw new AppError('课程不存在', 404);
      }
      
      const teacherId = Number(courseList[0].teacher_id);
      const currentUserId = Number(userId);
      
      console.log('teacherId:', teacherId, 'currentUserId:', currentUserId);
      
      if (userRole !== 'admin' && teacherId !== currentUserId) {
        throw new AppError('没有权限删除此课程', 403);
      }
      
      await pool.execute('DELETE FROM courses WHERE id = ?', [courseId]);
      
      res.json({
        success: true,
        message: '课程删除成功'
      } as ApiResponse);
    } catch (error) {
      console.error('删除课程错误:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        } as ApiResponse);
        return;
      }
      res.status(500).json({
        success: false,
        message: '删除课程失败'
      } as ApiResponse);
    }
  }
}
