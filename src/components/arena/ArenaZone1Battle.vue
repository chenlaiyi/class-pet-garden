<script setup lang="ts">
import { reactive, onMounted, onUnmounted, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  matchId: string
  p1Pet: any; p2Pet: any; myPet: any; isP1: boolean
  zoneName: string
}>()

const emit = defineEmits<{ exit: [] }>()

const { api } = useAuth()

const COLS = 10, ROWS = 20, BLOCK = 26

// ── 游戏常量 ────────────────────────────────────────────────
const PIECES: Record<string, { shape: number[][], color: string }> = {
  I: { shape: [[1,1,1,1]], color: 'bg-cyan-400' },
  O: { shape: [[1,1],[1,1]], color: 'bg-yellow-400' },
  T: { shape: [[0,1,0],[1,1,1]], color: 'bg-purple-400' },
  S: { shape: [[0,1,1],[1,1,0]], color: 'bg-green-400' },
  Z: { shape: [[1,1,0],[0,1,1]], color: 'bg-red-400' },
  J: { shape: [[1,0,0],[1,1,1]], color: 'bg-blue-400' },
  L: { shape: [[0,0,1],[1,1,1]], color: 'bg-orange-400' },
}

function randPiece() {
  const ks = Object.keys(PIECES)
  return ks[Math.floor(Math.random() * ks.length)]
}

function rotate(shape: number[][], n: number): number[][] {
  let s = shape.map(r => [...r])
  for (let i = 0; i < n % 4; i++) {
    const R = s.length, C = s[0].length
    s = Array.from({ length: C }, (_: any, ci: number) =>
      Array.from({ length: R }, (_2: any, ri: number) => s[R-1-ri][ci]))
  }
  return s
}

function emptyGrid(): string[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(''))
}

// ── 玩家数据 ────────────────────────────────────────────────
interface GamePlayer {
  id: number; name: string; petCode: string; templateId: string
  grid: string[][]; cur: string | null; x: number; y: number; rot: number
  score: number; lines: number; level: number; next: string | null
  gameOver: boolean; canMove: boolean; eliminated: boolean
}

function mkPlayer(id: number, pet: any): GamePlayer {
  return {
    id, name: pet?.displayName || (id === 1 ? 'P1' : 'P2'),
    petCode: pet?.code || (id === 1 ? 'P1-000' : 'P2-000'),
    templateId: pet?.templateId || (id === 1 ? 'shiba' : 'corgi'),
    grid: emptyGrid(), cur: null, x: 4, y: 0, rot: 0,
    score: 0, lines: 0, level: 1, next: null,
    gameOver: false, canMove: false, eliminated: false
  }
}

function canPlace(g: string[][], p: string, x: number, y: number, r: number): boolean {
  const s = rotate(PIECES[p].shape, r)
  for (let ri = 0; ri < s.length; ri++) {
    for (let ci = 0; ci < s[ri].length; ci++) {
      if (!s[ri][ci]) continue
      const nx = x+ci, ny = y+ri
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false
      if (ny >= 0 && g[ny][nx]) return false
    }
  }
  return true
}

function lock(p: GamePlayer, allPlayers: GamePlayer[]) {
  if (!p.cur) return
  const shape = PIECES[p.cur].shape
  for (let ri = 0; ri < shape.length; ri++) {
    for (let ci = 0; ci < shape[ri].length; ci++) {
      if (!shape[ri][ci]) continue
      const ny = p.y+ri, nx = p.x+ci
      if (ny < 0) { p.gameOver = true; p.canMove = false; return }
      p.grid[ny][nx] = PIECES[p.cur].color
    }
  }
  const full: number[] = []
  for (let r = 0; r < ROWS; r++) if (p.grid[r].every(c => c !== '')) full.push(r)
  if (full.length) {
    for (const r of full.sort((a,b) => b-a)) { p.grid.splice(r, 1); p.grid.unshift(Array(COLS).fill('')) }
    const bonus = [0, 100, 300, 500, 800]
    p.score += bonus[full.length] || 1000
    p.lines += full.length
    p.level = Math.floor(p.lines / 10) + 1
    // 消行干扰对手
    if (full.length >= 2) {
      const opp = allPlayers.find(o => o.id !== p.id)
      if (opp && !opp.gameOver) {
        for (let l = 0; l < full.length - 1; l++) {
          opp.grid.shift()
          const row = Array(COLS-1).fill('').concat([PIECES[randPiece()].color])
          row[Math.floor(Math.random() * COLS)] = PIECES[randPiece()].color
          opp.grid.push(row)
          if (opp.grid[0].some(c => c !== '')) { opp.gameOver = true; opp.eliminated = true; opp.canMove = false }
        }
      }
    }
  }
  p.cur = p.next || randPiece()
  p.next = randPiece()
  p.x = Math.floor(COLS/2) - 1; p.y = 0; p.rot = 0
  if (!canPlace(p.grid, p.cur, p.x, p.y, 0)) { p.gameOver = true; p.eliminated = true; p.canMove = false }
}

