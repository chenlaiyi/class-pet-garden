<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'
import PetImage from '@/components/PetImage.vue'
import PetAnimatedAsset from '@/components/PetAnimatedAsset.vue'
import { getPetLevelImage } from '@/data/pets'
import { hasPetAnimation } from '@/data/petAnimations'
import { usePublicPetInstance } from '@/composables/usePublicPetInstance'

const route = useRoute()
const { item: pet, loadByCode } = usePublicPetInstance()

onMounted(() => {
  loadByCode(String(route.params.code || ''))
})

function statusLabel(status?: string) {
  if (status === 'injured') return '轻伤中'
  if (status === 'dead') return '休眠中'
  return '状态良好'
}

function canAnimate(petId?: string) {
  return petId ? hasPetAnimation(petId, 'idle') : false
}
</script>

<template>
  <PageLayout>
    <div v-if="pet" class="max-w-6xl mx-auto space-y-6">
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100">
        <div class="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 p-6 text-white">
          <div class="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div class="w-40 h-40 rounded-3xl bg-white/20 backdrop-blur-sm overflow-hidden shadow-lg flex items-center justify-center">
              <PetAnimatedAsset
                v-if="canAnimate(pet.template.id)"
                :pet-id="pet.template.id"
                :level="pet.level"
                mode="idle"
                size="full"
                :animation-enabled="true"
              />
              <PetImage v-else :src="getPetLevelImage(pet.template.id, pet.level)" :alt="pet.displayName" size="full" :rounded="false" :fallback-emoji="pet.template.placeholder" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-white/80 mb-2">宠物专属页 / 演示版</div>
              <h1 class="text-3xl font-bold mb-2">{{ pet.displayName }}</h1>
              <div class="flex flex-wrap gap-2 mb-4">
                <span class="px-3 py-1 rounded-full bg-white/20 text-sm">编号 {{ pet.code }}</span>
                <span class="px-3 py-1 rounded-full bg-white/20 text-sm">{{ pet.template.name }}</span>
                <span class="px-3 py-1 rounded-full bg-white/20 text-sm">Lv.{{ pet.level }}</span>
                <span class="px-3 py-1 rounded-full bg-white/20 text-sm">{{ pet.arenaTitle }}</span>
              </div>
              <p class="text-lg text-white/90">{{ pet.motto }}</p>
            </div>
          </div>
        </div>

        <div class="p-6 grid md:grid-cols-3 gap-4">
          <div class="rounded-2xl bg-orange-50 p-4 border border-orange-100">
            <div class="text-sm text-gray-500 mb-1">主人</div>
            <div class="text-xl font-bold text-gray-800">{{ pet.ownerName }}</div>
          </div>
          <div class="rounded-2xl bg-pink-50 p-4 border border-pink-100">
            <div class="text-sm text-gray-500 mb-1">班级</div>
            <div class="text-xl font-bold text-gray-800">{{ pet.className }}</div>
          </div>
          <div class="rounded-2xl bg-purple-50 p-4 border border-purple-100">
            <div class="text-sm text-gray-500 mb-1">当前状态</div>
            <div class="text-xl font-bold text-gray-800">{{ statusLabel(pet.status) }}</div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">宠物成长档案</h2>
          <div class="space-y-4">
            <div class="rounded-2xl border border-gray-100 p-4 bg-gray-50">
              <div class="text-sm text-gray-500 mb-2">宠物介绍</div>
              <div class="text-gray-700 leading-7">{{ pet.template.description }}</div>
            </div>
            <div class="rounded-2xl border border-gray-100 p-4 bg-gray-50">
              <div class="text-sm text-gray-500 mb-2">性格标签</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="tag in pet.template.personality" :key="tag" class="px-3 py-1 rounded-full bg-white shadow-sm text-sm text-gray-700">{{ tag }}</span>
              </div>
            </div>
            <div class="rounded-2xl border border-gray-100 p-4 bg-gray-50">
              <div class="text-sm text-gray-500 mb-2">领养信息</div>
              <div class="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <div>领养日期：{{ pet.adoptedAt }}</div>
                <div>稀有度：{{ pet.template.rarity === 'epic' ? '超稀有' : pet.template.rarity === 'rare' ? '稀有' : '普通' }}</div>
                <div>当前经验：{{ pet.exp }}</div>
                <div>宠物模板：{{ pet.template.id }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 class="text-xl font-bold text-gray-800 mb-4">互动入口</h2>
          <div class="space-y-3">
            <RouterLink :to="`/card/${pet.code}`" class="block w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white text-center font-bold py-3">查看身份卡</RouterLink>
            <RouterLink :to="`/arena?pet=${pet.code}`" class="block w-full rounded-2xl bg-gradient-to-r from-purple-400 to-indigo-500 text-white text-center font-bold py-3">进入竞技场</RouterLink>
            <RouterLink to="/preview" class="block w-full rounded-2xl bg-gray-100 text-gray-700 text-center font-bold py-3">返回宠物图鉴</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-10 text-center">
      <div class="text-6xl mb-4">🐾</div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">没有找到这只宠物</h1>
      <p class="text-gray-500 mb-6">这个页面当前是演示数据模式，后续会接入真实宠物实例。</p>
      <RouterLink to="/preview" class="inline-block px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold">回到图鉴</RouterLink>
    </div>
  </PageLayout>
</template>

<style scoped>
.pet-profile-hero {
  position: relative;
  isolation: isolate;
}

.pet-profile-orbit {
  position: absolute;
  inset: 10%;
  border-radius: 999px;
  border: 1.5px solid rgba(255,255,255,0.72);
  background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06));
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.22), 0 18px 36px rgba(124,58,237,0.14);
  z-index: 0;
}

.pet-profile-glow {
  position: absolute;
  left: 50%;
  bottom: 10%;
  transform: translateX(-50%);
  width: 72%;
  height: 20%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(251,146,60,0.26) 0%, rgba(168,85,247,0.18) 48%, transparent 100%);
  filter: blur(16px);
  z-index: 0;
}
</style>
