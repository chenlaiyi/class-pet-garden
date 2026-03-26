<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import PetSprite from './PetSprite.vue'

const props = defineProps<{
  matchId: string
  p1Pet: any; p2Pet: any; myPet: any; isP1: boolean
  zoneName: string
}>()

const emit = defineEmits<{ exit: [] }>()
const { api } = useAuth()

// ── 画布尺寸 ────────────────────────────────────────────────
const W = 400, H = 240
const GY = 190         // 地面 Y（赛道底部）
const GRAVITY = 0.7
const JUMP_V = -14
const AUTO_SPEED = 3.0 // 每帧自动前进距离（像素）
const FINISH_DIST = 3000 // 终点距离（像素）
const OBSTACLE_INTERVAL = 280 // 障碍基础间隔（像素）

// ── 宠物角色数据 ───────────────────────────────────────────
interface Racer {
  id: number; name: string; petCode: string; templateId: string
  dist: number   // 已前进距离（像素）
  y: number      // 当前 Y（重力下落用）
  vy: number     // 垂直速度
  onGround: boolean
  alive: boolean
  stunTimer: number  // 眩晕时间（帧）
  blinkTimer: number // 被撞闪烁（帧）
}

const EMOJI_MAP: Record<string, string> = {
  shiba: '🐕', corgi: '🐶', golden: '🦮', bichon: '🐩',
  'orange-cat': '🐱', ragdoll: '🐱', bunny: '🐰', hamster: '🐹',
  duckling: '🦆', alpaca: '🦙', unicorn: '🦄', 'baby-dragon': '🐉',
  husky: '🐺', 'west-highland': '🐕', samoyed: '🐕',
}
function petEmoji(tid: string) { return EMOJI_MAP[tid] || '🐾' }

function mkRacer(id: number, pet: any): Racer {
  return {
    id, name: pet?.displayName || `P${id}`, petCode: pet?.code || `P${id}-000`,
    templateId: pet?.templateId || 'shiba',
    dist: 0, y: GY, vy: 0, onGround: true, alive: true,
    stunTimer: 0, blinkTimer: 0,
  }
}

const racers = reactive([mkRacer(1, props.p1Pet), mkRacer(2, props.p2Pet)])

// ── 障碍物 ─────────────────────────────────────────────────
interface Obstacle {
  id: number; worldX: number; type: 'barrier' | 'double' | 'high'
  w: number; h: number; hit: boolean
}

function genObstacles(): Obstacle[] {
  const obs: Obstacle[] = []
  for (let i = 0; i < 200; i++) {
    const x = OBSTACLE_INTERVAL + i * (OBSTACLE_INTERVAL + Math.random() * 60)
    const types: Array<'barrier' | 'double' | 'high'> = ['barrier', 'barrier', 'barrier', 'double', 'high']
    const type = types[Math.floor(Math.random() * types.length)]
    if (type === 'double') {
      obs.push({ id: i * 2, worldX: x, type: 'double', w: 22, h: 40, hit: false })
      obs.push({ id: i * 2 + 1, worldX: x + 40, type: 'double', w: 22, h: 40, hit: false })
    } else if (type === 'high') {
      obs.push({ id: i * 3, worldX: x, type: 'high', w: 50, h: 28, hit: false })
    } else {
      obs.push({ id: i, worldX: x, type: 'barrier', w: 22, h: 44, hit: false })
    }
  }
  return obs
}

const obstacles = genObstacles()

// ── 赛道背景装饰（云/草丛） ────────────────────────────────
interface Decor {
  worldX: number; type: 'cloud' | 'grass'; speed: number; color: string; w: number; h: number
}

function genDecor(): Decor[] {
  const dec: Decor[] = []
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * 5000
    dec.push({
      worldX: x, type: i % 3 === 0 ? 'cloud' : 'grass',
      speed: 0.3 + Math.random() * 0.4,
      color: i % 3 === 0 ? 'rgba(255,255,255,0.7)' : `hsl(${100 + Math.random() * 40}, 60%, ${45 + Math.random() * 20}%)`,
      w: i % 3 === 0 ? 60 + Math.random() * 40 : 20 + Math.random() * 30,
      h: i % 3 === 0 ? 25 + Math.random() * 15 : 12 + Math.random() * 10,
    })
  }
  return dec
}
const decor = genDecor()