function move(p: GamePlayer, dx: number, dy: number): boolean {
  if (!p.canMove || p.gameOver) return false
  if (canPlace(p.grid, p.cur!, p.x+dx, p.y+dy, p.rot)) { p.x += dx; p.y += dy; return true }
  if (dy === 1) lock(p, players)
  return false
}

function spin(p: GamePlayer): boolean {
  if (!p.canMove || p.gameOver) return false
  const nr = (p.rot + 1) % 4
  for (const [kx, ky] of [[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]]) {
    if (canPlace(p.grid, p.cur!, p.x+kx, p.y+ky, nr)) { p.x += kx; p.y += ky; p.rot = nr; return true }
  }
  return false
}

function drop(p: GamePlayer) {
  if (!p.canMove || p.gameOver) return
  while (move(p, 0, 1)) p.score += 2
}

const players = reactive([
  mkPlayer(1, props.p1Pet),
  mkPlayer(2, props.p2Pet),
])

// ── 游戏状态 ────────────────────────────────────────────────
const gamePhase = ref<'countdown' | 'playing' | 'ended'>('countdown')
const countdown = ref(3)
const winner = ref<number | null>(null)
const elapsed = ref(0)
const interval = ref<ReturnType<typeof setTimeout> | null>(null)
const startTime = ref(0)

const settlementState = reactive({ done: false, loading: false, error: '', pointsChange: 0, newPoints: 0 })

