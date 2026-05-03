<template>
  <div class="course-learning-page">
    <div class="video-section">
      <div class="video-player">
        <video 
          ref="videoPlayer" 
          :src="currentVideoUrl" 
          controls 
          @timeupdate="handleTimeUpdate"
          @ended="handleVideoEnded"
          class="video-element"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
      <div class="video-info">
        <h1 class="video-title">{{ currentLesson?.title || '选择课程章节' }}</h1>
        <div class="video-meta">
          <span class="lesson-count">第{{ currentLesson?.order || 1 }}章</span>
          <span class="duration">{{ formatDuration(currentLesson?.duration || 0) }}</span>
        </div>
      </div>
    </div>

    <div class="content-section">
      <el-tabs v-model="activeTab" class="content-tabs">
        <el-tab-pane label="课程目录" name="chapters">
          <div class="chapter-list">
            <el-collapse v-model="activeChapters" accordion>
              <el-collapse-item 
                v-for="(chapter, index) in courseChapters" 
                :key="chapter.id" 
                :name="chapter.id"
              >
                <template #title>
                  <div class="chapter-title">
                    <span class="chapter-name">{{ chapter.title }}</span>
                    <span class="lesson-count">{{ chapter.lessons?.length || 0 }}课时</span>
                  </div>
                </template>
                <div class="lesson-list">
                  <div 
                    v-for="lesson in chapter.lessons" 
                    :key="lesson.id"
                    :class="['lesson-item', { active: currentLesson?.id === lesson.id }]"
                    @click="playLesson(lesson)"
                  >
                    <div class="lesson-info">
                      <el-icon class="play-icon" v-if="currentLesson?.id === lesson.id && isPlaying">
                        <VideoPause />
                      </el-icon>
                      <el-icon class="play-icon" v-else>
                        <VideoPlay />
                      </el-icon>
                      <span class="lesson-title">{{ lesson.title }}</span>
                      <el-tag v-if="lesson.is_free" size="small" type="success" effect="plain">免费</el-tag>
                    </div>
                    <div class="lesson-duration">{{ formatDuration(lesson.duration || 0) }}</div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
            
            <div v-if="courseChapters.length === 0" class="empty-chapters">
              <el-empty description="暂无课程目录" />
              <el-button type="primary" @click="loadCourse">刷新</el-button>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane name="comments">
          <template #label>
            <span>评论区 <el-badge v-if="commentCount > 0" :value="commentCount" :max="99" class="comment-badge" /></span>
          </template>
          <div class="comments-section" v-if="currentLesson">
            <div class="comment-input-area">
              <el-input
                v-model="newComment"
                type="textarea"
                :rows="3"
                :placeholder="`发表评论... 输入 @AI助手 可召唤AI回答问题`"
                @input="handleCommentInput"
              />
              <div class="comment-input-footer">
                <div class="ai-hint" v-if="showAiHint">
                  <el-icon><MagicStick /></el-icon>
                  <span>检测到 @AI助手，提交后AI将自动回复</span>
                </div>
                <el-button type="primary" size="small" @click="submitComment" :loading="submitting" :disabled="!newComment.trim()">
                  发表评论
                </el-button>
              </div>
            </div>

            <div class="comments-list" v-loading="loadingComments">
              <div
                v-for="comment in topLevelComments"
                :key="comment.id"
                class="comment-item"
              >
                <el-avatar :size="36" :src="comment.author_avatar || undefined">
                  {{ comment.is_ai_reply ? 'AI' : (comment.author_name ? comment.author_name.charAt(0) : '?') }}
                </el-avatar>
                <div class="comment-body-wrapper">
                  <div class="comment-header">
                    <span class="author" :class="{ 'ai-author': comment.is_ai_reply }">
                      {{ comment.is_ai_reply ? 'AI助手' : (comment.author_name || '未知') }}
                    </span>
                    <el-tag v-if="comment.is_ai_reply" size="small" type="success" effect="plain">AI</el-tag>
                    <span class="time">{{ formatTime(comment.created_at) }}</span>
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
                    <span @click="openReplyDialog(comment)" class="action">
                      <el-icon :size="16"><ChatDotRound /></el-icon>
                      回复
                    </span>
                  </div>

                  <div v-if="getReplies(comment.id).length > 0" class="replies-list">
                    <div
                      v-for="reply in getReplies(comment.id)"
                      :key="reply.id"
                      class="reply-item"
                    >
                      <el-avatar :size="28" :src="reply.author_avatar || undefined">
                        {{ reply.is_ai_reply ? 'AI' : (reply.author_name ? reply.author_name.charAt(0) : '?') }}
                      </el-avatar>
                      <div class="reply-body-wrapper">
                        <div class="reply-header">
                          <span class="author" :class="{ 'ai-author': reply.is_ai_reply }">
                            {{ reply.is_ai_reply ? 'AI助手' : (reply.author_name || '未知') }}
                          </span>
                          <el-tag v-if="reply.is_ai_reply" size="small" type="success" effect="plain">AI</el-tag>
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="!loadingComments && lessonComments.length === 0" class="empty-comments">
                <el-empty description="暂无评论，快来发表第一条评论吧" />
              </div>

              <div v-if="aiWaitingCommentId" class="ai-thinking-hint">
                <el-icon class="thinking-icon"><Loading /></el-icon>
                <span>AI助手正在思考中，请稍候...</span>
              </div>
            </div>
          </div>
          <div v-else class="no-lesson-hint">
            <el-empty description="请先选择一个课时" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="课程简介" name="intro">
          <div class="course-intro">
            <h3>课程介绍</h3>
            <p>{{ course?.description || '暂无介绍' }}</p>
            <h3>学习目标</h3>
            <ul>
              <li v-for="(goal, index) in courseGoals" :key="index">{{ goal }}</li>
            </ul>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showReplyDialog" title="回复评论" width="500px">
      <div class="reply-hint">
        回复 <strong>{{ replyTarget?.is_ai_reply ? 'AI助手' : (replyTarget?.author_name || '未知') }}</strong>：
      </div>
      <el-input
        v-model="replyContent"
        type="textarea"
        :rows="3"
        :placeholder="`输入 @AI助手 可召唤AI回答...`"
      />
      <template #footer>
        <el-button @click="showReplyDialog = false; replyContent = ''">取消</el-button>
        <el-button type="primary" @click="submitReply" :loading="submitting" :disabled="!replyContent.trim()">回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { VideoPlay, VideoPause, ChatDotRound, MagicStick, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElEmpty } from 'element-plus'
