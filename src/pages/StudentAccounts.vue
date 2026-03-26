<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import PageLayout from '@/components/layout/PageLayout.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const { api, isAdmin } = useAuth()
const toast = useToast()
const { confirmDialog, showConfirm, closeConfirm } = useConfirm()

interface StudentAccount {
  id: string
  name: string
  student_no: string
  total_points: number
  pet_type: string
  pet_level: number
  pet_status: string
  account_id: string | null
  account_username: string | null
}

const students = ref<StudentAccount[]>([])
const loading = ref(false)

// 创建账号
const showCreateModal = ref(false)
const createStudentId = ref('')
const createPassword = ref('')
const createStudentName = ref('')
const creating = ref(false)

async function loadStudents() {
  loading.value = true
  try {
    const res = await api.get('/student-accounts')
    students.value = res.data.students
  } catch {
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

function openCreateModal(student: StudentAccount) {
  createStudentId.value = student.id
  createStudentName.value = student.name
  createPassword.value = ''
  showCreateModal.value = true
}

async function handleCreate() {
  if (!createPassword.value || createPassword.value.length < 4) {
    toast.warning('密码至少4位')
    return
  }
  creating.value = true
  try {
    await api.post('/student-accounts', {
      studentId: createStudentId.value,
      password: createPassword.value
    })
    toast.success(`已为 ${createStudentName.value} 创建账号`)
    showCreateModal.value = false
    await loadStudents()
  } catch (err: any) {
    toast.error(err.response?.data?.error || '创建失败')
  } finally {
    creating.value = false
  }
}

function openDeleteModal(student: StudentAccount) {
  showConfirm({
    title: '删除学生账号',
    message: `确定删除 ${student.name} 的登录账号？删除后学生将无法登录，但宠物数据保留。`,
    confirmText: '删除',
    type: 'danger',
    onConfirm: async () => {
      try {
        await api.delete(`/student-accounts/${student.id}`)
        toast.success('已删除')
        await loadStudents()
      } catch {
        toast.error('删除失败')
      }
    }
  })
}

function copyAccount(username: string) {
  navigator.clipboard.writeText(username).then(() => {
    toast.success('账号已复制')
  })
}

onMounted(() => {
  if (!isAdmin.value) {
    toast.error('需要管理员权限')
    return
  }
  loadStudents()
})
</script>

<template>
  <PageLayout>
    <div class="max-w-4xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span class="text-3xl">👥</span> 学生账号管理
        </h1>
        <p class="text-gray-500 text-sm mt-1">为已添加的学生创建登录账号，学生可用账号密码登录查看自己的宠物</p>
      </div>

      <!-- 学生列表 -->
      <div v-if="loading" class="text-center py-20 text-gray-500">
        <div class="text-5xl mb-4 animate-bounce">⏳</div>
        <div>加载中...</div>
      </div>

      <div v-else-if="students.length === 0" class="text-center py-20 bg-white rounded-2xl shadow-sm">
        <div class="text-6xl mb-4">📋</div>
        <div class="text-gray-500 mb-2">还没有学生</div>
        <router-link to="/students" class="text-orange-500 hover:text-orange-600 font-medium">去学生管理添加学生 →</router-link>
      </div>

      <div v-else class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="grid grid-cols-6 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
          <div class="col-span-2">学生姓名</div>
          <div class="col-span-1">账号状态</div>
          <div class="col-span-1">账号</div>
          <div class="col-span-1">宠物</div>
          <div class="col-span-1 text-right">操作</div>
        </div>

        <div
          v-for="student in students"
          :key="student.id"
          class="grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors items-center"
        >
          <!-- 学生姓名 -->
          <div class="col-span-2 flex items-center gap-2">
            <span class="font-medium text-gray-800">{{ student.name }}</span>
            <span v-if="student.student_no" class="text-xs text-gray-400">{{ student.student_no }}</span>
          </div>

          <!-- 账号状态 -->
          <div class="col-span-1">
            <span v-if="student.account_id" class="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span> 已开户
            </span>
            <span v-else class="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
              <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> 未开户
            </span>
          </div>

          <!-- 账号 -->
          <div class="col-span-1">
            <span v-if="student.account_username" class="text-sm font-mono text-gray-600">{{ student.account_username }}</span>
            <span v-else class="text-sm text-gray-400">—</span>
          </div>

          <!-- 宠物 -->
          <div class="col-span-1">
            <span v-if="student.pet_type" class="text-sm text-orange-500">Lv.{{ student.pet_level }} {{ student.pet_type }}</span>
            <span v-else class="text-sm text-gray-400">未领养</span>
          </div>

          <!-- 操作 -->
          <div class="col-span-1 text-right flex justify-end gap-1">
            <!-- 已开户：显示账号 + 删除 -->
            <template v-if="student.account_id">
              <button
                @click="copyAccount(student.account_username!)"
                class="text-xs text-blue-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                title="复制账号"
              >📋</button>
              <button
                @click="openDeleteModal(student)"
                class="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                title="删除账号"
              >🗑️</button>
            </template>
            <!-- 未开户：创建账号 -->
            <button
              v-else
              @click="openCreateModal(student)"
              class="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors font-medium"
            >
              ➕ 开户
            </button>
          </div>
        </div>
      </div>

      <!-- 密码提示 -->
      <div class="mt-4 text-xs text-gray-400 text-center">
        建议告知学生账号密码后，让学生自行修改为易记的密码
      </div>
    </div>

    <!-- 创建账号弹窗 -->
    <Transition name="modal">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showCreateModal = false">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <h3 class="text-lg font-bold mb-1">👥 为 {{ createStudentName }} 创建账号</h3>
          <p class="text-sm text-gray-500 mb-4">账号名将自动生成，密码由您设置</p>

          <div class="space-y-3">
            <div>
              <label class="block text-sm text-gray-600 mb-1">登录密码 <span class="text-red-500">*</span></label>
              <input
                v-model="createPassword"
                type="password"
                placeholder="至少4位"
                class="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-400 transition-colors"
                @keyup.enter="handleCreate"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button @click="showCreateModal = false" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">取消</button>
            <button
              @click="handleCreate"
              :disabled="creating"
              class="px-6 py-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {{ creating ? '创建中...' : '创建账号' }}
            </button>
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
.modal-enter-from > div, .modal-leave-to > div { transform: scale(0.95); }
</style>
