import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedQuery } from '../types/express';
import { AppError } from '../middleware/error.middleware';
import { CodeExecutor } from '../services/code-executor.service';

const codeExecutor = new CodeExecutor();

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

      // 检查用户是否已经提交过该考试
      if (req.user) {
        const [attempts] = await pool.execute(
          `SELECT id FROM exam_attempts WHERE exam_id = ? AND user_id = ? AND status = 'submitted'`,
          [examId, req.user.id]
        );
        (exam as Record<string, unknown>).hasSubmitted = (attempts as unknown[]).length > 0;
      } else {
        (exam as Record<string, unknown>).hasSubmitted = false;
      }

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

  async submitExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = req.params.id;
      const userId = req.user!.id;
      const { submissions, time_used } = req.body;

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        // 检查是否已经有考试尝试记录
        const [existingAttempts] = await conn.execute(
          `SELECT id FROM exam_attempts WHERE exam_id = ? AND user_id = ?`,
          [examId, userId]
        );

        let attemptId: number;

        if ((existingAttempts as unknown[]).length > 0) {
          // 更新现有记录
          const existingAttempt = (existingAttempts as { id: number }[])[0];
          attemptId = existingAttempt.id;
          
          await conn.execute(
            `UPDATE exam_attempts SET submit_time = NOW(), status = 'submitted' WHERE id = ?`,
            [attemptId]
          );
        } else {
          // 创建新记录
          const [attemptResult] = await conn.execute(
            `INSERT INTO exam_attempts (exam_id, user_id, start_time, submit_time, total_score, status)
             VALUES (?, ?, NOW(), NOW(), 0, 'submitted')`,
            [examId, userId]
          );
          attemptId = (attemptResult as { insertId: number }).insertId;
        }

        let totalScore = 0;
        
        // 获取考试的题目数量
        const [questionCountResult] = await conn.execute(
          `SELECT COUNT(*) as count FROM exam_questions WHERE exam_id = ?`,
          [examId]
        );
        
        const questionCount = (questionCountResult as { count: number }[])[0]?.count || 1;
        const perQuestionScore = 100 / questionCount; // 每个题目的分值，按100分均分

        // 处理每个题目的提交
        for (const submission of submissions) {
          // 检查是否已经有该题的提交记录
          const [existingSubmissions] = await conn.execute(
            `SELECT id FROM exam_submissions WHERE exam_id = ? AND user_id = ? AND problem_id = ?`,
            [examId, userId, submission.problem_id]
          );

          // 根据实际测试案例通过率计算分数
          let score = 0;
          let status = 'wrong_answer';

          if (submission.code && submission.code.trim()) {
            try {
              // 获取题目的测试用例
              const [problemData] = await conn.execute(
                `SELECT test_cases, time_limit, memory_limit FROM problems WHERE id = ?`,
                [submission.problem_id]
              );

              const problem = (problemData as { test_cases: string | null; time_limit: number; memory_limit: number }[])[0];
              
              if (problem && problem.test_cases) {
                const testCases = JSON.parse(problem.test_cases);
                
                // 调用代码执行服务评判
                const results = await codeExecutor.execute(
                  submission.language,
                  submission.code,
                  testCases,
                  problem.time_limit || 1000,
                  problem.memory_limit || 256
                );

                // 计算通过的测试案例数量
                const passedCount = results.filter((r: any) => r.status === 'accepted').length;
                const totalTestCases = testCases.length;
                
                // 根据通过率计算分数
                if (totalTestCases > 0) {
                  const passRate = passedCount / totalTestCases;
                  score = Math.round(perQuestionScore * passRate);
                }

                // 如果全部通过，状态为 accepted
                if (passedCount === totalTestCases) {
                  status = 'accepted';
                } else if (passedCount > 0) {
                  status = 'partial_correct';
                }
              } else {
                // 没有测试用例，默认给分
                score = Math.round(perQuestionScore * 0.9);
                status = 'accepted';
              }
            } catch (execError) {
              console.error('代码执行错误:', (execError as Error).message);
              // 代码执行失败，得0分
              score = 0;
              status = 'runtime_error';
            }
          }

          totalScore += score;

          if ((existingSubmissions as unknown[]).length > 0) {
            // 更新现有提交
            const existingSubmission = (existingSubmissions as { id: number }[])[0];
            await conn.execute(
              `UPDATE exam_submissions SET language = ?, code = ?, score = ?, status = ?, graded_at = NOW()
               WHERE id = ?`,
              [submission.language, submission.code, score, status, existingSubmission.id]
            );
          } else {
            // 创建新提交
            await conn.execute(
              `INSERT INTO exam_submissions (exam_id, user_id, problem_id, language, code, score, status, submitted_at, graded_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [examId, userId, submission.problem_id, submission.language, submission.code, score, status]
            );
          }
        }

        // 确保总分不超过100分
        totalScore = Math.min(totalScore, 100);

        // 更新总分
        await conn.execute(
          `UPDATE exam_attempts SET total_score = ? WHERE id = ?`,
          [totalScore, attemptId]
        );

        await conn.commit();

        res.json({
          success: true,
          message: '交卷成功',
          data: { score: totalScore }
        } as ApiResponse);
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('提交考试错误:', error);
      res.status(500).json({
        success: false,
        message: `交卷失败: ${(error as Error).message}`
      } as ApiResponse);
    }
  }

  async getExamAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = req.params.id;
      const teacherId = req.user!.id;

      // 验证教师权限
      const [exams] = await pool.execute(
        'SELECT teacher_id FROM exams WHERE id = ?',
        [examId]
      );

      const examList = exams as { teacher_id: number }[];
      if (examList.length === 0 || examList[0].teacher_id !== teacherId) {
        throw new AppError('没有权限查看此考试的 analytics', 403);
      }

      // 获取所有学生的成绩
      const [attempts] = await pool.execute(
        `SELECT 
          ea.id, ea.user_id, ea.total_score, ea.submit_time,
          u.username,
          ROW_NUMBER() OVER (ORDER BY ea.total_score DESC) as \`rank\`
         FROM exam_attempts ea
         LEFT JOIN users u ON ea.user_id = u.id
         WHERE ea.exam_id = ? AND ea.status = 'submitted'
         ORDER BY ea.total_score DESC`,
        [examId]
      );

      // 统计分数段
      const [scoreDistribution] = await pool.execute(
        `SELECT 
          COUNT(CASE WHEN total_score >= 90 THEN 1 END) as excellent,
          COUNT(CASE WHEN total_score >= 80 AND total_score < 90 THEN 1 END) as good,
          COUNT(CASE WHEN total_score >= 70 AND total_score < 80 THEN 1 END) as medium,
          COUNT(CASE WHEN total_score >= 60 AND total_score < 70 THEN 1 END) as pass,
          COUNT(CASE WHEN total_score < 60 THEN 1 END) as fail
         FROM exam_attempts
         WHERE exam_id = ? AND status = 'submitted'`,
        [examId]
      );

      // 获取每题的平均得分
      const [questionStats] = await pool.execute(
        `SELECT 
          es.problem_id,
          p.title,
          AVG(es.score) as avg_score,
          MAX(es.score) as max_score,
          COUNT(*) as submission_count
         FROM exam_submissions es
         LEFT JOIN problems p ON es.problem_id = p.id
         WHERE es.exam_id = ?
         GROUP BY es.problem_id, p.title`,
        [examId]
      );

      const distribution = scoreDistribution as { excellent: number; good: number; medium: number; pass: number; fail: number }[];
      const avgScore = (attempts as any[]).length > 0 
        ? Math.round((attempts as any[]).reduce((sum, a) => sum + a.total_score, 0) / (attempts as any[]).length)
        : 0;

      res.json({
        success: true,
        data: {
          totalStudents: (attempts as any[]).length,
          averageScore: avgScore,
          distribution: distribution[0],
          rankings: attempts,
          questionStats: questionStats
        }
      } as ApiResponse);
    } catch (error) {
      console.error('获取考试 analytics 错误:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        } as ApiResponse);
        return;
      }
      res.status(500).json({
        success: false,
        message: '获取学情分析失败'
      } as ApiResponse);
    }
  }

  async getExamHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page = '1', limit = '10' } = req.query as { page?: string; limit?: string };
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;

      const [rows] = await pool.execute(
        `SELECT 
          ea.id as attempt_id, ea.exam_id, ea.total_score, ea.submit_time, ea.start_time,
          e.title as exam_title, e.total_score as exam_total_score, e.passing_score,
          u.username as teacher_name
         FROM exam_attempts ea
         INNER JOIN exams e ON ea.exam_id = e.id
         LEFT JOIN users u ON e.teacher_id = u.id
         WHERE ea.user_id = ? AND ea.status = 'submitted'
         ORDER BY ea.submit_time DESC
         LIMIT ${limitNum} OFFSET ${offset}`,
        [userId]
      );

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM exam_attempts WHERE user_id = ? AND status = 'submitted'`,
        [userId]
      );

      const total = (countRows as { total: number }[])[0].total;

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '获取考试历史失败'
      } as ApiResponse);
    }
  }

  async getExamSubmissionDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const attemptId = req.params.attemptId;

      // 验证该提交属于当前用户
      const [attempts] = await pool.execute(
        `SELECT ea.*, e.title as exam_title, e.total_score as exam_total_score, e.passing_score
         FROM exam_attempts ea
         INNER JOIN exams e ON ea.exam_id = e.id
         WHERE ea.id = ? AND ea.user_id = ?`,
        [attemptId, userId]
      );

      const attemptList = attempts as any[];
      if (attemptList.length === 0) {
        throw new AppError('提交记录不存在', 404);
      }

      const attempt = attemptList[0];

      // 获取该次提交中每道题的详情，包括错误信息
      const [submissions] = await pool.execute(
        `SELECT 
          es.id, es.problem_id, es.language, es.code, es.score, es.status, es.submitted_at,
          p.title as problem_title, p.difficulty, p.description,
          eq.score as problem_max_score,
          (SELECT COUNT(*) FROM JSON_TABLE(es.status, '$' COLUMNS (dummy TINYINT PATH '$')) t) as dummy_check
         FROM exam_submissions es
         INNER JOIN exam_questions eq ON es.problem_id = eq.problem_id AND eq.exam_id = es.exam_id
         LEFT JOIN problems p ON es.problem_id = p.id
         WHERE es.exam_id = ? AND es.user_id = ?
         ORDER BY es.problem_id ASC`,
        [attempt.exam_id, userId]
      );

      // 获取每道题的测试案例详情
      const submissionList = submissions as any[];
      for (const sub of submissionList) {
        const [problemData] = await pool.execute(
          `SELECT test_cases FROM problems WHERE id = ?`,
          [sub.problem_id]
        );
        const problem = (problemData as any[])[0];
        if (problem && problem.test_cases) {
          const testCases = JSON.parse(problem.test_cases);
          // 只返回非隐藏测试案例用于展示
          sub.test_cases = testCases.map((tc: any) => ({
            input: tc.input,
            expected: tc.output,
            is_hidden: tc.is_hidden || false
          })).filter((tc: any) => !tc.is_hidden);
        }
        sub.is_correct = sub.status === 'accepted';
        sub.passed_rate = sub.status === 'accepted' ? '100%' : 
                         sub.status === 'partial_correct' ? '部分通过' : '0%';
      }

      attempt.submissions = submissionList;

      res.json({
        success: true,
        data: attempt
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
        message: '获取提交详情失败'
      } as ApiResponse);
    }
  }

  async getWrongQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // 获取所有未完全通过的考试提交（错题）
      const [rows] = await pool.execute(
        `SELECT DISTINCT
          es.problem_id,
          p.title as problem_title,
          p.difficulty,
          p.description,
          es.status,
          es.score,
          eq.score as max_score,
          es.submitted_at,
          e.title as exam_title,
          es.code
         FROM exam_submissions es
         INNER JOIN exam_attempts ea ON es.exam_id = ea.exam_id AND es.user_id = ea.user_id
         INNER JOIN problems p ON es.problem_id = p.id
         INNER JOIN exam_questions eq ON es.problem_id = eq.problem_id AND eq.exam_id = es.exam_id
         INNER JOIN exams e ON es.exam_id = e.id
         WHERE es.user_id = ? 
           AND es.status IN ('wrong_answer', 'partial_correct', 'runtime_error', 'time_limit_exceeded')
           AND ea.status = 'submitted'
         ORDER BY es.submitted_at DESC`,
        [userId]
      );

      // 为每道错题获取可见测试案例
      const wrongList = rows as any[];
      for (const item of wrongList) {
        const [problemData] = await pool.execute(
          `SELECT test_cases FROM problems WHERE id = ?`,
          [item.problem_id]
        );
        const problem = (problemData as any[])[0];
        if (problem && problem.test_cases) {
          const testCases = typeof problem.test_cases === 'string' 
            ? JSON.parse(problem.test_cases) 
            : problem.test_cases;
          item.test_cases = testCases
            .filter((tc: any) => !tc.is_hidden)
            .map((tc: any) => ({ input: tc.input, expected: tc.output }));
        }
      }

      res.json({
        success: true,
        data: wrongList
      } as ApiResponse);
    } catch (error) {
      console.error('获取错题记录失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取错题记录失败'
      } as ApiResponse);
    }
  }
}
