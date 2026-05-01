<template>
  <div class="teacher-dashboard">
    <!-- 统计卡片 -->
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

    <!-- 快捷操作 -->
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
              <el-avatar :size="36">{{ activity.user.charAt(0) }}</el-avatar>
              <div class="activity-info">
                <p><strong>{{ activity.user }}</strong> {{ activity.action }}</p>
                <span class="time">{{ activity.time }}</span>
              </div>
            </div>
            
            <el-empty v-if="recentActivities.length === 0" description="暂无活动" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 课程概览 -->
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
            <el-button size="small" text type="primary">编辑</el-button>
            <el-button size="small" text type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Document, EditPen, DataAnalysis } from '@element-plus/icons-vue'

const stats = ref([
  { title: '总课程数', value: '12', icon: 'Reading', color: '#0f766e' },
  { title: '总学生数', value: '356', icon: 'User', color: '#059669' },
  { title: '题目数量', value: '48', icon: 'Document', color: '#dc2626' },
  { title: '平均评分', value: '4.7', icon: 'Star', color: '#d97706' }
])

const recentActivities = ref([
  { user: '张三', action: '完成了 "JavaScript 基础"', time: '2分钟前' },
  { user: '李四', action: '提交了 "Two Sum" 的代码', time: '5分钟前' },
  { user: '王五', action: '注册了你的课程', time: '10分钟前' }
])

const courses = ref([
  { id: 1, title: 'JavaScript 基础教程', students: 128, status: 'published' },
  { id: 2, title: 'Python 数据分析', students: 89, status: 'published' },
  { id: 3, title: '算法与数据结构', students: 56, status: 'draft' }
])
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
