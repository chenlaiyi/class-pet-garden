<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'
import PetImage from '@/components/PetImage.vue'
import PetAnimatedAsset from '@/components/PetAnimatedAsset.vue'
import { DEMO_PET_INSTANCES, getDemoPetDetail } from '@/data/demoPets'
import { getPetLevelImage } from '@/data/pets'
import { hasPetAnimation } from '@/data/petAnimations'
import { usePublicPetInstance } from '@/composables/usePublicPetInstance'

const route = useRoute()
const currentCode = computed(() => String(route.query.pet || 'demo-shiba-001'))
const { item, loadByCode } = usePublicPetInstance()
const currentPet = computed(() => item.value || getDemoPetDetail(currentCode.value) || getDemoPetDetail('demo-shiba-001'))

onMounted(() => {
  loadByCode(currentCode.value)
})

watch(currentCode, (code) => {
  loadByCode(code)
})

function canAnimate(petId?: string, mode: 'idle' | 'entrance' = 'idle') {
  return petId ? hasPetAnimation(petId, mode) : false
}
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 rounded-[36px] shadow-2xl overflow-hidden text-white">
        <div class="p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-center">
          <div class="w-60 h-60 md:w-72 md:h-72 rounded-[32px] bg-white/10 backdrop-blur-sm overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
            <PetAnimatedAsset
              v-if="currentPet && canAnimate(currentPet.template.id, 'entrance')"
              :pet-id="currentPet.template.id"
              :level="currentPet.level"
              mode="entrance"
              size="full"
              :animation-enabled="true"
            />
            <PetImage v-else-if="currentPet" :src="getPetLevelImage(currentPet.template.id, currentPet.level)" size="full" :rounded="false" :fallback-emoji="currentPet.template.placeholder" />
          </div>
          <div class="flex-1">
            <div class="text-sm text-white/70 mb-2">Pet Arena / 大屏演示版</div>
            <h1 class="text-4xl md:text-5xl font-black mb-3">{{ currentPet?.displayName }}</h1>
            <div class="flex flex-wrap gap-2 mb-5">
              <span class="px-3 py-1 rounded-full bg-white/10">{{ currentPet?.code }}</span>
              <span class="px-3 py-1 rounded-full bg-white/10">Lv.{{ currentPet?.level }}</span>
              <span class="px-3 py-1 rounded-full bg-white/10">{{ currentPet?.arenaTitle }}</span>
              <span class="px-3 py-1 rounded-full bg-white/10">{{ currentPet?.className }}</span>
            </div>
            <p class="text-lg text-white/85 leading-8 max-w-3xl">{{ currentPet?.motto }}</p>
            <div class="grid sm:grid-cols-3 gap-3 mt-6">
              <div class="rounded-2xl bg-white/10 p-4"><div class="text-sm text-white/70">主人</div><div class="text-xl font-bold mt-1">{{ currentPet?.ownerName }}</div></div>
              <div class="rounded-2xl bg-white/10 p-4"><div class="text-sm text-white/70">宠物类型</div><div class="text-xl font-bold mt-1">{{ currentPet?.template.name }}</div></div>
              <div class="rounded-2xl bg-white/10 p-4"><div class="text-sm text-white/70">状态</div><div class="text-xl font-bold mt-1">{{ currentPet?.status === 'injured' ? '轻伤中' : currentPet?.status === 'dead' ? '休眠中' : '状态良好' }}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-800">模拟扫码 / NFC 触发</h2>
          <div class="text-sm text-gray-500">点击下面的宠物卡，模拟线下设备识别后切换大屏。</div>
        </div>
        <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <RouterLink
            v-for="item in DEMO_PET_INSTANCES"
            :key="item.code"
            :to="`/arena?pet=${item.code}`"
            class="rounded-2xl border p-4 transition-all hover:shadow-lg"
            :class="currentPet?.code === item.code ? 'border-purple-400 bg-purple-50' : 'border-gray-100 bg-white'"
          >
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
                <PetAnimatedAsset
                  v-if="canAnimate(item.templateId, 'idle')"
                  :pet-id="item.templateId"
                  :level="item.level"
                  mode="idle"
                  size="full"
                  :animation-enabled="true"
                />
                <PetImage v-else :src="getPetLevelImage(item.templateId, item.level)" size="full" :rounded="false" :fallback-emoji="getDemoPetDetail(item.code)?.template.placeholder || '🐾'" />
              </div>
              <div>
                <div class="font-bold text-gray-800">{{ item.displayName }}</div>
                <div class="text-sm text-gray-500">{{ item.code }}</div>
                <div class="text-sm text-purple-600 mt-1">点击模拟触发</div>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </PageLayout>
</template>
