<script setup lang="ts">
import { ref } from 'vue'
import PageLayout from '@/components/layout/PageLayout.vue'

const mode = ref<'idle' | 'tap'>('idle')
const tapped = ref(false)

function playTap() {
  mode.value = 'tap'
  tapped.value = false
  requestAnimationFrame(() => {
    tapped.value = true
  })
  window.setTimeout(() => {
    mode.value = 'idle'
    tapped.value = false
  }, 1600)
}
</script>

<template>
  <PageLayout>
    <div class="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <div class="relative overflow-hidden rounded-[36px] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(255,237,213,0.95),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(254,215,170,0.55),_transparent_24%),linear-gradient(180deg,_#fffaf5_0%,_#fff_38%,_#fff7ed_100%)] p-6 md:p-8 shadow-[0_30px_90px_rgba(249,115,22,0.12)]">
        <div class="absolute -left-10 top-8 h-40 w-40 rounded-full bg-orange-200/30 blur-3xl"></div>
        <div class="absolute right-0 top-24 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl"></div>

        <div class="relative z-10 mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/85 px-4 py-1.5 text-sm font-semibold text-orange-500 shadow-sm">
              <span>🐕</span>
              <span>柴柴角色动画打样</span>
            </div>
            <h1 class="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">这版先验证“是不是角色在动”</h1>
            <p class="mt-3 max-w-3xl text-base leading-7 text-gray-500 md:text-lg">
              不是整张图片飘一下，而是用头、耳朵、尾巴、重心和点击反馈把“有生命感”先做出来。现在这版是本地动效打样，用来定方向。
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              class="rounded-2xl border px-5 py-3 font-bold transition-all duration-300"
              :class="mode === 'idle' ? 'border-transparent bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-lg' : 'border-orange-100 bg-white text-gray-600 hover:-translate-y-0.5 hover:shadow-md'"
              @click="mode = 'idle'"
            >
              看待机
            </button>
            <button
              class="rounded-2xl border border-transparent bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-5 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              @click="playTap"
            >
              点一下看看反馈
            </button>
          </div>
        </div>

        <div class="relative z-10 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div class="relative overflow-hidden rounded-[32px] border border-white/80 bg-[radial-gradient(circle_at_50%_18%,_rgba(255,255,255,0.98),_transparent_25%),linear-gradient(180deg,_#fff_0%,_#fff7ed_100%)] p-6 md:p-8 shadow-[0_20px_60px_rgba(251,146,60,0.12)]">
            <div class="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,transparent_0%,rgba(255,237,213,0.75)_60%,rgba(253,230,138,0.85)_100%)]"></div>
            <div class="absolute bottom-8 left-1/2 h-8 w-40 -translate-x-1/2 rounded-full bg-orange-300/35 blur-2xl"></div>

            <div class="relative mx-auto flex min-h-[500px] max-w-[420px] items-center justify-center">
              <div class="shiba-stage" :class="{ idle: mode === 'idle', tap: tapped }">
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
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-[28px] border border-white bg-white/85 p-5 shadow-xl">
              <div class="mb-3 text-sm font-semibold text-orange-500">这版在验证什么</div>
              <ul class="space-y-3 text-sm leading-6 text-gray-600">
                <li>• 待机时有没有生命感，而不是一张图悬浮</li>
                <li>• 点击后是不是角色身体自己在回应</li>
                <li>• 头、耳朵、尾巴、重心有没有联动</li>
                <li>• 风格是不是更接近“高端陪伴系”</li>
              </ul>
            </div>

            <div class="rounded-[28px] border border-white bg-white/85 p-5 shadow-xl">
              <div class="mb-3 text-sm font-semibold text-orange-500">当前动作拆解</div>
              <div class="space-y-4 text-sm text-gray-600">
                <div>
                  <div class="font-bold text-gray-800">待机 Idle</div>
                  <div class="mt-1 leading-6">呼吸起伏、耳朵轻抖、尾巴慢摆、眼睛眨动、头部轻微歪头、整体重心轻轻换边。</div>
                </div>
                <div>
                  <div class="font-bold text-gray-800">点击反馈 Tap</div>
                  <div class="mt-1 leading-6">先抬头，再抬前脚，小跳一下，尾巴快速摇，落地有缓冲，脸部表情更开心。</div>
                </div>
              </div>
            </div>

            <div class="rounded-[28px] border border-white bg-white/85 p-5 shadow-xl">
              <div class="mb-3 text-sm font-semibold text-orange-500">我建议你重点看</div>
              <ul class="space-y-3 text-sm leading-6 text-gray-600">
                <li>1. 这只柴柴有没有“活着”的感觉</li>
                <li>2. 点一下时是不是比单纯图片动更像宠物回应</li>
                <li>3. 整体气质够不够温暖、治愈、亲人</li>
                <li>4. 这个方向值不值得继续升级成正式资产</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.shiba-stage {
  position: relative;
  width: 280px;
  height: 320px;
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
  animation: shadowBreath 4.4s ease-in-out infinite;
}

.body {
  position: absolute;
  left: 50%;
  bottom: 74px;
  width: 152px;
  height: 122px;
  transform: translateX(-50%);
  border-radius: 46% 46% 42% 42%;
  background: linear-gradient(180deg, #f6ad55 0%, #ed8936 60%, #dd6b20 100%);
  box-shadow: inset -10px -14px 0 rgba(166, 84, 20, 0.12), inset 0 10px 0 rgba(255, 255, 255, 0.22);
  animation: bodyBreath 4.4s ease-in-out infinite;
}

.body::before {
  content: '';
  position: absolute;
  left: 20px;
  right: 20px;
  top: 22px;
  bottom: 18px;
  border-radius: 42% 42% 44% 44%;
  background: radial-gradient(circle at 50% 20%, rgba(255,255,255,0.28), transparent 44%), linear-gradient(180deg, #fff7ed 0%, #fde6bf 100%);
}

.tail {
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
  animation: tailIdle 1.9s ease-in-out infinite;
}

.leg {
  position: absolute;
  bottom: 38px;
  width: 30px;
  height: 88px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f6ad55 0%, #ed8936 100%);
  box-shadow: inset 0 8px 0 rgba(255,255,255,0.16);
}

.leg::after {
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
  animation: headIdle 4.4s ease-in-out infinite;
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

.ear {
  position: absolute;
  top: -16px;
  width: 42px;
  height: 64px;
  border-radius: 14px 14px 4px 4px;
  background: linear-gradient(180deg, #dd6b20 0%, #c05621 100%);
  z-index: -1;
}

.ear::after {
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
  animation: earLeft 4.2s ease-in-out infinite;
}

.ear-right {
  right: 18px;
  transform: rotate(20deg);
  transform-origin: bottom center;
  animation: earRight 4.2s ease-in-out infinite;
}

.eye {
  position: absolute;
  top: 58px;
  width: 16px;
  height: 18px;
  border-radius: 999px;
  background: #2d1b12;
  animation: blink 4.8s infinite;
}

.eye::after {
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

.cheek {
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

.idle .spark-1 { animation: sparkle 3.6s ease-in-out infinite; }
.idle .spark-2 { animation: sparkle 3.6s ease-in-out 1.1s infinite; }
.idle .spark-3 { animation: sparkle 3.6s ease-in-out 2.1s infinite; }

.tap .head-wrap {
  animation: tapHead 1.6s ease forwards;
}

.tap .body {
  animation: tapBody 1.6s ease forwards;
}

.tap .tail {
  animation: tapTail 0.24s ease-in-out 5 alternate;
}

.tap .leg-front-right {
  animation: pawLift 1.6s ease forwards;
}

.tap .shiba-shadow {
  animation: shadowTap 1.6s ease forwards;
}

.tap .spark {
  animation: tapSpark 1.1s ease-out forwards;
}

.tap .spark-2 { animation-delay: 0.08s; }
.tap .spark-3 { animation-delay: 0.16s; }

@keyframes bodyBreath {
  0%, 100% { transform: translateX(-50%) translateY(0) scaleY(1); }
  50% { transform: translateX(-50%) translateY(-3px) scaleY(1.02); }
}

@keyframes headIdle {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  25% { transform: translateX(-50%) rotate(-2deg); }
  55% { transform: translateX(-50%) rotate(1deg); }
  75% { transform: translateX(-50%) rotate(-3deg); }
}

@keyframes tailIdle {
  0%, 100% { transform: rotate(24deg); }
  50% { transform: rotate(42deg); }
}

@keyframes earLeft {
  0%, 100% { transform: rotate(-20deg); }
  50% { transform: rotate(-28deg); }
}

@keyframes earRight {
  0%, 100% { transform: rotate(20deg); }
  50% { transform: rotate(28deg); }
}

@keyframes blink {
  0%, 44%, 52%, 100% { transform: scaleY(1); }
  48% { transform: scaleY(0.08); }
}

@keyframes shadowBreath {
  0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.42; }
  50% { transform: translateX(-50%) scaleX(0.94); opacity: 0.34; }
}

@keyframes sparkle {
  0%, 100% { transform: translateY(0) scale(0.6); opacity: 0; }
  35% { opacity: 0.7; }
  50% { transform: translateY(-10px) scale(1); opacity: 1; }
}

@keyframes tapBody {
  0% { transform: translateX(-50%) translateY(0) scale(1); }
  22% { transform: translateX(-50%) translateY(-16px) scale(1.02); }
  42% { transform: translateX(-50%) translateY(-30px) scale(1.03); }
  72% { transform: translateX(-50%) translateY(0) scale(0.98); }
  100% { transform: translateX(-50%) translateY(0) scale(1); }
}

@keyframes tapHead {
  0% { transform: translateX(-50%) rotate(0deg) translateY(0); }
  18% { transform: translateX(-50%) rotate(-4deg) translateY(-6px); }
  40% { transform: translateX(-50%) rotate(1deg) translateY(-18px); }
  72% { transform: translateX(-50%) rotate(6deg) translateY(0); }
  100% { transform: translateX(-50%) rotate(0deg) translateY(0); }
}

@keyframes tapTail {
  from { transform: rotate(18deg); }
  to { transform: rotate(52deg); }
}

@keyframes pawLift {
  0% { transform: translateY(0) rotate(0deg); }
  20% { transform: translateY(-12px) rotate(-8deg); }
  42% { transform: translateY(-28px) rotate(-12deg); }
  72% { transform: translateY(0) rotate(3deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

@keyframes shadowTap {
  0% { transform: translateX(-50%) scaleX(1); opacity: 0.42; }
  42% { transform: translateX(-50%) scaleX(0.82); opacity: 0.28; }
  72% { transform: translateX(-50%) scaleX(1.08); opacity: 0.46; }
  100% { transform: translateX(-50%) scaleX(1); opacity: 0.42; }
}

@keyframes tapSpark {
  0% { transform: translateY(0) scale(0.2); opacity: 0; }
  24% { opacity: 1; }
  100% { transform: translateY(-28px) scale(1.4); opacity: 0; }
}
</style>
