<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'
import PetImage from '@/components/PetImage.vue'
import PetAnimatedAsset from '@/components/PetAnimatedAsset.vue'
import { getPetLevelImage } from '@/data/pets'
import { hasPetAnimation } from '@/data/petAnimations'
import { usePublicPetInstance } from '@/composables/usePublicPetInstance'

const route = useRoute()
const { item: pet, loadByCode } = usePublicPetInstance()
const cardUrl = computed(() => pet.value ? `https://pet.tapgo.cn/p/${pet.value.code}` : '')

onMounted(() => {
  loadByCode(String(route.params.code || ''))
})

function canAnimate(petId?: string) {
  return petId ? hasPetAnimation(petId, 'idle') : false
}
</script>

<template>
  <PageLayout>
    <div v-if="pet" class="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
      <div class="bg-white rounded-[32px] shadow-2xl border border-orange-100 overflow-hidden">
        <div class="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 p-5 text-white">
          <div class="text-sm opacity-90">Pet Garden 身份卡 / 演示版</div>
          <div class="text-2xl font-bold mt-1">{{ pet.displayName }}</div>
        </div>
        <div class="p-6">
          <div class="rounded-3xl bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-6 mb-5">
            <div class="pet-card-stage w-52 h-52 mx-auto rounded-[32px] overflow-hidden bg-white shadow-lg flex items-center justify-center">
              <div class="pet-card-orbit"></div>
              <div class="pet-card-glow"></div>
              <PetAnimatedAsset
                v-if="canAnimate(pet.template.id)"
                :pet-id="pet.template.id"
                :level="pet.level"
                mode="idle"
                size="full"
                :animation-enabled="true"
                :background="true"
              />
              <PetImage v-else :src="getPetLevelImage(pet.template.id, pet.level)" size="full" :rounded="false" :fallback-emoji="pet.template.placeholder" />
            </div>
          </div>
          <div class="space-y-3 text-gray-700">
            <div class="flex justify-between"><span>宠物编号</span><span class="font-bold">{{ pet.code }}</span></div>
            <div class="flex justify-between"><span>主人</span><span class="font-bold">{{ pet.ownerName }}</span></div>
            <div class="flex justify-between"><span>班级</span><span class="font-bold">{{ pet.className }}</span></div>
            <div class="flex justify-between"><span>稀有度</span><span class="font-bold">{{ pet.template.rarity === 'epic' ? '超稀有' : pet.template.rarity === 'rare' ? '稀有' : '普通' }}</span></div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-[32px] shadow-xl border border-gray-100 p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">扫码 / 碰触入口演示</h2>
        <div class="rounded-3xl border-2 border-dashed border-gray-200 p-6 text-center bg-gray-50 mb-5">
          <div class="w-56 h-56 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center text-center p-4">
            <div>
              <div class="text-7xl mb-3">▦</div>
              <div class="text-sm text-gray-500 break-all">{{ cardUrl }}</div>
            </div>
          </div>
          <div class="mt-4 text-sm text-gray-500">这里先用二维码占位示意，下一步可以接真实二维码生成。</div>
        </div>

        <div class="space-y-3">
          <div class="rounded-2xl bg-orange-50 border border-orange-100 p-4">
            <div class="text-sm text-gray-500 mb-1">扫码后进入</div>
            <div class="font-bold text-gray-800 break-all">{{ cardUrl }}</div>
          </div>
          <div class="rounded-2xl bg-purple-50 border border-purple-100 p-4">
            <div class="text-sm text-gray-500 mb-1">未来 NFC 绑定建议</div>
            <div class="font-bold text-gray-800">将 {{ pet.code }} 作为短码/映射目标写入标签</div>
          </div>
          <div class="flex gap-3 pt-2">
            <RouterLink :to="`/p/${pet.code}`" class="flex-1 text-center rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold py-3">打开宠物主页</RouterLink>
            <RouterLink :to="`/arena?pet=${pet.code}`" class="flex-1 text-center rounded-2xl bg-gradient-to-r from-purple-400 to-indigo-500 text-white font-bold py-3">大屏演示</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.pet-card-stage {
  position: relative;
  isolation: isolate;
}

.pet-card-orbit {
  position: absolute;
  inset: 12%;
  border-radius: 999px;
  border: 1.5px solid rgba(255,255,255,0.78);
  background: linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08));
  box-shadow: inset 0 0 0 1px rgba(251,191,36,0.16), 0 18px 34px rgba(249,115,22,0.14);
  z-index: 0;
}

.pet-card-glow {
  position: absolute;
  left: 50%;
  bottom: 10%;
  transform: translateX(-50%);
  width: 72%;
  height: 20%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(251,146,60,0.30) 0%, rgba(244,114,182,0.18) 48%, transparent 100%);
  filter: blur(16px);
  z-index: 0;
}
</style>
