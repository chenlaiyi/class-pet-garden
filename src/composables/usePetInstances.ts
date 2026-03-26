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
  adopted_at?: number
  created_at?: number
}

export interface PetIdentity {
  id: string
  code: string
  displayName: string
  templateId: string
  level: number
  exp: number
  status: 'alive' | 'injured' | 'dead'
  studentName: string | null
  className: string | null
  ownerName: string | null
  adoptedAt: string | null
  createdAt: string | null
  qrUrl: string
  shortCode: string | null
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

  async function getPetInstance(id: string) {
    const res = await api.get(`/pet-instances/${id}`)
    return res.data.item as PetInstance
  }

  async function updatePetInstance(id: string, data: { displayName?: string; level?: number; exp?: number; status?: string }) {
    const res = await api.put(`/pet-instances/${id}`, data)
    await loadPetInstances()
    return res.data
  }

  async function deletePetInstance(id: string) {
    const res = await api.delete(`/pet-instances/${id}`)
    await loadPetInstances()
    return res.data
  }

  async function bindPetToStudent(petInstanceId: string, studentId: string) {
    const res = await api.post('/pet-instances/bind', { petInstanceId, studentId })
    return res.data
  }

  async function unbindPet(petInstanceId: string) {
    const res = await api.post('/pet-instances/unbind', { petInstanceId })
    return res.data
  }

  async function getPetIdentity(id: string) {
    const res = await api.get(`/pet-instances/${id}/identity`)
    return res.data.item as PetIdentity
  }

  async function resolveByShortCode(code: string) {
    const res = await api.get(`/pet-instances/resolve/${code}`)
    return res.data.item as PetInstance
  }

  async function loadByCode(code: string) {
    const res = await api.get(`/pet-instances/code/${code}`)
    return res.data.item as PetInstance
  }

  return {
    items,
    loading,
    loadPetInstances,
    createPetInstance,
    getPetInstance,
    updatePetInstance,
    deletePetInstance,
    bindPetToStudent,
    unbindPet,
    getPetIdentity,
    resolveByShortCode,
    loadByCode
  }
}
