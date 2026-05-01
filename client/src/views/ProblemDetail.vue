<template>
  <div class="problem-detail-page page-container">
    <div class="problem-container" v-loading="loading">
      <div class="problem-sidebar">
        <div class="sidebar-header">
          <h3>题目列表</h3>
        </div>
        <div class="problem-list">
          <div
            v-for="problem in problems"
            :key="problem.id"
            class="problem-item"
            :class="{ active: currentProblem?.id === problem.id }"
            @click="selectProblem(problem)"
          >
            <span class="problem-id">{{ problem.id }}</span>
            <span class="problem-title">{{ problem.title }}</span>
            <span class="difficulty-tag" :class="problem.difficulty">{{ getDifficultyText(problem.difficulty) }}</span>
          </div>
        </div>
      </div>
      
      <main class="problem-main" v-if="currentProblem">
        <div class="problem-header">
          <div class="header-left">
            <h2>{{ currentProblem.title }}</h2>
            <div class="problem-tags">
              <span class="difficulty-tag" :class="currentProblem.difficulty">
                {{ getDifficultyText(currentProblem.difficulty) }}
              </span>
              <el-tag v-for="tag in currentProblem.tags" :key="tag" size="small">{{ tag }}</el-tag>
            </div>
          </div>
          <el-button 
            type="primary" 
            :icon="MagicStick" 
            @click="aiPanelVisible = !aiPanelVisible"
            :class="{ active: aiPanelVisible }"
          >
            {{ aiPanelVisible ? '收起 AI' : 'AI 助手' }}
          </el-button>
        </div>
        
        <el-tabs v-model="activeTab">
          <el-tab-pane label="题目描述" name="description">
            <div class="problem-description">
              <div class="description-section">
                <p>{{ currentProblem.description }}</p>
              </div>
              
              <div class="description-section" v-if="currentProblem.input_format">
                <h4>输入格式</h4>
                <p>{{ currentProblem.input_format }}</p>
              </div>
              
              <div class="description-section" v-if="currentProblem.output_format">
                <h4>输出格式</h4>
                <p>{{ currentProblem.output_format }}</p>
              </div>
              
              <div class="description-section" v-for="(example, index) in currentProblem.examples" :key="index">
                <h4>示例 {{ index + 1 }}</h4>
                <div class="example-box">
                  <div class="example-item">
                    <span class="label">输入：</span>
                    <pre>{{ example.input }}</pre>
                  </div>
                  <div class="example-item">
                    <span class="label">输出：</span>
                    <pre>{{ example.output }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="代码提交" name="submit">
            <div class="code-section">
              <div class="code-header">
                <el-select v-model="language" placeholder="选择语言">
                  <el-option label="JavaScript" value="javascript" />
                  <el-option label="Python" value="python" />
                </el-select>
                <div class="code-actions">
                  <el-button @click="resetCode">重置</el-button>
                  <el-button type="primary" @click="runCode" :loading="running">运行</el-button>
                  <el-button type="success" @click="submitCode" :loading="submitting">提交</el-button>
                </div>
              </div>
              <div class="code-editor">
                <el-input
                  v-model="code"
                  type="textarea"
                  :rows="20"
                  placeholder="请输入代码..."
                  class="code-textarea"
                />
              </div>
              <div class="output-section" v-if="output">
                <h4>运行结果</h4>
                <pre class="output-content" :class="output.status">{{ output.message }}</pre>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </main>
      
      <aside class="ai-panel" v-if="aiPanelVisible && currentProblem">
        <div class="ai-panel-header">
          <el-icon :size="20" color="#0f766e"><MagicStick /></el-icon>
          <span>AI 编程助手</span>
        </div>
        
        <div class="ai-actions">
          <el-button size="small" @click="askHint" :loading="aiLoading">
            <el-icon><Light /></el-icon> 获取提示
          </el-button>
          <el-button size="small" @click="explainCode" :loading="aiLoading">
            <el-icon><Document /></el-icon> 代码解释
          </el-button>
          <el-button size="small" @click="debugCode" :loading="aiLoading">
            <el-icon><WarnTriangleFilled /></el-icon> 代码调试
          </el-button>
        </div>
        
        <div class="ai-messages" ref="messagesRef">
          <div v-if="aiMessages.length === 0" class="ai-empty">
            <el-icon :size="48" color="#dcdfe6"><MagicStick /></el-icon>
            <p>遇到不会的题目？</p>
            <p class="hint-text">点击按钮获取 AI 帮助</p>
          </div>
          <div
            v-for="(msg, index) in aiMessages"
            :key="index"
            class="ai-message"
            :class="msg.role"
          >
            <div class="message-avatar">
              <el-icon v-if="msg.role === 'assistant'" :size="16" color="#0f766e"><MagicStick /></el-icon>
              <el-icon v-else :size="16" color="#409eff"><User /></el-icon>
            </div>
            <div class="message-content">
              <pre class="message-text">{{ msg.content }}</pre>
            </div>
          </div>
          <div v-if="aiLoading" class="ai-message assistant">
            <div class="message-avatar">
              <el-icon :size="16" color="#0f766e"><MagicStick /></el-icon>
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="ai-input-area">
          <el-input
            v-model="aiInput"
            type="textarea"
            :rows="3"
            placeholder="输入你的问题，向 AI 助手提问..."
            @keyup.ctrl.enter="sendAiMessage"
          />
          <el-button type="primary" size="small" @click="sendAiMessage" :loading="aiLoading" style="width: 100%; margin-top: 8px">
            <el-icon><Promotion /></el-icon> 发送 (Ctrl+Enter)
          </el-button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MagicStick, Light, Document, WarnTriangleFilled, User, Promotion } from '@element-plus/icons-vue'
