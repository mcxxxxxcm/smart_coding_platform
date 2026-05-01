import { courseRepository } from '../repositories/course.repository';
import { AppError } from '../middleware/error.middleware';

export class CourseService {
  async listCourses(params: {
    page: number; limit: number; category?: string; difficulty?: string;
    search?: string; status?: string; teacherOnly?: boolean; userId?: number; userRole?: string;
  }) {
    return courseRepository.list(params);
  }

  async getCourseById(id: number | string, userId?: number) {
    const course = await courseRepository.findById(id);
    if (!course) throw new AppError('课程不存在', 404);

    const chapters = await courseRepository.getChapters(id);

    const chaptersWithLessons = await Promise.all(
      chapters.map(async (chapter: any) => {
        const lessons = await courseRepository.getLessonsByChapter(chapter.id);
        return { ...chapter, lessons };
      })
    );

    let isEnrolled = false;
    if (userId) {
      const enrollment = await courseRepository.getEnrollment(userId, id);
      isEnrolled = !!enrollment;
    }

    return { ...course, chapters: chaptersWithLessons, isEnrolled };
  }

  async getCourseChapters(courseId: number | string) {
    const chapters = await courseRepository.getChapters(courseId);
    const chaptersWithLessons = await Promise.all(
      chapters.map(async (chapter: any) => {
        const lessons = await courseRepository.getLessonsByChapter(chapter.id);
        return { ...chapter, lessons };
      })
    );
    return chaptersWithLessons;
  }

  async getLesson(lessonId: number | string, userId: number) {
    const lesson = await courseRepository.getLessonById(lessonId);
    if (!lesson) throw new AppError('课时不存在', 404);

    if (!lesson.is_free) {
      const enrollment = await courseRepository.getEnrollment(userId, lesson.chapter_id);
      if (!enrollment) throw new AppError('请先报名该课程', 403);
    }

    return lesson;
  }

  async enrollCourse(userId: number, courseId: number | string) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('课程不存在', 404);

    const existing = await courseRepository.getEnrollment(userId, courseId);
    if (existing) throw new AppError('你已经报名了该课程', 400);

    await courseRepository.createEnrollment(userId, courseId);
    return { message: '报名成功' };
  }

  async updateProgress(userId: number, courseId: number | string, lessonId: number, progress: number) {
    const enrollment = await courseRepository.getEnrollment(userId, courseId);
    if (!enrollment) throw new AppError('你尚未报名该课程', 403);

    const avgProgress = await courseRepository.updateProgress(userId, courseId, lessonId, progress);
    return { progress: avgProgress, completed: avgProgress >= 100 };
  }

  async createCourse(data: {
    title: string; description: string; category: string; difficulty: string;
    teacher_id: number; duration: number; price: number; cover_image: string | null;
  }) {
    if (!data.title || !data.description) {
      throw new AppError('课程标题和描述不能为空', 400);
    }
    return courseRepository.create(data);
  }

  async updateCourse(id: number | string, teacherId: number, userRole: string, data: Record<string, any>) {
    const course = await courseRepository.findById(id);
    if (!course) throw new AppError('课程不存在', 404);

    if (userRole !== 'admin' && course.teacher_id !== teacherId) {
      throw new AppError('无权修改该课程', 403);
    }

    await courseRepository.update(id, data);
  }

  async deleteCourse(id: number | string, teacherId: number, userRole: string) {
    const course = await courseRepository.findById(id);
    if (!course) throw new AppError('课程不存在', 404);

    if (userRole !== 'admin' && course.teacher_id !== teacherId) {
      throw new AppError('无权删除该课程', 403);
    }

    await courseRepository.delete(id);
  }
}

export const courseService = new CourseService();
