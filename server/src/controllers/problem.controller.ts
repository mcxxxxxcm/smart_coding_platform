import { Response } from 'express';
import pool from '../config/database';
import { getCache, setCache, deleteCache } from '../config/redis';
import { AuthenticatedRequest, ApiResponse, PaginatedQuery } from '../types/express';
import { AppError } from '../middleware/error.middleware';

export class ProblemController {
  async getProblems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', difficulty, category, search } = req.query as PaginatedQuery & {
        difficulty?: string;
        category?: string;
        search?: string;
      };
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      
      let whereClause = "WHERE status = 'published'";
      const params: (string | number)[] = [];
      
      if (difficulty) {
        whereClause += ' AND difficulty = ?';
        params.push(difficulty);
      }
      
      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }
      
      if (search) {
        whereClause += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      console.log('SQL:', `SELECT id, title, description, difficulty, category, tags FROM problems ${whereClause} LIMIT ${limitNum} OFFSET ${offset}`);
      console.log('Params:', params);
      
      const [rows] = await pool.execute(
        `SELECT 
          id, title, description, difficulty, category, tags,
          submission_count, accepted_count,
          ROUND(accepted_count / NULLIF(submission_count, 0) * 100, 1) as acceptance_rate
         FROM problems
         ${whereClause}
         ORDER BY id ASC
         LIMIT ${limitNum} OFFSET ${offset}`,
        params
      );
      
      console.log('题目列表:', rows);
      
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM problems ${whereClause}`,
        params
      );
      
      const countData = countRows as { total: number }[];
      
      const response: ApiResponse = {
        success: true,
        message: '获取成功',
        data: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countData[0].total,
          totalPages: Math.ceil(countData[0].total / limitNum)
        }
      };
      
      // 尝试设置缓存，如果 Redis 不可用则忽略
      try {
        const cacheKey = `problems:${page}:${limit}:${difficulty}:${category}:${search}`;
        await setCache(cacheKey, response, 300);
      } catch (cacheError) {
        console.log('缓存设置失败，继续使用:', cacheError);
      }
      
      res.json(response);
    } catch (error) {
      console.error('获取题目列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取题目列表失败'
      } as ApiResponse);
    }
  }

  async getProblemById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const problemId = req.params.id;
      const cacheKey = `problem:${problemId}`;
      
      const cached = await getCache(cacheKey);
      if (cached) {
        res.json(cached as ApiResponse);
        return;
      }
      
      const [rows] = await pool.execute(
        `SELECT 
          id, title, description, difficulty, category, tags,
          input_format, output_format, examples, constraints, hints,
          time_limit, memory_limit, template_code,
          submission_count, accepted_count
         FROM problems
         WHERE id = ? AND status = 'published'`,
        [problemId]
      );
      
      const problems = rows as Record<string, unknown>[];
      
      if (problems.length === 0) {
        throw new AppError('题目不存在', 404);
      }
      
      const problem = problems[0];
      
      if (typeof problem.tags === 'string') {
        problem.tags = JSON.parse(problem.tags);
      }
      if (typeof problem.examples === 'string') {
        problem.examples = JSON.parse(problem.examples);
      }
      if (typeof problem.template_code === 'string') {
        problem.template_code = JSON.parse(problem.template_code);
      }
      
      const response: ApiResponse = {
        success: true,
        message: '获取成功',
        data: problem
      };
      
      await setCache(cacheKey, response, 600);
      
      res.json(response);
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

  async createProblem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        title, description, difficulty, category, tags,
        input_format, output_format, examples, constraints,
        test_cases, hints, time_limit, memory_limit, template_code
      } = req.body;
      
      const createdBy = req.user!.id;
      
      const [result] = await pool.execute(
        `INSERT INTO problems 
         (title, description, difficulty, category, tags, input_format, output_format, 
          examples, constraints, test_cases, hints, time_limit, memory_limit, template_code,
          created_by, status, submission_count, accepted_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, 0, NOW(), NOW())`,
        [
          title, description, difficulty, category, JSON.stringify(tags),
          input_format, output_format, JSON.stringify(examples), constraints,
          JSON.stringify(test_cases), JSON.stringify(hints),
          time_limit || 1000, memory_limit || 256, JSON.stringify(template_code),
          createdBy
        ]
      );
      
      const insertResult = result as { insertId: number };
      
      await deleteCache('problems:*');
      
      res.status(201).json({
        success: true,
        message: '题目创建成功',
        data: { id: insertResult.insertId }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '创建题目失败'
      } as ApiResponse);
    }
  }

  async updateProblem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const problemId = req.params.id;
      
      const {
        title, description, difficulty, category, tags,
        input_format, output_format, examples, constraints,
        test_cases, hints, time_limit, memory_limit, template_code, status
      } = req.body;
      
      const updates: string[] = [];
      const values: (string | number)[] = [];
      
      if (title) { updates.push('title = ?'); values.push(title); }
      if (description) { updates.push('description = ?'); values.push(description); }
      if (difficulty) { updates.push('difficulty = ?'); values.push(difficulty); }
      if (category) { updates.push('category = ?'); values.push(category); }
      if (tags) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
      if (input_format) { updates.push('input_format = ?'); values.push(input_format); }
      if (output_format) { updates.push('output_format = ?'); values.push(output_format); }
      if (examples) { updates.push('examples = ?'); values.push(JSON.stringify(examples)); }
      if (constraints) { updates.push('constraints = ?'); values.push(constraints); }
      if (test_cases) { updates.push('test_cases = ?'); values.push(JSON.stringify(test_cases)); }
      if (hints) { updates.push('hints = ?'); values.push(JSON.stringify(hints)); }
      if (time_limit) { updates.push('time_limit = ?'); values.push(time_limit); }
      if (memory_limit) { updates.push('memory_limit = ?'); values.push(memory_limit); }
      if (template_code) { updates.push('template_code = ?'); values.push(JSON.stringify(template_code)); }
      if (status) { updates.push('status = ?'); values.push(status); }
      
      if (updates.length === 0) {
        throw new AppError('没有提供要更新的内容', 400);
      }
      
      updates.push('updated_at = NOW()');
      values.push(problemId);
      
      await pool.execute(
        `UPDATE problems SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      await deleteCache(`problem:${problemId}`);
      
      res.json({
        success: true,
        message: '题目更新成功'
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

  async deleteProblem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const problemId = req.params.id;
      
      await pool.execute('DELETE FROM problems WHERE id = ?', [problemId]);
      
      await deleteCache(`problem:${problemId}`);
      
      res.json({
        success: true,
        message: '题目删除成功'
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '删除题目失败'
      } as ApiResponse);
    }
  }
}
