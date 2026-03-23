<script setup lang="ts">
import { ref, computed } from 'vue'
import { PET_TYPES, getPetLevelImage } from '@/data/pets'
import PetImage from '@/components/PetImage.vue'
import PetAnimatedAsset from '@/components/PetAnimatedAsset.vue'
import PageLayout from '@/components/layout/PageLayout.vue'

const categories = [
  { id: 'all', name: '全部', icon: '🌌' },
  { id: 'normal', name: '普通动物', icon: '🐾' },
  { id: 'mythical', name: '神兽', icon: '✨' }
]
const currentCategory = ref('all')
const selectedPet = ref<string | null>(null)
const selectedLevel = ref(1)

const normalPets = computed(() => PET_TYPES.filter(p => p.category === 'normal'))
const mythicalPets = computed(() => PET_TYPES.filter(p => p.category === 'mythical'))
const selectedPetData = computed(() => PET_TYPES.find(p => p.id === selectedPet.value) || null)

function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    1: 'from-slate-400 to-slate-500',
    2: 'from-sky-400 to-cyan-500',
    3: 'from-cyan-400 to-teal-500',
    4: 'from-violet-400 to-purple-500',
    5: 'from-fuchsia-400 to-pink-500',
    6: 'from-rose-400 to-red-500',
    7: 'from-amber-300 via-orange-400 to-rose-500',
    8: 'from-yellow-300 via-amber-400 to-orange-500'
  }
  return colors[level] || 'from-slate-400 to-slate-500'
}

function getLevelName(level: number): string {
  const names: Record<number, string> = { 1: '初生', 2: '成长', 3: '优秀', 4: '进阶', 5: '稀有', 6: '精英', 7: '史诗', 8: '传说' }
  return names[level] || `Lv.${level}`
}

function rarityText(rarity: string) {
  return rarity === 'epic' ? '超稀有' : rarity === 'rare' ? '稀有' : '普通'
}

function selectPet(petId: string) {
  selectedPet.value = petId
  selectedLevel.value = 1
}

function closeDetail() {
  selectedPet.value = null
}
</script>

