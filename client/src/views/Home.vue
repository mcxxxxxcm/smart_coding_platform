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
    const res = await courseApi.getCourses({ limit: 6 })
    courses.value = res.data || []
  } catch {
    console.error('获取课程失败')
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.home-page {
  background: $bg-color;
}

.hero {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  padding: 60px 40px;
  max-width: 1400px;
  margin: 0 auto;
  gap: 60px;
}

.hero-content {
  flex: 1;
  
  h1 {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 20px;
    background: linear-gradient(135deg, $primary-color, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    font-size: 1.25rem;
    color: $text-secondary;
    margin-bottom: 30px;
    max-width: 500px;
  }
}

.hero-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 50px;
}

.hero-stats {
  display: flex;
  gap: 50px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  color: $primary-color;
}

.stat-label {
  color: $text-secondary;
  font-size: 0.95rem;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
}

.code-window {
  background: #1e1e1e;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-lg;
  width: 100%;
  max-width: 500px;
}

.code-header {
  background: #323232;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  
  &.red { background: #ff5f56; }
  &.yellow { background: #ffbd2e; }
  &.green { background: #27ca40; }
}

.file-name {
  margin-left: 12px;
  color: #888;
  font-size: 0.9rem;
}

.code-content {
  padding: 20px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.95rem;
  line-height: 1.8;
  color: #d4d4d4;
  overflow-x: auto;
  
  .keyword { color: #569cd6; }
  .function { color: #dcdcaa; }
  .string { color: #ce9178; }
  .param { color: #9cdcfe; }
  .built-in { color: #4ec9b0; }
  .comment { color: #6a9955; }
}

.courses-section {
  padding: 80px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
  
  h2 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 15px;
    color: $text-primary;
  }
  
  p {
    color: $text-secondary;
    font-size: 1.1rem;
  }
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 30px;
}

.course-card {
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-md;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: $shadow-lg;
  }
}

.course-image {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  &.frontend { background: linear-gradient(135deg, #f97316, #ea580c); }
  &.backend { background: linear-gradient(135deg, #68a063, #3c873a); }
  &.database { background: linear-gradient(135deg, #00758f, #f29111); }
  &.ai { background: linear-gradient(135deg, #ff6f61, #6b5b95); }
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
  
  &.beginner { background: #dcfce7; color: #166534; }
  &.intermediate { background: #fef3c7; color: #92400e; }
  &.advanced { background: #fee2e2; color: #991b1b; }
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
  margin-bottom: 15px;
  
  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.start-btn {
  width: 100%;
}

.features-section {
  padding: 80px 40px;
  background: white;
}

.features-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.feature-card {
  text-align: center;
  padding: 30px;
  border-radius: $radius-lg;
  transition: all 0.3s ease;
  
  &:hover {
    background: $bg-color;
    transform: translateY(-5px);
  }
}

.feature-icon {
  width: 70px;
  height: 70px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, $primary-color, #7c3aed);
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 10px;
  color: $text-primary;
}

.feature-card p {
  color: $text-secondary;
  line-height: 1.6;
}
</style>
