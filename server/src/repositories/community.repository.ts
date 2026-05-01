import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { buildLimitOffset } from './base.repository';

export class CommunityRepository {
  async listPosts(params: { page: number; limit: number; category?: string; search?: string }) {
    const conditions: string[] = ["p.status = 'published'"];
    const queryParams: any[] = [];

    if (params.category) { conditions.push('p.category = ?'); queryParams.push(params.category); }
    if (params.search) {
      conditions.push('(p.title LIKE ? OR p.content LIKE ?)');
      queryParams.push(`%${params.search}%`, `%${params.search}%`);
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const limitClause = buildLimitOffset(params.page, params.limit);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.title, p.category, p.tags, p.view_count, p.like_count, p.comment_count,
        p.is_pinned, p.created_at, p.updated_at,
        u.id as author_id, u.username as author_name, u.avatar as author_avatar
       FROM posts p LEFT JOIN users u ON p.author_id = u.id
       ${whereClause} ORDER BY p.is_pinned DESC, p.created_at DESC ${limitClause}`,
      queryParams
    );

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM posts p ${whereClause}`, queryParams
    );

    return { data: rows, total: countRows[0].total };
  }

  async findPostById(id: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, u.id as author_id, u.username as author_name, u.avatar as author_avatar, u.level as author_level
       FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    const post = rows[0];
    if (typeof post.tags === 'string') post.tags = JSON.parse(post.tags);
    return post;
  }

  async incrementViewCount(id: number | string) {
    await pool.execute('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [id]);
  }

  async createPost(data: { title: string; content: string; author_id: number; category: string; tags: any }) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO posts (title, content, author_id, category, tags, view_count, like_count, comment_count, is_pinned, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0, false, 'published', NOW(), NOW())`,
      [data.title, data.content, data.author_id, data.category, JSON.stringify(data.tags || [])]
    );
    return result.insertId;
  }

  async updatePost(id: number | string, data: Record<string, any>) {
    const updates: string[] = [];
    const values: any[] = [];
    const jsonFields = ['tags'];

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

    await pool.execute(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  async deletePost(id: number | string) {
    await pool.execute('DELETE FROM comments WHERE post_id = ?', [id]);
    await pool.execute('DELETE FROM posts WHERE id = ?', [id]);
  }

  async getPostAuthorId(id: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT author_id FROM posts WHERE id = ?', [id]
    );
    return rows[0]?.author_id || null;
  }

  async togglePostLike(postId: number | string, userId: number): Promise<boolean> {
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    if (existing.length > 0) {
      await pool.execute('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
      await pool.execute('UPDATE posts SET like_count = like_count - 1 WHERE id = ?', [postId]);
      return false;
    } else {
      await pool.execute('INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())', [postId, userId]);
      await pool.execute('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [postId]);
      return true;
    }
  }

  async getComments(postId: number | string, page: number, limit: number) {
    const limitClause = buildLimitOffset(page, limit);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.content, c.parent_id, c.like_count, c.is_pinned, c.created_at,
        u.id as author_id, u.username as author_name, u.avatar as author_avatar, u.level as author_level
       FROM comments c LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? ORDER BY c.is_pinned DESC, c.created_at ASC ${limitClause}`,
      [postId]
    );
    const [countRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM comments WHERE post_id = ?', [postId]
    );
    return { data: rows, total: countRows[0].total };
  }

  async createComment(data: { post_id: number | string; user_id: number; parent_id: number | null; content: string }) {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO comments (post_id, user_id, parent_id, content, like_count, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
      [data.post_id, data.user_id, data.parent_id, data.content]
    );
    await pool.execute('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [data.post_id]);
    return result.insertId;
  }

  async deleteComment(commentId: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id, post_id FROM comments WHERE id = ?', [commentId]
    );
    if (rows.length === 0) return null;
    const { user_id, post_id } = rows[0];
    await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]);
    await pool.execute('UPDATE posts SET comment_count = comment_count - 1 WHERE id = ?', [post_id]);
    return { userId: user_id, postId: post_id };
  }

  async toggleCommentLike(commentId: number | string, userId: number): Promise<boolean> {
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );

    if (existing.length > 0) {
      await pool.execute('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, userId]);
      await pool.execute('UPDATE comments SET like_count = like_count - 1 WHERE id = ?', [commentId]);
      return false;
    } else {
      await pool.execute('INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, NOW())', [commentId, userId]);
      await pool.execute('UPDATE comments SET like_count = like_count + 1 WHERE id = ?', [commentId]);
      return true;
    }
  }

  async togglePinPost(postId: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT is_pinned FROM posts WHERE id = ?', [postId]
    );
    if (rows.length === 0) return null;
    const newPinned = !rows[0].is_pinned;
    await pool.execute('UPDATE posts SET is_pinned = ? WHERE id = ?', [newPinned, postId]);
    return newPinned;
  }

  async togglePinComment(commentId: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT is_pinned FROM comments WHERE id = ?', [commentId]
    );
    if (rows.length === 0) return null;
    const newPinned = !rows[0].is_pinned;
    await pool.execute('UPDATE comments SET is_pinned = ? WHERE id = ?', [newPinned, commentId]);
    return newPinned;
  }
}

export const communityRepository = new CommunityRepository();
