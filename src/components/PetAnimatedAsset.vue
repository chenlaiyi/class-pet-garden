<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getPetLevelImage, getPetType } from '@/data/pets'

interface Props {
  petId: string
  level?: number
  mode?: 'idle' | 'tap' | 'entrance' | 'emotion'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  rounded?: boolean
  animationEnabled?: boolean
  background?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  level: 1,
  mode: 'idle',
  size: 'lg',
  rounded: false,
  animationEnabled: true,
  background: false
})

const pet = computed(() => getPetType(props.petId))
const imageSrc = computed(() => getPetLevelImage(props.petId, props.level))

const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-52 h-52',
    full: 'w-full h-full'
  }
  return sizes[props.size] || sizes.lg
})

const wrapperClasses = computed(() => {
  if (!props.animationEnabled) return ''
  return `mode-${props.mode} pet-${props.petId}`
})

const placeholder = computed(() => pet.value?.placeholder || '🐾')
const roundedClass = computed(() => (props.rounded ? 'rounded-full' : 'rounded-[28px]'))

// 为 shiba 等支持完整骨架的宠物提供交互态
const internalMode = ref<'idle' | 'tap' | 'entrance' | 'emotion'>(props.mode)

// 当外部 mode 变化时同步（例如 tap 后切回 idle）
watch(
  () => props.mode,
  (m) => {
    internalMode.value = m
  }
)

// 点击触发 tap 动画（1.6s 后自动切回 idle）
function onShibaTap() {
  if (!props.animationEnabled) return
  internalMode.value = 'tap'
  setTimeout(() => {
    internalMode.value = 'idle'
  }, 1600)
}

const shibaState = computed(() => ({
  idle: internalMode.value === 'idle',
  tap: internalMode.value === 'tap'
}))
</script>

<template>
  <div
    class="pet-animated-asset relative flex items-center justify-center overflow-visible"
    :class="[sizeClasses, wrapperClasses]"
    :data-mode="mode"
    :data-pet="petId"
    @click="petId === 'shiba' ? onShibaTap() : undefined"
  >
    <div v-if="background" class="pet-aura" :class="roundedClass"></div>

    <!-- 柴犬：完整角色骨架（会“活”） -->
    <template v-if="petId === 'shiba'">
      <div class="shiba-stage" :class="shibaState">
        <div class="spark spark-1"></div>
        <div class="spark spark-2"></div>
        <div class="spark spark-3"></div>

        <div class="shiba-shadow"></div>
        <div class="tail"></div>
        <div class="body"></div>
        <div class="leg leg-back-left"></div>
        <div class="leg leg-back-right"></div>
        <div class="leg leg-front-left"></div>
        <div class="leg leg-front-right"></div>
        <div class="head-wrap">
          <div class="ear ear-left"></div>
          <div class="ear ear-right"></div>
          <div class="head">
            <div class="eye eye-left"></div>
            <div class="eye eye-right"></div>
            <div class="cheek cheek-left"></div>
            <div class="cheek cheek-right"></div>
            <div class="muzzle"></div>
            <div class="nose"></div>
            <div class="mouth"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- 其他宠物：图片 + 通用动效（耳朵/尾巴/闪光） -->
    <template v-else>
      <div class="pet-shadow"></div>

      <div class="pet-motion-shell">
        <div class="pet-ear pet-ear-left" v-if="petId === 'corgi'"></div>
        <div class="pet-ear pet-ear-right" v-if="petId === 'corgi'"></div>
        <div class="pet-tail" v-if="petId === 'corgi' || petId === 'golden' || petId === 'bichon'"></div>
        <div class="pet-spark pet-spark-1"></div>
        <div class="pet-spark pet-spark-2"></div>

        <img
          v-if="imageSrc"
          :src="imageSrc"
          :alt="pet?.name || petId"
          class="pet-image relative z-10 h-full w-full object-contain"
          draggable="false"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-5xl">{{ placeholder }}</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pet-animated-asset {
  --float-y: -8px;
  --sway-deg: 3deg;
  --tap-lift: -14px;
  --tap-scale: 1.04;
}

.pet-aura {
  position: absolute;
  inset: 8%;
  z-index: 0;
  background: radial-gradient(circle at 50% 40%, rgba(255,255,255,0.95), rgba(255,237,213,0.6) 55%, rgba(251,191,36,0.08) 100%);
  filter: blur(10px);
}

