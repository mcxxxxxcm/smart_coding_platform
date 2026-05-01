<template>
  <div class="practice-page">
    <div class="practice-layout">
      <aside class="problem-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <h3 v-if="!sidebarCollapsed">题目列表</h3>
          <div class="header-controls">
            <el-select v-if="!sidebarCollapsed" v-model="difficultyFilter" placeholder="难度" size="small">
              <el-option label="全部" value="" />
              <el-option label="简单" value="easy" />
              <el-option label="中等" value="medium" />
              <el-option label="困难" value="hard" />
            </el-select>
            <el-button 
              size="small" 
              :icon="sidebarCollapsed ? 'Expand' : 'Fold'" 
              @click="toggleSidebar"
              circle
            />
          </div>
        </div>
        <div class="problem-list" v-loading="loading">
          <div
            v-for="problem in filteredProblems"
            :key="problem.id"
            class="problem-item"
            :class="{ active: selectedProblem?.id === problem.id }"
            @click="selectProblem(problem)"
          >
            <span class="problem-id">{{ problem.id }}</span>
            <span class="problem-title" v-if="!sidebarCollapsed">{{ problem.title }}</span>
            <span class="difficulty-tag" :class="problem.difficulty">{{ getDifficultyText(problem.difficulty) }}</span>
          </div>
        </div>
      </aside>

      <main class="main-content" :class="{ 'with-ai-panel': aiPanelVisible }" v-if="selectedProblem">
        <div class="problem-header">
          <h2>{{ selectedProblem.title }}
            <span class="difficulty-tag" :class="selectedProblem.difficulty">{{ getDifficultyText(selectedProblem.difficulty) }}</span>
          </h2>
          <div class="header-actions">
            <el-button
              size="small"
              type="primary"
              :icon="MagicStick"
              @click="toggleAiPanel"
            >
              {{ aiPanelVisible ? '关闭AI助手' : 'AI助手' }}
            </el-button>
            <el-select v-model="language" size="small" style="width: 120px;">
              <el-option label="Python" value="python" />
              <el-option label="C/C++" value="cpp" />
              <el-option label="C" value="c" />
            </el-select>
          </div>
        </div>

        <div class="practice-body">
          <div class="content-split">
            <div class="description-panel" :style="{ flex: `0 0 ${splitRatio}%` }">
              <div class="panel-header">
                <span class="panel-title">题目描述</span>
              </div>
              <div class="description-content">
                <div class="problem-description" v-html="renderedDescription"></div>
              </div>
            </div>

            <div class="splitter" @mousedown="startResize"></div>

            <div class="editor-panel" :style="{ flex: `0 0 ${100 - splitRatio}%` }">
              <div class="panel-header">
                <span class="panel-title">代码编辑器</span>
              </div>
              <div class="editor-content">
                <textarea 
                  v-model="code" 
                  class="code-textarea"
                  placeholder="在此输入你的代码..."
                  spellcheck="false"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="console-panel" :style="{ height: consoleHeight + 'px' }">
            <div class="console-resizer" @mousedown="startConsoleResize"></div>
            <div class="console-toolbar">
              <div class="toolbar-left">
                <span class="console-title">控制台</span>
                <span v-if="output" class="status-badge" :class="output.status">
                  {{ output.status === 'running' ? '运行中' : output.status === 'success' ? '通过' : '未通过' }}
                </span>
              </div>
              <div class="toolbar-right">
                <el-button type="primary" size="small" @click="runCode" :loading="running">
                  <el-icon><VideoPlay /></el-icon> 运行
                </el-button>
                <el-button type="success" size="small" @click="submitCode" :loading="submitting">
                  <el-icon><Check /></el-icon> 提交
                </el-button>
                <el-button size="small" @click="clearOutput" v-if="output">清空</el-button>
              </div>
            </div>
            
            <div class="console-body">
              <div v-if="output && output.status === 'running'" class="console-output running">
                <div class="loading-indicator">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span>正在执行代码...</span>
                </div>
              </div>
              
              <div v-else-if="output" class="console-output" :class="output.status">
                <div class="output-header">
                  <span class="output-label">━━ 运行结果 ━━</span>
                </div>
                <pre class="output-content">{{ output.message }}</pre>
              </div>
              
              <div v-else class="console-placeholder">
                <el-icon><Monitor /></el-icon>
                <p>点击"运行"按钮执行代码</p>
                <p class="hint">代码输出将显示在这里</p>
              </div>
            </div>
          </div>
        </div>

        <aside class="ai-panel" :class="{ visible: aiPanelVisible }" :style="{ transform: aiPanelVisible ? 'translateX(0)' : 'translateX(100%)' }">
          <div class="ai-header">
            <el-icon class="ai-icon"><MagicStick /></el-icon>
            <span class="ai-title">AI 助手</span>
            <el-button size="small" :icon="'Close'" @click="toggleAiPanel" circle />
          </div>
          
          <div class="ai-actions">
            <el-button @click="askAiHint" :loading="aiLoading" :disabled="aiLoading">
              <el-icon><MagicStick /></el-icon> 获取提示
            </el-button>
            <el-button @click="askAiExplain" :loading="aiLoading" :disabled="aiLoading">
              <el-icon><Document /></el-icon> 代码解释
            </el-button>
            <el-button @click="askAiDebug" :loading="aiLoading" :disabled="aiLoading">
              <el-icon><Monitor /></el-icon> 代码调试
            </el-button>
          </div>
          
          <div class="ai-messages" ref="aiMessageContainer">
            <div 
              v-for="(msg, index) in aiMessages" 
              :key="index" 
              class="message" 
              :class="msg.role"
            >
              <div class="message-bubble" v-html="renderAiMarkdown(msg.content)"></div>
            </div>
            <div v-if="aiLoading" class="message assistant loading-message">
              <div class="message-bubble">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>AI 正在思考...</span>
              </div>
            </div>
          </div>
          
          <div class="ai-footer">
            <el-input
              v-model="aiInput"
              placeholder="输入你的问题..."
              @keyup.enter="sendAiMessage"
              :disabled="aiLoading"
            >
              <template #append>
                <el-button @click="sendAiMessage" :disabled="aiLoading || !aiInput.trim()">
                  <el-icon><Message /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
        </aside>
      </main>

      <div class="empty-state" v-else>
        <el-empty description="请选择一道题目开始练习" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, Check, Loading, Monitor, MagicStick, Document, Message } from '@element-plus/icons-vue'
