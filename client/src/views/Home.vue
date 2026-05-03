<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-content">
        <h1>开启你的编程之旅</h1>
        <p>智能化的编程学习平台，从零基础到精通，让编程学习更简单、更高效</p>
        <div class="hero-buttons">
          <el-button type="primary" size="large" @click="$router.push('/courses')">
            开始学习
          </el-button>
          <el-button size="large" @click="scrollToCourses">
            了解更多
          </el-button>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">50+</span>
            <span class="stat-label">精品课程</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">10000+</span>
            <span class="stat-label">学员用户</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">5000+</span>
            <span class="stat-label">编程练习</span>
          </div>
        </div>
      </div>
      <div class="hero-image">
        <div class="code-window">
          <div class="code-header">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
            <span class="file-name">hello.js</span>
          </div>
          <pre class="code-content"><code><span class="keyword">function</span> <span class="function">greet</span>(<span class="param">name</span>) {
    <span class="keyword">return</span> <span class="string">`Hello, ${name}!`</span>;
}

<span class="keyword">const</span> message = <span class="function">greet</span>(<span class="string">'世界'</span>);
<span class="built-in">console</span>.<span class="function">log</span>(message);
<span class="comment">// 输出: Hello, 世界!</span></code></pre>
        </div>
      </div>
    </section>

    <section id="courses-section" class="courses-section">
      <div class="section-header">
        <h2>热门课程</h2>
        <p>精心设计的课程体系，从入门到进阶</p>
      </div>
      <div class="course-grid">
        <div v-for="course in courses" :key="course.id" class="course-card" @click="$router.push(`/courses/${course.id}`)">
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
            <el-button type="primary" class="start-btn">开始学习</el-button>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="section-header">
        <h2>平台特色</h2>
        <p>全方位的编程学习体验</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon :size="32"><Reading /></el-icon>
          </div>
          <h3>系统化课程</h3>
          <p>从基础到进阶，完整的课程体系助你循序渐进掌握编程技能</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon :size="32"><Edit /></el-icon>
          </div>
          <h3>在线编程</h3>
          <p>内置代码编辑器，边学边练，实时运行代码查看结果</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon :size="32"><Cpu /></el-icon>
          </div>
          <h3>AI 辅助</h3>
          <p>智能 AI 助手，提供代码解释、调试建议和优化方案</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon :size="32"><ChatDotRound /></el-icon>
          </div>
          <h3>学习社区</h3>
          <p>与志同道合的伙伴交流学习心得，共同进步</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { courseApi } from '@/api/course'
import type { Course } from '@/types'

const courses = ref<Course[]>([])

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

const scrollToCourses = () => {
  document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(async () => {
  try {
    console.log('开始获取课程数据...')
    const res = await courseApi.getCourses({ limit: 6 })
    console.log('API 响应:', res)
    console.log('res.data:', res.data)
    console.log('res.data 类型:', typeof res.data, Array.isArray(res.data))
    courses.value = res.data || []
    console.log('courses.value:', courses.value)
  } catch (error) {
    console.error('获取课程失败:', error)
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.home-page {
  background: $bg-color;
}

.hero {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  padding: 80px 40px;
  max-width: 1400px;
  margin: 0 auto;
  gap: 80px;
  position: relative;
}

.hero-content {
  flex: 1;
  animation: fadeInUp 0.6s ease-out;
  
  h1 {
    font-family: $font-display;
    font-size: 3.75rem;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 24px;
    color: $text-primary;
    letter-spacing: -0.03em;
  }
  
  p {
    font-size: 1.2rem;
    color: $text-secondary;
    margin-bottom: 36px;
    max-width: 480px;
    line-height: 1.7;
  }
}

.hero-buttons {
  display: flex;
  gap: 14px;
  margin-bottom: 56px;
  
  .el-button {
    height: 48px;
    padding: 0 32px;
    font-weight: 600;
    font-size: 1rem;
    border-radius: $radius-sm;
  }
  
  .el-button--default {
    border: 1px solid $border-color;
    color: $text-secondary;
    
    &:hover {
      border-color: $primary-color;
      color: $primary-color;
    }
  }
}

.hero-stats {
  display: flex;
  gap: 48px;
  padding-top: 32px;
  border-top: 1px solid $border-color;
}

.stat-item {
  text-align: left;
}

.stat-number {
  display: block;
  font-family: $font-display;
  font-size: 2rem;
  font-weight: 700;
  color: $primary-color;
  letter-spacing: -0.02em;
}

.stat-label {
  color: $text-muted;
  font-size: 0.85rem;
  margin-top: 2px;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  animation: fadeInUp 0.6s ease-out 0.15s both;
}

.code-window {
  background: $code-bg;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-xl, $shadow-glow;
  width: 100%;
  max-width: 500px;
  border: 1px solid #45475a;
}

.code-header {
  background: $code-header;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  
  &.red { background: #f38ba8; }
  &.yellow { background: #f9e2af; }
  &.green { background: #a6e3a1; }
}

.file-name {
  margin-left: 12px;
  color: #6c7086;
  font-size: 0.85rem;
  font-family: $font-mono;
}

.code-content {
  padding: 24px;
  font-family: $font-mono;
  font-size: 0.9rem;
  line-height: 1.9;
  color: $code-text;
  overflow-x: auto;
  
  .keyword { color: #cba6f7; }
  .function { color: #a6e3a1; }
  .string { color: #fab387; }
  .param { color: #89b4fa; }
  .built-in { color: #94e2d5; }
  .comment { color: #6c7086; }
}

.courses-section {
  padding: 100px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 56px;
  
  h2 {
    font-family: $font-display;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 14px;
    color: $text-primary;
    letter-spacing: -0.025em;
  }
  
  p {
    color: $text-secondary;
    font-size: 1.1rem;
  }
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.course-card {
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
  border: 1px solid $border-color;
  transition: all $transition-base;
  cursor: pointer;
  
  &:hover {
    border-color: $primary-border;
    box-shadow: $shadow-lg;
    transform: translateY(-4px);
  }
}

.course-image {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to top, rgba(0,0,0,0.06), transparent);
  }
  
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
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 12px;
  letter-spacing: 0.02em;
  
  &.beginner { background: $color-easy-bg; color: $color-easy-text; }
  &.intermediate { background: $color-medium-bg; color: $color-medium-text; }
  &.advanced { background: $color-hard-bg; color: $color-hard-text; }
}

.course-info h3 {
  font-family: $font-display;
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: $text-primary;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.course-info p {
  color: $text-secondary;
  font-size: 0.9rem;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
}

.course-meta {
  display: flex;
  gap: 20px;
  color: $text-muted;
  font-size: 0.85rem;
  margin-bottom: 18px;
  
  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.start-btn {
  width: 100%;
  border-radius: $radius-sm;
  font-weight: 600;
}

.features-section {
  padding: 100px 40px;
  background: white;
  border-top: 1px solid $border-color;
}

.features-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.feature-card {
  text-align: center;
  padding: 40px 28px;
  border-radius: $radius-lg;
  transition: all $transition-base;
  border: 1px solid transparent;
  
  &:hover {
    background: $primary-light;
    border-color: $primary-border;
    transform: translateY(-4px);
  }
}

.feature-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  background: $primary-light;
  border: 1px solid $primary-border;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary-color;
}

.feature-card h3 {
  font-family: $font-display;
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: $text-primary;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.feature-card p {
  color: $text-secondary;
  line-height: 1.7;
  font-size: 0.9rem;
}
</style>
