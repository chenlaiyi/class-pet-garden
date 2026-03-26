<script setup lang="ts">
import { ref } from 'vue'
import ArenaMatchCreate from '@/components/arena/ArenaMatchCreate.vue'
import ArenaMatchJoin from '@/components/arena/ArenaMatchJoin.vue'
import ArenaMatchWait from '@/components/arena/ArenaMatchWait.vue'
import ArenaMatchPrepare from '@/components/arena/ArenaMatchPrepare.vue'
import ArenaZone1Battle from '@/components/arena/ArenaZone1Battle.vue'
import ArenaZone2Race from '@/components/arena/ArenaZone2Race.vue'

const props = defineProps<{
  initialPhase?: 'create' | 'join' | 'wait' | 'prepare' | 'battle'
  matchId?: string
  inviteCode?: string
  zoneName?: string
  entryCost?: number
  winReward?: number
  p1Pet?: any
  p2Pet?: any
  myPet?: any
  isP1?: boolean
  zoneId?: number
}>()

const emit = defineEmits<{
  created: [payload: {
    matchId: string; inviteCode: string; zoneName: string;
    pet: any; newPoints: number; entryCost: number; winReward: number
  }]
  'battle-start': []
  back: []
  'go-join': []
}>()

const phase = ref<'create' | 'join' | 'wait' | 'prepare' | 'battle'>(props.initialPhase || 'create')
const matchId = ref(props.matchId || '')
const inviteCode = ref(props.inviteCode || '')
const zoneName = ref(props.zoneName || '方块战场')
const entryCost = ref(props.entryCost || 5)
const winReward = ref(props.winReward || 10)
const p1Pet = ref<any>(props.p1Pet || null)
const p2Pet = ref<any>(props.p2Pet || null)
const myPet = ref<any>(props.myPet || null)
const isP1 = ref(props.isP1 ?? true)

// 两人都已入场，进入准备确认页
function enterPrepare() {
  phase.value = 'prepare'
}

async function onCreated(payload: {
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
  emit('created', payload)
}

async function onJoined(payload: {
  matchId: string; zoneName: string; p1: any; p2: any;
  newPoints: number; entryCost: number; winReward: number
}) {
  matchId.value = payload.matchId
  zoneName.value = payload.zoneName
  entryCost.value = payload.entryCost
  winReward.value = payload.winReward
  p1Pet.value = payload.p1
  p2Pet.value = payload.p2
  myPet.value = payload.p2
  isP1.value = false
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
  emit('back')
}

function onGoJoin() {
  phase.value = 'join'
  emit('go-join')
}
</script>

<template>
  <div class="max-w-3xl mx-auto py-6 px-4 space-y-6">
    <!-- 顶部导航 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl">🎮</span>
        <span class="font-black text-gray-800 text-lg">{{ zoneName }}</span>
      </div>
      <button
        v-if="phase !== 'create'"
        @click="onBack"
        class="px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition"
      >
        ← 返回
      </button>
    </div>

    <!-- 步骤指示 -->
    <div class="flex items-center justify-center gap-2 flex-wrap">
      <div v-for="(step, i) in ['创建房间', '扫码入场', '等待准备', '双方确认', '开始对战']" :key="i"
        class="flex items-center gap-2"
        :class="{
          'text-blue-600': (i === 0 && phase === 'create') || (i === 1 && phase === 'join') || (i === 2 && phase === 'wait') || (i === 3 && phase === 'prepare') || (i === 4 && phase === 'battle'),
          'text-green-600': (i === 0 && phase !== 'create') || (i === 1 && phase !== 'create' && phase !== 'join') || (i === 2 && phase !== 'create' && phase !== 'join' && phase !== 'wait') || (i === 3 && phase === 'battle') || (i === 4 && phase === 'battle'),
          'text-gray-400': !( (i === 0 && phase === 'create') || (i === 1 && phase === 'join') || (i === 2 && phase === 'wait') || (i === 3 && phase === 'prepare') || (i === 4 && phase === 'battle') || (i === 0 && phase !== 'create') || (i === 1 && phase !== 'create' && phase !== 'join') || (i === 2 && phase !== 'create' && phase !== 'join' && phase !== 'wait') || (i === 3 && phase === 'battle') || (i === 4 && phase === 'battle'))
        }">
        <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
          :class="(i === 0 && phase === 'create') || (i === 1 && phase === 'join') || (i === 2 && phase === 'wait') || (i === 3 && phase === 'prepare') || (i === 4 && phase === 'battle')
            ? 'bg-blue-500 text-white'
            : (i === 0 && phase !== 'create') || (i === 1 && phase !== 'create' && phase !== 'join') || (i === 2 && phase !== 'create' && phase !== 'join' && phase !== 'wait') || (i === 3 && phase === 'battle') || (i === 4 && phase === 'battle')
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-400'">{{ i+1 }}</span>
        <span class="text-sm font-medium hidden sm:inline">{{ step }}</span>
      </div>
    </div>

    <!-- 步骤内容 -->
    <div v-if="phase === 'create'">
      <ArenaMatchCreate @created="onCreated" @cancel="onBack" @go-join="onGoJoin" />
      <div class="text-center mt-4">
        <button @click="onGoJoin" class="text-sm text-blue-500 hover:text-blue-700 font-medium">
          已有邀请码？加入房间 →
        </button>
      </div>
    </div>
    <div v-else-if="phase === 'join'">
      <ArenaMatchJoin @joined="onJoined" @cancel="onBack" />
    </div>
    <div v-else-if="phase === 'wait'">
      <ArenaMatchWait
        :match-id="matchId"
        :invite-code="inviteCode"
        :zone-name="zoneName"
        :entry-cost="entryCost"
        :win-reward="winReward"
        :p1-pet="p1Pet"
        :p2-pet="p2Pet"
        :my-pet="myPet"
        :is-p1="isP1"
        @both-joined="enterPrepare"
        @battle-start="onBattleStart"
        @back="onBack"
      />
    </div>
    <div v-else-if="phase === 'prepare'">
      <ArenaMatchPrepare
        :match-id="matchId"
        :invite-code="inviteCode"
        :zone-name="zoneName"
        :entry-cost="entryCost"
        :win-reward="winReward"
        :p1-pet="p1Pet"
        :p2-pet="p2Pet"
        :my-pet="myPet"
        :is-p1="isP1"
        @battle-start="onBattleStart"
        @back="onBack"
      />
    </div>
    <div v-else-if="phase === 'battle'">
      <ArenaZone2Race
        v-if="zoneId === 2"
        :match-id="matchId"
        :p1-pet="p1Pet"
        :p2-pet="p2Pet"
        :my-pet="myPet"
        :is-p1="isP1"
        :zone-name="zoneName"
        @exit="onBack"
      />
      <ArenaZone1Battle
        v-else
        :match-id="matchId"
        :p1-pet="p1Pet"
        :p2-pet="p2Pet"
        :my-pet="myPet"
        :is-p1="isP1"
        :zone-name="zoneName"
        @exit="onBack"
      />
    </div>
  </div>
</template>
