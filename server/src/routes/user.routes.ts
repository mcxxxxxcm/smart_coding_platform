import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import { bindController } from '../middleware/async.middleware';

const router = Router();
const user = bindController(new UserController());

router.get('/stats/teacher', authenticate, authorize('teacher'), user.getTeacherStats);
router.get('/enrolled-students', authenticate, authorize('teacher'), user.getEnrolledStudents);
router.get('/top-students', authenticate, authorize('teacher'), user.getTopStudents);
router.get('/', authenticate, authorize('teacher', 'admin'), user.getUsers);

router.get('/profile', authenticate, user.getProfile);
router.put('/profile', authenticate,
  validate([
    body('username').optional().trim().isLength({ min: 2, max: 50 }).withMessage('用户名长度2-50个字符'),
    body('bio').optional().isLength({ max: 500 }).withMessage('个人简介最多500字')
  ]),
  user.updateProfile
);
router.put('/password', authenticate,
  validate([
    body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码长度不能少于6位')
  ]),
  user.changePassword
);
router.get('/progress', authenticate, user.getProgress);
router.get('/submissions', authenticate, user.getSubmissions);
router.get('/:id', user.getUserById);

export default router;
