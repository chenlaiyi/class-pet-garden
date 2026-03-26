<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'
import PetImage from '@/components/PetImage.vue'
import PetAnimatedAsset from '@/components/PetAnimatedAsset.vue'
import { getPetLevelImage, getPetType, } from '@/data/pets'
import { hasPetAnimation } from '@/data/petAnimations'
import { usePublicPetInstance } from '@/composables/usePublicPetInstance'
import { usePetInstances } from '@/composables/usePetInstances'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const toast = useToast()
const { item: rawPet, loadByCode } = usePublicPetInstance()
const { getPetIdentity } = usePetInstances()

const identity = ref<any>(null)
const loadingIdentity = ref(false)

const code = computed(() => String(route.params.code || route.params.id || ''))

const template = computed(() => {
  const pet = rawPet.value
  if (!pet) return null
  if (pet.template) return pet.template
  return getPetType(pet.template_id)
})

function statusLabel(status?: string) {
  if (status === 'injured') return '轻伤中'
  if (status === 'dead') return '休眠中'
  return '状态良好'
}

function rarityLabel(rarity?: string) {
  if (rarity === 'epic') return '超稀有'
  if (rarity === 'rare') return '稀有'
  return '普通'
}

function expProgress(exp: number, level: number) {
  const thresholds = [40, 60, 80, 100, 120, 140, 160]
  if (level < 1 || level > 8) return 0
  if (level === 8) return 100
  const cur = level > 1 ? thresholds[level - 2] : 0
  const next = thresholds[level - 1]
  return Math.round(((exp - cur) / (next - cur)) * 100)
}

function canAnimate(petId?: string) {
  return petId ? hasPetAnimation(petId, 'idle') : false
}

async function loadIdentityData(id: string) {
  loadingIdentity.value = true
  try {
    identity.value = await getPetIdentity(id)
  } catch {
    identity.value = null
  } finally {
    loadingIdentity.value = false
  }
}

async function copyLink() {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    toast.success('链接已复制到剪贴板')
  } catch {
    toast.error('复制失败')
  }
}

onMounted(async () => {
  const c = code.value
  if (!c) return
  await loadByCode(c)
  if (rawPet.value?.id) {
    await loadIdentityData(rawPet.value.id)
  }
})
</script>

