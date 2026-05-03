<template>
  <div class="courses-page page-container">
    <div class="container">
      <div class="page-header">
        <div class="header-badge">课程中心</div>
        <h1>探索编程世界</h1>
        <p>精心设计的课程体系，从入门到进阶，助你成为编程高手</p>
      </div>
      
      <div class="filters">
        <div class="filter-group">
          <el-select v-model="filters.category" placeholder="课程分类" clearable @change="fetchCourses" class="filter-select">
            <el-option label="全部" value="" />
            <el-option label="前端开发" value="frontend" />
            <el-option label="后端开发" value="backend" />
            <el-option label="数据库" value="database" />
            <el-option label="人工智能" value="ai" />
          </el-select>
          <el-select v-model="filters.difficulty" placeholder="难度等级" clearable @change="fetchCourses" class="filter-select">
            <el-option label="全部" value="" />
            <el-option label="入门" value="beginner" />
            <el-option label="进阶" value="intermediate" />
            <el-option label="高级" value="advanced" />
          </el-select>
        </div>
        <el-input v-model="filters.search" placeholder="搜索课程..." clearable @input="fetchCourses" class="search-input">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="course-grid" v-loading="loading">
        <div v-for="course in courses" :key="course.id" class="course-card" @click="$router.push(`/courses/${course.id}`)">
          <div class="course-cover" :class="course.category">
            <el-icon :size="40">
              <component :is="getCategoryIcon(course.category)" />
            </el-icon>
            <div class="cover-overlay">
              <span class="cover-text">查看详情</span>
            </div>
          </div>
          <div class="course-body">
            <div class="course-tags">
              <span class="course-level" :class="course.difficulty">{{ getDifficultyText(course.difficulty) }}</span>
              <span class="course-category">{{ getCategoryLabel(course.category) }}</span>
            </div>
            <h3>{{ course.title }}</h3>
            <p>{{ course.description }}</p>
            <div class="course-stats">
              <span><el-icon><Clock /></el-icon> {{ course.duration }}课时</span>
              <span><el-icon><User /></el-icon> {{ formatNumber(course.enrollment_count) }}学员</span>
            </div>
          </div>
          <div class="course-footer">
            <div class="course-rating">
              <el-rate v-model="course.rating" disabled show-score text-color="#ff9900" size="small" />
            </div>
            <el-button 
              :type="course.isEnrolled ? 'success' : 'primary'" 
              size="small"
              round
              @click.stop="handleCourseAction(course)"
            >
              {{ course.isEnrolled ? '继续学习' : '立即报名' }}
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

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    frontend: '前端',
    backend: '后端',
    database: '数据库',
    ai: 'AI'
  }
  return labels[category] || category
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
    router.push(`/courses/${course.id}/learn`)
  } else {
    enrollCourse(course)
  }
}

const enrollCourse = async (course: Course) => {
  try {
    await courseApi.enrollCourse(course.id)
    ElMessage.success('报名成功')
    userStore.updateEnrolledCourses(course.id)
    fetchCourses()
  } catch (error) {
    ElMessage.error('报名失败')
  }
}

const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await courseApi.getCourses({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    })
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
  fetchCourses()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.courses-page {
  padding: 40px 0 80px;
  min-height: calc(100vh - 70px);
}

.page-header {
  text-align: center;
  margin-bottom: 48px;
  
  .header-badge {
    display: inline-block;
    padding: 6px 16px;
    background: $primary-light;
    color: $primary-color;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 16px;
    border: 1px solid $primary-border;
  }
  
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 12px;
    color: $text-primary;
    letter-spacing: -0.03em;
  }
  
  p {
    color: $text-secondary;
    font-size: 1.1rem;
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.7;
  }
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36px;
  gap: 16px;
  flex-wrap: wrap;
  
  .filter-group {
    display: flex;
    gap: 12px;
  }
  
  .filter-select {
    width: 150px;
    
    :deep(.el-input__wrapper) {
      border-radius: $radius-sm;
      box-shadow: 0 0 0 1px $border-color inset;
      transition: all $transition-base;
      
      &:hover {
        box-shadow: 0 0 0 1px $primary-border inset;
      }
      
      &.is-focus {
        box-shadow: 0 0 0 1px $primary-color inset, 0 0 0 3px rgba(15, 118, 110, 0.1);
      }
    }
  }
  
  .search-input {
    width: 280px;
    
    :deep(.el-input__wrapper) {
      border-radius: $radius-sm;
      box-shadow: 0 0 0 1px $border-color inset;
      transition: all $transition-base;
      
      &:hover {
        box-shadow: 0 0 0 1px $primary-border inset;
      }
      
      &.is-focus {
        box-shadow: 0 0 0 1px $primary-color inset, 0 0 0 3px rgba(15, 118, 110, 0.1);
      }
    }
  }
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  min-height: 400px;
}

.course-card {
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
  border: 1px solid $border-color;
  transition: all $transition-base;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  box-shadow: $shadow-card;
  
  &:hover {
    border-color: $primary-border;
    box-shadow: $shadow-card-hover;
    transform: translateY(-4px);
    
    .cover-overlay {
      opacity: 1;
    }
  }
}

.course-cover {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  overflow: hidden;
  
  &.frontend { background: linear-gradient(135deg, #ea580c, #f97316); }
  &.backend { background: linear-gradient(135deg, #16a34a, #22c55e); }
  &.database { background: linear-gradient(135deg, #0891b2, #06b6d4); }
  &.ai { background: linear-gradient(135deg, #dc2626, #ef4444); }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to top, rgba(0,0,0,0.15), transparent);
    pointer-events: none;
  }
  
  .el-icon {
    opacity: 0.9;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  }
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity $transition-base;
  
  .cover-text {
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 8px 24px;
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 24px;
    transition: all $transition-base;
  }
}

.course-body {
  padding: 20px 24px 16px;
  flex: 1;
}

.course-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.course-level {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  
  &.beginner { background: $color-easy-bg; color: $color-easy-text; }
  &.intermediate { background: $color-medium-bg; color: $color-medium-text; }
  &.advanced { background: $color-hard-bg; color: $color-hard-text; }
}

.course-category {
  font-size: 0.75rem;
  color: $text-muted;
  font-weight: 500;
}

.course-body h3 {
  font-size: 1.15rem;
  margin-bottom: 8px;
  color: $text-primary;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

.course-body p {
  color: $text-secondary;
  font-size: 0.9rem;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
}

.course-stats {
  display: flex;
  gap: 16px;
  color: $text-muted;
  font-size: 0.85rem;
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.course-footer {
  padding: 16px 24px;
  border-top: 1px solid $border-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.course-rating {
  :deep(.el-rate) {
    height: 20px;
    
    .el-rate__icon {
      font-size: 14px;
    }
    
    .el-rate__text {
      font-size: 13px;
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}
</style>
