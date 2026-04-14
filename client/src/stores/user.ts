import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api/auth'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isTeacher = computed(() => user.value?.role === 'teacher')

  async function login(email: string, password: string) {
    try {
      const res = await authApi.login(email, password)
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      return true
    } catch {
      return false
    }
  }

  async function register(username: string, email: string, password: string, role: string = 'student') {
    try {
      const res = await authApi.register(username, email, password, role)
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      return true
    } catch {
      return false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    router.push('/login')
  }

  async function fetchUser() {
    if (!token.value) return
    
    try {
      const res = await authApi.getProfile()
      user.value = res.data
    } catch {
      logout()
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    isTeacher,
    login,
    register,
    logout,
    fetchUser
  }
})
