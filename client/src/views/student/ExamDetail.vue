<template>
  <div class="exam-detail-page">
    <div class="page-header">
      <h2>{{ exam?.title || '考试详情' }}</h2>
      <el-tag :type="getStatusType(exam?.status || 'draft')" size="large">
        {{ getStatusText(exam?.status || 'draft') }}
      </el-tag>
    </div>

    <el-card shadow="hover" class="exam-info-card">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="考试时长">{{ exam?.duration }}分钟</el-descriptions-item>
        <el-descriptions-item label="总分">{{ exam?.total_score }}分</el-descriptions-item>
        <el-descriptions-item label="及格分">{{ exam?.passing_score }}分</el-descriptions-item>
        <el-descriptions-item label="教师">{{ exam?.teacher_name }}</el-descriptions-item>
        <el-descriptions-item label="开始时间" :span="2">
          {{ exam?.start_time ? formatDateTime(exam.start_time) : '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间" :span="2">
          {{ exam?.end_time ? formatDateTime(exam.end_time) : '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="考试说明" :span="2">
          {{ exam?.description || '暂无说明' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="hover" class="questions-card" v-if="exam?.questions?.length">
      <template #header>
        <span>考试题目（共{{ exam.questions.length }}题）</span>
      </template>
      <el-table :data="exam.questions" stripe>
        <el-table-column type="index" label="题号" width="60" />
        <el-table-column prop="title" label="题目名称" min-width="200" />
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.difficulty)" size="small">
              {{ getDifficultyText(row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="分值" width="80" align="center" />
      </el-table>
    </el-card>

    <div class="action-buttons">
      <el-button @click="$router.back()" size="large">返回</el-button>
      <el-button 
        type="primary" 
        size="large" 
        @click="startExam"
        :disabled="!canStartExam"
      >
        {{ canStartExam ? '开始考试' : '考试未开放' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { examApi } from '@/api/exam'
import type { Exam } from '@/api/exam'

const route = useRoute()
const router = useRouter()
const examId = ref<number>(parseInt(route.params.id as string))

const exam = ref<Exam & { questions?: any[] } | null>(null)

const canStartExam = computed(() => {
  if (!exam.value || exam.value.status !== 'published') return false
  
  // 检查是否已经提交过该考试
  if (exam.value.hasSubmitted) return false
  
  const now = new Date()
  const startTime = exam.value.start_time ? new Date(exam.value.start_time) : null
  const endTime = exam.value.end_time ? new Date(exam.value.end_time) : null
  
  if (startTime && now < startTime) return false
  if (endTime && now > endTime) return false
  
  return true
})

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    published: '进行中',
    ended: '已结束'
  }
  return map[status] || status
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    published: 'success',
    ended: 'warning'
  }
  return map[status] || 'info'
}

const getDifficultyText = (difficulty: string) => {
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty] || difficulty
}

const getDifficultyType = (difficulty: string) => {
  const map: Record<string, string> = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return map[difficulty] || 'info'
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const loadExam = async () => {
  try {
    const res = await examApi.getExamById(examId.value)
    exam.value = res.data as any
  } catch (error) {
    console.error('加载考试失败:', error)
    ElMessage.error('加载考试失败')
  }
}

const startExam = async () => {
  if (!canStartExam.value) {
    ElMessage.warning('考试暂未开放')
    return
  }
  
  try {
    ElMessage.success('正在进入考试...')
    console.log('跳转到考试页面:', `/exams/${examId.value}/take`)
    // 跳转到考试答题页面
    await router.push(`/exams/${examId.value}/take`)
    console.log('跳转成功')
  } catch (error) {
    console.error('跳转失败:', error)
    ElMessage.error('进入考试失败，请刷新页面重试')
  }
}

onMounted(loadExam)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.exam-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }
  
  .exam-info-card {
    margin-bottom: 20px;
  }
  
  .questions-card {
    margin-bottom: 20px;
  }
  
  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 30px;
  }
}
</style>
