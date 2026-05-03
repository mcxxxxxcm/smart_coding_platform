<template>
  <div class="analytics-page">
    <div class="page-header">
      <h2>AI 学情分析</h2>
      <el-button type="primary" @click="generateAiInsight" :loading="loadingInsight">
        <el-icon><MagicStick /></el-icon>
        生成AI分析报告
      </el-button>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon students">
            <el-icon :size="32"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalStudents }}</div>
            <div class="stat-label">学生总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon submissions">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalSubmissions }}</div>
            <div class="stat-label">提交总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon pass-rate">
            <el-icon :size="32"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.passRate }}%</div>
            <div class="stat-label">通过率</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon courses">
            <el-icon :size="32"><Reading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeCourses }}</div>
            <div class="stat-label">活跃课程</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>评论最多的课时</span>
              <el-tag type="warning" size="small">需重点关注</el-tag>
            </div>
          </template>
          <div class="lesson-rank-list" v-loading="loadingAnalytics">
            <div v-for="(item, index) in analytics.topCommentedLessons" :key="item.lesson_id" class="rank-item">
              <span class="rank-number" :class="{ top: index < 3 }">{{ index + 1 }}</span>
              <div class="rank-info">
                <div class="rank-title">{{ item.lesson_title }}</div>
                <div class="rank-subtitle">{{ item.course_title }} · {{ item.chapter_title }}</div>
              </div>
              <div class="rank-value">
                <span class="count">{{ item.comment_count }}</span>
                <span class="unit">条评论</span>
              </div>
            </div>
            <el-empty v-if="!loadingAnalytics && (!analytics.topCommentedLessons || analytics.topCommentedLessons.length === 0)" description="暂无数据" :image-size="60" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>通过率最低的编程题</span>
              <el-tag type="danger" size="small">需加强辅导</el-tag>
            </div>
          </template>
          <div class="problem-rank-list" v-loading="loadingAnalytics">
            <div v-for="(item, index) in analytics.lowPassRateProblems" :key="item.id" class="rank-item">
              <span class="rank-number" :class="{ top: index < 3 }">{{ index + 1 }}</span>
              <div class="rank-info">
                <div class="rank-title">{{ item.title }}</div>
                <div class="rank-subtitle">
                  {{ item.total_submissions }}次提交 · 
                  <el-tag :type="item.difficulty === 'easy' ? 'success' : item.difficulty === 'medium' ? 'warning' : 'danger'" size="small">
                    {{ item.difficulty === 'easy' ? '简单' : item.difficulty === 'medium' ? '中等' : '困难' }}
                  </el-tag>
                </div>
              </div>
              <div class="rank-value">
                <span class="count" :class="{ danger: item.pass_rate < 30, warning: item.pass_rate >= 30 && item.pass_rate < 60 }">{{ item.pass_rate }}%</span>
                <span class="unit">通过率</span>
              </div>
            </div>
            <el-empty v-if="!loadingAnalytics && (!analytics.lowPassRateProblems || analytics.lowPassRateProblems.length === 0)" description="暂无数据" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>课程学习情况</span>
          </template>
          <el-table :data="analytics.studentActivity" stripe size="small" v-loading="loadingAnalytics">
            <el-table-column prop="course_title" label="课程名称" min-width="150" />
            <el-table-column prop="enrolled_students" label="报名人数" width="100" align="center" />
            <el-table-column prop="active_learners" label="活跃学习者" width="100" align="center" />
            <el-table-column label="平均进度" width="120" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.avg_progress || 0" :stroke-width="8" :color="row.avg_progress >= 60 ? '#0f766e' : '#e6a23c'" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>最新评论动态</span>
          </template>
          <div class="recent-comments" v-loading="loadingAnalytics">
            <div v-for="comment in analytics.recentComments" :key="comment.id" class="recent-comment-item">
              <div class="comment-left">
                <el-tag v-if="comment.is_ai_reply" type="success" size="small">AI</el-tag>
                <span class="comment-author">{{ comment.author_name }}</span>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
              <div class="comment-meta">
                <span>{{ comment.lesson_title }}</span>
                <span>{{ formatTime(comment.created_at) }}</span>
              </div>
            </div>
            <el-empty v-if="!loadingAnalytics && (!analytics.recentComments || analytics.recentComments.length === 0)" description="暂无评论" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="ai-insight-card" v-if="aiInsight">
      <template #header>
        <div class="card-header">
          <span><el-icon><MagicStick /></el-icon> AI 智能分析报告</span>
        </div>
      </template>
      <div class="ai-insight-content" v-html="formatInsight(aiInsight)"></div>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <template #header>
        <span>学生提交排行</span>
      </template>
      <el-table :data="topStudents" stripe>
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="username" label="学生姓名" min-width="150" />
        <el-table-column prop="submission_count" label="提交次数" width="120" align="center" />
        <el-table-column prop="accepted_count" label="通过次数" width="120" align="center" />
        <el-table-column prop="acceptance_rate" label="通过率" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.acceptance_rate >= 70 ? 'success' : row.acceptance_rate >= 40 ? 'warning' : 'danger'" size="small">
              {{ row.acceptance_rate }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="等级" width="100" align="center" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { User, Document, CircleCheck, Reading, MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import { lessonCommentApi, type TeacherAnalytics } from '@/api/lesson-comment'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const stats = reactive({
  totalStudents: 0,
  totalSubmissions: 0,
  passRate: 0,
  activeCourses: 0
})

const topStudents = ref<any[]>([])
const loadingAnalytics = ref(false)
const loadingInsight = ref(false)
const aiInsight = ref('')

const analytics = reactive<TeacherAnalytics>({
  topCommentedLessons: [],
  lowPassRateProblems: [],
  studentActivity: [],
  recentComments: []
})

const formatTime = (time: string | undefined | null) => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

const formatInsight = (text: string) => {
  return text
    .replace(/\n/g, '<br>')
    .replace(/#{1,3}\s(.+)/g, '<strong>$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/- (.+)/g, '&bull; $1')
}

const fetchStats = async () => {
  try {
    const res = await request.get('/users/stats/teacher')
    if (res.success && res.data) {
      Object.assign(stats, res.data)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const fetchAnalytics = async () => {
  loadingAnalytics.value = true
  try {
    const res = await lessonCommentApi.getTeacherAnalytics()
    if (res.success && res.data) {
      Object.assign(analytics, res.data)
    }
  } catch (error) {
    console.error('获取分析数据失败:', error)
  } finally {
    loadingAnalytics.value = false
  }
}

const generateAiInsight = async () => {
  loadingInsight.value = true
  aiInsight.value = ''
  try {
    const res = await lessonCommentApi.getAiInsight()
    if (res.success && res.data) {
      aiInsight.value = res.data.insight
      if (res.data.analytics) {
        Object.assign(analytics, res.data.analytics)
      }
    }
  } catch (error) {
    console.error('生成AI分析失败:', error)
    ElMessage.error('生成AI分析报告失败，请稍后重试')
  } finally {
    loadingInsight.value = false
  }
}

const fetchTopStudents = async () => {
  try {
    const res = await request.get('/users/top-students', { params: { limit: 10 } })
    if (res.success && res.data && Array.isArray(res.data)) {
      topStudents.value = res.data
    }
  } catch (error) {
    console.error('获取学生排行失败:', error)
    topStudents.value = []
  }
}

onMounted(() => {
  fetchStats()
  fetchAnalytics()
  fetchTopStudents()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.analytics-page {
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
  
  .stats-row {
    margin-bottom: 20px;
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    padding: 10px;
    
    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: white;
      
      &.students { background: #0f766e; }
      &.submissions { background: #dc2626; }
      &.pass-rate { background: #0891b2; }
      &.courses { background: #059669; }
    }
    
    .stat-info {
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: $text-primary;
      }
      
      .stat-label {
        font-size: 14px;
        color: $text-secondary;
      }
    }
  }
  
  .chart-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .rank-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid $border-light;
    
    &:last-child {
      border-bottom: none;
    }
    
    .rank-number {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      background: $surface-color;
      color: $text-secondary;
      flex-shrink: 0;
      
      &.top {
        background: $primary-color;
        color: white;
      }
    }
    
    .rank-info {
      flex: 1;
      min-width: 0;
      
      .rank-title {
        font-size: 14px;
        font-weight: 500;
        color: $text-primary;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .rank-subtitle {
        font-size: 12px;
        color: $text-muted;
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .rank-value {
      text-align: right;
      flex-shrink: 0;
      
      .count {
        font-size: 18px;
        font-weight: 700;
        color: $text-primary;
        
        &.danger { color: #dc2626; }
        &.warning { color: #d97706; }
      }
      
      .unit {
        font-size: 12px;
        color: $text-muted;
        margin-left: 2px;
      }
    }
  }

  .recent-comments {
    max-height: 300px;
    overflow-y: auto;
  }

  .recent-comment-item {
    padding: 8px 0;
    border-bottom: 1px solid $border-light;
    
    &:last-child {
      border-bottom: none;
    }
    
    .comment-left {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      
      .comment-author {
        font-size: 13px;
        font-weight: 500;
        color: $text-primary;
      }
    }
    
    .comment-content {
      font-size: 13px;
      color: $text-primary;
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .comment-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: $text-muted;
      margin-top: 4px;
    }
  }

  .ai-insight-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: $primary-color;
    }
    
    .ai-insight-content {
      line-height: 1.8;
      color: $text-primary;
      font-size: 14px;
      
      :deep(strong) {
        color: $primary-color;
      }
    }
  }
  
  .table-card {
    margin-bottom: 20px;
  }
}
</style>
