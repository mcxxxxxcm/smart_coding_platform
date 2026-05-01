import { Request, Response } from 'express';
import { communityService } from '../services/community.service';

export class CommunityController {
  async getPosts(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const result = await communityService.getPosts({ page, limit, category, search });
    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
    });
  }

  async getPostById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const post = await communityService.getPostById(id);
    res.json({ success: true, data: post });
  }

  async createPost(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { title, content, category, tags } = req.body;
    const result = await communityService.createPost({ title, content, author_id: userId, category, tags });
    res.status(201).json({ success: true, message: '帖子创建成功', data: result });
  }

  async updatePost(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    await communityService.updatePost(id, userId, userRole, req.body);
    res.json({ success: true, message: '帖子更新成功' });
  }

  async deletePost(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    await communityService.deletePost(id, userId, userRole);
    res.json({ success: true, message: '帖子删除成功' });
  }

  async likePost(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const result = await communityService.likePost(id, userId);
    res.json({ success: true, data: result });
  }

  async togglePinPost(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const result = await communityService.togglePinPost(id, userId, userRole);
    res.json({ success: true, data: result });
  }

  async getComments(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await communityService.getComments(postId, page, limit);
    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
    });
  }

  async createComment(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const userId = (req as any).user.id;
    const { content, parent_id } = req.body;
    const result = await communityService.createComment({ post_id: postId, user_id: userId, parent_id: parent_id || null, content });
    res.status(201).json({ success: true, message: '评论创建成功', data: result });
  }

  async deleteComment(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    await communityService.deleteComment(id, userId, userRole);
    res.json({ success: true, message: '评论删除成功' });
  }

  async likeComment(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const result = await communityService.likeComment(id, userId);
    res.json({ success: true, data: result });
  }

  async togglePinComment(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const result = await communityService.togglePinComment(id, userId, userRole);
    res.json({ success: true, data: result });
  }
}