import { problemApi, submissionApi } from '@/api/problem'
import { aiApi } from '@/api/ai'
import type { Problem } from '@/types'

const route = useRoute()
const loading = ref(false)
const problems = ref<Problem[]>([])
const currentProblem = ref<Problem | null>(null)
const activeTab = ref('description')
const language = ref('javascript')
const code = ref('')
const running = ref(false)
const submitting = ref(false)
const output = ref<{ status: string; message: string } | null>(null)

// AI assistant
const aiPanelVisible = ref(false)
const aiLoading = ref(false)
const aiInput = ref('')
const aiMessages = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])
const messagesRef = ref<HTMLElement>()

const getDifficultyText = (difficulty: string) => {
  const texts: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return texts[difficulty] || difficulty
}

const fetchProblems = async () => {
  loading.value = true
  try {
    const res = await problemApi.getProblems({ limit: 50 })
    problems.value = res.data || []
    
    const problemId = Number(route.params.id)
    const problem = problems.value.find(p => p.id === problemId)
    if (problem) {
      selectProblem(problem)
    } else if (problems.value.length > 0) {
      selectProblem(problems.value[0])
    }
  } finally {
    loading.value = false
  }
}

const selectProblem = (problem: Problem) => {
  currentProblem.value = problem
  code.value = problem.template_code?.[language.value] || ''
  output.value = null
  activeTab.value = 'description'
}

const resetCode = () => {
  if (currentProblem.value) {
    code.value = currentProblem.value.template_code?.[language.value] || ''
  }
}

const runCode = async () => {
  running.value = true
  output.value = { status: 'running', message: '运行中...' }
  try {
    const res = await submissionApi.submit(currentProblem.value!.id, language.value, code.value)
    setTimeout(async () => {
      const result = await submissionApi.getSubmission(res.data.submissionId)
      output.value = {
        status: result.data.status === 'accepted' ? 'success' : 'error',
        message: `状态: ${result.data.status}\n运行时间: ${result.data.runtime}ms\n内存: ${result.data.memory}MB`
      }
    }, 2000)
  } catch {
    output.value = { status: 'error', message: '运行失败' }
  } finally {
    running.value = false
  }
}

