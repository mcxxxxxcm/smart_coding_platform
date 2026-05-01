import { Request, Response } from 'express';
import { submissionService } from '../services/submission.service';

export class SubmissionController {
  async submit(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { problem_id, language, code } = req.body;
    const result = await submissionService.submit(userId, problem_id, language, code);
    res.status(201).json({ success: true, message: '代码提交成功', data: result });
  }

  async getSubmission(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const submission = await submissionService.getSubmission(id, userId);
    res.json({ success: true, data: submission });
  }

  async getUserSubmissions(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await submissionService.getUserSubmissions(userId, page, limit);
    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
    });
  }
}
