import request from './request'
import type { ApiResponse } from './request'
import type { Post, Comment } from '@/types'

export const communityApi = {
  getPosts(params?: {
    page?: number
    limit?: number
    category?: string
    search?: string
  }): Promise<ApiResponse<Post[]>> {
    return request.get('/community/posts', { params })
  },

  getPostById(id: number): Promise<ApiResponse<Post>> {
    return request.get(`/community/posts/${id}`)
  },

  createPost(data: Partial<Post>): Promise<ApiResponse<{ id: number }>> {
    return request.post('/community/posts', data)
  },

  updatePost(id: number, data: Partial<Post>): Promise<ApiResponse> {
    return request.put(`/community/posts/${id}`, data)
  },

  deletePost(id: number): Promise<ApiResponse> {
    return request.delete(`/community/posts/${id}`)
  },

  likePost(id: number): Promise<ApiResponse<{ liked: boolean }>> {
    return request.post(`/community/posts/${id}/like`)
  },

  getComments(postId: number, params?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<Comment[]>> {
    return request.get(`/community/posts/${postId}/comments`, { params })
  },

  createComment(postId: number, content: string, parentId?: number): Promise<ApiResponse<{ id: number }>> {
    return request.post(`/community/posts/${postId}/comments`, { content, parent_id: parentId })
  },

  deleteComment(id: number): Promise<ApiResponse> {
    return request.delete(`/community/comments/${id}`)
  },

  likeComment(id: number): Promise<ApiResponse<{ liked: boolean }>> {
    return request.post(`/community/comments/${id}/like`)
  },

  togglePinPost(id: number): Promise<ApiResponse<{ is_pinned: boolean }>> {
    return request.patch(`/community/posts/${id}/pin`)
  },

  togglePinComment(id: number): Promise<ApiResponse<{ is_pinned: boolean }>> {
    return request.patch(`/community/comments/${id}/pin`)
  }
}
