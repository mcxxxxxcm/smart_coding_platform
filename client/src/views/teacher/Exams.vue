<template>
  <div class="exams-page">
    <div class="page-header">
      <h2>考试管理</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        创建考试
      </el-button>
    </div>

    <el-card shadow="hover" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="考试名称">
          <el-input v-model="filters.search" placeholder="搜索考试" clearable @keyup.enter="fetchExams" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已结束" value="ended" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchExams">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <el-table :data="exams" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="考试名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="duration" label="时长" width="80" align="center">
          <template #default="{ row }">
            {{ row.duration }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="total_score" label="总分" width="70" align="center" />
        <el-table-column prop="passing_score" label="及格" width="70" align="center" />
        <el-table-column prop="participant_count" label="人数" width="70" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="140">
          <template #default="{ row }">
            {{ row.start_time ? formatDateTime(row.start_time) : '未设置' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" text type="primary" @click="viewAnalytics(row)">分析</el-button>
              <el-button size="small" text type="primary" @click="editExam(row)">编辑</el-button>
              <el-button 
                size="small" 
                text 
                :type="row.status === 'published' ? 'warning' : 'success'"
                @click="toggleStatus(row)"
                :disabled="row.status === 'ended'"
              >
                {{ row.status === 'published' ? '下架' : '发布' }}
              </el-button>
              <el-button size="small" text type="danger" @click="deleteExam(row)">删除</el-button>
            </div>
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
          @size-change="fetchExams"
          @current-change="fetchExams"
        />
      </div>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑考试' : '创建考试'"
      width="800px"
      destroy-on-close
    >
      <el-form :model="examForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="考试名称" prop="title">
          <el-input v-model="examForm.title" placeholder="请输入考试名称" />
        </el-form-item>
        <el-form-item label="考试描述" prop="description">
          <el-input v-model="examForm.description" type="textarea" :rows="3" placeholder="请输入考试描述" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="考试时长" prop="duration">
              <el-input-number v-model="examForm.duration" :min="10" :max="300" :step="10" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总分" prop="total_score">
              <el-input-number v-model="examForm.total_score" :min="10" :max="500" :step="10" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="及格分" prop="passing_score">
              <el-input-number v-model="examForm.passing_score" :min="0" :max="500" :step="5" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="examForm.start_time"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="examForm.end_time"
                type="datetime"
                placeholder="选择结束时间"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="允许回顾">
              <el-switch v-model="examForm.allow_review" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="随机顺序">
              <el-switch v-model="examForm.random_order" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">题目设置</el-divider>
        
        <div class="questions-section">
          <div class="questions-header">
            <span>已选题目 ({{ examForm.questions.length }}题)</span>
            <el-button type="primary" size="small" @click="showAddQuestionDialog">添加题目</el-button>
          </div>
          <el-table :data="examForm.questions" stripe size="small" max-height="300">
            <el-table-column prop="order" label="序号" width="60" />
            <el-table-column prop="title" label="题目名称" min-width="200" />
            <el-table-column prop="difficulty" label="难度" width="80">
              <template #default="{ row }">
                <el-tag :type="getDifficultyType(row.difficulty)" size="small">
                  {{ getDifficultyText(row.difficulty) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="score" label="分值" width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.score" :min="1" :max="100" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button size="small" text type="danger" @click="removeQuestion($index)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExam" :loading="submitting">
          {{ isEdit ? '保存修改' : '创建考试' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="questionDialogVisible" 
      title="选择题目"
      width="700px"
    >
      <el-input v-model="problemSearch" placeholder="搜索题目" clearable @keyup.enter="searchProblems" style="margin-bottom: 16px;">
        <template #append>
          <el-button @click="searchProblems">搜索</el-button>
        </template>
      </el-input>
      <el-table :data="availableProblems" v-loading="problemLoading" stripe max-height="400" @selection-change="handleProblemSelection">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="题目名称" min-width="200" />
        <el-table-column prop="difficulty" label="难度" width="100">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.difficulty)" size="small">
              {{ getDifficultyText(row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
      </el-table>
      <template #footer>
        <el-button @click="questionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddQuestions">确定添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { examApi } from '@/api/exam'
import type { Exam } from '@/api/exam'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const questionDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const exams = ref<Exam[]>([])
const filters = reactive({
  search: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const examForm = reactive({
  id: 0,
  title: '',
  description: '',
  duration: 60,
  total_score: 100,
  passing_score: 60,
  start_time: null as Date | null,
  end_time: null as Date | null,
  allow_review: true,
  random_order: false,
  questions: [] as any[]
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入考试名称', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入考试时长', trigger: 'blur' }],
  total_score: [{ required: true, message: '请输入总分', trigger: 'blur' }]
}

const problemSearch = ref('')
const problemLoading = ref(false)
const availableProblems = ref<any[]>([])
const selectedProblems = ref<any[]>([])

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
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

const fetchExams = async () => {
  loading.value = true
  try {
    const res = await examApi.getExams({
      page: pagination.page,
      limit: pagination.limit,
      teacher_only: true,
      ...filters
    })
    exams.value = res.data || []
    if (res.pagination) {
      pagination.total = res.pagination.total
    }
  } catch (error) {
    console.error('获取考试列表失败:', error)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.search = ''
  filters.status = ''
  pagination.page = 1
  fetchExams()
}

const showCreateDialog = () => {
  isEdit.value = false
  Object.assign(examForm, {
    id: 0,
    title: '',
    description: '',
    duration: 60,
    total_score: 100,
    passing_score: 60,
    start_time: null,
    end_time: null,
    allow_review: true,
    random_order: false,
    questions: []
  })
  dialogVisible.value = true
}

const editExam = async (exam: Exam) => {
  isEdit.value = true
  const detailRes = await examApi.getExamById(exam.id)
  const data = detailRes.data as any
  Object.assign(examForm, {
    id: data.id,
    title: data.title,
    description: data.description || '',
    duration: data.duration,
    total_score: data.total_score,
    passing_score: data.passing_score,
    start_time: data.start_time ? new Date(data.start_time) : null,
    end_time: data.end_time ? new Date(data.end_time) : null,
    allow_review: data.allow_review,
    random_order: data.random_order,
    questions: (data.questions || []).map((q: any, index: number) => ({
      problem_id: q.problem_id,
      title: q.title,
      difficulty: q.difficulty,
      category: q.category,
      score: q.score,
      order: index + 1
    }))
  })
  dialogVisible.value = true
}

const showAddQuestionDialog = async () => {
  problemSearch.value = ''
  await searchProblems()
  questionDialogVisible.value = true
}

const searchProblems = async () => {
  problemLoading.value = true
  try {
    const res = await examApi.getAvailableProblems({ search: problemSearch.value })
    availableProblems.value = res.data || []
  } catch (error) {
    console.error('获取题目列表失败:', error)
  } finally {
    problemLoading.value = false
  }
}

const handleProblemSelection = (selection: any[]) => {
  selectedProblems.value = selection
}

const confirmAddQuestions = () => {
  const existingIds = new Set(examForm.questions.map(q => q.problem_id))
  const newQuestions = selectedProblems.value
    .filter(p => !existingIds.has(p.id))
    .map((p, index) => ({
      problem_id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      category: p.category,
      score: 10,
      order: examForm.questions.length + index + 1
    }))
  
  examForm.questions.push(...newQuestions)
  questionDialogVisible.value = false
  selectedProblems.value = []
}

const removeQuestion = (index: number) => {
  examForm.questions.splice(index, 1)
  examForm.questions.forEach((q, i) => {
    q.order = i + 1
  })
}

const submitExam = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  if (examForm.questions.length === 0) {
    ElMessage.warning('请至少添加一道题目')
    return
  }

  submitting.value = true
  try {
    const data: any = {
      title: examForm.title,
      description: examForm.description,
      duration: examForm.duration,
      total_score: examForm.total_score,
      passing_score: examForm.passing_score,
      start_time: examForm.start_time?.toISOString() || null,
      end_time: examForm.end_time?.toISOString() || null,
      allow_review: examForm.allow_review,
      random_order: examForm.random_order,
      questions: examForm.questions.map(q => ({
        problem_id: q.problem_id,
        score: q.score
      }))
    }

    if (isEdit.value) {
      await examApi.updateExam(examForm.id, data)
      ElMessage.success('考试更新成功')
    } else {
      await examApi.createExam(data)
      ElMessage.success('考试创建成功')
    }
    dialogVisible.value = false
    fetchExams()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (exam: Exam) => {
  if (exam.status === 'ended') return
  
  const newStatus = exam.status === 'published' ? 'draft' : 'published'
  const action = newStatus === 'published' ? '发布' : '下架'
  
  try {
    await ElMessageBox.confirm(`确定要${action}考试「${exam.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await examApi.updateExam(exam.id, { status: newStatus })
    ElMessage.success(`考试已${action}`)
    fetchExams()
  } catch {
    // 用户取消
  }
}

const deleteExam = async (exam: Exam) => {
  try {
    await ElMessageBox.confirm(`确定要删除考试「${exam.title}」吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    await examApi.deleteExam(exam.id)
    ElMessage.success('考试已删除')
    fetchExams()
  } catch {
    // 用户取消
  }
}

const viewAnalytics = (exam: Exam) => {
  router.push(`/teacher/exams/${exam.id}/analytics`)
}

onMounted(fetchExams)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.exams-page {
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
    .action-buttons {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 4px;
      
      .el-button {
        padding: 4px 8px;
      }
    }
    
    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
  
  .questions-section {
    .questions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      span {
        font-weight: 500;
        color: $text-primary;
      }
    }
  }
}
</style>