import { courseApi } from '@/api/course'
import { lessonCommentApi, type LessonComment } from '@/api/lesson-comment'
import { useUserStore } from '@/stores/user'
import type { Course, Chapter, Lesson } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const route = useRoute()
const userStore = useUserStore()
const courseId = ref<number>(parseInt(route.params.id as string))

const videoPlayer = ref<HTMLVideoElement | null>(null)
const currentVideoUrl = ref<string>('')
const isPlaying = ref(false)
const activeTab = ref('chapters')
const activeChapters = ref<string | number>('')

const course = ref<Course | null>(null)
const currentLesson = ref<Lesson | null>(null)
const courseChapters = ref<Chapter[]>([])
const courseGoals = ref<string[]>([])

const lessonComments = ref<LessonComment[]>([])
const loadingComments = ref(false)
const newComment = ref('')
const submitting = ref(false)
const showAiHint = ref(false)
const showReplyDialog = ref(false)
const replyContent = ref('')
const replyTarget = ref<LessonComment | null>(null)
const aiWaitingCommentId = ref<number | null>(null)
const aiPollingTimer = ref<ReturnType<typeof setInterval> | null>(null)

const sampleVideos = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://www.w3schools.com/html/movie.mp4'
]

interface CommentWithReplyTo extends LessonComment {
  reply_to_name?: string
}

const commentCount = computed(() => lessonComments.value.length)

const topLevelComments = computed(() => {
  return lessonComments.value.filter(c => !c.parent_id)
})

const getReplies = (parentId: number): CommentWithReplyTo[] => {
  return lessonComments.value
    .filter(c => c.parent_id === parentId)
    .map(reply => {
      const parent = lessonComments.value.find(c => c.id === reply.parent_id)
      return {
        ...reply,
        reply_to_name: parent?.is_ai_reply ? 'AI助手' : parent?.author_name
      }
    })
}

