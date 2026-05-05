import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { buildLimitOffset } from './base.repository';

export class ExamRepository {
  async list(params: {
    page: number; limit: number; search?: string; status?: string;
    teacherOnly?: boolean; userId?: number; userRole?: string;
  }) {
    const conditions: string[] = ['1=1'];
    const queryParams: any[] = [];

    if (params.teacherOnly && params.userRole === 'teacher') {
      conditions.push('e.teacher_id = ?'); queryParams.push(params.userId);
    } else if (params.userRole !== 'admin') {
      conditions.push("e.status = 'published'");
    }
    if (params.status && (params.userRole === 'admin' || params.userRole === 'teacher')) {
      conditions.push('e.status = ?'); queryParams.push(params.status);
    }
    if (params.search) {
      conditions.push('(e.title LIKE ? OR e.description LIKE ?)');
      queryParams.push(`%${params.search}%`, `%${params.search}%`);
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const limitClause = buildLimitOffset(params.page, params.limit);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.id, e.title, e.description, e.duration, e.total_score, e.passing_score,
        e.start_time, e.end_time, e.status, e.created_at, u.username as teacher_name,
        (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = e.id) as participant_count
       FROM exams e LEFT JOIN users u ON e.teacher_id = u.id
       ${whereClause} ORDER BY e.created_at DESC ${limitClause}`,
      queryParams
    );

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM exams e ${whereClause}`, queryParams
    );

    return { data: rows, total: countRows[0].total };
  }

  async findById(id: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT e.*, u.username as teacher_name FROM exams e LEFT JOIN users u ON e.teacher_id = u.id WHERE e.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async getQuestions(examId: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT eq.id, eq.score, eq.\`order\`, p.id as problem_id, p.title, p.difficulty, p.category,
        p.description, p.input_format, p.output_format, p.examples, p.constraints, p.hints,
        p.template_code, p.time_limit, p.memory_limit
       FROM exam_questions eq LEFT JOIN problems p ON eq.problem_id = p.id
       WHERE eq.exam_id = ? ORDER BY eq.\`order\` ASC`,
      [examId]
    );
    return rows;
  }

