<template>
  <div class="admin-settings">
    <div class="page-header">
      <h2>基础配置</h2>
    </div>

    <el-card>
      <el-form :model="form" label-width="200px" style="max-width: 700px">
        <el-form-item label="网站名称">
          <el-input v-model="form.siteName" />
        </el-form-item>
        <el-form-item label="网站描述">
          <el-input v-model="form.siteDescription" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="允许注册">
          <el-switch v-model="form.allowRegistration" />
        </el-form-item>
        <el-form-item label="最大上传文件大小 (MB)">
          <el-input-number v-model="form.maxUploadSize" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="会话超时时间 (小时)">
          <el-input-number v-model="form.sessionTimeout" :min="1" :max="168" />
        </el-form-item>
        <el-form-item label="启用邮箱验证">
          <el-switch v-model="form.enableEmailVerification" />
        </el-form-item>
        <el-form-item label="维护模式">
          <el-switch v-model="form.maintenanceMode" />
          <span style="margin-left: 10px; color: #e6a23c; font-size: 12px">开启后普通用户将无法访问系统</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSettings">保存配置</el-button>
          <el-button @click="resetSettings">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/admin'

const form = reactive({
  siteName: '',
  siteDescription: '',
  allowRegistration: true,
  maxUploadSize: 10,
  sessionTimeout: 24,
  enableEmailVerification: false,
  maintenanceMode: false
})

const loadSettings = async () => {
  try {
    const res = await adminApi.getSettings()
    if (res.success && res.data) {
      Object.assign(form, res.data)
    }
  } catch {
    ElMessage.error('获取配置失败')
  }
}

const saveSettings = async () => {
  try {
    await adminApi.updateSettings(form)
    ElMessage.success('配置已保存')
  } catch {
    ElMessage.error('保存失败')
  }
}

const resetSettings = () => {
  loadSettings()
}

onMounted(loadSettings)
</script>

<style scoped>
.admin-settings { padding: 20px; }
.page-header { margin-bottom: 20px; }
</style>