const formatTime = (time: string | undefined | null) => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const handleCommentInput = (val: string) => {
  showAiHint.value = val.includes('@AI助手') || val.includes('@AI')
}

const fetchComments = async () => {
  if (!currentLesson.value) return
  loadingComments.value = true
  try {
    const userId = userStore.user?.id
    const res = await lessonCommentApi.getComments(currentLesson.value.id, { page: 1, limit: 100 })
    lessonComments.value = res.data || []
  } catch (error) {
    console.error('获取评论失败:', error)
    lessonComments.value = []
  } finally {
    loadingComments.value = false
  }
}

const stopAiPolling = () => {
  if (aiPollingTimer.value) {
    clearInterval(aiPollingTimer.value)
    aiPollingTimer.value = null
  }
  aiWaitingCommentId.value = null
}

const startAiPolling = (parentCommentId: number) => {
  stopAiPolling()
  aiWaitingCommentId.value = parentCommentId
  let attempts = 0
  const maxAttempts = 30

  aiPollingTimer.value = setInterval(async () => {
    attempts++
    if (attempts > maxAttempts) {
      stopAiPolling()
      return
    }
    try {
      const res = await lessonCommentApi.getComments(currentLesson.value!.id, { page: 1, limit: 100 })
      const newComments = res.data || []
      const aiReply = newComments.find(
        (c: LessonComment) => c.parent_id === parentCommentId && c.is_ai_reply
      )
      if (aiReply) {
        lessonComments.value = newComments
        stopAiPolling()
      }
    } catch {
      // ignore polling errors
    }
  }, 3000)
}

const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (!currentLesson.value || !newComment.value.trim()) return

  const isAiQuestion = newComment.value.includes('@AI助手') || newComment.value.includes('@AI')
  submitting.value = true
  try {
    const res = await lessonCommentApi.createComment(currentLesson.value.id, {
      content: newComment.value.trim()
    })
    newComment.value = ''
    showAiHint.value = false
    await fetchComments()

    if (isAiQuestion && res.data?.id) {
      ElMessage.success('评论发表成功，AI助手正在思考中...')
      startAiPolling(res.data.id)
    } else {
      ElMessage.success('评论发表成功')
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    ElMessage.error('发表评论失败')
  } finally {
    submitting.value = false
  }
}

const openReplyDialog = (comment: LessonComment) => {
  replyTarget.value = comment
  replyContent.value = ''
  showReplyDialog.value = true
}

const submitReply = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (!currentLesson.value || !replyContent.value.trim() || !replyTarget.value) return

  const isAiQuestion = replyContent.value.includes('@AI助手') || replyContent.value.includes('@AI')
  submitting.value = true
  try {
    const res = await lessonCommentApi.createComment(currentLesson.value.id, {
      content: replyContent.value.trim(),
      parent_id: replyTarget.value.id
    })
    showReplyDialog.value = false
    replyContent.value = ''
    replyTarget.value = null
    await fetchComments()

    if (isAiQuestion && res.data?.id) {
      ElMessage.success('回复成功，AI助手正在思考中...')
      startAiPolling(res.data.id)
    } else {
      ElMessage.success('回复成功')
    }
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败')
  } finally {
    submitting.value = false
  }
}