<template>
  <PageLayout>
    <div class="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.25),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.25),_transparent_30%),linear-gradient(180deg,_#fff7ed_0%,_#fff_30%,_#faf5ff_100%)] border border-white/70 shadow-[0_25px_80px_rgba(251,146,60,0.12)] p-6 md:p-8">
      <div class="absolute -top-10 -left-10 w-40 h-40 bg-orange-200/30 blur-3xl rounded-full"></div>
      <div class="absolute top-1/3 -right-8 w-40 h-40 bg-fuchsia-200/30 blur-3xl rounded-full"></div>
      <div class="absolute bottom-0 left-1/3 w-52 h-52 bg-cyan-200/20 blur-3xl rounded-full"></div>

      <div class="relative z-10 mb-8">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-orange-100 text-sm text-orange-500 font-semibold mb-4 shadow-sm">
              <span>✨</span>
              <span>新版图鉴展示</span>
            </div>
            <h1 class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">宠物图鉴展示柜</h1>
            <p class="text-gray-500 text-base md:text-lg max-w-3xl leading-7">这一版先把“打开就明显不一样”的效果做出来：更强展示感、更有空间感、轻动画、更像宠物 IP 的展示页。</p>
          </div>
          <div class="flex gap-3 flex-wrap">
            <button
              v-for="cat in categories"
              :key="cat.id"
              @click="currentCategory = cat.id"
              class="px-5 py-3 rounded-2xl font-bold transition-all duration-300 border"
              :class="currentCategory === cat.id
                ? 'bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 text-white shadow-xl border-transparent scale-105'
                : 'bg-white/85 backdrop-blur text-gray-600 border-white hover:border-orange-200 hover:shadow-lg hover:-translate-y-0.5'"
            >
              <span class="mr-2">{{ cat.icon }}</span>{{ cat.name }}
            </button>
          </div>
        </div>
      </div>

      <section v-if="currentCategory === 'all' || currentCategory === 'normal'" class="relative z-10 mb-10">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xl shadow-lg">🐾</div>
          <div>
            <h2 class="text-2xl font-black text-gray-800">普通动物</h2>
            <p class="text-sm text-gray-500">更生活化、更亲近的小伙伴</p>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <button
            v-for="pet in normalPets"
            :key="pet.id"
            @click="selectPet(pet.id)"
            class="group relative rounded-[28px] p-[1px] bg-gradient-to-br from-white via-orange-100 to-pink-100 hover:from-orange-200 hover:via-pink-200 hover:to-purple-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_rgba(249,115,22,0.18)] text-left"
          >
            <div class="relative rounded-[28px] bg-white/95 backdrop-blur p-4 overflow-hidden min-h-[280px]">
              <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.16),_transparent_35%)]"></div>
              <div class="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-white shadow-sm text-[11px] font-bold text-gray-500">{{ rarityText(pet.rarity) }}</div>
              <div class="relative h-44 rounded-[24px] bg-gradient-to-br from-orange-50 via-white to-pink-50 border border-orange-100/60 overflow-hidden mb-4 flex items-center justify-center">
                <div class="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-orange-200/40 blur-xl"></div>
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,_rgba(255,255,255,0.95),_transparent_35%)]"></div>
                <div class="relative w-36 h-36 showcase-pet-shell floating-pet group-hover:scale-110 transition-transform duration-500">
                  <div class="showcase-ring"></div>
                  <div class="showcase-glow"></div>
                  <PetAnimatedAsset :pet-id="pet.id" :level="1" mode="idle" size="full" :rounded="false" :animation-enabled="true" :background="true" />
                </div>
              </div>
              <div class="relative">
                <div class="text-xl font-black text-gray-900 mb-1">{{ pet.name }}</div>
                <div class="text-sm text-gray-500 mb-3">{{ pet.personality.join(' / ') }}</div>
                <p class="text-sm text-gray-600 leading-6 line-clamp-3">{{ pet.description }}</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <section v-if="currentCategory === 'all' || currentCategory === 'mythical'" class="relative z-10">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center text-white text-xl shadow-lg">✨</div>
          <div>
            <h2 class="text-2xl font-black text-gray-800">神兽</h2>
            <p class="text-sm text-gray-500">拥有更强舞台感与光效氛围的高阶角色</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            v-for="pet in mythicalPets"
            :key="pet.id"
            @click="selectPet(pet.id)"
            class="group relative rounded-[32px] p-[1px] bg-gradient-to-br from-fuchsia-300 via-purple-300 to-cyan-300 hover:shadow-[0_30px_60px_rgba(147,51,234,0.22)] transition-all duration-300 hover:-translate-y-2 text-left overflow-hidden"
          >
            <div class="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.35),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.22),_transparent_25%),radial-gradient(circle_at_50%_80%,_rgba(34,211,238,0.22),_transparent_28%)]"></div>
            <div class="relative rounded-[32px] min-h-[320px] overflow-hidden bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(250,245,255,0.94))] border border-white/40 p-6">
              <div class="absolute inset-0 mythic-particles"></div>
              <div class="absolute top-5 right-5 px-3 py-1 rounded-full bg-white/85 shadow text-xs font-black text-fuchsia-600">超稀有</div>
              <div class="flex flex-col md:flex-row gap-6 items-center relative z-10">
                <div class="w-full md:w-1/2 h-56 rounded-[28px] bg-[radial-gradient(circle_at_50%_25%,_rgba(255,255,255,0.95),_transparent_32%),linear-gradient(135deg,_rgba(250,232,255,0.85),_rgba(224,231,255,0.85))] border border-white/60 overflow-hidden flex items-center justify-center relative shadow-inner">
                  <div class="absolute bottom-5 left-1/2 -translate-x-1/2 w-28 h-8 rounded-full bg-fuchsia-300/40 blur-2xl"></div>
                  <div class="relative w-44 h-44 showcase-pet-shell showcase-pet-shell--mythic floating-mythic group-hover:scale-110 transition-transform duration-500">
                    <div class="showcase-ring"></div>
                    <div class="showcase-glow"></div>
                    <PetAnimatedAsset :pet-id="pet.id" :level="1" mode="emotion" size="full" :rounded="false" :animation-enabled="true" :background="true" />
                  </div>
                </div>
                <div class="w-full md:w-1/2 relative z-10">
                  <div class="text-3xl font-black text-gray-900 mb-2">{{ pet.name }}</div>
                  <div class="text-sm text-fuchsia-500 font-bold tracking-wide mb-4">{{ pet.personality.join(' · ') }}</div>
                  <p class="text-gray-600 leading-7 mb-5">{{ pet.description }}</p>
                  <div class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 shadow-sm text-sm text-gray-700 font-medium">
                    <span>进入详情预览</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>
      </section>
    </div>

    <Transition name="modal">
      <div v-if="selectedPetData" class="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4" @click.self="closeDetail">
        <div class="w-full max-w-6xl max-h-[92vh] overflow-auto rounded-[36px] bg-[linear-gradient(180deg,_rgba(255,247,237,0.98),_rgba(255,255,255,0.98)_35%,_rgba(250,245,255,0.98)_100%)] border border-white/70 shadow-[0_40px_120px_rgba(15,23,42,0.35)] overflow-hidden">
          <div class="relative p-6 md:p-8 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.35),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.28),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.7),_rgba(255,247,237,0.7))]">
            <div class="absolute inset-0 opacity-60 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.65),_transparent_18%),radial-gradient(circle_at_80%_25%,_rgba(255,255,255,0.4),_transparent_15%)]"></div>
            <div class="relative flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-2xl bg-white/70 border border-white shadow-lg flex items-center justify-center text-3xl">{{ selectedPetData.placeholder }}</div>
                <div>
                  <h2 class="text-3xl font-black text-gray-900">{{ selectedPetData.name }}</h2>
                  <p class="text-gray-500 mt-1">{{ selectedPetData.category === 'mythical' ? '神兽展示档案' : '宠物展示档案' }} · Lv.{{ selectedLevel }} {{ getLevelName(selectedLevel) }}</p>
                </div>
              </div>
              <button @click="closeDetail" class="w-11 h-11 rounded-full bg-white/70 hover:bg-white shadow-lg text-2xl text-gray-500">×</button>
            </div>
          </div>

          <div class="p-6 md:p-8">
            <div class="grid lg:grid-cols-[1.2fr,0.8fr] gap-8 items-start">
              <div>
                <div class="relative min-h-[420px] rounded-[32px] overflow-hidden border border-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_20px_60px_rgba(249,115,22,0.12)] bg-[radial-gradient(circle_at_50%_20%,_rgba(255,255,255,0.95),_transparent_26%),linear-gradient(135deg,_rgba(255,237,213,0.92),_rgba(250,245,255,0.92))] flex items-center justify-center">
                  <div class="absolute inset-0 opacity-60" :class="selectedPetData.rarity === 'epic' ? 'mythic-particles' : ''"></div>
                  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 w-44 h-10 rounded-full blur-2xl" :class="selectedPetData.rarity === 'epic' ? 'bg-fuchsia-300/40' : 'bg-orange-300/35'"></div>
                  <div class="relative w-72 h-72 md:w-80 md:h-80 detail-floating detail-stage-shell">
                    <div class="detail-stage-orbit"></div>
                    <div class="detail-stage-glow"></div>
                    <PetAnimatedAsset :pet-id="selectedPetData.id" :level="selectedLevel" :mode="selectedPetData.rarity === 'epic' ? 'emotion' : 'idle'" size="full" :rounded="false" :animation-enabled="true" :background="true" />
                  </div>
                  <div class="absolute top-5 right-5 px-4 py-2 rounded-full text-white font-black shadow-lg bg-gradient-to-r" :class="getLevelColor(selectedLevel)">Lv.{{ selectedLevel }}</div>
                </div>
              </div>

              <div class="space-y-4">
                <div class="rounded-[28px] bg-white/80 border border-white shadow-xl p-5">
                  <div class="text-sm font-semibold text-gray-500 mb-3">角色设定</div>
                  <div class="flex flex-wrap gap-2 mb-4">
                    <span v-for="tag in selectedPetData.personality" :key="tag" class="px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 text-sm font-medium text-gray-700 border border-orange-100">{{ tag }}</span>
                  </div>
                  <p class="text-gray-600 leading-7">{{ selectedPetData.description }}</p>
                </div>

                <div class="rounded-[28px] bg-white/80 border border-white shadow-xl p-5">
                  <div class="text-sm font-semibold text-gray-500 mb-4">等级展示</div>
                  <div class="grid grid-cols-4 gap-3">
                    <button
                      v-for="level in 8"
                      :key="level"
                      @click="selectedLevel = level"
                      class="relative aspect-square rounded-2xl overflow-hidden transition-all duration-300"
                      :class="selectedLevel === level ? 'scale-105 ring-4 ring-orange-300 shadow-xl' : 'hover:-translate-y-1 hover:shadow-lg'"
                    >
                      <div class="absolute inset-0 bg-gradient-to-br" :class="getLevelColor(level)"></div>
                      <div class="absolute inset-0 bg-black/5"></div>
                      <div class="relative z-10 w-full h-full p-2">
                        <PetImage :src="getPetLevelImage(selectedPetData.id, level)" size="full" :rounded="false" :show-loading="false" :fixed-emoji-size="true" :fallback-emoji="selectedPetData.placeholder" />
                      </div>
                      <div class="absolute bottom-1 left-1 right-1 z-20 rounded-lg bg-white/90 text-[11px] font-bold py-1 text-gray-700">Lv.{{ level }}</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </PageLayout>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.28s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from > div, .modal-leave-to > div { transform: scale(0.94) translateY(16px); }

