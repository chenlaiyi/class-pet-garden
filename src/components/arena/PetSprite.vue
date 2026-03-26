<script setup lang="ts">
// 宠物精灵渲染器 - 站姿小精灵风格 SVG
// 每个 templateId 对应一套颜色 + 轮廓参数
const props = defineProps<{
  templateId: string
  size?: number      // 基础尺寸，默认 60
  animating?: boolean // 是否播放待机动画
  stunned?: boolean   // 眩晕状态
}>()

const size = props.size ?? 60

// 模板配置
const TEMPLATES: Record<string, {
  body: string; accent: string; detail: string; blush: string
  earL: [number, number, number, number, number] // x,y,w,h,rotate
  earR: [number, number, number, number, number]
  tail?: { cx: number; cy: number; rx: number; ry: number; rot: number }
  extra?: string  // 额外 SVG 元素
}> = {
  shiba: {
    body: '#F4A460', accent: '#D2691E', detail: '#2D1B0E',
    blush: '#FF9999',
    earL: [8, 4, 16, 22, -20], earR: [36, 4, 16, 22, 20],
    tail: { cx: 46, cy: 34, rx: 10, ry: 6, rot: -30 },
    extra: `<ellipse cx="14" cy="28" rx="5" ry="4" fill="rgba(255,255,255,0.3)"/>`,
  },
  corgi: {
    body: '#FFB74D', accent: '#E65100', detail: '#2D1B0E',
    blush: '#FF8A80',
    earL: [6, 6, 18, 20, -15], earR: [36, 6, 18, 20, 15],
    tail: { cx: 44, cy: 32, rx: 8, ry: 5, rot: -20 },
    extra: `<rect x="10" y="28" width="32" height="14" rx="4" fill="rgba(255,255,255,0.4)"/>`, // 白围脖
  },
  golden: {
    body: '#FFD54F', accent: '#F57F17', detail: '#3E2723',
    blush: '#FFAB91',
    earL: [7, 4, 18, 24, -18], earR: [37, 4, 18, 24, 18],
    tail: { cx: 46, cy: 30, rx: 12, ry: 7, rot: -25 },
    extra: `<ellipse cx="14" cy="30" rx="5" ry="3" fill="rgba(255,255,255,0.25)"/>`,
  },
  bichon: {
    body: '#FAFAFA', accent: '#E0E0E0', detail: '#212121',
    blush: '#FFCDD2',
    earL: [6, 5, 16, 20, -15], earR: [38, 5, 16, 20, 15],
    tail: { cx: 44, cy: 32, rx: 8, ry: 5, rot: -15 },
    extra: `<circle cx="22" cy="18" r="14" fill="rgba(255,255,255,0.5)"/>`, // 蓬松效果
  },
  'orange-cat': {
    body: '#FF8C42', accent: '#E64A19', detail: '#2D1B0E',
    blush: '#FF6B6B',
    earL: [8, 2, 18, 22, -25], earR: [36, 2, 18, 22, 25],
    tail: { cx: 46, cy: 28, rx: 6, ry: 14, rot: -45 },
    extra: `<line x1="12" y1="22" x2="18" y2="22" stroke="#2D1B0E" stroke-width="1.5"/><line x1="22" y1="20" x2="22" y2="26" stroke="#2D1B0E" stroke-width="1.5"/><line x1="32" y1="22" x2="26" y2="22" stroke="#2D1B0E" stroke-width="1.5"/>`,
  },
  ragdoll: {
    body: '#B0BEC5', accent: '#607D8B', detail: '#1A237E',
    blush: '#F8BBD9',
    earL: [7, 3, 17, 21, -20], earR: [37, 3, 17, 21, 20],
    tail: { cx: 45, cy: 28, rx: 6, ry: 12, rot: -40 },
    extra: '',
  },
  bunny: {
    body: '#F8BBD9', accent: '#EC407A', detail: '#2D1B0E',
    blush: '#FF8A80',
    earL: [12, -14, 12, 32, -8], earR: [36, -14, 12, 32, 8],
    tail: { cx: 44, cy: 38, rx: 7, ry: 7, rot: 0 },
    extra: `<ellipse cx="22" cy="28" rx="10" ry="8" fill="rgba(255,255,255,0.3)"/>`, // 白胸
  },
  hamster: {
    body: '#FFCC80', accent: '#EF6C00', detail: '#2D1B0E',
    blush: '#FF8A80',
    earL: [8, 4, 14, 16, -10], earR: [38, 4, 14, 16, 10],
    tail: { cx: 44, cy: 36, rx: 5, ry: 4, rot: -10 },
    extra: `<ellipse cx="12" cy="28" rx="6" ry="5" fill="rgba(255,255,255,0.4)"/><ellipse cx="32" cy="28" rx="6" ry="5" fill="rgba(255,255,255,0.4)"/>`,
  },
  duckling: {
    body: '#FFEE58', accent: '#F9A825', detail: '#2D1B0E',
    blush: '#FFAB91',
    earL: [8, 2, 12, 14, -20], earR: [40, 2, 12, 14, 20],
    tail: { cx: 46, cy: 30, rx: 8, ry: 5, rot: -20 },
    extra: `<ellipse cx="22" cy="24" rx="10" ry="8" fill="rgba(255,255,255,0.4)"/>`, // 白肚
  },
  alpaca: {
    body: '#F5F5F5', accent: '#BDBDBD', detail: '#2D1B0E',
    blush: '#FFCDD2',
    earL: [5, 2, 14, 22, -25], earR: [41, 2, 14, 22, 25],
    tail: { cx: 44, cy: 34, rx: 6, ry: 5, rot: -15 },
    extra: `<ellipse cx="22" cy="24" rx="12" ry="10" fill="rgba(255,255,255,0.6)"/>`, // 蓬松毛
  },
  unicorn: {
    body: '#E1BEE7', accent: '#9C27B0', detail: '#4A148C',
    blush: '#FF80AB',
    earL: [7, 3, 14, 20, -15], earR: [39, 3, 14, 20, 15],
    tail: { cx: 46, cy: 30, rx: 8, ry: 6, rot: -25 },
    extra: `<polygon points="22,-2 18,12 26,12" fill="#FFD700" stroke="#FFA000" stroke-width="0.5"/><path d="M40,20 Q48,10 46,25" stroke="#E1BEE7" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  },
  'baby-dragon': {
    body: '#80CBC4', accent: '#00695C', detail: '#1A237E',
    blush: '#FF8A80',
    earL: [7, 3, 14, 18, -20], earR: [39, 3, 14, 18, 20],
    tail: { cx: 46, cy: 28, rx: 6, ry: 12, rot: -50 },
    extra: `<path d="M10,16 Q0,10 6,20" stroke="#80CBC4" stroke-width="3" fill="none"/><path d="M34,16 Q44,10 38,20" stroke="#80CBC4" stroke-width="3" fill="none"/>`,
  },
  husky: {
    body: '#90A4AE', accent: '#37474F', detail: '#1A237E',
    blush: '#FF8A80',
    earL: [6, 2, 18, 24, -20], earR: [38, 2, 18, 24, 20],
    tail: { cx: 44, cy: 30, rx: 10, ry: 6, rot: -20 },
    extra: `<path d="M10,26 L34,26 L22,36 Z" fill="rgba(255,255,255,0.4)"/>`, // 脸部白色
  },
  'west-highland': {
    body: '#FAFAFA', accent: '#BDBDBD', detail: '#2D1B0E',
    blush: '#FFCDD2',
    earL: [7, 4, 15, 18, -12], earR: [38, 4, 15, 18, 12],
    tail: { cx: 44, cy: 32, rx: 7, ry: 5, rot: -10 },
    extra: '',
  },
  samoyed: {
    body: '#FAFAFA', accent: '#90A4AE', detail: '#2D1B0E',
    blush: '#FFCDD2',
    earL: [6, 1, 18, 24, -18], earR: [38, 1, 18, 24, 18],
    tail: { cx: 44, cy: 28, rx: 11, ry: 7, rot: -20 },
    extra: `<ellipse cx="22" cy="24" rx="13" ry="11" fill="rgba(255,255,255,0.5)"/><ellipse cx="22" cy="20" rx="9" ry="7" fill="rgba(255,255,255,0.3)"/>`,
  },
}

function getConfig(tid: string) {
  return TEMPLATES[tid] ?? TEMPLATES['shiba']
}
</script>

<template>
  <div
    class="pet-sprite"
    :class="{ stunned, 'stunned-loop': stunned }"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <svg
      :width="size"
      :height="size"
      :viewBox="'0 0 52 52'"
      xmlns="http://www.w3.org/2000/svg'"
      class="pet-svg"
      :class="{ 'pet-idle': animating !== false }"
    >
      <!-- 尾巴 -->
      <template v-if="getConfig(templateId).tail">
        <ellipse
          :cx="getConfig(templateId).tail!.cx * size / 52"
          :cy="getConfig(templateId).tail!.cy * size / 52"
          :rx="getConfig(templateId).tail!.rx * size / 52"
          :ry="getConfig(templateId).tail!.ry * size / 52"
          :fill="getConfig(templateId).body"
          :transform="`rotate(${getConfig(templateId).tail!.rot} ${getConfig(templateId).tail!.cx * size / 52} ${getConfig(templateId).tail!.cy * size / 52})`"
        />
      </template>

      <!-- 身体（椭圆） -->
      <ellipse
        :cx="22 * size / 52"
        :cy="30 * size / 52"
        :rx="16 * size / 52"
        :ry="18 * size / 52"
        :fill="getConfig(templateId).body"
      />

      <!-- 左耳 -->
      <polygon
        :points="`${getConfig(templateId).earL[0] * size / 52},${getConfig(templateId).earL[1] * size / 52} ${(getConfig(templateId).earL[0] - getConfig(templateId).earL[2]/2) * size / 52},${(getConfig(templateId).earL[1] + getConfig(templateId).earL[3]) * size / 52} ${(getConfig(templateId).earL[0] + getConfig(templateId).earL[2]/2) * size / 52},${(getConfig(templateId).earL[1] + getConfig(templateId).earL[3]) * size / 52}`"
        :fill="getConfig(templateId).body"
        :transform="`rotate(${getConfig(templateId).earL[4]} ${getConfig(templateId).earL[0] * size / 52} ${getConfig(templateId).earL[1] * size / 52})`"
      />
      <!-- 左耳内 -->
      <polygon
        :points="`${getConfig(templateId).earL[0] * size / 52},${getConfig(templateId).earL[1] * size / 52} ${(getConfig(templateId).earL[0] - getConfig(templateId).earL[2]/3) * size / 52},${(getConfig(templateId).earL[1] + getConfig(templateId).earL[3]*0.7) * size / 52} ${(getConfig(templateId).earL[0] + getConfig(templateId).earL[2]/3) * size / 52},${(getConfig(templateId).earL[1] + getConfig(templateId).earL[3]*0.7) * size / 52}`"
        :fill="getConfig(templateId).accent"
        :transform="`rotate(${getConfig(templateId).earL[4]} ${getConfig(templateId).earL[0] * size / 52} ${getConfig(templateId).earL[1] * size / 52})`"
      />

      <!-- 右耳 -->
      <polygon
        :points="`${getConfig(templateId).earR[0] * size / 52},${getConfig(templateId).earR[1] * size / 52} ${(getConfig(templateId).earR[0] - getConfig(templateId).earR[2]/2) * size / 52},${(getConfig(templateId).earR[1] + getConfig(templateId).earR[3]) * size / 52} ${(getConfig(templateId).earR[0] + getConfig(templateId).earR[2]/2) * size / 52},${(getConfig(templateId).earR[1] + getConfig(templateId).earR[3]) * size / 52}`"
        :fill="getConfig(templateId).body"
        :transform="`rotate(${getConfig(templateId).earR[4]} ${getConfig(templateId).earR[0] * size / 52} ${getConfig(templateId).earR[1] * size / 52})`"
      />
      <!-- 右耳内 -->
      <polygon
        :points="`${getConfig(templateId).earR[0] * size / 52},${getConfig(templateId).earR[1] * size / 52} ${(getConfig(templateId).earR[0] - getConfig(templateId).earR[2]/3) * size / 52},${(getConfig(templateId).earR[1] + getConfig(templateId).earR[3]*0.7) * size / 52} ${(getConfig(templateId).earR[0] + getConfig(templateId).earR[2]/3) * size / 52},${(getConfig(templateId).earR[1] + getConfig(templateId).earR[3]*0.7) * size / 52}`"
        :fill="getConfig(templateId).accent"
        :transform="`rotate(${getConfig(templateId).earR[4]} ${getConfig(templateId).earR[0] * size / 52} ${getConfig(templateId).earR[1] * size / 52})`"
      />

      <!-- 脸部白色（可选） -->
      <template v-if="getConfig(templateId).extra">
        <g v-html="getConfig(templateId).extra" />
      </template>

      <!-- 腮红 -->
      <ellipse
        :cx="11 * size / 52" :cy="30 * size / 52"
        :rx="5 * size / 52" :ry="3 * size / 52"
        :fill="getConfig(templateId).blush"
        opacity="0.6"
      />
      <ellipse
        :cx="33 * size / 52" :cy="30 * size / 52"
        :rx="5 * size / 52" :ry="3 * size / 52"
        :fill="getConfig(templateId).blush"
        opacity="0.6"
      />

      <!-- 左眼 -->
      <ellipse
        :cx="16 * size / 52" :cy="24 * size / 52"
        :rx="4 * size / 52" :ry="5 * size / 52"
        :fill="getConfig(templateId).detail"
      />
      <!-- 左眼高光 -->
      <ellipse
        :cx="14.5 * size / 52" :cy="22.5 * size / 52"
        :rx="1.5 * size / 52" :ry="2 * size / 52"
        fill="white"
      />

      <!-- 右眼 -->
      <ellipse
        :cx="28 * size / 52" :cy="24 * size / 52"
        :rx="4 * size / 52" :ry="5 * size / 52"
        :fill="getConfig(templateId).detail"
      />
      <!-- 右眼高光 -->
      <ellipse
        :cx="26.5 * size / 52" :cy="22.5 * size / 52"
        :rx="1.5 * size / 52" :ry="2 * size / 52"
        fill="white"
      />

      <!-- 鼻子 -->
      <ellipse
        :cx="22 * size / 52" :cy="30 * size / 52"
        :rx="3 * size / 52" :ry="2 * size / 52"
        :fill="getConfig(templateId).accent"
      />

      <!-- 嘴巴（微笑） -->
      <path
        :d="`M${19 * size / 52} ${33 * size / 52} Q${22 * size / 52} ${36 * size / 52} ${25 * size / 52} ${33 * size / 52}`"
        :stroke="getConfig(templateId).detail"
        stroke-width="1.2"
        fill="none"
        stroke-linecap="round"
      />
    </svg>

    <!-- 眩晕星星 -->
    <div v-if="stunned" class="stun-stars">
      <span v-for="i in 3" :key="i" class="star" :style="{ animationDelay: (i * 0.2) + 's' }">⭐</span>
    </div>
  </div>
</template>

<style scoped>
.pet-sprite {
  position: relative;
  display: inline-block;
}
.pet-svg {
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
}
/* 待机轻摇 */
.pet-idle {
  animation: pet-bounce 1.2s ease-in-out infinite;
  transform-origin: bottom center;
}
@keyframes pet-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
/* 眩晕 */
.stunned .pet-svg {
  animation: pet-stun 0.3s ease-in-out infinite alternate;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)) brightness(0.9);
}
@keyframes pet-stun {
  from { transform: rotate(-8deg); }
  to { transform: rotate(8deg); }
}
.stun-stars {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
}
.star {
  font-size: 10px;
  animation: star-spin 0.6s linear infinite;
}
@keyframes star-spin {
  from { transform: rotate(0deg) scale(1); opacity: 1; }
  50% { transform: rotate(180deg) scale(1.3); opacity: 0.7; }
  to { transform: rotate(360deg) scale(1); opacity: 1; }
}
</style>
