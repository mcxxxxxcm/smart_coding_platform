<template>
  <div class="teacher-dashboard" v-loading="loading">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="24"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stat.value }}</h3>
              <p>{{ stat.title }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 24px;">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
              <router-link to="/teacher/courses" class="more-link">查看全部 →</router-link>
            </div>
          </template>
          
          <div class="quick-actions">
            <div class="action-item" @click="$router.push('/teacher/courses')">
              <el-icon :size="32" color="#0f766e"><Plus /></el-icon>
              <span>发布新课程</span>
            </div>
            <div class="action-item" @click="$router.push('/teacher/problems')">
              <el-icon :size="32" color="#059669"><Document /></el-icon>
              <span>添加编程题</span>
            </div>
            <div class="action-item" @click="$router.push('/teacher/exams')">
              <el-icon :size="32" color="#dc2626"><EditPen /></el-icon>
              <span>创建考试</span>
            </div>
            <div class="action-item" @click="$router.push('/teacher/analytics')">
              <el-icon :size="32" color="#d97706"><DataAnalysis /></el-icon>
              <span>查看学情</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>最近活动</span>
          </template>
          
          <div class="activity-list">
            <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
              <el-avatar :size="36">{{ activity.user?.charAt(0) || '?' }}</el-avatar>
              <div class="activity-info">
                <p><strong>{{ activity.user }}</strong> {{ activity.action }}</p>
                <span class="time">{{ formatTime(activity.time) }}</span>
              </div>
            </div>
            
            <el-empty v-if="recentActivities.length === 0" description="暂无活动" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" style="margin-top: 24px;">
      <template #header>
        <div class="card-header">
          <span>我的课程</span>
          <router-link to="/teacher/courses" class="more-link">管理课程 →</router-link>
        </div>
      </template>
      
      <el-table :data="courses" stripe style="width: 100%">
        <el-table-column prop="title" label="课程名称" />
        <el-table-column prop="students" label="学生数" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'warning'" size="small">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="$router.push(`/teacher/courses`)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="courses.length === 0" description="暂无课程" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Document, EditPen, DataAnalysis } from '@element-plus/icons-vue'
import request from '@/api/request'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const loading = ref(false)
const stats = ref([
  { title: '总课程数', value: '0', icon: 'Reading', color: '#0f766e' },
  { title: '总学生数', value: '0', icon: 'User', color: '#059669' },
  { title: '题目数量', value: '0', icon: 'Document', color: '#dc2626' },
  { title: '平均评分', value: '0', icon: 'Star', color: '#d97706' }
])

const recentActivities = ref<any[]>([])
const courses = ref<any[]>([])

const formatTime = (time: string | Date) => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

const fetchDashboard = async () => {
  loading.value = true
  try {
    const res = await request.get('/users/dashboard/teacher')
    if (res.success && res.data) {
      const data = res.data
      stats.value = [
        { title: '总课程数', value: String(data.totalCourses || 0), icon: 'Reading', color: '#0f766e' },
        { title: '总学生数', value: String(data.totalStudents || 0), icon: 'User', color: '#059669' },
        { title: '题目数量', value: String(data.totalProblems || 0), icon: 'Document', color: '#dc2626' },
        { title: '平均评分', value: String(data.avgRating || 0), icon: 'Star', color: '#d97706' }
      ]
      recentActivities.value = data.recentActivities || []
      courses.value = (data.courses || []).map((c: any) => ({
        ...c,
        students: c.students || 0
      }))
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.stats-row {
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .stat-info {
      h3 {
        font-size: 28px;
        font-weight: 700;
        margin: 0;
        color: $text-primary;
      }
      
      p {
        margin: 4px 0 0;
        color: $text-secondary;
        font-size: 14px;
      }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .more-link {
    font-size: 13px;
    color: $primary-color;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px;
  background: #f8fafc;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: $primary-light;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 118, 110, 0.15);
  }
  
  span {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }
}

.activity-list {
  .activity-item {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid $border-light;
    
    &:last-child {
      border-bottom: none;
    }
    
    .activity-info {
      flex: 1;
      
      p {
        margin: 0 0 4px;
        font-size: 14px;
        color: $text-primary;
        
        strong {
          font-weight: 600;
        }
      }
      
      .time {
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }
}
</style>
