<template>
  <div class="main-layout">
    <header class="navbar">
      <div class="nav-container">
        <router-link to="/" class="logo">
          <el-icon :size="28"><Monitor /></el-icon>
          <span>智能编程教学平台</span>
        </router-link>
        
        <nav class="nav-menu">
          <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">首页</router-link>
          <router-link to="/courses" class="nav-link" :class="{ active: $route.path.startsWith('/courses') }">课程中心</router-link>
          <router-link to="/practice" class="nav-link" :class="{ active: $route.path.startsWith('/practice') || $route.path.startsWith('/problems') }">在线练习</router-link>
          <router-link to="/exams" class="nav-link" :class="{ active: $route.path.startsWith('/exams') }">考试中心</router-link>
          <router-link to="/playground" class="nav-link" :class="{ active: $route.path === '/playground' }">代码演练</router-link>
          <router-link to="/community" class="nav-link" :class="{ active: $route.path.startsWith('/community') }">学习社区</router-link>
        </nav>
        
        <div class="nav-actions">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown trigger="click" @command="handleCommand">
              <div class="user-info">
                <el-avatar :size="36" :src="userStore.user?.avatar || undefined">
                  {{ userStore.user?.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="username">{{ userStore.user?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
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
            <el-button @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <footer class="footer" v-if="!hideFooter">
      <div class="footer-content">
        <div class="footer-section">
          <h4>关于我们</h4>
          <p>智能编程教学平台致力于为学习者提供优质的编程教育资源，帮助每一位学习者实现编程梦想。</p>
        </div>
        <div class="footer-section">
          <h4>快速链接</h4>
          <ul>
            <li><router-link to="/courses">课程中心</router-link></li>
            <li><router-link to="/practice">在线练习</router-link></li>
            <li><router-link to="/playground">代码演练</router-link></li>
            <li><router-link to="/community">学习社区</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>联系方式</h4>
          <ul>
            <li><el-icon><Message /></el-icon> contact@smartcoding.com</li>
            <li><el-icon><Phone /></el-icon> 400-123-4567</li>
            <li><el-icon><Location /></el-icon> 四川省西昌市</li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>关注我们</h4>
          <div class="social-links">
            <a href="#" title="微信"><el-icon :size="20"><ChatDotRound /></el-icon></a>
            <a href="#" title="微博"><el-icon :size="20"><Promotion /></el-icon></a>
            <a href="#" title="GitHub"><el-icon :size="20"><Link /></el-icon></a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 智能编程教学平台. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const hideFooter = computed(() => route.path.startsWith('/practice') || route.path.startsWith('/problems'))

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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: $shadow-sm;
  z-index: 1000;
  height: 70px;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.4rem;
  font-weight: 700;
  color: $primary-color;
  
  span {
    color: $text-primary;
  }
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 10px 18px;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    color: $primary-color;
    background: $primary-light;
  }
  
  &.active {
    color: $primary-color;
    background: $primary-light;
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: $radius-md;
  transition: background 0.3s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  .username {
    font-weight: 500;
    color: $text-primary;
  }
}

.main-content {
  flex: 1;
  padding-top: 70px;
}

.footer {
  background: #1e293b;
  color: white;
  padding: 60px 20px 30px;
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section {
  h4 {
    font-size: 1.1rem;
    margin-bottom: 20px;
    color: white;
  }
  
  p {
    color: #94a3b8;
    line-height: 1.7;
  }
  
  ul {
    li {
      margin-bottom: 12px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 8px;
      
      a {
        color: #94a3b8;
        transition: color 0.3s ease;
        
        &:hover {
          color: white;
        }
      }
    }
  }
}

.social-links {
  display: flex;
  gap: 15px;
  
  a {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &:hover {
      background: $primary-color;
      transform: translateY(-3px);
    }
  }
}

.footer-bottom {
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #64748b;
}
</style>
