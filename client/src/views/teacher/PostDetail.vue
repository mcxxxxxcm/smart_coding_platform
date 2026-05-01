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
            <span class="like-stat" @click="likePost">
              <svg class="like-icon" :class="{ active: isLiked }" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path v-if="isLiked" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                <path v-else d="M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1z"/>
              </svg>
              {{ post?.like_count || 0 }}
            </span>
          </div>
        </div>
        
        <div class="post-actions">
          <el-button :type="isLiked ? 'primary' : 'default'" @click="likePost" :loading="liking">
            {{ isLiked ? '已点赞' : '点赞' }}
          </el-button>
          <el-button @click="openCommentDialog()">
            评论
          </el-button>
        </div>
      </div>
      
      <div class="comments-section" v-if="!loading && post">
        <h3 class="section-title">评论 ({{ totalCommentCount }})</h3>
        
        <div class="comments-list" v-loading="loadingComments">
          <div
            v-for="comment in topLevelComments"
            :key="comment.id"
            class="comment-item"
            :class="{ 'pinned-comment': comment.is_pinned }"
          >
            <el-avatar :size="36" :src="comment.author_avatar || undefined">
              {{ comment.author_name ? comment.author_name.charAt(0) : '?' }}
            </el-avatar>
            <div class="comment-body-wrapper">
              <div class="comment-header">
                <span class="author">{{ comment.author_name || '未知' }}</span>
                <span class="time">{{ formatTime(comment.created_at) }}</span>
                <el-tag v-if="comment.is_pinned" type="danger" size="small">
                  <el-icon><Top /></el-icon> 置顶
                </el-tag>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-actions">
                <span @click="likeComment(comment.id)" class="action" :class="{ liked: comment.is_liked }">
                  <svg class="like-icon" :class="{ active: comment.is_liked }" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path v-if="comment.is_liked" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                    <path v-else d="M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1z"/>
                  </svg>
                  {{ comment.like_count || 0 }}
                </span>
                <span @click="openCommentDialog(comment)" class="action">
                  <el-icon :size="16"><ChatDotRound /></el-icon>
                  回复
                </span>
                <span @click="togglePinComment(comment)" class="action pin-action">
                  <el-icon :size="16"><Top /></el-icon>
                  {{ comment.is_pinned ? '取消置顶' : '置顶' }}
                </span>
              </div>
              
              <div v-if="getReplies(comment.id).length > 0" class="replies-list">
                <div
                  v-for="reply in getReplies(comment.id)"
                  :key="reply.id"
                  class="reply-item"
                >
                  <el-avatar :size="28" :src="reply.author_avatar || undefined">
                    {{ reply.author_name ? reply.author_name.charAt(0) : '?' }}
                  </el-avatar>
                  <div class="reply-body-wrapper">
                    <div class="reply-header">
                      <span class="author">{{ reply.author_name || '未知' }}</span>
                      <span class="time">{{ formatTime(reply.created_at) }}</span>
                    </div>
                    <div class="reply-text">
                      <span v-if="reply.reply_to_name" class="reply-to">@{{ reply.reply_to_name }}</span>
                      {{ reply.content }}
                    </div>
                    <div class="reply-actions">
                      <span @click="likeComment(reply.id)" class="action" :class="{ liked: reply.is_liked }">
                        <svg class="like-icon" :class="{ active: reply.is_liked }" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path v-if="reply.is_liked" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                          <path v-else d="M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1z"/>
                        </svg>
                        {{ reply.like_count || 0 }}
                      </span>
                      <span @click="openCommentDialog(reply, comment)" class="action">
                        <el-icon :size="14"><ChatDotRound /></el-icon>
                        回复
                      </span>
                    </div>
                  </div>
                </div>
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
    
    <el-dialog v-model="showCommentDialog" :title="replyTarget ? '回复评论' : '发表评论'" width="600px">
      <div v-if="replyTarget" class="reply-hint">
        回复 <strong>{{ replyTarget.author_name || '未知' }}</strong>：
      </div>
      <el-form ref="commentFormRef" :model="commentForm" :rules="commentRules">
        <el-form-item prop="content">
          <el-input 
            v-model="commentForm.content" 
            type="textarea" 
            :rows="4" 
            :placeholder="replyTarget ? `回复 ${replyTarget.author_name || '未知'}...` : '请输入评论内容，为学生解答问题'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelComment">取消</el-button>
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
import { View, ChatDotRound, Top } from '@element-plus/icons-vue'
import { communityApi } from '@/api/community'
import type { Post, Comment } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

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
const replyTarget = ref<Comment | null>(null)
const parentComment = ref<Comment | null>(null)
const commentForm = reactive({
  content: '',
  parent_id: undefined as number | undefined
})

