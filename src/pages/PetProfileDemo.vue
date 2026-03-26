<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'
import PetImage from '@/components/PetImage.vue'
import PetAnimatedAsset from '@/components/PetAnimatedAsset.vue'
import { getPetLevelImage } from '@/data/pets'
import { hasPetAnimation } from '@/data/petAnimations'
import { usePublicPetInstance } from '@/composables/usePublicPetInstance'
import { useNfcWrite } from '@/composables/useNfcWrite'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { item: pet, loadByCode } = usePublicPetInstance()
const { isWriting, writePetCode, isSupported: nfcSupported } = useNfcWrite()
const { success: toastSuccess, error: toastError } = useToast()

const cardUrl = computed(() => pet.value ? `https://pet.tapgo.cn/p/${pet.value.code}` : '')
const qrCodeUrl = computed(() => pet.value ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(cardUrl.value)}` : '')
const petDCI = computed(() => pet.value ? `DCI:/pet/${pet.value.code}` : '')
const petDFC = computed(() => pet.value ? `DFC:${pet.value.template.id.toUpperCase()}-${pet.value.code}-${pet.value.level}` : '')

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

async function handleNfcWrite() {
  if (!pet.value) return
  const result = await writePetCode(pet.value.code)
  if (result.success) {
    toastSuccess(result.message)
  } else {
    toastError(result.message)
  }
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
              <div class="text-sm text-white/80 mb-2">宠物专属页</div>
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

      <!-- 二维码 + NFC 身份识别区 -->
      <div class="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-5">宠物身份识别</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <!-- 二维码 -->
          <div class="rounded-3xl bg-gradient-to-br from-orange-50 to-pink-50 p-6 flex flex-col items-center">
            <img
              v-if="qrCodeUrl"
              :src="qrCodeUrl"
              alt="宠物身份二维码"
              class="w-48 h-48 rounded-2xl bg-white shadow-md p-2"
            />
            <div v-else class="w-48 h-48 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">加载中…</div>
            <div class="mt-3 text-sm text-gray-500 text-center">用微信 / 支付宝扫一扫</div>
          </div>

          <!-- NFC -->
          <div class="rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 p-6 flex flex-col items-center justify-center">
            <div class="text-5xl mb-3">📱📲</div>
            <div class="text-center mb-4">
              <div class="text-lg font-bold text-gray-800 mb-1">NFC · 碰一碰</div>
              <div class="text-sm text-gray-500">将宠物入口写入 NFC 标签，碰触即识别</div>
            </div>

            <!-- 支持情况提示 -->
            <div v-if="!nfcSupported()" class="text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2 text-center mb-3">
              Safari iOS 18+ / Chrome 安卓版可用，其他浏览器暂不支持
            </div>

            <!-- NFC 写入按钮 -->
            <div class="space-y-2 w-full">
              <button
                class="w-full rounded-2xl bg-gradient-to-r from-purple-400 to-indigo-500 text-white font-bold py-3 text-center transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="isWriting || !nfcSupported()"
                @click="handleNfcWrite"
              >
                <span v-if="isWriting" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  写入中…
                </span>
                <span v-else>📲 写入 NFC 标签</span>
              </button>
              <div class="text-xs text-center text-gray-400">写入后，将手机 NFC 感应区靠近标签即可打开</div>
            </div>
          </div>
        </div>

        <!-- DCI / DFC -->
        <div class="grid sm:grid-cols-2 gap-3 mt-5">
          <div class="rounded-2xl bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 p-4">
            <div class="text-xs text-gray-500 mb-1 uppercase tracking-wider">DCI · 数字身份码</div>
            <div class="font-mono font-bold text-gray-800 text-base break-all">{{ petDCI }}</div>
          </div>
          <div class="rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-4">
            <div class="text-xs text-gray-500 mb-1 uppercase tracking-wider">DFC · 数字家族码</div>
            <div class="font-mono font-bold text-gray-800 text-base break-all">{{ petDFC }}</div>
          </div>
        </div>
      </div>

      <!-- 成长档案 -->
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
