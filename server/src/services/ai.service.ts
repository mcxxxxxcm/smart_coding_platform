import { DeepSeekService } from './deepseek.service';
import { problemRepository } from '../repositories/problem.repository';
import { AppError } from '../middleware/error.middleware';

const deepseekService = new DeepSeekService();

export class AiService {
  async chat(userId: number, message: string, problemId?: number, code?: string) {
    if (!message) throw new AppError('消息不能为空', 400);

    let context = '';
    if (problemId) {
      const problem = await problemRepository.findById(problemId, true) as any;
      if (problem) {
        context = `当前题目：${problem.title}\n难度：${problem.difficulty}\n描述：${problem.description}`;
      }
    }
    if (code) {
      context += `\n\n用户当前代码：\n\`\`\`\n${code}\n\`\`\``;
    }

    const reply = await deepseekService.chat(message, context);
    return { reply };
  }

  async explainCode(userId: number, code: string, language: string) {
    if (!code) throw new AppError('代码不能为空', 400);

    const reply = await deepseekService.chat(
      `请解释以下${language}代码的作用和逻辑：\n\`\`\`${language}\n${code}\n\`\`\``,
      '你是一个专业的代码解释助手，请用中文详细解释代码的功能、逻辑和关键点。'
    );
    return { reply };
  }

  async debugCode(userId: number, code: string, language: string, errorMessage?: string) {
    if (!code) throw new AppError('代码不能为空', 400);

    let prompt = `请帮我审查并调试以下${language}代码，指出可能存在的问题和改进建议：\n\`\`\`${language}\n${code}\n\`\`\``;
    if (errorMessage) {
      prompt += `\n\n错误信息：${errorMessage}`;
    }

    const reply = await deepseekService.chat(prompt, '你是一个专业的代码调试助手，请用中文帮助找出代码中的错误并提供修复建议。');
    return { reply };
  }

  async optimizeCode(userId: number, code: string, language: string) {
    if (!code) throw new AppError('代码不能为空', 400);

    const reply = await deepseekService.chat(
      `请帮我优化以下${language}代码，提升性能和可读性：\n\`\`\`${language}\n${code}\n\`\`\``,
      '你是一个专业的代码优化助手，请用中文提供优化建议和改进后的代码。'
    );
    return { reply };
  }

  async getHint(userId: number, problemId: number) {
    const problem = await problemRepository.findById(problemId, true) as any;
    if (!problem) throw new AppError('题目不存在', 404);

    const reply = await deepseekService.chat(
      `请根据题目"${problem.title}"，题目描述：${problem.description}，给我一些解题思路和提示。不要直接给出完整代码答案，只给提示。`,
      '你是一个编程教学助手，请用中文给出解题提示，不要直接给出完整答案。'
    );
    return { reply };
  }
}

export const aiService = new AiService();
