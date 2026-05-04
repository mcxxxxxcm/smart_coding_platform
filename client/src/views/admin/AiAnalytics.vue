<template>
  <div class="ai-analytics-page">
    <div class="page-header">
      <h2>AI 运营分析</h2>
      <el-button type="primary" @click="loadAnalytics" :loading="loading">生成分析报告</el-button>
    </div>

    <div v-if="loading" class="loading-wrapper"><el-skeleton :rows="8" animated /></div>

    <template v-else-if="analytics">
      <el-card shadow="never" class="section-card" style="margin-bottom: 16px">
        <template #header><span class="section-title">📋 总体概述</span></template>
        <p class="ai-text">{{ analytics.overview }}</p>
      </el-card>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header><span class="section-title">📈 趋势分析</span></template>
            <div v-for="(t, i) in analytics.trends" :key="i" class="trend-item">
              <el-tag :type="t.direction === 'up' ? 'success' : t.direction === 'down' ? 'danger' : 'info'" size="small">
                {{ t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : '→' }} {{ t.name }}
              </el-tag>
              <span class="trend-desc">{{ t.description }}</span>
            </div>
            <el-empty v-if="!analytics.trends?.length" description="暂无趋势数据" :image-size="60" />
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header><span class="section-title">💡 洞察</span></template>
            <ul class="insight-list">
              <li v-for="(insight, i) in analytics.insights" :key="i">{{ insight }}</li>
            </ul>
            <el-empty v-if="!analytics.insights?.length" description="暂无洞察" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header><span class="section-title">🎯 改进建议</span></template>
            <div v-for="(r, i) in analytics.recommendations" :key="i" class="recommendation-item">
              <div class="rec-header">
                <el-tag :type="r.priority === 'high' ? 'danger' : r.priority === 'medium' ? 'warning' : 'info'" size="small">
                  {{ r.priority === 'high' ? '高' : r.priority === 'medium' ? '中' : '低' }}优先级
                </el-tag>
                <span class="rec-area">{{ r.area }}</span>
              </div>
              <p class="rec-action">{{ r.action }}</p>
            </div>
            <el-empty v-if="!analytics.recommendations?.length" description="暂无建议" :image-size="60" />
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header><span class="section-title">⚠️ 风险预警</span></template>
            <div v-for="(r, i) in analytics.risk_alerts" :key="i" class="risk-item">
              <div class="risk-header">
                <el-tag :type="r.severity === 'high' ? 'danger' : r.severity === 'medium' ? 'warning' : 'info'" size="small">
                  {{ r.type }}
                </el-tag>
              </div>
              <p class="risk-desc">{{ r.description }}</p>
            </div>
            <el-empty v-if="!analytics.risk_alerts?.length" description="暂无风险" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="section-card" style="margin-top: 16px" v-if="analytics.weekly_summary">
        <template #header><span class="section-title">📝 周报摘要</span></template>
        <p class="ai-text">{{ analytics.weekly_summary }}</p>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { aiApi } from '@/api/ai'

const loading = ref(false)
const analytics = ref<any>(null)

const loadAnalytics = async () => {
  loading.value = true
  try {
    const res = await aiApi.getOperationsAnalytics()
    analytics.value = res.data
  } catch {
    ElMessage.error('加载运营分析失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadAnalytics)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.ai-analytics-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    h2 { margin: 0; font-size: 22px; font-weight: 600; }
  }

  .loading-wrapper { padding: 40px 0; }

  .section-card {
    .section-title { font-weight: 600; font-size: 15px; }
  }

  .ai-text { font-size: 14px; line-height: 1.8; color: $text-secondary; white-space: pre-wrap; }

  .trend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    .trend-desc { font-size: 13px; color: $text-secondary; }
  }

  .insight-list {
    margin: 0;
    padding-left: 18px;
    li { font-size: 14px; color: $text-secondary; line-height: 2; }
  }

  .recommendation-item {
    padding: 8px 0;
    border-bottom: 1px solid #f5f5f5;
    .rec-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .rec-area { font-weight: 500; font-size: 14px; }
    .rec-action { font-size: 13px; color: $text-secondary; margin: 4px 0 0; }
  }

  .risk-item {
    padding: 8px 0;
    border-bottom: 1px solid #f5f5f5;
    .risk-header { margin-bottom: 4px; }
    .risk-desc { font-size: 13px; color: $text-secondary; }
  }
}
</style>
