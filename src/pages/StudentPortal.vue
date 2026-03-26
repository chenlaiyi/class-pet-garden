<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { getPetLevelImage } from '@/data/pets'
import PageLayout from '@/components/layout/PageLayout.vue'

const { api, isStudent, logout } = useAuth()
const toast = useToast()
const router = useRouter()

const showJoinModal = ref(false)
const joinCode = ref('')
const joining = ref(false)

interface StudentData {
  id: string
  name: string
  class_id: string
  className: string
  total_points: number
  pet_type: string
  pet_level: number
  pet_exp: number
  pet_status: string
  records: EvaluationRecord[]
  petInstance: any
}

interface EvaluationRecord {
  id: string
  points: number
  reason: string
  category: string
  timestamp: number
}

const student = ref<StudentData | null>(null)
const loading = ref(false)

function getPetImage(petType: string, level: number): string {
  if (!petType) return ''
  const lv = Math.max(1, Math.min(8, level || 1))
  return getPetLevelImage(petType, lv)
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

async function loadStudentData() {
  loading.value = true
  try {
    const res = await api.get('/student-accounts/me')
    student.value = res.data.student
  } catch {
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function handleJoinClass() {
  if (!joinCode.value.trim()) { toast.warning('请输入班级邀请码'); return }
  joining.value = true
  try {
    await api.post('/classes/join', { inviteCode: joinCode.value.trim() })
    toast.success('加入班级成功！')
    showJoinModal.value = false
    joinCode.value = ''
    await loadStudentData()
  } catch (err: any) {
    toast.error(err.response?.data?.error || '加入班级失败')
  } finally {
    joining.value = false
  }
}

function handleLogout() {
  logout()
  router.push('/')
}

onMounted(() => {
  if (!isStudent.value) {
    toast.error('需要学生账号登录')
    router.push('/')
    return
  }
  loadStudentData()
})
</script>

<template>
  <PageLayout>
    <div class="max-w-lg mx-auto">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-20">
        <div class="text-5xl mb-4 animate-bounce">⏳</div>
        <div class="text-gray-500">加载中...</div>
      </div>

      <div v-else-if="student">
        <!-- 顶部：姓名 + 班级 -->
        <div class="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-2xl p-6 mb-4 text-white shadow-lg">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-3xl font-bold">{{ student.name }}</div>
              <div class="text-white/80 text-sm mt-1">📚 {{ student.className || '未分班' }}</div>
            </div>
            <button @click="handleLogout" class="text-white/70 hover:text-white text-sm px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
              退出登录
            </button>
          </div>
          <div class="flex items-center gap-4 mt-4">
            <div class="bg-white/20 rounded-xl px-4 py-2 text-center">
              <div class="text-2xl font-bold">{{ student.total_points }}</div>
              <div class="text-xs text-white/80">我的积分</div>
            </div>
            <div v-if="student.pet_type" class="bg-white/20 rounded-xl px-4 py-2 text-center">
              <div class="text-2xl font-bold">Lv.{{ student.pet_level }}</div>
              <div class="text-xs text-white/80">宠物等级</div>
            </div>
          </div>
        </div>

        <!-- 宠物卡片 -->
        <div v-if="student.pet_type" class="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center shadow-inner">
              <img :src="getPetImage(student.pet_type, student.pet_level)" class="w-full h-full object-contain" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xl font-bold text-gray-800">{{ student.pet_type }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="student.pet_status === 'alive' ? 'bg-green-100 text-green-700' : student.pet_status === 'injured' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'">
                  {{ student.pet_status === 'alive' ? '健康' : student.pet_status === 'injured' ? '受伤' : '休息中' }}
                </span>
              </div>
              <div class="text-sm text-gray-500">等级 Lv.{{ student.pet_level }} · 经验 {{ student.pet_exp }}</div>
              <div class="mt-2 w-full bg-gray-100 rounded-full h-2">
                <div
                  class="bg-gradient-to-r from-orange-400 to-pink-500 h-2 rounded-full transition-all"
                  :style="{ width: Math.min(100, (student.pet_exp / ((student.pet_level + 1) * 40)) * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 竞技场入口 -->
        <div v-if="student.pet_type" class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 mb-4 text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-lg font-bold mb-1">🎮 竞技场对战</div>
              <div class="text-blue-100 text-sm">用宠物参加俄罗斯方块对战，胜者加积分！</div>
            </div>
            <router-link
              to="/arena"
              class="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold text-sm shadow hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              进入
            </router-link>
          </div>
        </div>

        <!-- 无班级提示 -->
        <div v-if="!student.class_id" class="bg-amber-50 rounded-2xl p-5 mb-4 border border-amber-200">
          <div class="text-amber-700 font-bold mb-2">⚠️ 还未加入班级</div>
          <p class="text-amber-600 text-sm mb-3">请输入老师分享的班级邀请码，加入后才能看到班级里的同学和宠物</p>
          <button
            @click="showJoinModal = true"
            class="bg-amber-500 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors"
          >
            🔑 输入邀请码
          </button>
        </div>

        <!-- 无宠物提示 -->
        <div v-else-if="!student.pet_type" class="bg-white rounded-2xl shadow-sm p-6 mb-4 text-center">
          <div class="text-5xl mb-3">🐾</div>
          <div class="text-gray-500 mb-1">还没有领养宠物</div>
          <div class="text-sm text-gray-400">让老师帮你领养一只吧！</div>
        </div>

        <!-- 评价记录 -->
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 class="font-bold text-gray-700">📋 最近评价</h3>
          </div>
          <div v-if="student.records && student.records.length > 0" class="divide-y divide-gray-50">
            <div v-for="record in student.records.slice(0, 20)" :key="record.id" class="px-4 py-3 flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-700">{{ record.reason }}</div>
                <div class="text-xs text-gray-400 mt-0.5">{{ formatTime(record.timestamp) }}</div>
              </div>
              <div class="font-bold" :class="record.points > 0 ? 'text-green-500' : 'text-red-500'">
                {{ record.points > 0 ? '+' : '' }}{{ record.points }}
              </div>
            </div>
          </div>
          <div v-else class="px-4 py-8 text-center text-gray-400 text-sm">
            暂无评价记录
          </div>
        </div>
      </div>
    </div>

    <!-- 加入班级弹窗 -->
    <Transition name="modal">
      <div v-if="showJoinModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showJoinModal = false">
        <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
          <h3 class="text-lg font-bold mb-1">🔑 加入班级</h3>
          <p class="text-sm text-gray-500 mb-4">请输入老师分享的班级邀请码</p>
          <input
            v-model="joinCode"
            type="text"
            placeholder="例如：ABC12345"
            maxlength="12"
            class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-4 text-center font-mono uppercase tracking-widest text-lg focus:outline-none focus:border-orange-400 transition-colors"
            @keyup.enter="handleJoinClass"
          />
          <div class="flex gap-3">
            <button @click="showJoinModal = false" class="flex-1 py-2.5 text-gray-500 rounded-xl font-medium hover:bg-gray-100 transition-colors">取消</button>
            <button
              @click="handleJoinClass"
              :disabled="joining || !joinCode.trim()"
              class="flex-1 py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all"
            >
              {{ joining ? '加入中...' : '加入' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </PageLayout>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from > div, .modal-leave-to > div { transform: scale(0.95); }
</style>