.pet-shadow {
  position: absolute;
  bottom: 6%;
  left: 50%;
  width: 56%;
  height: 10%;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(circle, rgba(194,120,43,0.30) 0%, rgba(194,120,43,0.10) 58%, rgba(194,120,43,0) 100%);
  filter: blur(5px);
  z-index: 1;
}

.pet-motion-shell {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  transform-origin: center bottom;
}

.pet-image {
  user-select: none;
  -webkit-user-drag: none;
  filter: drop-shadow(0 18px 20px rgba(249, 115, 22, 0.12));
}

.pet-ear,
.pet-tail,
.pet-spark {
  position: absolute;
  pointer-events: none;
  z-index: 3;
}

.pet-ear {
  top: 14%;
  width: 14%;
  height: 18%;
  border-radius: 50% 50% 20% 20%;
  background: linear-gradient(180deg, rgba(255, 208, 160, 0.55), rgba(255, 153, 51, 0.08));
  opacity: 0;
}

.pet-ear-left { left: 27%; transform-origin: bottom center; }
.pet-ear-right { right: 27%; transform-origin: bottom center; }

.pet-tail {
  right: 16%;
  bottom: 28%;
  width: 18%;
  height: 18%;
  border-radius: 999px;
  background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.55), rgba(251,146,60,0.28) 58%, rgba(251,146,60,0.05) 100%);
  opacity: 0;
  transform-origin: 20% 80%;
}

.pet-spark {
  width: 8%;
  height: 8%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(253,224,71,0.85) 40%, rgba(253,224,71,0) 100%);
  opacity: 0;
}

.pet-spark-1 { top: 18%; right: 18%; }
.pet-spark-2 { top: 28%; left: 18%; }

.mode-idle .pet-motion-shell {
  animation: petIdleFloat 3.8s ease-in-out infinite;
}

.mode-idle .pet-shadow {
  animation: petShadowBreath 3.8s ease-in-out infinite;
}

.mode-idle.pet-shiba .pet-image,
.mode-idle.pet-corgi .pet-image,
.mode-idle.pet-golden .pet-image,
.mode-idle.pet-bichon .pet-image {
  animation: petBreath 3.8s ease-in-out infinite;
}

.mode-idle.pet-shiba .pet-ear,
.mode-idle.pet-corgi .pet-ear {
  opacity: 1;
}

.mode-idle.pet-shiba .pet-ear-left,
.mode-idle.pet-corgi .pet-ear-left {
  animation: earLeft 3.5s ease-in-out infinite;
}

.mode-idle.pet-shiba .pet-ear-right,
.mode-idle.pet-corgi .pet-ear-right {
  animation: earRight 3.5s ease-in-out infinite;
}

.mode-idle.pet-shiba .pet-tail,
.mode-idle.pet-corgi .pet-tail,
.mode-idle.pet-golden .pet-tail,
.mode-idle.pet-bichon .pet-tail {
  opacity: 1;
  animation: tailIdle 1.7s ease-in-out infinite;
}

.mode-idle .pet-spark-1 { animation: sparkle 3.6s ease-in-out infinite; }
.mode-idle .pet-spark-2 { animation: sparkle 3.6s ease-in-out 1.3s infinite; }

.mode-tap .pet-motion-shell {
  animation: petTap 1s ease-out;
}

.mode-tap .pet-shadow {
  animation: petShadowTap 1s ease-out;
}

.mode-tap.pet-shiba .pet-tail,
.mode-tap.pet-corgi .pet-tail,
.mode-tap.pet-golden .pet-tail,
.mode-tap.pet-bichon .pet-tail {
  opacity: 1;
  animation: tailTap .16s ease-in-out 6 alternate;
}

.mode-tap.pet-shiba .pet-ear,
.mode-tap.pet-corgi .pet-ear {
  opacity: 1;
}

.mode-tap.pet-shiba .pet-ear-left,
.mode-tap.pet-corgi .pet-ear-left {
  animation: earTapLeft .7s ease-out;
}

.mode-tap.pet-shiba .pet-ear-right,
.mode-tap.pet-corgi .pet-ear-right {
  animation: earTapRight .7s ease-out;
}

.mode-tap .pet-spark-1,
.mode-tap .pet-spark-2 {
  animation: tapSpark .9s ease-out;
}

.mode-entrance .pet-motion-shell {
  animation: petEntrance 1s cubic-bezier(.2,.8,.2,1);
}

.mode-emotion .pet-motion-shell {
  animation: petEmotion 1.6s ease-in-out infinite;
}

