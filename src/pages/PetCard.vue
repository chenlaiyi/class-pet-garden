<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'
import PetImage from '@/components/PetImage.vue'
import PetAnimatedAsset from '@/components/PetAnimatedAsset.vue'
import { getPetLevelImage, getPetType, } from '@/data/pets'
import { hasPetAnimation } from '@/data/petAnimations'
import { usePublicPetInstance } from '@/composables/usePublicPetInstance'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const toast = useToast()
const { item: pet, loadByCode } = usePublicPetInstance()

const code = computed(() => String(route.params.code || ''))

const template = computed(() => {
  if (!pet.value) return null
  if (pet.value.template) return pet.value.template
  return getPetType(pet.value.template_id)
})

function rarityLabel(rarity?: string) {
  if (rarity === 'epic') return '超稀有'
  if (rarity === 'rare') return '稀有'
  return '普通'
}

const cardUrl = computed(() => pet.value ? `${window.location.origin}/p/${pet.value.code}` : '')
const qrCodeUrl = computed(() => pet.value ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(cardUrl.value)}` : '')
const petDCI = computed(() => pet.value ? `DCI:PG-${pet.value.code}` : '')
const petDFC = computed(() => pet.value ? `DFC:${pet.value.template_id.toUpperCase()}-${pet.value.code}-${pet.value.level}` : '')

function canAnimate(petId?: string) {
  return petId ? hasPetAnimation(petId, 'idle') : false
}

async function copyDCI() {
  try {
    await navigator.clipboard.writeText(petDCI.value)
    toast.success('DCI 码已复制')
  } catch { toast.error('复制失败') }
}

async function copyDFC() {
  try {
    await navigator.clipboard.writeText(petDFC.value)
    toast.success('DFC 码已复制')
  } catch { toast.error('复制失败') }
}

onMounted(async () => {
  if (code.value) await loadByCode(code.value)
})
</script>

<template>
  <PageLayout>
    <div v-if="pet" class="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
      <!-- 左侧：宠物展示卡 -->
      <div class="bg-white rounded-[32px] shadow-2xl border border-orange-100 overflow-hidden">
        <div class="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 p-5 text-white">
          <div class="text-sm opacity-90">Pet Garden 身份卡</div>
          <div class="text-2xl font-bold mt-1">{{ pet.display_name }}</div>
        </div>
        <div class="p-6">
          <!-- 宠物头像 -->
          <div class="rounded-3xl bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-6 mb-5">
            <div class="pet-card-stage w-52 h-52 mx-auto rounded-[32px] overflow-hidden bg-white shadow-lg flex items-center justify-center">
              <div class="pet-card-orbit"></div>
              <div class="pet-card-glow"></div>
              <PetAnimatedAsset
                v-if="canAnimate(template?.id)"
                :pet-id="template?.id"
                :level="pet.level"
                mode="idle"
                size="full"
                :animation-enabled="true"
                :background="true"
              />
              <PetImage v-else :src="getPetLevelImage(pet.template_id, pet.level)" size="full" :rounded="false" :fallback-emoji="template?.placeholder" />
            </div>
          </div>

          <!-- 基本信息 -->
          <div class="space-y-3 text-gray-700">
            <div class="flex justify-between border-b border-gray-100 pb-2"><span class="text-gray-500">宠物编号</span><span class="font-bold">{{ pet.code }}</span></div>
            <div class="flex justify-between border-b border-gray-100 pb-2"><span class="text-gray-500">主人</span><span class="font-bold">{{ pet.student_name || '未绑定' }}</span></div>
            <div class="flex justify-between border-b border-gray-100 pb-2"><span class="text-gray-500">班级</span><span class="font-bold">{{ pet.class_name || '未绑定' }}</span></div>
            <div class="flex justify-between border-b border-gray-100 pb-2"><span class="text-gray-500">等级</span><span class="font-bold text-orange-500">Lv.{{ pet.level }}</span></div>
            <div class="flex justify-between border-b border-gray-100 pb-2"><span class="text-gray-500">稀有度</span><span class="font-bold">{{ rarityLabel(template?.rarity) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">状态</span><span class="font-bold">{{ pet.status === 'alive' ? '状态良好' : pet.status === 'injured' ? '轻伤中' : '休眠中' }}</span></div>
          </div>
        </div>
      </div>

      <!-- 右侧：身份码 + 二维码 -->
      <div class="bg-white rounded-[32px] shadow-xl border border-gray-100 p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">宠物身份识别</h2>

        <!-- 二维码 -->
        <div class="rounded-3xl bg-gradient-to-br from-orange-50 to-pink-50 p-6 mb-5 flex flex-col items-center">
          <img
            v-if="qrCodeUrl"
            :src="qrCodeUrl"
            alt="宠物身份二维码"
            class="w-52 h-52 rounded-2xl bg-white shadow-md p-2"
          />
          <div v-else class="w-52 h-52 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">加载中...</div>
          <div class="mt-3 text-xs text-gray-500 text-center">微信/支付宝扫一扫进入宠物主页</div>
        </div>

        <!-- DCI / DFC 身份码 -->
        <div class="space-y-3 mb-5">
          <div class="rounded-2xl bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 p-4">
            <div class="flex items-center justify-between mb-1">
              <div class="text-xs text-gray-500 uppercase tracking-wider">DCI · 数字身份码</div>
              <button @click="copyDCI" class="text-xs text-orange-500 hover:text-orange-600 font-medium">复制</button>
            </div>
            <div class="font-mono font-bold text-gray-800 text-lg break-all">{{ petDCI }}</div>
          </div>
          <div class="rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-4">
            <div class="flex items-center justify-between mb-1">
              <div class="text-xs text-gray-500 uppercase tracking-wider">DFC · 数字家族码</div>
              <button @click="copyDFC" class="text-xs text-purple-500 hover:text-purple-600 font-medium">复制</button>
            </div>
            <div class="font-mono font-bold text-gray-800 text-lg break-all">{{ petDFC }}</div>
          </div>
        </div>

        <!-- 链接和说明 -->
        <div class="space-y-3">
          <div class="rounded-2xl bg-orange-50 border border-orange-100 p-4">
            <div class="text-sm text-gray-500 mb-1">扫码后进入</div>
            <div class="font-bold text-gray-800 break-all text-sm">{{ cardUrl }}</div>
          </div>
          <div class="rounded-2xl bg-purple-50 border border-purple-100 p-4">
            <div class="text-sm text-gray-500 mb-1">NFC / 碰一碰</div>
            <div class="font-bold text-gray-800 text-sm">将 DCI 写入 NFC 标签，碰触即识别宠物</div>
          </div>
          <div class="flex gap-3 pt-2">
            <RouterLink :to="`/p/${pet.code}`" class="flex-1 text-center rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold py-3 hover:shadow-md transition-all">打开宠物主页</RouterLink>
            <RouterLink :to="`/identity/${pet.id}`" class="flex-1 text-center rounded-2xl bg-gradient-to-r from-purple-400 to-indigo-500 text-white font-bold py-3 hover:shadow-md transition-all">查看详情</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-10 text-center">
      <div class="text-6xl mb-4">🐾</div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">没有找到这只宠物</h1>
      <p class="text-gray-500 mb-6">该宠物编号不存在。</p>
      <RouterLink to="/preview" class="inline-block px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold">回到图鉴</RouterLink>
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

@media print {
  :deep(body > *:not(.pet-card)) {
    display: none !important;
  }
}
</style>
