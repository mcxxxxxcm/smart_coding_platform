<template>
  <div class="exam-analytics-page">
    <div class="page-header">
      <h2>{{ exam?.title }} - 学情分析</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ analytics?.totalStudents || 0 }}</div>
          <div class="stat-label">参考人数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ analytics?.averageScore || 0 }}</div>
          <div class="stat-label">平均分</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ analytics?.distribution?.excellent || 0 }}</div>
          <div class="stat-label">优秀 (≥90)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ analytics?.distribution?.fail || 0 }}</div>
          <div class="stat-label">不及格 (<60)</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>分数段分布</span>
          </template>
          <div class="bar-chart">
            <div class="bar-item" v-for="item in distributionData" :key="item.label">
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar-wrapper">
                <div 
                  class="bar" 
                  :style="{ width: item.percentage + '%', background: item.color }"
                ></div>
                <span class="bar-value">{{ item.value }}人 ({{ item.percentage }}%)</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>题目正确率</span>
          </template>
          <el-table :data="analytics?.questionStats || []" stripe size="small">
            <el-table-column prop="title" label="题目" min-width="150" show-overflow-tooltip />
            <el-table-column prop="avg_score" label="平均分" width="80" align="center" />
            <el-table-column prop="max_score" label="满分" width="80" align="center" />
            <el-table-column prop="submission_count" label="提交数" width="80" align="center" />
            <el-table-column label="正确率" width="100" align="center">
              <template #default="{ row }">
                <el-progress 
                  :percentage="Math.round((row.avg_score / row.max_score) * 100)" 
                  :stroke-width="10"
                  :color="getProgressColor(Math.round((row.avg_score / row.max_score) * 100))"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="table-card">
      <template #header>
        <span>学生成绩排名</span>
      </template>
      <el-table :data="analytics?.rankings || []" stripe>
        <el-table-column prop="rank" label="排名" width="80" align="center" />
        <el-table-column prop="username" label="学生姓名" min-width="150" />
        <el-table-column prop="total_score" label="总分" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.total_score >= 90 ? 'success' : row.total_score >= 80 ? 'warning' : 'danger'" size="small">
              {{ row.total_score }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submit_time" label="交卷时间" width="180">
          <template #default="{ row }">
            {{ row.submit_time ? formatDateTime(row.submit_time) : '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/api/request'

const route = useRoute()
const examId = ref<number>(parseInt(route.params.id as string))

const exam = ref<any>(null)
const analytics = ref<any>(null)

const distributionData = computed(() => {
  if (!analytics.value?.distribution) return []
  
  const dist = analytics.value.distribution
  const total = analytics.value.totalStudents || 1
  
  return [
    { label: '优秀 (≥90)', value: dist.excellent, percentage: Math.round((dist.excellent / total) * 100), color: '#67c23a' },
    { label: '良好 (80-89)', value: dist.good, percentage: Math.round((dist.good / total) * 100), color: '#409eff' },
    { label: '中等 (70-79)', value: dist.medium, percentage: Math.round((dist.medium / total) * 100), color: '#e6a23c' },
    { label: '及格 (60-69)', value: dist.pass, percentage: Math.round((dist.pass / total) * 100), color: '#f56c6c' },
    { label: '不及格 (<60)', value: dist.fail, percentage: Math.round((dist.fail / total) * 100), color: '#909399' }
  ]
})

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#e6a23c'
  return '#f56c6c'
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const loadAnalytics = async () => {
  try {
    const examRes = await request.get(`/exams/${examId.value}`)
    exam.value = examRes.data
    
    const analyticsRes = await request.get(`/exams/${examId.value}/analytics`)
    analytics.value = analyticsRes.data
  } catch (error) {
    console.error('加载学情分析失败:', error)
  }
}

onMounted(loadAnalytics)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.exam-analytics-page {
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
    
    .stat-card {
      text-align: center;
      padding: 20px;
      
      .stat-value {
        font-size: 36px;
        font-weight: 700;
        color: $primary-color;
        margin-bottom: 8px;
      }
      
      .stat-label {
        font-size: 14px;
        color: $text-secondary;
      }
    }
  }
  
  .chart-card {
    margin-bottom: 20px;
    
    .bar-chart {
      padding: 20px;
      
      .bar-item {
        margin-bottom: 16px;
        
        .bar-label {
          font-size: 14px;
          color: $text-primary;
          margin-bottom: 8px;
        }
        
        .bar-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          
          .bar {
            height: 20px;
            border-radius: 4px;
            transition: width 0.3s ease;
          }
          
          .bar-value {
            font-size: 13px;
            color: $text-secondary;
            min-width: 100px;
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
