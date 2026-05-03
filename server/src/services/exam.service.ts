import { examRepository } from '../repositories/exam.repository';
import { problemRepository } from '../repositories/problem.repository';
import { CodeExecutor } from './code-executor.service';
import { AppError } from '../middleware/error.middleware';

const codeExecutor = new CodeExecutor();

export class ExamService {
  async listExams(params: {
    page: number; limit: number; search?: string; status?: string;
    teacherOnly?: boolean; userId?: number; userRole?: string;
  }) {
    return examRepository.list(params);
  }

  async getExamById(id: number | string, userId: number, userRole: string) {
    const exam = await examRepository.findById(id);
    if (!exam) throw new AppError('考试不存在', 404);

    const questions = await examRepository.getQuestions(id);

    if (userRole === 'student') {
      const hasSubmitted = await examRepository.hasSubmitted(id, userId);
      const attempt = await examRepository.findAttempt(id, userId);

      return {
        ...exam,
        questions: questions.map(q => ({
          problem_id: q.problem_id,
          title: q.title,
          difficulty: q.difficulty,
          category: q.category,
          score: q.score
        })),
        hasSubmitted,
        attemptId: attempt?.id || null
      };
    }

    return { ...exam, questions };
  }

  async submitExam(examId: number | string, userId: number, answers: { problem_id: number; language: string; code: string }[]) {
    const exam = await examRepository.findById(examId);
    if (!exam) throw new AppError('考试不存在', 404);

    if (exam.start_time && new Date() < new Date(exam.start_time)) {
      throw new AppError('考试尚未开始', 400);
    }
    if (exam.end_time && new Date() > new Date(exam.end_time)) {
      throw new AppError('考试已结束', 400);
    }

    const hasSubmitted = await examRepository.hasSubmitted(examId, userId);
    if (hasSubmitted) {
      throw new AppError('你已经提交过该考试', 400);
    }

    const questionScores = await examRepository.getQuestionScores(examId);

    let attemptId: number;
    const existingAttempt = await examRepository.findAttempt(examId, userId);
    if (existingAttempt) {
      attemptId = existingAttempt.id;
    } else {
      attemptId = await examRepository.createAttempt(examId, userId);
    }

    let totalScore = 0;

    for (const answer of answers) {
      const maxScore = questionScores.get(answer.problem_id) || 0;
      if (maxScore === 0) continue;

      const testCaseData = await problemRepository.findTestCases(answer.problem_id);
      let score = 0;
      let status = 'not_submitted';

      if (testCaseData && testCaseData.testCases.length > 0) {
        try {
          const results = await codeExecutor.execute(
            answer.language, answer.code,
            testCaseData.testCases, testCaseData.timeLimit, testCaseData.memoryLimit
          );

          const acceptedCount = results.filter(r => r.status === 'accepted').length;
          const passRate = acceptedCount / results.length;

          score = Math.round(maxScore * passRate);
          status = passRate === 1 ? 'accepted' : passRate >= 0.5 ? 'partial_correct' : 'wrong_answer';
        } catch {
          score = 0;
          status = 'runtime_error';
        }
      } else {
        score = 0;
        status = 'not_graded';
      }

      totalScore += score;

      const existingSub = await examRepository.findSubmission(examId, userId, answer.problem_id);
      if (existingSub) {
        await examRepository.updateSubmission(existingSub.id, {
          language: answer.language,
          code: answer.code,
          score,
          status
        });
      } else {
        await examRepository.createSubmission({
          exam_id: Number(examId),
          user_id: userId,
          problem_id: answer.problem_id,
          language: answer.language,
          code: answer.code,
          score,
          status
        });
      }
    }

    await examRepository.updateAttempt(attemptId, totalScore);

    return {
      totalScore,
      examTotalScore: exam.total_score,
      passed: totalScore >= exam.passing_score
    };
  }

  async getExamHistory(userId: number, page: number, limit: number) {
    return examRepository.getHistory(userId, page, limit);
  }

  async getWrongQuestions(userId: number) {
    return examRepository.getWrongQuestions(userId);
  }

  async getAvailableProblems(userId: number) {
    return problemRepository.list({
      page: 1,
      limit: 100,
      teacherOnly: true,
      userId,
      userRole: 'teacher'
    });
  }

  async getExamAnalytics(examId: number | string, teacherId: number, userRole: string) {
    const exam = await examRepository.findById(examId);
    if (!exam) throw new AppError('考试不存在', 404);

    if (userRole !== 'admin' && exam.teacher_id !== teacherId) {
      throw new AppError('无权查看该考试分析', 403);
    }

    return examRepository.getAnalytics(examId);
  }

  async getExamSubmissionDetail(attemptId: number | string, userId: number) {
    const attempt = await examRepository.getSubmissionDetail(attemptId, userId);
    if (!attempt) throw new AppError('考试记录不存在', 404);

    const submissions = await examRepository.getExamSubmissions(attempt.exam_id, userId);

    return {
      attempt,
      submissions: submissions.map(sub => ({
        ...sub,
        description: sub.description || ''
      }))
    };
  }

  async createExam(data: {
    title: string; description: string; teacher_id: number; duration: number;
    total_score: number; passing_score: number; start_time: string | null;
    end_time: string | null; allow_review: boolean; random_order: boolean;
    questions: { problem_id: number; score: number; order: number }[];
  }) {
    if (!data.title) {
      throw new AppError('考试标题不能为空', 400);
    }

    const examId = await examRepository.create(data);

    if (data.questions && data.questions.length > 0) {
      await examRepository.addQuestions(examId, data.questions);
    }

    return examId;
  }

  async updateExam(
    examId: number | string, teacherId: number, userRole: string,
    data: Record<string, any>,
    questions?: { problem_id: number; score: number; order: number }[]
  ) {
    const exam = await examRepository.findById(examId);
    if (!exam) throw new AppError('考试不存在', 404);

    if (userRole !== 'admin' && exam.teacher_id !== teacherId) {
      throw new AppError('无权修改该考试', 403);
    }

    await examRepository.updateExam(examId, data, questions);
  }

  async deleteExam(examId: number | string, teacherId: number, userRole: string) {
    const exam = await examRepository.findById(examId);
    if (!exam) throw new AppError('考试不存在', 404);

    if (userRole !== 'admin' && exam.teacher_id !== teacherId) {
      throw new AppError('无权删除该考试', 403);
    }

    await examRepository.delete(examId);
  }
}

export const examService = new ExamService();