import { problemApi, submissionApi } from '@/api/problem'
import { marked } from 'marked'

const loading = ref(false)
const problems = ref<any[]>([])
const selectedProblem = ref<any | null>(null)
const difficultyFilter = ref('')
const language = ref('python')
const code = ref('')
const running = ref(false)
const submitting = ref(false)
const output = ref<{ status: string; message: string } | null>(null)
const sidebarCollapsed = ref(false)
const splitRatio = ref(50)
const consoleHeight = ref(280)

const aiPanelVisible = ref(false)
const aiLoading = ref(false)
const aiInput = ref('')
const aiMessages = ref<{ role: 'user' | 'assistant'; content: string }[]>([])
const aiMessageContainer = ref<HTMLElement | null>(null)

const filteredProblems = computed(() => {
  if (!difficultyFilter.value) return problems.value
  return problems.value.filter(p => p.difficulty === difficultyFilter.value)
})

const renderedDescription = computed(() => {
  if (!selectedProblem.value?.description) return ''
  return marked(selectedProblem.value.description)
})

const getDifficultyText = (difficulty: string) => {
  const texts: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
  return texts[difficulty] || difficulty
}

const getStatusText = (status: string) => {
  const statusTexts: Record<string, string> = {
    accepted: '✓ 通过', wrong_answer: '✗ 答案错误', time_limit_exceeded: '✗ 超时',
    memory_limit_exceeded: '✗ 内存超限', runtime_error: '✗ 运行错误',
    compile_error: '✗ 编译错误', pending: '等待中', running: '运行中'
  }
  return statusTexts[status] || status
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const fetchProblems = async () => {
  loading.value = true
  try {
    const res = await problemApi.getProblems({ limit: 50 })
    problems.value = res.data || []
    if (problems.value.length > 0) {
      selectProblem(problems.value[0])
    }
  } catch (error) {
    console.error('获取题目失败:', error)
  } finally {
    loading.value = false
  }
}

const selectProblem = (problem: any) => {
  selectedProblem.value = problem
  code.value = problem.template_code?.[language.value] || ''
  output.value = null
}

const clearOutput = () => {
  output.value = null
}

const startResize = (e: MouseEvent) => {
  e.preventDefault()
  const startX = e.clientX
  const startRatio = splitRatio.value
  const container = document.querySelector('.content-split') as HTMLElement
  if (!container) return

  const onMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - startX
    const containerWidth = container.offsetWidth
    const deltaRatio = (deltaX / containerWidth) * 100
    splitRatio.value = Math.max(20, Math.min(80, startRatio + deltaRatio))
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const startConsoleResize = (e: MouseEvent) => {
  e.preventDefault()
  const startY = e.clientY
  const startHeight = consoleHeight.value

  const onMouseMove = (moveEvent: MouseEvent) => {
    const deltaY = startY - moveEvent.clientY
    consoleHeight.value = Math.max(150, Math.min(600, startHeight + deltaY))
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const runCode = async () => {
  if (!code.value.trim()) {
    ElMessage.warning('请先输入代码')
    return
  }

  running.value = true
  output.value = { status: 'running', message: '' }
  
  try {
    const res = await submissionApi.submit(selectedProblem.value!.id, language.value, code.value)
    
    setTimeout(async () => {
      try {
        const result = await submissionApi.getSubmission(res.data.submissionId)
        const testResults = result.data.test_results
        
        let message = `状态：${getStatusText(result.data.status)}\n`
        message += `运行时间：${result.data.runtime}ms | 内存：${result.data.memory}MB\n\n`
        
        if (testResults && testResults.message) {
          message += `${testResults.message}\n\n`
        }
        
        if (testResults && testResults.results && testResults.results.length > 0) {
          const testResult = testResults.results[0]
          message += `【你的输出】\n${testResult.output || '(无输出)'}\n\n`
          
          if (testResult.expected) {
            message += `【期望输出】\n${testResult.expected}\n\n`
          }
          
          if (result.data.status === 'accepted') {
            message += `🎉 恭喜！测试通过！`
          } else {
            message += `❌ 测试未通过\n`
            if (testResult.error) {
              message += `错误信息：${testResult.error}`
            }
          }
        }
        
        output.value = {
          status: result.data.status === 'accepted' ? 'success' : 'error',
          message: message
        }
      } catch (error) {
        console.error('获取结果失败:', error)
        output.value = { status: 'error', message: '获取运行结果失败' }
      }
    }, 2000)
  } catch (error) {
    console.error('运行失败:', error)
    output.value = { status: 'error', message: '运行失败，请检查代码' }
  } finally {
    running.value = false
  }
}

const submitCode = async () => {
  if (!code.value.trim()) {
    ElMessage.warning('请先输入代码')
    return
  }

  submitting.value = true
  try {
    const res = await submissionApi.submit(selectedProblem.value!.id, language.value, code.value)
    ElMessage.success('提交成功，正在评测...')
    
    setTimeout(async () => {
      const result = await submissionApi.getSubmission(res.data.submissionId)
      const testResults = result.data.test_results
      
      if (result.data.status === 'accepted') {
        ElMessage.success('🎉 恭喜！通过所有测试用例！')
      } else if (testResults && testResults.passedCount !== undefined) {
        ElMessage.warning(`通过测试案例 ${testResults.passedCount}/${testResults.totalTestCases}，请继续努力`)
      } else {
        ElMessage.warning('未通过所有测试用例，请继续努力')
      }
      
      let message = `状态：${getStatusText(result.data.status)}\n`
      message += `运行时间：${result.data.runtime}ms | 内存：${result.data.memory}MB\n\n`
      
      if (testResults && testResults.message) {
        message += `${testResults.message}\n\n`
      }
      
      if (testResults && testResults.results && testResults.results.length > 0) {
        const testResult = testResults.results[0]
        message += `【你的输出】\n${testResult.output || '(无输出)'}\n\n`
        if (testResult.expected) {
          message += `【期望输出】\n${testResult.expected}`
        }
      }
      
      output.value = {
        status: result.data.status === 'accepted' ? 'success' : 'error',
        message: message
      }
    }, 3000)
  } finally {
    submitting.value = false
  }
}

const toggleAiPanel = () => {
  aiPanelVisible.value = !aiPanelVisible.value
  if (aiPanelVisible.value && aiMessages.value.length === 0) {
    aiMessages.value = [{
      role: 'assistant',
      content: `你好！我是AI编程助手。当前题目：${selectedProblem.value?.title || '未选择'}。我可以帮你：

- 获取提示：点击"获取提示"按钮
- 代码解释：点击"代码解释"按钮
- 代码调试：点击"代码调试"按钮
- 自由提问：在输入框输入你的问题

有什么我可以帮你的吗？`
    }]
  }
}

const renderAiMarkdown = (content: string) => {
  return marked(content)
}

const scrollToAiBottom = async () => {
  await nextTick()
  if (aiMessageContainer.value) {
    aiMessageContainer.value.scrollTop = aiMessageContainer.value.scrollHeight
  }
}

const addAiMessage = (role: 'user' | 'assistant', content: string) => {
  aiMessages.value.push({ role, content })
  scrollToAiBottom()
}

const callAi = async (message: string): Promise<string> => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const token = localStorage.getItem('token')
  
  const res = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message,
      problemId: selectedProblem.value?.id,
      code: code.value
    })
  })
  
  const data = await res.json()
  return data.data?.reply || data.data?.content || '抱歉，AI服务暂时不可用'
}

