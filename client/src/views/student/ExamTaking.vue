<template>
  <div class="exam-taking-page">
    <div class="exam-header-bar">
      <div class="exam-info">
        <h2>{{ exam?.title }}</h2>
        <div class="exam-meta">
          <span>剩余时间：<el-tag :type="remainingTime <= 300 ? 'danger' : 'warning'">{{ formattedTime }}</el-tag></span>
          <span>已用时间：<el-tag>{{ usedTime }}</el-tag></span>
        </div>
      </div>
      <div class="exam-actions">
        <el-button type="primary" size="large" @click="showConfirmSubmit">交卷</el-button>
      </div>
    </div>

    <div class="exam-content">
      <div class="questions-nav">
        <h3>答题卡</h3>
        <div class="question-buttons">
          <el-button
            v-for="(q, index) in exam?.questions"
            :key="q.id"
            :type="currentQuestionIndex === index ? 'primary' : 'default'"
            :class="{ answered: answers[q.problem_id] }"
            @click="currentQuestionIndex = index"
            circle
          >
            {{ index + 1 }}
          </el-button>
        </div>
        <div class="legend">
          <div class="legend-item"><span class="dot current"></span><span>当前</span></div>
          <div class="legend-item"><span class="dot answered"></span><span>已答</span></div>
          <div class="legend-item"><span class="dot unanswered"></span><span>未答</span></div>
        </div>
      </div>

      <div class="question-area">
        <div v-if="currentQuestion" class="question-detail">
          <div class="question-header">
            <span class="question-title">第{{ currentQuestionIndex + 1 }}题：{{ currentQuestion.title }}</span>
            <el-tag :type="getDifficultyType(currentQuestion.difficulty)" size="small">
              {{ getDifficultyText(currentQuestion.difficulty) }}
            </el-tag>
          </div>
          <div class="question-score">分值：{{ currentQuestion.score }}分</div>

          <div class="question-description">
            <div class="desc-section" v-if="currentQuestion.description">
              <p>{{ currentQuestion.description }}</p>
            </div>

            <div class="desc-section" v-if="currentQuestion.input_format">
              <h4>输入格式</h4>
              <p>{{ currentQuestion.input_format }}</p>
            </div>

            <div class="desc-section" v-if="currentQuestion.output_format">
              <h4>输出格式</h4>
              <p>{{ currentQuestion.output_format }}</p>
            </div>

            <div class="desc-section" v-if="currentQuestion.examples?.length">
              <h4>示例</h4>
              <div v-for="(example, index) in currentQuestion.examples" :key="index" class="example-box">
                <div class="example-item">
                  <span class="label">输入：</span>
                  <pre>{{ example.input }}</pre>
                </div>
                <div class="example-item">
                  <span class="label">输出：</span>
                  <pre>{{ example.output }}</pre>
                </div>
                <div class="example-item" v-if="example.explanation">
                  <span class="label">解释：</span>
                  <span>{{ example.explanation }}</span>
                </div>
              </div>
            </div>

            <div class="desc-section" v-if="currentQuestion.constraints">
              <h4>约束条件</h4>
              <p>{{ currentQuestion.constraints }}</p>
            </div>

            <div v-if="!currentQuestion.description && !currentQuestion.examples?.length" class="no-desc">
              暂无题目描述
            </div>
          </div>

          <div class="code-editor-wrapper">
            <div class="editor-header">
              <span>代码编辑区</span>
              <el-select v-model="currentLanguage" size="small" style="width: 120px;">
                <el-option label="Python" value="python" />
                <el-option label="C/C++" value="cpp" />
              </el-select>
            </div>
            <el-input
              v-model="currentCode"
              type="textarea"
              :rows="15"
              placeholder="请在此编写代码..."
              class="code-editor"
            />
            <div class="editor-actions">
              <el-button type="success" @click="runCode" :loading="running">
                <el-icon><VideoPlay /></el-icon>
                运行代码
              </el-button>
              <el-button type="primary" @click="saveAnswer">
                <el-icon><Check /></el-icon>
                保存答案
              </el-button>
            </div>
          </div>

          <div class="console-output" v-if="output">
            <h4>运行结果</h4>
            <pre>{{ output }}</pre>
          </div>

          <div class="question-navigation">
            <el-button @click="prevQuestion" :disabled="currentQuestionIndex === 0">上一题</el-button>
            <el-button @click="nextQuestion" :disabled="currentQuestionIndex >= (exam?.questions?.length || 0) - 1">下一题</el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="submitDialogVisible" title="确认交卷" width="420px" :close-on-click-modal="false">
      <div class="submit-summary">
        <p>已答题目：<strong>{{ answeredCount }}</strong> / {{ exam?.questions?.length }}</p>
        <p>未答题目：<strong>{{ (exam?.questions?.length || 0) - answeredCount }}</strong></p>
        <el-alert type="warning" :closable="false" style="margin-top: 12px">
          交卷后将无法修改答案，请确认所有题目已作答！
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="submitDialogVisible = false">继续作答</el-button>
        <el-button type="primary" @click="submitExam">确认交卷</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exitDialogVisible" title="确认退出" width="420px" :close-on-click-modal="false">
      <el-alert type="error" :closable="false">
        <template #title>
          <strong>退出考试后不能再次进行作答！</strong>
        </template>
        退出考试将视为放弃本次考试，已作答的答案不会被保存。确定要退出吗？
      </el-alert>
      <template #footer>
        <el-button @click="exitDialogVisible = false">继续考试</el-button>
        <el-button type="danger" @click="confirmExit">确认退出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoPlay, Check } from '@element-plus/icons-vue'
