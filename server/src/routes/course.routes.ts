import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { CourseController } from '../controllers/course.controller';

const router = Router();
const courseController = new CourseController();

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.get('/:id/chapters', courseController.getCourseChapters);
router.get('/:id/lessons/:lessonId', authenticate, courseController.getLesson);
router.post('/:id/enroll', authenticate, courseController.enrollCourse);
router.put('/:id/progress', authenticate, courseController.updateProgress);
router.post('/', authenticate, authorize('teacher', 'admin'), courseController.createCourse);
router.put('/:id', authenticate, authorize('teacher', 'admin'), courseController.updateCourse);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), courseController.deleteCourse);

export default router;
