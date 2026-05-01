import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/error.middleware';

export class UserService {
  async getProfile(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('用户不存在', 404);
    const stats = await userRepository.getStats(userId);
    return { ...user, stats };
  }

  async updateProfile(userId: number, data: { username?: string; bio?: string | null; avatar?: string | null }) {
    await userRepository.updateProfile(userId, data);
    return userRepository.findById(userId);
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    if (!oldPassword || !newPassword) {
      throw new AppError('旧密码和新密码不能为空', 400);
    }
    if (newPassword.length < 6) {
      throw new AppError('新密码长度不能少于6位', 400);
    }

    const currentPassword = await userRepository.getPasswordById(userId);
    if (!currentPassword) throw new AppError('用户不存在', 404);

    const isPasswordValid = await bcrypt.compare(oldPassword, currentPassword);
    if (!isPasswordValid) throw new AppError('旧密码错误', 400);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(userId, hashedPassword);
  }

  async getProgress(userId: number) {
    return userRepository.getProgress(userId);
  }

  async getSubmissions(userId: number, page: number, limit: number) {
    const { submissionRepository } = await import('../repositories/submission.repository');
    return submissionRepository.listByUser(userId, page, limit);
  }

  async getUserById(id: number) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('用户不存在', 404);
    return user;
  }

  async getTeacherStats(teacherId: number) {
    return userRepository.getTeacherStats(teacherId);
  }

  async getEnrolledStudents(teacherId: number, params: { page: number; limit: number; search?: string; level?: string }) {
    return userRepository.getEnrolledStudents(teacherId, params);
  }

  async getTopStudents(teacherId: number, limit: number) {
    return userRepository.getTopStudents(teacherId, limit);
  }

  async listUsers(params: { page: number; limit: number; role?: string; search?: string; level?: string }) {
    return userRepository.list(params);
  }
}

export const userService = new UserService();
