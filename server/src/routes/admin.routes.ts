import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AdminController } from '../controllers/admin.controller';
import { validate } from '../middleware/validate.middleware';
import { bindController } from '../middleware/async.middleware';

const router = Router();
const admin = bindController(new AdminController());

router.use(authenticate, authorize('admin'));

router.get('/stats', admin.getSystemStats);
router.get('/roles', admin.getRoles);

router.get('/users', admin.getUsers);
router.put('/users/:id',
  validate([
    body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('无效的角色')
  ]),
  admin.updateUser
);
router.delete('/users/:id', admin.deleteUser);

router.get('/courses', admin.getCoursesForReview);
router.put('/courses/:id/review',
  validate([
    body('status').isIn(['approved', 'rejected', 'published', 'archived']).withMessage('无效的审核状态')
  ]),
  admin.reviewCourse
);

router.get('/problems', admin.getProblemsForReview);
router.put('/problems/:id/review',
  validate([
    body('status').isIn(['published', 'archived']).withMessage('无效的审核状态')
  ]),
  admin.reviewProblem
);

router.get('/community', admin.getPostsForReview);
router.put('/community/:id',
  validate([
    body('status').isIn(['published', 'hidden']).withMessage('无效的审核状态')
  ]),
  admin.moderatePost
);

router.get('/settings', admin.getSettings);
router.put('/settings', admin.updateSettings);

router.get('/security', admin.getSecuritySettings);
router.put('/security', admin.updateSecuritySettings);

router.get('/logs', admin.getOperationLogs);

router.get('/database', admin.getDatabaseStats);
router.post('/database/optimize', admin.optimizeDatabase);

export default router;