const likeComment = async (commentId: number) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await lessonCommentApi.likeComment(commentId)
    const comment = lessonComments.value.find(c => c.id === commentId)
    if (comment) {
      comment.is_liked = res.data.liked
      comment.like_count = (comment.like_count || 0) + (res.data.liked ? 1 : -1)
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const loadCourse = async () => {
  try {
    const res = await courseApi.getCourseById(courseId.value)
    if (res.success && res.data) {
      course.value = res.data
      
      if (res.data.chapters && res.data.chapters.length > 0) {
        courseChapters.value = res.data.chapters
      } else {
        courseChapters.value = generateSampleChapters()
      }
      
      courseGoals.value = res.data.goals || ['掌握基础知识点', '完成实践练习', '提升编程能力']
      
      const frontEndEnrolled = userStore.isEnrolled(courseId.value)
      const backEndEnrolled = res.data.isEnrolled
      
      if (!frontEndEnrolled && !backEndEnrolled) {
        ElMessage.warning('请先报名课程')
        return
      }
      
      if (frontEndEnrolled && !backEndEnrolled) {
        try {
          await courseApi.enrollCourse(courseId.value)
        } catch (error) {
          console.error('状态同步失败:', error)
        }
      }
      
      const lessonId = parseInt(route.query.lesson as string)
      if (lessonId) {
        const targetLesson = courseChapters.value.flatMap(c => c.lessons || []).find(l => l.id === lessonId)
        if (targetLesson) {
          playLesson(targetLesson)
          return
        }
      }
      
      if (courseChapters.value[0]?.lessons?.[0]) {
        playLesson(courseChapters.value[0].lessons[0])
      } else {
        ElMessage.warning('该课程暂无视频内容')
      }
    }
  } catch (error) {
    console.error('加载课程失败:', error)
    ElMessage.error('加载课程失败，请刷新重试')
    courseChapters.value = generateSampleChapters()
  }
}

const generateSampleChapters = (): Chapter[] => {
  return [
    {
      id: 1,
      title: '第一章：课程入门',
      lessons: [
        { id: 1, title: '1.1 课程介绍', duration: 180, video_url: sampleVideos[0], is_free: true, order: 1 },
        { id: 2, title: '1.2 环境配置', duration: 240, video_url: sampleVideos[1], is_free: true, order: 2 }
      ],
      order: 1
    },
    {
      id: 2,
      title: '第二章：基础语法',
      lessons: [
        { id: 3, title: '2.1 变量与数据类型', duration: 300, video_url: sampleVideos[0], is_free: false, order: 1 },
        { id: 4, title: '2.2 控制流程', duration: 360, video_url: sampleVideos[1], is_free: false, order: 2 }
      ],
      order: 2
    },
    {
      id: 3,
      title: '第三章：实战练习',
      lessons: [
        { id: 5, title: '3.1 综合案例', duration: 600, video_url: sampleVideos[0], is_free: false, order: 1 }
      ],
      order: 3
    }
  ]
}

const playLesson = (lesson: Lesson) => {
  currentLesson.value = lesson
  
  if (lesson.video_url) {
    currentVideoUrl.value = lesson.video_url
  } else {
    currentVideoUrl.value = sampleVideos[0]
  }
  
  if (videoPlayer.value) {
    videoPlayer.value.load()
    videoPlayer.value.muted = true
    videoPlayer.value.play().then(() => {
      videoPlayer.value!.muted = false
      isPlaying.value = true
    }).catch(err => {
      console.error('播放失败:', err)
    })
  }
  
  const chapter = courseChapters.value.find(c => c.lessons?.some(l => l.id === lesson.id))
  if (chapter) {
    activeChapters.value = chapter.id
  }

  fetchComments()
}

const handleTimeUpdate = () => {
  if (videoPlayer.value) {
    const progress = (videoPlayer.value.currentTime / videoPlayer.value.duration) * 100
  }
}

const handleVideoEnded = () => {
  isPlaying.value = false
  autoPlayNext()
}

const autoPlayNext = () => {
  if (!currentLesson.value) return
  
  const allLessons = courseChapters.value.flatMap(c => c.lessons || [])
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson.value?.id)
  
  if (currentIndex < allLessons.length - 1) {
    setTimeout(() => {
      playLesson(allLessons[currentIndex + 1])
    }, 2000)
  }
}

onMounted(() => {
  loadCourse()
})

