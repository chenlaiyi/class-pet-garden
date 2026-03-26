<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import QRCode from 'qrcode'

const { api } = useAuth()
const toast = useToast()

const inviteCode = ref('')
const inviteUrl = ref('')
const stats = ref({ total: 0, used: 0, pending: 0, rewardPerInvite: 10 })
const records = ref<Array<{ code: string; used_at: number | null; used_by_username: string | null }>>([])
const loading = ref(false)
const showRecords = ref(false)
const qrDataUrl = ref('')

async function loadInvite() {
  loading.value = true
  try {
    const [codeRes, statsRes, recordsRes] = await Promise.all([
      api.get('/invite/my-code'),
      api.get('/invite/stats'),
      api.get('/invite/records'),
    ])
    inviteCode.value = codeRes.data.code
    inviteUrl.value = codeRes.data.url
    stats.value = statsRes.data
    records.value = recordsRes.data.records

    // 生成二维码
    qrDataUrl.value = await QRCode.toDataURL(inviteUrl.value, {
      width: 160,
      margin: 1,
      color: { dark: '#92400e', light: '#ffffff' }
    })
  } catch {
    // 未登录时不显示
  } finally {
    loading.value = false
  }
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    toast.success('邀请码已复制！')
  } catch {
    toast.error('复制失败，请手动复制')
  }
}

async function share() {
  const text = `我在用「班级宠物」陪孩子成长，快来一起玩！用我的邀请码 ${inviteCode.value} 注册，你我都得10积分🐾\n${inviteUrl.value}`
  if (navigator.share) {
    try {
      await navigator.share({ title: '班级宠物', text })
    } catch {
      copyCode()
    }
  } else {
    copyCode()
  }
}

onMounted(loadInvite)
</script>

<template>
  <div class="invite-card" v-if="inviteCode">
    <div class="invite-header">
      <div class="invite-title">🎁 邀请有礼</div>
      <div class="invite-sub">每邀请1位伙伴注册，双方各得 <strong>10 积分</strong></div>
    </div>

    <!-- 二维码 + 邀请码 -->
    <div class="invite-body">
      <div class="qr-wrap">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="邀请二维码" class="qr-img" />
        <div v-else class="qr-placeholder">
          <div class="text-4xl">📱</div>
          <div class="text-xs text-gray-400 mt-1">二维码加载中...</div>
        </div>
        <div class="qr-hint">扫码注册</div>
      </div>

      <div class="code-section">
        <div class="invite-url-label">或复制邀请链接</div>
        <div class="code-box">
          <span class="code-text">{{ inviteUrl }}</span>
        </div>
        <div class="code-row">
          <span class="code-label">邀请码</span>
          <span class="code-value">{{ inviteCode }}</span>
        </div>
        <div class="btn-row">
          <button class="btn-copy" @click="copyCode">复制</button>
          <button class="btn-share" @click="share">分享</button>
        </div>
      </div>
    </div>

    <!-- 统计 -->
    <div class="invite-stats">
      <div class="stat-item">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-label">已发出</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-num text-green-600">{{ stats.used }}</div>
        <div class="stat-label">已注册</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-num text-orange-500">{{ stats.used * 10 }}</div>
        <div class="stat-label">已获积分</div>
      </div>
    </div>

    <!-- 记录 -->
    <div v-if="records.length > 0" class="invite-records">
      <button class="records-toggle" @click="showRecords = !showRecords">
        查看邀请记录
        <span :class="showRecords ? 'rotate-180' : ''">▼</span>
      </button>
      <div v-if="showRecords" class="records-list">
        <div v-for="r in records" :key="r.code" class="record-item">
          <span>{{ r.used_by_username || '待填写' }}</span>
          <span class="record-time">{{ r.used_at ? new Date(r.used_at).toLocaleDateString() : '未注册' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invite-card {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 2px solid #fbbf24;
  border-radius: 20px;
  padding: 16px;
  margin: 12px 0;
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.15);
}
.invite-header {
  text-align: center;
  margin-bottom: 12px;
}
.invite-title {
  font-size: 18px;
  font-weight: 800;
  color: #92400e;
}
.invite-sub {
  font-size: 12px;
  color: #b45309;
  margin-top: 2px;
}
.invite-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.qr-wrap {
  flex-shrink: 0;
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.qr-img {
  width: 120px;
  height: 120px;
  display: block;
}
.qr-placeholder {
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.qr-hint {
  font-size: 11px;
  color: #92400e;
  margin-top: 4px;
}
.code-section {
  flex: 1;
  min-width: 0;
}
.invite-url-label {
  font-size: 11px;
  color: #92400e;
  margin-bottom: 4px;
}
.code-box {
  background: white;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 11px;
  color: #78350f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.code-text {
  word-break: break-all;
}
.code-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
}
.code-label {
  font-size: 11px;
  color: #b45309;
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
}
.code-value {
  font-size: 15px;
  font-weight: 800;
  color: #92400e;
  font-family: monospace;
  letter-spacing: 2px;
}
.btn-row {
  display: flex;
  gap: 8px;
}
.btn-copy, .btn-share {
  flex: 1;
  padding: 7px 0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-copy {
  background: #f59e0b;
  color: white;
}
.btn-copy:active { background: #d97706; }
.btn-share {
  background: #fff;
  color: #92400e;
  border: 1.5px solid #fbbf24;
}
.btn-share:active { background: #fef3c7; }
.invite-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-top: 12px;
  background: white;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-num {
  font-size: 20px;
  font-weight: 800;
  color: #92400e;
}
.stat-label {
  font-size: 11px;
  color: #b45309;
  margin-top: 1px;
}
.stat-divider {
  width: 1px;
  height: 28px;
  background: #fbbf24;
  opacity: 0.4;
}
.invite-records {
  margin-top: 10px;
}
.records-toggle {
  width: 100%;
  background: none;
  border: none;
  font-size: 12px;
  color: #92400e;
  cursor: pointer;
  text-align: center;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.records-toggle span {
  font-size: 10px;
  transition: transform 0.2s;
  display: inline-block;
}
.records-list {
  margin-top: 6px;
}
.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  font-size: 12px;
  color: #78350f;
  border-radius: 6px;
}
.record-item:nth-child(odd) { background: rgba(255,255,255,0.5); }
.record-time {
  font-size: 11px;
  color: #b45309;
}
</style>
