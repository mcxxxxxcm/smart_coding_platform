import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { buildLimitOffset } from './base.repository';

export class CourseRepository {
  async list(params: {
    page: number; limit: number; category?: string; difficulty?: string;
    search?: string; status?: string; teacherOnly?: boolean; userId?: number; userRole?: string;
  }) {
    const conditions: string[] = ['1=1'];
    const queryParams: any[] = [];

    if (params.teacherOnly && params.userRole === 'teacher') {
      conditions.push('c.teacher_id = ?'); queryParams.push(params.userId);
    } else if (params.userRole !== 'admin') {
      conditions.push("c.status = 'published'");
    }

    if (params.status && (params.userRole === 'admin' || params.userRole === 'teacher')) {
      conditions.push('c.status = ?'); queryParams.push(params.status);
    }
    if (params.category) { conditions.push('c.category = ?'); queryParams.push(params.category); }
    if (params.difficulty) { conditions.push('c.difficulty = ?'); queryParams.push(params.difficulty); }
    if (params.search) {
      conditions.push('(c.title LIKE ? OR c.description LIKE ?)');
      queryParams.push(`%${params.search}%`, `%${params.search}%`);
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const limitClause = buildLimitOffset(params.page, params.limit);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.title, c.description, c.cover_image, c.category, c.difficulty,
        c.duration, c.price, c.enrollment_count, c.rating, c.status, c.created_at,
        u.username as teacher_name, u.avatar as teacher_avatar
       FROM courses c LEFT JOIN users u ON c.teacher_id = u.id
       ${whereClause} ORDER BY c.created_at DESC ${limitClause}`,
      queryParams
    );

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM courses c ${whereClause}`,
      queryParams
    );

    return { data: rows, total: countRows[0].total };
  }

  async findById(id: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*, u.username as teacher_name, u.avatar as teacher_avatar, u.bio as teacher_bio
       FROM courses c LEFT JOIN users u ON c.teacher_id = u.id WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async getChapters(courseId: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, title, description, `order` FROM chapters WHERE course_id = ? ORDER BY `order` ASC",
      [courseId]
    );
    return rows;
  }

  async getLessonsByChapter(chapterId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, title, duration, `order`, is_free FROM lessons WHERE chapter_id = ? ORDER BY `order` ASC",
      [chapterId]
    );
    return rows;
  }

  async getLessonById(lessonId: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM lessons WHERE id = ?', [lessonId]
    );
    return rows[0] || null;
  }

  async getEnrollment(userId: number, courseId: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    return rows[0] || null;
  }

  async getEnrolledCourseIds(userId: number, courseIds: number[]) {
    if (courseIds.length === 0) return new Set<number>();
    const placeholders = courseIds.map(() => '?').join(',');
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT course_id FROM user_enrollments WHERE user_id = ? AND course_id IN (${placeholders})`,
      [userId, ...courseIds]
    );
    return new Set(rows.map(r => r.course_id));
  }

  async createEnrollment(userId: number, courseId: number | string) {
    await pool.execute(
      'INSERT INTO user_enrollments (user_id, course_id, progress, completed, enrolled_at) VALUES (?, ?, 0, false, NOW())',
      [userId, courseId]
    );
    await pool.execute(
      'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
      [courseId]
    );
  }

  async updateProgress(userId: number, courseId: number | string, lessonId: number, progress: number) {
    await pool.execute(
      `INSERT INTO user_progress (user_id, course_id, lesson_id, progress, completed, last_accessed)
       VALUES (?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE progress = ?, completed = ?, last_accessed = NOW()`,
      [userId, courseId, lessonId, progress, progress >= 100, progress, progress >= 100]
    );

    const [progressRows] = await pool.execute<RowDataPacket[]>(
      'SELECT AVG(progress) as avg_progress FROM user_progress WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    const avgProgress = Math.round(progressRows[0]?.avg_progress || 0);

    await pool.execute(
      'UPDATE user_enrollments SET progress = ?, completed = ? WHERE user_id = ? AND course_id = ?',
      [avgProgress, avgProgress >= 100, userId, courseId]
    );

    return avgProgress;
  }

  async create(data: { title: string; description: string; category: string; difficulty: string; teacher_id: number; duration: number; price: number; cover_image: string | null }) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO courses (title, description, category, difficulty, teacher_id, duration, price, cover_image, status, enrollment_count, rating, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0, 0.00, NOW(), NOW())`,
      [data.title, data.description, data.category, data.difficulty, data.teacher_id, data.duration, data.price, data.cover_image]
    );
    return result.insertId;
  }

  async update(id: number | string, data: Record<string, any>) {
    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) { updates.push(`${key} = ?`); values.push(value); }
    }
    if (updates.length === 0) return;
    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  async delete(id: number | string) {
    await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
  }

  async getTeacherId(id: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT teacher_id FROM courses WHERE id = ?', [id]
    );
    return rows[0]?.teacher_id || null;
  }
}

export const courseRepository = new CourseRepository();
