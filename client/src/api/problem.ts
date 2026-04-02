import request from './request'
import type { ApiResponse } from './request'
import type { Problem, Submission } from '@/types'

export interface ProblemListResponse {
  problems: Problem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const problemApi = {
  getProblems(params?: {
    page?: number
    limit?: number
    difficulty?: string
    category?: string
    search?: string
  }): Promise<ApiResponse<Problem[]>> {
    return request.get('/problems', { params })
  },

  getProblemById(id: number): Promise<ApiResponse<Problem>> {
    return request.get(`/problems/${id}`)
  },

  createProblem(data: Partial<Problem>): Promise<ApiResponse<{ id: number }>> {
    return request.post('/problems', data)
  },

  updateProblem(id: number, data: Partial<Problem>): Promise<ApiResponse> {
    return request.put(`/problems/${id}`, data)
  },

  deleteProblem(id: number): Promise<ApiResponse> {
    return request.delete(`/problems/${id}`)
  }
}

export const submissionApi = {
  submit(problemId: number, language: string, code: string): Promise<ApiResponse<{ submissionId: number }>> {
    return request.post('/submissions', {
      problem_id: problemId,
      language,
      code
    })
  },

  getSubmission(id: number): Promise<ApiResponse<Submission>> {
    return request.get(`/submissions/${id}`)
  },

  getUserSubmissions(params?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<Submission[]>> {
    return request.get('/submissions', { params })
  }
}