const askAiHint = async () => {
  if (!selectedProblem.value) {
    ElMessage.warning('请先选择一道题目')
    return
  }
  aiLoading.value = true
  addAiMessage('user', '请给我一些解题提示')
  
  try {
    const reply = await callAi(`请根据题目"${selectedProblem.value.title}"，题目描述：${selectedProblem.value.description}，给我一些解题思路和提示。`)
    addAiMessage('assistant', reply)
  } catch (error) {
    ElMessage.error('AI助手调用失败')
  } finally {
    aiLoading.value = false
  }
}

const askAiExplain = async () => {
  if (!code.value.trim()) {
    ElMessage.warning('请先在编辑器中输入代码')
    return
  }
  aiLoading.value = true
  addAiMessage('user', '请解释我当前的代码')
  
  try {
    const reply = await callAi(`请解释以下代码的作用和逻辑：\n\n\`\`\`${language.value}\n${code.value}\n\`\`\``)
    addAiMessage('assistant', reply)
  } catch (error) {
    ElMessage.error('AI助手调用失败')
  } finally {
    aiLoading.value = false
  }
}

const askAiDebug = async () => {
  if (!code.value.trim()) {
    ElMessage.warning('请先在编辑器中输入代码')
    return
  }
  aiLoading.value = true
  addAiMessage('user', '请帮我调试当前代码')
  
  try {
    const reply = await callAi(`请帮我审查并调试以下代码，指出可能存在的问题和改进建议：\n\n\`\`\`${language.value}\n${code.value}\n\`\`\``)
    addAiMessage('assistant', reply)
  } catch (error) {
    ElMessage.error('AI助手调用失败')
  } finally {
    aiLoading.value = false
  }
}

