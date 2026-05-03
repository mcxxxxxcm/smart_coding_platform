<template>
  <div class="course-detail-page page-container">
    <div class="container" v-loading="loading">
      <div class="course-hero" v-if="course">
        <div class="hero-cover" :class="course.category">
          <el-icon :size="64">
            <component :is="getCategoryIcon(course.category)" />
          </el-icon>
        </div>
        <div class="hero-info">
          <div class="hero-tags">
            <span class="category-tag">{{ getCategoryLabel(course.category) }}</span>
          </div>
          <h1>{{ course.title }}</h1>
          <p class="description">{{ course.description }}</p>
          <div class="meta-row">
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>{{ course.teacher_name }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>{{ course.duration }}课时</span>
            </div>
            <div class="meta-item">
              <el-icon><Star /></el-icon>
              <span>{{ course.rating }} 评分</span>
            </div>
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>{{ course.enrollment_count }}人学习</span>
            </div>
          </div>
          <div class="hero-actions">
            <el-button v-if="!course.isEnrolled" type="primary" size="large" @click="enroll" round>
              立即报名
            </el-button>
            <el-button v-else type="success" size="large" @click="startLearning" round>
              开始学习
            </el-button>
          </div>
        </div>
      </div>
      
      <div class="course-content" v-if="course">
        <div class="chapters-section">
          <div class="section-title">
            <h2>课程目录</h2>
            <span class="chapter-count">{{ course.chapters?.length || 0 }} 个章节</span>
          </div>
          <el-collapse v-model="activeChapters" class="chapter-collapse">
            <el-collapse-item
              v-for="chapter in course.chapters"
              :key="chapter.id"
              :name="chapter.id"
            >
              <template #title>
                <div class="chapter-title">
                  <span class="chapter-name">{{ chapter.title }}</span>
                  <span class="lesson-count">{{ chapter.lessons?.length || 0 }}课时</span>
                </div>
              </template>
              <div class="lessons-list">
                <div
                  v-for="lesson in chapter.lessons"
                  :key="lesson.id"
                  class="lesson-item"
                  @click="playLesson(lesson)"
                >
                  <div class="lesson-left">
                    <div class="lesson-play-icon">
                      <el-icon><VideoPlay /></el-icon>
                    </div>
                    <span class="lesson-title">{{ lesson.title }}</span>
                  </div>
                  <div class="lesson-right">
                    <span class="lesson-duration">{{ lesson.duration }}分钟</span>
                    <el-tag v-if="lesson.is_free" size="small" type="success" effect="plain" round>免费</el-tag>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { courseApi } from '@/api/course'
import { useUserStore } from '@/stores/user'
import type { CourseDetail, Chapter, Lesson } from '@/api/course'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const course = ref<CourseDetail | null>(null)
const activeChapters = ref<number[]>([])

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
    frontend: '前端开发',
    backend: '后端开发',
    database: '数据库',
    ai: '人工智能'
  }
  return labels[category] || category
}

const fetchCourse = async () => {
  loading.value = true
  try {
    const res = await courseApi.getCourseById(Number(route.params.id))
    course.value = res.data
    if (course.value?.isEnrolled && userStore.isLoggedIn) {
      userStore.updateEnrolledCourses(course.value.id)
    }
    if (course.value?.chapters?.length) {
      activeChapters.value = [course.value.chapters[0].id]
    }
  } finally {
    loading.value = false
  }
}

const enroll = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    await courseApi.enrollCourse(Number(route.params.id))
    ElMessage.success('报名成功')
    
    if (course.value) {
      course.value.isEnrolled = true
    }
    
    userStore.updateEnrolledCourses(Number(route.params.id))
    await fetchCourse()
  } catch (error) {
    console.error('报名失败:', error)
    ElMessage.error('报名失败')
  }
}

const startLearning = () => {
  if (!course.value?.isEnrolled) {
    ElMessage.warning('请先报名课程')
    return
  }
  router.push(`/courses/${route.params.id}/learn`)
}

