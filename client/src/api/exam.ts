import request from './request'
import type { ApiResponse } from './request'

export interface Exam {
  id: number
  title: string
  description: string
  teacher_id: number
  teacher_name?: string
  duration: number
  total_score: number
  passing_score: number
  start_time: string | null
  end_time: string | null
  status: 'draft' | 'published' | 'ended'
  allow_review: boolean
  random_order: boolean
  participant_count?: number
  created_at: string
}

export interface ExamQuestion {
  id: number
  problem_id: number
  score: number
  order: number
  title?: string
  difficulty?: string
  category?: string
}

export const examApi = {
  getExams(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    teacher_only?: boolean
  }): Promise<ApiResponse<Exam[]>> {
    return request.get('/exams', { params })
  },

  getExamById(id: number): Promise<ApiResponse<Exam>> {
    return request.get(`/exams/${id}`)
  },

  getAvailableProblems(params?: {
    search?: string
  }): Promise<ApiResponse<any[]>> {
    return request.get('/exams/problems', { params })
  },

  createExam(data: Partial<Exam> & { questions?: any[] }): Promise<ApiResponse<{ id: number }>> {
    return request.post('/exams', data)
  },

  updateExam(id: number, data: Partial<Exam> & { questions?: any[] }): Promise<ApiResponse> {
    return request.put(`/exams/${id}`, data)
  },

  deleteExam(id: number): Promise<ApiResponse> {
    return request.delete(`/exams/${id}`)
  },

  getExamHistory(params?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<any>> {
    return request.get('/exams/history', { params })
  },

  getExamSubmissionDetail(attemptId: number): Promise<ApiResponse<any>> {
    return request.get(`/exams/submission/${attemptId}`)
  },

  getWrongQuestions(): Promise<ApiResponse<any[]>> {
    return request.get('/exams/wrong-questions')
  }
}
