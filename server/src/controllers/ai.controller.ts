import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';

export class AIController {
  async chat(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { message, problemId, code } = req.body;
    const result = await aiService.chat(userId, message, problemId, code);
    res.json({ success: true, data: result });
  }

  async explainCode(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { code, language } = req.body;
    const result = await aiService.explainCode(userId, code, language || 'python');
    res.json({ success: true, data: result });
  }

  async debugCode(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { code, language, errorMessage } = req.body;
    const result = await aiService.debugCode(userId, code, language || 'python', errorMessage);
    res.json({ success: true, data: result });
  }

  async optimizeCode(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { code, language } = req.body;
    const result = await aiService.optimizeCode(userId, code, language || 'python');
    res.json({ success: true, data: result });
  }

  async getHint(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { problemId } = req.body;
    const result = await aiService.getHint(userId, problemId);
    res.json({ success: true, data: result });
  }

  async getLearningPath(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const result = await aiService.getLearningPath(userId);
    res.json({ success: true, data: result.data });
  }

  async analyzeWrongAnswers(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const result = await aiService.analyzeWrongAnswers(userId);
    res.json({ success: true, data: result.data });
  }

  async generateProblem(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { category, difficulty, language, topic } = req.body;
    const result = await aiService.generateProblem(userId, { category, difficulty, language, topic });
    res.json({ success: true, data: result.data });
  }

  async smartSearch(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { query } = req.body;
    if (!query) { res.json({ success: false, message: '搜索内容不能为空' }); return; }
    const result = await aiService.smartSearch(userId, query);
    res.json({ success: true, data: result.data });
  }

  async moderateContent(req: Request, res: Response): Promise<void> {
    const { content, type } = req.body;
    if (!content) { res.json({ success: false, message: '内容不能为空' }); return; }
    const result = await aiService.moderateContent(content, type || '帖子');
    res.json({ success: true, data: result.data });
  }

  async getOperationsAnalytics(req: Request, res: Response): Promise<void> {
    const result = await aiService.getOperationsAnalytics();
    res.json({ success: true, data: result.data });
  }

  async checkProblemQuality(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await aiService.checkProblemQuality(parseInt(id));
    res.json({ success: true, data: result.data });
  }

  async batchCheckProblemQuality(_req: Request, res: Response): Promise<void> {
    const result = await aiService.batchCheckProblemQuality();
    res.json({ success: true, data: result.data });
  }

  async getStudentDashboard(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const result = await aiService.getStudentDashboard(userId);
    res.json({ success: true, data: result.data });
  }
}
