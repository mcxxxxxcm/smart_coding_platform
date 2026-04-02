import request from './request'
import type { ApiResponse } from './request'
import type { User } from '@/types'

export interface LoginResponse {
  token: string
  user: User
}

export const authApi = {
  login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return request.post('/auth/login', { email, password })
  },

  register(username: string, email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return request.post('/auth/register', { username, email, password })
  },

  logout(): Promise<ApiResponse> {
    return request.post('/auth/logout')
  },

  refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return request.post('/auth/refresh-token')
  },

  getProfile(): Promise<ApiResponse<User>> {
    return request.get('/users/profile')
  },

  updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return request.put('/users/profile', data)
  },

  changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return request.put('/users/password', { currentPassword, newPassword })
  }
}
