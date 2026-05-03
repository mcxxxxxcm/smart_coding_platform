<template>
  <div class="post-detail-page page-container">
    <div class="container" v-loading="loading">
      <article class="post-article" v-if="post">
        <header class="post-header">
          <h1>{{ post.title }}</h1>
          <div class="post-meta">
            <el-avatar :size="44" :src="post.author_avatar || undefined" class="author-avatar">
              {{ post.author_name?.charAt(0) }}
            </el-avatar>
            <div class="author-info">
              <span class="author-name">{{ post.author_name }}</span>
              <span class="post-time">{{ formatTime(post.created_at) }}</span>
            </div>
            <span class="category-tag" :class="post.category">{{ getCategoryLabel(post.category) }}</span>
          </div>
        </header>
        
        <div class="post-content">
          <p v-html="formatContent(post.content)"></p>
        </div>
        
        <footer class="post-footer">
          <div class="actions">
            <el-button :type="liked ? 'primary' : 'default'" round @click="toggleLike">
              <el-icon><Star /></el-icon>
              {{ liked ? '已点赞' : '点赞' }} ({{ post.like_count }})
            </el-button>
          </div>
        </footer>
      </article>
      
      <section class="comments-section" v-if="post">
        <div class="section-header">
          <h3>评论 ({{ post.comment_count }})</h3>
        </div>
        
        <div class="comment-form">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
          />
          <div class="comment-form-footer">
            <el-button type="primary" @click="submitComment" :loading="submitting" round>发表评论</el-button>
          </div>
        </div>
        
        <div class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <el-avatar :size="36" :src="comment.author_avatar || undefined">
              {{ comment.author_name?.charAt(0) }}
            </el-avatar>
            <div class="comment-content">
              <div class="comment-header">
                <span class="author">{{ comment.author_name }}</span>
                <span class="time">{{ formatTime(comment.created_at) }}</span>
              </div>
              <p>{{ comment.content }}</p>
            </div>
          </div>
          <el-empty v-if="comments.length === 0" description="暂无评论" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { communityApi } from '@/api/community'
import { useUserStore } from '@/stores/user'
import type { Post, Comment } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const liked = ref(false)
const commentContent = ref('')
const submitting = ref(false)

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    question: '问答',
    article: '文章',
    discussion: '讨论'
  }
  return labels[category] || category
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const formatContent = (content: string) => {
  return content.replace(/\n/g, '<br>')
}

const fetchPost = async () => {
  loading.value = true
  try {
    const res = await communityApi.getPostById(Number(route.params.id))
    post.value = res.data as Post
    fetchComments()
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  try {
    const res = await communityApi.getComments(Number(route.params.id))
    comments.value = res.data || []
  } catch {
    console.error('获取评论失败')
  }
}

const toggleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    const res = await communityApi.likePost(Number(route.params.id))
    liked.value = res.data.liked
    if (post.value) {
      post.value.like_count += res.data.liked ? 1 : -1
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  submitting.value = true
  try {
    await communityApi.createComment(Number(route.params.id), commentContent.value)
    ElMessage.success('评论成功')
    commentContent.value = ''
    fetchComments()
    if (post.value) {
      post.value.comment_count++
    }
  } finally {
    submitting.value = false
  }
}

onMounted(fetchPost)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.post-detail-page {
  padding: 40px 0 80px;
  min-height: calc(100vh - 70px);
}

.post-article {
  background: white;
  border-radius: $radius-lg;
  padding: 40px;
  margin-bottom: 28px;
  box-shadow: $shadow-card;
  border: 1px solid $border-color;
}

.post-header {
  margin-bottom: 32px;
  
  h1 {
    font-size: 1.75rem;
    margin-bottom: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.4;
  }
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  border: 2px solid $primary-border;
}

.author-info {
  flex: 1;
  
  .author-name {
    font-weight: 600;
    display: block;
    font-size: 0.95rem;
    color: $text-primary;
  }
  
  .post-time {
    font-size: 0.85rem;
    color: $text-muted;
  }
}

.category-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  
  &.question { background: #dbeafe; color: #1e40af; }
  &.article { background: #dcfce7; color: #166534; }
  &.discussion { background: #fef3c7; color: #92400e; }
}

.post-content {
  font-size: 1.05rem;
  line-height: 1.9;
  color: $text-primary;
  margin-bottom: 32px;
}

.post-footer {
  border-top: 1px solid $border-color;
  padding-top: 20px;
  
  .el-button {
    transition: all $transition-base;
    
    &:hover {
      transform: translateY(-1px);
    }
  }
}

.comments-section {
  background: white;
  border-radius: $radius-lg;
  padding: 32px;
  box-shadow: $shadow-card;
  border: 1px solid $border-color;
  
  .section-header {
    margin-bottom: 24px;
    
    h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: $text-primary;
      letter-spacing: -0.01em;
    }
  }
}

.comment-form {
  margin-bottom: 32px;
  
  :deep(.el-textarea__inner) {
    border-radius: $radius-sm;
    border-color: $border-color;
    transition: all $transition-base;
    
    &:hover {
      border-color: $primary-border;
    }
    
    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
    }
  }
  
  .comment-form-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid $border-light;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.comment-content {
  flex: 1;
  
  .comment-header {
    margin-bottom: 8px;
    
    .author {
      font-weight: 600;
      margin-right: 10px;
      color: $text-primary;
      font-size: 0.9rem;
    }
    
    .time {
      font-size: 0.8rem;
      color: $text-muted;
    }
  }
  
  p {
    color: $text-primary;
    line-height: 1.7;
    font-size: 0.95rem;
  }
}
</style>
