<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { api, isLoggedIn } = useAuth()
const toast = useToast()

const inviteCode = String(route.params.code || '')

const matchInfo = ref<any>(null)
const matchLoading = ref(true)
const matchError = ref('')

const pets = ref<any[]>([])
const petsLoading = ref(true)
const selectedPetId = ref('')
const joining = ref(false)
const joinError = ref('')

const EMOJI_MAP: Record<string, string> = {
  shiba: '🐕', corgi: '🐶', golden: '🦮', bichon: '🐩',
  'orange-cat': '🐱', ragdoll: '🐱', bunny: '🐰', hamster: '🐹',
  duckling: '🦆', alpaca: '🦙', unicorn: '🦄', 'baby-dragon': '🐉',
  husky: '🐺', 'west-highland': '🐕', samoyed: '🐕',
}
function petEmoji(tid: string) { return EMOJI_MAP[tid] || '🐾' }

async function loadMatchInfo() {
  matchLoading.value = true
  matchError.value = ''
  try {
    const res = await fetch(`/api/arena/public/match/${inviteCode}`)
    if (!res.ok) {
      const d = await res.json()
      matchError.value = d.error || '房间不存在或已过期'
      return
    }
    matchInfo.value = await res.json()
  } catch {
    matchError.value = '加载房间信息失败，请检查网络'
  } finally {
    matchLoading.value = false
  }
}

async function loadMyPets() {
  if (!isLoggedIn.value) return
  petsLoading.value = true
  try {
    const res = await api.get('/arena/my-pets')
    pets.value = res.data.items || []
    if (pets.value.length > 0) selectedPetId.value = pets.value[0].id
  } catch {
    pets.value = []
  } finally {
    petsLoading.value = false
  }
}

async function joinMatch() {
  if (!selectedPetId.value) { joinError.value = '请先选择参赛宠物'; return }
  joining.value = true
  joinError.value = ''
  try {
    const res = await api.post('/arena/match/join', {
      inviteCode,
      petInstanceId: selectedPetId.value
    })
    const d = res.data
    router.push({
      name: 'arena-zone-1',
      query: {
        matchId: d.matchId,
        zoneName: d.zoneName,
        from: 'join'
      }
    })
  } catch (e: any) {
    joinError.value = e?.response?.data?.error || '加入房间失败'
    toast.error(joinError.value)
  } finally {
    joining.value = false
  }
}

onMounted(async () => {
  await loadMatchInfo()
  if (isLoggedIn.value) await loadMyPets()
})
</script>

<template>
  <PageLayout>
    <div class="max-w-md mx-auto space-y-5">

      <div class="text-center">
        <div class="text-4xl mb-2">🎮</div>
        <h2 class="text-2xl font-black text-gray-900">扫码入场</h2>
        <p class="text-gray-400 text-sm mt-1">P2 请选择自己的宠物加入对战</p>
      </div>

      <div v-if="matchLoading" class="text-center py-12 text-gray-400">
        <div class="text-3xl animate-pulse mb-2">⏳</div>
        <p>正在加载房间信息...</p>
      </div>

      <div v-else-if="matchError" class="bg-red-50 rounded-2xl p-6 border border-red-200 text-center">
        <div class="text-3xl mb-2">😵</div>
        <p class="text-red-600 font-bold">{{ matchError }}</p>
        <button @click="router.push('/arena')" class="mt-4 px-6 py-2 bg-red-100 rounded-full text-red-700 text-sm font-medium">
          返回竞技场
        </button>
      </div>

      <template v-else-if="matchInfo">
        <div class="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-center">
          <p class="text-xs text-blue-400 mb-1">邀请码</p>
          <div class="text-3xl font-mono font-black tracking-widest text-blue-600">
            {{ matchInfo.inviteCode?.replace(/(.{3})/g, '$1 ').trim() }}
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ matchInfo.zoneName }}</p>
        </div>

        <div class="bg-blue-50 rounded-2xl p-5 border-2 border-blue-200">
          <div class="flex items-center gap-4">
            <div class="text-5xl">{{ petEmoji(matchInfo.p1?.templateId || 'shiba') }}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">P1</span>
                <span class="font-black text-gray-800">{{ matchInfo.p1?.displayName || '???' }}</span>
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                Lv.{{ matchInfo.p1?.level || '?' }} · {{ matchInfo.p1?.code || '---' }}
              </div>
            </div>
            <div class="text-sm text-gray-400">等待入场</div>
          </div>
        </div>

        <div class="bg-gray-50 rounded-2xl px-5 py-3 border border-gray-100 text-xs text-gray-400 space-y-1">
          <div>🎯 消除2行以上给对手增加干扰行</div>
          <div>⏱️ 先被堆满者为负</div>
          <div>📉 入场 -5 积分，胜 +10，负/平不返还</div>
        </div>

        <div v-if="!isLoggedIn" class="bg-amber-50 rounded-2xl p-5 border border-amber-200 text-center">
          <div class="text-3xl mb-2">🔐</div>
          <p class="font-bold text-amber-700 mb-1">请先登录</p>
          <p class="text-amber-600 text-sm mb-4">登录后选择你的宠物加入对战</p>
          <button @click="router.push('/settings')" class="px-6 py-2.5 bg-amber-500 text-white rounded-2xl font-bold text-sm">
            去登录
          </button>
        </div>

        <div v-else>
          <p class="text-gray-700 font-bold mb-3 text-sm">选择你的参赛宠物</p>

          <div v-if="petsLoading" class="text-center py-6 text-gray-400 text-sm">加载宠物中...</div>
          <div v-else-if="pets.length === 0" class="bg-orange-50 rounded-2xl p-5 border border-orange-200 text-center">
            <p class="text-orange-600 font-bold">还没有宠物</p>
            <p class="text-orange-400 text-sm mt-1">先去领养一只吧 🐾</p>
          </div>
          <div v-else class="space-y-2 mb-4">
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

          <div v-if="pets.length > 0" class="bg-gray-50 rounded-xl px-4 py-2 text-xs text-gray-400 text-center mb-3">
            加入将扣除 5 积分，无论输赢
          </div>

          <div v-if="joinError" class="text-red-500 text-sm text-center mb-3">{{ joinError }}</div>
        </div>

        <div class="flex gap-3">
          <button @click="router.push('/arena')" class="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold">取消</button>
          <button
            v-if="isLoggedIn && pets.length > 0"
            @click="joinMatch"
            :disabled="!selectedPetId || joining"
            class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black shadow-lg disabled:opacity-50"
          >
            {{ joining ? '加入中...' : '加入对战 🎮' }}
          </button>
        </div>
      </template>
    </div>
  </PageLayout>
</template>
