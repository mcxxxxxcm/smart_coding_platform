<template>
  <div class="admin-security">
    <div class="page-header">
      <h2>安全设置</h2>
    </div>

    <el-card class="section-card">
      <template #header><span>密码策略</span></template>
      <el-form :model="form" label-width="200px" style="max-width: 700px">
        <el-form-item label="密码最小长度">
          <el-input-number v-model="form.passwordMinLength" :min="6" :max="20" />
        </el-form-item>
        <el-form-item label="要求特殊字符">
          <el-switch v-model="form.passwordRequireSpecialChar" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card">
      <template #header><span>登录安全</span></template>
      <el-form :model="form" label-width="200px" style="max-width: 700px">
        <el-form-item label="最大登录尝试次数">
          <el-input-number v-model="form.loginAttemptLimit" :min="3" :max="20" />
        </el-form-item>
        <el-form-item label="锁定时长 (分钟)">
          <el-input-number v-model="form.lockoutDuration" :min="5" :max="120" />
        </el-form-item>
        <el-form-item label="启用双因素认证">
          <el-switch v-model="form.enableTwoFactor" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card">
      <template #header><span>会话安全</span></template>
      <el-form :model="form" label-width="200px" style="max-width: 700px">
        <el-form-item label="会话最大有效期 (秒)">
          <el-input-number v-model="form.sessionMaxAge" :min="3600" :max="604800" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card">
      <template #header><span>IP 白名单</span></template>
      <el-form :model="form" label-width="200px" style="max-width: 700px">
        <el-form-item label="启用 IP 白名单">
          <el-switch v-model="form.enableIpWhitelist" />
        </el-form-item>
        <el-form-item label="允许的 IP 范围">
          <el-tag v-for="(ip, idx) in form.allowedIpRanges" :key="idx" closable @close="removeIp(idx)" style="margin: 4px">
            {{ ip }}
          </el-tag>
          <el-input v-model="newIp" placeholder="输入 IP 地址后回车添加" size="small" style="width: 200px; margin-left: 8px" @keyup.enter="addIp" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-button type="primary" @click="saveSettings">保存安全设置</el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/admin'

const form = reactive({
  enableTwoFactor: false,
  passwordMinLength: 6,
  passwordRequireSpecialChar: false,
  loginAttemptLimit: 5,
  lockoutDuration: 30,
  sessionMaxAge: 86400,
  enableIpWhitelist: false,
  allowedIpRanges: [] as string[]
})

const newIp = ref('')

const addIp = () => {
  if (newIp.value.trim()) {
    form.allowedIpRanges.push(newIp.value.trim())
    newIp.value = ''
  }
}

const removeIp = (idx: number) => {
  form.allowedIpRanges.splice(idx, 1)
}

const loadSettings = async () => {
  try {
    const res = await adminApi.getSecuritySettings()
    if (res.success && res.data) {
      Object.assign(form, res.data)
    }
  } catch {
    ElMessage.error('获取安全设置失败')
  }
}

const saveSettings = async () => {
  try {
    await adminApi.updateSecuritySettings(form)
    ElMessage.success('安全设置已保存')
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.admin-security { padding: 20px; }
.page-header { margin-bottom: 20px; }
.section-card { margin-bottom: 20px; }
</style>
