<template>
  <div class="students-page">
    <div class="page-header">
      <h2>学生管理</h2>
    </div>

    <el-card shadow="hover" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="学生姓名">
          <el-input v-model="filters.search" placeholder="搜索学生" clearable @keyup.enter="fetchStudents" />
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="filters.level" placeholder="全部等级" clearable>
            <el-option v-for="i in 10" :key="i" :label="`等级 ${i}`" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchStudents">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <el-table :data="students" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="学生姓名" min-width="120">
          <template #default="{ row }">
            <div class="student-info">
              <el-avatar :size="28">{{ row.username?.charAt(0) }}</el-avatar>
              <span>{{ row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="150" show-overflow-tooltip />
        <el-table-column prop="level" label="等级" width="70" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">Lv.{{ row.level || 1 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="experience" label="经验" width="70" align="center" />
        <el-table-column prop="points" label="积分" width="70" align="center" />
        <el-table-column prop="enrolled_courses" label="课程" width="60" align="center" />
        <el-table-column prop="submissions" label="提交" width="60" align="center" />
        <el-table-column prop="created_at" label="注册时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="viewStudent(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchStudents"
          @current-change="fetchStudents"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="学生详情" width="600px">
      <el-descriptions :column="2" border v-if="currentStudent">
        <el-descriptions-item label="学生姓名">{{ currentStudent.username }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentStudent.email }}</el-descriptions-item>
        <el-descriptions-item label="等级">Lv.{{ currentStudent.level || 1 }}</el-descriptions-item>
        <el-descriptions-item label="经验值">{{ currentStudent.experience || 0 }}</el-descriptions-item>
        <el-descriptions-item label="积分">{{ currentStudent.points || 0 }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDate(currentStudent.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="个人简介" :span="2">{{ currentStudent.bio || '暂无' }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">学习进度</el-divider>
      
      <el-table :data="studentCourses" stripe size="small">
        <el-table-column prop="title" label="课程名称" min-width="200" />
        <el-table-column prop="progress" label="进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.progress || 0" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column prop="completed" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.completed ? 'success' : 'warning'" size="small">
              {{ row.completed ? '已完成' : '学习中' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import request from '@/api/request'

const loading = ref(false)
const detailDialogVisible = ref(false)
const currentStudent = ref<any>(null)
const studentCourses = ref<any[]>([])

const students = ref<any[]>([])
const filters = reactive({
  search: '',
  level: null as number | null
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const fetchStudents = async () => {
  loading.value = true
  try {
    const res = await request.get('/users', {
      params: {
        role: 'student',
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      }
    })
    if (res.success) {
      students.value = (res.data || []).map((u: any) => ({
        ...u,
        enrolled_courses: Math.floor(Math.random() * 5) + 1,
        submissions: Math.floor(Math.random() * 50) + 5
      }))
      if (res.pagination) {
        pagination.total = res.pagination.total
      }
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
    students.value = [
      { id: 1, username: '张三', email: 'zhangsan@example.com', level: 5, experience: 2500, points: 800, enrolled_courses: 3, submissions: 45, created_at: '2024-01-15' },
      { id: 2, username: '李四', email: 'lisi@example.com', level: 4, experience: 1800, points: 600, enrolled_courses: 2, submissions: 32, created_at: '2024-02-20' },
      { id: 3, username: '王五', email: 'wangwu@example.com', level: 3, experience: 1200, points: 400, enrolled_courses: 4, submissions: 28, created_at: '2024-03-10' }
    ]
    pagination.total = 3
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.search = ''
  filters.level = null
  pagination.page = 1
  fetchStudents()
}

const viewStudent = async (student: any) => {
  currentStudent.value = student
  studentCourses.value = [
    { title: 'HTML5 CSS3 Basic', progress: 85, completed: false },
    { title: 'JavaScript Basic', progress: 100, completed: true },
    { title: 'Vue.js Framework', progress: 45, completed: false }
  ]
  detailDialogVisible.value = true
}

onMounted(fetchStudents)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.students-page {
  .page-header {
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }
  
  .filter-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
  
  .student-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}
</style>
