import { Request, Response } from 'express';
import { problemService } from '../services/problem.service';

export class ProblemController {
  async getProblems(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const difficulty = req.query.difficulty as string;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const user = (req as any).user;
    const teacherOnly = req.query.teacherOnly === 'true';
    const userId = user?.id;
    const userRole = user?.role;

    const result = await problemService.getProblems({
      page, limit, difficulty, category, search, status, teacherOnly, userId, userRole
    });

    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
    });
  }

  async getProblemById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = (req as any).user;
    const problem = await problemService.getProblemById(id, user?.role);
    res.json({ success: true, data: problem });
  }

  async createProblem(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const problemId = await problemService.createProblem({ ...req.body, created_by: userId });
    res.status(201).json({ success: true, message: '题目创建成功', data: { id: problemId } });
  }

  async updateProblem(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    await problemService.updateProblem(id, userId, userRole, req.body);
    res.json({ success: true, message: '题目更新成功' });
  }

  async deleteProblem(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    await problemService.deleteProblem(id, userId, userRole);
    res.json({ success: true, message: '题目删除成功' });
  }
}
