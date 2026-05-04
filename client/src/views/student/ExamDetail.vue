<template>
  <div class="exam-detail-page">
    <div class="page-header">
      <h2>{{ exam?.title || '考试详情' }}</h2>
      <el-tag :type="getTimeStatusType()" size="large" effect="dark">
        {{ getTimeStatusText() }}
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
        <el-descriptions-item label="倒计时" :span="2" v-if="countdownText">
          <span class="countdown-value">{{ countdownText }}</span>
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
        :type="canStartExam ? 'primary' : 'info'"
        size="large"
        @click="startExam"
        :disabled="!canStartExam"
      >
        {{ getButtonText() }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { examApi } from '@/api/exam'
import type { Exam } from '@/api/exam'

const route = useRoute()
const router = useRouter()
const examId = ref<number>(parseInt(route.params.id as string))

const exam = ref<Exam & { questions?: any[]; hasSubmitted?: boolean } | null>(null)

const now = ref(Date.now())
let timerHandle: number | null = null

type TimeStatus = 'not_open' | 'in_progress' | 'ended' | 'no_time'

const getTimeStatus = (): TimeStatus => {
  if (!exam.value) return 'not_open'
  if (exam.value.status === 'draft') return 'not_open'

  const currentTime = now.value
  const startTime = exam.value.start_time ? new Date(exam.value.start_time).getTime() : null
  const endTime = exam.value.end_time ? new Date(exam.value.end_time).getTime() : null

  if (!startTime && !endTime) return 'no_time'
  if (startTime && currentTime < startTime) return 'not_open'
  if (endTime && currentTime > endTime) return 'ended'
  return 'in_progress'
}

const getTimeStatusText = (): string => {
  const map: Record<TimeStatus, string> = {
    not_open: '未开放',
    in_progress: '进行中',
    ended: '已过期',
    no_time: '进行中'
  }
  return map[getTimeStatus()]
}

const getTimeStatusType = (): string => {
  const map: Record<TimeStatus, string> = {
    not_open: 'warning',
    in_progress: 'success',
    ended: 'info',
    no_time: 'success'
  }
  return map[getTimeStatus()]
}

const countdownText = computed(() => {
  const status = getTimeStatus()
  if (status !== 'not_open' || !exam.value?.start_time) return ''

  const diff = new Date(exam.value.start_time).getTime() - now.value
  if (diff <= 0) return ''

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0) return `${days}天${hours}小时${minutes}分${seconds}秒后开放`
  if (hours > 0) return `${hours}小时${minutes}分${seconds}秒后开放`
  if (minutes > 0) return `${minutes}分${seconds}秒后开放`
  return `${seconds}秒后开放`
})

const canStartExam = computed(() => {
  if (!exam.value) return false
  if (exam.value.status === 'draft') return false
  if ((exam.value as any).hasSubmitted) return false

  const status = getTimeStatus()
  return status === 'in_progress' || status === 'no_time'
})

const getButtonText = (): string => {
  const status = getTimeStatus()
  const map: Record<TimeStatus, string> = {
    not_open: '未开放',
    in_progress: '开始考试',
    ended: '已过期',
    no_time: '开始考试'
  }
  if ((exam.value as any)?.hasSubmitted) return '已提交'
  return map[status]
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
    const status = getTimeStatus()
    if (status === 'not_open') {
      ElMessage.warning('考试尚未开放，请在开放时间内参加')
    } else if (status === 'ended') {
      ElMessage.warning('考试已过期')
    } else if ((exam.value as any)?.hasSubmitted) {
      ElMessage.warning('您已经提交过该考试')
    }
    return
  }

  try {
    ElMessage.success('正在进入考试...')
    await router.push(`/exams/${examId.value}/take`)
  } catch (error) {
    console.error('跳转失败:', error)
    ElMessage.error('进入考试失败，请刷新页面重试')
  }
}

onMounted(() => {
  timerHandle = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
  loadExam()
})

onUnmounted(() => {
  if (timerHandle) {
    clearInterval(timerHandle)
    timerHandle = null
  }
})
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

  .countdown-value {
    color: #e6a23c;
    font-weight: 600;
    font-size: 15px;
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
