import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.middleware';
import { CourseController } from '../controllers/course.controller';
import { validate } from '../middleware/validate.middleware';
import { bindController } from '../middleware/async.middleware';

const router = Router();
const course = bindController(new CourseController());

router.get('/', optionalAuth, course.getCourses);
router.get('/:id', optionalAuth, course.getCourseById);
router.get('/:id/chapters', optionalAuth, course.getCourseChapters);
router.get('/:id/lessons/:lessonId', authenticate, course.getLesson);
router.post('/:id/enroll', authenticate, course.enrollCourse);
router.put('/:id/progress', authenticate,
  validate([
    body('lessonId').isInt().withMessage('课时ID必须是整数'),
    body('progress').isInt({ min: 0, max: 100 }).withMessage('进度必须是0-100的整数')
  ]),
  course.updateProgress
);
router.post('/', authenticate, authorize('teacher', 'admin'),
  validate([
    body('title').trim().notEmpty().withMessage('课程标题不能为空'),
    body('description').trim().notEmpty().withMessage('课程描述不能为空'),
    body('category').notEmpty().withMessage('课程分类不能为空'),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('无效的难度等级')
  ]),
  course.createCourse
);
router.put('/:id', authenticate, authorize('teacher', 'admin'), course.updateCourse);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), course.deleteCourse);

export default router;