const sendAiMessage = async () => {
  if (!aiInput.value.trim()) return
  
  const userMessage = aiInput.value
  aiInput.value = ''
  aiLoading.value = true
  addAiMessage('user', userMessage)
  
  try {
    const reply = await callAi(userMessage)
    addAiMessage('assistant', reply)
  } catch (error) {
    ElMessage.error('AI助手调用失败')
  } finally {
    aiLoading.value = false
  }
}

onMounted(fetchProblems)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.practice-page {
  height: calc(100vh - 60px);
  overflow: hidden;
  background: $surface-color;
  position: relative;
}

.practice-layout {
  display: flex;
  height: 100%;
}

.problem-sidebar {
  width: 280px;
  min-width: 60px;
  background: white;
  border-right: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s ease, min-width 0.3s ease;
  
  &.collapsed {
    width: 60px;
    min-width: 60px;
    
    .problem-item {
      justify-content: center;
      padding: 10px 0;
    }
    
    .problem-title,
    .problem-id,
    .difficulty-tag {
      display: none;
    }
  }
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid $border-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    white-space: nowrap;
  }
  
  .header-controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.problem-list {
  flex: 1;
  overflow-y: auto;
}

.problem-item {
  padding: 10px 12px;
  border-bottom: 1px solid $border-light;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
  
  &:hover {
    background: $primary-light;
  }
  
  &.active {
    background: $primary-light;
    border-left: 3px solid $primary-color;
  }
}

