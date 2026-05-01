<template>
  <div class="admin-dashboard">
    <!-- 系统状态卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card shadow="hover" :class="`stat-card stat-${stat.type}`">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="28"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stat.value }}</h3>
              <p>{{ stat.title }}</p>
            </div>
          </div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
            <el-icon><component :is="stat.trend > 0 ? 'Top' : 'Bottom'" /></el-icon>
            {{ Math.abs(stat.trend) }}%
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统信息 -->
    <el-row :gutter="20" style="margin-top: 24px;">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <span>系统概览</span>
          </template>
          
          <div class="system-info">
            <div class="info-item">
              <label>系统版本</label>
              <span>Smart Coding Platform v1.0.0</span>
            </div>
            <div class="info-item">
              <label>运行时间</label>
              <span>{{ uptime }} 天</span>
            </div>
            <div class="info-item">
              <label>数据库状态</label>
              <el-tag type="success">正常</el-tag>
            </div>
            <div class="info-item">
              <label>Redis 状态</label>
              <el-tag type="warning">未连接（可选）</el-tag>
            </div>
            <div class="info-item">
              <label>Node.js 版本</label>
              <span>v18.x</span>
            </div>
            <div class="info-item">
              <label>MySQL 版本</label>
              <span>8.0+</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>快速操作</span>
          </template>
          
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/admin/users')">
              <el-icon><UserFilled /></el-icon>
              用户管理
            </el-button>
            <el-button type="success" @click="$router.push('/admin/courses')">
              <el-icon><Reading /></el-icon>
              课程审核
            </el-button>
            <el-button type="warning" @click="$router.push('/admin/logs')">
              <el-icon><Tickets /></el-icon>
              操作日志
            </el-button>
            <el-button type="danger" @click="$router.push('/admin/database')">
              <el-icon><Coin /></el-icon>
              数据维护
            </el-button>
          </div>
          
          <el-divider />
          
          <div class="alert-list">
            <h4>系统告警</h4>
            <div v-for="(alert, index) in alerts" :key="index" class="alert-item" :class="alert.type">
              <el-icon><Warning /></el-icon>
              <span>{{ alert.message }}</span>
            </div>
            
            <p v-if="alerts.length === 0" style="text-align: center; color: #999;">暂无告警</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近操作日志 -->
    <el-card shadow="hover" style="margin-top: 24px;">
      <template #header>
        <div class="card-header">
          <span>最近操作</span>
          <router-link to="/admin/logs" class="more-link">查看全部 →</router-link>
        </div>
      </template>
      
      <el-table :data="recentLogs" stripe>
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="ip" label="IP 地址" width="140" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : row.status === 'error' ? 'danger' : 'info'" size="small">
              {{ row.status === 'success' ? '成功' : row.status === 'error' ? '失败' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  UserFilled, Reading, Document, ChatDotRound,
  Warning, Tickets, Coin, Top, Bottom
} from '@element-plus/icons-vue'

const uptime = ref(15)

const stats = ref([
  { title: '总用户数', value: '1,234', icon: 'User', type: 'primary', trend: 12 },
  { title: '今日活跃', value: '356', icon: 'UserFilled', type: 'success', trend: 8 },
  { title: '课程总数', value: '89', icon: 'Reading', type: 'warning', trend: -2 },
  { title: '提交总数', value: '12,456', icon: 'Document', type: 'danger', trend: 25 }
])

const alerts = ref([
  { message: 'CPU 使用率超过 80%', type: 'warning' }
])

const recentLogs = ref([
  { time: '2026-04-03 13:20:00', user: 'admin', action: '登录系统', ip: '127.0.0.1', status: 'success' },
  { time: '2026-04-03 13:18:30', user: 'teacher1', action: '发布课程 "Python 进阶"', ip: '192.168.1.100', status: 'success' },
  { time: '2026-04-03 13:15:22', user: 'student5', action: '提交代码 (题目 ID: 1)', ip: '10.0.0.50', status: 'success' },
  { time: '2026-04-03 13:12:11', user: 'unknown', action: '尝试暴力破解密码', ip: '45.33.22.100', status: 'error' }
])
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.stats-row {
  .stat-card {
    position: relative;
    
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
      
      .stat-primary & { background: $primary-color; }
      .stat-success & { background: #059669; }
      .stat-warning & { background: #d97706; }
      .stat-danger & { background: #dc2626; }
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
    
    .stat-trend {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
      
      &.up { color: #059669; }
      &.down { color: #dc2626; }
    }
  }
}

.system-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid $border-light;
    
    &:last-child {
      border-bottom: none;
    }
    
    label {
      color: $text-secondary;
      font-size: 14px;
    }
    
    span {
      font-weight: 500;
      color: $text-primary;
    }
  }
}

.quick-actions {
  padding: 0;
  margin: 0;
  
  .el-button {
    width: 100%;
    margin: 0 0 10px;
    padding: 14px 0;
    height: auto;
    font-size: 15px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 6px;
    border: none;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .el-icon {
      font-size: 18px;
    }
  }
}

.alert-list {
  h4 {
    margin: 0 0 12px;
    font-size: 14px;
    color: $text-primary;
  }
  
  .alert-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 0;
    font-size: 13px;
    
    &.warning {
      color: #d97706;
    }
    
    &.error {
      color: #dc2626;
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
</style>