function fmtTime(s: number) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` }

// ── 棋盘渲染辅助 ────────────────────────────────────────────
function getCellColor(p: GamePlayer, col: number, row: number): string {
  if (p.grid[row]?.[col]) return p.grid[row][col]
  if (p.cur && p.canMove) {
    const s = rotate(PIECES[p.cur].shape, p.rot)
    for (let ri = 0; ri < s.length; ri++) {
      for (let ci = 0; ci < s[ri].length; ci++) {
        if (!s[ri][ci]) continue
        if (p.y+ri === row && p.x+ci === col) return PIECES[p.cur].color
      }
    }
    let gy = p.y
    while (canPlace(p.grid, p.cur, p.x, gy+1, p.rot)) gy++
    if (gy !== p.y) {
      for (let ri = 0; ri < s.length; ri++) {
        for (let ci = 0; ci < s[ri].length; ci++) {
          if (!s[ri][ci]) continue
          if (gy+ri === row && p.x+ci === col) return PIECES[p.cur].color + '/30'
        }
      }
    }
  }
  return ''
}

function getNextCells(p: GamePlayer) {
  if (!p.next) return []
  return rotate(PIECES[p.next].shape, 0).map(row => row.map(c => ({ color: c ? PIECES[p.next!].color : 'bg-gray-200' })))
}

const EMOJI_MAP: Record<string, string> = {
  shiba: '🐕', corgi: '🐶', golden: '🦮', bichon: '🐩',
  'orange-cat': '🐱', ragdoll: '🐱', bunny: '🐰', hamster: '🐹',
  duckling: '🦆', alpaca: '🦙', unicorn: '🦄', 'baby-dragon': '🐉',
  husky: '🐺', 'west-highland': '🐕', samoyed: '🐕',
}
function petEmoji(tid: string) { return EMOJI_MAP[tid] || '🐾' }

// ── 游戏循环 ────────────────────────────────────────────────
function gameLoop() {
  if (gamePhase.value !== 'playing') return
  elapsed.value = Math.floor((Date.now() - startTime.value) / 1000)
  for (const p of players) {
    if (p.canMove && !p.gameOver) {
      if (!move(p, 0, 1)) lock(p, players)
    }
  }
  if (players.filter(p => !p.gameOver).length <= 1) { endGame(); return }
  const speed = Math.min(...players.map(p => Math.max(80, 900-(p.level-1)*90)))
  interval.value = setTimeout(gameLoop, speed)
}

function endGame() {
  if (interval.value) { clearTimeout(interval.value); interval.value = null }
  gamePhase.value = 'ended'
  players.forEach(p => p.canMove = false)

  const alive = players.filter(p => !p.gameOver)
  let result: 'win' | 'lose' | 'draw' = 'draw'

  if (alive.length === 1) {
    winner.value = alive[0].id
    result = alive[0].id === 1 ? 'win' : 'lose'
  } else if (!alive.length) {
    const sc = players.map(p => p.score)
    winner.value = sc[0] > sc[1] ? 1 : sc[1] > sc[0] ? 2 : 0
    result = winner.value === 1 ? 'win' : winner.value === 2 ? 'lose' : 'draw'
  } else {
    const sorted = [...alive].sort((a,b) => b.score-a.score)
    winner.value = sorted[0].id
    result = sorted[0].id === 1 ? 'win' : 'lose'
  }

  const entryCost = 5, winReward = 10
  settlementState.pointsChange = result === 'win' ? winReward - entryCost : -entryCost
  settlementState.loading = true

  async function submitResult(attempt = 1) {
    try {
      const res = await api.post('/arena/result', {
        zoneId: 1,
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

// ── 键盘 / 手柄 ────────────────────────────────────────────
let lastBtns: Record<string, boolean> = {}

function press(btn: string, pid: number) {
  if (lastBtns[btn+pid]) return
  lastBtns[btn+pid] = true
  const p = players[pid]
  if (btn === 'left') move(p, -1, 0)
  else if (btn === 'right') move(p, 1, 0)
  else if (btn === 'down') move(p, 0, 1)
  else if (btn === 'up' || btn === 'rot') spin(p)
  else if (btn === 'drop') drop(p)
  setTimeout(() => { lastBtns[btn+pid] = false }, 150)
}

function onKey(e: KeyboardEvent) {
  if (gamePhase.value === 'playing') {
    if (e.key === 'ArrowLeft') { e.preventDefault(); press('left', 0) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); press('right', 0) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); press('down', 0) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); press('up', 0) }
    else if (e.key === 'z' || e.key === 'Z') press('rot', 0)
    else if (e.key === ' ') { e.preventDefault(); press('drop', 0) }
    else if (e.key === 'a' || e.key === 'A') press('left', 1)
    else if (e.key === 'd' || e.key === 'D') press('right', 1)
    else if (e.key === 's' || e.key === 'S') press('down', 1)
    else if (e.key === 'w' || e.key === 'W') press('up', 1)
    else if (e.key === 'e' || e.key === 'E') press('rot', 1)
  }
}

let gpInterval: ReturnType<typeof setInterval> | null = null

function pollGp() {
  const gps = navigator.getGamepads()
  for (const gp of gps) {
    if (!gp) continue
    const pid = gp.index > 0 ? 1 : 0
    if (gp.buttons[12]?.pressed) press('left', pid)
    if (gp.buttons[13]?.pressed) press('right', pid)
    if (gp.buttons[15]?.pressed) press('up', pid)
    if (gp.buttons[14]?.pressed) press('down', pid)
    if (gp.buttons[0]?.pressed) press('drop', pid)
    if (gp.buttons[1]?.pressed) press('rot', pid)
  }
}

function gpConn(e: GamepadEvent) { console.log('🎮 手柄连接:', e.gamepad.id) }
function gpDisc(e: GamepadEvent) { console.log('🎮 手柄断开:', e.gamepad.id) }



// ── 生命周期 ───────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('gamepadconnected', gpConn)
  window.addEventListener('gamepaddisconnected', gpDisc)
  gpInterval = setInterval(pollGp, 50)

  // 初始化方块
  players.forEach(p => {
    p.cur = randPiece()
    p.next = randPiece()
  })

  // 倒计时
  const ci = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(ci)
      gamePhase.value = 'playing'
      players.forEach(p => p.canMove = true)
      startTime.value = Date.now()
      gameLoop()
    }
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('gamepadconnected', gpConn)
  window.removeEventListener('gamepaddisconnected', gpDisc)
  if (interval.value) clearTimeout(interval.value)
  if (gpInterval) clearInterval(gpInterval)
})
</script>

<template>
  <!-- 倒计时页 -->
  <div v-if="gamePhase === 'countdown'" class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
    <div class="text-9xl font-black text-blue-400 animate-pulse">{{ countdown }}</div>
    <div class="text-2xl text-gray-300 mt-4">准备开战！</div>
    <!-- 双方信息预览 -->
    <div class="flex items-center gap-8 mt-10">
      <div class="text-center">
        <div class="text-6xl">{{ petEmoji(p1Pet?.templateId || 'shiba') }}</div>
        <div class="font-bold mt-1">{{ p1Pet?.displayName }}</div>
        <div class="text-xs text-gray-400">{{ p1Pet?.code }}</div>
      </div>
      <div class="text-4xl font-black text-gray-500">VS</div>
      <div class="text-center">
        <div class="text-6xl">{{ petEmoji(p2Pet?.templateId || 'corgi') }}</div>
        <div class="font-bold mt-1">{{ p2Pet?.displayName }}</div>
        <div class="text-xs text-gray-400">{{ p2Pet?.code }}</div>
      </div>
    </div>
  </div>

  <!-- 对战页 -->
  <div v-else-if="gamePhase === 'playing' || gamePhase === 'ended'" class="max-w-5xl mx-auto py-4 px-2 space-y-3">

    <!-- 顶栏 -->
    <div class="flex items-center justify-between px-2">
      <div class="flex items-center gap-2">
        <span class="text-lg">🎮</span>
        <span class="font-black text-gray-700 text-sm">{{ zoneName }}</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span>⏱</span>
          <span class="font-mono">{{ fmtTime(elapsed) }}</span>
        </div>
      </div>
    </div>

    <!-- 分屏对战 -->
    <div class="flex flex-col lg:flex-row gap-4 items-start justify-center">

      <!-- P1 -->
      <div class="flex flex-col items-center gap-2 flex-1">
        <div class="flex items-center gap-3 w-full justify-center">
          <span class="text-3xl">{{ petEmoji(players[0].templateId) }}</span>
          <div>
            <div class="font-bold text-gray-800 text-base">{{ players[0].name }}</div>
            <div class="text-xs text-gray-400">{{ players[0].petCode }}</div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-bold"
            :class="players[0].gameOver ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'">
            {{ players[0].gameOver ? '淘汰' : '进行中' }}
          </span>
        </div>
        <div class="text-sm text-gray-500">
          得分 <strong class="text-xl text-blue-600">{{ players[0].score }}</strong>
          · {{ players[0].lines }} 行 · Lv.{{ players[0].level }}
        </div>

        <div class="relative rounded-lg overflow-hidden bg-gray-900 border-4 border-blue-300"
          :style="{ width: COLS*BLOCK+'px', height: ROWS*BLOCK+'px' }">
          <div v-for="row in ROWS" :key="row" class="flex">
            <div v-for="col in COLS" :key="col"
              :style="{ width: BLOCK+'px', height: BLOCK+'px' }"
              class="border border-gray-800/30 transition-all duration-75"
              :class="getCellColor(players[0], col-1, row-1) || 'bg-gray-900'">
            </div>
          </div>
          <div v-if="players[0].gameOver"
            class="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-black text-2xl">
            淘汰
          </div>
        </div>

        <!-- NEXT + 控制 -->
        <div class="flex items-center gap-3 w-full justify-center">
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-gray-400">NEXT:</span>
            <div class="flex gap-px flex-wrap" style="max-width:72px">
              <template v-if="players[0].next">
                <div v-for="(row, ri) in getNextCells(players[0])" :key="ri" class="flex">
                  <div v-for="(cell, ci) in row" :key="ci"
                    :style="{ width:'12px', height:'12px' }"
                    class="border border-gray-700/30" :class="cell.color">
                  </div>
                </div>
              </template>
            </div>
          </div>
          <div class="text-xs text-gray-400">← → ↓ · Z旋转 · 空格下落</div>
        </div>
      </div>

      <!-- VS 中间 -->
      <div class="flex flex-col items-center justify-center text-center py-4 lg:py-0">
        <div class="text-4xl font-black text-gray-300">VS</div>
        <div class="text-xs text-gray-400 mt-1">消除2+行</div>
        <div class="text-sm font-bold text-red-500">给对方加干扰</div>
        <div class="text-xs text-gray-400 mt-1">P2: A D S W · E</div>
        <div v-if="gamePhase === 'playing'" class="text-xs text-gray-400 mt-2 font-mono">{{ fmtTime(elapsed) }}</div>
      </div>

      <!-- P2 -->
      <div class="flex flex-col items-center gap-2 flex-1">
        <div class="flex items-center gap-3 w-full justify-center">
          <span class="text-3xl">{{ petEmoji(players[1].templateId) }}</span>
          <div>
            <div class="font-bold text-gray-800 text-base">{{ players[1].name }}</div>
            <div class="text-xs text-gray-400">{{ players[1].petCode }}</div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-bold"
            :class="players[1].gameOver ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'">
            {{ players[1].gameOver ? '淘汰' : '进行中' }}
          </span>
        </div>
        <div class="text-sm text-gray-500">
          得分 <strong class="text-xl text-orange-600">{{ players[1].score }}</strong>
          · {{ players[1].lines }} 行 · Lv.{{ players[1].level }}
        </div>

        <div class="relative rounded-lg overflow-hidden bg-gray-900 border-4 border-orange-300"
          :style="{ width: COLS*BLOCK+'px', height: ROWS*BLOCK+'px' }">
          <div v-for="row in ROWS" :key="row" class="flex">
            <div v-for="col in COLS" :key="col"
              :style="{ width: BLOCK+'px', height: BLOCK+'px' }"
              class="border border-gray-800/30 transition-all duration-75"
              :class="getCellColor(players[1], col-1, row-1) || 'bg-gray-900'">
            </div>
          </div>
          <div v-if="players[1].gameOver"
            class="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-black text-2xl">
            淘汰
          </div>
        </div>

        <!-- NEXT + 控制 -->
        <div class="flex items-center gap-3 w-full justify-center">
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-gray-400">NEXT:</span>
            <div class="flex gap-px flex-wrap" style="max-width:72px">
              <template v-if="players[1].next">
                <div v-for="(row, ri) in getNextCells(players[1])" :key="ri" class="flex">
                  <div v-for="(cell, ci) in row" :key="ci"
                    :style="{ width:'12px', height:'12px' }"
                    class="border border-gray-700/30" :class="cell.color">
                  </div>
                </div>
              </template>
            </div>
          </div>
          <div class="text-xs text-gray-400">A D S W · E旋转 · 空格下落</div>
        </div>
      </div>
    </div>

    <!-- 结果页 -->
    <div v-if="gamePhase === 'ended'" class="text-center py-6 space-y-4">
      <div class="text-5xl">
        {{ winner === 0 ? '🤝' : winner === 1 ? petEmoji(players[0].templateId) : petEmoji(players[1].templateId) }}
      </div>
      <h2 class="text-3xl font-black text-gray-900">
        {{ winner === 0 ? '平局！' : winner === 1 ? `${players[0].name} 获胜！` : `${players[1].name} 获胜！` }}
      </h2>
      <div class="flex justify-center gap-10 text-lg">
        <div>
          <div class="font-bold">{{ petEmoji(players[0].templateId) }} {{ players[0].name }}</div>
          <div class="text-2xl font-black text-blue-600">{{ players[0].score }} 分 · {{ players[0].lines }} 行</div>
        </div>
        <div>
          <div class="font-bold">{{ petEmoji(players[1].templateId) }} {{ players[1].name }}</div>
          <div class="text-2xl font-black text-orange-600">{{ players[1].score }} 分 · {{ players[1].lines }} 行</div>
        </div>
      </div>

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
  </div>
</template>
