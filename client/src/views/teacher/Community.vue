<template>
  <div class="teacher-community-page">
    <div class="page-header">
      <h2>社区互动</h2>
      <p>查看学生发布的帖子，为学生解答问题</p>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索帖子标题或内容"
        clearable
        :prefix-icon="Search"
        @clear="fetchPosts"
        @keyup.enter="fetchPosts"
      />
      <el-select v-model="categoryFilter" placeholder="分类筛选" clearable @change="fetchPosts">
        <el-option label="问答" value="question" />
        <el-option label="文章" value="article" />
        <el-option label="讨论" value="discussion" />
      </el-select>
      <el-button type="primary" @click="fetchPosts">
        <el-icon><Search /></el-icon>
        搜索
      </el-button>
    </div>

    <div class="posts-container" v-loading="loading">
      <div
        v-for="post in sortedPosts"
        :key="post.id"
        class="post-card"
        :class="{ 'pinned-post': post.is_pinned }"
        @click="viewPost(post.id)"
      >
        <div class="post-header">
          <el-avatar :size="44" :src="post.author_avatar || undefined">
            {{ post.author_name ? post.author_name.charAt(0) : '?' }}
          </el-avatar>
          <div class="post-author-info">
            <span class="author-name">{{ post.author_name || '未知用户' }}</span>
            <span class="post-time">{{ formatTime(post.created_at) }}</span>
          </div>
          <div class="post-tags">
            <el-tag v-if="post.is_pinned" type="danger" size="small" effect="dark">
              <el-icon><Top /></el-icon> 置顶
            </el-tag>
            <el-tag :type="getCategoryType(post.category)" size="small">
              {{ getCategoryLabel(post.category) }}
            </el-tag>
          </div>
        </div>

        <h3 class="post-title">{{ post.title || '无标题' }}</h3>
        <p class="post-content">{{ truncate(post.content || '', 200) }}</p>

        <div class="post-footer">
          <div class="post-stats">
            <span><el-icon><View /></el-icon> {{ post.view_count || 0 }}</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count || 0 }}</span>
            <span><el-icon><Star /></el-icon> {{ post.like_count || 0 }}</span>
          </div>
          <div class="post-actions" @click.stop>
            <el-button type="primary" size="small" @click="viewPost(post.id)">
              <el-icon><ChatDotRound /></el-icon>
              查看并回复
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="!loading && posts.length === 0" class="empty-state">
        <el-empty description="暂无帖子">
          <template #image>
            <el-icon :size="80" color="#dcdfe6"><ChatDotRound /></el-icon>
          </template>
        </el-empty>
      </div>
    </div>

    <div class="pagination" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchPosts"
        @current-change="fetchPosts"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, View, ChatDotRound, Star, Top } from '@element-plus/icons-vue'
import { communityApi } from '@/api/community'
import type { Post } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const router = useRouter()

const loading = ref(false)
const posts = ref<Post[]>([])
const searchText = ref('')
const categoryFilter = ref('')
const sortBy = ref('newest')

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

const getCategoryLabel = (category: string | undefined | null) => {
  if (!category) return '其他'
  const labels: Record<string, string> = {
    question: '问答',
    article: '文章',
    discussion: '讨论'
  }
  return labels[category] || category
}

const getCategoryType = (category: string | undefined | null): 'primary' | 'success' | 'warning' | 'info' => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
    question: 'primary',
    article: 'success',
    discussion: 'warning'
  }
  return types[category || ''] || 'info'
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
  router.push(`/teacher/community/posts/${postId}`)
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (searchText.value.trim()) {
      params.search = searchText.value.trim()
    }
    if (categoryFilter.value) {
      params.category = categoryFilter.value
    }
    if (sortBy.value) {
      params.sort = sortBy.value
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

watch([searchText, categoryFilter], () => {
  pagination.page = 1
  fetchPosts()
})

onMounted(fetchPosts)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.teacher-community-page {
  .page-header {
    margin-bottom: 24px;

    h2 {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: $text-secondary;
      font-size: 14px;
    }
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    align-items: center;

    .el-input {
      flex: 1;
      max-width: 320px;
    }

    .el-select {
      width: 130px;
    }
  }

  .posts-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 300px;
  }

  .post-card {
    background: white;
    border-radius: $radius-md;
    padding: 24px;
    box-shadow: $shadow-sm;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: $shadow-md;
      transform: translateY(-2px);
    }

    &.pinned-post {
      border-left: 4px solid #dc2626;
      background: #fef2f2;
    }
  }

  .post-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .post-author-info {
    flex: 1;
    display: flex;
    flex-direction: column;

    .author-name {
      font-weight: 500;
      font-size: 14px;
      color: $text-primary;
    }

    .post-time {
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .post-tags {
    display: flex;
    gap: 8px;
  }

  .post-title {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  .post-content {
    margin: 0 0 16px;
    color: $text-secondary;
    font-size: 14px;
    line-height: 1.6;
  }

  .post-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #ebeef5;
    padding-top: 12px;
  }

  .post-stats {
    display: flex;
    gap: 20px;
    color: $text-secondary;
    font-size: 13px;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .post-actions {
    .el-button {
      font-size: 13px;
    }
  }

  .empty-state {
    padding: 80px 0;
    text-align: center;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }
}
</style>
