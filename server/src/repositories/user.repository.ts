import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { buildLimitOffset } from './base.repository';

export class UserRepository {
  async findById(id: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, email, avatar, role, level, experience, points, bio, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async findByEmail(email: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  async findByUsername(username: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  }

  async findByEmailOrUsername(email: string, username: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    return rows;
  }

  async create(data: { username: string; email: string; password: string; role: string }) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (username, email, password, role, level, experience, points, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 0, 0, NOW(), NOW())`,
      [data.username, data.email, data.password, data.role]
    );
    return result.insertId;
  }

  async updateProfile(id: number, data: { username?: string; bio?: string | null; avatar?: string | null }) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.username !== undefined) { updates.push('username = ?'); values.push(data.username); }
    if (data.bio !== undefined) { updates.push('bio = ?'); values.push(data.bio); }
    if (data.avatar !== undefined) { updates.push('avatar = ?'); values.push(data.avatar); }

    if (updates.length === 0) return;

    updates.push('updated_at = NOW()');
    values.push(id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  async updatePassword(id: number, hashedPassword: string) {
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, id]
    );
  }

  async addExperience(id: number, exp: number, pts: number) {
    await pool.execute(
      'UPDATE users SET experience = experience + ?, points = points + ? WHERE id = ?',
      [exp, pts, id]
    );
  }

  async getPasswordById(id: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT password FROM users WHERE id = ?',
      [id]
    );
    return rows[0]?.password || null;
  }

  async getStats(id: number) {
    const [enrollments] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM user_enrollments WHERE user_id = ?',
      [id]
    );
    const [submissions] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
       FROM submissions WHERE user_id = ?`,
      [id]
    );
    return {
      enrolledCourses: enrollments[0]?.count || 0,
      totalSubmissions: submissions[0]?.total || 0,
      acceptedSubmissions: submissions[0]?.accepted || 0
    };
  }

  async getProgress(userId: number) {
    const [courseProgress] = await pool.execute<RowDataPacket[]>(
      `SELECT ue.course_id, c.title as course_title, ue.progress, ue.completed, ue.enrolled_at
       FROM user_enrollments ue JOIN courses c ON ue.course_id = c.id
       WHERE ue.user_id = ? ORDER BY ue.enrolled_at DESC`,
      [userId]
    );
    const [problemStats] = await pool.execute<RowDataPacket[]>(
      `SELECT p.difficulty, COUNT(DISTINCT s.problem_id) as attempted,
              SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) as solved
       FROM submissions s JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = ? GROUP BY p.difficulty`,
      [userId]
    );
    return { courses: courseProgress, problems: problemStats };
  }

  async list(params: { page: number; limit: number; role?: string; search?: string; level?: string }) {
    const conditions: string[] = ['1=1'];
    const queryParams: any[] = [];

    if (params.role) { conditions.push('role = ?'); queryParams.push(params.role); }
    if (params.search) {
      conditions.push('(username LIKE ? OR email LIKE ?)');
      queryParams.push(`%${params.search}%`, `%${params.search}%`);
    }
    if (params.level) { conditions.push('level = ?'); queryParams.push(parseInt(params.level)); }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const limitClause = buildLimitOffset(params.page, params.limit);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, email, avatar, role, level, experience, points, bio, created_at
       FROM users ${whereClause} ORDER BY created_at DESC ${limitClause}`,
      queryParams
    );
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    return { data: rows, total: countRows[0].total };
  }

  async getTeacherCourses(teacherId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM courses WHERE teacher_id = ? AND status = 'published'",
      [teacherId]
    );
    return rows.map(r => r.id);
  }

  async getTeacherStats(teacherId: number) {
    const courseIds = await this.getTeacherCourses(teacherId);
    const activeCourses = courseIds.length;

    if (courseIds.length === 0) {
      return { totalStudents: 0, totalSubmissions: 0, passRate: 0, activeCourses: 0 };
    }

    const placeholders = courseIds.map(() => '?').join(',');
    const [studentResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT user_id) as count FROM user_enrollments WHERE course_id IN (${placeholders})`,
      courseIds
    );
    const studentCount = studentResult[0]?.count || 0;

