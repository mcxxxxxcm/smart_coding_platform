import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { bindController } from '../middleware/async.middleware';

const router = Router();
const auth = bindController(new AuthController());

router.post('/register',
  validate([
    body('username').trim().isLength({ min: 2, max: 50 }).withMessage('用户名长度2-50个字符'),
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').isLength({ min: 6 }).withMessage('密码长度不能少于6位')
  ]),
  auth.register
);

router.post('/login',
  validate([
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').notEmpty().withMessage('密码不能为空')
  ]),
  auth.login
);

router.post('/refresh-token', auth.refreshToken);
router.post('/logout', auth.logout);

export default router;
