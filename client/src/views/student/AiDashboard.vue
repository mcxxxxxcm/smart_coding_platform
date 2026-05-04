<template>
  <div class="ai-dashboard-page">
    <div class="page-header">
      <h2>AI 学习中心</h2>
      <el-button type="primary" @click="loadDashboard" :loading="loading">刷新数据</el-button>
    </div>

    <div v-if="loading && !dashboard" class="loading-wrapper">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else-if="dashboard">
      <el-row :gutter="16" class="overview-row">
        <el-col :span="4" v-for="item in overviewCards" :key="item.label">
          <div class="overview-card" :style="{ borderColor: item.color }">
            <div class="card-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="card-label">{{ item.label }}</div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header><span class="section-title">🧠 AI 学习路径推荐</span></template>
            <div v-if="pathLoading" class="ai-loading"><el-skeleton :rows="4" animated /></div>
            <template v-else-if="learningPath">
              <div class="weakness-section" v-if="learningPath.weakness_analysis">
                <h4>薄弱知识点分析</h4>
                <p class="ai-text">{{ learningPath.weakness_analysis }}</p>
              </div>
              <div class="path-section" v-if="learningPath.recommended_path?.length">
                <h4>推荐学习路径</h4>
                <el-timeline>
                  <el-timeline-item v-for="(step, i) in learningPath.recommended_path" :key="i" :timestamp="`步骤 ${i + 1}`" placement="top">
                    {{ typeof step === 'string' ? step : step.name || step.title || JSON.stringify(step) }}
                  </el-timeline-item>
                </el-timeline>
              </div>
              <div class="plan-section" v-if="learningPath.weekly_plan">
                <h4>本周学习计划</h4>
                <p class="ai-text">{{ learningPath.weekly_plan }}</p>
              </div>
              <el-button type="primary" text @click="loadLearningPath" :loading="pathLoading">重新生成</el-button>
            </template>
            <div v-else class="ai-placeholder">
              <p>AI 将根据你的学习数据生成个性化学习路径</p>
              <el-button type="primary" @click="loadLearningPath" :loading="pathLoading">生成学习路径</el-button>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header><span class="section-title">📝 AI 错题智能分析</span></template>
            <div v-if="wrongLoading" class="ai-loading"><el-skeleton :rows="4" animated /></div>
            <template v-else-if="wrongAnalysis">
              <div class="analysis-section" v-if="wrongAnalysis.analysis">
                <h4>总体分析</h4>
                <p class="ai-text">{{ wrongAnalysis.analysis }}</p>
              </div>
              <div class="patterns-section" v-if="wrongAnalysis.error_patterns?.length">
                <h4>错误模式识别</h4>
                <div v-for="(pattern, i) in wrongAnalysis.error_patterns" :key="i" class="pattern-item">
                  <div class="pattern-header">
                    <el-tag type="danger" size="small">{{ pattern.pattern }}</el-tag>
                    <span class="pattern-count">出现 {{ pattern.count }} 次</span>
                  </div>
                  <p class="pattern-desc">{{ pattern.description }}</p>
                </div>
              </div>
              <div class="suggestions-section" v-if="wrongAnalysis.suggestions?.length">
                <h4>改进建议</h4>
                <div v-for="(s, i) in wrongAnalysis.suggestions" :key="i" class="suggestion-item">
                  <el-tag type="warning" size="small">{{ s.target }}</el-tag>
                  <span>{{ s.action }}</span>
                </div>
              </div>
              <el-button type="primary" text @click="loadWrongAnalysis" :loading="wrongLoading">重新分析</el-button>
            </template>
            <div v-else class="ai-placeholder">
              <p>AI 将分析你的错题数据，识别错误模式</p>
              <el-button type="primary" @click="loadWrongAnalysis" :loading="wrongLoading">开始分析</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="8">
          <el-card shadow="never" class="section-card">
            <template #header><span class="section-title">📊 难度分布</span></template>
            <div v-for="d in dashboard.difficultyStats" :key="d.difficulty" class="stat-bar-item">
              <div class="bar-label">{{ getDifficultyLabel(d.difficulty) }}</div>
              <el-progress :percentage="d.rate" :stroke-width="12" :color="getDifficultyColor(d.difficulty)" />
              <span class="bar-detail">{{ d.solved }}/{{ d.attempted }}</span>
            </div>
            <el-empty v-if="!dashboard.difficultyStats?.length" description="暂无数据" :image-size="60" />
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never" class="section-card">
            <template #header><span class="section-title">📂 分类掌握度</span></template>
            <div v-for="c in dashboard.categoryStats" :key="c.category" class="stat-bar-item">
              <div class="bar-label">{{ c.category }}</div>
              <el-progress :percentage="c.rate" :stroke-width="12" :color="getCategoryColor(c.rate)" />
              <span class="bar-detail">{{ c.solved }}/{{ c.attempted }}</span>
            </div>
            <el-empty v-if="!dashboard.categoryStats?.length" description="暂无数据" :image-size="60" />
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never" class="section-card">
            <template #header><span class="section-title">🎯 AI 学习报告</span></template>
            <div v-if="dashboard.aiReport">
              <div class="radar-section" v-if="dashboard.aiReport.knowledge_radar">
                <h4>知识掌握雷达</h4>
                <div class="radar-grid">
                  <div v-for="(val, key) in dashboard.aiReport.knowledge_radar" :key="key" class="radar-item">
                    <span class="radar-label">{{ key }}</span>
                    <el-progress type="circle" :percentage="val" :width="48" :stroke-width="4" :color="getRadarColor(val)" />
                  </div>
                </div>
              </div>
              <div class="report-section" v-if="dashboard.aiReport.strengths?.length">
                <h4>优势</h4>
                <el-tag v-for="s in dashboard.aiReport.strengths" :key="s" type="success" size="small" style="margin: 2px">{{ s }}</el-tag>
              </div>
              <div class="report-section" v-if="dashboard.aiReport.weaknesses?.length">
                <h4>待提升</h4>
                <el-tag v-for="w in dashboard.aiReport.weaknesses" :key="w" type="warning" size="small" style="margin: 2px">{{ w }}</el-tag>
              </div>
              <div class="report-section" v-if="dashboard.aiReport.suggestions?.length">
                <h4>AI 建议</h4>
                <ul class="suggestion-list">
                  <li v-for="s in dashboard.aiReport.suggestions" :key="s">{{ s }}</li>
                </ul>
              </div>
            </div>
            <el-empty v-else description="完成更多练习后生成报告" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="24">
          <el-card shadow="never" class="section-card">
            <template #header><span class="section-title">📅 近30天活跃度</span></template>
            <div class="activity-chart">
              <div v-for="d in dashboard.dailyActivity" :key="d.date" class="activity-day" :title="`${d.date}: 提交${d.total}次，通过${d.accepted}次`">
                <div class="activity-bar" :style="{ height: getBarHeight(d.total) + 'px', background: getBarColor(d.accepted, d.total) }"></div>
              </div>
            </div>
            <el-empty v-if="!dashboard.dailyActivity?.length" description="暂无活跃数据" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { aiApi } from '@/api/ai'

