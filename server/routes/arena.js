import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const ENTRY_COST = 5
const WIN_REWARD = 10
const ZONE_NAMES = ['', '方块战场', '竞速赛道', '问答星球', '迷宫探险', '射击靶场', '跳绳大赛', '记忆翻牌', '拔河对决', '猜拳竞技', '王者挑战']

// ── 公开接口（无需登录） ──────────────────────────────────────

// 通过邀请码查询房间基本信息（用于扫码入场页）
// GET /api/arena/public/match/:inviteCode
router.get('/public/match/:inviteCode', (req, res) => {
  const match = db.prepare(`
    SELECT id, invite_code, zone_id, p1_pet_id, p1_pet_name, p1_pet_template, p1_pet_level, p1_pet_code,
           p1_ready, p2_ready, p1_paid, status, created_at
    FROM arena_matches
    WHERE invite_code = ? AND status IN ('waiting', 'ready', 'playing')
    ORDER BY created_at DESC LIMIT 1
  `).get(req.params.inviteCode)

  if (!match) return res.status(404).json({ error: '房间不存在或已过期' })

  res.json({
    inviteCode: match.invite_code,
    zoneId: match.zone_id,
    zoneName: ZONE_NAMES[match.zone_id] || `Zone ${match.zone_id}`,
    status: match.status,
    p1: {
      id: match.p1_pet_id,
      displayName: match.p1_pet_name,
      templateId: match.p1_pet_template,
      level: match.p1_pet_level,
      code: match.p1_pet_code
    },
    hasOpponent: !!match.p1_ready
  })
})

// ── 联机匹配 ────────────────────────────────────────────────

// 创建一个对战房间（由 P1 调用，入场扣分）
// POST /api/arena/match/create { zoneId, petInstanceId }
// 返回 { matchId, inviteCode }
router.post('/match/create', authMiddleware, (req, res) => {
  const { zoneId, petInstanceId } = req.body
  if (!zoneId || !petInstanceId) return res.status(400).json({ error: '缺少参数' })
  if (zoneId < 1 || zoneId > 10) return res.status(400).json({ error: '无效区域' })

  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.userId)
  const points = user?.points ?? 100
  if (points < ENTRY_COST) return res.status(400).json({ error: `积分不足，需要 ${ENTRY_COST} 积分，当前 ${points} 积分` })

  const pet = db.prepare('SELECT * FROM pet_instances WHERE id = ? AND user_id = ?').get(petInstanceId, req.userId)
  if (!pet) return res.status(404).json({ error: '未找到宠物实例' })
  if (pet.status !== 'alive') return res.status(400).json({ error: '宠物状态异常，无法参赛' })

  // 扣分
  const newPoints = points - ENTRY_COST
  db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newPoints, req.userId)

  // 生成 6 位邀请码（纯数字，方便扫码）
  const inviteCode = String(Math.floor(100000 + Math.random() * 900000))
  const matchId = uuidv4()

  // 写入 matches 表（p2 尚未加入，p2 为空）
  const now = Date.now()
  db.prepare(`
    INSERT INTO arena_matches (id, zone_id, invite_code, p1_user_id, p1_pet_id, p1_pet_name, p1_pet_template, p1_pet_level, p1_pet_code, p2_user_id, p2_pet_id, p2_pet_name, p2_pet_template, p2_pet_level, p2_pet_code, p1_ready, p2_ready, p1_paid, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, 'waiting', ?, ?)
  `).run(matchId, zoneId, inviteCode, req.userId, petInstanceId, pet.display_name, pet.template_id, pet.level || 1, pet.code, now, now)

  res.json({
    matchId,
    inviteCode,
    zoneName: ZONE_NAMES[zoneId] || `Zone ${zoneId}`,
    entryCost: ENTRY_COST,
    winReward: WIN_REWARD,
    newPoints,
    pet: {
      id: pet.id,
      displayName: pet.display_name,
      templateId: pet.template_id,
      level: pet.level || 1,
      code: pet.code
    }
  })
})

