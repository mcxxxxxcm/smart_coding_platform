<template>
  <div class="practice-page">
    <div class="practice-layout">
      <!-- 左侧题目列表 -->
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

      <!-- 右侧主内容区 -->
      <main class="main-content" v-if="selectedProblem">
        <!-- 标题栏 -->
        <div class="problem-header">
          <h2>{{ selectedProblem.title }}
            <span class="difficulty-tag" :class="selectedProblem.difficulty">{{ getDifficultyText(selectedProblem.difficulty) }}</span>
          </h2>
          <div class="header-actions">
            <el-select v-model="language" size="small" style="width: 120px;">
              <el-option label="Python" value="python" />
              <el-option label="C/C++" value="cpp" />
              <el-option label="C" value="c" />
            </el-select>
          </div>
        </div>

        <!-- 左右分栏：题目描述 + 代码编辑器 -->
        <div class="content-split">
          <!-- 左侧：题目描述 -->
          <div class="description-panel" :style="{ flex: `0 0 ${splitRatio}%` }">
            <div class="panel-header">
              <span class="panel-title">题目描述</span>
            </div>
            <div class="description-content">
              <div class="problem-description" v-html="renderedDescription"></div>
            </div>
          </div>

          <!-- 中间：可拖拽分隔条 -->
          <div class="splitter" @mousedown="startResize"></div>

          <!-- 右侧：代码编辑器 -->
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

        <!-- 底部：控制台面板 -->
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
            <!-- 运行中状态 -->
            <div v-if="output && output.status === 'running'" class="console-output running">
              <div class="loading-indicator">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>正在执行代码...</span>
              </div>
            </div>
            
            <!-- 有输出结果 -->
            <div v-else-if="output" class="console-output" :class="output.status">
              <div class="output-header">
                <span class="output-label">━━ 运行结果 ━━</span>
              </div>
              <pre class="output-content">{{ output.message }}</pre>
            </div>
            
            <!-- 空状态 -->
            <div v-else class="console-placeholder">
              <el-icon><Monitor /></el-icon>
              <p>点击"运行"按钮执行代码</p>
              <p class="hint">代码输出将显示在这里</p>
            </div>
          </div>
        </div>
      </main>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <el-empty description="请选择一道题目开始练习" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, VideoPlay, Check, Loading, Monitor } from '@element-plus/icons-vue'
import { problemApi, submissionApi } from '@/api/problem'
import { marked } from 'marked'
import type { Problem } from '@/types'

const loading = ref(false)
const problems = ref<Problem[]>([])
const selectedProblem = ref<Problem | null>(null)
const difficultyFilter = ref('')
const language = ref('python')
const code = ref('')
const running = ref(false)
const submitting = ref(false)
const output = ref<{ status: string; message: string } | null>(null)
const sidebarCollapsed = ref(false)

// 分隔条位置
const splitRatio = ref(50) // 左侧占百分比
const consoleHeight = ref(280)

const filteredProblems = computed(() => {
  if (!difficultyFilter.value) return problems.value
  return problems.value.filter(p => p.difficulty === difficultyFilter.value)
})

const renderedDescription = computed(() => {
  if (!selectedProblem.value?.description) return ''
  return marked(selectedProblem.value.description)
})

const getDifficultyText = (difficulty: string) => {
  const texts: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return texts[difficulty] || difficulty
}

const getStatusText = (status: string) => {
  const statusTexts: Record<string, string> = {
    accepted: '✓ 通过',
    wrong_answer: '✗ 答案错误',
    time_limit_exceeded: '✗ 超时',
    memory_limit_exceeded: '✗ 内存超限',
    runtime_error: '✗ 运行错误',
    compile_error: '✗ 编译错误',
    pending: '等待中',
    running: '运行中'
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
  } finally {
    loading.value = false
  }
}

const selectProblem = (problem: Problem) => {
  selectedProblem.value = problem
  code.value = problem.template_code?.[language.value] || ''
  output.value = null
}

const clearOutput = () => {
  output.value = null
}

// 拖拽分隔条
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

// 拖拽控制台高度
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

onMounted(fetchProblems)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.practice-page {
  height: calc(100vh - 60px);
  overflow: hidden;
  background: #f5f5f5;
}

.practice-layout {
  display: flex;
  height: 100%;
}

/* 左侧题目列表 */
.problem-sidebar {
  width: 280px;
  min-width: 60px;
  background: white;
  border-right: 1px solid #e0e0e0;
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
  border-bottom: 1px solid #e0e0e0;
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
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
  
  &:hover {
    background: #f8f9ff;
  }
  
  &.active {
    background: #eef2ff;
    border-left: 3px solid $primary-color;
  }
}

.problem-id {
  color: #999;
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
  
  &.easy { background: #dcfce7; color: #166534; }
  &.medium { background: #fef3c7; color: #92400e; }
  &.hard { background: #fee2e2; color: #991b1b; }
}

/* 右侧主内容 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: white;
}

.problem-header {
  padding: 12px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
  
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

/* 左右分栏布局 */
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
  border-right: 1px solid #e0e0e0;
  
  .panel-header {
    padding: 8px 16px;
    background: #fafafa;
    border-bottom: 1px solid #e0e0e0;
    
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
  background: #f0f0f0;
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
    background: #ccc;
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
    background: #fafafa;
    border-bottom: 1px solid #e0e0e0;
    
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

/* 题目描述 */
.problem-description {
  padding: 20px;
  line-height: 1.8;
  color: $text-secondary;
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
    background: #f0f7ff;
    color: #e6a23c;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    font-family: 'Consolas', 'Monaco', monospace;
  }
  
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
  
  :deep(hr) {
    border: none;
    height: 2px;
    background: linear-gradient(to right, transparent, #e4e7ed, transparent);
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

/* 代码编辑器 */
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
  background: #1e1e1e;
  color: #d4d4d4;
  tab-size: 2;
  
  &::placeholder {
    color: #666;
  }
}

/* 控制台面板 */
.console-panel {
  border-top: 2px solid #e0e0e0;
  background: #252526;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
}

.console-resizer {
  height: 6px;
  background: #f0f0f0;
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
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.console-title {
  color: #cccccc;
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
  background: #1e1e1e;
}

.console-output {
  padding: 16px 20px;
  
  pre.output-content {
    margin: 0;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.7;
    color: #d4d4d4;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  
  .output-header {
    margin-bottom: 12px;
    
    .output-label {
      color: #888;
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
    background: #1e1e1e;
  }
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #888;
  font-size: 13px;
  
  .el-icon {
    font-size: 18px;
    color: #007acc;
  }
}

.console-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 140px;
  color: #555;
  
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
      color: #444;
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
</style>