.problem-id {
  color: $text-muted;
  font-size: 13px;
  min-width: 24px;
  font-weight: 500;
}

.problem-title {
  flex: 1;
  font-size: 13px;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.difficulty-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  
  &.easy { background: $color-easy-bg; color: $color-easy-text; }
  &.medium { background: $color-medium-bg; color: $color-medium-text; }
  &.hard { background: $color-hard-bg; color: $color-hard-text; }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: white;
  position: relative;

  &.with-ai-panel {
    .practice-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
  }
}

.practice-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.problem-header {
  padding: 12px 20px;
  border-bottom: 1px solid $border-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: $surface-color;
  
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
    display: flex;
    align-items: center;
    gap: 10px;
    
    .difficulty-tag {
      font-size: 12px;
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.content-split {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.description-panel {
  flex: 0 0 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid $border-color;
  
  .panel-header {
    padding: 8px 16px;
    background: $surface-color;
    border-bottom: 1px solid $border-color;
    
    .panel-title {
      font-size: 13px;
      font-weight: 600;
      color: $text-primary;
    }
  }
  
  .description-content {
    flex: 1;
    overflow-y: auto;
  }
}

.splitter {
  width: 6px;
  background: $border-light;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  
  &:hover {
    background: $primary-color;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 40px;
    background: $border-color;
    border-radius: 2px;
  }
}

.editor-panel {
  flex: 0 0 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .panel-header {
    padding: 8px 16px;
    background: $surface-color;
    border-bottom: 1px solid $border-color;
    
    .panel-title {
      font-size: 13px;
      font-weight: 600;
      color: $text-primary;
    }
  }
  
  .editor-content {
    flex: 1;
    overflow: hidden;
  }
}

.problem-description {
  padding: 20px;
  line-height: 1.8;
  color: $text-primary;
  font-size: 14px;
  
  p {
    margin-bottom: 16px;
  }
  
  :deep(h3) {
    font-size: 16px;
    color: $text-primary;
    margin: 20px 0 12px 0;
    font-weight: 600;
    border-left: 3px solid $primary-color;
    padding-left: 12px;
    line-height: 1.4;
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  :deep(strong) {
    color: $primary-color;
    font-weight: 600;
  }
  
  :deep(code) {
    background: $primary-light;
    color: $accent-color;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    font-family: 'Consolas', 'Monaco', monospace;
  }
  
  :deep(pre) {
    background: $code-bg;
    color: $code-text;
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
  
  :deep(blockquote) {
    background: $color-medium-bg;
    border-left: 4px solid $accent-color;
    padding: 12px 16px;
    margin: 16px 0;
    border-radius: 0 8px 8px 0;
    color: $color-medium-text;
    
    p {
      margin-bottom: 0;
    }
    
    strong {
      color: $color-medium-text;
    }
  }
  
  :deep(hr) {
    border: none;
    height: 1px;
    background: $border-color;
    margin: 20px 0;
  }
  
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
  
  :deep(p) {
    margin: 8px 0;
    
    strong {
      color: $text-primary;
      font-size: 14px;
    }
  }
}

.code-textarea {
  width: 100%;
  height: 100%;
  padding: 16px 20px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.6;
  background: $code-bg;
  color: $code-text;
  tab-size: 2;
  
  &::placeholder {
    color: #585b70;
  }
}

.console-panel {
  border-top: 2px solid $border-color;
  background: $code-bg;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
}

.console-resizer {
  height: 6px;
  background: $border-light;
  cursor: row-resize;
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  z-index: 10;
  
  &:hover {
    background: $primary-color;
  }
}

.console-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: $code-header;
  border-bottom: 1px solid #45475a;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.console-title {
  color: #a6adc8;
  font-size: 13px;
  font-weight: 600;
}

.status-badge {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  
  &.success {
    background: #166534;
    color: #fff;
  }
  
  &.error {
    background: #991b1b;
    color: #fff;
  }
  
  &.running {
    background: #854d0e;
    color: #fff;
  }
}

.toolbar-right {
  display: flex;
  gap: 6px;
}

.console-body {
  flex: 1;
  overflow-y: auto;
  background: $code-bg;
}

.console-output {
  padding: 16px 20px;
  
  pre.output-content {
    margin: 0;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.7;
    color: $code-text;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  
  .output-header {
    margin-bottom: 12px;
    
    .output-label {
      color: #585b70;
      font-size: 12px;
      letter-spacing: 1px;
    }
  }
  
  &.success {
    background: #0c2818;
    
    pre { color: #89ddff; }
  }
  
  &.error {
    background: #2a1215;
    
    pre { color: #f48771; }
  }
  
  &.running {
    background: $code-bg;
  }
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #585b70;
  font-size: 13px;
  
  .el-icon {
    font-size: 18px;
    color: $primary-color;
  }
}

.console-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 140px;
  color: #585b70;
  
  .el-icon {
    font-size: 40px;
    opacity: 0.3;
    margin-bottom: 10px;
  }
  
  p {
    margin: 0;
    font-size: 13px;
    
    &.hint {
      font-size: 12px;
      color: #45475a;
      margin-top: 4px;
    }
  }
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.ai-panel {
  width: 380px;
  background: white;
  border-left: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: -2px 0 8px rgba(0,0,0,0.05);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  height: 100%;
  z-index: 100;

  &.visible {
    transform: translateX(0);
  }

  &:not(.visible) {
    display: none;
  }
  
  .ai-header {
    padding: 16px 20px;
    background: $primary-color;
    color: white;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    
    .ai-icon {
      font-size: 20px;
    }
    
    .ai-title {
      flex: 1;
      font-size: 16px;
      font-weight: 600;
    }
    
    .el-button {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      
      &:hover {
        background: rgba(255,255,255,0.3);
      }
    }
  }
  
  .ai-actions {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid $border-color;
    
    .el-button {
      width: 100%;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 8px;
      background: $primary-light;
      border-color: $primary-border;
      color: $primary-color;
      
      &:hover {
        background: rgba(15, 118, 110, 0.12);
        border-color: $primary-color;
      }
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
  
  .ai-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: $surface-color;
    
    .message {
      margin-bottom: 12px;
      display: flex;
      
      &.user {
        justify-content: flex-end;
        
        .message-bubble {
          background: $primary-color;
          color: white;
          border-radius: 12px 12px 0 12px;
          
          :deep(pre) {
            background: rgba(0,0,0,0.3);
          }
          
          :deep(code) {
            background: rgba(0,0,0,0.2);
            color: #fff;
          }
        }
      }
      
      &.assistant {
        justify-content: flex-start;
        
        .message-bubble {
          background: white;
          color: $text-primary;
          border: 1px solid $border-color;
          border-radius: 12px 12px 12px 0;
        }
      }
      
      &.loading-message {
        .message-bubble {
          display: flex;
          align-items: center;
          gap: 8px;
          color: $text-muted;
          font-style: italic;
        }
      }
      
      .message-bubble {
        max-width: 85%;
        padding: 10px 14px;
        font-size: 13px;
        line-height: 1.6;
        word-wrap: break-word;
        
        :deep(p) {
          margin: 8px 0;
          
          &:first-child {
            margin-top: 0;
          }
          
          &:last-child {
            margin-bottom: 0;
          }
        }
        
        :deep(pre) {
          background: $code-bg;
          color: $code-text;
          padding: 10px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 8px 0;
          font-size: 12px;
          line-height: 1.5;
          
          code {
            background: none;
            color: inherit;
            padding: 0;
          }
        }
        
        :deep(code) {
          background: $primary-light;
          color: $accent-color;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 12px;
          font-family: 'Consolas', 'Monaco', monospace;
        }
        
        :deep(ul), :deep(ol) {
          padding-left: 20px;
          margin: 8px 0;
          
          li {
            margin-bottom: 4px;
          }
        }
        
        :deep(strong) {
          font-weight: 600;
          color: $primary-color;
        }
        
        :deep(blockquote) {
          border-left: 3px solid $primary-color;
          padding-left: 10px;
          margin: 8px 0;
          color: $text-secondary;
        }
      }
    }
  }
  
  .ai-footer {
    padding: 12px 16px;
    background: white;
    border-top: 1px solid $border-color;
    
    .el-input {
      .el-button {
        background: $primary-color;
        border-color: $primary-color;
        color: white;
        
        &:hover {
          background: $primary-hover;
          border-color: $primary-hover;
        }
      }
    }
  }
}
</style>