@keyframes petIdleFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(var(--float-y)) rotate(calc(var(--sway-deg) * -1)); }
}

@keyframes petBreath {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.015) translateY(-1px); }
}

@keyframes petShadowBreath {
  0%, 100% { transform: translateX(-50%) scaleX(1); opacity: .34; }
  50% { transform: translateX(-50%) scaleX(.92); opacity: .24; }
}

@keyframes earLeft {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(-18deg); }
}

@keyframes earRight {
  0%, 100% { transform: rotate(8deg); }
  50% { transform: rotate(18deg); }
}

@keyframes tailIdle {
  from { transform: rotate(10deg) scale(1); }
  to { transform: rotate(28deg) scale(1.03); }
}

@keyframes sparkle {
  0%, 100% { transform: translateY(0) scale(.2); opacity: 0; }
  30% { opacity: .7; }
  55% { transform: translateY(-10px) scale(1); opacity: 1; }
}

@keyframes petTap {
  0% { transform: translateY(0) scale(1) rotate(0); }
  25% { transform: translateY(var(--tap-lift)) scale(var(--tap-scale)) rotate(-2deg); }
  55% { transform: translateY(calc(var(--tap-lift) * 1.3)) scale(calc(var(--tap-scale) + .01)) rotate(2deg); }
  80% { transform: translateY(0) scale(.98) rotate(0); }
  100% { transform: translateY(0) scale(1) rotate(0); }
}

@keyframes petShadowTap {
  0% { transform: translateX(-50%) scaleX(1); opacity: .34; }
  45% { transform: translateX(-50%) scaleX(.82); opacity: .18; }
  80% { transform: translateX(-50%) scaleX(1.06); opacity: .36; }
  100% { transform: translateX(-50%) scaleX(1); opacity: .34; }
}

@keyframes tailTap {
  from { transform: rotate(8deg); }
  to { transform: rotate(34deg); }
}

@keyframes earTapLeft {
  0% { transform: rotate(-8deg); }
  40% { transform: rotate(-24deg); }
  100% { transform: rotate(-8deg); }
}

@keyframes earTapRight {
  0% { transform: rotate(8deg); }
  40% { transform: rotate(24deg); }
  100% { transform: rotate(8deg); }
}

@keyframes tapSpark {
  0% { transform: translateY(0) scale(.2); opacity: 0; }
  25% { opacity: 1; }
  100% { transform: translateY(-24px) scale(1.3); opacity: 0; }
}

@keyframes petEntrance {
  0% { transform: translateY(32px) scale(.82); opacity: 0; }
  55% { transform: translateY(-10px) scale(1.03); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes petEmotion {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-5px) rotate(-2deg); }
  50% { transform: translateY(-10px) rotate(1deg); }
  75% { transform: translateY(-5px) rotate(2deg); }
}

/* 柴犬完整角色 CSS（复用 ShibaMotionDemo 样式，但命名空间隔离在组件内） */
.shiba-stage {
  position: relative;
  width: 280px;
  height: 320px;
  cursor: pointer;
  transform-origin: center bottom;
}

.shiba-stage:active {
  transform: scale(0.98);
}

.shiba-shadow {
  position: absolute;
  left: 50%;
  bottom: 28px;
  width: 132px;
  height: 28px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(circle, rgba(194, 120, 43, 0.38), rgba(194, 120, 43, 0.08) 70%, transparent 100%);
  filter: blur(4px);
  animation: shibaShadowBreath 4.4s ease-in-out infinite;
}

