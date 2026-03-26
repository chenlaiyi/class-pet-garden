<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useNfcWrite } from '@/composables/useNfcWrite'

const props = defineProps<{
  matchId: string; inviteCode: string; zoneName: string
  entryCost: number; winReward: number
  p1Pet: any; p2Pet: any; myPet: any; isP1: boolean
}>()

const emit = defineEmits<{ battleStart: []; back: []; 'both-joined': [] }>()

const { api } = useAuth()
const { isSupported: nfcSupported, isWriting: nfcWriting, writePetCode } = useNfcWrite()

// 状态
const p1Ready = ref(props.isP1 ? false : !!props.p1Pet)
const p2Ready = ref(props.isP1 ? !!props.p2Pet : false)
const hasOpponent = ref(!!props.p2Pet)
const isInGame = ref(false)
const polling = ref<ReturnType<typeof setInterval> | null>(null)
const myReady = ref(false)

const bothReady = computed(() => p1Ready.value && p2Ready.value && hasOpponent.value)

// 宠物 emoji
const EMOJI_MAP: Record<string, string> = {
  shiba: '🐕', corgi: '🐶', golden: '🦮', bichon: '🐩',
  'orange-cat': '🐱', ragdoll: '🐱', bunny: '🐰', hamster: '🐹',
  duckling: '🦆', alpaca: '🦙', unicorn: '🦄', 'baby-dragon': '🐉',
  husky: '🐺', 'west-highland': '🐕', samoyed: '🐕',
}
function petEmoji(tid: string) { return EMOJI_MAP[tid] || '🐾' }

// QR Code URL：编码入场链接
const joinUrl = computed(() => `https://pet.tapgo.cn/join/${props.inviteCode}`)
const qrCodeUrl = computed(() =>
  `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(joinUrl.value)}`
)

// NFC 写入结果
const nfcResult = ref<{ success: boolean; message: string } | null>(null)

async function handleNfcWrite() {
  nfcResult.value = null
  // 写入入场链接，而非宠物码
  const result = await writePetCode(`join/${props.inviteCode}`)
  nfcResult.value = result
}

// 轮询房间状态
async function pollStatus() {
  try {
    const res = await api.get(`/arena/match/${props.matchId}`)
    const d = res.data
    const wasWaiting = !hasOpponent.value
    hasOpponent.value = d.hasOpponent
    p1Ready.value = d.p1Ready
    p2Ready.value = d.p2Ready
    // 对手已入场 → 跳转到双方准备确认页
    if (wasWaiting && hasOpponent.value) {
      stopPolling()
      emit('both-joined')
      return
    }
    if (d.status === 'playing' && d.bothReady) {
      isInGame.value = true
      stopPolling()
      emit('battleStart')
    }
  } catch (e) {}
}

function startPolling() { polling.value = setInterval(pollStatus, 1500) }
function stopPolling() { if (polling.value) { clearInterval(polling.value); polling.value = null } }

async function toggleReady() {
  if (myReady.value) {
    try {
      await api.post('/arena/match/unready', { matchId: props.matchId })
      myReady.value = false
      if (props.isP1) p1Ready.value = false
      else p2Ready.value = false
      startPolling()
    } catch (e) {}
  } else {
    try {
      const res = await api.post('/arena/match/ready', { matchId: props.matchId })
      myReady.value = true
      if (props.isP1) p1Ready.value = true
      else p2Ready.value = true
      if (res.data.canStart) {
        isInGame.value = true
        stopPolling()
        setTimeout(() => emit('battleStart'), 300)
      } else {
        startPolling()
      }
    } catch (e) {}
  }
}

async function leaveRoom() {
  try { await api.post('/arena/match/leave', { matchId: props.matchId }) } catch (e) {}
  emit('back')
}

onMounted(() => startPolling())
onUnmounted(() => stopPolling())

const inviteDisplay = computed(() =>
  props.inviteCode ? props.inviteCode.replace(/(.{3})/g, '$1 ').trim() : ''
)
</script>

