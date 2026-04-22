import { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { id: number; username: string; role: string };
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

const GLM_API_KEY = process.env.GLM_API_KEY || '';
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_MODEL = 'glm-4.6v';

export class AIController {
  private async callGLM(messages: Array<{ role: string; content: string }>): Promise<string> {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: GLM_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GLM API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '';
  }

  async chat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { message, context } = req.body;

      if (!message) {
        res.status(400).json({ success: false, message: '消息内容不能为空' } as ApiResponse);
        return;
      }

      const systemPrompt = `你是一个专业的编程教学助手，名叫"智能编程助手"。你帮助学生理解编程概念、解答编程问题。
你的回答应该：
1. 简洁明了，直接回答问题
2. 使用通俗易懂的语言
3. 必要时提供代码示例
4. 鼓励学生独立思考，不要直接给出完整答案
5. 使用中文回答`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context ? `[上下文信息]\n${context}\n\n[用户问题]\n${message}` : message }
      ];

      const response = await this.callGLM(messages);

      res.json({
        success: true,
        data: { response }
      } as ApiResponse);
    } catch (error) {
      console.error('AI 对话错误:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'AI 服务暂时不可用'
      } as ApiResponse);
    }
  }

  async explainCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code, language } = req.body;

      if (!code) {
        res.status(400).json({ success: false, message: '代码内容不能为空' } as ApiResponse);
        return;
      }

      const systemPrompt = `你是一个编程教学助手。请解释用户提供的代码，包括：
1. 代码的整体功能和目的
2. 关键代码段的作用
3. 时间复杂度和空间复杂度分析
4. 可能的优化建议
使用中文回答，保持简洁。`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请使用 ${language || 'JavaScript'} 解释以下代码：\n\`\`\`${language || ''}\n${code}\n\`\`\`` }
      ];

      const response = await this.callGLM(messages);

      res.json({
        success: true,
        data: { explanation: response }
      } as ApiResponse);
    } catch (error) {
      console.error('代码解释错误:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'AI 服务暂时不可用'
      } as ApiResponse);
    }
  }

  async debugCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code, language, error_message } = req.body;

      if (!code) {
        res.status(400).json({ success: false, message: '代码内容不能为空' } as ApiResponse);
        return;
      }

      const systemPrompt = `你是一个编程调试助手。请帮助用户找出代码中的错误并提供修复建议。
请：
1. 指出代码中的错误或问题
2. 解释错误的原因
3. 提供修复后的代码
4. 给出避免类似错误的建议
使用中文回答。`;

      let userMessage = `请帮我调试以下 ${language || 'JavaScript'} 代码：\n\`\`\`${language || ''}\n${code}\n\`\`\``;
      if (error_message) {
        userMessage += `\n\n错误信息：${error_message}`;
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      const response = await this.callGLM(messages);

      res.json({
        success: true,
        data: { debug_info: response }
      } as ApiResponse);
    } catch (error) {
      console.error('代码调试错误:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'AI 服务暂时不可用'
      } as ApiResponse);
    }
  }

  async optimizeCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code, language } = req.body;

      if (!code) {
        res.status(400).json({ success: false, message: '代码内容不能为空' } as ApiResponse);
        return;
      }

      const systemPrompt = `你是一个代码优化助手。请分析用户代码并提供优化建议。
请：
1. 分析当前代码的时间复杂度和空间复杂度
2. 指出可以优化的部分
3. 提供优化后的代码
4. 解释优化前后的性能差异
使用中文回答。`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请优化以下 ${language || 'JavaScript'} 代码：\n\`\`\`${language || ''}\n${code}\n\`\`\`` }
      ];

      const response = await this.callGLM(messages);

      res.json({
        success: true,
        data: { optimization: response }
      } as ApiResponse);
    } catch (error) {
      console.error('代码优化错误:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'AI 服务暂时不可用'
      } as ApiResponse);
    }
  }

  async getHint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { problem_title, problem_description, code, language } = req.body;

      if (!problem_title || !problem_description) {
        res.status(400).json({ success: false, message: '题目信息不能为空' } as ApiResponse);
        return;
      }

      const systemPrompt = `你是一个编程题目提示助手。学生遇到不会的题目时，你会给出适当的提示。
请遵循以下原则：
1. 不要直接给出完整答案
2. 根据学生的代码判断其理解程度，给出针对性的提示
3. 提示应该循序渐进，从思路引导开始
4. 如果学生还没有开始写代码，给出解题思路的提示
5. 如果学生已经写了代码但有错误，指出问题所在并给出方向性提示
6. 使用中文回答`;

      let userMessage = `题目：${problem_title}\n\n题目描述：${problem_description}`;
      if (code && code.trim()) {
        userMessage += `\n\n学生代码：\n\`\`\`${language || ''}\n${code}\n\`\`\``;
      } else {
        userMessage += '\n\n学生还没有开始写代码。';
      }
      userMessage += '\n\n请根据学生的情况给出适当的提示（不要直接给答案）：';

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      const response = await this.callGLM(messages);

      res.json({
        success: true,
        data: { hint: response }
      } as ApiResponse);
    } catch (error) {
      console.error('获取提示错误:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'AI 服务暂时不可用'
      } as ApiResponse);
    }
  }
}
