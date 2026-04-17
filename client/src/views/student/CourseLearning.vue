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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'
import { ElMessage, ElEmpty } from 'element-plus'
import { courseApi } from '@/api/course'
import { useUserStore } from '@/stores/user'
import type { Course, Chapter, Lesson } from '@/types'

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

// 示例视频 URL（使用公开的示例视频）
const sampleVideos = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://www.w3schools.com/html/movie.mp4'
]

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const loadCourse = async () => {
  try {
    const res = await courseApi.getCourseById(courseId.value)
    console.log('课程详情响应:', res)
    if (res.success && res.data) {
      course.value = res.data
      
      // 处理章节数据
      if (res.data.chapters && res.data.chapters.length > 0) {
        courseChapters.value = res.data.chapters
        console.log('课程章节:', courseChapters.value)
      } else {
        console.log('没有章节数据，使用示例数据')
        courseChapters.value = generateSampleChapters()
      }
      
      courseGoals.value = res.data.goals || ['掌握基础知识点', '完成实践练习', '提升编程能力']
      
      // 检查是否已报名（同时检查前端状态）
      const frontEndEnrolled = userStore.isEnrolled(courseId.value)
      const backEndEnrolled = res.data.isEnrolled
      
      console.log('报名状态检查:', { frontEndEnrolled, backEndEnrolled })
      
      if (!frontEndEnrolled && !backEndEnrolled) {
        ElMessage.warning('请先报名课程')
        return
      }
      
      // 如果前端显示已报名但后端未报名，更新后端状态
      if (frontEndEnrolled && !backEndEnrolled) {
        console.log('前端显示已报名但后端未报名，尝试同步状态...')
        try {
          await courseApi.enrollCourse(courseId.value)
          console.log('状态同步成功')
        } catch (error) {
          console.error('状态同步失败:', error)
        }
      }
      
      // 检查是否指定了要播放的课时
      const lessonId = parseInt(route.query.lesson as string)
      if (lessonId) {
        // 查找指定的课时
        const targetLesson = courseChapters.value.flatMap(c => c.lessons || []).find(l => l.id === lessonId)
        if (targetLesson) {
          playLesson(targetLesson)
          return
        }
      }
      
      // 自动播放第一个视频
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
  
  // 检查视频URL是否存在
  if (lesson.video_url) {
    currentVideoUrl.value = lesson.video_url
  } else {
    // 使用示例视频
    currentVideoUrl.value = sampleVideos[0]
    console.log('使用示例视频:', currentVideoUrl.value)
  }
  
  if (videoPlayer.value) {
    videoPlayer.value.load()
    
    // 先设置为静音，绕过浏览器自动播放限制
    videoPlayer.value.muted = true
    
    videoPlayer.value.play().then(() => {
      // 播放成功后，取消静音
      videoPlayer.value!.muted = false
      isPlaying.value = true
      console.log('视频播放成功')
    }).catch(err => {
      console.error('播放失败:', err)
      // 播放失败时，不显示错误提示，因为视频可能需要手动点击播放
      // ElMessage.warning('视频播放失败，请检查网络连接')
    })
  }
  
  // 展开当前章节
  const chapter = courseChapters.value.find(c => c.lessons?.some(l => l.id === lesson.id))
  if (chapter) {
    activeChapters.value = chapter.id
  }
}

const handleTimeUpdate = () => {
  if (videoPlayer.value) {
    // 可以在这里记录学习进度
    const progress = (videoPlayer.value.currentTime / videoPlayer.value.duration) * 100
    console.log('播放进度:', progress)
  }
}

const handleVideoEnded = () => {
  isPlaying.value = false
  // 自动播放下一集
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
    border-radius: 8px;
    overflow: hidden;
    
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
      padding: 20px;
      background: #fff;
      
      .video-title {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: $text-primary;
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
      border-radius: 8px;
      padding: 20px;
      
      :deep(.el-tabs__header) {
        margin-bottom: 20px;
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
            background: #f5f7fa;
          }
          
          &.active {
            background: #e0e7ff;
            
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
</style>