// ── 游戏状态 ───────────────────────────────────────────────
const gamePhase = ref<'countdown' | 'playing' | 'ended'>('countdown')
const countdown = ref(3)
const winner = ref<number | null>(null)
const elapsed = ref(0)
const cameraX = ref(0) // 跟随领先者

const settlementState = reactive({ done: false, loading: false, error: '', pointsChange: 0, newPoints: 0 })

const raf = ref<number | null>(null)
const startTime = ref(0)

// ── 碰撞检测 ───────────────────────────────────────────────
const EGG_W = 28, EGG_H = 34

function hitObstacle(r: Racer, camX: number): Obstacle | null {
  const localX = r.dist - camX
  for (const ob of obstacles) {
    const obScreenX = ob.worldX - camX
    if (obScreenX < -60 || obScreenX > W + 20) continue
    const ox = ob.type === 'double' ? ob.w * 0.3 : ob.w * 0.5
    if (
      localX + EGG_W * 0.7 > ob.worldX + ox - ob.w * 0.5 &&
      localX + EGG_W * 0.3 < ob.worldX + ox + ob.w * 0.5 &&
      r.y + EGG_H * 0.2 < GY + ob.h &&
      r.y + EGG_H * 0.9 > GY
    ) {
      return ob
    }
  }
  return null
}

// ── 帧循环 ───────────────────────────────────────────────
let frame = 0

function loop() {
  if (gamePhase.value !== 'playing') return
  frame++
  elapsed.value = Math.floor((Date.now() - startTime.value) / 1000)

  // 跟随领先者
  const maxDist = Math.max(racers[0].dist, racers[1].dist)
  const minDist = Math.min(racers[0].dist, racers[1].dist)
  cameraX.value = minDist + (maxDist - minDist) * 0.6 // 稍微偏向落后者，让领先者也能看到前方

  for (const r of racers) {
    if (!r.alive) continue

    // 眩晕/减速
    if (r.stunTimer > 0) {
      r.stunTimer--
      r.dist += AUTO_SPEED * 0.2
    } else {
      // 自动前进
      r.dist += AUTO_SPEED
    }

    // 重力
    if (!r.onGround) {
      r.vy += GRAVITY
      r.y += r.vy
      if (r.y >= GY) { r.y = GY; r.vy = 0; r.onGround = true }
    }

    // 闪烁
    if (r.blinkTimer > 0) r.blinkTimer--

    // 障碍碰撞
    const ob = hitObstacle(r, cameraX.value)
    if (ob && !ob.hit) {
      ob.hit = true
      r.stunTimer = 40  // 眩晕约 0.67 秒
      r.blinkTimer = 60
      r.dist = Math.max(0, r.dist - 80) // 撞退 80 像素
    }

    // 到达终点
    if (r.dist >= FINISH_DIST) {
      endGame()
      return
    }
  }

  // 全员阵亡（掉出赛道）
  if (!racers.some(r => r.alive)) { endGame(); return }

  raf.value = requestAnimationFrame(loop)
}

// ── 结束 ───────────────────────────────────────────────────
function endGame() {
  if (raf.value) { cancelAnimationFrame(raf.value); raf.value = null }
  gamePhase.value = 'ended'
  racers.forEach(r => r.alive = false)

  // 计算胜者
  const d0 = racers[0].dist, d1 = racers[1].dist
  let result: 'win' | 'lose' | 'draw' = 'draw'
  if (d0 > d1) { winner.value = 1; result = 'win' }
  else if (d1 > d0) { winner.value = 2; result = 'lose' }
  else { winner.value = 0 }

  settlementState.loading = true

  async function submitResult(attempt = 1) {
    try {
      const res = await api.post('/arena/result', {
        zoneId: 2,
        petInstanceId: props.myPet?.id,
        result
      })
      settlementState.done = true
      settlementState.loading = false
      settlementState.pointsChange = res.data.pointsChange
      settlementState.newPoints = res.data.newPoints
    } catch (e: any) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000))
        return submitResult(attempt + 1)
      }
      settlementState.error = '结算失败，请稍后重试'
      settlementState.loading = false
    }
  }
  submitResult()
}

