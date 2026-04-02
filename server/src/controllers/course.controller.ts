import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedQuery } from '../types/express';
import { AppError } from '../middleware/error.middleware';

export class CourseController {
  async getCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '10', category, difficulty, search } = req.query as PaginatedQuery & {
        category?: string;
        difficulty?: string;
        search?: string;
      };
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let whereClause = "WHERE status = 'published'";
      const params: (string | number)[] = [];
      
      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }
      
      if (difficulty) {
        whereClause += ' AND difficulty = ?';
        params.push(difficulty);
      }
      
      if (search) {
        whereClause += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      const [rows] = await pool.execute(
        `SELECT 
          c.id, c.title, c.description, c.cover_image, c.category, c.difficulty,
          c.duration, c.price, c.enrollment_count, c.rating, c.created_at,
          u.username as teacher_name, u.avatar as teacher_avatar
         FROM courses c
         LEFT JOIN users u ON c.teacher_id = u.id
         ${whereClause}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );
      
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM courses ${whereClause}`,
        params
      );
      
      const countData = countRows as { total: number }[];
      
      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countData[0].total,
          totalPages: Math.ceil(countData[0].total / parseInt(limit))
        }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '获取课程列表失败'
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
      
      const [result] = await pool.execute(
        `INSERT INTO courses 
         (title, description, category, difficulty, teacher_id, duration, price, cover_image, status, enrollment_count, rating, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0, 0, NOW(), NOW())`,
        [title, description, category, difficulty, teacherId, duration, price, cover_image]
      );
      
      const insertResult = result as { insertId: number };
      
      res.status(201).json({
        success: true,
        message: '课程创建成功',
        data: { id: insertResult.insertId }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '创建课程失败'
      } as ApiResponse);
    }
  }

  async updateCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const [courses] = await pool.execute(
        'SELECT teacher_id FROM courses WHERE id = ?',
        [courseId]
      );
      
      const courseList = courses as { teacher_id: number }[];
      
      if (courseList.length === 0) {
        throw new AppError('课程不存在', 404);
      }
      
      if (userRole !== 'admin' && courseList[0].teacher_id !== userId) {
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

  async deleteCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      
      await pool.execute('DELETE FROM courses WHERE id = ?', [courseId]);
      
      res.json({
        success: true,
        message: '课程删除成功'
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '删除课程失败'
      } as ApiResponse);
    }
  }
}
