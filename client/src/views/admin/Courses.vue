<template>
  <div class="admin-courses">
    <div class="page-header">
      <h2>课程审核</h2>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="fetchCourses" style="width: 150px">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已发布" value="published" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchCourses">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="courses" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="课程名称" min-width="150" />
        <el-table-column prop="teacher_name" label="教师" width="100" />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)" size="small">{{ getCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="row.difficulty === 'beginner' ? 'success' : row.difficulty === 'intermediate' ? 'warning' : 'danger'" size="small">
              {{ row.difficulty === 'beginner' ? '入门' : row.difficulty === 'intermediate' ? '进阶' : '高级' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="80">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="enrollment_count" label="报名人数" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending' || row.status === 'draft'" type="success" size="small" @click="approveCourse(row)">通过</el-button>
            <el-button v-if="row.status === 'pending' || row.status === 'draft'" type="danger" size="small" @click="rejectCourse(row)">拒绝</el-button>
            <el-button v-if="row.status === 'rejected'" type="warning" size="small" @click="approveCourse(row)">重新审核</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchCourses"
        @current-change="fetchCourses"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api/admin'
import type { AdminCourse } from '@/api/admin'

const loading = ref(false)
const courses = ref<AdminCourse[]>([])
const filters = reactive({ status: '' })
const pagination = reactive({ page: 1, limit: 10, total: 0 })

const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await adminApi.getCourses({
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status || undefined
    })
    if (res.success && res.data) {
      courses.value = res.data.courses
      pagination.total = res.data.pagination.total
    }
  } catch {
    ElMessage.error('获取课程列表失败')
  } finally {
    loading.value = false
  }
}

const approveCourse = async (course: AdminCourse) => {
  try {
    await adminApi.reviewCourse(course.id, { status: 'published' })
    ElMessage.success('审核通过')
    fetchCourses()
  } catch {
    ElMessage.error('审核失败')
  }
}

const rejectCourse = async (course: AdminCourse) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因（可选）', '拒绝课程', {
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    await adminApi.reviewCourse(course.id, { status: 'rejected', rejectReason: value })
    ElMessage.success('已拒绝')
    fetchCourses()
  } catch {
  }
}

const getCategoryLabel = (c: string) => ({ frontend: '前端', backend: '后端', database: '数据库', ai: '人工智能' }[c] || c)
const getCategoryType = (c: string) => ({ frontend: 'primary', backend: 'success', database: 'warning', ai: 'danger' }[c] || 'info')
const getStatusLabel = (s: string) => ({ draft: '草稿', pending: '待审核', published: '已发布', rejected: '已拒绝' }[s] || s)
const getStatusType = (s: string) => ({ draft: 'info', pending: 'warning', published: 'success', rejected: 'danger' }[s] || 'info')
const formatDate = (d: string) => new Date(d).toLocaleString('zh-CN')

const resetFilters = () => {
  filters.status = ''
  pagination.page = 1
  fetchCourses()
}

onMounted(fetchCourses)
</script>

<style scoped>
.admin-courses { padding: 20px; }
.page-header { margin-bottom: 20px; }
.filter-card { margin-bottom: 20px; }
</style>
