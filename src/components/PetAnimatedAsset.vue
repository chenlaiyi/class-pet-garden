<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getPetLevelImage, getPetType } from '@/data/pets'

type AnimationMode = 'idle' | 'tap' | 'entrance' | 'emotion'

interface Props {
  petId: string
  level?: number
  mode?: AnimationMode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  rounded?: boolean
  animationEnabled?: boolean
  background?: boolean
  stageStyle?: 'standard' | 'showcase' | 'mythic'
}

const props = withDefaults(defineProps<Props>(), {
  level: 1,
  mode: 'idle',
  size: 'lg',
  rounded: false,
  animationEnabled: true,
  background: false,
  stageStyle: 'standard'
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
  const classes = [`stage-${props.stageStyle}`, `pet-${props.petId}`]
  if (props.animationEnabled) classes.unshift(`mode-${props.mode}`)
  return classes.join(' ')
})

const placeholder = computed(() => pet.value?.placeholder || '🐾')
const roundedClass = computed(() => (props.rounded ? 'rounded-full' : 'rounded-[28px]'))

const internalMode = ref<AnimationMode>(props.mode)
let tapResetTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.mode,
  (m) => {
    internalMode.value = m
  }
)

function onTap() {
  if (!props.animationEnabled) return
  internalMode.value = 'tap'
  if (tapResetTimer) clearTimeout(tapResetTimer)
  tapResetTimer = setTimeout(() => {
    internalMode.value = 'idle'
  }, 1000)
}

onBeforeUnmount(() => {
  if (tapResetTimer) clearTimeout(tapResetTimer)
})
</script>

<template>
  <div
    class="pet-animated-asset relative flex items-center justify-center overflow-visible"
    :class="[sizeClasses, wrapperClasses]"
    :data-mode="mode"
    :data-pet="petId"
    @click="onTap()"
  >
    <div v-if="background" class="pet-aura" :class="roundedClass"></div>

    <div class="pet-shadow"></div>

    <div class="pet-motion-shell">
      <div class="pet-stage-floor"></div>
      <div class="pet-stage-halo"></div>

      <!-- 装饰性耳朵（只对插画类宠物有效，照片类宠物的耳朵会被图片压住，不渲染） -->
      <div class="pet-ear pet-ear-left" v-if="petId === 'corgi' || petId === 'ragdoll' || petId === 'bunny'"></div>
      <div class="pet-ear pet-ear-right" v-if="petId === 'corgi' || petId === 'ragdoll' || petId === 'bunny'"></div>

      <!-- 装饰性尾巴（只对插画类宠物有效，照片类宠物的尾巴会被图片压住，不渲染） -->
      <div class="pet-tail" v-if="petId === 'corgi' || petId === 'golden' || petId === 'bichon' || petId === 'orange-cat' || petId === 'ragdoll' || petId === 'alpaca'"></div>

      <!-- 装饰性翅膀（神兽） -->
      <div class="pet-wing pet-wing-left" v-if="petId === 'unicorn' || petId === 'baby-dragon'"></div>
      <div class="pet-wing pet-wing-right" v-if="petId === 'unicorn' || petId === 'baby-dragon'"></div>

      <!-- 光环粒子 -->
      <div class="pet-orbit pet-orbit-a"></div>
      <div class="pet-orbit pet-orbit-b"></div>
      <div class="pet-spark pet-spark-1"></div>
      <div class="pet-spark pet-spark-2"></div>
      <div class="pet-spark pet-spark-3"></div>

      <!-- 核心：原图保持不动 -->
      <img
        v-if="imageSrc"
        :src="imageSrc"
        :alt="pet?.name || petId"
        class="pet-image relative z-10 h-full w-full object-contain"
        draggable="false"
      />

      <!-- 无图片时的占位符 -->
      <div v-if="!imageSrc" class="flex h-full w-full items-center justify-center text-5xl">{{ placeholder }}</div>

      <!-- 机甲宠物（纯 CSS 画） -->
      <div v-if="petId === 'mecha'" class="mecha-stage">
        <div class="mecha-shadow"></div>
        <div class="mecha-core-ring"></div>

        <!-- 尾巴 -->
        <div class="mecha-tail"></div>

        <!-- 身体 -->
        <div class="mecha-body">
          <div class="mecha-body-panel"></div>
          <div class="mecha-body-vent"></div>
          <div class="mecha-body-vent mecha-body-vent-2"></div>
          <div class="mecha-body-core"></div>
        </div>

        <!-- 腿 -->
        <div class="mecha-leg mecha-leg-left"></div>
        <div class="mecha-leg mecha-leg-right"></div>

        <!-- 头 -->
        <div class="mecha-head">
          <!-- 天线 -->
          <div class="mecha-antenna mecha-antenna-left"></div>
          <div class="mecha-antenna mecha-antenna-right"></div>

          <!-- 面甲 -->
          <div class="mecha-face">
            <!-- 眼睛 -->
            <div class="mecha-eye mecha-eye-left">
              <div class="mecha-eye-glow"></div>
            </div>
            <div class="mecha-eye mecha-eye-right">
              <div class="mecha-eye-glow"></div>
            </div>

            <!-- 嘴 -->
            <div class="mecha-mouth"></div>
          </div>

          <!-- 耳朵 -->
          <div class="mecha-ear mecha-ear-left"></div>
          <div class="mecha-ear mecha-ear-right"></div>
        </div>

        <!-- 粒子光点 -->
        <div class="mecha-particle mecha-particle-1"></div>
        <div class="mecha-particle mecha-particle-2"></div>
        <div class="mecha-particle mecha-particle-3"></div>
      </div>
    </div>
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

.pet-stage-floor,
.pet-stage-halo,
.pet-orbit,
.pet-ear,
.pet-tail,
.pet-wing,
.pet-spark {
  position: absolute;
  pointer-events: none;
  z-index: 3;
}

.pet-stage-floor { left: 50%; bottom: 8%; width: 58%; height: 12%; transform: translateX(-50%); border-radius: 999px; background: linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,237,213,0.28)); border: 1px solid rgba(255,255,255,0.65); box-shadow: inset 0 2px 10px rgba(255,255,255,0.35), 0 10px 22px rgba(249,115,22,0.12); opacity: .92; }
.pet-stage-halo { left: 50%; bottom: 14%; width: 68%; height: 26%; transform: translateX(-50%); border-radius: 999px; background: radial-gradient(circle, rgba(255,255,255,0.96) 0%, rgba(254,215,170,0.46) 45%, rgba(251,146,60,0.08) 76%, transparent 100%); filter: blur(12px); z-index: 1; }
.pet-orbit { inset: 10%; border-radius: 999px; border: 1px solid rgba(255,255,255,0.55); background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04)); opacity: 0; z-index: 2; }
.pet-wing { top: 22%; width: 22%; height: 30%; border-radius: 60% 40% 60% 40%; background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.1)); border: 1px solid rgba(255,255,255,0.48); box-shadow: inset 0 1px 10px rgba(255,255,255,0.35); opacity: 0; z-index: 2; }
.pet-wing-left { left: 10%; transform-origin: 85% 80%; }
.pet-wing-right { right: 10%; transform-origin: 15% 80%; }
.pet-ear { top: 14%; width: 14%; height: 18%; border-radius: 50% 50% 20% 20%; background: linear-gradient(180deg, rgba(255, 208, 160, 0.55), rgba(255, 153, 51, 0.08)); opacity: 0; }
.pet-ear-left { left: 27%; transform-origin: bottom center; }
.pet-ear-right { right: 27%; transform-origin: bottom center; }
.pet-tail { right: 16%; bottom: 28%; width: 18%; height: 18%; border-radius: 999px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.55), rgba(251,146,60,0.28) 58%, rgba(251,146,60,0.05) 100%); opacity: 0; transform-origin: 20% 80%; }
.pet-spark { width: 8%; height: 8%; border-radius: 999px; background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(253,224,71,0.85) 40%, rgba(253,224,71,0) 100%); opacity: 0; }
.pet-spark-1 { top: 18%; right: 18%; }
.pet-spark-2 { top: 28%; left: 18%; }
.pet-spark-3 { top: 16%; left: 48%; width: 6%; height: 6%; }
.stage-showcase .pet-stage-floor, .stage-mythic .pet-stage-floor { width: 64%; height: 13%; }
.stage-showcase .pet-stage-halo { width: 74%; opacity: .95; }
.stage-mythic .pet-stage-halo { width: 78%; height: 30%; background: radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(216,180,254,0.52) 40%, rgba(96,165,250,0.18) 70%, transparent 100%); }
.stage-showcase .pet-orbit, .stage-mythic .pet-orbit { opacity: .8; }
.stage-showcase .pet-orbit-a, .stage-mythic .pet-orbit-a { animation: orbitDriftA 6.4s linear infinite; }
.stage-showcase .pet-orbit-b, .stage-mythic .pet-orbit-b { inset: 18%; animation: orbitDriftB 7.2s linear infinite; }
.stage-mythic .pet-wing { opacity: .85; }
.mode-idle .pet-motion-shell { animation: petIdleFloat 3.8s ease-in-out infinite, petBreath 3.8s ease-in-out infinite; }
.mode-idle .pet-shadow { animation: petShadowBreath 3.8s ease-in-out infinite; }

