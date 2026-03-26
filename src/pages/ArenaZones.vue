<script setup lang="ts">
import PageLayout from '@/components/layout/PageLayout.vue'

const zones = [
  { id: 1, name: '方块战场', icon: '🟦', desc: '俄罗斯方块对战', color: 'from-blue-500 to-cyan-400', status: '开放', players: 12, maxPlayers: 50, entry: 5, reward: 10 },
  { id: 2, name: '竞速赛道', icon: '🏁', desc: '蛋仔派对竞速', color: 'from-orange-500 to-yellow-400', status: '开放', players: 0, maxPlayers: 50, entry: 5, reward: 10 },
  { id: 3, name: '问答星球', icon: '🧠', desc: '知识问答竞赛', color: 'from-purple-500 to-pink-400', status: '敬请期待', players: 0, maxPlayers: 50, entry: 5, reward: 10 },
  { id: 4, name: '迷宫探险', icon: '🗺️', desc: '谁的宠物先到终点', color: 'from-green-500 to-teal-400', status: '敬请期待', players: 0, maxPlayers: 50, entry: 5, reward: 10 },
  { id: 5, name: '射击靶场', icon: '🎯', desc: '精准射击对决', color: 'from-red-500 to-orange-400', status: '敬请期待', players: 0, maxPlayers: 50, entry: 5, reward: 10 },
  { id: 6, name: '跳绳大赛', icon: '💃', desc: '谁跳得更多', color: 'from-pink-500 to-rose-400', status: '敬请期待', players: 0, maxPlayers: 50, entry: 5, reward: 10 },
  { id: 7, name: '记忆翻牌', icon: '🃏', desc: '比谁的记性好', color: 'from-indigo-500 to-blue-400', status: '敬请期待', players: 0, maxPlayers: 50, entry: 5, reward: 10 },
  { id: 8, name: '拔河对决', icon: '🤼', desc: '力量大比拼', color: 'from-amber-500 to-yellow-300', status: '敬请期待', players: 0, maxPlayers: 50, entry: 5, reward: 10 },
  { id: 9, name: '猜拳竞技', icon: '✊', desc: '石头剪刀布', color: 'from-teal-500 to-green-400', status: '敬请期待', players: 0, maxPlayers: 50, entry: 5, reward: 10 },
  { id: 10, name: '王者挑战', icon: '👑', desc: '全服最强宠物赛', color: 'from-yellow-400 to-amber-300', status: '敬请期待', players: 0, maxPlayers: 50, entry: 5, reward: 10 },
]
</script>

<template>
  <PageLayout>
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- 头部 -->
      <div class="text-center">
        <div class="text-5xl mb-2">🏆</div>
        <h1 class="text-4xl font-black text-gray-900">宠物竞技场</h1>
        <p class="text-gray-500 mt-2">用积分参赛，赢取丰厚奖励！每场比赛扣 <span class="text-orange-500 font-bold">5 积分</span>，获胜奖励 <span class="text-green-500 font-bold">10 积分</span></p>
      </div>

      <!-- 积分规则卡片 -->
      <div class="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 rounded-3xl p-5 flex flex-wrap gap-6 justify-center text-sm">
        <div class="flex items-center gap-2">
          <span class="text-xl">🎟️</span>
          <span>参赛门槛：<strong class="text-orange-600">5 积分</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xl">🏆</span>
          <span>获胜奖励：<strong class="text-green-600">+10 积分</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xl">❌</span>
          <span>失败/平局：<strong class="text-gray-500">积分不返还</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xl">🎮</span>
          <span>支持<strong>手柄</strong>或<strong>键盘</strong>操作</span>
        </div>
      </div>

      <!-- 区域网格 -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <RouterLink
          v-for="zone in zones"
          :key="zone.id"
          :to="zone.status === '开放' ? `/arena/zone/${zone.id}` : '#'"
          class="rounded-3xl border-2 p-5 flex flex-col items-center text-center transition-all"
          :class="zone.status === '开放'
            ? `bg-gradient-to-br ${zone.color} text-white border-transparent hover:scale-105 hover:shadow-xl`
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'"
        >
          <div class="text-4xl mb-2">{{ zone.icon }}</div>
          <div class="font-bold text-base">{{ zone.name }}</div>
          <div class="text-xs mt-1 opacity-80">{{ zone.desc }}</div>
          <div v-if="zone.status === '开放'" class="mt-3 text-xs bg-white/20 rounded-full px-3 py-1">
            🟢 开放中
          </div>
          <div v-else class="mt-3 text-xs bg-gray-200 text-gray-500 rounded-full px-3 py-1">
            🔒 敬请期待
          </div>
          <div v-if="zone.status === '开放'" class="mt-2 text-xs">
            {{ zone.players }} 人在场
          </div>
        </RouterLink>
      </div>

      <!-- 手柄说明 -->
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>🎮</span> 手柄操作说明
        </h3>
        <div class="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div class="flex items-start gap-3">
            <div class="flex flex-col gap-1">
              <span class="bg-gray-100 rounded px-2 py-0.5 text-xs font-mono">← →</span>
              <span class="bg-gray-100 rounded px-2 py-0.5 text-xs font-mono">↓</span>
            </div>
            <span>方向移动 / 加速下落</span>
          </div>
          <div class="flex items-start gap-3">
            <div class="flex flex-col gap-1">
              <span class="bg-gray-100 rounded px-2 py-0.5 text-xs font-mono">↑</span>
              <span class="bg-gray-100 rounded px-2 py-0.5 text-xs font-mono">Z</span>
            </div>
            <span>旋转方块</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="bg-gray-100 rounded px-2 py-0.5 text-xs font-mono">空格</span>
            <span>立即下落（Hard Drop）</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="bg-gray-100 rounded px-2 py-0.5 text-xs font-mono">Enter</span>
            <span>开始 / 暂停</span>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>
