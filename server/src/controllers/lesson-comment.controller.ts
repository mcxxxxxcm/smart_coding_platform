import { Request, Response } from 'express';
import { lessonCommentService } from '../services/lesson-comment.service';

export class LessonCommentController {
  async getComments(req: Request, res: Response): Promise<void> {
    const lessonId = parseInt(req.params.lessonId);
    const userId = (req as any).user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await lessonCommentService.getComments(lessonId, userId, page, limit);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  }

  async createComment(req: Request, res: Response): Promise<void> {
    const lessonId = parseInt(req.params.lessonId);
    const userId = (req as any).user.id;
    const { content, parent_id } = req.body;

    const result = await lessonCommentService.createComment(lessonId, userId, content, parent_id);
    res.json({ success: true, data: result });
  }

  async deleteComment(req: Request, res: Response): Promise<void> {
    const commentId = parseInt(req.params.id);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    await lessonCommentService.deleteComment(commentId, userId, userRole);
    res.json({ success: true, message: '删除成功' });
  }

  async likeComment(req: Request, res: Response): Promise<void> {
    const commentId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const result = await lessonCommentService.likeComment(commentId, userId);
    res.json({ success: true, data: result });
  }

  async getTeacherAnalytics(req: Request, res: Response): Promise<void> {
    const teacherId = (req as any).user.id;
    const result = await lessonCommentService.getTeacherAnalytics(teacherId);
    res.json({ success: true, data: result });
  }

  async getAiInsight(req: Request, res: Response): Promise<void> {
    const teacherId = (req as any).user.id;
    const result = await lessonCommentService.getAiInsight(teacherId);
    res.json({ success: true, data: result });
  }
}
