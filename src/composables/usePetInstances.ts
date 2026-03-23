import { ref } from 'vue'
import { useAuth } from './useAuth'

export interface PetInstance {
  id: string
  template_id: string
  code: string
  display_name: string
  student_id: string | null
  class_id: string | null
  student_name?: string
  class_name?: string
  level: number
  exp: number
  status: 'alive' | 'injured' | 'dead'
  short_code?: string
}

const items = ref<PetInstance[]>([])
const loading = ref(false)

export function usePetInstances() {
  const { api } = useAuth()

  async function loadPetInstances() {
    loading.value = true
    try {
      const res = await api.get('/pet-instances')
      items.value = res.data.items || []
    } finally {
      loading.value = false
    }
  }

  async function createPetInstance(payload: { templateId: string; displayName: string; studentId: string; classId: string }) {
    const res = await api.post('/pet-instances', payload)
    await loadPetInstances()
    return res.data
  }

  return {
    items,
    loading,
    loadPetInstances,
    createPetInstance
  }
}
