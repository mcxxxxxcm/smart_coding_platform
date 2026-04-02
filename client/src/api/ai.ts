import request from './request'
import type { ApiResponse } from './request'

export const aiApi = {
  chat(message: string, context?: string): Promise<ApiResponse<{ response: string }>> {
    return request.post('/ai/chat', { message, context })
  },

  explainCode(code: string, language: string): Promise<ApiResponse<{ explanation: string }>> {
    return request.post('/ai/explain', { code, language })
  },

  debugCode(code: string, language: string, errorMessage?: string): Promise<ApiResponse<{ debug_info: string }>> {
    return request.post('/ai/debug', { code, language, error_message: errorMessage })
  },

  optimizeCode(code: string, language: string): Promise<ApiResponse<{ optimization: string }>> {
    return request.post('/ai/optimize', { code, language })
  },

  getHint(problemTitle: string, problemDescription: string, code: string, language: string): Promise<ApiResponse<{ hint: string }>> {
    return request.post('/ai/hint', {
      problem_title: problemTitle,
      problem_description: problemDescription,
      code,
      language
    })
  }
}
