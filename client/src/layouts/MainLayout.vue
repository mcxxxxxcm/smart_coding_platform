<template>
  <div class="main-layout">
    <header class="navbar" :class="{ scrolled: isScrolled }">
      <div class="nav-container">
        <router-link to="/" class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
              <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" stroke-width="2"/>
              <path d="M10 14l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="18" y1="22" x2="24" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span>智能编程教学平台</span>
        </router-link>
        
        <nav class="nav-menu">
          <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">
            <span class="nav-text">首页</span>
          </router-link>
          <router-link to="/courses" class="nav-link" :class="{ active: $route.path.startsWith('/courses') }">
            <span class="nav-text">课程中心</span>
          </router-link>
          <router-link to="/practice" class="nav-link" :class="{ active: $route.path.startsWith('/practice') || $route.path.startsWith('/problems') }">
            <span class="nav-text">在线练习</span>
          </router-link>
          <router-link to="/exams" class="nav-link" :class="{ active: $route.path.startsWith('/exams') }">
            <span class="nav-text">考试中心</span>
          </router-link>
          <router-link to="/playground" class="nav-link" :class="{ active: $route.path === '/playground' }">
            <span class="nav-text">代码演练</span>
          </router-link>
          <router-link to="/community" class="nav-link" :class="{ active: $route.path.startsWith('/community') }">
            <span class="nav-text">学习社区</span>
          </router-link>
        </nav>
        
        <div class="nav-actions">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown trigger="click" @command="handleCommand">
              <div class="user-info">
                <el-avatar :size="34" :src="userStore.user?.avatar || undefined" class="user-avatar">
                  {{ userStore.user?.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="username">{{ userStore.user?.username }}</span>
                <el-icon class="arrow-icon"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button class="btn-ghost" @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" class="btn-primary" @click="$router.push('/register')">免费注册</el-button>
          </template>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <footer class="footer" v-if="!hideFooter">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <div class="footer-logo">
              <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
                <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" stroke-width="2"/>
                <path d="M10 14l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="18" y1="22" x2="24" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>智能编程教学平台</span>
            </div>
            <p>致力于为学习者提供优质的编程教育资源，帮助每一位学习者实现编程梦想。</p>
          </div>
          <div class="footer-links">
            <div class="footer-col">
              <h4>学习</h4>
              <ul>
                <li><router-link to="/courses">课程中心</router-link></li>
                <li><router-link to="/practice">在线练习</router-link></li>
                <li><router-link to="/playground">代码演练</router-link></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>社区</h4>
              <ul>
                <li><router-link to="/community">学习社区</router-link></li>
                <li><router-link to="/exams">考试中心</router-link></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>联系</h4>
              <ul>
                <li>contact@smartcoding.com</li>
                <li>400-123-4567</li>
                <li>四川省西昌市</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 智能编程教学平台. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const isScrolled = ref(false)
const hideFooter = computed(() => route.path.startsWith('/practice') || route.path.startsWith('/problems'))

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    userStore.logout()
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  z-index: 1000;
  height: 64px;
  transition: all $transition-base;
  border-bottom: 1px solid transparent;
  
  &.scrolled {
    background: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid $border-color;
    box-shadow: $shadow-sm;
  }
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.15rem;
  font-weight: 700;
  color: $primary-color;
  letter-spacing: -0.01em;
  
  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: $primary-light;
    border-radius: $radius-sm;
    color: $primary-color;
  }
  
  span {
    color: $text-primary;
  }
}

.nav-menu {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all $transition-fast;
  position: relative;
  
  &:hover {
    color: $primary-color;
    background: $primary-light;
  }
  
  &.active {
    color: $primary-color;
    background: $primary-light;
    font-weight: 600;
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .btn-ghost {
    border: 1px solid $border-color;
    border-radius: $radius-sm;
    font-weight: 500;
    color: $text-secondary;
    height: 36px;
    
    &:hover {
      border-color: $primary-color;
      color: $primary-color;
    }
  }
  
  .btn-primary {
    border-radius: $radius-sm;
    font-weight: 600;
    height: 36px;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 12px 4px 4px;
  border-radius: $radius-md;
  transition: all $transition-fast;
  
  &:hover {
    background: $surface-color;
  }
  
  .user-avatar {
    border: 2px solid $primary-border;
  }
  
  .username {
    font-weight: 500;
    font-size: 0.9rem;
    color: $text-primary;
  }
  
  .arrow-icon {
    font-size: 12px;
    color: $text-muted;
    transition: transform $transition-fast;
  }
}

.main-content {
  flex: 1;
  padding-top: 64px;
}

.page-enter-active {
  transition: opacity 0.2s ease;
}

.page-leave-active {
  transition: opacity 0.15s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.footer {
  background: #0f172a;
  color: white;
  padding: 64px 32px 32px;
  margin-top: auto;
}

.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  gap: 64px;
  margin-bottom: 48px;
}

.footer-brand {
  max-width: 320px;
  
  .footer-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 16px;
    color: white;
  }
  
  p {
    color: #64748b;
    line-height: 1.7;
    font-size: 0.9rem;
  }
}

.footer-links {
  display: flex;
  gap: 64px;
}

.footer-col {
  h4 {
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  ul {
    li {
      margin-bottom: 10px;
      color: #64748b;
      font-size: 0.9rem;
      transition: color $transition-fast;
      
      a {
        color: #64748b;
        
        &:hover {
          color: white;
        }
      }
    }
  }
}

.footer-bottom {
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  
  p {
    color: #475569;
    font-size: 0.85rem;
  }
}
</style>
