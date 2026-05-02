import request from './request'
import type { ApiResponse } from './request'

export interface LessonComment {
  id: number
  lesson_id: number
  user_id: number
  content: string
  parent_id: number | null
  is_ai_reply: boolean
  like_count: number
  created_at: string
  author_name?: string
  author_avatar?: string
  is_liked?: boolean
}

export interface TeacherAnalytics {
  topCommentedLessons: Array<{
    lesson_id: number
    lesson_title: string
    chapter_title: string
    course_title: string
    comment_count: number
  }>
  lowPassRateProblems: Array<{
    id: number
    title: string
    difficulty: string
    total_submissions: number
    accepted_count: number
    pass_rate: number
  }>
  studentActivity: Array<{
    course_id: number
    course_title: string
    enrolled_students: number
    active_learners: number
    avg_progress: number
  }>
  recentComments: Array<{
    id: number
    content: string
    created_at: string
    is_ai_reply: boolean
    lesson_title: string
    author_name: string
  }>
}

export const lessonCommentApi = {
  getComments(lessonId: number, params?: { page?: number; limit?: number }): Promise<ApiResponse<LessonComment[]>> {
    return request.get(`/lessons/${lessonId}/comments`, { params })
  },

  createComment(lessonId: number, data: { content: string; parent_id?: number | null }): Promise<ApiResponse<{ id: number }>> {
    return request.post(`/lessons/${lessonId}/comments`, data)
  },

  deleteComment(id: number): Promise<ApiResponse> {
    return request.delete(`/lesson-comments/${id}`)
  },

  likeComment(id: number): Promise<ApiResponse<{ liked: boolean }>> {
    return request.post(`/lesson-comments/${id}/like`)
  },

  getTeacherAnalytics(): Promise<ApiResponse<TeacherAnalytics>> {
    return request.get('/teacher/analytics')
  },

  getAiInsight(): Promise<ApiResponse<{ insight: string; analytics: TeacherAnalytics }>> {
    return request.post('/teacher/ai-insight')
  }
}
