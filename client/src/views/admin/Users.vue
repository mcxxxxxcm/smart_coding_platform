<template>
  <div class="admin-users">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>
    
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="搜索">
          <el-input v-model="filters.search" placeholder="用户名/邮箱" clearable @keyup.enter="fetchUsers" style="width: 200px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filters.role" placeholder="全部角色" clearable @change="fetchUsers" style="width: 150px">
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchUsers">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'teacher' ? 'warning' : 'primary'" size="small">
              {{ row.role === 'admin' ? '管理员' : row.role === 'teacher' ? '教师' : '学生' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="等级" width="80" />
        <el-table-column prop="points" label="积分" width="80" />
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchUsers"
        @current-change="fetchUsers"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role">
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级">
          <el-input-number v-model="editForm.level" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="经验值">
          <el-input-number v-model="editForm.experience" :min="0" />
        </el-form-item>
        <el-form-item label="积分">
          <el-input-number v-model="editForm.points" :min="0" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.bio" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api/admin'
import type { AdminUser } from '@/api/admin'

const loading = ref(false)
const users = ref<AdminUser[]>([])
const editDialogVisible = ref(false)
const editForm = reactive<Partial<AdminUser>>({})

const filters = reactive({
  search: '',
  role: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await adminApi.getUsers({
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search || undefined,
      role: filters.role || undefined
    })
    if (res.success && res.data) {
      users.value = res.data.users
      pagination.total = res.data.pagination.total
    }
  } catch {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.search = ''
  filters.role = ''
  pagination.page = 1
  fetchUsers()
}

const openEditDialog = (user: AdminUser) => {
  Object.assign(editForm, { ...user })
  editDialogVisible.value = true
}

const saveUser = async () => {
  try {
    await adminApi.updateUser(editForm.id!, {
      role: editForm.role,
      status: editForm.status,
      level: editForm.level,
      experience: editForm.experience,
      points: editForm.points,
      bio: editForm.bio
    })
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    fetchUsers()
  } catch {
    ElMessage.error('更新失败')
  }
}

const deleteUser = async (user: AdminUser) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？`, '确认删除', { type: 'warning' })
    await adminApi.deleteUser(user.id)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch {
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(fetchUsers)
</script>

<style scoped>
.admin-users {
  padding: 20px;
}
.page-header {
  margin-bottom: 20px;
}
.filter-card {
  margin-bottom: 20px;
}
.table-card {
  margin-bottom: 20px;
}
</style>