onUnmounted(() => {
  stopAiPolling()
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.course-learning-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  
  .video-section {
    background: #000;
    border-radius: $radius-lg;
    overflow: hidden;
    box-shadow: $shadow-card;
    
    .video-player {
      width: 100%;
      background: #000;
      
      .video-element {
        width: 100%;
        max-height: 600px;
        display: block;
      }
    }
    
    .video-info {
      padding: 24px;
      background: #fff;
      
      .video-title {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 700;
        color: $text-primary;
        letter-spacing: -0.01em;
      }
      
      .video-meta {
        display: flex;
        gap: 16px;
        font-size: 14px;
        color: $text-secondary;
        
        .lesson-count, .duration {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }
  
  .content-section {
    .content-tabs {
      background: #fff;
      border-radius: $radius-lg;
      padding: 24px;
      box-shadow: $shadow-card;
      border: 1px solid $border-color;
      
      :deep(.el-tabs__header) {
        margin-bottom: 20px;
      }
      
      :deep(.el-tabs__item) {
        font-weight: 600;
        font-size: 0.95rem;
      }
      
      :deep(.el-tabs__active-bar) {
        background-color: $primary-color;
      }
      
      :deep(.el-tabs__item.is-active) {
        color: $primary-color;
      }
      
      :deep(.el-tabs__item:hover) {
        color: $primary-color;
      }
    }
    
    .chapter-list {
      .chapter-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        
        .chapter-name {
          font-weight: 500;
          font-size: 15px;
        }
        
        .lesson-count {
          font-size: 13px;
          color: $text-secondary;
        }
      }
      
      .lesson-list {
        .lesson-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          margin: 4px 0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            background: $primary-light;
          }
          
          &.active {
            background: $primary-light;
            
            .lesson-title {
              color: $primary-color;
              font-weight: 500;
            }
            
            .play-icon {
              color: $primary-color;
            }
          }
          
          .lesson-info {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .play-icon {
              color: $text-secondary;
              font-size: 18px;
            }
            
            .lesson-title {
              font-size: 14px;
              color: $text-primary;
            }
          }
          
          .lesson-duration {
            font-size: 13px;
            color: $text-secondary;
          }
        }
      }
      
      .empty-chapters {
        text-align: center;
        padding: 60px 0;
        
        .el-button {
          margin-top: 20px;
        }
      }
    }
    
    .course-intro {
      h3 {
        margin: 20px 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: $text-primary;
      }
      
      p {
        line-height: 1.8;
        color: $text-secondary;
      }
      
      ul {
        margin: 0;
        padding-left: 20px;
        
        li {
          line-height: 2;
          color: $text-secondary;
        }
      }
    }
  }
}

.comments-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-input-area {
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
  
  .comment-input-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    
    .ai-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      color: $primary-color;
      font-size: 13px;
      font-weight: 500;
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
}

.comment-body-wrapper {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 13px;
  color: $text-secondary;
  
  .author {
    font-weight: 500;
    color: $text-primary;
    
    &.ai-author {
      color: $primary-color;
    }
  }
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  color: $text-primary;
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: $text-secondary;
  
  .action {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s;
    
    &:hover {
      color: $primary-color;
    }
    
    &.liked {
      color: $primary-color;
    }
  }
}

.like-icon {
  flex-shrink: 0;
  color: $text-secondary;
  transition: color 0.2s;
  
  &.active {
    color: $primary-color;
  }
}

.replies-list {
  margin-top: 10px;
  padding-left: 14px;
  border-left: 2px solid $border-color;
}

.reply-item {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  
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
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: $text-secondary;
  
  .author {
    font-weight: 500;
    color: $text-primary;
    
    &.ai-author {
      color: $primary-color;
    }
  }
}

.reply-text {
  font-size: 13px;
  line-height: 1.5;
  color: $text-primary;
  margin-bottom: 4px;
  
  .reply-to {
    color: $primary-color;
    font-weight: 500;
    margin-right: 4px;
  }
}

.reply-actions {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: $text-secondary;
  
  .action {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 3px;
    transition: color 0.2s;
    
    &:hover { color: $primary-color; }
    &.liked { color: $primary-color; }
  }
}

.reply-hint {
  padding: 8px 12px;
  background: $primary-light;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: $text-secondary;
  
  strong {
    color: $primary-color;
  }
}

.empty-comments, .no-lesson-hint {
  padding: 40px 0;
  text-align: center;
}

.ai-thinking-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: $primary-light;
  border-radius: $radius-md;
  color: $primary-color;
  font-size: 14px;
  font-weight: 500;
  margin-top: 12px;
  border: 1px solid $primary-border;
  
  .thinking-icon {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.comment-badge {
  margin-left: 4px;
  
  :deep(.el-badge__content) {
    font-size: 10px;
  }
}
</style>