// P2 加入房间（扫码 / 输邀请码）
// POST /api/arena/match/join { inviteCode, petInstanceId }
// 返回 { matchId, p1Pet, p2Pet, zoneName, p1Ready }
router.post('/match/join', authMiddleware, (req, res) => {
  const { inviteCode, petInstanceId } = req.body
  if (!inviteCode || !petInstanceId) return res.status(400).json({ error: '缺少参数' })

  // 找房间（邀请码匹配 + 状态为 waiting）
  const match = db.prepare(`SELECT * FROM arena_matches WHERE invite_code = ? AND status = 'waiting'`).get(inviteCode)
  if (!match) return res.status(404).json({ error: '房间不存在或已开始' })

  // 不能加入自己的房间
  if (match.p1_user_id === req.userId) return res.status(400).json({ error: '不能加入自己的房间' })

  // P2 扣分
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.userId)
  const points = user?.points ?? 100
  if (points < ENTRY_COST) return res.status(400).json({ error: `积分不足，需要 ${ENTRY_COST} 积分，当前 ${points} 积分` })

  const pet = db.prepare('SELECT * FROM pet_instances WHERE id = ? AND user_id = ?').get(petInstanceId, req.userId)
  if (!pet) return res.status(404).json({ error: '未找到宠物实例' })
  if (pet.status !== 'alive') return res.status(400).json({ error: '宠物状态异常，无法参赛' })

  const newPoints = points - ENTRY_COST
  db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newPoints, req.userId)

  // 写入 P2 信息
  db.prepare(`
    UPDATE arena_matches
    SET p2_user_id = ?, p2_pet_id = ?, p2_pet_name = ?, p2_pet_template = ?, p2_pet_level = ?, p2_pet_code = ?,
        p2_paid = 1, status = 'ready', updated_at = ?
    WHERE id = ?
  `).run(req.userId, petInstanceId, pet.display_name, pet.template_id, pet.level || 1, pet.code, Date.now(), match.id)

  // 更新 p1 的 points（首次创建时已扣，P2 加入时刷新 p1 显示用）
  // 返回完整房间信息
  res.json({
    matchId: match.id,
    zoneName: ZONE_NAMES[match.zone_id] || `Zone ${match.zone_id}`,
    entryCost: ENTRY_COST,
    winReward: WIN_REWARD,
    newPoints,
    p1: {
      id: match.p1_pet_id,
      displayName: match.p1_pet_name,
      templateId: match.p1_pet_template,
      level: match.p1_pet_level,
      code: match.p1_pet_code
    },
    p2: {
      id: pet.id,
      displayName: pet.display_name,
      templateId: pet.template_id,
      level: pet.level || 1,
      code: pet.code
    }
  })
})

// 获取房间状态（轮询接口，用于 P1/P2 双方确认）
// GET /api/arena/match/:matchId
router.get('/match/:matchId', authMiddleware, (req, res) => {
  const match = db.prepare('SELECT * FROM arena_matches WHERE id = ?').get(req.params.matchId)
  if (!match) return res.status(404).json({ error: '房间不存在' })

  const isP1 = match.p1_user_id === req.userId
  const isP2 = match.p2_user_id === req.userId

  res.json({
    matchId: match.id,
    inviteCode: match.invite_code,
    zoneId: match.zone_id,
    zoneName: ZONE_NAMES[match.zone_id] || `Zone ${match.zone_id}`,
    status: match.status,
    p1Ready: !!match.p1_ready,
    p2Ready: !!match.p2_ready,
    bothReady: !!match.p1_ready && !!match.p2_ready,
    isP1,
    isP2,
    hasOpponent: !!match.p2_user_id,
    p1: {
      id: match.p1_pet_id,
      displayName: match.p1_pet_name,
      templateId: match.p1_pet_template,
      level: match.p1_pet_level,
      code: match.p1_pet_code
    },
    p2: match.p2_pet_id ? {
      id: match.p2_pet_id,
      displayName: match.p2_pet_name,
      templateId: match.p2_pet_template,
      level: match.p2_pet_level,
      code: match.p2_pet_code
    } : null
  })
})

// 玩家点"准备好了"
// POST /api/arena/match/ready { matchId }
router.post('/match/ready', authMiddleware, (req, res) => {
  const { matchId } = req.body
  if (!matchId) return res.status(400).json({ error: '缺少参数' })

  const match = db.prepare('SELECT * FROM arena_matches WHERE id = ?').get(matchId)
  if (!match) return res.status(404).json({ error: '房间不存在' })
  if (match.status === 'playing' || match.status === 'ended') return res.status(400).json({ error: '比赛已开始或结束' })

  const isP1 = match.p1_user_id === req.userId
  const isP2 = match.p2_user_id === req.userId
  if (!isP1 && !isP2) return res.status(403).json({ error: '不是房间成员' })

  if (isP1) db.prepare('UPDATE arena_matches SET p1_ready = 1, updated_at = ? WHERE id = ?').run(Date.now(), matchId)
  if (isP2) db.prepare('UPDATE arena_matches SET p2_ready = 1, updated_at = ? WHERE id = ?').run(Date.now(), matchId)

  const updated = db.prepare('SELECT p1_ready, p2_ready, status FROM arena_matches WHERE id = ?').get(matchId)

  // 双方都 ready → 开始游戏
  if (updated.p1_ready && updated.p2_ready && updated.status === 'ready') {
    db.prepare('UPDATE arena_matches SET status = ?, updated_at = ? WHERE id = ?').run('playing', Date.now(), matchId)
  }

  res.json({
    ok: true,
    p1Ready: !!updated.p1_ready,
    p2Ready: !!updated.p2_ready,
    bothReady: !!updated.p1_ready && !!updated.p2_ready,
    canStart: !!updated.p1_ready && !!updated.p2_ready && updated.status === 'playing'
  })
})

