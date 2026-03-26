<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

defineProps<{ inviteCode?: string }>()
const emit = defineEmits<{
  joined: [{ matchId: string; zoneName: string; p1: any; p2: any; newPoints: number; entryCost: number; winReward: number }]
  cancel: []
}>()

const { api } = useAuth()
const pets = ref<any[]>([])
const myPoints = ref(100)
const loading = ref(true)
const error = ref('')
const selectedPetId = ref('')
const entering = ref(false)
const code = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [ptsRes, petsRes] = await Promise.all([
      api.get('/arena/points'),
      api.get('/arena/my-pets')
    ])
    myPoints.value = ptsRes.data.points ?? 100
    pets.value = petsRes.data.items ?? []
    if (pets.value.length > 0) selectedPetId.value = pets.value[0].id
  } catch (e: any) {
    error.value = e?.response?.data?.error || '加载失败'
  } finally {
    loading.value = false
  }
}

async function confirmJoin() {
  if (!selectedPetId.value || !code.value.trim()) return
  const pet = pets.value.find(p => p.id === selectedPetId.value)
  if (!pet) return
  entering.value = true
  error.value = ''
  try {
    const res = await api.post('/arena/match/join', {
      inviteCode: code.value.trim(),
      petInstanceId: selectedPetId.value
    })
    const d = res.data
    emit('joined', {
      matchId: d.matchId,
      zoneName: d.zoneName,
      p1: d.p1,
      p2: d.p2,
      newPoints: d.newPoints,
      entryCost: d.entryCost,
      winReward: d.winReward
    })
  } catch (e: any) {
    error.value = e?.response?.data?.error || '加入房间失败'
    entering.value = false
  }
}

const EMOJI_MAP: Record<string, string> = {
  shiba: '🐕', corgi: '🐶', golden: '🦮', bichon: '🐩',
  'orange-cat': '🐱', ragdoll: '🐱', bunny: '🐰', hamster: '🐹',
  duckling: '🦆', alpaca: '🦙', unicorn: '🦄', 'baby-dragon': '🐉',
  husky: '🐺', 'west-highland': '🐕', samoyed: '🐕',
}
function petEmoji(tid: string) { return EMOJI_MAP[tid] || '🐾' }

load()
</script>

<template>
  <div class="max-w-md mx-auto">
    <!-- 积分卡片 -->
    <div class="flex items-center justify-between bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl px-6 py-4 border border-orange-100 mb-5">
      <span class="text-gray-600 font-medium">我的积分</span>
      <span class="text-2xl font-black text-orange-500">{{ myPoints }}</span>
    </div>

    <!-- 扫码区 -->
    <div class="bg-blue-50 rounded-2xl px-5 py-5 border border-blue-100 text-center mb-5">
      <div class="text-4xl mb-2">📱</div>
      <p class="font-bold text-blue-700 mb-1">扫描宠物身份码加入对战</p>
      <p class="text-blue-400 text-xs mb-4">或在下方输入6位邀请码</p>
      <input
        v-model="code"
        type="text"
        maxlength="6"
        inputmode="numeric"
        pattern="[0-9]*"
        placeholder="请输入6位邀请码"
        class="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 rounded-xl border-2 border-blue-200 bg-white focus:border-blue-400 focus:outline-none transition"
      />
    </div>

    <!-- 规则 -->
    <div class="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 text-sm space-y-1.5 mb-5">
      <div class="flex items-center gap-2"><span class="text-red-400 font-bold">-5</span><span class="text-gray-600">入场扣除（无论输赢）</span></div>
      <div class="flex items-center gap-2"><span class="text-green-500 font-bold">+10</span><span class="text-gray-600">胜者奖励</span></div>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="text-center py-10 text-gray-400">加载中...</div>
    <div v-else-if="error" class="text-center py-6">
      <p class="text-red-500 text-sm mb-3">{{ error }}</p>
      <button @click="load" class="px-6 py-2 bg-gray-100 rounded-full text-sm font-medium">重试</button>
    </div>
    <div v-else>
      <!-- 积分不足 -->
      <div v-if="myPoints < 5" class="bg-red-50 rounded-2xl px-5 py-5 border border-red-200 text-center mb-5">
        <p class="text-red-600 font-bold">积分不足，无法参赛</p>
        <p class="text-red-400 text-sm mt-1">需要 5 积分，当前 {{ myPoints }} 积分</p>
      </div>

      <!-- 宠物列表 -->
      <div v-else>
        <p class="text-gray-700 font-bold mb-3 text-sm">选择参赛宠物</p>
        <div v-if="pets.length === 0" class="text-center py-8 text-gray-400 text-sm">
          还没有宠物，先去领养一只吧 🐾
        </div>
        <div v-else class="space-y-2 mb-6">
          <button
            v-for="pet in pets" :key="pet.id"
            @click="selectedPetId = pet.id"
            class="w-full flex items-center gap-3 rounded-2xl px-4 py-3 border-2 transition-all text-left"
            :class="selectedPetId === pet.id ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'"
          >
            <span class="text-3xl">{{ petEmoji(pet.template_id) }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-gray-800 truncate">{{ pet.display_name }}</div>
              <div class="text-xs text-gray-400">Lv.{{ pet.level }} · {{ pet.code }}</div>
            </div>
            <div v-if="selectedPetId === pet.id" class="text-blue-500 font-bold text-xl">✓</div>
          </button>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="flex gap-3 mt-4">
      <button @click="emit('cancel')" class="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold">取消</button>
      <button
        v-if="myPoints >= 5 && pets.length > 0"
        @click="confirmJoin"
        :disabled="!selectedPetId || !code.trim() || entering"
        class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black shadow-lg disabled:opacity-50"
      >
        {{ entering ? '加入中...' : '加入对战 🎮' }}
      </button>
    </div>
  </div>
</template>
