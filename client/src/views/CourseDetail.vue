<template>
  <div class="course-detail-page page-container">
    <div class="container" v-loading="loading">
      <div class="course-header" v-if="course">
        <div class="course-cover" :class="course.category">
          <el-icon :size="80">
            <component :is="getCategoryIcon(course.category)" />
          </el-icon>
        </div>
        <div class="course-info">
          <h1>{{ course.title }}</h1>
          <p class="description">{{ course.description }}</p>
          <div class="meta">
            <span><el-icon><User /></el-icon> {{ course.teacher_name }}</span>
            <span><el-icon><Clock /></el-icon> {{ course.duration }}课时</span>
            <span><el-icon><Star /></el-icon> {{ course.rating }}</span>
            <span><el-icon><User /></el-icon> {{ course.enrollment_count }}人学习</span>
          </div>
          <div class="actions">
            <el-button v-if="!course.isEnrolled" type="primary" size="large" @click="enroll">
              立即报名
            </el-button>
            <el-button v-else type="success" size="large" @click="startLearning">
              开始学习
            </el-button>
          </div>
        </div>
      </div>
      
      <div class="course-content" v-if="course">
        <div class="chapters-section">
          <h2>课程目录</h2>
          <el-collapse v-model="activeChapters">
            <el-collapse-item
              v-for="chapter in course.chapters"
              :key="chapter.id"
              :name="chapter.id"
            >
              <template #title>
                <span class="chapter-title">{{ chapter.title }}</span>
              </template>
              <div class="lessons-list">
                <div
                  v-for="lesson in chapter.lessons"
                  :key="lesson.id"
                  class="lesson-item"
                  @click="playLesson(lesson)"
                >
                  <el-icon><VideoPlay /></el-icon>
                  <span class="lesson-title">{{ lesson.title }}</span>
                  <span class="lesson-duration">{{ lesson.duration }}分钟</span>
                  <el-tag v-if="lesson.is_free" size="small" type="success">免费</el-tag>
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

const fetchCourse = async () => {
  loading.value = true
  try {
    const res = await courseApi.getCourseById(Number(route.params.id))
    course.value = res.data
    console.log('课程详情:', course.value)
    // 持久化报名状态到用户存储
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
    
    // 立即更新本地状态
    if (course.value) {
      course.value.isEnrolled = true
    }
    
    // 更新用户存储中的报名状态
    userStore.updateEnrolledCourses(Number(route.params.id))
    
    // 刷新课程数据
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
  
  // 如果已报名，跳转到学习页面并传递课时ID
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
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.course-header {
  display: flex;
  gap: 40px;
  background: white;
  padding: 40px;
  border-radius: $radius-lg;
  margin-bottom: 30px;
  box-shadow: $shadow-md;
}

.course-cover {
  width: 300px;
  height: 200px;
  border-radius: $radius-md;
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
  flex: 1;
  
  h1 {
    font-size: 2rem;
    margin-bottom: 15px;
  }
  
  .description {
    color: $text-secondary;
    margin-bottom: 20px;
    line-height: 1.8;
  }
}

.meta {
  display: flex;
  gap: 25px;
  color: $text-secondary;
  margin-bottom: 25px;
  
  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.chapters-section {
  background: white;
  border-radius: $radius-lg;
  padding: 30px;
  box-shadow: $shadow-md;
  
  h2 {
    margin-bottom: 20px;
    font-size: 1.3rem;
  }
}

.chapter-title {
  font-weight: 500;
  font-size: 1.1rem;
}

.lessons-list {
  padding: 10px 0;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: $primary-light;
  }
  
  .lesson-title {
    flex: 1;
  }
  
  .lesson-duration {
    color: $text-secondary;
    font-size: 0.9rem;
  }
}
</style>