// ── 绘制 ───────────────────────────────────────────────────
function fmtTime(s: number) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` }

function drawTrack(ctx: CanvasRenderingContext2D, r: Racer, camX: number) {
  const cx = W / 2
  const trackH = H

  // 背景渐变（天空）
  const skyGrad = ctx.createLinearGradient(0, 0, 0, trackH)
  skyGrad.addColorStop(0, '#87CEEB')
  skyGrad.addColorStop(0.6, '#C8E8FF')
  skyGrad.addColorStop(1, '#F0F9E8')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, W, trackH)

  // 远山剪影
  ctx.fillStyle = 'rgba(120,180,120,0.3)'
  for (let i = -1; i < 4; i++) {
    const mx = ((i * 300 - camX * 0.1) % (W + 300)) - 100
    ctx.beginPath()
    ctx.moveTo(mx, GY)
    ctx.lineTo(mx + 150, GY - 80)
    ctx.lineTo(mx + 300, GY)
    ctx.fill()
  }

  // 地面
  ctx.fillStyle = '#7CB342'
  ctx.fillRect(0, GY, W, trackH - GY)
  ctx.fillStyle = '#558B2F'
  ctx.fillRect(0, GY, W, 6)

  // 地面纹理（条纹）
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  const stripeSpacing = 40
  const stripeOffset = camX % stripeSpacing
  for (let x = -stripeOffset; x < W; x += stripeSpacing) {
    ctx.fillRect(x, GY + 8, 20, trackH - GY - 8)
  }

  // 终点线（超出镜头才显示）
  const finishScreenX = FINISH_DIST - camX
  if (finishScreenX > -100 && finishScreenX < W + 100) {
    ctx.fillStyle = '#222'
    ctx.fillRect(finishScreenX - 4, GY - 120, 8, 120)
    // 格子旗
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#222'
        ctx.fillRect(finishScreenX + col * 12, GY - 120 + row * 20, 12, 20)
      }
    }
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🏁 终点', finishScreenX, GY - 126)
  }

  // 背景装饰
  for (const d of decor) {
    const sx = d.worldX - camX * d.speed
    const nx = ((sx % (W + 200)) + W + 200) % (W + 200) - 100
    if (nx < -100 || nx > W + 100) continue
    if (d.type === 'cloud') {
      ctx.fillStyle = d.color
      ctx.beginPath()
      ctx.ellipse(nx, d.h + 10, d.w / 2, d.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = d.color
      ctx.fillRect(nx, GY - d.h, d.w, d.h)
    }
  }

  // 障碍
  for (const ob of obstacles) {
    const sx = ob.worldX - camX
    if (sx < -60 || sx > W + 60) continue
    const obY = GY - ob.h

    if (ob.type === 'barrier') {
      // 木栅栏
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(sx - ob.w / 2, obY, ob.w, ob.h)
      ctx.fillStyle = '#A0522D'
      ctx.fillRect(sx - ob.w / 2 + 3, obY + 4, ob.w - 6, 6)
      ctx.fillRect(sx - ob.w / 2 + 3, obY + 20, ob.w - 6, 6)
      ctx.fillStyle = ob.hit ? 'rgba(255,0,0,0.3)' : 'rgba(255,100,100,0.3)'
      ctx.fillRect(sx - ob.w / 2, obY, ob.w, ob.h)
    } else if (ob.type === 'double') {
      // 双柱（需要跨过去）
      ctx.fillStyle = '#D32F2F'
      ctx.fillRect(sx - ob.w / 2, obY, ob.w, ob.h)
      ctx.fillStyle = '#FF5252'
      ctx.fillRect(sx - ob.w / 2 + 2, obY + 4, ob.w - 4, 4)
    } else if (ob.type === 'high') {
      // 高障碍（需要特别注意）
      ctx.fillStyle = '#FF8F00'
      ctx.fillRect(sx - ob.w / 2, obY, ob.w, ob.h)
      ctx.fillStyle = '#FFB300'
      ctx.fillRect(sx - ob.w / 2 + 4, obY + 4, ob.w - 8, 4)
      // 感叹号
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('!', sx, obY + 18)
    }
  }

  // 距离指示（屏幕上方）
  const pct = Math.min(100, (r.dist / FINISH_DIST) * 100)
  ctx.fillStyle = '#5EC8F5'
  ctx.fillRect(cx - 40, 8, 80, 8)
  ctx.fillStyle = '#fff'
  ctx.fillRect(cx - 40, 8, 80 * (pct / 100), 8)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.floor(pct)}%`, cx, 15)
}