// 取消准备（重新变为未 ready）
// POST /api/arena/match/unready { matchId }
router.post('/match/unready', authMiddleware, (req, res) => {
  const { matchId } = req.body
  const match = db.prepare('SELECT * FROM arena_matches WHERE id = ?').get(matchId)
  if (!match) return res.status(404).json({ error: '房间不存在' })

  const isP1 = match.p1_user_id === req.userId
  const isP2 = match.p2_user_id === req.userId
  if (!isP1 && !isP2) return res.status(403).json({ error: '不是房间成员' })

  if (isP1) db.prepare('UPDATE arena_matches SET p1_ready = 0, updated_at = ? WHERE id = ?').run(Date.now(), matchId)
  if (isP2) db.prepare('UPDATE arena_matches SET p2_ready = 0, updated_at = ? WHERE id = ?').run(Date.now(), matchId)

  res.json({ ok: true })
})

// 退出房间（解散 or 离开）
// POST /api/arena/match/leave { matchId }
router.post('/match/leave', authMiddleware, (req, res) => {
  const { matchId } = req.body
  const match = db.prepare('SELECT * FROM arena_matches WHERE id = ?').get(matchId)
  if (!match) return res.status(404).json({ error: '房间不存在' })

  const isP1 = match.p1_user_id === req.userId
  const isP2 = match.p2_user_id === req.userId
  if (!isP1 && !isP2) return res.status(403).json({ error: '不是房间成员' })

  // 如果 P1 离开，解散房间（退款）
  if (isP1) {
    // 退款
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(ENTRY_COST, match.p1_user_id)
    // P2 也退款（如果已扣分）
    if (match.p2_user_id) db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(ENTRY_COST, match.p2_user_id)
    db.prepare('DELETE FROM arena_matches WHERE id = ?').run(matchId)
  } else if (isP2) {
    // P2 离开：清空 P2 数据，房间回到 waiting
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(ENTRY_COST, match.p2_user_id)
    db.prepare(`
      UPDATE arena_matches
      SET p2_user_id = NULL, p2_pet_id = NULL, p2_pet_name = NULL, p2_pet_template = NULL,
          p2_pet_level = NULL, p2_pet_code = NULL, p2_paid = 0, p2_ready = 0, status = 'waiting', updated_at = ?
      WHERE id = ?
    `).run(Date.now(), matchId)
  }

  res.json({ ok: true })
})

// ── 原有接口（精简注释，保留全部原有逻辑） ──────────────────────

// 获取当前用户积分
router.get('/points', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.userId)
  res.json({ points: user?.points ?? 100 })
})

// 获取当前用户可参赛的宠物列表
router.get('/my-pets', authMiddleware, (req, res) => {
  const pets = db.prepare(`
    SELECT id, display_name, template_id, level, status, code
    FROM pet_instances
    WHERE user_id = ? AND status = 'alive'
    ORDER BY level DESC, created_at DESC
  `).all(req.userId)
  res.json({ items: pets })
})

// 获取一个随机真实宠物作为对手（排除当前用户的宠物）
router.get('/opponent-pet', authMiddleware, (req, res) => {
  const opponent = db.prepare(`
    SELECT id, display_name, template_id, level, code, user_id
    FROM pet_instances
    WHERE user_id != ? AND status = 'alive'
    ORDER BY RANDOM()
    LIMIT 1
  `).get(req.userId)

  // 如果没有其他真实宠物，返回一个假想宠物（保证至少有对手）
  if (!opponent) {
    const templates = ['corgi', 'shiba', 'golden', 'bunny', 'hamster', 'husky', 'alpaca', 'baby-dragon']
    const templateId = templates[Math.floor(Math.random() * templates.length)]
    const names = ['豆豆', '旺财', '小白', '球球', '棉花糖', '小狼', '毛球', '小火龙']
    const name = names[Math.floor(Math.random() * names.length)]
    return res.json({
      id: `npc-${templateId}-${Date.now()}`,
      display_name: name,
      template_id: templateId,
      level: Math.floor(Math.random() * 8) + 1,
      code: `AI-${templateId.toUpperCase().slice(0, 2)}`,
      is_npc: true
    })
  }

  res.json({ ...opponent, is_npc: false })
})

