<template>
  <div class="teacher-post-detail-page">
    <div class="container">
      <div class="page-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item><router-link to="/teacher/community">社区互动</router-link></el-breadcrumb-item>
          <el-breadcrumb-item>{{ post?.title || '帖子详情' }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      
      <div class="post-content" v-loading="loading">
        <div class="post-header">
          <el-avatar :size="50" :src="post?.author_avatar || undefined">
            {{ post?.author_name ? post.author_name.charAt(0) : '?' }}
          </el-avatar>
          <div class="post-meta">
            <h2 class="post-title">{{ post?.title || '无标题' }}</h2>
            <div class="meta-info">
              <span class="author">{{ post?.author_name || '未知' }}</span>
              <span class="time">{{ post?.created_at ? formatTime(post.created_at) : '' }}</span>
              <span class="category-tag" :class="post?.category || ''">{{ getCategoryLabel(post?.category) }}</span>
            </div>
          </div>
        </div>
        
        <div class="post-body">
          <div class="content">{{ post?.content || '' }}</div>
          <div class="post-stats">
            <span><el-icon><View /></el-icon> {{ post?.view_count || 0 }}</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ post?.comment_count || 0 }}</span>
            <span><el-icon><Star /></el-icon> {{ post?.like_count || 0 }}</span>
          </div>
        </div>
        
        <div class="post-actions">
          <el-button type="primary" @click="likePost" :loading="liking">
            {{ isLiked ? '已点赞' : '点赞' }}
          </el-button>
          <el-button @click="showCommentDialog = true">
            评论
          </el-button>
        </div>
      </div>
      
      <div class="comments-section" v-if="!loading && post">
        <h3 class="section-title">评论 ({{ comments.length }})</h3>
        
        <div class="comments-list" v-loading="loadingComments">
          <div
            v-for="comment in sortedComments"
            :key="comment.id"
            class="comment-item"
            :class="{ 'pinned-comment': comment.is_pinned }"
          >
            <el-avatar :size="36" :src="comment.author_avatar || undefined">
              {{ comment.author_name ? comment.author_name.charAt(0) : '?' }}
            </el-avatar>
            <div class="comment-content">
              <div class="comment-header">
                <span class="author">{{ comment.author_name || '未知' }}</span>
                <span class="time">{{ formatTime(comment.created_at) }}</span>
                <el-tag v-if="comment.is_pinned" type="danger" size="small">
                  <el-icon><Top /></el-icon> 置顶
                </el-tag>
              </div>
              <div class="comment-body">{{ comment.content }}</div>
              <div class="comment-actions">
                <span @click="likeComment(comment.id)" class="action">
                  <el-icon :size="16"><Star /></el-icon>
                  {{ comment.like_count || 0 }}
                </span>
                <span @click="replyToComment(comment)" class="action">
                  <el-icon :size="16"><ChatDotRound /></el-icon>
                  回复
                </span>
                <span @click="togglePinComment(comment)" class="action pin-action">
                  <el-icon :size="16"><Top /></el-icon>
                  {{ comment.is_pinned ? '取消置顶' : '置顶' }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-if="!loadingComments && comments.length === 0" class="empty-state">
            <el-empty description="暂无评论" />
          </div>
        </div>
        
        <div class="pagination" v-if="commentPagination.total > commentPagination.limit">
          <el-pagination
            v-model:current-page="commentPagination.page"
            :page-size="commentPagination.limit"
            :total="commentPagination.total"
            layout="prev, pager, next"
            @current-change="fetchComments"
          />
        </div>
      </div>
    </div>
    
    <!-- 评论对话框 -->
    <el-dialog v-model="showCommentDialog" title="发表评论" width="600px">
      <el-form ref="commentFormRef" :model="commentForm" :rules="commentRules">
        <el-form-item prop="content">
          <el-input 
            v-model="commentForm.content" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入评论内容，为学生解答问题"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCommentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitComment" :loading="submittingComment">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElEmpty } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { communityApi } from '@/api/community'
import type { Post, Comment } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { View, ChatDotRound, Star, Top } from '@element-plus/icons-vue'

dayjs.extend(relativeTime)

const route = useRoute()
const router = useRouter()

const postId = ref<number>(parseInt(route.params.id as string))
const loading = ref(false)
const loadingComments = ref(false)
const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const isLiked = ref(false)
const liking = ref(false)

const showCommentDialog = ref(false)
const submittingComment = ref(false)
const commentFormRef = ref<FormInstance>()
const commentForm = reactive({
  content: '',
  parent_id: undefined as number | undefined
})

