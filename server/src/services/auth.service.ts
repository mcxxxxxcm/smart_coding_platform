import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/error.middleware';

export class AuthService {
  async register(username: string, email: string, password: string, role?: string) {
    if (!username || !email || !password) {
      throw new AppError('用户名、邮箱和密码不能为空', 400);
    }

    if (password.length < 6) {
      throw new AppError('密码长度不能少于6位', 400);
    }

    const allowedRoles = ['student'];
    const userRole = role && allowedRoles.includes(role) ? role : 'student';

    const existing = await userRepository.findByEmailOrUsername(email, username);
    if (existing.length > 0) {
      throw new AppError('用户名或邮箱已存在', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await userRepository.create({
      username,
      email,
      password: hashedPassword,
      role: userRole
    });

    const token = this.generateToken(userId, userRole);
    const user = await userRepository.findById(userId);

    return { token, user };
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new AppError('邮箱和密码不能为空', 400);
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('邮箱或密码错误', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('邮箱或密码错误', 401);
    }

    const token = this.generateToken(user.id, user.role);
    const { password: _, ...userWithoutPassword } = user;

    return { token, user: userWithoutPassword };
  }

  async refreshToken(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const token = this.generateToken(user.id, user.role);
    return { token };
  }

  private generateToken(userId: number, role: string): string {
    return jwt.sign(
      { id: userId, role },
      config.jwt.secret as string,
      { expiresIn: config.jwt.expiresIn as any }
    );
  }
}

export const authService = new AuthService();