const submitCode = async () => {
  submitting.value = true
  try {
    const res = await submissionApi.submit(currentProblem.value!.id, language.value, code.value)
    ElMessage.success('提交成功，正在评测中...')
    setTimeout(async () => {
      const result = await submissionApi.getSubmission(res.data.submissionId)
      if (result.data.status === 'accepted') {
        ElMessage.success('恭喜！通过所有测试用例！')
      } else {
        ElMessage.warning('未通过所有测试用例，请继续努力')
      }
    }, 3000)
  } finally {
    submitting.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const askAi = async (apiCall: () => Promise<any>, actionName: string) => {
  if (!currentProblem.value) {
    ElMessage.warning('请先选择一道题目')
    return
  }

  aiLoading.value = true
  try {
    const res = await apiCall()
    if (res.success && res.data) {
      aiMessages.value.push({
        role: 'assistant',
        content: Object.values(res.data)[0] as string
      })
      scrollToBottom()
    } else {
      ElMessage.error(res.message || `${actionName}失败`)
    }
  } catch (error: any) {
    ElMessage.error(error.message || `${actionName}失败`)
  } finally {
    aiLoading.value = false
  }
}

const askHint = () => {
  aiMessages.value.push({ role: 'user', content: `💡 获取提示` })
  scrollToBottom()
  askAi(
    () => aiApi.getHint(
      currentProblem.value!.title,
      currentProblem.value!.description,
      code.value || '',
      language.value
    ),
    '获取提示'
  )
}

const explainCode = () => {
  if (!code.value.trim()) {
    ElMessage.warning('请先编写代码')
    return
  }
  aiMessages.value.push({ role: 'user', content: `📖 解释代码` })
  scrollToBottom()
  askAi(
    () => aiApi.explainCode(code.value, language.value),
    '代码解释'
  )
}

const debugCode = () => {
  if (!code.value.trim()) {
    ElMessage.warning('请先编写代码')
    return
  }
  const errorMsg = output.value?.status === 'error' ? output.value.message : undefined
  aiMessages.value.push({ role: 'user', content: `🔧 代码调试${errorMsg ? '（附带错误信息）' : ''}` })
  scrollToBottom()
  askAi(
    () => aiApi.debugCode(code.value, language.value, errorMsg),
    '代码调试'
  )
}

const sendAiMessage = () => {
  if (!aiInput.value.trim()) return
  aiMessages.value.push({ role: 'user', content: aiInput.value })
  scrollToBottom()
  askAi(
    () => aiApi.chat(
      aiInput.value,
      currentProblem.value
        ? `题目：${currentProblem.value.title}\n描述：${currentProblem.value.description}\n语言：${language.value}\n代码：\n${code.value}`
        : undefined
    ),
    '发送消息'
  )
  aiInput.value = ''
}

watch(() => route.params.id, () => {
  const problemId = Number(route.params.id)
  const problem = problems.value.find(p => p.id === problemId)
  if (problem) {
    selectProblem(problem)
  }
})

onMounted(fetchProblems)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.problem-detail-page {
  min-height: calc(100vh - 70px);
}

.problem-container {
  display: flex;
  height: calc(100vh - 70px);
}

.problem-sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid $border-color;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid $border-color;
  
  h3 {
    font-size: 1.1rem;
  }
}

.problem-list {
  flex: 1;
  overflow-y: auto;
}

.problem-item {
  padding: 15px 20px;
  border-bottom: 1px solid $border-color;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &:hover {
    background: $primary-light;
  }
  
  &.active {
    background: $primary-light;
    border-left: 3px solid $primary-color;
  }
}

.problem-id {
  color: $text-secondary;
  font-size: 0.9rem;
  min-width: 30px;
}

.problem-title {
  flex: 1;
  font-weight: 500;
  color: $text-primary;
}

.difficulty-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  
  &.easy { background: $color-easy-bg; color: $color-easy-text; }
  &.medium { background: $color-medium-bg; color: $color-medium-text; }
  &.hard { background: $color-hard-bg; color: $color-hard-text; }
}

.problem-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.problem-header {
  padding: 20px;
  border-bottom: 1px solid $border-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    font-size: 1.5rem;
  }
}

.problem-tags {
  display: flex;
  gap: 8px;
}

.problem-description {
  padding: 20px;
  overflow-y: auto;
}

.description-section {
  margin-bottom: 24px;
  
  h4 {
    font-size: 1rem;
    margin-bottom: 10px;
    color: $text-primary;
  }
  
  p {
    color: $text-secondary;
    line-height: 1.8;
  }
}

.example-box {
  background: #f8fafc;
  border-radius: $radius-sm;
  padding: 16px;
}

.example-item {
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .label {
    font-weight: 500;
    color: $text-primary;
  }
  
  pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 12px;
    border-radius: $radius-sm;
    margin-top: 8px;
    font-family: 'Fira Code', monospace;
    font-size: 0.9rem;
  }
}

.code-section {
  padding: 20px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.code-actions {
  display: flex;
  gap: 10px;
}

.code-textarea :deep(textarea) {
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  border-radius: $radius-md;
}

.output-section {
  h4 {
    margin-bottom: 10px;
  }
}

.output-content {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: $radius-md;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  
  &.success {
    border-left: 3px solid $secondary-color;
  }
  
  &.error {
    border-left: 3px solid #ef4444;
  }
}

.problem-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.ai-panel {
  width: 360px;
  background: white;
  border-left: 1px solid $border-color;
  display: flex;
  flex-direction: column;
}

.ai-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid $border-color;
  font-weight: 600;
  font-size: 15px;
  color: $primary-color;
}

.ai-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid $border-color;
  flex-wrap: wrap;
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
  
  p {
    margin: 8px 0 0;
    font-size: 14px;
  }
  
  .hint-text {
    font-size: 12px;
    color: #c0c4cc;
  }
}

.ai-message {
  display: flex;
  gap: 10px;
  
  &.user {
    flex-direction: row-reverse;
    
    .message-content {
      background: $primary-color;
      color: white;
      
      .message-text {
        color: white;
      }
    }
  }
  
  .message-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: $primary-light;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .message-content {
    max-width: 85%;
    background: $surface-color;
    border-radius: 8px;
    padding: 10px 14px;
    
    .message-text {
      margin: 0;
      font-size: 13px;
      line-height: 1.6;
      color: $text-primary;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: inherit;
    }
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
  
  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $primary-color;
    animation: typing 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

.ai-input-area {
  padding: 16px;
  border-top: 1px solid $border-color;
}
</style>
