<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [inviteCode: string]
}>()

const toast = useToast()
const inviteCode = ref('')
const loading = ref(false)

watch(() => props.show, (show) => {
  if (show) inviteCode.value = ''
})

async function submit() {
  if (!inviteCode.value.trim()) {
    toast.warning('请输入班级邀请码')
    return
  }
  loading.value = true
  emit('submit', inviteCode.value.trim().toUpperCase())
  loading.value = false
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
          <span class="text-2xl">🔑</span> 加入班级
        </h3>
        <p class="text-sm text-gray-500 mb-4">请输入老师分享的班级邀请码</p>
        <input
          v-model="inviteCode"
          type="text"
          placeholder="例如：ABC123"
          maxlength="8"
          class="w-full border-2 border-gray-200 rounded-xl px-5 py-3 mb-6 text-lg font-mono text-center tracking-widest uppercase focus:outline-none focus:border-orange-400 transition-colors"
          @keyup.enter="$emit('close')"
        />
        <div class="flex gap-3 justify-end">
          <button @click="$emit('close')" class="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors">取消</button>
          <button
            class="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            :disabled="!inviteCode.trim()"
            @click="submit"
          >
            加入
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
