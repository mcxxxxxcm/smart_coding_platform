<template>
  <div class="profile-page page-container">
    <div class="container">
      <div class="profile-header">
        <el-avatar :size="100" :src="user?.avatar || undefined">
          {{ user?.username?.charAt(0).toUpperCase() }}
        </el-avatar>
        <div class="profile-info">
          <h1>{{ user?.username }}</h1>
          <p class="bio">{{ user?.bio || '这个人很懒，什么都没写...' }}</p>
          <div class="stats">
            <div class="stat-item">
              <span class="value">Lv.{{ user?.level }}</span>
              <span class="label">等级</span>
            </div>
            <div class="stat-item">
              <span class="value">{{ user?.experience }}</span>
              <span class="label">经验</span>
            </div>
            <div class="stat-item">
              <span class="value">{{ user?.points }}</span>
              <span class="label">积分</span>
            </div>
          </div>
        </div>
        <el-button type="primary" @click="showEditDialog = true">编辑资料</el-button>
      </div>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="我的课程" name="courses">
          <div class="course-grid">
            <div v-for="course in enrolledCourses" :key="course.course_id" class="course-card">
              <div class="course-info">
                <h3>{{ course.course_title }}</h3>
                <el-progress :percentage="course.progress" :stroke-width="8" />
                <p>{{ course.completed ? '已完成' : '学习中' }}</p>
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
            <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
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
  const texts: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return texts[difficulty] || difficulty
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    accepted: '通过',
    wrong_answer: '答案错误',
    time_limit_exceeded: '超时',
    runtime_error: '运行错误',
    compilation_error: '编译错误'
  }
  return texts[status] || status
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
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

onMounted(fetchSubmissions)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.profile-page {
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 30px;
  background: white;
  padding: 30px;
  border-radius: $radius-lg;
  margin-bottom: 30px;
  box-shadow: $shadow-md;
}

.profile-info {
  flex: 1;
  
  h1 {
    font-size: 1.8rem;
    margin-bottom: 8px;
  }
  
  .bio {
    color: $text-secondary;
    margin-bottom: 20px;
  }
}

.stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
  
  .value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: $primary-color;
  }
  
  .label {
    font-size: 0.9rem;
    color: $text-secondary;
  }
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.course-card {
  background: white;
  border-radius: $radius-md;
  padding: 20px;
  box-shadow: $shadow-sm;
}

.course-info h3 {
  margin-bottom: 12px;
}

.submission-list {
  background: white;
  border-radius: $radius-md;
  overflow: hidden;
}

.submission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
}

.submission-info {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .problem-title {
    font-weight: 500;
  }
}

.difficulty-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  
  &.easy { background: #dcfce7; color: #166534; }
  &.medium { background: #fef3c7; color: #92400e; }
  &.hard { background: #fee2e2; color: #991b1b; }
}

.submission-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  color: $text-secondary;
  font-size: 0.9rem;
  
  .status {
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 500;
    
    &.accepted { background: #dcfce7; color: #166534; }
    &.wrong_answer { background: #fee2e2; color: #991b1b; }
  }
}

.settings-section {
  background: white;
  border-radius: $radius-md;
  padding: 30px;
  max-width: 500px;
  
  h3 {
    margin-bottom: 20px;
  }
}
</style>
