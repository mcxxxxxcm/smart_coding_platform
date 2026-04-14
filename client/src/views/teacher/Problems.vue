<template>
  <div class="problems-page">
    <div class="page-header">
      <h2>题目管理</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        添加题目
      </el-button>
    </div>

    <el-card shadow="hover" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="题目名称">
          <el-input v-model="filters.search" placeholder="搜索题目" clearable @keyup.enter="fetchProblems" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filters.category" placeholder="全部分类" clearable>
            <el-option label="算法" value="algorithm" />
            <el-option label="数据结构" value="datastructure" />
            <el-option label="字符串" value="string" />
            <el-option label="动态规划" value="dp" />
            <el-option label="图论" value="graph" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="filters.difficulty" placeholder="全部难度" clearable>
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchProblems">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <el-table :data="problems" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="题目名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="90">
          <template #default="{ row }">
            <el-tag size="small">{{ getCategoryText(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="70">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.difficulty)" size="small">
              {{ getDifficultyText(row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submission_count" label="提交" width="60" align="center" />
        <el-table-column prop="accepted_count" label="通过" width="60" align="center" />
        <el-table-column prop="acceptance_rate" label="通过率" width="70" align="center">
          <template #default="{ row }">
            {{ row.acceptance_rate || 0 }}%
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="editProblem(row)">编辑</el-button>
            <el-button 
              size="small" 
              text 
              :type="row.status === 'published' ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'published' ? '下架' : '发布' }}
            </el-button>
            <el-button size="small" text type="danger" @click="deleteProblem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchProblems"
          @current-change="fetchProblems"
        />
      </div>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑题目' : '添加题目'"
      width="700px"
      destroy-on-close
    >
      <el-form :model="problemForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="题目名称" prop="title">
          <el-input v-model="problemForm.title" placeholder="请输入题目名称" />
        </el-form-item>
        <el-form-item label="题目描述" prop="description">
          <el-input v-model="problemForm.description" type="textarea" :rows="4" placeholder="请输入题目描述" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="problemForm.category" placeholder="请选择分类" style="width: 100%;">
                <el-option label="算法" value="algorithm" />
                <el-option label="数据结构" value="datastructure" />
                <el-option label="字符串" value="string" />
                <el-option label="动态规划" value="dp" />
                <el-option label="图论" value="graph" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度" prop="difficulty">
              <el-select v-model="problemForm.difficulty" placeholder="请选择难度" style="width: 100%;">
                <el-option label="简单" value="easy" />
                <el-option label="中等" value="medium" />
                <el-option label="困难" value="hard" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="输入格式" prop="input_format">
          <el-input v-model="problemForm.input_format" type="textarea" :rows="2" placeholder="请输入输入格式说明" />
        </el-form-item>
        <el-form-item label="输出格式" prop="output_format">
          <el-input v-model="problemForm.output_format" type="textarea" :rows="2" placeholder="请输入输出格式说明" />
        </el-form-item>
        <el-form-item label="样例输入">
          <el-input v-model="problemForm.examples_input" type="textarea" :rows="3" placeholder="请输入样例输入" />
        </el-form-item>
        <el-form-item label="样例输出">
          <el-input v-model="problemForm.examples_output" type="textarea" :rows="3" placeholder="请输入样例输出" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="时间限制">
              <el-input-number v-model="problemForm.time_limit" :min="100" :max="10000" :step="100" />
              <span style="margin-left: 10px;">ms</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内存限制">
              <el-input-number v-model="problemForm.memory_limit" :min="16" :max="1024" :step="16" />
              <span style="margin-left: 10px;">MB</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProblem" :loading="submitting">
          {{ isEdit ? '保存修改' : '添加题目' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { problemApi } from '@/api/problem'
import type { Problem } from '@/types'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const problems = ref<Problem[]>([])
const filters = reactive({
  search: '',
  category: '',
  difficulty: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const problemForm = reactive({
  id: 0,
  title: '',
  description: '',
  category: '',
  difficulty: '',
  input_format: '',
  output_format: '',
  examples_input: '',
  examples_output: '',
  time_limit: 1000,
  memory_limit: 256
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入题目名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入题目描述', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }]
}

const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    algorithm: '算法',
    datastructure: '数据结构',
    string: '字符串',
    dp: '动态规划',
    graph: '图论'
  }
  return map[category] || category
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

const fetchProblems = async () => {
  loading.value = true
  try {
    const res = await problemApi.getProblems({
      page: pagination.page,
      limit: pagination.limit,
      teacher_only: true,
      ...filters
    })
    problems.value = res.data || []
    if (res.pagination) {
      pagination.total = res.pagination.total
    }
  } catch (error) {
    console.error('获取题目列表失败:', error)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.search = ''
  filters.category = ''
  filters.difficulty = ''
  filters.status = ''
  pagination.page = 1
  fetchProblems()
}

const showCreateDialog = () => {
  isEdit.value = false
  Object.assign(problemForm, {
    id: 0,
    title: '',
    description: '',
    category: '',
    difficulty: '',
    input_format: '',
    output_format: '',
    examples_input: '',
    examples_output: '',
    time_limit: 1000,
    memory_limit: 256
  })
  dialogVisible.value = true
}

const editProblem = async (problem: Problem) => {
  isEdit.value = true
  const detailRes = await problemApi.getProblemById(problem.id)
  const data = detailRes.data as Problem
  Object.assign(problemForm, {
    id: data.id,
    title: data.title,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    input_format: (data as any).input_format || '',
    output_format: (data as any).output_format || '',
    examples_input: '',
    examples_output: '',
    time_limit: (data as any).time_limit || 1000,
    memory_limit: (data as any).memory_limit || 256
  })
  dialogVisible.value = true
}

const submitProblem = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  submitting.value = true
  try {
    const data: any = {
      title: problemForm.title,
      description: problemForm.description,
      category: problemForm.category,
      difficulty: problemForm.difficulty,
      input_format: problemForm.input_format,
      output_format: problemForm.output_format,
      examples: problemForm.examples_input && problemForm.examples_output ? [
        { input: problemForm.examples_input, output: problemForm.examples_output }
      ] : [],
      time_limit: problemForm.time_limit,
      memory_limit: problemForm.memory_limit
    }

    if (isEdit.value) {
      await problemApi.updateProblem(problemForm.id, data)
      ElMessage.success('题目更新成功')
    } else {
      await problemApi.createProblem(data)
      ElMessage.success('题目添加成功')
    }
    dialogVisible.value = false
    fetchProblems()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (problem: Problem) => {
  const newStatus = problem.status === 'published' ? 'draft' : 'published'
  const action = newStatus === 'published' ? '发布' : '下架'
  
  try {
    await ElMessageBox.confirm(`确定要${action}题目「${problem.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await problemApi.updateProblem(problem.id, { status: newStatus })
    ElMessage.success(`题目已${action}`)
    fetchProblems()
  } catch {
    // 用户取消
  }
}

const deleteProblem = async (problem: Problem) => {
  try {
    await ElMessageBox.confirm(`确定要删除题目「${problem.title}」吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    await problemApi.deleteProblem(problem.id)
    ElMessage.success('题目已删除')
    fetchProblems()
  } catch {
    // 用户取消
  }
}

onMounted(fetchProblems)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.problems-page {
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
  
  .filter-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}
</style>
