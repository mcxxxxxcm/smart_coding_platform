<template>
  <div class="exam-taking-page">
    <div class="exam-header-bar">
      <div class="exam-info">
        <h2>{{ exam?.title }}</h2>
        <div class="exam-meta">
          <span>剩余时间：<el-tag type="warning">{{ formattedTime }}</el-tag>
          </span>
          <span>已用时间：<el-tag>{{ usedTime }}</el-tag></span>
        </div>
      </div>
      <div class="exam-actions">
        <el-button @click="showConfirmSubmit" type="primary" size="large">交卷</el-button>
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
          <div class="legend-item">
            <span class="dot current">当前</span>
          </div>
          <div class="legend-item">
            <span class="dot answered">已答</span>
          </div>
          <div class="legend-item">
            <span class="dot unanswerd">未答</span>
          </div>
        </div>
      </div>

      <div class="question-area">
        <div v-if="currentQuestion" class="question-detail">
          <div class="question-header">
            <span class="question-title">
              第{{ currentQuestionIndex + 1 }}题：{{ currentQuestion.title }}
            </span>
            <el-tag :type="getDifficultyType(currentQuestion.difficulty)" size="small">
              {{ getDifficultyText(currentQuestion.difficulty) }}
            </el-tag>
          </div>
          <div class="question-score">分值：{{ currentQuestion.score }}分</div>

          <div class="question-description" v-html="renderedDescription"></div>
          
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
            <el-button 
              @click="prevQuestion" 
              :disabled="currentQuestionIndex === 0"
            >
              上一题
            </el-button>
            <el-button 
              @click="nextQuestion" 
              :disabled="currentQuestionIndex >= (exam?.questions?.length || 0) - 1"
            >
              下一题
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="submitDialogVisible" title="确认交卷" width="400px">
      <div class="submit-summary">
        <p>已答题目：{{ answeredCount }} / {{ exam?.questions?.length }}</p>
        <p>未答题目：{{ (exam?.questions?.length || 0) - answeredCount }}</p>
        <p>确定要交卷吗？交卷后将无法修改答案！</p>
      </div>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExam">确认交卷</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoPlay, Check } from '@element-plus/icons-vue'
import request from '@/api/request'
import { examApi } from '@/api/exam'
import { marked } from 'marked'

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

const answers = ref<Record<number, { code: string; language: string }>>({})

const timer = ref<number | null>(null)
const startTime = ref<Date | null>(null)
const elapsedTime = ref(0)

const currentQuestion = computed(() => {
  return exam.value?.questions?.[currentQuestionIndex.value]
})