.floating-pet {
  animation: floatPet 3.6s ease-in-out infinite;
}

.floating-mythic {
  animation: floatMythic 3.8s ease-in-out infinite;
}

.detail-floating {
  animation: detailFloat 4.2s ease-in-out infinite;
}

.showcase-pet-shell,
.detail-stage-shell {
  position: relative;
  isolation: isolate;
}

.showcase-ring,
.detail-stage-orbit {
  position: absolute;
  inset: 10%;
  border-radius: 999px;
  border: 1.5px solid rgba(255,255,255,0.72);
  box-shadow: inset 0 0 0 1px rgba(251,191,36,0.18), 0 18px 35px rgba(249,115,22,0.12);
  background: linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0.05));
  backdrop-filter: blur(8px);
  animation: orbitPulse 4.6s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

.showcase-glow,
.detail-stage-glow {
  position: absolute;
  left: 50%;
  bottom: 10%;
  transform: translateX(-50%);
  width: 72%;
  height: 22%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(251,146,60,0.36) 0%, rgba(244,114,182,0.20) 42%, rgba(168,85,247,0.08) 72%, transparent 100%);
  filter: blur(16px);
  animation: glowBreath 4.2s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

.showcase-pet-shell--mythic .showcase-ring,
.detail-stage-shell:has(.mode-emotion) .detail-stage-orbit {
  box-shadow: inset 0 0 0 1px rgba(236,72,153,0.22), 0 22px 42px rgba(147,51,234,0.16);
}

.mythic-particles {
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.7) 0 2px, transparent 3px),
    radial-gradient(circle at 70% 20%, rgba(255,255,255,0.55) 0 2px, transparent 3px),
    radial-gradient(circle at 60% 70%, rgba(255,255,255,0.45) 0 2px, transparent 3px),
    radial-gradient(circle at 30% 80%, rgba(255,255,255,0.35) 0 2px, transparent 3px);
  animation: sparkle 5s linear infinite;
}

@keyframes floatPet {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-10px) scale(1.02); }
}

@keyframes floatMythic {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-14px) scale(1.04); }
}

@keyframes detailFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}

@keyframes sparkle {
  0% { transform: translateY(0) scale(1); opacity: 0.7; }
  50% { transform: translateY(-4px) scale(1.05); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 0.7; }
}

@keyframes orbitPulse {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.82; }
  50% { transform: scale(1.035) rotate(2deg); opacity: 1; }
}

@keyframes glowBreath {
  0%, 100% { transform: translateX(-50%) scale(0.96); opacity: 0.75; }
  50% { transform: translateX(-50%) scale(1.04); opacity: 1; }
}
</style>
