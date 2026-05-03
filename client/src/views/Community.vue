<template>
  <div class="community-page page-container">
    <div class="container">
      <div class="page-header">
        <div class="header-badge">学习社区</div>
        <h1>交流与分享</h1>
        <p>与志同道合的伙伴一起学习成长，分享你的编程心得</p>
      </div>
      
      <div class="community-content">
        <aside class="sidebar">
          <el-button type="primary" class="create-btn" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            发布帖子
          </el-button>
          
          <div class="category-list">
            <h4>分类</h4>
            <div
              v-for="cat in categories"
              :key="cat.value"
              class="category-item"
              :class="{ active: activeCategory === cat.value }"
              @click="activeCategory = cat.value"
            >
              <el-icon><component :is="cat.icon" /></el-icon>
              <span>{{ cat.label }}</span>
            </div>
          </div>
        </aside>
        
        <main class="posts-main">
          <div class="posts-list" v-loading="loading">
            <div
              v-for="post in sortedPosts"
              :key="post.id"
              class="post-card"
              :class="{ 'pinned-post': post.is_pinned }"
              @click="viewPost(post.id)"
            >
              <div class="post-header">
                <el-avatar :size="40" :src="post.author_avatar || undefined" class="post-avatar">
                  {{ post.author_name ? post.author_name.charAt(0) : '?' }}
                </el-avatar>
                <div class="post-meta">
                  <span class="author">{{ post.author_name || '未知' }}</span>
                  <span class="time">{{ post.created_at ? formatTime(post.created_at) : '' }}</span>
                </div>
                <div class="post-badges">
                  <el-tag v-if="post.is_pinned" type="danger" size="small" effect="dark" round>
                    <el-icon><Top /></el-icon> 置顶
                  </el-tag>
                  <span class="category-tag" :class="post.category || ''">{{ getCategoryLabel(post.category) }}</span>
                </div>
              </div>
              <h3 class="post-title">{{ post.title || '无标题' }}</h3>
              <p class="post-content">{{ truncate(post.content || '', 150) }}</p>
              <div class="post-footer">
                <div class="post-stats">
                  <span><el-icon><View /></el-icon> {{ post.view_count || 0 }}</span>
                  <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count || 0 }}</span>
                  <span class="like-stat">
                    <svg class="like-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1z"/>
                    </svg>
                    {{ post.like_count || 0 }}
                  </span>
                </div>
                <div v-if="canModerate" class="post-actions" @click.stop>
                  <el-button
                    :type="post.is_pinned ? 'warning' : 'info'"
                    size="small"
                    text
                    @click="togglePin(post)"
                  >
                    <el-icon><Top /></el-icon>
                    {{ post.is_pinned ? '取消置顶' : '置顶' }}
                  </el-button>
                </div>
              </div>
            </div>
            
            <div v-if="!loading && posts.length === 0" class="empty-state">
              <el-empty description="暂无帖子" />
            </div>
          </div>
          
          <div class="pagination" v-if="pagination.total > pagination.limit">
            <el-pagination
              v-model:current-page="pagination.page"
              :page-size="pagination.limit"
              :total="pagination.total"
              layout="prev, pager, next"
              @current-change="fetchPosts"
            />
          </div>
        </main>
      </div>
    </div>
    
    <el-dialog v-model="showCreateDialog" title="发布帖子" width="600px" class="create-dialog">
      <el-form ref="formRef" :model="postForm" :rules="postRules">
        <el-form-item prop="title">
          <el-input v-model="postForm.title" placeholder="标题" />
        </el-form-item>
        <el-form-item prop="category">
          <el-select v-model="postForm.category" placeholder="选择分类">
            <el-option label="问答" value="question" />
            <el-option label="文章" value="article" />
            <el-option label="讨论" value="discussion" />
          </el-select>
        </el-form-item>
        <el-form-item prop="content">
          <el-input v-model="postForm.content" type="textarea" :rows="10" placeholder="内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createPost" :loading="creating">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElEmpty } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { communityApi } from '@/api/community'
import { useUserStore } from '@/stores/user'
import type { Post } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const router = useRouter()
const userStore = useUserStore()

const canModerate = computed(() => {
  return userStore.user?.role === 'admin' || userStore.user?.role === 'teacher'
})

const loading = ref(false)
const posts = ref<Post[]>([])
const activeCategory = ref('all')
const showCreateDialog = ref(false)
const creating = ref(false)
const formRef = ref<FormInstance>()

const categories = [
  { value: 'all', label: '全部', icon: 'Menu' },
  { value: 'question', label: '问答', icon: 'QuestionFilled' },
  { value: 'article', label: '文章', icon: 'Document' },
  { value: 'discussion', label: '讨论', icon: 'ChatDotRound' }
]

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const sortedPosts = computed(() => {
  return [...posts.value].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return 0
  })
})

