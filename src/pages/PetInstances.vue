<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'
import PetImage from '@/components/PetImage.vue'
import PetAnimatedAsset from '@/components/PetAnimatedAsset.vue'
import { getPetLevelImage, getPetType, PET_TYPES } from '@/data/pets'
import { hasPetAnimation } from '@/data/petAnimations'
import { usePetInstances } from '@/composables/usePetInstances'
import { useClasses } from '@/composables/useClasses'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { items, loading, loadPetInstances, createPetInstance, deletePetInstance } = usePetInstances()
const { currentClass } = useClasses()
const toast = useToast()
const { confirmDialog, showConfirm, closeConfirm } = useConfirm()

const showCreateModal = ref(false)
const createPetId = ref('')
const createDisplayName = ref('')

function getPetTemplate(templateId: string) {
  return getPetType(templateId)
}

function canAnimate(templateId?: string) {
  return templateId ? hasPetAnimation(templateId, 'idle') : false
}

function openCreateModal() {
  createPetId.value = ''
  createDisplayName.value = ''
  showCreateModal.value = true
}

async function handleCreate() {
  if (!createPetId.value || !createDisplayName.value.trim()) {
    toast.warning('请选择宠物并输入名称')
    return
  }
  if (!currentClass.value) {
    toast.warning('请先选择班级')
    return
  }
  try {
    const template = getPetType(createPetId.value)
    await createPetInstance({
      templateId: createPetId.value,
      displayName: createDisplayName.value.trim(),
      studentId: '', // 无学生关联时为空
      classId: currentClass.value.id
    })
    toast.success(`创建成功！${template?.name || createPetId.value} 已加入你的宠物库`)
    showCreateModal.value = false
  } catch (error: any) {
    toast.error(error.response?.data?.error || '创建失败')
  }
}

function confirmDelete(pet: any) {
  showConfirm({
    title: '删除宠物',
    message: `确定删除 "${pet.display_name}" 吗？此操作不可恢复。`,
    confirmText: '删除',
    type: 'danger',
    onConfirm: async () => {
      try {
        await deletePetInstance(pet.id)
        toast.success('删除成功')
      } catch (error: any) {
        toast.error(error.response?.data?.error || '删除失败')
      }
    }
  })
}

onMounted(async () => {
  await loadPetInstances()
})
</script>

<template>
  <PageLayout>
    <div class="max-w-5xl mx-auto">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2"><span class="text-3xl">🐾</span> 我的宠物</h1>
          <p class="text-gray-500 text-sm mt-1" v-if="items.length > 0">共 {{ items.length }} 只宠物</p>
        </div>
        <button @click="openCreateModal" class="px-4 py-2 text-sm text-white bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl font-medium shadow-sm hover:shadow-md transition-all">➕ 创建宠物</button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="text-6xl animate-bounce mb-4">🐾</div>
          <div class="text-gray-500">加载中...</div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="items.length === 0" class="text-center py-20 bg-white rounded-2xl shadow-sm">
        <div class="text-6xl mb-4">🐾</div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">还没有宠物</h3>
        <p class="text-gray-500 mb-6">创建你的第一只宠物吧！</p>
        <button @click="openCreateModal" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold hover:shadow-lg transition-all">➕ 创建宠物</button>
      </div>

      <!-- 宠物列表 -->
      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="pet in items" :key="pet.id" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
          <!-- 宠物头像 -->
          <div class="relative h-36 bg-gradient-to-br from-orange-100 via-pink-50 to-purple-50 flex items-center justify-center">
            <PetAnimatedAsset
              v-if="canAnimate(pet.template_id)"
              :pet-id="pet.template_id"
              :level="pet.level"
              mode="idle"
              size="full"
              :animation-enabled="true"
            />
            <PetImage v-else :src="getPetLevelImage(pet.template_id, pet.level)" size="full" :rounded="false" :fallback-emoji="getPetTemplate(pet.template_id)?.placeholder" />
            <!-- 等级标签 -->
            <div class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/80 text-xs font-bold text-orange-500 shadow">Lv.{{ pet.level }}</div>
            <!-- 状态标签 -->
            <div v-if="pet.status !== 'alive'" class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-100 text-xs font-bold text-red-500">{{ pet.status === 'injured' ? '轻伤' : '休眠' }}</div>
          </div>
          <!-- 信息 -->
          <div class="p-4">
            <div class="font-bold text-gray-800 mb-1">{{ pet.display_name }}</div>
            <div class="text-xs text-gray-500 mb-3">{{ pet.code }}</div>
            <div class="flex flex-wrap gap-1 mb-3">
              <span class="px-2 py-0.5 rounded-full bg-orange-50 text-xs text-orange-500">{{ getPetTemplate(pet.template_id)?.name }}</span>
              <span v-if="pet.student_name" class="px-2 py-0.5 rounded-full bg-purple-50 text-xs text-purple-500">绑定: {{ pet.student_name }}</span>
              <span v-else class="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-400">未绑定</span>
            </div>
            <div class="flex gap-2">
              <RouterLink :to="`/p/${pet.code}`" class="flex-1 text-center text-xs py-1.5 bg-orange-50 text-orange-500 rounded-lg hover:bg-orange-100 transition-colors font-medium">查看主页</RouterLink>
              <RouterLink :to="`/card/${pet.code}`" class="flex-1 text-center text-xs py-1.5 bg-purple-50 text-purple-500 rounded-lg hover:bg-purple-100 transition-colors font-medium">身份卡</RouterLink>
              <button @click="confirmDelete(pet)" class="px-3 py-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建宠物弹窗 -->
    <Transition name="modal">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showCreateModal = false">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <h3 class="text-lg font-bold mb-4">➕ 创建宠物</h3>

          <!-- 选择宠物类型 -->
          <div class="mb-4">
            <label class="block text-sm text-gray-500 mb-2">选择宠物</label>
            <div class="grid grid-cols-4 gap-2 max-h-48 overflow-auto">
              <button
                v-for="pet in PET_TYPES"
                :key="pet.id"
                @click="createPetId = pet.id"
                class="rounded-xl p-2 text-center border-2 transition-all"
                :class="createPetId === pet.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'"
              >
                <div class="text-2xl mb-1">{{ pet.placeholder }}</div>
                <div class="text-xs text-gray-600">{{ pet.name }}</div>
              </button>
            </div>
          </div>

          <!-- 宠物名称 -->
          <div class="mb-6">
            <label class="block text-sm text-gray-500 mb-1">宠物名称</label>
            <input v-model="createDisplayName" type="text" placeholder="给你的宠物起个名字" class="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400" @keyup.enter="handleCreate" />
          </div>

          <div class="flex justify-end gap-2">
            <button @click="showCreateModal = false" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">取消</button>
            <button @click="handleCreate" class="px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl text-sm font-medium shadow-sm">创建</button>
          </div>
        </div>
      </div>
    </Transition>

    <ConfirmDialog
      :show="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      :type="confirmDialog.type"
      @confirm="confirmDialog.onConfirm"
      @cancel="closeConfirm"
    />
  </PageLayout>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