import request from '@/api/request'
import { examApi } from '@/api/exam'

const route = useRoute()
const router = useRouter()
const examId = ref<number>(parseInt(route.params.id as string))

const exam = ref<any>(null)
const currentQuestionIndex = ref(0)
const currentLanguage = ref('python')
const currentCode = ref('')
const output = ref('')
const running = ref(false)
const submitDialogVisible = ref(false)
const exitDialogVisible = ref(false)

const answers = ref<Record<number, { code: string; language: string }>>({})

const timer = ref<number | null>(null)
const examStartTime = ref<Date | null>(null)
const elapsedTime = ref(0)

const currentQuestion = computed(() => {
  return exam.value?.questions?.[currentQuestionIndex.value]
})

const remainingTime = computed(() => {
  if (!exam.value) return 0
  return Math.max(0, exam.value.duration * 60 - elapsedTime.value)
})

const formattedTime = computed(() => {
  const totalSeconds = remainingTime.value
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const usedTime = computed(() => {
  const minutes = Math.floor(elapsedTime.value / 60)
  const seconds = elapsedTime.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const answeredCount = computed(() => {
  return Object.keys(answers.value).length
})

const getDifficultyText = (difficulty: string) => {
  const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
  return map[difficulty] || difficulty
}

const getDifficultyType = (difficulty: string) => {
  const map: Record<string, string> = { easy: 'success', medium: 'warning', hard: 'danger' }
  return map[difficulty] || 'info'
}

watch(currentQuestion, (q) => {
  if (q) {
    const saved = answers.value[q.problem_id]
    currentCode.value = saved?.code || q.template_code?.[currentLanguage.value] || ''
    currentLanguage.value = saved?.language || currentLanguage.value
    output.value = ''
  }
})

const loadExam = async () => {
  try {
    const res = await examApi.getExamById(examId.value)
    exam.value = res.data

    if (exam.value.hasSubmitted) {
      ElMessage.warning('您已经提交过该考试，不能再次进入')
      router.push(`/exams/${examId.value}`)
      return
    }

    const now = Date.now()
    const examStart = exam.value.start_time ? new Date(exam.value.start_time).getTime() : null
    const examEnd = exam.value.end_time ? new Date(exam.value.end_time).getTime() : null

    if (examStart && now < examStart) {
      ElMessage.warning('考试尚未开放，请在开放时间内参加')
      router.push('/exams')
      return
    }
    if (examEnd && now > examEnd) {
      ElMessage.warning('考试已过期，无法进入')
      router.push('/exams')
      return
    }

    examStartTime.value = new Date()
    startTimer()

    if (exam.value.questions?.length > 0) {
      const firstQ = exam.value.questions[0]
      currentCode.value = firstQ.template_code?.[currentLanguage.value] || ''
    }
  } catch (error) {
    console.error('加载考试失败:', error)
    ElMessage.error('加载考试失败')
    router.push('/exams')
  }
}

const startTimer = () => {
  if (timer.value) clearInterval(timer.value)
  timer.value = window.setInterval(() => {
    elapsedTime.value++
    if (exam.value && elapsedTime.value >= exam.value.duration * 60) {
      ElMessage.warning('考试时间到，自动交卷')
      submitExam()
    }
  }, 1000)
}

const saveAnswer = () => {
  if (!currentQuestion.value) return
  answers.value[currentQuestion.value.problem_id] = {
    code: currentCode.value,
    language: currentLanguage.value
  }
  ElMessage.success('答案已保存')
}

const runCode = async () => {
  if (!currentCode.value.trim()) {
    ElMessage.warning('请先编写代码')
    return
  }
  running.value = true
  try {
    const res = await request.post('/execute', {
      code: currentCode.value,
      language: currentLanguage.value
    })
    output.value = res.data?.output || '运行完成'
  } catch (error) {
    output.value = '运行失败：' + (error as any).message
  } finally {
    running.value = false
  }
}

const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) currentQuestionIndex.value--
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < (exam.value?.questions?.length || 0) - 1) currentQuestionIndex.value++
}

const showConfirmSubmit = () => {
  submitDialogVisible.value = true
}

const submitExam = async () => {
  submitDialogVisible.value = false
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }

  try {
    const submissions = Object.entries(answers.value).map(([problemId, answer]) => ({
      problem_id: parseInt(problemId),
      code: answer.code,
      language: answer.language
    }))

    const res = await request.post(`/exams/${examId.value}/submit`, {
      submissions,
      time_used: elapsedTime.value
    })

    ElMessage.success(`交卷成功！得分：${res.data?.score ?? '--'}分`)
    router.push('/exams')
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '交卷失败')
  }
}

