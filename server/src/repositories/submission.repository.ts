import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { buildLimitOffset } from './base.repository';

export class SubmissionRepository {
  async create(data: { user_id: number; problem_id: number; language: string; code: string }) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO submissions (user_id, problem_id, language, code, status, submitted_at)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [data.user_id, data.problem_id, data.language, data.code]
    );
    return result.insertId;
  }

  async updateResult(id: number, data: { status: string; runtime: number; memory: number; test_results: string }) {
    await pool.execute(
      'UPDATE submissions SET status = ?, runtime = ?, memory = ?, test_results = ? WHERE id = ?',
      [data.status, data.runtime, data.memory, data.test_results, id]
    );
  }

  async updateError(id: number, errorMessage: string) {
    await pool.execute(
      "UPDATE submissions SET status = 'runtime_error', error_message = ? WHERE id = ?",
      [errorMessage, id]
    );
  }

  async findById(id: number | string, userId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT s.*, p.title as problem_title, p.difficulty
       FROM submissions s JOIN problems p ON s.problem_id = p.id
       WHERE s.id = ? AND s.user_id = ?`,
      [id, userId]
    );
    if (rows.length === 0) return null;
    const sub = rows[0];
    if (typeof sub.test_results === 'string') sub.test_results = JSON.parse(sub.test_results);
    return sub;
  }

  async listByUser(userId: number, page: number, limit: number) {
    const limitClause = buildLimitOffset(page, limit);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.problem_id, s.language, s.status, s.runtime, s.memory, s.submitted_at,
        p.title as problem_title, p.difficulty
       FROM submissions s JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = ? ORDER BY s.submitted_at DESC ${limitClause}`,
      [userId]
    );
    const [countRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM submissions WHERE user_id = ?',
      [userId]
    );
    return { data: rows, total: countRows[0].total };
  }

  async countAcceptedByUserProblem(userId: number, problemId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM submissions WHERE user_id = ? AND problem_id = ? AND status = "accepted"',
      [userId, problemId]
    );
    return rows[0]?.count || 0;
  }
}

export const submissionRepository = new SubmissionRepository();
