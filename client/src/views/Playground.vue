<template>
  <div class="playground-page page-container">
    <div class="container">
      <div class="page-header">
        <h1>代码演练场</h1>
        <p>自由编写代码，实时预览效果</p>
      </div>
      
      <div class="playground-container">
        <div class="editor-panel">
          <div class="panel-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              class="tab-btn"
              :class="{ active: activeTab === tab.value }"
              @click="activeTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="editor-wrapper">
            <el-input
              v-show="activeTab === 'html'"
              v-model="htmlCode"
              type="textarea"
              :rows="25"
              class="code-textarea"
            />
            <el-input
              v-show="activeTab === 'css'"
              v-model="cssCode"
              type="textarea"
              :rows="25"
              class="code-textarea"
            />
            <el-input
              v-show="activeTab === 'js'"
              v-model="jsCode"
              type="textarea"
              :rows="25"
              class="code-textarea"
            />
          </div>
        </div>
        
        <div class="preview-panel">
          <div class="preview-header">
            <span>预览</span>
            <el-button type="primary" size="small" @click="updatePreview">
              <el-icon><VideoPlay /></el-icon>
              运行
            </el-button>
          </div>
          <iframe ref="previewFrame" class="preview-frame" sandbox="allow-scripts" />
        </div>
      </div>
      
      <div class="templates-section">
        <h3>快速模板</h3>
        <div class="templates-grid">
          <div class="template-card" @click="loadTemplate('basic')">
            <el-icon :size="24"><Document /></el-icon>
            <span>基础页面</span>
          </div>
          <div class="template-card" @click="loadTemplate('animation')">
            <el-icon :size="24"><MagicStick /></el-icon>
            <span>CSS 动画</span>
          </div>
          <div class="template-card" @click="loadTemplate('interactive')">
            <el-icon :size="24"><Mouse /></el-icon>
            <span>交互效果</span>
          </div>
          <div class="template-card" @click="loadTemplate('responsive')">
            <el-icon :size="24"><Iphone /></el-icon>
            <span>响应式布局</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const tabs = [
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JavaScript', value: 'js' }
]

const activeTab = ref('html')
const htmlCode = ref('')
const cssCode = ref('')
const jsCode = ref('')
const previewFrame = ref<HTMLIFrameElement>()

const templates = {
  basic: {
    html: `<!DOCTYPE html>
<html>
<head>
    <title>我的页面</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p>这是一个示例页面</p>
    <button id="btn">点击我</button>
</body>
</html>`,
    css: `body {
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 50px;
    background: #0f766e;
    min-height: 100vh;
    margin: 0;
}

h1 {
    color: white;
    font-size: 3em;
    margin-bottom: 20px;
}

p {
    color: rgba(255,255,255,0.8);
    font-size: 1.2em;
}

button {
    padding: 12px 30px;
    font-size: 16px;
    border: none;
    border-radius: 25px;
    background: white;
    color: #0f766e;
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s;
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
}`,
    js: `document.getElementById('btn').addEventListener('click', function() {
    alert('你点击了按钮！');
});`
  },
  animation: {
    html: `<div class="container">
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>
</div>`,
    css: `.container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #1a1a2e;
    gap: 20px;
}

.box {
    width: 60px;
    height: 60px;
    background: #0f766e;
    border-radius: 10px;
    animation: bounce 1.5s ease-in-out infinite;
}

.box:nth-child(2) {
    animation-delay: 0.2s;
}

.box:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes bounce {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-100px);
    }
}`,
    js: ''
  },
  interactive: {
    html: `<div class="card">
    <div class="card-content">
        <h2>悬停效果</h2>
        <p>将鼠标移到卡片上查看效果</p>
    </div>
</div>`,
    css: `body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #0f0f23;
    margin: 0;
}

.card {
    width: 300px;
    height: 200px;
    background: #1e3c72;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.5s ease;
    position: relative;
    overflow: hidden;
}

.card::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
    transform: rotate(45deg);
    transition: all 0.5s ease;
}

.card:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.card:hover::before {
    left: 100%;
}

.card-content {
    text-align: center;
    color: white;
    z-index: 1;
}

.card-content h2 {
    margin-bottom: 10px;
}`,
    js: ''
  },
  responsive: {
    html: `<div class="container">
    <header>
        <h1>响应式布局</h1>
    </header>
    <nav>
        <a href="#">首页</a>
        <a href="#">关于</a>
        <a href="#">联系</a>
    </nav>
    <main>
        <article>内容区域 1</article>
        <article>内容区域 2</article>
        <article>内容区域 3</article>
    </main>
    <footer>页脚</footer>
</div>`,
    css: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background: #f5f5f5;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    background: #0f766e;
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 10px;
    margin-bottom: 20px;
}

nav {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;
}

nav a {
    padding: 10px 20px;
    background: white;
    border-radius: 5px;
    text-decoration: none;
    color: #333;
    transition: all 0.3s;
}

nav a:hover {
    background: #0f766e;
    color: white;
}

main {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

article {
    background: white;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

footer {
    background: #333;
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 10px;
}

@media (max-width: 768px) {
    nav {
        flex-direction: column;
    }
    
    nav a {
        text-align: center;
    }
}`,
    js: ''
  }
}

const loadTemplate = (name: keyof typeof templates) => {
  const template = templates[name]
  htmlCode.value = template.html
  cssCode.value = template.css
  jsCode.value = template.js
  updatePreview()
}

const updatePreview = () => {
  if (!previewFrame.value) return
  
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${cssCode.value}</style>
    </head>
    <body>
      ${htmlCode.value.replace(/<!DOCTYPE html>|<html>|<\/html>|<head>[\s\S]*<\/head>|<body>|<\/body>/gi, '')}
      <script>${jsCode.value}<\/script>
    </body>
    </html>
  `
  
  previewFrame.value.srcdoc = content
}

onMounted(() => {
  loadTemplate('basic')
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.playground-page {
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 10px;
  }
  
  p {
    color: $text-secondary;
  }
}

.playground-container {
  display: flex;
  gap: 20px;
  height: 600px;
  margin-bottom: 40px;
}

.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-md;
}

.panel-tabs {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid $border-color;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  color: $text-secondary;
  transition: all 0.2s ease;
  
  &:hover {
    background: $primary-light;
  }
  
  &.active {
    color: $primary-color;
    background: white;
    border-bottom: 2px solid $primary-color;
  }
}

.editor-wrapper {
  flex: 1;
  position: relative;
}

.code-textarea :deep(textarea) {
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  border-radius: 0;
  height: 100% !important;
}

.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-md;
}

.preview-header {
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 1px solid $border-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.preview-frame {
  flex: 1;
  border: none;
  background: white;
}

.templates-section {
  h3 {
    margin-bottom: 20px;
    font-size: 1.2rem;
  }
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.template-card {
  background: white;
  padding: 20px;
  border-radius: $radius-md;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: $shadow-sm;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: $shadow-md;
    color: $primary-color;
  }
  
  .el-icon {
    margin-bottom: 10px;
    color: $primary-color;
  }
  
  span {
    display: block;
    font-weight: 500;
  }
}
</style>
