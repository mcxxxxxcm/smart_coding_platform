import { lessonCommentRepository } from '../repositories/lesson-comment.repository';
import { DeepSeekService } from './deepseek.service';
import { AppError } from '../middleware/error.middleware';

const deepseekService = new DeepSeekService();

export class LessonCommentService {
  async getComments(lessonId: number, userId?: number, page?: number, limit?: number) {
    return lessonCommentRepository.findByLessonId(lessonId, userId, page, limit);
  }

  async createComment(lessonId: number, userId: number, content: string, parentId?: number | null) {
    const isAiMention = content.includes('@AI助手') || content.includes('@AI');
    const commentId = await lessonCommentRepository.create(lessonId, userId, content, parentId, false);

    if (isAiMention) {
      this.generateAiReply(lessonId, content, commentId).catch(err => {
        console.error('AI回复生成失败:', err);
      });
    }

    return { id: commentId };
  }

  private async generateAiReply(lessonId: number, originalContent: string, parentCommentId: number) {
    const question = originalContent.replace(/@AI助手?/g, '').trim();
    if (!question) return;

    const context = '你是一个智能编程教学助手，专门为学习编程的学生解答课程相关问题。请用中文回答，回答要简洁明了、通俗易懂。如果涉及代码，请给出示例。';

    const reply = await deepseekService.chat(question, context);

    const aiSystemUserId = 1;
    await lessonCommentRepository.create(lessonId, aiSystemUserId, reply, parentCommentId, true);
  }

  async deleteComment(commentId: number, userId: number, userRole: string) {
    const comment = await lessonCommentRepository.findById(commentId);
    if (!comment) throw new AppError('评论不存在', 404);

    if (comment.user_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
      throw new AppError('无权删除此评论', 403);
    }

    await lessonCommentRepository.delete(commentId);
  }

  async likeComment(commentId: number, userId: number) {
    const comment = await lessonCommentRepository.findById(commentId);
    if (!comment) throw new AppError('评论不存在', 404);
    return lessonCommentRepository.toggleLike(commentId, userId);
  }

  async getTeacherAnalytics(teacherId: number) {
    const [topCommentedLessons, lowPassRateProblems, studentActivity, recentComments] = await Promise.all([
      lessonCommentRepository.getTopCommentedLessons(teacherId, 10),
      lessonCommentRepository.getLowPassRateProblems(teacherId, 10),
      lessonCommentRepository.getStudentActivityOverview(teacherId),
      lessonCommentRepository.getRecentComments(teacherId, 20)
    ]);

    return {
      topCommentedLessons,
      lowPassRateProblems,
      studentActivity,
      recentComments
    };
  }

  async getAiInsight(teacherId: number) {
    const analytics = await this.getTeacherAnalytics(teacherId);

    const summary = this.buildAnalyticsSummary(analytics);
    const insight = await deepseekService.chat(
      summary,
      '你是一位经验丰富的教育数据分析师，请根据以下教学数据给出简洁的智能分析建议，用中文回答，分点列出关键发现和建议。'
    );

    return { insight, analytics };
  }

  private buildAnalyticsSummary(analytics: any): string {
    let summary = '以下是教学平台的数据：\n\n';

    if (analytics.topCommentedLessons?.length > 0) {
      summary += '评论最多的课时：\n';
      analytics.topCommentedLessons.forEach((item: any) => {
        summary += `- ${item.lesson_title}（课程：${item.course_title}）有 ${item.comment_count} 条评论\n`;
      });
      summary += '\n';
    }

    if (analytics.lowPassRateProblems?.length > 0) {
      summary += '通过率最低的编程题：\n';
      analytics.lowPassRateProblems.forEach((item: any) => {
        summary += `- ${item.title}（难度：${item.difficulty}）通过率 ${item.pass_rate}%，共 ${item.total_submissions} 次提交\n`;
      });
      summary += '\n';
    }

    if (analytics.studentActivity?.length > 0) {
      summary += '课程学习情况：\n';
      analytics.studentActivity.forEach((item: any) => {
        summary += `- ${item.course_title}：${item.enrolled_students} 名学生，平均进度 ${item.avg_progress || 0}%\n`;
      });
    }

    return summary;
  }
}

export const lessonCommentService = new LessonCommentService();
