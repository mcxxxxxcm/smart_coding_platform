import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export class UserController {
  async getProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as any).user.id;
    const user = await userService.getProfile(userId);
    res.json({ success: true, data: user });
  }

  async updateProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as any).user.id;
    const { username, bio, avatar } = req.body;
    const user = await userService.updateProfile(userId, { username, bio, avatar });
    res.json({ success: true, message: '个人信息更新成功', data: user });
  }

  async changePassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as any).user.id;
    const { oldPassword, newPassword } = req.body;
    await userService.changePassword(userId, oldPassword, newPassword);
    res.json({ success: true, message: '密码修改成功' });
  }

  async getProgress(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as any).user.id;
    const progress = await userService.getProgress(userId);
    res.json({ success: true, data: progress });
  }

  async getSubmissions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await userService.getSubmissions(userId, page, limit);
    res.json({ success: true, data: result.data, pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  }

  async getUserById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const id = parseInt(req.params.id);
    const user = await userService.getUserById(id);
    res.json({ success: true, data: user });
  }

  async getTeacherStats(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const teacherId = (req as any).user.id;
    const stats = await userService.getTeacherStats(teacherId);
    res.json({ success: true, data: stats });
  }

  async getEnrolledStudents(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const teacherId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const level = req.query.level as string;
    const result = await userService.getEnrolledStudents(teacherId, { page, limit, search, level });
    res.json({ success: true, data: result.data, pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  }

  async getTopStudents(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const teacherId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const students = await userService.getTopStudents(teacherId, limit);
    res.json({ success: true, data: students });
  }

  async getUsers(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const search = req.query.search as string;
    const level = req.query.level as string;
    const result = await userService.listUsers({ page, limit, role, search, level });
    res.json({ success: true, data: result.data, pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  }
}
