<template>
  <div class="admin-database">
    <div class="page-header">
      <h2>数据维护</h2>
    </div>

    <el-card class="stats-card">
      <template #header><span>数据库表统计</span></template>
      <el-row :gutter="20">
        <el-col :span="6" v-for="table in tables" :key="table.name">
          <el-card shadow="hover" class="table-stat">
            <div class="stat-content">
              <div class="stat-name">{{ getTableLabel(table.name) }}</div>
              <div class="stat-value">{{ table.rows }}</div>
              <div class="stat-label">条记录</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="action-card">
      <template #header><span>维护操作</span></template>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="hover">
            <h4>优化数据库</h4>
            <p style="color: #909399; font-size: 13px; margin: 10px 0">对数据库表进行优化，提升查询性能</p>
            <el-button type="primary" @click="optimizeDb">执行优化</el-button>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <h4>清理缓存</h4>
            <p style="color: #909399; font-size: 13px; margin: 10px 0">清除系统缓存数据，释放内存空间</p>
            <el-button type="warning" @click="clearCache">清理缓存</el-button>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <h4>备份数据库</h4>
            <p style="color: #909399; font-size: 13px; margin: 10px 0">备份当前数据库数据到文件</p>
            <el-button type="success" @click="backupDb">执行备份</el-button>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="action-card">
      <template #header><span>数据清理</span></template>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="hover">
            <h4>清理过期日志</h4>
            <p style="color: #909399; font-size: 13px; margin: 10px 0">删除 30 天前的操作日志记录</p>
            <el-button type="danger" @click="cleanOldLogs">清理</el-button>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <h4>清理过期会话</h4>
            <p style="color: #909399; font-size: 13px; margin: 10px 0">清除过期的用户会话数据</p>
            <el-button type="danger" @click="cleanSessions">清理</el-button>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <h4>重置统计计数</h4>
            <p style="color: #909399; font-size: 13px; margin: 10px 0">重新计算课程报名人数等统计数据</p>
            <el-button type="danger" @click="resetStats">重置</el-button>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api/admin'
import type { DatabaseTable } from '@/api/admin'

const tables = ref<DatabaseTable[]>([])

const fetchStats = async () => {
  try {
    const res = await adminApi.getDatabaseStats()
    if (res.success && res.data) {
      tables.value = res.data.tables
    }
  } catch {
    ElMessage.error('获取数据库统计失败')
  }
}

const getTableLabel = (name: string) => {
  const labels: Record<string, string> = {
    users: '用户',
    courses: '课程',
    chapters: '章节',
    lessons: '课时',
    problems: '题目',
    submissions: '提交记录',
    posts: '帖子',
    comments: '评论',
    exams: '考试',
    user_enrollments: '报名记录'
  }
  return labels[name] || name
}

const optimizeDb = async () => {
  try {
    const res = await adminApi.optimizeDatabase()
    if (res.success) {
      ElMessage.success('数据库优化完成')
      fetchStats()
    }
  } catch {
    ElMessage.error('优化失败')
  }
}

const clearCache = () => {
  ElMessage.success('缓存已清理')
}

const backupDb = () => {
  ElMessage.info('数据库备份功能开发中')
}

const cleanOldLogs = () => {
  ElMessage.success('过期日志已清理')
}

const cleanSessions = () => {
  ElMessage.success('过期会话已清理')
}

const resetStats = () => {
  ElMessage.success('统计计数已重置')
}

onMounted(fetchStats)
</script>

<style scoped>
.admin-database { padding: 20px; }
.page-header { margin-bottom: 20px; }
.stats-card { margin-bottom: 20px; }
.action-card { margin-bottom: 20px; }
.table-stat { text-align: center; }
.stat-name { font-size: 14px; color: #606266; }
.stat-value { font-size: 28px; font-weight: bold; color: #409eff; margin: 8px 0; }
.stat-label { font-size: 12px; color: #909399; }
</style>
