import request from './request';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  level: number;
  experience: number;
  points: number;
  bio: string;
  created_at: string;
}

export interface AdminCourse {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  status: string;
  price: number;
  teacher_name: string;
  enrollment_count: number;
  rating: number;
  created_at: string;
}

export interface AdminProblem {
  id: number;
  title: string;
  difficulty: string;
  category: string;
  status: string;
  created_by_name: string;
  created_at: string;
}

export interface AdminPost {
  id: number;
  title: string;
  content: string;
  status: string;
  author_name: string;
  comment_count: number;
  created_at: string;
}

export interface AdminStats {
  users: number;
  courses: number;
  problems: number;
  posts: number;
  exams: number;
  activeToday: number;
}

export interface AdminSettings {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  maxUploadSize: number;
  sessionTimeout: number;
  enableEmailVerification: boolean;
  maintenanceMode: boolean;
}

export interface AdminSecuritySettings {
  enableTwoFactor: boolean;
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  loginAttemptLimit: number;
  lockoutDuration: number;
  sessionMaxAge: number;
  enableIpWhitelist: boolean;
  allowedIpRanges: string[];
}

export interface OperationLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  target: string;
  ip: string;
  createdAt: string;
}

export interface DatabaseTable {
  name: string;
  rows: number;
}

export interface RoleData {
  key: string;
  name: string;
  description: string;
  userCount: number;
}

export interface RolesResponse {
  roles: RoleData[];
}

export interface PermissionItem {
  code: string;
  label: string;
}

export interface PermissionGroup {
  name: string;
  items: PermissionItem[];
}

export const adminApi = {
  getStats: () => request.get<AdminStats>('/admin/stats'),
  
  getRoles: () => request.get<RolesResponse>('/admin/roles'),
  
  getUsers: (params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) =>
    request.get('/admin/users', { params }),
  
  updateUser: (id: number, data: Partial<AdminUser>) =>
    request.put(`/admin/users/${id}`, data),
  
  deleteUser: (id: number) =>
    request.delete(`/admin/users/${id}`),
  
  getCourses: (params: { page?: number; limit?: number; status?: string }) =>
    request.get('/admin/courses', { params }),
  
  reviewCourse: (id: number, data: { status: string; rejectReason?: string }) =>
    request.put(`/admin/courses/${id}/review`, data),
  
  getProblems: (params: { page?: number; limit?: number; status?: string; difficulty?: string }) =>
    request.get('/admin/problems', { params }),
  
  reviewProblem: (id: number, data: { status: string }) =>
    request.put(`/admin/problems/${id}/review`, data),
  
  getPosts: (params: { page?: number; limit?: number; status?: string }) =>
    request.get('/admin/community', { params }),
  
  moderatePost: (id: number, data: { action: string; reason?: string }) =>
    request.put(`/admin/community/${id}`, data),
  
  getSettings: () => request.get<AdminSettings>('/admin/settings'),
  updateSettings: (data: Partial<AdminSettings>) => request.put('/admin/settings', data),
  
  getSecuritySettings: () => request.get<AdminSecuritySettings>('/admin/security'),
  updateSecuritySettings: (data: Partial<AdminSecuritySettings>) => request.put('/admin/security', data),
  
  getLogs: (params: { page?: number; limit?: number; action?: string; userId?: string }) =>
    request.get('/admin/logs', { params }),
  
  getDatabaseStats: () => request.get<{ tables: DatabaseTable[] }>('/admin/database'),
  optimizeDatabase: () => request.post('/admin/database/optimize'),
};