const formattedTime = computed(() => {
  if (!exam.value) return '00:00'
  const totalSeconds = exam.value.duration * 60 - elapsedTime.value
  if (totalSeconds <= 0) return '00:00'
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

const renderedDescription = computed(() => {
  if (!currentQuestion.value?.description) return '<p style="color: #909399;">暂无题目描述</p>'
  return marked(currentQuestion.value.description)
})

const loadExam = async () => {
  try {
    const res = await examApi.getExamById(examId.value)
    exam.value = res.data
    
    // 检查是否已经提交过该考试
    if (exam.value.hasSubmitted) {
      ElMessage.warning('您已经提交过该考试，不能再次进入')
      router.push(`/exams/${examId.value}`)
      return
    }
    
    startTime.value = new Date()
    startTimer()
  } catch (error) {
    console.error('加载考试失败:', error)
    ElMessage.error('加载考试失败')
  }
}

const startTimer = () => {
  timer.value = window.setInterval(() => {
    elapsedTime.value++
    if (elapsedTime.value >= (exam.value?.duration || 0) * 60) {
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
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

const nextQuestion = () => {
  if (currentQuestion.value && currentQuestionIndex.value < (exam.value?.questions?.length || 0) - 1) {
    currentQuestionIndex.value++
  }
}

const showConfirmSubmit = () => {
  submitDialogVisible.value = true
}

const submitExam = async () => {
  submitDialogVisible.value = false
  
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
    
    ElMessage.success(`交卷成功！得分：${res.data.score}分`)
    router.push('/exams')
  } catch (error) {
    ElMessage.error('交卷失败')
  }
  
  if (timer.value) {
    clearInterval(timer.value)
  }
}

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

onMounted(loadExam)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.exam-taking-page {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  
  .exam-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    
    .exam-info {
      h2 {
        margin: 0 0 8px 0;
        font-size: 20px;
      }
      
      .exam-meta {
        display: flex;
        gap: 16px;
        font-size: 14px;
      }
    }
  }
  
  .exam-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    
    .questions-nav {
      width: 280px;
      background: #fff;
      border-right: 1px solid #e4e7ed;
      padding: 20px;
      overflow-y: auto;
      
      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
      }
      
      .question-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
        
        .el-button {
          width: 36px;
          height: 36px;
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
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #e4e7ed;
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 40px;
          
          .dot {
            width: 10px;
            height: 10px;
            min-width: 10px;
            border-radius: 50%;
            
            &.current {
              background: $primary-color;
            }
            
            &.answered {
              background: #67c23a;
            }
            
            &.unanswerd {
              background: #dcdfe6;
            }
          }
          
          span {
            font-size: 12px;
            line-height: 1.2;
            white-space: nowrap;
          }
        }
      }
    }
    
    .question-area {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background: #f5f7fa;
      
      .question-detail {
        max-width: 900px;
        margin: 0 auto;
        
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          
          .question-title {
            font-size: 18px;
            font-weight: 600;
          }
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
          line-height: 1.8;
          font-size: 14px;
          color: $text-secondary;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          
          // Markdown 标题样式
          :deep(h3) {
            font-size: 16px;
            color: $text-primary;
            margin: 20px 0 12px 0;
            font-weight: 600;
            border-left: 3px solid $primary-color;
            padding-left: 12px;
            line-height: 1.4;
          }
          
          // 首个标题移除上边距
          :deep(h3:first-child) {
            margin-top: 0;
          }
          
          // Markdown 加粗文本
          :deep(strong) {
            color: $primary-color;
            font-weight: 600;
          }
          
          // Markdown 行内代码
          :deep(code) {
            background: #f0f7ff;
            color: #e6a23c;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13px;
            font-family: 'Consolas', 'Monaco', monospace;
          }
          
          // Markdown 代码块
          :deep(pre) {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 12px 0;
            font-size: 13px;
            line-height: 1.6;
            font-family: 'Consolas', 'Monaco', monospace;
            
            code {
              background: none;
              color: inherit;
              padding: 0;
            }
          }
          
          // Markdown 引用块
          :deep(blockquote) {
            background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
            border-left: 4px solid #ffc107;
            padding: 12px 16px;
            margin: 16px 0;
            border-radius: 0 8px 8px 0;
            color: #856404;
            
            p {
              margin-bottom: 0;
            }
            
            strong {
              color: #856404;
            }
          }
          
          // Markdown 分割线
          :deep(hr) {
            border: none;
            height: 2px;
            background: linear-gradient(to right, transparent, #e4e7ed, transparent);
            margin: 20px 0;
          }
          
          // Markdown 列表
          :deep(ul), :deep(ol) {
            padding-left: 24px;
            margin: 12px 0;
            
            li {
              margin-bottom: 8px;
              
              strong {
                color: $text-primary;
              }
            }
          }
          
          // 段落间距
          :deep(p) {
            margin: 8px 0;
            
            strong {
              color: $text-primary;
              font-size: 14px;
            }
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
            
            span {
              font-weight: 500;
            }
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
          
          h4 {
            margin: 0 0 12px 0;
            font-size: 14px;
            color: #9cdcfe;
          }
          
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
    p {
      margin: 8px 0;
      line-height: 1.6;
    }
  }
}
</style>
