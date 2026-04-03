import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedQuery } from '../types/express';
import { AppError } from '../middleware/error.middleware';

export class CommunityController {
  async getPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '10', category, search } = req.query as PaginatedQuery & {
        category?: string;
        search?: string;
      };
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let whereClause = "WHERE status = 'published'";
      const params: (string | number)[] = [];
      
      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }
      
      if (search) {
        whereClause += ' AND (title LIKE ? OR content LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      const [rows] = await pool.execute(
        `SELECT 
          p.id, p.title, p.category, p.tags, p.view_count, p.like_count, p.comment_count,
          p.is_pinned, p.created_at, p.updated_at,
          u.id as author_id, u.username as author_name, u.avatar as author_avatar
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         ${whereClause}
         ORDER BY p.is_pinned DESC, p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );
      
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM posts ${whereClause}`,
        params
      );
      
      const countData = countRows as { total: number }[];
      
      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countData[0].total,
          totalPages: Math.ceil(countData[0].total / parseInt(limit))
        }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '获取帖子列表失败'
      } as ApiResponse);
    }
  }

  async getPostById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = req.params.id;
      
      await pool.execute(
        'UPDATE posts SET view_count = view_count + 1 WHERE id = ?',
        [postId]
      );
      
      const [rows] = await pool.execute(
        `SELECT 
          p.*,
          u.id as author_id, u.username as author_name, u.avatar as author_avatar, u.level as author_level
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         WHERE p.id = ?`,
        [postId]
      );
      
      const posts = rows as Record<string, unknown>[];
      
      if (posts.length === 0) {
        throw new AppError('帖子不存在', 404);
      }
      
      const post = posts[0];
      
      if (typeof post.tags === 'string') {
        post.tags = JSON.parse(post.tags);
      }
      
      res.json({
        success: true,
        data: post
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

  async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, content, category, tags } = req.body;
      const authorId = req.user!.id;
      
      const [result] = await pool.execute(
        `INSERT INTO posts 
         (title, content, author_id, category, tags, view_count, like_count, comment_count, is_pinned, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 0, 0, false, 'published', NOW(), NOW())`,
        [title, content, authorId, category, JSON.stringify(tags || [])]
      );
      
      const insertResult = result as { insertId: number };
      
      await pool.execute(
        'UPDATE users SET points = points + 5 WHERE id = ?',
        [authorId]
      );
      
      res.status(201).json({
        success: true,
        message: '帖子发布成功',
        data: { id: insertResult.insertId }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '发布帖子失败'
      } as ApiResponse);
    }
  }

  async updatePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = req.params.id;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const [posts] = await pool.execute(
        'SELECT author_id FROM posts WHERE id = ?',
        [postId]
      );
      
      const postList = posts as { author_id: number }[];
      
      if (postList.length === 0) {
        throw new AppError('帖子不存在', 404);
      }
      
      if (userRole !== 'admin' && postList[0].author_id !== userId) {
        throw new AppError('没有权限修改此帖子', 403);
      }
      
      const { title, content, category, tags, status } = req.body;
      
      const updates: string[] = [];
      const values: (string | number)[] = [];
      
      if (title) { updates.push('title = ?'); values.push(title); }
      if (content) { updates.push('content = ?'); values.push(content); }
      if (category) { updates.push('category = ?'); values.push(category); }
      if (tags) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
      if (status) { updates.push('status = ?'); values.push(status); }
      
      if (updates.length === 0) {
        throw new AppError('没有提供要更新的内容', 400);
      }
      
      updates.push('updated_at = NOW()');
      values.push(postId);
      
      await pool.execute(
        `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      res.json({
        success: true,
        message: '帖子更新成功'
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

  async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = req.params.id;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const [posts] = await pool.execute(
        'SELECT author_id FROM posts WHERE id = ?',
        [postId]
      );
      
      const postList = posts as { author_id: number }[];
      
      if (postList.length === 0) {
        throw new AppError('帖子不存在', 404);
      }
      
      if (userRole !== 'admin' && postList[0].author_id !== userId) {
        throw new AppError('没有权限删除此帖子', 403);
      }
      
      await pool.execute('DELETE FROM comments WHERE post_id = ?', [postId]);
      await pool.execute('DELETE FROM posts WHERE id = ?', [postId]);
      
      res.json({
        success: true,
        message: '帖子删除成功'
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

  async likePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = req.params.id;
      const userId = req.user!.id;
      
      const [existing] = await pool.execute(
        'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
        [postId, userId]
      );
      
      if ((existing as unknown[]).length > 0) {
        await pool.execute(
          'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
          [postId, userId]
        );
        await pool.execute(
          'UPDATE posts SET like_count = like_count - 1 WHERE id = ?',
          [postId]
        );
        
        res.json({
          success: true,
          message: '取消点赞',
          data: { liked: false }
        } as ApiResponse);
      } else {
        await pool.execute(
          'INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())',
          [postId, userId]
        );
        await pool.execute(
          'UPDATE posts SET like_count = like_count + 1 WHERE id = ?',
          [postId]
        );
        
        res.json({
          success: true,
          message: '点赞成功',
          data: { liked: true }
        } as ApiResponse);
      }
    } catch {
      res.status(500).json({
        success: false,
        message: '操作失败'
      } as ApiResponse);
    }
  }

  async getComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = req.params.postId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      const [rows] = await pool.execute(
        `SELECT 
          c.id, c.content, c.parent_id, c.like_count, c.created_at,
          u.id as author_id, u.username as author_name, u.avatar as author_avatar, u.level as author_level
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC
         LIMIT ? OFFSET ?`,
        [postId, limit, offset]
      );
      
      res.json({
        success: true,
        data: rows
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '获取评论失败'
      } as ApiResponse);
    }
  }

  async createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = req.params.postId;
      const { content, parent_id } = req.body;
      const userId = req.user!.id;
      
      const [result] = await pool.execute(
        `INSERT INTO comments 
         (post_id, user_id, parent_id, content, like_count, created_at)
         VALUES (?, ?, ?, ?, 0, NOW())`,
        [postId, userId, parent_id || null, content]
      );
      
      const insertResult = result as { insertId: number };
      
      await pool.execute(
        'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?',
        [postId]
      );
      
      await pool.execute(
        'UPDATE users SET points = points + 2 WHERE id = ?',
        [userId]
      );
      
      res.status(201).json({
        success: true,
        message: '评论发布成功',
        data: { id: insertResult.insertId }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '发布评论失败'
      } as ApiResponse);
    }
  }

  async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const commentId = req.params.id;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const [comments] = await pool.execute(
        'SELECT user_id, post_id FROM comments WHERE id = ?',
        [commentId]
      );
      
      const commentList = comments as { user_id: number; post_id: number }[];
      
      if (commentList.length === 0) {
        throw new AppError('评论不存在', 404);
      }
      
      if (userRole !== 'admin' && commentList[0].user_id !== userId) {
        throw new AppError('没有权限删除此评论', 403);
      }
      
      await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]);
      await pool.execute(
        'UPDATE posts SET comment_count = comment_count - 1 WHERE id = ?',
        [commentList[0].post_id]
      );
      
      res.json({
        success: true,
        message: '评论删除成功'
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

  async likeComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const commentId = req.params.id;
      const userId = req.user!.id;
      
      const [existing] = await pool.execute(
        'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [commentId, userId]
      );
      
      if ((existing as unknown[]).length > 0) {
        await pool.execute(
          'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
          [commentId, userId]
        );
        await pool.execute(
          'UPDATE comments SET like_count = like_count - 1 WHERE id = ?',
          [commentId]
        );
        
        res.json({
          success: true,
          message: '取消点赞',
          data: { liked: false }
        } as ApiResponse);
      } else {
        await pool.execute(
          'INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, NOW())',
          [commentId, userId]
        );
        await pool.execute(
          'UPDATE comments SET like_count = like_count + 1 WHERE id = ?',
          [commentId]
        );
        
        res.json({
          success: true,
          message: '点赞成功',
          data: { liked: true }
        } as ApiResponse);
      }
    } catch {
      res.status(500).json({
        success: false,
        message: '操作失败'
      } as ApiResponse);
    }
  }
}
