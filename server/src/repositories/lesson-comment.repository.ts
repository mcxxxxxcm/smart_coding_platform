import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { buildLimitOffset } from './base.repository';

export interface LessonCommentRow extends RowDataPacket {
  id: number;
  lesson_id: number;
  user_id: number;
  content: string;
  parent_id: number | null;
  is_ai_reply: boolean;
  like_count: number;
  created_at: Date;
  author_name?: string;
  author_avatar?: string;
  is_liked?: boolean;
}

export const lessonCommentRepository = {
  async findByLessonId(lessonId: number, userId?: number, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const safeLimit = Math.max(1, Math.min(100, limit));
    const safeOffset = Math.max(0, offset);

    const likeJoin = userId
      ? `LEFT JOIN lesson_comment_likes lcl ON lc.id = lcl.comment_id AND lcl.user_id = ${pool.escape(userId)}`
      : '';
    const likeSelect = userId ? `, lcl.user_id IS NOT NULL AS is_liked` : ', FALSE AS is_liked';

    const [rows] = await pool.query<LessonCommentRow[]>(
      `SELECT lc.*, u.username AS author_name, u.avatar AS author_avatar${likeSelect}
       FROM lesson_comments lc
       JOIN users u ON lc.user_id = u.id
       ${likeJoin}
       WHERE lc.lesson_id = ?
       ORDER BY lc.created_at ASC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [lessonId]
    );

    const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
      'SELECT COUNT(*) AS total FROM lesson_comments WHERE lesson_id = ?',
      [lessonId]
    );

    return {
      data: rows,
      pagination: {
        page,
        limit: safeLimit,
        total: countRows[0]?.total || 0,
        totalPages: Math.ceil((countRows[0]?.total || 0) / safeLimit)
      }
    };
  },

  async findById(id: number, userId?: number): Promise<LessonCommentRow | null> {
    const likeJoin = userId
      ? `LEFT JOIN lesson_comment_likes lcl ON lc.id = lcl.comment_id AND lcl.user_id = ${pool.escape(userId)}`
      : '';
    const likeSelect = userId ? `, lcl.user_id IS NOT NULL AS is_liked` : ', FALSE AS is_liked';

    const [rows] = await pool.query<LessonCommentRow[]>(
      `SELECT lc.*, u.username AS author_name, u.avatar AS author_avatar${likeSelect}
       FROM lesson_comments lc
       JOIN users u ON lc.user_id = u.id
       ${likeJoin}
       WHERE lc.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async create(lessonId: number, userId: number, content: string, parentId?: number | null, isAiReply = false) {
    const [result] = await pool.execute(
      'INSERT INTO lesson_comments (lesson_id, user_id, content, parent_id, is_ai_reply) VALUES (?, ?, ?, ?, ?)',
      [lessonId, userId, content, parentId || null, isAiReply]
    );
    return (result as any).insertId;
  },

  async delete(id: number) {
    await pool.execute('DELETE FROM lesson_comments WHERE id = ?', [id]);
  },

  async toggleLike(commentId: number, userId: number): Promise<{ liked: boolean }> {
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM lesson_comment_likes WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );

    if (existing.length > 0) {
      await pool.execute('DELETE FROM lesson_comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, userId]);
      await pool.execute('UPDATE lesson_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [commentId]);
      return { liked: false };
    } else {
      await pool.execute('INSERT INTO lesson_comment_likes (comment_id, user_id) VALUES (?, ?)', [commentId, userId]);
      await pool.execute('UPDATE lesson_comments SET like_count = like_count + 1 WHERE id = ?', [commentId]);
      return { liked: true };
    }
  },

  async getCommentCountByLesson(lessonId: number): Promise<number> {
    const [rows] = await pool.query<(RowDataPacket & { cnt: number })[]>(
      'SELECT COUNT(*) AS cnt FROM lesson_comments WHERE lesson_id = ?',
      [lessonId]
    );
    return rows[0]?.cnt || 0;
  },

  async getTopCommentedLessons(teacherId: number, limit = 10) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT l.id AS lesson_id, l.title AS lesson_title, c.title AS chapter_title,
              co.title AS course_title, COUNT(lc.id) AS comment_count
       FROM lesson_comments lc
       JOIN lessons l ON lc.lesson_id = l.id
       JOIN chapters c ON l.chapter_id = c.id
       JOIN courses co ON c.course_id = co.id
       WHERE co.teacher_id = ?
       GROUP BY l.id, l.title, c.title, co.title
       ORDER BY comment_count DESC
       LIMIT ${Math.max(1, Math.min(50, limit))}`,
      [teacherId]
    );
    return rows;
  },

  async getLowPassRateProblems(teacherId: number, limit = 10) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.title, p.difficulty,
              COUNT(s.id) AS total_submissions,
              SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) AS accepted_count,
              ROUND(SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) / COUNT(s.id) * 100, 1) AS pass_rate
       FROM problems p
       LEFT JOIN submissions s ON p.id = s.problem_id
       WHERE p.created_by = ?
       GROUP BY p.id, p.title, p.difficulty
       HAVING total_submissions > 0
       ORDER BY pass_rate ASC
       LIMIT ${Math.max(1, Math.min(50, limit))}`,
      [teacherId]
    );
    return rows;
  },

  async getStudentActivityOverview(teacherId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT co.id AS course_id, co.title AS course_title,
              COUNT(DISTINCT ue.user_id) AS enrolled_students,
              COUNT(DISTINCT up.id) AS active_learners,
              ROUND(AVG(up.progress), 1) AS avg_progress
       FROM courses co
       LEFT JOIN user_enrollments ue ON co.id = ue.course_id
       LEFT JOIN user_progress up ON co.id = up.course_id
       WHERE co.teacher_id = ?
       GROUP BY co.id, co.title
       ORDER BY co.id`,
      [teacherId]
    );
    return rows;
  },

  async getRecentComments(teacherId: number, limit = 20) {
    const safeLimit = Math.max(1, Math.min(100, limit));
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT lc.id, lc.content, lc.created_at, lc.is_ai_reply,
              l.title AS lesson_title, u.username AS author_name
       FROM lesson_comments lc
       JOIN lessons l ON lc.lesson_id = l.id
       JOIN chapters c ON l.chapter_id = c.id
       JOIN courses co ON c.course_id = co.id
       JOIN users u ON lc.user_id = u.id
       WHERE co.teacher_id = ?
       ORDER BY lc.created_at DESC
       LIMIT ${safeLimit}`,
      [teacherId]
    );
    return rows;
  }
};