// ── Canvas 引用 & 赛道 DOM ───────────────────────────────
const canvas1 = ref<HTMLCanvasElement | null>(null)
const canvas2 = ref<HTMLCanvasElement | null>(null)

const SPRITE_SIZE = 56 // 宠物精灵渲染尺寸 px

function racerBlink(racer: Racer): boolean {
  return racer.blinkTimer > 0 && Math.floor(racer.blinkTimer / 5) % 2 === 0
}

function render() {
  if (gamePhase.value === 'playing') {
    if (canvas1.value) {
      const ctx = canvas1.value.getContext('2d')!
      ctx.clearRect(0, 0, W, H)
      drawTrack(ctx, racers[0], cameraX.value)
    }
    if (canvas2.value) {
      const ctx = canvas2.value.getContext('2d')!
      ctx.clearRect(0, 0, W, H)
      drawTrack(ctx, racers[1], cameraX.value)
    }
  }
  if (gamePhase.value !== 'ended') {
    requestAnimationFrame(render)
  }
}

// ── 输入 ───────────────────────────────────────────────────
let lastKeys: Record<string, boolean> = {}

function press(btn: string, pid: number) {
  if (lastKeys[btn + pid]) return
  lastKeys[btn + pid] = true
  const r = racers[pid]
  if (!r.alive || r.stunTimer > 0) return
  if (r.onGround) {
    r.vy = JUMP_V
    r.onGround = false
  }
}

function onKey(e: KeyboardEvent) {
  if (gamePhase.value === 'playing') {
    if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); press('jump', 0) }
    else if (e.key === 'w' || e.key === 'W') press('jump', 1)
  }
}

// 手柄
let gpInterval: ReturnType<typeof setInterval> | null = null
function pollGp() {
  const gps = navigator.getGamepads()
  for (const gp of gps) {
    if (!gp) continue
    const pid = gp.index > 0 ? 1 : 0
    if (gp.buttons[0]?.pressed || gp.buttons[3]?.pressed) press('jump', pid)
    if (gp.buttons[12]?.pressed) press('jump', pid) // 上
  }
}
function gpConn(e: GamepadEvent) { console.log('🎮 手柄连接:', e.gamepad.id) }
function gpDisc(e: GamepadEvent) { console.log('🎮 手柄断开:', e.gamepad.id) }

// ── 循环驱动（障碍 + 前进） ────────────────────────────────
let gameRaf: number | null = null
function startGameLoop() {
  function tick() {
    if (gamePhase.value !== 'playing') return
    loop()
    gameRaf = requestAnimationFrame(tick)
  }
  gameRaf = requestAnimationFrame(tick)
}

