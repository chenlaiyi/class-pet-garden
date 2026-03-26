<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  matchId: string
  inviteCode: string
  zoneName: string
  entryCost: number
  winReward: number
  p1Pet: any
  p2Pet: any
  myPet: any
  isP1: boolean
}>()

const emit = defineEmits<{
  'battle-start': []
  back: []
}>()

const { api } = useAuth()

// 准备状态
const p1Ready = ref(props.isP1 ? false : true) // p1 如果不是自己，一进来就视为已确认入场
const p2Ready = ref(!props.isP1) // p2 如果是自己，一进来就视为已确认入场
const myReady = ref(false)
const hasOpponent = ref(true) // 进入 prepare 阶段说明对方已到
const isInGame = ref(false)
const polling = ref<ReturnType<typeof setInterval> | null>(null)

const bothReady = computed(() => p1Ready.value && p2Ready.value)

const EMOJI_MAP: Record<string, string> = {
  shiba: '🐕', corgi: '🐶', golden: '🦮', bichon: '🐩',
  'orange-cat': '🐱', ragdoll: '🐱', bunny: '🐰', hamster: '🐹',
  duckling: '🦆', alpaca: '🦙', unicorn: '🦄', 'baby-dragon': '🐉',
  husky: '🐺', 'west-highland': '🐕', samoyed: '🐕',
}
function petEmoji(tid: string) { return EMOJI_MAP[tid] || '🐾' }

function petBg(tid: string) {
  const map: Record<string, string> = {
    shiba: 'from-amber-50 to-orange-50 border-orange-200',
    corgi: 'from-yellow-50 to-amber-50 border-yellow-200',
    golden: 'from-yellow-100 to-orange-100 border-yellow-300',
    bichon: 'from-pink-50 to-purple-50 border-pink-200',
    'orange-cat': 'from-orange-50 to-red-50 border-orange-200',
    ragdoll: 'from-blue-50 to-indigo-50 border-blue-200',
    bunny: 'from-pink-50 to-rose-50 border-pink-200',
    hamster: 'from-yellow-50 to-amber-50 border-yellow-200',
    duckling: 'from-yellow-100 to-green-50 border-yellow-200',
    alpaca: 'from-purple-50 to-pink-50 border-purple-200',
    unicorn: 'from-purple-100 to-pink-100 border-purple-300',
    'baby-dragon': 'from-green-50 to-teal-50 border-green-200',
    husky: 'from-gray-100 to-blue-50 border-gray-200',
    'west-highland': 'from-gray-50 to-yellow-50 border-gray-200',
    samoyed: 'from-blue-50 to-gray-100 border-blue-200',
  }
  return map[tid] || 'from-gray-50 to-gray-100 border-gray-200'
}

// 轮询对手准备状态
async function pollStatus() {
  try {
    const res = await api.get(`/arena/match/${props.matchId}`)
    const d = res.data
    p1Ready.value = d.p1Ready
    p2Ready.value = d.p2Ready
    if (d.status === 'playing') {
      isInGame.value = true
      stopPolling()
      emit('battle-start')
    }
  } catch {}
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
    } catch {}
  } else {
    try {
      const res = await api.post('/arena/match/ready', { matchId: props.matchId })
      myReady.value = true
      if (props.isP1) p1Ready.value = true
      else p2Ready.value = true
      if (res.data.canStart) {
        isInGame.value = true
        stopPolling()
        setTimeout(() => emit('battle-start'), 500)
      } else {
        startPolling()
      }
    } catch {}
  }
}

async function leaveRoom() {
  try { await api.post('/arena/match/leave', { matchId: props.matchId }) } catch {}
  emit('back')
}

