<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits<{
  created: [{ matchId: string; inviteCode: string; zoneName: string; pet: any; newPoints: number; entryCost: number; winReward: number }]
  cancel: []
  'go-join': []
}>()

const { api, isGuest } = useAuth()
const pets = ref<any[]>([])
const myPoints = ref(100)
const loading = ref(true)
const error = ref('')
const selectedPetId = ref('')
const entering = ref(false)
const ZONE_ID = 1

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
    const msg = e?.response?.data?.error || e?.message || ''
    if (e?.response?.status === 401 || msg.includes('未登录') || isGuest.value) {
      // guest: 显示登录提示
    } else {
      error.value = msg || '加载失败'
    }
  } finally {
    loading.value = false
  }
}

async function confirmCreate() {
  if (!selectedPetId.value) return
  const pet = pets.value.find(p => p.id === selectedPetId.value)
  if (!pet) return
  entering.value = true
  error.value = ''
  try {
    const res = await api.post('/arena/match/create', {
      zoneId: ZONE_ID,
      petInstanceId: selectedPetId.value
    })
    const d = res.data
    emit('created', {
      matchId: d.matchId,
      inviteCode: d.inviteCode,
      zoneName: d.zoneName,
      pet: d.pet,
      newPoints: d.newPoints,
      entryCost: d.entryCost,
      winReward: d.winReward
    })
  } catch (e: any) {
    error.value = e?.response?.data?.error || '创建房间失败'
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

    <!-- 规则 -->
    <div class="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 text-sm space-y-1.5 mb-5">
      <div class="flex items-center gap-2"><span class="text-red-400 font-bold">-5</span><span class="text-gray-600">入场扣除（无论输赢）</span></div>
      <div class="flex items-center gap-2"><span class="text-green-500 font-bold">+10</span><span class="text-gray-600">胜者奖励</span></div>
      <div class="flex items-center gap-2"><span class="text-gray-400 font-bold">×0</span><span class="text-gray-600">负/平：积分不返还</span></div>
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
      <div v-else-if="isGuest" class="bg-amber-50 rounded-2xl px-5 py-6 border border-amber-200 text-center mb-5">
        <p class="text-2xl mb-2">🔐</p>
        <p class="text-amber-700 font-bold">请先登录</p>
        <p class="text-amber-500 text-sm mt-1">竞技场需要登录后才能参加哦</p>
        <p class="text-amber-400 text-xs mt-1">（请在应用内登录或联系老师开通账号）</p>
      </div>
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
        @click="confirmCreate"
        :disabled="!selectedPetId || entering"
        class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black shadow-lg disabled:opacity-50"
      >
        {{ entering ? '创建中...' : '创建房间 🏠' }}
      </button>
    </div>
  </div>
</template>
