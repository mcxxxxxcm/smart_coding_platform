<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <el-icon :size="28"><Setting /></el-icon>
        <span>系统管理后台</span>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/admin" class="nav-item" exact-active-class="active">
          <el-icon><DataBoard /></el-icon>
          <span>控制台</span>
        </router-link>
        
        <div class="nav-section">
          <div class="section-title">用户管理</div>
          <router-link to="/admin/users" class="nav-item" active-class="active">
            <el-icon><UserFilled /></el-icon>
            <span>用户列表</span>
          </router-link>
          <router-link to="/admin/roles" class="nav-item" active-class="active">
            <el-icon><Key /></el-icon>
            <span>角色权限</span>
          </router-link>
        </div>
        
        <div class="nav-section">
          <div class="section-title">内容管理</div>
          <router-link to="/admin/courses" class="nav-item" active-class="active">
            <el-icon><Reading /></el-icon>
            <span>课程审核</span>
          </router-link>
          <router-link to="/admin/problems" class="nav-item" active-class="active">
            <el-icon><Document /></el-icon>
            <span>题目审核</span>
          </router-link>
          <router-link to="/admin/community" class="nav-item" active-class="active">
            <el-icon><ChatDotRound /></el-icon>
            <span>社区管理</span>
          </router-link>
        </div>
        
        <div class="nav-section">
          <div class="section-title">系统设置</div>
          <router-link to="/admin/settings" class="nav-item" active-class="active">
            <el-icon><Tools /></el-icon>
            <span>基础配置</span>
          </router-link>
          <router-link to="/admin/security" class="nav-item" active-class="active">
            <el-icon><Lock /></el-icon>
            <span>安全设置</span>
          </router-link>
          <router-link to="/admin/logs" class="nav-item" active-class="active">
            <el-icon><Tickets /></el-icon>
            <span>操作日志</span>
          </router-link>
          <router-link to="/admin/database" class="nav-item" active-class="active">
            <el-icon><Coin /></el-icon>
            <span>数据维护</span>
          </router-link>
          <router-link to="/admin/ai-analytics" class="nav-item" active-class="active">
            <el-icon><TrendCharts /></el-icon>
            <span>AI 运营分析</span>
          </router-link>
        </div>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <el-avatar :size="36" style="background: #ef4444;">
            {{ userStore.user?.username?.charAt(0) }}
          </el-avatar>
          <div class="user-details">
            <span class="username">{{ userStore.user?.username }}</span>
            <span class="role-tag admin">管理员</span>
          </div>
        </div>
        <el-button text @click="userStore.logout()" class="logout-btn">
          <el-icon><SwitchButton /></el-icon>
          退出
        </el-button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <header class="top-bar">
        <h2>{{ pageTitle }}</h2>
        <div class="header-actions">
          <el-badge :value="0" :max="99">
            <el-button circle><el-icon><Bell /></el-icon></el-button>
          </el-badge>
          <el-dropdown>
            <el-avatar :size="32" style="background: #ef4444;">
              {{ userStore.user?.username?.charAt(0) }}
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/profile')">个人设置</el-dropdown-item>
                <el-dropdown-item divided @click="userStore.logout()">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Setting, DataBoard, UserFilled, Key, Reading, Document,
  ChatDotRound, Tools, Lock, Tickets, Coin, Bell, SwitchButton, TrendCharts
} from '@element-plus/icons-vue'

const route = useRoute()
const userStore = useUserStore()

const pageTitle = computed(() => {
  return (route.meta.title as string) || '控制台'
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.admin-layout {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  span {
    font-size: 16px;
    font-weight: 600;
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
}

.nav-section {
  margin-bottom: 20px;
  
  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 600;
    letter-spacing: 1px;
    padding: 8px 12px;
    margin-bottom: 4px;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s ease;
  margin-bottom: 4px;
  font-size: 14px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  &.active {
    background: #dc2626;
    color: white;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  
  .user-details {
    display: flex;
    flex-direction: column;
    
    .username {
      font-size: 13px;
      font-weight: 500;
    }
    
    .role-tag {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      
      &.admin {
        color: #fca5a5;
      }
    }
  }
}

.logout-btn {
  width: 100%;
  color: rgba(255, 255, 255, 0.6);
  justify-content: flex-start;
  
  &:hover {
    color: white;
    background: rgba(239, 68, 68, 0.2);
  }
}

.main-content {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background: white;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}
</style>
