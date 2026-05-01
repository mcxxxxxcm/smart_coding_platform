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
}
