import { Request, Response } from 'express';
import { courseService } from '../services/course.service';

export class CourseController {
  async getCourses(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const user = (req as any).user;
    const teacherOnly = req.query.teacherOnly === 'true';
    const userId = user?.id;
    const userRole = user?.role;

    const result = await courseService.listCourses({
      page, limit, category, difficulty, search, status, teacherOnly, userId, userRole
    });

    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
    });
  }

  async getCourseById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const course = await courseService.getCourseById(id, userId);
    res.json({ success: true, data: course });
  }

  async getCourseChapters(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const chapters = await courseService.getCourseChapters(id);
    res.json({ success: true, data: chapters });
  }

  async getLesson(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;
    const userId = (req as any).user.id;
    const lesson = await courseService.getLesson(lessonId, userId);
    res.json({ success: true, data: lesson });
  }

  async enrollCourse(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const result = await courseService.enrollCourse(userId, id);
    res.json({ success: true, message: result.message });
  }

  async updateProgress(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { lessonId, progress } = req.body;
    const result = await courseService.updateProgress(userId, id, lessonId, progress);
    res.json({ success: true, data: result });
  }

  async createCourse(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const courseId = await courseService.createCourse({ ...req.body, teacher_id: userId });
    res.status(201).json({ success: true, message: '课程创建成功', data: { id: courseId } });
  }

  async updateCourse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    await courseService.updateCourse(id, userId, userRole, req.body);
    res.json({ success: true, message: '课程更新成功' });
  }

  async deleteCourse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    await courseService.deleteCourse(id, userId, userRole);
    res.json({ success: true, message: '课程删除成功' });
  }
}
