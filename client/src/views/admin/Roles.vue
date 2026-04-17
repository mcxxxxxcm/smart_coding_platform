<template>
  <div class="admin-roles">
    <div class="page-header">
      <h2>角色权限管理</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="role-card">
          <template #header>
            <div class="card-header">
              <span>角色列表</span>
              <el-button type="primary" size="small" @click="openAddRoleDialog">新增角色</el-button>
            </div>
          </template>
          <el-table :data="roles" stripe v-loading="loading">
            <el-table-column prop="name" label="角色名称" width="100" />
            <el-table-column prop="description" label="描述" min-width="150" />
            <el-table-column label="权限" min-width="200">
              <template #default="{ row }">
                <el-tag v-for="p in rolePermissions[row.key]" :key="p" size="small" style="margin: 2px">{{ p }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="用户数" width="100" align="center">
              <template #default="{ row }">
                <span style="font-weight: bold; color: #409eff">{{ row.userCount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openEditRoleDialog(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="permission-card">
          <template #header><span>权限说明</span></template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="用户管理">查看所有用户、编辑用户信息、删除用户</el-descriptions-item>
            <el-descriptions-item label="内容管理">审核课程、审核题目、管理社区</el-descriptions-item>
            <el-descriptions-item label="系统设置">修改系统配置、安全设置、数据库维护</el-descriptions-item>
            <el-descriptions-item label="操作日志">查看系统操作日志记录</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="permission-detail-card">
          <template #header><span>权限字典</span></template>
          <div class="permission-list">
            <div class="perm-group" v-for="(group, key) in permissionGroups" :key="key">
              <div class="perm-group-title">{{ group.name }}</div>
              <div class="perm-item" v-for="p in group.items" :key="p.code">
                <el-tag size="small" type="info">{{ p.code }}</el-tag>
                <span class="perm-label">{{ p.label }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="roleDialogVisible" :title="roleForm.key ? '编辑角色' : '新增角色'" width="600px">
      <el-form :model="roleForm" label-width="100px">
        <el-form-item label="角色名称">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="roleForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="权限">
          <el-checkbox-group v-model="roleForm.permissions">
            <div class="perm-checkbox-group">
              <div class="perm-checkbox-row" v-for="(group, key) in permissionGroups" :key="key">
                <div class="perm-checkbox-title">{{ group.name }}：</div>
                <el-checkbox v-for="p in group.items" :key="p.code" :label="p.code">{{ p.label }}</el-checkbox>
              </div>
            </div>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/admin'

const loading = ref(false)

const rolePermissions: Record<string, string[]> = {
  admin: ['用户管理', '内容管理', '系统设置', '操作日志'],
  teacher: ['用户管理', '内容管理'],
  student: ['用户管理'],
}

const permissionGroups = {
  users: {
    name: '用户管理',
    items: [
      { code: 'users:view', label: '查看用户' },
      { code: 'users:edit', label: '编辑用户' },
      { code: 'users:delete', label: '删除用户' },
    ]
  },
  content: {
    name: '内容管理',
    items: [
      { code: 'courses:review', label: '审核课程' },
      { code: 'problems:review', label: '审核题目' },
      { code: 'community:manage', label: '社区管理' },
    ]
  },
  settings: {
    name: '系统设置',
    items: [
      { code: 'settings:view', label: '查看设置' },
      { code: 'settings:edit', label: '编辑设置' },
      { code: 'database:maintain', label: '数据库维护' },
    ]
  },
  logs: {
    name: '操作日志',
    items: [
      { code: 'logs:view', label: '查看日志' },
    ]
  }
}

interface RoleData {
  key: string
  name: string
  description: string
  userCount: number
}

const roles = ref<RoleData[]>([])

const roleDialogVisible = ref(false)
const roleForm = reactive({
  key: '',
  name: '',
  description: '',
  permissions: [] as string[]
})

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await adminApi.getRoles()
    if (res.success && res.data) {
      roles.value = res.data.roles
    }
  } catch {
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const openAddRoleDialog = () => {
  Object.assign(roleForm, { key: '', name: '', description: '', permissions: [] })
  roleDialogVisible.value = true
}

const openEditRoleDialog = (role: RoleData) => {
  Object.assign(roleForm, { ...role })
  roleDialogVisible.value = true
}

const saveRole = () => {
  if (!roleForm.name) {
    ElMessage.warning('请输入角色名称')
    return
  }
  ElMessage.success('保存成功')
  roleDialogVisible.value = false
}

onMounted(fetchRoles)
</script>

<style scoped>
.admin-roles { padding: 20px; }
.page-header { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.role-card { margin-bottom: 20px; }
.permission-card, .permission-detail-card { margin-bottom: 20px; }

.perm-group { margin-bottom: 12px; }
.perm-group-title { font-size: 13px; font-weight: bold; color: #303133; margin-bottom: 6px; }
.perm-item { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.perm-label { font-size: 12px; color: #606266; }

.perm-checkbox-group { display: flex; flex-direction: column; gap: 10px; }
.perm-checkbox-row { display: flex; align-items: center; gap: 8px; }
.perm-checkbox-title { font-size: 13px; font-weight: bold; color: #303133; white-space: nowrap; min-width: 70px; }
</style>
