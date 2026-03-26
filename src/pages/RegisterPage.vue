<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { api, setUser } = useAuth()
const toast = useToast()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const inviteCode = ref('')
const loading = ref(false)
const error = ref('')

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('invite')
  if (code) inviteCode.value = code
})

async function handleRegister() {
  error.value = ''
  if (!username.value.trim() || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  if (username.value.length < 3) {
    error.value = '用户名至少3个字符'
    return
  }
  if (password.value.length < 6) {
    error.value = '密码至少6位'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次密码不一致'
    return
  }

  loading.value = true
  try {
    // 注册
    const res = await api.post('/auth/register', {
      username: username.value.trim(),
      password: password.value
    })

    if (res.data.success) {
      setUser(res.data.user, res.data.token)

      // 如果有邀请码，claim
      if (inviteCode.value) {
        try {
          const claimRes = await api.post('/invite/claim', { inviteCode: inviteCode.value })
          if (claimRes.data.success) {
            toast.success(`🎉 注册成功！🎁 邀请奖励 +${claimRes.data.reward} 积分（你 +${claimRes.data.rewardForInvitee ?? 0}）`)
          }
        } catch {
          // 邀请码无效静默忽略
        }
      } else {
        toast.success('注册成功！')
      }

      router.push('/')
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Logo / 标题 -->
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">🐾</div>
        <h1 class="text-2xl font-black text-amber-800">班级宠物</h1>
        <p class="text-sm text-amber-600 mt-1">用宠物陪伴孩子成长</p>
      </div>

      <!-- 邀请提示 -->
      <div v-if="inviteCode" class="bg-amber-100 border border-amber-300 rounded-xl p-3 mb-4 text-center">
        <div class="text-sm text-amber-700">
          🎁 使用邀请码 <strong>{{ inviteCode }}</strong> 注册<br/>
          <span class="text-xs text-amber-600">注册成功后双方各得 10 积分</span>
        </div>
      </div>

      <!-- 注册表单 -->
      <div class="bg-white rounded-2xl shadow-xl p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">注册账号</h2>

        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-500 mb-1 block">用户名</label>
            <input
              v-model="username"
              type="text"
              placeholder="3-20个字符"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
              :disabled="loading"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">密码</label>
            <input
              v-model="password"
              type="password"
              placeholder="至少6位"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
              :disabled="loading"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">确认密码</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
              :disabled="loading"
            />
          </div>
        </div>

        <div v-if="error" class="mt-3 text-sm text-red-500 text-center">{{ error }}</div>

        <button
          class="w-full mt-4 py-3 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-900 font-bold rounded-xl transition-colors disabled:opacity-50"
          :disabled="loading"
          @click="handleRegister"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>

        <div class="mt-3 text-center text-xs text-gray-400">
          已有账号？<router-link to="/" class="text-amber-600">返回首页</router-link>
        </div>
      </div>
    </div>
  </div>
</template>