const commentRules: FormRules = {
  content: [{ required: true, message: '请输入评论内容', trigger: 'blur' }]
}

const commentPagination = reactive({
  page: 1,
  limit: 50,
  total: 0
})

interface CommentWithReplyTo extends Comment {
  reply_to_name?: string
}

const topLevelComments = computed(() => {
  return comments.value
    .filter(c => !c.parent_id)
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return 0
    })
})

const totalCommentCount = computed(() => comments.value.length)

const getReplies = (parentId: number): CommentWithReplyTo[] => {
  return comments.value
    .filter(c => c.parent_id === parentId)
    .map(reply => {
      const parent = comments.value.find(c => c.id === reply.parent_id)
      return {
        ...reply,
        reply_to_name: parent?.author_name
      }
    })
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

const findCommentById = (id: number): Comment | undefined => {
  return comments.value.find(c => c.id === id)
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
    const comment = findCommentById(commentId)
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

const openCommentDialog = (target?: Comment, parent?: Comment) => {
  if (target) {
    replyTarget.value = target
    if (parent) {
      parentComment.value = parent
      commentForm.parent_id = parent.id
    } else {
      parentComment.value = null
      commentForm.parent_id = target.id
    }
  } else {
    replyTarget.value = null
    parentComment.value = null
    commentForm.parent_id = undefined
  }
  showCommentDialog.value = true
}

const cancelComment = () => {
  showCommentDialog.value = false
  commentForm.content = ''
  commentForm.parent_id = undefined
  replyTarget.value = null
  parentComment.value = null
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
    replyTarget.value = null
    parentComment.value = null
    
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
  
  .like-stat {
    cursor: pointer;
    transition: color 0.2s ease;
    
    &:hover {
      color: $primary-color;
    }
  }
}

.like-icon {
  flex-shrink: 0;
  color: $text-secondary;
  transition: color 0.2s ease;
  
  &.active {
    color: $primary-color;
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
    background: #fef2f2;
    border-left: 3px solid #dc2626;
    padding: 15px;
    margin: -15px;
    border-radius: 6px;
  }
}

.comment-body-wrapper {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 8px;
  color: $text-secondary;
  font-size: 0.9rem;
}

.comment-text {
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
    
    &.liked {
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

.replies-list {
  margin-top: 12px;
  padding-left: 16px;
  border-left: 2px solid $border-color;
}

.reply-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid $border-light;
  }
}

.reply-body-wrapper {
  flex: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
  color: $text-secondary;
  font-size: 0.85rem;
}

.reply-text {
  font-size: 0.9rem;
  line-height: 1.5;
  color: $text-primary;
  margin-bottom: 6px;
  
  .reply-to {
    color: $primary-color;
    font-weight: 500;
    margin-right: 4px;
  }
}

.reply-actions {
  display: flex;
  gap: 16px;
  font-size: 0.8rem;
  color: $text-secondary;
  
  .action {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s ease;
    
    &:hover {
      color: $primary-color;
    }
    
    &.liked {
      color: $primary-color;
    }
  }
}

.reply-hint {
  padding: 10px 14px;
  background: $primary-light;
  border-radius: $radius-sm;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: $text-secondary;
  
  strong {
    color: $primary-color;
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
