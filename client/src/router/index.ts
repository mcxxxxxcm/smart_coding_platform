import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  // 学生端路由
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/views/Courses.vue'),
        meta: { title: '课程中心' }
      },
      {
        path: 'courses/:id',
        name: 'CourseDetail',
        component: () => import('@/views/CourseDetail.vue'),
        meta: { title: '课程详情' }
      },
      {
        path: 'practice',
        name: 'Practice',
        component: () => import('@/views/Practice.vue'),
        meta: { title: '在线练习' }
      },
      {
        path: 'problems/:id',
        name: 'ProblemDetail',
        component: () => import('@/views/ProblemDetail.vue'),
        meta: { title: '题目详情', requiresAuth: true }
      },
      {
        path: 'playground',
        name: 'Playground',
        component: () => import('@/views/Playground.vue'),
        meta: { title: '代码演练场' }
      },
      {
        path: '/community',
        name: 'Community',
        component: () => import('@/views/Community.vue'),
        meta: { title: '学习社区' }
      },
      {
        path: '/community/posts/:id',
        name: 'PostDetail',
        component: () => import('@/views/community/PostDetail.vue'),
        meta: { title: '帖子详情' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', requiresAuth: true }
      },
      {
        path: 'exams',
        name: 'StudentExams',
        component: () => import('@/views/student/Exams.vue'),
        meta: { title: '考试中心' }
      },
      {
        path: 'exams/:id',
        name: 'StudentExamDetail',
        component: () => import('@/views/student/ExamDetail.vue'),
        meta: { title: '考试详情' }
      },
      {
        path: 'exams/:id/take',
        name: 'ExamTaking',
        component: () => import('@/views/student/ExamTaking.vue'),
        meta: { title: '开始考试', requiresAuth: true }
      },
      {
        path: 'courses/:id/learn',
        name: 'CourseLearning',
        component: () => import('@/views/student/CourseLearning.vue'),
        meta: { title: '课程学习', requiresAuth: true }
      },
      {
        path: 'ai-dashboard',
        name: 'AiDashboard',
        component: () => import('@/views/student/AiDashboard.vue'),
        meta: { title: 'AI 学习中心', requiresAuth: true }
      }
    ]
  },

  // 教师端路由
  {
    path: '/teacher',
    component: () => import('@/layouts/TeacherLayout.vue'),
    meta: { requiresAuth: true, requiresRole: 'teacher' as const },
    children: [
      {
        path: '',
        name: 'TeacherDashboard',
        component: () => import('@/views/teacher/Dashboard.vue'),
        meta: { title: '教师工作台' }
      },
      {
        path: 'courses',
        name: 'TeacherCourses',
        component: () => import('@/views/teacher/Courses.vue'),
        meta: { title: '课程管理' }
      },
      {
        path: 'problems',
        name: 'TeacherProblems',
        component: () => import('@/views/teacher/Problems.vue'),
        meta: { title: '题目管理' }
      },
      {
        path: 'exams',
        name: 'TeacherExams',
        component: () => import('@/views/teacher/Exams.vue'),
        meta: { title: '考试管理' }
      },
      {
        path: 'exams/:id/analytics',
        name: 'TeacherExamAnalytics',
        component: () => import('@/views/teacher/ExamAnalytics.vue'),
        meta: { title: '考试分析' }
      },
      {
        path: 'analytics',
        name: 'TeacherAnalytics',
        component: () => import('@/views/teacher/Analytics.vue'),
        meta: { title: '学情分析' }
      },
      {
        path: 'students',
        name: 'TeacherStudents',
        component: () => import('@/views/teacher/Students.vue'),
        meta: { title: '学生管理' }
      },
      {
        path: 'community',
        name: 'TeacherCommunity',
        component: () => import('@/views/teacher/Community.vue'),
        meta: { title: '社区互动' }
      },
      {
        path: 'community/posts/:id',
        name: 'TeacherPostDetail',
        component: () => import('@/views/teacher/PostDetail.vue'),
        meta: { title: '帖子详情' }
      },
      {
        path: 'profile',
        name: 'TeacherProfile',
        component: () => import('@/views/teacher/Profile.vue'),
        meta: { title: '个人设置' }
      }
    ]
  },

  // 管理员端路由
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresRole: 'admin' as const },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '管理控制台' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'roles',
        name: 'AdminRoles',
        component: () => import('@/views/admin/Roles.vue'),
        meta: { title: '角色权限' }
      },
      {
        path: 'courses',
        name: 'AdminCourses',
        component: () => import('@/views/admin/Courses.vue'),
        meta: { title: '课程审核' }
      },
      {
        path: 'problems',
        name: 'AdminProblems',
        component: () => import('@/views/admin/Problems.vue'),
        meta: { title: '题目审核' }
      },
      {
        path: 'community',
        name: 'AdminCommunity',
        component: () => import('@/views/admin/Community.vue'),
        meta: { title: '社区管理' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/Settings.vue'),
        meta: { title: '基础配置' }
      },
      {
        path: 'security',
        name: 'AdminSecurity',
        component: () => import('@/views/admin/Security.vue'),
        meta: { title: '安全设置' }
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('@/views/admin/Logs.vue'),
        meta: { title: '操作日志' }
      },
      {
        path: 'database',
        name: 'AdminDatabase',
        component: () => import('@/views/admin/Database.vue'),
        meta: { title: '数据维护' }
      },
      {
        path: 'ai-analytics',
        name: 'AdminAiAnalytics',
        component: () => import('@/views/admin/AiAnalytics.vue'),
        meta: { title: 'AI 运营分析' }
      }
    ]
  },

  // 公共页面
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

router.beforeEach(async (to, _from, next) => {
  document.title = `${to.meta.title || '智能编程教学平台'} - 智能编程教学平台`
  
  const userStore = useUserStore()
  
  // 如果有 token 但没有用户信息，先获取用户信息
  if (userStore.token && !userStore.user) {
    try {
      await userStore.fetchUser()
    } catch {
      // 获取用户信息失败，跳转到登录页
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  const userRole = userStore.user?.role || 'student'
  
  // 公共页面不需要权限检查
  const publicPages = ['/login', '/register']
  if (publicPages.includes(to.path)) {
    next()
    return
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  // 检查角色权限
  if (to.meta.requiresRole) {
    const requiredRole = to.meta.requiresRole as string
    if (userRole !== requiredRole && userRole !== 'admin') {
      // 管理员可以访问所有页面，其他用户只能访问自己的页面
      // 根据用户角色跳转到对应首页
      switch (userRole) {
        case 'teacher':
          next('/teacher')
          break
        case 'admin':
          next('/admin')
          break
        default:
          next('/')
      }
      return
    }
  }
  
  // 防止跨角色访问
  // 教师访问学生端页面时，重定向到教师端（但允许访问考试、课程学习、社区、在线练习页面）
  if (to.path.startsWith('/') && !to.path.startsWith('/teacher') && !to.path.startsWith('/admin') && userRole === 'teacher' && !to.path.startsWith('/exams') && !to.path.startsWith('/courses') && !to.path.startsWith('/community') && !to.path.startsWith('/practice')) {
    next('/teacher')
    return
  }
  
  // 学生访问教师端或管理员端时，重定向到学生端
  if ((to.path.startsWith('/teacher') || to.path.startsWith('/admin')) && userRole === 'student') {
    next('/')
    return
  }
  
  next()
})

export default router
