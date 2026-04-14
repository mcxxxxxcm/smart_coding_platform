import request from './request'
import type { ApiResponse } from './request'
import type { Course, Chapter, Lesson } from '@/types'

export interface CourseListResponse {
  courses: Course[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CourseDetail extends Course {
  teacher_name: string
  teacher_avatar: string
  chapters: Chapter[]
  isEnrolled?: boolean
  userProgress?: number
  isCompleted?: boolean
}

export const courseApi = {
  getCourses(params?: {
    page?: number
    limit?: number
    category?: string
    difficulty?: string
    search?: string
    status?: string
    teacher_only?: boolean
  }): Promise<ApiResponse<Course[]>> {
    return request.get('/courses', { params })
  },

  getCourseById(id: number): Promise<ApiResponse<CourseDetail>> {
    return request.get(`/courses/${id}`)
  },

  getCourseChapters(courseId: number): Promise<ApiResponse<Chapter[]>> {
    return request.get(`/courses/${courseId}/chapters`)
  },

  getLesson(courseId: number, lessonId: number): Promise<ApiResponse<Lesson>> {
    return request.get(`/courses/${courseId}/lessons/${lessonId}`)
  },

  enrollCourse(courseId: number): Promise<ApiResponse> {
    return request.post(`/courses/${courseId}/enroll`)
  },

  updateProgress(courseId: number, lessonId: number, progress: number): Promise<ApiResponse> {
    return request.put(`/courses/${courseId}/progress`, { lessonId, progress })
  },

  createCourse(data: Partial<Course>): Promise<ApiResponse<{ id: number }>> {
    return request.post('/courses', data)
  },

  updateCourse(id: number, data: Partial<Course>): Promise<ApiResponse> {
    return request.put(`/courses/${id}`, data)
  },

  deleteCourse(id: number): Promise<ApiResponse> {
    return request.delete(`/courses/${id}`)
  }
}
