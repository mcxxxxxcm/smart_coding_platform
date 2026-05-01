<template>
  <div class="courses-page page-container">
    <div class="container">
      <div class="page-header">
        <h1>课程中心</h1>
        <p>精心设计的课程体系，从入门到进阶</p>
      </div>
      
      <div class="filters">
        <el-select v-model="filters.category" placeholder="课程分类" clearable @change="fetchCourses">
          <el-option label="全部" value="" />
          <el-option label="前端开发" value="frontend" />
          <el-option label="后端开发" value="backend" />
          <el-option label="数据库" value="database" />
          <el-option label="人工智能" value="ai" />
        </el-select>
        <el-select v-model="filters.difficulty" placeholder="难度等级" clearable @change="fetchCourses">
          <el-option label="全部" value="" />
          <el-option label="入门" value="beginner" />
          <el-option label="进阶" value="intermediate" />
          <el-option label="高级" value="advanced" />
        </el-select>
        <el-input v-model="filters.search" placeholder="搜索课程" clearable @input="fetchCourses" class="search-input">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="course-grid" v-loading="loading">
        <div v-for="course in courses" :key="course.id" class="course-card">
          <div class="course-content" @click="$router.push(`/courses/${course.id}`)">
            <div class="course-image" :class="course.category">
              <el-icon :size="48">
                <component :is="getCategoryIcon(course.category)" />
              </el-icon>
            </div>
            <div class="course-info">
              <span class="course-level" :class="course.difficulty">{{ getDifficultyText(course.difficulty) }}</span>
              <h3>{{ course.title }}</h3>
              <p>{{ course.description }}</p>
              <div class="course-meta">
                <span><el-icon><Clock /></el-icon> {{ course.duration }}课时</span>
                <span><el-icon><User /></el-icon> {{ formatNumber(course.enrollment_count) }}学员</span>
              </div>
              <div class="course-rating">
                <el-rate v-model="course.rating" disabled show-score text-color="#ff9900" />
              </div>
            </div>
          </div>
          <div class="course-actions">
            <el-button 
              :type="course.isEnrolled ? 'success' : 'primary'" 
              class="start-btn"
              @click.stop="handleCourseAction(course)"
            >
              {{ course.isEnrolled ? '进入学习' : '立即报名' }}
            </el-button>
          </div>
        </div>
      </div>
      
      <div class="pagination" v-if="pagination.total > pagination.limit">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="fetchCourses"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { courseApi } from '@/api/course'
import { useUserStore } from '@/stores/user'
import type { Course } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const courses = ref<Course[]>([])

const filters = reactive({
  category: '',
  difficulty: '',
  search: ''
})

const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0
})

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    frontend: 'Monitor',
    backend: 'DataLine',
    database: 'Coin',
    ai: 'Cpu'
  }
  return icons[category] || 'Document'
}

const getDifficultyText = (difficulty: string) => {
  const texts: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级'
  }
  return texts[difficulty] || difficulty
}

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const handleCourseAction = (course: Course) => {
  if (course.isEnrolled) {
    // 已报名，进入学习
    router.push(`/courses/${course.id}/learn`)
  } else {
    // 未报名，先报名
    enrollCourse(course)
  }
}

const enrollCourse = async (course: Course) => {
  try {
    await courseApi.enrollCourse(course.id)
    ElMessage.success('报名成功')
    // 更新报名状态
    userStore.updateEnrolledCourses(course.id)
    // 刷新课程列表
    fetchCourses()
  } catch (error) {
    ElMessage.error('报名失败')
  }
}

const fetchCourses = async () => {
  console.log('开始获取课程列表...')
  loading.value = true
  try {
    const res = await courseApi.getCourses({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    })
    console.log('API 响应:', res)
    courses.value = (res.data || []).map(course => ({
    ...course,
    isEnrolled: userStore.isEnrolled(course.id)
  }))
  if (res.pagination) {
    pagination.total = res.pagination.total
  }
  } catch (error) {
    console.error('获取课程失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('Courses 组件已挂载')
  fetchCourses()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.courses-page {
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 10px;
    color: $text-primary;
  }
  
  p {
    color: $text-secondary;
    font-size: 1.1rem;
  }
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  
  .el-select {
    width: 150px;
  }
  
  .search-input {
    width: 300px;
  }
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 30px;
  min-height: 400px;
}

.course-card {
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
  border: 1px solid $border-color;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  
  &:hover {
    border-color: $primary-border;
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }
  
  .course-content {
    flex: 1;
    cursor: pointer;
  }
  
  .course-actions {
    padding: 16px;
    border-top: 1px solid $border-light;
    
    .start-btn {
      width: 100%;
    }
  }
}

.course-image {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  &.frontend { background: $color-frontend; }
  &.backend { background: $color-backend; }
  &.database { background: $color-database; }
  &.ai { background: $color-ai; }
}

.course-info {
  padding: 24px;
}

.course-level {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 12px;
  
  &.beginner { background: $color-easy-bg; color: $color-easy-text; }
  &.intermediate { background: $color-medium-bg; color: $color-medium-text; }
  &.advanced { background: $color-hard-bg; color: $color-hard-text; }
}

.course-info h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: $text-primary;
}

.course-info p {
  color: $text-secondary;
  font-size: 0.95rem;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  gap: 20px;
  color: $text-secondary;
  font-size: 0.9rem;
  margin-bottom: 10px;
  
  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.course-rating {
  margin-bottom: 15px;
}

.start-btn {
  width: 100%;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
</style>