/* 呼吸动画：所有宠物通用 */
.mode-idle.pet-shiba .pet-image,
.mode-idle.pet-corgi .pet-image,
.mode-idle.pet-golden .pet-image,
.mode-idle.pet-bichon .pet-image,
.mode-idle.pet-orange-cat .pet-image,
.mode-idle.pet-ragdoll .pet-image,
.mode-idle.pet-bunny .pet-image,
.mode-idle.pet-hamster .pet-image,
.mode-idle.pet-duckling .pet-image,
.mode-idle.pet-alpaca .pet-image,
.mode-idle.pet-unicorn .pet-image,
.mode-idle.pet-baby-dragon .pet-image { animation: petBreath 3.8s ease-in-out infinite; }

/* 耳朵：柴犬有耳朵 */
.mode-idle.pet-shiba .pet-ear { opacity: 1; }
.mode-idle.pet-corgi .pet-ear, .mode-idle.pet-ragdoll .pet-ear, .mode-idle.pet-bunny .pet-ear { opacity: 1; }
.mode-idle.pet-shiba .pet-ear-left,
.mode-idle.pet-corgi .pet-ear-left,
.mode-idle.pet-ragdoll .pet-ear-left,
.mode-idle.pet-bunny .pet-ear-left { animation: earLeft 3.5s ease-in-out infinite; }
.mode-idle.pet-shiba .pet-ear-right,
.mode-idle.pet-corgi .pet-ear-right,
.mode-idle.pet-ragdoll .pet-ear-right,
.mode-idle.pet-bunny .pet-ear-right { animation: earRight 3.5s ease-in-out infinite; }

/* 尾巴：所有有尾巴的宠物 */
.mode-idle.pet-shiba .pet-tail,
.mode-idle.pet-corgi .pet-tail,
.mode-idle.pet-golden .pet-tail,
.mode-idle.pet-bichon .pet-tail,
.mode-idle.pet-orange-cat .pet-tail,
.mode-idle.pet-ragdoll .pet-tail,
.mode-idle.pet-alpaca .pet-tail { opacity: 1; animation: tailIdle 1.7s ease-in-out infinite; }

/* 翅膀：神兽 */
.mode-idle.pet-unicorn .pet-wing, .mode-idle.pet-baby-dragon .pet-wing { animation: wingFloat 3.2s ease-in-out infinite; }

/* 光点 */
.mode-idle .pet-spark-1 { animation: sparkle 3.6s ease-in-out infinite; }
.mode-idle .pet-spark-2 { animation: sparkle 3.6s ease-in-out 1.3s infinite; }
.mode-idle .pet-spark-3 { animation: sparkle 3.6s ease-in-out 2.1s infinite; }
.mode-tap .pet-motion-shell { animation: petTap 1s ease-out; }
.mode-tap .pet-shadow { animation: petShadowTap 1s ease-out; }
.mode-tap.pet-shiba .pet-tail, .mode-tap.pet-corgi .pet-tail, .mode-tap.pet-golden .pet-tail, .mode-tap.pet-bichon .pet-tail, .mode-tap.pet-orange-cat .pet-tail, .mode-tap.pet-ragdoll .pet-tail, .mode-tap.pet-alpaca .pet-tail { opacity: 1; animation: tailTap .16s ease-in-out 6 alternate; }
.mode-tap.pet-shiba .pet-ear, .mode-tap.pet-corgi .pet-ear, .mode-tap.pet-ragdoll .pet-ear, .mode-tap.pet-bunny .pet-ear { opacity: 1; }
.mode-tap.pet-shiba .pet-ear-left, .mode-tap.pet-corgi .pet-ear-left, .mode-tap.pet-ragdoll .pet-ear-left, .mode-tap.pet-bunny .pet-ear-left { animation: earTapLeft .7s ease-out; }
.mode-tap.pet-shiba .pet-ear-right, .mode-tap.pet-corgi .pet-ear-right, .mode-tap.pet-ragdoll .pet-ear-right, .mode-tap.pet-bunny .pet-ear-right { animation: earTapRight .7s ease-out; }
.mode-tap.pet-unicorn .pet-wing, .mode-tap.pet-baby-dragon .pet-wing { opacity: .95; animation: wingTap .6s ease-out 2 alternate; }
.mode-tap .pet-spark-1, .mode-tap .pet-spark-2, .mode-tap .pet-spark-3 { animation: tapSpark .9s ease-out; }
.mode-entrance .pet-motion-shell { animation: petEntrance 1s cubic-bezier(.2,.8,.2,1); }
.mode-emotion .pet-motion-shell { animation: petEmotion 1.6s ease-in-out infinite; }

.pet-face-overlay {
  position: absolute;
  left: 50%;
  top: 42%;
  transform: translate(-50%, -50%);
  width: var(--overlay-width, 76%);
  height: 36%;
  z-index: 20;
  pointer-events: none;
}

.overlay-eyes {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16%;
}

.overlay-eye {
  position: relative;
  width: 18%;
  height: 38%;
  border-radius: 999px;
  background: var(--overlay-eye, rgba(35,35,35,0.95));
  box-shadow: 0 0 0 2px rgba(255,255,255,0.08);
  animation: overlayBlink 4.6s infinite;
  transition: transform .3s ease, width .3s ease, height .3s ease, border-radius .3s ease;
  overflow: hidden;
}

.overlay-eye::after {
  content: '';
  position: absolute;
  right: 18%;
  top: 16%;
  width: 22%;
  height: 22%;
  border-radius: 999px;
  background: rgba(255,255,255,0.95);
}

.overlay-pupil {
  position: absolute;
  left: 30%;
  top: 30%;
  width: 24%;
  height: 24%;
  border-radius: 999px;
  background: rgba(255,255,255,0.22);
}

.overlay-brows {
  position: absolute;
  inset: 0;
}