const confirmExit = () => {
  exitDialogVisible.value = false
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  router.push('/exams')
}

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  e.preventDefault()
}

onMounted(() => {
  loadExam()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.exam-taking-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .exam-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    flex-shrink: 0;

    .exam-info {
      h2 { margin: 0 0 6px 0; font-size: 18px; }
      .exam-meta { display: flex; gap: 16px; font-size: 14px; }
    }
  }

  .exam-content {
    flex: 1;
    display: flex;
    overflow: hidden;

    .questions-nav {
      width: 240px;
      background: #fff;
      border-right: 1px solid #e4e7ed;
      padding: 16px;
      overflow-y: auto;
      flex-shrink: 0;

      h3 { margin: 0 0 12px 0; font-size: 15px; }

      .question-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;

        .el-button {
          width: 34px;
          height: 34px;
          padding: 0;

          &.answered {
            background-color: #67c23a;
            color: #fff;
            border-color: #67c23a;
          }
        }
      }

      .legend {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-top: 12px;
        border-top: 1px solid #e4e7ed;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            &.current { background: $primary-color; }
            &.answered { background: #67c23a; }
            &.unanswered { background: #dcdfe6; }
          }

          span:last-child { font-size: 12px; }
        }
      }
    }

    .question-area {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #f5f7fa;

      .question-detail {
        max-width: 900px;
        margin: 0 auto;

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .question-title { font-size: 17px; font-weight: 600; }
        }

        .question-score {
          font-size: 14px;
          color: $text-secondary;
          margin-bottom: 16px;
        }

        .question-description {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

          .desc-section {
            margin-bottom: 16px;

            h4 {
              font-size: 15px;
              font-weight: 600;
              color: $text-primary;
              margin: 0 0 8px;
              padding-left: 10px;
              border-left: 3px solid $primary-color;
            }

            p {
              font-size: 14px;
              line-height: 1.8;
              color: $text-secondary;
              margin: 0;
            }
          }

          .example-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 8px;

            .example-item {
              margin-bottom: 6px;

              .label {
                font-weight: 600;
                font-size: 13px;
                color: $text-primary;
              }

              pre {
                background: #1e1e1e;
                color: #d4d4d4;
                padding: 8px 12px;
                border-radius: 4px;
                margin: 4px 0 0;
                font-size: 13px;
                font-family: 'Consolas', 'Monaco', monospace;
                white-space: pre-wrap;
              }
            }
          }

          .no-desc {
            text-align: center;
            color: #909399;
            padding: 20px 0;
          }
        }

        .code-editor-wrapper {
          background: #fff;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;

          .editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            span { font-weight: 500; }
          }

          .code-editor {
            :deep(textarea) {
              font-family: 'Consolas', 'Monaco', monospace;
              font-size: 14px;
            }
          }

          .editor-actions {
            display: flex;
            gap: 12px;
            margin-top: 12px;
          }
        }

        .console-output {
          background: #1e1e1e;
          color: #d4d4d4;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;

          h4 { margin: 0 0 12px 0; font-size: 14px; color: #9cdcfe; }
          pre {
            margin: 0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
          }
        }

        .question-navigation {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }
      }
    }
  }

  .submit-summary {
    p { margin: 8px 0; line-height: 1.6; font-size: 14px; }
  }
}
</style>