const loading = ref(false)
const pathLoading = ref(false)
const wrongLoading = ref(false)
const dashboard = ref<any>(null)
const learningPath = ref<any>(null)
const wrongAnalysis = ref<any>(null)

const overviewCards = computed(() => {
  if (!dashboard.value?.overview) return []
  const o = dashboard.value.overview
  return [
    { label: '已解题目', value: o.acceptedProblems || 0, color: '#67c23a' },
    { label: '总提交数', value: o.totalSubmissions || 0, color: '#409eff' },
    { label: '连续打卡', value: `${o.streak || 0}天`, color: '#e6a23c' },
    { label: '报名课程', value: o.enrolledCourses || 0, color: '#909399' },
    { label: '完成课程', value: o.completedCourses || 0, color: '#67c23a' },
    { label: '课程进度', value: `${o.avgCourseProgress || 0}%`, color: '#409eff' }
  ]
})

const getDifficultyLabel = (d: string) => {
  const m: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
  return m[d] || d
}

const getDifficultyColor = (d: string) => {
  const m: Record<string, string> = { easy: '#67c23a', medium: '#e6a23c', hard: '#f56c6c' }
  return m[d] || '#909399'
}

const getCategoryColor = (rate: number) => {
  if (rate >= 70) return '#67c23a'
  if (rate >= 40) return '#e6a23c'
  return '#f56c6c'
}