const playLesson = (lesson: Lesson) => {
  if (!course.value?.isEnrolled && !lesson.is_free) {
    ElMessage.warning('请先报名课程')
    return
  }
  
  router.push({
    path: `/courses/${route.params.id}/learn`,
    query: { lesson: lesson.id }
  })
}

onMounted(fetchCourse)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.course-detail-page {
  padding: 40px 0 80px;
  min-height: calc(100vh - 70px);
}

.course-hero {
  display: flex;
  gap: 40px;
  background: white;
  padding: 40px;
  border-radius: $radius-lg;
  margin-bottom: 32px;
  box-shadow: $shadow-card;
  border: 1px solid $border-color;
}

.hero-cover {
  width: 320px;
  height: 220px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  
  &.frontend { background: linear-gradient(135deg, #ea580c, #f97316); }
  &.backend { background: linear-gradient(135deg, #16a34a, #22c55e); }
  &.database { background: linear-gradient(135deg, #0891b2, #06b6d4); }
  &.ai { background: linear-gradient(135deg, #dc2626, #ef4444); }
  
  .el-icon {
    opacity: 0.9;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
  }
}

.hero-info {
  flex: 1;
  
  .hero-tags {
    margin-bottom: 12px;
  }
  
  .category-tag {
    display: inline-block;
    padding: 4px 12px;
    background: $primary-light;
    color: $primary-color;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid $primary-border;
  }
  
  h1 {
    font-size: 1.8rem;
    margin-bottom: 12px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.3;
  }
  
  .description {
    color: $text-secondary;
    margin-bottom: 20px;
    line-height: 1.8;
    font-size: 0.95rem;
  }
}

.meta-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $text-secondary;
  font-size: 0.9rem;
  
  .el-icon {
    color: $primary-color;
    font-size: 16px;
  }
}

.hero-actions {
  .el-button {
    min-width: 140px;
    height: 44px;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all $transition-base;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
    }
  }
}

.chapters-section {
  background: white;
  border-radius: $radius-lg;
  padding: 32px;
  box-shadow: $shadow-card;
  border: 1px solid $border-color;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  
  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: -0.01em;
  }
  
  .chapter-count {
    font-size: 0.85rem;
    color: $text-muted;
    font-weight: 500;
  }
}

.chapter-collapse {
  :deep(.el-collapse-item__header) {
    background: $surface-color;
    border-radius: $radius-sm;
    padding: 0 16px;
    margin-bottom: 8px;
    border: none;
    height: 52px;
    font-weight: 500;
    transition: all $transition-fast;
    
    &:hover {
      background: $primary-light;
    }
    
    &.is-active {
      background: $primary-light;
      color: $primary-color;
    }
  }
  
  :deep(.el-collapse-item__wrap) {
    border: none;
    background: transparent;
  }
  
  :deep(.el-collapse-item__content) {
    padding: 8px 0 0;
  }
}

.chapter-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
  .chapter-name {
    font-weight: 600;
    font-size: 0.95rem;
  }
  
  .lesson-count {
    font-size: 0.8rem;
    color: $text-muted;
    font-weight: 500;
  }
}

.lessons-list {
  padding: 4px 0;
}

.lesson-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all $transition-fast;
  margin-bottom: 4px;
  
  &:hover {
    background: $primary-light;
    
    .lesson-play-icon {
      color: $primary-color;
      background: rgba(15, 118, 110, 0.1);
    }
  }
  
  .lesson-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .lesson-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .lesson-play-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: $surface-color;
    color: $text-muted;
    font-size: 14px;
    transition: all $transition-fast;
  }
  
  .lesson-title {
    font-size: 0.9rem;
    color: $text-primary;
    font-weight: 500;
  }
  
  .lesson-duration {
    color: $text-muted;
    font-size: 0.85rem;
  }
}
</style>
