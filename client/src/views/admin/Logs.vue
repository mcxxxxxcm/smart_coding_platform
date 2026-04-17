<template>
  <div class="admin-logs">
    <div class="page-header">
      <h2>操作日志</h2>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" placeholder="全部操作" clearable @change="fetchLogs" style="width: 150px">
            <el-option label="登录" value="LOGIN" />
            <el-option label="用户管理" value="USER_UPDATE" />
            <el-option label="课程审核" value="COURSE_REVIEW" />
            <el-option label="题目审核" value="PROBLEM_REVIEW" />
            <el-option label="社区管理" value="COMMUNITY_MODERATE" />
            <el-option label="系统设置" value="SETTINGS_UPDATE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button @click="exportLogs">导出日志</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="userName" label="操作人" width="100" />
        <el-table-column label="操作类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">{{ getActionLabel(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="操作对象" min-width="150" />
        <el-table-column prop="ip" label="IP 地址" width="140" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchLogs"
        @current-change="fetchLogs"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/admin'
import type { OperationLog } from '@/api/admin'

const loading = ref(false)
const logs = ref<OperationLog[]>([])
const filters = reactive({ action: '' })
const pagination = reactive({ page: 1, limit: 20, total: 0 })

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await adminApi.getLogs({
      page: pagination.page,
      limit: pagination.limit,
      action: filters.action || undefined
    })
    if (res.success && res.data) {
      logs.value = res.data.logs
      pagination.total = res.data.pagination.total
    }
  } catch {
    ElMessage.error('获取日志失败')
  } finally {
    loading.value = false
  }
}

const exportLogs = () => {
  ElMessage.info('日志导出功能开发中')
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    LOGIN: '登录',
    USER_UPDATE: '用户管理',
    COURSE_REVIEW: '课程审核',
    PROBLEM_REVIEW: '题目审核',
    COMMUNITY_MODERATE: '社区管理',
    SETTINGS_UPDATE: '系统设置'
  }
  return labels[action] || action
}

const getActionType = (action: string) => {
  const types: Record<string, string> = {
    LOGIN: 'primary',
    USER_UPDATE: 'warning',
    COURSE_REVIEW: 'success',
    PROBLEM_REVIEW: 'success',
    COMMUNITY_MODERATE: 'danger',
    SETTINGS_UPDATE: 'info'
  }
  return types[action] || 'info'
}

const formatDate = (d: string) => new Date(d).toLocaleString('zh-CN')

const resetFilters = () => {
  filters.action = ''
  pagination.page = 1
  fetchLogs()
}

onMounted(fetchLogs)
</script>

<style scoped>
.admin-logs { padding: 20px; }
.page-header { margin-bottom: 20px; }
.filter-card { margin-bottom: 20px; }
</style>
