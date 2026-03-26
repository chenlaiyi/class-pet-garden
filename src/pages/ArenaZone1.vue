<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'
import ArenaMatchFlow from '@/components/arena/ArenaMatchFlow.vue'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { api, isLoggedIn } = useAuth()

// 如果是扫码入场过来的，会带 matchId 和 from=join
const joinMatchId = ref(String(route.query.matchId || ''))
const fromJoin = ref(route.query.from === 'join')

const phase = ref<'create' | 'join' | 'wait' | 'battle'>('create')
const matchId = ref('')
const inviteCode = ref('')
const zoneName = ref('')
const entryCost = ref(5)
const winReward = ref(10)
const p1Pet = ref<any>(null)
const p2Pet = ref<any>(null)
const myPet = ref<any>(null)
const isP1 = ref(false)
const initLoading = ref(false)

async function initFromJoin() {
  if (!joinMatchId.value || !fromJoin.value) return
  initLoading.value = true
  try {
    const res = await api.get(`/arena/match/${joinMatchId.value}`)
    const d = res.data
    matchId.value = joinMatchId.value
    inviteCode.value = d.inviteCode || ''
    zoneName.value = d.zoneName || ''
    entryCost.value = 5
    winReward.value = 10
    p1Pet.value = d.p1
    p2Pet.value = d.p2
    myPet.value = d.p2
    isP1.value = false
    phase.value = 'wait'
  } catch {
    phase.value = 'create'
  } finally {
    initLoading.value = false
  }
}

function onCreated(payload: {
  matchId: string; inviteCode: string; zoneName: string;
  pet: any; newPoints: number; entryCost: number; winReward: number
}) {
  matchId.value = payload.matchId
  inviteCode.value = payload.inviteCode
  zoneName.value = payload.zoneName
  entryCost.value = payload.entryCost
  winReward.value = payload.winReward
  p1Pet.value = payload.pet
  myPet.value = payload.pet
  isP1.value = true
  p2Pet.value = null
  phase.value = 'wait'
}

function onBattleStart() {
  phase.value = 'battle'
}

function onBack() {
  matchId.value = ''
  inviteCode.value = ''
  p1Pet.value = null
  p2Pet.value = null
  myPet.value = null
  phase.value = 'create'
}

function onGoJoin() {
  phase.value = 'join'
}

onMounted(async () => {
  if (fromJoin.value && joinMatchId.value && isLoggedIn.value) {
    await initFromJoin()
  }
})
</script>

<template>
  <PageLayout>
    <div v-if="initLoading" class="flex items-center justify-center min-h-64">
      <div class="text-center text-gray-400">
        <div class="text-3xl animate-pulse mb-2">⏳</div>
        <p>正在加入房间...</p>
      </div>
    </div>
    <ArenaMatchFlow
      v-else
      :initial-phase="phase"
      :match-id="matchId"
      :invite-code="inviteCode"
      :zone-name="zoneName"
      :entry-cost="entryCost"
      :win-reward="winReward"
      :p1-pet="p1Pet"
      :p2-pet="p2Pet"
      :my-pet="myPet"
      :is-p1="isP1"
      @created="onCreated"
      @battle-start="onBattleStart"
      @back="onBack"
      @go-join="onGoJoin"
    />
  </PageLayout>
</template>
