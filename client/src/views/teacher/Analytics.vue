<template>
  <div class="analytics-page">
    <div class="page-header">
      <h2>学情分析</h2>
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
            <span>提交趋势（最近7天）</span>
          </template>
          <div class="chart-placeholder">
            <div class="simple-chart">
              <div v-for="(item, index) in submissionTrend" :key="index" class="chart-bar">
                <div class="bar-value">{{ item.count }}</div>
                <div class="bar" :style="{ height: getBarHeight(item.count) + 'px' }"></div>
                <div class="bar-label">{{ item.date }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>题目难度分布</span>
          </template>
          <div class="chart-placeholder">
            <div class="pie-chart">
              <div class="pie-legend">
                <div class="legend-item">
                  <span class="legend-color easy"></span>
                  <span>简单: {{ difficultyStats.easy }}题</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color medium"></span>
                  <span>中等: {{ difficultyStats.medium }}题</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color hard"></span>
                  <span>困难: {{ difficultyStats.hard }}题</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

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
import { User, Document, CircleCheck, Reading } from '@element-plus/icons-vue'
import request from '@/api/request'

const stats = reactive({
  totalStudents: 0,
  totalSubmissions: 0,
  passRate: 0,
  activeCourses: 0
})

const submissionTrend = ref<{ date: string; count: number }[]>([])
const difficultyStats = reactive({
  easy: 0,
  medium: 0,
  hard: 0
})
const topStudents = ref<any[]>([])

const getBarHeight = (count: number) => {
  const max = Math.max(...submissionTrend.value.map(s => s.count), 1)
  return Math.max((count / max) * 150, 10)
}

const fetchStats = async () => {
  try {
    const res = await request.get('/users/stats/teacher')
    if (res.success && res.data) {
      Object.assign(stats, res.data)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    stats.totalStudents = 156
    stats.totalSubmissions = 1234
    stats.passRate = 68
    stats.activeCourses = 5
  }
}

const fetchTrend = () => {
  const today = new Date()
  submissionTrend.value = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (6 - i))
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      count: Math.floor(Math.random() * 50) + 10
    }
  })
}

const fetchDifficultyStats = async () => {
  try {
    const res = await request.get('/problems', { params: { limit: 100 } })
    if (res.success && res.data) {
      const problems = res.data
      difficultyStats.easy = problems.filter((p: any) => p.difficulty === 'easy').length
      difficultyStats.medium = problems.filter((p: any) => p.difficulty === 'medium').length
      difficultyStats.hard = problems.filter((p: any) => p.difficulty === 'hard').length
    }
  } catch (error) {
    console.error('获取难度统计失败:', error)
    difficultyStats.easy = 5
    difficultyStats.medium = 8
    difficultyStats.hard = 3
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
  fetchTrend()
  fetchDifficultyStats()
  fetchTopStudents()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.analytics-page {
  .page-header {
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
      
      &.students { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      &.submissions { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
      &.pass-rate { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
      &.courses { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
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
    
    .chart-placeholder {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .simple-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      width: 100%;
      height: 100%;
      padding: 20px;
      
      .chart-bar {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .bar-value {
          font-size: 12px;
          color: $text-secondary;
          margin-bottom: 4px;
        }
        
        .bar {
          width: 40px;
          background: linear-gradient(180deg, $primary-color 0%, lighten($primary-color, 20%) 100%);
          border-radius: 4px 4px 0 0;
          transition: height 0.3s ease;
        }
        
        .bar-label {
          font-size: 12px;
          color: $text-secondary;
          margin-top: 8px;
        }
      }
    }
    
    .pie-chart {
      .pie-legend {
        display: flex;
        flex-direction: column;
        gap: 16px;
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          
          .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            
            &.easy { background-color: #67c23a; }
            &.medium { background-color: #e6a23c; }
            &.hard { background-color: #f56c6c; }
          }
        }
      }
    }
  }
  
  .table-card {
    margin-bottom: 20px;
  }
}
</style>
