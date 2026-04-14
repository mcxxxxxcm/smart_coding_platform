<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-left">
        <div class="register-brand">
          <el-icon :size="48"><Monitor /></el-icon>
          <h1>智能编程教学平台</h1>
          <p>开启你的编程学习之旅</p>
        </div>
      </div>
      <div class="register-right">
        <div class="register-form-container">
          <h2>注册</h2>
          <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleRegister">
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
      
      // 根据角色跳转到不同页面
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-container {
  display: flex;
  width: 900px;
  min-height: 550px;
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  overflow: hidden;
}

.register-left {
  flex: 1;
  background: linear-gradient(135deg, $primary-color, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.register-brand {
  text-align: center;
  color: white;
  
  h1 {
    font-size: 1.8rem;
    margin: 20px 0 10px;
  }
  
  p {
    opacity: 0.8;
  }
}

.register-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.register-form-container {
  width: 100%;
  max-width: 320px;
  
  h2 {
    font-size: 1.8rem;
    margin-bottom: 30px;
    text-align: center;
    color: $text-primary;
  }
}

.register-btn {
  width: 100%;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  color: $text-secondary;
  
  a {
    color: $primary-color;
    margin-left: 5px;
    
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
