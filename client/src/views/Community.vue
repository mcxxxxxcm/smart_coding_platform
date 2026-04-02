<template>
  <div class="community-page page-container">
    <div class="container">
      <div class="page-header">
        <h1>学习社区</h1>
        <p>与志同道合的伙伴一起学习成长</p>
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
              v-for="post in posts"
              :key="post.id"
              class="post-card"
              @click="$router.push(`/community/posts/${post.id}`)"
            >
              <div class="post-header">
                <el-avatar :size="40" :src="post.author_avatar || undefined">
                  {{ post.author_name?.charAt(0) }}
                </el-avatar>
                <div class="post-meta">
                  <span class="author">{{ post.author_name }}</span>
                  <span class="time">{{ formatTime(post.created_at) }}</span>
                </div>
                <span class="category-tag" :class="post.category">{{ getCategoryLabel(post.category) }}</span>
              </div>
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-content">{{ truncate(post.content, 150) }}</p>
              <div class="post-footer">
                <span><el-icon><View /></el-icon> {{ post.view_count }}</span>
                <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count }}</span>
                <span><el-icon><Star /></el-icon> {{ post.like_count }}</span>
              </div>
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
    
    <el-dialog v-model="showCreateDialog" title="发布帖子" width="600px">
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
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { communityApi } from '@/api/community'
import { useUserStore } from '@/stores/user'
import type { Post } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

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

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    question: '问答',
    article: '文章',
    discussion: '讨论'
  }
  return labels[category] || category
}

const formatTime = (time: string) => {
  return dayjs(time).fromNow()
}

const truncate = (text: string, length: number) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
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
    posts.value = res.data || []
    if (res.pagination) {
      pagination.total = res.pagination.total
    }
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
  } finally {
    creating.value = false
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
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 10px;
  }
  
  p {
    color: $text-secondary;
  }
}

.community-content {
  display: flex;
  gap: 30px;
}

.sidebar {
  width: 200px;
  flex-shrink: 0;
}

.create-btn {
  width: 100%;
  margin-bottom: 20px;
}

.category-list {
  background: white;
  border-radius: $radius-md;
  padding: 16px;
  box-shadow: $shadow-sm;
  
  h4 {
    font-size: 0.9rem;
    color: $text-secondary;
    margin-bottom: 12px;
  }
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(79, 70, 229, 0.05);
  }
  
  &.active {
    background: rgba(79, 70, 229, 0.1);
    color: $primary-color;
  }
}

.posts-main {
  flex: 1;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: white;
  border-radius: $radius-md;
  padding: 20px;
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-meta {
  flex: 1;
  
  .author {
    font-weight: 500;
    color: $text-primary;
    display: block;
  }
  
  .time {
    font-size: 0.85rem;
    color: $text-secondary;
  }
}

.category-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  
  &.question { background: #dbeafe; color: #1e40af; }
  &.article { background: #dcfce7; color: #166534; }
  &.discussion { background: #fef3c7; color: #92400e; }
}

.post-title {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: $text-primary;
}

.post-content {
  color: $text-secondary;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 12px;
}

.post-footer {
  display: flex;
  gap: 20px;
  color: $text-secondary;
  font-size: 0.9rem;
  
  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
</style>
