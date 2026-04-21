import request from './request'
import type { ApiResponse } from './request'

export const aiApi = {
  chat(params: { message: string; problemId?: number; code?: string; language?: string; output?: string }): Promise<ApiResponse<{ reply: string; response: string }>> {
    return request.post('/ai/chat', params)
  },

  explainCode(problemId: number, params: { code: string; language: string }): Promise<ApiResponse<{ explanation: string }>> {
    return request.post('/ai/explain', { problem_id: problemId, ...params })
  },

  debugCode(problemId: number, params: { code: string; language: string; output?: string }): Promise<ApiResponse<{ debug_info: string; debug: string }>> {
    return request.post('/ai/debug', { problem_id: problemId, ...params, error_message: params.output })
  },

  optimizeCode(code: string, language: string): Promise<ApiResponse<{ optimization: string }>> {
    return request.post('/ai/optimize', { code, language })
  },

  getHint(problemId: number, params: { title: string; description: string; difficulty: string; code?: string; language?: string }): Promise<ApiResponse<{ hint: string }>> {
    return request.post('/ai/hint', { problem_id: problemId, problem_title: params.title, problem_description: params.description, difficulty: params.difficulty, code: params.code, language: params.language })
  }
}
