import { problemRepository } from '../repositories/problem.repository';
import { AppError } from '../middleware/error.middleware';

export class ProblemService {
  async getProblems(params: {
    page: number; limit: number; difficulty?: string; category?: string;
    search?: string; status?: string; teacherOnly?: boolean; userId?: number; userRole?: string;
  }) {
    return problemRepository.list(params);
  }

  async getProblemById(id: number | string, userRole?: string) {
    const onlyPublished = userRole !== 'admin' && userRole !== 'teacher';
    const problem = await problemRepository.findById(id, onlyPublished);
    if (!problem) throw new AppError('题目不存在', 404);
    return problem;
  }

  async createProblem(data: {
    title: string; description: string; difficulty: string; category: string;
    tags: any; input_format: string; output_format: string; examples: any;
    constraints: string; test_cases: any; hints: any; time_limit: number;
    memory_limit: number; template_code: any; created_by: number;
  }) {
    if (!data.title || !data.description) {
      throw new AppError('题目标题和描述不能为空', 400);
    }
    return problemRepository.create(data);
  }

  async updateProblem(id: number | string, userId: number, userRole: string, data: Record<string, any>) {
    const problem = await problemRepository.findById(id, false) as any;
    if (!problem) throw new AppError('题目不存在', 404);

    if (userRole !== 'admin' && problem.created_by !== userId) {
      throw new AppError('无权修改该题目', 403);
    }

    await problemRepository.update(id, data);
  }

  async deleteProblem(id: number | string, userId: number, userRole: string) {
    const problem = await problemRepository.findById(id, false) as any;
    if (!problem) throw new AppError('题目不存在', 404);

    if (userRole !== 'admin' && problem.created_by !== userId) {
      throw new AppError('无权删除该题目', 403);
    }

    await problemRepository.delete(id);
  }
}

export const problemService = new ProblemService();
