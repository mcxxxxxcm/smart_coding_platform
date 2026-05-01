import { problemRepository } from '../repositories/problem.repository';
import { submissionRepository } from '../repositories/submission.repository';
import { CodeExecutor } from './code-executor.service';
import { AppError } from '../middleware/error.middleware';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const codeExecutor = new CodeExecutor();

const DIFFICULTY_EXP_MAP: Record<string, { exp: number; points: number }> = {
  easy: { exp: 10, points: 5 },
  medium: { exp: 25, points: 15 },
  hard: { exp: 50, points: 30 }
};

export class SubmissionService {
  async submit(userId: number, problemId: number, language: string, code: string) {
    if (!problemId || !language || !code) {
      throw new AppError('题目ID、语言和代码不能为空', 400);
    }

    const problem = await problemRepository.findById(problemId, true) as any;
    if (!problem) throw new AppError('题目不存在', 404);

    const testCaseData = await problemRepository.findTestCases(problemId);
    if (!testCaseData) throw new AppError('题目测试用例不存在', 404);

    const { testCases, timeLimit, memoryLimit } = testCaseData;

    const submissionId = await submissionRepository.create({
      user_id: userId,
      problem_id: problemId,
      language,
      code
    });

    this.executeCodeAsync(submissionId, userId, problemId, language, code, testCases, timeLimit, memoryLimit, problem.difficulty || 'easy');

    return { submissionId, status: 'pending' };
  }

  private async executeCodeAsync(
    submissionId: number, userId: number, problemId: number,
    language: string, code: string, testCases: any[],
    timeLimit: number, memoryLimit: number, difficulty: string
  ) {
    try {
      const results = await codeExecutor.execute(language, code, testCases, timeLimit, memoryLimit);

      const allAccepted = results.every(r => r.status === 'accepted');
      const status = allAccepted ? 'accepted' : results[0].status;
      const totalRuntime = results.reduce((sum, r) => sum + r.runtime, 0);
      const maxMemory = Math.max(...results.map(r => r.memory));

      await submissionRepository.updateResult(submissionId, {
        status,
        runtime: totalRuntime,
        memory: maxMemory,
        test_results: JSON.stringify(results)
      });

      await problemRepository.incrementSubmissionCount(problemId);

      if (allAccepted) {
        await problemRepository.incrementAcceptedCount(problemId);
        await this.awardExperience(userId, problemId, difficulty);
      }
    } catch (error) {
      await submissionRepository.updateError(submissionId, (error as Error).message);
      await problemRepository.incrementSubmissionCount(problemId);
    }
  }

  private async awardExperience(userId: number, problemId: number, difficulty: string) {
    const previousAcceptedCount = await submissionRepository.countAcceptedByUserProblem(userId, problemId);

    if (previousAcceptedCount <= 1) {
      const reward = DIFFICULTY_EXP_MAP[difficulty] || DIFFICULTY_EXP_MAP.easy;
      await userRepository.addExperience(userId, reward.exp, reward.points);
    }
  }

  async getSubmission(id: number | string, userId: number) {
    const submission = await submissionRepository.findById(id, userId);
    if (!submission) throw new AppError('提交记录不存在', 404);
    return submission;
  }

  async getUserSubmissions(userId: number, page: number, limit: number) {
    return submissionRepository.listByUser(userId, page, limit);
  }
}

import { userRepository } from '../repositories/user.repository';

export const submissionService = new SubmissionService();
