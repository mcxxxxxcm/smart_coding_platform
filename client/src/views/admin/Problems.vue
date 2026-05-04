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
          <el-button type="warning" @click="batchQualityCheck" :loading="qualityLoading">🔧 AI 质量检测</el-button>
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
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'published'" type="success" size="small" @click="approveProblem(row)">通过</el-button>
            <el-button v-if="row.status !== 'published'" type="danger" size="small" @click="rejectProblem(row)">拒绝</el-button>
            <el-button type="warning" size="small" @click="checkQuality(row)" :loading="qualityMap[row.id]">AI检测</el-button>
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

    <el-dialog v-model="qualityDialogVisible" title="AI 题目质量检测报告" width="600px">
      <div v-if="qualityResult">
        <div class="quality-score">
          <el-progress type="circle" :percentage="qualityResult.overall_score || 0" :width="80" :stroke-width="8"
            :color="qualityResult.overall_score >= 70 ? '#67c23a' : qualityResult.overall_score >= 40 ? '#e6a23c' : '#f56c6c'" />
          <span class="score-label">综合评分</span>
        </div>
        <div v-if="qualityResult.dimensions" class="quality-dimensions">
          <div v-for="(dim, key) in qualityResult.dimensions" :key="key" class="dim-item">
            <span class="dim-name">{{ getDimLabel(key as string) }}</span>
            <el-progress :percentage="dim.score || 0" :stroke-width="8" style="flex: 1" />
            <div v-if="dim.issues?.length" class="dim-issues">
              <el-tag v-for="issue in dim.issues" :key="issue" type="danger" size="small" style="margin: 2px">{{ issue }}</el-tag>
            </div>
          </div>
        </div>
        <div v-if="qualityResult.critical_issues?.length" class="quality-section">
          <h4>严重问题</h4>
          <el-alert v-for="issue in qualityResult.critical_issues" :key="issue" :title="issue" type="error" :closable="false" style="margin-bottom: 8px" />
        </div>
        <div v-if="qualityResult.improvement_suggestions?.length" class="quality-section">
          <h4>改进建议</h4>
          <el-alert v-for="s in qualityResult.improvement_suggestions" :key="s" :title="s" type="warning" :closable="false" style="margin-bottom: 8px" />
        </div>
      </div>
      <div v-else-if="batchQualityResult">
        <div class="batch-summary">
          <el-tag type="success">良好: {{ batchQualityResult.summary?.good || 0 }}</el-tag>
          <el-tag type="warning">警告: {{ batchQualityResult.summary?.warning || 0 }}</el-tag>
          <el-tag type="danger">较差: {{ batchQualityResult.summary?.poor || 0 }}</el-tag>
        </div>
        <div v-for="r in batchQualityResult.results" :key="r.id" class="batch-item">
          <span>#{{ r.id }}</span>
          <el-tag :type="r.quality === 'good' ? 'success' : r.quality === 'warning' ? 'warning' : 'danger'" size="small">
            {{ r.quality === 'good' ? '良好' : r.quality === 'warning' ? '警告' : '较差' }}
          </el-tag>
          <span v-if="r.issues?.length" class="batch-issues">{{ r.issues.join(', ') }}</span>
        </div>
        <div v-if="batchQualityResult.recommendations?.length" class="quality-section" style="margin-top: 12px">
          <h4>总体建议</h4>
          <ul><li v-for="r in batchQualityResult.recommendations" :key="r">{{ r }}</li></ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/admin'
import { aiApi } from '@/api/ai'
import type { AdminProblem } from '@/api/admin'

const loading = ref(false)
const qualityLoading = ref(false)
const qualityDialogVisible = ref(false)
const qualityResult = ref<any>(null)
const batchQualityResult = ref<any>(null)
const qualityMap = ref<Record<number, boolean>>({})
const problems = ref<AdminProblem[]>([])
const filters = reactive({ difficulty: '', status: '' })
const pagination = reactive({ page: 1, limit: 10, total: 0 })

const getDimLabel = (key: string) => {
  const m: Record<string, string> = { clarity: '清晰度', test_coverage: '测试覆盖', difficulty_accuracy: '难度准确性', completeness: '完整性' }
  return m[key] || key
}

const checkQuality = async (problem: AdminProblem) => {
  qualityMap.value[problem.id] = true
  qualityResult.value = null
  batchQualityResult.value = null
  qualityDialogVisible.value = true
  try {
    const res = await aiApi.checkProblemQuality(problem.id)
    qualityResult.value = res.data
  } catch {
    ElMessage.error('质量检测失败')
  } finally {
    qualityMap.value[problem.id] = false
  }
}

const batchQualityCheck = async () => {
  qualityLoading.value = true
  qualityResult.value = null
  batchQualityResult.value = null
  qualityDialogVisible.value = true
  try {
    const res = await aiApi.batchCheckProblemQuality()
    batchQualityResult.value = res.data
  } catch {
    ElMessage.error('批量质量检测失败')
  } finally {
    qualityLoading.value = false
  }
}

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
.quality-score { text-align: center; margin-bottom: 16px; .score-label { display: block; margin-top: 8px; font-size: 14px; color: #909399; } }
.quality-dimensions { .dim-item { margin-bottom: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; .dim-name { width: 80px; font-size: 13px; text-align: right; } .dim-issues { width: 100%; padding-left: 88px; } } }
.quality-section { margin-top: 16px; h4 { font-size: 14px; margin: 0 0 8px; } ul { margin: 0; padding-left: 18px; li { font-size: 13px; line-height: 2; } } }
.batch-summary { display: flex; gap: 12px; margin-bottom: 16px; }
.batch-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; .batch-issues { color: #909399; } }
</style>