<template>
  <PageLayout>
    <div v-if="rawPet" class="max-w-6xl mx-auto space-y-6">
      <!-- 顶部卡片 -->
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100">
        <div class="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 p-6 text-white">
          <div class="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div class="w-40 h-40 rounded-3xl bg-white/20 backdrop-blur-sm overflow-hidden shadow-lg flex items-center justify-center">
              <PetAnimatedAsset
                v-if="canAnimate(template?.id)"
                :pet-id="template?.id"
                :level="rawPet.level"
                mode="idle"
                size="full"
                :animation-enabled="true"
              />
              <PetImage v-else :src="getPetLevelImage(rawPet.template_id, rawPet.level)" :alt="rawPet.display_name" size="full" :rounded="false" :fallback-emoji="template?.placeholder" />
            </div>
            <div class="flex-1 text-center md:text-left">
              <div class="text-sm text-white/80 mb-1">宠物数字身份卡</div>
              <h1 class="text-3xl font-bold mb-2">{{ rawPet.display_name }}</h1>
              <div class="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                <span class="px-3 py-1 rounded-full bg-white/20 text-sm">编号 {{ rawPet.code }}</span>
                <span class="px-3 py-1 rounded-full bg-white/20 text-sm">{{ template?.name }}</span>
                <span class="px-3 py-1 rounded-full bg-white/20 text-sm">Lv.{{ rawPet.level }}</span>
                <span class="px-3 py-1 rounded-full bg-white/20 text-sm">{{ rarityLabel(template?.rarity) }}</span>
              </div>
              <p class="text-lg text-white/90">{{ template?.description }}</p>
            </div>
          </div>
        </div>

        <div class="p-6 grid md:grid-cols-3 gap-4">
          <div class="rounded-2xl bg-orange-50 p-4 border border-orange-100">
            <div class="text-sm text-gray-500 mb-1">主人</div>
            <div class="text-xl font-bold text-gray-800">{{ identity?.studentName || rawPet.student_name || '未绑定' }}</div>
          </div>
          <div class="rounded-2xl bg-pink-50 p-4 border border-pink-100">
            <div class="text-sm text-gray-500 mb-1">班级</div>
            <div class="text-xl font-bold text-gray-800">{{ identity?.className || rawPet.class_name || '未绑定' }}</div>
          </div>
          <div class="rounded-2xl bg-purple-50 p-4 border border-purple-100">
            <div class="text-sm text-gray-500 mb-1">当前状态</div>
            <div class="text-xl font-bold text-gray-800">{{ statusLabel(rawPet.status) }}</div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- 成长档案 -->
        <div class="lg:col-span-2 bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">宠物成长档案</h2>
          <div class="space-y-4">
            <!-- 成长进度 -->
            <div class="rounded-2xl border border-gray-100 p-4 bg-gray-50">
              <div class="flex justify-between text-sm text-gray-500 mb-2">
                <span>经验值</span>
                <span>{{ rawPet.exp }} EXP</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-gradient-to-r from-orange-400 to-pink-500 h-3 rounded-full transition-all" :style="{ width: expProgress(rawPet.exp, rawPet.level) + '%' }"></div>
              </div>
              <div class="text-xs text-gray-400 mt-1 text-right">Lv.{{ rawPet.level }} → Lv.{{ Math.min(8, rawPet.level + 1) }}</div>
            </div>

            <!-- 宠物介绍 -->
            <div class="rounded-2xl border border-gray-100 p-4 bg-gray-50">
              <div class="text-sm text-gray-500 mb-2">宠物介绍</div>
              <div class="text-gray-700 leading-7">{{ template?.description }}</div>
            </div>

            <!-- 性格标签 -->
            <div class="rounded-2xl border border-gray-100 p-4 bg-gray-50">
              <div class="text-sm text-gray-500 mb-2">性格标签</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="tag in (template?.personality || [])" :key="tag" class="px-3 py-1 rounded-full bg-white shadow-sm text-sm text-gray-700">{{ tag }}</span>
              </div>
            </div>

            <!-- 领养信息 -->
            <div class="rounded-2xl border border-gray-100 p-4 bg-gray-50">
              <div class="text-sm text-gray-500 mb-2">领养信息</div>
              <div class="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <div>领养日期：{{ identity?.adoptedAt || '-' }}</div>
                <div>稀有度：{{ rarityLabel(template?.rarity) }}</div>
                <div>当前经验：{{ rawPet.exp }}</div>
                <div>宠物模板：{{ rawPet.template_id }}</div>
              </div>
            </div>

            <!-- 身份码 -->
            <div class="rounded-2xl border border-gray-100 p-4 bg-gradient-to-r from-orange-50 to-purple-50">
              <div class="text-sm text-gray-500 mb-2">数字身份码 DCI</div>
              <div class="font-mono font-bold text-gray-800 text-lg">DCI:PG-{{ rawPet.code }}</div>
              <div class="text-sm text-gray-500 mt-1">数字家族码 DFC</div>
              <div class="font-mono font-bold text-gray-800">DFC:{{ rawPet.template_id.toUpperCase() }}-{{ rawPet.code }}-{{ rawPet.level }}</div>
            </div>
          </div>
        </div>

        <!-- 右侧：二维码 + 操作 -->
        <div class="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 class="text-xl font-bold text-gray-800 mb-4">身份入口</h2>

          <!-- 二维码 -->
          <div v-if="identity?.qrUrl" class="rounded-3xl bg-gradient-to-br from-orange-50 to-pink-50 p-4 mb-5 flex flex-col items-center">
            <img :src="identity.qrUrl" alt="宠物身份二维码" class="w-44 h-44 rounded-2xl bg-white shadow p-2" />
            <div class="mt-2 text-xs text-gray-500 text-center">微信/支付宝扫一扫</div>
          </div>
          <div v-else class="rounded-3xl bg-gray-50 p-4 mb-5 flex items-center justify-center h-48 text-gray-400 text-sm">加载中...</div>

          <div class="space-y-3">
            <button @click="copyLink" class="block w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white text-center font-bold py-3 hover:shadow-md transition-all">📋 复制分享链接</button>
            <RouterLink :to="`/card/${rawPet.code}`" class="block w-full rounded-2xl bg-gradient-to-r from-purple-400 to-indigo-500 text-white text-center font-bold py-3 hover:shadow-md transition-all">查看身份卡</RouterLink>
            <RouterLink to="/preview" class="block w-full rounded-2xl bg-gray-100 text-gray-700 text-center font-bold py-3 hover:bg-gray-200 transition-all">返回宠物图鉴</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-10 text-center">
      <div class="text-6xl mb-4">🐾</div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">没有找到这只宠物</h1>
      <p class="text-gray-500 mb-6">该宠物编号不存在或已被删除。</p>
      <RouterLink to="/preview" class="inline-block px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold">回到图鉴</RouterLink>
    </div>
  </PageLayout>
</template>
