<template>
  <div class="admin-community">
    <div class="page-header">
      <h2>社区管理</h2>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="fetchPosts" style="width: 150px">
            <el-option label="正常" value="published" />
            <el-option label="隐藏" value="hidden" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchPosts">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="posts" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="author_name" label="作者" width="100" />
        <el-table-column prop="comment_count" label="评论数" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
              {{ row.status === 'published' ? '正常' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'published'" type="warning" size="small" @click="moderatePost(row, 'hide')">隐藏</el-button>
            <el-button v-if="row.status === 'hidden'" type="success" size="small" @click="moderatePost(row, 'show')">显示</el-button>
            <el-button type="danger" size="small" @click="moderatePost(row, 'delete')">删除</el-button>
            <el-button type="info" size="small" @click="aiModerate(row)" :loading="moderateMap[row.id]">🛡️ AI审核</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchPosts"
        @current-change="fetchPosts"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="moderateDialogVisible" title="🛡️ AI 内容审核报告" width="500px">
      <div v-if="moderateResult">
        <div class="moderate-result">
          <el-tag :type="moderateResult.is_safe ? 'success' : 'danger'" size="large" effect="dark">
            {{ moderateResult.is_safe ? '✅ 内容安全' : '⚠️ 内容有风险' }}
          </el-tag>
          <el-tag :type="moderateResult.risk_level === 'high' ? 'danger' : moderateResult.risk_level === 'medium' ? 'warning' : 'info'" size="small">
            风险等级: {{ moderateResult.risk_level }}
          </el-tag>
        </div>
        <div v-if="moderateResult.flags?.length" style="margin-top: 12px">
          <h4>标记项</h4>
          <el-tag v-for="f in moderateResult.flags" :key="f" type="warning" size="small" style="margin: 2px">{{ f }}</el-tag>
        </div>
        <div v-if="moderateResult.categories" style="margin-top: 12px">
          <h4>分类检测</h4>
          <div v-for="(v, k) in moderateResult.categories" :key="k" class="category-check">
            <span>{{ getCategoryLabel(k as string) }}</span>
            <el-tag :type="v ? 'danger' : 'success'" size="small">{{ v ? '检测到' : '未检测到' }}</el-tag>
          </div>
        </div>
        <div v-if="moderateResult.suggestion" style="margin-top: 12px">
          <h4>处理建议</h4>
          <p style="font-size: 13px; color: #606266">{{ moderateResult.suggestion }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api/admin'
import type { AdminPost } from '@/api/admin'

const loading = ref(false)
const posts = ref<AdminPost[]>([])
const filters = reactive({ status: '' })
const pagination = reactive({ page: 1, limit: 10, total: 0 })

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await adminApi.getPosts({
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status || undefined
    })
    if (res.success && res.data) {
      posts.value = res.data.posts
      pagination.total = res.data.pagination.total
    }
  } catch {
    ElMessage.error('获取帖子列表失败')
  } finally {
    loading.value = false
  }
}

const moderatePost = async (post: AdminPost, action: string) => {
  try {
    const labels = { delete: '删除', hide: '隐藏', show: '显示' }
    await ElMessageBox.confirm(`确定要${labels[action]}该帖子吗？`, '确认操作', { type: 'warning' })
    await adminApi.moderatePost(post.id, { action })
    ElMessage.success(`${labels[action]}成功`)
    fetchPosts()
  } catch {
  }
}

const formatDate = (d: string) => new Date(d).toLocaleString('zh-CN')

const resetFilters = () => {
  filters.status = ''
  pagination.page = 1
  fetchPosts()
}

onMounted(fetchPosts)
</script>

<style scoped>
.admin-community { padding: 20px; }
.page-header { margin-bottom: 20px; }
.filter-card { margin-bottom: 20px; }
</style>
