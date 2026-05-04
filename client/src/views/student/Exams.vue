<template>
  <div class="student-exams-page">
    <div class="page-header">
      <h2>考试中心</h2>
    </div>

    <el-tabs v-model="activeTab" class="exam-tabs">
      <el-tab-pane label="考试中心" name="exams">
        <el-card shadow="never" class="filter-card">
          <el-form :inline="true" :model="filters">
            <el-form-item label="考试名称">
              <el-input v-model="filters.search" placeholder="搜索考试" clearable @keyup.enter="fetchExams" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchExams">搜索</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-row :gutter="20">
          <el-col :span="8" v-for="exam in exams" :key="exam.id">
            <el-card
              shadow="hover"
              class="exam-card"
              :class="['exam-card--' + getTimeStatus(exam)]"
              @click="viewExam(exam)"
            >
              <template #header>
                <div class="exam-header">
                  <span class="exam-title">{{ exam.title }}</span>
                  <el-tag :type="getTimeStatusType(exam)" size="small" effect="dark">
                    {{ getTimeStatusText(exam) }}
                  </el-tag>
                </div>
              </template>
              <div class="exam-content">
                <div class="exam-info">
                  <div class="info-item">
                    <el-icon><Clock /></el-icon>
                    <span>{{ exam.duration }}分钟</span>
                  </div>
                  <div class="info-item">
                    <el-icon><Star /></el-icon>
                    <span>总分：{{ exam.total_score }}</span>
                  </div>
                  <div class="info-item">
                    <el-icon><User /></el-icon>
                    <span>{{ exam.participant_count || 0 }}人已参加</span>
                  </div>
                </div>
                <div class="exam-time" v-if="exam.start_time">
                  <div class="time-label">
                    <el-icon><Calendar /></el-icon>
                    <span>开放时间</span>
                  </div>
                  <div class="time-value">
                    {{ formatDateTime(exam.start_time) }}
                    <template v-if="exam.end_time"> ~ {{ formatDateTime(exam.end_time) }}</template>
                  </div>
                </div>
                <div class="exam-time" v-else>
                  <div class="time-label">
                    <el-icon><Calendar /></el-icon>
                    <span>开放时间</span>
                  </div>
                  <div class="time-value">未设置</div>
                </div>
                <div class="exam-countdown" v-if="getCountdown(exam)">
                  <el-icon><Timer /></el-icon>
                  <span class="countdown-text">{{ getCountdown(exam) }}</span>
                </div>
                <div class="exam-remaining" v-if="getRemainingTime(exam)">
                  <el-icon><Timer /></el-icon>
                  <span class="remaining-text">{{ getRemainingTime(exam) }}</span>
                </div>
                <div class="exam-desc">{{ exam.description || '暂无描述' }}</div>
              </div>
              <template #footer>
                <div class="exam-footer">
                  <span class="teacher">教师：{{ exam.teacher_name }}</span>
                  <el-button
                    :type="getExamButtonType(exam)"
                    size="small"
                    :disabled="!canStartExam(exam)"
                    @click.stop="startExam(exam)"
                  >
                    {{ getExamButtonText(exam) }}
                  </el-button>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>

        <div class="pagination-wrapper" v-if="pagination.total > 0">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[6, 12, 24]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchExams"
            @current-change="fetchExams"
          />
        </div>

        <el-dialog v-model="examDetailVisible" title="考试详情" width="600px">
          <el-descriptions :column="1" border v-if="currentExam">
            <el-descriptions-item label="考试名称">{{ currentExam.title }}</el-descriptions-item>
            <el-descriptions-item label="考试描述">{{ currentExam.description || '无' }}</el-descriptions-item>
            <el-descriptions-item label="考试时长">{{ currentExam.duration }}分钟</el-descriptions-item>
            <el-descriptions-item label="总分">{{ currentExam.total_score }}分</el-descriptions-item>
            <el-descriptions-item label="及格分">{{ currentExam.passing_score }}分</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ currentExam.start_time ? formatDateTime(currentExam.start_time) : '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ currentExam.end_time ? formatDateTime(currentExam.end_time) : '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="教师">{{ currentExam.teacher_name }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getTimeStatusType(currentExam)" size="small" effect="dark">
                {{ getTimeStatusText(currentExam) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="倒计时" v-if="getCountdown(currentExam)">
              <span class="detail-countdown">{{ getCountdown(currentExam) }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <template #footer>
            <el-button @click="examDetailVisible = false">关闭</el-button>
            <el-button
              :type="getExamButtonType(currentExam!)"
              @click="startExam(currentExam!)"
              :disabled="!canStartExam(currentExam!)"
            >
              {{ getExamButtonText(currentExam!) }}
            </el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <el-tab-pane label="考试记录" name="history">
        <el-tabs v-model="historyTab" @tab-change="switchHistoryTab">
          <el-tab-pane label="考试历史" name="history">
            <el-card>
              <el-table :data="examHistory" v-loading="historyLoading" stripe>
                <el-table-column prop="exam_title" label="考试名称" min-width="180" />
                <el-table-column prop="teacher_name" label="教师" width="100" />
                <el-table-column label="得分" width="100">
                  <template #default="{ row }">
                    <span :class="row.total_score >= row.passing_score ? 'pass-score' : 'fail-score'">
                      {{ row.total_score }} / {{ row.exam_total_score }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="结果" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.total_score >= row.passing_score ? 'success' : 'danger'" size="small">
                      {{ row.total_score >= row.passing_score ? '通过' : '未通过' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="submit_time" label="交卷时间" width="180">
                  <template #default="{ row }">{{ formatDate(row.submit_time) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="viewDetail(row)">查看详情</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-pagination
                v-model:current-page="historyPagination.page"
                v-model:page-size="historyPagination.limit"
                :total="historyPagination.total"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next"
                @size-change="fetchHistory"
                @current-change="fetchHistory"
                style="margin-top: 20px; justify-content: flex-end"
              />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="错题本" name="wrong">
            <el-empty v-if="wrongQuestions.length === 0 && !wrongLoading" description="暂无错题记录，继续努力！" />
            <div v-else>
              <el-alert
                type="info"
                :closable="false"
                style="margin-bottom: 20px"
                title="以下是你在考试中未完全答对的题目，点击题目可以查看详细信息和测试案例"
              />

              <el-collapse v-model="activeWrong" v-loading="wrongLoading">
                <el-collapse-item
                  v-for="item in wrongQuestions"
                  :key="item.problem_id"
                  :name="item.problem_id"
                >
                  <template #title>
                    <div class="wrong-question-header">
                      <el-tag :type="item.status === 'partial_correct' ? 'warning' : 'danger'" size="small" style="margin-right: 10px">
                        {{ item.status === 'partial_correct' ? '部分通过' : '未通过' }}
                      </el-tag>
                      <span class="question-title">{{ item.problem_title }}</span>
                      <el-tag :type="getDifficultyType(item.difficulty)" size="small" style="margin-left: 10px">
                        {{ getDifficultyLabel(item.difficulty) }}
                      </el-tag>
                      <span style="margin-left: auto; color: #909399; font-size: 13px">
                        得分: {{ item.score }} / {{ item.max_score }}
                      </span>
                      <span style="margin-left: 15px; color: #909399; font-size: 13px">
                        {{ item.exam_title }}
                      </span>
                    </div>
                  </template>

                  <div class="wrong-question-detail">
                    <div class="detail-section">
                      <h4>题目描述</h4>
                      <div v-html="renderDescription(item.description)" class="problem-desc"></div>
                    </div>

                    <div class="detail-section" v-if="item.test_cases && item.test_cases.length > 0">
                      <h4>测试案例</h4>
                      <el-table :data="item.test_cases" size="small" stripe style="width: 100%">
                        <el-table-column label="输入" min-width="200">
                          <template #default="{ row }">
                            <pre class="code-block">{{ row.input }}</pre>
                          </template>
                        </el-table-column>
                        <el-table-column label="期望输出" min-width="200">
                          <template #default="{ row }">
                            <pre class="code-block">{{ row.expected }}</pre>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>

                    <div class="detail-section" v-if="item.code">
                      <h4>你的代码</h4>
                      <pre class="code-block user-code">{{ item.code }}</pre>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-tab-pane>
        </el-tabs>

        <el-dialog v-model="detailVisible" title="考试详情" width="800px">
          <div v-if="currentDetail">
            <h3>{{ currentDetail.exam_title }}</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="总分">
                {{ currentDetail.total_score }} / {{ currentDetail.exam_total_score }}
              </el-descriptions-item>
              <el-descriptions-item label="及格分">{{ currentDetail.passing_score }}</el-descriptions-item>
              <el-descriptions-item label="结果">
                <el-tag :type="currentDetail.total_score >= currentDetail.passing_score ? 'success' : 'danger'">
                  {{ currentDetail.total_score >= currentDetail.passing_score ? '通过' : '未通过' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="交卷时间">{{ formatDate(currentDetail.submit_time) }}</el-descriptions-item>
            </el-descriptions>

            <h4 style="margin-top: 20px">各题详情</h4>
            <el-table :data="currentDetail.submissions || []" stripe size="small">
              <el-table-column prop="problem_title" label="题目" min-width="150" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="score" label="得分" width="80" />
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="viewProblemDetail(row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, Star, User, Calendar, Timer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { examApi } from '@/api/exam'
import type { Exam } from '@/api/exam'
import { marked } from 'marked'

const router = useRouter()

const activeTab = ref('exams')
const historyTab = ref('history')
const examDetailVisible = ref(false)
const currentExam = ref<Exam | null>(null)
const historyLoading = ref(false)
const wrongLoading = ref(false)
const detailVisible = ref(false)
const currentDetail = ref<any>(null)
const activeWrong = ref<number[]>([])

const exams = ref<Exam[]>([])
const filters = reactive({
  search: ''
})
const pagination = reactive({
  page: 1,
  limit: 6,
  total: 0
})

const examHistory = ref<any[]>([])
const wrongQuestions = ref<any[]>([])
const historyPagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

type TimeStatus = 'not_open' | 'in_progress' | 'ended' | 'no_time'

const now = ref(Date.now())
let timerHandle: number | null = null

const startGlobalTimer = () => {
  timerHandle = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
}

const getTimeStatus = (exam: Exam): TimeStatus => {
  if (exam.status === 'draft') return 'not_open'

  const currentTime = now.value
  const startTime = exam.start_time ? new Date(exam.start_time).getTime() : null
  const endTime = exam.end_time ? new Date(exam.end_time).getTime() : null

  if (!startTime && !endTime) return 'no_time'
  if (startTime && currentTime < startTime) return 'not_open'
  if (endTime && currentTime > endTime) return 'ended'
  return 'in_progress'
}

const getTimeStatusText = (exam: Exam): string => {
  const map: Record<TimeStatus, string> = {
    not_open: '未开放',
    in_progress: '进行中',
    ended: '已过期',
    no_time: '进行中'
  }
  return map[getTimeStatus(exam)]
}

const getTimeStatusType = (exam: Exam): string => {
  const map: Record<TimeStatus, string> = {
    not_open: 'warning',
    in_progress: 'success',
    ended: 'info',
    no_time: 'success'
  }
  return map[getTimeStatus(exam)]
}

const getCountdown = (exam: Exam): string => {
  const status = getTimeStatus(exam)
  if (status !== 'not_open' || !exam.start_time) return ''

  const diff = new Date(exam.start_time).getTime() - now.value
  if (diff <= 0) return ''

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0) return `${days}天${hours}小时后开放`
  if (hours > 0) return `${hours}小时${minutes}分钟后开放`
  if (minutes > 0) return `${minutes}分${seconds}秒后开放`
  return `${seconds}秒后开放`
}

const getRemainingTime = (exam: Exam): string => {
  const status = getTimeStatus(exam)
  if (status !== 'in_progress' || !exam.end_time) return ''

  const diff = new Date(exam.end_time).getTime() - now.value
  if (diff <= 0) return ''

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `剩余${days}天${hours}小时`
  if (hours > 0) return `剩余${hours}小时${minutes}分钟`
  return `剩余${minutes}分钟`
}

const canStartExam = (exam: Exam): boolean => {
  if (exam.status === 'draft') return false
  const status = getTimeStatus(exam)
  return status === 'in_progress' || status === 'no_time'
}

const getExamButtonText = (exam: Exam): string => {
  const status = getTimeStatus(exam)
  const map: Record<TimeStatus, string> = {
    not_open: '未开放',
    in_progress: '开始考试',
    ended: '已过期',
    no_time: '开始考试'
  }
  return map[status]
}

const getExamButtonType = (exam: Exam): string => {
  const status = getTimeStatus(exam)
  const map: Record<TimeStatus, string> = {
    not_open: 'info',
    in_progress: 'primary',
    ended: 'info',
    no_time: 'primary'
  }
  return map[status]
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const fetchExams = async () => {
  try {
    const res = await examApi.getExams({
      page: pagination.page,
      limit: pagination.limit,
      status: 'published',
      ...filters
    })
    exams.value = res.data || []
    if (res.pagination) {
      pagination.total = res.pagination.total
    }
  } catch (error) {
    console.error('获取考试列表失败:', error)
  }
}

const resetFilters = () => {
  filters.search = ''
  pagination.page = 1
  fetchExams()
}

const viewExam = (exam: Exam) => {
  currentExam.value = exam
  examDetailVisible.value = true
}

const startExam = (exam: Exam) => {
  if (!canStartExam(exam)) {
    const status = getTimeStatus(exam)
    if (status === 'not_open') {
      ElMessage.warning('考试尚未开放，请在开放时间内参加')
    } else if (status === 'ended') {
      ElMessage.warning('考试已过期')
    }
    return
  }
  router.push(`/exams/${exam.id}/take`)
}

const fetchHistory = async () => {
  historyLoading.value = true
  try {
    const res = await examApi.getExamHistory({
      page: historyPagination.page,
      limit: historyPagination.limit
    })
    if (res.success && res.data) {
      examHistory.value = Array.isArray(res.data) ? res.data : []
      historyPagination.total = res.data.pagination?.total || 0
    }
  } catch {
    ElMessage.error('获取考试历史失败')
  } finally {
    historyLoading.value = false
  }
}

const fetchWrongQuestions = async () => {
  wrongLoading.value = true
  try {
    const res = await examApi.getWrongQuestions()
    if (res.success && res.data) {
      wrongQuestions.value = res.data
    }
  } catch {
    ElMessage.error('获取错题记录失败')
  } finally {
    wrongLoading.value = false
  }
}

const switchHistoryTab = (tab: string) => {
  if (tab === 'wrong' && wrongQuestions.value.length === 0) {
    fetchWrongQuestions()
  }
}

const viewDetail = async (record: any) => {
  try {
    const res = await examApi.getExamSubmissionDetail(record.attempt_id)
    if (res.success && res.data) {
      currentDetail.value = res.data
      detailVisible.value = true
    }
  } catch {
    ElMessage.error('获取详情失败')
  }
}

const viewProblemDetail = (submission: any) => {
  activeWrong.value = [submission.problem_id]
  historyTab.value = 'wrong'
  detailVisible.value = false
  if (wrongQuestions.value.length === 0) {
    fetchWrongQuestions()
  }
}

const renderDescription = (desc: string) => {
  if (!desc) return ''
  return marked(desc)
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    accepted: '通过',
    wrong_answer: '答案错误',
    partial_correct: '部分通过',
    runtime_error: '运行错误',
    time_limit_exceeded: '超时',
    memory_limit_exceeded: '内存超限'
  }
  return labels[status] || status
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    accepted: 'success',
    wrong_answer: 'danger',
    partial_correct: 'warning',
    runtime_error: 'danger',
    time_limit_exceeded: 'warning',
    memory_limit_exceeded: 'warning'
  }
  return types[status] || 'info'
}

const getDifficultyLabel = (d: string) => {
  const labels: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
  return labels[d] || d
}

const getDifficultyType = (d: string) => {
  const types: Record<string, string> = { easy: 'success', medium: 'warning', hard: 'danger' }
  return types[d] || 'info'
}

const formatDate = (d: string) => {
  return d ? new Date(d).toLocaleString('zh-CN') : '-'
}

onMounted(() => {
  startGlobalTimer()
  fetchExams()
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

.student-exams-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }
  
  .exam-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }
  
  .filter-card {
    margin-bottom: 20px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
  }
  
  .exam-card {
    margin-bottom: 20px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid transparent;
    
    &:hover {
      transform: translateY(-4px);
    }

    &.exam-card--not_open {
      border-color: rgba(230, 162, 60, 0.3);
      .exam-header .exam-title { color: $text-secondary; }
    }

    &.exam-card--in_progress {
      border-color: rgba(103, 194, 58, 0.3);
    }

    &.exam-card--ended {
      border-color: rgba(144, 147, 153, 0.3);
      opacity: 0.75;
      .exam-header .exam-title { color: $text-secondary; }
    }
    
    .exam-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .exam-title {
        font-weight: 600;
        font-size: 16px;
      }
    }
    
    .exam-content {
      .exam-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: $text-secondary;
        }
      }
      
      .exam-time {
        margin-bottom: 12px;
        
        .time-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: $text-secondary;
          margin-bottom: 4px;
        }
        
        .time-value {
          font-size: 14px;
          color: $text-primary;
        }
      }

      .exam-countdown {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        margin-bottom: 12px;
        background: linear-gradient(135deg, #fdf6ec 0%, #fef0e0 100%);
        border-radius: 6px;
        border: 1px solid rgba(230, 162, 60, 0.2);
        color: #e6a23c;
        font-size: 13px;

        .countdown-text {
          font-weight: 500;
        }
      }

      .exam-remaining {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        margin-bottom: 12px;
        background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
        border-radius: 6px;
        border: 1px solid rgba(103, 194, 58, 0.2);
        color: #67c23a;
        font-size: 13px;

        .remaining-text {
          font-weight: 500;
        }
      }
      
      .exam-desc {
        font-size: 13px;
        color: $text-secondary;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
    
    .exam-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .teacher {
        font-size: 13px;
        color: $text-secondary;
      }
    }
  }
  
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

.pass-score {
  color: #67c23a;
  font-weight: bold;
}

.fail-score {
  color: #f56c6c;
  font-weight: bold;
}

.detail-countdown {
  color: #e6a23c;
  font-weight: 600;
  font-size: 14px;
}

.wrong-question-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding-right: 20px;
}

.question-title {
  font-weight: 500;
  font-size: 14px;
}

.wrong-question-detail {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #303133;
}

.problem-desc {
  line-height: 1.8;
}

.problem-desc :deep(h3) {
  margin: 16px 0 8px;
  font-size: 15px;
}

.problem-desc :deep(code) {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.problem-desc :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px 16px;
  border-radius: 6px;
  overflow-x: auto;
}

.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.user-code {
  max-height: 300px;
  overflow-y: auto;
}

:deep(.el-collapse-item__header) {
  padding: 12px 16px;
}
</style>
