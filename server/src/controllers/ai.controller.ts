import { Response } from 'express';
import { config } from '../config';
import { AuthenticatedRequest, ApiResponse } from '../types/express';
import { DeepSeekService } from '../services/deepseek.service';

export class AIController {
  private deepseekService: DeepSeekService;

  constructor() {
    this.deepseekService = new DeepSeekService();
  }

  async chat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { message, context } = req.body;
      
      const response = await this.deepseekService.chat(message, context);
      
      res.json({
        success: true,
        data: { response }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: 'AI 服务暂时不可用'
      } as ApiResponse);
    }
  }

  async explainCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code, language } = req.body;
      
      const prompt = `请解释以下 ${language} 代码的功能和逻辑：

\`\`\`${language}
${code}
\`\`\`

请用中文详细解释：
1. 代码的整体功能
2. 关键步骤和逻辑
3. 使用的主要算法或数据结构
4. 时间复杂度和空间复杂度（如果适用）`;

      const response = await this.deepseekService.chat(prompt);
      
      res.json({
        success: true,
        data: { explanation: response }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '代码解释失败'
      } as ApiResponse);
    }
  }

  async debugCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code, language, error_message } = req.body;
      
      const prompt = `请帮我调试以下 ${language} 代码：

\`\`\`${language}
${code}
\`\`\`

错误信息：
${error_message || '无具体错误信息'}

请分析代码中可能存在的问题，并给出修复建议。用中文回答。`;

      const response = await this.deepseekService.chat(prompt);
      
      res.json({
        success: true,
        data: { debug_info: response }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '代码调试失败'
      } as ApiResponse);
    }
  }

  async optimizeCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code, language } = req.body;
      
      const prompt = `请优化以下 ${language} 代码：

\`\`\`${language}
${code}
\`\`\`

请提供：
1. 优化后的代码
2. 优化说明
3. 性能改进分析

用中文回答。`;

      const response = await this.deepseekService.chat(prompt);
      
      res.json({
        success: true,
        data: { optimization: response }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '代码优化建议生成失败'
      } as ApiResponse);
    }
  }

  async getHint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { problem_title, problem_description, code, language } = req.body;
      
      const prompt = `我正在解决这道编程题目：

题目：${problem_title}

描述：
${problem_description}

我目前的代码：
\`\`\`${language}
${code}
\`\`\`

请给我一些提示，帮助我找到解题思路，但不要直接给出完整答案。用中文回答。`;

      const response = await this.deepseekService.chat(prompt);
      
      res.json({
        success: true,
        data: { hint: response }
      } as ApiResponse);
    } catch {
      res.status(500).json({
        success: false,
        message: '获取提示失败'
      } as ApiResponse);
    }
  }
}