const getRadarColor = (val: number) => {
  if (val >= 70) return '#67c23a'
  if (val >= 40) return '#e6a23c'
  return '#f56c6c'
}

const maxActivity = computed(() => {
  if (!dashboard.value?.dailyActivity?.length) return 1
  return Math.max(...dashboard.value.dailyActivity.map((d: any) => d.total), 1)
})

const getBarHeight = (total: number) => {
  return Math.max(4, Math.round((total / maxActivity.value) * 80))
}

const getBarColor = (accepted: number, total: number) => {
  if (total === 0) return '#dcdfe6'
  const rate = accepted / total
  if (rate >= 0.7) return 'linear-gradient(to top, #67c23a, #85ce61)'
  if (rate >= 0.4) return 'linear-gradient(to top, #e6a23c, #f0c78a)'
  return 'linear-gradient(to top, #f56c6c, #fab6b6)'
}

const loadDashboard = async () => {
  loading.value = true
  try {
    const res = await aiApi.getStudentDashboard()
    dashboard.value = res.data
  } catch {
    ElMessage.error('加载学习数据失败')
  } finally {
    loading.value = false
  }
}

const loadLearningPath = async () => {
  pathLoading.value = true
  try {
    const res = await aiApi.getLearningPath()
    learningPath.value = res.data
  } catch {
    ElMessage.error('生成学习路径失败')
  } finally {
    pathLoading.value = false
  }
}

const loadWrongAnalysis = async () => {
  wrongLoading.value = true
  try {
    const res = await aiApi.analyzeWrongAnswers()
    wrongAnalysis.value = res.data
  } catch {
    ElMessage.error('分析错题失败')
  } finally {
    wrongLoading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.ai-dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 { margin: 0; font-size: 22px; font-weight: 600; }
  }

  .loading-wrapper { padding: 40px 0; }

  .overview-row {
    .overview-card {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      border-left: 3px solid;
      text-align: center;

      .card-value { font-size: 24px; font-weight: 700; }
      .card-label { font-size: 13px; color: $text-secondary; margin-top: 4px; }
    }
  }

  .section-card {
    height: 100%;

    .section-title { font-weight: 600; font-size: 15px; }

    h4 {
      font-size: 14px;
      font-weight: 600;
      margin: 12px 0 8px;
      color: $text-primary;
    }
  }

  .ai-loading { padding: 10px 0; }

  .ai-placeholder {
    text-align: center;
    padding: 20px 0;
    p { font-size: 14px; color: $text-secondary; margin-bottom: 12px; }
  }

  .ai-text {
    font-size: 14px;
    line-height: 1.8;
    color: $text-secondary;
    white-space: pre-wrap;
  }

  .pattern-item {
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;

    .pattern-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .pattern-count { font-size: 12px; color: $text-secondary; }
    .pattern-desc { font-size: 13px; color: $text-secondary; margin: 4px 0 0; }
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 13px;
  }

  .stat-bar-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .bar-label { width: 50px; font-size: 13px; text-align: right; flex-shrink: 0; }
    .el-progress { flex: 1; }
    .bar-detail { width: 50px; font-size: 12px; color: $text-secondary; flex-shrink: 0; }
  }

  .radar-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;

    .radar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .radar-label { font-size: 12px; color: $text-secondary; }
    }
  }

  .report-section { margin-bottom: 12px; }

  .suggestion-list {
    margin: 0;
    padding-left: 18px;
    li { font-size: 13px; color: $text-secondary; line-height: 2; }
  }

  .activity-chart {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 100px;
    padding: 0 4px;

    .activity-day {
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      height: 100%;

      .activity-bar {
        width: 100%;
        max-width: 16px;
        border-radius: 2px 2px 0 0;
        min-height: 4px;
        transition: height 0.3s;
      }
    }
  }
}
</style>