const commentRules: FormRules = {
  content: [{ required: true, message: '请输入评论内容', trigger: 'blur' }]
}

const commentPagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const sortedComments = computed(() => {
  return [...comments.value].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return 0
  })
})

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

const fetchPost = async () => {
  loading.value = true
  try {
    const res = await communityApi.getPostById(postId.value)
    post.value = res.data
    isLiked.value = res.data?.is_liked || false
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    ElMessage.error('获取帖子详情失败')
    router.push('/teacher/community')
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  loadingComments.value = true
  try {
    const res = await communityApi.getComments(postId.value, {
      page: commentPagination.page,
      limit: commentPagination.limit
    })
    
    comments.value = res.data || []
    if (res.pagination) {
      commentPagination.total = res.pagination.total
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    ElMessage.error('获取评论失败')
    comments.value = []
  } finally {
    loadingComments.value = false
  }
}

const likePost = async () => {
  liking.value = true
  try {
    const res = await communityApi.likePost(postId.value)
    isLiked.value = res.data.liked
    if (post.value) {
      post.value.like_count = (post.value.like_count || 0) + (res.data.liked ? 1 : -1)
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('点赞失败')
  } finally {
    liking.value = false
  }
}

const likeComment = async (commentId: number) => {
  try {
    const res = await communityApi.likeComment(commentId)
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.is_liked = res.data.liked
      comment.like_count = (comment.like_count || 0) + (res.data.liked ? 1 : -1)
    }
  } catch (error) {
    console.error('点赞评论失败:', error)
    ElMessage.error('点赞评论失败')
  }
}

const togglePinComment = async (comment: Comment) => {
  try {
    const res = await communityApi.togglePinComment(comment.id)
    if (res.success) {
      comment.is_pinned = res.data.is_pinned
      ElMessage.success(res.data.is_pinned ? '置顶成功' : '取消置顶成功')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const replyToComment = (comment: Comment) => {
  commentForm.parent_id = comment.id
  showCommentDialog.value = true
}

const submitComment = async () => {
  const valid = await commentFormRef.value?.validate()
  if (!valid) return
  
  submittingComment.value = true
  try {
    await communityApi.createComment(
      postId.value,
      commentForm.content,
      commentForm.parent_id
    )
    ElMessage.success('评论成功')
    showCommentDialog.value = false
    
    commentForm.content = ''
    commentForm.parent_id = undefined
    
    commentPagination.page = 1
    await fetchComments()
    
    if (post.value) {
      post.value.comment_count = (post.value.comment_count || 0) + 1
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    ElMessage.error('发表评论失败')
  } finally {
    submittingComment.value = false
  }
}

onMounted(async () => {
  await fetchPost()
  await fetchComments()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.teacher-post-detail-page {
  padding: 0;
  min-height: 100%;
}

.page-header {
  margin-bottom: 30px;
}

.post-content {
  background: white;
  border-radius: $radius-md;
  padding: 30px;
  box-shadow: $shadow-sm;
  margin-bottom: 30px;
}

.post-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid $border-color;
}

.post-meta {
  flex: 1;
}

.post-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: $text-primary;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 15px;
  color: $text-secondary;
  font-size: 0.9rem;
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

.post-body {
  margin-bottom: 30px;
}

.content {
  font-size: 1rem;
  line-height: 1.8;
  color: $text-primary;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.post-stats {
  display: flex;
  gap: 20px;
  color: $text-secondary;
  font-size: 0.9rem;
  padding-top: 20px;
  border-top: 1px solid $border-color;
  
  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.post-actions {
  display: flex;
  gap: 10px;
}

.comments-section {
  background: white;
  border-radius: $radius-md;
  padding: 30px;
  box-shadow: $shadow-sm;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: $text-primary;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.comment-item {
  display: flex;
  gap: 15px;
  padding-bottom: 20px;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  &.pinned-comment {
    background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
    border-left: 3px solid #f56c6c;
    padding: 15px;
    margin: -15px;
    border-radius: 6px;
  }
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
  color: $text-secondary;
  font-size: 0.9rem;
}

.comment-body {
  font-size: 1rem;
  line-height: 1.6;
  color: $text-primary;
  margin-bottom: 10px;
}

.comment-actions {
  display: flex;
  gap: 20px;
  font-size: 0.85rem;
  color: $text-secondary;
  
  .action {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.2s ease;
    
    &:hover {
      color: $primary-color;
    }
    
    &.pin-action {
      color: #e6a23c;
      
      &:hover {
        color: #f56c6c;
      }
    }
  }
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
</style>
