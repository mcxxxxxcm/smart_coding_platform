import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getCache, setCache, deleteCacheByPattern } from '../config/redis';
import { buildLimitOffset } from './base.repository';

export class ProblemRepository {
  async list(params: {
    page: number; limit: number; difficulty?: string; category?: string;
    search?: string; status?: string; teacherOnly?: boolean; userId?: number; userRole?: string;
  }) {
    const conditions: string[] = ['1=1'];
    const queryParams: any[] = [];

    if (params.teacherOnly && params.userRole === 'teacher') {
      conditions.push('created_by = ?'); queryParams.push(params.userId);
    } else if (params.userRole !== 'admin') {
      conditions.push("status = 'published'");
    }

    if (params.status && (params.userRole === 'admin' || params.userRole === 'teacher')) {
      conditions.push('status = ?'); queryParams.push(params.status);
    }
    if (params.difficulty) { conditions.push('difficulty = ?'); queryParams.push(params.difficulty); }
    if (params.category) { conditions.push('category = ?'); queryParams.push(params.category); }
    if (params.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      queryParams.push(`%${params.search}%`, `%${params.search}%`);
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const limitClause = buildLimitOffset(params.page, params.limit);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, description, difficulty, category, tags,
        submission_count, accepted_count,
        ROUND(accepted_count / NULLIF(submission_count, 0) * 100, 1) as acceptance_rate
       FROM problems ${whereClause} ORDER BY id ASC ${limitClause}`,
      queryParams
    );

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM problems ${whereClause}`,
      queryParams
    );

    return { data: rows, total: countRows[0].total };
  }

  async findById(id: number | string, onlyPublished: boolean = true) {
    const cacheKey = `problem:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const statusCondition = onlyPublished ? " AND status = 'published'" : '';
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, title, description, difficulty, category, tags,
        input_format, output_format, examples, constraints, hints,
        time_limit, memory_limit, template_code, created_by,
        submission_count, accepted_count
       FROM problems WHERE id = ?${statusCondition}`,
      [id]
    );

    if (rows.length === 0) return null;

    const problem = rows[0];
    if (typeof problem.tags === 'string') problem.tags = JSON.parse(problem.tags);
    if (typeof problem.examples === 'string') problem.examples = JSON.parse(problem.examples);
    if (typeof problem.template_code === 'string') problem.template_code = JSON.parse(problem.template_code);

    await setCache(cacheKey, problem, 600);
    return problem;
  }

  async findTestCases(id: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT test_cases, time_limit, memory_limit FROM problems WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    const testCases = typeof row.test_cases === 'string' ? JSON.parse(row.test_cases) : row.test_cases;
    return { testCases, timeLimit: row.time_limit || 1000, memoryLimit: row.memory_limit || 256 };
  }

  async create(data: {
    title: string; description: string; difficulty: string; category: string;
    tags: any; input_format: string; output_format: string; examples: any;
    constraints: string; test_cases: any; hints: any; time_limit: number;
    memory_limit: number; template_code: any; created_by: number;
  }) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO problems (title, description, difficulty, category, tags, input_format, output_format,
        examples, constraints, test_cases, hints, time_limit, memory_limit, template_code,
        created_by, status, submission_count, accepted_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, 0, NOW(), NOW())`,
      [data.title, data.description, data.difficulty, data.category, JSON.stringify(data.tags),
       data.input_format, data.output_format, JSON.stringify(data.examples), data.constraints,
       JSON.stringify(data.test_cases), JSON.stringify(data.hints), data.time_limit, data.memory_limit,
       JSON.stringify(data.template_code), data.created_by]
    );
    await deleteCacheByPattern('problems:*');
    return result.insertId;
  }

  async update(id: number | string, data: Record<string, any>) {
    const updates: string[] = [];
    const values: any[] = [];

    const jsonFields = ['tags', 'examples', 'test_cases', 'hints', 'template_code'];
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (jsonFields.includes(key)) {
        updates.push(`${key} = ?`); values.push(JSON.stringify(value));
      } else {
        updates.push(`${key} = ?`); values.push(value);
      }
    }

    if (updates.length === 0) return;
    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(`UPDATE problems SET ${updates.join(', ')} WHERE id = ?`, values);
    await deleteCacheByPattern(`problem:${id}`);
    await deleteCacheByPattern('problems:*');
  }

  async delete(id: number | string) {
    await pool.execute('DELETE FROM problems WHERE id = ?', [id]);
    await deleteCacheByPattern(`problem:${id}`);
    await deleteCacheByPattern('problems:*');
  }

  async incrementSubmissionCount(id: number) {
    await pool.execute('UPDATE problems SET submission_count = submission_count + 1 WHERE id = ?', [id]);
  }

  async incrementAcceptedCount(id: number) {
    await pool.execute('UPDATE problems SET accepted_count = accepted_count + 1 WHERE id = ?', [id]);
  }

  async getCreatedBy(id: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT created_by FROM problems WHERE id = ?', [id]
    );
    return rows[0]?.created_by || null;
  }
}

export const problemRepository = new ProblemRepository();