onMounted(() => startPolling())
onUnmounted(() => stopPolling())
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">

    <!-- 标题 -->
    <div class="text-center space-y-1">
      <div class="text-4xl">{{ bothReady ? '⚔️' : '🎮' }}</div>
      <h2 class="text-2xl font-black text-gray-900">
        {{ !bothReady ? '双方确认准备' : '即将开战！' }}
      </h2>
      <p class="text-gray-400 text-sm">
        {{ !bothReady ? '双方宠物已入场，请各自点击下方准备按钮' : '准备就绪，倒计时开始！' }}
      </p>
    </div>

    <!-- 双方宠物信息卡片 -->
    <div class="grid grid-cols-2 gap-4">

      <!-- P1 -->
      <div class="relative rounded-3xl overflow-hidden bg-gradient-to-br p-5 border-2"
        :class="isP1 ? petBg(p1Pet?.templateId || 'shiba') : 'from-gray-100 to-gray-50 border-gray-200'">
        <!-- 标签 -->
        <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-black"
          :class="isP1 ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'">
          {{ isP1 ? '我方 P1' : '对手 P1' }}
        </div>
        <!-- 准备状态角标 -->
        <div class="absolute top-2 right-2 text-2xl">{{ p1Ready ? '✅' : '⏳' }}</div>

        <div class="mt-6 flex flex-col items-center gap-2">
          <div class="w-20 h-20 rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center shadow-sm border border-white/50">
            <span class="text-5xl">{{ petEmoji(p1Pet?.templateId || 'shiba') }}</span>
          </div>
          <div class="font-black text-gray-800 text-base text-center leading-tight">
            {{ p1Pet?.displayName || '???' }}
          </div>
          <div class="text-xs text-gray-400 font-mono">{{ p1Pet?.code || 'P1-???' }}</div>
          <div class="text-xs text-gray-400">Lv.{{ p1Pet?.level || 1 }}</div>
        </div>
      </div>

      <!-- P2 -->
      <div class="relative rounded-3xl overflow-hidden bg-gradient-to-br p-5 border-2"
        :class="!isP1 ? petBg(p2Pet?.templateId || 'corgi') : 'from-gray-100 to-gray-50 border-gray-200'">
        <!-- 标签 -->
        <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-black"
          :class="!isP1 ? 'bg-orange-500 text-white' : 'bg-gray-400 text-white'">
          {{ !isP1 ? '我方 P2' : '对手 P2' }}
        </div>
        <!-- 准备状态角标 -->
        <div class="absolute top-2 right-2 text-2xl">{{ p2Ready ? '✅' : '⏳' }}</div>

        <div class="mt-6 flex flex-col items-center gap-2">
          <div class="w-20 h-20 rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center shadow-sm border border-white/50">
            <span class="text-5xl">{{ petEmoji(p2Pet?.templateId || 'corgi') }}</span>
          </div>
          <div class="font-black text-gray-800 text-base text-center leading-tight">
            {{ p2Pet?.displayName || '???' }}
          </div>
          <div class="text-xs text-gray-400 font-mono">{{ p2Pet?.code || 'P2-???' }}</div>
          <div class="text-xs text-gray-400">Lv.{{ p2Pet?.level || 1 }}</div>
        </div>
      </div>
    </div>

    <!-- VS 大字 -->
    <div class="flex items-center gap-4">
      <div class="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200"></div>
      <div class="text-3xl font-black text-gray-300">⚔️ 方块大战 ⚔️</div>
      <div class="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200"></div>
    </div>

    <!-- 规则提示 -->
    <div class="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 text-sm text-gray-500 space-y-1.5">
      <div class="flex items-center gap-2">
        <span class="text-red-400 font-bold text-base">🎯</span>
        <span>消除 2 行及以上，给对手增加干扰行</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-blue-400 font-bold text-base">⏱</span>
        <span>先被方块堆满顶部者为负</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-orange-400 font-bold text-base">🏆</span>
        <span>入场 <span class="text-red-500 font-bold">-{{ entryCost }}</span> 积分 · 获胜 <span class="text-green-500 font-bold">+{{ winReward }}</span> 积分 · 负/平不返还</span>
      </div>
    </div>

    <!-- 双方准备状态进度 -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 flex-1 justify-end">
        <span class="text-sm font-medium" :class="p1Ready ? 'text-green-600' : 'text-gray-400'">P1 {{ p1Ready ? '已准备' : '等待中' }}</span>
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
          :class="p1Ready ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'">
          {{ p1Ready ? '✓' : '1' }}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="text-xl font-black text-gray-300">VS</div>
      </div>

      <div class="flex items-center gap-2 flex-1">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
          :class="p2Ready ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'">
          {{ p2Ready ? '✓' : '2' }}
        </div>
        <span class="text-sm font-medium" :class="p2Ready ? 'text-orange-600' : 'text-gray-400'">P2 {{ p2Ready ? '已准备' : '等待中' }}</span>
      </div>
    </div>

    <!-- 按钮区 -->
    <div class="flex flex-col gap-3">
      <!-- 自己的准备按钮 -->
      <div v-if="hasOpponent">
        <button
          v-if="!myReady && ((isP1 && !p1Ready) || (!isP1 && !p2Ready))"
          @click="toggleReady"
          class="w-full py-5 rounded-3xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black text-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          ✅ 我准备好了！
        </button>
        <button
          v-else-if="myReady"
          @click="toggleReady"
          class="w-full py-5 rounded-3xl bg-gray-200 text-gray-600 font-bold text-xl"
        >
          取消准备
        </button>
        <div
          v-else-if="bothReady"
          class="w-full py-5 rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-xl flex items-center justify-center gap-3 animate-pulse"
        >
          🎮 双方就绪，即将开战！
        </div>
      </div>

      <!-- 等待提示 -->
      <div v-if="!bothReady && myReady" class="text-center text-sm text-gray-400 py-2">
        等待对手准备中... ⏳
      </div>

      <!-- 退出 -->
      <button
        v-if="!myReady"
        @click="leaveRoom"
        class="py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm"
      >
        退出房间
      </button>
    </div>
  </div>
</template>
