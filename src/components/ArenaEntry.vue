<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  zoneId: number
  zoneName: string
  entryCost: number
  winReward: number
}>()

const emit = defineEmits<{
  start: [{ petInstanceId: string; displayName: string; templateId: string; level: number }]
  cancel: []
}>()

const { api } = useAuth()
const pets = ref<any[]>([])
const myPoints = ref(100)
const loading = ref(true)
const error = ref('')
const selectedPetId = ref('')
const entering = ref(false)

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

// 入场：调 ready 接口入场扣分，然后通知父组件
async function confirmEntry() {
  if (!selectedPetId.value) return
  const pet = pets.value.find(p => p.id === selectedPetId.value)
  if (!pet) return
  entering.value = true
  error.value = ''
  try {
    // 调 ready 接口：入场扣分，返回扣后的余额
    const res = await api.post('/arena/ready', {
      zoneId: props.zoneId,
      petInstanceId: selectedPetId.value
    })
    myPoints.value = res.data.points // 更新显示扣后的余额
    emit('start', {
      petInstanceId: pet.id,
      displayName: pet.display_name || pet.displayName,
      templateId: pet.template_id || pet.templateId,
      level: pet.level || pet.level
    })
  } catch (e: any) {
    error.value = e?.response?.data?.error || '入场失败，请重试'
    entering.value = false
  }
}

const EMOJI_MAP: Record<string, string> = {
  shiba: '🐕', corgi: '🐶', golden: '🦮', bichon: '🐩',
  'orange-cat': '🐱', ragdoll: '🐱', bunny: '🐰', hamster: '🐹',
  duckling: '🦆', alpaca: '🦙', unicorn: '🦄', 'baby-dragon': '🐉',
  husky: '🐺', 'west-highland': '🐕', samoyed: '🐕',
  'winter-hamster': '🐹', 'tabby-cat': '🐱', 'angora-rabbit': '🐰',
  'call-duck': '🦆', 'border-collie': '🐕', persian: '🐱',
  'golden-retriever': '🦮', 'ragdoll-cat': '🐱', 'red-panda': '🐼',
}
function petEmoji(templateId: string) {
  return EMOJI_MAP[templateId] || '🐾'
}



load()
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
      <!-- 标题栏 -->
      <div class="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 text-white">
        <h2 class="text-2xl font-black flex items-center gap-2">
          <span>🎮</span> 参赛确认
        </h2>
        <p class="text-blue-100 text-sm mt-1">{{ zoneName }}</p>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="p-10 text-center text-gray-400">
        加载中...
      </div>

      <!-- 错误 -->
      <div v-else-if="error" class="p-6 text-center">
        <div class="text-red-500 text-sm mb-4">{{ error }}</div>
        <button @click="load" class="px-6 py-2 bg-gray-100 rounded-full text-sm font-medium">重试</button>
      </div>

      <!-- 内容 -->
      <div v-else class="p-6 space-y-5">
        <!-- 积分余额 -->
        <div class="flex items-center justify-between bg-orange-50 rounded-2xl px-5 py-4 border border-orange-100">
          <span class="text-gray-600 font-medium">我的积分余额</span>
          <span class="text-2xl font-black text-orange-500">{{ myPoints }}</span>
        </div>

        <!-- 规则说明 -->
        <div class="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 text-sm space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-green-500 font-bold">+{{ winReward }}</span>
            <span class="text-gray-600">胜者奖励</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-red-500 font-bold">-{{ entryCost }}</span>
            <span class="text-gray-600">入场扣除（无论输赢）</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-400 font-bold">×0</span>
            <span class="text-gray-600">平/负：积分不返还</span>
          </div>
        </div>

        <!-- 积分不足 -->
        <div v-if="myPoints < entryCost" class="bg-red-50 rounded-2xl px-5 py-4 border border-red-200 text-center">
          <p class="text-red-600 font-bold">积分不足，无法参赛</p>
          <p class="text-red-400 text-sm mt-1">需要 {{ entryCost }} 积分，当前 {{ myPoints }} 积分</p>
        </div>

        <!-- 宠物列表 -->
        <div v-else>
          <p class="text-gray-700 font-bold mb-3">选择参赛宠物</p>
          <div v-if="pets.length === 0" class="text-center py-6 text-gray-400 text-sm">
            还没有宠物，先去领养一只吧 🐾
          </div>
          <div v-else class="space-y-2 max-h-56 overflow-y-auto">
            <button
              v-for="pet in pets"
              :key="pet.id"
              @click="selectedPetId = pet.id"
              class="w-full flex items-center gap-3 rounded-2xl px-4 py-3 border-2 transition-all text-left"
              :class="selectedPetId === pet.id
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-100 bg-white hover:border-gray-200'"
            >
              <span class="text-2xl">{{ petEmoji(pet.template_id) }}</span>
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
      <div class="px-6 pb-6 flex gap-3">
        <button
          @click="emit('cancel')"
          class="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold"
        >
          取消
        </button>
        <button
          v-if="myPoints >= entryCost && pets.length > 0"
          @click="confirmEntry"
          :disabled="!selectedPetId || entering"
          class="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black shadow-lg disabled:opacity-50"
        >
          {{ entering ? '进入中...' : '入场开战 🎮' }}
        </button>
      </div>
    </div>
  </div>
</template>
