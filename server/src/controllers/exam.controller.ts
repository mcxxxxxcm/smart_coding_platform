import { Request, Response } from 'express';
import { examService } from '../services/exam.service';

export class ExamController {
  async getExams(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const user = (req as any).user;
    const teacherOnly = req.query.teacherOnly === 'true';

    const result = await examService.listExams({
      page, limit, search, status,
      teacherOnly, userId: user.id, userRole: user.role
    });

    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
    });
  }

  async getExamById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = (req as any).user;
    const exam = await examService.getExamById(id, user.id, user.role);
    res.json({ success: true, data: exam });
  }

  async submitExam(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { answers } = req.body;
    const result = await examService.submitExam(id, userId, answers);
    res.json({ success: true, message: '考试提交成功', data: result });
  }

  async getExamHistory(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await examService.getExamHistory(userId, page, limit);
    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
    });
  }

  async getWrongQuestions(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const questions = await examService.getWrongQuestions(userId);
    res.json({ success: true, data: questions });
  }

  async getAvailableProblems(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const result = await examService.getAvailableProblems(userId);
    res.json({ success: true, data: result.data });
  }

  async getExamAnalytics(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const teacherId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const analytics = await examService.getExamAnalytics(id, teacherId, userRole);
    res.json({ success: true, data: analytics });
  }

  async getExamSubmissionDetail(req: Request, res: Response): Promise<void> {
    const { attemptId } = req.params;
    const userId = (req as any).user.id;
    const detail = await examService.getExamSubmissionDetail(attemptId, userId);
    res.json({ success: true, data: detail });
  }

  async createExam(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const examId = await examService.createExam({ ...req.body, teacher_id: userId });
    res.status(201).json({ success: true, message: '考试创建成功', data: { id: examId } });
  }

  async updateExam(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { questions, ...examData } = req.body;
    await examService.updateExam(id, userId, userRole, examData, questions);
    res.json({ success: true, message: '考试更新成功' });
  }

  async deleteExam(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    await examService.deleteExam(id, userId, userRole);
    res.json({ success: true, message: '考试删除成功' });
  }
}
