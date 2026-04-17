<template>
  <div class="admin-problems">
    <div class="page-header">
      <h2>题目审核</h2>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="难度">
          <el-select v-model="filters.difficulty" placeholder="全部难度" clearable @change="fetchProblems" style="width: 150px">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="fetchProblems" style="width: 150px">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已发布" value="published" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchProblems">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="problems" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="题目名称" min-width="150" />
        <el-table-column label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="row.difficulty === 'easy' ? 'success' : row.difficulty === 'medium' ? 'warning' : 'danger'" size="small">
              {{ row.difficulty === 'easy' ? '简单' : row.difficulty === 'medium' ? '中等' : '困难' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="created_by_name" label="创建者" width="100" />
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
            <el-button v-if="row.status !== 'published'" type="success" size="small" @click="approveProblem(row)">通过</el-button>
            <el-button v-if="row.status !== 'published'" type="danger" size="small" @click="rejectProblem(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchProblems"
        @current-change="fetchProblems"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/admin'
import type { AdminProblem } from '@/api/admin'

const loading = ref(false)
const problems = ref<AdminProblem[]>([])
const filters = reactive({ difficulty: '', status: '' })
const pagination = reactive({ page: 1, limit: 10, total: 0 })

const fetchProblems = async () => {
  loading.value = true
  try {
    const res = await adminApi.getProblems({
      page: pagination.page,
      limit: pagination.limit,
      difficulty: filters.difficulty || undefined,
      status: filters.status || undefined
    })
    if (res.success && res.data) {
      problems.value = res.data.problems
      pagination.total = res.data.pagination.total
    }
  } catch {
    ElMessage.error('获取题目列表失败')
  } finally {
    loading.value = false
  }
}

const approveProblem = async (problem: AdminProblem) => {
  try {
    await adminApi.reviewProblem(problem.id, { status: 'published' })
    ElMessage.success('审核通过')
    fetchProblems()
  } catch {
    ElMessage.error('审核失败')
  }
}

const rejectProblem = async (problem: AdminProblem) => {
  try {
    await adminApi.reviewProblem(problem.id, { status: 'rejected' })
    ElMessage.success('已拒绝')
    fetchProblems()
  } catch {
    ElMessage.error('操作失败')
  }
}

const resetFilters = () => {
  filters.difficulty = ''
  filters.status = ''
  pagination.page = 1
  fetchProblems()
}

const getStatusLabel = (s: string) => ({ draft: '草稿', pending: '待审核', published: '已发布', rejected: '已拒绝' }[s] || s)
const getStatusType = (s: string) => ({ draft: 'info', pending: 'warning', published: 'success', rejected: 'danger' }[s] || 'info')
const formatDate = (d: string) => new Date(d).toLocaleString('zh-CN')

onMounted(fetchProblems)
</script>

<style scoped>
.admin-problems { padding: 20px; }
.page-header { margin-bottom: 20px; }
.filter-card { margin-bottom: 20px; }
</style>
