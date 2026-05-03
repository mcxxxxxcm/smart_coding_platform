import OpenAI from 'openai';
import { config } from '../config';

export class DeepSeekService {
  private client: OpenAI;
  private model: string = process.env.GLM_MODEL || process.env.DEEPSEEK_MODEL || 'glm-4-flash';

  constructor() {
    this.client = new OpenAI({
      apiKey: config.deepseek.apiKey,
      baseURL: config.deepseek.baseUrl
    });
  }

  async chat(message: string, context?: string): Promise<string> {
    try {
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `你是一个专业的编程教学助手，帮助学习者理解编程概念、调试代码、优化算法。
你的回答应该：
1. 清晰易懂，适合编程学习者
2. 提供具体的代码示例
3. 解释背后的原理和最佳实践
4. 用中文回答`
        }
      ];

      if (context) {
        messages.push({
          role: 'user',
          content: `上下文：${context}\n\n问题：${message}`
        });
      } else {
        messages.push({
          role: 'user',
          content: message
        });
      }

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 2000,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || '抱歉，我无法生成回答。';
    } catch (error) {
      console.error('DeepSeek API 错误:', error);
      throw new Error('AI 服务暂时不可用');
    }
  }

  async generateCode(prompt: string, language: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `你是一个代码生成助手。根据用户的需求生成高质量的 ${language} 代码。
只输出代码，不要添加额外的解释。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('代码生成错误:', error);
      throw new Error('代码生成失败');
    }
  }

  async reviewCode(code: string, language: string): Promise<{
    issues: string[];
    suggestions: string[];
    score: number;
  }> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `你是一个代码审查专家。分析代码并返回 JSON 格式的结果：
{
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"],
  "score": 85
}
score 是 0-100 的代码质量评分。`
          },
          {
            role: 'user',
            content: `请审查以下 ${language} 代码：\n\n\`\`\`${language}\n${code}\n\`\`\``
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('代码审查错误:', error);
      return {
        issues: ['代码审查服务暂时不可用'],
        suggestions: [],
        score: 0
      };
    }
  }
}
