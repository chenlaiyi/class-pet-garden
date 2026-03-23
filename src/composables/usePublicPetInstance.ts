import { ref } from 'vue'
import axios from 'axios'
import { getPetType } from '@/data/pets'
import { getDemoPetDetail } from '@/data/demoPets'

const publicApi = axios.create({
  baseURL: '/api'
})

export function usePublicPetInstance() {
  const item = ref<any>(null)
  const loading = ref(false)
  const error = ref('')

  async function loadByCode(code: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await publicApi.get(`/pet-instances/code/${code}`)
      const raw = res.data.item
      const template = getPetType(raw.template_id)
      item.value = template ? { ...raw, template } : raw
      return item.value
    } catch (e) {
      const fallback = getDemoPetDetail(code)
      if (fallback) {
        item.value = fallback
        return item.value
      }
      error.value = '未找到宠物实例'
      item.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function loadByShortCode(shortCode: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await publicApi.get(`/pet-instances/resolve/${shortCode}`)
      const raw = res.data.item
      const template = getPetType(raw.template_id)
      item.value = template ? { ...raw, template } : raw
      return item.value
    } catch (e) {
      error.value = '未找到宠物入口'
      item.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    item,
    loading,
    error,
    loadByCode,
    loadByShortCode
  }
}