  async getQuestionScores(examId: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT problem_id, score FROM exam_questions WHERE exam_id = ?',
      [examId]
    );
    const map = new Map<number, number>();
    rows.forEach(r => map.set(r.problem_id, r.score));
    return map;
  }

  async hasSubmitted(examId: number | string, userId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM exam_attempts WHERE exam_id = ? AND user_id = ? AND status = 'submitted'",
      [examId, userId]
    );
    return rows.length > 0;
  }

  async findAttempt(examId: number | string, userId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM exam_attempts WHERE exam_id = ? AND user_id = ?',
      [examId, userId]
    );
    return rows[0] || null;
  }

  async createAttempt(examId: number | string, userId: number) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO exam_attempts (exam_id, user_id, start_time, submit_time, total_score, status)
       VALUES (?, ?, NOW(), NOW(), 0, 'submitted')`,
      [examId, userId]
    );
    return result.insertId;
  }

  async updateAttempt(attemptId: number, totalScore: number) {
    await pool.execute(
      "UPDATE exam_attempts SET submit_time = NOW(), status = 'submitted', total_score = ? WHERE id = ?",
      [totalScore, attemptId]
    );
  }

  async findSubmission(examId: number | string, userId: number, problemId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM exam_submissions WHERE exam_id = ? AND user_id = ? AND problem_id = ?',
      [examId, userId, problemId]
    );
    return rows[0] || null;
  }

  async createSubmission(data: { exam_id: number; user_id: number; problem_id: number; language: string; code: string; score: number; status: string }) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO exam_submissions (exam_id, user_id, problem_id, language, code, score, status, submitted_at, graded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [data.exam_id, data.user_id, data.problem_id, data.language, data.code, data.score, data.status]
    );
    return result.insertId;
  }

  async updateSubmission(id: number, data: { language: string; code: string; score: number; status: string }) {
    await pool.execute(
      'UPDATE exam_submissions SET language = ?, code = ?, score = ?, status = ?, graded_at = NOW() WHERE id = ?',
      [data.language, data.code, data.score, data.status, id]
    );
  }

  async create(data: {
    title: string; description: string; teacher_id: number; duration: number;
    total_score: number; passing_score: number; start_time: string | null;
    end_time: string | null; allow_review: boolean; random_order: boolean;
  }) {
    const formatDt = (v: string | null | undefined) => {
      if (!v) return null;
      const d = new Date(v);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 19).replace('T', ' ');
    };
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO exams (title, description, teacher_id, duration, total_score, passing_score, start_time, end_time, status, allow_review, random_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, NOW(), NOW())`,
        [
          data.title ?? '',
          data.description ?? '',
          data.teacher_id,
          data.duration ?? 60,
          data.total_score ?? 100,
          data.passing_score ?? 60,
          formatDt(data.start_time),
          formatDt(data.end_time),
          data.allow_review ?? true,
          data.random_order ?? false
        ]
      );
      await conn.commit();
      return result.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async addQuestions(examId: number, questions: { problem_id: number; score: number; order: number }[]) {
    for (const q of questions) {
      await pool.execute(
        'INSERT INTO exam_questions (exam_id, problem_id, score, `order`) VALUES (?, ?, ?, ?)',
        [examId, q.problem_id, q.score ?? 0, q.order ?? 0]
      );
    }
  }

  async updateExam(examId: number | string, data: Record<string, any>, questions?: { problem_id: number; score: number; order: number }[]) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const updates: string[] = [];
      const values: any[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) { updates.push(`${key} = ?`); values.push(value); }
      }
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(examId);
        await conn.execute(`UPDATE exams SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      if (questions) {
        await conn.execute('DELETE FROM exam_questions WHERE exam_id = ?', [examId]);
        for (const q of questions) {
          await conn.execute(
            'INSERT INTO exam_questions (exam_id, problem_id, score, `order`) VALUES (?, ?, ?, ?)',
            [examId, q.problem_id, q.score, q.order]
          );
        }
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async delete(examId: number | string) {
    await pool.execute('DELETE FROM exams WHERE id = ?', [examId]);
  }

  async getTeacherId(examId: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT teacher_id FROM exams WHERE id = ?', [examId]
    );
    return rows[0]?.teacher_id || null;
  }

  async getAnalytics(examId: number | string) {
    const [attempts] = await pool.execute<RowDataPacket[]>(
      `SELECT ea.id, ea.user_id, ea.total_score, ea.submit_time, u.username,
        ROW_NUMBER() OVER (ORDER BY ea.total_score DESC) as \`rank\`
       FROM exam_attempts ea LEFT JOIN users u ON ea.user_id = u.id
       WHERE ea.exam_id = ? AND ea.status = 'submitted' ORDER BY ea.total_score DESC`,
      [examId]
    );

    const [scoreDistribution] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(CASE WHEN total_score >= 90 THEN 1 END) as excellent,
        COUNT(CASE WHEN total_score >= 80 AND total_score < 90 THEN 1 END) as good,
        COUNT(CASE WHEN total_score >= 70 AND total_score < 80 THEN 1 END) as medium,
        COUNT(CASE WHEN total_score >= 60 AND total_score < 70 THEN 1 END) as pass,
        COUNT(CASE WHEN total_score < 60 THEN 1 END) as fail
       FROM exam_attempts WHERE exam_id = ? AND status = 'submitted'`,
      [examId]
    );

    const [questionStats] = await pool.execute<RowDataPacket[]>(
      `SELECT es.problem_id, p.title, AVG(es.score) as avg_score, MAX(es.score) as max_score, COUNT(*) as submission_count
       FROM exam_submissions es LEFT JOIN problems p ON es.problem_id = p.id
       WHERE es.exam_id = ? GROUP BY es.problem_id, p.title`,
      [examId]
    );

    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.total_score, 0) / attempts.length)
      : 0;

    return {
      totalStudents: attempts.length,
      averageScore: avgScore,
      distribution: scoreDistribution[0],
      rankings: attempts,
      questionStats
    };
  }

  async getHistory(userId: number, page: number, limit: number) {
    const limitClause = buildLimitOffset(page, limit);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ea.id as attempt_id, ea.exam_id, ea.total_score, ea.submit_time, ea.start_time,
        e.title as exam_title, e.total_score as exam_total_score, e.passing_score, u.username as teacher_name
       FROM exam_attempts ea INNER JOIN exams e ON ea.exam_id = e.id
       LEFT JOIN users u ON e.teacher_id = u.id
       WHERE ea.user_id = ? AND ea.status = 'submitted'
       ORDER BY ea.submit_time DESC ${limitClause}`,
      [userId]
    );
    const [countRows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM exam_attempts WHERE user_id = ? AND status = 'submitted'",
      [userId]
    );
    return { data: rows, total: countRows[0].total };
  }

  async getSubmissionDetail(attemptId: number | string, userId: number) {
    const [attempts] = await pool.execute<RowDataPacket[]>(
      `SELECT ea.*, e.title as exam_title, e.total_score as exam_total_score, e.passing_score
       FROM exam_attempts ea INNER JOIN exams e ON ea.exam_id = e.id
       WHERE ea.id = ? AND ea.user_id = ?`,
      [attemptId, userId]
    );
    return attempts[0] || null;
  }

  async getExamSubmissions(examId: number | string, userId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT es.id, es.problem_id, es.language, es.code, es.score, es.status, es.submitted_at,
        p.title as problem_title, p.difficulty, p.description, eq.score as problem_max_score
       FROM exam_submissions es
       INNER JOIN exam_questions eq ON es.problem_id = eq.problem_id AND eq.exam_id = es.exam_id
       LEFT JOIN problems p ON es.problem_id = p.id
       WHERE es.exam_id = ? AND es.user_id = ?
       ORDER BY es.problem_id ASC`,
      [examId, userId]
    );
    return rows;
  }

  async getWrongQuestions(userId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT es.problem_id, p.title as problem_title, p.difficulty, p.description,
        es.status, es.score, eq.score as max_score, es.submitted_at, e.title as exam_title, es.code
       FROM exam_submissions es
       INNER JOIN exam_attempts ea ON es.exam_id = ea.exam_id AND es.user_id = ea.user_id
       INNER JOIN problems p ON es.problem_id = p.id
       INNER JOIN exam_questions eq ON es.problem_id = eq.problem_id AND eq.exam_id = es.exam_id
       INNER JOIN exams e ON es.exam_id = e.id
       WHERE es.user_id = ? AND es.status IN ('wrong_answer', 'partial_correct', 'runtime_error', 'time_limit_exceeded')
       AND ea.status = 'submitted' ORDER BY es.submitted_at DESC`,
      [userId]
    );
    return rows;
  }
}

export const examRepository = new ExamRepository();
