<template>
  <div class="register-page">
    <div class="register-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>
    <div class="register-container">
      <div class="register-left">
        <div class="register-brand">
          <div class="brand-icon">
            <svg viewBox="0 0 32 32" width="44" height="44" fill="none">
              <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" stroke-width="2"/>
              <path d="M10 14l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="18" y1="22" x2="24" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h1>智能编程教学平台</h1>
          <p>加入我们，开启编程之旅</p>
          <div class="brand-features">
            <div class="feature-item">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span>AI 智能辅导</span>
            </div>
            <div class="feature-item">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span>实战编程练习</span>
            </div>
            <div class="feature-item">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span>社区交流互动</span>
            </div>
          </div>
        </div>
      </div>
      <div class="register-right">
        <div class="register-form-container">
          <div class="form-header">
            <h2>创建账号</h2>
            <p>注册后即可开始学习</p>
          </div>
          <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleRegister" class="register-form">
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="用户名" size="large" prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="email">
              <el-input v-model="form.email" placeholder="邮箱" size="large" prefix-icon="Message" />
            </el-form-item>
            <el-form-item prop="role">
              <el-select v-model="form.role" placeholder="选择角色" size="large" style="width: 100%;">
                <el-option label="学生" value="student">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <el-icon><User /></el-icon>
                    <span>学生 - 学习编程知识</span>
                  </div>
                </el-option>
                <el-option label="教师" value="teacher">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <el-icon><UserFilled /></el-icon>
                    <span>教师 - 管理课程和题目</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="密码" size="large" prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" size="large" prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="loading" native-type="submit" class="register-btn">
                注册
              </el-button>
            </el-form-item>
          </el-form>
          <div class="register-footer">
            <span>已有账号？</span>
            <router-link to="/login">立即登录</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { User, UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  role: 'student',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  loading.value = true
  try {
    const success = await userStore.register(form.username, form.email, form.password, form.role)
    if (success) {
      ElMessage.success('注册成功')
      
      switch (form.role) {
        case 'teacher':
          router.push('/teacher')
          break
        case 'admin':
          router.push('/admin')
          break
        default:
          router.push('/')
      }
    } else {
      ElMessage.error('注册失败，请重试')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-color;
  position: relative;
  overflow: hidden;
}

.register-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  
  .bg-shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
  }
  
  .shape-1 {
    width: 500px;
    height: 500px;
    background: rgba(15, 118, 110, 0.08);
    top: -10%;
    right: -5%;
    animation: float 8s ease-in-out infinite;
  }
  
  .shape-2 {
    width: 400px;
    height: 400px;
    background: rgba(5, 150, 105, 0.06);
    bottom: -10%;
    left: -5%;
    animation: float 10s ease-in-out infinite reverse;
  }
  
  .shape-3 {
    width: 300px;
    height: 300px;
    background: rgba(217, 119, 6, 0.04);
    top: 40%;
    left: 40%;
    animation: float 12s ease-in-out infinite;
  }
}

.register-container {
  display: flex;
  width: 960px;
  min-height: 600px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border-radius: $radius-xl;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: $shadow-elevated, 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  overflow: hidden;
  position: relative;
  z-index: 1;
  animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.register-left {
  flex: 1;
  background: linear-gradient(160deg, #0f766e 0%, #0d6560 50%, #064e3b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -20%;
    right: -20%;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
}

.register-brand {
  text-align: center;
  color: white;
  position: relative;
  z-index: 1;
  
  .brand-icon {
    width: 72px;
    height: 72px;
    background: rgba(255, 255, 255, 0.12);
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  
  h1 {
    font-size: 1.6rem;
    margin: 0 0 8px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  
  p {
    opacity: 0.7;
    font-size: 0.95rem;
    margin-bottom: 32px;
  }
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: $radius-sm;
  font-size: 0.88rem;
  opacity: 0.85;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all $transition-base;
  
  &:hover {
    background: rgba(255, 255, 255, 0.14);
    opacity: 1;
  }
  
  svg {
    flex-shrink: 0;
    opacity: 0.8;
  }
}

.register-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 56px;
  background: transparent;
}

.register-form-container {
  width: 100%;
  max-width: 360px;
}

.form-header {
  margin-bottom: 32px;
  
  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }
  
  p {
    color: $text-secondary;
    font-size: 0.95rem;
  }
}

.register-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
  
  :deep(.el-input__wrapper) {
    border-radius: $radius-sm;
    padding: 4px 12px;
    box-shadow: 0 0 0 1px $border-color inset;
    transition: all $transition-base;
    
    &:hover {
      box-shadow: 0 0 0 1px $primary-border inset;
    }
    
    &.is-focus {
      box-shadow: 0 0 0 1px $primary-color inset, 0 0 0 3px rgba(15, 118, 110, 0.1);
    }
  }
  
  :deep(.el-select .el-input__wrapper) {
    border-radius: $radius-sm;
  }
}

.register-btn {
  width: 100%;
  height: 48px;
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: $radius-sm;
  letter-spacing: 0.02em;
  transition: all $transition-base;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  color: $text-secondary;
  font-size: 0.9rem;
  
  a {
    color: $primary-color;
    margin-left: 5px;
    font-weight: 600;
    transition: color $transition-fast;
    
    &:hover {
      color: $primary-hover;
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
