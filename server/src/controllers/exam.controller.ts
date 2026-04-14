import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedQuery } from '../types/express';
import { AppError } from '../middleware/error.middleware';

export class ExamController {
  async getExams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '10', search, status, teacher_only } = req.query as PaginatedQuery & {
        search?: string;
        status?: string;
        teacher_only?: string;
      };

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const offset = (pageNum - 1) * limitNum;

      let whereClause = 'WHERE 1=1';
      const params: (string | number)[] = [];

      if (teacher_only === 'true' && req.user?.role === 'teacher') {
        whereClause += ' AND e.teacher_id = ?';
        params.push(req.user.id);
      } else if (req.user?.role === 'admin') {
        // 管理员可以看到所有考试
      } else {
        // 学生只能看到已发布的考试
        whereClause += " AND e.status = 'published'";
      }

      if (status && (req.user?.role === 'admin' || req.user?.role === 'teacher')) {
        whereClause += ' AND e.status = ?';
        params.push(status);
      }

      if (search) {
        whereClause += ' AND (e.title LIKE ? OR e.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const [rows] = await pool.execute(
        `SELECT 
          e.id, e.title, e.description, e.duration, e.total_score, e.passing_score,
          e.start_time, e.end_time, e.status, e.created_at,
          u.username as teacher_name,
          (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = e.id) as participant_count
         FROM exams e
         LEFT JOIN users u ON e.teacher_id = u.id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT ${limitNum} OFFSET ${offset}`,
        params
      );

      const countSql = `SELECT COUNT(*) as total FROM exams e ${whereClause}`;
      const [countRows] = await pool.execute(countSql, params);

      const countData = countRows as { total: number }[];

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
      console.error('获取考试列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取考试列表失败'
      } as ApiResponse);
    }
  }

  async getExamById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = req.params.id;

      const [rows] = await pool.execute(
        `SELECT 
          e.*, u.username as teacher_name
         FROM exams e
         LEFT JOIN users u ON e.teacher_id = u.id
         WHERE e.id = ?`,
        [examId]
      );

      const exams = rows as Record<string, unknown>[];

      if (exams.length === 0) {
        throw new AppError('考试不存在', 404);
      }

      const exam = exams[0];

      const [questions] = await pool.execute(
        `SELECT 
          eq.id, eq.score, eq.order,
          p.id as problem_id, p.title, p.difficulty, p.category
         FROM exam_questions eq
         LEFT JOIN problems p ON eq.problem_id = p.id
         WHERE eq.exam_id = ?
         ORDER BY eq.order ASC`,
        [examId]
      );

      (exam as Record<string, unknown>).questions = questions;

      res.json({
        success: true,
        data: exam
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

  async createExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, duration, total_score, passing_score, start_time, end_time, questions, allow_review, random_order } = req.body;
      const teacherId = req.user!.id;

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        const [result] = await conn.execute(
          `INSERT INTO exams 
           (title, description, teacher_id, duration, total_score, passing_score, start_time, end_time, status, allow_review, random_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, NOW(), NOW())`,
          [title, description, teacherId, duration || 60, total_score || 100, passing_score || 60, start_time || null, end_time || null, allow_review ?? true, random_order ?? false]
        );

        const insertResult = result as { insertId: number };
        const examId = insertResult.insertId;

        if (questions && questions.length > 0) {
          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            await conn.execute(
              `INSERT INTO exam_questions (exam_id, problem_id, score, \`order\`)
               VALUES (?, ?, ?, ?)`,
              [examId, q.problem_id, q.score || 10, i + 1]
            );
          }
        }

        await conn.commit();

        res.status(201).json({
          success: true,
          message: '考试创建成功',
          data: { id: examId }
        } as ApiResponse);
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch {
      res.status(500).json({
        success: false,
        message: '创建考试失败'
      } as ApiResponse);
    }
  }

  async updateExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = req.params.id;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const [exams] = await pool.execute(
        'SELECT teacher_id FROM exams WHERE id = ?',
        [examId]
      );

      const examList = exams as { teacher_id: number }[];

      if (examList.length === 0) {
        throw new AppError('考试不存在', 404);
      }

      if (userRole !== 'admin' && examList[0].teacher_id !== userId) {
        throw new AppError('没有权限修改此考试', 403);
      }

      const { title, description, duration, total_score, passing_score, start_time, end_time, status, questions, allow_review, random_order } = req.body;

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        const updates: string[] = [];
        const values: (string | number | boolean | null)[] = [];

        if (title) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (duration !== undefined) { updates.push('duration = ?'); values.push(duration); }
        if (total_score !== undefined) { updates.push('total_score = ?'); values.push(total_score); }
        if (passing_score !== undefined) { updates.push('passing_score = ?'); values.push(passing_score); }
        if (start_time !== undefined) { updates.push('start_time = ?'); values.push(start_time); }
        if (end_time !== undefined) { updates.push('end_time = ?'); values.push(end_time); }
        if (status) { updates.push('status = ?'); values.push(status); }
        if (allow_review !== undefined) { updates.push('allow_review = ?'); values.push(allow_review); }
        if (random_order !== undefined) { updates.push('random_order = ?'); values.push(random_order); }

        if (updates.length > 0) {
          updates.push('updated_at = NOW()');
          values.push(examId);
          await conn.execute(
            `UPDATE exams SET ${updates.join(', ')} WHERE id = ?`,
            values
          );
        }

        if (questions) {
          await conn.execute('DELETE FROM exam_questions WHERE exam_id = ?', [examId]);
          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            await conn.execute(
              `INSERT INTO exam_questions (exam_id, problem_id, score, \`order\`)
               VALUES (?, ?, ?, ?)`,
              [examId, q.problem_id, q.score || 10, i + 1]
            );
          }
        }

        await conn.commit();

        res.json({
          success: true,
          message: '考试更新成功'
        } as ApiResponse);
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        } as ApiResponse);
        return;
      }
      res.status(500).json({
        success: false,
        message: '更新考试失败'
      } as ApiResponse);
    }
  }

  async deleteExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = req.params.id;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const [exams] = await pool.execute(
        'SELECT teacher_id FROM exams WHERE id = ?',
        [examId]
      );

      const examList = exams as { teacher_id: number }[];

      if (examList.length === 0) {
        throw new AppError('考试不存在', 404);
      }

      if (userRole !== 'admin' && examList[0].teacher_id !== userId) {
        throw new AppError('没有权限删除此考试', 403);
      }

      await pool.execute('DELETE FROM exams WHERE id = ?', [examId]);

      res.json({
        success: true,
        message: '考试删除成功'
      } as ApiResponse);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        } as ApiResponse);
        return;
      }
      res.status(500).json({
        success: false,
        message: '删除考试失败'
      } as ApiResponse);
    }
  }

  async getAvailableProblems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search } = req.query as { search?: string };

      let whereClause = "WHERE status = 'published'";
      const params: string[] = [];

      if (search) {
        whereClause += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const [rows] = await pool.execute(
        `SELECT id, title, difficulty, category 
         FROM problems 
         ${whereClause}
         ORDER BY id ASC
         LIMIT 50`,
        params
      );

      res.json({
        success: true,
        data: rows
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '获取题目列表失败'
      } as ApiResponse);
    }
  }
}
