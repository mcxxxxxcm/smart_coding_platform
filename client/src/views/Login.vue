<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="login-brand">
          <el-icon :size="48"><Monitor /></el-icon>
          <h1>智能编程教学平台</h1>
          <p>开启你的编程学习之旅</p>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-container">
          <h2>登录</h2>
          <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
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
      
      // 根据角色跳转到不同页面
      const redirect = route.query.redirect as string
      if (redirect) {
        router.push(redirect)
      } else {
        // 根据用户角色跳转
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
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(ellipse at 20% 50%, rgba(15, 118, 110, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(5, 150, 105, 0.04) 0%, transparent 50%);
    pointer-events: none;
  }
}

.login-container {
  display: flex;
  width: 920px;
  min-height: 520px;
  background: white;
  border-radius: $radius-lg;
  border: 1px solid $border-color;
  box-shadow: $shadow-xl;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.login-left {
  flex: 1;
  background: $primary-color;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 120px;
    height: 120px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 50%;
    transform: translate(30%, 30%);
  }
}

.login-brand {
  text-align: center;
  color: white;
  position: relative;
  z-index: 1;
  
  .el-icon {
    opacity: 0.9;
  }
  
  h1 {
    font-size: 1.75rem;
    margin: 20px 0 10px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  
  p {
    opacity: 0.75;
    font-size: 0.95rem;
  }
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: white;
}

.login-form-container {
  width: 100%;
  max-width: 320px;
  
  h2 {
    font-size: 1.75rem;
    margin-bottom: 32px;
    text-align: center;
    color: $text-primary;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-weight: 600;
  font-size: 0.95rem;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: $text-secondary;
  font-size: 0.9rem;
  
  a {
    color: $primary-color;
    margin-left: 5px;
    font-weight: 500;
    
    &:hover {
      color: $primary-hover;
    }
  }
}
</style>
