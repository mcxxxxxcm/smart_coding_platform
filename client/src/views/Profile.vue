<template>
  <div class="profile-page">
    <div class="container">
      <div class="profile-header">
        <div class="profile-left">
          <el-avatar :size="80" :src="user?.avatar || undefined" class="profile-avatar">
            {{ user?.username?.charAt(0).toUpperCase() }}
          </el-avatar>
          <div class="profile-info">
            <h1>{{ user?.username }}</h1>
            <p class="bio">{{ user?.bio || '这个人很懒，什么都没写...' }}</p>
          </div>
        </div>
        <div class="profile-right">
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">Lv.{{ user?.level }}</span>
              <span class="stat-label">等级</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ user?.experience }}</span>
              <span class="stat-label">经验</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ user?.points }}</span>
              <span class="stat-label">积分</span>
            </div>
          </div>
          <el-button type="primary" @click="showEditDialog = true" plain>编辑资料</el-button>
        </div>
      </div>
      
      <div class="profile-content">
        <el-tabs v-model="activeTab" class="profile-tabs">
          <el-tab-pane label="我的课程" name="courses">
            <div class="course-grid">
              <div v-for="course in enrolledCourses" :key="course.course_id" class="course-card">
                <div class="course-info">
                  <h3>{{ course.course_title }}</h3>
                  <el-progress :percentage="course.progress" :stroke-width="6" />
                  <div class="course-status">
                    <span :class="course.completed ? 'completed' : 'in-progress'">
                      {{ course.completed ? '已完成' : '学习中' }}
                    </span>
                    <span class="progress-text">{{ course.progress }}%</span>
                  </div>
                </div>
              </div>
              <el-empty v-if="enrolledCourses.length === 0" description="还没有报名任何课程" />
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="我的提交" name="submissions">
            <div class="submission-list">
              <div v-for="submission in submissions" :key="submission.id" class="submission-item">
                <div class="submission-info">
                  <span class="problem-title">{{ submission.problem_title }}</span>
                  <span class="difficulty-tag" :class="submission.difficulty">
                    {{ getDifficultyText(submission.difficulty) }}
                  </span>
                </div>
                <div class="submission-meta">
                  <span class="status" :class="submission.status">{{ getStatusText(submission.status) }}</span>
                  <span class="language">{{ submission.language }}</span>
                  <span class="time">{{ formatTime(submission.submitted_at) }}</span>
                </div>
              </div>
              <el-empty v-if="submissions.length === 0" description="还没有提交记录" />
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="账号设置" name="settings">
            <div class="settings-section">
              <h3>修改密码</h3>
              <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px" class="settings-form">
                <el-form-item label="当前密码" prop="currentPassword">
                  <el-input v-model="passwordForm.currentPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="passwordForm.newPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="changePassword" :loading="changingPassword">修改密码</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    
    <el-dialog v-model="showEditDialog" title="编辑资料" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="editForm.bio" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updateProfile" :loading="updating">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/api/auth'
import { submissionApi } from '@/api/problem'
import request from '@/api/request'
import type { Submission, UserProgress } from '@/types'
import dayjs from 'dayjs'

const userStore = useUserStore()
const user = userStore.user

const activeTab = ref('courses')
const enrolledCourses = ref<UserProgress[]>([])
const submissions = ref<Submission[]>([])
const showEditDialog = ref(false)
const updating = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref<FormInstance>()

const editForm = reactive({
  username: user?.username || '',
  bio: user?.bio || ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const getDifficultyText = (difficulty: string) => {
  const texts: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
  return texts[difficulty] || difficulty
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    accepted: '通过', wrong_answer: '答案错误', time_limit_exceeded: '超时',
    runtime_error: '运行错误', compilation_error: '编译错误'
  }
  return texts[status] || status
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const fetchEnrolledCourses = async () => {
  try {
    const res = await request.get('/users/progress')
    enrolledCourses.value = res.data?.courses || []
  } catch {
    console.error('获取课程进度失败')
  }
}

const fetchSubmissions = async () => {
  try {
    const res = await submissionApi.getUserSubmissions({ limit: 20 })
    submissions.value = res.data || []
  } catch {
    console.error('获取提交记录失败')
  }
}

const updateProfile = async () => {
  updating.value = true
  try {
    await authApi.updateProfile(editForm)
    await userStore.fetchUser()
    ElMessage.success('资料更新成功')
    showEditDialog.value = false
  } finally {
    updating.value = false
  }
}

const changePassword = async () => {
  const valid = await passwordFormRef.value?.validate()
  if (!valid) return
  
  changingPassword.value = true
  try {
    await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
    ElMessage.success('密码修改成功')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } finally {
    changingPassword.value = false
  }
}

onMounted(() => {
  fetchEnrolledCourses()
  fetchSubmissions()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.profile-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px 80px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  margin-bottom: 20px;

  .profile-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .profile-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }
}

.profile-avatar {
  flex-shrink: 0;
  background: #f0f7ff;
  color: $primary-color;
  font-size: 1.5rem;
  font-weight: 700;
}

.profile-info {
  h1 {
    font-size: 1.3rem;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 4px;
  }
  .bio {
    color: $text-secondary;
    font-size: 0.85rem;
    margin: 0;
  }
}

.profile-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-item {
  text-align: center;
  .stat-value {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    color: $text-primary;
  }
  .stat-label {
    font-size: 0.75rem;
    color: $text-secondary;
  }
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: #e4e7ed;
}

.profile-content {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  padding: 0 20px 20px;
}

.profile-tabs {
  :deep(.el-tabs__header) { margin-bottom: 20px; }
  :deep(.el-tabs__item) { font-weight: 500; font-size: 0.9rem; }
  :deep(.el-tabs__active-bar) { background-color: $primary-color; }
  :deep(.el-tabs__item.is-active) { color: $primary-color; }
  :deep(.el-tabs__item:hover) { color: $primary-color; }
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.course-card {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  transition: border-color 0.2s;
  &:hover { border-color: #c0c4cc; }
}

.course-info h3 {
  margin: 0 0 12px;
  font-weight: 600;
  font-size: 0.95rem;
  color: $text-primary;
}

.course-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 0.8rem;
  .completed { color: #16a34a; font-weight: 500; }
  .in-progress { color: $primary-color; font-weight: 500; }
  .progress-text { color: $text-secondary; }
}

.submission-list {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}

.submission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f2f3f5;
  &:last-child { border-bottom: none; }
  &:hover { background: #fafafa; }
}

.submission-info {
  display: flex;
  align-items: center;
  gap: 10px;
  .problem-title { font-weight: 500; color: $text-primary; font-size: 0.9rem; }
}

.difficulty-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
  &.easy { background: #f0f9eb; color: #67c23a; }
  &.medium { background: #fdf6ec; color: #e6a23c; }
  &.hard { background: #fef0f0; color: #f56c6c; }
}

.submission-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: $text-secondary;
  font-size: 0.8rem;
  .status {
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 0.75rem;
    &.accepted { background: #f0f9eb; color: #67c23a; }
    &.wrong_answer { background: #fef0f0; color: #f56c6c; }
  }
  .language { color: $text-secondary; }
  .time { color: #c0c4cc; }
}

.settings-section {
  max-width: 480px;
  h3 {
    margin: 0 0 20px;
    font-size: 1rem;
    font-weight: 600;
    color: $text-primary;
  }
}
</style>
