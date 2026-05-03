<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>
    <div class="login-container">
      <div class="login-left">
        <div class="login-brand">
          <div class="brand-icon">
            <svg viewBox="0 0 32 32" width="44" height="44" fill="none">
              <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" stroke-width="2"/>
              <path d="M10 14l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="18" y1="22" x2="24" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h1>智能编程教学平台</h1>
          <p>开启你的编程学习之旅</p>
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
      <div class="login-right">
        <div class="login-form-container">
          <div class="form-header">
            <h2>欢迎回来</h2>
            <p>登录你的账号继续学习</p>
          </div>
          <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin" class="login-form">
            <el-form-item prop="email">
              <el-input v-model="form.email" placeholder="邮箱" size="large" prefix-icon="Message" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="密码" size="large" prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">
                登录
              </el-button>
            </el-form-item>
          </el-form>
          <div class="login-footer">
            <span>还没有账号？</span>
            <router-link to="/register">立即注册</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  email: '',
  password: ''
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  loading.value = true
  try {
    const success = await userStore.login(form.email, form.password)
    if (success) {
      ElMessage.success('登录成功')
      
      const redirect = route.query.redirect as string
      if (redirect) {
        router.push(redirect)
      } else {
        const role = userStore.user?.role
        switch (role) {
          case 'admin':
            router.push('/admin')
            break
          case 'teacher':
            router.push('/teacher')
            break
          default:
            router.push('/')
        }
      }
    } else {
      ElMessage.error('邮箱或密码错误')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-color;
  position: relative;
  overflow: hidden;
}

.login-bg {
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
    left: -5%;
    animation: float 8s ease-in-out infinite;
  }
  
  .shape-2 {
    width: 400px;
    height: 400px;
    background: rgba(5, 150, 105, 0.06);
    bottom: -10%;
    right: -5%;
    animation: float 10s ease-in-out infinite reverse;
  }
  
  .shape-3 {
    width: 300px;
    height: 300px;
    background: rgba(217, 119, 6, 0.04);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: float 12s ease-in-out infinite;
  }
}

.login-container {
  display: flex;
  width: 960px;
  min-height: 540px;
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

.login-left {
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

.login-brand {
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

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px;
  background: transparent;
}

.login-form-container {
  width: 100%;
  max-width: 340px;
}

.form-header {
  margin-bottom: 36px;
  
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

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 22px;
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
}

.login-btn {
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

.login-footer {
  text-align: center;
  margin-top: 28px;
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
