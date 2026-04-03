import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types/express';
import { AppError } from '../middleware/error.middleware';
import { CodeExecutor } from '../services/code-executor.service';

export class SubmissionController {
  private codeExecutor: CodeExecutor;

  constructor() {
    this.codeExecutor = new CodeExecutor();
    // 绑定 this 上下文
    this.submit = this.submit.bind(this);
    this.getSubmission = this.getSubmission.bind(this);
    this.getUserSubmissions = this.getUserSubmissions.bind(this);
  }

  async submit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('收到代码提交:', req.body);
      const { problem_id, language, code } = req.body;
      const userId = req.user!.id;
      
      console.log('用户 ID:', userId);
      console.log('题目 ID:', problem_id);
      console.log('语言:', language);
      
      const [problems] = await pool.execute(
        'SELECT id, test_cases, time_limit, memory_limit FROM problems WHERE id = ? AND status = "published"',
        [problem_id]
      );
      
      const problemList = problems as { id: number; test_cases: string | any[]; time_limit: number; memory_limit: number }[];
      
      console.log('查询到的题目:', problemList);
      
      if (problemList.length === 0) {
        throw new AppError('题目不存在', 404);
      }
      
      const problem = problemList[0];
      
      // test_cases 可能已经是对象（MySQL JSON 类型自动解析），也可能是 JSON 字符串
      const testCases = typeof problem.test_cases === 'string' 
        ? JSON.parse(problem.test_cases) 
        : problem.test_cases;
      
      console.log('测试用例:', testCases);
      
      const [result] = await pool.execute(
        `INSERT INTO submissions 
         (user_id, problem_id, language, code, status, submitted_at)
         VALUES (?, ?, ?, ?, 'pending', NOW())`,
        [userId, problem_id, language, code]
      );
      
      const insertResult = result as { insertId: number };
      const submissionId = insertResult.insertId;
      
      console.log('提交成功，提交 ID:', submissionId);
      
      res.json({
        success: true,
        message: '代码已提交，正在执行中',
        data: { submissionId }
      } as ApiResponse);
      
      this.executeCode(submissionId, userId, problem_id, language, code, testCases, problem.time_limit, problem.memory_limit);
    } catch (error) {
      console.error('提交代码错误:', error);
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

  private async executeCode(
    submissionId: number,
    userId: number,
    problemId: number,
    language: string,
    code: string,
    testCases: Array<{ input: string; output: string; is_hidden: boolean }>,
    timeLimit: number,
    memoryLimit: number
  ): Promise<void> {
    try {
      const results = await this.codeExecutor.execute(language, code, testCases, timeLimit, memoryLimit);
      
      let status = 'accepted';
      let totalRuntime = 0;
      let totalMemory = 0;
      
      for (const result of results) {
        if (result.status !== 'accepted') {
          status = result.status;
        }
        totalRuntime += result.runtime;
        totalMemory = Math.max(totalMemory, result.memory);
      }
      
      const accepted = status === 'accepted';
      
      await pool.execute(
        `UPDATE submissions 
         SET status = ?, runtime = ?, memory = ?, test_results = ?
         WHERE id = ?`,
        [status, totalRuntime, totalMemory, JSON.stringify(results), submissionId]
      );
      
      await pool.execute(
        'UPDATE problems SET submission_count = submission_count + 1 WHERE id = ?',
        [problemId]
      );
      
      if (accepted) {
        await pool.execute(
          'UPDATE problems SET accepted_count = accepted_count + 1 WHERE id = ?',
          [problemId]
        );
        
        const [existing] = await pool.execute(
          'SELECT id FROM submissions WHERE user_id = ? AND problem_id = ? AND status = "accepted"',
          [userId, problemId]
        );
        
        if ((existing as unknown[]).length === 1) {
          await pool.execute(
            'UPDATE users SET experience = experience + 50, points = points + 20 WHERE id = ?',
            [userId]
          );
        }
      }
    } catch (error) {
      await pool.execute(
        `UPDATE submissions SET status = 'runtime_error', error_message = ? WHERE id = ?`,
        [(error as Error).message, submissionId]
      );
    }
  }

  async getSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const submissionId = req.params.id;
      const userId = req.user!.id;
      
      const [rows] = await pool.execute(
        `SELECT s.*, p.title as problem_title, p.difficulty
         FROM submissions s
         JOIN problems p ON s.problem_id = p.id
         WHERE s.id = ? AND s.user_id = ?`,
        [submissionId, userId]
      );
      
      const submissions = rows as Record<string, unknown>[];
      
      if (submissions.length === 0) {
        throw new AppError('提交记录不存在', 404);
      }
      
      const submission = submissions[0];
      
      if (typeof submission.test_results === 'string') {
        submission.test_results = JSON.parse(submission.test_results);
      }
      
      res.json({
        success: true,
        data: submission
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

  async getUserSubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limitNum = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limitNum;
      
      const [rows] = await pool.execute(
        `SELECT 
          s.id, s.problem_id, s.language, s.status, s.runtime, s.memory, s.submitted_at,
          p.title as problem_title, p.difficulty
         FROM submissions s
         JOIN problems p ON s.problem_id = p.id
         WHERE s.user_id = ?
         ORDER BY s.submitted_at DESC
         LIMIT ${limitNum} OFFSET ${offset}`,
        [userId]
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
          limit: limitNum,
          total: countData[0].total,
          totalPages: Math.ceil(countData[0].total / limitNum)
        }
      } as ApiResponse);
    } catch (error) {
      console.error('获取提交记录错误:', error);
      res.status(500).json({
        success: false,
        message: '获取提交记录失败'
      } as ApiResponse);
    }
  }
}