    const [subResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
       FROM submissions WHERE user_id IN (
         SELECT DISTINCT user_id FROM user_enrollments WHERE course_id IN (${placeholders})
       )`,
      courseIds
    );
    const totalSubmissions = subResult[0]?.total || 0;
    const acceptedSubmissions = subResult[0]?.accepted || 0;
    const passRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

    return { totalStudents: studentCount, totalSubmissions, passRate, activeCourses };
  }

  async getEnrolledStudents(teacherId: number, params: { page: number; limit: number; search?: string; level?: string }) {
    const courseIds = await this.getTeacherCourses(teacherId);
    const courseList = courseIds.length > 0 ? courseIds.map(id => String(id)).join(',') : '';

    const filterParts: string[] = ["u.role = 'student'"];
    const queryParams: any[] = [];
    if (params.search) {
      filterParts.push('(u.username LIKE ? OR u.email LIKE ?)');
      queryParams.push(`%${params.search}%`, `%${params.search}%`);
    }
    if (params.level) { filterParts.push('u.level = ?'); queryParams.push(parseInt(params.level)); }

    const whereStr = filterParts.join(' AND ');
    const limitClause = buildLimitOffset(params.page, params.limit);

    let myEnrolledClause = '0 as my_enrolled_courses';
    if (courseIds.length > 0) {
      myEnrolledClause = `COUNT(DISTINCT CASE WHEN ue_my.course_id IN (${courseList}) THEN ue_my.course_id END) as my_enrolled_courses`;
    }

    const studentQuery = `
      SELECT u.id, u.username, u.email, u.avatar, u.level, u.experience, u.points, u.bio, u.created_at,
        COUNT(DISTINCT ue_all.course_id) as total_enrolled_courses,
        ${myEnrolledClause},
        COUNT(DISTINCT s.id) as total_submissions,
        SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) as accepted_submissions
      FROM users u
      LEFT JOIN user_enrollments ue_all ON u.id = ue_all.user_id
      LEFT JOIN user_enrollments ue_my ON u.id = ue_my.user_id
      LEFT JOIN submissions s ON u.id = s.user_id
      WHERE ${whereStr}
      GROUP BY u.id ORDER BY u.created_at DESC ${limitClause}`;

    const [rows] = await pool.query<RowDataPacket[]>(studentQuery, queryParams);

    const countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM users u WHERE ${whereStr}`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, queryParams);

    return { data: rows, total: countRows[0]?.total || 0 };
  }

  async getTopStudents(teacherId: number, limit: number) {
    const courseIds = await this.getTeacherCourses(teacherId);
    let whereClause = 'WHERE u.role = "student"';
    if (courseIds.length > 0) {
      const courseList = courseIds.map(id => String(id)).join(',');
      whereClause += ` AND u.id IN (SELECT DISTINCT user_id FROM user_enrollments WHERE course_id IN (${courseList}))`;
    }

    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.username, u.email, u.level,
        COUNT(DISTINCT s.id) as submission_count,
        SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) as accepted_count
       FROM users u LEFT JOIN submissions s ON u.id = s.user_id
       ${whereClause}
       GROUP BY u.id HAVING submission_count > 0
       ORDER BY submission_count DESC LIMIT ${safeLimit}`
    );

    return rows.map(row => ({
      ...row,
      acceptance_rate: row.submission_count > 0 ? Math.round((row.accepted_count / row.submission_count) * 100) : 0
    }));
  }

  async deleteById(id: number) {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  }

  async updateRole(id: number, role: string) {
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  }

  async getTeacherDashboard(teacherId: number) {
    const [courseRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, title, status, (SELECT COUNT(*) FROM user_enrollments WHERE course_id = c.id) AS students FROM courses c WHERE c.teacher_id = ? ORDER BY c.created_at DESC",
      [teacherId]
    );
    const totalCourses = courseRows.length;
    const publishedCourses = courseRows.filter((r: RowDataPacket) => r.status === 'published').length;

    const courseIds = courseRows.map((r: RowDataPacket) => r.id);
    let totalStudents = 0;
    let totalProblems = 0;
    let avgRating = 0;

    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      const [studentResult] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT user_id) as count FROM user_enrollments WHERE course_id IN (${placeholders})`,
        courseIds
      );
      totalStudents = studentResult[0]?.count || 0;

      const [problemResult] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM problems WHERE created_by = ?`,
        [teacherId]
      );
      totalProblems = problemResult[0]?.count || 0;

      const [ratingResult] = await pool.execute<RowDataPacket[]>(
        `SELECT AVG(rating) as avg_rating FROM courses WHERE teacher_id = ? AND rating > 0`,
        [teacherId]
      );
      avgRating = ratingResult[0]?.avg_rating ? Math.round(ratingResult[0].avg_rating * 10) / 10 : 0;
    }

    const [recentSubmissions] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.status, s.submitted_at, u.username, p.title as problem_title
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       JOIN problems p ON s.problem_id = p.id
       WHERE p.created_by = ?
       ORDER BY s.submitted_at DESC LIMIT 5`,
      [teacherId]
    );

    const recentActivities = recentSubmissions.map((r: RowDataPacket) => ({
      user: r.username,
      action: `提交了 "${r.problem_title}" 的代码`,
      time: r.submitted_at
    }));

    return {
      totalCourses,
      publishedCourses,
      totalStudents,
      totalProblems,
      avgRating,
      courses: courseRows,
      recentActivities
    };
  }

  async getStudentProgress(userId: number) {
    const [courseProgress] = await pool.execute<RowDataPacket[]>(
      `SELECT ue.course_id, c.title as course_title, ue.progress, ue.completed, ue.enrolled_at
       FROM user_enrollments ue JOIN courses c ON ue.course_id = c.id
       WHERE ue.user_id = ? ORDER BY ue.enrolled_at DESC`,
      [userId]
    );
    return courseProgress;
  }

  async countByRole() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );
    const result: Record<string, number> = {};
    rows.forEach(row => { result[row.role] = row.count; });
    return result;
  }
}

export const userRepository = new UserRepository();
