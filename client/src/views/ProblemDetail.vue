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
          <h2>{{ currentProblem.title }}</h2>
          <div class="problem-tags">
            <span class="difficulty-tag" :class="currentProblem.difficulty">
              {{ getDifficultyText(currentProblem.difficulty) }}
            </span>
            <el-tag v-for="tag in currentProblem.tags" :key="tag" size="small">{{ tag }}</el-tag>
          </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { problemApi, submissionApi } from '@/api/problem'
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
    background: rgba(79, 70, 229, 0.05);
  }
  
  &.active {
    background: rgba(79, 70, 229, 0.1);
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
  
  &.easy { background: #dcfce7; color: #166534; }
  &.medium { background: #fef3c7; color: #92400e; }
  &.hard { background: #fee2e2; color: #991b1b; }
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
</style>