// 参赛资格检查 + 入场扣积分
// POST /api/arena/ready { zoneId, petInstanceId }
// 返回 { ok, points, pet } 或 { error }
router.post('/ready', authMiddleware, (req, res) => {
  const { zoneId, petInstanceId } = req.body
  if (!zoneId || !petInstanceId) return res.status(400).json({ error: '缺少参数' })
  if (zoneId < 1 || zoneId > 10) return res.status(400).json({ error: '无效区域' })

  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.userId)
  const points = user?.points ?? 100
  if (points < ENTRY_COST) return res.status(400).json({ error: `积分不足，需要 ${ENTRY_COST} 积分，当前 ${points} 积分` })

  const pet = db.prepare('SELECT * FROM pet_instances WHERE id = ? AND user_id = ?').get(petInstanceId, req.userId)
  if (!pet) return res.status(404).json({ error: '未找到宠物实例' })
  if (pet.status !== 'alive') return res.status(400).json({ error: '宠物状态异常，无法参赛' })

  // 入场时真正扣积分
  const newPoints = points - ENTRY_COST
  db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newPoints, req.userId)

  res.json({
    ok: true,
    points: newPoints,
    pet: { id: pet.id, displayName: pet.display_name, templateId: pet.template_id, level: pet.level, code: pet.code },
    zoneName: ZONE_NAMES[zoneId] || `Zone ${zoneId}`,
    entryCost: ENTRY_COST,
    winReward: WIN_REWARD
  })
})

// 结算比赛结果（入场时已扣5分，这里只处理胜者加10）
// POST /api/arena/result { zoneId, petInstanceId, result }
// result: 'win' | 'lose' | 'draw'
router.post('/result', authMiddleware, (req, res) => {
  const { zoneId, petInstanceId, result } = req.body
  if (!zoneId || !petInstanceId || !result) return res.status(400).json({ error: '缺少参数' })
  if (!['win', 'lose', 'draw'].includes(result)) return res.status(400).json({ error: '无效结果' })

  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.userId)
  const points = user?.points ?? 100

  // 入场已扣 ENTRY_COST；胜者额外奖 WIN_REWARD
  let pointsChange = 0
  let newPoints = points

  if (result === 'win') {
    pointsChange = WIN_REWARD
    newPoints = points + WIN_REWARD
    db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newPoints, req.userId)
  }
  // lose/draw：入场已扣，不再额外处理

  // 写入竞技场记录
  db.prepare(`
    INSERT INTO arena_records (id, user_id, pet_instance_id, zone_id, result, points_change, played_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), req.userId, petInstanceId, zoneId, result, pointsChange - ENTRY_COST, Date.now())

  res.json({
    ok: true,
    result,
    pointsChange: pointsChange - ENTRY_COST,
    newPoints,
    breakdown: {
      entryCost: -ENTRY_COST,
      winReward: result === 'win' ? WIN_REWARD : 0
    }
  })
})

// 获取竞技场历史记录
router.get('/records', authMiddleware, (req, res) => {
  const records = db.prepare(`
    SELECT ar.*, pi.display_name as pet_name, pi.template_id
    FROM arena_records ar
    JOIN pet_instances pi ON pi.id = ar.pet_instance_id
    WHERE ar.user_id = ?
    ORDER BY ar.played_at DESC
    LIMIT 50
  `).all(req.userId)
  res.json({ items: records })
})

// 获取总排行榜（按累计积分）
router.get('/leaderboard', authMiddleware, (req, res) => {
  // 统计每个用户的胜场数、总场次、总积分变化
  const stats = db.prepare(`
    SELECT
      u.id,
      u.username,
      SUM(CASE WHEN ar.result = 'win' THEN 1 ELSE 0 END) as wins,
      COUNT(*) as total,
      SUM(ar.points_change) as total_points_change,
      pi.display_name as best_pet,
      pi.template_id as best_pet_template
    FROM arena_records ar
    JOIN users u ON u.id = ar.user_id
    LEFT JOIN pet_instances pi ON pi.id = ar.pet_instance_id
    GROUP BY u.id
    ORDER BY wins DESC, total ASC
    LIMIT 50
  `).all()

  res.json({ items: stats })
})

export default router
