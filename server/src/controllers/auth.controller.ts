import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async register(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { username, email, password } = req.body;
    const result = await authService.register(username, email, password);
    res.status(201).json({ success: true, message: '注册成功', data: result });
  }

  async login(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, message: '登录成功', data: result });
  }

  async refreshToken(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as any).user.id;
    const result = await authService.refreshToken(userId);
    res.json({ success: true, message: 'Token刷新成功', data: result });
  }

  async logout(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.json({ success: true, message: '登出成功' });
  }
}