// ── 生命周期 ───────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('gamepadconnected', gpConn)
  window.addEventListener('gamepaddisconnected', gpDisc)
  gpInterval = setInterval(pollGp, 50)

  // 倒计时
  const ci = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(ci)
      gamePhase.value = 'playing'
      startTime.value = Date.now()
      startGameLoop()
      render()
    }
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('gamepadconnected', gpConn)
  window.removeEventListener('gamepaddisconnected', gpDisc)
  if (gameRaf) cancelAnimationFrame(gameRaf)
  if (raf.value) cancelAnimationFrame(raf.value)
  if (gpInterval) clearInterval(gpInterval)
})
</script>

<template>
  <!-- 倒计时 -->
  <div v-if="gamePhase === 'countdown'" class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-200 to-sky-100 text-gray-800">
    <div class="text-9xl font-black text-orange-400 animate-pulse">{{ countdown }}</div>
    <div class="text-2xl text-gray-500 mt-4">准备好了吗？</div>
    <div class="flex items-center gap-8 mt-10">
      <div class="text-center">
        <div class="text-6xl">{{ petEmoji(p1Pet?.templateId || 'shiba') }}</div>
        <div class="font-bold mt-1">{{ p1Pet?.displayName }}</div>
        <div class="text-xs text-gray-400">空格/↑ 跳跃</div>
      </div>
      <div class="text-4xl font-black text-gray-400">🏃</div>
      <div class="text-center">
        <div class="text-6xl">{{ petEmoji(p2Pet?.templateId || 'corgi') }}</div>
        <div class="font-bold mt-1">{{ p2Pet?.displayName }}</div>
        <div class="text-xs text-gray-400">W 跳跃</div>
      </div>
    </div>
  </div>

  <!-- 对战 -->
  <div v-else-if="gamePhase === 'playing'" class="max-w-5xl mx-auto py-4 px-2 space-y-3">

    <!-- 顶栏 -->
    <div class="flex items-center justify-between px-2">
      <div class="flex items-center gap-2">
        <span class="text-lg">🏁</span>
        <span class="font-black text-gray-700 text-sm">{{ zoneName }}</span>
      </div>
      <div class="flex items-center gap-3 text-sm text-gray-500">
        <span>⏱</span>
        <span class="font-mono">{{ fmtTime(elapsed) }}</span>
      </div>
    </div>

    <!-- 双人赛道 -->
    <div class="flex flex-col lg:flex-row gap-3 items-start justify-center">

      <!-- P1 -->
      <div class="flex flex-col items-center gap-1 flex-1">
        <div class="flex items-center gap-2 w-full justify-center">
          <PetSprite :template-id="racers[0].templateId" :size="32" :stunned="racers[0].stunTimer > 0" :animating="true" />
          <div class="text-left">
            <div class="font-bold text-gray-800 text-sm">{{ racers[0].name }}</div>
            <div class="text-xs text-gray-400">{{ racers[0].petCode }}</div>
          </div>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full"
            :class="!racers[0].alive ? 'bg-red-100 text-red-500' : racers[0].stunTimer > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'">
            {{ !racers[0].alive ? '出局' : racers[0].stunTimer > 0 ? '💫眩晕' : '🏃竞速' }}
          </span>
        </div>
        <div class="text-xs text-gray-500">
          进度 <strong class="text-blue-600">{{ Math.floor((racers[0].dist / FINISH_DIST) * 100) }}%</strong>
          · 已跑 <strong>{{ Math.floor(racers[0].dist) }}</strong>m
        </div>
        <!-- 赛道画布 + 宠物叠加层 -->
        <div class="relative rounded-xl border-4 border-blue-300 shadow-lg overflow-hidden" :style="{ width: W + 'px', height: H + 'px' }">
          <canvas ref="canvas1" :width="W" :height="H" class="block" />
          <!-- P1 宠物精灵：固定在画布中 -->
          <div
            v-if="!racerBlink(racers[0])"
            class="absolute pointer-events-none transition-all duration-75"
            :style="{
              left: (W / 2 - 30) + 'px',
              bottom: (H - GY - 20) + 'px',
              width: SPRITE_SIZE + 'px',
              height: SPRITE_SIZE + 'px',
              opacity: racers[0].stunTimer > 0 ? 0.6 : 1,
            }"
          >
            <PetSprite :template-id="racers[0].templateId" :size="SPRITE_SIZE" :stunned="racers[0].stunTimer > 0" :animating="true" />
          </div>
          <!-- P2 宠物精灵（P1 视角里看到对手）：固定在画布中偏右 -->
          <div
            v-if="!racerBlink(racers[1]) && gamePhase === 'playing'"
            class="absolute pointer-events-none transition-all duration-75"
            :style="{
              left: (W / 2 + 30) + 'px',
              bottom: (H - GY - 20) + 'px',
              width: SPRITE_SIZE + 'px',
              height: SPRITE_SIZE + 'px',
              opacity: racers[1].stunTimer > 0 ? 0.6 : 1,
            }"
          >
            <PetSprite :template-id="racers[1].templateId" :size="SPRITE_SIZE" :stunned="racers[1].stunTimer > 0" :animating="true" />
          </div>
        </div>
        <div class="text-xs text-gray-400">空格 / ↑ 跳跃</div>
      </div>

      <!-- 中间 -->
      <div class="flex flex-col items-center justify-center text-center py-2 space-y-2">
        <div class="text-3xl font-black text-gray-300">🏁</div>
        <div class="text-xs text-gray-400">竞速赛道</div>
        <div class="text-xs text-gray-400">躲避障碍</div>
        <div class="text-xs text-gray-400">率先到达</div>
        <div class="text-xs text-gray-400">终点获胜</div>
        <div class="text-sm font-bold text-orange-500 mt-2">{{ fmtTime(elapsed) }}</div>
      </div>

      <!-- P2 -->
      <div class="flex flex-col items-center gap-1 flex-1">
        <div class="flex items-center gap-2 w-full justify-center">
          <PetSprite :template-id="racers[1].templateId" :size="32" :stunned="racers[1].stunTimer > 0" :animating="true" />
          <div class="text-left">
            <div class="font-bold text-gray-800 text-sm">{{ racers[1].name }}</div>
            <div class="text-xs text-gray-400">{{ racers[1].petCode }}</div>
          </div>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full"
            :class="!racers[1].alive ? 'bg-red-100 text-red-500' : racers[1].stunTimer > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-orange-100 text-orange-600'">
            {{ !racers[1].alive ? '出局' : racers[1].stunTimer > 0 ? '💫眩晕' : '🏃竞速' }}
          </span>
        </div>
        <div class="text-xs text-gray-500">
          进度 <strong class="text-orange-600">{{ Math.floor((racers[1].dist / FINISH_DIST) * 100) }}%</strong>
          · 已跑 <strong>{{ Math.floor(racers[1].dist) }}</strong>m
        </div>
        <!-- 赛道画布 + 宠物叠加层 -->
        <div class="relative rounded-xl border-4 border-orange-300 shadow-lg overflow-hidden" :style="{ width: W + 'px', height: H + 'px' }">
          <canvas ref="canvas2" :width="W" :height="H" class="block" />
          <!-- P2 宠物精灵 -->
          <div
            v-if="!racerBlink(racers[1])"
            class="absolute pointer-events-none transition-all duration-75"
            :style="{
              left: (W / 2 + 30) + 'px',
              bottom: (H - GY - 20) + 'px',
              width: SPRITE_SIZE + 'px',
              height: SPRITE_SIZE + 'px',
              opacity: racers[1].stunTimer > 0 ? 0.6 : 1,
            }"
          >
            <PetSprite :template-id="racers[1].templateId" :size="SPRITE_SIZE" :stunned="racers[1].stunTimer > 0" :animating="true" />
          </div>
          <!-- P1 宠物精灵（P2 视角里看到对手） -->
          <div
            v-if="!racerBlink(racers[0]) && gamePhase === 'playing'"
            class="absolute pointer-events-none transition-all duration-75"
            :style="{
              left: (W / 2 - 30) + 'px',
              bottom: (H - GY - 20) + 'px',
              width: SPRITE_SIZE + 'px',
              height: SPRITE_SIZE + 'px',
              opacity: racers[0].stunTimer > 0 ? 0.6 : 1,
            }"
          >
            <PetSprite :template-id="racers[0].templateId" :size="SPRITE_SIZE" :stunned="racers[0].stunTimer > 0" :animating="true" />
          </div>
        </div>
        <div class="text-xs text-gray-400">W 跳跃</div>
      </div>
    </div>

    <!-- 规则提示 -->
    <div class="text-center text-xs text-gray-400">
      障碍：🟥 木栅栏（普通跳跃）/ 🟧 高障碍（需要精准跳跃）/ 🔴 双柱（快速反应）
      · P1: 空格/↑ | P2: W
    </div>
  </div>

  <!-- 结果页 -->
  <div v-else-if="gamePhase === 'ended'" class="max-w-3xl mx-auto py-8 px-4 text-center space-y-5">

    <!-- 完赛成绩 -->
    <div class="grid grid-cols-2 gap-4">
      <div v-for="r in racers" :key="r.id"
        class="rounded-3xl border-2 p-5 text-center"
        :class="winner === r.id ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400' : 'bg-gray-50 border-gray-200'">
        <div class="text-4xl">{{ petEmoji(r.templateId) }}</div>
        <div class="font-bold text-gray-800 mt-1">{{ r.name }}</div>
        <div class="text-xs text-gray-400">{{ r.petCode }}</div>
        <div class="mt-2 text-2xl font-black" :class="winner === r.id ? 'text-yellow-600' : 'text-gray-400'">
          {{ Math.floor((r.dist / FINISH_DIST) * 100) }}%
        </div>
        <div class="text-sm text-gray-500 mt-1">已跑 {{ Math.floor(r.dist) }}m</div>
        <div v-if="winner === r.id" class="mt-2 text-2xl">🏆</div>
      </div>
    </div>

    <!-- 胜者宣告 -->
    <div class="text-5xl">{{ winner === 0 ? '🤝' : winner === 1 ? petEmoji(racers[0].templateId) : petEmoji(racers[1].templateId) }}</div>
    <h2 class="text-3xl font-black text-gray-900">
      {{ winner === 0 ? '平局！' : winner === 1 ? `${racers[0].name} 获胜！` : `${racers[1].name} 获胜！` }}
    </h2>

    <!-- 积分结算 -->
    <div class="inline-block px-6 py-4 rounded-2xl text-sm space-y-2"
      :class="winner === 1 ? 'bg-green-50 border border-green-200' : winner === 0 ? 'bg-gray-50 border border-gray-200' : 'bg-red-50 border border-red-200'">
      <div v-if="settlementState.loading" class="text-gray-500 flex items-center justify-center gap-2">
        <span class="animate-spin">⏳</span> 结算中...
      </div>
      <div v-else-if="settlementState.error" class="text-red-500 font-bold">{{ settlementState.error }}</div>
      <template v-else>
        <div class="flex items-center gap-2"><span class="text-gray-400">入场：</span><span class="text-red-500 font-bold">-5</span></div>
        <div v-if="winner === 1" class="flex items-center gap-2"><span class="text-gray-400">获胜奖励：</span><span class="text-green-500 font-bold">+10</span></div>
        <div class="border-t border-gray-200 pt-2 flex items-center justify-center gap-2">
          <span class="text-gray-500 font-medium">本场积分变化：</span>
          <span class="text-xl font-black" :class="settlementState.pointsChange >= 0 ? 'text-green-600' : 'text-red-500'">
            {{ settlementState.pointsChange >= 0 ? '+' : '' }}{{ settlementState.pointsChange }}
          </span>
        </div>
      </template>
    </div>

    <div class="flex gap-4 justify-center mt-4">
      <button @click="emit('exit')" class="px-8 py-3 rounded-3xl bg-gray-100 text-gray-700 font-bold">返回竞技场</button>
    </div>
  </div>
</template>