.overlay-brow {
  position: absolute;
  top: 12%;
  width: 16%;
  height: 5%;
  border-radius: 999px;
  background: color-mix(in srgb, var(--overlay-eye, rgba(35,35,35,0.95)) 82%, #fff 18%);
  opacity: .78;
  transition: transform .3s ease, opacity .3s ease;
}

.overlay-brow-left { left: 24%; transform: rotate(-6deg); }
.overlay-brow-right { right: 24%; transform: rotate(6deg); }

.overlay-mouth {
  position: absolute;
  left: 50%;
  bottom: 8%;
  width: 16%;
  height: 10%;
  transform: translateX(-50%);
}

.overlay-mouth::before,
.overlay-mouth::after {
  content: '';
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  border-bottom: 3px solid color-mix(in srgb, var(--overlay-eye, rgba(35,35,35,0.95)) 86%, #5b3421 14%);
  border-radius: 0 0 10px 10px;
  transition: all .3s ease;
}

.overlay-mouth::before { left: 0; transform: rotate(8deg); }
.overlay-mouth::after { right: 0; transform: scaleX(-1) rotate(8deg); }

.overlay-blush {
  position: absolute;
  bottom: 14%;
  width: 12%;
  height: 8%;
  border-radius: 999px;
  background: var(--overlay-mood, rgba(255,255,255,0.92));
  opacity: .45;
  filter: blur(1px);
  transition: transform .3s ease, opacity .3s ease, background .3s ease;
}

.overlay-blush-left { left: 18%; }
.overlay-blush-right { right: 18%; }

.pet-unicorn .pet-face-overlay { top: 44%; }
.pet-baby-dragon .pet-face-overlay { top: 43%; }
.pet-bunny .pet-face-overlay { top: 44%; }
.pet-orange-cat .pet-face-overlay { top: 43%; }
.pet-ragdoll .pet-face-overlay { top: 42%; }

.pet-face-overlay.look-left .overlay-eye,
.pet-face-overlay.look-left .overlay-brow { transform: translateX(calc(var(--overlay-look-shift, 4px) * -1)); }
.pet-face-overlay.look-right .overlay-eye,
.pet-face-overlay.look-right .overlay-brow { transform: translateX(var(--overlay-look-shift, 4px)); }
.pet-face-overlay.look-center .overlay-eye,
.pet-face-overlay.look-center .overlay-brow { transform: translateX(0); }

.pet-face-overlay.is-emotion .overlay-mouth {
  transform: translateX(-50%) translateY(-2px) scale(1.04);
}
.pet-face-overlay.is-emotion .overlay-blush {
  opacity: .68;
}
.pet-face-overlay.is-tap .overlay-eye {
  height: 30%;
  border-radius: 999px 999px 12px 12px;
}
.pet-face-overlay.is-tap .overlay-mouth {
  transform: translateX(-50%) translateY(-3px) scale(1.1);
}
.pet-face-overlay.is-tap .overlay-blush {
  opacity: .8;
  transform: scale(1.14);
}
.pet-face-overlay.is-tap .overlay-brow-left { transform: rotate(-10deg); }
.pet-face-overlay.is-tap .overlay-brow-right { transform: rotate(10deg); }

@keyframes overlayBlink {
  0%, 44%, 52%, 100% { transform: scaleY(1); }
  48% { transform: scaleY(0.12); }
}

@keyframes petIdleFloat { 0%,100% { transform: translateY(0) rotate(0deg) scale(1);} 50% { transform: translateY(var(--float-y)) rotate(calc(var(--sway-deg) * -1)) scale(1.03);} }
@keyframes petBreath { 0%,100% { transform: scale(1) translateY(0);} 50% { transform: scale(1.015) translateY(-1px);} }
@keyframes petShadowBreath { 0%,100% { transform: translateX(-50%) scaleX(1); opacity: .34;} 50% { transform: translateX(-50%) scaleX(.92); opacity: .24;} }
@keyframes earLeft { 0%,100% { transform: rotate(-8deg);} 50% { transform: rotate(-18deg);} }
@keyframes earRight { 0%,100% { transform: rotate(8deg);} 50% { transform: rotate(18deg);} }
@keyframes tailIdle { from { transform: rotate(10deg) scale(1);} to { transform: rotate(28deg) scale(1.03);} }
@keyframes sparkle { 0%,100% { transform: translateY(0) scale(.2); opacity: 0;} 30% { opacity: .7;} 55% { transform: translateY(-10px) scale(1); opacity: 1;} }
@keyframes orbitDriftA { 0% { transform: rotate(0deg) scale(1);} 100% { transform: rotate(360deg) scale(1.03);} }
@keyframes orbitDriftB { 0% { transform: rotate(0deg) scale(1);} 100% { transform: rotate(-360deg) scale(.98);} }
@keyframes wingFloat { 0%,100% { transform: rotate(0deg) translateY(0);} 50% { transform: rotate(8deg) translateY(-6px);} }
@keyframes wingTap { 0% { transform: rotate(0deg) scale(1);} 100% { transform: rotate(14deg) scale(1.06);} }
@keyframes petTap { 0% { transform: translateY(0) scale(1) rotate(0);} 25% { transform: translateY(var(--tap-lift)) scale(var(--tap-scale)) rotate(-2deg);} 55% { transform: translateY(calc(var(--tap-lift) * 1.3)) scale(calc(var(--tap-scale) + .01)) rotate(2deg);} 80% { transform: translateY(0) scale(.98) rotate(0);} 100% { transform: translateY(0) scale(1) rotate(0);} }
@keyframes petShadowTap { 0% { transform: translateX(-50%) scaleX(1); opacity: .34;} 45% { transform: translateX(-50%) scaleX(.82); opacity: .18;} 80% { transform: translateX(-50%) scaleX(1.06); opacity: .36;} 100% { transform: translateX(-50%) scaleX(1); opacity: .34;} }
@keyframes tailTap { from { transform: rotate(8deg);} to { transform: rotate(34deg);} }
@keyframes earTapLeft { 0% { transform: rotate(-8deg);} 40% { transform: rotate(-24deg);} 100% { transform: rotate(-8deg);} }
@keyframes earTapRight { 0% { transform: rotate(8deg);} 40% { transform: rotate(24deg);} 100% { transform: rotate(8deg);} }
@keyframes tapSpark { 0% { transform: translateY(0) scale(.2); opacity: 0;} 25% { opacity: 1;} 100% { transform: translateY(-24px) scale(1.3); opacity: 0;} }
@keyframes petEntrance { 0% { transform: translateY(32px) scale(.82); opacity: 0;} 55% { transform: translateY(-10px) scale(1.03); opacity: 1;} 100% { transform: translateY(0) scale(1); opacity: 1;} }
@keyframes petEmotion { 0%,100% { transform: translateY(0) rotate(0);} 25% { transform: translateY(-5px) rotate(-2deg);} 50% { transform: translateY(-10px) rotate(1deg);} 75% { transform: translateY(-5px) rotate(2deg);} }

.shiba-stage { position: relative; width: 280px; height: 320px; cursor: pointer; transform-origin: center bottom; }
.shiba-stage:active { transform: scale(0.98); }
.shiba-shadow { position: absolute; left: 50%; bottom: 28px; width: 132px; height: 28px; transform: translateX(-50%); border-radius: 999px; background: radial-gradient(circle, rgba(194,120,43,0.38), rgba(194,120,43,0.08) 70%, transparent 100%); filter: blur(4px); animation: shibaShadowBreath 4.4s ease-in-out infinite; }
.shiba-stage .body { position: absolute; left: 50%; bottom: 74px; width: 152px; height: 122px; transform: translateX(-50%); border-radius: 46% 46% 42% 42%; background: linear-gradient(180deg, #f6ad55 0%, #ed8936 60%, #dd6b20 100%); box-shadow: inset -10px -14px 0 rgba(166,84,20,0.12), inset 0 10px 0 rgba(255,255,255,0.22); animation: shibaBodyBreath 4.4s ease-in-out infinite; }
.shiba-stage .body::before { content: ''; position: absolute; left: 20px; right: 20px; top: 22px; bottom: 18px; border-radius: 42% 42% 44% 44%; background: radial-gradient(circle at 50% 20%, rgba(255,255,255,0.28), transparent 44%), linear-gradient(180deg, #fff7ed 0%, #fde6bf 100%); }
.shiba-stage .tail { position: absolute; right: 34px; bottom: 138px; width: 84px; height: 84px; border: 18px solid #f6ad55; border-left-color: transparent; border-bottom-color: transparent; border-radius: 50%; transform-origin: 24px 58px; transform: rotate(28deg); box-shadow: inset 0 0 0 6px rgba(255,255,255,0.12); animation: shibaTailIdle 1.9s ease-in-out infinite; }
.shiba-stage .leg { position: absolute; bottom: 38px; width: 30px; height: 88px; border-radius: 18px; background: linear-gradient(180deg, #f6ad55 0%, #ed8936 100%); box-shadow: inset 0 8px 0 rgba(255,255,255,0.16); }
.shiba-stage .leg::after { content: ''; position: absolute; left: 50%; bottom: -4px; width: 34px; height: 16px; transform: translateX(-50%); border-radius: 999px; background: #7b341e; }
.leg-back-left { left: 88px; z-index: 1; }
.leg-back-right { left: 118px; z-index: 1; }
.leg-front-left { left: 150px; z-index: 3; }
.leg-front-right { left: 182px; z-index: 3; }
.head-wrap { position: absolute; left: 50%; top: 30px; width: 150px; height: 142px; transform: translateX(-50%); transform-origin: 50% 78%; animation: shibaHeadIdle 4.4s ease-in-out infinite; z-index: 5; }
.head { position: absolute; inset: 0; border-radius: 46% 46% 42% 42%; background: linear-gradient(180deg, #f6ad55 0%, #ed8936 62%, #dd6b20 100%); box-shadow: inset 0 10px 0 rgba(255,255,255,0.2); }
.head::before { content: ''; position: absolute; left: 18px; right: 18px; top: 42px; bottom: 16px; border-radius: 46% 46% 54% 54%; background: linear-gradient(180deg, #fffaf0 0%, #fef3c7 100%); }
.shiba-stage .ear { position: absolute; top: -16px; width: 42px; height: 64px; border-radius: 14px 14px 4px 4px; background: linear-gradient(180deg, #dd6b20 0%, #c05621 100%); z-index: -1; }
.shiba-stage .ear::after { content: ''; position: absolute; left: 8px; right: 8px; top: 10px; bottom: 10px; border-radius: 12px 12px 2px 2px; background: rgba(255,237,213,0.68); }
.ear-left { left: 18px; transform: rotate(-20deg); transform-origin: bottom center; animation: shibaEarLeft 4.2s ease-in-out infinite; }
.ear-right { right: 18px; transform: rotate(20deg); transform-origin: bottom center; animation: shibaEarRight 4.2s ease-in-out infinite; }
.brow { position: absolute; top: 48px; width: 20px; height: 4px; border-radius: 999px; background: rgba(123,52,30,0.85); transform-origin: center; transition: transform .35s ease, opacity .35s ease; }
.brow-left { left: 38px; }
.brow-right { right: 38px; }
.shiba-stage .eye { position: absolute; top: 58px; width: 18px; height: 20px; border-radius: 999px; background: #2d1b12; overflow: hidden; animation: shibaBlink 4.8s infinite; transition: transform .35s ease, width .35s ease, height .35s ease, border-radius .35s ease; }
.shiba-stage .eye .pupil { position: absolute; inset: 0; }
.shiba-stage .eye::after { content: ''; position: absolute; right: 2px; top: 2px; width: 4px; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.9); }
.eye-left { left: 42px; }
.eye-right { right: 42px; }
.look-left .eye, .look-left .brow { transform: translateX(-2px); }
.look-right .eye, .look-right .brow { transform: translateX(2px); }
.shiba-stage .cheek { position: absolute; top: 82px; width: 18px; height: 10px; border-radius: 999px; background: rgba(251,146,60,0.18); transition: transform .35s ease, opacity .35s ease, background .35s ease; }
.cheek-left { left: 28px; }
.cheek-right { right: 28px; }
.muzzle { position: absolute; left: 50%; bottom: 24px; width: 68px; height: 46px; transform: translateX(-50%); border-radius: 46% 46% 55% 55%; background: linear-gradient(180deg, #fffaf0 0%, #fef3c7 100%); }
.nose { position: absolute; left: 50%; bottom: 52px; width: 16px; height: 12px; transform: translateX(-50%); border-radius: 40% 40% 60% 60%; background: #2d1b12; }
.mouth { position: absolute; left: 50%; bottom: 34px; width: 28px; height: 16px; transform: translateX(-50%); transition: transform .35s ease, opacity .35s ease; }
.mouth::before, .mouth::after { content: ''; position: absolute; top: 0; width: 14px; height: 14px; border-bottom: 3px solid #7b341e; border-radius: 0 0 12px 12px; transition: all .35s ease; }
.mouth::before { left: 0; transform: rotate(8deg); }
.mouth::after { right: 0; transform: scaleX(-1) rotate(8deg); }
.happy .cheek { background: rgba(251,146,60,0.3); transform: scale(1.15); }
.happy .mouth { transform: translateX(-50%) translateY(-2px); }
.happy .mouth::before, .happy .mouth::after { height: 18px; border-bottom-width: 4px; }
.happy .eye { height: 14px; border-radius: 999px 999px 12px 12px; }
.curious .head-wrap { animation-duration: 2.8s; }
.curious .brow-left { transform: translateX(-1px) rotate(-10deg); }
.curious .brow-right { transform: translateX(1px) rotate(10deg); }
.curious .mouth { transform: translateX(-50%) translateY(-1px) scale(0.92); }
.shy .cheek { background: rgba(244,114,182,0.26); transform: scale(1.2); opacity: .95; }
.shy .brow-left, .shy .brow-right { opacity: .7; }
.shy .eye { transform: translateY(1px) scaleY(.9); }
.tap.happy .mouth { transform: translateX(-50%) translateY(-4px) scale(1.06); }
.spark { position: absolute; width: 10px; height: 10px; border-radius: 999px; background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(253,224,71,0.95) 45%, rgba(251,191,36,0) 100%); opacity: 0; pointer-events: none; }
.spark-1 { left: 210px; top: 70px; }
.spark-2 { left: 232px; top: 104px; }
.spark-3 { left: 82px; top: 92px; }
.idle .spark-1, .happy .spark-1 { animation: shibaSparkle 3.6s ease-in-out infinite; }
.idle .spark-2, .curious .spark-2 { animation: shibaSparkle 3.6s ease-in-out 1.1s infinite; }
.idle .spark-3, .shy .spark-3 { animation: shibaSparkle 3.6s ease-in-out 2.1s infinite; }
.tap .head-wrap { animation: shibaTapHead 1.6s ease forwards; }
.tap .body { animation: shibaTapBody 1.6s ease forwards; }
.tap .tail { animation: shibaTapTail 0.24s ease-in-out 5 alternate; }
.tap .leg-front-right { animation: shibaPawLift 1.6s ease forwards; }
.tap .shiba-shadow { animation: shibaShadowTap 1.6s ease forwards; }
.tap .spark { animation: shibaTapSpark 1.1s ease-out forwards; }
.tap .spark-2 { animation-delay: 0.08s; }
.tap .spark-3 { animation-delay: 0.16s; }
@keyframes shibaBodyBreath { 0%,100% { transform: translateX(-50%) translateY(0) scaleY(1);} 50% { transform: translateX(-50%) translateY(-3px) scaleY(1.02);} }
@keyframes shibaHeadIdle { 0%,100% { transform: translateX(-50%) rotate(0deg);} 25% { transform: translateX(-50%) rotate(-2deg);} 55% { transform: translateX(-50%) rotate(1deg);} 75% { transform: translateX(-50%) rotate(-3deg);} }
@keyframes shibaTailIdle { 0%,100% { transform: rotate(24deg);} 50% { transform: rotate(42deg);} }
@keyframes shibaEarLeft { 0%,100% { transform: rotate(-20deg);} 50% { transform: rotate(-28deg);} }
@keyframes shibaEarRight { 0%,100% { transform: rotate(20deg);} 50% { transform: rotate(28deg);} }
@keyframes shibaBlink { 0%,44%,52%,100% { transform: scaleY(1);} 48% { transform: scaleY(0.08);} }
@keyframes shibaShadowBreath { 0%,100% { transform: translateX(-50%) scaleX(1); opacity: 0.42;} 50% { transform: translateX(-50%) scaleX(0.94); opacity: 0.34;} }
@keyframes shibaSparkle { 0%,100% { transform: translateY(0) scale(0.6); opacity: 0;} 35% { opacity: 0.7;} 50% { transform: translateY(-10px) scale(1); opacity: 1;} }
@keyframes shibaTapBody { 0% { transform: translateX(-50%) translateY(0) scale(1);} 22% { transform: translateX(-50%) translateY(-16px) scale(1.02);} 42% { transform: translateX(-50%) translateY(-30px) scale(1.03);} 72% { transform: translateX(-50%) translateY(0) scale(0.98);} 100% { transform: translateX(-50%) translateY(0) scale(1);} }
@keyframes shibaTapHead { 0% { transform: translateX(-50%) rotate(0deg) translateY(0);} 18% { transform: translateX(-50%) rotate(-4deg) translateY(-6px);} 40% { transform: translateX(-50%) rotate(1deg) translateY(-18px);} 72% { transform: translateX(-50%) rotate(6deg) translateY(0);} 100% { transform: translateX(-50%) rotate(0deg) translateY(0);} }
@keyframes shibaTapTail { from { transform: rotate(18deg);} to { transform: rotate(52deg);} }
@keyframes shibaPawLift { 0% { transform: translateY(0) rotate(0deg);} 20% { transform: translateY(-12px) rotate(-8deg);} 42% { transform: translateY(-28px) rotate(-12deg);} 72% { transform: translateY(0) rotate(3deg);} 100% { transform: translateY(0) rotate(0deg);} }
@keyframes shibaShadowTap { 0% { transform: translateX(-50%) scaleX(1); opacity: 0.42;} 42% { transform: translateX(-50%) scaleX(0.82); opacity: 0.28;} 72% { transform: translateX(-50%) scaleX(1.08); opacity: 0.46;} 100% { transform: translateX(-50%) scaleX(1); opacity: 0.42;} }
@keyframes shibaTapSpark { 0% { transform: translateY(0) scale(0.2); opacity: 0;} 24% { opacity: 1;} 100% { transform: translateY(-28px) scale(1.4); opacity: 0;} }
</style>

<style>
/* Shiba 动画样式 - 非 scoped 以确保构建后生效 */
.shiba-stage { position: relative; width: 280px; height: 320px; cursor: pointer; transform-origin: center bottom; }
.shiba-stage:active { transform: scale(0.98); }
.shiba-shadow { position: absolute; left: 50%; bottom: 28px; width: 132px; height: 28px; transform: translateX(-50%); border-radius: 999px; background: radial-gradient(circle, rgba(194,120,43,0.38), rgba(194,120,43,0.08) 70%, transparent 100%); filter: blur(4px); animation: shibaShadowBreath 4.4s ease-in-out infinite; }
.shiba-stage .body { position: absolute; left: 50%; bottom: 74px; width: 152px; height: 122px; transform: translateX(-50%); border-radius: 46% 46% 42% 42%; background: linear-gradient(180deg, #f6ad55 0%, #ed8936 60%, #dd6b20 100%); box-shadow: inset -10px -14px 0 rgba(166,84,20,0.12), inset 0 10px 0 rgba(255,255,255,0.22); animation: shibaBodyBreath 4.4s ease-in-out infinite; }
.shiba-stage .body::before { content: ''; position: absolute; left: 20px; right: 20px; top: 22px; bottom: 18px; border-radius: 42% 42% 44% 44%; background: radial-gradient(circle at 50% 20%, rgba(255,255,255,0.28), transparent 44%), linear-gradient(180deg, #fff7ed 0%, #fde6bf 100%); }
.shiba-stage .tail { position: absolute; right: 34px; bottom: 138px; width: 84px; height: 84px; border: 18px solid #f6ad55; border-left-color: transparent; border-bottom-color: transparent; border-radius: 50%; transform-origin: 24px 58px; transform: rotate(28deg); box-shadow: inset 0 0 0 6px rgba(255,255,255,0.12); animation: shibaTailIdle 1.9s ease-in-out infinite; }
.shiba-stage .leg { position: absolute; bottom: 38px; width: 30px; height: 88px; border-radius: 18px; background: linear-gradient(180deg, #f6ad55 0%, #ed8936 100%); box-shadow: inset 0 8px 0 rgba(255,255,255,0.16); }
.shiba-stage .leg::after { content: ''; position: absolute; left: 50%; bottom: -4px; width: 34px; height: 16px; transform: translateX(-50%); border-radius: 999px; background: #7b341e; }
.leg-back-left { left: 32px; }
.leg-back-right { right: 32px; z-index: 1; }
.leg-front-left { left: 48px; z-index: 2; }
.leg-front-right { right: 48px; z-index: 2; }
.head-wrap { position: absolute; left: 50%; top: 30px; width: 150px; height: 142px; transform: translateX(-50%); transform-origin: 50% 78%; animation: shibaHeadIdle 4.4s ease-in-out infinite; z-index: 5; }
.shiba-stage .ear { position: absolute; top: -16px; width: 42px; height: 64px; border-radius: 14px 14px 4px 4px; background: linear-gradient(180deg, #dd6b20 0%, #c05621 100%); z-index: -1; }
.shiba-stage .ear::after { content: ''; position: absolute; left: 8px; right: 8px; top: 10px; bottom: 10px; border-radius: 12px 12px 2px 2px; background: rgba(255,237,213,0.68); }
.ear-left { left: 18px; transform: rotate(-20deg); transform-origin: bottom center; animation: shibaEarLeft 4.2s ease-in-out infinite; }
.ear-right { right: 18px; transform: rotate(20deg); transform-origin: bottom center; animation: shibaEarRight 4.2s ease-in-out infinite; }
.shiba-stage .head { position: relative; width: 100%; height: 100%; border-radius: 46% 46% 42% 42%; background: linear-gradient(180deg, #f6ad55 0%, #ed8936 100%); box-shadow: inset -8px -10px 0 rgba(166,84,20,0.1), inset 0 8px 0 rgba(255,255,255,0.2); }
.shiba-stage .head::before { content: ''; position: absolute; left: 18px; right: 18px; top: 18px; bottom: 32px; border-radius: 42% 42% 44% 44%; background: radial-gradient(circle at 50% 18%, rgba(255,255,255,0.26), transparent 42%), linear-gradient(180deg, #fff7ed 0%, #fde6bf 100%); }
.shiba-stage .brow { position: absolute; top: 38%; width: 22%; height: 8%; border-radius: 999px; background: rgba(123,52,30,0.28); }
.brow-left { left: 16%; transform: rotate(-8deg); }
.brow-right { right: 16%; transform: rotate(8deg); }
.shiba-stage .eye { position: absolute; top: 46%; width: 18%; height: 24%; border-radius: 999px; background: #1a1a1a; box-shadow: inset 0 2px 4px rgba(255,255,255,0.18); }
.eye-left { left: 22%; }
.eye-right { right: 22%; }
.shiba-stage .pupil { position: absolute; left: 50%; top: 50%; width: 42%; height: 42%; transform: translate(-50%, -50%); border-radius: 999px; background: #fff; }
.shiba-stage .cheek { position: absolute; top: 64%; width: 16%; height: 12%; border-radius: 999px; background: rgba(254,178,140,0.42); filter: blur(2px); }
.cheek-left { left: 8%; }
.cheek-right { right: 8%; }
.shiba-stage .muzzle { position: absolute; left: 50%; bottom: 12%; width: 44%; height: 32%; transform: translateX(-50%); border-radius: 42% 42% 38% 38%; background: linear-gradient(180deg, #fff7ed 0%, #fde6bf 100%); }
.shiba-stage .nose { position: absolute; left: 50%; bottom: 36%; width: 18%; height: 14%; transform: translateX(-50%); border-radius: 48% 48% 52% 52%; background: #1a1a1a; }
.shiba-stage .mouth { position: absolute; left: 50%; bottom: 18%; width: 32%; height: 12%; transform: translateX(-50%); }
.shiba-stage .mouth::before, .shiba-stage .mouth::after { content: ''; position: absolute; top: 0; width: 50%; height: 100%; border-bottom: 3px solid #7b341e; border-radius: 0 0 10px 10px; }
.shiba-stage .mouth::before { left: 0; transform: rotate(8deg); }
.shiba-stage .mouth::after { right: 0; transform: scaleX(-1) rotate(8deg); }
.shiba-stage .spark { position: absolute; width: 12px; height: 12px; border-radius: 999px; background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(253,224,71,0.85) 40%, rgba(253,224,71,0) 100%); opacity: 0; pointer-events: none; }
.spark-1 { top: 14%; right: 24%; }
.spark-2 { top: 22%; left: 22%; }
.spark-3 { top: 10%; left: 46%; width: 8px; height: 8px; }

/* Shiba 动画关键帧 */
@keyframes shibaShadowBreath { 0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.42; } 50% { transform: translateX(-50%) scaleX(1.08); opacity: 0.36; } }
@keyframes shibaBodyBreath { 0%, 100% { transform: translateX(-50%) scaleY(1); } 50% { transform: translateX(-50%) scaleY(1.02); } }
@keyframes shibaTailIdle { 0%, 100% { transform: rotate(28deg); } 50% { transform: rotate(38deg); } }
@keyframes shibaHeadIdle { 0%, 100% { transform: translateX(-50%) rotate(0deg); } 30% { transform: translateX(-50%) rotate(-4deg); } 60% { transform: translateX(-50%) rotate(4deg); } }
@keyframes shibaEarLeft { 0%, 100% { transform: rotate(-20deg); } 50% { transform: rotate(-24deg); } }
@keyframes shibaEarRight { 0%, 100% { transform: rotate(20deg); } 50% { transform: rotate(24deg); } }

/* 点击反馈 */
.shiba-stage.tap .shiba-shadow { animation: shibaShadowTap 0.7s ease-out; }
.shiba-stage.tap .body { animation: shibaBodyTap 0.7s ease-out; }
.shiba-stage.tap .head-wrap { animation: shibaHeadTap 0.7s ease-out; }
.shiba-stage.tap .tail { animation: shibaTailTap 0.5s ease-in-out 3 alternate; }
.shiba-stage.tap .ear-left { animation: shibaEarTapLeft 0.6s ease-out; }
.shiba-stage.tap .ear-right { animation: shibaEarTapRight 0.6s ease-out; }
.shiba-stage.tap .spark { animation: shibaTapSpark 0.7s ease-out forwards; }

@keyframes shibaBodyTap { 0% { transform: translateX(-50%) translateY(0); } 24% { transform: translateX(-50%) translateY(-12px); } 100% { transform: translateX(-50%) translateY(0); } }
@keyframes shibaHeadTap { 0% { transform: translateX(-50%) rotate(0deg); } 30% { transform: translateX(-50%) rotate(-6deg) translateY(-8px); } 100% { transform: translateX(-50%) rotate(0deg); } }
@keyframes shibaTailTap { 0% { transform: rotate(28deg); } 100% { transform: rotate(48deg); } }
@keyframes shibaEarTapLeft { 0% { transform: rotate(-20deg); } 40% { transform: rotate(-32deg); } 100% { transform: rotate(-20deg); } }
@keyframes shibaEarTapRight { 0% { transform: rotate(20deg); } 40% { transform: rotate(32deg); } 100% { transform: rotate(20deg); } }
@keyframes shibaShadowTap { 0% { transform: translateX(-50%) scaleX(1); opacity: 0.42;} 42% { transform: translateX(-50%) scaleX(0.82); opacity: 0.28;} 72% { transform: translateX(-50%) scaleX(1.08); opacity: 0.46;} 100% { transform: translateX(-50%) scaleX(1); opacity: 0.42;} }
@keyframes shibaTapSpark { 0% { transform: translateY(0) scale(0.2); opacity: 0;} 24% { opacity: 1;} 100% { transform: translateY(-28px) scale(1.4); opacity: 0;} }

/* ========== 机甲宠物（mecha） ========== */
.mecha-stage { position: relative; width: 140px; height: 160px; cursor: pointer; transform-origin: center bottom; animation: mechaBreath 3.8s ease-in-out infinite; }
.mecha-stage:active { transform: scale(0.97); }
.mecha-shadow { position: absolute; left: 50%; bottom: 12px; width: 100px; height: 20px; transform: translateX(-50%); border-radius: 999px; background: radial-gradient(circle, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 60%, transparent 100%); filter: blur(4px); animation: mechaShadowBreathe 3.8s ease-in-out infinite; }
.mecha-core-ring { position: absolute; left: 50%; bottom: 30px; width: 80px; height: 40px; transform: translateX(-50%); border-radius: 999px; border: 2px solid rgba(251,146,60,0.5); background: radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 70%); animation: mechaCorePulse 2s ease-in-out infinite; }
.mecha-body { position: absolute; left: 50%; bottom: 52px; width: 90px; height: 70px; transform: translateX(-50%); border-radius: 16px 16px 20px 20px; background: linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 40%, #a0a0a0 100%); border: 2px solid #b0b0b0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.8), inset 0 -4px 0 rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2); animation: mechaBodyPulse 3.8s ease-in-out infinite; }
.mecha-body-panel { position: absolute; left: 50%; top: 8px; width: 60px; height: 30px; transform: translateX(-50%); border-radius: 8px; background: linear-gradient(180deg, #d0d0d0 0%, #a8a8a8 100%); border: 1px solid #c0c0c0; }
.mecha-body-vent { position: absolute; left: 14px; top: 14px; width: 18px; height: 18px; border-radius: 4px; background: repeating-linear-gradient(0deg, #888 0px, #888 2px, #666 2px, #666 4px); }
.mecha-body-vent-2 { left: auto; right: 14px; }
.mecha-body-core { position: absolute; left: 50%; bottom: 10px; width: 16px; height: 16px; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(circle, #ff6b00 0%, #ff8c00 50%, #ff6600 100%); box-shadow: 0 0 12px #ff6600, 0 0 24px rgba(255,102,0,0.5); animation: mechaCoreGlow 1.5s ease-in-out infinite; }
.mecha-leg { position: absolute; bottom: 22px; width: 22px; height: 40px; border-radius: 6px; background: linear-gradient(180deg, #d0d0d0 0%, #a0a0a0 100%); border: 1px solid #b0b0b0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -2px 0 rgba(0,0,0,0.1); }
.mecha-leg::after { content: ''; position: absolute; left: 50%; bottom: -4px; width: 26px; height: 10px; transform: translateX(-50%); border-radius: 4px; background: linear-gradient(180deg, #909090 0%, #707070 100%); }
.mecha-leg-left { left: 32px; }
.mecha-leg-right { right: 32px; }
.mecha-tail { position: absolute; right: 8px; bottom: 70px; width: 50px; height: 14px; border-radius: 7px; background: linear-gradient(90deg, #c0c0c0 0%, #e8e8e8 50%, #b0b0b0 100%); border: 1px solid #a0a0a0; transform-origin: 10px 50%; transform: rotate(-15deg); animation: mechaTailWag 2s ease-in-out infinite; }
.mecha-tail::after { content: ''; position: absolute; right: -6px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; border-radius: 50%; background: radial-gradient(circle, #ff8c00 0%, #ff6600 100%); box-shadow: 0 0 8px #ff6600; }
.mecha-head { position: absolute; left: 50%; top: 14px; width: 80px; height: 70px; transform: translateX(-50%); border-radius: 20px 20px 16px 16px; background: linear-gradient(180deg, #e0e0e0 0%, #c8c8c8 40%, #b0b0b0 100%); border: 2px solid #a0a0a0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.9), inset 0 -4px 0 rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15); animation: mechaHeadBob 3.8s ease-in-out infinite; }
.mecha-antenna { position: absolute; top: -14px; width: 4px; height: 16px; border-radius: 2px; background: linear-gradient(180deg, #ff8c00 0%, #c0c0c0 100%); transform-origin: bottom center; }
.mecha-antenna::after { content: ''; position: absolute; top: -6px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; border-radius: 50%; background: radial-gradient(circle, #ffcc00 0%, #ff8c00 100%); box-shadow: 0 0 8px #ff8c00; }
.mecha-antenna-left { left: 20px; animation: mechaAntennaWave 2.5s ease-in-out infinite; }
.mecha-antenna-right { right: 20px; animation: mechaAntennaWave 2.5s ease-in-out 0.5s infinite; }
.mecha-ear { position: absolute; top: 0; width: 18px; height: 24px; border-radius: 4px 16px 4px 4px; background: linear-gradient(180deg, #c0c0c0 0%, #909090 100%); border: 1px solid #a0a0a0; transform-origin: bottom center; animation: mechaEarFlicker 3.5s ease-in-out infinite; }
.mecha-ear-left { left: -10px; transform: rotate(-20deg); }
.mecha-ear-right { right: -10px; transform: rotate(20deg); animation-delay: 0.3s; }
.mecha-face { position: absolute; inset: 8px 6px; border-radius: 12px; background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
.mecha-eye { position: absolute; top: 12px; width: 22px; height: 18px; border-radius: 4px; background: #1a1a1a; border: 1px solid #444; overflow: hidden; animation: mechaEyeBlink 5s infinite; }
.mecha-eye::before { content: ''; position: absolute; inset: 0; border-radius: 4px; background: linear-gradient(180deg, rgba(255,102,0,0.15) 0%, transparent 100%); }
.mecha-eye-left { left: 10px; }
.mecha-eye-right { right: 10px; }
.mecha-eye-glow { position: absolute; left: 50%; top: 50%; width: 12px; height: 10px; transform: translate(-50%, -50%); border-radius: 2px; background: linear-gradient(180deg, #ff8c00 0%, #ff6600 100%); box-shadow: 0 0 8px #ff6600, 0 0 16px rgba(255,102,0,0.5); animation: mechaEyePulse 2s ease-in-out infinite; }
.mecha-eye-glow::after { content: ''; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 4px; height: 4px; border-radius: 1px; background: #fff; box-shadow: 0 0 4px #fff; }
.mecha-mouth { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); width: 24px; height: 6px; border-radius: 3px; background: linear-gradient(90deg, #333 0%, #555 50%, #333 100%); box-shadow: inset 0 1px 0 rgba(255,102,0,0.3); }
.mecha-particle { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: radial-gradient(circle, #ffcc00 0%, #ff8c00 100%); box-shadow: 0 0 6px #ff8c00; opacity: 0; }
.mecha-particle-1 { top: 8%; right: 15%; animation: mechaParticleFloat 3s ease-in-out infinite; }
.mecha-particle-2 { top: 20%; left: 12%; animation: mechaParticleFloat 3s ease-in-out 1s infinite; }
.mecha-particle-3 { top: 12%; left: 40%; animation: mechaParticleFloat 3s ease-in-out 2s infinite; }
@keyframes mechaBreath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
@keyframes mechaShadowBreathe { 0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.35; } 50% { transform: translateX(-50%) scaleX(0.9); opacity: 0.25; } }
@keyframes mechaBodyPulse { 0%, 100% { box-shadow: inset 0 2px 0 rgba(255,255,255,0.8), inset 0 -4px 0 rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2); } 50% { box-shadow: inset 0 2px 0 rgba(255,255,255,0.8), inset 0 -4px 0 rgba(0,0,0,0.15), 0 6px 16px rgba(255,102,0,0.3); } }
@keyframes mechaHeadBob { 0%, 100% { transform: translateX(-50%) rotate(0deg); } 25% { transform: translateX(-50%) rotate(-2deg); } 75% { transform: translateX(-50%) rotate(2deg); } }
@keyframes mechaCorePulse { 0%, 100% { opacity: 0.6; border-color: rgba(251,146,60,0.5); } 50% { opacity: 1; border-color: rgba(251,146,60,0.9); } }
@keyframes mechaCoreGlow { 0%, 100% { box-shadow: 0 0 12px #ff6600, 0 0 24px rgba(255,102,0,0.5); } 50% { box-shadow: 0 0 20px #ff6600, 0 0 40px rgba(255,102,0,0.8); } }
@keyframes mechaTailWag { 0%, 100% { transform: rotate(-15deg); } 50% { transform: rotate(-5deg); } }
@keyframes mechaEyeBlink { 0%, 45%, 55%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.1); } }
@keyframes mechaEyePulse { 0%, 100% { opacity: 0.9; box-shadow: 0 0 8px #ff6600, 0 0 16px rgba(255,102,0,0.5); } 50% { opacity: 1; box-shadow: 0 0 12px #ff6600, 0 0 24px rgba(255,102,0,0.8); } }
@keyframes mechaAntennaWave { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
@keyframes mechaEarFlicker { 0%, 100% { opacity: 1; } 92% { opacity: 1; } 94% { opacity: 0.4; } 96% { opacity: 1; } 98% { opacity: 0.6; } }
@keyframes mechaParticleFloat { 0%, 100% { transform: translateY(0) scale(0.5); opacity: 0; } 30% { opacity: 0.9; } 50% { transform: translateY(-8px) scale(1); opacity: 1; } 70% { opacity: 0.9; } }

/* ========== 机甲宠物（mecha） ========== */
.mecha-stage { position: relative; width: 140px; height: 160px; cursor: pointer; transform-origin: center bottom; animation: mechaBreath 3.8s ease-in-out infinite; }
.mecha-stage:active { transform: scale(0.97); }
.mecha-shadow { position: absolute; left: 50%; bottom: 12px; width: 100px; height: 20px; transform: translateX(-50%); border-radius: 999px; background: radial-gradient(circle, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 60%, transparent 100%); filter: blur(4px); animation: mechaShadowBreathe 3.8s ease-in-out infinite; }
.mecha-core-ring { position: absolute; left: 50%; bottom: 30px; width: 80px; height: 40px; transform: translateX(-50%); border-radius: 999px; border: 2px solid rgba(251,146,60,0.5); background: radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 70%); animation: mechaCorePulse 2s ease-in-out infinite; }
.mecha-body { position: absolute; left: 50%; bottom: 52px; width: 90px; height: 70px; transform: translateX(-50%); border-radius: 16px 16px 20px 20px; background: linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 40%, #a0a0a0 100%); border: 2px solid #b0b0b0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.8), inset 0 -4px 0 rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2); animation: mechaBodyPulse 3.8s ease-in-out infinite; }
.mecha-body-panel { position: absolute; left: 50%; top: 8px; width: 60px; height: 30px; transform: translateX(-50%); border-radius: 8px; background: linear-gradient(180deg, #d0d0d0 0%, #a8a8a8 100%); border: 1px solid #c0c0c0; }
.mecha-body-vent { position: absolute; left: 14px; top: 14px; width: 18px; height: 18px; border-radius: 4px; background: repeating-linear-gradient(0deg, #888 0px, #888 2px, #666 2px, #666 4px); }
.mecha-body-vent-2 { left: auto; right: 14px; }
.mecha-body-core { position: absolute; left: 50%; bottom: 10px; width: 16px; height: 16px; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(circle, #ff6b00 0%, #ff8c00 50%, #ff6600 100%); box-shadow: 0 0 12px #ff6600, 0 0 24px rgba(255,102,0,0.5); animation: mechaCoreGlow 1.5s ease-in-out infinite; }
.mecha-leg { position: absolute; bottom: 22px; width: 22px; height: 40px; border-radius: 6px; background: linear-gradient(180deg, #d0d0d0 0%, #a0a0a0 100%); border: 1px solid #b0b0b0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -2px 0 rgba(0,0,0,0.1); }
.mecha-leg::after { content: ''; position: absolute; left: 50%; bottom: -4px; width: 26px; height: 10px; transform: translateX(-50%); border-radius: 4px; background: linear-gradient(180deg, #909090 0%, #707070 100%); }
.mecha-leg-left { left: 32px; }
.mecha-leg-right { right: 32px; }
.mecha-tail { position: absolute; right: 8px; bottom: 70px; width: 50px; height: 14px; border-radius: 7px; background: linear-gradient(90deg, #c0c0c0 0%, #e8e8e8 50%, #b0b0b0 100%); border: 1px solid #a0a0a0; transform-origin: 10px 50%; transform: rotate(-15deg); animation: mechaTailWag 2s ease-in-out infinite; }
.mecha-tail::after { content: ''; position: absolute; right: -6px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; border-radius: 50%; background: radial-gradient(circle, #ff8c00 0%, #ff6600 100%); box-shadow: 0 0 8px #ff6600; }
.mecha-head { position: absolute; left: 50%; top: 14px; width: 80px; height: 70px; transform: translateX(-50%); border-radius: 20px 20px 16px 16px; background: linear-gradient(180deg, #e0e0e0 0%, #c8c8c8 40%, #b0b0b0 100%); border: 2px solid #a0a0a0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.9), inset 0 -4px 0 rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15); animation: mechaHeadBob 3.8s ease-in-out infinite; }
.mecha-antenna { position: absolute; top: -14px; width: 4px; height: 16px; border-radius: 2px; background: linear-gradient(180deg, #ff8c00 0%, #c0c0c0 100%); transform-origin: bottom center; }
.mecha-antenna::after { content: ''; position: absolute; top: -6px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; border-radius: 50%; background: radial-gradient(circle, #ffcc00 0%, #ff8c00 100%); box-shadow: 0 0 8px #ff8c00; }
.mecha-antenna-left { left: 20px; animation: mechaAntennaWave 2.5s ease-in-out infinite; }
.mecha-antenna-right { right: 20px; animation: mechaAntennaWave 2.5s ease-in-out 0.5s infinite; }
.mecha-ear { position: absolute; top: 0; width: 18px; height: 24px; border-radius: 4px 16px 4px 4px; background: linear-gradient(180deg, #c0c0c0 0%, #909090 100%); border: 1px solid #a0a0a0; transform-origin: bottom center; animation: mechaEarFlicker 3.5s ease-in-out infinite; }
.mecha-ear-left { left: -10px; transform: rotate(-20deg); }
.mecha-ear-right { right: -10px; transform: rotate(20deg); animation-delay: 0.3s; }
.mecha-face { position: absolute; inset: 8px 6px; border-radius: 12px; background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
.mecha-eye { position: absolute; top: 12px; width: 22px; height: 18px; border-radius: 4px; background: #1a1a1a; border: 1px solid #444; overflow: hidden; animation: mechaEyeBlink 5s infinite; }
.mecha-eye::before { content: ''; position: absolute; inset: 0; border-radius: 4px; background: linear-gradient(180deg, rgba(255,102,0,0.15) 0%, transparent 100%); }
.mecha-eye-left { left: 10px; }
.mecha-eye-right { right: 10px; }
.mecha-eye-glow { position: absolute; left: 50%; top: 50%; width: 12px; height: 10px; transform: translate(-50%, -50%); border-radius: 2px; background: linear-gradient(180deg, #ff8c00 0%, #ff6600 100%); box-shadow: 0 0 8px #ff6600, 0 0 16px rgba(255,102,0,0.5); animation: mechaEyePulse 2s ease-in-out infinite; }
.mecha-eye-glow::after { content: ''; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 4px; height: 4px; border-radius: 1px; background: #fff; box-shadow: 0 0 4px #fff; }
.mecha-mouth { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); width: 24px; height: 6px; border-radius: 3px; background: linear-gradient(90deg, #333 0%, #555 50%, #333 100%); box-shadow: inset 0 1px 0 rgba(255,102,0,0.3); }
.mecha-particle { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: radial-gradient(circle, #ffcc00 0%, #ff8c00 100%); box-shadow: 0 0 6px #ff8c00; opacity: 0; }
.mecha-particle-1 { top: 8%; right: 15%; animation: mechaParticleFloat 3s ease-in-out infinite; }
.mecha-particle-2 { top: 20%; left: 12%; animation: mechaParticleFloat 3s ease-in-out 1s infinite; }
.mecha-particle-3 { top: 12%; left: 40%; animation: mechaParticleFloat 3s ease-in-out 2s infinite; }
@keyframes mechaBreath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
@keyframes mechaShadowBreathe { 0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.35; } 50% { transform: translateX(-50%) scaleX(0.9); opacity: 0.25; } }
@keyframes mechaBodyPulse { 0%, 100% { box-shadow: inset 0 2px 0 rgba(255,255,255,0.8), inset 0 -4px 0 rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2); } 50% { box-shadow: inset 0 2px 0 rgba(255,255,255,0.8), inset 0 -4px 0 rgba(0,0,0,0.15), 0 6px 16px rgba(255,102,0,0.3); } }
@keyframes mechaHeadBob { 0%, 100% { transform: translateX(-50%) rotate(0deg); } 25% { transform: translateX(-50%) rotate(-2deg); } 75% { transform: translateX(-50%) rotate(2deg); } }
@keyframes mechaCorePulse { 0%, 100% { opacity: 0.6; border-color: rgba(251,146,60,0.5); } 50% { opacity: 1; border-color: rgba(251,146,60,0.9); } }
@keyframes mechaCoreGlow { 0%, 100% { box-shadow: 0 0 12px #ff6600, 0 0 24px rgba(255,102,0,0.5); } 50% { box-shadow: 0 0 20px #ff6600, 0 0 40px rgba(255,102,0,0.8); } }
@keyframes mechaTailWag { 0%, 100% { transform: rotate(-15deg); } 50% { transform: rotate(-5deg); } }
@keyframes mechaEyeBlink { 0%, 45%, 55%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.1); } }
@keyframes mechaEyePulse { 0%, 100% { opacity: 0.9; box-shadow: 0 0 8px #ff6600, 0 0 16px rgba(255,102,0,0.5); } 50% { opacity: 1; box-shadow: 0 0 12px #ff6600, 0 0 24px rgba(255,102,0,0.8); } }
@keyframes mechaAntennaWave { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
@keyframes mechaEarFlicker { 0%, 100% { opacity: 1; } 92% { opacity: 1; } 94% { opacity: 0.4; } 96% { opacity: 1; } 98% { opacity: 0.6; } }
@keyframes mechaParticleFloat { 0%, 100% { transform: translateY(0) scale(0.5); opacity: 0; } 30% { opacity: 0.9; } 50% { transform: translateY(-8px) scale(1); opacity: 1; } 70% { opacity: 0.9; } }
</style>