.shiba-stage .body {
  position: absolute;
  left: 50%;
  bottom: 74px;
  width: 152px;
  height: 122px;
  transform: translateX(-50%);
  border-radius: 46% 46% 42% 42%;
  background: linear-gradient(180deg, #f6ad55 0%, #ed8936 60%, #dd6b20 100%);
  box-shadow: inset -10px -14px 0 rgba(166, 84, 20, 0.12), inset 0 10px 0 rgba(255, 255, 255, 0.22);
  animation: shibaBodyBreath 4.4s ease-in-out infinite;
}

.shiba-stage .body::before {
  content: '';
  position: absolute;
  left: 20px;
  right: 20px;
  top: 22px;
  bottom: 18px;
  border-radius: 42% 42% 44% 44%;
  background: radial-gradient(circle at 50% 20%, rgba(255,255,255,0.28), transparent 44%), linear-gradient(180deg, #fff7ed 0%, #fde6bf 100%);
}

.shiba-stage .tail {
  position: absolute;
  right: 34px;
  bottom: 138px;
  width: 84px;
  height: 84px;
  border: 18px solid #f6ad55;
  border-left-color: transparent;
  border-bottom-color: transparent;
  border-radius: 50%;
  transform-origin: 24px 58px;
  transform: rotate(28deg);
  box-shadow: inset 0 0 0 6px rgba(255,255,255,0.12);
  animation: shibaTailIdle 1.9s ease-in-out infinite;
}

.shiba-stage .leg {
  position: absolute;
  bottom: 38px;
  width: 30px;
  height: 88px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f6ad55 0%, #ed8936 100%);
  box-shadow: inset 0 8px 0 rgba(255,255,255,0.16);
}

.shiba-stage .leg::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -4px;
  width: 34px;
  height: 16px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #7b341e;
}

.leg-back-left { left: 88px; z-index: 1; }
.leg-back-right { left: 118px; z-index: 1; }
.leg-front-left { left: 150px; z-index: 3; }
.leg-front-right { left: 182px; z-index: 3; }

.head-wrap {
  position: absolute;
  left: 50%;
  top: 30px;
  width: 150px;
  height: 142px;
  transform: translateX(-50%);
  transform-origin: 50% 78%;
  animation: shibaHeadIdle 4.4s ease-in-out infinite;
  z-index: 5;
}

.head {
  position: absolute;
  inset: 0;
  border-radius: 46% 46% 42% 42%;
  background: linear-gradient(180deg, #f6ad55 0%, #ed8936 62%, #dd6b20 100%);
  box-shadow: inset 0 10px 0 rgba(255,255,255,0.2);
}

.head::before {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  top: 42px;
  bottom: 16px;
  border-radius: 46% 46% 54% 54%;
  background: linear-gradient(180deg, #fffaf0 0%, #fef3c7 100%);
}

.shiba-stage .ear {
  position: absolute;
  top: -16px;
  width: 42px;
  height: 64px;
  border-radius: 14px 14px 4px 4px;
  background: linear-gradient(180deg, #dd6b20 0%, #c05621 100%);
  z-index: -1;
}

.shiba-stage .ear::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  top: 10px;
  bottom: 10px;
  border-radius: 12px 12px 2px 2px;
  background: rgba(255, 237, 213, 0.68);
}

.ear-left {
  left: 18px;
  transform: rotate(-20deg);
  transform-origin: bottom center;
  animation: shibaEarLeft 4.2s ease-in-out infinite;
}

.ear-right {
  right: 18px;
  transform: rotate(20deg);
  transform-origin: bottom center;
  animation: shibaEarRight 4.2s ease-in-out infinite;
}

.shiba-stage .eye {
  position: absolute;
  top: 58px;
  width: 16px;
  height: 18px;
  border-radius: 999px;
  background: #2d1b12;
  animation: shibaBlink 4.8s infinite;
}

.shiba-stage .eye::after {
  content: '';
  position: absolute;
  right: 2px;
  top: 2px;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255,255,255,0.9);
}

.eye-left { left: 42px; }
.eye-right { right: 42px; }

.shiba-stage .cheek {
  position: absolute;
  top: 82px;
  width: 18px;
  height: 10px;
  border-radius: 999px;
  background: rgba(251, 146, 60, 0.18);
}

.cheek-left { left: 28px; }
.cheek-right { right: 28px; }

.muzzle {
  position: absolute;
  left: 50%;
  bottom: 24px;
  width: 68px;
  height: 46px;
  transform: translateX(-50%);
  border-radius: 46% 46% 55% 55%;
  background: linear-gradient(180deg, #fffaf0 0%, #fef3c7 100%);
}

.nose {
  position: absolute;
  left: 50%;
  bottom: 52px;
  width: 16px;
  height: 12px;
  transform: translateX(-50%);
  border-radius: 40% 40% 60% 60%;
  background: #2d1b12;
}

.mouth {
  position: absolute;
  left: 50%;
  bottom: 34px;
  width: 28px;
  height: 16px;
  transform: translateX(-50%);
}

.mouth::before,
.mouth::after {
  content: '';
  position: absolute;
  top: 0;
  width: 14px;
  height: 14px;
  border-bottom: 3px solid #7b341e;
  border-radius: 0 0 12px 12px;
}

.mouth::before { left: 0; transform: rotate(8deg); }
.mouth::after { right: 0; transform: scaleX(-1) rotate(8deg); }

.spark {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(253,224,71,0.95) 45%, rgba(251,191,36,0) 100%);
  opacity: 0;
  pointer-events: none;
}

.spark-1 { left: 210px; top: 70px; }
.spark-2 { left: 232px; top: 104px; }
.spark-3 { left: 82px; top: 92px; }

.idle .spark-1 { animation: shibaSparkle 3.6s ease-in-out infinite; }
.idle .spark-2 { animation: shibaSparkle 3.6s ease-in-out 1.1s infinite; }
.idle .spark-3 { animation: shibaSparkle 3.6s ease-in-out 2.1s infinite; }

.tap .head-wrap {
  animation: shibaTapHead 1.6s ease forwards;
}

.tap .body {
  animation: shibaTapBody 1.6s ease forwards;
}

.tap .tail {
  animation: shibaTapTail 0.24s ease-in-out 5 alternate;
}

.tap .leg-front-right {
  animation: shibaPawLift 1.6s ease forwards;
}

.tap .shiba-shadow {
  animation: shibaShadowTap 1.6s ease forwards;
}

.tap .spark {
  animation: shibaTapSpark 1.1s ease-out forwards;
}

.tap .spark-2 { animation-delay: 0.08s; }
.tap .spark-3 { animation-delay: 0.16s; }

@keyframes shibaBodyBreath {
  0%, 100% { transform: translateX(-50%) translateY(0) scaleY(1); }
  50% { transform: translateX(-50%) translateY(-3px) scaleY(1.02); }
}

@keyframes shibaHeadIdle {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  25% { transform: translateX(-50%) rotate(-2deg); }
  55% { transform: translateX(-50%) rotate(1deg); }
  75% { transform: translateX(-50%) rotate(-3deg); }
}

@keyframes shibaTailIdle {
  0%, 100% { transform: rotate(24deg); }
  50% { transform: rotate(42deg); }
}

@keyframes shibaEarLeft {
  0%, 100% { transform: rotate(-20deg); }
  50% { transform: rotate(-28deg); }
}

@keyframes shibaEarRight {
  0%, 100% { transform: rotate(20deg); }
  50% { transform: rotate(28deg); }
}

@keyframes shibaBlink {
  0%, 44%, 52%, 100% { transform: scaleY(1); }
  48% { transform: scaleY(0.08); }
}

@keyframes shibaShadowBreath {
  0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.42; }
  50% { transform: translateX(-50%) scaleX(0.94); opacity: 0.34; }
}

@keyframes shibaSparkle {
  0%, 100% { transform: translateY(0) scale(0.6); opacity: 0; }
  35% { opacity: 0.7; }
  50% { transform: translateY(-10px) scale(1); opacity: 1; }
}

@keyframes shibaTapBody {
  0% { transform: translateX(-50%) translateY(0) scale(1); }
  22% { transform: translateX(-50%) translateY(-16px) scale(1.02); }
  42% { transform: translateX(-50%) translateY(-30px) scale(1.03); }
  72% { transform: translateX(-50%) translateY(0) scale(0.98); }
  100% { transform: translateX(-50%) translateY(0) scale(1); }
}

@keyframes shibaTapHead {
  0% { transform: translateX(-50%) rotate(0deg) translateY(0); }
  18% { transform: translateX(-50%) rotate(-4deg) translateY(-6px); }
  40% { transform: translateX(-50%) rotate(1deg) translateY(-18px); }
  72% { transform: translateX(-50%) rotate(6deg) translateY(0); }
  100% { transform: translateX(-50%) rotate(0deg) translateY(0); }
}

@keyframes shibaTapTail {
  from { transform: rotate(18deg); }
  to { transform: rotate(52deg); }
}

@keyframes shibaPawLift {
  0% { transform: translateY(0) rotate(0deg); }
  20% { transform: translateY(-12px) rotate(-8deg); }
  42% { transform: translateY(-28px) rotate(-12deg); }
  72% { transform: translateY(0) rotate(3deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

@keyframes shibaShadowTap {
  0% { transform: translateX(-50%) scaleX(1); opacity: 0.42; }
  42% { transform: translateX(-50%) scaleX(0.82); opacity: 0.28; }
  72% { transform: translateX(-50%) scaleX(1.08); opacity: 0.46; }
  100% { transform: translateX(-50%) scaleX(1); opacity: 0.42; }
}

@keyframes shibaTapSpark {
  0% { transform: translateY(0) scale(0.2); opacity: 0; }
  24% { opacity: 1; }
  100% { transform: translateY(-28px) scale(1.4); opacity: 0; }
}
</style>