<template>
  <div class="max-w-lg mx-auto space-y-5">

    <!-- 等待区标题 -->
    <div class="text-center">
      <div class="text-4xl mb-2">{{ isInGame ? '🎮' : '⏳' }}</div>
      <h2 class="text-2xl font-black text-gray-900">
        {{ !hasOpponent ? '等待对手加入...' : !bothReady ? '双方确认准备' : '即将开战！' }}
      </h2>
      <p class="text-gray-400 text-sm mt-1" v-if="!hasOpponent">让对手扫描下方宠物身份码入场</p>
    </div>

    <!-- 双方宠物信息预览 -->
    <div class="flex items-center justify-center gap-4">
      <!-- P1 宠物 -->
      <div class="flex flex-col items-center">
        <div class="w-16 h-16 rounded-2xl overflow-hidden bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
          <span class="text-4xl">{{ petEmoji(p1Pet?.templateId || 'shiba') }}</span>
        </div>
        <div class="text-xs font-bold text-blue-600 mt-1">P1</div>
        <div class="text-xs text-gray-500 truncate max-w-[5rem] text-center">{{ p1Pet?.displayName || '???' }}</div>
        <div v-if="p1Ready" class="text-green-500 text-sm">✅</div>
        <div v-else class="text-gray-300 text-sm">⏳</div>
      </div>

      <!-- VS -->
      <div class="flex flex-col items-center text-gray-300">
        <div class="text-2xl font-black">⚔️</div>
      </div>

      <!-- P2 宠物 -->
      <div class="flex flex-col items-center">
        <div class="w-16 h-16 rounded-2xl overflow-hidden bg-orange-50 border-2 border-orange-200 flex items-center justify-center">
          <span v-if="hasOpponent && p2Pet" class="text-4xl">{{ petEmoji(p2Pet?.templateId || 'corgi') }}</span>
          <span v-else class="text-2xl">❓</span>
        </div>
        <div class="text-xs font-bold text-orange-600 mt-1">P2</div>
        <div class="text-xs text-gray-500 truncate max-w-[5rem] text-center">
          {{ hasOpponent && p2Pet ? p2Pet?.displayName : '等待入场' }}
        </div>
        <div v-if="hasOpponent && p2Ready" class="text-green-500 text-sm">✅</div>
        <div v-else class="text-gray-300 text-sm">⏳</div>
      </div>
    </div>

    <!-- P1 专属：宠物身份入场码 + NFC -->
    <div v-if="isP1 && !hasOpponent" class="space-y-4">

      <!-- 身份入场二维码 -->
      <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-5 border-2 border-blue-100 flex flex-col items-center">
        <p class="text-xs text-blue-500 font-bold uppercase tracking-wider mb-2">扫描宠物身份码入场</p>
        <img :src="qrCodeUrl" alt="入场二维码" class="w-48 h-48 rounded-2xl bg-white shadow p-2" />
        <div class="mt-2 text-center">
          <p class="text-xs text-gray-400">微信 / 支付宝 扫一扫</p>
          <p class="text-xs text-gray-400 mt-0.5">或输入邀请码</p>
        </div>
      </div>

      <!-- 邀请码数字 -->
      <div class="bg-white rounded-2xl p-4 border border-gray-100 text-center">
        <p class="text-xs text-gray-400 mb-1">邀请码</p>
        <div class="text-3xl font-mono font-black tracking-widest text-blue-600">{{ inviteDisplay }}</div>
      </div>

      <!-- NFC 写入 -->
      <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-bold text-purple-700">📲 NFC · 碰一碰入场</div>
            <div class="text-xs text-purple-400 mt-0.5">将入场链接写入 NFC 贴纸，碰触即打开对战</div>
          </div>
          <button
            @click="handleNfcWrite"
            :disabled="!nfcSupported() || nfcWriting"
            class="shrink-0 ml-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold disabled:opacity-50"
          >
            {{ nfcWriting ? '写入中…' : '写入NFC' }}
          </button>
        </div>
        <div v-if="!nfcSupported()" class="text-xs text-amber-600 mt-2 bg-amber-50 rounded-xl px-3 py-1.5">
          ⚠️ Safari iOS 18+ / Chrome 安卓可用，其他浏览器暂不支持
        </div>
        <div v-if="nfcResult" class="mt-2 text-xs rounded-xl px-3 py-1.5"
          :class="nfcResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
          {{ nfcResult.message }}
        </div>
      </div>
    </div>

    <!-- P2 已入场：同样显示二维码入口（P2 可以截图给其他人看） -->
    <div v-if="!isP1" class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100 text-center">
      <p class="text-xs text-blue-500 font-bold mb-1">当前对战邀请码</p>
      <div class="text-2xl font-mono font-black tracking-widest text-blue-600">{{ inviteDisplay }}</div>
    </div>

    <!-- P2 还在等待的情况 -->
    <div v-if="isP1 && !hasOpponent" class="text-center text-sm text-gray-400">
      <span class="animate-pulse">⏳</span> 等待对手扫码入场...
    </div>

    <!-- 规则提示 -->
    <div class="bg-gray-50 rounded-2xl px-5 py-3 border border-gray-100 text-xs text-gray-400 space-y-1">
      <div>🎯 消除2行以上给对手增加干扰行</div>
      <div>⏱️ 先被堆满者为负</div>
      <div>📉 入场 -5 积分，胜 +10，负/平不返还</div>
    </div>

    <!-- 按钮区 -->
    <div class="flex gap-3">
      <button
        v-if="hasOpponent && ((isP1 && !p1Ready) || (!isP1 && !p2Ready))"
        @click="toggleReady"
        class="flex-1 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black text-lg shadow-lg hover:scale-[1.02] transition-transform"
      >
        ✅ 准备好了！
      </button>
      <button
        v-else-if="myReady"
        @click="toggleReady"
        class="flex-1 py-4 rounded-2xl bg-gray-200 text-gray-600 font-bold text-lg"
      >
        取消准备
      </button>
      <div v-else-if="!hasOpponent && isP1" class="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-400 font-medium text-center text-sm flex items-center justify-center gap-2">
        <span class="animate-pulse">⏳</span> 等待对手加入...
      </div>
      <button
        v-if="bothReady && !isInGame"
        class="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-lg animate-pulse shadow-lg"
      >
        🎮 双方就绪，即将开战！
      </button>

      <button @click="leaveRoom" class="px-6 py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold">退出</button>
    </div>

    <div v-if="hasOpponent && !bothReady && myReady" class="text-center text-sm text-gray-400">
      等待对手准备中...
    </div>
  </div>
</template>
