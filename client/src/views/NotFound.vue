<template>
  <div class="not-found-page">
    <div class="content">
      <h1>404</h1>
      <p>页面未找到</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-color;
}

.content {
  text-align: center;
  
  h1 {
    font-size: 8rem;
    font-weight: 800;
    background: linear-gradient(135deg, $primary-color, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 20px;
  }
  
  p {
    font-size: 1.5rem;
    color: $text-secondary;
    margin-bottom: 30px;
  }
}
</style>
