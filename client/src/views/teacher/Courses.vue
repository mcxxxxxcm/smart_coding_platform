<template>
  <div class="courses-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>课程管理</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        发布新课程
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <el-card shadow="hover" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="课程名称">
          <el-input v-model="filters.search" placeholder="搜索课程" clearable @keyup.enter="fetchCourses" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filters.category" placeholder="全部分类" clearable>
            <el-option label="前端开发" value="frontend" />
            <el-option label="后端开发" value="backend" />
            <el-option label="数据库" value="database" />
            <el-option label="人工智能" value="ai" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchCourses">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 课程列表 -->
    <el-card shadow="hover" class="table-card">
      <el-table :data="courses" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="课程名称" min-width="150" show-overflow-tooltip />
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
        <el-table-column prop="enrollment_count" label="学生" width="60" align="center" />
        <el-table-column prop="rating" label="评分" width="60" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="editCourse(row)">编辑</el-button>
            <el-button 
              size="small" 
              text 
              :type="row.status === 'published' ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'published' ? '下架' : '发布' }}
            </el-button>
            <el-button size="small" text type="danger" @click="deleteCourse(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchCourses"
          @current-change="fetchCourses"
        />
      </div>
    </el-card>

    <!-- 创建/编辑课程对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑课程' : '发布新课程'"
      width="600px"
      destroy-on-close
    >
      <el-form :model="courseForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="课程名称" prop="title">
          <el-input v-model="courseForm.title" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input v-model="courseForm.description" type="textarea" :rows="3" placeholder="请输入课程描述" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="courseForm.category" placeholder="请选择分类">
            <el-option label="前端开发" value="frontend" />
            <el-option label="后端开发" value="backend" />
            <el-option label="数据库" value="database" />
            <el-option label="人工智能" value="ai" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="courseForm.difficulty" placeholder="请选择难度">
            <el-option label="入门" value="beginner" />
            <el-option label="进阶" value="intermediate" />
            <el-option label="高级" value="advanced" />
          </el-select>
        </el-form-item>
        <el-form-item label="时长" prop="duration">
          <el-input-number v-model="courseForm.duration" :min="1" :max="200" />
          <span style="margin-left: 10px;">课时</span>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="courseForm.price" :min="0" :precision="2" />
          <span style="margin-left: 10px;">元（0 表示免费）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCourse" :loading="submitting">
          {{ isEdit ? '保存修改' : '发布课程' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { courseApi } from '@/api/course'
import type { Course } from '@/types'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const courses = ref<Course[]>([])
const filters = reactive({
  search: '',
  category: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const courseForm = reactive({
  id: 0,
  title: '',
  description: '',
  category: '',
  difficulty: '',
  duration: 20,
  price: 0
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入课程描述', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }]
}

const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    frontend: '前端开发',
    backend: '后端开发',
    database: '数据库',
    ai: '人工智能'
  }
  return map[category] || category
}

const getDifficultyText = (difficulty: string) => {
  const map: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级'
  }
  return map[difficulty] || difficulty
}

const getDifficultyType = (difficulty: string) => {
  const map: Record<string, string> = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger'
  }
  return map[difficulty] || 'info'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await courseApi.getCourses({
      page: pagination.page,
      limit: pagination.limit,
      teacher_only: true,
      ...filters
    })
    courses.value = res.data || []
    if (res.pagination) {
      pagination.total = res.pagination.total
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.search = ''
  filters.category = ''
  filters.status = ''
  pagination.page = 1
  fetchCourses()
}

const showCreateDialog = () => {
  isEdit.value = false
  Object.assign(courseForm, {
    id: 0,
    title: '',
    description: '',
    category: '',
    difficulty: '',
    duration: 20,
    price: 0
  })
  dialogVisible.value = true
}

const editCourse = (course: Course) => {
  isEdit.value = true
  Object.assign(courseForm, {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    difficulty: course.difficulty,
    duration: course.duration,
    price: parseFloat(course.price as string) || 0
  })
  dialogVisible.value = true
}

const submitCourse = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      title: courseForm.title,
      description: courseForm.description,
      category: courseForm.category,
      difficulty: courseForm.difficulty,
      duration: courseForm.duration,
      price: courseForm.price
    }
    
    if (isEdit.value) {
      await courseApi.updateCourse(courseForm.id, data)
      ElMessage.success('课程更新成功')
      dialogVisible.value = false
    } else {
      const res = await courseApi.createCourse(data)
      dialogVisible.value = false
      
      try {
        await ElMessageBox.confirm('课程创建成功！是否立即发布？', '提示', {
          confirmButtonText: '立即发布',
          cancelButtonText: '稍后再说',
          type: 'success'
        })
        
        if (res.data?.id) {
          await courseApi.updateCourse(res.data.id, { status: 'published' })
          ElMessage.success('课程已发布')
        }
      } catch {
        ElMessage.success('课程已保存为草稿')
      }
    }
    fetchCourses()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (course: Course) => {
  const newStatus = course.status === 'published' ? 'draft' : 'published'
  const action = newStatus === 'published' ? '发布' : '下架'
  
  try {
    await ElMessageBox.confirm(`确定要${action}课程「${course.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await courseApi.updateCourse(course.id, { status: newStatus })
    ElMessage.success(`课程已${action}`)
    fetchCourses()
  } catch {
    // 用户取消
  }
}

const deleteCourse = async (course: Course) => {
  try {
    await ElMessageBox.confirm(`确定要删除课程「${course.title}」吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    await courseApi.deleteCourse(course.id)
    ElMessage.success('课程已删除')
    fetchCourses()
  } catch {
    // 用户取消
  }
}

onMounted(fetchCourses)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.courses-page {
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