const postForm = reactive({
  title: '',
  category: '',
  content: ''
})

const postRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const getCategoryLabel = (category: string | undefined | null) => {
  if (!category) return '未知'
  const labels: Record<string, string> = {
    question: '问答',
    article: '文章',
    discussion: '讨论'
  }
  return labels[category] || category
}

const formatTime = (time: string | undefined | null) => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

const truncate = (text: string | undefined | null, length: number) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

const viewPost = (postId: number) => {
  router.push(`/community/posts/${postId}`)
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (activeCategory.value !== 'all') {
      params.category = activeCategory.value
    }
    
    const res = await communityApi.getPosts(params)
    
    if (res.data) {
      posts.value = res.data || []
      if (res.pagination) {
        pagination.total = res.pagination.total
      }
    } else if (res.rows) {
      posts.value = res.rows || []
      pagination.total = res.total || 0
    } else {
      posts.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    ElMessage.error('获取帖子列表失败')
    posts.value = []
  } finally {
    loading.value = false
  }
}

const createPost = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  creating.value = true
  try {
    const res = await communityApi.createPost(postForm)
    ElMessage.success('发布成功')
    showCreateDialog.value = false
    
    postForm.title = ''
    postForm.category = ''
    postForm.content = ''
    
    router.push(`/community/posts/${res.data.id}`)
  } catch (error) {
    console.error('发布帖子失败:', error)
    ElMessage.error('发布帖子失败')
  } finally {
    creating.value = false
  }
}

const togglePin = async (post: Post) => {
  try {
    const res = await communityApi.togglePinPost(post.id)
    if (res.success) {
      post.is_pinned = res.data.is_pinned
      ElMessage.success(res.data.is_pinned ? '置顶成功' : '取消置顶成功')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

watch(activeCategory, () => {
  pagination.page = 1
  fetchPosts()
})

onMounted(fetchPosts)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.community-page {
  padding: 40px 0 80px;
  min-height: calc(100vh - 70px);
}

.page-header {
  text-align: center;
  margin-bottom: 48px;
  
  .header-badge {
    display: inline-block;
    padding: 6px 16px;
    background: $primary-light;
    color: $primary-color;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 16px;
    border: 1px solid $primary-border;
  }
  
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 12px;
    color: $text-primary;
    letter-spacing: -0.03em;
  }
  
  p {
    color: $text-secondary;
    font-size: 1.1rem;
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.7;
  }
}

.community-content {
  display: flex;
  gap: 28px;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
}

.create-btn {
  width: 100%;
  height: 44px;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: $radius-sm;
  transition: all $transition-base;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
  }
}

.category-list {
  background: white;
  border-radius: $radius-md;
  padding: 16px;
  box-shadow: $shadow-card;
  border: 1px solid $border-color;
  
  h4 {
    font-size: 0.8rem;
    color: $text-muted;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all $transition-fast;
  font-size: 0.9rem;
  color: $text-secondary;
  font-weight: 500;
  
  &:hover {
    background: $primary-light;
    color: $primary-color;
  }
  
  &.active {
    background: $primary-light;
    color: $primary-color;
    font-weight: 600;
  }
}

.posts-main {
  flex: 1;
  min-width: 0;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: white;
  border-radius: $radius-md;
  padding: 24px;
  box-shadow: $shadow-card;
  border: 1px solid $border-color;
  cursor: pointer;
  transition: all $transition-base;
  
  &:hover {
    box-shadow: $shadow-card-hover;
    border-color: $primary-border;
    transform: translateY(-2px);
  }
  
  &.pinned-post {
    border-left: 3px solid #dc2626;
    background: linear-gradient(to right, rgba(254, 242, 242, 0.5), white);
  }
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.post-avatar {
  border: 2px solid $primary-border;
}

.post-meta {
  flex: 1;
  
  .author {
    font-weight: 600;
    color: $text-primary;
    display: block;
    font-size: 0.9rem;
  }
  
  .time {
    font-size: 0.8rem;
    color: $text-muted;
  }
}

.post-badges {
  display: flex;
  align-items: center;
  gap: 8px;
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

.post-title {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: $text-primary;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

.post-content {
  color: $text-secondary;
  font-size: 0.9rem;
  line-height: 1.7;
  margin-bottom: 16px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-stats {
  display: flex;
  gap: 18px;
  color: $text-muted;
  font-size: 0.85rem;
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .like-stat {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .like-icon {
    flex-shrink: 0;
    color: $text-muted;
  }
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 36px;
}
</style>
