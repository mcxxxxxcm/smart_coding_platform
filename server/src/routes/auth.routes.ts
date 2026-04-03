import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/register', (req, res) => {
  console.log('收到注册请求:', req.body);
  authController.register(req, res);
});

router.post('/login', (req, res) => {
  console.log('收到登录请求:', req.body);
  authController.login(req, res);
});

router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
